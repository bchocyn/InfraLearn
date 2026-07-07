// Minion/boss quiz-battle data layer.
//
// A battle is 5 questions (7 for the boss), 4 options each, one per turn —
// the enemy has one HP per question, a correct answer is a hit. Questions are
// REAL retrieval from this path's material (the whole point: battles test
// knowledge, they don't dress rote in costume — Bitrot's trap, per lore.js):
//
//   Source A — mathQuizzes[lessonId] for lessons the user has COMPLETED in
//              this path (native 4-option entries, per-lesson attribution so
//              misses feed the weak-spots queue).
//   Source B — DAILY_QUESTIONS[pathKey] across all levels (3-option entries),
//              upgraded to 4 options with a borrowed distractor: a WRONG
//              option from another question in the same path's pool. Borrowing
//              only known-wrong options keeps distractors domain-plausible
//              while guaranteeing we never borrow something that is "the"
//              correct answer elsewhere.
//
// Everything is deterministically seeded by (pathKey, stage, attempt) so a
// retry deals a fresh hand but the same attempt re-renders identically.
import { PATHS, pathProgress } from './content.js';
import { DAILY_QUESTIONS } from './dailyQuestions.js';
import mathQuizzes from './mathQuizzes.js';
import { PROVINCES, FIVE_LAPSES } from './lore.js';
import { MINIONS, encounterStatus, BATTLE_BANKED_PATHS } from './battleMeta.js';

// Re-export the light meta so the battle screen has one import surface.
// (The Roadmap imports battleMeta directly — it must never pull THIS module,
// which drags the full question banks into its chunk.)
export { MINIONS, encounterStatus, BATTLE_BANKED_PATHS };

export function minionFor(pathKey) {
  const lapseId = PROVINCES[pathKey]?.lapse;
  const lapse = lapseId ? FIVE_LAPSES[lapseId] : null;
  const minion = lapseId ? MINIONS[lapseId] : null;
  return lapse && minion ? { lapseId, lapse, ...minion } : null;
}

// ── Deterministic RNG (same shape as WorldMap's) ────────────────────────────
function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function seededShuffle(arr, rnd) {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Normalize both bank shapes to one battle-question shape. `perm` shuffles
// option order (so the borrowed 4th distractor isn't always in slot D); the
// answer index and the whyWrong index-keys are remapped through it.
function normalize({ prompt, options, answer, whyWrong, whyCorrect, explanation, bestPractices, lessonId }, rnd) {
  const perm = seededShuffle(options.map((_, i) => i), rnd);
  const opts = perm.map((oi) => options[oi]);
  const remappedWhy = {};
  if (whyWrong && typeof whyWrong === 'object') {
    for (let ni = 0; ni < perm.length; ni++) {
      const orig = perm[ni];
      if (whyWrong[orig] != null) remappedWhy[ni] = whyWrong[orig];
    }
    if (whyWrong.default != null) remappedWhy.default = whyWrong.default;
  }
  return {
    q: prompt,
    opts,
    answer: perm.indexOf(answer),
    // Display-order → canonical-order option index (so weak-spot records
    // highlight the option the user actually picked when ReviewWeakSpots
    // re-renders the bank's canonical option order).
    origIndex: perm,
    whyWrong: typeof whyWrong === 'string' ? whyWrong : remappedWhy,
    whyCorrect: whyCorrect || null,
    explanation: explanation || null,
    bestPractices: bestPractices || null,
    lessonId: lessonId || null,
  };
}

// ── Pool assembly ───────────────────────────────────────────────────────────
export const BATTLE_QUESTIONS = 5;      // per minion encounter
export const BOSS_QUESTIONS = 7;        // the Lapse asks more of you
export const BATTLE_HEARTS = 2;         // wrongs allowed before the retreat

// Build the (unseeded) raw candidate list for a path. Exported for tests.
export function rawPathPool(pathKey, completed) {
  const out = [];
  // A: 4-option math-quiz entries for COMPLETED lessons of this path.
  const lessons = PATHS[pathKey]?.lessons || [];
  for (const l of lessons) {
    if (!completed?.[l.id]) continue;
    const bank = mathQuizzes[l.id];
    if (!bank?.questions) continue;
    for (const mq of bank.questions) {
      if (!Array.isArray(mq.options) || mq.options.length !== 4) continue;
      out.push({
        prompt: mq.prompt, options: mq.options, answer: mq.answer,
        whyWrong: mq.whyWrong, whyCorrect: mq.whyCorrect,
        explanation: mq.explanation, bestPractices: mq.bestPractices,
        lessonId: l.id,
      });
    }
  }
  // B: 3-option daily questions for this path (tagged with their level so
  // dealBattle can bias toward the learner's progress band), plus the borrow
  // pool of known-wrong options they can draw a 4th distractor from.
  const daily = DAILY_QUESTIONS[pathKey];
  if (daily && typeof daily === 'object') {
    const entries = [];
    for (const [level, arr] of Object.entries(daily)) {
      if (!Array.isArray(arr)) continue;
      for (const e of arr) entries.push({ e, level });
    }
    const wrongPool = [];
    for (const { e } of entries) {
      for (let i = 0; i < e.opts.length; i++) {
        if (i !== e.answer) wrongPool.push(e.opts[i]);
      }
    }
    for (const { e, level } of entries) {
      out.push({
        prompt: e.q, options: e.opts, answer: e.answer,
        whyWrong: e.whyWrong, whyCorrect: e.whyCorrect,
        explanation: e.explanation, bestPractices: e.bestPractices,
        lessonId: null, _wrongPool: wrongPool, _level: level,
      });
    }
  }
  return out;
}

// Daily-bank difficulty ladder, in teaching order. Encounter 1 at ~17%
// progress must not quiz 'distinguished' material the user has never seen —
// dealBattle prefers questions at or below the learner's band and only tops
// up from harder levels when the band can't fill a full hand (small banks
// still deal complete decks).
const LEVEL_ORDER = ['novice', 'junior', 'senior', 'distinguished'];
function allowedLevels(pct) {
  if (pct >= 0.7) return new Set(LEVEL_ORDER);
  if (pct >= 0.35) return new Set(LEVEL_ORDER.slice(0, 3));
  return new Set(LEVEL_ORDER.slice(0, 2));
}

// Upgrade a 3-option daily-bank candidate to 4 options with a borrowed
// wrong-answer distractor that isn't already one of this question's options.
function upgradeTo4(c, rnd) {
  let { options } = c;
  if (options.length === 3 && Array.isArray(c._wrongPool)) {
    const candidates = c._wrongPool.filter((o) => !options.includes(o));
    if (candidates.length > 0) {
      const extra = candidates[Math.floor(rnd() * candidates.length)];
      options = [...options, extra];
    }
  }
  return options;
}

// Deal a battle: `count` normalized 4-option questions, deterministic in
// (pathKey, stage, attempt). Returns [] when the path has no question bank
// yet — callers hide the encounter in that case.
export function dealBattle(pathKey, completed, stage, attempt = 0, count = BATTLE_QUESTIONS) {
  const raw = rawPathPool(pathKey, completed);
  if (raw.length === 0) return [];
  const rnd = mulberry32(hashStr(`${pathKey}:${stage}:${attempt * 17}`));
  // Difficulty band: lesson-anchored questions (Source A) are always fair
  // game — they come from COMPLETED lessons. Daily-bank questions prefer
  // the learner's current band, topping up from harder levels only when
  // the band alone can't fill the hand.
  const { pct } = pathProgress(pathKey, completed);
  const allowed = allowedLevels(pct);
  const preferred = raw.filter((c) => !c._level || allowed.has(c._level));
  const harder = raw.filter((c) => c._level && !allowed.has(c._level));
  const picked = seededShuffle(preferred, rnd).slice(0, count);
  if (picked.length < count) {
    picked.push(...seededShuffle(harder, rnd).slice(0, count - picked.length));
  }
  return picked.map((c) => {
    const options = upgradeTo4(c, rnd);
    return normalize({ ...c, options }, rnd);
  }).filter((q) => q.opts.length >= 3 && q.answer >= 0);
}

// ── Review-mode question picker ─────────────────────────────────────────────
// The Reviews screen quizzes a DUE lesson with a question from that lesson's
// own material, so grading the FSRS card on the answer stays honest:
//   1. mathQuizzes[lessonId] — per-lesson 4-option entries (best evidence);
//   2. the path's daily bank, filtered to questions sharing title keywords
//      with the lesson (a cheap but deterministic relevance proxy);
//   3. the whole path bank (labeled generic — still the same province).
// Returns null when the lesson's path has no bank at all — callers render a
// skip card for that concept (free recall was removed by owner decision).
// `attempt` salts the deterministic pick — callers pass the card's rep count
// so successive reviews draw different probes with fresh option orders.
export function pickReviewQuestion(lessonId, attempt = 0) {
  let pathKey = null;
  let lesson = null;
  for (const k of Object.keys(PATHS)) {
    const hit = PATHS[k].lessons.find((l) => l.id === lessonId);
    if (hit) { pathKey = k; lesson = hit; break; }
  }
  if (!pathKey) return null;
  const rnd = mulberry32(hashStr(`review:${lessonId}:${attempt * 17}`));

  // 1 — the lesson's own math-quiz bank.
  const own = mathQuizzes[lessonId]?.questions?.filter(
    (mq) => Array.isArray(mq.options) && mq.options.length === 4
  );
  if (own && own.length > 0) {
    const mq = own[Math.floor(rnd() * own.length)];
    return normalize({
      prompt: mq.prompt, options: mq.options, answer: mq.answer,
      whyWrong: mq.whyWrong, whyCorrect: mq.whyCorrect,
      explanation: mq.explanation, bestPractices: mq.bestPractices,
      lessonId,
    }, rnd);
  }

  // 2/3 — the path bank, preferring title-keyword matches.
  const pool = rawPathPool(pathKey, {}).filter((c) => !c.lessonId);
  if (pool.length === 0) return null;
  const tokens = (lesson.title || '').toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 3);
  const scored = pool
    .map((c) => ({
      c,
      score: tokens.reduce((n, w) => n + (c.prompt.toLowerCase().includes(w) ? 1 : 0), 0),
    }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);
  const candidates = scored.length > 0 ? scored.slice(0, 5).map((s) => s.c) : pool;
  const chosen = candidates[Math.floor(rnd() * candidates.length)];
  const options = upgradeTo4(chosen, rnd);
  return normalize({ ...chosen, options }, rnd);
}

