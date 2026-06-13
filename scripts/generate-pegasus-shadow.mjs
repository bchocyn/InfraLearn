// Generate Pegasus "Shadow Monarch" variants via PixelLab — the Solo Leveling
// shadow-soldier texture: a winged warhorse made of living shadow, obsidian
// black with electric-violet glow, smoke-wisp edges, glowing purple eyes.
//
// Usage:
//   PIXELLAB_API_KEY=... node scripts/generate-pegasus-shadow.mjs [variantKey]
//
// Reads the key from the environment ONLY — never hardcode it here.
// Uses /v1/generate-image-pixflux (plain text→pixel-art, no character rig) so
// every result is a true quadruped winged horse, never a humanoid.
// Outputs RGBA PNGs to public/beasts/pegasus-shadow/NN_<key>.png.

import { mkdir, writeFile } from 'node:fs/promises';

const API = 'https://api.pixellab.ai/v1';
const KEY = process.env.PIXELLAB_API_KEY;
if (!KEY) {
  console.error('PIXELLAB_API_KEY not set.');
  process.exit(1);
}

const OUT = 'public/beasts/pegasus-shadow';

// Shared texture line — the Shadow Monarch's summoned-soldier look baked in:
// solidified shadow body, smoke-wisp edges, electric-violet glow, purple rim
// light. Hero 3/4 side view so wings + form read for picking a direction.
const STYLE =
  'retro pixel art game sprite, crisp hard edges, no anti-aliasing, ' +
  'a majestic winged warhorse, full body, four legs, side 3/4 view, ' +
  'large wings spread wide, flowing mane and tail, ' +
  'a summoned shadow soldier made of solidified living shadow, ' +
  'deep obsidian black body #0C0A14 with wisping dark smoke at the edges, ' +
  'electric violet purple energy #9B30FF, glowing purple eyes with no pupils, ' +
  'dark fantasy, dramatic violet rim lighting, ' +
  'centered on transparent background, limited dark palette';

// Negation: keep horn/unicorn/human out (pixflux reads the description
// literally). Note: armor is WANTED on some variants, so it is not negated.
const NEG =
  'unicorn, horn, unicorn horn, spiral horn, antlers, forehead spike, ' +
  'human, rider, person, humanoid, anthropomorphic, standing on two legs, ' +
  'bright colors, daylight, cute';

const VARIANTS = {
  wraith: {
    name: '01 Shade Wraith — raw shadow',
    prompt:
      `${STYLE}. Raw unarmored summon: the whole body is living shadow ` +
      'dissolving into rising black smoke at the hooves and wingtips, wings ' +
      'made of dark smoke edged in electric purple light, mane and tail of ' +
      'cold violet shadow-flame, faint glowing purple cracks across the flank',
  },
  knight: {
    name: '02 Shadow Knight steed — barded',
    prompt:
      `${STYLE}. An armored cavalry mount: fitted with spectral black plate ` +
      'barding — a spiked chanfron over the head and a peytral across the chest ' +
      '— every armor seam glowing with electric purple light, dark feathered ' +
      'wings with violet-lit edges, disciplined menacing war-steed bearing',
  },
  monarch: {
    name: '03 Monarch\'s mount — runic',
    prompt:
      `${STYLE}. The Shadow Monarch's personal mount, regal and ornate: ` +
      'intricate glowing violet runic glyphs and a faint shadow magic-circle ' +
      'tracing across the obsidian body, a small crown of dark purple flame ' +
      'between the ears, grand feathered wings lit from within by purple light',
  },
  revenant: {
    name: '04 Ashen Revenant — dissolving',
    prompt:
      `${STYLE}. Caught mid-summon and half-ethereal: the rear of the body ` +
      'dissolves into a trailing swarm of rising shadow particles and violet ' +
      'sparks, translucent smoky form, a purple-to-blue-white glow gradient, ' +
      'wings of dispersing dark energy, eerie and weightless',
  },
  violetflame: {
    name: '05 Violet Ember — purple flame',
    prompt:
      `${STYLE}. Wreathed in cold purple shadow-fire: black body sheathed in ` +
      'licking violet flames, the mane and tail are pure purple fire, glowing ' +
      'violet hooves leaving burning shadow-flame prints, blue-white glowing ' +
      'eyes, wings of dark feathers tipped with purple fire',
  },
  crimson: {
    name: '06 Crimson-touched — Igris accent',
    prompt:
      `${STYLE}. An elite shadow soldier with Igris-style crimson accents: ` +
      'obsidian black body with electric purple glow, but the eyes burn deep ' +
      'crimson #C8102E and the wing edges and armor seams glow red, a few red ' +
      'energy wisps among the purple, spectral dark plate on the chest',
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
const entries = only ? [[only, VARIANTS[only]]] : Object.entries(VARIANTS);
if (only && !VARIANTS[only]) {
  console.error(`Unknown variant '${only}'. Keys: ${Object.keys(VARIANTS).join(', ')}`);
  process.exit(1);
}
for (const [k, v] of entries) {
  await generate(k, v); // sequential — be kind to the API
}
console.log('Done.');
