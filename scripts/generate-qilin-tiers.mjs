// Regenerate the qilin (unicorn) T3/T4 to MATCH the T2 adult qilin's look:
// a jade-GREEN scaled dragon-deer chimera with an ORANGE-and-gold flame mane
// and tail. PixFlux with a tight description (BitForge style-transfer produced
// noise here). No horse/pegasus drift.
//
// Usage: PIXELLAB_API_KEY=... node scripts/generate-qilin-tiers.mjs [t3|t4]
// Output: public/beasts/anim/unicorn_t3|t4/0.png

import { writeFile, mkdir } from 'node:fs/promises';

const API = 'https://api.pixellab.ai/v1';
const KEY = process.env.PIXELLAB_API_KEY;
if (!KEY) { console.error('PIXELLAB_API_KEY not set.'); process.exit(1); }

const STYLE =
  'retro pixel art game sprite, crisp hard edges, no anti-aliasing, full body, ' +
  'side 3/4 view, centered on transparent background, dramatic rim light';
const NEG = 'horse, pony, pegasus, wings, winged, gold horse, human, rider, text, watermark, frame, border';

const TIERS = {
  t3: `${STYLE}. A greater jade qilin (kirin) at full power — a FOUR-LEGGED dragon-deer chimera with a JADE-GREEN scaled body, a dragon-like head, golden deer ANTLERS, and a long flowing mane and tail of bright ORANGE-and-gold FLAME. Fierce and noble. It is NOT a horse and has NO wings`,
  t4: `${STYLE}. A celestial jade qilin (kirin), the Prime form — a radiant FOUR-LEGGED dragon-deer chimera with a jade-green and gold scaled body, a dragon head, magnificent golden ANTLERS, a blazing mane and tail of ORANGE-gold spirit-fire, and a halo of auspicious light. NOT a horse, NO wings`,
};

async function gen(t) {
  console.log(`→ unicorn ${t}`);
  const res = await fetch(`${API}/generate-image-pixflux`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      description: TIERS[t],
      negative_description: NEG,
      image_size: { width: 200, height: 200 },
      no_background: true,
      view: 'side',
    }),
  });
  if (!res.ok) throw new Error(`${t}: HTTP ${res.status} ${await res.text()}`);
  const data = await res.json();
  const b64 = data.image?.base64 ?? data.image;
  await mkdir(`public/beasts/anim/unicorn_${t}`, { recursive: true });
  await writeFile(`public/beasts/anim/unicorn_${t}/0.png`, Buffer.from(b64, 'base64'));
  console.log(`  ✓ unicorn_${t}/0.png  usage:`, JSON.stringify(data.usage));
}

for (const t of (process.argv[2] ? [process.argv[2]] : ['t3', 't4'])) await gen(t);
console.log('Done.');

