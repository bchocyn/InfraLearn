// HTB-style hexagonal badge.
//
// Flat-top hexagon (6 points at 0°/60°/120°/180°/240°/300°). Structure:
//   1. Soft outer glow (filter, intensity scaled by `pct`).
//   2. Outer hex stroke (the rim).
//   3. Inner concentric hex (~70% radius) giving the beveled rim look.
//   4. 6 facet triangles fanning from center to each edge midpoint, with
//      alternating light/dark fills — gives the gem-cut look.
//   5. Central emblem (per-path icon glyph from PATHS).
//
// Tier coloring uses the existing CSS vars (--bronze / --silver / --gold);
// when `tier` is null the badge renders muted (no fill, no glow).
//
// Re-exports `badgeFor` from content.js under the alias `badgeTier` so callers
// have one canonical place to import both.

import { PATHS, badgeFor } from '../data/content.js';

export function badgeTier(pct) {
  return badgeFor(pct);
}

// Tier → color palette. Each entry is { stroke, fill, facetLight, facetDark,
// emblem, glow }.
const TIER_COLORS = {
  gold: {
    stroke: '#F5B842',
    fill: 'rgba(245,184,66,.14)',
    facetLight: 'rgba(245,184,66,.55)',
    facetDark: 'rgba(120,80,20,.55)',
    emblem: '#FFE9A8',
    glow: '#F5B842',
  },
  silver: {
    stroke: '#C7BFA9',
    fill: 'rgba(199,191,169,.12)',
    facetLight: 'rgba(232,226,210,.55)',
    facetDark: 'rgba(94,88,76,.55)',
    emblem: '#F4EFE3',
    glow: '#C7BFA9',
  },
  bronze: {
    stroke: '#C77575',
    fill: 'rgba(199,117,117,.12)',
    facetLight: 'rgba(229,158,158,.55)',
    facetDark: 'rgba(110,52,52,.55)',
    emblem: '#F6D2D2',
    glow: '#C77575',
  },
  locked: {
    stroke: '#5C574A', // var(--text-quaternary)
    fill: 'transparent',
    facetLight: 'rgba(140,134,118,.18)',
    facetDark: 'rgba(40,38,32,.35)',
    emblem: '#5C574A',
    glow: 'transparent',
  },
};

// Build a flat-top hexagon's 6 vertices on a unit circle (radius=1, centered
// at origin). Angles start at 0° and step by 60°.
function hexPoints(r) {
  const pts = [];
  for (let i = 0; i < 6; i += 1) {
    const a = (Math.PI / 3) * i; // 0, 60, 120, ...
    pts.push([Math.cos(a) * r, Math.sin(a) * r]);
  }
  return pts;
}

// Midpoint of segment (a, b).
function mid(a, b) {
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
}

export default function BadgeHex({
  pathKey,
  tier = null,
  pct = 0,
  size = 96,
  label = true,
}) {
  const path = PATHS[pathKey];
  if (!path) return null;

  const colors = TIER_COLORS[tier || 'locked'];
  const earned = !!tier;

  // SVG viewBox is 100×100; hex is centered at (50, 50) with outer radius 46.
  const cx = 50;
  const cy = 50;
  const R = 46;
  const rInner = R * 0.7;
  const outerPts = hexPoints(R).map(([x, y]) => [x + cx, y + cy]);
  const innerPts = hexPoints(rInner).map(([x, y]) => [x + cx, y + cy]);
  const outerStr = outerPts.map((p) => p.join(',')).join(' ');
  const innerStr = innerPts.map((p) => p.join(',')).join(' ');

  // Six facet triangles: each goes (center, outer[i], outer[i+1]).
  // Alternating light/dark to get the gem-cut shimmer.
  const facets = [];
  for (let i = 0; i < 6; i += 1) {
    const a = outerPts[i];
    const b = outerPts[(i + 1) % 6];
    const m = mid(a, b);
    // Triangle from center to edge midpoint, with each half (a→m and m→b)
    // a separate facet. That gives 12 facets — two per edge — which is what
    // produces the classic HTB beveled look.
    facets.push({
      pts: [[cx, cy], a, m],
      fill: i % 2 === 0 ? colors.facetLight : colors.facetDark,
    });
    facets.push({
      pts: [[cx, cy], m, b],
      fill: i % 2 === 0 ? colors.facetDark : colors.facetLight,
    });
  }

  // Glow intensity (gaussian stdDeviation) scales with pct: 0 → 0, 1 → 4.
  const glowStdDev = earned ? 1.5 + pct * 2.5 : 0;
  const filterId = `bx-glow-${pathKey}-${tier || 'locked'}`;

  const tierLabel = tier ? tier.toUpperCase() : 'LOCKED';
  const ariaLabel = `${tier ? tier.charAt(0).toUpperCase() + tier.slice(1) : 'Locked'} ${path.name} badge`;

  return (
    <div className={`badge-hex ${earned ? 'earned' : 'locked'}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        role="img"
        aria-label={ariaLabel}
        style={earned ? { filter: `drop-shadow(0 0 ${4 + pct * 6}px ${colors.glow}40)` } : undefined}
      >
        <defs>
          <filter id={filterId} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation={glowStdDev} result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outer hex (fill + glow filter) */}
        <polygon
          points={outerStr}
          fill={colors.fill}
          stroke={colors.stroke}
          strokeWidth="2"
          strokeLinejoin="round"
          filter={earned ? `url(#${filterId})` : undefined}
        />

        {/* Beveled facets (only show on earned badges; locked stays flat) */}
        {earned &&
          facets.map((f, i) => (
            <polygon
              key={i}
              points={f.pts.map((p) => p.join(',')).join(' ')}
              fill={f.fill}
              stroke="none"
              opacity="0.85"
            />
          ))}

        {/* Inner concentric hex (the rim line) */}
        <polygon
          points={innerStr}
          fill="none"
          stroke={colors.stroke}
          strokeWidth={earned ? 1 : 0.8}
          strokeLinejoin="round"
          opacity={earned ? 0.9 : 0.5}
        />

        {/* Central emblem */}
        <text
          x={cx}
          y={cy}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="26"
          fill={colors.emblem}
          opacity={earned ? 1 : 0.55}
          style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI Emoji", sans-serif' }}
        >
          {path.icon}
        </text>
      </svg>
      {label && (
        <div className={`badge-hex-label ${earned ? '' : 'locked'}`}>
          {tierLabel} · {path.name}
        </div>
      )}
    </div>
  );
}
