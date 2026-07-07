// Watchfire Defense — reviews-as-battles (journey design §12 #1).
//
// THE design rule: the game is presentation, the scheduler stays honest.
// Under the hood this is exactly the Reviews screen's loop — snapshot
// getReviewsDue() at mount, one QUIZ QUESTION per due card (same
// pickReviewQuestion the Reviews screen uses) → markReviewed(id, grade) —
// wearing a battle skin: due cards are Null-wraiths drifting toward the
// watchfire. A correct answer sends the beast to strike (auto-advance,
// patrols stay brisk); a wrong answer costs the fire one heart AND holds
// on the why-wrong feedback until dismissed — the card returns tomorrow
// via FSRS, exactly as it always did, plus a weak-spot entry. No XP or
// embers are minted here beyond what markReviewed itself awards.
//
// The fire never "dies" punitively: at zero hearts it gutters but holds.
// Failure costs theater, never progress — the forgiveness stance the
// streak system already canonized.

import { useMemo, useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore, getReviewsDue } from '../store/useStore.js';
import { PATHS } from '../data/content.js';
import { PROVINCES, FIVE_LAPSES } from '../data/lore.js';
import { pickReviewQuestion } from '../data/battles.js';
import BeastSprite from '../components/BeastSprite.jsx';
import CelebrationMoment from '../components/CelebrationMoment.jsx';
import FeedbackPanel from '../components/FeedbackPanel.jsx';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts.js';

function isoDayString(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// id → { lesson, pathKey, pathName } — pathKey feeds the wraith's province
// + lapse flavor line.
function buildLessonIndex() {
  const idx = {};
  for (const key of Object.keys(PATHS)) {
    const p = PATHS[key];
    for (const l of p.lessons) {
      idx[l.id] = { lesson: l, pathKey: key, pathName: p.name };
    }
  }
  return idx;
}

const FIRE_HP = 3;

export default function Watchfire() {
  const nav = useNavigate();
  const reviewQueue = useStore((s) => s.reviewQueue);
  const markReviewed = useStore((s) => s.markReviewed);
  const recordQuizMiss = useStore((s) => s.recordQuizMiss);
  const clearQuizMiss = useStore((s) => s.clearQuizMiss);
  const quizMisses = useStore((s) => s.quizMisses);
  const companion = useStore((s) => s.companion);
  const beastTier = useStore((s) => s.beastTier);
  const reducedMotion = useStore((s) => s.settings?.reducedMotion);

  const today = isoDayString();
  // Snapshot at mount — grading must not shuffle the wraith queue
  // mid-patrol (identical rationale to Reviews.jsx).
  const dueIds = useMemo(
    () => getReviewsDue({ reviewQueue: reviewQueue || {} }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [today],
  );
  const lessonIndex = useMemo(() => buildLessonIndex(), []);

  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null); // chosen option index this wraith
  const [fireHp, setFireHp] = useState(FIRE_HP);
  const [banished, setBanished] = useState(0);
  // 'strike' | 'hit' — one-shot animation class on the stage.
  const [fx, setFx] = useState(null);
  const fxTimer = useRef(null);
  useEffect(() => () => { if (fxTimer.current) clearTimeout(fxTimer.current); }, []);

  const total = dueIds.length;
  const done = idx >= total;
  const conceptIdNow = !done ? dueIds[idx] : null;

  // The wraith's question — same per-lesson picker the Reviews screen uses,
  // salted by the card's rep count so each patrol draws a different probe
  // (attempt 0 forever = memorizing an answer letter, not retaining).
  // Deps stay [conceptIdNow] on purpose: grading bumps reps mid-card and
  // re-salting then would swap the question under the feedback.
  const q = useMemo(
    () => (conceptIdNow
      ? pickReviewQuestion(conceptIdNow, reviewQueue?.[conceptIdNow]?.reps || 0)
      : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [conceptIdNow],
  );

  const advance = () => { setPicked(null); setFx(null); setIdx((i) => i + 1); };

  const pick = (i) => {
    if (!q || picked !== null || done) return;
    setPicked(i);
    const correct = i === q.answer;
    if (correct) {
      // The honest part: the real scheduler call, identical to Reviews.
      markReviewed(conceptIdNow, 3);
      if (q.lessonId && quizMisses?.[q.lessonId]?.[q.q]) clearQuizMiss(q.lessonId, q.q);
      else if (!q.lessonId && quizMisses?.__daily_practice__?.[q.q]) clearQuizMiss('__daily_practice__', q.q);
      setBanished((n) => n + 1);
      // The theater: the beast strikes, then the next wraith drifts in.
      if (reducedMotion) { advance(); return; }
      setFx('strike');
      fxTimer.current = setTimeout(advance, 550);
    } else {
      markReviewed(conceptIdNow, 1);
      const canonical = q.origIndex?.[i];
      recordQuizMiss(
        q.lessonId || '__daily_practice__',
        q.q,
        q.lessonId && Number.isInteger(canonical) && canonical <= 3 ? canonical : null,
      );
      setFireHp((hp) => Math.max(0, hp - 1));
      // Hold on the feedback — the why is the learning; Next dismisses.
      if (!reducedMotion) {
        setFx('hit');
        fxTimer.current = setTimeout(() => setFx(null), 450);
      }
    }
  };

  useKeyboardShortcuts(
    {
      Enter: () => { if (!done && picked !== null) advance(); },
      ' ':   () => { if (!done && picked !== null) advance(); },
      1: () => pick(0),
      2: () => pick(1),
      3: () => pick(2),
      4: () => pick(3),
    },
    [idx, done, conceptIdNow, picked, q, reducedMotion],
  );

  const hearts = '♥'.repeat(fireHp) + '♡'.repeat(FIRE_HP - fireHp);

  if (total === 0 || done) {
    return (
      <div className="screen fade-in">
        <CelebrationMoment />
        <div className="reviews-header row">
          <span className="kicker">🔥 WATCHFIRE · {total === 0 ? 'QUIET' : 'PATROL COMPLETE'}</span>
        </div>
        <div className="card reviews-done">
          <div style={{ fontSize: 36, marginBottom: 6 }} aria-hidden>{total === 0 ? '🔥' : '✓'}</div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 700, marginBottom: 6 }}>
            {total === 0
              ? 'No wraiths tonight'
              : `${banished} of ${total} wraith${total === 1 ? '' : 's'} banished`}
          </div>
          <p className="caption" style={{ marginBottom: 4 }}>
            {total === 0
              ? 'The fires burn steady. Finish a lesson and its memory joins the patrol route.'
              : fireHp === FIRE_HP
                ? 'The fire never flickered. A perfect watch.'
                : fireHp > 0
                  ? `The fire took ${FIRE_HP - fireHp} hit${FIRE_HP - fireHp === 1 ? '' : 's'} and held. What slipped past returns tomorrow — be waiting.`
                  : 'The fire guttered to embers — and held anyway. The Watch does not end on a bad night.'}
          </p>
          {total > 0 && (
            <div className="wf-hearts mono" aria-label={`Watchfire: ${fireHp} of ${FIRE_HP} hearts`}>{hearts}</div>
          )}
          <button type="button" className="btn btn-primary btn-block" style={{ marginTop: 12 }} onClick={() => nav('/')}>
            Back to camp →
          </button>
        </div>
      </div>
    );
  }

  const meta = lessonIndex[conceptIdNow];
  if (!meta || !q) {
    return (
      <div className="screen fade-in">
        <div className="card">
          <p className="caption">This wraith is a ghost of a removed lesson — let it pass.</p>
          <button type="button" className="btn btn-block" onClick={advance}>
            Next →
          </button>
        </div>
      </div>
    );
  }
  const { lesson, pathKey, pathName } = meta;
  const prov = PROVINCES[pathKey];
  const lapse = prov ? FIVE_LAPSES[prov.lapse] : null;

  return (
    <div className="screen fade-in">
      <CelebrationMoment />
      <div className="reviews-header row">
        <span className="kicker">🔥 WATCHFIRE · {idx + 1}/{total}</span>
        <span className="spacer" />
        <span className="wf-hearts mono" aria-label={`Watchfire: ${fireHp} of ${FIRE_HP} hearts`}>{hearts}</span>
      </div>

      {/* Battle stage — beast left, fire center, wraith right. Pure theater;
          everything that matters happens in the grade buttons below. */}
      <div className={`wf-stage${reducedMotion ? ' wf-static' : ''}${fx ? ` wf-fx-${fx}` : ''}`} aria-hidden="true">
        <svg className="wf-scene" viewBox="0 0 400 120" preserveAspectRatio="xMidYMax slice" shapeRendering="crispEdges">
          <polygon points="0,120 0,96 110,82 230,100 330,80 400,92 400,120" fill="#181624" />
          <g transform="translate(194, 74)">
            <circle className="wf-glow" cx="6" cy="6" r="30" fill="#F5B842" opacity={0.08 + fireHp * 0.04} />
            <rect x="-8" y="16" width="28" height="4" fill="#4A3520" />
            <g className="wf-flame" style={{ opacity: 0.45 + (fireHp / FIRE_HP) * 0.55 }}>
              <rect x="0" y="-2" width="12" height="16" fill="#E07856" />
              <rect x="2" y="-8" width="8" height="10" fill="#F5B842" />
              <rect x="4" y="-12" width="4" height="6" fill="#F5D87A" />
            </g>
          </g>
          {/* The wraith — a hollow pixel shade in the lapse's element tint. */}
          <g className="wf-wraith" transform="translate(300, 40)">
            <rect x="0" y="0" width="24" height="30" fill="var(--el-mystic)" opacity="0.5" />
            <rect x="-4" y="8" width="4" height="14" fill="var(--el-mystic)" opacity="0.35" />
            <rect x="24" y="8" width="4" height="14" fill="var(--el-mystic)" opacity="0.35" />
            <rect x="2" y="30" width="6" height="6" fill="var(--el-mystic)" opacity="0.3" />
            <rect x="12" y="30" width="8" height="4" fill="var(--el-mystic)" opacity="0.3" />
            <rect x="5" y="8" width="4" height="6" fill="#0B0A08" />
            <rect x="15" y="8" width="4" height="6" fill="#0B0A08" />
          </g>
        </svg>
        <div className="wf-beast">
          <BeastSprite species={companion} tier={beastTier} size={56} />
        </div>
      </div>

      <p className="journey-wraith" style={{ marginTop: 10 }}>
        {lapse
          ? `A wisp of ${lapse.name} drifts in from ${prov.name}, gnawing at a memory:`
          : 'A null-wraith drifts toward the fire, gnawing at a memory:'}
      </p>

      <div className="card reviews-card">
        <div className="mono" style={{ fontSize: 9, color: 'var(--text-tertiary)', letterSpacing: '.16em', textTransform: 'uppercase', marginBottom: 8 }}>
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
        {/* Wrong answers hold here so the why gets read; correct answers
            auto-advance after the strike. */}
        {picked !== null && picked !== q.answer && <FeedbackPanel question={q} picked={picked} />}
      </div>
      {picked !== null && picked !== q.answer && (
        <button type="button" className="btn btn-primary btn-block" onClick={advance}>
          The fire holds — next wraith →
        </button>
      )}
    </div>
  );
}
