# InfraLearn — Devil's Advocate: an architectural critique

> A deliberately adversarial reading of InfraLearn's load-bearing architectural decisions.
> The job here is to **disagree well**: steelman each choice first (so the critique can't be
> dismissed as a strawman), then make the sharpest evidence-backed case against it, propose a
> concrete better alternative, and end with a balanced verdict. This is "build upon," not
> "tear down" — most verdicts are *keep but mitigate*. Where the right answer is "keep as-is,"
> it says so.
>
> Companion docs: [HANDOFF.md](HANDOFF.md), [IMPROVEMENTS.md](IMPROVEMENTS.md) (the actionable
> backlog this argues for). Every claim cites `file:line`.

## How to read this

Each section follows the same shape:

- **Steelman** — the strongest *honest* defense of the current choice.
- **The case against** — where it bites, with evidence.
- **Better alternative** — concrete, usually incremental.
- **Verdict** — `change now` / `change soon` / `keep but mitigate` / `keep as-is`, + severity.

Severity: **fundamental** (architecture-level), **significant** (real, fixable), **minor** (cosmetic/latent).

A meta-theme runs through all eleven and is worth stating up front:

> **The recurring failure mode is not bad architecture — it's the gap between what the app
> *claims* and what it *does*.** The store claims durability but loses data silently. The docs
> cite FSRS-6 but implement none of it. The philosophy bans in-app editors but ships 55 of
> them. The handoff says "ESLint clean" but ESLint isn't installed. The code is good; the
> *claims* are unaudited. Almost every fix below is "make the claim true or drop the claim."

---

## 1. localStorage as the sole datastore — *significant*

**The decision:** one monolithic Zustand store serialized whole to a single `localStorage`
key, no IndexedDB, no server of record, no backup-on-write. Cloud sync ships disabled.

**Steelman.** For an offline-first PWA by a solo maintainer on static GitHub Pages,
localStorage is the lowest-friction durable store: zero server, zero auth, zero ops. And it's
engineered, not naive — `setItem` coalesces ~8–10 `set()` calls per action into one
microtask-flushed write ([useStore.js:1599-1631](src/store/useStore.js#L1599-L1631)); a
cross-tab `storage` listener re-hydrates to avoid clobbering; a defensive migration ladder
(v2→v13) repairs hand-edited blobs. The persisted payload is tiny (`completed` is a bare
`{id:true}` map), so the ~5 MB quota is realistically never approached by the store itself.

**The case against.** The product's entire value *is* the long-term retention dataset — and
the loss failure modes are both **silent and irreversible**:
- Quota/private-mode throw → `console.warn` only ([:1607-1608](src/store/useStore.js#L1607-L1608)).
  The `set()` already mutated memory and fired the celebration, so the user earns rewards that
  vanish on reload with no signal.
- A truncated blob → `getItem` returns `null` ([:1615](src/store/useStore.js#L1615)) → Zustand
  falls back to `initial` → **total reset to a new account**, not a repair.
- `ErrorBoundary.nukeStorage` ([ErrorBoundary.jsx:33-40](src/components/ErrorBoundary.jsx#L33-L40))
  gives a one-tap "wipe everything" on *any* render crash, no backup-first — and because the
  store is monolithic, a bug in a cosmetic component can present a screen whose only obvious
  escape destroys all progress.
- iOS evicts PWA localStorage after ~7 days unused — i.e., the lapsed user the entire
  streak/forgiveness/nudge engine exists to win back returns to a blank slate.

Every mitigation (manual export, cloud) is opt-in, so it protects the conscientious users who
need it least.

**Better alternative.** Don't swap the datastore — *add a cheap durability layer*. (A)
Backup-on-write: mirror each flush to a second key (`infralearn-store.bak`), or to IndexedDB
via `idb-keyval` (different quota bucket, less eviction-prone); recover from it before falling
back to `initial`. (B) Surface failure: a `persistFailed` flag + sticky "back up now" banner;
make `nukeStorage` export-first. Keep localStorage as the synchronous primary — going
async-primary would reintroduce the lost-on-unload risk the coalescing design specifically
solved. **Mirror, don't migrate.**

**Verdict:** keep but mitigate — *bordering on change soon* for the failure-surfacing piece.
The engineering is genuinely good; three properties are indefensible for a retention product
(silent persist failure, corrupt-read total-reset, nuke-without-backup) and should be the next
change-set.

---

## 2. Content as ~37k lines of hand-written JS modules — *significant*

**The decision:** lesson bodies authored as JS object-literal modules compiled into the
bundle; "content and code are the same artifact."

**Steelman — and a premise the audit got wrong.** The bodies are **pure JSON-serializable
data** — `JSON.parse(JSON.stringify(fundamentals))` round-trips byte-identical, zero
functions/JSX. The `.js` is just an `export default {…}` envelope. So this is *data in a JS
wrapper*, not logic entangled with content. In-bundle is the *right* default for offline-first
(zero network dependency, atomic git versioning), per-path dynamic `import()` already splits it
into 8 chunks ([loader.js:11-20](src/data/lessons/loader.js#L11-L20)), and the block AST
(`interactive-viz`, `predict`, `walkthrough`, `system-design-lab`) is richer than markdown can
express. A CMS would break offline-first; MDX would re-entangle content with JSX.

**The case against.** The defect isn't "JS instead of CMS" — it's the **absence of a real
schema** and the **escaped-string storage format**:
- The "schema" is prose comments plus a runtime test that checks only `typeof type === 'string'`
  for ~15 of 17 block types. A `code` block with no `text`, or a `table` with ragged rows,
  ships green.
- The integrity test is **one-directional** ([lesson-schema.test.js:88-91](tests/lesson-schema.test.js#L88-L91)):
  a typo'd PATHS id renders the "hasn't been authored yet" card in production with CI green.
- The load-bearing per-line `# what/why` comment pedagogy lives **inside escaped JS strings**
  ([fundamentals.js:27](src/data/lessons/fundamentals.js#L27)) — unreviewable in a diff, so the
  single most important content-quality invariant is stored in the least reviewable form
  possible.
- A one-char typo in an 8380-line string is a *build* failure that darkens all 45 lessons in
  that path, not one.

**Better alternative.** Keep in-bundle, per-path-chunked, code-versioned. Change the *format
and validation*: add a `zod` discriminated union over the block types (one schema, run as a
hard CI gate and dev-time render check); add the bidirectional + cross-file-id integrity test;
*later*, convert path files to `.json` (near-zero cost since they're already pure JSON) so
errors localize and content is diffable. **Do not** adopt MDX or a CMS.

**Verdict:** keep but mitigate, and reframe. The shipping model is right; the validation layer
is missing. The zod gate + bidirectional integrity test are the load-bearing fixes; the JSON
conversion is nice-to-have.

---

## 3. A hand-rolled "FSRS-flavored" scheduler — *significant*

**The decision:** fixed per-grade stability multipliers + `interval = ceil(stability ×
difficulty^-0.5)`, no retrievability, no elapsed-time term — while citing FSRS-6 and Cepeda
2006 as justification.

**Steelman.** A 30-line dependency-free scheduler can't break the offline guarantee a
transitive dep could; review volume is tiny (whole *lessons*, self-graded by beginners), so the
retention delta vs. real FSRS is dwarfed by whether the user shows up at all (which the
streak/nudge layer drives); and a solo maintainer can read and unit-test the whole thing,
unlike ts-fsrs's 19-weight vector. The *qualitative shape* is right: misses reset, good/easy
push out, hard returns sooner.

**The case against.** The problem isn't hand-rolled vs. library — it's that this implementation
is **broken in ways that defeat its own cited science**, so the team pays the credibility cost
of citing FSRS-6 while shipping something that isn't even a correct *simple* scheduler:
- **Intervals depend only on review *count*, never the gap achieved.** `stability *= mult`
  regardless of `(today − lastSeen)` ([useStore.js:885-890](src/store/useStore.js#L885-L890)).
  A daily reviewer and a once-a-month reviewer get identical trajectories — the precise
  *opposite* of the Cepeda optimal-gap cited at [retention-engine.md:107-109](docs/retention-engine.md#L107-L109).
- **No retrievability term anywhere** — the *central* mechanism of FSRS. A scheduler with no R
  is not "FSRS-flavored"; it's a degenerate SM-2.
- The `difficulty^-0.5` "inverse of FSRS-6" framing is simply wrong about what FSRS does.
- Difficulty only moves on grades 1 and 4, so "Hard" is nearly inert; Hard and Good collapse to
  the same interval at low stability.
- Reading a lesson auto-grades as a passed recall (grade 3, stability 2.5) — recognition earning
  recall-grade credit, contradicting the engine's own thesis.

**Better alternative.** Keep the hand-roll (don't add ts-fsrs at this volume), but make it an
*honest* simple scheduler: anchor growth to elapsed time (compute observed retrievability from
days-since-last-seen, ~10 lines); make difficulty respond to all grades; floor Good above Hard;
stop auto-grading reads as passes; rewrite the docs to cite research only where implemented.

**Verdict:** keep but fix now, and re-document honestly. Treat the FSRS-6/Cepeda citations as a
*correctness bug*, not a doc nicety — either make the mechanisms real (cheap) or stop claiming
them. The elapsed-time anchoring is the single highest-value fix in the app.

---

## 4. HashRouter on GitHub Pages — *minor*

**The decision:** HashRouter + static Pages as the "permanent" stack.

**Steelman.** For a client-only-state offline PWA, SSR is pure cost (there's nothing
server-side to render). HashRouter eliminates an entire class of Pages deep-link 404s with zero
server config. The costs the contrarian leans on are currently *zero-value*: there's no
share-a-lesson feature (`navigator.share` appears nowhere), and SEO is irrelevant for
onboarding-gated, client-rendered content. The router is swappable in one line — picking it now
forecloses nothing.

**The case against.** Two decisions are bundled as one. The *static/no-server* half is
excellent and permanent. The *HashRouter* half is a workaround for one host's limitation,
cemented as if it were a principle — and it carries a real latent cost: hash URLs structurally
**cannot be link-unfurled with per-lesson Open Graph cards** (the `#` fragment never reaches a
server/prerenderer), foreclosing the single highest-leverage organic growth loop for a product
that explicitly wants to be "addictive." Plus [404.html:3](public/404.html#L3) hard-codes
`/InfraLearn/`, and the repo has already been renamed once — so a rename silently breaks
deep-link recovery while `base` updates.

**Better alternative.** Keep static/no-SSR permanently. The only change justified *today* is
de-hardcoding the base in `404.html`. Switching to BrowserRouter (clean `/lesson/:id` + SPA
fallback) is the right end-state **iff** a share feature ever ships — until then it buys
nothing the app uses.

**Verdict:** keep but de-couple. Do the `404.html` base fix now (concrete realized failure);
gate the BrowserRouter migration behind an actual share/growth feature. YAGNI otherwise.

---

## 5. A large RPG meta-game layered on a retention core — *significant*

**The decision:** a journey layer (lore, the Five Lapses, planned ember economy, bestiary,
Watchfire Defense review-battles, boss fights, tamer gear, 8s Ascension cinematic) per
`journey-design.md`.

**Steelman.** What *shipped* is a disciplined skin, not an economy — **zero new store state**,
reusing surfaces that already exist (the cinematic rides the existing ascension queue; the
Null fog is derived purely from `completed`). The mechanics→lore mapping is intellectually
honest (forgetting→the Null; FSRS lapses→the Five Lapses) and crucially makes *rest canon*
rather than punished, protecting the forgiveness model. The expensive parts were deferred —
correct risk ordering.

**The case against.** The artifact leaks cost and contradiction *before a single mini-game
exists*:
- The design *doc* reads as a committed backlog ("P0…P4", "~3-5 d each", "NAMES LOCKED",
  "Build order") — a future maintainer treats it as a plan, not a shelved idea.
- ~82 lines of `lore.js` (`WORLD`, `BEAST_LORE`, `KEEPER_RANKS`, …) are **dead code with zero
  importers**, and `KEEPER_RANKS` is already *wrong* (10 ranks vs. the real 4 tiers) — proving
  nothing exercises it.
- The story is **hardcoded into the core study surface** against the one-CTA mandate: blinking
  Lapse "eyes" and "X WAITS AT THE END" on the Roadmap
  ([Roadmap.jsx:1292-1336](src/screens/Roadmap.jsx#L1292-L1336)) — a dial the doc itself flags
  as *contested*, shipped with no toggle.
- `PathAscension` is an ~8s **input-blocking** modal — the exact celebration philosophy the
  rest of the app explicitly rejects (`CelebrationMoment` is 1.5s, non-blocking,
  "ADHD-friendly") — for the *rarest* event a user hits (≤8 times ever). Inverted effort/frequency.
- The lore *names the trap the planned economy would commit*: **Bitrot, "dressing rote in
  costume"** — a review-battle wrapper is exactly that.

**Better alternative.** Freeze the meta-game at "thematic skin" *permanently*. Delete the dead
exports; reframe the doc header as **"Explored and shelved — do NOT build without a retention
A/B win first."** Gate the Roadmap leak behind a `loreAmbient` setting. Bring the cinematic
closer to the 1.5s non-blocking pattern (or surface skip from t=0). Establish a hard
precondition: the *free* shipped skin must demonstrably move D7-return before any ember/boss
work — if the skin doesn't move retention, an expensive economy on top won't either.

**Verdict:** keep but mitigate, and explicitly shelve the expansion. The shipped restraint is
arguably the *correct final state*, not phase 0. The danger lives entirely in the doc and dead
code that frame restraint as a temporary first phase.

---

## 6. Offline-first via a custom hand-written service worker — *minor*

**The decision:** a ~244-line hand-written SW + a bespoke Vite plugin that substitutes a
precache-manifest sentinel, instead of Workbox / vite-plugin-pwa.

**Steelman — and a correction.** The headline indictment is **stale**: `dist/sw.js` ships a
fully-substituted 40-asset manifest, and commit `4e78b5d` already fixed the sentinel bug. The
custom SW does things Workbox's defaults get *wrong* for a shared-origin Pages site: it prunes
only `infralearn-*` caches (sibling project sites share the origin); it deliberately does *not*
`skipWaiting`/`clients.claim`, driving updates via a non-blocking toast (matching the locked
no-interrupt philosophy); it guards against shell-cache poisoning. Replicating those in Workbox
requires overriding its defaults anyway.

**The case against.** The substitution works today but is an **unguarded post-build side
effect with zero regression coverage** — and it broke silently *once*. The plugin
([vite.config.js:11-48](vite.config.js#L11-L48)) does one regex replace and logs success but
asserts nothing; tests run *before* build and inspect source, never `dist/sw.js`. A sentinel
rename or an over-matching skip regex ships a SW with `PRECACHE_ASSETS = []` and offline-first
silently dies for every unvisited route — the exact bug that already shipped. Separately, the
hand-rolled per-asset install loop reimplements Workbox's *hardest* generic concern
(precache-revision dedup), while the genuinely custom parts are small — an inverted cost/benefit.

**Better alternative.** Don't rewrite. **Close the verification gap**: `throw` in the plugin if
the injected list is empty/sentinel survives; add a post-build dist-smoke CI step asserting the
manifest contains the eager chunks. Reserve a `vite-plugin-pwa` *injectManifest* migration
(which keeps every custom handler verbatim and lets Workbox own only the precache list) as an
optional future step.

**Verdict:** keep but mitigate. The accusation of "broken" is factually stale; the real risk is
*process* (no regression gate), fixable in a day.

---

## 7. Custom in-browser tooling vs. the "no in-app editors" philosophy — *significant*

**The decision:** Pyodide (~10 MB CDN Python runtime in a Worker) + 4 CodeMirror editors + a
~530-line bash terminal emulator + a ~640-line regex linter, powering 55 in-lesson `practice`
blocks — despite the locked philosophy "no in-app code editors or typed/self-graded exercises;
do it for real in VS Code."

**Steelman.** Active recall beats passive reading, and a cell that runs *real* Python and grades
the *actual value* is a genuine retrieval event — the high-value loop the retention engine is
meant to reward. The Python path is engineered with real care (off-main-thread, 15s timeout +
respawn, serialized run-queue, traceback cleanup, lazy-loaded). One could read "Sandbox removed"
(a multi-language playground *tab*) as narrower than "no inline practice cells."

**The case against.** The stack pays maximum cost for sub-real value and is partially broken:
- **Direct contradiction**: the blessed pattern (`BuildAlongBlock`) is used **twice**; the
  contradicted in-app editors are used **55×** — a ~27:1 inversion.
- **The 16 bash blocks are doubly broken**: `<TerminalBlock />` is mounted with **no props**
  (starter dropped), and the simulator lacks `curl`/`node`/`npm` that the starters invoke — so
  the app teaches a command then returns `command not found`. (See [IMPROVEMENTS.md §0.1](IMPROVEMENTS.md).)
- **Offline-first is violated for the flagship interaction**: Pyodide is CDN-only and the SW
  bypasses cross-origin, so the first run needs network and offline degrades to a regex that
  only matches `x = <literal>`.
- **Standing cost**: 8 CodeMirror packages + a permanent CSP widening for jsdelivr.
- **The linters train against a fake oracle**: regex YAML/SQL/Dockerfile validation mis-fires on
  valid input — a learner who writes correct YAML and sees a red ✗ learns the wrong lesson.

**Better alternative.** Bifurcate by what each language can deliver *truthfully offline*: **keep**
the Python cell as the one justified exception (real code, real grading) but **self-host
Pyodide** + precache it so offline-first holds; **delete** the bash terminal and the regex
linters (38 of 55 blocks, ~1170 lines) and replace them with `BuildAlongBlock` — the team's own
blessed, more-honest pattern. Delete the dead `runnable` CodeRunBlock path (0 uses).

**Verdict:** change now, surgically. Not uniformly wrong — the Python cell is the justified
exception. But the bash + linter blocks (69%) are the contradicted, broken, lower-value half;
removing them leaves a smaller, truthful, offline-capable surface that does exactly what the
design doc says.

---

## 8. A fully-built but dormant Firebase cloud-sync integration — *significant*

**The decision:** ship a complete Firebase/Firestore sync that's inert (`CLOUD_CONFIG = null`)
until a config is filled in.

**Steelman.** Disciplined "build it dark": `firebaseAdapter.js` is the only firebase importer,
reached via a dynamic import vite splits into a chunk *excluded from precache*, so dormant builds
ship **zero firebase bytes** and the runtime cost to current users is ~zero. The provider-agnostic
facade (`sync.js` imports nothing firebase-specific, takes the store as a param) is a clean,
swappable seam. Routing all cloud data back through the battle-tested `importData` scrubbers means
the cloud is *not a new trust boundary*.

**The case against.** "Zero cost" is false — three costs are paid *today* against zero users:
- `firebase ^12.14.0` is a **hard production dependency** ([package.json:29](package.json#L29)) —
  one of npm's largest trees, in every install/audit/Dependabot run for unreachable code.
- The **shipped CSP** ([index.html:54](index.html#L54)) permanently widens `frame-src` to
  `*.firebaseapp.com` / `accounts.google.com` (previously unset) — a real attack-surface
  expansion for a feature that's *off*.
- The data-loss-critical path has **zero tests** despite the module advertising its own testability.

And the conflict model is quietly wrong as a "sync": monotonic union
([useStore.js:1486](src/store/useStore.js#L1486)) **cannot delete or reset** — "Reset progress"
on device A is silently undone by device B; and identity/theme/path are local-wins
([:1515-1517](src/store/useStore.js#L1515-L1517)), so they silently revert across devices. Both
are behaviors a user would file as bugs, sold as "last-writer-safe." The genuinely
provider-agnostic facade *paradoxically* undercuts choosing the heaviest possible first adapter
for what is literally "auth + one blob per user."

**Better alternative.** Keep the facade and opaque-snapshot model — they're good. Trim the
standing costs while dark: firebase → `optionalDependency`; env-gate the Google CSP; add the
~40-line fake-adapter test now. Defer the conflict-model fix until activation (today no two
devices can sync, so the bugs are unreachable). At activation, reconsider Firebase vs. a lighter
auth+KV (Supabase / Cloudflare KV) for what is just a per-user blob store.

**Verdict:** keep but mitigate. The architecture is worth keeping dark; the "zero cost" claim
isn't true. Trim the costs now, keep the design, fix semantics at activation.

---

## 9. No type system + tests concentrated on the store — *significant*

**The decision:** plain JS/JSX at ~60k LOC; the test suite is ~86% auto-generated per-lesson
schema parameterization, with real behavioral coverage concentrated on the store.

**Steelman.** Rational allocation for a solo, multi-agent-authored PWA: the store is where the
*irreplaceable* value lives, and that's where testing is deep — 41 hand-written behavioral tests
including the data-loss-critical `importData` merge. The render layer is comparatively low-stakes
(a broken diagram is visible in dev and never corrupts saved state). A full TS migration of 60k
LOC solo is a multi-week tax; the runtime schema test catches *semantic* footguns types can't
(vanishing 5th sequence lane).

**The case against.** The defense holds for the store but **collapses at the seams** — exactly
where plain-JS-with-narrow-tests is blind:
- **Cloud orchestration on top of `importData` is untested** — the merge *primitive* is tested,
  but the pull→merge→push race and fail-closed guard (the parts that lose data across devices)
  are not. False confidence that "sync is tested."
- **The render layer isn't merely cosmetic — engagement *is* the product**, and the bash bug
  ([Lesson.jsx:2447](src/screens/Lesson.jsx#L2447)) is exactly what a 10-line render test catches.
  The audit found it by reading; a test would have found it in CI.
- **"ESLint clean" is provably false** — the binary is absent from `node_modules` and
  `package.json`; `npm run lint` has never succeeded; CI never lints. A green pipeline ships
  unlinted, untyped, render-untested code straight to production with no staging. The one static
  defense for a type-free 60k-LOC codebase is *dead*.

**Better alternative.** Keep plain JS — don't migrate to TS. Close the two gaps that cause
*irreversible* failures: install ESLint + CI lint step (makes the handoff honest); write the
fake-adapter sync test; add `checkJs`+JSDoc on the store API and block-AST union only; ~8 RTL
smoke tests on engagement-critical render; coverage threshold scoped to `store`+`cloud` only.
Don't chase render-layer coverage parity — that's the same misallocation in reverse.

**Verdict:** keep but mitigate. The type decision is right; the error is treating the *render and
cloud seams* as equally low-stakes when engagement is the product and cloud is the only path to
silent multi-device data loss. ESLint + the sync test are non-negotiable.

---

## 10. No telemetry in a product whose thesis is measurable retention — *significant*

**The decision:** zero analytics/telemetry of any kind.

**Steelman.** Coherent for an offline-first, privacy-respecting, near-zero-user solo PWA: a
collection endpoint contradicts offline-first; a third-party SDK widens CSP and ships a tracker
into a beginner learning tool; the app already keeps rich *per-user* instrumentation (dailyStats,
activityDays heatmap, FSRS reps/lapses, calibration) and shows it back to the user. The loop is
grounded in cited literature (Cepeda, FSRS-6), so the team borrows validated science. YAGNI at
this scale.

**The case against.** Two load-bearing errors. First, **the app throws away its own evidence**:
`dailyStats` is capped to 14 days, `xpHistory` to 20 entries, both *dropped on import and sync*,
and `reviewQueue` keeps no per-grade history. So the product **cannot answer its own central
question even for one user** — was a concept completed 60 days ago still recalled at day 90? The
longest retention signal it keeps is *14 days*, for a thesis about *long-term* retention. Second,
**the borrowed-science defense is undermined by the implementation** — the scheduler provably
diverges from FSRS (§3), and the XP recall>recognition gradient is inverted in shipped code — and
*nothing measures the gap*. And "addiction/engagement" is precisely the part that can't be
reasoned from literature about *other* apps: whether *this* one-CTA-violating Home screen drives
return visits is an empirical question this product refuses to let itself answer.

**Better alternative.** Keep zero third-party telemetry and stay offline-first, but **stop
truncating the retention signals**: an append-only local event log (in IndexedDB) of
`{ts, type, conceptId, grade, intervalScheduled}`; a per-user retention curve in ProgressPanel
(recall accuracy vs. days-since-seen) that makes the north-star *visible and falsifiable*; an
opt-in "share anonymized learning data" that bundles the (identity-scrubbed) log into the
*existing* export for the maintainer to collect from willing beta users. No SDK, no endpoint, no
CSP change, no consent-banner liability. Plus a CI assertion that shipped XP/scheduler constants
match the documented table.

**Verdict:** keep but mitigate, soon. No *third-party* telemetry is correct. But *no measurement
at all* is a real defect against the product's own thesis — and the sharpest evidence is internal
(it discards the data it already generates). The fix isn't GA; it's refusing to throw away the
data and exposing a retention curve.

---

## 11. Eight career paths as independent silos — *significant*

**The decision:** 8 paths with no cross-path graph, recommended ordering, prerequisites, or
shared-concept dedup; the path-to-path rework was explicitly deferred.

**Steelman.** Correct for *landing a working product*. Free path choice is the lowest-friction
on-ramp — directly ADHD-friendly ("switch anytime"); a prereq-locked curriculum ("finish 45
Fundamentals lessons first") is the delayed-gratification trap the design memory warns against.
The architecture is honestly orthogonal (a path is `{name, icon, lessons:[]}`), so the graph is
purely additive later — no refactor debt accrues by waiting. Intra-path ordering *is* enforced
where it matters (`labUnlockStatus`). The deferral was a documented owner decision with a specced
future, not an oversight.

**The case against.** The silo model quietly defeats the north-star ("a beginner can architect
systems… with depth") for the exact users it serves:
- The "recommendation" is an **accident of `Object.keys` order** ([Home.jsx:58-62](src/screens/Home.jsx#L58-L62)).
  Onboarding shows a flat grid with no "start here" — a true beginner can one-tap into "How
  Discord Scaled to 19M Users" with zero programming.
- **Heavy concept duplication the system can't see**: caching in 3 paths, SQL in 4, monitoring in
  3, TLS in 2. Because lessons are keyed by independent ids with no cross-path links, the same
  concept generates **redundant, uncoordinated spaced-rep cards** — a direct retention miss in a
  product whose entire thesis *is* retention.
- **Path completion — the peak dopamine moment — hands off to nothing** ([Home.jsx:63-64](src/screens/Home.jsx#L63-L64)):
  no "you finished DevOps, you're ready for MLOps."
- It's **internally inconsistent**: `labUnlockStatus` proves the team already believes
  prerequisites are pedagogically sound — they just stop at the path boundary for no defensible
  reason.

**Better alternative.** Ship the *lightest* layer that closes the gap without hard gates (which
*would* fight the ADHD on-ramp): `recommended:true` + "Start here" badge; soft `buildsOn`/`nextUp`
metadata (a real path-completion handoff); `concept` tags on the verified overlap set so
spaced-rep can coalesce. Purely additive, no refactor. **Don't** build the full RPG skill-map or
hard prereq locks.

**Verdict:** keep the silo substrate, but the deferral over-shot — ship the soft
recommendation+handoff+dedup layer *now*, before more content widens the duplication gap.

---

## Meta-synthesis — what to take from all eleven

Read together, the eleven verdicts are strikingly consistent: **ten of eleven are "keep but
mitigate," and not one calls for a ground-up rewrite.** That's the real finding. The
architecture is sound; the debt is in three specific, recurring shapes:

1. **Claim/reality gaps.** The most dangerous issues are where a stated guarantee is silently
   false: durability that loses data (§1), FSRS science that isn't implemented (§3, §10),
   "ESLint clean" with no ESLint (§9), "sync across devices" that can't reset or sync identity
   (§8), "no in-app editors" with 55 of them (§7), "offline-first" whose flagship feature needs
   a CDN (§6, §7). **Fixing these is mostly free — make the claim true or drop the claim.** Start
   here.

2. **Missing safety nets, not missing features.** Every claim/reality gap survived because the
   net that would catch it isn't installed: no lint, no cloud test, no render test, no doc-vs-code
   assertion, no SW regression guard, no per-block schema. Installing the nets (Tier 1 in
   [IMPROVEMENTS.md](IMPROVEMENTS.md)) is higher leverage than any single fix, because it stops
   the gaps recurring.

3. **Gravitational scope pull.** The journey doc (§5) and the dormant-firebase build (§8) both
   exert pressure toward expensive work the product doesn't need yet. The discipline already
   shown (shipping the *skin*, building cloud *dark*) is correct — the risk is treating restraint
   as "phase 0." **Name the shelved things as shelved**, in writing, so no future contributor (or
   agent) silently starts building them.

The one decision worth genuinely *reconsidering* at the architecture level isn't on this list as
"fundamental" because it's cheap: **the monolithic single-key store** (§1) is the amplifier that
turns every other failure into a *total-loss* failure. A render bug nukes everything; a corrupt
field resets everything; quota pressure loses everything. Slicing the store and adding
backup-on-write doesn't change the product — it changes the *blast radius* — and that's the
highest-value architectural move available.

> **If you do only one thing:** make data loss recoverable (§1) and make the claims honest
> (everything in Tier 0). The features are already good; the trust is what's leaking.

---

# Addendum — The world-map roadmap prototype, adversarially reviewed

> Added after building `src/screens/WorldMap.jsx` (the `/worldmap` two-level world → continent →
> lessons prototype, with pixellab continent art). Same rule as above: steelman first, then the
> sharpest case against, then how to actually make it better. This is the honest critique of work
> just done — apply it before investing more.

## A1. Two roadmaps now exist — *significant*

**Steelman.** The world map is a genuinely better *information architecture* than a single
per-path serpentine trail: it makes the whole curriculum visible at once, gives path-completion a
"sail to the next continent" payoff, and is the natural home for the §11 recommend-a-path fix. It's
behind a dev route, so it costs nothing in production yet.

**The case against.** `main` already shipped a heavily-invested Roadmap — per-province **PixelLab
landscapes for all 8 paths**, **journey cutscenes**, a **Codex**, **Watchfire**, embers (70 commits
of it). The world map is a **second, overlapping navigation+narrative surface** built in parallel,
unaware of that work. Two map systems, two art pipelines (the Roadmap's landscape backdrops vs. the
world map's continent sprites), two narrative skins (province banner/fog on the trail vs. continents
+ medallions). That's exactly the "competing surfaces" smell the journey critique (§5) warned about —
now realized. Shipping both doubles maintenance and confuses the IA ("is my journey the trail or the
map?").

**Make it better.** Decide the *relationship* before polishing pixels: either (a) the world map
**replaces** the Roadmap landing and the existing serpentine view becomes the **continent drill-in**
(reuse the PixelLab landscape + cutscene triggers there), or (b) the world map is a **header/zoom-out
affordance** on the Roadmap, not a separate screen. Do not ship two co-equal maps. The current
"button on the Roadmap → separate `/worldmap`" is fine for a *preview*, but it's a fork in the road,
not a destination.

## A2. The art pipeline is non-deterministic and fragile — *significant*

**Steelman.** pixellab got us bespoke, on-theme, colorful continent art fast and cheap (against the
subscription), and the flood-fill keyer (`scripts/key-worldmap.mjs`) reliably turns the opaque
backgrounds transparent.

**The case against.** The art is **not reproducible**: each continent took 1–3 re-rolls because
pixellab randomly returned flat-top-down *or* isometric-platform results for the same prompt; the
keyer is a **heuristic** (border-flood at colour-distance ≤56) that silently did nothing on the
edge-bleed cybersec v1 and could eat island content on a future biome whose interior matches its
coast. Regenerating any continent later is a dice-roll that may not match the set. The assets also
**aren't in the SW precache** (`vite.config.js` collects `assets/` + `beasts/`, not `worldmap/`), so
~640 KB of continent PNGs are uncached on first paint and unavailable offline — directly against the
offline-first claim (DA §1/§6).

**Make it better.** (1) Once the 8 look right, **freeze them** — treat them as committed source art,
not regenerable. (2) Add `public/worldmap/**` to the SW precache (or accept they're online-only and
say so). (3) If consistency matters, regenerate the set via pixellab **img2img/style-match** against
the one continent you like best (the technique `main`'s qilin commits used) so all 8 share a
silhouette/lighting language. (4) Document the keyer's tolerance + that re-keying is idempotent, so
the next dev doesn't re-flatten good art.

## A3. Lesson node placement is meaningless — *minor, but it undercuts the north-star*

**Steelman.** The deterministic boustrophedon scatter (`scatterNodes`) is stable across renders and
reads as "dots across a territory," which is the CRK/Elden-Ring look.

**The case against.** A lesson's position on its continent encodes **nothing** — not its section,
tier, or prerequisite order beyond a snaking walk. Elden Ring and CRK place nodes *deliberately*
(regions, gates, branch points); ours is noise. For a learning map, that's a missed teaching signal:
the map *could* show structure (sections as clusters, labs as branch endpoints, the "you are here"
frontier) and instead shows confetti. It also undercuts the §11 idea (concept clusters, buildsOn).

**Make it better.** Drive node placement from data: group by `section` into visual clusters, place
labs at cluster ends, route the connecting path in lesson order, and mark the first-incomplete node
as the bright frontier (the Roadmap already computes this). Position should *mean* something.

## A4. Drill-in is component state, not a route — *significant (a11y + the audit's own finding)*

**Steelman.** `useState(openKey)` is the simplest possible two-level nav and keeps the prototype
self-contained.

**The case against.** This re-commits the exact sins the main audit flagged: **no URL** for a
continent (can't deep-link or share "the DevOps province" — the §4 growth-loop point), **no browser
back** (Android back / swipe won't exit a continent; only the custom "← World" button does), and
**no focus management** on the view swap (the §3.1 stranded-focus finding). It's an SVG of
`role=button` groups with no roving tabindex, so keyboard users tab through 8 continents with no
arrow-key model.

**Make it better.** Make the continent a real route (`/worldmap/:pathKey`, or reuse `/roadmap` with
the path in the URL), move focus to the continent heading on open, restore to the tapped continent on
back, and add a roving-tabindex/arrow-key model across the 8 regions. Same fix as IMPROVEMENTS §3.1 —
do it once, reuse it.

## A5. Is this even the right thing to build right now? — *the ROI question*

**Steelman.** Engagement / visible-progress is load-bearing for an ADHD retention product, a world
map is a strong engagement surface, and the user explicitly asked for it.

**The case against.** Per the main audit, **Tier 0 is still open**: silent data loss (§1), the
lying/broken bash practice blocks (§7), "ESLint clean" that isn't (§9), the inverted XP table (§3).
This session went to map *aesthetics* while the product still loses progress and ships
provably-false claims. Said plainly: **a beautiful map of a curriculum whose progress silently
evaporates is polishing the lobby of a house with no roof.**

**Make it better.** Time-box the map to "good enough to validate the IA," then bank the Tier-0 fixes
before more polish. At minimum, ship the §1 backup-on-write *before* the map reaches the real Roadmap
tab, so the progress the map visualizes can't vanish.

## A6. The world view is 8-way choice overload — *minor*

**Steelman.** Free choice of continent is the ADHD-friendly on-ramp (§11 steelman), and the map shows
everything at once which aids orientation.

**The case against.** The locked ADHD mandate is **one dominant CTA**; a screen of 8 equally-weighted
continents + medallions + banners + fog + a sea serpent is the *opposite* — the Home-screen overload
finding (§3.2) reborn on a prettier canvas. And the fog is **cosmetic** (everything is tappable), so
it implies a gate it doesn't enforce — its own little dishonesty.

**Make it better.** Keep the map but resolve ONE hero action over it — a pulsing "Continue: {current
lesson}" pinned to the active continent, the other 7 ambient/explorable. Either make the fog *mean*
something (a soft "finish Fundamentals to clear the mist" nudge, not a hard gate) or drop it.

---

## World-map verdict

The IA is right and the art is charming, but the prototype quietly re-creates four problems the main
audit already named (duplicate surface, no-route nav, stranded focus, choice overload) and adds two
new ones (non-reproducible art, meaningless node placement). None are fatal; all are cheap to fix.
**Priority order to make it better:** (A1) decide replace-vs-augment so we don't ship two maps →
(A4) route + focus the drill-in → (A2) freeze + precache the art → (A3) data-driven node placement →
(A6) one hero CTA + honest fog. And don't let the map jump the Tier-0 queue (A5).

*(Cookie-Run-specific visual/UX principles to push this further are captured in
[IMPROVEMENTS.md → "World-map roadmap: Cookie Run design lessons"](IMPROVEMENTS.md).)*
