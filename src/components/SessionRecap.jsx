import { useNavigate } from 'react-router-dom';
import StemText from './StemText.jsx';

// SessionRecap — the closure a session end-screen was missing. Every testing
// session used to just… end; this shows what the session actually taught:
// a tally (held / close / missed) and the missed prompts, each with a jump
// to the lesson that fixes it. The misses ARE the study plan — the recap
// turns "you were wrong" into "here's your next 90 seconds".
//
// Props:
//   results — [{ prompt, correct, close?, lessonId? }] in answer order
//   title   — optional kicker override (default 'THIS SESSION')
//
// Renders nothing for an empty session (nothing to recap).

export default function SessionRecap({ results, title = 'THIS SESSION' }) {
  const nav = useNavigate();
  if (!Array.isArray(results) || results.length === 0) return null;

  const held = results.filter((r) => r.correct && !r.close).length;
  const close = results.filter((r) => r.correct && r.close).length;
  const missed = results.filter((r) => !r.correct);

  return (
    <div className="card" style={{ textAlign: 'left', marginTop: 10 }}>
      <div className="kicker" style={{ marginBottom: 8 }}>{title}</div>
      <div className="row mono" style={{ gap: 12, fontSize: 12, marginBottom: missed.length ? 10 : 0 }}>
        <span style={{ color: 'var(--status-success, #8FA876)' }}>✓ {held} held</span>
        {close > 0 && <span style={{ color: 'var(--accent-amber)' }}>~ {close} close</span>}
        <span style={{ color: missed.length ? 'var(--el-fire)' : 'var(--text-tertiary)' }}>
          ✗ {missed.length} missed
        </span>
      </div>

      {missed.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {missed.map((r, i) => (
            <div
              key={i}
              style={{
                borderLeft: '3px solid var(--el-fire)',
                borderRadius: '0 8px 8px 0',
                background: 'var(--bg-elevated)',
                padding: '8px 10px',
              }}
            >
              <div style={{ fontSize: 12.5, lineHeight: 1.45, marginBottom: r.lessonId ? 6 : 0 }}>
                <StemText text={r.prompt} />
              </div>
              {r.lessonId && (
                <button
                  type="button"
                  className="btn"
                  style={{ fontSize: 11, padding: '4px 10px', minHeight: 0 }}
                  onClick={() => nav(`/lesson/${r.lessonId}`)}
                >
                  Open the lesson →
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
