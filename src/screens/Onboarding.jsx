import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../store/useStore.js';
import { BEASTS, SPECIES_KEYS } from '../data/beasts.js';
import { PATHS, PATH_KEYS } from '../data/content.js';
import { FIVE_LAPSES } from '../data/lore.js';
import BeastSprite from '../components/BeastSprite.jsx';
// The species grid + detail card are shared with the ByteBeast screen's
// companion switcher (same window, one source of truth).
import BeastPicker, { Starfield } from '../components/BeastPicker.jsx';
import { eggSrc } from '../data/eggs.js';

const TAGLINES = [
  'Zero to distinguished engineer.',
  'From command line to cluster.',
  'One concept a day, no formulas first.',
  'Pixel pets included.',
  'Built for late-night learners.',
];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [pick, setPick] = useState('dragon');
  // Default to the recommended beginner path — the old default was 'devops'
  // purely by accident of declaration order.
  const [pathPick, setPathPick] = useState('fundamentals');
  const [hatching, setHatching] = useState(false);

  const setNameStore = useStore((s) => s.setName);
  const chooseCompanion = useStore((s) => s.chooseCompanion);
  const setActivePath = useStore((s) => s.setActivePath);
  const finish = useStore((s) => s.finishOnboarding);
  const setSetting = useStore((s) => s.setSetting);
  const deviceMode = useStore((s) => s.settings.deviceMode);

  // Step indicator
  const totalSteps = 3;

  // ───── Device gate: before anything else, the user picks a layout.
  // Persists in settings, so this only appears on the very first run.
  if (!deviceMode) {
    return <DeviceStep onChoose={(m) => setSetting('deviceMode', m)} />;
  }

  // --- Step 0: welcome ---
  if (step === 0) return (
    <WelcomeStep
      name={name} setName={setName}
      onNext={() => { setNameStore(name.trim() || 'Keeper'); setStep(1); }}
      stepIdx={0} totalSteps={totalSteps}
    />
  );

  // --- Step 1: beast ---
  if (step === 1) return (
    <BeastStep
      pick={pick} setPick={setPick}
      onBack={() => setStep(0)}
      onNext={() => setStep(2)}
      stepIdx={1} totalSteps={totalSteps}
    />
  );

  // --- Step 2: path ---
  return (
    <PathStep
      pathPick={pathPick} setPathPick={setPathPick}
      onBack={() => setStep(1)}
      hatching={hatching}
      onHatch={() => {
        if (hatching) return;
        chooseCompanion(pick);
        setActivePath(pathPick);
        setHatching(true);
        setTimeout(() => finish(), 950);
      }}
      pickedBeast={pick}
      stepIdx={2} totalSteps={totalSteps}
    />
  );
}

/* ───────── Device gate ─────────
 * Shown ONCE before anything else. Picks layout mode:
 *   - 'mobile'  → phone-shaped 480px column (original look)
 *   - 'desktop' → full-window layout with a side nav rail
 * Auto-detected default uses window width but the user always confirms.
 */
function DeviceStep({ onChoose }) {
  const guess = typeof window !== 'undefined' && window.innerWidth >= 900 ? 'desktop' : 'mobile';
  return (
    <div className="ob-stage ob-stage-adventure ob-fade">
      <AdventureScene />
      <div className="screen ob-screen-overlay ob-screen-flex" style={{ paddingTop: 24, position: 'relative', zIndex: 2 }}>
        <div className="ob-welcome-content">
          <h1 className="h1 ob-title" style={{ textAlign: 'center', marginBottom: 8 }}>
            <span className="ob-title-mark">Where are you?</span><span className="dot">.</span>
          </h1>
          <p className="caption" style={{ textAlign: 'center', marginBottom: 22 }}>
            We'll scale the layout to your device. You can change this later in Settings.
          </p>

          <div className="ob-device-stack">
            <button
              className={`btn btn-primary btn-block ob-cta ob-device-btn${guess === 'mobile' ? ' is-suggested' : ''}`}
              onClick={() => onChoose('mobile')}
            >
              <span className="ob-device-btn-icon">📱</span>
              <span className="ob-device-btn-label">
                <span className="ob-device-btn-name">iPhone / Mobile</span>
                <span className="ob-device-btn-hint">Tap-first · single column</span>
              </span>
              <span className="ob-device-btn-arrow">→</span>
            </button>
            <button
              className={`btn btn-primary btn-block ob-cta ob-device-btn${guess === 'desktop' ? ' is-suggested' : ''}`}
              onClick={() => onChoose('desktop')}
            >
              <span className="ob-device-btn-icon">💻</span>
              <span className="ob-device-btn-label">
                <span className="ob-device-btn-name">Laptop / PC</span>
                <span className="ob-device-btn-hint">Side rail · fills the window</span>
              </span>
              <span className="ob-device-btn-arrow">→</span>
            </button>
          </div>

          <p className="caption" style={{ textAlign: 'center', marginTop: 18, fontSize: 11, opacity: 0.7 }}>
            We're guessing{' '}
            <strong style={{ color: 'var(--accent-amber)' }}>
              {guess === 'desktop' ? 'Laptop' : 'iPhone'}
            </strong>{' '}
            based on your window size — but you choose.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ───────── Shared chrome ───────── */
function ProgressDots({ stepIdx, total }) {
  return (
    <div className="row" style={{ gap: 6, marginBottom: 18 }}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} style={{
          height: 4, flex: 1, borderRadius: 2,
          background: i <= stepIdx ? 'var(--accent-amber)' : 'var(--border-default)',
          transition: 'background .35s ease',
        }} />
      ))}
    </div>
  );
}

// Starfield now lives in components/BeastPicker.jsx (shared with the
// ByteBeast companion switcher) and is imported above.

/*
 * AdventureScene — a fantasy landscape painted entirely in SVG.
 * Inspired by adventure-game key art: silhouette mountains, dark fortress
 * peak, snowy ridges, a living aurora, a flying dragon, a campfire with a
 * waiting companion, scattered pine trees, and twinkling stars. Sits behind
 * the welcome step content. Motion comes in two layers: the original CSS
 * classes (adv-star, adv-ember, adv-dragon — theme.css owns their
 * reduced-motion handling) and a SMIL layer (aurora, horizon sigils,
 * shooting star, emblem awakening, campfire) that is gated below — the
 * <animate*> elements are simply not rendered when motion is reduced, and
 * the static composition stays complete without them.
 */

// Element → tint, matching the ElementalEmblem gem palette exactly.
const ELEMENT_TINT = {
  mystic: '#F5B842',
  fire:   '#E07856',
  earth:  '#8FA876',
  sky:    '#B888C0',
  water:  '#7B9FB5',
};

// "The Five stir" — one faint sigil-glint per Lapse (see FIVE_LAPSES in
// lore.js), tucked into the sky gaps just above the far ridge line and
// painted behind the mountain layers. Foreshadowing, not focus. Slot 0 is
// the center of the horizon: Hollow Ink, the finale, gets it.
const SIGIL_SLOTS = [[200, 421], [30, 393], [295, 413], [105, 414], [372, 386]];
const HORIZON_SIGILS = Object.values(FIVE_LAPSES).map((l, i) => {
  const [x, y] = SIGIL_SLOTS[i % SIGIL_SLOTS.length];
  return { id: l.id, tint: ELEMENT_TINT[l.element] || '#F5B842', x, y };
});

// Aurora ribbon keyframes. SMIL interpolates `d` only between paths with an
// identical command structure, so every variant is exactly M Q T L Q T Z.
const AURORA_A = [
  'M-30 84Q75 40 195 66T430 50L430 80Q310 108 190 88T-30 118Z',
  'M-30 70Q75 52 195 56T430 64L430 94Q310 96 190 100T-30 104Z',
  'M-30 92Q75 34 195 72T430 42L430 72Q310 114 190 80T-30 124Z',
];
const AURORA_B = [
  'M-30 132Q90 100 210 118T430 104L430 126Q320 146 200 134T-30 158Z',
  'M-30 144Q90 112 210 104T430 118L430 142Q320 134 200 146T-30 148Z',
  'M-30 124Q90 94 210 128T430 96L430 120Q320 152 200 126T-30 168Z',
];

// Stars promoted to the "bright" tier — they get a 4-point cross-glint.
// Hand-picked indices into the stars array for spatial spread.
const BRIGHT_STAR_IDX = [3, 6, 12, 21, 24, 34];

function AdventureScene() {
  // On desktop, fill the wide window by slicing — and slide the emblem down
  // to roughly viewBox-vertical-center so it survives the crop.
  // On mobile, fit the whole scene with the original top-anchored layout.
  const deviceMode = useStore((s) => s.settings.deviceMode);
  const isDesktop = deviceMode === 'desktop';
  const preserveAspect = isDesktop ? 'xMidYMid slice' : 'xMidYMin meet';
  const emblemCy = isDesktop ? 480 : 250;

  // SMIL animations aren't covered by the CSS reduced-motion media query, so
  // (same pattern as MermaidFlow's data packets) we skip rendering every
  // <animate*> element when either the in-app setting or the OS asks for
  // reduced motion.
  const reducedSetting = useStore((s) => s.settings.reducedMotion);
  const animate = !(reducedSetting
    || (typeof window !== 'undefined' && window.matchMedia
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches));

  const stars = useMemo(
    () => Array.from({ length: 40 }, (_, i) => ({
      x: (i * 53 + 7) % 400,
      y: ((i * 31 + (i % 4) * 11) % 220),
      s: (i % 4 === 0) ? 2 : 1,
      d: ((i * 137) % 1000) / 1000 * 3.6,
    })),
    [],
  );
  const trees = useMemo(
    () => {
      const arr = [];
      // Foreground trees scattered along the bottom band, avoiding center
      const slots = [22, 50, 78, 110, 295, 330, 360, 388];
      slots.forEach((x, i) => {
        const tall = 22 + ((i * 13) % 10);
        const y = 555 + ((i * 17) % 16);
        arr.push({ x, y, h: tall });
      });
      return arr;
    },
    [],
  );

  return (
    <svg className="ob-adventure" viewBox="0 0 400 1000" preserveAspectRatio={preserveAspect} aria-hidden>
      <defs>
        <linearGradient id="adv-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stopColor="#0F0B2A" />
          <stop offset="45%" stopColor="#1F1A45" />
          <stop offset="80%" stopColor="#2E2858" />
          <stop offset="100%" stopColor="#3D3168" />
        </linearGradient>
        <linearGradient id="adv-aurora-a" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#7BE0C8" stopOpacity="0" />
          <stop offset="35%"  stopColor="#7BE0C8" stopOpacity=".55" />
          <stop offset="65%"  stopColor="#B888F0" stopOpacity=".45" />
          <stop offset="100%" stopColor="#F5B842" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="adv-aurora-b" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#F5B842" stopOpacity="0" />
          <stop offset="50%"  stopColor="#F5B842" stopOpacity=".35" />
          <stop offset="100%" stopColor="#E07856" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="adv-fire" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#FFE8B0" stopOpacity=".95" />
          <stop offset="40%"  stopColor="#F5A85E" stopOpacity=".75" />
          <stop offset="100%" stopColor="#E07856" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="adv-crystal" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#A8F5E0" stopOpacity=".95" />
          <stop offset="60%"  stopColor="#5ED8B8" stopOpacity=".4"  />
          <stop offset="100%" stopColor="#5ED8B8" stopOpacity="0"   />
        </radialGradient>
        <linearGradient id="adv-shoot" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#FFFFFF" stopOpacity="0"  />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity=".9" />
        </linearGradient>
        <radialGradient id="adv-vignette" cx="50%" cy="55%" r="75%">
          <stop offset="60%"  stopColor="#000000" stopOpacity="0"   />
          <stop offset="100%" stopColor="#000000" stopOpacity=".7"  />
        </radialGradient>
        <linearGradient id="adv-mist" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#08092A" stopOpacity="0"   />
          <stop offset="100%" stopColor="#08092A" stopOpacity=".95" />
        </linearGradient>
      </defs>

      {/* Sky */}
      <rect width="400" height="1000" fill="url(#adv-sky)" />

      {/* Living aurora — two translucent ribbons undulating across the upper sky */}
      {[
        [AURORA_A, 'a', '.6', '18s', '0s',  '.45;.7;.45',  '11s', '0s' ],
        [AURORA_B, 'b', '.5', '15s', '-6s', '.32;.55;.32', '13s', '-4s'],
      ].map(([fr, g, o, dDur, dBeg, oVal, oDur, oBeg]) => (
        <path key={g} d={fr[0]} fill={`url(#adv-aurora-${g})`} opacity={o}>
          {animate && (
            <animate attributeName="d" dur={dDur} begin={dBeg} repeatCount="indefinite"
              values={`${fr[0]};${fr[1]};${fr[2]};${fr[0]}`}
              calcMode="spline" keySplines=".4 0 .6 1;.4 0 .6 1;.4 0 .6 1" />
          )}
          {animate && (
            <animate attributeName="opacity" values={oVal} dur={oDur} begin={oBeg} repeatCount="indefinite" />
          )}
        </path>
      ))}

      {/* Stars */}
      {stars.map((s, i) => (
        <rect key={i} x={s.x} y={s.y} width={s.s} height={s.s} fill="#F4EFE3"
          className="adv-star" style={{ animationDelay: `${s.d}s` }} />
      ))}

      {/* Bright-tier stars — a 4-point cross-glint over a few field stars */}
      {BRIGHT_STAR_IDX.map((bi, k) => {
        const s = stars[bi];
        const gx = s.x + s.s / 2;
        const gy = s.y + s.s / 2;
        return (
          <g key={`bstar-${bi}`} opacity=".75">
            <rect x={gx - 3.4} y={gy - 0.4} width="6.8" height="0.8" rx="0.4" fill="#FFFFFF" />
            <rect x={gx - 0.4} y={gy - 3.4} width="0.8" height="6.8" rx="0.4" fill="#FFFFFF" />
            {animate && (
              <animate attributeName="opacity" values=".2;.9;.2" dur={`${3.4 + k * 0.6}s`}
                begin={`${-k * 1.3}s`} repeatCount="indefinite" />
            )}
          </g>
        );
      })}

      {/* Moon */}
      <circle cx="318" cy="118" r="22" fill="#F4EFE3" opacity=".92" />
      <circle cx="326" cy="112" r="18" fill="#1F1A45" opacity=".55" />
      {/* Craters on the lit crescent */}
      {[[310, 126, 3.2, '.5'], [316, 132, 2, '.4'], [305, 115, 2.4, '.45']].map(([mx, my, mr, mo]) => (
        <circle key={mx} cx={mx} cy={my} r={mr} fill="#CFC8B0" opacity={mo} />
      ))}

      {/* Shooting star — streaks the upper sky every ~9s, invisible between runs.
          (Rendered only when animating: a frozen streak would read as a scratch.) */}
      {animate && (
        <g opacity="0">
          <rect x="-30" y="-1" width="30" height="2" rx="1" fill="url(#adv-shoot)" />
          <circle cx="0" cy="0" r="1.8" fill="#FFFFFF" />
          <animateMotion path="M-40 36L470 118" dur="9s" repeatCount="indefinite"
            rotate="auto" calcMode="linear" keyPoints="0;1;1" keyTimes="0;.13;1" />
          <animate attributeName="opacity" values="0;.9;.9;0;0" keyTimes="0;.02;.09;.13;1"
            dur="9s" repeatCount="indefinite" />
        </g>
      )}

      {/* Dark menacing peaks (center back, behind the emblem) */}
      <polygon points="120,470 200,170 280,470" fill="#0A0820" />
      <polygon points="160,470 200,240 240,470" fill="#15102E" />

      {/* The Five stir — faint elemental sigil-glints along the far horizon,
          one per Lapse. Painted behind the emblem and the ridge layers so the
          mountains keep their silhouette; you only catch them on second look. */}
      {HORIZON_SIGILS.map((sg, i) => (
        <g key={sg.id} opacity=".15">
          <circle cx={sg.x} cy={sg.y} r="5.5" fill={sg.tint} opacity=".3" />
          <polygon
            points={`${sg.x},${sg.y - 4.5} ${sg.x + 2.6},${sg.y} ${sg.x},${sg.y + 4.5} ${sg.x - 2.6},${sg.y}`}
            fill={sg.tint} />
          {animate && (
            <animate attributeName="opacity" values=".07;.18;.07" dur={`${6 + i * 0.75}s`}
              begin={`${-i * 1.9}s`} repeatCount="indefinite" />
          )}
        </g>
      ))}

      {/* ───── Elemental Emblem (Cookie Run-inspired crest) ───── */}
      <ElementalEmblem cx={200} cy={emblemCy} r={62} animate={animate} />

      {/* Distant snowy mountain ridge */}
      <polygon points="0,470 50,360 100,430 150,370 200,430 250,360 300,430 360,380 400,430 400,540 0,540" fill="#2E3A5E" />
      {/* Snow caps */}
      <polygon points="40,378 50,360 60,378" fill="#D8E8F2" opacity=".9" />
      <polygon points="140,388 150,370 160,388" fill="#D8E8F2" opacity=".9" />
      <polygon points="240,378 250,360 260,378" fill="#D8E8F2" opacity=".9" />
      <polygon points="352,398 360,380 368,398" fill="#D8E8F2" opacity=".9" />

      {/* Closer mountain layer */}
      <polygon points="0,520 40,460 90,510 140,470 190,510 240,470 290,510 340,470 400,510 400,600 0,600" fill="#1E2548" />
      {/* Snow lines on closer ridge */}
      <polygon points="35,468 40,460 45,468" fill="#E8F0FA" opacity=".85" />
      <polygon points="135,478 140,470 145,478" fill="#E8F0FA" opacity=".85" />
      <polygon points="235,478 240,470 245,478" fill="#E8F0FA" opacity=".85" />
      <polygon points="335,478 340,470 345,478" fill="#E8F0FA" opacity=".85" />

      {/* Flying dragon silhouette (animated across the sky) */}
      <g className="adv-dragon">
        <g transform="translate(0,0)">
          {/* body */}
          <path d="M -18 0 Q -8 -3 4 0 Q 14 2 22 -1 L 18 4 L 8 4 L 0 8 L -10 4 Z" fill="#0A0820" />
          {/* wings */}
          <path d="M -4 -2 Q -14 -14 -28 -10 Q -18 -4 -8 -2 Z" fill="#150F30" />
          <path d="M 6 -2 Q 16 -14 30 -10 Q 20 -4 10 -2 Z" fill="#150F30" />
          {/* tail */}
          <path d="M -18 0 Q -28 4 -34 0 L -30 -2 Z" fill="#0A0820" />
        </g>
      </g>

      {/* Foreground hills */}
      <path d="M 0 560 Q 100 525 200 555 T 400 558 L 400 700 L 0 700 Z" fill="#0E1235" />
      <path d="M 0 600 Q 130 575 270 605 T 400 605 L 400 700 L 0 700 Z" fill="#08092A" />

      {/* Foreground pine trees */}
      {trees.map((t, i) => (
        <g key={i} transform={`translate(${t.x}, ${t.y})`}>
          <rect x={-1.5} y={0} width={3} height={t.h * 0.3} fill="#1A1208" />
          <polygon points={`0,${-t.h} ${-t.h * 0.45},0 ${t.h * 0.45},0`} fill="#0F2418" />
          <polygon points={`0,${-t.h * 0.65} ${-t.h * 0.32},${-t.h * 0.05} ${t.h * 0.32},${-t.h * 0.05}`} fill="#163A2A" />
          <polygon points={`0,${-t.h * 0.3}  ${-t.h * 0.22},${-t.h * 0.02} ${t.h * 0.22},${-t.h * 0.02}`} fill="#1E4838" />
        </g>
      ))}

      {/* ───── Extended foreground (y = 700..1000) ───── */}
      {/* Distant rear hill blending into the mountain band */}
      <path d="M 0 720 Q 100 690 200 715 T 400 720 L 400 1000 L 0 1000 Z" fill="#0E1235" />
      {/* Closer hill — deepest layer */}
      <path d="M 0 800 Q 130 770 270 805 T 400 800 L 400 1000 L 0 1000 Z" fill="#08092A" />

      {/* A subtle glowing path winding up toward the emblem */}
      <path d="M 200 1000 Q 195 920 205 840 Q 210 770 200 700" stroke="#F5B84230"
        strokeWidth="14" fill="none" strokeLinecap="round" />
      <path d="M 200 1000 Q 195 920 205 840 Q 210 770 200 700" stroke="#FFE8B055"
        strokeWidth="3" fill="none" strokeLinecap="round" strokeDasharray="4 8" />

      {/* Big foreground pine trees — the very front depth layer */}
      {[
        { x: 22,  y: 940, h: 78 },
        { x: 70,  y: 970, h: 60 },
        { x: 128, y: 955, h: 66 },
        { x: 175, y: 980, h: 50 },
        { x: 240, y: 980, h: 52 },
        { x: 290, y: 955, h: 70 },
        { x: 348, y: 970, h: 62 },
        { x: 392, y: 945, h: 75 },
      ].map((t, i) => (
        <g key={`fgtree-${i}`} transform={`translate(${t.x}, ${t.y})`}>
          <rect x={-2.2} y={0} width={4.4} height={t.h * 0.3} fill="#160E08" />
          <polygon points={`0,${-t.h} ${-t.h * 0.5},0 ${t.h * 0.5},0`} fill="#08180E" />
          <polygon points={`0,${-t.h * 0.65} ${-t.h * 0.36},${-t.h * 0.05} ${t.h * 0.36},${-t.h * 0.05}`} fill="#0F2E1E" />
          <polygon points={`0,${-t.h * 0.3}  ${-t.h * 0.24},${-t.h * 0.02} ${t.h * 0.24},${-t.h * 0.02}`} fill="#173E2A" />
        </g>
      ))}

      {/* Drifting mist along the very bottom */}
      <rect x="0" y="860" width="400" height="140" fill="url(#adv-mist)" />

      {/* ───── Campfire at the foot of the glowing path, plus the
             companion-to-be curled up in its light. Painted over the mist so
             the fire burns through it. ───── */}
      <g>
        {/* warm light pool */}
        <ellipse cx="252" cy="886" rx="42" ry="24" fill="url(#adv-fire)" opacity=".75">
          {animate && (
            <animate attributeName="opacity" values=".6;.85;.66;.8;.6" dur="2.6s" repeatCount="indefinite" />
          )}
        </ellipse>
        {/* crossed logs */}
        {[[14, '#2A1A10'], [-12, '#1C110A']].map(([rot, lf]) => (
          <rect key={lf} x="238" y="886" width="28" height="4.5" rx="2.2"
            fill={lf} transform={`rotate(${rot} 252 888)`} />
        ))}
        {/* flames — three layered tongues, bases pinned at the group origin
            so the SMIL scale flicker grows them upward only */}
        <g transform="translate(252 887)">
          {[
            ['M0 0C-7.5-3-6.5-13 0-21C6.5-13 7.5-3 0 0Z', '#E07856', '.9',  '1 1;1.08 .92;.95 1.07;1 1', '.85s', '0s'  ],
            ['M0 0C-5-2.5-4.5-9 0-14.5C4.5-9 5-2.5 0 0Z', '#F5A85E', '.95', '1 1;.93 1.09;1.07 .94;1 1', '.7s',  '-.25s'],
            ['M0 0C-2.6-1.5-2.4-5 0-8C2.4-5 2.6-1.5 0 0Z', '#FFE8B0', '1',  '1 1;.9 1.12;1.08 .9;1 1',   '.55s', '-.1s' ],
          ].map(([fd, ff, fo, fv, fdur, fb]) => (
            <path key={ff} d={fd} fill={ff} opacity={fo}>
              {animate && (
                <animateTransform attributeName="transform" type="scale"
                  values={fv} dur={fdur} begin={fb} repeatCount="indefinite" />
              )}
            </path>
          ))}
        </g>
        {/* spark motes riding the heat (ember palette) */}
        {animate && [[-5, '1.8s', '-.4s'], [4, '2.2s', '-1.2s'], [9, '2.6s', '-1.9s']].map(([dx, sdur, sbeg], i) => (
          <circle key={dx} cx={252 + dx} cy="876" r="1.1"
            fill={i % 2 === 0 ? '#FFE8B0' : '#F5B842'} opacity="0">
            <animate attributeName="cy" values="878;838" dur={sdur}
              begin={sbeg} repeatCount="indefinite" />
            <animate attributeName="opacity" values="0;.9;.9;0" keyTimes="0;.15;.55;1"
              dur={sdur} begin={sbeg} repeatCount="indefinite" />
          </circle>
        ))}
        {/* the companion waiting to be chosen — a curled-up silhouette with a
            sliver of firelight along its back */}
        <g opacity=".92">
          <ellipse cx="291" cy="886" rx="13" ry="8" fill="#0A0820">
            {animate && (
              <animate attributeName="ry" values="8;8.6;8" dur="3.4s" repeatCount="indefinite" />
            )}
          </ellipse>
          <circle cx="281" cy="881" r="5.5" fill="#0A0820" />
          <path d="M278 876.5 276 871.5 282 874.5Z" fill="#0A0820" />
          <path d="M302 888Q310 884 306 877" stroke="#0A0820" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M280 892Q289 896 299 891" stroke="#F5A85E" strokeWidth="1" fill="none" opacity=".4" strokeLinecap="round" />
        </g>
      </g>

      {/* Elden Ring-style embers drifting up from the bottom */}
      <g className="adv-embers">
        {Array.from({ length: 20 }, (_, i) => {
          const x = (i * 53 + 17) % 400;
          const delay = ((i * 173) % 1000) / 100;        // 0..10s
          const dur = 6 + (i % 6);                       // 6..11s
          const drift = ((i % 3) - 1) * 40;              // -40, 0, 40
          const r = 1 + (i % 3) * 0.6;
          return (
            <circle
              key={`em-${i}`}
              cx={x} cy={990} r={r}
              fill={i % 2 === 0 ? '#F5B842' : '#FFE8B0'}
              className="adv-ember"
              style={{
                animationDelay: `${delay}s`,
                animationDuration: `${dur}s`,
                ['--ember-drift']: `${drift}px`,
              }}
            />
          );
        })}
      </g>

      {/* Vignette to push focus toward the center text */}
      <rect width="400" height="1000" fill="url(#adv-vignette)" />
    </svg>
  );
}

/*
 * ElementalEmblem — a Cookie Run-style circular crest with crossed axes,
 * a chain rim, and five gems colored to match the app's element palette
 * (fire / water / earth / sky / mystic). The awakening pass (SMIL, rendered
 * only when `animate` is true): the chain ring alone turns at a stately
 * 40s/rev, the outer halo breathes, and a thin gleam sweeps the shield face
 * every ~12s, clipped to the shield circle.
 */
function ElementalEmblem({ cx, cy, r, animate }) {
  // 5 gems arranged like a pentagon (top, then clockwise).
  const gems = [
    { color: '#F5B842', glow: '#FFE8B0', angle: -90 },  // mystic — top
    { color: '#E07856', glow: '#FFB088', angle: -18 },  // fire
    { color: '#8FA876', glow: '#C8E0A8', angle: 54 },   // earth
    { color: '#B888C0', glow: '#E0B8E8', angle: 126 },  // sky
    { color: '#7B9FB5', glow: '#B0D0E0', angle: 198 },  // water
  ];
  const rad = (deg) => (deg * Math.PI) / 180;

  // Chain ring — 24 small links around the circumference.
  const chainLinks = Array.from({ length: 24 }, (_, i) => {
    const a = (i / 24) * Math.PI * 2;
    return { x: cx + Math.cos(a) * (r + 4), y: cy + Math.sin(a) * (r + 4), rot: (a * 180) / Math.PI };
  });

  // Gleam-sweep travel distance — far enough that the bar fully clears the
  // shield clip at both ends of its run.
  const sweep = r * 2 + 30;

  // Crossed axes — two diagonal weapon shapes behind the crest.
  // Axe = stylized: shaft as a thin rect + a leaf-shaped head at one end.
  return (
    <g className="adv-emblem">
      {/* Outer mystic halo — breathes when motion is allowed */}
      <g>
        {[[30, '18'], [16, '28']].map(([dr, ha]) => (
          <circle key={dr} cx={cx} cy={cy} r={r + dr} fill={`#F5B842${ha}`} />
        ))}
        {animate && (
          <animate attributeName="opacity" values=".6;1;.6" dur="5s" repeatCount="indefinite" />
        )}
      </g>

      {/* Crossed axes (behind shield) */}
      <g className="adv-emblem-axes">
        <AxeShape cx={cx} cy={cy} length={r + 38} rotate={45}  />
        <AxeShape cx={cx} cy={cy} length={r + 38} rotate={-45} />
      </g>

      {/* Shield base (dark with rim) */}
      <circle cx={cx} cy={cy} r={r}      fill="#1A1430" stroke="#3E3268" strokeWidth="2" />
      <circle cx={cx} cy={cy} r={r - 4}  fill="#0E0A22" />

      {/* Knot-pattern hint on the rim (decorative dashes) */}
      <circle cx={cx} cy={cy} r={r - 8} fill="none" stroke="#5E4E8A" strokeWidth="1"
        strokeDasharray="3 4" opacity=".6" />

      {/* Chain links around the rim — the only part that rotates, slow and
          stately, so the crest feels awake without getting busy */}
      <g>
        {animate && (
          <animateTransform attributeName="transform" type="rotate"
            from={`0 ${cx} ${cy}`} to={`360 ${cx} ${cy}`} dur="40s" repeatCount="indefinite" />
        )}
        {chainLinks.map((l, i) => (
          <ellipse key={i} cx={l.x} cy={l.y} rx="2.8" ry="1.6"
            transform={`rotate(${l.rot} ${l.x} ${l.y})`}
            fill="#8A8A9E" stroke="#3E3858" strokeWidth=".6" />
        ))}
      </g>

      {/* Five elemental gems */}
      {gems.map((g, i) => {
        const px = cx + Math.cos(rad(g.angle)) * (r - 24);
        const py = cy + Math.sin(rad(g.angle)) * (r - 24);
        return (
          <g key={i} className="adv-gem" style={{ animationDelay: `${i * 0.35}s` }}>
            <circle cx={px} cy={py} r="11" fill={`${g.color}40`} />
            <polygon
              points={`${px},${py-8} ${px+7},${py-2} ${px+4},${py+7} ${px-4},${py+7} ${px-7},${py-2}`}
              fill={g.color} stroke={g.glow} strokeWidth="1" />
            <polygon
              points={`${px-3},${py-3} ${px+3},${py-3} ${px+2},${py+1} ${px-2},${py+1}`}
              fill={g.glow} opacity=".75" />
          </g>
        );
      })}

      {/* Central rune — small star sigil */}
      <g className="adv-emblem-rune">
        <circle cx={cx} cy={cy} r="14" fill="#0A0820" stroke="#F5B842" strokeWidth="1.2" />
        <polygon
          points={`${cx},${cy-9} ${cx+2.5},${cy-2.5} ${cx+9},${cy-2} ${cx+4},${cy+2.5} ${cx+5.5},${cy+9} ${cx},${cy+5} ${cx-5.5},${cy+9} ${cx-4},${cy+2.5} ${cx-9},${cy-2} ${cx-2.5},${cy-2.5}`}
          fill="#F5B842" />
      </g>

      {/* Gleam sweep — a thin angled bar of light crossing the shield face
          every ~12s, clipped to the shield circle. The translate animates
          additively on top of the base rotate, so the bar travels along its
          own tilted axis. Skipped entirely when motion is reduced. */}
      {animate && (
        <g clipPath="url(#adv-shield-face)" opacity="0">
          <rect x={cx - 7} y={cy - r - 14} width="14" height={(r + 14) * 2} fill="#FFFFFF"
            transform={`rotate(28 ${cx} ${cy})`}>
            <animateTransform attributeName="transform" type="translate" additive="sum"
              values={`${-sweep} 0;${sweep} 0;${sweep} 0`}
              keyTimes="0;.09;1" dur="12s" repeatCount="indefinite" />
          </rect>
          <animate attributeName="opacity" values="0;.32;.32;0;0" keyTimes="0;.02;.07;.09;1"
            dur="12s" repeatCount="indefinite" />
        </g>
      )}
      <clipPath id="adv-shield-face">
        <circle cx={cx} cy={cy} r={r - 4} />
      </clipPath>
    </g>
  );
}

function AxeShape({ cx, cy, length, rotate }) {
  // Two heads (mirrored) on a single shaft to look like a crossed-axe / spear hybrid.
  // Drawn at origin then rotated/translated.
  const shaftW = 3;
  return (
    <g transform={`translate(${cx} ${cy}) rotate(${rotate})`}>
      {/* shaft */}
      <rect x={-length} y={-shaftW/2} width={length*2} height={shaftW} fill="#C0C4D0" />
      <rect x={-length} y={-shaftW/2} width={length*2} height={1} fill="#FFFFFF" opacity=".25" />
      {/* head A */}
      <path d={`M ${length-4} -3 L ${length+10} -14 L ${length+18} -2 L ${length+10} 14 L ${length-4} 3 Z`} fill="#D8DCE6" stroke="#6E7280" strokeWidth=".6" />
      {/* head B (mirrored) */}
      <path d={`M ${-length+4} -3 L ${-length-10} -14 L ${-length-18} -2 L ${-length-10} 14 L ${-length+4} 3 Z`} fill="#D8DCE6" stroke="#6E7280" strokeWidth=".6" />
      {/* pommel jewels */}
      <circle cx={length+18} cy={-2} r="2.2" fill="#F5B842" />
      <circle cx={-length-18} cy={-2} r="2.2" fill="#F5B842" />
    </g>
  );
}

/*
 * HeroEnsemble — five ByteBeasts arranged in a Cookie Run Kingdom-style
 * frieze across the lower half of the welcome scene. Each beast fades up
 * into place on load, then idles with a gentle float. The center "lead"
 * beast is largest and at the foreground; the flanks recede in z-order
 * and size to suggest depth.
 */
function HeroEnsemble() {
  // All beasts shown in their starting tier-1 form — a preview of what users
  // can hatch on step 1.
  const heroes = [
    { sp: 'griffin', tier: 1, size: 52,  x: 9,  y: 68, depth: 'back'  },
    { sp: 'unicorn', tier: 1, size: 56,  x: 22, y: 82, depth: 'front' },
    { sp: 'wyvern',  tier: 1, size: 84,  x: 50, y: 88, depth: 'lead'  },
    { sp: 'kraken',  tier: 1, size: 56,  x: 78, y: 82, depth: 'front' },
    { sp: 'phoenix', tier: 1, size: 52,  x: 91, y: 68, depth: 'back'  },
  ];
  return (
    <div className="ob-heroes" aria-hidden>
      {heroes.map((h, i) => (
        <div
          key={`${h.sp}-${i}`}
          className={`ob-hero ob-hero-${h.depth}`}
          style={{ left: `${h.x}%`, top: `${h.y}%`, ['--hero-delay']: `${0.2 + i * 0.16}s` }}
        >
          <div className="ob-hero-inner">
            <BeastSprite species={h.sp} tier={h.tier} size={h.size} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ───────── Step 0: Welcome ───────── */
function WelcomeStep({ name, setName, onNext, stepIdx, totalSteps }) {
  const [tagIdx, setTagIdx] = useState(0);
  const [peekIdx, setPeekIdx] = useState(0);
  const inputRef = useRef();

  useEffect(() => {
    const t = setInterval(() => setTagIdx((i) => (i + 1) % TAGLINES.length), 2800);
    const b = setInterval(() => setPeekIdx((i) => (i + 1) % SPECIES_KEYS.length), 1800);
    return () => { clearInterval(t); clearInterval(b); };
  }, []);

  useEffect(() => { inputRef.current?.focus(); }, []);

  return (
    <div className="ob-stage ob-stage-adventure ob-fade">
      <AdventureScene />
      <HeroEnsemble />
      <div className="screen ob-screen-overlay ob-screen-flex" style={{ paddingTop: 24, position: 'relative', zIndex: 2 }}>
        <ProgressDots stepIdx={stepIdx} total={totalSteps} />

        <div className="ob-welcome-content">
          <div className="row" style={{ alignItems: 'flex-start', marginBottom: 6 }}>
            <div style={{ flex: 1 }}>
              <h1 className="h1 ob-title">
                Welcome to <span className="ob-title-mark">InfraLearn</span><span className="dot">.</span>
              </h1>
              <p key={tagIdx} className="caption ob-tag">{TAGLINES[tagIdx]}</p>
            </div>
            <div className="ob-peek" key={peekIdx} aria-hidden>
              <BeastSprite species={SPECIES_KEYS[peekIdx]} tier={1} size={64} />
            </div>
          </div>

          <div className="kicker" style={{ margin: '22px 0 6px' }}>What should we call you? <span style={{ opacity: 0.6 }}>(optional)</span></div>
          {/* No required typing before the first dopamine hit — an empty
              name defaults to "Keeper" and Next is always live. Mandatory
              text entry was the very first interactive demand of the app. */}
          <input
            ref={inputRef}
            value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Keeper" className="ob-input"
            onKeyDown={(e) => { if (e.key === 'Enter') onNext(); }}
          />

          <button className="btn btn-primary btn-block ob-cta"
            onClick={onNext}>
            Next: choose your Byte Beast →
          </button>

          <p className="caption" style={{ marginTop: 14, fontSize: 11, opacity: 0.7 }}>
            Tip: press <span className="mono" style={{ color: 'var(--accent-amber)' }}>Enter</span>
            {' '}or <span className="mono" style={{ color: 'var(--accent-amber)' }}>Tap</span> to continue.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ───────── Step 1: Pick beast ───────── */
function BeastStep({ pick, setPick, onBack, onNext, stepIdx, totalSteps }) {
  return (
    <div className="ob-stage ob-fade">
      <Starfield density={24} />
      <div className="screen" style={{ paddingTop: 28, position: 'relative', zIndex: 1 }}>
        <ProgressDots stepIdx={stepIdx} total={totalSteps} />
        <h1 className="h2" style={{ marginBottom: 4 }}>Choose your Byte Beast<span style={{ color: 'var(--accent-amber)' }}>.</span></h1>
        <p className="caption" style={{ marginBottom: 14 }}>Each beast waits inside an egg — pick one, then hatch it. It evolves through four forms as you climb.</p>

        <BeastPicker pick={pick} setPick={setPick} egg />

        <div className="row" style={{ gap: 8, marginTop: 12 }}>
          <button className="btn btn-block" onClick={onBack}>← Back</button>
          <button className="btn btn-primary btn-block" onClick={onNext}>Next: pick your path →</button>
        </div>
      </div>
    </div>
  );
}

/* ───────── Step 2: Path + level ───────── */
function PathStep({ pathPick, setPathPick, onBack, onHatch, hatching, pickedBeast, stepIdx, totalSteps }) {
  const path = PATHS[pathPick];
  return (
    <div className="ob-stage ob-fade">
      <Starfield density={20} />
      <div className="screen" style={{ paddingTop: 28, position: 'relative', zIndex: 1 }}>
        <ProgressDots stepIdx={stepIdx} total={totalSteps} />
        <h1 className="h2" style={{ marginBottom: 4 }}>Choose your starting path<span style={{ color: 'var(--accent-amber)' }}>.</span></h1>
        <p className="caption" style={{ marginBottom: 14 }}>You can switch paths anytime — this just tunes your daily practice. You'll earn your rank as you go.</p>

        <div className="kicker" style={{ marginBottom: 8 }}>Career path</div>
        <div className="ob-path-grid">
          {PATH_KEYS.map((k) => {
            const p = PATHS[k];
            const active = pathPick === k;
            // Soft steer only — free choice stays (the locked ADHD on-ramp
            // decision bars hard gates), but a true beginner deserves ONE
            // marked door instead of eight equal ones.
            const recommended = k === 'fundamentals';
            return (
              <button key={k} onClick={() => setPathPick(k)} className={`ob-path-cell${active ? ' active' : ''}`}>
                <span className="ob-path-icon">{p.icon}</span>
                <span className="ob-path-meta">
                  <span className="ob-path-name">
                    {p.name}
                    {recommended && (
                      <span
                        className="mono"
                        style={{
                          marginLeft: 6, fontSize: 8, letterSpacing: '.08em',
                          color: 'var(--accent-amber)', border: '1px solid var(--accent-amber)',
                          borderRadius: 999, padding: '1px 5px', verticalAlign: 'middle',
                        }}
                      >
                        START HERE
                      </span>
                    )}
                  </span>
                  <span className="ob-path-count">{p.lessons.length} LESSONS</span>
                </span>
              </button>
            );
          })}
        </div>
        {PATHS[pathPick].desc && (
          <p className="caption" style={{ margin: '8px 2px 0' }}>{PATHS[pathPick].desc}</p>
        )}

        <div className="card ob-summary">
          <div className="row">
            <div className={`ob-summary-beast${hatching ? ' hatching' : ''}`}>
              {hatching
                ? <BeastSprite species={pickedBeast} tier={1} size={56} />
                : <img src={eggSrc(pickedBeast)} alt="" width={46} height={58} draggable={false} style={{ width: 46, height: 58, objectFit: 'contain', imageRendering: 'pixelated' }} />}
              {hatching && <span className="ob-sparkle">✦</span>}
              {hatching && (
                <div className="ob-confetti" aria-hidden>
                  {Array.from({ length: 10 }, (_, i) => {
                    const colors = ['#F5B842', '#FFE8B0', '#E07856', '#B888C0', '#7B9FB5'];
                    return (
                      <span
                        key={i}
                        className="ob-confetti-piece"
                        style={{
                          '--confetti-angle': `${i * 36}deg`,
                          '--confetti-color': colors[i % colors.length],
                        }}
                      />
                    );
                  })}
                </div>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div className="mono" style={{ fontSize: 9, color: 'var(--text-tertiary)', letterSpacing: '.1em' }}>STARTING LOADOUT</div>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 14, fontWeight: 600, marginTop: 4 }}>
                {BEASTS[pickedBeast].name} · {path.icon} {path.name}
              </div>
            </div>
          </div>
        </div>

        <div className="row" style={{ gap: 8, marginTop: 12 }}>
          <button className="btn btn-block" disabled={hatching} onClick={onBack}>← Back</button>
          <button className="btn btn-primary btn-block ob-cta" disabled={hatching} onClick={onHatch}>
            {hatching ? '✦ Hatching...' : 'Hatch & begin →'}
          </button>
        </div>
      </div>
    </div>
  );
}
