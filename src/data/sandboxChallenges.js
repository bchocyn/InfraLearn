// sandboxChallenges.js — NeetCode-style challenges for the Sandbox CHALLENGES
// mode. Each language gets 3-4 starter challenges. Test-runner support varies
// per language (Pyodide for Python is the only "real" runner v1; the others
// use syntax-only or structural checks — TODO-comments flag where real
// execution would go in v2).
//
// Shape:
//   { id, title, difficulty, prompt, starter, hiddenTests: [{ input, expected }] }
//
// For Python: `hiddenTests[i].input` is the args list passed to the user's
// solver fn (named in `solverName`); `expected` is the value it should return.

// ── PYTHON ───────────────────────────────────────────────────────────────
// Full Pyodide runner: defines fn, runs each test, compares result.
const PYTHON = [
  {
    id: 'py-sum-even',
    title: 'Sum even numbers from 1 to N',
    difficulty: 'easy',
    prompt:
      'Define a function sum_even(n) that returns the sum of all even integers from 1 to n inclusive. sum_even(10) → 30 (2+4+6+8+10).',
    solverName: 'sum_even',
    starter: `def sum_even(n):
    # Your code here. Return the sum of even ints from 1..n.
    total = 0
    return total
`,
    hiddenTests: [
      { input: [10], expected: 30 },
      { input: [1],  expected: 0 },
      { input: [2],  expected: 2 },
      { input: [100], expected: 2550 },
    ],
  },
  {
    id: 'py-fizzbuzz',
    title: 'FizzBuzz',
    difficulty: 'easy',
    prompt:
      'Define fizzbuzz(n) returning a list of strings for 1..n: "Fizz" if divisible by 3, "Buzz" if by 5, "FizzBuzz" if both, otherwise the number as a string.',
    solverName: 'fizzbuzz',
    starter: `def fizzbuzz(n):
    out = []
    for i in range(1, n + 1):
        pass  # Replace this with the rule.
    return out
`,
    hiddenTests: [
      { input: [3],  expected: ['1', '2', 'Fizz'] },
      { input: [5],  expected: ['1', '2', 'Fizz', '4', 'Buzz'] },
      { input: [15], expected: ['1','2','Fizz','4','Buzz','Fizz','7','8','Fizz','Buzz','11','Fizz','13','14','FizzBuzz'] },
    ],
  },
  {
    id: 'py-reverse',
    title: 'Reverse a string',
    difficulty: 'easy',
    prompt:
      'Define reverse_string(s) returning the string s with its characters in reverse order. reverse_string("hello") → "olleh".',
    solverName: 'reverse_string',
    starter: `def reverse_string(s):
    # Your code here.
    return s
`,
    hiddenTests: [
      { input: ['hello'], expected: 'olleh' },
      { input: [''],      expected: '' },
      { input: ['a'],     expected: 'a' },
      { input: ['ab cd'], expected: 'dc ba' },
    ],
  },
];

// ── BASH ─────────────────────────────────────────────────────────────────
// v1: syntax-only check on the user's pipeline (presence of expected
// commands + non-empty body). The real virtual-FS test runner is a v2 TODO
// — see TerminalBlock for the in-memory shell we'd re-host here.
const BASH = [
  {
    id: 'sh-recent-files',
    title: 'List files modified in last 24 hours',
    difficulty: 'easy',
    prompt:
      'Write a one-liner that prints files in the current directory modified within the last 24 hours. Use `find` with `-mtime`.',
    starter: `# Your one-liner here.
find . -type f
`,
    // v1: structural check — must use find + an -mtime flag.
    // TODO v2: run on TerminalBlock's virtual FS and diff stdout.
    syntaxCheck: {
      mustInclude: ['find', '-mtime'],
      forbid: [],
    },
  },
  {
    id: 'sh-count-errors',
    title: "Count lines containing 'ERROR'",
    difficulty: 'easy',
    prompt:
      "Count how many lines in app.log contain 'ERROR'. Use grep with the right flag (think -c) or wc -l.",
    starter: `# Count ERROR lines in app.log
grep ERROR app.log
`,
    syntaxCheck: {
      mustInclude: ['ERROR'],
      mustIncludeAny: ['grep -c', '| wc -l', 'wc -l'],
      forbid: [],
    },
  },
  {
    id: 'sh-sum-file',
    title: 'Sum integers in a file',
    difficulty: 'medium',
    prompt:
      'numbers.txt has one integer per line. Print the total. Awk one-liner preferred.',
    starter: `# Sum every integer in numbers.txt
cat numbers.txt
`,
    syntaxCheck: {
      mustIncludeAny: ['awk', 'paste -sd+'],
      forbid: [],
    },
  },
];

// ── SQL ──────────────────────────────────────────────────────────────────
// v1: structural check — required keywords + clauses present.
// TODO v2: ship sql.js (or alasql) so we can actually execute the queries
// against a seeded schema and diff result sets.
const SQL = [
  {
    id: 'sql-active-users',
    title: 'Find users with > 3 orders',
    difficulty: 'easy',
    prompt:
      "Schema: users(id, name), orders(id, user_id, total). Return each user's id, name, and order_count where the user has more than 3 orders. Sort by order_count DESC.",
    starter: `SELECT u.id, u.name
FROM users u
-- complete this query
`,
    syntaxCheck: {
      mustInclude: ['JOIN', 'GROUP BY', 'HAVING', 'COUNT'],
      mustIncludeRegex: [/HAVING\s+COUNT\s*\(.*?\)\s*>\s*3/i],
    },
  },
  {
    id: 'sql-top-products',
    title: 'Top 5 best-selling products',
    difficulty: 'easy',
    prompt:
      'Schema: products(id, name), order_items(product_id, qty). Return the top 5 products by total qty sold.',
    starter: `SELECT p.name, SUM(oi.qty) AS sold
FROM products p
-- complete this query
`,
    syntaxCheck: {
      mustInclude: ['SUM', 'GROUP BY', 'ORDER BY', 'LIMIT'],
      mustIncludeRegex: [/LIMIT\s+5/i, /ORDER\s+BY[\s\S]+DESC/i],
    },
  },
  {
    id: 'sql-never-ordered',
    title: 'Users who registered but never ordered',
    difficulty: 'medium',
    prompt:
      'Schema: users(id, name), orders(id, user_id). Return users who have zero orders. Use either LEFT JOIN + IS NULL, or NOT EXISTS.',
    starter: `SELECT u.id, u.name
FROM users u
-- complete this query
`,
    syntaxCheck: {
      mustIncludeAny: ['LEFT JOIN', 'NOT EXISTS', 'NOT IN'],
      mustIncludeAnyRegex: [/IS\s+NULL/i, /NOT\s+EXISTS/i, /NOT\s+IN/i],
    },
  },
];

// ── YAML ─────────────────────────────────────────────────────────────────
// v1: structural check on the parsed-style indented text — required keys/values.
// TODO v2: ship a proper YAML parser (js-yaml is ~30KB) and do schema-level
// validation against a target shape.
const YAML = [
  {
    id: 'yml-healthcheck',
    title: 'Add a healthcheck to this docker-compose',
    difficulty: 'easy',
    prompt:
      'The api service is missing a healthcheck. Add one that curls http://localhost:8000/health every 30s.',
    starter: `version: "3.9"
services:
  api:
    image: python:3.12-slim
    ports:
      - "8000:8000"
    # Add a healthcheck here.
`,
    syntaxCheck: {
      mustInclude: ['healthcheck:', 'test:'],
      mustIncludeAny: ['curl', 'wget'],
      mustIncludeAnyRegex: [/interval:\s*30s/i, /interval:\s*"30s"/i],
    },
  },
  {
    id: 'yml-statefulset',
    title: 'Convert this k8s Deployment to a StatefulSet',
    difficulty: 'medium',
    prompt:
      "Change kind: Deployment to StatefulSet, add a serviceName (required), and add a volumeClaimTemplates entry. Keep the rest of the spec intact.",
    starter: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: db
spec:
  replicas: 1
  selector:
    matchLabels: { app: db }
  template:
    metadata:
      labels: { app: db }
    spec:
      containers:
        - name: db
          image: postgres:16
`,
    syntaxCheck: {
      mustInclude: ['kind: StatefulSet', 'serviceName:', 'volumeClaimTemplates:'],
      forbid: ['kind: Deployment'],
    },
  },
];

const SANDBOX_CHALLENGES = {
  python: PYTHON,
  bash: BASH,
  sql: SQL,
  yaml: YAML,
};

export default SANDBOX_CHALLENGES;

// ── Lightweight syntax-only test runners (Bash / SQL / YAML) ─────────────
// Returns { passed, total, failing: [{ index, msg }] } so the UI can show
// the same per-test ✓/✗ rendering as the Python runner.
export function runSyntaxOnlyChecks(check, src) {
  const failing = [];
  let total = 0;

  if (Array.isArray(check.mustInclude)) {
    for (const token of check.mustInclude) {
      total += 1;
      const ok = src.toLowerCase().includes(token.toLowerCase());
      if (!ok) failing.push({ index: failing.length, msg: `Missing required token: \`${token}\`` });
    }
  }

  if (Array.isArray(check.forbid)) {
    for (const token of check.forbid) {
      total += 1;
      const present = src.toLowerCase().includes(token.toLowerCase());
      if (present) failing.push({ index: failing.length, msg: `Should not contain: \`${token}\`` });
    }
  }

  if (Array.isArray(check.mustIncludeAny) && check.mustIncludeAny.length) {
    total += 1;
    const any = check.mustIncludeAny.some((t) => src.toLowerCase().includes(t.toLowerCase()));
    if (!any) {
      failing.push({
        index: failing.length,
        msg: `Need at least one of: ${check.mustIncludeAny.map((t) => '`' + t + '`').join(', ')}`,
      });
    }
  }

  if (Array.isArray(check.mustIncludeRegex)) {
    for (const re of check.mustIncludeRegex) {
      total += 1;
      if (!re.test(src)) failing.push({ index: failing.length, msg: `Pattern not found: ${re}` });
    }
  }

  if (Array.isArray(check.mustIncludeAnyRegex) && check.mustIncludeAnyRegex.length) {
    total += 1;
    const any = check.mustIncludeAnyRegex.some((re) => re.test(src));
    if (!any) {
      failing.push({
        index: failing.length,
        msg: `Need at least one matching pattern from: ${check.mustIncludeAnyRegex.map(String).join(', ')}`,
      });
    }
  }

  return {
    passed: Math.max(0, total - failing.length),
    total,
    failing,
  };
}

// One-line hints, surfaced after 3 failed attempts. Map of challenge.id → hint.
export const HINTS = {
  'py-sum-even':       'Use range(2, n+1, 2) to iterate even numbers, then sum().',
  'py-fizzbuzz':       'Check `i % 15 == 0` BEFORE the 3 and 5 checks, or build the string by concatenation.',
  'py-reverse':        'Python slicing: `s[::-1]` reverses any sequence in one expression.',
  'sh-recent-files':   'find . -type f -mtime -1   (the minus before 1 = "less than 1 day old").',
  'sh-count-errors':   'grep -c "ERROR" app.log  — the -c flag prints the count directly.',
  'sh-sum-file':       "awk '{ s += $1 } END { print s }' numbers.txt",
  'sql-active-users':  'GROUP BY u.id, u.name then HAVING COUNT(o.id) > 3.',
  'sql-top-products':  'GROUP BY p.id, p.name; ORDER BY SUM(oi.qty) DESC; LIMIT 5.',
  'sql-never-ordered': 'LEFT JOIN orders ... WHERE orders.id IS NULL is the classic trick.',
  'yml-healthcheck':   'Indent healthcheck: under the api service, then test: [...] and interval: 30s.',
  'yml-statefulset':   'StatefulSet requires serviceName and (typically) volumeClaimTemplates.',
};
