// Integrity gate for the beast animation manifest: every BEAST_ANIMS entry
// must point at real frame files on disk, and none of them may be the
// ~96-byte blank PNGs the 2026-07 PixelLab regression returned (which would
// render an invisible companion). Mirrors the content-integrity philosophy:
// the manifest is a promise about public/ — break the promise, break CI.

import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { BEAST_ANIMS } from '../src/data/beastAnims.js';

const ANIM_ROOT = path.resolve(__dirname, '../public/beasts/anim');

// A real 64px pixel-art frame is several KB; a blank/transparent PNG is ~100 B.
const MIN_FRAME_BYTES = 500;

describe('beast animation manifest integrity', () => {
  for (const [species, tiers] of Object.entries(BEAST_ANIMS)) {
    for (const [tier, meta] of Object.entries(tiers)) {
      it(`${species} t${tier} (${meta.folder}) has ${meta.frames} real frame file(s)`, () => {
        expect(meta.frames, 'frames').toBeGreaterThan(0);
        expect(meta.fps, 'fps').toBeGreaterThan(0);
        for (let i = 0; i < meta.frames; i++) {
          const file = path.join(ANIM_ROOT, meta.folder, `${i}.png`);
          expect(fs.existsSync(file), `${meta.folder}/${i}.png missing`).toBe(true);
          const size = fs.statSync(file).size;
          expect(size, `${meta.folder}/${i}.png is ${size} B — blank-frame regression?`).toBeGreaterThan(MIN_FRAME_BYTES);
        }
      });
    }
  }
});
