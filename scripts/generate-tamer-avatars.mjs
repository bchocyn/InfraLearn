// Generate the Beast Tamer avatar presets via PixelLab's 4-direction
// character endpoint. Each archetype renders facing south/west/east/north so
// the avatar can turn in cutscenes and walk the world map.
//
// Usage:
//   PIXELLAB_API_KEY=... node scripts/generate-tamer-avatars.mjs [tamerKey]
//
// Reads the key from the environment ONLY — never hardcode it here.
// Outputs RGBA PNGs to public/tamers/<key>_<direction>.png.
//
// NOTE: /v2/create-character-with-4-directions is an ASYNC job — the POST
// returns a character_id immediately; we poll /v2/characters/{id} until its
// rotation_urls fill in, then download all four views.

import { mkdir, writeFile } from 'node:fs/promises';

const API = 'https://api.pixellab.ai/v2';
const KEY = process.env.PIXELLAB_API_KEY;
if (!KEY) {
  console.error('PIXELLAB_API_KEY not set. source ~/.pixellab.env first.');
  process.exit(1);
}

// One shared style line so the eight presets read as one cast. Distinct
// silhouettes + one signature color each — they must stay tellable-apart at
// 40px on the map.
const STYLE =
  'retro pixel art game character, heroic fantasy beast tamer, full body, ' +
  'crisp pixel art, warm rim light';

const TAMERS = {
  ember_warden: {
    name: 'Ember Warden',
    prompt: `${STYLE}. A young warden carrying a glowing amber lantern staff, dark teal hooded cloak #1A3A4A with warm orange #E07856 trim, determined expression`,
  },
  tide_caller: {
    name: 'Tide Caller',
    prompt: `${STYLE}. A calm water-mage in flowing blue-grey robes #7B9FB5 with silver wave embroidery, carrying a coiled rope and a glass flask of glowing water, long braided hair`,
  },
  thorn_ranger: {
    name: 'Thorn Ranger',
    prompt: `${STYLE}. A wiry forest scout in layered moss-green leathers #8FA876 with a thorn-branch bow on the back, leaf-shaped shoulder cape, sharp watchful eyes`,
  },
  sky_courier: {
    name: 'Sky Courier',
    prompt: `${STYLE}. A cheerful aviator in a lilac flight jacket #B888C0 with brass goggles pushed up on the forehead, a small satchel of letters, wind-tousled hair, light scarf streaming`,
  },
  cipher_sage: {
    name: 'Cipher Sage',
    prompt: `${STYLE}. A scholarly mage in deep indigo robes #2A1F3A covered in faint golden glyphs #F5B842, carrying a heavy open tome chained to the belt, round spectacles, serene`,
  },
  circuit_smith: {
    name: 'Circuit Smith',
    prompt: `${STYLE}. A stocky engineer in a soot-streaked work apron over copper-brown overalls #8B4513, heavy gauntlets, a glowing wrench-hammer on the shoulder, welding goggles`,
  },
  null_walker: {
    name: 'Null Walker',
    prompt: `${STYLE}. A mysterious survivor in a tattered charcoal-black longcoat #2C2C2C with one pale glowing blue-white eye visible under the hood #A0D8EF, bandaged hands, quiet menace`,
  },
  dawn_shield: {
    name: 'Dawn Shield',
    prompt: `${STYLE}. A bright young knight in polished gold-trimmed steel plate #C7BFA9 with a round shield bearing a sunrise emblem #F5B842, short cropped hair, open friendly face`,
  },
};

const DIRECTIONS = ['south', 'west', 'east', 'north'];
const headers = { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };

async function generate(key, { name, prompt }) {
  console.log(`→ ${name}`);
  const res = await fetch(`${API}/create-character-with-4-directions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      description: prompt,
      image_size: { width: 64, height: 64 },
      // Pinned style (PixelLab consistent-style guidance): every tamer in
      // the cast renders with the same detail/outline/shading treatment, so
      // the presets read as one art set rather than eight one-offs. These
      // mirror the API's current defaults — pinning guards against drift.
      detail: 'medium detail',
      outline: 'single color black outline',
      shading: 'basic shading',
    }),
  });
  if (!res.ok) throw new Error(`${key}: HTTP ${res.status} ${await res.text()}`);
  const { character_id: cid, background_job_id: jid } = await res.json();

  // Poll the JOB until completed — rotation_urls show up on the character
  // record early (mannequin placeholders) and 404 until the render lands.
  let done = false;
  for (let i = 0; i < 90; i++) {
    await new Promise((s) => setTimeout(s, 5000));
    const r = await fetch(`${API}/background-jobs/${jid}`, { headers });
    if (!r.ok) continue;
    const d = await r.json();
    if (d.status === 'completed') { done = true; break; }
    if (d.status === 'failed') throw new Error(`${key}: job failed — ${JSON.stringify(d.last_response).slice(0, 200)}`);
  }
  if (!done) throw new Error(`${key}: timed out waiting for job ${jid}`);

  const cr = await fetch(`${API}/characters/${cid}`, { headers });
  if (!cr.ok) throw new Error(`${key}: HTTP ${cr.status} fetching character`);
  const urls = (await cr.json()).rotation_urls || {};

  for (const dir of DIRECTIONS) {
    if (!urls[dir]) throw new Error(`${key}/${dir}: no rotation url`);
    // Auth header on the asset fetch too — some asset hosts require it.
    let img = await fetch(urls[dir], { headers: { Authorization: headers.Authorization } });
    if (!img.ok) img = await fetch(urls[dir]);
    if (!img.ok) throw new Error(`${key}/${dir}: HTTP ${img.status}`);
    await writeFile(`public/tamers/${key}_${dir}.png`, Buffer.from(await img.arrayBuffer()));
    console.log(`  ✓ public/tamers/${key}_${dir}.png`);
  }
}

await mkdir('public/tamers', { recursive: true });
const only = process.argv[2];
const entries = only ? [[only, TAMERS[only]]] : Object.entries(TAMERS);
if (only && !TAMERS[only]) {
  console.error(`Unknown tamer '${only}'. Keys: ${Object.keys(TAMERS).join(', ')}`);
  process.exit(1);
}
for (const [k, v] of entries) {
  await generate(k, v); // sequential — be kind to the API
}
console.log('Done.');
