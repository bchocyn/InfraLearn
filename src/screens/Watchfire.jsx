// Watchfire Defense — reviews-as-battles (journey design §12 #1).
//
// THE design rule: the game is presentation, the scheduler stays honest.
// Under the hood this is exactly the Reviews screen's loop — snapshot
// getReviewsDue() at mount, free-recall → reveal → self-grade →
// markReviewed(id, grade) — wearing a battle skin: due cards are Null-
// wraiths drifting toward the watchfire, good/easy sends the beast to
// strike, a miss costs the fire one heart (the card returns tomorrow via
// FSRS, exactly as it always did). No XP or embers are minted here beyond
// what markReviewed itself awards — patrols can't be farmed any harder
// than reviews can.
//
// The fire never "dies" punitively: at zero hearts it gutters but holds.
// Failure costs theater, never progress — the forgiveness stance the
// streak system already canonized.

import { useMemo, useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore, getReviewsDue } from '../store/useStore.js';
import { PATHS } from '../data/content.js';
import { PROVINCES, FIVE_LAPSES } from '../data/lore.js';
import BeastSprite from '../components/BeastSprite.jsx';
import CelebrationMoment from '../components/CelebrationMoment.jsx';
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
// Same grades + semantics as Reviews — only the hints wear the costume.
const GRADES = [
  { g: 1, label: '✗ Miss',  tone: 'var(--el-fire)',        hint: 'The fire takes the hit' },
  { g: 2, label: 'Hard',    tone: 'var(--accent-amber)',   hint: 'A glancing blow'        },
  { g: 3, label: 'Good',    tone: 'var(--status-success)', hint: 'Clean strike'           },
  { g: 4, label: 'Easy',    tone: 'var(--el-water)',       hint: 'Banished outright'      },
];

export default function Watchfire() {
  const nav = useNavigate();
  const reviewQueue = useStore((s) => s.reviewQueue);
  const markReviewed = useStore((s) => s.markReviewed);
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
  const [typed, setTyped] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [fireHp, setFireHp] = useState(FIRE_HP);
  const [banished, setBanished] = useState(0);
  // 'strike' | 'stagger' | 'hit' — one-shot animation class on the stage.
  const [fx, setFx] = useState(null);
  const fxTimer = useRef(null);
  useEffect(() => () => { if (fxTimer.current) clearTimeout(fxTimer.current); }, []);

  const total = dueIds.length;
  const done = idx >= total;
  const conceptIdNow = !done ? dueIds[idx] : null;
  const canGrade = revealed && !done && !!conceptIdNow;

  const grade = (g) => {
    if (!canGrade) return;
    // The honest part: the real scheduler call, identical to Reviews.
    markReviewed(conceptIdNow, g);
    // The theater: strike/stagger/hit flash before the next wraith drifts in.
    if (g >= 3) setBanished((n) => n + 1);
    if (g === 1) setFireHp((hp) => Math.max(0, hp - 1));
    const kind = g >= 3 ? 'strike' : g === 2 ? 'stagger' : 'hit';
    const advance = () => {
      setTyped(''); setRevealed(false); setFx(null); setIdx((i) => i + 1);
    };
    if (reducedMotion) { advance(); return; }
    setFx(kind);
    fxTimer.current = setTimeout(advance, 450);
  };

  useKeyboardShortcuts(
    {
      Enter: () => { if (!done && !revealed && typed.trim().length > 0) setRevealed(true); },
      ' ':   () => { if (!done && !revealed && typed.trim().length > 0) setRevealed(true); },
      1: () => grade(1),
      2: () => grade(2),
      3: () => grade(3),
      4: () => grade(4),
    },
    [idx, typed, revealed, done, conceptIdNow, canGrade, reducedMotion],
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
  if (!meta) {
    return (
      <div className="screen fade-in">
        <div className="card">
          <p className="caption">This wraith is a ghost of a removed lesson — let it pass.</p>
          <button type="button" className="btn btn-block" onClick={() => { setTyped(''); setRevealed(false); setIdx(idx + 1); }}>
            Next →
          </button>
        </div>
      </div>
    );
  }
  const { lesson, pathKey, pathName } = meta;
  const tagline = lesson.tagline || lesson.title;
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
          {pathName}
        </div>
        <div className="reviews-title">{lesson.title}</div>
        <div className="reviews-prompt">
          Hold the memory: what is <em>{lesson.title}</em>?
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
            onClick={() => setRevealed(true)}
            disabled={typed.trim().length === 0}
            title={typed.trim().length === 0 ? 'Type something first' : 'Reveal the answer'}
          >
            Reveal
          </button>
        )}

        {revealed && (
          <div className="reviews-reveal">
            <div className="kicker" style={{ color: 'var(--status-success)', marginBottom: 4 }}>
              THE MEMORY, WHOLE
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
