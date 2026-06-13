// Animation frame manifest — maps a sprite to its PixelLab-generated animation
// frames. Frames live at public/anim/<key>_<anim>_<dir>/<i>.png (individual
// PNGs, played by <AnimatedSprite>). Generated via animate_character template
// animations (see ANIMATION_PLAN.md). Adding an entry here lights up the
// animation everywhere that sprite renders — no component changes.

const animUrl = (folder, i) =>
  `${import.meta.env.BASE_URL}anim/${folder}/${i}.png`
    .replace(/\/{2,}/g, '/')
    .replace(':/', '://');

// Beast Tamer idle loops. Shape: { [tamerId]: { idle: { [dir]: { frames, fps } } } }.
export const TAMER_ANIMS = {
  dawn_shield: { idle: { south: { frames: 4, fps: 6 } } },
};

// Frame URLs for a tamer's idle in a direction, or null if not animated.
export function tamerIdleFrames(id, dir = 'south') {
  const meta = TAMER_ANIMS[id]?.idle?.[dir];
  if (!meta) return null;
  const folder = `${id}_idle_${dir}`;
  return Array.from({ length: meta.frames }, (_, i) => animUrl(folder, i));
}

export const tamerIdleFps = (id, dir = 'south') =>
  TAMER_ANIMS[id]?.idle?.[dir]?.fps || 6;
