import { useMemo, useState } from 'react';
import { useNavigate, useParams, useLocation, Navigate } from 'react-router-dom';
import { useStore } from '../store/useStore.js';
import { PATHS, pathProgress } from '../data/content.js';
import { battleBlockForLessonId } from '../data/battleMeta.js';
import { PROVINCES } from '../data/lore.js';
import { BEASTS } from '../data/beasts.js';
import BeastSprite, { nullBeastSrc } from '../components/BeastSprite.jsx';
import AnimatedSprite from '../components/AnimatedSprite.jsx';
import FeedbackPanel from '../components/FeedbackPanel.jsx';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts.js';
import {
  dealBattle, minionFor, encounterStatus,
  BATTLE_QUESTIONS, BOSS_QUESTIONS, BATTLE_HEARTS,
} from '../data/battles.js';

// ─── Quiz battle (Pokémon-style) ─────────────────────────────────────────────
// Route: /battle/:pathKey/:stage where stage ∈ 1..5 (minion) | 'boss'.
// One question per turn, 4 answers. Correct = your beast strikes, enemy loses
// 1 HP. Wrong = the enemy strikes, you lose a heart, AND the correct answer +
// why is shown immediately (the pedagogy IS the point — this is retrieval
// practice in battle costume, same honesty rule as Watchfire).
//
// Rewards mint only through recordBattleWin's watermark (retries and replays
// are free practice). Wrong answers feed the weak-spots queue; a correct
// answer on a previously-missed math-quiz question clears it (same contract
// as MathQuiz.jsx).

const ASSET = `${import.meta.env.BASE_URL}worldmap/`;

// Minion idle loops — 5 pixellab frames per species (frame 0 is the base
// sprite), swapped by the shared AnimatedSprite player. Reduced motion falls
// back to frame 0 automatically inside AnimatedSprite.
const MINION_FRAME_COUNT = 5;
const minionFrames = (lapseId) =>
  Array.from({ length: MINION_FRAME_COUNT }, (_, i) => `${ASSET}anim/minion-${lapseId}-${i}.png`);

export default function Battle() {
  const { pathKey, stage: stageParam } = useParams();
  const nav = useNavigate();
  // When BattleGate redirected here from a barred lesson, it passes the
  // lesson id in nav state so the battle can say WHAT it is blocking and
  // route the win back there ("Continue to <lesson>") instead of dumping
  // the user on the Roadmap to re-find their place.
  const { state: navState } = useLocation();
  const fromLessonId = navState?.fromLessonId || null;

  const completed = useStore((s) => s.completed);
  const battles = useStore((s) => s.battles);
  const companion = useStore((s) => s.companion);
  const beastTier = useStore((s) => s.beastTier);
  const recordBattleWin = useStore((s) => s.recordBattleWin);
  const scheduleReview = useStore((s) => s.scheduleReview);
  const recordQuizMiss = useStore((s) => s.recordQuizMiss);
  const clearQuizMiss = useStore((s) => s.clearQuizMiss);
  const quizMisses = useStore((s) => s.quizMisses);
  const reducedSetting = useStore((s) => s.settings?.reducedMotion);
  const reduced = reducedSetting
    || (typeof window !== 'undefined' && window.matchMedia
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  const isBoss = stageParam === 'boss';
  const stage = isBoss ? 'boss' : parseInt(stageParam, 10);
  const path = PATHS[pathKey];
  const minion = minionFor(pathKey);

  const [attempt, setAttempt] = useState(0);
  const [turn, setTurn] = useState(0);          // question index
  const [wrongs, setWrongs] = useState(0);
  const [picked, setPicked] = useState(null);   // null = awaiting answer
  const [fx, setFx] = useState('');             // 'strike' | 'hit' | ''
  const [outcome, setOutcome] = useState(null); // 'win' | 'lose' | null
  const [minted, setMinted] = useState(false);  // recordBattleWin actually paid

  const count = isBoss ? BOSS_QUESTIONS : BATTLE_QUESTIONS;
  const deck = useMemo(
    () => dealBattle(pathKey, completed, stage, attempt, count),
    [pathKey, completed, stage, attempt, count]
  );
  // The battle is only as long as the deck the banks could actually deal —
  // without this clamp a short pool (e.g. a boss asking 7 of a 5-question
  // bank) repeats its last question with the answer just shown in feedback.
  const total = Math.min(count, deck.length);

  const validStage = isBoss || (Number.isInteger(stage) && stage >= 1 && stage <= 5);
  const invalid = !path || !minion || !validStage || deck.length === 0;

  const { pct } = pathProgress(pathKey, completed);
  const status = encounterStatus(pathKey, stage, pct, battles);
  const replay = status.beaten; // already cleared → practice run, no rewards
  // Deep links can reach encounters the trail hasn't opened yet — the screen
  // enforces the same rule the Roadmap markers do (locked = fogged screen,
  // NOT a redirect: BattleGate may have sent an out-of-order learner here,
  // and bouncing to /roadmap would loop them).
  const locked = !invalid && !status.unlocked && !status.beaten;

  const q = deck.length ? deck[Math.min(turn, deck.length - 1)] : null;
  // Enemy HP = one per question, damaged only by CORRECT answers. `wrongs`
  // already includes the current pick (committed in choose()).
  const answeredCount = turn + (picked !== null ? 1 : 0);
  const enemyHp = total - (answeredCount - wrongs);
  const hearts = BATTLE_HEARTS - wrongs;
  const enemyName = isBoss ? minion.lapse.name : minion.name;
  const enemyLv = isBoss ? 50 : stage * 7 + 3;
  const beastName = BEASTS?.[companion]?.name || companion;
  const provName = PROVINCES[pathKey]?.name || path.name;

  const choose = (i) => {
    if (!q || picked !== null || outcome || i >= q.opts.length) return;
    const correct = i === q.answer;
    setPicked(i);
    setFx(correct ? 'strike' : 'hit');
    // Always schedule the reset — reduced-motion suppresses the VISUAL via
    // CSS, but the state machine must not depend on that (a stale fx class
    // left on the arena would mis-time any future non-animation styling).
    setTimeout(() => setFx(''), 500);
    // A battle answer on a completed lesson's own question is real retrieval
    // evidence — grade the FSRS card (scheduleReview: scheduler + evidence
    // log, NO XP — battle rewards stay watermark-latched in recordBattleWin).
    // First attempt of a live encounter only: retries and replays are free
    // practice, not fresh evidence. Completed-lesson cards only: daily-bank
    // questions are lessonId-tagged now, and grading a lesson the user never
    // completed would conjure a review card out of thin air.
    if (q.lessonId && !replay && attempt === 0 && completed?.[q.lessonId]) {
      scheduleReview(q.lessonId, correct ? 3 : 1);
    }
    if (correct) {
      // Recovered a previously-missed question → clear the weak spot (both
      // the lesson-anchored and the daily-bank bucket, mirroring the record
      // path below — daily-bank misses used to be clearable only by hand).
      if (q.lessonId && quizMisses?.[q.lessonId]?.[q.q]) clearQuizMiss(q.lessonId, q.q);
      else if (!q.lessonId && quizMisses?.__daily_practice__?.[q.q]) clearQuizMiss('__daily_practice__', q.q);
    } else {
      // Feed weak spots. Translate the shuffled pick back to the bank's
      // canonical option index; borrowed 4th options have no canonical slot
      // (bankOpts = the canonical entry's option count, 3 for daily bank).
      const canonical = q.origIndex?.[i];
      recordQuizMiss(
        q.lessonId || '__daily_practice__',
        q.q,
        q.lessonId && Number.isInteger(canonical) && canonical < (q.bankOpts ?? 4) ? canonical : null
      );
      setWrongs((w) => w + 1);
    }
  };

  const advance = () => {
    if (!q || picked === null || outcome) return;
    const wasCorrect = picked === q.answer;
    const nextWrongs = wrongs; // already committed in choose()
    if (!wasCorrect && nextWrongs >= BATTLE_HEARTS) {
      setOutcome('lose');
      return;
    }
    if (turn + 1 >= total) {
      // Deck exhausted: win iff hearts survived (wrongs < BATTLE_HEARTS).
      if (nextWrongs < BATTLE_HEARTS) {
        // Watermark-latched; returns true only when XP actually minted so
        // the end screen can't display rewards that weren't paid.
        setMinted(recordBattleWin(pathKey, stage) === true);
        setOutcome('win');
      } else {
        setOutcome('lose');
      }
      return;
    }
    setTurn((t) => t + 1);
    setPicked(null);
  };

  const retry = () => {
    setAttempt((a) => a + 1); // fresh deterministic hand
    setTurn(0); setWrongs(0); setPicked(null); setOutcome(null); setFx('');
    setMinted(false);
  };

  // Resolve the barred lesson's title (gate context for the kicker + win CTA).
  const fromLesson = useMemo(() => {
    if (!fromLessonId) return null;
    for (const p of Object.values(PATHS)) {
      const hit = p.lessons.find((l) => l.id === fromLessonId);
      if (hit) return hit;
    }
    return null;
  }, [fromLessonId]);

  // 1-4 pick an answer; Enter/Space advances after feedback.
  const keyHandlers = useMemo(() => ({
    1: () => choose(0), 2: () => choose(1), 3: () => choose(2), 4: () => choose(3),
    Enter: () => (outcome ? null : advance()),
  }), [picked, outcome, turn, wrongs, q]); // eslint-disable-line react-hooks/exhaustive-deps
  useKeyboardShortcuts(keyHandlers, [keyHandlers]);

  // Guard AFTER every hook (rules of hooks): bad route params, unknown
  // province, or a path whose banks can't deal a hand bounce to the map.
  if (invalid) return <Navigate to="/roadmap" replace />;

  // Locked encounter (deep link past the trail's own gating): a graceful
  // fogged screen, not a redirect — and no battle, so the 920-XP economy
  // can't be minted from zero progress. States the exact requirement (R4:
  // gate on a NAMED condition, never a diffuse threshold).
  if (locked) {
    const b = battles?.[pathKey] || { minions: 0 };
    const needPrev = !isBoss && b.minions < stage - 1;
    const needPct = isBoss ? pct < 1 : pct < stage / 6;
    return (
      <div className="screen fade-in">
        <button className="wm-back" onClick={() => nav('/roadmap')} aria-label="Back to the journey">← Back</button>
        <div className="kicker" style={{ margin: '6px 0 8px' }}>
          {provName.toUpperCase()} · {isBoss ? 'BOSS BATTLE' : `ENCOUNTER ${stage}/5`} · FOGGED
        </div>
        <div className="card">
          <p style={{ fontSize: 14.5, lineHeight: 1.5, margin: '0 0 8px' }}>
            The road to this fight is still under the Null&apos;s fog.
          </p>
          <p className="caption" style={{ margin: 0 }}>
            {isBoss
              ? `${enemyName} only shows itself once every lesson in ${provName} is reclaimed and all five minions are beaten.`
              : needPrev
                ? `Beat encounter ${b.minions + 1} first — minions bar the road in order.`
                : needPct
                  ? `Reclaim more of ${provName} first — this minion stirs at ${Math.round((stage / 6) * 100)}% progress.`
                  : 'Walk the trail a little further first.'}
          </p>
        </div>
        <button className="btn btn-primary btn-block" onClick={() => nav('/roadmap')}>
          Back to the journey →
        </button>
      </div>
    );
  }

  // ── End screens ────────────────────────────────────────────────────────
  if (outcome) {
    const won = outcome === 'win';
    // If this battle was reached from a barred lesson, route the win back
    // toward it — either the lesson itself or the NEXT encounter still in
    // the way (battles is store-subscribed, so this reads the post-win map).
    const nextGate = won && fromLessonId ? battleBlockForLessonId(fromLessonId, battles) : null;
    const winCta = nextGate?.blocked
      ? { label: `Next encounter ${nextGate.stage}/5 — the road's not clear yet →`,
          go: () => nav(`/battle/${nextGate.pathKey}/${nextGate.stage}`, { state: { fromLessonId } }) }
      : fromLesson && won
        ? { label: `Continue to ${fromLesson.title} →`, go: () => nav(`/lesson/${fromLessonId}`) }
        : { label: 'Back to the journey →', go: () => nav('/roadmap') };
    return (
      <div className="screen fade-in">
        <div className="kicker" style={{ marginBottom: 4 }}>{provName.toUpperCase()} · {isBoss ? 'BOSS' : `ENCOUNTER ${stage}/5`}</div>
        <h1 className="h1">{won ? (isBoss ? `${enemyName} has fled!` : `${enemyName} defeated!`) : 'A tactical retreat.'}<span className="dot">.</span></h1>
        <div className={`card btl-end ${won ? 'btl-end-win' : ''}`}>
          <div className="btl-end-sprite">
            {isBoss ? (
              <img src={nullBeastSrc(minion.lapseId)} alt="" width="120" height="120"
                style={{ imageRendering: 'pixelated', filter: won ? 'none' : 'grayscale(1) brightness(0.62)' }} />
            ) : (
              <img src={`${ASSET}minion-${minion.lapseId}.png`} alt="" width="96" height="96"
                style={{ imageRendering: 'pixelated', filter: won ? 'grayscale(1) opacity(0.5)' : 'none' }} />
            )}
          </div>
          <p className="btl-end-copy">
            {won
              ? (isBoss
                ? `${minion.lapse.voice}`
                : replay
                  ? 'A clean practice run — the road stays clear.'
                  : `${total - wrongs}/${total} answered true. The road to ${provName} grows brighter.`)
              : `${enemyName} slips away for now. The ${wrongs} you missed are waiting in your weak spots — review them and call the challenge again.`}
          </p>
          {/* Only show XP the watermark actually paid — a replay or an
              out-of-order win must not claim rewards that weren't minted. */}
          {won && minted && <p className="btl-end-xp">+{isBoss ? 40 : 15} XP</p>}
        </div>
        <div className="row" style={{ gap: 8 }}>
          {!won && <button className="btn btn-primary" style={{ flex: 1 }} onClick={retry}>⚔ Challenge again</button>}
          {!won && wrongs > 0 && <button className="btn" style={{ flex: 1 }} onClick={() => nav('/weak-spots')}>Review weak spots</button>}
          <button className={`btn ${won ? 'btn-primary' : ''}`} style={{ flex: 1 }} onClick={winCta.go}>
            {won ? winCta.label : 'Back'}
          </button>
        </div>
      </div>
    );
  }

  // ── The battle ─────────────────────────────────────────────────────────
  return (
    <div className="screen fade-in">
      <button className="wm-back" onClick={() => nav('/roadmap')} aria-label="Flee back to the journey">← Flee</button>
      <div className="kicker" style={{ margin: '6px 0 8px' }}>
        {provName.toUpperCase()} · {isBoss ? 'BOSS BATTLE' : `ENCOUNTER ${stage}/5`}{replay ? ' · PRACTICE' : ''}
      </div>
      {/* Gate context — when a barred lesson sent the user here, say so.
          A context-free teleport into a fight reads as a bug, not a gate. */}
      {fromLesson && !replay && (
        <p className="caption" style={{ margin: '0 0 8px', fontSize: 12 }}>
          A {minion.name} blocks the road to <strong style={{ color: 'var(--text-secondary)' }}>{fromLesson.title}</strong> — win to pass.
        </p>
      )}

      {/* Arena */}
      <div className={`btl-stage ${fx ? `btl-fx-${fx}` : ''} ${reduced ? 'btl-static' : ''}`}>
        {/* Enemy info card — top-left */}
        <div className="btl-card btl-card-enemy">
          <span className="btl-name">{enemyName}</span>
          <span className="btl-lv">♦ Lv.{enemyLv}</span>
          <div className="btl-hpbar" role="img" aria-label={`Enemy HP ${Math.max(0, enemyHp)} of ${total}`}>
            <span className="btl-hplabel">HP</span>
            <div className="btl-hptrack">
              <div className="btl-hpfill" style={{ width: `${(Math.max(0, enemyHp) / total) * 100}%` }} />
            </div>
          </div>
        </div>
        {/* Enemy sprite — top-right on its platform. Minions play their
            pixellab idle loop; the boss keeps its big static portrait with
            the CSS float doing the breathing. */}
        <div className="btl-enemy">
          <div className="btl-platform" />
          {isBoss ? (
            <img
              className="btl-enemy-sprite"
              src={nullBeastSrc(minion.lapseId)}
              alt={enemyName}
              style={{ imageRendering: 'pixelated' }}
            />
          ) : (
            <AnimatedSprite
              frames={minionFrames(minion.lapseId)}
              fps={6}
              size={84}
              alt={enemyName}
              className="btl-enemy-sprite"
            />
          )}
        </div>
        {/* Player beast — bottom-left, flipped to face the enemy */}
        <div className="btl-player">
          <div className="btl-platform btl-platform-near" />
          <div className="btl-player-sprite"><BeastSprite species={companion} tier={beastTier} size={84} /></div>
        </div>
        {/* Player info card — bottom-right */}
        <div className="btl-card btl-card-player">
          <span className="btl-name">{beastName}</span>
          <span className="btl-hearts" role="img" aria-label={`${hearts} of ${BATTLE_HEARTS} hearts left`}>
            {'♥'.repeat(Math.max(0, hearts))}{'♡'.repeat(Math.max(0, BATTLE_HEARTS - hearts))}
          </span>
        </div>
      </div>

      {/* Dialogue box: the question (turn counter rides the corner) */}
      <div className="btl-dialog card">
        <div className="btl-turn">{turn + 1}/{total}</div>
        <p className="btl-question">{q.q}</p>
      </div>

      {/* The 4 answers, Pokémon-menu style */}
      <div className="btl-menu" role="group" aria-label="Answers">
        {q.opts.map((opt, i) => {
          const isPicked = picked === i;
          const isAnswer = picked !== null && i === q.answer;
          const tone = picked === null ? '' : isAnswer ? ' btl-opt-correct' : isPicked ? ' btl-opt-wrong' : ' btl-opt-dim';
          return (
            <button
              key={i}
              type="button"
              className={`btl-opt btl-opt-${i}${tone}`}
              onClick={() => choose(i)}
              disabled={picked !== null}
            >
              <span className="btl-opt-key">{i + 1}</span>
              <span className="btl-opt-text">{opt}</span>
            </button>
          );
        })}
      </div>

      {/* Post-answer: why, then continue */}
      {picked !== null && (
        <>
          <FeedbackPanel question={q} picked={picked} />
          <button className="btn btn-primary btn-block" style={{ marginTop: 10 }} onClick={advance}>
            {picked === q.answer
              ? `${beastName} strikes! →`
              : wrongs >= BATTLE_HEARTS ? `${enemyName} overwhelms you…` : `${enemyName} strikes back… →`}
          </button>
        </>
      )}
    </div>
  );
}
