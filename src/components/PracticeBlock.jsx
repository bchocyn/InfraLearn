import { useState, useRef, useEffect } from 'react';
import CodeEditor from './CodeEditor.jsx';
import { practiceStorageKey } from '../utils/practiceKey.js';

// PracticeBlock — the in-lesson Python sandbox.
//
// Runs real Python in the browser via Pyodide, loaded lazily from the public
// jsDelivr CDN on the first Run click. Pyodide is ~10 MB on disk, so we never
// fetch it at page mount: the user must explicitly click Run.
//
// Execution strategy (in order of preference):
//
//   1. A dedicated Web Worker built from a Blob URL. The worker importScripts
//      Pyodide from the CDN, loads the interpreter ONCE, and runs each
//      submission in a fresh namespace. Because the user's code runs off the
//      main thread, a runaway `while True:` can't freeze the tab — a stuck
//      run is killed after RUN_TIMEOUT_MS and the worker is respawned.
//   2. If the Worker can't be constructed (CSP without `worker-src blob:`,
//      very old browser) or its boot fails, we fall back to the legacy
//      main-thread script-tag path.
//   3. If the CDN itself is unreachable (offline, corp network, etc.) we fall
//      back to the literal-assignment verifier so the cell still gives
//      feedback for the common "make x equal 100"-style exercises.
//
// ALL Python runs — worker or main-thread, including the code-run blocks in
// Lesson.jsx that import runUserCode — are serialized through one
// module-level promise queue, so two blocks running at once can never race
// on shared interpreter globals.
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

// How long a single run may take before we assume an infinite loop, kill the
// worker, and respawn a fresh one.
const RUN_TIMEOUT_MS = 15000;

// ─── Shared run queue ─────────────────────────────────────────────────────
// Every execution path appends here, so runs from different blocks (and from
// Lesson.jsx's code-run cells) are strictly serialized. This is what fixes
// the old race where two concurrent runs trampled each other's staging
// globals (__pb_source etc.) in the shared interpreter.
let _runQueue = Promise.resolve();
function enqueueRun(task) {
  const run = _runQueue.then(task);
  // Keep the chain alive whether the run succeeded or failed.
  _runQueue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

// ─── Traceback cleanup ────────────────────────────────────────────────────
// Strip our internal wrapper frame from Python tracebacks. The frame spans
// TWO physical lines —
//     File "<exec>", line N, in <module>        (or `in _pb_worker_run`)
//       exec(compile(source, '<practice>', 'exec'), ns)
// — so we match them separately: drop any `File "<exec>"` frame header, and
// also drop the following echoed source line when it shows the exec(compile
// wrapper. User frames are reported as `File "<practice>"` and are kept.
function cleanTraceback(trace) {
  const lines = String(trace).split('\n');
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^\s*File "<exec>", line \d+, in (<module>|_pb_worker_run)\s*$/.test(line)) {
      const next = i + 1 < lines.length ? lines[i + 1] : '';
      if (next.includes('exec(compile')) i += 1;
      continue;
    }
    out.push(line);
  }
  return out.join('\n');
}

// Tag an error as "the interpreter ran, the user's code failed" — as opposed
// to "we couldn't load/run Python at all", which triggers the offline
// fallback messaging instead.
function asPythonError(err) {
  const e = err instanceof Error ? err : new Error(String(err));
  e.pythonError = true;
  return e;
}

// ─── Worker runner (preferred path) ──────────────────────────────────────
// The Python-side runner is defined once at worker boot. Each submission
// executes in a fresh dict so variables can't leak between runs, stdout and
// stderr are captured, and the result travels back as a JSON string — plain
// data only, so postMessage never trips over un-clonable PyProxies.
const PY_RUNNER = [
  'import io, sys, math, json, traceback',
  '',
  'def _pb_jsonable(v, depth=6):',
  '    if isinstance(v, bool) or v is None or isinstance(v, str):',
  '        return v',
  '    if isinstance(v, float):',
  '        return v if math.isfinite(v) else repr(v)',
  '    if isinstance(v, int):',
  '        return v if abs(v) <= 9007199254740991 else repr(v)',
  '    if depth <= 0:',
  '        return repr(v)',
  '    if isinstance(v, (list, tuple, set)):',
  '        return [_pb_jsonable(x, depth - 1) for x in v]',
  '    if isinstance(v, dict):',
  '        return {str(k): _pb_jsonable(x, depth - 1) for k, x in v.items()}',
  '    return repr(v)',
  '',
  'def _pb_worker_run(source, var_name):',
  '    out, err = io.StringIO(), io.StringIO()',
  '    ns = {}',
  '    failure = None',
  '    old_out, old_err = sys.stdout, sys.stderr',
  '    sys.stdout, sys.stderr = out, err',
  '    try:',
  "        exec(compile(source, '<practice>', 'exec'), ns)",
  '    except BaseException:',
  '        failure = traceback.format_exc()',
  '    finally:',
  '        sys.stdout, sys.stderr = old_out, old_err',
  '    has_value = bool(var_name) and var_name in ns',
  '    value = _pb_jsonable(ns.get(var_name)) if has_value else None',
  '    return json.dumps({',
  "        'stdout': out.getvalue(),",
  "        'stderr': err.getvalue(),",
  "        'error': failure,",
  "        'hasValue': has_value,",
  "        'value': value,",
  '    })',
].join('\n');

// The worker script itself. Receives {id, source, varName}; posts back
// {id, stdout, stderr, error, hasValue, value}. Messages are chained so even
// inside the worker two runs can never interleave.
const WORKER_SOURCE = [
  "'use strict';",
  `var PYODIDE_SCRIPT = ${JSON.stringify(PYODIDE_SCRIPT)};`,
  `var PYODIDE_BASE = ${JSON.stringify(PYODIDE_BASE)};`,
  `var PY_RUNNER = ${JSON.stringify(PY_RUNNER)};`,
  'var ready;',
  'try {',
  '  importScripts(PYODIDE_SCRIPT);',
  '  ready = self.loadPyodide({ indexURL: PYODIDE_BASE }).then(function (py) {',
  '    py.runPython(PY_RUNNER);',
  '    return py;',
  '  });',
  '} catch (err) {',
  '  ready = Promise.reject(err);',
  '}',
  'ready.then(',
  '  function () { self.postMessage({ type: "ready" }); },',
  '  function (err) { self.postMessage({ type: "boot-error", error: String((err && err.message) || err) }); }',
  ');',
  'var chain = Promise.resolve();',
  'self.onmessage = function (event) {',
  '  var data = event.data || {};',
  '  if (data.id == null) return;',
  '  chain = chain.then(function () { return runOne(data); }).then(undefined, function () {});',
  '};',
  'function runOne(data) {',
  '  return ready.then(function (py) {',
  '    var runner = py.globals.get("_pb_worker_run");',
  '    var raw;',
  '    try {',
  '      raw = runner(String(data.source == null ? "" : data.source), String(data.varName == null ? "" : data.varName));',
  '    } finally {',
  '      if (runner && typeof runner.destroy === "function") runner.destroy();',
  '    }',
  '    var res = JSON.parse(raw);',
  '    self.postMessage({',
  '      id: data.id,',
  '      stdout: res.stdout || "",',
  '      stderr: res.stderr || "",',
  '      error: res.error || null,',
  '      hasValue: !!res.hasValue,',
  '      value: res.value,',
  '    });',
  '  }).then(undefined, function (err) {',
  '    self.postMessage({',
  '      id: data.id,',
  '      stdout: "",',
  '      stderr: "",',
  '      error: String((err && err.message) || err),',
  '      hasValue: false,',
  '      value: null,',
  '    });',
  '  });',
  '}',
].join('\n');

// Module-level singleton worker state.
let _worker = null;
let _workerUrl = null;
let _workerReady = null; // Promise<Worker> while a worker is alive/booting
let _workerBlocked = false; // Worker construction failed — permanent for this page load
let _workerNextId = 1;
const _workerPending = new Map(); // id → { resolve, reject, timer }

function workerSupported() {
  return (
    typeof window !== 'undefined' &&
    typeof window.Worker === 'function' &&
    typeof Blob !== 'undefined' &&
    typeof URL !== 'undefined' &&
    typeof URL.createObjectURL === 'function'
  );
}

function teardownWorker(reason) {
  const err = reason instanceof Error ? reason : new Error(reason || 'Python worker stopped.');
  if (_worker) {
    try { _worker.terminate(); } catch { /* already gone */ }
  }
  if (_workerUrl) {
    try { URL.revokeObjectURL(_workerUrl); } catch { /* ignore */ }
  }
  _worker = null;
  _workerUrl = null;
  _workerReady = null;
  for (const entry of _workerPending.values()) {
    clearTimeout(entry.timer);
    entry.reject(err);
  }
  _workerPending.clear();
}

// Spawn (or reuse) the singleton worker. Resolves with the Worker once
// Pyodide finished loading inside it. Rejects when workers are unavailable
// (CSP, old browser) or when the in-worker CDN load failed — both reject
// paths leave state so the caller can fall back to the main-thread loader,
// and a network-style failure can be retried on a later Run.
function ensureWorker() {
  if (_workerReady) return _workerReady;
  if (_workerBlocked || !workerSupported()) {
    return Promise.reject(new Error('Web Workers unavailable.'));
  }
  let worker;
  let url = null;
  try {
    url = URL.createObjectURL(new Blob([WORKER_SOURCE], { type: 'application/javascript' }));
    worker = new window.Worker(url);
  } catch (err) {
    if (url) {
      try { URL.revokeObjectURL(url); } catch { /* ignore */ }
    }
    // Construction itself failed (e.g. CSP without `worker-src blob:`).
    // That won't change until the page reloads — don't retry every run.
    _workerBlocked = true;
    return Promise.reject(err);
  }
  _worker = worker;
  _workerUrl = url;
  _workerReady = new Promise((resolve, reject) => {
    worker.addEventListener('message', (e) => {
      const data = e.data || {};
      if (data.type === 'ready') {
        resolve(worker);
        return;
      }
      if (data.type === 'boot-error') {
        const err = new Error(data.error || 'Pyodide failed to load in the worker.');
        reject(err);
        // Network-ish failure — tear down so a later Run can retry fresh
        // (e.g. the user came back online).
        if (_worker === worker) teardownWorker(err);
        return;
      }
      if (data.id == null) return;
      const entry = _workerPending.get(data.id);
      if (!entry) return; // run already timed out — stale response
      _workerPending.delete(data.id);
      clearTimeout(entry.timer);
      if (data.error) {
        entry.reject(asPythonError(new Error(cleanTraceback(data.error))));
      } else {
        entry.resolve({
          value: data.hasValue ? data.value : undefined,
          stdout: data.stdout || '',
          stderr: data.stderr || '',
        });
      }
    });
    worker.addEventListener('error', (event) => {
      // The blob script itself failed (CSP on importScripts, parse error…).
      const err = new Error((event && event.message) || 'Python worker failed.');
      reject(err);
      if (_worker === worker) teardownWorker(err);
    });
  });
  return _workerReady;
}

// Post one run to the worker, with a hard timeout. On timeout the worker is
// terminated (it's wedged in user code) and a fresh one is respawned in the
// background so the next Run starts clean.
function runInWorker(worker, source, varName) {
  return new Promise((resolve, reject) => {
    const id = _workerNextId++;
    const timer = setTimeout(() => {
      _workerPending.delete(id);
      teardownWorker('Python run timed out.');
      try {
        ensureWorker().catch(() => { /* respawn is best-effort */ });
      } catch { /* ignore */ }
      reject(asPythonError(new Error(
        `Execution timed out after ${Math.round(RUN_TIMEOUT_MS / 1000)}s (infinite loop?). `
        + 'The Python runner was restarted — fix the code and hit Run again.',
      )));
    }, RUN_TIMEOUT_MS);
    _workerPending.set(id, { resolve, reject, timer });
    try {
      worker.postMessage({ id, source, varName });
    } catch (err) {
      clearTimeout(timer);
      _workerPending.delete(id);
      reject(err);
    }
  });
}

// ─── Main-thread fallback loader ──────────────────────────────────────────
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
    const removeScriptTag = () => {
      const tag = document.querySelector(`script[src="${PYODIDE_SCRIPT}"]`);
      if (tag && tag.parentNode) tag.parentNode.removeChild(tag);
    };
    const boot = () => {
      if (!window.loadPyodide) {
        // The tag "loaded" but didn't define the loader. Remove it so a
        // retry creates a fresh tag instead of latching onto this dead one.
        removeScriptTag();
        reject(new Error('Pyodide loader missing after script load.'));
        return;
      }
      window
        .loadPyodide({ indexURL: PYODIDE_BASE })
        .then(resolve, reject);
    };
    const fail = () => {
      // Remove the dead tag BEFORE rejecting. Leaving it in document.head
      // made every retry find it via querySelector and wait on a 'load'
      // event that could never fire again — Run then hung forever.
      removeScriptTag();
      reject(new Error('Failed to load Pyodide script.'));
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
      existing.addEventListener('error', fail);
      return;
    }
    const s = document.createElement('script');
    s.src = PYODIDE_SCRIPT;
    s.async = true;
    s.onload = boot;
    s.onerror = fail;
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

// Render a JS value the way Python would write it, so grading and display
// line up with the literals lesson authors put in `expected` — True/False/
// None and `[1, 2, 3]`, not true/null and `1,2,3`.
function pythonDisplay(value) {
  if (value === true) return 'True';
  if (value === false) return 'False';
  if (value === null) return 'None';
  if (Array.isArray(value)) {
    return `[${value.map(pythonDisplay).join(', ')}]`;
  }
  return String(value);
}

// Normalise expected/actual values for comparison. We treat the captured
// Python value as authoritative; the prop is a string in JSON content so we
// try to coerce numerics where it makes sense.
function valuesMatch(actual, expected) {
  if (expected == null || expected === '') return true;
  if (actual === undefined) return false;
  const expectedStr = String(expected).trim();
  const actualStr = pythonDisplay(actual).trim();
  if (actualStr === expectedStr) return true;
  // Numeric coercion: "100" vs 100 vs 100.0. (Guard the empty string —
  // Number('') is 0, which must not match an expected "0".)
  if (actualStr !== '') {
    const en = Number(expectedStr);
    const an = Number(actualStr);
    if (!Number.isNaN(en) && !Number.isNaN(an) && en === an) return true;
  }
  return false;
}

// Run the user's code inside a main-thread Pyodide instance. Returns a
// {value, stdout} pair or throws (flagged with .pythonError) with a tidy
// traceback string on Python errors. This is the legacy path — the worker
// is preferred — but it's still what Lesson.jsx's code-run blocks use via
// the exported runUserCode below.
async function execUserCode(pyodide, source, varName) {
  // The wrapper runs in pyodide.globals so we can read results back out the
  // same way. The user's code runs inside a fresh dict `_pb_ns` so its
  // variables don't leak between runs (a previous successful run mustn't make
  // a later wrong answer look right).
  let stdoutProxy = null;
  let nsProxy = null;
  try {
    pyodide.globals.set('__pb_source', source);
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
      throw new Error(cleanTraceback(String(err)));
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
    } catch {
      value = undefined;
    }
    return { value, stdout };
  } catch (err) {
    // Anything thrown past this point means the interpreter ran but the
    // execution failed — surface it as a Python error, not a load failure.
    throw asPythonError(err);
  } finally {
    // Free PyProxies and clear wrapper vars so the next run starts clean.
    if (stdoutProxy && typeof stdoutProxy.destroy === 'function') stdoutProxy.destroy();
    if (nsProxy && typeof nsProxy.destroy === 'function') nsProxy.destroy();
    try {
      await pyodide.runPythonAsync(
        "for _k in ('__pb_source','_pb_stdout','_pb_ns','_pb_err','_pb_old'):\n"
        + "    globals().pop(_k, None)\n"
      );
    } catch { /* best effort */ }
  }
}

// Exported execution path shared with Lesson.jsx's code-run blocks. Queued so
// concurrent callers serialize against every other Python run on the page.
export function runUserCode(pyodide, source, varName) {
  return enqueueRun(() => execUserCode(pyodide, source, varName));
}

// Full run pipeline used by PracticeBlock: worker first, then the legacy
// main-thread path. Resolves {value, stdout, stderr}; rejects with
// .pythonError set when the code (not the loader) failed.
function runPythonSource(source, varName) {
  return enqueueRun(async () => {
    let worker = null;
    try {
      worker = await ensureWorker();
    } catch {
      worker = null; // workers unavailable or boot failed — use fallback
    }
    if (worker) {
      try {
        return await runInWorker(worker, source, varName);
      } catch (err) {
        // Real Python failures (tracebacks, timeouts) surface to the user.
        if (err && err.pythonError) throw err;
        // Anything else is worker infrastructure trouble — fall through to
        // the main-thread path so the run still happens.
      }
    }
    const pyodide = await loadPyodide();
    return execUserCode(pyodide, source, varName);
  });
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
    } catch { /* ignore */ }
    return initial;
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Debounced localStorage write — 400ms keeps the disk-pressure low while
  // still feeling instant for the user. We never delete the key on unmount;
  // the explicit Reset-to-example button is the only way to clear it.
  // `pendingWriteRef` holds the not-yet-flushed write so the unmount cleanup
  // below can flush it synchronously — without that, navigating away within
  // 400ms of the last keystroke silently dropped it.
  const pendingWriteRef = useRef(null);
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const write = () => {
      pendingWriteRef.current = null;
      try {
        if (source === initial) {
          // No edits → don't pollute localStorage with the placeholder.
          window.localStorage.removeItem(storageKey);
        } else {
          window.localStorage.setItem(storageKey, source);
        }
      } catch { /* ignore quota / private-mode errors */ }
    };
    pendingWriteRef.current = write;
    const t = setTimeout(write, 400);
    return () => clearTimeout(t);
  }, [source, storageKey, initial]);
  // Unmount-only: flush a still-pending debounced write so the final
  // keystrokes persist.
  useEffect(() => () => {
    if (pendingWriteRef.current) pendingWriteRef.current();
  }, []);
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
      const { value, stdout } = await runPythonSource(source, targetVar);
      everLoadedRef.current = true;
      if (expected == null || expected === '') {
        // Nothing to grade — just echo stdout / the captured value.
        setResult({
          kind: 'unknown',
          stdout,
          value,
          varName: targetVar,
        });
      } else if (valuesMatch(value, expected)) {
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
    } catch (err) {
      if (err && err.pythonError) {
        // The interpreter is up — only the user's code failed (or timed out).
        everLoadedRef.current = true;
        setResult({
          kind: 'pyerror',
          message: err.message ? err.message : String(err),
        });
      } else {
        // CDN unreachable or script/worker blocked — fall back to the legacy
        // literal verifier so the user still gets something actionable.
        const fallback = verifyOffline(source, expected);
        setResult({ ...fallback, offline: true });
      }
    } finally {
      setLoading(false);
    }
  };

  const onReset = () => {
    if (loading) return;
    setSource(initial);
    setResult(null);
    if (typeof window !== 'undefined') {
      try { window.localStorage.removeItem(storageKey); } catch { /* ignore */ }
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
                    {result.varName} == {pythonDisplay(result.value)}
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
                  : pythonDisplay(result.value)}
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
