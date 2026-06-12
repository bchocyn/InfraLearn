# InfraLearn

## Quickstart

```bash
npm install
npm run dev
```

Vite serves at `http://localhost:5173/InfraLearn/`. The
`base` path in `vite.config.js` matches the GitHub Pages deploy target, so
local URLs include the same prefix. Open the URL Vite prints — `HashRouter`
keeps deep links working on Pages.

Tests:

```bash
npm test           # one-shot run (Vitest)
npm run test:watch # re-run on file change
npm run test:ui    # browser test inspector
```

## What's inside

Eight career paths, each split into sections of concept lessons, system-design
insight rows, and multi-milestone labs:

- **Fundamentals** — Python, CLI, Git, networking, OS internals
- **DevOps** — containers, Kubernetes, CI/CD, observability, IaC
- **MLOps** — pipelines, registries, serving, drift, evaluation
- **SWE** — data structures, algorithms, system design, distributed systems
- **ML Eng** — gradient descent, transformers, training infra, evaluation math
- **FAANG** — interview-grade systems, scaling, behavioral
- **Full-stack** — React, state, APIs, auth, deployment
- **Cyber Security** — threat models, crypto, web/app sec, incident response

~100 lessons across the eight paths today. Lesson rendering supports 15+ block
types — see `docs/lesson-blocks.md`.

Lesson blocks (full schemas in `docs/lesson-blocks.md`):

- `p`, `h3`, `h4` — prose
- `ul`, `ol` — lists
- `code` — syntax-highlighted code with a `lang` tag
- `table` — header / row / align grid
- `terms` — term / definition pairs
- `quote` — pull-quote with optional cite
- `pros-cons` — two-column "good for / watch out for"
- `diagram` — animated SVG flow (5-accent palette)
- `walkthrough` — step-by-step diagram with prev/next
- `sequence` — actor-lane sequence diagram
- `layers` — stacked-band layer diagram
- `compare` — side-by-side option comparison
- `kanban` — column board with cards
- `practice` — inline interactive code editor (Pyodide-powered for Python)

Retention engine — the layer that keeps lessons from evaporating after the
read. Detailed in `docs/retention-engine.md`:

- **Streak** with Weekend Pass forgiveness + manual freeze
- **Free-recall mode** — self-graded recall instead of multiple choice
- **Spaced repetition** — FSRS-flavored scheduler, surfaced on `/reviews`
- **XP + levels** — gain weighted toward tested items, ten-tier curve
- **Badges** — section completions, path tiers, streak milestones
- **CelebrationMoment** — one-shot UI burst on level-up / badge unlock
- **NudgeCard** — forgiveness-framed prompt on the Home screen

## Architecture

```
src/
  main.jsx                  HashRouter + shell, route lazy-loading
  store/
    useStore.js             Zustand store + persist middleware (localStorage)
                            XP, streak, FSRS review queue, badges, scrubbers
  data/
    content.js              PATHS, BACKGROUNDS, badge tiers, path-progress helpers
    beasts.js               species, evolution tiers, level logic
    lessons/                lesson bodies (path-split from the old monolith)
      index.js              aggregator — re-exports each path file as one map
      fundamentals.js
      devops.js
      mlops.js
      swe.js
      mleng.js
      faang.js
      fullstack.js
      cybersec.js
    mathQuizzes.js          per-lesson math quiz banks
  components/
    AnimatedDiagram.jsx     5-accent SVG flow diagram (the canonical look)
    MermaidFlow.jsx         label-fits-text diagram variant
    PracticeBlock.jsx       inline code editor + grading
    CodeEditor.jsx          CodeMirror 6 wrapper, lazy per-lang chunks
    CelebrationMoment.jsx   confetti / level-up / badge burst
    NudgeCard.jsx           forgiveness-framed prompt
    BeastSprite.jsx         companion art from public/beasts manifest
    ... (TabBar, BadgeHex, MathQuiz, ErrorBoundary)
  screens/
    Onboarding.jsx          name + companion pick (first run)
    Home.jsx                streak strip, daily practice, nudge
    Lesson.jsx              page-flow with auto-complete on last page
    Library.jsx             level + path filters, lesson list
    Roadmap.jsx             section-grouped path screen
    Reviews.jsx             FSRS-due cards, self-grade
    ReviewWeakSpots.jsx     quiz-miss replay
    Projects.jsx            buildable labs + design challenges (guided→open ramp)
    ByteBeast.jsx           companion screen, evolution viewer
    Trophies.jsx            badges + paths progress
    Settings.jsx            prefs, themes, backup export/import
  styles/                   per-screen + component CSS
  utils/practiceKey.js      stable key derivation for practice blocks
  i18n/                     locale strings
public/
  beasts/                   sprite PNGs + manifest.json
  manifest.webmanifest      PWA manifest
  sw.js                     service worker (offline fallback)
  offline.html              shown when the network is down
  icon-*.svg, favicon-*.svg PWA icons
tests/
  lesson-schema.test.js     every lesson body validates against block schemas
  store-retention.test.js   streak / FSRS / XP transitions
  build-smoke.test.js       dist/ builds and the entry HTML loads
```

## Tests

```bash
npm test
npm run test:watch
```

Three suites:

- `tests/lesson-schema.test.js` — walks every lesson body and checks every
  block conforms to its expected shape. Catches typos in `type`, missing
  required fields, and unknown accents.
- `tests/store-retention.test.js` — streak transitions (gap=1 / gap>1 /
  weekend pass / freeze), FSRS scheduler intervals, XP gain rules, badge
  idempotency, backup-import scrubbing.
- `tests/build-smoke.test.js` — runs `vite build` and asserts `dist/` ends up
  with a valid entry HTML.

## Build & deploy

```bash
npm run build      # → dist/
npm run preview    # serve dist/ locally
```

Deploys run through GitHub Actions: every push to `main` triggers
`.github/workflows/deploy.yml`, which installs dependencies, runs the test
suite, builds, and publishes `dist/` to GitHub Pages. There is no manual
deploy script — pushing a green `main` is the release.

The Pages site lives at `https://bchocyn.github.io/InfraLearn/`. If the repo
is ever renamed, update every hard-coded spot together: `base` in
`vite.config.js`, `homepage` in `package.json`, the redirect URL in
`public/404.html`, and `id`/`start_url` in `public/manifest.webmanifest`.

## PWA

The app is installable from any modern browser:

- Chrome / Edge desktop: install icon in the URL bar
- iOS Safari: Share → Add to Home Screen
- Android Chrome: menu → Install app

Once installed, it launches standalone (no browser chrome) from the home
screen. The service worker (`public/sw.js`) caches the app shell and falls
back to `offline.html` when the network is unreachable. All state lives in
`localStorage`, so progress is fully usable offline.

## Backup & restore

Settings → Export Backup downloads a JSON of the user's full state. Import
Backup loads one back. Every imported field is run through allow-list
scrubbers (`scrubBoolMap`, `scrubReviewQueue`, etc. in `useStore.js`), so a
hand-edited file can't inject unknown lesson IDs, out-of-range FSRS values,
control characters, or oversized strings.
