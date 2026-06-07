import { useState } from 'react';

// Build-along — a guided, stepped "try it yourself". Each step says what to add
// and why; the artifact (code / config) ACCUMULATES on screen as you click
// through. The learner builds it for real in their OWN editor (VS Code) — there
// is no in-app sandbox. Worked-example pedagogy + ADHD-friendly chunking: one
// idea per step, visible progress, the whole thing assembled by the end.
export default function BuildAlongBlock({ block }) {
  const steps = Array.isArray(block.steps) ? block.steps : [];
  const [i, setI] = useState(0);
  if (steps.length === 0) return null;

  const safeI = Math.min(Math.max(i, 0), steps.length - 1);
  const isLast = safeI === steps.length - 1;
  const lang = block.lang || 'text';

  return (
    <figure className="build-along">
      <div className="build-along-head">
        <span className="build-along-kicker mono">
          🛠 BUILD ALONG{block.file ? ` · ${block.file}` : ''}
        </span>
        <span className="build-along-count mono">{safeI + 1} / {steps.length}</span>
      </div>
      {block.title && <div className="build-along-title">{block.title}</div>}
      {block.goal && <p className="build-along-goal">{block.goal}</p>}

      {/* The artifact, built up to the current step. Newest chunk is highlighted. */}
      <pre className={`build-along-code lang-${lang}`}>
        {steps.slice(0, safeI + 1).map((s, k) => (
          <span key={k} className={`build-along-chunk${k === safeI ? ' is-new' : ''}`}>
            {(k > 0 ? '\n' : '') + (s.add || '')}
          </span>
        ))}
      </pre>

      <div className="build-along-step">
        <div className="build-along-step-title">{steps[safeI].title}</div>
        {steps[safeI].say && <p className="build-along-step-say">{steps[safeI].say}</p>}
      </div>

      <div className="build-along-nav">
        <button
          type="button"
          className="build-along-btn"
          disabled={safeI === 0}
          onClick={() => setI(safeI - 1)}
        >
          ◀ Back
        </button>
        <button
          type="button"
          className="build-along-btn build-along-btn-next"
          onClick={() => setI(isLast ? 0 : safeI + 1)}
        >
          {isLast ? '↺ Restart' : 'Add next ▶'}
        </button>
      </div>

      {isLast && (
        <div className="build-along-done">
          ✅ That's the whole thing — now <strong>open VS Code and build it yourself</strong>: type it out and run it. Reading it isn't the same as making it work.
        </div>
      )}
    </figure>
  );
}
