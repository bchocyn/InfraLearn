# Agents workflow history

A one-line-per-wave log of which agents shipped what, so the next
maintainer can answer "why is this structured this way?" without spelunking
through git history. Ordered roughly by the wave they landed in.

## Path content waves

- **Fundamentals body wave** — Fundamentals path got every concept lesson
  body (Python, CLI, Git, networking, OS internals). Established the
  block-type vocabulary that every later wave inherited.
- **DevOps body wave** — DevOps path bodies (containers, Kubernetes, CI/CD,
  observability, IaC). Introduced the `lab` block kind for multi-milestone
  exercises and the `sd` (system-design insight row) kind.
- **MLOps body wave** — MLOps path bodies (pipelines, registries, serving,
  drift, evaluation). Locked the `walkthrough` block pattern for
  step-by-step concept visualizers (RAG, training pipeline, drift loop).
- **SWE body wave** — SWE path bodies (data structures, algorithms, system
  design, distributed systems). First wave to push table density up and
  trigger the table-cell auto-coloring rules (✓ / ✗).
- **ML Eng body wave** — ML Eng path bodies (gradient descent, transformers,
  training infra, math). Added math-quiz integration on `hasMathQuiz: true`
  lessons.
- **FAANG body wave** — FAANG path bodies (interview-grade systems,
  scaling, behavioral). Established the system-design lesson template.
- **Full-stack body wave** — Full-stack path bodies (React, state, APIs,
  auth, deployment). First path to lean heavily on the `practice` block.
- **Cyber Security body wave** — Cyber security path bodies (threat models,
  crypto, web/app sec, incident response). Latest content wave.

## Block type additions

- **Core blocks shipped early** — `p`, `h3`, `h4`, `ul`, `ol`, `code`,
  `table`, `terms`, `quote` landed with the Fundamentals wave as the base
  schema. `tests/lesson-schema.test.js` was added alongside them.
- **`pros-cons` agent** — added the two-column "good for / watch out for"
  callout with overridable labels.
- **`diagram` agent** — shipped `AnimatedDiagram.jsx` and the 5-accent
  palette (amber/fire/water/earth/sky). Locked the canonical look:
  accent-colored borders, mono-uppercase subtitle below the box, edge
  labels in cream pills above the line, text-fit width, no scroll. See
  the `feedback_diagram_aesthetic.md` memory entry.
- **`walkthrough` agent** — step-by-step diagram with prev/next nav,
  per-step `activeNodes` + `activeEdges`, optional `why` coda panel on
  the final step.
- **`sequence` agent** — actor-lane sequence diagram with `return`
  arrow kind for round-trips.
- **`layers` agent** — stacked-band layer diagram for OSI / stack
  visualizations.
- **`compare` agent** — side-by-side option comparison with per-column
  accent.
- **`kanban` agent** — column board with cards, for workflow / lifecycle
  lessons.
- **`practice` agent** — inline code editor block. Shipped `PracticeBlock.jsx`,
  `CodeEditor.jsx` (CodeMirror 6 wrapper with lazy per-lang chunks), and the
  Pyodide-backed Python runtime. Languages: `python` (runnable), `bash`,
  `yaml`, `sql`, `dockerfile`, `json` (syntax-only).
- **MathQuiz agent** — `MathQuiz.jsx` + `mathQuizzes.js` bank. Per-lesson
  quiz banks gated by the `hasMathQuiz` flag in `content.js`.

## Architecture refactors

- **Lesson content split** — the legacy monolithic `src/data/lessonContent.js`
  was split into per-path files under `src/data/lessons/*.js`, aggregated by
  `src/data/lessons/index.js`. Made the path content waves possible without
  merge-conflict pain.
- **Lazy-loading wave** — route-level code splitting in `main.jsx`, lazy
  per-language CodeMirror chunks, lazy Pyodide load on first practice run.
  Brought the cold-start bundle under the size that matters for mobile.
- **Backup scrubber pass** — every imported field in `useStore.js` is now
  run through an allow-list scrubber (`scrubBoolMap`, `scrubReviewQueue`,
  `scrubBeastTiers`, `scrubLabMilestones`, `scrubQuizMisses`). A
  hand-edited backup can't inject unknown lesson IDs, out-of-range FSRS
  values, control characters, or oversized strings.
- **Retention engine wave** — streak (Weekend Pass + manual freeze),
  free-recall mode, FSRS-flavored scheduler with the `/reviews` screen,
  XP + level curve, badge schema, CelebrationMoment, NudgeCard. All in
  `useStore.js` with `tests/store-retention.test.js` next to it.
- **PWA wave** — `public/sw.js`, `public/offline.html`,
  `public/manifest.webmanifest`, installability prompt
  (`InstallPrompt.jsx`), icon set. Installable on every modern browser,
  offline fallback when the network is unreachable.
- **Sandbox tab agent** — multi-language scratchpad in `Sandbox.jsx` with
  a challenge bank from `sandboxChallenges.js`. Reuses the same
  `CodeEditor` + Pyodide runtime as `practice` blocks.
- **Byte Beast system** — sprites + manifest in `public/beasts/`, evolution
  matrix per (species × path), evolution viewer, unlockable backgrounds in
  `BACKGROUNDS`. Separate from retention but threaded through the same
  `recomputeEvolution` / `recomputeBackgrounds` calls.

## Memory rules locked

These were locked by user feedback during the waves above and live in the
auto-memory file. Every new agent must respect them:

- **ADHD-friendly design (load-bearing)** — short chunks, visible
  progress, one CTA, immediate feedback, smart defaults. Top-level
  constraint on every UI/content decision.
- **Mockup picks (rounds 1/2/3)** — lesson Option B header, auto-complete
  on last page, lab prereq enforcement, diagram responsiveness, SD
  inline, math quiz, ML analogies, sectioned roadmap.
- **Code-example comment style** — every non-obvious line gets a short
  trailing `# what / why / gotcha`. Two spaces before `#`.
- **No personal names** — never use the author's name, email, or anyone
  real in lesson content. Use generic English names (Ada, Alex, Sam,
  Maya, Liam, etc.) or `user@example.com`.
- **Diagram aesthetic locked** — the MermaidFlow look the user confirmed
  twice (HARDENED BUILD PIPELINE + PIPELINE FLOW). Accent-colored
  borders, mono-uppercase subtitle below the box, edge labels above the
  line in cream pills, text-fit width, single contained box, no scroll.
- **Mobile UX principles** — operational playbook for spacing scale,
  touch targets, transitions, cognitive load, code-block density,
  diagram bail-out rules. Combine with the frontend skill before
  designing any UI.
- **No marketing copy** — the project description rule is "just
  InfraLearn." No taglines, no "ADHD-friendly" or "gamified" in
  user-facing copy. The internal design principle is fine to cite in
  technical docs.
