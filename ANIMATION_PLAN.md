# Animation Plan — Byte Beasts & Beast Tamers (PixelLab)

Goal: give the Byte Beasts and the player avatars (Tamers + Armor sets) at least
an idle / breathing loop, ideally a walk cycle, using PixelLab's animation tools,
and render them in React respecting `settings.reducedMotion`.

This is a **research + planning** document. No application code is changed here.

---

## 0. Current asset inventory (what we actually have)

| Asset class | How it was made | Files | Skeleton? | character_id kept? |
|---|---|---|---|---|
| **Byte Beasts** | `/v1` text-to-image (`generate-null-beasts.mjs` pattern; the tier sprites predate the repo scripts) | `public/beasts/<species>_<tier>.png` (96×96) + `public/beasts/null_<id>.png`; indexed by `public/beasts/manifest.json` | **No** — flat single-frame PNGs | **No** |
| **Beast Tamers** | `/v2/create-character-with-4-directions` (`generate-tamer-avatars.mjs`) | `public/tamers/<id>_<dir>.png` (4 dirs: south/west/east/north, ~64–92px) | **Yes** — these were real skeletoned characters | **No — the script discarded the `character_id` after downloading the 4 PNGs** |
| **Armor sets** | `create_map_object` (`/v1`, per the `armorSets.js` header comment) | `public/armor/<path>_<tier>.png` (64×96) + `public/armor/weapon_<path>.png` (48×64) | **No** — plain map objects, single view, single frame | **No** |

Rendering today:
- `src/components/BeastSprite.jsx` — `<img>` from manifest, `imageRendering: 'auto'`.
- `src/components/AvatarSprite.jsx` — armor `<img>` (priority) → tamer `<img>` (4-dir) → hand-built layered SVG. Armor/tamer use `imageRendering: 'pixelated'`.
- `settings.reducedMotion` lives at `src/store/useStore.js:426` and is consumed in ~12 places (ByteBeast, Roadmap, CampHero, Cutscene, etc.). Any animation we add **must** honor it.

---

## 1. PixelLab animation paths and which fits each asset class

There are two distinct families in the PixelLab MCP server, and the split matters:

### A. Character animations — `animate_character`
Requires a `character_id` produced by `create_character` (a **skeletoned** character with
4 or 8 directional rotations). Three modes (from the tool schema):

- **template** — pass a `template_animation_id` (e.g. `breathing-idle`, `walk`, `walking-4-frames`, `running-6-frames`). **1 generation per direction.** Frame count fixed by the template. This is the cheap, high-quality path for humanoids.
- **v3** (default when no template) — custom `action_description`, `frame_count` 4–16. 1 gen/direction, cheap, easy to re-roll.
- **pro** — sequential, cross-direction reference, 20–40 gen/direction. Highest quality, expensive; needs explicit cost confirmation.

Humanoid templates include `breathing-idle`, `walk`, `walking`, `walking-4-frames`, `walking-6-frames`, `running-*`, plus action templates. **Quadruped** characters (the beasts) use a quadruped skeleton (`create_character` with `body_type: 'quadruped'`, `template` one of `bear/cat/dog/horse/lion`) and have their **own** template set — call `get_character` to enumerate them.

> **Hard constraint:** `animate_character` cannot animate a loose PNG. It needs a
> `character_id`. None of our three asset classes currently have a usable
> `character_id` (the tamers had one but the generation script threw it away).

### B. Object animations — `animate_object`
Works on an **object** created by the object endpoints (`create_map_object`, `create_1_direction_object`, `create_8_direction_object`). It does NOT require a skeleton. Two modes:

- **v3** (default, recommended) — `animation_description`, `frame_count` 4–16. Cheap. Supports **interpolation**: pass `custom_start_frame_base64` (a starting pose image) and/or `end_frame_base64` to animate between two poses on a single direction. This is the key feature: **a v3 object animation can be seeded from an existing image**, so it can animate something close to our existing armor art.
- **pro** — 20–40 gen/direction, expensive.

### C. Image-seeded animation (the "animate from a PNG" path)
- The hosted **"Animate with Text (New)"** web tool animates an arbitrary reference image (≤256×256, frames 4–16 even, pixel-budget `w×h×frames ≤ 524,288`) with no character_id. It is **not exposed as an MCP tool** — it is a hosted/Creator workflow. The MCP equivalent of "animate from an image" is `animate_object` v3 with `custom_start_frame_base64`.
- **text2animation** generates a spritesheet **from a text prompt only** (no image, no skeleton) — useful for a fresh asset, not for animating an existing sprite. Output is a grid spritesheet (16 frames as 4×4 for ≤64px; 4 frames as 2×2 for larger). Tier-1 sub.
- **animate-with-skeleton / animation-to-animation** are skeleton-transfer workflows (estimate or borrow a skeleton, then re-pose). Powerful but Tier-2 and more hands-on; not needed for a first pass.

### Verdict per asset class

| Asset | Can we animate the existing PNG directly via MCP? | Best path |
|---|---|---|
| **Byte Beasts** | No (no character_id). | **Re-generate as `create_character` quadruped**, then `animate_character` template `breathing-idle` (and a walk template). Highest quality, reusable across tiers' worth of work. The v1 PNGs were single-view text-to-image; a quadruped character also gives us proper directional sprites for free. |
| **Tamers** | No (character_id was discarded). | **Re-generate as `create_character` humanoid** (4 or 8 dir) — this also *replaces* the lossy 4-direction script — then `animate_character` template `breathing-idle` + `walk`. We get the static directional frames AND the animations from one character. |
| **Armor sets** | Closest yes. They are objects; `animate_object` v3 can seed from the current frame. But to get a real character-style breathing/walk we'd want them as `create_character` humanoid too. | **Two options.** (a) Cheap: keep as objects, `animate_object` v3 `"gentle breathing idle"` seeded from the existing PNG (`custom_start_frame_base64`). (b) Better: re-generate each set as a `create_character` humanoid and use `breathing-idle`/`walk` templates — but that's 24 characters and loses the "object" framing. **Recommend (a) for breathing, defer walk.** Armor is shown front-facing/static in the avatar slot today, so an idle is plenty. |

---

## 2. Recommended approach

**Phase the work. Do beasts properly as characters; do armor cheaply as objects; redo tamers as characters (which also upgrades their static art).**

1. **Beasts (primary target).**
   For each species (10) at the display tier(s) we care about:
   - `create_character` `body_type:'quadruped'`, an appropriate `template` (most of our beasts are wing/serpent/equine — `cat`/`dog`/`lion`/`horse` skeletons are the only quadruped options, so pick the nearest gait per species; e.g. `lion` for cerberus/sphinx, `horse` for pegasus/unicorn, `cat` for griffin/wyvern/dragon). `view:'low top-down'`, `size` ~64–96, description copied from the species/null-beast prompts so the look matches.
   - `get_character` to read the available quadruped template animations.
   - `animate_character` template `breathing-idle` (idle loop) — all directions, 1 gen/dir.
   - Optionally `animate_character` template `walk`/`walking-*` for the roadmap walker.
   - Download the animation frames (the character record exposes per-animation frame URLs / a download link via `get_character`).

   Note on tiers: we have 4 tiers × 10 species + 5 bosses = 45 beast images. Animating **all 45** as characters is a lot. Recommend animating **one representative tier per species first** (e.g. tier 1, the resting state shown most often), and only fanning out to other tiers if the idle reads well. Bosses (Null Beasts) are big set-pieces and good walk/idle candidates later.

2. **Tamers (8).**
   Re-run a rewritten generator that, per tamer, calls `create_character` humanoid (reuse the existing rich prompts in `generate-tamer-avatars.mjs`), **persists the returned `character_id`** (write a `public/tamers/manifest.json` mapping id→character_id), downloads the static directional frames (replacing today's 4 PNGs), then `animate_character` template `breathing-idle` + `walk`, and downloads those frames too. Keeping the character_id means future animations cost nothing to set up.

3. **Armor (24 sets + 8 weapons).**
   `animate_object` v3, `animation_description:'gentle idle breathing, slight bob'`, `frame_count:6`, seeding from the existing PNG via `custom_start_frame_base64`. One direction (these are single-view). Cheap. Skip weapons (icons, no need to breathe). Walk cycle for armor is **out of scope** (armor avatar is shown standing).

**Why re-generate rather than image-animate the beasts:** the MCP `animate_character` template path is the only route to clean, loopable, multi-frame, multi-direction beast animation at 1 gen/direction. Image-seeded `animate_object` on a beast PNG would work but gives lower-quality, non-skeletal motion and no directional consistency. Since we control the generation scripts and prompts, regenerating as characters is the durable choice — and it gives us directional beast sprites we don't currently have.

---

## 3. Output format and frames per loop

PixelLab returns animations as **individual frames per direction** (downloadable as separate PNGs, plus a packed download). For the web app, **standardize on a horizontal sprite-strip PNG per (asset, animation, direction)**: post-process the downloaded frames into one strip at build/generation time.

Recommended frame counts:
- **Idle / breathing:** 4–6 frames. `breathing-idle` template fixes this; for v3/object use `frame_count:4` or `6`.
- **Walk cycle:** 6–8 frames (`walking-6-frames` / `walking-8-frames`).

Strip layout: frames laid left-to-right, each cell the character's native size (e.g. 96×96 for beasts). Filename encodes the geometry so the renderer needs no metadata fetch, e.g. `dragon_1_idle_s_6.png` (6 = frame count). Optionally extend `manifest.json` with an `anim` block per species so the component reads frame count/size from there (mirrors how it already reads tier→file).

---

## 4. React rendering plan

### Approach: CSS `steps()` sprite-strip animation (preferred)

A single strip PNG + a CSS keyframe that steps `background-position` is the cheapest,
jankiest-free option (GPU-composited, no per-frame React renders, no JS rAF loop).
Frame-swapping in JS (swapping `<img src>` on a timer) is the fallback when a strip
isn't available, but it causes extra renders and network churn — avoid for the common case.

Proposed reusable component `src/components/AnimatedSprite.jsx`:

```jsx
// Renders a horizontal sprite-strip as a stepped CSS animation, with a
// static-first-frame fallback that also satisfies reducedMotion.
import { useStore } from '../store/useStore.js';

export default function AnimatedSprite({
  strip,            // url to the N-frame horizontal strip
  staticSrc,        // url to a single static frame (reducedMotion / fallback)
  frames,           // N
  size,             // displayed px (square) — beasts 96, tamers/armor per-slot
  fps = 6,
  className = '',
  style = {},
}) {
  const reduced = useStore((s) => s.settings?.reducedMotion);

  if (reduced || !strip) {
    return (
      <img src={staticSrc} width={size} height={size}
           draggable={false}
           style={{ imageRendering: 'pixelated', ...style }} />
    );
  }

  const dur = frames / fps; // seconds per loop
  return (
    <span
      className={`animated-sprite ${className}`}
      style={{
        width: size,
        height: size,
        display: 'inline-block',
        backgroundImage: `url(${strip})`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: `${size * frames}px ${size}px`,
        imageRendering: 'pixelated',
        animation: `sprite-${frames} ${dur}s steps(${frames}) infinite`,
        ...style,
      }}
      role="img"
    />
  );
}
```

Plus one CSS keyframe per distinct frame count in `src/styles/theme.css`:

```css
@keyframes sprite-6 { from { background-position: 0 0; }
                      to   { background-position: -600px 0; } } /* size*frames at size=100 */
/* Better: drive the end position from a CSS var so one keyframe covers all sizes:
   animation uses --w = size*frames, to { background-position: calc(-1 * var(--w)) 0 } */
@media (prefers-reduced-motion: reduce) { .animated-sprite { animation: none; } }
```

The `prefers-reduced-motion` media query is a belt-and-suspenders backstop in addition
to the JS `settings.reducedMotion` check, matching the existing pattern (e.g. `.camp-static`
in `theme.css`).

### Adoption

- **`BeastSprite.jsx`:** when the manifest has an `anim` entry for `{species, tier}`,
  render `<AnimatedSprite strip=... staticSrc=<current png> frames=... size=size />`;
  otherwise fall back to today's `<img>`. This keeps every existing call site
  (`<BeastSprite species tier size />`) working unchanged — the animation is purely
  additive and manifest-driven. (Note: today beasts use `imageRendering:'auto'`; animated
  strips should use `'pixelated'` to keep edges crisp at the stepped scale.)
- **`AvatarSprite.jsx`:** in the armor branch and the tamer branch, swap the `<img>`
  for `<AnimatedSprite>` when an idle strip exists for that id (+ direction for tamers),
  falling back to the existing static `<img>`. The hand-built SVG branch is untouched.
  Tamers keep the `direction` prop; pick the strip for the active facing.

No call-site signatures change. `reducedMotion` is honored in one place
(`AnimatedSprite`) so we don't sprinkle the check across screens.

---

## 5. Storage / naming convention under `public/`

Keep current dirs; add an `_anim` suffix space and encode frames + direction in the name:

```
public/beasts/<species>_<tier>.png                 # existing static (= idle frame 0)
public/beasts/<species>_<tier>_idle.png            # idle strip, frames in manifest
public/beasts/<species>_<tier>_walk_<dir>.png      # optional walk, per direction
public/beasts/manifest.json                        # extend: add "anim": { idle: { file, frames, size }, walk: {...} }

public/tamers/<id>_<dir>.png                        # existing static directional
public/tamers/<id>_idle_<dir>.png                  # idle strip per direction
public/tamers/<id>_walk_<dir>.png                  # walk strip per direction
public/tamers/manifest.json                        # NEW: { <id>: { character_id, frames, size, dirs } }

public/armor/<path>_<tier>.png                     # existing static
public/armor/<path>_<tier>_idle.png                # idle strip (single view)
public/armor/manifest.json                         # NEW: { <id>: { frames, size } }
```

Rationale: the strip's first cell is identical to the existing static PNG, so the
static file doubles as the `reducedMotion` fallback (no extra art). Frame count and
cell size live in a manifest so the renderer never has to parse the filename — same
pattern `BeastSprite` already uses for tier→file.

---

## 6. Rough cost / time

Generations are the billing unit. `create_character` standard = 1 gen; `animate_character` template = **1 gen per direction**; `animate_object` v3 ≈ 1 gen per direction; pro modes 20–40×.

| Wave | Work | Generations (approx) | Wall time |
|---|---|---|---|
| **PoC** | 1 beast: create_character (1) + breathing-idle template, 4 dir (4) | **~5** | ~10 min |
| **Beasts idle** (10 species, tier 1 only, 4 dir) | 10 × (1 create + 4 idle) | **~50** | ~1–2 hr (async, sequential to be API-kind) |
| **Beasts walk** (same 10, 4 dir) | 10 × 4 | **~40** | ~1 hr |
| **Beasts all tiers** (if pursued: +30 more species/tier) | 30 × (1 + 4) | **~150** | several hrs |
| **Tamers** (8, create 4-dir + idle + walk, 4 dir each) | 8 × (1 + 4 + 4) | **~72** | ~1–2 hr |
| **Armor idle** (24 sets, v3 object, 1 view, seeded) | 24 × 1 | **~24** | ~30–60 min |

Totals: a **focused MVP** (1 representative tier of beasts idle + tamers idle + armor idle) is on the order of **~150 generations**. Full coverage incl. all beast tiers and walk cycles is **~350–400**. Each animation job is async (~2–4 min). Confirm the PixelLab balance with `get_balance` before a big wave; **never** use `pro` mode without an explicit cost check (the schema enforces `confirm_cost`).

Caveat: pixel budgets/canvas caps apply (v3 image animation ≤256px; `w×h×frames ≤ 524,288`). At 96px and 8 frames that's 73,728 — comfortably under.

---

## 7. Proof-of-concept recommendation (do this first)

**Animate one beast's idle loop end-to-end before scaling.**

1. `get_balance` to confirm credits.
2. `create_character` quadruped for **Dragon tier 1** (reuse the dragon prompt language; `template:'cat'` or `'lion'`, `view:'low top-down'`, `size:64`). Poll `get_character` to completion. Save the `character_id`.
3. `get_character` → read the available quadruped template animation ids.
4. `animate_character` template `breathing-idle` (or the closest quadruped idle), all 4 directions. Poll to completion.
5. Download the frames, pack the south-facing frames into a horizontal strip
   `public/beasts/dragon_1_idle.png`, add an `anim` block to `manifest.json`.
6. Build a throwaway `AnimatedSprite` and point one ByteBeast view at it. Verify:
   - the loop reads as "breathing" (not jittery) at fps 4–6,
   - edges stay crisp (`imageRendering: pixelated`),
   - `reducedMotion` ON shows the static first frame with no motion,
   - file size is acceptable (strip ≈ 6× a single PNG).

**Decision gate:** if the dragon idle looks good and the strip pipeline is clean,
fan out to the other 9 species (idle), then tamers, then armor, then optionally walk
cycles and remaining tiers. If quality is poor, escalate that single beast to
`v3` (custom `action_description: 'gentle breathing idle'`) before considering `pro`.

---

## Key risks / open questions

- **Quadruped skeleton fit:** our beasts (dragons, krakens, phoenixes, hydras) are not
  literal cats/dogs/horses/lions. The quadruped templates may distort wings/serpents.
  The PoC must validate this; if the skeleton fights the art, fall back to
  `animate_object` v3 seeded from the existing beast PNG (treats the beast as an object,
  no skeleton, lower fidelity but on-model).
- **Style drift on re-generation:** new characters won't pixel-match the existing PNGs.
  Mitigate with the same prompts + `view`/`detail`/`outline` params already pinned in the
  scripts, and consider BitForge style-reference (the `STYLE_REF` mechanism used in
  `generate-map-props.mjs`) to lock the look to an existing sprite.
- **Lost tamer character_ids:** unavoidable re-generation; treat it as an upgrade
  (we'll persist the ids this time in `public/tamers/manifest.json`).
- **Strip vs. per-frame CSS at multiple sizes:** drive the keyframe end-position from a
  CSS variable (`--w = size*frames`) so one keyframe per frame-count covers every render
  size; otherwise we'd need a keyframe per (size, frames) pair.
