import { memo, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore.js';
import { PATHS, labUnlockStatus } from '../data/content.js';
import { PROVINCES, FIVE_LAPSES } from '../data/lore.js';
import BeastSprite from '../components/BeastSprite.jsx';

// ─── WORLD MAP (prototype v0) ────────────────────────────────────────────────
// A two-level treasure-map roadmap, geared toward the Cookie-Run-Kingdom look:
//
//   WORLD VIEW   — all 8 career paths as continents on one parchment map. Each
//                  continent shows ONE circle (a progress medallion). Unstarted
//                  continents sit under the Null's fog; the home continent
//                  (Fundamentals) wears a "Start here" banner for new Keepers.
//   CONTINENT    — tap a continent to sail in: its lessons appear as circles
//   VIEW           scattered across the landmass, linked in order by a faint
//                  dotted trail ("connected scatter"). Tap a circle → /lesson/:id.
//
// Art: pixel-art map furniture (banner ribbon, compass, node medallion, mountain
// props) is generated via the pixellab API and dropped into /public/worldmap/.
// Every <image> sits ON TOP of an SVG fallback, so the screen renders fully even
// before the PNGs exist — the art "fills in" once generated. Round 2 swaps the
// SVG blob landmasses for bespoke per-continent island sprites.
//
// This is mounted at the dev route /worldmap (see main.jsx) so it can be clicked
// through with `npm run dev` before it replaces the real Roadmap tab.

const ASSET = `${import.meta.env.BASE_URL}worldmap/`;

// World canvas — landscape like the reference map. All world-view geometry is
// in this coordinate space; the SVG scales to the frame via preserveAspectRatio.
const WORLD_W = 1000;
const WORLD_H = 680;

// ── Continent layout ─────────────────────────────────────────────────────────
// Hand-authored positions. Order encodes a soft learning progression (the §11
// "recommend a path / buildsOn" idea): Fundamentals is the home island, the
// rest fan outward. `accent` tints the progress medallion + "you are here" glow
// so each province reads distinctly on the monochrome parchment. `r` is the
// blob radius (continent size); `seed` drives its organic silhouette.
// Two gentle arcs of an archipelago. Islands are transparent cutouts, so small
// box overlaps don't read as collisions. `r` sizes the island; smaller + more
// spread than v0 so they don't crowd.
// Big continents packed into two bands (a mid-ocean strait between) so they
// read as a world of landmasses, not floating islands. `w` is the render width
// in canvas units; height derives at the art's 0.78 ratio. Transparent coasts
// let neighbouring frames overlap without looking like collisions.
const CONTINENTS = [
  { key: 'fundamentals', x: 200, y: 232, w: 384, accent: '#8FA876', home: true },
  { key: 'swe',          x: 438, y: 206, w: 320, accent: '#8FB5D8' },
  { key: 'faang',        x: 660, y: 208, w: 320, accent: '#E8C36A' },
  { key: 'mleng',        x: 878, y: 252, w: 300, accent: '#5ED8B8' },
  { key: 'devops',       x: 214, y: 498, w: 340, accent: '#E07E3A' },
  { key: 'fullstack',    x: 470, y: 500, w: 320, accent: '#C58FD8' },
  { key: 'mlops',        x: 700, y: 502, w: 320, accent: '#F5B842' },
  { key: 'cybersec',     x: 898, y: 540, w: 300, accent: '#E0706A' },
];

// ── Deterministic RNG so layouts never jump between renders ───────────────────
function hashSeed(n) {
  let h = 2166136261 ^ n;
  h = Math.imul(h ^ (h >>> 15), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^= h >>> 16) >>> 0;
}
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Scatter N lesson nodes across an ellipse, ordered as a gently meandering walk
// so the connecting trail reads as a path (the "connected scatter" choice).
function scatterNodes(n, cx, cy, rx, ry, seed) {
  if (n <= 0) return [];
  const rnd = mulberry32(hashSeed(seed * 131 + n));
  const out = [];
  const cols = Math.max(2, Math.ceil(Math.sqrt(n * 1.6)));
  const rows = Math.ceil(n / cols);
  let i = 0;
  for (let row = 0; row < rows && i < n; row++) {
    // Boustrophedon: snake left↔right each row so consecutive nodes stay near.
    const ltr = row % 2 === 0;
    for (let c = 0; c < cols && i < n; c++) {
      const col = ltr ? c : cols - 1 - c;
      const u = cols === 1 ? 0.5 : col / (cols - 1); // 0..1 across
      const v = rows === 1 ? 0.5 : row / (rows - 1); // 0..1 down
      // Map unit grid into the ellipse, with seeded jitter, then clamp inside.
      let px = cx + (u - 0.5) * 2 * rx * 0.82 + (rnd() - 0.5) * rx * 0.22;
      let py = cy + (v - 0.5) * 2 * ry * 0.82 + (rnd() - 0.5) * ry * 0.22;
      const dx = (px - cx) / rx;
      const dy = (py - cy) / ry;
      const m = Math.hypot(dx, dy);
      if (m > 0.96) { px = cx + (dx / m) * 0.96 * rx; py = cy + (dy / m) * 0.96 * ry; }
      out.push({ x: px, y: py });
      i++;
    }
  }
  return out;
}

function truncate(s, n) { return s && s.length > n ? s.slice(0, n - 1) + '…' : s; }

function pathStats(key, completed) {
  const lessons = PATHS[key]?.lessons || [];
  const done = lessons.filter((l) => completed[l.id]).length;
  return { lessons, total: lessons.length, done, pct: lessons.length ? done / lessons.length : 0 };
}

// ─── Screen ──────────────────────────────────────────────────────────────────
export default function WorldMap() {
  const nav = useNavigate();
  const storeCompleted = useStore((s) => s.completed);
  const companion = useStore((s) => s.companion);
  const beastTier = useStore((s) => s.beastTier);
  const reducedSetting = useStore((s) => s.settings?.reducedMotion);
  const reduced = reducedSetting
    || (typeof window !== 'undefined' && window.matchMedia
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const completed = storeCompleted || {};

  const [openKey, setOpenKey] = useState(null); // null = world view

  if (openKey && PATHS[openKey]) {
    return (
      <ContinentView
        pathKey={openKey}
        completed={completed}
        companion={companion}
        beastTier={beastTier}
        reduced={reduced}
        onBack={() => setOpenKey(null)}
        onOpenLesson={(id) => nav(`/lesson/${id}`)}
      />
    );
  }

  return (
    <WorldView completed={completed} reduced={reduced} onOpen={setOpenKey} />
  );
}

// ─── World view — all continents, one medallion each ─────────────────────────
// Exported: the Roadmap uses this as its landing (A1 — one map system; the
// serpentine trail is the drill-in). `activePath` pulses the current
// continent; `footer` is the landing's hero CTA slot (R5: one magnetic
// next action on top of the world).
export function WorldView({ completed, reduced, onOpen, activePath = null, footer = null }) {
  const continents = useMemo(
    () => CONTINENTS.map((c) => ({ ...c, ...pathStats(c.key, completed) })),
    [completed]
  );
  const fundStarted = (pathStats('fundamentals', completed).done) > 0;

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

      <div className="wm-frame">
        <svg viewBox={`0 0 ${WORLD_W} ${WORLD_H}`} preserveAspectRatio="xMidYMid meet" className="wm-svg">
          <WorldDefs />
          <rect x="0" y="0" width={WORLD_W} height={WORLD_H} fill="url(#wm-parch)" />
          <rect x="0" y="0" width={WORLD_W} height={WORLD_H} fill="url(#wm-vignette)" />

          {/* Title cartouche */}
          <g transform={`translate(${WORLD_W / 2}, 56)`}>
            <image href={`${ASSET}banner.png`} x="-185" y="-56" width="370" height="118" preserveAspectRatio="xMidYMid meet" />
            <text className="wm-banner-text" x="0" y="4" textAnchor="middle">WORLD MAP</text>
          </g>

          {/* A sea serpent for the deep (pixellab) */}
          <image href={`${ASSET}seamonster.png`} x="786" y="566" width="150" height="110" opacity="0.5" preserveAspectRatio="xMidYMid meet" />

          {continents.map((c) => (
            <ContinentBlob key={c.key} c={c} reduced={reduced} onOpen={onOpen}
              isActive={c.key === activePath}
              showStartHere={c.key === 'fundamentals' && !fundStarted} />
          ))}

          {/* Compass rose, bottom-left */}
          <g>
            <Compass x={92} y={WORLD_H - 92} r={58} />
          </g>
        </svg>
      </div>

      <p className="caption" style={{ marginTop: 10, fontSize: 12.5, textAlign: 'center' }}>
        Tap a continent to sail in. Fog hides provinces the Null still holds.
      </p>
      {footer}
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

// ─── Continent view — lessons scattered across the landmass ───────────────────
function ContinentView({ pathKey, completed, companion, beastTier, reduced, onBack, onOpenLesson }) {
  const path = PATHS[pathKey];
  const prov = PROVINCES[pathKey] || {};
  const lapse = prov.lapse ? FIVE_LAPSES[prov.lapse] : null;
  const accent = (CONTINENTS.find((c) => c.key === pathKey) || {}).accent || '#E8C36A';
  const lessons = path.lessons;

  const firstIncomplete = lessons.findIndex((l) => !completed[l.id]);
  const currentIdx = firstIncomplete >= 0 ? firstIncomplete : lessons.length - 1;
  const done = lessons.filter((l) => completed[l.id]).length;
  const pct = lessons.length ? done / lessons.length : 0;

  // Big island fills the frame; nodes scatter inside an inner ellipse.
  const cx = WORLD_W / 2, cy = WORLD_H / 2 + 8;
  const nodes = useMemo(() => scatterNodes(lessons.length, cx, cy, 322, 214, (pathKey.charCodeAt(1) || 11) + 3), [pathKey, lessons.length]);

  const labUnlocks = useMemo(() => {
    const m = {};
    for (const l of lessons) if (l.kind === 'lab') m[l.id] = labUnlockStatus(path, l, completed);
    return m;
  }, [pathKey, completed]); // eslint-disable-line react-hooks/exhaustive-deps

  const onNode = useCallback((lesson) => {
    if (lesson.kind === 'lab') {
      const ok = !!labUnlocks[lesson.id]?.unlocked || !!completed[lesson.id];
      if (!ok) return;
    }
    onOpenLesson(lesson.id);
  }, [labUnlocks, completed, onOpenLesson]);

  // Dotted order-trail connecting consecutive nodes.
  const trail = nodes.length > 1
    ? 'M ' + nodes.map((n) => `${n.x.toFixed(1)} ${n.y.toFixed(1)}`).join(' L ')
    : '';

  const walker = nodes[currentIdx];

  return (
    <div className="screen fade-in">
      <button className="wm-back" onClick={onBack} aria-label="Back to world map">← World</button>
      <div className="kicker" style={{ marginBottom: 2, marginTop: 6 }}>
        {(prov.epithet || '').toUpperCase()}
      </div>
      <div className="row" style={{ marginBottom: 8 }}>
        <h1 className="h1" style={{ margin: 0 }}>{prov.name || path.name}<span className="dot">.</span></h1>
        <span className="spacer" />
        <span className="pill" style={{ background: 'var(--accent-amber-bg)', color: 'var(--accent-amber)', fontSize: 10, padding: '4px 10px' }}>
          {done} / {lessons.length} · {Math.round(pct * 100)}%
        </span>
      </div>

      <div className="wm-frame">
        <svg viewBox={`0 0 ${WORLD_W} ${WORLD_H}`} preserveAspectRatio="xMidYMid meet" className="wm-svg">
          <WorldDefs />
          <rect x="0" y="0" width={WORLD_W} height={WORLD_H} fill="url(#wm-parch)" />
          {/* Cast shadow under the continent */}
          <ellipse cx={cx} cy={cy + 248} rx="340" ry="62" fill="#0E3A66" opacity="0.2" />
          {/* Big per-continent continent art (pixellab; background keyed transparent) */}
          <image href={`${ASSET}island-${pathKey}.png`} x={cx - 400} y={cy - 320}
            width="800" height="640" preserveAspectRatio="xMidYMid meet" style={{ imageRendering: 'pixelated' }} />

          {/* Order trail */}
          {trail && <path d={trail} fill="none" stroke="#5A4327" strokeWidth="2.5" strokeDasharray="2 8" strokeLinecap="round" opacity="0.55" />}

          {nodes.map((n, i) => {
            const lesson = lessons[i];
            const isDone = !!completed[lesson.id];
            const isCurrent = i === currentIdx && !isDone;
            const kind = lesson.kind || 'concept';
            const locked = kind === 'lab' && !(labUnlocks[lesson.id]?.unlocked || isDone);
            const fill = isDone ? '#E8C36A' : isCurrent ? accent : '#e6d6b2';
            return (
              <g key={lesson.id} role="button" tabIndex={0} aria-label={lesson.title}
                style={{ cursor: locked ? 'not-allowed' : 'pointer' }}
                onClick={() => onNode(lesson)}
                onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !locked) { e.preventDefault(); onNode(lesson); } }}>
                {isCurrent && !reduced && <circle cx={n.x} cy={n.y} r="17" fill={accent} opacity="0.3" className="wm-node-pulse" />}
                <circle cx={n.x} cy={n.y} r={kind === 'sd' ? 9 : kind === 'lab' ? 12 : 10}
                  fill={fill} stroke="#4a3618" strokeWidth="2" opacity={locked ? 0.5 : 1} />
                {isDone && <text x={n.x} y={n.y + 4} textAnchor="middle" fontSize="11" fill="#4a3618">✓</text>}
                {locked && <text x={n.x} y={n.y + 4} textAnchor="middle" fontSize="10">🔒</text>}
                {kind === 'lab' && !locked && !isDone && <text x={n.x} y={n.y + 4} textAnchor="middle" fontSize="10">🔨</text>}
                {(isCurrent || kind === 'lab') && (
                  <text x={n.x} y={n.y + 24} textAnchor="middle" className="wm-node-label">{truncate(lesson.title, 22)}</text>
                )}
              </g>
            );
          })}

          {lapse && pct < 1 && (
            <image
              href={`${ASSET}lapse-${lapse.id}.png`}
              x={WORLD_W - 150} y={WORLD_H - 168}
              width="120" height="120"
              preserveAspectRatio="xMidYMid meet"
              aria-hidden="true"
              style={{ imageRendering: 'pixelated', filter: 'grayscale(1) brightness(0.62)', opacity: 0.85 }}
            />
          )}
          {lapse && (
            <text x={WORLD_W - 30} y={WORLD_H - 24} textAnchor="end" className="wm-cont-sub" opacity={pct >= 1 ? 0.4 : 0.8}>
              {pct >= 1 ? `${lapse.name.toUpperCase()} HAS FLED` : `${lapse.name.toUpperCase()} WAITS AT THE END`}
            </text>
          )}
        </svg>

        {walker && (
          <div className="wm-walker" style={{ left: `${(walker.x / WORLD_W) * 100}%`, top: `${(walker.y / WORLD_H) * 100}%` }}>
            <div className="wm-walker-bob"><BeastSprite species={companion} tier={beastTier} size={40} /></div>
          </div>
        )}
      </div>

      <button className="btn btn-primary btn-block" style={{ marginTop: 12 }}
        onClick={() => lessons[currentIdx] && onOpenLesson(lessons[currentIdx].id)} disabled={!lessons[currentIdx]}>
        {pct >= 1 ? 'Review' : 'Open'}: {truncate(lessons[currentIdx]?.title || '—', 30)} →
      </button>
    </div>
  );
}

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
