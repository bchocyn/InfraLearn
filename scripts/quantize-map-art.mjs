// Quantize the map-art PNGs to indexed color. The pixellab keying pipeline
// (key-worldmap.mjs) writes full-RGBA output, but the art is flat-color pixel
// work with ≤ ~400 unique colors — palette encoding is visually lossless and
// typically 60-85% smaller. These directories ride the SW install precache,
// so every byte here is paid on first visit AND re-paid on every deploy's
// cache refresh.
//
//   node scripts/quantize-map-art.mjs          # worldmap/, map/, roadmap-scenes/
//   node scripts/quantize-map-art.mjs <dir>…   # explicit dirs under public/
//
// Idempotent: pngquant refuses to write when the result wouldn't be smaller
// (--skip-if-larger), and re-quantizing an already-indexed PNG is a no-op
// size-wise. Quality floor 85 keeps gradients (sky scenes) clean; flat art
// converts exactly.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const pngquant = require('pngquant-bin').default || require('pngquant-bin');

const DIRS = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ['worldmap', 'worldmap/anim', 'map', 'roadmap-scenes'];

let before = 0, after = 0, converted = 0, skipped = 0;
for (const sub of DIRS) {
  const dir = path.resolve('public', sub);
  if (!fs.existsSync(dir)) { console.warn(`[skip] ${sub} — not found`); continue; }
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith('.png')) continue;
    const file = path.join(dir, f);
    const orig = fs.statSync(file).size;
    const tmp = `${file}.q.png`;
    try {
      execFileSync(pngquant, [
        '--quality=85-100', '--speed=1', '--strip', '--skip-if-larger',
        '--force', '--output', tmp, file,
      ]);
    } catch (e) {
      // status 98/99 = result larger / below quality floor — keep original.
      if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
      before += orig; after += orig; skipped += 1;
      continue;
    }
    const next = fs.statSync(tmp).size;
    if (next < orig) {
      fs.renameSync(tmp, file);
      converted += 1;
    } else {
      fs.unlinkSync(tmp);
      skipped += 1;
    }
    before += orig;
    after += Math.min(next, orig);
  }
}
const kb = (n) => `${Math.round(n / 1024)} KB`;
console.log(`[quantize] ${converted} converted, ${skipped} kept — ${kb(before)} → ${kb(after)} (${Math.round((1 - after / before) * 100)}% smaller)`);
