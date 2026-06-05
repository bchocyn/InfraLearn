export default {
  "cs-bigo": {
    "sections": [
      {
        "heading": "What Big O actually measures",
        "body": [
          {
            "type": "p",
            "text": "**Big O** describes how an algorithm's cost **grows** as input size `n` grows. It is not a stopwatch — it ignores constants, machine speed, and small-`n` quirks. What it captures is the **shape of the curve**."
          },
          {
            "type": "p",
            "text": "When two algorithms differ in Big O class, the slower one *eventually* loses no matter how fast the hardware. The crossover may be at `n=10` or `n=10⁶`, but for any non-trivial workload, **class beats constants**."
          }
        ]
      },
      {
        "heading": "The complexity zoo",
        "body": [
          {
            "type": "p",
            "text": "Most code you write falls into one of seven classes. Memorize this table — at `n = 1,000,000` the gap between `O(log n)` and `O(n²)` is the difference between a millisecond and a **week**."
          },
          {
            "type": "table",
            "headers": [
              "Function",
              "Name",
              "Example",
              "Cost at n=1M"
            ],
            "align": [
              "left",
              "left",
              "left",
              "right"
            ],
            "rows": [
              [
                "O(1)",
                "Constant",
                "Hash lookup, array index",
                "1 op"
              ],
              [
                "O(log n)",
                "Logarithmic",
                "Binary search, BST find",
                "~20 ops"
              ],
              [
                "O(n)",
                "Linear",
                "Scan a list, sum array",
                "10⁶ ops"
              ],
              [
                "O(n log n)",
                "Linearithmic",
                "Mergesort, quicksort avg",
                "~2·10⁷ ops"
              ],
              [
                "O(n²)",
                "Quadratic",
                "Nested loop, bubble sort",
                "10¹² ops"
              ],
              [
                "O(2ⁿ)",
                "Exponential",
                "Naive subset enumeration",
                "Heat death"
              ],
              [
                "O(n!)",
                "Factorial",
                "Brute-force TSP",
                "Don't"
              ]
            ]
          },
          {
            "type": "p",
            "text": "Rule of thumb: at modern CPU speeds (~10⁹ ops/sec), **10⁸ ops/sec is your budget per request**. Anything above `O(n log n)` for `n > 10⁴` needs a second look."
          },
          {
            "type": "predict",
            "prompt": "Your function runs in `O(n²)` on a list of 1,000 items in about 1 second. A teammate hands you a list of 100,000 items. Roughly how long will it take?",
            "options": [
              "About 100 seconds — linear-ish slowdown",
              "About 10,000 seconds (~2.8 hours) — quadratic blowup",
              "About 1,000 seconds (~16 minutes) — log-linear",
              "About 1 second — Big O doesn't predict wall-clock"
            ],
            "answer": 1,
            "explain": "Quadratic means cost grows with **n squared**, not n. Input went up by 100× (1k → 100k), so ops go up by 100² = **10,000×**. 1 second × 10,000 = **10,000 seconds ≈ 2.8 hours**. This is exactly why class beats constants — your function isn't slow because of cache misses or Python overhead, it's slow because of *shape*. The fix is structural: replace the nested loop with a hash-map lookup (`O(n)`) or sort once and sweep (`O(n log n)`). No amount of micro-optimization rescues a quadratic at n=100k."
          }
        ]
      },
      {
        "heading": "How the curves diverge",
        "body": [
          {
            "type": "p",
            "text": "The diagram below shows why **shape matters more than slope at the origin**. All curves start near zero. They part ways as `n` grows — and the partings are *violent*."
          },
          {
            "type": "diagram",
            "title": "Growth curves as n increases",
            "height": 320,
            "nodes": [
              {
                "id": "const",
                "label": "O(1)",
                "subtitle": "flat forever",
                "x": 0.92,
                "y": 0.85,
                "accent": "water"
              },
              {
                "id": "log",
                "label": "O(log n)",
                "subtitle": "barely grows",
                "x": 0.92,
                "y": 0.7,
                "accent": "sky"
              },
              {
                "id": "lin",
                "label": "O(n)",
                "subtitle": "linear ramp",
                "x": 0.92,
                "y": 0.5,
                "accent": "earth"
              },
              {
                "id": "nlogn",
                "label": "O(n log n)",
                "subtitle": "the sort frontier",
                "x": 0.92,
                "y": 0.35,
                "accent": "amber"
              },
              {
                "id": "quad",
                "label": "O(n²)",
                "subtitle": "nested-loop trap",
                "x": 0.92,
                "y": 0.18,
                "accent": "fire"
              },
              {
                "id": "exp",
                "label": "O(2ⁿ)",
                "subtitle": "off the chart",
                "x": 0.92,
                "y": 0.05,
                "accent": "fire"
              },
              {
                "id": "origin",
                "label": "n = 0",
                "subtitle": "everyone starts here",
                "x": 0.05,
                "y": 0.9,
                "accent": "amber"
              }
            ],
            "edges": [
              {
                "from": "origin",
                "to": "const",
                "kind": "arc",
                "curve": 0.02,
                "accent": "water",
                "label": "flat"
              },
              {
                "from": "origin",
                "to": "log",
                "kind": "arc",
                "curve": 0.08,
                "accent": "sky",
                "label": "log"
              },
              {
                "from": "origin",
                "to": "lin",
                "kind": "arc",
                "curve": 0.18,
                "accent": "earth",
                "label": "n"
              },
              {
                "from": "origin",
                "to": "nlogn",
                "kind": "arc",
                "curve": 0.28,
                "accent": "amber",
                "label": "n log n"
              },
              {
                "from": "origin",
                "to": "quad",
                "kind": "arc",
                "curve": 0.45,
                "accent": "fire",
                "label": "n²"
              },
              {
                "from": "origin",
                "to": "exp",
                "kind": "arc",
                "curve": 0.65,
                "accent": "fire",
                "label": "2ⁿ"
              }
            ]
          }
        ]
      },
      {
        "heading": "Reading code for Big O",
        "body": [
          {
            "type": "p",
            "text": "You analyze complexity by counting **how many times the inner work runs** as a function of `n`. Sequential blocks add; nested loops multiply; halving inputs gives `log n`."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "def has_duplicate(xs):  # input size n = len(xs)\n    seen = set()  # O(1) extra per insert\n    for x in xs:  # loop runs n times\n        if x in seen:  # set lookup is O(1) avg\n            return True  # early exit, still O(n) worst\n        seen.add(x)  # amortized O(1)\n    return False  # total: O(n) time, O(n) space\n\ndef has_duplicate_slow(xs):  # same problem, worse approach\n    for i in range(len(xs)):  # outer loop: n iterations\n        for j in range(i+1, len(xs)):   # inner: shrinks but still O(n)\n            if xs[i] == xs[j]:  # n·(n-1)/2 comparisons total\n                return True  # → O(n²), the classic trap\n    return False  # space O(1), time disastrous"
          },
          {
            "type": "p",
            "text": "The fast version trades **O(n) memory** for **O(n) time**. The slow version uses no extra memory but pays `O(n²)`. This is the Big O bargain table in miniature: you almost always **buy speed with space**."
          }
        ]
      },
      {
        "heading": "Gotchas worth memorizing",
        "body": [
          {
            "type": "pros-cons",
            "goodLabel": "What Big O gets right",
            "watchLabel": "Where Big O lies to you",
            "good": [
              "Predicts behavior at scale — the class wins eventually",
              "Hardware-agnostic — survives CPU upgrades and language changes",
              "Forces you to find the dominant operation in your code",
              "Makes O(n²) nested loops jump off the page in review"
            ],
            "watch": [
              "Hides constants — a 100·n algorithm can lose to a 1·n² one for small n",
              "Ignores cache effects — `O(n)` array beats `O(log n)` tree for n < 10⁴",
              "Worst-case ≠ typical — quicksort is `O(n²)` worst but `O(n log n)` in practice",
              "Amortized vs per-op — dynamic array append is `O(1)` *amortized*, occasionally `O(n)`",
              "Says nothing about memory, I/O, or network round-trips"
            ]
          },
          {
            "type": "terms",
            "items": [
              {
                "term": "Worst case",
                "def": "Upper bound across all inputs of size `n` — what Big O usually means by default."
              },
              {
                "term": "Amortized",
                "def": "Average cost per operation across a long sequence, smoothing out occasional expensive ones."
              },
              {
                "term": "Big Θ (theta)",
                "def": "Tight bound — both upper and lower. Big O is only the ceiling."
              },
              {
                "term": "Big Ω (omega)",
                "def": "Lower bound — the algorithm can't be faster than this."
              }
            ]
          }
        ]
      },
      {
        "heading": "When it matters",
        "body": [
          {
            "type": "quote",
            "text": "Premature optimization is the root of all evil — yet we should not pass up our opportunities in that critical 3%.",
            "cite": "Donald Knuth"
          },
          {
            "type": "p",
            "text": "Big O matters most at the **boundaries**: hot paths inside a request, batch jobs over large datasets, and any loop nested inside another loop. For a 20-item config list, **readability beats asymptotics every time**."
          },
          {
            "type": "p",
            "text": "The key insight: Big O is a **lens for scaling**, not a verdict on code quality. Use it to spot the `O(n²)` lurking in a code review, then **measure** before you rewrite. The profiler is the final judge — Big O just tells you where to look."
          }
        ]
      }
    ]
  },
  "cs-recursion": {
    "sections": [
      {
        "heading": "Base case + recursive case",
        "body": [
          {
            "type": "p",
            "text": "A recursive function calls itself with a smaller input until it hits a base case."
          }
        ]
      },
      {
        "heading": "Practice — sum_to",
        "body": []
      },
      {
        "heading": "Tree-shaped problems",
        "body": [
          {
            "type": "p",
            "text": "Some problems are recursive in nature — they have the same shape at smaller scale:"
          },
          {
            "type": "ul",
            "items": [
              "Trees (DOM, file systems, decision trees)",
              "Divide and conquer (mergesort, quicksort)",
              "Backtracking (sudoku, N-queens)"
            ]
          }
        ]
      },
      {
        "heading": "Memoization",
        "body": [
          {
            "type": "p",
            "text": "Naive Fibonacci is exponential because it recomputes the same subproblems:"
          },
          {
            "type": "p",
            "text": "Cache results with `@lru_cache` and it becomes linear:"
          },
          {
            "type": "p",
            "text": "This is the heart of dynamic programming."
          }
        ]
      },
      {
        "heading": "Check",
        "body": []
      }
    ]
  },
  "sql-basics": {
    "sections": [
      {
        "heading": "Why SQL still wins",
        "body": [
          {
            "type": "p",
            "text": "**SQL** is a declarative language for asking questions about data in tables. You describe **what** you want; the database figures out **how** to get it. That separation is why SQL has outlived every framework that tried to replace it."
          },
          {
            "type": "p",
            "text": "Every query you'll write is some variation on: *pick rows, group them, summarize, join to another table, sort, limit*. Master that pipeline and 80% of analytics work collapses into one shape."
          }
        ]
      },
      {
        "heading": "The clause pipeline",
        "body": [
          {
            "type": "p",
            "text": "SQL clauses are written in one order and executed in another. **WHERE filters rows before grouping; HAVING filters groups after.** Confusing the two is the #1 beginner bug."
          },
          {
            "type": "table",
            "headers": [
              "Clause",
              "Purpose",
              "Executes"
            ],
            "align": [
              "left",
              "left",
              "center"
            ],
            "rows": [
              [
                "`FROM` / `JOIN`",
                "pick tables, combine rows",
                "1"
              ],
              [
                "`WHERE`",
                "filter individual rows",
                "2"
              ],
              [
                "`GROUP BY`",
                "bucket rows by key",
                "3"
              ],
              [
                "`HAVING`",
                "filter aggregated buckets",
                "4"
              ],
              [
                "`SELECT`",
                "choose output columns",
                "5"
              ],
              [
                "`ORDER BY`",
                "sort final result",
                "6"
              ],
              [
                "`LIMIT`",
                "cap row count",
                "7"
              ]
            ]
          },
          {
            "type": "p",
            "text": "Read top-to-bottom: that's the **logical execution order**. You write `SELECT` first but the engine resolves it almost last — which is why you can't reference a `SELECT` alias inside `WHERE`."
          }
        ]
      },
      {
        "heading": "A real query, line by line",
        "body": [
          {
            "type": "code",
            "lang": "sql",
            "text": "SELECT u.country,                          -- group key, also in GROUP BY\n       COUNT(*)         AS signups,        -- rows per bucket\n       AVG(o.total)     AS avg_order       -- aggregate from joined table\nFROM   users u                              -- driving table, aliased u\nJOIN   orders o ON o.user_id = u.id         -- inner join — drops users with 0 orders\nWHERE  u.created_at >= '2026-01-01'         -- row filter, runs BEFORE grouping\nGROUP BY u.country                          -- one row out per distinct country\nHAVING COUNT(*) >= 10                       -- drop tiny buckets — uses agg, not WHERE\nORDER BY signups DESC                       -- alias works here — SELECT already ran\nLIMIT  20;                                  -- top 20 only — keep result small"
          },
          {
            "type": "p",
            "text": "Notice `HAVING COUNT(*) >= 10` — you *cannot* put that in `WHERE` because `COUNT(*)` doesn't exist until after `GROUP BY` runs. Notice also that `ORDER BY signups` works even though `signups` is an alias: by then `SELECT` has executed."
          }
        ]
      },
      {
        "heading": "How a JOIN actually works",
        "body": [
          {
            "type": "p",
            "text": "An **INNER JOIN** matches rows where the ON-condition holds. Unmatched rows on either side are dropped. A **LEFT JOIN** keeps every row from the left table and fills `NULL` for missing right-side columns."
          },
          {
            "type": "diagram",
            "title": "users ⋈ orders ON user_id",
            "nodes": [
              {
                "id": "u",
                "label": "users",
                "subtitle": "id, country",
                "x": 0.15,
                "y": 0.5,
                "accent": "sky"
              },
              {
                "id": "j",
                "label": "JOIN",
                "subtitle": "o.user_id = u.id",
                "x": 0.5,
                "y": 0.5,
                "accent": "amber"
              },
              {
                "id": "o",
                "label": "orders",
                "subtitle": "user_id, total",
                "x": 0.85,
                "y": 0.5,
                "accent": "fire"
              },
              {
                "id": "r",
                "label": "result",
                "subtitle": "one row per match",
                "x": 0.5,
                "y": 0.9,
                "accent": "earth"
              }
            ],
            "edges": [
              {
                "from": "u",
                "to": "j",
                "kind": "solid",
                "label": "left"
              },
              {
                "from": "o",
                "to": "j",
                "kind": "solid",
                "label": "right"
              },
              {
                "from": "j",
                "to": "r",
                "kind": "dashed",
                "label": "matched rows"
              }
            ]
          },
          {
            "type": "p",
            "text": "A user with 3 orders produces **3 rows** in the join output — joins multiply. If you then `COUNT(*)`, you're counting order-rows, not users. Use `COUNT(DISTINCT u.id)` when that distinction matters."
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
                "term": "Indexes silently decide your speed",
                "def": "A query on an unindexed column scans every row; the same query on an indexed column does a B-tree lookup. Same SQL, 1000× difference."
              },
              {
                "term": "Functions on indexed columns kill the index",
                "def": "`WHERE LOWER(email) = 'x'` cannot use an index on `email` — the engine must compute `LOWER` on every row. Store normalized, or use a functional index."
              },
              {
                "term": "NULL is not equal to NULL",
                "def": "`WHERE col = NULL` is always false. Use `IS NULL` / `IS NOT NULL`. This bites every beginner exactly once."
              },
              {
                "term": "SELECT * is a code smell",
                "def": "Locks you into the current schema, ships bytes you don't need, and breaks when columns are added. Name the columns you actually want."
              },
              {
                "term": "Always EXPLAIN before you optimize",
                "def": "`EXPLAIN ANALYZE your_query` shows the real plan and row counts. Guessing why a query is slow is how you waste an afternoon."
              }
            ]
          },
          {
            "type": "quote",
            "text": "The database is smarter than you about how to run the query — but only if you let it see what you actually want.",
            "cite": "every DBA, eventually"
          }
        ]
      }
    ]
  },
  "rate-limiter": {
    "sections": [
      {
        "heading": "Summary",
        "body": [
          {
            "type": "p",
            "text": "You'll build a **token-bucket rate limiter** that runs as an atomic Redis Lua script, fronted by Python middleware. Every request consumes tokens from a **per-key bucket** (per-user, per-API-key, per-IP) that refills at a steady rate. When the bucket is empty, requests are either rejected with `429` or parked in a **fair queue** until tokens are available."
          },
          {
            "type": "p",
            "text": "Rate limiters are the **traffic cops** of distributed systems — they protect downstream services from thundering herds, enforce billing tiers, and stop one noisy tenant from starving the rest. The trick is doing it **atomically across N app servers** without a race condition leaking 10x the allowed traffic."
          },
          {
            "type": "diagram",
            "title": "Request lifecycle through the limiter",
            "nodes": [
              {
                "id": "client",
                "label": "Client",
                "subtitle": "API caller",
                "x": 0.08,
                "y": 0.5,
                "accent": "water"
              },
              {
                "id": "mw",
                "label": "Middleware",
                "subtitle": "FastAPI / ASGI",
                "x": 0.35,
                "y": 0.5,
                "accent": "sky"
              },
              {
                "id": "redis",
                "label": "Redis + Lua",
                "subtitle": "atomic bucket",
                "x": 0.65,
                "y": 0.5,
                "accent": "earth"
              },
              {
                "id": "app",
                "label": "Handler",
                "subtitle": "your business logic",
                "x": 0.92,
                "y": 0.3,
                "accent": "amber"
              },
              {
                "id": "deny",
                "label": "429 / queue",
                "subtitle": "Retry-After",
                "x": 0.92,
                "y": 0.75,
                "accent": "fire"
              }
            ],
            "edges": [
              {
                "from": "client",
                "to": "mw",
                "label": "request",
                "kind": "dashed"
              },
              {
                "from": "mw",
                "to": "redis",
                "label": "EVAL take(1)",
                "kind": "dashed"
              },
              {
                "from": "redis",
                "to": "app",
                "label": "allowed",
                "kind": "dashed"
              },
              {
                "from": "redis",
                "to": "deny",
                "label": "empty bucket",
                "kind": "dashed"
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
              "**Token-bucket Lua script** — single `EVAL` that reads, refills, decrements, and writes the bucket atomically.",
              "**Python ASGI middleware** — intercepts every request, extracts a bucket key, calls the script, returns `429` or proceeds.",
              "**Per-key budget config** — YAML mapping of tier → `capacity` and `refill_per_sec` (free: 10/min, pro: 1000/min).",
              "**Fair queueing mode** — when enabled, parks requests in a Redis sorted set and drains them as tokens regenerate.",
              "**Load-test harness** — `locust` script that hammers two keys at different rates and proves isolation.",
              "**Prometheus metrics** — counters for `allowed`, `denied`, `queued`, plus a histogram of wait time."
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
              "**Docker + Docker Compose** — to run Redis 7 and your app side-by-side locally.",
              "**Python 3.11+** with `fastapi`, `uvicorn`, `redis>=5`, `locust`, `prometheus-client`.",
              "**Redis 7** — Lua scripting and `EVALSHA` caching are core; older versions work but lack `FUNCTION` semantics.",
              "**`curl` or `httpie`** — to manually probe `/health` and the limited endpoint.",
              "**A grasp of Big-O for hashing** — bucket keys hit Redis hot, so know your `O(1)` operations.",
              "**Optional: Grafana** — if you want to visualize the Prometheus metrics live."
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
              "**Scaffold** a FastAPI app with one `/api/work` endpoint and a `docker-compose.yml` that brings up Redis 7.",
              "**Write** the token-bucket Lua script: takes `key`, `capacity`, `refill_rate`, `now`, `cost`; returns `(allowed, remaining, retry_after)`.",
              "**Load** the script on app startup with `SCRIPT LOAD`, cache the SHA, and call via `EVALSHA` on every request.",
              "**Build** middleware that extracts the bucket key (API key header, falling back to client IP) and gates the request.",
              "**Add** the `Retry-After` response header on `429` and the `X-RateLimit-Remaining` header on success.",
              "**Implement** fair-queue mode using a Redis sorted set keyed by arrival time, draining via a background task.",
              "**Instrument** Prometheus counters and a `wait_seconds` histogram; expose `/metrics`.",
              "**Load-test** with `locust`: two keys at 50 RPS and 5 RPS — verify the noisy one gets throttled and the quiet one doesn't."
            ]
          }
        ]
      },
      {
        "heading": "The Lua script (the heart of it)",
        "body": [
          {
            "type": "code",
            "lang": "lua",
            "text": "-- KEYS[1] = bucket key, ARGV = capacity, refill_per_sec, now_ms, cost\nlocal key      = KEYS[1]\nlocal cap      = tonumber(ARGV[1])           -- max tokens bucket can hold\nlocal refill   = tonumber(ARGV[2])           -- tokens added per second\nlocal now_ms   = tonumber(ARGV[3])           -- caller's clock, ms\nlocal cost     = tonumber(ARGV[4])           -- tokens this request needs\n\nlocal state = redis.call('HMGET', key, 'tokens', 'ts')  -- read prior state\nlocal tokens = tonumber(state[1]) or cap     -- new bucket starts full\nlocal last   = tonumber(state[2]) or now_ms  -- first-seen timestamp\n\nlocal delta  = math.max(0, now_ms - last) / 1000  -- seconds since last touch\ntokens = math.min(cap, tokens + delta * refill)   -- refill, clamp at cap\n\nlocal allowed = tokens >= cost               -- enough budget?\nif allowed then tokens = tokens - cost end   -- spend only if allowed\n\nredis.call('HMSET', key, 'tokens', tokens, 'ts', now_ms)  -- persist\nredis.call('PEXPIRE', key, math.ceil(cap / refill * 1000) * 2)  -- GC idle keys\n\nlocal retry_ms = allowed and 0 or math.ceil((cost - tokens) / refill * 1000)\nreturn { allowed and 1 or 0, math.floor(tokens), retry_ms }  -- to client"
          }
        ]
      },
      {
        "heading": "Success criteria",
        "body": [
          {
            "type": "ul",
            "items": [
              "Hitting `/api/work` 20 times in one second with a `capacity=10, refill=1/s` key returns exactly **10 successes and 10 `429`s**.",
              "The `429` response carries a `Retry-After` header within ±1s of the true refill time.",
              "Two API keys hammered in parallel show **independent budgets** — one being throttled does not affect the other.",
              "Killing and restarting the app process does **not reset** any bucket — state lives in Redis.",
              "At 500 RPS sustained, p99 added latency from the middleware stays under **2 ms** (Redis is on the same host).",
              "`/metrics` exposes `ratelimit_allowed_total`, `ratelimit_denied_total`, and `ratelimit_wait_seconds` and they move under load."
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
              "**Atomic by construction** — one `EVALSHA` round trip, no read-modify-write race across N app pods.",
              "**Cheap state** — one hash per active key, auto-expired when idle; Redis memory is bounded.",
              "**Tier changes are config-only** — bump `capacity`/`refill` in YAML, no script redeploy."
            ],
            "watch": [
              "**Clock skew** — passing `now_ms` from the app means N clocks; prefer `redis.call('TIME')` inside Lua for one source of truth.",
              "**`EVALSHA` NOSCRIPT** — after a Redis restart the cached SHA is gone; catch `NOSCRIPT` and fall back to `EVAL`.",
              "**Fair queue starvation** — under sustained overload the sorted set grows without bound; cap queue size and shed load."
            ]
          }
        ]
      }
    ]
  },
  "stripe-idempotency": {
    "sections": [
      {
        "heading": "The problem: networks lie",
        "body": [
          {
            "type": "p",
            "text": "Your client sends `POST /charges` for $50. The request succeeds on Stripe's side, but the response packet gets dropped. Your client times out, retries, and now the customer is charged **twice**."
          },
          {
            "type": "p",
            "text": "You cannot tell the difference between *request lost* and *response lost* from the client side. Both look identical: silence. **Retries are mandatory** for any real distributed system, which means duplicate-effect prevention is mandatory too."
          },
          {
            "type": "quote",
            "text": "At-least-once delivery is cheap. Exactly-once effects require idempotency.",
            "cite": "every payments engineer"
          }
        ]
      },
      {
        "heading": "The idempotency key contract",
        "body": [
          {
            "type": "p",
            "text": "The client generates a **UUID per logical operation** and sends it in the `Idempotency-Key` header. The server stores the result keyed by that UUID. Subsequent requests with the same key return the **cached response** — byte-identical, same status code, no re-execution."
          },
          {
            "type": "p",
            "text": "Critical: the UUID belongs to the *intent*, not the *attempt*. If your client retries the charge 5 times, all 5 requests carry the **same** UUID. A new UUID means a new charge."
          },
          {
            "type": "terms",
            "items": [
              {
                "term": "Idempotency key",
                "def": "Client-generated UUID identifying one logical operation, reused across all retries of that operation."
              },
              {
                "term": "Request fingerprint",
                "def": "Hash of request body — used to detect when a client reuses a key with different params (which must error)."
              },
              {
                "term": "Lock row",
                "def": "Database row marking the key as in-flight, preventing two concurrent retries from both executing."
              },
              {
                "term": "TTL",
                "def": "Stripe keeps keys for 24 hours; after that the key is forgotten and a retry would re-execute."
              }
            ]
          }
        ]
      },
      {
        "heading": "The retry flow",
        "body": [
          {
            "type": "sequence",
            "title": "Lost response, safe retry",
            "caption": "First call lost. Client retries with the same UUID; server replays cached 200.",
            "actors": [
              { "id": "client", "label": "Client", "accent": "water" },
              { "id": "api",    "label": "API",    "accent": "sky" },
              { "id": "store",  "label": "Store",  "accent": "earth" },
              { "id": "db",     "label": "DB",     "accent": "fire" }
            ],
            "events": [
              { "from": "client", "to": "api",    "label": "POST + key" },
              { "from": "api",    "to": "store",  "label": "miss → lock" },
              { "from": "api",    "to": "db",     "label": "charge card" },
              { "from": "api",    "to": "store",  "label": "save 200" },
              { "from": "client", "to": "api",    "label": "retry", "note": "same key", "dashed": true },
              { "from": "api",    "to": "store",  "label": "hit → replay" }
            ]
          },
          {
            "type": "p",
            "text": "Steps 1-4 happen on the first call. The response packet drops between server and client. The client retries with the **same UUID**, the server finds it in the store on step 6, and replays the cached 200 response without touching the database."
          }
        ]
      },
      {
        "heading": "Minimal idempotent endpoint",
        "body": [
          {
            "type": "p",
            "text": "**Phase 1 — claim the key inside a transaction.** A `FOR UPDATE` lock serializes concurrent retries; existing rows decide replay vs. reuse vs. in-flight."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "@app.post(\"/charges\")\ndef create_charge(req):\n    key = req.headers[\"Idempotency-Key\"]  # client-supplied UUID\n    fp  = sha256(req.body).hexdigest()  # detect mismatched reuse\n\n    with db.transaction():\n        row = db.fetch(  # SELECT ... FOR UPDATE\n            \"SELECT * FROM idem WHERE key=%s FOR UPDATE\", key\n        )\n        if row and row.fingerprint != fp:\n            return 422, \"key reused with different body\"   # contract violation\n        if row and row.status == \"done\":\n            return row.code, row.response  # replay — no side effect\n        if row and row.status == \"running\":\n            return 409, \"request in flight\"    # concurrent retry, bail\n\n        db.exec(  # claim the lock row\n            \"INSERT INTO idem(key,fingerprint,status) VALUES(%s,%s,'running')\",\n            key, fp\n        )"
          },
          {
            "type": "p",
            "text": "**Phase 2 — run the side effect, persist the result.** Future retries with the same key replay the stored response instead of charging again."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "    charge = stripe_charge(req.body)  # the actual side effect\n    resp   = {\"id\": charge.id, \"amount\": charge.amount}\n\n    db.exec(  # persist result for future retries\n        \"UPDATE idem SET status='done', code=200, response=%s WHERE key=%s\",\n        json(resp), key\n    )\n    return 200, resp"
          },
          {
            "type": "p",
            "text": "The `FOR UPDATE` row lock is what makes this safe under **concurrent retries**. Two parallel requests with the same key serialize at the database — one wins and runs the charge, the other waits and replays."
          }
        ]
      },
      {
        "heading": "Watch out for",
        "body": [
          {
            "type": "table",
            "headers": [
              "Pitfall",
              "Safe?",
              "Why"
            ],
            "rows": [
              [
                "Reusing key with different body",
                "✗",
                "Caching first response hides the change — return 422"
              ],
              [
                "Storing only the response, not the lock",
                "✗",
                "Two concurrent retries both execute before either writes"
              ],
              [
                "Generating UUID per-retry instead of per-intent",
                "✗",
                "Defeats the whole mechanism — each retry is a new charge"
              ],
              [
                "Caching errors as final responses",
                "✗",
                "A 500 from a flaky downstream gets replayed forever — only cache 2xx/4xx"
              ],
              [
                "No TTL on the key store",
                "✓",
                "Works, but unbounded growth — Stripe uses 24h"
              ]
            ]
          },
          {
            "type": "p",
            "text": "The subtle bug everyone hits: **caching the error**. If your first attempt fails with a transient 503, you must *not* save that as the final response. Either delete the lock row on failure, or only persist on success. Otherwise every future retry of that key returns a stale 503 forever."
          }
        ]
      }
    ]
  },
  "cli-todo": {
    "sections": [
      {
        "heading": "Summary",
        "body": [
          {
            "type": "p",
            "text": "You'll build a **command-line todo app** with `argparse`, persisting tasks to a JSON file on disk. The interface is small — `add`, `done`, `list`, `rm` — but the discipline is real: **idempotent operations**, **stable IDs**, **sane exit codes**, and a **pytest** suite that runs in milliseconds. This is the same shape as every batch tool, deploy script, or CLI you'll write at work."
          },
          {
            "type": "p",
            "text": "The payoff is **mechanical sympathy** for the shell. A good CLI exits `0` on success and non-zero on failure so it composes with `&&`, `||`, and `set -e`. It reads from a known store path so cron jobs and editors agree. And it survives **partial writes** — if the process dies mid-save, your tasks are still there next morning."
          },
          {
            "type": "diagram",
            "title": "todo CLI data path",
            "nodes": [
              {
                "id": "user",
                "label": "User shell",
                "subtitle": "argv",
                "x": 0.08,
                "y": 0.5,
                "accent": "water"
              },
              {
                "id": "cli",
                "label": "argparse",
                "subtitle": "subcommands",
                "x": 0.32,
                "y": 0.5,
                "accent": "sky"
              },
              {
                "id": "core",
                "label": "Store API",
                "subtitle": "add/done/list",
                "x": 0.58,
                "y": 0.5,
                "accent": "amber"
              },
              {
                "id": "disk",
                "label": "todos.json",
                "subtitle": "atomic write",
                "x": 0.86,
                "y": 0.5,
                "accent": "fire"
              }
            ],
            "edges": [
              {
                "from": "user",
                "to": "cli",
                "kind": "dashed",
                "label": "argv"
              },
              {
                "from": "cli",
                "to": "core",
                "kind": "solid",
                "label": "dispatch"
              },
              {
                "from": "core",
                "to": "disk",
                "kind": "dashed",
                "label": "write"
              },
              {
                "from": "disk",
                "to": "core",
                "kind": "dashed",
                "label": "load"
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
              "**`todo` CLI** with `add`, `done`, `list`, and `rm` subcommands wired through `argparse`.",
              "**JSON store** at `~/.todo/todos.json` with stable integer IDs that never get reused after delete.",
              "**Atomic writes** using `tempfile` + `os.replace` so a crash never corrupts the store.",
              "**Idempotent `add`** — same title twice on the same day is a no-op, not a duplicate row.",
              "**Exit codes**: `0` ok, `1` user error (bad ID), `2` argparse usage error (free from `argparse`).",
              "**pytest suite** covering happy paths, idempotency, and missing-store bootstrap."
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
              "**Python 3.11+** — for `tomllib`, modern `typing`, and `pathlib` ergonomics.",
              "**pytest** and **pytest-cov** installed in a venv (`python -m venv .venv`).",
              "A **Unix-ish shell** — bash, zsh, or PowerShell 7 — to test exit codes with `echo $?` / `$LASTEXITCODE`.",
              "**`jq`** (optional) to poke at `todos.json` from the shell while debugging.",
              "Basic comfort with `argparse` subparsers and `pathlib.Path`."
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
              "**Scaffold** a package: `todo/__init__.py`, `todo/cli.py`, `todo/store.py`, and `tests/`. Add a `pyproject.toml` with a `[project.scripts]` entry mapping `todo = \"todo.cli:main\"`.",
              "**Model the store**: a `Store` class that loads JSON from `XDG_DATA_HOME` or `~/.todo/todos.json`, bootstrapping an empty file if missing. Keep tasks as a list of `{id, title, done, created}` dicts.",
              "**Implement atomic save**: write to `todos.json.tmp` in the same directory, `os.fsync`, then `os.replace`. Same-directory rename is the only POSIX guarantee of atomicity.",
              "**Wire argparse subcommands** in `cli.py` — one subparser per verb. `add` takes a title, `done` and `rm` take an integer ID, `list` takes optional `--all` (default hides completed).",
              "**Enforce idempotency**: in `add`, hash `(title, today)` and skip insert if an open task with that key already exists. Print the existing ID so scripts can chain on output.",
              "**Map errors to exit codes**: bad ID → print to `stderr`, `sys.exit(1)`. Let `argparse` handle usage errors (it exits `2` for you).",
              "**Write tests** with `tmp_path` so each test gets a fresh store. Cover: add then list, add twice (idempotent), done then list excludes it, rm of unknown ID exits 1.",
              "**Verify end-to-end** by installing with `pip install -e .` and running `todo add \"ship lab\" && todo list` from a fresh shell."
            ]
          }
        ]
      },
      {
        "heading": "Atomic save + idempotent add",
        "body": [
          {
            "type": "p",
            "text": "**Load and save** — `os.replace` after `fsync` makes the write atomic, so a kill-9 mid-save never leaves half-written JSON."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "import json, os, tempfile, sys\nfrom datetime import date\nfrom pathlib import Path\n\nSTORE = Path(os.environ.get(\"TODO_STORE\",\n    Path.home() / \".todo\" / \"todos.json\"))  # env override for tests\n\ndef load() -> list[dict]:\n    if not STORE.exists():\n        STORE.parent.mkdir(parents=True, exist_ok=True)  # first run bootstrap\n        return []\n    return json.loads(STORE.read_text())  # trust on-disk shape\n\ndef save(tasks: list[dict]) -> None:\n    tmp = tempfile.NamedTemporaryFile(\n        \"w\", dir=STORE.parent, delete=False)  # same dir = atomic rename\n    json.dump(tasks, tmp, indent=2)\n    tmp.flush(); os.fsync(tmp.fileno())  # force bytes to disk\n    tmp.close()\n    os.replace(tmp.name, STORE)  # atomic on POSIX + NTFS"
          },
          {
            "type": "p",
            "text": "**Add and done** — `add` is idempotent per day; `done` exits non-zero on an unknown ID so shells can detect it."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "def add(title: str) -> int:\n    tasks = load()\n    today = date.today().isoformat()\n    for t in tasks:\n        if t[\"title\"] == title and t[\"created\"] == today and not t[\"done\"]:\n            return t[\"id\"]  # idempotent: return existing\n    new_id = max((t[\"id\"] for t in tasks), default=0) + 1 # monotonic, never reused\n    tasks.append({\"id\": new_id, \"title\": title,\n                  \"done\": False, \"created\": today})\n    save(tasks)\n    return new_id\n\ndef done(task_id: int) -> None:\n    tasks = load()\n    for t in tasks:\n        if t[\"id\"] == task_id:\n            t[\"done\"] = True  # mutate in place\n            save(tasks); return\n    print(f\"no task {task_id}\", file=sys.stderr)\n    sys.exit(1)  # exit 1 = user error"
          }
        ]
      },
      {
        "heading": "Success criteria",
        "body": [
          {
            "type": "ul",
            "items": [
              "`todo add \"buy milk\"` prints an ID; running it again the same day prints the **same ID** and adds no row.",
              "`todo done 3 && echo $?` prints `0`; `todo done 9999 && echo $?` prints `1` with a `stderr` message.",
              "`todo list` hides completed by default; `todo list --all` shows them with a `✓` marker.",
              "Killing the process mid-save (`kill -9` during a big write) leaves `todos.json` valid JSON, never half-written.",
              "`pytest -q` passes in under **1 second** with coverage above **90%** on `todo/store.py`.",
              "`pip install -e .` then `which todo` resolves to the venv shim, and `todo --help` shows all four subcommands."
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
              "JSON-on-disk is **debuggable** — `cat todos.json | jq` beats any GUI.",
              "Atomic rename gives you **crash safety** for free, no SQLite required.",
              "`argparse` subparsers give you `--help` per verb with zero extra code."
            ],
            "watch": [
              "`open(path, 'w')` **truncates first** — a crash mid-write loses everything. Always tmp + rename.",
              "Reusing deleted IDs breaks scripts holding references. Track a `next_id` or use `max(id)+1` always.",
              "Windows blocks `os.replace` if another process has the file open — close handles before tests assert."
            ]
          }
        ]
      }
    ]
  },
  "s1": {
    "sections": [
      {
        "heading": "The idea",
        "body": [
          {
            "type": "p",
            "text": "A **data structure** is a way of organizing values in memory so that the operations you do most often are cheap. Different structures trade off speed of inserts, lookups, ordering, and memory use."
          },
          {
            "type": "p",
            "text": "The handful you must know cold:"
          },
          {
            "type": "reveal",
            "question": "When does a dict lookup degrade from O(1)?",
            "answer": "When **too many keys hash to the same bucket**, the bucket becomes a list the dict has to scan linearly — that's the **O(n) worst case**. In practice this happens with a weak hash function, an adversarial input (hash flooding attacks), or pathological keys with colliding hashes. Python's hash randomization mitigates the attack case; for normal data, dict lookups stay amortized O(1)."
          },
          {
            "type": "ul",
            "items": [
              "**Array / List** — contiguous memory. O(1) index access. O(n) insert in the middle. Use when order matters and you mostly read.",
              "**Hash map / Dict** — key → value via a hash function. O(1) average lookup. Unordered. Use when you ask \"do I have X?\" a lot.",
              "**Set** — like a hash map but only keys. Membership tests, deduplication.",
              "**Stack** — LIFO. Push/pop from the same end. Function call frames are stacks.",
              "**Queue** — FIFO. Producer adds at one end, consumer takes from the other. Used everywhere in async systems.",
              "**Tree** — nodes with children. Binary search trees give O(log n) lookups when balanced. The filesystem is a tree.",
              "**Graph** — nodes with arbitrary edges. Social networks, dependency graphs, road maps."
            ]
          }
        ]
      },
      {
        "heading": "Why this matters",
        "body": [
          {
            "type": "p",
            "text": "Picking the wrong structure can turn a 1-second algorithm into a 1-hour one. The classic mistake: scanning a list with `if x in my_list` inside a loop. That's O(n²). Convert the list to a set first and it becomes O(n)."
          },
          {
            "type": "p",
            "text": "Interviews lean heavily on data structures because they reveal whether you can map a fuzzy real-world problem onto the right tool. \"Find duplicates\" → set. \"Most recent N items\" → deque. \"Get the smallest\" → heap. The pattern recognition is the skill."
          }
        ]
      },
      {
        "heading": "In practice",
        "body": [
          {
            "type": "p",
            "text": "You rarely implement these from scratch — every language ships them. What you need is the *cost cheat sheet* in your head:"
          },
          {
            "type": "code",
            "lang": "python",
            "text": "# Python\nlst = [1, 2, 3]    # list — O(1) append, O(n) search\nd = {'a': 1}  # dict — O(1) avg lookup\ns = {1, 2, 3}  # set — O(1) avg membership\nfrom collections import deque, Counter, defaultdict\nimport heapq  # heap (priority queue)"
          },
          {
            "type": "p",
            "text": "When stuck on a problem, ask: \"what operation am I doing most?\" Then pick the structure where that operation is cheap."
          }
        ]
      }
    ]
  },
  "s2": {
    "sections": [
      {
        "heading": "The only table you need",
        "body": [
          {
            "type": "p",
            "text": "Forget the formal definitions. In practice you're **pattern-matching**: you see a nested loop, you know it's quadratic. You see a binary search, you know it's logarithmic. That's the whole job."
          },
          {
            "type": "p",
            "text": "This lesson is a **lookup table**. Bookmark it. When a code review comment says *\"this is O(n²), fix it\"*, come back here, find the row, copy the refactor pattern."
          },
          {
            "type": "table",
            "headers": [
              "Class",
              "Name",
              "Typical example",
              "Cost at n=1,000,000"
            ],
            "align": [
              "left",
              "left",
              "left",
              "right"
            ],
            "rows": [
              [
                "O(1)",
                "Constant",
                "Hashmap lookup, array index",
                "1 op"
              ],
              [
                "O(log n)",
                "Logarithmic",
                "Binary search, B-tree descent",
                "~20 ops"
              ],
              [
                "O(n)",
                "Linear",
                "Single loop, list scan",
                "1,000,000 ops"
              ],
              [
                "O(n log n)",
                "Linearithmic",
                "Merge sort, quicksort avg",
                "~20,000,000 ops"
              ],
              [
                "O(n²)",
                "Quadratic",
                "Nested loop, bubble sort",
                "1,000,000,000,000 ops"
              ],
              [
                "O(2ⁿ)",
                "Exponential",
                "Naive recursion, subsets",
                "heat death of universe"
              ]
            ]
          },
          {
            "type": "p",
            "text": "Read that last column twice. The gap between **O(n)** and **O(n²)** at a million items is six orders of magnitude. That's the difference between *\"page loads instantly\"* and *\"page times out\"*."
          }
        ]
      },
      {
        "heading": "The O(n²) → O(n) refactor",
        "body": [
          {
            "type": "p",
            "text": "99% of the time you'll fix a perf bug, this is the move. **Nested loop becomes hashmap lookup.** Memorize the shape."
          },
          {
            "type": "h3",
            "text": "Before: quadratic"
          },
          {
            "type": "code",
            "lang": "python",
            "text": "def find_pair(nums, target):\n    for i in range(len(nums)):  # outer loop: n iterations\n        for j in range(i + 1, len(nums)): # inner loop: n iterations\n            if nums[i] + nums[j] == target:  # check every pair\n                return (nums[i], nums[j])   # found a match\n    return None  # nothing summed to target\n# Total work: n * n / 2 = O(n²)"
          },
          {
            "type": "h3",
            "text": "After: linear"
          },
          {
            "type": "code",
            "lang": "python",
            "text": "def find_pair(nums, target):\n    seen = {}  # hashmap: value -> True\n    for n in nums:  # single pass: n iterations\n        complement = target - n  # what we need to pair with n\n        if complement in seen:  # O(1) hashmap lookup\n            return (complement, n)  # found it in one pass\n        seen[n] = True  # remember this value\n    return None  # exhausted the list\n# Total work: n * 1 = O(n)"
          },
          {
            "type": "p",
            "text": "Same problem, same answer, **one million times faster** at n=1M. The trick: trade **memory** (the hashmap) for **time** (skip the inner loop). That tradeoff is the heart of most optimization."
          }
        ]
      },
      {
        "heading": "Smell tests",
        "body": [
          {
            "type": "p",
            "text": "Skim code and ask: **what shape is the work?** These triggers cover 90% of cases."
          },
          {
            "type": "terms",
            "items": [
              {
                "term": "Nested loop over same data",
                "def": "O(n²). Look for `for` inside `for` touching the same list."
              },
              {
                "term": "Loop with a `.contains()` or `in list` check",
                "def": "O(n²) in disguise. Each `in list` is itself O(n)."
              },
              {
                "term": "Divide-and-conquer / halving",
                "def": "O(log n). Binary search, tree traversal, repeated `n //= 2`."
              },
              {
                "term": "Sort followed by single pass",
                "def": "O(n log n). The sort dominates."
              },
              {
                "term": "Recursion with two self-calls and no memo",
                "def": "O(2ⁿ). Classic naive Fibonacci. Add memoization → O(n)."
              },
              {
                "term": "Hashmap or set lookup inside a loop",
                "def": "O(n). The lookup itself is O(1)."
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
            "goodLabel": "Trust these instincts",
            "watchLabel": "But also remember",
            "good": [
              "At n < 1000, even O(n²) is fine — don't over-engineer",
              "Hashmaps turn most O(n²) problems into O(n)",
              "Sorting first often unlocks a linear second pass",
              "O(log n) is essentially free — treat it like O(1)"
            ],
            "watch": [
              "`list.append` is O(1) amortized, but `list.insert(0, x)` is O(n)",
              "Python `in list` is O(n); `in set` is O(1) — huge difference",
              "String concatenation in a loop is O(n²) in many languages",
              "O(n log n) sort + O(n) scan beats O(n²) only when n is large enough to matter"
            ]
          },
          {
            "type": "quote",
            "text": "Big O tells you the shape of the curve, not the height. A well-tuned O(n²) can beat a sloppy O(n log n) at small n — but the curve always wins eventually.",
            "cite": "every senior engineer, eventually"
          }
        ]
      }
    ]
  },
  "agile-mindset-what": {
    "sections": [
      {
        "heading": "Mindset, not a methodology",
        "body": [
          {
            "type": "p",
            "text": "**Agile** is a way of working that prefers **small bets** over big plans. You ship something tiny, watch what users actually do, and let reality rewrite your roadmap. The plan is a *hypothesis*, not a contract."
          },
          {
            "type": "p",
            "text": "The opposite is **waterfall** — spec everything upfront, build for six months, ship once, pray. Waterfall assumes you can predict the future. Agile assumes you can't, so it shortens the feedback loop until guessing becomes cheap."
          },
          {
            "type": "quote",
            "text": "Ship small. Learn fast. Change course.",
            "cite": "the whole idea in six words"
          }
        ]
      },
      {
        "heading": "The four values (read them carefully)",
        "body": [
          {
            "type": "p",
            "text": "The **Agile Manifesto** lists four preferences. The crucial word is **\"over\"** — not *\"instead of\"*. Process, docs, contracts, and plans still matter. They just lose ties."
          },
          {
            "type": "table",
            "headers": [
              "Prefer this",
              "Over this",
              "Why"
            ],
            "rows": [
              [
                "Individuals & interactions",
                "Processes & tools",
                "A great team with bad tools beats the reverse"
              ],
              [
                "Working software",
                "Comprehensive docs",
                "Code that runs is the only honest spec"
              ],
              [
                "Customer collaboration",
                "Contract negotiation",
                "Requirements you wrote in January are wrong by March"
              ],
              [
                "Responding to change",
                "Following a plan",
                "The plan was based on what you knew then, not now"
              ]
            ],
            "align": [
              "left",
              "left",
              "left"
            ]
          },
          {
            "type": "p",
            "text": "Notice none of these say *\"no process\"* or *\"no docs.\"* A team that skips writing things down and calls it \"Agile\" is just disorganized."
          }
        ]
      },
      {
        "heading": "What it looks like in practice",
        "body": [
          {
            "type": "p",
            "text": "Forget the rituals for a second. The mechanics that actually matter are about **batch size** and **feedback latency**."
          },
          {
            "type": "terms",
            "items": [
              {
                "term": "Tickets sized in days",
                "def": "If a story can't be finished this week, split it. Month-long tickets hide risk and delay learning."
              },
              {
                "term": "Feature flags",
                "def": "Merge code daily, but reveal features to 1% of users first. Decoupling deploy from release is the single biggest agile lever."
              },
              {
                "term": "Short retros",
                "def": "Every 1-2 weeks the team asks: what worked, what didn't, what changes next sprint. The process itself stays under revision."
              },
              {
                "term": "Plan as hypothesis",
                "def": "The roadmap is your current best guess. When reality disagrees, reality wins — you rewrite the roadmap, not the reality."
              }
            ]
          },
          {
            "type": "code",
            "lang": "python",
            "text": "# rollout strategy — agile in one function\ndef should_show_new_checkout(user):\n    if user.id in INTERNAL_TEAM:  # dogfood first — fastest signal\n        return True\n    if FLAG_ROLLOUT_PCT == 0:  # kill switch — revert without redeploy\n        return False\n    bucket = hash(user.id) % 100  # stable per-user, no flapping\n    return bucket < FLAG_ROLLOUT_PCT  # ramp 1 → 5 → 25 → 100 over days"
          }
        ]
      },
      {
        "heading": "The litmus test",
        "body": [
          {
            "type": "p",
            "text": "Ignore the standup theater. Ask one question: **how long from a code change to a real user touching it?**"
          },
          {
            "type": "diagram",
            "title": "Code change → user feedback",
            "nodes": [
              {
                "id": "dev",
                "label": "Developer",
                "subtitle": "writes code",
                "x": 0.08,
                "y": 0.5,
                "accent": "water"
              },
              {
                "id": "ci",
                "label": "CI / Tests",
                "subtitle": "minutes",
                "x": 0.3,
                "y": 0.5,
                "accent": "sky"
              },
              {
                "id": "stage",
                "label": "Staging",
                "subtitle": "auto-deploy",
                "x": 0.52,
                "y": 0.5,
                "accent": "amber"
              },
              {
                "id": "flag",
                "label": "Feature flag",
                "subtitle": "1% rollout",
                "x": 0.74,
                "y": 0.5,
                "accent": "earth"
              },
              {
                "id": "user",
                "label": "Real user",
                "subtitle": "signal back",
                "x": 0.93,
                "y": 0.5,
                "accent": "fire"
              }
            ],
            "edges": [
              {
                "from": "dev",
                "to": "ci",
                "kind": "dashed",
                "accent": "water"
              },
              {
                "from": "ci",
                "to": "stage",
                "kind": "dashed",
                "accent": "sky"
              },
              {
                "from": "stage",
                "to": "flag",
                "kind": "dashed",
                "accent": "amber"
              },
              {
                "from": "flag",
                "to": "user",
                "kind": "dashed",
                "accent": "earth"
              },
              {
                "from": "user",
                "to": "dev",
                "kind": "arc",
                "accent": "fire",
                "label": "feedback",
                "curve": -0.4
              }
            ]
          },
          {
            "type": "ul",
            "items": [
              "**Hours** — you're genuinely agile",
              "**Days** — you're trying",
              "**Weeks** — you're doing waterfall in sprint costumes"
            ]
          }
        ]
      },
      {
        "heading": "Watch out for Agile Theater",
        "body": [
          {
            "type": "p",
            "text": "**Agile Theater** is the failure mode where a team adopts the ceremonies but none of the substance. You can spot it instantly."
          },
          {
            "type": "pros-cons",
            "goodLabel": "Actually agile",
            "watchLabel": "Theater (worse than waterfall)",
            "good": [
              "Code reaches users in hours",
              "Tickets shrink when scope grows",
              "Retros change how next sprint runs",
              "Plans get rewritten without drama"
            ],
            "watch": [
              "Daily standup, then 6 weeks of gold-plating",
              "\"Sprint\" is just a calendar word",
              "Retro action items repeat every cycle",
              "Roadmap is locked because \"we committed\""
            ]
          },
          {
            "type": "p",
            "text": "Theater is **strictly worse than waterfall** — you've added meetings *and* lost the predictability that made waterfall tolerable. If you can't ship faster than you used to, the ceremonies are tax with no return."
          },
          {
            "type": "p",
            "text": "**The point isn't the ritual. The point is the loop.** Shrink the loop, and almost any process works. Stretch the loop, and no amount of standups will save you."
          }
        ]
      }
    ]
  },

  // ─── SCRUM & KANBAN (swe — first is scrum framework) ──────────────────────
  "agile-scrum-framework": {
    "sections": [
      {
        "heading": "What Scrum is",
        "body": [
          { "type": "p", "text": "Scrum is a lightweight team framework built around fixed-length **sprints** (usually 2 weeks), three roles, three artifacts, and five events. Pick a small slice of work, commit to finishing it in the sprint, demo it, retro it, repeat. The whole thing is designed to give you a feedback loop every two weeks at the latest." }
        ]
      },
      {
        "heading": "The three roles",
        "body": [
          { "type": "ul", "items": [
            "**Product Owner** — owns the *why* and the *what*. Maintains the backlog, prioritizes ruthlessly, accepts work.",
            "**Scrum Master** — owns the *how*. Removes blockers, protects the team, facilitates events. Not a manager.",
            "**Development Team** — owns the *building*. Cross-functional, self-organizing, ideally 5-9 people."
          ]}
        ]
      },
      {
        "heading": "The three artifacts",
        "body": [
          { "type": "ul", "items": [
            "**Product Backlog** — every known want, ordered by priority. The PO's living document.",
            "**Sprint Backlog** — the slice the team committed to this sprint.",
            "**Increment** — the working software at the end of the sprint. Must meet the Definition of Done."
          ]}
        ]
      },
      {
        "heading": "The five events",
        "body": [
          { "type": "ol", "items": [
            "**Sprint** itself — the time box that contains everything else.",
            "**Sprint planning** — what we'll do, how we'll do it.",
            "**Daily standup** — 15 minutes, sync on plan and blockers.",
            "**Sprint review** — demo to stakeholders, get feedback on the increment.",
            "**Sprint retrospective** — team-only; how do we work better next time?"
          ]}
        ]
      },
      {
        "heading": "Where teams go wrong",
        "body": [
          { "type": "ul", "items": [
            "Treating standup as a status report to a manager instead of a team sync.",
            "Letting sprints run over — defeats the time-box purpose.",
            "Skipping the retro because 'we're too busy' (the only event that *changes* the team).",
            "Mid-sprint scope changes from the PO — kills the commitment."
          ]}
        ]
      }
    ]
  },

  // ─── CEREMONIES (swe — first is sprint planning) ──────────────────────────
  "agile-sprint-planning": {
    "sections": [
      {
        "heading": "What it's for",
        "body": [
          { "type": "p", "text": "Sprint planning answers two questions: **what will we deliver this sprint, and how will we build it?** The output is a Sprint Goal (one sentence describing the increment's value) and a Sprint Backlog (the work items the team commits to)." }
        ]
      },
      {
        "heading": "Inputs",
        "body": [
          { "type": "ul", "items": [
            "A prioritized, *refined* Product Backlog (stories are small enough to estimate).",
            "The team's historical **velocity** — how many points they typically complete in a sprint.",
            "Known capacity for this sprint — accounting for PTO, holidays, on-call rotations."
          ]}
        ]
      },
      {
        "heading": "The two-part meeting",
        "body": [
          { "type": "ol", "items": [
            "**Part 1 — What.** PO walks the top of the backlog. Team asks questions, splits stories, confirms acceptance criteria. Together they agree on a Sprint Goal.",
            "**Part 2 — How.** Developers decompose committed stories into tasks. They sanity-check capacity, surface dependencies, and confirm the commitment."
          ]}
        ]
      },
      {
        "heading": "Time-box",
        "body": [
          { "type": "p", "text": "Two hours per week of sprint is a healthy ceiling. A 2-week sprint → 4 hours of planning max. Going longer means the backlog wasn't refined; refine more, plan faster." }
        ]
      },
      {
        "heading": "Smells",
        "body": [
          { "type": "ul", "items": [
            "Estimating stories you've never seen before — they should have been refined last week.",
            "A Sprint Goal that's just 'finish these tickets' — no shared purpose to retro against.",
            "Stretch goals being added 'just in case' — undermines the commitment.",
            "The PO defending priority for two hours — that's backlog refinement, not planning."
          ]}
        ]
      }
    ]
  },

  // ─── ARTIFACTS & ESTIMATION (swe — first is user stories) ─────────────────
  "agile-user-stories": {
    "sections": [
      {
        "heading": "The format",
        "body": [
          { "type": "p", "text": "A user story is a short description of a feature from the perspective of someone who wants it. The classic template:" },
          { "type": "code", "lang": "txt", "text": "As a <role>,\nI want <goal>,\nso that <benefit>." },
          { "type": "p", "text": "It's deliberately conversational. The story isn't the spec — it's a placeholder for a *conversation* between the team and the product owner." }
        ]
      },
      {
        "heading": "INVEST",
        "body": [
          { "type": "p", "text": "A good story is:" },
          { "type": "ul", "items": [
            "**I**ndependent — doesn't block on another story in the same sprint.",
            "**N**egotiable — details can be discussed; it's not a fixed contract.",
            "**V**aluable — a real user (or stakeholder) would notice when it lands.",
            "**E**stimable — the team can size it without rebuilding the whole product.",
            "**S**mall — fits comfortably in a sprint.",
            "**T**estable — has acceptance criteria you can check against."
          ]}
        ]
      },
      {
        "heading": "Acceptance criteria",
        "body": [
          { "type": "p", "text": "AC turn 'this is built' into something objective. The Gherkin format works well for behavioral stories:" },
          { "type": "code", "lang": "gherkin", "text": "Given I am a logged-in user with an empty cart\nWhen I click 'Add to cart' on a product\nThen the cart icon shows 1 item\nAnd the product appears in the cart drawer" },
          { "type": "p", "text": "Bullet-list AC is fine too. The point is: when the engineer demos this in review, both sides agree on what 'done' looks like." }
        ]
      },
      {
        "heading": "Splitting stories",
        "body": [
          { "type": "p", "text": "When a story is too big for a sprint, split *vertically* (slim slice of the full stack) rather than *horizontally* (just the backend, just the UI). Each slice should be independently shippable and valuable, even if barely so." }
        ]
      },
      {
        "heading": "When stories don't fit",
        "body": [
          { "type": "p", "text": "Not every work item is a user story. Bugs are bugs. Spikes (time-boxed investigations) are spikes. Tech debt and refactors are themselves; don't contort them into the story format just because the template demands it." }
        ]
      }
    ]
  },

  // ─── AGILE × DEVOPS (devops — first is continuous) ────────────────────────
  "agile-mindset-waterfall-vs": {
    "sections": [
      {
        "heading": "What it is",
        "body": [
          {
            "type": "p",
            "text": "**Waterfall** is the old plan-everything-upfront model: gather all requirements, design the whole system, build it, test it, ship it. Each phase finishes before the next begins. You sign a 200-page spec in January and demo in December."
          },
          {
            "type": "p",
            "text": "**Agile** flips the order. You ship a thin slice every 1-2 weeks, show it to real users, then decide what to build next based on what you learned. Plans stay rough on purpose."
          }
        ]
      },
      {
        "heading": "Side by side",
        "body": [
          {
            "type": "p",
            "text": "The cleanest way to feel the difference is to look at how each one handles a *changed requirement* in month four."
          },
          {
            "type": "code",
            "lang": "txt",
            "text": "Waterfall                     Agile\n---------                     -----\nRequirements  →               Sprint 1 → demo → learn\nDesign        →               Sprint 2 → demo → learn\nBuild         →               Sprint 3 → demo → learn\nTest          →               Sprint 4 → demo → learn\nDeploy        →               (ship every sprint)\n\nChange in month 4?            Change in month 4?\n→ Change request, re-spec,    → Add to backlog, pick it\n  re-cost, slip the date.       up next sprint."
          }
        ]
      },
      {
        "heading": "When Waterfall actually wins",
        "body": [
          {
            "type": "p",
            "text": "Agile is not universally correct. Waterfall still beats Agile when the cost of being wrong late is *enormous* and requirements truly are fixed."
          },
          {
            "type": "ul",
            "items": [
              "**Regulated hardware**: pacemakers, avionics, bridges — you cannot iterate on a flying plane.",
              "**Fixed-bid contracts** where the buyer needs a signed scope to release funds.",
              "**Migrations with a known endpoint** — port system A to system B, no discovery needed."
            ]
          }
        ]
      },
      {
        "heading": "Why Agile dominates software",
        "body": [
          {
            "type": "p",
            "text": "Software requirements are almost never actually fixed. Users do not know what they want until they touch it, markets shift, and the team learns things in week 3 that invalidate the week-1 design."
          },
          {
            "type": "p",
            "text": "Agile treats that as the **default state of the world** instead of a project failure. Short loops mean wrong assumptions get caught in days, not quarters. ML systems are even worse — data drifts, models degrade, and the *thing you are building* literally changes shape between sprints."
          }
        ]
      },
      {
        "heading": "Watch out for",
        "body": [
          {
            "type": "ul",
            "items": [
              "**Fake Agile**: standups + Jira + a 200-page spec is still Waterfall wearing a costume.",
              "**No-plan Agile**: 'we're agile' is not an excuse to skip architecture for systems that need it (auth, data models, ML pipelines).",
              "**Sprint theater**: shipping a demo to the team is not the same as shipping to users. If nothing reaches production, the feedback loop is broken.",
              "**Mid-project switching**: converting a Waterfall contract to Agile halfway through usually produces the worst of both."
            ]
          }
        ]
      }
    ]
  },
  "agile-mindset-feedback-loops": {
    "sections": [
      {
        "heading": "What it is",
        "body": [
          {
            "type": "p",
            "text": "A **feedback loop** is any cycle where you ship something, observe what happens, and use that signal to decide the next move. Short loops beat smart plans. The team that learns fastest wins, not the team that guessed best on day one."
          },
          {
            "type": "p",
            "text": "In MLOps this shows up everywhere: a failing CI build, a drifting model metric, a user thumbs-down, a 3am pager. Each one is a **signal** waiting for a response."
          }
        ]
      },
      {
        "heading": "Why short loops win",
        "body": [
          {
            "type": "p",
            "text": "The cost of being wrong scales with how long you stay wrong. A bad assumption caught in 10 minutes costs a coffee. The same assumption caught after a quarter costs a roadmap."
          },
          {
            "type": "p",
            "text": "Short loops also compound. If your deploy loop is 5 minutes instead of 5 hours, you make **60x more decisions per week**. More decisions means more learning, even if each individual call is no smarter."
          },
          {
            "type": "ul",
            "items": [
              "**Build → Test → Deploy**: minutes, not days",
              "**Train → Eval → Promote**: hours, not weeks",
              "**Release → Monitor → Rollback**: seconds, not Mondays"
            ]
          }
        ]
      },
      {
        "heading": "The loops that matter in MLOps",
        "body": [
          {
            "type": "p",
            "text": "Not all loops are equal. Map them by **latency** (how fast you get the signal) and **fidelity** (how much you trust it)."
          },
          {
            "type": "ol",
            "items": [
              "**Unit tests** — milliseconds, high fidelity for logic, blind to data",
              "**Offline eval** — minutes, high fidelity for model quality on known slices",
              "**Shadow / canary** — hours, real traffic, no user impact",
              "**A/B test** — days, ground truth on the metric you actually care about",
              "**Production monitoring** — continuous, catches drift the eval set missed"
            ]
          },
          {
            "type": "p",
            "text": "Invest in the **fastest loop that still tells the truth** about the decision in front of you. Don't run a week-long A/B to pick a logging library."
          }
        ]
      },
      {
        "heading": "Make the loop tighter",
        "body": [
          {
            "type": "p",
            "text": "Treat loop latency as a first-class metric. Track it. Cut it."
          },
          {
            "type": "code",
            "lang": "yaml",
            "text": "# .github/workflows/ml-ci.yml\non: [pull_request]\njobs:\n  fast-loop:\n    steps:\n      - run: pytest tests/unit  # ◇ seconds\n      - run: python eval/smoke.py    # ◇ ~1 min, tiny slice\n      - run: dvc repro train.dvc  # ▶ only on label: full-train\n  signal:\n    steps:\n      - run: echo \"eval_auc=$(cat metrics.json | jq .auc)\" >> $GITHUB_STEP_SUMMARY"
          },
          {
            "type": "ul",
            "items": [
              "**Cache aggressively** — datasets, base images, embeddings",
              "**Subsample for the inner loop** — full eval runs nightly, not per PR",
              "**Fail loud, fail fast** — a green check that hides a regression is worse than a red one"
            ]
          }
        ]
      },
      {
        "heading": "Watch out for",
        "body": [
          {
            "type": "p",
            "text": "**Fake loops.** A CI pipeline that always passes isn't a feedback loop, it's decoration. If nothing has failed in a month, your tests are asleep."
          },
          {
            "type": "p",
            "text": "**Loops with no owner.** A monitoring dashboard nobody reads is a loop that's been cut. Every signal needs a human or an automation on the other end."
          },
          {
            "type": "p",
            "text": "**Optimizing the wrong loop.** Shaving the unit-test loop from 30s to 10s is cute. Shaving the **model-promotion loop** from 3 weeks to 3 days is transformative. Find the slowest loop on the critical path and attack that one."
          }
        ]
      }
    ]
  },
  "agile-kanban": {
    "sections": [
      {
        "heading": "What it is",
        "body": [
          {
            "type": "p",
            "text": "**Kanban** is a pull-based flow system. Work moves across a board — *Backlog → In Progress → Review → Done* — and team members **pull** the next card only when they have capacity, instead of being assigned a fixed batch every two weeks."
          },
          {
            "type": "p",
            "text": "Unlike Scrum, there are no sprints, no story points, and no fixed ceremonies. The board is the source of truth, and the goal is **continuous delivery** with predictable cycle time."
          }
        ]
      },
      {
        "heading": "The core rules",
        "body": [
          {
            "type": "p",
            "text": "Kanban is deceptively simple. You only need three things to run it:"
          },
          {
            "type": "ul",
            "items": [
              "**Visualize the work** — every task is a card on a column. If it's not on the board, it doesn't exist.",
              "**Limit WIP** — each column has a hard cap (e.g. *In Progress ≤ 3*). You can't start new work until something finishes.",
              "**Manage flow** — measure how long cards take from pull to done, and attack the bottleneck."
            ]
          },
          {
            "type": "p",
            "text": "That's it. No roles to assign, no estimation rituals. The discipline lives in the **WIP limits**."
          }
        ]
      },
      {
        "heading": "Why WIP limits matter",
        "body": [
          {
            "type": "p",
            "text": "Without a cap, every engineer juggles five tickets, context-switches constantly, and ships nothing. WIP limits force the team to **finish before starting**, which is the single biggest lever on throughput."
          },
          {
            "type": "p",
            "text": "When a column hits its limit, the whole team swarms the blocker. A stalled *Review* column means reviewers are the constraint — pair up and clear it before pulling new work. This is **Little's Law** in practice: `cycle time = WIP / throughput`. Cut WIP, cut cycle time."
          },
          {
            "type": "kanban",
            "caption": "Little's Law in practice: cycle time = WIP / throughput",
            "columns": [
              { "name": "Backlog",     "wip": null, "items": ["TASK-9", "TASK-8", "TASK-7"] },
              { "name": "In Progress", "wip": 3,    "items": ["TASK-4", "TASK-5", "TASK-6"] },
              { "name": "Review",      "wip": 2,    "items": ["TASK-2", "TASK-3"] },
              { "name": "Done",        "wip": null, "items": ["TASK-1"] }
            ]
          }
        ]
      },
      {
        "heading": "Kanban vs Scrum",
        "body": [
          {
            "type": "p",
            "text": "Both are agile, but they optimize for different things. Pick based on the **shape of your work**, not team preference."
          },
          {
            "type": "ul",
            "items": [
              "**Scrum** — fixed sprints, planned scope, good for *feature delivery* with stable priorities.",
              "**Kanban** — continuous flow, reactive scope, good for *ops/SRE/support* work where priorities shift hourly.",
              "**Scrumban** — sprints for planning cadence, Kanban board and WIP limits for execution. Common hybrid for ML platform teams."
            ]
          }
        ]
      },
      {
        "heading": "When to use it",
        "body": [
          {
            "type": "p",
            "text": "Reach for Kanban when work arrives **unpredictably** — incident response, ML model monitoring, data pipeline maintenance, customer-driven bug fixes. Sprints feel artificial when half your tickets are interrupts."
          },
          {
            "type": "p",
            "text": "**Watch out for** the temptation to skip WIP limits because they feel restrictive. A Kanban board without limits is just a *to-do list*. Also track **cycle time** weekly — if it creeps up, your bottleneck has moved and the column caps need retuning."
          }
        ]
      }
    ]
  },
  "agile-scrumban": {
    "sections": [
      {
        "heading": "What it is",
        "body": [
          {
            "type": "p",
            "text": "**Scrumban** is a pragmatic mash-up: keep Scrum's cadence and roles where they help, swap the rigid sprint backlog for a **Kanban pull system** with WIP limits. You stop committing to a fixed scope every two weeks and start continuously pulling the next-highest-priority card when capacity frees up."
          },
          {
            "type": "p",
            "text": "Most teams arrive here by accident. Scrum feels too ceremonial for ops-heavy work; pure Kanban feels too loose for product planning. Scrumban is what you get when you delete the parts that hurt."
          }
        ]
      },
      {
        "heading": "How it works",
        "body": [
          {
            "type": "p",
            "text": "You keep the **board**, **standup**, and **retro**. You usually keep a **product owner** to order the backlog. You drop the sprint commitment, story points (often), and the sprint planning ritual — replaced by a lightweight **replenishment meeting** when the ready queue runs low."
          },
          {
            "type": "ul",
            "items": [
              "**WIP limits** per column — typically `In Progress ≤ 3`, `Review ≤ 2`",
              "**Pull, don't push** — finish before you start",
              "**Cycle time** replaces velocity as the core metric",
              "**Triggers** (not dates) drive planning: when `Ready` drops below N, replenish"
            ]
          },
          {
            "type": "code",
            "lang": "yaml",
            "text": "board:\n  columns:\n    - { name: Backlog,     wip: ∞ }\n    - { name: Ready,       wip: 5, trigger_replenish_at: 2 }\n    - { name: In Progress, wip: 3 }\n    - { name: Review,      wip: 2 }\n    - { name: Done,        wip: ∞ }\ncadence:\n  standup: daily\n  replenishment: on_trigger\n  retro: biweekly"
          },
          {
            "type": "kanban",
            "title": "Mid-week snapshot",
            "caption": "Review is at cap — swarm before pulling more",
            "columns": [
              { "name": "Backlog",     "wip": null, "items": ["INFRA-42", "INFRA-39", "INFRA-37"] },
              { "name": "Ready",       "wip": 5,    "items": ["INFRA-33", "INFRA-31"] },
              { "name": "In Progress", "wip": 3,    "items": ["INFRA-28", "INFRA-26", "INFRA-25"] },
              { "name": "Review",      "wip": 2,    "items": ["INFRA-22", "INFRA-21"] },
              { "name": "Done",        "wip": null, "items": ["INFRA-19", "INFRA-18"] }
            ]
          }
        ]
      },
      {
        "heading": "Other useful hybrids",
        "body": [
          {
            "type": "p",
            "text": "Scrumban is the famous one, but the pattern generalizes. Pick the smallest set of rituals that solves your actual problem."
          },
          {
            "type": "ul",
            "items": [
              "**Scrum + XP** — Scrum cadence with engineering practices (`TDD`, pair programming, CI)",
              "**Kanban + SLEs** — Kanban with **service level expectations** (\"85% of tickets done in ≤ 5 days\")",
              "**Dual-track agile** — discovery track (Kanban) feeds delivery track (Scrum)",
              "**SAFe / LeSS** — Scrum scaled across many teams (heavier; use only when org demands it)"
            ]
          }
        ]
      },
      {
        "heading": "When to use it",
        "body": [
          {
            "type": "p",
            "text": "Reach for **Scrumban** when your team does a mix of planned feature work and unplanned interrupts — classic **MLOps**, **platform**, and **SRE** territory. Pure Scrum breaks the moment a sprint gets blown up by a production incident; Scrumban absorbs it."
          },
          {
            "type": "p",
            "text": "Stick with **pure Scrum** if you're building a greenfield product with a stable team and need forced learning loops. Stick with **pure Kanban** if work arrives continuously with no meaningful planning horizon (support, ops-only teams)."
          }
        ]
      },
      {
        "heading": "Watch out for",
        "body": [
          {
            "type": "ul",
            "items": [
              "**Cargo-culting the board** — copying columns without enforcing WIP limits gives you Scrum with extra steps",
              "**Dropping retros** — the one ritual you must keep; it's how the hybrid keeps evolving",
              "**No definition of ready** — without it, cards stall in `In Progress` waiting on clarifications",
              "**Metric drift** — if leadership still asks for velocity, you haven't actually switched"
            ]
          },
          {
            "type": "p",
            "text": "The point of a hybrid isn't to be clever. It's to **remove the ceremony that isn't paying for itself** while keeping the feedback loops that are. Audit every ritual quarterly: does it change a decision? If no, cut it."
          }
        ]
      }
    ]
  },
  "agile-daily-standup": {
    "sections": [
      {
        "heading": "What it is",
        "body": [
          {
            "type": "p",
            "text": "A **15-minute** time-boxed sync the dev team runs at the **same time, same place, every working day**. Not a status report to the manager — it's the team coordinating with itself."
          },
          {
            "type": "p",
            "text": "Each person answers three prompts: **what I did since yesterday**, **what I'll do today**, **what's blocking me**. Stand up so the meeting stays short."
          }
        ]
      },
      {
        "heading": "How it runs",
        "body": [
          {
            "type": "p",
            "text": "Walk the **board right-to-left** — start with tickets closest to *Done* and pull them across. This focuses the team on finishing work, not starting more."
          },
          {
            "type": "ul",
            "items": [
              "**Time-box:** hard stop at 15 minutes, no exceptions",
              "**Cadence:** daily, ideally first thing — locks in the day's plan",
              "**Audience:** dev team owns it; PO and stakeholders are silent observers",
              "**Blockers:** name them out loud, park the fix for after standup"
            ]
          },
          {
            "type": "code",
            "lang": "txt",
            "text": "Yesterday  ▶  finished auth refactor PR #482\nToday      ▶  start rate-limit middleware\nBlockers   ✓  none  /  ◇  waiting on infra for staging DB"
          }
        ]
      },
      {
        "heading": "The anti-patterns",
        "body": [
          {
            "type": "p",
            "text": "Standup dies the moment it becomes a **status meeting for the manager**. If people are reporting *up* instead of coordinating *across*, you've lost the point."
          },
          {
            "type": "ul",
            "items": [
              "**Solving** blockers in the meeting — take it offline with the two people who care",
              "**Round-robin** by seat order instead of walking the board",
              "**Skipping** when sprint goal feels safe — that's exactly when drift starts",
              "Letting it **stretch to 30 minutes** because \"we had a lot to discuss\""
            ]
          }
        ]
      },
      {
        "heading": "Why it matters",
        "body": [
          {
            "type": "p",
            "text": "Standup is your **cheapest feedback loop** on sprint goal risk. Fifteen minutes a day surfaces blockers while they cost hours to fix instead of days."
          },
          {
            "type": "p",
            "text": "When it's working, you'll feel it: the team **self-organizes** around the goal, blockers get owners within minutes, and nobody is surprised at sprint review. When it's not, the standup itself is the smell — fix the team's coordination problem, not the meeting format."
          }
        ]
      }
    ]
  },
  "agile-backlog-refinement": {
    "sections": [
      {
        "heading": "What it is",
        "body": [
          {
            "type": "p",
            "text": "**Backlog refinement** is the ongoing act of grooming your product backlog so the top items are **ready** to pull into a sprint. You break down epics, clarify acceptance criteria, estimate effort, and reorder by priority."
          },
          {
            "type": "p",
            "text": "It is not a one-off meeting — it is a *continuous* activity. Most teams reserve a recurring slot (often 1-2 hours per week) but refinement happens any time the PO, devs, or QA touch a story."
          }
        ]
      },
      {
        "heading": "How it works",
        "body": [
          {
            "type": "p",
            "text": "The **Product Owner** brings forward the next chunk of upcoming work. The team interrogates each item until it passes the **Definition of Ready**."
          },
          {
            "type": "ul",
            "items": [
              "**Slice** epics into stories small enough to finish in one sprint",
              "**Clarify** acceptance criteria — write them as `Given / When / Then`",
              "**Estimate** with story points or t-shirt sizes",
              "**Surface** dependencies, risks, and missing designs early",
              "**Reorder** by value, urgency, and unblock-impact"
            ]
          }
        ]
      },
      {
        "heading": "A ready story",
        "body": [
          {
            "type": "p",
            "text": "A refined story is **INVEST**-compliant: Independent, Negotiable, Valuable, Estimable, Small, Testable. If the team cannot estimate it, it is not ready."
          },
          {
            "type": "code",
            "lang": "txt",
            "text": "Story: Retry failed model deploys\n\nAs an MLOps engineer\nI want failed deploys to retry with backoff\nSo that transient registry errors do not page me\n\nAcceptance:\n  Given a deploy fails with a 5xx from the registry\n  When the controller sees the failure\n  Then it retries up to 3 times with 2^n second backoff\n  And emits a metric deploy_retry_total\n\nEstimate: 5 points    Depends on: #482 (metrics pipeline)"
          }
        ]
      },
      {
        "heading": "Why it matters",
        "body": [
          {
            "type": "p",
            "text": "Sprint planning collapses when the backlog is a swamp of vague tickets. Refinement front-loads the *thinking* so planning is just **selection**, not discovery."
          },
          {
            "type": "ul",
            "items": [
              "**Predictability** — sized, sliced stories make velocity meaningful",
              "**Throughput** — devs start coding on day one, not day three",
              "**Shared context** — the whole team hears the *why* before committing"
            ]
          }
        ]
      },
      {
        "heading": "Watch out for",
        "body": [
          {
            "type": "p",
            "text": "Refinement rots in two directions. Too little, and planning becomes a debate club. Too much, and you waterfall-design stories that will never get built."
          },
          {
            "type": "ul",
            "items": [
              "**Refining too deep** — do not spec stories more than ~2 sprints out; requirements drift",
              "**PO monologue** — if only the Product Owner talks, you are getting handoffs, not refinement",
              "**Estimation theatre** — points exist to expose disagreement, not to hit a number",
              "**Skipping it** — \"we'll figure it out in planning\" is how sprints overflow"
            ]
          }
        ]
      }
    ]
  },
  "agile-review-retro": {
    "sections": [
      {
        "heading": "What it is",
        "body": [
          {
            "type": "p",
            "text": "At the end of every sprint you run **two distinct meetings**, back to back. The **sprint review** is about the *product* — you demo working software to stakeholders and inspect what got built. The **retrospective** is about the *team* — you inspect how you built it and pick one or two things to change."
          },
          {
            "type": "p",
            "text": "Confusing them is the single most common ceremony mistake. Review faces outward; retro faces inward. Different audience, different artifacts, different outcomes."
          }
        ]
      },
      {
        "heading": "Sprint review",
        "body": [
          {
            "type": "p",
            "text": "Invite the **Product Owner**, the dev team, and **real stakeholders** — users, sales, support, whoever cares. Skip the slides. Show the increment running against the acceptance criteria."
          },
          {
            "type": "ul",
            "items": [
              "**Demo, don't describe** — click through the actual feature on a real environment",
              "**Walk the backlog** — what's done, what slipped, what's next",
              "**Capture feedback live** — new stories go straight into the backlog",
              "**Re-forecast** — if priorities shifted, the PO reorders before planning"
            ]
          },
          {
            "type": "p",
            "text": "Timebox: about **1 hour per week of sprint**. A 2-week sprint gets a 2-hour review, max."
          }
        ]
      },
      {
        "heading": "Retrospective",
        "body": [
          {
            "type": "p",
            "text": "Team only — no stakeholders, no managers dropping in. Psychological safety is the whole point. A common structure is **Set the stage → Gather data → Generate insights → Decide what to do → Close**."
          },
          {
            "type": "p",
            "text": "Rotate the format so it doesn't go stale. *Start/Stop/Continue*, *Mad/Sad/Glad*, *4Ls* (Liked, Learned, Lacked, Longed-for), or a *sailboat* (wind, anchors, rocks) all work. The format is a prompt, not the product."
          },
          {
            "type": "p",
            "text": "Output is **one or two concrete actions** with an owner and a due date — ideally pulled into the next sprint backlog as a real ticket. Vague resolutions like \"communicate better\" die quietly."
          }
        ]
      },
      {
        "heading": "A simple retro board",
        "body": [
          {
            "type": "kanban",
            "title": "Sprint 13 retro",
            "columns": [
              { "name": "Went well",     "wip": null, "items": ["deploy automated", "pairing on auth", "clear AC on #421"] },
              { "name": "Didn't go well", "wip": null, "items": ["flaky e2e tests", "PR reviews >24h", "standup running long"] },
              { "name": "Actions",        "wip": null, "items": ["Priya: add CI retry (Sprint 14)", "Marcus: 2-min timer in standup"] }
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
              "**Demo theater** — fake data or pre-recorded clips. If it doesn't run, it isn't done.",
              "**Blame retro** — naming individuals instead of systems. Attack the process, not people.",
              "**Action graveyard** — same items resurface every sprint. If an action isn't a backlog ticket with an owner, it won't happen.",
              "**Skipping when busy** — the sprint you're \"too busy\" for retro is the sprint you most need it.",
              "**Manager attendance at retro** — kills candor. They get the actions, not the transcript."
            ]
          },
          {
            "type": "p",
            "text": "Done right, review keeps you building the *right thing* and retro keeps you building it *the right way*. Drop either one and the sprint loop quietly breaks."
          }
        ]
      }
    ]
  },
  "agile-story-points-velocity": {
    "sections": [
      {
        "heading": "What it is",
        "body": [
          {
            "type": "p",
            "text": "**Story points** are a relative estimate of effort, complexity, and uncertainty — not hours. A 3-point story is roughly three times the work of a 1-point story, regardless of who picks it up."
          },
          {
            "type": "p",
            "text": "**Velocity** is the sum of points your team actually *completes* per sprint. Average the last 3-5 sprints and you have a forecasting tool that's far more honest than a Gantt chart."
          }
        ]
      },
      {
        "heading": "How estimation works",
        "body": [
          {
            "type": "p",
            "text": "Teams estimate together, usually with **planning poker** on a modified Fibonacci scale: `1, 2, 3, 5, 8, 13, 20, ?`. The gaps widen on purpose — once a story feels bigger than 8, precision is a lie."
          },
          {
            "type": "p",
            "text": "Anchor on a **reference story** everyone agrees is a 2 or 3. Every new story gets compared to it. If two people pick wildly different numbers, that's the signal — discuss the hidden assumption, then re-vote."
          },
          {
            "type": "code",
            "lang": "txt",
            "text": "Scale:     1   2   3   5   8   13   20   ?\nReference: \"Add a logout button\" = 2\nNew story: \"Add SSO via Okta\"   = 13   (auth flow + infra unknowns)"
          }
        ]
      },
      {
        "heading": "How velocity works",
        "body": [
          {
            "type": "p",
            "text": "At sprint end, sum the points of stories that hit your **Definition of Done**. Partial credit is forbidden — a 5-point story that's 80% done counts as zero. This is what keeps velocity an honest signal."
          },
          {
            "type": "p",
            "text": "Forecast capacity for the next sprint as the **rolling average** of recent velocities. If your team averages 28 points and the backlog top has 32 points of must-haves, something gets cut now, not in week two."
          },
          {
            "type": "code",
            "lang": "txt",
            "text": "Sprint  Completed\n  21       26\n  22       30\n  23       28\n  24       29\nAvg(last 4) = 28.25  →  plan ~28 next sprint"
          }
        ]
      },
      {
        "heading": "Watch out for",
        "body": [
          {
            "type": "ul",
            "items": [
              "**Points as a productivity KPI.** The moment leadership tracks velocity per dev, teams inflate estimates. Velocity is a *planning* tool, not a performance review.",
              "**Cross-team comparison.** Team A's 8 is not Team B's 8. Comparing velocities across teams is meaningless and corrosive.",
              "**Converting points to hours.** Doing this defeats the entire purpose — you've just reinvented time estimates with extra steps.",
              "**Ignoring the `?` card.** If anyone plays `?`, the story isn't ready. Spike it, split it, or send it back to refinement."
            ]
          }
        ]
      },
      {
        "heading": "Why it matters",
        "body": [
          {
            "type": "p",
            "text": "Points and velocity give you a **probabilistic forecast** instead of a false-precision deadline. You can tell a stakeholder \"this 90-point epic lands in roughly 3-4 sprints\" and be right far more often than \"it ships March 14.\""
          },
          {
            "type": "p",
            "text": "Used well, they surface scope creep early, force conversations about uncertainty, and let the team commit to work they can actually finish. Used badly, they become theater. The discipline is in what you *don't* measure."
          }
        ]
      }
    ]
  },
  "agile-mvp-incremental": {
    "sections": [
      {
        "heading": "What it is",
        "body": [
          {
            "type": "p",
            "text": "An **MVP** (*Minimum Viable Product*) is the smallest thing you can ship that delivers **real value** to a real user and teaches you something you couldn't learn from a spec. It is not a prototype, not a demo, not version 0.1 of your dream feature — it is a working slice of the product, end to end."
          },
          {
            "type": "p",
            "text": "**Incremental delivery** is the habit you build around the MVP: ship a thin slice, learn, then ship the next thin slice. Each increment is **potentially shippable** — releasable to production today, even if you choose not to."
          }
        ]
      },
      {
        "heading": "Slice the cake, don't bake the layers",
        "body": [
          {
            "type": "p",
            "text": "The classic trap is **horizontal slicing**: build the whole database this sprint, the whole API next sprint, the UI after that. Three sprints in, you have nothing a user can touch."
          },
          {
            "type": "p",
            "text": "Instead, slice **vertically**. Pick one user journey and build a thin path through every layer — DB row, endpoint, button, ship it. Ugly is fine. Narrow is fine. Working end-to-end is non-negotiable."
          },
          {
            "type": "code",
            "lang": "txt",
            "text": "Horizontal (bad):       Vertical (good):\n\n  [   UI   ]   sprint 3    [U][ ][ ][ ]\n  [  API   ]   sprint 2    [A][ ][ ][ ]\n  [   DB   ]   sprint 1    [D][ ][ ][ ]\n               ▶                ▶ ship each column"
          }
        ]
      },
      {
        "heading": "What makes a slice an MVP",
        "body": [
          {
            "type": "p",
            "text": "An MVP is defined by what it lets you **learn**, not what it lets you demo. Before you cut scope, write down the **riskiest assumption** — the thing that would kill the product if wrong — and design the MVP to test exactly that."
          },
          {
            "type": "ul",
            "items": [
              "**One** user, **one** job, **one** path. No settings page. No admin panel.",
              "**Manual** is allowed. Stripe webhook not wired up? Process refunds by hand for the first 20 users.",
              "**Ugly** is allowed. Default Bootstrap, hardcoded copy, no dark mode.",
              "**Real** is required. If no one can actually use it, it's not an MVP — it's a mockup."
            ]
          }
        ]
      },
      {
        "heading": "How increments compound",
        "body": [
          {
            "type": "p",
            "text": "Each increment should leave the product in a **releasable** state and answer one question: *was the last bet right?* If yes, double down. If no, pivot before you've spent another month."
          },
          {
            "type": "code",
            "lang": "yaml",
            "text": "increment_1:\n  ship: \"signup + 1 lesson, hardcoded content\"\n  learn: \"do people finish a lesson?\"\n  decision: \"completion ≥ 40% → build lesson #2\"\n\nincrement_2:\n  ship: \"5 lessons + progress bar\"\n  learn: \"do they come back day 2?\"\n  decision: \"D1 retention ≥ 25% → add notifications\""
          }
        ]
      },
      {
        "heading": "Watch out for",
        "body": [
          {
            "type": "ul",
            "items": [
              "**Minimum Marketable Product creep** — *\"we can't ship without SSO / i18n / dark mode\"*. Push back. Ship without it and measure the complaints.",
              "**The forever-MVP** — calling something an MVP for 18 months so you never have to maintain it. After 2-3 increments, it's the product. Treat it like one.",
              "**Vanity increments** — refactors, infra, redesigns that ship no user-visible change. Fine occasionally, but they don't count as learning increments.",
              "**Skipping the learning step** — shipping fast but never reading the metrics. Speed without feedback is just **expensive guessing**."
            ]
          }
        ]
      }
    ]
  },
  // Agile (devops) stubs
  "sd-cache-layers": {
    "sections": [
      {
        "heading": "The library you keep forgetting about",
        "body": [
          {
            "type": "p",
            "text": "**Picture a research library.** The reference desk keeps the ten most-asked books on a cart behind the counter. The main floor has the popular shelves. The basement archive holds everything else, and a courier fetches from the warehouse across town when even that fails."
          },
          {
            "type": "p",
            "text": "That's your stack. The cart is your **process-local cache**. The main floor is **Redis**. The archive is your **database**. The courier is a slow upstream API. Every layer trades freshness for latency, and every layer has its own way of lying to you."
          },
          {
            "type": "diagram",
            "title": "Cache-aside / lazy load",
            "height": 200,
            "nodes": [
              { "id": "client", "label": "Client",   "subtitle": "request",                "accent": "water", "x": 0.10, "y": 0.50 },
              { "id": "app",    "label": "App",      "subtitle": "decides flow",           "accent": "sky",   "x": 0.40, "y": 0.50 },
              { "id": "cache",  "label": "Cache",    "subtitle": "redis · in-memory",      "accent": "earth", "x": 0.80, "y": 0.22 },
              { "id": "db",     "label": "Database", "subtitle": "postgres · truth",       "accent": "fire",  "x": 0.80, "y": 0.78 }
            ],
            "edges": [
              { "from": "client", "to": "app",  "kind": "solid" },
              { "from": "app",    "to": "cache","kind": "dashed", "accent": "earth", "label": "1. check", "curve": 0.35 },
              { "from": "app",    "to": "db",   "kind": "dashed", "accent": "fire",  "label": "2. miss",  "curve": 0.35 }
            ]
          },
          {
            "type": "pros-cons",
            "good": [
              "Easy to add to any existing app",
              "Cache failures degrade gracefully",
              "You control the policy per call site"
            ],
            "watch": [
              "Misses pay full DB latency",
              "Forgotten invalidation = stale data",
              "Thundering herd risk on TTL expiry"
            ]
          }
        ]
      },
      {
        "heading": "Invalidation strategies",
        "body": [
          {
            "type": "p",
            "text": "As soon as you add a cache, you have to decide *when* to keep data and *when* to evict it. Your choice is the difference between a fast app and a confused one."
          },
          {
            "type": "diagram",
            "title": "Variants",
            "rows": [
              {
                "label": "WRITE-THROUGH",
                "nodes": [
                  { "id": "w1", "label": "Write", "accent": "sky",   "x": 0.10, "y": 0.5 },
                  { "id": "c1", "label": "Cache", "accent": "earth", "x": 0.50, "y": 0.5 },
                  { "id": "d1", "label": "DB",    "accent": "fire",  "x": 0.85, "y": 0.5 }
                ],
                "edges": [
                  { "from": "w1", "to": "c1", "kind": "solid" },
                  { "from": "c1", "to": "d1", "kind": "solid" }
                ]
              },
              {
                "label": "WRITE-BEHIND",
                "nodes": [
                  { "id": "w2", "label": "Write", "accent": "sky",   "x": 0.10, "y": 0.5 },
                  { "id": "c2", "label": "Cache", "accent": "earth", "x": 0.50, "y": 0.5 },
                  { "id": "d2", "label": "DB",    "accent": "fire",  "x": 0.85, "y": 0.5 }
                ],
                "edges": [
                  { "from": "w2", "to": "c2", "kind": "solid" },
                  { "from": "c2", "to": "d2", "kind": "dashed", "accent": "fire", "label": "async" }
                ]
              }
            ]
          },
          {
            "type": "terms",
            "items": [
              { "term": "TTL (time to live)", "def": "Set a timer when data enters the cache. When the timer expires, the data is evicted. Dead simple, but can serve stale data for the full TTL if someone writes during that window." },
              { "term": "Write-through",      "def": "Every write updates both the cache and the database. Reads are always fresh, but writes now pay for two hops instead of one. The safest default for most systems." },
              { "term": "Write-around",       "def": "Writes go to the database only. The stale cache entry is evicted so the next read refreshes it. Good when writes are rare and reads are hot." },
              { "term": "Write-behind",       "def": "Writes hit the cache first, then flush to the database asynchronously. Extremely fast for the client, but you risk losing a write if the cache crashes before the flush. Only use this when you can accept that risk." }
            ]
          },
          {
            "type": "p",
            "text": "These are not mutually exclusive. **Write-through + TTL** is a common combination: TTL protects you from bugs, write-through keeps things fresh."
          }
        ]
      },
      {
        "heading": "The three layers, ranked by latency",
        "body": [
          {
            "type": "ul",
            "items": [
              "**CDN / edge cache** — 5-50 ms from the user. Cheap, geographically close, terrible at private data. Use for static assets, public API responses, signed-URL gates.",
              "**Redis / Memcached** — 0.2-2 ms from your app. Shared across instances. Use for session state, hot rows, rate-limit counters, computed pages.",
              "**In-process LRU** — 50 nanoseconds. Per-instance, lost on restart, never consistent across replicas. Use for config, feature flags, schema lookups — things where staleness is fine."
            ]
          },
          {
            "type": "p",
            "text": "Rule of thumb: each layer should absorb ~90% of the traffic the next layer would have seen. Miss that ratio and the layer below is the real system."
          }
        ]
      },
      {
        "heading": "The invalidation problem, shown",
        "body": [
          {
            "type": "quote",
            "text": "There are only two hard things in Computer Science: cache invalidation and naming things.",
            "cite": "Phil Karlton"
          },
          {
            "type": "p",
            "text": "It's funny because every layer does invalidation differently. CDNs use TTL + purge APIs. Redis uses TTL + explicit `DEL`. In-process caches usually do TTL and pray."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "def get_user(user_id):\n    # L1: process memory, 60s\n    if u := local_lru.get(user_id):\n        return u\n    # L2: Redis, 5 min\n    if raw := redis.get(f'user:{user_id}'):\n        u = json.loads(raw)\n        local_lru.set(user_id, u, ttl=60)\n        return u\n    # L3: source of truth\n    u = db.fetch_user(user_id)\n    redis.setex(f'user:{user_id}', 300, json.dumps(u))\n    local_lru.set(user_id, u, ttl=60)\n    return u\n\ndef update_user(user_id, patch):\n    db.update_user(user_id, patch)\n    redis.delete(f'user:{user_id}')\n    # local_lru on OTHER instances is still wrong for up to 60s — accept it"
          }
        ]
      },
      {
        "heading": "Watch out for",
        "body": [
          {
            "type": "ul",
            "items": [
              "**Thundering herd.** A hot key expires; 10k requests miss simultaneously and hammer the DB. Use *singleflight* or stale-while-revalidate.",
              "**Cache stampede on deploy.** Restarting your fleet wipes every L1. Pre-warm or stagger the rollout.",
              "**Negative caching.** Caching `None` is fine. Caching `None` *forever* turns a transient DB blip into a permanent 404.",
              "**Stale-after-write windows.** If two layers have independent TTLs, a user can see new → old → new. Document the window; don't hide it."
            ]
          }
        ]
      },
      {
        "heading": "Key insight",
        "body": [
          {
            "type": "p",
            "text": "A cache is a *consistency contract*, not a speedup. The interesting question isn't *what should I cache* — it's *how stale am I allowed to be, and who notices?* Answer that and the layer chooses itself."
          }
        ]
      }
    ]
  },
  "sd-index-write-cost": {
    "sections": [
      {
        "heading": "The book at the back of the textbook",
        "body": [
          {
            "type": "p",
            "text": "**Imagine a textbook with a perfect 40-page index** — every concept, every author, every page they appear on. Looking something up is instant. Now your editor adds one paragraph on page 217. Every term in that paragraph means a re-sort somewhere in those 40 index pages."
          },
          {
            "type": "p",
            "text": "That's a database index. Reads get B-tree fast. Writes get B-tree expensive — and the cost scales with how many indexes you have, not how big your row is."
          }
        ]
      },
      {
        "heading": "The accounting",
        "body": [
          {
            "type": "p",
            "text": "Every `INSERT` rewrites **every** index on the table. Every `UPDATE` rewrites every index whose column changed, *plus* the primary clustered index. A table with 8 secondary indexes turns one logical write into nine physical ones — plus WAL, plus replication."
          },
          {
            "type": "ul",
            "items": [
              "**Write amplification** = 1 + (number of indexes touched). On hot tables this dominates IOPS.",
              "**Lock contention** rises with index count — each index page is a serialization point.",
              "**Bloat** — B-tree splits leave half-empty pages. `VACUUM`/`OPTIMIZE` is the cost of forgetting this."
            ]
          }
        ]
      },
      {
        "heading": "When to add one anyway",
        "body": [
          {
            "type": "p",
            "text": "Add an index when a query is run **frequently enough that read savings exceed write tax**, and the column has high **selectivity** (low cardinality columns like `status='active'` are usually worse than no index)."
          },
          {
            "type": "code",
            "lang": "sql",
            "text": "-- Before adding ANY index, ask:\nEXPLAIN (ANALYZE, BUFFERS)\nSELECT * FROM orders\nWHERE customer_id = 42 AND status = 'shipped'\nORDER BY created_at DESC LIMIT 20;\n\n-- Composite > two singles for AND queries:\nCREATE INDEX idx_orders_customer_status_created\n  ON orders (customer_id, status, created_at DESC);\n\n-- Partial index — pay write cost only for the rows you actually query:\nCREATE INDEX idx_orders_pending\n  ON orders (created_at)\n  WHERE status = 'pending';"
          }
        ]
      },
      {
        "heading": "Watch out for",
        "body": [
          {
            "type": "ul",
            "items": [
              "**Duplicate indexes.** `(a)` is redundant if `(a, b)` exists — the latter serves both.",
              "**Index-only scans lost to `SELECT *`.** Covering indexes only win when you ask for what they cover.",
              "**ORM-generated indexes** on every foreign key, whether you query on it or not. Audit them.",
              "**Hot-spot indexes on monotonic keys** (timestamps, UUIDv1). Every insert hits the same B-tree leaf — your throughput ceiling is one page latch."
            ]
          }
        ]
      },
      {
        "heading": "Key insight",
        "body": [
          {
            "type": "p",
            "text": "Indexes are a *write tax paid in advance for read latency*. A table with 12 indexes isn't well-optimized — it's a table where nobody pruned. In a design review, *removing* an index is usually the more senior move."
          }
        ]
      }
    ]
  },
  "sd-queue-decoupling": {
    "sections": [
      {
        "heading": "The kitchen ticket rail",
        "body": [
          {
            "type": "p",
            "text": "**Picture a busy diner.** The waiter doesn't stand at the grill waiting for each plate — they clip the order to a rail and walk away. The cook works the rail at their own pace. Tickets back up during the lunch rush; they drain during the lull. The waiter never blocks; the cook never gets overwhelmed by a coordinated stampede."
          },
          {
            "type": "p",
            "text": "A message queue is that rail. The producer doesn't care that the consumer is slow, restarting, or temporarily on fire. It writes a ticket and moves on."
          }
        ]
      },
      {
        "heading": "What you're actually decoupling",
        "body": [
          {
            "type": "ul",
            "items": [
              "**Time** — producer publishes at 10:00, consumer reads at 10:03. The slow side is *patient*, not *broken*.",
              "**Throughput** — bursts get absorbed by queue depth instead of breaking the consumer.",
              "**Failure** — consumer crashes, messages stay; deploy a fix, work resumes from where it stopped.",
              "**Deployment** — producer and consumer ship on different schedules behind a message contract."
            ]
          },
          {
            "type": "p",
            "text": "Synchronous calls couple all four. One slow downstream and your p99 is its p99 — plus the timeout."
          }
        ]
      },
      {
        "heading": "The minimum viable pattern",
        "body": [
          {
            "type": "code",
            "lang": "python",
            "text": "# Producer — fast path, fire-and-forget\ndef place_order(order):\n    db.insert_order(order)  # source of truth, sync\n    queue.publish('orders.placed', {  # everything else, async\n        'order_id': order.id,\n        'idempotency_key': order.id,  # consumer MUST dedupe\n    })\n    return 200\n\n# Consumer — slow path, retry-safe\n@subscribe('orders.placed')\ndef on_order_placed(msg):\n    if already_processed(msg.idempotency_key):\n        return ACK\n    send_confirmation_email(msg.order_id)\n    update_warehouse(msg.order_id)\n    mark_processed(msg.idempotency_key)\n    return ACK  # at-least-once delivery — ACK only after success"
          },
          {
            "type": "p",
            "text": "Notice what moved off the request path: email, warehouse sync, analytics. The user's HTTP response no longer waits for SMTP."
          }
        ]
      },
      {
        "heading": "Watch out for",
        "body": [
          {
            "type": "ul",
            "items": [
              "**At-least-once is the default.** Your consumer *will* see duplicates. Idempotency keys aren't optional.",
              "**Queue depth as a leading indicator.** Growing depth = consumer slower than producer. Alert on slope, not absolute.",
              "**Poison messages.** One bad payload retried forever blocks the partition. Use a **dead-letter queue** with a hard retry cap.",
              "**Ordering.** Most brokers only guarantee order per partition/key. Don't assume global FIFO."
            ]
          }
        ]
      },
      {
        "heading": "What this is *not*",
        "body": [
          {
            "type": "p",
            "text": "A queue is not a database. Messages are *transient instructions*, not durable state. The order lives in Postgres; the queue just nudges the next step. If your queue becomes the source of truth, you've built an outage waiting for a Kafka rebalance."
          }
        ]
      },
      {
        "heading": "Why this matters: monolith vs microservices",
        "body": [
          {
            "type": "p",
            "text": "Queues are the *connective tissue* that lets you split a monolith into services without every service blocking on every other. Before you reach for them, know what shape your architecture actually wants:"
          },
          {
            "type": "compare",
            "title": "Monolith vs Microservices",
            "caption": "Queues become essential the moment you cross the dotted line.",
            "axes": ["Deploy unit", "Failure blast radius", "Local dev loop", "Where queues fit"],
            "left":  { "label": "Monolith",      "accent": "earth", "values": ["One artifact, one rollback", "Whole app — process crashes together", "`run` and you're in — single repo", "Optional — async jobs only"] },
            "right": { "label": "Microservices", "accent": "fire",  "values": ["N services, N pipelines", "Per-service — if you isolated right", "Compose + mocks + service discovery", "**Load-bearing** — every cross-service hop"] }
          }
        ]
      }
    ]
  },
  "sd-n-plus-one": {
    "sections": [
      {
        "heading": "The grocery list bug",
        "body": [
          {
            "type": "p",
            "text": "**Imagine a roommate** going to the grocery store. You ask for *everything we need for dinner*. Instead of one trip with a list, they drive back for each item: trip for onions, trip for garlic, trip for pasta. Twelve trips. The traffic isn't the problem — the *plan* is."
          },
          {
            "type": "p",
            "text": "That's N+1. One query to get the list of N parents, then N more queries to fetch each child. The DB isn't slow. You're just asking it 200 times when one question would do."
          }
        ]
      },
      {
        "heading": "Where it hides",
        "body": [
          {
            "type": "p",
            "text": "Almost always behind an ORM. The code looks innocent — a loop over a result set, accessing a relationship. The ORM lazy-loads. Your dev DB has 5 rows, so it's fine. Prod has 5,000, and a single page load fires 5,001 queries."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "# The bug\nfor user in User.objects.all():  # 1 query\n    print(user.name, user.team.name)   # N queries, one per user\n\n# The fix — eager load the relationship\nfor user in User.objects.select_related('team'):  # 1 JOIN\n    print(user.name, user.team.name)\n\n# For one-to-many, use prefetch_related (2 queries total):\nfor team in Team.objects.prefetch_related('members'):\n    for m in team.members.all():\n        ...  # already loaded"
          }
        ]
      },
      {
        "heading": "Why it looks like a scaling problem",
        "body": [
          {
            "type": "p",
            "text": "Symptoms: p99 grows with payload size. CPU on the DB climbs. Connection pool exhausts under load. The obvious read is *we've outgrown the DB*. The actual read is *we're doing 200× more queries than the workload requires*."
          },
          {
            "type": "p",
            "text": "Upgrading the instance buys you maybe 2-3× headroom for 5-10× the cost. Fixing the N+1 buys you 50-100× for the price of a code review."
          }
        ]
      },
      {
        "heading": "How to spot it",
        "body": [
          {
            "type": "ul",
            "items": [
              "**Slow query logs full of identical-shape queries** with different bind parameters. That's the smell.",
              "**APM traces** showing a tall stack of short DB spans inside one request — visually a picket fence.",
              "**`django-debug-toolbar`, `bullet`, `rack-mini-profiler`** — tools that count queries per request. Set a soft limit (say, 25) and fail CI when a view exceeds it.",
              "**Load tests where throughput scales sub-linearly with parallelism** — you're saturating the DB's *queries-per-second*, not its CPU."
            ]
          }
        ]
      },
      {
        "heading": "Key insight",
        "body": [
          {
            "type": "p",
            "text": "Most 'we need to scale the database' conversations end when someone opens the query log. Before you reach for **read replicas**, **sharding**, or **a bigger box**, count the queries per request. If the answer has three digits, the architecture is fine — the data access pattern is the bug."
          }
        ]
      }
    ]
  },
  "api-rest-design": {
    "cliffhanger": "What happens when the same request arrives twice — once it succeeded, once it failed in transit?",
    "sections": [
      {
        "heading": "REST is a contract, not a religion",
        "body": [
          {
            "type": "p",
            "text": "**REST** says: model your system as **resources** (nouns) and let HTTP verbs do the action. A `POST /orders` creates an order; a `GET /orders/42` reads it. The point is *predictability* — a client should guess your URLs after seeing three."
          }
        ]
      },
      {
        "heading": "Resources, not RPC calls",
        "body": [
          {
            "type": "p",
            "text": "**Nouns beat verbs.** `/getUserOrders?id=42` is a bad URL because it bakes the verb into the path. `GET /users/42/orders` is good because the verb is `GET` and the resource is obvious."
          },
          {
            "type": "table",
            "headers": ["Action", "RPC-style (avoid)", "REST-style (prefer)"],
            "rows": [
              ["List a user's orders", "`GET /getUserOrders?id=42`", "`GET /users/42/orders`"],
              ["Cancel an order",      "`POST /cancelOrder?id=99`", "`DELETE /orders/99` *or* `POST /orders/99/cancel`"],
              ["Update an address",    "`POST /updateAddr`",        "`PATCH /users/42/address`"],
              ["Search products",      "`GET /searchProducts?q=x`", "`GET /products?q=x`"]
            ],
            "align": ["left", "left", "left"]
          },
          {
            "type": "p",
            "text": "**Plural collections, singular items.** `/orders` is the set; `/orders/42` is one. Mixing `/order/42` and `/orders` in the same API is the kind of inconsistency that gets your SDK rejected at review."
          }
        ]
      },
      {
        "heading": "The shape of a clean REST API",
        "body": [
          {
            "type": "diagram",
            "title": "Resource modeling",
            "subtitle": "REST URL TREE",
            "nodes": [
              { "id": "client", "label": "Client",    "subtitle": "MOBILE / WEB",  "x": 0.08, "y": 0.5, "accent": "water" },
              { "id": "gw",     "label": "API Gateway","subtitle": "AUTH + ROUTE",  "x": 0.32, "y": 0.5, "accent": "amber" },
              { "id": "users",  "label": "/users",    "subtitle": "RESOURCE",      "x": 0.58, "y": 0.25, "accent": "fire" },
              { "id": "orders", "label": "/orders",   "subtitle": "RESOURCE",      "x": 0.58, "y": 0.75, "accent": "fire" },
              { "id": "db",     "label": "Postgres",  "subtitle": "STORE",         "x": 0.88, "y": 0.5, "accent": "earth" }
            ],
            "edges": [
              { "from": "client", "to": "gw",     "kind": "dashed", "accent": "water", "label": "HTTPS" },
              { "from": "gw",     "to": "users",  "kind": "dashed", "accent": "amber" },
              { "from": "gw",     "to": "orders", "kind": "dashed", "accent": "amber" },
              { "from": "users",  "to": "db",     "kind": "dashed", "accent": "fire" },
              { "from": "orders", "to": "db",     "kind": "dashed", "accent": "fire" }
            ]
          },
          {
            "type": "code",
            "lang": "javascript",
            "text": "// Express route table — one file should tell the whole story\napp.get   ('/users',           listUsers);       //  collection read\napp.post  ('/users',           createUser);      //  collection write — returns 201 + Location\napp.get   ('/users/:id',       getUser);         //  item read — 404 if missing\napp.patch ('/users/:id',       patchUser);       //  partial update — safer than PUT\napp.delete('/users/:id',       deleteUser);      //  204 No Content on success\n\napp.get   ('/users/:id/orders', listUserOrders); //  nested — but keep nesting <= 2 levels"
          },
          {
            "type": "practice",
            "lang": "bash",
            "prompt": "Try a few REST-shaped curls against a fake API.",
            "starter": "curl -i https://api.example.com/users/42\ncurl -i -X PATCH https://api.example.com/users/42 \\\n  -H 'Content-Type: application/json' \\\n  -d '{\"email\":\"new@example.com\"}'\n",
            "hint": "Notice GET has no body and PATCH only sends the fields that change — PUT would require the full resource."
          }
        ]
      },
      {
        "heading": "Where REST stops being the right answer",
        "body": [
          {
            "type": "pros-cons",
            "goodLabel": "Good for",
            "watchLabel": "Watch out for",
            "good": [
              "CRUD over clearly-shaped entities (users, orders, posts)",
              "Cacheable reads — HTTP caching is free, deeply tested",
              "Wide client support — any HTTP client speaks REST",
              "Easy to mock, log, and reason about with curl alone"
            ],
            "watch": [
              "Highly relational reads (5 round-trips per screen) — try GraphQL",
              "Streaming or low-latency duplex — try WebSockets or gRPC",
              "Action-heavy domains (`approve`, `recompute`) — forces awkward verbs into paths",
              "HATEOAS in theory is elegant; in practice almost no client follows the links"
            ]
          },
          {
            "type": "p",
            "text": "**HATEOAS** — the idea that responses include links to next actions — is the part of REST nearly everyone skips. Clients hardcode URLs anyway. Ship it if you want, but don't pretend it's load-bearing."
          },
          {
            "type": "quote",
            "text": "Nouns in the path, verbs in the method. The day you reach for /doThing, REST is asking you to switch tools.",
            "cite": "the REST litmus test"
          },
          {
            "type": "compare",
            "title": "REST vs gRPC",
            "caption": "Pick by your traffic shape — public surface, or internal hop?",
            "axes": ["Wire format", "Browser-native?", "Streaming", "Tooling maturity"],
            "left":  { "label": "REST",  "accent": "sky",  "values": ["JSON over HTTP/1.1", "Yes", "SSE / long-poll", "Universal — `curl`, every SDK"] },
            "right": { "label": "gRPC",  "accent": "fire", "values": ["Protobuf over HTTP/2", "No (needs grpc-web proxy)", "Bidirectional native", "Server-side only"] }
          }
        ]
      }
    ]
  },
  "api-versioning": {
    "sections": [
      {
        "heading": "Versioning is a promise, not a label",
        "body": [
          {
            "type": "p",
            "text": "**Versioning** is how you change an API without breaking the clients you've already shipped. The version string isn't the point — the *contract* is. Bump it only when you'd otherwise make someone's app crash on Monday."
          }
        ]
      },
      {
        "heading": "Three places to put the version",
        "body": [
          {
            "type": "table",
            "headers": ["Strategy", "Example", "Trade-off"],
            "rows": [
              ["**URI**",          "`/v2/orders/42`",                                "Most visible, easiest to route, ugliest URLs"],
              ["**Header**",       "`X-API-Version: 2`",                             "Clean URLs, invisible in logs, easy to forget"],
              ["**Media type**",   "`Accept: application/vnd.acme.v2+json`",         "Pure REST, but tooling and CDNs hate it"]
            ],
            "align": ["left", "left", "left"]
          },
          {
            "type": "p",
            "text": "**Pick one and stick with it.** URI versioning wins for public APIs because it's grep-able in logs. Header versioning wins for internal APIs where you control both ends."
          }
        ]
      },
      {
        "heading": "What actually counts as breaking",
        "body": [
          {
            "type": "pros-cons",
            "goodLabel": "Safe (no bump needed)",
            "watchLabel": "Breaking (cut a new version)",
            "good": [
              "Adding a new optional field to a response",
              "Adding a new endpoint",
              "Accepting a new optional query parameter",
              "Relaxing a validation rule (more inputs accepted)"
            ],
            "watch": [
              "Removing or renaming any response field",
              "Changing a field's type (`int` → `string`)",
              "Making a previously optional field required",
              "Changing default behavior of an existing parameter"
            ]
          },
          {
            "type": "p",
            "text": "**Clients depend on what they see, not what you documented.** Even an undocumented field becomes load-bearing the moment one team parses it. When in doubt, additive."
          }
        ]
      },
      {
        "heading": "The deprecation playbook",
        "body": [
          {
            "type": "diagram",
            "title": "Deprecation lifecycle",
            "subtitle": "ANNOUNCE → DUAL-RUN → ENFORCE",
            "nodes": [
              { "id": "ann", "label": "Announce", "subtitle": "DAY 0",     "x": 0.12, "y": 0.5, "accent": "water" },
              { "id": "dual","label": "Dual-run", "subtitle": "MONTHS 1-6","x": 0.42, "y": 0.5, "accent": "amber" },
              { "id": "sun", "label": "Sunset hdr","subtitle": "MONTH 6",  "x": 0.7,  "y": 0.5, "accent": "amber" },
              { "id": "off", "label": "Enforce",  "subtitle": "MONTH 12",  "x": 0.92, "y": 0.5, "accent": "fire" }
            ],
            "edges": [
              { "from": "ann",  "to": "dual", "kind": "dashed", "accent": "water", "label": "blog + email" },
              { "from": "dual", "to": "sun",  "kind": "dashed", "accent": "amber", "label": "warn" },
              { "from": "sun",  "to": "off",  "kind": "dashed", "accent": "amber", "label": "410 Gone" }
            ]
          },
          {
            "type": "code",
            "lang": "javascript",
            "text": "// Express middleware — flag v1 calls with the Sunset header (RFC 8594)\napp.use('/v1', (req, res, next) => {\n  res.set('Sunset', 'Sat, 31 Dec 2026 23:59:59 GMT');   //  hard cutoff date\n  res.set('Deprecation', 'true');                       //  draft-IETF marker\n  res.set('Link', '</v2/' + req.path.slice(1) + '>; rel=\"successor-version\"');  //  point at the replacement\n  next();                                               //  still serve the request\n});\n\n// After the sunset date:\napp.use('/v1', (req, res) => res.status(410).json({   //  410 Gone, not 404\n  error: 'api_v1_retired',\n  upgrade: 'https://docs.example.com/v2-migration'\n}));"
          },
          {
            "type": "quote",
            "text": "Announce, dual-run, enforce. Skipping any of the three is how integrations break overnight and trust burns for years.",
            "cite": "the deprecation rule"
          }
        ]
      }
    ]
  },
  "api-rate-limiting": {
    "sections": [
      {
        "heading": "Rate limits protect the server from you",
        "body": [
          {
            "type": "p",
            "text": "**Rate limiting** caps how often a caller may hit your API. Without it, one buggy retry loop or one curious scraper can take down everyone else. The goal is *graceful degradation* — slow the noisy down, keep the quiet flowing."
          }
        ]
      },
      {
        "heading": "Three algorithms, three personalities",
        "body": [
          {
            "type": "table",
            "headers": ["Algorithm", "Burst-friendly?", "When to use"],
            "rows": [
              ["**Token bucket**",   "Yes",  "Public APIs — allow short spikes, average over time"],
              ["**Leaky bucket**",   "No",   "Outbound queues — smooth, fixed-rate processing"],
              ["**Sliding window**", "Some", "Precise per-minute caps where bursts must be counted"]
            ],
            "align": ["left", "left", "left"]
          },
          {
            "type": "p",
            "text": "**Token bucket** is the default for a reason: a 100 req/min limit with bucket size 100 lets a client burst 100 requests instantly, then refills at 100/60 per second. Real traffic is bursty; matching it feels fair."
          }
        ]
      },
      {
        "heading": "Pick the right key",
        "body": [
          {
            "type": "diagram",
            "title": "Rate-limit decision flow",
            "subtitle": "KEY SELECTION",
            "nodes": [
              { "id": "req", "label": "Request",   "subtitle": "INCOMING", "x": 0.08, "y": 0.5, "accent": "water" },
              { "id": "gw",  "label": "Limiter",   "subtitle": "MIDDLEWARE","x": 0.34, "y": 0.5, "accent": "amber" },
              { "id": "red", "label": "Redis",     "subtitle": "COUNTERS",  "x": 0.6, "y": 0.5, "accent": "sky" },
              { "id": "svc", "label": "Service",   "subtitle": "BACKEND",   "x": 0.88, "y": 0.25, "accent": "fire" },
              { "id": "tmr", "label": "429",       "subtitle": "RETRY-AFTER","x": 0.88, "y": 0.75, "accent": "fire" }
            ],
            "edges": [
              { "from": "req", "to": "gw",  "kind": "dashed", "accent": "water" },
              { "from": "gw",  "to": "red", "kind": "dashed", "accent": "amber", "label": "INCR" },
              { "from": "gw",  "to": "svc", "kind": "dashed", "accent": "fire", "label": "allow" },
              { "from": "gw",  "to": "tmr", "kind": "dashed", "accent": "fire", "label": "deny" }
            ]
          },
          {
            "type": "sequence",
            "title": "Third request hits the bucket floor",
            "caption": "Two pass, third gets 429 + Retry-After; client backs off.",
            "actors": [
              { "id": "client",  "label": "Client",  "accent": "water" },
              { "id": "limiter", "label": "Limiter", "accent": "amber" },
              { "id": "api",     "label": "API",     "accent": "fire" }
            ],
            "events": [
              { "from": "client",  "to": "limiter", "label": "Request 1",       "note": "tokens: 2 → 1" },
              { "from": "limiter", "to": "api",     "label": "Allow" },
              { "from": "client",  "to": "limiter", "label": "Request 2",       "note": "tokens: 1 → 0" },
              { "from": "limiter", "to": "client",  "label": "429 + Retry-After","note": "bucket empty" },
              { "from": "client",  "to": "limiter", "label": "Retry w/ jitter", "note": "after backoff", "dashed": true }
            ]
          },
          {
            "type": "pros-cons",
            "goodLabel": "Good keys",
            "watchLabel": "Bad keys",
            "good": [
              "**API key** — most fair, identifies the actual customer",
              "**User ID** — for authenticated end-user calls",
              "**Tenant ID** — multi-tenant SaaS, fair across orgs",
              "Compound keys (`user + endpoint`) — protect expensive routes"
            ],
            "watch": [
              "**Raw IP** — NATs and offices share one; corp users get punished",
              "Limiting *only* anonymous — leaves authenticated users a hole",
              "One global counter — kills fan-out from a single mobile app launch",
              "Counting headers but not bodies on huge uploads"
            ]
          }
        ]
      },
      {
        "heading": "The 429 contract clients actually need",
        "body": [
          {
            "type": "code",
            "lang": "javascript",
            "text": "// Express middleware — token bucket backed by Redis\nimport { rateLimit } from 'express-rate-limit';\n\nconst limiter = rateLimit({\n  windowMs: 60_000,                       //  1-minute window\n  max: 100,                               //  100 req per key per window\n  standardHeaders: true,                  //  emit RateLimit-* (IETF draft)\n  legacyHeaders: true,                    //  emit X-RateLimit-* (widely used)\n  keyGenerator: (req) => req.user?.id ?? req.ip,  //  prefer user, fall back to IP\n  handler: (req, res) => {\n    res.set('Retry-After', '30');         //  seconds until the bucket has tokens\n    res.status(429).json({                //  429 Too Many Requests — never 503\n      error: 'rate_limited',\n      retry_after_seconds: 30,            //  same value in the body for SDKs\n    });\n  },\n});\n\napp.use('/api', limiter);"
          },
          {
            "type": "practice",
            "lang": "bash",
            "prompt": "Hammer an endpoint and inspect the rate-limit headers.",
            "starter": "for i in $(seq 1 5); do\n  curl -i -s https://api.example.com/v1/ping | grep -iE 'ratelimit|retry-after'\ndone\n",
            "hint": "Look for `X-RateLimit-Remaining` decrementing each call and `Retry-After` appearing only on the 429 response — that pair is what makes a limiter usable."
          },
          {
            "type": "quote",
            "text": "A 429 without Retry-After is just rude. Tell the client when to come back and they will.",
            "cite": "the limiter's golden rule"
          }
        ]
      }
    ]
  },
  "api-idempotency": {
    "sections": [
      {
        "heading": "The network will retry — design for it",
        "body": [
          {
            "type": "p",
            "text": "**Idempotency** means doing an operation twice produces the same result as doing it once. On a distributed network, every request *will* be retried — by the client, by a proxy, by an SDK. If your `POST /charges` debits the card on each retry, you're going to refund a lot of customers."
          }
        ]
      },
      {
        "heading": "Idempotency keys: the standard trick",
        "body": [
          {
            "type": "p",
            "text": "**The client generates a UUID** and sends it as `Idempotency-Key`. The server stores `(key → response)` for ~24 hours. Same key inside the window? Replay the stored response — don't redo the work."
          },
          {
            "type": "diagram",
            "title": "Idempotency-Key flow",
            "subtitle": "AT-LEAST-ONCE DELIVERY",
            "nodes": [
              { "id": "cli", "label": "Client",  "subtitle": "GENERATES UUID", "x": 0.1,  "y": 0.5, "accent": "water" },
              { "id": "api", "label": "API",     "subtitle": "CHECKS KEY",     "x": 0.38, "y": 0.5, "accent": "fire" },
              { "id": "kv",  "label": "Redis",   "subtitle": "KEY → RESPONSE", "x": 0.66, "y": 0.5, "accent": "sky" },
              { "id": "db",  "label": "Postgres","subtitle": "WRITES ONCE",    "x": 0.92, "y": 0.5, "accent": "earth" }
            ],
            "edges": [
              { "from": "cli", "to": "api", "kind": "dashed", "accent": "water", "label": "POST + key" },
              { "from": "api", "to": "kv",  "kind": "dashed", "accent": "fire", "label": "SETNX" },
              { "from": "api", "to": "db",  "kind": "dashed", "accent": "fire", "label": "if new" },
              { "from": "kv",  "to": "api", "kind": "arc",   "accent": "sky",  "label": "replay", "curve": -0.3 }
            ]
          },
          {
            "type": "code",
            "lang": "javascript",
            "text": "// Express handler — replay-safe payment create\napp.post('/charges', async (req, res) => {\n  const key = req.get('Idempotency-Key');     //  client-supplied UUID\n  if (!key) return res.status(400).json({ error: 'missing_key' });\n\n  const cached = await redis.get(`idem:${key}`);  //  prior response, if any\n  if (cached) return res.status(200).json(JSON.parse(cached));   //  replay — no double charge\n\n  const charge = await stripe.charges.create(req.body);          //  the real work\n  const response = { id: charge.id, status: charge.status };\n\n  await redis.set(                                                //  cache for 24h\n    `idem:${key}`, JSON.stringify(response), 'EX', 86_400,\n  );\n  res.status(201).json(response);\n});"
          }
        ]
      },
      {
        "heading": "Which methods are idempotent by default",
        "body": [
          {
            "type": "table",
            "headers": ["Method", "Idempotent?", "Notes"],
            "rows": [
              ["`GET`",    "Yes", "Reads must never mutate"],
              ["`PUT`",    "Yes", "Replace — repeat lands on the same state"],
              ["`DELETE`", "Yes", "Second call returns 404 or 204; same end state"],
              ["`POST`",   "No",  "Default is create — needs an Idempotency-Key to be safe"]
            ],
            "align": ["left", "center", "left"]
          },
          {
            "type": "p",
            "text": "**`PATCH` is the slippery one.** `PATCH /counter { \"inc\": 1 }` is *not* idempotent — retry it and you double the count. `PATCH /counter { \"value\": 7 }` *is*. Prefer absolute updates over deltas whenever you can."
          }
        ]
      },
      {
        "heading": "Retry like an adult: backoff + jitter + circuit breakers",
        "body": [
          {
            "type": "pros-cons",
            "goodLabel": "Good for",
            "watchLabel": "Watch out for",
            "good": [
              "**Exponential backoff** (1s → 2s → 4s → 8s) — avoids thundering herd",
              "**Jitter** (±25%) — desynchronizes retries from many clients",
              "**Circuit breakers** — stop calling a service that's been failing 50% for 10s",
              "**Capped retries** (≤ 5) — give up gracefully, surface the error"
            ],
            "watch": [
              "Retrying 4xx errors — the request was bad; retrying won't fix it",
              "Retrying without backoff — turns a hiccup into an outage",
              "Open-loop retries from many clients — they synchronize into a stampede",
              "Retrying non-idempotent POSTs without a key — double-charges await"
            ]
          },
          {
            "type": "code",
            "lang": "javascript",
            "text": "// Client-side retry with exponential backoff + jitter\nasync function postWithRetry(url, body, key, maxAttempts = 5) {\n  for (let n = 0; n < maxAttempts; n++) {\n    const res = await fetch(url, {\n      method: 'POST',\n      headers: { 'Content-Type': 'application/json', 'Idempotency-Key': key },  //  same key on every retry\n      body: JSON.stringify(body),\n    });\n    if (res.ok) return res.json();                          //  success — return now\n    if (res.status >= 400 && res.status < 500) throw res;   //  4xx — bad request, do not retry\n    const base = Math.min(1000 * 2 ** n, 30_000);           //  cap at 30s\n    const jitter = base * (0.75 + Math.random() * 0.5);     //  ±25% spread\n    await new Promise(r => setTimeout(r, jitter));          //  wait before next try\n  }\n  throw new Error('exhausted_retries');\n}"
          },
          {
            "type": "explain-back",
            "prompt": "In your own words: how does an `Idempotency-Key` make a `POST /charges` endpoint safe to retry, and where exactly does the dedupe happen?",
            "modelAnswer": "You generate a UUID once on the client per logical operation — say, one checkout attempt — and send it as the `Idempotency-Key` header on every retry of that POST. The server, before doing any work, does a `SETNX` (set-if-not-exists) in Redis keyed by that UUID. First request through wins the lock, executes the charge, and stores `(key → response)` for ~24 hours. Every retry with the same key finds the cached response and replays it — no second charge to Stripe, no second row in your DB. The dedupe lives *in front of* the side effect, not after it, which is why an idempotency middleware is the standard pattern instead of bolting checks into every handler.",
            "hint": "Trace what happens on the second retry — what does Redis return, and what does the server skip?"
          },
          {
            "type": "quote",
            "text": "Every mutation should survive a double-tap. If it can't, you don't have an API — you have a landmine.",
            "cite": "the idempotency rule"
          }
        ]
      }
    ]
  },
};
