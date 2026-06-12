// Beast Tamer avatar presets — PixelLab-generated 4-direction characters
// (scripts/generate-tamer-avatars.mjs → public/tamers/<id>_<dir>.png, 92x92).
// Chosen via the AvatarCreator's preset row and stored as avatar.tamer; null
// means the hand-built layered SVG avatar (AvatarSprite's default mode).

export const TAMERS = {
  ember_warden: { name: 'Ember Warden', epithet: 'a lantern against the dark' },
  tide_caller: { name: 'Tide Caller', epithet: 'reads the deeps like weather' },
  thorn_ranger: { name: 'Thorn Ranger', epithet: 'walks the green frontier' },
  sky_courier: { name: 'Sky Courier', epithet: 'outruns the un-remembering' },
  cipher_sage: { name: 'Cipher Sage', epithet: 'keeps the old glyphs lit' },
  circuit_smith: { name: 'Circuit Smith', epithet: 'mends what the Null broke' },
  null_walker: { name: 'Null Walker', epithet: 'came back from the fog' },
  dawn_shield: { name: 'Dawn Shield', epithet: 'holds the line at first light' },
};

export const TAMER_KEYS = Object.keys(TAMERS);

export const TAMER_DIRECTIONS = ['south', 'west', 'east', 'north'];

// Sprite URL for a preset + facing, respecting Vite's base path.
export const tamerSrc = (id, dir = 'south') =>
  `${import.meta.env.BASE_URL}tamers/${id}_${dir}.png`
    .replace(/\/{2,}/g, '/')
    .replace(':/', '://');
