# InfraLearn — Improvement Roadmap

> Prioritized, evidence-backed backlog derived from a full subsystem audit (9 readers)
> and an architectural devil's-advocate panel (11 decisions). Every item cites concrete
> `file:line` evidence. Companion docs: [HANDOFF.md](HANDOFF.md) (what was done),
> [DEVILS-ADVOCATE.md](DEVILS-ADVOCATE.md) (architecture critique this draws from).

## TL;DR — the headline

The app is genuinely well-built: the write-coalescing store, per-path lazy loading, the
hand-written service worker, and the retention-test suite are all above the bar for a
solo PWA. The work that remains is **not** more features — it's closing the gap between
what the app *claims* and what it *does*. Three claims in the handoff/docs are provably
wrong, and several "shipped" features are quietly broken or contradict the project's own
locked decisions.

**Two handoff claims are false — fix the docs and the underlying state:**
- ❌ **"ESLint clean."** ESLint is not installed (`package.json` has no eslint dep; no
  binary in `node_modules/.bin`; `npm run lint` fails). It has *never* run. CI never lints.
- ✅ **"SW precache sentinel is never substituted" is STALE** — it was fixed in `4e78b5d`.
  `dist/sw.js` ships 81 real asset paths. (Update the memory note / HANDOFF §9.)
- ⚠️ **"~50 bugs fixed, further audits low-yield"** is mostly true for *correctness*, but
  this audit found a new class: **honesty bugs** (docs vs code) and **philosophy bugs**
  (shipped features that contradict locked decisions). Those are below.

---

## How to read the priorities

| Tier | Theme | Why first |
|------|-------|-----------|
| **0** | Truth & data-integrity | Things actively broken, lying to the user, or risking total progress loss. Cheap, high impact. |
| **1** | Quality gates | The safety nets that would have caught Tier 0 — install them so Tier 0 can't recur. |
| **2** | Retention-engine fidelity | The product's core value claim diverges from its own science. |
| **3** | UX / accessibility | Broken affordances and one-CTA violations on the most-used screens. |
| **4** | Architecture / maintainability | Larger, lower-urgency; do when touching the area. |
| **—** | Explicitly shelve | Resist these; building them works against the north-star. |

Effort: **S** ≤ half day · **M** ≈ 1–2 days · **L** ≈ several days · **XL** ≈ week+.

---

## Tier 0 — Truth & data-integrity (do these first)

### 0.1 — Stop lying to learners in `bash` practice blocks · **S** · high
`PracticeInline` renders `<TerminalBlock />` with **no props** ([Lesson.jsx:2447](src/screens/Lesson.jsx#L2447)),
silently dropping each block's `starter` script. The simulator's command map
([TerminalBlock.jsx:409-416](src/components/TerminalBlock.jsx#L409-L416)) has no `curl`,
`node`, `npm`, or `vercel` — yet bash starters literally instruct `node server.js` then
`curl -i http://localhost:3000/health`. The learner types the command they were taught and
gets `command not found`. This is 16 of 55 practice blocks.
**Fix:** convert the 16 bash blocks to `BuildAlongBlock` (the team's own blessed pattern,
currently used only twice) — real commands, real "now run this in your terminal" handoff.
At minimum, pass `starter`/`prompt` through and scope prompts to supported commands.

### 0.2 — Surface persist failures instead of swallowing them · **S** · high · ✅ DONE
On quota-exceeded / private-mode throw, `setItem` only `console.warn`s
([useStore.js:1607-1608](src/store/useStore.js#L1607-L1608)). The in-memory `set()` already
fired, the XP toast already played — so the user keeps earning rewards that **evaporate on
reload with zero signal**. This directly violates the visible-progress contract.
**Fix:** set a transient `persistFailed` flag in the catch and render a sticky banner
("Progress isn't being saved — export a backup now") wired to `exportData()`.

### 0.3 — Recover from a corrupt read instead of nuking everything · **S** · high · ✅ DONE
A truncated/partial blob makes `getItem` return `null`
([useStore.js:1615](src/store/useStore.js#L1615)), which makes Zustand fall back to
`initial` — a **total reset to a brand-new account** instead of a repair. Combined with
`ErrorBoundary.nukeStorage` ([ErrorBoundary.jsx:33-40](src/components/ErrorBoundary.jsx#L33-L40)),
which offers a one-tap "wipe everything" on *any* render crash with no backup-first prompt,
a render bug in a cosmetic component can cost a user their 100-day streak.
**Fix:** rotating second copy. On each successful flush, mirror the previous good value to
`infralearn-store.bak`; on a failed parse, recover from `.bak` before falling back to
`initial`. Make `nukeStorage` offer "Download backup first." ~15–30 lines, zero new deps.
(See [DEVILS-ADVOCATE.md §1](DEVILS-ADVOCATE.md).)

### 0.4 — Reconcile the XP table: code vs docs (the core thesis is inverted) · **S** · high
The product's entire pitch is "reward tested recall over recognition." But the shipped
numbers invert it: daily-practice *recognition* (multiple-choice) pays **+8**
([Home.jsx:722](src/screens/Home.jsx#L722)) while a *graded recall review* pays **+6**, and
the docs say daily:correct is +4 and recall:good is +8
([retention-engine.md:142-144](docs/retention-engine.md#L142-L144)). Code and docs disagree
on at least three rows.
**Fix:** audit every `addXp` call site, make `docs/retention-engine.md` match exactly, and
re-balance so the cheapest recall reward strictly outpays the most generous recognition
reward. Add a test asserting the constants match the doc (so they can't silently drift).

### 0.5 — Make the "Reduced motion" setting actually reduce motion · **S** · high · ✅ DONE
The Settings toggle writes `settings.reducedMotion` ([Settings.jsx:229](src/screens/Settings.jsx#L229)),
but **nothing** in `main.jsx` sets a root class/attribute from it. Every CSS animation
(`.fade-in`, confetti, streak flame, aurora) is gated *only* by
`@media (prefers-reduced-motion)` ([theme.css:197](src/styles/theme.css#L197)). A user who
flips the toggle but hasn't set an OS preference still gets full motion — a broken a11y
affordance that looks functional, which is worse than not offering it.
**Fix:** in `main.jsx`, drive `document.documentElement.dataset.reducedMotion` from
`settings.reducedMotion || OS-query`, and add one CSS block neutralizing animations under it.

### 0.6 — Make the docs honest about journey scope · **S** · medium
`docs/journey-design.md` reads as a committed build plan ("P0…P4", "~3-5 d each", "NAMES
LOCKED", "Build order"), but the ember economy, bestiary, Watchfire Defense, and boss fights
are **entirely unbuilt** (no `embers`/`bond`/`journey` keys in the store). Meanwhile ~82
lines of `lore.js` (`WORLD`, `myth`, `BEAST_LORE`, `KEEPER_RANKS`, `LAPSE_KEYS`) are **dead
code with zero importers** — and `KEEPER_RANKS` is already *wrong* (10 ranks for a 4-tier
model), proving nothing exercises it.
**Fix:** delete/quarantine the dead exports; add a banner to the design doc marking the
economy as **shelved pending a retention signal**, not phased. (See [DEVILS-ADVOCATE.md §5](DEVILS-ADVOCATE.md).)

---

## Tier 1 — Quality gates (install the nets that catch Tier 0)

### 1.1 — Install ESLint + add a lint step to CI · **S** · high · ✅ DONE
*(Paid for itself on the first run: caught an undefined-variable crash bug in the shipped
Journey screen — [Journey.jsx:112](src/screens/Journey.jsx#L112) passed `embers={embers}`
where no `embers` existed in scope.)*
`eslint.config.js` exists but the binary doesn't; `npm run lint` errors. For ~60k LOC of
plain JS with **no type system**, lint is the *only* static defense against `no-undef`,
`no-unused-vars`, `no-const-assign`, `no-dupe-keys`. Right now an undefined variable ships
to production with nothing to catch it.
**Fix:** `npm i -D eslint eslint-plugin-react-hooks`, get `npm run lint` green, add a
`Run lint` step to [deploy.yml](.github/workflows/deploy.yml#L42-L46) before build. Highest
ROI fix in the repo — the config already exists.

### 1.2 — Test the cloud sync merge-then-push path · **M** · high
`sync.js`'s own comment says it's "passed in rather than imported so this module stays…
trivially testable" — yet **no test imports `src/cloud`**. The pull→merge→push race, the
fail-closed guard ([sync.js:67-72](src/cloud/sync.js#L67-L72)), and `getCloud`'s
promise-cache retry are the parts that lose data across devices.
**Fix:** `cloud-sync.test.js` with a fake adapter (the contract is 6 functions): assert
merge-before-push order, idempotency, refusal-to-push-on-failed-merge, union semantics.

### 1.3 — Bidirectional + per-block content integrity tests · **S→M** · high
[lesson-schema.test.js:88-91](tests/lesson-schema.test.js#L88-L91) only checks *body→PATHS*
(orphan bodies). It never asserts the inverse, so a **typo'd or un-authored lesson id ships
the "hasn't been authored yet" card to learners with CI green**. Per-block validation exists
for only 2 of ~17 block types (just `typeof type === 'string'` otherwise).
**Fix:** add the inverse assertion (every PATHS id has a body; every `hasMathQuiz` lesson has
a bank); add a small per-block-type required-field spec (or a `zod` discriminated union) run
as a hard gate over all 264 bodies.

### 1.4 — Guard the SW precache substitution (it works — keep it that way) · **S** · medium
The substitution is correct today (81 assets in `dist/sw.js`) but it's an unguarded
post-build regex side effect ([vite.config.js:11-48](vite.config.js#L11-L48)) with **zero
regression coverage** — and it broke silently once before.
**Fix:** in the `closeBundle` plugin, `throw` if the injected list is empty or the empty
sentinel survives; add a post-build dist-smoke step in CI asserting the manifest contains the
eager chunks.

### 1.5 — Add `checkJs` + JSDoc on the hot boundaries (not a TS migration) · **L** · medium
A `jsconfig.json` with `checkJs`, JSDoc typedefs on the **store's public actions** and the
**block AST union**, and a `tsc --noEmit` CI step buys ~70% of TypeScript's contract safety
on the two highest-churn seams (store↔screens, content↔renderer) at ~5% of the cost. Vite
ignores the types at build, so no runtime change.
**Don't** do a full TS rewrite of 60k LOC solo — wrong cost/benefit.

### 1.6 — Coverage threshold scoped to `src/store` + `src/cloud` only · **S** · medium
Add `@vitest/coverage-v8` with thresholds on the irreplaceable logic, leaving the render
layer unthresholded. Measures *risk*, not content volume (today's "310 tests" is 86%
auto-generated per-lesson schema parameterization).

### 1.7 — ~8 React Testing Library smoke tests on engagement-critical render · **L** · medium
The product's differentiator (immediate feedback, celebrations, visible progress) lives
entirely in untested components. `0.1` (the bash bug) is exactly what a 10-line "render
practice block, assert starter visible" test catches. Target: Lesson block dispatch renders
each type without throwing, `CelebrationMoment` auto-dismisses, `PathAscension` Continue
appears, practice block shows its starter.

---

## Tier 2 — Retention-engine fidelity (make the science true)

The scheduler is fine to keep hand-rolled — but it currently implements *none* of the
mechanisms it cites, so the FSRS-6/Cepeda citations are unearned. (See [DEVILS-ADVOCATE.md §3](DEVILS-ADVOCATE.md).)

### 2.1 — Anchor stability growth to elapsed time · **S** · high
`stability *= mult` regardless of `(today − lastSeen)` ([useStore.js:885-890](src/store/useStore.js#L885-L890)).
A user who reviews daily and one who lets a card rot for a month get the **identical**
trajectory — the exact opposite of the Cepeda optimal-gap the docs cite. `lastSeen` is
already stored; gate full stability growth on the observed interval being near-optimal
(~10 lines). This is the single most important pedagogy fix.

### 2.2 — Make difficulty respond to Hard/Good; differentiate Hard from Good · **S** · medium
Difficulty only moves on grade 1 (+0.5) and grade 4 (−0.15)
([useStore.js:877](src/store/useStore.js#L877), [:889](src/store/useStore.js#L889)). Grades
2/3 never touch it, so "Hard" is a near-inert signal and Hard/Good collapse to the same
1–2 day interval at low stability. Nudge difficulty on every grade; floor Good's interval
above Hard's. Add a test: `interval(Hard) < interval(Good) < interval(Easy)` at every reps.

### 2.3 — Stop auto-grading "read a lesson" as a passed recall · **M** · medium
`completeLesson` enters the queue at grade 3 (stability 2.5)
([useStore.js:552-554](src/store/useStore.js#L552-L554)) — reading is recognition, not
retrieval, yet it earns a recall-grade stability bump, contradicting the engine's own thesis.
Enter new lessons at a low-stability "scheduled, unproven" state (stability ~1, interval 1–2).
Needs a persist-version bump so existing queues aren't retroactively reset.

### 2.4 — Re-document honestly · **S** · medium
Rewrite the three over-claiming sections of `retention-engine.md` to describe what the code
does, and cite research only where the code implements it.

### 2.5 — Backfill the reviewQueue for long-time users · **M** · medium
Forward-only migration means a user with 100 completed lessons has an **empty** spaced-rep
schedule — the most retention-relevant feature starts cold for exactly the users with the
most to retain. Lazily seed `reviewQueue` from `completed` with conservative staggered
`dueAt`.

---

## Tier 3 — UX / accessibility

### 3.1 — Route-change scroll reset + focus to `<main>` + skip-link · **M** · high
`main.jsx` renders `<Routes>` with no scroll/focus handling
([main.jsx:225-240](src/main.jsx#L225-L240)). Keyboard/SR users land mid-page with focus
stranded on body; sighted users on long screens arrive scrolled down; there's no
skip-to-content (WCAG 2.4.1 fail) so every nav tabs through 5 tab-bar items first.
**Fix:** a `<RouteChrome>` that scrolls to top + focuses a `tabIndex=-1 <main id="main">` on
pathname change, plus a visually-hidden skip-link. Three a11y issues, one change.

### 3.2 — Collapse Home to one dominant CTA · **L** · high
A returning user sees ~9 stacked, several primary-styled cards (companion, cliffhanger, daily
challenge, daily practice, path-continue, reviews-due, weak-spots, two nav buttons, install)
([Home.jsx:99-217](src/screens/Home.jsx#L99-L217)) — the exact decision-paralysis the
one-CTA mandate exists to prevent.
**Fix:** a priority resolver that elevates ONE hero CTA (cliffhanger > reviews due > continue
> daily) and demotes the rest to compact/below-fold.

### 3.3 — Focus traps on the dialog overlays · **M** · medium
`Trophies`, `TrophyDetail`, `KeyboardHelp`, `CoachTour` set `aria-modal=true` but implement
no focus trap, no initial focus, no restore — so Tab escapes behind the modal while AT is
told the page is inert. Extract a `useFocusTrap(ref, onClose)` hook.

### 3.4 — Surface Projects beyond Library · **S** · medium
Capstone projects — the closest thing to the north-star end-state — are reachable only by
opening Library and tapping a card ([Library.jsx:119-140](src/screens/Library.jsx#L119-L140)).
Add a gated Home card (≥1 lesson done) or a Roadmap capstone section. (Keep the 5-tab cap;
don't add a tab.)

### 3.5 — Lightweight path-to-path layer (recommendation + handoff + concept dedup) · **M** · high
The 8 paths are ungated silos: a true beginner gets no steer toward Fundamentals (the
"recommendation" is incidental `Object.keys` order, [Home.jsx:58-62](src/screens/Home.jsx#L58-L62)),
path completion hands off to nothing, and verified heavy concept overlap (SQL ×4, caching ×3,
monitoring ×3) generates **uncoordinated review cards** in a retention product. Don't build
the full skill-map or hard gates (those fight the ADHD on-ramp). Do add additive metadata:
`recommended:true` + "Start here" badge, soft `buildsOn`/`nextUp` (real "You finished DevOps
→ ready for MLOps" moment), and `concept` tags so spaced-rep can coalesce. (See
[DEVILS-ADVOCATE.md §11](DEVILS-ADVOCATE.md).)

### 3.6 — Precache only the active path's chunk, not all 8 · **S** · high
The SW sweeps all 8 path-content chunks (~450 KB gz) into install precache
([vite.config.js:36](vite.config.js#L36)) though users follow one path at a time. Exclude
path chunks from install precache and let runtime cache-first pick up the active one.

### 3.7 — Surface an explicit offline state for Pyodide practice · **M** · medium
Pyodide loads from `cdn.jsdelivr.net` ([PracticeBlock.jsx:37-39](src/components/PracticeBlock.jsx#L37-L39))
and the SW bypasses cross-origin ([sw.js:189-190](public/sw.js#L189-L190)), so the flagship
"immediate feedback" loop silently dies offline. Either self-host Pyodide into `public/` +
precache it, or detect offline and render "Code run needs a connection — concept is still
readable."

### 3.8 — Smaller UX nits · **S** each · low–medium
- Cloud "sync progress across devices" copy is misleading: settings/avatar/path **don't**
  sync (local-wins, [useStore.js:1515-1517](src/store/useStore.js#L1515-L1517)) and reset
  can't propagate (monotonic union, [:1486](src/store/useStore.js#L1486)). Either fix the
  merge or fix the copy. · medium
- Add an automatic sync trigger (on sign-in / visibilitychange); manual-only sync buried in
  Settings means devices stay out of sync ([Settings.jsx:460-473](src/screens/Settings.jsx#L460-L473)). · medium
- Route DailyPractice's hand-rolled keydown listener through `useKeyboardShortcuts` to kill a
  second divergent keyboard system ([Home.jsx:786-819](src/screens/Home.jsx#L786-L819)). · low
- Gate the Roadmap Lapse-eyes / province epithet behind a `loreAmbient` setting (the design
  doc itself flags this as a contested dial). · medium

---

## Tier 4 — Architecture / maintainability (do when you're in the area)

### 4.1 — Extract block renderers out of `Lesson.jsx` · **L** · medium
3467 lines holding ~20 components + 4 bespoke SVG layout engines, with the accent-var map
**duplicated 4×**. Move each block to `src/components/blocks/*` + a shared accent module;
leave `Lesson.jsx` as a dispatch shell. Pure refactor, big review-cost win.

### 4.2 — Extract pure domain logic from the store · **L** · medium
FSRS math, streak resolution, XP/combo, badge detection are entangled in a 1820-line module
with deep `get()→action→get()` chains. Move them to pure functions (state → patch) so each
rule is unit-testable in isolation.

### 4.3 — Switch `partialize` from blacklist to allow-list · **S** · medium
Persist deletes only `celebrate` ([useStore.js:1583-1587](src/store/useStore.js#L1583-L1587))
while `exportData` correctly iterates `Object.keys(initial)` three lines away. Any future
transient field leaks into localStorage. Use the allow-list pattern that already exists.

### 4.4 — Firebase → `optionalDependency` + env-gate the CSP · **M** · medium
`firebase` is a hard production dep ([package.json:29](package.json#L29)) and the shipped
CSP permanently widens `frame-src` to `*.firebaseapp.com` / `accounts.google.com`
([index.html:54](index.html#L54)) — real supply-chain + attack-surface cost for a feature
that's **off in every build**. Move firebase to optional, emit the Google CSP only under a
build flag. (See [DEVILS-ADVOCATE.md §6, §8](DEVILS-ADVOCATE.md).)

### 4.5 — Content storage format (optional, later) · **L** · medium
Code stored as escaped JS strings makes the load-bearing per-line comment pedagogy
**unreviewable in diffs**, and a one-char typo breaks the whole path chunk. *Don't* move to a
CMS/MDX (breaks offline-first / re-entangles content+code). *Do* (eventually) convert path
bodies to `.json` (they're already pure JSON) so parse errors localize and content is
diffable. Lower priority than the validation gate in 1.3.

### 4.6 — De-hardcode the base path in `404.html` · **S** · low
[404.html:3](public/404.html#L3) hard-codes `/InfraLearn/`; the project has been renamed once
already (`MLOps-Fundaments` cache dir survives). Derive base from `import.meta.env.BASE_URL`.

### 4.7 — Wire `generate-icons.mjs` into the build · **S** · low
Icons are committed PNGs not regenerated from SVG sources; editing an icon SVG silently ships
a stale home-screen icon. Add a prebuild step.

---

## Explicitly DO NOT build (shelve — these fight the north-star)

- **The ember economy / Watchfire Defense / boss fights / tamer gear.** Adds attention-competing
  UI and persisted state on top of a datastore already flagged as fragile, against a north-star
  about *depth of thinking*, not session count. The lore itself names the trap (*Bitrot*: rote
  in costume — a review-battle wrapper is exactly that). **Gate any further journey work on a
  measured retention lift from the already-shipped cinematic.**
- **A full TypeScript migration** of 60k LOC solo — use `checkJs`+JSDoc on hot boundaries (1.5).
- **A CMS / MDX content pipeline** — breaks offline-first; the content is already pure JSON.
- **An FSRS library** at current review volume — fix the hand-rolled one (Tier 2) instead.
- **BrowserRouter / host migration** — buys nothing until a share-a-lesson feature exists; only
  the `404.html` base de-hardcode (4.6) is justified now.
- **Hard prerequisite locks / a visual RPG skill-map** — gates fight the ADHD on-ramp; the soft
  metadata layer (3.5) captures ~80% of the value.
- **Third-party analytics (GA/PostHog/etc.)** — but DO stop truncating retention signals
  (dailyStats 14d, xpHistory 20) and add a local-only retention curve + opt-in anonymized
  export, so the north-star becomes falsifiable without breaking offline-first. (See
  [DEVILS-ADVOCATE.md §10](DEVILS-ADVOCATE.md).)

---

## World-map roadmap: Cookie Run design lessons

> From a deep-research pass (18 sources fetched, 80 claims extracted, top 25 adversarially
> verified with 3-vote panels → **20 survived, 5 refuted**). CRK facts rest on fan wikis
> (Fandom/cookierun.wiki/NamuWiki, cross-corroborated) — consistent but secondary; the
> Duolingo rationale is from the **official Duolingo blog** (primary). Findings are mapped
> to concrete InfraLearn actions and cross-referenced to the world-map critique in
> [DEVILS-ADVOCATE.md → Addendum A1–A6](DEVILS-ADVOCATE.md).

### What the verified evidence says → what we do

**R1 — Name the hierarchy, use it consistently.** CRK: planet *Earthbread* → landmass
"Cookie Kingdom" → five named continents (Crispia, Wholegrainia, Sugarberg, Beast-Yeast,
Candystick Archipelago) → kingdoms *on* continents. (3-0×3; Fandom/Wikipedia/NamuWiki.)
→ *We already have the vocabulary* in `lore.js` (the Null's world → 8 provinces). **Action:**
surface it on the map — the world view gets the world's name as its title cartouche, each
continent wears its province name, and UI copy says world/province/lesson consistently. · **S**

**R2 — One theme per continent; save novelty for the *next* one.** Each CRK arc-map is a
self-contained theme with its own villain and even mechanical flavor — not a recolor (2-1/3-0);
the classic platformer "world" pattern shares aesthetics *within* a world and pays novelty on
completion (3-0, single source, low conf.). → **Action:** continent art, trail scene palette
(`SCENES`), and province lore should visibly match per path (today the world-map biomes and
the Roadmap's PixelLab landscapes were designed independently); continent-completion is the
visual-novelty payoff moment (the Ascension cinematic already sits exactly there). · **M**

**R3 — Anchor each region on a signature "boss" landmark.** CRK's Beast-Yeast is ~6 named
biome regions, each anchored by one Beast boss that names it and serves as its visible
end-goal (3-0×2, 2-1). → *This is literally our existing structure* — each province has a
Lapse villain and a beast. **Action:** put the province's Lapse visibly at the continent's
far end **on the world map** (the trail already does "CINDERCROWN WAITS AT THE END"), and
make the capstone project the marked destination node of each continent. · **S**

**R4 — Gate on ONE named milestone node, never a diffuse threshold.** Beast-Yeast and
Timeline of Fate both unlock behind a single, named episode — Hall of Enlightenment, stage
8-30 (3-0; wiki + Gamerant independently). Players always know exactly what opens the next
world. → **Action:** resolves the DA-A6 "cosmetic fog" dishonesty: if fog implies gating, the
clear-condition must be a *named node* ("Clear **The Last Shelf** to lift the mist"), soft
(recommendation, not lock — see R6). Never "reach 40%". · **S**

**R5 — Visible path, one highlighted next node, distinct done-state.** Duolingo replaced its
branching tree with a single guided path of nodes (done = gold) explicitly because learners
"weren't sure they were using the app right" — **high confidence, official Duolingo blog**;
SMB3's visible roads let players "mentally build a path to the goal" (3-0×2). → The serpentine
trail drill-in already does all three (visible trail, walker on current node, amber done
nodes) — *this validates the A1 decision to keep it as the drill-in.* **Action for the world
view:** ONE magnetic hero affordance — the active continent pulses with a pinned
"Continue: {lesson}" CTA; the other 7 stay ambient (= DA-A6). · **M**

**R6 — The linearity/agency trade-off is real; hybrid wins.** Duolingo's forced line
measurably helped beginners but provoked documented power-user backlash over lost agency
(3-0). SMB3 shows branches + skips don't destroy legibility if the trunk stays visible (3-0).
→ **Action:** keep free continent choice (no hard gates — matches the locked ADHD on-ramp
decision), keep a linear spine *within* each continent, and keep labs as visible side-branch
nodes (the trail already renders them as side-quests). Don't build hard prereq locks. · **0**

**R7 — POI magnetism + distinctness is wayfinding, not decoration.** Every point of interest
exerts "magnetic pull"; multi-path areas must be visually distinct *or players get lost*;
players pick destinations by distance/appeal/prior knowledge (3-0×3; 18-yr AAA open-world
designer — caveat: 3D-context source). → **Action:** the 8 continents must stay strongly
differentiated (the biome set already is); make the intended next node the most visually
magnetic object on screen; each node should telegraph what/how-long at a glance (min + kind
icon on the label). · **S**

### Coverage gap — flagged honestly

**None of the 20 surviving claims cover CRK's actual visual art direction** (parchment
cartography style, decorative props, fog-of-war rendering, lock/complete node states) — every
claim on that angle died in verification or came from unreliable sources. Our visual direction
therefore rests on the owner's own reference images (the CRK world-map artwork + Elden Ring
map), which is fine — those are primary sources for *look*. The official Devsisters
art-director interview (studiokingdom.co.kr) surfaced as a promising primary source
(regions themed on distinct real-world cultures, e.g. Dark Cacao's Korean aesthetic) but its
claims didn't survive the panel; worth a direct read if we want deeper art grounding.

### Refuted in verification — do NOT design on these

- ~~"Saga maps work for chance-based games but fail for skill-based ones"~~ (0-3).
- ~~"Uneven difficulty curves with breathing-room levels increase retention"~~ (1-2).
- ~~"Without visible progress feedback a game cannot retain players"~~ — as an *absolute* (0-3).
- ~~"Duolingo's path is a Candy-Crush-modeled 'Journey Map' whose value is seeing the end goal"~~ (0-3).

### Net effect on the map plan

The research **independently converges** with the A1 decision and the DA addendum: three
unrelated domains (a live gacha RPG, a 1990 platformer, the largest learning app) all arrive
at *visible path + themed worlds + one clear next node + landmark gating*. The world map is
the right IA; the work left is R2 (theme alignment), R3 (Lapse/capstone as destination),
R4+R5 (honest fog + hero CTA), all small/medium — then the A-list plumbing (route, focus,
precache) from the devil's-advocate addendum.

---

## Gamified-UX pass: lessons from AI-built games (Fable 5 references)

> From reviewing games built with Fable 5 / Claude Code and viral AI-built games (links in
> the reference list at the bottom of this section). Each lesson is mapped to an InfraLearn
> change. Complements the CRK section above (structure) — this one is about *feel*.

- **G1 — Layered juice on the SAME event · S/M · high.** The verified game-feel lesson from
  the vibe-coding wave: one event, several tiny simultaneous feedbacks (hit + smoke +
  explosion = "feels so good"). InfraLearn's answer taps are dry: a correct answer should
  stack a ~100ms button bounce + floating "+8" XP mote + streak-flame flicker + combo pip —
  all sub-150ms, all gated behind reduced-motion. Apply to Home daily practice, Reviews
  grade buttons, and lesson practice blocks.
- **G2 — Voice in the loop, not just at milestones · S · high.** Mollick's Fable games are
  "weirdly fun" because of personality (a self-aware Snake that comments as you play).
  InfraLearn has world-class voice sitting unused in the moment-to-moment loop: beast barks
  on correct answers, Lapse one-liner taunts when a review lapses (`BEAST_LORE` fieldNotes +
  `FIVE_LAPSES.voice` already written in lore.js).
- **G3 — Session-as-run · M · medium.** Anthropic's own Fable demo (Slay the Spire with
  persistent memory) models the retention shape: bounded runs + persistent meta-progress.
  Shape the daily loop into a visible 3–5 item "watch" with a run-complete end screen,
  instead of an open-ended list.
- **G4 — Territory delta after every lesson · S · medium.** Make the map matter in the loop:
  completing a lesson toasts "+2% of the Foundry reclaimed" (derivable from pathProgress),
  connecting the 5-minute action to the world-map fantasy.
- **G5 — Boss showdown at 100% · M/L · medium.** The greyed Lapse on each continent should
  eventually be *fightable*: province capstone = a Watchfire-style showdown quiz against the
  Lapse (the Watchfire screen already wraps reviews in battle costume — same honest-scheduler
  pattern), ending with the boss sprite's full-color reveal + "HAS FLED."
- **G6 — Cohesion beats asset volume.** Fable's games made every asset "with math alone" and
  read as *more* polished for the consistency. Supports A2: freeze the 8-continent set,
  style-match any regenerations, don't mix art generations.

## Suggested first sprint (highest leverage, all S/M)

1. `1.1` Install ESLint + CI lint step (unblocks everything; makes the handoff honest).
2. `0.1` Fix/replace the broken bash practice blocks (stop lying to learners).
3. `0.2`+`0.3` Persist-failure banner + `.bak` rotation (close the data-loss holes).
4. `0.5` Make reduced-motion actually work.
5. `0.4`+`2.4` Reconcile the XP table and re-document the engine honestly.
6. `1.3` Bidirectional content integrity test.
7. `0.6` Delete dead lore + reframe the journey doc as shelved.

That sprint is all small/medium, fixes every "the app lies / loses data" issue, and installs
the gates so they can't regress.
