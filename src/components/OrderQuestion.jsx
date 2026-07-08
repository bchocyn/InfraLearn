import { useMemo, useRef, useState } from 'react';
import FeedbackPanel from './FeedbackPanel.jsx';

// OrderQuestion — a drag-to-order testing block.
//
// The bank entry stores `items` in the CANONICAL correct order; this
// component shuffles the presentation per mount (re-rolling if the shuffle
// lands on the answer) so the stored order never leaks. Three ways to
// reorder, so no input mode is a second-class citizen:
//   - DRAG the grip (pointer events; the row bubbles past siblings as the
//     pointer crosses their midpoints — no transform math, scroll-safe
//     because touch-action:none lives on the grip only, not the row text)
//   - ARROW KEYS on a focused row (ArrowUp/ArrowDown move it one slot)
//   - the per-row ↑/↓ buttons double as the visible affordance
// "Check order" grades exact-match: every item in its canonical slot.
//
// Props:
//   question      — { q, items, whyWrong?, whyCorrect?, bestPractices? }
//   onDone(bool)  — fired exactly once when the order is checked
//   initialResult — 'right' | 'wrong' | null; hydrated remounts (daily
//                   practice re-opened mid-day) render the CANONICAL order
//                   read-only with the recorded verdict.

function shuffledIndexes(n) {
  const idx = Array.from({ length: n }, (_, i) => i);
  for (let tries = 0; tries < 8; tries += 1) {
    for (let i = idx.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [idx[i], idx[j]] = [idx[j], idx[i]];
    }
    if (idx.some((v, i) => v !== i)) return idx;
  }
  // Degenerate fallback (e.g. repeated identity rolls): rotate by one.
  return idx.map((_, i) => (i + 1) % n);
}

export default function OrderQuestion({ question, onDone, initialResult = null }) {
  const items = question.items || [];
  const [order, setOrder] = useState(() => (
    initialResult ? items.map((_, i) => i) : shuffledIndexes(items.length)
  ));
  const [result, setResult] = useState(initialResult); // 'right' | 'wrong' | null
  const [dragIdx, setDragIdx] = useState(null);        // position being dragged
  const rowRefs = useRef([]);
  const dragPos = useRef(null);

  const submitted = result !== null;
  const correct = result === 'right';

  const move = (from, to) => {
    if (submitted || to < 0 || to >= order.length || from === to) return;
    setOrder((cur) => {
      const next = cur.slice();
      const [it] = next.splice(from, 1);
      next.splice(to, 0, it);
      return next;
    });
  };

  // Drag via the grip: as the pointer crosses a sibling row's midpoint, the
  // dragged row swaps past it. dragPos ref tracks the live index because
  // state updates lag pointermove events.
  const onGripDown = (pos) => (e) => {
    if (submitted) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    dragPos.current = pos;
    setDragIdx(pos);
  };
  const onGripMove = (e) => {
    const from = dragPos.current;
    if (from === null || submitted) return;
    const y = e.clientY;
    const above = rowRefs.current[from - 1]?.getBoundingClientRect();
    const below = rowRefs.current[from + 1]?.getBoundingClientRect();
    if (above && y < above.top + above.height / 2) {
      dragPos.current = from - 1;
      move(from, from - 1);
      setDragIdx(from - 1);
    } else if (below && y > below.top + below.height / 2) {
      dragPos.current = from + 1;
      move(from, from + 1);
      setDragIdx(from + 1);
    }
  };
  const onGripUp = () => {
    dragPos.current = null;
    setDragIdx(null);
  };

  const check = () => {
    if (submitted) return;
    const ok = order.every((itemIdx, pos) => itemIdx === pos);
    setResult(ok ? 'right' : 'wrong');
    onDone?.(ok);
  };

  // Feedback rides the shared 3-part panel: synthesize an answer/picked pair
  // so a wrong order shows the whyWrong string and a right one shows
  // whyCorrect + bestPractices, exactly like every MCQ surface.
  const feedbackQ = useMemo(() => ({
    answer: 0,
    whyWrong: question.whyWrong || null,
    whyCorrect: question.whyCorrect || null,
    bestPractices: question.bestPractices || null,
  }), [question]);

  return (
    <div>
      <div
        role="list"
        aria-label="Put these in order"
        style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
      >
        {order.map((itemIdx, pos) => {
          // Hydrated remounts show the canonical order neutrally — painting
          // green checks on every row while the verdict says "missed" reads
          // as a contradiction.
          const isRight = submitted && !initialResult && itemIdx === pos;
          const isWrong = submitted && !initialResult && itemIdx !== pos;
          const dragging = dragIdx === pos;
          return (
            <div
              key={itemIdx}
              role="listitem"
              ref={(el) => { rowRefs.current[pos] = el; }}
              tabIndex={submitted ? -1 : 0}
              aria-label={`Position ${pos + 1} of ${order.length}: ${items[itemIdx]}. ${submitted ? '' : 'Use arrow keys to move.'}`}
              onKeyDown={(e) => {
                if (submitted) return;
                if (e.key === 'ArrowUp') { e.preventDefault(); move(pos, pos - 1); }
                if (e.key === 'ArrowDown') { e.preventDefault(); move(pos, pos + 1); }
              }}
              className="dp-option"
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 10px',
                border: `1px solid ${isRight ? 'var(--status-success, #8FA876)' : isWrong ? 'var(--el-fire)' : dragging ? 'var(--accent-amber)' : 'var(--border-default)'}`,
                borderRadius: 10,
                background: dragging ? 'var(--bg-elevated)' : 'var(--bg-card)',
                boxShadow: dragging ? '0 4px 14px rgba(0,0,0,.35)' : 'none',
                cursor: 'default',
                userSelect: 'none',
              }}
            >
              {/* Drag grip — the ONLY surface that captures the pointer, so
                  the row text stays scrollable on touch. */}
              <span
                aria-hidden
                onPointerDown={onGripDown(pos)}
                onPointerMove={onGripMove}
                onPointerUp={onGripUp}
                onPointerCancel={onGripUp}
                style={{
                  touchAction: 'none',
                  cursor: submitted ? 'default' : 'grab',
                  color: 'var(--text-tertiary)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 14,
                  padding: '4px 2px',
                  lineHeight: 1,
                  flex: '0 0 auto',
                }}
              >
                ⠿
              </span>
              <span className="mono" style={{ fontSize: 10, color: 'var(--text-tertiary)', width: 14, flex: '0 0 auto' }}>
                {pos + 1}
              </span>
              <span style={{ flex: '1 1 auto', minWidth: 0, fontSize: 13, lineHeight: 1.4 }}>
                {items[itemIdx]}
              </span>
              {submitted ? (
                (isRight || isWrong) && (
                  <span aria-hidden style={{ flex: '0 0 auto', fontWeight: 700, color: isRight ? 'var(--status-success, #8FA876)' : 'var(--el-fire)' }}>
                    {isRight ? '✓' : '✗'}
                  </span>
                )
              ) : (
                <span style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: '0 0 auto' }}>
                  <button
                    type="button"
                    aria-label={`Move "${items[itemIdx]}" up`}
                    disabled={pos === 0}
                    onClick={() => move(pos, pos - 1)}
                    style={{ background: 'transparent', border: 'none', color: pos === 0 ? 'var(--border-default)' : 'var(--text-secondary)', cursor: pos === 0 ? 'default' : 'pointer', padding: '0 4px', fontSize: 11, lineHeight: 1.2 }}
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    aria-label={`Move "${items[itemIdx]}" down`}
                    disabled={pos === order.length - 1}
                    onClick={() => move(pos, pos + 1)}
                    style={{ background: 'transparent', border: 'none', color: pos === order.length - 1 ? 'var(--border-default)' : 'var(--text-secondary)', cursor: pos === order.length - 1 ? 'default' : 'pointer', padding: '0 4px', fontSize: 11, lineHeight: 1.2 }}
                  >
                    ▼
                  </button>
                </span>
              )}
            </div>
          );
        })}
      </div>

      {!submitted && (
        <button type="button" className="btn btn-primary btn-block" style={{ marginTop: 10 }} onClick={check}>
          Check order
        </button>
      )}

      {submitted && (
        <>
          {initialResult && (
            <p className="caption" style={{ margin: '8px 0 0' }}>
              {correct ? '✓ You ordered this correctly earlier — shown in the right order.' : '✗ Missed earlier — this is the right order.'}
            </p>
          )}
          <FeedbackPanel question={feedbackQ} picked={correct ? 0 : -1} />
        </>
      )}
    </div>
  );
}
