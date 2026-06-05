// Avatar creator part library.
//
// Replaces the emoji picker concept (see canonical decisions doc). Each slot
// has a small set of variant entries with an optional `unlock` requirement.
// Unlock strings follow the format `<pathKey>_<threshold>` where threshold is
// a percentage breakpoint (50 or 100). Special case: `all_100` means every
// path's pct >= 1. `unlock: null` => always available.
//
// `isUnlocked(unlock, completed)` resolves the requirement against the user's
// `completed` lesson map by calling `pathProgress` from content.js.
//
// Slots: hair, eyes, top, bottom, shoes, hat, held — plus two color slots
// (hair color, top color) exposed via AVATAR_COLORS. Other shapes use fixed
// palettes baked into AvatarSprite.

import { PATH_KEYS, pathProgress } from './content.js';

export const AVATAR_PARTS = {
  hair: [
    { id: 0, name: 'Short',     unlock: null },
    { id: 1, name: 'Long',      unlock: null },
    { id: 2, name: 'Bun',       unlock: null },
    { id: 3, name: 'Mohawk',    unlock: 'fundamentals_50' },
    { id: 4, name: 'Ponytail',  unlock: null },
    { id: 5, name: 'Bald',      unlock: null },
  ],
  eyes: [
    { id: 0, name: 'Round',     unlock: null },
    { id: 1, name: 'Sharp',     unlock: null },
    { id: 2, name: 'Closed',    unlock: null },
    { id: 3, name: 'Star',      unlock: 'mlops_100' },
  ],
  top: [
    { id: 0, name: 'T-Shirt',   unlock: null },
    { id: 1, name: 'Hoodie',    unlock: null },
    { id: 2, name: 'Dress',     unlock: null },
    { id: 3, name: 'Robe',      unlock: 'fundamentals_100' },
    { id: 4, name: 'Armor',     unlock: 'faang_100' },
    { id: 5, name: 'Lab Coat',  unlock: 'mleng_50' },
  ],
  bottom: [
    { id: 0, name: 'Pants',     unlock: null },
    { id: 1, name: 'Shorts',    unlock: null },
    { id: 2, name: 'Skirt',     unlock: null },
    { id: 3, name: 'Greaves',   unlock: 'faang_100' },
  ],
  shoes: [
    { id: 0, name: 'Sneakers',  unlock: null },
    { id: 1, name: 'Boots',     unlock: null },
    { id: 2, name: 'Sandals',   unlock: null },
    { id: 3, name: 'Wingfeet',  unlock: 'devops_100' },
  ],
  hat: [
    { id: 0, name: 'None',       unlock: null },
    { id: 1, name: 'Beanie',     unlock: null },
    { id: 2, name: 'Cap',        unlock: null },
    { id: 3, name: 'Crown',      unlock: 'all_100' },
    { id: 4, name: 'Headphones', unlock: null },
    { id: 5, name: 'Wizard',     unlock: 'mleng_100' },
  ],
  held: [
    { id: 0, name: 'Empty',     unlock: null },
    { id: 1, name: 'Mug',       unlock: null },
    { id: 2, name: 'Laptop',    unlock: 'devops_50' },
    { id: 3, name: 'Sword',     unlock: 'faang_50' },
    { id: 4, name: 'Tome',      unlock: 'fundamentals_100' },
    { id: 5, name: 'Wand',      unlock: 'mleng_50' },
  ],
};

// Color swatches exposed by the creator. Other slots (bottom, shoes, etc.)
// use palettes baked into AvatarSprite so the user only manages two colors.
export const AVATAR_COLORS = {
  hair:   ['#6B4226', '#1A1A1A', '#C7A06B', '#E07856', '#F5B842', '#B888C0', '#7B9FB5'],
  top:    ['#7B9FB5', '#8FA876', '#E07856', '#B888C0', '#F5B842', '#C7BFA9', '#2A2620'],
};

export const AVATAR_SLOTS = [
  { key: 'hair',   label: 'Hair',   colorKey: 'hair' },
  { key: 'eyes',   label: 'Eyes',   colorKey: null },
  { key: 'top',    label: 'Top',    colorKey: 'top' },
  { key: 'bottom', label: 'Bottom', colorKey: null },
  { key: 'shoes',  label: 'Shoes',  colorKey: null },
  { key: 'hat',    label: 'Hat',    colorKey: null },
  { key: 'held',   label: 'Held',   colorKey: null },
];

// Resolve an `unlock` requirement against the user's completed lesson map.
//
//   null            => always unlocked
//   'all_100'       => every path's pct >= 1
//   '<path>_<pct>'  => that path's pct >= pct/100
//
// Returns true when the variant should be selectable.
export function isUnlocked(unlock, completed) {
  if (!unlock) return true;
  const map = completed || {};
  if (unlock === 'all_100') {
    return PATH_KEYS.every((k) => pathProgress(k, map).pct >= 1);
  }
  const idx = unlock.lastIndexOf('_');
  if (idx < 0) return false;
  const pathKey = unlock.slice(0, idx);
  const threshold = Number(unlock.slice(idx + 1));
  if (!PATH_KEYS.includes(pathKey) || !Number.isFinite(threshold)) return false;
  return pathProgress(pathKey, map).pct >= threshold / 100;
}

// Human-readable hint for a locked variant — surfaced as a tooltip.
const PATH_LABEL = {
  fundamentals: 'Fundamentals',
  devops: 'DevOps',
  mlops: 'MLOps',
  swe: 'SWE',
  mleng: 'ML Eng',
  faang: 'FAANG',
};
export function unlockHint(unlock) {
  if (!unlock) return '';
  if (unlock === 'all_100') return 'Unlocks at 100% of every path';
  const idx = unlock.lastIndexOf('_');
  if (idx < 0) return '';
  const pathKey = unlock.slice(0, idx);
  const threshold = Number(unlock.slice(idx + 1));
  const name = PATH_LABEL[pathKey] || pathKey;
  return `Unlocks at ${threshold}% of ${name}`;
}
