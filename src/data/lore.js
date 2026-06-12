// The world bible as data — names, provinces, the Five Lapses, and per-beast
// codex entries. Everything narrative reads from here so the voice stays
// consistent across screens. Design doc: docs/journey-design.md.
//
// Voice rules:
//   - Codex fragments: solemn, item-description register (Elden Ring).
//   - Beast barks / Lapse voice lines: short, in-character, warm or wicked.
//   - Never punish rest: weekend passes and freezes are CANON ("banked
//     embers"). Lethe is rest that never ends — not rest itself.

export const WORLD = {
  force: 'the Null',            // the un-remembering; the enemy as a weather
  rot: 'null-rot',              // common word for its corruption on places/things
  order: 'Keepers',             // what players are
  orderSingular: 'Keeper',
  currency: 'Embers',
  currencyGlyph: '⟡',
  watch: 'the Long Watch',      // the streak, in-world
  myth: [
    'Long before the streak-counters, there was the Network — a continent-wide',
    'lattice where knowledge flowed like water through stone. Then came the',
    'Null. Cities did not burn; they were unremembered. The great engines',
    'wound down mid-sentence. What survived, survived in fragments — lessons',
    'sealed in amber, carried by the Byte Beasts: ten bloodlines of',
    'machine-spirit and animal grace, who do not forget.',
  ].join(' '),
};

// ── The eight provinces (career paths as regions) ─────────────────────────
// `lapse` names the Null Beast whose influence lies heaviest on the province
// (Hollow Ink, the finale, presses on all of them at once).
export const PROVINCES = {
  fundamentals: {
    name: 'The Underlibrary',
    epithet: 'catacombs of first principles',
    lapse: 'bitrot',
    intro: 'Shelf-cliffs descend into the dark. Every lantern here was lit by someone who refused to skip the basics.',
  },
  devops: {
    name: 'The Foundry',
    epithet: 'pipelines of molten metal',
    lapse: 'cindercrown',
    intro: 'Aqueducts of fire pour build after build. The forge-priests chant the old litany: it works on every machine, or it does not work.',
  },
  mlops: {
    name: 'The Signal Gardens',
    epithet: 'where drift rolls in like weather',
    lapse: 'drift',
    intro: 'Observatory groves listen to the models breathe. Gardeners here prune for drift the way others prune for rot.',
  },
  swe: {
    name: 'The Clockwork Courts',
    epithet: 'where algorithms are argued as law',
    lapse: 'bitrot',
    intro: 'Brass judges weigh every solution twice: once for correctness, once for cost. Elegance is admissible evidence.',
  },
  mleng: {
    name: 'The Athenaeum of Gradients',
    epithet: 'math as living murals',
    lapse: 'lethe',
    intro: 'The murals rearrange themselves as you understand them. Descend slowly; the gradients pool deep.',
  },
  faang: {
    name: 'The Spire Cities',
    epithet: 'trial-by-interview',
    lapse: 'cindercrown',
    intro: 'Tournament banners hang from impossible towers. The trials are theater — and the theater is real.',
  },
  fullstack: {
    name: 'The Bridgeworks',
    epithet: 'spans from the client shores to the server deeps',
    lapse: 'drift',
    intro: 'Half-built bridges everywhere — each one abandoned at the moment a shinier crossing appeared.',
  },
  cybersec: {
    name: 'The Wallmarch',
    epithet: 'the active front',
    lapse: 'lethe',
    intro: 'The trenches here are old, flooded, and still manned. The Watch holds because someone always comes back at dawn.',
  },
};

// ── The Five Lapses — corrupted virtues of learning ───────────────────────
// `lapses` is also the FSRS term the store already tracks per review card:
// every failed review is, mechanically and canonically, their work.
export const FIVE_LAPSES = {
  'hollow-ink': {
    id: 'hollow-ink',
    name: 'Hollow Ink',
    title: 'the Unteacher',
    virtue: 'Knowledge',
    vice: 'Deceit',
    element: 'mystic',
    finale: true,                      // awakens only when ≥4 provinces are reclaimed
    codex: 'Ink is the substance of knowing; hollow ink is words with nothing inside. He never lies outright — he teaches the almost-true, and waits. Every wrong answer that ever felt right was written in his hand.',
    voice: 'I never lied to you, Keeper. Everything I taught you was almost true.',
    bossNote: 'Final boss. Waves of near-miss answers; the whyWrong explanations expose his forgeries.',
  },
  bitrot: {
    id: 'bitrot',
    name: 'Bitrot',
    title: 'Devourer of Pages',
    virtue: 'Practice',
    vice: 'Rote',
    element: 'earth',
    codex: 'It swallows libraries whole and digests nothing. Where Bitrot has fed, the words remain but the meaning is gone — pages of perfect letters that no one can read twice the same way.',
    voice: 'Why understand, little Keeper? Swallow. Swallow again. See? You have learned nothing — forever.',
    bossNote: 'Punishes spam-grading: answering "easy" too fast feeds it; deliberate pacing starves it.',
  },
  drift: {
    id: 'drift',
    name: 'Drift',
    title: 'the Unfinisher',
    virtue: 'Curiosity',
    vice: 'Distraction',
    element: 'sky',
    codex: 'A thousand wings, and every one of them beautiful. Drift does not block your road — it offers you a hundred lovelier ones, each exactly one step short of anywhere.',
    voice: 'Oh, but before that — look at THIS. And this! You can come back to the other thing. You always could have.',
    bossNote: 'Spawns decoy targets; only the due-card wraiths count.',
  },
  cindercrown: {
    id: 'cindercrown',
    name: 'Cindercrown',
    title: 'the Gilded Hollow',
    virtue: 'Mastery',
    vice: 'Hubris',
    element: 'fire',
    codex: 'A crown of fire on an empty suit of trophies. Cindercrown was a master once — the rot set in the day it stopped checking. The armor still shines. There is nothing inside.',
    voice: 'You have seen this one before, have you not? Of course you have. Do not check. Checking is for novices.',
    bossNote: 'Reads calibration data — attacks where stated confidence exceeds measured accuracy.',
  },
  lethe: {
    id: 'lethe',
    name: 'Lethe',
    title: 'the Hushtide',
    virtue: 'Rest',
    vice: 'Stagnation',
    element: 'water',
    codex: 'The oldest of the five, and the gentlest. The Null itself began when her waters slipped their banks. She is not your enemy when you sleep — she is what sleep becomes when it stops having a morning.',
    voice: 'Shhh. The watchfire keeps itself. Rest tonight. And tomorrow night. And every night after — I will count them for you.',
    bossNote: 'The lapse-villain. Weekend passes are canon (banked embers); Lethe is rest that never ends.',
  },
};

export const LAPSE_KEYS = Object.keys(FIVE_LAPSES);

// ── Beast codex — one entry per species ───────────────────────────────────
// origin: item-description register · fieldNote: Monster Hunter ecology with
// one endearing tic · nullScar: the thing this bloodline almost forgot, and
// refuses to again. Form names come from BEASTS in beasts.js; lore stays
// form-agnostic so renames there never break here.
export const BEAST_LORE = {
  dragon: {
    origin: 'First of the forge-bloods. An Ember is issued to Keepers who choose depth over haste; it sleeps in your pack, warms your worst nights, and judges no one’s pace.',
    fieldNote: 'Hoards bookmarks instead of gold. Will not sleep until the page is marked.',
    nullScar: 'Once forgot a single fire it had lit. Its final form remembers every one since.',
  },
  phoenix: {
    origin: 'The relight made flesh. Where the Null dims a relay, a phoenix-line beast circles until someone returns to strike the spark again.',
    fieldNote: 'Molts on streak-break days and pretends it meant to. Warmer than it admits.',
    nullScar: 'Forgot, once, that endings restart. It has burned brighter at every dawn since.',
  },
  griffin: {
    origin: 'Watch-beast of the high shelves. Griffins carried the last archive crates out of the falling cities, and never put the habit down.',
    fieldNote: 'Sorts everything it carries by weight, then by alphabet, then by affection.',
    nullScar: 'Lost one crate in the retreat. It still flies search patterns over that valley.',
  },
  unicorn: {
    origin: 'Proof that some knowledge is kept by being loved. Unicorn-lines bond to Keepers who reread the things they already understand, for joy.',
    fieldNote: 'Refuses shortcuts on principle. Takes the long road and arrives less tired.',
    nullScar: 'Almost let a kindness go unrecorded. Its horn has glowed faintly ever since.',
  },
  kraken: {
    origin: 'The deep remembers what the surface forgets. Kraken-bloods archive in the cold dark, ten arms filing ten threads at once.',
    fieldNote: 'Tugs your sleeve with one tentacle while the other nine keep working.',
    nullScar: 'Once surfaced too soon and lost the thread. It has never since let go of one.',
  },
  hydra: {
    origin: 'Cut one question down and two grow back. Hydra-lines were bred — or chose — to make curiosity expensive for the Null.',
    fieldNote: 'The heads argue bedtime. The body has never once lost that vote.',
    nullScar: 'A head once fell silent mid-question. The others finish every sentence now.',
  },
  cerberus: {
    origin: 'Gatekeeper of the Underlibrary’s last door. Three heads: one reads, one recites, one watches the dark.',
    fieldNote: 'Each head must be greeted separately or all three sulk in shifts.',
    nullScar: 'The watching head blinked, once. None of the three speaks of it.',
  },
  pegasus: {
    origin: 'Courier of the relay-lines. When the towers fell, pegasus-bloods flew the fragments between watchfires faster than the Null could chase.',
    fieldNote: 'Lands exactly where it means to, then trots three extra steps out of pride.',
    nullScar: 'One message arrived too late. It has flown ahead of schedule for a century.',
  },
  sphinx: {
    origin: 'The question that guards the answer. Sphinx-lines test Keepers not to keep them out, but to make the entering unforgettable.',
    fieldNote: 'Asks riddles it knows you can solve. Purrs when you show your work.',
    nullScar: 'Once accepted an answer without the why. The riddles have had two parts since.',
  },
  wyvern: {
    origin: 'The scrappy cousin of the forge-bloods — smaller wings, fiercer grip. Wyverns claim the territories the grand bloodlines call lost.',
    fieldNote: 'Perches on error messages like a falcon on a fence post. Unbothered.',
    nullScar: 'Was told, once, that it was not a true dragon. It remembers exactly who said so.',
  },
};

// Keeper-rank names for the 10 XP levels (xpLevel 1..10).
export const KEEPER_RANKS = [
  'Novice Keeper',
  'Lantern-Bearer',
  'Watchfire Warden',
  'Relay Mender',
  'Fragment Reader',
  'Province Walker',
  'Seal Bearer',
  'Null-Breaker',
  'Master Keeper',
  'Archivist of the Last Flame',
];
