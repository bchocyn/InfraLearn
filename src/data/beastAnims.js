// Byte Beast animation manifest — maps species+tier to its PixelLab idle
// frames (generated skeleton-free via object mode → animate_object, so beasts
// stay true creatures, never humanoid rigs). Frames live at
// public/beasts/anim/<folder>/<i>.png and are played by <AnimatedSprite>.
// A species/tier with no entry here falls back to its static manifest sprite.

const animUrl = (folder, i) =>
  `${import.meta.env.BASE_URL}beasts/anim/${folder}/${i}.png`
    .replace(/\/{2,}/g, '/')
    .replace(':/', '://');

// { [species]: { [tier]: { folder, frames, fps } } }
// One idle loop per species for now (tier 1); the same loop plays across tiers
// until tier-specific evolved art is generated.
export const BEAST_ANIMS = {
  dragon: {
    // Pokémon-style line: baby (animated) → azure juvenile (animated) →
    // adult storm → celestial emperor. The egg hatches the T1 baby.
    1: { folder: 'dragon_baby_idle', frames: 7, fps: 8 },
    2: { folder: 'azure_dragon_idle', frames: 7, fps: 8 },
    3: { folder: 'dragon_t3', frames: 4, fps: 6 },
    4: { folder: 'dragon_t4', frames: 4, fps: 6 },
  },
  // T3/T4 idle loops are 64px 4-frame /animate-with-text output anchored on
  // the 200px heroes (scripts/animate-beast-tiers.mjs) — the frame-0 pin keeps
  // identity, so every tier of every species now breathes for real.
  phoenix:  { 1: { folder: 'phoenix_baby_idle', frames: 7, fps: 8 },  2: { folder: 'phoenix_idle', frames: 7, fps: 8 },  3: { folder: 'phoenix_t3', frames: 4, fps: 6 },  4: { folder: 'phoenix_t4', frames: 4, fps: 6 } },
  hydra:    { 1: { folder: 'hydra_baby_idle', frames: 7, fps: 8 },    2: { folder: 'hydra_idle', frames: 7, fps: 8 },    3: { folder: 'hydra_t3', frames: 4, fps: 6 },    4: { folder: 'hydra_t4', frames: 4, fps: 6 } },
  wyvern:   { 1: { folder: 'wyvern_baby_idle', frames: 7, fps: 8 },   2: { folder: 'wyvern_idle', frames: 7, fps: 8 },   3: { folder: 'wyvern_t3', frames: 4, fps: 6 },   4: { folder: 'wyvern_t4', frames: 4, fps: 6 } },
  cerberus: { 1: { folder: 'cerberus_baby_idle', frames: 7, fps: 8 }, 2: { folder: 'cerberus_idle', frames: 7, fps: 8 }, 3: { folder: 'cerberus_t3', frames: 4, fps: 6 }, 4: { folder: 'cerberus_t4', frames: 4, fps: 6 } },
  griffin:  { 1: { folder: 'griffin_baby_idle', frames: 7, fps: 8 },  2: { folder: 'griffin_idle', frames: 7, fps: 8 },  3: { folder: 'griffin_t3', frames: 4, fps: 6 },  4: { folder: 'griffin_t4', frames: 4, fps: 6 } },
  kraken:   { 1: { folder: 'kraken_baby_idle', frames: 7, fps: 8 },   2: { folder: 'kraken_idle', frames: 7, fps: 8 },   3: { folder: 'kraken_t3', frames: 4, fps: 6 },   4: { folder: 'kraken_t4', frames: 4, fps: 6 } },
  // species key is `unicorn` (renamed to Qilin in display only)
  unicorn:  { 1: { folder: 'qilin_baby_idle', frames: 7, fps: 8 },    2: { folder: 'qilin_idle', frames: 7, fps: 8 },    3: { folder: 'unicorn_t3', frames: 4, fps: 6 },  4: { folder: 'unicorn_t4', frames: 4, fps: 6 } },
  // sphinx: adult = Babylonian lamassu (gold chain), T3 = gold-crimson
  // Enigmara, T4 = solar Ra-sphinx.
  sphinx:   { 1: { folder: 'sphinx_baby_idle', frames: 7, fps: 8 },   2: { folder: 'sphinx_idle', frames: 4, fps: 6 },   3: { folder: 'sphinx_t3', frames: 4, fps: 6 },   4: { folder: 'sphinx_t4', frames: 4, fps: 6 } },
  // Pegasus: Shadow Monarch warhorse (obsidian + violet flame). Idle loops were
  // animated skeleton-free via PixelLab /animate-with-text (64px) from the hero
  // sprite — see scripts/animate-pegasus.mjs (T1/T2) and animate-beast-tiers.mjs (T3/T4).
  pegasus:  { 1: { folder: 'pegasus_baby_idle', frames: 4, fps: 6 }, 2: { folder: 'pegasus_idle', frames: 4, fps: 6 }, 3: { folder: 'pegasus_t3', frames: 4, fps: 6 }, 4: { folder: 'pegasus_t4', frames: 4, fps: 6 } },
};

export function beastIdleFrames(species, tier) {
  const meta = BEAST_ANIMS[species]?.[tier];
  if (!meta) return null;
  return Array.from({ length: meta.frames }, (_, i) => animUrl(meta.folder, i));
}

export const beastIdleFps = (species, tier) =>
  BEAST_ANIMS[species]?.[tier]?.fps || 8;
