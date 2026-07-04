import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import { useStore, activePathProgress, beastForm } from '../store/useStore.js';
import { BEASTS, ELEMENTS } from '../data/beasts.js';
import { PATHS } from '../data/content.js';
import BeastSprite from './BeastSprite.jsx';

export default function EvolutionNotice() {
  // Mounted at the app ROOT — a whole-store subscription here re-rendered on
  // EVERY store write (each XP tick, each celebration set+clear pair). Narrow
  // to the six fields actually read; useShallow keeps the grouped object
  // referentially stable until one of those fields changes. `completed` and
  // `activePath` are needed by activePathProgress(); `companion`/`beastTier`
  // by beastForm().
  const s = useStore(useShallow((st) => ({
    pendingEvolution: st.pendingEvolution,
    companion: st.companion,
    activePath: st.activePath,
    beastTier: st.beastTier,
    completed: st.completed,
  })));
  const nav = useNavigate();
  const loc = useLocation();
  // `dismissed` is keyed implicitly to the current pendingEvolution value —
  // when a NEW evolution becomes pending (e.g. user evolves a different
  // species), we want the notice to surface again. Reset on value change.
  const [dismissedFor, setDismissedFor] = useState(null);
  const dismissed = dismissedFor !== null && dismissedFor === s.pendingEvolution;
  useEffect(() => {
    if (!s.pendingEvolution) setDismissedFor(null);
  }, [s.pendingEvolution]);

  if (!s.pendingEvolution) return null;
  if (dismissed) return null;
  if (loc.pathname === '/beast') return null; // in-tab modal handles it there

  const beast = BEASTS[s.pendingEvolution] || BEASTS[s.companion] || BEASTS.dragon;
  const path = PATHS[s.activePath] || PATHS.devops;
  const prog = activePathProgress(s);
  const elementIcon = ELEMENTS[beast.element]?.icon || '◆';

  return (
    <div className="evo-notice-backdrop">
      <div className="evo-notice-card fade-in">
        <div className="evo-notice-sparkle">✦</div>
        <div className="kicker" style={{ color: 'var(--accent-amber)', marginBottom: 4 }}>EVOLUTION READY</div>
        <h2 className="h2" style={{ marginBottom: 12 }}>{beastForm(s)} is ready to evolve!</h2>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
          <BeastSprite species={s.companion} tier={s.beastTier} size={96} />
        </div>
        <p className="evo-notice-meta">
          {Math.round(prog.pct * 100)}% through {path.name} {elementIcon}
        </p>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '8px 0 14px', textAlign: 'center' }}>
          Head to the Byte Beast tab to watch the transformation.
        </p>
        <button className="btn btn-primary btn-block" onClick={() => nav('/beast')}>
          🐲 Open Byte Beast tab →
        </button>
        <button
          className="btn btn-block"
          style={{ marginTop: 8, background: 'transparent', borderColor: 'transparent', color: 'var(--text-tertiary)' }}
          onClick={() => setDismissedFor(s.pendingEvolution)}
        >
          Later
        </button>
      </div>
      <p className="evo-notice-footnote">A ✦ dot appears on the tab until you watch it.</p>
    </div>
  );
}
