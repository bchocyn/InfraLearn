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
import { PATHS } from './content.js';
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
  // B: 3-option daily questions for this path (all levels), plus the borrow
  // pool of known-wrong options they can draw a 4th distractor from.
  const daily = DAILY_QUESTIONS[pathKey];
  if (daily && typeof daily === 'object') {
    const entries = Object.values(daily).flat();
    const wrongPool = [];
    for (const e of entries) {
      for (let i = 0; i < e.opts.length; i++) {
        if (i !== e.answer) wrongPool.push(e.opts[i]);
      }
    }
    for (const e of entries) {
      out.push({
        prompt: e.q, options: e.opts, answer: e.answer,
        whyWrong: e.whyWrong, whyCorrect: e.whyCorrect,
        explanation: e.explanation, bestPractices: e.bestPractices,
        lessonId: null, _wrongPool: wrongPool,
      });
    }
  }
  return out;
}

// Deal a battle: `count` normalized 4-option questions, deterministic in
// (pathKey, stage, attempt). Returns [] when the path has no question bank
// yet (fullstack/cybersec today) — callers hide the encounter in that case.
export function dealBattle(pathKey, completed, stage, attempt = 0, count = BATTLE_QUESTIONS) {
  const raw = rawPathPool(pathKey, completed);
  if (raw.length === 0) return [];
  const rnd = mulberry32(hashStr(`${pathKey}:${stage}:${attempt * 17}`));
  const picked = seededShuffle(raw, rnd).slice(0, count);
  return picked.map((c) => {
    let { options, answer } = c;
    if (options.length === 3 && Array.isArray(c._wrongPool)) {
      // Upgrade to 4 options with a borrowed wrong-answer distractor that
      // isn't already one of this question's options.
      const candidates = c._wrongPool.filter((o) => !options.includes(o));
      if (candidates.length > 0) {
        const extra = candidates[Math.floor(rnd() * candidates.length)];
        options = [...options, extra];
      }
    }
    return normalize({ ...c, options, answer }, rnd);
  }).filter((q) => q.opts.length >= 3 && q.answer >= 0);
}

