export default {
  "ci-cd": {
    "sections": [
      {
        "heading": "The factory line",
        "body": [
          {
            "type": "p",
            "text": "**Picture a factory floor.** A part comes off the truck (you push code), gets inspected (lint), tested for defects (tests), assembled into the product (build a container), then trucked to the store (deploy). Every station refuses to pass the part downstream until its own gate is green. One bad weld and the whole line stops — loudly."
          },
          {
            "type": "p",
            "text": "That's a CI/CD pipeline. The point isn't speed — it's **forcing every change through the same gauntlet** so the version on prod was never touched by human hands."
          },
          {
            "type": "walkthrough",
            "title": "The standard pipeline",
            "height": 220,
            "why": "Every change runs the same gauntlet — so the version on prod was never touched by human hands.",
            "nodes": [
              {
                "id": "push",
                "label": "push",
                "subtitle": "git → main",
                "accent": "water",
                "x": 0.05,
                "y": 0.15
              },
              {
                "id": "lint",
                "label": "lint",
                "subtitle": "ruff",
                "accent": "amber",
                "x": 0.26,
                "y": 0.15
              },
              {
                "id": "test",
                "label": "test",
                "subtitle": "unit + int",
                "accent": "sky",
                "x": 0.46,
                "y": 0.5
              },
              {
                "id": "build",
                "label": "build",
                "subtitle": "docker",
                "accent": "earth",
                "x": 0.68,
                "y": 0.5
              },
              {
                "id": "deploy",
                "label": "deploy",
                "subtitle": "k8s · fly",
                "accent": "fire",
                "x": 0.92,
                "y": 0.85
              }
            ],
            "steps": [
              {
                "title": "Push to main",
                "description": "You `git push` a change. That push is the **trigger** — the only way code enters the pipeline. No one deploys from a laptop.",
                "activeNodes": ["push"],
                "activeEdges": []
              },
              {
                "title": "Lint runs first",
                "description": "The push fires the first gate: **lint** (`ruff`). It's the fastest check, so a style slip fails in seconds instead of after a full build.",
                "activeNodes": ["push", "lint"],
                "activeEdges": [{ "from": "push", "to": "lint", "label": "trigger" }]
              },
              {
                "title": "Tests, if clean",
                "description": "Only when lint is green do **unit + integration tests** run. Each station refuses to pass the part downstream until its own gate passes.",
                "activeNodes": ["lint", "test"],
                "activeEdges": [{ "from": "lint", "to": "test", "label": "if clean" }]
              },
              {
                "title": "Build the image, if green",
                "description": "Green tests unlock the **build** — your code is baked into an immutable Docker image. One artifact, promoted as-is from here on.",
                "activeNodes": ["test", "build"],
                "activeEdges": [{ "from": "test", "to": "build", "label": "if green" }]
              },
              {
                "title": "Deploy, if on main",
                "description": "Last gate: the **deploy** runs only on `main`, never on a PR branch. The built image ships to `k8s` or `fly` — untouched since the build step.",
                "activeNodes": ["build", "deploy"],
                "activeEdges": [{ "from": "build", "to": "deploy", "label": "if main" }]
              }
            ]
          }
        ]
      },
      {
        "heading": "CI vs Delivery vs Deployment",
        "body": [
          {
            "type": "p",
            "text": "Three words, used interchangeably, that mean different things. The distinction is *who pulls the lever at the end*."
          },
          {
            "type": "terms",
            "items": [
              {
                "term": "Continuous Integration",
                "def": "Every push runs lint + tests against the merged state. The output is a green check, not an artifact. This is the cheap, table-stakes part — if you don't have it, nothing else matters."
              },
              {
                "term": "Continuous Delivery",
                "def": "Every green main produces a deployable artifact (image, binary, helm chart) and stages it for prod. A human still clicks 'release'. Most companies live here."
              },
              {
                "term": "Continuous Deployment",
                "def": "Every green main goes straight to prod, no human in the loop. Requires real test coverage, feature flags, fast rollback, and observability. The dream — and the trap if you don't have all four."
              },
              {
                "term": "Trunk-based development",
                "def": "Short-lived branches, frequent merges to main, feature flags hide unfinished work. The development discipline that makes CD actually safe instead of terrifying."
              }
            ]
          }
        ]
      },
      {
        "heading": "A real GitHub Actions workflow",
        "body": [
          {
            "type": "build-along",
            "title": "Build the CI pipeline, piece by piece",
            "goal": "A workflow that lints, tests, then ships only when green. Click through, then build it for real in VS Code.",
            "lang": "yaml",
            "file": ".github/workflows/ci.yml",
            "steps": [
              {
                "title": "Name it + pick the trigger",
                "say": "To run on every push to main you need a trigger. The on: block is what wakes the pipeline up.",
                "add": "name: CI\non:\n  push:\n    branches: [main]"
              },
              {
                "title": "Spin up a runner + grab the code",
                "say": "A job runs on a fresh Ubuntu runner — it starts empty, so the first step checks out your repo.",
                "add": "\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4"
              },
              {
                "title": "Set up the language + cache deps",
                "say": "Install Python and cache pip so re-runs skip the download.",
                "add": "      - uses: actions/setup-python@v5\n        with:\n          python-version: '3.11'\n          cache: 'pip'\n      - run: pip install -r requirements.txt"
              },
              {
                "title": "Lint first — the fastest failure",
                "say": "Catch style and obvious mistakes before the slower tests, so red feedback comes in seconds.",
                "add": "      - run: ruff check ."
              },
              {
                "title": "Run the tests — the real gate",
                "say": "This is the gate. With maxfail set to 1 it bails on the first red test so you are not waiting on a doomed run.",
                "add": "      - run: pytest --maxfail=1"
              },
              {
                "title": "Deploy only when green",
                "say": "Ship only from main, and only if every step above passed. That is the whole point — prod was never touched by hand.",
                "add": "      - if: github.ref == 'refs/heads/main'\n        run: ./deploy.sh"
              }
            ]
          },
          {
            "type": "p",
            "text": "One file, two jobs, fan-out gated by branch. PRs run the cheap half; pushes to main earn the build-and-push:"
          },
          {
            "type": "p",
            "text": "**The `test` job** — lint first (fastest failure), then tests with `--maxfail=1` so red feedback comes quickly."
          },
          {
            "type": "code",
            "lang": "yaml",
            "text": "name: CI\non:\n  push:    { branches: [main] }  # main: full pipeline\n  pull_request: {}  # PRs: tests only\n\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4  # fetch the PR's merged state\n      - uses: actions/setup-python@v5\n        with:\n          python-version: '3.11'\n          cache: 'pip'  # skip pip download on rerun\n      - run: pip install -r requirements.txt\n      - run: ruff check .  # lint first — fastest failure\n      - run: pytest --cov --maxfail=1 # bail on first red test"
          },
          {
            "type": "p",
            "text": "**`build-push`** is branch-gated to `main` only, uses the short-lived `GITHUB_TOKEN` (no PAT), and reuses Docker layers across runs via the GHA cache backend."
          },
          {
            "type": "code",
            "lang": "yaml",
            "text": "  build-push:\n    needs: test  # only if test job passed\n    if: github.ref == 'refs/heads/main'   # never on PRs\n    runs-on: ubuntu-latest\n    permissions: { contents: read, packages: write }  # OIDC, no PAT\n    steps:\n      - uses: actions/checkout@v4\n      - uses: docker/login-action@v3\n        with:\n          registry: ghcr.io\n          username: ${{ github.actor }}\n          password: ${{ secrets.GITHUB_TOKEN }}  # short-lived, scoped\n      - uses: docker/build-push-action@v5\n        with:\n          push: true\n          tags: |\n            ghcr.io/${{ github.repository }}:${{ github.sha }}   # immutable\n            ghcr.io/${{ github.repository }}:latest  # convenience\n          cache-from: type=gha  # reuse layers across runs\n          cache-to:   type=gha,mode=max"
          }
        ]
      },
      {
        "heading": "Deployment strategies",
        "body": [
          {
            "type": "p",
            "text": "How the new version reaches prod is its own decision. Pick the strategy that matches your **rollback budget**, not your ambition."
          },
          {
            "type": "diagram",
            "title": "Blue-green: full flip behind the LB",
            "height": 200,
            "nodes": [
              {
                "id": "lb1",
                "label": "LB",
                "subtitle": "single switch",
                "accent": "water",
                "x": 0.1,
                "y": 0.5
              },
              {
                "id": "blue",
                "label": "v1 blue",
                "subtitle": "current · standby",
                "accent": "sky",
                "x": 0.55,
                "y": 0.25
              },
              {
                "id": "grn",
                "label": "v2 green",
                "subtitle": "warmed · verified",
                "accent": "fire",
                "x": 0.55,
                "y": 0.75
              }
            ],
            "edges": [
              {
                "from": "lb1",
                "to": "grn",
                "kind": "dashed",
                "label": "100% flip"
              },
              {
                "from": "lb1",
                "to": "blue",
                "kind": "solid",
                "label": "rollback path"
              }
            ]
          },
          {
            "type": "diagram",
            "title": "Canary: trickle traffic to v2",
            "height": 200,
            "nodes": [
              {
                "id": "lb2",
                "label": "LB",
                "subtitle": "weighted routing",
                "accent": "water",
                "x": 0.1,
                "y": 0.5
              },
              {
                "id": "old",
                "label": "v1 · 95%",
                "subtitle": "stable fleet",
                "accent": "sky",
                "x": 0.55,
                "y": 0.25
              },
              {
                "id": "new",
                "label": "v2 · 5%",
                "subtitle": "watch metrics",
                "accent": "fire",
                "x": 0.55,
                "y": 0.75
              }
            ],
            "edges": [
              {
                "from": "lb2",
                "to": "old",
                "kind": "dashed",
                "label": "majority"
              },
              {
                "from": "lb2",
                "to": "new",
                "kind": "dashed",
                "accent": "fire",
                "label": "trickle"
              }
            ]
          },
          {
            "type": "table",
            "headers": [
              "strategy",
              "rollback",
              "when to use"
            ],
            "rows": [
              [
                "**Rolling**",
                "minutes (1× infra)",
                "stateless services, low risk"
              ],
              [
                "**Blue-green**",
                "seconds, LB flip (2× infra)",
                "backwards-compat migrations, prod parity"
              ],
              [
                "**Canary**",
                "~30s drain (1× + canary)",
                "user-visible change, want real metrics first"
              ],
              [
                "**Recreate**",
                "redeploy old (1× infra)",
                "stateful single-instance, downtime OK"
              ]
            ]
          }
        ]
      },
      {
        "heading": "Watch out for",
        "body": [
          {
            "type": "pros-cons",
            "goodLabel": "WHAT GOOD LOOKS LIKE",
            "watchLabel": "GOTCHAS",
            "good": [
              "Same artifact promoted across envs — no 'rebuild for prod'",
              "Pipeline runs in under 10 min — devs wait, but not for coffee",
              "Failed deploy auto-rolls back without paging someone",
              "Secrets via OIDC / short-lived tokens, never long-lived PATs"
            ],
            "watch": [
              "**Flaky tests retried until green** — you're shipping bugs, just slower",
              "**`latest` tag in prod manifests** — you can't tell what's actually running",
              "**No DB migration story** — blue-green dies the second a column drops",
              "**Caching the lockfile but not the resolver** — silent dependency drift"
            ]
          },
          {
            "type": "p",
            "text": "**Key insight.** A pipeline isn't about automation — it's about **making the path of least resistance also the safe path**. If the easy way is `kubectl apply` from your laptop, your pipeline isn't real. Make pushing through main strictly faster than going around it, and the culture follows."
          },
          {
            "type": "explain-back",
            "prompt": "You've now seen the CI→Delivery→Deployment gates, a real GitHub Actions workflow, and two release strategies (**blue-green** and **canary**). Design the end-to-end path a single commit takes from `git push` to live traffic — say which strategy you'd default to for a payments service and the one trade-off you'd watch most closely.",
            "modelAnswer": "A commit hits a branch and CI runs the gauntlet on the **exact artifact** that will ship: lint → tests → build one immutable image tagged by SHA (never `latest`). That's the **CI** half. **Delivery** means that green artifact is now *deployable* — promoted, not rebuilt, across staging and prod. **Deployment** is the act of putting it in front of users, and that's where the strategy choice lives. For a payments service I'd default to **canary**: route 1–5% of real traffic to the new version, watch error rate and latency for a few minutes, and ramp only if the SLOs hold — because a bad payments deploy that hits 100% of users instantly is unrecoverable. Blue-green is simpler and gives an *atomic* flip with an instant rollback, but it sends all traffic at once, so a subtle bug is fully exposed the moment you switch. The trade-off I'd watch hardest is the **database migration**: both strategies assume old and new code can run against the *same* schema simultaneously, so every migration has to be backward-compatible (expand, then contract) or the canary/flip silently corrupts data while looking healthy.",
            "hint": "Trace the artifact: is it rebuilt per environment or promoted? Then ask what each strategy does to *the blast radius of a bad version*, and what shared resource both strategies quietly depend on.",
            "commit": {
              "q": "A bad build of the payments service is about to go live. Which release strategy keeps the blast radius smallest at the moment of release?",
              "opts": [
                "Blue-green — the atomic flip means you can roll back instantly",
                "Canary — only 1–5% of real traffic sees the new version while you watch SLOs",
                "Rebuild the image per environment so prod gets a fresh, clean artifact"
              ],
              "answer": 1,
              "why": "Blue-green rolls back fast, but the flip exposes 100% of users the instant you switch. Canary caps how many users a bad payments version can ever touch before you catch it."
            }
          }
        ]
      }
    ]
  },
  "yaml-basics": {
    "sections": [
      {
        "heading": "Why you keep seeing YAML",
        "body": [
          {
            "type": "p",
            "text": "Open a `docker-compose.yml`, a Kubernetes manifest, a GitHub Actions workflow, an Ansible playbook — **they're all YAML.** Four different tools, one file format. Learn to read YAML once and you can read all of them."
          },
          {
            "type": "p",
            "text": "YAML is **config-as-data**: it doesn't *do* anything, it just describes a shape — settings, a list of services, a pipeline. The tool reads that shape and acts on it. The whole language is three things: **scalars** (single values), **lists**, and **maps** (key/value). Indentation shows what's nested inside what. That's it."
          },
          {
            "type": "ul",
            "items": [
              "**Docker Compose** — describe services, ports, volumes",
              "**Kubernetes** — describe the desired state of your cluster",
              "**GitHub Actions** — describe a CI/CD pipeline",
              "**Ansible** — describe server configuration tasks"
            ]
          }
        ]
      },
      {
        "heading": "The three shapes",
        "body": [
          {
            "type": "p",
            "text": "Everything in YAML is built from three pieces. **Scalars** are single values (a string, number, bool). A **sequence** is a list — each item on its own line under a `-`. A **mapping** is `key: value` pairs. Maps and lists nest inside each other to any depth."
          },
          {
            "type": "code",
            "lang": "yaml",
            "text": "name: web-app          # scalar — a plain string value\nreplicas: 3            # scalar — inferred as an integer\nenabled: true         # scalar — inferred as a boolean\n\nports:                # value is a list (sequence)\n  - 8080              # list item — the dash means \"element of\"\n  - 8443              # second element\n\ndatabase:             # value is a nested map\n  host: db.internal   # nested key — indented under `database:`\n  port: 5432          # sibling of `host`, same indent = same level\n  ssl: true           # all three keys belong to `database`"
          },
          {
            "type": "p",
            "text": "Read top to bottom: `database` isn't a value, it's a **container** — the three indented lines below it are *its* contents. The dash (`-`) is the only thing that marks a list element; without it, you have a map."
          }
        ]
      },
      {
        "heading": "Indentation IS the syntax",
        "body": [
          {
            "type": "p",
            "text": "In most languages indentation is style. In YAML it's **structure** — the only thing that says what's nested inside what. Two rules, no exceptions: **spaces only (never tabs)**, and **be consistent** (2 spaces per level is the universal convention)."
          },
          {
            "type": "code",
            "lang": "yaml",
            "text": "service:              # top level — column 0\n  image: nginx        # 2 spaces in → a child of `service`\n  env:                # 2 spaces in → sibling of `image`\n    LOG_LEVEL: info   # 4 spaces in → a child of `env`, not `service`\n    DEBUG: false      # same 4 spaces = same level as LOG_LEVEL"
          },
          {
            "type": "pros-cons",
            "goodLabel": "DO",
            "watchLabel": "THE #1 YAML BUG",
            "good": [
              "Use **2 spaces** per nesting level, everywhere",
              "Let your editor show whitespace so you can SEE the structure",
              "Set your editor to insert spaces when you press Tab"
            ],
            "watch": [
              "**A literal Tab character** for indentation — YAML rejects it with a hard parse error, no fallback",
              "**Mixed indent widths** (2 here, 4 there) — silently re-parents a key under the wrong block",
              "**A stray trailing/leading space** that shifts a line half a level — the file 'looks' fine but parses wrong"
            ]
          }
        ]
      },
      {
        "heading": "Types and the traps",
        "body": [
          {
            "type": "p",
            "text": "YAML **guesses the type** of every unquoted scalar — string, int, float, bool, or null. That convenience is also where most real bugs live, because some words you meant as text get read as something else."
          },
          {
            "type": "predict",
            "prompt": "A config file contains `enabled: no`. The author meant the *string* \"no\". What does a standard YAML parser actually produce for the value of `enabled`?",
            "options": [
              "The string \"no\"",
              "The boolean false",
              "A parse error — `no` is a reserved word",
              "null, because `no` isn't a recognized type"
            ],
            "answer": 1,
            "explain": "**It becomes the boolean `false`.** This is the infamous \"Norway problem\": YAML 1.1 treats `no`, `No`, `NO`, `off`, `yes`, `on` (plus `true`/`false` themselves) as booleans. So `country: NO` (Norway's ISO code) silently becomes `country: false`, and `enabled: no` becomes `enabled: false`. The fix is always the same — **quote it**: `country: \"NO\"` or `enabled: \"no\"` forces a string. When a value *must* be text, quote it and the guessing stops."
          },
          {
            "type": "code",
            "lang": "yaml",
            "text": "country:  NO          # ⚠ boolean false — the \"Norway problem\"\nfeature:  off         # ⚠ boolean false — off/on/yes/no are all bools\nversion:  1.10        # ⚠ float 1.1 — 1.10 == 1.1, so the text \"0\" is gone\nid:       010         # ⚠ leading zero is risky (octal in YAML 1.1), not \"010\"\nempty:                # ⚠ null, not an empty string"
          },
          {
            "type": "p",
            "text": "Same keys, **quoted** — the guessing stops and every value stays the exact text you typed:"
          },
          {
            "type": "code",
            "lang": "yaml",
            "text": "country:  \"NO\"        # ✓ a real string, not Norway-the-boolean\nversion:  \"1.10\"      # ✓ stays the text \"1.10\" — image tags, semver\nid:       \"010\"       # ✓ keeps the leading zero\nempty:    \"\"          # ✓ an explicit empty string, not null"
          },
          {
            "type": "p",
            "text": "Take `version: 1.10` — YAML reads it as the number 1.10, which *equals* 1.1, so the trailing zero vanishes the instant it parses. An image tag or semver that has to stay `\"1.10\"` must be quoted. **The rule that saves you:** when a scalar must stay text — version strings, country codes, IDs with leading zeros, anything yes/no-ish — **wrap it in quotes.** Quoting turns the type-guessing off, and that one habit kills the whole category of bugs."
          }
        ]
      },
      {
        "heading": "Multiline strings",
        "body": [
          {
            "type": "p",
            "text": "Scripts, certificates, and long messages need to span lines. YAML gives you two block styles: `|` keeps your newlines exactly (**literal**), and `>` folds newlines into spaces to make one flowing paragraph (**folded**). One catch: **inside** a `|` or `>` block, a `#` is literal text — not a comment. Only the indicator line (the one carrying the `|` or `>`) can hold a comment."
          },
          {
            "type": "code",
            "lang": "yaml",
            "text": "startup: |              # literal — newlines are PRESERVED as written\n  echo \"booting\"\n  npm install\n  npm start\n\nsummary: >              # folded — newlines become SPACES\n  this long sentence is\n  wrapped for readability\n  but reads as one line"
          },
          {
            "type": "p",
            "text": "Both `|` and `>` keep one trailing newline by default. Add a `-` (**chomping indicator**) — `|-` or `>-` — to strip that final newline, which matters when a tool compares the value byte-for-byte (tokens, hashes)."
          },
          {
            "type": "table",
            "headers": ["Indicator", "Newlines inside", "Trailing newline"],
            "rows": [
              ["`|`", "kept as-is", "one kept"],
              ["`>`", "folded to spaces", "one kept"],
              ["`|-`", "kept as-is", "stripped"],
              ["`>-`", "folded to spaces", "stripped"]
            ]
          }
        ]
      },
      {
        "heading": "Anchors & aliases (don't repeat yourself)",
        "body": [
          {
            "type": "p",
            "text": "When the same block appears in three places, copy-paste rots — you fix one and forget the others. YAML's answer: **`&name` defines** a reusable value, **`*name` reuses** it, and **`<<: *name` merges** a map's keys into the current map (so you can override a few)."
          },
          {
            "type": "code",
            "lang": "yaml",
            "text": "defaults: &svc_defaults   # &svc_defaults = name (anchor) this block\n  restart: unless-stopped # shared setting #1\n  logging:                # shared setting #2 (a nested map)\n    driver: json-file\n\nservices:\n  web:\n    <<: *svc_defaults     # merge in every key from the anchor\n    image: nginx          # then add/override just this service's bits\n  worker:\n    <<: *svc_defaults     # same defaults reused — one source of truth\n    image: worker:latest  # override only what differs"
          },
          {
            "type": "p",
            "text": "Where you'll actually use it: **Compose service defaults** (restart policy, logging) shared across services, and **CI job templates** where five jobs share the same `runs-on` and setup steps. Change the anchor once, every alias updates."
          }
        ]
      },
      {
        "heading": "Build it: a real Compose file",
        "body": [
          {
            "type": "p",
            "text": "Time to assemble a valid `docker-compose.yml` from scratch — one piece per step. Watch how the three shapes (maps, lists, scalars) and indentation come together into a file a real tool will accept."
          },
          {
            "type": "build-along",
            "title": "Assemble a valid docker-compose.yml",
            "goal": "A two-service stack — a web app and its database. Click through, then build it for real in VS Code.",
            "lang": "yaml",
            "file": "docker-compose.yml",
            "steps": [
              {
                "title": "Top-level: the services map",
                "say": "A Compose file is one big map. The services key holds every container, each as its own nested map. Everything we add lives under here.",
                "add": "services:"
              },
              {
                "title": "Add the web service",
                "say": "web is a key under services, indented two spaces. Its value is another map describing that one container. The image key picks what to run.",
                "add": "  web:\n    image: nginx:1.27       # pin the version, never use latest in prod"
              },
              {
                "title": "Map ports with a list",
                "say": "ports is a sequence — each dash is one entry. Quote port mappings as a habit: it keeps the value an exact string and dodges type surprises like 08:00.",
                "add": "    ports:\n      - \"8080:80\"           # quote it as a habit — keeps the mapping an exact string"
              },
              {
                "title": "Make web wait for the database",
                "say": "depends_on is a list of other service names. It controls start order so web does not boot before db exists.",
                "add": "    depends_on:\n      - db                  # must match a service key — db is added next"
              },
              {
                "title": "Add the db service",
                "say": "db is a sibling of web, so it sits at the same two-space indent. Same shape: a key whose value is a map.",
                "add": "  db:\n    image: postgres:16      # sibling of web — same indent level"
              },
              {
                "title": "Inject config with environment",
                "say": "environment is a nested map of variables. Quote the password so YAML keeps it as an exact string instead of guessing a type.",
                "add": "    environment:\n      POSTGRES_PASSWORD: \"changeme\"   # quote secrets — keep them strings"
              }
            ]
          }
        ]
      },
      {
        "heading": "Tie it together",
        "body": [
          {
            "type": "explain-back",
            "prompt": "A teammate's Kubernetes Deployment won't apply — `kubectl` returns a vague \"error converting YAML\" message with no useful line. From *this* lesson, name the **three most likely YAML-level causes** and, for each, how you'd catch it **before** pushing.",
            "modelAnswer": "First, **a tab character in the indentation.** YAML forbids tabs and rejects the whole file, but the error rarely points at the tab. Catch it before pushing by configuring the editor to insert spaces for Tab and to render whitespace, plus running a linter (`yamllint`) which flags tabs explicitly. Second, **inconsistent indentation** — a key indented 2 spaces in one block and 4 in another, which silently re-parents a field under the wrong block or breaks the structure entirely. Catch it by sticking to a strict 2-space convention and running `yamllint`, whose indentation rule fails on the mismatch. Third, **a type-coercion surprise from an unquoted scalar** — a value like `version: 1.10` collapsing to the float `1.1`, or a name like `no`/`NO`/`off` flipping to a boolean (the Norway problem), so the manifest is valid YAML but the wrong shape for Kubernetes. Catch it by quoting any value that must stay text (versions, codes, yes/no-ish words) and by validating against the schema with `kubectl apply --dry-run=client` (or `kubeval`), which surfaces a field that came out the wrong type. The through-line: indentation is structure, and unquoted scalars are guesses — lint locally and dry-run before every push.",
            "hint": "Three buckets from this lesson: how YAML reads whitespace, how consistent that whitespace must be, and what happens to a value you didn't quote. For each, name a local check (editor setting, `yamllint`, or a `--dry-run`) that catches it before the push.",
            "commit": {
              "q": "One of these mistakes produces a file that is *valid YAML* but the wrong shape for Kubernetes — the sneakiest failure. Which?",
              "opts": [
                "An unquoted value like `version: 1.10` that the parser coerces to a float",
                "A tab character hiding in the indentation of one line",
                "A key indented 2 spaces in one block and 3 in another"
              ],
              "answer": 0,
              "why": "Tabs and broken indentation make YAML reject the file loudly. An unquoted scalar parses fine — the file loads, but the value silently comes out as the wrong type."
            }
          }
        ]
      }
    ]
  },
  "health-watchdog": {
    "sections": [
      {
        "heading": "Summary",
        "body": [
          {
            "type": "p",
            "text": "You're building a **watchdog** — a small service that pokes other services on a schedule, measures how long they take to respond, and yells in Slack the moment one of them starts misbehaving. This is the **bones of every real observability stack**: Datadog synthetics, Pingdom, Cloudflare Healthchecks — they all do exactly this, just with more bells."
          },
          {
            "type": "p",
            "text": "The interesting part isn't the HTTP polling. It's the **state machine** (healthy → degraded → down → healthy) and the **percentiles** (p50/p99) computed over a rolling window so you don't page on a single slow request. Get those right and you've internalized why production alerts are noisy or quiet."
          },
          {
            "type": "diagram",
            "title": "Watchdog architecture",
            "nodes": [
              {
                "id": "wd",
                "label": "watchdog",
                "subtitle": "polls + computes p50/p99",
                "x": 0.5,
                "y": 0.2,
                "accent": "sky"
              },
              {
                "id": "u1",
                "label": "upstream A",
                "subtitle": "/healthz",
                "x": 0.15,
                "y": 0.7,
                "accent": "water"
              },
              {
                "id": "u2",
                "label": "upstream B",
                "subtitle": "/healthz",
                "x": 0.45,
                "y": 0.75,
                "accent": "water"
              },
              {
                "id": "u3",
                "label": "upstream C",
                "subtitle": "/healthz",
                "x": 0.75,
                "y": 0.7,
                "accent": "water"
              },
              {
                "id": "slack",
                "label": "Slack webhook",
                "subtitle": "alerts on flip",
                "x": 0.9,
                "y": 0.2,
                "accent": "fire"
              }
            ],
            "edges": [
              {
                "from": "wd",
                "to": "u1",
                "label": "poll 5s",
                "kind": "dashed",
                "accent": "sky"
              },
              {
                "from": "wd",
                "to": "u2",
                "label": "poll 5s",
                "kind": "dashed",
                "accent": "sky"
              },
              {
                "from": "wd",
                "to": "u3",
                "label": "poll 5s",
                "kind": "dashed",
                "accent": "sky"
              },
              {
                "from": "wd",
                "to": "slack",
                "label": "flip → post",
                "kind": "dashed",
                "accent": "fire"
              }
            ]
          }
        ]
      },
      {
        "heading": "What you build",
        "body": [
          {
            "type": "ul",
            "items": [
              "**Polling loop** — every N seconds, fire a `GET /healthz` at each upstream with a hard timeout (2s). Concurrent, not sequential.",
              "**Rolling latency window** — keep the last 200 samples per upstream in a ring buffer; compute p50 and p99 on every tick.",
              "**State machine** — `healthy / degraded / down` per upstream, with hysteresis so you don't flap on a single blip.",
              "**Slack notifier** — post to an Incoming Webhook URL only on **state transitions**, never on steady-state.",
              "**Metrics endpoint** — expose `/metrics` in Prometheus format so you can scrape your own watchdog.",
              "**Config file** — `config.yaml` listing upstreams, thresholds, and the webhook URL (env-var substituted)."
            ]
          }
        ]
      },
      {
        "heading": "Requirements",
        "body": [
          {
            "type": "ul",
            "items": [
              "**Go 1.22+** or **Python 3.11+** — pick one. Go gives you goroutines for free; Python needs `asyncio` + `httpx`.",
              "**Docker + docker compose** — you'll run 2-3 fake upstreams as containers (nginx with `/healthz`) plus the watchdog.",
              "**A Slack workspace** with permission to create an Incoming Webhook (or use a test channel + `webhook.site` mock).",
              "**`curl` and `jq`** for poking the metrics endpoint and inspecting JSON payloads.",
              "**Basic familiarity** with goroutines/`asyncio`, ring buffers, and HTTP status codes."
            ]
          }
        ]
      },
      {
        "heading": "Steps",
        "body": [
          {
            "type": "ol",
            "items": [
              "**Sketch the data model.** One `Upstream` struct: `name`, `url`, `state`, `samples []time.Duration`, `consecutiveFails int`. Everything else hangs off this.",
              "**Build the poller.** Spawn one goroutine (or asyncio task) per upstream. Use `context.WithTimeout(2s)` so a hung upstream can't stall the loop.",
              "**Implement the ring buffer.** Fixed-size slice + `head` index. On overflow, overwrite the oldest. O(1) insert, O(n log n) percentile.",
              "**Compute p50/p99.** Copy the buffer, sort it, index at `len*0.5` and `len*0.99`. Don't sort the live buffer — race conditions.",
              "**Wire the state machine.** `degraded` after 2 consecutive p99 > threshold ticks; `down` after 3 consecutive failed polls; back to `healthy` after 3 consecutive good ticks.",
              "**Add the Slack notifier.** Only post on transitions (`old != new`). Include upstream name, old → new, current p99, and a timestamp.",
              "**Expose `/metrics`.** One gauge per upstream per metric: `watchdog_p50_ms`, `watchdog_p99_ms`, `watchdog_state` (0/1/2).",
              "**Dockerize and chaos-test.** `docker compose up`, then `docker compose pause upstream-b` and watch Slack light up within ~15s."
            ]
          }
        ]
      },
      {
        "heading": "The heart of it: poll + percentile + flip",
        "body": [
          {
            "type": "p",
            "text": "**State per upstream** — a fixed-size ring buffer of samples, a streak counter, and a current state. The `percentile` method copies-then-sorts so the buffer is never mutated mid-read."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "import asyncio, httpx, time, bisect\nfrom collections import deque\n\nWINDOW = 200  # samples kept per upstream\nP99_THRESHOLD_MS = 500  # degraded above this p99\nFAIL_LIMIT = 3  # consecutive fails → down\n\nclass Upstream:\n    def __init__(self, name, url):\n        self.name, self.url = name, url\n        self.samples = deque(maxlen=WINDOW)   # ring buffer, auto-evicts\n        self.fails = 0  # consecutive failure counter\n        self.state = \"healthy\"  # state machine cursor\n\n    def percentile(self, p):\n        if not self.samples: return 0.0  # avoid empty-window divide\n        s = sorted(self.samples)  # copy-then-sort, never in-place\n        return s[min(len(s)-1, int(len(s)*p))] # clamp index for tiny windows"
          },
          {
            "type": "p",
            "text": "**Poll and decide** — every tick measures latency, records it even on failure, then picks a new state. Hard failures beat slowness."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "async def poll(up, client):\n    t0 = time.perf_counter()  # monotonic, not wall clock\n    try:\n        r = await client.get(up.url, timeout=2.0)  # hard cap, hung peer survives\n        ok = r.status_code < 500  # 4xx is still 'reachable'\n    except Exception:\n        ok = False  # DNS/conn/timeout all → fail\n    dt_ms = (time.perf_counter() - t0) * 1000 # ms is the human unit\n    up.samples.append(dt_ms)  # record even failures (timeout=2000)\n    up.fails = 0 if ok else up.fails + 1  # reset or increment streak\n    return decide(up)  # returns new state\n\ndef decide(up):\n    p99 = up.percentile(0.99)\n    if up.fails >= FAIL_LIMIT:   return \"down\"  # hard fail wins\n    if p99 > P99_THRESHOLD_MS:   return \"degraded\"  # slow but alive\n    return \"healthy\"\n\nasync def tick(up, client, notify):\n    new = await poll(up, client)\n    if new != up.state:  # ONLY notify on transitions\n        await notify(up.name, up.state, new, up.percentile(0.99))\n        up.state = new  # commit AFTER notify succeeds"
          }
        ]
      },
      {
        "heading": "Success criteria",
        "body": [
          {
            "type": "ul",
            "items": [
              "`docker compose pause upstream-b` triggers a **single** `healthy → down` Slack message within 15 seconds — not three.",
              "`docker compose unpause upstream-b` triggers exactly one `down → healthy` message after the 3-tick recovery window.",
              "`curl localhost:9090/metrics | grep watchdog_p99_ms` shows live, changing numbers per upstream.",
              "Killing the watchdog and restarting it does **not** re-fire alerts for upstreams that are still in the same state (in-memory is fine for v1, but the lack of alert-flood matters).",
              "Under `hey -z 30s -c 50` load against a fake slow upstream, p99 rises above p50 and the state flips to `degraded` — not `down`.",
              "Slack messages include upstream name, old → new state, current p99 in ms, and a timestamp. Nothing else."
            ]
          }
        ]
      },
      {
        "heading": "Watch out for",
        "body": [
          {
            "type": "pros-cons",
            "goodLabel": "WHAT'S NICE",
            "watchLabel": "GOTCHAS",
            "good": [
              "Goroutines / `asyncio.gather` make N concurrent pollers trivial — no thread pool tuning.",
              "Ring buffers give you O(1) inserts and bounded memory regardless of how long the service runs.",
              "Posting only on **state transitions** means a dead upstream sends 1 alert, not 10,000."
            ],
            "watch": [
              "**Sorting the live deque** is a classic race — always copy first. The bug only shows up under load.",
              "**No hysteresis = flap city.** A single slow request crossing the p99 line will toggle the state every tick. Require 2-3 consecutive bad ticks.",
              "**Slack webhooks rate-limit at 1/sec per channel.** If you skip the transition-only rule, you'll get 429s and miss the real alert."
            ]
          }
        ]
      }
    ]
  },
  "hardened-container": {
    "sections": [
      {
        "heading": "Summary",
        "body": [
          {
            "type": "p",
            "text": "You'll build a **distroless container** for a small Python service, then prove it's hardened: **non-root**, **no shell**, **read-only filesystem**, and a **signed image** with an **SBOM attached**. The result is something an SRE would actually deploy — minimal attack surface, reproducible, and auditable."
          },
          {
            "type": "p",
            "text": "Why it matters: most CVEs you'll hit in production are not in *your* code — they're in the **base image** (curl, bash, openssl, apt). Strip those out and you delete entire CVE classes before they exist. Sign the image so the cluster can refuse anything you didn't push; attach an **SBOM** so when the next Log4j drops, you can answer *'are we affected?'* in seconds, not days."
          },
          {
            "type": "diagram",
            "title": "Hardened build pipeline",
            "nodes": [
              {
                "id": "src",
                "label": "Source",
                "subtitle": "app + Dockerfile",
                "x": 0.08,
                "y": 0.5,
                "accent": "water"
              },
              {
                "id": "build",
                "label": "Buildx",
                "subtitle": "multi-stage",
                "x": 0.32,
                "y": 0.5,
                "accent": "sky"
              },
              {
                "id": "scan",
                "label": "Trivy",
                "subtitle": "CVE + SBOM",
                "x": 0.55,
                "y": 0.25,
                "accent": "amber"
              },
              {
                "id": "sign",
                "label": "Cosign",
                "subtitle": "keyless sign",
                "x": 0.55,
                "y": 0.75,
                "accent": "earth"
              },
              {
                "id": "reg",
                "label": "Registry",
                "subtitle": "image + attest.",
                "x": 0.85,
                "y": 0.5,
                "accent": "fire"
              }
            ],
            "edges": [
              {
                "from": "src",
                "to": "build",
                "kind": "dashed",
                "label": "context"
              },
              {
                "from": "build",
                "to": "scan",
                "kind": "dashed",
                "label": "image"
              },
              {
                "from": "build",
                "to": "sign",
                "kind": "dashed",
                "label": "digest"
              },
              {
                "from": "scan",
                "to": "reg",
                "kind": "dashed",
                "label": "sbom attest"
              },
              {
                "from": "sign",
                "to": "reg",
                "kind": "dashed",
                "label": "signature"
              }
            ]
          }
        ]
      },
      {
        "heading": "What you build",
        "body": [
          {
            "type": "ul",
            "items": [
              "**Multi-stage Dockerfile** — a fat `builder` stage compiles wheels, a tiny `gcr.io/distroless/python3-debian12:nonroot` final stage runs them.",
              "**Non-root runtime** — UID 65532, read-only rootfs, no `/bin/sh`, no package manager, `tmpfs` for anything that needs to write.",
              "**SBOM** in SPDX or CycloneDX format, generated by `syft` and attached to the image as an OCI artifact.",
              "**Cosign signature** using **keyless OIDC** (GitHub Actions identity) — no private key to leak or rotate.",
              "**Trivy CVE scan** wired into the build, failing on HIGH/CRITICAL with a documented allowlist.",
              "**Verification script** that pulls the image, checks the signature, validates the SBOM, and refuses to run if anything is missing."
            ]
          }
        ]
      },
      {
        "heading": "Requirements",
        "body": [
          {
            "type": "ul",
            "items": [
              "**Docker 24+** with `buildx` enabled — you need multi-platform and BuildKit cache mounts.",
              "**A toy Python app** — a Flask `/health` endpoint is enough; the lab is about the wrapper, not the code.",
              "**syft + grype** (or **trivy**) installed locally for SBOM generation and CVE scanning.",
              "**cosign v2+** — supports keyless signing via Sigstore's Fulcio/Rekor.",
              "**A registry you can push to** — GHCR, Docker Hub, or a local `registry:2` on port 5000 all work.",
              "**Basic understanding of `USER`, `COPY --chown`, and OCI image layers** from the prior compose lab."
            ]
          }
        ]
      },
      {
        "heading": "Steps",
        "body": [
          {
            "type": "ol",
            "items": [
              "**Write the multi-stage Dockerfile.** Stage 1 (`python:3.12-slim`) installs build deps and `pip install --target=/app/deps`. Stage 2 (`distroless/python3-debian12:nonroot`) copies *only* `/app/deps` and your source — nothing else.",
              "**Pin everything by digest.** Replace `:3.12-slim` with `@sha256:...`. A floating tag is a supply-chain hole; pinning makes builds reproducible.",
              "**Build with BuildKit and scan.** `docker buildx build --sbom=true --provenance=true -t app:dev .` then `trivy image --severity HIGH,CRITICAL --exit-code 1 app:dev`.",
              "**Harden the runtime.** Add `USER 65532`, `WORKDIR /app`, and document the `docker run` flags: `--read-only --cap-drop=ALL --security-opt=no-new-privileges --tmpfs /tmp`.",
              "**Generate and attach the SBOM.** `syft app:dev -o spdx-json > sbom.spdx.json`, then `cosign attach sbom --sbom sbom.spdx.json app:dev`.",
              "**Sign keyless with cosign.** `COSIGN_EXPERIMENTAL=1 cosign sign <registry>/app@sha256:<digest>` — your OIDC identity ends up in the transparency log.",
              "**Verify the chain.** `cosign verify --certificate-identity=... --certificate-oidc-issuer=https://token.actions.githubusercontent.com <image>` must succeed before deploy.",
              "**Try to break in.** `docker exec -it app sh` should fail (no shell). `docker exec -it app id` should print `uid=65532`. Write to `/etc/passwd` should error with read-only fs."
            ]
          }
        ]
      },
      {
        "heading": "The Dockerfile that earns the badge",
        "body": [
          {
            "type": "code",
            "lang": "dockerfile",
            "text": "# syntax=docker/dockerfile:1.7\nFROM python:3.12-slim@sha256:abc123... AS builder   # pin by digest, not tag\nWORKDIR /build\nCOPY requirements.txt .\nRUN --mount=type=cache,target=/root/.cache/pip \\   # reuse pip cache across builds\n    pip install --target=/install -r requirements.txt   # isolate deps in /install\n\nFROM gcr.io/distroless/python3-debian12:nonroot@sha256:def456...   # no shell, no apt, no curl\nWORKDIR /app\nCOPY --from=builder --chown=nonroot:nonroot /install /app/deps   # owned by uid 65532\nCOPY --chown=nonroot:nonroot app.py .  # only ship what runs\nENV PYTHONPATH=/app/deps PYTHONDONTWRITEBYTECODE=1   # no .pyc on read-only fs\nUSER 65532  # numeric UID, not name\nEXPOSE 8080\nENTRYPOINT [\"python\", \"app.py\"]  # exec form, no shell wrapper"
          },
          {
            "type": "code",
            "lang": "bash",
            "text": "# Build, scan, sign, verify — the whole chain in five commands\ndocker buildx build --sbom=true -t ghcr.io/you/app:dev --push .   # SBOM baked into attestation\nDIGEST=$(docker buildx imagetools inspect ghcr.io/you/app:dev --format '{{.Manifest.Digest}}')\ntrivy image --severity HIGH,CRITICAL --exit-code 1 ghcr.io/you/app@$DIGEST   # fail build on real CVEs\nCOSIGN_EXPERIMENTAL=1 cosign sign ghcr.io/you/app@$DIGEST   # keyless OIDC signature\ncosign verify --certificate-oidc-issuer=https://token.actions.githubusercontent.com \\\n    --certificate-identity-regexp='.*' ghcr.io/you/app@$DIGEST   # prove provenance before deploy"
          }
        ]
      },
      {
        "heading": "Success criteria",
        "body": [
          {
            "type": "ul",
            "items": [
              "Final image is **under 80 MB** and `docker history` shows no `apt`, `curl`, or shell binaries.",
              "`docker run --rm app:dev id` prints `uid=65532` — the process is **not root**, even briefly.",
              "`docker run --rm -it app:dev sh` **fails** with `exec: \"sh\": executable file not found`.",
              "`trivy image app:dev` reports **zero HIGH or CRITICAL** CVEs, or every exception is in a documented allowlist with an expiry date.",
              "`cosign verify` succeeds and the transparency log entry resolves on **rekor.sigstore.dev**.",
              "`cosign download sbom app:dev | jq '.packages | length'` returns a non-zero count — the SBOM is real and queryable."
            ]
          }
        ]
      },
      {
        "heading": "Watch out for",
        "body": [
          {
            "type": "pros-cons",
            "goodLabel": "WHAT'S NICE",
            "watchLabel": "GOTCHAS",
            "good": [
              "**Distroless deletes entire CVE classes** — no bash means no shellshock, no curl means no SSRF-via-`curl-bash` install scripts.",
              "**Keyless signing** removes the private-key rotation nightmare. Identity comes from the CI provider's OIDC token, logged in Rekor forever.",
              "**SBOMs make incident response cheap** — `grep log4j-core sbom.json` across every image is a one-liner instead of a week of forensics."
            ],
            "watch": [
              "**Debugging is harder** — no shell means `docker exec` is useless. Lean on structured logs, `kubectl debug --image=busybox`, or a separate `:debug` variant for staging only.",
              "**`:nonroot` tag UID is 65532**, but if a volume is mounted with files owned by root, your process can't read them. Fix with `chown` at build time, not runtime.",
              "**Pinning by digest breaks `docker pull base:latest`** — you'll need a renovate/dependabot bot to bump digests, or your image rots while you sleep."
            ]
          }
        ]
      }
    ]
  },
  "cicd-rollback": {
    "sections": [
      {
        "heading": "Summary",
        "body": [
          {
            "type": "p",
            "text": "You'll build a **CI/CD pipeline** that tags every deploy with an immutable image version, runs a **smoke-test gate** before promoting traffic, and lets you **roll back to the previous image with a single command**. The pipeline keeps a small history of known-good tags on disk so rollback is a metadata flip — no rebuild, no registry round-trip, no panic."
          },
          {
            "type": "p",
            "text": "This is how real teams ship safely: every artifact is **addressable by SHA**, every deploy is **reversible in seconds**, and the gate between *built* and *live* is automated. When prod breaks at 3am, you don't read logs — you run `./rollback.sh` and investigate from a healthy state."
          },
          {
            "type": "walkthrough",
            "title": "Deploy and rollback flow",
            "why": "Every artifact is addressable by SHA and every deploy is reversible in seconds — so a 3am break means `./rollback.sh`, not reading logs.",
            "nodes": [
              {
                "id": "git",
                "label": "git push",
                "subtitle": "commit SHA",
                "x": 0.06,
                "y": 0.3,
                "accent": "water"
              },
              {
                "id": "ci",
                "label": "CI build",
                "subtitle": "tag = SHA",
                "x": 0.29,
                "y": 0.3,
                "accent": "sky"
              },
              {
                "id": "reg",
                "label": "registry",
                "subtitle": "image:SHA",
                "x": 0.52,
                "y": 0.3,
                "accent": "earth"
              },
              {
                "id": "deploy",
                "label": "deploy + smoke",
                "subtitle": "gate",
                "x": 0.5,
                "y": 0.56,
                "accent": "amber"
              },
              {
                "id": "prod",
                "label": "prod",
                "subtitle": "current + previous",
                "x": 0.78,
                "y": 0.82,
                "accent": "fire"
              }
            ],
            "steps": [
              {
                "title": "Push a commit",
                "description": "A `git push` lands a new **commit SHA**. That SHA becomes the immutable name for everything downstream — never `latest`.",
                "activeNodes": ["git"],
                "activeEdges": []
              },
              {
                "title": "CI builds, tags by SHA",
                "description": "The push triggers **CI**, which builds the image and tags it with the exact commit SHA. The tag *is* the version — addressable forever.",
                "activeNodes": ["git", "ci"],
                "activeEdges": [{ "from": "git", "to": "ci", "label": "trigger" }]
              },
              {
                "title": "Push to the registry",
                "description": "CI pushes `image:SHA` to the **registry**. Keeping the last two tags here is what gives rollback a target to pull.",
                "activeNodes": ["ci", "reg"],
                "activeEdges": [{ "from": "ci", "to": "reg", "label": "push" }]
              },
              {
                "title": "Deploy behind a smoke gate",
                "description": "The deploy script **pulls** the tag and starts it alongside the old one, then runs a smoke test. A broken commit is rejected here — prod stays untouched.",
                "activeNodes": ["reg", "deploy"],
                "activeEdges": [{ "from": "reg", "to": "deploy", "label": "pull" }]
              },
              {
                "title": "Promote to prod",
                "description": "Only a passing gate **promotes** traffic. Prod keeps a record of *current + previous* SHAs, so `./rollback.sh` is a metadata flip — no rebuild.",
                "activeNodes": ["deploy", "prod"],
                "activeEdges": [{ "from": "deploy", "to": "prod", "label": "promote" }]
              }
            ]
          }
        ]
      },
      {
        "heading": "What you build",
        "body": [
          {
            "type": "ul",
            "items": [
              "**Versioned build step** — CI tags every image with the short commit SHA, never `latest`.",
              "**Deploy script** — pulls the new tag, starts it alongside old, runs smoke tests against the new container.",
              "**Smoke-test gate** — a small HTTP probe + one real request that must pass before traffic flips.",
              "**Rollback command** — `./rollback.sh` reads the previous tag from a state file and re-deploys it.",
              "**Version history file** — `deploys.log` records `timestamp sha status` so you can audit what shipped when.",
              "**Health endpoint** — `/healthz` on the app that returns 200 only when dependencies are reachable."
            ]
          }
        ]
      },
      {
        "heading": "Requirements",
        "body": [
          {
            "type": "ul",
            "items": [
              "**Docker + Docker Compose** installed locally (any recent version).",
              "**GitHub Actions** (or any CI runner that can build + push images) and a registry — GHCR or Docker Hub.",
              "**A small web app** — Python/Flask or Node/Express is fine; must expose `/healthz`.",
              "**bash + jq** for the deploy and rollback scripts.",
              "**A target host** to deploy onto — your laptop counts; SSH to a VPS is more realistic.",
              "Familiarity with `docker compose up -d`, git tags, and environment files."
            ]
          }
        ]
      },
      {
        "heading": "Steps",
        "body": [
          {
            "type": "ol",
            "items": [
              "**Wire the build** — in CI, build the image and tag it `ghcr.io/you/app:${{ github.sha }}`. Push on every commit to `main`.",
              "**Add `/healthz`** — return 200 only when DB ping + cache ping succeed; return 503 otherwise. This is your smoke gate's truth source.",
              "**Write `deploy.sh`** — takes a SHA arg, pulls the image, starts it as `app-new` on a side port, polls `/healthz` for 30s.",
              "**Add the smoke gate** — after health passes, hit one real endpoint (`POST /echo` or similar) and assert the response shape. Fail loud.",
              "**Promote** — on success, `docker compose up -d app` with the new tag, stop `app-new`, append `SHA OK` to `deploys.log`.",
              "**Write `rollback.sh`** — read the second-to-last `OK` line from `deploys.log`, re-run `deploy.sh` with that SHA. No rebuild.",
              "**Test the rollback path** — deploy a deliberately broken commit, watch the gate reject it, then run `rollback.sh` and confirm prod is healthy.",
              "**Document the runbook** — a 5-line README: how to deploy, how to roll back, where the log lives."
            ]
          }
        ]
      },
      {
        "heading": "Deploy script — the heart of it",
        "body": [
          {
            "type": "code",
            "lang": "bash",
            "text": "#!/usr/bin/env bash\nset -euo pipefail  # fail fast on any error\n\nSHA=\"${1:?usage: deploy.sh <sha>}\"  # require a tag argument\nIMAGE=\"ghcr.io/you/app:${SHA}\"  # immutable, never :latest\nLOG=\"./deploys.log\"  # audit trail for rollback\n\ndocker pull \"$IMAGE\"  # fail here = bad tag, abort early\n\nIMAGE=\"$IMAGE\" docker compose -f compose.new.yml up -d  # start side-by-side on :8081\n\nfor i in {1..30}; do  # 30s health budget, no more\n  curl -fsS http://localhost:8081/healthz && break # -f makes non-2xx exit nonzero\n  sleep 1\n  [[ $i == 30 ]] && { echo \"health timeout\"; exit 1; }\ndone\n\ncurl -fsS -X POST http://localhost:8081/echo \\  # real request, not just health\n  -H 'content-type: application/json' \\\n  -d '{\"ping\":\"smoke\"}' | jq -e '.pong == \"smoke\"' # -e exits 1 if assertion false\n\nIMAGE=\"$IMAGE\" docker compose up -d app  # promote: swap prod tag atomically\ndocker compose -f compose.new.yml down  # tear down the staging copy\n\necho \"$(date -Iseconds) ${SHA} OK\" >> \"$LOG\"  # only log AFTER promotion succeeds\n"
          }
        ]
      },
      {
        "heading": "Success criteria",
        "body": [
          {
            "type": "ul",
            "items": [
              "`./deploy.sh <sha>` completes in under 60s on a green commit and leaves one healthy container running prod.",
              "A deliberately broken commit (e.g. `/healthz` returns 503) is **rejected by the gate** — prod is untouched.",
              "`./rollback.sh` with no arguments restores the previous SHA in under 15 seconds, no image rebuild.",
              "`deploys.log` shows every promoted SHA with timestamp; failed deploys do **not** appear.",
              "The registry contains at least the last 2 image tags so rollback always has a target to pull.",
              "After rollback, `curl /healthz` returns 200 and `docker ps` shows exactly one app container."
            ]
          }
        ]
      },
      {
        "heading": "Watch out for",
        "body": [
          {
            "type": "pros-cons",
            "goodLabel": "WHAT'S NICE",
            "watchLabel": "GOTCHAS",
            "good": [
              "Rollback is a `docker pull` of an existing tag — seconds, not minutes.",
              "Every deploy is auditable: `deploys.log` is the single source of truth.",
              "Smoke gate catches the dumb stuff (bad config, missing env var) before users see it."
            ],
            "watch": [
              "**Never tag `:latest`** — if rollback resolves to a mutable tag, you can't actually go back.",
              "**Migrations break rollback** — if commit N runs a forward-only schema change, rolling to N-1 will crash on startup. Gate schema changes separately.",
              "**Registry retention** — if your registry GCs old tags after 7 days, your rollback target can disappear. Pin the last 2 tags explicitly."
            ]
          }
        ]
      }
    ]
  },
  "k8s-lab": {
    "sections": [
      {
        "heading": "Summary",
        "body": [
          {
            "type": "reveal",
            "question": "What does Kubernetes do when a pod can't schedule?",
            "answer": "It **stays Pending** — the scheduler keeps trying. The pod is created in the API, but no node accepts it because constraints (CPU/memory requests, node selectors, taints, affinity, PV zones) can't be satisfied. `kubectl describe pod` shows a `FailedScheduling` event with the reason. **No retry timeout, no failure** — it sits Pending forever until either a node frees up, a new node is added, or you delete it."
          },
          {
            "type": "p",
            "text": "You'll deploy a small HTTP service to a local Kubernetes cluster (kind or minikube) with a **Deployment**, expose it via a **Service** and **Ingress**, and prove the cluster can do a **rolling update with zero downtime**. The trick is **readiness probes**: Kubernetes routes traffic only to pods that pass them, and a rolling update brings new pods up *before* tearing old pods down. Get the probes wrong and every deploy drops requests."
          },
          {
            "type": "p",
            "text": "This is the production deploy story for almost every web service running in a real company. **Deployments** declare desired state; **Services** give a stable virtual IP; **Ingress** maps a hostname to that Service; **probes** tell the control plane when a pod is alive versus ready to serve. Once you wire all four, you can roll new image versions live while a load generator hammers the URL — and the error count stays at zero."
          },
          {
            "type": "walkthrough",
            "title": "Request path through the cluster",
            "height": 240,
            "why": "Readiness probes are the whole trick — the Service routes only to pods that pass them, so a rolling update never drops a request.",
            "nodes": [
              {
                "id": "client",
                "label": "curl / hey",
                "subtitle": "load generator",
                "x": 0.05,
                "y": 0.5,
                "accent": "water"
              },
              {
                "id": "ingress",
                "label": "Ingress",
                "subtitle": "host → svc",
                "x": 0.3,
                "y": 0.5,
                "accent": "amber"
              },
              {
                "id": "svc",
                "label": "Service",
                "subtitle": "ClusterIP",
                "x": 0.55,
                "y": 0.5,
                "accent": "sky"
              },
              {
                "id": "pod1",
                "label": "Pod v1",
                "subtitle": "ready ✓",
                "x": 0.85,
                "y": 0.25,
                "accent": "earth"
              },
              {
                "id": "pod2",
                "label": "Pod v2",
                "subtitle": "starting…",
                "x": 0.85,
                "y": 0.75,
                "accent": "fire"
              }
            ],
            "steps": [
              {
                "title": "A request arrives",
                "description": "A load generator (`curl` or `hey`) sends **HTTP** at your app's hostname. This is every real request your service will ever see.",
                "activeNodes": ["client"],
                "activeEdges": [{ "from": "client", "to": "ingress", "label": "http" }]
              },
              {
                "title": "Ingress maps host to Service",
                "description": "The **Ingress** matches the hostname and **routes** the request inward. Without an ingress controller running, this object silently does nothing.",
                "activeNodes": ["ingress", "svc"],
                "activeEdges": [{ "from": "ingress", "to": "svc", "label": "routes" }]
              },
              {
                "title": "Service picks a ready pod",
                "description": "The **Service** (a stable ClusterIP) load-balances across pods that match its label selector — but only ones that pass their readiness probe.",
                "activeNodes": ["svc", "pod1"],
                "activeEdges": [{ "from": "svc", "to": "pod1", "label": "ready only" }]
              },
              {
                "title": "The new pod is skipped",
                "description": "Pod v2 is still **starting** — its `/ready` returns 503. The Service leaves it out of rotation, so traffic never hits a cold pod mid-rollout.",
                "activeNodes": ["svc", "pod1", "pod2"],
                "activeEdges": [{ "from": "svc", "to": "pod2", "label": "not ready" }]
              }
            ]
          }
        ]
      },
      {
        "heading": "What you build",
        "body": [
          {
            "type": "ul",
            "items": [
              "**Containerized app** — a tiny Python or Go HTTP server with `/healthz` (liveness) and `/ready` (readiness) endpoints, built as a versioned image.",
              "**Deployment manifest** — 3 replicas, a `RollingUpdate` strategy with `maxSurge: 1` and `maxUnavailable: 0`, plus both probes wired to the right ports.",
              "**Service + Ingress** — a `ClusterIP` Service fronting the pods and an Ingress that routes `app.localtest.me` to it via the cluster's ingress controller.",
              "**Slow-start behavior** — the app deliberately takes 5–10 s before `/ready` returns 200, so you can *see* readiness gating work.",
              "**Zero-downtime rollout proof** — a load generator (`hey` or a `while curl`) running during `kubectl set image`, showing **0 failed requests** across the version flip."
            ]
          }
        ]
      },
      {
        "heading": "Requirements",
        "body": [
          {
            "type": "ul",
            "items": [
              "**Docker Desktop or Podman** — to build images locally and back the kind/minikube node.",
              "**kind ≥ 0.23 or minikube ≥ 1.33** — a local Kubernetes cluster; kind is faster to recycle.",
              "**kubectl ≥ 1.30** — and a shell with bash-style heredocs (PowerShell works, but YAML pasting is easier in WSL/git-bash).",
              "**An ingress controller** — `ingress-nginx` is the default; install via the kind/minikube addon, not from scratch.",
              "**`hey` or `wrk`** — a load generator that prints non-2xx counts. `curl` in a loop also works for the milestone check.",
              "**~2 GB free RAM** — kind nodes are light but ingress-nginx + 3 replicas + a load gen adds up."
            ]
          }
        ]
      },
      {
        "heading": "Steps",
        "body": [
          {
            "type": "ol",
            "items": [
              "**Build** a minimal HTTP server with `/healthz` always returning 200, `/ready` returning 503 for the first 8 seconds after boot then 200, and `/` returning the image version from an env var. Tag it `myapp:v1`.",
              "**Boot** a kind cluster (`kind create cluster --config kind.yaml` with port 80 mapped) and load the image with `kind load docker-image myapp:v1` so nodes don't try to pull from a registry.",
              "**Install** ingress-nginx using the official kind manifest, then wait for the controller pod to become Ready before continuing — Ingress objects without a controller silently do nothing.",
              "**Apply** the Deployment with 3 replicas, both probes, `strategy.rollingUpdate.maxUnavailable: 0`, plus the Service and Ingress. Confirm `kubectl get pods` shows 3/3 Ready and `curl app.localtest.me` returns `v1`.",
              "**Start** a load generator in another terminal: `hey -z 60s -c 10 http://app.localtest.me/` (or `while true; do curl -sf … || echo FAIL; done`). Keep it running across the next step.",
              "**Roll** to v2: rebuild the image with a different version string, `kind load docker-image myapp:v2`, then `kubectl set image deploy/myapp app=myapp:v2`. Watch pods cycle with `kubectl get pods -w`.",
              "**Verify** the load generator reported zero non-2xx responses and that `curl` now returns `v2`. Then break it on purpose — set `maxUnavailable: 1` and `readinessProbe.initialDelaySeconds: 0` — re-roll and watch the failures appear."
            ]
          }
        ]
      },
      {
        "heading": "Deployment + Service + Ingress",
        "body": [
          {
            "type": "p",
            "text": "One manifest, three objects. The probe ports, the `RollingUpdate` budget, and the Ingress class are the lines that actually matter — everything else is boilerplate."
          },
          {
            "type": "p",
            "text": "**Deployment** — 3 replicas, zero-downtime rolling update, and two probes so traffic only flows to ready pods."
          },
          {
            "type": "code",
            "lang": "yaml",
            "text": "apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: myapp\nspec:\n  replicas: 3  # enough to survive 1 going down\n  selector:\n    matchLabels: { app: myapp }  # must match pod template labels\n  strategy:\n    type: RollingUpdate\n    rollingUpdate:\n      maxSurge: 1  # one extra pod during rollout\n      maxUnavailable: 0  # never drop below 3 ready\n  template:\n    metadata:\n      labels: { app: myapp }  # service selector targets this\n    spec:\n      containers:\n      - name: app\n        image: myapp:v1  # kubectl set image flips this\n        ports: [{ containerPort: 8080 }]\n        readinessProbe:\n          httpGet: { path: /ready, port: 8080 }\n          periodSeconds: 2  # poll fast so rollouts are quick\n          failureThreshold: 3  # ~6s of bad before pulled from svc\n        livenessProbe:\n          httpGet: { path: /healthz, port: 8080 }\n          initialDelaySeconds: 15  # don't kill slow-starting pods\n          periodSeconds: 10"
          },
          {
            "type": "p",
            "text": "**Service** — a stable in-cluster name and port that load-balances across whichever pods currently match the label selector."
          },
          {
            "type": "code",
            "lang": "yaml",
            "text": "---\napiVersion: v1\nkind: Service\nmetadata: { name: myapp }\nspec:\n  selector: { app: myapp }  # picks pods by label, not name\n  ports: [{ port: 80, targetPort: 8080 }]  # 80 in cluster → 8080 in pod"
          },
          {
            "type": "p",
            "text": "**Ingress** — the external door, routed by hostname through the nginx controller."
          },
          {
            "type": "code",
            "lang": "yaml",
            "text": "---\napiVersion: networking.k8s.io/v1\nkind: Ingress\nmetadata:\n  name: myapp\n  annotations:\n    nginx.ingress.kubernetes.io/rewrite-target: /  # strip path prefix\nspec:\n  ingressClassName: nginx  # must match installed controller\n  rules:\n  - host: app.localtest.me  # resolves to 127.0.0.1 free\n    http:\n      paths:\n      - path: /\n        pathType: Prefix\n        backend:\n          service: { name: myapp, port: { number: 80 } }"
          }
        ]
      },
      {
        "heading": "Success criteria",
        "body": [
          {
            "type": "ul",
            "items": [
              "`kubectl get pods -l app=myapp` shows **3/3 Ready** and stays that way through a rollout.",
              "`hey -z 60s -c 10 http://app.localtest.me/` during `kubectl set image` reports **0 non-2xx responses** in its summary.",
              "`kubectl rollout status deploy/myapp` returns successfully within ~30 s, not minutes.",
              "Hitting `/` shows the new version string within 60 s of the rollout completing, and **old version strings stop appearing**.",
              "`kubectl describe pod` on a new pod shows `Readiness probe failed` events for the first ~8 s, then the pod is added to `kubectl get endpoints myapp`.",
              "Setting `maxUnavailable: 1` and re-rolling under load produces visible failed requests — proving your zero-downtime config is what saved you."
            ]
          }
        ]
      },
      {
        "heading": "Watch out for",
        "body": [
          {
            "type": "pros-cons",
            "goodLabel": "WHAT'S NICE",
            "watchLabel": "GOTCHAS",
            "good": [
              "**Declarative rollouts** — `kubectl set image` is one command; the control plane handles surge, drain, and rollback for you.",
              "**Readiness is automatic load-balancing** — pods auto-leave and rejoin the Service's endpoints without you touching the LB.",
              "**`kubectl rollout undo`** — one command reverts to the prior ReplicaSet if v2 turns out to be broken in prod."
            ],
            "watch": [
              "**`maxUnavailable: 1` (the default) drops traffic** during rollouts of small Deployments. Set it to `0` and use `maxSurge` instead.",
              "**Liveness probe with a low `initialDelaySeconds`** will kill slow-starting pods in a loop. Liveness is for *hung*, not *booting* — that's readiness's job.",
              "**Ingress without a controller installed** silently 404s. The Ingress object exists; nothing routes it. Always check `kubectl get pods -n ingress-nginx` first."
            ]
          }
        ]
      }
    ]
  },
  "compose-stack": {
    "sections": [
      {
        "heading": "Summary",
        "body": [
          { "type": "p", "text": "Build a small web app that depends on Postgres (data) and Redis (cache), all running together via Docker Compose. **One command brings the whole stack up.** This is what every backend developer touches in their first week at a job — wiring services together, getting them to find each other, and tearing them down cleanly when you're done." },
          {
            "type": "diagram",
            "title": "What you'll build",
            "height": 200,
            "nodes": [
              { "id": "client", "label": "Client",   "subtitle": "browser",          "accent": "water", "x": 0.10, "y": 0.5 },
              { "id": "api",    "label": "API",      "subtitle": "fastapi · :8000",  "accent": "sky",   "x": 0.42, "y": 0.5 },
              { "id": "cache",  "label": "Cache",    "subtitle": "redis · :6379",    "accent": "earth", "x": 0.78, "y": 0.22 },
              { "id": "db",     "label": "Database", "subtitle": "postgres · :5432", "accent": "fire",  "x": 0.78, "y": 0.78 }
            ],
            "edges": [
              { "from": "client", "to": "api", "kind": "dashed", "label": "HTTP" },
              { "from": "api", "to": "cache", "kind": "dashed", "accent": "earth", "label": "hot reads", "curve": 0.35 },
              { "from": "api", "to": "db",    "kind": "dashed", "accent": "fire",  "label": "writes",    "curve": 0.35 }
            ]
          }
        ]
      },
      {
        "heading": "What you build",
        "body": [
          { "type": "p", "text": "A reproducible multi-service stack. Anyone clones the repo, runs `docker compose up`, and the whole app is running 30 seconds later with seeded data. No \"works on my machine\" — the YAML is the contract." },
          { "type": "ul", "items": [
            "**One FastAPI service** that reads from Postgres and caches in Redis.",
            "**Postgres** with a named volume so data survives `down`.",
            "**Redis** as a side-cache (no persistence — it's a cache, not a DB).",
            "**Health checks + `depends_on`** so the API doesn't start before Postgres is ready.",
            "**`.env` + secrets file** so passwords aren't baked into the YAML."
          ]}
        ]
      },
      {
        "heading": "The compose file",
        "body": [
          { "type": "p", "text": "The single source of truth for the whole stack. Read it top to bottom — every block is one service:" },
          { "type": "p", "text": "**The `api` service** — built from a local Dockerfile, waits on the data services until their healthchecks pass." },
          { "type": "code", "lang": "yaml", "text": "services:\n  api:  # our FastAPI app\n    build: ./api  # build from local Dockerfile\n    ports: [\"8000:8000\"]  # host:container — expose 8000 to laptop\n    environment:  # injected at process startup\n      DATABASE_URL: postgres://app:${DB_PASS}@db:5432/app\n      REDIS_URL: redis://cache:6379\n    depends_on:  # do not start api until both are HEALTHY\n      db:    { condition: service_healthy }\n      cache: { condition: service_healthy }\n" },
          { "type": "p", "text": "**Postgres + Redis** — both define healthchecks so `depends_on` actually works; only Postgres gets a named volume so data survives `docker compose down`." },
          { "type": "code", "lang": "yaml", "text": "  db:  # postgres data layer\n    image: postgres:16-alpine   # alpine = smaller image, same postgres\n    environment:\n      POSTGRES_USER: app\n      POSTGRES_PASSWORD: ${DB_PASS}\n      POSTGRES_DB: app\n    volumes:\n      - pgdata:/var/lib/postgresql/data   # named volume = survives `down`\n    healthcheck:  # compose waits for this to pass\n      test: [\"CMD-SHELL\", \"pg_isready -U app\"]\n      interval: 3s\n      retries: 10\n\n  cache:  # redis cache (no volume — ephemeral)\n    image: redis:7-alpine\n    healthcheck:\n      test: [\"CMD\", \"redis-cli\", \"ping\"]\n      interval: 3s\n      retries: 10\n\nvolumes:\n  pgdata: {}  # declare the named volume up here\n" },
          {
            "type": "practice",
            "lang": "yaml",
            "prompt": "Change the image tag and see the lint feedback.",
            "starter": "services:\n  api:\n    image: python:3.12-slim\n    ports:\n      - \"8000:8000\"\n  db:\n    image: postgres:16-alpine\n",
            "hint": "Try removing the space after a `:` (e.g. `image:python:3.12-slim`) or replacing the leading spaces with a tab — both will surface as lint errors."
          }
        ]
      },
      {
        "heading": "Requirements",
        "body": [
          { "type": "ul", "items": [
            "Docker Engine 24+ (Docker Desktop on macOS/Windows, or Docker CE on Linux).",
            "`docker compose` v2 plugin (bundled with Docker Desktop; `docker compose version` should print `v2.x`).",
            "Free ports `8000`, `5432`, `6379` on the host.",
            "Roughly 1 GB of free disk for the Postgres + Redis + your-app images."
          ]}
        ]
      },
      {
        "heading": "Steps",
        "body": [
          { "type": "ol", "items": [
            "**Write the `docker-compose.yml`** with three services (api, db, cache) and the named `pgdata` volume.",
            "**Add a `Dockerfile` for the API** in `./api/Dockerfile` — single-stage Python 3.12-slim is fine.",
            "**Add `healthcheck:` to db and cache** + `depends_on: { condition: service_healthy }` on the API.",
            "**Move secrets to `.env`** in the project root; reference with `${DB_PASS}` in the YAML.",
            "**Run `docker compose up --build`**, watch logs, hit `curl localhost:8000/health` from another terminal.",
            "**Tear it down cleanly** with `docker compose down`; data persists via the volume. `docker compose down -v` to nuke data too."
          ]}
        ]
      },
      {
        "heading": "Success criteria",
        "body": [
          { "type": "ul", "items": [
            "**One command up:** `docker compose up` is the only command a new dev runs to get the whole stack.",
            "**Health-gated boot:** API logs show \"connected to db\" only AFTER Postgres reports ready — no retry loops in app code.",
            "**Data survives:** `docker compose down && docker compose up` keeps your Postgres rows.",
            "**No secrets in the YAML:** grep the file for the DB password and find nothing.",
            "**Reachable services use service names, not localhost** — the API connects to `db:5432`, not `127.0.0.1:5432`. (That's the compose network at work.)"
          ]}
        ]
      },
      {
        "heading": "Watch out for",
        "body": [
          {
            "type": "pros-cons",
            "goodLabel": "WHAT'S NICE",
            "watchLabel": "GOTCHAS",
            "good": [
              "Same YAML works on every dev machine",
              "Real Postgres, not a mock — your queries actually run",
              "`docker compose logs -f` is your live dashboard"
            ],
            "watch": [
              "`depends_on` without `service_healthy` only waits for *start*, not *ready*",
              "Forgetting the named volume = you lose data every restart",
              "Exposed DB port (`5432`) leaks Postgres to your LAN — drop it once the API is wired"
            ]
          }
        ]
      }
    ]
  },
  "gh-actions-ci": {
    "sections": [
      {
        "heading": "Summary",
        "body": [
          {
            "type": "p",
            "text": "Wire a real **multi-stage CI/CD pipeline** on a Python or Node service using GitHub Actions. Every pull request runs lint and tests in parallel; every push to `main` builds a Docker image and pushes it to **GHCR** (GitHub Container Registry); every `v*` tag promotes that image to a deploy job. This is the day-to-day backbone of every modern team — once you've built it once, you understand every other CI system."
          },
          {
            "type": "p",
            "text": "The goal isn't a green checkmark. It's a pipeline that **fails loudly when it should**, **caches aggressively when it can**, and **never lets a broken commit reach production**. You'll learn how jobs share artifacts, how `GITHUB_TOKEN` authenticates to GHCR without a PAT, and why tag-based deploys beat branch-based ones."
          },
          {
            "type": "diagram",
            "title": "Pipeline flow",
            "height": 220,
            "nodes": [
              {
                "id": "dev",
                "label": "Developer",
                "subtitle": "git push / tag",
                "accent": "water",
                "x": 0.08,
                "y": 0.5
              },
              {
                "id": "ci",
                "label": "CI",
                "subtitle": "lint · test",
                "accent": "sky",
                "x": 0.34,
                "y": 0.5
              },
              {
                "id": "build",
                "label": "Build",
                "subtitle": "docker · buildx",
                "accent": "amber",
                "x": 0.6,
                "y": 0.25
              },
              {
                "id": "ghcr",
                "label": "GHCR",
                "subtitle": "image registry",
                "accent": "earth",
                "x": 0.86,
                "y": 0.5
              },
              {
                "id": "deploy",
                "label": "Deploy",
                "subtitle": "on tag v*",
                "accent": "fire",
                "x": 0.6,
                "y": 0.78
              }
            ],
            "edges": [
              {
                "from": "dev",
                "to": "ci",
                "kind": "dashed",
                "label": "push / PR"
              },
              {
                "from": "ci",
                "to": "build",
                "kind": "dashed",
                "accent": "amber",
                "label": "if green",
                "curve": 0.35
              },
              {
                "from": "build",
                "to": "ghcr",
                "kind": "dashed",
                "accent": "earth",
                "label": "push :sha"
              },
              {
                "from": "ghcr",
                "to": "deploy",
                "kind": "dashed",
                "accent": "fire",
                "label": "pull on tag",
                "curve": -0.35
              }
            ]
          }
        ]
      },
      {
        "heading": "What you build",
        "body": [
          {
            "type": "ul",
            "items": [
              "**One workflow file** at `.github/workflows/ci.yml` covering PR, push-to-main, and tag events — no separate workflows to drift apart.",
              "**Parallel lint + test jobs** that fan out on push, so a slow test suite doesn't block lint feedback.",
              "**Buildx + layer cache** that pushes a multi-arch image to `ghcr.io/<you>/<repo>:<sha>` and `:latest`.",
              "**Tag-triggered deploy job** that only runs when you push `v1.2.3` — it pulls the already-built image, never rebuilds.",
              "**Required status checks** wired in branch protection so PRs literally cannot merge red.",
              "**`concurrency:` group** that cancels superseded runs on the same branch so you don't burn minutes on stale commits."
            ]
          }
        ]
      },
      {
        "heading": "Requirements",
        "body": [
          {
            "type": "ul",
            "items": [
              "A GitHub repo you can push to (public or private — GHCR works on both).",
              "A working **Dockerfile** at the repo root that builds a small image (`<300 MB` ideal).",
              "Local **Docker 24+** and **`gh` CLI** for iterating — `act` is optional but speeds up the loop.",
              "A linter (`ruff` for Python, `eslint` for Node) and a test runner (`pytest` / `vitest`) already wired locally.",
              "**Settings → Actions → General → Workflow permissions** set to *Read and write* so the workflow can push to GHCR.",
              "A free **Fly.io** or **Render** account if you want a real deploy target (or skip the deploy job and stop at GHCR)."
            ]
          }
        ]
      },
      {
        "heading": "Steps",
        "body": [
          {
            "type": "ol",
            "items": [
              "**Sketch the trigger matrix.** Decide which events run which jobs: PR → lint + test only; push to main → + build + push; tag `v*` → + deploy. Write this on paper before the YAML.",
              "**Create `.github/workflows/ci.yml`** with `on: { pull_request, push: { branches: [main], tags: ['v*'] } }` and a top-level `concurrency` group keyed on `${{ github.ref }}`.",
              "**Write the lint job** using `actions/setup-python@v5` (or `setup-node`) with `cache: 'pip'`. First run takes 90 s; second takes 10 s. That's the cache earning its keep.",
              "**Write the test job** as a sibling (not a dependent) so they run in parallel. Upload `coverage.xml` as an artifact so PR reviewers can download it.",
              "**Write the build job** with `needs: [lint, test]`, `if: github.event_name == 'push'`, using `docker/build-push-action@v6` with `cache-from: type=gha` and `cache-to: type=gha,mode=max`.",
              "**Tag the image** with both `${{ github.sha }}` (immutable) and `latest` (mutable) — never deploy from `:latest` in production, but it's nice for `docker run` demos.",
              "**Write the deploy job** with `if: startsWith(github.ref, 'refs/tags/v')` that calls `flyctl deploy --image ghcr.io/...:${{ github.sha }}`. The image is already built — deploy is just a pull-and-restart.",
              "**Lock it down.** Go to *Settings → Branches → main* and require the `lint` and `test` checks before merge. Now the pipeline isn't advisory; it's the gate."
            ]
          }
        ]
      },
      {
        "heading": "The workflow file",
        "body": [
          {
            "type": "p",
            "text": "One file. Three triggers. Four jobs. Read it top to bottom — the `needs:` chain tells you the order. Start with the **triggers + concurrency + permissions** at the top:"
          },
          {
            "type": "code",
            "lang": "yaml",
            "text": "name: ci\non:\n  pull_request:  # PRs run lint + test only\n  push:\n    branches: [main]  # main runs full pipeline\n    tags: ['v*']  # v1.2.3 triggers deploy\n\nconcurrency:  # one run per ref at a time\n  group: ci-${{ github.ref }}  # cancel superseded commits\n  cancel-in-progress: true\n\npermissions:\n  contents: read  # least-privilege default\n  packages: write  # needed to push to GHCR"
          },
          {
            "type": "p",
            "text": "**Lint and test** are siblings — no `needs:` between them, so they run in parallel."
          },
          {
            "type": "code",
            "lang": "yaml",
            "text": "jobs:\n  lint:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: actions/setup-python@v5\n        with:\n          python-version: '3.12'\n          cache: 'pip'  # caches ~/.cache/pip by hash\n      - run: pip install -r requirements-dev.txt\n      - run: ruff check .  # fail fast on style errors\n\n  test:\n    runs-on: ubuntu-latest  # sibling of lint = parallel\n    steps:\n      - uses: actions/checkout@v4\n      - uses: actions/setup-python@v5\n        with: { python-version: '3.12', cache: 'pip' }\n      - run: pip install -r requirements-dev.txt\n      - run: pytest --cov --cov-report=xml  # writes coverage.xml\n      - uses: actions/upload-artifact@v4  # reviewers can download it\n        with: { name: coverage, path: coverage.xml }"
          },
          {
            "type": "p",
            "text": "**Build** waits on both, skips on PRs (no push permission to GHCR), and uses the GitHub-Actions cache backend for layer reuse."
          },
          {
            "type": "code",
            "lang": "yaml",
            "text": "  build:\n    needs: [lint, test]  # only build if both green\n    if: github.event_name == 'push'  # skip on PRs (no push perms)\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: docker/setup-buildx-action@v3    # enables layer cache + multi-arch\n      - uses: docker/login-action@v3\n        with:\n          registry: ghcr.io\n          username: ${{ github.actor }}\n          password: ${{ secrets.GITHUB_TOKEN }}  # auto-issued, no PAT needed\n      - uses: docker/build-push-action@v6\n        with:\n          push: true\n          tags: |\n            ghcr.io/${{ github.repository }}:${{ github.sha }}\n            ghcr.io/${{ github.repository }}:latest\n          cache-from: type=gha  # pull layers from prev runs\n          cache-to: type=gha,mode=max  # save ALL layers, not just final"
          },
          {
            "type": "p",
            "text": "**Deploy** is tag-gated — only fires when you push a `v*` tag — and runs in a named `production` environment so secrets are scoped and approvals can gate it."
          },
          {
            "type": "code",
            "lang": "yaml",
            "text": "  deploy:\n    needs: build\n    if: startsWith(github.ref, 'refs/tags/v')  # tag-gated, not branch-gated\n    runs-on: ubuntu-latest\n    environment: production  # enables approval + secrets scoping\n    steps:\n      - uses: superfly/flyctl-actions/setup-flyctl@master\n      - run: flyctl deploy --image ghcr.io/${{ github.repository }}:${{ github.sha }}\n        env:\n          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}  # scoped to prod env"
          }
        ]
      },
      {
        "heading": "Success criteria",
        "body": [
          {
            "type": "ul",
            "items": [
              "**PR feedback under 3 min** on a warm cache — lint and test run in parallel, not in series.",
              "**A red test blocks merge.** Try it: open a PR with a failing assertion and confirm the merge button is disabled.",
              "**Force-pushing a branch cancels the in-flight run** instead of queueing a stale one (the `concurrency` group at work).",
              "**Pushing `v0.1.0` deploys exactly the image** that was built on the underlying commit — no rebuild, no drift between `:sha` and what's running.",
              "**A second push to main reuses Docker layers** — `build-push-action` logs show `CACHED` on most steps, total build time drops from minutes to seconds.",
              "**No PAT in the repo.** `git grep ghp_` returns nothing; auth to GHCR is the auto-minted `GITHUB_TOKEN`."
            ]
          }
        ]
      },
      {
        "heading": "Watch out for",
        "body": [
          {
            "type": "pros-cons",
            "goodLabel": "WHAT'S NICE",
            "watchLabel": "GOTCHAS",
            "good": [
              "`GITHUB_TOKEN` auto-scopes — no secret to rotate",
              "GHCR is free for public repos, generous for private",
              "Same YAML works for fork PRs and your own pushes"
            ],
            "watch": [
              "Fork PRs get a read-only `GITHUB_TOKEN` — your build job will silently skip, not error",
              "`cache-to: mode=min` (the default) only caches the final stage — use `mode=max` for multi-stage Dockerfiles",
              "Deploying from `:latest` means a re-run with the same tag deploys a different image — always pin to `:${{ github.sha }}`"
            ]
          }
        ]
      }
    ]
  },
  "terraform-vpc": {
    "sections": [
      {
        "heading": "Why a module, not a tangle",
        "body": [
          {
            "type": "p",
            "text": "A **VPC** is the network boundary every AWS resource sits inside. You'll build the same shape — public subnets for load balancers, private subnets for app servers, a NAT for egress — on every project, which is exactly why it belongs in a **module**."
          },
          {
            "type": "p",
            "text": "Terraform's job here is to make that shape **declarative** and **idempotent**. You describe the desired topology once; `terraform apply` either makes reality match or tells you why it can't."
          }
        ]
      },
      {
        "heading": "The topology you're declaring",
        "body": [
          {
            "type": "p",
            "text": "Two subnets per AZ: one **public** (route to the IGW), one **private** (route to a NAT). The IGW is the only door to the internet; the NAT lets private workloads call out without being reachable."
          },
          {
            "type": "diagram",
            "title": "VPC with public/private subnets",
            "nodes": [
              {
                "id": "user",
                "label": "Internet",
                "subtitle": "0.0.0.0/0",
                "x": 0.08,
                "y": 0.5,
                "accent": "water"
              },
              {
                "id": "igw",
                "label": "IGW",
                "subtitle": "ingress + egress",
                "x": 0.3,
                "y": 0.5,
                "accent": "amber"
              },
              {
                "id": "pub",
                "label": "Public subnet",
                "subtitle": "ALB, NAT GW",
                "x": 0.55,
                "y": 0.25,
                "accent": "sky"
              },
              {
                "id": "priv",
                "label": "Private subnet",
                "subtitle": "app, db",
                "x": 0.55,
                "y": 0.75,
                "accent": "earth"
              },
              {
                "id": "nat",
                "label": "NAT GW",
                "subtitle": "egress only",
                "x": 0.82,
                "y": 0.5,
                "accent": "fire"
              }
            ],
            "edges": [
              {
                "from": "user",
                "to": "igw",
                "kind": "dashed",
                "accent": "water",
                "label": "https"
              },
              {
                "from": "igw",
                "to": "pub",
                "kind": "solid",
                "accent": "sky"
              },
              {
                "from": "pub",
                "to": "priv",
                "kind": "solid",
                "accent": "earth",
                "label": "internal"
              },
              {
                "from": "priv",
                "to": "nat",
                "kind": "dashed",
                "accent": "fire",
                "label": "egress"
              },
              {
                "from": "nat",
                "to": "igw",
                "kind": "dashed",
                "accent": "fire"
              }
            ]
          }
        ]
      },
      {
        "heading": "Minimal HCL",
        "body": [
          {
            "type": "p",
            "text": "Strip it to the bones: a VPC, one public subnet, an IGW, and a route. You can add AZs and NAT once this applies cleanly."
          },
          {
            "type": "p",
            "text": "**The VPC + subnet + IGW** — three resources, implicit dependencies via reference."
          },
          {
            "type": "code",
            "lang": "hcl",
            "text": "resource \"aws_vpc\" \"main\" {\n  cidr_block           = \"10.0.0.0/16\"  # /16 = 65k IPs, plenty of headroom\n  enable_dns_hostnames = true  # required for private DNS names\n  tags = { Name = \"infralearn\" }  # tags are how you'll find it in the console\n}\n\nresource \"aws_subnet\" \"public\" {\n  vpc_id                  = aws_vpc.main.id    # implicit dependency — TF orders this after the VPC\n  cidr_block              = \"10.0.1.0/24\"  # carve a /24 (256 IPs) out of the /16\n  availability_zone       = \"us-east-1a\"  # pin to one AZ; real prod spans 2+\n  map_public_ip_on_launch = true  # auto-assign public IPs — the bit that makes it \"public\"\n}\n\nresource \"aws_internet_gateway\" \"igw\" {\n  vpc_id = aws_vpc.main.id  # one IGW per VPC, that's the limit\n}"
          },
          {
            "type": "p",
            "text": "**Routing** — a table with a default route to the IGW, and an association that actually attaches it to the subnet (without this, the subnet silently uses the default table)."
          },
          {
            "type": "code",
            "lang": "hcl",
            "text": "resource \"aws_route_table\" \"public\" {\n  vpc_id = aws_vpc.main.id\n  route {\n    cidr_block = \"0.0.0.0/0\"  # default route — anything not local\n    gateway_id = aws_internet_gateway.igw.id   # ...goes out the IGW\n  }\n}\n\nresource \"aws_route_table_association\" \"public\" {\n  subnet_id      = aws_subnet.public.id  # without this, the subnet uses the default RT (no internet)\n  route_table_id = aws_route_table.public.id\n}"
          }
        ]
      },
      {
        "heading": "State: local vs remote",
        "body": [
          {
            "type": "p",
            "text": "Terraform tracks reality in a **state file**. Where it lives is the single biggest operational decision you'll make."
          },
          {
            "type": "pros-cons",
            "goodLabel": "Local state (terraform.tfstate)",
            "watchLabel": "Remote state (S3 + DynamoDB lock)",
            "good": [
              "Zero setup — works the second you `terraform init`",
              "Fine for a solo learning project or throwaway sandbox",
              "Fast: no network round-trip per plan"
            ],
            "watch": [
              "Required the moment a second human touches the repo",
              "S3 versioning gives you a free undo button when state goes sideways",
              "DynamoDB lock prevents two `apply`s racing and corrupting state",
              "Never commit `.tfstate` to git — it contains secrets in plaintext"
            ]
          }
        ]
      },
      {
        "heading": "Terms you'll keep tripping over",
        "body": [
          {
            "type": "terms",
            "items": [
              {
                "term": "CIDR block",
                "def": "The IP range a VPC or subnet owns, written as `10.0.0.0/16`; the number after the slash is how many bits are fixed."
              },
              {
                "term": "Route table",
                "def": "A list of `destination → target` rules that decides where a packet goes when it leaves a subnet."
              },
              {
                "term": "IGW",
                "def": "Internet Gateway — the one piece that lets a VPC talk to the public internet, both directions."
              },
              {
                "term": "NAT Gateway",
                "def": "A managed box that lets private subnets initiate outbound traffic without being reachable from outside."
              },
              {
                "term": "Module",
                "def": "A reusable folder of `.tf` files you call with `module \"x\" { source = \"...\" }`; the way you stop copy-pasting VPCs."
              }
            ]
          }
        ]
      },
      {
        "heading": "Watch out for",
        "body": [
          {
            "type": "ul",
            "items": [
              "**Pick your CIDR like you mean it.** `10.0.0.0/16` is fine in isolation, but if you ever peer two VPCs that both used it, you're rebuilding one. Plan the address space across accounts *before* the first apply.",
              "**NAT Gateways cost real money** (~$32/mo each, plus data). For a learning lab, skip the private subnet or use a single NAT for all AZs.",
              "**`terraform destroy` is honest but unforgiving** — it will happily delete a production VPC. Use workspaces or separate state files per environment.",
              "**Drift happens.** Someone clicks in the console, state and reality diverge. `terraform plan` is your daily check; treat unexpected changes as an incident, not a nuisance."
            ]
          },
          {
            "type": "p",
            "text": "**Stretch:** turn this file into a module (`./modules/vpc`) with `var.cidr` and `var.azs`, then call it twice — once for staging, once for prod. The moment you do, you understand why Terraform exists."
          }
        ]
      }
    ]
  },
  "prometheus-stack": {
    "sections": [
      {
        "heading": "Summary",
        "body": [
          {
            "type": "p",
            "text": "Stand up Prometheus + Grafana + an instrumented service via Docker Compose. Scrape metrics. Build dashboards. Configure an alert that fires when error rate spikes. Wire it to send to a Slack webhook."
          }
        ]
      }
    ]
  },
  "feature-flag-service": {
    "sections": [
      {
        "heading": "Summary",
        "body": [
          {
            "type": "p",
            "text": "Build a tiny **feature-flag evaluation service**: `GET /flags/:key?user_id=...` returns `{ enabled: true|false, variant: \"A\"|\"B\" }` based on rules you stored in a JSON file. Flags load into a process-local map at boot, evaluation is pure O(1) hash math, and a 30-line SDK shim wraps the HTTP call with a local fallback so a flag-server outage never takes down the app."
          },
          {
            "type": "p",
            "text": "Real flag platforms (LaunchDarkly, Unleash, Statsig) are this same shape under the marketing. Once you've built one, you stop being mystified by why **flag eval has to be local-fast**, why **rollout percentages must be sticky**, and why **the SDK's job is to never throw**."
          },
          {
            "type": "diagram",
            "title": "Request path",
            "height": 220,
            "nodes": [
              {
                "id": "app",
                "label": "App server",
                "subtitle": "calls SDK",
                "accent": "water",
                "x": 0.08,
                "y": 0.5
              },
              {
                "id": "sdk",
                "label": "SDK shim",
                "subtitle": "in-process",
                "accent": "amber",
                "x": 0.34,
                "y": 0.5
              },
              {
                "id": "flagd",
                "label": "Flag service",
                "subtitle": "fastapi · :8080",
                "accent": "sky",
                "x": 0.62,
                "y": 0.5
              },
              {
                "id": "mem",
                "label": "Flag map",
                "subtitle": "in-memory dict",
                "accent": "earth",
                "x": 0.88,
                "y": 0.22
              },
              {
                "id": "json",
                "label": "flags.json",
                "subtitle": "cold-start file",
                "accent": "fire",
                "x": 0.88,
                "y": 0.78
              }
            ],
            "edges": [
              {
                "from": "app",
                "to": "sdk",
                "kind": "dashed",
                "label": "isOn(key)"
              },
              {
                "from": "sdk",
                "to": "flagd",
                "kind": "dashed",
                "label": "GET /flags"
              },
              {
                "from": "flagd",
                "to": "mem",
                "kind": "dashed",
                "accent": "earth",
                "label": "lookup",
                "curve": 0.3
              },
              {
                "from": "json",
                "to": "mem",
                "kind": "solid",
                "accent": "fire",
                "label": "on boot",
                "curve": 0.3
              }
            ]
          }
        ]
      },
      {
        "heading": "What you build",
        "body": [
          {
            "type": "ul",
            "items": [
              "**One FastAPI service** exposing `GET /flags/:key?user_id=...` and `GET /healthz`, nothing else.",
              "**A `flags.json` cold-start file** holding flag definitions: default value, rollout %, and targeting rules.",
              "**An evaluator** that returns the same answer for the same `(flag, user_id)` pair — bucket via `hash(key + user_id) % 100`.",
              "**A 30-line Python SDK shim** with timeout + local fallback, so a 500 from the service never raises in app code.",
              "**A `POST /reload` admin endpoint** (or SIGHUP handler) that re-reads `flags.json` without restarting the process."
            ]
          }
        ]
      },
      {
        "heading": "Requirements",
        "body": [
          {
            "type": "ul",
            "items": [
              "Python 3.11+ with `fastapi` and `uvicorn` installed (`pip install fastapi uvicorn[standard]`).",
              "`curl` or `httpie` for hitting endpoints by hand — no Postman needed.",
              "Basic familiarity with hash-based bucketing (the SD lesson on consistent hashing is enough).",
              "A free port `8080` on your host, and `pytest` if you want to lock the eval logic with tests."
            ]
          }
        ]
      },
      {
        "heading": "Steps",
        "body": [
          {
            "type": "ol",
            "items": [
              "**Define the flag schema** in `flags.json`: `key`, `default`, `rollout_pct`, optional `targeting` list of `{attribute, op, values}`.",
              "**Load on boot** into a module-level `FLAGS: dict[str, Flag]`. Crash loud if the JSON is malformed — fail fast beats fail weird.",
              "**Write the evaluator** as a pure function `evaluate(flag, user_id) -> bool` so it's trivially unit-testable without HTTP.",
              "**Wrap it in FastAPI**: one route, return `{enabled, variant, reason}`. `reason` is gold for debugging in production.",
              "**Add `/reload`** that re-reads the JSON and atomically swaps the dict — no partial states visible to in-flight requests.",
              "**Build the SDK shim** with a 50ms timeout, single retry, and a hardcoded default if the service is unreachable.",
              "**Test the sticky bucketing**: same `user_id` must hit the same bucket across restarts, across processes, across machines."
            ]
          }
        ]
      },
      {
        "heading": "The evaluator (the heart of it)",
        "body": [
          {
            "type": "p",
            "text": "This is the only non-trivial code in the project. Everything else is wiring."
          },
          {
            "type": "p",
            "text": "**The `Flag` type + the bucket function.** Bucketing salts by flag key so two rollouts at 10% don't enable the same 10% of users."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "import hashlib  # stdlib — no extra deps\nfrom dataclasses import dataclass\n\n@dataclass(frozen=True)  # frozen = hashable, safe to share\nclass Flag:\n    key: str\n    default: bool  # value when no rule matches\n    rollout_pct: int  # 0..100, percentage of users ON\n    targeting: list[dict] = None  # optional allowlist rules\n\ndef _bucket(flag_key: str, user_id: str) -> int:\n    raw = f\"{flag_key}:{user_id}\".encode()  # salt by flag → independent rollouts\n    h = hashlib.md5(raw).digest()  # md5 is fine here — not crypto\n    return int.from_bytes(h[:4], \"big\") % 100    # 0..99, uniform enough for rollouts"
          },
          {
            "type": "p",
            "text": "**`evaluate`** — targeting first, percentage second, default last. The returned reason string is debug gold when something looks off in prod."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "def evaluate(flag: Flag, user_id: str) -> tuple[bool, str]:\n    if flag.targeting:  # explicit rules win over percentage\n        for rule in flag.targeting:\n            if user_id in rule.get(\"values\", []):\n                return True, \"targeted\"  # reason field — debug gold in prod\n    if flag.rollout_pct >= 100:\n        return True, \"full-rollout\"  # short-circuit, skip the hash\n    if flag.rollout_pct <= 0:\n        return flag.default, \"no-rollout\"  # respect default for 0% flags\n    bucket = _bucket(flag.key, user_id)  # sticky: same user → same bucket\n    on = bucket < flag.rollout_pct  # < not ≤ — pct=0 means nobody\n    return on, f\"bucket={bucket}\"  # exposes WHY for log-grepping\n"
          }
        ]
      },
      {
        "heading": "Success criteria",
        "body": [
          {
            "type": "ul",
            "items": [
              "**Stickiness:** hitting `/flags/checkout_v2?user_id=alice` 100 times returns the *same* answer every time, even after a restart.",
              "**Uniform rollout:** at `rollout_pct: 50`, sampling 10 000 random user_ids gives 50% ± 1.5% ON — not 30%, not 70%.",
              "**Cold-start under 200 ms:** `time uvicorn app:app` reaches \"Application startup complete\" in under 200 ms with 100 flags loaded.",
              "**SDK never raises:** killing the flag service mid-request returns the local default in the app — no traceback, no 500.",
              "**Hot reload works:** edit `flags.json`, hit `POST /reload`, next request reflects the new value with no dropped connections.",
              "**Targeting precedence:** a user in a targeting allowlist gets ON even when `rollout_pct: 0`."
            ]
          }
        ]
      },
      {
        "heading": "Watch out for",
        "body": [
          {
            "type": "pros-cons",
            "goodLabel": "WHAT'S NICE",
            "watchLabel": "GOTCHAS",
            "good": [
              "Pure-function evaluator means unit tests don't need HTTP at all",
              "JSON cold-start file is git-diffable — flag changes show up in PRs",
              "`reason` field in the response saves hours when a flag \"doesn't work\""
            ],
            "watch": [
              "Hashing only on `user_id` without the flag key → every flag flips for the same cohort together",
              "Polling the service per request instead of caching in the SDK will melt your tail latency",
              "Reading `flags.json` mid-request without an atomic swap → torn reads under reload"
            ]
          }
        ]
      }
    ]
  },
  "circuit-breaker-mesh": {
    "sections": [
      {
        "heading": "Summary",
        "body": [
          {
            "type": "p",
            "text": "Build a Python library implementing the core resilience patterns of a service mesh (Istio, Linkerd): circuit breakers, retries with exponential backoff + jitter, timeouts, bulkheads. Deploy a 4-microservice demo where killing any one service doesn't cascade-fail the rest."
          }
        ]
      }
    ]
  },
  "d1": {
    "sections": [
      {
        "heading": "The 13 commands you actually type",
        "body": [
          {
            "type": "p",
            "text": "The main lesson teaches you **what** these commands do. This one is your **muscle-memory reference** — the tiny set you reach for daily, with the one flag each that matters. Forget `info coreutils`. Learn these by typing them."
          },
          {
            "type": "p",
            "text": "Every Linux pipeline you'll ever build is a **composition of small filters**. Each command reads stdin, transforms it, writes stdout. Master the inputs and outputs and the pipe `|` does the rest."
          },
          {
            "type": "p",
            "text": "**Reading and finding** — the commands you use to look at files and locate them on disk."
          },
          {
            "type": "table",
            "headers": [
              "Command",
              "Flag",
              "Why"
            ],
            "rows": [
              [
                "`cat`",
                "`-n`",
                "Number lines for quick reference"
              ],
              [
                "`less`",
                "`-S`",
                "Don't wrap long lines (logs)"
              ],
              [
                "`grep`",
                "`-r`",
                "Recurse into directories"
              ],
              [
                "`find`",
                "`-name`",
                "Glob match on filename"
              ],
              [
                "`head`",
                "`-n 20`",
                "Default 10 is rarely right"
              ],
              [
                "`tail`",
                "`-f`",
                "Follow log file as it grows"
              ]
            ]
          },
          {
            "type": "p",
            "text": "**Transforming and counting** — the filters you stitch together with pipes."
          },
          {
            "type": "table",
            "headers": [
              "Command",
              "Flag",
              "Why"
            ],
            "rows": [
              [
                "`xargs`",
                "`-I {}`",
                "Placeholder for per-item commands"
              ],
              [
                "`sort`",
                "`-u`",
                "Sort + dedupe in one pass"
              ],
              [
                "`uniq`",
                "`-c`",
                "Count occurrences (sorted input)"
              ],
              [
                "`wc`",
                "`-l`",
                "Line count — 90% of uses"
              ],
              [
                "`awk`",
                "`'{print $2}'`",
                "Grab the Nth field"
              ],
              [
                "`sed`",
                "`s/old/new/g`",
                "Substitute, globally per line"
              ],
              [
                "`tr`",
                "`-d`",
                "Delete chars (newlines, punct)"
              ]
            ]
          }
        ]
      },
      {
        "heading": "The one pipeline to internalize",
        "body": [
          {
            "type": "p",
            "text": "If you understand this five-stage pipeline, you understand **Unix composition**. Read it left to right — each `|` hands a stream of text to the next filter."
          },
          {
            "type": "code",
            "lang": "bash",
            "text": "find . -name \"*.log\" \\  # walk cwd, match log files\n  | xargs grep -l ERROR \\  # files containing ERROR (-l = names only)\n  | sort -u \\  # dedupe paths, just in case\n  | xargs grep -c ERROR \\  # count ERROR lines per file\n  | sort -t: -k2 -n -r \\  # sort by count desc, : delimiter\n  | head -n 10  # top 10 noisiest logs"
          },
          {
            "type": "p",
            "text": "Notice the **shape**: `find` produces paths, `xargs` turns those paths into args for `grep`, `grep` produces `path:count` lines, `sort` orders them, `head` truncates. **No temp files. No loops. No script.** Every stage is killable, replaceable, debuggable in isolation."
          },
          {
            "type": "walkthrough",
            "title": "Stdin → filter → stdout, repeated",
            "why": "No temp files, no loops, no script — every stage is killable, replaceable, and debuggable in isolation.",
            "nodes": [
              {
                "id": "find",
                "label": "find",
                "subtitle": "paths",
                "x": 0.3,
                "y": 0.15,
                "accent": "water"
              },
              {
                "id": "xargs1",
                "label": "xargs grep -l",
                "subtitle": "match",
                "x": 0.7,
                "y": 0.15,
                "accent": "sky"
              },
              {
                "id": "sort",
                "label": "sort -u",
                "subtitle": "dedupe",
                "x": 0.3,
                "y": 0.5,
                "accent": "amber"
              },
              {
                "id": "xargs2",
                "label": "xargs grep -c",
                "subtitle": "count",
                "x": 0.7,
                "y": 0.5,
                "accent": "earth"
              },
              {
                "id": "head",
                "label": "head -n 10",
                "subtitle": "top 10",
                "x": 0.5,
                "y": 0.85,
                "accent": "fire"
              }
            ],
            "steps": [
              {
                "title": "Find the files",
                "description": "`find . -name \"*.log\"` walks the directory tree and emits a stream of **paths** on stdout. This is the source — every later stage just transforms its input.",
                "activeNodes": ["find"],
                "activeEdges": []
              },
              {
                "title": "Match the ones with ERROR",
                "description": "`xargs grep -l ERROR` turns those paths into args for `grep`, keeping only files that **contain** ERROR (`-l` prints names, not lines).",
                "activeNodes": ["find", "xargs1"],
                "activeEdges": [{ "from": "find", "to": "xargs1", "label": "paths" }]
              },
              {
                "title": "Dedupe the paths",
                "description": "`sort -u` drops any duplicate paths in one pass, so the next stage never counts the same file twice.",
                "activeNodes": ["xargs1", "sort"],
                "activeEdges": [{ "from": "xargs1", "to": "sort", "label": "paths" }]
              },
              {
                "title": "Count ERRORs per file",
                "description": "`xargs grep -c ERROR` counts matching lines in each file, emitting `path:count` pairs — the shape changes from paths to data.",
                "activeNodes": ["sort", "xargs2"],
                "activeEdges": [{ "from": "sort", "to": "xargs2", "label": "paths" }]
              },
              {
                "title": "Keep the top 10",
                "description": "After a numeric `sort`, `head -n 10` truncates to the ten noisiest logs. The pipe `|` did all the gluing — no temp file ever touched disk.",
                "activeNodes": ["xargs2", "head"],
                "activeEdges": [{ "from": "xargs2", "to": "head", "label": "path:count" }]
              }
            ]
          }
        ]
      },
      {
        "heading": "awk vs sed vs grep — when each wins",
        "body": [
          {
            "type": "p",
            "text": "These three blur together until you've used them angry. The split is **what each treats as the unit of work**."
          },
          {
            "type": "terms",
            "items": [
              {
                "term": "grep",
                "def": "line filter. Keep lines matching a regex. No transformation."
              },
              {
                "term": "sed",
                "def": "stream editor. Transform lines via substitution. Best for `s/x/y/g`."
              },
              {
                "term": "awk",
                "def": "column processor. Splits each line into `$1 $2 $3...` automatically. Use for tabular data."
              },
              {
                "term": "tr",
                "def": "character translator. No regex, no lines — just per-char mapping or deletion."
              }
            ]
          },
          {
            "type": "p",
            "text": "**Rule of thumb**: reach for `grep` first. If you need to *change* text, `sed`. If your data has *columns* (whitespace or `:` separated), `awk`. If you're mangling individual characters (case, newlines, punctuation), `tr`."
          }
        ]
      },
      {
        "heading": "Watch out for",
        "body": [
          {
            "type": "ul",
            "items": [
              "**Filenames with spaces break `xargs`.** Use `find ... -print0 | xargs -0` or `find ... -exec` to handle them safely.",
              "**`uniq` only dedupes *adjacent* duplicates.** Always `sort | uniq` together — never `uniq` alone on unsorted input.",
              "**`grep` without `-F` interprets the pattern as regex.** Hunting for a literal `1.2.3.4`? Use `grep -F` or escape the dots.",
              "**`tail -f` won't follow log rotation.** Use `tail -F` (capital F) for production logs that get rotated.",
              "**`cat file | grep foo` is a useless `cat`.** Just `grep foo file`. The shell-pipeline reflex is strong; resist it for single-file reads."
            ]
          },
          {
            "type": "quote",
            "text": "Write programs that do one thing and do it well. Write programs to work together. Write programs to handle text streams, because that is a universal interface.",
            "cite": "Doug McIlroy, Bell Labs, 1978"
          }
        ]
      }
    ]
  },
  "d3": {
    "sections": [
      {
        "heading": "The cleanup is the lesson",
        "body": [
          {
            "type": "p",
            "text": "The canonical lesson taught you **how to branch and merge**. This one is about what happens **after the merge button** — the part nobody demos. A repo without cleanup discipline turns into a graveyard of stale branches, dangling refs, and `git branch` output you have to scroll past."
          },
          {
            "type": "p",
            "text": "Treat **branches as disposable**. The commits are the artifact; the branch is just a sticky note pointing at the tip. Once merged, peel the sticky note off."
          }
        ]
      },
      {
        "heading": "The shape of the flow",
        "body": [
          {
            "type": "diagram",
            "title": "feature branch lifecycle",
            "nodes": [
              {
                "id": "main1",
                "label": "main",
                "subtitle": "before",
                "x": 0.08,
                "y": 0.3,
                "accent": "amber"
              },
              {
                "id": "feat",
                "label": "feature/x",
                "subtitle": "your sandbox",
                "x": 0.42,
                "y": 0.7,
                "accent": "sky"
              },
              {
                "id": "main2",
                "label": "main",
                "subtitle": "after merge",
                "x": 0.72,
                "y": 0.3,
                "accent": "amber"
              },
              {
                "id": "gone",
                "label": "deleted",
                "subtitle": "local + remote",
                "x": 0.94,
                "y": 0.7,
                "accent": "fire"
              }
            ],
            "edges": [
              {
                "from": "main1",
                "to": "feat",
                "kind": "dashed",
                "label": "checkout -b",
                "accent": "sky"
              },
              {
                "from": "feat",
                "to": "main2",
                "kind": "dashed",
                "label": "merge --no-ff",
                "accent": "earth"
              },
              {
                "from": "main1",
                "to": "main2",
                "kind": "solid",
                "accent": "amber"
              },
              {
                "from": "feat",
                "to": "gone",
                "kind": "dashed",
                "label": "branch -d",
                "accent": "fire"
              }
            ]
          },
          {
            "type": "p",
            "text": "Four moves: **fork off**, **work**, **merge back**, **delete**. Most people stop at step three and wonder why their branch list has 47 entries."
          }
        ]
      },
      {
        "heading": "The full sequence, annotated",
        "body": [
          {
            "type": "code",
            "lang": "bash",
            "text": "git checkout main  # start from the trunk\ngit pull --ff-only  # refuse surprise merges\ngit checkout -b feature/login-rate  # new branch, descriptive name\n\n# ... edit, commit, repeat ...\ngit add -p  # stage hunks deliberately\ngit commit -m \"limit login to 5/min\" # imperative mood, one idea\n\ngit fetch origin  # learn what moved upstream\ngit rebase origin/main  # replay your work on top\ngit push -u origin feature/login-rate # publish, set upstream\n\n# ... PR gets approved and merged on the host ...\n\ngit checkout main  # back to the trunk\ngit pull --ff-only  # pick up the merge commit\ngit branch -d feature/login-rate    # safe delete — refuses if unmerged\ngit fetch --prune  # drop remote-tracking ghosts\ngit remote prune origin  # belt and suspenders\ngit gc --auto  # let git compact when ready"
          },
          {
            "type": "p",
            "text": "Notice **-d not -D**. Lowercase **refuses to delete an unmerged branch**; uppercase forces it. Force-delete is for branches you abandoned on purpose."
          }
        ]
      },
      {
        "heading": "Cleanup commands, ranked by what they actually do",
        "body": [
          {
            "type": "table",
            "headers": [
              "Command",
              "Local?",
              "Remote?",
              "What it removes"
            ],
            "rows": [
              [
                "`git branch -d feat`",
                "✓",
                "✗",
                "the local branch ref"
              ],
              [
                "`git push origin --delete feat`",
                "✗",
                "✓",
                "the branch on the remote"
              ],
              [
                "`git fetch --prune`",
                "✓",
                "✗",
                "stale `origin/feat` tracking refs"
              ],
              [
                "`git remote prune origin`",
                "✓",
                "✗",
                "same as above, older spelling"
              ],
              [
                "`git gc`",
                "✓",
                "✗",
                "loose objects, packs the rest"
              ]
            ]
          },
          {
            "type": "p",
            "text": "GitHub/GitLab's **\"delete branch\" button** covers the remote half. You still owe the local cleanup — your machine doesn't know the branch is dead until you tell it."
          }
        ]
      },
      {
        "heading": "Watch out for",
        "body": [
          {
            "type": "terms",
            "items": [
              {
                "term": "Squash-merged branches",
                "def": "`-d` will refuse them because the SHA never appears on main. Use `-D` once you confirm the PR is in."
              },
              {
                "term": "Detached HEAD after delete",
                "def": "Don't delete the branch you're standing on. `checkout main` first."
              },
              {
                "term": "Reflog safety net",
                "def": "Deleted a branch by mistake? `git reflog` shows the old tip for ~90 days. Recover with `git checkout -b name <sha>`."
              },
              {
                "term": "Shared long-lived branches",
                "def": "`develop`, `release/*` — these are not feature branches. Don't prune what the team still uses."
              }
            ]
          },
          {
            "type": "quote",
            "text": "A branch you don't delete is a branch someone else will be afraid to touch.",
            "cite": "every senior reviewing your `git branch -a` output"
          }
        ]
      }
    ]
  },
  "d4": {
    "cliffhanger": "So how do you keep these containers running when one crashes at 3 AM?",
    "sections": [
      {
        "heading": "Three nouns, one workflow",
        "body": [
          {
            "type": "p",
            "text": "Forget namespaces and cgroups for a minute. The canonical lesson covers what a container *is* under the hood. This lesson is the **practitioner's view**: the three things you actually type, pull, and push every day."
          },
          {
            "type": "p",
            "text": "Those three nouns are **image**, **container**, and **registry**. If you can keep them straight, ninety percent of Docker, Kubernetes, and CI/CD stops being confusing. Most beginner bugs come from mixing them up."
          },
          {
            "type": "terms",
            "items": [
              {
                "term": "Image",
                "def": "a frozen, read-only filesystem snapshot plus metadata — like a class definition."
              },
              {
                "term": "Container",
                "def": "a running (or stopped) instance of an image — like an object instantiated from that class."
              },
              {
                "term": "Registry",
                "def": "a server that stores images so other machines can pull them — like npm or PyPI, but for images."
              }
            ]
          }
        ]
      },
      {
        "heading": "The lifecycle, end to end",
        "body": [
          {
            "type": "p",
            "text": "Every container you'll ever run follows this loop. Build locally, push to a registry, pull on the target machine, run as a container. That's the whole story."
          },
          {
            "type": "walkthrough",
            "title": "Image -> Registry -> Container",
            "why": "Image is the noun, container is the verb, registry is the post office — keep the three straight and most of Docker stops being confusing.",
            "nodes": [
              {
                "id": "dev",
                "label": "Dockerfile",
                "subtitle": "recipe",
                "x": 0.05,
                "y": 0.5,
                "accent": "water"
              },
              {
                "id": "img",
                "label": "Image",
                "subtitle": "frozen snapshot",
                "x": 0.3,
                "y": 0.5,
                "accent": "sky"
              },
              {
                "id": "reg",
                "label": "Registry",
                "subtitle": "ECR / GHCR",
                "x": 0.55,
                "y": 0.5,
                "accent": "earth"
              },
              {
                "id": "node",
                "label": "Target host",
                "subtitle": "prod / laptop / CI",
                "x": 0.8,
                "y": 0.25,
                "accent": "amber"
              },
              {
                "id": "ctr",
                "label": "Container",
                "subtitle": "running process",
                "x": 0.8,
                "y": 0.75,
                "accent": "fire"
              }
            ],
            "steps": [
              {
                "title": "Start with a recipe",
                "description": "A **Dockerfile** is the recipe — a text list of build steps. Nothing runs yet; it just describes how to assemble the filesystem.",
                "activeNodes": ["dev"],
                "activeEdges": []
              },
              {
                "title": "Build the image",
                "description": "`docker build` turns the recipe into an **image** — a frozen, read-only snapshot. Think of it as a class definition: built once, reused many times.",
                "activeNodes": ["dev", "img"],
                "activeEdges": [{ "from": "dev", "to": "img", "label": "docker build" }]
              },
              {
                "title": "Push to a registry",
                "description": "`docker push` uploads the image to a **registry** (ECR, GHCR). Registries are dumb storage — they hold images so other machines can pull them, like npm for images.",
                "activeNodes": ["img", "reg"],
                "activeEdges": [{ "from": "img", "to": "reg", "label": "docker push" }]
              },
              {
                "title": "Pull onto the target host",
                "description": "On prod, a laptop, or CI, `docker pull` downloads the image into the local cache. Only layers not already present cross the network — fast after the first time.",
                "activeNodes": ["reg", "node"],
                "activeEdges": [{ "from": "reg", "to": "node", "label": "docker pull" }]
              },
              {
                "title": "Run a container",
                "description": "`docker run` instantiates the image into a live **container** — a running process. One image, many containers: same class, ten objects.",
                "activeNodes": ["node", "ctr"],
                "activeEdges": [{ "from": "node", "to": "ctr", "label": "docker run" }]
              }
            ]
          },
          {
            "type": "p",
            "text": "The arrows have **direction and verbs**. `build` goes recipe to image. `push` and `pull` move the image across the network. `run` creates a live container from the image. Mix these verbs up and `command not found` will haunt you."
          }
        ]
      },
      {
        "heading": "The four commands that matter",
        "body": [
          {
            "type": "p",
            "text": "Here's the full loop in bash. Read the comments — they're where the noun confusion gets cleared up."
          },
          {
            "type": "code",
            "lang": "bash",
            "text": "# 1. BUILD: Dockerfile -> image (local)\ndocker build -t myapp:v1 .  # tag the image myapp:v1\n\n# 2. TAG: rename for a remote registry\ndocker tag myapp:v1 \\\n  ghcr.io/user/myapp:v1  # registry/user/repo:tag\n\n# 3. PUSH: image -> registry (network)\ndocker push ghcr.io/user/myapp:v1  # uploads layers not already there\n\n# 4. PULL + RUN: registry -> container (on prod)\ndocker pull ghcr.io/user/myapp:v1  # downloads to local image cache\ndocker run -d -p 8080:80 \\  # -d = detached, -p = port map\n  --name web \\  # container name (not image name)\n  ghcr.io/user/myapp:v1  # the image to instantiate"
          },
          {
            "type": "p",
            "text": "Notice step 4: `--name web` names the **container**, but `ghcr.io/user/myapp:v1` names the **image**. You can launch ten containers from one image, each with its own name. Same class, ten objects."
          }
        ]
      },
      {
        "heading": "Image names decoded",
        "body": [
          {
            "type": "p",
            "text": "Image references look like a URL crammed into one string. Once you can parse them, registry errors stop being mysterious."
          },
          {
            "type": "terms",
            "items": [
              {
                "term": "`nginx`",
                "def": "Registry: `docker.io` (default) · Repo: `library/nginx` · Tag: `latest`. Pulls the Docker Hub official image."
              },
              {
                "term": "`postgres:16`",
                "def": "Registry: `docker.io` · Repo: `library/postgres` · Tag: `16`. Pulls a specific major version from Docker Hub."
              },
              {
                "term": "`ghcr.io/user/api:v2`",
                "def": "Registry: `ghcr.io` · Repo: `user/api` · Tag: `v2`. Pulls from GitHub Container Registry."
              },
              {
                "term": "`123.dkr.ecr.us-east-1.amazonaws.com/api:prod`",
                "def": "Registry: ECR (region in hostname) · Repo: `api` · Tag: `prod`. Pulls from your AWS private registry."
              }
            ]
          },
          {
            "type": "p",
            "text": "When no registry is given, Docker silently assumes `docker.io`. That's why `docker pull nginx` works without a domain — it's not magic, it's a default."
          }
        ]
      },
      {
        "heading": "Watch out for",
        "body": [
          {
            "type": "pros-cons",
            "goodLabel": "Mental model that holds up",
            "watchLabel": "Traps that bite beginners",
            "good": [
              "Image = class, container = object. One image, many containers.",
              "Push and pull only move *layers* that aren't already on the other side — fast after the first time.",
              "Registries are dumb storage. They don't run anything."
            ],
            "watch": [
              "`:latest` is not a version — it's a moving pointer. Pin real tags in production.",
              "Deleting a container does NOT delete its image. Disk fills up silently. Run `docker image prune`.",
              "`docker run` on an image you already have *will not* re-pull. Use `docker pull` first if you want freshness.",
              "Container name (`--name web`) and image name (`myapp:v1`) live in different namespaces. Don't conflate them in scripts."
            ]
          },
          {
            "type": "quote",
            "text": "The image is the noun. The container is the verb. The registry is the post office.",
            "cite": "the only mnemonic you need"
          }
        ]
      }
    ]
  },
  "d5": {
    "sections": [
      {
        "heading": "kind vs minikube: pick your poison",
        "body": [
          {
            "type": "p",
            "text": "You need a **local K8s cluster** in the next five minutes. The main lesson covers what K8s *is* — this one is the **lab**: which tool to install, the commands you actually type, and how to verify your service breathes before you tear it down."
          },
          {
            "type": "p",
            "text": "Both tools give you a real Kubernetes API. **kind** runs nodes as Docker containers — fast, CI-friendly, multi-node trivial. **minikube** runs a VM (or container) — heavier, but ships addons (`ingress`, `dashboard`, `metrics-server`) that work out of the box."
          },
          {
            "type": "table",
            "headers": [
              "Need",
              "kind",
              "minikube",
              "Why"
            ],
            "rows": [
              [
                "CI pipelines",
                "✓",
                "✗",
                "Docker-in-Docker, sub-30s boot"
              ],
              [
                "Multi-node cluster",
                "✓",
                "✓",
                "kind: trivial YAML; minikube: --nodes flag"
              ],
              [
                "Ingress + LoadBalancer",
                "✗",
                "✓",
                "minikube tunnel + addons just work"
              ],
              [
                "Dashboard / metrics UI",
                "✗",
                "✓",
                "minikube addons enable handles it"
              ],
              [
                "Lowest RAM footprint",
                "✓",
                "✗",
                "no VM overhead"
              ],
              [
                "Closest to prod node",
                "✗",
                "✓",
                "real kubelet on real VM"
              ]
            ]
          },
          {
            "type": "p",
            "text": "**Rule of thumb:** kind for **testing manifests fast**, minikube for **exploring K8s features** like ingress and storage. Install both — they coexist."
          }
        ]
      },
      {
        "heading": "Spin up a cluster, deploy a service",
        "body": [
          {
            "type": "p",
            "text": "Here's the **full loop**: create cluster, deploy an `nginx` Pod with a liveness probe, expose it, hit it, kill it. Every line annotated."
          },
          {
            "type": "code",
            "lang": "bash",
            "text": "# --- kind path ---\nkind create cluster --name lab --image kindest/node:v1.30.0  # pin node version\nkubectl config use-context kind-lab  # switch kubectl target\nkubectl cluster-info  # sanity: API reachable?\n\n# --- minikube path (alternative) ---\nminikube start --driver=docker --nodes=1 --cpus=2 --memory=2g  # one node, modest box\nminikube addons enable metrics-server  # for kubectl top later\nkubectl get nodes  # confirm Ready status"
          },
          {
            "type": "p",
            "text": "Now drop a **deployment manifest** with a probe. The probe is the point — if you skip it, you have no idea when your Pod is actually serving."
          },
          {
            "type": "code",
            "lang": "yaml",
            "text": "apiVersion: apps/v1\nkind: Deployment  # manages ReplicaSet + rollout\nmetadata:\n  name: web  # referenced by Service selector\nspec:\n  replicas: 2  # two pods, survives one crash\n  selector:\n    matchLabels: { app: web }  # must match template labels below\n  template:\n    metadata:\n      labels: { app: web }  # Service finds pods via this\n    spec:\n      containers:\n      - name: nginx\n        image: nginx:1.27-alpine  # pin tag, not :latest\n        ports:\n        - containerPort: 80  # what nginx listens on\n        livenessProbe:  # restarts pod if this fails\n          httpGet: { path: /, port: 80 }\n          initialDelaySeconds: 3  # grace period before first check\n          periodSeconds: 5  # check every 5s after\n        readinessProbe:  # gates Service traffic\n          httpGet: { path: /, port: 80 }\n          periodSeconds: 2  # tighter — gate traffic fast"
          }
        ]
      },
      {
        "heading": "Apply, probe, expose, verify",
        "body": [
          {
            "type": "code",
            "lang": "bash",
            "text": "kubectl apply -f deploy.yaml  # create Deployment + Pods\nkubectl rollout status deploy/web --timeout=60s    # block until Ready, fail loud\nkubectl get pods -l app=web -o wide  # confirm 2/2 Running\n\nkubectl describe pod -l app=web | grep -A2 Probe   # verify probes registered\nkubectl expose deploy web --port=80 --type=ClusterIP  # internal Service\n\n# kind: port-forward to reach it from host\nkubectl port-forward svc/web 8080:80 &  # background tunnel\ncurl -sI localhost:8080 | head -1  # expect HTTP/1.1 200 OK\n\n# minikube: use the built-in helper instead\nminikube service web --url  # prints reachable URL"
          },
          {
            "type": "diagram",
            "title": "Traffic path on your laptop",
            "nodes": [
              {
                "id": "you",
                "label": "curl",
                "subtitle": "host shell",
                "x": 0.08,
                "y": 0.5,
                "accent": "water"
              },
              {
                "id": "fwd",
                "label": "port-forward",
                "subtitle": ":8080→:80",
                "x": 0.32,
                "y": 0.5,
                "accent": "amber"
              },
              {
                "id": "svc",
                "label": "Service web",
                "subtitle": "ClusterIP",
                "x": 0.56,
                "y": 0.5,
                "accent": "sky"
              },
              {
                "id": "p1",
                "label": "Pod web-a",
                "subtitle": "nginx :80",
                "x": 0.85,
                "y": 0.28,
                "accent": "earth"
              },
              {
                "id": "p2",
                "label": "Pod web-b",
                "subtitle": "nginx :80",
                "x": 0.85,
                "y": 0.72,
                "accent": "earth"
              }
            ],
            "edges": [
              {
                "from": "you",
                "to": "fwd",
                "kind": "dashed",
                "accent": "water"
              },
              {
                "from": "fwd",
                "to": "svc",
                "kind": "dashed",
                "accent": "water"
              },
              {
                "from": "svc",
                "to": "p1",
                "kind": "dashed",
                "label": "readiness ✓",
                "accent": "sky"
              },
              {
                "from": "svc",
                "to": "p2",
                "kind": "dashed",
                "label": "readiness ✓",
                "accent": "sky"
              }
            ]
          }
        ]
      },
      {
        "heading": "Tear down — and watch out for these",
        "body": [
          {
            "type": "code",
            "lang": "bash",
            "text": "kubectl delete -f deploy.yaml  # remove workload first (graceful)\nkubectl delete svc web  # then the Service\nkind delete cluster --name lab  # nukes the Docker nodes\n# or\nminikube delete --profile minikube  # frees VM disk + RAM"
          },
          {
            "type": "pros-cons",
            "goodLabel": "Do",
            "watchLabel": "Watch out for",
            "good": [
              "Pin both node and image versions — :latest breaks reproducibility",
              "Always set readinessProbe — without it Service routes to a cold Pod",
              "Use `kubectl rollout status` in scripts — exits non-zero on failure",
              "Delete the cluster when done — kind nodes silently eat RAM"
            ],
            "watch": [
              "kind has no LoadBalancer — use port-forward or install MetalLB",
              "minikube tunnel needs sudo and a second terminal — easy to forget",
              "DockerHub rate limits hit kind pulls fast — preload with `kind load docker-image`",
              "Probes with initialDelaySeconds=0 cause restart loops on slow boots",
              "Switching contexts is silent — `kubectl config current-context` before every destructive command"
            ]
          },
          {
            "type": "quote",
            "text": "If your readiness probe is missing, your Service is a load balancer for cold Pods.",
            "cite": "the lesson you'll learn once, the hard way"
          }
        ]
      }
    ]
  },
  "d6": {
    "sections": [
      {
        "heading": "Three words, three different things",
        "body": [
          {
            "type": "p",
            "text": "**CI**, **Continuous Delivery**, and **Continuous Deployment** all share the abbreviation **CD** for two of them, and people conflate all three constantly. They are *not* synonyms. They describe **three distinct stages** of automation, and most companies stop at stage two."
          },
          {
            "type": "p",
            "text": "The distinction matters because it tells you **who pushes the button** — a machine, or a human. That single question changes your release risk, your on-call rotation, and your test coverage requirements."
          }
        ]
      },
      {
        "heading": "Precise definitions",
        "body": [
          {
            "type": "terms",
            "items": [
              {
                "term": "Continuous Integration (CI)",
                "def": "every commit triggers an automated **build + test** run against the mainline branch. Output: a green check. Nothing ships."
              },
              {
                "term": "Continuous Delivery",
                "def": "every green build is **automatically packaged and staged** as a release candidate, ready to deploy. A human clicks *Deploy to Prod*."
              },
              {
                "term": "Continuous Deployment",
                "def": "every green build that passes staging **automatically deploys to production**. No human in the loop. Commit → prod in minutes."
              }
            ]
          },
          {
            "type": "p",
            "text": "Notice the *delta* between Delivery and Deployment is exactly **one manual approval step**. That's it. Everything upstream is identical."
          }
        ]
      },
      {
        "heading": "What triggers what",
        "body": [
          {
            "type": "table",
            "headers": [
              "Stage",
              "Trigger",
              "What it automates (button)"
            ],
            "rows": [
              [
                "CI",
                "`git push`",
                "Build, unit tests, lint (auto)"
              ],
              [
                "Delivery",
                "CI passed on `main`",
                "Package + stage + smoke (human pushes prod)"
              ],
              [
                "Deployment",
                "CI + staging passed",
                "Promote, migrate, flip traffic (auto)"
              ],
              [
                "(None)",
                "Manual `scp` at 2am",
                "Your weekend (you, crying)"
              ]
            ]
          }
        ]
      },
      {
        "heading": "The pipeline, drawn",
        "body": [
          {
            "type": "diagram",
            "nodes": [
              {
                "id": "dev",
                "label": "Developer",
                "subtitle": "git push",
                "x": 0.3,
                "y": 0.12,
                "accent": "water"
              },
              {
                "id": "ci",
                "label": "CI",
                "subtitle": "build + test",
                "x": 0.7,
                "y": 0.12,
                "accent": "sky"
              },
              {
                "id": "art",
                "label": "Artifact",
                "subtitle": "tagged image",
                "x": 0.3,
                "y": 0.62,
                "accent": "amber"
              },
              {
                "id": "stg",
                "label": "Staging",
                "subtitle": "auto-deploy",
                "x": 0.7,
                "y": 0.62,
                "accent": "earth"
              },
              {
                "id": "gate",
                "label": "Manual gate",
                "subtitle": "Delivery stops here",
                "x": 0.5,
                "y": 0.37,
                "accent": "fire"
              },
              {
                "id": "prod",
                "label": "Production",
                "subtitle": "Deployment auto-ships",
                "x": 0.5,
                "y": 0.87,
                "accent": "fire"
              }
            ],
            "edges": [
              {
                "from": "dev",
                "to": "ci",
                "kind": "dashed",
                "label": "commit"
              },
              {
                "from": "ci",
                "to": "art",
                "kind": "solid",
                "label": "green"
              },
              {
                "from": "art",
                "to": "stg",
                "kind": "dashed"
              },
              {
                "from": "stg",
                "to": "gate",
                "kind": "dashed",
                "label": "human"
              },
              {
                "from": "stg",
                "to": "prod",
                "kind": "dashed",
                "label": "auto"
              }
            ]
          },
          {
            "type": "p",
            "text": "Same pipeline. The **only** branch point is the last hop: human approval vs auto-promote."
          }
        ]
      },
      {
        "heading": "What this looks like in YAML",
        "body": [
          {
            "type": "code",
            "lang": "yaml",
            "text": "# .github/workflows/release.yml\non:\n  push:\n    branches: [main]  # CI runs on every push\n\njobs:\n  ci:  # === Continuous Integration ===\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - run: npm test  # green check or bust\n      - run: docker build -t app:${{ github.sha }} .\n\n  deliver:  # === Continuous Delivery ===\n    needs: ci  # only if CI passed\n    runs-on: ubuntu-latest\n    steps:\n      - run: deploy staging app:${{ github.sha }}   # auto to staging\n      - run: smoke-test staging  # gate the artifact\n\n  deploy:  # === Continuous Deployment ===\n    needs: deliver  # only if staging is green\n    runs-on: ubuntu-latest\n    environment: production  # remove `environment` → fully auto\n    steps:  # `environment: production` adds approval\n      - run: deploy prod app:${{ github.sha }}  # ship it"
          },
          {
            "type": "p",
            "text": "Delete the `environment: production` line and you've upgraded **Delivery → Deployment**. That's the entire technical difference."
          }
        ]
      },
      {
        "heading": "Why most companies stop at Delivery",
        "body": [
          {
            "type": "pros-cons",
            "goodLabel": "Why teams pick Delivery (the realistic state)",
            "good": [
              "Humans catch *judgment calls* automated tests miss (bad timing, customer comms)",
              "Audit trail: someone signed off on the prod change",
              "Cheap to implement — you already have the pipeline",
              "Works fine even with mediocre test coverage"
            ],
            "watchLabel": "Why full Deployment is rarer",
            "watch": [
              "Requires **excellent** test coverage and observability — bugs hit prod in minutes",
              "Needs feature flags so you can ship code without exposing features",
              "Needs instant rollback (canary, blue/green) — and the discipline to use it",
              "Regulated industries (finance, health) often forbid it by policy"
            ]
          },
          {
            "type": "quote",
            "text": "CI is table stakes. Delivery is the goal. Deployment is the flex."
          }
        ]
      },
      {
        "heading": "Watch out for",
        "body": [
          {
            "type": "ul",
            "items": [
              "**\"We do CI/CD\"** usually means CI + Delivery. Ask which one when interviewing.",
              "**CI without Delivery** is half a pipeline — you tested it, but shipping is still manual `ssh`. Don't stop there.",
              "**Deployment without feature flags** is how you ship a half-done feature to users on Friday at 5pm.",
              "The acronym **CD** is ambiguous on purpose in marketing. In docs, spell it out."
            ]
          }
        ]
      }
    ]
  },
  "d7": {
    "sections": [
      {
        "heading": "The file you actually write",
        "body": [
          {
            "type": "p",
            "text": "Forget the **theory** for a moment. You want a **VPC** with public + private subnets across 3 AZs, internet egress, and the **NAT gateway** wired correctly. This is the file. Drop it in `main.tf`, run `terraform apply`, you have a network."
          },
          {
            "type": "p",
            "text": "Every non-obvious line is **annotated**. The annotations are the lesson — read them like a code review."
          }
        ]
      },
      {
        "heading": "main.tf — annotated end to end",
        "body": [
          {
            "type": "p",
            "text": "**Setup first** — provider pin, the three AZs you'll spread across, and the VPC itself."
          },
          {
            "type": "code",
            "lang": "txt",
            "text": "terraform {\n  required_providers {\n    aws = { source = \"hashicorp/aws\", version = \"~> 5.0\" }  # pin major\n  }\n}\n\nprovider \"aws\" { region = \"us-east-1\" }  # one region only\n\nlocals {\n  azs          = [\"us-east-1a\",\"us-east-1b\",\"us-east-1c\"]  # 3 AZs hardcoded\n  public_cidrs = [\"10.0.0.0/24\",\"10.0.1.0/24\",\"10.0.2.0/24\"] # /24 each\n  priv_cidrs   = [\"10.0.10.0/24\",\"10.0.11.0/24\",\"10.0.12.0/24\"]\n}\n\nresource \"aws_vpc\" \"main\" {\n  cidr_block           = \"10.0.0.0/16\"  # 65k addrs\n  enable_dns_hostnames = true  # EC2 gets DNS\n  enable_dns_support   = true  # resolver on\n  tags = { Name = \"main\" }\n}\n\nresource \"aws_internet_gateway\" \"igw\" {\n  vpc_id = aws_vpc.main.id  # attach to VPC\n}"
          },
          {
            "type": "p",
            "text": "**Subnets** — three public (LBs, NAT) and three private (apps, DB), one of each per AZ. `count = 3` plus `count.index` indexes the locals."
          },
          {
            "type": "code",
            "lang": "txt",
            "text": "resource \"aws_subnet\" \"public\" {\n  count                   = 3  # one per AZ\n  vpc_id                  = aws_vpc.main.id\n  cidr_block              = local.public_cidrs[count.index]   # zip with AZ\n  availability_zone       = local.azs[count.index]\n  map_public_ip_on_launch = true  # auto public IP\n  tags = { Name = \"public-${count.index}\" }\n}\n\nresource \"aws_subnet\" \"private\" {\n  count             = 3\n  vpc_id            = aws_vpc.main.id\n  cidr_block        = local.priv_cidrs[count.index]\n  availability_zone = local.azs[count.index]  # match public AZ\n  tags = { Name = \"private-${count.index}\" }\n}"
          },
          {
            "type": "p",
            "text": "**Egress for the private subnets** — a NAT gateway with a static EIP, parked in the first public subnet."
          },
          {
            "type": "code",
            "lang": "txt",
            "text": "resource \"aws_eip\" \"nat\" { domain = \"vpc\" }  # static IP for NAT\n\nresource \"aws_nat_gateway\" \"nat\" {\n  allocation_id = aws_eip.nat.id  # bind EIP\n  subnet_id     = aws_subnet.public[0].id  # NAT lives public\n  depends_on    = [aws_internet_gateway.igw]  # IGW first\n}"
          },
          {
            "type": "p",
            "text": "**Routing** — two tables (public goes through IGW, private through NAT), then bind all 6 subnets to the right one."
          },
          {
            "type": "code",
            "lang": "txt",
            "text": "resource \"aws_route_table\" \"public\" {\n  vpc_id = aws_vpc.main.id\n  route {\n    cidr_block = \"0.0.0.0/0\"  # default route\n    gateway_id = aws_internet_gateway.igw.id  # via IGW\n  }\n}\n\nresource \"aws_route_table\" \"private\" {\n  vpc_id = aws_vpc.main.id\n  route {\n    cidr_block     = \"0.0.0.0/0\"\n    nat_gateway_id = aws_nat_gateway.nat.id  # via NAT\n  }\n}\n\nresource \"aws_route_table_association\" \"public\" {\n  count          = 3  # bind all 3\n  subnet_id      = aws_subnet.public[count.index].id\n  route_table_id = aws_route_table.public.id\n}\n\nresource \"aws_route_table_association\" \"private\" {\n  count          = 3\n  subnet_id      = aws_subnet.private[count.index].id\n  route_table_id = aws_route_table.private.id\n}"
          }
        ]
      },
      {
        "heading": "What each block does, at a glance",
        "body": [
          {
            "type": "p",
            "text": "**Network shell** — VPC, gateway, and subnets define the address space and what gets a public IP."
          },
          {
            "type": "table",
            "headers": [
              "Resource",
              "Count",
              "Why it exists"
            ],
            "rows": [
              [
                "aws_vpc",
                "1",
                "the address space (10.0.0.0/16)"
              ],
              [
                "aws_internet_gateway",
                "1",
                "public egress + ingress door"
              ],
              [
                "aws_subnet.public",
                "3",
                "load balancers, NAT, bastion live here"
              ],
              [
                "aws_subnet.private",
                "3",
                "app + db; no public IPs ever"
              ]
            ]
          },
          {
            "type": "p",
            "text": "**Routing and outbound NAT** — these let private subnets reach the internet without being reachable from it."
          },
          {
            "type": "table",
            "headers": [
              "Resource",
              "Count",
              "Why it exists"
            ],
            "rows": [
              [
                "aws_eip",
                "1",
                "static IP so NAT survives restarts"
              ],
              [
                "aws_nat_gateway",
                "1",
                "private subnets reach internet outbound"
              ],
              [
                "aws_route_table.public",
                "1",
                "0.0.0.0/0 → IGW"
              ],
              [
                "aws_route_table.private",
                "1",
                "0.0.0.0/0 → NAT"
              ],
              [
                "aws_route_table_association",
                "6",
                "binds 6 subnets to 2 tables"
              ]
            ]
          }
        ]
      },
      {
        "heading": "The traffic flow you just built",
        "body": [
          {
            "type": "diagram",
            "nodes": [
              {
                "id": "user",
                "label": "internet",
                "x": 0.5,
                "y": 0.05,
                "accent": "water"
              },
              {
                "id": "igw",
                "label": "IGW",
                "subtitle": "ingress + egress",
                "x": 0.5,
                "y": 0.25,
                "accent": "amber"
              },
              {
                "id": "pub",
                "label": "public subnet",
                "subtitle": "10.0.0.0/24",
                "x": 0.2,
                "y": 0.5,
                "accent": "sky"
              },
              {
                "id": "nat",
                "label": "NAT GW",
                "subtitle": "EIP attached",
                "x": 0.5,
                "y": 0.5,
                "accent": "amber"
              },
              {
                "id": "priv",
                "label": "private subnet",
                "subtitle": "10.0.10.0/24",
                "x": 0.8,
                "y": 0.5,
                "accent": "earth"
              },
              {
                "id": "app",
                "label": "app + db",
                "x": 0.8,
                "y": 0.8,
                "accent": "fire"
              }
            ],
            "edges": [
              {
                "from": "user",
                "to": "igw",
                "kind": "dashed",
                "accent": "water"
              },
              {
                "from": "igw",
                "to": "pub",
                "kind": "solid"
              },
              {
                "from": "igw",
                "to": "nat",
                "kind": "solid",
                "accent": "amber"
              },
              {
                "from": "nat",
                "to": "priv",
                "kind": "dashed",
                "label": "outbound only",
                "accent": "amber"
              },
              {
                "from": "priv",
                "to": "app",
                "kind": "solid",
                "accent": "fire"
              }
            ]
          }
        ]
      },
      {
        "heading": "Watch out for",
        "body": [
          {
            "type": "ul",
            "items": [
              "**`map_public_ip_on_launch = true`** is only valid on **public** subnets — set it on a private subnet and you defeat the whole isolation model.",
              "**One NAT per AZ** is the production pattern. The file above uses one NAT in `public[0]` for cost — if that AZ dies, AZs 1 and 2 lose egress.",
              "**`depends_on = [aws_internet_gateway.igw]`** on the NAT looks redundant but isn't — NAT silently fails to attach if the IGW isn't fully ready.",
              "**Route table associations** are a separate resource. Forget them and your subnets have no default route — packets go nowhere, errors are silent."
            ]
          },
          {
            "type": "quote",
            "text": "If your `terraform apply` succeeds but nothing has internet, you forgot the route table association.",
            "cite": "every Terraform engineer, once"
          }
        ]
      }
    ]
  },
  "sd-isolation": {
    "sections": [
      {
        "heading": "Two questions every process asks",
        "body": [
          {
            "type": "p",
            "text": "Every running process on a Linux box implicitly asks the kernel two questions: **what can I see?** and **what can I use?** On a normal server the answer to both is *everything* — every PID, every mount, every byte of RAM, every CPU cycle. That is fine when you trust the workload. It is a disaster when you pack fifty strangers onto one machine."
          },
          {
            "type": "p",
            "text": "Containers are not magic. They are just processes wearing two pieces of kernel jewelry: **namespaces** answer the *see* question, **cgroups** answer the *use* question. Get those two right and you have isolation. Get either one wrong and you have a noisy neighbor — or a security incident."
          },
          {
            "type": "quote",
            "text": "Namespaces decide what a process can SEE. Cgroups decide what it can USE."
          }
        ]
      },
      {
        "heading": "Namespaces — the lie the kernel tells",
        "body": [
          {
            "type": "p",
            "text": "A namespace is a **scoped view** of some kernel resource. The process thinks it owns the whole world; the kernel quietly filters every syscall so it only sees its slice. There are **seven** of them, and each one fakes a different illusion."
          },
          {
            "type": "table",
            "headers": [
              "Namespace",
              "What it isolates",
              "Why you care"
            ],
            "rows": [
              [
                "**PID**",
                "process IDs",
                "your app is PID 1, can't see the host"
              ],
              [
                "**Mount**",
                "filesystem tree",
                "your `/` is not the host's `/`"
              ],
              [
                "**Network**",
                "interfaces, ports, routes",
                "two containers both bind :80"
              ],
              [
                "**UTS**",
                "hostname, domainname",
                "`hostname` returns the container name"
              ],
              [
                "**IPC**",
                "shared memory, semaphores",
                "no peeking at the host's SysV segments"
              ],
              [
                "**User**",
                "uid/gid mapping",
                "root inside ≠ root outside"
              ],
              [
                "**Cgroup**",
                "cgroup hierarchy view",
                "you can't see siblings' limits"
              ]
            ]
          },
          {
            "type": "predict",
            "prompt": "You start a container with `--network host` but no other namespace flags changed. From inside, you run `ps aux`. What do you see?",
            "options": [
              "Every host process — `--network host` disables all namespaces",
              "Only the container's own processes — `--network host` only opts out of the network namespace",
              "Nothing — `ps` can't run without `/proc` mounted",
              "An error — `--network host` is incompatible with the PID namespace"
            ],
            "answer": 1,
            "explain": "**`--network host` only opts out of the network namespace.** The PID, mount, UTS, IPC, user, and cgroup namespaces are still in place, so `ps aux` shows only the processes inside the container. What changes is that the container shares the host's interfaces, ports, and routing table — so binding `:80` inside means binding `:80` on the host. That's the security trade-off: you get bare-metal network performance, but lose the isolation that prevents port collisions and lateral movement. The namespaces are independent dials, not one switch."
          },
          {
            "type": "p",
            "text": "You do not need Docker to feel this. The `unshare` utility hands you a fresh namespace in one command."
          },
          {
            "type": "code",
            "lang": "bash",
            "text": "unshare --pid --fork --mount-proc bash   # new PID + remount /proc\nps aux  # only bash and ps — host is invisible\necho $$  # prints 1 — you are PID 1 in here\nls /proc | grep -E '^[0-9]+$' | wc -l    # two entries, not two thousand"
          },
          {
            "type": "p",
            "text": "That is the entire trick. The host's `ps` still sees your bash as PID 28471 — but *inside*, the kernel rewrites every answer so you believe you are alone."
          }
        ]
      },
      {
        "heading": "Cgroups — the budget the kernel enforces",
        "body": [
          {
            "type": "p",
            "text": "Seeing only your own processes is nice; it does not stop you from eating all 64 GB of RAM. That is the **cgroups** job. A *control group* is a kernel-managed budget for **CPU**, **memory**, **I/O bandwidth**, and **PID count**. Cross the line and the kernel throttles you, queues you, or — for memory — kills you."
          },
          {
            "type": "code",
            "lang": "bash",
            "text": "docker run --memory 512m --cpus 1.5 myapp  # human-friendly limits\ncat /sys/fs/cgroup/.../memory.max  # 536870912 — exactly 512 MiB\ncat /sys/fs/cgroup/.../cpu.max  # 150000 100000 — 1.5 cores\n# malloc past 512 MiB →\n# kernel: Out of memory: Killed process 1 (myapp) — OOM killer wakes up"
          },
          {
            "type": "p",
            "text": "Notice what cgroups do **not** do: they do not hide anything. A container with `--memory 512m` can still *read* `/proc/meminfo` and see the host's 64 GB — that is a namespace problem, not a cgroup problem. The two systems are orthogonal, and you need both."
          }
        ]
      },
      {
        "heading": "How the two click together",
        "body": [
          {
            "type": "diagram",
            "title": "A container = process + namespaces + cgroup",
            "nodes": [
              {
                "id": "proc",
                "label": "your process",
                "subtitle": "normal PID on host",
                "x": 0.5,
                "y": 0.1,
                "accent": "sky"
              },
              {
                "id": "ns",
                "label": "namespaces",
                "subtitle": "pid · mount · net · ipc",
                "x": 0.2,
                "y": 0.5,
                "accent": "water"
              },
              {
                "id": "cg",
                "label": "cgroups",
                "subtitle": "cpu · mem · io · pids",
                "x": 0.8,
                "y": 0.5,
                "accent": "fire"
              },
              {
                "id": "see",
                "label": "what you SEE",
                "subtitle": "filtered view",
                "x": 0.2,
                "y": 0.9,
                "accent": "amber"
              },
              {
                "id": "use",
                "label": "what you USE",
                "subtitle": "enforced budget",
                "x": 0.8,
                "y": 0.9,
                "accent": "amber"
              }
            ],
            "edges": [
              {
                "from": "proc",
                "to": "ns",
                "kind": "dashed",
                "accent": "water"
              },
              {
                "from": "proc",
                "to": "cg",
                "kind": "dashed",
                "accent": "fire"
              },
              {
                "from": "ns",
                "to": "see",
                "kind": "solid",
                "accent": "water"
              },
              {
                "from": "cg",
                "to": "use",
                "kind": "solid",
                "accent": "fire"
              }
            ]
          },
          {
            "type": "p",
            "text": "This is why Kubernetes can stack **50 containers on one node** without resource theft. Each pod gets its own namespace bundle (isolation of view) plus its own cgroup (isolation of consumption). When pod B starts memory-bombing itself, the OOM killer fires inside pod B's cgroup — pod A never notices."
          }
        ]
      },
      {
        "heading": "Terms worth knowing",
        "body": [
          {
            "type": "terms",
            "items": [
              {
                "term": "rootfs",
                "def": "The filesystem image a mount namespace pivots into — the `/` your container believes is real."
              },
              {
                "term": "pid 1",
                "def": "The init process inside the PID namespace; if it dies, the whole namespace tears down with it."
              },
              {
                "term": "veth pair",
                "def": "A virtual ethernet cable: one end inside the network namespace, the other on a host bridge."
              },
              {
                "term": "OOM killer",
                "def": "Kernel routine that picks a victim and SIGKILLs it when a memory cgroup hits its hard limit."
              },
              {
                "term": "cgroup v2",
                "def": "The unified hierarchy — one tree for all controllers, what every modern distro uses."
              }
            ]
          }
        ]
      },
      {
        "heading": "Watch out for",
        "body": [
          {
            "type": "pros-cons",
            "goodLabel": "Isolation is real",
            "watchLabel": "Isolation is not security",
            "good": [
              "PID, mount, and network namespaces give a strong illusion of a private machine",
              "cgroups give hard, kernel-enforced ceilings on CPU and memory",
              "Both are cheap — no hypervisor, no second kernel, microsecond startup"
            ],
            "watch": [
              "Containers share **one kernel** — a kernel exploit escapes every namespace",
              "Without the **user** namespace, root in the container is root on the host if it breaks out",
              "`/proc/meminfo` and `/proc/cpuinfo` still show **host** values — JVMs sized off them OOM constantly",
              "Forgetting a cgroup limit means one container can starve every other tenant on the box"
            ]
          },
          {
            "type": "p",
            "text": "The mental model is small but load-bearing: **namespaces are a lie about what exists, cgroups are a budget on what you take**. Every container runtime, every Kubernetes pod, every `docker run` flag is some combination of those two ideas. Once you see it, you cannot unsee it."
          },
          {
            "type": "explain-back",
            "prompt": "You've seen **namespaces** (what a process can see), **cgroups** (what a process can take), and the fact that containers share **one host kernel**. Explain how those three combine to make a container, then make the judgment call: is a container a safe boundary to run *untrusted* code on? Defend your answer with the specific failure you're most worried about.",
            "modelAnswer": "A container is just an ordinary host process wearing two costumes: **namespaces** give it a private view — its own PID tree, mount table, and network stack, so it *believes* it's alone on the machine — while a **cgroup** caps the resources it can actually consume, so it can't starve its neighbors of CPU or memory. Compose those and you get the illusion of a private VM at the cost of a normal process: microsecond startup, no second kernel. But that last fact is the catch — all of this is enforced by the **single shared host kernel**. So for untrusted code I'd say a plain container is **not** a safe boundary. Isolation (the illusion) is not the same as security (a real wall). The failure I'd worry about most is a **kernel exploit or container breakout**: one bug in a syscall escapes *every* namespace at once, and if I forgot the **user** namespace, root-in-the-container is root-on-the-host. The trade-off to weigh is isolation strength vs. overhead: if the workload is genuinely untrusted, you pay for a real kernel boundary — gVisor, Firecracker microVMs, or Kata — accepting slower start and some performance loss to stop a single kernel CVE from owning the whole box.",
            "hint": "One of the three is an *illusion* and one is a *budget* — which one is the actual security boundary, and which one do they all secretly share?",
            "commit": {
              "q": "You must run untrusted customer code in a plain container. Which single failure breaks isolation for EVERY container on the box at once?",
              "opts": [
                "One container maxing out its cgroup CPU budget and starving neighbors",
                "A process filling its own private mount namespace with junk files",
                "A kernel exploit in one syscall — every namespace is enforced by the same kernel"
              ],
              "answer": 2,
              "why": "cgroups and namespaces are per-container guardrails, but all of them are enforced by the one shared host kernel — a single kernel bug walks through every boundary at once."
            }
          }
        ]
      }
    ]
  },
  "sd-container-networking": {
    "sections": [
      {
        "heading": "The default bridge — a tiny virtual switch",
        "body": [
          {
            "type": "p",
            "text": "When Docker starts, it creates a Linux bridge called `docker0`. Every container gets a virtual ethernet (veth) pair: one end inside the container's NET namespace as `eth0`, the other end plugged into `docker0`. It's a software switch — exactly like a cheap consumer network switch, but in RAM."
          },
          {
            "type": "p",
            "text": "Containers on the same bridge can talk to each other by IP. They can reach the internet via NAT (the host masquerades their traffic). The outside world can't reach them — until you publish a port."
          }
        ]
      },
      {
        "heading": "Publishing ports — what `-p` actually does",
        "body": [
          {
            "type": "p",
            "text": "`docker run -p 8080:80` installs a DNAT rule in the host's iptables: traffic hitting `host:8080` gets rewritten to `container:80`. It's a port-forward, nothing fancier. Two consequences people miss:"
          },
          {
            "type": "ul",
            "items": [
              "The host port is held by `docker-proxy` (a userspace fallback) plus iptables — you can't bind another process to it.",
              "Traffic from *inside* the container to `host:8080` may NOT loop back. Use `host.docker.internal` or the bridge IP, not localhost."
            ]
          }
        ]
      },
      {
        "heading": "Compose networks — DNS for free",
        "body": [
          {
            "type": "p",
            "text": "When you run `docker compose up`, Compose creates a *user-defined bridge* (not `docker0`), and inside that bridge each service gets a DNS A-record for its service name. That's why `postgres://db:5432` works without anyone editing `/etc/hosts` — there's an embedded DNS server at `127.0.0.11` resolving service names."
          },
          {
            "type": "code",
            "lang": "yaml",
            "text": "services:\n  api:\n    build: .\n    depends_on: [db]\n    environment:\n      DATABASE_URL: postgres://app:app@db:5432/app  # 'db' resolves via Docker DNS\n  db:\n    image: postgres:16"
          },
          {
            "type": "p",
            "text": "User-defined bridges also enable container-to-container traffic without exposing ports on the host. That's the right pattern for a database — the API talks to it, the world never touches it."
          }
        ]
      },
      {
        "heading": "Overlay networks — same model, across hosts",
        "body": [
          {
            "type": "p",
            "text": "Once you have more than one host (Swarm, K8s), a single bridge isn't enough. **Overlay networks** wrap container traffic in VXLAN packets and tunnel them between hosts, so two containers on different machines see each other as if they were on the same LAN."
          },
          {
            "type": "p",
            "text": "K8s uses a slight variant via CNI plugins (Calico, Flannel, Cilium). The interface is the same — pods get IPs, services get DNS — but the implementation under the hood swaps between routing, BGP, eBPF, or VXLAN depending on the plugin."
          }
        ]
      },
      {
        "heading": "Gotchas that will bite you",
        "body": [
          {
            "type": "ul",
            "items": [
              "**MTU mismatch.** VXLAN adds ~50 bytes of header. If the host MTU is 1500 and the overlay MTU isn't lowered, packets over ~1450 bytes silently get dropped or fragmented. Symptom: SSH works, large HTTP responses hang.",
              "**Port already allocated.** `docker0` holds ports — if a host process binds 8080 first, the container publish fails loudly.",
              "**iptables FORWARD policy.** On some hardened hosts (RHEL with custom firewalld rules), `FORWARD` defaults to DROP and containers can't reach the internet. Look for `net.bridge.bridge-nf-call-iptables`.",
              "**IPv6 is off by default.** If you need it, opt in explicitly — most prod K8s clusters still run IPv4-only.",
              "**`--network=host` is a footgun.** It bypasses all isolation, gives the container the host's network stack. Tempting for performance, terrible for security."
            ]
          }
        ]
      },
      {
        "heading": "Security implications",
        "body": [
          {
            "type": "p",
            "text": "By default, every container on the same Docker network can reach every other one. That's fine in dev, dangerous in prod. K8s addresses this with **NetworkPolicy** — east-west firewall rules expressed as YAML, enforced by the CNI plugin. If your cluster's CNI doesn't enforce NetworkPolicy (Flannel's default doesn't), your pods are wide open to each other."
          }
        ]
      },
      {
        "heading": "Key insight",
        "body": [
          {
            "type": "p",
            "text": "Container networking is just three Linux building blocks — veth pairs, bridges, and iptables — composed in standard ways. K8s overlays add VXLAN encapsulation and an embedded DNS, but the mental model is unchanged. When something doesn't work, drop a `tcpdump` on the bridge and watch the packets; the abstraction is paper-thin."
          },
          {
            "type": "explain-back",
            "prompt": "Trace a packet from a container on host A to a container on host B in a Kubernetes cluster, naming each piece you've learned — **veth pair**, **bridge**, **iptables/port publish**, **embedded DNS**, and the **VXLAN overlay**. Then make a call: where would you enforce that the two containers are *allowed* to talk at all, and what's the trade-off of enforcing it there?",
            "modelAnswer": "The sending container has a **veth pair**: one end inside its network namespace, the other plugged into a **bridge** on host A. It resolves the destination by name through the cluster's **embedded DNS**, which hands back a pod (or Service) IP. The packet leaves the bridge and, because the destination lives on host B, the CNI wraps it in a **VXLAN overlay** — encapsulating the original frame inside a UDP packet addressed to host B's real NIC. Host B de-encapsulates it, **iptables** rules (the same machinery `-p` uses to publish a port) DNAT it to the right pod, and it pops out of the veth into the destination container. On the *whether they're allowed* question: by default every pod can reach every other pod, which is fine in dev and dangerous in prod, so I'd enforce it with a **NetworkPolicy** — an east-west firewall expressed as YAML and applied by the CNI right at the veth/bridge layer, closest to the workload. The trade-off is that NetworkPolicy is **only as real as the CNI behind it**: a plugin that ignores it (Flannel's default) leaves you with rules that look enforced but aren't, so the security choice is really a CNI choice (Calico/Cilium), and you pay for it in operational complexity.",
            "hint": "Same-host traffic never leaves the bridge; cross-host traffic is the *only* reason the VXLAN overlay exists. For the policy question, ask which layer sits closest to the pod — and whether the thing enforcing it actually honors the rule.",
            "commit": {
              "q": "Two pods sit on *different* hosts in the cluster. Which piece of the path exists purely to make that cross-host hop work?",
              "opts": [
                "The VXLAN overlay wrapping the frame in a UDP packet aimed at the other host's NIC",
                "The veth pair connecting each pod to its bridge",
                "The embedded DNS that resolves the service name to an IP"
              ],
              "answer": 0,
              "why": "veth pairs and DNS are in play even when both pods share a host — same-host traffic never leaves the bridge. Encapsulation only earns its keep when the packet has to cross machines."
            }
          }
        ]
      }
    ]
  },
  "sd-loadbalancers-k8s": {
    "sections": [
      {
        "heading": "Same pattern, different layer",
        "body": [
          {
            "type": "p",
            "text": "A **load balancer** is a stable virtual IP fronting a pool of identical servers. Clients hit one address; traffic spreads across N backends. The pattern is older than Kubernetes — what changed is *where* the LB lives and *who* programs it."
          },
          {
            "type": "p",
            "text": "In K8s, you don't run HAProxy by hand. You declare a **Service** object, and the cluster wires up the dataplane for you. Same load-balancing problem, just pushed into the control plane. The interesting part is that K8s gives you **four flavors** of Service, and picking the wrong one wastes either money or a weekend."
          }
        ]
      },
      {
        "heading": "The four Service types",
        "body": [
          {
            "type": "table",
            "headers": [
              "Type",
              "Where it lives",
              "Use when (cost)"
            ],
            "rows": [
              [
                "ClusterIP",
                "Internal virtual IP",
                "Pod → pod inside (free)"
              ],
              [
                "NodePort",
                "Port 30000-32767 on every node",
                "Dev, bare-metal (free, ugly)"
              ],
              [
                "LoadBalancer",
                "Provisions a cloud LB",
                "Prod north-south ($$ per svc)"
              ],
              [
                "Ingress",
                "L7 HTTP router fronting Services",
                "Multi-host, one LB bill ($ shared)"
              ]
            ]
          },
          {
            "type": "p",
            "text": "**ClusterIP** is the default and the one you use 90% of the time — service-to-service inside the cluster. **NodePort** exposes a high port on every node; fine for kicking the tires, awful for production because you're advertising node IPs to the world."
          },
          {
            "type": "p",
            "text": "**LoadBalancer** is the \"real\" external option, but each Service spawns its own cloud LB — that's a separate ELB, separate bill, separate DNS record. For 20 microservices you do not want 20 ELBs. That's what **Ingress** solves: one cloud LB, one IP, L7 routing rules fanning out to many Services."
          }
        ]
      },
      {
        "heading": "What it looks like in YAML",
        "body": [
          {
            "type": "code",
            "lang": "yaml",
            "text": "apiVersion: v1\nkind: Service\nmetadata:\n  name: api  # DNS becomes api.default.svc.cluster.local\nspec:\n  type: ClusterIP  # default — internal only\n  selector:\n    app: api  # picks pods by label, not by name\n  ports:\n    - port: 80  # the Service port clients call\n      targetPort: 8080  # the container port traffic lands on\n---\napiVersion: networking.k8s.io/v1\nkind: Ingress\nmetadata:\n  name: edge\nspec:\n  rules:\n    - host: api.example.com  # L7 routing — needs Host header to match\n      http:\n        paths:\n          - path: /v1  # path-based fanout to different Services\n            pathType: Prefix\n            backend:\n              service:\n                name: api  # routes to the ClusterIP Service above\n                port: { number: 80 }"
          },
          {
            "type": "p",
            "text": "Notice the Ingress backend points at a **ClusterIP** Service. Ingress doesn't replace Services — it *fronts* them. The cloud LB terminates TLS, parses the Host header, and forwards to the right internal VIP."
          }
        ]
      },
      {
        "heading": "Who actually moves the packets",
        "body": [
          {
            "type": "diagram",
            "title": "Service request path",
            "height": 280,
            "nodes": [
              {
                "id": "client",
                "label": "Client",
                "subtitle": "curl",
                "x": 0.3,
                "y": 0.12,
                "accent": "water"
              },
              {
                "id": "elb",
                "label": "Cloud LB",
                "subtitle": "ELB / GLB",
                "x": 0.7,
                "y": 0.12,
                "accent": "amber"
              },
              {
                "id": "ingress",
                "label": "Ingress controller",
                "subtitle": "nginx pod",
                "x": 0.3,
                "y": 0.5,
                "accent": "sky"
              },
              {
                "id": "svc",
                "label": "ClusterIP VIP",
                "subtitle": "kube-proxy",
                "x": 0.7,
                "y": 0.5,
                "accent": "earth"
              },
              {
                "id": "p1",
                "label": "Pod A",
                "subtitle": "10.0.1.4",
                "x": 0.3,
                "y": 0.85,
                "accent": "fire"
              },
              {
                "id": "p2",
                "label": "Pod B",
                "subtitle": "10.0.2.7",
                "x": 0.7,
                "y": 0.85,
                "accent": "fire"
              }
            ],
            "edges": [
              {
                "from": "client",
                "to": "elb",
                "kind": "dashed",
                "accent": "water",
                "label": "TLS"
              },
              {
                "from": "elb",
                "to": "ingress",
                "kind": "dashed",
                "accent": "amber",
                "label": "L7 routing"
              },
              {
                "from": "ingress",
                "to": "svc",
                "kind": "dashed",
                "accent": "sky"
              },
              {
                "from": "svc",
                "to": "p1",
                "kind": "dashed",
                "accent": "earth",
                "label": "round-robin"
              },
              {
                "from": "svc",
                "to": "p2",
                "kind": "dashed",
                "accent": "earth"
              }
            ]
          },
          {
            "type": "p",
            "text": "The ClusterIP is a *fiction* — no process listens on it. **kube-proxy** runs on every node and programs **iptables**, **IPVS**, or **eBPF** rules that DNAT packets from the VIP to a real pod IP. That's why it's L4: kube-proxy sees TCP/UDP, not HTTP."
          },
          {
            "type": "p",
            "text": "Anything **L7** — host headers, path routing, TLS termination, header-based canaries — needs a real proxy in the path. That's the Ingress controller (nginx, Traefik, Envoy) or a **service mesh** sidecar (Istio, Linkerd). The cloud LB itself is dumb pipe at that point."
          }
        ]
      },
      {
        "heading": "Ingress vs Service mesh",
        "body": [
          {
            "type": "pros-cons",
            "goodLabel": "Ingress is enough when",
            "watchLabel": "Reach for a mesh when",
            "good": [
              "You only need north-south routing (outside → cluster).",
              "TLS termination and host/path rules cover your use case.",
              "You want one cloud LB bill, not twenty.",
              "Your team is small and observability via logs is fine."
            ],
            "watch": [
              "You need east-west mTLS between every pod.",
              "You want retries, timeouts, circuit-breakers without app code.",
              "Traffic shifting (10% canary, header-based routing) is core to your release flow.",
              "Per-hop latency tracing across 30 services is a daily need."
            ]
          }
        ]
      },
      {
        "heading": "Watch out for",
        "body": [
          {
            "type": "terms",
            "items": [
              {
                "term": "One LoadBalancer per Service",
                "def": "Each `type: LoadBalancer` provisions a separate cloud LB — a $20/mo surprise that scales linearly with services. Consolidate behind an Ingress."
              },
              {
                "term": "NodePort in production",
                "def": "It works, but you're exposing node IPs and a random high port. Firewall churn and no TLS make this a footgun."
              },
              {
                "term": "Session affinity assumptions",
                "def": "Default is L4 round-robin — no stickiness. If your app stores session state in memory, set `sessionAffinity: ClientIP` or move state to Redis."
              },
              {
                "term": "Long-lived connections",
                "def": "iptables only balances at *connect time*. A gRPC client opens one TCP stream and pins to one pod forever. Use a mesh or client-side LB for gRPC."
              },
              {
                "term": "Readiness probes",
                "def": "kube-proxy only routes to pods marked Ready. A broken probe silently drains traffic — check Endpoints, not just Pod status, when debugging."
              }
            ]
          },
          {
            "type": "quote",
            "text": "Kubernetes didn't invent load balancing — it just made the LB a YAML file.",
            "cite": "every SRE who has paid for 40 ELBs"
          }
        ]
      }
    ]
  },
  "sd-blue-green-canary": {
    "sections": [
      {
        "heading": "Why deploys are dangerous",
        "body": [
          {
            "type": "p",
            "text": "Every deploy ships unproven code into a system serving real users. The old joke — *'works on my machine'* — exists because production has data, traffic, and combinations of state that staging never hits. Safe-deploy strategies are about *limiting blast radius* when (not if) the new version misbehaves."
          },
          {
            "type": "p",
            "text": "Two patterns dominate: **blue-green** (instant cutover between two full environments) and **canary** (gradual ramp from old to new). They solve the same problem from opposite ends."
          }
        ]
      },
      {
        "heading": "Blue-green — two full environments, atomic switch",
        "body": [
          {
            "type": "p",
            "text": "Run two identical production environments: blue (live) and green (idle). Deploy to green, run smoke tests against it, then flip the router/LB so 100% of traffic goes green instantly. Blue is now your one-button rollback."
          },
          {
            "type": "ul",
            "items": [
              "**Pros:** instant cutover, instant rollback, zero traffic mixing, simple mental model.",
              "**Cons:** you pay for 2× the infrastructure during the deploy window, schema migrations are tricky (both versions must read/write the same DB), and a buggy version sees 100% of traffic the moment you flip."
            ]
          },
          {
            "type": "p",
            "text": "Best for: small fleets, monoliths, anything where partial rollouts are messy (mobile API where you can't have two API versions at once)."
          }
        ]
      },
      {
        "heading": "Canary — slow ramp with observation",
        "body": [
          {
            "type": "p",
            "text": "Send 1% of traffic to the new version. Watch metrics — error rate, latency p99, business KPIs. If healthy after a few minutes, ramp to 5%, 25%, 50%, 100%. If sick, route back to 0% and rollback. The whole rollout is automated and metric-driven."
          },
          {
            "type": "ul",
            "items": [
              "**Pros:** bad code hits 1% of users, not 100%. Real production data, real production traffic, real signal. Catches issues staging never could.",
              "**Cons:** during the rollout you have *two* versions serving traffic simultaneously — your DB must tolerate both, your monitoring must compare cohorts, your debugging gets harder ('which version was that error from?')."
            ]
          },
          {
            "type": "p",
            "text": "Best for: high-traffic services with strong observability, large fleets, anything where 1% of traffic still yields statistically meaningful signal in minutes."
          }
        ]
      },
      {
        "heading": "Tooling",
        "body": [
          {
            "type": "ul",
            "items": [
              "**Argo Rollouts** — K8s-native canary controller. Replaces the standard Deployment with a Rollout resource that does weighted traffic split via a service mesh or Ingress.",
              "**Flagger** — similar role, integrates with Istio, Linkerd, NGINX, and Prometheus to auto-pause based on metrics.",
              "**Feature flags (LaunchDarkly, Unleash, OpenFeature)** — orthogonal layer. Lets you ship code dark, then enable per-user/per-cohort. Combine with canary for double safety.",
              "**Spinnaker** — older but still strong; pioneered blue-green pipelines at Netflix."
            ]
          }
        ]
      },
      {
        "heading": "When to pick which",
        "body": [
          {
            "type": "p",
            "text": "Start with blue-green. It's simpler, easier to reason about, and the rollback story is bulletproof. Switch to canary when (a) your fleet is too big to duplicate, (b) you have enough observability to detect issues at 1%, or (c) the cost of a bad full-fleet deploy is unacceptable."
          },
          {
            "type": "p",
            "text": "Many shops do both: canary for normal feature deploys, blue-green for risky infra changes (new runtime version, new DB migration)."
          }
        ]
      },
      {
        "heading": "Key insight",
        "body": [
          {
            "type": "p",
            "text": "Neither strategy *prevents* bugs. They both *limit blast radius* and *make rollback fast*. The deploy strategy is half the story — the other half is the observability that tells you something's wrong before users tweet about it. Without good metrics, canary is just a slow blue-green."
          }
        ]
      }
    ]
  },
  "sd-idempotency-deploys": {
    "sections": [
      {
        "heading": "Idempotency — running twice equals running once",
        "body": [
          {
            "type": "p",
            "text": "An operation is **idempotent** if applying it N times has the same observable effect as applying it once. `x = 5` is idempotent. `x += 1` is not. The math sense is the same as the engineering one — and once you internalize it, half of distributed systems gets simpler."
          },
          {
            "type": "p",
            "text": "Three places it matters in practice:"
          },
          {
            "type": "ul",
            "items": [
              "**HTTP** — `GET`, `PUT`, `DELETE` are idempotent by spec; `POST` is not. That's why browsers warn before resubmitting a POST and why retries on PUT are safe.",
              "**Databases** — `UPDATE x SET status='paid' WHERE id=42` is idempotent; `UPDATE x SET count=count+1` is not.",
              "**Deploys & infra** — applying the same Terraform/Helm/Ansible manifest twice should converge to the same state, not double-create resources."
            ]
          }
        ]
      },
      {
        "heading": "Why CI must be safely re-runnable",
        "body": [
          {
            "type": "p",
            "text": "Every CI pipeline gets retried — flaky tests, network blips, runner restarts. If your `deploy` job allocates a new load balancer every time it runs, three retries = three orphan LBs and an angry cloud bill. Pipelines have to be designed so a retry is *boring*."
          },
          {
            "type": "p",
            "text": "Concretely: name resources deterministically (not random suffixes), use upserts (`CREATE IF NOT EXISTS`), check existence before creating, and store state somewhere durable so the second run can pick up the first run's work."
          }
        ]
      },
      {
        "heading": "Declarative IaC is idempotency made visible",
        "body": [
          {
            "type": "p",
            "text": "**Terraform** is the canonical example. You declare desired state (`5 EC2 instances of type m5.large`). Terraform diffs that against current state and applies only the delta. Running `terraform apply` twice in a row with no changes? Second run does nothing. That's idempotency baked into the tool."
          },
          {
            "type": "code",
            "lang": "hcl",
            "text": "resource \"aws_instance\" \"api\" {\n  count         = 5\n  ami           = \"ami-0c55b\"\n  instance_type = \"m5.large\"\n  tags = { Name = \"api\" }\n}\n# Run apply 100 times. You still have exactly 5 instances.\n# Change count to 7, run apply. Terraform creates exactly 2 more."
          },
          {
            "type": "p",
            "text": "**Kubernetes controllers** take the same model further. You write a Deployment manifest saying 'I want 3 pods of image v2'. The controller loops forever, comparing actual to desired, and converges. Re-applying the same manifest is a no-op. Editing it triggers a reconciliation. The system is *eventually consistent with your declaration*."
          }
        ]
      },
      {
        "heading": "Idempotency keys — Stripe's pattern",
        "body": [
          {
            "type": "p",
            "text": "Some operations are intrinsically non-idempotent — charging a credit card, sending an email, posting to a queue. Retrying naively risks double-charging. The fix: the **idempotency key**."
          },
          {
            "type": "p",
            "text": "Client generates a UUID per logical operation. Server stores `(idempotency_key → result)` for ~24 hours. First request executes; subsequent requests with the same key return the cached result without re-executing. Stripe popularized this for charges:"
          },
          {
            "type": "code",
            "lang": "bash",
            "text": "curl https://api.stripe.com/v1/charges \\\n  -H 'Idempotency-Key: 7d8f1e2c-...-charge-42' \\\n  -d amount=2000 -d currency=usd -d source=tok_visa\n# Retry-safe: network blip? Re-send the same key, get the same charge,\n# no double-billing."
          },
          {
            "type": "p",
            "text": "The pattern works in your own services too. Any 'do a side effect' endpoint should accept an idempotency key. The cost is one DB row per request and one extra index lookup; the payoff is bullet-proof retries."
          }
        ]
      },
      {
        "heading": "Best practice",
        "body": [
          {
            "type": "p",
            "text": "Design every deploy step, every API write, and every cron job so that running it twice is indistinguishable from running it once. Use declarative tools where you can. Use idempotency keys where you can't. Treat 'this script can only be run once' as a code smell, not a constraint — because in a distributed system, anything that *can* run twice eventually *will*."
          },
          {
            "type": "explain-back",
            "prompt": "In your own words: explain idempotency to a teammate, and why it changes how you design deploy pipelines.",
            "modelAnswer": "An operation is **idempotent** if applying it N times has the same observable effect as applying it once — like `UPDATE x SET status='paid'` vs the non-idempotent `count = count + 1`. You care about this in deploys because every CI job *will* be retried (flaky tests, runner restarts, manual reruns), so any step that allocates resources or sends side effects on each run will silently double-create or double-charge. The design move is to lean on declarative tools (Terraform, Kubernetes) that diff desired vs actual state, and to attach **idempotency keys** to anything that's intrinsically non-idempotent — charges, emails, queue posts. Once your steps are safely re-runnable, retries become boring instead of dangerous.",
            "hint": "Walk through what happens when a CI job that creates a load balancer gets retried three times — first without idempotency, then with.",
            "commit": {
              "q": "A CI deploy step that creates a load balancer gets retried 3 times after runner flakes. With a naive (non-idempotent) script, what do you end up with?",
              "opts": [
                "One load balancer — the cloud API deduplicates identical create requests",
                "Three load balancers — each retry re-executes the side effect with no memory of the last run",
                "Zero load balancers — the failed runs roll back the earlier creates"
              ],
              "answer": 1,
              "why": "Nothing in a naive create call checks whether the resource already exists, and cloud APIs don't dedupe for you. Every rerun allocates fresh — that's the failure idempotent design exists to prevent."
            }
          }
        ]
      }
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────
  // ML curriculum (Google-based canonical) — full bodies for first-of-section
  // lessons; remaining entries are short stubs with stable IDs so progress
  // tracking and roadmap navigation work today.
  // ─────────────────────────────────────────────────────────────────────────

  // ─── ML FUNDAMENTALS (mlops) ──────────────────────────────────────────────
  "agile-continuous": {
    "sections": [
      {
        "heading": "The premise",
        "body": [
          { "type": "p", "text": "Agile says 'ship working software in small increments'. DevOps asks the obvious follow-up: **how, when each ship of code takes a week of manual deploy?** The answer is to automate everything between 'commit pushed' and 'value in production' until shipping is a non-event. That umbrella is called *continuous everything*." }
        ]
      },
      {
        "heading": "The continuous stack",
        "body": [
          { "type": "ul", "items": [
            "**Continuous Integration** — every commit runs the full test suite on a clean build. Bad commits surface in minutes, not weeks.",
            "**Continuous Delivery** — every green main commit produces a deployable artifact (a container, a binary). One button or one merge ships it.",
            "**Continuous Deployment** — drop the button. Every green commit goes to production automatically.",
            "**Continuous Testing** — tests run at every layer (unit, contract, integration, e2e, synthetic prod).",
            "**Continuous Monitoring** — production tells you when something broke, before users do."
          ]}
        ]
      },
      {
        "heading": "What it requires",
        "body": [
          { "type": "p", "text": "You can't continuously deliver if the build is flaky, the tests are slow, or the deploy is manual. The investment is paid up front, in test infrastructure and pipeline hygiene; the payoff is small, safe, frequent releases instead of quarterly heart attacks." }
        ]
      },
      {
        "heading": "Why teams stall",
        "body": [
          { "type": "ul", "items": [
            "**Long-lived branches** — by the time you merge, the integration is huge and risky.",
            "**Slow tests** — devs stop running them locally, then start ignoring CI failures.",
            "**Manual approval gates** — well-meaning, but they're where deploys go to die.",
            "**No safe rollback** — if reverting is scary, deploys will be too."
          ]}
        ]
      },
      {
        "heading": "Bottom line",
        "body": [
          { "type": "p", "text": "Continuous Delivery is what makes Agile *real* outside the standup. Otherwise you have rapid planning followed by quarterly releases — Agile theater on top of waterfall plumbing." }
        ]
      }
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────
  // STUBS — remaining new lessons. IDs and titles are stable; full bodies
  // are queued for a content-authoring pass.
  // ─────────────────────────────────────────────────────────────────────────

  // ML (mlops) stubs
  "agile-trunk-based": {
    "sections": [
      {
        "heading": "What it is",
        "body": [
          {
            "type": "p",
            "text": "**Trunk-based development** is a branching model where every engineer commits to a single shared branch (usually `main`) at least daily. Long-lived feature branches are banned. Short-lived branches are fine, but they live hours — not weeks."
          },
          {
            "type": "p",
            "text": "The trunk must stay **always releasable**. That promise is what makes continuous delivery possible. If `main` is green, you can ship at any moment."
          }
        ]
      },
      {
        "heading": "How teams actually do it",
        "body": [
          {
            "type": "p",
            "text": "You don't merge giant PRs. You slice work into **small, vertical increments** — each one a complete, tested, reversible change. Most land within a day."
          },
          {
            "type": "p",
            "text": "Unfinished work hides behind **feature flags**. The code ships dark; the flag flips it on for staff, then 1%, then everyone. Decoupling deploy from release is the whole trick."
          },
          {
            "type": "ul",
            "items": [
              "**Pull straight from trunk**, never from a stale branch",
              "**Short-lived branches** (< 24h) with mandatory CI gates",
              "**Pair or mob review** so PRs merge in minutes, not days",
              "**Feature flags** for anything not finished or not ready",
              "**Expand/contract migrations** for schema or API changes"
            ]
          }
        ]
      },
      {
        "heading": "A typical day on trunk",
        "body": [
          {
            "type": "code",
            "lang": "bash",
            "text": "git switch main && git pull --rebase\ngit switch -c add-retry-budget\n# ... 2 hours of work, behind flag RETRY_BUDGET_V2 ...\ngit rebase main\ngit push -u origin add-retry-budget\ngh pr create --fill --reviewer @oncall\n# CI green + 1 review -> squash merge\ngh pr merge --squash --delete-branch"
          }
        ]
      },
      {
        "heading": "Why it matters",
        "body": [
          {
            "type": "p",
            "text": "Long branches **rot**. Every day apart from trunk, your diff drifts further from production reality, and the eventual merge becomes a high-risk archaeology project. Trunk-based development collapses that integration cost to near zero."
          },
          {
            "type": "p",
            "text": "It also unlocks the **DORA elite metrics**: deploy frequency goes up, lead time drops, change-failure rate falls because batches are tiny. Small reversible changes are the cheapest form of risk management you have."
          }
        ]
      },
      {
        "heading": "Watch out for",
        "body": [
          {
            "type": "ul",
            "items": [
              "**Weak CI** — trunk-based is suicidal without fast, reliable tests gating every merge",
              "**Flag debt** — kill flags within weeks of full rollout or you'll drown in dead branches in code",
              "**Reviewer bottlenecks** — if PRs sit overnight, you're back to long-lived branches in disguise",
              "**Big-bang refactors** — use expand/contract or strangler patterns, never a 2-week refactor branch",
              "**Untested rollback paths** — \"always releasable\" includes the ability to ship the *previous* commit in a hurry"
            ]
          }
        ]
      }
    ]
  },

  // ─── SD insights (workflow-generated) ────────────────────────────────────
  "cloud-storage": {
    "sections": [
      {
        "heading": "Three shapes, three jobs",
        "body": [
          {
            "type": "p",
            "text": "**Cloud storage isn't one product — it's three.** Object stores hold blobs you address by name. Block stores hand you a raw disk you attach to one VM. File stores expose a shared filesystem you mount from many. Each has its own latency, atomicity, and cost shape. Pick the wrong one and you'll pay for it in either dollars or 3am pages."
          },
          {
            "type": "p",
            "text": "The temptation is *'just put everything in S3'* — and for a while it works. Then you hit the listing-cost wall, the consistency wall, or the latency wall. This lesson is the map of when each shape actually fits."
          },
          {
            "type": "diagram",
            "title": "The three storage shapes",
            "height": 220,
            "nodes": [
              { "id": "obj",   "label": "object", "subtitle": "S3+GCS",    "accent": "earth", "x": 0.18, "y": 0.5 },
              { "id": "blk",   "label": "block",  "subtitle": "EBS+DISK",  "accent": "earth", "x": 0.5,  "y": 0.5 },
              { "id": "file",  "label": "file",   "subtitle": "EFS+NFS",   "accent": "earth", "x": 0.82, "y": 0.5 }
            ],
            "edges": []
          }
        ]
      },
      {
        "heading": "Object storage — the blob bucket",
        "body": [
          {
            "type": "p",
            "text": "**Objects** are immutable blobs identified by a key. You PUT, GET, DELETE — that's it. No partial writes, no in-place edits. The win: limitless capacity, dirt-cheap per GB, durable to 11 nines, and accessible over plain HTTPS from anywhere."
          },
          {
            "type": "p",
            "text": "The catch: every request costs money. Listing a bucket with a million objects costs more than storing it for a month. Latency is tens to hundreds of milliseconds — fine for downloads, brutal for hot paths. And until 2020, S3 was eventually consistent — assume your code still hits that mental model even though it no longer should."
          },
          {
            "type": "code",
            "lang": "bash",
            "text": "aws s3 cp ./build.tar.gz s3://my-bucket/releases/  # PUT — atomic, content-addressed\naws s3 ls s3://my-bucket/releases/  # listing — costs per 1k objects, paginated\naws s3 cp s3://my-bucket/releases/build.tar.gz -  # GET to stdout, no copy on disk\n\n# Lifecycle rule — auto-tier to glacier after 30d:\naws s3api put-bucket-lifecycle-configuration --bucket my-bucket \\  # one-time setup\n  --lifecycle-configuration file://lifecycle.json  # rules apply forever after"
          }
        ]
      },
      {
        "heading": "Block and file — the VM-attached worlds",
        "body": [
          {
            "type": "p",
            "text": "**Block storage** is a virtual disk. You attach it to one VM, mkfs it, and treat it like a local SSD. Single-digit-ms latency, full filesystem semantics, but exactly one writer at a time. This is where your database lives."
          },
          {
            "type": "p",
            "text": "**File storage** is NFS-as-a-service. Mount it from a hundred VMs at once and they share a POSIX tree. Slower than block, costlier than object, but the only shape that lets a fleet of containers share a working directory without you writing a sync daemon."
          },
          {
            "type": "table",
            "headers": ["Shape", "AWS", "GCP", "Azure"],
            "rows": [
              ["Object", "`S3`", "`GCS`", "`Blob Storage`"],
              ["Block",  "`EBS`", "`Persistent Disk`", "`Managed Disk`"],
              ["File",   "`EFS`", "`Filestore`", "`Files`"]
            ]
          },
          {
            "type": "pros-cons",
            "goodLabel": "GOOD FOR",
            "watchLabel": "WATCH OUT FOR",
            "good": [
              "Object — static assets, backups, ML datasets, log archives",
              "Block — databases, root volumes, anything with random IO",
              "File — shared scratch, lift-and-shift legacy apps, ML training shards"
            ],
            "watch": [
              "Object listing cost — `aws s3 ls` on huge buckets bills per 1k LIST",
              "Block can't be shared — detach + reattach to move it (downtime)",
              "File egress + IOPS add up fast — cheaper-looking than it ends up",
              "Never store secrets in object metadata — it leaks via CloudFront"
            ]
          }
        ]
      },
      {
        "heading": "Try it",
        "body": [
          {
            "type": "p",
            "text": "**Lifecycle rules** are the single biggest cost lever on object storage. Write one that tiers objects to cheaper classes as they age."
          },
          {
            "type": "practice",
            "lang": "yaml",
            "prompt": "Write an S3 lifecycle rule that moves objects to Glacier after 30 days and deletes them after 365.",
            "starter": "Rules:\n  - ID: archive-old\n    Status: Enabled\n    Filter:\n      Prefix: logs/\n    Transitions:\n      - Days: 30\n        StorageClass: GLACIER  # cold tier, retrieval delay\n    Expiration:\n      Days: 365  # hard delete, no recovery\n",
            "hint": "Glacier retrieval is minutes-to-hours — never put hot data there. Test with a one-day filter on a non-prod bucket first."
          },
          {
            "type": "quote",
            "text": "Everything in S3 works until it doesn't. The wall is always listing cost, atomicity, or latency — in that order.",
            "cite": "the only object-storage rule you need"
          }
        ]
      }
    ]
  },
  "cloud-databases": {
    "sections": [
      {
        "heading": "Why managed",
        "body": [
          {
            "type": "p",
            "text": "**A managed database is a trade.** You hand over backups, patching, failover, and on-call to the cloud provider. In return you pay a 30–60% premium, accept a version lag of months to years, and lose some knobs the open-source product exposes."
          },
          {
            "type": "p",
            "text": "The trade is almost always worth it for a startup or small team. The night you would have spent paging on a corrupted WAL is the night the managed service quietly failed over and you slept through. The trade gets worse at scale — at petabyte sizes self-hosting starts to win on dollars again."
          }
        ]
      },
      {
        "heading": "The provider menu",
        "body": [
          {
            "type": "p",
            "text": "Every cloud sells the same shapes under different names. Knowing the mapping lets you read any architecture doc fluently."
          },
          {
            "type": "table",
            "headers": ["Shape", "AWS", "GCP", "Azure"],
            "rows": [
              ["OLTP relational", "`RDS` / `Aurora`", "`Cloud SQL` / `AlloyDB`", "`Azure SQL`"],
              ["NoSQL document",  "`DynamoDB`", "`Firestore`", "`Cosmos DB`"],
              ["Warehouse / OLAP", "`Redshift`", "`BigQuery`", "`Synapse`"],
              ["In-memory cache", "`ElastiCache`", "`Memorystore`", "`Cache for Redis`"]
            ]
          },
          {
            "type": "diagram",
            "title": "Managed vs self-hosted decision",
            "height": 220,
            "nodes": [
              { "id": "load",  "label": "load",     "subtitle": "QPS · TB", "accent": "fire",  "x": 0.1,  "y": 0.5 },
              { "id": "mgd",   "label": "managed",  "subtitle": "RDS · CLOUD SQL", "accent": "amber", "x": 0.5,  "y": 0.3 },
              { "id": "self",  "label": "self-host","subtitle": "VM · K8S OPERATOR", "accent": "earth", "x": 0.5,  "y": 0.75 },
              { "id": "prod",  "label": "prod",     "subtitle": "SLA · BACKUPS",   "accent": "sky",   "x": 0.88, "y": 0.5 }
            ],
            "edges": [
              { "from": "load", "to": "mgd",  "kind": "dashed", "label": "≤ 1TB" },
              { "from": "load", "to": "self", "kind": "dashed", "label": "≥ 10TB" },
              { "from": "mgd",  "to": "prod", "kind": "dashed", "label": "easy" },
              { "from": "self", "to": "prod", "kind": "dashed", "label": "hard" }
            ]
          }
        ]
      },
      {
        "heading": "What you give up",
        "body": [
          {
            "type": "p",
            "text": "**The three taxes:** cost, lock-in, and version lag. Aurora is 20% more than RDS Postgres for the same compute. DynamoDB has no off-ramp short of a full rewrite. Cloud SQL is usually six months behind upstream Postgres on minor versions and over a year behind on majors."
          },
          {
            "type": "pros-cons",
            "goodLabel": "GOOD FOR",
            "watchLabel": "WATCH OUT FOR",
            "good": [
              "Teams under 50 engineers — DBA salary > managed premium",
              "Workloads under 5TB — perf overhead invisible",
              "Multi-AZ HA — pay the bill, sleep at night",
              "Read replicas in 3 clicks — no replication setup pain"
            ],
            "watch": [
              "Version lag — Postgres 17 features land 12+ months late",
              "No superuser — can't install custom extensions or `pg_repack`",
              "Per-IOPS pricing on Aurora — bills explode under bulk loads",
              "Egress fees on cross-region replicas — read the data-transfer page"
            ]
          },
          {
            "type": "code",
            "lang": "sql",
            "text": "-- Check your managed Postgres version vs upstream:\nSHOW server_version;  -- often N major versions behind upstream\n\n-- Connection-count ceilings are tight on managed:\nSELECT count(*) FROM pg_stat_activity;  -- watch this vs max_connections\nSHOW max_connections;  -- managed defaults are conservative — use a pooler\n\n-- Slow-query log lives in the cloud console, not the filesystem:\nSELECT query, calls, mean_exec_time   -- pg_stat_statements must be enabled\nFROM pg_stat_statements\nORDER BY mean_exec_time DESC\nLIMIT 10;  -- hot queries — fix these before scaling up the instance"
          },
          {
            "type": "quote",
            "text": "Managed databases are a tax you pay in dollars to avoid a tax you'd pay in sleep.",
            "cite": "the one-line case for RDS"
          }
        ]
      }
    ]
  },
  "cloud-serverless": {
    "sections": [
      {
        "heading": "Two flavors of serverless",
        "body": [
          {
            "type": "p",
            "text": "**'Serverless' isn't one thing.** It splits into event-driven *functions* (Lambda, Cloud Functions, Azure Functions) that wake on a trigger and die in seconds, and long-lived *containers* (Fargate, Cloud Run, Container Apps) that scale from zero to many but stick around for a request lifetime. Same scale-to-zero promise; different operational models."
          },
          {
            "type": "p",
            "text": "The shared appeal: no servers to patch, no autoscaler to tune, you pay only for time the code actually ran. The shared catches: cold starts, concurrency limits, runtime ceilings, and a billing model that punishes the chatty."
          },
          {
            "type": "diagram",
            "title": "Functions vs containers",
            "height": 240,
            "nodes": [
              { "id": "evt",   "label": "event",     "subtitle": "S3 · QUEUE · HTTP", "accent": "water", "x": 0.1,  "y": 0.5 },
              { "id": "fn",    "label": "function",  "subtitle": "≤ 15 MIN · COLD START", "accent": "fire", "x": 0.45, "y": 0.25 },
              { "id": "ctr",   "label": "container", "subtitle": "WARM · LONG-LIVED",  "accent": "fire", "x": 0.45, "y": 0.75 },
              { "id": "sink",  "label": "downstream","subtitle": "DB · API · S3",       "accent": "earth", "x": 0.85, "y": 0.5 }
            ],
            "edges": [
              { "from": "evt", "to": "fn",   "kind": "dashed", "label": "per event" },
              { "from": "evt", "to": "ctr",  "kind": "dashed", "label": "per request" },
              { "from": "fn",  "to": "sink", "kind": "dashed", "label": "write" },
              { "from": "ctr", "to": "sink", "kind": "dashed", "label": "write" }
            ]
          }
        ]
      },
      {
        "heading": "The ceilings nobody mentions",
        "body": [
          {
            "type": "p",
            "text": "**Every serverless platform has hard limits** you only learn about when you hit them. Memorize the ones for your platform before you commit a workload. The 15-minute Lambda ceiling has killed more 'just use a function' migrations than cold starts ever did."
          },
          {
            "type": "table",
            "headers": ["Limit", "Lambda", "Cloud Run", "Fargate"],
            "rows": [
              ["Max duration",  "15 min",  "60 min",  "no limit"],
              ["Max memory",    "10 GB",   "32 GB",   "120 GB"],
              ["Cold start",    "100ms–2s", "200ms–1s", "10–30s"],
              ["Scale-to-zero", "yes",     "yes",     "no (min 1)"]
            ]
          },
          {
            "type": "pros-cons",
            "goodLabel": "GOOD FOR",
            "watchLabel": "WATCH OUT FOR",
            "good": [
              "Spiky / unpredictable traffic — scale 0 → 1000 in seconds",
              "Glue code between cloud services — S3 → SQS → Lambda → DDB",
              "Cron jobs you don't want to babysit a VM for",
              "MVP backends — zero ops until you outgrow it"
            ],
            "watch": [
              "Cold starts on user-facing latency paths — pin concurrency or warm up",
              "Per-invoke billing — a chatty service costs 5x a VM at scale",
              "VPC-attached functions add ENI cold-start time",
              "15-min ceiling kills batch jobs — use Fargate / Batch instead"
            ]
          }
        ]
      },
      {
        "heading": "A real Lambda",
        "body": [
          {
            "type": "p",
            "text": "**Concurrency** is the lever you tune for both cost and latency. Reserved concurrency caps blast radius; provisioned concurrency eliminates cold starts at a price."
          },
          {
            "type": "code",
            "lang": "yaml",
            "text": "Resources:\n  ProcessUploads:\n    Type: AWS::Serverless::Function\n    Properties:\n      Runtime: python3.12\n      Handler: app.handler   # one entry point — function.module.func\n      MemorySize: 512  # CPU scales with memory — bump for speed, not just RAM\n      Timeout: 60  # well below the 900s ceiling — fail fast\n      ReservedConcurrentExecutions: 50  # cap blast radius on downstream DB\n      ProvisionedConcurrencyConfig:\n        ProvisionedConcurrentExecutions: 5  # 5 warm instances — kills cold start\n      Events:\n        S3Upload:\n          Type: S3\n          Properties:\n            Bucket: !Ref UploadBucket\n            Events: s3:ObjectCreated:*  # any new key triggers — filter inside\n      Environment:\n        Variables:\n          TABLE_NAME: !Ref ResultsTable  # never hardcode ARNs — wire by ref"
          },
          {
            "type": "build-along",
            "title": "Invoke a Lambda from the CLI",
            "goal": "A synchronous invoke of process-uploads with a JSON payload, plus the response check that catches the runtime errors the exit code hides. Click through, then run it for real in your terminal.",
            "lang": "bash",
            "file": "terminal",
            "steps": [
              {
                "title": "Call the function by name",
                "say": "aws lambda invoke runs the function synchronously and waits for the result — no server, no URL, you address it by name.",
                "add": "aws lambda invoke \\\n  --function-name process-uploads \\"
              },
              {
                "title": "Attach the JSON payload",
                "say": "The payload becomes the event your handler receives. raw-in-base64-out tells CLI v2 to take literal JSON — leave it off and you get a cryptic base64 decode error.",
                "add": "\n  --payload '{\"key\":\"test.txt\"}' \\\n  --cli-binary-format raw-in-base64-out \\"
              },
              {
                "title": "Land the response in a file",
                "say": "The last argument is where the response body gets written. Gotcha: exit code 0 only means the API accepted the call — your code can still have crashed inside.",
                "add": "\n  response.json  # response body lands here, exit code 0 even on app errors"
              },
              {
                "title": "Read the body — the real success check",
                "say": "Always read the response body. A 200 from the API can still contain an application error — errorMessage in the JSON is your handler throwing, not Lambda failing.",
                "add": "\n\ncat response.json  # check for { \"errorMessage\": ... } — that's a runtime error"
              }
            ]
          },
          {
            "type": "quote",
            "text": "Scale-to-zero is free until your traffic isn't zero. Then it's the most expensive VM you've ever rented.",
            "cite": "every team's first serverless invoice"
          }
        ]
      }
    ]
  },
  "cloud-cdn": {
    "sections": [
      {
        "heading": "The edge is the front door",
        "body": [
          {
            "type": "p",
            "text": "**A CDN puts copies of your content in datacenters near your users.** A request from Tokyo hits a Tokyo edge node and gets a cached response in 5ms — instead of crossing the Pacific to your origin and back in 200ms. The performance win is real; the cost win is bigger."
          },
          {
            "type": "p",
            "text": "For static assets the CDN reduces origin traffic by 90%+ — fewer servers, less egress. For dynamic apps, edge functions let you authenticate, redirect, or A/B-test without ever touching origin. Sometimes the CDN ends up being your whole app."
          },
          {
            "type": "diagram",
            "title": "Edge in front of origin",
            "height": 220,
            "nodes": [
              { "id": "user", "label": "user",   "subtitle": "TOKYO · 5MS",     "accent": "water", "x": 0.08, "y": 0.5 },
              { "id": "edge", "label": "edge",   "subtitle": "POP · CACHE HIT", "accent": "sky",   "x": 0.4,  "y": 0.5 },
              { "id": "fn",   "label": "edge fn","subtitle": "AUTH · REWRITE",  "accent": "sky",   "x": 0.65, "y": 0.25 },
              { "id": "orig", "label": "origin", "subtitle": "US-EAST · 200MS", "accent": "earth", "x": 0.9,  "y": 0.5 }
            ],
            "edges": [
              { "from": "user", "to": "edge", "kind": "dashed", "label": "5ms hit" },
              { "from": "edge", "to": "fn",   "kind": "dashed", "label": "miss" },
              { "from": "fn",   "to": "orig", "kind": "dashed", "label": "fetch" }
            ]
          }
        ]
      },
      {
        "heading": "Cache keys and invalidation",
        "body": [
          {
            "type": "p",
            "text": "**The cache key decides who gets the cached copy.** Default keys hash URL + host. Add query strings, headers, or cookies to the key and you fragment the cache — every variant becomes its own cached object. Forget to include the `Accept-Encoding` header and you'll serve gzip to a client that asked for brotli."
          },
          {
            "type": "p",
            "text": "**Invalidation is the hard part of CDNs.** You can wait for TTL to expire, send an explicit purge, or use content-hashed filenames (`app.a3f9c2.js`) so the URL changes when the bytes do. The third option is the only one that scales — no purge call, no stale cache, no 3am pages."
          },
          {
            "type": "table",
            "headers": ["Provider", "CDN", "Edge runtime", "Default TTL"],
            "rows": [
              ["AWS",   "CloudFront",   "Lambda@Edge", "24h"],
              ["GCP",   "Cloud CDN",    "Cloud Run",   "1h"],
              ["Azure", "Front Door",   "Workers",     "varies"],
              ["Cloudflare", "Cloudflare", "Workers",  "2h"]
            ]
          },
          {
            "type": "code",
            "lang": "bash",
            "text": "# Inspect what the CDN returned to you:\ncurl -I https://cdn.example.com/app.js  # check X-Cache: Hit/Miss, Age, ETag\n\n# Force a refresh on a specific path (CloudFront):\naws cloudfront create-invalidation \\  # billed per path after the first 1k/month\n  --distribution-id E123ABC \\\n  --paths '/app.js' '/index.html'  # wildcards work but cost the same\n\n# Better: ship a new filename on every deploy:\n# app.js -> app.a3f9c2.js  # build-time content hash, infinite TTL is safe\n# index.html stays short-TTL and points at the new hash"
          },
          {
            "type": "pros-cons",
            "goodLabel": "GOOD FOR",
            "watchLabel": "WATCH OUT FOR",
            "good": [
              "Static assets — images, JS, CSS — slash origin load by 10x",
              "Geographic latency — cut p99 in half for international users",
              "DDoS absorption — edge soaks the flood, origin barely notices",
              "Signed URLs for paywalled content — auth at the edge"
            ],
            "watch": [
              "Cache-key explosions — adding `?utm_*` to the key destroys hit rate",
              "Invalidation lag — purges take 30s–10min to propagate",
              "Edge runtimes have tiny CPU + memory budgets — no heavy work",
              "Vary-by-cookie kills cacheability — measure hit rate after every change"
            ]
          },
          {
            "type": "quote",
            "text": "There are only two hard things in computer science: cache invalidation and naming things — and the CDN gives you both at once.",
            "cite": "Phil Karlton, by way of every SRE"
          }
        ]
      }
    ]
  },
  "cloud-observability": {
    "sections": [
      {
        "heading": "The three pillars",
        "body": [
          {
            "type": "p",
            "text": "**Observability rests on logs, metrics, and traces.** Logs are events with context — *'user 42 hit /checkout, returned 500'*. Metrics are aggregated numbers over time — *'p99 latency on /checkout'*. Traces stitch a single request across services — *'this 500 came from a 12s call to billing'*. Each answers a different question; you need all three."
          },
          {
            "type": "p",
            "text": "Every cloud has its own first-party stack — CloudWatch on AWS, Cloud Operations (formerly Stackdriver) on GCP, Azure Monitor on Azure. They're fine for one-cloud shops. The moment you go multi-cloud or want better UX, you export everything to Datadog, Honeycomb, or Grafana and stop fighting the native UI."
          },
          {
            "type": "diagram",
            "title": "Three signals, one pipeline",
            "height": 240,
            "nodes": [
              { "id": "app",    "label": "app",     "subtitle": "OTEL SDK",        "accent": "fire",  "x": 0.1,  "y": 0.5 },
              { "id": "logs",   "label": "logs",    "subtitle": "EVENTS · JSON",   "accent": "sky",   "x": 0.45, "y": 0.2 },
              { "id": "metric", "label": "metrics", "subtitle": "AGGREGATES",      "accent": "sky",   "x": 0.45, "y": 0.5 },
              { "id": "trace",  "label": "traces",  "subtitle": "SPANS · REQUESTS","accent": "sky",   "x": 0.45, "y": 0.8 },
              { "id": "ui",     "label": "vendor",  "subtitle": "DATADOG · GRAFANA","accent": "amber", "x": 0.85, "y": 0.5 }
            ],
            "edges": [
              { "from": "app",    "to": "logs",   "kind": "dashed", "label": "emit" },
              { "from": "app",    "to": "metric", "kind": "dashed", "label": "scrape" },
              { "from": "app",    "to": "trace",  "kind": "dashed", "label": "span" },
              { "from": "logs",   "to": "ui",     "kind": "dashed" },
              { "from": "metric", "to": "ui",     "kind": "dashed" },
              { "from": "trace",  "to": "ui",     "kind": "dashed" }
            ]
          }
        ]
      },
      {
        "heading": "Dashboards vs alarms",
        "body": [
          {
            "type": "p",
            "text": "**Dashboards are for browsing; alarms are for paging.** A dashboard answers *'what does the system look like right now?'* — humans look at it on purpose. An alarm answers *'is something broken?'* — it looks at you, on the system's schedule, at 3am. Mix the two and you'll have noisy alerts and useless dashboards."
          },
          {
            "type": "table",
            "headers": ["Signal", "AWS", "GCP", "Azure"],
            "rows": [
              ["Logs",    "`CloudWatch Logs`", "`Cloud Logging`",  "`Log Analytics`"],
              ["Metrics", "`CloudWatch Metrics`", "`Cloud Monitoring`", "`Azure Monitor`"],
              ["Traces",  "`X-Ray`",  "`Cloud Trace`",    "`App Insights`"],
              ["Alerts",  "`CloudWatch Alarms`", "`Alerting`",  "`Alerts`"]
            ]
          },
          {
            "type": "kanban",
            "title": "An on-call alert lifecycle",
            "caption": "Where alarms travel from fire to retro",
            "columns": [
              { "name": "Fired",       "wip": null, "items": ["ALARM-payments-p99", "ALARM-db-cpu"] },
              { "name": "Acknowledged","wip": 2,    "items": ["ALARM-checkout-5xx"] },
              { "name": "Mitigated",   "wip": null, "items": ["ALARM-queue-depth"] },
              { "name": "Postmortem",  "wip": null, "items": ["INC-2026-04-rollback"] }
            ]
          }
        ]
      },
      {
        "heading": "Instrument it",
        "body": [
          {
            "type": "p",
            "text": "**Structured logs cost the same as plain logs and are 10x more useful.** Emit JSON with consistent keys, ship them to whatever backend, and the query language does the rest. Stick to OpenTelemetry on the producer side so you can swap backends later without re-instrumenting."
          },
          {
            "type": "code",
            "lang": "yaml",
            "text": "# OpenTelemetry Collector — vendor-neutral pipeline:\nreceivers:\n  otlp:\n    protocols:\n      grpc:\n        endpoint: 0.0.0.0:4317  # one socket — logs, metrics, traces all in\nprocessors:\n  batch:\n    timeout: 5s  # batch before sending — fewer API calls, lower bill\n  resource:\n    attributes:\n      - key: service.name\n        value: payments-api  # tag every signal — the only way to filter later\n        action: upsert\nexporters:\n  datadog:\n    api:\n      key: ${env:DD_API_KEY}  # secret from env, never inline\n  awscloudwatchlogs:\n    log_group_name: /aws/payments  # fallback — keep one cloud-native exporter\nservice:\n  pipelines:\n    traces:\n      receivers: [otlp]\n      processors: [batch, resource]\n      exporters: [datadog]  # swap to honeycomb in one line — that's the win"
          },
          {
            "type": "pros-cons",
            "goodLabel": "GOOD FOR",
            "watchLabel": "WATCH OUT FOR",
            "good": [
              "Structured JSON logs — queryable, parseable, future-proof",
              "OpenTelemetry SDKs — swap backends without re-instrumenting",
              "SLO-based alerts — page on user pain, not CPU spikes",
              "Distributed tracing — find the slow service in a request, fast"
            ],
            "watch": [
              "Log volume bills — verbose `DEBUG` in prod is a four-figure mistake",
              "Cardinality explosions on metrics — `user_id` as a label = bankruptcy",
              "Alert fatigue — every silenced alarm is one you'll miss for real",
              "Vendor lock-in via custom agents — prefer OTel from day one"
            ]
          },
          {
            "type": "build-along",
            "title": "Hunt the last hour of 5xx errors, grouped by path",
            "goal": "A Logs Insights query that surfaces which endpoints threw 5xx in the last hour — the first command of an incident. Click through, then run it for real in your terminal.",
            "lang": "bash",
            "file": "terminal",
            "steps": [
              {
                "title": "Start the query on the right log group",
                "say": "start-query is async — it kicks off the search and hands back a query-id instead of results. The log group scopes it to one service's logs.",
                "add": "aws logs start-query \\\n  --log-group-name /aws/payments-api \\"
              },
              {
                "title": "Bound the time window",
                "say": "Insights wants epoch seconds, so $(date +%s) computes them inline. Always bound the window — Insights bills per GB scanned, and an open-ended query over old logs is slow and expensive.",
                "add": "\n  --start-time $(date -d '1 hour ago' +%s) \\\n  --end-time $(date +%s) \\"
              },
              {
                "title": "Keep only the 5xx lines",
                "say": "fields picks the columns, then the filter drops everything below 500. Filtering early keeps the rest of the pipe cheap.",
                "add": "\n  --query-string 'fields @timestamp, path, status\n    | filter status >= 500"
              },
              {
                "title": "Group and rank the damage",
                "say": "stats count(*) by path turns raw log lines into a leaderboard, and the sort bubbles the worst endpoint to the top — that's your first suspect.",
                "add": "\n    | stats count(*) by path\n    | sort count desc'  # top offenders bubble up"
              },
              {
                "title": "Poll for the results",
                "say": "Because the query is async, the rows live behind the query-id. Poll get-query-results until status flips to Complete — that's where the actual results come out.",
                "add": "\n\naws logs get-query-results \\\n  --query-id <id-from-start-query>  # repeat until status: Complete"
              }
            ]
          },
          {
            "type": "quote",
            "text": "Logs tell you what happened. Metrics tell you that something is wrong. Traces tell you where. You need all three or you're guessing.",
            "cite": "the three-pillar rule"
          },
          {
            "type": "explain-back",
            "prompt": "A user reports the checkout page is slow. Walk through how the **three pillars** (logs, metrics, traces), the split between **dashboards and alarms**, and **OpenTelemetry** instrumentation work together to take you from 'something feels off' to a fixed root cause. Then name the trade-off you'd watch to keep this observable system from becoming a liability.",
            "modelAnswer": "The chain only works because each pillar answers a different question. An **SLO-based alarm** fires first — checkout latency breached its budget — telling me *that* something is wrong without me staring at a screen. I open a **dashboard** built on **metrics** to see scope and trend: is it all users or one region, spiking now or creeping for an hour? Metrics localize but can't explain, so I pull a **trace** of a slow checkout request and watch it fan out across services until one span — say, the payments DB call — dominates the latency: that's *where*. Finally I read the **structured logs** for that exact service and trace ID to get *what* actually happened (a slow query, a retry storm). None of this is portable unless the producers emit **OpenTelemetry** — one vendor-neutral pipeline for all three signals — so I can correlate by trace ID and swap backends without re-instrumenting. The trade-off I'd watch is **cost vs. signal**: verbose `DEBUG` logs in prod and high-**cardinality** metric labels (`user_id` as a label) quietly turn into a four-figure bill and slow queries, while over-alerting breeds fatigue until the one real page gets ignored. So you tune for *fewer, higher-quality signals* — page on user pain, not CPU — even though that means accepting you won't have a metric pre-built for every question.",
            "hint": "Order them by the question each answers: *that* it's broken → *where* → *what*. Then ask what makes all three correlate-able, and what the same firehose costs you if you leave every knob wide open.",
            "commit": {
              "q": "The latency alarm fired and the metrics dashboard confirms checkout really is slow, cluster-wide. Which signal do you reach for NEXT to find which service is at fault?",
              "opts": [
                "More metrics — build a per-service latency dashboard and compare",
                "The structured logs of every downstream service, grepped in parallel",
                "A distributed trace of one slow checkout request, span by span"
              ],
              "answer": 2,
              "why": "Metrics told you *that* it's broken; the trace follows a single request across services and shows *where* the time went. Logs come after, once the trace names the suspect."
            }
          }
        ]
      }
    ]
  },
  "cloud-models": {
    "sections": [
      {
        "heading": "The control vs convenience slider",
        "body": [
          {
            "type": "p",
            "text": "**Cloud service models are a slider, not a menu.** On the left you manage everything (bare metal). On the right the cloud manages everything (SaaS). IaaS, PaaS, and FaaS are three named stops in between — each gives up control for convenience."
          },
          {
            "type": "p",
            "text": "The trap is picking based on what's trendy instead of what you actually want to own. The right question is always: *what do I want to stop caring about?*"
          },
          {
            "type": "diagram",
            "title": "Who manages what",
            "subtitle": "CONTROL TO CONVENIENCE SLIDER",
            "height": 220,
            "nodes": [
              { "id": "iaas", "label": "IaaS", "subtitle": "RENT VM",      "accent": "fire",  "x": 0.30, "y": 0.30 },
              { "id": "paas", "label": "PaaS", "subtitle": "RENT RUNTIME", "accent": "amber", "x": 0.70, "y": 0.30 },
              { "id": "faas", "label": "FaaS", "subtitle": "RENT FUNC",    "accent": "sky",   "x": 0.30, "y": 0.75 },
              { "id": "saas", "label": "SaaS", "subtitle": "RENT APP",     "accent": "water", "x": 0.70, "y": 0.75 }
            ],
            "edges": [
              { "from": "iaas", "to": "paas", "kind": "dashed", "label": "less ops" },
              { "from": "paas", "to": "faas", "kind": "dashed", "label": "less code" },
              { "from": "faas", "to": "saas", "kind": "dashed", "label": "no code" }
            ]
          },
          {
            "type": "h3",
            "text": "**What** each one abstracts"
          },
          {
            "type": "p",
            "text": "**IaaS** (EC2, Compute Engine, Azure VMs) hands you a virtual machine. You install the OS patches, the runtime, the app — the cloud only manages the hypervisor and the rack. Max flexibility, max ops."
          },
          {
            "type": "p",
            "text": "**PaaS** (App Engine, Elastic Beanstalk, Heroku) hands you a runtime. You push code; the platform handles OS, scaling, and the load balancer. **FaaS** (Lambda, Cloud Functions) goes one step further — you give it a single function, it runs only when triggered, you pay per millisecond. **SaaS** (Gmail, Salesforce) is just the finished app."
          },
          {
            "type": "table",
            "headers": ["Layer", "IaaS", "PaaS", "FaaS"],
            "rows": [
              ["Application", "you", "you", "you"],
              ["Runtime", "you", "cloud", "cloud"],
              ["OS", "you", "cloud", "cloud"],
              ["Hardware", "cloud", "cloud", "cloud"]
            ]
          },
          {
            "type": "h3",
            "text": "**When** to pick each"
          },
          {
            "type": "pros-cons",
            "goodLabel": "GOOD FOR",
            "watchLabel": "WATCH OUT FOR",
            "good": [
              "IaaS — legacy lift-and-shift, GPU training, anything that needs a kernel module",
              "PaaS — typical web app where you want push-to-deploy and don't care about the box",
              "FaaS — event glue, cron jobs, webhooks, traffic that's spiky or sparse",
              "SaaS — anything that's not your differentiator (email, payroll, error tracking)"
            ],
            "watch": [
              "FaaS cold starts — first call after idle can take seconds",
              "PaaS lock-in — your `app.yaml` doesn't run anywhere else",
              "IaaS cost creep — you pay for the VM whether it serves traffic or not",
              "SaaS data egress — your data lives in their schema, exporting hurts"
            ]
          },
          {
            "type": "code",
            "lang": "bash",
            "text": "# IaaS — you own the box, you own the patching\naws ec2 run-instances --image-id ami-xyz --instance-type t3.micro  # raw VM, 0 to ready in ~60s\n\n# PaaS — push code, platform handles the rest\ngcloud app deploy  # reads app.yaml, scales 0..N, you never see a server\n\n# FaaS — one function, pay per call\naws lambda invoke --function-name resize-image out.json  # billed per ms of execution"
          },
          {
            "type": "quote",
            "text": "Pick the rightmost model that still lets you sleep at night.",
            "cite": "the cloud-model rule"
          }
        ]
      }
    ]
  },
  "cloud-providers": {
    "sections": [
      {
        "heading": "The big three (and the vocab gap)",
        "body": [
          {
            "type": "p",
            "text": "**AWS, Azure, and GCP run roughly 65% of the cloud market between them.** They sell the same primitives — compute, storage, network, identity — but each picked different names. The same VM is `EC2` on AWS, `Virtual Machine` on Azure, and `Compute Engine` on GCP."
          },
          {
            "type": "p",
            "text": "Once you know the vocab map, you can read any provider's docs in 20 minutes. The real differences are in the corners: IAM model, billing UX, and which managed databases they bet on."
          },
          {
            "type": "diagram",
            "title": "The big three at a glance",
            "subtitle": "SAME PRIMITIVES DIFFERENT NAMES",
            "height": 220,
            "nodes": [
              { "id": "aws", "label": "AWS", "subtitle": "WIDEST CATALOG", "accent": "amber", "x": 0.18, "y": 0.5 },
              { "id": "az", "label": "Azure", "subtitle": "ENTERPRISE TIES", "accent": "water", "x": 0.5, "y": 0.5 },
              { "id": "gcp", "label": "GCP", "subtitle": "DATA + ML", "accent": "earth", "x": 0.82, "y": 0.5 }
            ],
            "edges": []
          },
          {
            "type": "h3",
            "text": "**Vocabulary** mapping"
          },
          {
            "type": "p",
            "text": "Memorize this table once and you stop translating in your head. Same shape, different label."
          },
          {
            "type": "table",
            "headers": ["Service", "AWS", "Azure", "GCP"],
            "rows": [
              ["VM", "`EC2`", "`VM`", "`Compute Engine`"],
              ["Object store", "`S3`", "`Blob Storage`", "`GCS`"],
              ["Managed K8s", "`EKS`", "`AKS`", "`GKE`"],
              ["Serverless fn", "`Lambda`", "`Functions`", "`Cloud Functions`"]
            ]
          },
          {
            "type": "h3",
            "text": "**Strengths** — what each one is actually good at"
          },
          {
            "type": "pros-cons",
            "goodLabel": "GOOD FOR",
            "watchLabel": "WATCH OUT FOR",
            "good": [
              "AWS — broadest service catalog, deepest docs, most third-party tooling",
              "Azure — easiest sell if your shop already runs AD, Office 365, and .NET",
              "GCP — best-in-class data warehouse (BigQuery), strong ML platform (Vertex)",
              "All three — generous free tier for prototyping (12 months, then watch the meter)"
            ],
            "watch": [
              "Egress fees — moving data *out* costs 5-10x more than moving it in",
              "Console UX rot — the AWS console has 200+ services and a search bar that misses half",
              "'Multi-cloud' marketing — real multi-cloud means triple ops, not triple resilience",
              "Reserved-instance lock-in — 1-3 year commits save 30-60% but bind your roadmap"
            ]
          },
          {
            "type": "code",
            "lang": "bash",
            "text": "# Same intent, three CLIs — list all VMs in the default region/project.\naws ec2 describe-instances --query 'Reservations[].Instances[].InstanceId'  # JSON path filter\naz vm list --output table  # Azure CLI defaults to JSON, --output table is human-friendly\ngcloud compute instances list  # GCP CLI auto-tables, --format=json if you need it scripted"
          },
          {
            "type": "p",
            "text": "**Multi-cloud realism:** running prod across two clouds doubles your ops surface for marginal resilience gain. Most teams pick one primary and use a second only for specific services (e.g. BigQuery on GCP while everything else lives on AWS)."
          },
          {
            "type": "quote",
            "text": "Pick one cloud, learn it deeply. The second one is a tax, not a hedge.",
            "cite": "the multi-cloud truth"
          }
        ]
      }
    ]
  },
  "cloud-regions": {
    "sections": [
      {
        "heading": "City, building, curbside box",
        "body": [
          {
            "type": "p",
            "text": "**A region is a city. An availability zone is a building inside that city. An edge POP is the curbside cabinet near your user.** Each layer trades latency for blast radius — pick deliberately or your whole app goes dark when a single rack catches fire."
          },
          {
            "type": "diagram",
            "title": "The geography of the cloud",
            "subtitle": "REGION TO AZ TO EDGE",
            "height": 220,
            "nodes": [
              { "id": "region", "label": "Region", "subtitle": "US-EAST-1 · CITY", "accent": "earth", "x": 0.15, "y": 0.5 },
              { "id": "az1", "label": "AZ-a", "subtitle": "BUILDING", "accent": "earth", "x": 0.45, "y": 0.3 },
              { "id": "az2", "label": "AZ-b", "subtitle": "BUILDING", "accent": "earth", "x": 0.45, "y": 0.7 },
              { "id": "edge", "label": "Edge POP", "subtitle": "CURBSIDE", "accent": "sky", "x": 0.82, "y": 0.5 }
            ],
            "edges": [
              { "from": "region", "to": "az1", "kind": "solid", "label": "<1 ms" },
              { "from": "region", "to": "az2", "kind": "solid", "label": "<1 ms" },
              { "from": "az1", "to": "edge", "kind": "dashed", "label": "10-50 ms" }
            ]
          },
          {
            "type": "h3",
            "text": "**Latency** — distance is destiny"
          },
          {
            "type": "p",
            "text": "Light in fiber moves at ~200,000 km/s. New York to Frankfurt is a hard ~80 ms round trip no matter how fast your code is. That's why every provider has 30+ regions — to put compute near the user."
          },
          {
            "type": "table",
            "headers": ["Tier", "Typical RTT", "Use for"],
            "rows": [
              ["Same AZ", "< 1 ms", "Database + app server"],
              ["Same region (cross-AZ)", "1-3 ms", "HA replicas, sync writes"],
              ["Cross-region", "60-200 ms", "DR backups, async replication"],
              ["Edge POP to user", "5-30 ms", "Static assets, cached API"]
            ]
          },
          {
            "type": "h3",
            "text": "**Blast radius** + data residency"
          },
          {
            "type": "pros-cons",
            "goodLabel": "GOOD FOR",
            "watchLabel": "WATCH OUT FOR",
            "good": [
              "Multi-AZ deploys — single building fire ≠ outage",
              "Multi-region only if SLA demands it (and your team can run two stacks)",
              "Pinning data to specific regions for GDPR / data-residency rules",
              "Edge caching for static + read-heavy paths"
            ],
            "watch": [
              "'Multi-region active-active' is hard — split-brain, conflict resolution, double cost",
              "us-east-1 is the busiest region — also the one that goes down most often",
              "Cross-region egress is billed — replicating 1 TB nightly adds up fast",
              "Edge is read-only — writes still go to the origin region"
            ]
          },
          {
            "type": "code",
            "lang": "bash",
            "text": "# Launch in a specific AZ — pin workload to a building, not just a city.\naws ec2 run-instances --image-id ami-xyz --placement AvailabilityZone=us-east-1a  # locks AZ\n\n# List all regions you can deploy to right now.\naws ec2 describe-regions --query 'Regions[].RegionName' --output text  # ~30 entries\n\n# CloudFront distribution — pushes static assets to ~400 edge POPs.\naws cloudfront create-distribution --origin-domain-name app.example.com  # global edge cache"
          },
          {
            "type": "quote",
            "text": "Region is the city. AZ is the building. Edge is the curbside box. Pick all three on purpose.",
            "cite": "the geography rule"
          }
        ]
      }
    ]
  },
  "cloud-iam": {
    "sections": [
      {
        "heading": "Identity is the new perimeter",
        "body": [
          {
            "type": "p",
            "text": "**IAM is the cloud's security model — and the thing that bites every junior the hardest.** Before IAM, the firewall was your perimeter; in the cloud, *identity* is. Every API call is signed, every action is allowed or denied by policy."
          },
          {
            "type": "p",
            "text": "Get IAM wrong and your S3 bucket ends up on a security blog. Get it right and you sleep through the night."
          },
          {
            "type": "diagram",
            "title": "IAM building blocks",
            "subtitle": "IDENTITY · POLICY · ROLE",
            "height": 220,
            "nodes": [
              { "id": "user", "label": "Identity",   "subtitle": "USER+GRP",   "accent": "amber", "x": 0.30, "y": 0.30 },
              { "id": "role", "label": "Role",       "subtitle": "TEMP CRED",  "accent": "amber", "x": 0.70, "y": 0.30 },
              { "id": "policy", "label": "Policy",   "subtitle": "ALLOW/DENY", "accent": "amber", "x": 0.30, "y": 0.75 },
              { "id": "resource", "label": "Resource","subtitle": "S3+EC2",    "accent": "earth", "x": 0.70, "y": 0.75 }
            ],
            "edges": [
              { "from": "user", "to": "role", "kind": "dashed", "label": "assume" },
              { "from": "role", "to": "policy", "kind": "solid", "label": "attached" },
              { "from": "policy", "to": "resource", "kind": "dashed", "label": "guards" }
            ]
          },
          {
            "type": "h3",
            "text": "**The four nouns** of IAM"
          },
          {
            "type": "p",
            "text": "**Identity** is *who you are* — a human user, an app's service account, or an EC2 instance role. **Policy** is *what you can do* — a JSON document of `Allow`/`Deny` statements. **Role** is a temporary identity you can *assume*. **Resource** is the thing being protected (a bucket, a queue, a VM)."
          },
          {
            "type": "table",
            "headers": ["Concept", "AWS", "GCP", "Lives for"],
            "rows": [
              ["User", "`IAM User`", "`User account`", "Forever"],
              ["Service identity", "`IAM Role`", "`Service Account`", "Temp (~1h)"],
              ["Policy", "`Policy JSON`", "`IAM Binding`", "Until detached"],
              ["Group", "`IAM Group`", "`Google Group`", "Forever"]
            ]
          },
          {
            "type": "h3",
            "text": "**Trust vs permission** — the split that confuses everyone"
          },
          {
            "type": "p",
            "text": "**Trust policy** says *who can assume this role* (e.g. 'the prod EC2 instance can'). **Permission policy** says *what the role can do once assumed* (e.g. 'read this bucket')."
          },
          {
            "type": "p",
            "text": "Most 'AccessDenied' errors come from a missing trust, not a missing permission. The role exists, has the right policy, but you forgot to let your principal *become* it."
          },
          {
            "type": "code",
            "lang": "json",
            "text": "{\n  \"Version\": \"2012-10-17\",\n  \"Statement\": [\n    {\n      \"Sid\": \"ReadOneBucket\",\n      \"Effect\": \"Allow\",\n      \"Action\": [\"s3:GetObject\", \"s3:ListBucket\"],\n      \"Resource\": [\n        \"arn:aws:s3:::reports-prod\",\n        \"arn:aws:s3:::reports-prod/*\"\n      ]\n    }\n  ]\n}\n// Least-privilege: read-only, one bucket, no wildcards on Resource."
          },
          {
            "type": "pros-cons",
            "goodLabel": "GOOD FOR",
            "watchLabel": "WATCH OUT FOR",
            "good": [
              "Roles for services — EC2 / Lambda / pods assume a role, no static keys on disk",
              "MFA on every human, especially root — phishing-resistant tokens beat SMS",
              "Short-lived credentials via STS — defaults to ~1 hour, expires automatically",
              "Audit with CloudTrail / Cloud Audit Logs — every API call is recorded"
            ],
            "watch": [
              "**Root credentials are radioactive** — set MFA, lock them in a safe, never use them",
              "`Action: \"*\"` policies — that's not least privilege, that's a free admin",
              "Long-lived access keys committed to git — rotate immediately, audit the history",
              "Trusting `*` in a trust policy — anyone in any account can assume the role"
            ]
          },
          {
            "type": "quote",
            "text": "Identity is the new perimeter. Root creds are radioactive. Trust ≠ permission.",
            "cite": "the IAM three commandments"
          }
        ]
      }
    ]
  },
  "cloud-networking": {
    "sections": [
      {
        "heading": "Your private datacenter, rented",
        "body": [
          {
            "type": "p",
            "text": "**A VPC is the private datacenter the cloud rents you.** Inside it, you carve subnets, draw route tables, hang firewalls — the same building blocks as on-prem, just defined as JSON instead of cabled by hand."
          },
          {
            "type": "p",
            "text": "The mental shift: every networking primitive you knew on-prem still exists, but it's now a managed *abstraction*. You don't plug cables — you write IaC."
          },
          {
            "type": "diagram",
            "title": "VPC anatomy",
            "subtitle": "PUBLIC · PRIVATE · NAT",
            "height": 240,
            "nodes": [
              { "id": "igw", "label": "Internet GW", "subtitle": "PUBLIC ENTRY", "accent": "sky", "x": 0.1, "y": 0.5 },
              { "id": "pub", "label": "Public subnet", "subtitle": "LB · BASTION", "accent": "water", "x": 0.35, "y": 0.3 },
              { "id": "nat", "label": "NAT GW", "subtitle": "EGRESS ONLY", "accent": "water", "x": 0.35, "y": 0.7 },
              { "id": "priv", "label": "Private subnet", "subtitle": "APP · DB", "accent": "water", "x": 0.65, "y": 0.5 },
              { "id": "sg", "label": "Security group", "subtitle": "STATEFUL FW", "accent": "amber", "x": 0.92, "y": 0.5 }
            ],
            "edges": [
              { "from": "igw", "to": "pub", "kind": "solid", "label": "ingress" },
              { "from": "pub", "to": "priv", "kind": "dashed", "label": "internal" },
              { "from": "priv", "to": "nat", "kind": "dashed", "label": "egress" },
              { "from": "nat", "to": "igw", "kind": "dashed", "label": "to net" },
              { "from": "priv", "to": "sg", "kind": "solid", "label": "guarded" }
            ]
          },
          {
            "type": "h3",
            "text": "**Subnets** + route tables"
          },
          {
            "type": "p",
            "text": "**A subnet is a slice of the VPC's CIDR block, pinned to one AZ.** Public subnets have a route to an Internet Gateway; private subnets don't. The route table is the address book that says *'traffic for 0.0.0.0/0 goes via the IGW'* — change that one line and a subnet flips from public to private."
          },
          {
            "type": "p",
            "text": "**NAT Gateway** lets private subnets *initiate* outbound calls (apt-get, API webhooks) without being reachable inbound. It's the one-way valve."
          },
          {
            "type": "h3",
            "text": "**Security groups vs NACLs** — the firewall layers"
          },
          {
            "type": "table",
            "headers": ["Layer", "Stateful?", "Scope", "Default"],
            "rows": [
              ["Security Group", "yes", "Per-ENI / instance", "Deny inbound"],
              ["NACL", "no", "Per-subnet", "Allow all"],
              ["Route table", "n/a", "Per-subnet", "Local only"],
              ["WAF / L7", "yes", "Per-LB", "Allow all"]
            ]
          },
          {
            "type": "p",
            "text": "**Stateful** (security groups) — if you allow the request in, the reply goes out automatically. **Stateless** (NACLs) — you have to allow *both* directions explicitly. NACLs are the second locked door; security groups are your daily one."
          },
          {
            "type": "code",
            "lang": "hcl",
            "text": "resource \"aws_vpc\" \"main\" {\n  cidr_block = \"10.0.0.0/16\"  # 65k addresses — plenty of headroom\n}\n\nresource \"aws_subnet\" \"private\" {\n  vpc_id            = aws_vpc.main.id\n  cidr_block        = \"10.0.1.0/24\"  # 256 IPs, one AZ\n  availability_zone = \"us-east-1a\"  # pin to a building\n}\n\nresource \"aws_security_group\" \"app\" {\n  vpc_id = aws_vpc.main.id\n\n  ingress {\n    from_port   = 443  # HTTPS only — no port 80, no SSH\n    to_port     = 443\n    protocol    = \"tcp\"\n    cidr_blocks = [\"10.0.0.0/16\"]  # internal only — never 0.0.0.0/0 in prod\n  }\n}"
          },
          {
            "type": "pros-cons",
            "goodLabel": "GOOD FOR",
            "watchLabel": "WATCH OUT FOR",
            "good": [
              "Put DB and app servers in private subnets — only the LB is public",
              "Use security groups by default; reach for NACLs only for subnet-wide blocklists",
              "VPC peering or Transit Gateway for cross-VPC traffic (no public internet)",
              "Flow Logs on every VPC — you'll want them when someone asks 'who called who'"
            ],
            "watch": [
              "`0.0.0.0/0` on port 22 — that's `ssh open to the planet`",
              "NAT Gateway costs ~$0.045/hr + per-GB — not free, watch your egress",
              "VPC CIDR overlap — peering won't work if both sides use `10.0.0.0/16`",
              "Forgetting return-path rules with NACLs — half-open connections silently drop"
            ]
          },
          {
            "type": "quote",
            "text": "A VPC is a datacenter expressed as JSON. The cables are routes; the patch panel is a route table.",
            "cite": "the network-as-code rule"
          }
        ]
      }
    ]
  },
  "cloud-cost": {
    "sections": [
      {
        "heading": "Cost is a feature",
        "body": [
          {
            "type": "p",
            "text": "**Cloud cost is not a bill you receive — it's a signal you generate.** Every line of IaC, every autoscaler config, every cron job ships dollars. FinOps is the practice of making those dollars visible *before* the invoice arrives."
          },
          {
            "type": "p",
            "text": "The number-one cause of surprise bills is *forgotten resources* — a dev's GPU instance left running over the weekend, an S3 bucket logging into itself, a NAT gateway nobody knew was there."
          },
          {
            "type": "diagram",
            "title": "The four pricing modes",
            "subtitle": "FLEXIBILITY VS DISCOUNT",
            "height": 220,
            "nodes": [
              { "id": "od", "label": "On-demand",    "subtitle": "PAY-AS-YOU-GO", "accent": "earth", "x": 0.15, "y": 0.5 },
              { "id": "sp", "label": "Spot",         "subtitle": "-70% RISKY",    "accent": "earth", "x": 0.4,  "y": 0.5 },
              { "id": "ri", "label": "Reserved",     "subtitle": "1-3 YR",        "accent": "earth", "x": 0.15, "y": 0.85 },
              { "id": "sv", "label": "Savings plan", "subtitle": "FLEXIBLE",      "accent": "earth", "x": 0.4,  "y": 0.85 }
            ],
            "edges": []
          },
          {
            "type": "h3",
            "text": "**The four pricing** modes"
          },
          {
            "type": "p",
            "text": "**On-demand** is the sticker price — full rate, no commitment. **Spot** is unused capacity at 60-90% off, but the cloud can yank it back with two minutes' notice. **Reserved instances** lock you to a specific VM family for 1-3 years at 30-60% off. **Savings plans** are looser — commit $X/hr of compute spend across services, get the same discount."
          },
          {
            "type": "table",
            "headers": ["Mode", "Discount", "Commit", "Risk"],
            "rows": [
              ["On-demand", "0%", "None", "None"],
              ["Spot", "60-90%", "None", "Pre-empted in 2 min"],
              ["Reserved", "30-60%", "1-3 yr · fixed VM", "Wasted if unused"],
              ["Savings plan", "20-50%", "1-3 yr · $/hr", "Wasted if under-spend"]
            ]
          },
          {
            "type": "h3",
            "text": "**Tagging** + show-back vs charge-back"
          },
          {
            "type": "p",
            "text": "**Tags are how you slice the bill.** Every resource gets `team`, `env`, `cost-center`, `project` — without them, the bill is one giant lump and nobody knows what to optimize. Enforce tagging at create-time via IaC, not after the fact."
          },
          {
            "type": "p",
            "text": "**Show-back** sends teams a monthly report of their cloud spend — informational, no financial impact. **Charge-back** actually moves money from their budget. Show-back changes behavior; charge-back changes priorities."
          },
          {
            "type": "code",
            "lang": "bash",
            "text": "# Tag everything — without tags, the bill is unsliceable.\naws ec2 create-tags --resources i-abc123 \\\n  --tags Key=team,Value=ml Key=env,Value=prod Key=cost-center,Value=cc-42  # required four\n\n# Set a hard budget + email alarm at 80% of forecast.\naws budgets create-budget --account-id 1234 --budget file://budget.json  # alert before invoice\n\n# Find the top 10 spenders this month — costs API, not console.\naws ce get-cost-and-usage --time-period Start=2026-05-01,End=2026-06-01 \\\n  --granularity MONTHLY --metrics UnblendedCost \\\n  --group-by Type=TAG,Key=team  # group by who's spending"
          },
          {
            "type": "pros-cons",
            "goodLabel": "GOOD FOR",
            "watchLabel": "WATCH OUT FOR",
            "good": [
              "Spot for stateless batch + ML training — checkpoint often, lose nothing",
              "Reserved / Savings plans for steady baseline load you know you'll run",
              "Budgets + alarms at 50/80/100% of forecast — catch leaks before invoice day",
              "Auto-stop dev environments nights + weekends — half the month, half the cost"
            ],
            "watch": [
              "Forgotten GPU instances — one a100 left running = $25/hr = $600/day",
              "Egress + cross-AZ traffic — looks free in the console, isn't on the bill",
              "Over-committed Reserved Instances — you owe for capacity you don't use",
              "Untagged resources — once it's in the lump, you'll never find what to cut"
            ]
          },
          {
            "type": "quote",
            "text": "Cost is a feature. If you can't slice the bill by team, env, and project, you don't have a cost model — you have a surprise.",
            "cite": "the FinOps first principle"
          }
        ]
      }
    ]
  },
  "devops-role-map": {
    "sections": [
      {
        "heading": "Three titles, one mission",
        "body": [
          {
            "type": "p",
            "text": "**DevOps, SRE, and Platform Engineering all keep the system reliable — but they get there from different angles.** DevOps is a *culture* that fuses dev and ops; SRE is a *discipline* that treats reliability as an engineering problem with math; Platform Engineering is a *product team* that builds the internal road every other engineer drives on."
          },
          {
            "type": "p",
            "text": "Most companies use the titles interchangeably and end up confused about who owns what. The fix isn't a better org chart — it's knowing which stage of the SDLC each role actually touches."
          },
          {
            "type": "diagram",
            "title": "How the three roles touch the SDLC",
            "subtitle": "DIFFERENT STAGES SAME PIPELINE",
            "height": 220,
            "nodes": [
              { "id": "code",    "label": "Code",    "subtitle": "DEV WRITES",     "accent": "water", "x": 0.3,  "y": 0.3 },
              { "id": "ship",    "label": "Ship",    "subtitle": "DEVOPS CULTURE", "accent": "sky",   "x": 0.7,  "y": 0.3 },
              { "id": "platform","label": "Platform","subtitle": "PAVED ROAD",     "accent": "earth", "x": 0.3,  "y": 0.7 },
              { "id": "run",     "label": "Run",     "subtitle": "SRE OWNS SLO",   "accent": "fire",  "x": 0.7,  "y": 0.7 }
            ],
            "edges": [
              { "from": "code",     "to": "ship",     "kind": "dashed", "label": "PR → CI" },
              { "from": "ship",     "to": "platform", "kind": "dashed", "label": "deploys via" },
              { "from": "platform", "to": "run",      "kind": "dashed", "label": "to prod" }
            ]
          },
          {
            "type": "h3",
            "text": "**DevOps** — the culture that started it"
          },
          {
            "type": "p",
            "text": "**DevOps is not a job title — it's a *practice* of merging dev and ops responsibilities.** It came from the 2009 'you build it, you run it' wave: stop the wall between teams, share the pager, automate the handoff."
          },
          {
            "type": "p",
            "text": "When 'DevOps Engineer' is a person on a team, they usually own CI/CD pipelines, infrastructure-as-code, and release tooling. The label drifted from culture into role — that's why every JD looks different."
          },
          {
            "type": "h3",
            "text": "**SRE** — reliability with math"
          },
          {
            "type": "p",
            "text": "**SRE is Google's answer to ops, and the math is the load-bearing part.** Define an SLO (e.g. 99.9% availability), compute the error budget (0.1% = ~43 min/month), and *spend it deliberately*. If you're inside budget, ship faster. If you've burned it, freeze releases until you've earned it back."
          },
          {
            "type": "p",
            "text": "SREs also cap toil at ~50% of their time — the rest goes to engineering work that *eliminates* the toil. No toil cap, no SRE — just an ops team with a fancier badge."
          },
          {
            "type": "h3",
            "text": "**Platform Engineering** — the internal product team"
          },
          {
            "type": "p",
            "text": "**Platform Engineering treats other engineers as customers.** The deliverable is an *internal developer platform* (IDP): paved-road templates, self-serve infra, golden paths that make the easy way also the safe way."
          },
          {
            "type": "p",
            "text": "Success isn't 'uptime' — it's *adoption*. If devs route around your platform, you've shipped a museum, not a product."
          },
          {
            "type": "table",
            "headers": ["Dimension", "DevOps", "SRE", "Platform Eng"],
            "rows": [
              ["**Primary unit**", "Culture / practice", "Engineering discipline", "Internal product team"],
              ["**Owns**", "CI/CD + IaC", "SLOs + error budget", "Developer platform (IDP)"],
              ["**Success metric**", "Deploy frequency", "Error budget burn", "Platform adoption"],
              ["**Customer**", "The team itself", "End users", "Other engineers"]
            ]
          },
          {
            "type": "code",
            "lang": "python",
            "text": "# Error-budget math — the single equation that defines SRE work.\nSLO = 0.999  # 99.9% monthly availability target\nMINUTES_PER_MONTH = 30 * 24 * 60  # 43,200 minutes baseline\n\nerror_budget_min = MINUTES_PER_MONTH * (1 - SLO)  # ~43.2 min of allowed downtime\nactual_down_min = 12.4  # measured outage minutes this month\nburn_ratio = actual_down_min / error_budget_min  # >1.0 = freeze releases\n\nif burn_ratio > 1.0:  # budget exhausted — reliability work wins\n    freeze_releases()  # SRE pulls the brake, dev keeps coding\nelse:\n    ship_faster()  # budget intact — culture says move"
          },
          {
            "type": "pros-cons",
            "goodLabel": "ORG FITS — WHEN TO ADOPT WHICH",
            "watchLabel": "ORG MISFITS — WHEN IT BACKFIRES",
            "good": [
              "**DevOps culture** — early-stage startup, one team, no walls to break yet — bake it in from day one",
              "**SRE discipline** — product has paying users + an SLA, downtime maps to dollars, you can afford dedicated headcount",
              "**Platform team** — >50 engineers, infra knowledge keeps getting re-learned, every team builds the same Terraform module"
            ],
            "watch": [
              "**DevOps as a job title for one person** — you've recreated the ops silo with extra YAML",
              "**SRE without an SLO** — it's just ops with a Google sticker, no error budget = no leverage",
              "**Platform team before you have customers** — you'll ship a framework nobody asked for and nobody adopts"
            ]
          },
          {
            "type": "quote",
            "text": "DevOps is the culture, SRE is the math, Platform is the product. Same mission, different angle of attack.",
            "cite": "the role-map mnemonic"
          },
          {
            "type": "practice",
            "lang": "python",
            "prompt": "Compute the monthly error budget (in minutes) for a 99.95% SLO, then decide whether 18 minutes of downtime burned the budget.",
            "starter": "SLO = 0.9995  # 99.95% monthly availability\nMINUTES_PER_MONTH = 30 * 24 * 60\n\nerror_budget_min = MINUTES_PER_MONTH * (1 - SLO)\nactual_down_min = 18.0\n\nburn_ratio = actual_down_min / error_budget_min\nprint(f\"budget = {error_budget_min:.1f} min, burn = {burn_ratio:.2f}x\")\n# >1.0 means you blew the budget — freeze releases.\n",
            "hint": "Budget is ~21.6 min — 18 min is ~83% burn, under 1.0, so releases can keep shipping. Try lowering SLO to 0.999 and watch the burn flip past 1.0."
          }
        ]
      }
    ]
  },
};
