import { useState, useRef, useEffect } from 'react';
import CodeEditor from './CodeEditor.jsx';
import { practiceStorageKey } from '../utils/practiceKey.js';

// PracticeBlock — the in-lesson Python sandbox.
//
// Runs real Python in the browser via Pyodide, loaded lazily from the public
// jsDelivr CDN on the first Run click. Pyodide is ~10 MB on disk, so we never
// fetch it at page mount: the user must explicitly click Run.
//
// After the first load, the interpreter sits in memory at module scope and
// subsequent runs reuse it (< 100ms typical). If the CDN is unreachable
// (offline, corp network, etc.) we fall back to the legacy literal-assignment
// verifier so the cell still gives feedback for the common
// "make x equal 100"-style exercises.
//
// Props:
//   prompt   string  — the user-facing task ("Make x equal 100")
//   starter  string  — pre-fill for the editor (the "# TODO" stub)
//   expected string  — value to compare against (e.g. "100"); optional
//   varName  string  — variable to inspect after running (default 'x')
//   hints    array   — [{ label, body }]; rendered as collapsible accordions

const PYODIDE_VERSION = '0.27.0';
const PYODIDE_BASE = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;
const PYODIDE_SCRIPT = `${PYODIDE_BASE}pyodide.js`;

// Module-level cache so every PracticeBlock on the page shares one interpreter.
let _pyodidePromise = null;

// Exported so other in-lesson blocks (e.g. code-run) can reuse the same
// Pyodide instance without re-downloading. Keep the function declaration name
// stable — internal call sites still reference `loadPyodide` directly.
export function loadPyodide() {
  if (_pyodidePromise) return _pyodidePromise;
  _pyodidePromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Pyodide requires a browser environment.'));
      return;
    }
    const boot = () => {
      if (!window.loadPyodide) {
        reject(new Error('Pyodide loader missing after script load.'));
        return;
      }
      window
        .loadPyodide({ indexURL: PYODIDE_BASE })
        .then(resolve, reject);
    };
    if (window.loadPyodide) {
      boot();
      return;
    }
    // Reuse an in-flight script tag if one is already present.
    const existing = document.querySelector(
      `script[src="${PYODIDE_SCRIPT}"]`,
    );
    if (existing) {
      existing.addEventListener('load', boot);
      existing.addEventListener('error', () =>
        reject(new Error('Failed to load Pyodide script.')),
      );
      return;
    }
    const s = document.createElement('script');
    s.src = PYODIDE_SCRIPT;
    s.async = true;
    s.onload = boot;
    s.onerror = () => reject(new Error('Failed to load Pyodide script.'));
    document.head.appendChild(s);
  }).catch((err) => {
    // Clear the cache so a later retry can try again (e.g. user comes back
    // online). Re-throw so the current call still sees the failure.
    _pyodidePromise = null;
    throw err;
  });
  return _pyodidePromise;
}

// Legacy offline verifier — used when Pyodide fails to load.
function verifyOffline(source, expected) {
  if (!source || !source.trim()) {
    return { kind: 'empty' };
  }
  if (expected == null || expected === '') {
    return { kind: 'unknown' };
  }
  const target = String(expected).trim();
  const stripped = source
    .split('\n')
    .map((line) => {
      const hash = line.indexOf('#');
      return hash >= 0 ? line.slice(0, hash) : line;
    })
    .join('\n');
  const literalAssign = new RegExp(
    `(^|\\n)\\s*[A-Za-z_][A-Za-z0-9_]*\\s*=\\s*${escapeRegExp(target)}\\s*(\\n|$)`,
  );
  if (literalAssign.test(stripped)) {
    return { kind: 'ok', offline: true };
  }
  const lines = stripped.split('\n');
  for (const raw of lines) {
    const line = raw.trim();
    const eq = line.indexOf('=');
    if (eq <= 0) continue;
    if (line[eq + 1] === '=') continue;
    const rhs = line.slice(eq + 1).trim();
    if (rhs === target) return { kind: 'ok', offline: true };
  }
  return { kind: 'unverified', offline: true };
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Normalise expected/actual values for comparison. We treat the captured
// Python value as authoritative; the prop is a string in JSON content so we
// try to coerce numerics where it makes sense.
function valuesMatch(actual, expected) {
  if (expected == null || expected === '') return true;
  if (actual === undefined || actual === null) return false;
  const expectedStr = String(expected).trim();
  const actualStr = String(actual).trim();
  if (actualStr === expectedStr) return true;
  // Numeric coercion: "100" vs 100 vs 100.0
  const en = Number(expectedStr);
  const an = Number(actualStr);
  if (!Number.isNaN(en) && !Number.isNaN(an) && en === an) return true;
  return false;
}

// Run the user's code inside Pyodide. Returns a {value, stdout} pair or
// throws with a tidy traceback string on Python errors.
// Exported so the inline code-run block can share the same execution path.
export async function runUserCode(pyodide, source, varName) {
  // The wrapper runs in pyodide.globals so we can read results back out the
  // same way. The user's code runs inside a fresh dict `_pb_ns` so its
  // variables don't leak between runs (a previous successful run mustn't make
  // a later wrong answer look right).
  pyodide.globals.set('__pb_source', source);
  let stdoutProxy = null;
  let nsProxy = null;
  try {
    await pyodide.runPythonAsync(`
import io, sys, traceback
_pb_stdout = io.StringIO()
_pb_ns = {}
_pb_err = None
_pb_old = sys.stdout
sys.stdout = _pb_stdout
try:
    exec(compile(__pb_source, '<practice>', 'exec'), _pb_ns)
except Exception:
    _pb_err = traceback.format_exc()
finally:
    sys.stdout = _pb_old
`);
    stdoutProxy = pyodide.globals.get('_pb_stdout');
    nsProxy = pyodide.globals.get('_pb_ns');
    const stdout = stdoutProxy ? stdoutProxy.getvalue() : '';
    const err = pyodide.globals.get('_pb_err');
    if (err) {
      const trace = String(err);
      // Best-effort cleanup of the wrapper frame from the traceback.
      const cleaned = trace
        .split('\n')
        .filter((line) => !line.includes('in <module>\n    exec(compile'))
        .join('\n');
      throw new Error(cleaned);
    }
    let value;
    try {
      const py = nsProxy ? nsProxy.get(varName) : undefined;
      if (py === undefined) {
        value = undefined;
      } else if (py && typeof py.toJs === 'function') {
        value = py.toJs();
        if (typeof py.destroy === 'function') py.destroy();
      } else {
        value = py;
      }
    } catch (e) {
      value = undefined;
    }
    return { value, stdout };
  } finally {
    // Free PyProxies and clear wrapper vars so the next run starts clean.
    if (stdoutProxy && typeof stdoutProxy.destroy === 'function') stdoutProxy.destroy();
    if (nsProxy && typeof nsProxy.destroy === 'function') nsProxy.destroy();
    try {
      await pyodide.runPythonAsync(
        "for _k in ('__pb_source','_pb_stdout','_pb_ns','_pb_err','_pb_old'):\n"
        + "    globals().pop(_k, None)\n"
      );
    } catch (_) { /* best effort */ }
  }
}

// Storage-key derivation lives in src/utils/practiceKey.js so the inline
// editor, LintEditor, and Lesson's sandbox hand-off all hit the same bucket.

export default function PracticeBlock({
  prompt,
  starter,
  expected,
  varName,
  hints,
  // Persistence — opt-in. Pass an explicit `persistKey` (e.g. the sandbox
  // gives `sandbox-python`) and we read/write it on every change. If only
  // `lessonId` is passed, we synthesise `practice-{lessonId}-{hash}` so
  // each inline practice block keeps its own scratch. Pass nothing to
  // disable persistence entirely (test environments etc.).
  persistKey,
  lessonId,
  lang,
}) {
  const initial = starter || '';
  const targetVar = varName || 'x';
  const storageKey = persistKey || practiceStorageKey(lessonId, initial);

  // Hydrate from localStorage on first render so the user picks up exactly
  // where they left off. Wrapped in try/catch — Safari private mode etc.
  const [source, setSource] = useState(() => {
    if (typeof window === 'undefined') return initial;
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved != null) return saved;
    } catch (_) { /* ignore */ }
    return initial;
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Debounced localStorage write — 400ms keeps the disk-pressure low while
  // still feeling instant for the user. We never delete the key on unmount;
  // the explicit Reset-to-example button is the only way to clear it.
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const t = setTimeout(() => {
      try {
        if (source === initial) {
          // No edits → don't pollute localStorage with the placeholder.
          window.localStorage.removeItem(storageKey);
        } else {
          window.localStorage.setItem(storageKey, source);
        }
      } catch (_) { /* ignore quota / private-mode errors */ }
    }, 400);
    return () => clearTimeout(t);
  }, [source, storageKey, initial]);
  // Track whether the CDN has ever been confirmed reachable. If we've
  // already loaded once, we no longer need the scary "10MB" loading copy.
  const everLoadedRef = useRef(false);

  const onRun = async () => {
    if (loading) return;
    if (!source || !source.trim()) {
      setResult({ kind: 'empty' });
      return;
    }
    setLoading(true);
    setResult({ kind: 'running' });
    try {
      const pyodide = await loadPyodide();
      everLoadedRef.current = true;
      let runOutput;
      try {
        runOutput = await runUserCode(pyodide, source, targetVar);
      } catch (pyErr) {
        setResult({
          kind: 'pyerror',
          message: pyErr && pyErr.message ? pyErr.message : String(pyErr),
        });
        return;
      }
      const { value, stdout } = runOutput;
      if (expected == null || expected === '') {
        // Nothing to grade — just echo stdout / the captured value.
        setResult({
          kind: 'unknown',
          stdout,
          value,
          varName: targetVar,
        });
        return;
      }
      if (valuesMatch(value, expected)) {
        setResult({ kind: 'ok', stdout, value, varName: targetVar });
      } else {
        setResult({
          kind: 'mismatch',
          stdout,
          value,
          expected,
          varName: targetVar,
        });
      }
    } catch (loadErr) {
      // CDN unreachable or script blocked — fall back to the legacy
      // literal verifier so the user still gets something actionable.
      const fallback = verifyOffline(source, expected);
      setResult({ ...fallback, offline: true });
    } finally {
      setLoading(false);
    }
  };

  const onReset = () => {
    if (loading) return;
    setSource(initial);
    setResult(null);
    if (typeof window !== 'undefined') {
      try { window.localStorage.removeItem(storageKey); } catch (_) { /* ignore */ }
    }
  };

  const showInitialLoadCopy = loading && !everLoadedRef.current;
  const runLabel = loading
    ? showInitialLoadCopy
      ? 'Loading Python (one-time, ~10MB)…'
      : 'Running…'
    : 'Run';

  // Map result kind to the existing CSS class for consistent theming.
  const outputClass = (() => {
    if (!result) return '';
    switch (result.kind) {
      case 'ok':
        return 'practice-block-output practice-block-output-ok';
      case 'empty':
        return 'practice-block-output practice-block-output-empty';
      case 'pyerror':
      case 'mismatch':
        return 'practice-block-output practice-block-output-empty';
      case 'running':
        return 'practice-block-output practice-block-output-unknown';
      case 'unverified':
      case 'unknown':
      default:
        return 'practice-block-output practice-block-output-unknown';
    }
  })();

  return (
    <div className="practice-block">
      <div className="practice-block-kicker">▶ PRACTICE</div>

      {prompt && <div className="practice-block-prompt">{prompt}</div>}

      <div className="practice-block-editor-host">
        <CodeEditor
          value={source}
          onChange={setSource}
          lang={lang || 'python'}
          ariaLabel="Code editor"
          readOnly={loading}
          minHeight={140}
        />
      </div>

      <div className="practice-block-actions">
        <button
          type="button"
          className="btn btn-primary"
          onClick={onRun}
          disabled={loading}
        >
          {runLabel}
        </button>
        <button
          type="button"
          className="btn"
          onClick={onReset}
          disabled={loading}
        >
          Reset
        </button>
      </div>

      {result && (
        <div
          className={outputClass}
          role="status"
          aria-live="polite"
        >
          {result.kind === 'running' && (
            <span>
              {showInitialLoadCopy
                ? 'Loading Python… first run downloads the interpreter (~10MB), then it stays cached.'
                : 'Running…'}
            </span>
          )}

          {result.kind === 'ok' && (
            <span>
              ✓ Looks right.
              {result.value !== undefined && (
                <>
                  {' '}
                  <code>
                    {result.varName} == {String(result.value)}
                  </code>
                </>
              )}
              {result.offline && ' (offline check — Python unavailable)'}
            </span>
          )}

          {result.kind === 'mismatch' && (
            <span>
              ✗ Got{' '}
              <code>
                {result.varName} ={' '}
                {result.value === undefined
                  ? '<undefined>'
                  : String(result.value)}
              </code>
              , expected <code>{String(result.expected)}</code>.
            </span>
          )}

          {result.kind === 'pyerror' && (
            <>
              <div>✗ Python error:</div>
              <pre
                style={{
                  margin: '6px 0 0',
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                }}
              >
                {result.message}
              </pre>
            </>
          )}

          {result.kind === 'empty' && (
            <span>The editor is empty — type something and hit Run.</span>
          )}

          {result.kind === 'unknown' && (
            <span>
              {result.stdout
                ? `Saved. Output: ${result.stdout.trim()}`
                : 'Saved. No expected value set for this cell.'}
            </span>
          )}

          {result.kind === 'unverified' && (
            <span>
              Offline mode — couldn't load Python. Couldn't verify from the
              source alone; expected something equal to{' '}
              <code>{String(expected)}</code>. Paste this into a real Python
              REPL to check.
            </span>
          )}

          {/* Show stdout under a successful or mismatched run if there was any. */}
          {(result.kind === 'ok' || result.kind === 'mismatch') &&
            result.stdout &&
            result.stdout.trim() && (
              <pre
                style={{
                  margin: '8px 0 0',
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  opacity: 0.85,
                }}
              >
                {result.stdout}
              </pre>
            )}
        </div>
      )}

      {Array.isArray(hints) && hints.length > 0 && (
        <div className="practice-block-hints">
          {hints.map((h, i) => (
            <details key={i} className="practice-block-hint">
              <summary>{h.label}</summary>
              <div className="practice-block-hint-body">{h.body}</div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
