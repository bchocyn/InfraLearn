// Regenerate the Pegasus egg to match the Shadow Monarch redesign — an
// obsidian shell with violet glowing cracks/runes, replacing the old black-red
// (mecha) egg. Matches the rest of the set: 64x80 ornate egg on a small base.
//
// Usage:
//   PIXELLAB_API_KEY=... node scripts/generate-pegasus-egg.mjs
//
// Reads the key from the environment ONLY. Uses /v1/generate-image-pixflux.
// Output: public/beasts/eggs/pegasus.png (64x80 RGBA).

import { writeFile } from 'node:fs/promises';

const API = 'https://api.pixellab.ai/v1';
const KEY = process.env.PIXELLAB_API_KEY;
if (!KEY) {
  console.error('PIXELLAB_API_KEY not set.');
  process.exit(1);
}

const OUT = 'public/beasts/eggs/pegasus.png';

const PROMPT =
  'retro pixel art game icon, a single ornate decorative monster egg resting ' +
  'on a small dark stone base, glossy obsidian-black eggshell, electric violet ' +
  'purple glowing cracks and faint glowing runic glyphs across the shell, ' +
  'wisps of dark purple shadow smoke rising from it, eerie purple inner glow ' +
  'leaking through the cracks, dark fantasy, crisp pixel art, ' +
  'centered on transparent background, limited dark purple palette';

const NEG =
  'horse, pegasus, animal, creature, wings, hatchling, face, eyes, ' +
  'horn, unicorn, human, person, text, watermark, multiple eggs, frame';

const res = await fetch(`${API}/generate-image-pixflux`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    description: PROMPT,
    negative_description: NEG,
    image_size: { width: 64, height: 80 },
    no_background: true,
  }),
});
if (!res.ok) throw new Error(`HTTP ${res.status} ${await res.text()}`);
const data = await res.json();
const b64 = data.image?.base64 ?? data.image;
await writeFile(OUT, Buffer.from(b64, 'base64'));
console.log(`✓ ${OUT}`);
