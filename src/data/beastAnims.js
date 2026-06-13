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
    3: { folder: 'dragon_t3', frames: 1, fps: 1 },
    4: { folder: 'dragon_t4', frames: 1, fps: 1 },
  },
  phoenix:  { 1: { folder: 'phoenix_baby_idle', frames: 7, fps: 8 },  2: { folder: 'phoenix_idle', frames: 7, fps: 8 } },
  hydra:    { 1: { folder: 'hydra_baby_idle', frames: 7, fps: 8 },    2: { folder: 'hydra_idle', frames: 7, fps: 8 } },
  wyvern:   { 1: { folder: 'wyvern_baby_idle', frames: 7, fps: 8 },   2: { folder: 'wyvern_idle', frames: 7, fps: 8 } },
  cerberus: { 1: { folder: 'cerberus_baby_idle', frames: 7, fps: 8 }, 2: { folder: 'cerberus_idle', frames: 7, fps: 8 } },
  griffin:  { 1: { folder: 'griffin_baby_idle', frames: 7, fps: 8 },  2: { folder: 'griffin_idle', frames: 7, fps: 8 } },
  kraken:   { 1: { folder: 'kraken_baby_idle', frames: 7, fps: 8 },   2: { folder: 'kraken_idle', frames: 7, fps: 8 } },
  // species key is `unicorn` (renamed to Qilin in display only)
  unicorn:  { 1: { folder: 'qilin_baby_idle', frames: 7, fps: 8 },    2: { folder: 'qilin_idle', frames: 7, fps: 8 } },
  sphinx:   { 1: { folder: 'sphinx_baby_idle', frames: 7, fps: 8 },   2: { folder: 'sphinx_idle', frames: 7, fps: 8 } },
  // Pegasus: Shadow Monarch warhorse (obsidian + violet flame). Idle loops were
  // animated skeleton-free via PixelLab /animate-with-text (64px) from the hero
  // sprite — see scripts/animate-pegasus.mjs.
  pegasus:  { 1: { folder: 'pegasus_baby_idle', frames: 4, fps: 6 }, 2: { folder: 'pegasus_idle', frames: 4, fps: 6 } },
};

export function beastIdleFrames(species, tier) {
  const meta = BEAST_ANIMS[species]?.[tier];
  if (!meta) return null;
  return Array.from({ length: meta.frames }, (_, i) => animUrl(meta.folder, i));
}

export const beastIdleFps = (species, tier) =>
  BEAST_ANIMS[species]?.[tier]?.fps || 8;
