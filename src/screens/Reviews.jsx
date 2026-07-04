import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore, getReviewsDue } from '../store/useStore.js';
import { PATHS } from '../data/content.js';
import { pickReviewQuestion } from '../data/battles.js';
import CelebrationMoment from '../components/CelebrationMoment.jsx';
import FeedbackPanel from '../components/FeedbackPanel.jsx';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts.js';

// Reviews — the spaced-repetition session screen.
//
// DEFAULT MODE IS QUIZ (owner decision): each due concept asks one
// multiple-choice question drawn from that lesson's own material — the
// lesson's math-quiz bank first, then title-matched questions from its
// path's daily bank — exactly like daily practice. Right = grade 3 (good),
// wrong = grade 1 (miss) + a weak-spot entry, so the FSRS card is still
// graded honestly. With 90 cards due, typed recall is a wall; recognition
// reviews that HAPPEN beat production reviews that don't.
//
// The typed free-recall flow survives behind a header toggle ("Recall
// mode") for the harder workout — production retrieval is still the
// stronger rep when the user opts in — and as the automatic per-card
// fallback when a lesson has no quizzable material.
//
// Concept-flow rationale (ADHD-friendly):
//   - One question per screen → no choice overload.
//   - Progress chip top-right → visible progress, no scroll surprises.
//   - Auto-grade on answer + explicit Continue so feedback gets READ.
//
// We snapshot the due list on mount. If the user grades a concept and the
// scheduler pushes its next due-date to tomorrow, we don't want it to vanish
// mid-session (or, worse, the index to jump). The session ends naturally
// when we walk off the end of the snapshot.

// Local-calendar day stamp, 'YYYY-MM-DD'. Mirrors the store's internal
// isoDay() (local date parts — NOT toISOString, which is UTC and flips the
// day at the wrong wall-clock hour). Used as a memo dep so the due snapshot
// refreshes on the first render after local midnight.
function isoDayString(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

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
  const recordQuizMiss = useStore((s) => s.recordQuizMiss);
  const clearQuizMiss = useStore((s) => s.clearQuizMiss);
  const quizMisses = useStore((s) => s.quizMisses);
  const reviewMode = useStore((s) => s.settings?.reviewMode) || 'quiz';
  const setSetting = useStore((s) => s.setSetting);

  // Snapshot due IDs at mount so grading doesn't shuffle the deck mid-session
  // (reviewQueue is deliberately NOT a dep). `today` IS a dep: getReviewsDue
  // compares against the local day internally, so a session left open past
  // midnight kept serving yesterday's snapshot — the day stamp re-snapshots
  // on the first render after the local day flips. No timers; a re-render
  // must happen for the refresh, which is acceptable.
  const today = isoDayString();
  const dueIds = useMemo(
    () => getReviewsDue({ reviewQueue: reviewQueue || {} }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [today],
  );
  const lessonIndex = useMemo(() => buildLessonIndex(), []);

  const [idx, setIdx] = useState(0);
  const [typed, setTyped] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [picked, setPicked] = useState(null); // quiz mode: chosen option index

  const total = dueIds.length;
  const done = idx >= total;
  const conceptIdNow = !done ? dueIds[idx] : null;

  // Quiz-mode question for the current card, deterministic per concept.
  // Null (no bank material) drops this card to the recall flow.
  const q = useMemo(
    () => (reviewMode === 'quiz' && conceptIdNow ? pickReviewQuestion(conceptIdNow, 0) : null),
    [reviewMode, conceptIdNow],
  );
  const quizActive = reviewMode === 'quiz' && !!q;

  const advance = () => {
    setTyped(''); setRevealed(false); setPicked(null); setIdx((i) => i + 1);
  };

  // Answer a quiz option: grade the FSRS card immediately (right=good,
  // wrong=miss + weak spot), then hold for Continue so the why gets read.
  const pick = (i) => {
    if (!quizActive || picked !== null || done) return;
    setPicked(i);
    const correct = i === q.answer;
    if (correct) {
      markReviewed(conceptIdNow, 3);
      if (q.lessonId && quizMisses?.[q.lessonId]?.[q.q]) clearQuizMiss(q.lessonId, q.q);
    } else {
      markReviewed(conceptIdNow, 1);
      const canonical = q.origIndex?.[i];
      recordQuizMiss(
        q.lessonId || '__daily_practice__',
        q.q,
        q.lessonId && Number.isInteger(canonical) && canonical <= 3 ? canonical : null,
      );
    }
  };

  const canGrade = revealed && !done && !!conceptIdNow;
  useKeyboardShortcuts(
    {
      Enter: () => {
        if (done) return;
        if (quizActive) { if (picked !== null) advance(); return; }
        if (!revealed && typed.trim().length > 0) setRevealed(true);
      },
      ' ': () => {
        if (done) return;
        if (quizActive) { if (picked !== null) advance(); return; }
        if (!revealed && typed.trim().length > 0) setRevealed(true);
      },
      1: () => {
        if (quizActive) { pick(0); return; }
        if (!canGrade) return; markReviewed(conceptIdNow, 1); advance();
      },
      2: () => {
        if (quizActive) { pick(1); return; }
        if (!canGrade) return; markReviewed(conceptIdNow, 2); advance();
      },
      3: () => {
        if (quizActive) { pick(2); return; }
        if (!canGrade) return; markReviewed(conceptIdNow, 3); advance();
      },
      4: () => {
        if (quizActive) { pick(3); return; }
        if (!canGrade) return; markReviewed(conceptIdNow, 4); advance();
      },
    },
    [idx, typed, revealed, done, conceptIdNow, canGrade, markReviewed, quizActive, picked, q],
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
          <button type="button" className="btn btn-block" onClick={advance}>
            Next →
          </button>
        </div>
      </div>
    );
  }
  const { lesson, pathName } = meta;
  const tagline = lesson.tagline || lesson.title;

  const header = (
    <div className="reviews-header row">
      <span className="kicker">REVIEW · {idx + 1}/{total}</span>
      <span className="spacer" />
      <button
        type="button"
        className="pill"
        style={{
          background: 'var(--accent-amber-bg)', color: 'var(--accent-amber)',
          fontSize: 10, padding: '4px 10px', border: 'none', cursor: 'pointer',
          marginRight: 6, font: 'inherit',
        }}
        onClick={() => setSetting('reviewMode', reviewMode === 'quiz' ? 'recall' : 'quiz')}
        title={reviewMode === 'quiz'
          ? 'Switch to typed free recall (the harder, stronger rep)'
          : 'Switch to quiz questions (like daily practice)'}
      >
        {reviewMode === 'quiz' ? '🖊 Recall mode' : '☑ Quiz mode'}
      </button>
      <span className="reviews-progress-chip mono">
        {total - idx} left
      </span>
    </div>
  );

  // ── Quiz mode (default): one MCQ from the due lesson's material ────────
  if (quizActive) {
    return (
      <div className="screen fade-in">
        <CelebrationMoment />
        {header}
        <div className="card reviews-card">
          <div
            className="mono"
            style={{
              fontSize: 9, color: 'var(--text-tertiary)',
              letterSpacing: '.16em', textTransform: 'uppercase', marginBottom: 8,
            }}
          >
            {pathName} · {lesson.title}
          </div>
          <p style={{ fontSize: 14.5, fontWeight: 500, margin: '0 0 10px', lineHeight: 1.45 }}>{q.q}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {q.opts.map((o, i) => {
              let cls = 'btn dp-option';
              if (picked !== null && i === q.answer) cls += ' dp-correct';
              else if (picked !== null && i === picked) cls += ' dp-wrong';
              return (
                <button key={i} type="button" className={cls} disabled={picked !== null} onClick={() => pick(i)}>
                  <span className="dp-letter">{String.fromCharCode(65 + i)}</span>
                  <span className="dp-text">{o}</span>
                </button>
              );
            })}
          </div>
          {picked !== null && <FeedbackPanel question={q} picked={picked} />}
        </div>
        {picked !== null && (
          <button type="button" className="btn btn-primary btn-block" onClick={advance}>
            {picked === q.answer ? 'Held — next →' : 'Noted for weak spots — next →'}
          </button>
        )}
      </div>
    );
  }

  // ── Recall mode (toggle, or per-card fallback when no quiz exists) ─────
  const reveal = () => { if (!revealed) setRevealed(true); };
  const grade = (g) => { markReviewed(conceptId, g); advance(); };

  return (
    <div className="screen fade-in">
      {/* XP / level / badge celebration overlay. Fires when markReviewed
          awards XP (+3 hard, +6 good/easy) or crosses a level boundary. */}
      <CelebrationMoment />
      {header}

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
