// Generate the T3 (grand) + T4 (Prime) evolution sprites for the nine non-dragon
// beasts, so every species has a full on-theme evolution line instead of falling
// back to the old pre-redesign manifest art. Static 200px hero sprites, matching
// Dragon's T3/T4 convention (frames:1). Escalates each species' approved adult
// look toward its named Prime form (see forms[] in beasts.js).
//
// Usage:
//   PIXELLAB_API_KEY=... node scripts/generate-evo-tiers.mjs <species>   (both tiers)
//   PIXELLAB_API_KEY=... node scripts/generate-evo-tiers.mjs <species>:t3
//
// Output: public/beasts/anim/<species>_t3/0.png and <species>_t4/0.png.

import { mkdir, writeFile } from 'node:fs/promises';

const API = 'https://api.pixellab.ai/v1';
const KEY = process.env.PIXELLAB_API_KEY;
if (!KEY) { console.error('PIXELLAB_API_KEY not set.'); process.exit(1); }

const STYLE =
  'retro pixel art game sprite, crisp hard edges, no anti-aliasing, a mythic ' +
  'creature at full power, full body, side 3/4 view, NOT humanoid, no rider, ' +
  'no human, centered on transparent background, dramatic rim light, epic';

const NEG = 'human, rider, person, humanoid, anthropomorphic, text, watermark, frame, border';

const SPECIES = {
  phoenix: {
    neg: 'dragon, dragon head, horse, horse head, mane, snout, muzzle, reptile, scales, hooves, antlers',
    t3: 'a greater blazing phoenix FIREBIRD (Solaris) — a great eagle-like BIRD with a rounded feathered head, a short sharp hooked BEAK, a feathered crest, and immense feathered wings of orange-gold fire, molten plumage. An avian bird like an eagle, NOT a dragon, NOT a horse — no snout, no muzzle, no mane',
    t4: 'a celestial solar phoenix FIREBIRD at its zenith (Solaris Prime) — a colossal eagle-like BIRD with a feathered head, a short hooked beak, a feathered crest, and blinding white-gold feathered inferno wings, a halo of sun-fire. An avian bird, NOT a dragon, NOT a horse — no snout, no mane',
  },
  griffin: {
    t3: 'a greater storm griffin (Stormcrest) — eagle head and talons, lion body, sapphire-and-gold plumage crackling with lightning, vast thunderhead wings',
    t4: 'a tempest-lord griffin (Stormcrest Prime) — eagle head, lion body, storm-cloud feathers wreathed in chained lightning, a crown of charged gold, eyes like white suns',
  },
  unicorn: {
    neg: 'horse, pony, pegasus, wings, winged, single horn unicorn',
    t3: 'a Chinese qilin / kirin (Qilin) — a chimera with a scaled DRAGON head, branching deer ANTLERS, an emerald scaled body, a lion-like tail, and a mane of green spirit-flame. It is NOT a horse and has NO wings',
    t4: 'a celestial qilin / kirin (Qilin Prime) — a radiant chimera with a scaled dragon head, golden deer antlers, jade-and-gold scaled body, a lion tail, and a mane of rainbow spirit-fire, treading on cloud. NOT a horse, NO wings, divine guardian',
  },
  kraken: {
    neg: 'serpent, snake, eel, dragon, single tentacle',
    t3: 'a greater abyssal kraken (Abyssal) — a colossal many-tentacled octopus sea-monster, deep-teal hide, many glowing eyes, barnacled, dripping deep-sea light',
    t4: 'a leviathan abyss-god kraken (Abyssal Prime) — a colossal OCTOPUS sea-monster with a huge bulbous head and many writhing tentacles, an eldritch crown, bioluminescent abyssal glow. A tentacled octopus, NOT a serpent or dragon',
  },
  hydra: {
    neg: 'single head, one head, two heads',
    t3: 'a greater seven-headed water hydra (Heptyr) — a serpent-dragon with many coiled teal necks and finned heads, dripping, churning water around it',
    t4: 'a storm-hydra leviathan (Heptyr Prime) — a sea-dragon with FIVE OR MORE long serpent necks and heads rising together, wreathed in sea-storm, a tidal crown, glowing aqua eyes. Many heads, not one',
  },
  cerberus: {
    neg: 'one head, single head, two heads',
    t3: 'a greater three-headed warhound (Cerberus) — a four-legged dog with three heads, purple-black fur, a glowing blue gem at the chest, iron-spiked collars, molten earth cracks',
    t4: 'a hellguard cerberus titan (Cerberus Prime) — one massive hound body with EXACTLY THREE distinct heads, all three wreathed in blue underworld fire, obsidian armor plates, a blazing blue chest-gem. Three heads, not one',
  },
  pegasus: {
    t3: 'a greater shadow warhorse (Nightmare) — a winged horse of obsidian wreathed in violet shadow-flame, spectral black plate barding with glowing purple seams, large dark wings, burning purple eyes',
    t4: 'a towering Shadow Monarch warhorse (Nightmare Prime) — a winged horse of living shadow, a crown of cold purple fire, vast dark wings, violet runic glyphs ablaze across it, supreme menace',
  },
  sphinx: {
    t3: 'a greater guardian sphinx (Enigmara) — a winged lion-bodied beast with a bestial regal beast-face (NOT a human face), gold-and-crimson lamassu, great feathered wings, Mesopotamian and Egyptian motifs',
    t4: 'an ancient guardian sphinx colossus (Enigmara Prime) — a vast winged lion-bodied beast, gold and crimson, glowing engraved glyphs, a crowned bestial beast-face (NOT human), timeless',
  },
  wyvern: {
    t3: 'a greater earth wyvern (Terravyrn) — a two-legged dragon with mossy stone-plated hide, leathery wings, crystal growths along the back, territorial',
    t4: 'a mountain-lord earth wyvern (Terravyrn Prime) — a colossal two-legged dragon, boulder-armored body, crystalline spines, vast mossy wings, glowing earth-core veins',
  },
};

async function gen(species, tier) {
  const prompt = SPECIES[species]?.[tier];
  if (!prompt) throw new Error(`no prompt for ${species}:${tier}`);
  const dir = `public/beasts/anim/${species}_${tier}`;
  console.log(`→ ${species} ${tier}`);
  const res = await fetch(`${API}/generate-image-pixflux`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      description: `${STYLE}. ${prompt}`,
      negative_description: SPECIES[species]?.neg ? `${NEG}, ${SPECIES[species].neg}` : NEG,
      image_size: { width: 200, height: 200 },
      no_background: true,
    }),
  });
  if (!res.ok) throw new Error(`${species} ${tier}: HTTP ${res.status} ${await res.text()}`);
  const data = await res.json();
  const b64 = data.image?.base64 ?? data.image;
  await mkdir(dir, { recursive: true });
  await writeFile(`${dir}/0.png`, Buffer.from(b64, 'base64'));
  console.log(`  ✓ ${dir}/0.png`);
}

const arg = process.argv[2];
if (!arg) { console.error(`species: ${Object.keys(SPECIES).join(', ')}`); process.exit(1); }
const [sp, only] = arg.split(':');
if (!SPECIES[sp]) { console.error(`unknown species '${sp}'`); process.exit(1); }
for (const tier of only ? [only] : ['t3', 't4']) {
  await gen(sp, tier);
}
console.log('Done.');
