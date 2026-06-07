import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore, getReviewsDue } from '../store/useStore.js';
import { PATHS } from '../data/content.js';
import CelebrationMoment from '../components/CelebrationMoment.jsx';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts.js';

// Reviews — the spaced-repetition session screen.
//
// One concept on screen at a time, full attention. The user types a free-recall
// attempt, hits Reveal, then self-grades on a 4-button scale. The self-grade
// drives the FSRS-flavored scheduler in the store (markReviewed = scheduleReview
// + recordActivity so the session also counts toward the daily streak).
//
// Concept-flow rationale (ADHD-friendly):
//   - One question per screen → no choice overload.
//   - Big serif title → the concept IS the focal point.
//   - Progress chip top-right → visible progress, no scroll surprises.
//   - 4 grade buttons in a row at ≥375px, stack 2×2 below that (CSS handles it).
//   - Auto-advance after grade selection so flow stays smooth.
//
// We snapshot the due list on mount. If the user grades a concept and the
// scheduler pushes its next due-date to tomorrow, we don't want it to vanish
// mid-session (or, worse, the index to jump). The session ends naturally
// when we walk off the end of the snapshot.

// Build a flat lookup from lesson ID → { lesson, pathName } so the title +
// tagline render cheaply. Computed once per session.
function buildLessonIndex() {
  const idx = {};
  for (const key of Object.keys(PATHS)) {
    const p = PATHS[key];
    for (const l of p.lessons) {
      idx[l.id] = { lesson: l, pathName: p.name };
    }
  }
  return idx;
}

const GRADES = [
  { g: 1, label: '✗ Miss',  tone: 'var(--el-fire)',         hint: 'Forgot it'          },
  { g: 2, label: 'Hard',    tone: 'var(--accent-amber)',    hint: 'Slow / partial'     },
  { g: 3, label: 'Good',    tone: 'var(--status-success)',  hint: 'Came back to me'    },
  { g: 4, label: 'Easy',    tone: 'var(--el-water)',        hint: 'Knew it instantly'  },
];

export default function Reviews() {
  const nav = useNavigate();
  const reviewQueue = useStore((s) => s.reviewQueue);
  const markReviewed = useStore((s) => s.markReviewed);

  // Snapshot due IDs at mount so grading doesn't shuffle the deck mid-session.
  const dueIds = useMemo(
    () => getReviewsDue({ reviewQueue: reviewQueue || {} }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const lessonIndex = useMemo(() => buildLessonIndex(), []);

  const [idx, setIdx] = useState(0);
  const [typed, setTyped] = useState('');
  const [revealed, setRevealed] = useState(false);

  const total = dueIds.length;
  const done = idx >= total;

  // Keyboard shortcuts: Enter / Space reveal; 1-4 grade the recall. The
  // hook ignores keystrokes while focus is in the textarea, so Enter still
  // adds newlines while the user types — they reveal by blurring (Tab) and
  // pressing Enter, or by clicking the Reveal button. After reveal the
  // textarea is disabled so 1-4 fire cleanly. All handlers are no-ops when
  // the session is done or the lesson catalog is out of sync (conceptId
  // missing) — we MUST call the hook unconditionally to keep hook order
  // stable across the empty-deck / catalog-skew early returns below.
  const conceptIdNow = !done ? dueIds[idx] : null;
  const canGrade = revealed && !done && !!conceptIdNow;
  useKeyboardShortcuts(
    {
      Enter: () => {
        if (done) return;
        if (!revealed && typed.trim().length > 0) setRevealed(true);
      },
      ' ': () => {
        if (done) return;
        if (!revealed && typed.trim().length > 0) setRevealed(true);
      },
      1: () => {
        if (!canGrade) return;
        markReviewed(conceptIdNow, 1);
        setTyped(''); setRevealed(false); setIdx(idx + 1);
      },
      2: () => {
        if (!canGrade) return;
        markReviewed(conceptIdNow, 2);
        setTyped(''); setRevealed(false); setIdx(idx + 1);
      },
      3: () => {
        if (!canGrade) return;
        markReviewed(conceptIdNow, 3);
        setTyped(''); setRevealed(false); setIdx(idx + 1);
      },
      4: () => {
        if (!canGrade) return;
        markReviewed(conceptIdNow, 4);
        setTyped(''); setRevealed(false); setIdx(idx + 1);
      },
    },
    [idx, typed, revealed, done, conceptIdNow, canGrade, markReviewed],
  );

  // Empty-deck state: render the "all reviewed" card immediately.
  if (total === 0 || done) {
    return (
      <div className="screen fade-in">
        {/* Mount here too: grading the last card flips `done`, unmounting the
            active branch's CelebrationMoment before it could show the XP/level/
            badge burst. A fresh mount runs its effect with `celebrate` set. */}
        <CelebrationMoment />
        <div className="reviews-header row">
          <span className="kicker">REVIEW · DONE</span>
        </div>
        <div className="card reviews-done">
          <div style={{ fontSize: 36, marginBottom: 6 }} aria-hidden>✓</div>
          <div
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 22,
              fontWeight: 700,
              marginBottom: 6,
            }}
          >
            {total === 0
              ? 'Nothing due — yet'
              : `Reviewed all ${total} due concept${total === 1 ? '' : 's'}`}
          </div>
          <p className="caption" style={{ marginBottom: 14 }}>
            {total === 0
              ? 'Finish a lesson and it joins the spaced-repetition queue.'
              : 'Come back tomorrow — spacing is doing the work now.'}
          </p>
          <button
            type="button"
            className="btn btn-primary btn-block"
            onClick={() => nav('/')}
          >
            Back to home →
          </button>
        </div>
      </div>
    );
  }

  const conceptId = dueIds[idx];
  const meta = lessonIndex[conceptId];
  // Defensive: a concept could be missing if the lesson catalog changed
  // between persist and load. Skip it cleanly.
  if (!meta) {
    return (
      <div className="screen fade-in">
        <div className="card">
          <p className="caption">Lesson catalog out of sync — skipping.</p>
          <button
            type="button"
            className="btn btn-block"
            onClick={() => { setTyped(''); setRevealed(false); setIdx(idx + 1); }}
          >
            Next →
          </button>
        </div>
      </div>
    );
  }
  const { lesson, pathName } = meta;
  const tagline = lesson.tagline || lesson.title;

  const reveal = () => {
    if (revealed) return;
    setRevealed(true);
  };
  const grade = (g) => {
    markReviewed(conceptId, g);
    // Auto-advance: reset typed + revealed and walk the snapshot index forward.
    setTyped('');
    setRevealed(false);
    setIdx(idx + 1);
  };

  return (
    <div className="screen fade-in">
      {/* XP / level / badge celebration overlay. Fires when markReviewed
          awards XP (+3 hard, +6 good/easy) or crosses a level boundary. */}
      <CelebrationMoment />
      <div className="reviews-header row">
        <span className="kicker">REVIEW · {idx + 1}/{total}</span>
        <span className="spacer" />
        <span className="reviews-progress-chip mono">
          {total - idx} left
        </span>
      </div>

      <div className="card reviews-card">
        <div
          className="mono"
          style={{
            fontSize: 9,
            color: 'var(--text-tertiary)',
            letterSpacing: '.16em',
            textTransform: 'uppercase',
            marginBottom: 8,
          }}
        >
          {pathName}
        </div>
        <div className="reviews-title">{lesson.title}</div>
        <div className="reviews-prompt">
          Recall: what is <em>{lesson.title}</em>?
        </div>

        <textarea
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          disabled={revealed}
          placeholder="Type what you remember…"
          aria-label="Your recall attempt"
          rows={4}
          className="reviews-textarea"
        />

        {!revealed && (
          <button
            type="button"
            className="btn btn-primary btn-block"
            style={{ marginTop: 10 }}
            onClick={reveal}
            disabled={typed.trim().length === 0}
            title={typed.trim().length === 0 ? 'Type something first' : 'Reveal the answer'}
          >
            Reveal
          </button>
        )}

        {revealed && (
          <div className="reviews-reveal">
            <div className="kicker" style={{ color: 'var(--status-success)', marginBottom: 4 }}>
              ANSWER
            </div>
            <div className="reviews-answer">{tagline}</div>
          </div>
        )}
      </div>

      {revealed && (
        <div className="reviews-grades" role="group" aria-label="Self-grade your recall">
          {GRADES.map((G) => (
            <button
              key={G.g}
              type="button"
              className="reviews-grade-btn"
              style={{ borderColor: G.tone, color: G.tone }}
              onClick={() => grade(G.g)}
              title={G.hint}
            >
              <span className="reviews-grade-label">{G.label}</span>
              <span className="reviews-grade-hint">{G.hint}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
