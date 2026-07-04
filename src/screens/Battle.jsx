import { useMemo, useState } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { useStore } from '../store/useStore.js';
import { PATHS, pathProgress } from '../data/content.js';
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

  const completed = useStore((s) => s.completed);
  const battles = useStore((s) => s.battles);
  const companion = useStore((s) => s.companion);
  const beastTier = useStore((s) => s.beastTier);
  const recordBattleWin = useStore((s) => s.recordBattleWin);
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

  const count = isBoss ? BOSS_QUESTIONS : BATTLE_QUESTIONS;
  const deck = useMemo(
    () => dealBattle(pathKey, completed, stage, attempt, count),
    [pathKey, completed, stage, attempt, count]
  );

  const validStage = isBoss || (Number.isInteger(stage) && stage >= 1 && stage <= 5);
  const invalid = !path || !minion || !validStage || deck.length === 0;

  const { pct } = pathProgress(pathKey, completed);
  const status = encounterStatus(pathKey, stage, pct, battles);
  const replay = status.beaten; // already cleared → practice run, no rewards

  const q = deck.length ? deck[Math.min(turn, deck.length - 1)] : null;
  // Enemy HP = one per question, damaged only by CORRECT answers. `wrongs`
  // already includes the current pick (committed in choose()).
  const answeredCount = turn + (picked !== null ? 1 : 0);
  const enemyHp = count - (answeredCount - wrongs);
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
    if (!reduced) setTimeout(() => setFx(''), 500);
    if (correct) {
      // Recovered a previously-missed math-quiz question → clear the weak spot.
      if (q.lessonId && quizMisses?.[q.lessonId]?.[q.q]) clearQuizMiss(q.lessonId, q.q);
    } else {
      // Feed weak spots. Translate the shuffled pick back to the bank's
      // canonical option index; borrowed 4th options have no canonical slot.
      const canonical = q.origIndex?.[i];
      recordQuizMiss(
        q.lessonId || '__daily_practice__',
        q.q,
        q.lessonId && Number.isInteger(canonical) && canonical <= 3 ? canonical : null
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
    if (turn + 1 >= count) {
      // Deck exhausted: win iff hearts survived (wrongs < BATTLE_HEARTS).
      if (nextWrongs < BATTLE_HEARTS) {
        recordBattleWin(pathKey, stage); // watermark-latched; no-op on replay
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
  };

  // 1-4 pick an answer; Enter/Space advances after feedback.
  const keyHandlers = useMemo(() => ({
    1: () => choose(0), 2: () => choose(1), 3: () => choose(2), 4: () => choose(3),
    Enter: () => (outcome ? null : advance()),
  }), [picked, outcome, turn, wrongs, q]); // eslint-disable-line react-hooks/exhaustive-deps
  useKeyboardShortcuts(keyHandlers, [keyHandlers]);

  // Guard AFTER every hook (rules of hooks): bad route params, unknown
  // province, or a path whose banks can't deal a hand bounce to the map.
  if (invalid) return <Navigate to="/roadmap" replace />;

  // ── End screens ────────────────────────────────────────────────────────
  if (outcome) {
    const won = outcome === 'win';
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
                  : `${count - wrongs}/${count} answered true. The road to ${provName} grows brighter.`)
              : `${enemyName} slips away for now. The ${wrongs} you missed are waiting in your weak spots — review them and call the challenge again.`}
          </p>
          {won && !replay && <p className="btl-end-xp">+{isBoss ? 40 : 15} XP</p>}
        </div>
        <div className="row" style={{ gap: 8 }}>
          {!won && <button className="btn btn-primary" style={{ flex: 1 }} onClick={retry}>⚔ Challenge again</button>}
          {!won && wrongs > 0 && <button className="btn" style={{ flex: 1 }} onClick={() => nav('/weak-spots')}>Review weak spots</button>}
          <button className={`btn ${won ? 'btn-primary' : ''}`} style={{ flex: 1 }} onClick={() => nav('/roadmap')}>
            {won ? 'Back to the journey →' : 'Back'}
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

      {/* Arena */}
      <div className={`btl-stage ${fx ? `btl-fx-${fx}` : ''} ${reduced ? 'btl-static' : ''}`}>
        {/* Enemy info card — top-left */}
        <div className="btl-card btl-card-enemy">
          <span className="btl-name">{enemyName}</span>
          <span className="btl-lv">♦ Lv.{enemyLv}</span>
          <div className="btl-hpbar" role="img" aria-label={`Enemy HP ${Math.max(0, enemyHp)} of ${count}`}>
            <span className="btl-hplabel">HP</span>
            <div className="btl-hptrack">
              <div className="btl-hpfill" style={{ width: `${(Math.max(0, enemyHp) / count) * 100}%` }} />
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
        <div className="btl-turn">{turn + 1}/{count}</div>
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
