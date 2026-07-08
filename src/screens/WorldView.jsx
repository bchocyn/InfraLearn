import { memo, useEffect, useMemo } from 'react';
import { PATHS } from '../data/content.js';
import { PROVINCES, FIVE_LAPSES } from '../data/lore.js';

// ─── WORLD VIEW — the Roadmap's landing (A1: one map system) ────────────────
// All 8 career paths as continents on one candy-ocean voyage map, one
// progress medallion each, threaded by a dotted sea-route in learning order.
// Tapping a continent sails into that province's serpentine trail — a REAL
// route (/roadmap/:pathKey), so the browser back button and deep links work.
//
// Extracted from the retired /worldmap prototype (WorldMap.jsx): the
// prototype's ContinentView/scatterNodes drill-in was superseded by the
// Roadmap trail, and its static import from the eager Roadmap silently
// defeated main.jsx's lazy() split — the whole prototype rode the entry
// chunk. Only the shipped landing survives here.

const ASSET = `${import.meta.env.BASE_URL}worldmap/`;

// World canvas — PORTRAIT, single-file voyage: one continent per stop,
// meandering down the page like a board-game route (the shape CRK's own
// phone map takes). All world-view geometry lives in this coordinate space;
// the SVG scales to the frame via preserveAspectRatio.
const WORLD_W = 480;
const WORLD_H = 2260;

// ── Continent layout ─────────────────────────────────────────────────────────
// ONE continent per row in learning order, alternating left/right so the
// sea-route snakes: Fundamentals (home, "start here") first, advanced
// provinces at the bottom of the voyage. `w` is the render width in canvas
// units; height derives at the art's 0.78 ratio. `accent` tints the
// medallion + "you are here" glow.
const CONTINENTS = [
  { key: 'fundamentals', x: 185, y: 230,  w: 275, accent: '#8FA876', home: true },
  { key: 'swe',          x: 300, y: 480,  w: 260, accent: '#8FB5D8' },
  { key: 'devops',       x: 180, y: 730,  w: 265, accent: '#E07E3A' },
  { key: 'fullstack',    x: 300, y: 980,  w: 260, accent: '#C58FD8' },
  { key: 'mlops',        x: 180, y: 1230, w: 260, accent: '#F5B842' },
  { key: 'faang',        x: 300, y: 1480, w: 260, accent: '#E8C36A' },
  { key: 'mleng',        x: 180, y: 1730, w: 260, accent: '#5ED8B8' },
  { key: 'cybersec',     x: 300, y: 1980, w: 255, accent: '#E0706A' },
];

// Dotted sea-route threading the continents in learning order — the
// "connected" part of the voyage, drawn on the water beneath the landmasses.
function seaRoute(list) {
  if (list.length < 2) return '';
  let d = `M ${list[0].x} ${list[0].y}`;
  for (let i = 1; i < list.length; i++) {
    const a = list[i - 1];
    const b = list[i];
    const midY = (a.y + b.y) / 2;
    d += ` C ${a.x} ${midY}, ${b.x} ${midY}, ${b.x} ${b.y}`;
  }
  return d;
}

function truncate(s, n) { return s && s.length > n ? s.slice(0, n - 1) + '…' : s; }

function pathStats(key, completed) {
  const lessons = PATHS[key]?.lessons || [];
  const done = lessons.filter((l) => completed[l.id]).length;
  return { lessons, total: lessons.length, done, pct: lessons.length ? done / lessons.length : 0 };
}

// ─── World view — all continents, one medallion each ─────────────────────────
// `activePath` pulses the current continent; `footer` is the landing's hero
// CTA slot (R5: one magnetic next action on top of the world).
export function WorldView({ completed, reduced, onOpen, activePath = null, footer = null }) {
  const continents = useMemo(
    () => CONTINENTS.map((c) => ({ ...c, ...pathStats(c.key, completed) })),
    [completed]
  );
  const fundStarted = (pathStats('fundamentals', completed).done) > 0;

  // Returning from a trail (or landing mid-voyage): bring the active
  // continent into view when it sits below the first screenful — the world
  // is ~5 screens tall and "where am I" shouldn't require scrolling blind.
  // The timeout runs after RouteChrome's scroll-to-top so it wins.
  useEffect(() => {
    const c = CONTINENTS.find((k) => k.key === activePath);
    if (!c || c.y < 900) return undefined;
    const t = setTimeout(() => {
      document.getElementById(`wm-cont-${activePath}`)?.scrollIntoView({ block: 'center', behavior: 'auto' });
    }, 60);
    return () => clearTimeout(t);
  }, [activePath]);

  return (
    <div className="screen fade-in">
      <div className="kicker" style={{ marginBottom: 4 }}>THE LONG WATCH</div>
      <div className="row" style={{ marginBottom: 10 }}>
        <h1 className="h1" style={{ margin: 0 }}>The world<span className="dot">.</span></h1>
        <span className="spacer" />
        <span className="pill" style={{ fontSize: 10, padding: '4px 10px' }}>
          {continents.filter((c) => c.pct >= 1).length} / {continents.length} reclaimed
        </span>
      </div>

      {/* Hero CTA rides ABOVE the tall map: one visible next action before
          any scrolling (the map is explore-space, the button is the path). */}
      {footer}

      <div className="wm-frame">
        <svg viewBox={`0 0 ${WORLD_W} ${WORLD_H}`} preserveAspectRatio="xMidYMid meet" className="wm-svg">
          <WorldDefs />
          <rect x="0" y="0" width={WORLD_W} height={WORLD_H} fill="url(#wm-parch)" />
          <rect x="0" y="0" width={WORLD_W} height={WORLD_H} fill="url(#wm-vignette)" />

          {/* Title cartouche */}
          <g transform={`translate(${WORLD_W / 2}, 50)`}>
            <image href={`${ASSET}banner.png`} x="-150" y="-46" width="300" height="96" preserveAspectRatio="xMidYMid meet" />
            <text className="wm-banner-text" x="0" y="4" textAnchor="middle">WORLD MAP</text>
          </g>

          {/* A sea serpent in the top-right shallows (pixellab) */}
          <image href={`${ASSET}seamonster.png`} x="392" y="34" width="80" height="60" opacity="0.5" preserveAspectRatio="xMidYMid meet" />

          {/* The voyage route — foam-dotted line linking the continents in
              learning order, under the landmasses. */}
          <path
            d={seaRoute(continents)}
            fill="none"
            stroke="#F4EFE3"
            strokeWidth="3.5"
            strokeDasharray="1 12"
            strokeLinecap="round"
            opacity="0.45"
          />

          {continents.map((c) => (
            <ContinentBlob key={c.key} c={c} reduced={reduced} onOpen={onOpen}
              isActive={c.key === activePath}
              showStartHere={c.key === 'fundamentals' && !fundStarted} />
          ))}

          {/* Compass rose — bottom-left, across the strait from the last stop */}
          <g>
            <Compass x={96} y={WORLD_H - 70} r={40} />
          </g>
        </svg>
      </div>

      <p className="caption" style={{ marginTop: 10, fontSize: 12.5, textAlign: 'center' }}>
        Tap a continent to sail in. Fog hides provinces the Null still holds.
      </p>
    </div>
  );
}

const ContinentBlob = memo(function ContinentBlob({ c, reduced, onOpen, showStartHere, isActive = false }) {
  const prov = PROVINCES[c.key] || {};
  const lapse = prov.lapse ? FIVE_LAPSES[prov.lapse] : null;
  const fogged = c.done === 0;
  const cleared = c.pct >= 1;
  const name = (prov.name || PATHS[c.key]?.name || c.key).toUpperCase();
  // Medallion progress ring.
  const ringR = 18;
  const w = c.w, h = w * 0.78;       // continent render box
  const circ = 2 * Math.PI * ringR;
  const dash = `${(c.pct * circ).toFixed(1)} ${circ.toFixed(1)}`;

  return (
    <g
      id={`wm-cont-${c.key}`}
      role="button"
      tabIndex={0}
      aria-label={`${prov.name || c.key} — ${c.done} of ${c.total} lessons`}
      style={{ cursor: 'pointer' }}
      onClick={() => onOpen(c.key)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(c.key); } }}
    >
      {/* Soft cast shadow on the water for grounding */}
      <ellipse cx={c.x} cy={c.y + h * 0.34} rx={w * 0.34} ry={w * 0.07} fill="#0E3A66" opacity={fogged ? 0.12 : 0.2} />
      {/* Per-continent colourful continent art (pixellab; background keyed transparent) */}
      <image href={`${ASSET}island-${c.key}.png`}
        x={c.x - w / 2} y={c.y - h / 2}
        width={w} height={h}
        preserveAspectRatio="xMidYMid meet"
        style={{ imageRendering: 'pixelated', filter: fogged ? 'grayscale(0.9) brightness(0.55)' : 'none' }} />

      {/* The province's Lapse, waiting on its own land (R3: boss anchors the
          region). Greyed out while the province is unreclaimed; disappears
          entirely at 100% — the lore's "HAS FLED — FOR NOW". Two provinces
          can share a Lapse (canon: the same villain haunts both). */}
      {lapse && !cleared && (
        <image
          href={`${ASSET}lapse-${lapse.id}.png`}
          x={c.x + w * 0.04} y={c.y - h * 0.5}
          width={w * 0.32} height={w * 0.32}
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
          style={{
            imageRendering: 'pixelated',
            filter: 'grayscale(1) brightness(0.62)',
            opacity: fogged ? 0.75 : 0.9,
          }}
        />
      )}

      {/* Progress medallion (the one circle per continent) — sits low on the isle
          so it doesn't cover the centerpiece building. */}
      <g transform={`translate(${c.x}, ${c.y + h * 0.04})`}>
        {/* "You are here" — the active continent's medallion wears a live
            accent halo so the current path is the most magnetic mark on
            the map (POI-magnetism, R7). */}
        {isActive && (
          <circle r={ringR + 9} fill="none" stroke={c.accent} strokeWidth="2.5"
            strokeDasharray="4 5" opacity="0.95"
            className={reduced ? undefined : 'wm-ring-live'} />
        )}
        <circle r={ringR + 4} fill="#13202e" opacity={fogged ? 0.5 : 0.46} stroke="#0a141d" strokeWidth="1" />
        <circle r={ringR} fill="none" stroke="#6b563a" strokeWidth="4" />
        {!fogged && (
          <circle r={ringR} fill="none" stroke={cleared ? '#E8C36A' : c.accent} strokeWidth="4"
            strokeLinecap="round" strokeDasharray={dash} transform="rotate(-90)"
            className={!reduced && !cleared && c.done > 0 ? 'wm-ring-live' : undefined} />
        )}
        <circle r="11" fill={fogged ? '#2a2014' : '#f0e3c4'} stroke="#5A4327" strokeWidth="1.5" />
        <image href={`${ASSET}marker.png`} x="-12" y="-12" width="24" height="24" preserveAspectRatio="xMidYMid meet"
          opacity={fogged ? 0.4 : 1} />
        {cleared && <text className="wm-seal" x="0" y="5" textAnchor="middle">★</text>}
        {fogged && <text x="0" y="5" textAnchor="middle" fontSize="13" opacity="0.85">🌫</text>}
      </g>

      {/* Name banner under the continent */}
      <g transform={`translate(${c.x}, ${c.y + h * 0.46})`}>
        <image href={`${ASSET}banner.png`} x="-96" y="-22" width="192" height="52" preserveAspectRatio="xMidYMid meet" opacity={fogged ? 0.7 : 1} />
        <text className="wm-cont-name" x="0" y="2" textAnchor="middle"
          style={{ fill: fogged ? '#8a7a5e' : '#3a2c16' }}>{truncate(name, 18)}</text>
        <text className="wm-cont-sub" x="0" y="16" textAnchor="middle">
          {fogged ? (lapse ? `${lapse.name.toUpperCase()} HOLDS THIS` : 'UNDER THE NULL') : `${c.done}/${c.total}`}
        </text>
      </g>

      {showStartHere && (
        <g transform={`translate(${c.x}, ${c.y - h * 0.44})`} className={reduced ? undefined : 'wm-starthere'}>
          <rect x="-58" y="-16" width="116" height="28" rx="14" fill="#E8C36A" stroke="#5A4327" strokeWidth="1.5" />
          <text x="0" y="4" textAnchor="middle" className="wm-starthere-text">★ START HERE</text>
        </g>
      )}
    </g>
  );
});

// ─── Shared SVG defs (parchment, land gradient, vignette) ─────────────────────
const WorldDefs = memo(function WorldDefs() {
  return (
    <defs>
      {/* Bright candy-ocean (Cookie Run vibe) — turquoise centre → deep blue edge */}
      <radialGradient id="wm-parch" cx="50%" cy="44%" r="82%">
        <stop offset="0%" stopColor="#A7E8E0" />
        <stop offset="45%" stopColor="#6FC9DE" />
        <stop offset="100%" stopColor="#3E86C4" />
      </radialGradient>
      <radialGradient id="wm-vignette" cx="50%" cy="50%" r="74%">
        <stop offset="58%" stopColor="#000000" stopOpacity="0" />
        <stop offset="100%" stopColor="#0E3A66" stopOpacity="0.42" />
      </radialGradient>
      {/* Fallback land (only shows if an island PNG is missing) */}
      <radialGradient id="wm-land" cx="45%" cy="38%" r="75%">
        <stop offset="0%" stopColor="#A8D87A" />
        <stop offset="100%" stopColor="#6FA84E" />
      </radialGradient>
    </defs>
  );
});

const Compass = memo(function Compass({ x, y, r }) {
  return (
    <g transform={`translate(${x},${y})`} opacity="0.85">
      {/* SVG fallback star, covered by the pixellab compass when present */}
      <circle r={r} fill="none" stroke="#5A4327" strokeWidth="2" opacity="0.5" />
      <path d={`M0 ${-r} L${r * 0.16} 0 L0 ${r} L${-r * 0.16} 0 Z`} fill="#5A4327" opacity="0.4" />
      <path d={`M${-r} 0 L0 ${r * 0.16} L${r} 0 L0 ${-r * 0.16} Z`} fill="#5A4327" opacity="0.3" />
      <image href={`${ASSET}compass.png`} x={-r} y={-r} width={r * 2} height={r * 2} preserveAspectRatio="xMidYMid meet" />
    </g>
  );
});
