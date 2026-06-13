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

import { mkdir, readFile, writeFile } from 'node:fs/promises';

const API = 'https://api.pixellab.ai/v1';
const KEY = process.env.PIXELLAB_API_KEY;
if (!KEY) {
  console.error('PIXELLAB_API_KEY not set. source ~/.pixellab.env first.');
  process.exit(1);
}

// Consistent style (https://www.pixellab.ai/docs/tools/consistent-style):
// point STYLE_REF at an existing prop PNG and generation switches from
// PixFlux (text-only) to BitForge with that image as the style reference —
// new props inherit the established palette/outline/shading instead of
// re-rolling the look. Example:
//   STYLE_REF=public/map/ruin_arch.png node scripts/generate-map-props.mjs chest
const STYLE_REF = process.env.STYLE_REF || null;

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
    view: 'side', // front-facing set piece — the player walks INTO it
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
    view: 'side', // matches fog_gate — the pair must share a camera
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

  // ── Gamified UI chips ────────────────────────────────────────────────────
  // Stage buttons, the SD gem, the lab hex, the medal and the rating star —
  // rendered straight-on (view: 'side', they're interface elements, not
  // scenery). State variants (locked/dim/socket) are CSS filter classes in
  // theme.css, so one sprite covers every state.
  ui_node_amber: {
    size: [32, 32],
    view: 'side',
    prompt: 'round glossy candy button game UI stage node, golden amber #F5B842 dome with pale cream rim highlight #FFE8B0 along the top edge, darker amber #9C6E1C base shadow underneath, crisp pixel art, centered on transparent background',
  },
  ui_node_dark: {
    size: [32, 32],
    view: 'side',
    prompt: 'round dark recessed stone button game UI locked stage node, sunken near-black #17140F disc with dim grey-brown rim #4D4639, subtle dark depth shadow, crisp pixel art, centered on transparent background',
  },
  ui_gem: {
    size: [32, 32],
    view: 'side',
    prompt: 'diamond-shaped polished blue gem game UI node, steel blue #7B9FB5 faceted rhombus with pale catch-light facet #D8E6F0 on the upper left, dark navy base shadow, crisp pixel art, centered on transparent background',
  },
  ui_hex: {
    size: [32, 32],
    view: 'side',
    prompt: 'hexagonal amber candy button game UI forge node, golden yellow #F5B842 hexagon with bright top facet highlight #FFF3D6, darker amber #9C6E1C base shadow, crisp pixel art, centered on transparent background',
  },
  ui_medal: {
    size: [48, 48],
    view: 'side',
    prompt: 'round golden victory medallion with embossed five-pointed star, polished gold #F5B842 disc, pale cream rim #FFE8B0, dark amber #9C6E1C base shadow, ceremonial game UI seal, crisp pixel art, centered on transparent background',
  },
  ui_star: {
    size: [32, 32],
    view: 'side',
    prompt: 'five-pointed gold rating star game UI icon, warm golden yellow #F5B842 with a small bright glint on the upper left point, thin dark outline, crisp pixel art, centered on transparent background',
  },
  // ── Ground terrain bands ─────────────────────────────────────────────────
  // 360x160px seamless terrain tiles per province, tiled vertically under the
  // trail. Replaces the hand-coded polygon mountains and hills. Generated once,
  // tiled infinitely to match Roadmap height.
  ground_fundamentals: {
    size: [360, 160],
    view: 'high top-down',
    prompt: 'wide ground terrain band for fantasy game roadmap, dark brown soil with grass tufts, small rocks scattered, medieval tile game style, textured ground surface, seamless edges for vertical tiling',
  },
  ground_devops: {
    size: [360, 160],
    view: 'high top-down',
    prompt: 'industrial ground terrain band for devops province, dark grey asphalt with cracks, metal grilles, circuit board patterns, tech-themed road surface, seamless edges for vertical tiling',
  },
  ground_mlops: {
    size: [360, 160],
    view: 'high top-down',
    prompt: 'data science ground terrain band for mlops province, crystalline/digital ground, glowing data nodes, grid pattern overlay, dark teal-grey with cyan accents, seamless edges for vertical tiling',
  },
  ground_swe: {
    size: [360, 160],
    view: 'high top-down',
    prompt: 'rocky mountain pass ground terrain band, alpine gravel and exposed stone, sparse vegetation, peak slopes, seamless edges for vertical tiling',
  },
  ground_mleng: {
    size: [360, 160],
    view: 'high top-down',
    prompt: 'lush forest ground terrain band, moss-covered forest floor, leaves and twigs, dark earth with patches of vibrant moss and ferns, seamless edges for vertical tiling',
  },
  ground_faang: {
    size: [360, 160],
    view: 'high top-down',
    prompt: 'rocky mountain pass ground terrain band, alpine gravel and exposed stone, sparse vegetation, peak slopes, seamless edges for vertical tiling',
  },
  ground_fullstack: {
    size: [360, 160],
    view: 'high top-down',
    prompt: 'rocky mountain pass ground terrain band, alpine gravel and exposed stone, sparse vegetation, peak slopes, seamless edges for vertical tiling',
  },
  ground_cybersec: {
    size: [360, 160],
    view: 'high top-down',
    prompt: 'cybersecurity ground terrain band, dark chrome metal ground with warning lines, red digital trails, lockdown aesthetic, industrial security-themed floor, seamless edges for vertical tiling',
  },
};

async function generate(key, { size, prompt, view }) {
  console.log(`→ ${key} (${size[0]}x${size[1]})`);
  const res = await fetch(`${API}/generate-image-pixflux`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      description: prompt,
      image_size: { width: size[0], height: size[1] },
      no_background: true,
      // Camera height via the dedicated param, not prompt text (per
      // pixellab.ai/docs/options/camera). 'low top-down' (~20°) is the same
      // camera the Beast Tamer characters render under — props and walkers
      // must share one view or the scene's perspective falls apart. Tall
      // front-facing set pieces (fog gates, the ruin arch) may override
      // with view: 'side' per prop.
      view: view || 'low top-down',
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
