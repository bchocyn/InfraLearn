// Pixel-art nature scene SVGs used as the backdrop for the equipped
// ByteBeast stage and as previews in the Scenes picker. Each scene id
// maps to a small inline component that renders sharp-edged geometric
// shapes (no anti-aliasing softness, no shape-level gradients) for a
// pixel-art feel. Sunset / Twilight skies use a linear gradient for the
// dome of the sky only.
//
// All scenes share viewBox="0 0 400 200" and use
// preserveAspectRatio="xMidYMid slice" so they fill any container
// without distortion and crop instead of stretching.

import { useState } from 'react';

const SVG_PROPS = {
  viewBox: '0 0 400 200',
  preserveAspectRatio: 'xMidYMid slice',
  xmlns: 'http://www.w3.org/2000/svg',
  'aria-hidden': true,
  focusable: 'false',
  style: { width: '100%', height: '100%', display: 'block' },
  shapeRendering: 'crispEdges',
};

// ── meadow ────────────────────────────────────────────────────────────────
// Pale blue sky, two white clouds, darker back mountain row + lighter
// front row with white snow caps, foreground green grass + a few tufts.
function MeadowScene() {
  return (
    <svg {...SVG_PROPS}>
      {/* sky */}
      <rect x="0" y="0" width="400" height="200" fill="#8FC5E8" />
      {/* clouds (chunky pixel rectangles) */}
      <g fill="#F4EFE3">
        <rect x="30" y="30" width="40" height="8" />
        <rect x="36" y="26" width="28" height="4" />
        <rect x="26" y="34" width="48" height="4" />
        <rect x="300" y="22" width="44" height="8" />
        <rect x="306" y="18" width="32" height="4" />
        <rect x="296" y="26" width="52" height="4" />
      </g>
      {/* back mountain row (darker) */}
      <polygon points="0,150 60,90 120,140 180,80 240,140 300,100 360,150 400,120 400,200 0,200" fill="#5C7AA8" />
      {/* front mountain row (lighter) */}
      <polygon points="0,170 50,120 110,160 170,110 230,160 290,130 350,170 400,150 400,200 0,200" fill="#7E9FC0" />
      {/* snow caps on front peaks */}
      <g fill="#F4EFE3">
        <polygon points="46,124 50,120 54,124 50,128" />
        <polygon points="166,114 170,110 174,114 170,118" />
        <polygon points="286,134 290,130 294,134 290,138" />
      </g>
      {/* grass plane */}
      <rect x="0" y="160" width="400" height="40" fill="#7EB058" />
      {/* grass tufts */}
      <g fill="#5E8A40">
        <rect x="40" y="162" width="3" height="6" />
        <rect x="46" y="158" width="2" height="10" />
        <rect x="120" y="164" width="3" height="6" />
        <rect x="200" y="160" width="3" height="8" />
        <rect x="206" y="164" width="2" height="6" />
        <rect x="290" y="162" width="3" height="6" />
        <rect x="360" y="164" width="3" height="6" />
      </g>
    </svg>
  );
}

// ── forest ────────────────────────────────────────────────────────────────
// Teal sky + two depth layers of pine silhouettes.
function ForestScene() {
  // generate a row of triangles
  const row = (yBase, color, step, height, offset = 0) => {
    const tris = [];
    for (let x = -step + offset; x < 400 + step; x += step) {
      tris.push(
        <polygon key={`${color}-${x}`} points={`${x},${yBase} ${x + step / 2},${yBase - height} ${x + step},${yBase}`} fill={color} />
      );
    }
    return tris;
  };
  return (
    <svg {...SVG_PROPS}>
      <rect x="0" y="0" width="400" height="200" fill="#A8D8E8" />
      {/* back row of pines (darker) */}
      <g>{row(160, '#3A5530', 28, 70, 0)}</g>
      {/* front row of pines (lighter) */}
      <g>{row(180, '#4A6638', 36, 90, 14)}</g>
      {/* ground */}
      <rect x="0" y="178" width="400" height="22" fill="#2A3F25" />
    </svg>
  );
}

// ── sunset ────────────────────────────────────────────────────────────────
// Vertical gradient sky orange→purple, large yellow sun, two mountain
// silhouettes (back + foreground).
function SunsetScene() {
  return (
    <svg {...SVG_PROPS}>
      <defs>
        <linearGradient id="sunset-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F5A85E" />
          <stop offset="100%" stopColor="#7E5A8E" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="400" height="200" fill="url(#sunset-sky)" />
      {/* sun */}
      <circle cx="200" cy="80" r="32" fill="#F5D858" />
      {/* back mountain ridge */}
      <polygon points="0,150 60,100 130,140 200,90 270,140 340,110 400,150 400,200 0,200" fill="#3A2848" />
      {/* foreground darker ridge */}
      <polygon points="0,180 50,140 120,175 180,130 250,175 320,145 400,180 400,200 0,200" fill="#241830" />
    </svg>
  );
}

// ── flowers ───────────────────────────────────────────────────────────────
// Sky + one cloud + rolling grass + ~20 colorful 2-3px square flowers.
function FlowersScene() {
  // flower positions (x, y, color, size)
  const flowers = [
    [30, 156, '#E08F8F', 3], [54, 168, '#F5B842', 2], [78, 162, '#F4EFE3', 3],
    [98, 174, '#B888C0', 2], [120, 158, '#E08F8F', 2], [142, 170, '#F5B842', 3],
    [166, 164, '#F4EFE3', 2], [188, 176, '#B888C0', 3], [208, 160, '#E08F8F', 3],
    [228, 172, '#F5B842', 2], [248, 166, '#F4EFE3', 3], [268, 178, '#B888C0', 2],
    [290, 162, '#E08F8F', 2], [310, 170, '#F5B842', 3], [332, 158, '#F4EFE3', 2],
    [352, 174, '#B888C0', 3], [370, 164, '#E08F8F', 2], [38, 180, '#F5B842', 2],
    [180, 184, '#F4EFE3', 2], [260, 184, '#B888C0', 2],
  ];
  return (
    <svg {...SVG_PROPS}>
      <rect x="0" y="0" width="400" height="200" fill="#A8D8E8" />
      {/* a single cloud */}
      <g fill="#F4EFE3">
        <rect x="60" y="30" width="48" height="10" />
        <rect x="68" y="26" width="32" height="4" />
        <rect x="56" y="36" width="58" height="4" />
      </g>
      {/* rolling grass hills */}
      <ellipse cx="80" cy="180" rx="120" ry="40" fill="#7EB058" />
      <ellipse cx="320" cy="185" rx="140" ry="38" fill="#7EB058" />
      <rect x="0" y="150" width="400" height="50" fill="#7EB058" />
      {/* flowers */}
      <g>
        {flowers.map(([x, y, c, sz], i) => (
          <rect key={i} x={x} y={y} width={sz} height={sz} fill={c} />
        ))}
      </g>
      {/* a few grass blades */}
      <g fill="#5E8A40">
        <rect x="46" y="150" width="2" height="6" />
        <rect x="160" y="152" width="2" height="6" />
        <rect x="304" y="150" width="2" height="6" />
      </g>
    </svg>
  );
}

// ── snow ──────────────────────────────────────────────────────────────────
// Grey-blue sky, layered snowy mountains with bright caps.
function SnowScene() {
  return (
    <svg {...SVG_PROPS}>
      <rect x="0" y="0" width="400" height="200" fill="#B8D8E8" />
      {/* back mountain layer */}
      <polygon points="0,140 70,70 140,130 210,60 280,130 340,80 400,140 400,200 0,200" fill="#7A8FA8" />
      {/* back peak snow caps */}
      <g fill="#E8F2F8">
        <polygon points="64,76 70,70 76,76 70,82" />
        <polygon points="204,66 210,60 216,66 210,72" />
        <polygon points="334,86 340,80 346,86 340,92" />
      </g>
      {/* front mountain layer */}
      <polygon points="0,170 50,110 110,160 170,100 230,160 290,120 360,170 400,150 400,200 0,200" fill="#A0B8C8" />
      {/* front peak snow caps */}
      <g fill="#E8F2F8">
        <polygon points="44,116 50,110 56,116 50,122" />
        <polygon points="164,106 170,100 176,106 170,112" />
        <polygon points="284,126 290,120 296,126 290,132" />
      </g>
      {/* snowy ground */}
      <rect x="0" y="178" width="400" height="22" fill="#E8F2F8" />
    </svg>
  );
}

// ── autumn ────────────────────────────────────────────────────────────────
// Warm tan sky + two-depth amber/brown pine silhouettes.
function AutumnScene() {
  const row = (yBase, color, step, height, offset = 0) => {
    const tris = [];
    for (let x = -step + offset; x < 400 + step; x += step) {
      tris.push(
        <polygon key={`${color}-${x}`} points={`${x},${yBase} ${x + step / 2},${yBase - height} ${x + step},${yBase}`} fill={color} />
      );
    }
    return tris;
  };
  return (
    <svg {...SVG_PROPS}>
      <rect x="0" y="0" width="400" height="200" fill="#E89A5E" />
      {/* back row (lighter amber/brown) */}
      <g>{row(160, '#7A4A2A', 30, 70, 0)}</g>
      {/* front row (darker) */}
      <g>{row(182, '#5A3A22', 38, 95, 18)}</g>
      {/* ground */}
      <rect x="0" y="180" width="400" height="20" fill="#3A2418" />
    </svg>
  );
}

// ── twilight ──────────────────────────────────────────────────────────────
// Purple gradient sky, crescent moon, stars, two mountain silhouettes.
function TwilightScene() {
  const stars = [
    [40, 30], [80, 50], [120, 24], [160, 44], [196, 32],
    [240, 50], [274, 26], [80, 70], [200, 68], [340, 60],
  ];
  return (
    <svg {...SVG_PROPS}>
      <defs>
        <linearGradient id="twilight-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5E5A8E" />
          <stop offset="100%" stopColor="#3E3868" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="400" height="200" fill="url(#twilight-sky)" />
      {/* crescent moon (top right) */}
      <g>
        <circle cx="340" cy="40" r="14" fill="#F4EFE3" />
        <circle cx="345" cy="36" r="12" fill="#5E5A8E" />
      </g>
      {/* stars */}
      <g fill="#F4EFE3">
        {stars.map(([x, y], i) => (
          <rect key={i} x={x} y={y} width="2" height="2" />
        ))}
      </g>
      {/* back mountain silhouette */}
      <polygon points="0,150 60,100 130,140 200,90 270,140 340,110 400,150 400,200 0,200" fill="#2A2050" />
      {/* foreground darker silhouette */}
      <polygon points="0,180 50,140 120,175 180,130 250,175 320,145 400,180 400,200 0,200" fill="#1E1838" />
    </svg>
  );
}

// ── falls ─────────────────────────────────────────────────────────────────
// Deep teal-green forest sky + central waterfall band + pine forest +
// dark ground.
function FallsScene() {
  // generate two thick rows of pines around a central waterfall column
  const pineRow = (yBase, color, step, height, offset = 0, gapX1 = 170, gapX2 = 230) => {
    const tris = [];
    for (let x = -step + offset; x < 400 + step; x += step) {
      // skip pines in the central waterfall band
      if (x + step / 2 > gapX1 && x + step / 2 < gapX2) continue;
      tris.push(
        <polygon key={`${color}-${x}`} points={`${x},${yBase} ${x + step / 2},${yBase - height} ${x + step},${yBase}`} fill={color} />
      );
    }
    return tris;
  };
  return (
    <svg {...SVG_PROPS}>
      <rect x="0" y="0" width="400" height="200" fill="#4E8B5E" />
      {/* central waterfall (tall narrow vertical band) */}
      <rect x="180" y="20" width="40" height="160" fill="#7EC8D8" />
      {/* little pixel highlights inside the falls suggesting cascade */}
      <g fill="#B8E6F0">
        <rect x="184" y="40" width="4" height="14" />
        <rect x="200" y="60" width="4" height="20" />
        <rect x="190" y="90" width="4" height="18" />
        <rect x="206" y="110" width="4" height="22" />
        <rect x="186" y="140" width="4" height="18" />
      </g>
      {/* back row of pines (skipping center band) */}
      <g>{pineRow(155, '#2D5538', 30, 80)}</g>
      {/* front row of pines (skipping center band) */}
      <g>{pineRow(178, '#1F3A26', 38, 95, 18)}</g>
      {/* misty pool at base of falls */}
      <ellipse cx="200" cy="180" rx="40" ry="6" fill="#B8E6F0" opacity="0.85" />
      {/* ground */}
      <rect x="0" y="183" width="400" height="17" fill="#1A3520" />
    </svg>
  );
}

const SCENES = {
  meadow: MeadowScene,
  forest: ForestScene,
  sunset: SunsetScene,
  flowers: FlowersScene,
  snow: SnowScene,
  autumn: AutumnScene,
  twilight: TwilightScene,
  falls: FallsScene,
};

// Every scene now ships a PixelLab pixel-art backdrop at public/scenes/<id>.png
// (generated by scripts/generate-scenes.mjs). We render that image and keep the
// hand-coded SVG above as the fallback if the PNG ever fails to load.
const SCENE_IMG = new Set(Object.keys(SCENES));
const sceneSrc = (id) =>
  `${import.meta.env.BASE_URL}scenes/${id}.png`.replace(/\/{2,}/g, '/').replace(':/', '://');

export default function BeastScene({ id, className = '', style = {} }) {
  const Scene = SCENES[id] || MeadowScene;
  const [imgFailed, setImgFailed] = useState(false);
  const useImg = SCENE_IMG.has(id) && !imgFailed;
  return (
    <div className={`beast-scene ${className}`} style={style} aria-hidden="true">
      {useImg ? (
        <img
          src={sceneSrc(id)}
          alt=""
          draggable={false}
          onError={() => setImgFailed(true)}
          style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover', imageRendering: 'pixelated' }}
        />
      ) : (
        <Scene />
      )}
    </div>
  );
}
