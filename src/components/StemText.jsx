// StemText — shared question-stem renderer for every testing surface.
//
// Two inline notations unlock the new question formats without new schemas:
//   `code`  — renders monospace (find-the-bug stems quote real code)
//   ____    — a cloze blank (3+ underscores). Before answering it renders as
//             an empty slot; after answering, pass `fill` (the CORRECT
//             option's text) and the completed, TRUE statement is what the
//             learner re-reads — that final read is the pedagogy, so the
//             fill always shows the right answer, tinted by whether their
//             pick matched (`verdict`: 'right' | 'wrong' | null).
//
// Plain stems (no backticks, no blanks) render exactly as before — one
// <span> with the raw text.

const TOKEN = /(`[^`]+`|_{3,})/g;

export default function StemText({ text, fill = null, verdict = null }) {
  const src = String(text ?? '');
  if (!src.includes('`') && !/_{3,}/.test(src)) return <span>{src}</span>;

  const parts = src.split(TOKEN);
  return (
    <span>
      {parts.map((part, i) => {
        if (/^_{3,}$/.test(part)) {
          const filled = fill != null;
          return (
            <span
              key={i}
              className="stem-blank"
              data-verdict={filled ? verdict || 'right' : undefined}
              style={{
                display: 'inline-block',
                minWidth: filled ? 0 : 56,
                margin: '0 2px',
                padding: '0 6px',
                borderBottom: `2px solid ${filled
                  ? (verdict === 'wrong' ? 'var(--el-fire)' : 'var(--status-success, #8FA876)')
                  : 'var(--accent-amber)'}`,
                background: filled ? 'transparent' : 'var(--accent-amber-bg, rgba(245,184,66,.08))',
                borderRadius: '4px 4px 0 0',
                fontWeight: 600,
                color: filled
                  ? (verdict === 'wrong' ? 'var(--status-success, #8FA876)' : 'inherit')
                  : 'transparent',
                lineHeight: 1.3,
              }}
            >
              {filled ? fill : '.'}
            </span>
          );
        }
        if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
          return (
            <code
              key={i}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.92em',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle, var(--border-default))',
                borderRadius: 4,
                padding: '1px 4px',
              }}
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        return part ? <span key={i}>{part}</span> : null;
      })}
    </span>
  );
}
