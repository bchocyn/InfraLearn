// Generate the FINAL Pegasus redesign: the purple Shadow Monarch look,
// adult + baby, at 200x200 to match the rest of the beast roster.
//
// Usage:
//   PIXELLAB_API_KEY=... node scripts/generate-pegasus-final.mjs [adult|baby]
//
// Reads the key from the environment ONLY — never hardcode it here.
// Uses /v1/generate-image-pixflux (text->pixel-art, no character rig) so the
// result is a true quadruped winged horse, never humanoid. Writes the single
// idle frame each tier renders (wired frames:1 static in beastAnims.js, since
// object-mode animation needs the PixelLab MCP tool which isn't in this env).

import { mkdir, writeFile } from 'node:fs/promises';

const API = 'https://api.pixellab.ai/v1';
const KEY = process.env.PIXELLAB_API_KEY;
if (!KEY) {
  console.error('PIXELLAB_API_KEY not set.');
  process.exit(1);
}

// Shadow Monarch texture, purple (no crimson, per direction "keep purple").
const STYLE =
  'retro pixel art game sprite, crisp hard edges, no anti-aliasing, ' +
  'a majestic winged warhorse, full body, four legs, side 3/4 view, ' +
  'large wings spread wide, flowing mane and tail, ' +
  'a creature summoned from living shadow, deep obsidian black body #0C0A14 ' +
  'with wisping dark smoke at the edges, electric violet purple glow #9B30FF, ' +
  'glowing purple eyes with no pupils, purple shadow-flame mane and tail, ' +
  'dark fantasy, dramatic violet rim lighting, ' +
  'centered on transparent background, limited dark purple palette';

const NEG =
  'unicorn, horn, unicorn horn, spiral horn, antlers, forehead spike, ' +
  'human, rider, person, humanoid, anthropomorphic, standing on two legs, ' +
  'red, crimson, bright colors, daylight, cute mascot';

const TARGETS = {
  adult: {
    name: 'adult — Nightmare (Shadow Monarch steed)',
    out: 'public/beasts/anim/pegasus_idle/0.png',
    prompt:
      `${STYLE}. Full-grown elite warhorse: powerful and regal, faint glowing ` +
      'violet runic glyphs tracing the obsidian flank, wings of dark feathers ' +
      'lit from within by purple light, purple shadow-fire trailing from the ' +
      'hooves, commanding menacing presence',
  },
  baby: {
    name: 'baby — Shadefoal',
    out: 'public/beasts/anim/pegasus_baby_idle/0.png',
    prompt:
      `${STYLE}. A tiny newborn foal version: small and round with an oversized ` +
      'head and big glowing purple eyes, short stubby little wings, a wispy ' +
      'little purple shadow-flame mane and tail, clumsy and endearing baby ' +
      'shadow colt still wreathed in faint violet smoke',
  },
};

async function generate({ name, out, prompt }) {
  console.log(`→ ${name}`);
  const res = await fetch(`${API}/generate-image-pixflux`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      description: prompt,
      negative_description: NEG,
      image_size: { width: 200, height: 200 },
      no_background: true,
    }),
  });
  if (!res.ok) throw new Error(`${name}: HTTP ${res.status} ${await res.text()}`);
  const data = await res.json();
  const b64 = data.image?.base64 ?? data.image;
  await mkdir(out.replace(/\/[^/]+$/, ''), { recursive: true });
  await writeFile(out, Buffer.from(b64, 'base64'));
  console.log(`  ✓ ${out}`);
}

const only = process.argv[2];
const entries = only ? [TARGETS[only]] : Object.values(TARGETS);
if (only && !TARGETS[only]) {
  console.error(`Unknown target '${only}'. Keys: adult, baby`);
  process.exit(1);
}
for (const t of entries) {
  await generate(t); // sequential — be kind to the API
}
console.log('Done.');
