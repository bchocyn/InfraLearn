// Generate 10 Pegasus redesign OPTIONS via PixelLab (object-style, no humanoid).
//
// Usage:
//   PIXELLAB_API_KEY=... node scripts/generate-pegasus-options.mjs [optionKey]
//
// Reads the key from the environment ONLY — never hardcode it here.
// Uses /v1/generate-image-pixflux (plain text→pixel-art, no character rig) so
// every result is a true quadruped winged horse, never a humanoid blob.
// Outputs RGBA PNGs to public/beasts/pegasus-options/NN_<key>.png for review.

import { mkdir, writeFile } from 'node:fs/promises';

const API = 'https://api.pixellab.ai/v1';
const KEY = process.env.PIXELLAB_API_KEY;
if (!KEY) {
  console.error('PIXELLAB_API_KEY not set.');
  process.exit(1);
}

const OUT = 'public/beasts/pegasus-options';

// Shared style line — a hero 3/4 side view so the WINGS and full quadruped
// form read clearly for picking a design (the chosen one is re-cut to the
// idle pose later). Repeatedly insists on four-legged horse, never humanoid.
const STYLE =
  'retro pixel art game sprite, crisp hard edges, no anti-aliasing, ' +
  'a majestic winged horse, full body, four legs, side 3/4 view, ' +
  'large feathered wings spread wide, flowing mane and tail, ' +
  'centered on transparent background, limited palette, dramatic warm rim light';

// Negation goes HERE, never in `description` — pixflux reads the positive
// prompt literally, so words like "unicorn horn" in the description draw a
// horn instead of suppressing it. Keep all "don't draw this" terms in NEG.
const NEG =
  'unicorn, horn, unicorn horn, spiral horn, antlers, forehead spike, ' +
  'human, rider, person, humanoid, anthropomorphic, standing on two legs, ' +
  'armor, saddle, weapon';

const OPTIONS = {
  tianma: {
    name: '01 Tianma — Heavenly Horse',
    prompt:
      `${STYLE}. Celestial Chinese tianma: pearl silver-white coat #EAEFF5, ` +
      'wings of pale cyan spirit-flame #8FE3E0 instead of plain feathers, ' +
      'cloud-scroll motifs swirling on the flanks, mane and tail like flowing ' +
      'star-flecked mist #BFE6FF, faint golden hoof glow, serene cosmic aura',
  },
  storm: {
    name: '02 Storm Charger',
    prompt:
      `${STYLE}. Storm pegasus: stormy slate-grey coat #5B6670, wings made of ` +
      'dense thundercloud feathers #8A95A1 with crackling lightning arcs threaded ' +
      'through them, electric-blue glowing eyes #4FC3F7, mane and tail snapping ' +
      'like wind-whipped lightning, charged static sparks around the hooves',
  },
  solar: {
    name: '03 Solar Empyrean',
    prompt:
      `${STYLE}. Radiant solar pegasus: brilliant white-gold coat #FFF3D6, ` +
      'wings of blazing sunfire feathers #FFB347 fading to white-hot tips, ' +
      'molten-gold hooves #E0A030, mane and tail like rippling solar flares ' +
      '#FFD24A, a soft halo of light, divine and luminous',
  },
  glacial: {
    name: '04 Glacial',
    prompt:
      `${STYLE}. Frost pegasus: pale icy blue-white coat #DCEBF5, wings formed ` +
      'of translucent crystalline ice shards #ABD4E8 catching light like glass, ' +
      'frost-rimed mane and tail #F0F8FF, glittering snow dusting the coat, ' +
      'a faint shimmering aurora behind it, cold pale-blue eyes',
  },
  verdant: {
    name: '05 Verdant Spring',
    prompt:
      `${STYLE}. Nature pegasus: soft moss-green and cream coat #A7C284, ` +
      'feathered wings tipped with fresh green leaves and pink petals #E89BB0, ' +
      'mane and tail woven with curling vines and small blossoms, living-wood ' +
      'hoof markings, gentle springtime aura, warm earthy palette',
  },
  obsidian: {
    name: '06 Obsidian Wraith',
    prompt:
      `${STYLE}. Dark spectral pegasus, ORGANIC not mechanical: smoky obsidian-black ` +
      'coat #1C1A22 with a faint smoke-wisp body edge, mane and tail of glowing ' +
      'violet embers #9B59E0, dark feathered wings edged in purple flame, ' +
      'purple-glowing eyes #B388FF, drifting ash motes, eerie and regal',
  },
  astral: {
    name: '07 Astral Cosmic',
    prompt:
      `${STYLE}. Cosmic pegasus: deep indigo coat #2A2350 speckled with tiny ` +
      'stars, wings made of swirling galaxy nebula #6C4FB5 with pink and teal ' +
      'star-clouds, mane and tail like flowing constellations #BFA8FF connected ' +
      'by faint star-lines, glowing white star-point eyes, void-touched aura',
  },
  gilded: {
    name: '08 Gilded Royal',
    prompt:
      `${STYLE}. Regal pegasus: ivory white coat #F6F1E3 with ornate natural ` +
      'gold filigree markings #D4AF37 swirling across the body (markings, NOT ' +
      'armor), peacock-iridescent wings shimmering teal-gold-violet, a small ' +
      'jeweled gem on the brow, braided gold-threaded mane, noble bearing',
  },
  embermane: {
    name: '09 Embermane — Phoenix-touched',
    prompt:
      `${STYLE}. Fire pegasus: deep crimson-chestnut coat #8C3B2E, wings of ` +
      'warm orange-gold feathers #F08A24 with glowing ember tips, mane and tail ' +
      'made of living flame #FF6B2C licking upward, smoldering hoof prints, ' +
      'heat-shimmer aura, fierce burning eyes #FFB347',
  },
  tidal: {
    name: '10 Tidal',
    prompt:
      `${STYLE}. Water pegasus: teal-and-pearl coat #7FC4C9, wings of sleek ` +
      'fin-feathers #4FA3A8 with translucent web membranes, mane and tail of ' +
      'cresting foam-white water #EAF7F5 trailing droplets, seafoam-glow hooves, ' +
      'a cool aquatic aura, calm bright eyes',
  },
};

async function generate(key, { name, prompt }) {
  console.log(`→ ${name}`);
  const res = await fetch(`${API}/generate-image-pixflux`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      description: prompt,
      negative_description: NEG,
      image_size: { width: 128, height: 128 },
      no_background: true,
    }),
  });
  if (!res.ok) throw new Error(`${name}: HTTP ${res.status} ${await res.text()}`);
  const data = await res.json();
  const b64 = data.image?.base64 ?? data.image;
  const n = name.slice(0, 2);
  const file = `${OUT}/${n}_${key}.png`;
  await writeFile(file, Buffer.from(b64, 'base64'));
  console.log(`  ✓ ${file}`);
}

await mkdir(OUT, { recursive: true });
const only = process.argv[2];
const entries = only ? [[only, OPTIONS[only]]] : Object.entries(OPTIONS);
if (only && !OPTIONS[only]) {
  console.error(`Unknown option '${only}'. Keys: ${Object.keys(OPTIONS).join(', ')}`);
  process.exit(1);
}
for (const [k, v] of entries) {
  await generate(k, v); // sequential — be kind to the API
}
console.log('Done.');
