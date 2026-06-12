# InfraLearn — Session Handoff

> Shareable summary of a deep maintenance + feature session. Copy/paste freely.

**What this is:** InfraLearn — an offline-first PWA learning tracker (React 18 + Vite,
Zustand → localStorage, HashRouter, GitHub Pages). 8 career paths (~100+ lessons),
FSRS-style spaced repetition, XP/streak/badges, a virtual "Byte Beast" companion,
in-browser Python practice (Pyodide), and now a story/journey layer.

- **Repo:** https://github.com/bchocyn/InfraLearn · **Live:** https://bchocyn.github.io/InfraLearn/
- **State at handoff:** 310/310 tests passing · ESLint: 0 errors / 0 warnings across `src` ·
  production build clean · service worker verified live in a production preview.

---

## 1 · Bug-fix sweep (~50 verified bugs, all fixed)

**Critical**
- Service worker **never registered in production** (`new URL('sw.js', BASE_URL)` throws on a
  path-only base) — the entire offline/PWA layer was dead. Fixed; verified activated + precaching.
- SW activate-cleanup **deleted every cache on the shared github.io origin** (other projects
  included). Now scoped to `infralearn-*`.
- Backup import dialog treated **Cancel/Escape as "replace everything"** (full progress wipe).
  Now an explicit two-step confirm with a real abort.
- "Merge" import actually **replaced** badges/XP/streak/settings. Now true field-wise merge
  (badges union, max-of counters, beast tiers cell-wise).

**High value**
- Practice editor text could leak into the **wrong lesson's saved bucket** (body not keyed by
  route id). Re-completing a lesson **fake-graded its FSRS card** (stability inflation).
- Python ran on the **main thread** (`while True:` froze the tab) → now a Web Worker with a
  15s timeout + main-thread fallback; offline retry-hang fixed.
- Streaks: Fri→Mon weekend gap now covered (2 passes), freezes cover exactly one day and are
  **earnable again** (7/30/100-day milestones), future/garbage dates self-heal.
- Linter rules no longer reject the app's own shipped YAML/SQL/Dockerfile starters; terminal
  `head -n`/`cp`/`mv`/`grep` semantics fixed; quiz hooks-order crash fixed.
- All 8 paths now show everywhere (two were missing from pickers/mastery checks); daily
  practice is persisted + XP-farm-proof; weak spots from daily practice are visible/clearable.
- Diagram geometry: walkthrough labels no longer overlap nodes (40+ blocks affected);
  sequence text no longer runs off-canvas; schema tests now validate diagram references in CI.

## 2 · Performance pass

- **Eager bundle 355.8 → 306.8 KB**; CodeMirror core (353 KB) + math-quiz bank (92 KB) now
  load only when actually used — a prose lesson skips ~455 KB raw (~159 KB gz).
- Zustand persist writes coalesced **above** JSON.stringify (one action used to serialize the
  full store 8–10×); transient fields excluded.
- All whole-store subscriptions → narrow selectors (Roadmap's ~500-element SVG no longer
  re-renders on every XP tick; scene memoized). Lesson scroll re-renders only a progress rail.
- SW precache: non-latin font subsets excluded (~260 KB), unchanged hashed assets not
  re-downloaded on deploy, versioned cache names rotate + prune.
- Real PNG icons (iOS apple-touch 180 + 192/512 + maskable) generated from the SVG sources via
  `node scripts/generate-icons.mjs` (committed script, `@resvg/resvg-js` devDep).

## 3 · UX changes

- **Spanish locale removed** (picker + catalog); i18n plumbing kept for future locales; stale
  `es` preference falls back to English cleanly.
- **Companion switcher** now opens the same full-screen picker as onboarding (shared
  `BeastPicker` component), shows the earned tier per species, two-phase pick→confirm.

## 4 · NEW: Journey / story layer (design + first build)

Design doc: **`docs/journey-design.md`** (world bible, mechanics mapping, phasing).
Canonical lore data: **`src/data/lore.js`** — all narrative UI reads from here.

- **Premise:** the enemy is *forgetting* — "the Null" un-remembers the world; players are
  **Keepers**; the 8 paths are provinces (The Foundry, The Underlibrary, The Wallmarch…).
- **The Five Lapses** (villains = corrupted study-virtues; "lapse" is the FSRS failure term):
  **Hollow Ink** the Unteacher (Deceit) · **Bitrot** Devourer of Pages (Rote) · **Drift** the
  Unfinisher (Distraction) · **Cindercrown** the Gilded Hollow (Hubris) · **Lethe** the
  Hushtide (Stagnation). Each has codex text, voice lines, and a planned boss mechanic.
- **Shipped now:**
  - **Path Ascension cinematic** — full-screen 4-phase awakening (Cookie-Run-trailer energy)
    when a path first hits its gold seal; tier-4 beast reveal, province title card, lapse
    foreshadow; skippable; reduced-motion static card; lazy chunk; once-per-path guaranteed
    by the store (`pendingAscension`/`ascensionsSeen`, persist v13, import-safe, tested).
  - **Roadmap story layer** — province banner (name/epithet/intro), **fog of the Null** that
    recedes with progress, the province's Lapse watching from the fog ("CINDERCROWN WAITS AT
    THE END" → "HAS FLED — FOR NOW" at 100%).
  - **Startup art v2** — onboarding scene: living aurora, the Five stirring on the horizon,
    shooting star, awakening emblem, campfire + waiting companion (SMIL, reduced-motion safe).
- **Planned next** (per design doc §13): ember economy + Home camp-hero panel → bestiary →
  Watchfire Defense mini-game (reviews-as-battles) → Null Beast boss fights → tamer gear.

## 5 · NEW: Optional cloud login/sync (dormant)

- Google sign-in + Firestore snapshot sync, built provider-agnostic (`src/cloud/`), using the
  hardened merge-import as conflict resolution. **Completely inert** until you create a
  Firebase project and fill `src/cloud/cloudConfig.js` — instructions in **`docs/SETUP-CLOUD.md`**.
- Zero bytes in the eager bundle; the firebase chunk is lazy AND excluded from the SW precache.
- Settings → REVIEW tab shows the card (muted "not configured" state today).

## 6 · How to run / verify

```bash
npm install --legacy-peer-deps   # peer tree requires the flag (CI uses it too)
npm run dev                      # http://localhost:5173/InfraLearn/
npm test                         # 310 tests
npx eslint src                   # clean
npm run build && npm run preview # production at http://localhost:4173/InfraLearn/
```
Dev-only trick: in the dev console, `window.__ascend('devops')` triggers the Ascension
cinematic without completing a path.

## 7 · Known follow-ups / not done

- Cloud sync needs the owner's Firebase config to go live (see `docs/SETUP-CLOUD.md`).
- Journey phases P0+ (embers, camp hero, bestiary, mini-games) are designed, not yet built.
- Lore is English-only by design; the i18n layer exists if that ever changes.
- Deploys run via GitHub Actions on push to `main` (the old `npm run deploy` path was removed).
