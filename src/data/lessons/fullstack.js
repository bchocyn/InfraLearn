export default {
  "fs-html-structure": {
    "sections": [
      {
        "heading": "Tags carry meaning",
        "body": [
          {
            "type": "p",
            "text": "**HTML is the skeleton, not the paint.** Every tag you choose tells the browser, screen readers, and search crawlers *what this thing is* — a heading, a list, a navigation region. Pick the wrong tag and assistive tech sees soup."
          },
          {
            "type": "p",
            "text": "A page made of `<div>` and `<span>` *looks* identical to one made of `<header>`, `<main>`, and `<article>`. But only the second one is **navigable** for a blind user and **rankable** for Google. Semantics is a contract."
          },
          {
            "type": "walkthrough",
            "title": "How the accessibility tree builds",
            "why": "Get the markup right and the spoken experience builds itself — bad tags poison every layer downstream.",
            "nodes": [
              { "id": "html",  "label": "HTML",       "subtitle": "raw markup",    "accent": "amber", "x": 0.10, "y": 0.5 },
              { "id": "dom",   "label": "DOM",        "subtitle": "parsed tree",   "accent": "sky",   "x": 0.36, "y": 0.5 },
              { "id": "a11y",  "label": "a11y tree",  "subtitle": "roles + names", "accent": "water", "x": 0.30, "y": 0.85 },
              { "id": "sr",    "label": "Screen Reader", "subtitle": "spoken output", "accent": "fire", "x": 0.70, "y": 0.85 }
            ],
            "steps": [
              {
                "title": "You write the HTML",
                "description": "Everything starts with your **markup** — the tags you choose are the only signal the rest of the chain ever gets.",
                "activeNodes": ["html"],
                "activeEdges": []
              },
              {
                "title": "Browser parses it into the DOM",
                "description": "The browser reads your HTML and builds the **DOM**, a live tree of nodes it can render and script.",
                "activeNodes": ["html", "dom"],
                "activeEdges": [{ "from": "html", "to": "dom", "label": "parse" }]
              },
              {
                "title": "It derives the accessibility tree",
                "description": "From the DOM the browser computes the **a11y tree** — each node's `role` and accessible name. A `<div onClick>` has neither.",
                "activeNodes": ["dom", "a11y"],
                "activeEdges": [{ "from": "dom", "to": "a11y", "label": "derive" }]
              },
              {
                "title": "The screen reader speaks it",
                "description": "Assistive tech walks the a11y tree and reads it aloud. \"Navigation, 4 items\" only happens if a real `<nav>` made it this far.",
                "activeNodes": ["a11y", "sr"],
                "activeEdges": [{ "from": "a11y", "to": "sr", "label": "speak" }]
              }
            ]
          }
        ]
      },
      {
        "heading": "Landmarks beat divs",
        "body": [
          {
            "type": "p",
            "text": "**Landmark elements** are the navigational scaffolding of a page. A screen reader user can jump straight to `<nav>` or `<main>` with one keystroke. None of that works if everything is a `<div>`."
          },
          {
            "type": "table",
            "headers": ["Use", "Instead of", "Why"],
            "rows": [
              ["`<header>`", "`<div class=\"header\">`", "Exposes a `banner` role for SR jump"],
              ["`<nav>`",    "`<div class=\"nav\">`",    "Reader announces 'navigation, 4 items'"],
              ["`<main>`",   "`<div id=\"main\">`",      "Skip-link target; one per page"],
              ["`<button>`", "`<div onClick>`",          "Free keyboard + focus + Enter/Space"]
            ]
          },
          {
            "type": "code",
            "lang": "html",
            "text": "<!-- BAD — looks fine, screen reader hears nothing structural -->\n<div class=\"top\">  <!-- no role  no landmark -->\n  <div class=\"links\">Home About</div>  <!-- not a nav -->\n</div>\n\n<!-- GOOD — same pixels, real semantics -->\n<header>  <!-- becomes the 'banner' landmark -->\n  <nav aria-label=\"Primary\">  <!-- labelled so SR distinguishes multiple navs -->\n    <a href=\"/\">Home</a>  <!-- anchor  not a div with onClick -->\n    <a href=\"/about\">About</a>\n  </nav>\n</header>\n<main>  <!-- exactly one per page  the skip-link target -->\n  <h1>Welcome</h1>  <!-- one h1  outline starts here -->\n</main>"
          }
        ]
      },
      {
        "heading": "Headings are an outline",
        "body": [
          {
            "type": "p",
            "text": "**Headings build a document outline.** Skipping levels (h1 → h4) breaks the outline the same way skipping chapter numbers would. Use them by *meaning*, not by font size."
          },
          {
            "type": "pros-cons",
            "goodLabel": "GOOD FOR",
            "watchLabel": "WATCH OUT FOR",
            "good": [
              "One `<h1>` per page describing the whole document",
              "`<button>` for actions, `<a href>` for navigation",
              "`<label for=\"id\">` wrapping every form input",
              "`alt=\"\"` on decorative images so SR skips them"
            ],
            "watch": [
              "Picking heading levels by font size — that's CSS's job",
              "`<div onClick>` — no keyboard, no focus, no role",
              "`<i class=\"icon\">` without an `aria-label` — silent button",
              "Tab order driven by `tabindex=\"5\"` — fight the DOM order, lose"
            ]
          },
          {
            "type": "practice",
            "lang": "json",
            "prompt": "Sketch the attribute set for an accessible primary nav element.",
            "starter": "{\n  \"element\": \"nav\",\n  \"attributes\": {\n    \"aria-label\": \"Primary\",\n    \"role\": null\n  },\n  \"children\": [\n    { \"element\": \"a\", \"href\": \"/\", \"text\": \"Home\" },\n    { \"element\": \"a\", \"href\": \"/about\", \"text\": \"About\" }\n  ]\n}\n",
            "hint": "Native `<nav>` already implies role=navigation — adding it explicitly is redundant. The `aria-label` is what disambiguates two navs on the same page."
          },
          {
            "type": "quote",
            "text": "If you can navigate the page with the Tab key, ship it. If you can't, the markup is wrong.",
            "cite": "the keyboard test"
          }
        ]
      }
    ]
  },
  "fs-css-layout": {
    "sections": [
      {
        "heading": "Every box is four rectangles",
        "body": [
          {
            "type": "p",
            "text": "**Every element on a page is four nested rectangles**: content, padding, border, margin. Open DevTools, hover any node, and you'll see them lit up in four colors. Misread the diagram and your spacing will fight you forever."
          },
          {
            "type": "diagram",
            "title": "The CSS box model",
            "height": 260,
            "nodes": [
              { "id": "margin",  "label": "margin",  "subtitle": "outside",      "accent": "amber", "x": 0.30, "y": 0.5 },
              { "id": "border",  "label": "border",  "subtitle": "edge",         "accent": "fire",  "x": 0.70, "y": 0.5 },
              { "id": "padding", "label": "padding", "subtitle": "inside",       "accent": "earth", "x": 0.30, "y": 0.9 },
              { "id": "content", "label": "content", "subtitle": "text",         "accent": "sky",   "x": 0.70, "y": 0.9 }
            ],
            "edges": [
              { "from": "margin",  "to": "border",  "kind": "solid", "label": "wraps" },
              { "from": "border",  "to": "padding", "kind": "solid", "label": "wraps" },
              { "from": "padding", "to": "content", "kind": "solid", "label": "wraps" }
            ]
          },
          {
            "type": "p",
            "text": "**Default sizing is treacherous.** With `box-sizing: content-box` (the legacy default), `width: 300px` means *content* is 300px and padding/border push the total out. Set `box-sizing: border-box` globally and `width` becomes the total — what you actually wanted."
          }
        ]
      },
      {
        "heading": "Flex vs grid: pick by axis",
        "body": [
          {
            "type": "p",
            "text": "**Flexbox is one-dimensional.** Use it when items flow along a single axis — a nav bar, a button row, a stack of cards. **Grid is two-dimensional.** Use it when you need rows *and* columns to align across the whole container — a dashboard, a magazine layout."
          },
          {
            "type": "table",
            "headers": ["Need", "Reach for", "Why"],
            "rows": [
              ["Nav row that wraps",        "`flex`", "1D flow, content-sized items"],
              ["12-column page layout",     "`grid`", "2D, declarative tracks"],
              ["Center a single child",     "`flex`", "`place-items: center` in 2 lines"],
              ["Cards aligned in rows AND cols", "`grid`", "Flex can't align across rows"]
            ]
          },
          {
            "type": "code",
            "lang": "css",
            "text": "/* Flex — one axis, content-sized children */\n.toolbar {\n  display: flex;  // children become flex items on the main axis\n  gap: 12px;  // modern replacement for margin between items\n  align-items: center;  // cross-axis: vertical when row\n  justify-content: space-between;  // main-axis distribution\n}\n\n/* Grid — two axes, declarative tracks */\n.dashboard {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));  // responsive without media queries\n  gap: 16px;  // gaps work in both axes\n}\n\n/* Box model: opt into the sane default once, globally */\n*, *::before, *::after { box-sizing: border-box; }  // width includes padding+border"
          }
        ]
      },
      {
        "heading": "The pitfalls that bite",
        "body": [
          {
            "type": "pros-cons",
            "goodLabel": "GOOD FOR",
            "watchLabel": "WATCH OUT FOR",
            "good": [
              "`gap` works in both flex and grid — no margin hacks",
              "`minmax(220px, 1fr)` makes responsive grids without breakpoints",
              "`align-self` on a single child overrides the container's rule",
              "DevTools' grid overlay shows track names and line numbers"
            ],
            "watch": [
              "**Margin collapse** — vertical margins between block siblings merge into the larger one",
              "**Percentage heights** need a parent with an explicit height or they compute to 0",
              "`flex: 1` shorthand sets `flex-basis: 0` — items shrink past their content",
              "`grid-template-columns: 1fr 1fr` can overflow because `1fr` ignores content width"
            ]
          },
          {
            "type": "quote",
            "text": "Flex for components, grid for layouts. When you're not sure, you probably want grid.",
            "cite": "the one-axis rule"
          }
        ]
      }
    ]
  },
  "fs-js-essentials": {
    "sections": [
      {
        "heading": "Values, scopes, and closures",
        "body": [
          {
            "type": "p",
            "text": "**JavaScript has three variable keywords**: `var` (function-scoped, hoisted, avoid), `let` (block-scoped, reassignable), and `const` (block-scoped, not reassignable — but the *value* can still mutate if it's an object). Use `const` by default, `let` when you must rebind."
          },
          {
            "type": "p",
            "text": "**A closure** is a function that remembers the variables from where it was *defined*, not where it's called. This is how event handlers retain state, how factories work, and how 90% of stale-state bugs in React start."
          },
          {
            "type": "code",
            "lang": "javascript",
            "text": "// Closures — the function keeps a live link to `count`\nfunction makeCounter() {\n  let count = 0;  // local to makeCounter  outlives the call\n  return () => ++count;  // inner fn closes over `count`\n}\nconst tick = makeCounter();\ntick();  // 1\ntick();  // 2 — same `count`, not a new one\n\n// const guards the BINDING, not the value\nconst user = { name: 'Ada' };\nuser.name = 'Grace';  // legal — object is mutable\n// user = {}  // TypeError — can't rebind the const\n\n// var hoists in surprising ways — never use it in new code\nfunction trap() {\n  console.log(x);  // undefined  not ReferenceError\n  var x = 1;  // declaration hoisted  assignment is not\n}"
          }
        ]
      },
      {
        "heading": "Async, fetch, and JSON",
        "body": [
          {
            "type": "p",
            "text": "**Async/await is syntactic sugar over Promises.** A `Promise` is a placeholder for a value that arrives later. `await` pauses the function until the Promise settles, but the runtime keeps doing other work — it's not blocking, just suspending."
          },
          {
            "type": "diagram",
            "title": "What happens during await",
            "height": 240,
            "nodes": [
              { "id": "call",   "label": "fetch()",    "subtitle": "kicks off",   "accent": "amber", "x": 0.30, "y": 0.5 },
              { "id": "net",    "label": "Network",    "subtitle": "in flight",   "accent": "water", "x": 0.70, "y": 0.5 },
              { "id": "queue",  "label": "Microtask",  "subtitle": "resolved",    "accent": "fire",  "x": 0.30, "y": 0.85 },
              { "id": "resume", "label": "Resume",     "subtitle": "continues",   "accent": "sky",   "x": 0.70, "y": 0.85 }
            ],
            "edges": [
              { "from": "call",  "to": "net",    "kind": "solid",  "label": "send" },
              { "from": "net",   "to": "queue",  "kind": "dashed", "label": "200 OK" },
              { "from": "queue", "to": "resume", "kind": "solid",  "label": "tick" }
            ]
          },
          {
            "type": "code",
            "lang": "javascript",
            "text": "// The minimum-viable fetch — always check ok, always handle errors\nasync function loadUser(id) {\n  const res = await fetch(`/api/users/${id}`);  // pauses here  not blocks\n  if (!res.ok) throw new Error(`HTTP ${res.status}`);  // fetch only rejects on network failure  401/500 do NOT throw\n  return res.json();  // returns a Promise too  await consumes it\n}\n\ntry {\n  const user = await loadUser(42);  // top-level await works in modules\n  console.log(user.name);\n} catch (err) {\n  console.error('Load failed:', err);  // one catch covers network AND parse errors\n}"
          }
        ]
      },
      {
        "heading": "The vocabulary checklist",
        "body": [
          {
            "type": "table",
            "headers": ["Construct", "What it does", "When to reach"],
            "rows": [
              ["`map` / `filter` / `reduce`", "Transform arrays without loops", "90% of array work"],
              ["Destructuring",               "`const { name } = user`",        "Pull fields out cleanly"],
              ["Spread `...`",                "Copy + extend objects/arrays",   "Immutable updates"],
              ["Optional chaining `?.`",      "Safe deep reads",                "API responses, nested data"]
            ]
          },
          {
            "type": "pros-cons",
            "goodLabel": "GOOD FOR",
            "watchLabel": "WATCH OUT FOR",
            "good": [
              "Arrow functions inherit `this` — no more `bind` dance",
              "`===` always — never use loose `==`, it coerces silently",
              "`for...of` for iterables, `for...in` only for plain object keys",
              "`Promise.all([a, b])` runs in parallel; awaiting each runs serial"
            ],
            "watch": [
              "`typeof null` is `'object'` — a 1995 bug that's now load-bearing",
              "`[] + []` is `''` and `[] + {}` is `'[object Object]'` — don't ask",
              "Closures capture variables *by reference* — loop counters bite",
              "`async` always returns a Promise — even `return 1` becomes `Promise<1>`"
            ]
          },
          {
            "type": "quote",
            "text": "JavaScript is the only language people feel they don't need to learn before using.",
            "cite": "Douglas Crockford, paraphrased"
          }
        ]
      }
    ]
  },
  "fs-dom-events": {
    "sections": [
      {
        "heading": "The DOM is a live tree",
        "body": [
          {
            "type": "p",
            "text": "**The DOM is a tree of nodes the browser maintains in memory.** Every tag becomes an element node; text becomes a text node. JavaScript mutates the tree, the browser re-renders. Slow code = touching the tree too often."
          },
          {
            "type": "p",
            "text": "**Querying is fast; mutating is not.** Read all the values you need first, *then* write — batch your changes to avoid layout thrash. The browser tries to coalesce updates, but it can't if you read-write-read-write."
          },
          {
            "type": "diagram",
            "title": "Event bubble vs capture",
            "height": 260,
            "nodes": [
              { "id": "window", "label": "window", "subtitle": "top of the tree",   "accent": "sky",   "x": 0.50, "y": 0.10 },
              { "id": "parent", "label": "<ul>",   "subtitle": "list container",    "accent": "earth", "x": 0.50, "y": 0.45 },
              { "id": "child",  "label": "<li>",   "subtitle": "the clicked item",  "accent": "amber", "x": 0.50, "y": 0.80 }
            ],
            "edges": [
              { "from": "window", "to": "parent", "kind": "dashed", "label": "capture" },
              { "from": "parent", "to": "child",  "kind": "dashed", "label": "capture" },
              { "from": "child",  "to": "parent", "kind": "solid",  "label": "bubble" },
              { "from": "parent", "to": "window", "kind": "solid",  "label": "bubble" }
            ]
          }
        ]
      },
      {
        "heading": "Delegation: one listener, many targets",
        "body": [
          {
            "type": "p",
            "text": "**Event delegation** attaches *one* listener to a parent instead of N listeners on every child. Because events bubble, the parent sees them all — and `event.target` tells you which child fired. This scales to thousands of items with zero extra memory."
          },
          {
            "type": "code",
            "lang": "javascript",
            "text": "// BAD — N listeners, N teardowns, N leaks if you forget\ndocument.querySelectorAll('.row').forEach((row) => {\n  row.addEventListener('click', handle);  // one per row  scales linearly\n});\n\n// GOOD — one listener at the table level, delegates to rows\ndocument.querySelector('#rows').addEventListener('click', (e) => {\n  const row = e.target.closest('.row');  // walks up until match  null if outside\n  if (!row) return;  // click landed on padding  ignore\n  handle(row.dataset.id);  // dataset reads `data-id` attribute  string only\n});\n\n// Batching writes — read first, then write\nconst widths = items.map((el) => el.offsetWidth);  // forces layout once\nitems.forEach((el, i) => { el.style.width = widths[i] + 'px'; });  // pure writes  no thrash"
          },
          {
            "type": "table",
            "headers": ["Phase", "Order", "Use when"],
            "rows": [
              ["Capture",   "window → target", "Intercept before any child sees it"],
              ["Target",    "the clicked node", "Default — your handler runs"],
              ["Bubble",    "target → window", "Delegation, analytics, modal-close-on-outside"],
              ["`stopPropagation`", "halts both", "Rare — usually a smell"]
            ]
          }
        ]
      },
      {
        "heading": "Watch out for",
        "body": [
          {
            "type": "pros-cons",
            "goodLabel": "GOOD FOR",
            "watchLabel": "WATCH OUT FOR",
            "good": [
              "`addEventListener` over `onclick=` — composable, removable, options",
              "`{ passive: true }` on scroll/touch listeners — frees the compositor",
              "`AbortController` to cancel a whole group of listeners at once",
              "`closest('.selector')` over manual parent-walking loops"
            ],
            "watch": [
              "Memory leaks from listeners that close over big objects — `removeEventListener` needs the *same* reference",
              "`event.stopPropagation()` breaks delegation higher up — surprising at scale",
              "Reading `offsetWidth` inside a write loop forces synchronous layout each iteration",
              "Inline `onClick={...}` in JSX creates a new function every render — fine, but don't add `useCallback` until profiling says so"
            ]
          },
          {
            "type": "quote",
            "text": "One listener at the root beats a thousand at the leaves.",
            "cite": "the delegation rule"
          }
        ]
      }
    ]
  },
  "fs-react-intro": {
    "sections": [
      {
        "heading": "UI = function(state)",
        "body": [
          {
            "type": "p",
            "text": "**React's whole pitch is one equation: UI is a pure function of state.** You describe what the screen should look like *given the current state*, and React figures out the DOM mutations to get there. You stop thinking in `appendChild` and start thinking in returns."
          },
          {
            "type": "p",
            "text": "A **component** is a function that returns JSX. JSX *looks* like HTML but compiles to function calls. The component is reusable; the JSX is what it currently wants to show."
          },
          {
            "type": "diagram",
            "title": "Render pipeline",
            "height": 240,
            "nodes": [
              { "id": "state",  "label": "state",   "subtitle": "the truth",       "accent": "amber", "x": 0.30, "y": 0.5 },
              { "id": "comp",   "label": "Component", "subtitle": "pure function", "accent": "fire",  "x": 0.70, "y": 0.5 },
              { "id": "vdom",   "label": "Virtual DOM", "subtitle": "diff target", "accent": "sky",   "x": 0.30, "y": 0.85 },
              { "id": "dom",    "label": "Real DOM",   "subtitle": "browser paints", "accent": "earth", "x": 0.70, "y": 0.85 }
            ],
            "edges": [
              { "from": "state", "to": "comp", "kind": "solid",  "label": "input" },
              { "from": "comp",  "to": "vdom", "kind": "solid",  "label": "returns" },
              { "from": "vdom",  "to": "dom",  "kind": "dashed", "label": "reconcile" }
            ]
          }
        ]
      },
      {
        "heading": "Props, JSX, composition",
        "body": [
          {
            "type": "p",
            "text": "**Props are the inputs.** They flow *down* from parent to child, never up. A child can't mutate its props — it asks the parent (via a callback prop) to change *its* state, which triggers a re-render with new props."
          },
          {
            "type": "p",
            "text": "**A component is a function that returns JSX.** Props arrive as the first argument; the braces inside JSX embed any JS expression."
          },
          {
            "type": "code",
            "lang": "jsx",
            "text": "// A component is just a function that returns JSX\nfunction Avatar({ name, size = 40 }) {  // size has a default\n  // JSX braces let you embed any JS expression\n  const initials = name.split(' ').map(p => p[0]).join('');  // 'Ada Lovelace' -> 'AL'\n  return (\n    <div\n      className=\"avatar\"  // className  not class  (class is reserved in JS)\n      style={{ width: size, height: size }}  // double braces: outer JSX  inner object\n    >\n      {initials}  {/* embed JS inside JSX with single braces */}\n    </div>\n  );\n}"
          },
          {
            "type": "p",
            "text": "**Composition with `children`** — a special prop that holds whatever JSX the parent nested inside. Combine two components and the parent owns the data."
          },
          {
            "type": "code",
            "lang": "jsx",
            "text": "// Composition — pass JSX as `children`\nfunction Card({ title, children }) {  // children is a special prop\n  return (\n    <section className=\"card\">\n      <h3>{title}</h3>\n      {children}  {/* whatever the parent nests inside <Card>  renders here */}\n    </section>\n  );\n}\n\n// Used together — parent owns the data, children render it\n<Card title=\"Team\">\n  <Avatar name=\"Ada Lovelace\" size={48} />  {/* numeric prop  use braces  not quotes */}\n</Card>"
          },
          {
            "type": "table",
            "headers": ["Concept", "JS reality", "Mental model"],
            "rows": [
              ["Component",    "Function returning JSX",     "Reusable UI piece"],
              ["Props",        "First argument (an object)", "Inputs, read-only"],
              ["JSX",          "Sugar for `React.createElement`", "What you want to see"],
              ["`children`",   "A special prop",             "Whatever is nested inside"]
            ]
          }
        ]
      },
      {
        "heading": "Watch out for",
        "body": [
          {
            "type": "pros-cons",
            "goodLabel": "GOOD FOR",
            "watchLabel": "WATCH OUT FOR",
            "good": [
              "Components named with PascalCase — lowercase is treated as HTML",
              "One responsibility per component — easy to test, easy to reuse",
              "Composition over configuration — pass children, not 20 boolean props",
              "Lists need stable `key` props — index keys break on reorder"
            ],
            "watch": [
              "JSX must return one root — wrap siblings in `<>...</>` (Fragment)",
              "`{0}` renders 0; `{false}` renders nothing — falsy guards bite for numbers",
              "Mutating props or state in place — React won't see the change",
              "Calling a function inside JSX vs passing one — `onClick={handle()}` fires immediately"
            ]
          },
          {
            "type": "practice",
            "lang": "json",
            "prompt": "Describe the props for a Button component that supports variants and a click handler.",
            "starter": "{\n  \"component\": \"Button\",\n  \"props\": {\n    \"variant\": \"primary | secondary | ghost\",\n    \"disabled\": false,\n    \"onClick\": \"(event) => void\",\n    \"children\": \"JSX nodes\"\n  }\n}\n",
            "hint": "`children` is the label text or icon — passing it as a prop instead of a `label` string lets callers nest arbitrary JSX."
          },
          {
            "type": "quote",
            "text": "Think in components, not pages. The page is just the outermost component.",
            "cite": "the React mental shift"
          }
        ]
      }
    ]
  },
  "fs-react-state": {
    "sections": [
      {
        "heading": "useState: the local memory cell",
        "body": [
          {
            "type": "p",
            "text": "**`useState` gives a component a memory cell.** Each call returns `[value, setter]`. The setter triggers a re-render; the value persists across renders. Hooks must be called *in the same order every render* — never inside `if` or loops."
          },
          {
            "type": "code",
            "lang": "jsx",
            "text": "import { useState } from 'react';\n\nfunction Counter() {\n  const [count, setCount] = useState(0);  // initial value used only on first render\n\n  // FUNCTIONAL update — safe when the next value depends on the previous\n  const increment = () => setCount(c => c + 1);  // c is guaranteed fresh\n\n  // DIRECT update — works, but stale in async/batched flows\n  const reset = () => setCount(0);  // no dependency on previous  fine\n\n  return (\n    <button onClick={increment}>  {/* pass the function  don't call it */}\n      Count: {count}\n      <span onClick={(e) => { e.stopPropagation(); reset(); }}>↺</span>\n    </button>\n  );\n}"
          },
          {
            "type": "p",
            "text": "**Setting state to the same value is a no-op** — React uses `Object.is` to skip. But setting `{...obj}` always re-renders because it's a new object reference, even with identical fields."
          }
        ]
      },
      {
        "heading": "useEffect and dependencies",
        "body": [
          {
            "type": "p",
            "text": "**`useEffect` runs *after* render**, useful for things that touch the outside world: subscriptions, fetches, timers, DOM measurements. The **dependency array** tells React *when* to re-run it — empty array = once, `[id]` = when id changes, no array = every render (almost never what you want)."
          },
          {
            "type": "walkthrough",
            "title": "Effect lifecycle",
            "why": "Effects run *after* paint and clean up *before* the next run — that ordering is why the cleanup return exists.",
            "height": 320,
            "nodes": [
              { "id": "render",  "label": "render",   "subtitle": "JSX returned",      "accent": "sky",   "x": 0.30, "y": 0.2 },
              { "id": "commit",  "label": "commit",   "subtitle": "DOM updated",       "accent": "earth", "x": 0.70, "y": 0.2 },
              { "id": "effect",  "label": "effect",   "subtitle": "side effect runs",  "accent": "fire",  "x": 0.50, "y": 0.5 },
              { "id": "cleanup", "label": "cleanup",  "subtitle": "before next effect","accent": "amber", "x": 0.50, "y": 0.8 }
            ],
            "steps": [
              {
                "title": "Render returns JSX",
                "description": "The component runs and returns its JSX. Nothing has touched the screen yet — this is pure description.",
                "activeNodes": ["render"],
                "activeEdges": []
              },
              {
                "title": "React commits to the DOM",
                "description": "React reconciles and **paints** the changes to the real DOM. The user now sees the new UI.",
                "activeNodes": ["render", "commit"],
                "activeEdges": [{ "from": "render", "to": "commit", "label": "paint" }]
              },
              {
                "title": "The effect runs after paint",
                "description": "Only *after* the browser paints does your `useEffect` body fire — the safe moment to fetch, subscribe, or measure the DOM.",
                "activeNodes": ["commit", "effect"],
                "activeEdges": [{ "from": "commit", "to": "effect", "label": "after" }]
              },
              {
                "title": "Cleanup runs before the next effect",
                "description": "When deps change (or the component unmounts), the function you `return` runs first — cancel timers, abort fetches, unsubscribe.",
                "activeNodes": ["effect", "cleanup"],
                "activeEdges": [{ "from": "effect", "to": "cleanup", "label": "deps change" }]
              }
            ]
          },
          {
            "type": "code",
            "lang": "jsx",
            "text": "import { useState, useEffect } from 'react';\n\nfunction UserProfile({ id }) {\n  const [user, setUser] = useState(null);\n\n  useEffect(() => {\n    let cancelled = false;  // race-condition guard  closure-captured\n    fetch(`/api/users/${id}`)\n      .then(r => r.json())\n      .then(data => {\n        if (!cancelled) setUser(data);  // ignore stale responses after id change\n      });\n    return () => { cancelled = true; };  // cleanup runs on unmount AND on id change\n  }, [id]);  // re-run effect when id changes  exhaustive deps lint enforces this\n\n  if (!user) return <p>Loading…</p>;  // null guard  no optional chaining needed\n  return <h2>{user.name}</h2>;\n}"
          }
        ]
      },
      {
        "heading": "Lifting state, splitting components",
        "body": [
          {
            "type": "p",
            "text": "**When two siblings need the same value, lift it to their parent.** The parent owns the state and passes it down + a setter. This is React's version of pub/sub — no global needed for local coordination."
          },
          {
            "type": "table",
            "headers": ["Symptom", "Fix"],
            "rows": [
              ["Two siblings need same value",         "Lift state to parent"],
              ["State touched in 5 unrelated places",  "Move it to context or a store"],
              ["A component renders for unrelated changes", "Split it — extract the dynamic part"],
              ["`useEffect` runs too often",          "Audit deps — capture stable refs with `useRef`"]
            ]
          },
          {
            "type": "pros-cons",
            "goodLabel": "GOOD FOR",
            "watchLabel": "WATCH OUT FOR",
            "good": [
              "`useState(() => expensive())` — lazy init runs only once",
              "Functional setters (`setX(prev => ...)`) — safe across batched updates",
              "Cleanup returns from effects — cancel timers, unsubscribe, abort fetches",
              "Split a 200-line component once it has more than 3 unrelated `useState` calls"
            ],
            "watch": [
              "Missing deps — `[]` with values inside captures stale closures",
              "Effects that set state from props without a deps guard — infinite loop",
              "Sharing state via mutation — React only re-renders on new references",
              "Reaching for `useEffect` when a derived value would do — compute it inline instead"
            ]
          },
          {
            "type": "quote",
            "text": "If you can derive it, don't store it. State is the last resort, not the first.",
            "cite": "the lifting rule"
          }
        ]
      }
    ]
  },
  "fs-node-express": {
    "sections": [
      {
        "heading": "Node in one breath",
        "body": [
          {
            "type": "p",
            "text": "**Node is JavaScript outside the browser, on a single thread, with non-blocking I/O.** That one sentence is most of what trips up newcomers. There is one main thread running your JS. When it hits I/O — a file read, a database call, an HTTP request — Node hands it to the kernel and *keeps going*."
          },
          {
            "type": "p",
            "text": "The **event loop** is the bouncer that decides what runs next. Callbacks line up in queues; the loop drains them between I/O ticks. Block the loop with a long synchronous task and *every* request stalls."
          },
          {
            "type": "p",
            "text": "**Express** is a thin layer on top of Node's built-in `http` module. It adds routing, middleware chains, and ergonomic request/response helpers — nothing more, nothing less."
          },
          {
            "type": "walkthrough",
            "title": "Express request lifecycle",
            "why": "Every request walks the chain in registration order — that's why where you `app.use()` something is a routing decision.",
            "nodes": [
              { "id": "client",  "label": "Client",       "subtitle": "browser",      "accent": "sky",   "x": 0.30, "y": 0.25 },
              { "id": "node",    "label": "Node server",  "subtitle": "event loop",   "accent": "fire",  "x": 0.70, "y": 0.25 },
              { "id": "mw",      "label": "Middleware",   "subtitle": "auth+parse",   "accent": "amber", "x": 0.30, "y": 0.75 },
              { "id": "route",   "label": "Route handler","subtitle": "your logic",   "accent": "water", "x": 0.70, "y": 0.75 }
            ],
            "steps": [
              {
                "title": "Client sends a request",
                "description": "A browser fires an HTTP request at your server. It lands on Node's single event-loop thread.",
                "activeNodes": ["client"],
                "activeEdges": []
              },
              {
                "title": "Node hands it to the chain",
                "description": "The Express app receives the request and starts walking the **middleware chain** in the order you registered it.",
                "activeNodes": ["client", "node"],
                "activeEdges": [{ "from": "client", "to": "node", "label": "request" }]
              },
              {
                "title": "Middleware runs, then calls next()",
                "description": "Each middleware parses, authenticates, or logs — then calls `next()` to pass control downstream. Forget `next()` and the request hangs.",
                "activeNodes": ["node", "mw"],
                "activeEdges": [{ "from": "node", "to": "mw", "label": "chain" }]
              },
              {
                "title": "Control reaches your route handler",
                "description": "Once the chain clears, the matching **route handler** runs your actual logic — the trusted, parsed `req` is finally yours.",
                "activeNodes": ["mw", "route"],
                "activeEdges": [{ "from": "mw", "to": "route", "label": "next()" }]
              },
              {
                "title": "Handler responds to the client",
                "description": "The handler calls `res.json(...)` and the response travels back. One request in, one response out.",
                "activeNodes": ["route", "client"],
                "activeEdges": [{ "from": "route", "to": "client", "label": "json" }]
              }
            ]
          }
        ]
      },
      {
        "heading": "The middleware chain",
        "body": [
          {
            "type": "p",
            "text": "**Middleware is a function with the signature `(req, res, next)`.** Each one either responds (sending the chain to sleep) or calls `next()` to pass control downstream. The order you register them is the order they run — registration is routing."
          },
          {
            "type": "p",
            "text": "**Typical chain:** logger, body parser, CORS, auth, route handler, error handler. The error handler is special — it takes four args `(err, req, res, next)` and Express auto-routes thrown errors to it."
          },
          {
            "type": "table",
            "headers": ["Middleware", "Job", "When in chain"],
            "rows": [
              ["`morgan` / logger",       "Print every request",  "First — see everything"],
              ["`express.json()`",        "Parse JSON body",      "Before routes that read it"],
              ["`cors`",                  "Add CORS headers",     "Before routes"],
              ["error handler (4 args)",  "Catch thrown errors",  "Last — `app.use((err,req,res,next)=>...)`"]
            ]
          },
          {
            "type": "code",
            "lang": "javascript",
            "text": "// server.js — minimal Express app with the standard chain\nimport express from 'express';  // ESM import  Node 18+\n\nconst app = express();  // app is a request handler that runs the chain\n\napp.use(express.json());  // parses application/json bodies into req.body\napp.use((req, _res, next) => {  // simple logger middleware  always calls next()\n  console.log(`${req.method} ${req.path}`);  // method + path  one line per request\n  next();  // hand off  forgetting this hangs the request forever\n});\n\napp.get('/health', (_req, res) => {  // GET /health route\n  res.json({ ok: true });  // sends 200 + Content-Type: application/json\n});\n\napp.post('/echo', (req, res) => {  // POST /echo  reads JSON body\n  res.status(201).json({ youSent: req.body });  // 201 Created  echoes payload\n});\n\napp.use((err, _req, res, _next) => {  // 4-arg signature  Express knows it's the error handler\n  console.error(err);  // log full error server-side\n  res.status(500).json({ error: 'server_error' });  // generic shape  no stack leak\n});\n\napp.listen(3000, () => console.log('up on :3000'));  // single thread  one port  one process"
          }
        ]
      },
      {
        "heading": "Non-blocking I/O, gotchas",
        "body": [
          {
            "type": "p",
            "text": "**Async is the rule, not the exception.** Use `async/await` for DB calls, file I/O, and outbound HTTP. The synchronous variants (`fs.readFileSync`) exist — they will also wreck your throughput if you call them inside a route."
          },
          {
            "type": "p",
            "text": "**CPU-bound work blocks the loop.** Hash a 10 MB file with `crypto` synchronously and every other request waits. For real CPU work, offload to a Worker thread or a queue."
          },
          {
            "type": "pros-cons",
            "goodLabel": "GOOD FOR",
            "watchLabel": "WATCH OUT FOR",
            "good": [
              "I/O-heavy APIs — thousands of concurrent connections on one process",
              "Real-time servers — WebSockets, SSE, streaming",
              "Same language client + server — share validation schemas + types",
              "Tiny startup + huge npm ecosystem — prototypes ship fast"
            ],
            "watch": [
              "CPU-bound loops freeze every other request — use Workers or a queue",
              "Forgetting `next()` in middleware — the request hangs until the client times out",
              "Mixing sync (`fs.readFileSync`) into request paths — same blocking problem",
              "One uncaught exception can crash the whole process — pin a process manager"
            ]
          },
          {
            "type": "practice",
            "lang": "bash",
            "prompt": "Hit a local Express server with curl — try GET, then a POST with a JSON body.",
            "starter": "# Start the server first:  node server.js\n\n# Health check — expect { ok: true }\ncurl -i http://localhost:3000/health\n\n# Echo with a JSON body — expect 201 + { youSent: ... }\ncurl -i -X POST http://localhost:3000/echo \\\n  -H 'Content-Type: application/json' \\\n  -d '{\"name\":\"ada\",\"role\":\"engineer\"}'\n",
            "hint": "Forget the `Content-Type` header and `req.body` will be `undefined` — `express.json()` only parses when the header matches. The `-i` flag shows status + headers."
          },
          {
            "type": "quote",
            "text": "Node isn't fast because it's parallel. It's fast because it refuses to wait.",
            "cite": "the event-loop maxim"
          }
        ]
      }
    ]
  },
  "fs-rest-routes": {
    "sections": [
      {
        "heading": "Resources are nouns",
        "body": [
          {
            "type": "p",
            "text": "**REST models the world as resources.** A resource is a noun — `users`, `orders`, `comments`. The URL points at it: `/users/42` is *the* user with id 42. The HTTP method is the verb: read, create, replace, patch, delete."
          },
          {
            "type": "p",
            "text": "Lead with plural collection URLs (`/users`) and singular item URLs underneath (`/users/42`). Avoid stuffing verbs into paths — `POST /createUser` is a smell. The method already says \"create\"."
          },
          {
            "type": "p",
            "text": "**Nest when ownership is real**, not just convenient. `/users/42/orders` reads naturally because orders belong to a user. Three levels deep is usually one too many — flatten with query params."
          }
        ]
      },
      {
        "heading": "Methods and their contract",
        "body": [
          {
            "type": "p",
            "text": "**Each method carries a promise** — about whether it changes state, and whether retrying it is safe. Honor the promise and your API becomes cacheable, retryable, and predictable for free."
          },
          {
            "type": "table",
            "headers": ["Method", "Use", "Safe?", "Idempotent?"],
            "rows": [
              ["`GET`",    "Read a resource",                "yes", "yes"],
              ["`POST`",   "Create / non-idempotent action", "no",  "no"],
              ["`PUT`",    "Replace whole resource",         "no",  "yes"],
              ["`PATCH`",  "Partial update",                 "no",  "usually"],
              ["`DELETE`", "Remove resource",                "no",  "yes"]
            ]
          },
          {
            "type": "p",
            "text": "**Safe** means no observable state change. **Idempotent** means calling N times has the same end state as calling once — the contract that lets clients retry on timeout without double-charging the card."
          },
          {
            "type": "diagram",
            "title": "Status code families",
            "subtitle": "CLIENT · SERVER · OUTCOME",
            "height": 240,
            "nodes": [
              { "id": "c2xx", "label": "2xx", "subtitle": "success",         "accent": "earth", "x": 0.30, "y": 0.5 },
              { "id": "c3xx", "label": "3xx", "subtitle": "redirect",        "accent": "amber", "x": 0.70, "y": 0.5 },
              { "id": "c4xx", "label": "4xx", "subtitle": "client's fault",  "accent": "water", "x": 0.30, "y": 0.85 },
              { "id": "c5xx", "label": "5xx", "subtitle": "server's fault",  "accent": "fire",  "x": 0.70, "y": 0.85 }
            ],
            "edges": [
              { "from": "c2xx", "to": "c3xx", "kind": "dashed", "label": "moved" },
              { "from": "c3xx", "to": "c4xx", "kind": "dashed", "label": "bad input" },
              { "from": "c4xx", "to": "c5xx", "kind": "dashed", "label": "we broke it" }
            ]
          }
        ]
      },
      {
        "heading": "Picking the right code",
        "body": [
          {
            "type": "p",
            "text": "**Pick codes by who is to blame and what state changed.** `200` for read OK, `201` only when something new was created (with a `Location` header pointing to it), `204` when there's literally nothing to return."
          },
          {
            "type": "p",
            "text": "**On the 4xx side**, `400` means malformed, `401` means \"who are you\", `403` means \"I know you and no\", `404` means \"never heard of it\", `409` means \"state conflict — try again with fresh data\"."
          },
          {
            "type": "p",
            "text": "**Reads first** — `GET /` is the collection, `GET /:id` is the resource. Missing returns 404, never a 200 with `null`."
          },
          {
            "type": "code",
            "lang": "javascript",
            "text": "// routes/users.js — a tiny CRUD router that honors the verb contract\nimport { Router } from 'express';  // mini app  composable router\nconst router = Router();\nconst users = new Map();  // in-memory store  swap for a DB in real life\nlet nextId = 1;\n\nrouter.get('/', (_req, res) => {  // GET /users  safe + idempotent\n  res.json([...users.values()]);  // 200 implied  array shape stays stable\n});\n\nrouter.get('/:id', (req, res) => {  // GET /users/42\n  const u = users.get(Number(req.params.id));  // params are strings  cast carefully\n  if (!u) return res.status(404).json({ error: 'not_found' });  // 404  not 200 + null\n  res.json(u);\n});"
          },
          {
            "type": "p",
            "text": "**Writes** — POST creates (201 + Location), PUT replaces (idempotent), DELETE returns 204 with no body."
          },
          {
            "type": "code",
            "lang": "javascript",
            "text": "router.post('/', (req, res) => {  // POST /users  creates  NOT idempotent\n  const id = nextId++;\n  const user = { id, ...req.body };\n  users.set(id, user);\n  res.status(201)  // 201 Created  always pair with Location\n     .location(`/users/${id}`)\n     .json(user);\n});\n\nrouter.put('/:id', (req, res) => {  // PUT replaces the whole resource  idempotent\n  const id = Number(req.params.id);\n  users.set(id, { id, ...req.body });  // same body  same result  every call\n  res.status(200).json(users.get(id));\n});\n\nrouter.delete('/:id', (req, res) => {  // DELETE  idempotent  double-delete still ends deleted\n  users.delete(Number(req.params.id));\n  res.status(204).end();  // 204 No Content  no body  faster on the wire\n});\n\nexport default router;"
          },
          {
            "type": "pros-cons",
            "goodLabel": "GOOD FOR",
            "watchLabel": "WATCH OUT FOR",
            "good": [
              "Plural-collection URLs (`/users`) + id paths (`/users/42`) — predictable",
              "`201 Created` with a `Location` header on POST — clients can follow it",
              "`PUT` for full replace, `PATCH` for partial — retries stay safe",
              "Distinct 4xx codes — clients can branch on them, not parse error strings"
            ],
            "watch": [
              "Verbs in URLs (`POST /createUser`) — the method already said it",
              "`200 OK` for errors — clients learn to ignore status codes and parse bodies",
              "Returning 500 for client mistakes — your alerts will scream for nothing",
              "Soft-deleting on `DELETE` without saying so — surprises every integrator"
            ]
          },
          {
            "type": "practice",
            "lang": "bash",
            "prompt": "Drive the user router with curl. Watch the status codes.",
            "starter": "# Create — expect 201 + Location header\ncurl -i -X POST http://localhost:3000/users \\\n  -H 'Content-Type: application/json' \\\n  -d '{\"name\":\"ada\"}'\n\n# Read it back — expect 200 + body\ncurl -i http://localhost:3000/users/1\n\n# Replace — expect 200 + new body\ncurl -i -X PUT http://localhost:3000/users/1 \\\n  -H 'Content-Type: application/json' \\\n  -d '{\"name\":\"grace\",\"role\":\"admiral\"}'\n\n# Delete — expect 204 No Content, empty body\ncurl -i -X DELETE http://localhost:3000/users/1\n\n# Read again — expect 404 not_found\ncurl -i http://localhost:3000/users/1\n",
            "hint": "Run the DELETE twice — both calls return 204. That's idempotency in action."
          },
          {
            "type": "quote",
            "text": "The verb is the contract. Pick the right one and the rest writes itself.",
            "cite": "REST in two sentences"
          }
        ]
      }
    ]
  },
  "fs-request-validation": {
    "sections": [
      {
        "heading": "Validate at the edge",
        "body": [
          {
            "type": "p",
            "text": "**Never trust input that crossed a network boundary.** That goes for JSON bodies, query strings, URL params, headers — anything a client can shape. Validate it at the *first* place it enters your code, before it touches a database, a queue, or another service."
          },
          {
            "type": "p",
            "text": "The pattern is **parse, don't validate**. Take an unknown blob, run it through a schema, and the output is either a typed value you can trust or an error you can return. No half-states, no \"maybe valid\"."
          },
          {
            "type": "p",
            "text": "**Zod, Joi, and express-validator** all do this. Zod has won the TS-shop vote because the schema *is* the type — one declaration, both runtime and compile-time."
          }
        ]
      },
      {
        "heading": "Schema-first with Zod",
        "body": [
          {
            "type": "p",
            "text": "**Define the shape once. Reuse it for the request, the database, and the response.** When you change a field, every layer breaks until it's consistent — that's the bug-finder you want."
          },
          {
            "type": "table",
            "headers": ["Strategy", "Where it lives", "Best for"],
            "rows": [
              ["Schema validation (Zod / Joi)", "Per-route middleware", "JSON bodies + complex shapes"],
              ["`express-validator`",           "Per-field chains",     "Quick sanity checks"],
              ["Manual `if` checks",            "Inside handlers",      "Toy projects only"],
              ["DB constraints alone",          "Schema-level",         "Last line of defense, not first"]
            ]
          },
          {
            "type": "p",
            "text": "**Define the schema once.** Zod gives you runtime validation and inferred TS types from the same object."
          },
          {
            "type": "code",
            "lang": "javascript",
            "text": "// schemas.js — schemas are the source of truth\nimport { z } from 'zod';  // peer-reviewed schemas with inferred TS types\n\nexport const NewUser = z.object({\n  name: z.string().min(1).max(80),  // empty-string rejection comes free\n  email: z.string().email(),  // built-in email check  good enough for 99% of apps\n  age: z.number().int().min(13).optional(),  // optional  but if present must be valid\n});"
          },
          {
            "type": "p",
            "text": "**Validate at the edge** — middleware turns junk into a structured 400, then hands a trusted, typed body to the handler."
          },
          {
            "type": "code",
            "lang": "javascript",
            "text": "// routes/users.js — validation middleware\nimport { NewUser } from './schemas.js';\n\nfunction validate(schema) {  // middleware factory  curried for reuse\n  return (req, res, next) => {\n    const result = schema.safeParse(req.body);  // safeParse never throws  returns {success, data|error}\n    if (!result.success) {\n      return res.status(400).json({\n        error: 'invalid_input',  // stable code  clients can branch on it\n        issues: result.error.issues.map((i) => ({  // shape the issues we return\n          path: i.path.join('.'),  // 'email' or 'address.zip'\n          message: i.message,  // 'Invalid email'\n        })),\n      });\n    }\n    req.body = result.data;  // replace with the typed, coerced value  downstream is safe\n    next();  // hand off  body is now trustworthy\n  };\n}\n\nrouter.post('/users', validate(NewUser), (req, res) => {\n  // req.body is typed and trusted here  no more if (!email) checks\n  res.status(201).json(req.body);\n});"
          }
        ]
      },
      {
        "heading": "Error handling that doesn't leak",
        "body": [
          {
            "type": "p",
            "text": "**Use one error handler at the end of the chain.** It owns the JSON shape, the logging, and the rule that stack traces never reach the client in production. Express auto-routes to it when middleware calls `next(err)` or throws."
          },
          {
            "type": "p",
            "text": "**Pick a consistent error shape and never deviate.** Clients write code against it; a one-off `{message: 'oops'}` will leak into a logger somewhere and someone will parse it. `{error, message, requestId}` is a fine starting contract."
          },
          {
            "type": "diagram",
            "title": "Error flow",
            "subtitle": "VALIDATE · THROW · LOG · RESPOND",
            "height": 240,
            "nodes": [
              { "id": "in",    "label": "Request",          "subtitle": "blob",         "accent": "water", "x": 0.30, "y": 0.5 },
              { "id": "val",   "label": "Validator",        "subtitle": "schema",       "accent": "amber", "x": 0.70, "y": 0.5 },
              { "id": "throw", "label": "Throw / next(err)","subtitle": "structured",   "accent": "fire",  "x": 0.30, "y": 0.85 },
              { "id": "out",   "label": "Error handler",    "subtitle": "shape + log",        "accent": "earth", "x": 0.70, "y": 0.85 }
            ],
            "edges": [
              { "from": "in",    "to": "val",   "kind": "solid",  "label": "parse" },
              { "from": "val",   "to": "throw", "kind": "dashed", "label": "invalid" },
              { "from": "throw", "to": "out",   "kind": "solid",  "label": "catch" }
            ]
          },
          {
            "type": "pros-cons",
            "goodLabel": "GOOD FOR",
            "watchLabel": "WATCH OUT FOR",
            "good": [
              "Schema-first input — typed downstream, no defensive `if` clutter",
              "One central error handler — shape, log, and obscure in one place",
              "Stable error codes (`invalid_input`, `not_found`) — clients can branch",
              "Include a `requestId` so support can correlate logs to user complaints"
            ],
            "watch": [
              "Leaking stack traces in 5xx — attacker recon gift",
              "Returning DB error strings raw — `duplicate key value violates...` is a fingerprint",
              "Different error shapes per route — client code becomes a switch maze",
              "Validating inside the handler — the moment two routes need the same check you'll regret it"
            ]
          },
          {
            "type": "practice",
            "lang": "json",
            "prompt": "Sketch the error response your handler returns for invalid input. Match the contract: stable code, list of issues, no stack trace.",
            "starter": "{\n  \"error\": \"invalid_input\",\n  \"message\": \"Request body failed validation.\",\n  \"requestId\": \"req_01H8X9YABCD\",\n  \"issues\": [\n    { \"path\": \"email\", \"message\": \"Invalid email\" },\n    { \"path\": \"age\",   \"message\": \"Number must be greater than or equal to 13\" }\n  ]\n}\n",
            "hint": "Include `requestId` so a user can quote it in a support ticket — you can grep logs in one shot. Never include `stack`."
          },
          {
            "type": "quote",
            "text": "Parse, don't validate. The schema is the boundary between trash input and trusted data.",
            "cite": "Alexis King, paraphrased"
          }
        ]
      }
    ]
  },
  "fs-fetch-from-react": {
    "sections": [
      {
        "heading": "fetch is the floor",
        "body": [
          {
            "type": "p",
            "text": "**`fetch` is built into every browser**, returns a Promise, and is the baseline you build on. It does NOT reject on 4xx/5xx — only on network failure. Forgetting `res.ok` is the most common bug in a junior's first React app."
          },
          {
            "type": "p",
            "text": "**`axios` adds ergonomics** — auto-JSON, interceptors, timeout flag, cancellation tokens. For most apps it's not strictly needed; for some teams the consistency is worth the extra dependency."
          },
          {
            "type": "p",
            "text": "**Every async call has three states.** Loading, error, success. If your UI only handles success it will lie to your users — show a spinner while in flight, an actionable error on failure, the data on success."
          }
        ]
      },
      {
        "heading": "The three states + abort",
        "body": [
          {
            "type": "table",
            "headers": ["State", "What UI shows", "Common bug"],
            "rows": [
              ["Loading",  "Spinner / skeleton",  "Showing stale data while next fetch is in flight"],
              ["Error",    "Message + retry CTA", "Swallowing the error and showing empty state"],
              ["Success",  "The data",            "Forgetting to abort on unmount — race condition"]
            ]
          },
          {
            "type": "p",
            "text": "**`AbortController` is your friend.** Pass `controller.signal` to `fetch`; call `controller.abort()` in the effect cleanup. Without it, a slow response can resolve into an unmounted component and set state on a ghost — a classic React warning and a real memory leak."
          },
          {
            "type": "code",
            "lang": "javascript",
            "text": "// useUser.js — a hand-rolled hook with loading + error + abort\nimport { useEffect, useState } from 'react';\n\nexport function useUser(id) {\n  const [data, setData] = useState(null);  // success payload\n  const [error, setError] = useState(null);  // last error\n  const [loading, setLoading] = useState(true);  // start true  we are fetching\n\n  useEffect(() => {\n    const ctrl = new AbortController();  // one controller per effect run\n    setLoading(true);\n    setError(null);  // clear stale errors when id changes\n\n    fetch(`/api/users/${id}`, { signal: ctrl.signal })  // wire the abort signal\n      .then(async (res) => {\n        if (!res.ok) throw new Error(`HTTP ${res.status}`);  // 4xx/5xx DOES NOT throw  do this\n        return res.json();\n      })\n      .then(setData)\n      .catch((err) => {\n        if (err.name === 'AbortError') return;  // expected on unmount  swallow silently\n        setError(err);  // real failure  let the UI show it\n      })\n      .finally(() => setLoading(false));  // settled either way  hide the spinner\n\n    return () => ctrl.abort();  // cleanup  cancels the in-flight request on unmount / id change\n  }, [id]);  // re-run when id changes  exhaustive-deps lint enforces this\n\n  return { data, loading, error };\n}"
          }
        ]
      },
      {
        "heading": "Stop writing this by hand",
        "body": [
          {
            "type": "p",
            "text": "**Once you've written that hook three times, switch to React Query or SWR.** Both give you loading/error/success, caching, deduping, retries, and refetching on focus — for free. They are the answer to \"why is my app so flickery\"."
          },
          {
            "type": "p",
            "text": "**Stale-while-revalidate** is the magic phrase. Show the cached data instantly so the UI never flashes empty, then refetch in the background and quietly update when fresh data arrives. The user perceives \"instant\"; the data converges to \"correct\"."
          },
          {
            "type": "diagram",
            "title": "Stale-while-revalidate",
            "subtitle": "CACHE · UI · NETWORK",
            "height": 240,
            "nodes": [
              { "id": "mount", "label": "Component mounts","subtitle": "/users/42",   "accent": "sky",   "x": 0.30, "y": 0.5 },
              { "id": "cache", "label": "Cache hit",       "subtitle": "stale shown", "accent": "earth", "x": 0.70, "y": 0.5 },
              { "id": "net",   "label": "Revalidate",      "subtitle": "bg fetch",    "accent": "water", "x": 0.30, "y": 0.85 },
              { "id": "ui",    "label": "UI updates",      "subtitle": "if changed",  "accent": "amber", "x": 0.70, "y": 0.85 }
            ],
            "edges": [
              { "from": "mount", "to": "cache", "kind": "solid",  "label": "instant" },
              { "from": "cache", "to": "net",   "kind": "dashed", "label": "kick off" },
              { "from": "net",   "to": "ui",    "kind": "solid",  "label": "merge" }
            ]
          },
          {
            "type": "walkthrough",
            "title": "React fetch lifecycle",
            "caption": "Trace one async request from mount to re-render.",
            "nodes": [
              { "id": "component", "label": "Component", "subtitle": "REACT TREE",    "accent": "amber", "x": 0.18, "y": 0.5 },
              { "id": "server",    "label": "Server",    "subtitle": "/API/USERS/42", "accent": "fire",  "x": 0.82, "y": 0.5 }
            ],
            "steps": [
              {
                "title": "Component mounts → useEffect fires",
                "description": "React commits the component to the DOM. Right after paint, the effect runs and you set `loading: true` so the UI shows a spinner instead of empty space.",
                "activeNodes": ["component"],
                "activeEdges": []
              },
              {
                "title": "fetch() returns a Promise; loading shown",
                "description": "The request leaves the browser and an AbortController is wired up. The component is still rendering the loading state — no data yet, but the UI is honest about it.",
                "activeNodes": ["component", "server"],
                "activeEdges": [{ "from": "component", "to": "server", "label": "fetch" }]
              },
              {
                "title": "Server responds; await resolves",
                "description": "Response comes back. You check `res.ok` (because fetch doesn't reject on 4xx/5xx), parse JSON, and the Promise resolves with the payload.",
                "activeNodes": ["server", "component"],
                "activeEdges": [{ "from": "server", "to": "component", "label": "200 + json" }]
              },
              {
                "title": "setState commits → re-render with data",
                "description": "You call setData(payload). React schedules a re-render, the loading flag flips to false, and the component finally paints with the real user.",
                "activeNodes": ["component"],
                "activeEdges": []
              }
            ]
          },
          {
            "type": "code",
            "lang": "javascript",
            "text": "// UserCard.jsx — same data, ~80% less code with React Query\nimport { useQuery } from '@tanstack/react-query';\n\nasync function getUser(id, signal) {\n  const res = await fetch(`/api/users/${id}`, { signal });  // abort wired for us\n  if (!res.ok) throw new Error(`HTTP ${res.status}`);  // still your job to check\n  return res.json();\n}\n\nexport function UserCard({ id }) {\n  const { data, error, isLoading } = useQuery({\n    queryKey: ['user', id],  // cache key  same key = shared cache + dedupe\n    queryFn: ({ signal }) => getUser(id, signal),  // signal comes from the lib  abort free\n    staleTime: 30_000,  // 30s  serve cached data without refetch for this long\n    retry: 1,  // one auto-retry on failure  tunable per query\n  });\n\n  if (isLoading) return <p>Loading…</p>;  // first load only  refetches keep stale data visible\n  if (error)     return <p>Failed: {error.message}</p>;  // actionable, not silent\n  return <h2>{data.name}</h2>;\n}"
          },
          {
            "type": "pros-cons",
            "goodLabel": "GOOD FOR",
            "watchLabel": "WATCH OUT FOR",
            "good": [
              "Cache-first reads — instant UI on revisits, background refresh",
              "Per-query loading/error state — no global is-something-loading mess",
              "Auto-dedupe — five components asking for `user/42` = one network call",
              "Retries with backoff baked in — flaky networks stop breaking your screen"
            ],
            "watch": [
              "`fetch` does not reject on 4xx — check `res.ok` or you'll \"succeed\" with HTML",
              "Setting state after unmount — wire `AbortController` or use a query lib",
              "Treating mutations as queries — POST/PUT/DELETE belong in `useMutation`",
              "Caching forever — `staleTime: Infinity` means users see ghosts of old data"
            ]
          },
          {
            "type": "quote",
            "text": "If you can derive it, don't store it. If you can cache it, don't refetch it. If you can stop writing fetch hooks, stop.",
            "cite": "the data-fetching ladder"
          }
        ]
      }
    ]
  },
  "fs-api-security": {
    "sections": [
      {
        "heading": "Day-one threats",
        "body": [
          {
            "type": "p",
            "text": "**Your API is internet-facing.** That means scanners, bots, and curious humans hit it within hours of going live. You don't need a security team to survive day one — you need a small set of middleware in the right order."
          },
          {
            "type": "p",
            "text": "**The four cheap wins**: HTTPS only, CORS configured (not wide-open), rate limits on hot endpoints, and `helmet` for sane default headers. Each is one line. None of them are optional."
          },
          {
            "type": "p",
            "text": "**Input is hostile by default.** A request body, a query param, a header — assume each was crafted to break you. Validation (last lesson) is half the answer; sanitizing values that flow into HTML, SQL, or shell is the other half."
          }
        ]
      },
      {
        "heading": "CORS, rate limits, headers",
        "body": [
          {
            "type": "p",
            "text": "**CORS is browser-only.** It does NOT protect your API from `curl` or another server — it just tells *browsers* which origins can read responses. The point is to keep `evil.com` from making your logged-in user POST to your API."
          },
          {
            "type": "p",
            "text": "**Rate limits stop brute-force.** A 5-attempts-per-minute cap on `/login` makes password spraying impractical. A global 100-req-per-IP-per-minute cap stops the dumbest bots cold."
          },
          {
            "type": "table",
            "headers": ["Threat", "First-line defense", "Lives in"],
            "rows": [
              ["Cross-site request",      "CORS allowlist",          "`cors` middleware"],
              ["Brute force / scraping",  "Per-IP rate limit",       "`express-rate-limit`"],
              ["Clickjack / sniff",       "Security headers",        "`helmet`"],
              ["Injection (XSS / SQL)",   "Validate + parameterize", "Schema + ORM / placeholders"]
            ]
          },
          {
            "type": "walkthrough",
            "title": "Defense at the edge",
            "why": "Each layer rejects a different attacker cheaply — and the order matters: drop bad traffic before you spend cycles parsing it.",
            "nodes": [
              { "id": "tls",    "label": "HTTPS",      "subtitle": "tls termination",  "accent": "water", "x": 0.30, "y": 0.5 },
              { "id": "cors",   "label": "CORS",       "subtitle": "origin allowlist", "accent": "sky",   "x": 0.70, "y": 0.5 },
              { "id": "limit",  "label": "Rate limit", "subtitle": "per-ip bucket",    "accent": "amber", "x": 0.30, "y": 0.85 },
              { "id": "helmet", "label": "Helmet",     "subtitle": "security headers", "accent": "fire",  "x": 0.70, "y": 0.85 }
            ],
            "steps": [
              {
                "title": "HTTPS decrypts the request",
                "description": "TLS termination is the floor — the bytes arrive private. Everything downstream now sees plaintext it can inspect.",
                "activeNodes": ["tls"],
                "activeEdges": []
              },
              {
                "title": "CORS checks the origin",
                "description": "The **origin allowlist** decides whether a browser from another site is even allowed to read your response. `evil.com` stops here.",
                "activeNodes": ["tls", "cors"],
                "activeEdges": [{ "from": "tls", "to": "cors", "label": "decrypted" }]
              },
              {
                "title": "Rate limit checks the budget",
                "description": "The **per-IP bucket** rejects floods before you spend any work on them — brute-force and dumb bots die here, in budget or not.",
                "activeNodes": ["cors", "limit"],
                "activeEdges": [{ "from": "cors", "to": "limit", "label": "allowed" }]
              },
              {
                "title": "Helmet sets safe headers",
                "description": "Finally `helmet` stamps ~15 **security headers** on the response — clickjacking, sniffing, and downgrade defenses, all in one line.",
                "activeNodes": ["limit", "helmet"],
                "activeEdges": [{ "from": "limit", "to": "helmet", "label": "in budget" }]
              }
            ]
          }
        ]
      },
      {
        "heading": "The starter stack",
        "body": [
          {
            "type": "p",
            "text": "**Wire the middleware in the right order: helmet first, CORS second, rate limit third, parsers next, routes last.** Helmet and CORS need to see every request including OPTIONS preflight; the rate limiter rejects before you spend cycles parsing JSON."
          },
          {
            "type": "p",
            "text": "**HTTPS is the floor, not the ceiling.** TLS keeps the bytes private in transit; it doesn't validate input, doesn't authenticate the caller, and doesn't stop a logged-in user from being malicious. You still need everything else."
          },
          {
            "type": "p",
            "text": "**The global middleware chain** — helmet, CORS, and rate-limit all run before the body parser so attackers can't blow your budget on payload parsing."
          },
          {
            "type": "code",
            "lang": "javascript",
            "text": "// server.js — the cheap defense-in-depth starter\nimport express from 'express';\nimport helmet from 'helmet';  // sets ~15 sane response headers\nimport cors from 'cors';\nimport rateLimit from 'express-rate-limit';\n\nconst app = express();\n\napp.use(helmet());  // first  X-Frame-Options, X-Content-Type-Options, HSTS, etc.\n\napp.use(cors({\n  origin: ['https://app.example.com'],  // allowlist  NOT '*' on auth'd APIs\n  credentials: true,  // required to send cookies cross-origin  pair with strict origin\n}));\n\napp.use(rateLimit({\n  windowMs: 60_000,  // 1 minute window\n  max: 100,  // 100 requests per IP per minute  raise/lower per route\n  standardHeaders: true,  // adds RateLimit-* response headers  clients can self-throttle\n  legacyHeaders: false,  // drop the old X-RateLimit-* names\n}));"
          },
          {
            "type": "p",
            "text": "**Body parser + per-route tightening** — small JSON cap blocks JSON bombs, and `/login` gets a much stricter rate limit to defeat password spraying."
          },
          {
            "type": "code",
            "lang": "javascript",
            "text": "app.use(express.json({ limit: '100kb' }));  // small body cap  refuses 10MB JSON bombs\n\napp.post('/login', rateLimit({ windowMs: 60_000, max: 5 }), (req, res) => {\n  // tighter limit on /login  defeats password spraying\n  // ... do the auth, return 200 or 401\n});\n\napp.listen(3000);"
          },
          {
            "type": "pros-cons",
            "goodLabel": "GOOD FOR",
            "watchLabel": "WATCH OUT FOR",
            "good": [
              "`helmet()` — fifteen header best-practices in one line",
              "Allowlist CORS origins — `'*'` is fine for public reads, never for auth'd APIs",
              "Tighter rate limits on auth + write endpoints than reads",
              "Small JSON body caps — bigger uploads should go through a signed-URL path"
            ],
            "watch": [
              "`origin: '*'` with `credentials: true` — the browser will refuse this combo on purpose",
              "Trusting `X-Forwarded-For` without setting `app.set('trust proxy', ...)` — rate limit by spoofed IP",
              "Stack traces in error responses — free recon for an attacker",
              "Rolling your own crypto / JWT verification — use a vetted library, every time"
            ]
          },
          {
            "type": "quote",
            "text": "HTTPS is the floor, not the ceiling. Helmet, CORS, and a rate limit are the next three steps — and they're all one line each.",
            "cite": "the day-one checklist"
          },
          {
            "type": "explain-back",
            "prompt": "You've now seen **HTTPS termination**, a **CORS allowlist**, **per-IP rate limits**, **`helmet` headers**, and **input validation**. A logged-in user's browser is tricked into POSTing to your API from `evil.com`. Walk the request through your middleware stack in order, say which layer (if any) stops it, and name the one trade-off you'd accept to keep the stack cheap.",
            "modelAnswer": "Order matters because each layer should reject traffic before a more expensive one runs: HTTPS first (bytes arrive private), then CORS, then the rate limit, then the body parser, then validation, then the route. For this specific attack — a cross-site request from a logged-in user — none of these layers actually blocks it: CORS only stops `evil.com` from *reading* the response, not from *sending* a state-changing POST, and HTTPS/rate-limit/helmet/validation are about transport, volume, headers, and payload shape, not request forgery. The real defense is CSRF protection (SameSite=Lax/Strict cookies or a CSRF token), which this defense-in-depth stack deliberately doesn't include. So the integration point is recognizing the gap: these five cheap wins cover scanners, brute force, sniffing, and malformed input, but cross-site *writes* need a sixth layer. The trade-off I'd accept: every layer adds a little latency and config surface (a too-strict CORS origin or rate limit will block legitimate clients first), so I keep limits generous globally and only tighten on auth/write endpoints, accepting that a determined attacker who already has valid creds isn't stopped by edge middleware at all.",
            "hint": "Order = cheap-rejects-first. Then ask: which of these actually stops a cross-site *write*?"
          }
        ]
      }
    ]
  },
  "fs-postgres-basics": {
    "sections": [
      {
        "heading": "The DB is the source of truth",
        "body": [
          {
            "type": "p",
            "text": "**Your app code will be rewritten three times. Your database will outlive all of them.** Every constraint you push into Postgres — NOT NULL, UNIQUE, foreign keys — is a rule the next framework, the next intern, and the 3am cron job all have to obey."
          },
          {
            "type": "p",
            "text": "**App-level validation is a suggestion. Database constraints are a guarantee.** A typo in your JS validator silently lets bad rows through. A NOT NULL on the column rejects them at the wire, regardless of which service made the call."
          },
          {
            "type": "p",
            "text": "**Postgres also gives you real types** — `timestamptz`, `jsonb`, `uuid`, `numeric` — not the everything-is-a-string soup of older stores. Pick the narrowest type that fits; the planner and your future self will both thank you."
          }
        ]
      },
      {
        "heading": "Picking the right column type",
        "body": [
          {
            "type": "p",
            "text": "**Don't reach for `text` reflexively.** A `timestamptz` sorts correctly across timezones; a `numeric(10,2)` won't lose pennies to floating-point; a `jsonb` is indexable. Strings can't do any of that."
          },
          {
            "type": "table",
            "headers": ["Need", "Use", "Avoid"],
            "rows": [
              ["Money", "`numeric(12,2)`", "`float` — rounds your invoices"],
              ["Timestamps", "`timestamptz`", "`text` ISO strings — no sort, no range"],
              ["IDs", "`bigint` or `uuid`", "`int` — overflows at 2.1B rows"],
              ["Flexible blob", "`jsonb`", "`text` JSON — no index, no validate"]
            ]
          },
          {
            "type": "diagram",
            "title": "Constraint layers",
            "subtitle": "APP · ORM · POSTGRES",
            "height": 240,
            "nodes": [
              { "id": "client", "label": "Client",   "subtitle": "form",         "accent": "sky",   "x": 0.30, "y": 0.5 },
              { "id": "orm",    "label": "ORM",      "subtitle": "schema",       "accent": "water", "x": 0.70, "y": 0.5 },
              { "id": "pg",     "label": "Postgres", "subtitle": "constraints",  "accent": "fire",  "x": 0.30, "y": 0.85 },
              { "id": "disk",   "label": "Row",      "subtitle": "on disk",      "accent": "earth", "x": 0.70, "y": 0.85 }
            ],
            "edges": [
              { "from": "client", "to": "orm",  "kind": "solid",  "label": "submit" },
              { "from": "orm",    "to": "pg",   "kind": "solid",  "label": "insert" },
              { "from": "pg",     "to": "disk", "kind": "dashed", "label": "if valid" }
            ]
          }
        ]
      },
      {
        "heading": "A real users + posts schema",
        "body": [
          {
            "type": "p",
            "text": "**Read this slowly.** Every clause is doing one job: `PRIMARY KEY` gives you free uniqueness + index, `NOT NULL` rejects missing data at the DB, `REFERENCES` makes orphan rows impossible, `UNIQUE` blocks duplicate emails before they hit your inbox dedupe code."
          },
          {
            "type": "code",
            "lang": "sql",
            "text": "-- users + posts  the canonical two-table example\nCREATE TABLE users (\n  id            bigserial      PRIMARY KEY,             -- auto-increment, also unique + indexed\n  email         text           NOT NULL UNIQUE,         -- two constraints in one line\n  display_name  text           NOT NULL,\n  created_at    timestamptz    NOT NULL DEFAULT now(),  -- now() is timezone-aware in Postgres\n  settings      jsonb          NOT NULL DEFAULT '{}'    -- jsonb is indexable, json isn't\n);\n\nCREATE TABLE posts (\n  id          bigserial      PRIMARY KEY,\n  author_id   bigint         NOT NULL REFERENCES users(id) ON DELETE CASCADE,\n  -- ON DELETE CASCADE  delete a user, their posts go too  prevents orphan rows\n  title       text           NOT NULL CHECK (length(title) BETWEEN 1 AND 200),\n  -- CHECK  inline business rule  rejected at insert/update, no app code needed\n  body        text           NOT NULL,\n  published   boolean        NOT NULL DEFAULT false,\n  created_at  timestamptz    NOT NULL DEFAULT now()\n);"
          },
          {
            "type": "pros-cons",
            "goodLabel": "GOOD FOR",
            "watchLabel": "WATCH OUT FOR",
            "good": [
              "`NOT NULL` everywhere by default — opt INTO nullable, not out of",
              "`REFERENCES` on every FK — orphan rows are a class of bug, not a row",
              "`timestamptz` for any time you log or compare",
              "`CHECK` constraints for cheap business rules (price > 0, status IN (...))"
            ],
            "watch": [
              "`varchar(255)` cargo-culted from MySQL — Postgres `text` has no length penalty",
              "Storing booleans as `'Y'`/`'N'` text — use `boolean`",
              "Skipping `ON DELETE` — defaults to `NO ACTION`, deletes fail silently in odd ways",
              "Putting validation only in the ORM — bypassed by every direct SQL script you'll run"
            ]
          },
          {
            "type": "practice",
            "lang": "json",
            "prompt": "Sketch the columns + constraints you'd add to a `comments` table that belongs to a post and a user.",
            "varName": "comments_schema",
            "starter": "{\n  \"table\": \"comments\",\n  \"columns\": [\n    { \"name\": \"id\",         \"type\": \"bigserial\", \"constraints\": [\"PRIMARY KEY\"] },\n    { \"name\": \"post_id\",    \"type\": \"bigint\",    \"constraints\": [\"NOT NULL\", \"REFERENCES posts(id) ON DELETE CASCADE\"] },\n    { \"name\": \"author_id\",  \"type\": \"bigint\",    \"constraints\": [\"NOT NULL\", \"REFERENCES users(id)\"] },\n    { \"name\": \"body\",       \"type\": \"text\",      \"constraints\": [\"NOT NULL\", \"CHECK (length(body) > 0)\"] },\n    { \"name\": \"created_at\", \"type\": \"timestamptz\",\"constraints\": [\"NOT NULL\", \"DEFAULT now()\"] }\n  ]\n}\n",
            "hint": "Think about what should never be null, what should cascade on delete, and what's a sensible default. Resist adding a `varchar(255)`."
          },
          {
            "type": "quote",
            "text": "Constrain it in the database, or you don't have a constraint — you have a hope.",
            "cite": "anyone who's debugged orphan rows at 2am"
          }
        ]
      }
    ]
  },
  "fs-sql-essentials": {
    "sections": [
      {
        "heading": "SELECT is just five clauses",
        "body": [
          {
            "type": "p",
            "text": "**Every SQL query is the same six-keyword skeleton**: `SELECT … FROM … WHERE … GROUP BY … HAVING … ORDER BY … LIMIT`. Master that order and 90% of queries write themselves."
          },
          {
            "type": "p",
            "text": "**The trick is reading them in execution order, not write order.** Postgres runs `FROM` first (gather rows), then `WHERE` (filter rows), then `GROUP BY` (collapse rows), then `HAVING` (filter groups), then `SELECT` (compute output), then `ORDER BY` + `LIMIT`. Knowing this fixes most \"why didn't my filter work\" bugs."
          },
          {
            "type": "p",
            "text": "**`WHERE` filters rows, `HAVING` filters groups.** If you want to keep only posts with more than 10 likes, that's `HAVING count(*) > 10`. If you want to skip drafts, that's `WHERE published = true`. They are not interchangeable."
          }
        ]
      },
      {
        "heading": "INNER vs LEFT — when each is wrong",
        "body": [
          {
            "type": "p",
            "text": "**INNER JOIN drops rows.** If you join `users` to `posts` with `INNER`, a user who never posted vanishes from the result. Half of all dashboard bugs are an INNER JOIN that should have been LEFT."
          },
          {
            "type": "p",
            "text": "**LEFT JOIN keeps the left side, even with no match.** Use it when the left table is the thing you're counting (users, customers, sessions). Then `count(p.id)` gives you 0 for the matchless rows, which is usually what a dashboard wants."
          },
          {
            "type": "table",
            "headers": ["Join", "Keeps", "Use when"],
            "rows": [
              ["`INNER JOIN`", "Rows in BOTH",      "Both sides must exist (orders + items)"],
              ["`LEFT JOIN`",  "All LEFT, match-or-null right", "Counting per user, including zero"],
              ["`FULL JOIN`",  "All from both",     "Reconciling two sources, rare in app code"],
              ["`CROSS JOIN`", "Cartesian product", "Almost never — usually a typo"]
            ]
          },
          {
            "type": "diagram",
            "title": "JOIN shapes",
            "subtitle": "INNER · LEFT · FULL",
            "height": 240,
            "nodes": [
              { "id": "u",     "label": "users",    "subtitle": "left table",  "accent": "earth", "x": 0.25, "y": 0.5 },
              { "id": "inner", "label": "INNER",    "subtitle": "intersection","accent": "fire",  "x": 0.35, "y": 0.85 },
              { "id": "left",  "label": "LEFT",     "subtitle": "users + null","accent": "water", "x": 0.65, "y": 0.85 },
              { "id": "p",     "label": "posts",    "subtitle": "right table", "accent": "earth", "x": 0.75, "y": 0.5 }
            ],
            "edges": [
              { "from": "u", "to": "inner", "kind": "solid",  "label": "match" },
              { "from": "u", "to": "left",  "kind": "dashed", "label": "all left" },
              { "from": "left", "to": "p",  "kind": "dashed", "label": "or null" }
            ]
          }
        ]
      },
      {
        "heading": "GROUP BY in anger",
        "body": [
          {
            "type": "p",
            "text": "**`GROUP BY` collapses rows by a key, and every selected column must either be in the GROUP BY or wrapped in an aggregate** (`count`, `sum`, `avg`, `max`, `min`). Postgres will reject the query if you violate this — saving you from MySQL-style mystery output."
          },
          {
            "type": "p",
            "text": "**Pagination is `LIMIT` + `OFFSET` for now**, but past a million rows you switch to keyset pagination (`WHERE id > :last_seen LIMIT 50`). OFFSET 100000 makes Postgres scan and discard 100k rows on every page click."
          },
          {
            "type": "code",
            "lang": "sql",
            "text": "-- posts per user, only users with 5+ posts, top 20\nSELECT\n  u.id,\n  u.display_name,\n  count(p.id) AS post_count                              -- aggregate  COUNT(NULL) is 0, not error\nFROM users u\nLEFT JOIN posts p ON p.author_id = u.id AND p.published  -- LEFT + condition on join, not WHERE\n                                                         --   moving it to WHERE turns LEFT into INNER\nWHERE u.created_at > now() - interval '90 days'          -- filters ROWS before grouping\nGROUP BY u.id, u.display_name                            -- every non-aggregate selected column\nHAVING count(p.id) >= 5                                  -- filters GROUPS, after aggregation\nORDER BY post_count DESC\nLIMIT 20;"
          },
          {
            "type": "pros-cons",
            "goodLabel": "GOOD FOR",
            "watchLabel": "WATCH OUT FOR",
            "good": [
              "Default to `LEFT JOIN` for dashboard counts — zero is data",
              "CTEs (`WITH x AS (…)`) when a query has 3+ steps — readability wins",
              "Aggregate filters go in `HAVING`, row filters in `WHERE` — never swap",
              "Always `ORDER BY` before `LIMIT` — without ORDER, ordering is undefined"
            ],
            "watch": [
              "`SELECT *` in production — column adds break clients, schema reads are slow",
              "`WHERE p.published` on a LEFT JOIN — silently demotes it to INNER",
              "`OFFSET 100000` — switch to keyset pagination",
              "`count(*)` vs `count(col)` — the second skips NULLs, the first doesn't"
            ]
          },
          {
            "type": "practice",
            "lang": "sql",
            "prompt": "Write a SELECT that returns each user and how many PUBLISHED posts they have, sorted by post count descending. Include users with zero posts.",
            "starter": "SELECT\n  u.id,\n  u.display_name,\n  count(p.id) AS published_posts\nFROM users u\nLEFT JOIN posts p\n  ON p.author_id = u.id\n  AND p.published = true\nGROUP BY u.id, u.display_name\nORDER BY published_posts DESC;\n",
            "hint": "The trick is putting `p.published = true` in the JOIN, not WHERE. Move it to WHERE and zero-post users disappear."
          },
          {
            "type": "quote",
            "text": "WHERE filters rows. HAVING filters groups. Mix them up and your dashboard lies.",
            "cite": "every analytics post-mortem ever"
          }
        ]
      }
    ]
  },
  "fs-orm-migrations": {
    "sections": [
      {
        "heading": "Why you reach for an ORM",
        "body": [
          {
            "type": "p",
            "text": "**An ORM is a typed wrapper around your tables.** It maps rows to objects, generates SQL, and — most importantly — gives your editor autocomplete for column names so you stop deploying typos. Prisma and Drizzle are the modern defaults; both are TypeScript-first."
          },
          {
            "type": "p",
            "text": "**Schema-first means you write the schema, the ORM generates the migration.** That's Prisma's model. Migration-first means you write the SQL migration, the ORM derives the schema. That's Drizzle's default. Pick one and stick to it."
          },
          {
            "type": "p",
            "text": "**The rule is: every change is a migration.** You never log into production and run `ALTER TABLE`. You write a migration file, commit it, deploy it, and every environment runs the same versioned change in the same order."
          }
        ]
      },
      {
        "heading": "Migrations vs db push",
        "body": [
          {
            "type": "p",
            "text": "**`prisma db push` skips the migration file and just sync the schema to the DB.** It's great for prototyping. It's a footgun in prod — there's no record of what changed, no way to roll forward consistently across environments."
          },
          {
            "type": "p",
            "text": "**Mature teams roll forward only.** A bad migration gets fixed by writing the NEXT migration that reverses it. \"Down\" migrations exist in the docs and almost never in practice — they're hard to write correctly and harder to test."
          },
          {
            "type": "table",
            "headers": ["Action", "Dev", "Prod"],
            "rows": [
              ["`prisma db push`",       "OK for sketches",       "Never"],
              ["`prisma migrate dev`",   "Generates + applies",   "Never (no apply in prod)"],
              ["`prisma migrate deploy`","No",                    "Yes — applies pending migrations"],
              ["Hand-edit a table",      "Never",                 "Never"]
            ]
          },
          {
            "type": "walkthrough",
            "title": "Migration flow",
            "why": "The schema is the truth, the migration is the audit log — that's why you never `ALTER TABLE` by hand in prod.",
            "nodes": [
              { "id": "schema", "label": "schema.prisma", "subtitle": "truth",       "accent": "sky",   "x": 0.30, "y": 0.5 },
              { "id": "mig",    "label": "migration",     "subtitle": "gen sql",     "accent": "water", "x": 0.70, "y": 0.5 },
              { "id": "deploy", "label": "deploy",        "subtitle": "ci runs",     "accent": "amber", "x": 0.30, "y": 0.85 },
              { "id": "db",     "label": "Postgres",      "subtitle": "applied",     "accent": "fire",  "x": 0.70, "y": 0.85 }
            ],
            "steps": [
              {
                "title": "You edit schema.prisma",
                "description": "The schema file is the single **source of truth** for your tables. You change the shape here, never the DB directly.",
                "activeNodes": ["schema"],
                "activeEdges": []
              },
              {
                "title": "Prisma diffs it into a migration",
                "description": "`prisma migrate dev` compares the schema to the last state and **generates a SQL migration file** — the exact change, in plain SQL.",
                "activeNodes": ["schema", "mig"],
                "activeEdges": [{ "from": "schema", "to": "mig", "label": "diff" }]
              },
              {
                "title": "You commit it; CI deploys",
                "description": "The migration is committed to git like code. CI runs `prisma migrate deploy`, so every environment applies the same versioned change.",
                "activeNodes": ["mig", "deploy"],
                "activeEdges": [{ "from": "mig", "to": "deploy", "label": "commit" }]
              },
              {
                "title": "Postgres applies the change",
                "description": "The migration runs against the real database. Schema and DB never drift — fix a bad one by writing the **next** migration, never editing this one.",
                "activeNodes": ["deploy", "db"],
                "activeEdges": [{ "from": "deploy", "to": "db", "label": "apply" }]
              }
            ]
          }
        ]
      },
      {
        "heading": "A Prisma schema, end to end",
        "body": [
          {
            "type": "p",
            "text": "**This is what schema-first looks like.** You describe the shape in `schema.prisma`, run `prisma migrate dev --name add_posts`, and Prisma writes a SQL migration file you commit. CI runs `prisma migrate deploy` on the prod DB; the schema and the DB never drift."
          },
          {
            "type": "p",
            "text": "**Datasource + generator** — the URL comes from env, the client is generated into `node_modules` and gets you typed queries for free."
          },
          {
            "type": "code",
            "lang": "javascript",
            "text": "// schema.prisma  the entire source of truth for your tables\ndatasource db {\n  provider = \"postgresql\"\n  url      = env(\"DATABASE_URL\")  // never hardcode  read from env\n}\n\ngenerator client {\n  provider = \"prisma-client-js\"  // generates the typed client into node_modules\n}"
          },
          {
            "type": "p",
            "text": "**Two models with a relation** — `User.posts` is navigation only (no column); `Post.author` carries the actual foreign key + cascade rule + composite index for the hot query."
          },
          {
            "type": "code",
            "lang": "javascript",
            "text": "model User {\n  id          BigInt   @id @default(autoincrement())\n  email       String   @unique                     // becomes UNIQUE INDEX in postgres\n  displayName String                                // camelCase here, snake_case in DB by default\n  createdAt   DateTime @default(now())\n  posts       Post[]                                // relation field  no column, just navigation\n}\n\nmodel Post {\n  id        BigInt   @id @default(autoincrement())\n  author    User     @relation(fields: [authorId], references: [id], onDelete: Cascade)\n  // onDelete: Cascade  same as SQL ON DELETE CASCADE  parent gone, children gone\n  authorId  BigInt                                  // the actual FK column\n  title     String\n  published Boolean  @default(false)\n  createdAt DateTime @default(now())\n\n  @@index([authorId, createdAt])                    // composite index for \"recent posts by user\"\n}"
          },
          {
            "type": "pros-cons",
            "goodLabel": "GOOD FOR",
            "watchLabel": "WATCH OUT FOR",
            "good": [
              "`prisma migrate dev` in dev, `prisma migrate deploy` in prod — one workflow per env",
              "Commit the generated migration SQL — it's the audit log",
              "Composite indexes via `@@index` for known hot queries",
              "Roll forward: bad change becomes the NEXT migration, not a down-migration"
            ],
            "watch": [
              "`prisma db push` in production — no migration history, no audit",
              "Editing an applied migration after it's run anywhere — checksum drift, deploy fails",
              "Dropping a column in the same migration the code stops using it — old pods crash",
              "ORM `findMany({ include: { posts: true } })` everywhere — that's N+1, next lesson"
            ]
          },
          {
            "type": "quote",
            "text": "Every change is a migration. You roll forward, never back. The DB is a ratchet, not a yo-yo.",
            "cite": "the migration discipline"
          }
        ]
      }
    ]
  },
  "fs-indexes-n-plus-one": {
    "sections": [
      {
        "heading": "Indexes in 90 seconds",
        "body": [
          {
            "type": "p",
            "text": "**An index is a sorted side-table the DB uses to find rows fast.** Without one, a query for `WHERE email = 'a@b.com'` scans the entire table. With a B-tree index on `email`, it's an O(log n) lookup — milliseconds even at millions of rows."
          },
          {
            "type": "p",
            "text": "**Every index speeds up reads and slows down writes.** Each `INSERT` and `UPDATE` has to update every index that touches the changed column. Five indexes on a hot table means every write does six disk writes. Don't add indexes you don't measure."
          },
          {
            "type": "p",
            "text": "**The two cheap wins**: index every foreign key column, and index any column you `WHERE` on or `ORDER BY` in a hot query. PRIMARY KEY and UNIQUE constraints already get one for free."
          }
        ]
      },
      {
        "heading": "Index or no index",
        "body": [
          {
            "type": "p",
            "text": "**Use `EXPLAIN ANALYZE` to see what Postgres actually did**, not what you hoped. \"Seq Scan\" on a million-row table means no usable index. \"Index Scan\" or \"Bitmap Index Scan\" means the planner found one."
          },
          {
            "type": "table",
            "headers": ["Query", "No index", "With B-tree"],
            "rows": [
              ["`WHERE id = 42`",      "Seq scan, 1M rows", "Index, ~3 nodes"],
              ["`WHERE email = '…'`",  "Seq scan",          "Index, O(log n)"],
              ["`ORDER BY created_at LIMIT 20`", "Sort all rows", "Index walk, 20 rows"],
              ["`WHERE name LIKE '%bo%'`",       "Seq scan",      "Still seq scan — leading `%`"]
            ]
          },
          {
            "type": "diagram",
            "title": "N+1 vs eager-load",
            "subtitle": "1 USER LIST · N POST FETCHES",
            "height": 260,
            "nodes": [
              { "id": "client", "label": "API",       "subtitle": "list users",      "accent": "sky",   "x": 0.12, "y": 0.5 },
              { "id": "q1",     "label": "Query 1",   "subtitle": "select * users",  "accent": "water", "x": 0.36, "y": 0.25 },
              { "id": "qn",     "label": "Query N",   "subtitle": "per-user posts",  "accent": "water", "x": 0.36, "y": 0.75 },
              { "id": "idx",    "label": "Index",     "subtitle": "on author_id",    "accent": "amber", "x": 0.62, "y": 0.5 },
              { "id": "pg",     "label": "Postgres",  "subtitle": "1 + n round-trips","accent": "fire", "x": 0.88, "y": 0.5 }
            ],
            "edges": [
              { "from": "client", "to": "q1",  "kind": "solid",  "label": "1x" },
              { "from": "client", "to": "qn",  "kind": "dashed", "label": "Nx" },
              { "from": "q1",     "to": "idx", "kind": "solid",  "label": "lookup" },
              { "from": "qn",     "to": "idx", "kind": "solid",  "label": "lookup" },
              { "from": "idx",    "to": "pg",  "kind": "solid",  "label": "rows" }
            ]
          }
        ]
      },
      {
        "heading": "Spotting and killing N+1",
        "body": [
          {
            "type": "p",
            "text": "**N+1 is the most common cause of a slow list page.** You fetch a list of N users (1 query), then loop and fetch each user's posts (N queries). Total: N+1 round trips, each one a network hop."
          },
          {
            "type": "p",
            "text": "**The fix is one of three things.** A JOIN that pulls users + posts in one query. An ORM `include` / `with` that does the same under the hood. A dataloader that batches the N follow-ups into one `WHERE author_id IN (…)` call."
          },
          {
            "type": "code",
            "lang": "javascript",
            "text": "// the N+1 bug, the fix, and the proof\n\n// BAD  1 query for users, then N queries for their posts\nconst users = await prisma.user.findMany({ take: 50 });\nfor (const u of users) {\n  // every iteration is a new round trip to the DB  death by latency\n  u.posts = await prisma.post.findMany({ where: { authorId: u.id } });\n}\n\n// GOOD  1 query, ORM does a JOIN-ish lookup under the hood\nconst users = await prisma.user.findMany({\n  take: 50,\n  include: { posts: true },  // prisma fires 1 select for users, 1 IN(...) for all posts  = 2 queries total\n});\n\n// GOOD  raw SQL when you want full control\n-- one round trip, indexed lookup\nSELECT u.id, u.display_name, p.id AS post_id, p.title\nFROM users u\nLEFT JOIN posts p ON p.author_id = u.id  -- index on posts(author_id) makes this O(log n) per user\nWHERE u.id = ANY($1::bigint[])           -- pass the 50 ids as one array param\nORDER BY u.id, p.created_at DESC;"
          },
          {
            "type": "pros-cons",
            "goodLabel": "GOOD FOR",
            "watchLabel": "WATCH OUT FOR",
            "good": [
              "Index every foreign key — and every column you filter or sort on in a hot query",
              "`EXPLAIN ANALYZE` before you add an index — measure, don't guess",
              "ORM `include`/`with` / `selectinload` to flatten the obvious N+1 cases",
              "Composite index for the common (filter + order) combo, not one per column"
            ],
            "watch": [
              "Indexing every column \"just in case\" — every write now pays for them",
              "`LIKE '%foo%'` — leading wildcard kills B-tree, you need `pg_trgm` or full-text",
              "An ORM `include` inside a loop — that's N+1 in disguise",
              "Indexes on tiny tables — the seq scan was already fast, the index just adds write cost"
            ]
          },
          {
            "type": "quote",
            "text": "Your slow page is usually N+1. Your second-slowest is a missing index on a foreign key.",
            "cite": "every backend perf review"
          },
          {
            "type": "explain-back",
            "prompt": "A `/users` list page that also shows each user's recent posts takes 3 seconds. You have three tools: **`EXPLAIN ANALYZE`**, **indexes** (which speed reads but tax writes), and **eager-loading** (JOIN / ORM `include`) to kill **N+1**. Lay out the order you'd apply them to diagnose and fix this page, and name the trade-off that stops you from just indexing everything.",
            "modelAnswer": "Diagnose before you touch anything: this is almost certainly N+1 — 1 query for the user list plus N queries for each user's posts — so I'd confirm by counting queries or watching the query log, not by guessing. The first fix is structural, not an index: collapse the N+1 with eager-loading — a `LEFT JOIN posts ON posts.author_id = users.id` or an ORM `include`, turning 1+N round trips into 1 (or 2) queries. Then I run `EXPLAIN ANALYZE` on that one query: if I see a `Seq Scan` on `posts`, the JOIN is scanning the whole posts table per user, so I add a B-tree index on the foreign key `posts(author_id)` — that's the single highest-value index here, turning each lookup into O(log n). I'd re-run `EXPLAIN ANALYZE` to confirm it flipped to an Index Scan and the time dropped. The trade-off that stops me from indexing every column: every index makes reads faster but taxes *writes* — each INSERT/UPDATE must maintain every index touching that column — so I only index FKs and the columns this hot query actually filters or orders on, and I measure with EXPLAIN rather than adding indexes 'just in case.' The integration insight: fixing the round-trip count (N+1) and fixing per-query speed (indexes) are different problems, and you must do them in that order — a perfect index on a query you run N times is still N round trips.",
            "hint": "Fix the round-trip count first (N+1), then make the remaining query fast (index the FK), measuring with EXPLAIN at each step."
          }
        ]
      }
    ]
  },
  "fs-password-hashing": {
    "sections": [
      {
        "heading": "Why fast hashes are the wrong tool",
        "body": [
          {
            "type": "p",
            "text": "**MD5 and SHA-256 are *too fast* for passwords.** A modern GPU can try billions of SHA-256 hashes per second — a leaked database becomes a cracking exercise overnight. Password hashing needs to be *intentionally slow* so brute-force is uneconomical."
          },
          {
            "type": "p",
            "text": "**The three modern defaults are `bcrypt`, `Argon2`, and `scrypt`.** All three accept a tunable *work factor* (or memory cost) that you crank up as hardware gets faster. The point isn't secrecy — it's making each guess expensive."
          },
          {
            "type": "p",
            "text": "**Never store plaintext. Never email a reset link that contains the password.** If you can show a user their old password, you have already lost. The reset flow should mint a single-use token, not reveal what was stored."
          }
        ]
      },
      {
        "heading": "Salt, pepper, and the work factor",
        "body": [
          {
            "type": "p",
            "text": "**The salt is a unique random value per user**, stored alongside the hash. It defeats rainbow tables and makes two users with the same password hash to different outputs. Every modern algo handles the salt for you — don't try to be clever."
          },
          {
            "type": "p",
            "text": "**The pepper is an app-wide secret**, kept out of the database. If the DB leaks but the pepper doesn't, every hash becomes worthless to the attacker. It's defense-in-depth, not a replacement for salt."
          },
          {
            "type": "table",
            "headers": ["Algorithm", "Knob", "Default in 2026"],
            "rows": [
              ["`bcrypt`",  "`cost` (work factor)",  "12 — ~250ms per hash"],
              ["`Argon2id`","memory + iterations",   "64MB · 3 iters · 4 threads"],
              ["`scrypt`",  "`N`, `r`, `p`",          "N=2^17 · r=8 · p=1"],
              ["`SHA-256`", "(none — too fast)",     "Never for passwords"]
            ]
          },
          {
            "type": "diagram",
            "title": "Login hash check",
            "subtitle": "BROWSER · API · STORE",
            "height": 240,
            "nodes": [
              { "id": "client", "label": "Browser", "subtitle": "PASSWORD POST", "accent": "sky",   "x": 0.12, "y": 0.5 },
              { "id": "api",    "label": "API",     "subtitle": "BCRYPT COMPARE", "accent": "fire",  "x": 0.40, "y": 0.5 },
              { "id": "pepper", "label": "Pepper",  "subtitle": "APP SECRET",    "accent": "amber", "x": 0.66, "y": 0.2 },
              { "id": "db",     "label": "Users",   "subtitle": "HASH + SALT",   "accent": "earth", "x": 0.88, "y": 0.5 }
            ],
            "edges": [
              { "from": "client", "to": "api",    "kind": "solid",  "label": "post" },
              { "from": "api",    "to": "pepper", "kind": "dashed", "label": "mix in" },
              { "from": "api",    "to": "db",     "kind": "solid",  "label": "fetch" },
              { "from": "db",     "to": "api",    "kind": "dashed", "label": "hash",  "curve": -0.3 }
            ]
          }
        ]
      },
      {
        "heading": "Bcrypt in Node, the right way",
        "body": [
          {
            "type": "p",
            "text": "**Use the library's `hash` and `compare` — never reimplement.** `bcrypt.compare` is timing-safe; a `===` on hashes is not. The cost factor lives in the hash string itself, so old hashes verify fine after you bump it for new users."
          },
          {
            "type": "code",
            "lang": "javascript",
            "text": "// auth.js  bcrypt with a cost factor and an app-wide pepper\nimport bcrypt from 'bcrypt';\n\nconst COST = 12;  // ~250ms per hash on a modern CPU  tune for your traffic\nconst PEPPER = process.env.PASSWORD_PEPPER;  // 32+ random bytes  never in git\n\nfunction season(plain) {\n  // HMAC the password with the pepper before bcrypt  DB leak alone is useless\n  return crypto.createHmac('sha256', PEPPER).update(plain).digest('base64');\n}\n\nexport async function hashPassword(plain) {\n  const seasoned = season(plain);\n  return bcrypt.hash(seasoned, COST);  // bcrypt picks the salt  embeds cost in the output\n}\n\nexport async function verifyPassword(plain, stored) {\n  const seasoned = season(plain);\n  return bcrypt.compare(seasoned, stored);  // constant-time compare  no timing leak\n}\n\n// usage at login\nconst row = await db.user.findUnique({ where: { email } });\nif (!row || !(await verifyPassword(body.password, row.passwordHash))) {\n  // SAME error for missing user and wrong password  no enumeration\n  return res.status(401).json({ error: 'invalid credentials' });\n}"
          },
          {
            "type": "pros-cons",
            "goodLabel": "GOOD FOR",
            "watchLabel": "WATCH OUT FOR",
            "good": [
              "`bcrypt` cost 12+ or `argon2id` — pick one and stick to it",
              "Pepper in env / KMS, never in the same store as the hashes",
              "Same 401 for unknown email and wrong password — no user enumeration",
              "Re-hash on login if the stored cost is below your current floor"
            ],
            "watch": [
              "`md5` / `sha1` / plain `sha256` for passwords — too fast, GPU-cracked in hours",
              "Rolling your own salt logic — bcrypt/Argon2 embed it for you",
              "Emailing the password back on reset — proves you stored it recoverably",
              "`===` on hashes — leaks timing, use the library's `compare`"
            ]
          },
          {
            "type": "practice",
            "lang": "python",
            "prompt": "Use the `bcrypt` library to hash 'hunter2' with cost=12, then verify the hash. Print the salt embedded in the output.",
            "starter": "import bcrypt\n\npassword = b'hunter2'\n\n# hash with cost=12  bcrypt generates the salt for you\nhashed = bcrypt.hashpw(password, bcrypt.gensalt(rounds=12))\nprint('stored:', hashed.decode())\n\n# the cost and salt are embedded in the first 29 chars of the hash  $2b$12$<salt>...\nprint('salt segment:', hashed[:29].decode())\n\n# verify  always use checkpw, never compare strings\nassert bcrypt.checkpw(password, hashed)\nassert not bcrypt.checkpw(b'wrong', hashed)\n",
            "hint": "Notice the `$2b$12$` prefix — that's `<algo>$<cost>$<salt>`. Bumping cost only changes new hashes; old ones still verify."
          },
          {
            "type": "quote",
            "text": "If your hash function is fast, it's wrong. If you stored the password recoverably, you didn't store a password — you stored a liability.",
            "cite": "every post-breach forensic report"
          }
        ]
      }
    ]
  },
  "fs-sessions-vs-jwt": {
    "sections": [
      {
        "heading": "Two ways to remember a user",
        "body": [
          {
            "type": "p",
            "text": "**After login you need to remember *who* the user is on every subsequent request.** Two camps: server-side **sessions** (the server keeps the state, the cookie carries just an ID) and **JWTs** (the token *is* the state, signed so the server can trust it without a lookup)."
          },
          {
            "type": "p",
            "text": "**Sessions are stateful, JWTs are stateless.** That single fact drives every tradeoff that follows — revocation cost, scaling shape, secret management, and the size of every request header."
          },
          {
            "type": "p",
            "text": "**Most apps should still use sessions.** Cookies + a session store (Redis or Postgres) is boring, secure, and easy to revoke. JWTs shine for service-to-service auth and short-lived access tokens — not for your average web app."
          }
        ]
      },
      {
        "heading": "The revocation problem",
        "body": [
          {
            "type": "p",
            "text": "**Logging a user out of a session is easy — you delete the row in the store.** Logging them out of a JWT is hard. The token is self-contained and signed; the server can't \"un-issue\" it. You either wait for it to expire, or you maintain a *blocklist* — which is just a stateful session in disguise."
          },
          {
            "type": "p",
            "text": "**Refresh tokens are the compromise.** Short-lived access JWT (5–15 min) plus a long-lived refresh token stored in a DB. The access token can't be revoked, but it's already almost expired. The refresh token *can* be revoked, so logout works."
          },
          {
            "type": "table",
            "headers": ["Axis", "Sessions", "JWT"],
            "rows": [
              ["Storage",     "Server (Redis / DB)", "Client (cookie / header)"],
              ["Revoke",      "Delete the row — instant", "Wait for expiry or blocklist"],
              ["Scaling",     "Need a shared session store", "Stateless — any node can verify"],
              ["Size on wire","32-byte ID",          "200–2000 bytes per request"]
            ]
          },
          {
            "type": "diagram",
            "title": "Session vs JWT path",
            "subtitle": "BROWSER · API · STORE",
            "height": 260,
            "nodes": [
              { "id": "browser", "label": "Browser", "subtitle": "COOKIE", "accent": "sky",   "x": 0.10, "y": 0.5 },
              { "id": "api",     "label": "API",     "subtitle": "VERIFY", "accent": "fire",  "x": 0.38, "y": 0.5 },
              { "id": "session", "label": "Session", "subtitle": "REDIS LOOKUP", "accent": "amber", "x": 0.68, "y": 0.25 },
              { "id": "jwt",     "label": "JWT",     "subtitle": "SIG CHECK ONLY", "accent": "water", "x": 0.68, "y": 0.75 },
              { "id": "db",      "label": "Users",   "subtitle": "ROW",    "accent": "earth", "x": 0.92, "y": 0.5 }
            ],
            "edges": [
              { "from": "browser", "to": "api",     "kind": "solid",  "label": "request" },
              { "from": "api",     "to": "session", "kind": "solid",  "label": "stateful" },
              { "from": "api",     "to": "jwt",     "kind": "dashed", "label": "stateless" },
              { "from": "session", "to": "db",      "kind": "solid",  "label": "user" },
              { "from": "jwt",     "to": "db",      "kind": "dashed", "label": "no fetch", "curve": 0.3 }
            ]
          },
          {
            "type": "walkthrough",
            "title": "JWT issue → verify",
            "caption": "How the stateless path works on every subsequent request.",
            "nodes": [
              { "id": "client", "label": "Client", "subtitle": "BROWSER",        "accent": "sky",   "x": 0.15, "y": 0.5 },
              { "id": "server", "label": "Server", "subtitle": "API",            "accent": "fire",  "x": 0.85, "y": 0.5 }
            ],
            "steps": [
              {
                "title": "Client submits credentials",
                "description": "User types email + password. The client POSTs to /login over TLS. This is the only time the password is on the wire.",
                "activeNodes": ["client", "server"],
                "activeEdges": [{ "from": "client", "to": "server", "label": "POST /login" }]
              },
              {
                "title": "Server validates + signs JWT",
                "description": "Server checks the password hash with Argon2/bcrypt, then signs a JWT containing `{ sub, iat, exp }` with its secret key. No DB row created — the token IS the state.",
                "activeNodes": ["server"],
                "activeEdges": []
              },
              {
                "title": "Server returns JWT in response",
                "description": "JWT comes back in the response body. Client stores it (ideally in an HttpOnly cookie — never localStorage, which XSS can read).",
                "activeNodes": ["server", "client"],
                "activeEdges": [{ "from": "server", "to": "client", "label": "200 + jwt" }]
              },
              {
                "title": "Client sends JWT in Authorization header",
                "description": "On every subsequent call the client attaches `Authorization: Bearer <jwt>`. The token travels with the request, not in a session ID.",
                "activeNodes": ["client", "server"],
                "activeEdges": [{ "from": "client", "to": "server", "label": "Bearer <jwt>" }]
              },
              {
                "title": "Server verifies signature, allows request",
                "description": "Server verifies the signature using its secret — pure crypto, no DB lookup. If the signature checks and `exp` hasn't passed, the request proceeds. This is the whole stateless-scaling pitch.",
                "activeNodes": ["server"],
                "activeEdges": []
              }
            ]
          }
        ]
      },
      {
        "heading": "Picking, and wiring it up",
        "body": [
          {
            "type": "p",
            "text": "**Default to sessions for first-party web apps.** Reach for JWTs when you need cross-domain auth (mobile + web + service-to-service), or when you can't afford a session lookup on every call. Even then, keep them short and pair with a refresh token."
          },
          {
            "type": "p",
            "text": "**Sessions** — the cookie carries a random id, Redis stores everything else. Logout just deletes the row."
          },
          {
            "type": "code",
            "lang": "javascript",
            "text": "// auth.js  sessions  cookie carries a random id, redis stores everything else\nimport session from 'express-session';\nimport RedisStore from 'connect-redis';\n\napp.use(session({\n  store: new RedisStore({ client: redis }),\n  secret: process.env.SESSION_SECRET,    // signs the cookie  never in git\n  resave: false,                          // do not save if unmodified  redis already persists\n  saveUninitialized: false,               // do not create a session until something is stored\n  cookie: {\n    httpOnly: true,                       // JS cannot read it  XSS cannot steal it\n    secure: true,                         // https only  set false in local dev\n    sameSite: 'lax',                      // CSRF mitigation  see csrf lesson\n    maxAge: 1000 * 60 * 60 * 24 * 7,      // 7 days  rolling refreshed on each request\n  },\n}));"
          },
          {
            "type": "p",
            "text": "**JWT** — no store, the signature is the proof. Pair short access tokens with a refresh token whose `jti` lives in the DB so you keep a revocation handle."
          },
          {
            "type": "code",
            "lang": "javascript",
            "text": "// auth.js  JWT  no store, signature is the proof\nimport jwt from 'jsonwebtoken';\n\nconst ACCESS_TTL = '15m';\nconst REFRESH_TTL = '30d';\n\nfunction issueTokens(userId) {\n  const access = jwt.sign({ sub: userId }, process.env.JWT_SECRET, { expiresIn: ACCESS_TTL });\n  const refresh = jwt.sign({ sub: userId, typ: 'refresh' }, process.env.JWT_SECRET, { expiresIn: REFRESH_TTL });\n  // store refresh.jti in DB  THIS is your revocation handle\n  return { access, refresh };\n}\n\nfunction requireAuth(req, res, next) {\n  try {\n    const token = req.headers.authorization?.replace('Bearer ', '');\n    req.user = jwt.verify(token, process.env.JWT_SECRET);  // throws on bad sig or expiry\n    next();\n  } catch {\n    res.status(401).json({ error: 'invalid token' });\n  }\n}"
          },
          {
            "type": "pros-cons",
            "goodLabel": "GOOD FOR",
            "watchLabel": "WATCH OUT FOR",
            "good": [
              "Sessions for first-party web apps — boring, revocable, well-trodden",
              "JWT access tokens for service-to-service — short TTL, no lookup",
              "Refresh token in DB — gives you a revocation handle for JWTs",
              "`HttpOnly` + `Secure` cookies for everything that touches auth"
            ],
            "watch": [
              "Storing JWTs in `localStorage` — any XSS exfils them in one line",
              "Long-lived JWTs without a revocation strategy — logout becomes a lie",
              "`alg: \"none\"` accepted by the verifier — pin the algorithm in `verify`",
              "Putting sensitive PII in the JWT payload — it's base64, not encrypted"
            ]
          },
          {
            "type": "practice",
            "lang": "json",
            "prompt": "Sketch a decoded JWT for a user with id 42, the 'editor' role, issued now and expiring in 15 minutes. Use the standard claim names.",
            "starter": "{\n  \"header\": {\n    \"alg\": \"HS256\",\n    \"typ\": \"JWT\"\n  },\n  \"payload\": {\n    \"sub\": \"42\",\n    \"role\": \"editor\",\n    \"iat\": 1748793600,\n    \"exp\": 1748794500,\n    \"iss\": \"https://api.example.com\",\n    \"aud\": \"web-app\"\n  },\n  \"signature\": \"<base64url HMAC-SHA256 of header.payload>\"\n}\n",
            "hint": "Standard claim names: `sub` (subject), `iat` (issued at), `exp` (expiry), `iss` (issuer), `aud` (audience). All times are Unix seconds, not ms."
          },
          {
            "type": "quote",
            "text": "JWTs are a bearer token. Lose it and you've lost the user. Sessions delete in one query. Choose the one that matches the blast radius you can live with.",
            "cite": "every auth post-mortem"
          }
        ]
      }
    ]
  },
  "fs-oauth-oidc": {
    "sections": [
      {
        "heading": "Four roles and a code",
        "body": [
          {
            "type": "p",
            "text": "**OAuth 2.0 is a delegation protocol.** It lets a user (the *resource owner*) grant your app (the *client*) limited access to their data on another service (the *resource server*) — without ever handing you the password. The whole dance is mediated by the *authorization server*."
          },
          {
            "type": "p",
            "text": "**OIDC = OAuth + identity.** Plain OAuth gives you an *access token* — a key to call APIs. OIDC layers an *ID token* on top — a signed JWT that says *who* the user is. \"Sign in with Google\" is OIDC; \"give my app access to Google Drive\" is OAuth."
          },
          {
            "type": "p",
            "text": "**Use the Authorization Code flow with PKCE.** Every other flow (implicit, password grant) is deprecated. PKCE means the client proves possession of a one-time secret, so a stolen authorization code is useless on its own."
          }
        ]
      },
      {
        "heading": "ID token vs access token vs scopes",
        "body": [
          {
            "type": "p",
            "text": "**The ID token is for *you*. The access token is for the API.** Validate the ID token's signature once at login to identify the user. Forward the access token (opaque to you) when calling the resource server."
          },
          {
            "type": "table",
            "headers": ["Token", "Audience", "Purpose"],
            "rows": [
              ["ID token",       "Your app",          "Who the user is (JWT, validate sig)"],
              ["Access token",   "Resource server",   "What they can do (often opaque)"],
              ["Refresh token",  "Auth server only",  "Mint new access tokens silently"],
              ["Authz code",     "Token endpoint",    "Single-use, swapped for the above"]
            ]
          },
          {
            "type": "diagram",
            "title": "Authorization code + PKCE",
            "subtitle": "BROWSER · AUTH · CALLBACK",
            "height": 300,
            "nodes": [
              { "id": "browser",  "label": "Browser",  "subtitle": "USER AGENT",    "accent": "sky",   "x": 0.12, "y": 0.25 },
              { "id": "app",      "label": "Your app", "subtitle": "CLIENT",        "accent": "water", "x": 0.12, "y": 0.75 },
              { "id": "authz",    "label": "Authz",    "subtitle": "GOOGLE / OKTA", "accent": "fire",  "x": 0.50, "y": 0.5 },
              { "id": "token",    "label": "Token",    "subtitle": "EXCHANGE",      "accent": "amber", "x": 0.78, "y": 0.5 },
              { "id": "api",      "label": "API",      "subtitle": "RESOURCE",      "accent": "earth", "x": 0.92, "y": 0.85 }
            ],
            "edges": [
              { "from": "browser", "to": "authz", "kind": "solid",  "label": "1 redirect" },
              { "from": "authz",   "to": "app",   "kind": "solid",  "label": "2 code",   "curve": 0.3 },
              { "from": "app",     "to": "token", "kind": "solid",  "label": "3 code+pkce" },
              { "from": "token",   "to": "app",   "kind": "dashed", "label": "4 tokens", "curve": -0.3 },
              { "from": "app",     "to": "api",   "kind": "solid",  "label": "5 access" }
            ]
          },
          {
            "type": "sequence",
            "title": "Auth Code + PKCE — message order",
            "caption": "User taps Sign-in; six round-trips later the app calls the API.",
            "actors": [
              { "id": "user",  "label": "User",     "accent": "sky" },
              { "id": "app",   "label": "App",      "accent": "water" },
              { "id": "authz", "label": "Authz",    "accent": "fire" },
              { "id": "api",   "label": "Resource", "accent": "earth" }
            ],
            "events": [
              { "from": "user",  "to": "app",   "label": "Tap sign-in" },
              { "from": "app",   "to": "user",  "label": "Redirect + challenge", "note": "SHA-256 of verifier" },
              { "from": "user",  "to": "authz", "label": "Login + consent" },
              { "from": "authz", "to": "user",  "label": "Redirect with code" },
              { "from": "user",  "to": "app",   "label": "Callback + code" },
              { "from": "app",   "to": "authz", "label": "Code + verifier",      "note": "token endpoint" },
              { "from": "app",   "to": "api",   "label": "Bearer access" }
            ]
          },
          {
            "type": "walkthrough",
            "title": "OAuth 2.0 + PKCE handshake",
            "caption": "Six steps from the Sign-in tap to your first API call.",
            "nodes": [
              { "id": "user",     "label": "User",     "subtitle": "BROWSER",     "accent": "sky",   "x": 0.10, "y": 0.20 },
              { "id": "app",      "label": "App",      "subtitle": "CLIENT",      "accent": "water", "x": 0.10, "y": 0.80 },
              { "id": "authz",    "label": "Authz",    "subtitle": "IDP",         "accent": "fire",  "x": 0.55, "y": 0.50 },
              { "id": "resource", "label": "Resource", "subtitle": "API",         "accent": "earth", "x": 0.92, "y": 0.50 }
            ],
            "steps": [
              {
                "title": "User taps \"Sign in with provider\"",
                "description": "User clicks the Sign-in button rendered by the app. Nothing leaves the user's machine yet — the app is about to assemble the redirect URL.",
                "activeNodes": ["user", "app"],
                "activeEdges": [{ "from": "user", "to": "app", "label": "click" }]
              },
              {
                "title": "App generates PKCE verifier + challenge",
                "description": "App rolls a 32-byte random `code_verifier`, stores it in the session, then sends `SHA-256(verifier)` as the `code_challenge`. PKCE means a stolen code is useless without the verifier.",
                "activeNodes": ["app"],
                "activeEdges": []
              },
              {
                "title": "App redirects user to authorization server",
                "description": "Browser is redirected to the IDP (Google, Okta, …) with `client_id`, `redirect_uri`, `scope`, `state`, and the `code_challenge`. User logs in there.",
                "activeNodes": ["app", "authz"],
                "activeEdges": [{ "from": "app", "to": "authz", "label": "redirect + challenge" }]
              },
              {
                "title": "User authorizes; authz returns code via redirect",
                "description": "User clicks Allow on the IDP's consent screen. IDP redirects the browser back to the app's `redirect_uri` with a single-use `code` and the same `state` you sent.",
                "activeNodes": ["authz", "user", "app"],
                "activeEdges": [
                  { "from": "authz", "to": "user", "label": "consent + code" },
                  { "from": "user", "to": "app", "label": "callback" }
                ]
              },
              {
                "title": "App exchanges code + verifier for tokens",
                "description": "App POSTs to the IDP's token endpoint with `code`, `code_verifier`, and (server-side) `client_secret`. IDP returns `access_token`, `id_token`, and a `refresh_token`.",
                "activeNodes": ["app", "authz"],
                "activeEdges": [{ "from": "app", "to": "authz", "label": "code + verifier" }]
              },
              {
                "title": "App calls resource API with access token",
                "description": "App attaches `Authorization: Bearer <access_token>` and finally calls the resource server. The user's password never touched your servers.",
                "activeNodes": ["app", "resource"],
                "activeEdges": [{ "from": "app", "to": "resource", "label": "Bearer <access>" }]
              }
            ]
          }
        ]
      },
      {
        "heading": "Don't roll your own — but know the flow",
        "body": [
          {
            "type": "p",
            "text": "**Use a library: `passport-google-oauth20`, `next-auth`, or your IDP's SDK.** Every step below has a security pitfall — PKCE verifier handling, state-parameter validation, redirect URI exact-match, token storage. The libraries get all of this right."
          },
          {
            "type": "p",
            "text": "**Scopes are how you ask for less.** `openid email profile` is enough for sign-in. `drive.readonly` is enough to *read* Drive files. Asking for `drive` (full access) on a read-only app is how user trust dies."
          },
          {
            "type": "p",
            "text": "**Step 1 — `/auth/login`** generates a fresh PKCE verifier + `state` token, stores both in the session, and redirects to the IDP."
          },
          {
            "type": "code",
            "lang": "javascript",
            "text": "// oauth.js  authorization code + PKCE  three endpoints in your app\nimport crypto from 'crypto';\nimport { URLSearchParams } from 'url';\n\n// 1) start  redirect user to the IDP with a PKCE challenge\napp.get('/auth/login', (req, res) => {\n  const verifier = crypto.randomBytes(32).toString('base64url');  // secret kept in session\n  const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');\n  const state = crypto.randomBytes(16).toString('base64url');     // CSRF defense for the redirect\n\n  req.session.pkce = { verifier, state };  // store both for the callback\n\n  const params = new URLSearchParams({\n    response_type: 'code',\n    client_id: process.env.OAUTH_CLIENT_ID,\n    redirect_uri: 'https://app.example.com/auth/callback',  // MUST be in the IDP allowlist\n    scope: 'openid email profile',                          // smallest set that works\n    state,\n    code_challenge: challenge,\n    code_challenge_method: 'S256',\n  });\n  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);\n});"
          },
          {
            "type": "p",
            "text": "**Step 2 — `/auth/callback`** validates `state` (CSRF), swaps the code + verifier for tokens, then verifies the ID token before trusting any claims."
          },
          {
            "type": "code",
            "lang": "javascript",
            "text": "// 2) callback  swap the code + verifier for tokens\napp.get('/auth/callback', async (req, res) => {\n  const { code, state } = req.query;\n  const saved = req.session.pkce;\n  if (!saved || state !== saved.state) return res.status(400).send('state mismatch');  // CSRF block\n\n  const tokens = await fetch('https://oauth2.googleapis.com/token', {\n    method: 'POST',\n    body: new URLSearchParams({\n      grant_type: 'authorization_code',\n      code,\n      code_verifier: saved.verifier,    // PKCE  proves we are the same client that started the flow\n      redirect_uri: 'https://app.example.com/auth/callback',\n      client_id: process.env.OAUTH_CLIENT_ID,\n      client_secret: process.env.OAUTH_CLIENT_SECRET,  // server-side only\n    }),\n  }).then((r) => r.json());\n\n  // tokens.id_token is a JWT  verify signature against the IDP JWKS  then trust the claims\n  // tokens.access_token is opaque  forward it to the resource server, never log it\n  req.session.user = await verifyIdToken(tokens.id_token);\n  res.redirect('/');\n});"
          },
          {
            "type": "pros-cons",
            "goodLabel": "GOOD FOR",
            "watchLabel": "WATCH OUT FOR",
            "good": [
              "Authorization Code + PKCE — the only flow you should be writing in 2026",
              "Smallest scope set — `openid email profile` for sign-in, nothing more",
              "Validate the `state` parameter — it's CSRF protection for the redirect",
              "A vetted library (`next-auth`, `passport`, IDP SDK) — never hand-roll"
            ],
            "watch": [
              "Implicit flow / password grant — both deprecated, both leak tokens",
              "Skipping ID-token signature validation — trusting unsigned claims",
              "Wildcard redirect URIs in the IDP — opens redirect attacks",
              "Asking for `drive` when you need `drive.readonly` — users see the prompt and bounce"
            ]
          },
          {
            "type": "quote",
            "text": "OAuth is a delegation protocol, not an authentication protocol. If you only need to know who someone is — that's OIDC. And you should not be writing either from scratch.",
            "cite": "Justin Richer, *OAuth 2 in Action*"
          }
        ]
      }
    ]
  },
  "fs-csrf-cookies": {
    "sections": [
      {
        "heading": "The cross-site request problem",
        "body": [
          {
            "type": "p",
            "text": "**CSRF works because browsers send your cookies on every request to your domain — even when the request was triggered by another site.** A logged-in user visits `evil.com`, the page makes a hidden POST to `bank.com/transfer`, the browser dutifully attaches the bank's session cookie, and the bank can't tell the difference."
          },
          {
            "type": "p",
            "text": "**Cookies are powerful because they're automatic. They're dangerous for the same reason.** The fix is to mark them with the right attributes — and to require a value an attacker on another origin cannot guess or read."
          },
          {
            "type": "p",
            "text": "**SameSite=Lax is the modern default in every major browser.** Chrome, Firefox, and Safari now default to `Lax` if you don't set it. That kills 95% of classical CSRF — but the other 5% still ships."
          }
        ]
      },
      {
        "heading": "Cookie attributes that matter",
        "body": [
          {
            "type": "p",
            "text": "**Every auth cookie should be `HttpOnly` + `Secure` + `SameSite=Lax`.** That's the floor. `HttpOnly` blocks `document.cookie` from JavaScript (defeats XSS exfiltration). `Secure` blocks plaintext HTTP. `SameSite` blocks the cross-site POST."
          },
          {
            "type": "table",
            "headers": ["Attribute", "Default", "What it stops"],
            "rows": [
              ["`HttpOnly`",       "off",      "JS reading the cookie — defeats XSS theft"],
              ["`Secure`",         "off",      "Cookie sent over plain HTTP — MITM downgrade"],
              ["`SameSite=Lax`",   "now Lax",  "Cross-site POST/PUT/DELETE carrying the cookie"],
              ["`SameSite=Strict`","off",      "Even top-level GETs from another origin"]
            ]
          },
          {
            "type": "diagram",
            "title": "SameSite at work",
            "subtitle": "EVIL.COM · BROWSER · BANK.COM",
            "height": 260,
            "nodes": [
              { "id": "evil",    "label": "evil.com", "subtitle": "ATTACKER PAGE", "accent": "fire",  "x": 0.10, "y": 0.5 },
              { "id": "browser", "label": "Browser",  "subtitle": "COOKIE STORE",  "accent": "sky",   "x": 0.40, "y": 0.5 },
              { "id": "lax",     "label": "Lax",      "subtitle": "DROP COOKIE",   "accent": "amber", "x": 0.68, "y": 0.25 },
              { "id": "none",    "label": "None",     "subtitle": "ATTACH COOKIE", "accent": "water", "x": 0.68, "y": 0.75 },
              { "id": "bank",    "label": "bank.com", "subtitle": "TRANSFER API",  "accent": "earth", "x": 0.92, "y": 0.5 }
            ],
            "edges": [
              { "from": "evil",    "to": "browser", "kind": "solid",  "label": "post" },
              { "from": "browser", "to": "lax",     "kind": "dashed", "label": "lax" },
              { "from": "browser", "to": "none",    "kind": "dashed", "label": "none" },
              { "from": "lax",     "to": "bank",    "kind": "solid",  "label": "no auth" },
              { "from": "none",    "to": "bank",    "kind": "solid",  "label": "AUTHED!" }
            ]
          }
        ]
      },
      {
        "heading": "When you still need a CSRF token",
        "body": [
          {
            "type": "p",
            "text": "**`SameSite=Lax` is enough for most apps.** If your API is same-site (cookies only travel within your apex domain), modern browsers already block the cross-site POST. You may still want a CSRF token for defense-in-depth, or if you support older browsers."
          },
          {
            "type": "p",
            "text": "**Two patterns dominate: synchronizer token and double-submit cookie.** Synchronizer stores a per-session token on the server and requires it in a header on writes. Double-submit puts the same value in a cookie *and* a header — the attacker can set neither cross-site, so a match proves same-origin."
          },
          {
            "type": "p",
            "text": "**The three-attribute cookie floor** — `HttpOnly` + `Secure` + `SameSite=Lax` is the modern minimum. `SameSite=None` only when you truly need cross-domain, and only with `Secure`."
          },
          {
            "type": "code",
            "lang": "javascript",
            "text": "// cookies  the modern minimum\nimport cookieParser from 'cookie-parser';\n\n// ALL auth cookies get these  no exceptions\nres.cookie('sid', sessionId, {\n  httpOnly: true,         // JS cannot read it  XSS cannot exfil\n  secure: true,           // HTTPS only  never over plain http\n  sameSite: 'lax',        // browser drops cookie on cross-site POST  modern default\n  path: '/',\n  maxAge: 1000 * 60 * 60 * 24 * 7,  // 7 days\n});\n\n// SameSite=None is required for cross-domain  pair with Secure or browser refuses\nres.cookie('cross_site_tracker', value, {\n  httpOnly: true,\n  secure: true,           // MUST be true with SameSite=None  enforced\n  sameSite: 'none',       // only when you really need cross-site cookies\n});"
          },
          {
            "type": "p",
            "text": "**Optional: add a CSRF token** for defense-in-depth or older browsers. The middleware validates the token automatically on writes."
          },
          {
            "type": "code",
            "lang": "javascript",
            "text": "// CSRF token  for defense in depth or older browsers\nimport csurf from 'csurf';\n\napp.use(cookieParser());\napp.use(csurf({ cookie: { httpOnly: true, sameSite: 'lax', secure: true } }));\n\napp.get('/form', (req, res) => {\n  res.render('form', { csrfToken: req.csrfToken() });  // include in a hidden input or header\n});\n\napp.post('/transfer', (req, res) => {\n  // csurf middleware already verified  req.body._csrf matches the cookie\n  // attacker on evil.com cannot read your cookie OR set the matching header\n  doTransfer(req.body);\n  res.json({ ok: true });\n});"
          },
          {
            "type": "pros-cons",
            "goodLabel": "GOOD FOR",
            "watchLabel": "WATCH OUT FOR",
            "good": [
              "`HttpOnly` + `Secure` + `SameSite=Lax` — the three-attribute floor",
              "CSRF token (`double-submit` or `synchronizer`) for write endpoints, esp. legacy clients",
              "Origin / Referer header check on top of SameSite — cheap belt-and-braces",
              "Short cookie `maxAge` — limits the window if a device is stolen"
            ],
            "watch": [
              "`SameSite=None` without `Secure` — every modern browser drops it on purpose",
              "Trusting `SameSite` alone in older Safari — pre-13 ignored the attribute entirely",
              "Storing the CSRF token in `localStorage` — defeats the whole point",
              "GET endpoints that mutate state — SameSite won't save you, the verb is the bug"
            ]
          },
          {
            "type": "practice",
            "lang": "bash",
            "prompt": "Use curl to demonstrate a session cookie on a same-site POST. Then try the cross-site version (Origin: https://evil.com) — show that SameSite=Lax causes the cookie to be dropped from the request.",
            "starter": "# 1. login  server sets sid as HttpOnly; Secure; SameSite=Lax\ncurl -i -c cookies.txt \\\n  -X POST https://api.example.com/login \\\n  -d 'email=me@example.com&password=hunter2'\n\n# 2. same-site request  cookie attaches, returns 200\ncurl -i -b cookies.txt \\\n  -H 'Origin: https://app.example.com' \\\n  -X POST https://api.example.com/transfer \\\n  -d 'amount=100'\n\n# 3. cross-site request  browser would drop the cookie under SameSite=Lax\n#    curl ignores SameSite (it is a browser rule)  this simulates the EXPECTED browser behavior\ncurl -i \\\n  -H 'Origin: https://evil.com' \\\n  -X POST https://api.example.com/transfer \\\n  -d 'amount=100'\n# expect 401  no cookie means no session\n",
            "hint": "SameSite is enforced by the browser, not by curl. The third request mimics what the browser would actually send when a cookie has SameSite=Lax and the request originates from another site — no cookie at all."
          },
          {
            "type": "quote",
            "text": "HttpOnly stops the JS theft. Secure stops the downgrade. SameSite stops the cross-site abuse. Skip any one and you're shipping a CVE with a timer on it.",
            "cite": "the three-attribute cookie checklist"
          }
        ]
      }
    ]
  },
  "fs-platform-deploy": {
    "sections": [
      {
        "heading": "The modern PaaS deal",
        "body": [
          {
            "type": "p",
            "text": "**Vercel, Railway, and Fly took the part of deployment that ate 90% of small-team time and made it `git push`.** You connect a repo, the platform builds on every commit, and every pull request gets its own preview URL. No SSH, no `scp`, no nginx config — that whole layer is gone."
          },
          {
            "type": "p",
            "text": "**The trade-off is opinionation.** Each platform has a sweet spot: Vercel owns the Next.js/edge-frontend lane, Railway is the easiest full-stack Postgres+API box, Fly runs your container near users globally. Pick the one whose defaults match your stack and you write almost zero infra code."
          },
          {
            "type": "p",
            "text": "**Preview deployments are the killer feature.** Every PR builds its own URL — designers review the actual app, QA tests the actual build, stakeholders click a link. The feedback loop shrinks from \"ship to staging on Tuesday\" to \"ship to a URL in 90 seconds.\""
          }
        ]
      },
      {
        "heading": "Picking a platform",
        "body": [
          {
            "type": "table",
            "headers": ["Platform", "Sweet spot", "Watch for"],
            "rows": [
              ["**Vercel**",  "Next.js, edge-rendered frontends",   "Pricey at scale, function timeouts"],
              ["**Railway**", "Full-stack apps + managed Postgres", "Single-region, cold-start on small plans"],
              ["**Fly.io**",  "Containers near users, low latency", "You manage Dockerfile + volumes"],
              ["**Render**",  "Middle ground, classic web services","Slower builds, fewer regions"]
            ]
          },
          {
            "type": "diagram",
            "title": "Git push to live URL",
            "subtitle": "DEV · GIT · BUILD · PaaS",
            "height": 250,
            "nodes": [
              { "id": "dev",   "label": "Developer", "subtitle": "GIT PUSH",  "accent": "sky",   "x": 0.30, "y": 0.15 },
              { "id": "repo",  "label": "GitHub",    "subtitle": "MAIN/PR",   "accent": "water", "x": 0.70, "y": 0.15 },
              { "id": "build", "label": "Build",     "subtitle": "INSTALL",   "accent": "water", "x": 0.30, "y": 0.50 },
              { "id": "paas",  "label": "PaaS",      "subtitle": "VERCEL",    "accent": "amber", "x": 0.70, "y": 0.50 },
              { "id": "prev",  "label": "Preview",   "subtitle": "PR URL",          "accent": "amber", "x": 0.50, "y": 0.85 }
            ],
            "edges": [
              { "from": "dev",   "to": "repo",  "kind": "solid",  "label": "push" },
              { "from": "repo",  "to": "build", "kind": "dashed", "label": "webhook" },
              { "from": "build", "to": "paas",  "kind": "solid",  "label": "deploy" },
              { "from": "build", "to": "prev",  "kind": "dashed", "label": "per PR", "curve": 0.3 }
            ]
          },
          {
            "type": "layers",
            "title": "Deploy lifecycle — four stages",
            "caption": "Same commit, four environments. Each band has a narrower blast radius than the one below it.",
            "layers": [
              { "n": 1, "label": "Code",  "example": "feature branch",   "accent": "sky" },
              { "n": 2, "label": "Build", "example": "install + bundle", "accent": "water" },
              { "n": 3, "label": "Stage", "example": "PR preview URL",   "accent": "amber" },
              { "n": 4, "label": "Prod",  "example": "promoted alias",   "accent": "fire" }
            ]
          }
        ]
      },
      {
        "heading": "Build-time vs runtime env",
        "body": [
          {
            "type": "p",
            "text": "**The single biggest rookie trap is mixing build-time and runtime env vars.** A `NEXT_PUBLIC_API_URL` bakes into the JS bundle at build — change it after, nothing happens until you redeploy. A `DATABASE_URL` is read at runtime — change it and a restart picks it up. Different layer, different blast radius."
          },
          {
            "type": "code",
            "lang": "bash",
            "text": "# vercel CLI  one command takes a repo to a real URL\nnpm i -g vercel\n\n# first deploy  links the local folder to a new project\nvercel              # interactive  pick scope, link repo, set framework preset\n\n# subsequent deploys  preview by default, --prod for production\nvercel              # ships to a preview URL  safe to share, gets auto-deleted later\nvercel --prod       # promotes the current build to your prod domain  same artifact\n\n# env vars  scoped per environment, never committed\nvercel env add DATABASE_URL production    # prompts for the value  stored in Vercel\nvercel env add API_KEY preview            # only injected on PR preview builds\nvercel env pull .env.local                # writes the current env to a local file for dev\n\n# fly.io  similar shape, container-based\nfly launch          # detects Dockerfile or buildpacks  asks region + Postgres\nfly deploy          # build locally or remotely  ship to your fly app\nfly secrets set STRIPE_KEY=sk_live_xxx    # runtime only  triggers a restart\n"
          },
          {
            "type": "pros-cons",
            "goodLabel": "GOOD FOR",
            "watchLabel": "WATCH OUT FOR",
            "good": [
              "**Preview URLs per PR** — designers/QA review the actual build, not a description",
              "**Git-push-to-deploy** — no SSH, no manual artifact upload, rollback is one click",
              "**Managed TLS + DNS** — certs auto-renew, no nginx config to maintain",
              "**Build caches** — incremental installs cut deploy times from minutes to seconds"
            ],
            "watch": [
              "**Function timeouts** (10–60s on hobby plans) — long jobs need a queue, not a route",
              "**Vendor lock** — `vercel.json`, `fly.toml`, route conventions don't port cleanly",
              "**Egress / bandwidth pricing** — surprise bills when a viral post hits the bundle",
              "**Cold starts on free tiers** — first request after idle can take 3–10 seconds"
            ]
          },
          {
            "type": "practice",
            "lang": "bash",
            "prompt": "Deploy a Vite app to Vercel from the CLI, set one env var, and promote a preview to prod.",
            "starter": "# 1. install + log in  one time per machine\nnpm i -g vercel\nvercel login\n\n# 2. from your project root  link to a new or existing Vercel project\nvercel\n# answers: scope=personal, link=no, name=my-app, framework=Vite, output=dist\n\n# 3. set a build-time env var  rebuilds bundle to bake the new value\nvercel env add VITE_API_URL production\n# paste value when prompted, e.g. https://api.example.com\n\n# 4. push a preview deploy  shows up at https://<project>-<hash>.vercel.app\nvercel\n\n# 5. promote that build to prod  same artifact, no rebuild\nvercel --prod\n\n# 6. roll back instantly if it breaks  point prod alias at the previous deploy\nvercel rollback\n",
            "hint": "Notice you never wrote a Dockerfile, never touched a server, and never installed nginx. The preview URL is the entire QA story — share it, get feedback, then `--prod` flips the alias atomically. If prod misbehaves, `vercel rollback` re-points the alias at the previous immutable build."
          },
          {
            "type": "quote",
            "text": "Modern PaaS turned deployment from a ritual into a side-effect of `git push`. The first time a designer reviews a PR by clicking a preview URL, you're not going back.",
            "cite": "why preview deploys won"
          }
        ]
      }
    ]
  },
  "fs-env-secrets": {
    "sections": [
      {
        "heading": "Config belongs in the environment",
        "body": [
          {
            "type": "p",
            "text": "**The twelve-factor app rule: strict separation of config from code.** Anything that differs between dev, staging, and prod — database URL, API keys, feature flags — lives in environment variables. The same git commit deploys to all three; only the env differs."
          },
          {
            "type": "p",
            "text": "**Never commit a secret. Once a string hits git, it is forever** — even after a force-push, even after `git filter-branch`. Caches, forks, GitHub's archive, someone's local clone. The day you discover a leak, the clock has already been running for weeks. Rotate immediately."
          },
          {
            "type": "p",
            "text": "**`.env` is for local dev only.** It's gitignored, it never ships, and prod gets its values from a secret manager. Treat any `.env` in a deploy artifact as a security incident — there's a real reason no PaaS auto-uploads it."
          }
        ]
      },
      {
        "heading": "Where each value should live",
        "body": [
          {
            "type": "table",
            "headers": ["Layer",                   "Where it lives",            "Rotation cadence"],
            "rows": [
              ["**Local dev**",                   "`.env.local` (gitignored)",  "On laptop loss"],
              ["**Preview / staging**",           "PaaS env UI or Doppler",     "Per-PR or weekly"],
              ["**Production**",                  "Secret manager (Vercel/AWS)", "Quarterly + on suspected leak"],
              ["**Public, build-time**",          "`VITE_` / `NEXT_PUBLIC_` prefix", "Per release — they ship to the client"]
            ]
          },
          {
            "type": "diagram",
            "title": "Secret flow, dev to prod",
            "subtitle": "DEV · CI · VAULT · APP",
            "height": 250,
            "nodes": [
              { "id": "dev",   "label": "Developer",   "subtitle": ".ENV.LOCAL",      "accent": "sky",   "x": 0.30, "y": 0.25 },
              { "id": "ci",    "label": "CI",          "subtitle": "ACTIONS SECRETS", "accent": "water", "x": 0.70, "y": 0.25 },
              { "id": "vault", "label": "Vault",       "subtitle": "DOPPLER · ASM",   "accent": "amber", "x": 0.30, "y": 0.60 },
              { "id": "app",   "label": "Prod app",    "subtitle": "PROCESS.ENV",     "accent": "fire",  "x": 0.70, "y": 0.60 },
              { "id": "git",   "label": "Git",         "subtitle": "NEVER",           "accent": "earth", "x": 0.50, "y": 0.92 }
            ],
            "edges": [
              { "from": "dev",   "to": "ci",    "kind": "dashed", "label": "push" },
              { "from": "ci",    "to": "vault", "kind": "solid",  "label": "fetch" },
              { "from": "vault", "to": "app",   "kind": "solid",  "label": "inject" },
              { "from": "dev",   "to": "git",   "kind": "dashed", "label": "NO", "curve": 0.3 }
            ]
          }
        ]
      },
      {
        "heading": "Reading env vars without footguns",
        "body": [
          {
            "type": "p",
            "text": "**Declare and parse the env once at boot.** A missing or malformed var becomes a crash at startup, not a 3am page two weeks later."
          },
          {
            "type": "code",
            "lang": "javascript",
            "text": "// config/env.js  one place that validates every var on boot  fail fast\nimport { z } from 'zod';   // any schema lib works  zod is concise\n\n// 1) Declare the shape  required vs optional, types, defaults\nconst schema = z.object({\n  NODE_ENV:     z.enum(['development', 'test', 'production']).default('development'),\n  PORT:         z.coerce.number().default(3000),       // env values are always strings\n  DATABASE_URL: z.string().url(),                       // throws on missing or malformed\n  JWT_SECRET:   z.string().min(32),                     // short secret = no secret\n  SENTRY_DSN:   z.string().url().optional(),            // monitoring is optional in dev\n});\n\n// 2) Parse ONCE at boot  process exits if anything is missing\nexport const env = schema.parse(process.env);"
          },
          {
            "type": "p",
            "text": "**Then import `env` everywhere instead of `process.env`** — typed access kills typo bugs, and the prefix rules below decide what ships in the browser bundle."
          },
          {
            "type": "code",
            "lang": "javascript",
            "text": "// 3) Use the typed object  not process.env  no more typos\n// import { env } from './config/env.js'\n// app.listen(env.PORT)\n// new Pool({ connectionString: env.DATABASE_URL })\n\n// 4) NEVER do this  unvalidated, untyped, silently undefined\n// const url = process.env.DATABSE_URL  typo  app boots, then 500s on every request\n\n// 5) Public, build-time vars  prefix tells the bundler to inline them\n// VITE_API_URL  goes into the browser bundle  NEVER put secrets here\n// SUPABASE_SERVICE_KEY  no prefix  stays server-only\n"
          },
          {
            "type": "pros-cons",
            "goodLabel": "GOOD FOR",
            "watchLabel": "WATCH OUT FOR",
            "good": [
              "**Schema-validated env on boot** — `zod` or `envalid`. Missing var = process exits in 50ms",
              "**A secret manager** (Doppler, Vercel Env, AWS Secrets Manager) — one source, rotated centrally",
              "**`.env.example`** committed with empty/dummy values — onboarding doc + lint reference",
              "**Per-environment values** — `DATABASE_URL` for dev points at local Postgres, not prod"
            ],
            "watch": [
              "**`VITE_` / `NEXT_PUBLIC_` prefix on a secret** — it ships in the JS bundle, world-readable",
              "**`.env` committed by accident** — assume leaked, rotate immediately, no exceptions",
              "**Reading `process.env.X` everywhere** — typos go silent, validation runs nowhere",
              "**Sharing prod secrets in Slack/email** — every channel is a future breach disclosure"
            ]
          },
          {
            "type": "quote",
            "text": "Config in code is a bug. Secrets in git are an incident. Build-time public vars masquerading as secrets are a CVE. Pick the right home for each one.",
            "cite": "the twelve-factor reminder"
          }
        ]
      }
    ]
  },
  "fs-github-actions": {
    "sections": [
      {
        "heading": "Merge means ship",
        "body": [
          {
            "type": "p",
            "text": "**CI/CD turns the question \"is this deployable?\" into \"does it pass?\".** GitHub Actions runs your test suite on every PR, blocks merge if it fails, then deploys the moment `main` updates. The mental model collapses: merge to main = goes to prod, and the gate is the test suite."
          },
          {
            "type": "p",
            "text": "**Workflows are YAML files in `.github/workflows/`.** Each file is one workflow with one or more jobs; each job runs on a fresh VM. Triggers can be `push`, `pull_request`, `schedule` (cron), or `workflow_dispatch` (manual)."
          },
          {
            "type": "p",
            "text": "**The matrix strategy is the multiplier.** One YAML block, N combinations: Node 18/20/22 × Ubuntu/macOS, browsers in parallel, regions in parallel. You don't write loops; the runner forks the job."
          }
        ]
      },
      {
        "heading": "Triggers, jobs, and the deploy gate",
        "body": [
          {
            "type": "diagram",
            "title": "Workflow lifecycle",
            "subtitle": "PR · BUILD · TEST · DEPLOY",
            "height": 260,
            "nodes": [
              { "id": "trig",  "label": "Trigger",  "subtitle": "PUSH",      "accent": "water", "x": 0.08, "y": 0.5 },
              { "id": "build", "label": "Build",    "subtitle": "INSTALL",   "accent": "water", "x": 0.30, "y": 0.5 },
              { "id": "test",  "label": "Test",     "subtitle": "MATRIX",    "accent": "water", "x": 0.52, "y": 0.5 },
              { "id": "gate",  "label": "Gate",     "subtitle": "APPROVE",   "accent": "amber", "x": 0.30, "y": 0.85 },
              { "id": "prod",  "label": "Prod",     "subtitle": "DEPLOY",    "accent": "fire",  "x": 0.70, "y": 0.85 }
            ],
            "edges": [
              { "from": "trig",  "to": "build", "kind": "solid",  "label": "start" },
              { "from": "build", "to": "test",  "kind": "solid",  "label": "artifact" },
              { "from": "test",  "to": "gate",  "kind": "dashed", "label": "green" },
              { "from": "gate",  "to": "prod",  "kind": "solid",  "label": "ship" }
            ]
          },
          {
            "type": "walkthrough",
            "title": "CI/CD pipeline on push",
            "caption": "Watch what happens after `git push` to main.",
            "nodes": [
              { "id": "dev",      "label": "Developer", "subtitle": "GIT PUSH",    "accent": "sky",   "x": 0.10, "y": 0.5 },
              { "id": "repo",     "label": "GitHub",    "subtitle": "REPO",        "accent": "water", "x": 0.30, "y": 0.5 },
              { "id": "runner",   "label": "Runner",    "subtitle": "UBUNTU VM",   "accent": "amber", "x": 0.50, "y": 0.5 },
              { "id": "artifact", "label": "Artifact",  "subtitle": "BUILD OUT",   "accent": "earth", "x": 0.70, "y": 0.5 },
              { "id": "prod",     "label": "Prod",      "subtitle": "DEPLOY",      "accent": "fire",  "x": 0.90, "y": 0.5 }
            ],
            "steps": [
              {
                "title": "Developer pushes commit",
                "description": "Local commit lands on `main`. The push hits GitHub's git server and triggers the webhook layer.",
                "activeNodes": ["dev", "repo"],
                "activeEdges": [{ "from": "dev", "to": "repo", "label": "git push" }]
              },
              {
                "title": "GitHub fires the workflow",
                "description": "The `on: push` rule matches. GitHub provisions a fresh Ubuntu runner and dispatches the workflow YAML to it.",
                "activeNodes": ["repo", "runner"],
                "activeEdges": [{ "from": "repo", "to": "runner", "label": "dispatch" }]
              },
              {
                "title": "Runner installs deps + runs tests",
                "description": "Runner checks out the repo, restores the npm cache, runs `npm ci`, then `npm test`. The whole job is sandboxed — no shared state with other runs.",
                "activeNodes": ["runner"],
                "activeEdges": []
              },
              {
                "title": "Tests pass → build artifact",
                "description": "All matrix slots are green. The runner produces a build artifact (a bundle, a Docker image, a static dist/) and uploads it for the next job.",
                "activeNodes": ["runner", "artifact"],
                "activeEdges": [{ "from": "runner", "to": "artifact", "label": "build" }]
              },
              {
                "title": "Deploy step pushes to prod",
                "description": "Deploy job pulls the artifact, authenticates to the host (Vercel, Fly, Cloud Run…) with a scoped secret, and ships. Merge to main → live in production.",
                "activeNodes": ["artifact", "prod"],
                "activeEdges": [{ "from": "artifact", "to": "prod", "label": "ship" }]
              }
            ]
          },
          {
            "type": "table",
            "headers": ["Trigger",           "Fires on",                       "Typical use"],
            "rows": [
              ["`push`",                     "Any commit to listed branches",   "CI on `main` + release branches"],
              ["`pull_request`",             "PR opened, updated, reopened",    "Test gate before merge"],
              ["`schedule`",                 "Cron expression",                 "Nightly builds, dep audits"],
              ["`workflow_dispatch`",        "Manual UI / API button",          "Hot-fix deploys, one-off jobs"]
            ]
          },
          {
            "type": "p",
            "text": "**The `test` job** — triggers, the parallel matrix, and the deps-then-test sequence."
          },
          {
            "type": "code",
            "lang": "yaml",
            "text": "# .github/workflows/ci.yml  the minimum useful pipeline\nname: CI\n\non:\n  push:\n    branches: [main]              # run on every commit to main\n  pull_request:                    # AND on every PR  the test gate\n\njobs:\n  test:\n    runs-on: ubuntu-latest         # fresh VM each run  no state between\n    strategy:\n      matrix:\n        node: [18, 20, 22]         # 3 parallel jobs  catches version-specific bugs\n    steps:\n      - uses: actions/checkout@v4  # pull the repo into the runner\n\n      - uses: actions/setup-node@v4\n        with:\n          node-version: ${{ matrix.node }}\n          cache: 'npm'             # caches ~/.npm  cuts install time 5-10x\n\n      - run: npm ci                # ci  faster than install, locks to package-lock\n      - run: npm run lint\n      - run: npm test -- --ci      # exit non-zero on failure  fails the job"
          },
          {
            "type": "p",
            "text": "**The `deploy` job** — gated by `needs:` and a branch check, scoped to the `production` environment so secrets and approvals are bound to it."
          },
          {
            "type": "code",
            "lang": "yaml",
            "text": "  deploy:\n    needs: test                    # only runs if every matrix slot in `test` was green\n    if: github.ref == 'refs/heads/main'   # never deploy on PR builds  prod is main-only\n    runs-on: ubuntu-latest\n    environment:\n      name: production             # triggers required-reviewers gate in repo settings\n      url: https://app.example.com\n    steps:\n      - uses: actions/checkout@v4\n      - run: npm ci\n      - run: npm run build\n      - name: Deploy to Vercel\n        env:\n          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}   # secret  set in repo / org settings\n        run: npx vercel --prod --token=$VERCEL_TOKEN  # one-line ship\n"
          },
          {
            "type": "practice",
            "lang": "yaml",
            "prompt": "Write a workflow that runs tests on PRs, then deploys to Fly.io only on push to main. Add a manual-approval gate.",
            "starter": "# .github/workflows/deploy.yml\nname: Deploy\n\non:\n  push:\n    branches: [main]\n  pull_request:\n\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: actions/setup-node@v4\n        with:\n          node-version: 20\n          cache: 'npm'\n      - run: npm ci\n      - run: npm test -- --ci\n\n  deploy:\n    needs: test                              # blocked until tests pass\n    if: github.event_name == 'push'          # never on PR  PR only runs the test job\n    runs-on: ubuntu-latest\n    environment:\n      name: production                       # configure required reviewers in repo Settings  Environments\n    steps:\n      - uses: actions/checkout@v4\n      - uses: superfly/flyctl-actions/setup-flyctl@master\n      - run: flyctl deploy --remote-only\n        env:\n          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}\n",
            "hint": "Two gates protect prod: (1) `needs: test` blocks deploy until the test job is green; (2) `environment: production` triggers GitHub's environment protection — set required reviewers in repo Settings → Environments → production. The reviewer clicks Approve before the deploy job actually starts."
          }
        ]
      },
      {
        "heading": "When to add manual approval",
        "body": [
          {
            "type": "pros-cons",
            "goodLabel": "GOOD FOR",
            "watchLabel": "WATCH OUT FOR",
            "good": [
              "**Cache the package manager** (`cache: 'npm'`) — installs go from 60s to 5s",
              "**Matrix builds** for Node/Python/browser versions — parallel, not sequential",
              "**`environment:` protection** on the prod job — required reviewers, secrets scoped per env",
              "**Reusable workflows** (`uses: ./.github/workflows/build.yml`) — DRY across repos"
            ],
            "watch": [
              "**Secrets echoed in `run:` logs** — Actions auto-redacts known secrets, not transforms of them",
              "**Auto-deploy without smoke tests** — green unit tests + broken prod is a thing",
              "**`pull_request_target` on untrusted PRs** — runs with secrets, opens supply-chain RCE",
              "**No timeout on long jobs** — a hung step burns minutes; set `timeout-minutes`"
            ]
          },
          {
            "type": "quote",
            "text": "CI is the contract: green means deployable. CD is the consequence: merge means shipped. The day you can roll back faster than you debate, you're done.",
            "cite": "the merge-means-ship rule"
          }
        ]
      }
    ]
  },
  "fs-monitoring": {
    "sections": [
      {
        "heading": "If you can't see it, it's already broken",
        "body": [
          {
            "type": "p",
            "text": "**Production fails in ways localhost never will.** A user in Lagos on a 3G phone hits a slow query; a third-party API rate-limits you on a Sunday; a memory leak grows over 14 days. None of these show up in tests. Monitoring is how you find out before the user emails support."
          },
          {
            "type": "p",
            "text": "**The three pillars: logs, metrics, traces.** Logs are *what happened* (with detail), metrics are *how often / how slow* (cheap to aggregate), traces are *one request through every service* (the smoking gun for distributed bugs). Each answers questions the other two can't."
          },
          {
            "type": "p",
            "text": "**Don't alert on everything — alert on what you'd wake up for.** Pager fatigue is real: every false alarm trains the team to ignore the real one. The bar is \"would I get out of bed for this?\" If no, it's a dashboard, not a page."
          }
        ]
      },
      {
        "heading": "The tool matrix",
        "body": [
          {
            "type": "table",
            "headers": ["Job",                    "Cheap pick",                "Scale pick"],
            "rows": [
              ["**Uptime**",                     "UptimeRobot, BetterStack",   "Pingdom, Catchpoint"],
              ["**Errors**",                     "Sentry (free tier ample)",   "Bugsnag, Rollbar"],
              ["**Performance / RUM**",          "Vercel Analytics, Plausible","Datadog RUM, New Relic"],
              ["**Logs + traces**",              "Better Stack, Logtail",      "Datadog, Honeycomb, Grafana"]
            ]
          },
          {
            "type": "walkthrough",
            "title": "Signals to alerts",
            "why": "Every hop is cheap until the last one — alert only on what you'd wake up for, everything else is a dashboard.",
            "height": 320,
            "nodes": [
              { "id": "user",  "label": "User",       "subtitle": "BROWSER",    "accent": "sky",   "x": 0.30, "y": 0.18 },
              { "id": "app",   "label": "App",        "subtitle": "PROD",       "accent": "fire",  "x": 0.70, "y": 0.18 },
              { "id": "agent", "label": "Agent",      "subtitle": "SDK",        "accent": "water", "x": 0.30, "y": 0.52 },
              { "id": "store", "label": "Store",      "subtitle": "LOGS",       "accent": "earth", "x": 0.70, "y": 0.52 },
              { "id": "alert", "label": "Alert",      "subtitle": "PAGE · SLACK",     "accent": "amber", "x": 0.50, "y": 0.86 }
            ],
            "steps": [
              {
                "title": "A user hits production",
                "description": "Real traffic does what localhost never will — a slow query, a flaky third-party, a 14-day memory leak. The signal starts here.",
                "activeNodes": ["user"],
                "activeEdges": []
              },
              {
                "title": "The app handles the request",
                "description": "Your **prod app** serves the request and, along the way, has something worth recording — an error, a latency number, a trace span.",
                "activeNodes": ["user", "app"],
                "activeEdges": [{ "from": "user", "to": "app", "label": "request" }]
              },
              {
                "title": "An agent emits the signal",
                "description": "The **SDK** (Sentry, OpenTelemetry…) captures the event with its stack and context, then hands it off — your code doesn't block on this.",
                "activeNodes": ["app", "agent"],
                "activeEdges": [{ "from": "app", "to": "agent", "label": "emit" }]
              },
              {
                "title": "It ships to a store",
                "description": "The agent **ships** logs, metrics, and traces to a backend where they're indexed and aggregated — cheap to keep, fast to query.",
                "activeNodes": ["agent", "store"],
                "activeEdges": [{ "from": "agent", "to": "store", "label": "ship" }]
              },
              {
                "title": "A rule fires an alert",
                "description": "A threshold **rule** matches and pages you or pings Slack. The whole point: only the wake-up-worthy ones page — the rest just sit on a dashboard.",
                "activeNodes": ["store", "alert"],
                "activeEdges": [{ "from": "store", "to": "alert", "label": "rule" }]
              }
            ]
          },
          {
            "type": "p",
            "text": "**`Sentry.init` once at boot** — tag releases with the git SHA so errors map to a specific deploy, and filter known noise before sending so the alert channel stays sane."
          },
          {
            "type": "code",
            "lang": "javascript",
            "text": "// app/instrumentation.js  one Sentry init for the whole server\nimport * as Sentry from '@sentry/node';\nimport { ProfilingIntegration } from '@sentry/profiling-node';\n\nSentry.init({\n  dsn: process.env.SENTRY_DSN,                    // public ingest URL  not a secret per se\n  environment: process.env.NODE_ENV,              // separates prod / preview / dev streams\n  release: process.env.GIT_SHA,                   // ties errors to the exact deploy  source maps follow\n\n  tracesSampleRate: 0.1,                          // 10% of requests get full traces  cost control\n  profilesSampleRate: 0.1,                        // CPU profiles on the same sample  optional\n  integrations: [new ProfilingIntegration()],\n\n  // Filter noise BEFORE sending  saves quota and reduces alert fatigue\n  beforeSend(event, hint) {\n    const err = hint.originalException;\n    if (err?.code === 'ECONNRESET') return null;  // upstream blip  not a real error\n    if (err?.statusCode === 404) return null;     // someone hit /wp-admin  ignore\n    return event;\n  },\n});"
          },
          {
            "type": "p",
            "text": "**Wire it into Express** — the error handler must be the LAST middleware so it catches everything above."
          },
          {
            "type": "code",
            "lang": "javascript",
            "text": "// Express  Sentry wraps every route, catches throws + 500s\nimport express from 'express';\nconst app = express();\napp.use(Sentry.Handlers.requestHandler());\napp.use(Sentry.Handlers.tracingHandler());\n\napp.get('/orders/:id', async (req, res) => {\n  const order = await db.orders.find(req.params.id);\n  if (!order) throw new NotFoundError('order missing');   // Sentry captures with stack + req context\n  res.json(order);\n});\n\napp.use(Sentry.Handlers.errorHandler());          // must be LAST middleware  catches everything above\n"
          },
          {
            "type": "pros-cons",
            "goodLabel": "GOOD FOR",
            "watchLabel": "WATCH OUT FOR",
            "good": [
              "**Sentry on day one** — free tier covers most small apps, source-mapped stack traces",
              "**Uptime check on a real user path** (`/api/health` that hits the DB) — not just root `/`",
              "**Release tracking** — tag errors with `git_sha`, regressions become obvious per deploy",
              "**Slack channel for alerts, PagerDuty for pages** — visible vs. wake-up-worthy, two tiers"
            ],
            "watch": [
              "**Alerting on every 500** — bot traffic, scraped 404s, and timeouts will drown the channel",
              "**No source maps uploaded** — minified stack traces are unreadable, defeats the tool",
              "**PII in error reports** — emails, tokens, body params land in your error store, GDPR risk",
              "**Datadog at 5 engineers** — sticker shock; defer the heavy stack until you need it"
            ]
          },
          {
            "type": "quote",
            "text": "Uptime tells you something's wrong. Errors tell you what threw. Traces tell you which hop. Pick alerts you'd wake up for — everything else is a dashboard.",
            "cite": "the three-pillars discipline"
          }
        ]
      }
    ]
  },
  "fs-oauth-variants": {
    "sections": [
      {
        "heading": "One protocol, four conversations",
        "body": [
          {
            "type": "p",
            "text": "**OAuth 2.0 isn't one flow — it's a family.** Picking the right variant comes down to one question: *which actors are in the room?* A human at a browser is a very different problem from a cron job calling Stripe, or a Roku app asking you to type a code on your phone."
          },
          {
            "type": "p",
            "text": "**Each flow trades convenience for security in a different place.** Authorization Code keeps the secret on a server. PKCE replaces the server secret with a one-time challenge. Client Credentials has no user at all. Device Code routes around a keyboardless device."
          }
        ]
      },
      {
        "heading": "**Pick by actors**, not by hype",
        "body": [
          {
            "type": "p",
            "text": "**Start with who's involved.** If there's a user + a server you control, you want Authorization Code. If there's a user but no server you trust with a secret (mobile, SPA), add PKCE. If there's no user, you want Client Credentials. If the user is sitting at a TV, you want Device Code."
          },
          {
            "type": "compare",
            "title": "The four OAuth 2.0 variants",
            "caption": "Same protocol, four very different rooms.",
            "axes": ["Who's in the room", "Where the secret lives", "Best for", "Avoid when"],
            "left":  { "label": "Auth Code", "accent": "water", "values": ["User + browser + your server", "Server-side `client_secret`", "Classic web apps with a backend", "No backend to hold the secret"] },
            "right": { "label": "Auth Code + PKCE", "accent": "sky", "values": ["User + browser, no trusted server", "One-time `code_verifier`", "Mobile apps and SPAs", "You already have a secure backend"] }
          },
          {
            "type": "table",
            "headers": ["Variant", "Secret?", "Best for"],
            "rows": [
              ["**Auth Code**",          "Server",   "Server-rendered web apps"],
              ["**Auth Code + PKCE**",   "Verifier", "Mobile, SPA, public clients"],
              ["**Client Credentials**", "Server",   "Service-to-service, cron, M2M"],
              ["**Device Code**",        "None",     "TVs, CLIs, IoT — no keyboard"]
            ]
          }
        ]
      },
      {
        "heading": "**Device Code** is the keyboardless flow",
        "body": [
          {
            "type": "p",
            "text": "**Device Code exists because some clients can't render a login form.** A Roku, a smart speaker, the AWS CLI on a server — none of these have a comfortable place to type a password. So the device offloads the login to *your phone*."
          },
          {
            "type": "p",
            "text": "**The device polls while you authorize.** It gets a short user code (`WDJB-MJHT`) to display, then hits the token endpoint every few seconds until you finish on your phone. The phone is where the real OAuth happens; the device just collects the token."
          },
          {
            "type": "sequence",
            "title": "Device Code — message order",
            "caption": "Device polls in a loop while the user authorizes on a second screen.",
            "actors": [
              { "id": "device", "label": "Device",  "accent": "earth" },
              { "id": "authz",  "label": "Authz",   "accent": "fire" },
              { "id": "user",   "label": "Phone",   "accent": "sky" }
            ],
            "events": [
              { "from": "device", "to": "authz",  "label": "POST /device/code",      "note": "client_id + scope" },
              { "from": "authz",  "to": "device", "label": "device_code + user_code", "note": "WDJB-MJHT, 15min" },
              { "from": "device", "to": "user",   "label": "Show code + URL" },
              { "from": "user",   "to": "authz",  "label": "Visit URL, enter code, consent" },
              { "from": "device", "to": "authz",  "label": "Poll /token (every 5s)",  "note": "authorization_pending..." },
              { "from": "authz",  "to": "device", "label": "access_token",            "note": "once user consents" }
            ]
          },
          {
            "type": "p",
            "text": "**Step 1 — ask for a code pair.** The device gets two codes back: one to display, one to use when polling."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "# device_flow.py  the polling loop a CLI / TV runs\nimport time, requests\n\nCLIENT_ID = 'your-client-id'  # public  no secret on a TV\nDEVICE_URL = 'https://idp.example.com/oauth/device/code'\nTOKEN_URL  = 'https://idp.example.com/oauth/token'\n\n# 1) ask the IDP for a device + user code pair\nr = requests.post(DEVICE_URL, data={\n    'client_id': CLIENT_ID,\n    'scope': 'openid profile',  # keep small  this prompt is shown on the phone\n}).json()\n\nprint(f\"Visit {r['verification_uri']} and enter: {r['user_code']}\")  # show on the TV\ndevice_code = r['device_code']        # the device's private handle\ninterval    = r.get('interval', 5)    # IDP-dictated poll cadence  seconds"
          },
          {
            "type": "p",
            "text": "**Step 2 — poll until consent.** Respect `interval` and back off on `slow_down`; every other error means start over."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "# 2) poll the token endpoint until the user consents on their phone\nwhile True:\n    time.sleep(interval)  # never poll faster than `interval`  or you get slow_down errors\n    res = requests.post(TOKEN_URL, data={\n        'grant_type': 'urn:ietf:params:oauth:grant-type:device_code',\n        'device_code': device_code,\n        'client_id': CLIENT_ID,\n    }).json()\n\n    err = res.get('error')\n    if err == 'authorization_pending':\n        continue                     # user hasn't finished yet  keep polling\n    if err == 'slow_down':\n        interval += 5                # back off  IDP says we're hammering\n        continue\n    if err == 'expired_token':\n        raise SystemExit('User code expired  start over.')  # ~15 min window\n    if err:\n        raise SystemExit(f'IDP rejected: {err}')\n\n    access_token = res['access_token']  # success  hand to the API client\n    break"
          },
          {
            "type": "pros-cons",
            "goodLabel": "GOOD FOR",
            "watchLabel": "WATCH OUT FOR",
            "good": [
              "**Auth Code + PKCE** for any new mobile app or SPA — the modern default",
              "**Client Credentials** for cron jobs and M2M — rotate the secret, scope it tight",
              "**Device Code** for CLIs, TVs, and headless installs — the user already has a phone",
              "**One library per flow** — `authlib`, `oauthlib`, IDP SDK — never hand-roll the polling"
            ],
            "watch": [
              "Picking **plain Auth Code** for a SPA — it leaks the code via the URL fragment",
              "Using **Client Credentials** with a user identity baked into the token — wrong tool",
              "Polling Device Code **faster than `interval`** — IDPs return `slow_down`, then ban you",
              "Mixing flows — one app, one variant; if you need two, you have two clients"
            ]
          },
          {
            "type": "practice",
            "lang": "json",
            "prompt": "For each client, pick the right OAuth 2.0 variant and fill in the `flow` field.",
            "starter": "{\n  \"clients\": [\n    { \"name\": \"Server-rendered Rails app with login\",   \"flow\": \"\" },\n    { \"name\": \"iOS app, no backend, calls Google APIs\", \"flow\": \"\" },\n    { \"name\": \"Nightly Python script syncing to Stripe\", \"flow\": \"\" },\n    { \"name\": \"AWS CLI on a fresh laptop\",               \"flow\": \"\" }\n  ]\n}\n",
            "hint": "Two questions: is there a user in the room? is there a server you trust with a secret? Answer those and the variant falls out — auth-code, auth-code+pkce, client-credentials, or device-code."
          },
          {
            "type": "quote",
            "text": "Who's in the room? User + server is Auth Code. User + browser is PKCE. No user is Client Credentials. No keyboard is Device Code.",
            "cite": "the four-actor mnemonic"
          }
        ]
      }
    ]
  },
  "fs-auth-comparison": {
    "sections": [
      {
        "heading": "Four ways to prove who you are",
        "body": [
          {
            "type": "p",
            "text": "**Every auth interview hits the same fork: sessions, JWT, cookies, or PASETO.** They're often confused — *cookie* is a transport, *session* is a storage model, *JWT* and *PASETO* are token formats. Mixing the categories is the most common interview tell."
          },
          {
            "type": "p",
            "text": "**The real question is *where does trust live*.** Sessions trust a server-side store. JWTs trust a signature. Cookies trust the browser to attach them. PASETO trusts a versioned, opinionated crypto profile that refuses to footgun you."
          },
          {
            "type": "compare",
            "title": "Server-side Session vs Stateless JWT",
            "axes": ["Storage", "Revoke", "Scaling", "Failure mode"],
            "left":  { "label": "Session",
                       "accent": "amber",
                       "values": [
                         "Server (Redis / DB row)",
                         "Delete the row — instant",
                         "Needs a shared store",
                         "Store down → nobody can log in"
                       ] },
            "right": { "label": "JWT",
                       "accent": "water",
                       "values": [
                         "Client (`Authorization` header)",
                         "Wait for `exp` or blocklist",
                         "Any node verifies — pure crypto",
                         "Secret leak → forge any user"
                       ] }
          },
          {
            "type": "compare",
            "title": "Cookie (transport) vs PASETO (token format)",
            "caption": "Different layers — cookies *carry* tokens; PASETO *is* a token. They can coexist.",
            "axes": ["Layer", "Set by", "Threat it fixes", "When to pick it"],
            "left":  { "label": "Cookie",
                       "accent": "sky",
                       "values": [
                         "HTTP transport",
                         "`Set-Cookie` header",
                         "XSS exfil — `HttpOnly` blocks JS",
                         "First-party browser apps"
                       ] },
            "right": { "label": "PASETO",
                       "accent": "fire",
                       "values": [
                         "Token format (JWT alternative)",
                         "Your auth server",
                         "JWT `alg` confusion + weak crypto",
                         "New service, no JWT lock-in"
                       ] }
          }
        ]
      },
      {
        "heading": "What actually happens on the wire",
        "body": [
          {
            "type": "p",
            "text": "**The session flow is the boring one — and the most common.** A cookie carries a 32-byte random ID; the server looks it up in Redis on every request. The token format is trivial because the *server* holds the secret."
          },
          {
            "type": "sequence",
            "title": "Cookie + Session ID — login → request",
            "caption": "The classic stateful path: cookie out on login, lookup in on every call.",
            "actors": [
              { "id": "browser", "label": "Browser",  "accent": "sky"   },
              { "id": "api",     "label": "API",      "accent": "water" },
              { "id": "redis",   "label": "Redis",    "accent": "amber" },
              { "id": "db",      "label": "Users DB", "accent": "earth" }
            ],
            "events": [
              { "from": "browser", "to": "api",     "label": "POST /login", "note": "email + password" },
              { "from": "api",     "to": "db",      "label": "Argon2 verify" },
              { "from": "api",     "to": "redis",   "label": "SET sid → userId", "note": "TTL 7d" },
              { "from": "api",     "to": "browser", "label": "Set-Cookie: sid", "note": "HttpOnly · Secure · Lax" },
              { "from": "browser", "to": "api",     "label": "GET /me", "note": "Cookie: sid" },
              { "from": "api",     "to": "redis",   "label": "GET sid" },
              { "from": "api",     "to": "browser", "label": "200 + profile" }
            ]
          },
          {
            "type": "p",
            "text": "**JWTs skip the Redis hop entirely.** Verification is `verify(sig, header.payload, secret)` — pure crypto, no I/O. That's the scaling pitch. The cost: revocation is hard, payloads bloat the header on every request, and one leaked secret forges every user."
          },
          {
            "type": "p",
            "text": "**PASETO fixes JWT's footguns by versioning the crypto.** Instead of letting the *token* declare its algorithm (`alg: none`, `alg: HS256` confused with `alg: RS256` — both real CVEs), the library picks. `v4.public` means Ed25519, full stop. No algorithm field for an attacker to swap."
          }
        ]
      },
      {
        "heading": "Picking and shipping it",
        "body": [
          {
            "type": "p",
            "text": "**Sign once at login** — small payload, short TTL, and pin the algorithm so attackers can't downgrade to `none`."
          },
          {
            "type": "code",
            "lang": "javascript",
            "text": "// jwt-sign-verify.js — the two operations you'll run in production\nimport jwt from 'jsonwebtoken';\n\nconst SECRET = process.env.JWT_SECRET;          // 32+ random bytes  rotate via JWKS in real systems\nconst ALG = 'HS256';                            // pin the alg  never trust the header field\n\n// ── SIGN ──  call once at login, after password is verified\nfunction signAccessToken(userId, role) {\n  return jwt.sign(\n    { sub: String(userId), role },              // payload  keep it small  no PII\n    SECRET,\n    {\n      algorithm: ALG,                           // explicit  prevents alg confusion attacks\n      expiresIn: '15m',                         // short TTL  pairs with a refresh token\n      issuer: 'https://api.example.com',        // iss claim  verifier will check it\n      audience: 'web-app',                      // aud claim  reject tokens minted for another client\n    }\n  );\n}"
          },
          {
            "type": "p",
            "text": "**Verify on every protected route** — pin the algorithm as an array, check `iss` and `aud`, and never leak which validation step failed."
          },
          {
            "type": "code",
            "lang": "javascript",
            "text": "// ── VERIFY ──  middleware on every protected route\nfunction requireAuth(req, res, next) {\n  const header = req.headers.authorization || '';\n  const token = header.startsWith('Bearer ') ? header.slice(7) : null;\n  if (!token) return res.status(401).json({ error: 'missing token' });\n\n  try {\n    const payload = jwt.verify(token, SECRET, {\n      algorithms: [ALG],                        // array  library refuses anything else\n      issuer: 'https://api.example.com',        // throws if iss mismatches\n      audience: 'web-app',                      // throws if aud mismatches\n    });\n    req.user = { id: payload.sub, role: payload.role };\n    next();\n  } catch (err) {\n    // err.name is 'TokenExpiredError' or 'JsonWebTokenError'  do not leak which\n    res.status(401).json({ error: 'invalid token' });\n  }\n}"
          },
          {
            "type": "pros-cons",
            "goodLabel": "PICK THIS WHEN",
            "watchLabel": "WALK AWAY WHEN",
            "good": [
              "**Sessions** — first-party web app, you control the backend, want instant logout",
              "**JWT** — service-to-service, mobile clients, cross-domain — and you have a refresh-token DB",
              "**Cookies (HttpOnly + Secure + SameSite=Lax)** — anytime the client is a browser",
              "**PASETO** — greenfield service, no JWT lock-in, your library supports it (paseto-v4)"
            ],
            "watch": [
              "**JWT in `localStorage`** — one XSS exfils every session, no recovery",
              "**JWT with `algorithms: ['HS256', 'RS256']`** — classic alg-confusion CVE — pin to one",
              "**Sessions with no shared store** — sticky-session load balancer is a foot-tying contract",
              "**Hand-rolled token formats** — \"just a signed blob\" is how you reinvent JWT's bugs"
            ]
          },
          {
            "type": "practice",
            "lang": "json",
            "prompt": "Sketch the four artefacts side-by-side: what travels on the wire for a session-cookie request, a JWT request, and a PASETO v4.public request. Keep one example per token type.",
            "starter": "{\n  \"session_cookie\": {\n    \"header\": \"Cookie: sid=8f3a9e2b1c4d5e6f7a8b9c0d1e2f3a4b\",\n    \"server_lookup\": \"redis GET sess:8f3a... → { userId: 42, role: 'editor', exp: 1748794500 }\"\n  },\n  \"jwt_bearer\": {\n    \"header\": \"Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI0MiIsInJvbGUiOiJlZGl0b3IiLCJleHAiOjE3NDg3OTQ1MDB9.<sig>\",\n    \"server_lookup\": \"none — verify(sig, secret) only\"\n  },\n  \"paseto_v4_public\": {\n    \"header\": \"Authorization: Bearer v4.public.eyJzdWIiOiI0MiIsInJvbGUiOiJlZGl0b3IiLCJleHAiOiIyMDI2LTA2LTAyVDEyOjE1OjAwWiJ9.<ed25519-sig>\",\n    \"server_lookup\": \"none — Ed25519 verify, no alg field to attack\"\n  }\n}\n",
            "hint": "Session IDs are opaque random bytes. JWTs are three base64url segments joined by dots. PASETO tokens lead with a version+purpose tag (`v4.public.`) — that prefix *is* the alg, so it can't be swapped by an attacker."
          },
          {
            "type": "quote",
            "text": "Session stores trust. JWT stores signatures. Cookies are the envelope. PASETO is JWT with the safeties on.",
            "cite": "the four-way mnemonic"
          },
          {
            "type": "explain-back",
            "prompt": "You've separated **sessions** (storage), **JWT/PASETO** (token format), and **cookies** (transport) — three different layers people constantly conflate. Design end-to-end auth for a first-party web app that needs **instant logout**, then say what you'd change for a **mobile + service-to-service** client, and name the trade-off you accept in the second design.",
            "modelAnswer": "These are three independent axes, so I pick one from each layer to fit the requirement. For the first-party web app that needs instant logout, *where trust lives* is the deciding factor: I want server-side sessions (a random session ID in Redis) so logout is just deleting the row — instant revocation, which stateless tokens can't give me. Transport is an HttpOnly + Secure + SameSite=Lax cookie, because the client is a browser and HttpOnly keeps the ID out of reach of XSS, while SameSite also buys CSRF protection. Token format is almost irrelevant here since the cookie carries an opaque ID the server looks up. The trade-off accepted: every request pays a Redis round trip, and if the session store is down nobody can authenticate — I'm trading scalability/availability for instant revocation and simplicity. For mobile + service-to-service, cookies and a shared session store stop fitting (non-browser clients, cross-domain, want any node to verify without I/O), so I switch to a stateless token: a short-TTL (15m) JWT — or PASETO v4.public if it's greenfield with no JWT lock-in, because PASETO pins the algorithm and removes the `alg`-confusion / `alg:none` footguns — sent in the `Authorization: Bearer` header, paired with a refresh-token row in the DB. The trade-off I now accept: revocation is no longer instant — a stolen access token is valid until it expires (mitigated only by short TTL + a refresh blocklist), and a leaked signing secret forges every user. So the through-line is: instant logout pushes you to server-side storage; horizontal/cross-client scaling pushes you to stateless signatures — and you can't fully have both.",
            "hint": "Pick one choice per layer (storage / format / transport) and let the hard requirement — instant logout vs stateless scaling — drive it."
          }
        ]
      }
    ]
  },
  "fs-caching-strategies": {
    "sections": [
      {
        "heading": "Five named patterns, one decision tree",
        "body": [
          {
            "type": "p",
            "text": "**A cache is a lie you tell on purpose.** You promise the user a fast answer by keeping a recent copy near the request — but every copy you keep is one more place reality can drift from. The five named patterns are five different deals you cut between speed, freshness, and durability."
          },
          {
            "type": "p",
            "text": "**Pick by who owns the write path.** Cache-aside makes the app responsible. Read/write-through hide the cache behind a library. Write-back trades durability for raw throughput. Write-around treats the cache as a read-only shortcut."
          },
          {
            "type": "table",
            "headers": ["Pattern", "Write path", "Failure mode"],
            "rows": [
              ["Cache-aside",   "DB then invalidate cache",        "Race between fill and invalidate"],
              ["Read-through",  "App writes DB directly",          "Cold cache → thundering herd"],
              ["Write-through", "App → cache → DB (sync)",         "Slow writes; cache is a SPOF"],
              ["Write-back",    "App → cache; DB written async",   "Lost writes if cache dies first"],
              ["Write-around",  "DB only; cache skipped on write", "First read after write always misses"]
            ]
          }
        ]
      },
      {
        "heading": "Cache-aside is the default — here's why",
        "body": [
          {
            "type": "p",
            "text": "**Cache-aside (a.k.a. lazy loading) is the pattern most teams reach for.** The app code is in charge: check cache, miss → query DB, write back to cache, return. Writes go straight to the DB and the cache key is deleted so the next reader refills it."
          },
          {
            "type": "p",
            "text": "**Consistency story**: eventually consistent, biased toward the DB. **Failure mode**: a TTL too long hides DB schema changes; a fill-vs-invalidate race can resurrect stale data. Both are survivable with short TTLs and a single-flight wrapper around the fill."
          },
          {
            "type": "walkthrough",
            "title": "Cache-aside on a GET /users/42",
            "caption": "One request, one cache miss, one DB hit, one fill.",
            "nodes": [
              { "id": "app",   "label": "App",      "subtitle": "WEB SERVER",  "accent": "amber", "x": 0.15, "y": 0.5 },
              { "id": "cache", "label": "Redis",    "subtitle": "USER:42",     "accent": "fire",  "x": 0.50, "y": 0.5 },
              { "id": "db",    "label": "Postgres", "subtitle": "USERS TABLE", "accent": "water", "x": 0.85, "y": 0.5 }
            ],
            "steps": [
              {
                "title": "App checks cache first",
                "description": "Request lands. App computes the key `user:42` and asks Redis. The cache is the cheap question — milliseconds, no JOIN.",
                "activeNodes": ["app", "cache"],
                "activeEdges": [{ "from": "app", "to": "cache", "label": "GET user:42" }]
              },
              {
                "title": "Cache miss → fall through to DB",
                "description": "Redis returns nil. The app accepts the miss, opens a DB connection, and runs the real query. This is the slow path you're trying to amortize.",
                "activeNodes": ["app", "db"],
                "activeEdges": [{ "from": "app", "to": "db", "label": "SELECT" }]
              },
              {
                "title": "App fills cache with TTL",
                "description": "Row comes back. App SETs `user:42` in Redis with a short TTL (say 60s). Next request for this user skips Postgres entirely until the TTL burns down.",
                "activeNodes": ["app", "cache"],
                "activeEdges": [{ "from": "app", "to": "cache", "label": "SETEX 60s" }]
              },
              {
                "title": "Response returned; next read is a hit",
                "description": "App responds to the client. The next reader inside the TTL window finds `user:42` in Redis and never touches the DB.",
                "activeNodes": ["app"],
                "activeEdges": []
              }
            ]
          }
        ]
      },
      {
        "heading": "Coding it in Node + Redis",
        "body": [
          {
            "type": "p",
            "text": "**The whole pattern fits in fifteen lines.** `ioredis` for the client, a key naming scheme, a TTL, and an invalidate on write. The single trickiest bit is the race: two readers can both miss, both query, both fill. That's usually fine — but on hot keys, wrap the fill in a mutex (single-flight)."
          },
          {
            "type": "code",
            "lang": "javascript",
            "text": "// users.js — cache-aside on top of Postgres + Redis\nimport Redis from 'ioredis';\nimport { db } from './db.js';\n\nconst redis = new Redis(process.env.REDIS_URL);\nconst TTL = 60;  // seconds  short on purpose  staleness budget\n\nexport async function getUser(id) {\n  const key = `user:${id}`;  // one key shape  one cache  no per-route variants\n  const hit = await redis.get(key);\n  if (hit) return JSON.parse(hit);  // fast path  ~1ms vs 20ms DB query\n\n  // miss  fall through to DB\n  const { rows } = await db.query('SELECT * FROM users WHERE id = $1', [id]);\n  const user = rows[0] ?? null;\n  if (user) await redis.setex(key, TTL, JSON.stringify(user));\n  // setex  set + ttl in one op  cheaper than SET then EXPIRE\n  return user;\n}\n\nexport async function updateUser(id, patch) {\n  await db.query('UPDATE users SET name = $1 WHERE id = $2', [patch.name, id]);\n  await redis.del(`user:${id}`);\n  // delete, don't overwrite  next reader refills with the canonical row\n  // overwriting risks shipping a half-updated object back to cache\n}"
          },
          {
            "type": "pros-cons",
            "goodLabel": "GOOD FOR",
            "watchLabel": "WATCH OUT FOR",
            "good": [
              "Read-heavy workloads where most rows are cold and a few are scorching hot",
              "Short TTLs (10s–5m) — cheap insurance against schema drift and stale reads",
              "Single-flight wrappers on hot keys so one DB query serves N concurrent misses",
              "Deleting the key on write — never writing the patched value back to the cache"
            ],
            "watch": [
              "Write-back without persistence — a Redis crash = lost mutations",
              "Caching forever (no TTL) — bugs in invalidation become permanent ghosts",
              "Write-through making your DB write latency the cache's latency too",
              "Caching the negative (`null`) without a separate short TTL — masks real deletes"
            ]
          },
          {
            "type": "practice",
            "lang": "yaml",
            "prompt": "Pick the caching pattern for each workload. Justify in one line.",
            "starter": "workloads:\n  - name: product catalog read API   # 99% reads, occasional admin edits\n    pattern: \"\"\n    why: \"\"\n  - name: write-heavy clickstream    # 50k writes/sec, reads aggregated nightly\n    pattern: \"\"\n    why: \"\"\n  - name: user profile page          # read frequently, updated by the user themselves\n    pattern: \"\"\n    why: \"\"\n  - name: large file uploads         # writes are huge, reads stream through CDN\n    pattern: \"\"\n    why: \"\"\n",
            "hint": "Match the pattern to who owns the write path. Read-heavy + small objects → cache-aside. Huge writes you don't want to cache → write-around. Throughput beats durability → write-back. Library abstracts the cache → read/write-through."
          },
          {
            "type": "quote",
            "text": "Aside reads, through writes, back for throughput, around for bulk. Five patterns, one mnemonic — pick the one whose failure mode you can survive.",
            "cite": "the caching cheat sheet"
          },
          {
            "type": "explain-back",
            "prompt": "You've seen the **five patterns**, why **cache-aside** is the default, the role of **short TTLs**, **delete-on-write invalidation**, and the **fill-vs-invalidate / thundering-herd race**. Design the caching for a read-heavy `GET /users/:id` endpoint that must never serve obviously stale data after an edit, then name the one failure mode you're deliberately choosing to live with.",
            "modelAnswer": "I'd pick cache-aside because the workload is read-heavy with occasional writes and I want the app to own the write path so consistency stays biased toward the DB. Read path: check Redis for `user:42`; on a hit return it (~1ms), on a miss query Postgres, then `SETEX` the row with a deliberately short TTL (say 60s) so even if invalidation is ever missed, drift self-heals within a minute. Write path: write to Postgres first, then **delete** the key — not overwrite it — so the next reader refills from the canonical row; overwriting risks caching a half-built object. That delete is what keeps it from serving obviously stale data after an edit. The two named hazards integrate here: a hot key that just got invalidated can let many concurrent readers all miss and stampede the DB (thundering herd), and two of those readers racing fill-vs-invalidate can briefly resurrect stale data — so on hot keys I wrap the fill in a single-flight mutex so one DB query serves N waiting readers. The failure mode I deliberately accept: cache-aside is only *eventually* consistent — there's a tiny window between the DB write committing and the cache delete landing where a reader can still get the old value, and the short TTL caps how long any missed invalidation can linger. I accept that millisecond-to-60-second staleness window in exchange for cheap reads and a simple, survivable failure story (a Redis crash costs latency, never data — unlike write-back, which would cost durability).",
            "hint": "Cache-aside + short TTL + delete (not overwrite) on write; then say which consistency window you're knowingly accepting."
          }
        ]
      }
    ]
  },
  "lab-realtime-chat": {
    "sections": [
      {
        "heading": "Design a real-time chat backend",
        "body": [
          {
            "type": "system-design-lab",
            "id": "lab-realtime-chat",
            "title": "Design a real-time chat backend",
            "estimatedMin": 30,
            "scenario": "You are designing the backend for a real-time chat product. Targets: **50K concurrent users**, **group chats up to 200 members**, **message history kept forever**. You have 30 minutes. Whiteboard the connection layer, fanout, storage, presence, and what happens when the network blinks.",
            "phases": [
              {
                "kind": "requirements",
                "title": "Phase 1: Requirements",
                "prompt": "Lock the spec before you draw boxes. What's the **delivery guarantee** — at-least-once or exactly-once? Is **ordered delivery** required? **Read receipts** — v1 or v2? Each answer changes which architecture pieces you actually need.",
                "blocks": [
                  {
                    "type": "predict",
                    "prompt": "An interviewer says \"design a chat backend.\" Which clarifying question matters **most** for sizing the system?",
                    "options": [
                      "\"What color is the message bubble?\"",
                      "\"What's the message rate per active user, and the max group size?\" — this drives fanout amplification, the #1 cost driver",
                      "\"Do we use TypeScript or JavaScript?\"",
                      "\"Should we use AWS or GCP?\""
                    ],
                    "answer": 1,
                    "explain": "**Fanout amplification** is the architectural pivot. If a user in a 200-person group sends 1 message, that's 200 fanout events — 200x amplification. With 50K users × 5 msg/min avg, the fanout-adjusted write rate explodes from 4K writes/sec to potentially 100K+ events/sec. Until you have that number, every other decision (Kafka topic count, Redis pub/sub partitioning, websocket connection budget) is guesswork. Bubble color is a UI decision, cloud choice is irrelevant at this layer, and TS vs JS is a 5-minute conversation."
                  },
                  {
                    "type": "explain-back",
                    "prompt": "Why is **at-least-once** the universal delivery guarantee for chat, and what does that force the **client** to do?",
                    "modelAnswer": "Exactly-once delivery is provably impossible across an unreliable network without ack-and-dedupe at both ends — it always collapses into at-least-once + idempotent processing. Practically every chat system (WhatsApp, Slack, iMessage) accepts at-least-once and pushes the dedupe burden onto the client. The client **must** stamp every outgoing message with a client-generated `message_id` (usually a UUID), and on receipt, the client deduplicates by ID before rendering. Without client-side dedupe, the user sees their own message appear twice during a reconnect storm. This is one of those decisions where the protocol-level guarantee is weaker than what the product needs, and the gap is closed by client-side conventions.",
                    "hint": "Client-generated IDs and dedupe."
                  }
                ],
                "reference": "**Functional:** 1-to-1 and group chat (up to 200), text + image attachments, message history (forever, paginated), typing indicators, read receipts (v2). **Non-functional:** 50K concurrent connections; ~5 messages/min per active user → ~4K msg/sec; group fanout up to 200x → up to ~50K event/sec; p95 message-send-to-display < 500ms; history-load p95 < 200ms. **Guarantees:** at-least-once delivery + client-side dedupe by `client_message_id`; **strict per-conversation ordering** (not global); messages durable on server before ack. **Non-goals (v1):** end-to-end encryption, voice/video, message editing after 5 minutes, federation."
              },
              {
                "kind": "api",
                "title": "Phase 2: Connection (WebSocket vs SSE vs polling)",
                "prompt": "Three transport options for the server-to-client push channel. Each has a real failure mode. Pick one and be ready to defend why you didn't pick the obvious alternative.",
                "blocks": [
                  {
                    "type": "predict",
                    "prompt": "Long polling is rarely the right answer for chat at this scale. Why?",
                    "options": [
                      "Long polling is deprecated by the HTTP spec",
                      "Long polling creates a new TCP+TLS handshake every ~30s per client — at 50K concurrent that's 1,600 handshakes/sec of pure overhead, plus a thundering-herd risk every time the poll window aligns",
                      "Long polling doesn't work behind corporate proxies",
                      "Long polling can't carry binary data"
                    ],
                    "answer": 1,
                    "explain": "The connection churn is what kills you. Each long-poll cycle either receives a message (return immediately, client reconnects) or times out (return empty, client reconnects). Either way, you pay the **TCP+TLS handshake cost** (~1-3 round trips, ~100ms+ on mobile) on every cycle. At 50K concurrent users polling every 30s, that's 1,600 reconnects/sec — your TLS termination tier melts. Long polling was the right answer in 2010 before WebSockets had universal support; today it's a fallback transport only."
                  },
                  {
                    "type": "fix-it",
                    "prompt": "The WebSocket server below has one bug that causes **silent connection rot**: clients think they're connected but no messages flow.",
                    "code": "const wss = new WebSocketServer({ port: 8080 });\nwss.on('connection', (ws) => {\n  ws.on('message', (data) => {\n    handleMessage(ws, JSON.parse(data));\n  });\n  ws.on('close', () => {\n    sessionStore.delete(ws.userId);\n  });\n});\n",
                    "bug": "wss.on('connection', (ws) => {",
                    "fix": "const HEARTBEAT_MS = 30000;\nwss.on('connection', (ws) => {\n  ws.isAlive = true;\n  ws.on('pong', () => { ws.isAlive = true; });\n  const interval = setInterval(() => {\n    if (!ws.isAlive) return ws.terminate();\n    ws.isAlive = false;\n    ws.ping();\n  }, HEARTBEAT_MS);\n  ws.on('close', () => clearInterval(interval));",
                    "lang": "javascript",
                    "explain": "Without a **ping/pong heartbeat**, intermediaries (corporate proxies, mobile NAT timeouts, AWS NLB idle timeout = 350s) silently drop the underlying TCP connection while neither end's WebSocket object notices. The user's app thinks it's connected; the server has long forgotten about them. Heartbeats every 30s detect the half-open state and trigger reconnection. This is the **single most common production WebSocket bug** — it's why you'll see Slack and Discord both ping every ~25-30s."
                  }
                ],
                "reference": "**Choice: WebSocket as primary, SSE as documented fallback.** WebSocket gives bidirectional, full-duplex, low-overhead push — typing indicators and message acks travel client→server on the same connection. **SSE alternative defense:** SSE is server-push-only (no client→server channel on the same connection), unidirectional, and uses plain HTTP/2 streaming — easier to debug, simpler proxy story, no ping/pong machinery needed. For a read-mostly product (news feed, live scores) SSE is genuinely superior. For chat, the bidirectional channel saves a second HTTP request per outgoing message + a reconnect during typing-indicator bursts. **Operational details:** heartbeat ping every 30s; max 50K connections/server with 4 vCPU, 16 GB RAM (~300 KB/conn); behind NLB (layer 4) not ALB (cleaner for sticky sessions and reduced overhead)."
              },
              {
                "kind": "data-model",
                "title": "Phase 3: Message fanout",
                "prompt": "A user in a 200-person group hits send. **How do those 200 deliveries actually happen?** Three patterns: pull-on-read, push-via-pub/sub, push-via-targeted-fanout. Each has a cost shape.",
                "blocks": [
                  {
                    "type": "predict",
                    "prompt": "You pick **Redis Pub/Sub** for fanout: every group has a channel, every connected member subscribes, sends fan out via PUBLISH. What's the **dominant failure mode** at 50K concurrent users?",
                    "options": [
                      "Redis Pub/Sub is too slow — latency is multi-second",
                      "**Redis Pub/Sub is fire-and-forget**: if a subscriber's network blips for 200ms, they miss messages permanently — Pub/Sub has no durability or replay. You need Streams (or Kafka) for durable fanout.",
                      "Redis Pub/Sub doesn't support more than 1,000 channels",
                      "Redis Pub/Sub requires a dedicated cluster"
                    ],
                    "answer": 1,
                    "explain": "Redis classic Pub/Sub publishes to currently-connected subscribers and immediately forgets the message — it's **lossy by design**. For chat that's catastrophic: a user whose WebSocket reconnects 200ms after a message is published never sees that message. The standard fix is **Redis Streams** (durable, fan-in/fan-out with consumer groups + checkpointing) or **Kafka topics partitioned by conversation_id**. The hybrid pattern: Streams as durable backbone + an in-memory hot path (the server keeps a small ring buffer of recent messages so a fast reconnect can replay locally without hitting Streams)."
                  },
                  {
                    "type": "explain-back",
                    "prompt": "Explain the trade-off between **push fanout at write time** (write the message into 200 per-user inboxes) vs **pull fanout at read time** (write once into the conversation log, each client pulls from there).",
                    "modelAnswer": "Push-at-write makes reads cheap (just read your own inbox) but writes expensive — a 200-person group means 1 send = 200 writes, and storage cost scales with `num_messages × group_size`. Pull-at-read makes writes cheap (1 write per send) but reads expensive — every client opening a group fetches the shared log, and you need per-user read cursors. Most real systems use **push for active conversations** (so live members get sub-second delivery via their pre-warmed inboxes) and **pull for history scrollback** (so opening a chat from 2 years ago doesn't require maintaining 200 forever-growing inboxes). Slack and Discord both ship hybrid variants. The pure-push end of the spectrum is Twitter timelines (called \"fanout-on-write\"); the pure-pull end is Reddit threads. Chat lives in between because conversations have a small bounded fanout (≤ 200) but unbounded history.",
                    "hint": "Write amplification vs read amplification."
                  }
                ],
                "reference": "**Choice: hybrid fanout.** (1) **Source of truth:** a single append-only log per conversation in Cassandra (or DynamoDB) — `(conversation_id, message_id [ULID])` is the primary key. One write per message. (2) **Live delivery:** publish to a **Kafka topic per shard** (256 shards across all conversations, keyed by `conversation_id`); each WebSocket server subscribes to a slice. On message receive, the server looks up which connected clients care and pushes via WS. (3) **No per-user inbox**: clients pull history on scroll-back via paginated reads on the conversation log. (4) **Hot cache:** Redis holds the last 100 messages per conversation in a sorted set, so a reconnecting client gets the last few minutes instantly. **Why no per-user inbox:** at 200-person groups with forever-retention, per-user inboxes blow storage 200x. Chat conversations are inherently shared logs — store them that way."
              },
              {
                "kind": "data-model",
                "title": "Phase 4: Message storage + history",
                "prompt": "Forever retention. Paginated scrollback. Which DB, which schema, which index. Be specific — DB choice is where most candidates wave their hands.",
                "blocks": [
                  {
                    "type": "predict",
                    "prompt": "You're pitching **Cassandra** over Postgres for message storage. Which justification is most defensible at this scale?",
                    "options": [
                      "Cassandra is faster than Postgres for any workload",
                      "Cassandra's wide-row model is **naturally optimized for the chat access pattern**: PK `(conversation_id, message_id)`, range scan = scrolling chat history. Writes are append-only, scaling is horizontal, and no JOIN tax. Postgres would require careful partitioning + dedicated indexes per conversation, plus a hot-row hot-spot problem.",
                      "Cassandra is free and Postgres is paid",
                      "Cassandra automatically handles encryption at rest"
                    ],
                    "answer": 1,
                    "explain": "The defensible argument is **access-pattern fit**, not generic \"Cassandra scales better\". Chat history is **append-only + range-scan by partition** — the canonical Cassandra wide-row use case. You write `(conversation_id, timestamp_ulid) → message_payload`, and reading the last 50 messages is a single partition scan with `ORDER BY message_id DESC LIMIT 50`. Postgres can do this, but you fight the planner, fight the indexes, and end up sharding by conversation_id manually — at which point you've reinvented Cassandra. Generic \"X is faster\" is the answer that loses points; access-pattern reasoning wins them."
                  },
                  {
                    "type": "fill-blank",
                    "prompt": "Fill in the Cassandra schema for the message log.",
                    "code": "CREATE TABLE messages (\n    conversation_id  UUID,\n    message_id       TIMEUUID,           -- ULID/TIMEUUID gives monotonic ordering within a conversation\n    sender_id        UUID,\n    body             TEXT,\n    client_msg_id    UUID,                -- for client-side dedupe (at-least-once)\n    created_at       TIMESTAMP,\n    PRIMARY KEY (___1___, ___2___)\n) WITH CLUSTERING ORDER BY (___3___ DESC);  -- newest first = cheap pagination",
                    "blanks": [
                      { "id": 1, "correct": "conversation_id" },
                      { "id": 2, "correct": "message_id" },
                      { "id": 3, "correct": "message_id" }
                    ],
                    "options": ["conversation_id", "message_id", "message_id", "sender_id", "client_msg_id", "created_at"],
                    "explain": "**`conversation_id` as the partition key** = all messages in one chat live on one node (or replica set), so a 50-message history fetch is a single-partition read. **`message_id` as the clustering key** with **DESC order** = the latest messages live at the start of the row, so `LIMIT 50` is O(1) regardless of how many messages the conversation has. This is the pattern: partition by the entity that defines the query, cluster by the dimension you'll paginate on. Get it wrong and you'll do scatter-gather across 256 nodes for every read."
                  }
                ],
                "reference": "**DB: Cassandra (or ScyllaDB).** Schema: `messages(conversation_id PK, message_id ULID CK DESC, sender_id, body, client_msg_id, created_at)`. Pagination: WHERE conversation_id = ? AND message_id < cursor LIMIT 50. **ULID > UUIDv4** because ULIDs are lexicographically sortable by creation time — `ORDER BY message_id DESC` is free, no extra timestamp column needed. **Attachments:** store image/video in S3, message body holds the URL + thumbnail metadata; never inline blobs in the message row. **TTL:** none (forever retention is a product requirement). **Storage estimate:** 4K msg/sec × 86,400 sec/day = ~345M msg/day × ~500 bytes = ~170 GB/day = ~60 TB/year — Cassandra handles that linearly by adding nodes. **Search:** denormalized to Elasticsearch via CDC stream (Debezium → Kafka → ES) — never search the OLTP store."
              },
              {
                "kind": "scaling",
                "title": "Phase 5: Presence + typing indicators",
                "prompt": "Presence (\"Maya is online\") and typing indicators (\"Sam is typing…\") are **ephemeral, high-churn signals**. Storing them like messages is a costly mistake. Be opinionated about what goes in Redis with a TTL and what gets fanned out via pub/sub.",
                "blocks": [
                  {
                    "type": "predict",
                    "prompt": "Where does the **\"Sam is typing…\"** signal live?",
                    "options": [
                      "In Cassandra, same table as messages",
                      "In Postgres, in a `typing_events` table",
                      "**Nowhere durable** — it's a transient event sent peer-to-peer over WebSocket (or via Redis pub/sub on the conversation channel) and discarded after 3-5 seconds. Storing typing events is a textbook over-design.",
                      "In S3, with a 1-minute lifecycle policy"
                    ],
                    "answer": 2,
                    "explain": "Typing indicators are pure UI ephemera. They're **fire-and-forget** events — the message itself \"Sam typed something\" has zero value 5 seconds after it's sent. You broadcast `typing:start` to other members of the conversation (via the same WebSocket fanout you use for messages), and the client renders the indicator with a local 3-5s timeout. If the network drops the signal, who cares — the next message that arrives implicitly cancels the indicator. **Anyone who stores typing events in their primary DB is paying durable-write cost (synced disk, replication) for data that lives 3 seconds.** This is the exact case where senior judgment shows up: knowing what NOT to persist."
                  },
                  {
                    "type": "explain-back",
                    "prompt": "Explain how you'd build **presence** (\"who is online right now\") for 50K users efficiently.",
                    "modelAnswer": "Presence is a **single bit per user** that flips on/off as their WebSocket connects/disconnects. Store it in **Redis with a TTL** — when a user's WebSocket connects, the server does `SET presence:user:123 \"online\" EX 60`; the WebSocket sends a heartbeat every 30s that refreshes the TTL. If the user disconnects, the TTL expires and they're implicitly offline — no graceful-disconnect handling needed (which is good, because clients crash). Querying \"is user X online?\" is `EXISTS presence:user:X`. For **friend lists**, batch the EXISTS calls or maintain a Redis set per user of their friends and use SINTER. **Push for changes:** when presence flips, publish to a Redis pub/sub channel `presence:user:123` that the user's contacts subscribe to. Total Redis cost: 50K keys × ~64 bytes = ~3 MB, trivial. The TTL approach is load-bearing — it makes the system **self-cleaning** under crashes, partitions, and process restarts.",
                    "hint": "TTL-based, self-cleaning, Redis."
                  }
                ],
                "reference": "**Presence:** Redis key `presence:user:{id}` with `EX 60` TTL, refreshed by 30s WebSocket heartbeat. Query via `EXISTS`. Changes published to `pubsub:presence:user:{id}` so contacts get a real-time \"came online\" event. **Typing indicators:** never persisted. Published as `{type: 'typing_start', conv_id, user_id}` events on the conversation's Redis pub/sub channel; client renders with a 4s local timeout. **Last seen:** if you need \"last seen 2 hours ago\" UX, write the disconnect time to a separate Redis hash (`last_seen:user:{id}`) — that one *is* persistent (no TTL) and updated on heartbeat. **Why NOT a database:** the write rate (50K users × heartbeat every 30s = ~1,700 writes/sec just for presence, before typing events) would dominate your DB's IOPS budget for zero durable value."
              },
              {
                "kind": "pitfalls",
                "title": "Phase 6: Failure + reconnect",
                "prompt": "Mobile networks blink. Servers restart. Whole AZs fail. Walk through the reconnect protocol — and the **gap-fill** problem (a client was offline for 3 minutes, how do they catch up without re-fetching the entire 5-year history)?",
                "blocks": [
                  {
                    "type": "predict",
                    "prompt": "A client's WebSocket drops at 12:00:00 and reconnects at 12:03:00. They missed ~50 messages across 5 conversations. What's the right protocol to catch up?",
                    "options": [
                      "Client refetches the entire message history on reconnect",
                      "Client sends `last_message_id` per active conversation; server responds with `messages > last_id` per conversation, capped at 100 per conv (prompt full reload if cap exceeded)",
                      "Server pushes everything it has on reconnect — let the client sort it out",
                      "Use a CRDT and let it re-merge"
                    ],
                    "answer": 1,
                    "explain": "The cursor-based catch-up is the standard pattern. Client maintains `last_seen_message_id` per conversation (persisted locally). On reconnect, sends `{conv_id, last_id}` for each active conversation; server does a bounded range scan and ships the gap. **Cap at 100** because if a user has been offline for a month in a busy group, you don't want a 50,000-message reply payload — fall back to \"prompt user to load history.\" CRDTs solve a different problem (concurrent edits to the same document); they're overkill for ordered append-only chat. The brute-force \"send everything\" approach works at 100 users and dies at 50K."
                  },
                  {
                    "type": "fix-it",
                    "prompt": "The reconnect logic below has a bug that causes **duplicate message rendering**.",
                    "code": "ws.onopen = () => {\n  ws.send(JSON.stringify({\n    type: 'sync',\n    cursors: getLocalCursors()\n  }));\n};\n\nws.onmessage = (e) => {\n  const msg = JSON.parse(e.data);\n  renderMessage(msg);\n  updateCursor(msg.conv_id, msg.message_id);\n};\n",
                    "bug": "renderMessage(msg);",
                    "fix": "if (!hasRenderedBefore(msg.client_msg_id)) { renderMessage(msg); }",
                    "lang": "javascript",
                    "explain": "On reconnect, the server may legitimately re-send messages that the client already received (because at-least-once delivery + the server can't be sure the previous WS actually delivered). Without **client-side dedupe by `client_msg_id`**, the user sees \"hello\" twice in their chat after every flaky-network event. The dedupe set is a small in-memory LRU (last 1,000 IDs) — bounded memory, O(1) lookup, fixes the entire class of \"messages duplicating sometimes\" bug reports."
                  }
                ],
                "reference": "**Reconnect protocol:** (1) Client persists `last_message_id` per conversation locally. (2) On reconnect, send `{type: 'sync', cursors: [{conv_id, last_id}]}`. (3) Server does bounded range queries (LIMIT 100/conv); if any conv has > 100 messages in the gap, return `{conv_id, status: 'full_reload_required'}` and let the UI prompt. (4) Client renders received messages **after deduping by `client_msg_id`** (LRU cache of last 1K IDs). (5) After sync, normal real-time WS resumes. **Server-side resilience:** WebSocket server restart = clients reconnect within 1-2s (exponential backoff capped at 30s); behind NLB so any healthy server can pick them up. **Cross-AZ failure:** Cassandra is multi-AZ replicated; Kafka topics replication factor 3 across AZs; Redis Sentinel for failover (~10s). **Message ack flow:** client sends → server persists to Cassandra → server acks back to sender on the WS → server fans out to subscribers. If the network drops between persist and ack, client retries with same `client_msg_id` and server dedupes."
              },
              {
                "kind": "build",
                "title": "Phase 7: Ship it for real",
                "prompt": "Forget the 50K-connection cluster for a second. **Build the live loop**: a WebSocket server that echoes a message to everyone in a room, persisted so history survives a refresh. Two browser tabs talking to each other is the whole win for v1.",
                "blocks": [
                  {
                    "type": "predict",
                    "prompt": "You're scaffolding your own repo for the v1 chat backend. What's the **smallest build** that proves the design end-to-end?",
                    "options": [
                      "Kafka shards, Cassandra, Redis presence, and 50K-connection load testing before anything works",
                      "One WebSocket server: a client connects, joins a room, sends a message → server persists it and fans it out to others in the room. Open two browser tabs and chat",
                      "Only the typing-indicator animation — the messages can come later",
                      "End-to-end encryption first, since security can't be bolted on"
                    ],
                    "answer": 1,
                    "explain": "The **live loop** is the product: connect → join room → send → server persists → others see it. Two browser tabs exchanging messages, with history that survives a refresh, proves the spine. Kafka fanout, Cassandra, Redis presence, and the 50K-connection budget are *scaling layers* — each one is a measurable upgrade you add after the single-server version works. (E2E encryption was an explicit v1 non-goal.) Build the thing you can see working in 30 minutes, then grow it."
                  },
                  {
                    "type": "fill-blank",
                    "prompt": "Fill in the staged plan to get your own chat backend running. Each line is one short sitting.",
                    "code": "# 1. Scaffold your own repo: a minimal Node app using the ___1___ library (or Socket.IO)\n# 2. Implement the core: on connect, join a room; on message, persist it then broadcast to the room\n# 3. Persist: append each message to ___2___ (SQLite / Postgres) so history survives a refresh\n# 4. Add the must-have: a ping/pong ___3___ every 30s so dead connections get cleaned up\n# 5. Run it locally: open two browser tabs, send a message, watch it appear in the other instantly",
                    "blanks": [
                      { "id": 1, "correct": "ws" },
                      { "id": 2, "correct": "SQLite" },
                      { "id": 3, "correct": "heartbeat" }
                    ],
                    "options": ["ws", "SQLite", "heartbeat", "Kafka", "Cassandra", "gossip"],
                    "explain": "The **`ws`** library (or Socket.IO if you want reconnection batteries-included) is the smallest real WebSocket server. **SQLite** is enough to make history survive a refresh — swap to Cassandra later behind the same append/read interface. The **heartbeat** is not optional even in v1: it's the single most common production WebSocket bug you fixed in Phase 2, and without it your two tabs will silently rot behind any proxy. Persist-then-broadcast (not broadcast-then-persist) means a message is durable before anyone sees it."
                  },
                  {
                    "type": "fix-it",
                    "prompt": "Your v1 server broadcasts messages fine, but after a flaky reconnect the same message renders twice in the other tab. One missing guard.",
                    "code": "ws.on('message', (raw) => {\n  const msg = JSON.parse(raw);\n  db.append(msg.room, msg);\n  for (const peer of roomPeers(msg.room)) {\n    peer.send(JSON.stringify(msg));\n  }\n});\n",
                    "bug": "db.append(msg.room, msg);",
                    "fix": "if (db.seen(msg.client_msg_id)) return;  // at-least-once delivery: dedupe by client id before persist + fanout\n  db.append(msg.room, msg);",
                    "lang": "javascript",
                    "explain": "You designed for this in Phase 1 — at-least-once delivery means a client may resend the same message after a reconnect, so the server (and client) must dedupe by `client_msg_id`. Without the guard, a reconnect storm persists and re-broadcasts duplicates, and the other tab shows 'hello' twice. Checking `seen(client_msg_id)` before append + fanout closes the entire class of 'messages duplicating sometimes' bugs — and seeing your own predicted failure appear in a running app is exactly why you build it."
                  }
                ],
                "reference": "**Ship-it checklist (v1, one weekend):** (1) Scaffold your own repo — a minimal Node app using the `ws` library (or Socket.IO for built-in reconnect). (2) Implement the live loop: on connect, join a room; on message, **dedupe by `client_msg_id` → persist → broadcast** to the room's peers. (3) Persist to SQLite (or one Postgres table) behind a thin append/read interface so the swap to Cassandra later is contained. (4) Add the non-negotiable **30s ping/pong heartbeat** (Phase 2) so half-open connections get terminated. (5) Run locally: open two browser tabs, send a message, watch it appear in the other instantly — then refresh one tab and confirm history reloads. **Then scale, in order:** move fanout to Redis Streams / Kafka per-conversation, add the Redis hot-cache + presence TTLs, and put the WS servers behind an NLB. Each is a separate demoable commit. **Do NOT** build E2E encryption, voice/video, or the full sharded fanout for v1 — those were stated non-goals. One server two tabs can chat through beats a half-wired cluster."
              }
            ],
            "reflection": "What's the strongest argument for SSE over WebSocket here, even though most teams default to WebSocket?"
          }
        ]
      }
    ]
  },
};
