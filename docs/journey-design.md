# The Journey — world, lore, tamer & mini-games (design draft v1)

Co-design doc. Nothing here is final; every section ends with open dials.
Inspirations on the table: Monster Hunter (ecology, field guides, gear-from-
achievement), Elden Ring (fragmented lore, golden guidance, melancholy ruins),
Warhammer 40k (knowledge as sacred, machine-spirits, lost golden age),
Trench Crusade (the long war, daily attrition made heroic).

---

## 1. The premise — why THIS story fits THIS app

The app's real antagonist is **forgetting**. FSRS reviews, streaks, weak-spot
drills — the whole retention engine fights memory decay. So the world's enemy
isn't an army. It's **the Null**: a creeping un-remembering that dimmed a
great civilization mid-thought.

> Long before the streak-counters, there was the Network — a continent-wide
> lattice where knowledge flowed like water through stone. Then came the
> Null. Cities did not burn; they were *unremembered*. The great engines
> wound down mid-sentence. What survived, survived in fragments — lessons
> sealed in amber, carried by the Byte Beasts: ten bloodlines of
> machine-spirit and animal grace, who do not forget.
>
> You are a **Keeper** — one of the last who walk the gray provinces,
> relighting the relays. Your beast remembers the way. Every concept you
> master is ground reclaimed. Every review you keep is a watchfire held.
> The trench is daily. The war is long. The light is amber.

Mechanics → lore mapping (everything already in the store):

| Existing mechanic | In-world meaning |
|---|---|
| Completing a lesson | Recovering a knowledge fragment (40k STC-style) |
| FSRS review due | A watchfire guttering — patrol it or the Null creeps back |
| Grading a review "good/easy" | Holding the line; the fragment stays lit |
| Streak | The Long Watch — unbroken nights at the wall (Trench Crusade) |
| Weekend pass / freeze | "Even Keepers sleep. The watchfires bank their embers." Forgiveness is canon, not failure |
| XP levels 1–10 | Keeper ranks (Novice Keeper → … → Archivist of the Last Flame) |
| Path badges bronze/silver/gold | Province seals |
| Unlockable scenes (meadow, forest, snow…) | **Territory reclaimed from the Null** — already gated by progress |
| Beast tiers 1–4 per path | The beast attunes to each province separately — a saga per discipline |
| Evolution | Not growth — *remembering what it always was* (Elden Ring melancholy) |

## 2. The eight provinces (career paths as regions)

| Path | Province | Flavor source |
|---|---|---|
| Fundamentals | **The Underlibrary** — catacombs of first principles, shelf-cliffs descending into dark | Elden Ring catacombs |
| DevOps | **The Foundry** — pipelines as aqueducts of molten metal, container-crates stacked like ingots | 40k Mechanicus |
| MLOps | **The Signal Gardens** — observatories where drift rolls in like weather | Monster Hunter ecology |
| SWE | **The Clockwork Courts** — algorithms argued as law before brass judges | — |
| ML Eng | **The Athenaeum of Gradients** — math as living murals that rearrange | — |
| FAANG | **The Spire Cities** — tournament arcs, trial-by-interview | Monster Hunter arena |
| Full-stack | **The Bridgeworks** — spans joining the client shores to the server deeps | — |
| Cybersecurity | **The Wallmarch** — the active front; sieges, wards, sapper-daemons | Trench Crusade |

## 3. The beasts — bestiary structure

Each of the 10 species gets a codex page built from data that already exists
(element, archetype line, 4 form names) plus new lore:

- **Origin myth** (2–3 sentences, item-description voice)
- **Field notes** (Monster Hunter ecology: what it eats, how it sleeps, one
  endearing behavioral tic)
- **Saga of forms** — the 4 evolution names retold as life-stages
- **Null-scar** — one thing the species almost forgot, and refuses to again
  (each beast carries a wound; ties to its element)

Example (Dragon — forms: Ember › Cinderwing › Infernath › Infernath Prime):

> *An Ember is issued to Keepers who choose depth over haste. It sleeps in
> your pack, warms your worst nights, and judges no one's pace. The
> Foundry-priests say every Infernath Prime remembers every fire it has ever
> lit. None has ever been recorded to forget.*

Lore is delivered in **fragments** (Elden Ring style): short entries unlocked
by real milestones — first completion in a province, tier-ups, streak marks,
badge unlocks. A "Codex fragment recovered" moment rides the existing
CelebrationMoment system.

## 4. The Keeper (tamer avatar rework)

The current AvatarCreator (hair/top/bottom/shoes/hat/held) becomes a
**Keeper kit** with gear earned, Monster-Hunter-style, from milestones:

- **Mantles/cloaks** with element trims (replaces plain tops)
- **Held tools**: signal-lantern (the amber light), codex-slate, beast-whistle,
  ward-staff, trench-spade (Trench Crusade nod)
- **Sigil layer** (new slot): the five-gem Elemental Emblem from onboarding,
  earned per element mastered — worn as a brooch
- **Hats** → hoods, helms, foundry goggles

Avatar already renders beside the beast on the stage — the composition is
"Keeper and companion at camp," no layout change needed. The AVATAR tab
renames to **TAMER** (or KEEPER — open dial).

## 5. The Journey (new ByteBeast tab)

A side-scrolling SVG province map (same illustration techniques as the
Roadmap scene). Each province has **chapters** gated by real learning
milestones — story never grinds via games:

```
Chapter gate examples
  Ch.1  Enter province        → first lesson completed in that path
  Ch.2  The first watchfire   → 25% path progress (bronze seal)
  Ch.3  The relay relit       → beast reaches tier 2 on this path
  Ch.4  Hold the line         → 7-day streak while this path is active
  Ch.5  Province reclaimed    → gold seal
```

Each chapter delivers: a codex fragment + a **micro-encounter** (one-screen
choose-your-answer scene that reuses quiz-bank questions in costume — "the
bridge daemon demands the correct HTTP verb") + a reward (gear piece, scene,
bond, small XP).

## 6. Mini-games (ByteBeast section)

Design rule: **learning stays primary**. Games award bond + cosmetics + small
capped XP (reusing the daily anti-farm pattern we built for daily practice).
Each game is its own lazy chunk.

1. **Watchfire Defense** (flagship — review-powered battle). Your due FSRS
   cards *are* the incoming Null-wraiths. Answer/grade a card → your beast
   strikes; miss → the watchfire takes damage. Under the hood it is exactly
   `getReviewsDue()` + `markReviewed(id, grade)` — the game is presentation,
   the scheduler stays honest. Reviews become the thing you *want* to do.
2. **Signal Relay** (arcade, 60s). Route packets through a small SVG network
   before TTL expires; beast element bends the rules (fire burns a blocked
   link once, water reroutes, sky speeds you up). Pure reflex, bond reward.
3. **Ember Tending** (calm, daily). A 30-second care ritual — element-pairs
   puzzle that feeds/grooms the beast. Bond +1/day, the beast's stage idle
   animation gets visibly happier (mood system).
4. **Trench Run** (later). Endless-runner across the Wallmarch with lesson
   vocabulary as pickups; unlocked by cybersec progress.

New store state (all scrubbed on import, migrate v13): `bond` per species,
`loreUnlocked` fragment map, `journey` chapter map, `tamerGear` list,
`gameStats` daily caps.

## 7. Phasing

- **P1 Lore foundation** (~2–3 d): `src/data/lore.js`, Bestiary tab reader,
  fragment unlock wiring, codex CelebrationMoment.
- **P2 Keeper kit** (~2–3 d): avatarParts expansion (SVG), TAMER tab, gear
  unlock wiring.
- **P3 Journey map** (~4–5 d): province map + chapter gates + encounters.
- **P4 Games** (~3–5 d each): Watchfire Defense first, then Signal Relay,
  Ember Tending.

---

# v2 — Cookie Run synthesis (Beast-Yeast structure + the forcing economy)

Reference points: CRK "Beast-Yeast" story arc (five ancient Beasts, each a
corrupted virtue, sealed under a region, awakening as episodic bosses) and
the "An Ancient Force Awakens" trailer language (parallax storybook scenes,
squash-and-stretch character idles, dramatic awakening set-pieces).

## 9. The five Null Beasts — corrupted virtues of learning

CRK's Beasts corrupt faith, plenty, knowledge, joy. Ours corrupt the five
virtues of *studying* — each boss embodies a real failure mode, so the story
literally teaches metacognition:

**NAMES LOCKED (v3)** — collective: **the Five Lapses** ("lapse" is the FSRS
term the store already tracks per failed review). Canonical data lives in
`src/data/lore.js` (FIVE_LAPSES / PROVINCES / BEAST_LORE / KEEPER_RANKS) —
all narrative UI must read from there, never hardcode.

| Null Beast | Corrupted virtue | Element | The lie it tells | Boss mechanic (Watchfire Defense) |
|---|---|---|---|---|
| **Hollow Ink, the Unteacher** | Knowledge → **Deceit** | mystic | "I will tell you something *almost* true." Every quiz distractor is his voice | Final boss. Waves of near-miss answers; the `whyWrong` explanations are literally "exposing his lies" |
| **Bitrot, Devourer of Pages** | Practice → **Rote** | earth | "Swallow the page whole. Chewing is for the slow" | Punishes spam-grading: answering "easy" too fast feeds it; deliberate pacing starves it |
| **Drift, the Unfinisher** | Curiosity → **Distraction** | sky | "Just one more shiny thing first" | Spawns decoy targets; only the due-card wraiths count |
| **Cindercrown, the Gilded Hollow** | Mastery → **Hubris** | fire | "You already know this" | Reads your calibration data — attacks where confidence exceeds accuracy |
| **Lethe, the Hushtide** | Rest → **Stagnation** | water | "Rest a little longer. And longer." | The lapse-villain. NOT anti-rest: weekend passes are canon ("banked embers"); Lethe is rest that never ends |

Arc structure (CRK-style episodes): each province runs ~5 chapters; a Null
Beast awakens as the **gold-seal boss** of its aligned provinces; the
Unteacher finale requires multiple provinces reclaimed (drives breadth, not
just depth). Beast awakening = the app's most dramatic animation moment,
reusing the EvolutionModal pattern at bigger scale.

## 10. The forcing economy — story progress REQUIRES learning

Two-lock design (CRK uses stamina + level gates; we mirror):

1. **Embers ⟡** (soft currency) — earned ONLY by learning actions:
   lesson +3 · lab +5 · review graded +1 (cap 10/day) · daily practice
   done +2 · streak day +1. Spent on: journey stage entry (3–8), encounter
   retries (1), cosmetic crafting (5–15), extra arcade runs. Mini-games
   never mint embers — the anti-farm pattern from daily practice applies.
2. **Hard gates** (cannot be bought): path % / seals, beast tier on that
   path, streak marks, specific review counts. Embers pace you; gates force
   the learning. No ember balance can skip a gate.

Cross-app surfacing so the loop is visible everywhere:
- **Home**: camp hero panel shows the next gate ("Relay 3: two lessons in
  the Foundry") and deep-links to the gating lesson; ember chip in header.
- **Lesson complete**: celebration line gains "+3 ⟡ · Foundry 4/6 to Ch.3".
- **Roadmap**: section headers get chapter banners ("Clearing this section
  relights Relay 2").
- **Reviews**: framed as patrols; boss fights ARE review gauntlets
  (`getReviewsDue` + `markReviewed` underneath, unchanged).
- **NudgeCard**: speaks in-world ("The watchfire gutters, Keeper.").

Store additions (migrate v13, all import-scrubbed): `embers`, `journey`
{province → {chapter, stars}}, `bond` {species → n}, `loreUnlocked`,
`tamerGear`, `gameDaily` caps.

## 11. Landing page — the camp hero panel

Replace Home's static beast strip with a layered **camp scene** (pure
CSS/SVG, `reducedMotion`-aware, reusing BeastScene/StageDecor/AvatarSprite):

- Sky gradient keyed to local time (dawn/day/dusk/night palettes)
- Two parallax hill layers with slow idle drift; watchfire with CSS flicker
- **Beast idle animation** — squash-and-stretch breathing (scaleY 0.98 ↔
  1.0, translateY ±2px, ~3s), CRK-style bounce on tap
- **Mood states**: happy bounce while the streak lives · sleepy droop + zzz
  when ≥5 reviews due · celebratory sparkle on level-up days — the pet
  visibly reflects retention state (a gentle, non-punitive nudge)
- Keeper avatar at the fire beside the beast; speech bubble cycling short
  beast barks that double as story hooks ("The Foundry smells of new fire.
  Two lessons more.") — tapping goes to the gating ACTION, not just ByteBeast
- Card entrance stagger + button press-squash micro-interactions app-wide

## 12. Mini-game lineup (final) — CRK restraint: one battle spine

1. **Watchfire Defense** — THE core loop. Daily patrols (regular reviews) and
   chapter bosses (the five Null Beasts) are the same battle system; due
   cards are the ammunition. Scheduler stays honest.
2. **Ember Tending** — 30-second daily care ritual; feeds `bond`, drives the
   mood system. Calm, Tamagotchi-adjacent.
3. **Signal Relay** — 60-second packet-routing arcade with element powers;
   bond + cosmetics only. First 3 runs/day free, then embers.
Everything else (Trench Run etc.) waits until these three prove out.

## 13. Resolved dials (v2 recommendations)

- **Tone**: CRK's exact trick — bright, bouncy, warm on the surface;
  genuinely dark mythology underneath. Locks dial 1 to (a) with teeth.
- **Beasts speak**: yes — short dialogue barks with portrait bubbles in
  journey scenes (CRK warmth); the codex narrator keeps the Elden Ring
  item-voice for fragments. Hybrid locks dial 5.
- **Containment**: leak deliberately — Home hero + Roadmap banners + lesson
  celebrations are the forcing loop's visibility. Locks dial 3.
- **Build order**: P0 = ember economy + camp hero panel (the tie-everything
  layer, mostly store + Home) → P1 bestiary/lore → P2 journey map +
  Watchfire Defense patrols → P3 Null Beast bosses → P4 tamer gear +
  side games.

## 8. Open dials (co-design questions)

1. **Tone**: how grim? (a) warm-melancholy with grim edges — Ghibli-meets-
   Elden-Ring (current draft), (b) full grimdark — 40k/Trench Crusade
   forward, (c) bright adventure — Monster Hunter forward.
2. **Names**: world = the Network? the Lattice? Gridfall? · enemy = the
   Null? the Static? the Gray? · player order = Keepers? Wardens? Tamers?
3. **Where lore lives**: ByteBeast section only, or do provinces leak into
   the Roadmap/lesson screens (chapter banners between sections)?
4. **First build**: P1 bestiary (cheapest, immediate flavor) or jump to
   Watchfire Defense (boldest, makes reviews fun)?
5. **The beast's voice**: do beasts speak (short barks/quotes), or stay
   wordless with the codex speaking *about* them? (Wordless = more Elden
   Ring; speaking = more Cookie-Run warmth.)
