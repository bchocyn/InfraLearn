// Generate PixelLab pixel-art parallax backdrops for the Roadmap's per-province
// sky band — the same concept as the ByteBeast stage scenes, applied to the
// world map. One landscape per career path, themed to that province's twilight
// palette (see SCENES in src/screens/Roadmap.jsx). The map's animated moon +
// parallax stars ride ON TOP, so these images keep a clean sky (no moon/stars).
//
// Usage:
//   PIXELLAB_API_KEY=... node scripts/generate-roadmap-scenes.mjs [pathKey]
//
// Output: public/roadmap-scenes/<pathKey>.png  (360x180 — fills W x ~HORIZON).

import { mkdir, writeFile } from 'node:fs/promises';

const API = 'https://api.pixellab.ai/v1';
const KEY = process.env.PIXELLAB_API_KEY;
if (!KEY) { console.error('PIXELLAB_API_KEY not set.'); process.exit(1); }

const OUT = 'public/roadmap-scenes';
const SIZE = { width: 360, height: 180 }; // W=360, ~HORIZON=168 + buffer

const STYLE =
  'retro pixel art game parallax background, side-view distant landscape, ' +
  'crisp pixels, no anti-aliasing, horizontal banner, a smooth clean gradient ' +
  'dusk twilight sky in the upper area fading evenly down to layered silhouettes ' +
  'of distant mountains and hills along the bottom horizon, atmospheric depth, ' +
  'empty scene with no characters, ';

const NEG =
  'horizontal lines, horizontal bands, scanlines, banding, stripes, color banding, ' +
  'dithering stripes, moon, stars, sun, character, person, animal, creature, monster, ' +
  'close-up foreground objects, text, watermark, ui, hud, frame, border';

// Keyed by PATH key. Palettes mirror SCENES in Roadmap.jsx.
const PROVINCES = {
  fundamentals: `${STYLE} deep teal sky #1B3F4E fading to a warm amber horizon #E8A36A, ` +
    'layers of green forested hills and distant mountains in silhouette',
  devops: `${STYLE} industrial sunset sky from purple #2A1F3A down to burnt orange #E07E3A, ` +
    'jagged grey-purple mountain silhouettes, a few faint distant smokestacks',
  mlops: `${STYLE} mystic twilight sky from deep purple #1F0F3A to glowing gold #F5B842 horizon, ` +
    'layered purple mountain silhouettes wrapped in faint magical haze',
  swe: `${STYLE} cool blue twilight sky #0E1F3E fading to soft pale blue #8FB5D8 horizon, ` +
    'calm layered distant blue mountain ridges',
  mleng: `${STYLE} deep night sky #05030E fading to a bioluminescent teal glow #5ED8B8 at the horizon, ` +
    'distant dark mountain silhouettes',
  faang: `${STYLE} regal twilight sky from royal purple #1A0E2E to warm gold #F5B842 horizon, ` +
    'grand layered distant mountain silhouettes',
  fullstack: `${STYLE} blue-to-cyan dusk sky #1A1F3A fading to bright cyan #7AC2D8 horizon, ` +
    'layered rolling hills and distant ridges',
  cybersec: `${STYLE} ominous near-black sky #0A0810 fading to a dark red glow #2E1A14 at the horizon, ` +
    'sharp dark jagged mountain silhouettes',
};

async function generate(key, prompt) {
  console.log(`→ ${key} (${SIZE.width}x${SIZE.height})`);
  const res = await fetch(`${API}/generate-image-pixflux`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      description: prompt,
      negative_description: NEG,
      image_size: SIZE,
      no_background: false,
      view: 'side',
    }),
  });
  if (!res.ok) throw new Error(`${key}: HTTP ${res.status} ${await res.text()}`);
  const data = await res.json();
  const b64 = data.image?.base64 ?? data.image;
  await writeFile(`${OUT}/${key}.png`, Buffer.from(b64, 'base64'));
  console.log(`  ✓ ${OUT}/${key}.png`);
}

await mkdir(OUT, { recursive: true });
const only = process.argv[2];
const entries = only ? [[only, PROVINCES[only]]] : Object.entries(PROVINCES);
if (only && !PROVINCES[only]) {
  console.error(`Unknown province '${only}'. Keys: ${Object.keys(PROVINCES).join(', ')}`);
  process.exit(1);
}
for (const [k, v] of entries) {
  await generate(k, v); // sequential — be kind to the API
}
console.log('Done.');
