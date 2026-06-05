// sandboxExamples.js — starter snippets for the "Examples" dropdown in
// Sandbox. Each entry is { id, title, description, code } so the dropdown
// can render the title + short description in one tap target and load the
// `code` straight into the editor.
//
// Authoring rules (mobile-ux-principles + feedback_code_examples):
//   - Every non-obvious line gets a short trailing `# what / why / gotcha`.
//   - No personal names; use Ada / Alex / Sam / Maya / Liam / user@example.com.
//   - Keep each snippet < 25 lines so it fits on a phone screen.

const PYTHON = [
  {
    id: 'py-hello',
    title: 'Hello world + a function',
    description: 'The absolute basics — define, call, print.',
    code: `# Hello world + a function — the classic warm-up.
def greet(name):
    return f"hello, {name}"      # f-string interpolation

x = greet("Ada")                  # x captured back into the output
print(x)
`,
  },
  {
    id: 'py-csv',
    title: 'CSV summing',
    description: 'Parse a CSV string in-memory, sum a column.',
    code: `# Sum the "amount" column from an in-memory CSV.
import csv
from io import StringIO

raw = """name,amount
Ada,12
Alex,7
Sam,21
Maya,4"""

reader = csv.DictReader(StringIO(raw))   # treat first line as headers
x = sum(int(row["amount"]) for row in reader)  # cast str -> int
print("total:", x)
`,
  },
  {
    id: 'py-comprehension',
    title: 'List + dict comprehension',
    description: 'Flat-map style — squares, then a dict from pairs.',
    code: `# Comprehensions: terse, idiomatic Python.
nums = [1, 2, 3, 4, 5]
squares = [n * n for n in nums if n % 2 == 0]   # even squares only

people = ["Ada", "Alex", "Sam"]
ages   = [33, 28, 41]
table = {name: age for name, age in zip(people, ages)}  # dict from pairs

x = {"squares": squares, "table": table}
print(x)
`,
  },
  {
    id: 'py-asyncio',
    title: 'Async with asyncio',
    description: 'Basic event loop — gather two coroutines.',
    code: `# asyncio basics — two "tasks" running concurrently on one thread.
import asyncio

async def work(label, secs):
    await asyncio.sleep(secs)        # yields control back to the loop
    return f"{label} done in {secs}s"

async def main():
    a, b = await asyncio.gather(     # run concurrently, not sequentially
        work("alpha", 0.01),
        work("beta",  0.02),
    )
    return [a, b]

x = asyncio.run(main())              # asyncio.run = boot the loop
print(x)
`,
  },
  {
    id: 'py-regex',
    title: 'Regex extract',
    description: 'Pull all email addresses from a blob of text.',
    code: `# Extract emails with a tame, readable regex.
import re

text = """contact us at hello@example.com or
support@example.org. cc: ada@example.com"""

# \\b...\\b = word boundaries; +@+ = chars, '@', more chars, '.', tld
pattern = r"\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}\\b"
x = re.findall(pattern, text)        # returns list of matches
print(x)
`,
  },
  {
    id: 'py-dataclass',
    title: 'Class with dataclasses',
    description: 'Typed data class — no boilerplate __init__.',
    code: `# @dataclass auto-generates __init__/__repr__/__eq__.
from dataclasses import dataclass, field
from typing import List

@dataclass
class User:
    name: str
    age: int
    tags: List[str] = field(default_factory=list)   # avoid mutable default

ada = User(name="Ada", age=33, tags=["admin"])
x = ada
print(x)
`,
  },
];

const BASH = [
  {
    id: 'sh-pipe-filter',
    title: 'Pipe and filter — grep + sort + uniq',
    description: 'Top recurring ERROR lines from a log.',
    code: `# Find the most common ERROR lines in a log.
grep "ERROR" app.log \\
  | sort \\
  | uniq -c \\
  | sort -rn \\
  | head -10           # top 10 by descending count
`,
  },
  {
    id: 'sh-find-large',
    title: 'Find large files',
    description: 'Walk the FS for files over 100MB.',
    code: `# Files over 100MB, human-readable sizes.
find / -type f -size +100M 2>/dev/null \\
  -exec du -h {} \\;     # du = disk usage; -h = human-readable
`,
  },
  {
    id: 'sh-awk-sum',
    title: 'Awk one-liner — column sum',
    description: 'Sum the 3rd whitespace-separated column.',
    code: `# Sum column 3 of a whitespace-separated file.
awk '{ sum += $3 } END { print sum }' numbers.txt
# $3 = third field. END runs once after all lines.
`,
  },
  {
    id: 'sh-for-files',
    title: 'For loop over files',
    description: 'Rename every *.log to *.log.bak.',
    code: `# Loop over each .log file and append .bak.
for f in *.log; do
  mv "$f" "$f.bak"     # quote "$f" to survive spaces in names
done
`,
  },
  {
    id: 'sh-conditional',
    title: 'Conditional + exit code',
    description: 'Branch on a command success, exit non-zero on failure.',
    code: `# Exit 1 if curl fails — useful in CI scripts.
if curl -sf https://example.com > /dev/null; then
  echo "site up"
else
  echo "site down" >&2  # stderr
  exit 1                # non-zero = failure
fi
`,
  },
  {
    id: 'sh-function',
    title: 'Functions and arguments',
    description: 'Define a function, call with positional args.',
    code: `# Define + call a shell function.
greet() {
  local name="\${1:-stranger}"   # $1 = first arg; default if missing
  echo "hello, $name"
}

greet "Ada"
greet                            # uses default
`,
  },
];

const YAML = [
  {
    id: 'yml-compose',
    title: 'docker-compose with 2 services',
    description: 'API + Postgres, linked by network.',
    code: `# docker-compose: API + DB with a shared network.
version: "3.9"
services:
  api:
    image: python:3.12-slim       # base image
    ports:
      - "8000:8000"               # host:container — quote for YAML
    depends_on: [db]              # wait for db to start first
  db:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: example  # demo only — use secrets in prod
    volumes:
      - dbdata:/var/lib/postgresql/data
volumes:
  dbdata:                          # named volume, persists across runs
`,
  },
  {
    id: 'yml-k8s-deploy',
    title: 'k8s Deployment with envFrom',
    description: 'Deployment that pulls env from a ConfigMap.',
    code: `# Deployment loading env vars from a ConfigMap.
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
spec:
  replicas: 3                     # three pods behind a service
  selector:
    matchLabels: { app: api }     # must match template.metadata.labels
  template:
    metadata:
      labels: { app: api }
    spec:
      containers:
        - name: api
          image: ghcr.io/example/api:v1.2.3   # pin the tag (no :latest)
          envFrom:
            - configMapRef:
                name: api-config   # pulls every key as an env var
`,
  },
  {
    id: 'yml-k8s-configmap',
    title: 'k8s ConfigMap',
    description: 'Plain-text settings, mounted as env or file.',
    code: `# ConfigMap — key/value config separated from container images.
apiVersion: v1
kind: ConfigMap
metadata:
  name: api-config
data:
  LOG_LEVEL: "info"               # used with envFrom or env.valueFrom
  FEATURE_FLAG_X: "true"
  config.yaml: |                  # | preserves newlines (file payload)
    db:
      host: db.svc.cluster.local
      port: 5432
`,
  },
  {
    id: 'yml-gh-actions',
    title: 'GitHub Actions workflow',
    description: 'Run tests on every push and PR.',
    code: `# GitHub Actions: test on push + PR.
name: CI
on:
  push:
    branches: [main]
  pull_request:                   # also run on every PR
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: "3.12" }
      - run: pip install -r requirements.txt
      - run: pytest -q             # -q = quiet, faster output
`,
  },
  {
    id: 'yml-ansible',
    title: 'Ansible playbook',
    description: 'Install nginx + start the service on all webservers.',
    code: `# Ansible: declarative server config.
- hosts: webservers              # group from inventory
  become: true                    # sudo
  tasks:
    - name: Install nginx
      apt:
        name: nginx
        state: present            # present = installed
        update_cache: true
    - name: Ensure nginx running
      service:
        name: nginx
        state: started
        enabled: true             # start on boot
`,
  },
];

const SQL = [
  {
    id: 'sql-join-groupby',
    title: 'SELECT with JOIN and GROUP BY',
    description: 'Orders per user, descending.',
    code: `-- Orders per user, most-active first.
SELECT u.id,
       u.name,
       COUNT(o.id) AS order_count       -- alias for readability
FROM users u
LEFT JOIN orders o ON o.user_id = u.id  -- LEFT = include users w/ 0 orders
GROUP BY u.id, u.name
ORDER BY order_count DESC
LIMIT 20;
`,
  },
  {
    id: 'sql-window',
    title: 'Window function: rank by department',
    description: 'Top earner in each dept without losing other rows.',
    code: `-- RANK() OVER PARTITION — top earner per department.
SELECT name,
       department,
       salary,
       RANK() OVER (
         PARTITION BY department         -- one ranking per dept
         ORDER BY salary DESC            -- highest first
       ) AS dept_rank
FROM employees
ORDER BY department, dept_rank;
`,
  },
  {
    id: 'sql-upsert',
    title: 'UPSERT (INSERT ... ON CONFLICT)',
    description: 'Insert or update on key collision (Postgres).',
    code: `-- Postgres UPSERT — insert, or update if the key already exists.
INSERT INTO users (email, name, last_seen)
VALUES ('ada@example.com', 'Ada', NOW())
ON CONFLICT (email)                       -- unique constraint column
DO UPDATE SET
  name      = EXCLUDED.name,              -- the row we tried to insert
  last_seen = EXCLUDED.last_seen;
`,
  },
  {
    id: 'sql-cte-topn',
    title: 'CTE for top-N per group',
    description: 'Top 3 products per category using a CTE + ROW_NUMBER.',
    code: `-- Top-3 products per category — CTE + ROW_NUMBER.
WITH ranked AS (
  SELECT category,
         name,
         revenue,
         ROW_NUMBER() OVER (
           PARTITION BY category
           ORDER BY revenue DESC
         ) AS rn
  FROM products
)
SELECT category, name, revenue
FROM ranked
WHERE rn <= 3                              -- top 3 per category
ORDER BY category, rn;
`,
  },
  {
    id: 'sql-selfjoin',
    title: 'Self-join for hierarchy',
    description: 'Employees with their managers, via a self-join.',
    code: `-- Self-join: each employee row paired with its manager row.
SELECT e.id,
       e.name        AS employee,
       m.name        AS manager
FROM employees e
LEFT JOIN employees m ON m.id = e.manager_id  -- same table, different alias
ORDER BY manager, employee;
`,
  },
  {
    id: 'sql-transaction',
    title: 'Transaction with rollback',
    description: 'All-or-nothing transfer between accounts.',
    code: `-- Money transfer: atomic via BEGIN / COMMIT / ROLLBACK.
BEGIN;

UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;

-- Sanity check before commit. Rollback if either account is overdrawn.
-- (In real code you'd do this with a CHECK or a procedural block.)

COMMIT;
-- ROLLBACK;   -- uncomment to undo instead of commit
`,
  },
];

const DOCKERFILE = [
  {
    id: 'dock-py-multi',
    title: 'Python web app multi-stage',
    description: 'Build deps in one stage, slim runtime in the next.',
    code: `# Multi-stage: heavy build deps stay out of the final image.
FROM python:3.12-slim AS builder
WORKDIR /build
COPY requirements.txt .
RUN pip wheel --no-cache-dir -w /wheels -r requirements.txt  # prebuilt wheels

FROM python:3.12-slim
WORKDIR /app
COPY --from=builder /wheels /wheels
RUN pip install --no-cache-dir /wheels/*    # install wheels only
COPY . .
CMD ["python", "main.py"]
`,
  },
  {
    id: 'dock-node-nonroot',
    title: 'Node app with non-root user',
    description: 'node:20-alpine + USER node for a smaller attack surface.',
    code: `# Run Node as the unprivileged "node" user that the image ships with.
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev                       # reproducible install, no dev deps
COPY . .
USER node                                    # drop root before CMD
EXPOSE 3000
CMD ["node", "server.js"]
`,
  },
  {
    id: 'dock-distroless-go',
    title: 'Distroless Go binary',
    description: 'Static Go binary into gcr.io/distroless/static.',
    code: `# Static Go binary into distroless — no shell, no package manager.
FROM golang:1.22 AS build
WORKDIR /src
COPY . .
RUN CGO_ENABLED=0 go build -o /app .         # CGO off = fully static

FROM gcr.io/distroless/static
COPY --from=build /app /app
USER nonroot:nonroot
ENTRYPOINT ["/app"]                          # JSON form: no shell needed
`,
  },
  {
    id: 'dock-cached-deps',
    title: 'Cached dependencies layer',
    description: 'Copy lockfile first to keep deps layer cached.',
    code: `# Copy package*.json BEFORE the source so deps layer caches between rebuilds.
FROM node:20-alpine
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci                                   # cached unless lockfile changes

COPY . .                                     # source changes don't bust deps
CMD ["node", "server.js"]
`,
  },
  {
    id: 'dock-healthcheck',
    title: 'Healthcheck-aware',
    description: 'Add a HEALTHCHECK so orchestrators know when it is ready.',
    code: `# HEALTHCHECK = orchestrators (k8s, Swarm) know when this is "ready".
FROM python:3.12-slim
WORKDIR /app
COPY . .
RUN pip install --no-cache-dir flask
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \\
  CMD wget -qO- http://localhost:5000/health || exit 1
CMD ["python", "app.py"]
`,
  },
];

const JSON_EX = [
  {
    id: 'json-api',
    title: 'Simple API response',
    description: 'Typical paginated list response.',
    code: `{
  "data": [
    { "id": 1, "name": "Ada",  "role": "admin"  },
    { "id": 2, "name": "Alex", "role": "viewer" }
  ],
  "page": 1,
  "per_page": 25,
  "total": 2
}
`,
  },
  {
    id: 'json-k8s',
    title: 'k8s manifest',
    description: 'Same shape as YAML, serialized as JSON.',
    code: `{
  "apiVersion": "v1",
  "kind": "ConfigMap",
  "metadata": { "name": "api-config" },
  "data": {
    "LOG_LEVEL": "info",
    "FEATURE_FLAG_X": "true"
  }
}
`,
  },
  {
    id: 'json-package',
    title: 'package.json shape',
    description: 'Minimal Node project manifest.',
    code: `{
  "name": "infralearn-app",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev":   "vite",
    "build": "vite build",
    "test":  "vitest"
  },
  "dependencies": {
    "react":     "^18.3.0",
    "react-dom": "^18.3.0"
  }
}
`,
  },
  {
    id: 'json-nested',
    title: 'Nested with arrays',
    description: 'Deeply-nested config payload.',
    code: `{
  "service": "billing",
  "regions": [
    {
      "name": "us-east-1",
      "endpoints": [
        { "host": "billing-1.example.com", "port": 443 },
        { "host": "billing-2.example.com", "port": 443 }
      ]
    },
    {
      "name": "eu-west-1",
      "endpoints": [
        { "host": "billing-eu.example.com", "port": 443 }
      ]
    }
  ]
}
`,
  },
];

const SANDBOX_EXAMPLES = {
  python: PYTHON,
  bash: BASH,
  yaml: YAML,
  sql: SQL,
  dockerfile: DOCKERFILE,
  json: JSON_EX,
};

export default SANDBOX_EXAMPLES;
export {
  PYTHON as pythonExamples,
  BASH as bashExamples,
  YAML as yamlExamples,
  SQL as sqlExamples,
  DOCKERFILE as dockerfileExamples,
  JSON_EX as jsonExamples,
};
