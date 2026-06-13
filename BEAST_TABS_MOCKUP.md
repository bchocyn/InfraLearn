# Byte Beast — Tab Redesign Mockup

> Mockup only. No app code changes. Targets the 375px iPhone first; desktop reuses
> `.beast-page-grid` (6fr/4fr two-column). Visual vocabulary follows `theme.css`
> (`kicker`, `card`, `pill`, `btn`, `avatar-variant`, `avatar-slot`, `beast-stage`).

---

## TL;DR — Recommendation

**Adopt Concept B: rename `AVATAR` → `WARDROBE`, and inside it use a two-segment
toggle ("Looks" / "Armor") instead of the current Custom-row + `<details>` armor
drawer.** Keep the tab bar at 4 tabs (`🧬 EVOLVE · 🖼 SCENES · 🏆 BADGES · 🎽 WARDROBE`)
so the 375px tab row stays uncrowded and the IA people already learned doesn't move.

- The CUSTOM part-builder is being removed, so the WARDROBE only ever shows two
  source types — **Tamers** and **Armor**. A 2-segment toggle is the lightest control
  that fits that exactly; no nested accordion, no third tab.
- Armor is the new headline collection (24 sets + 8 weapons), so it gets a full
  scrollable province list with a visible **"x / 24 sets"** counter and locked/unlocked
  states — room the cramped `<details>` never had.
- The **equipped loadout** (who you are + your weapon) gets a persistent summary strip
  at the top of WARDROBE, so the current "buried equipped state" problem goes away.
- Touches only existing store fields — `avatar.tamer`, `avatar.armor` (+ the legacy
  `avatar.*` part fields that go dormant once CUSTOM is gone). No new persisted state.

Concept A (split into a 5th tab) and Concept C (full-bleed accordion) are described
below as the alternatives that were weighed.

---

## 1. Teardown of the current 4 tabs

Source: `src/screens/ByteBeast.jsx`, `src/components/AvatarCreator.jsx`.

The screen is: header row (title + Tier/element pills + TROPHIES / CODEX / JOURNEY
pills) → **beast stage** (background scene, equipped-background label, the beast
sprite center, and a tiny 32px human `AvatarSprite` in the corner) → **tab row** →
tab content (left column) + **About this beast** aside (right column on desktop).

| Tab | What it does | State it touches |
|---|---|---|
| `🧬 EVOLVE` | `EvolutionViewer` — 4-step evo line for the current species, "next evolution" needs + path % progress bar. | `companion`, `beastTier`, `activePath`, `completed` |
| `🖼 SCENES` | `Scenes` — 2-col grid of nature backgrounds, locked/unlocked, equip one as the beast's home. | `unlockedBackgrounds`, `beastBackground`, `setBackground` |
| `🏆 BADGES` | `Badges` — hex badge grid, one per path, bronze/silver/gold by % complete. | `completed` |
| `🧑 AVATAR` | `AvatarCreator` — the human tamer editor (see below). | `avatar.*`, `setAvatar`, `completed` |

### What's cramped / awkward now

- **The AVATAR tab is overloaded.** In one scrolling column it stacks: a 120px
  preview, a **Custom** chip + **8 Tamer** chips, then an **Armor Sets `<details>`**
  drawer that — when open — lists **8 provinces × 3 tiers = 24 chips** plus weapon
  badges, then a footer. That is ~33 selectable thumbnails competing in one view.
- **Armor is hidden behind a collapsed `<details>`.** The biggest new collection in
  the app defaults to collapsed unless something is already equipped. There's no
  "x / 24 collected" sense of progression — the marquee feature reads as a footnote.
- **Three mutually-exclusive "modes" share one flat list.** Custom vs Tamer vs Armor
  are exclusive looks, but the UI doesn't frame them as a choice — picking a Tamer
  silently clears armor (`onChange({ tamer: id, armor: null })`) with no grouping cue.
- **The equipped weapon is nearly invisible.** A legendary weapon only renders as a
  16px badge in the corner of a gold chip + a sentence in the footer. A headline
  reward has no headline placement.
- **"AVATAR" is the wrong word now.** Post-armor, the tab is about equipping a full
  collected wardrobe/loadout, not "making an avatar." The CUSTOM builder — the only
  thing that made it an *avatar editor* — is being removed entirely.
- **Stage co-existence is unclear.** The human `AvatarSprite` is a 32px corner element
  on the stage; when you equip a gold dragon-lord armor set, that pairing (beast +
  tiny human) isn't legible at 32px and the wardrobe tab never previews it on-stage.

---

## 2. Redesign concepts (375px wireframes)

All three keep the header + beast stage identical; they differ in the tab bar and the
old AVATAR content. Stage shown once, then per-concept tab content.

### Shared header + stage (all concepts)

```
┌───────────────────────────────────────────┐ 375px
│ BYTE BEAST                                 │  kicker (amber)
│ Pyre Wyrm.                                 │  h1
│ Tier 3 · Dragon   [🔥 FIRE] [🏆][📖][🗺]  │  pills + action pills
├───────────────────────────────────────────┤
│ ┌───────────────────────────────────────┐ │
│ │ MEADOW                          ✦   ✦  │ │  stage-label (amber)
│ │                                        │ │  beast-stage 200px
│ │              (beast sprite 120)        │ │
│ │   [🧑]                  ___shadow___   │ │  32px human, corner
│ └───────────────────────────────────────┘ │
└───────────────────────────────────────────┘
```

---

### Concept A — Split out a 5th tab: `WARDROBE`

Tamers + Armor leave AVATAR and become their own tab. EVOLVE keeps the evo line;
a new WARDROBE owns looks + loadout. 5 tabs on one row at 375px is tight but the
existing code already clamps font + `whiteSpace: nowrap` for exactly this.

```
┌───────────────────────────────────────────┐
│ [🧬EVO][🖼SCN][🏆BDG][🎽WRDRB][🧑TAMER] │  5 tabs, clamp(11–13px)
├───────────────────────────────────────────┤
│ EQUIPPED                                   │  kicker
│ ┌───────────────────────────────────────┐ │
│ │ [armor 44] Ancient Dragon Lord  GOLD ★ │ │  loadout strip
│ │ ⚔ Flamebrand                  [Change] │ │
│ └───────────────────────────────────────┘ │
│                                            │
│ ARMOR SETS                       7 / 24 ▣ │  counter
│ FAANG Prep                                 │  province label
│ ┌──────┐┌──────┐┌──────┐                  │
│ │[44] ✓││[44] ✓││[44]★⚔│  Bronze/Slv/Gold │  avatar-variant chips
│ │BRONZE││SILVER││ GOLD │                  │
│ └──────┘└──────┘└──────┘                  │
│ DevOps                                     │
│ ┌──────┐┌──────┐┌──────┐                  │
│ │[44] ✓││[44]🔒││[44]🔒│                  │  locked = dim + 🔒
│ └──────┘└──────┘└──────┘                  │
│ … 6 more provinces (scroll) …             │
└───────────────────────────────────────────┘
```

- **Pros:** Armor and Tamers each get full breathing room; loadout strip always
  visible; clearest separation of "who I am" vs "what I wear."
- **Cons:** 5 tabs is the most crowded the 375px tab row can get; splitting Tamer
  and Wardrobe into *two* tabs re-introduces the same mutual-exclusivity confusion
  across a tab boundary (pick a Tamer in one tab, it clears the armor you set in the
  other). Adds an IA level for a screen that's already pill-heavy in the header.

---

### Concept B — Rename AVATAR → `WARDROBE`, 2-segment toggle inside ✅ recommended

Tab count stays 4. The old AVATAR tab becomes **WARDROBE** and opens with a sticky
**loadout strip** + a **Looks / Armor** segmented toggle. "Looks" = the 8 Tamers
(Custom removed). "Armor" = the province collection with the 24-set counter.

```
┌───────────────────────────────────────────┐
│ [🧬 EVOLVE][🖼 SCENES][🏆 BADGES][🎽 WRDRB]│  4 tabs (unchanged count)
├───────────────────────────────────────────┤
│ EQUIPPED LOADOUT                           │  kicker
│ ┌───────────────────────────────────────┐ │
│ │ [look 44]  Ancient Dragon Lord        │ │  loadout strip (card)
│ │            FAANG · GOLD ★              │ │
│ │            ⚔ Flamebrand               │ │
│ └───────────────────────────────────────┘ │
│                                            │
│ ┌─────────────────┬─────────────────────┐ │  segmented toggle
│ │  ● LOOKS        │   ARMOR  ·  7/24    │ │  (active = amber)
│ └─────────────────┴─────────────────────┘ │
│                                            │
│ ── LOOKS pane ──────────────────────────  │
│ BEAST TAMERS                       8 looks │  kicker + count
│ ┌──────┐┌──────┐┌──────┐┌──────┐          │  avatar-variants grid
│ │[44]  ││[44] ✓││[44]  ││[44]  │          │  (auto-fit minmax 76)
│ │Ember ││Tide  ││Thorn ││Sky   │          │
│ └──────┘└──────┘└──────┘└──────┘          │
│ ┌──────┐┌──────┐┌──────┐┌──────┐          │
│ │Cipher││Circ. ││Null  ││Dawn  │          │
│ └──────┘└──────┘└──────┘└──────┘          │
│ Tip: Tamers are always available. Armor   │  foot caption
│ is earned by path mastery.                 │
└───────────────────────────────────────────┘

  …tapping ARMOR swaps the pane (toggle persists):

┌───────────────────────────────────────────┐
│ ┌─────────────────┬─────────────────────┐ │
│ │   LOOKS         │  ● ARMOR  · 7/24    │ │
│ └─────────────────┴─────────────────────┘ │
│ ── ARMOR pane ──────────────────────────  │
│ FAANG Prep                       3/3 GOLD │  province head + per-line state
│ ┌──────┐┌──────┐┌──────┐                  │
│ │[44] ✓││[44] ✓││[44]★⚔│                  │  Bronze ✓ / Silver ✓ / Gold+weapon
│ │BRONZE││SILVER││ GOLD │                  │
│ └──────┘└──────┘└──────┘                  │
│ DevOps                           1/3      │
│ ┌──────┐┌──────┐┌──────┐                  │
│ │[44] ✓││[44]🔒││[44]🔒│  → "Reach Silver │  locked tooltip = armorUnlockHint()
│ │BRONZE││SILVER││ GOLD │     (66%)…"      │
│ └──────┘└──────┘└──────┘                  │
│ Fundamentals · MLOps · SWE · MLEng ·      │
│ Full-Stack · Cybersecurity   (scroll ↓)   │
└───────────────────────────────────────────┘
```

- **Pros:** No new tab — 375px tab row stays comfortable. Custom removal makes the
  source list binary, which is *exactly* a 2-way segmented control. Loadout strip
  fixes the invisible-weapon + buried-equipped problems. Armor gets a real
  collection view (visible counter + per-province progress) without an accordion to
  fight. Both exclusive looks live under one roof, so picking one clearing the other
  reads as switching a segment, not a hidden side effect.
- **Cons:** The Armor pane is still a long scroll (8 provinces). Mitigated by the
  per-province `n/3` headers acting as scannable section markers, and by sorting
  unlocked provinces above fully-locked ones.

---

### Concept C — Full accordion "collection book"

Keep 4 tabs, rename to WARDROBE, but instead of a toggle, make each source a
collapsible accordion section (Tamers, then one row per province), pet-Pokédex style.

```
┌───────────────────────────────────────────┐
│ [🧬 EVOLVE][🖼 SCENES][🏆 BADGES][🎽 WRDRB]│
├───────────────────────────────────────────┤
│ Equipped: Ancient Dragon Lord ⚔           │  one-line loadout
│ ▼ BEAST TAMERS                    1 worn   │  accordion header
│   ┌──────┐┌──────┐┌──────┐┌──────┐        │
│   │[44]  ││[44]✓ ││[44]  ││[44]  │        │
│   └──────┘└──────┘└──────┘└──────┘        │
│ ▶ FAANG PREP                  3/3 ★⚔      │  collapsed province rows
│ ▶ DEVOPS                      1/3         │
│ ▶ FUNDAMENTALS                2/3         │
│ ▶ MLOPS                       0/3 🔒      │
│ ▶ … (4 more)                              │
└───────────────────────────────────────────┘
```

- **Pros:** Most compact vertically; "collection book" framing makes progression feel
  like an album to fill. Each province expands on demand.
- **Cons:** 9 accordion sections is a lot of tapping to browse what you own; you can't
  see two provinces' chips at once; "which look is a Tamer vs armor" is less obvious
  than a labeled toggle. The current code already uses a single `<details>` and it's
  the part testers find fiddly — multiplying that by nine risks the same friction.

---

## 3. Recommendation — Concept B (WARDROBE + Looks/Armor toggle)

**Why B over A and C:** It keeps the 4-tab bar people already navigate (A's 5th tab
crowds 375px and re-splits the two exclusive looks across a tab boundary). The CUSTOM
removal collapses the look-source space to exactly two — Tamers and Armor — which is
the textbook case for a 2-segment toggle, not C's nine-section accordion. B also gives
the new armor collection the one thing it lacks today: a always-visible counter and
per-province progress, plus a loadout strip that finally surfaces the legendary weapon.

### Component structure (mockup-level, not code)

```
ByteBeast (screen)            ── unchanged: header, beast-stage, page-grid, About aside
  tab row                     ── relabel 'avatar' → 'wardrobe', icon 🧑 → 🎽
  Wardrobe (replaces AvatarCreator usage)
    ├─ LoadoutStrip           ── equipped look name + tier pill + weapon (or "No armor")
    ├─ SegToggle [Looks|Armor]── local useState('looks'); Armor segment shows n/24
    ├─ LooksPane              ── reuse .avatar-variants grid over TAMER_KEYS
    │                            (drop the Custom chip + the whole CustomBuilder)
    └─ ArmorPane              ── ARMOR_BY_PATH → per-province head (n/3) + 3 chips,
                                 reusing .avatar-variant + .avatar-armor-weapon,
                                 isArmorUnlocked() / armorUnlockHint() unchanged
```

- `AvatarCreator.jsx` becomes `Wardrobe.jsx` in spirit; the `CustomBuilder`,
  `VariantPreview`, and the `avatarParts` slot/color machinery are deleted along with
  the CUSTOM avatar. `ArmorPicker`'s `<details>` becomes the always-open ArmorPane.
- The big 120px preview can move *out* of the tab and onto the **beast stage**: when a
  Tamer/armor is equipped, render it at a legible size beside the beast (see stage
  note below) instead of as a separate in-tab preview, so the stage is the single
  source of "here's how you look."

### Store fields it touches (all existing — no new persisted state)

| Field | Role in B |
|---|---|
| `avatar.tamer` | set by LooksPane chip → `setAvatar({ tamer: id, armor: null })` |
| `avatar.armor` | set by ArmorPane chip → `setAvatar({ armor: id, tamer: null })` |
| `avatar.{hair,top,…,hairColor,topColor}` | become dormant once CUSTOM is removed; keep in store shape for migration safety, just stop editing them |
| `completed` | drives `isArmorUnlocked()` / counter "n/24" / per-province "n/3" |
| `setAvatar` | the single mutation the panes call (unchanged action) |
| `beastBackground`, `unlockedBackgrounds`, `setBackground` | untouched — still owned by the SCENES tab |
| `companion`, `beastTier`, `beastTiers` | untouched — still owned by EVOLVE + About aside |

**Beast vs human on the stage.** Today the human is a fixed 32px corner sprite. With a
real wardrobe, recommend: when a Tamer or armor set is equipped, render that figure on
the stage at ~64–72px standing left of the beast (a "tamer + companion" duo), and when
nothing is equipped, fall back to today's small corner sprite. This needs no new field —
it's derived from `avatar.tamer` / `avatar.armor` — and it makes the WARDROBE choice feel
consequential because you see the pairing on the same stage you already look at.

### Migration / scope notes

- Removing CUSTOM means the `'Custom'` chip and `CustomBuilder` branch in
  `AvatarCreator` go away; any persisted `avatar` with `tamer:null, armor:null` should
  fall back to a default Tamer rather than the old layered SVG (one-line default in the
  store's avatar init at `useStore.js` line 357).
- The tab-bar relabel is purely cosmetic (`{ id: 'avatar', label: '🧑 AVATAR' }` →
  `{ id: 'wardrobe', label: '🎽 WARDROBE' }`); the `tab` state string changes from
  `'avatar'` to `'wardrobe'` in the one `useState` + one render guard.
- All armor data/helpers (`ARMOR_SETS`, `ARMOR_BY_PATH`, `armorSrc`, `weaponSrc`,
  `isArmorUnlocked`, `armorUnlockHint`) are reused as-is; B is a presentation change.
