// Path Ascension — the full-screen "province reclaimed" cinematic that plays
// the first time a career path reaches its gold seal (100%). Creative brief:
// Cookie Run: Kingdom awakening trailer — dramatic, bouncy, golden, earned.
//
// Contract with the store (useStore.js): `pendingAscension` holds the pathKey
// while a cinematic is queued; `ascensionsSeen` already guarantees once-per-
// path at QUEUE time, so this component only ever needs to call
// `clearPendingAscension()` on dismiss.
//
// Four phases, ~8s total, all visuals are CSS keyframes (theme.css, .ascend-*):
//   0 Eclipse   (0–1.2s)  edges darken in, an amber spark ignites center
//   1 Sigil     (1.2–3s)  five-gem emblem ring draws on, godrays rotate behind
//   2 Awakening (3–5.5s)  the companion rises: silhouette → flash → full color
//   3 Title     (5.5s+)   province name drops in, gold seal stamps, Continue
//
// Phase progression is a single useEffect timer chain (absolute offsets, so a
// StrictMode mount→cleanup→mount replays it idempotently and every timeout is
// cleared). Tap/click anywhere or Escape skips to Phase 3 instantly: the
// `.ascend-skip` overlay class fast-forwards every one-shot `.ascend-enter`
// animation to its final frame while ambient loops (rays/embers) keep playing.
// Reduced motion (app setting OR OS preference, same dual gate as
// AnimatedDiagram) renders Phase 3 as a static card immediately — no timers,
// no particles, no rays.

import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store/useStore.js';
import { useFocusTrap } from '../hooks/useFocusTrap.js';
import { PROVINCES, FIVE_LAPSES } from '../data/lore.js';
import { PATHS } from '../data/content.js';
import { BEASTS, ELEMENTS } from '../data/beasts.js';
import BeastSprite, { loadManifest } from './BeastSprite.jsx';

// Dev-only manual trigger: `window.__ascend('devops')` queues the cinematic
// without grinding a path to 100%. `import.meta.env.DEV` is statically false
// in production builds, so the whole block is dead-code-eliminated there.
if (import.meta.env.DEV && typeof window !== 'undefined') {
  window.__ascend = (k) => useStore.setState({ pendingAscension: k });
}

// ── Phase machine ──────────────────────────────────────────────────────────
const PHASE_SIGIL = 1;
const PHASE_AWAKENING = 2;
const PHASE_TITLE = 3;
const PHASE_SCHEDULE = [
  [PHASE_SIGIL, 1200],
  [PHASE_AWAKENING, 3000],
  [PHASE_TITLE, 5500],
];

// ── Static geometry (module-level: deterministic, computed once) ──────────
const CX = 160;
const CY = 160;
const RING_R = 120;
const RING_C = Math.round(2 * Math.PI * RING_R); // ring circumference ≈ 754

// Twelve godray wedges (triangles from center), alternating long/short.
// They share one radial fade gradient so they read as light, not shapes.
const RAYS = Array.from({ length: 12 }, (_, i) => {
  const a = (i * 30 * Math.PI) / 180;
  const len = i % 2 === 0 ? 156 : 122;
  const hw = i % 2 === 0 ? 12 : 7; // half-width at the tip
  const tx = CX + Math.cos(a) * len;
  const ty = CY + Math.sin(a) * len;
  const nx = -Math.sin(a) * hw;
  const ny = Math.cos(a) * hw;
  return `${CX},${CY} ${(tx + nx).toFixed(1)},${(ty + ny).toFixed(1)} ${(tx - nx).toFixed(1)},${(ty - ny).toFixed(1)}`;
});

// Five elemental gems on the ring — same order and angles as the onboarding
// emblem (mystic crown at top, then fire/earth/sky/water clockwise).
const GEM_SPOTS = [
  { el: 'mystic', angle: -90 },
  { el: 'fire', angle: -18 },
  { el: 'earth', angle: 54 },
  { el: 'sky', angle: 126 },
  { el: 'water', angle: 198 },
].map(({ el, angle }, i) => {
  const a = (angle * Math.PI) / 180;
  return {
    el,
    x: +(CX + Math.cos(a) * RING_R).toFixed(1),
    y: +(CY + Math.sin(a) * RING_R).toFixed(1),
    delay: 0.8 + i * 0.16, // pop in clockwise after the ring draw catches up
  };
});

// Ember fountain — 14 spans on CSS keyframe arcs. Deterministic index math
// (the onboarding-embers trick) instead of Math.random() so a StrictMode
// remount renders the identical particle field.
const EMBERS = Array.from({ length: 14 }, (_, i) => ({
  dx: ((i % 7) - 3) * 26 + (i % 2 === 0 ? -9 : 9), // arc spread: ~±90px
  dy: -(120 + (i % 4) * 32),                       // rise: 120–216px
  size: 3 + (i % 3),
  dur: 1.6 + (i % 5) * 0.22,
  delay: ((i * 173) % 900) / 1000,
  hot: i % 2 === 0,                                // alternate gold / cream
}));

// ── Sigil (Phase 1 centerpiece) ────────────────────────────────────────────
function AscensionSigil({ icon, iconHidden }) {
  return (
    <svg
      className="ascend-sigil"
      viewBox="0 0 320 320"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="ascend-ray-fade" gradientUnits="userSpaceOnUse" cx={CX} cy={CY} r="160">
          <stop offset="0%" stopColor="#F5B842" stopOpacity="0.5" />
          <stop offset="38%" stopColor="#F5B842" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#F5B842" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Godrays: outer group fades in (one-shot), inner group rotates forever. */}
      <g className="ascend-rays-in ascend-enter">
        <g className="ascend-rays">
          {RAYS.map((pts, i) => (
            <polygon key={i} points={pts} fill="url(#ascend-ray-fade)" />
          ))}
        </g>
      </g>

      {/* Emblem ring: faint track underneath + stroke-dashoffset draw-on. */}
      <circle className="ascend-ring-under" cx={CX} cy={CY} r={RING_R} />
      <circle
        className="ascend-ring ascend-enter"
        cx={CX}
        cy={CY}
        r={RING_R}
        strokeDasharray={RING_C}
        strokeDashoffset={RING_C}
      />
      <circle className="ascend-ring-inner ascend-enter" cx={CX} cy={CY} r={RING_R - 14} />

      {/* Five elemental gems, popping in clockwise. */}
      {GEM_SPOTS.map((g) => (
        <g key={g.el} className="ascend-gem ascend-enter" style={{ animationDelay: `${g.delay}s` }}>
          <circle cx={g.x} cy={g.y} r="13" fill="#0B0A08" stroke={`var(--${ELEMENTS[g.el].cls})`} strokeWidth="1" />
          <polygon
            points={`${g.x},${g.y - 8} ${g.x + 7},${g.y - 2} ${g.x + 4},${g.y + 7} ${g.x - 4},${g.y + 7} ${g.x - 7},${g.y - 2}`}
            fill={`var(--${ELEMENTS[g.el].cls})`}
            stroke="#FFE8B0"
            strokeWidth="1"
          />
          <polygon
            points={`${g.x - 3},${g.y - 3} ${g.x + 3},${g.y - 3} ${g.x + 2},${g.y + 1} ${g.x - 2},${g.y + 1}`}
            fill="#FFE8B0"
            opacity="0.7"
          />
        </g>
      ))}

      {/* Path icon at the heart of the sigil; retires when the beast rises. */}
      <text
        className={`ascend-sigil-icon ascend-enter${iconHidden ? ' ascend-icon-out' : ''}`}
        x={CX}
        y={CY}
        textAnchor="middle"
        dominantBaseline="central"
      >
        {icon}
      </text>
    </svg>
  );
}

// ── The cinematic itself (mounted only while a pathKey is queued) ──────────
function AscensionCinematic({ pathKey }) {
  const clearPendingAscension = useStore((s) => s.clearPendingAscension);
  const companion = useStore((s) => s.companion);
  const reducedSetting = useStore((s) => s.settings.reducedMotion);
  // Dual gate, same pattern as AnimatedDiagram: in-app setting OR OS pref.
  const reduced = reducedSetting
    || (typeof window !== 'undefined' && window.matchMedia
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  const [phase, setPhase] = useState(0);
  const [skipped, setSkipped] = useState(false);
  const shown = reduced || skipped ? PHASE_TITLE : phase;

  // Single timer chain. Absolute offsets from mount: a StrictMode
  // mount→cleanup→remount clears all three and schedules them again, and
  // setPhase writes absolute values, so replay is idempotent. Flipping
  // `skipped` runs the cleanup (cancelling the chain) and bails early.
  useEffect(() => {
    if (reduced || skipped) return undefined;
    const timers = PHASE_SCHEDULE.map(([p, at]) => setTimeout(() => setPhase(p), at));
    return () => { for (const t of timers) clearTimeout(t); };
  }, [reduced, skipped]);

  // Escape = skip to the title phase. Capture + stopImmediatePropagation so
  // the chord nav / other global key handlers don't also act on it (same
  // capture-phase convention as useGlobalShortcuts in main.jsx).
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      e.stopImmediatePropagation();
      setSkipped(true);
    };
    window.addEventListener('keydown', onKey, { capture: true });
    return () => window.removeEventListener('keydown', onKey, { capture: true });
  }, []);

  // Tab stays inside the cinematic while it claims aria-modal (Escape-to-
  // skip is handled above at the capture phase).
  const trapRef = useRef(null);
  useFocusTrap(trapRef, {});

  const species = BEASTS[companion] ? companion : 'dragon';
  const beast = BEASTS[species];

  // Warm the tier-4 sprite while the eclipse plays, so the Phase-2 reveal
  // never pops a skeleton box on the first-ever view of this form.
  useEffect(() => {
    let live = true;
    loadManifest()
      .then((m) => {
        const file = m?.[species]?.tiers?.['4'];
        if (live && file) {
          const img = new Image();
          img.src = `${import.meta.env.BASE_URL}beasts/${file}`.replace(/\/{2,}/g, '/').replace(':/', '://');
        }
      })
      .catch(() => {});
    return () => { live = false; };
  }, [species]);

  const path = PATHS[pathKey];
  if (!path) return null; // tampered/unknown key — nothing to celebrate

  const province = PROVINCES[pathKey];
  const provinceName = province?.name || `${path.name} Province`;
  const lapse = province?.lapse ? FIVE_LAPSES[province.lapse] : null;
  const tier4Form = beast.forms[3];
  const auraVar = ELEMENTS[beast.element]?.cls || 'el-mystic';
  const caption = `Gold Seal earned · ${tier4Form} stands ascendant · ${path.icon} ${path.name} 100%`;

  const titleBlock = (
    <>
      <div className="ascend-seal" aria-hidden="true">✦</div>
      <h1 className="ascend-title">{provinceName}</h1>
      <div className="ascend-reclaimed">— RECLAIMED —</div>
      <p className="ascend-caption">{caption}</p>
      <button
        type="button"
        className="btn btn-primary ascend-continue"
        autoFocus
        onClick={clearPendingAscension}
      >
        Continue →
      </button>
      {lapse && (
        <p className="ascend-foreshadow mono">{lapse.name} stirs in the dark…</p>
      )}
    </>
  );

  // Reduced motion: Phase 3 as a static card, immediately. No timers run
  // (the effect above bailed), no spark/rays/embers are even mounted.
  if (reduced) {
    return (
      <div
        ref={trapRef}
        className="ascend-overlay ascend-reduced"
        role="dialog"
        aria-modal="true"
        aria-label={`${provinceName} reclaimed — gold seal earned`}
      >
        <div className="ascend-card">
          <BeastSprite species={species} tier={4} size={120} />
          {titleBlock}
        </div>
      </div>
    );
  }

  const overlayCls = 'ascend-overlay'
    + (skipped ? ' ascend-skip' : '')
    + (shown < PHASE_TITLE ? ' ascend-skippable' : '');

  return (
    <div
      ref={trapRef}
      className={overlayCls}
      role="dialog"
      aria-modal="true"
      aria-label={`${provinceName} reclaimed — gold seal earned`}
      onClick={() => { if (shown < PHASE_TITLE) setSkipped(true); }}
    >
      {/* Phase 0 — Eclipse: vignette darkens the edges first, then blackout. */}
      <div className="ascend-vignette ascend-enter" aria-hidden="true" />
      <div className="ascend-blackout ascend-enter" aria-hidden="true" />
      {/* White blink synced to the beast's color burst (Phase 2). */}
      {shown >= PHASE_AWAKENING && <div className="ascend-flash ascend-enter" aria-hidden="true" />}

      <div className="ascend-column">
        <div className="ascend-stage" aria-hidden="true">
          <span className="ascend-spark" />
          {shown >= PHASE_SIGIL && (
            <AscensionSigil icon={path.icon} iconHidden={shown >= PHASE_AWAKENING} />
          )}
          {shown >= PHASE_AWAKENING && (
            <div className="ascend-beast-wrap">
              <div
                className="ascend-beast ascend-enter"
                style={{ ['--ascend-aura']: `var(--${auraVar})` }}
              >
                <BeastSprite species={species} tier={4} size={160} />
              </div>
              <div className="ascend-embers">
                {EMBERS.map((em, i) => (
                  <span
                    key={i}
                    className={`ascend-ember${em.hot ? ' ascend-ember-hot' : ''}`}
                    style={{
                      width: em.size,
                      height: em.size,
                      animationDuration: `${em.dur}s`,
                      animationDelay: `${em.delay}s`,
                      ['--ascend-dx']: `${em.dx}px`,
                      ['--ascend-dy']: `${em.dy}px`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Reserved from the start so the column doesn't jump when the
            title mounts at Phase 3. */}
        <div className="ascend-title-area">
          {shown >= PHASE_TITLE && titleBlock}
        </div>
      </div>
    </div>
  );
}

export default function PathAscension() {
  const pendingAscension = useStore((s) => s.pendingAscension);
  if (!pendingAscension) return null;
  // Keyed by pathKey so a back-to-back second gold (e.g. a big import)
  // restarts the whole phase machine from a clean mount.
  return <AscensionCinematic key={pendingAscension} pathKey={pendingAscension} />;
}
