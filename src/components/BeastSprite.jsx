import { useEffect, useState } from 'react';

// Resolve a sprite URL respecting Vite's base path (works on GitHub Pages subpath).
const asset = (p) => `${import.meta.env.BASE_URL}beasts/${p}`.replace(/\/{2,}/g, '/').replace(':/', '://');

// Cache the IN-FLIGHT promise, not the resolved value: N sprites mounting
// before the first response lands all share one fetch of manifest.json
// instead of firing N parallel requests. On failure the cache resets to null
// so a later mount retries (same semantics the old value-cache had).
let manifestPromise = null;
export function loadManifest() {
  if (!manifestPromise) {
    manifestPromise = fetch(asset('manifest.json'))
      .then((res) => res.json())
      .catch((err) => {
        manifestPromise = null;
        throw err;
      });
  }
  return manifestPromise;
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
    setSrc(null); // reset on species/tier change so the old sprite doesn't flash
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
      style={{ width: size, height: size, imageRendering: 'auto', ...style }}
      draggable={false}
      onError={() => setSrc(null)}
    />
  );
}
