import { useMemo, useState } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { useStore } from '../store/useStore.js';
import { PATHS } from '../data/content.js';
import { pickReviewQuestion } from '../data/battles.js';
import FeedbackPanel from '../components/FeedbackPanel.jsx';
import OrderQuestion from '../components/OrderQuestion.jsx';
import SessionRecap from '../components/SessionRecap.jsx';
import StemText from '../components/StemText.jsx';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts.js';

// PracticeLesson — /practice/:lessonId, the "drill this on demand" surface.
//
// Reviews come when due and daily practice caps at five — a motivated
// learner who wants MORE right now had only battle replays. This screen
// deals a short hand from the lesson's own material (same picker every
// surface uses, salted randomly per session so re-practicing draws fresh
// permutations) and grades NOTHING:
//   - no XP (unfarmable by construction — there's nothing to farm)
//   - no scheduleReview (practicing early must not push a due date out;
//     the spacing engine owns WHEN, this screen only serves WANT)
//   - weak spots stay live: a miss files one, a correct answer clears one
//     (same contract as everywhere else — practice honestly reveals gaps)

const HAND_SIZE = 5;
const SALT_SPREAD = 24; // salts probed to find distinct questions

function dealPractice(lessonId, baseSalt) {
  const seen = new Set();
  const hand = [];
  for (let s = 0; s < SALT_SPREAD && hand.length < HAND_SIZE; s += 1) {
    const q = pickReviewQuestion(lessonId, baseSalt + s);
    if (!q || seen.has(q.q)) continue;
    seen.add(q.q);
    hand.push(q);
  }
  return hand;
}

export default function PracticeLesson() {
  const { lessonId } = useParams();
  const nav = useNavigate();
  const recordQuizMiss = useStore((s) => s.recordQuizMiss);
  const clearQuizMiss = useStore((s) => s.clearQuizMiss);
  const quizMisses = useStore((s) => s.quizMisses);

  // Random per-session salt: unlike Reviews (deterministic per rep count),
  // practice SHOULD reshuffle every run — that's the point of a drill.
  const [baseSalt, setBaseSalt] = useState(() => Math.floor(Math.random() * 100000));
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [orderResult, setOrderResult] = useState(null);
  const [results, setResults] = useState([]);

  const lesson = useMemo(() => {
    for (const p of Object.values(PATHS)) {
      const hit = p.lessons.find((l) => l.id === lessonId);
      if (hit) return hit;
    }
    return null;
  }, [lessonId]);

  const hand = useMemo(
    () => (lesson ? dealPractice(lessonId, baseSalt) : []),
    [lessonId, lesson, baseSalt],
  );

  const total = hand.length;
  const done = idx >= total;
  const q = !done ? hand[idx] : null;
  const isOrder = q?.kind === 'order';
  const answeredCorrect = isOrder ? orderResult === 'right' : (q != null && picked !== null && picked === q.answer);
  const answeredWrong = isOrder ? orderResult === 'wrong' : (q != null && picked !== null && picked !== q.answer);
  const answered = answeredCorrect || answeredWrong;

  const advance = () => { setPicked(null); setOrderResult(null); setIdx((i) => i + 1); };
  const again = () => {
    setBaseSalt(Math.floor(Math.random() * 100000));
    setIdx(0); setPicked(null); setOrderResult(null); setResults([]);
  };

  const settle = (correct, prompt, bucketLessonId, canonical = null) => {
    const bucket = bucketLessonId || '__daily_practice__';
    if (correct) {
      if (quizMisses?.[bucket]?.[prompt]) clearQuizMiss(bucket, prompt);
    } else {
      recordQuizMiss(bucket, prompt, canonical);
    }
    setResults((r) => [...r, { prompt, correct, lessonId: lessonId }]);
  };

  const pick = (i) => {
    if (!q || isOrder || picked !== null || done) return;
    setPicked(i);
    const canonical = q.origIndex?.[i];
    settle(
      i === q.answer,
      q.q,
      q.lessonId || lessonId,
      q.lessonId && Number.isInteger(canonical) && canonical < (q.bankOpts ?? 4) ? canonical : null,
    );
  };

  const onOrderDone = (correct) => {
    if (!q || !isOrder || orderResult !== null || done) return;
    setOrderResult(correct ? 'right' : 'wrong');
    settle(correct, q.q, q.lessonId || lessonId);
  };

  useKeyboardShortcuts(
    {
      Enter: () => { if (!done && answered) advance(); },
      ' ': () => { if (!done && answered) advance(); },
      1: () => pick(0),
      2: () => pick(1),
      3: () => pick(2),
      4: () => pick(3),
    },
    [idx, done, picked, orderResult, q],
  );

  if (!lesson) return <Navigate to="/library" replace />;

  if (total === 0 || done) {
    return (
      <div className="screen fade-in">
        <div className="reviews-header row">
          <span className="kicker">🎯 PRACTICE · {lesson.title.toUpperCase().slice(0, 28)}</span>
        </div>
        <div className="card reviews-done">
          <div style={{ fontSize: 36, marginBottom: 6 }} aria-hidden>{total === 0 ? '🌫' : '✓'}</div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 700, marginBottom: 6 }}>
            {total === 0 ? 'No questions cover this lesson yet' : 'Drill complete'}
          </div>
          <p className="caption" style={{ marginBottom: 14 }}>
            {total === 0
              ? 'Give it a re-read instead — its quiz bank is still growing.'
              : 'Pure practice — no XP, no schedule changes. Just reps.'}
          </p>
          <div className="row" style={{ gap: 8 }}>
            {total > 0 && (
              <button type="button" className="btn btn-primary" style={{ flex: 1 }} onClick={again}>
                ↻ Again, fresh hand
              </button>
            )}
            <button type="button" className="btn" style={{ flex: 1 }} onClick={() => nav(`/lesson/${lessonId}`)}>
              Back to the lesson
            </button>
          </div>
        </div>
        <SessionRecap results={results} title="THIS DRILL" />
      </div>
    );
  }

  return (
    <div className="screen fade-in">
      <div className="reviews-header row">
        <span className="kicker">🎯 PRACTICE · {idx + 1}/{total}</span>
        <span className="spacer" />
        <span className="reviews-progress-chip mono">no XP · pure reps</span>
      </div>

      <div className="card reviews-card">
        <div
          className="mono"
          style={{
            fontSize: 9, color: 'var(--text-tertiary)',
            letterSpacing: '.16em', textTransform: 'uppercase', marginBottom: 8,
          }}
        >
          {lesson.title}
        </div>
        <p style={{ fontSize: 14.5, fontWeight: 500, margin: '0 0 10px', lineHeight: 1.45 }}>
          <StemText
            text={q.q}
            fill={!isOrder && picked !== null ? q.opts[q.answer] : null}
            verdict={answeredWrong ? 'wrong' : 'right'}
          />
        </p>
        {isOrder ? (
          <OrderQuestion key={`${baseSalt}-${idx}`} question={q} onDone={onOrderDone} />
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {q.opts.map((o, i) => {
                let cls = 'btn dp-option';
                if (picked !== null && i === q.answer) cls += ' dp-correct';
                else if (picked !== null && i === picked) cls += ' dp-wrong';
                return (
                  <button
                    key={i}
                    type="button"
                    className={cls}
                    disabled={picked !== null}
                    onClick={() => pick(i)}
                    data-juice={picked === i ? (i === q.answer ? 'pop' : 'shake') : undefined}
                  >
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
      {answered && (
        <button type="button" className="btn btn-primary btn-block" onClick={advance}>
          {idx + 1 >= total ? 'Finish →' : 'Next →'}
        </button>
      )}
    </div>
  );
}
