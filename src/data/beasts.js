// Byte Beast roster. Sprite art is loaded from /public/beasts/manifest.json at runtime;
// this file holds the design metadata (names, evolution line names, archetypes, triggers).

export const ELEMENTS = {
  fire: { label: 'Fire', icon: '🔥', cls: 'el-fire' },
  water: { label: 'Water', icon: '🌊', cls: 'el-water' },
  earth: { label: 'Earth', icon: '⬢', cls: 'el-earth' },
  sky: { label: 'Sky', icon: '☁', cls: 'el-sky' },
  mystic: { label: 'Mystic', icon: '✦', cls: 'el-mystic' },
};

// Each species: element, archetype (learning-style fit), a short flavor `desc`
// (shown after the egg hatches / on selection), and the 4 evolution-stage names.
export const BEASTS = {
  dragon:   { name: 'Dragon',   element: 'fire',   archetype: 'The slow burn — deep, sustained study.',          desc: 'An azure Qinglong of the East, coiled around a pearl of deep knowledge. It rewards patience.', forms: ['Ember', 'Cinderwing', 'Infernath', 'Infernath Prime'] },
  phoenix:  { name: 'Phoenix',  element: 'fire',   archetype: 'Restarts strong — great for stop-start learning.', desc: 'A blazing firebird that burns away every mistake and rises again, brighter than before.', forms: ['Sparkling', 'Flarewing', 'Solaris', 'Solaris Prime'] },
  griffin:  { name: 'Griffin',  element: 'sky',    archetype: 'Pattern-spotter — a systems thinker.',             desc: 'A storm griffin with an eagle’s sight and a lion’s heart — it hunts the pattern in the noise.', forms: ['Fledgewing', 'Skyclaw', 'Stormcrest', 'Stormcrest Prime'] },
  unicorn:  { name: 'Qilin',    element: 'mystic', archetype: 'Topic-hopper — chaotic-curious.',                  desc: 'A jade Qilin, auspicious chimera of dragon and deer, drawn to every new wonder it meets.', forms: ['Qiling', 'Jadehorn', 'Qilin', 'Qilin Prime'] },
  kraken:   { name: 'Kraken',   element: 'water',  archetype: 'Deep diver — one concept at a time.',              desc: 'An eldritch dweller of the lightless trenches — patient, fathomless, and never rushed.', forms: ['Tideling', 'Deepmaw', 'Abyssal', 'Abyssal Prime'] },
  hydra:    { name: 'Hydra',    element: 'water',  archetype: 'Multitasker — parallel paths.',                    desc: 'A many-headed water serpent — sever one thread of thought and two more rise to take it up.', forms: ['Twincoil', 'Triscale', 'Heptyr', 'Heptyr Prime'] },
  cerberus: { name: 'Cerberus', element: 'earth',  archetype: 'Guardian — perfects the fundamentals.',           desc: 'A three-headed warden hound, blue gem alight, that guards the foundations and forgets nothing.', forms: ['Pupguard', 'Wardenhound', 'Cerberus', 'Cerberus Prime'] },
  pegasus:  { name: 'Pegasus',  element: 'sky',    archetype: 'Momentum-driven — a fast learner.',                desc: 'A warhorse summoned from living shadow — obsidian flank wreathed in violet flame, eyes burning cold purple.', forms: ['Shadefoal', 'Duskwing', 'Nightmare', 'Nightmare Prime'] },
  sphinx:   { name: 'Sphinx',   element: 'mystic', archetype: 'Riddle-solver — loves puzzles (FAANG).',           desc: 'A gold-and-crimson guardian of riddles, ancient as Uruk and Giza both — it answers only the worthy.', forms: ['Cubsphinx', 'Riddlepaw', 'Enigmara', 'Enigmara Prime'] },
  wyvern:   { name: 'Wyvern',   element: 'earth',  archetype: 'Lab builder — a pragmatist.',                      desc: 'A rugged earth wyvern — territorial and practical, a tireless builder of nests and labs.', forms: ['Drakeling', 'Cragwyrm', 'Terravyrn', 'Terravyrn Prime'] },
};

export const SPECIES_KEYS = Object.keys(BEASTS);

// Evolution requirements. Tier is the *current* form (1..4).
// T1->T2: Junior + 40% path. T2->T3: Senior + Silver (66%). T3->T4: 100% path.
// (T2->T3 used to gate on Gold/100%, which made T3 unreachable — beasts jumped
// 2->4 at 100%. Silver gives T3 a distinct resting state; gold still qualifies.)
// Gated on lessons-completed + path progress + medal (the old novice/junior/
// senior rank system was removed; these thresholds match what used to derive
// "junior" at 4 lessons and "senior" at 10, so evolution pacing is unchanged).
export const EVO_RULES = [
  { from: 1, to: 2, needLessons: 4,  needPathPct: 0.40, label: '4 lessons + 40% of path' },
  { from: 2, to: 3, needLessons: 10, needBadge: 'silver', label: '10 lessons + Silver medal' },
  { from: 3, to: 4, needLessons: 10, needPathPct: 1.0, label: '100% the entire path' },
];

// Given current tier + state, return the tier the beast should be at.
export function resolveTier(currentTier, { lessons, pathPct, badge }) {
  let tier = currentTier;
  for (const rule of EVO_RULES) {
    if (rule.from !== tier) continue;
    const lessonsOk = rule.needLessons == null || (lessons || 0) >= rule.needLessons;
    const pctOk = rule.needPathPct == null || pathPct >= rule.needPathPct;
    const badgeOk = !rule.needBadge || badge === rule.needBadge || badge === 'gold';
    if (lessonsOk && pctOk && badgeOk) tier = rule.to;
  }
  return tier;
}
