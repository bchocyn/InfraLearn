# Pokémon DS-Era Overworld — Research & Design Recommendations

How the Nintendo DS Pokémon games (Gen 4: Diamond/Pearl/Platinum and the
HeartGold/SoulSilver remakes; Gen 5: Black/White and B2/W2) handle character
movement and overworld maps — and what we should adopt for our gamified learning
roadmap (a tall vertical SVG serpentine trail with stage nodes, scattered
PixelLab props, a small walker, parallax sky, and per-province ground gradients).

This is **research + planning only**. No app code is changed here. Where it
touches sprites/animation it dovetails with the separate `ANIMATION_PLAN.md`
(PixelLab character/animation pipeline) rather than duplicating it.

> Sourcing note: one source page (TCRF Gen 5 overworld sprites) served an
> AI-test/prompt-injection payload instead of content and was discarded. Frame
> counts below are corroborated from movement/animation references and the
> Pokémon-fangame (Essentials/RMXP) convention, which mirrors the originals.

---

## TL;DR — Top 5 recommendations (lead with these)

1. **Keep the SVG trail; make the walker *step* along it tile-by-tile, not glide.**
   Quantize the path into fixed-length steps (the Pokémon "snap to grid" feel) and
   move the avatar one step at a time with a short ease (~180–250 ms/step) + a
   settle pause. This is the single change that converts "marker on a map" into
   "a character walking." Use `SVGGeometryElement.getTotalLength()` /
   `getPointAtLength()` on the existing trail `<path>`. Cheap, high impact.

2. **Camera-follow the walker, not the page scroll.** Today we scroll-to once on
   path open and run parallax off scroll position. Instead, when the walker steps,
   smooth-scroll to keep it centered (roughly fixed in the viewport) so the *world*
   appears to move past a stationary character — the Pokémon "player always
   centered" convention. Reuse the existing `sceneRef` scroll math; trigger it per
   step instead of once.

3. **Add a 4-direction walk-cycle to the avatar (ties directly into
   `ANIMATION_PLAN.md`).** Pokémon overworld sprites are 4-directional, ~3–4 frames
   per direction, with a vertical "bob." We already have a `roadmap-walker-bob`
   wrapper and a planned `AnimatedSprite` (CSS `steps()` strips). Drive the facing
   from step direction (derive dx/dy between consecutive path points) and play
   walk while stepping / idle while parked. Honor `reducedMotion` (static frame).

4. **Introduce one overhead/"walk-behind" layer for depth.** The defining
   top-down depth cue is the player passing *behind* tall objects (tree canopies,
   gates). Split a few props into base (below avatar) + canopy (above avatar) and
   z-order the avatar between them. In SVG this is just paint order: render
   trunks → avatar → canopies. Do it for a handful of trees/the fog gate, not
   every prop.

5. **Add step/arrival feedback at nodes (grass-rustle + a small "land" beat).**
   What makes Pokémon feel alive is micro-feedback: grass rustles, a step bob, a
   ledge hop. On arriving at a stage node, play a tiny rustle on nearby
   grass/decals + a settle squash on the avatar (and a soft tick if sound is on).
   This is the "explorable world vs. level-select" difference at near-zero cost.

Everything below is the detail behind these, plus what to **skip**.

---

## 1. Character movement in DS-era Pokémon

### Grid / tile-based, 16 px tiles
The overworld is a square grid; the base unit is a **16×16 px tile**. The player
occupies exactly one tile and moves a whole tile at a time. A Gen-5 reimplementation
explicitly takes "1 world unit = a 16×16 px tile" as its base measurement, with the
player sprite ~16 px wide × ~36 px tall (taller than one tile — the head overhangs).

The movement model is a tiny **state machine** (the same pattern every
Pokémon-style tutorial reproduces):
- **Idle:** snapped to a tile center; accepts input.
- On a direction press, if the next tile is walkable, enter **Walking**: start a
  countdown of one TILESIZE and interpolate (tween/lerp) position to the next tile
  center over a fixed duration. The original Godot/Essentials convention is ~**0.25 s
  per tile** for walking.
- While walking, **ignore new input** until the step completes, then snap and
  return to Idle. "Snap to the grid only as much as is necessary."

This is why Pokémon movement feels deliberate: no sub-tile drift, every stop lands
on a cell, and you can't cancel a step mid-tile.

### Turn-in-place vs. move
A short tap turns the character to **face** a direction without moving (the sprite
swaps to that direction's idle pose); holding the same direction then steps. Facing
is decoupled from translation — important for our nodes (the avatar can *look* at a
locked branch without walking onto it).

### Walk vs. run vs. bike cycles
All three are still **tile-locked** — only the per-tile duration and animation
change (Bulbapedia, *Movement speed*):
- **Walk:** baseline.
- **Run** (Running Shoes): **2× walking speed**, dustier/faster cycle.
- **Bike:** **~1.33× running** (≈2.66× walking); Gen 4 Mach/Acro bikes add gears,
  ramp jumps (1–2 tiles), and muddy-slope climbing.
Movement type also feeds the encounter RNG (e.g. Gen 4 bike movement value = 70).
Takeaway for us: a single tunable "step duration" gives walk/run/bike feel for free.

### Sprite drawing — top-down 3/4, 4-directional, frame counts
- Drawn **top-down 3/4 view** (you see the front/back/side of the character, not a
  pure bird's-eye). 4-directional facing: down/up/left/right; left and right are
  usually one set **mirrored**.
- **Frames per direction:** classic overworld walk is **3 frames** — neutral, left
  foot forward, right foot forward (a contra-pose alternation). The
  Essentials/RMXP convention (which fan games and the DS-era feel both follow) uses
  **4 frames** per direction (neutral → step → neutral → step). Run/bike are the
  same skeleton played faster with a wider stride.
- **The "bob":** the body rises/falls a pixel or two per step and the legs
  alternate, giving the bouncy, lively gait. It's a small vertical oscillation
  synced to the step.

### NPC movement patterns
NPCs run the same grid stepper, driven by simple scripts: **stand-and-face**,
**look-around** (periodic facing changes), **pace** (back-and-forth on a line),
**wander** (random walkable steps inside a radius), and **path/follow**. They
animate their walk cycle only while stepping; otherwise idle/look. This cheap
variety is most of what makes towns feel populated.

### What Gen 5 added (Black/White, B2/W2)
- **2.5D world.** Gen 4 characters are flat 2D sprites on a slightly-tilted map.
  Gen 5 renders the world in 3D with characters as **billboarded sprites** (flat
  textured planes that turn to face the camera) placed in a 3D scene, drawn with
  **perspective** so farther characters/objects are smaller.
- **Camera at 45° down**, internal render ~**640×360** (16:9) then integer-upscaled
  to preserve the pixel grid.
- **Animated overworld sprites & more motion:** NPCs visibly in motion, busier
  crowds (Castelia City), and **diagonal movement** in places — the world reads as
  alive rather than a static grid of standing figures.
- **Dynamic / cinematic camera.** Set-pieces sweep and rotate the camera
  automatically: **Skyarrow Bridge** pans to reveal Castelia and swings *behind*
  the player as you climb the spiral ramp; cities show buildings from subtly
  shifting angles as you move. The player still walks the grid — the *camera* is
  what becomes expressive.

---

## 2. Map / overworld look

### Tile-based maps, layered tilesets
Maps are composed from a tileset on stacked layers. The standard top-down stack is
**three layers relative to the player**:
1. **Ground** (grass, paths, water) — below the player.
2. **Object/decoration** — on par with the player; many of these the player
   collides with (tree trunks, signs, building bases).
3. **Overhead** — drawn **above** the player (tree canopies, bridge tops, awnings,
   building eaves) so the player passes *behind/under* them.
A separate **collision/logic grid** marks walkable vs. blocked tiles (and is reused
for spawns and pathing). Classic trick: a tree's **lower half collides, upper half
is overhead** — that's the "walk behind the treetop" depth read.

### How routes/towns are composed
Towns and Routes are hand-built grids of these tiles: a path/road threads through,
grass patches (encounter zones) and ledges line the route, decorations fill the
margins, gates/doors connect maps. Composition is dense and continuous — there's no
"level select," just one walkable surface that flows into the next.

### Camera: tilted top-down, centered, smooth scroll
- The camera is a **slightly-tilted top-down** (Gen 4) / explicit **45° 3D** (Gen 5).
- The **player stays centered**; the map scrolls smoothly under them. Movement is
  tile-stepped but the scroll itself is smooth (no hard jumps), which is what makes
  the world feel continuous.

### Map transitions
- **Doors:** step onto the door tile → short fade → interior map, player appears at
  the door.
- **Route gates / building exits:** walk through; a fade or slide bridges maps.
- **Edges:** routes connect by walking off one map's edge onto the next.
Transitions are quick fades, never a menu — the seam between maps is hidden, which
sustains the "one big world" illusion.

### Depth cues
- **Walk behind tall objects** (overhead layer) — primary cue.
- **Contact shadows** under standing objects/characters ground them.
- **Height/ledges:** ledges you can hop *down* but not climb up; bridges and stairs
  imply elevation.
- **Gen 5 perspective:** real perspective scaling and the cinematic camera on
  bridges/cities sell a 3D space without leaving the grid.

---

## 3. What makes it feel good

- **Tile snapping** — every stop lands on a cell; no floaty sub-pixel drift. Motion
  is deliberate and readable.
- **Ledges** — one-way hops with a little arc + landing; cheap traversal delight.
- **Grass rustle** — stepping into tall grass animates the grass and is the visible
  promise of an encounter; tiny feedback, big "alive" payoff.
- **Encounter zones** — specific tiles (grass, caves, water) are *meaningfully
  different* to stand on. Place matters.
- **Continuous explorable world vs. level select** — maps flow into each other via
  hidden fades; the player threads a single surface and the camera follows. This
  continuity, plus per-step micro-feedback, is the core "Pokémon feel."

---

## 4. Recommendations for our app

Context: we're a **mobile web app** with a **React + SVG** roadmap — a tall
vertical serpentine `<path>`, stage nodes (candy buttons), PixelLab props scattered
in the margins, a small avatar/walker positioned at the current node by percentage,
parallax sky driven by scroll, and a per-province ground gradient. A full tile-grid
engine would be a rewrite we don't need. The win is to **borrow the *feel* (stepping,
camera-follow, walk-cycle, walk-behind depth, micro-feedback) on top of the SVG
trail we already have.**

(Top 5 are at the top of this doc. Details and the full adopt/skip split follow.)

### ADOPT (high value, fits our stack)

**A. Step-along-the-path walker (the core change).**
The trail is already an SVG `<path>`. Quantize it:
`len = pathEl.getTotalLength()`, choose a step distance `S` (e.g. so there are
~6–10 steps between nodes), and walk the avatar through `getPointAtLength(t)` for
`t = 0, S, 2S, …`. Each step: ease position over ~**180–250 ms**, then a brief
**settle pause** (~80–120 ms) — that pause is what reads as "a footstep" rather
than a glide. Derive **facing** from the delta between consecutive points
(`atan2(dy, dx)` → nearest of down/up/left/right; pick left vs. right by sign).
- *Effort:* low–medium (pure SVG geometry + a small step loop / state machine).
- *Tradeoff:* the trail is a 1-D curve, not a 2-D grid, so this is "stepping along
  a rail," not free roam — which is exactly right for a linear roadmap.

**B. Camera-follow on the walker.**
Replace "scroll once on open" with "keep the walker near a fixed viewport line as it
steps." Reuse the `sceneRef` rect math (Roadmap.jsx ~L536–544) but call it per step
with smooth scroll. Keep parallax, but consider driving `--plx` off the **walker's
position** rather than raw scrollTop so sky/clouds parallax track the *character*.
- *Effort:* low (we already have the scroll + parallax plumbing).
- *Tradeoff:* on tap-to-jump-to-a-node, animate the walk + camera together so the
  jump feels like travel, not a teleport.

**C. 4-direction walk-cycle avatar (executes via `ANIMATION_PLAN.md`).**
`ANIMATION_PLAN.md` already specifies the pipeline: PixelLab `create_character`
(4-dir) → `animate_character` `walk`/`walking-4-frames` + `breathing-idle` →
horizontal strip PNGs → a CSS `steps()` `AnimatedSprite` that honors `reducedMotion`.
Wire that here:
- Pick the strip by current **facing** (from A); play **walk** while stepping,
  **idle/breathing** while parked on a node.
- Keep/repurpose the existing `roadmap-walker-bob` wrapper for the vertical bob so
  the two transforms (position vs. bob) don't fight (the file already notes this).
- Frame guidance (from research): **4 frames/direction** for walk, **4–6** for idle;
  ~6 fps; left/right mirrored from one set.
- *Effort:* medium, but it's **already planned** — this is the roadmap's first real
  consumer of that pipeline (note: the walker currently renders a `BeastSprite`, not
  a directional tamer; ANIMATION_PLAN's tamer-as-character path provides the 4-dir
  frames this needs).

**D. One overhead "walk-behind" layer.**
Pure paint-order in SVG: for a few hero props (a couple of trees per province, the
fog gate), split art into **base** (trunk/posts) and **canopy/arch** (top). Render
order: ground/decals → bases → **avatar** → canopies. When the walker's path passes
one of these, it'll slide behind the canopy.
- *Effort:* low–medium (needs split sprites — PixelLab can output a canopy variant,
  or split an existing PNG; then reorder draw calls).
- *Tradeoff:* only worth doing for props the trail actually passes behind; don't
  split all 14 prop types.

**E. Step & arrival micro-feedback.**
- **Grass rustle:** on a step that passes a grass/`decal_*` cluster, play a 2–3
  frame rustle (small skew/scale wobble via CSS, or a tiny PixelLab strip).
- **Settle/squash** on the avatar at each node arrival (and a ledge-style hop if the
  trail "drops" between sections).
- Optional **soft step tick** if app sound is enabled.
- *Effort:* low. *Tradeoff:* keep it subtle on mobile; all gated by `reducedMotion`.

**F. Slight tilt / depth polish (optional, cheap).**
A faint top-down tilt already exists via the horizon + ground gradient + parallax.
To nudge toward the DS look without 3D: a subtle `perspective`/`skewY` or a scale
gradient (props slightly larger toward the bottom/foreground) reinforces the tilted
camera. Low effort; do only if it reads well on small screens.

### SKIP (cost > value for a mobile web SVG roadmap)

- **A real 2-D tile-grid engine / tilemap.** Our world is a linear path, not a
  free-roam map. A grid engine (collision grid, A*, multi-map streaming) is a
  rewrite with no payoff for a guided roadmap. Borrow the *feel*, not the engine.
- **Free 4-directional roaming / WASD control.** Progression is linear and
  tap-driven; free roam invites dead-ends and offscreen wandering on mobile.
- **True 3D / billboarded perspective camera (Gen 5).** Real 3D (Three.js, depth
  sorting, billboards) is heavy for a mobile PWA and overkill. Emulate the *vibe*
  with the F tilt + parallax we already have.
- **Cinematic camera sweeps / rotating bridge cams.** Lovely in Gen 5, but a
  rotating camera fights a vertically-scrolling SVG and a small viewport. At most,
  a one-off scripted pan when a new province/section unlocks — not a general system.
- **Per-tile encounter RNG / wild battles.** Different product. Our "encounter
  zones" are the **stage nodes** (lessons/quizzes); the grass-rustle cue (E) is the
  right nod without inventing a battle loop.
- **8-direction / diagonal walk frames.** Our serpentine path is mostly vertical
  with gentle curves; 4 directions (mirrored L/R) cover it. Diagonals = more art
  for little gain.

### Effort / impact summary

| Rec | Effort | Impact | Notes |
|---|---|---|---|
| A. Step-along-path walker | Low–Med | **High** | SVG `getPointAtLength`; the core "walking" feel |
| B. Camera-follow walker | Low | **High** | Reuse `sceneRef` scroll + parallax plumbing |
| C. 4-dir walk-cycle | Med | High | **Already specced** in `ANIMATION_PLAN.md`; needs 4-dir frames |
| D. Overhead walk-behind layer | Low–Med | Med–High | Paint-order in SVG; split a few hero props |
| E. Step/arrival micro-feedback | Low | Med | Rustle + settle; gate on `reducedMotion` |
| F. Tilt/depth polish | Low | Low–Med | Optional; verify on small screens |
| (skip) tile engine / 3D / sweeps / encounters | — | — | Cost > value for our linear SVG roadmap |

### Cross-cutting constraints
- **`reducedMotion`** must gate stepping, bob, walk-cycle, rustle, parallax, and
  camera-follow — fall back to instant placement + static frame (matches the
  existing pattern in `useStore`/Roadmap and `ANIMATION_PLAN.md`).
- **Performance:** keep stepping in one rAF/CSS-driven loop; the static decorative
  scene is already memoized — don't re-render the ~500 decor elements on each step
  (only the walker/nodes layer should update).
- **Sequencing:** A + B first (biggest feel-per-effort, no new art), then C once the
  4-dir avatar frames land from the animation pipeline, then D/E polish.

---

## Sources

- [Recreating the 2.5D effect from Pokémon Black & White — mjakeman](https://mjakeman.substack.com/p/recreating-the-25d-effect-from-pokemon)
- [Top-down Grid Movement in Godot — Sandro Maglione](https://www.sandromaglione.com/articles/top-down-grid-movement-in-godot-game-engine)
- [Movement speed — Bulbapedia](https://bulbapedia.bulbagarden.net/wiki/Movement_speed)
- [Mach Bike — Bulbapedia](https://m.bulbapedia.bulbagarden.net/wiki/Mach_Bike)
- [Bicycle — Bulbapedia](https://bulbapedia.bulbagarden.net/wiki/Bicycle)
- [Skyarrow Bridge — Bulbapedia](https://bulbapedia.bulbagarden.net/wiki/Skyarrow_Bridge)
- [Why Pokémon Gen 5 Graphics & Animations Look So "Terrible" — ScreenRant](https://screenrant.com/pokemon-black-white-gen-5-graphics-animations-bad/)
- [Overworld move animation frames — PokéCommunity](https://www.pokecommunity.com/showthread.php?t=357904)
- [Overworld Movement — Pokémon Speedruns wiki](http://wiki.pokemonspeedruns.com/index.php/Overworld_Movement)
- [Tiles and tilemaps overview — MDN](https://developer.mozilla.org/en-US/docs/Games/Techniques/Tilemaps)
- [Development: Pokémon D/P & HG/SS Overworld Sprites — TCRF](https://tcrf.net/Development:Pok%C3%A9mon_Diamond_and_Pearl/Sprites/Overworld_Sprites) (referenced; Gen 5 sprite page was unusable — served an AI-test payload)
