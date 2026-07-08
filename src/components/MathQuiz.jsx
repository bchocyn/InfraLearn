import { useMemo, useState } from 'react';
import FeedbackPanel from './FeedbackPanel.jsx';
import { useStore } from '../store/useStore.js';

// MathQuiz — a self-contained 5-question quiz card.
//
// Props:
//   lessonId    — id of the lesson this quiz belongs to (only used as a stable
//                 React key so picks reset when navigating between lessons).
//   title       — human title shown under the kicker.
//   questions   — [{ prompt, formula?, options: [s,s,s,s], answer: 0..3, explanation }]
//   onSkip()    — fired when the user hits "Skip Quiz →" at any time.
//   onComplete()— fired when the user advances past the last question (Next on last).
//
// Behaviour:
//   - Questions are shuffled once on mount, then trimmed to 5 max.
//   - Each question records its own picked answer + a submitted flag. Once
//     submitted, the four options reveal their correct/wrong state and the
//     explanation paragraph appears below.
//   - The header keeps a running tally of correct answers so far (e.g. "2/5 · 1 ✓").
//   - Skip is always available top-right; Prev/Next live in the footer.

const LETTERS = ['A', 'B', 'C', 'D'];

function shuffle(arr) {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Permute one question's OPTIONS so answer position carries no signal — the
// banks skew heavily toward one slot (measured: correct sat at B in 83% of
// math-quiz questions), so canonical order lets "always tap B" score without
// recall. The answer index and index-keyed whyWrong remap through the
// permutation; `_orig` maps display→canonical so weak-spot records still
// point at the bank's own option index.
function shuffleOptions(q) {
  if (!Array.isArray(q.options)) return q;
  const perm = shuffle(q.options.map((_, i) => i));
  let whyWrong = q.whyWrong;
  if (whyWrong && typeof whyWrong === 'object') {
    const remapped = {};
    perm.forEach((orig, ni) => { if (whyWrong[orig] != null) remapped[ni] = whyWrong[orig]; });
    if (whyWrong.default != null) remapped.default = whyWrong.default;
    whyWrong = remapped;
  }
  return {
    ...q,
    options: perm.map((oi) => q.options[oi]),
    answer: perm.indexOf(q.answer),
    whyWrong,
    _orig: perm,
  };
}

export default function MathQuiz({ lessonId, title, questions, onSkip, onComplete }) {
  // Freeze the shuffle to mount so re-renders don't reorder mid-quiz. lessonId
  // is part of the dependency list as a defensive measure — if a parent ever
  // swaps lessons without unmounting, we'd want a fresh shuffle. Both the
  // question ORDER and each question's OPTION order shuffle here.
  const items = useMemo(() => {
    const shuffled = shuffle(questions || []);
    return shuffled.slice(0, 5).map(shuffleOptions);
  }, [lessonId, questions]);

  const [idx, setIdx] = useState(0);
  // picks[i] = 0..3 once a choice is submitted for question i; undefined otherwise.
  const [picks, setPicks] = useState({});

  // Rules of Hooks: every hook must run on every render, so these live ABOVE
  // the empty-bank early return — otherwise the hook count changes when
  // `items` flips between empty and populated, and React throws.
  const recordQuizMiss = useStore((s) => s.recordQuizMiss);
  const clearQuizMiss  = useStore((s) => s.clearQuizMiss);
  const addXp          = useStore((s) => s.addXp);
  const quizMissesMap  = useStore((s) => s.quizMisses);
  const lessonDone     = useStore((s) => !!s.completed?.[lessonId]);

  if (!items.length) {
    // Defensive: render nothing rather than crash if the bank is empty.
    return null;
  }

  const total = items.length;
  const q = items[idx];
  const submitted = picks[idx] !== undefined;
  const picked = picks[idx];
  const correctSoFar = Object.entries(picks).reduce((n, [i, choice]) => {
    return n + (items[Number(i)] && items[Number(i)].answer === choice ? 1 : 0);
  }, 0);

  const submit = (choice) => {
    if (submitted) return;
    setPicks((p) => ({ ...p, [idx]: choice }));
    // Track misses for Review Weak Spots. Right answer clears any prior
    // miss for the same question; wrong answer records it.
    if (q && typeof q.prompt === 'string') {
      if (choice === q.answer) {
        // Was this prompt previously missed? If so, it's a recovered miss —
        // heftier +10 (relearning a known weak spot IS retrieval evidence,
        // and it's implicitly latched: clearing the miss removes the +10
        // path until a new miss is recorded). First-sight correct is
        // recognition: +6, capped at review:good so the recall > recognition
        // gradient stays strict — and paid only while the lesson is still
        // incomplete, so re-entering a finished lesson and re-answering
        // can't farm +6 per question forever (same loophole daily practice
        // closed with recordDailyAnswer's first-answer gate).
        const wasMissed = !!quizMissesMap?.[lessonId]?.[q.prompt];
        clearQuizMiss(lessonId, q.prompt);
        if (wasMissed) addXp?.(10, 'quiz:recovered');
        else if (!lessonDone) addXp?.(6, 'quiz:correct');
      } else {
        // Store the CANONICAL option index — ReviewWeakSpots renders the
        // bank's canonical option order, not this mount's shuffle.
        const canonical = q._orig ? q._orig[choice] : choice;
        recordQuizMiss(lessonId, q.prompt, Number.isInteger(canonical) ? canonical : null);
      }
    }
  };

  const goPrev = () => {
    if (idx > 0) setIdx(idx - 1);
  };

  const goNext = () => {
    if (idx < total - 1) {
      setIdx(idx + 1);
    } else {
      // Past the last question — quiz is done.
      onComplete && onComplete();
    }
  };

  return (
    <div className="card fade-in" data-quiz-root>
      <div className="quiz-header">
        <div>
          <div
            className="mono"
            style={{
              fontSize: 9,
              color: 'var(--accent-amber)',
              letterSpacing: '.18em',
              marginBottom: 4,
            }}
          >
            ∑ MATH FOR ML · {total}Q
          </div>
          <div className="h2" style={{ fontSize: 18 }}>
            {title || 'Math check'}
          </div>
        </div>
        <button className="btn btn-ghost" onClick={onSkip} aria-label="Skip quiz">
          Skip Quiz →
        </button>
      </div>

      <div className="quiz-progress mono">
        <span>{idx + 1}/{total}</span>
        <span style={{ color: 'var(--text-tertiary)' }}>·</span>
        <span style={{ color: 'var(--status-success)' }}>{correctSoFar} ✓</span>
      </div>

      <div className="quiz-question">
        <p style={{ margin: '14px 0 10px', color: 'var(--text-primary)', lineHeight: 1.55 }}>
          {q.prompt}
        </p>
        {q.formula && <code className="quiz-formula">{q.formula}</code>}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
        {q.options.map((opt, i) => {
          let cls = 'quiz-option';
          if (submitted) {
            if (i === q.answer) cls += ' correct';
            else if (i === picked) cls += ' wrong';
          }
          return (
            <button
              key={i}
              type="button"
              className={cls}
              onClick={() => submit(i)}
              disabled={submitted}
              data-juice={submitted && picked === i ? (i === q.answer ? 'pop' : 'shake') : undefined}
            >
              <span className="quiz-option-letter">{LETTERS[i]}</span>
              <span className="quiz-option-text">{opt}</span>
              {submitted && i === q.answer && <span className="quiz-option-mark">✓</span>}
              {submitted && i === picked && i !== q.answer && (
                <span className="quiz-option-mark">✗</span>
              )}
            </button>
          );
        })}
      </div>

      {submitted && (
        <FeedbackPanel question={q} picked={picked} />
      )}

      <div className="quiz-footer">
        <button
          className="btn"
          onClick={goPrev}
          disabled={idx === 0}
          style={{ opacity: idx === 0 ? 0.45 : 1 }}
        >
          ← Prev
        </button>
        <span className="mono" style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
          {submitted ? (picked === q.answer ? 'Nice — got it.' : 'Review the explanation, then keep going.') : 'Pick A · B · C · D'}
        </span>
        <button
          className="btn btn-primary"
          onClick={goNext}
        >
          {idx === total - 1 ? 'Finish ✓' : 'Next →'}
        </button>
      </div>
    </div>
  );
}
