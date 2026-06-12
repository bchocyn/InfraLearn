import { useMemo } from 'react';
import { BEASTS, SPECIES_KEYS, ELEMENTS } from '../data/beasts.js';
import BeastSprite from './BeastSprite.jsx';

// BeastPicker — the species-selection UI from onboarding's "Choose your
// Byte Beast" step, extracted so the ByteBeast screen's companion switcher
// can present the exact same window. Renders the 5-per-row sprite grid and
// the detail card (floating sprite, element pill, archetype, evolution
// line). Selection state lives in the parent (`pick` / `setPick`); the
// parent supplies its own title, captions, and nav buttons around this.
//
//   detailTier — which form the detail-card sprite shows. Onboarding shows
//                tier 3 (an aspirational preview); the switcher shows the
//                tier that species has actually EARNED on the active path.
//   note       — optional mono footer line in the detail card (the switcher
//                uses it for "TIER n/4 ON THIS PATH").
export default function BeastPicker({ pick, setPick, detailTier = 3, note = null }) {
  const beast = BEASTS[pick];
  return (
    <>
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
            <BeastSprite species={pick} tier={detailTier} size={84} />
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
        {note && (
          <div className="mono" style={{ marginTop: 8, fontSize: 9, letterSpacing: '.08em', color: 'var(--accent-amber)' }}>
            {note}
          </div>
        )}
      </div>
    </>
  );
}

// Starfield — the twinkling backdrop behind the onboarding pick steps.
// Static deterministic positions so it doesn't reshuffle on each render.
export function Starfield({ density = 38 }) {
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
