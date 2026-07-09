# InfraLearn — Session Handoff

> Shareable summary of the 2026-07 measurement-integrity + content sessions. Copy/paste freely.

**What this is:** InfraLearn — an offline-first PWA learning tracker (React 18 + Vite/rolldown,
Zustand → localStorage with an IndexedDB mirror, HashRouter, GitHub Pages). 8 career paths
(**282 lessons** incl. per-path capstone ladders), a gap-anchored spaced-repetition engine with
concept coalescing, XP/streak/badges, a virtual "Byte Beast" companion, a world-map roadmap,
Pokémon-style quiz battles, and drag-to-order questions.

- **Repo:** https://github.com/bchocyn/InfraLearn · **Live:** https://bchocyn.github.io/InfraLearn/
- **State at handoff:** Sprints 1–3, A–C, and E all pushed + deploy-verified. Sprint F
  (`7046d24` part 1, `c9d01c1` part 2) is the latest — the deploy for it is being
  (re)triggered as of this handoff (the `7046d24` deploy-pages step cancelled transiently;
  build/lint/tests passed). Tests **466 · lesson-schema 284 · ESLint clean · build clean**
  at every commit.
- **Sprints E & F — learning-platform depth (2026-07-08/09):**
  - **E (mechanisms, `4b36faf`):** SessionRecap on every testing surface (held/close/missed
    tally + missed prompts deep-linking to the fixing lesson); practice-on-demand
    (`/practice/:lessonId`, XP-free, weak-spot aware); un-started-trail path preview card
    (lessons/hours/section-arc/capstone/outcomes); lesson `objectives` render as "AFTER THIS
    YOU CAN"; **Parsons + cloze renderer support** (StemText renders `` `code` `` + `____`
    blanks across all 7 stem sites; OrderQuestion `code:true` = code-line ordering). Capstone
    debrief = the existing system-design-lab block used as a rubric (convention documented in
    `docs/lesson-blocks.md`).
  - **F (content, `7046d24`+`c9d01c1`):** 56 new-format questions (16 Parsons, 24 cloze,
    find-the-bug) — banks now **313 questions**; **objectives on all 282 lessons**; **18
    capstone debrief rubrics**; path-level `outcomes` on all 8 PATHS; 339 section takeaways +
    35 deep-collapse sections (mlops/mleng takeaways still pending a touch-up).
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
- **Sprint C — feel & clarity** (this commit): G1 juice (tapped option pops/shakes + a "+N XP"
  mote where XP mints at tap time; reduced-motion snaps it away) · **density fixes** — sections
  can carry `takeaway` ("☝ THE ONE THING" chip) and `deep: true` (collapses behind "Go deeper ▸");
  the first 8 fundamentals lessons are tagged (16 takeaways, 6 deep sections); **168 lesson
  `min` labels recomputed honestly** from word counts (a "5 MIN" lesson with 1,000 words now
  says 9) · **concept coalescing** — `src/data/conceptTags.js` tags the cross-path duplicates
  (SQL ×3, caching ×3, monitoring ×4, TLS ×2); the due list serves one sibling per concept per
  day and a grade-≥3 recall defers near-due siblings two days (a deferral, never fabricated
  evidence) · this HANDOFF refresh.

## How to run / verify

```bash
npm install --legacy-peer-deps   # peer tree requires the flag (CI uses it too)
npm run dev                      # http://localhost:5173/InfraLearn/
npm run lint                     # ESLint, wired into CI
npm test                         # vitest (13 files)
npm run build && npm run preview # production at http://localhost:4173/InfraLearn/
node scripts/quantize-map-art.mjs   # idempotent; run after regenerating any map art
```

Dev tricks: `window.__ascend('devops')` triggers the Ascension cinematic; `#/battle/devops/1`
jumps into a fight; `#/roadmap/mleng` deep-links a province trail.

**Deploy gotcha (standing):** GitHub's `deploy-pages` step occasionally 500s transiently —
retrigger with an empty commit, and always verify by comparing the local `dist/sw.js` against
the live one (byte-identical after CRLF→LF normalization; check a hashed chunk name appears in
the live precache manifest).

## Known follow-ups / not done

- **mlops/mleng section takeaways + deep tags** — the only lesson-pass gap left (both paths
  have full objectives + debriefs; only the skim-chip/collapse layer is missing).
- **Beast-tab optimization** — queued design discussion (not started). The T3/T4 beast idle
  animations are scripted (`scripts/animate-beast-tiers.mjs`, pilot validated ~1 gen/anim) but
  need a `PIXELLAB_API_KEY` run — see the script header.
- **Density tagging beyond the ramp**: the takeaway/deep mechanism is live app-wide but only
  the first 8 fundamentals lessons are tagged — the same pass (see
  `scratchpad ramp-density.mjs` pattern) fits any path.
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
- **The strategic one:** the measurement layer now exists and is honest — the bottleneck is
  users. Distribution/sharing is unexplored (and BrowserRouter/OG-unfurl work only pays off
  once a share feature exists — see DEVILS-ADVOCATE §4).
