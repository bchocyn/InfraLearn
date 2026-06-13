// Animate the redesigned Pegasus (and other static beasts) into idle loops via
// PixelLab's /animate-with-text — which animates a REFERENCE IMAGE from a text
// action with NO skeleton (the skeleton-free path the object-mode MCP used to
// own). Reads <dir>/0.png as the anchor, writes the returned frames back as
// 0.png..(k-1).png. Wire frames:<k> in src/data/beastAnims.js afterward.
//
// Usage:
//   PIXELLAB_API_KEY=... node scripts/animate-pegasus.mjs [baby|adult]
//
// NOTE: animation costs credits — check /v1/balance first; usage prints per call.

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { Resvg } from '@resvg/resvg-js';

const API = 'https://api.pixellab.ai/v1';
const KEY = process.env.PIXELLAB_API_KEY;
if (!KEY) { console.error('PIXELLAB_API_KEY not set.'); process.exit(1); }

// /animate-with-text needs the reference image at the SAME size as the output
// (max 64). Downscale the 200px hero PNG to 64x64 by rasterizing it inside a
// 64x64 SVG <image> (resvg is the only image lib on hand).
function to64(pngBuf) {
  const b64 = pngBuf.toString('base64');
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="64" height="64">` +
    `<image xlink:href="data:image/png;base64,${b64}" href="data:image/png;base64,${b64}" ` +
    `x="0" y="0" width="64" height="64" preserveAspectRatio="xMidYMid meet"/></svg>`;
  return new Resvg(svg).render().asPng();
}

const LOOK =
  'retro pixel art, a winged warhorse made of living shadow, obsidian black body, ' +
  'electric violet purple glow, purple shadow-flame mane and tail, glowing purple eyes';
const ACTION =
  'gentle looping idle: a soft up-and-down breathing bob in place, mane and tail ' +
  'drifting, wings fluttering slightly, hooves shifting — stays centered, no walking';

const TARGETS = {
  baby:  { dir: 'public/beasts/anim/pegasus_baby_idle', desc: `${LOOK}, a small round baby foal version with stubby wings` },
  adult: { dir: 'public/beasts/anim/pegasus_idle',      desc: `${LOOK}, a full-grown majestic warhorse` },
};

async function animate(t) {
  const ref = to64(await readFile(`${t.dir}/0.png`)).toString('base64');
  console.log(`→ ${t.dir}`);
  const res = await fetch(`${API}/animate-with-text`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image_size: { width: 64, height: 64 },
      description: t.desc,
      action: ACTION,
      view: 'side',
      direction: 'west',
      n_frames: 4,
      reference_image: { base64: ref },
      image_guidance_scale: 3.0,
      text_guidance_scale: 7.5,
    }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${await res.text()}`);
  const data = await res.json();
  console.log('  usage:', JSON.stringify(data.usage));
  const imgs = data.images || [];
  await mkdir(t.dir, { recursive: true });
  for (let i = 0; i < imgs.length; i++) {
    const b64 = imgs[i]?.base64 ?? imgs[i];
    await writeFile(`${t.dir}/${i}.png`, Buffer.from(b64, 'base64'));
  }
  console.log(`  ✓ ${imgs.length} frames → ${t.dir}/0..${imgs.length - 1}.png`);
  return imgs.length;
}

const only = process.argv[2];
const entries = only ? [[only, TARGETS[only]]] : Object.entries(TARGETS);
if (only && !TARGETS[only]) { console.error('Unknown target. Keys: baby, adult'); process.exit(1); }
for (const [, v] of entries) { await animate(v); }
console.log('Done.');
