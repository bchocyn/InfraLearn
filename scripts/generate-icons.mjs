// Rasterize the PWA icon SVGs into the PNG fallbacks iOS + Android WebAPK
// require. iOS Safari ignores SVG apple-touch-icon entirely (and composites
// transparency onto black), so the 180px touch icon gets the app's own dark
// background baked in. Re-run after changing any icon SVG:
//   node scripts/generate-icons.mjs
import { Resvg } from '@resvg/resvg-js';
import fs from 'node:fs';
import path from 'node:path';

const pub = path.resolve('public');

const JOBS = [
  // [source svg, output png, size, background]
  ['apple-touch-icon.svg', 'apple-touch-icon.png', 180, '#0B0A08'],
  ['icon-192.svg', 'icon-192.png', 192, null],
  ['icon-512.svg', 'icon-512.png', 512, null],
  ['icon-maskable-512.svg', 'icon-maskable-512.png', 512, null],
];

for (const [src, out, size, background] of JOBS) {
  const svg = fs.readFileSync(path.join(pub, src), 'utf8');
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: size },
    ...(background ? { background } : {}),
  });
  const png = resvg.render().asPng();
  fs.writeFileSync(path.join(pub, out), png);
  console.log(`${out}  ${size}x${size}  ${(png.length / 1024).toFixed(1)} KB${background ? `  bg=${background}` : ''}`);
}
