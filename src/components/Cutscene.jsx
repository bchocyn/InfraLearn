// Cutscene — Cookie Run-style story beats between milestones (province entry,
// the Lapse noticing you at 1/3, the tide turning at 2/3). Fed by the
// `pendingCutscene` store slot; panel data comes from data/cutscenes.js.
//
// Presentation (CRK-inspired): a full-bleed province scene backdrop, the cast
// staged left (your companion) and right (the province's Lapse) with the
// active speaker lit + forward and the others dimmed back, and a bottom
// dialogue box with a name plate, the speaker's portrait, and typewriter text.
// Characters pop in the first time they appear. Tap/click advances; Escape
// skips the whole scene. Reduced motion (app setting OR OS pref) drops every
// drift/zoom/typewriter and renders panels statically.
//
// Defers to PathAscension: if an Ascension cinematic is queued at the same
// time, the bigger moment plays first and the cutscene waits its turn.

import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store/useStore.js';
import { getCutscene, parseCutsceneId } from '../data/cutscenes.js';
import { BEASTS } from '../data/beasts.js';
import { PATHS } from '../data/content.js';
import { PROVINCES, FIVE_LAPSES } from '../data/lore.js';
import BeastSprite, { nullBeastSrc } from './BeastSprite.jsx';

// Dev-only manual trigger: `window.__cutscene('enter:devops')`.
if (import.meta.env.DEV && typeof window !== 'undefined') {
  window.__cutscene = (id) => useStore.setState((s) => ({
    pendingCutscene: id,
    cutscenesSeen: { ...(s.cutscenesSeen || {}), [id]: true },
  }));
}

const sceneBgSrc = (pathKey) =>
  `${import.meta.env.BASE_URL}roadmap-scenes/${pathKey}.png`
    .replace(/\/{2,}/g, '/')
    .replace(':/', '://');

// Reveal `text` one character at a time. Returns the full string immediately
// when disabled (reduced motion / tests, where timers don't tick).
function useTypewriter(text, enabled) {
  const [n, setN] = useState(enabled ? 0 : text.length);
  useEffect(() => {
    if (!enabled) { setN(text.length); return undefined; }
    setN(0);
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setN(i);
      if (i >= text.length) clearInterval(id);
    }, 26);
    return () => clearInterval(id);
  }, [text, enabled]);
  return text.slice(0, n);
}

// A small framed portrait bust of whoever is speaking.
function Portrait({ kind, companion, beastTier, lapseId, icon }) {
  if (kind === 'companion') {
    const species = BEASTS[companion] ? companion : 'dragon';
    return <BeastSprite species={species} tier={beastTier || 1} size={60} />;
  }
  if (kind === 'lapse') {
    return <img src={nullBeastSrc(lapseId)} alt="" width={60} height={60}
      draggable={false} style={{ width: 60, height: 60, imageRendering: 'pixelated' }} />;
  }
  return <span className="cutscene-cr-portrait-sigil" aria-hidden="true">{icon}</span>;
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
  const parsed = parseCutsceneId(sceneId);
  const pathKey = parsed?.pathKey;

  // Escape = skip the whole scene (capture-phase, like PathAscension).
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

  useEffect(() => { if (!scene) clearPendingCutscene(); }, [scene, clearPendingCutscene]);

  // Which character first appears on which panel — so the Lapse isn't on stage
  // before its reveal, and entrances animate when each first walks on.
  const panels = scene?.panels || [];
  const safeIdx = Math.min(idx, Math.max(0, panels.length - 1));
  const panel = panels[safeIdx] || null;
  const companionFirst = panels.findIndex((p) => p.actor?.type === 'companion');
  const lapseFirst = panels.findIndex((p) => p.actor?.type === 'lapse' || p.actor?.type === 'lapse-dim');
  const lapseId = panels.find((p) => p.actor?.lapseId)?.actor?.lapseId || null;

  // Typewriter is a hook — must run unconditionally, before any early return.
  const fullText = panel ? panel.lines.filter(Boolean).join('\n') : '';
  const typed = useTypewriter(fullText, !reduced);

  if (!scene || !panel) return null;

  const last = idx >= panels.length - 1;
  const advance = () => { if (last) clearPendingCutscene(); else setIdx((i) => i + 1); };

  const actorType = panel.actor?.type;
  const lapseName = lapseId ? (FIVE_LAPSES[lapseId]?.name || '???') : null;
  const provinceName = pathKey ? (PROVINCES[pathKey]?.name || PATHS[pathKey]?.name) : null;

  // Speaker name plate + which portrait to show in the box.
  let speakerName = provinceName;
  let portraitKind = 'sigil';
  if (actorType === 'companion') {
    speakerName = BEASTS[companion]?.name || 'Your Companion';
    portraitKind = 'companion';
  } else if (actorType === 'lapse') {
    speakerName = lapseName;
    portraitKind = 'lapse';
  } else if (actorType === 'lapse-dim') {
    speakerName = '???';
    portraitKind = 'lapse';
  }

  const leftClass = actorType === 'companion' ? 'is-active' : 'is-dim';
  const rightClass = actorType === 'lapse' ? 'is-active'
    : actorType === 'lapse-dim' ? 'is-shadow' : 'is-dim';

  return (
    <div
      className={`cutscene-overlay cutscene-cr${reduced ? ' cutscene-reduced' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="Story moment"
      onClick={advance}
    >
      {/* Province scene backdrop (PixelLab) + legibility vignette. */}
      <div className="cutscene-cr-bg" aria-hidden="true">
        {pathKey ? <img src={sceneBgSrc(pathKey)} alt="" draggable={false} /> : null}
        <div className="cutscene-cr-vignette" />
      </div>

      <button
        type="button"
        className="cutscene-skip mono"
        onClick={(e) => { e.stopPropagation(); clearPendingCutscene(); }}
      >
        SKIP ▸▸
      </button>

      {/* Staged cast — companion left, Lapse right; entrances keyed so they
          replay when a character first walks on. The inner wrapper carries the
          idle bob so it never fights the active/dim transform on the outer. */}
      <div className="cutscene-cr-stage" aria-hidden="true">
        {companionFirst !== -1 && idx >= companionFirst && (
          <div key={`L${companionFirst}`} className={`cutscene-cr-char cutscene-cr-left ${leftClass}`}>
            <div className="cutscene-cr-charinner">
              <BeastSprite
                species={BEASTS[companion] ? companion : 'dragon'}
                tier={beastTier || 1}
                size={150}
              />
            </div>
          </div>
        )}
        {lapseFirst !== -1 && idx >= lapseFirst && lapseId && (
          <div key={`R${lapseFirst}`} className={`cutscene-cr-char cutscene-cr-right ${rightClass}`}>
            <div className="cutscene-cr-charinner">
              <img src={nullBeastSrc(lapseId)} alt="" width={150} height={150}
                draggable={false} style={{ width: 150, height: 150, imageRendering: 'pixelated' }} />
            </div>
          </div>
        )}
      </div>

      {/* Cozy drifting motes (GoGoMuffin warmth). */}
      {!reduced && <div className="cutscene-cr-motes" aria-hidden="true" />}

      {/* Dialogue box — name plate + portrait + typewriter text. Keyed by panel
          so the slide-up replays per beat. */}
      <div key={idx} className="cutscene-cr-box">
        <div className="cutscene-cr-nameplate">{speakerName}</div>
        <div className="cutscene-cr-portrait">
          <Portrait
            kind={portraitKind}
            companion={companion}
            beastTier={beastTier}
            lapseId={lapseId}
            icon={panel.actor?.icon || PATHS[pathKey]?.icon || '✦'}
          />
        </div>
        <div className="cutscene-cr-text">
          {panel.kicker ? <div className="kicker cutscene-cr-kicker">{panel.kicker}</div> : null}
          {panel.title ? <div className="cutscene-cr-title">{panel.title}</div> : null}
          <p className="cutscene-cr-lines">{typed}</p>
        </div>
        <div className="cutscene-cr-advance mono" aria-hidden="true">
          {last ? 'CONTINUE ▸' : `▸ ${idx + 1}/${scene.panels.length}`}
        </div>
      </div>
    </div>
  );
}

export default function Cutscene() {
  const pendingCutscene = useStore((s) => s.pendingCutscene);
  const pendingAscension = useStore((s) => s.pendingAscension);
  if (!pendingCutscene || pendingAscension) return null;
  return <CutsceneOverlay key={pendingCutscene} sceneId={pendingCutscene} />;
}
