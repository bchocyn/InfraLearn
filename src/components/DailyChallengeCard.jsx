import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore.js';
import { PATHS } from '../data/content.js';
import { loadLessonsForPath, LESSON_PATH_KEYS } from '../data/lessons/loader.js';

// DailyChallengeCard — pinned recall card on Home. ONE question per day, drawn
// from concepts the user has already learned. Reuses spaced-rep + recall infra.
// Visual contract (locked):
//   - amber gradient header, 12px padding, amber border
//   - kicker "🎯 TODAY'S CHALLENGE · ~60s"
//   - serif 16px title pulled from concept question OR generated from title
//   - 3 multiple-choice options when a dailyChallengeQ is present on the body
//   - fallback: "Recall: what is X?" with tap-to-reveal first paragraph
//   - after answer: ✓/✗ + feedback + XP chip + streak chip
//   - collapses to "✓ Done — back tomorrow" with streak counter
//   - empty state (no completions yet) links to first incomplete lesson
//
// Selection + +8 XP + streak bookkeeping all live in the store
// (pickDailyChallenge / answerDailyChallenge). This file is pure presentation.
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

  // Resolve the concept's display title from PATHS metadata.
  const conceptId = dailyChallenge?.conceptId || null;
  const conceptMeta = useMemo(() => {
    if (!conceptId) return null;
    for (const p of Object.values(PATHS)) {
      const hit = p.lessons.find((l) => l.id === conceptId);
      if (hit) return { lesson: hit, pathKey: pathKeyForLesson(conceptId) };
    }
    return null;
  }, [conceptId]);

  // Async-load the lesson body so we can read its optional dailyChallengeQ
  // and tagline/first-paragraph fallback. Keyed by conceptId so a date roll
  // triggers a fresh fetch automatically.
  const [body, setBody] = useState(null);
  useEffect(() => {
    let alive = true;
    setBody(null);
    if (!conceptMeta) return undefined;
    loadLessonsForPath(conceptMeta.pathKey).then((bodies) => {
      if (!alive) return;
      setBody(bodies?.[conceptId] || null);
    }).catch(() => { if (alive) setBody(null); });
    return () => { alive = false; };
  }, [conceptId, conceptMeta]);

  // Build the question object surfaced to the user. Three layers:
  //   1. body.dailyChallengeQ — explicit { q, opts, answer, explain }
  //   2. body.mathQuiz / sections — first MCQ found becomes the challenge
  //   3. tagline-based reveal — "Recall: what is X?" + tap-to-reveal text
  const challenge = useMemo(() => buildChallenge(conceptMeta?.lesson, body), [conceptMeta, body]);

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

  // --- Active state: question to answer -------------------------------------
  return (
    <ActiveChallenge
      challenge={challenge}
      conceptMeta={conceptMeta}
      onAnswer={(correct) => answerDailyChallenge(correct)}
    />
  );
}

// ── Active card body — shown when the user has a fresh challenge ────────────
// Split out so the MCQ vs tap-to-reveal branch stays readable. Both branches
// resolve to a single `answer(correct)` call so the parent store-action is the
// only path that mutates state. State is purely local: a tap on an MCQ option
// flips local `picked`, which then drives `answer()` synchronously.
function ActiveChallenge({ challenge, conceptMeta, onAnswer }) {
  const [picked, setPicked] = useState(null);          // MCQ pick index
  const [revealed, setRevealed] = useState(false);     // tap-to-reveal mode
  const [recallVerdict, setRecallVerdict] = useState(null); // 'right' | 'wrong'

  const title = challenge.title;

  // MCQ submit — mark + bubble the verdict in one tick.
  const submitMcq = (i) => {
    if (picked !== null) return;
    setPicked(i);
    onAnswer(i === challenge.answer);
  };
  // Tap-to-reveal self-grade — same shape as DailyPractice recall flow.
  const selfGrade = (v) => {
    if (recallVerdict) return;
    setRecallVerdict(v);
    onAnswer(v === 'right');
  };

  const isMcq = challenge.kind === 'mcq';
  const answered = isMcq ? picked !== null : recallVerdict !== null;
  const correct = isMcq ? (picked === challenge.answer) : (recallVerdict === 'right');

  return (
    <div className="card daily-challenge">
      <div className="kicker daily-kicker">🎯 TODAY&apos;S CHALLENGE · ~60s</div>
      <div className="daily-title">{title}</div>
      {conceptMeta?.lesson?.title && (
        <div className="daily-source mono">
          FROM · {conceptMeta.lesson.title.toUpperCase()}
        </div>
      )}

      {isMcq && (
        <div className="daily-opts">
          {challenge.opts.map((opt, i) => {
            const isAnswer = i === challenge.answer;
            const wasPicked = picked === i;
            let cls = 'daily-opt';
            if (answered && isAnswer) cls += ' daily-opt-correct';
            else if (answered && wasPicked) cls += ' daily-opt-wrong';
            return (
              <button
                key={i}
                type="button"
                className={cls}
                disabled={answered}
                onClick={() => submitMcq(i)}
              >
                <span className="daily-opt-letter">{String.fromCharCode(65 + i)}</span>
                <span className="daily-opt-text">{opt}</span>
                {answered && isAnswer && <span className="daily-opt-mark" aria-hidden>✓</span>}
                {answered && wasPicked && !isAnswer && <span className="daily-opt-mark" aria-hidden>✗</span>}
              </button>
            );
          })}
        </div>
      )}

      {!isMcq && (
        <div className="daily-reveal-wrap">
          {!revealed && (
            <button
              type="button"
              className="btn btn-primary btn-block daily-reveal-btn"
              onClick={() => setRevealed(true)}
            >
              Tap to reveal answer
            </button>
          )}
          {revealed && (
            <>
              <div className="daily-reveal-body">{challenge.reveal}</div>
              {!recallVerdict && (
                <div className="daily-grade-row">
                  <button
                    type="button"
                    className="btn btn-block daily-grade-right"
                    onClick={() => selfGrade('right')}
                  >
                    ✓ Got it
                  </button>
                  <button
                    type="button"
                    className="btn btn-block daily-grade-wrong"
                    onClick={() => selfGrade('wrong')}
                  >
                    ✗ Missed
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {answered && (
        <div className="daily-feedback-wrap">
          <div className={`daily-verdict ${correct ? 'daily-verdict-right' : 'daily-verdict-wrong'}`}>
            {correct ? '✓ Correct' : '✗ Not quite'}
          </div>
          {challenge.explain && (
            <div className="daily-explain">{challenge.explain}</div>
          )}
          <div className="daily-chip-row">
            {correct && <span className="daily-chip daily-chip-xp">+8 XP</span>}
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

// Resolve the path-loader key for a lesson id by walking PATHS. Cheap: PATHS
// is a static object with ~150 lessons total. Returns 'fundamentals' fallback
// only when the id isn't found in any path (shouldn't happen — pickDailyChallenge
// already validates the id against VALID_LESSON_IDS).
function pathKeyForLesson(lessonId) {
  for (const [key, p] of Object.entries(PATHS)) {
    if (p.lessons.some((l) => l.id === lessonId)) return key;
  }
  // Fallback: walk the loader keys until something matches. Edge case only.
  return LESSON_PATH_KEYS[0] || 'fundamentals';
}

// Find the first lesson the user hasn't completed (any path). Used by the
// empty-state CTA so we don't dead-end users with "complete your first lesson"
// and no link to follow. Order: fundamentals → devops → mlops → ... (the
// natural progression).
function firstIncompleteLesson(completed) {
  const order = ['fundamentals', 'devops', 'mlops', 'swe', 'mleng', 'faang'];
  for (const k of order) {
    const p = PATHS[k];
    if (!p) continue;
    const hit = p.lessons.find((l) => !completed?.[l.id]);
    if (hit) return hit;
  }
  return null;
}

// Build the challenge question from whatever data the lesson exposes.
// Resolution order:
//   1. body.dailyChallengeQ — explicit author-supplied MCQ ({ q, opts, answer, explain })
//   2. body.mathQuiz.questions[0] — first math-quiz question (MCQ shape)
//   3. tagline / first paragraph — tap-to-reveal recall fallback
// Returns an object with `kind: 'mcq' | 'recall'` driving the renderer.
function buildChallenge(lesson, body) {
  if (!lesson) {
    // Defensive — selection guarantees a lesson, but the loader race could
    // leave body null briefly. Return a safe empty MCQ so the card still
    // renders something while the body finishes loading.
    return {
      kind: 'recall',
      title: 'Loading…',
      reveal: '',
      explain: '',
    };
  }
  // 1. Explicit author-supplied question on the body.
  const explicit = body?.dailyChallengeQ;
  if (explicit && typeof explicit === 'object'
      && typeof explicit.q === 'string'
      && Array.isArray(explicit.opts)
      && explicit.opts.length >= 2
      && Number.isInteger(explicit.answer)) {
    return {
      kind: 'mcq',
      title: explicit.q,
      opts: explicit.opts.slice(0, 4),
      answer: Math.min(explicit.answer, explicit.opts.length - 1),
      explain: typeof explicit.explain === 'string' ? explicit.explain : '',
    };
  }
  // 2. Math-quiz fallback — surface the first question if present.
  const mq = body?.mathQuiz?.questions?.[0];
  if (mq && typeof mq.prompt === 'string' && Array.isArray(mq.options)) {
    return {
      kind: 'mcq',
      title: mq.prompt,
      opts: mq.options.slice(0, 4),
      answer: Number.isInteger(mq.answer) ? mq.answer : 0,
      explain: typeof mq.whyCorrect === 'string'
        ? mq.whyCorrect
        : typeof mq.explanation === 'string' ? mq.explanation : '',
    };
  }
  // 3. Tap-to-reveal recall fallback. Title from tagline or generated from
  //    the concept title; reveal text from the first paragraph of the body.
  const titleText = lesson.tagline
    ? `Recall: ${lesson.tagline}`
    : `Recall: what is ${lesson.title}?`;
  const reveal = firstParagraph(body) || lesson.tagline || lesson.title;
  return {
    kind: 'recall',
    title: titleText,
    reveal,
    explain: '',
  };
}

// Pull the first prose paragraph from a lesson body. Lessons store content
// as { sections: [{ body: [{ type, text }, ...] }, ...] }. We scan sections in
// order and return the first `type: 'p'` text. Strips markdown bold so the
// tap-to-reveal text reads cleanly without a markdown renderer.
function firstParagraph(body) {
  if (!body || !Array.isArray(body.sections)) return '';
  for (const section of body.sections) {
    if (!Array.isArray(section.body)) continue;
    for (const node of section.body) {
      if (node?.type === 'p' && typeof node.text === 'string' && node.text.length > 0) {
        return node.text.replace(/\*\*(.+?)\*\*/g, '$1').replace(/`([^`]+)`/g, '$1');
      }
    }
  }
  return '';
}
