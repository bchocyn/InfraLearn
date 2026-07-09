import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import { useFocusTrap } from '../hooks/useFocusTrap.js';
import { useStore, beastForm, activePathProgress } from '../store/useStore.js';
import { BEASTS, ELEMENTS, EVO_RULES } from '../data/beasts.js';
import { BACKGROUNDS, PATH_KEYS, pathProgress } from '../data/content.js';
import { unlockedBeatCount } from '../data/storyEngine.js';
import BeastSprite from '../components/BeastSprite.jsx';
// The world-myth story stage — the tap-through unlockable saga. Lazy so the
// ink runtime (~128 KB) only downloads when a Keeper opens the myth.
const SagaStage = lazy(() => import('../components/SagaStage.jsx'));
// Same species-pick window as onboarding's "Choose your Byte Beast" step —
// shared grid + detail card + starfield backdrop.
import BeastPicker, { Starfield } from '../components/BeastPicker.jsx';
import BeastScene from '../components/BeastScene.jsx';
import BadgeHex, { badgeTier } from '../components/BadgeHex.jsx';
import AvatarSprite from '../components/AvatarSprite.jsx';
import Wardrobe from '../components/Wardrobe.jsx';
import CelebrationMoment from '../components/CelebrationMoment.jsx';
// Trophy room is gated behind a button — never ships in the initial ByteBeast
// chunk. Lazy import means the trophy code only downloads when the user
// actually opens the overlay.
const Trophies = lazy(() => import('./Trophies.jsx'));

export default function ByteBeast() {
  const nav = useNavigate();
  // Narrowed subscription: only the five fields this component renders.
  // beastForm(s) reads companion + beastTier off the grouped object. The
  // setAvatar action is a stable reference, selected separately.
  const s = useStore(useShallow((st) => ({
    pendingEvolution: st.pendingEvolution,
    companion: st.companion,
    beastTier: st.beastTier,
    beastBackground: st.beastBackground,
    avatar: st.avatar,
  })));
  const setAvatar = useStore((st) => st.setAvatar);
  const [tab, setTab] = useState('beast'); // beast | scenes | badges | wardrobe
  const [sagaOpen, setSagaOpen] = useState(false);
  // Progress snapshot for the world-myth saga (pushed into ink as variables).
  // Recomputed from the fields the saga gates on; memoized so opening the
  // stage doesn't rerun on every unrelated render.
  const sagaState = useStore(useShallow((st) => {
    const lessonsTotal = Object.keys(st.completed || {}).length;
    const provincesReclaimed = PATH_KEYS.filter((k) => pathProgress(k, st.completed || {}).pct >= 1).length;
    return {
      beast: st.companion,
      beastName: (BEASTS[st.companion]?.forms || [])[(st.beastTier || 1) - 1] || 'your companion',
      beastTier: st.beastTier || 1,
      lessonsTotal,
      provincesReclaimed,
      streak: st.streak || 0,
      activePath: st.activePath,
    };
  }));
  const sagaBeatsSeen = useStore((st) => st.sagaBeatsSeen || 0);
  // "✦ new" pip: does the current progress unlock beats beyond what's been
  // seen? unlockedBeatCount lazy-loads the ink runtime, so this fires once
  // per mount and never on the eager path.
  const [unlockedBeats, setUnlockedBeats] = useState(null);
  useEffect(() => {
    let alive = true;
    unlockedBeatCount(sagaState).then((n) => { if (alive) setUnlockedBeats(n); }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sagaState.lessonsTotal, sagaState.provincesReclaimed, sagaState.beastTier]);
  const hasNewBeats = unlockedBeats !== null && unlockedBeats > sagaBeatsSeen;
  // Trophy room overlay state. Reached via the TROPHIES pill below the title
  // row. Lives here (not in main.jsx) because the routing layer is owned by
  // the lazy-loading agent and we must not collide.
  const [trophiesOpen, setTrophiesOpen] = useState(false);
  const beast = BEASTS[s.companion] || BEASTS.dragon;
  const element = ELEMENTS[beast.element];
  const bg = BACKGROUNDS.find((b) => b.id === s.beastBackground) || BACKGROUNDS[0];

  return (
    <div className="screen fade-in">
      {s.pendingEvolution && <EvolutionModal />}
      {trophiesOpen && (
        <Suspense fallback={null}>
          <Trophies onClose={() => setTrophiesOpen(false)} />
        </Suspense>
      )}
      <CelebrationMoment />

      <div className="kicker beast-kicker">BYTE BEAST</div>
      <h1 className="h1">{beastForm(s)}<span className="dot">.</span></h1>
      <div className="beast-title-row">
        <p className="caption" style={{ margin: 0 }}>
          Tier {s.beastTier} · {beast.name}
        </p>
        <span className={`pill ${element.cls}`}>{element.icon} {element.label.toUpperCase()}</span>
        {/* TROPHIES entry pill — small, secondary visual weight so the
            companion switcher (the primary action on this row) still
            dominates. Tapping opens the trophy room as a full-screen overlay. */}
        <button
          type="button"
          className="pill pill-action"
          onClick={() => setTrophiesOpen(true)}
          aria-label="Open trophy room"
          style={{
            border: '1px solid var(--accent-amber)',
            color: 'var(--accent-amber)',
            background: 'transparent',
            cursor: 'pointer',
            font: 'inherit',
            minHeight: 32,
          }}
        >
          🏆 TROPHIES →
        </button>
        {/* Codex entry — same secondary weight as TROPHIES. Lazy route, so
            the lore reader costs nothing until a Keeper opens it. */}
        <button
          type="button"
          className="pill pill-action"
          onClick={() => nav('/codex')}
          aria-label="Open the Keeper's codex"
          style={{
            border: '1px solid var(--border-strong)',
            color: 'var(--text-secondary)',
            background: 'transparent',
            cursor: 'pointer',
            font: 'inherit',
            minHeight: 32,
          }}
        >
          📖 CODEX →
        </button>
        <button
          type="button"
          className="pill pill-action"
          onClick={() => nav('/journey')}
          aria-label="Open the journey map"
          style={{
            border: '1px solid var(--border-strong)',
            color: 'var(--text-secondary)',
            background: 'transparent',
            cursor: 'pointer',
            font: 'inherit',
            minHeight: 32,
          }}
        >
          🗺 JOURNEY →
        </button>
      </div>

      {/* beast on equipped background */}
      <div className="beast-stage">
        <div className="beast-stage-bg"><BeastScene id={bg.id} /></div>
        <div className="beast-stage-label">{bg.name.toUpperCase()}</div>
        <StageDecor />
        <div className="beast-stage-avatar" aria-hidden="false">
          <AvatarSprite avatar={s.avatar} size={56} />
        </div>
        <div className="beast-stage-sprite">
          <BeastSprite species={s.companion} tier={s.beastTier} size={120} className="beast-stage-sprite-img" />
          <div className="beast-stage-shadow" />
        </div>
        {/* Tap-through world-myth saga — the beast's story stage. The button
            sits over the scene; the "✦ new" pip appears when studying has
            unlocked beats the Keeper hasn't seen yet. */}
        <button
          type="button"
          className="beast-stage-myth"
          onClick={() => setSagaOpen(true)}
          aria-label={hasNewBeats ? 'Hear the myth — new story unlocked' : 'Hear the myth of the Long Watch'}
        >
          ✦ Hear the myth
          {hasNewBeats && <span className="beast-stage-myth-pip" aria-hidden="true">new</span>}
        </button>
      </div>

      {sagaOpen && (
        <Suspense fallback={null}>
          <SagaStage state={sagaState} pathKey={sagaState.activePath} onClose={() => setSagaOpen(false)} />
        </Suspense>
      )}

      {tab === 'scenes' && (
        <>
          <div className="kicker" style={{ marginTop: 18, marginBottom: 6 }}>BYTE BEAST TAB · NATURE SCENES</div>
          <h2 className="h2" style={{ marginBottom: 4 }}>Backgrounds — now lush nature</h2>
          <p className="caption" style={{ marginBottom: 14 }}>Scrapped the server/tech theme. Pixel-art nature scenes — meadows, forests, mountains, sunsets. Each unlocks at a learning milestone; equip one as your beast's home.</p>
        </>
      )}

      <div className="beast-page-grid">
        <div className="beast-page-main">
          <div className="row beast-tab-row" style={{ gap: 6, marginBottom: 14 }}>
            {/* Compact padding + clamp font so 4 tabs ("🧬 EVOLVE"…"🎽 WARDROBE")
                fit a 375px iPhone without horizontal overflow. */}
            {[
              { id: 'beast',  label: '🧬 EVOLVE' },
              { id: 'scenes', label: '🖼 SCENES' },
              { id: 'badges', label: '🏆 BADGES' },
              { id: 'wardrobe', label: '🎽 WARDROBE' },
            ].map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  className="btn btn-block"
                  onClick={() => setTab(t.id)}
                  style={{
                    padding: '10px 6px',
                    fontSize: 'clamp(11px, 2.9vw, 13px)',
                    whiteSpace: 'nowrap',
                    ...(active ? { borderColor: 'var(--accent-amber)', color: 'var(--accent-amber)' } : {}),
                  }}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
          {tab === 'beast' && <EvolutionViewer />}
          {tab === 'scenes' && <Scenes />}
          {tab === 'badges' && <Badges />}
          {tab === 'wardrobe' && <Wardrobe avatar={s.avatar} onChange={setAvatar} />}
        </div>
        <aside className="beast-page-aside">
          <AboutBeastCard />
        </aside>
      </div>
    </div>
  );
}

// Decorative pixel-style foreground (stars + grass tufts) — desktop only via CSS.
function StageDecor() {
  return (
    <svg className="beast-stage-decor" width="100%" height="100%" viewBox="0 0 400 320" preserveAspectRatio="none" aria-hidden="true">
      {/* stars */}
      <g fill="#fff8d6" opacity=".85">
        <rect x="40" y="36" width="3" height="3" />
        <rect x="46" y="42" width="2" height="2" />
        <rect x="320" y="28" width="3" height="3" />
        <rect x="326" y="34" width="2" height="2" />
        <rect x="200" y="54" width="2" height="2" />
      </g>
      {/* tiny star sparkle */}
      <g fill="#f5b842" opacity=".9">
        <rect x="350" y="60" width="3" height="3" />
        <rect x="68" y="78" width="2" height="2" />
      </g>
      {/* grass tufts along bottom */}
      <g fill="rgba(0,0,0,.32)">
        <rect x="24" y="298" width="4" height="6" />
        <rect x="30" y="294" width="3" height="10" />
        <rect x="36" y="298" width="4" height="6" />
        <rect x="90" y="300" width="3" height="6" />
        <rect x="96" y="296" width="4" height="10" />
        <rect x="300" y="300" width="3" height="6" />
        <rect x="306" y="296" width="4" height="10" />
        <rect x="370" y="298" width="4" height="6" />
        <rect x="376" y="294" width="3" height="10" />
      </g>
    </svg>
  );
}

function AboutBeastCard() {
  const companion = useStore((st) => st.companion);
  const beastTier = useStore((st) => st.beastTier);
  const [switchOpen, setSwitchOpen] = useState(false);
  const beast = BEASTS[companion] || BEASTS.dragon;
  const element = ELEMENTS[beast.element];
  const nextRule = EVO_RULES.find((r) => r.from === beastTier);
  return (
    <div className="card beast-about-card">
      {switchOpen && <CompanionSwitcher current={companion} onClose={() => setSwitchOpen(false)} />}
      <div className="kicker" style={{ marginBottom: 8 }}>About this beast</div>
      <div className="beast-about-head">
        <span className={`pill ${element.cls}`}>{element.icon} {element.label.toUpperCase()}</span>
        <span className="mono beast-about-tier">TIER {beastTier}/4</span>
      </div>
      <p className="beast-about-archetype">{beast.archetype}</p>

      <div className="kicker" style={{ margin: '14px 0 8px' }}>Evolution chain</div>
      <ul className="beast-chain">
        {beast.forms.map((form, i) => {
          const t = i + 1;
          const past = t < beastTier;
          const now = t === beastTier;
          const tier4 = t === 4;
          const marker = past ? '✓' : now ? 'NOW' : tier4 ? '★' : '🔒';
          const cls = past ? 'past' : now ? 'now' : tier4 ? 'final' : 'locked';
          return (
            <li key={t} className={`beast-chain-row ${cls}`}>
              <span className="beast-chain-marker">{marker}</span>
              <span className="beast-chain-tier mono">T{t}</span>
              <span className="beast-chain-name">{form}</span>
            </li>
          );
        })}
      </ul>

      {nextRule ? (
        <div className="beast-about-next">
          <div className="kicker" style={{ marginBottom: 4 }}>Next evolution</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            To reach <strong style={{ color: 'var(--accent-amber)' }}>{beast.forms[nextRule.to - 1]}</strong>:
          </div>
          <div className="mono" style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 6, letterSpacing: '.06em' }}>
            {nextRule.label.toUpperCase()}
          </div>
        </div>
      ) : (
        <div className="beast-about-next">
          <div className="kicker" style={{ marginBottom: 4, color: 'var(--accent-amber)' }}>Max tier reached</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>This beast has evolved to its prime form.</div>
        </div>
      )}

      {/* Companion-change entrypoint. Switching swaps to whatever tier that
          species already earned on the active path (1 if untouched).
          Per-pet per-path tiers mean the old beast's progress is preserved. */}
      <button
        type="button"
        className="btn btn-block"
        style={{ marginTop: 14 }}
        onClick={() => setSwitchOpen(true)}
      >
        🐉 Switch companion
      </button>
    </div>
  );
}

// Full-screen companion switcher — the SAME window as onboarding's "Choose
// your Byte Beast" step (starfield stage, sprite grid, detail card), shared
// via BeastPicker. Two-phase like onboarding: tap to preview, confirm to
// switch. Progress is preserved per-species in the beastTiers matrix, so
// switching is non-destructive; the detail sprite shows the tier that
// species has actually EARNED on the active path.
function CompanionSwitcher({ current, onClose }) {
  const chooseCompanion = useStore((s) => s.chooseCompanion);
  const beastTiers = useStore((s) => s.beastTiers || {});
  const activePath = useStore((s) => s.activePath);
  const [pick, setPick] = useState(current);
  const trapRef = useRef(null);
  // Tab stays inside the dialog (aria-modal's missing half); Escape is
  // handled below at the window level.
  useFocusTrap(trapRef, {});

  // Escape closes; body scroll locks while the window is up.
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const earnedTier = (beastTiers[pick] && beastTiers[pick][activePath]) || 1;
  const isCurrent = pick === current;
  const confirm = () => {
    if (!isCurrent) chooseCompanion(pick);
    onClose();
  };

  return (
    <div
      ref={trapRef}
      role="dialog"
      aria-modal="true"
      aria-label="Switch companion"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 90,           // above the TabBar (50), below EvolutionModal (100)
        overflowY: 'auto',
        background: 'var(--bg-base)',
      }}
    >
      <div className="ob-stage ob-fade">
        <Starfield density={24} />
        <div className="screen" style={{ paddingTop: 28, position: 'relative', zIndex: 1, maxWidth: 480, margin: '0 auto' }}>
          <h1 className="h2" style={{ marginBottom: 4 }}>Switch your Byte Beast<span style={{ color: 'var(--accent-amber)' }}>.</span></h1>
          <p className="caption" style={{ marginBottom: 14 }}>
            Each species keeps its own evolution progress per path — switching is non-destructive.
          </p>

          <BeastPicker
            pick={pick}
            setPick={setPick}
            detailTier={earnedTier}
            note={`${isCurrent ? 'CURRENT COMPANION · ' : ''}TIER ${earnedTier}/4 ON THIS PATH`}
          />

          <div className="row" style={{ gap: 8, marginTop: 12 }}>
            <button className="btn btn-block" onClick={onClose}>← Cancel</button>
            <button className="btn btn-primary btn-block" onClick={confirm}>
              {isCurrent ? `Keep ${BEASTS[pick].name} →` : `Switch to ${BEASTS[pick].name} →`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EvolutionViewer() {
  // Grouped narrow selector — activePathProgress(s) reads activePath +
  // completed; the evolution line reads companion + beastTier.
  const s = useStore(useShallow((st) => ({
    companion: st.companion,
    beastTier: st.beastTier,
    activePath: st.activePath,
    completed: st.completed,
  })));
  const beast = BEASTS[s.companion] || BEASTS.dragon;
  const prog = activePathProgress(s);
  return (
    <div className="card">
      <div className="kicker" style={{ marginBottom: 10 }}>Evolution line</div>
      <div className="evo-line">
        <div className="evo-line-track" aria-hidden="true" />
        {[1, 2, 3, 4].map((t) => {
          const active = t === s.beastTier;
          const past = t < s.beastTier;
          const tier4 = t === 4;
          const stateCls = active ? 'now' : past ? 'past' : tier4 ? 'final' : 'locked';
          return (
            <div key={t} className={`evo-line-step ${stateCls}`}>
              <div className="evo-line-sprite">
                <BeastSprite species={s.companion} tier={t} size={active ? 64 : 48} className="evo-line-sprite-img" />
              </div>
              <div className="mono evo-line-label">
                {past ? '✓ ' : active ? 'NOW ' : tier4 ? '★ ' : '🔒 '}{beast.forms[t - 1]}
              </div>
            </div>
          );
        })}
      </div>
      {s.beastTier < 4 && (
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border-subtle)' }}>
          <div className="mono" style={{ fontSize: 9, color: 'var(--text-tertiary)', marginBottom: 6 }}>
            NEXT: {beast.forms[s.beastTier].toUpperCase()}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            Needs: <strong style={{ color: 'var(--accent-amber)' }}>{EVO_RULES.find(r => r.from === s.beastTier)?.label}</strong>
          </div>
          <div className="progress" style={{ marginTop: 8 }}><i style={{ width: `${prog.pct * 100}%` }} /></div>
          <div className="caption" style={{ marginTop: 4 }}>{Math.round(prog.pct * 100)}% through {s.activePath}</div>
        </div>
      )}
    </div>
  );
}

function Scenes() {
  const unlockedBackgrounds = useStore((st) => st.unlockedBackgrounds);
  const beastBackground = useStore((st) => st.beastBackground);
  const setBackground = useStore((st) => st.setBackground);
  return (
    <div>
      <div className="caption" style={{ marginBottom: 10 }}>{unlockedBackgrounds.length} of {BACKGROUNDS.length} unlocked.</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {BACKGROUNDS.map((b) => {
          const unlocked = unlockedBackgrounds.includes(b.id);
          const equipped = beastBackground === b.id;
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => unlocked && setBackground(b.id)}
              disabled={!unlocked}
              aria-pressed={equipped}
              aria-label={`${b.name}${equipped ? ', equipped' : unlocked ? '' : ', locked'}`}
              style={{
                borderRadius: 10,
                overflow: 'hidden',
                padding: 0,
                background: 'transparent',
                border: `1.5px solid ${equipped ? 'var(--accent-amber)' : 'var(--border-subtle)'}`,
                opacity: unlocked ? 1 : 0.5,
                cursor: unlocked ? 'pointer' : 'not-allowed',
                font: 'inherit',
                color: 'inherit',
                textAlign: 'left',
                minHeight: 44,
              }}
            >
              <div style={{ height: 70, position: 'relative' }}>
                <BeastScene id={b.id} />
                {!unlocked && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(11,10,8,.5)', fontSize: 16, zIndex: 2 }}>🔒</div>}
              </div>
              <div style={{ padding: '6px 8px', background: 'var(--bg-card)' }}>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: 12, fontWeight: 600 }}>{b.name}</div>
                <div className="mono" style={{ fontSize: 7, letterSpacing: '.08em', color: equipped ? 'var(--status-success)' : 'var(--text-tertiary)' }}>
                  {equipped ? 'EQUIPPED ✓' : (b.req || 'DEFAULT')}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Badges() {
  const completed = useStore((st) => st.completed);
  return (
    <div className="card">
      <div className="kicker" style={{ marginBottom: 6 }}>Path badges</div>
      <p className="caption" style={{ marginBottom: 12 }}>
        Earn a badge by completing a path. Bronze at 33%, Silver at 66%, Gold at 100%.
      </p>
      <div className="badge-grid">
        {PATH_KEYS.map((k) => {
          const { pct } = pathProgress(k, completed);
          const tier = badgeTier(pct);
          return <BadgeHex key={k} pathKey={k} tier={tier} pct={pct} />;
        })}
      </div>
    </div>
  );
}

function EvolutionModal() {
  const pendingEvolution = useStore((st) => st.pendingEvolution);
  const beastTier = useStore((st) => st.beastTier);
  // Primitive selector — re-renders only when the flag itself flips, not
  // when the settings object is replaced by an unrelated setSetting call.
  const reduced = useStore((st) => st.settings.reducedMotion);
  const clear = useStore((st) => st.clearPendingEvolution);
  const beast = BEASTS[pendingEvolution] || BEASTS.dragon;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(6,5,3,.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={clear}>
      <div className="card fade-in" style={{ textAlign: 'center', maxWidth: 320,
        border: '1px solid var(--accent-amber)', background: 'linear-gradient(135deg, rgba(245,184,66,.18), rgba(224,120,86,.1))' }}>
        <div style={{ fontSize: 24, animation: reduced ? 'none' : 'fade 1.5s infinite alternate' }}>✦</div>
        <div className="kicker" style={{ color: 'var(--accent-amber)', margin: '8px 0 4px' }}>Evolution</div>
        <h2 className="h2" style={{ marginBottom: 12 }}>{beast.name} evolved!</h2>
        <BeastSprite species={pendingEvolution} tier={beastTier} size={120} />
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '12px 0 4px' }}>
          Now <strong style={{ color: 'var(--accent-amber)' }}>{beast.forms[beastTier - 1]}</strong>
        </p>
        <button className="btn btn-primary btn-block" style={{ marginTop: 12 }} onClick={clear}>Awesome →</button>
      </div>
    </div>
  );
}
