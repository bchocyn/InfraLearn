// Throwaway: 6 qilin (kirin) design variations to pick from for T3/T4.
// Outputs to /tmp/qilin-opts/. The chosen one(s) get rolled into the tiers.
import { mkdir, writeFile } from 'node:fs/promises';
const API = 'https://api.pixellab.ai/v1';
const KEY = process.env.PIXELLAB_API_KEY;
if (!KEY) { console.error('PIXELLAB_API_KEY not set.'); process.exit(1); }
const OUT = '/tmp/qilin-opts';
const STYLE =
  'retro pixel art game sprite, crisp hard edges, no anti-aliasing, ' +
  'a qilin / kirin — a FOUR-LEGGED dragon-deer chimera with a dragon head and ' +
  'deer antlers, full body, side 3/4 view, centered on transparent background, ' +
  'dramatic rim light. NOT a horse, NO wings';
const NEG = 'horse, pony, pegasus, wings, winged, human, rider, text, watermark, frame, border';
const OPTS = {
  '1_jade_flame': 'jade-green scaled body, golden antlers, a long flowing mane and tail of orange-and-gold FLAME, classic auspicious qilin',
  '2_azure_dragon': 'a long sinuous azure-blue scaled body like an Eastern dragon, silver antlers, a mane and tail of cyan water-mist, serene and majestic',
  '3_celestial_gold': 'a radiant white-and-gold scaled body, golden antlers, a mane and tail of pure golden light, a halo of auspicious sun-light, divine',
  '4_crimson_fire': 'a deep crimson-and-gold scaled body, gold antlers, a mane and tail of red-orange fire, fierce and powerful',
  '5_emerald_ornate': 'a deep emerald jade body plated with ornate gold filigree, grand golden antlers, a mane of green-and-gold spirit-flame, a regal temple-guardian',
  '6_frost_jade': 'a pale jade-and-white scaled body with frost-blue accents, crystalline antlers, a mane and tail of pale-blue spirit-frost, ethereal',
};
await mkdir(OUT, { recursive: true });
const filter = process.argv.slice(2);
const entries = filter.length ? Object.entries(OPTS).filter(([k]) => filter.includes(k)) : Object.entries(OPTS);
for (const [k, p] of entries) {
  console.log(`→ ${k}`);
  const res = await fetch(`${API}/generate-image-pixflux`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ description: `${STYLE}. ${p}`, negative_description: NEG, image_size: { width: 200, height: 200 }, no_background: true, view: 'side' }),
  });
  if (!res.ok) { console.error(`  HTTP ${res.status} ${await res.text()}`); continue; }
  const data = await res.json();
  await writeFile(`${OUT}/${k}.png`, Buffer.from(data.image?.base64 ?? data.image, 'base64'));
  console.log(`  ✓ ${k}.png`);
}
console.log('Done.');
