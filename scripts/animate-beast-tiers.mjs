// Generate idle loops for the STATIC beast tiers — the T3/T4 hero sprites
// (and sphinx's static T2 lamassu) that today play as 1-frame "animations",
// so exactly the most-invested users see a frozen companion. Same skeleton-
// free /animate-with-text pipeline as animate-pegasus.mjs, generalized:
// reads <dir>/0.png as the anchor, writes the returned frames back as
// 0..(k-1).png.
//
// Usage:
//   PIXELLAB_API_KEY=... node scripts/animate-beast-tiers.mjs [key ...]
//   (no args = all targets; keys like dragon_t3 run a subset)
//
// Tries the full 200x200 canvas first; if the server rejects the size, falls
// back to the 64x64 downscale the pegasus loops shipped with. Each call
// costs credits — usage prints per call; check /v1/balance first.
//
// Afterwards:
//   1. Wire each target in src/data/beastAnims.js: { folder, frames: <k>, fps: 6 }
//   2. node scripts/quantize-map-art.mjs beasts/anim/<folder> ...
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { Resvg } from '@resvg/resvg-js';

const API = 'https://api.pixellab.ai/v1';
const KEY = process.env.PIXELLAB_API_KEY;
if (!KEY) { console.error('PIXELLAB_API_KEY not set.'); process.exit(1); }

// Shared idle action — matches the motion language of the shipped T1/T2 loops.
const ACTION =
  'gentle looping idle: a soft up-and-down breathing bob in place, subtle drift ' +
  'of flames, wings, tails or manes, stays perfectly centered, no walking, ' +
  'returns to the starting pose';

// desc guides the model alongside the reference sprite (image_guidance 3.0
// keeps identity; the words keep the motion on-theme per creature).
const TARGETS = {
  dragon_t3:   { dir: 'public/beasts/anim/dragon_t3',   desc: 'majestic adult fire dragon Infernath, molten ember body, sweeping horns, smoldering wings' },
  dragon_t4:   { dir: 'public/beasts/anim/dragon_t4',   desc: 'celestial emperor dragon Infernath Prime, radiant inferno aura, colossal wings, regal pose' },
  phoenix_t3:  { dir: 'public/beasts/anim/phoenix_t3',  desc: 'blazing solar phoenix Solaris, golden flame plumage, long fire tail feathers' },
  phoenix_t4:  { dir: 'public/beasts/anim/phoenix_t4',  desc: 'ascended solar phoenix Solaris Prime, white-gold corona of fire, radiant halo' },
  hydra_t3:    { dir: 'public/beasts/anim/hydra_t3',    desc: 'many-headed sea hydra Heptyr, teal scales, coiling serpent necks' },
  hydra_t4:    { dir: 'public/beasts/anim/hydra_t4',    desc: 'abyssal royal hydra Heptyr Prime, crowned heads, deep-sea glow' },
  wyvern_t3:   { dir: 'public/beasts/anim/wyvern_t3',   desc: 'earthen mountain wyvern Terravyrn, stone-plated hide, craggy wings' },
  wyvern_t4:   { dir: 'public/beasts/anim/wyvern_t4',   desc: 'ancient tectonic wyvern Terravyrn Prime, glowing magma seams in stone armor' },
  cerberus_t3: { dir: 'public/beasts/anim/cerberus_t3', desc: 'three-headed guardian hound Cerberus, dark fur, ember eyes, stone collar' },
  cerberus_t4: { dir: 'public/beasts/anim/cerberus_t4', desc: 'mythic warden Cerberus Prime, three armored heads, molten underglow' },
  griffin_t3:  { dir: 'public/beasts/anim/griffin_t3',  desc: 'storm griffin Stormcrest, eagle head and wings, lion body, crackling sky energy' },
  griffin_t4:  { dir: 'public/beasts/anim/griffin_t4',  desc: 'tempest sovereign griffin Stormcrest Prime, lightning-laced plumage, regal crest' },
  kraken_t3:   { dir: 'public/beasts/anim/kraken_t3',   desc: 'abyssal kraken Abyssal, massive coiled tentacles, deep teal glow' },
  kraken_t4:   { dir: 'public/beasts/anim/kraken_t4',   desc: 'leviathan kraken Abyssal Prime, bioluminescent tentacle crown, ocean-deep aura' },
  unicorn_t3:  { dir: 'public/beasts/anim/unicorn_t3',  desc: 'mystic qilin, jade antlers, flowing mane of aurora light, scaled deer-horse body' },
  unicorn_t4:  { dir: 'public/beasts/anim/unicorn_t4',  desc: 'celestial qilin prime, radiant jade and gold body, drifting aurora mane' },
  sphinx_t3:   { dir: 'public/beasts/anim/sphinx_t3',   desc: 'fiery riddle sphinx Enigmara, lion body, burning wings, enigmatic gaze' },
  sphinx_t4:   { dir: 'public/beasts/anim/sphinx_t4',   desc: 'solar Ra-sphinx Enigmara Prime, sun-disk crown, golden radiance' },
  // sphinx's adult (T2) lamassu shipped static — animate it too.
  sphinx_t2:   { dir: 'public/beasts/anim/sphinx_idle', desc: 'Babylonian lamassu sphinx Riddlepaw, winged lion with gold chain ornament' },
};

// Downscale a PNG buffer to size x size by rasterizing it inside an SVG
// <image> (resvg is the only image lib on hand — same trick as the pegasus
// script).
function resize(pngBuf, size) {
  const b64 = pngBuf.toString('base64');
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${size}" height="${size}">` +
    `<image xlink:href="data:image/png;base64,${b64}" href="data:image/png;base64,${b64}" ` +
    `x="0" y="0" width="${size}" height="${size}" preserveAspectRatio="xMidYMid meet"/></svg>`;
  return new Resvg(svg).render().asPng();
}

async function call(size, refB64, desc) {
  const res = await fetch(`${API}/animate-with-text`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image_size: { width: size, height: size },
      description: desc,
      action: ACTION,
      view: 'side',
      direction: 'west',
      n_frames: 4,
      reference_image: { base64: refB64 },
      image_guidance_scale: 3.0,
      text_guidance_scale: 7.5,
    }),
  });
  return res;
}

async function animate(key, t) {
  const original = await readFile(`${t.dir}/0.png`);
  console.log(`→ ${key}`);
  // Full-size first; fall back to the pegasus-proven 64px on a size rejection.
  let size = 200;
  let res = await call(size, original.toString('base64'), t.desc);
  if (res.status === 422 || res.status === 400) {
    const msg = await res.text();
    console.log(`  ${res.status} at 200px (${msg.slice(0, 80)}…) — retrying at 64px`);
    size = 64;
    res = await call(size, resize(original, 64).toString('base64'), t.desc);
  }
  if (!res.ok) throw new Error(`${key}: HTTP ${res.status} ${await res.text()}`);
  const data = await res.json();
  console.log('  usage:', JSON.stringify(data.usage));
  const imgs = data.images || [];
  if (imgs.length === 0) throw new Error(`${key}: no frames returned`);
  await mkdir(t.dir, { recursive: true });
  for (let i = 0; i < imgs.length; i++) {
    const b64 = imgs[i]?.base64 ?? imgs[i];
    await writeFile(`${t.dir}/${i}.png`, Buffer.from(b64, 'base64'));
  }
  console.log(`  ✓ ${imgs.length} frames @ ${size}px → ${t.dir}/0..${imgs.length - 1}.png`);
  return { key, frames: imgs.length, size };
}

const picked = process.argv.slice(2);
const entries = picked.length
  ? picked.map((k) => { if (!TARGETS[k]) { console.error(`Unknown target ${k}`); process.exit(1); } return [k, TARGETS[k]]; })
  : Object.entries(TARGETS);

const results = [];
for (const [k, t] of entries) {
  results.push(await animate(k, t));
}
console.log('\nWire into src/data/beastAnims.js:');
for (const r of results) {
  console.log(`  ${r.key}: { folder: '${TARGETS[r.key].dir.split('/').pop()}', frames: ${r.frames}, fps: 6 }`);
}
console.log('\nThen: node scripts/quantize-map-art.mjs ' + results.map((r) => TARGETS[r.key].dir.replace('public/', '')).join(' '));
