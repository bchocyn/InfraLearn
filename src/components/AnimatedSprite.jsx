// AnimatedSprite — plays a pixel-art frame sequence by swapping <img> frames
// at a fixed fps via requestAnimationFrame. No spritesheet packing (so no
// build step / image lib needed) — frames are individual PNG URLs.
//
// Honors the global reducedMotion setting: when set (or with <2 frames) it
// renders the first frame statically. Frames are preloaded so the loop never
// flashes a blank. This is the shared playback layer for animated Byte Beasts
// and player avatars (see ANIMATION_PLAN.md).

import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store/useStore.js';

export default function AnimatedSprite({
  frames,
  fps = 8,
  size = 96,
  width,
  height,
  alt = '',
  className = '',
  style = {},
}) {
  const reduced = useStore((s) => s.settings?.reducedMotion);
  const list = Array.isArray(frames) ? frames.filter(Boolean) : [];
  const [idx, setIdx] = useState(0);
  const w = width ?? size;
  const h = height ?? size;

  // Preload every frame once so swapping is instant (no network flash).
  const preloaded = useRef(new Set());
  useEffect(() => {
    for (const src of list) {
      if (src && !preloaded.current.has(src)) {
        const im = new Image();
        im.src = src;
        preloaded.current.add(src);
      }
    }
  }, [list.join('|')]);

  // rAF-driven frame advance, throttled to fps. Paused under reduced motion.
  useEffect(() => {
    if (reduced || list.length < 2) {
      setIdx(0);
      return undefined;
    }
    let raf;
    let last = 0;
    let frame = 0;
    const tick = (t) => {
      if (t - last >= 1000 / fps) {
        last = t;
        frame = (frame + 1) % list.length;
        setIdx(frame);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduced, list.length, fps]);

  const src = list[idx] || list[0];
  if (!src) return null;
  return (
    <img
      src={src}
      width={w}
      height={h}
      alt={alt}
      draggable={false}
      className={className}
      style={{ imageRendering: 'pixelated', objectFit: 'contain', ...style }}
    />
  );
}
