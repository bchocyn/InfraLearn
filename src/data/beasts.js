// Byte Beast roster. Sprite art is loaded from /public/beasts/manifest.json at runtime;
// this file holds the design metadata (names, evolution line names, archetypes, triggers).

export const ELEMENTS = {
  fire: { label: 'Fire', icon: '🔥', cls: 'el-fire' },
  water: { label: 'Water', icon: '🌊', cls: 'el-water' },
  earth: { label: 'Earth', icon: '⬢', cls: 'el-earth' },
  sky: { label: 'Sky', icon: '☁', cls: 'el-sky' },
  mystic: { label: 'Mystic', icon: '✦', cls: 'el-mystic' },
};

// Each species: element, archetype, and the 4 evolution-stage display names.
export const BEASTS = {
  dragon:   { name: 'Dragon',   element: 'fire',   archetype: 'The slow burn — deep, sustained study.',          forms: ['Ember', 'Cinderwing', 'Infernath', 'Infernath Prime'] },
  phoenix:  { name: 'Phoenix',  element: 'fire',   archetype: 'Restarts strong — great for stop-start learning.', forms: ['Sparkling', 'Flarewing', 'Solaris', 'Solaris Prime'] },
  griffin:  { name: 'Griffin',  element: 'sky',    archetype: 'Pattern-spotter — a systems thinker.',             forms: ['Fledgewing', 'Skyclaw', 'Stormcrest', 'Stormcrest Prime'] },
  unicorn:  { name: 'Unicorn',  element: 'mystic', archetype: 'Topic-hopper — chaotic-curious.',                  forms: ['Foalight', 'Lumicorn', 'Prismare', 'Prismare Prime'] },
  kraken:   { name: 'Kraken',   element: 'water',  archetype: 'Deep diver — one concept at a time.',              forms: ['Tideling', 'Deepmaw', 'Abyssal', 'Abyssal Prime'] },
  hydra:    { name: 'Hydra',    element: 'water',  archetype: 'Multitasker — parallel paths.',                    forms: ['Twincoil', 'Triscale', 'Heptyr', 'Heptyr Prime'] },
  cerberus: { name: 'Cerberus', element: 'earth',  archetype: 'Guardian — perfects the fundamentals.',           forms: ['Pupguard', 'Wardenhound', 'Cerberus', 'Cerberus Prime'] },
  pegasus:  { name: 'Pegasus',  element: 'sky',    archetype: 'Momentum-driven — a fast learner.',                forms: ['Coltwing', 'Galehoof', 'Celestride', 'Celestride Prime'] },
  sphinx:   { name: 'Sphinx',   element: 'mystic', archetype: 'Riddle-solver — loves puzzles (FAANG).',           forms: ['Cubsphinx', 'Riddlepaw', 'Enigmara', 'Enigmara Prime'] },
  wyvern:   { name: 'Wyvern',   element: 'earth',  archetype: 'Lab builder — a pragmatist.',                      forms: ['Drakeling', 'Cragwyrm', 'Terravyrn', 'Terravyrn Prime'] },
};

export const SPECIES_KEYS = Object.keys(BEASTS);

// Evolution requirements. Tier is the *current* form (1..4).
// T1->T2: Junior + 40% path. T2->T3: Senior + path Gold. T3->T4: 100% path complete.
export const EVO_RULES = [
  { from: 1, to: 2, needLevel: 'junior', needPathPct: 0.40, label: 'Junior + 40% of path' },
  { from: 2, to: 3, needLevel: 'senior', needBadge: 'gold', label: 'Senior + Gold medal' },
  { from: 3, to: 4, needLevel: 'senior', needPathPct: 1.0, label: '100% the entire path' },
];

export const LEVELS = ['novice', 'junior', 'senior', 'distinguished'];
export const LEVEL_LABEL = { novice: 'Novice', junior: 'Junior', senior: 'Senior', distinguished: 'Distinguished' };

// Given current tier + state, return the tier the beast should be at.
export function resolveTier(currentTier, { level, pathPct, badge }) {
  let tier = currentTier;
  for (const rule of EVO_RULES) {
    if (rule.from !== tier) continue;
    const levelOk = LEVELS.indexOf(level) >= LEVELS.indexOf(rule.needLevel);
    const pctOk = rule.needPathPct == null || pathPct >= rule.needPathPct;
    const badgeOk = !rule.needBadge || badge === rule.needBadge || badge === 'gold';
    if (levelOk && pctOk && badgeOk) tier = rule.to;
  }
  return tier;
}
