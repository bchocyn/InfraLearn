import { memo, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore.js';
import { PATHS, PATH_KEYS, groupedSections, labUnlockStatus, pathProgress } from '../data/content.js';
import { LEVELS, LEVEL_LABEL } from '../data/beasts.js';
import { PROVINCES, FIVE_LAPSES } from '../data/lore.js';
import BeastSprite from '../components/BeastSprite.jsx';

// ─── The Adventure Map (v4) ───────────────────────────────────────────────────
// Mario-style serpentine SVG trail. The Byte Beast walks between nodes as you
// progress. Cleared nodes glow amber, locked nodes dim, a medal sits at the
// path end. Labs appear as side-quests off the main trail; SD insights are
// inline diamonds. The scene behind the trail varies per career path — each
// path gets its own twilight palette (skyTop/skyMid/skyBot, mountains, hills,
// trees, moon, stars).
//
// All node clicks navigate to /lesson/:id, except locked labs (no-op).

// ─── Per-path twilight scene palettes ────────────────────────────────────────
// One palette per career path; sky stops + mountain/hill/tree colors + moon
// and star tones. Designed to feel evocative of the path's "vibe".
const SCENES = {
  // Green meadow morning — teal sky → warm horizon, green hills
  fundamentals: {
    skyTop: '#1B3F4E',
    skyMid: '#3E6E78',
    skyBot: '#E8A36A',
    mountainsFar: '#26414C',
    mountainsNear: '#1A2F38',
    snowCap: '#E8F2F8',
    hill: '#3E5C36',
    tree: '#1F3318',
    moon: '#FFE8B0',
    star: '#F4EFE3',
    // Sandy dirt with grass edges
    trail: {
      base: '#C9A66B',
      edge: '#3E5C36',
      speckle: '#876A3E',
      highlight: '#E8D3A0',
      width: 22,
    },
  },
  // Industrial sunset — orange + grey-purple
  devops: {
    skyTop: '#2A1F3A',
    skyMid: '#6A3A4A',
    skyBot: '#E07E3A',
    mountainsFar: '#3A2F44',
    mountainsNear: '#241E2E',
    snowCap: '#D8C0B5',
    hill: '#2E2336',
    tree: '#15101C',
    moon: '#FFE0B0',
    star: '#FFD8A8',
    // Grey stone with cracked-brick speckle
    trail: {
      base: '#7A6F66',
      edge: '#3A2F36',
      speckle: '#5C5048',
      highlight: '#A89B8C',
      width: 22,
    },
  },
  // Mystic twilight — purple + amber
  mlops: {
    skyTop: '#1F0F3A',
    skyMid: '#3E1E5E',
    skyBot: '#F5B842',
    mountainsFar: '#2E1B4D',
    mountainsNear: '#1A0E33',
    snowCap: '#F5B842',
    hill: '#1B0E28',
    tree: '#08040F',
    moon: '#FFE8B0',
    star: '#F5B842',
    // Moonlit purple-stone
    trail: {
      base: '#5E4A78',
      edge: '#2A1F40',
      speckle: '#3E2F5C',
      highlight: '#8A78A8',
      width: 22,
    },
  },
  // Dawn blue — cool blues
  swe: {
    skyTop: '#0E1F3E',
    skyMid: '#2E4A75',
    skyBot: '#8FB5D8',
    mountainsFar: '#1F3358',
    mountainsNear: '#13213B',
    snowCap: '#E0EAF5',
    hill: '#1A2A45',
    tree: '#0A1322',
    moon: '#F0F4FF',
    star: '#E0EAF5',
    // Cool flagstone
    trail: {
      base: '#5E7088',
      edge: '#1F3358',
      speckle: '#3E5275',
      highlight: '#8AA0B8',
      width: 22,
    },
  },
  // Deep cosmos — near-black + aurora
  mleng: {
    skyTop: '#05030E',
    skyMid: '#0E1A3A',
    skyBot: '#5ED8B8',
    mountainsFar: '#0B1426',
    mountainsNear: '#040810',
    snowCap: '#7EE6C8',
    hill: '#070C18',
    tree: '#020308',
    moon: '#B0F5DC',
    star: '#7EE6C8',
    // Glowing aurora-teal cosmic dust
    trail: {
      base: '#3E6E7E',
      edge: '#0E1A3A',
      speckle: '#1E4A58',
      highlight: '#7EE6C8',
      width: 22,
    },
  },
  // Gold ridge — warm amber + dark purple
  faang: {
    skyTop: '#1A0E2E',
    skyMid: '#4E2F4A',
    skyBot: '#F5B842',
    mountainsFar: '#2E1F3E',
    mountainsNear: '#1A1228',
    snowCap: '#F5D88A',
    hill: '#1F1530',
    tree: '#0A0614',
    moon: '#FFE8B0',
    star: '#F5D88A',
    // Gold-flecked obsidian
    trail: {
      base: '#5C4032',
      edge: '#1F1530',
      speckle: '#3A2A20',
      highlight: '#F5D88A',
      width: 22,
    },
  },
  // Cyber dusk — deep indigo fading to cool cyan
  fullstack: {
    skyTop: '#1A1F3A',
    skyMid: '#3E4A78',
    skyBot: '#7AC2D8',
    mountainsFar: '#2A3354',
    mountainsNear: '#1A1F38',
    snowCap: '#E0EAF5',
    hill: '#2E3B5E',
    tree: '#0E1428',
    moon: '#E0EAF5',
    star: '#A8C8E0',
    // Cool slate flagstone with cyan glow
    trail: {
      base: '#5A7088',
      edge: '#1A2238',
      speckle: '#3E4E6E',
      highlight: '#8A9EB8',
      width: 22,
    },
  },
  // Cyber dark — deep crimson + matrix-green
  cybersec: {
    skyTop: '#0A0810',
    skyMid: '#3A0E1E',
    skyBot: '#2E1A14',
    mountainsFar: '#1A0F1F',
    mountainsNear: '#0A0610',
    snowCap: '#5EE07A',
    hill: '#0E0814',
    tree: '#040208',
    moon: '#5EE07A',
    star: '#7EFF8A',
    // Black-steel trail with electric-green speckle
    trail: {
      base: '#2A2A2E',
      edge: '#0A0A0E',
      speckle: '#1A1A1E',
      highlight: '#5EE07A',
      width: 22,
    },
  },
};

// Tiny deterministic hash → pseudo-random in [0,1). Keeps stars and trees
// in stable positions across re-renders for a given path key.
function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0);
}
function mulberry32(seed) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6D2B79F5) >>> 0;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Geometry helpers ────────────────────────────────────────────────────────
const W = 360;
const STEP_Y = 88;
const TOP = 60;

// Compute trail nodes in a serpentine pattern. Labs are offset to the side
// (side-quest), all other kinds sit on the main trail.
function buildNodes(lessons) {
  const xLeft = W * 0.22;
  const xRight = W * 0.78;
  return lessons.map((lesson, i) => {
    const onLeft = i % 2 === 0;
    const mainX = onLeft ? xLeft : xRight;
    const y = TOP + i * STEP_Y;
    if (lesson.kind === 'lab') {
      // Push the lab AWAY from the trail (further into the side margin) so it
      // reads as a side-quest off the main route.
      const offset = onLeft ? -40 : 40;
      return { lesson, x: mainX + offset, y, mainX, mainY: y, onLeft, isSide: true };
    }
    return { lesson, x: mainX, y, mainX, mainY: y, onLeft, isSide: false };
  });
}

// Build a smooth path connecting the MAIN-trail node positions (skipping the
// offset for labs — the connector to a lab is drawn separately). The first
// segment is a Q curve; subsequent segments use T to continue smoothly.
// Also returns the resolved Q control points for each segment so callers can
// sample points along the curve for decorative speckle placement.
function buildTrailPath(nodes) {
  const trailPoints = nodes.map((n) => ({ x: n.mainX, y: n.mainY }));
  if (!trailPoints.length) return { d: '', segments: [] };
  let d = `M ${trailPoints[0].x} ${trailPoints[0].y}`;
  const segments = []; // each: { p0, c, p1 } — quadratic approximation for speckle sampling
  for (let i = 1; i < trailPoints.length; i++) {
    const prev = trailPoints[i - 1];
    const cur = trailPoints[i];
    const midY = (prev.y + cur.y) / 2;
    // Cubic bezier with VERTICAL control points: exit prev straight down,
    // enter cur straight down. The curve always passes cleanly through both
    // endpoints — no wide outward sweeps from T-reflection. Looks like a
    // smooth S between alternating left/right nodes.
    const cp1x = prev.x, cp1y = midY;
    const cp2x = cur.x,  cp2y = midY;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${cur.x} ${cur.y}`;
    // Approximate as a quadratic with control at the midpoint of cp1/cp2
    // for speckle placement (close enough — speckles are decorative).
    segments.push({ p0: prev, c: { x: (cp1x + cp2x) / 2, y: midY }, p1: cur });
  }
  return { d, segments };
}

// Quadratic bezier point/derivative at parameter t.
function quadPoint(seg, t) {
  const mt = 1 - t;
  const x = mt * mt * seg.p0.x + 2 * mt * t * seg.c.x + t * t * seg.p1.x;
  const y = mt * mt * seg.p0.y + 2 * mt * t * seg.c.y + t * t * seg.p1.y;
  return { x, y };
}
function quadTangent(seg, t) {
  const mt = 1 - t;
  const dx = 2 * mt * (seg.c.x - seg.p0.x) + 2 * t * (seg.p1.x - seg.c.x);
  const dy = 2 * mt * (seg.c.y - seg.p0.y) + 2 * t * (seg.p1.y - seg.c.y);
  const len = Math.hypot(dx, dy) || 1;
  return { x: dx / len, y: dy / len };
}

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function Roadmap() {
  const nav = useNavigate();
  // Narrowed subscriptions — primitives + stable references only, so store
  // writes that don't touch these fields (XP ticks, celebration set+clear
  // pairs, review grades) no longer re-render the scene at all. `completed`
  // changes reference on lesson completion, which is exactly when the
  // nodes/walker/medal layer must repaint. Actions are stable refs in zustand.
  const activePath = useStore((st) => st.activePath);
  const storeCompleted = useStore((st) => st.completed);
  const level = useStore((st) => st.level);
  const hideCompanion = useStore((st) => st.settings?.hideCompanion);
  const companion = useStore((st) => st.companion);
  const beastTier = useStore((st) => st.beastTier);
  const setLevel = useStore((st) => st.setLevel);
  const setActivePath = useStore((st) => st.setActivePath);
  // Reduced motion: in-app setting OR the OS preference (same pattern as
  // AnimatedDiagram). Gates the SMIL story animations (fog drift, eye blink,
  // shimmer breathe) — they simply aren't rendered when motion is reduced.
  const reducedSetting = useStore((st) => st.settings?.reducedMotion);
  const reduced = reducedSetting
    || (typeof window !== 'undefined' && window.matchMedia
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  const pathKey = PATHS[activePath] ? activePath : 'devops';
  const path = PATHS[pathKey];
  const lessons = path.lessons;
  const completed = storeCompleted || {};

  // First lesson the learner hasn't completed — drives the walker position
  // and bottom CTA. Falls back to the last lesson if everything's done.
  const firstIncompleteIdx = lessons.findIndex((l) => !completed[l.id]);
  const currentIdx = firstIncompleteIdx >= 0 ? firstIncompleteIdx : lessons.length - 1;
  const currentLesson = lessons[currentIdx];

  const doneCount = lessons.filter((l) => completed[l.id]).length;
  const allDone = lessons.length > 0 && doneCount === lessons.length;
  const pct = lessons.length ? doneCount / lessons.length : 0;

  const levelLabel = (level || 'novice').toUpperCase();
  const pathLabel = (path.name || pathKey).toUpperCase();

  // Compute the node layout + canvas height.
  const nodes = useMemo(() => buildNodes(lessons), [lessons]);
  const H = TOP + lessons.length * STEP_Y + 80;

  // Per-lab unlock map — computed ONCE per (path, completed) change.
  // labUnlockStatus() rebuilds groupedSections(path) internally, so calling
  // it inline for every lab node on every render (and again on click) was
  // O(labs × lessons) work per paint.
  const labUnlocks = useMemo(() => {
    const map = {};
    for (const l of lessons) {
      if (l.kind === 'lab') map[l.id] = labUnlockStatus(path, l, completed);
    }
    return map;
  }, [pathKey, completed]); // eslint-disable-line react-hooks/exhaustive-deps

  // Walker position. The Byte Beast stands ON the current node.
  const walkerNode = nodes[currentIdx];
  const walkerLeftPct = walkerNode ? (walkerNode.mainX / W) * 100 : 50;
  const walkerTopPct = walkerNode ? (walkerNode.mainY / H) * 100 : 50;

  // ── Story layer derivations ────────────────────────────────────────────
  // Province identity for the active path (graceful skip when a path has no
  // lore entry yet) + the Lapse that haunts it.
  const province = PROVINCES[pathKey] || null;
  const lapse = province ? FIVE_LAPSES[province.lapse] || null : null;
  // Frontier of the reclaimed world — the Y of the FIRST not-yet-completed
  // node, taken from the same `nodes` layout the node circles render from
  // (node i sits at mainY = TOP + i·STEP_Y). The trail progresses DOWNWARD,
  // so everything BELOW this line is un-walked: that's where the Null's fog
  // sits, and it recedes (frontier moves down) as lessons complete. Null
  // when the path is fully reclaimed or has no lessons — no fog either way.
  const frontierNode = !allDone && firstIncompleteIdx >= 0 ? nodes[firstIncompleteIdx] : null;
  const frontierY = frontierNode ? frontierNode.mainY : null;

  const handleNodeClick = (n) => {
    if (n.lesson.kind === 'lab') {
      const unlocked = !!labUnlocks[n.lesson.id]?.unlocked;
      const done = !!completed[n.lesson.id];
      // Already-finished labs stay openable; otherwise gate on unlock.
      if (!unlocked && !done) return;
    }
    nav(`/lesson/${n.lesson.id}`);
  };

  return (
    <div className="screen fade-in">
      <div className="kicker" style={{ marginBottom: 4 }}>
        {pathLabel} · {levelLabel}
      </div>
      <div className="row" style={{ marginBottom: 4 }}>
        <h1 className="h1" style={{ margin: 0 }}>The journey<span className="dot">.</span></h1>
        <span className="spacer" />
        <span
          className="pill"
          style={{
            background: allDone ? 'rgba(143,168,118,.18)' : 'var(--accent-amber-bg)',
            color: allDone ? 'var(--status-success)' : 'var(--accent-amber)',
            fontSize: 10,
            padding: '4px 10px',
          }}
        >
          {doneCount} / {lessons.length} · {Math.round(pct * 100)}%
        </span>
      </div>
      <p className="caption" style={{ marginBottom: 10, fontSize: 13 }}>
        {path.icon} {path.name} — {allDone ? 'complete' : `${lessons.length - doneCount} lessons to go`}
      </p>

      <RoadmapPickers level={level} setLevel={setLevel} setActivePath={setActivePath} pathKey={pathKey} completed={completed} />

      <ProvinceBanner province={province} pathLabel={pathLabel} />

      <div className="roadmap-scene" style={{ aspectRatio: `${W} / ${H}` }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="xMidYMid meet"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
        >
          <RoadmapStaticScene pathKey={pathKey} nodes={nodes} H={H} />

          {/* Nodes */}
          {nodes.map((n, i) => {
            const lesson = n.lesson;
            const done = !!completed[lesson.id];
            const isCurrent = i === currentIdx && !done;
            const kind = lesson.kind || 'concept';

            let unlocked = true;
            if (kind === 'lab') {
              unlocked = !!labUnlocks[lesson.id]?.unlocked || done;
            }

            const clickable = !(kind === 'lab' && !unlocked);
            const cursor = clickable ? 'pointer' : 'not-allowed';

            return (
              <g
                key={lesson.id}
                onClick={() => handleNodeClick(n)}
                style={{ cursor }}
                aria-label={lesson.title}
              >
                {/* Current node halo — gently scales for the "you are here" beat. */}
                {isCurrent ? (
                  <circle
                    className="roadmap-current-pulse"
                    cx={n.x}
                    cy={n.y}
                    r="22"
                    fill={`url(#halo-${pathKey})`}
                  />
                ) : null}

                {kind === 'sd' ? (
                  <SdNode n={n} done={done} />
                ) : kind === 'lab' ? (
                  <LabNode n={n} done={done} unlocked={unlocked} />
                ) : (
                  <ConceptNode n={n} done={done} isCurrent={isCurrent} />
                )}

                {/* Label below node */}
                <text
                  x={n.x}
                  y={n.y + (kind === 'lab' ? 22 : 20)}
                  fontFamily="JetBrains Mono, ui-monospace, monospace"
                  fontSize="8.5"
                  textAnchor={n.x > 250 ? 'end' : n.x < 110 ? 'start' : 'middle'}
                  fill="#F4EFE3"
                  style={{ paintOrder: 'stroke', stroke: '#0B0A08', strokeWidth: 3 }}
                >
                  {truncate(lesson.title, 26)}
                </text>
                {kind === 'lab' && !unlocked ? (
                  <text
                    x={n.x}
                    y={n.y + 4}
                    fontFamily="JetBrains Mono, ui-monospace, monospace"
                    fontSize="10"
                    textAnchor="middle"
                    fill="#F4EFE3"
                    opacity="0.85"
                  >
                    🔒
                  </text>
                ) : null}
              </g>
            );
          })}

          {/* Medal at end of trail */}
          <Medal x={W / 2} y={H - 30} active={allDone} pathKey={pathKey} />

          {/* ── Story layer (dynamic — progress-dependent, so it lives OUT-
              side the memoized static scene). Fog of the Null over the
              un-walked stretch below the frontier, then the province's
              Lapse waiting at the trail's far end. Both groups are
              pointer-events:none so node taps pass straight through. */}
          <NullFog frontierY={frontierY} H={H} allDone={allDone} reduced={reduced} pathKey={pathKey} />
          {nodes.length > 0 ? (
            <LapsePresence lapse={lapse} H={H} allDone={allDone} reduced={reduced} />
          ) : null}
        </svg>

        {/* Walking beast — outer div handles positioning + transition between
            nodes; inner div handles the idle bob so the two transforms don't
            stomp on each other. */}
        {!hideCompanion && walkerNode ? (
          <div
            className="roadmap-walker"
            style={{
              left: `${walkerLeftPct}%`,
              top: `${walkerTopPct}%`,
            }}
          >
            <div className="roadmap-walker-bob">
              <BeastSprite species={companion} tier={beastTier} size={42} />
            </div>
          </div>
        ) : null}
      </div>

      <button
        className="btn btn-primary btn-block"
        style={{ marginTop: 14 }}
        onClick={() => currentLesson && nav(`/lesson/${currentLesson.id}`)}
        disabled={!currentLesson}
      >
        {allDone ? 'Review' : 'Open'}: {currentLesson?.title || '—'} →
      </button>
    </div>
  );
}

// ─── Static decorative scene (memoized) ──────────────────────────────────────
// Everything here depends only on (pathKey, nodes, H) — all derived from the
// active path's STATIC lesson list, never from completed/progress state.
// `nodes` is referentially stable per path (parent useMemo over the static
// lessons array), so this memo boundary re-renders only on a path switch.
// Store writes (XP ticks, celebration set+clear pairs, lesson completions)
// re-render only the nodes/walker/medal layer in the parent — the ~500
// decorative elements below (sky, stars, clouds, mountains, trail, speckles,
// motes, grass, lab connectors, section labels, fireflies) are skipped.
const RoadmapStaticScene = memo(function RoadmapStaticScene({ pathKey, nodes, H }) {
  const path = PATHS[pathKey];
  const scene = SCENES[pathKey] || SCENES.devops;

  // Sections grouped from the schema — used for subtle section labels along
  // the trail (best-effort polish; rendered only if there's space).
  const sections = useMemo(() => groupedSections(path), [pathKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const { d: trailD, segments: trailSegments } = useMemo(() => buildTrailPath(nodes), [nodes]);

  // Trail palette for this scene (with safe fallback if a path lacks one).
  const trail = scene.trail || {
    base: '#C9A66B',
    edge: '#3E5C36',
    speckle: '#876A3E',
    highlight: '#E8D3A0',
    width: 22,
  };

  // Pixel speckles along the trail. For each segment, sample N evenly-spaced
  // points and jitter them ±2px perpendicular to the path direction so they
  // look like embedded pebbles. Deterministic via pathKey seed.
  const speckles = useMemo(() => {
    const rnd = mulberry32(hash(pathKey + 'speckles'));
    const out = [];
    const samplesPerSeg = 8;
    trailSegments.forEach((seg, segIdx) => {
      for (let k = 1; k <= samplesPerSeg; k++) {
        const t = k / (samplesPerSeg + 1);
        const p = quadPoint(seg, t);
        const tan = quadTangent(seg, t);
        // Perpendicular to tangent.
        const nx = -tan.y;
        const ny = tan.x;
        const jitter = (rnd() - 0.5) * 4; // ±2
        out.push({
          x: p.x + nx * jitter - 1,
          y: p.y + ny * jitter - 1,
          key: `sp-${segIdx}-${k}`,
        });
      }
    });
    return out;
  }, [trailSegments, pathKey]);

  // Tile seam markers — small perpendicular clusters of darker pixels at the
  // midpoint of every other segment, suggesting grouted tile joints.
  const tileSeams = useMemo(() => {
    const out = [];
    trailSegments.forEach((seg, segIdx) => {
      if (segIdx % 2 !== 0) return; // every other segment
      const t = 0.5;
      const p = quadPoint(seg, t);
      const tan = quadTangent(seg, t);
      const nx = -tan.y;
      const ny = tan.x;
      // 5 darker pixels perpendicular to the trail direction.
      const half = trail.width * 0.4;
      for (let k = -2; k <= 2; k++) {
        const off = (k / 2) * half;
        out.push({
          x: p.x + nx * off - 1,
          y: p.y + ny * off - 1,
          key: `ts-${segIdx}-${k}`,
        });
      }
    });
    return out;
  }, [trailSegments, trail.width]);

  // Map each section name to the index of its FIRST row, so we can drop a
  // small label near the boundary node.
  const sectionStartIdx = useMemo(() => {
    const map = new Map();
    let acc = 0;
    for (const sec of sections) {
      if (!map.has(sec.name)) map.set(sec.name, acc);
      acc += sec.rows.length;
    }
    return map;
  }, [sections]);

  // Deterministic stars + trees for this path.
  // Stars now span the FULL canvas height (not just the upper 45%) so the
  // long scrollable trail feels populated end-to-end. ~15% of stars are
  // larger and tagged for an amber glow; ~20% additionally twinkle.
  const stars = useMemo(() => {
    const rnd = mulberry32(hash(pathKey + 'stars'));
    const out = [];
    // 70 stars distributed roughly uniformly over [0, H].
    for (let i = 0; i < 70; i++) {
      const big = rnd() < 0.15;
      out.push({
        x: rnd() * W,
        y: rnd() * H,
        size: big ? (rnd() < 0.5 ? 2 : 3) : 1,
        big,
        twinkle: rnd() < 0.2,
        op: 0.45 + rnd() * 0.55,
        delay: rnd() * 4,
      });
    }
    return out;
  }, [pathKey, H]);

  const trees = useMemo(() => {
    const rnd = mulberry32(hash(pathKey + 'trees'));
    const out = [];
    for (let i = 0; i < 10; i++) {
      // Place trees in the foreground band (roughly 78%–96% of height).
      out.push({
        x: 10 + rnd() * (W - 20),
        y: H * (0.78 + rnd() * 0.16),
        h: 14 + rnd() * 10,
      });
    }
    return out;
  }, [pathKey, H]);

  // Drifting clouds — small pill shapes scattered across mid-canvas at varied
  // altitudes (5%–85% of H). Each cloud picks its own drift direction and
  // duration so they don't all sway in lockstep.
  const clouds = useMemo(() => {
    const rnd = mulberry32(hash(pathKey + 'clouds'));
    const out = [];
    const n = 4 + Math.floor(rnd() * 2); // 4 or 5 clouds
    for (let i = 0; i < n; i++) {
      const w = 22 + rnd() * 28;
      const h = 5 + rnd() * 3;
      out.push({
        x: rnd() * (W - w),
        y: H * (0.05 + rnd() * 0.80),
        w,
        h,
        op: 0.28 + rnd() * 0.22,
        dur: 30 + rnd() * 20, // 30–50s
        dir: rnd() < 0.5 ? 1 : -1,
        delay: rnd() * 8,
      });
    }
    return out;
  }, [pathKey, H]);

  // Fireflies — 2–3 small glowing dots near each trail node. Decorative only.
  const fireflies = useMemo(() => {
    const rnd = mulberry32(hash(pathKey + 'fireflies'));
    const out = [];
    nodes.forEach((n, idx) => {
      const count = 2 + Math.floor(rnd() * 2); // 2 or 3
      for (let i = 0; i < count; i++) {
        const angle = rnd() * Math.PI * 2;
        const radius = 12 + rnd() * 13;
        out.push({
          x: n.x + Math.cos(angle) * radius,
          y: n.y + Math.sin(angle) * radius,
          dur: 2 + rnd(), // 2–3s
          delay: rnd() * 3,
          key: `ff-${idx}-${i}`,
        });
      }
    });
    return out;
  }, [pathKey, nodes]);

  // Per-node grass tufts — 4–6 thin blades below each node for foliage.
  const grass = useMemo(() => {
    const rnd = mulberry32(hash(pathKey + 'grass'));
    const out = [];
    nodes.forEach((n, idx) => {
      const count = 4 + Math.floor(rnd() * 3); // 4–6
      for (let i = 0; i < count; i++) {
        const spread = 14;
        const bx = n.x - spread + rnd() * spread * 2;
        const by = n.y + 11 + rnd() * 2;
        out.push({
          x: bx,
          y: by,
          w: 1 + Math.floor(rnd() * 2), // 1–2px wide
          h: 2 + rnd() * 3, // 2–5px tall
          key: `g-${idx}-${i}`,
        });
      }
    });
    return out;
  }, [pathKey, nodes]);

  // Dust motes — 10 tiny floating particles in mid-canvas drift slowly upward.
  const motes = useMemo(() => {
    const rnd = mulberry32(hash(pathKey + 'motes'));
    const out = [];
    for (let i = 0; i < 10; i++) {
      out.push({
        x: rnd() * W,
        y: H * (0.15 + rnd() * 0.75),
        dur: 10 + rnd() * 10, // 10–20s
        delay: rnd() * 12,
        key: `m-${i}`,
      });
    }
    return out;
  }, [pathKey, H]);

  // Brighter foliage variant for grass — derived from scene.tree but lifted.
  // (We just use scene.hill which already is a brighter green tone in most
  // palettes; falls back nicely across all six paths.)
  const grassColor = scene.hill;

  // Mountain polygon points.
  const mountainsFar = useMemo(() => buildFarMountains(H), [H]);
  const mountainsNear = useMemo(() => buildNearMountains(H), [H]);
  const hillsD = useMemo(() => buildHillsPath(H), [H]);

  return (
    <>
          <defs>
            <linearGradient id={`sky-${pathKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={scene.skyTop} />
              <stop offset="55%" stopColor={scene.skyMid} />
              <stop offset="100%" stopColor={scene.skyBot} />
            </linearGradient>
            <radialGradient id={`halo-${pathKey}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#F5B842" stopOpacity="0.65" />
              <stop offset="60%" stopColor="#F5B842" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#F5B842" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Sky */}
          <rect x="0" y="0" width={W} height={H} fill={`url(#sky-${pathKey})`} />

          {/* Stars — span the full canvas; bigger ones glow, ~20% twinkle. */}
          {stars.map((st, i) => {
            const cls = [
              st.big ? 'roadmap-star-glow' : null,
              st.twinkle ? 'roadmap-star-twinkle' : null,
            ]
              .filter(Boolean)
              .join(' ');
            return (
              <rect
                key={`s${i}`}
                className={cls || undefined}
                x={st.x}
                y={st.y}
                width={st.size}
                height={st.size}
                fill={scene.star}
                opacity={st.op}
                style={st.twinkle ? { animationDelay: `${st.delay}s` } : undefined}
              />
            );
          })}

          {/* Drifting clouds — varied altitude, slow horizontal oscillation. */}
          {clouds.map((c, i) => (
            <rect
              key={`cl${i}`}
              className="roadmap-cloud-drift"
              x={c.x}
              y={c.y}
              width={c.w}
              height={c.h}
              rx={c.h / 2}
              ry={c.h / 2}
              fill={scene.snowCap}
              opacity={c.op}
              style={{
                animationDuration: `${c.dur}s`,
                animationDelay: `${c.delay}s`,
                ['--cloud-dir']: c.dir,
              }}
            />
          ))}

          {/* Moon */}
          <circle cx={W * 0.85} cy={H * 0.12} r="10" fill={scene.moon} opacity="0.95" />
          <circle cx={W * 0.85} cy={H * 0.12} r="18" fill={scene.moon} opacity="0.15" />

          {/* Distant zig-zag mountains */}
          <polygon points={mountainsFar} fill={scene.mountainsFar} />
          {/* Snow caps on far peaks */}
          <SnowCaps color={scene.snowCap} H={H} />

          {/* Nearer smoother mountains */}
          <polygon points={mountainsNear} fill={scene.mountainsNear} />

          {/* Foreground hills */}
          <path d={hillsD} fill={scene.hill} />

          {/* Foreground pine trees */}
          {trees.map((t, i) => (
            <polygon
              key={`t${i}`}
              points={`${t.x},${t.y - t.h} ${t.x - t.h * 0.45},${t.y} ${t.x + t.h * 0.45},${t.y}`}
              fill={scene.tree}
            />
          ))}

          {/* Trail (main) — tile-textured terrain pathway. Layered strokes
              build a grass-edged path with sun-lit highlight + speckled
              pebble texture. Static (no flow animation per user pref). */}
          <g className="roadmap-trail-tile">
            {/* Grass/foliage edge strip */}
            <path
              d={trailD}
              stroke={trail.edge}
              strokeWidth={trail.width + 6}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            {/* Base path (dirt/stone) */}
            <path
              className="roadmap-trail-base"
              d={trailD}
              stroke={trail.base}
              strokeWidth={trail.width}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            {/* Tile-seam clusters — darker pixels suggesting grouted joints */}
            {tileSeams.map((ts) => (
              <rect
                key={ts.key}
                className="roadmap-trail-speckle"
                x={ts.x}
                y={ts.y}
                width="2"
                height="2"
                fill={trail.speckle}
                opacity="0.85"
              />
            ))}
            {/* Pebble speckles embedded in the path */}
            {speckles.map((sp) => (
              <rect
                key={sp.key}
                className="roadmap-trail-speckle"
                x={sp.x}
                y={sp.y}
                width="2"
                height="2"
                fill={trail.speckle}
              />
            ))}
            {/* Sun-lit highlight stripe along the top edge */}
            <path
              d={trailD}
              stroke={trail.highlight}
              strokeWidth={trail.width * 0.25}
              strokeLinecap="round"
              fill="none"
              opacity="0.55"
              transform={`translate(0, -${trail.width * 0.18})`}
            />
          </g>

          {/* Dust motes — tiny upward-drifting particles for atmospheric depth. */}
          {motes.map((m) => (
            <circle
              key={m.key}
              className="roadmap-mote"
              cx={m.x}
              cy={m.y}
              r="0.9"
              fill="#F4EFE3"
              style={{
                animationDuration: `${m.dur}s`,
                animationDelay: `${m.delay}s`,
              }}
            />
          ))}

          {/* Grass tufts — small blades clustered around each node base. */}
          {grass.map((g) => (
            <rect
              key={g.key}
              x={g.x}
              y={g.y - g.h}
              width={g.w}
              height={g.h}
              fill={grassColor}
              opacity="0.72"
            />
          ))}

          {/* Connector lines for lab side-quests — dashed branch off the main
              trail, recolored to match the per-scene grass/foliage edge. */}
          {nodes.map((n, i) =>
            n.isSide ? (
              <line
                key={`c${i}`}
                x1={n.mainX}
                y1={n.mainY}
                x2={n.x}
                y2={n.y}
                stroke={trail.edge}
                strokeWidth="2.5"
                strokeDasharray="3 4"
                opacity="0.85"
              />
            ) : null
          )}

          {/* Section labels (optional polish) + checkpoint lantern marker for
              every section AFTER the first — sits opposite the trail node. */}
          {sections.map((sec, sIdx) => {
            const idx = sectionStartIdx.get(sec.name) || 0;
            const n = nodes[idx];
            if (!n) return null;
            // Tuck label on the opposite side of the trail from the node.
            const labelX = n.onLeft ? n.mainX + 24 : n.mainX - 24;
            const anchor = n.onLeft ? 'start' : 'end';
            const labelY = n.mainY - 22;
            // Lantern offset to the FAR side of the canvas, opposite the node.
            const lanternX = n.onLeft ? W - 28 : 28;
            const lanternY = n.mainY;
            return (
              <g key={`sec-${sec.name}`}>
                {sIdx > 0 ? (
                  <g opacity="0.85" pointerEvents="none">
                    {/* Stick */}
                    <rect
                      x={lanternX - 0.5}
                      y={lanternY - 14}
                      width="1"
                      height="14"
                      fill="#4D4639"
                    />
                    {/* Lantern body */}
                    <rect
                      x={lanternX - 3}
                      y={lanternY - 20}
                      width="6"
                      height="6"
                      rx="1"
                      fill={scene.snowCap}
                      opacity="0.85"
                    />
                    {/* Glow */}
                    <circle
                      cx={lanternX}
                      cy={lanternY - 17}
                      r="5"
                      fill="#F5B842"
                      opacity="0.18"
                      className="roadmap-lantern-glow"
                    />
                  </g>
                ) : null}
                <text
                  x={labelX}
                  y={labelY}
                  fontFamily="JetBrains Mono, ui-monospace, monospace"
                  fontSize="6.5"
                  letterSpacing="0.12em"
                  textAnchor={anchor}
                  fill="#F4EFE3"
                  opacity="0.55"
                  style={{ paintOrder: 'stroke', stroke: '#0B0A08', strokeWidth: 2 }}
                >
                  {sec.name}
                </text>
              </g>
            );
          })}

          {/* Fireflies — render BENEATH nodes so the nodes stay crisp. */}
          {fireflies.map((f) => (
            <circle
              key={f.key}
              className="roadmap-firefly"
              cx={f.x}
              cy={f.y}
              r="1.2"
              fill="var(--accent-amber)"
              style={{
                animationDuration: `${f.dur}s`,
                animationDelay: `${f.delay}s`,
              }}
            />
          ))}

    </>
  );
});

// ─── Node renderers ──────────────────────────────────────────────────────────
function ConceptNode({ n, done, isCurrent }) {
  // Done = filled amber + outline ring.
  // Current = filled amber + outer halo (drawn above) + crisp ring.
  // Upcoming = dark fill with grey ring.
  if (done || isCurrent) {
    return (
      <>
        <circle cx={n.x} cy={n.y} r="11" fill="#F5B842" stroke="#FFE8B0" strokeWidth="2" />
        {done ? (
          <text
            x={n.x}
            y={n.y + 4}
            fontFamily="JetBrains Mono, ui-monospace, monospace"
            fontSize="11"
            fontWeight="700"
            textAnchor="middle"
            fill="#0B0A08"
          >
            ✓
          </text>
        ) : (
          <text
            x={n.x}
            y={n.y + 4}
            fontFamily="JetBrains Mono, ui-monospace, monospace"
            fontSize="11"
            fontWeight="700"
            textAnchor="middle"
            fill="#0B0A08"
          >
            ▶
          </text>
        )}
      </>
    );
  }
  // Upcoming
  return (
    <circle
      cx={n.x}
      cy={n.y}
      r="10"
      fill="#17140F"
      stroke="#4D4639"
      strokeWidth="2"
      opacity="0.95"
    />
  );
}

function SdNode({ n, done }) {
  // Diamond (rotated square) — blue-tinted.
  const r = 8;
  const pts = `${n.x},${n.y - r} ${n.x + r},${n.y} ${n.x},${n.y + r} ${n.x - r},${n.y}`;
  const fill = done ? '#7B9FB5' : 'rgba(123,159,181,.18)';
  return (
    <>
      <polygon points={pts} fill={fill} stroke="#7B9FB5" strokeWidth="2" />
      {done ? (
        <text
          x={n.x}
          y={n.y + 3}
          fontFamily="JetBrains Mono, ui-monospace, monospace"
          fontSize="9"
          fontWeight="700"
          textAnchor="middle"
          fill="#0B0A08"
        >
          ◇
        </text>
      ) : null}
    </>
  );
}

function LabNode({ n, done, unlocked }) {
  // Hexagon. Amber outline. Unlocked = filled amber. Locked = grey.
  const r = 12;
  const pts = [
    [n.x + r, n.y],
    [n.x + r / 2, n.y + (r * 0.866)],
    [n.x - r / 2, n.y + (r * 0.866)],
    [n.x - r, n.y],
    [n.x - r / 2, n.y - (r * 0.866)],
    [n.x + r / 2, n.y - (r * 0.866)],
  ]
    .map((p) => p.join(','))
    .join(' ');

  const fill = done ? '#F5B842' : unlocked ? '#F5B842' : '#1D1A14';
  const stroke = unlocked ? '#F5B842' : '#4D4639';
  return (
    <>
      <polygon points={pts} fill={fill} stroke={stroke} strokeWidth="2" />
      {unlocked && !done ? (
        <text
          x={n.x}
          y={n.y + 3}
          fontFamily="JetBrains Mono, ui-monospace, monospace"
          fontSize="9"
          fontWeight="700"
          textAnchor="middle"
          fill="#0B0A08"
        >
          ⚒
        </text>
      ) : null}
      {done ? (
        <text
          x={n.x}
          y={n.y + 4}
          fontFamily="JetBrains Mono, ui-monospace, monospace"
          fontSize="11"
          fontWeight="700"
          textAnchor="middle"
          fill="#0B0A08"
        >
          ✓
        </text>
      ) : null}
    </>
  );
}

function Medal({ x, y, active, pathKey }) {
  return (
    <g className="roadmap-medal" style={{ pointerEvents: 'none' }}>
      <circle cx={x} cy={y} r="18" fill={active ? '#F5B842' : '#2A2620'} stroke={active ? '#FFE8B0' : '#4D4639'} strokeWidth="2" />
      {/* Halo uses the per-path radial gradient declared in <defs> — the old
          fill referenced a non-existent #halo-medal id, so the glow never
          rendered on path completion. */}
      {active ? <circle cx={x} cy={y} r="26" fill={`url(#halo-${pathKey})`} opacity="0.6" /> : null}
      <text
        x={x}
        y={y + 6}
        fontFamily="JetBrains Mono, ui-monospace, monospace"
        fontSize="16"
        fontWeight="700"
        textAnchor="middle"
        fill={active ? '#0B0A08' : '#5C574A'}
      >
        ★
      </text>
    </g>
  );
}

// ─── Story layer ─────────────────────────────────────────────────────────────
// The Null is un-remembering the world; each path is a PROVINCE the learner
// reclaims. Everything below is progress-dependent and renders in the DYNAMIC
// layer (never inside the memoized static scene).

// Lapse element → theme token (hex fallbacks match theme.css :root values so
// the eyes still glow if the SVG ever renders outside the themed DOM).
const ELEMENT_COLOR = {
  fire: 'var(--el-fire, #E07856)',
  water: 'var(--el-water, #7B9FB5)',
  earth: 'var(--el-earth, #8FA876)',
  sky: 'var(--el-sky, #B888C0)',
  mystic: 'var(--el-mystic, #F5B842)',
};

// Region title card above the scene: mono kicker, serif province name, italic
// epithet, one-line intro. Skipped entirely when the path has no lore entry.
function ProvinceBanner({ province, pathLabel }) {
  if (!province) return null;
  return (
    <div style={{ margin: '2px 2px 10px', minWidth: 0 }}>
      <div className="kicker" style={{ marginBottom: 3 }}>
        PROVINCE OF {pathLabel}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 21,
          fontWeight: 700,
          lineHeight: 1.15,
          color: 'var(--text-primary)',
          letterSpacing: '-0.01em',
        }}
      >
        {province.name}
      </div>
      {province.epithet ? (
        <div
          className="caption"
          style={{ fontStyle: 'italic', fontSize: 12.5, color: 'var(--text-secondary)' }}
        >
          {province.epithet}
        </div>
      ) : null}
      {province.intro ? (
        <div
          className="caption"
          style={{
            marginTop: 2,
            fontSize: 12,
            color: 'var(--text-secondary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {province.intro}
        </div>
      ) : null}
    </div>
  );
}

// Fog of the Null — a desaturating grey-blue wash over the un-walked stretch
// of trail BELOW the frontier (the first not-yet-completed node). Transparent
// at the frontier edge, ~75% opaque deep in the fog, with one slow-drifting
// mist band (SMIL, skipped under reduced motion). At 100% the fog is gone and
// a very light golden shimmer tints the whole scene instead. The entire group
// is pointer-events:none so frontier-edge node taps are never blocked.
function NullFog({ frontierY, H, allDone, reduced, pathKey }) {
  if (allDone) {
    return (
      <g pointerEvents="none" aria-hidden="true">
        <defs>
          <linearGradient id={`null-gold-${pathKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F5B842" stopOpacity="0.10" />
            <stop offset="45%" stopColor="#F5B842" stopOpacity="0.03" />
            <stop offset="100%" stopColor="#F5B842" stopOpacity="0.12" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width={W} height={H} fill={`url(#null-gold-${pathKey})`}>
          {!reduced ? (
            <animate attributeName="opacity" values="0.7;1;0.7" dur="6s" repeatCount="indefinite" />
          ) : null}
        </rect>
      </g>
    );
  }
  // Defensive: no frontier (0-node path) or degenerate geometry → no fog.
  if (!Number.isFinite(frontierY) || !Number.isFinite(H)) return null;
  // Start just below the frontier node's label so the "you are here" beat
  // stays crisp; the gradient is transparent at this edge anyway.
  const fogTop = Math.min(Math.max(frontierY + 24, 0), H);
  const fogH = H - fogTop;
  if (fogH <= 8) return null;
  const mistY = fogTop + fogH * 0.45;
  return (
    <g pointerEvents="none" aria-hidden="true">
      <defs>
        <linearGradient id={`null-fog-${pathKey}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8FA3B8" stopOpacity="0" />
          <stop offset="35%" stopColor="#76889E" stopOpacity="0.38" />
          <stop offset="70%" stopColor="#52647C" stopOpacity="0.62" />
          <stop offset="100%" stopColor="#39485E" stopOpacity="0.75" />
        </linearGradient>
      </defs>
      <rect x="0" y={fogTop} width={W} height={fogH} fill={`url(#null-fog-${pathKey})`} />
      {/* Drifting mist band — only when there's enough fog to drift through. */}
      {fogH > 70 ? (
        <rect x={-24} y={mistY} width={W + 48} height={26} rx={13} ry={13} fill="#AFC2D6" opacity="0.10">
          {!reduced ? (
            <animateTransform
              attributeName="transform"
              type="translate"
              values="-16 0; 16 0; -16 0"
              dur="18s"
              repeatCount="indefinite"
            />
          ) : null}
        </rect>
      ) : null}
    </g>
  );
}

// The province's haunting presence, deep in the fog near the trail's far end:
// two softly-glowing element-colored eyes (slow SMIL blink, reduced-motion
// gated) over a faint mono label. Once the path is fully reclaimed the eyes
// vanish and a gold "has fled" line takes their place.
function LapsePresence({ lapse, H, allDone, reduced }) {
  if (!lapse || !Number.isFinite(H)) return null;
  const cx = W / 2;
  const labelY = H - 62; // sits between the last node's label and the medal halo
  const labelFont = {
    fontFamily: 'JetBrains Mono, ui-monospace, monospace',
    fontSize: '7.5',
    letterSpacing: '0.14em',
    textAnchor: 'middle',
  };
  if (allDone) {
    return (
      <text x={cx} y={labelY} {...labelFont} fill="#F5B842" opacity="0.5" pointerEvents="none">
        {lapse.name.toUpperCase()} HAS FLED — FOR NOW
      </text>
    );
  }
  const eyeY = H - 78;
  const color = ELEMENT_COLOR[lapse.element] || ELEMENT_COLOR.mystic;
  const blink = !reduced ? (
    <animate
      attributeName="ry"
      values="2.4;2.4;0.25;2.4"
      keyTimes="0;0.88;0.94;1"
      dur="7s"
      repeatCount="indefinite"
    />
  ) : null;
  return (
    <g pointerEvents="none" aria-hidden="true">
      {/* Soft glow halos */}
      <ellipse cx={cx - 7} cy={eyeY} rx="4.5" ry="3.4" fill={color} opacity="0.14" />
      <ellipse cx={cx + 7} cy={eyeY} rx="4.5" ry="3.4" fill={color} opacity="0.14" />
      {/* The eyes — low-opacity element color, slow synchronized blink */}
      <ellipse cx={cx - 7} cy={eyeY} rx="2.1" ry="2.4" fill={color} opacity="0.55">
        {blink}
      </ellipse>
      <ellipse cx={cx + 7} cy={eyeY} rx="2.1" ry="2.4" fill={color} opacity="0.55">
        {blink}
      </ellipse>
      <text x={cx} y={labelY} {...labelFont} fill="#F4EFE3" opacity="0.35">
        {lapse.name.toUpperCase()} WAITS AT THE END
      </text>
    </g>
  );
}

// ─── Background geometry ─────────────────────────────────────────────────────
function buildFarMountains(H) {
  // Zigzag polygon at ~40-50% canvas height. Floor at H so the shape paints
  // down through the bottom of the scene (the closer layers will cover it).
  const baseY = H * 0.5;
  const pts = [`0,${H}`];
  const peaks = 7;
  for (let i = 0; i <= peaks; i++) {
    const x = (W / peaks) * i;
    const isPeak = i % 2 === 0;
    const y = isPeak ? baseY - 30 : baseY - 8;
    pts.push(`${x},${y}`);
  }
  pts.push(`${W},${H}`);
  return pts.join(' ');
}

function buildNearMountains(H) {
  // Smoother polygon at ~50-65% height. Two big lumps.
  const baseY = H * 0.62;
  const pts = [
    `0,${H}`,
    `0,${baseY}`,
    `${W * 0.18},${baseY - 28}`,
    `${W * 0.38},${baseY - 10}`,
    `${W * 0.55},${baseY - 40}`,
    `${W * 0.72},${baseY - 18}`,
    `${W * 0.88},${baseY - 32}`,
    `${W},${baseY - 6}`,
    `${W},${H}`,
  ];
  return pts.join(' ');
}

function buildHillsPath(H) {
  // Smooth curve from ~70% down to 100% — covers the foreground band.
  const baseY = H * 0.78;
  return [
    `M 0 ${H}`,
    `L 0 ${baseY}`,
    `Q ${W * 0.25} ${baseY - 18}, ${W * 0.5} ${baseY - 6}`,
    `T ${W} ${baseY - 10}`,
    `L ${W} ${H}`,
    'Z',
  ].join(' ');
}

// Small snow caps drawn over the FAR mountain peaks. Mirrors buildFarMountains
// math so they sit on top of the alternating peaks.
function SnowCaps({ color, H }) {
  const baseY = H * 0.5;
  const peaks = 7;
  const caps = [];
  for (let i = 0; i <= peaks; i++) {
    if (i % 2 !== 0) continue;
    const x = (W / peaks) * i;
    const y = baseY - 30;
    caps.push(
      <polygon
        key={`cap${i}`}
        points={`${x - 7},${y + 6} ${x},${y} ${x + 7},${y + 6}`}
        fill={color}
        opacity="0.75"
      />
    );
  }
  return <>{caps}</>;
}

function truncate(str, n) {
  if (!str) return '';
  if (str.length <= n) return str;
  return str.slice(0, n - 1) + '…';
}

function RoadmapPickers({ level, setLevel, setActivePath, pathKey, completed }) {
  const selectStyle = {
    width: '100%',
    background: 'var(--bg-elevated)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-default)',
    borderRadius: 8,
    padding: '10px 32px 10px 12px',
    fontFamily: 'inherit',
    fontSize: 'clamp(12px, 3vw, 14px)',
    fontWeight: 500,
    minHeight: 44,
    cursor: 'pointer',
    appearance: 'none',
    backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path d='M1 1l4 4 4-4' stroke='%23F5B842' stroke-width='1.5' fill='none' stroke-linecap='round'/></svg>\")",
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
  };
  return (
    <div className="card" style={{ marginBottom: 14 }}>
      <div className="row" style={{ gap: 10, alignItems: 'stretch' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="kicker" style={{ marginBottom: 6 }}>Skill level</div>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            style={selectStyle}
            aria-label="Skill level"
          >
            {LEVELS.map((lvl) => (
              <option key={lvl} value={lvl}>{LEVEL_LABEL[lvl]}</option>
            ))}
          </select>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="kicker" style={{ marginBottom: 6 }}>Career path</div>
          <select
            value={pathKey}
            onChange={(e) => setActivePath(e.target.value)}
            style={selectStyle}
            aria-label="Career path"
          >
            {PATH_KEYS.map((k) => {
              const p = PATHS[k];
              if (!p) return null;
              const pp = pathProgress(k, completed);
              return (
                <option key={k} value={k}>{p.icon} {p.name} · {Math.round(pp.pct * 100)}%</option>
              );
            })}
          </select>
        </div>
      </div>
    </div>
  );
}
