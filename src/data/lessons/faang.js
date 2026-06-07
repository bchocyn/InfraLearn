export default {
  "time-clocks": {
    "sections": [
      {
        "heading": "Time is a lie distributed systems tell themselves",
        "body": [
          {
            "type": "p",
            "text": "There is **no single \"now\"** across machines. Every node has its own quartz crystal drifting at its own rate, and the network introduces delays you cannot bound. If you ever wrote `if (timestamp1 < timestamp2)` and assumed it meant **\"happened before\"** — you have a bug waiting to detonate."
          },
          {
            "type": "p",
            "text": "Distributed time splits into two questions: *what time is it on a wall?* and *what happened before what?* These are different problems with different tools. Confusing them is how you get duplicated payments, lost writes, and 3am pages."
          }
        ]
      },
      {
        "heading": "Wall clock vs monotonic clock",
        "body": [
          {
            "type": "p",
            "text": "**Wall clock** answers \"what time is it for humans?\" — it can jump backwards when NTP corrects drift or DST flips. **Monotonic clock** answers \"how much time has passed since some arbitrary point?\" — it never goes backwards, but you cannot compare it across machines or reboots."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "import time\n\nstart = time.time()  # wall clock — seconds since epoch\ndo_work()  # ...something slow...\nelapsed = time.time() - start    # WRONG — NTP slew can make this negative\n\nstart = time.monotonic()  # monotonic — never jumps backward\ndo_work()  # same work\nelapsed = time.monotonic() - start  # safe for measuring durations\n\nlog_time = time.time()  # wall clock for human-facing log lines\ndeadline = time.monotonic() + 5  # monotonic for timeouts and retries"
          },
          {
            "type": "p",
            "text": "**Rule:** wall clock for *timestamps you show humans or store in a database*. Monotonic for *measuring elapsed time, timeouts, rate limits*. Mixing them is the #1 source of \"my retry loop fires twice\" bugs."
          }
        ]
      },
      {
        "heading": "NTP and leap seconds — the wall-clock gremlins",
        "body": [
          {
            "type": "p",
            "text": "**NTP** (Network Time Protocol) keeps wall clocks roughly synchronized — typically within **10–100ms** on a LAN, worse over the open internet. It does this by *slewing* (gradually speeding up or slowing the clock) or *stepping* (jumping it). Stepping is what breaks your code."
          },
          {
            "type": "p",
            "text": "**Leap seconds** are extra seconds inserted into UTC to keep it aligned with Earth's rotation. The naive handling: a clock shows `23:59:60` — which crashes parsers that assume `seconds < 60`. Google's fix is **leap smearing** — spreading the extra second over 24 hours so no clock ever sees `60`. Adopt the same approach or you will lose a service to a leap second eventually (Reddit, Cloudflare, and LinkedIn all have."
          },
          {
            "type": "p",
            "text": "**Physical clocks** — they measure real time, with varying accuracy."
          },
          {
            "type": "table",
            "headers": [
              "Clock type",
              "Cross-node sync",
              "Use for"
            ],
            "rows": [
              [
                "Wall (`time()`)",
                "loose, via NTP",
                "log timestamps, DB rows"
              ],
              [
                "Monotonic",
                "none (local only)",
                "timeouts, durations"
              ],
              [
                "NTP-synced wall",
                "±10–100ms",
                "cross-node ordering (loose)"
              ],
              [
                "PTP (hardware)",
                "±1μs",
                "trading, telecom"
              ]
            ]
          },
          {
            "type": "p",
            "text": "**Logical clocks** — counters that capture causality without measuring real time."
          },
          {
            "type": "table",
            "headers": [
              "Clock type",
              "Ordering",
              "Use for"
            ],
            "rows": [
              [
                "Lamport",
                "partial order",
                "causal \"happened-before\""
              ],
              [
                "Vector",
                "full causal order",
                "conflict detection"
              ],
              [
                "HLC",
                "ns + logical (within ε)",
                "CockroachDB, MongoDB"
              ]
            ]
          }
        ]
      },
      {
        "heading": "Lamport clocks — ordering without synchronization",
        "body": [
          {
            "type": "p",
            "text": "Leslie Lamport's 1978 insight: you do not need real clocks to know **what happened before what** — you need a **counter** that follows a simple rule. Every event bumps the counter; every message carries it; receivers take the max of their counter and the message's, then bump."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "class LamportClock:\n    def __init__(self):\n        self.t = 0  # logical time — just a counter\n\n    def local_event(self):\n        self.t += 1  # local work — bump and use\n        return self.t\n\n    def send(self):\n        self.t += 1  # bump before sending\n        return self.t  # piggyback on the message\n\n    def receive(self, msg_t):\n        self.t = max(self.t, msg_t) + 1  # take max — preserves causality"
          },
          {
            "type": "p",
            "text": "If event `A` causally precedes `B`, then `L(A) < L(B)`. But the converse is *not* true — `L(A) < L(B)` does **not** imply A caused B. Lamport gives you a **partial order**, not a way to detect concurrency."
          }
        ]
      },
      {
        "heading": "Vector clocks and HLC — knowing what is concurrent",
        "body": [
          {
            "type": "p",
            "text": "**Vector clocks** fix Lamport's blind spot. Each node keeps a vector of counters — one slot per node. You can now detect *concurrent* events (neither happened-before the other) by comparing vectors pairwise. Cost: vector size grows with cluster size, so this is O(N) overhead per message."
          },
          {
            "type": "diagram",
            "title": "Vector clock catching a concurrent write",
            "nodes": [
              {
                "id": "a1",
                "label": "A: [1,0,0]",
                "subtitle": "write x=1",
                "x": 0.15,
                "y": 0.25,
                "accent": "water"
              },
              {
                "id": "b1",
                "label": "B: [0,1,0]",
                "subtitle": "write x=2",
                "x": 0.15,
                "y": 0.75,
                "accent": "sky"
              },
              {
                "id": "c1",
                "label": "C: [1,1,1]",
                "subtitle": "receives both",
                "x": 0.55,
                "y": 0.5,
                "accent": "earth"
              },
              {
                "id": "conflict",
                "label": "CONFLICT",
                "subtitle": "neither vector ≤ other",
                "x": 0.88,
                "y": 0.5,
                "accent": "fire"
              }
            ],
            "edges": [
              {
                "from": "a1",
                "to": "c1",
                "kind": "dashed",
                "accent": "water",
                "label": "replicate"
              },
              {
                "from": "b1",
                "to": "c1",
                "kind": "dashed",
                "accent": "sky",
                "label": "replicate"
              },
              {
                "from": "c1",
                "to": "conflict",
                "kind": "solid",
                "accent": "fire",
                "label": "detect"
              }
            ]
          },
          {
            "type": "p",
            "text": "**Hybrid Logical Clocks (HLC)** are the modern compromise — combine a physical NTP-ish timestamp with a logical counter. You get timestamps that *look* like wall-clock time (sortable, debuggable) but preserve causality even when NTP misbehaves. **CockroachDB, MongoDB, and YugabyteDB** all use HLC."
          },
          {
            "type": "terms",
            "items": [
              {
                "term": "Happened-before (→)",
                "def": "A → B if A causally precedes B — either same node before, or message send/receive."
              },
              {
                "term": "Concurrent (∥)",
                "def": "A ∥ B when neither A → B nor B → A — these are your potential conflicts."
              },
              {
                "term": "Clock skew",
                "def": "The wall-time difference between two nodes' clocks at the same real instant."
              },
              {
                "term": "Clock drift",
                "def": "How fast a clock gains or loses time per unit of real time, usually expressed in ppm."
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
            "goodLabel": "Reach for",
            "watchLabel": "Avoid",
            "good": [
              "**Monotonic** for any duration, timeout, or rate limit",
              "**Wall clock** only for human-facing timestamps",
              "**HLC** when you need both readable timestamps AND causal ordering",
              "**Leap smearing** via Google or Facebook NTP pools"
            ],
            "watch": [
              "Using `time.time()` for timeouts — NTP step can fire your timer twice or never",
              "Trusting timestamps from another node within microseconds",
              "Vector clocks in a 10,000-node cluster — vectors get huge fast",
              "Assuming `t1 < t2` means `event1 → event2` — only true with logical clocks"
            ]
          },
          {
            "type": "quote",
            "text": "There is no global \"now\". The sooner you internalize that, the fewer 3am pages you will catch from \"impossible\" race conditions.",
            "cite": "every distributed-systems engineer, eventually"
          },
          {
            "type": "explain-back",
            "prompt": "Synthesis: you're ordering events across a fleet that has **monotonic vs wall clocks**, **NTP step/leap-smear drift**, and **Lamport vs vector/HLC** logical clocks. Design how you'd timestamp and order events so that (a) timeouts never misfire and (b) you can tell *causally ordered* from *truly concurrent* — then name the one trade-off you'd watch as the cluster grows.",
            "modelAnswer": "Split the job by what each clock is *for*. Use the **monotonic** clock for every duration/timeout/budget so an NTP step (or leap-second smear) can't make a timer fire twice or never — wall clock is only for human-facing display. For *ordering*, never trust raw wall-clock comparisons across nodes; attach a **logical clock**. A **Lamport** clock gives a single total order but loses the distinction between causal and concurrent. **Vector clocks** recover that distinction — if neither vector dominates, the writes are genuinely concurrent and you must surface a conflict (or merge). **HLC** is the pragmatic middle: it stays close to wall time (so timestamps are readable and roughly sortable) while still encoding happens-before. The trade-off to watch: **vector clocks grow O(nodes)** — in a 10k-node cluster the metadata dwarfs the payload, so you cap participants, prune dead entries, or switch to HLC and accept that it tells you order but not full concurrency.",
            "hint": "Three jobs, three clocks: monotonic = durations, wall = display, logical = ordering. What does a vector tell you that Lamport can't — and what does it cost at scale?"
          }
        ]
      }
    ]
  },
  "consistency-models": {
    "sections": [
      {
        "heading": "Consistency is a dial, not a setting",
        "body": [
          {
            "type": "p",
            "text": "**\"Strongly consistent\" isn't a property — it's a budget.** Every step toward single-machine illusion costs you latency, availability, or money. Every step away from it costs you sleep when something looks weird in production."
          },
          {
            "type": "p",
            "text": "Pick the *weakest* model your use case tolerates, then pay the bill cheerfully. The mistake isn't picking eventual — it's picking eventual for the wrong field."
          }
        ]
      },
      {
        "heading": "The spectrum, end to end",
        "body": [
          {
            "type": "p",
            "text": "Three points on the dial, drawn by where the write goes and what propagates *after* the writer hears \"ok\". Solid edges block the write; dashed edges happen behind the writer's back."
          },
          {
            "type": "diagram",
            "title": "Strong → causal → eventual",
            "height": 260,
            "nodes": [
              {
                "id": "w",
                "label": "Writer",
                "subtitle": "client",
                "accent": "water",
                "x": 0.06,
                "y": 0.5
              },
              {
                "id": "lin",
                "label": "Leader",
                "subtitle": "linearizable · consensus",
                "accent": "sky",
                "x": 0.36,
                "y": 0.18
              },
              {
                "id": "cau",
                "label": "Node",
                "subtitle": "causal",
                "accent": "sky",
                "x": 0.36,
                "y": 0.5
              },
              {
                "id": "evt",
                "label": "Node",
                "subtitle": "eventual · gossip",
                "accent": "sky",
                "x": 0.36,
                "y": 0.82
              },
              {
                "id": "rl",
                "label": "Replicas",
                "subtitle": "synced before ack",
                "accent": "fire",
                "x": 0.82,
                "y": 0.18
              },
              {
                "id": "rc",
                "label": "Replicas",
                "subtitle": "happens-before",
                "accent": "fire",
                "x": 0.82,
                "y": 0.5
              },
              {
                "id": "re",
                "label": "Replicas",
                "subtitle": "converge «eventually»",
                "accent": "fire",
                "x": 0.82,
                "y": 0.82
              }
            ],
            "edges": [
              {
                "from": "w",
                "to": "lin",
                "kind": "solid",
                "label": "write"
              },
              {
                "from": "w",
                "to": "cau",
                "kind": "solid",
                "label": "write"
              },
              {
                "from": "w",
                "to": "evt",
                "kind": "solid",
                "label": "write"
              },
              {
                "from": "lin",
                "to": "rl",
                "kind": "solid",
                "label": "sync",
                "accent": "fire"
              },
              {
                "from": "cau",
                "to": "rc",
                "kind": "dashed",
                "label": "causes →",
                "accent": "amber"
              },
              {
                "from": "evt",
                "to": "re",
                "kind": "dashed",
                "label": "gossip ~?",
                "accent": "earth"
              }
            ]
          },
          {
            "type": "p",
            "text": "Linearizable pays the round trip *now*. Causal pays it *later but in order*. Eventual pays it *whenever the network cooperates*."
          },
          {
            "type": "predict",
            "prompt": "User A in NYC posts a tweet. User B in Tokyo refreshes their feed 50 ms later. The system is **eventually consistent** with async replication across regions. What does B see?",
            "options": [
              "B always sees the tweet — eventual means \"within milliseconds\"",
              "B might not see the tweet yet — \"eventual\" puts no bound on how long replication takes",
              "B definitely won't see it — eventual means tweets only propagate during nightly batch syncs",
              "B sees the tweet only if A was elected leader in the consensus round"
            ],
            "answer": 1,
            "explain": "**Eventual consistency** means: *if writes stop, replicas will converge — eventually*. There is **no SLA** on how long that takes. In practice cross-region replication often lands in 100–500 ms, but during a partition or replica lag spike it could be seconds or minutes. That's the whole trade: you get cheap, available writes at the cost of a stale-read window with no upper bound. For tweet feeds that's fine (nobody dies). For \"did this user already spend that dollar?\" it's a disaster — which is why payment systems pay the consensus tax and use linearizable writes for the ledger row, even if everything else is eventual."
          }
        ]
      },
      {
        "heading": "The named models",
        "body": [
          {
            "type": "terms",
            "items": [
              {
                "term": "Linearizable",
                "def": "Behaves as one copy with one clock. Every operation appears to happen instantaneously between its start and finish. The strongest practical model — and what consensus algorithms (Raft, Paxos) buy you."
              },
              {
                "term": "Sequential",
                "def": "All nodes agree on the *order* of operations, but that order need not match real time. Weaker than linearizable, rarely chosen on its own — mostly a stepping stone in the literature."
              },
              {
                "term": "Causal",
                "def": "If write B happened-after write A, every node sees A before B. Concurrent writes can land in any order. The sweet spot for chat, social feeds, collaborative docs."
              },
              {
                "term": "Read-your-writes",
                "def": "Your own writes are visible to your own subsequent reads. Other users may briefly see stale data. Cheap to bolt on — pin the session to the primary, or carry a version token."
              },
              {
                "term": "Monotonic reads",
                "def": "You never see time go backwards. Once you've read v5, no future read returns v4. Critical for UIs — without it, refreshing a page can show *older* data."
              },
              {
                "term": "Eventual",
                "def": "If writes stop, replicas converge. No bound on how long that takes. Fine for like counts. Dangerous for anything where two people can both spend the same dollar."
              }
            ]
          }
        ]
      },
      {
        "heading": "What it costs",
        "body": [
          {
            "type": "table",
            "headers": [
              "Model",
              "Cost (write RTT · stale reads)",
              "Use it for"
            ],
            "rows": [
              [
                "Linearizable",
                "RTT × 2+ · none",
                "balances, inventory, locks"
              ],
              [
                "Causal",
                "1 RTT · bounded",
                "chat, comments, collab editing"
              ],
              [
                "Read-your-writes",
                "1 RTT sticky · others stale",
                "profile edits, settings pages"
              ],
              [
                "Monotonic reads",
                "1 RTT · bounded",
                "feeds, dashboards, paginated lists"
              ],
              [
                "Eventual",
                "0 async · unbounded",
                "like counts, recs, analytics"
              ]
            ]
          },
          {
            "type": "quote",
            "text": "You can have consistency or availability under a network partition. Pick one.",
            "cite": "Eric Brewer, CAP theorem (1999)"
          },
          {
            "type": "p",
            "text": "CAP is a *forced* choice only during a partition. The rest of the time you're choosing between **C and latency** — and that bill comes due on every single request."
          }
        ]
      },
      {
        "heading": "Read-your-writes, the cheapest upgrade",
        "body": [
          {
            "type": "p",
            "text": "Going from eventual to read-your-writes rarely needs consensus. You just remember *what this user already saw* and route around staleness."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "def read_user(user_id, session):\n    pin = session.get('write_until')  # epoch ms set on last write\n    if pin and now_ms() < pin:  # still inside sticky window\n        return primary.fetch(user_id)  # leader read — always fresh\n    return any_replica.fetch(user_id)  # cheap replica read otherwise\n\ndef write_user(user_id, patch, session):\n    primary.update(user_id, patch)  # writes always hit leader\n    session['write_until'] = now_ms() + 5_000  # 2× p99 replication lag\n    # NOTE: other users still see stale — that's the contract"
          },
          {
            "type": "p",
            "text": "Five seconds is the lag budget, not a guess. Measure your **p99 replication delay** and set the window to 2×. Too short and the user sees their own write disappear; too long and you crush the primary."
          }
        ]
      },
      {
        "heading": "When it matters",
        "body": [
          {
            "type": "pros-cons",
            "goodLabel": "PICK STRONG WHEN",
            "watchLabel": "PICK WEAK WHEN",
            "good": [
              "Two readers seeing different values = real money lost",
              "The data is a *constraint* (unique IDs, balances, seat numbers)",
              "Humans coordinate via the value (locks, leader election)",
              "Audit or regulatory needs a single timeline"
            ],
            "watch": [
              "Staleness measured in seconds is invisible to the user",
              "Read traffic ≫ write traffic and reads must scale globally",
              "Conflicts have a sane merge (CRDT, LWW on a counter)",
              "Availability during partitions matters more than freshness"
            ]
          },
          {
            "type": "p",
            "text": "**Key insight:** consistency is per-field, not per-database. The same service can serve a linearizable balance and an eventually-consistent like count from the same Postgres — what changes is *which replica you read from and when you fence the write*. Treat it as a routing decision and the architecture writes itself."
          },
          {
            "type": "explain-back",
            "prompt": "Synthesis: you've seen the **strong → causal → eventual** spectrum, what each level **costs** (latency, availability under partition), and **read-your-writes** as the cheap upgrade. Design the consistency for a single product that has an **account balance**, a **like count**, and a **'your post is live' confirmation** — assign a level to each, justify it, and name the trade-off you accept on the one you weaken the most.",
            "modelAnswer": "Pick the *weakest* level that still keeps each field correct, because every step toward strong costs latency and availability during a partition. **Balance → linearizable (strong):** it's a constraint where two readers disagreeing is real money lost, so you read from the primary (or a fenced quorum) and pay the cross-region round-trip. **Like count → eventual:** reads vastly outnumber writes, staleness of a few seconds is invisible, and conflicts have a sane merge (it's a commutative counter / CRDT), so you serve it from the nearest replica and scale reads globally. **'Post is live' confirmation → read-your-writes (causal, session-scoped):** the user must see *their own* write immediately or it feels broken, but they don't need everyone else's writes — so you pin their session to the primary or carry a write token, which is far cheaper than making the whole feed linearizable. The trade-off I accept on the like count: under a partition it can briefly show different totals to different users and can drift before convergence — fine for a vanity metric, unacceptable for the balance. The architecture falls out of routing each field to the right replica at the right freshness.",
            "hint": "Don't pick one level for the whole DB. Per field: is disagreement *money* (strong), *vanity* (eventual), or *'did MY action stick'* (read-your-writes)? Then name what the eventual field can show wrong."
          }
        ]
      }
    ]
  },
  "distributed-txns": {
    "sections": [
      {
        "heading": "The problem with distributed state",
        "body": [
          {
            "type": "p",
            "text": "A single database gives you **ACID** for free — one transaction, one commit log, one truth. The moment you split state across services (orders, payments, inventory), that guarantee evaporates. Now you need consensus across machines that can crash, partition, or just be slow."
          },
          {
            "type": "p",
            "text": "Distributed transactions are the toolkit for keeping multiple systems *eventually consistent* (or *strongly consistent*, at a cost). The two camps: **lock-and-coordinate** (2PC/3PC) or **compensate-on-failure** (sagas). Pick wrong and you either deadlock under load or leak money on partial failures."
          }
        ]
      },
      {
        "heading": "Two-phase commit (2PC)",
        "body": [
          {
            "type": "p",
            "text": "A **coordinator** asks every participant *\"can you commit?\"* — if all say yes, it tells them to commit. One *no* (or timeout) and everyone rolls back. Simple in theory, brutal in practice."
          },
          {
            "type": "walkthrough",
            "title": "2PC: prepare then commit",
            "why": "The decision is only safe once it's durably logged — that's the single line every participant trusts when the coordinator goes quiet.",
            "nodes": [
              {
                "id": "c",
                "label": "Coordinator",
                "subtitle": "tracks votes",
                "x": 0.5,
                "y": 0.15,
                "accent": "sky"
              },
              {
                "id": "p1",
                "label": "Participant A",
                "subtitle": "orders db",
                "x": 0.3,
                "y": 0.45,
                "accent": "fire"
              },
              {
                "id": "p2",
                "label": "Participant B",
                "subtitle": "payments db",
                "x": 0.7,
                "y": 0.45,
                "accent": "fire"
              },
              {
                "id": "p3",
                "label": "Participant C",
                "subtitle": "inventory db",
                "x": 0.5,
                "y": 0.7,
                "accent": "fire"
              },
              {
                "id": "log",
                "label": "Commit log",
                "subtitle": "durable decision",
                "x": 0.5,
                "y": 0.92,
                "accent": "earth"
              }
            ],
            "steps": [
              {
                "title": "Coordinator opens the vote",
                "description": "One **coordinator** drives the whole protocol. It will ask every participant to commit, then tally the answers — nobody acts alone.",
                "activeNodes": ["c"],
                "activeEdges": []
              },
              {
                "title": "Phase 1 — prepare?",
                "description": "The coordinator broadcasts `prepare?` to all three participants at once. Each must lock its rows and answer whether it *can* commit.",
                "activeNodes": ["c", "p1", "p2", "p3"],
                "activeEdges": [
                  { "from": "c", "to": "p1", "label": "prepare?" },
                  { "from": "c", "to": "p2", "label": "prepare?" },
                  { "from": "c", "to": "p3", "label": "prepare?" }
                ]
              },
              {
                "title": "Collect the votes",
                "description": "Participants vote back. **All yes** means commit; a single *no* or timeout forces a global rollback. This is also the danger zone — locks are held until the coordinator decides.",
                "activeNodes": ["p1", "c"],
                "activeEdges": [{ "from": "p1", "to": "c", "label": "vote" }]
              },
              {
                "title": "Phase 2 — durably commit",
                "description": "Before telling anyone, the coordinator writes the decision to its **commit log**. If it crashes now, recovery reads this line — that durable record is what stops participants blocking forever.",
                "activeNodes": ["c", "log"],
                "activeEdges": [{ "from": "c", "to": "log", "label": "commit" }]
              }
            ]
          },
          {
            "type": "p",
            "text": "The killer flaw: if the coordinator crashes *after* phase 1 votes but *before* sending the commit, participants are stuck holding locks **forever**. **3PC** adds a `pre-commit` phase so participants can self-decide on coordinator death — but it assumes bounded network delay, which the real internet refuses to provide."
          }
        ]
      },
      {
        "heading": "Sagas: trade atomicity for liveness",
        "body": [
          {
            "type": "p",
            "text": "A **saga** is a sequence of local transactions, each with a **compensating action** that semantically undoes it. No global lock, no coordinator blocking — if step 4 fails, you run `compensate(3)`, `compensate(2)`, `compensate(1)` in reverse."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "def book_trip(user_id, trip):\n    saga = Saga()  # tracks completed steps for rollback\n    flight = saga.do(book_flight, trip.flight,\n                     compensate=cancel_flight)  # refund issued on failure\n    hotel = saga.do(book_hotel, trip.hotel,\n                    compensate=release_hotel)  # frees the room hold\n    try:\n        saga.do(charge_card, user_id, trip.total,\n                compensate=refund_card)  # money move — must be idempotent\n    except StepFailed:\n        saga.rollback()  # runs compensations in reverse order\n        raise\n    return flight, hotel"
          },
          {
            "type": "p",
            "text": "Compensations aren't rollbacks — once a flight is booked, the airline *knows*. You issue a **cancel**, which is a new fact in the timeline. Sagas are eventually consistent and **non-isolated**: another reader can briefly see the booked flight before the compensation lands."
          }
        ]
      },
      {
        "heading": "Sagas vs 2PC",
        "body": [
          {
            "type": "pros-cons",
            "goodLabel": "Sagas win when",
            "watchLabel": "2PC wins when",
            "good": [
              "Steps cross service/team boundaries with no shared DB",
              "Long-running workflows (minutes to days) — locks would kill you",
              "Participants have natural compensating actions (refund, cancel)",
              "You can tolerate brief visibility of intermediate states"
            ],
            "watch": [
              "All participants share one trusted infrastructure (e.g. XA-capable DBs)",
              "Operations are short and locks won't accumulate",
              "Strong isolation is legally or financially mandatory",
              "Compensation is impossible (you can't un-send an email)"
            ]
          }
        ]
      },
      {
        "heading": "Idempotency keys and the Outbox",
        "body": [
          {
            "type": "p",
            "text": "Both patterns demand **idempotency**: retries are inevitable, so every operation must be safe to apply twice. The standard move — pass a client-generated **idempotency key** and dedupe on the server side."
          },
          {
            "type": "code",
            "lang": "sql",
            "text": "CREATE TABLE charges (\n  idempotency_key TEXT PRIMARY KEY,    -- client-supplied uuid, never server-generated\n  user_id         BIGINT NOT NULL,\n  amount_cents    BIGINT NOT NULL,\n  status          TEXT NOT NULL,       -- pending | succeeded | failed\n  result          JSONB,               -- cached response for replay\n  created_at      TIMESTAMPTZ DEFAULT now()\n);\n-- Retry of same key returns cached `result` — no double-charge possible."
          },
          {
            "type": "p",
            "text": "The **Outbox pattern** solves the *dual-write* problem: you can't atomically `INSERT order` AND `PUBLISH event` across two systems. Instead, write the event to an `outbox` table *in the same DB transaction* as the order, then a poller ships outbox rows to Kafka."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "with db.transaction():  # one atomic commit\n    db.execute(\"INSERT INTO orders ...\", order)\n    db.execute(\"INSERT INTO outbox(topic,payload) VALUES(%s,%s)\",\n               \"orders.created\", json(order))  # event lives or dies with the order\n# Separate poller reads outbox, publishes, marks sent — at-least-once delivery."
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
                "term": "Lost coordinator",
                "def": "2PC participants block indefinitely if the coordinator crashes mid-protocol — always durably log the decision before notifying."
              },
              {
                "term": "Compensation gaps",
                "def": "Some actions can't be undone (sent email, fired missile) — sequence those last in the saga, after all reversible steps succeed."
              },
              {
                "term": "Non-idempotent retries",
                "def": "Without idempotency keys, every retry storm doubles your charges, emails, or inventory decrements."
              },
              {
                "term": "Outbox poller lag",
                "def": "Events sit in the table until polled; tune poll interval against latency SLOs or use CDC (Debezium) on the outbox table directly."
              },
              {
                "term": "Saga interleaving",
                "def": "Two sagas touching the same entity can produce orderings impossible under ACID — use semantic locks or per-entity serialization."
              }
            ]
          },
          {
            "type": "quote",
            "text": "Distributed transactions don't give you atomicity — they give you a vocabulary for the failure modes you'll ship with.",
            "cite": "operational reality"
          },
          {
            "type": "explain-back",
            "prompt": "Synthesis: design a 'place order' flow that debits a wallet, reserves inventory, and emails a receipt across three services. You have **2PC**, **sagas with compensations**, and **idempotency keys + the outbox pattern** in your toolbox. Decide which to use (and where), explain how they combine, and name the trade-off that drives the choice.",
            "modelAnswer": "Don't reach for one mechanism for the whole flow — combine them by failure mode. **Sagas, not 2PC, for the cross-service workflow:** 2PC holds locks and *blocks every participant indefinitely if the coordinator dies mid-protocol*, which kills availability at scale, so the order is a saga of local transactions (debit → reserve → email) each with a compensation (refund → release → no-op). **Sequence irreversible steps last:** the email can't be un-sent, so it runs only after the debit and reservation have both committed — compensations only need to undo the reversible steps. **Idempotency keys on every step** so a retry storm doesn't double-charge or double-reserve; the key is the order ID, and each service no-ops on a key it has already applied. **The outbox pattern** makes the 'committed locally *and* event published' pair atomic: each service writes its state change and the next event in the *same* DB transaction, then a poller (or CDC) ships the event — so you never lose a step or publish one you didn't commit. The trade-off: you give up the clean all-or-nothing *isolation* of 2PC and accept temporary partial states (money debited, inventory not yet reserved) plus the work of writing correct compensations — in exchange for liveness: no service blocks on a dead coordinator, and the system makes forward progress under failure.",
            "hint": "2PC = atomic but blocks on a dead coordinator. Saga = liveness but you write the undo. Idempotency keys + outbox are the glue that makes the saga's retries safe and its events not-lost. What are you trading for forward progress?"
          }
        ]
      }
    ]
  },
  "star-framework": {
    "sections": [
      {
        "heading": "Why STAR exists",
        "body": [
          {
            "type": "p",
            "text": "Behavioral questions sound open-ended (\"tell me about a time...\") but interviewers are scoring a specific shape: did you face a real problem, own it, do something concrete, and move a metric. **STAR** forces that shape so you don't ramble into a 4-minute origin story with no result."
          },
          {
            "type": "p",
            "text": "Use it as scaffolding, not a script. The interviewer should hear a story, not four labeled boxes. But if you can't privately label each sentence S/T/A/R, you're missing a piece."
          }
        ]
      },
      {
        "heading": "The four letters",
        "body": [
          {
            "type": "terms",
            "items": [
              {
                "term": "Situation",
                "def": "The context — team, system, scale, what was on fire. One or two sentences, concrete numbers if you have them."
              },
              {
                "term": "Task",
                "def": "Your specific responsibility in that situation. Not what the team did — what *you* owned."
              },
              {
                "term": "Action",
                "def": "What *you* actually did, step by step. First person singular. This is 60% of your answer."
              },
              {
                "term": "Result",
                "def": "The measurable outcome — latency dropped, revenue saved, incident closed. Numbers if possible, lessons learned if not."
              }
            ]
          }
        ]
      },
      {
        "heading": "Strong vs weak signal",
        "body": [
          {
            "type": "compare",
            "title": "Strong vs weak STAR answers",
            "axes": ["S — Situation", "T — Task", "A — Action", "R — Result"],
            "left":  { "label": "Strong", "accent": "sky", "values": [
              "Checkout p99 was 2.4s during Black Friday traffic",
              "I owned getting it under 800ms before next sale",
              "I profiled, found N+1 in cart query, added a Redis read-through",
              "p99 dropped to 610ms, +1.8% conversion, held through peak"
            ] },
            "right": { "label": "Weak", "accent": "fire", "values": [
              "Things were kind of slow sometimes",
              "The team wanted to make it faster",
              "We discussed options and implemented a solution",
              "It got better and the manager was happy"
            ] }
          },
          {
            "type": "p",
            "text": "The pattern: **specific numbers, first person, concrete verbs**. Weak answers drift into \"we\" and abstractions because the candidate either didn't do the work or didn't measure the outcome."
          }
        ]
      },
      {
        "heading": "A worked answer",
        "body": [
          {
            "type": "p",
            "text": "Prompt: *\"Tell me about a time you handled a production incident.\"*"
          },
          {
            "type": "code",
            "lang": "txt",
            "text": "[S] Last March our payment service started 5xx-ing at ~3% of traffic.   # concrete metric, not \"a lot\"\n    I was the on-call SRE for the billing pod that week.  # establishes ownership\n\n[T] I had to stop the bleeding within the 15-minute SLO  # quantified responsibility\n    and find root cause before the morning exec sync.  # real deadline, not vague\n\n[A] First I rolled back the deploy from 20 min prior — errors stayed.    # shows hypothesis + disproof\n    I checked the DB dashboard: connection pool was saturated at 200/200. # specific signal, not \"looked around\"\n    I scaled the pool to 400 and 5xx dropped to baseline in ~90 seconds. # the actual fix, with timing\n    Then I traced the leak to a missing `with` block in a retry handler. # root cause, not just mitigation\n    I shipped the fix, added a pool-exhaustion alert, wrote the postmortem. # closed the loop\n\n[R] Incident closed in 11 minutes, under SLO.  # measurable result\n    Zero recurrence in the 9 months since.  # durability of the fix\n    The alert has caught two unrelated leaks since then.  # bonus second-order win\n"
          },
          {
            "type": "p",
            "text": "Notice the **A section is the longest** and every sentence starts with \"I\". The R has three different flavors of result: immediate, durable, compounding."
          }
        ]
      },
      {
        "heading": "Watch out for",
        "body": [
          {
            "type": "pros-cons",
            "goodLabel": "Do",
            "watchLabel": "Avoid",
            "good": [
              "Pre-load 4-5 stories that each cover 2-3 themes (conflict, ambiguity, failure, leadership)",
              "Memorize the *numbers* — interviewers probe them",
              "Say \"I\" even when the team helped; clarify ownership when asked",
              "End on the Result — never trail off into \"and yeah, that's basically it\""
            ],
            "watch": [
              "Spending 90 seconds on Situation before any Action lands",
              "Inventing metrics you can't defend under follow-up",
              "Picking a story where you were a passive observer",
              "Reciting \"S... T... A... R...\" out loud — it's scaffolding, not stage directions"
            ]
          },
          {
            "type": "quote",
            "text": "If you can't say what *you* did and what *changed*, it's not a STAR answer — it's a synopsis.",
            "cite": "the rubric, basically"
          }
        ]
      }
    ]
  },
  "interview-loop": {
    "sections": [
      {
        "heading": "The loop, demystified",
        "body": [
          {
            "type": "p",
            "text": "A **big tech interview loop** is a pipeline, not a single event. Each stage filters for a different signal, and the same candidate can pass three rounds and fail the fourth — that's by design, not bad luck."
          },
          {
            "type": "p",
            "text": "Understanding the **shape** of the loop matters more than memorizing LeetCode patterns. You're being evaluated by 5-6 people who never talk to each other in real time, and the **debrief** is where their notes collide."
          }
        ]
      },
      {
        "heading": "The pipeline",
        "body": [
          {
            "type": "walkthrough",
            "title": "Typical FAANG loop",
            "why": "Each stage filters for a different signal — pass four, stumble on the fifth, and you're out. That's the design.",
            "nodes": [
              {
                "id": "rec",
                "label": "Recruiter Screen",
                "subtitle": "30 MIN",
                "x": 0.2,
                "y": 0.2,
                "accent": "water"
              },
              {
                "id": "tech",
                "label": "Tech Screen",
                "subtitle": "1 CODING",
                "x": 0.7,
                "y": 0.2,
                "accent": "sky"
              },
              {
                "id": "onsite",
                "label": "Onsite Loop",
                "subtitle": "4-6 ROUNDS",
                "x": 0.2,
                "y": 0.5,
                "accent": "amber"
              },
              {
                "id": "debrief",
                "label": "Debrief",
                "subtitle": "VOTE",
                "x": 0.7,
                "y": 0.5,
                "accent": "fire"
              },
              {
                "id": "offer",
                "label": "Offer / Reject",
                "subtitle": "MATCH",
                "x": 0.45,
                "y": 0.8,
                "accent": "earth"
              }
            ],
            "steps": [
              {
                "title": "Recruiter screen",
                "description": "It starts with logistics, not code. The recruiter confirms scope, **target level**, and comp range so you're aimed at the right bar before anyone judges your skills.",
                "activeNodes": ["rec"],
                "activeEdges": []
              },
              {
                "title": "Tech screen",
                "description": "One easy-to-medium coding problem that filters out the ~70% who can't actually code. Clear it and you've earned the onsite.",
                "activeNodes": ["rec", "tech"],
                "activeEdges": [{ "from": "rec", "to": "tech", "label": "pass" }]
              },
              {
                "title": "Onsite loop",
                "description": "The real test: **4-6 rounds** of coding, system design, and behavioral. This is where signal actually gets generated — each interviewer probes a different axis.",
                "activeNodes": ["tech", "onsite"],
                "activeEdges": [{ "from": "tech", "to": "onsite", "label": "invite" }]
              },
              {
                "title": "Debrief",
                "description": "Your 5-6 interviewers — who never compared notes in real time — collide their scores here. It's a **consensus vote**, not an average; one loud detractor can sink you.",
                "activeNodes": ["onsite", "debrief"],
                "activeEdges": [{ "from": "onsite", "to": "debrief", "label": "scores" }]
              },
              {
                "title": "Offer or reject",
                "description": "The vote resolves into a decision and a level match. Treat every round as independent — a bad one early doesn't doom you if the rest are strong.",
                "activeNodes": ["debrief", "offer"],
                "activeEdges": [{ "from": "debrief", "to": "offer", "label": "decide" }]
              }
            ]
          },
          {
            "type": "p",
            "text": "The **recruiter screen** is mostly logistics — confirm scope, target level, comp range. The **tech screen** is one easy-medium coding problem to filter out the 70% who can't code. The **onsite** is where signal actually gets generated."
          }
        ]
      },
      {
        "heading": "What each round actually tests",
        "body": [
          {
            "type": "table",
            "headers": [
              "Round",
              "Format",
              "What they test"
            ],
            "align": [
              "left",
              "left",
              "left"
            ],
            "rows": [
              [
                "Coding (×2)",
                "45 min, 1-2 problems",
                "Problem decomposition, edge cases, clean code under time"
              ],
              [
                "System Design",
                "60 min, open prompt",
                "Scaling reasoning, tradeoff vocabulary, drives the conversation"
              ],
              [
                "Behavioral",
                "45 min, STAR stories",
                "Ownership, conflict, impact — leveled signal"
              ],
              [
                "Bar Raiser",
                "45-60 min, varies",
                "Cross-org veto. Often the hardest interviewer in the loop"
              ],
              [
                "Hiring Manager",
                "30-45 min",
                "Team fit, growth trajectory, motivation"
              ]
            ]
          },
          {
            "type": "p",
            "text": "The **bar raiser** (Amazon's term — Google calls it cross-functional, Meta calls it the *jedi*) is a senior IC from a different org whose only job is to say no. They have **veto power** even if every other interviewer is a strong hire."
          }
        ]
      },
      {
        "heading": "The scoring math",
        "body": [
          {
            "type": "p",
            "text": "Most loops use a 4-point scale per round, and the debrief aggregates roughly like this:"
          },
          {
            "type": "code",
            "lang": "python",
            "text": "scores = {\n    \"coding_1\":   \"strong_hire\",   # 4 — unambiguous yes\n    \"coding_2\":   \"hire\",  # 3 — leaning yes, minor gaps\n    \"sys_design\": \"lean_no_hire\",  # 2 — this one is the killer\n    \"behavioral\": \"hire\",  # 3 — solid stories, no red flags\n    \"bar_raiser\": \"hire\",  # 3 — pass the veto\n}\n\n# debrief rule of thumb: one strong_no_hire blocks the offer\nblocked = any(s == \"strong_no_hire\" for s in scores.values())   # hard veto\nweak    = sum(1 for s in scores.values() if s in (\"lean_no_hire\", \"no_hire\"))\noutcome = \"reject\" if blocked or weak >= 2 else \"discuss\"  # 2+ weak ≈ dead\n"
          },
          {
            "type": "p",
            "text": "Two **lean-no-hires** is usually fatal even with three strong-hires. The debrief isn't an average — it's a **consensus** vote, and one loud detractor with specifics will beat three vague positives."
          }
        ]
      },
      {
        "heading": "Common mistakes",
        "body": [
          {
            "type": "pros-cons",
            "goodLabel": "Do",
            "watchLabel": "Avoid",
            "good": [
              "Ask clarifying questions for the first 3-5 minutes of every round",
              "Narrate your thinking — silence reads as stuck",
              "In system design, drive the whiteboard; don't wait to be prompted",
              "Prepare 6-8 STAR stories you can remix across behavioral prompts"
            ],
            "watch": [
              "Jumping to code before confirming the problem statement",
              "Optimizing prematurely in system design (sharding before you've drawn the API)",
              "One-word answers in behavioral — interviewer can't score what you don't say",
              "Arguing with the interviewer. They have the pen; you have 45 minutes"
            ]
          }
        ]
      },
      {
        "heading": "When it matters",
        "body": [
          {
            "type": "p",
            "text": "The loop is **calibrated for false negatives**. Big tech would rather reject 10 qualified people than hire 1 unqualified one — the rejection rate at the onsite stage is 80-90% even among people who passed the tech screen."
          },
          {
            "type": "quote",
            "text": "You're not being compared to the bar. You're being compared to the last person who sat in that chair.",
            "cite": "every hiring manager, eventually"
          },
          {
            "type": "p",
            "text": "Treat each round as **independent**. A bad coding round doesn't doom you if the next three are strong — but only if you reset between rounds instead of carrying the spiral forward."
          }
        ]
      }
    ]
  },
  "cloudflare-dns": {
    "sections": [
      {
        "heading": "The race nobody expected Cloudflare to win",
        "body": [
          {
            "type": "p",
            "text": "In April 2018, Cloudflare launched **1.1.1.1** and within months it was outperforming **Google's 8.8.8.8** — the incumbent that had ruled public DNS since 2009. The win wasn't marketing. It was **anycast everywhere**, **no logging**, and a stack tuned to shave milliseconds off the most boring lookup on the internet."
          },
          {
            "type": "p",
            "text": "If you've ever wondered why your `dig` command resolves so fast on 1.1.1.1, the answer is mostly *geography* — and a privacy posture that forced everyone else to catch up."
          }
        ]
      },
      {
        "heading": "Traditional DNS vs Cloudflare's anycast path",
        "body": [
          {
            "type": "p",
            "text": "Old-school recursive DNS sends your query on a *trip*: client → ISP resolver → root → TLD → authoritative. Cloudflare collapses the middle by **anycasting 1.1.1.1 from 300+ edge POPs** — the same IP, advertised from every city. BGP routes you to the nearest one automatically."
          },
          {
            "type": "diagram",
            "title": "Your query's actual path",
            "nodes": [
              {
                "id": "you",
                "label": "You",
                "subtitle": "browser",
                "x": 0.08,
                "y": 0.5,
                "accent": "water"
              },
              {
                "id": "isp",
                "label": "ISP resolver",
                "subtitle": "shared, slow",
                "x": 0.32,
                "y": 0.2,
                "accent": "amber"
              },
              {
                "id": "cf",
                "label": "1.1.1.1 anycast",
                "subtitle": "nearest POP",
                "x": 0.32,
                "y": 0.8,
                "accent": "sky"
              },
              {
                "id": "auth",
                "label": "Authoritative",
                "subtitle": "origin NS",
                "x": 0.7,
                "y": 0.5,
                "accent": "fire"
              },
              {
                "id": "cache",
                "label": "Edge cache",
                "subtitle": "warm hits",
                "x": 0.55,
                "y": 0.8,
                "accent": "earth"
              }
            ],
            "edges": [
              {
                "from": "you",
                "to": "isp",
                "kind": "dashed",
                "label": "old path",
                "accent": "amber"
              },
              {
                "from": "isp",
                "to": "auth",
                "kind": "dashed",
                "accent": "amber"
              },
              {
                "from": "you",
                "to": "cf",
                "kind": "dashed",
                "label": "anycast",
                "accent": "water"
              },
              {
                "from": "cf",
                "to": "cache",
                "kind": "solid",
                "accent": "earth"
              },
              {
                "from": "cf",
                "to": "auth",
                "kind": "dashed",
                "label": "on miss",
                "accent": "fire"
              }
            ]
          },
          {
            "type": "p",
            "text": "The amber path is the slow one — multi-hop, shared cache, often congested. The water path hits an edge POP usually within **10ms** of you, with a hot cache shared across millions of users."
          }
        ]
      },
      {
        "heading": "Feature comparison",
        "body": [
          {
            "type": "compare",
            "title": "1.1.1.1 vs 8.8.8.8",
            "caption": "Same protocol, different trade-offs.",
            "axes": ["DNSSEC validation", "DoH / DoT encryption", "Query logging", "Median latency (global)", "EDNS Client Subnet"],
            "left":  { "label": "1.1.1.1", "accent": "sky", "values": [
              "Yes — rejects spoofed records",
              "Yes — both supported",
              "None (KPMG-audited)",
              "11ms — denser anycast POPs",
              "Refused — privacy over CDN hint"
            ] },
            "right": { "label": "8.8.8.8", "accent": "fire", "values": [
              "Yes — rejects spoofed records",
              "Yes — both supported",
              "24-48h retained",
              "19ms",
              "Sent — better CDN routing, leaks /24"
            ] }
          },
          {
            "type": "p",
            "text": "That last row is the *real* fight. **ECS** lets CDNs route you to a nearby server based on your subnet — Google sends it, Cloudflare refuses. Faster CDN routing vs not leaking your location to every authoritative server you query."
          }
        ]
      },
      {
        "heading": "Try it yourself",
        "body": [
          {
            "type": "code",
            "lang": "bash",
            "text": "dig @1.1.1.1 example.com +stats  # query Cloudflare directly\ndig @8.8.8.8 example.com +stats  # same, against Google\n# look at the 'Query time:' line — usually 2-3x faster on 1.1.1.1\n\nkdig -d @1.1.1.1 example.com +tls  # DoT handshake on port 853\n# -d shows the TLS negotiation; ISP sees encrypted bytes only\n\ncurl -H 'accept: application/dns-json' \\\n  'https://1.1.1.1/dns-query?name=example.com&type=A'   # DoH — looks like normal HTTPS\n# blends into web traffic; ISP can't tell DNS from a page load"
          },
          {
            "type": "p",
            "text": "Run those twice — the second call is almost always faster because Cloudflare's POP has cached the answer from your first query. That's the anycast cache earning its keep."
          }
        ]
      },
      {
        "heading": "What surprised them in production",
        "body": [
          {
            "type": "p",
            "text": "The accidental lessons from launch were the interesting ones."
          },
          {
            "type": "terms",
            "items": [
              {
                "term": "1.1.1.1 was already in use",
                "def": "Half the internet had been squatting on `1.0.0.0/8` for internal nets and captive portals — Cloudflare had to coordinate with APNIC and absorb the garbage traffic."
              },
              {
                "term": "Refusing ECS broke some CDNs",
                "def": "Sites routing via subnet hints sent users to *distant* origins. Cloudflare bet correctly that privacy mattered more than 50ms of CDN routing."
              },
              {
                "term": "DoH adoption came from browsers, not users",
                "def": "Firefox enabling DoH-to-Cloudflare by default in 2019 moved more traffic in a week than two years of evangelism."
              },
              {
                "term": "Public audits became table stakes",
                "def": "The KPMG audit of the no-logging promise forced Google and Quad9 to make sharper public commitments about their own data handling."
              }
            ]
          }
        ]
      },
      {
        "heading": "Key insight",
        "body": [
          {
            "type": "quote",
            "text": "DNS is a latency problem disguised as a lookup problem.",
            "cite": "the unstated 1.1.1.1 thesis"
          },
          {
            "type": "p",
            "text": "Google won DNS in 2009 by being **reliable and free**. Cloudflare won it in 2018 by being **faster and more private** — both downstream of having more POPs than anyone else and refusing to monetize the query log. When you're picking a resolver today, you're really picking a *tradeoff*: ECS routing speed (Google) vs query privacy (Cloudflare). Both are correct answers, for different threat models."
          }
        ]
      }
    ]
  },
  "discord-cassandra": {
    "sections": [
      {
        "heading": "The original system",
        "body": [
          {
            "type": "p",
            "text": "2015. Discord launches with a single MongoDB replica set storing all messages. Reads and writes hit it directly. For a small team optimizing for shipping speed, this was the right call: MongoDB schema-on-write fit the rapidly evolving data model."
          },
          {
            "type": "p",
            "text": "By late 2016, Discord was handling 120 million messages per day. The problem: messages tab into MongoDB's \"working set\" pattern, where the database wants to keep recently-written data in RAM. But chat data has a weird access pattern — users scroll back, sometimes to messages from a year ago."
          }
        ]
      },
      {
        "heading": "The breaking point",
        "body": [
          {
            "type": "p",
            "text": "The pattern that killed it: someone would `@everyone` in a busy server. Every member opens the app to see the ping. They hit the API requesting the most recent N messages. MongoDB has to seek to the bottom of the channel's collection. The hot working set is suddenly cold — that data was pushed out of RAM days ago."
          },
          {
            "type": "p",
            "text": "Result: a single ping could cause a multi-second latency spike across the entire database."
          },
          {
            "type": "p",
            "text": "Symptoms in the dashboards:"
          },
          {
            "type": "ul",
            "items": [
              "p99 latency 5s+ during peak hours",
              "Replica lag growing because reads were saturating disk",
              "Memory usage on the order of 192GB but still page-faulting on cold reads",
              "Operations team had a permanent on-call rotation just for \"the database is sad\" pages"
            ]
          }
        ]
      },
      {
        "heading": "Why Cassandra",
        "body": [
          {
            "type": "p",
            "text": "The Discord team listed requirements before picking technology:"
          },
          {
            "type": "p",
            "text": "Cassandra checked every box. Crucially, the data model is partition-key + clustering-key, which maps naturally to (channel_id, message_id). Recent messages cluster together on disk. Cold reads of old channels don't evict hot data."
          }
        ]
      },
      {
        "heading": "The migration",
        "body": [
          {
            "type": "p",
            "text": "This is the hard part most case studies skip:"
          },
          {
            "type": "ol",
            "items": [
              "**Dual-write phase.** Every new message written to both MongoDB and Cassandra. Reads still served from MongoDB. Caught bugs in the new data model without risk.",
              "**Backfill.** Background job to copy historical messages. Took 9 months. They built a tool to deduplicate and reconcile.",
              "**Dual-read phase.** Reads went to both. Results compared. Diffs logged. Found schema bugs in the new system.",
              "**Cutover.** Flipped reads to Cassandra. MongoDB kept running for a month as fallback. Then turned off."
            ]
          },
          {
            "type": "p",
            "text": "Net result: from 120M messages/day on Mongo to 4 billion+ messages/day on Cassandra by 2020 with a fraction of the operational pain."
          }
        ]
      }
    ]
  },
  "aws-s3-outage": {
    "sections": [
      {
        "heading": "What happened",
        "body": [
          {
            "type": "p",
            "text": "February 28, 2017, 9:37am PT. An AWS engineer is debugging a slow billing system in S3 us-east-1. They run a routine command to take a small number of servers offline. A typo in the parameter takes a LARGE number offline. Including critical metadata servers that the rest of S3 needs."
          },
          {
            "type": "p",
            "text": "S3 us-east-1 starts failing. Within minutes:"
          },
          {
            "type": "ul",
            "items": [
              "Slack, Trello, Quora, Medium, Coursera all degrade or fail",
              "AWS's own status page can't update — it depends on S3 for its assets",
              "IoT devices that ping S3 endpoints start failing silently",
              "CI/CD pipelines worldwide stop because Docker images live in ECR (which depends on S3)"
            ]
          },
          {
            "type": "p",
            "text": "The outage lasted ~4 hours. Recovery required restarting subsystems that hadn't been restarted in years. Some of them took longer than expected because no one had tested cold-start at that scale recently."
          }
        ]
      },
      {
        "heading": "What we learned (the official postmortem)",
        "body": [
          {
            "type": "p",
            "text": "AWS published a detailed postmortem the next week:"
          },
          {
            "type": "ol",
            "items": [
              "**The command itself was too powerful.** One operator could take down too much. Fix: minimum increment for capacity removal, and rate limiting.",
              "**Subsystems had grown coupled.** The index and placement subsystems had been split for resilience, but in practice they couldn't recover independently. Fix: actually exercise the partition tolerance.",
              "**Status page depended on S3.** Comically meta. Fix: status infrastructure moved to be S3-independent.",
              "**Restart times unknown.** Some services hadn't restarted fully in years; their cold-start performance was worse than anyone realized. Fix: regular restart drills."
            ]
          }
        ]
      },
      {
        "heading": "The deeper lesson",
        "body": [
          {
            "type": "p",
            "text": "The most-cited takeaway online was \"you should not depend on S3 us-east-1.\" That misses the point. S3 has 99.999999999% durability — 11 nines. The problem wasn't durability. It was that thousands of services treated S3 like a local filesystem."
          },
          {
            "type": "p",
            "text": "In the years since: companies have multi-region failover. They have circuit breakers around S3 calls. They cache aggressively. They simulate cloud-provider outages in their chaos engineering. None of these were standard before 2017."
          }
        ]
      }
    ]
  },
  "netflix-chaos": {
    "sections": [
      {
        "heading": "The intuition",
        "body": [
          {
            "type": "p",
            "text": "Most engineers test reliability by avoiding failures. Netflix decided to do the opposite: introduce failures continuously, in production, during business hours. The tool: Chaos Monkey, which kills random EC2 instances. Released in 2011, open-sourced in 2012."
          },
          {
            "type": "p",
            "text": "The logic: failures will happen. The only question is whether they happen during a quiet Sunday at 3am (when no one is watching) or during a Tuesday at 2pm (when engineers can fix them). Forcing failures during business hours means the system MUST be built to survive them — there's no other option."
          }
        ]
      },
      {
        "heading": "The Simian Army",
        "body": [
          {
            "type": "p",
            "text": "Chaos Monkey was the first of many. Each \"monkey\" introduces a different failure mode:"
          },
          {
            "type": "p",
            "text": "Chaos Kong runs quarterly. Netflix can lose an entire AWS region (us-east-1 going down) and the user-facing experience stays up because traffic instantly fails over to other regions. They've actually used this in real outages: when Amazon had a region failure, Netflix users barely noticed."
          }
        ]
      },
      {
        "heading": "The cultural shift",
        "body": [
          {
            "type": "p",
            "text": "The real change wasn't the tools. It was that engineers couldn't ship code that didn't handle failure. If your service crashed when its database replica went down, Chaos Monkey would find that bug — in production — at 2pm — when you were watching. The pressure shifted from \"don't fail\" to \"fail gracefully.\""
          },
          {
            "type": "p",
            "text": "This is the founding insight of Chaos Engineering as a discipline. Today every major cloud company has a chaos-engineering practice. Gremlin productizes it. AWS sells Fault Injection Simulator. Google has DiRT (Disaster Recovery Testing) exercises annually."
          }
        ]
      }
    ]
  },
  "github-scaling": {
    "sections": [
      {
        "heading": "The unlikely truth",
        "body": [
          {
            "type": "p",
            "text": "GitHub.com runs on Ruby on Rails. The same framework that powers small startups handles 100+ million requests per second across all GitHub services in 2024. They didn't rewrite in Go or Rust. They scaled Rails."
          },
          {
            "type": "p",
            "text": "This is interesting because the standard advice is \"Rails doesn't scale.\" That advice is mostly wrong. What scales (or doesn't) is your architecture, not your framework."
          }
        ]
      },
      {
        "heading": "Where GitHub puts its work",
        "body": [
          {
            "type": "p",
            "text": "The architectural moves that made Rails work at GitHub scale:"
          },
          {
            "type": "ol",
            "items": [
              "**Read replicas everywhere.** MySQL with hundreds of read replicas. Application aggressively routes reads to replicas, writes to primary.",
              "**Caching at every layer.** Memcached at the application layer. CDN (Fastly) in front. Sticky cache keys that survive deploys.",
              "**Background jobs do everything possible.** Sidekiq workers handle anything that doesn't need to be in the request path. Hundreds of thousands of jobs per second.",
              "**Custom Git protocol implementations.** The git push/pull protocol isn't served by Rails. It's a C-based server (gitrpcd, internal) that talks to file storage directly.",
              "**Sharding by user/repo.** Spokes, GitHub's internal git storage layer, shards repositories across hundreds of file servers."
            ]
          }
        ]
      },
      {
        "heading": "What they DID rewrite",
        "body": [
          {
            "type": "p",
            "text": "Not everything stays in Rails. The decision criteria: rewrite when the latency budget or correctness requirements exceed what the framework can give."
          },
          {
            "type": "p",
            "text": "The pattern: high-volume hot paths get rewritten in faster languages. The 90% of pages that are just CRUD stay in Rails because rewriting them gains nothing."
          }
        ]
      },
      {
        "heading": "The cultural part",
        "body": [
          {
            "type": "p",
            "text": "GitHub maintained a strict performance budget: any deploy that regresses page load times gets reverted. They built tools (Scientist, an A/B-testing library for refactors) to validate that changes don't change observable behavior. They monitor everything."
          }
        ]
      }
    ]
  },
  "notion-ai": {
    "sections": [
      {
        "heading": "The product",
        "body": [
          {
            "type": "p",
            "text": "Notion AI launched in 2023. By 2024 it was used by millions of users daily, embedded into a notes app where users expect instant search and Q&A over their own data. Behind the scenes: a non-trivial RAG architecture that grew up while the team learned what worked."
          }
        ]
      },
      {
        "heading": "The naive version that did NOT work",
        "body": [
          {
            "type": "p",
            "text": "The first prototype was textbook RAG: chunk every Notion document by paragraph, embed with OpenAI ada, store in a vector DB, retrieve top-K on query, stuff into prompt. It mostly worked. Until it didn't."
          },
          {
            "type": "p",
            "text": "Failure modes that emerged:"
          },
          {
            "type": "ul",
            "items": [
              "**Permissions.** User A asks about \"the Q4 strategy.\" Top match is a doc User A can't access. Naive RAG would leak it.",
              "**Chunk irrelevance.** A 200-page Notion doc gets chunked into 500 chunks. A query about its 2nd sentence might return chunk #347 because of an embedding quirk.",
              "**No recency.** \"What did we decide last week?\" — embeddings don't care about dates. The user does.",
              "**Synonym misses.** \"Rate limit\" doesn't match \"throttling\" via cosine similarity alone."
            ]
          }
        ]
      },
      {
        "heading": "The production architecture",
        "body": [
          {
            "type": "p",
            "text": "What actually shipped (reverse-engineered from Notion engineering talks):"
          },
          {
            "type": "ol",
            "items": [
              "**Permission-aware index.** Each chunk is stored alongside an access control list. Retrieval filters at query time. Slow vs. fast: they accept the slow.",
              "**Hybrid search.** Vector search + keyword search (BM25) combined. Catches synonyms (vector) AND exact technical terms (keyword). Reciprocal rank fusion merges results.",
              "**Reranking.** Top-50 from hybrid go through a cross-encoder reranker. Top-5 to the LLM. The reranker is the unsung hero — improves answer quality dramatically.",
              "**Metadata filters.** Date, author, document type filters added to the index. Users implicitly want recency, even when they don't say so.",
              "**Prompt engineering for grounding.** The system prompt explicitly says: \"Only answer if the context contains the answer. Otherwise say you don't know.\" Reduces hallucinations.",
              "**Streaming + interruptibility.** First token in < 1s. User can interrupt. Cost-saving when they realize the answer is wrong."
            ]
          }
        ]
      },
      {
        "heading": "The operational reality",
        "body": [
          {
            "type": "p",
            "text": "Re-embedding every doc on every change is expensive. So they batched: changes accumulate for N minutes, then re-index. This trade-off introduces staleness — if you edit a doc and immediately ask about it, Notion AI might use the old version for a few minutes."
          },
          {
            "type": "p",
            "text": "Cost-wise: embedding costs dominate at scale. Even at $0.0001/1k tokens, a billion docs costs $100k+ to embed. Notion uses smaller embedding models where possible and caches aggressively."
          }
        ]
      }
    ]
  },
  "spotify-hendrix": {
    "sections": [
      {
        "heading": "The org problem",
        "body": [
          {
            "type": "p",
            "text": "2018. Spotify has 200+ ML engineers and data scientists across dozens of teams: recommendations, ads targeting, podcast discovery, content safety, dynamic pricing. Each team built models their own way. No shared standards. Deployment was different per team. Model versions were tracked in spreadsheets. Disaster."
          },
          {
            "type": "p",
            "text": "The fix: a single internal platform called Hendrix. Every model in the company gets deployed through it. Predictability, observability, and tooling all centralized."
          }
        ]
      },
      {
        "heading": "What Hendrix gives you",
        "body": [
          {
            "type": "p",
            "text": "A team that wants to ship a new ML model writes a config and a training script. Hendrix handles everything else:"
          }
        ]
      },
      {
        "heading": "The crucial insight: it's not about ML",
        "body": [
          {
            "type": "p",
            "text": "The cleverest part of Hendrix isn't the ML pipeline. It's the developer experience layer:"
          },
          {
            "type": "ul",
            "items": [
              "A single CLI: `hendrix train`, `hendrix deploy`, `hendrix rollback`. Same for every model.",
              "Self-service: a new team can ship its first model in a week, not a quarter.",
              "Standardized telemetry: every model emits the same metric shapes. Dashboards work for free.",
              "Approval workflows: production promotion needs a +1 from another engineer. Audit log is automatic."
            ]
          },
          {
            "type": "p",
            "text": "This is platform engineering. You're not building ML — you're building the system that other engineers build ML on. The metric is \"how fast can a new team get to value\" rather than \"how good is any one model.\""
          }
        ]
      },
      {
        "heading": "What this looks like at smaller scale",
        "body": [
          {
            "type": "p",
            "text": "You don't need 200 people to benefit from this thinking. Even at 3 engineers, you should:"
          }
        ]
      }
    ]
  },
  "gitlab-data-loss": {
    "sections": [
      {
        "heading": "The chain of failures",
        "body": [
          {
            "type": "p",
            "text": "January 31, 2017. GitLab.com goes down. An on-call engineer is debugging replication lag on their primary Postgres. To fix it, they need to clear out the replica's data directory before re-syncing."
          },
          {
            "type": "p",
            "text": "They type the rm -rf command. But they're SSH'd into the wrong server. They're actually wiping the PRIMARY's data directory. By the time they realize, 300GB of customer data is gone."
          },
          {
            "type": "p",
            "text": "They reach for backups. What happens next entered the engineering hall of fame as a teaching example:"
          },
          {
            "type": "ol",
            "items": [
              "**LVM snapshots** — taken every 24 hours. Most recent: 6 hours stale.",
              "**Regular pg_dump** — was scheduled, but the script silently failed. No alerts. Backups had been broken for months.",
              "**Azure disk snapshots** — disabled on the database server (deemed redundant).",
              "**Replication slot** — was the thing being debugged. Useless.",
              "**Cold backups to S3** — were being uploaded to a non-existent bucket due to a config typo. Files were silently discarded."
            ]
          },
          {
            "type": "p",
            "text": "Five backup mechanisms. One worked. They lost 6 hours of data — 5,000+ projects, comments, issues, merge requests."
          }
        ]
      },
      {
        "heading": "The radical move: live-stream the recovery",
        "body": [
          {
            "type": "p",
            "text": "GitLab livestreamed the entire recovery on YouTube. Their CTO and engineers debugging on camera. They published a public Google Doc with the running incident timeline. They tweeted updates."
          },
          {
            "type": "p",
            "text": "This was unprecedented. Most companies hide failures. GitLab made theirs a learning opportunity. The community responded with sympathy rather than outrage."
          },
          {
            "type": "p",
            "text": "The detailed postmortem that followed has been required reading at engineering orgs ever since. It's a model of:"
          },
          {
            "type": "ul",
            "items": [
              "No blame on the individual. The system allowed the destructive command.",
              "Concrete action items with owners and deadlines.",
              "Honest about what didn't work, including the dignity of admitting \"5 backups, none worked\"."
            ]
          }
        ]
      },
      {
        "heading": "What changed industry-wide",
        "body": [
          {
            "type": "p",
            "text": "The GitLab incident accelerated several trends:"
          },
          {
            "type": "ul",
            "items": [
              "\"Practice your restore\" became a slogan. A backup you've never tested is folklore.",
              "Monitoring of backup PROCESSES, not just storage. Did the script run? Did it produce output of expected size?",
              "Public postmortems shifted from rare to expected. Cloudflare, Datadog, Stripe all do them now.",
              "Cmd-aliasing for destructive ops. `rm` on production hosts got wrapped, `git push --force` got guarded."
            ]
          }
        ]
      }
    ]
  },
  "discord-19m": {
    "sections": [
      {
        "heading": "19 million people in one chatroom",
        "body": [
          {
            "type": "p",
            "text": "Discord routinely holds **19M+ concurrent users** across millions of voice/text channels, with **p99 message fan-out under 100ms**. That number isn't impressive because it's big — it's impressive because every one of those users is subscribed to **presence updates** for dozens of friends and hundreds of channels."
          },
          {
            "type": "p",
            "text": "A naive design sends N² events per state change. Discord's job is to make sure it never does."
          }
        ]
      },
      {
        "heading": "The topology",
        "body": [
          {
            "type": "diagram",
            "title": "Gateway → sessions → guild shards",
            "nodes": [
              {
                "id": "client",
                "label": "Client",
                "subtitle": "WebSocket",
                "x": 0.05,
                "y": 0.5,
                "accent": "water"
              },
              {
                "id": "gw",
                "label": "Gateway",
                "subtitle": "TLS termination",
                "x": 0.28,
                "y": 0.35,
                "accent": "sky"
              },
              {
                "id": "sess",
                "label": "Session Servers",
                "subtitle": "one per connection",
                "x": 0.55,
                "y": 0.5,
                "accent": "sky"
              },
              {
                "id": "guild",
                "label": "Guild Shard",
                "subtitle": "owns a server",
                "x": 0.82,
                "y": 0.3,
                "accent": "earth"
              },
              {
                "id": "presence",
                "label": "Presence Service",
                "subtitle": "Rust, in-mem",
                "x": 0.82,
                "y": 0.7,
                "accent": "fire"
              }
            ],
            "edges": [
              {
                "from": "client",
                "to": "gw",
                "kind": "dashed",
                "label": "WSS"
              },
              {
                "from": "gw",
                "to": "sess",
                "kind": "solid"
              },
              {
                "from": "sess",
                "to": "guild",
                "kind": "dashed",
                "label": "subscribe"
              },
              {
                "from": "sess",
                "to": "presence",
                "kind": "dashed",
                "label": "fan-out"
              }
            ]
          },
          {
            "type": "p",
            "text": "The **gateway** is dumb on purpose — it's a WebSocket terminator. The **session server** holds your connection's subscription state. Each **guild** (Discord's word for a server) lives on exactly one **shard**, so all events for that guild route through one process. No cross-shard locks, no consensus on the hot path."
          }
        ]
      },
      {
        "heading": "Vocabulary that actually matters",
        "body": [
          {
            "type": "terms",
            "items": [
              {
                "term": "Gateway",
                "def": "The WebSocket front door. Stateless, autoscaled, only knows how to forward frames."
              },
              {
                "term": "Session",
                "def": "A logical connection: which guilds you're subscribed to, your presence, your sequence number for resume-on-reconnect."
              },
              {
                "term": "Shard",
                "def": "A slice of guilds pinned to one process. Sharding by `guild_id` means all events for that guild are ordered and local."
              },
              {
                "term": "Presence",
                "def": "Your online/offline/idle state, plus what game you're playing. Read-heavy, write-bursty, never persisted to disk."
              },
              {
                "term": "Fan-out",
                "def": "One event (you came online) → N deliveries (everyone subscribed to you). The hard problem."
              }
            ]
          }
        ]
      },
      {
        "heading": "Why presence ate a Go service alive",
        "body": [
          {
            "type": "p",
            "text": "The original Read States service was Go. It tracked which messages each user had seen. Fine at first. Then the **GC tail latency** became the story: every couple of minutes, p99 spiked to 300ms+ because Go's garbage collector had to scan a multi-gigabyte heap of small objects."
          },
          {
            "type": "p",
            "text": "Discord rewrote it in **Rust**. Not because Rust is faster on the happy path — Go was already fine there — but because **no GC means no scan pauses**. The graph below isn't theoretical; their post-rewrite p99 dropped from ~300ms to ~10ms with the same CPU budget."
          },
          {
            "type": "code",
            "lang": "rust",
            "text": "// Read States: per-user, per-channel \"last seen\" cursor\nstruct ReadState {\n    user_id: u64,                    // 8 bytes — packed, no pointer chasing\n    channel_id: u64,                 // colocated by user for cache locality\n    last_message_id: u64,            // monotonic snowflake ID\n    mention_count: u32,              // u32 saves 4B per row over u64 — adds up at 1B rows\n}\n\nfn mark_read(state: &mut ReadState, msg_id: u64) {\n    state.last_message_id = msg_id;  // mutation in-place, no allocation, no GC pressure\n    state.mention_count = 0;         // reset on read — Discord's actual semantics\n}                                    // function returns, stack frame gone, zero heap touched"
          }
        ]
      },
      {
        "heading": "What \"fast\" actually requires",
        "body": [
          {
            "type": "table",
            "headers": [
              "Property",
              "Naive",
              "Discord (why)"
            ],
            "rows": [
              [
                "Presence fan-out",
                "Push to every friend",
                "Subscribe-on-view + 100ms batch (most changes have no viewer)"
              ],
              [
                "Message ordering",
                "Global clock / consensus",
                "Snowflake IDs + one shard per guild (no Paxos on hot path)"
              ],
              [
                "Reconnect",
                "Re-fetch everything",
                "Sequence numbers + session resume (98% of drops < 30s)"
              ],
              [
                "GC pauses",
                "Tune the GC",
                "Remove the GC, use Rust (can't tune under 10ms p99)"
              ],
              [
                "Hot guild (1M+)",
                "Same shard as everyone",
                "Dedicated shard + own fan-out (Mr Beast won't stall DMs)"
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
            "goodLabel": "What this design buys you",
            "watchLabel": "What it costs",
            "good": [
              "Linear scaling — add session servers, add shards, capacity grows",
              "Failure is local — one guild shard dying takes down one guild, not the platform",
              "Reconnect is cheap, so flaky mobile networks are survivable"
            ],
            "watch": [
              "Hot shards are real — a viral guild needs manual rebalancing",
              "Cross-guild features (DMs, friends list) bypass the shard model and need their own service",
              "Rust rewrites are not free — only do them when GC is provably the bottleneck, not because Rust is fashionable"
            ]
          },
          {
            "type": "quote",
            "text": "The shard is the unit of consistency. Everything else is eventually consistent and you live with it."
          }
        ]
      }
    ]
  },
  "distributed-kv-store": {
    "sections": [
      {
        "heading": "Summary",
        "body": [
          {
            "type": "p",
            "text": "You'll build a **3-node distributed key-value store** backed by the **Raft consensus protocol**. The cluster elects a single leader, replicates every write to a majority before acknowledging it, and survives any one node dying without losing data or accepting conflicting writes."
          },
          {
            "type": "p",
            "text": "This is the foundation underneath **etcd**, **Consul**, **CockroachDB**, and the metadata layer of nearly every modern orchestrator. Raft trades raw throughput for *linearizability*: clients see one consistent view, and a network partition can stall writes but never corrupt them. Understanding it cures most magical thinking about distributed systems."
          },
          {
            "type": "walkthrough",
            "title": "3-node Raft cluster with leader-routed writes",
            "why": "A write is only acknowledged once a **majority** has it — that's why one node can die without losing data or splitting the truth.",
            "nodes": [
              {
                "id": "client",
                "label": "Client",
                "subtitle": "retries on hint",
                "x": 0.08,
                "y": 0.5,
                "accent": "water"
              },
              {
                "id": "leader",
                "label": "Node A (Leader)",
                "subtitle": "appends + replicates",
                "x": 0.42,
                "y": 0.5,
                "accent": "sky"
              },
              {
                "id": "f1",
                "label": "Node B",
                "subtitle": "follower",
                "x": 0.8,
                "y": 0.18,
                "accent": "earth"
              },
              {
                "id": "f2",
                "label": "Node C",
                "subtitle": "follower",
                "x": 0.8,
                "y": 0.82,
                "accent": "earth"
              },
              {
                "id": "disk",
                "label": "WAL + Snapshot",
                "subtitle": "durable log",
                "x": 0.42,
                "y": 0.92,
                "accent": "fire"
              }
            ],
            "steps": [
              {
                "title": "Client sends the write",
                "description": "Every write goes to one place — the **leader**. A client that hits a follower gets a redirect hint and retries here, so there's never more than one writer.",
                "activeNodes": ["client", "leader"],
                "activeEdges": [{ "from": "client", "to": "leader", "label": "PUT k=v" }]
              },
              {
                "title": "Replicate to followers",
                "description": "The leader appends the entry to its log and ships it to both followers via `AppendEntries`. It waits for a **majority** to confirm before counting the write as committed.",
                "activeNodes": ["leader", "f1", "f2"],
                "activeEdges": [
                  { "from": "leader", "to": "f1", "label": "AppendEntries" },
                  { "from": "leader", "to": "f2", "label": "AppendEntries" }
                ]
              },
              {
                "title": "Persist durably",
                "description": "The entry is `fsync`'d to the **write-ahead log** so it survives a crash. Only now is the write safe to acknowledge — durability plus majority is what makes Raft linearizable.",
                "activeNodes": ["leader", "disk"],
                "activeEdges": [{ "from": "leader", "to": "disk", "label": "fsync" }]
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
              "**3-node cluster in Docker Compose** — each node runs your KV binary with a unique `node_id` and peer list, all networked on one bridge.",
              "**Raft-backed state machine** — uses `hashicorp/raft` (Go) or `pysyncobj` (Python); your job is wiring it to a `map[string]string` apply loop.",
              "**HTTP API** — `GET /kv/:key`, `PUT /kv/:key`, `DELETE /kv/:key`; writes only succeed on the leader.",
              "**Leader hint redirect** — followers respond `307` with the current leader address so clients can retry without external service discovery.",
              "**Smart client** — caches the last known leader, retries on `307` or connection failure, and re-probes on `503` during elections.",
              "**Chaos test script** — kills a random node every 30s and asserts the cluster stays available for reads and writes."
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
              "**Go 1.21+** or **Python 3.11+** — Go path uses `hashicorp/raft`; Python path uses `pysyncobj` (simpler but less production-grade).",
              "**Docker + Docker Compose v2** — for the 3-node local cluster and networking.",
              "**`curl` and `jq`** — to drive the API and parse JSON responses from your terminal.",
              "**Basic understanding of TCP and HTTP** — Raft RPCs flow over TCP; the client API is HTTP/1.1.",
              "**~2 GB free disk** — each node maintains its own write-ahead log and snapshots under a mounted volume."
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
              "**Scaffold** a single-node server with an in-memory `map[string]string` and HTTP handlers — no Raft yet, just verify reads and writes work end-to-end.",
              "**Integrate the Raft library** — define your FSM with `Apply(log)`, `Snapshot()`, and `Restore(reader)` methods so committed log entries mutate the map.",
              "**Bootstrap the cluster** — node A starts with `bootstrap: true` and the full peer list; B and C join via `AddVoter` RPC on first boot only.",
              "**Wire writes through Raft** — `PUT` handler serializes the command, calls `raft.Apply(cmd, timeout)`, and only returns 200 after the future resolves.",
              "**Implement leader-hint redirects** — followers check `raft.Leader()` and return `307 Temporary Redirect` to the leader's HTTP address.",
              "**Build the smart client** — keep a `lastLeader` cache, follow `307`s up to 5 hops, sleep 200ms and re-probe peers on `503` (election in progress).",
              "**Add the chaos script** — bash loop that `docker kill`s a random container, sleeps 30s, restarts it, and continuously asserts a counter increments via PUTs.",
              "**Verify durability** — `docker compose down && up`, then GET every key you wrote before; all values must survive."
            ]
          }
        ]
      },
      {
        "heading": "The heart of it: the FSM apply loop",
        "body": [
          {
            "type": "p",
            "text": "Everything else is plumbing. The FSM is where your KV semantics live — it must be **deterministic** and **fast**, because every node replays it in the same order."
          },
          {
            "type": "p",
            "text": "**The FSM itself** — types, the `Apply` callback Raft invokes after a majority commits each log entry. Determinism is non-negotiable; every node will replay it."
          },
          {
            "type": "code",
            "lang": "go",
            "text": "type kvFSM struct {\n    mu    sync.RWMutex          // guards reads against Apply\n    store map[string]string     // the actual state machine\n}\n\ntype command struct {\n    Op    string `json:\"op\"`    // \"set\" or \"del\" only\n    Key   string `json:\"key\"`\n    Value string `json:\"value\"` // empty on delete\n}\n\nfunc (f *kvFSM) Apply(log *raft.Log) interface{} {\n    var c command\n    if err := json.Unmarshal(log.Data, &c); err != nil {\n        return err                       // poison entry — crash loudly\n    }\n    f.mu.Lock()\n    defer f.mu.Unlock()\n    switch c.Op {\n    case \"set\":\n        f.store[c.Key] = c.Value         // committed by majority already\n    case \"del\":\n        delete(f.store, c.Key)           // idempotent, safe to replay\n    default:\n        return fmt.Errorf(\"unknown op\")  // never silently ignore\n    }\n    return nil                           // nil = success to raft.Apply caller\n}"
          },
          {
            "type": "p",
            "text": "**The HTTP handler** — forward writes to the leader (307 preserves method + body), then block until Raft replicates and applies."
          },
          {
            "type": "code",
            "lang": "go",
            "text": "func (h *handler) put(w http.ResponseWriter, r *http.Request) {\n    if h.raft.State() != raft.Leader {\n        leader := string(h.raft.Leader())\n        http.Redirect(w, r, leader+r.URL.Path, 307) // 307 preserves method+body\n        return\n    }\n    body, _ := io.ReadAll(r.Body)\n    cmd, _ := json.Marshal(command{Op: \"set\", Key: mux.Vars(r)[\"key\"], Value: string(body)})\n    f := h.raft.Apply(cmd, 500*time.Millisecond) // blocks until majority ack\n    if err := f.Error(); err != nil {\n        http.Error(w, err.Error(), 503)  // 503 during election or timeout\n        return\n    }\n    w.WriteHeader(204)                   // committed and applied\n}"
          }
        ]
      },
      {
        "heading": "Success criteria",
        "body": [
          {
            "type": "ul",
            "items": [
              "`docker compose up` brings all 3 nodes to **`Follower` or `Leader`** state within 5 seconds; logs show exactly one leader per term.",
              "`curl -X PUT node-b:8080/kv/foo -d bar` returns **307 to the leader**, and a follow-up to the leader returns **204**.",
              "`docker kill raft-leader` triggers a new election; writes resume within **2 seconds** with no data loss.",
              "`docker compose down && docker compose up` followed by `GET /kv/foo` returns **`bar`** — state survived restart.",
              "Chaos script runs **10 minutes** with one node always down; the monotonic counter increments without gaps or duplicates.",
              "Network-partition the leader from the other two with `iptables`: the **minority side stops accepting writes**, the majority elects a new leader."
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
              "Linearizable writes — the same guarantee etcd and Consul give you, built from scratch.",
              "Survives any single node failure with zero manual intervention or data loss.",
              "The mental model transfers directly to debugging real production clusters."
            ],
            "watch": [
              "Throughput is bounded by **leader fsync latency** — don't expect more than a few thousand writes/sec on a laptop SSD.",
              "**Never reuse a node_id** after wiping its data dir — Raft will refuse to join with stale term metadata.",
              "Stale reads from followers are a footgun: a follower can lag behind the committed index, so route reads to the leader unless you explicitly want bounded staleness."
            ]
          }
        ]
      }
    ]
  },
  "g1": {
    "sections": [
      {
        "heading": "The loop is five different interviews",
        "body": [
          {
            "type": "p",
            "text": "FAANG loops aren't one test — they're **five separate exams** stapled together, each with its own rubric, its own failure mode, and its own bar. Candidates who treat them uniformly lose to candidates who optimize per-round."
          },
          {
            "type": "p",
            "text": "The phone screen filters on *can you code at all*. The bar raiser filters on *would we regret hiring you in two years*. These are not the same skill. Prepare them like they're not."
          }
        ]
      },
      {
        "heading": "Round-by-round breakdown",
        "body": [
          {
            "type": "table",
            "headers": [
              "Round",
              "What they test",
              "Typical mistake"
            ],
            "rows": [
              [
                "Phone screen (45m, 1 LC)",
                "Code without panic + talk while typing",
                "Silent typing for 20 min"
              ],
              [
                "Coding x2-3 (45m each)",
                "Pattern recognition + clean code + edges",
                "Jumping to code before clarifying"
              ],
              [
                "System design (60m)",
                "Tradeoff reasoning + envelope math + drive",
                "Listing tech without justifying"
              ],
              [
                "Behavioral (45m)",
                "Leadership principles + scope + self-aware",
                "Vague 'we' instead of specific 'I'"
              ],
              [
                "Bar raiser (60m)",
                "Long-term fit + hiring-bar calibration",
                "Treating it like another behavioral"
              ]
            ]
          },
          {
            "type": "p",
            "text": "The **bar raiser** is the one most candidates misread. They're not from your team. They have **veto power** and they're calibrated to reject you if you're merely average for the level. Bring your A+ stories here, not your B stories."
          }
        ]
      },
      {
        "heading": "Preparation timeline",
        "body": [
          {
            "type": "p",
            "text": "Twelve weeks is the realistic floor if you have a full-time job. Compressing it works only if you've interviewed in the last year."
          },
          {
            "type": "ol",
            "items": [
              "**Weeks 1-4:** Grind 80-120 LeetCode mediums. Patterns over count — two-pointer, BFS/DFS, heap, DP, sliding window, monotonic stack.",
              "**Weeks 5-7:** System design. Read Designing Data-Intensive Apps chapters 1-6, then drill 8-10 classic designs (URL shortener, Twitter, Uber, chat, news feed).",
              "**Weeks 8-9:** Write out 8-10 STAR stories. Tag each with 2-3 leadership principles. Practice them aloud — not in your head.",
              "**Weeks 10-11:** Mock interviews. Real ones with humans on Pramp/interviewing.io. At least 6 coding, 3 system design, 2 behavioral.",
              "**Week 12:** Taper. Light review only. Sleep 8 hours. Don't learn anything new in the last 5 days."
            ]
          }
        ]
      },
      {
        "heading": "What separates good prep from bad prep",
        "body": [
          {
            "type": "pros-cons",
            "goodLabel": "Good prep",
            "watchLabel": "Bad prep",
            "good": [
              "**Timed** practice with talking aloud",
              "Mock interviews with **strangers** who push back",
              "STAR stories **written down** and tagged to principles",
              "System design with **explicit numbers** (QPS, storage, latency)",
              "Reviewing your **wrong answers** the same day"
            ],
            "watch": [
              "Silent LeetCode grinding alone at 2am",
              "Only mocking with friends who go easy",
              "Improvising behavioral answers cold",
              "Hand-waving 'use Kafka' with no capacity math",
              "Marking problems 'solved' and never revisiting"
            ]
          }
        ]
      },
      {
        "heading": "The talking-aloud script",
        "body": [
          {
            "type": "p",
            "text": "Interviewers score you on what they **hear**, not what you think. Bake the narration into muscle memory so it survives stress."
          },
          {
            "type": "code",
            "lang": "txt",
            "text": "1. RESTATE the problem in your own words   # confirms you heard it right\n2. ASK 2-3 clarifying questions  # input size, constraints, edge cases\n3. WALK through one small example by hand   # builds shared ground truth\n4. PROPOSE brute force first, state O()  # shows you can always ship something\n5. IDENTIFY the bottleneck out loud  # 'the nested loop is O(n²) here'\n6. OPTIMIZE — name the data structure  # 'a hashmap drops lookup to O(1)'\n7. CODE while narrating each block  # never type in silence > 30s\n8. TRACE through your example post-code  # catches off-by-one before they do\n9. DISCUSS edges: empty, single, duplicates  # interviewer was waiting for this\n10. STATE final time + space complexity  # closes the loop, signals seniority"
          }
        ]
      },
      {
        "heading": "Watch out for",
        "body": [
          {
            "type": "p",
            "text": "The **behavioral round is technical**. Loops fail there more than people admit — usually because candidates rehearsed coding for 200 hours and stories for 2. Allocate prep time to the rubric, not to what feels comfortable."
          },
          {
            "type": "quote",
            "text": "Hire-or-no-hire is decided in the debrief, not in the room. Your job is to give every interviewer one specific, repeatable reason to fight for you.",
            "cite": "ex-Amazon bar raiser"
          }
        ]
      }
    ]
  },
  "g2": {
    "sections": [
      {
        "heading": "The idea",
        "body": [
          {
            "type": "p",
            "text": "**Dynamic programming** is a fancy name for one trick: when you keep solving the same subproblem, store the answer the first time and look it up after that. Naive recursion repeats work; DP doesn't."
          },
          {
            "type": "p",
            "text": "Classic example — Fibonacci:"
          },
          {
            "type": "code",
            "lang": "python",
            "text": "def fib(n):\n    if n < 2: return n\n    return fib(n-1) + fib(n-2)\n\n# fib(40) takes ~30 seconds. fib(50) takes forever.\n# Why? It recomputes fib(30) over a million times."
          },
          {
            "type": "p",
            "text": "The DP fix: a 1-line cache decorator turns O(2ⁿ) into O(n)."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "from functools import cache\n\n@cache\ndef fib(n):\n    if n < 2: return n\n    return fib(n-1) + fib(n-2)\n\n# fib(1000) returns instantly."
          }
        ]
      },
      {
        "heading": "When to reach for it",
        "body": [
          {
            "type": "p",
            "text": "Two signals a problem is a DP problem:"
          },
          {
            "type": "ul",
            "items": [
              "**Overlapping subproblems** — the same smaller problem comes up many times.",
              "**Optimal substructure** — the best answer to the full problem is built from the best answers to subproblems."
            ]
          },
          {
            "type": "p",
            "text": "Canonical DP problems on every interview: longest common subsequence, knapsack, edit distance, coin change, longest increasing subsequence, matrix chain multiplication. Each is a different shape of \"try every choice, memoize the result.\""
          }
        ]
      },
      {
        "heading": "Two flavors",
        "body": [
          {
            "type": "p",
            "text": "**Top-down (memoization)** — write the natural recursion, slap `@cache` on it. Easiest to write. Risk: deep recursion = stack overflow."
          },
          {
            "type": "p",
            "text": "**Bottom-up (tabulation)** — fill a table from base cases upward. Loop-based, no recursion limit. Often faster constant factor. Harder to write the first time."
          },
          {
            "type": "p",
            "text": "Pick top-down when prototyping or in interviews. Bottom-up when shipping production code that has to handle large inputs."
          }
        ]
      }
    ]
  },
  "sd-back-of-envelope": {
    "sections": [
      {
        "heading": "The marker-cap moment",
        "body": [
          {
            "type": "p",
            "text": "**Picture the interviewer** pulling the cap off a whiteboard marker and saying: *design Twitter*. You have 45 minutes. The first 90 seconds are not about Kafka — they are about **numbers**. Candidates who skip this look like architecture astronauts."
          },
          {
            "type": "p",
            "text": "**Imagine a chef** sizing a kitchen before drawing the menu. You don't pick burners before you know how many covers per night. QPS and storage are the cover count."
          }
        ]
      },
      {
        "heading": "The three numbers you always pull",
        "body": [
          {
            "type": "p",
            "text": "Start with **DAU**, **actions per user per day**, and **payload size**. Everything else falls out of those."
          },
          {
            "type": "ul",
            "items": [
              "**QPS** = DAU · actions / 86,400 (≈ 100k seconds/day — round up)",
              "**Peak QPS** ≈ 2-3× average. State the multiplier out loud.",
              "**Storage/day** = writes/day · payload · replication factor (usually ·3)",
              "**Read:write ratio** — social = 100:1, payments = 1:1, logs = 0:1"
            ]
          }
        ]
      },
      {
        "heading": "Worked example: a Twitter clone",
        "body": [
          {
            "type": "p",
            "text": "300M DAU, 2 tweets/user/day, 300 bytes/tweet. Reads are 100× writes."
          },
          {
            "type": "code",
            "lang": "txt",
            "text": "writes/day  = 300M · 2          = 600M\nwrite QPS   = 600M / 100k       ≈ 6k QPS\npeak writes = 6k · 3            ≈ 18k QPS\nreads peak  = 18k · 100         ≈ 1.8M QPS\n\nstorage/day = 600M · 300B · 3   ≈ 540 GB/day\nstorage/yr  = 540 GB · 365      ≈ 200 TB/yr"
          },
          {
            "type": "p",
            "text": "Now you can justify choices: 1.8M read QPS → you **need a cache** (one Redis node ≈ 100k QPS). 200 TB/yr → **sharded** storage, not one Postgres."
          }
        ]
      },
      {
        "heading": "Round, don't compute",
        "body": [
          {
            "type": "p",
            "text": "Use **powers of ten**. 86,400 → 10⁵. 1 day → 10⁵ s. 1 year → 3·10⁷ s. Memorize these and you free your brain for the design."
          },
          {
            "type": "ul",
            "items": [
              "**1 KB · 1M = 1 GB**, **1 KB · 1B = 1 TB** — the unit ladder",
              "Saying *'about 2 million QPS, call it 2M'* beats fumbling 1,847,293",
              "**Always state assumptions** — interviewers grade reasoning, not arithmetic"
            ]
          }
        ]
      },
      {
        "heading": "Key insight",
        "body": [
          {
            "type": "p",
            "text": "Estimation is **not** a vanity ritual. It is the bridge between requirements and architecture. If your numbers don't justify a Kafka cluster, **don't draw one**."
          },
          {
            "type": "p",
            "text": "Senior signal: you reach for numbers *before* boxes. Staff signal: you re-estimate when a requirement changes (*'10× DAU? now reads are 18M QPS — single-region cache won't hold'*)."
          }
        ]
      }
    ]
  },
  "sd-sql-vs-nosql-vs-kv": {
    "sections": [
      {
        "heading": "The default answer trap",
        "body": [
          {
            "type": "p",
            "text": "**Picture a candidate** who says *'I'll use MongoDB'* for every design. Or *'Postgres scales fine'* for a 1M QPS feed. Both are wrong for the same reason: they picked the **tool** before naming the **access pattern**."
          },
          {
            "type": "p",
            "text": "**Think of a library**. Card catalog (SQL) lets you find books by any field. A locker room (KV) only works if you know your locker number. A scrapbook shelf (document) groups everything about one topic together. None is *better* — they answer different questions."
          }
        ]
      },
      {
        "heading": "The decision tree",
        "body": [
          {
            "type": "ol",
            "items": [
              "**Do you need multi-row transactions or joins?** → SQL (Postgres, MySQL, Spanner)",
              "**Single-entity lookup by known key, sub-ms, huge scale?** → KV (Redis, DynamoDB, Memcached)",
              "**Nested objects, flexible schema, query by a few fields?** → Document (Mongo, DynamoDB)",
              "**Append-only, time-ordered, analytical scans?** → Columnar (BigQuery, ClickHouse, Cassandra)",
              "**Graph traversals N hops deep?** → Graph (Neo4j) — but rarely the right call"
            ]
          }
        ]
      },
      {
        "heading": "What each one actually costs",
        "body": [
          {
            "type": "p",
            "text": "**SQL** gives you ACID and joins. You pay with **vertical scaling limits** (~100k QPS/node) and painful schema migrations. Great for orders, payments, anything with invariants."
          },
          {
            "type": "p",
            "text": "**KV** gives you sub-ms reads and effortless horizontal scale. You pay with **no secondary indexes** — if you need *'all users in CA'*, you're scanning. Great for sessions, feature flags, hot caches."
          },
          {
            "type": "p",
            "text": "**Document** gives you flexible schema. You pay with **weak transactions** across documents and joins that become app-layer N+1 queries. Great when one user-facing entity = one document."
          }
        ]
      },
      {
        "heading": "In the wild: a single product, three stores",
        "body": [
          {
            "type": "code",
            "lang": "sql",
            "text": "-- orders: needs invariants, ACID, refunds, audit\nCREATE TABLE orders (\n  id UUID PRIMARY KEY,\n  user_id UUID NOT NULL,\n  total_cents BIGINT NOT NULL CHECK (total_cents >= 0),\n  status TEXT NOT NULL\n);  -- Postgres\n\n-- session: hot path, sub-ms, ephemeral\nSET session:abc123 '{\"uid\":42,\"exp\":1730000000}' EX 3600;  -- Redis\n\n-- feed item: one document per post, denormalized for read fanout\n{ \"_id\": \"p_99\", \"author\": \"u_42\", \"text\": \"...\", \"likes\": 17 }  -- DynamoDB"
          },
          {
            "type": "p",
            "text": "Three stores, three access patterns. The mistake is forcing all three into one. The *other* mistake is reaching for 5 stores when 2 would do."
          }
        ]
      },
      {
        "heading": "Key insight",
        "body": [
          {
            "type": "p",
            "text": "**Name the query first.** *'Get user by id at 500k QPS'* picks KV. *'Refund the line item if the order is unshipped'* picks SQL. Architecture follows access."
          },
          {
            "type": "p",
            "text": "Staff signal: you talk about **isolation level** and **consistency model** explicitly — *'read-your-writes for the author, eventual for followers'* — instead of vaguely saying *'eventual consistency is fine'*."
          }
        ]
      }
    ]
  },
  "sd-sharding-strategies": {
    "sections": [
      {
        "heading": "The shard-key decision",
        "body": [
          {
            "type": "p",
            "text": "**Picture an interviewer** asking *'how do you shard 10 PB of user data?'* and the candidate saying *'by user_id'*. Right answer, half a sentence. The full answer is **which sharding scheme** — and the **failure mode** you accept."
          },
          {
            "type": "p",
            "text": "**Imagine a post office** with 100 PO boxes. You can assign boxes by **last-name hash** (even load, terrible for *'all the Smiths'*), by **zip range** (great for regional mail, hotspots when one zip booms), or by a **directory clerk** who remembers every assignment (flexible, but the clerk is now your bottleneck)."
          }
        ]
      },
      {
        "heading": "The three strategies",
        "body": [
          {
            "type": "p",
            "text": "**Hash sharding** — `shard = hash(key) % N`. **Even distribution**, dead simple, the default for KV stores. **Fails at**: range queries (you scan all shards), and resharding (rehashing moves ~all keys — use **consistent hashing** to limit movement to 1/N)."
          },
          {
            "type": "p",
            "text": "**Range sharding** — shard 1 = [a-f], shard 2 = [g-m], etc. **Range scans are fast** and locality is preserved. **Fails at**: hotspots — if user `taylor_swift` lands on shard 4, that shard burns while others idle. Used by HBase, Spanner, MongoDB."
          },
          {
            "type": "p",
            "text": "**Directory sharding** — a lookup service maps `key → shard`. **Maximally flexible**: rebalance one tenant, split one shard, pin a noisy neighbor. **Fails at**: the directory itself becomes a SPOF and a hot read path. Used by Vitess, Figma's sharded Postgres."
          }
        ]
      },
      {
        "heading": "Picking a shard key",
        "body": [
          {
            "type": "ul",
            "items": [
              "**High cardinality** — `country_code` (200 values) is a disaster, `user_id` (billions) is fine",
              "**Even distribution** — beware power laws (top 1% of users = 50% of traffic)",
              "**Matches the dominant query** — if you always read by `user_id`, shard by `user_id` so reads hit one shard",
              "**Stable** — never shard by a value that changes (email, current team)"
            ]
          },
          {
            "type": "p",
            "text": "**Composite keys** earn their keep: `(tenant_id, created_at)` keeps a tenant on one shard *and* enables range scans within it."
          }
        ]
      },
      {
        "heading": "Consistent hashing in 20 lines",
        "body": [
          {
            "type": "reveal",
            "question": "Why is consistent hashing useful for sharding?",
            "answer": "With plain `hash(key) % N`, **adding or removing one node rehashes nearly every key** — almost all of your data has to move. Consistent hashing places nodes on a logical ring and routes each key to the next node clockwise. When the cluster changes from N to N+1 nodes, **only ~1/N of keys move** (the slice that used to belong to the displaced neighbor). That's the difference between a 5-minute rebalance and a 5-hour outage."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "import hashlib, bisect\n\nclass Ring:\n    def __init__(self, nodes, vnodes=150):\n        self.ring = []  # sorted list of (hash, node)\n        self.vnodes = vnodes\n        for n in nodes:\n            self._add(n)\n\n    def _h(self, key):\n        return int(hashlib.md5(key.encode()).hexdigest(), 16)\n\n    def _add(self, node):\n        for i in range(self.vnodes):\n            bisect.insort(self.ring, (self._h(f\"{node}#{i}\"), node))\n\n    def route(self, key):\n        h = self._h(key)\n        idx = bisect.bisect(self.ring, (h,)) % len(self.ring)\n        return self.ring[idx][1]    # only ~1/N keys move on add/remove"
          },
          {
            "type": "p",
            "text": "Virtual nodes (`vnodes`) smooth the distribution — without them, adding one node creates a hotspot on its neighbor."
          }
        ]
      },
      {
        "heading": "Key insight",
        "body": [
          {
            "type": "p",
            "text": "Every sharding scheme **trades one failure mode for another**. Hash → no range scans. Range → hotspots. Directory → SPOF. The interview win is naming the trade, not picking the *'right'* one."
          },
          {
            "type": "p",
            "text": "Staff signal: you bring up **resharding** unprompted. *'We'll start with 64 logical shards on 8 physical nodes so we can split without rebalancing keys.'* That sentence ends the sharding portion of the interview."
          }
        ]
      }
    ]
  },
  "faang-pagination": {
    "sections": [
      {
        "heading": "Why offset pagination dies at scale",
        "body": [
          {
            "type": "p",
            "text": "`LIMIT 20 OFFSET 1000000` looks innocent. The database disagrees — it walks a million rows it will then throw away. Latency grows linearly with page number, and concurrent writes shuffle the answer mid-scroll."
          },
          {
            "type": "p",
            "text": "**Cursor pagination** is the FAANG-grade fix. The client carries an opaque token that encodes *where we left off*, and the server resumes from that exact position via an index seek — O(log n), not O(n)."
          },
          {
            "type": "walkthrough",
            "title": "Cursor flow",
            "subtitle": "OPAQUE TOKEN ROUND-TRIP",
            "height": 200,
            "why": "No `OFFSET`, no row-counting — the token *is* the position, so every page costs the same regardless of depth.",
            "nodes": [
              { "id": "client", "label": "client", "subtitle": "PAGE 1 REQUEST", "accent": "water", "x": 0.1,  "y": 0.5 },
              { "id": "api",    "label": "api",    "subtitle": "DECODE · SEEK",  "accent": "amber", "x": 0.42, "y": 0.5 },
              { "id": "db",     "label": "db",     "subtitle": "INDEX SCAN",     "accent": "earth", "x": 0.78, "y": 0.5 }
            ],
            "steps": [
              {
                "title": "Client sends the cursor",
                "description": "The client asks for the next page and hands back the **opaque cursor** it got last time — an encoded `(created_at, id)` position, not a page number.",
                "activeNodes": ["client", "api"],
                "activeEdges": [{ "from": "client", "to": "api", "label": "cursor in" }]
              },
              {
                "title": "API decodes and seeks",
                "description": "The api base64-decodes the token, checks its version, then issues an **index seek** — `WHERE (created_at, id) < (...)` — instead of walking rows it would throw away.",
                "activeNodes": ["api", "db"],
                "activeEdges": [{ "from": "api", "to": "db", "label": "seek" }]
              },
              {
                "title": "DB scans from that point",
                "description": "The composite index jumps straight to the position and reads the next 20 rows. This is **O(log n)** — page 1 and page 50,000 cost the same.",
                "activeNodes": ["db", "api"],
                "activeEdges": [{ "from": "db", "to": "api", "label": "rows" }]
              },
              {
                "title": "Return page + next cursor",
                "description": "The api encodes the last row as a fresh cursor and ships the page back. The client stores that token to resume from exactly here next time.",
                "activeNodes": ["api", "client"],
                "activeEdges": [{ "from": "api", "to": "client", "label": "next cursor" }]
              }
            ]
          }
        ]
      },
      {
        "heading": "Pick the right strategy",
        "body": [
          {
            "type": "p",
            "text": "**Three families, three trade-offs.** Offset is what newcomers reach for; keyset is what survives production; cursor is the public-API contract you ship to third parties."
          },
          {
            "type": "table",
            "headers": ["Strategy", "Cost at page N", "Stable under writes?", "Use when"],
            "align": ["left", "center", "center", "left"],
            "rows": [
              ["Offset/limit",  "O(N)",       "no",  "small admin tables, ≤ 10k rows"],
              ["Keyset (seek)", "O(log n)",   "yes", "internal lists, dashboard scroll"],
              ["Opaque cursor", "O(log n)",   "yes", "public APIs, mobile feeds"]
            ]
          },
          {
            "type": "p",
            "text": "**Stable sort + tiebreaker** is non-negotiable. `ORDER BY created_at` alone duplicates rows whenever timestamps tie — add `id` as a secondary key so the cursor encodes a single, reproducible position."
          }
        ]
      },
      {
        "heading": "The cursor contract",
        "body": [
          {
            "type": "p",
            "text": "**Treat the cursor as opaque.** Base64-encode the keyset and version it. Clients that parse the bytes will break the day you change the schema — and they will parse the bytes."
          },
          {
            "type": "code",
            "lang": "javascript",
            "text": "// Encode the keyset as an opaque cursor (versioned)\nfunction encodeCursor(row) {\n  const payload = { v: 1, t: row.created_at, id: row.id };  //  v: schema version\n  return Buffer.from(JSON.stringify(payload)).toString('base64url');  //  url-safe\n}\n\n// Decode + guard against tampering / stale versions\nfunction decodeCursor(token) {\n  const obj = JSON.parse(Buffer.from(token, 'base64url').toString());\n  if (obj.v !== 1) throw new Error('cursor_version_unsupported');  //  fail loud\n  return obj;\n}"
          },
          {
            "type": "practice",
            "lang": "sql",
            "prompt": "Write a keyset pagination query for posts ordered newest-first with a stable tiebreaker.",
            "starter": "-- Resume from (last_created_at, last_id), 20 per page\nSELECT id, created_at, title\nFROM posts\nWHERE (created_at, id) < ($1, $2)\nORDER BY created_at DESC, id DESC\nLIMIT 20;\n",
            "hint": "The (col, col) < (val, val) row-comparison is the standard SQL trick — Postgres uses the composite (created_at, id) index for an O(log n) seek."
          },
          {
            "type": "pros-cons",
            "goodLabel": "GOOD FOR",
            "watchLabel": "WATCH OUT FOR",
            "good": [
              "Stable scroll under heavy concurrent writes",
              "Constant latency regardless of page depth",
              "Cheap on the DB — pure index seeks"
            ],
            "watch": [
              "No 'jump to page 47' UI — cursors are forward-only",
              "`total_count` requires a separate COUNT(*) — refuse it on > 1M rows",
              "Schema changes require cursor versioning or you brick old clients"
            ]
          },
          {
            "type": "quote",
            "text": "Offset is what you write in the demo. Cursor is what survives the launch.",
            "cite": "every API postmortem ever"
          }
        ]
      }
    ]
  },
  "faang-distributed-ratelimit": {
    "sections": [
      {
        "heading": "Single-node bucket is the easy case",
        "body": [
          {
            "type": "p",
            "text": "**Token bucket on one server** is trivial: a counter, a refill rate, an `if tokens > 0` check. The hard part starts the moment you put a load balancer in front of N edge servers and the user's request can land on any of them."
          },
          {
            "type": "p",
            "text": "**Naive split** — give each edge `limit/N` tokens — fails under uneven traffic and over-counts at low N. You need shared state, or near-shared state with bounded drift."
          },
          {
            "type": "diagram",
            "title": "Edge fleet → shared counter",
            "subtitle": "ALL EDGES → REDIS CLUSTER",
            "height": 220,
            "nodes": [
              { "id": "e1",   "label": "edge 1", "subtitle": "TOKYO POP",    "accent": "fire",  "x": 0.08, "y": 0.2 },
              { "id": "e2",   "label": "edge 2", "subtitle": "LONDON POP",   "accent": "fire",  "x": 0.08, "y": 0.5 },
              { "id": "e3",   "label": "edge 3", "subtitle": "VIRGINIA POP", "accent": "fire",  "x": 0.08, "y": 0.8 },
              { "id": "gw",   "label": "limiter","subtitle": "INCR · EXPIRE","accent": "amber", "x": 0.5,  "y": 0.5 },
              { "id": "redis","label": "redis",  "subtitle": "SLIDING COUNT","accent": "earth", "x": 0.9,  "y": 0.5 }
            ],
            "edges": [
              { "from": "e1", "to": "gw",   "kind": "dashed", "label": "check" },
              { "from": "e2", "to": "gw",   "kind": "dashed", "label": "check" },
              { "from": "e3", "to": "gw",   "kind": "dashed", "label": "check" },
              { "from": "gw", "to": "redis","kind": "solid",  "label": "incr" }
            ]
          }
        ]
      },
      {
        "heading": "Algorithms, ranked by FAANG taste",
        "body": [
          {
            "type": "p",
            "text": "**Sliding window log** is the most accurate and the most expensive. **Sliding window counter** is the production default — bounded memory, ±1 request error. **Token bucket** wins when you need to allow bursts."
          },
          {
            "type": "table",
            "headers": ["Algorithm", "Memory", "Accuracy", "Allows burst?"],
            "align": ["left", "center", "center", "center"],
            "rows": [
              ["Fixed window",     "O(1)",        "low — edge spikes",  "no"],
              ["Sliding log",      "O(N requests)","exact",             "no"],
              ["Sliding counter",  "O(1)",        "near-exact",         "no"],
              ["Token bucket",     "O(1)",        "exact",              "yes"]
            ]
          },
          {
            "type": "p",
            "text": "**The trade is strictness vs latency.** A round-trip to Redis on every request adds 1–3 ms. A local approximation with periodic sync is sub-millisecond but can over-admit by ~5% during the sync window. Pick based on whether your limit is a billing cap (strict) or an abuse heuristic (loose)."
          }
        ]
      },
      {
        "heading": "The Redis script that doesn't lie",
        "body": [
          {
            "type": "p",
            "text": "**Atomicity matters.** Read-then-write across the network races itself. Use a Lua script so the check-and-decrement happens inside Redis with no round-trip in the middle."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "# Sliding-window counter — atomic via Lua\nLUA = \"\"\"\nlocal key = KEYS[1]            -- per-user bucket id\nlocal limit = tonumber(ARGV[1]) -- requests per window\nlocal window = tonumber(ARGV[2])-- window seconds\nlocal now = tonumber(ARGV[3])  -- caller's clock — server-side time is safer\nredis.call('ZREMRANGEBYSCORE', key, 0, now - window)  -- evict stale entries\nlocal count = redis.call('ZCARD', key)  -- current in-window count\nif count >= limit then return 0 end  -- reject — caller returns 429\nredis.call('ZADD', key, now, now)  -- record this request\nredis.call('EXPIRE', key, window)  -- cap memory if user goes quiet\nreturn 1                       -- accept\n\"\"\"\n\ndef allow(user_id, limit=100, window=60):\n    return redis.eval(LUA, 1, f\"rl:{user_id}\", limit, window, time.time())   # 1 round-trip"
          },
          {
            "type": "pros-cons",
            "goodLabel": "GOOD FOR",
            "watchLabel": "WATCH OUT FOR",
            "good": [
              "Per-user limits across a global edge fleet",
              "Lua keeps check + decrement atomic — no race",
              "Sliding window smooths out the fixed-window spike"
            ],
            "watch": [
              "Redis goes down → fail open or fail closed? Pick before launch",
              "Hot key — a single celebrity user can melt one shard",
              "Clock skew between edges shifts the window — use server time"
            ]
          },
          {
            "type": "quote",
            "text": "Rate limiting is a distributed-systems problem disguised as an if-statement.",
            "cite": "the limiter postmortem"
          }
        ]
      }
    ]
  },
  "faang-eventual-consistency": {
    "sections": [
      {
        "heading": "The 'I just saved it' bug",
        "body": [
          {
            "type": "p",
            "text": "**The user clicks save, sees a success toast, navigates back — and their change is gone.** They refresh, it appears. They file a bug. You can't reproduce it because your dev DB is one node."
          },
          {
            "type": "p",
            "text": "That's **eventual consistency** biting you. The write went to the primary; the read hit a replica that hadn't caught up yet. Replication lag is usually milliseconds — but milliseconds is enough when the client races back instantly."
          },
          {
            "type": "walkthrough",
            "title": "Read-after-write race",
            "subtitle": "REPLICA LAGS PRIMARY",
            "height": 230,
            "why": "The write and the read take **different paths** — that split is the whole bug, and read-your-writes routing is the fix.",
            "nodes": [
              { "id": "user",   "label": "client",  "subtitle": "WRITE THEN READ", "accent": "water", "x": 0.08, "y": 0.5 },
              { "id": "api",    "label": "api",     "subtitle": "ROUTING LAYER",   "accent": "amber", "x": 0.38, "y": 0.5 },
              { "id": "primary","label": "primary", "subtitle": "ACCEPTS WRITES",  "accent": "earth", "x": 0.72, "y": 0.22 },
              { "id": "replica","label": "replica", "subtitle": "LAGS BY MS",      "accent": "sky",   "x": 0.72, "y": 0.78 }
            ],
            "steps": [
              {
                "title": "Client writes",
                "description": "The user clicks save. The request hits the **routing layer** on its way to storage — and the UI flashes a success toast almost instantly.",
                "activeNodes": ["user", "api"],
                "activeEdges": [{ "from": "user", "to": "api", "label": "write" }]
              },
              {
                "title": "Write lands on the primary",
                "description": "Only the **primary** accepts writes, so the api routes the save there. The new value is now committed — but it lives on the primary alone for a few milliseconds.",
                "activeNodes": ["api", "primary"],
                "activeEdges": [{ "from": "api", "to": "primary", "label": "save" }]
              },
              {
                "title": "Client reads back immediately",
                "description": "The user navigates back and the page re-fetches. This read races the replication — it arrives before the change has propagated everywhere.",
                "activeNodes": ["user", "api"],
                "activeEdges": [{ "from": "user", "to": "api", "label": "read" }]
              },
              {
                "title": "Read hits a stale replica",
                "description": "The router load-balances this read onto a **replica that still lags by milliseconds**. It returns the old value — the user's change appears to have vanished.",
                "activeNodes": ["api", "replica"],
                "activeEdges": [{ "from": "api", "to": "replica", "label": "stale" }]
              }
            ]
          }
        ]
      },
      {
        "heading": "Consistency levels, ranked",
        "body": [
          {
            "type": "p",
            "text": "**Pick the weakest model that still feels correct to the user.** Strong consistency is expensive and rarely needed; eventual is cheap but visibly wrong; read-your-writes is the sweet spot for most product surfaces."
          },
          {
            "type": "table",
            "headers": ["Level", "Cost", "User-visible glitch", "Fit"],
            "align": ["left", "center", "left", "left"],
            "rows": [
              ["Strong",            "high",   "none",                   "money, inventory, auth"],
              ["Read-your-writes",  "medium", "other users lag a bit",  "user-owned data — profile, posts"],
              ["Monotonic reads",   "low",    "no time-travel backward",  "feeds, dashboards"],
              ["Eventual",          "lowest", "stale until convergence", "counters, analytics, recs"]
            ]
          },
          {
            "type": "p",
            "text": "**Read-your-writes** is the standard fix. The user sees their own changes immediately; other users see them after replication lag (usually < 100 ms). Two implementations dominate."
          }
        ]
      },
      {
        "heading": "Two ways to fake strong reads",
        "body": [
          {
            "type": "p",
            "text": "**Sticky sessions** route the user to the primary for a short window after every write. **Return-the-write** echoes the post-write state in the response so the client can render optimistically without re-reading."
          },
          {
            "type": "code",
            "lang": "javascript",
            "text": "// Read-your-writes via sticky cookie — short TTL post-write\nasync function handleWrite(req, res, body) {\n  const saved = await db.primary.insert(body);  //  always write to primary\n  res.cookie('rw_stick', '1', { maxAge: 5_000, httpOnly: true });  //  5s window\n  return res.json(saved);                     //  return the canonical row\n}\n\nasync function handleRead(req, res, id) {\n  const stuck = req.cookies.rw_stick === '1';  //  recently wrote?\n  const conn = stuck ? db.primary : db.replica;  //  primary if stuck, else replica\n  const row = await conn.findById(id);\n  return res.json(row);\n}"
          },
          {
            "type": "practice",
            "lang": "json",
            "prompt": "Sketch the write-response envelope that lets a client skip the re-read.",
            "starter": "{\n  \"data\": {\n    \"id\": \"post_01H8Z\",\n    \"title\": \"hello\",\n    \"version\": 7,\n    \"updated_at\": \"2026-06-01T12:00:00Z\"\n  },\n  \"meta\": {\n    \"consistency\": \"primary\",\n    \"replica_lag_hint_ms\": 80\n  }\n}\n",
            "hint": "The `version` lets the client detect a stale read later. The `consistency` field tells the SDK whether the body is canonical or a best-effort echo."
          },
          {
            "type": "pros-cons",
            "goodLabel": "GOOD FOR",
            "watchLabel": "WATCH OUT FOR",
            "good": [
              "Snappy UX without the cost of strong consistency",
              "Sticky sessions are a 5-line cookie change",
              "Returning the write halves request count after a save"
            ],
            "watch": [
              "Stickiness pins traffic to the primary — sized for it",
              "Cross-user reads still lag — don't promise what you can't deliver",
              "CRDT merges need commutativity — non-commutative ops break silently"
            ]
          },
          {
            "type": "quote",
            "text": "Strong consistency is a tax. Pay it on money, skip it on likes.",
            "cite": "the consistency triage rule"
          }
        ]
      }
    ]
  },
  "faang-idempotent-webhooks": {
    "sections": [
      {
        "heading": "At-least-once is the default",
        "body": [
          {
            "type": "p",
            "text": "**Every serious webhook system delivers at-least-once.** Network blips, ack timeouts, sender retries — the same event will hit your handler twice, sometimes thrice. Exactly-once is a marketing claim, not a guarantee."
          },
          {
            "type": "p",
            "text": "Your handler is the line of defense. If processing the same event twice would double-charge a card, send two emails, or mint two refunds, the bug is in **your code**, not the sender's."
          },
          {
            "type": "walkthrough",
            "title": "Retry flow with idempotency",
            "subtitle": "EVENT ID → DEDUPE STORE",
            "height": 220,
            "why": "Verify, then dedupe, then apply — in that order. The dedupe step is what turns at-least-once delivery into exactly-once effects.",
            "nodes": [
              { "id": "src",    "label": "stripe",   "subtitle": "EMITS EVENT",     "accent": "fire",  "x": 0.08, "y": 0.5 },
              { "id": "edge",   "label": "handler",  "subtitle": "VERIFIES HMAC",   "accent": "amber", "x": 0.4,  "y": 0.5 },
              { "id": "dedupe", "label": "dedupe",   "subtitle": "SEEN EVT_ID?",    "accent": "sky",   "x": 0.7,  "y": 0.25 },
              { "id": "db",     "label": "ledger",   "subtitle": "ATOMIC APPLY",    "accent": "earth", "x": 0.7,  "y": 0.75 }
            ],
            "steps": [
              {
                "title": "Sender emits the event",
                "description": "The provider fires a webhook. Because delivery is **at-least-once**, this exact event may arrive twice or thrice — a retry storm is normal, not an error.",
                "activeNodes": ["src"],
                "activeEdges": []
              },
              {
                "title": "Handler verifies the POST",
                "description": "Your **handler** checks the HMAC signature against the shared secret with a 5-minute window. Forged or replayed requests die here, before they touch any state.",
                "activeNodes": ["src", "edge"],
                "activeEdges": [{ "from": "src", "to": "edge", "label": "POST" }]
              },
              {
                "title": "Dedupe on event ID",
                "description": "The handler asks the **dedupe store**: have I seen this `evt_id`? If yes, it no-ops and returns `200` so the sender stops retrying.",
                "activeNodes": ["edge", "dedupe"],
                "activeEdges": [{ "from": "edge", "to": "dedupe", "label": "check" }]
              },
              {
                "title": "Apply once, atomically",
                "description": "Only a **new** event reaches the ledger, where the insert and the dedupe record commit together. The business logic runs exactly once per event ID.",
                "activeNodes": ["dedupe", "db"],
                "activeEdges": [{ "from": "dedupe", "to": "db", "label": "if new" }]
              }
            ]
          }
        ]
      },
      {
        "heading": "Idempotency keys vs event IDs",
        "body": [
          {
            "type": "p",
            "text": "**Two different deduplication mechanisms** that newcomers conflate. Event IDs come from the sender. Idempotency keys come from the caller. Use both, in different layers."
          },
          {
            "type": "table",
            "headers": ["Mechanism", "Who sets it", "Dedupe window", "Layer"],
            "align": ["left", "left", "center", "left"],
            "rows": [
              ["Event ID (`evt_…`)",      "sender (Stripe, GitHub)", "≥ 30 days",   "webhook receiver"],
              ["Idempotency-Key header",  "your client",             "24 h typical", "your API"],
              ["DB unique constraint",    "schema",                  "forever",     "last line of defense"]
            ]
          },
          {
            "type": "p",
            "text": "**Pick a dedupe window with intent.** 5 minutes catches the obvious retries; 24 hours catches the network partition that healed overnight; 30 days catches the manual replay your support team triggered. Webhook providers retry for days — match their budget."
          }
        ]
      },
      {
        "heading": "A handler that survives the double-tap",
        "body": [
          {
            "type": "p",
            "text": "**Three steps, in order: verify, dedupe, apply.** Skip the order and you'll either process forged events or duplicate work on retry."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "import hmac, hashlib, time\n\ndef handle_webhook(req, body, secret):\n    sig = req.headers['Stripe-Signature']  # 'v1=abc...,t=1700000000'\n    ts, mac = parse(sig)  # split into timestamp + hmac\n    if abs(time.time() - ts) > 300:  # 5-min replay window — reject old events\n        return 400\n    expected = hmac.new(secret, f\"{ts}.{body}\".encode(), hashlib.sha256).hexdigest()\n    if not hmac.compare_digest(expected, mac):  # constant-time — defeats timing attacks\n        return 401  # forged or tampered\n    evt = json.loads(body)\n    # Atomic insert — if event_id already exists, INSERT fails and we no-op\n    try:\n        db.execute(\"INSERT INTO processed_events(id, seen_at) VALUES (%s, NOW())\",\n                   (evt['id'],))  # unique constraint on id is the dedupe lock\n    except UniqueViolation:\n        return 200  # already processed — ack so sender stops retrying\n    apply_business_logic(evt)  # only runs once per event_id\n    return 200"
          },
          {
            "type": "pros-cons",
            "goodLabel": "GOOD FOR",
            "watchLabel": "WATCH OUT FOR",
            "good": [
              "HMAC verification with a 5-min replay window stops forgery",
              "DB unique constraint is your final, can't-be-bypassed dedupe",
              "Always return 200 on duplicates — silence the sender"
            ],
            "watch": [
              "Returning 500 on duplicate → retry storm forever",
              "Dedupe in Redis with TTL < provider retry budget → leaks",
              "Doing work *before* the dedupe insert — race re-processes"
            ]
          },
          {
            "type": "explain-back",
            "prompt": "In your own words: walk through the three steps a safe webhook handler does, in order, and why the order matters.",
            "modelAnswer": "First you **verify** the HMAC signature against your shared secret, with a 5-minute timestamp window — this rejects forged or replayed events before you spend any DB cycles on them. Second you **dedupe** by atomically inserting the sender's `evt_…` ID into a `processed_events` table with a unique constraint; if the insert fails on the constraint, you've seen this event before, so you no-op and return `200`. Third you **apply** the business logic, knowing you'll only get here once per event ID. The order is non-negotiable: verify before dedupe means attackers can't poison your dedupe store with junk IDs, and dedupe before apply means the at-least-once retries from Stripe or GitHub can't double-charge or double-email. Always return `200` on duplicates — anything else triggers a retry storm.",
            "hint": "Three words, in order: verify, dedupe, apply. What breaks if you flip any two of them?"
          },
          {
            "type": "quote",
            "text": "If your webhook handler isn't idempotent, you don't have a handler — you have a bug waiting for a retry.",
            "cite": "the at-least-once rule"
          }
        ]
      }
    ]
  },
  "faang-resilience-trio": {
    "sections": [
      {
        "heading": "The three things between you and a retry storm",
        "body": [
          {
            "type": "p",
            "text": "**Every distributed call fails.** Networks blip, pods get evicted, that downstream service you depend on goes through its own little crisis. The question is never *if* — it's *what your code does when it does*."
          },
          {
            "type": "p",
            "text": "**Idempotency**, **retries**, and **circuit breakers** are the resilience trio that turns transient failures into shrugs. Skip any one and you'll ship the bug that takes the whole fleet down at 3am — usually by retrying so hard you DDOS yourself."
          }
        ]
      },
      {
        "heading": "Idempotency — the foundation everything else stands on",
        "body": [
          {
            "type": "p",
            "text": "**Idempotency means: running the operation twice has the same effect as running it once.** Without it, retries are a footgun — every retry storm doubles your charges, emails, or inventory decrements."
          },
          {
            "type": "p",
            "text": "**The standard move:** caller generates a UUID (the idempotency key), server stores it, dedupes on it. If the same key shows up twice, you return the cached result instead of re-applying the side effect."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "def charge_card(user_id, amount, idem_key):\n    cached = db.fetch_one(\n        \"SELECT result FROM charges WHERE idem_key = %s\",  # PK lookup — O(1)\n        (idem_key,))\n    if cached:\n        return cached['result']  # same key → same answer, never re-charge\n    result = stripe.charge(user_id, amount)  # the real side effect\n    db.execute(\n        \"INSERT INTO charges(idem_key, result) VALUES (%s, %s)\",  # write-through\n        (idem_key, json(result)))  # cache for the next retry\n    return result"
          }
        ]
      },
      {
        "heading": "Retry strategies — backoff is non-negotiable",
        "body": [
          {
            "type": "p",
            "text": "**Linear** retries are how you take down your own service. **Exponential** backoff spaces retries out — 1s, 2s, 4s, 8s. **Jittered** exponential is the production answer: same growth curve, randomized so a thousand clients don't all retry at the same instant."
          },
          {
            "type": "table",
            "headers": ["Strategy", "Delay shape", "Synchronizes clients?", "Use for"],
            "align": ["left", "left", "center", "left"],
            "rows": [
              ["Fixed",       "1s, 1s, 1s",       "yes — danger",  "never in production"],
              ["Linear",      "1s, 2s, 3s",       "partially",     "low-traffic CLIs"],
              ["Exponential", "1s, 2s, 4s, 8s",   "yes — danger",  "single-client jobs"],
              ["Jittered exp", "rand(0, 2^n)",    "no — safe",     "the production default"]
            ]
          },
          {
            "type": "code",
            "lang": "python",
            "text": "import random, time\n\ndef call_with_retry(fn, max_attempts=5, base=0.1, cap=30.0):\n    for attempt in range(max_attempts):\n        try:\n            return fn()  # business call\n        except TransientError:\n            if attempt == max_attempts - 1:\n                raise  # give up — caller decides\n            # Full jitter — AWS architecture blog's recommended form\n            delay = random.uniform(0, min(cap, base * 2 ** attempt))  # decorrelates clients\n            time.sleep(delay)  # sleep, then loop\n        except PermanentError:\n            raise  # 4xx — never retry"
          }
        ]
      },
      {
        "heading": "Circuit breakers — stop retrying when the downstream is dead",
        "body": [
          {
            "type": "p",
            "text": "**Retries help with blips. They make outages worse.** When a downstream is down, every retry adds load to a system already on its knees. A circuit breaker watches the error rate and *trips* — short-circuiting calls so the downstream gets a chance to recover."
          },
          {
            "type": "p",
            "text": "**Three states.** Closed: traffic flows normally. Open: every call fails fast, no network attempt. Half-open: one probe at a time, to test the waters before re-admitting traffic."
          },
          {
            "type": "walkthrough",
            "title": "Circuit breaker state machine under a failing dependency",
            "caption": "Walk through how the breaker trips, cools off, and re-admits traffic.",
            "nodes": [
              { "id": "closed",   "label": "Closed",    "subtitle": "TRAFFIC FLOWS", "accent": "earth", "x": 0.15, "y": 0.5 },
              { "id": "open",     "label": "Open",      "subtitle": "FAIL FAST",     "accent": "fire",  "x": 0.55, "y": 0.5 },
              { "id": "half",     "label": "Half-open", "subtitle": "ONE PROBE",     "accent": "amber", "x": 0.88, "y": 0.5 }
            ],
            "steps": [
              {
                "title": "Closed — error rate climbs",
                "description": "Every call runs normally. Breaker counts failures in a sliding window — say, 50% failures over 20 calls.",
                "activeNodes": ["closed"],
                "activeEdges": []
              },
              {
                "title": "Threshold tripped → Open",
                "description": "Failure threshold crossed. Breaker flips to Open. Every subsequent call returns immediately with CircuitOpenError — no network attempt at all.",
                "activeNodes": ["closed", "open"],
                "activeEdges": [{ "from": "closed", "to": "open", "label": "trip" }]
              },
              {
                "title": "Cooldown timer runs",
                "description": "Open holds for a fixed cooldown — typically 30s to 5m. During this window the downstream gets zero traffic from us. It recovers in peace.",
                "activeNodes": ["open"],
                "activeEdges": []
              },
              {
                "title": "Cooldown expires → Half-open",
                "description": "Breaker moves to Half-open. Exactly one call is allowed through as a probe. All others still fail fast.",
                "activeNodes": ["open", "half"],
                "activeEdges": [{ "from": "open", "to": "half", "label": "cool" }]
              },
              {
                "title": "Probe result decides",
                "description": "Probe succeeds → flip to Closed, traffic resumes. Probe fails → back to Open for another cooldown. Repeat until the dependency is alive.",
                "activeNodes": ["half", "closed"],
                "activeEdges": [{ "from": "half", "to": "closed", "label": "ok" }]
              }
            ]
          },
          {
            "type": "sequence",
            "title": "Client → Breaker → Service under partial failure",
            "caption": "Three actors, three retries — the breaker absorbs the third attempt so the service can breathe.",
            "actors": [
              { "id": "client",  "label": "Client",  "accent": "water" },
              { "id": "breaker", "label": "Breaker", "accent": "amber" },
              { "id": "service", "label": "Service", "accent": "fire" }
            ],
            "events": [
              { "from": "client",  "to": "breaker", "label": "request #1" },
              { "from": "breaker", "to": "service", "label": "forward",       "note": "closed state" },
              { "from": "service", "to": "breaker", "label": "5xx",           "note": "failure 1/3" },
              { "from": "client",  "to": "breaker", "label": "retry #2",      "note": "after jitter" },
              { "from": "breaker", "to": "service", "label": "forward" },
              { "from": "service", "to": "breaker", "label": "5xx",           "note": "threshold hit" },
              { "self": "breaker", "label": "TRIP → Open",                     "note": "no more calls",  "dashed": true },
              { "from": "client",  "to": "breaker", "label": "retry #3" },
              { "from": "breaker", "to": "client",  "label": "CircuitOpen",   "note": "fail fast — service spared" }
            ]
          }
        ]
      },
      {
        "heading": "Putting the trio together",
        "body": [
          {
            "type": "pros-cons",
            "goodLabel": "DO",
            "watchLabel": "AVOID",
            "good": [
              "**Idempotency key first** — without it, retries multiply side effects",
              "**Jittered exponential** for retry delay — never fixed or unjittered",
              "**Circuit breaker per downstream** — one slow service shouldn't trip the others",
              "**Bounded retry budget** — max attempts, max total wall-clock time"
            ],
            "watch": [
              "Retrying 4xx responses — those are *your* bug, not a blip",
              "Sharing one breaker across multiple downstreams — false trips",
              "Cooldown shorter than the downstream's recovery time — flapping",
              "Forgetting that two layers of retry compound: N × M attempts"
            ]
          },
          {
            "type": "quote",
            "text": "Idempotency makes retries safe. Backoff makes retries kind. Circuit breakers make retries optional.",
            "cite": "the resilience trio, in order"
          },
          {
            "type": "practice",
            "lang": "python",
            "prompt": "Wrap a flaky downstream call with full-jitter exponential backoff. Stop retrying after 5 attempts or 30 seconds total wall-clock, whichever comes first.",
            "starter": "import random, time\n\ndef call_with_budget(fn, max_attempts=5, total_budget=30.0, base=0.1, cap=10.0):\n    deadline = time.monotonic() + total_budget  # monotonic — immune to NTP step\n    for attempt in range(max_attempts):\n        try:\n            return fn()\n        except TransientError:\n            if attempt == max_attempts - 1 or time.monotonic() >= deadline:\n                raise  # budget exhausted\n            delay = random.uniform(0, min(cap, base * 2 ** attempt))\n            # Clamp delay so we don't sleep past the deadline\n            delay = min(delay, deadline - time.monotonic())\n            if delay <= 0:\n                raise\n            time.sleep(delay)\n",
            "hint": "Use `time.monotonic()` not `time.time()` — NTP slew on wall clock can make your deadline jump. Clamp the final sleep so you never overshoot the budget."
          },
          {
            "type": "explain-back",
            "prompt": "Synthesis: a payment service calls a flaky charge API. Compose **idempotency keys**, **jittered exponential backoff with a budget**, and a **circuit breaker** into one safe call path. Walk through the order they fire when a request comes in, explain *why that order* is the only correct one, and name the trade-off the circuit breaker forces you to accept.",
            "modelAnswer": "The order is **breaker check → idempotency key → retry-with-backoff**, and it can't be reshuffled. **Breaker first:** if the downstream is already known-dead the open breaker short-circuits instantly — no point attaching keys or burning a retry budget on a call that will only time out and add load to a struggling service. **Idempotency key before the first attempt:** generate it once (e.g. the order ID) and send it on *every* attempt, so when a retry duplicates a request that actually succeeded server-side, the downstream no-ops instead of double-charging — without this, retries make the problem worse, so it has to wrap the retry loop, not live inside it. **Retry with full-jitter exponential backoff under a bounded budget (max attempts AND max wall-clock, measured on the monotonic clock):** jitter so a thundering herd doesn't all retry in lockstep, exponential so you back off as the downstream struggles, budget so you fail fast instead of hanging the caller. Each failed attempt feeds the breaker's failure count; once it trips, subsequent calls skip straight to the fallback. The trade-off the breaker forces: **it deliberately fails *some* requests that might have succeeded** — while open it rejects everything, including the call that would have gone through — trading a few false rejections for protecting the downstream from a retry storm and giving it room to recover. Idempotency makes retries safe, backoff makes them kind, the breaker makes them optional.",
            "hint": "Order: check the breaker, attach the key, *then* retry. Why can't the key come after the retries start, and what does an open breaker cost you in exchange for protecting the downstream?"
          }
        ]
      }
    ]
  },
  "faang-cache-eviction": {
    "cliffhanger": "What happens when your cache hit rate drops from 95% to 80%? Where does that load go?",
    "sections": [
      {
        "heading": "The eviction question",
        "body": [
          {
            "type": "p",
            "text": "**Caches are finite.** The moment a new key arrives and the cache is full, something has to leave. The eviction policy is the rule that picks the victim — and it quietly decides your hit rate."
          },
          {
            "type": "p",
            "text": "Three policies dominate real systems: **LRU** (least recently used), **LFU** (least frequently used), and **ARC** (adaptive replacement). They look interchangeable in a benchmark and behave wildly differently under a real workload."
          }
        ]
      },
      {
        "heading": "**LRU** — evict the staleness",
        "body": [
          {
            "type": "p",
            "text": "**LRU** kicks out the entry that hasn't been touched for the longest. It assumes recency predicts the future — a fine bet for session caches, autocomplete, and most web workloads with temporal locality."
          },
          {
            "type": "p",
            "text": "Implementation is a **doubly-linked list + hashmap**: O(1) lookup, O(1) move-to-front on hit, O(1) pop-from-tail on evict. Python ships this as `collections.OrderedDict`; Redis ships an approximate variant by default."
          },
          {
            "type": "walkthrough",
            "title": "LRU with 5 slots — hit, miss, evict",
            "caption": "Walk one request stream through a 5-slot LRU cache and watch the tail move.",
            "nodes": [
              { "id": "head", "label": "HEAD",  "subtitle": "NEWEST", "accent": "fire",  "x": 0.09, "y": 0.5 },
              { "id": "s1",   "label": "slot1", "subtitle": "A",      "accent": "amber", "x": 0.25, "y": 0.5 },
              { "id": "s2",   "label": "slot2", "subtitle": "B",      "accent": "amber", "x": 0.41, "y": 0.5 },
              { "id": "s3",   "label": "slot3", "subtitle": "C",      "accent": "amber", "x": 0.57, "y": 0.5 },
              { "id": "s4",   "label": "slot4", "subtitle": "D",      "accent": "amber", "x": 0.73, "y": 0.5 },
              { "id": "tail", "label": "TAIL",  "subtitle": "OLDEST", "accent": "earth", "x": 0.89, "y": 0.5 }
            ],
            "steps": [
              {
                "title": "Start: cache holds A B C D (one slot free)",
                "description": "Five-slot cache. Right now A is most recent, D is oldest, one slot unused. Lookups touch the head when they hit, evictions pop from the tail.",
                "activeNodes": ["head", "s1", "s2", "s3", "s4", "tail"],
                "activeEdges": []
              },
              {
                "title": "Hit on C — promote to head",
                "description": "Request for key C. C is in the cache, so it's a hit. We unlink C from its slot and splice it in at the head. Order is now C A B D.",
                "activeNodes": ["head", "s3", "s1"],
                "activeEdges": [{ "from": "s3", "to": "head", "label": "promote" }]
              },
              {
                "title": "Miss on E — fill the free slot",
                "description": "Request for key E. Not in cache: this is a miss. The cache still has one free slot, so we fetch E from the source, insert at head. Order: E C A B D.",
                "activeNodes": ["head", "s1", "s2", "s3", "s4", "tail"],
                "activeEdges": [{ "from": "tail", "to": "head", "label": "insert E" }]
              },
              {
                "title": "Miss on F — evict D from the tail",
                "description": "Request for key F. Miss, and the cache is full. We pop D off the tail (least recently used), then insert F at the head. Final order: F E C A B.",
                "activeNodes": ["head", "tail", "s4"],
                "activeEdges": [
                  { "from": "tail", "to": "s4", "label": "evict D" },
                  { "from": "s4", "to": "head", "label": "insert F" }
                ]
              }
            ]
          }
        ]
      },
      {
        "heading": "**LFU vs ARC** — when recency lies",
        "body": [
          {
            "type": "p",
            "text": "**LFU** counts hits per key and evicts the lowest count. It dominates when a small hot set keeps getting hammered while a long tail churns past — think CDN edges for top-10% URLs. Downside: a key that was hot last week never leaves, even if traffic moved on."
          },
          {
            "type": "p",
            "text": "**ARC** keeps two LRU lists — one for recently-used-once keys, one for frequently-used keys — and adapts the split based on which side is taking more misses. It beats LRU and LFU on mixed workloads and ships as the default in ZFS and PostgreSQL's buffer manager."
          },
          {
            "type": "compare",
            "title": "LRU vs LFU vs ARC",
            "caption": "Same cache size, three workloads, three winners.",
            "axes": ["Wins when", "Loses when", "Memory overhead", "Real-world use"],
            "left":  { "label": "LRU",  "accent": "sky",   "values": ["Temporal locality — sessions, autocomplete", "Scan workload blows the whole cache away", "1 ptr per slot — tiny", "Redis (approx), `OrderedDict`, browser cache"] },
            "right": { "label": "LFU",  "accent": "fire",  "values": ["A small hot set dominates traffic", "Yesterday's hot key never leaves", "Counter per key — more state", "CDN edges, in-memory ad serving"] }
          },
          {
            "type": "p",
            "text": "**ARC** is the third option: a self-tuning blend that pays slightly more memory for measurably better hit rate on workloads where neither LRU nor LFU alone wins."
          },
          {
            "type": "table",
            "headers": ["Policy", "Read", "Write/Evict", "Extra state"],
            "align": ["left", "center", "center", "left"],
            "rows": [
              ["LRU", "O(1)", "O(1)",      "list pointers"],
              ["LFU", "O(1)", "O(1) amort.", "hit counter + freq buckets"],
              ["ARC", "O(1)", "O(1)",      "4 LRU lists + ghost entries"]
            ]
          },
          {
            "type": "interactive-viz",
            "viz": "cache-eviction",
            "title": "Same stream, three policies",
            "caption": "Toggle the policy. Watch hit rate diverge on the same request stream."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "from collections import OrderedDict\n\nclass LRUCache:\n    def __init__(self, capacity):\n        self.cap = capacity\n        self.data = OrderedDict()  # insertion-ordered — newest at the right\n\n    def get(self, key):\n        if key not in self.data:\n            return None  # miss — caller fetches from source\n        self.data.move_to_end(key)  # touch — mark as most recently used\n        return self.data[key]\n\n    def put(self, key, value):\n        if key in self.data:\n            self.data.move_to_end(key)  # update counts as a touch too\n        self.data[key] = value\n        if len(self.data) > self.cap:\n            self.data.popitem(last=False)  # evict from the left — oldest"
          },
          {
            "type": "pros-cons",
            "goodLabel": "PICK ARC WHEN",
            "watchLabel": "STICK WITH LRU WHEN",
            "good": [
              "Workload mixes a hot set with bursty scans",
              "You can afford ghost-entry memory for the adaptivity",
              "Hit rate matters more than dead-simple code"
            ],
            "watch": [
              "Cache lives inside a hot inner loop — LRU is one map + one list",
              "Workload is dominated by recency (sessions, autocomplete)",
              "Your team has to debug it at 3am — simpler eviction = clearer postmortem"
            ]
          },
          {
            "type": "practice",
            "lang": "python",
            "prompt": "Extend the LRUCache above so that `get` records a hit/miss counter, and add a `hit_rate()` method.",
            "starter": "from collections import OrderedDict\n\nclass LRUCache:\n    def __init__(self, capacity):\n        self.cap = capacity\n        self.data = OrderedDict()\n        self.hits = 0\n        self.misses = 0\n\n    def get(self, key):\n        # TODO: increment self.hits or self.misses\n        # then promote and return like before\n        pass\n\n    def hit_rate(self):\n        # TODO: return hits / (hits + misses), guarding divide-by-zero\n        pass\n",
            "hint": "Hit rate is the single number that tells you whether a cache is earning its memory. If it drifts below ~70% on a read-heavy workload, your eviction policy (or your capacity) is wrong."
          },
          {
            "type": "quote",
            "text": "LRU forgets the past, LFU worships it, ARC asks which one matters today.",
            "cite": "the eviction trilemma"
          }
        ]
      }
    ]
  },
  "lab-url-shortener": {
    "sections": [
      {
        "heading": "Design a URL shortener",
        "body": [
          {
            "type": "system-design-lab",
            "id": "lab-url-shortener",
            "title": "Design a URL shortener",
            "estimatedMin": 25,
            "scenario": "You are designing a URL shortener (think bit.ly). The product team wants **10M new URLs/day**, expects **100x more reads than writes**, needs **5-year retention** (so ~18B total URLs), and must hit **p95 < 100ms** for redirects. You have 25 minutes. Whiteboard the system, top-down.",
            "phases": [
              {
                "kind": "requirements",
                "title": "Phase 1: Requirements",
                "prompt": "Before you draw a single box, pin down what you're actually building. Functional features, non-functional targets, and one or two **explicit non-goals** so the interviewer doesn't pull you down a rabbit hole.",
                "blocks": [
                  {
                    "type": "predict",
                    "prompt": "An interviewer says \"design a URL shortener.\" You ask three clarifying questions. Which is the **least useful** question to ask first?",
                    "options": [
                      "\"What is the read-to-write ratio and total volume?\"",
                      "\"Do shortened URLs ever expire, or are they forever?\"",
                      "\"What font should the short URL render in?\"",
                      "\"Do users need analytics on click counts?\""
                    ],
                    "answer": 2,
                    "explain": "Read/write ratio drives **caching strategy**. Expiration drives **storage growth** and TTL logic. Analytics drives whether you need an **async event pipeline** (Kafka → warehouse) on top of the redirect path. Font is presentation — it never reaches the backend design."
                  },
                  {
                    "type": "explain-back",
                    "prompt": "In your own words: why does naming a **non-goal** in the first 60 seconds save you time later in this interview?",
                    "modelAnswer": "Stating non-goals (e.g., \"I'm not designing custom vanity URLs, branded domains, or A/B-routing in v1\") forces the interviewer to either accept your scope or correct it **before** you've already built the wrong system on the whiteboard. It's a forcing function for alignment — and shows you know that ambiguous specs are the #1 reason interview designs collapse at minute 35.",
                    "hint": "Think about whose time it costs when you build the wrong thing for 20 minutes."
                  }
                ],
                "reference": "**Functional:** (1) shorten long URL → return 7-char code; (2) GET /<code> → 301 redirect; (3) capture click event (async, not on hot path). **Non-functional:** 10M writes/day = ~115 writes/sec avg, ~350/sec peak; 1B reads/day = ~12K reads/sec avg, ~35K/sec peak; p95 redirect < 100ms; 5-year retention = 18B rows total. **Non-goals (v1):** custom vanity URLs, per-user analytics dashboards, link previews, edit-after-creation. **Auth:** API-key for creation, redirect path is anonymous and globally cached."
              },
              {
                "kind": "estimation",
                "title": "Phase 2: Estimation",
                "prompt": "Numbers on the whiteboard, *now*. QPS, storage, cache size, bandwidth. Don't say \"a lot\" — say a number. Wrong by 2x is fine; vague is not.",
                "blocks": [
                  {
                    "type": "predict",
                    "prompt": "At 10M new URLs/day with 100x read amplification, what's your **average** read QPS (round to the nearest thousand)?",
                    "options": [
                      "~1,200 reads/sec",
                      "~12,000 reads/sec",
                      "~120,000 reads/sec",
                      "~1,200,000 reads/sec"
                    ],
                    "answer": 1,
                    "explain": "10M writes/day × 100 = 1B reads/day. Seconds per day ≈ 86,400. 1,000,000,000 / 86,400 ≈ **11,574 reads/sec**, so ~12K. Always carry the peak factor (typically 3x average) when sizing capacity — that puts peak at ~35K reads/sec, which is what your cache + LB tier must absorb."
                  },
                  {
                    "type": "fill-blank",
                    "prompt": "Storage estimate at 5-year retention. Fill in the math.",
                    "code": "writes_per_day        = 10_000_000\nretention_days        = ___1___\ntotal_rows            = writes_per_day * retention_days  # ~18B rows\nbytes_per_row         = ___2___           # short_code(7) + long_url(~200) + ts(8) + owner(16) + clicks(8) + padding\ntotal_storage_bytes   = total_rows * bytes_per_row\ntotal_storage_TB      = total_storage_bytes / 1e12       # ~___3___ TB",
                    "blanks": [
                      { "id": 1, "correct": "1825" },
                      { "id": 2, "correct": "250" },
                      { "id": 3, "correct": "4.5" }
                    ],
                    "options": ["1825", "250", "4.5", "365", "100", "45"],
                    "explain": "5 years × 365 = **1,825 days**. A row is ~250 bytes once you add index overhead and row headers. 18B × 250 bytes ≈ 4.5 TB. That's small enough that **a single sharded Postgres cluster or a DynamoDB table is plenty** — you do NOT need a planet-scale store. Naming the number kills the temptation to over-engineer."
                  }
                ],
                "reference": "**Writes:** 10M/day = 115/sec avg, 350/sec peak. **Reads:** 1B/day = 12K/sec avg, 35K/sec peak. **Storage:** 18B rows × ~250 bytes ≈ 4.5 TB over 5 years. **Cache:** the Pareto rule says the hot 20% of links serves 80% of reads — cache the hottest ~100M codes in Redis ≈ 25 GB (50 bytes/entry). **Bandwidth:** redirect response is ~500 bytes; 35K rps × 500 = 17.5 MB/sec ≈ 140 Mbps out — trivial for a single LB tier."
              },
              {
                "kind": "api",
                "title": "Phase 3: API design",
                "prompt": "Two endpoints carry 99% of the traffic. Be precise about status codes, idempotency, and what you cache where.",
                "blocks": [
                  {
                    "type": "predict",
                    "prompt": "Your redirect endpoint returns **301** vs **302**. Which choice keeps your click analytics accurate, and why?",
                    "options": [
                      "301 — browsers re-request every time, so every click hits your server",
                      "302 — browsers cache the redirect aggressively, so analytics are free",
                      "301 — the redirect is permanent and SEO authority flows through",
                      "302 — browsers do NOT cache by default, so every click reaches your server and gets counted"
                    ],
                    "answer": 3,
                    "explain": "A **301 (Permanent)** is cached by browsers and proxies — once a user clicks, they never hit your server again for that code, which silently breaks click counting. A **302 (Found)** is uncached by default, so every click reaches you. Bit.ly and TinyURL both use 302 for exactly this reason. If you ever wonder \"why is my analytics drift so weird,\" check the redirect code first."
                  },
                  {
                    "type": "fix-it",
                    "prompt": "The POST /shorten handler below has one subtle bug that breaks **client retries**. Find it.",
                    "code": "@app.post(\"/shorten\")\ndef shorten(req: ShortenRequest):\n    code = generate_short_code()\n    db.insert(code=code, long_url=req.long_url, ts=now())\n    return {\"short\": f\"https://l.ink/{code}\"}\n",
                    "bug": "code = generate_short_code()",
                    "fix": "code = generate_short_code(idempotency_key=req.idempotency_key, long_url=req.long_url)",
                    "lang": "python",
                    "explain": "Client retries are the default — networks drop, lambdas reinvoke, mobile apps replay on resume. If your shorten endpoint mints a **new code on every call**, one user clicking \"Share\" twice burns two slots in your keyspace and pollutes their history with two different short URLs for the same long URL. Take an **idempotency key** from the client (or hash the long_url for unauthenticated calls) and return the same code for the same key."
                  }
                ],
                "reference": "**POST /shorten** (auth: API key, accepts `Idempotency-Key` header). Body: `{long_url, custom_alias?, expires_at?}`. 201 → `{short_url, code, expires_at}`. 409 if custom_alias is taken. **GET /:code** (anonymous, edge-cached at CDN with 60s TTL): 302 → `Location: <long_url>`; 404 if not found; 410 if expired. Async: fire-and-forget click event to Kafka topic `link.clicked` for analytics. Rate limit /shorten to 100 req/min per key; /:code is unlimited but DDoS-protected at the LB."
              },
              {
                "kind": "data-model",
                "title": "Phase 4: Data model + ID generation",
                "prompt": "**This is the heart of the design.** How you mint short codes is what separates a real answer from a hand-wave. Three approaches: hash, random, counter-based. Pick one and defend it.",
                "blocks": [
                  {
                    "type": "predict",
                    "prompt": "At 18B URLs over 5 years, you need a code space larger than 18B. You pick **base62** (a-z, A-Z, 0-9) at length 7 → 62^7 ≈ 3.5 trillion combos. If you generate codes **uniformly at random**, what's the approximate **collision probability** of any given new code clashing with an existing one once the table holds 18B rows?",
                    "options": [
                      "~1 in 10 — you'll collide every few seconds",
                      "~1 in 200 — you need a retry loop but it's cheap",
                      "~1 in 200,000 — handle with one DB unique constraint + one retry",
                      "Effectively zero — 7 chars is enough that you'll never see one in production"
                    ],
                    "answer": 1,
                    "explain": "18B / 3.5T ≈ **1 in 195** (~1 in 200). So out of 10M new writes/day you expect **~51,000 collisions/day** — common, but each is caught instantly. That's why a **UNIQUE constraint on the `code` column** plus a **bounded retry (max 3)** is the standard pattern — not a Bloom filter, not a coordination service. The retry adds <1ms in p99. If you'd picked 6 chars (62^6 ≈ 56B combos), the collision rate jumps to ~1 in 3 — unworkable."
                  },
                  {
                    "type": "explain-back",
                    "prompt": "You're explaining to a junior why you chose **counter-based + base62 encoding** over **hash(long_url)** for code generation. Give the two strongest arguments.",
                    "modelAnswer": "(1) **Determinism is a liability here, not an asset.** If `hash(long_url) → code` is deterministic, anyone shortening the same URL gets the same code — which leaks information (you can probe whether someone else already shortened a private URL) and breaks idempotency-per-user (two users want two different codes for the same target). (2) **Length control.** Hashes are fixed-length (MD5 = 32 hex chars, truncated MD5 risks more collisions); counter+base62 lets you start at 6 chars and grow to 7 only when the counter overflows, optimizing UX for early links. Counter also gives you a **monotonic ordering** you can use for sharding and pagination essentially for free.",
                    "hint": "Think about privacy and length, not raw speed."
                  }
                ],
                "reference": "**Choice: counter-based + base62 encoding.** A central counter service (or pre-allocated 1M-block ranges per app server) hands out 64-bit integers. Encode to base62 → 7 chars covers up to 62^7 ≈ 3.5T. **Why not hash:** deterministic = privacy leak + same-URL-collision; also fixed length. **Why not pure random:** 1-in-200 collision at scale → needs retries anyway. **Schema (DynamoDB / Cassandra):** PK = `code` (string, 7 chars), attrs = `long_url`, `created_at`, `expires_at`, `owner_id`. Optional GSI on `owner_id` for the \"my links\" dashboard. Counter persisted in a single Postgres row with row-level lock, or use **Twitter Snowflake** if you want decentralized counter allocation without a coordination tax."
              },
              {
                "kind": "scaling",
                "title": "Phase 5: Scaling reads",
                "prompt": "100x read amplification means **reads are everything**. Walk through the cache layers and the failure modes. Be specific about TTL, eviction, and what happens on a cache miss storm.",
                "blocks": [
                  {
                    "type": "predict",
                    "prompt": "A viral tweet links to one of your shortened URLs. 50K req/sec hit `/:code` for 10 minutes. Your Redis layer caches the code → long_url mapping with a 1-hour TTL. The code expires from cache exactly during the spike. What happens, and what's the fix?",
                    "options": [
                      "Nothing — Redis just re-fetches from DB once and re-populates the cache",
                      "**Thundering herd** — 50K concurrent requests all miss cache and hit Postgres simultaneously, which times out. Fix: single-flight at the cache layer (XFETCH / probabilistic early expiration)",
                      "The CDN absorbs everything since GET requests are idempotent — Redis is irrelevant",
                      "Postgres handles it fine because the query is a single PK lookup"
                    ],
                    "answer": 1,
                    "explain": "**Thundering herd** (aka cache stampede) is the classic failure mode here. When 50K concurrent clients all miss cache for the same key, they all hit your DB — even a PK lookup at 50K rps will saturate connection pools and tip you into timeout cascade. **Fixes (pick at least one):** (1) **Single-flight** — only one request per key fetches; others wait on the same promise (Go's `singleflight`, Python `asyncio.Lock` per key). (2) **XFetch / probabilistic early expiration** — refresh the cache *before* it expires, with probability rising as TTL approaches zero. (3) **Negative caching** — cache 404s too (with shorter TTL) so a bad code can't stampede."
                  },
                  {
                    "type": "fill-blank",
                    "prompt": "Fill in the production-grade read path. Order matters — name the layer at each step.",
                    "code": "# Read path for GET /:code\n# 1. Edge: ___1___ caches the 302 for 60s, near the user\n# 2. App tier: in-process LRU (size = 10K hot codes, ~1ms hit)\n# 3. Cluster cache: ___2___ (size = 25 GB, ~5ms hit, 99% hit rate at steady state)\n# 4. Source of truth: ___3___ (single-row PK lookup, ~10ms, never the hot path)\n# Fallback: 404 cached for 30s to prevent enumeration attacks",
                    "blanks": [
                      { "id": 1, "correct": "CDN" },
                      { "id": 2, "correct": "Redis" },
                      { "id": 3, "correct": "DynamoDB" }
                    ],
                    "options": ["CDN", "Redis", "DynamoDB", "Postgres", "Memcached", "ZooKeeper"],
                    "explain": "Four layers, each catching most of what the layer below would have seen. **CDN** (CloudFront / Fastly) catches geographically close clicks at edge POPs — for a viral link, this can absorb 95%+ of traffic before it ever hits your origin. **Redis** is your cluster-wide cache for the warm tail. **DynamoDB** (or Cassandra) is the source of truth, sharded on `code`, and gives you predictable single-digit-ms reads even at 35K rps. Pick DynamoDB over Postgres here because you want **predictable horizontal scaling** without an ops team."
                  }
                ],
                "reference": "**Read path:** CDN edge cache (60s TTL on 302) → in-process LRU on app server (10K hot codes) → Redis cluster (25 GB, hash-sharded on code, replicas in two AZs) → DynamoDB (PK = code, 5 RCU autoscale). **Cache strategy:** read-through with **XFetch** to kill stampedes; negative cache for 404 (30s TTL) to deflect enumeration attacks. **Write path:** synchronous insert to DynamoDB, then **async** populate Redis (best-effort) and fire `link.created` event to Kafka. **Failure modes:** if Redis dies, app falls back to DynamoDB directly — slower but still functional. If DynamoDB dies, serve from in-process LRU and degrade gracefully. **Sharding:** code is already a high-cardinality, uniformly distributed key — perfect natural shard. No special partitioning needed."
              },
              {
                "kind": "build",
                "title": "Phase 6: Ship it for real",
                "prompt": "The whiteboard is done. Now **build the smallest version that actually redirects** — one POST to shorten, one GET to redirect, persisted to a real store. Don't build all 5 phases; build the spine and get it live.",
                "blocks": [
                  {
                    "type": "predict",
                    "prompt": "You're scaffolding your own repo for the v1 build. What's the **right scope** for the first commit that runs locally?",
                    "options": [
                      "All five phases — CDN, Redis, DynamoDB, Kafka analytics, the lot — before anything runs",
                      "Just the spine: `POST /shorten` (counter→base62, write to one store) + `GET /:code` (lookup, 302). Run it locally first, add caching later",
                      "Only the front-end form — the backend can come after the demo",
                      "A full Terraform module before a single line of app code"
                    ],
                    "answer": 1,
                    "explain": "Ship the **walking skeleton** first: the two endpoints that define the product, backed by one durable store. A request can travel end-to-end on commit one. Caching (Redis), the CDN, and the Kafka analytics pipeline are layers you add *after* the spine redirects correctly — each is a measurable upgrade, not a prerequisite. Building all five phases before anything runs is how weekend projects die at 60% done. One focus, one running thing, then iterate."
                  },
                  {
                    "type": "fill-blank",
                    "prompt": "Fill in the staged plan to get your own v1 live. Each line is one short sitting.",
                    "code": "# 1. Scaffold your own repo: a minimal ___1___ app (FastAPI / Express / Flask — pick one you know)\n# 2. Implement the core: counter -> base62 encode -> POST /shorten; GET /:code does a lookup + 302\n# 3. Persist: start with ___2___ (SQLite / a single Postgres row for the counter) — swap to DynamoDB later\n# 4. Run it locally: curl POST a long URL, then curl the short code, confirm the 302 Location header\n# 5. Deploy: push to a free tier host (___3___ / Render / Railway) so a real browser can hit it",
                    "blanks": [
                      { "id": 1, "correct": "backend" },
                      { "id": 2, "correct": "SQLite" },
                      { "id": 3, "correct": "Fly.io" }
                    ],
                    "options": ["backend", "SQLite", "Fly.io", "Kubernetes", "Kafka", "CloudFront"],
                    "explain": "**Backend framework** you already know beats the trendy one — friction kills momentum. **SQLite** (or one Postgres row) is enough to prove the counter + lookup loop; you swap the store behind the same interface once it works. **A free-tier host** (Fly.io, Render, Railway) gets a real URL in front of a real browser in minutes — deploying early surfaces the boring-but-real problems (env vars, ports, cold starts) while the codebase is still tiny."
                  },
                  {
                    "type": "fix-it",
                    "prompt": "Your `GET /:code` works locally but every click 301s and your click counter never moves in production. One line is the cause.",
                    "code": "@app.get(\"/{code}\")\ndef redirect(code: str):\n    long_url = store.get(code)\n    if long_url is None:\n        raise HTTPException(status_code=404)\n    return RedirectResponse(long_url, status_code=301)\n",
                    "bug": "return RedirectResponse(long_url, status_code=301)",
                    "fix": "return RedirectResponse(long_url, status_code=302)  # 302 stays uncached so every click reaches you and gets counted",
                    "lang": "python",
                    "explain": "You caught this on the whiteboard in Phase 3 — now it bites in real code. A **301** is cached by the browser, so after the first click that user never hits your server again and your analytics flatline. Ship **302** for the redirect so every click reaches you. Seeing the exact bug you predicted show up in your own running app is the point of building it."
                  }
                ],
                "reference": "**Ship-it checklist (v1, one weekend):** (1) Scaffold your own repo — a minimal backend app in a framework you know (FastAPI, Express, or Flask). (2) Implement the spine: `POST /shorten` (counter → base62 → store) and `GET /:code` (lookup → **302**). (3) Persist to SQLite or a single Postgres counter row behind a thin `store` interface so the swap to DynamoDB later is a one-file change. (4) Run locally: `curl -X POST .../shorten -d '{\"long_url\":\"https://example.com\"}'`, then `curl -i .../<code>` and confirm `HTTP/1.1 302` + the `Location` header. (5) Deploy to a free-tier host (Fly.io / Render / Railway). **Then, and only then, layer up:** add a Redis read-through cache (Phase 5), put a CDN in front, and fire async click events. Each layer is a separate, demoable commit — never block 'it runs' on 'it scales'. **Do NOT** chase vanity custom domains or a dashboard for v1; those were your stated non-goals."
              }
            ],
            "reflection": "What surprised you about choosing between hash, random, and counter-based ID generation?"
          }
        ]
      }
    ]
  },
  "lab-rate-limiter": {
    "sections": [
      {
        "heading": "Design a distributed rate limiter",
        "body": [
          {
            "type": "system-design-lab",
            "id": "lab-rate-limiter",
            "title": "Design a distributed rate limiter",
            "estimatedMin": 25,
            "scenario": "You are designing an API gateway rate limiter. The gateway serves **100K req/sec** across **50 edge servers** (so ~2K rps per edge average). Each API key has a budget of **1,000 req/min**. Enforcement must be **fair across edges** (a client hitting different edges shouldn't slip past) and **survive a Redis outage** without blowing up the whole gateway.",
            "phases": [
              {
                "kind": "requirements",
                "title": "Phase 1: Requirements",
                "prompt": "Pin down the spec. What gets counted, what's the budget granularity, and — critically — what happens when the limiter itself fails. \"Fail open\" vs \"fail closed\" is a real business decision, not a technical one.",
                "blocks": [
                  {
                    "type": "predict",
                    "prompt": "An interviewer asks: \"If your Redis cluster goes down, do you fail open (allow all traffic) or fail closed (block all traffic)?\" Which answer demonstrates senior-level judgment?",
                    "options": [
                      "Fail closed — you always need correctness over availability",
                      "Fail open — rate limiting is non-essential, prioritize uptime",
                      "It depends — fail open is right for a public API gateway (uptime is product); fail closed is right for an auth-token endpoint (cost & abuse risk dominate). Name the trade and the layer.",
                      "Always fail open with a fallback to in-memory limits per edge"
                    ],
                    "answer": 2,
                    "explain": "There's no universal answer. **Public read APIs** (search, news, weather) — fail open; a rate limiter outage that takes down the product is worse than a few minutes of unmetered traffic. **Token mint endpoints / billing-relevant calls / write-amplifying ops** — fail closed; an outage that lets a hostile actor mint 1M tokens is a security incident, not a degraded experience. The senior move is to **name the trade-off explicitly** and let the business owner pick. Often the answer is **both**: fail open globally + fail closed on a small allowlist of sensitive routes."
                  },
                  {
                    "type": "explain-back",
                    "prompt": "Why is **per-API-key** rate limiting fundamentally different (architecturally) from **per-IP** rate limiting? Give the specific architectural consequence.",
                    "modelAnswer": "Per-IP buckets are **uniformly distributed** by IP hash — you can shard by IP and every edge's local view is roughly equivalent. Per-API-key is **wildly skewed**: one enterprise customer's key might do 90% of traffic while 10,000 hobbyist keys share the other 10%. That means (1) sharding by key produces hotspots — one Redis shard burns at 100% CPU while others sit at 5%; and (2) you can't get away with edge-local approximation for the big keys — they'll abuse the per-edge fragmentation. Architectural consequence: you need a **hot-key detector** that promotes high-volume keys to a dedicated tracking strategy (their own Redis shard, or a centralized atomic counter), while low-volume keys can use cheap edge-local approximation.",
                    "hint": "Think about the shape of the traffic distribution."
                  }
                ],
                "reference": "**Functional:** enforce 1,000 req/min per API key; reject with 429 + Retry-After header on overage; return remaining budget in response headers (`X-RateLimit-Remaining`, `X-RateLimit-Reset`). **Non-functional:** add < 5ms p99 to the request path (rate limit check is on every request); survive single-region Redis outage; correctness target is **soft** — overshooting the budget by ~5% during an edge sync window is acceptable, undershooting (false positives) is not. **Fail mode:** fail open globally with a circuit breaker that closes the limiter when Redis error rate > 50% for 30s. **Non-goals (v1):** dynamic per-customer budgets, burst pricing, tiered SLAs."
              },
              {
                "kind": "estimation",
                "title": "Phase 2: Token bucket vs sliding window",
                "prompt": "Two dominant algorithms. Each has a failure mode the other doesn't. Pick one — and be prepared to defend the choice with a specific scenario where the other one breaks.",
                "blocks": [
                  {
                    "type": "predict",
                    "prompt": "A client with a **1,000 req/min** budget sends a burst of 999 requests at 11:59:58 and another burst of 999 at 12:00:01. Under a **naive fixed-window** counter (reset every minute on the wall clock), how many requests do they actually get through?",
                    "options": [
                      "1,000 — the limiter does its job",
                      "1,998 — they exploit the window boundary and get nearly 2x their budget in 3 seconds",
                      "500 — half are blocked because the buckets average out",
                      "999 — only one burst makes it through, the other is rate-limited"
                    ],
                    "answer": 1,
                    "explain": "This is the **fixed-window boundary attack**. Naive minute-aligned counters reset to 0 at the wall clock minute boundary, so an attacker who knows the reset time can send the full budget twice in a few seconds — effectively 2x their entitlement. **Sliding window log** fixes this exactly (count every request in the last 60s, regardless of wall clock). **Token bucket** fixes this approximately (tokens refill continuously, so even at the boundary the bucket is empty). Fixed window is cheap but dangerous; never ship it for budgets you're charging for."
                  },
                  {
                    "type": "fix-it",
                    "prompt": "The token bucket below has one subtle bug that lets clients **accumulate unlimited budget** if they go idle.",
                    "code": "class TokenBucket:\n    def __init__(self, capacity, refill_per_sec):\n        self.capacity = capacity\n        self.refill_per_sec = refill_per_sec\n        self.tokens = capacity\n        self.last_refill = time.time()\n\n    def allow(self):\n        elapsed = time.time() - self.last_refill\n        self.tokens += elapsed * self.refill_per_sec\n        self.last_refill = time.time()\n        if self.tokens >= 1:\n            self.tokens -= 1\n            return True\n        return False\n",
                    "bug": "self.tokens += elapsed * self.refill_per_sec",
                    "fix": "self.tokens = min(self.capacity, self.tokens + elapsed * self.refill_per_sec)",
                    "lang": "python",
                    "explain": "Without **clamping to capacity**, a client who idles for an hour accumulates 60,000 tokens (60 min × 1,000/min) and can then burst the entire stockpile in one second — completely defeating the purpose of the limit. The capacity is your **burst budget**; tokens above it must be discarded, not banked. This is the single most common token-bucket bug in real code reviews."
                  }
                ],
                "reference": "**Choice: token bucket** (or sliding-window counter as a defensible alternative). **Why:** token bucket allows controlled bursts (capacity = 100 tokens lets a client send 100 in a second if they've been quiet — feels nice for legitimate bursty clients), refills continuously (no boundary attack), and is **O(1) state per key** (current tokens + last refill timestamp). Sliding-window log is more accurate but O(N) memory per key (one entry per request in the window) — at 1,000 req/min × 1M keys that's 1B records to track. **Sliding-window counter** is the middle ground: two adjacent fixed windows interpolated by elapsed-fraction-of-current-window. **Reject sliding window log for this scale; reject fixed window for correctness; ship token bucket with capacity=100, refill=1000/60≈16.7/sec.**"
              },
              {
                "kind": "data-model",
                "title": "Phase 3: Distributed state (Redis or local)",
                "prompt": "Where does the counter live? Each choice trades accuracy, latency, and blast radius. Be opinionated.",
                "blocks": [
                  {
                    "type": "predict",
                    "prompt": "You're choosing between (A) **centralized Redis** holding all counters and (B) **edge-local counters with periodic sync**. Which statement is most accurate about edge-local?",
                    "options": [
                      "Edge-local is always more accurate because there's no network hop",
                      "Edge-local is faster (sub-ms) but allows up to (sync_interval × num_edges) overshoot before convergence — you trade accuracy for latency and Redis offload",
                      "Edge-local is illegal under most SLAs because it can undercharge clients",
                      "Edge-local only works if all edges are in the same datacenter"
                    ],
                    "answer": 1,
                    "explain": "With 50 edges each holding their own counter and syncing every 1s, a client can theoretically use **50 × (1s × edge_capacity)** before the system notices. For 1000 req/min = ~17/sec, that's ~850 extra requests in the worst case — about an 85% overshoot for that 1-second window. **That's the deal**: edge-local gets you sub-millisecond p99 (no network call) and zero Redis load, at the cost of bounded inaccuracy during the sync window. For a public API gateway with non-billing limits, this is the right trade. For billing-critical limits, use centralized Redis with `INCR` + `EXPIRE` (Lua-scripted to make it atomic)."
                  },
                  {
                    "type": "fill-blank",
                    "prompt": "Fill in the atomic Redis token bucket using a Lua script (you NEVER do a GET-then-SET round-trip — that's a race condition).",
                    "code": "-- KEYS[1] = bucket key (e.g. \"rl:key:abc123\")\n-- ARGV[1] = capacity, ARGV[2] = refill_per_sec, ARGV[3] = now_ms\nlocal bucket = redis.call('HMGET', KEYS[1], 'tokens', 'last_ms')\nlocal tokens = tonumber(bucket[1]) or tonumber(ARGV[1])\nlocal last_ms = tonumber(bucket[2]) or tonumber(ARGV[3])\nlocal elapsed_s = (tonumber(ARGV[3]) - last_ms) / 1000\ntokens = math.min(tonumber(ARGV[1]), tokens + elapsed_s * tonumber(ARGV[2]))\nlocal allowed = 0\nif tokens >= 1 then\n  tokens = tokens - 1\n  allowed = ___1___\nend\nredis.call('HMSET', KEYS[1], 'tokens', tokens, 'last_ms', ARGV[3])\nredis.call('EXPIRE', KEYS[1], ___2___)  -- so idle keys don't leak\nreturn ___3___",
                    "blanks": [
                      { "id": 1, "correct": "1" },
                      { "id": 2, "correct": "120" },
                      { "id": 3, "correct": "allowed" }
                    ],
                    "options": ["1", "120", "allowed", "0", "60", "tokens"],
                    "explain": "Two non-obvious bits: (1) `EXPIRE 120` (2x the natural window) — without a TTL, keys for one-shot clients (someone calls your API once, then never again) accumulate forever and eat your Redis RAM. (2) **Lua script means atomic**: Redis runs the whole script under a single global lock, so the read-modify-write is race-free even at 100K req/sec from 50 edges. Don't roll this in app code — it's the #1 source of \"rate limiter occasionally lets through 2x the limit\" reports."
                  }
                ],
                "reference": "**Choice: hybrid.** (1) **Centralized Redis** holds the source-of-truth token bucket per key, accessed via a single Lua script (atomic INCR + refill + decrement). 1 round-trip per request, ~1ms p99. (2) **Edge-local approximation** for keys that exceed a hot-key threshold (say >100 req/sec sustained): each edge holds 1/50th of the budget, syncs to Redis every 500ms. (3) **Sharding**: Redis cluster shards by `hash_tag(api_key)` — every key gets its own slot, hot keys auto-isolate. Pre-warm a small set of well-known hot keys onto dedicated shards if necessary. **Memory:** 1M active keys × ~64 bytes/key = 64 MB — trivial. **Persistence:** disable AOF for the rate limit cluster; counter loss during failover means resetting the budget, which is *better* than rejecting valid traffic."
              },
              {
                "kind": "scaling",
                "title": "Phase 4: Coordination & accuracy trade",
                "prompt": "Across 50 edges, there's no free lunch: you can have **fast**, **accurate**, or **decoupled** — pick two. Name the trade explicitly and justify your point on the triangle.",
                "blocks": [
                  {
                    "type": "predict",
                    "prompt": "Your team proposes a **gossip protocol** where each of 50 edges periodically broadcasts its local counter to all other edges. Why is this a bad idea for rate limiting (even though it works fine for cluster membership)?",
                    "options": [
                      "Gossip is too slow — it takes hours to propagate",
                      "Gossip uses too much bandwidth — 50 edges × N keys × 1Hz means O(N) cross-talk per second",
                      "Gossip converges *eventually* but rate limiting needs decisions *now* — by the time the gossip reflects the truth, the budget overshoot has already happened. Also bandwidth scales O(edges² × keys).",
                      "Gossip protocols are patented and require a license"
                    ],
                    "answer": 2,
                    "explain": "Gossip is **eventually consistent** by design — that's the whole point. It excels for membership, leader election, and other slow-changing state where \"converge within 10 seconds\" is fine. Rate limiting wants a decision in <5ms, and you want it to reflect global state *at decision time*, not 10 seconds ago. The combination of eventual convergence + O(N²) bandwidth (every edge talks to every edge) makes it a strict loss vs. a centralized counter. Save gossip for the right job."
                  },
                  {
                    "type": "explain-back",
                    "prompt": "You decide on **central Redis + small edge-local fast path for hot keys**. Explain in one paragraph why this is more accurate than pure edge-local AND faster than pure centralized.",
                    "modelAnswer": "Pure edge-local is fast (no network) but inaccurate because each edge holds 1/50th of the budget — a client routed across edges can overshoot by up to 50x in pathological cases. Pure centralized is accurate (single counter) but every request pays the network round trip (~1-2ms). The hybrid wins because (a) **the long tail of API keys are low-volume** (most keys send <1 req/sec), so even if each edge holds the full budget locally, they almost never trip the limit — accuracy is fine in practice. (b) **The small set of hot keys** is where errors compound, so for those (auto-detected by request rate) we route through central Redis and pay the latency tax only where it matters. Net result: 90%+ of requests skip the network call, and the overshoot risk is bounded to hot-key territory which is exactly where centralized counting is cheap (few keys, fits easily in one Redis shard).",
                    "hint": "Two-tier — long tail vs hot keys."
                  }
                ],
                "reference": "**Choice: hybrid — central Redis for the hot path, edge-local for the long tail.** Each edge keeps a small LRU of \"keys I've seen recently\" with a local token bucket. On every request: check if the key is in the local hot-set → if yes, do the local check + async sync to Redis every 500ms; if no, do a centralized Lua-script check on Redis. **Hot-key promotion:** a key crosses 50 req/sec sustained → promote to centralized-only (kick out of edge-local cache) so accuracy dominates. **The triangle:** fast (most requests skip Redis) + accurate-enough (hot keys are exact, long tail might overshoot 1-5% which is invisible to the customer) + decoupled (single Redis cluster outage degrades, doesn't fail — edges fall back to local-only with circuit breaker)."
              },
              {
                "kind": "pitfalls",
                "title": "Phase 5: Failure modes",
                "prompt": "What goes wrong at 3am? Walk through Redis failover, edge partition, clock skew, and the **noisy-neighbor on a shared Redis shard**. Each one has a known fix.",
                "blocks": [
                  {
                    "type": "predict",
                    "prompt": "One API customer (\"BadActor Inc.\") is doing 80% of total traffic and their key happens to hash to Redis shard #3 — which is now at 95% CPU and slowing down rate-limit checks for **everyone whose key is also on shard #3**. What's the right intervention?",
                    "options": [
                      "Add more Redis shards and rehash everything — solves it permanently",
                      "Block BadActor Inc. immediately — they're abusive",
                      "Detect the hot key, move it to a dedicated isolated shard (or to a centralized atomic counter outside the main cluster), and shed cost from neighbors. Solve the architectural issue, not the customer.",
                      "Increase the budget for everyone on shard #3 to compensate"
                    ],
                    "answer": 2,
                    "explain": "This is the **noisy-neighbor problem** at the Redis layer, and it's almost guaranteed to happen in production once you have >10K keys with heavy-tail distribution. The fix is **physical isolation for hot keys**, not blocking the customer (who may be paying you) and not naive rehashing (which doesn't help because the underlying skew is in the customer's behavior, not your hash). Bit.ly and Cloudflare both ship variants of this: a small \"VIP shard\" pool that hot keys get promoted onto, with a separate Redis cluster sized for ultra-high single-key throughput. The general principle: **physical isolation beats fairer sharing** when one tenant dominates."
                  },
                  {
                    "type": "fix-it",
                    "prompt": "The fallback below is supposed to fail OPEN when Redis is unreachable. There's a bug.",
                    "code": "def check_rate_limit(api_key):\n    try:\n        allowed = redis_lua_check(api_key, capacity=100, refill=16.7)\n        return allowed\n    except RedisConnectionError:\n        logger.error(\"Redis down — failing closed\")\n        return False\n",
                    "bug": "return False",
                    "fix": "return True  # fail open: better to let some traffic through than to take down the whole gateway",
                    "lang": "python",
                    "explain": "The function comment says fail OPEN — but `return False` rejects every request when Redis is down, which is fail CLOSED. This kind of silent disagreement between the design doc, the function name, and the actual return value is the #1 source of \"why did we have a 30-minute global outage when Redis blipped\" postmortems. Pair the fix with a metric (`rate_limiter_fail_open_count`) and an alert so you know you're degrading. Better: a per-route policy table — sensitive endpoints fail closed, public reads fail open."
                  }
                ],
                "reference": "**Failure modes & mitigations:** (1) **Redis primary fails** → sentinel/cluster promotes replica in ~10s; during the gap, the limiter circuit-breaks and falls back to edge-local approximation. Alert on `rate_limiter_redis_error_rate > 0.5`. (2) **Edge partition** → that edge's local counters keep working; client traffic rebalances to healthy edges; budget overshoot is bounded to the partition's share. (3) **Clock skew between edges** → use Redis `TIME` command as authoritative; don't trust edge clocks for refill math. (4) **Noisy neighbor** → hot-key detector promotes high-volume keys to a dedicated VIP shard. (5) **Lua script bug deploys** → roll back via SCRIPT FLUSH; never modify scripts in place under load. (6) **Counter precision loss at high rates** → use float64 for token counts, not int."
              },
              {
                "kind": "build",
                "title": "Phase 6: Ship it for real",
                "prompt": "Stop whiteboarding the 50-edge cluster. **Build the one thing that matters**: an atomic token-bucket check against a real Redis, wrapped as middleware. One key, one bucket, returns allow/deny. Get it rejecting a real `curl` loop with a 429.",
                "blocks": [
                  {
                    "type": "predict",
                    "prompt": "You're scaffolding your own repo for the v1 limiter. What's the **smallest build** that actually proves the design?",
                    "options": [
                      "Stand up 50 edge nodes with gossip sync before testing anything",
                      "One process: a tiny middleware that runs the atomic token-bucket Lua against a local Redis, returns 429 + Retry-After on deny. Prove it rejects a fast curl loop, then scale out",
                      "A full Kubernetes cluster with a Redis operator and Helm charts first",
                      "The dashboard that shows remaining budget — the enforcement can wait"
                    ],
                    "answer": 1,
                    "explain": "The **enforcement primitive** is the product: an atomic check that returns allow/deny for one key against one Redis. Wrap it as middleware, point a hammering `curl` loop at it, and watch the 429s start exactly at the budget. Everything else — 50 edges, edge-local fast path, hot-key promotion, circuit breaker — is a *scaling layer* you add after the single-node version provably rejects traffic. Standing up the whole cluster before the bucket logic works is effort spent where the risk isn't."
                  },
                  {
                    "type": "fill-blank",
                    "prompt": "Fill in the staged plan to get your own limiter running. Each line is one short sitting.",
                    "code": "# 1. Scaffold your own repo: a minimal ___1___ app + a local Redis (docker run redis)\n# 2. Implement the core: the atomic token-bucket ___2___ script from Phase 3, called once per request\n# 3. Wrap it as middleware: on deny, return 429 with a ___3___ header so clients know when to retry\n# 4. Run it locally: fire a fast curl loop, confirm allows stop and 429s begin exactly at the budget\n# 5. Scale later: add the edge-local fast path + circuit breaker once single-node enforcement is solid",
                    "blanks": [
                      { "id": 1, "correct": "gateway" },
                      { "id": 2, "correct": "Lua" },
                      { "id": 3, "correct": "Retry-After" }
                    ],
                    "options": ["gateway", "Lua", "Retry-After", "gossip", "Kubernetes", "X-Powered-By"],
                    "explain": "**A minimal gateway/API app** plus a Docker Redis is the whole rig — no cluster needed to prove correctness. The **Lua** script keeps the read-modify-write atomic (the race you fixed in Phase 3) even under your hammer loop. The **Retry-After** header is what makes a 429 useful instead of hostile — well-behaved clients back off instead of retrying instantly. Only once the single node rejects cleanly do you add the edge-local tier and the fail-open circuit breaker."
                  },
                  {
                    "type": "fix-it",
                    "prompt": "Your middleware works, but under a real concurrent load test it occasionally lets through ~2x the budget. The check is doing this in app code. Fix it.",
                    "code": "def check(api_key):\n    tokens = float(redis.hget(key(api_key), \"tokens\") or CAPACITY)\n    if tokens >= 1:\n        redis.hset(key(api_key), \"tokens\", tokens - 1)\n        return True\n    return False\n",
                    "bug": "tokens = float(redis.hget(key(api_key), \"tokens\") or CAPACITY)",
                    "fix": "allowed = redis.eval(TOKEN_BUCKET_LUA, 1, key(api_key), CAPACITY, REFILL, now_ms())  # atomic read-modify-write",
                    "lang": "python",
                    "explain": "You predicted this exact failure in Phase 3 — now a concurrent load test reproduces it. The GET-then-SET is two round trips with a gap; two requests both read `tokens=1`, both decrement, both get allowed. Under 100 concurrent clients that's the '2x the limit' bug. Running the whole bucket as a **single Lua `eval`** makes it atomic — Redis runs the script under one lock, so the read-modify-write is race-free. Building it for real is what surfaces the race a whiteboard hides."
                  }
                ],
                "reference": "**Ship-it checklist (v1, one weekend):** (1) Scaffold your own repo — a minimal gateway/API app in a framework you know, plus a local Redis (`docker run -p 6379:6379 redis`). (2) Implement the core: the **atomic token-bucket Lua script** from Phase 3 (`capacity=100`, `refill≈16.7/sec`), called once per request via `EVAL`. (3) Wrap it as middleware: on allow, pass through; on deny, return **429** + `Retry-After` + `X-RateLimit-Remaining`. (4) Run locally: fire a fast `curl` loop (or a 100-worker load test) at one key and confirm allows stop and 429s begin right at the budget — then add concurrency and confirm there's **no 2x overshoot** (proves the Lua atomicity). (5) **Scale later, in order:** add the edge-local fast path for the long tail, then the fail-open circuit breaker (`return True` when Redis errors > 50%), then hot-key promotion. **Do NOT** build the 50-edge cluster, gossip, or dynamic budgets for v1 — those were stated non-goals. One running, correct single node beats a half-built cluster every time."
              }
            ],
            "reflection": "When is approximate rate limiting safer than exactly-correct rate limiting?"
          }
        ]
      }
    ]
  },
};
