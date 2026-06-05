import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../store/useStore.js';
import { BEASTS, SPECIES_KEYS, ELEMENTS, LEVELS, LEVEL_LABEL } from '../data/beasts.js';
import { PATHS, PATH_KEYS } from '../data/content.js';
import BeastSprite from '../components/BeastSprite.jsx';

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
  const [pathPick, setPathPick] = useState('devops');
  const [levelPick, setLevelPick] = useState('novice');
  const [hatching, setHatching] = useState(false);

  const setNameStore = useStore((s) => s.setName);
  const chooseCompanion = useStore((s) => s.chooseCompanion);
  const setActivePath = useStore((s) => s.setActivePath);
  const setLevel = useStore((s) => s.setLevel);
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
      onNext={() => { setNameStore(name.trim()); setStep(1); }}
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

  // --- Step 2: path + level ---
  return (
    <PathLevelStep
      pathPick={pathPick} setPathPick={setPathPick}
      levelPick={levelPick} setLevelPick={setLevelPick}
      onBack={() => setStep(1)}
      hatching={hatching}
      onHatch={() => {
        if (hatching) return;
        chooseCompanion(pick);
        setActivePath(pathPick);
        setLevel(levelPick);
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

function DevicePhonePreview() {
  // Tiny SVG mock of a phone with a centered column of dots and a bottom tab bar.
  return (
    <svg className="ob-device-icon" viewBox="0 0 80 110" aria-hidden>
      <rect x="14" y="6"  width="52" height="98" rx="8" fill="none" stroke="currentColor" strokeWidth="2" />
      <rect x="14" y="6"  width="52" height="10" fill="currentColor" opacity=".15" />
      <rect x="14" y="92" width="52" height="12" fill="currentColor" opacity=".2"  />
      <circle cx="22" cy="98" r="2" fill="currentColor" />
      <circle cx="32" cy="98" r="2" fill="currentColor" />
      <circle cx="42" cy="98" r="2" fill="currentColor" />
      <circle cx="52" cy="98" r="2" fill="currentColor" />
      <circle cx="62" cy="98" r="2" fill="currentColor" />
      <rect x="20" y="22" width="40" height="6" rx="2" fill="currentColor" opacity=".35" />
      <rect x="20" y="34" width="40" height="14" rx="3" fill="currentColor" opacity=".25" />
      <rect x="20" y="54" width="40" height="14" rx="3" fill="currentColor" opacity=".25" />
      <rect x="20" y="74" width="40" height="12" rx="3" fill="currentColor" opacity=".25" />
    </svg>
  );
}

function DeviceLaptopPreview() {
  // Tiny SVG mock of a laptop with a left side rail and a content grid.
  return (
    <svg className="ob-device-icon" viewBox="0 0 110 80" aria-hidden>
      <rect x="6" y="6" width="98" height="60" rx="3" fill="none" stroke="currentColor" strokeWidth="2" />
      <rect x="2" y="66" width="106" height="6" rx="2" fill="currentColor" opacity=".25" />
      {/* side rail */}
      <rect x="10" y="10" width="22" height="52" fill="currentColor" opacity=".18" />
      <rect x="14" y="16" width="14" height="3" fill="currentColor" opacity=".4" />
      <rect x="14" y="24" width="14" height="3" fill="currentColor" opacity=".35" />
      <rect x="14" y="32" width="14" height="3" fill="currentColor" opacity=".35" />
      <rect x="14" y="40" width="14" height="3" fill="currentColor" opacity=".35" />
      {/* content grid */}
      <rect x="36" y="14" width="22" height="14" rx="2" fill="currentColor" opacity=".3" />
      <rect x="62" y="14" width="22" height="14" rx="2" fill="currentColor" opacity=".3" />
      <rect x="88" y="14" width="14" height="14" rx="2" fill="currentColor" opacity=".3" />
      <rect x="36" y="32" width="22" height="14" rx="2" fill="currentColor" opacity=".3" />
      <rect x="62" y="32" width="40" height="14" rx="2" fill="currentColor" opacity=".3" />
      <rect x="36" y="50" width="66" height="10" rx="2" fill="currentColor" opacity=".25" />
    </svg>
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

function Starfield({ density = 38 }) {
  // Static deterministic starfield so it doesn't reshuffle on each render
  const stars = useMemo(() => Array.from({ length: density }, (_, i) => ({
    x: (i * 73) % 100,
    y: (i * 41 + (i % 5) * 7) % 100,
    s: (i % 3) + 1,
    d: (i % 7) * 0.3,
  })), [density]);
  return (
    <div className="ob-starfield" aria-hidden>
      {stars.map((p, i) => (
        <span key={i} className="ob-star" style={{
          left: `${p.x}%`, top: `${p.y}%`, width: p.s, height: p.s, animationDelay: `${p.d}s`,
        }} />
      ))}
    </div>
  );
}

/*
 * AdventureScene — a fantasy landscape painted entirely in SVG.
 * Inspired by adventure-game key art: silhouette mountains, dark fortress
 * peak, snowy ridges, aurora, a flying dragon, a campfire, a magic crystal,
 * scattered pine trees, and twinkling stars. Sits behind the welcome step
 * content. All motion is CSS-driven and respects prefers-reduced-motion.
 */
function AdventureScene() {
  // On desktop, fill the wide window by slicing — and slide the emblem down
  // to roughly viewBox-vertical-center so it survives the crop.
  // On mobile, fit the whole scene with the original top-anchored layout.
  const deviceMode = useStore((s) => s.settings.deviceMode);
  const isDesktop = deviceMode === 'desktop';
  const preserveAspect = isDesktop ? 'xMidYMid slice' : 'xMidYMin meet';
  const emblemCy = isDesktop ? 480 : 250;

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

      {/* Stars */}
      {stars.map((s, i) => (
        <rect key={i} x={s.x} y={s.y} width={s.s} height={s.s} fill="#F4EFE3"
          className="adv-star" style={{ animationDelay: `${s.d}s` }} />
      ))}

      {/* Moon */}
      <circle cx="318" cy="118" r="22" fill="#F4EFE3" opacity=".92" />
      <circle cx="326" cy="112" r="18" fill="#1F1A45" opacity=".55" />

      {/* Dark menacing peaks (center back, behind the emblem) */}
      <polygon points="120,470 200,170 280,470" fill="#0A0820" />
      <polygon points="160,470 200,240 240,470" fill="#15102E" />

      {/* ───── Elemental Emblem (Cookie Run-inspired crest) ───── */}
      <ElementalEmblem cx={200} cy={emblemCy} r={62} />

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
 * (fire / water / earth / sky / mystic). Glows softly and slowly rotates.
 */
function ElementalEmblem({ cx, cy, r }) {
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

  // Crossed axes — two diagonal weapon shapes behind the crest.
  // Axe = stylized: shaft as a thin rect + a leaf-shaped head at one end.
  return (
    <g className="adv-emblem">
      {/* Outer mystic halo */}
      <circle cx={cx} cy={cy} r={r + 30} fill="#F5B84218" />
      <circle cx={cx} cy={cy} r={r + 16} fill="#F5B84228" />

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

      {/* Chain links around the rim */}
      {chainLinks.map((l, i) => (
        <ellipse key={i} cx={l.x} cy={l.y} rx="2.8" ry="1.6"
          transform={`rotate(${l.rot} ${l.x} ${l.y})`}
          fill="#8A8A9E" stroke="#3E3858" strokeWidth=".6" />
      ))}

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

          <div className="kicker" style={{ margin: '22px 0 6px' }}>What should we call you?</div>
          <input
            ref={inputRef}
            value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Display name..." className="ob-input"
            onKeyDown={(e) => { if (e.key === 'Enter' && name.trim()) onNext(); }}
          />

          <button className="btn btn-primary btn-block ob-cta" disabled={!name.trim()}
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
  const beast = BEASTS[pick];
  return (
    <div className="ob-stage ob-fade">
      <Starfield density={24} />
      <div className="screen" style={{ paddingTop: 28, position: 'relative', zIndex: 1 }}>
        <ProgressDots stepIdx={stepIdx} total={totalSteps} />
        <h1 className="h2" style={{ marginBottom: 4 }}>Choose your Byte Beast<span style={{ color: 'var(--accent-amber)' }}>.</span></h1>
        <p className="caption" style={{ marginBottom: 14 }}>It evolves through four forms as you climb.</p>

        <div className="ob-beast-grid">
          {SPECIES_KEYS.map((k) => {
            const active = pick === k;
            return (
              <button key={k} onClick={() => setPick(k)} className={`ob-beast-cell${active ? ' active' : ''}`}>
                <BeastSprite species={k} tier={1} size={48} />
                <span className="mono" style={{ fontSize: 8, marginTop: 2, letterSpacing: '.06em',
                  color: active ? 'var(--accent-amber)' : 'var(--text-tertiary)' }}>
                  {BEASTS[k].name.toUpperCase()}
                </span>
              </button>
            );
          })}
        </div>

        <div className="card ob-beast-card" key={pick}>
          <div className="row">
            <div className="ob-float">
              <BeastSprite species={pick} tier={3} size={84} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 700 }}>{beast.name}</div>
              <span className={`pill ${ELEMENTS[beast.element].cls}`}>{ELEMENTS[beast.element].icon} {ELEMENTS[beast.element].label.toUpperCase()}</span>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '8px 0 0', fontStyle: 'italic', fontFamily: 'var(--font-serif)' }}>{beast.archetype}</p>
            </div>
          </div>
          <div className="mono ob-evo-line" style={{ marginTop: 10 }}>
            {beast.forms.map((f, i) => (
              <span key={i} style={{ animationDelay: `${i * 0.12}s` }}>{f}{i < beast.forms.length - 1 ? '  ›  ' : ''}</span>
            ))}
          </div>
        </div>

        <div className="row" style={{ gap: 8, marginTop: 12 }}>
          <button className="btn btn-block" onClick={onBack}>← Back</button>
          <button className="btn btn-primary btn-block" onClick={onNext}>Next: pick your path →</button>
        </div>
      </div>
    </div>
  );
}

/* ───────── Step 2: Path + level ───────── */
function PathLevelStep({ pathPick, setPathPick, levelPick, setLevelPick, onBack, onHatch, hatching, pickedBeast, stepIdx, totalSteps }) {
  const path = PATHS[pathPick];
  return (
    <div className="ob-stage ob-fade">
      <Starfield density={20} />
      <div className="screen" style={{ paddingTop: 28, position: 'relative', zIndex: 1 }}>
        <ProgressDots stepIdx={stepIdx} total={totalSteps} />
        <h1 className="h2" style={{ marginBottom: 4 }}>Choose your starting path<span style={{ color: 'var(--accent-amber)' }}>.</span></h1>
        <p className="caption" style={{ marginBottom: 14 }}>You can switch paths and tier later. We use these to tune your daily practice.</p>

        <div className="kicker" style={{ marginBottom: 8 }}>Career path</div>
        <div className="ob-path-grid">
          {PATH_KEYS.map((k) => {
            const p = PATHS[k];
            const active = pathPick === k;
            return (
              <button key={k} onClick={() => setPathPick(k)} className={`ob-path-cell${active ? ' active' : ''}`}>
                <span className="ob-path-icon">{p.icon}</span>
                <span className="ob-path-meta">
                  <span className="ob-path-name">{p.name}</span>
                  <span className="ob-path-count">{p.lessons.length} LESSONS</span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="kicker" style={{ margin: '14px 0 8px' }}>Where are you starting from?</div>
        <div className="row" style={{ gap: 6 }}>
          {LEVELS.map((lvl) => {
            const active = lvl === levelPick;
            return (
              <button key={lvl} onClick={() => setLevelPick(lvl)}
                className={`ob-tier-cell${active ? ' active' : ''}`}>
                {LEVEL_LABEL[lvl]}
              </button>
            );
          })}
        </div>

        <div className="card ob-summary">
          <div className="row">
            <div className={`ob-summary-beast${hatching ? ' hatching' : ''}`}>
              <BeastSprite species={pickedBeast} tier={1} size={56} />
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
              <div className="mono" style={{ fontSize: 10, color: 'var(--accent-amber)', marginTop: 2, letterSpacing: '.06em' }}>
                TIER · {LEVEL_LABEL[levelPick].toUpperCase()}
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
