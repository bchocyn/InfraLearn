// Generate PixelLab pixel-art backgrounds for the ByteBeast stage scenes,
// replacing the hand-coded geometric SVGs in components/BeastScene.jsx.
// One PNG per BACKGROUNDS id in src/data/content.js.
//
// Usage:
//   PIXELLAB_API_KEY=... node scripts/generate-scenes.mjs [sceneId]
//
// Reads the key from the environment ONLY. Uses /v1/generate-image-pixflux
// with no_background:false (these are full landscape backdrops, not cutout
// sprites) at the stage's 2:1 ratio. Output: public/scenes/<id>.png.

import { mkdir, writeFile } from 'node:fs/promises';

const API = 'https://api.pixellab.ai/v1';
const KEY = process.env.PIXELLAB_API_KEY;
if (!KEY) {
  console.error('PIXELLAB_API_KEY not set.');
  process.exit(1);
}

const OUT = 'public/scenes';
const SIZE = { width: 384, height: 192 }; // 2:1, matches the scene viewBox 400x200

const STYLE =
  'retro pixel art game stage background, side-view scenic landscape, ' +
  'crisp pixels, no anti-aliasing, horizontal banner composition, ' +
  'sky above and ground below, an empty environment with no characters, ';

const NEG =
  'character, person, human, animal, creature, monster, beast, ' +
  'text, watermark, ui, hud, frame, border, vignette, signature';

// Keyed by BACKGROUNDS id. Each mirrors the theme + palette of the SVG it
// replaces (see components/BeastScene.jsx and BACKGROUNDS in content.js).
const SCENES = {
  meadow: `${STYLE} bright blue daytime sky #8FC5E8 with fluffy white clouds, ` +
    'distant blue mountains with white snow caps, lush green grassy meadow ' +
    '#7EB058 in the foreground, peaceful and bright',
  forest: `${STYLE} soft teal morning sky, layered deep green pine forest ` +
    'silhouettes receding into the distance, dark mossy forest floor, calm',
  sunset: `${STYLE} vivid sunset sky fading from warm orange #F5A85E to dusky ` +
    'purple #7E5A8E, a large glowing sun low on the horizon, layered mountain ' +
    'silhouettes, dark foreground ridge',
  flowers: `${STYLE} soft blue sky with a drifting cloud, rolling green hills ` +
    'blanketed in colorful wildflowers (red, yellow, white, purple), cheerful ' +
    'springtime meadow',
  snow: `${STYLE} pale grey-blue winter sky, layered snowy mountains with bright ` +
    'white peaks, snow-covered white ground, cold and serene',
  autumn: `${STYLE} warm amber autumn sky #E89A5E, rolling woods of orange, brown ` +
    'and gold autumn trees, fallen leaves scattered on a brown forest floor',
  twilight: `${STYLE} deep purple twilight sky, a glowing crescent moon and ` +
    'scattered stars, dark blue-purple mountain silhouettes, quiet dusk',
  falls: `${STYLE} lush teal-green forest gorge, a tall waterfall cascading down ` +
    'the center into a misty turquoise pool, pine trees framing both sides',
};

async function generate(id, prompt) {
  console.log(`→ ${id} (${SIZE.width}x${SIZE.height})`);
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
  if (!res.ok) throw new Error(`${id}: HTTP ${res.status} ${await res.text()}`);
  const data = await res.json();
  const b64 = data.image?.base64 ?? data.image;
  await writeFile(`${OUT}/${id}.png`, Buffer.from(b64, 'base64'));
  console.log(`  ✓ ${OUT}/${id}.png`);
}

await mkdir(OUT, { recursive: true });
const only = process.argv[2];
const entries = only ? [[only, SCENES[only]]] : Object.entries(SCENES);
if (only && !SCENES[only]) {
  console.error(`Unknown scene '${only}'. Keys: ${Object.keys(SCENES).join(', ')}`);
  process.exit(1);
}
for (const [k, v] of entries) {
  await generate(k, v); // sequential — be kind to the API
}
console.log('Done.');
