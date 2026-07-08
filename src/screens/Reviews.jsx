import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore, getReviewsDue } from '../store/useStore.js';
import { PATHS } from '../data/content.js';
import { pickReviewQuestion } from '../data/battles.js';
import CelebrationMoment from '../components/CelebrationMoment.jsx';
import FeedbackPanel from '../components/FeedbackPanel.jsx';
import OrderQuestion from '../components/OrderQuestion.jsx';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts.js';

// Reviews — the spaced-repetition session screen.
//
// Every due concept asks ONE multiple-choice question drawn from that
// lesson's own material — the lesson's math-quiz bank first, then
// title-matched questions from its path's daily bank — exactly like daily
// practice, salted by the card's rep count so successive reviews draw
// different probes. Right = grade 3 ("Held it") or grade 2 ("That was
// close" — shaky recall returns sooner), wrong = grade 1 (miss) + a
// weak-spot entry, so the FSRS card is graded honestly and misses stay
// actionable.
// (Typed free-recall was removed by owner decision: reviews that HAPPEN
// beat production reviews that don't. The whyWrong/whyCorrect feedback
// after every answer carries the learning.)
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

// Comeback session cap: a multi-day lapser opening Reviews to a 40-card
// backlog is the moment retention products lose people. The first session
// back keeps the CAP most-overdue cards (the due list is sorted oldest-due
// first) and defers the rest — spacing genuinely doesn't care, tomorrow is
// fine, and the done screen says so.
const COMEBACK_GAP_DAYS = 3;
const COMEBACK_CAP = 8;

export default function Reviews() {
  const nav = useNavigate();
  const reviewQueue = useStore((s) => s.reviewQueue);
  const markReviewed = useStore((s) => s.markReviewed);
  const recordQuizMiss = useStore((s) => s.recordQuizMiss);
  const clearQuizMiss = useStore((s) => s.clearQuizMiss);
  const quizMisses = useStore((s) => s.quizMisses);
  const lastActivityDate = useStore((s) => s.lastActivityDate);

  // Snapshot due IDs at mount so grading doesn't shuffle the deck mid-session
  // (reviewQueue is deliberately NOT a dep — and neither is lastActivityDate:
  // grading the FIRST card flips it to today, which must not re-expand a
  // capped comeback session mid-flow). `today` IS a dep: getReviewsDue
  // compares against the local day internally, so a session left open past
  // midnight kept serving yesterday's snapshot — the day stamp re-snapshots
  // on the first render after the local day flips. No timers; a re-render
  // must happen for the refresh, which is acceptable.
  const today = isoDayString();
  const { dueIds, deferred } = useMemo(() => {
    const all = getReviewsDue({ reviewQueue: reviewQueue || {} });
    const last = Date.parse(lastActivityDate || '');
    const gap = Number.isFinite(last)
      ? Math.round((Date.parse(today) - last) / 86400000)
      : 0;
    if (gap >= COMEBACK_GAP_DAYS && all.length > COMEBACK_CAP) {
      return { dueIds: all.slice(0, COMEBACK_CAP), deferred: all.length - COMEBACK_CAP };
    }
    return { dueIds: all, deferred: 0 };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today]);
  const lessonIndex = useMemo(() => buildLessonIndex(), []);

  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null); // chosen option index this card (MCQ)
  const [orderResult, setOrderResult] = useState(null); // 'right'|'wrong' (order kind)

  const total = dueIds.length;
  const done = idx >= total;
  const conceptIdNow = !done ? dueIds[idx] : null;

  // The question for the current card — salted by the card's rep count so
  // each successive review draws a DIFFERENT question (and a fresh option
  // permutation) from the lesson's material. Without the salt the picker is
  // fully deterministic and a concept gets the identical question with the
  // identical option order forever — by the 2nd-3rd review the user is
  // memorizing an answer letter, not retaining a concept. Null only when
  // the lesson can't be resolved (catalog skew) — handled by the skip card.
  // Deps stay [conceptIdNow] ON PURPOSE: grading a wrong answer bumps reps
  // mid-card, and re-salting then would swap the question under the open
  // feedback panel.
  const q = useMemo(
    () => (conceptIdNow
      ? pickReviewQuestion(conceptIdNow, reviewQueue?.[conceptIdNow]?.reps || 0)
      : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [conceptIdNow],
  );

  const advance = () => { setPicked(null); setOrderResult(null); setIdx((i) => i + 1); };

  const isOrder = q?.kind === 'order';
  // Unified answered state across both question kinds — the continue rows
  // and keyboard handlers key off these, not off MCQ internals.
  const answeredCorrect = isOrder ? orderResult === 'right' : (q != null && picked !== null && picked === q.answer);
  const answeredWrong = isOrder ? orderResult === 'wrong' : (q != null && picked !== null && picked !== q.answer);

  // Answer an option. Wrong = grade the FSRS card immediately (miss + weak
  // spot) and hold for Continue so the why gets read. Correct = hold the
  // grade until the Continue row, where "Held it" grades 3 and "That was
  // close" grades 2 — the shaky-but-correct signal the scheduler lost when
  // free recall was removed (HANDOFF §4's scoped follow-up).
  const pick = (i) => {
    if (!q || isOrder || picked !== null || done) return;
    setPicked(i);
    const correct = i === q.answer;
    if (correct) {
      if (q.lessonId && quizMisses?.[q.lessonId]?.[q.q]) clearQuizMiss(q.lessonId, q.q);
      else if (!q.lessonId && quizMisses?.__daily_practice__?.[q.q]) clearQuizMiss('__daily_practice__', q.q);
    } else {
      markReviewed(conceptIdNow, 1);
      const canonical = q.origIndex?.[i];
      recordQuizMiss(
        q.lessonId || '__daily_practice__',
        q.q,
        // Only canonical BANK slots are recordable (a borrowed 4th
        // distractor has no slot in the bank's option list).
        q.lessonId && Number.isInteger(canonical) && canonical < (q.bankOpts ?? 4) ? canonical : null,
      );
    }
  };

  // Order-kind check result — same grading contract as pick(): wrong grades
  // immediately + files the weak spot, right holds for the Held/Close row.
  const onOrderDone = (correct) => {
    if (!q || !isOrder || orderResult !== null || done) return;
    setOrderResult(correct ? 'right' : 'wrong');
    if (correct) {
      if (q.lessonId && quizMisses?.[q.lessonId]?.[q.q]) clearQuizMiss(q.lessonId, q.q);
      else if (!q.lessonId && quizMisses?.__daily_practice__?.[q.q]) clearQuizMiss('__daily_practice__', q.q);
    } else {
      markReviewed(conceptIdNow, 1);
      recordQuizMiss(q.lessonId || '__daily_practice__', q.q, null);
    }
  };

  // Continue after a CORRECT answer: grade 3 (held) or 2 (close) then move on.
  const finishCorrect = (grade) => {
    if (done || !answeredCorrect) return;
    markReviewed(conceptIdNow, grade);
    advance();
  };

  useKeyboardShortcuts(
    {
      // Enter/Space = the primary continue: "Held it" on a correct answer,
      // plain advance on a wrong one (already graded at answer time).
      Enter: () => { if (!done && (answeredCorrect || answeredWrong)) (answeredCorrect ? finishCorrect(3) : advance()); },
      ' ': () => { if (!done && (answeredCorrect || answeredWrong)) (answeredCorrect ? finishCorrect(3) : advance()); },
      1: () => pick(0),
      2: () => pick(1),
      3: () => pick(2),
      4: () => pick(3),
    },
    [idx, done, conceptIdNow, picked, q, orderResult],
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
              : deferred > 0
                ? `${deferred} more can wait until tomorrow — coming back was the hard part, and you did it.`
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
  // between persist and load (q is null for the same reason). Skip cleanly.
  if (!meta || !q) {
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

  return (
    <div className="screen fade-in">
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
            fontSize: 9, color: 'var(--text-tertiary)',
            letterSpacing: '.16em', textTransform: 'uppercase', marginBottom: 8,
          }}
        >
          {pathName} · {lesson.title}
        </div>
        <p style={{ fontSize: 14.5, fontWeight: 500, margin: '0 0 10px', lineHeight: 1.45 }}>{q.q}</p>
        {isOrder ? (
          /* Drag-to-order card — grading + feedback live inside the component. */
          <OrderQuestion key={conceptIdNow} question={q} onDone={onOrderDone} />
        ) : (
          <>
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
          </>
        )}
      </div>
      {(answeredCorrect || answeredWrong) && (answeredCorrect ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <button type="button" className="btn btn-primary btn-block" onClick={() => finishCorrect(3)}>
            Held it — next →
          </button>
          {/* Secondary, quieter: the honest "I almost lost that one" tap.
              Grade 2 brings the card back sooner (and pays less). */}
          <button
            type="button"
            className="btn btn-block"
            style={{ fontSize: 12.5, opacity: 0.85 }}
            onClick={() => finishCorrect(2)}
          >
            That was close — bring it back sooner
          </button>
        </div>
      ) : (
        <button type="button" className="btn btn-primary btn-block" onClick={advance}>
          Noted for weak spots — next →
        </button>
      ))}
    </div>
  );
}
