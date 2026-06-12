// Cutscene — short visual-novel story beats between milestones (province
// entry, the Lapse noticing you at 1/3, the tide turning at 2/3). Fed by the
// `pendingCutscene` store slot; panel data comes from data/cutscenes.js.
//
// Presentation: full-screen letterboxed overlay. Each panel is an actor
// (companion sprite / Null Beast / province sigil) over a drifting parallax
// backdrop, with the text fading up beneath. Tap/click advances; the last
// panel shows Continue; Escape skips the whole scene. Reduced motion (app
// setting OR OS pref) drops every drift/zoom and renders panels statically.
//
// Defers to PathAscension: if an Ascension cinematic is queued at the same
// time (gold seal + story beat in one batch), the bigger moment plays first
// and the cutscene waits its turn in the pending slot.

import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore.js';
import { getCutscene } from '../data/cutscenes.js';
import { BEASTS } from '../data/beasts.js';
import BeastSprite, { nullBeastSrc } from './BeastSprite.jsx';

// Dev-only manual trigger: `window.__cutscene('enter:devops')`.
if (import.meta.env.DEV && typeof window !== 'undefined') {
  window.__cutscene = (id) => useStore.setState((s) => ({
    pendingCutscene: id,
    cutscenesSeen: { ...(s.cutscenesSeen || {}), [id]: true },
  }));
}

function Actor({ actor, companion, beastTier }) {
  if (actor.type === 'companion') {
    const species = BEASTS[companion] ? companion : 'dragon';
    return <BeastSprite species={species} tier={beastTier || 1} size={120} />;
  }
  if (actor.type === 'lapse' || actor.type === 'lapse-dim') {
    const dim = actor.type === 'lapse-dim';
    return (
      <img
        src={nullBeastSrc(actor.lapseId)}
        alt=""
        width={120}
        height={120}
        draggable={false}
        style={{
          width: 120,
          height: 120,
          imageRendering: 'pixelated',
          filter: dim ? 'brightness(0.3) saturate(0.4)' : 'none',
          opacity: dim ? 0.85 : 1,
        }}
      />
    );
  }
  // province sigil — the path icon in a faint ring
  return (
    <div className="cutscene-sigil" aria-hidden="true">
      <span>{actor.icon}</span>
    </div>
  );
}

function CutsceneOverlay({ sceneId }) {
  const clearPendingCutscene = useStore((s) => s.clearPendingCutscene);
  const companion = useStore((s) => s.companion);
  const beastTier = useStore((s) => s.beastTier);
  const reducedSetting = useStore((s) => s.settings?.reducedMotion);
  const reduced = reducedSetting
    || (typeof window !== 'undefined' && window.matchMedia
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  const [idx, setIdx] = useState(0);
  const scene = getCutscene(sceneId);

  // Escape = skip the whole scene. Capture-phase, same convention as
  // PathAscension so global chord handlers don't also fire.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      e.stopImmediatePropagation();
      clearPendingCutscene();
    };
    window.addEventListener('keydown', onKey, { capture: true });
    return () => window.removeEventListener('keydown', onKey, { capture: true });
  }, [clearPendingCutscene]);

  // Unknown/tampered id — clear the slot rather than wedging the overlay.
  useEffect(() => {
    if (!scene) clearPendingCutscene();
  }, [scene, clearPendingCutscene]);
  if (!scene) return null;

  const panel = scene.panels[Math.min(idx, scene.panels.length - 1)];
  const last = idx >= scene.panels.length - 1;
  const advance = () => {
    if (last) clearPendingCutscene();
    else setIdx((i) => i + 1);
  };

  return (
    <div
      className={`cutscene-overlay${reduced ? ' cutscene-reduced' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="Story moment"
      onClick={advance}
    >
      <div className="cutscene-letterbox cutscene-letterbox-top" aria-hidden="true" />
      <div className="cutscene-letterbox cutscene-letterbox-bottom" aria-hidden="true" />

      {/* Parallax backdrop — two drifting star layers behind the actor. */}
      {!reduced && (
        <div className="cutscene-drift" aria-hidden="true">
          <div className="cutscene-drift-far" />
          <div className="cutscene-drift-near" />
        </div>
      )}

      <button
        type="button"
        className="cutscene-skip mono"
        onClick={(e) => { e.stopPropagation(); clearPendingCutscene(); }}
      >
        SKIP ▸▸
      </button>

      {/* Keyed by panel index so the enter animations replay per panel. */}
      <div key={idx} className="cutscene-panel">
        <div className="cutscene-actor">
          <Actor actor={panel.actor} companion={companion} beastTier={beastTier} />
        </div>
        <div className="cutscene-text">
          {panel.kicker ? <div className="kicker cutscene-kicker">{panel.kicker}</div> : null}
          {panel.title ? <div className="cutscene-title">{panel.title}</div> : null}
          {panel.lines.map((l, i) => (
            <p key={i} className="cutscene-line" style={reduced ? undefined : { animationDelay: `${0.25 + i * 0.5}s` }}>
              {l}
            </p>
          ))}
        </div>
        <div className="cutscene-hint mono" aria-hidden="true">
          {last ? 'TAP TO CONTINUE →' : `TAP ▸ ${idx + 1}/${scene.panels.length}`}
        </div>
      </div>
    </div>
  );
}

export default function Cutscene() {
  const pendingCutscene = useStore((s) => s.pendingCutscene);
  const pendingAscension = useStore((s) => s.pendingAscension);
  // The gold-seal cinematic outranks story beats; the cutscene keeps its
  // pending slot and plays right after the ascension is dismissed.
  if (!pendingCutscene || pendingAscension) return null;
  return <CutsceneOverlay key={pendingCutscene} sceneId={pendingCutscene} />;
}
