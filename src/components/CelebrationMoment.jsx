// CelebrationMoment — full-screen one-shot overlay that flashes when the
// user crosses an XP / level / badge boundary. Driven by the store's
// `celebrate` field (set by addXp/grantBadge, cleared here on dismiss).
//
// Design (Engagement Tier B):
//   • Auto-dismiss after 1.5s — short, ADHD-friendly, never blocks input.
//   • Click anywhere to dismiss early.
//   • prefers-reduced-motion: drop the confetti burst, fade the XP chip in.
//   • z-index 9999 so it sits above modals/tabbar/EvolutionNotice.
//   • CSS-only confetti — 16 radial divs with deterministic-by-id angles
//     so the burst looks intentional, not random; no library required.

import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store/useStore.js';
import { loreFragmentTitle } from '../data/lore.js';

const DURATION_MS = 1500;
const PARTICLE_COUNT = 16;
// Accent palette pulled from the design vars — confetti colors stay on-brand
// regardless of which theme/accent the user picked.
const CONFETTI_COLORS = [
  'var(--accent-amber)',
  'var(--el-fire)',
  'var(--el-water)',
  'var(--el-earth)',
  'var(--el-sky)',
  'var(--status-success)',
];

// Deterministic pseudo-random in [0, 1) seeded by an id string. Keeps the
// confetti burst stable across re-renders inside a single celebration.
function seededRand(seed, i) {
  let h = 2166136261;
  const s = `${seed}-${i}`;
  for (let k = 0; k < s.length; k++) {
    h ^= s.charCodeAt(k);
    h = (h * 16777619) >>> 0;
  }
  return ((h % 10000) / 10000);
}

export default function CelebrationMoment() {
  const celebrate = useStore((s) => s.celebrate);
  const clear = useStore((s) => s.clearCelebration);
  const reducedMotion = useStore((s) => s.settings?.reducedMotion);
  const [visible, setVisible] = useState(false);
  // Cache the current celebration locally so the overlay can finish its
  // fade-out animation even after the store has been cleared.
  const [local, setLocal] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!celebrate) return undefined;
    // Staleness gate: if the user navigated away before the auto-dismiss
    // timer ran, clear() never fired and the store slot survived — without
    // this check the NEXT screen that mounts a CelebrationMoment would
    // replay the overlay minutes later. Remount-replay WITHIN ~5s stays
    // intentional (Reviews relies on it for its done-state transition).
    if (Date.now() - (celebrate.at || 0) > 5000) {
      clear();
      return undefined;
    }
    setLocal(celebrate);
    setVisible(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setVisible(false);
      clear();
    }, DURATION_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [celebrate, clear]);

  if (!visible || !local) return null;

  const onDismiss = () => {
    setVisible(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    clear();
  };

  const isLevel = local.kind === 'level';
  const isBadge = local.kind === 'badge';
  const isLore = local.kind === 'lore';
  const headline = isLevel
    ? `Level ${local.level}!`
    : isBadge
      ? 'Badge unlocked!'
      : isLore
        ? 'Codex fragment recovered'
        : `+${local.amount} XP`;
  // Embers ride whatever celebration the earning action emitted (see
  // addEmbers in the store) — shown as a suffix, never their own moment.
  const emberSuffix = local.embers > 0 ? ` · +${local.embers} ⟡` : '';
  const subline = isLevel
    ? `+${local.amount} XP · You leveled up.${emberSuffix}`
    : isBadge
      ? local.badgeId
      : isLore
        ? `${loreFragmentTitle(local.loreId)}${emberSuffix}`
        : `Nice — that counts.${emberSuffix}`;

  return (
    <div
      className="celebration-overlay"
      onClick={onDismiss}
      role="status"
      aria-live="polite"
      aria-label={headline}
    >
      {!reducedMotion && (
        <div className="celebration-confetti" aria-hidden="true">
          {Array.from({ length: PARTICLE_COUNT }).map((_, i) => {
            // Even angle split around 360deg + small jitter = intentional burst
            const angle = (360 / PARTICLE_COUNT) * i + seededRand(local.id, i) * 20;
            const distance = 110 + seededRand(local.id, i + 99) * 60; // px
            const dx = Math.cos((angle * Math.PI) / 180) * distance;
            const dy = Math.sin((angle * Math.PI) / 180) * distance;
            const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
            const size = 6 + Math.floor(seededRand(local.id, i + 33) * 6);
            return (
              <span
                key={i}
                className="celebration-particle"
                style={{
                  background: color,
                  width: `${size}px`,
                  height: `${size}px`,
                  // Custom-prop hand-off for the keyframe animation in CSS.
                  '--cm-dx': `${dx}px`,
                  '--cm-dy': `${dy}px`,
                }}
              />
            );
          })}
        </div>
      )}
      <div className={`celebration-chip celebration-chip-${local.kind}`}>
        <div className="celebration-headline">{headline}</div>
        <div className="celebration-subline">{subline}</div>
      </div>
    </div>
  );
}
