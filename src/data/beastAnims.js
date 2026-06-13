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
  dragon: { 1: { folder: 'azure_dragon_idle', frames: 7, fps: 8 } },
  phoenix: { 1: { folder: 'phoenix_idle', frames: 7, fps: 8 } },
  hydra: { 1: { folder: 'hydra_idle', frames: 7, fps: 8 } },
  wyvern: { 1: { folder: 'wyvern_idle', frames: 7, fps: 8 } },
  cerberus: { 1: { folder: 'cerberus_idle', frames: 7, fps: 8 } },
  griffin: { 1: { folder: 'griffin_idle', frames: 7, fps: 8 } },
  kraken: { 1: { folder: 'kraken_idle', frames: 7, fps: 8 } },
  // species key is `unicorn` (renamed to Qilin in display only)
  unicorn: { 1: { folder: 'qilin_idle', frames: 7, fps: 8 } },
  sphinx: { 1: { folder: 'sphinx_idle', frames: 7, fps: 8 } },
  // pegasus pending (v2 mecha warhorse still rendering)
};

export function beastIdleFrames(species, tier) {
  const meta = BEAST_ANIMS[species]?.[tier];
  if (!meta) return null;
  return Array.from({ length: meta.frames }, (_, i) => animUrl(meta.folder, i));
}

export const beastIdleFps = (species, tier) =>
  BEAST_ANIMS[species]?.[tier]?.fps || 8;
