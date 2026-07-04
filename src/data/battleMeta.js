// Light battle metadata — SAFE FOR THE EAGER BUNDLE. The Roadmap (eager)
// renders encounter markers from this module; the heavy question banks stay
// quarantined in battles.js, which rides the lazy Battle-screen chunk and
// re-exports everything here so the battle screen has one import surface.
import { PATHS } from './content.js';

// One descendant minion species per Lapse (sprite:
// public/worldmap/minion-{lapseId}.png, pixellab, keyed transparent).
export const MINIONS = {
  bitrot: { name: 'Bitling', flavor: 'A hatchling of Bitrot. It gnaws the corner of a page it cannot read.' },
  cindercrown: { name: 'Cinderling', flavor: 'An empty little helmet trailing sparks. Nobody home — never was.' },
  drift: { name: 'Driftling', flavor: 'A wisp with two stubby wings. It wants to show you something else. And something else.' },
  lethe: { name: 'Lethling', flavor: 'A droplet of the Hushtide. It yawns, and you feel like yawning too.' },
};

// Paths whose banks can actually deal a battle hand today. Kept as a static
// set so the eager Roadmap never imports the banks; tests/store-battles
// asserts this list matches the real banks so it can't silently drift when
// dailyQuestions gains (or loses) a path.
export const BATTLE_BANKED_PATHS = new Set([
  'fundamentals', 'devops', 'mlops', 'swe', 'mleng', 'faang',
  // Authored 2026-07 (content fan-out) — every path battles now.
  'fullstack', 'cybersec',
]);

// Encounter gating, shared by the trail markers and the battle screen.
// Stage k (1..5) needs: path progress ≥ k/6 AND the previous stage beaten.
// The boss needs 100% progress AND all five minions.
export function encounterStatus(pathKey, stage, pct, battles) {
  const b = battles?.[pathKey] || { minions: 0, boss: false };
  if (stage === 'boss') {
    return {
      beaten: b.boss,
      unlocked: !b.boss && b.minions >= 5 && pct >= 1,
    };
  }
  return {
    beaten: b.minions >= stage,
    unlocked: b.minions >= stage || (b.minions === stage - 1 && pct >= stage / 6),
  };
}

// ── The road-block rule ─────────────────────────────────────────────────────
// Minions bar the road, Pokémon-trainer style: encounter k stands at trail
// fraction k/6, so a NEW (incomplete) lesson at index i can't be opened while
// any encounter at-or-before it is unbeaten. Completed lessons stay freely
// reviewable. Same fraction math as the trail markers, so the block always
// points at a marker the user can see.
export function battleGateForLesson(pathKey, lessonIdx, lessonCount, battles) {
  if (!BATTLE_BANKED_PATHS.has(pathKey) || lessonCount <= 0) return { blocked: false, stage: 0 };
  const required = Math.min(5, Math.floor((lessonIdx * 6) / lessonCount));
  const have = battles?.[pathKey]?.minions || 0;
  return required > have
    ? { blocked: true, stage: have + 1 } // send them to the NEXT due fight
    : { blocked: false, stage: 0 };
}

// Route-level variant (guards /lesson/:id from Library, Home, deep links…):
// resolve the lesson's path + index by id, then apply the same rule.
export function battleBlockForLessonId(lessonId, battles) {
  for (const pathKey of Object.keys(PATHS)) {
    const lessons = PATHS[pathKey].lessons;
    const idx = lessons.findIndex((l) => l.id === lessonId);
    if (idx >= 0) {
      return { ...battleGateForLesson(pathKey, idx, lessons.length, battles), pathKey };
    }
  }
  return { blocked: false, stage: 0, pathKey: null };
}
