# Lesson block authoring guide

Every lesson body in `src/data/lessons/*.js` is a list of `sections`. Each
section has a `heading` and a `body` — an ordered array of **blocks**. A
block is a plain JSON object with a `type` field and the per-type fields
described below.

A new block type starts in `src/screens/Lesson.jsx` (the `Block` switch) and
gets a schema test in `tests/lesson-schema.test.js`. Adding a block here
without those two updates will silently no-op in the renderer.

## House rules

- **No personal names.** Use generic English first names (Ada, Alex, Sam,
  Maya, Liam, Priya, Mei, Jordan) or `user@example.com`. Never reference
  the author, their email, or anyone real.
- **Comments are load-bearing.** Every non-obvious line in a `code` /
  `practice` block gets a short trailing `# what / why / gotcha` comment.
  Section headers alone are not enough — the per-line note is what makes
  the example readable on first pass.
- **Two-space comment gap.** Write trailing comments as `code  # comment`
  with **exactly two spaces** before `#`. The lesson CSS aligns on this.
- **Inline markdown.** `**bold**`, `*italic*`, and `` `code` `` work inside
  any string field that goes through `renderInline` (prose, list items,
  table cells, term defs, quote text).

## Diagram accent palette

Five accents available to `diagram`, `walkthrough`, `sequence`, `compare`,
`layers`, and `kanban` blocks. Pick by semantic role, not by aesthetics —
consistency across lessons is what makes them readable.

| accent  | CSS var             | Use for                                              |
|---------|---------------------|------------------------------------------------------|
| `amber` | `--accent-amber`    | Default / focal node / current step                  |
| `fire`  | `--el-fire`         | Destructive, deploy, alert, output                   |
| `water` | `--el-water`        | Source, ingress, push, user input                    |
| `earth` | `--el-earth`        | Storage, build artifact, registry, success           |
| `sky`   | `--el-sky`          | Compute, transform, test, intermediate stage         |

## Block reference

### `p` — paragraph

```js
{ type: 'p', text: 'Inline **markdown** and `code` work here.' }
```

### `h3` / `h4` — sub-headings

The section's own `heading` renders as h2. Use h3/h4 only for sub-divisions
inside a section.

```js
{ type: 'h3', text: 'The default-arg trap' }
{ type: 'h4', text: 'When you really need a sentinel' }
```

### `ul` — unordered list

```js
{ type: 'ul', items: [
  'Mutable defaults are evaluated once at def time',
  'Use `None` as a sentinel and create the real default inside',
] }
```

### `ol` — ordered list

```js
{ type: 'ol', items: [
  'Write the failing test first',
  'Make it pass with the smallest change',
  'Refactor with the test still green',
] }
```

### `code` — code block

```js
{ type: 'code', lang: 'python', text:
  'def good(item, bucket=None):\n' +
  '    if bucket is None:  # fresh list per call\n' +
  '        bucket = []\n' +
  '    bucket.append(item)\n' +
  '    return bucket'
}
```

`lang` accepts `python`, `bash`, `yaml`, `sql`, `dockerfile`, `json`. Unknown
values render as plain monospace.

### `table` — data table

```js
{ type: 'table',
  headers: ['Type', 'Mutable?', 'Why it matters'],
  rows: [
    ['`int`',  '✗', 'Hashable, safe as defaults'],
    ['`list`', '✓', 'Aliasing bugs — copies share contents'],
  ],
  align: ['left', 'center', 'left'],
}
```

Cells containing only `✓` / `✗` auto-color to earth/fire. Inline markdown
works in every cell.

### `terms` — term/definition list

```js
{ type: 'terms', items: [
  { term: 'Idempotent', def: 'Same input → same effect, every time.' },
  { term: 'Stateless',  def: 'No memory of past requests.' },
] }
```

### `quote` — pull-quote

```js
{ type: 'quote',
  text: 'The cheapest test is the one you didn\'t need to write.',
  cite: 'Anonymous' }
```

`cite` is optional. Use sparingly — one quote per lesson, max.

### `pros-cons` — two-column callout

```js
{ type: 'pros-cons',
  good:  ['Cheap to reason about', 'Easy to test'],
  watch: ['Hard to scale past one machine'],
  goodLabel: 'GOOD FOR',
  watchLabel: 'WATCH OUT FOR',
}
```

Labels default to `GOOD FOR` / `WATCH OUT FOR`. Override for "PICK WHEN /
SKIP WHEN" or similar pairs.

### `diagram` — static animated flow

```js
{ type: 'diagram', title: 'The standard pipeline', height: 220,
  nodes: [
    { id: 'push',  label: 'push',  subtitle: 'git → main', accent: 'water', x: 0.05, y: 0.5 },
    { id: 'build', label: 'build', subtitle: 'docker',     accent: 'earth', x: 0.50, y: 0.5 },
  ],
  edges: [
    { from: 'push', to: 'build', kind: 'dashed', label: 'trigger' },
  ],
}
```

`x` / `y` are proportional (0..1) inside the SVG. Edge `kind` is `solid` |
`dashed`. Optional `caption` renders below the box.

### `walkthrough` — step-by-step

```js
{ type: 'walkthrough', title: 'OAuth dance', why: 'Tokens never touch the client',
  nodes: [/* same shape as diagram nodes */],
  steps: [
    { title: 'Redirect',  description: 'User bounces to provider',
      activeNodes: ['client'], activeEdges: ['client->provider'] },
    { title: 'Consent',   description: 'User clicks Allow',
      activeNodes: ['provider'], activeEdges: [] },
  ],
}
```

The last step shows the `why` coda panel if set.

### `sequence` — actor lanes

```js
{ type: 'sequence',
  actors: [
    { id: 'user', label: 'User',   accent: 'water' },
    { id: 'api',  label: 'API',    accent: 'sky' },
    { id: 'db',   label: 'DB',     accent: 'earth' },
  ],
  messages: [
    { from: 'user', to: 'api', label: 'POST /order' },
    { from: 'api',  to: 'db',  label: 'INSERT' },
    { from: 'db',   to: 'api', label: 'ok', kind: 'return' },
  ],
}
```

`kind: 'return'` draws a dashed arrow back.

### `layers` — stacked bands

```js
{ type: 'layers', title: 'OSI in five',
  layers: [
    { label: 'L7  HTTP',  subtitle: 'apps',     accent: 'amber' },
    { label: 'L4  TCP',   subtitle: 'sessions', accent: 'sky'   },
    { label: 'L3  IP',    subtitle: 'routing',  accent: 'earth' },
  ],
}
```

### `compare` — side-by-side

```js
{ type: 'compare', title: 'SQL vs document',
  columns: [
    { label: 'Postgres', accent: 'sky',
      rows: ['ACID', 'Joins free', 'Schema enforced'] },
    { label: 'Mongo',    accent: 'fire',
      rows: ['Flexible docs', 'Joins manual', 'Schema by convention'] },
  ],
}
```

### `kanban` — column board

```js
{ type: 'kanban',
  columns: [
    { label: 'TODO',  accent: 'water',
      cards: [{ title: 'Spec the endpoint', note: 'OpenAPI first' }] },
    { label: 'DOING', accent: 'amber',
      cards: [{ title: 'Wire the handler' }] },
    { label: 'DONE',  accent: 'earth',
      cards: [{ title: 'Schema migration' }] },
  ],
}
```

### `practice` — inline code editor

```js
{ type: 'practice', lang: 'python',
  prompt: 'Make `total` equal to the sum of every even number in `nums`.',
  starter:
    'nums = [1, 2, 3, 4, 5, 6]\n' +
    'total = 0  # TODO\n',
  check: { kind: 'value', varName: 'total', expected: 12 },
}
```

`lang` accepts the same set as `code`: `python`, `bash`, `yaml`, `sql`,
`dockerfile`, `json`. Only `python` runs in-browser today (Pyodide is
fetched on first use). `check.kind` is `value` for "var equals X" or
`stdout` for "printed text contains X".

### `build-along` — guided real-terminal walkthrough

The blessed hands-on pattern: real commands the learner runs in THEIR OWN
terminal/VS Code (the app never embeds an editor; the Python `practice` cell
is the single exception).

```js
{ type: 'build-along', title: 'Create the project', lang: 'bash', file: 'terminal',
  goal: 'A fresh folder with git history. Run each line as you click through.',
  steps: [
    { title: 'Make the folder',
      say: 'One project per directory — mixing them is how chaos starts.',
      add: 'mkdir app && cd app  # && chains only on success' },
  ],
}
```

### `explain-back` — Synthesis Challenge (commit-then-reveal)

Read-only integration prompt + model answer. The `commit` field is REQUIRED
on new blocks: a forced choice the learner must answer before the reveal
unlocks (XP pays only on a correct commit).

```js
{ type: 'explain-back',
  prompt: 'Walk a teammate through …',
  modelAnswer: 'REQUIRED — the strong answer revealed after committing.',
  hint: 'optional 1-line nudge',
  commit: {
    q: 'Which component fails FIRST under load?',
    opts: ['the cache', 'the database', 'the load balancer'],
    answer: 1,
    why: '1-2 sentences — a nudge, never the full model answer.',
  },
}
```

### `system-design-lab` — phased checklist + reflection (persisted)

Phases persist per-learner via the store's `labProgress` (checkboxes +
reflection textarea + completion stamp).

**Debrief convention (capstones):** every capstone lesson ends with a
`system-design-lab` block used as a RUBRIC — `id: '<lessonId>-debrief'`,
`title: 'Debrief: grade your build'`, each phase = one rubric criterion
(`prompt` = the check, e.g. "Does it survive a restart without losing
data?", `reference` = what a strong implementation does), and `reflection`
prompting "What would you do differently?". Self-checked, honestly framed —
it's the closure that makes finishing a project mean something.

## Question-bank conventions (src/data/dailyQuestions.js)

- **MCQ**: `{ q, opts: [3], answer: 0-2, whyWrong: {i: …}, whyCorrect,
  bestPractices, lessonId? }`. Balance answer positions; the correct option
  must not be systematically the longest (gated by tests).
- **Cloze**: an MCQ whose stem contains a `____` blank (3+ underscores); the
  options are candidate fills. Rendered with a styled blank that fills with
  the correct answer after the pick. Inline `` `code` `` in any stem renders
  monospace (find-the-bug stems quote real code).
- **Order**: `{ kind: 'order', q, items: [3-6 in CORRECT order], whyWrong,
  whyCorrect, bestPractices, lessonId? }` — presentation shuffles per mount.
- **Parsons problem**: an order question with `code: true` — items are CODE
  LINES (indentation preserved, rendered monospace). The strongest practice
  format for program structure; prefer it wherever a concept IS a sequence
  of code.
- `lessonId` tags a question to the lesson it teaches — reviews prefer exact
  tags, weak spots file under the real lesson. Tag everything taggable.

## Lesson-body extras

- `objectives: [2-4 strings]` at the body root — rendered as "AFTER THIS YOU
  CAN" atop the first page. Write outcomes ("read a traceback bottom-up"),
  not topics ("learn about tracebacks").
- Per-section `takeaway: '<one sentence>'` — the "☝ THE ONE THING" chip; the
  spine a skimmer keeps.
- Per-section `deep: true` — collapses the section's body behind "Go deeper ▸"
  (nice-to-know material; the core path must read complete without it).
- `PATHS[key].outcomes: [strings]` in content.js — the path-level "by the end
  you can" list shown on the un-started trail's preview card.
