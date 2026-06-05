// FeedbackPanel — the 3-part feedback paradigm used by Daily Practice
// (Home.jsx) and MathQuiz (MathQuiz.jsx) after a user answers a question.
//
// Three stacked cards:
//
//   1. WHY INCORRECT  (red,   only when the user picked the wrong option)
//      Resolves text from:  q.whyWrong[pickedIdx]
//                        →  q.whyWrong.default
//                        →  q.whyWrong (if it's a string)
//                        →  q.explanation
//
//   2. WHY CORRECT    (green, always)
//      Resolves text from:  q.whyCorrect
//                        →  q.explanation
//                        →  (omitted if nothing to show)
//
//   3. BEST PRACTICE  (amber, always)
//      Resolves text from:  q.bestPractices
//                        →  "Repeat similar drills to lock this in."
//
// Props:
//   question — the question object (must have an `answer` field)
//   picked   — the option index the user picked (0-based)
//
// Renders nothing if `picked` is null/undefined (i.e. unanswered).

export default function FeedbackPanel({ question, picked }) {
  if (picked === null || picked === undefined) return null;
  const q = question || {};
  const isWrong = picked !== q.answer;

  // --- Resolve WHY-WRONG text -----------------------------------------------
  let wrongText = null;
  if (isWrong) {
    const ww = q.whyWrong;
    if (ww && typeof ww === 'object') {
      wrongText =
        ww[picked] ||
        ww[String(picked)] ||
        ww.default ||
        q.explanation ||
        null;
    } else if (typeof ww === 'string') {
      wrongText = ww;
    } else {
      wrongText = q.explanation || null;
    }
  }

  // --- Resolve WHY-CORRECT text ---------------------------------------------
  const correctText = q.whyCorrect || q.explanation || null;

  // --- Resolve BEST-PRACTICE text -------------------------------------------
  const bestText =
    q.bestPractices || 'Repeat similar drills to lock this in.';

  return (
    <div className="feedback-stack fade-in">
      {isWrong && wrongText && (
        <div className="feedback-block feedback-wrong">
          <span className="feedback-kicker">WHY INCORRECT</span>
          <p className="feedback-body">{wrongText}</p>
        </div>
      )}
      {correctText && (
        <div className="feedback-block feedback-right">
          <span className="feedback-kicker">WHY CORRECT</span>
          <p className="feedback-body">{correctText}</p>
        </div>
      )}
      <div className="feedback-block feedback-best">
        <span className="feedback-kicker">BEST PRACTICE</span>
        <p className="feedback-body">{bestText}</p>
      </div>
    </div>
  );
}
