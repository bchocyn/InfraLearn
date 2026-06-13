// Throwaway: generate 4 Sphinx design variations to pick from. Outputs to
// /tmp/sphinx-opts/ (not the repo) — the chosen one gets rolled into the
// sphinx tiers afterward. PIXELLAB_API_KEY required.
import { mkdir, writeFile } from 'node:fs/promises';
const API = 'https://api.pixellab.ai/v1';
const KEY = process.env.PIXELLAB_API_KEY;
if (!KEY) { console.error('PIXELLAB_API_KEY not set.'); process.exit(1); }
const OUT = '/tmp/sphinx-opts';
const STYLE =
  'retro pixel art game sprite, crisp hard edges, no anti-aliasing, full body, ' +
  'side 3/4 view, centered on transparent background, dramatic rim light, ' +
  'NOT humanoid, no human face, a beast';
const NEG = 'human, human face, person, humanoid, rider, text, watermark, frame, rainbow colors';
const OPTS = {
  '01_lamassu': 'an ancient Babylonian lamassu sphinx — a winged lion-bull beast with a fierce bestial regal beast-face (NOT a human face), gold and deep crimson, a curled Mesopotamian beard-mane, engraved cuneiform glyphs, ziggurat motifs',
  '02_giza': 'an Egyptian Sphinx of Giza guardian — a recumbent winged lion of weathered sandstone and gold wearing a striped pharaoh nemes headdress, a calm bestial beast-face (NOT human), ancient monument, muted desert tones',
  '03_mystic': 'a mystic riddle-sphinx — a winged lion beast with a bestial face (NOT human), deep indigo and gold, glowing arcane constellation glyphs across its flanks, starlight feathered wings, glowing golden eyes',
  '04_war': 'a fierce war-sphinx — a battle-scarred winged lion beast with a snarling bestial face (NOT human), dark bronze armor plates, crimson and black, heavy clawed paws, intense glowing eyes',
  '05_obsidian': 'an obsidian shadow-sphinx — a winged lion beast with a bestial face (NOT human), polished black obsidian body veined with molten gold, glowing amber eyes, ominous and regal, gold Egyptian collar',
  '06_solar': 'a radiant solar sphinx — a winged lion beast with a bestial face (NOT human), white-and-gold coat blazing with sun motifs, a halo of golden light, feathered wings tipped with fire, divine and majestic',
  '07_jade': 'a verdant jade sphinx — a winged lion beast with a bestial face (NOT human), jade-green stone body laced with gold and moss, overgrown ancient-ruin look, vines and small leaves, weathered temple guardian',
  '08_amethyst': 'a crystal amethyst sphinx — a winged lion beast with a bestial face (NOT human), a faceted translucent purple-crystal body glowing from within, gem shards along the spine, arcane and luminous',
};
const filter = process.argv.slice(2);
const entries = filter.length ? Object.entries(OPTS).filter(([k]) => filter.includes(k)) : Object.entries(OPTS);
await mkdir(OUT, { recursive: true });
for (const [k, prompt] of entries) {
  console.log(`→ ${k}`);
  const res = await fetch(`${API}/generate-image-pixflux`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ description: `${STYLE}. ${prompt}`, negative_description: NEG, image_size: { width: 200, height: 200 }, no_background: true }),
  });
  if (!res.ok) { console.error(`  HTTP ${res.status} ${await res.text()}`); continue; }
  const data = await res.json();
  await writeFile(`${OUT}/${k}.png`, Buffer.from(data.image?.base64 ?? data.image, 'base64'));
  console.log(`  ✓ ${OUT}/${k}.png`);
}
console.log('Done.');
