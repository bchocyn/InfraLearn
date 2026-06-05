import { useEffect, useState } from 'react';

// Resolve a sprite URL respecting Vite's base path (works on GitHub Pages subpath).
const asset = (p) => `${import.meta.env.BASE_URL}beasts/${p}`.replace(/\/{2,}/g, '/').replace(':/', '://');

let manifestCache = null;
export async function loadManifest() {
  if (manifestCache) return manifestCache;
  const res = await fetch(asset('manifest.json'));
  manifestCache = await res.json();
  return manifestCache;
}

// Warm the cache as soon as this module is evaluated, so the first sprite
// to mount finds the manifest already resolved (avoids a blank <img> frame
// on HeroEnsemble / Roadmap walker / EvolutionViewer).
loadManifest().catch(() => {});

/**
 * Renders a Byte Beast sprite for a given species + tier.
 * Pulls the filename from the generated manifest.json, so swapping art
 * never requires touching component code.
 */
export default function BeastSprite({ species, tier = 1, size = 96, className = '', style = {} }) {
  const [src, setSrc] = useState(null);
  useEffect(() => {
    let live = true;
    loadManifest().then((m) => {
      const file = m?.[species]?.tiers?.[String(tier)];
      if (live && file) setSrc(asset(file));
    }).catch(() => {});
    return () => { live = false; };
  }, [species, tier]);

  if (!src) {
    return (
      <span
        className={`beast-sprite-skeleton ${className}`}
        style={{
          width: size,
          height: size,
          display: 'inline-block',
          background: 'rgba(245,184,66,.05)',
          borderRadius: 6,
          ...style,
        }}
      />
    );
  }

  return (
    <img
      className={`beast-img ${className}`}
      src={src}
      alt={`${species} tier ${tier}`}
      width={size}
      height={size}
      style={{ width: size, height: size, imageRendering: 'pixelated', ...style }}
      draggable={false}
    />
  );
}
