# InfraLearn — Session Handout

Branch: `claude/gallant-ritchie-j9fslm` (all work committed + pushed here; `main` is behind).
Last commit at handout: `0c2dd72` (Dragon baby-first evolution).

This session was a large art + feature pass driven by PixelLab. This doc captures
**what shipped, the current state, the asset/ID inventory, and the remaining rollout**
so work can resume cleanly.

---

## 1. Core principle (do not violate)

- **Beasts are NEVER humanoid.** Generate them with PixelLab **object mode**
  (`create_1_direction_object` → `animate_object`), which has no skeleton to rig.
  The `create_character` (humanoid) path was tried and **rejected** — it redraws
  creatures as humanoid blobs.
- Art is **regenerated**, not pixel-ingested: the MCP tools take inline base64
  (impractical to paste reliably) and there's **no `PIXELLAB_API_KEY`** in this env
  for a REST script. So we regenerate faithfully via object mode rather than
  animating the exact original PNGs.

---

## 2. Animation pipeline (how a beast/avatar gets animated)

1. `create_1_direction_object(description, size:200, view:'top-down')` → object_id
   (cost ~20 gens, ~30–90s). Object mode = oval/standalone creature, no skeleton.
2. `animate_object(object_id, animation_description, mode:'v3', frame_count:6)`
   → 7 frames (v3 stores the reference frame too). ~3–7 min. Concurrency cap = **8 jobs**.
3. `get_object(object_id)` → frame URL base `.../animations/<animId>/unknown/{i}.png`.
4. Download `0..6.png` → `public/beasts/anim/<folder>/`.
5. Register in `src/data/beastAnims.js` (`BEAST_ANIMS[species][tier]`).

**Render:** `src/components/AnimatedSprite.jsx` (frame-swap via rAF, preloaded,
reduced-motion → frame 0). `BeastSprite` and `AvatarSprite` check their manifest
(`beastAnims.js` / `anims.js`) and play the loop if present, else fall back to the
static sprite. A `frames:1` entry renders a single static frame.

---

## 3. Beast roster — looks + object IDs

All generated skeleton-free (object mode). "Adult form" = the art-directed look,
currently the animated idle. Folders are under `public/beasts/anim/`.

| Species (key) | Display | Adult look | Adult obj_id | Adult folder | Baby obj_id |
|---|---|---|---|---|---|
| dragon | Dragon | Azure Qinglong (teal, antlers, pearl) | `06cb723a` | `azure_dragon_idle` | `b04b254c` ✅wired |
| phoenix | Phoenix | Firebird (orange/gold) | `a07aa625` | `phoenix_idle` | `e14e64af` |
| griffin | Griffin | Storm griffin (sapphire/gold) | `c74848f9` | `griffin_idle` | `866cf887` |
| unicorn | **Qilin** | Jade qilin (scales, flame mane) | `ee43b11e` | `qilin_idle` | `525d8755` |
| kraken | Kraken | Cthulhu (tentacle face, eyes) | `5a741333` | `kraken_idle` | `ffec88bc` |
| hydra | Hydra | Many-headed water serpent | `273f78ab` | `hydra_idle` | `e3e09984` |
| cerberus | Cerberus | Purple-black 3-head, blue gem | `5bf96c48` | `cerberus_idle` | `7d9aa543` |
| pegasus | Pegasus | **Black mecha warhorse, red eyes** ⚠️ | `d4c91011` | `pegasus_idle` | `4625b876` ⚠️ |
| sphinx | Sphinx | Babylonian-Egyptian (gold/crimson, lamassu, bestial face) | `888efeea` | `sphinx_idle` | `3d175918` (generating) |
| wyvern | Wyvern | Earth wyvern (mossy, 2-legged) | `a7300413` | `wyvern_idle` | `315631fa` |

⚠️ **Pegasus: the user will change it soon — do NOT finalize.** Both adult `d4c91011`
and baby `4625b876` are subject to redesign.

Notes:
- `unicorn` is the internal species **key**; display name is **Qilin** (renamed in
  `beasts.js`: name + forms). Its egg/anim files use the `unicorn` key
  (`eggs/unicorn.png`) except the anim folder is `qilin_idle`.
- Sphinx kept a **bestial (non-human) face** per the no-humanoid rule, with a Gilgamesh
  gold-and-red palette + Mesopotamian/Egyptian motifs.

---

## 4. Evolution model (Pokémon-style, baby-first)

Egg → **hatch animation (egg cracks)** → **T1 Baby** (no eggshell on the sprite) →
**T2 Juvenile/slightly-grown** → **T3 Adult (art-directed form)** → **T4 Elder/Mega**.

The baby tier is **animated** (it's the early-game beast the egg hatches).

**Dragon is the finished template** (`BEAST_ANIMS.dragon`):
- T1 `dragon_baby_idle` (animated, baby) · T2 `azure_dragon_idle` (animated) ·
  T3 `dragon_t3` (static adult storm) · T4 `dragon_t4` (static celestial emperor).
- Dragon evo tier obj_ids: T3 `a4d20c11`, T4 `1f421512`. (`dragon_t2` `b2a965ca` =
  unused "young on clouds" — azure took the T2 slot.)

**Babies approved + WIRED** ("I like all the babies"). All 9 species (Pegasus
excepted) are now baby-first in `beastAnims.js`: **T1 = `<species>_baby_idle`
(animated baby)**, **T2 = adult `<species>_idle`**. Dragon also has T3/T4. Baby
frames are committed under `public/beasts/anim/*_baby_idle/`. Pegasus baby
`4625b876` exists but is NOT wired (awaiting redesign).

---

## 5. Eggs + hatching (shipped)

- 10 species eggs: `public/beasts/eggs/<speciesKey>.png` (64×80, `create_map_object`).
- `src/data/eggs.js` → `eggSrc(species)`.
- `BeastPicker` has an `egg` prop: grid + detail card show the egg, element, and the
  new beast `desc`. Onboarding `BeastStep` passes `egg`. `PathStep` shows the chosen
  egg and "Hatch & begin" reveals the beast (existing confetti).
- **TODO:** make the hatch a real **egg-cracks-open** animation revealing the baby
  (currently a confetti swap). Egg obj_ids are map-objects (auto-delete after 8h;
  the PNGs are committed so that's fine).

---

## 6. Other features shipped this session

- **Wardrobe (ByteBeast `WARDROBE` tab)**: custom SVG avatar **removed**; look = Tamer
  or Armor set; armor **wields its weapon**; loadout strip + Looks/Armor toggle.
  (`src/components/Wardrobe.jsx`, `AvatarSprite.jsx`.)
- **Armor sets**: 24 full-body sets (8 paths × bronze/silver/gold) + 8 weapons.
  `src/data/armorSets.js`, `public/armor/`.
- **Beast Tamer avatars**: 8 presets, 4-dir, `public/tamers/`. `src/data/tamers.js`.
  Default avatar = `ember_warden`.
- **Descriptions**: `beasts.js` per-species `desc`; `content.js` per-path `desc`.
- **Roadmap**: PixelLab map props, gamified node chips, seam-free gradient ground +
  scattered decals, camera-follow on walker advance. Research: `POKEMON_DS_RESEARCH.md`,
  `ANIMATION_PLAN.md`, `BEAST_TABS_MOCKUP.md`, `ARMOR_DESIGN.md`.
- **Tests:** 371 passing; build clean (last verified before evolution wiring).

---

## 7. REMAINING WORK (the rollout)

### A. ✅ DONE — baby-first wired for 9 species
All 9 (Pegasus excepted) are baby-first in `beastAnims.js`: T1 animated baby
(`<species>_baby_idle`) → T2 animated adult (`<species>_idle`). Committed + pushed.

### B. Generate T2 (slightly-grown) + T4 (elder/mega) per species  ← NEXT
~18 sprites (object mode, escalating each approved adult look). T3 = the existing
adult form. Wire as `frames:1` static (or animate later).

### C. Pegasus redesign (user-initiated, pending their direction).

### D. Tamer idle animations — 7 queued earlier, **done on PixelLab, never downloaded**.
Character IDs: ember_warden `d069c236`, tide_caller `3772f466`, thorn_ranger `1d7b6825`,
sky_courier `246fa4a9`, cipher_sage `2c0f6e50`, circuit_smith `b4baa16f`,
null_walker `ed612913`. (dawn_shield `e4d92706` done + wired in `anims.js`.)
For each: `get_character` → download `breathing-idle` south frames →
`public/anim/<tamer>_idle_south/` → add to `TAMER_ANIMS` in `src/data/anims.js`.

### E. Hatch-crack animation (see §5).

---

## 8. Gotchas / environment

- **Push to `main` is blocked** by the auto-mode classifier; push to the feature
  branch is fine. Merge to main needs explicit user go-ahead.
- Commit author must be `noreply@anthropic.com` / `Claude` (a stop-hook checks).
- PixelLab object/animation concurrency cap = **8 jobs**; `create_map_object` rate-limits
  at ~5 concurrent.
- `map-objects` (eggs) auto-delete after 8h on PixelLab; `objects`/`characters` persist.
- `/tmp/babies`, `/tmp/evo`, `/tmp/species`, `/tmp/regen`, `/tmp/eggs` are **ephemeral**
  staging — re-download from obj_ids if the container recycled.
- No `PIXELLAB_API_KEY` env; the MCP server is the only generation path.

---

## 9. Quick resume checklist (next session)

Baby-first (§7.A) is **done**. Remaining, in priority order:
1. **Pegasus redesign** — get the user's direction; regenerate adult + baby
   (object mode, no humanoid), animate, wire baby-first like the others.
2. **Escalation tiers** (§7.B) — T2-grown + T4-elder per species (~18 sprites);
   wire as `BEAST_ANIMS[species][3|4]` (static `frames:1` or animate).
3. **Tamer idles** (§7.D) — `get_character` each of the 7 IDs → download
   `breathing-idle` south → `public/anim/<tamer>_idle_south/` → `anims.js`.
4. **Egg-crack hatch animation** (§5) — replace the confetti reveal.
5. Each step: `npm run build` + `npm test`, commit, push to the feature branch.
6. **Merge to `main`** when the user approves (push to main needs their go-ahead).
