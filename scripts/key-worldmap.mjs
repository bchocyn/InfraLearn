// Asset-prep tool (dev-only, not shipped): pixellab map objects come back with
// an OPAQUE painted background despite RGBA, so the islands render as colored
// squares. This flood-fills the border background colour to transparent (a
// "magic wand from the edge"), leaving a clean island cutout on the ocean.
//
// Usage: node scripts/key-worldmap.mjs            (keys every island-*.png)
//        node scripts/key-worldmap.mjs all        (keys every *.png in worldmap/)
//
// Idempotent-ish: re-running on an already-keyed file just re-clears the (now
// transparent, hence skipped) border. Safe to run again after regenerating art.
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { PNG } from 'pngjs';

const DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'worldmap');
const TOL = 56;                 // colour distance from background that still counts as background
const all = process.argv[2] === 'all';

function key(file) {
  const path = join(DIR, file);
  const png = PNG.sync.read(readFileSync(path));
  const { width: W, height: H, data } = png;
  const idx = (x, y) => (y * W + x) * 4;

  // Background reference = average of the border frame pixels.
  let r = 0, g = 0, b = 0, n = 0;
  const sample = (i) => { r += data[i]; g += data[i + 1]; b += data[i + 2]; n++; };
  for (let x = 0; x < W; x++) { sample(idx(x, 0)); sample(idx(x, H - 1)); }
  for (let y = 0; y < H; y++) { sample(idx(0, y)); sample(idx(W - 1, y)); }
  r /= n; g /= n; b /= n;
  const T2 = TOL * TOL;
  const near = (i) => {
    if (data[i + 3] === 0) return true; // already transparent → keep flooding through
    const dr = data[i] - r, dg = data[i + 1] - g, db = data[i + 2] - b;
    return dr * dr + dg * dg + db * db <= T2;
  };

  // Flood-fill from every border pixel through connected background-coloured pixels.
  const seen = new Uint8Array(W * H);
  const stack = [];
  for (let x = 0; x < W; x++) { stack.push(x, 0, x, H - 1); }
  for (let y = 0; y < H; y++) { stack.push(0, y, W - 1, y); }
  let cleared = 0;
  while (stack.length) {
    const y = stack.pop(), x = stack.pop();
    if (x < 0 || y < 0 || x >= W || y >= H) continue;
    const p = y * W + x;
    if (seen[p]) continue;
    seen[p] = 1;
    const i = p * 4;
    if (!near(i)) continue;
    if (data[i + 3] !== 0) { data[i + 3] = 0; cleared++; }
    stack.push(x + 1, y, x - 1, y, x, y + 1, x, y - 1);
  }
  writeFileSync(path, PNG.sync.write(png));
  console.log(`${file}: bg=rgb(${r | 0},${g | 0},${b | 0}) cleared ${cleared}px (${((cleared / (W * H)) * 100).toFixed(0)}%)`);
}

// camp-*.png are FULL-BLEED scene backdrops (CampHero) — flood-filling from
// their border would eat the sky. Never key them, even in `all` mode.
const files = readdirSync(DIR).filter((f) => f.endsWith('.png')
  && !f.startsWith('camp-')
  && (all || f.startsWith('island-')));
if (!files.length) { console.log('no matching pngs in', DIR); process.exit(0); }
for (const f of files) key(f);
console.log(`\nkeyed ${files.length} file(s).`);
