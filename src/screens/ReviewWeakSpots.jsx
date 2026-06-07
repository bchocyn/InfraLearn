import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore.js';
import mathQuizzes from '../data/mathQuizzes.js';
import { PATHS } from '../data/content.js';
import FeedbackPanel from '../components/FeedbackPanel.jsx';

// ReviewWeakSpots — surfaces every math-quiz question the user has answered
// wrong, with the same per-choice feedback panel the in-lesson MathQuiz uses.
// Entries clear automatically when the user retakes that quiz and gets the
// question right (handled in MathQuiz's submit() via clearQuizMiss).

const LETTERS = ['A', 'B', 'C', 'D'];

// Build a flat list of misses joined to the full question + lesson metadata.
function collectMisses(quizMisses) {
  const out = [];
  for (const [lessonId, byPrompt] of Object.entries(quizMisses || {})) {
    const bank = mathQuizzes[lessonId];
    if (!bank) continue;                       // bank deleted since miss recorded
    const lessonMeta = findLessonMeta(lessonId);
    for (const [prompt, info] of Object.entries(byPrompt || {})) {
      const question = (bank.questions || []).find((q) => q.prompt === prompt);
      if (!question) continue;                 // question text changed; skip
      out.push({
        lessonId,
        lessonTitle: lessonMeta?.lesson.title || lessonId,
        pathName: lessonMeta?.pathName || '',
        bankTitle: bank.title || lessonId,
        question,
        picked: typeof info?.picked === 'number' ? info.picked : null,
      });
    }
  }
  return out;
}

function findLessonMeta(lessonId) {
  for (const key of Object.keys(PATHS)) {
    const lesson = PATHS[key].lessons.find((l) => l.id === lessonId);
    if (lesson) return { pathKey: key, pathName: PATHS[key].name, lesson };
  }
  return null;
}

export default function ReviewWeakSpots() {
  const quizMisses = useStore((s) => s.quizMisses);
  const nav = useNavigate();
  const misses = useMemo(() => collectMisses(quizMisses), [quizMisses]);

  return (
    <div className="screen fade-in">
      <div className="card">
        <div
          className="mono"
          style={{ fontSize: 10, color: 'var(--accent-amber)', letterSpacing: '.18em' }}
        >
          REVIEW · WEAK SPOTS
        </div>
        <h1
          className="h2"
          style={{ fontFamily: 'var(--font-serif)', fontSize: 22, lineHeight: 1.25, marginTop: 6 }}
        >
          {misses.length > 0
            ? `${misses.length} question${misses.length === 1 ? '' : 's'} to revisit`
            : 'Nothing to review — yet'}
        </h1>
        <p className="caption" style={{ marginTop: 6 }}>
          {misses.length > 0
            ? "These are the math-quiz questions you've missed. Retake the lesson's quiz to clear them."
            : 'When you miss a math-quiz question, it shows up here for review until you get it right.'}
        </p>
      </div>

      {misses.length === 0 && (
        <div className="card">
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Open a math-flagged lesson from the <Link to="/roadmap">roadmap</Link> and take its quiz —
            anything you miss will land here for a second pass.
          </p>
        </div>
      )}

      {misses.map((m, i) => (
        <div className="card" key={`${m.lessonId}-${i}`}>
          <div
            className="mono"
            style={{
              fontSize: 9,
              color: 'var(--text-tertiary)',
              letterSpacing: '.16em',
              textTransform: 'uppercase',
            }}
          >
            {m.pathName ? `${m.pathName} · ` : ''}{m.bankTitle}
          </div>
          <div
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 16,
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginTop: 6,
              marginBottom: 4,
              lineHeight: 1.35,
            }}
          >
            {m.question.prompt}
          </div>
          {m.question.formula && (
            <pre
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                color: 'var(--text-secondary)',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                padding: '8px 10px',
                borderRadius: 6,
                margin: '6px 0 10px',
                overflowX: 'auto',
              }}
            >
              {m.question.formula}
            </pre>
          )}

          <ol style={{ listStyle: 'none', paddingLeft: 0, margin: '8px 0 0' }}>
            {(m.question.options || []).map((opt, j) => {
              const isCorrect = j === m.question.answer;
              const isPicked = j === m.picked;
              const tone = isCorrect
                ? 'var(--status-success, #8FA876)'
                : isPicked
                  ? 'var(--el-fire)'
                  : 'var(--border-subtle)';
              return (
                <li
                  key={j}
                  style={{
                    border: `1px solid ${tone}`,
                    borderRadius: 8,
                    padding: '8px 12px',
                    margin: '6px 0',
                    background: isCorrect
                      ? 'rgba(143,168,118,.06)'
                      : isPicked
                        ? 'rgba(224,120,86,.06)'
                        : 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    fontSize: 13,
                    display: 'flex',
                    gap: 10,
                    alignItems: 'flex-start',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text-tertiary)',
                      width: 14,
                      flex: '0 0 auto',
                    }}
                  >
                    {LETTERS[j] || '?'}
                  </span>
                  <span style={{ flex: '1 1 auto', minWidth: 0, overflowWrap: 'anywhere', lineHeight: 1.45 }}>{opt}</span>
                  {isCorrect && (
                    <span style={{ color: 'var(--status-success, #8FA876)', fontWeight: 600 }}>
                      ✓
                    </span>
                  )}
                  {isPicked && !isCorrect && (
                    <span style={{ color: 'var(--el-fire)', fontWeight: 600 }}>✗</span>
                  )}
                </li>
              );
            })}
          </ol>

          <div style={{ marginTop: 10 }}>
            <FeedbackPanel question={m.question} picked={m.picked} />
          </div>

          <button
            className="btn btn-block"
            style={{ marginTop: 12 }}
            onClick={() => nav(`/lesson/${m.lessonId}`)}
          >
            Open lesson →
          </button>
        </div>
      ))}
    </div>
  );
}
