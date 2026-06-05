import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PracticeBlock from '../components/PracticeBlock.jsx';
import TerminalBlock from '../components/TerminalBlock.jsx';
import LintEditor, {
  validateYaml,
  validateSql,
  validateDockerfile,
  validateJson,
} from '../components/LintEditor.jsx';
import CodeEditor from '../components/CodeEditor.jsx';
import { PATHS } from '../data/content.js';
import SANDBOX_EXAMPLES from '../data/sandboxExamples.js';
import SANDBOX_CHALLENGES, { HINTS, runSyntaxOnlyChecks } from '../data/sandboxChallenges.js';
import { useStore } from '../store/useStore.js';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts.js';

// Resolve a lesson title from its id for the hand-off banner. Kept local
// (not imported from Lesson.jsx) so the Sandbox bundle doesn't drag the
// entire lesson screen + all its renderers.
function lessonTitleFor(id) {
  if (!id) return null;
  try {
    for (const key of Object.keys(PATHS)) {
      const ls = PATHS[key].lessons || [];
      const hit = ls.find((l) => l.id === id);
      if (hit) return hit.title || null;
    }
  } catch (_) { /* ignore */ }
  return null;
}

// Sandbox — a NeetCode-style multi-language playground. Top strip is the
// language picker (Python / Bash / YAML / SQL / Dockerfile / JSON), and the
// pane below is the editor for the active language. Each language has its
// own appropriate runtime / validator:
//
//   Python      → Pyodide via PracticeBlock (free-form, no expected value)
//   Bash        → TerminalBlock (in-browser shell sim on a virtual FS)
//   YAML        → syntax validator (browser parser feedback)
//   SQL         → syntax validator (sqlite-ish keyword sanity check)
//   Dockerfile  → linter (no quotes around CMD, FROM first, etc.)
//   JSON        → strict JSON parser with line/col errors
//
// Per mobile-ux-principles (lessons = reading, labs = own machine) this is
// the ONE place in the app where you write code in the browser. Lessons
// stay scroll-friendly read-only; the Sandbox is where you experiment.
//
// Tier A upgrade (2026-06):
//   - CodeMirror 6 replaces the textareas (see CodeEditor.jsx)
//   - localStorage persistence per language (`sandbox-{lang}` keys, driven
//     down to PracticeBlock / LintEditor via `persistKey`)
//   - Hand-off from a lesson's "↗ Open in Sandbox" button via
//     sessionStorage['sandbox-handoff'] = {lang, code, fromLessonId}

// Inline style constants for Tier B controls. Lives here (not theme.css) per
// project constraint: only `.sandbox-challenge-*` selectors may be added to
// the stylesheet. Everything else lands as inline style.
const MODE_TOGGLE_STYLE = {
  display: 'inline-flex',
  gap: 0,
  border: '1px solid var(--border-subtle)',
  borderRadius: 10,
  padding: 3,
  background: 'var(--bg-card)',
  marginBottom: 12,
};
function modePillStyle(active, disabled) {
  return {
    minHeight: 36,
    padding: '6px 14px',
    fontSize: 11.5,
    letterSpacing: '.06em',
    fontWeight: 700,
    fontFamily: 'var(--font-mono)',
    border: 'none',
    borderRadius: 7,
    background: active ? 'var(--accent-amber-bg)' : 'transparent',
    color: active ? 'var(--accent-amber)' : 'var(--text-tertiary)',
    boxShadow: active ? 'inset 0 0 0 1px var(--accent-amber)' : 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1,
  };
}
const EXAMPLES_ROW_STYLE = {
  position: 'relative',
  marginBottom: 12,
};
const EXAMPLES_BTN_STYLE = {
  display: 'inline-flex',
  alignItems: 'center',
  minHeight: 36,
  padding: '6px 12px',
  fontSize: 12.5,
  fontFamily: 'var(--font-body)',
  background: 'var(--bg-card)',
  border: '1px solid var(--border-default)',
  borderRadius: 8,
  color: 'var(--text-primary)',
  cursor: 'pointer',
};
const EXAMPLES_LIST_STYLE = {
  margin: '6px 0 0',
  padding: 6,
  background: 'var(--bg-card)',
  border: '1px solid var(--border-default)',
  borderRadius: 10,
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  maxHeight: 'min(60vh, 480px)',
  overflowY: 'auto',
};
const EXAMPLE_ITEM_STYLE = {
  width: '100%',
  minHeight: 44,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: 2,
  padding: '8px 10px',
  background: 'transparent',
  border: 'none',
  borderRadius: 8,
  color: 'var(--text-primary)',
  textAlign: 'left',
  cursor: 'pointer',
};
const EXAMPLE_TITLE_STYLE = { fontSize: 13.5, fontWeight: 600 };
const EXAMPLE_DESC_STYLE  = { fontSize: 11.5, color: 'var(--text-tertiary)' };

const LANGS = [
  { id: 'python',     label: 'Python',     icon: '🐍', sub: 'Pyodide' },
  { id: 'bash',       label: 'Bash',       icon: '▣',  sub: 'shell sim' },
  { id: 'yaml',       label: 'YAML',       icon: '·',  sub: 'lint' },
  { id: 'sql',        label: 'SQL',        icon: '·',  sub: 'lint' },
  { id: 'dockerfile', label: 'Dockerfile', icon: '·',  sub: 'lint' },
  { id: 'json',       label: 'JSON',       icon: '·',  sub: 'parse' },
];

const PLACEHOLDERS = {
  python: '# Free-form Python sandbox. Try:\nimport math\nx = math.factorial(8)\nprint(x)\n',
  yaml: '# YAML editor with structural lint.\n# Paste a docker-compose.yml or k8s manifest:\n\nservices:\n  api:\n    image: python:3.12-slim\n    ports:\n      - "8000:8000"\n',
  sql: '-- SQL editor (keyword + structure lint, no execution).\n-- Try:\nSELECT id, name\nFROM users\nWHERE created_at > NOW() - INTERVAL 7 DAY\nORDER BY id DESC;\n',
  dockerfile: '# Dockerfile linter (no build). Edit me and watch the lint react.\nFROM python:3.12-slim\nWORKDIR /app\nCOPY requirements.txt .\nRUN pip install --no-cache-dir -r requirements.txt\nCOPY . .\nUSER nonroot\nCMD ["python", "main.py"]\n',
  json: '{\n  "name": "infralearn",\n  "version": "1.0.0",\n  "private": true\n}\n',
};

const HANDOFF_KEY = 'sandbox-handoff';

// Read + immediately clear the sessionStorage hand-off blob. Returning the
// payload synchronously means the effect can set the active tab + seed the
// editor in one go on mount, without leaving a stale flag in storage.
function consumeHandoff() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(HANDOFF_KEY);
    if (!raw) return null;
    window.sessionStorage.removeItem(HANDOFF_KEY);
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') return parsed;
  } catch (_) { /* ignore malformed payloads */ }
  return null;
}

export default function Sandbox() {
  const nav = useNavigate();
  const [active, setActive] = useState('python');
  // SANDBOX | CHALLENGES toggle. Persists across reloads via sandboxMode key
  // so users who park themselves in CHALLENGES mode aren't reset every time.
  const [mode, setMode] = useState(() => {
    if (typeof window === 'undefined') return 'sandbox';
    try {
      const saved = window.localStorage.getItem('sandboxMode');
      return saved === 'challenges' ? 'challenges' : 'sandbox';
    } catch (_) { return 'sandbox'; }
  });
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try { window.localStorage.setItem('sandboxMode', mode); } catch (_) { /* ignore */ }
  }, [mode]);

  // `banner` survives even after the hand-off payload is consumed so we can
  // keep the "← from {lesson}" pill until the user dismisses it.
  const [banner, setBanner] = useState(null);
  // `editorBoot` is a per-lang counter incremented when we seed the editor
  // from the hand-off payload (or from "load example"). Bumping it forces a
  // fresh load from localStorage, which is how PracticeBlock / LintEditor
  // pick up the new value written by writeSandboxCode below.
  const [editorBoot, setEditorBoot] = useState({});
  const [examplesOpen, setExamplesOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const payload = consumeHandoff();
    if (!payload || !payload.lang || !PLACEHOLDERS.hasOwnProperty(payload.lang)) return;
    const code = typeof payload.code === 'string' ? payload.code : '';
    try {
      // Stuff the code into the same localStorage slot the editor reads on
      // mount. Then nudge the editor to remount so it actually picks it up.
      window.localStorage.setItem(`sandbox-${payload.lang}`, code);
    } catch (_) { /* ignore */ }
    setActive(payload.lang);
    setMode('sandbox');  // Hand-off code always lands in free sandbox mode.
    setEditorBoot((b) => ({ ...b, [payload.lang]: (b[payload.lang] || 0) + 1 }));
    // Resolve a friendly lesson title for the banner if we can.
    const title = lessonTitleFor(payload.fromLessonId);
    setBanner({ lessonId: payload.fromLessonId || null, lessonTitle: title });
  }, []);

  // Close the examples dropdown on outside-click / Escape.
  useEffect(() => {
    if (!examplesOpen) return undefined;
    const onClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setExamplesOpen(false);
      }
    };
    const onKey = (e) => { if (e.key === 'Escape') setExamplesOpen(false); };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [examplesOpen]);

  // Keyboard shortcuts (Sandbox): 1-6 jump to a language tab. The hook
  // already guards out keystrokes when focus is in INPUT/TEXTAREA, so
  // CodeMirror (a contentEditable surface) is also exempt — typing a digit
  // inside the editor still types the digit. Ctrl+Enter is owned by
  // CodeMirror's run command and intentionally untouched here.
  useKeyboardShortcuts(
    {
      1: () => setActive('python'),
      2: () => setActive('bash'),
      3: () => setActive('yaml'),
      4: () => setActive('sql'),
      5: () => setActive('dockerfile'),
      6: () => setActive('json'),
    },
    [],
  );

  const persistKey = useMemo(() => `sandbox-${active}`, [active]);
  const examplesForActive = SANDBOX_EXAMPLES[active] || [];

  // Load an example into the editor. If the user has modified the buffer
  // away from the current placeholder/example baseline we confirm — ADHD-
  // friendly principle: never silently destroy work.
  //
  // Bash is special: TerminalBlock is a REPL, not an editor. Clicking a bash
  // example copies it to the clipboard so the user can paste it into the
  // prompt rather than overwriting an editor that doesn't exist.
  const loadExample = (ex) => {
    if (typeof window === 'undefined') return;
    if (active === 'bash') {
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(ex.code);
        }
      } catch (_) { /* ignore */ }
      setExamplesOpen(false);
      return;
    }
    let dirty = false;
    try {
      const saved = window.localStorage.getItem(`sandbox-${active}`);
      const baseline = PLACEHOLDERS[active] || '';
      if (saved != null && saved !== baseline && saved !== ex.code) dirty = true;
    } catch (_) { /* treat as not-dirty */ }
    if (dirty) {
      // eslint-disable-next-line no-alert
      const ok = window.confirm('Replace your current code with this example?');
      if (!ok) return;
    }
    try {
      window.localStorage.setItem(`sandbox-${active}`, ex.code);
    } catch (_) { /* ignore */ }
    setEditorBoot((b) => ({ ...b, [active]: (b[active] || 0) + 1 }));
    setExamplesOpen(false);
  };

  const hasExamples = examplesForActive.length > 0;
  const hasChallenges = (SANDBOX_CHALLENGES[active] || []).length > 0;

  return (
    <div className="screen fade-in">
      <div className="row" style={{ marginBottom: 8 }}>
        <span className="kicker">SANDBOX</span>
      </div>
      <h1 className="h1" style={{ marginBottom: 4 }}>
        Playground<span className="dot">.</span>
      </h1>
      <p className="caption" style={{ marginBottom: 14 }}>
        Run real code in the browser. Pick a language, write, run. Nothing here is graded.
      </p>

      {banner && (
        <div className="sandbox-handoff-banner">
          <span className="sandbox-handoff-text">
            ← from <strong>{banner.lessonTitle || 'lesson'}</strong>
          </span>
          <span className="sandbox-handoff-actions">
            {banner.lessonId && (
              <button
                type="button"
                className="btn btn-ghost sandbox-handoff-btn"
                onClick={() => nav(`/lesson/${banner.lessonId}`)}
              >
                ← Back to lesson
              </button>
            )}
            <button
              type="button"
              className="btn btn-ghost sandbox-handoff-btn"
              aria-label="Dismiss"
              onClick={() => setBanner(null)}
            >
              ×
            </button>
          </span>
        </div>
      )}

      {/* SANDBOX | CHALLENGES mode toggle. Two-pill segmented control.
          Styled inline (project constraint: no new top-level CSS). */}
      <div
        role="tablist"
        aria-label="Sandbox mode"
        style={MODE_TOGGLE_STYLE}
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'sandbox'}
          style={modePillStyle(mode === 'sandbox')}
          onClick={() => setMode('sandbox')}
        >
          SANDBOX
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'challenges'}
          style={modePillStyle(mode === 'challenges', !hasChallenges && mode !== 'challenges')}
          onClick={() => setMode('challenges')}
          disabled={!hasChallenges && mode !== 'challenges'}
          title={!hasChallenges ? 'No challenges yet for this language' : undefined}
        >
          CHALLENGES
        </button>
      </div>

      {/* Language tabs — horizontal scroll on narrow screens so the row never
          wraps onto two lines. Each pill is a 44 px tap target. */}
      <div
        className="sandbox-langs"
        role="tablist"
        aria-label="Sandbox languages"
      >
        {LANGS.map((l) => {
          const isActive = l.id === active;
          return (
            <button
              key={l.id}
              role="tab"
              aria-selected={isActive}
              className={`sandbox-lang${isActive ? ' is-active' : ''}`}
              onClick={() => setActive(l.id)}
            >
              <span className="sandbox-lang-icon" aria-hidden="true">{l.icon}</span>
              <span className="sandbox-lang-text">
                <span className="sandbox-lang-name">{l.label}</span>
                <span className="sandbox-lang-sub mono">{l.sub}</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Examples dropdown — visible only in SANDBOX mode. Each option is a
          44px touch target stacked vertically when open. Inline styles
          throughout per project constraint. */}
      {mode === 'sandbox' && hasExamples && (
        <div style={EXAMPLES_ROW_STYLE} ref={dropdownRef}>
          <button
            type="button"
            style={EXAMPLES_BTN_STYLE}
            onClick={() => setExamplesOpen((o) => !o)}
            aria-expanded={examplesOpen}
            aria-haspopup="listbox"
          >
            <span>Start from example</span>
            <span aria-hidden="true" style={{ opacity: 0.7, marginLeft: 8 }}>{examplesOpen ? '▴' : '▾'}</span>
          </button>
          {examplesOpen && (
            <ul role="listbox" aria-label="Starter examples" style={EXAMPLES_LIST_STYLE}>
              {examplesForActive.map((ex) => (
                <li key={ex.id} role="option" style={{ listStyle: 'none' }}>
                  <button
                    type="button"
                    style={EXAMPLE_ITEM_STYLE}
                    onClick={() => loadExample(ex)}
                  >
                    <span style={EXAMPLE_TITLE_STYLE}>{ex.title}</span>
                    <span style={EXAMPLE_DESC_STYLE}>{ex.description}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {mode === 'challenges' && hasChallenges && (
        <ChallengesPane lang={active} />
      )}

      {mode === 'challenges' && !hasChallenges && (
        <div className="sandbox-pane">
          <div className="sandbox-challenge-empty">
            No challenges yet for <strong>{active.toUpperCase()}</strong> — switch language or back to SANDBOX mode.
          </div>
        </div>
      )}

      {mode === 'sandbox' && (
      <div className="sandbox-pane">
        {active === 'python' && (
          <>
            <SandboxHint
              text="Pyodide loads on first Run (one-time ~10 MB download). After that, runs are sub-100 ms."
            />
            <PracticeBlock
              key={`python-${editorBoot.python || 0}`}
              prompt="Try anything. The variable `x` is captured back into the output."
              starter={PLACEHOLDERS.python}
              varName="x"
              persistKey={persistKey}
              lang="python"
            />
          </>
        )}
        {active === 'bash' && (
          <>
            <SandboxHint
              text="Hand-rolled shell sim — a subset of ~25 commands on a tiny in-memory FS. Type `help` to list them."
            />
            <TerminalBlock />
          </>
        )}
        {active === 'yaml' && (
          <LintEditor
            key={`yaml-${editorBoot.yaml || 0}`}
            kind="yaml"
            placeholder={PLACEHOLDERS.yaml}
            validate={validateYaml}
            persistKey={persistKey}
          />
        )}
        {active === 'sql' && (
          <LintEditor
            key={`sql-${editorBoot.sql || 0}`}
            kind="sql"
            placeholder={PLACEHOLDERS.sql}
            validate={validateSql}
            persistKey={persistKey}
          />
        )}
        {active === 'dockerfile' && (
          <LintEditor
            key={`dockerfile-${editorBoot.dockerfile || 0}`}
            kind="dockerfile"
            placeholder={PLACEHOLDERS.dockerfile}
            validate={validateDockerfile}
            persistKey={persistKey}
          />
        )}
        {active === 'json' && (
          <LintEditor
            key={`json-${editorBoot.json || 0}`}
            kind="json"
            placeholder={PLACEHOLDERS.json}
            validate={validateJson}
            persistKey={persistKey}
          />
        )}
      </div>
      )}

      <div className="row" style={{ marginTop: 24, justifyContent: 'flex-end' }}>
        <button className="btn" onClick={() => nav('/')}>
          ← Back to Learn
        </button>
      </div>
    </div>
  );
}

function SandboxHint({ text }) {
  return (
    <div
      className="caption"
      style={{
        background: 'var(--accent-amber-bg)',
        borderLeft: '3px solid var(--accent-amber)',
        padding: '8px 12px',
        borderRadius: 6,
        marginBottom: 12,
        fontSize: 12,
        lineHeight: 1.5,
      }}
    >
      {text}
    </div>
  );
}

// ─── ChallengesPane ───────────────────────────────────────────────────────
// NeetCode-style mode: pick a challenge → editor loads with starter → "Run
// tests" grades hidden tests. Python uses Pyodide for real execution; other
// languages fall back to a syntax-only structural check (see runSyntaxOnlyChecks
// in sandboxChallenges.js — v2 will execute against real runtimes).

const PYODIDE_VERSION = '0.27.0';
const PYODIDE_BASE = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;
const PYODIDE_SCRIPT = `${PYODIDE_BASE}pyodide.js`;
// Module-level cache shared with PracticeBlock's interpreter would require
// cross-file coupling; here we just lazy-import a fresh handle on first use.
// Pyodide caches itself at window.loadPyodide so cost is negligible.
let _challengePyodide = null;
function loadPyodideForChallenge() {
  if (_challengePyodide) return _challengePyodide;
  _challengePyodide = new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('no window'));
    const boot = () => {
      if (!window.loadPyodide) return reject(new Error('Pyodide loader missing'));
      window.loadPyodide({ indexURL: PYODIDE_BASE }).then(resolve, reject);
    };
    if (window.loadPyodide) return boot();
    const existing = document.querySelector(`script[src="${PYODIDE_SCRIPT}"]`);
    if (existing) {
      existing.addEventListener('load', boot);
      existing.addEventListener('error', () => reject(new Error('script load failed')));
      return;
    }
    const s = document.createElement('script');
    s.src = PYODIDE_SCRIPT;
    s.async = true;
    s.onload = boot;
    s.onerror = () => reject(new Error('script load failed'));
    document.head.appendChild(s);
  }).catch((e) => { _challengePyodide = null; throw e; });
  return _challengePyodide;
}

function ChallengesPane({ lang }) {
  const challenges = SANDBOX_CHALLENGES[lang] || [];
  const [selectedId, setSelectedId] = useState(null);
  // Pull XP fn off the store — optional. We tolerate it being missing so
  // that this component doesn't hard-couple to the engagement Tier B XP
  // wiring. (See feedback: don't break if store changes shape.)
  const addXp = useStore((s) => s.addXp);

  const selected = challenges.find((c) => c.id === selectedId);

  if (!selected) {
    return (
      <div className="sandbox-pane sandbox-challenges-list">
        <div className="sandbox-challenge-intro">
          Hidden tests grade your solution. {lang === 'python'
            ? 'Python runs in Pyodide; you write the function, we call it on test inputs.'
            : 'Syntax-only check for v1 — we look for required patterns, not real execution.'}
        </div>
        <ul className="sandbox-challenge-list" role="list">
          {challenges.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                className="sandbox-challenge-card"
                onClick={() => setSelectedId(c.id)}
              >
                <span className="sandbox-challenge-card-title">{c.title}</span>
                <span className={`sandbox-challenge-card-diff sandbox-challenge-diff-${c.difficulty}`}>
                  {c.difficulty}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <ChallengeRunner
      key={selected.id}
      lang={lang}
      challenge={selected}
      onBack={() => setSelectedId(null)}
      addXp={addXp}
    />
  );
}

function ChallengeRunner({ lang, challenge, onBack, addXp }) {
  const [source, setSource] = useState(challenge.starter || '');
  const [running, setRunning] = useState(false);
  // result: { kind: 'idle'|'running'|'pass'|'fail'|'error', summary, failing }
  const [result, setResult] = useState({ kind: 'idle' });
  const [attempts, setAttempts] = useState(0);
  const xpAwardedRef = useRef(false);

  const showHint = attempts >= 3 && result.kind !== 'pass';
  const hintText = HINTS[challenge.id];

  const runTests = async () => {
    if (running) return;
    setRunning(true);
    setResult({ kind: 'running' });
    try {
      if (lang === 'python') {
        const out = await runPythonTests(challenge, source);
        finishRun(out);
      } else {
        // Syntax-only path for bash/sql/yaml v1.
        const check = challenge.syntaxCheck || {};
        const out = runSyntaxOnlyChecks(check, source);
        finishRun({
          total: out.total,
          passed: out.passed,
          failing: out.failing.map((f) => ({ index: f.index, msg: f.msg })),
        });
      }
    } catch (e) {
      setResult({ kind: 'error', message: e && e.message ? e.message : String(e) });
    } finally {
      setRunning(false);
    }
  };

  const finishRun = (out) => {
    setAttempts((a) => a + 1);
    if (out.passed === out.total && out.total > 0) {
      // Award XP exactly once per session per challenge, to avoid farming.
      if (!xpAwardedRef.current && typeof addXp === 'function') {
        try { addXp(25, `sandbox:challenge:${challenge.id}`); } catch (_) { /* ignore */ }
      }
      xpAwardedRef.current = true;
      setResult({ kind: 'pass', total: out.total });
    } else {
      // For "hard" challenges we don't reveal the failing input — just count.
      const revealFailing = challenge.difficulty !== 'hard';
      setResult({
        kind: 'fail',
        total: out.total,
        passed: out.passed,
        failing: revealFailing ? out.failing : [],
      });
    }
  };

  return (
    <div className="sandbox-pane sandbox-challenge-runner">
      <div className="sandbox-challenge-header">
        <button type="button" className="btn btn-ghost sandbox-challenge-back" onClick={onBack}>
          ← All challenges
        </button>
        <span className={`sandbox-challenge-card-diff sandbox-challenge-diff-${challenge.difficulty}`}>
          {challenge.difficulty}
        </span>
      </div>
      <h2 className="sandbox-challenge-title">{challenge.title}</h2>
      <p className="sandbox-challenge-prompt">{challenge.prompt}</p>

      <div className="lint-editor-host">
        <CodeEditor
          value={source}
          onChange={setSource}
          lang={lang}
          ariaLabel={`${lang} challenge editor`}
          readOnly={running}
          minHeight={180}
        />
      </div>

      <div className="practice-block-actions" style={{ marginTop: 10 }}>
        <button
          type="button"
          className="btn btn-primary"
          onClick={runTests}
          disabled={running}
        >
          {running ? 'Running tests…' : 'Run tests'}
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => { setSource(challenge.starter || ''); setResult({ kind: 'idle' }); }}
          disabled={running}
        >
          Reset
        </button>
      </div>

      {result.kind === 'pass' && (
        <div className="sandbox-challenge-result sandbox-challenge-pass" role="status" aria-live="polite">
          ✓ All {result.total} tests passed — earn +25 XP
        </div>
      )}

      {result.kind === 'fail' && (
        <div className="sandbox-challenge-result sandbox-challenge-fail" role="status" aria-live="polite">
          <div>
            ✗ {result.total - result.passed} of {result.total} failing — try again.
            {attempts >= 2 && attempts < 3 && ' Hint after 3 tries.'}
          </div>
          {result.failing && result.failing.length > 0 && (
            <ul className="sandbox-challenge-fail-list">
              {result.failing.slice(0, 3).map((f, i) => (
                <li key={i} className="mono">{f.msg}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {result.kind === 'error' && (
        <div className="sandbox-challenge-result sandbox-challenge-fail" role="status" aria-live="polite">
          <div>✗ Error while running tests:</div>
          <pre className="mono" style={{ margin: '6px 0 0', whiteSpace: 'pre-wrap', fontSize: 12 }}>{result.message}</pre>
        </div>
      )}

      {showHint && hintText && (
        <div className="sandbox-challenge-hint">
          <strong>Hint:</strong> {hintText}
        </div>
      )}
    </div>
  );
}

// Run hidden tests through Pyodide. For each test: define the user's code,
// call solverName(*input), compare to expected. Returns { total, passed, failing }.
async function runPythonTests(challenge, source) {
  const pyodide = await loadPyodideForChallenge();
  const failing = [];
  const total = challenge.hiddenTests.length;
  let passed = 0;
  const fnName = challenge.solverName;

  for (let i = 0; i < total; i++) {
    const t = challenge.hiddenTests[i];
    pyodide.globals.set('__ch_source', source);
    // We pass input + expected via JSON so PyProxies don't leak.
    pyodide.globals.set('__ch_input_json', JSON.stringify(t.input));
    pyodide.globals.set('__ch_expected_json', JSON.stringify(t.expected));
    pyodide.globals.set('__ch_fn_name', fnName);

    try {
      await pyodide.runPythonAsync(`
import json, traceback
__ch_ns = {}
__ch_err = None
__ch_actual = None
try:
    exec(compile(__ch_source, '<challenge>', 'exec'), __ch_ns)
    fn = __ch_ns.get(__ch_fn_name)
    if fn is None:
        raise RuntimeError(f"Function '{__ch_fn_name}' not defined.")
    args = json.loads(__ch_input_json)
    __ch_actual = fn(*args)
except Exception:
    __ch_err = traceback.format_exc()
__ch_actual_json = json.dumps(__ch_actual, default=str) if __ch_err is None else None
`);
      const err = pyodide.globals.get('__ch_err');
      if (err) {
        failing.push({ index: i, msg: `Test ${i + 1}: error — ${String(err).split('\n').slice(-2).join(' ').trim()}` });
      } else {
        const actualJson = pyodide.globals.get('__ch_actual_json');
        const actual = JSON.parse(String(actualJson));
        if (deepEq(actual, t.expected)) {
          passed += 1;
        } else {
          // Reveal the failing input + expected for easy/medium; ChallengeRunner
          // strips the input for hard challenges before showing the user.
          const inputStr = JSON.stringify(t.input).replace(/^\[|\]$/g, '');
          failing.push({
            index: i,
            msg: `Test ${i + 1}: ${fnName}(${inputStr}) returned ${JSON.stringify(actual)}, expected ${JSON.stringify(t.expected)}`,
          });
        }
      }
    } catch (e) {
      failing.push({ index: i, msg: `Test ${i + 1}: ${e && e.message ? e.message : String(e)}` });
    } finally {
      try {
        await pyodide.runPythonAsync(
          "for _k in ('__ch_source','__ch_input_json','__ch_expected_json','__ch_fn_name','__ch_ns','__ch_err','__ch_actual','__ch_actual_json'):\n"
          + "    globals().pop(_k, None)\n"
        );
      } catch (_) { /* best effort */ }
    }
  }

  return { total, passed, failing };
}

// Deep equality good enough for JSON-shaped values (strings, numbers,
// arrays, plain objects). No Date/Map/Set in our test fixtures.
function deepEq(a, b) {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a == null || b == null) return a === b;
  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (!deepEq(a[i], b[i])) return false;
    return true;
  }
  if (typeof a === 'object') {
    const ka = Object.keys(a); const kb = Object.keys(b);
    if (ka.length !== kb.length) return false;
    for (const k of ka) if (!deepEq(a[k], b[k])) return false;
    return true;
  }
  return false;
}
