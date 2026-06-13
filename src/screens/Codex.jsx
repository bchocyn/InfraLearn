// Codex — the journey's lore reader (design doc §3). Fragments unlock from
// real milestones only (recomputeLore in the store): provinces from first
// lessons, beast pages from tier attunement, the Five Lapses from pushing
// their provinces to bronze. Locked entries show an honest hint about the
// learning action that opens them — the codex never sells shortcuts.
//
// Lazy route (/codex): lore text + this reader have no business in the
// eager bundle; the entry pill lives on the ByteBeast screen.

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore.js';
import { WORLD, PROVINCES, FIVE_LAPSES, LAPSE_KEYS, BEAST_LORE, KEEPER_RANKS } from '../data/lore.js';
import { BEASTS, SPECIES_KEYS, ELEMENTS } from '../data/beasts.js';
import { PATHS, PATH_KEYS } from '../data/content.js';
import BeastSprite, { nullBeastSrc } from '../components/BeastSprite.jsx';
import CelebrationMoment from '../components/CelebrationMoment.jsx';

const TOTAL_FRAGMENTS = 1 + PATH_KEYS.length + LAPSE_KEYS.length + SPECIES_KEYS.length * 4;

export default function Codex() {
  const nav = useNavigate();
  const loreUnlocked = useStore((s) => s.loreUnlocked) || {};
  const xpLevel = useStore((s) => s.xpLevel) || 1;
  const count = Object.keys(loreUnlocked).length;
  const rank = KEEPER_RANKS[Math.min(Math.max(xpLevel, 1), KEEPER_RANKS.length) - 1];

  return (
    <div className="screen fade-in">
      <CelebrationMoment />
      <button type="button" className="btn" onClick={() => nav('/beast')} style={{ marginBottom: 12 }}>
        ← Byte Beast
      </button>
      <div className="kicker">📖 CODEX · {count}/{TOTAL_FRAGMENTS} FRAGMENTS</div>
      <h1 className="h1">The Keeper&apos;s Codex<span className="dot">.</span></h1>
      <p className="caption" style={{ marginBottom: 10 }}>
        Every entry here is earned by doing the work — a lesson, a review, a streak kept. Right now you&apos;re a {rank}.
      </p>
      <div className="codex-progress" role="img" aria-label={`${count} of ${TOTAL_FRAGMENTS} fragments recovered`}>
        <span className="codex-progress-fill" style={{ width: `${Math.round((count / TOTAL_FRAGMENTS) * 100)}%` }} />
      </div>

      <WorldEntry unlocked={!!loreUnlocked['world:myth']} />
      <ProvinceSection loreUnlocked={loreUnlocked} />
      <LapseSection loreUnlocked={loreUnlocked} />
      <BestiarySection loreUnlocked={loreUnlocked} />
    </div>
  );
}

function WorldEntry({ unlocked }) {
  return (
    <div className={`card codex-entry${unlocked ? '' : ' codex-locked'}`}>
      <div className="kicker codex-kicker">THE WORLD</div>
      <div className="codex-title">The Network That Was</div>
      {unlocked ? (
        <p className="codex-body">{WORLD.myth}</p>
      ) : (
        <p className="codex-hint">🔒 Begin your journey to recover this fragment.</p>
      )}
    </div>
  );
}

function ProvinceSection({ loreUnlocked }) {
  return (
    <>
      <div className="kicker codex-section">THE EIGHT PROVINCES</div>
      {PATH_KEYS.map((k) => {
        const prov = PROVINCES[k];
        if (!prov) return null;
        const unlocked = !!loreUnlocked[`province:${k}`];
        const lapse = FIVE_LAPSES[prov.lapse];
        return (
          <div key={k} className={`card codex-entry${unlocked ? '' : ' codex-locked'}`}>
            <div className="kicker codex-kicker">{PATHS[k]?.icon} {PATHS[k]?.name?.toUpperCase()}</div>
            {unlocked ? (
              <>
                <div className="codex-title">{prov.name} <span className="codex-epithet">— {prov.epithet}</span></div>
                <p className="codex-body">{prov.intro}</p>
                {lapse && (
                  <div className="codex-haunt mono">
                    {loreUnlocked[`lapse:${prov.lapse}`]
                      ? `HAUNTED BY ${lapse.name.toUpperCase()}, ${lapse.title.toUpperCase()}`
                      : 'SOMETHING WAITS AT THE END OF THIS ROAD'}
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="codex-title">???</div>
                <p className="codex-hint">🔒 Complete a lesson in {PATHS[k]?.name} to enter this province.</p>
              </>
            )}
          </div>
        );
      })}
    </>
  );
}

function LapseSection({ loreUnlocked }) {
  // Aligned provinces per lapse — drives the locked-state hint.
  const homes = useMemo(() => {
    const m = {};
    for (const k of PATH_KEYS) {
      const l = PROVINCES[k]?.lapse;
      if (!l) continue;
      (m[l] = m[l] || []).push(PROVINCES[k].name);
    }
    return m;
  }, []);
  return (
    <>
      <div className="kicker codex-section">THE FIVE LAPSES</div>
      {LAPSE_KEYS.map((id) => {
        const lapse = FIVE_LAPSES[id];
        const unlocked = !!loreUnlocked[`lapse:${id}`];
        const el = ELEMENTS[lapse.element];
        return (
          <div key={id} className={`card codex-entry${unlocked ? '' : ' codex-locked'}`}>
            <div className="kicker codex-kicker">
              {lapse.virtue.toUpperCase()} → {lapse.vice.toUpperCase()}
            </div>
            <div className="codex-beast-head">
              {/* The Lapse's boss sprite — full art once named, a black
                  silhouette while it's still "a presence unnamed". */}
              <div className={unlocked ? '' : 'codex-shadow'}>
                <img
                  className="beast-img"
                  src={nullBeastSrc(id)}
                  alt={unlocked ? `${lapse.name}, ${lapse.title}` : 'An unnamed presence'}
                  width={52}
                  height={52}
                  style={{ width: 52, height: 52, imageRendering: 'pixelated' }}
                  draggable={false}
                />
              </div>
              <div style={{ minWidth: 0 }}>
                {unlocked ? (
                  <div className="codex-title" style={{ marginBottom: 2 }}>
                    {lapse.name}, {lapse.title}
                    <span className={`pill ${el.cls} codex-pill`}>{el.icon} {el.label.toUpperCase()}</span>
                  </div>
                ) : (
                  <div className="codex-title" style={{ marginBottom: 2 }}>A presence unnamed</div>
                )}
              </div>
            </div>
            {unlocked ? (
              <>
                <p className="codex-body">{lapse.codex}</p>
                <blockquote className="codex-voice">“{lapse.voice}”</blockquote>
              </>
            ) : (
              <p className="codex-hint">
                🔒 {lapse.finale
                  ? 'Reclaim a province outright (gold seal) — and it will introduce itself.'
                  : `Push deeper into ${(homes[id] || []).join(' or ')} — a third of the way in, it takes notice.`}
              </p>
            )}
          </div>
        );
      })}
    </>
  );
}

function BestiarySection({ loreUnlocked }) {
  const beastTiers = useStore((s) => s.beastTiers) || {};
  return (
    <>
      <div className="kicker codex-section">BESTIARY · THE TEN BLOODLINES</div>
      {SPECIES_KEYS.map((sp) => {
        const beast = BEASTS[sp];
        const codex = BEAST_LORE[sp];
        if (!beast || !codex) return null;
        const el = ELEMENTS[beast.element];
        const cells = beastTiers[sp] || {};
        const maxTier = Object.keys(cells).length
          ? Math.max(...Object.values(cells).map((t) => (Number.isInteger(t) ? t : 1)))
          : 1;
        const hasOrigin = !!loreUnlocked[`beast:${sp}:origin`];
        return (
          <div key={sp} className={`card codex-entry${hasOrigin ? '' : ' codex-locked'}`}>
            <div className="codex-beast-head">
              <div className={hasOrigin ? '' : 'codex-shadow'}>
                <BeastSprite species={sp} tier={hasOrigin ? maxTier : 1} size={48} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div className="codex-title" style={{ marginBottom: 2 }}>
                  {hasOrigin ? beast.name : '???'}
                  <span className={`pill ${el.cls} codex-pill`}>{el.icon} {el.label.toUpperCase()}</span>
                </div>
                <div className="caption" style={{ fontSize: 11 }}>{hasOrigin ? beast.archetype : 'An unbonded bloodline.'}</div>
              </div>
            </div>
            <Fragment
              label="ORIGIN"
              unlocked={hasOrigin}
              text={codex.origin}
              hint="Bond with this species to recover its origin."
            />
            <Fragment
              label="FIELD NOTES"
              unlocked={!!loreUnlocked[`beast:${sp}:field`]}
              text={codex.fieldNote}
              hint="Attune to tier 2 on any path."
            />
            <Fragment
              label="SAGA OF FORMS"
              unlocked={!!loreUnlocked[`beast:${sp}:saga`]}
              text={`${beast.forms.join(' › ')}. Not growth — remembering what it always was.`}
              hint="Attune to tier 3 on any path."
            />
            <Fragment
              label="NULL-SCAR"
              unlocked={!!loreUnlocked[`beast:${sp}:scar`]}
              text={codex.nullScar}
              hint="Reach the prime form (tier 4) — the deepest page opens last."
            />
          </div>
        );
      })}
    </>
  );
}

function Fragment({ label, unlocked, text, hint }) {
  return (
    <div className={`codex-frag${unlocked ? '' : ' codex-frag-locked'}`}>
      <div className="kicker codex-frag-label">{unlocked ? label : `🔒 ${label}`}</div>
      {unlocked
        ? <p className="codex-body" style={{ margin: 0 }}>{text}</p>
        : <p className="codex-hint" style={{ margin: 0 }}>{hint}</p>}
    </div>
  );
}
