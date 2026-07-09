import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store/useStore.js';
import { PATHS } from '../data/content.js';
import { PROVINCES, FIVE_LAPSES } from '../data/lore.js';
import { BEASTS } from '../data/beasts.js';
import { playSaga } from '../data/storyEngine.js';
import { useFocusTrap } from '../hooks/useFocusTrap.js';
import BeastSprite, { nullBeastSrc } from './BeastSprite.jsx';

// SagaStage — the Byte Beast tab's tap-through world-myth player.
//
// Opens as a full-screen visual-novel overlay (reusing the milestone
// cutscene's cutscene-cr-* presentation so it looks native), plays the beats
// the ink saga has UNLOCKED for the learner's current progress, and advances
// one panel per tap. Reaching the end raises the "beats seen" watermark, so
// the "✦ new" pip on the stage clears until studying reveals more.
//
// Props:
//   state   — the progress snapshot passed to playSaga (beast/tier/lessons/…)
//   pathKey — active province, for the backdrop + which Lapse presence shows
//   onClose — called when the Keeper dismisses or finishes the saga

const sceneBgSrc = (pathKey) =>
  `${import.meta.env.BASE_URL}roadmap-scenes/${pathKey}.png`
    .replace(/\/{2,}/g, '/')
    .replace(':/', '://');

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
    }, 24);
    return () => clearInterval(id);
  }, [text, enabled]);
  return text.slice(0, n);
}

export default function SagaStage({ state, pathKey, onClose }) {
  const companion = useStore((s) => s.companion);
  const beastTier = useStore((s) => s.beastTier);
  const markSagaSeen = useStore((s) => s.markSagaSeen);
  const reducedSetting = useStore((s) => s.settings?.reducedMotion);
  const reduced = reducedSetting
    || (typeof window !== 'undefined' && window.matchMedia
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  const [panels, setPanels] = useState(null); // null = loading, [] = none
  const [idx, setIdx] = useState(0);
  const trapRef = useRef(null);
  useFocusTrap(trapRef, { onClose });

  // Play the saga once on open (lazy-loads the ink runtime + compiled JSON).
  useEffect(() => {
    let alive = true;
    playSaga(state).then((p) => { if (alive) setPanels(p); }).catch(() => { if (alive) setPanels([]); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const total = panels?.length || 0;
  const panel = panels && idx < total ? panels[idx] : null;
  const last = idx >= total - 1;

  const fullText = panel ? panel.line : '';
  const typed = useTypewriter(fullText, !reduced && !!panel);

  const advance = () => {
    if (!panel) return;
    if (last) {
      markSagaSeen(total); // raise the "seen" watermark, clears the pip
      onClose();
      return;
    }
    setIdx((i) => i + 1);
  };

  // Which Lapse presence to stage on lapse beats — the active province's, or
  // Hollow Ink (the finale Null) as the world-level default.
  const prov = PROVINCES[pathKey];
  const lapseId = (prov && prov.lapse) || 'hollow-ink';
  const lapseName = FIVE_LAPSES[lapseId]?.name || 'the Null';
  const provinceName = (prov && prov.name) || (PATHS[pathKey]?.name) || 'The Long Watch';

  const actor = panel?.actor || 'province';
  const onCompanion = actor === 'companion';
  const onLapse = actor === 'lapse' || actor === 'lapse-dim';
  const speakerName = onCompanion
    ? (BEASTS[companion]?.name || 'Your Companion')
    : onLapse ? (actor === 'lapse-dim' ? '???' : lapseName)
    : provinceName;

  return (
    <div
      ref={trapRef}
      className={`cutscene-overlay cutscene-cr${reduced ? ' cutscene-reduced' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="The world myth"
      onClick={advance}
    >
      <div className="cutscene-cr-bg" aria-hidden="true">
        {pathKey ? <img src={sceneBgSrc(pathKey)} alt="" draggable={false} /> : null}
        <div className="cutscene-cr-vignette" />
      </div>

      <button
        type="button"
        className="cutscene-skip mono"
        onClick={(e) => { e.stopPropagation(); onClose(); }}
      >
        CLOSE ▸▸
      </button>

      {/* Staged cast — companion left, Lapse right; whoever the current beat
          speaks as is lit, the other dimmed back. */}
      <div className="cutscene-cr-stage" aria-hidden="true">
        <div className={`cutscene-cr-char cutscene-cr-left ${onCompanion ? 'is-active' : 'is-dim'}`}>
          <div className="cutscene-cr-charinner">
            <BeastSprite species={BEASTS[companion] ? companion : 'dragon'} tier={beastTier || 1} size={150} />
          </div>
        </div>
        {onLapse && (
          <div className={`cutscene-cr-char cutscene-cr-right ${actor === 'lapse' ? 'is-active' : 'is-shadow'}`}>
            <div className="cutscene-cr-charinner">
              <img src={nullBeastSrc(lapseId)} alt="" width={150} height={150}
                draggable={false} style={{ width: 150, height: 150, imageRendering: 'pixelated' }} />
            </div>
          </div>
        )}
      </div>

      {!reduced && <div className="cutscene-cr-motes" aria-hidden="true" />}

      {panels === null ? (
        <div className="cutscene-cr-box">
          <div className="cutscene-cr-text"><p className="cutscene-cr-lines">Gathering the myth…</p></div>
        </div>
      ) : total === 0 ? (
        <div className="cutscene-cr-box">
          <div className="cutscene-cr-text">
            <div className="kicker cutscene-cr-kicker">THE THRESHOLD</div>
            <p className="cutscene-cr-lines">The saga has not begun. Complete a lesson, and the first light of the myth will kindle.</p>
          </div>
          <div className="cutscene-cr-advance mono" aria-hidden="true">CLOSE ▸</div>
        </div>
      ) : (
        <div key={idx} className="cutscene-cr-box">
          <div className="cutscene-cr-nameplate">{speakerName}</div>
          <div className="cutscene-cr-portrait">
            {onCompanion ? (
              <BeastSprite species={BEASTS[companion] ? companion : 'dragon'} tier={beastTier || 1} size={60} />
            ) : onLapse ? (
              <img src={nullBeastSrc(lapseId)} alt="" width={60} height={60}
                draggable={false} style={{ width: 60, height: 60, imageRendering: 'pixelated' }} />
            ) : (
              <span className="cutscene-cr-portrait-sigil" aria-hidden="true">{PATHS[pathKey]?.icon || '✦'}</span>
            )}
          </div>
          <div className="cutscene-cr-text">
            {panel.kicker ? <div className="kicker cutscene-cr-kicker">{panel.kicker}</div> : null}
            {panel.title ? <div className="cutscene-cr-title">{panel.title}</div> : null}
            <p className="cutscene-cr-lines">{typed}</p>
          </div>
          <div className="cutscene-cr-advance mono" aria-hidden="true">
            {last ? 'CLOSE ▸' : `▸ ${idx + 1}/${total}`}
          </div>
        </div>
      )}
    </div>
  );
}
