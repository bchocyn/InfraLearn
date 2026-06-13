import { memo, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore.js';
import { PATHS, PATH_KEYS, groupedSections, labUnlockStatus, pathProgress } from '../data/content.js';
import { LEVELS, LEVEL_LABEL } from '../data/beasts.js';
import { PROVINCES, FIVE_LAPSES } from '../data/lore.js';
import BeastSprite, { nullBeastSrc } from '../components/BeastSprite.jsx';

// ─── The Adventure Map (v5) ───────────────────────────────────────────────────
// Serpentine SVG trail, now styled as a stage-road through province ruins
// (Cookie-Run world-map structure) under Elden Ring light: every node wears a
// chapter-stage number (2-4), section checkpoints are sites of grace that
// ignite as the learner reaches them, a golden guidance ray drifts from the
// current node toward the next, and the province's Lapse waits behind a fog
// gate at the trail's end — rendered with its actual Null Beast sprite.
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

// ─── PixelLab map props ──────────────────────────────────────────────────────
// Generated pixel-art scenery (scripts/generate-map-props.mjs) replaces the
// old hand-coded polygons: trees, rocks, ruins, the fog gate, grace shrines.
// One shared twilight set; per-path variety comes from which TREE each scene
// plants (palette-matched at generation time, no runtime filters needed).
const mapSrc = (k) =>
  `${import.meta.env.BASE_URL}map/${k}.png`.replace(/\/{2,}/g, '/').replace(':/', '://');

// Native pixel dimensions of each prop (render sizes derive from these so
// aspect ratios never squash).
const PROP_DIMS = {
  pine_a: [48, 64],
  pine_b: [40, 56],
  tree_dead: [48, 64],
  tree_crystal: [48, 64],
  rock_a: [32, 32],
  rock_b: [32, 32],
  bush: [32, 32],
  ruin_arch: [64, 64],
  ruin_pillar: [32, 56],
  fog_gate: [96, 112],
  fog_gate_broken: [96, 112],
  grace_lantern: [32, 48],
  grace_dark: [32, 48],
  signpost: [32, 48],
  // Gamified UI chips (PixelLab map objects, view: side) — stage buttons,
  // the SD gem, the lab hex, the path medal and the rating star. State
  // variants (locked/dim) come from CSS filter classes, not extra art.
  ui_node_amber: [32, 32],
  ui_node_dark: [32, 32],
  ui_gem: [32, 32],
  ui_hex: [32, 32],
  ui_medal: [48, 48],
  ui_star: [32, 32],
  // Ground decals — small PixelLab patches (transparent-cornered ovals) that
  // scatter across the ground for texture without any tiling seams.
  decal_moss: [40, 32],
  decal_flowers: [36, 32],
  decal_mushrooms: [32, 32],
  decal_leaves: [40, 32],
};

// Which tree species each province plants. Dark conifers for the green/cool
// scenes, gnarled dead wood for the grim ones, crystal growth for the ML
// observatories.
const SCENE_TREES = {
  fundamentals: 'pine_a',
  devops: 'tree_dead',
  mlops: 'tree_crystal',
  swe: 'pine_a',
  mleng: 'tree_crystal',
  faang: 'pine_b',
  fullstack: 'pine_b',
  cybersec: 'tree_dead',
};

// Which ground decals dress each province. Green/earthy provinces get the
// full nature set; the grim/tech ones stay sparse (just moss + leaves) so the
// flowers/mushrooms don't feel out of place.
const SCENE_DECALS = {
  fundamentals: ['decal_moss', 'decal_flowers', 'decal_mushrooms', 'decal_leaves'],
  devops: ['decal_moss', 'decal_leaves'],
  mlops: ['decal_moss'],
  swe: ['decal_moss', 'decal_flowers', 'decal_leaves'],
  mleng: ['decal_moss', 'decal_mushrooms', 'decal_leaves'],
  faang: ['decal_moss', 'decal_leaves'],
  fullstack: ['decal_moss', 'decal_flowers', 'decal_leaves'],
  cybersec: ['decal_moss'],
};

// Small <image> prop with a soft contact shadow at its feet — the grounding
// shadow is what sells the "standing in the world" depth read.
function MapProp({ k, x, y, w, pixelated = true, opacity = 1, decal = false }) {
  const dims = PROP_DIMS[k] || [32, 32];
  const h = (w * dims[1]) / dims[0];
  // Flat ground decals lie ON the ground: centered on (x,y), no standing
  // contact shadow. Standing props are bottom-anchored at (x,y) with a soft
  // ellipse shadow at their feet for the "in the world" depth read.
  if (decal) {
    return (
      <image
        href={mapSrc(k)}
        x={x - w / 2}
        y={y - h / 2}
        width={w}
        height={h}
        opacity={opacity * 0.9}
        pointerEvents="none"
        style={pixelated ? { imageRendering: 'pixelated' } : undefined}
      />
    );
  }
  return (
    <g pointerEvents="none" opacity={opacity}>
      <ellipse cx={x} cy={y} rx={w * 0.38} ry={w * 0.1} fill="#000" opacity="0.32" />
      <image
        href={mapSrc(k)}
        x={x - w / 2}
        y={y - h + w * 0.04}
        width={w}
        height={h}
        style={pixelated ? { imageRendering: 'pixelated' } : undefined}
      />
    </g>
  );
}

// Fixed horizon line (px from the top of the SVG). Sky + its decorations live
// above it; the ground gradient + scenery live below. A constant pixel (not an
// H-fraction) keeps the horizon stable no matter how long the province is.
const HORIZON = 168;

// Distant tree-line silhouette sitting on the horizon — a row of overlapping
// pine triangles for depth. Pure SVG (a backdrop, not a placed prop), tinted
// with the province's far-mountain color and ridden on the mid parallax layer.
function FarTreeline({ color }) {
  const rnd = mulberry32(0x7ee71);
  const pts = [`0,${HORIZON + 6}`];
  let x = 0;
  while (x <= W) {
    const tw = 14 + rnd() * 16;          // tree footprint width
    const th = 16 + rnd() * 18;          // tree height above the horizon
    pts.push(`${x},${HORIZON + 2}`);
    pts.push(`${x + tw / 2},${HORIZON + 2 - th}`);
    pts.push(`${x + tw},${HORIZON + 2}`);
    x += tw * 0.78;                       // overlap so the ridge reads as a mass
  }
  pts.push(`${W},${HORIZON + 6}`);
  return <polygon points={pts.join(' ')} fill={color} opacity="0.5" pointerEvents="none" />;
}

// Centered UI chip — like MapProp but anchored on its center (buttons sit ON
// the trail, not standing behind it) and with no contact shadow. State
// styling (locked, dim star socket) is a CSS class so one sprite covers all
// states and tests can assert on the class name.
function UiSprite({ k, x, y, w, className, opacity = 1 }) {
  const dims = PROP_DIMS[k] || [32, 32];
  const h = (w * dims[1]) / dims[0];
  return (
    <image
      href={mapSrc(k)}
      className={className}
      x={x - w / 2}
      y={y - h / 2}
      width={w}
      height={h}
      pointerEvents="none"
      opacity={opacity}
      style={{ imageRendering: 'pixelated' }}
    />
  );
}

// ─── Geometry helpers ────────────────────────────────────────────────────────
const W = 360;

// PixelLab pixel-art parallax backdrops for the per-province sky band
// (scripts/generate-roadmap-scenes.mjs). Paths listed here render the image
// over the procedural sky gradient; any path not listed keeps the gradient.
// The animated moon + parallax stars still draw on top of the image.
const ROADMAP_SCENE_IMG = new Set(['fundamentals']);
const roadmapSceneSrc = (k) =>
  `${import.meta.env.BASE_URL}roadmap-scenes/${k}.png`.replace(/\/{2,}/g, '/').replace(':/', '://');
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
  // Journey star tally for the active province — reference changes only on
  // journey writes (chapter completions), so this stays render-cheap.
  const journeyMap = useStore((st) => st.journey);
  // Per-lesson quiz misses → per-stage star ratings (CRK-style). Writes only
  // happen inside lessons, so this never re-renders the map mid-browse.
  const quizMisses = useStore((st) => st.quizMisses);
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

  // Section metadata for stage numbering + grace checkpoints. Stage labels
  // follow the world-map convention: section 2, 4th stage → "2-4".
  const sectionMeta = useMemo(() => {
    const secs = groupedSections(path);
    const meta = [];
    let acc = 0;
    secs.forEach((sec, sIdx) => {
      meta.push({ name: sec.name, startIdx: acc, count: sec.rows.length, sIdx });
      acc += sec.rows.length;
    });
    return meta;
  }, [pathKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const stageLabels = useMemo(() => {
    const labels = [];
    sectionMeta.forEach((sec) => {
      for (let k = 0; k < sec.count; k++) labels[sec.startIdx + k] = `${sec.sIdx + 1}-${k + 1}`;
    });
    return labels;
  }, [sectionMeta]);

  // Journey stars for this province (0–15), shown CRK-style next to progress.
  const provStars = journeyMap?.[pathKey]?.stars || 0;

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

  // Stage star rating for a completed lesson, derived from quiz misses:
  // clean run = 3★, a slip or two = 2★, more = 1★. Lessons without quizzes
  // rate a clean 3★ — same as CRK handing out full stars on easy stages.
  const starsFor = (lessonId) => {
    const missed = Object.keys(quizMisses?.[lessonId] || {}).length;
    return missed === 0 ? 3 : missed <= 2 ? 2 : 1;
  };

  // Camera-follow (Pokémon-overworld groundwork, POKEMON_DS_RESEARCH.md): keep
  // the walker in view both on a province switch AND whenever it advances a
  // stage (lesson completed), so the camera trails the character like the DS
  // overworld instead of only re-centering on tab change. The walker itself
  // already slides between nodes via a CSS transition; this scrolls to meet it.
  // Skipped near the trailhead — no point scrolling for stage 1-1.
  const sceneRef = useRef(null);
  useEffect(() => {
    const el = sceneRef.current;
    if (!el || typeof window === 'undefined' || currentIdx < 3) return;
    const rect = el.getBoundingClientRect();
    const target =
      rect.top + window.scrollY + rect.height * (walkerTopPct / 100) - window.innerHeight * 0.4;
    if (target > 0) window.scrollTo({ top: target, behavior: reduced ? 'auto' : 'smooth' });
  }, [pathKey, currentIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  // Parallax — the far (stars) and mid (clouds/moon) sky layers drift slower
  // than the trail while scrolling, faking camera depth. Writes one unitless
  // CSS var; the .roadmap-plx-* classes turn it into translateY at different
  // rates. rAF-throttled, passive, and skipped entirely under reduced motion.
  useEffect(() => {
    const el = sceneRef.current;
    if (!el || typeof window === 'undefined' || reduced) return undefined;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        el.style.setProperty('--plx', String(-el.getBoundingClientRect().top));
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [reduced]);

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
          onClick={() => nav('/journey')}
          title="Journey stars for this province"
          style={{
            background: 'rgba(245,184,66,.12)',
            color: 'var(--accent-amber)',
            fontSize: 10,
            padding: '4px 10px',
            cursor: 'pointer',
            marginRight: 6,
          }}
        >
          ✦ {provStars}/15
        </span>
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

      <div ref={sceneRef} className="roadmap-scene" style={{ aspectRatio: `${W} / ${H}` }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="xMidYMid meet"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
        >
          <RoadmapStaticScene pathKey={pathKey} nodes={nodes} H={H} />

          {/* Guidance of grace — a drifting golden mote-trail from the
              current node toward the next, pointing the way onward. */}
          {!allDone && nodes[currentIdx] && nodes[currentIdx + 1] ? (
            <GuidanceRay from={nodes[currentIdx]} to={nodes[currentIdx + 1]} reduced={reduced} />
          ) : null}

          {/* Sites of grace — section checkpoints that ignite once the
              learner reaches the section. Progress-dependent → dynamic. */}
          <GraceSites sectionMeta={sectionMeta} nodes={nodes} lessons={lessons} completed={completed} reduced={reduced} />

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

                {/* Stage stars — CRK-style fan above cleared stages. */}
                {done ? <StageStars x={n.x} y={n.y} count={starsFor(lesson.id)} /> : null}

                {/* Stage number — world-map "2-4" plate above the node.
                    Cleared stages push it up to clear the star fan. */}
                {stageLabels[i] ? (
                  <text
                    x={n.x}
                    y={n.y - (done ? 29 : kind === 'lab' ? 19 : 17)}
                    fontFamily="JetBrains Mono, ui-monospace, monospace"
                    fontSize="6.5"
                    letterSpacing="0.08em"
                    textAnchor="middle"
                    fill={done ? '#F5B842' : '#9A938A'}
                    opacity={done ? 0.9 : 0.6}
                    style={{ paintOrder: 'stroke', stroke: '#0B0A08', strokeWidth: 2 }}
                  >
                    {stageLabels[i]}
                  </text>
                ) : null}

                {/* "You are here" bubble on the current stage. */}
                {isCurrent ? (
                  <g className={reduced ? undefined : 'roadmap-bang-bob'} pointerEvents="none">
                    <circle cx={n.x} cy={n.y - 30} r="6.5" fill="#F4EFE3" stroke="#0B0A08" strokeWidth="1.5" />
                    <text
                      x={n.x}
                      y={n.y - 26.8}
                      fontFamily="JetBrains Mono, ui-monospace, monospace"
                      fontSize="9.5"
                      fontWeight="700"
                      textAnchor="middle"
                      fill="#C03A2E"
                    >
                      !
                    </text>
                  </g>
                ) : null}

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

  // Scenery prop scatter — PixelLab trees/rocks/bushes along the trail
  // margins, full canvas height. Size jitter doubles as a depth cue and the
  // painter's sort (by ground-line y) keeps nearer props drawn over farther
  // ones. Margin bands keep them clear of nodes, labels, and lab offshoots.
  const sceneProps = useMemo(() => {
    const rnd = mulberry32(hash(pathKey + 'props'));
    const tree = SCENE_TREES[pathKey] || 'pine_a';
    const decals = SCENE_DECALS[pathKey] || ['decal_moss'];
    // Standing scenery hugs the side margins so it never covers the trail or a
    // node label; flat ground decals scatter a little wider since they lie on
    // the ground and read as texture. All of it lives below the horizon.
    const top = HORIZON + 12;
    const span = Math.max(80, H - top - 60);
    const out = [];
    // Standing props (trees/rocks/bushes) — denser than before for a fuller
    // treeline along the route.
    const standing = [
      { k: tree, w: 30, n: 18 },
      { k: 'rock_a', w: 15, n: 9 },
      { k: 'bush', w: 13, n: 14 },
      { k: 'rock_b', w: 11, n: 7 },
      { k: 'ruin_pillar', w: 16, n: 2 },
    ];
    for (const { k, w, n } of standing) {
      for (let i = 0; i < n; i++) {
        const left = rnd() < 0.5;
        const x = left ? 7 + rnd() * 34 : W - 7 - rnd() * 34;
        const y = top + rnd() * span;
        const s = 0.7 + rnd() * 0.6;
        out.push({ k, x, y, w: w * s, key: `pr-${k}-${i}`, decal: false });
      }
    }
    // Ground decals — flat patches, smaller, allowed a bit closer to the trail.
    for (let i = 0; i < 18; i++) {
      const k = decals[Math.floor(rnd() * decals.length)];
      const left = rnd() < 0.5;
      const x = left ? 10 + rnd() * 52 : W - 10 - rnd() * 52;
      const y = top + rnd() * span;
      const s = 0.7 + rnd() * 0.5;
      out.push({ k, x, y, w: (PROP_DIMS[k]?.[0] || 36) * 0.5 * s, key: `dc-${i}`, decal: true });
    }
    return out.sort((a, b) => a.y - b.y);
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
        // Keep clouds in the sky band (above the horizon) so they never drift
        // over the ground.
        y: 12 + rnd() * (HORIZON - 40),
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

  // Horizon as a fraction of the (variable) canvas height, capped so very
  // short provinces still keep a sky band. The ground gradient is transparent
  // above this and opaque ground below, so the sky + stars read at the top
  // while the lower canvas is solid earth — no tiling, no seams.
  const hz = Math.min(0.5, HORIZON / H);

  return (
    <>
          <defs>
            <linearGradient id={`sky-${pathKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={scene.skyTop} />
              <stop offset="55%" stopColor={scene.skyMid} />
              <stop offset="100%" stopColor={scene.skyBot} />
            </linearGradient>
            {/* Ground: transparent through the sky band, then earth from the
                horizon down — hill at the horizon deepening to the darkest
                tree tone at the bottom for depth. */}
            <linearGradient id={`ground-${pathKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={scene.hill} stopOpacity="0" />
              <stop offset={`${(hz * 99).toFixed(2)}%`} stopColor={scene.hill} stopOpacity="0" />
              <stop offset={`${(hz * 100).toFixed(2)}%`} stopColor={scene.hill} stopOpacity="1" />
              <stop offset={`${(hz * 100 + (100 - hz * 100) * 0.5).toFixed(2)}%`} stopColor={scene.mountainsNear} />
              <stop offset="100%" stopColor={scene.tree} />
            </linearGradient>
            <radialGradient id={`halo-${pathKey}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#F5B842" stopOpacity="0.65" />
              <stop offset="60%" stopColor="#F5B842" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#F5B842" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Sky */}
          <rect x="0" y="0" width={W} height={H} fill={`url(#sky-${pathKey})`} />

          {/* PixelLab pixel-art landscape over the sky band (per province).
              Covers the gradient up to just past the horizon; the opaque ground
              gradient below + stars/moon above layer over it. */}
          {ROADMAP_SCENE_IMG.has(pathKey) && (
            <image
              href={roadmapSceneSrc(pathKey)}
              x="0"
              y="0"
              width={W}
              height={HORIZON + 12}
              preserveAspectRatio="none"
              style={{ imageRendering: 'pixelated' }}
            />
          )}

          {/* Stars — span the full canvas; bigger ones glow, ~20% twinkle.
              The group drifts at 0.18x scroll speed (parallax far layer). */}
          <g className="roadmap-plx-far">
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

          </g>

          {/* Drifting clouds — varied altitude, slow horizontal oscillation.
              Mid parallax layer (0.1x scroll). */}
          <g className="roadmap-plx-mid">
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

          {/* Moon — fixed in the sky band (above the horizon) so it never
              ends up buried under the ground on longer provinces. */}
          <circle cx={W * 0.82} cy={62} r="10" fill={scene.moon} opacity="0.95" />
          <circle cx={W * 0.82} cy={62} r="18" fill={scene.moon} opacity="0.15" />
          </g>

          {/* Light shafts — pale rays falling across the ruins from above. */}
          <polygon points={`${W * 0.52},0 ${W * 0.66},0 ${W * 0.38},${H * 0.2}`} fill={scene.moon} opacity="0.05" />
          <polygon points={`${W * 0.74},0 ${W * 0.86},0 ${W * 0.56},${H * 0.24}`} fill={scene.moon} opacity="0.035" />

          {/* Ground — clean per-province gradient (seam-free). It's transparent
              through the sky band (above the horizon) so the stars/moon still
              read up top, then opaque earth below. No tiling, no seams. */}
          <rect x="0" y="0" width={W} height={H} fill={`url(#ground-${pathKey})`} pointerEvents="none" />
          {/* Warm horizon glow + distant tree-line silhouette for depth. */}
          <rect x="0" y={HORIZON - 3} width={W} height="7" fill={scene.skyBot} opacity="0.3" pointerEvents="none" />
          <g className="roadmap-plx-mid"><FarTreeline color={scene.mountainsFar} /></g>

          {/* Scenery props — PixelLab trees, rocks, bushes (painter's order). */}
          {sceneProps.map((p) => (
            <MapProp key={p.key} k={p.k} x={p.x} y={p.y} w={p.w} decal={p.decal} />
          ))}

          {/* Trailhead signpost — the journey starts here. */}
          {nodes[0] ? (
            <MapProp
              k="signpost"
              x={nodes[0].onLeft ? nodes[0].mainX + 34 : nodes[0].mainX - 34}
              y={nodes[0].mainY + 14}
              w={20}
            />
          ) : null}

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

          {/* Section labels + ruined waymarker arches at section boundaries.
              The grace light that nests inside each ruin is progress-aware,
              so it renders in the DYNAMIC layer (GraceSites) at these same
              coordinates — the ruin is the shrine, the grace is its flame. */}
          {sections.map((sec, sIdx) => {
            const idx = sectionStartIdx.get(sec.name) || 0;
            const n = nodes[idx];
            if (!n) return null;
            // Tuck label on the opposite side of the trail from the node.
            const labelX = n.onLeft ? n.mainX + 24 : n.mainX - 24;
            const anchor = n.onLeft ? 'start' : 'end';
            const labelY = n.mainY - 22;
            // Ruin offset to the FAR side of the canvas, opposite the node.
            const ruinX = n.onLeft ? W - 28 : 28;
            const ruinY = n.mainY;
            return (
              <g key={`sec-${sec.name}`}>
                {sIdx > 0 ? (
                  <Ruins x={ruinX} y={ruinY} />
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
// All nodes are drawn as chunky candy buttons (CRK-style): a darker "base"
// shape offset a few px down for depth, the face shape on top, and a pale
// arc along the upper edge as a baked-in specular highlight.

// Highlight arc across the top of a circular button face.
// All node chips below are PixelLab-drawn sprites (public/map/ui_*.png) with
// SVG <text> glyphs overlaid — glyphs stay vector so they render crisp at any
// zoom and never bake into the art.

function ConceptNode({ n, done, isCurrent }) {
  // Done = amber candy button with ✓. Current = same button with ▶.
  // Upcoming = dark recessed button.
  if (done || isCurrent) {
    return (
      <>
        <UiSprite k="ui_node_amber" x={n.x} y={n.y} w={30} />
        <text
          x={n.x}
          y={n.y + 3}
          fontFamily="JetBrains Mono, ui-monospace, monospace"
          fontSize="11"
          fontWeight="700"
          textAnchor="middle"
          fill="#0B0A08"
        >
          {done ? '✓' : '▶'}
        </text>
      </>
    );
  }
  // Upcoming
  return <UiSprite k="ui_node_dark" x={n.x} y={n.y} w={26} opacity={0.95} />;
}

function SdNode({ n, done }) {
  // Blue gem diamond — full luster once cleared, cold and dim before.
  return (
    <>
      <UiSprite k="ui_gem" x={n.x} y={n.y} w={22} className={done ? undefined : 'roadmap-ui-unlit'} />
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
  // Amber hex forge chip. Locked = greyed out via filter class.
  return (
    <>
      <UiSprite k="ui_hex" x={n.x} y={n.y} w={30} className={unlocked || done ? undefined : 'roadmap-ui-dim'} />
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
          y={n.y + 3}
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

// CRK-style star fan above a cleared stage: three small stars arced over the
// node, earned ones gold, the rest dim sockets — the "2/3 stars" itch that
// makes replaying (re-reading) a stage feel like polishing, not repeating.
function StageStars({ x, y, count }) {
  const slots = [
    { dx: -8.5, dy: -16, size: 9 },
    { dx: 0, dy: -19.5, size: 11 },
    { dx: 8.5, dy: -16, size: 9 },
  ];
  return (
    <g pointerEvents="none" aria-hidden="true">
      {slots.map((s, i) => (
        <UiSprite
          key={i}
          k="ui_star"
          x={x + s.dx}
          y={y + s.dy}
          w={s.size}
          className={i < count ? undefined : 'roadmap-star-socket'}
        />
      ))}
    </g>
  );
}

function Medal({ x, y, active, pathKey }) {
  return (
    <g className="roadmap-medal" style={{ pointerEvents: 'none' }}>
      {/* Halo uses the per-path radial gradient declared in <defs> — the old
          fill referenced a non-existent #halo-medal id, so the glow never
          rendered on path completion. */}
      {active ? <circle cx={x} cy={y} r="26" fill={`url(#halo-${pathKey})`} opacity="0.6" /> : null}
      <UiSprite k="ui_medal" x={x} y={y} w={40} className={active ? undefined : 'roadmap-ui-dim'} />
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

// The fog gate at the trail's far end — two ruined pillars with a pale veil
// stretched between them, and the province's Lapse looming behind it as its
// actual Null Beast sprite (dim, breathing in the mist, element-glow eyes
// behind). Once the path is fully reclaimed the veil is gone, the pillars
// stand broken, and a gold "has fled" line takes the monster's place.
function LapsePresence({ lapse, H, allDone, reduced }) {
  if (!lapse || !Number.isFinite(H)) return null;
  const cx = W / 2;
  const labelY = H - 62; // sits between the last node's label and the medal halo
  const gateBase = H - 70; // pillar feet — between the last node's label and the medal
  if (allDone) {
    return (
      <g pointerEvents="none" aria-hidden="true">
        {/* Shattered gate — pillar stubs and golden light on the rubble. */}
        <MapProp k="fog_gate_broken" x={cx} y={gateBase} w={64} opacity={0.9} />
        <text
          x={cx}
          y={labelY}
          fontFamily="JetBrains Mono, ui-monospace, monospace"
          fontSize="7.5"
          letterSpacing="0.14em"
          textAnchor="middle"
          fill="#F5B842"
          opacity="0.5"
        >
          {lapse.name.toUpperCase()} HAS FLED — FOR NOW
        </text>
      </g>
    );
  }
  const color = ELEMENT_COLOR[lapse.element] || ELEMENT_COLOR.mystic;
  const gateW = 72;
  const gateH = (gateW * 112) / 96; // 84 — native fog_gate aspect
  const spriteSize = 56;
  // The beast looms BEHIND the gate, head rising above the veil top — taller
  // than the door that holds it. Its lower body hides behind the mist.
  const spriteY = gateBase - gateH - 14;
  return (
    <g pointerEvents="none" aria-hidden="true">
      {/* Element-glow aura behind the beast. */}
      <ellipse cx={cx} cy={spriteY + spriteSize / 2} rx="32" ry="24" fill={color} opacity="0.14" />
      {/* The Lapse itself — its Null Beast sprite, dim in the fog. */}
      <image
        href={nullBeastSrc(lapse.id)}
        x={cx - spriteSize / 2}
        y={spriteY}
        width={spriteSize}
        height={spriteSize}
        opacity="0.55"
        style={{ imageRendering: 'pixelated' }}
      >
        {!reduced ? (
          <animate attributeName="opacity" values="0.4;0.6;0.4" dur="5s" repeatCount="indefinite" />
        ) : null}
      </image>
      {/* Fog gate — PixelLab pillars + misted veil, breathing slowly. */}
      <image
        href={mapSrc('fog_gate')}
        x={cx - gateW / 2}
        y={gateBase - gateH}
        width={gateW}
        height={gateH}
        opacity="0.92"
        style={{ imageRendering: 'pixelated' }}
      >
        {!reduced ? (
          <animate attributeName="opacity" values="0.84;0.96;0.84" dur="7s" repeatCount="indefinite" />
        ) : null}
      </image>
      <text
        x={cx}
        y={labelY}
        fontFamily="JetBrains Mono, ui-monospace, monospace"
        fontSize="7.5"
        letterSpacing="0.14em"
        textAnchor="middle"
        fill="#F4EFE3"
        opacity="0.35"
      >
        {lapse.name.toUpperCase()} WAITS BEYOND THE FOG
      </text>
    </g>
  );
}

// ─── Ruined waymarker (static) ──────────────────────────────────────────────
// A PixelLab ruined arch at each section boundary — the shrine the section's
// grace light (dynamic layer) nests beside.
function Ruins({ x, y }) {
  return <MapProp k="ruin_arch" x={x} y={y + 4} w={42} opacity={0.95} />;
}

// ─── Sites of grace (dynamic) ───────────────────────────────────────────────
// One grace light per section boundary, nested in that section's ruin. Lit
// gold with rising wisps once any lesson in the section is complete; until
// then a faint, colorless spark — grace not yet found.
function GraceSites({ sectionMeta, nodes, lessons, completed, reduced }) {
  return (
    <g pointerEvents="none" aria-hidden="true">
      {sectionMeta.map((sec) => {
        if (sec.sIdx === 0) return null;
        const n = nodes[sec.startIdx];
        if (!n) return null;
        const gx = n.onLeft ? W - 28 : 28;
        const gy = n.mainY - 8;
        const lit = lessons
          .slice(sec.startIdx, sec.startIdx + sec.count)
          .some((l) => completed[l.id]);
        if (!lit) {
          // Grace not yet found — the cold, unlit shrine in the arch doorway.
          return (
            <g key={`grace-${sec.name}`}>
              <MapProp k="grace_dark" x={gx} y={gy + 12} w={13} opacity={0.85} />
            </g>
          );
        }
        return (
          <g key={`grace-${sec.name}`}>
            <circle
              className={reduced ? undefined : 'roadmap-lantern-glow'}
              cx={gx}
              cy={gy}
              r="11"
              fill="#F5B842"
              opacity="0.22"
            />
            <MapProp k="grace_lantern" x={gx} y={gy + 12} w={13} />
            {/* Rising wisps */}
            {[-3.5, 0.5, 3].map((dx, i) => (
              <path
                key={i}
                className={reduced ? undefined : 'roadmap-grace-wisp'}
                d={`M ${gx + dx} ${gy - 8} q ${dx > 0 ? 2 : -2} -4 0 -8`}
                stroke="#F5B842"
                strokeWidth="0.8"
                fill="none"
                opacity="0.5"
                style={reduced ? undefined : { animationDelay: `${i * 0.9}s` }}
              />
            ))}
          </g>
        );
      })}
    </g>
  );
}

// ─── Guidance of grace (dynamic) ────────────────────────────────────────────
// A drifting trail of golden motes from the current stage toward the next —
// the road itself points the way onward.
function GuidanceRay({ from, to, reduced }) {
  return (
    <line
      x1={from.x}
      y1={from.y}
      x2={to.x}
      y2={to.y}
      stroke="#F5B842"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeDasharray="1 7"
      opacity="0.35"
      pointerEvents="none"
      aria-hidden="true"
    >
      {!reduced ? (
        <animate attributeName="stroke-dashoffset" from="0" to="-16" dur="1.8s" repeatCount="indefinite" />
      ) : null}
    </line>
  );
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
