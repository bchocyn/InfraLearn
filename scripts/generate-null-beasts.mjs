// Generate the five Null Beast (Lapse) boss sprites via PixelLab.
//
// Usage:
//   PIXELLAB_API_KEY=... node scripts/generate-null-beasts.mjs [lapseKey]
//
// Reads the key from the environment ONLY — never hardcode it here.
// Outputs 96x96 RGBA PNGs to public/beasts/null_<key>.png, matching the
// existing companion sprite dimensions.

import { writeFile } from 'node:fs/promises';

const API = 'https://api.pixellab.ai/v1';
const KEY = process.env.PIXELLAB_API_KEY;
if (!KEY) {
  console.error('PIXELLAB_API_KEY not set. source ~/.pixellab.env first.');
  process.exit(1);
}

const STYLE =
  'retro pixel art game sprite, crisp hard edges, no anti-aliasing, dark fantasy boss monster, ' +
  'centered on transparent background, limited palette, moody dramatic lighting';

const LAPSES = {
  hollow_ink: {
    name: 'Hollow Ink, the Unteacher',
    prompt:
      `${STYLE}. A tall robed scholar wraith whose robe is made of stacked text glyphs, ` +
      'an open book where its face should be with pages fanning outward and ink dripping upward, ' +
      'deep indigo robe #1E1A2E, pale parchment glyphs #F4EFE3, corrupted magenta ink #C060A0, ' +
      'faint mystic purple glow around the book face',
  },
  bitrot: {
    name: 'Bitrot, Devourer of Pages',
    prompt:
      `${STYLE}. A massive low-slung stone toad fused with a rusted filing cabinet, ` +
      'body covered in recessed tile slots holding crumpled pages, huge open jaw with paper feeding into it, ' +
      'oxidized iron brown #4A3520, rust orange #8B4513, grey-green mold patches #556B2F, ' +
      'dark amber veins across the tiles',
  },
  drift: {
    name: 'Drift, the Unfinisher',
    prompt:
      `${STYLE}. A creature made entirely of dozens of overlapping iridescent wings of different sizes ` +
      'with no body, a single large eye near the center gazing off to the side, ' +
      'soft cloud white #E8E4F0 base with sky blue #87CEEB, lavender #9B7FD4 and pale gold #F5D87A sheens',
  },
  cindercrown: {
    name: 'Cindercrown, the Gilded Hollow',
    prompt:
      `${STYLE}. An ornate empty suit of golden plate armor with an open visor revealing pure black void inside, ` +
      'a burning crown of golden flame above the helm, trophy medallions and laurels welded to the shoulders, ' +
      'oversized greatsword in its gauntlets, burnished gold #B8860B, charcoal void #2C2C2C, deep crimson fire #8B0000, ' +
      'faint cold amber glow from the hollow interior',
  },
  lethe: {
    name: 'Lethe, the Hushtide',
    prompt:
      `${STYLE}. A vast soft jellyfish-like tide spirit with no hard edges, ` +
      'long translucent trailing tendrils, a warm inviting bioluminescent glow at its center, ' +
      'serene and beautiful rather than menacing, deep teal body #1A3A4A, ' +
      'blue-white glow #A0D8EF, soft seafoam trailing edges #98D1C0',
  },
};

async function generate(key, { name, prompt }) {
  console.log(`→ ${name}`);
  const res = await fetch(`${API}/generate-image-pixflux`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      description: prompt,
      image_size: { width: 96, height: 96 },
      no_background: true,
    }),
  });
  if (!res.ok) throw new Error(`${name}: HTTP ${res.status} ${await res.text()}`);
  const data = await res.json();
  const b64 = data.image?.base64 ?? data.image;
  await writeFile(`public/beasts/null_${key}.png`, Buffer.from(b64, 'base64'));
  console.log(`  ✓ public/beasts/null_${key}.png`);
}

const only = process.argv[2];
const entries = only ? [[only, LAPSES[only]]] : Object.entries(LAPSES);
if (only && !LAPSES[only]) {
  console.error(`Unknown lapse '${only}'. Keys: ${Object.keys(LAPSES).join(', ')}`);
  process.exit(1);
}
for (const [k, v] of entries) {
  await generate(k, v); // sequential — be kind to the API
}
console.log('Done.');
