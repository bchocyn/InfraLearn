# InfraLearn — Session Handoff

> Shareable summary of a large feature + correctness session. Copy/paste freely.

**What this is:** InfraLearn — an offline-first PWA learning tracker (React 18 + Vite/rolldown,
Zustand → localStorage, HashRouter, GitHub Pages). 8 career paths (~264 lessons), a
gap-anchored spaced-repetition engine, XP/streak/badges, a virtual "Byte Beast" companion, a
story/journey layer, a world-map roadmap, and **Pokémon-style quiz battles**.

- **Repo:** https://github.com/bchocyn/InfraLearn · **Live:** https://bchocyn.github.io/InfraLearn/
- **State at handoff:** everything committed + pushed to `main`. **HEAD `a52da27`**, deploy
  verified live (compared the live `sw.js` chunk hash against the local build — byte match).
  **386/386 tests · ESLint clean · build clean.** Working tree clean.
- **Two companion docs are the living backlog** (read these first next session):
  - **`IMPROVEMENTS.md`** — prioritized, evidence-backed roadmap (Tier 0–4 + "don't build" list),
    with `file:line` citations and a Cookie-Run design-research section (R1–R7) + Fable-5
    game-feel lessons (G1–G6). Items done this session are marked ✅.
  - **`DEVILS-ADVOCATE.md`** — adversarial architecture critique (11 decisions steelmanned then
    contested) + a world-map addendum (A1–A6).

---

## This session's commits (`36215d2` → `a52da27`)

```
a52da27 Retrigger Pages deploy (deploy-pages step 500'd transiently on 6c250ae)
6c250ae Remove free recall — every testing surface is MCQ + feedback
b79d37c World map: single-file voyage — one continent per row, connected route
5405098 World map goes portrait — phone-first vertical layout
7a6a6e5 Reviews become quiz-first; CampHero gets a pixel-art scene
145709b Evidence layer, gap-anchored scheduler, reminders, full content coverage
a536d00 World map, quiz battles, Tier-0 fixes, skill-rank removal
eb29c65 Add audit docs: IMPROVEMENTS backlog + DEVILS-ADVOCATE critique
```

## 1 · World-map roadmap (the Roadmap tab is now a map)

- **`src/screens/WorldMap.jsx`** — the Roadmap tab **lands on a world map** (A1 from the
  devil's-advocate doc: one map system, not two). 8 continents as flat top-down pixel-art
  landmasses (pixellab, backgrounds keyed transparent), each themed to its province. Fog over
  unstarted provinces; the province's **Lapse boss stands greyed on its own continent**;
  medallion progress rings; a live "you are here" halo on the active continent.
- **Layout is a single-file vertical voyage** (`WORLD_W 480 × WORLD_H 2260`): one continent per
  row in learning order, alternating L/R, threaded by a **dotted sea-route** — phone-first
  (it scrolls down like Cookie Run's own map). Hero "Continue" CTA rides **above** the map.
- **Tap a continent → the serpentine trail drill-in** (the existing per-province Roadmap trail,
  with its PixelLab landscape + cutscenes). "← World map" sails back. `Roadmap` takes an
  `initialView` prop (`'world'|'trail'`) so tests/deep-links can target the trail.
- The old `/worldmap` dev route still exists as a standalone prototype but the shipped path is
  the Roadmap landing.

## 2 · Pokémon-style quiz battles (NEW)

- **`src/screens/Battle.jsx`** + **`src/data/battles.js`** (heavy, lazy) + **`src/data/battleMeta.js`**
  (light, eager — the Roadmap reads it). Route `/battle/:pathKey/:stage`, stage `1..5` | `'boss'`.
- Per path: **5 minion encounters + 1 boss.** Each battle is **5 questions (boss: 7), 4 options,
  one per turn.** Pokémon layout: enemy card + HP bar top-left, animated minion top-right, your
  Byte Beast (flipped) bottom-left, hearts bottom-right, question in the dialogue box, the 4
  answers as the 4 colored menu buttons. Keys 1–4 answer, Enter advances.
- **Honest under the costume:** questions come from the due path's own material
  (`mathQuizzes[lessonId]` for completed lessons first, then title-matched daily-bank
  questions). Right = `markReviewed(id, 3)`, wrong = `markReviewed(id, 1)` + a weak-spot entry.
  XP is **watermark-latched** (`recordBattleWin` in the store; minion +15, boss +40) so replays
  are free practice, unfarmable. Wins count toward the streak.
- **Minions bar the road** (Pokémon-trainer style): an unbeaten encounter at trail-fraction k/6
  blocks NEW lessons past it — enforced on the trail **and** at the `/lesson/:id` route via a
  `BattleGate` wrapper in `main.jsx`. Completed lessons stay freely reviewable; the tap routes
  to the due fight, never a dead end. Gate math lives in `battleMeta.battleGateForLesson` /
  `battleBlockForLessonId`.
- **Sprites** (pixellab, in `public/worldmap/`): 8 continent islands (`island-{key}.png`), 4
  Lapse bosses (`beasts/null_*.png`), 4 minion base sprites + **animated idle loops**
  (`anim/minion-{lapse}-{0..4}.png`, played via `AnimatedSprite`). Minions are "descendants" of
  their boss (Bitling/Cinderling/Driftling/Letheling).
- **Store:** new `battles: {[pathKey]:{minions,boss}}` field, **persist version bumped to 18**,
  scrub + merge + migration + tests (`tests/store-battles.test.js`). A CI drift-guard
  (`BATTLE_BANKED_PATHS`) fails if the eager path list disagrees with what the banks can deal.

## 3 · Engine correctness (the core loop, made honest)

- **Gap-anchored scheduler** (`scheduleReview` in `useStore.js`): stability growth now scales by
  `sqrt(elapsed/expected)` clamped `[0.25, 1.5]` — same-day massing earns a quarter increment,
  on-time the full, overdue-but-recalled a bonus. Previously intervals depended only on review
  *count* (ignored elapsed time). **Difficulty now responds to every grade**; Hard is floored
  strictly sooner than Good. Tests updated (`tests/store-retention.test.js`).
- **XP economy gradient fixed.** Recognition now pays strictly below graded recall: daily
  practice `+4`, daily challenge `+5`, math-quiz first-sight `+6` (was `+8`), all ≤ `review:good
  +6`. `docs/retention-engine.md` rewritten to match the code (the old doc over-claimed FSRS-6
  and had an inverted table).

## 4 · Free recall REMOVED (owner decision)

- Every type-what-you-remember flow is gone: **Daily Practice** (MCQ-only now; wrong answers
  feed weak spots, which used to be recall-only), **Reviews** (`src/screens/Reviews.jsx` is
  quiz-per-due-card), **Watchfire** (quiz patrol — correct strikes + auto-advance, wrong costs a
  heart and holds on the why-wrong feedback). No textareas / self-grade anywhere.
- Retired: `recall:first` badge (earned copies survive, no longer displayed), `recall:got-it`
  +12 XP path; legacy `settings.practiceMode` / `settings.reviewMode` keys are ignored.
- **Known trade-off:** the scheduler now only ever hears grade 3 (right) or 1 (miss) — no
  Hard/Easy. The gap anchor handles nuance, but a "that was close" secondary tap is a cheap
  future add if shaky-but-correct cards feel like they return too slowly.

## 5 · Evidence layer + re-engagement (NEW)

- **`src/data/evidenceLog.js`** — append-only IndexedDB review log `{t, concept, grade, elapsed-gap}`
  (own quota bucket, survives localStorage pressure). `scheduleReview` logs each graded review.
  **ProgressPanel draws a personal forgetting curve** (recall held, by gap band) — the north-star
  claim made falsifiable for the user. The same DB carries a tiny KV "notify-state" bridge for
  the service worker (the SW can't read localStorage).
- **Daily reminder** (`public/sw.js` `periodicsync` + `notificationclick` handlers + a
  `ReminderCard` in Settings): one nudge on no-activity days ("N reviews due · streak holds"),
  via Periodic Background Sync + Notifications. Honest about support (needs an installed PWA on
  Chrome/Android; the card says so elsewhere). No server, no account.

## 6 · Tier-0 durability + quality fixes

- **ESLint installed + wired into CI** (`.github/workflows/deploy.yml` now lints before test +
  build). The prior handoff's "ESLint clean" was false — it was never installed. First run
  caught a real crash bug (undefined `embers` prop in the shipped `Journey.jsx`).
- **Persist durability:** `.bak` rotation before every write + corrupt-read recovery in the
  custom storage (`useStore.js`); a **`persistFailed` banner** (`PersistWarning.jsx`) on
  quota/private-mode failures; ErrorBoundary now offers "Download backup first" before its nuke,
  and nukes both keys.
- **Reduced-motion toggle actually works** — `main.jsx` stamps `data-reduced-motion` on `<html>`
  from the setting; CSS snaps animations to their end state (was media-query-only, so the
  in-app toggle did nothing).
- **`@vitejs/plugin-react` 4 → 6** — kills the rolldown "Invalid input options: jsx" dev warnings.
- **Skill ranks removed** (novice/junior/senior/distinguished): the picker, rank ladder, and
  displays are gone; **beast evolution re-based onto lessons-completed** (same 4/10 thresholds
  the rank used, so evolution pacing is unchanged).

## 7 · Content coverage + a11y + Home

- **All 8 paths now have question banks** — authored `fullstack` + `cybersec` daily-question
  banks (55 grounded questions) via a content fan-out workflow, so daily practice, journey
  encounters, and **battles work on every path**.
- **All 16 broken `bash` practice blocks converted to `build-along`** (the blessed pattern) — no
  more in-app terminal returning "command not found" for `curl`/`node`/`npm`.
- **A11y:** route-change scroll reset + focus-to-`<main>` + a skip link (`main.jsx`, WCAG 2.4.1).
- **Home:** a Projects teaser card (gated on ≥3 completed lessons) surfaces the capstone ramp
  that was buried two taps deep in Library.

## 8 · CampHero pixel-art scene

- `src/components/CampHero.jsx` — replaced the hand-drawn SVG sky/hills/fire with two pixel-art
  camp backdrops (`public/worldmap/camp-day.png` / `camp-night.png`, chosen by time of day) +
  a breathing glow. **The beast is visible at night now** (firelight rim; the old sleepy filter
  was erasing it). Identity strip collapsed to one line. `scripts/key-worldmap.mjs` hard-excludes
  `camp-*.png` (they're full-bleed scenes; keying would eat the sky).

---

## How to run / verify

```bash
npm install --legacy-peer-deps   # peer tree requires the flag (CI uses it too)
npm run dev                      # http://localhost:5173/InfraLearn/  (Roadmap → world map)
npm run lint                     # ESLint — now real, wired into CI
npm test                         # 386 tests (10 files)
npm run build && npm run preview # production at http://localhost:4173/InfraLearn/
```

Dev tricks: `window.__ascend('devops')` triggers the Ascension cinematic; jump straight to a
battle at `#/battle/devops/1`.

**Art pipeline (pixellab MCP):** async + credit-based; generated map objects auto-delete after
8h (download promptly). All map art is background-keyed transparent via
`node scripts/key-worldmap.mjs [all]` (idempotent; `island-*` by default, `camp-*` always
excluded). pixellab sometimes returns isometric vs flat inconsistently — re-roll outliers.
Frame-URL animations come from `get_object` (not `get_map_object`).

**Deploy gotcha (bit us this session):** GitHub's `actions/deploy-pages` step occasionally 500s
transiently even when build is green — retrigger with an empty commit. **Always verify a deploy
by comparing a local `dist/sw.js` chunk hash against the live `sw.js`** (don't trust the run
status alone; a stale poll once reported the wrong run's result).

---

## Known follow-ups / not done

**Immediate (owner was mid-decision):**
- **Projects catalog is thin — expansion recommended, NOT built.** Of 26 "projects", only **6
  are real builds**; the other 20 are `sd` design-*reading* lessons. **Fundamentals and Cybersec
  have ZERO projects**; Fullstack has 1; swe/mlops/mleng have no *labs* (only design readings).
  A per-path capstone ladder (~17 new: one guided build / one build-yourself / one architect
  challenge each, incl. an ML-Eng **RAG** project, a Fundamentals CLI tool, a Cybersec vault) was
  scoped and offered — run the same content fan-out to author it. This also finally answers the
  long-open "should projects have prerequisites?" question (labs already support `unlockAfter`).
  Also: label the 20 `sd` entries as "Design challenges" so builds vs readings are distinguishable.

**From IMPROVEMENTS.md, still open (see that doc for detail):**
- Dialog **focus traps** on Trophies / Codex / KeyboardHelp / CoachTour (aria-modal without a
  trap) — §3.3.
- **Concept-dedup tags** (SQL ×4, caching ×3 taught cold across paths → uncoordinated review
  cards) — §3.5.
- **G1 juice pass** — layered feedback on answer taps (the highest-frequency interaction) — G1.
- **Self-host Pyodide** (Python practice is CDN-only → dead offline) — §3.7.
- A **"that was close" grade** to restore Hard/Easy signal to the scheduler (see §4 above).

**Standing / lower urgency:**
- **Cloud sync** (`src/cloud/`) is built but **dormant** — needs the owner's Firebase config
  (`docs/SETUP-CLOUD.md`). DEVILS-ADVOCATE §8 recommends moving `firebase` to an optional dep and
  env-gating its CSP while it ships dark.
- **Journey design doc** (`docs/journey-design.md`) still reads as a committed backlog; the ember
  economy is partially built upstream. Treat further RPG expansion as gated on a retention signal.
- The prior handoff's "deferred deep-dive bugs" list (walkthrough edge-label fallback,
  `mlops-ab-testing` 5th actor lane, etc.) was not revisited — likely still open.

**Docs to trust:** `IMPROVEMENTS.md` and `DEVILS-ADVOCATE.md` are current as of this session and
are the source of truth for what's worth doing next and why. `docs/retention-engine.md` was
rewritten to match the shipped scheduler + economy. This file summarizes; those go deep.
