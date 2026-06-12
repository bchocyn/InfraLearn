// Generate the Roadmap's world-map props via PixelLab — the painted-pixel
// replacements for the hand-coded SVG scenery (polygon pines, rect ruins,
// stroke pillars). One shared twilight set; per-province color comes from
// CSS filters at render time, so 14 generations dress all eight scenes.
//
// Usage:
//   PIXELLAB_API_KEY=... node scripts/generate-map-props.mjs [propKey]
//
// Reads the key from the environment ONLY — never hardcode it here.
// Outputs RGBA PNGs to public/map/<key>.png.

import { mkdir, writeFile } from 'node:fs/promises';

const API = 'https://api.pixellab.ai/v1';
const KEY = process.env.PIXELLAB_API_KEY;
if (!KEY) {
  console.error('PIXELLAB_API_KEY not set. source ~/.pixellab.env first.');
  process.exit(1);
}

// Shared style: every prop must sit on the same dark-twilight stage as the
// existing scene palettes (theme: deep dusk, warm amber accent light) and be
// hue-shiftable — so silhouette-dark bodies with ONE warm accent each.
const STYLE =
  'retro pixel art game asset, crisp hard edges, no anti-aliasing, ' +
  'dark twilight fantasy adventure map prop, centered on transparent background, ' +
  'limited palette, soft warm amber rim light from the left';

const PROPS = {
  pine_a: {
    size: [48, 64],
    prompt: `${STYLE}. A tall dark pine tree, near-black silhouette #0E1410 with subtle blue-green depth shading, faint amber rim light on the left edge, slightly windswept crown`,
  },
  pine_b: {
    size: [40, 56],
    prompt: `${STYLE}. A shorter crooked pine tree, near-black silhouette #101812, one broken drooping branch, faint amber rim light`,
  },
  tree_dead: {
    size: [48, 64],
    prompt: `${STYLE}. A bare dead tree with gnarled twisted branches, charcoal bark #14110D, no leaves, thin amber rim light, ominous but elegant`,
  },
  tree_crystal: {
    size: [48, 64],
    prompt: `${STYLE}. A dark tree with small glowing teal crystal clusters #5ED8B8 growing along its branches, near-black trunk, soft cyan glow`,
  },
  rock_a: {
    size: [32, 32],
    prompt: `${STYLE}. A weathered granite boulder, dark grey #2A2D33 with lighter top facet #4A4E57, small tufts of dark grass at the base`,
  },
  rock_b: {
    size: [32, 32],
    prompt: `${STYLE}. Two small stacked mossy stones, dark grey #262A30, faint green moss #3A4A36 on top`,
  },
  ruin_arch: {
    size: [64, 64],
    prompt: `${STYLE}. A ruined ancient stone waymarker arch, two crumbling pale-grey pillars #8A93A3 with a broken fallen lintel, rubble at the base, faint engraved runes glowing dim amber #F5B842`,
  },
  ruin_pillar: {
    size: [32, 56],
    prompt: `${STYLE}. A single broken ancient column, pale weathered stone #8A93A3, cracked diagonally with the top half missing, ivy creeping up one side`,
  },
  fog_gate: {
    size: [96, 112],
    prompt: `${STYLE}. A tall ominous fog gate: two ruined stone pillars #8A93A3 with a pale ghostly translucent veil of mist #C7D3E0 stretched between them, the veil glowing faintly cold blue-white, dark dread emanating, Elden Ring boss door`,
  },
  grace_lantern: {
    size: [32, 48],
    prompt: `${STYLE}. A small stone shrine lantern on a short pedestal, dark stone body, a warm golden flame #F5B842 glowing inside with gentle light bloom, tiny floating gold motes around it, site of grace`,
  },
  grace_dark: {
    size: [32, 48],
    prompt: `${STYLE.replace('soft warm amber rim light from the left', 'cold dim blue-grey moonlight')}. A small weathered stone pedestal monument with an empty hollow alcove carved in its top, cold dark grey stone #2A2D33, cracked and dusty, abandoned ruin fragment, faint blue-grey #8FA3B8 highlights, nothing inside the alcove`,
  },
  fog_gate_broken: {
    size: [96, 112],
    prompt: `${STYLE}. The shattered remains of a ruined stone gate: two broken pillar stubs #8A93A3, fallen stones and rubble scattered between them, NO mist veil — the fog is gone, open sky visible through the gap, faint warm golden light #F5B842 settling on the rubble, peaceful aftermath`,
  },
  chest: {
    size: [32, 32],
    prompt: `${STYLE}. A small sturdy wooden treasure chest with brass banding #B8860B, closed, dark oak wood #3A2A1C, a soft golden keyhole glint`,
  },
  signpost: {
    size: [32, 48],
    prompt: `${STYLE}. A weathered wooden trail signpost with two arrow-shaped boards pointing in opposite directions, dark wood #3A2E20, faint carved letters, slightly tilted`,
  },
  bush: {
    size: [32, 32],
    prompt: `${STYLE}. A low round shrub, very dark green #16201A silhouette with a few tiny amber berries #F5B842 catching the light`,
  },
};

async function generate(key, { size, prompt }) {
  console.log(`→ ${key} (${size[0]}x${size[1]})`);
  const res = await fetch(`${API}/generate-image-pixflux`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      description: prompt,
      image_size: { width: size[0], height: size[1] },
      no_background: true,
    }),
  });
  if (!res.ok) throw new Error(`${key}: HTTP ${res.status} ${await res.text()}`);
  const data = await res.json();
  const b64 = data.image?.base64 ?? data.image;
  await writeFile(`public/map/${key}.png`, Buffer.from(b64, 'base64'));
  console.log(`  ✓ public/map/${key}.png`);
}

await mkdir('public/map', { recursive: true });
const only = process.argv[2];
const entries = only ? [[only, PROPS[only]]] : Object.entries(PROPS);
if (only && !PROPS[only]) {
  console.error(`Unknown prop '${only}'. Keys: ${Object.keys(PROPS).join(', ')}`);
  process.exit(1);
}
for (const [k, v] of entries) {
  await generate(k, v); // sequential — be kind to the API
}
console.log('Done.');
