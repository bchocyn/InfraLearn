// Generate idle loops for the STATIC beast tiers — the T3/T4 hero sprites
// (and sphinx's static T2 lamassu) that today play as 1-frame "animations",
// so exactly the most-invested users see a frozen companion. Skeleton-free
// /animate-with-text pipeline: reads <dir>/0.png as the anchor, writes the
// returned frames back as 0..(k-1).png.
//
// The reference sprite is PINNED as frame 0 via inpainting_images — the model
// generates frames 1..3 around it. reference_image alone regressed server-side
// (2026-07: returns valid-but-blank frames), and init_images 422s on the
// server's own internal validation, so the inpainting pin is the reliable path.
//
// Usage:
//   PIXELLAB_API_KEY=... node scripts/animate-beast-tiers.mjs [key ...]
//   (no args = all targets; keys like dragon_t3 run a subset)
//
// The API caps animate-with-text at 64x64, so the 200px heroes are downscaled
// to 64 first (same trade the shipped pegasus loops made; originals stay in
// git history). Each call costs one generation — check /v1/balance first.
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

// desc DESCRIBES the pinned frame-0 art (hand-audited against every sprite) so
// the generated frames drift with it instead of fighting it — the old descs
// were written from the species theme and clashed on color (dragon said
// "molten ember", the art is a jade storm dragon).
const TARGETS = {
  dragon_t3:   { dir: 'public/beasts/anim/dragon_t3',   desc: 'jade storm dragon coiled among clouds, teal-green scales, golden antlers, clutching a glowing pearl' },
  dragon_t4:   { dir: 'public/beasts/anim/dragon_t4',   desc: 'celestial jade emperor dragon, teal scales, golden antlers, radiant pearl, wreathed in clouds and golden lightning' },
  phoenix_t3:  { dir: 'public/beasts/anim/phoenix_t3',  desc: 'golden firebird phoenix, orange-gold flame plumage, crimson tail feathers, standing proud' },
  phoenix_t4:  { dir: 'public/beasts/anim/phoenix_t4',  desc: 'ascended white-gold phoenix, pale radiant plumage, flowing fire tail, rampant pose' },
  hydra_t3:    { dir: 'public/beasts/anim/hydra_t3',    desc: 'five-headed sea hydra, dark navy serpent necks with green stripes, rising from churning water' },
  hydra_t4:    { dir: 'public/beasts/anim/hydra_t4',    desc: 'royal blue many-headed hydra leviathan, coiled serpent necks, rising from white surf' },
  wyvern_t3:   { dir: 'public/beasts/anim/wyvern_t3',   desc: 'green-scaled earth wyvern, blue crystal spines and crest, magenta leathery wings' },
  wyvern_t4:   { dir: 'public/beasts/anim/wyvern_t4',   desc: 'regal purple mountain wyvern, golden underbelly, vast purple wings, pale spine ridge' },
  cerberus_t3: { dir: 'public/beasts/anim/cerberus_t3', desc: 'midnight-purple three-headed hound, blue-flame side heads, golden ember cracks, glowing blue chest gem' },
  cerberus_t4: { dir: 'public/beasts/anim/cerberus_t4', desc: 'obsidian hellhound titan, blue underworld flame mane and tail, molten orange cracks through dark hide, blazing chest gem' },
  griffin_t3:  { dir: 'public/beasts/anim/griffin_t3',  desc: 'sapphire-blue storm griffin, golden beak, lightning crackling around its wings' },
  griffin_t4:  { dir: 'public/beasts/anim/griffin_t4',  desc: 'indigo sovereign griffin, flowing white mane, golden chain regalia, crown of golden lightning' },
  kraken_t3:   { dir: 'public/beasts/anim/kraken_t3',   desc: 'deep blue-purple kraken octopus, coiled tentacles, glowing orange eyes' },
  kraken_t4:   { dir: 'public/beasts/anim/kraken_t4',   desc: 'violet leviathan kraken, magenta-crowned bulbous head, many writhing tentacles, glowing pink eyes' },
  unicorn_t3:  { dir: 'public/beasts/anim/unicorn_t3',  desc: 'jade-green scaled qilin, branching antlers, flowing orange flame mane and tail, embers at its hooves' },
  unicorn_t4:  { dir: 'public/beasts/anim/unicorn_t4',  desc: 'celestial jade qilin, golden branching antlers, orange spirit-flame mane, fire wisps at its feet' },
  pegasus_t3:  { dir: 'public/beasts/anim/pegasus_t3',  desc: 'obsidian shadow warhorse rearing, dark violet wings, purple flame wisps at mane tail and hooves, glowing purple eyes' },
  pegasus_t4:  { dir: 'public/beasts/anim/pegasus_t4',  desc: 'royal purple shadow monarch warhorse, vast dark wings etched with glowing runes, flowing pink-violet flame mane and tail' },
  sphinx_t3:   { dir: 'public/beasts/anim/sphinx_t3',   desc: 'regal winged lion sphinx, golden-orange body, crimson and gold feathered wings' },
  sphinx_t4:   { dir: 'public/beasts/anim/sphinx_t4',   desc: 'radiant white sphinx, golden mane, white-and-gold feathered wings, sun-disk halo, flame-tipped tail' },
  // sphinx's adult (T2) lamassu shipped static — animate it too.
  sphinx_t2:   { dir: 'public/beasts/anim/sphinx_idle', desc: 'tan-gold winged lion lamassu, deep crimson mane and wings, ornate gold collar and banding' },
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

const SIZE = 64; // API max for animate-with-text

async function callOnce(key, t, ref) {
  const res = await fetch(`${API}/animate-with-text`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image_size: { width: SIZE, height: SIZE },
      description: t.desc,
      action: ACTION,
      view: 'side',
      direction: 'west',
      n_frames: 4,
      reference_image: { base64: ref },
      // Pin the sprite as frame 0 — without this the model generates from
      // nothing and returns blank frames (see header).
      inpainting_images: [{ type: 'base64', base64: ref }, null, null, null],
      image_guidance_scale: 3.0,
      text_guidance_scale: 7.5,
    }),
  });
  if (!res.ok) throw new Error(`${key}: HTTP ${res.status} ${await res.text()}`);
  const data = await res.json();
  console.log('  usage:', JSON.stringify(data.usage));
  const imgs = data.images || [];
  if (imgs.length === 0) throw new Error(`${key}: no frames returned`);
  return imgs.map((img) => Buffer.from(img?.base64 ?? img, 'base64'));
}

async function animate(key, t) {
  const original = await readFile(`${t.dir}/0.png`);
  console.log(`→ ${key}`);
  const ref = resize(original, SIZE).toString('base64');
  // The blank-frame failure is intermittent (seed defaults to random), so a
  // fresh attempt usually lands — retry once before giving up on a target.
  let frames = await callOnce(key, t, ref);
  const isBlank = (fs) => fs.some((f) => f.length < 1024);
  if (isBlank(frames)) {
    console.log(`  blank frames (${frames.map((f) => f.length).join(', ')} B) — retrying once`);
    frames = await callOnce(key, t, ref);
  }
  // Refuse to overwrite the hero sprite with blank output — a real 64px frame
  // is several KB; the 2026-07 regression returned ~96 B empty PNGs.
  if (isBlank(frames)) throw new Error(`${key}: blank frames after retry (${frames.map((f) => f.length).join(', ')} B) — not writing`);
  await mkdir(t.dir, { recursive: true });
  for (let i = 0; i < frames.length; i++) {
    await writeFile(`${t.dir}/${i}.png`, frames[i]);
  }
  console.log(`  ✓ ${frames.length} frames @ ${SIZE}px → ${t.dir}/0..${frames.length - 1}.png`);
  return { key, frames: frames.length };
}

const picked = process.argv.slice(2);
const entries = picked.length
  ? picked.map((k) => { if (!TARGETS[k]) { console.error(`Unknown target ${k}`); process.exit(1); } return [k, TARGETS[k]]; })
  : Object.entries(TARGETS);

// One flaky target must not abort the sweep — collect failures, report at the
// end, exit non-zero so CI/wrappers still see the run as incomplete.
const results = [];
const failures = [];
for (const [k, t] of entries) {
  try {
    results.push(await animate(k, t));
  } catch (err) {
    console.error(`  ✗ ${err.message}`);
    failures.push(k);
  }
}
if (failures.length) {
  console.error(`\nFAILED targets (re-run these): ${failures.join(' ')}`);
  process.exitCode = 1;
}
console.log('\nWire into src/data/beastAnims.js:');
for (const r of results) {
  console.log(`  ${r.key}: { folder: '${TARGETS[r.key].dir.split('/').pop()}', frames: ${r.frames}, fps: 6 }`);
}
console.log('\nThen: node scripts/quantize-map-art.mjs ' + results.map((r) => TARGETS[r.key].dir.replace('public/', '')).join(' '));
