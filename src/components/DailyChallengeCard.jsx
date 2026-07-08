import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore.js';
import { PATHS, PATH_KEYS } from '../data/content.js';
import FeedbackPanel from './FeedbackPanel.jsx';

// DailyChallengeCard — pinned MCQ card on Home. ONE question per day, drawn
// from concepts the user has already learned via the SAME picker every other
// testing surface uses (pickReviewQuestion — normalized, option-shuffled,
// whyWrong-carrying), salted by the calendar date so each day asks fresh.
// The user picks an option, then states confidence (guess/likely/certain) —
// only the confidence tap reveals the verdict and records calibration, the
// challenge's stated reason to exist. (The old tap-to-reveal self-grade
// fallback is gone: every testing surface is MCQ + feedback by owner
// decision, and the self-grade path also never wrote calibration.)
// Visual contract (locked):
//   - amber gradient header, 12px padding, amber border
//   - kicker "🎯 TODAY'S CHALLENGE · ~60s"
//   - after answer: ✓/✗ + FeedbackPanel + XP chip + streak chip
//   - collapses to "✓ Done — back tomorrow" with streak counter
//   - empty state (no completions yet) links to first incomplete lesson
//
// Selection + +5 XP + streak + scheduler bookkeeping live in the store
// (pickDailyChallenge / answerDailyChallenge).

// Module-level cache for the lazily-loaded battles chunk. pickReviewQuestion
// lives in battles.js, which drags the full question banks — that chunk must
// NOT ride the eager bundle (Home imports this card), so it's fetched on
// first mount and reused synchronously after (same pattern as DailyPractice's
// dailyQuestions chunk).
let battlesMod = null;

export default function DailyChallengeCard() {
  const nav = useNavigate();
  const dailyChallenge = useStore((s) => s.dailyChallenge);
  const dailyChallengeStreak = useStore((s) => s.dailyChallengeStreak);
  const completed = useStore((s) => s.completed);
  const pickDailyChallenge = useStore((s) => s.pickDailyChallenge);
  const answerDailyChallenge = useStore((s) => s.answerDailyChallenge);

  // Pick (or reuse) today's challenge on mount + whenever completion set
  // changes (a fresh lesson completion could unlock the empty-state user).
  useEffect(() => {
    pickDailyChallenge();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Object.keys(completed || {}).length]);

  // Lazy-load the question picker (see battlesMod note above). The state
  // holds the FUNCTION itself — both the initializer and setPicker use the
  // callback form so React never mistakes the fn for an updater.
  const [pickFn, setPicker] = useState(() => (battlesMod ? battlesMod.pickReviewQuestion : null));
  useEffect(() => {
    let alive = true;
    if (battlesMod) return undefined;
    import('../data/battles.js').then((m) => {
      battlesMod = m;
      if (alive) setPicker(() => m.pickReviewQuestion);
    }).catch(() => {});
    return () => { alive = false; };
  }, []);

  // Resolve the concept's display title from PATHS metadata.
  const conceptId = dailyChallenge?.conceptId || null;
  const conceptMeta = useMemo(() => {
    if (!conceptId) return null;
    for (const p of Object.values(PATHS)) {
      const hit = p.lessons.find((l) => l.id === conceptId);
      if (hit) return { lesson: hit };
    }
    return null;
  }, [conceptId]);

  // Today's question: deterministic per (concept, calendar day) so remounts
  // re-serve the same challenge, different days draw different probes.
  // Order-kind picks re-salt a few times — the challenge card's pick →
  // confidence → verdict flow is built around a single MCQ tap, so drag-to-
  // order questions stay on the practice/review surfaces.
  const challenge = useMemo(() => {
    if (!conceptMeta) return null;
    if (!pickFn) return { kind: 'loading', title: 'Loading…' };
    const daySalt = Number((dailyChallenge?.date || '').replaceAll('-', '')) || 0;
    let q = null;
    for (let s = 0; s < 4; s += 1) {
      q = pickFn(conceptId, daySalt + s);
      if (q && q.kind !== 'order') break;
    }
    return q && q.kind !== 'order' ? { kind: 'mcq', q } : { kind: 'review-link' };
  }, [conceptId, conceptMeta, pickFn, dailyChallenge?.date]);

  // --- Empty state: zero completions ---------------------------------------
  if (!conceptId) {
    const firstIncomplete = firstIncompleteLesson(completed);
    return (
      <button
        type="button"
        className="card daily-challenge daily-empty"
        onClick={() => firstIncomplete && nav(`/lesson/${firstIncomplete.id}`)}
        aria-label="Daily challenge — complete your first lesson to unlock"
      >
        <div className="kicker daily-kicker">🎯 TODAY&apos;S CHALLENGE</div>
        <div className="daily-empty-title">
          Complete your first lesson to unlock daily challenges
        </div>
        <div className="daily-empty-cta">
          {firstIncomplete ? `→ ${firstIncomplete.title}` : '→ Browse lessons'}
        </div>
      </button>
    );
  }

  // --- Done state: already answered today ----------------------------------
  if (dailyChallenge?.answered) {
    const verdict = dailyChallenge.correct;
    return (
      <div className="card daily-challenge daily-done" role="status" aria-live="polite">
        <div className="kicker daily-kicker">
          🎯 TODAY&apos;S CHALLENGE · {verdict ? 'CORRECT' : 'MISSED'}
        </div>
        <div className="daily-done-row">
          <span className="daily-done-tick" aria-hidden>{verdict ? '✓' : '✗'}</span>
          <span className="daily-done-msg">
            {verdict ? 'Done — back tomorrow' : 'Tried — back tomorrow for a new one'}
          </span>
        </div>
        <div className="daily-chip-row">
          <span className="daily-chip daily-chip-streak">
            🔥 {dailyChallengeStreak}-day challenge streak
          </span>
        </div>
      </div>
    );
  }

  // --- Loading state: the question-bank chunk isn't here yet ---------------
  // Render a non-interactive stub until the picker can deal a real question —
  // never burn the day's challenge on a placeholder.
  if (!challenge || challenge.kind === 'loading') {
    return (
      <div className="card daily-challenge" aria-busy="true">
        <div className="kicker daily-kicker">🎯 TODAY&apos;S CHALLENGE · ~60s</div>
        <div className="daily-title">{challenge?.title || 'Loading…'}</div>
      </div>
    );
  }

  // --- No bank covers this concept (catalog skew) — honest fallback --------
  // No self-grade theater: link to the lesson instead. The day's challenge
  // stays unanswered, which is correct — nothing was tested.
  if (challenge.kind === 'review-link') {
    return (
      <button
        type="button"
        className="card daily-challenge daily-empty"
        onClick={() => nav(`/lesson/${conceptId}`)}
        aria-label="Daily challenge — revisit this concept"
      >
        <div className="kicker daily-kicker">🎯 TODAY&apos;S CHALLENGE</div>
        <div className="daily-empty-title">
          No quiz covers {conceptMeta?.lesson?.title || 'this concept'} yet — give it a re-read instead
        </div>
        <div className="daily-empty-cta">→ Open the lesson</div>
      </button>
    );
  }

  // --- Active state: question to answer -------------------------------------
  // Keyed by concept so picked state can't carry across logically different
  // questions when the challenge object changes mid-interaction.
  return (
    <ActiveChallenge
      key={dailyChallenge.conceptId}
      challenge={challenge}
      conceptMeta={conceptMeta}
      onAnswer={(correct, confidence) => answerDailyChallenge(correct, confidence)}
    />
  );
}

// ── Active card body — shown when the user has a fresh challenge ────────────
// Commit-then-reveal: pick an option, THEN state your confidence — only the
// confidence tap reveals the verdict, records calibration, and grades the
// store. Weak-spot bookkeeping mirrors Reviews: a miss files the question
// (canonical option index via origIndex), a correct answer clears any prior
// miss on the same prompt.
function ActiveChallenge({ challenge, conceptMeta, onAnswer }) {
  const [picked, setPicked] = useState(null);          // option index
  const [confidence, setConfidence] = useState(null);  // 'guess'|'likely'|'certain'
  const recordQuizMiss = useStore((s) => s.recordQuizMiss);
  const clearQuizMiss = useStore((s) => s.clearQuizMiss);
  const quizMisses = useStore((s) => s.quizMisses);

  const q = challenge.q;

  const pickOption = (i) => {
    if (picked !== null) return;
    setPicked(i);
  };
  const chooseConfidence = (level) => {
    if (picked === null || confidence !== null) return;
    setConfidence(level);
    const isCorrect = picked === q.answer;
    onAnswer(isCorrect, level);
    if (isCorrect) {
      if (q.lessonId && quizMisses?.[q.lessonId]?.[q.q]) clearQuizMiss(q.lessonId, q.q);
      else if (!q.lessonId && quizMisses?.__daily_practice__?.[q.q]) clearQuizMiss('__daily_practice__', q.q);
    } else {
      const canonical = q.origIndex?.[picked];
      recordQuizMiss(
        q.lessonId || '__daily_practice__',
        q.q,
        // Only canonical BANK slots are recordable (a borrowed 4th
        // distractor has no slot in the bank's option list).
        q.lessonId && Number.isInteger(canonical) && canonical < (q.bankOpts ?? 4) ? canonical : null,
      );
    }
  };

  const answered = picked !== null && confidence !== null;
  const correct = picked === q.answer;

  return (
    <div className="card daily-challenge">
      <div className="kicker daily-kicker">🎯 TODAY&apos;S CHALLENGE · ~60s</div>
      <div className="daily-title">{q.q}</div>
      {conceptMeta?.lesson?.title && (
        <div className="daily-source mono">
          FROM · {conceptMeta.lesson.title.toUpperCase()}
        </div>
      )}

      <div className="daily-opts">
        {q.opts.map((opt, i) => {
          const isAnswer = i === q.answer;
          const wasPicked = picked === i;
          let cls = 'daily-opt';
          if (answered && isAnswer) cls += ' daily-opt-correct';
          else if (answered && wasPicked) cls += ' daily-opt-wrong';
          else if (!answered && wasPicked) cls += ' daily-opt-selected';
          return (
            <button
              key={i}
              type="button"
              className={cls}
              disabled={picked !== null}
              onClick={() => pickOption(i)}
              data-juice={answered && wasPicked ? (isAnswer ? 'pop' : 'shake') : undefined}
              data-xp={answered && wasPicked && isAnswer ? 5 : undefined}
            >
              <span className="daily-opt-letter">{String.fromCharCode(65 + i)}</span>
              <span className="daily-opt-text">{opt}</span>
              {answered && isAnswer && <span className="daily-opt-mark" aria-hidden>✓</span>}
              {answered && wasPicked && !isAnswer && <span className="daily-opt-mark" aria-hidden>✗</span>}
            </button>
          );
        })}
      </div>

      {picked !== null && confidence === null && (
        <div className="daily-confidence">
          <div className="daily-confidence-q mono">HOW SURE ARE YOU?</div>
          <div className="daily-confidence-opts">
            <button type="button" className="daily-conf-btn" onClick={() => chooseConfidence('guess')}>🤷 Guess</button>
            <button type="button" className="daily-conf-btn" onClick={() => chooseConfidence('likely')}>👍 Likely</button>
            <button type="button" className="daily-conf-btn" onClick={() => chooseConfidence('certain')}>💪 Certain</button>
          </div>
        </div>
      )}

      {answered && (
        <div className="daily-feedback-wrap">
          <div className={`daily-verdict ${correct ? 'daily-verdict-right' : 'daily-verdict-wrong'}`}>
            {correct ? '✓ Correct' : '✗ Not quite'}
          </div>
          {confidence && (
            <div className="daily-calib-note">{calibNote(confidence, correct)}</div>
          )}
          {/* Same 3-part feedback every other testing surface shows. */}
          <FeedbackPanel question={q} picked={picked} />
          <div className="daily-chip-row">
            {/* +5, matching what answerDailyChallenge actually pays. */}
            {correct && <span className="daily-chip daily-chip-xp">+5 XP</span>}
            <span className="daily-chip daily-chip-streak">
              🔥 Day {correct ? 'counts' : 'attempted'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────────────

// Find the first lesson the user hasn't completed (any path). Used by the
// empty-state CTA so we don't dead-end users with "complete your first lesson"
// and no link to follow. Order comes from PATH_KEYS (content.js declaration
// order: fundamentals → devops → mlops → ... → fullstack → cybersec) so newly
// added paths are covered automatically — a hard-coded list left the CTA a
// no-op once the listed paths were finished.
function firstIncompleteLesson(completed) {
  for (const k of PATH_KEYS) {
    const p = PATHS[k];
    if (!p) continue;
    const hit = p.lessons.find((l) => !completed?.[l.id]);
    if (hit) return hit;
  }
  return null;
}

// Short calibration nudge shown after a daily-challenge MCQ — pairs the user's
// stated confidence against the actual outcome so over/under-confidence is felt.
function calibNote(confidence, correct) {
  if (confidence === 'certain') {
    return correct
      ? '💪 Certain and right — well calibrated.'
      : '⚠️ You were certain but missed — that gap is exactly what to re-read.';
  }
  if (confidence === 'guess') {
    return correct
      ? '🍀 A guess that landed — you may know more than you think.'
      : '🤷 A guess that missed — no shame, now you know.';
  }
  return correct
    ? '👍 Pretty sure and right — solid.'
    : '🔍 You leaned the wrong way — close, but worth a second look.';
}
