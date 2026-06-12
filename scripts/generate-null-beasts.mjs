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

// Horror direction borrows grand-dark chaos-god design language: each Lapse
// is the player's own failure made flesh — shifting deceiver, cheerful rot,
// restless unfinished form, hollow wrath-trophy, beautiful oblivion. Strong
// silhouette + 2-3 horror signifiers each, so the dread still reads at 96px.
const STYLE =
  'retro pixel art game sprite, crisp hard edges, no anti-aliasing, grimdark fantasy raid boss, ' +
  'menacing and unsettling, centered on transparent background, limited palette, ' +
  'high contrast dramatic rim lighting from below';

const LAPSES = {
  hollow_ink: {
    name: 'Hollow Ink, the Unteacher',
    prompt:
      `${STYLE}. A towering gaunt scholar wraith, robe woven from shifting stacked text glyphs ` +
      'with dozens of small slitted eyes opening between the letters, an open book where its face should be ' +
      'with pages fanned like a screaming mandala and ink running upward like black flame, ' +
      'two pairs of long many-jointed fingers raised mid-lecture, ' +
      'deep indigo robe #1E1A2E, pale parchment glyphs #F4EFE3, corrupted magenta ink #C060A0, ' +
      'sickly purple witchfire glow around the book face',
  },
  bitrot: {
    name: 'Bitrot, Devourer of Pages',
    prompt:
      `${STYLE}. A grotesquely bloated stone toad fused with a rusted filing cabinet, ` +
      'hide split by weeping ruptures spilling shredded wet pages, a wide cheerful grandfatherly grin ' +
      'that does not match its rotting body, pale paper-maggots burrowing through the tile slots, ' +
      'a faint halo of flies, one drawer hanging open like a gut wound, ' +
      'oxidized iron brown #4A3520, rust orange #8B4513, grey-green mold blooms #556B2F, ' +
      'dark amber pus veins glowing faintly across the tiles',
  },
  drift: {
    name: 'Drift, the Unfinisher',
    prompt:
      `${STYLE}. A lopsided swarm-creature with deliberately broken symmetry, made of tattered ` +
      'iridescent wings of wildly different sizes jutting at wrong angles, left side dissolving into ' +
      'scattered floating feather fragments and glitch static, several mismatched lidless eyes of different ' +
      'sizes embedded among the feathers each staring in a different direction, ' +
      'one large central eye half-lidded and looking away with boredom, ' +
      'soft cloud white #E8E4F0 with sky blue #87CEEB, lavender #9B7FD4 and pale gold #F5D87A sheens ' +
      'curdling to dead grey where the form unravels',
  },
  cindercrown: {
    name: 'Cindercrown, the Gilded Hollow',
    prompt:
      `${STYLE}. A hulking empty suit of brass and gold plate armor like a war-god idol, ` +
      'open visor revealing a black void with one dying ember deep inside, a guttering crown of fire ' +
      'burning black at the tips, small trophy skulls and torn campaign banners chained to the pauldrons, ' +
      'an oversized cracked greatsword planted point-down like an altar, mantle of medals layered like scales, ' +
      'burnished gold #B8860B, charcoal void #2C2C2C, deep crimson fire #8B0000, ' +
      'cold amber glow leaking from every armor seam',
  },
  lethe: {
    name: 'Lethe, the Hushtide',
    prompt:
      `${STYLE}. A vast drowned tide spirit shaped like a colossal translucent jellyfish, ` +
      'serene and beautiful from a distance but wrong up close: faintly visible sleeping human faces ' +
      'drifting inside the bell, long trailing tendrils that end in gently open grasping hands, ' +
      'a single warm inviting bioluminescent lure glowing at its heart like an anglerfish, ' +
      'deep teal body #1A3A4A, blue-white inner glow #A0D8EF, soft seafoam trailing edges #98D1C0, ' +
      'the dark silhouette of something far larger looming behind the glow',
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
