// AvatarSprite — renders the player character as a PixelLab pixel-art figure.
//
// Props: { avatar, size = 96, direction = 'south', weapon = true }
//
// The look comes from exactly two sources now (the old build-from-parts custom
// avatar was removed):
//   • avatar.armor — a wearable armor set (full-body figure). When the set has
//     a legendary weapon and `weapon` is true, the figure WIELDS it (the weapon
//     sprite is overlaid at the hand, angled).
//   • avatar.tamer — a Beast Tamer preset (4-direction figure; `direction`
//     turns it for the map/cutscenes).
// If neither is set (legacy/new accounts), we fall back to a default Tamer so
// there is always a face — never a blank or the retired SVG build.

import { TAMERS, tamerSrc } from '../data/tamers.js';
import { ARMOR_SETS, armorSrc, weaponSrc } from '../data/armorSets.js';
import { tamerIdleFrames, tamerIdleFps } from '../data/anims.js';
import AnimatedSprite from './AnimatedSprite.jsx';

// Shown when an account has no tamer and no armor selected.
export const DEFAULT_TAMER = 'ember_warden';

export default function AvatarSprite({ avatar, size = 96, direction = 'south', weapon = true, animate = true }) {
  const a = avatar || {};

  // Armor set takes priority — full figure, optionally wielding its weapon.
  if (a.armor && ARMOR_SETS[a.armor]) {
    const set = ARMOR_SETS[a.armor];
    return (
      <Figure
        src={armorSrc(a.armor)}
        size={size}
        weapon={weapon && set.weapon ? weaponSrc(set.path) : null}
      />
    );
  }

  // Otherwise a Beast Tamer (the chosen one, or the default). Tamers carry no
  // weapon of their own. If the tamer has an idle loop for this facing, play it
  // (AnimatedSprite falls back to the first frame under reduced motion).
  const tamerId = a.tamer && TAMERS[a.tamer] ? a.tamer : DEFAULT_TAMER;
  const idle = animate ? tamerIdleFrames(tamerId, direction) : null;
  if (idle) {
    return (
      <AnimatedSprite
        frames={idle}
        fps={tamerIdleFps(tamerId, direction)}
        width={size}
        height={size * 1.5}
        alt="Your avatar"
      />
    );
  }
  return <Figure src={tamerSrc(tamerId, direction)} size={size} />;
}

// A standing figure (64x96 art → rendered size×size*1.5), optionally with a
// legendary weapon overlaid at the hand and angled so it reads as held.
function Figure({ src, size, weapon = null }) {
  const w = size;
  const h = size * 1.5;
  const img = (
    <img
      src={src}
      alt="Your avatar"
      width={w}
      height={h}
      draggable={false}
      style={{ display: 'block', width: w, height: h, objectFit: 'contain', imageRendering: 'pixelated' }}
    />
  );
  if (!weapon) return img;
  return (
    <span style={{ position: 'relative', display: 'inline-block', width: w, height: h }}>
      {img}
      <img
        src={weapon}
        alt=""
        aria-hidden="true"
        draggable={false}
        style={{
          position: 'absolute',
          width: w * 0.5,
          height: w * 0.5 * 1.33,
          left: w * 0.5,
          bottom: h * 0.08,
          objectFit: 'contain',
          imageRendering: 'pixelated',
          transform: 'rotate(38deg)',
          transformOrigin: 'bottom center',
          filter: 'drop-shadow(0 2px 3px rgba(0,0,0,.6))',
          pointerEvents: 'none',
        }}
      />
    </span>
  );
}
