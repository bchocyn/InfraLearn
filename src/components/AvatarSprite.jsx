// AvatarSprite — renders the user's pixel character as composited SVG layers.
//
// Props: { avatar, size = 96 }
//
// All shapes are flat rects (no curves) for the chunky pixel-art look. The
// viewBox is 64×96 (taller than wide). Layer order, bottom -> top:
//   body base (skin + limbs) → bottom (legs covering) → shoes → top
//   (torso/arms covering) → head/face → eyes → hair → hat → held item
//
// Colors come from avatar.hairColor and avatar.topColor; remaining slots use
// fixed palettes baked in here. Variants are simple enough to swap with PNG
// sprites later.

const SKIN = '#E6B89C';
const SKIN_SHADOW = '#C99178';
const OUTLINE = '#1A1410';
const BOTTOM_DARK = '#3A352D';
const SHOE_DARK = '#2A2620';
const METAL = '#C7BFA9';
const METAL_DARK = '#7E7869';
const HELD_BROWN = '#6B4226';
const HELD_AMBER = '#F5B842';
const HELD_BLUE = '#7B9FB5';
const WAND_PURPLE = '#B888C0';

// Palette indices map variant id -> color. Keeps the variant set visually
// distinct without a separate color picker per slot.
const BOTTOM_COLORS = ['#3A352D', '#6B4226', '#7B9FB5', '#C7BFA9'];     // pants, shorts, skirt, greaves
const SHOE_COLORS   = ['#E07856', '#2A2620', '#C7A06B', '#F5B842'];     // sneakers, boots, sandals, wingfeet
const HAT_COLORS    = [null,      '#2A2620', '#E07856', '#F5B842', '#1A1410', '#5E5A8E']; // none, beanie, cap, crown, headphones, wizard

export default function AvatarSprite({ avatar, size = 96 }) {
  const a = avatar || {};
  const hair = clampIdx(a.hair, 6);
  const eyes = clampIdx(a.eyes, 4);
  const top = clampIdx(a.top, 6);
  const bottom = clampIdx(a.bottom, 4);
  const shoes = clampIdx(a.shoes, 4);
  const hat = clampIdx(a.hat, 6);
  const held = clampIdx(a.held, 6);
  const hairColor = a.hairColor || '#6B4226';
  const topColor = a.topColor || '#7B9FB5';

  return (
    <svg
      width={size}
      height={size * 1.5}
      viewBox="0 0 64 96"
      xmlns="http://www.w3.org/2000/svg"
      shapeRendering="crispEdges"
      style={{ display: 'block', imageRendering: 'pixelated' }}
      aria-label="Your avatar"
    >
      {/* ───── Body base ─────────────────────────────── */}
      {/* Legs */}
      <rect x="24" y="68" width="6" height="18" fill={SKIN} />
      <rect x="34" y="68" width="6" height="18" fill={SKIN} />
      {/* Torso */}
      <rect x="22" y="44" width="20" height="24" fill={SKIN} />
      {/* Arms */}
      <rect x="16" y="44" width="6" height="20" fill={SKIN} />
      <rect x="42" y="44" width="6" height="20" fill={SKIN} />
      {/* Neck */}
      <rect x="28" y="40" width="8" height="6" fill={SKIN_SHADOW} />
      {/* Head */}
      <rect x="20" y="14" width="24" height="28" fill={SKIN} />
      {/* Ear shadows */}
      <rect x="18" y="24" width="2" height="6" fill={SKIN_SHADOW} />
      <rect x="44" y="24" width="2" height="6" fill={SKIN_SHADOW} />

      {/* ───── Bottom (legs covering) ───────────────── */}
      <BottomLayer variant={bottom} />

      {/* ───── Shoes ────────────────────────────────── */}
      <ShoesLayer variant={shoes} />

      {/* ───── Top (torso + arms covering) ──────────── */}
      <TopLayer variant={top} color={topColor} />

      {/* ───── Eyes ─────────────────────────────────── */}
      <EyesLayer variant={eyes} />

      {/* Mouth — same for every variant. */}
      <rect x="28" y="34" width="8" height="2" fill={OUTLINE} opacity="0.6" />

      {/* ───── Hair ─────────────────────────────────── */}
      <HairLayer variant={hair} color={hairColor} />

      {/* ───── Hat ──────────────────────────────────── */}
      <HatLayer variant={hat} />

      {/* ───── Held item — drawn last so it's on top ── */}
      <HeldLayer variant={held} />
    </svg>
  );
}

function clampIdx(v, max) {
  const n = Number.isInteger(v) ? v : 0;
  return n >= 0 && n < max ? n : 0;
}

// ────────────────────────────────────────────────────────
// Hair variants. Drawn on top of the head; some peek down
// over the forehead / sides.
// ────────────────────────────────────────────────────────
function HairLayer({ variant, color }) {
  switch (variant) {
    case 0: // Short — close-cropped cap
      return (
        <g fill={color}>
          <rect x="20" y="12" width="24" height="6" />
          <rect x="20" y="18" width="4" height="4" />
          <rect x="40" y="18" width="4" height="4" />
        </g>
      );
    case 1: // Long — falls past shoulders
      return (
        <g fill={color}>
          <rect x="20" y="10" width="24" height="8" />
          <rect x="18" y="18" width="4" height="22" />
          <rect x="42" y="18" width="4" height="22" />
          <rect x="20" y="14" width="6" height="4" />
        </g>
      );
    case 2: // Bun — small ball on top
      return (
        <g fill={color}>
          <rect x="20" y="14" width="24" height="6" />
          <rect x="28" y="6" width="8" height="6" />
          <rect x="26" y="8" width="12" height="4" />
        </g>
      );
    case 3: // Mohawk — center strip
      return (
        <g fill={color}>
          <rect x="30" y="4" width="4" height="14" />
          <rect x="28" y="8" width="2" height="6" />
          <rect x="34" y="8" width="2" height="6" />
          <rect x="20" y="14" width="4" height="4" />
          <rect x="40" y="14" width="4" height="4" />
        </g>
      );
    case 4: // Ponytail — back tail visible behind head
      return (
        <g fill={color}>
          <rect x="20" y="12" width="24" height="6" />
          <rect x="44" y="18" width="4" height="14" />
          <rect x="42" y="30" width="6" height="6" />
        </g>
      );
    case 5: // Bald — minimal stubble shadow
      return <rect x="20" y="14" width="24" height="2" fill={color} opacity="0.25" />;
    default:
      return null;
  }
}

// ────────────────────────────────────────────────────────
// Eyes — small detail blocks on the face.
// ────────────────────────────────────────────────────────
function EyesLayer({ variant }) {
  switch (variant) {
    case 0: // Round
      return (
        <g fill={OUTLINE}>
          <rect x="25" y="26" width="3" height="3" />
          <rect x="36" y="26" width="3" height="3" />
        </g>
      );
    case 1: // Sharp
      return (
        <g fill={OUTLINE}>
          <rect x="24" y="27" width="5" height="2" />
          <rect x="35" y="27" width="5" height="2" />
        </g>
      );
    case 2: // Closed
      return (
        <g fill={OUTLINE}>
          <rect x="24" y="28" width="5" height="1" />
          <rect x="35" y="28" width="5" height="1" />
        </g>
      );
    case 3: // Star — sparkle eyes
      return (
        <g fill={HELD_AMBER}>
          <rect x="25" y="25" width="3" height="3" />
          <rect x="24" y="26" width="5" height="1" />
          <rect x="36" y="25" width="3" height="3" />
          <rect x="35" y="26" width="5" height="1" />
        </g>
      );
    default:
      return null;
  }
}

// ────────────────────────────────────────────────────────
// Top — covers torso + arms. Color from props.
// ────────────────────────────────────────────────────────
function TopLayer({ variant, color }) {
  switch (variant) {
    case 0: // T-Shirt — short sleeves
      return (
        <g fill={color}>
          <rect x="22" y="44" width="20" height="20" />
          <rect x="16" y="44" width="6" height="8" />
          <rect x="42" y="44" width="6" height="8" />
        </g>
      );
    case 1: // Hoodie — sleeves to wrists + hood ring
      return (
        <g fill={color}>
          <rect x="22" y="44" width="20" height="22" />
          <rect x="16" y="44" width="6" height="20" />
          <rect x="42" y="44" width="6" height="20" />
          {/* hood collar peeking up */}
          <rect x="22" y="40" width="20" height="4" />
          {/* pocket line */}
          <rect x="26" y="56" width="12" height="2" fill={OUTLINE} opacity="0.35" />
        </g>
      );
    case 2: // Dress — flares out
      return (
        <g fill={color}>
          <rect x="22" y="44" width="20" height="16" />
          <rect x="16" y="44" width="6" height="8" />
          <rect x="42" y="44" width="6" height="8" />
          <rect x="20" y="60" width="24" height="10" />
          <rect x="18" y="66" width="28" height="6" />
        </g>
      );
    case 3: // Robe — full length, wide
      return (
        <g fill={color}>
          <rect x="20" y="42" width="24" height="40" />
          <rect x="16" y="44" width="6" height="22" />
          <rect x="42" y="44" width="6" height="22" />
          {/* belt */}
          <rect x="20" y="56" width="24" height="3" fill={OUTLINE} opacity="0.4" />
        </g>
      );
    case 4: // Armor — plates over top color
      return (
        <g>
          <rect x="22" y="44" width="20" height="20" fill={color} />
          <rect x="16" y="44" width="6" height="14" fill={METAL_DARK} />
          <rect x="42" y="44" width="6" height="14" fill={METAL_DARK} />
          {/* breastplate */}
          <rect x="24" y="46" width="16" height="14" fill={METAL} />
          <rect x="31" y="46" width="2" height="14" fill={METAL_DARK} />
          {/* pauldrons */}
          <rect x="20" y="42" width="6" height="6" fill={METAL} />
          <rect x="38" y="42" width="6" height="6" fill={METAL} />
        </g>
      );
    case 5: // Lab Coat — long open coat over color shirt
      return (
        <g>
          <rect x="26" y="44" width="12" height="20" fill={color} />
          <rect x="22" y="44" width="4" height="28" fill="#F4EFE3" />
          <rect x="38" y="44" width="4" height="28" fill="#F4EFE3" />
          <rect x="16" y="44" width="6" height="20" fill="#F4EFE3" />
          <rect x="42" y="44" width="6" height="20" fill="#F4EFE3" />
          <rect x="22" y="64" width="20" height="8" fill="#F4EFE3" />
          {/* pocket */}
          <rect x="38" y="58" width="3" height="4" fill={OUTLINE} opacity="0.25" />
        </g>
      );
    default:
      return null;
  }
}

// ────────────────────────────────────────────────────────
// Bottom — covers legs.
// ────────────────────────────────────────────────────────
function BottomLayer({ variant }) {
  const color = BOTTOM_COLORS[variant] || BOTTOM_DARK;
  switch (variant) {
    case 0: // Pants
      return (
        <g fill={color}>
          <rect x="24" y="64" width="6" height="22" />
          <rect x="34" y="64" width="6" height="22" />
        </g>
      );
    case 1: // Shorts
      return (
        <g fill={color}>
          <rect x="24" y="64" width="6" height="10" />
          <rect x="34" y="64" width="6" height="10" />
        </g>
      );
    case 2: // Skirt
      return (
        <g fill={color}>
          <rect x="20" y="64" width="24" height="10" />
          <rect x="18" y="70" width="28" height="6" />
        </g>
      );
    case 3: // Greaves — armored shins
      return (
        <g>
          <rect x="24" y="64" width="6" height="22" fill={BOTTOM_DARK} />
          <rect x="34" y="64" width="6" height="22" fill={BOTTOM_DARK} />
          <rect x="23" y="74" width="8" height="10" fill={METAL} />
          <rect x="33" y="74" width="8" height="10" fill={METAL} />
          <rect x="27" y="74" width="1" height="10" fill={METAL_DARK} />
          <rect x="37" y="74" width="1" height="10" fill={METAL_DARK} />
        </g>
      );
    default:
      return null;
  }
}

// ────────────────────────────────────────────────────────
// Shoes — feet block.
// ────────────────────────────────────────────────────────
function ShoesLayer({ variant }) {
  const color = SHOE_COLORS[variant] || SHOE_DARK;
  switch (variant) {
    case 0: // Sneakers
      return (
        <g>
          <rect x="22" y="86" width="10" height="6" fill={color} />
          <rect x="32" y="86" width="10" height="6" fill={color} />
          <rect x="22" y="90" width="20" height="2" fill={OUTLINE} />
        </g>
      );
    case 1: // Boots — taller
      return (
        <g fill={color}>
          <rect x="22" y="82" width="10" height="10" />
          <rect x="32" y="82" width="10" height="10" />
        </g>
      );
    case 2: // Sandals — thin strap
      return (
        <g>
          <rect x="22" y="88" width="10" height="3" fill={color} />
          <rect x="32" y="88" width="10" height="3" fill={color} />
          <rect x="26" y="84" width="2" height="6" fill={HELD_BROWN} />
          <rect x="36" y="84" width="2" height="6" fill={HELD_BROWN} />
        </g>
      );
    case 3: // Wingfeet — boots with little wings
      return (
        <g>
          <rect x="22" y="84" width="10" height="8" fill={color} />
          <rect x="32" y="84" width="10" height="8" fill={color} />
          {/* wings */}
          <rect x="18" y="84" width="4" height="2" fill="#F4EFE3" />
          <rect x="16" y="86" width="6" height="2" fill="#F4EFE3" />
          <rect x="42" y="84" width="4" height="2" fill="#F4EFE3" />
          <rect x="42" y="86" width="6" height="2" fill="#F4EFE3" />
        </g>
      );
    default:
      return null;
  }
}

// ────────────────────────────────────────────────────────
// Hat — sits above hair.
// ────────────────────────────────────────────────────────
function HatLayer({ variant }) {
  const color = HAT_COLORS[variant];
  if (!color) return null;
  switch (variant) {
    case 1: // Beanie
      return (
        <g fill={color}>
          <rect x="20" y="8" width="24" height="8" />
          <rect x="30" y="4" width="4" height="4" />
        </g>
      );
    case 2: // Cap
      return (
        <g fill={color}>
          <rect x="20" y="10" width="24" height="6" />
          <rect x="18" y="14" width="14" height="2" />
        </g>
      );
    case 3: // Crown
      return (
        <g>
          <rect x="20" y="10" width="24" height="6" fill={color} />
          {/* spikes */}
          <rect x="22" y="6" width="3" height="4" fill={color} />
          <rect x="30" y="4" width="4" height="6" fill={color} />
          <rect x="39" y="6" width="3" height="4" fill={color} />
          {/* gem */}
          <rect x="31" y="12" width="2" height="2" fill={HELD_BLUE} />
        </g>
      );
    case 4: // Headphones — band + cans
      return (
        <g>
          <rect x="20" y="10" width="24" height="3" fill={color} />
          <rect x="16" y="14" width="6" height="10" fill={color} />
          <rect x="42" y="14" width="6" height="10" fill={color} />
          <rect x="18" y="18" width="2" height="2" fill={HELD_AMBER} />
          <rect x="44" y="18" width="2" height="2" fill={HELD_AMBER} />
        </g>
      );
    case 5: // Wizard hat — tall point + brim
      return (
        <g fill={color}>
          <rect x="14" y="12" width="36" height="4" />
          <rect x="22" y="6" width="20" height="8" />
          <rect x="26" y="0" width="12" height="6" />
          <rect x="30" y="-2" width="4" height="2" />
          {/* star */}
          <rect x="31" y="8" width="2" height="2" fill={HELD_AMBER} />
        </g>
      );
    default:
      return null;
  }
}

// ────────────────────────────────────────────────────────
// Held item — drawn in the right hand area.
// ────────────────────────────────────────────────────────
function HeldLayer({ variant }) {
  switch (variant) {
    case 0:
      return null; // Empty
    case 1: // Mug
      return (
        <g>
          <rect x="46" y="56" width="8" height="8" fill="#F4EFE3" />
          <rect x="54" y="58" width="2" height="4" fill="#F4EFE3" />
          <rect x="46" y="56" width="8" height="2" fill={HELD_BROWN} />
        </g>
      );
    case 2: // Laptop
      return (
        <g>
          <rect x="44" y="58" width="14" height="8" fill={METAL_DARK} />
          <rect x="46" y="60" width="10" height="4" fill={HELD_BLUE} />
          <rect x="44" y="66" width="14" height="2" fill={METAL} />
        </g>
      );
    case 3: // Sword
      return (
        <g>
          <rect x="49" y="42" width="2" height="22" fill={METAL} />
          <rect x="46" y="62" width="8" height="2" fill={HELD_AMBER} />
          <rect x="49" y="64" width="2" height="6" fill={HELD_BROWN} />
        </g>
      );
    case 4: // Tome — thick book
      return (
        <g>
          <rect x="44" y="56" width="12" height="10" fill={HELD_BROWN} />
          <rect x="45" y="57" width="10" height="8" fill="#C7A06B" />
          <rect x="49" y="57" width="2" height="8" fill={HELD_BROWN} />
          <rect x="47" y="59" width="2" height="1" fill={HELD_AMBER} />
        </g>
      );
    case 5: // Wand
      return (
        <g>
          <rect x="49" y="46" width="2" height="18" fill={HELD_BROWN} />
          <rect x="48" y="44" width="4" height="4" fill={WAND_PURPLE} />
          <rect x="47" y="42" width="2" height="2" fill={HELD_AMBER} />
          <rect x="51" y="42" width="2" height="2" fill={HELD_AMBER} />
          <rect x="49" y="40" width="2" height="2" fill={HELD_AMBER} />
        </g>
      );
    default:
      return null;
  }
}
