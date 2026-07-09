# InfraLearn — Session Handoff

> Shareable summary of the 2026-07 measurement-integrity, content, and story-layer sessions.
> Copy/paste freely.

**What this is:** InfraLearn — an offline-first PWA learning tracker (React 18 + Vite/rolldown,
Zustand → localStorage with an IndexedDB mirror, HashRouter, GitHub Pages). 8 career paths
(**282 lessons** incl. per-path capstone ladders, objectives, and takeaways), a gap-anchored
spaced-repetition engine with concept coalescing, XP/streak/badges, a virtual "Byte Beast"
companion with an **ink-powered unlockable world-myth saga**, a world-map roadmap, Pokémon-style
quiz battles, and MCQ / drag-to-order / Parsons / cloze / find-the-bug question formats.

- **Repo:** https://github.com/bchocyn/InfraLearn · **Live:** https://bchocyn.github.io/InfraLearn/
- **State at handoff:** **everything through `274ea45` is pushed + deploy byte-verified live**
  (Sprints 1–3, A–C, E, F, G, and the beast-tab rework). Tests **466 · lesson-schema 284 ·
  ESLint clean · build clean** at every commit. Working tree clean.
- **Sprints E–G + beast tab — learning-platform depth & the story layer (2026-07-08/09):**
  - **E (mechanisms, `4b36faf`):** SessionRecap on every testing surface (held/close/missed
    tally + missed prompts deep-linking to the fixing lesson); practice-on-demand
    (`/practice/:lessonId`, XP-free, weak-spot aware); un-started-trail path preview card;
    lesson `objectives` render as "AFTER THIS YOU CAN"; **Parsons + cloze renderer support**
    (StemText renders `` `code` `` + `____` blanks across all 7 stem sites; OrderQuestion
    `code:true` = code-line ordering). Capstone debrief = the existing system-design-lab block
    used as a rubric (convention in `docs/lesson-blocks.md`).
  - **F (content, `7046d24`+`c9d01c1`):** 56 new-format questions (16 Parsons, 24 cloze,
    find-the-bug) — banks now **313 questions**; **objectives on all 282 lessons**; **18
    capstone debrief rubrics**; path-level `outcomes` on all 8 PATHS.
  - **mlops/mleng tags (`0557d01`):** section takeaways + deep-collapse tags across the last two
    paths — **the lesson pass is now complete on all 8** (339+124 takeaways, 35+ deep sections;
    objectives + debriefs everywhere). No lesson-pass gap remains.
  - **G — the unlockable world-myth saga (`06d9e96` foundation + `ad30e82` content):** the Byte
    Beast tab's tap-through story, authored in **ink** (inkle's narrative language). See its own
    section below.
  - **Beast tab (`274ea45`):** the saga is now the tab's PRIMARY surface (hero card above the
    cosmetic sub-tabs); dev-facing Scenes copy removed; static-tier (T3/T4) beasts get a subtle
    CSS breathing idle so they no longer read as frozen.
- **The audit docs (`IMPROVEMENTS.md`, `DEVILS-ADVOCATE.md`) predate these sessions** — most of
  their Tier 0–3 items and the world-map addendum (A1–A6) are now DONE; treat this file as
  current and those as background rationale.

---

## The headline: the measurement layer is honest now

The 2026-07 consulting review found the testing loop *looked* right but measured
answer-memorization, not recall. All five compromises are fixed:

1. **Frozen probes** — Reviews/Watchfire asked the identical question with the identical option
   order forever (`pickReviewQuestion(id, 0)`). Now salted by the card's rep count.
2. **Answer leakage** — correct sat at slot B in 83% of mathQuizzes and was the strictly-longest
   option in 75–93% of legacy banks. Every serving surface now shuffles options (with
   answer/whyWrong remaps), the legacy banks' verbose correct options were split (elaborations
   MOVED into whyCorrect, nothing deleted), throwaway distractors upgraded, and answer slots
   rebalanced. `tests/question-bank-quality.test.js` gates all of it with **zero allowlists**.
3. **Thin banks** — six paths had 5–7 questions total (the faang boss repeated its 5th question
   three times in 7 turns). 150 new questions authored; every path now holds 27–39, every boss
   deals a full hand, pools are floor-gated at 25.
4. **Ungraded surfaces** — battles, the daily challenge, and daily practice wrote nothing back.
   Battles now `scheduleReview` first attempts on completed lessons (no XP — rewards stay
   watermark-latched); the challenge grades its concept and finally populates **calibration**;
   daily practice files/clears weak spots under the real lesson.
5. **Wrong attribution** — reviews for the ~270 lessons without their own quiz bank fell back to
   keyword guesses. 136 daily-bank questions are now `lessonId`-tagged (stopword-filtered,
   plural-folded title matching, hand-audited) and the picker prefers exact tags, blending in
   related questions when only one tag exists so the salt keeps variety.

## What shipped, by commit

- **`cab4b91` Sprint 1 — the loop measures recall again**: picker salt · option shuffles ·
  daily challenge → real MCQ + confidence calibration · battle integrity (deck clamp, locked
  encounters get a fogged screen instead of deep-link XP, truthful +XP banner, gate context —
  battles name the lesson they block and the win CTA continues to it) · "That was close"
  grade-2 tap on Reviews · trail nodes tappable + keyboard-reachable · `map/`,
  `roadmap-scenes/`, eggs, keeper anims precached with a build-failing substitution guard.
- **`f776e13` Sprint 2 — trust & lifecycle**: evidence log cleared on reset/nuke + round-trips
  through backups (dedup on import, 20k-event self-cap) · forgetting curve hides n<5 bands +
  honest copy · reminder failed-state with install hint, SW recounts due reviews at fire time
  from the written schedule, notification click scoped to THIS app on the shared origin ·
  fake trophy % → real "day N of your journey" · sinkless EmberChip removed from Home ·
  one-CTA reviews card (patrol demoted to a text link) · comeback flow (welcome-back card,
  8-review capped first session, honest cliffhanger dating, >3d cliffhangers expire) · day-0
  fixes (daily practice gated + touched-paths pool, optional name, START HERE badge,
  fundamentals default).
- **`4d22785` Sprint 3 — content at scale**: 150 bank questions · 47 synthesis blocks gained
  commit-before-reveal questions (XP only on a correct commitment; the free reveal tap pays
  nothing) · **18 capstone projects** (guided lab → semi lab → open sd × 6 paths, incl. the
  mleng RAG build, fundamentals CLI task tracker, cybersec vault), `unlockAfter`-chained,
  section "Capstone projects" · quality gates + the inverse content-integrity test (every
  PATHS id must have an authored body).
- **(unlabeled, rode `ebd603d`)**: review attribution (lessonId tags + tiered picker) and the
  **drag-to-order question type** — `OrderQuestion.jsx` (pointer-drag grip, arrow keys, ↑/↓
  buttons), 16 authored order questions serving daily practice/Reviews/Watchfire (battles and
  the challenge exclude them by design).
- **`ebd603d` Sprint A — trust & data safety**: `useFocusTrap` on all seven aria-modal
  surfaces · **iOS-eviction survival** (every persist flush mirrors the store blob into
  IndexedDB — on the quota-failure path too; boot recovery restores it when both localStorage
  copies are gone; `navigator.storage.persist()` requested; reset/nuke clear the mirror so a
  wipe can't resurrect) · legacy bank rewrite (see headline #2).
- **`b7424a0` Sprint B — map & perf**: world↔trail is a REAL route (`/roadmap` vs
  `/roadmap/:pathKey` — back button, deep links, focus reset; returning auto-scrolls the
  active continent into view) · WorldView extracted, the `/worldmap` prototype deleted (it was
  riding the eager bundle via a static import; `/worldmap` now redirects) · **map art
  quantized** (`scripts/quantize-map-art.mjs`, pngquant-bin devDep): 1,307 KB → 419 KB (−68%)
  · **Python practice works offline after one online run** (SW serves
  `cdn.jsdelivr.net/pyodide/*` cache-first from a deploy-stable cache).
- **`c95747e` Sprint C — feel & clarity**: G1 juice (tapped option pops/shakes + a "+N XP"
  mote where XP mints at tap time; reduced-motion snaps it away) · **density fixes** — sections
  can carry `takeaway` ("☝ THE ONE THING" chip) and `deep: true` (collapses behind "Go deeper ▸")
  · **168 lesson `min` labels recomputed honestly** from word counts · **concept coalescing** —
  `src/data/conceptTags.js` tags the cross-path duplicates (SQL ×3, caching ×3, monitoring ×4,
  TLS ×2); the due list serves one sibling per concept per day and a grade-≥3 recall defers
  near-due siblings two days (a deferral, never fabricated evidence).
- **`4b36faf` Sprint E · `7046d24`+`c9d01c1` Sprint F · `0557d01` mlops/mleng tags** — see the
  state summary above (recaps, practice-on-demand, previews, objectives 282/282, 18 debriefs,
  Parsons/cloze/find-the-bug formats, full takeaway/deep pass).
- **`06d9e96`+`ad30e82` Sprint G — the unlockable world-myth saga** · **`274ea45` beast tab** —
  see the "Sprint G" section below.

## Sprint G — the unlockable world-myth saga (ink)

The Byte Beast tab's tap-through story, and the reason it's worth a section: the **authoring
format is now right for an ambitious, branching, unlockable saga** — adding to it is writing
plain ink, not hand-coding panel arrays + JS `if`s.

- **ink (inkle's narrative language) is the authoring layer.** Writers edit `src/story/saga.ink`;
  `scripts/compile-ink.mjs` (wired as `prebuild`, also `npm run compile-ink`) compiles it to
  `src/story/compiled/saga.json` using inkjs's **Compiler** (from `inkjs/full`, a devDep that
  NEVER ships). The browser ships only the inkjs **Story** runtime — a **31 KB-gzip LAZY chunk**
  (`ink-*.js`), verified absent from the eager bundle. The compiled JSON is committed so dev/
  tests don't need the compiler.
- **`src/data/storyEngine.js`** lazy-loads the runtime + JSON, pushes the learner's real progress
  (`beast`, `beast_tier`, `lessons_total`, `provinces_reclaimed`, `streak`) in as ink variables;
  the saga's own conditionals (`{beast_tier >= 4: …}`) decide which beats are UNLOCKED. One
  `Continue()` = one panel; tags carry `actor`/`kicker`/`title` (the same vocab `Cutscene.jsx`
  uses). Keep the VAR block in `saga.ink` in sync with `toInkVars()`.
- **`src/components/SagaStage.jsx`** is the tap-through player, reusing the milestone cutscene's
  `cutscene-cr-*` CSS so it looks native. Opened from a hero card (and a small stage affordance);
  a "✦ NEW" badge shows when studying has unlocked unseen beats (`sagaBeatsSeen` watermark in the
  store, additive field — no persist-version bump).
- **The saga (three strands, all from existing lore):** the world spine (the Null → the first
  light → the tide turns → the Watch unbroken, gated on lessons + provinces); your companion's
  **per-species arc** routed from `BEAST_LORE` (bond → scar → prime, gated on evolution tier —
  each of the 10 species tells a different story); the Lapse rising as provinces fall. Verified:
  2 beats at zero progress → 10 at endgame, with the right species prose and unlock order.
- **To extend the saga:** edit `src/story/saga.ink`, run `npm run compile-ink` (or just build),
  commit both the `.ink` and the regenerated `.json`. ink supports branches/choices/`INCLUDE`
  for multi-file stories when the saga grows.

## How to run / verify

```bash
npm install --legacy-peer-deps   # peer tree requires the flag (CI uses it too)
npm run dev                      # http://localhost:5173/InfraLearn/
npm run lint                     # ESLint, wired into CI
npm test                         # vitest (14 files, 466 tests)
npm run build && npm run preview # production at http://localhost:4173/InfraLearn/
npm run compile-ink              # recompile src/story/*.ink → JSON (also runs on prebuild)
node scripts/quantize-map-art.mjs   # idempotent; run after regenerating any map art
```

Dev tricks: `window.__ascend('devops')` triggers the Ascension cinematic; `#/battle/devops/1`
jumps into a fight; `#/roadmap/mleng` deep-links a province trail; the world-myth saga is on the
Byte Beast tab ("✦ Hear the myth").

**Deploy gotcha (standing):** GitHub's `deploy-pages` step occasionally 500s transiently —
retrigger with an empty commit, and always verify by comparing the local `dist/sw.js` against
the live one (byte-identical after CRLF→LF normalization; check a hashed chunk name appears in
the live precache manifest).

## Known follow-ups / not done

- **T3/T4 beast FRAME animations** — the static-tier beasts now breathe (CSS idle, shipped in
  `274ea45`), which solves "frozen beast." Richer PixelLab frame loops remain OPTIONAL and are
  scripted (`scripts/animate-beast-tiers.mjs`) but need a `PIXELLAB_API_KEY` run — the MCP path
  is impractical for 18 sprites (object creation ~8 min each) and risks off-model art. Provide
  the key → one command runs all 18.
- **Extend the world-myth saga** — the ink pipeline is live and thin content is the point of
  growth: more world-spine acts, per-province threads, and eventual tap-a-choice branches. Edit
  `src/story/saga.ink` (see the Sprint G section).
- **Watchfire's fate**: the one-CTA demotion shipped, but the product review still recommends
  deleting it outright (a literal duplicate of Reviews with a second HP metaphor) — owner call.
- **Cloud sync** stays dormant (`docs/SETUP-CLOUD.md`); firebase is still a hard dep with a
  permanently widened CSP (DEVILS-ADVOCATE §8's optional-dep + env-gated-CSP trim is unbuilt),
  and `src/cloud` still has no tests.
- **Journey doc** (`docs/journey-design.md`) still reads as a committed backlog; keep RPG
  expansion gated on a retention signal (locked decision).
- Smaller: G2 beast barks in the answer loop · predict-block sweep beyond the 47 synthesis
  commits · `checkJs`+JSDoc on the store/blocks seams · 404.html hardcoded base ·
  per-path lesson-chunk precache (IMPROVEMENTS 3.6) · `docs/retention-engine.md` hasn't been
  re-checked against the coalescing/deferral additions.
- **The strategic one (unchanged and now the biggest):** the measurement layer is honest, the
  content is deep, and the beast tab tells a story studying unlocks — but there are still **zero
  observed users**. The highest-value next action is a real-user test (hand the live URL to 2–3
  target learners and watch), which will reorder every other priority. Distribution/sharing is
  unexplored (BrowserRouter/OG-unfurl pays off only once a share feature exists — DEVILS-ADVOCATE
  §4).
