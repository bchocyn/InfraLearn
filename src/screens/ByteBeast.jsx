import { lazy, Suspense, useState } from 'react';
import { useStore, beastForm, activePathProgress } from '../store/useStore.js';
import { BEASTS, ELEMENTS, EVO_RULES, SPECIES_KEYS } from '../data/beasts.js';
import { BACKGROUNDS, PATHS, PATH_KEYS, pathProgress } from '../data/content.js';
import BeastSprite from '../components/BeastSprite.jsx';
import BeastScene from '../components/BeastScene.jsx';
import BadgeHex, { badgeTier } from '../components/BadgeHex.jsx';
import AvatarSprite from '../components/AvatarSprite.jsx';
import AvatarCreator from '../components/AvatarCreator.jsx';
import CelebrationMoment from '../components/CelebrationMoment.jsx';
// Trophy room is gated behind a button — never ships in the initial ByteBeast
// chunk. Lazy import means the trophy code only downloads when the user
// actually opens the overlay.
const Trophies = lazy(() => import('./Trophies.jsx'));

export default function ByteBeast() {
  const s = useStore();
  const [tab, setTab] = useState('beast'); // beast | scenes | badges | avatar
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
      </div>

      {/* beast on equipped background */}
      <div className="beast-stage">
        <div className="beast-stage-bg"><BeastScene id={bg.id} /></div>
        <div className="beast-stage-label">{bg.name.toUpperCase()}</div>
        <StageDecor />
        <div className="beast-stage-avatar" aria-hidden="false">
          <AvatarSprite avatar={s.avatar} size={32} />
        </div>
        <div className="beast-stage-sprite">
          <BeastSprite species={s.companion} tier={s.beastTier} size={120} className="beast-stage-sprite-img" />
          <div className="beast-stage-shadow" />
        </div>
      </div>

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
            {/* Compact padding + clamp font so 4 tabs ("🧬 EVOLVE"…"🧑 AVATAR")
                fit a 375px iPhone without horizontal overflow. */}
            {[
              { id: 'beast',  label: '🧬 EVOLVE' },
              { id: 'scenes', label: '🖼 SCENES' },
              { id: 'badges', label: '🏆 BADGES' },
              { id: 'avatar', label: '🧑 AVATAR' },
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
          {tab === 'avatar' && <AvatarCreator avatar={s.avatar} onChange={s.setAvatar} />}
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
  const s = useStore();
  const [switchOpen, setSwitchOpen] = useState(false);
  const beast = BEASTS[s.companion] || BEASTS.dragon;
  const element = ELEMENTS[beast.element];
  const nextRule = EVO_RULES.find((r) => r.from === s.beastTier);
  return (
    <div className="card beast-about-card">
      {switchOpen && <CompanionSwitcher current={s.companion} onClose={() => setSwitchOpen(false)} />}
      <div className="kicker" style={{ marginBottom: 8 }}>About this beast</div>
      <div className="beast-about-head">
        <span className={`pill ${element.cls}`}>{element.icon} {element.label.toUpperCase()}</span>
        <span className="mono beast-about-tier">TIER {s.beastTier}/4</span>
      </div>
      <p className="beast-about-archetype">{beast.archetype}</p>

      <div className="kicker" style={{ margin: '14px 0 8px' }}>Evolution chain</div>
      <ul className="beast-chain">
        {beast.forms.map((form, i) => {
          const t = i + 1;
          const past = t < s.beastTier;
          const now = t === s.beastTier;
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

// Modal sheet listing all 10 species. Tap to switch — progress is preserved
// per-species in the beastTiers matrix, so this is non-destructive.
function CompanionSwitcher({ current, onClose }) {
  const chooseCompanion = useStore((s) => s.chooseCompanion);
  const beastTiers = useStore((s) => s.beastTiers || {});
  const activePath = useStore((s) => s.activePath);
  const pick = (species) => {
    if (species !== current) chooseCompanion(species);
    onClose();
  };
  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,.55)',
        zIndex: 80,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="card"
        style={{
          width: 'min(100%, 400px)',
          maxHeight: '80vh',
          overflowY: 'auto',
          padding: 18,
        }}
      >
        <div className="kicker" style={{ color: 'var(--accent-amber)' }}>SWITCH COMPANION</div>
        <p className="caption" style={{ marginTop: 6, marginBottom: 12 }}>
          Each species keeps its own evolution progress per path. Switching is non-destructive — you can switch back.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {SPECIES_KEYS.map((species) => {
            const b = BEASTS[species];
            const el = ELEMENTS[b.element];
            const earnedTier = (beastTiers[species] && beastTiers[species][activePath]) || 1;
            const isCurrent = species === current;
            return (
              <button
                key={species}
                type="button"
                className="btn"
                onClick={() => pick(species)}
                style={{
                  padding: 10,
                  border: `1.5px solid ${isCurrent ? 'var(--accent-amber)' : 'var(--border-subtle)'}`,
                  background: isCurrent ? 'var(--accent-amber-bg)' : 'var(--bg-card)',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 14 }}>{el.icon}</span>
                  <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 600, fontSize: 13 }}>
                    {b.name}
                  </span>
                </div>
                <div
                  className="mono"
                  style={{ fontSize: 9, color: 'var(--text-tertiary)', letterSpacing: '.08em' }}
                >
                  {b.archetype.slice(0, 28)}{b.archetype.length > 28 ? '…' : ''}
                </div>
                <div
                  className="mono"
                  style={{
                    fontSize: 9,
                    color: isCurrent ? 'var(--accent-amber)' : 'var(--text-quaternary)',
                    letterSpacing: '.08em',
                  }}
                >
                  {isCurrent ? 'NOW · ' : ''}TIER {earnedTier}/4 ON THIS PATH
                </div>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          className="btn btn-block"
          style={{ marginTop: 14 }}
          onClick={onClose}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function EvolutionViewer() {
  const s = useStore();
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
  const s = useStore();
  const setBackground = useStore((st) => st.setBackground);
  return (
    <div>
      <div className="caption" style={{ marginBottom: 10 }}>{s.unlockedBackgrounds.length} of {BACKGROUNDS.length} unlocked.</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {BACKGROUNDS.map((b) => {
          const unlocked = s.unlockedBackgrounds.includes(b.id);
          const equipped = s.beastBackground === b.id;
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
  const s = useStore();
  return (
    <div className="card">
      <div className="kicker" style={{ marginBottom: 6 }}>Path badges</div>
      <p className="caption" style={{ marginBottom: 12 }}>
        Earn a badge by completing a path. Bronze at 33%, Silver at 66%, Gold at 100%.
      </p>
      <div className="badge-grid">
        {PATH_KEYS.map((k) => {
          const { pct } = pathProgress(k, s.completed);
          const tier = badgeTier(pct);
          return <BadgeHex key={k} pathKey={k} tier={tier} pct={pct} />;
        })}
      </div>
    </div>
  );
}

function EvolutionModal() {
  const s = useStore();
  const clear = useStore((st) => st.clearPendingEvolution);
  const beast = BEASTS[s.pendingEvolution] || BEASTS.dragon;
  const reduced = s.settings.reducedMotion;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(6,5,3,.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={clear}>
      <div className="card fade-in" style={{ textAlign: 'center', maxWidth: 320,
        border: '1px solid var(--accent-amber)', background: 'linear-gradient(135deg, rgba(245,184,66,.18), rgba(224,120,86,.1))' }}>
        <div style={{ fontSize: 24, animation: reduced ? 'none' : 'fade 1.5s infinite alternate' }}>✦</div>
        <div className="kicker" style={{ color: 'var(--accent-amber)', margin: '8px 0 4px' }}>Evolution</div>
        <h2 className="h2" style={{ marginBottom: 12 }}>{beast.name} evolved!</h2>
        <BeastSprite species={s.pendingEvolution} tier={s.beastTier} size={120} />
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '12px 0 4px' }}>
          Now <strong style={{ color: 'var(--accent-amber)' }}>{beast.forms[s.beastTier - 1]}</strong>
        </p>
        <button className="btn btn-primary btn-block" style={{ marginTop: 12 }} onClick={clear}>Awesome →</button>
      </div>
    </div>
  );
}
