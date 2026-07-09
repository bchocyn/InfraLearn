export default {
  "python-basics": {
    "objectives": [
      "Predict when two Python names share one object — and when mutating through one changes the other",
      "Spot the mutable-default-argument trap and fix it with a `None` sentinel",
      "Use comprehensions, unpacking, truthiness, and `with` blocks the way fluent Python reads"
    ],
    "sections": [
      {
        "heading": "Python in one breath",
        "body": [
          {
            "type": "p",
            "text": "**Python is whitespace-significant, dynamically-typed, and reference-semantic.** Those three traits explain 90% of the bugs you'll hit in your first month. Indentation isn't cosmetic — it *is* the block. Types travel with values, not variables. And every assignment binds a **name** to an **object**, never copies it."
          },
          {
            "type": "p",
            "text": "This page is a tour of the **subtle stuff** — the parts that compile fine and then bite you at runtime. If you've written JavaScript or Go, watch for the spots where your instincts mislead you."
          }
        ]
      },
      {
        "heading": "Variables and types",
        "body": [
          {
            "type": "p",
            "text": "A variable is a **label** pointing at an object. Reassigning a label doesn't touch the object — it just re-points the label. This matters the instant two names share one list."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "x = 42  # int — immutable, label points at the object 42\nx = \"hello\"  # legal — label now points at a str\n\na = [1, 2, 3]  # list — mutable\nb = a  # NOT a copy — second label on same list\nb.append(4)  # a is now [1,2,3,4] too — same object\n\nc = a.copy()  # shallow copy — new list, same inner objects\n\ns = \"abc\"  # str — immutable, cannot patch in place\n# s[0] = \"z\"  # TypeError — str item assignment not allowed\ns = \"z\" + s[1:]  # rebind to a new str — only way to \"edit\""
          },
          {
            "type": "p",
            "text": "**Mutable vs immutable** is the single most useful distinction in the language. Memorize the split before you write another line."
          },
          {
            "type": "table",
            "headers": [
              "Type",
              "Mutable?",
              "Why it matters"
            ],
            "rows": [
              [
                "`int`, `float`, `bool`",
                "✗",
                "Math-safe, hashable, cheap to pass around"
              ],
              [
                "`str`, `tuple`, `frozenset`",
                "✗",
                "Usable as dict keys, safe as defaults"
              ],
              [
                "`list`, `dict`, `set`",
                "✓",
                "Aliasing bugs — copies share contents"
              ],
              [
                "custom `class`",
                "✓ by default",
                "Use `@dataclass(frozen=True)` to lock"
              ]
            ]
          }
        ],
        "takeaway": "Assignment binds a label to an object — whether that object is mutable decides if two labels can bite each other."
      },
      {
        "heading": "Control flow and the whitespace rule",
        "body": [
          {
            "type": "p",
            "text": "Python uses **indentation** to mark blocks. Four spaces is the convention — never mix tabs and spaces in one file. The interpreter will let you, then crash with `IndentationError` on a line that *looks* identical to the one above."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "for i, name in enumerate(users):   # (index, value) — no manual counter\n    if not name:  # empty str is falsy — also [], {}, 0, None\n        continue  # skip iteration, same indent level\n    print(f\"{i}: {name}\")  # f-string — evaluated at runtime\nelse:  # for/else: runs if no break fired\n    print(\"all processed\")  # surprises everyone the first time\n\nx = \"big\" if n > 10 else \"small\"   # ternary — value, condition, else"
          },
          {
            "type": "p",
            "text": "The `for/else` clause is real and rare. The `else` runs when the loop **exhausts naturally** — if you `break`, it's skipped. Most idiomatic use: searching with early exit."
          }
        ]
      },
      {
        "heading": "Functions and the default-arg trap",
        "body": [
          {
            "type": "p",
            "text": "Function defaults are evaluated **once**, at definition time — not on every call. Use a mutable default and every call shares the same object. This is the single most reported Python gotcha for a reason."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "def bad(item, bucket=[]):  # bucket created ONCE — shared across calls\n    bucket.append(item)  # mutates the shared list\n    return bucket\n\nbad(1)  # [1]\nbad(2)  # [1, 2] — not [2]; same list survived\n\ndef good(item, bucket=None):  # sentinel — None is immutable, safe\n    if bucket is None:  # `is` checks identity, not equality\n        bucket = []  # fresh list per call\n    bucket.append(item)\n    return bucket\n\ndef typed(name: str, n: int = 1) -> list[str]:   # hints — runtime ignores them\n    return [name] * n  # list repetition — n copies of name"
          },
          {
            "type": "p",
            "text": "Type hints are **documentation the interpreter ignores**. Tools like `mypy` and `pyright` check them statically. At runtime, `typed(\"x\", \"oops\")` runs fine until the `*` blows up."
          }
        ],
        "takeaway": "Defaults are evaluated ONCE at def time — a mutable default is silently shared across every call."
      },
      {
        "heading": "Idioms that mark you as fluent",
        "body": [
          {
            "type": "p",
            "text": "These five patterns separate the tutorial-skimmer from someone who reads Python natively. Reach for them on instinct."
          },
          {
            "type": "terms",
            "items": [
              {
                "term": "Comprehensions",
                "def": "`[x*x for x in nums if x > 0]` — one expression, builds a list. Faster and clearer than an empty list plus `.append` in a loop."
              },
              {
                "term": "Unpacking",
                "def": "`a, b = b, a` swaps without a temp. `first, *rest = items` peels the head. `**kwargs` forwards keyword args downstream."
              },
              {
                "term": "Truthiness",
                "def": "`if items:` checks non-empty — don't write `if len(items) > 0`. Empty containers, `0`, `\"\"`, and `None` are all falsy."
              },
              {
                "term": "Context managers",
                "def": "`with open(path) as f:` guarantees `f.close()` even on exception. Use `with` for files, locks, db transactions — anything with cleanup."
              },
              {
                "term": "Generators",
                "def": "`(x*x for x in big)` with parens, not brackets — lazy, no memory cost. Use `yield` in a function to stream values one at a time."
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
              "`is None` for sentinel checks — identity, not equality",
              "f-strings for formatting — readable and fast",
              "`dict.get(key, default)` over `if key in dict`",
              "`pathlib.Path` over string concatenation for filesystems",
              "`enumerate` and `zip` over manual index tracking"
            ],
            "watch": [
              "Mutable defaults — `def f(x=[])` shares the list",
              "`==` on floats — use `math.isclose(a, b)` instead",
              "Bare `except:` — catches `KeyboardInterrupt` and hides bugs",
              "Modifying a list while iterating it — silent skips",
              "`from module import *` — pollutes namespace, breaks tooling"
            ]
          },
          {
            "type": "quote",
            "text": "Readability counts. There should be one — and preferably only one — obvious way to do it.",
            "cite": "The Zen of Python (`import this`)"
          }
        ]
      }
    ]
  },
  "python-idioms": {
    "objectives": [
      "Choose eager comprehension vs lazy generator by memory cost — and stream a huge file in constant memory",
      "Replace group-by and counting boilerplate with `defaultdict` and `Counter`",
      "Use `with`, unpacking, and the walrus operator to cut cleanup and duplicate-call boilerplate"
    ],
    "sections": [
      {
        "heading": "Why idioms matter",
        "body": [
          {
            "type": "p",
            "text": "Python rewards **terse, declarative** code — but only if you know which constructs are **lazy** (compute on demand) versus **eager** (compute now, store everything). Mix them up and you'll either OOM on a 10GB log file or recompute the same list 40 times in a loop."
          },
          {
            "type": "p",
            "text": "This page is a tour of the idioms that **separate juniors from seniors**: comprehensions, generators, context managers, unpacking, `defaultdict`/`Counter`, and the walrus. Every code line is annotated with its **cost profile** — read the comments."
          }
        ]
      },
      {
        "heading": "Comprehensions: eager by default",
        "body": [
          {
            "type": "p",
            "text": "List/dict/set comprehensions are **eager** — they build the entire collection in memory before returning. Fine for small data, lethal for streams."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "squares = [x*x for x in range(1000)]  # list, eager — 1000 ints allocated now\nlookup  = {u.id: u for u in users}  # dict, eager — full hash table built\nseen    = {tag for tag in tags}  # set, eager — dedup happens immediately\n\n# Nested filter+map in one pass:\nactive = [u.name for u in users if u.active]   # one O(n) walk, no intermediate list\n\n# Anti-pattern — two passes, double allocation:\nactive = list(map(lambda u: u.name, filter(lambda u: u.active, users)))  # avoid"
          },
          {
            "type": "p",
            "text": "Rule of thumb: comprehensions beat `map`/`filter` for **readability** and equal them for **speed**. Reach for them whenever the result fits comfortably in RAM."
          }
        ],
        "takeaway": "A comprehension allocates the entire result in memory before you get it — fine for small data, lethal for streams."
      },
      {
        "heading": "Generators: lazy or you die",
        "body": [
          {
            "type": "p",
            "text": "Swap `[ ]` for `( )` and you get a **generator** — a one-shot iterator that yields values on demand. Nothing computes until you iterate. This is the difference between **streaming** a 50GB file and **crashing**."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "# EAGER — allocates 10⁹ ints, ~30GB, OOMs:\ntotal = sum([x*x for x in range(10**9)])  # list built first → memory blowup\n\n# LAZY — constant memory, same answer:\ntotal = sum(x*x for x in range(10**9))  # genexp — one int at a time\n\n# Generator function — pauses at every yield:\ndef read_lines(path):\n    with open(path) as f:  # context mgr closes file on exhaustion\n        for line in f:  # file object is itself lazy\n            yield line.rstrip()  # caller pulls; we pause here\n\nerrors = (ln for ln in read_lines('app.log') if 'ERROR' in ln)  # still lazy\nfirst_ten = list(itertools.islice(errors, 10))  # materialize only 10"
          },
          {
            "type": "table",
            "headers": [
              "Construct",
              "Lazy?",
              "Memory",
              "Use when"
            ],
            "rows": [
              [
                "`[x for x in it]`",
                "✗ eager",
                "O(n)",
                "need indexing, reuse, len()"
              ],
              [
                "`(x for x in it)`",
                "✓ lazy",
                "O(1)",
                "one-pass stream, large/infinite"
              ],
              [
                "`{x for x in it}`",
                "✗ eager",
                "O(n)",
                "dedup small set"
              ],
              [
                "`yield` function",
                "✓ lazy",
                "O(1)",
                "custom stream, pause/resume"
              ]
            ],
            "align": [
              "left",
              "center",
              "center",
              "left"
            ]
          }
        ],
        "takeaway": "Swap `[]` for `()` and nothing computes until you iterate — that's how you stream gigabytes in O(1) memory."
      },
      {
        "heading": "Context managers, unpacking, walrus",
        "body": [
          {
            "type": "p",
            "text": "The `with` statement guarantees cleanup runs **even on exception** — no leaked file handles, sockets, or locks. Unpacking and the walrus operator (`:=`) cut boilerplate that hides bugs."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "# Context manager — __exit__ fires on return AND on exception:\nwith open('data.csv') as f, lock:  # two managers, both released in order\n    data = f.read()  # file auto-closed after this block\n\n# Unpacking — destructure in one line:\nname, *rest, last = ['a','b','c','d']    # rest = ['b','c'], no index math\n(x, y), z = (1, 2), 3  # nested unpack, no temp vars\nfor i, item in enumerate(items, start=1):  # index + value, no `i = 0` dance\n    ...\n\n# Walrus — assign-and-test in one expression:\nwhile (chunk := f.read(8192)):  # reads + binds + tests, no duplicate call\n    process(chunk)  # exits cleanly when read returns b''\n\nif (n := len(queue)) > 100:  # bind once, use in both branches\n    log(f'queue depth {n} — backpressure')   # n reused, no second len() call"
          }
        ]
      },
      {
        "heading": "defaultdict and Counter",
        "body": [
          {
            "type": "p",
            "text": "The `collections` module replaces the **three most common dict patterns** with one-liners. Faster, atomic, and harder to get wrong."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "from collections import defaultdict, Counter\n\n# Group-by without the `if key not in d` dance:\nby_user = defaultdict(list)  # missing key → new list automatically\nfor event in events:  # one pass, O(n)\n    by_user[event.user_id].append(event) # no KeyError, no setdefault boilerplate\n\n# Counting — Counter is a dict subclass tuned for this:\ntags = Counter(tag for post in posts for tag in post.tags)  # lazy genexp inside\ntop5 = tags.most_common(5)  # heap-based, O(n log 5) not O(n log n)\n\n# Arithmetic on Counters — set-like operations:\ndiff = Counter(today) - Counter(yesterday)   # only positive counts kept"
          },
          {
            "type": "terms",
            "items": [
              {
                "term": "defaultdict",
                "def": "Dict with a factory for missing keys — eliminates `if k in d` guards."
              },
              {
                "term": "Counter",
                "def": "Dict subclass for tallying; supports `most_common`, addition, subtraction."
              },
              {
                "term": "deque",
                "def": "O(1) append/pop at **both** ends — use instead of `list` for queues."
              },
              {
                "term": "namedtuple / dataclass",
                "def": "Lightweight immutable records; readable than tuple indexing."
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
            "good": [
              "Generators stream gigabytes in constant memory",
              "Comprehensions read top-to-bottom like English",
              "`with` blocks make resource leaks structurally impossible",
              "Walrus removes duplicated function calls in loops"
            ],
            "watch": [
              "Generators are **one-shot** — iterating twice yields nothing the second time",
              "`sum([...])` builds a list first; `sum(...)` doesn't — drop the brackets",
              "Don't store generators in a dict and expect to `len()` them",
              "Walrus inside a comprehension is legal but often unreadable — use sparingly",
              "`defaultdict[k]` **creates** the key on read — surprising in `if k in d` checks"
            ]
          },
          {
            "type": "quote",
            "text": "If it fits in RAM, use a comprehension. If it doesn't, use a generator. If you're not sure, use a generator.",
            "cite": "the only Python memory rule you need"
          }
        ]
      }
    ]
  },
  "processes-threads": {
    "objectives": [
      "Decide threads vs processes for a workload by what it's bound on — I/O or CPU",
      "Explain why the GIL blocks CPU parallelism in Python threads but still allows I/O concurrency",
      "Name what threads share (heap, globals) vs what they own (stack) — and why `counter += 1` races"
    ],
    "sections": [
      {
        "heading": "The two shapes of concurrency",
        "body": [
          {
            "type": "p",
            "text": "A **process** is an OS-isolated program with its own memory space, its own file descriptors, its own everything. A **thread** is a strand of execution *inside* a process — same memory, same heap, same open files. Pick wrong and you'll either pay the wrong tax or fight the wrong bug."
          },
          {
            "type": "p",
            "text": "The mental model: a process is a house, threads are roommates. Roommates share the fridge (cheap, but they fight over the last yogurt). Different houses don't share anything (safe, but every loaf of bread has to be photocopied)."
          }
        ]
      },
      {
        "heading": "What lives where",
        "body": [
          {
            "type": "p",
            "text": "The memory layout is the whole story. Threads share the **heap and globals**; each gets its own **stack and registers**. Processes share *nothing* unless you go out of your way (pipes, shared memory, sockets)."
          },
          {
            "type": "diagram",
            "title": "One process, three threads",
            "height": 240,
            "nodes": [
              {
                "id": "proc",
                "label": "Process",
                "subtitle": "PID 4711 · own page table",
                "accent": "amber",
                "x": 0.5,
                "y": 0.12
              },
              {
                "id": "heap",
                "label": "Heap + Globals",
                "subtitle": "shared across threads",
                "accent": "fire",
                "x": 0.5,
                "y": 0.42
              },
              {
                "id": "t1",
                "label": "Thread 1",
                "subtitle": "own stack",
                "accent": "sky",
                "x": 0.18,
                "y": 0.78
              },
              {
                "id": "t2",
                "label": "Thread 2",
                "subtitle": "own stack",
                "accent": "sky",
                "x": 0.5,
                "y": 0.78
              },
              {
                "id": "t3",
                "label": "Thread 3",
                "subtitle": "own stack",
                "accent": "sky",
                "x": 0.82,
                "y": 0.78
              }
            ],
            "edges": [
              {
                "from": "proc",
                "to": "heap",
                "kind": "solid",
                "label": "contains"
              },
              {
                "from": "t1",
                "to": "heap",
                "kind": "dashed",
                "accent": "fire",
                "label": "reads/writes"
              },
              {
                "from": "t2",
                "to": "heap",
                "kind": "dashed",
                "accent": "fire"
              },
              {
                "from": "t3",
                "to": "heap",
                "kind": "dashed",
                "accent": "fire"
              },
              {
                "from": "proc",
                "to": "t1",
                "kind": "solid",
                "curve": 0.25
              },
              {
                "from": "proc",
                "to": "t2",
                "kind": "solid"
              },
              {
                "from": "proc",
                "to": "t3",
                "kind": "solid",
                "curve": -0.25
              }
            ]
          },
          {
            "type": "p",
            "text": "Crash one thread by dereferencing a bad pointer and the **whole process dies** — the heap is one fate. Crash one process and the others keep running, untouched."
          }
        ],
        "takeaway": "Threads share the heap and globals inside one process; each owns only its stack — that sharing is both the speed and the danger."
      },
      {
        "heading": "The tradeoff, accounted for",
        "body": [
          {
            "type": "compare",
            "title": "Threads vs Processes",
            "axes": [
              "Spawn cost",
              "Memory per unit",
              "Context switch",
              "Crash isolation",
              "Sharing data",
              "Python GIL impact"
            ],
            "left": {
              "label": "Threads",
              "accent": "sky",
              "values": [
                "~10 μs",
                "~8 MB stack",
                "Fast (same page table)",
                "✗ one bug kills all",
                "✓ direct pointer",
                "✗ no CPU parallelism"
              ]
            },
            "right": {
              "label": "Processes",
              "accent": "fire",
              "values": [
                "~1-10 ms",
                "Full address-space copy",
                "Slow (TLB flush)",
                "✓ kernel-enforced walls",
                "✗ IPC required",
                "✓ true parallel CPUs"
              ]
            }
          },
          {
            "type": "p",
            "text": "Read the table as a chooser, not a scoreboard. The right answer depends on **what kind of work** dominates your hot path."
          }
        ]
      },
      {
        "heading": "The GIL, and why it changes the answer in Python",
        "body": [
          {
            "type": "p",
            "text": "CPython has a **Global Interpreter Lock** — only one thread executes Python bytecode at a time. Threads still help for **I/O-bound** work (one waits on the network, another runs), but they give you **zero CPU parallelism**. For CPU-bound Python, you need processes."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor\nimport hashlib, requests\n\ndef fetch(url):  # I/O-bound — GIL released on socket read\n    return requests.get(url, timeout=5).status_code\n\ndef crunch(seed):  # CPU-bound — holds GIL the whole time\n    h = seed.encode()\n    for _ in range(2_000_000):  # pure-Python loop = single core ceiling\n        h = hashlib.sha256(h).digest()\n    return h.hex()[:8]\n\nwith ThreadPoolExecutor(max_workers=32) as pool:    # threads win here: 32x I/O concurrency\n    list(pool.map(fetch, urls))  # GIL is dropped during the kernel wait\n\nwith ProcessPoolExecutor(max_workers=8) as pool:    # processes for CPU: one GIL per worker\n    list(pool.map(crunch, seeds))  # 8 cores actually used; pickling cost paid"
          },
          {
            "type": "terms",
            "items": [
              {
                "term": "GIL",
                "def": "A mutex inside CPython that gates bytecode execution. It exists so reference counts stay consistent without per-object locks."
              },
              {
                "term": "I/O-bound",
                "def": "Spends most time waiting on the kernel (network, disk). Threads help because the GIL is released around blocking syscalls."
              },
              {
                "term": "CPU-bound",
                "def": "Spends most time running Python instructions. Threads do not help — use processes, or call into C extensions (NumPy, Polars) that drop the GIL."
              },
              {
                "term": "free-threaded build",
                "def": "PEP 703 / Python 3.13+ optional build with no GIL. Real, but slower single-threaded and not all C extensions are ready. Worth watching, not betting on yet."
              }
            ]
          }
        ],
        "takeaway": "Under the GIL, threads only help while you wait on I/O — CPU-bound Python needs processes."
      },
      {
        "heading": "Pros and cons, side by side",
        "body": [
          {
            "type": "pros-cons",
            "goodLabel": "THREADS",
            "watchLabel": "PROCESSES",
            "good": [
              "Cheap to spawn — fine for thousands",
              "Share memory directly, no serialization",
              "Tiny per-unit footprint",
              "Best fit for I/O concurrency under a GIL"
            ],
            "watch": [
              "True parallelism, even in Python",
              "Crash isolation — one segfault doesn't sink the ship",
              "Independent address spaces = no race conditions across them",
              "IPC costs (pickle, shm, pipes) on every shared byte"
            ]
          },
          {
            "type": "p",
            "text": "Most real systems use **both**: a small pool of processes (one per core) and a pool of threads inside each. That's what **gunicorn `--workers N --threads M`** is doing, and why Postgres forks a backend per connection."
          }
        ]
      },
      {
        "heading": "Watch out for",
        "body": [
          {
            "type": "ul",
            "items": [
              "**`counter += 1` is not atomic.** It's *load, add, store*. Two threads will race and you'll silently lose updates. Use `threading.Lock`, `queue.Queue`, or `atomic` types.",
              "**Fork + threads = undefined behavior.** Forking a multi-threaded process can deadlock — locks held by other threads survive into the child. Spawn processes *before* you spawn threads.",
              "**Daemon threads die mid-write.** Marking a thread `daemon=True` lets the program exit while it's still running. Great for background pollers, terrible for anything writing to disk.",
              "**Process pools serialize arguments.** Every `map` arg is pickled and copied — passing a 2 GB DataFrame to 8 workers costs 16 GB of RAM. Use shared memory or memory-mapped files for big payloads."
            ]
          },
          {
            "type": "quote",
            "text": "Threads are for people who can't think in event loops; processes are for people who can't think at all. Both groups ship.",
            "cite": "engineering folklore"
          },
          {
            "type": "explain-back",
            "prompt": "You've now got three pieces that interact: **threads share one address space while processes don't**, `counter += 1` is **load-add-store and therefore racy**, and the **GIL** serializes Python bytecode. You're asked to speed up a Python service that does both heavy number-crunching on in-memory arrays *and* lots of waiting on slow HTTP calls. Design how you'd split the work across threads vs processes, justify it using the GIL, and name the trade-off your choice forces you to pay.",
            "modelAnswer": "Split by **what each part is bound on**. The HTTP calls are **I/O-bound**: a thread holding the GIL releases it while blocked on the socket, so a thread pool gives real concurrency there with almost no overhead, and the threads can share the in-memory results cheaply because they live in **one address space**. The number-crunching is **CPU-bound**, and here the **GIL** is the wall — only one thread runs Python bytecode at a time, so adding threads buys nothing; I push that work to a **process pool** (or `ProcessPoolExecutor`), one worker per core, each with its own GIL, so they run truly in parallel. The two **trade-offs** I'm accepting: (1) processes don't share memory, so every array I hand a worker is **pickled and copied** — passing big payloads can blow up RAM (8 workers × a 2 GB array = 16 GB), which I'd mitigate with shared memory or memory-mapped files; and (2) in the threaded I/O half, any shared mutable counter or accumulator is exposed to the **load-add-store race**, so I either guard it with a `Lock`/`Queue` or keep per-thread state and merge at the end. The judgment call is matching the concurrency primitive to the bottleneck — threads for waiting, processes for computing — and paying either the copy cost or the locking cost accordingly.",
            "hint": "One of the two workloads releases the GIL while it waits; the other is throttled by it. Match each to threads or processes — then ask what you give up: shared memory, or copies and locks?",
            "commit": {
              "q": "You add more threads to speed up the CPU-bound array math. What actually happens?",
              "opts": [
                "Throughput scales with core count — the threads run bytecode in parallel",
                "Nothing improves — the GIL lets only one thread run Python bytecode at a time",
                "It gets faster, but only if each thread is pinned to its own CPU core"
              ],
              "answer": 1,
              "why": "CPU-bound Python threads all queue behind one GIL, so extra threads add contention, not parallelism. Where each workload spends its time (waiting vs computing) decides the split."
            }
          }
        ]
      }
    ]
  },
  "virtual-memory": {
    "objectives": [
      "Trace a memory access through TLB hit, page walk, and page fault — and rank their costs",
      "Read `RSS` vs `VSZ` correctly and explain why 'available' memory includes page cache",
      "Predict when the OOM killer fires and what overcommit means for a huge `malloc`"
    ],
    "sections": [
      {
        "heading": "Why virtual memory exists",
        "body": [
          {
            "type": "p",
            "text": "Every process on Linux thinks it owns the entire address space — **all 256 TiB** of it on x86_64. It doesn't. The kernel and CPU collude to lie convincingly, mapping the **virtual addresses** your code uses onto whatever **physical RAM** is actually available, paging the rest to disk."
          },
          {
            "type": "p",
            "text": "This lie is load-bearing. It gives you **isolation** (your pointers can't touch another process), **overcommit** (allocate 100 GB on a 16 GB box and only pay for what you touch), and **mmap** (treat a file like an array). The cost is a translation step on every memory access — which is why the **TLB** exists."
          }
        ]
      },
      {
        "heading": "The translation path",
        "body": [
          {
            "type": "walkthrough",
            "title": "Virtual address → physical RAM",
            "why": "Every load and store you write runs this gauntlet — a **TLB hit** is invisible, a **miss** costs a page walk, and a **page fault** drops into the kernel.",
            "nodes": [
              {
                "id": "proc",
                "label": "Process",
                "subtitle": "loads/stores",
                "x": 0.08,
                "y": 0.5,
                "accent": "water"
              },
              {
                "id": "vaddr",
                "label": "Virtual addr",
                "subtitle": "0x7fff...",
                "x": 0.3,
                "y": 0.5,
                "accent": "sky"
              },
              {
                "id": "tlb",
                "label": "TLB",
                "subtitle": "cached translations",
                "x": 0.52,
                "y": 0.25,
                "accent": "earth"
              },
              {
                "id": "mmu",
                "label": "MMU + page table",
                "subtitle": "4-level walk",
                "x": 0.52,
                "y": 0.75,
                "accent": "amber"
              },
              {
                "id": "ram",
                "label": "Physical RAM",
                "subtitle": "4 KiB frame",
                "x": 0.85,
                "y": 0.5,
                "accent": "fire"
              }
            ],
            "steps": [
              {
                "title": "The process issues an access",
                "description": "Your code runs something like `mov rax, [ptr]` — a plain load or store. The address it uses is **virtual**, private to this process, not a real RAM location.",
                "activeNodes": [
                  "proc",
                  "vaddr"
                ],
                "activeEdges": [
                  {
                    "from": "proc",
                    "to": "vaddr",
                    "label": "mov rax, [ptr]"
                  }
                ]
              },
              {
                "title": "Check the TLB first",
                "description": "The CPU asks the **TLB**, a tiny cache of recent translations. A hit returns the physical frame in ~1 cycle — fast enough to be effectively invisible.",
                "activeNodes": [
                  "vaddr",
                  "tlb"
                ],
                "activeEdges": [
                  {
                    "from": "vaddr",
                    "to": "tlb",
                    "label": "hit?"
                  }
                ]
              },
              {
                "title": "TLB miss → page walk",
                "description": "On a miss, the **MMU** walks 4 levels of page tables in RAM to find the mapping — 100+ cycles. If an entry is missing or swapped out, it traps to the kernel as a **page fault**.",
                "activeNodes": [
                  "vaddr",
                  "mmu"
                ],
                "activeEdges": [
                  {
                    "from": "vaddr",
                    "to": "mmu",
                    "label": "miss"
                  }
                ]
              },
              {
                "title": "Reach physical RAM",
                "description": "Either path lands on the same **4 KiB frame** of physical RAM. The MMU hands back the frame number; the TLB caches it so the next access skips the walk.",
                "activeNodes": [
                  "tlb",
                  "mmu",
                  "ram"
                ],
                "activeEdges": [
                  {
                    "from": "tlb",
                    "to": "ram"
                  },
                  {
                    "from": "mmu",
                    "to": "ram",
                    "label": "frame #"
                  }
                ]
              }
            ]
          },
          {
            "type": "p",
            "text": "Every load and store goes through this. A **TLB hit** is ~1 cycle and invisible. A **TLB miss** triggers a **page walk** — the MMU reads 4 levels of page-table entries from RAM, costing 100+ cycles. A **page fault** (entry missing or swapped out) traps into the kernel and can cost milliseconds if disk is involved."
          }
        ],
        "takeaway": "Every load and store is translated: a TLB hit is invisible, a miss costs a page walk, a page fault drops into the kernel."
      },
      {
        "heading": "Vocabulary that actually matters",
        "body": [
          {
            "type": "terms",
            "items": [
              {
                "term": "Page",
                "def": "Fixed unit of mapping, almost always **4 KiB** on x86_64 (or 2 MiB / 1 GiB hugepages)."
              },
              {
                "term": "Page table",
                "def": "Per-process tree the MMU walks to translate virtual → physical; root pointer lives in CR3."
              },
              {
                "term": "TLB",
                "def": "Tiny CPU cache of recent translations — usually ~64 entries per level; flushed on context switch."
              },
              {
                "term": "Page fault",
                "def": "CPU trap when a virtual page has no valid mapping; kernel decides to allocate, swap in, or kill."
              },
              {
                "term": "Swap",
                "def": "Disk-backed overflow for anonymous (heap/stack) pages; slow enough that a swapping box looks dead."
              },
              {
                "term": "mmap",
                "def": "Syscall that maps a file or anonymous region into your address space, faulted in lazily on first touch."
              }
            ]
          }
        ]
      },
      {
        "heading": "mmap in practice",
        "body": [
          {
            "type": "p",
            "text": "`mmap` is the secret weapon behind databases, model loading, and zero-copy IO. You get a pointer; the kernel pages in **only what you read**."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "import mmap, os\n\nfd = os.open(\"weights.bin\", os.O_RDONLY)  # raw fd, no buffered reads\nsize = os.fstat(fd).st_size  # 40 GiB model, say\n\nmm = mmap.mmap(fd, size, prot=mmap.PROT_READ)  # virtual region — no RAM used yet\nheader = mm[:128]  # touches 1 page → 1 page fault\ntensor = mm[0x1_000_000:0x1_000_000 + 4096]  # second fault, kernel reads 4 KiB\n# RSS stays small; pages evict under pressure"
          },
          {
            "type": "p",
            "text": "Contrast with `read()` into a buffer: that **copies** every byte through the page cache into your heap, doubling RAM. With `mmap`, the page cache *is* your memory."
          }
        ],
        "deep": true
      },
      {
        "heading": "When RAM runs out: the OOM killer",
        "body": [
          {
            "type": "p",
            "text": "Linux **overcommits** by default — `malloc(1TB)` succeeds on a laptop. The bill comes due on first write. When physical RAM + swap can't satisfy a fault, the kernel picks a process and kills it. This is the **OOM killer**, scored by `oom_score`."
          },
          {
            "type": "pros-cons",
            "goodLabel": "Why overcommit + OOM is fine",
            "watchLabel": "Why it ruins your night",
            "good": [
              "Fork-heavy servers (Postgres, Redis snapshot) work without 2× RAM headroom",
              "Sparse allocations (huge mmap'd files) cost nothing until touched",
              "Lazy allocation means startup is fast and predictable"
            ],
            "watch": [
              "The killed process is rarely the bloated one — kernel picks by score, not by guilt",
              "Swap thrashing makes the box unresponsive long before OOM fires; SSH dies first",
              "Containers with cgroup memory limits OOM **silently** inside the cgroup — no dmesg on the host",
              "`malloc` returning non-null is meaningless; you only know on first page fault"
            ]
          }
        ],
        "takeaway": "Linux overcommits — the bill arrives on first touch, and when RAM runs out the kernel kills by score, not by guilt."
      },
      {
        "heading": "Watch out for",
        "body": [
          {
            "type": "ul",
            "items": [
              "**RSS vs VSZ**: `VSZ` is virtual size (the lie), `RSS` is resident set (the truth). A 100 GiB VSZ with 200 MiB RSS is healthy; alert on RSS.",
              "**Page cache is not used memory**: `free -h` shows it under `available`. Don't panic when `used` is 90% — the kernel will evict cache on demand.",
              "**Swap off ≠ safe**: with `swapoff`, the first heavy allocation OOMs instantly instead of degrading. Production hosts often run `vm.swappiness=10` rather than disabling swap.",
              "**THP can backfire**: transparent hugepages reduce TLB pressure but cause latency spikes during compaction — Redis and MongoDB tell you to disable them.",
              "**TLB shootdowns** on multi-socket boxes are an underrated tail-latency source; `munmap` in one thread flushes TLBs on every core."
            ]
          },
          {
            "type": "quote",
            "text": "If your service is slow and the disk light is solid, you're not CPU-bound — you're swapping.",
            "cite": "every on-call engineer, eventually"
          },
          {
            "type": "explain-back",
            "prompt": "You've now seen the whole illusion: the **translation path** (TLB → MMU → page walk → RAM), the gap between **VSZ and RSS**, the **page cache** sitting in 'available' memory, and the **OOM killer** that fires when real RAM runs out. A service shows 100 GiB VSZ but 800 MiB RSS, runs fine for hours, then gets OOM-killed under load — with `free -h` having shown most memory as 'available' the whole time. Explain how these mechanisms fit together to produce that outcome, and name the trade-off you'd weigh before 'fixing' it by turning off swap.",
            "modelAnswer": "The 100 GiB VSZ is virtual address space the process *reserved* — the MMU has mappings for it, but no physical frame is committed until each page is first touched, which is why **RSS** (the truth) stays tiny. As load arrives, the service touches more of those pages; each first touch is a fault that the **page walk** resolves into a freshly allocated physical frame, so RSS climbs toward real RAM. Meanwhile `free -h` looked safe because the kernel had filled 'available' with **page cache** it can evict on demand — that's reclaimable and not the problem. The OOM kill comes when *anonymous* (non-evictable) pages plus genuinely needed cache exceed RAM and there's nowhere to spill: the kernel reclaims cache, then, with no swap to push cold anonymous pages to, picks a victim by `oom_score` and kills it. So the chain is: lazy commit (VSZ ≫ RSS) → first-touch faults grow RSS → reclaim exhausts → OOM. The **trade-off** on disabling swap: `swapoff` removes the soft-failure runway — instead of degrading into slow swapping (the solid disk light), the next allocation OOMs *instantly*. You trade tail-latency spikes for abrupt kills. The usual judgment is to keep a little swap with `vm.swappiness=10` so cold pages can spill without thrashing hot ones, and to alert on **RSS** and reclaim pressure rather than on `used` — because the page cache made `used` a liar all along.",
            "hint": "VSZ is a promise, RSS is the bill, and the page cache makes 'used' look scarier than it is. Ask what swap actually buys you before you remove it.",
            "commit": {
              "q": "The service gets OOM-killed even though `free -h` showed plenty of 'available' memory. What was that 'available' mostly made of?",
              "opts": [
                "Reclaimable page cache — evictable, but it can't absorb growing anonymous pages",
                "Unused swap space the kernel was holding in reserve for emergencies",
                "The huge VSZ the process reserved up front but never actually touched"
              ],
              "answer": 0,
              "why": "'Available' counts page cache the kernel can drop on demand. But anonymous pages that grow under load aren't evictable — they need swap or a victim."
            }
          }
        ]
      }
    ]
  },
  "file-systems": {
    "objectives": [
      "Trace a `write()` from syscall through VFS and page cache to the block device — and say where the bytes are when it returns",
      "Explain why a 'successful' write isn't durable until `fsync`, and design a crash-safe save",
      "Distinguish a file (inode) from its name (dentry) — and explain hardlinks and why same-disk `mv` is free"
    ],
    "sections": [
      {
        "heading": "The stack between your write() and the platter",
        "body": [
          {
            "type": "p",
            "text": "When your code calls `open()` and `write()`, those bytes pass through **four distinct layers** before they land on storage. Each one has its own opinions about caching, naming, and what \"durable\" means. Understand the layering and most filesystem mysteries — slow `fsync`, mismatched `df` and `du`, corruption after a power loss — stop being mysteries."
          },
          {
            "type": "p",
            "text": "The kernel gives every filesystem the same shape via the **VFS** (Virtual File System). That's why `cp` doesn't care whether you're copying onto ext4, NTFS, or a network mount — VFS makes them all look identical to userspace."
          },
          {
            "type": "walkthrough",
            "title": "From syscall to sector",
            "height": 260,
            "why": "A `write()` that \"succeeds\" usually only reached **RAM** — the bytes aren't safe on disk until a flush or `fsync` pushes them to the block device.",
            "nodes": [
              {
                "id": "app",
                "label": "App",
                "subtitle": "write(fd, buf, n)",
                "accent": "water",
                "x": 0.1,
                "y": 0.5
              },
              {
                "id": "vfs",
                "label": "VFS",
                "subtitle": "kernel interface",
                "accent": "sky",
                "x": 0.32,
                "y": 0.5
              },
              {
                "id": "fs",
                "label": "ext4 / xfs / btrfs",
                "subtitle": "inode + journal",
                "accent": "amber",
                "x": 0.56,
                "y": 0.5
              },
              {
                "id": "pc",
                "label": "Page Cache",
                "subtitle": "RAM, dirty pages",
                "accent": "earth",
                "x": 0.78,
                "y": 0.22
              },
              {
                "id": "blk",
                "label": "Block Device",
                "subtitle": "sd / nvme",
                "accent": "fire",
                "x": 0.78,
                "y": 0.78
              }
            ],
            "steps": [
              {
                "title": "App makes the syscall",
                "description": "Your program calls `write(fd, buf, n)`. That's a **syscall** — it crosses from user space into the kernel, handing off the bytes and a file descriptor.",
                "activeNodes": [
                  "app",
                  "vfs"
                ],
                "activeEdges": [
                  {
                    "from": "app",
                    "to": "vfs",
                    "label": "syscall"
                  }
                ]
              },
              {
                "title": "VFS routes to the filesystem",
                "description": "The **VFS** is one generic interface over many filesystems. It dispatches the write to whichever driver owns this file — **ext4**, **xfs**, or **btrfs**.",
                "activeNodes": [
                  "vfs",
                  "fs"
                ],
                "activeEdges": [
                  {
                    "from": "vfs",
                    "to": "fs"
                  }
                ]
              },
              {
                "title": "Buffer into the page cache",
                "description": "The filesystem doesn't hit disk yet — it stamps the bytes into the **page cache** in RAM as **dirty pages**. Your `write()` returns now, which is why it feels instant.",
                "activeNodes": [
                  "fs",
                  "pc"
                ],
                "activeEdges": [
                  {
                    "from": "fs",
                    "to": "pc",
                    "label": "buffer"
                  }
                ]
              },
              {
                "title": "Flush to the block device",
                "description": "Later — on a timer or when you call **`fsync`** — dirty pages drain to the **block device** (SSD/NVMe). Only here are the bytes durable; a crash before this loses them.",
                "activeNodes": [
                  "pc",
                  "blk"
                ],
                "activeEdges": [
                  {
                    "from": "pc",
                    "to": "blk",
                    "label": "flush / fsync"
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "heading": "Inodes — a file is not its name",
        "body": [
          {
            "type": "p",
            "text": "On disk, a file is an **inode**: a fixed-size record holding size, permissions, timestamps, owner, and pointers to data blocks. The *name* lives in a directory entry, which is just a (name → inode-number) mapping. The two are decoupled, and once you see that, hardlinks and `mv` stop being weird."
          },
          {
            "type": "terms",
            "items": [
              {
                "term": "Inode",
                "def": "The actual file object. Contains metadata and block pointers, but no name. Identified by an integer per filesystem."
              },
              {
                "term": "Directory entry (dentry)",
                "def": "A (name, inode-number) pair stored inside a directory. The thing `ls` actually prints."
              },
              {
                "term": "Hard link",
                "def": "A second dentry pointing at the same inode. Both names are equal citizens; the file dies when the link count drops to zero."
              },
              {
                "term": "Symlink",
                "def": "A tiny file whose contents are a path string. Resolved at lookup time, can dangle, can cross filesystems."
              },
              {
                "term": "Link count",
                "def": "How many dentries reference this inode. `unlink()` decrements; reaching zero (with no open fds) frees the blocks."
              }
            ]
          },
          {
            "type": "p",
            "text": "This is also why `mv` inside one filesystem is **free** — it rewrites one dentry. Across filesystems it becomes a copy-then-delete, because inode numbers don't survive the trip."
          }
        ],
        "takeaway": "A file IS its inode; the name is just a directory entry pointing at it."
      },
      {
        "heading": "Durability — the page cache is lying to you",
        "body": [
          {
            "type": "p",
            "text": "Linux caches file data aggressively in unused RAM (the **page cache**). A successful `write()` only means \"the kernel accepted these bytes\" — not \"they survived a power cut.\" To force them to storage you call `fsync()`, and you pay for it in milliseconds."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "import os\n\nfd = os.open('order.log', os.O_WRONLY | os.O_CREAT | os.O_APPEND, 0o644)  # append-only, durable target\nos.write(fd, payload)  # lands in page cache, NOT disk yet\nos.fsync(fd)  # block until data + metadata on platter\n# only NOW is the write crash-safe   # this is what databases pay per commit\nos.close(fd)  # close does not imply fsync — easy to forget\n\n# Faster, less safe alternative:\nos.fdatasync(fd)  # skip metadata flush if size unchanged"
          },
          {
            "type": "p",
            "text": "Every committed transaction in Postgres, MySQL, SQLite calls `fsync` on the WAL. That single syscall is why **transaction throughput is bounded by your disk's fsync latency** — and why moving the WAL to a fast NVMe is the cheapest perf win in the database playbook."
          }
        ],
        "takeaway": "A successful `write()` only means the page cache took the bytes — nothing survives a power cut until `fsync`."
      },
      {
        "heading": "Journaling — surviving a power cut mid-write",
        "body": [
          {
            "type": "p",
            "text": "Updating a file usually touches several structures: the inode, the bitmap, the data block, maybe the directory. If power dies between any two of them, the filesystem is **inconsistent**. Journaling fixes this by writing the *intent* first, then performing the work."
          },
          {
            "type": "diagram",
            "title": "Write path with a journal",
            "height": 200,
            "nodes": [
              {
                "id": "w",
                "label": "write()",
                "subtitle": "app",
                "accent": "water",
                "x": 0.08,
                "y": 0.5
              },
              {
                "id": "j",
                "label": "Journal",
                "subtitle": "intent log",
                "accent": "amber",
                "x": 0.38,
                "y": 0.5
              },
              {
                "id": "m",
                "label": "Metadata",
                "subtitle": "inode · bitmap",
                "accent": "sky",
                "x": 0.68,
                "y": 0.25
              },
              {
                "id": "d",
                "label": "Data blocks",
                "subtitle": "actual bytes",
                "accent": "fire",
                "x": 0.68,
                "y": 0.78
              }
            ],
            "edges": [
              {
                "from": "w",
                "to": "j",
                "kind": "dashed",
                "label": "1. log intent"
              },
              {
                "from": "j",
                "to": "m",
                "kind": "dashed",
                "label": "2. apply",
                "curve": 0.3
              },
              {
                "from": "j",
                "to": "d",
                "kind": "dashed",
                "accent": "fire",
                "label": "2. apply",
                "curve": 0.3
              }
            ]
          },
          {
            "type": "p",
            "text": "On reboot the FS **replays** the journal: any committed intent gets re-applied; anything not committed is discarded. The tradeoff is the choice of *what* gets journaled."
          },
          {
            "type": "table",
            "headers": [
              "Mode",
              "Speed",
              "When to use"
            ],
            "align": [
              "left",
              "center",
              "left"
            ],
            "rows": [
              [
                "writeback",
                "fastest",
                "Caches, scratch — metadata journaled, data may be garbage after crash"
              ],
              [
                "ordered (default)",
                "balanced",
                "Most servers — data hits disk before its metadata commits"
              ],
              [
                "journal (full)",
                "slowest",
                "Databases on cheap disks — both data + metadata journaled, doubles write cost"
              ]
            ]
          }
        ]
      },
      {
        "heading": "Picking a filesystem",
        "body": [
          {
            "type": "p",
            "text": "The big three on Linux solve the same problem from different angles. None is universally best — the right choice falls out of your workload."
          },
          {
            "type": "table",
            "headers": [
              "FS",
              "Strength",
              "Weakness",
              "Pick it for"
            ],
            "align": [
              "left",
              "left",
              "left",
              "left"
            ],
            "rows": [
              [
                "ext4",
                "Boring, fast, ubiquitous",
                "No snapshots, no checksums",
                "Boot disks, general-purpose servers"
              ],
              [
                "xfs",
                "Scales to huge volumes + parallel IO",
                "Cannot shrink",
                "Big data lakes, log spools, NVMe arrays"
              ],
              [
                "btrfs",
                "Snapshots, COW, checksums",
                "RAID5/6 still flaky, complex",
                "Workstations, backup targets"
              ],
              [
                "zfs",
                "End-to-end checksums + send/recv",
                "Out-of-tree, RAM hungry",
                "Storage servers where data integrity wins"
              ]
            ]
          },
          {
            "type": "pros-cons",
            "goodLabel": "WHEN COW WINS",
            "watchLabel": "WHEN COW HURTS",
            "good": [
              "Cheap snapshots — diff a tree in O(changed)",
              "Crash consistency without a separate journal",
              "Block-level checksums catch silent corruption"
            ],
            "watch": [
              "Random writes fragment heavily — databases suffer",
              "`du` and `df` disagree because blocks are shared",
              "Free-space accounting gets weird near full"
            ]
          }
        ],
        "deep": true
      },
      {
        "heading": "Watch out for",
        "body": [
          {
            "type": "ul",
            "items": [
              "**`close()` does not `fsync()`.** A clean close with no flush still loses data on power cut. Every durable writer ends in `fsync` (or `O_SYNC`).",
              "**`df` vs `du` mismatch.** A deleted file held open by a process keeps its blocks until the fd closes — `du` won't see it, `df` will. `lsof | grep deleted` is the diagnostic.",
              "**Out of inodes ≠ out of space.** Millions of tiny files exhaust the inode table while `df -h` still shows free GB. Check `df -i`.",
              "**Page cache hides slow disks** in benchmarks. The *second* run is always fast. Use `echo 3 > /proc/sys/vm/drop_caches` before timing, or `O_DIRECT` to bypass it entirely."
            ]
          },
          {
            "type": "quote",
            "text": "There are only two hard things in Computer Science: cache invalidation and naming things.",
            "cite": "Phil Karlton"
          },
          {
            "type": "p",
            "text": "Filesystems have both — the page cache is the invalidation problem, and dentries are the naming one. Every weird `ls` output you've ever seen lives somewhere on that diagram."
          },
          {
            "type": "explain-back",
            "prompt": "You've traced the full write path: `write()` lands in the **page cache**, an **inode** points at the data blocks, the **journal** records the change, and `fsync` forces the **flush** to the platter. A user reports that after a clean app restart their last few records vanished — no crash, no power loss. Walk through how these pieces conspire to lose that data, then design the durable write the app *should* have done and name the trade-off it costs.",
            "modelAnswer": "The records were written but only ever lived in the **page cache** — `write()` returns the instant the bytes are copied there, long before they hit disk. A normal `close()` does **not** flush, and the kernel's writeback can lag by seconds, so the app's idea of \"saved\" was a dirty page the kernel hadn't yet pushed through the journal to the data blocks. On the clean restart nothing replayed those pages (the journal only protects writes that reached it), so they evaporated. The durable version: after the final `write()`, call **`fsync(fd)`** to force the page cache through the journal and onto the platter, and—because a file's *name* is a directory entry, a separate inode—`fsync` the **parent directory** too so the new entry survives. For rename-based atomic saves, the order is write-temp → fsync(temp) → rename → fsync(dir). The **trade-off**: each `fsync` is a real disk round-trip that stalls the writer, so blanket fsync-per-record can cut throughput by an order of magnitude. The judgment call is *which* writes are precious — fsync those, batch the rest, and accept that the page cache's speed is exactly the durability you're choosing to risk in between.",
            "hint": "Where do the bytes actually live the moment `write()` returns, and which call is the only thing that forces them past the journal to the platter? Then ask what that call costs if you do it on every record.",
            "commit": {
              "q": "The app called `write()` then `close()`, and the records still vanished after a clean restart. Which missing step lost the data?",
              "opts": [
                "A journal replay on reboot that would have restored the lost pages",
                "Opening the file in synchronous mode so `close()` blocks until the disk confirms",
                "An `fsync` to force the dirty pages out of the page cache onto disk"
              ],
              "answer": 2,
              "why": "`write()` only copies bytes into the page cache, and `close()` does not flush — something has to explicitly push those dirty pages to storage before they're durable."
            }
          }
        ]
      }
    ]
  },
  "py-variables": {
    "objectives": [
      "Explain a variable as a label pointing at a value — not a box containing it",
      "Predict what a name points at after a chain of reassignments",
      "Pick legal, readable variable names and spot the illegal ones"
    ],
    "sections": [
      {
        "heading": "The idea",
        "body": [
          {
            "type": "p",
            "text": "A variable lets you label a value so you can use it again later. Think of it like a sticky note on a box."
          },
          {
            "type": "p",
            "text": "In Python, you create one with `=`:"
          },
          {
            "type": "code",
            "lang": "python",
            "text": "name = \"{userName}\"\nage = 22"
          },
          {
            "type": "p",
            "text": "Now you can use `name` anywhere instead of typing \"{userName}\" again."
          },
          {
            "type": "h3",
            "text": "Why this matters"
          },
          {
            "type": "p",
            "text": "Code without variables is like a recipe written without measuring cups. You'd have to write the literal value \"{userName}\" everywhere you need it. Change your mind? Hunt down every copy. With a variable, you change one line and the rest follows."
          },
          {
            "type": "p",
            "text": "Behind the scenes, when you write `name = \"{userName}\"`, Python creates a string object in memory and makes `name` point to it. The variable is the label; the value is the actual data. Two variables can even point to the same value:"
          },
          {
            "type": "code",
            "lang": "python",
            "text": "first = \"{userName}\"\nnickname = first  # both labels point to the same string"
          },
          {
            "type": "p",
            "text": "This becomes important later for lists, dicts, and objects — where understanding \"which name points to what\" is the difference between code that works and code that mysteriously modifies things you didn't expect."
          },
          {
            "type": "h3",
            "text": "Naming rules"
          },
          {
            "type": "table",
            "headers": [
              "Name",
              "Valid?",
              "Why"
            ],
            "align": [
              "left",
              "center",
              "left"
            ],
            "rows": [
              [
                "`name`",
                "✓",
                "Starts with a letter"
              ],
              [
                "`_count`",
                "✓",
                "Underscore is OK as the first character"
              ],
              [
                "`2name`",
                "✗",
                "Can't start with a digit"
              ],
              [
                "`user_age`",
                "✓",
                "Letters, digits, underscores only"
              ],
              [
                "`user-age`",
                "✗",
                "Dashes aren't allowed — Python reads it as subtraction"
              ],
              [
                "`Name`",
                "✓",
                "Different variable from `name` — case matters"
              ],
              [
                "`class`",
                "✗",
                "Reserved keyword — same for `if`, `for`, `def`, `import`"
              ]
            ]
          },
          {
            "type": "p",
            "text": "**Convention:** use `snake_case` for variables — `user_name`, not `userName` or `UserName`. Other languages differ; Python's PEP 8 picked snake_case."
          },
          {
            "type": "h3",
            "text": "Common bugs"
          },
          {
            "type": "p",
            "text": "**Typos creating ghost variables.** You wrote `name = \"{userName}\"` on line 5 then `nmae` on line 10. Python doesn't complain about `nmae` the first time you assign it — it just creates a new variable. You'll hunt for hours."
          },
          {
            "type": "p",
            "text": "**Using before assigning.** `print(age)` before `age = 22` throws `NameError: name 'age' is not defined`. Python reads top to bottom; the variable must exist before use."
          }
        ],
        "takeaway": "A variable is a label pointing at a value — not a box containing it."
      },
      {
        "heading": "Try it",
        "body": []
      },
      {
        "heading": "Quick check",
        "body": []
      },
      {
        "heading": "Reassigning",
        "body": [
          {
            "type": "p",
            "text": "Once you create a variable, you can change what it points to. The old value is discarded."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "x = 5\nprint(x)    # prints 5\n\nx = 10  # x now points to 10\nprint(x)    # prints 10"
          },
          {
            "type": "p",
            "text": "You can also use a variable in its own update:"
          },
          {
            "type": "code",
            "lang": "python",
            "text": "x = 5\nx = x + 3   # x is now 8"
          },
          {
            "type": "practice",
            "lang": "python",
            "prompt": "Try changing the input and see what comes out.",
            "varName": "result",
            "starter": "x = 5\ny = x * 2\nresult = y + 3\nprint(result)\n",
            "hint": "Rebind `x` to a different number, or change the operations. Whatever ends up in `result` is what we echo back."
          }
        ],
        "takeaway": "Reassigning moves the label to a new value; the old one is simply forgotten."
      },
      {
        "heading": "Your turn — make x equal 100",
        "body": []
      },
      {
        "heading": "Check",
        "body": []
      },
      {
        "heading": "What's allowed",
        "body": []
      },
      {
        "heading": "Make a typo work",
        "body": [],
        "deep": true
      }
    ]
  },
  "py-types": {
    "objectives": [
      "Name the type of any literal (`int`, `float`, `str`, `bool`) and what operations it allows",
      "Spot type-confusion bugs like `'2' + 2` before running the code",
      "Convert between types with `int()`, `float()`, `str()` — and predict when conversion fails"
    ],
    "sections": [
      {
        "heading": "The three primitive families",
        "body": [
          {
            "type": "p",
            "text": "Every Python value has a **type**, and the three you'll meet first are **numbers**, **strings**, and **booleans**. Python figures out the type from the literal you write — no declarations, no annotations required."
          },
          {
            "type": "p",
            "text": "But \"figured out\" doesn't mean \"forgiving.\" Mix them wrong and you get `TypeError`, not silent coercion. Knowing what each type *is* saves you from chasing bugs that look like math errors but are really type errors."
          }
        ],
        "takeaway": "Every value has exactly one type, and the type decides what you can do with it."
      },
      {
        "heading": "What each type actually is",
        "body": [
          {
            "type": "table",
            "headers": [
              "Type",
              "Literal",
              "Why it exists"
            ],
            "align": [
              "left",
              "left",
              "left"
            ],
            "rows": [
              [
                "`int`",
                "`42`, `-7`, `10**100`",
                "Exact integers, unbounded size"
              ],
              [
                "`float`",
                "`3.14`, `1e-9`, `inf`",
                "IEEE-754 64-bit, fast but lossy"
              ],
              [
                "`complex`",
                "`2+3j`",
                "Real + imaginary, rarely needed"
              ],
              [
                "`str`",
                "`\"hi\"`, `'hi'`, `\"\"\"...\"\"\"`",
                "Unicode text, indexed by code point"
              ],
              [
                "`bool`",
                "`True`, `False`",
                "Subclass of `int` — `True == 1`"
              ]
            ]
          },
          {
            "type": "p",
            "text": "All five are **immutable**: you never modify a string in place, you build a new one. And `bool` literally inherits from `int`, which is why `True + True == 2` is legal Python (and occasionally useful)."
          }
        ]
      },
      {
        "heading": "Operators in practice",
        "body": [
          {
            "type": "p",
            "text": "Start with arithmetic — `+ - * /` work as expected, with two extras: `//` for floor division and `**` for exponent."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "price = 19.99  # float — note the decimal\nqty = 3  # int — no decimal\ntotal = price * qty  # float wins — promotion rule\nchange = 100 // 7  # 14 — floor division, drops remainder\nleft = 100 % 7  # 2  — modulo, the dropped part\npower = 2 ** 10  # 1024 — ** is exponent, not XOR"
          },
          {
            "type": "p",
            "text": "Strings are immutable. `+` concatenates, indexing with `[i]` returns a 1-char string, and f-strings are the modern formatter."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "name = \"ada\"\ngreet = \"hi, \" + name  # concat — both sides must be str\nshout = name.upper()  # returns new str, name unchanged\nlabel = f\"{name!r} x{qty}\"  # f-string, !r calls repr()\nfirst = name[0]  # 'a' — indexing returns a 1-char str\nname[0] = \"A\"  # TypeError — str is immutable, can't assign to an index"
          },
          {
            "type": "p",
            "text": "Booleans and truthiness — empty values are falsy, and `and`/`or` short-circuit, returning one of their operands (not necessarily `True`/`False`)."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "empty = \"\"  # falsy — empty str is False in bool ctx\nzero = 0  # falsy — and so is 0, 0.0, None, []\nflag = bool(empty or \"fallback\")  # True — `or` returns first truthy value\npicked = qty and name   # qty is truthy, so 'and' returns name (the 2nd operand)"
          },
          {
            "type": "p",
            "text": "Two things worth memorizing. **`/` always gives a float** (`6 / 2 == 3.0`), while `//` gives floor-division. And **`and` / `or` return operands, not booleans** — `\"\" or \"fallback\"` is `\"fallback\"`, which is how Python does default values without a ternary."
          }
        ]
      },
      {
        "heading": "The traps that bite everyone",
        "body": [
          {
            "type": "pros-cons",
            "goodLabel": "Lean on this",
            "watchLabel": "Don't get burned",
            "good": [
              "`int` has arbitrary precision — `2**1000` just works, no overflow.",
              "Strings are immutable, so they're safe to use as dict keys and share across threads.",
              "f-strings (`f\"{x=}\"`) are the fastest and clearest formatting — prefer them over `%` or `.format()`.",
              "`bool` is an `int` subclass: `sum([True, False, True])` counts truthy values in one line."
            ],
            "watch": [
              "`0.1 + 0.2 == 0.30000000000000004` — floats are binary, not decimal. Use `decimal.Decimal` for money.",
              "`\"5\" + 3` raises `TypeError`. Cast explicitly: `int(\"5\") + 3` or `\"5\" + str(3)`.",
              "Building strings with `+=` in a loop is O(n²). Use `\"\".join(parts)` instead.",
              "`is` checks identity, not equality. `x == 5` is right; `x is 5` works by accident (small-int cache) and breaks at 257."
            ]
          }
        ],
        "takeaway": "Most beginner bugs here are type confusions — `'2' + 2` is an error, not 4."
      },
      {
        "heading": "How conversion really works",
        "body": [
          {
            "type": "table",
            "headers": [
              "Call",
              "Converts to",
              "What happens"
            ],
            "rows": [
              [
                "`int(\"42\")`",
                "`int`",
                "Explicit — raises `ValueError` on garbage"
              ],
              [
                "`float(\"3.14\")`",
                "`float`",
                "Explicit — accepts `\"inf\"`, `\"nan\"` too"
              ],
              [
                "`1 + 2.0`",
                "`float`",
                "**Auto-promote** — float wins when mixed"
              ],
              [
                "`int(3.9)`",
                "`int`",
                "**Truncates** toward zero — `3.9` becomes `3`"
              ],
              [
                "`bool(0)`",
                "`bool`",
                "`0` is `False`, anything else `True`"
              ],
              [
                "`str(x)`",
                "`str`",
                "Always works — calls `__str__`"
              ]
            ]
          },
          {
            "type": "predict",
            "prompt": "In a Python REPL you type `\"5\" + 3`. What happens?",
            "options": [
              "`\"53\"` — Python coerces the int to a string for concat",
              "`8` — Python coerces the string to an int for math",
              "`TypeError` — can't concatenate `str` and `int`",
              "`SyntaxError` — the expression is rejected at parse time"
            ],
            "answer": 2,
            "explain": "Python refuses cross-family coercion. The `+` operator first tries `str.__add__(int)`, which returns `NotImplemented`, then `int.__radd__(str)`, which also returns `NotImplemented` — the interpreter raises `TypeError` at runtime, not parse time. Fix it by being explicit: `\"5\" + str(3)` for concat, `int(\"5\") + 3` for math. The only auto-promotion Python does is **int → float**, because they're both numeric. Strings live in a different family."
          },
          {
            "type": "p",
            "text": "Python promotes **int → float** automatically when they meet (`1 + 2.0` is `3.0`), but it will *never* promote `str → int` for you. Every cross-family conversion is explicit: `int(\"42\")`, `str(42)`, `bool(0)`. That explicitness is the feature."
          }
        ],
        "deep": true
      },
      {
        "heading": "Watch out for",
        "body": [
          {
            "type": "ul",
            "items": [
              "**Float equality is a lie.** Use `math.isclose(a, b)` with an explicit tolerance — never `a == b` for computed floats.",
              "**`bool(\"False\") is True`.** Any non-empty string is truthy, including the literal text `\"False\"`. Parse it with `s.lower() == \"true\"`.",
              "**Strings iterate as characters.** `for c in \"abc\"` yields `\"a\"`, `\"b\"`, `\"c\"` — useful, but a common source of off-by-one bugs when you meant to iterate over a list of strings."
            ]
          },
          {
            "type": "quote",
            "text": "There are 10 types of people: those who understand binary, and those who learn that 0.1 isn't exactly 0.1."
          }
        ]
      }
    ]
  },
  "py-strings": {
    "objectives": [
      "Format any value cleanly with an f-string",
      "Slice any string with `[start:stop:step]` and predict the result",
      "Explain why strings never change — and what every 'edit' really builds",
      "Pick the right str method (`strip`, `split`, `join`, `replace`) for a cleanup job"
    ],
    "sections": [
      {
        "heading": "Strings are immutable sequences",
        "body": [
          {
            "type": "p",
            "text": "A Python **str** is an **immutable sequence of Unicode code points**. Every \"modification\" returns a new string — the original is untouched. This is the single fact that explains 80% of beginner string bugs."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "s = \"hello\"  # original object\ns.replace(\"h\", \"j\")   # returns \"jello\" — discarded!\nprint(s)  # still \"hello\"\ns = s.replace(\"h\", \"j\")  # rebind name to keep result"
          },
          {
            "type": "p",
            "text": "Because strings are immutable, **building one with `+=` in a loop is O(n²)** — each concat copies the whole buffer. Use `''.join(parts)` or an f-string instead."
          }
        ],
        "takeaway": "Strings never change — every 'edit' quietly builds a new string."
      },
      {
        "heading": "f-strings: the only formatter you need",
        "body": [
          {
            "type": "p",
            "text": "**f-strings** (PEP 498, Python 3.6+) embed expressions directly in literals. They are faster than `%` and `.format()`, and easier to read because the value sits where it will appear."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "name, n = \"Ada\", 7\nf\"{name} has {n} items\"  # basic interpolation\nf\"{n:03d}\"  # \"007\" — pad with zeros\nf\"{3.14159:.2f}\"  # \"3.14\" — 2 decimal places\nf\"{n:,}\" if n > 999 else str(n)  # thousands sep on big nums\nf\"{name=}\"  # \"name='Ada'\" — debug shortcut (3.8+)\nf\"{'x' * n:>10}\"  # right-align in width 10"
          },
          {
            "type": "p",
            "text": "The format spec after `:` is the same mini-language `format()` uses. Memorize `:.2f` (decimals), `:,` (commas), `:03d` (zero-pad), `:>10` / `:<10` / `:^10` (align). That covers most real work."
          }
        ],
        "takeaway": "f-strings are the only formatter you need: `f\"{name} is {age}\"`."
      },
      {
        "heading": "Slicing: [start:stop:step]",
        "body": [
          {
            "type": "p",
            "text": "Slicing returns a **new string**. Indices are **half-open**: `stop` is exclusive. Negatives count from the end. Out-of-range slices clamp silently instead of raising."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "s = \"infralearn\"\ns[0]  # \"i\"           — single char (str, not byte)\ns[0:5]  # \"infra\"       — chars 0..4\ns[:5]  # \"infra\"       — start defaults to 0\ns[5:]  # \"learn\"       — stop defaults to len(s)\ns[-5:]  # \"learn\"       — last 5 chars\ns[::-1]    # \"nraelarfni\"  — reverse via step=-1\ns[100:200] # \"\"             — no IndexError, just empty"
          },
          {
            "type": "table",
            "headers": [
              "Expression",
              "Result",
              "Why"
            ],
            "rows": [
              [
                "s[0]",
                "\"i\"",
                "Index — raises IndexError if out of range"
              ],
              [
                "s[0:1]",
                "\"i\"",
                "Slice — never raises, even on empty str"
              ],
              [
                "s[::2]",
                "\"ifaer\"",
                "Every other char"
              ],
              [
                "s[::-1]",
                "\"nraelarfni\"",
                "Idiomatic reverse"
              ],
              [
                "s[-3:]",
                "\"arn\"",
                "Tail — works on any length ≥ 0"
              ]
            ]
          }
        ]
      },
      {
        "heading": "The str methods that actually matter",
        "body": [
          {
            "type": "terms",
            "items": [
              {
                "term": "split(sep)",
                "def": "Break on `sep` (default: any whitespace, collapsing runs). Returns a list. `\"a,b,,c\".split(\",\")` gives `[\"a\",\"b\",\"\",\"c\"]` — empty fields preserved."
              },
              {
                "term": "join(iterable)",
                "def": "The inverse, called on the **separator**: `\", \".join([\"a\",\"b\"])` → `\"a, b\"`. All elements must already be str."
              },
              {
                "term": "strip() / lstrip() / rstrip()",
                "def": "Remove leading/trailing whitespace by default, or any chars in the given set. **Not a prefix stripper** — `\"https://x\".lstrip(\"https://\")` removes any of `h/t/p/s/:/` greedily. Use `removeprefix()` (3.9+) instead."
              },
              {
                "term": "replace(old, new, count=-1)",
                "def": "Replace **all** occurrences (or first `count`). Returns a new string. Does not use regex — for patterns, reach for `re.sub`."
              },
              {
                "term": "startswith / endswith",
                "def": "Accept a tuple of options: `path.endswith((\".jpg\", \".png\"))`. Cleaner than chained `or`."
              },
              {
                "term": "in",
                "def": "Substring test, not method but essential: `\"err\" in line`. O(n·m) worst case but fast in practice."
              }
            ]
          },
          {
            "type": "code",
            "lang": "python",
            "text": "line = \"  id=42, name=Ada, role=admin  \"\nparts = line.strip().split(\",\")  # trim then split\nfields = {}  # accumulate into dict\nfor p in parts:  # one \"k=v\" per loop\n    k, v = p.strip().split(\"=\", 1)  # maxsplit=1 — safe if v has =\n    fields[k] = v  # {\"id\":\"42\", ...}"
          }
        ]
      },
      {
        "heading": "Bytes vs str: encode and decode",
        "body": [
          {
            "type": "p",
            "text": "A **str** is text (Unicode). A **bytes** object is raw octets. Networks, files in binary mode, and hashes all deal in bytes. You must convert at the boundary."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "s = \"café\"  # 4 chars, 1 is non-ASCII (é)\nb = s.encode(\"utf-8\")  # b'caf\\xc3\\xa9' — 5 bytes (é = 2)\nlen(s), len(b)  # (4, 5) — chars ≠ bytes\nb.decode(\"utf-8\")  # \"café\" — round-trip\nb.decode(\"ascii\")  # UnicodeDecodeError — é not ASCII\nb.decode(\"ascii\", \"ignore\") # \"caf\" — silently drops bad bytes"
          },
          {
            "type": "p",
            "text": "**Default to UTF-8 everywhere.** It's the only sane choice for new code, handles all of Unicode, and is ASCII-compatible. Specify it explicitly — never rely on the platform default (`locale.getpreferredencoding()` varies, especially on Windows)."
          },
          {
            "type": "walkthrough",
            "title": "Where the boundary lives",
            "why": "Decode at the **edge**, encode on the way out, and keep everything in between as `str` — that one discipline kills almost every Unicode bug.",
            "nodes": [
              {
                "id": "src",
                "label": "Source",
                "subtitle": "file / API",
                "x": 0.1,
                "y": 0.08,
                "accent": "water"
              },
              {
                "id": "bytes",
                "label": "bytes",
                "subtitle": "raw octets",
                "x": 0.4,
                "y": 0.36,
                "accent": "earth"
              },
              {
                "id": "str",
                "label": "str",
                "subtitle": "Unicode text",
                "x": 0.7,
                "y": 0.64,
                "accent": "sky"
              },
              {
                "id": "logic",
                "label": "Your code",
                "subtitle": "work in str",
                "x": 0.95,
                "y": 0.92,
                "accent": "amber"
              }
            ],
            "steps": [
              {
                "title": "Data arrives at the source",
                "description": "Text reaches you from outside — a **file**, a socket, an **API** response. The outside world has no idea what a Python `str` is.",
                "activeNodes": [
                  "src"
                ],
                "activeEdges": []
              },
              {
                "title": "It comes in as bytes",
                "description": "Reading gives you **`bytes`** — raw octets, not text. `b'caf\\xc3\\xa9'` is just numbers until you tell Python how to interpret them.",
                "activeNodes": [
                  "src",
                  "bytes"
                ],
                "activeEdges": [
                  {
                    "from": "src",
                    "to": "bytes",
                    "label": "read"
                  }
                ]
              },
              {
                "title": "Decode at the boundary",
                "description": "Call **`.decode('utf-8')`** right here to turn bytes into a real `str`. This is *the* boundary — decode once, as early as possible, and never guess the encoding.",
                "activeNodes": [
                  "bytes",
                  "str"
                ],
                "activeEdges": [
                  {
                    "from": "bytes",
                    "to": "str",
                    "label": ".decode('utf-8')"
                  }
                ]
              },
              {
                "title": "Work in str",
                "description": "Everything inside your program runs on **`str`** — Unicode text where `len` and slicing mean characters, not bytes. Only re-`encode` when you write back out.",
                "activeNodes": [
                  "str",
                  "logic"
                ],
                "activeEdges": [
                  {
                    "from": "str",
                    "to": "logic"
                  }
                ]
              }
            ]
          }
        ],
        "deep": true
      },
      {
        "heading": "Watch out for",
        "body": [
          {
            "type": "pros-cons",
            "goodLabel": "Idiomatic",
            "watchLabel": "Common bugs",
            "good": [
              "`''.join(parts)` to build a string from many pieces — O(n) instead of O(n²).",
              "`s.removeprefix(\"https://\")` (3.9+) for prefix stripping — `lstrip` is a charset, not a string.",
              "`f\"{x:.2f}\"` over `\"%.2f\" % x` — faster, clearer, type-checked at parse time.",
              "Always pass `encoding=\"utf-8\"` to `open()` — never trust the platform default.",
              "`split(sep, maxsplit=1)` when the rest of the line may contain `sep`."
            ],
            "watch": [
              "`s.replace(\"a\", \"b\")` on its own — result discarded because str is immutable. Rebind.",
              "`s += other` inside a loop — quadratic copy. Collect into a list, join at the end.",
              "Comparing `b\"hello\" == \"hello\"` — always False (bytes ≠ str). Decode first.",
              "`\"abc\".strip(\"abc\")` returns `\"\"` — `strip` takes a **char set**, not a substring.",
              "`len(s)` on emoji or combining chars — counts code points, not user-perceived characters.",
              "Mutable-default trap doesn't apply (str is immutable), but slicing huge strings still copies."
            ]
          },
          {
            "type": "quote",
            "text": "If you mutated it, you didn't — you got a new one back. Catch the return value or it never happened.",
            "cite": "the str immutability rule"
          }
        ]
      }
    ]
  },
  "py-lists": {
    "objectives": [
      "Predict the cost of a list operation — append is cheap, front-insert is not",
      "Spot aliasing bugs (two names, one list) and copy on purpose when you need to",
      "Run the five everyday operations: index, append, pop, `in`, slice"
    ],
    "cliffhanger": "So what happens when you need to pop from the front a million times — what data structure handles that?",
    "sections": [
      {
        "heading": "What a list actually is",
        "body": [
          {
            "type": "p",
            "text": "A Python **list** is a dynamic array of **pointers**, not a row of values. The list object holds a small header (length, capacity, refcount) plus a contiguous block of PyObject pointers — each pointer dereferences to the actual integer, string, or whatever you stuffed in."
          },
          {
            "type": "p",
            "text": "That's why a list can mix types and still index in O(1): you're chasing pointer N from the base, not parsing variable-width data. It's also why lists are heavier than a C array — every int costs a pointer *plus* a boxed int object on the heap."
          },
          {
            "type": "diagram",
            "title": "List memory layout",
            "nodes": [
              {
                "id": "hdr",
                "label": "list header",
                "subtitle": "len=3 cap=4",
                "x": 0.1,
                "y": 0.5,
                "accent": "amber"
              },
              {
                "id": "arr",
                "label": "pointer array",
                "subtitle": "[*, *, *, _]",
                "x": 0.45,
                "y": 0.5,
                "accent": "sky"
              },
              {
                "id": "a",
                "label": "int 42",
                "subtitle": "heap object",
                "x": 0.82,
                "y": 0.15,
                "accent": "earth"
              },
              {
                "id": "b",
                "label": "str 'hi'",
                "subtitle": "heap object",
                "x": 0.82,
                "y": 0.5,
                "accent": "earth"
              },
              {
                "id": "c",
                "label": "list [...]",
                "subtitle": "heap object",
                "x": 0.82,
                "y": 0.85,
                "accent": "earth"
              }
            ],
            "edges": [
              {
                "from": "hdr",
                "to": "arr",
                "kind": "solid",
                "label": "owns"
              },
              {
                "from": "arr",
                "to": "a",
                "kind": "dashed"
              },
              {
                "from": "arr",
                "to": "b",
                "kind": "dashed"
              },
              {
                "from": "arr",
                "to": "c",
                "kind": "dashed"
              }
            ]
          }
        ],
        "takeaway": "A list is a growable row of pointers — and each operation has a cost."
      },
      {
        "heading": "The five operations you'll actually run",
        "body": [
          {
            "type": "p",
            "text": "Index, slice, append, insert, pop. Know what each one costs *before* you put it in a loop."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "xs = [10, 20, 30, 40, 50]  # contiguous pointer array, len=5\n\nxs[2]  # O(1) — direct offset, no scan\nxs[1:4]  # O(k) — allocates NEW list, copies k pointers\n\nxs.append(60)  # amortized O(1) — capacity doubles when full\nxs.insert(0, 5)  # O(n) — every element shifts right one slot\n\nxs.pop()  # O(1) — chop the tail, decrement len\nxs.pop(0)  # O(n) — every element shifts left, avoid in loops\n\n2 in xs  # O(n) — linear scan; use set() if you do this often\nxs.sort()  # O(n log n) — Timsort, in-place, stable"
          },
          {
            "type": "p",
            "text": "If you find yourself doing `pop(0)` or `insert(0, ...)` in a tight loop, you wanted a `collections.deque` — it pays O(1) at both ends."
          }
        ]
      },
      {
        "heading": "Complexity cheat sheet",
        "body": [
          {
            "type": "table",
            "headers": [
              "Operation",
              "Cost",
              "Why"
            ],
            "align": [
              "left",
              "center",
              "left"
            ],
            "rows": [
              [
                "`xs[i]`",
                "O(1)",
                "pointer offset from base"
              ],
              [
                "`xs[i] = v`",
                "O(1)",
                "overwrite one slot"
              ],
              [
                "`xs.append(v)`",
                "O(1)*",
                "amortized; doubles capacity"
              ],
              [
                "`xs.pop()`",
                "O(1)",
                "tail removal, no shift"
              ],
              [
                "`xs.insert(0, v)`",
                "O(n)",
                "shifts every element right"
              ],
              [
                "`xs.pop(0)`",
                "O(n)",
                "shifts every element left"
              ],
              [
                "`v in xs`",
                "O(n)",
                "linear scan, no hash"
              ],
              [
                "`xs.sort()`",
                "O(n log n)",
                "Timsort, in-place"
              ],
              [
                "`len(xs)`",
                "O(1)",
                "stored in the header"
              ]
            ]
          }
        ]
      },
      {
        "heading": "Aliasing — the bug that eats juniors",
        "body": [
          {
            "type": "p",
            "text": "Lists are **mutable reference types**. Assigning a list doesn't copy it — both names point at the same underlying array."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "a = [1, 2, 3]\nb = a  # b is NOT a copy — same object\nb.append(99)  # mutates the one shared list\nprint(a)  # [1, 2, 3, 99] — surprise\n\nc = a.copy()  # shallow copy — new outer list\nc.append(0)  # doesn't touch a\n\n# But shallow only goes one level deep:\ngrid = [[0]*3] * 3  # gotcha — three refs to ONE inner list\ngrid[0][0] = 1  # mutates the shared row\nprint(grid)  # [[1,0,0],[1,0,0],[1,0,0]] — yikes\n\ngrid = [[0]*3 for _ in range(3)]   # correct — each row is its own list"
          },
          {
            "type": "pros-cons",
            "goodLabel": "Use a list when",
            "watchLabel": "Reach for something else when",
            "good": [
              "You need ordered, indexed access by position",
              "You append-heavy and rarely insert at the front",
              "Mixed types or unknown size at construction",
              "You'll iterate the whole thing more than you'll search it"
            ],
            "watch": [
              "Membership tests dominate — use a `set` (O(1) lookup)",
              "Queue/deque pattern — use `collections.deque`",
              "Numeric crunching — use `numpy.ndarray` (unboxed, contiguous)",
              "Fixed small record — use a `tuple` or `dataclass`"
            ]
          }
        ],
        "takeaway": "Assigning a list copies the LABEL, not the list — two names, one list."
      },
      {
        "heading": "Watch out for",
        "body": [
          {
            "type": "ul",
            "items": [
              "**Default argument lists** — `def f(x=[])` shares one list across every call. Use `x=None` and initialize inside.",
              "**Mutating while iterating** — `for x in xs: xs.remove(x)` skips elements. Iterate a copy or build a new list.",
              "**`list * n` with nested mutables** — duplicates the *reference* n times, not the object. Use a comprehension.",
              "**Big `in` checks** — converting to `set(xs)` once is cheaper than scanning repeatedly.",
              "**`+= ` on a list inside a tuple** — extends in place *and* raises `TypeError`. Both happen. Don't."
            ]
          },
          {
            "type": "quote",
            "text": "A list is a pointer array with a length field. Everything else — the costs, the bugs, the deque advice — falls out of that one fact.",
            "cite": "the only mental model you need"
          }
        ]
      }
    ]
  },
  "py-conditionals": {
    "objectives": [
      "Predict which branch runs by evaluating truthiness — `if x` really asks `bool(x)`",
      "Recite the short falsy list and classify any value as truthy or falsy",
      "Use short-circuit `and`/`or` and the one-line ternary without surprises"
    ],
    "sections": [
      {
        "heading": "Branching is just truthiness in disguise",
        "body": [
          {
            "type": "p",
            "text": "Every `if` in Python is really `if bool(thing)`. The interpreter calls `__bool__` (or falls back to `__len__`) on whatever expression you hand it. Skip this and you'll write `if len(items) > 0:` forever — verbose, redundant, and not idiomatic."
          },
          {
            "type": "p",
            "text": "Python uses **indentation** as the block delimiter. No braces, no `end`, no `then`. A four-space indent IS the syntax — get sloppy with tabs and you get `IndentationError` at parse time, not runtime."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "items = []  # empty list\nif items:  # falsy — body skipped\n    process(items)  # never runs\nelif cache_hit:  # checked only if items was falsy\n    serve_from(cache_hit)  # short-circuit: stops at first True\nelse:  # fallback when all above were falsy\n    fetch_remote()  # default branch"
          }
        ],
        "takeaway": "`if x` really asks `bool(x)` — truthiness decides the branch."
      },
      {
        "heading": "What counts as falsy",
        "body": [
          {
            "type": "p",
            "text": "Memorize this list. Everything else — including the string `\"False\"`, the float `-0.1`, and any non-empty container — is **truthy**."
          },
          {
            "type": "terms",
            "items": [
              {
                "term": "None",
                "def": "The null singleton — always falsy, the canonical \"no value\" sentinel."
              },
              {
                "term": "False",
                "def": "The boolean literal — also equal to integer 0 under the hood."
              },
              {
                "term": "0, 0.0, 0j",
                "def": "Any numeric zero across int, float, and complex types."
              },
              {
                "term": "\"\", b\"\"",
                "def": "Empty string and empty bytes — length zero means falsy."
              },
              {
                "term": "[], (), {}, set()",
                "def": "Empty list, tuple, dict, and set — all falsy via `__len__` returning 0."
              },
              {
                "term": "Custom objects",
                "def": "Falsy if `__bool__` returns `False` or `__len__` returns `0`."
              }
            ]
          },
          {
            "type": "p",
            "text": "The subtle trap: `if x:` and `if x is not None:` are NOT the same. If `x = 0` or `x = []`, the first skips, the second runs. When you genuinely mean \"was a value passed?\", use **`is not None`** explicitly."
          }
        ],
        "takeaway": "Memorize the short falsy list; everything else is truthy."
      },
      {
        "heading": "Short-circuit and the ternary",
        "body": [
          {
            "type": "p",
            "text": "`and` / `or` don't return booleans — they return one of the **operands**. `and` returns the first falsy value (or the last value if all truthy); `or` returns the first truthy value. This makes them useful as default-pickers, not just logic gates."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "name = user_input or \"anonymous\"    # \"\" is falsy → falls through to default\nport = config.get(\"port\") or 8080   # WARNING: 0 also falls through!\nport = config.get(\"port\", 8080)  # safer — distinguishes missing from zero\n\nrate = 0.01 if is_premium else 0.05 # ternary: value_if_true if cond else value_if_false\nmsg  = data and data[\"name\"]  # short-circuit guard — no IndexError if data is empty"
          },
          {
            "type": "p",
            "text": "The ternary expression `a if cond else b` is for **values**, not statements. If you need side effects in both branches, write a full `if/else` block — don't nest ternaries past one level or your reviewers will quietly resent you."
          }
        ]
      },
      {
        "heading": "match/case — structural pattern matching",
        "body": [
          {
            "type": "p",
            "text": "Python 3.10+ added `match/case`. It's NOT a C-style switch — it's **structural pattern matching**, closer to Rust or Scala. You destructure shape, bind names, and guard with `if`. Use it when you'd otherwise write a chain of `isinstance` checks or tuple-unpacking `if`s."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "match event:\n    case {\"type\": \"click\", \"x\": x, \"y\": y}:   # dict pattern — binds x, y\n        handle_click(x, y)  # captured from the matched dict\n    case [first, *rest] if rest:  # list pattern + guard clause\n        handle_batch(first, rest)  # rest must be non-empty here\n    case Point(x=0, y=0):  # class pattern — matches origin\n        handle_origin()  # no bindings needed\n    case _:  # wildcard — the default arm\n        log_unknown(event)  # _ matches anything, binds nothing"
          },
          {
            "type": "p",
            "text": "Beware the **name-binding gotcha**: `case CONSTANT:` (lowercase) binds a new variable named `constant` and matches everything. To match against a constant, use a **dotted name** like `case Status.READY:` or guard with `if x == CONSTANT`."
          }
        ],
        "deep": true
      },
      {
        "heading": "Decision flow",
        "body": [
          {
            "type": "diagram",
            "title": "How a conditional resolves",
            "nodes": [
              {
                "id": "expr",
                "label": "expression",
                "subtitle": "any object",
                "x": 0.08,
                "y": 0.5,
                "accent": "water"
              },
              {
                "id": "bool",
                "label": "bool(x)",
                "subtitle": "__bool__ → __len__",
                "x": 0.32,
                "y": 0.5,
                "accent": "sky"
              },
              {
                "id": "if",
                "label": "if branch",
                "subtitle": "truthy path",
                "x": 0.62,
                "y": 0.22,
                "accent": "earth"
              },
              {
                "id": "elif",
                "label": "elif chain",
                "subtitle": "tested in order",
                "x": 0.62,
                "y": 0.78,
                "accent": "amber"
              },
              {
                "id": "else",
                "label": "else",
                "subtitle": "fallback",
                "x": 0.88,
                "y": 0.78,
                "accent": "fire"
              }
            ],
            "edges": [
              {
                "from": "expr",
                "to": "bool",
                "kind": "dashed",
                "accent": "water",
                "label": "coerce"
              },
              {
                "from": "bool",
                "to": "if",
                "kind": "dashed",
                "accent": "sky",
                "label": "True"
              },
              {
                "from": "bool",
                "to": "elif",
                "kind": "dashed",
                "accent": "amber",
                "label": "False"
              },
              {
                "from": "elif",
                "to": "else",
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
            "type": "pros-cons",
            "goodLabel": "Idiomatic",
            "watchLabel": "Traps",
            "good": [
              "`if items:` instead of `if len(items) > 0:` — Pythonic truthiness.",
              "`x is None` / `x is not None` — identity check for the singleton, never `==`.",
              "`value = override or default` — clean fallback when 0 and \"\" aren't valid inputs.",
              "`match` for destructuring shapes; `if/elif` for value comparison."
            ],
            "watch": [
              "`if x:` silently treats `0`, `\"\"`, `[]` as \"missing\" — use `is not None`.",
              "`a or b` returns `b` whenever `a` is falsy, not just when it's `None`.",
              "Bare `case name:` in `match` binds, doesn't compare — use `Enum.NAME` or a guard.",
              "Mixing tabs and spaces — `python -tt` will reject it; your editor should too."
            ]
          },
          {
            "type": "quote",
            "text": "If you're writing `== True` or `== False`, you've already lost.",
            "cite": "every Python reviewer, ever"
          }
        ]
      }
    ]
  },
  "py-loops": {
    "objectives": [
      "Choose `for` vs `while` by whether the collection already exists",
      "Replace manual index bookkeeping with `enumerate` and `zip`",
      "Steer a loop with `break`, `continue`, and the for/else clause"
    ],
    "sections": [
      {
        "heading": "Two loops, one job",
        "body": [
          {
            "type": "p",
            "text": "Python has two loops and they split cleanly. **`for`** iterates over something that already knows how to yield items — a list, a string, a generator, a file. **`while`** runs until a condition flips false — use it when you don't know the count ahead of time."
          },
          {
            "type": "p",
            "text": "If you're reaching for `while i < len(xs)` and incrementing `i` by hand, **stop**. That's a `for` loop wearing a costume, and you'll fencepost yourself within a week."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "for name in users:  # iterates the sequence directly\n    print(name)  # no index bookkeeping\n\nattempts = 0  # while needs an external state var\nwhile not connected and attempts < 5:    # condition can mix multiple checks\n    connected = try_connect()  # side-effect drives the loop\n    attempts += 1  # forget this → infinite loop"
          }
        ],
        "takeaway": "`for` walks a collection that exists; `while` runs until a condition flips."
      },
      {
        "heading": "enumerate and zip — stop indexing manually",
        "body": [
          {
            "type": "p",
            "text": "Two helpers cover 90% of the cases where beginners write `range(len(...))`. **`enumerate`** gives you `(index, value)` pairs. **`zip`** walks multiple iterables in lockstep and stops at the shortest."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "for i, user in enumerate(users):  # idiomatic — never range(len(users))\n    print(f\"{i}: {user}\")  # i starts at 0 by default\n\nfor i, user in enumerate(users, start=1):# human-friendly numbering\n    print(f\"{i}. {user}\")\n\nfor name, score in zip(names, scores):   # parallel iteration\n    print(name, score)  # stops when shortest runs out\n\nfor n, s in zip(names, scores, strict=True):  # 3.10+ — raises if lengths differ\n    ...  # use this when mismatch is a bug"
          },
          {
            "type": "p",
            "text": "The `strict=True` flag is the underrated one. Silent truncation when two lists drift out of sync is the kind of bug you find six months later in production."
          }
        ],
        "takeaway": "`enumerate` and `zip` replace manual index bookkeeping — stop writing `range(len(...))`."
      },
      {
        "heading": "break, continue, and the else clause",
        "body": [
          {
            "type": "p",
            "text": "**`break`** exits the nearest enclosing loop. **`continue`** skips to the next iteration. The weird one is `else` on a loop — it runs **only if the loop finished without hitting `break`**. Read it as \"no break\" and it stops being weird."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "for item in haystack:  # search pattern\n    if item == needle:\n        print(\"found\")\n        break  # short-circuit the loop\nelse:\n    print(\"not found\")  # runs only if break never fired\n\nfor line in log:\n    if line.startswith(\"#\"):\n        continue  # skip comments, keep going\n    process(line)"
          },
          {
            "type": "terms",
            "items": [
              {
                "term": "break",
                "def": "Exit the innermost loop immediately, skipping the `else` clause."
              },
              {
                "term": "continue",
                "def": "Jump straight to the next iteration without finishing the current body."
              },
              {
                "term": "else on loop",
                "def": "Runs when the loop exhausts naturally — useful for search-and-not-found patterns."
              },
              {
                "term": "pass",
                "def": "Does nothing; use it as a placeholder when syntax requires a body."
              }
            ]
          }
        ]
      },
      {
        "heading": "range is lazy — it's not a list",
        "body": [
          {
            "type": "p",
            "text": "This trips everyone who came from Python 2 or JavaScript. **`range(10**9)` does not allocate a billion integers.** It's a lazy sequence object — it remembers `start`, `stop`, `step` and computes each value on demand. That's why `range(10**18)` returns instantly."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "r = range(10**9)  # instant — no allocation\nprint(r[500])  # 500 — supports indexing\nprint(len(r))  # 1_000_000_000 — knows its length\nprint(sum(1 for _ in r))  # DON'T — actually iterates a billion times\n\nnums = list(range(10**9))  # THIS is what blows up your RAM\n\nsquares = (x*x for x in range(10**6))    # generator — nothing computed yet\ntotal = sum(squares)  # iterates lazily, never materializes a list"
          },
          {
            "type": "p",
            "text": "Same mental model applies to `map`, `filter`, and generator expressions. They're **promises**, not results. Wrapping them in `list(...)` is what forces the work."
          }
        ]
      },
      {
        "heading": "Iteration flow",
        "body": [
          {
            "type": "diagram",
            "title": "for loop control flow",
            "nodes": [
              {
                "id": "iter",
                "label": "iterable",
                "subtitle": "list / file",
                "x": 0.08,
                "y": 0.5,
                "accent": "water"
              },
              {
                "id": "next",
                "label": "next item?",
                "subtitle": "__next__()",
                "x": 0.35,
                "y": 0.5,
                "accent": "sky"
              },
              {
                "id": "body",
                "label": "loop body",
                "subtitle": "break / continue",
                "x": 0.65,
                "y": 0.3,
                "accent": "amber"
              },
              {
                "id": "else",
                "label": "else clause",
                "subtitle": "no break",
                "x": 0.92,
                "y": 0.5,
                "accent": "earth"
              },
              {
                "id": "done",
                "label": "exit",
                "subtitle": "loop finished",
                "x": 0.65,
                "y": 0.78,
                "accent": "fire"
              }
            ],
            "edges": [
              {
                "from": "iter",
                "to": "next",
                "kind": "dashed",
                "accent": "water",
                "label": "yield"
              },
              {
                "from": "next",
                "to": "body",
                "kind": "dashed",
                "accent": "sky",
                "label": "item"
              },
              {
                "from": "body",
                "to": "next",
                "kind": "dashed",
                "accent": "amber",
                "label": "continue"
              },
              {
                "from": "next",
                "to": "else",
                "kind": "dashed",
                "accent": "earth",
                "label": "exhausted"
              },
              {
                "from": "body",
                "to": "done",
                "kind": "dashed",
                "accent": "fire",
                "label": "break"
              },
              {
                "from": "else",
                "to": "done",
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
            "type": "pros-cons",
            "goodLabel": "Do this",
            "watchLabel": "Common bugs",
            "good": [
              "Use `for x in seq` — let Python handle the index.",
              "Reach for `enumerate` and `zip` instead of `range(len(...))`.",
              "Use `zip(..., strict=True)` when length mismatch is a bug.",
              "Treat `range`, `map`, generators as lazy — wrap in `list()` only when needed.",
              "Use `else` on loops for clean search-not-found logic."
            ],
            "watch": [
              "Mutating a list while iterating it — items get skipped or repeated.",
              "Modifying a dict's keys inside `for k in d:` — raises `RuntimeError`.",
              "`while True` with no break path — silent infinite loop.",
              "Off-by-one from `range(1, n)` when you meant `range(n)` — endpoint is exclusive.",
              "Assuming `zip` raises on length mismatch — it silently truncates without `strict=True`.",
              "Calling `list(big_range)` — materializes everything and OOMs the process."
            ]
          },
          {
            "type": "quote",
            "text": "If you're tracking the index by hand, you're writing C in Python."
          }
        ]
      }
    ]
  },
  "py-functions": {
    "objectives": [
      "Treat a function as a value — store it, pass it, return it",
      "Read and write any signature: positional, defaults, `*args`, `**kwargs`, keyword-only",
      "Spot and fix the mutable-default trap with a `None` sentinel"
    ],
    "sections": [
      {
        "heading": "Functions are first-class — treat them that way",
        "body": [
          {
            "type": "p",
            "text": "A Python function is just an **object** bound to a name. `def` creates it, you can pass it around, return it from another function, stuff it in a list, attach attributes to it. The body runs every call; the **signature is evaluated once** at definition time. That second sentence is the source of every subtle bug below."
          },
          {
            "type": "p",
            "text": "Write small functions with **honest signatures**. The signature is your contract — args in, value out, side effects documented. If you need a paragraph to explain what a function does, split it."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "def slope(x: float, y: float, b: float = 0.0) -> float:\n    \"\"\"Compute rise over run, shifted by b.\"\"\"   # docstring = signature truth\n    return (y - b) / x  # no hidden state\n\nf = slope  # functions are objects\nprint(f(3, 9))  # 3.0 — bound name, same callable"
          }
        ],
        "takeaway": "A function is a value — pass it around, store it, return it."
      },
      {
        "heading": "Arguments: positional, default, *args, **kwargs, keyword-only",
        "body": [
          {
            "type": "p",
            "text": "Python gives you five argument shapes. Mix them and the order is strict: **positional → *args → keyword-only → **kwargs**. The `*` alone is a marker that forces every argument after it to be passed by name."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "def train(model, *layers, lr=0.01, **opts):    # *layers grabs extra positionals\n    # model      — required positional\n    # layers     — tuple of any extra positionals (may be empty)\n    # lr         — keyword arg with default, callers may omit\n    # opts       — dict of any extra keyword args\n    print(model, layers, lr, opts)\n\ntrain(\"mlp\", 128, 64, lr=0.001, dropout=0.2)   # layers=(128,64), opts={'dropout':0.2}\n\ndef fit(x, y, *, epochs=10):  # bare * forces keyword-only after it\n    ...  # fit(X, Y, 50) raises TypeError\nfit(X, Y, epochs=50)  # caller must name it — self-documenting"
          },
          {
            "type": "table",
            "headers": [
              "Form",
              "Catches",
              "Use when"
            ],
            "rows": [
              [
                "`x`",
                "one positional (by position or name)",
                "required input"
              ],
              [
                "`x=0`",
                "one positional, defaults to 0",
                "sensible fallback exists"
              ],
              [
                "`*args`",
                "any number of extra positionals",
                "variadic — sum, max, paths"
              ],
              [
                "`*, x`",
                "one keyword-only (must name it)",
                "boolean flags, ambiguous values"
              ],
              [
                "`**kwargs`",
                "extra `name=value` keywords",
                "pass-through, config bags"
              ]
            ]
          }
        ]
      },
      {
        "heading": "The mutable default argument trap",
        "body": [
          {
            "type": "p",
            "text": "Defaults are evaluated **once, at def-time** — not on every call. If your default is a list, dict, or set, every call **shares the same object**. This is the most-failed Python interview question for a reason."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "def append_bad(x, bag=[]):  # bag is built ONCE when def runs\n    bag.append(x)  # mutates the shared list\n    return bag\n\nappend_bad(1)  # [1]\nappend_bad(2)  # [1, 2]  — surprise, state leaks across calls\nappend_bad(3)  # [1, 2, 3]\n\ndef append_ok(x, bag=None):  # sentinel pattern — None is immutable\n    if bag is None:  # rebuild fresh each call\n        bag = []\n    bag.append(x)\n    return bag\n\nappend_ok(1)  # [1]\nappend_ok(2)  # [2]  — independent, as expected"
          },
          {
            "type": "quote",
            "text": "Default values are evaluated at the point of function definition in the defining scope.",
            "cite": "Python docs — and the reason your list grew between calls"
          }
        ],
        "takeaway": "Defaults are created ONCE at def-time — never use a mutable default."
      },
      {
        "heading": "Type hints and docstrings — your contract",
        "body": [
          {
            "type": "p",
            "text": "Hints are **not enforced at runtime**. They're for readers, IDEs, and `mypy`/`pyright`. Use them on every public function — return type included. Docstrings explain *why* and *what*, not the obvious *how*."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "from typing import Iterable  # importable hint types\n\ndef mean(xs: Iterable[float]) -> float:  # accepts list, tuple, generator\n    \"\"\"Arithmetic mean of xs.\n\n    Raises ZeroDivisionError on empty input.   # document the sharp edges\n    \"\"\"\n    xs = list(xs)  # materialize once — generators are one-shot\n    return sum(xs) / len(xs)  # ∑x / n"
          },
          {
            "type": "terms",
            "items": [
              {
                "term": "Positional-only (`/`)",
                "def": "Args before `/` cannot be passed by name — locks the parameter name so you can rename it later without breaking callers."
              },
              {
                "term": "Keyword-only (`*`)",
                "def": "Args after a bare `*` must be passed by name — forces self-documenting call sites."
              },
              {
                "term": "Type hint",
                "def": "Annotation read by tools; ignored at runtime unless you opt in with `pydantic`, `beartype`, or similar."
              },
              {
                "term": "Docstring",
                "def": "The first string literal in a function body; accessible via `__doc__` and `help()` — your function's API page."
              }
            ]
          }
        ]
      },
      {
        "heading": "Lambdas — single-expression, no statements",
        "body": [
          {
            "type": "p",
            "text": "A `lambda` is a function with **one expression** and no name. Reach for it when you'd otherwise define a throwaway one-liner — sort keys, map callbacks, simple predicates. Anything bigger, use `def`."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "points = [(1, 4), (3, 1), (2, 7)]\npoints.sort(key=lambda p: p[1])  # sort by y-coord — no def needed\n\nsquare = lambda x: x*x  # legal but stylistically wrong\ndef square(x): return x*x  # prefer def — gets a __name__ for tracebacks"
          },
          {
            "type": "pros-cons",
            "goodLabel": "Reach for lambda when",
            "watchLabel": "Reach for def when",
            "good": [
              "**One expression** fits cleanly on the call site",
              "Used **once**, inline as a `key=` or `map()` callback",
              "The name would add no information"
            ],
            "watch": [
              "You need a **statement** — `if/elif`, `try`, assignment",
              "You want a **good traceback** — lambdas show as `<lambda>`",
              "The logic deserves a **docstring** or type hints",
              "It spans more than one line — readability tanks"
            ]
          }
        ],
        "deep": true
      },
      {
        "heading": "Watch out for",
        "body": [
          {
            "type": "ul",
            "items": [
              "**Mutable defaults** — `def f(x=[])` is almost never what you want. Use `None` and rebuild inside.",
              "**Late binding in closures** — `[lambda: i for i in range(3)]` all return `2`. Bind with `lambda i=i: i` to capture per-iteration.",
              "**Bare `*args, **kwargs` everywhere** — convenient for decorators, but on regular APIs it hides the real signature from callers and tooling.",
              "**Hints that lie** — `-> int` while returning `None` on error. Either raise, or annotate `-> int | None` and handle it.",
              "**Lambdas in tracebacks** — they all show as `<lambda>`. When a callback might fail, name it with `def`.",
              "**Side effects in defaults** — `def f(t=time.time())` snapshots time at def-time, not call-time. Same trap, different mask."
            ]
          },
          {
            "type": "p",
            "text": "Signature first, body second. If the signature reads cleanly out loud, the function is probably right-sized."
          }
        ]
      }
    ]
  },
  "py-dicts": {
    "objectives": [
      "Use a dict for O(1) lookups and explain the hashable-key rule",
      "Pick the right missing-key strategy: `get`, `setdefault`, or `defaultdict`",
      "Build dicts from pairs, comprehensions, and `|` merges"
    ],
    "sections": [
      {
        "heading": "Dictionaries are Python's hash table",
        "body": [
          {
            "type": "p",
            "text": "A **dict** maps **hashable keys** to arbitrary values with **O(1)** average lookup, insert, and delete. It's the workhorse data structure behind objects, namespaces, kwargs, and JSON — if you're writing Python and not reaching for a dict, you're probably writing it wrong."
          },
          {
            "type": "p",
            "text": "Since **Python 3.7**, dicts are **insertion-ordered** as a language guarantee (CPython 3.6 had it as an implementation detail). Iteration follows the order keys were first added. This killed `OrderedDict` for most use cases — you only need it now for `move_to_end` and order-sensitive equality."
          }
        ],
        "takeaway": "A dict is a hash table: O(1) lookups by hashable key."
      },
      {
        "heading": "Creating dicts",
        "body": [
          {
            "type": "p",
            "text": "Four idiomatic constructors. Pick the one that matches your input shape."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "a = {\"host\": \"db\", \"port\": 5432}  # literal — fastest, use when keys are known\nb = dict(host=\"db\", port=5432)  # kwargs form — keys must be valid identifiers\nc = dict([(\"host\", \"db\"), (\"port\", 5432)])    # from pairs — common with zip() output\nd = dict.fromkeys([\"a\", \"b\", \"c\"], 0)  # all keys share ONE value object — beware mutables\n\ne = {k: v*2 for k, v in a.items() if isinstance(v, int)}   # comprehension — filter + transform\nf = {**a, **b, \"port\": 6379}  # merge; later keys win, port=6379 here"
          }
        ]
      },
      {
        "heading": "get, setdefault, defaultdict",
        "body": [
          {
            "type": "p",
            "text": "Three ways to handle missing keys. They are **not** interchangeable — the choice affects both correctness and performance."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "counts = {}\n\ncounts[\"x\"]  # KeyError — direct access is strict\ncounts.get(\"x\")  # None — never raises\ncounts.get(\"x\", 0)  # 0 — default on miss, key NOT inserted\n\ncounts.setdefault(\"x\", []).append(1)  # inserts [] if missing, returns the list\n# {\"x\": [1]} — one lookup, mutates in place\n\nfrom collections import defaultdict\ngroups = defaultdict(list)  # factory called on missing key\ngroups[\"a\"].append(1)  # auto-creates [] then appends\ngroups[\"missing\"]  # SIDE EFFECT: creates [] just by reading"
          },
          {
            "type": "table",
            "headers": [
              "Pattern",
              "On miss",
              "When to use"
            ],
            "rows": [
              [
                "`d[k]`",
                "✗ raises KeyError",
                "key must exist — fail loud"
              ],
              [
                "`d.get(k, default)`",
                "returns default, no insert",
                "read-only check, no mutation"
              ],
              [
                "`d.setdefault(k, v)`",
                "inserts v, returns v",
                "one-off init in a hot loop"
              ],
              [
                "`defaultdict(factory)`",
                "inserts factory() **on read**",
                "many keys, uniform default"
              ]
            ]
          }
        ],
        "takeaway": "`get`, `setdefault`, and `defaultdict` are three DIFFERENT answers to a missing key."
      },
      {
        "heading": "Views, unpacking, and merge",
        "body": [
          {
            "type": "p",
            "text": "`keys()`, `values()`, `items()` return **live views**, not lists. They reflect later mutations and support set algebra on keys. Don't `list(d.keys())` reflexively — iterate the view directly."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "config = {\"host\": \"db\", \"port\": 5432, \"ssl\": True}\noverrides = {\"port\": 6379, \"pool\": 10}\n\nfor k, v in config.items():  # tuple unpack — idiomatic dict iteration\n    print(k, v)\n\nshared = config.keys() & overrides.keys()    # set intersection on key views — {\"port\"}\n\nmerged = {**config, **overrides}  # ** unpack — right side wins on conflict\nmerged = config | overrides  # 3.9+ — same semantics, clearer intent\nconfig |= overrides  # 3.9+ — in-place merge, mutates config\n\ndef connect(**kwargs):  # ** in signature collects into a dict\n    return kwargs\n\nconnect(**merged)  # ** at call site explodes dict into kwargs"
          }
        ],
        "deep": true
      },
      {
        "heading": "Method cheat sheet",
        "body": [
          {
            "type": "table",
            "headers": [
              "Mutating method",
              "Returns",
              "Notes"
            ],
            "rows": [
              [
                "`d[k] = v`",
                "—",
                "insert or overwrite"
              ],
              [
                "`d.setdefault(k, default)`",
                "value (existing or new)",
                "init-if-absent in one call"
              ],
              [
                "`d.pop(k, default)`",
                "value",
                "remove + return, default avoids KeyError"
              ],
              [
                "`d.popitem()`",
                "(k, v)",
                "removes **last inserted** — LIFO since 3.7"
              ],
              [
                "`d.update(other)`",
                "None",
                "merge; takes dict, pairs, or kwargs"
              ],
              [
                "`d.clear()`",
                "None",
                "empties in place — preserves identity"
              ]
            ]
          },
          {
            "type": "p",
            "text": "And the read-only / copy methods — these never mutate `d`:"
          },
          {
            "type": "table",
            "headers": [
              "Read / copy method",
              "Returns",
              "Notes"
            ],
            "rows": [
              [
                "`d.get(k, default)`",
                "value or default",
                "safe read"
              ],
              [
                "`d.keys()` / `.values()` / `.items()`",
                "view",
                "live, set-like for keys/items"
              ],
              [
                "`d.copy()`",
                "shallow dict",
                "nested objects still shared"
              ],
              [
                "`dict.fromkeys(iter, v)`",
                "new dict",
                "shared value — use comprehension for mutables"
              ]
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
                "term": "Unhashable keys",
                "def": "Lists, dicts, and sets can't be keys because they're mutable. Use **tuples** of immutables, or `frozenset`, when you need a composite key."
              },
              {
                "term": "Mutating during iteration",
                "def": "Adding or deleting keys mid-loop raises `RuntimeError: dictionary changed size`. Iterate over `list(d)` if you must mutate, or collect changes and apply after."
              },
              {
                "term": "fromkeys with mutables",
                "def": "`dict.fromkeys(ks, [])` shares **one list** across all keys — appending to one appends to all. Use `{k: [] for k in ks}` instead."
              },
              {
                "term": "defaultdict accidental writes",
                "def": "Reading a missing key inserts it. After a `for k in d: d[k]` style check, your dict has grown. Use `d.get()` or `k in d` for pure reads."
              },
              {
                "term": "Key equality is hash + ==",
                "def": "`1`, `1.0`, and `True` collide — they hash the same and compare equal, so `{True: \"a\", 1: \"b\"}` has **one** entry."
              }
            ]
          },
          {
            "type": "quote",
            "text": "If your code has more than three `if k in d: d[k] = ...` patterns, you wanted a defaultdict."
          }
        ]
      }
    ]
  },
  "cli-navigate": {
    "sections": [
      {
        "heading": "Where am I, and where can I go?",
        "body": [
          {
            "type": "p",
            "text": "Every shell session has a **current working directory** — the invisible context for every relative path you type. Forget where you are and `rm -rf logs` deletes the wrong logs. Get good at the three-command loop: **pwd** to anchor, **ls** to look, **cd** to move."
          },
          {
            "type": "p",
            "text": "The filesystem is a **tree** rooted at `/` (Unix) or a drive letter (Windows). You navigate it with two flavors of path: **absolute** (starts at root, always unambiguous) and **relative** (starts from where you are now, shorter but context-dependent)."
          }
        ]
      },
      {
        "heading": "The core four",
        "body": [
          {
            "type": "terms",
            "items": [
              {
                "term": "pwd",
                "def": "Prints the **working directory** as an absolute path — your you-are-here pin."
              },
              {
                "term": "cd",
                "def": "Changes directory. Bare `cd` jumps **home**; `cd -` jumps to the **previous** directory (toggle)."
              },
              {
                "term": "ls",
                "def": "Lists entries. `ls -la` shows **hidden** dotfiles and **long** format with permissions, owner, size, mtime."
              },
              {
                "term": "tree",
                "def": "Recursive visualization. `tree -L 2` caps **depth**; `tree -I 'node_modules|.git'` ignores noise."
              }
            ]
          },
          {
            "type": "p",
            "text": "`tree` isn't installed by default on macOS or stock Ubuntu — install it (`brew install tree`, `apt install tree`) or fall back to `find . -maxdepth 2`. It's worth the install."
          }
        ]
      },
      {
        "heading": "Absolute vs relative — and the shortcuts",
        "body": [
          {
            "type": "table",
            "headers": [
              "Path",
              "Resolves to",
              "When to use"
            ],
            "rows": [
              [
                "`/etc/nginx/nginx.conf`",
                "absolute — exact location",
                "scripts, configs, anything portable"
              ],
              [
                "`./config.yaml`",
                "CWD + config.yaml",
                "files next to you"
              ],
              [
                "`../sibling/`",
                "parent, then sibling",
                "monorepo hops"
              ],
              [
                "`~/projects/`",
                "`$HOME/projects/`",
                "your own files, anywhere"
              ],
              [
                "`~alice/notes`",
                "alice's home + notes",
                "multi-user boxes"
              ],
              [
                "`-` (with cd)",
                "previous directory",
                "ping-ponging between two dirs"
              ]
            ]
          },
          {
            "type": "p",
            "text": "The tilde `~` is **expanded by the shell**, not the program — that's why `\"~/file\"` inside quotes sometimes fails. `.` means **here**, `..` means **one level up**, and they chain: `../../..` is three up."
          }
        ]
      },
      {
        "heading": "A real workflow: find a bug log in a sibling service",
        "body": [
          {
            "type": "code",
            "lang": "bash",
            "text": "pwd  # /home/me/work/api — anchor before you move\ncd ~/work/api/services/auth  # ~ expands to $HOME; absolute-ish jump\nls -la  # -a reveals .env, .git; -l shows perms + size\ntree -L 2 -I 'node_modules|dist'  # depth-cap + ignore noise = readable output\ncd ../billing  # sibling service via parent — no retyping ~/work/api/services\ngrep -r 'NullPointer' ./logs  # ./ makes the relative scope explicit\ncd -  # toggle back to auth/ — faster than retyping\npwd  # confirm you actually landed where you think"
          },
          {
            "type": "p",
            "text": "Two habits worth burning in: **anchor with `pwd`** before any destructive command, and prefer **`./name`** over bare `name` when invoking scripts — it documents intent and dodges `$PATH` surprises."
          }
        ]
      },
      {
        "heading": "Mental model of the lookup",
        "body": [
          {
            "type": "walkthrough",
            "title": "How the shell resolves a path",
            "why": "The filesystem only speaks **absolute** — the shell does all the prep so the kernel never sees a `~`, a `.`, or a relative path.",
            "nodes": [
              {
                "id": "in",
                "label": "you type path",
                "subtitle": "`../app.log`",
                "x": 0.08,
                "y": 0.5,
                "accent": "water"
              },
              {
                "id": "tilde",
                "label": "tilde expand",
                "subtitle": "~ → $HOME",
                "x": 0.32,
                "y": 0.25,
                "accent": "sky"
              },
              {
                "id": "cwd",
                "label": "prepend CWD",
                "subtitle": "if relative",
                "x": 0.32,
                "y": 0.75,
                "accent": "sky"
              },
              {
                "id": "norm",
                "label": "normalize",
                "subtitle": "collapse `.`",
                "x": 0.62,
                "y": 0.5,
                "accent": "amber"
              },
              {
                "id": "fs",
                "label": "filesystem",
                "subtitle": "inode lookup",
                "x": 0.9,
                "y": 0.5,
                "accent": "fire"
              }
            ],
            "steps": [
              {
                "title": "You type a path",
                "description": "It starts as raw text — here `../app.log`. The shell treats this as a recipe, not a location, and rewrites it before anyone touches disk.",
                "activeNodes": [
                  "in"
                ],
                "activeEdges": []
              },
              {
                "title": "Tilde expansion",
                "description": "Any leading `~` is swapped for `$HOME` first. So `~/notes` becomes `/home/you/notes` — a plain `~` never reaches the filesystem.",
                "activeNodes": [
                  "in",
                  "tilde"
                ],
                "activeEdges": [
                  {
                    "from": "in",
                    "to": "tilde",
                    "label": "~ ?"
                  }
                ]
              },
              {
                "title": "Prepend the CWD",
                "description": "If the path is **relative** (no leading `/`), the shell glues your current working directory onto the front. `../app.log` from `/srv/web` becomes `/srv/web/../app.log`.",
                "activeNodes": [
                  "in",
                  "cwd"
                ],
                "activeEdges": [
                  {
                    "from": "in",
                    "to": "cwd",
                    "label": "relative?"
                  }
                ]
              },
              {
                "title": "Normalize",
                "description": "Now the `.` and `..` segments get collapsed. `/srv/web/../app.log` flattens to `/srv/app.log` — one clean, unambiguous absolute path.",
                "activeNodes": [
                  "tilde",
                  "cwd",
                  "norm"
                ],
                "activeEdges": [
                  {
                    "from": "tilde",
                    "to": "norm"
                  },
                  {
                    "from": "cwd",
                    "to": "norm"
                  }
                ]
              },
              {
                "title": "Hand it to the filesystem",
                "description": "Only the finished absolute path crosses into the kernel, which walks it to an **inode**. The filesystem does zero guessing — all the work already happened in the shell.",
                "activeNodes": [
                  "norm",
                  "fs"
                ],
                "activeEdges": [
                  {
                    "from": "norm",
                    "to": "fs",
                    "label": "absolute path"
                  }
                ]
              }
            ]
          },
          {
            "type": "p",
            "text": "Every relative path becomes an absolute path **before** it hits the kernel. The shell does the prep work; the filesystem only speaks absolute."
          }
        ]
      },
      {
        "heading": "Watch out for",
        "body": [
          {
            "type": "ul",
            "items": [
              "**Spaces in names** — `cd My Documents` tries to cd into `My`. Quote it or escape: `cd \"My Documents\"` or `cd My\\ Documents`.",
              "**Symlinks lie about parents** — `cd ..` from a symlinked directory may land somewhere surprising. Use `cd -P ..` to resolve **physical** parents.",
              "**Trailing slash matters** for `cp` and `rsync` — `src/` copies *contents*, `src` copies *the directory itself*. Different operation entirely.",
              "**Hidden files vanish** — `ls` skips dotfiles by default. `.env`, `.git`, `.DS_Store` are invisible until `-a`. Wildcards also skip them: `*` won't match `.env`.",
              "**`cd` is shell-local** — it changes only the current shell. Subshells, scripts, and `&&` chains restore the parent's CWD on exit."
            ]
          },
          {
            "type": "quote",
            "text": "When in doubt, `pwd`. The two seconds you spend confirming where you are will save you from the ten minutes of git-reflog archaeology when you didn't."
          }
        ]
      }
    ]
  },
  "cli-files": {
    "sections": [
      {
        "heading": "Files are how Unix talks to itself",
        "body": [
          {
            "type": "p",
            "text": "Everything on a Unix box is a file — your code, your logs, your config, even devices like `/dev/null` and sockets. Learn six commands well and you can navigate any server you SSH into for the next twenty years."
          },
          {
            "type": "p",
            "text": "The trick is that these commands **compose**. `ls` lists names, `cat` dumps bytes, `head` slices — pipe them together and you've built a tiny query engine without installing a thing."
          }
        ]
      },
      {
        "heading": "The core eight",
        "body": [
          {
            "type": "p",
            "text": "Memorize this table. You will type these commands more than your own name."
          },
          {
            "type": "table",
            "headers": [
              "Command",
              "What it does",
              "When you reach for it"
            ],
            "rows": [
              [
                "`ls -lah`",
                "List files with sizes, perms, hidden",
                "First thing you run in any new directory"
              ],
              [
                "`cat file`",
                "Dump entire file to stdout",
                "Small configs, piping into other tools"
              ],
              [
                "`head -n 20`",
                "First N lines (default 10)",
                "Peek at a huge CSV without loading it"
              ],
              [
                "`tail -f log`",
                "Last lines, follow new writes",
                "Watching a service log in real time"
              ],
              [
                "`cp src dst`",
                "Copy file or tree (with `-r`)",
                "Backups before editing something risky"
              ],
              [
                "`mv src dst`",
                "Rename or move",
                "Atomic on the same filesystem — safe"
              ],
              [
                "`rm file`",
                "Delete. No trash. No undo.",
                "When you're sure. Then check again."
              ],
              [
                "`touch file`",
                "Create empty file or bump mtime",
                "Stub a file, retrigger a `make` rule"
              ]
            ]
          }
        ]
      },
      {
        "heading": "How a pipeline flows",
        "body": [
          {
            "type": "p",
            "text": "Each command reads stdin, writes stdout. The shell wires them end-to-end so no intermediate file ever hits disk."
          },
          {
            "type": "diagram",
            "title": "find | grep | wc",
            "nodes": [
              {
                "id": "fs",
                "label": "Filesystem",
                "subtitle": "./logs/*.log",
                "x": 0.08,
                "y": 0.5,
                "accent": "earth"
              },
              {
                "id": "find",
                "label": "find",
                "subtitle": "emits paths",
                "x": 0.32,
                "y": 0.5,
                "accent": "sky"
              },
              {
                "id": "grep",
                "label": "grep ERROR",
                "subtitle": "filters lines",
                "x": 0.58,
                "y": 0.85,
                "accent": "sky"
              },
              {
                "id": "wc",
                "label": "wc -l",
                "subtitle": "counts",
                "x": 0.82,
                "y": 0.85,
                "accent": "amber"
              }
            ],
            "edges": [
              {
                "from": "fs",
                "to": "find",
                "kind": "solid"
              },
              {
                "from": "find",
                "to": "grep",
                "kind": "dashed",
                "label": "stdout"
              },
              {
                "from": "grep",
                "to": "wc",
                "kind": "dashed",
                "label": "stdout"
              }
            ]
          }
        ]
      },
      {
        "heading": "A real loop: process every .log",
        "body": [
          {
            "type": "p",
            "text": "Say you've got a directory of nginx logs and you want a count of 5xx responses per file. This pattern shows up constantly in incident triage."
          },
          {
            "type": "code",
            "lang": "bash",
            "text": "#!/usr/bin/env bash\nset -euo pipefail  # die on error, unset var, or pipe failure\n\nfor log in /var/log/nginx/*.log; do  # glob expands BEFORE the loop runs\n  [[ -f \"$log\" ]] || continue  # skip if glob matched nothing literally\n  count=$(grep -c ' 5[0-9][0-9] ' \"$log\")  # -c prints match count, not lines\n  printf '%-40s %6d\\n' \"$(basename \"$log\")\" \"$count\"   # aligned columns\ndone | sort -k2 -nr | head  # worst offenders first, top 10\n"
          },
          {
            "type": "p",
            "text": "Two subtleties worth internalizing. `set -euo pipefail` turns silent failures loud — without it, a typo'd path just produces zero matches and you ship a bad report. Quoting `\"$log\"` matters the moment a filename contains a space; unquoted, the shell splits it into two arguments and `grep` complains about a missing file."
          },
          {
            "type": "build-along",
            "title": "Poke around a filesystem, command by command",
            "goal": "The core navigation loop — know where you are, see what's there, move, and read a file — that you'll run in every unfamiliar directory for the rest of your career. Click through, then run it for real in your terminal.",
            "lang": "bash",
            "file": "terminal",
            "steps": [
              {
                "title": "Find out where you are",
                "say": "pwd prints your working directory — the anchor every relative path resolves against. When a command says 'no such file', this is the first thing to check.",
                "add": "pwd"
              },
              {
                "title": "List everything, hidden files included",
                "say": "-l is the long view (permissions, owner, size, mtime); -a adds dotfiles like .gitignore that a bare ls silently hides.",
                "add": "ls -la"
              },
              {
                "title": "Step into a directory",
                "say": "cd moves your working directory, so relative paths now resolve from inside src. No output on success — in the shell, silence means it worked.",
                "add": "cd src"
              },
              {
                "title": "Look around the new spot",
                "say": "Same command, different answer: ls lists wherever you're standing, so what it shows changes every time you cd.",
                "add": "ls"
              },
              {
                "title": "Read a file without an editor",
                "say": "cat dumps a file's contents straight to the terminal — swap in any name from the listing. Fastest way to peek at a config or a README.",
                "add": "cat README.md"
              }
            ]
          }
        ]
      },
      {
        "heading": "Watch out for rm -rf",
        "body": [
          {
            "type": "p",
            "text": "`rm -rf` is the command that ends careers. There is no recycle bin, no confirmation, no journal you can rewind. It does exactly what you typed — including when what you typed had a trailing space or an unset variable."
          },
          {
            "type": "pros-cons",
            "goodLabel": "Use it when",
            "watchLabel": "Never do this",
            "good": [
              "Cleaning a build directory you own: `rm -rf ./dist`",
              "Tearing down a scratch container's working dir",
              "Removing a known temp tree with an absolute, hard-coded path"
            ],
            "watch": [
              "`rm -rf $VAR/` when `$VAR` might be empty — that's `rm -rf /`",
              "Running it as root without re-reading the line first",
              "Globbing in `/` or `$HOME` with a wildcard you didn't double-check",
              "Aliasing `rm` to `rm -i` then forgetting on a server where the alias doesn't exist"
            ]
          },
          {
            "type": "p",
            "text": "**Key insight:** when you're about to delete recursively, run the same command with `ls` or `echo` first. If `ls -la $VAR/` shows the right tree, then — and only then — swap in `rm -rf`."
          }
        ]
      }
    ]
  },
  "git-first-commit": {
    "sections": [
      {
        "heading": "What git actually is",
        "body": [
          {
            "type": "p",
            "text": "**Git is a content-addressable database** that snapshots your project on demand. You decide what goes in, when, and with what message. Forget \"version control\" for a second — it's a *graph of immutable snapshots* you build by hand."
          },
          {
            "type": "p",
            "text": "Every commit you make is a node. Every node points back to its parent. That chain is your project's history — and the only thing standing between you and a 3 AM panic when something breaks."
          }
        ]
      },
      {
        "heading": "The three places your code lives",
        "body": [
          {
            "type": "p",
            "text": "Git has **three zones**. Files move through them in one direction. Understanding this picture is 80% of git."
          },
          {
            "type": "diagram",
            "title": "Working tree → staging → repository",
            "nodes": [
              {
                "id": "wt",
                "label": "Working tree",
                "subtitle": "files you edit",
                "x": 0.1,
                "y": 0.1,
                "accent": "water"
              },
              {
                "id": "idx",
                "label": "Staging (index)",
                "subtitle": "next commit",
                "x": 0.5,
                "y": 0.5,
                "accent": "amber"
              },
              {
                "id": "repo",
                "label": "Repository (.git)",
                "subtitle": "commit graph",
                "x": 0.9,
                "y": 0.9,
                "accent": "fire"
              }
            ],
            "edges": [
              {
                "from": "wt",
                "to": "idx",
                "label": "git add",
                "kind": "dashed",
                "accent": "sky"
              },
              {
                "from": "idx",
                "to": "repo",
                "label": "git commit",
                "kind": "dashed",
                "accent": "sky"
              },
              {
                "from": "repo",
                "to": "wt",
                "label": "git checkout",
                "kind": "arc",
                "curve": 0.4,
                "accent": "earth"
              }
            ]
          },
          {
            "type": "p",
            "text": "The **working tree** is just your folder. The **index** is a draft of what your next commit will look like — staging exists so you can commit *part* of your changes. The **repository** is the permanent graph hidden in `.git/`."
          }
        ]
      },
      {
        "heading": "Your first five commands",
        "body": [
          {
            "type": "p",
            "text": "Make an empty folder, then walk through this exactly. Every line matters."
          },
          {
            "type": "code",
            "lang": "bash",
            "text": "mkdir todo-app && cd todo-app  # fresh directory, nothing tracked yet\ngit init  # creates .git/ — repo now exists, zero commits\n\necho \"# Todo App\" > README.md  # one real file to track\ngit status  # shows README.md as 'untracked' in red\n\ngit add README.md  # copies the blob into the index (staged)\ngit status  # now 'Changes to be committed' in green\n\ngit commit -m \"initial commit\"  # writes the commit object, parent = none\ngit log  # one entry: SHA, author, date, message\n\necho \"- buy milk\" >> README.md  # working tree diverges from index again\ngit status  # 'modified' — staged copy is stale\ngit add README.md  # restage the new version\ngit commit -m \"add first todo item\"    # second commit, parent points to first\ngit log --oneline  # compact view: two SHAs, two messages"
          },
          {
            "type": "p",
            "text": "Notice the **rhythm**: edit → `add` → `commit`. Then `status` and `log` whenever you're confused. You will be confused often at first. That's fine."
          }
        ]
      },
      {
        "heading": "The five verbs, decoded",
        "body": [
          {
            "type": "terms",
            "items": [
              {
                "term": "init",
                "def": "Creates the `.git/` directory. One-time per project. Idempotent but rarely re-run."
              },
              {
                "term": "status",
                "def": "Reports the diff between working tree, index, and HEAD. Run it constantly — it's free."
              },
              {
                "term": "add",
                "def": "Copies a snapshot of the file *as it is right now* into the index. Edit again and you must re-add."
              },
              {
                "term": "commit -m",
                "def": "Freezes the index into a permanent object with your message. `-m` skips the editor prompt."
              },
              {
                "term": "log",
                "def": "Walks the parent chain backwards from HEAD. Add `--oneline` for sanity, `--graph` for branches."
              }
            ]
          }
        ]
      },
      {
        "heading": "The staging area is not optional cruft",
        "body": [
          {
            "type": "p",
            "text": "Beginners ask: why two steps? Why not just `commit`? Because **commits should tell a story**, and the index is your editing room."
          },
          {
            "type": "pros-cons",
            "goodLabel": "Why staging helps",
            "watchLabel": "Where it bites",
            "good": [
              "Commit only the bug fix, leave the unrelated typo for next commit",
              "Review your diff one last time with `git diff --staged` before sealing it",
              "`git add -p` lets you stage individual hunks within a file"
            ],
            "watch": [
              "Edit after `add` and the staged copy is stale — easy to commit the wrong version",
              "`git diff` shows working tree vs index; `git diff --staged` shows index vs HEAD. Mix them up and you'll panic"
            ]
          }
        ]
      },
      {
        "heading": "Watch out for",
        "body": [
          {
            "type": "table",
            "headers": [
              "Mistake",
              "What happens",
              "Fix"
            ],
            "rows": [
              [
                "`git add .` blindly",
                "Stages secrets, build artifacts, IDE junk",
                "Write `.gitignore` first, then add explicit paths"
              ],
              [
                "Commit message \"wip\" or \".\"",
                "Future-you can't grep history for anything useful",
                "One imperative line: \"add login form\""
              ],
              [
                "Editing after `add`, then committing",
                "Commit captures the *old* staged version",
                "Re-run `git add` or use `git commit -a`"
              ],
              [
                "`git init` inside another git repo",
                "Nested repos confuse every tool",
                "Check `git status` before initializing"
              ]
            ]
          },
          {
            "type": "quote",
            "text": "If `git status` is clean and `git log` shows your commit, the work is safe. Everything else is recoverable.",
            "cite": "the only mantra you need this week"
          }
        ]
      }
    ]
  },
  "git-remote-basics": {
    "sections": [
      {
        "heading": "Local is not enough",
        "body": [
          {
            "type": "p",
            "text": "Your commits live in `.git/` on one laptop. Spill coffee, lose history. **A remote** is just another Git repo Git knows how to talk to — usually on GitHub, GitLab, or a server you control. **Pushing** copies your local commits there; **pulling** copies new ones back."
          },
          {
            "type": "p",
            "text": "The default remote is named **`origin`**. It is a *nickname* for a URL, nothing magical. You can have many remotes (`origin`, `upstream`, `fork`) and they all work the same way."
          }
        ]
      },
      {
        "heading": "Wiring a fresh repo to GitHub",
        "body": [
          {
            "type": "p",
            "text": "Create the repo on GitHub **empty** — no README, no .gitignore. An empty target means no merge conflict on first push."
          },
          {
            "type": "code",
            "lang": "bash",
            "text": "git init  # creates .git/ in current folder\ngit add .  # stages every tracked-eligible file\ngit commit -m \"initial commit\"  # first commit, parent = none\ngit branch -M main  # rename current branch to main\ngit remote add origin git@github.com:you/repo.git # bind nickname 'origin' to that URL\ngit push -u origin main  # -u sets upstream, future 'git push' just works"
          },
          {
            "type": "p",
            "text": "The `-u` flag is the part everyone forgets. It writes **`branch.main.remote = origin`** into `.git/config` so `git push` and `git pull` with no arguments know where to go. Skip it once and you will type `git push origin main` forever."
          }
        ]
      },
      {
        "heading": "How the two repos talk",
        "body": [
          {
            "type": "diagram",
            "title": "local repo and origin",
            "nodes": [
              {
                "id": "wd",
                "label": "working dir",
                "subtitle": "files you edit",
                "x": 0.3,
                "y": 0.25,
                "accent": "water"
              },
              {
                "id": "idx",
                "label": "index",
                "subtitle": "staging area",
                "x": 0.7,
                "y": 0.25,
                "accent": "amber"
              },
              {
                "id": "loc",
                "label": "local .git",
                "subtitle": "main+origin",
                "x": 0.3,
                "y": 0.75,
                "accent": "sky"
              },
              {
                "id": "rem",
                "label": "origin",
                "subtitle": "GitHub repo",
                "x": 0.7,
                "y": 0.75,
                "accent": "fire"
              }
            ],
            "edges": [
              {
                "from": "wd",
                "to": "idx",
                "label": "git add",
                "kind": "dashed",
                "accent": "water"
              },
              {
                "from": "idx",
                "to": "loc",
                "label": "git commit",
                "kind": "dashed",
                "accent": "amber"
              },
              {
                "from": "loc",
                "to": "rem",
                "label": "git push",
                "kind": "dashed",
                "accent": "sky"
              },
              {
                "from": "rem",
                "to": "loc",
                "label": "git fetch",
                "kind": "dashed",
                "accent": "fire"
              },
              {
                "from": "loc",
                "to": "wd",
                "label": "git merge",
                "kind": "solid",
                "accent": "sky"
              }
            ]
          },
          {
            "type": "p",
            "text": "Notice the local `.git` holds **two** branch pointers: `main` (yours) and `origin/main` (your snapshot of theirs). `origin/main` only moves when you `fetch` or `push` — it is a cache, not a live mirror."
          }
        ]
      },
      {
        "heading": "fetch vs pull — the one that bites everyone",
        "body": [
          {
            "type": "table",
            "headers": [
              "command",
              "touches origin/main",
              "touches main + working dir"
            ],
            "align": [
              "left",
              "center",
              "center"
            ],
            "rows": [
              [
                "`git fetch`",
                "✓",
                "✗"
              ],
              [
                "`git merge origin/main`",
                "✗",
                "✓"
              ],
              [
                "`git pull`",
                "✓",
                "✓"
              ],
              [
                "`git pull --rebase`",
                "✓",
                "✓ (rewritten)"
              ],
              [
                "`git push`",
                "✓ (updates remote)",
                "✗"
              ]
            ]
          },
          {
            "type": "p",
            "text": "**`pull` = `fetch` + `merge`**. That is the whole secret. Pull when you trust the merge to be clean; fetch first when you want to *look* before you leap (`git log main..origin/main` shows what is incoming)."
          },
          {
            "type": "p",
            "text": "**`origin/main`** is a **remote-tracking branch** — read-only, updated only by network ops. **`main`** is your local branch, the one commits attach to. They diverge whenever you commit without pushing, or someone else pushes without you pulling."
          }
        ]
      },
      {
        "heading": "Vocabulary that prevents confusion",
        "body": [
          {
            "type": "terms",
            "items": [
              {
                "term": "remote",
                "def": "A named URL pointing at another Git repo — `origin` is just the conventional default name."
              },
              {
                "term": "upstream",
                "def": "The specific remote branch your local branch tracks; set with `-u` or `--set-upstream-to`."
              },
              {
                "term": "origin/main",
                "def": "Your local cached pointer to what `main` looked like on `origin` the last time you fetched."
              },
              {
                "term": "fast-forward",
                "def": "A push or pull that only moves a branch pointer forward in a straight line — no merge commit needed."
              },
              {
                "term": "non-fast-forward",
                "def": "Your push would erase remote commits; Git rejects it until you pull or rebase."
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
            "goodLabel": "Habits that scale",
            "watchLabel": "Mistakes that hurt",
            "good": [
              "Always `git push -u origin <branch>` the first time — sets upstream once, forever",
              "`git fetch` before standup so `git log main..origin/main` shows what shipped overnight",
              "Prefer `git pull --rebase` on feature branches to keep history linear",
              "Create the GitHub repo **empty** so the first push is a clean fast-forward"
            ],
            "watch": [
              "`git push --force` on shared branches — rewrites history others already pulled, use `--force-with-lease` instead",
              "Committing to `main` locally while behind `origin/main` — next push is rejected as non-fast-forward",
              "Adding a remote with the **HTTPS** URL when your SSH key is set up (or vice versa) — auth fails mysteriously",
              "Confusing `origin main` (two args) with `origin/main` (one ref) — the slash matters"
            ]
          },
          {
            "type": "quote",
            "text": "origin/main is a photograph. main is the live camera. fetch develops a new photo; push mails your camera roll.",
            "cite": "git mental model"
          }
        ]
      }
    ]
  },
  "py-oop": {
    "sections": [
      {
        "heading": "Why classes exist",
        "body": [
          {
            "type": "p",
            "text": "A **class** is a blueprint. An **instance** is one thing built from that blueprint. You reach for classes when you have *state* and *behavior* that travel together — a `User` with an email and a `send_welcome()` method, a `Car` with fuel and a `drive()` method."
          },
          {
            "type": "p",
            "text": "If you're just transforming data with no hidden state, a function is usually clearer. OOP earns its keep when objects have **identity** that persists across calls."
          }
        ]
      },
      {
        "heading": "Anatomy of a class",
        "body": [
          {
            "type": "code",
            "lang": "python",
            "text": "class Vehicle:  # blueprint — no instance exists yet\n    wheels = 4  # class attribute — shared by all instances\n\n    def __init__(self, make, fuel):  # constructor — runs on Vehicle(...)\n        self.make = make  # self.x = instance attribute, unique per object\n        self.fuel = fuel  # stored on this instance only\n\n    def drive(self, km):  # method — self is the instance, auto-passed\n        self.fuel -= km * 0.08  # mutates state on THIS instance\n        return self.fuel  # other Vehicles untouched\n\nv = Vehicle('Toyota', 40)  # __init__ fires, v is an instance\nv.drive(100)  # → 32.0, v.fuel is now mutated"
          },
          {
            "type": "p",
            "text": "**`self` is not magic** — it's the instance, passed as the first arg by the dot. `v.drive(100)` is sugar for `Vehicle.drive(v, 100)`. That's the whole trick."
          }
        ]
      },
      {
        "heading": "Inheritance with super()",
        "body": [
          {
            "type": "code",
            "lang": "python",
            "text": "class Car(Vehicle):  # Car IS-A Vehicle — inherits attrs + methods\n    def __init__(self, make, fuel, trunk_l):\n        super().__init__(make, fuel)    # delegate to parent — don't re-implement\n        self.trunk_l = trunk_l  # Car-specific state added on top\n\n    def drive(self, km):  # override — same name, new behavior\n        consumed = super().drive(km)    # reuse parent logic, then extend\n        print(f'{self.make}: {consumed}L left')\n        return consumed  # subclass can wrap, not just replace\n\nc = Car('Honda', 50, 400)\nc.drive(50)  # uses Car.drive → calls Vehicle.drive\nprint(c.wheels)  # 4 — inherited class attribute"
          },
          {
            "type": "p",
            "text": "Use `super()` instead of naming the parent directly (`Vehicle.__init__(...)`). It's the only sane choice once multiple inheritance enters the room, and it costs nothing now."
          }
        ]
      },
      {
        "heading": "The vocabulary",
        "body": [
          {
            "type": "terms",
            "items": [
              {
                "term": "class",
                "def": "A blueprint defining the attributes and methods that its instances will share."
              },
              {
                "term": "instance",
                "def": "A concrete object built from a class — has its own state, lives in memory."
              },
              {
                "term": "method",
                "def": "A function defined inside a class; its first parameter is always the instance."
              },
              {
                "term": "self",
                "def": "The conventional name for the current instance, passed automatically when you call `obj.method()`."
              },
              {
                "term": "inheritance",
                "def": "Letting a subclass reuse and extend a parent class — Car gets everything Vehicle has, plus more."
              }
            ]
          }
        ]
      },
      {
        "heading": "OOP or just functions?",
        "body": [
          {
            "type": "pros-cons",
            "goodLabel": "Reach for a class when",
            "watchLabel": "Skip the class when",
            "good": [
              "State and behavior belong together (a `Connection` with `query()`).",
              "You have multiple instances with independent state (each `User` is its own thing).",
              "You want polymorphism — swap a `MockDB` for `PostgresDB` behind the same interface.",
              "The thing has a meaningful lifecycle (open, use, close)."
            ],
            "watch": [
              "It's a one-shot data transformation — just write `clean(data)`.",
              "You'd have a class with one method and a constructor — that's a function with extra steps.",
              "The state is global config — a module-level constant is honest about it.",
              "You're inheriting 4 levels deep to share two lines — composition beats inheritance."
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
              "**Mutable class attributes bite.** `items = []` at class level is shared across every instance — they all push into the same list. Initialize mutables inside `__init__`.",
              "**Forgetting `self`** gives `TypeError: takes 1 positional argument but 2 were given` — Python passed the instance and your signature didn't expect it.",
              "**Inheritance is a strong claim.** `Car(Vehicle)` says *a Car IS a Vehicle, always, everywhere*. If that's not true in every method, use composition: `self.engine = Engine()`.",
              "**`super().__init__()` is not automatic.** If your subclass defines `__init__` and forgets to call super, the parent's attributes never get set — `self.fuel` will raise `AttributeError`."
            ]
          }
        ]
      }
    ]
  },
  "py-exceptions": {
    "sections": [
      {
        "heading": "Errors are values, not vibes",
        "body": [
          {
            "type": "p",
            "text": "Exceptions are Python's way of saying *this path is dead, unwind the stack until someone handles it*. They are not goto, not flow control for happy paths, and not a substitute for return values. You raise them when a function cannot fulfill its contract — file missing, key absent, network gone, invariant violated."
          },
          {
            "type": "p",
            "text": "The whole machinery is four keywords: **try**, **except**, **else**, **finally**, plus **raise**. Master those and you cover 95% of real code. The other 5% is knowing *which* exception to catch and *when* to let it fly."
          }
        ]
      },
      {
        "heading": "The full shape of try",
        "body": [
          {
            "type": "p",
            "text": "Most people write `try/except` and stop. The full form has four clauses and each does a distinct job."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "try:\n    conn = open_db(url)  # may raise ConnectionError\n    row = conn.fetch(user_id)  # may raise KeyError\nexcept ConnectionError as e:  # narrow — only network issues\n    log.warning(\"db down: %s\", e)    # handle, do not swallow silently\n    raise  # re-raise — caller decides next\nexcept KeyError:  # narrow — only missing user\n    row = DEFAULT_USER  # graceful fallback\nelse:  # ran only if NO exception fired\n    audit.log_success(user_id)  # keep this OUT of try block\nfinally:\n    conn.close()  # always runs — even on raise/return"
          },
          {
            "type": "p",
            "text": "The **else** clause is the underused one. Code that depends on the try succeeding goes there, *not* at the bottom of the `try` block — otherwise you accidentally catch exceptions from the success path too. The **finally** clause runs on success, on exception, on `return`, on `break`. Use it for cleanup that must happen."
          }
        ]
      },
      {
        "heading": "EAFP beats LBYL",
        "body": [
          {
            "type": "p",
            "text": "Two philosophies. **LBYL** = *Look Before You Leap*: check first, then act. **EAFP** = *Easier to Ask Forgiveness than Permission*: just do it, catch if it fails. Python prefers EAFP — it's faster on the happy path and immune to TOCTOU races."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "# LBYL — racy, two dict lookups, verbose\nif \"name\" in user and user[\"name\"] is not None:   # check 1\n    name = user[\"name\"]  # check 2 (lookup again)\nelse:\n    name = \"anon\"\n\n# EAFP — one lookup, atomic, idiomatic\ntry:\n    name = user[\"name\"] or \"anon\"   # single access, KeyError caught\nexcept KeyError:\n    name = \"anon\"  # missing key path"
          },
          {
            "type": "p",
            "text": "LBYL is right when the check is **cheap and the failure is expensive** — e.g., validating a config before spinning up workers. EAFP is right when failure is **rare or the check duplicates the work** — dict access, file open, attribute lookup."
          }
        ]
      },
      {
        "heading": "Raising and chaining",
        "body": [
          {
            "type": "p",
            "text": "When you catch one exception and raise another, **preserve the cause**. Python does this automatically with `raise X from Y`, which sets `__cause__` so tracebacks show both."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "class UserNotFound(LookupError):  # subclass a stdlib base — not Exception\n    pass  # marker class is fine, no body needed\n\ndef get_user(uid: int) -> User:\n    try:\n        return db.fetch(uid)  # raises KeyError on miss\n    except KeyError as e:\n        raise UserNotFound(uid) from e   # chain — keeps original in traceback\n\n# Suppress the chain only when truly unrelated:\nraise ConfigError(\"bad yaml\") from None   # explicit — hides __context__"
          },
          {
            "type": "p",
            "text": "Custom exceptions should subclass the **closest stdlib base** — `LookupError`, `ValueError`, `OSError` — not bare `Exception`. That way `except LookupError` still catches yours, and callers get sensible defaults."
          }
        ]
      },
      {
        "heading": "Built-in hierarchy",
        "body": [
          {
            "type": "terms",
            "items": [
              {
                "term": "BaseException",
                "def": "Root of everything. Do NOT catch this — it includes `KeyboardInterrupt` and `SystemExit`, which should propagate."
              },
              {
                "term": "Exception",
                "def": "Root of all *normal* errors. The widest you should ever catch, and only at process boundaries."
              },
              {
                "term": "ValueError",
                "def": "Right type, wrong value — `int(\"abc\")`, negative sqrt, out-of-range enum."
              },
              {
                "term": "TypeError",
                "def": "Wrong type entirely — passing `None` where a list is required, calling a non-callable."
              },
              {
                "term": "KeyError / IndexError",
                "def": "Missing dict key or out-of-bounds sequence index. Both subclass `LookupError`."
              },
              {
                "term": "OSError",
                "def": "I/O and OS failures — `FileNotFoundError`, `PermissionError`, `ConnectionError` are all subclasses."
              },
              {
                "term": "RuntimeError",
                "def": "Catch-all for *this should not happen* — use sparingly, prefer a specific subclass."
              }
            ]
          }
        ]
      },
      {
        "heading": "Watch out for",
        "body": [
          {
            "type": "table",
            "headers": [
              "Pattern",
              "OK?",
              "Why"
            ],
            "rows": [
              [
                "`except:` bare",
                "✗",
                "Catches `KeyboardInterrupt`, `SystemExit`, `MemoryError` — you'll wedge Ctrl-C"
              ],
              [
                "`except Exception: pass`",
                "✗",
                "Silent swallow — bugs vanish, debugging dies"
              ],
              [
                "`except Exception as e: log(e); raise`",
                "✓",
                "Log-and-reraise at boundaries is fine"
              ],
              [
                "`except (KeyError, IndexError):`",
                "✓",
                "Tuple of specific types — clear intent"
              ],
              [
                "`raise ValueError(...) from e`",
                "✓",
                "Chains cause, preserves traceback"
              ],
              [
                "`finally: return x`",
                "✗",
                "Swallows in-flight exceptions silently"
              ]
            ]
          },
          {
            "type": "p",
            "text": "The cardinal sin is **the bare except that swallows**. If you must catch broadly — top-level request handler, background worker loop — at minimum log the traceback and *keep going*, don't pretend nothing happened. And never `return` from `finally`: it discards any exception the `try` was about to raise."
          },
          {
            "type": "quote",
            "text": "Catch the narrowest exception you can name, at the highest layer that can do something useful about it."
          }
        ]
      }
    ]
  },
  "py-fileio": {
    "sections": [
      {
        "heading": "Read a file",
        "body": [
          {
            "type": "p",
            "text": "Always use `with` — it auto-closes the file even on exceptions. Reading happens in three common shapes: whole-file string, line-by-line iterator, or fixed-size chunks for large files."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "# whole file as one string\nwith open('notes.txt') as f:\n    text = f.read()\n\n# line by line — best for large files, doesn't load everything\nwith open('notes.txt') as f:\n    for line in f:\n        print(line.rstrip())  # rstrip drops the trailing \\n\n\n# all lines as a list\nwith open('notes.txt') as f:\n    lines = f.readlines()"
          },
          {
            "type": "p",
            "text": "**Modes** are passed as the second argument: `'r'` read (default), `'rb'` read binary, `'w'` write (truncates!), `'a'` append, `'x'` create-or-fail. Add `'b'` for binary, leave it off for text decoded as UTF-8."
          }
        ]
      },
      {
        "heading": "Write a file",
        "body": [
          {
            "type": "p",
            "text": "Writing follows the same `with` pattern. **`'w'` truncates the file to zero bytes the moment you open it** — even if you never call `write()`. Use `'a'` to append, or `'x'` to refuse if the file already exists."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "# overwrite (or create) — note: 'w' wipes the file immediately\nwith open('out.txt', 'w') as f:\n    f.write('hello\\n')\n    f.write('world\\n')\n\n# append — adds to the end, never destroys\nwith open('log.txt', 'a') as f:\n    f.write('event happened\\n')\n\n# write a list of lines\nlines = ['first\\n', 'second\\n']\nwith open('out.txt', 'w') as f:\n    f.writelines(lines)  # no automatic newlines, you provide them"
          },
          {
            "type": "p",
            "text": "For atomic writes — so a crashed process can't leave a half-written file — write to `out.txt.tmp` and then `os.replace('out.txt.tmp', 'out.txt')`. The rename is atomic on POSIX and on Windows since 3.3."
          }
        ]
      },
      {
        "heading": "JSON files",
        "body": [
          {
            "type": "p",
            "text": "The `json` module is the workhorse for config files, API payloads, and small datastores. Use `dump`/`load` with a file object, or `dumps`/`loads` with a string."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "import json\n\n# write\nconfig = {'host': 'localhost', 'port': 5432, 'retries': 3}\nwith open('config.json', 'w') as f:\n    json.dump(config, f, indent=2)  # indent makes it diffable\n\n# read\nwith open('config.json') as f:\n    config = json.load(f)\n\n# round-trip via strings — useful for HTTP bodies / queues\nblob = json.dumps(config)\nrestored = json.loads(blob)"
          },
          {
            "type": "ul",
            "items": [
              "**Tuples become lists** on round-trip — JSON has no tuple type.",
              "**Dict keys become strings** — `json.dumps({1: 'a'})` gives `'{\"1\": \"a\"}'`.",
              "**Datetimes don't serialize** — convert to ISO strings yourself (`dt.isoformat()`).",
              "**Use `json.JSONDecodeError`** to catch malformed input separately from I/O errors."
            ]
          }
        ]
      },
      {
        "heading": "Round-trip — write then read",
        "body": [
          {
            "type": "p",
            "text": "Tying it together: write a dict to disk, read it back, recover a value."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "import json\n\n# write\nwith open('out.json', 'w') as f:\n    json.dump({'x': 100}, f)\n\n# read back\nwith open('out.json') as f:\n    data = json.load(f)\n\nassert data['x'] == 100"
          }
        ]
      }
    ]
  },
  "py-modules": {
    "sections": [
      {
        "heading": "What's a module, really",
        "body": [
          {
            "type": "p",
            "text": "A **module** is just a `.py` file Python can import. A **package** is a directory of modules with an `__init__.py` (or a namespace package without one). That's the whole concept — everything else is plumbing for *finding* and *loading* those files."
          },
          {
            "type": "p",
            "text": "When you write `import requests`, Python walks **sys.path** looking for a matching name. The first hit wins. That's why your local `email.py` will silently shadow the stdlib `email` module and break your day."
          }
        ]
      },
      {
        "heading": "Where imports come from",
        "body": [
          {
            "type": "walkthrough",
            "title": "Import resolution order",
            "why": "`import` returns the **first** match it finds on `sys.path` — which is exactly why a local `random.py` can silently shadow the stdlib and break your program.",
            "nodes": [
              {
                "id": "app",
                "label": "your app",
                "subtitle": "main.py",
                "x": 0.1,
                "y": 0.5,
                "accent": "sky"
              },
              {
                "id": "resolver",
                "label": "import",
                "subtitle": "walks sys.path",
                "x": 0.4,
                "y": 0.5,
                "accent": "amber"
              },
              {
                "id": "std",
                "label": "stdlib",
                "subtitle": "ships with Python",
                "x": 0.75,
                "y": 0.15,
                "accent": "earth"
              },
              {
                "id": "pip",
                "label": "3rd-party",
                "subtitle": "pip install",
                "x": 0.75,
                "y": 0.5,
                "accent": "fire"
              },
              {
                "id": "local",
                "label": "your modules",
                "subtitle": "./pkg/*.py",
                "x": 0.75,
                "y": 0.85,
                "accent": "water"
              }
            ],
            "steps": [
              {
                "title": "Your code asks for a name",
                "description": "When `main.py` runs `import X`, Python hands the bare name `X` to the import machinery. Nothing is located yet — it's just a request.",
                "activeNodes": [
                  "app",
                  "resolver"
                ],
                "activeEdges": [
                  {
                    "from": "app",
                    "to": "resolver",
                    "label": "import X"
                  }
                ]
              },
              {
                "title": "Walk sys.path in order",
                "description": "The resolver checks `sys.modules` cache first, then walks **`sys.path`** entry by entry. The order matters: the search stops at the **first** directory that has a match.",
                "activeNodes": [
                  "resolver"
                ],
                "activeEdges": []
              },
              {
                "title": "Built-in & stdlib",
                "description": "Frozen built-ins and the **standard library** are checked along the path — `json`, `os`, `pathlib`. These ship with Python, so no install is ever needed.",
                "activeNodes": [
                  "resolver",
                  "std"
                ],
                "activeEdges": [
                  {
                    "from": "resolver",
                    "to": "std",
                    "label": "built-in?"
                  }
                ]
              },
              {
                "title": "Third-party (site-packages)",
                "description": "Next come the libraries `pip install` dropped into **site-packages** — `requests`, `numpy`. This is why an unactivated virtualenv makes imports suddenly vanish.",
                "activeNodes": [
                  "resolver",
                  "pip"
                ],
                "activeEdges": [
                  {
                    "from": "resolver",
                    "to": "pip",
                    "label": "site-packages?"
                  }
                ]
              },
              {
                "title": "Your own modules",
                "description": "Finally the script's own directory and local packages — `./pkg/*.py`. Because the CWD often sorts early, a file named `random.py` here can **shadow** the stdlib and break everything.",
                "activeNodes": [
                  "resolver",
                  "local"
                ],
                "activeEdges": [
                  {
                    "from": "resolver",
                    "to": "local",
                    "label": "local file?"
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "heading": "The four import forms",
        "body": [
          {
            "type": "code",
            "lang": "python",
            "text": "import json  # whole module, use as json.dumps(...)\nfrom pathlib import Path  # pull one name into local scope\nimport numpy as np  # alias — saves typing, conventional for np/pd/plt\nfrom .utils import clean  # relative import — only works inside a package\n\n# AVOID:\nfrom os import *  # dumps every public name — collisions, unreadable\n\n# Side effects fire on first import only:\nimport mypkg.config  # runs mypkg/__init__.py then config.py top-level code\nimport mypkg.config  # second time: cached in sys.modules, no re-run"
          }
        ]
      },
      {
        "heading": "Packages and __init__.py",
        "body": [
          {
            "type": "p",
            "text": "A folder becomes a **package** when Python can find an `__init__.py` in it (or treats it as a namespace package). The file can be empty — its existence is the signal. Put re-exports there to flatten your public API:"
          },
          {
            "type": "code",
            "lang": "python",
            "text": "# mypkg/__init__.py\nfrom .client import Client  # so users write: from mypkg import Client\nfrom .errors import ApiError  # not: from mypkg.errors import ApiError\n\n__version__ = \"1.2.0\"  # convention — tools like pip read this\n__all__ = [\"Client\", \"ApiError\"]  # controls what `from mypkg import *` exposes"
          },
          {
            "type": "p",
            "text": "Keep `__init__.py` cheap. Heavy imports here run *every time anything in the package is imported* — a slow init bloats your CLI startup."
          }
        ]
      },
      {
        "heading": "Vocabulary that trips people up",
        "body": [
          {
            "type": "terms",
            "items": [
              {
                "term": "module",
                "def": "A single `.py` file you can import by name."
              },
              {
                "term": "package",
                "def": "A directory of modules, identified by `__init__.py` or namespace rules."
              },
              {
                "term": "virtualenv",
                "def": "An isolated Python interpreter + site-packages dir, so one project's deps don't poison another's."
              },
              {
                "term": "site-packages",
                "def": "The folder where pip installs third-party libraries for a given interpreter."
              },
              {
                "term": "sys.path",
                "def": "Ordered list of directories Python searches on import; first match wins."
              }
            ]
          }
        ]
      },
      {
        "heading": "Picking a dependency tool",
        "body": [
          {
            "type": "table",
            "headers": [
              "Tool",
              "Manages venv?",
              "Use when"
            ],
            "rows": [
              [
                "pip + venv",
                "✓ (manually)",
                "Simple scripts, learning — no lockfile, just `requirements.txt`"
              ],
              [
                "pip-tools",
                "✗",
                "Like pip but want reproducible installs — adds `requirements.lock`"
              ],
              [
                "pipenv",
                "✓",
                "Apps not libraries — Pipfile.lock, was trendy ~2018, fading"
              ],
              [
                "poetry",
                "✓",
                "Libraries you'll publish, or apps wanting modern UX — `poetry.lock`"
              ],
              [
                "uv",
                "✓",
                "Speed — Rust-based, drop-in for pip/poetry, `uv.lock`"
              ]
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
              "**Shadowing stdlib**: naming your file `email.py`, `json.py`, `types.py` breaks `import` for the real one. Check `python -c 'import x; print(x.__file__)'` when imports surprise you.",
              "**Circular imports**: `a.py` imports `b`, `b.py` imports `a`. Fix by moving the import inside the function, or extracting the shared piece into `c.py`.",
              "**Running scripts from inside packages**: `python mypkg/cli.py` breaks relative imports. Use `python -m mypkg.cli` instead.",
              "**Global pip installs**: `pip install foo` without a venv pollutes your system Python. Every project gets its own venv — non-negotiable.",
              "**Forgetting to activate**: a fresh terminal means a fresh shell with no venv. `which python` (or `where python` on Windows) tells you which interpreter you're actually using."
            ]
          }
        ]
      }
    ]
  },
  "cli-pipes": {
    "sections": [
      {
        "heading": "Everything is a stream",
        "body": [
          {
            "type": "p",
            "text": "Unix's killer idea is that **every program reads bytes from somewhere and writes bytes to somewhere**. Three streams ship with every process: `stdin` (0), `stdout` (1), `stderr` (2). That's the whole abstraction."
          },
          {
            "type": "p",
            "text": "Once you accept that, **pipes** and **redirects** stop being syntax to memorize and become two operations: hook a stream to another process, or hook it to a file. Compose those and you've replaced half of what people reach for Python for."
          }
        ]
      },
      {
        "heading": "The flow",
        "body": [
          {
            "type": "diagram",
            "title": "stdin → command → stdout / stderr",
            "nodes": [
              {
                "id": "in",
                "label": "stdin",
                "subtitle": "fd 0",
                "x": 0.08,
                "y": 0.5,
                "accent": "water"
              },
              {
                "id": "cmd",
                "label": "command",
                "subtitle": "your process",
                "x": 0.42,
                "y": 0.5,
                "accent": "sky"
              },
              {
                "id": "out",
                "label": "stdout",
                "subtitle": "fd 1 — the pipe",
                "x": 0.78,
                "y": 0.28,
                "accent": "earth"
              },
              {
                "id": "err",
                "label": "stderr",
                "subtitle": "fd 2 — diagnostics",
                "x": 0.78,
                "y": 0.72,
                "accent": "fire"
              },
              {
                "id": "next",
                "label": "next command",
                "subtitle": "or a file",
                "x": 0.95,
                "y": 0.28,
                "accent": "amber"
              }
            ],
            "edges": [
              {
                "from": "in",
                "to": "cmd",
                "kind": "dashed",
                "accent": "water",
                "label": "bytes in"
              },
              {
                "from": "cmd",
                "to": "out",
                "kind": "dashed",
                "accent": "earth",
                "label": "results"
              },
              {
                "from": "cmd",
                "to": "err",
                "kind": "solid",
                "accent": "fire",
                "label": "errors"
              },
              {
                "from": "out",
                "to": "next",
                "kind": "dashed",
                "accent": "amber"
              }
            ]
          },
          {
            "type": "p",
            "text": "The crucial split: **stdout carries the answer, stderr carries the complaints**. A pipe only forwards stdout. Errors keep flying to your terminal unless you say otherwise — which is exactly what you want when debugging a pipeline."
          }
        ]
      },
      {
        "heading": "The operators that earn their keep",
        "body": [
          {
            "type": "code",
            "lang": "bash",
            "text": "cat access.log | grep 500 | wc -l  # how many 500s? — three procs, one stream\nps aux | grep -v grep | grep python  # -v grep drops the grep line itself\n\nmake build > build.log  # stdout to file, truncates each run\nmake build >> build.log  # append instead — keeps history\nmake build 2> errors.log  # only stderr to file, stdout still scrolls\nmake build &> all.log  # both streams, same file (bash-ism)\nmake build > out.log 2>&1  # portable form — order matters!\nmake build 2>/dev/null  # silence errors entirely — use sparingly\n\nsort < unsorted.txt  # feed file in as stdin (rare; sort takes args)\ncurl -s api.co/users | jq '.[].email'  # pipes shine when each tool does one thing"
          },
          {
            "type": "table",
            "headers": [
              "Symbol",
              "Means",
              "Gotcha"
            ],
            "rows": [
              [
                "`\\|`",
                "stdout of left → stdin of right",
                "stderr is NOT piped — surprises people"
              ],
              [
                "`>`",
                "stdout → file (truncate)",
                "Silently nukes existing file"
              ],
              [
                "`>>`",
                "stdout → file (append)",
                "Safe for logs; grows forever"
              ],
              [
                "`2>`",
                "stderr → file",
                "Use to separate signal from noise"
              ],
              [
                "`&>`",
                "stdout + stderr → file",
                "Bash/zsh only — not POSIX"
              ],
              [
                "`2>&1`",
                "stderr → wherever stdout goes",
                "Must come AFTER the stdout redirect"
              ],
              [
                "`<`",
                "file → stdin",
                "Most tools take a filename arg instead"
              ]
            ]
          }
        ]
      },
      {
        "heading": "Why `2>&1` order matters",
        "body": [
          {
            "type": "p",
            "text": "This trips up everyone once. Redirections are evaluated **left to right**, and `2>&1` means \"make fd 2 a copy of *wherever fd 1 points right now*.\""
          },
          {
            "type": "code",
            "lang": "bash",
            "text": "cmd > out.log 2>&1    # fd1 → file, THEN fd2 copies fd1 → both in file ✓\ncmd 2>&1 > out.log    # fd2 copies fd1 (terminal!) THEN fd1 → file — errors still scroll ✗"
          },
          {
            "type": "p",
            "text": "Modern bash gives you `&>` and `&>>` as shortcuts, but learn the long form — it's what you'll see in every Dockerfile, systemd unit, and CI script ever written."
          }
        ]
      },
      {
        "heading": "The Unix philosophy in one quote",
        "body": [
          {
            "type": "quote",
            "text": "Write programs that do one thing and do it well. Write programs to work together. Write programs to handle text streams, because that is a universal interface.",
            "cite": "Doug McIlroy, inventor of the pipe"
          },
          {
            "type": "p",
            "text": "Every tool you'll meet — `grep`, `awk`, `sed`, `jq`, `cut`, `sort`, `uniq`, `xargs` — was designed assuming someone else's stdout would be its stdin. That's why a five-stage pipeline often beats a fifty-line script."
          }
        ]
      },
      {
        "heading": "Watch out for",
        "body": [
          {
            "type": "ul",
            "items": [
              "**`>` clobbers without asking.** `set -o noclobber` makes it error instead — turn it on in scripts you don't want to debug at 2am.",
              "**Pipes hide exit codes.** `a | b` returns b's status by default. Use `set -o pipefail` so any failing stage fails the whole pipeline.",
              "**stderr is not piped.** `noisy_cmd | grep error` won't see errors unless you `2>&1` first. This bites everyone exactly once.",
              "**Buffering surprises you.** When stdout goes to a pipe instead of a terminal, many tools switch to block buffering and seem to hang. Reach for `stdbuf -oL` or `unbuffer` when output stalls.",
              "**`/dev/null` is forever.** Redirecting errors there in production is how outages stay invisible. Send them to a log, not the void."
            ]
          }
        ]
      }
    ]
  },
  "cli-grep": {
    "sections": [
      {
        "heading": "What grep actually does",
        "body": [
          {
            "type": "p",
            "text": "**grep** scans text line by line and prints lines that match a pattern. That's it. The power comes from combining it with **regex**, **flags**, and **pipes** — at which point it becomes the fastest way to find a needle in a 10GB haystack without opening an editor."
          },
          {
            "type": "p",
            "text": "You'll reach for it constantly: digging through logs, finding which file defines a function, filtering `ps` output, sanity-checking config. Learn five flags and you've covered 90% of real use."
          }
        ]
      },
      {
        "heading": "The five patterns you'll actually type",
        "body": [
          {
            "type": "code",
            "lang": "bash",
            "text": "grep \"ERROR\" app.log  # literal match, case-sensitive\ngrep -i \"error\" app.log  # -i ignores case (Error, ERROR, error)\ngrep -r \"TODO\" ./src  # -r recurses into directories\ngrep -v \"DEBUG\" app.log  # -v inverts — lines NOT matching\ngrep -n \"timeout\" config.yaml  # -n prefixes line numbers\n\n# extended regex unlocks alternation and grouping\ngrep -E \"WARN|ERROR|FATAL\" app.log    # -E means | works without backslash escaping\n\n# the killer combo: recursive + case-insensitive + line numbers\ngrep -rin \"api_key\" .  # find leaked secrets across a repo"
          }
        ]
      },
      {
        "heading": "Flag reference",
        "body": [
          {
            "type": "table",
            "headers": [
              "Flag",
              "Does",
              "When you want it"
            ],
            "align": [
              "left",
              "left",
              "left"
            ],
            "rows": [
              [
                "`-i`",
                "Case-insensitive",
                "Logs where casing is inconsistent"
              ],
              [
                "`-r`",
                "Recurse directories",
                "Searching a whole codebase"
              ],
              [
                "`-v`",
                "Invert match",
                "Filter OUT noise (DEBUG, heartbeat)"
              ],
              [
                "`-n`",
                "Show line numbers",
                "You'll want to jump to it in an editor"
              ],
              [
                "`-l`",
                "List filenames only",
                "Which files contain this string?"
              ],
              [
                "`-c`",
                "Count matches",
                "How many 500s today?"
              ],
              [
                "`-E`",
                "Extended regex",
                "You need `|`, `+`, `?` without escaping"
              ],
              [
                "`-w`",
                "Whole word only",
                "`grep -w cat` won't match `category`"
              ],
              [
                "`-A 3`",
                "3 lines After match",
                "Show stack trace following an ERROR"
              ],
              [
                "`-B 3`",
                "3 lines Before",
                "Context leading up to the failure"
              ]
            ]
          }
        ]
      },
      {
        "heading": "Regex, just enough to be dangerous",
        "body": [
          {
            "type": "p",
            "text": "grep's pattern is a **regular expression**, not a literal string. Most characters match themselves, but a handful are metacharacters with special meaning. Know these and you can stop chaining ten greps together."
          },
          {
            "type": "terms",
            "items": [
              {
                "term": "^",
                "def": "Anchors to start of line — `^ERROR` matches lines beginning with ERROR, not lines that merely contain it."
              },
              {
                "term": "$",
                "def": "Anchors to end of line — `failed$` matches lines ending in failed."
              },
              {
                "term": ".*",
                "def": "Dot matches any single character, star means zero-or-more — `user.*logged` spans any text between user and logged."
              },
              {
                "term": "\\b",
                "def": "Word boundary — `\\bcat\\b` matches cat but not category or scatter; safer than `-w` when you need partial regex."
              },
              {
                "term": "[abc]",
                "def": "Character class — matches any one of a, b, or c. Use `[0-9]` for digits, `[^x]` to negate."
              }
            ]
          }
        ]
      },
      {
        "heading": "How it fits in a pipeline",
        "body": [
          {
            "type": "diagram",
            "nodes": [
              {
                "id": "src",
                "label": "log file",
                "subtitle": "app.log",
                "x": 0.08,
                "y": 0.5,
                "accent": "amber"
              },
              {
                "id": "cat",
                "label": "cat / tail",
                "subtitle": "stream bytes",
                "x": 0.32,
                "y": 0.5,
                "accent": "water"
              },
              {
                "id": "grep",
                "label": "grep ERROR",
                "subtitle": "filter lines",
                "x": 0.56,
                "y": 0.5,
                "accent": "sky"
              },
              {
                "id": "sort",
                "label": "sort | uniq -c",
                "subtitle": "aggregate",
                "x": 0.8,
                "y": 0.85,
                "accent": "earth"
              }
            ],
            "edges": [
              {
                "from": "src",
                "to": "cat",
                "kind": "dashed",
                "accent": "water"
              },
              {
                "from": "cat",
                "to": "grep",
                "kind": "dashed",
                "accent": "sky"
              },
              {
                "from": "grep",
                "to": "sort",
                "kind": "dashed",
                "accent": "earth"
              }
            ]
          },
          {
            "type": "p",
            "text": "grep reads stdin when no file is given, so it slots cleanly between any two commands. `tail -f app.log | grep -i error` is a live error monitor in 30 characters."
          }
        ]
      },
      {
        "heading": "Watch out for — and when to reach for ripgrep",
        "body": [
          {
            "type": "ul",
            "items": [
              "**Quote your patterns.** Unquoted `*`, `?`, `$` get expanded by the shell before grep ever sees them. Always `grep \"pattern\"` with double quotes.",
              "**Basic vs extended regex.** Without `-E`, you must escape `|`, `+`, `?` and `(...)` with backslashes. Just use `-E` and stop fighting it.",
              "**Exit code matters in scripts.** grep exits 0 if it found something, 1 if not, 2 on error. `if grep -q ERROR log; then ...` is the idiomatic check.",
              "**Binary files surprise you.** grep prints `Binary file foo matches` and stops. Add `-a` to treat binaries as text, or `--exclude-dir=.git` to skip noise."
            ]
          },
          {
            "type": "p",
            "text": "For searching codebases, **ripgrep (`rg`)** is faster, respects `.gitignore` by default, and uses sane regex out of the box. Keep grep in your fingers for one-off log work and piping — reach for `rg` when you're grepping a repo."
          }
        ]
      }
    ]
  },
  "cli-env": {
    "sections": [
      {
        "heading": "What they are",
        "body": [
          {
            "type": "p",
            "text": "**Environment variables** are key/value strings the OS hands to every process you spawn. Your shell, your editor, your Python script — all of them inherit the same bag of `KEY=value` pairs from their parent."
          },
          {
            "type": "p",
            "text": "They're the dumbest config mechanism that works. No file format, no parser, no schema — just strings. That's why **PATH**, **HOME**, and your AWS creds all live here: it's the lowest common denominator every language can read."
          }
        ]
      },
      {
        "heading": "Setting and reading them",
        "body": [
          {
            "type": "code",
            "lang": "bash",
            "text": "export API_URL=https://api.example.com   # export = visible to child processes\nMODE=dev  # no export = shell-local only, children won't see it\necho $API_URL  # $VAR expands to the value\necho \"${API_URL:-http://localhost}\"  # :- means fall back if unset OR empty\necho \"${PORT:?PORT is required}\"  # :? aborts the script if unset — fail fast\nenv | grep AWS_  # env = dump everything inherited\nprintenv API_URL  # printenv = one var, no `VAR=` prefix\nunset API_URL  # remove it — children won't inherit"
          },
          {
            "type": "p",
            "text": "The `export` distinction trips everyone up once. A bare assignment lives only in the current shell; **export** promotes it into the environment block that `fork()` copies into children."
          }
        ]
      },
      {
        "heading": "The ones you'll actually meet",
        "body": [
          {
            "type": "table",
            "headers": [
              "Variable",
              "What it holds",
              "Why you touch it"
            ],
            "rows": [
              [
                "`PATH`",
                "Colon-separated dirs searched for executables",
                "Add `~/bin` so your scripts run by name"
              ],
              [
                "`HOME`",
                "Current user's home directory",
                "Anchor for `~/.config`, `~/.ssh`, dotfiles"
              ],
              [
                "`USER`",
                "Login name",
                "Templating prompts, log lines, default paths"
              ],
              [
                "`LANG`",
                "Locale, e.g. `en_US.UTF-8`",
                "Wrong value = mojibake and broken `sort`"
              ],
              [
                "`SHELL`",
                "Path to login shell",
                "Tools spawn subshells using this"
              ],
              [
                "`PWD`",
                "Current working directory",
                "Set by `cd`; scripts read instead of calling `pwd`"
              ]
            ]
          }
        ]
      },
      {
        "heading": "Reading them from code",
        "body": [
          {
            "type": "code",
            "lang": "python",
            "text": "import os\n\ndb_url = os.environ[\"DATABASE_URL\"]  # KeyError if missing — loud failure on boot\ndebug  = os.getenv(\"DEBUG\", \"0\") == \"1\"  # getenv returns None/default, never raises\nport   = int(os.getenv(\"PORT\", \"8000\"))  # env values are ALWAYS strings — cast explicitly\n\n# gotcha: subprocess inherits the CURRENT os.environ dict\nos.environ[\"FEATURE_X\"] = \"on\"  # children spawned now will see it\nos.environ.pop(\"AWS_SECRET_ACCESS_KEY\", None)  # scrub before exec'ing untrusted code"
          },
          {
            "type": "p",
            "text": "Prefer `os.environ[\"X\"]` for **required** config (crash on boot beats silent misbehavior) and `os.getenv(\"X\", default)` for genuinely optional knobs. Always cast — `PORT=\"8000\"` is a string, and `\"8000\" + 1` is a runtime error you'll hit in production at 2am."
          }
        ]
      },
      {
        "heading": "Secrets in env: the honest tradeoff",
        "body": [
          {
            "type": "pros-cons",
            "goodLabel": "Why everyone does it",
            "watchLabel": "Why it bites",
            "good": [
              "Twelve-Factor blessed — works identically in dev, CI, prod",
              "Every language and framework reads `os.environ` out of the box",
              "No file to accidentally commit, no parser to CVE",
              "Container orchestrators (k8s, ECS, Compose) inject them natively"
            ],
            "watch": [
              "`ps eww <pid>` and `/proc/<pid>/environ` leak them to any process with the right uid",
              "Child processes inherit by default — a curl subprocess sees your DB password",
              "Crash reporters and APM agents love to dump full env into stack traces",
              "`docker inspect` and `kubectl describe pod` print them in plaintext",
              "Shell history saves `export SECRET=...` unless you prefix with a space"
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
              "**Everything is a string.** Cast to int/bool explicitly. `bool(\"false\")` is `True` — that's a footgun, not a feature.",
              "**Children inherit, parents don't.** Setting a var in a subshell or sourced script may not reach where you think. Use `export` and verify with `env` in the target process.",
              "**`.env` files are not env vars.** They're a convention some tools (docker-compose, direnv, python-dotenv) load *into* the environment. Plain `bash` won't read them unless you `set -a; source .env; set +a`.",
              "**Name collisions are silent.** `PATH`, `PS1`, `IFS`, `LD_PRELOAD` have meaning to the shell — don't reuse them for app config. Prefix yours: `MYAPP_DB_URL`, not `DB_URL`.",
              "**Quoting matters.** `export X=$(cmd)` runs `cmd` at assignment time; `export X='$(cmd)'` stores the literal string. Know which you wrote."
            ]
          },
          {
            "type": "quote",
            "text": "Environment variables are global mutable state with no type system. Treat them with the suspicion that implies.",
            "cite": "every postmortem, eventually"
          }
        ]
      }
    ]
  },
  "cli-ssh": {
    "sections": [
      {
        "heading": "What SSH actually is",
        "body": [
          {
            "type": "p",
            "text": "**SSH** is an encrypted tunnel between two machines plus a way to prove who you are. You'll use it to log into servers, copy files, forward ports, and drive deploys. Everything runs over a single TCP connection (default port 22)."
          },
          {
            "type": "p",
            "text": "The mental model: your client opens a socket, both sides negotiate keys, the server authenticates you (password or key), and from then on every byte is encrypted. Lose the connection and the session dies — use `tmux` or `screen` if that matters."
          }
        ]
      },
      {
        "heading": "The handshake, end to end",
        "body": [
          {
            "type": "diagram",
            "title": "Client to server, one round trip",
            "nodes": [
              {
                "id": "client",
                "label": "ssh client",
                "subtitle": "your laptop",
                "x": 0.08,
                "y": 0.5,
                "accent": "water"
              },
              {
                "id": "kex",
                "label": "key exchange",
                "subtitle": "ECDH + cipher pick",
                "x": 0.38,
                "y": 0.3,
                "accent": "amber"
              },
              {
                "id": "auth",
                "label": "auth",
                "subtitle": "pubkey or password",
                "x": 0.62,
                "y": 0.7,
                "accent": "amber"
              },
              {
                "id": "server",
                "label": "sshd",
                "subtitle": "remote host:22",
                "x": 0.92,
                "y": 0.5,
                "accent": "sky"
              }
            ],
            "edges": [
              {
                "from": "client",
                "to": "kex",
                "kind": "dashed",
                "label": "hello",
                "accent": "water"
              },
              {
                "from": "kex",
                "to": "auth",
                "kind": "solid",
                "label": "secret",
                "accent": "amber"
              },
              {
                "from": "auth",
                "to": "server",
                "kind": "dashed",
                "label": "signed",
                "accent": "sky"
              },
              {
                "from": "server",
                "to": "client",
                "kind": "solid",
                "curve": -0.3,
                "label": "encrypted",
                "accent": "sky"
              }
            ]
          },
          {
            "type": "p",
            "text": "First connection ever? The server's host key gets pinned into your `~/.ssh/known_hosts`. If that fingerprint changes later, SSH **refuses to connect** — that's a feature, not a bug. Either the server was rebuilt or someone is between you and it."
          }
        ]
      },
      {
        "heading": "Keys and the commands you actually run",
        "body": [
          {
            "type": "p",
            "text": "Passwords are fine for demos. For anything real, use **keypairs**: a private key that never leaves your laptop and a public key you scatter onto servers."
          },
          {
            "type": "code",
            "lang": "bash",
            "text": "ssh-keygen -t ed25519 -C \"you@laptop\"  # ed25519 > rsa: shorter, faster, modern\n# prompts for ~/.ssh/id_ed25519 path + passphrase  # passphrase protects key if laptop is stolen\n\nssh-copy-id user@host  # appends pubkey to host's ~/.ssh/authorized_keys\nssh user@host  # now logs in with no password prompt\n\nssh -i ~/.ssh/deploy_key ubuntu@1.2.3.4  # -i picks a specific key (override default)\nssh -p 2222 user@host  # -p for non-standard port\nssh -L 5432:localhost:5432 user@host  # tunnel local 5432 to server's localhost:5432\n\nscp ./build.tar.gz user@host:/tmp/  # one-shot copy, fine for single files\nrsync -avz --delete ./site/ user@host:/srv/   # -a preserves perms, -z compresses, --delete mirrors\n\nssh-add ~/.ssh/id_ed25519  # load key into agent so passphrase asked once per session\nssh -A user@bastion  # -A forwards agent — convenient, mild risk on shared hosts"
          }
        ]
      },
      {
        "heading": "Vocabulary that trips people up",
        "body": [
          {
            "type": "terms",
            "items": [
              {
                "term": "public key",
                "def": "The `.pub` file — safe to email, paste in chat, commit to a config repo. It only lets people *verify* signatures, not make them."
              },
              {
                "term": "private key",
                "def": "The matching secret on your laptop. Treat it like a password: never copy to a server, never commit, set mode `600`."
              },
              {
                "term": "known_hosts",
                "def": "Your client's record of which fingerprints belong to which servers. A mismatch warning means stop and investigate."
              },
              {
                "term": "authorized_keys",
                "def": "The server-side file listing pubkeys allowed to log in as that user. `ssh-copy-id` just appends to it."
              },
              {
                "term": "ssh-agent",
                "def": "A background process that holds decrypted keys in memory so you type your passphrase once per boot, not once per command."
              }
            ]
          }
        ]
      },
      {
        "heading": "Errors you will hit",
        "body": [
          {
            "type": "table",
            "headers": [
              "Error",
              "Real cause",
              "Fix"
            ],
            "align": [
              "left",
              "left",
              "left"
            ],
            "rows": [
              [
                "`Permission denied (publickey)`",
                "Server doesn't have your pubkey, or perms on `~/.ssh` are too loose",
                "Re-run `ssh-copy-id`; `chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys`"
              ],
              [
                "`REMOTE HOST IDENTIFICATION HAS CHANGED`",
                "Server's host key changed since you first connected",
                "Confirm it's legitimate (rebuild?), then `ssh-keygen -R host`"
              ],
              [
                "`Connection refused`",
                "sshd not running, or firewall blocks port 22",
                "Check `systemctl status ssh` on host; check security group / `ufw`"
              ],
              [
                "`Connection timed out`",
                "Wrong IP, NAT issue, or port blocked upstream",
                "`ping` first; try `-v` for verbose handshake"
              ],
              [
                "`Agent admitted failure to sign`",
                "Agent has too many keys, server gave up after 6 attempts",
                "`ssh -i <key>` explicitly, or `IdentitiesOnly yes` in `~/.ssh/config`"
              ]
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
              "**Never** copy your private key to a server to \"hop\" from there. Use `ssh -A` agent forwarding or `ProxyJump` instead.",
              "Put repeated flags in `~/.ssh/config` — `Host prod`, `HostName`, `User`, `IdentityFile`. Then it's just `ssh prod`.",
              "A passphrase-less key on a laptop is a credential that walks out the door if the laptop does. Use a passphrase + agent.",
              "Disable password auth on production (`PasswordAuthentication no` in `sshd_config`) once keys work. Bots scan port 22 constantly."
            ]
          }
        ]
      }
    ]
  },
  "git-branches": {
    "sections": [
      {
        "heading": "Branches are cheap pointers, not copies",
        "body": [
          {
            "type": "p",
            "text": "A **branch** in Git is just a movable pointer to a commit. Creating one costs ~40 bytes — a file with a SHA in it. This is why Git workflows lean on branches the way other systems lean on... nothing comparable, honestly."
          },
          {
            "type": "p",
            "text": "You branch to **isolate work**: a feature, an experiment, a hotfix. The main line keeps moving; your branch stays put until you decide to integrate. The integration step — **merging** — is where the interesting decisions live."
          }
        ]
      },
      {
        "heading": "The everyday commands",
        "body": [
          {
            "type": "code",
            "lang": "bash",
            "text": "git branch  # list local branches, * marks current\ngit branch feat/login  # create branch at HEAD, don't switch to it\ngit switch -c feat/login  # create AND switch — the common case\ngit switch main  # move HEAD back to main\ngit merge feat/login  # fold feat/login into current branch\ngit branch -d feat/login  # delete — refuses if unmerged (safe)\ngit branch -D feat/login  # force delete — you lose unmerged commits"
          },
          {
            "type": "p",
            "text": "`switch` replaced the overloaded `checkout` in Git 2.23+ — `checkout` still works but does too many things. Prefer `switch` for branches, `restore` for files."
          },
          {
            "type": "table",
            "headers": [
              "Command",
              "What it does",
              "When"
            ],
            "rows": [
              [
                "`git switch -c X`",
                "Create + switch",
                "Starting new work"
              ],
              [
                "`git branch -d X`",
                "Delete if merged",
                "Cleanup after merge"
              ],
              [
                "`git branch -D X`",
                "Force delete",
                "Abandoning experiment"
              ],
              [
                "`git branch -m Y`",
                "Rename current branch",
                "You typo'd the name"
              ],
              [
                "`git branch -a`",
                "List local + remote",
                "Finding stale branches"
              ],
              [
                "`git merge --abort`",
                "Undo in-progress merge",
                "Conflicts you can't resolve now"
              ]
            ]
          }
        ]
      },
      {
        "heading": "Fast-forward vs merge commit",
        "body": [
          {
            "type": "p",
            "text": "When you merge, Git picks one of two shapes depending on history. If `main` hasn't moved since you branched, Git just **slides the main pointer forward** — a *fast-forward*. No new commit, linear history."
          },
          {
            "type": "p",
            "text": "If `main` has new commits your branch doesn't have, Git creates a **merge commit** with two parents to tie the histories together. This preserves the fact that the work happened in parallel."
          },
          {
            "type": "diagram",
            "title": "Two shapes of integration",
            "nodes": [
              {
                "id": "base",
                "label": "C1",
                "subtitle": "common ancestor",
                "x": 0.08,
                "y": 0.5,
                "accent": "amber"
              },
              {
                "id": "ff",
                "label": "C2 → C3",
                "subtitle": "main just slides",
                "x": 0.45,
                "y": 0.2,
                "accent": "sky"
              },
              {
                "id": "mainnew",
                "label": "C2'",
                "subtitle": "main moved on",
                "x": 0.45,
                "y": 0.8,
                "accent": "fire"
              },
              {
                "id": "branchnew",
                "label": "C3",
                "subtitle": "your branch",
                "x": 0.7,
                "y": 0.65,
                "accent": "water"
              },
              {
                "id": "merge",
                "label": "M",
                "subtitle": "merge · 2 parents",
                "x": 0.92,
                "y": 0.8,
                "accent": "earth"
              }
            ],
            "edges": [
              {
                "from": "base",
                "to": "ff",
                "kind": "dashed",
                "label": "no divergence",
                "accent": "sky"
              },
              {
                "from": "base",
                "to": "mainnew",
                "kind": "solid",
                "accent": "fire"
              },
              {
                "from": "base",
                "to": "branchnew",
                "kind": "solid",
                "accent": "water"
              },
              {
                "from": "mainnew",
                "to": "merge",
                "kind": "dashed",
                "accent": "earth"
              },
              {
                "from": "branchnew",
                "to": "merge",
                "kind": "dashed",
                "accent": "earth"
              }
            ]
          },
          {
            "type": "code",
            "lang": "bash",
            "text": "git merge feat/login  # fast-forward IF possible, else merge commit\ngit merge --no-ff feat/login  # force a merge commit even when ff works\ngit merge --ff-only feat/login  # refuse if ff impossible — keeps history linear"
          }
        ]
      },
      {
        "heading": "Fast-forward vs merge commit — which to prefer",
        "body": [
          {
            "type": "pros-cons",
            "goodLabel": "Fast-forward (linear)",
            "watchLabel": "Merge commit (--no-ff)",
            "good": [
              "Clean, linear `git log` — easy to read",
              "No noise commits for tiny branches",
              "`git bisect` walks a straight line"
            ],
            "watch": [
              "Preserves *when* work was branched and integrated",
              "Easy to revert a whole feature (`git revert -m 1 <merge>`)",
              "Required when branches share commits — no choice"
            ]
          }
        ]
      },
      {
        "heading": "Clean up after yourself",
        "body": [
          {
            "type": "p",
            "text": "Merged branches that hang around become **graveyard noise**. After merge, delete the branch locally and on the remote — the commits live on in `main`, the pointer is what you're removing."
          },
          {
            "type": "code",
            "lang": "bash",
            "text": "git switch main  # leave the branch you're about to delete\ngit pull  # make sure local main has the merge\ngit branch -d feat/login  # safe delete — fails if not actually merged\ngit push origin --delete feat/login # remove the remote pointer too\ngit fetch --prune  # drop stale remote-tracking refs locally"
          },
          {
            "type": "p",
            "text": "The `-d` (lowercase) refusal is a feature, not friction. If Git won't delete, the branch has commits no other branch reaches — verify before reaching for `-D`."
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
                "term": "Switching with dirty changes",
                "def": "Git blocks `switch` if uncommitted edits would collide — `git stash` first, or commit a WIP."
              },
              {
                "term": "Force-delete `-D`",
                "def": "Discards unmerged commits silently; the only recovery is `git reflog` within ~90 days."
              },
              {
                "term": "Merging into the wrong branch",
                "def": "`git merge` always merges INTO your current branch — check `git branch` before you run it."
              },
              {
                "term": "Long-lived feature branches",
                "def": "The longer a branch lives apart from `main`, the worse the eventual merge conflicts — integrate often."
              }
            ]
          },
          {
            "type": "quote",
            "text": "Branches are free; merges are where the design decisions live."
          }
        ]
      }
    ]
  },
  "git-conflicts": {
    "sections": [
      {
        "heading": "What a conflict actually is",
        "body": [
          {
            "type": "p",
            "text": "A **merge conflict** happens when Git can't decide which version of a line wins. Two branches changed the same lines, or one branch deleted a file the other edited. Git stops, marks the file, and hands you the wheel."
          },
          {
            "type": "p",
            "text": "Conflicts are not a bug or a punishment. They are Git refusing to silently lose your teammate's work. Your job is to read both sides and produce the version that's actually correct."
          }
        ]
      },
      {
        "heading": "Reading the conflict markers",
        "body": [
          {
            "type": "p",
            "text": "When you `git merge` or `git rebase` and Git can't reconcile a hunk, it writes both versions into the file separated by markers. Open the file and you'll see this:"
          },
          {
            "type": "code",
            "lang": "python",
            "text": "def charge(user, amount):\n    validate(user)  # both branches kept this line\n<<<<<<< HEAD  # start of YOUR side (current branch)\n    fee = amount * 0.029 + 0.30  # main: Stripe pricing\n    total = amount + fee  # you added the fee line\n=======  # divider — everything below is THEIRS\n    total = round(amount, 2)  # feature branch: rounded to cents\n>>>>>>> feature/rounding  # end marker names the incoming branch\n    return stripe.charge(user, total)    # untouched, outside the conflict"
          },
          {
            "type": "p",
            "text": "`HEAD` is wherever you are right now. The branch after `>>>>>>>` is what you tried to pull in. Everything between `<<<<<<<` and `=======` is **ours**; everything between `=======` and `>>>>>>>` is **theirs**. You delete the markers and write the line that should actually ship — often a blend of both."
          }
        ]
      },
      {
        "heading": "The resolution loop",
        "body": [
          {
            "type": "ol",
            "items": [
              "Run `git status` — it lists every file under \"Unmerged paths\". That's your worklist.",
              "Open each file and find the `<<<<<<<` markers. Decide: ours, theirs, both, or a new combined version.",
              "Delete all three markers (`<<<<<<<`, `=======`, `>>>>>>>`) and leave only the final correct code.",
              "Run the tests. A clean syntactic merge that breaks behavior is the worst outcome — verify it actually works.",
              "`git add <file>` to mark it resolved, then `git merge --continue` (or `git rebase --continue`).",
              "If you panic, `git merge --abort` puts everything back exactly as it was. Free undo button."
            ]
          }
        ]
      },
      {
        "heading": "Tools that help",
        "body": [
          {
            "type": "terms",
            "items": [
              {
                "term": "git status",
                "def": "Your source of truth — shows which files are unmerged and which are resolved-but-unstaged."
              },
              {
                "term": "git diff --ours / --theirs",
                "def": "Shows what each side contributed without you having to remember which branch is which."
              },
              {
                "term": "git checkout --ours <file>",
                "def": "Nuclear option for one file: take our version wholesale, discard theirs. Inverse is `--theirs`."
              },
              {
                "term": "git mergetool",
                "def": "Launches a configured three-way diff viewer (Meld, KDiff3, VS Code) showing base, ours, and theirs side by side."
              },
              {
                "term": "IDE conflict UI",
                "def": "VS Code, IntelliJ, and friends render \"Accept Current / Accept Incoming / Accept Both\" buttons inline above each conflict block."
              },
              {
                "term": "git rerere",
                "def": "\"Reuse recorded resolution\" — opt-in feature that remembers how you resolved a conflict so the same one auto-resolves next time."
              }
            ]
          }
        ]
      },
      {
        "heading": "Avoiding conflicts in the first place",
        "body": [
          {
            "type": "p",
            "text": "Most conflict pain is self-inflicted by branches that lived too long or grew too wide. The fix is workflow, not Git-fu."
          },
          {
            "type": "pros-cons",
            "goodLabel": "Habits that prevent conflicts",
            "good": [
              "Ship **small PRs** that touch 1-3 files — narrow surface area means narrow conflict surface.",
              "**Rebase onto main daily** while your branch is alive so you resolve drift in small bites.",
              "**Pull before you push** — never push on top of a stale local main.",
              "Agree on **formatter and import order** in CI so style churn doesn't fight real edits.",
              "Split mechanical refactors (renames, reformats) into their own PR landed first."
            ],
            "watchLabel": "Habits that guarantee conflicts",
            "watch": [
              "Two-week feature branches that touch 40 files.",
              "Merging main back into your branch repeatedly — creates a tangled history full of merge commits.",
              "Two people refactoring the same module in parallel without telling each other.",
              "Auto-formatters that run on save with different configs per developer.",
              "Ignoring `git status` warnings and force-pushing over a teammate."
            ]
          }
        ]
      },
      {
        "heading": "Watch out for",
        "body": [
          {
            "type": "p",
            "text": "**Silent semantic conflicts.** Git only sees lines, not meaning. If you rename `charge_user()` to `charge()` on main while a teammate adds a new call to `charge_user()` on a feature branch in a different file, Git merges both cleanly — and main breaks. Run the full test suite after every merge, not just the lint."
          },
          {
            "type": "p",
            "text": "**Committing the markers.** A `<<<<<<<` shipped to production is a meme for a reason. Add a pre-commit hook or CI grep that rejects any commit containing `<<<<<<< HEAD`."
          },
          {
            "type": "quote",
            "text": "The best merge is the one that didn't have to happen. Rebase often, ship small, talk to your team.",
            "cite": "every senior engineer, eventually"
          }
        ]
      }
    ]
  },
  "net-http": {
    "sections": [
      {
        "heading": "The request/response contract",
        "body": [
          {
            "type": "p",
            "text": "**HTTP** is a stateless request/response protocol. The client sends a request with a **method**, **path**, **headers**, and optional **body**. The server sends back a **status code**, **headers**, and optional **body**. That's the whole protocol — everything else is convention."
          },
          {
            "type": "p",
            "text": "Stateless means the server doesn't remember you between requests. If continuity matters (login, cart), the client has to carry it — usually in a **cookie** or **Authorization** header."
          },
          {
            "type": "diagram",
            "title": "One round trip",
            "nodes": [
              {
                "id": "c",
                "label": "Client",
                "subtitle": "BROWSER",
                "x": 0.1,
                "y": 0.5,
                "accent": "water"
              },
              {
                "id": "req",
                "label": "Request",
                "subtitle": "METHOD+PATH",
                "x": 0.4,
                "y": 0.5,
                "accent": "amber"
              },
              {
                "id": "s",
                "label": "Server",
                "subtitle": "ROUTES",
                "x": 0.7,
                "y": 0.5,
                "accent": "sky"
              },
              {
                "id": "res",
                "label": "Response",
                "subtitle": "STATUS+BODY",
                "x": 0.4,
                "y": 0.85,
                "accent": "amber"
              }
            ],
            "edges": [
              {
                "from": "c",
                "to": "req",
                "kind": "dashed",
                "accent": "water"
              },
              {
                "from": "req",
                "to": "s",
                "kind": "dashed",
                "accent": "water"
              },
              {
                "from": "s",
                "to": "res",
                "kind": "dashed",
                "accent": "sky"
              },
              {
                "from": "res",
                "to": "c",
                "kind": "dashed",
                "accent": "sky"
              }
            ]
          }
        ]
      },
      {
        "heading": "Methods and what they promise",
        "body": [
          {
            "type": "p",
            "text": "The **method** (verb) declares intent. The two properties that matter operationally are **safety** (no server-side change) and **idempotency** (same result if repeated). Idempotency is what lets clients retry on flaky networks without double-charging anyone."
          },
          {
            "type": "table",
            "headers": [
              "Method (typical use)",
              "Safe",
              "Idempotent"
            ],
            "align": [
              "left",
              "center",
              "center"
            ],
            "rows": [
              [
                "GET — read a resource",
                "✓",
                "✓"
              ],
              [
                "POST — create / trigger action",
                "✗",
                "✗"
              ],
              [
                "PUT — replace a resource",
                "✗",
                "✓"
              ],
              [
                "PATCH — partial update",
                "✗",
                "✗"
              ],
              [
                "DELETE — remove a resource",
                "✗",
                "✓"
              ]
            ]
          },
          {
            "type": "p",
            "text": "Note **DELETE** is idempotent: deleting an already-deleted thing is still \"it's gone.\" **POST** isn't — that's why payment APIs require an `Idempotency-Key` header to make retries safe."
          }
        ]
      },
      {
        "heading": "Status codes by family",
        "body": [
          {
            "type": "p",
            "text": "Status codes group by the first digit. Memorize the families; the specific numbers come with reps."
          },
          {
            "type": "table",
            "headers": [
              "Family",
              "Meaning",
              "Examples"
            ],
            "align": [
              "center",
              "left",
              "left"
            ],
            "rows": [
              [
                "1xx",
                "informational, keep going",
                "100 Continue, 101 Switching Protocols"
              ],
              [
                "2xx",
                "success",
                "200 OK, 201 Created, 204 No Content"
              ],
              [
                "3xx",
                "redirect — look elsewhere",
                "301 Moved, 304 Not Modified"
              ],
              [
                "4xx",
                "client screwed up",
                "400, 401, 403, 404, 429"
              ],
              [
                "5xx",
                "server screwed up",
                "500, 502, 503, 504"
              ]
            ]
          },
          {
            "type": "p",
            "text": "**4xx vs 5xx matters for retries.** A `400` won't get better if you retry the same payload. A `503` or `504` is transient — back off and retry."
          }
        ]
      },
      {
        "heading": "See it on the wire",
        "body": [
          {
            "type": "p",
            "text": "`curl -v` is the fastest way to inspect what's actually being sent. Read the `>` lines (request) and `<` lines (response)."
          },
          {
            "type": "code",
            "lang": "bash",
            "text": "curl -v \\\n  -X POST https://api.example.com/orders \\\n  -H 'Authorization: Bearer $TOKEN' \\\n  -H 'Content-Type: application/json' \\\n  -H 'Idempotency-Key: order-7f3a' \\\n  -d '{\"sku\":\"abc\",\"qty\":2}'\n# > POST /orders HTTP/1.1  # request line — method, path, version\n# > Host: api.example.com  # required in HTTP/1.1, routes virtual hosts\n# > Authorization: Bearer ...  # who you are; never log this header\n# > Content-Type: application/json   # tells server how to parse the body\n# > Idempotency-Key: order-7f3a  # safe to retry — server dedupes by this key\n# > Content-Length: 21  # curl computes this from -d\n# <\n# < HTTP/1.1 201 Created  # 2xx success; 201 means a new resource exists\n# < Location: /orders/9182  # where to GET the thing you just made\n# < Content-Type: application/json   # how to parse the response body\n# < {\"id\":\"9182\",\"status\":\"pending\"} # body — only meaningful with the headers above"
          }
        ]
      },
      {
        "heading": "Headers that bite you",
        "body": [
          {
            "type": "terms",
            "items": [
              {
                "term": "Host",
                "def": "Required in HTTP/1.1 — one IP can serve many domains, and the server picks based on this."
              },
              {
                "term": "Content-Type",
                "def": "Declares the body format; mismatch with the actual bytes and the server returns 415 or silently misparses."
              },
              {
                "term": "Content-Length",
                "def": "Bytes in the body. Lie about it and the connection hangs or truncates."
              },
              {
                "term": "Authorization",
                "def": "Credentials. Treat as a secret — never log, never put in URLs (they end up in proxies)."
              },
              {
                "term": "Cache-Control",
                "def": "Whether and how long the response can be cached. `no-store` for anything user-specific."
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
              "**Putting secrets in the URL.** Query strings land in access logs, browser history, and `Referer` headers. Use the `Authorization` header or POST body.",
              "**Trusting the method for safety.** A misbuilt API can mutate state on `GET`. Web crawlers will then \"click\" every link and wreck your data.",
              "**Retrying non-idempotent POSTs.** Without an `Idempotency-Key`, a retry after a timeout may create a duplicate. The first request might have succeeded — you just didn't hear back.",
              "**Confusing 401 and 403.** `401` means \"I don't know who you are\" (send credentials). `403` means \"I know who you are and you can't.\" Don't tell the user to log in again on a 403.",
              "**Forgetting HTTP is stateless.** Every request stands alone. Session state lives in cookies, tokens, or the database — never in the server's memory between requests if you want to scale horizontally."
            ]
          }
        ]
      }
    ]
  },
  "net-dns": {
    "sections": [
      {
        "heading": "DNS in one breath",
        "body": [
          {
            "type": "p",
            "text": "**DNS** is the phone book for the internet — it turns `claude.ai` into `160.79.104.10` so packets know where to go. You don't query one giant database; you walk a **hierarchy** of servers, each one pointing you closer to the answer."
          },
          {
            "type": "p",
            "text": "Almost every lookup hits a **cache** first. The walk you're about to see only happens on a cold miss — but understanding it explains every weird DNS bug you'll ever debug."
          }
        ]
      },
      {
        "heading": "The resolution walk",
        "body": [
          {
            "type": "p",
            "text": "Your machine asks a **recursive resolver** (usually your ISP, `1.1.1.1`, or `8.8.8.8`). The resolver does the legwork, talking to three tiers of **authoritative** servers until someone hands back an IP."
          },
          {
            "type": "diagram",
            "title": "Cold-cache lookup for www.example.com",
            "nodes": [
              {
                "id": "client",
                "label": "Your laptop",
                "subtitle": "stub resolver",
                "x": 0.3,
                "y": 0.1,
                "accent": "water"
              },
              {
                "id": "resolver",
                "label": "Recursive resolver",
                "subtitle": "1.1.1.1 / ISP",
                "x": 0.7,
                "y": 0.1,
                "accent": "earth"
              },
              {
                "id": "root",
                "label": "Root (.)",
                "subtitle": "13 letter servers",
                "x": 0.3,
                "y": 0.37,
                "accent": "amber"
              },
              {
                "id": "tld",
                "label": "TLD (.com)",
                "subtitle": "Verisign",
                "x": 0.7,
                "y": 0.37,
                "accent": "amber"
              },
              {
                "id": "auth",
                "label": "Authoritative",
                "subtitle": "ns.example.com",
                "x": 0.3,
                "y": 0.64,
                "accent": "fire"
              },
              {
                "id": "answer",
                "label": "A record",
                "subtitle": "93.184.216.34",
                "x": 0.7,
                "y": 0.64,
                "accent": "sky"
              }
            ],
            "edges": [
              {
                "from": "client",
                "to": "resolver",
                "kind": "dashed",
                "label": "name?",
                "accent": "water"
              },
              {
                "from": "resolver",
                "to": "root",
                "kind": "dashed",
                "label": "1",
                "accent": "amber"
              },
              {
                "from": "root",
                "to": "resolver",
                "kind": "solid",
                "label": "ask .com",
                "accent": "amber"
              },
              {
                "from": "resolver",
                "to": "tld",
                "kind": "dashed",
                "label": "2",
                "accent": "amber"
              },
              {
                "from": "tld",
                "to": "resolver",
                "kind": "solid",
                "label": "ask ns.example.com",
                "accent": "amber"
              },
              {
                "from": "resolver",
                "to": "auth",
                "kind": "dashed",
                "label": "3",
                "accent": "fire"
              },
              {
                "from": "auth",
                "to": "answer",
                "kind": "solid",
                "accent": "sky"
              },
              {
                "from": "answer",
                "to": "client",
                "kind": "dashed",
                "label": "93.184.216.34",
                "accent": "sky"
              }
            ]
          },
          {
            "type": "p",
            "text": "The resolver does the recursion; root and TLD servers only ever **refer you onward**. They never know the final IP — that's the authoritative server's job."
          }
        ]
      },
      {
        "heading": "Record types you'll actually touch",
        "body": [
          {
            "type": "terms",
            "items": [
              {
                "term": "A",
                "def": "Hostname → IPv4 address. The default record everyone means when they say \"DNS record\"."
              },
              {
                "term": "AAAA",
                "def": "Hostname → IPv6 address. Same idea as A, four times wider — note the four A's."
              },
              {
                "term": "CNAME",
                "def": "Alias one name to another (`www → example.com`). Cannot coexist with other records at the same name."
              },
              {
                "term": "MX",
                "def": "Where to deliver email for this domain. Has a priority number; lower wins."
              },
              {
                "term": "TXT",
                "def": "Free-form text. Used for SPF, DKIM, domain-verification challenges, and other meta-purposes."
              },
              {
                "term": "NS",
                "def": "Which authoritative servers own this zone. Set at the registrar; this is how delegation happens."
              }
            ]
          }
        ]
      },
      {
        "heading": "Inspecting DNS from your terminal",
        "body": [
          {
            "type": "p",
            "text": "Skip your browser — it caches aggressively and lies to you. Use `dig` (Linux/macOS) or `nslookup` (Windows) to talk to a resolver directly."
          },
          {
            "type": "code",
            "lang": "bash",
            "text": "dig example.com  # default A lookup via your system resolver\ndig example.com MX  # ask for mail records instead\ndig +trace example.com  # walk root → TLD → auth yourself, no cache\ndig @1.1.1.1 example.com  # force a specific resolver — bypasses ISP\ndig example.com +short  # just the answer, no headers — scriptable\n\nnslookup example.com  # Windows equivalent — less detail, ubiquitous\nnslookup -type=TXT example.com 8.8.8.8  # query type + custom server in one shot"
          },
          {
            "type": "p",
            "text": "`+trace` is the magic flag — it shows you the exact hierarchy walk from the diagram above, which is gold when delegation is broken."
          }
        ]
      },
      {
        "heading": "Watch out for: the TTL trap",
        "body": [
          {
            "type": "p",
            "text": "Every record carries a **TTL** (time-to-live) in seconds. Resolvers cache the answer for that long and ignore your changes until it expires. Set a record with `TTL=86400` and \"update\" it five minutes later? Half the internet keeps the old IP for another **23 hours, 55 minutes**."
          },
          {
            "type": "pros-cons",
            "goodLabel": "Lower the TTL *before* you migrate",
            "watchLabel": "Common TTL mistakes",
            "good": [
              "Drop TTL to 60-300s a full day before the cutover",
              "Wait for the OLD high TTL to expire everywhere first",
              "Raise it back to 3600+ after the dust settles to cut resolver load"
            ],
            "watch": [
              "Lowering TTL the same day you migrate — old TTL is still in flight",
              "Trusting `dig` from one machine; other resolvers cache independently",
              "Negative caching (NXDOMAIN) — typos get cached too, sometimes for hours",
              "Browser/OS caches sit *in front of* the resolver and have their own TTLs"
            ]
          },
          {
            "type": "quote",
            "text": "It's not DNS. There's no way it's DNS. It was DNS.",
            "cite": "SSBroski, sysadmin folklore"
          }
        ]
      }
    ]
  },
  "net-tls": {
    "sections": [
      {
        "heading": "Why TLS exists",
        "body": [
          {
            "type": "p",
            "text": "**HTTPS is just HTTP inside a TLS tunnel.** TLS gives you three things at once: *confidentiality* (nobody reads your bytes), *integrity* (nobody flips your bytes), and *authenticity* (you're really talking to who you think). Drop any one and the other two stop mattering."
          },
          {
            "type": "p",
            "text": "The hard part isn't encryption — symmetric ciphers are cheap and solved. The hard part is **agreeing on a key with a stranger over a wire that someone might be tapping**. That negotiation is the *handshake*, and it's where every interesting TLS bug lives."
          }
        ]
      },
      {
        "heading": "The handshake, step by step",
        "body": [
          {
            "type": "p",
            "text": "TLS 1.3 collapsed the old multi-round dance into **one round trip**. Client throws its key share with the first hello; server replies with everything needed to start encrypting. Follow the numbered edges:"
          },
          {
            "type": "diagram",
            "title": "TLS 1.3 handshake (1-RTT)",
            "nodes": [
              {
                "id": "client",
                "label": "Client",
                "subtitle": "browser / curl",
                "x": 0.12,
                "y": 0.5,
                "accent": "water"
              },
              {
                "id": "server",
                "label": "Server",
                "subtitle": "nginx / app",
                "x": 0.88,
                "y": 0.5,
                "accent": "sky"
              },
              {
                "id": "ca",
                "label": "CA chain",
                "subtitle": "trust anchor",
                "x": 0.5,
                "y": 0.08,
                "accent": "amber"
              },
              {
                "id": "session",
                "label": "Encrypted session",
                "subtitle": "AEAD record layer",
                "x": 0.5,
                "y": 0.92,
                "accent": "earth"
              }
            ],
            "edges": [
              {
                "from": "client",
                "to": "server",
                "label": "1. hello",
                "kind": "dashed",
                "accent": "water"
              },
              {
                "from": "server",
                "to": "client",
                "label": "2. key + cert",
                "kind": "dashed",
                "accent": "sky"
              },
              {
                "from": "ca",
                "to": "client",
                "label": "validates",
                "kind": "solid",
                "accent": "amber"
              },
              {
                "from": "client",
                "to": "server",
                "label": "3. finished",
                "kind": "dashed",
                "accent": "water"
              },
              {
                "from": "client",
                "to": "session",
                "label": "app data",
                "kind": "dashed",
                "accent": "earth"
              },
              {
                "from": "server",
                "to": "session",
                "label": "app data",
                "kind": "dashed",
                "accent": "earth"
              }
            ]
          },
          {
            "type": "p",
            "text": "Key move: the **key_share** fields are an ephemeral Diffie-Hellman exchange. Both sides derive the same secret without ever sending it. The server's long-term RSA/ECDSA key is used *only* to sign the transcript — that's what `CertVerify` proves. Steal the cert key tomorrow and you still can't decrypt yesterday's traffic. That's **forward secrecy**."
          }
        ]
      },
      {
        "heading": "Reading a cipher suite",
        "body": [
          {
            "type": "p",
            "text": "A cipher suite is a recipe. TLS 1.2 names are long because they spell every ingredient; TLS 1.3 shortened them because key exchange and auth are negotiated separately now."
          },
          {
            "type": "table",
            "headers": [
              "Suite",
              "Bulk cipher",
              "Use it?"
            ],
            "rows": [
              [
                "TLS_AES_128_GCM_SHA256",
                "AES-128-GCM (ECDHE)",
                "✓ TLS 1.3 default"
              ],
              [
                "TLS_CHACHA20_POLY1305_SHA256",
                "ChaCha20-Poly1305 (ECDHE)",
                "✓ mobile / no AES-NI"
              ],
              [
                "ECDHE-RSA-AES256-GCM-SHA384",
                "AES-256-GCM (ECDHE + RSA cert)",
                "✓ TLS 1.2 fallback"
              ],
              [
                "ECDHE-RSA-AES128-CBC-SHA",
                "AES-128-CBC + HMAC-SHA1",
                "✗ CBC + SHA1, drop"
              ],
              [
                "RSA-AES128-GCM-SHA256",
                "AES-128-GCM, static RSA",
                "✗ no forward secrecy"
              ],
              [
                "NULL-SHA",
                "no encryption, SHA-1 MAC",
                "✗ obviously"
              ]
            ]
          },
          {
            "type": "p",
            "text": "Rule of thumb: if the name lacks **ECDHE**, you lose forward secrecy. If it has **CBC**, you inherit a decade of padding-oracle CVEs. If it has **GCM** or **ChaCha20-Poly1305**, you're on an AEAD — encryption and integrity in one pass."
          }
        ]
      },
      {
        "heading": "Inspecting a real handshake",
        "body": [
          {
            "type": "p",
            "text": "When something breaks in production, you don't read the RFC — you read `openssl s_client`. Two commands cover 90% of TLS triage:"
          },
          {
            "type": "code",
            "lang": "bash",
            "text": "openssl s_client -connect api.example.com:443 \\\n  -servername api.example.com \\  # SNI, or you get the wrong cert\n  -tls1_3 -showcerts </dev/null \\  # pin protocol, dump full chain\n  | openssl x509 -noout -dates -subject  # parse leaf: expiry + CN/SAN\n\nnmap --script ssl-enum-ciphers -p 443 api.example.com  # list every suite the server accepts"
          },
          {
            "type": "p",
            "text": "Read the `Verify return code` line first. `0 (ok)` means the chain validated; anything else is your bug. `unable to get local issuer certificate` almost always means the server forgot to send an **intermediate** — browsers ship a cache and hide this, `curl` doesn't."
          }
        ]
      },
      {
        "heading": "Vocabulary you'll keep tripping over",
        "body": [
          {
            "type": "terms",
            "items": [
              {
                "term": "SNI",
                "def": "Server Name Indication — the hostname sent in cleartext in ClientHello so one IP can host many certs."
              },
              {
                "term": "ALPN",
                "def": "Application-Layer Protocol Negotiation — how client and server agree on `h2` vs `http/1.1` inside the handshake."
              },
              {
                "term": "OCSP stapling",
                "def": "Server fetches its own revocation proof and attaches it, so clients don't phone the CA on every connect."
              },
              {
                "term": "HSTS",
                "def": "Strict-Transport-Security header — tells browsers to refuse plain HTTP to this host for N seconds."
              },
              {
                "term": "mTLS",
                "def": "Mutual TLS — the client also presents a cert, used for service-to-service auth inside a mesh."
              },
              {
                "term": "0-RTT",
                "def": "TLS 1.3 resumption mode that sends app data on the first flight; fast, but replayable — only for idempotent requests."
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
            "goodLabel": "Defaults that age well",
            "watchLabel": "Footguns",
            "good": [
              "TLS 1.3 only, with TLS 1.2 ECDHE-GCM as fallback for old clients.",
              "Let's Encrypt + automated renewal — expired certs are the #1 TLS outage.",
              "HSTS with `includeSubDomains` once you're sure every subdomain is HTTPS.",
              "Terminate TLS at the edge, re-encrypt to the backend with an internal CA (mTLS)."
            ],
            "watch": [
              "0-RTT on non-idempotent endpoints — an attacker can replay that `POST /transfer`.",
              "Wildcard certs shared across blast radii — one private key, many services compromised.",
              "Trusting `X-Forwarded-Proto` without verifying the proxy actually terminated TLS.",
              "Pinning public keys in mobile apps — when you rotate, old installs brick themselves."
            ]
          },
          {
            "type": "quote",
            "text": "The S in HTTPS stands for assumptions.",
            "cite": "every SRE who has debugged an expired intermediate at 3am"
          },
          {
            "type": "p",
            "text": "**Key insight:** TLS isn't a checkbox you tick at the load balancer. It's a *negotiation* with versions, suites, certs, and clocks — and the negotiation is what fails. Learn to read the handshake and you'll debug 90% of `ERR_SSL_*` errors without ever touching the RFC."
          },
          {
            "type": "explain-back",
            "prompt": "In your own words: walk through the TLS 1.3 handshake and explain why it only needs one round trip.",
            "modelAnswer": "In TLS 1.3, you send `ClientHello` already carrying your key share — you've guessed which key-exchange group the server supports (curve25519, usually) and pre-computed half of the Diffie-Hellman exchange. The server replies with its own key share, certificate, and `Finished`, all encrypted under the freshly-derived session key. You verify the cert chain against your trust store, send your `Finished`, and from byte 0 of the second flight, application data is flowing. The whole thing is **1-RTT** because the key exchange happens in the very first message, not after a separate \"hello, what cipher do you support?\" round like TLS 1.2 needed.",
            "hint": "Think about what TLS 1.2 needed two round trips for — and what TLS 1.3 collapses by guessing the key exchange group up front.",
            "commit": {
              "q": "What lets a full TLS 1.3 handshake finish in one round trip where TLS 1.2 needed two?",
              "opts": [
                "The server caches session keys from earlier connections and skips the key exchange",
                "The client guesses the key-exchange group and sends its key share in the very first message",
                "TLS 1.3 skips certificate verification during the handshake to save a flight"
              ],
              "answer": 1,
              "why": "The `ClientHello` already carries a pre-computed key share, so there's no separate 'what do you support?' round before the exchange can start."
            }
          }
        ]
      }
    ]
  },
  "f1": {
    "sections": [
      {
        "heading": "The idea",
        "body": [
          {
            "type": "p",
            "text": "A computer is a stack of layers. At the bottom, billions of tiny switches (transistors) flip between 0 and 1. At the top, you click a button and a cat photo loads. Everything in between is layers of abstraction that turn electrons into experiences."
          },
          {
            "type": "p",
            "text": "The four hardware pieces that matter most:"
          },
          {
            "type": "ul",
            "items": [
              "**CPU** — the brain. Executes instructions one at a time, billions per second.",
              "**RAM** — the desk. Fast, temporary storage of what the CPU is using right now.",
              "**Disk** (SSD/HDD) — the filing cabinet. Slower, permanent storage of files.",
              "**Network card** — the mailbox. Sends and receives bytes to other machines."
            ]
          },
          {
            "type": "p",
            "text": "When you launch a program, the OS copies it from disk into RAM, points the CPU at the first instruction, and the CPU runs through code at unimaginable speed."
          }
        ]
      },
      {
        "heading": "Why this matters",
        "body": [
          {
            "type": "p",
            "text": "Every performance problem you'll ever debug comes from one of these layers. App slow? Maybe the CPU is pegged. Memory error? RAM ran out. File save hangs? Disk is the bottleneck. Page won't load? Network."
          },
          {
            "type": "p",
            "text": "You don't need to design chips. You need to know the rough costs:"
          },
          {
            "type": "ul",
            "items": [
              "CPU register access: ~1 nanosecond",
              "RAM access: ~100 nanoseconds (100x slower)",
              "SSD read: ~100 microseconds (1000x slower than RAM)",
              "Network round-trip across the country: ~50 milliseconds (500,000x slower)"
            ]
          },
          {
            "type": "p",
            "text": "When code feels slow, ask: which of these is it hitting? The answer is almost always disk or network."
          }
        ]
      },
      {
        "heading": "How layers stack",
        "body": [
          {
            "type": "p",
            "text": "From the metal up: **transistors → logic gates → CPU instructions → machine code → assembly → C → your language (Python, JS) → the app you're using**."
          },
          {
            "type": "p",
            "text": "You write `print(\"hello\")` in Python. Python turns it into bytecode. The Python interpreter (written in C) executes that bytecode by calling OS system calls. The OS sends instructions to the CPU. The CPU flips transistors. Pixels light up. Hello."
          },
          {
            "type": "p",
            "text": "Each layer hides the one below it. That's the secret to making complex things tractable."
          }
        ]
      }
    ]
  },
  "f2": {
    "sections": [
      {
        "heading": "The GIL is a mutex on the interpreter itself",
        "body": [
          {
            "type": "p",
            "text": "Python's **Global Interpreter Lock** is one mutex that protects the interpreter's internal state — reference counts, object graphs, the bytecode dispatcher. Only **one thread executes Python bytecode at a time**, no matter how many cores you own."
          },
          {
            "type": "p",
            "text": "This makes CPython's C internals trivially thread-safe at the cost of making *your* threaded CPU code useless. Eight threads doing math run no faster than one. Eight threads waiting on sockets run roughly 8× faster, because the GIL is **released during I/O syscalls**."
          },
          {
            "type": "p",
            "text": "That single sentence — *released during I/O, held during bytecode* — predicts everything else in this lesson."
          }
        ]
      },
      {
        "heading": "The load-increment-store race",
        "body": [
          {
            "type": "p",
            "text": "People assume `counter += 1` is atomic because it looks like one line. It isn't. CPython compiles it to **three bytecodes**: load the value, add one, store it back. The GIL can switch threads between any two of them."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "import threading  # stdlib threads\n\ncounter = 0  # shared mutable state\n\ndef bump():\n    global counter  # rebind module-level name\n    for _ in range(1_000_000):  # enough iterations to race\n        counter += 1  # LOAD, ADD, STORE — not atomic\n\nthreads = [threading.Thread(target=bump)   # spawn ten workers\n           for _ in range(10)]\nfor t in threads: t.start()  # all racing on `counter`\nfor t in threads: t.join()  # wait for completion\n\nprint(counter)  # expect 10_000_000 — you won't get it"
          },
          {
            "type": "p",
            "text": "You'll see something like `7423109` and it'll be different every run. The fix is a `threading.Lock()` around the increment, or `queue.Queue` to avoid sharing mutable state at all. **The GIL prevents interpreter corruption, not your data races.**"
          }
        ]
      },
      {
        "heading": "Pick the right concurrency model",
        "body": [
          {
            "type": "table",
            "headers": [
              "Model",
              "Good at",
              "Bad at",
              "When to reach"
            ],
            "align": [
              "left",
              "left",
              "left",
              "left"
            ],
            "rows": [
              [
                "**threading**",
                "Blocking I/O, C extensions that release GIL",
                "Pure-Python CPU work",
                "Legacy sync libraries, file/socket fan-out"
              ],
              [
                "**asyncio**",
                "Thousands of concurrent sockets, low overhead",
                "Any sync call blocks the loop",
                "New network code, web servers, scrapers"
              ],
              [
                "**multiprocessing**",
                "CPU-bound Python (NumPy loops, parsing, ML preprocess)",
                "Large arg payloads (pickle cost)",
                "Burn all cores on pure-Python math (✗ shared memory, IPC needed)"
              ],
              [
                "**concurrent.futures**",
                "Uniform API over threads or processes",
                "Hides which one you picked",
                "Quick parallel `map` over a function"
              ],
              [
                "**C extension / NumPy**",
                "Vectorized math while *releasing* the GIL",
                "Anything not vectorizable",
                "Numerical hot loops — let C do it"
              ]
            ]
          }
        ]
      },
      {
        "heading": "Why threading still helps with I/O",
        "body": [
          {
            "type": "p",
            "text": "When a thread calls `socket.recv()` or `open(path).read()`, CPython **drops the GIL** before the syscall and reacquires it when bytes return. While that thread sleeps in the kernel, another thread runs Python freely."
          },
          {
            "type": "diagram",
            "title": "GIL ownership over time — 2 threads, mixed workload",
            "nodes": [
              {
                "id": "t1cpu",
                "label": "T1: CPU",
                "subtitle": "holds GIL",
                "x": 0.08,
                "y": 0.25,
                "accent": "fire"
              },
              {
                "id": "t1io",
                "label": "T1: recv()",
                "subtitle": "GIL released",
                "x": 0.38,
                "y": 0.25,
                "accent": "water"
              },
              {
                "id": "t1back",
                "label": "T1: CPU",
                "subtitle": "reacquires",
                "x": 0.72,
                "y": 0.25,
                "accent": "fire"
              },
              {
                "id": "t2wait",
                "label": "T2: waits",
                "subtitle": "no GIL",
                "x": 0.08,
                "y": 0.75,
                "accent": "amber"
              },
              {
                "id": "t2run",
                "label": "T2: CPU",
                "subtitle": "holds GIL",
                "x": 0.38,
                "y": 0.75,
                "accent": "sky"
              },
              {
                "id": "t2wait2",
                "label": "T2: waits",
                "subtitle": "no GIL",
                "x": 0.72,
                "y": 0.75,
                "accent": "amber"
              }
            ],
            "edges": [
              {
                "from": "t1cpu",
                "to": "t1io",
                "kind": "dashed",
                "label": "syscall →"
              },
              {
                "from": "t1io",
                "to": "t1back",
                "kind": "dashed",
                "label": "bytes back"
              },
              {
                "from": "t2wait",
                "to": "t2run",
                "kind": "dashed",
                "label": "GIL free"
              },
              {
                "from": "t2run",
                "to": "t2wait2",
                "kind": "dashed",
                "label": "T1 grabs back"
              }
            ]
          },
          {
            "type": "p",
            "text": "**asyncio** achieves the same overlap without the kernel context switches — one thread, an event loop, and `await` markers where the GIL hand-off would have happened. Cheaper per-connection, but one accidental `time.sleep(1)` stalls every coroutine on the loop."
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
                "term": "CPU-bound in threads",
                "def": "you'll see 100% on *one* core and wonder why. Move to `multiprocessing` or vectorize."
              },
              {
                "term": "Sync calls inside async",
                "def": "`requests.get()` in a coroutine freezes the whole loop. Use `httpx.AsyncClient` or `loop.run_in_executor`."
              },
              {
                "term": "Fork + threads",
                "def": "on Linux, `multiprocessing` with `fork` can deadlock if the parent held a lock. Prefer `spawn` start method."
              },
              {
                "term": "GIL ≠ thread-safe",
                "def": "compound operations (`+=`, `if x: x.append`) still race. Use `Lock` or `Queue`."
              },
              {
                "term": "PEP 703 (free-threaded)",
                "def": "Python 3.13+ ships an opt-in no-GIL build. Single-thread perf regresses ~10%; C extensions need recompilation. Don't depend on it in prod yet."
              }
            ]
          },
          {
            "type": "quote",
            "text": "The GIL doesn't make your code thread-safe — it makes the interpreter thread-safe. Your data is on its own.",
            "cite": "every Python concurrency bug, eventually"
          }
        ]
      }
    ]
  },
  "f3": {
    "sections": [
      {
        "heading": "The three commands, sharpened",
        "body": [
          {
            "type": "p",
            "text": "The canonical lesson already taught you **what** `pwd`, `ls`, and `cd` do. This page is the **field manual**: the flags you'll actually type, a real navigation session, and the one path-resolution gotcha that bites everyone exactly once."
          },
          {
            "type": "p",
            "text": "Treat these three as a **triangle**. `pwd` answers *where am I*, `ls` answers *what's here*, `cd` answers *take me there*. Every shell session is just those three questions on loop."
          }
        ]
      },
      {
        "heading": "Flags worth memorizing",
        "body": [
          {
            "type": "table",
            "headers": [
              "Command",
              "Flag",
              "What it does",
              "When you reach for it"
            ],
            "align": [
              "left",
              "left",
              "left",
              "left"
            ],
            "rows": [
              [
                "`ls`",
                "`-l`",
                "long format: perms, size, mtime",
                "debugging permissions"
              ],
              [
                "`ls`",
                "`-a`",
                "show dotfiles (`.env`, `.git`)",
                "checking hidden config"
              ],
              [
                "`ls`",
                "`-h`",
                "human sizes (1.2K, 4.0M)",
                "pairs with `-l` always"
              ],
              [
                "`ls`",
                "`-lah`",
                "the combo every dev types",
                "muscle memory default"
              ],
              [
                "`ls`",
                "`-t`",
                "sort by mtime, newest first",
                "finding the file you just touched"
              ],
              [
                "`ls`",
                "`-S`",
                "sort by size, largest first",
                "hunting disk hogs"
              ],
              [
                "`cd`",
                "`-`",
                "jump to **previous** directory",
                "ping-pong between two dirs"
              ],
              [
                "`cd`",
                "(no arg)",
                "go to `$HOME`",
                "fastest reset"
              ],
              [
                "`pwd`",
                "`-P`",
                "resolve symlinks to real path",
                "you're inside a symlinked dir"
              ],
              [
                "`pwd`",
                "`-L`",
                "show logical path (default)",
                "rarely typed explicitly"
              ]
            ]
          }
        ]
      },
      {
        "heading": "A real navigation session",
        "body": [
          {
            "type": "p",
            "text": "Here's a session debugging a failing build. Watch how the **three commands interleave** — you rarely run one in isolation."
          },
          {
            "type": "code",
            "lang": "bash",
            "text": "pwd  # /home/dev/projects/api\nls -lah  # spot the .env, check sizes\ncd src/handlers  # dive into the suspect module\nls -t  # newest file = freshest bug\ncd -  # bounce back to /home/dev/projects/api\ncd ../shared/utils  # hop sideways via parent\npwd  # /home/dev/projects/shared/utils\ncd ~/projects/api/logs  # absolute jump via ~ shortcut\nls -lSh | head -5  # five largest log files\ncd  # reset to $HOME\npwd -P  # resolve any symlinks honestly"
          },
          {
            "type": "p",
            "text": "The `cd -` on line 5 is the **highest-ROI flag** in this lesson. Two-directory workflows (source ↔ tests, app ↔ logs) become one keystroke."
          }
        ]
      },
      {
        "heading": "Absolute vs relative paths — the gotcha",
        "body": [
          {
            "type": "p",
            "text": "Every path you type is one of two species. **Absolute** paths start with `/` (or `~` which expands to `$HOME`). **Relative** paths start with anything else — they resolve against `pwd`."
          },
          {
            "type": "pros-cons",
            "goodLabel": "Absolute paths",
            "good": [
              "Work from **any** directory — same answer every time",
              "Safe inside scripts where `pwd` is unpredictable",
              "Copy-paste from docs without thinking",
              "`/var/log/nginx/access.log` means exactly that, always"
            ],
            "watchLabel": "Relative paths",
            "watch": [
              "Break the moment `cd` runs — same string, new meaning",
              "`../config` resolves differently from `/etc` vs `/home`",
              "Scripts using relative paths fail when invoked from elsewhere",
              "Inside a symlinked dir, `..` may not go where you think"
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
                "term": "Symlink surprise",
                "def": "inside a symlinked directory, `cd ..` follows the **logical** parent, not the physical one — use `pwd -P` to see the truth"
              },
              {
                "term": "Spaces in names",
                "def": "`cd My Documents` tries to enter `My` — always quote: `cd \"My Documents\"` or escape: `cd My\\ Documents`"
              },
              {
                "term": "`ls` color lies",
                "def": "colors come from `$LS_COLORS`, not the filesystem — a green name doesn't mean executable on every system"
              },
              {
                "term": "`cd` in scripts",
                "def": "`cd` only affects the **current shell** — running `./script.sh` that does `cd /tmp` leaves your prompt where it was"
              }
            ]
          },
          {
            "type": "quote",
            "text": "If you don't know where you are, every relative path is a guess. Type `pwd` first, argue second."
          }
        ]
      }
    ]
  },
  "f4": {
    "sections": [
      {
        "heading": "What this page is",
        "body": [
          {
            "type": "p",
            "text": "This is the **cheat sheet**. The main HTTP lesson explains *why* the web works the way it does — this one just lays out **the tables you actually need open in a second tab** while you're debugging a 502 at 2am."
          },
          {
            "type": "p",
            "text": "Bookmark it. Don't read it linearly. Use **Ctrl+F**."
          }
        ]
      },
      {
        "heading": "Methods, by safety and idempotency",
        "body": [
          {
            "type": "p",
            "text": "**Safe** = doesn't change server state (a crawler can hit it freely). **Idempotent** = calling it N times has the same effect as calling it once. These two properties are what your **retry logic** and your **CDN cache** actually care about."
          },
          {
            "type": "table",
            "headers": [
              "Method",
              "Idempotent",
              "What it does"
            ],
            "align": [
              "left",
              "center",
              "left"
            ],
            "rows": [
              [
                "GET",
                "✓ (safe)",
                "Read a resource. Cacheable by default."
              ],
              [
                "HEAD",
                "✓ (safe)",
                "Like GET but headers only. Cheap existence check."
              ],
              [
                "OPTIONS",
                "✓ (safe)",
                "Ask what's allowed. Powers CORS preflight."
              ],
              [
                "PUT",
                "✓",
                "Replace the whole resource at this URL."
              ],
              [
                "DELETE",
                "✓",
                "Remove it. Second DELETE still ends in 'gone'."
              ],
              [
                "POST",
                "✗",
                "Create / arbitrary action. Retries are dangerous."
              ],
              [
                "PATCH",
                "✗",
                "Partial update. Not idempotent unless you design it to be."
              ]
            ]
          },
          {
            "type": "p",
            "text": "The trap: people assume **PATCH is idempotent** because PUT is. It isn't. `PATCH {balance: +10}` applied twice charges twice."
          }
        ]
      },
      {
        "heading": "Status code families",
        "body": [
          {
            "type": "table",
            "headers": [
              "Family",
              "Meaning",
              "When you see it"
            ],
            "align": [
              "center",
              "left",
              "left"
            ],
            "rows": [
              [
                "1xx",
                "Informational — hold on",
                "101 Switching Protocols (WebSocket upgrade)"
              ],
              [
                "2xx",
                "Success — it worked",
                "200 OK, 201 Created, 204 No Content"
              ],
              [
                "3xx",
                "Redirect — look elsewhere",
                "301 permanent, 302 temp, 304 Not Modified"
              ],
              [
                "4xx",
                "Client error — your fault",
                "400 bad, 401 auth, 403 forbidden, 404 missing, 429 rate-limited"
              ],
              [
                "5xx",
                "Server error — their fault",
                "500 generic, 502 bad gateway, 503 unavailable, 504 timeout"
              ]
            ]
          },
          {
            "type": "terms",
            "items": [
              {
                "term": "401 vs 403",
                "def": "401 = 'I don't know who you are'. 403 = 'I know, and no'."
              },
              {
                "term": "502 vs 504",
                "def": "502 = upstream returned garbage. 504 = upstream didn't return at all."
              },
              {
                "term": "301 vs 302",
                "def": "301 is cached forever by browsers — use 302 unless you mean it."
              }
            ]
          }
        ]
      },
      {
        "heading": "One curl, fully annotated",
        "body": [
          {
            "type": "p",
            "text": "Every flag here earns its keep. Memorize the shape — you'll type it a thousand times."
          },
          {
            "type": "code",
            "lang": "bash",
            "text": "curl -X POST \\  # method; default is GET\n  -H \"Content-Type: application/json\" \\ # tell server we're sending JSON\n  -H \"Authorization: Bearer $TOKEN\" \\   # auth header, token from env\n  -d '{\"name\":\"ada\",\"role\":\"admin\"}' \\  # body payload, inline JSON\n  -i \\  # include response headers in output\n  -sS \\  # silent but still show errors\n  -w \"\\n%{http_code} %{time_total}s\\n\" \\ # print status + latency at end\n  --max-time 10 \\  # bail after 10s total\n  https://api.example.com/v1/users  # the URL last, by convention"
          },
          {
            "type": "p",
            "text": "**-i** is the one beginners miss. Without it you only see the body, and **half of HTTP lives in the headers** — `Set-Cookie`, `Cache-Control`, `Location`, `X-RateLimit-Remaining`."
          }
        ]
      },
      {
        "heading": "The request/response shape",
        "body": [
          {
            "type": "diagram",
            "title": "Anatomy of a round trip",
            "height": 280,
            "nodes": [
              {
                "id": "cli",
                "label": "Client",
                "subtitle": "BROWSER",
                "x": 0.08,
                "y": 0.5,
                "accent": "water"
              },
              {
                "id": "req",
                "label": "Request",
                "subtitle": "METHOD+PATH",
                "x": 0.35,
                "y": 0.25,
                "accent": "amber"
              },
              {
                "id": "srv",
                "label": "Server",
                "subtitle": "ROUTES",
                "x": 0.62,
                "y": 0.5,
                "accent": "sky"
              },
              {
                "id": "res",
                "label": "Response",
                "subtitle": "STATUS+BODY",
                "x": 0.35,
                "y": 0.75,
                "accent": "amber"
              },
              {
                "id": "db",
                "label": "Backend",
                "subtitle": "DB+CACHE",
                "x": 0.9,
                "y": 0.5,
                "accent": "fire"
              }
            ],
            "edges": [
              {
                "from": "cli",
                "to": "req",
                "kind": "dashed",
                "label": "writes",
                "accent": "water"
              },
              {
                "from": "req",
                "to": "srv",
                "kind": "dashed",
                "label": "over TCP/TLS",
                "accent": "amber"
              },
              {
                "from": "srv",
                "to": "db",
                "kind": "solid",
                "label": "maybe",
                "accent": "fire"
              },
              {
                "from": "srv",
                "to": "res",
                "kind": "dashed",
                "label": "writes",
                "accent": "sky"
              },
              {
                "from": "res",
                "to": "cli",
                "kind": "dashed",
                "label": "back",
                "accent": "amber"
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
              "**Retrying POST on a 5xx is a footgun.** It's not idempotent. Use an **Idempotency-Key** header or switch to PUT.",
              "**404 doesn't mean 'broken'** — it's a perfectly valid answer. Don't page on it. Page on 5xx.",
              "**429 has a `Retry-After` header.** Honor it. Exponential backoff on top is belt-and-suspenders.",
              "**A 200 with `{\"error\": \"...\"}` body** is a code smell. Use the status code; that's what it's for.",
              "**HTTPS doesn't authenticate the user** — only the server. You still need tokens, cookies, or mTLS."
            ]
          },
          {
            "type": "quote",
            "text": "HTTP is mostly fine. Your assumptions about HTTP are where the bugs live.",
            "cite": "every backend engineer eventually"
          }
        ]
      }
    ]
  },
  "f5": {
    "sections": [
      {
        "heading": "Role, not machine",
        "body": [
          {
            "type": "p",
            "text": "Forget the rack-mounted box. **Server** and **client** are *roles a process plays during a conversation*, not types of hardware. The same laptop can be both within a single second."
          },
          {
            "type": "p",
            "text": "The rule is brutally simple: whoever **initiates the request** is the client. Whoever **waits and responds** is the server. Swap who speaks first and the labels swap with them."
          },
          {
            "type": "terms",
            "items": [
              {
                "term": "Client",
                "def": "the process that opens the connection and asks first"
              },
              {
                "term": "Server",
                "def": "the process that listens on a port and replies"
              },
              {
                "term": "Peer",
                "def": "a process that does both, often simultaneously"
              },
              {
                "term": "Daemon",
                "def": "a long-running server process, usually backgrounded"
              }
            ]
          }
        ]
      },
      {
        "heading": "A request, traced",
        "body": [
          {
            "type": "p",
            "text": "Here is one HTTP request crossing four roles. Notice how your **app server** is a *server* to the browser but a *client* to Postgres — in the same call stack."
          },
          {
            "type": "diagram",
            "title": "One request, four roles",
            "height": 280,
            "nodes": [
              {
                "id": "browser",
                "label": "Browser",
                "subtitle": "client to app",
                "x": 0.08,
                "y": 0.5,
                "accent": "water"
              },
              {
                "id": "lb",
                "label": "Load balancer",
                "subtitle": "server + client",
                "x": 0.32,
                "y": 0.5,
                "accent": "amber"
              },
              {
                "id": "app",
                "label": "App server",
                "subtitle": "server + client",
                "x": 0.56,
                "y": 0.5,
                "accent": "sky"
              },
              {
                "id": "cache",
                "label": "Redis",
                "subtitle": "server",
                "x": 0.8,
                "y": 0.25,
                "accent": "earth"
              },
              {
                "id": "db",
                "label": "Postgres",
                "subtitle": "server",
                "x": 0.8,
                "y": 0.75,
                "accent": "fire"
              }
            ],
            "edges": [
              {
                "from": "browser",
                "to": "lb",
                "kind": "dashed",
                "label": "GET /cart",
                "accent": "water"
              },
              {
                "from": "lb",
                "to": "app",
                "kind": "dashed",
                "label": "forward",
                "accent": "amber"
              },
              {
                "from": "app",
                "to": "cache",
                "kind": "dashed",
                "label": "GET cart:42",
                "accent": "sky"
              },
              {
                "from": "app",
                "to": "db",
                "kind": "dashed",
                "label": "SELECT on miss",
                "accent": "sky"
              }
            ]
          }
        ]
      },
      {
        "heading": "Programs that play both roles",
        "body": [
          {
            "type": "p",
            "text": "Most real infrastructure is **dual-role**. The label depends on which socket you are looking at."
          },
          {
            "type": "table",
            "headers": [
              "Program",
              "Acts as client to...",
              "Acts as server to..."
            ],
            "align": [
              "left",
              "left",
              "left"
            ],
            "rows": [
              [
                "Browser",
                "your web app, DNS, CDN",
                "extensions, dev tools"
              ],
              [
                "Postgres driver",
                "the Postgres daemon",
                "your app code (via API)"
              ],
              [
                "RabbitMQ broker",
                "disk, peer brokers",
                "publishers and consumers"
              ],
              [
                "Nginx reverse proxy",
                "your upstream app",
                "the public internet"
              ],
              [
                "kubelet",
                "the API server",
                "the container runtime"
              ]
            ]
          },
          {
            "type": "p",
            "text": "Why it matters: pool exhaustion hits a driver from the app-side; reverse proxies need timeouts tuned on both sides; kubelet needs credentials in two directions; DevTools talk to the browser *as* a server."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "import socket  # stdlib sockets only\nimport requests  # we will be a client too\n\nsrv = socket.socket()  # create a TCP socket\nsrv.bind((\"0.0.0.0\", 8080))  # claim port 8080 → server role\nsrv.listen(16)  # backlog of 16 pending conns\n\nwhile True:  # forever, like a daemon\n    conn, _ = srv.accept()  # block until a client speaks\n    upstream = requests.get(  # NOW we are a client too\n        \"https://api.example.com/price\",   # outbound HTTP request\n        timeout=2.0,  # always set a timeout\n    )\n    conn.sendall(upstream.content)  # relay bytes back to caller\n    conn.close()  # release the socket"
          }
        ]
      },
      {
        "heading": "When servers go down",
        "body": [
          {
            "type": "p",
            "text": "Because roles chain, a single dead server cascades through every process that was its client. **Graceful degradation** is about deciding, per dependency, what 'less' looks like."
          },
          {
            "type": "pros-cons",
            "goodLabel": "Degrade like this",
            "watchLabel": "Not like this",
            "good": [
              "Serve stale cache when the DB times out",
              "Return a smaller result set with a banner",
              "Queue the write and 202-Accept it",
              "Fall back to a read replica for reads"
            ],
            "watch": [
              "Retry in a tight loop with no backoff",
              "Propagate a 500 with the raw stack trace",
              "Block the whole request on an optional call",
              "Silently drop writes with a 200 OK"
            ]
          },
          {
            "type": "code",
            "lang": "python",
            "text": "try:\n    price = db.fetch(\"SELECT price ...\")   # primary path, may fail\nexcept TimeoutError:  # only catch the expected error\n    price = cache.get(\"price:last\")  # fall back to last-known good\n    response.headers[\"X-Stale\"] = \"true\"   # tell the client it is stale\nreturn price  # never crash on optional data"
          }
        ]
      },
      {
        "heading": "Key insight",
        "body": [
          {
            "type": "quote",
            "text": "A server is just a process that agreed to wait. The moment it asks something of someone else, it becomes a client too."
          },
          {
            "type": "p",
            "text": "Stop drawing **machines** on your architecture diagrams. Draw **conversations**. The arrows — who initiates, who waits, who times out — are where every interesting bug lives."
          }
        ]
      }
    ]
  },
  "f6": {
    "sections": [
      {
        "heading": "The misconception that breaks your mental model",
        "body": [
          {
            "type": "p",
            "text": "You probably picture Git as a stack of **diffs** — patches piled on top of each other, each commit storing what changed. That model is wrong, and it will mislead you the moment you try to reason about **branching cost**, **cherry-pick**, or why `git gc` can shrink your repo by 90%."
          },
          {
            "type": "p",
            "text": "Git stores **whole-tree snapshots**, addressed by **SHA-1**. A commit points to a *tree* object, which points to *blobs* and sub-trees. Diffs are computed on demand by walking two snapshots and comparing. The diff is the **view**, not the **storage**."
          }
        ]
      },
      {
        "heading": "Walk the object graph yourself",
        "body": [
          {
            "type": "p",
            "text": "Spin up a throwaway repo and chase the pointers. Every object lives under `.git/objects/` keyed by its hash. The first two hex chars are the directory, the rest the filename."
          },
          {
            "type": "code",
            "lang": "bash",
            "text": "mkdir demo && cd demo && git init -q   # fresh repo\necho \"hello\" > a.txt  # one tiny file\ngit add a.txt && git commit -qm \"c1\"  # first snapshot\n\nHEAD=$(git rev-parse HEAD)  # commit SHA\ngit cat-file -t $HEAD  # prints: commit\ngit cat-file -p $HEAD  # shows tree + parent + msg\n\nTREE=$(git cat-file -p $HEAD | awk '/^tree/{print $2}')  # extract tree SHA\ngit cat-file -p $TREE  # lists blob + filename + mode\n\nBLOB=$(git cat-file -p $TREE | awk '{print $3}')  # blob SHA for a.txt\ngit cat-file -p $BLOB  # prints: hello\n\necho \"world\" >> a.txt && git commit -qam \"c2\"   # second snapshot\ngit cat-file -p HEAD | head -2  # NEW tree, NEW blob, parent=c1"
          }
        ]
      },
      {
        "heading": "Three object types, one graph",
        "body": [
          {
            "type": "diagram",
            "title": "commit → tree → blob",
            "nodes": [
              {
                "id": "c2",
                "label": "commit c2",
                "subtitle": "parent: c1",
                "x": 0.1,
                "y": 0.2,
                "accent": "amber"
              },
              {
                "id": "c1",
                "label": "commit c1",
                "subtitle": "parent: ∅",
                "x": 0.1,
                "y": 0.75,
                "accent": "amber"
              },
              {
                "id": "t2",
                "label": "tree T2",
                "subtitle": "a.txt → B2",
                "x": 0.45,
                "y": 0.2,
                "accent": "sky"
              },
              {
                "id": "t1",
                "label": "tree T1",
                "subtitle": "a.txt → B1",
                "x": 0.45,
                "y": 0.75,
                "accent": "sky"
              },
              {
                "id": "b2",
                "label": "blob B2",
                "subtitle": "\"hello\\nworld\"",
                "x": 0.85,
                "y": 0.2,
                "accent": "earth"
              },
              {
                "id": "b1",
                "label": "blob B1",
                "subtitle": "\"hello\"",
                "x": 0.85,
                "y": 0.75,
                "accent": "earth"
              }
            ],
            "edges": [
              {
                "from": "c2",
                "to": "c1",
                "kind": "dashed",
                "label": "parent"
              },
              {
                "from": "c2",
                "to": "t2",
                "kind": "solid",
                "label": "tree"
              },
              {
                "from": "c1",
                "to": "t1",
                "kind": "solid",
                "label": "tree"
              },
              {
                "from": "t2",
                "to": "b2",
                "kind": "solid"
              },
              {
                "from": "t1",
                "to": "b1",
                "kind": "solid"
              }
            ]
          },
          {
            "type": "p",
            "text": "Notice the **dashed parent edge** is the only thing that makes commits sequential. Drop it and you have an unordered bag of snapshots. That is exactly what makes **rebase** and **cherry-pick** cheap — they just rewrite parent pointers and rebuild trees."
          }
        ]
      },
      {
        "heading": "Why this makes branching nearly free",
        "body": [
          {
            "type": "terms",
            "items": [
              {
                "term": "Branch",
                "def": "a 41-byte file under `.git/refs/heads/` holding one SHA. Creating one is **O(1)**."
              },
              {
                "term": "Shared subtree",
                "def": "if `src/` is untouched, its tree SHA is identical across commits — **reused**, not copied."
              },
              {
                "term": "Content addressing",
                "def": "two files with identical bytes collapse to **one blob** anywhere in history."
              },
              {
                "term": "Packfile",
                "def": "later, `git gc` delta-compresses similar blobs — the **diff model arrives at storage time, not commit time**."
              }
            ]
          },
          {
            "type": "p",
            "text": "A 10 GB repo branched a thousand times costs you ~40 KB of refs, not 10 TB. The snapshot model only *sounds* wasteful — **deduplication by hash** does the heavy lifting."
          }
        ]
      },
      {
        "heading": "Watch out for",
        "body": [
          {
            "type": "pros-cons",
            "goodLabel": "Trust this",
            "watchLabel": "Don't confuse",
            "good": [
              "Every commit is a complete tree — `git checkout <sha>` never replays patches",
              "Identical content = identical SHA, across branches, repos, even forks",
              "`git log -p` *computes* diffs from snapshots — they aren't stored"
            ],
            "watch": [
              "Packfiles do store deltas, but that's a storage optimization invisible to the object model",
              "`git format-patch` outputs diffs for transport — still derived from snapshots",
              "Merge commits have **two parents**, not two trees — the merged tree is one snapshot"
            ]
          },
          {
            "type": "quote",
            "text": "Snapshots at the model layer, deltas at the disk layer. Confuse the two and every Git command feels like magic."
          }
        ]
      }
    ]
  },
  "d2": {
    "sections": [
      {
        "heading": "The idea",
        "body": [
          {
            "type": "p",
            "text": "A **bash script** is just a text file full of shell commands. The shell runs them top-to-bottom as if you'd typed each one yourself. The win is repeatability: write it once, run it forever."
          },
          {
            "type": "p",
            "text": "The simplest script:"
          },
          {
            "type": "code",
            "lang": "bash",
            "text": "#!/usr/bin/env bash\necho \"Hello, $USER\"\ndate"
          },
          {
            "type": "p",
            "text": "Make it executable with `chmod +x script.sh`, then run `./script.sh`. The `#!` line (the **shebang**) tells the OS which interpreter to use."
          }
        ]
      },
      {
        "heading": "Why this matters",
        "body": [
          {
            "type": "p",
            "text": "Bash is the duct tape of ops. Every deploy pipeline, every Dockerfile, every CI job ends up with bash glue somewhere. You don't need to master it — but you need to read it without panic and write 20 lines comfortably."
          },
          {
            "type": "p",
            "text": "The constructs you'll use 90% of the time:"
          },
          {
            "type": "ul",
            "items": [
              "Variables: `name=ada` (no spaces around `=`), reference with `$name` or `${name}`",
              "Conditionals: `if [ -f /etc/hosts ]; then echo found; fi`",
              "Loops: `for f in *.log; do gzip \"$f\"; done`",
              "Pipes: `cat app.log | grep ERROR | wc -l`",
              "Exit codes: `$?` is 0 on success, non-zero on failure. Use `set -e` to exit on any error."
            ]
          }
        ]
      },
      {
        "heading": "Common gotchas",
        "body": [
          {
            "type": "ul",
            "items": [
              "**Quote your variables.** `rm $file` breaks if `$file` has spaces. `rm \"$file\"` is safe.",
              "**Use `set -euo pipefail`** at the top of every script. `-e` exits on error, `-u` errors on undefined vars, `-o pipefail` propagates failures through pipes.",
              "**Prefer `[[ ]]` over `[ ]`** for conditionals — fewer footguns, supports `&&` and `||` directly.",
              "**Use `$(cmd)` not backticks** for command substitution — nestable and more readable."
            ]
          },
          {
            "type": "p",
            "text": "A safer template to start every script with:"
          },
          {
            "type": "code",
            "lang": "bash",
            "text": "#!/usr/bin/env bash\nset -euo pipefail\n\nlog() { echo \"[$(date +%H:%M:%S)] $*\"; }\n\nlog \"starting backup\"\n# ... your commands ..."
          }
        ]
      }
    ]
  },
  "fund-functions-scope": {
    "sections": [
      {
        "heading": "A function is a value",
        "body": [
          {
            "type": "p",
            "text": "**A function isn't special — it's a value you can name, pass, and return**, exactly like an int or a string. The instant that clicks, callbacks, decorators, and hooks stop feeling like magic. They're just functions handed around like luggage."
          },
          {
            "type": "p",
            "text": "This lesson covers three knobs you'll touch every day: **scope** (which names a function can see), **closures** (the environment a function drags along), and the classic **late-binding loop trap** that bites every junior at least once."
          }
        ]
      },
      {
        "heading": "Local vs global scope",
        "body": [
          {
            "type": "p",
            "text": "**Scope is the search path Python uses to resolve a name.** Inside a function, Python looks Local → Enclosing → Global → Built-in (the LEGB rule). Assignment creates a *local* binding by default — that's the source of half the `UnboundLocalError` confusion."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "count = 0  # module-level — global\n\ndef bump():\n    count = count + 1  # UnboundLocalError — assigning makes `count` local\n\ndef bump_ok():\n    global count  # explicit opt-in to mutate the global\n    count = count + 1  # now legal — but globals are usually a smell\n\ndef bump_better(c):\n    return c + 1  # pure — no shared state, easy to test"
          },
          {
            "type": "table",
            "headers": [
              "Scope",
              "When created",
              "Lives until"
            ],
            "rows": [
              [
                "Local",
                "Function call begins",
                "Function returns"
              ],
              [
                "Enclosing",
                "Outer function defines inner",
                "Inner function is garbage-collected"
              ],
              [
                "Global",
                "Module loads",
                "Process exits"
              ],
              [
                "Built-in",
                "Python starts",
                "Forever (`len`, `print`, ...)"
              ]
            ]
          }
        ]
      },
      {
        "heading": "Closures — functions carry their environment",
        "body": [
          {
            "type": "p",
            "text": "**A closure is an inner function that remembers variables from its outer scope, even after the outer function has returned.** That's what powers callbacks, factories, and React-style hooks. The function literally drags the environment with it."
          },
          {
            "type": "diagram",
            "title": "Closure capture",
            "subtitle": "INNER REMEMBERS OUTER",
            "height": 220,
            "nodes": [
              {
                "id": "outer",
                "label": "make_counter()",
                "subtitle": "OUTER",
                "accent": "amber",
                "x": 0.15,
                "y": 0.5
              },
              {
                "id": "env",
                "label": "n = 0",
                "subtitle": "CAPTURED",
                "accent": "earth",
                "x": 0.5,
                "y": 0.5
              },
              {
                "id": "inner",
                "label": "inc()",
                "subtitle": "INNER",
                "accent": "fire",
                "x": 0.85,
                "y": 0.5
              }
            ],
            "edges": [
              {
                "from": "outer",
                "to": "env",
                "kind": "dashed",
                "label": "creates"
              },
              {
                "from": "env",
                "to": "inner",
                "kind": "solid",
                "label": "captured"
              }
            ]
          },
          {
            "type": "code",
            "lang": "python",
            "text": "def make_counter():\n    n = 0  # lives in the enclosing scope\n    def inc():\n        nonlocal n  # opt-in to mutate enclosing `n`\n        n += 1  # without `nonlocal`, this would be a new local\n        return n\n    return inc  # `inc` carries `n` with it — that's the closure\n\nc = make_counter()\nprint(c(), c(), c())  # 1 2 3 — same `n` survives between calls"
          },
          {
            "type": "practice",
            "lang": "python",
            "prompt": "Make two independent counters and watch them stay separate.",
            "varName": "result",
            "starter": "def make_counter():\n    n = 0\n    def inc():\n        nonlocal n\n        n += 1\n        return n\n    return inc\n\na = make_counter()\nb = make_counter()\nresult = [a(), a(), b(), a(), b()]\nprint(result)\n",
            "hint": "Each call to `make_counter()` creates a fresh `n`. Tweak the calls and predict the sequence before running."
          }
        ]
      },
      {
        "heading": "The late-binding loop trap",
        "body": [
          {
            "type": "p",
            "text": "**Closures capture variables by reference, not by value.** Build callbacks inside a loop and they all share the *same* loop variable — by the time they run, it's pointing at the last value. Fix: bind the value as a default argument."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "handlers = []\nfor i in range(3):\n    handlers.append(lambda: i)  # GOTCHA — all share `i`\nprint([h() for h in handlers])  # [2, 2, 2] — not [0, 1, 2]\n\n# Fix: default-arg binds the current value at definition time\nhandlers = []\nfor i in range(3):\n    handlers.append(lambda i=i: i)  # `i=i` snapshots now\nprint([h() for h in handlers])  # [0, 1, 2] — fixed"
          },
          {
            "type": "pros-cons",
            "goodLabel": "GOOD FOR",
            "watchLabel": "WATCH OUT FOR",
            "good": [
              "Factories — `make_validator(min, max)` returns a configured function",
              "Decorators — wrap a function while keeping its closure intact",
              "Event handlers that need to remember setup-time config",
              "Hiding private state without a class"
            ],
            "watch": [
              "Building callbacks in a loop without `=value` default-binding",
              "Mutating a captured list and expecting copies — it's the same object",
              "Reaching for `global` when a parameter would do",
              "Heavy closures held by long-lived collections — quiet memory leaks"
            ]
          },
          {
            "type": "quote",
            "text": "A function is a value. A closure is that value with a backpack.",
            "cite": "mental model to keep"
          }
        ]
      }
    ]
  },
  "fund-error-handling": {
    "sections": [
      {
        "heading": "Three philosophies",
        "body": [
          {
            "type": "p",
            "text": "**Every language picks one of three error styles**: exceptions that unwind the stack (Python, Java), return-codes you check by hand (C, Go), or result types the compiler forces you to handle (Rust, Haskell). Picking the right pattern for each function is more important than which language you use."
          },
          {
            "type": "p",
            "text": "Most bugs aren't from missing error handling — they're from **wrong** error handling: catching too wide, swallowing silently, or re-raising what should bubble. Let's name the traps."
          }
        ]
      },
      {
        "heading": "Throw, catch, or bubble",
        "body": [
          {
            "type": "p",
            "text": "**Throw** when the function can't honour its contract. **Catch** when you can actually do something useful — retry, fall back, log-and-continue. **Let it bubble** when the layer above is in a better position to decide. Most code should bubble."
          },
          {
            "type": "diagram",
            "title": "Exception flow",
            "subtitle": "BUBBLE UNTIL CAUGHT",
            "height": 220,
            "nodes": [
              {
                "id": "raise",
                "label": "raise",
                "subtitle": "DEEP",
                "accent": "fire",
                "x": 0.3,
                "y": 0.2
              },
              {
                "id": "mid",
                "label": "mid layer",
                "subtitle": "PASSES",
                "accent": "amber",
                "x": 0.7,
                "y": 0.2
              },
              {
                "id": "handler",
                "label": "try / except",
                "subtitle": "DECIDES",
                "accent": "sky",
                "x": 0.3,
                "y": 0.8
              },
              {
                "id": "out",
                "label": "log / retry",
                "subtitle": "USER VISIBLE",
                "accent": "water",
                "x": 0.7,
                "y": 0.8
              }
            ],
            "edges": [
              {
                "from": "raise",
                "to": "mid",
                "kind": "dashed",
                "label": "bubbles"
              },
              {
                "from": "mid",
                "to": "handler",
                "kind": "dashed",
                "label": "bubbles"
              },
              {
                "from": "handler",
                "to": "out",
                "kind": "solid",
                "label": "handled"
              }
            ]
          },
          {
            "type": "code",
            "lang": "python",
            "text": "import logging\n\ndef parse_age(raw: str) -> int:\n    if not raw.isdigit():\n        raise ValueError(f\"age must be digits, got {raw!r}\")  # specific\n    return int(raw)\n\ndef load_user(row):\n    try:\n        return {\"name\": row[\"name\"], \"age\": parse_age(row[\"age\"])}\n    except ValueError as e:\n        logging.warning(\"skipping row: %s\", e)  # decided — skip & log\n        return None  # caller checks for None\n    # NOTE: we do NOT catch KeyError — that's a programmer bug, let it crash"
          },
          {
            "type": "table",
            "headers": [
              "Style (where)",
              "Strength",
              "Weakness"
            ],
            "rows": [
              [
                "Exceptions (Python, Java)",
                "Clean happy path",
                "Invisible control flow"
              ],
              [
                "Return codes (C, old POSIX)",
                "Cheap, explicit",
                "Easy to forget the check"
              ],
              [
                "Result types (Rust, Haskell)",
                "Compiler enforces",
                "Verbose for simple flows"
              ],
              [
                "Errors as values (Go)",
                "Mid-ground",
                "`if err != nil` everywhere"
              ]
            ]
          }
        ]
      },
      {
        "heading": "The swallowed-exception anti-pattern",
        "body": [
          {
            "type": "p",
            "text": "**`except: pass` is a bug in disguise.** It catches *every* exception — including `KeyboardInterrupt` and `SystemExit` — and throws away the evidence. When something breaks six months later, your logs say nothing. Be specific about what you catch, and at minimum log what you swallow."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "# WRONG — silent failure, hides bugs forever\ntry:\n    result = risky_call()\nexcept:  # catches Ctrl-C too — never do this\n    pass\n\n# BETTER — narrow, logged, intentional\ntry:\n    result = risky_call()\nexcept TimeoutError as e:\n    logging.warning(\"timeout, using cached value: %s\", e)  # decided\n    result = cache.get(key)\n# Anything else bubbles up — as it should"
          },
          {
            "type": "pros-cons",
            "goodLabel": "GOOD FOR",
            "watchLabel": "WATCH OUT FOR",
            "good": [
              "Catching the *narrowest* exception type you can name",
              "Logging context (inputs, ids) before re-raising",
              "Letting programmer-bugs (`KeyError`, `AttributeError`) crash loudly",
              "Wrapping low-level errors in a domain exception with `raise ... from e`"
            ],
            "watch": [
              "Bare `except:` — eats Ctrl-C, masks bugs",
              "`except Exception: pass` — same thing with extra steps",
              "Logging *and* returning a default — caller can't tell what happened",
              "Catching where you can't recover — let it bubble to someone who can"
            ]
          },
          {
            "type": "quote",
            "text": "An exception you swallowed is a bug you'll find in production — at 3am, with no logs.",
            "cite": "every on-call engineer"
          }
        ]
      }
    ]
  },
  "fund-testing-intro": {
    "sections": [
      {
        "heading": "What a test actually proves",
        "body": [
          {
            "type": "p",
            "text": "**A test is a tiny, repeatable experiment that pins down behaviour.** It says: given these inputs, the function returns this output. Run it a thousand times, on any machine, you get the same answer — or the test fails and tells you what changed."
          },
          {
            "type": "p",
            "text": "Tests don't prove your code is **correct** — only that the cases you wrote still work. The art is picking cases that catch the bugs you'd actually ship. Junior trap: testing only the golden path."
          }
        ]
      },
      {
        "heading": "Arrange, Act, Assert",
        "body": [
          {
            "type": "p",
            "text": "**Every test has three parts.** Set up the inputs (arrange), call the thing under test (act), check the result (assert). Keep them visually separated and your future self can read the test in two seconds."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "def add(a, b):\n    return a + b\n\ndef test_add_returns_sum_of_two_positive_ints():\n    # arrange\n    a, b = 2, 3  # inputs chosen to make the expected value obvious\n    # act\n    result = add(a, b)  # one call — the thing under test\n    # assert\n    assert result == 5  # one expectation per test, ideally\n\ndef test_add_handles_negative_numbers():\n    assert add(-2, 3) == 1  # edge case — sign change crosses zero\n\ndef test_add_with_zero_is_identity():\n    assert add(7, 0) == 7  # boundary — zero is the additive identity"
          },
          {
            "type": "practice",
            "lang": "python",
            "prompt": "Add one more edge-case test that you think might break `add`.",
            "varName": "result",
            "starter": "def add(a, b):\n    return a + b\n\n# arrange / act / assert\na, b = 2, 3\nresult = add(a, b)\nassert result == 5\nprint('ok', result)\n",
            "hint": "Try floats, very large numbers, or a string + int. Each surprise is a test worth keeping."
          }
        ]
      },
      {
        "heading": "Naming tests like sentences",
        "body": [
          {
            "type": "p",
            "text": "**A failing test's name is the only message you have at 9am with coffee.** Make it a full sentence: what is being tested, under what condition, what's expected. `test_add` tells you nothing. `test_add_handles_negative_numbers` tells you exactly where to look."
          },
          {
            "type": "table",
            "headers": [
              "Bad name",
              "Better name",
              "Why"
            ],
            "rows": [
              [
                "`test_user`",
                "`test_create_user_rejects_empty_email`",
                "Names the input, condition, and expected behaviour"
              ],
              [
                "`test_1`",
                "`test_parse_returns_none_on_blank_input`",
                "Tells you what failed before you open the file"
              ],
              [
                "`test_works`",
                "`test_login_succeeds_with_valid_credentials`",
                "Distinguishes happy-path from edge-cases"
              ]
            ]
          },
          {
            "type": "pros-cons",
            "goodLabel": "GOOD FOR",
            "watchLabel": "WATCH OUT FOR",
            "good": [
              "Golden path + 2-3 edge cases per function (empty, max, weird)",
              "Tests so fast you run them on every save (sub-second)",
              "TDD as a *thinking* tool — write the test, design the API",
              "One assertion per test — failure points straight at the bug"
            ],
            "watch": [
              "Testing only the happy path — bugs live at the edges",
              "Tests that hit the network or DB without mocks — flaky and slow",
              "Asserting on implementation details — refactors break green tests",
              "One giant test covering ten behaviours — failure tells you nothing"
            ]
          },
          {
            "type": "p",
            "text": "**The rule: fast, focused, few.** Fast so you actually run them. Focused so failures point at one thing. Few so writing tests doesn't become its own project."
          },
          {
            "type": "quote",
            "text": "If it's not tested, it's broken — you just haven't noticed yet.",
            "cite": "Bruce Eckel"
          }
        ]
      }
    ]
  },
  "fund-debugging": {
    "sections": [
      {
        "heading": "Print works — until it doesn't",
        "body": [
          {
            "type": "p",
            "text": "**`print()` is the world's most-used debugger, and that's fine.** It's instant, it's universal, and for 80% of bugs it's enough. But when the bug is intermittent, deep in a call stack, or three hours into a long run, you need sharper tools."
          },
          {
            "type": "p",
            "text": "This lesson is the next rung up: the **interactive debugger**, **rubber-ducking**, **bisecting**, and the underrated **rewrite-the-comment** trick. Pick the right one and bugs that used to take hours collapse to minutes."
          }
        ]
      },
      {
        "heading": "The interactive debugger",
        "body": [
          {
            "type": "p",
            "text": "**A debugger pauses your program at a chosen line and lets you poke around.** Inspect variables, step one line at a time, walk up the call stack. Python's `breakpoint()` is the one-liner gateway — drop it anywhere and the next run drops into `pdb`."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "def compute_discount(price, code):\n    rate = lookup(code)  # suspect this returns None sometimes\n    breakpoint()  # execution pauses here — pdb prompt opens\n    return price * (1 - rate)  # crash when rate is None\n\n# At the (Pdb) prompt:\n#   p price       — print a variable\n#   p rate        — confirm it's None\n#   n             — next line (step over)\n#   s             — step into a call\n#   c             — continue until next breakpoint\n#   w             — where am I in the stack\n#   q             — quit"
          },
          {
            "type": "table",
            "headers": [
              "Tactic",
              "Best for",
              "Cost"
            ],
            "rows": [
              [
                "`print()`",
                "Quick, linear flow",
                "Free, noisy"
              ],
              [
                "`breakpoint()` / pdb",
                "Need to inspect state mid-flight",
                "Slows you down — interactive"
              ],
              [
                "Logging at INFO/DEBUG",
                "Production, can't reproduce locally",
                "Setup once, lasts forever"
              ],
              [
                "`git bisect`",
                "Worked yesterday, broken today",
                "Needs a reliable repro"
              ]
            ]
          }
        ]
      },
      {
        "heading": "Bisecting — binary-search the bug",
        "body": [
          {
            "type": "p",
            "text": "**When something used to work and now doesn't, `git bisect` finds the breaking commit in `log2(n)` steps.** Tell git a known-good and a known-bad commit, and it checks out the midpoint. You test, mark good or bad, repeat. Twenty commits resolve in five checks."
          },
          {
            "type": "diagram",
            "title": "git bisect narrows the suspect",
            "subtitle": "BINARY SEARCH ON HISTORY",
            "height": 220,
            "nodes": [
              {
                "id": "good",
                "label": "v1.0",
                "subtitle": "KNOWN GOOD",
                "accent": "sky",
                "x": 0.3,
                "y": 0.3
              },
              {
                "id": "mid1",
                "label": "midpoint",
                "subtitle": "TEST · MARK",
                "accent": "amber",
                "x": 0.7,
                "y": 0.3
              },
              {
                "id": "mid2",
                "label": "midpoint",
                "subtitle": "NARROWED",
                "accent": "amber",
                "x": 0.3,
                "y": 0.75
              },
              {
                "id": "bad",
                "label": "HEAD",
                "subtitle": "BROKEN",
                "accent": "fire",
                "x": 0.7,
                "y": 0.75
              }
            ],
            "edges": [
              {
                "from": "good",
                "to": "mid1",
                "kind": "dashed",
                "label": "split"
              },
              {
                "from": "mid1",
                "to": "mid2",
                "kind": "dashed",
                "label": "split"
              },
              {
                "from": "mid2",
                "to": "bad",
                "kind": "solid",
                "label": "culprit"
              }
            ]
          },
          {
            "type": "code",
            "lang": "python",
            "text": "# Shell, not Python — but it's the workflow:\n# $ git bisect start\n# $ git bisect bad                  # current HEAD is broken\n# $ git bisect good v1.0            # this tag worked\n# git checks out the midpoint; you test it:\n# $ pytest tests/test_thing.py      # or run the repro\n# $ git bisect good                 # or `bad` — git picks next midpoint\n# repeat until git names the first bad commit\n# $ git bisect reset                # restore HEAD when done"
          }
        ]
      },
      {
        "heading": "Rubber-ducking and the comment trick",
        "body": [
          {
            "type": "p",
            "text": "**Explain the bug, out loud, to an inanimate object.** Half the time you spot the flaw mid-sentence. The act of putting the problem into words forces you to check assumptions you'd been skimming over. The duck is famous for a reason."
          },
          {
            "type": "p",
            "text": "**The comment trick:** before you touch broken code, rewrite the docstring or comment to describe what it *should* do, in plain English. If you can't write it clearly, you don't understand it — that's the bug. If you can, the fix usually writes itself."
          },
          {
            "type": "pros-cons",
            "goodLabel": "GOOD FOR",
            "watchLabel": "WATCH OUT FOR",
            "good": [
              "Forming a hypothesis *before* changing code — test it deliberately",
              "Bisecting any time you have a 'worked yesterday' situation",
              "Logging once and reading the logs, instead of 12 print/run cycles",
              "Stopping the moment you understand the bug — even before the fix"
            ],
            "watch": [
              "Random `print()` peppering with no hypothesis — shotgun debugging",
              "'It works now' without knowing *why* — the bug is still there",
              "Changing two things at once — you'll never know which fixed it",
              "Skipping the repro — fixing what you can't reliably trigger is guessing"
            ]
          },
          {
            "type": "quote",
            "text": "If it works and you don't know why, you haven't fixed it — you've just moved it.",
            "cite": "debugger's first law"
          }
        ]
      }
    ]
  },
  "fund-arrays-lists": {
    "sections": [
      {
        "heading": "Contiguous memory, one box at a time",
        "body": [
          {
            "type": "p",
            "text": "**An array is a row of equally sized boxes sitting next to each other in RAM.** Because they're contiguous, the CPU can jump to box `i` with a single multiply-and-add — `base + i * size`. That math is why random access is O(1)."
          },
          {
            "type": "p",
            "text": "**A Python `list` or JS `Array` isn't a raw array** — it's a *dynamic* array. Underneath sits a fixed-size block of pointers, and when you run out of room, the runtime allocates a bigger block and copies everything over. The illusion of infinite append costs you the occasional resize."
          }
        ]
      },
      {
        "heading": "Why front-insert hurts",
        "body": [
          {
            "type": "p",
            "text": "**Appending to the end is amortized O(1)** — most appends drop into the empty slot at the tail. Once in a while a resize doubles the buffer, and that one append pays O(n). Averaged out, it's still O(1) per call."
          },
          {
            "type": "reveal",
            "question": "What is the time complexity of `list.pop(0)`?",
            "answer": "**O(n)** — popping index 0 forces every remaining element to shift left one slot to close the gap. On a million-item list that's a million memmoves per call. If you find yourself doing it in a loop, reach for `collections.deque` (O(1) at both ends)."
          },
          {
            "type": "p",
            "text": "**Inserting at the front is O(n)** — every existing element has to shuffle right one slot to make room. `list.pop(0)` and `list.insert(0, x)` both pay this tax on every call. If you find yourself doing that in a loop, reach for a `collections.deque` instead."
          },
          {
            "type": "diagram",
            "title": "Random access vs front-insert",
            "subtitle": "ONE MULTIPLY VS N SHIFTS",
            "height": 240,
            "nodes": [
              {
                "id": "idx",
                "label": "index i",
                "subtitle": "INPUT",
                "accent": "water",
                "x": 0.1,
                "y": 0.3
              },
              {
                "id": "calc",
                "label": "base + i*size",
                "subtitle": "POINTER MATH",
                "accent": "fire",
                "x": 0.4,
                "y": 0.3
              },
              {
                "id": "cell",
                "label": "arr[i]",
                "subtitle": "MATCH",
                "accent": "sky",
                "x": 0.78,
                "y": 0.3
              },
              {
                "id": "front",
                "label": "insert at 0",
                "subtitle": "INPUT",
                "accent": "water",
                "x": 0.1,
                "y": 0.78
              },
              {
                "id": "shift",
                "label": "shift n cells",
                "subtitle": "O(N) WORK",
                "accent": "amber",
                "x": 0.5,
                "y": 0.78
              }
            ],
            "edges": [
              {
                "from": "idx",
                "to": "calc",
                "kind": "solid",
                "label": "compute"
              },
              {
                "from": "calc",
                "to": "cell",
                "kind": "solid",
                "label": "fetch"
              },
              {
                "from": "front",
                "to": "shift",
                "kind": "dashed",
                "label": "copy"
              }
            ]
          },
          {
            "type": "interactive-viz",
            "viz": "big-o-race",
            "title": "Big-O at scale",
            "caption": "Drag N. Watch the curves separate at ~1000."
          },
          {
            "type": "table",
            "headers": [
              "Operation",
              "Python list",
              "Why"
            ],
            "rows": [
              [
                "`arr[i]` read",
                "O(1)",
                "Pointer math, one cache line"
              ],
              [
                "`arr.append(x)`",
                "amortized O(1)",
                "Tail slot is free until a resize"
              ],
              [
                "`arr.insert(0, x)`",
                "O(n)",
                "Every element shifts one slot right"
              ],
              [
                "`arr.pop(0)`",
                "O(n)",
                "Same shift, in the other direction"
              ]
            ]
          },
          {
            "type": "code",
            "lang": "python",
            "text": "# Compare three ways to build a list of 100k items.\nimport time, collections\n\nN = 100_000\n\nt = time.perf_counter()\nbad = []  # plain list\nfor i in range(N):\n    bad.insert(0, i)  # O(n) per call — quadratic total\nprint('insert(0):', round(time.perf_counter() - t, 2), 's')\n\nt = time.perf_counter()\nok = []\nfor i in range(N):\n    ok.append(i)  # amortized O(1) — linear total\nprint('append   :', round(time.perf_counter() - t, 3), 's')\n\nt = time.perf_counter()\nbest = collections.deque()  # O(1) push at either end\nfor i in range(N):\n    best.appendleft(i)  # deque is the right tool for front-insert\nprint('deque    :', round(time.perf_counter() - t, 3), 's')"
          },
          {
            "type": "practice",
            "lang": "python",
            "prompt": "Watch the resize cost — see how append stays cheap while front-insert blows up.",
            "varName": "result",
            "starter": "items = []\nfor i in range(5):\n    items.append(i)  # cheap\nfor i in range(5):\n    items.insert(0, -i - 1)  # each shifts everything right\n\nresult = items\nprint(result)\n",
            "hint": "Predict the order before running. Now bump the loop sizes to 1000 and time both halves with `time.perf_counter()`."
          }
        ]
      },
      {
        "heading": "When list is the wrong tool",
        "body": [
          {
            "type": "p",
            "text": "**Lists shine for end-appends and indexed reads.** They struggle when you need fast front operations, frequent membership checks (use a `set`), or stable lookup by key (use a `dict`). Picking the right structure beats clever code every time."
          },
          {
            "type": "pros-cons",
            "goodLabel": "GOOD FOR",
            "watchLabel": "WATCH OUT FOR",
            "good": [
              "Ordered collections you read by index",
              "Streaming results with `.append()` then iterating once",
              "Small data where constant factors matter more than big-O",
              "Backing store for stacks (`.append()` / `.pop()`)"
            ],
            "watch": [
              "`list.insert(0, x)` in a loop — quadratic time, silent on small N",
              "`x in big_list` — O(n); a `set` makes it O(1)",
              "Holding references inside long-lived lists — quiet memory bloat",
              "Mistaking `list.copy()` for deep copy — nested objects still share"
            ]
          },
          {
            "type": "quote",
            "text": "An array is fast because the CPU knows where everything is. Break that promise and you pay in copies.",
            "cite": "the contiguous-memory rule"
          }
        ]
      }
    ]
  },
  "fund-hash-maps": {
    "sections": [
      {
        "heading": "An array with math on the keys",
        "body": [
          {
            "type": "p",
            "text": "**A hash map is an array where the index is computed from the key.** Run `hash(key)` to get a big integer, take it modulo the array length, and that's your bucket. Read or write that slot directly — no scanning, no comparison loop."
          },
          {
            "type": "p",
            "text": "**Python `dict` and JS `Map` are both hash maps.** They look like key-value soup, but underneath they're an array of buckets and a hash function. That's why lookup is O(1) on average — you go straight to the slot."
          }
        ]
      },
      {
        "heading": "Collisions and load factor",
        "body": [
          {
            "type": "p",
            "text": "**Two keys can hash to the same bucket — that's a collision.** Hash maps handle it one of two ways. **Chaining**: each bucket holds a small list of `(key, value)` pairs, walked on read. **Open addressing**: probe the next slot until you find a free one or your key."
          },
          {
            "type": "p",
            "text": "**Load factor is `entries / buckets`.** Once it crosses a threshold (typically ~0.66), the map allocates a bigger array and rehashes everything. That single resize is O(n), but it's rare — averaged in, lookups stay O(1)."
          },
          {
            "type": "diagram",
            "title": "Hash → bucket → match",
            "subtitle": "ONE FUNCTION, TWO STEPS",
            "height": 220,
            "nodes": [
              {
                "id": "key",
                "label": "\"ada\"",
                "subtitle": "KEY",
                "accent": "water",
                "x": 0.3,
                "y": 0.3
              },
              {
                "id": "hash",
                "label": "hash() % n",
                "subtitle": "BUCKET INDEX",
                "accent": "fire",
                "x": 0.7,
                "y": 0.3
              },
              {
                "id": "bucket",
                "label": "buckets[3]",
                "subtitle": "SLOT",
                "accent": "amber",
                "x": 0.3,
                "y": 0.75
              },
              {
                "id": "value",
                "label": "id=42",
                "subtitle": "MATCH",
                "accent": "sky",
                "x": 0.7,
                "y": 0.75
              }
            ],
            "edges": [
              {
                "from": "key",
                "to": "hash",
                "kind": "solid",
                "label": "hash"
              },
              {
                "from": "hash",
                "to": "bucket",
                "kind": "solid",
                "label": "index"
              },
              {
                "from": "bucket",
                "to": "value",
                "kind": "solid",
                "label": "lookup"
              }
            ]
          },
          {
            "type": "table",
            "headers": [
              "Operation",
              "Cost (avg → worst)",
              "Why"
            ],
            "rows": [
              [
                "`d[k]` read",
                "O(1) → O(n)",
                "Worst case: every key collides into one bucket"
              ],
              [
                "`d[k] = v` write",
                "O(1) → O(n)",
                "Same plus occasional resize"
              ],
              [
                "`k in d`",
                "O(1) → O(n)",
                "Hash, then equality-check the bucket"
              ],
              [
                "iterate `d`",
                "O(n)",
                "Walks all buckets in insertion order"
              ]
            ]
          }
        ]
      },
      {
        "heading": "The \"ordered\" guarantee",
        "body": [
          {
            "type": "p",
            "text": "**Modern Python dicts preserve insertion order** (guaranteed since 3.7) and JS `Map` always did. That's a runtime promise on top of the hash table — keys keep the order you inserted them, even though the underlying buckets are scrambled."
          },
          {
            "type": "p",
            "text": "**\"Usually O(1)\" is the honest version.** A pathological key set — say, integers crafted to all hash to the same bucket — can degrade to O(n). Real-world keys (usernames, UUIDs) almost never hit this; CPython adds randomization to the string hash to make adversarial input harder."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "# A realistic users-by-username lookup table.\nusers = {}  # the dict — backed by a hash table\n\nusers['ada']  = {'id': 1, 'role': 'admin'}  # O(1) insert\nusers['alex'] = {'id': 2, 'role': 'member'}\nusers['sam']  = {'id': 3, 'role': 'member'}\n\nprint(users['ada'])         # O(1) lookup by key\nprint('maya' in users)      # O(1) membership — False\n\n# Insertion order is preserved (Python 3.7+):\nfor name, row in users.items():\n    print(name, row['role'])  # ada, alex, sam — in that order\n\n# Compare to scanning a list of dicts: O(n) every lookup.\nslow = [{'name': 'ada', 'id': 1}, {'name': 'alex', 'id': 2}]\nfound = next(u for u in slow if u['name'] == 'ada')  # walks the list"
          },
          {
            "type": "pros-cons",
            "goodLabel": "GOOD FOR",
            "watchLabel": "WATCH OUT FOR",
            "good": [
              "Lookup by key — usernames, ids, cache entries",
              "Counting occurrences — `dict.get(k, 0) + 1` or `Counter`",
              "Deduplicating — a `set` is a dict without values",
              "Grouping — `groups.setdefault(key, []).append(item)`"
            ],
            "watch": [
              "Using mutable objects as keys — lists aren't hashable; tuples are",
              "Assuming worst-case O(1) — adversarial inputs can degrade it",
              "Iterating while mutating — `RuntimeError: dictionary changed size`",
              "Big keys (long strings) — hashing them isn't free"
            ]
          },
          {
            "type": "quote",
            "text": "A dict is an array that took a math class.",
            "cite": "mental model to keep"
          }
        ]
      }
    ]
  },
  "fund-trees-recursion": {
    "sections": [
      {
        "heading": "Each node is a tiny problem",
        "body": [
          {
            "type": "p",
            "text": "**A tree is a node with references to other trees.** That's the whole definition — recursive by construction. A binary tree caps it at two children (`left`, `right`); a general tree has any number. File systems, the DOM, JSON parse outputs — all trees."
          },
          {
            "type": "p",
            "text": "**Recursion is the natural way to walk a tree** because the structure repeats. Whatever you'd do at the root, you also need to do at every subtree. Write the function once, call it on the children, let the call stack do the bookkeeping."
          }
        ]
      },
      {
        "heading": "BFS, DFS, and three flavors of DFS",
        "body": [
          {
            "type": "p",
            "text": "**Breadth-first (BFS)** visits every node at depth `d` before any node at depth `d+1`. Use a queue. Good for shortest-path on unweighted graphs and \"closest match\" problems."
          },
          {
            "type": "p",
            "text": "**Depth-first (DFS)** dives down one branch all the way before backing up. Use recursion (or an explicit stack). Three sub-orders matter for binary trees: **preorder** (root → left → right), **inorder** (left → root → right — gives sorted output for a BST), **postorder** (left → right → root — handy for deletions and folds)."
          },
          {
            "type": "diagram",
            "title": "Tree traversal orders",
            "subtitle": "WHERE 'ROOT' LANDS IN THE SEQUENCE",
            "height": 260,
            "nodes": [
              {
                "id": "root",
                "label": "5",
                "subtitle": "ROOT",
                "accent": "amber",
                "x": 0.5,
                "y": 0.18
              },
              {
                "id": "l",
                "label": "3",
                "subtitle": "LEFT",
                "accent": "water",
                "x": 0.3,
                "y": 0.55
              },
              {
                "id": "r",
                "label": "8",
                "subtitle": "RIGHT",
                "accent": "water",
                "x": 0.7,
                "y": 0.55
              },
              {
                "id": "ll",
                "label": "1",
                "subtitle": "LEAF",
                "accent": "earth",
                "x": 0.18,
                "y": 0.88
              },
              {
                "id": "lr",
                "label": "4",
                "subtitle": "LEAF",
                "accent": "earth",
                "x": 0.42,
                "y": 0.88
              }
            ],
            "edges": [
              {
                "from": "root",
                "to": "l",
                "kind": "solid",
                "label": "left"
              },
              {
                "from": "root",
                "to": "r",
                "kind": "solid",
                "label": "right"
              },
              {
                "from": "l",
                "to": "ll",
                "kind": "solid"
              },
              {
                "from": "l",
                "to": "lr",
                "kind": "solid"
              }
            ]
          },
          {
            "type": "table",
            "headers": [
              "Order",
              "Sequence",
              "Use it for"
            ],
            "rows": [
              [
                "Preorder",
                "root, left, right",
                "Copying / serializing a tree"
              ],
              [
                "Inorder",
                "left, root, right",
                "Sorted output from a BST"
              ],
              [
                "Postorder",
                "left, right, root",
                "Deletion, folds, expression eval"
              ],
              [
                "BFS",
                "level by level",
                "Shortest path, closest neighbor"
              ]
            ]
          }
        ]
      },
      {
        "heading": "Base case + reduction step",
        "body": [
          {
            "type": "p",
            "text": "**Every recursive function has two parts.** The **base case** says \"if the problem is trivial, return the answer directly\" — for a tree, that's usually `if node is None`. The **reduction step** says \"otherwise, do a little work and call yourself on something smaller\" — recurse into children."
          },
          {
            "type": "p",
            "text": "**Miss either half and you crash.** No base case → infinite recursion → `RecursionError`. No reduction → same. The skeleton is always: handle the leaf, then combine results from the smaller subproblems."
          },
          {
            "type": "code",
            "lang": "python",
            "text": "class Node:\n    def __init__(self, val, left=None, right=None):\n        self.val = val\n        self.left = left  # subtree — or None at a leaf\n        self.right = right\n\ndef tree_sum(node):\n    if node is None:  # base case — empty subtree sums to 0\n        return 0\n    # reduction step: sum self + each subtree (smaller problems)\n    return node.val + tree_sum(node.left) + tree_sum(node.right)\n\ndef inorder(node, out):\n    if node is None:  # base case\n        return\n    inorder(node.left, out)   # recurse left first\n    out.append(node.val)      # visit root in the middle\n    inorder(node.right, out)  # then right\n\nroot = Node(5, Node(3, Node(1), Node(4)), Node(8))\nprint(tree_sum(root))   # 21\nvisited = []\ninorder(root, visited)\nprint(visited)          # [1, 3, 4, 5, 8] — sorted, because BST"
          },
          {
            "type": "walkthrough",
            "title": "factorial(3) unwinds step by step",
            "caption": "Watch the call stack grow, then collapse as each return cascades back.",
            "nodes": [
              {
                "id": "f3",
                "label": "factorial(3)",
                "subtitle": "TOP CALL",
                "accent": "amber",
                "x": 0.18,
                "y": 0.5
              },
              {
                "id": "f2",
                "label": "factorial(2)",
                "subtitle": "RECURSE",
                "accent": "fire",
                "x": 0.45,
                "y": 0.5
              },
              {
                "id": "f1",
                "label": "factorial(1)",
                "subtitle": "BASE CASE",
                "accent": "sky",
                "x": 0.78,
                "y": 0.5
              }
            ],
            "steps": [
              {
                "title": "Call factorial(3) — push frame",
                "description": "n is 3, not the base case. Function says `return 3 * factorial(2)` — but factorial(2) hasn't run yet, so the frame waits on the stack.",
                "activeNodes": [
                  "f3"
                ],
                "activeEdges": []
              },
              {
                "title": "Inside, call factorial(2) — push frame",
                "description": "n is 2, still not the base case. Same pattern: `return 2 * factorial(1)`. Now two frames sit on the stack, both paused waiting on a child call.",
                "activeNodes": [
                  "f3",
                  "f2"
                ],
                "activeEdges": [
                  {
                    "from": "f3",
                    "to": "f2",
                    "label": "calls"
                  }
                ]
              },
              {
                "title": "Call factorial(1) — base case hits",
                "description": "n is 1. The base case returns 1 directly — no more recursion. This frame finishes and pops off the stack, handing 1 back up.",
                "activeNodes": [
                  "f2",
                  "f1"
                ],
                "activeEdges": [
                  {
                    "from": "f2",
                    "to": "f1",
                    "label": "calls"
                  }
                ]
              },
              {
                "title": "Returns cascade — 1 → 2 → 6",
                "description": "factorial(1) returns 1, so factorial(2) computes 2*1 = 2 and returns. factorial(3) then computes 3*2 = 6 and returns. Stack is empty. The answer bubbled up the chain.",
                "activeNodes": [
                  "f3"
                ],
                "activeEdges": [
                  {
                    "from": "f1",
                    "to": "f2",
                    "label": "returns 1"
                  },
                  {
                    "from": "f2",
                    "to": "f3",
                    "label": "returns 2"
                  }
                ]
              }
            ],
            "why": "The call stack is the data structure that makes recursion work. Each frame remembers where it was so the result can travel back up when the base case finally fires."
          },
          {
            "type": "pros-cons",
            "goodLabel": "GOOD FOR",
            "watchLabel": "WATCH OUT FOR",
            "good": [
              "Walking trees, parsing nested data, DOM/JSON traversal",
              "Divide-and-conquer — merge sort, quicksort, binary search",
              "Problems where the structure naturally repeats",
              "Solutions that read like the problem statement"
            ],
            "watch": [
              "Forgetting the base case — `RecursionError: maximum depth exceeded`",
              "Deep recursion in Python — default limit is 1000 (use iteration or `sys.setrecursionlimit`)",
              "Recomputing the same subproblem — add memoization or switch to DP",
              "Using recursion when a loop is plainly clearer (e.g., counting to N)"
            ]
          },
          {
            "type": "quote",
            "text": "Recursion is just a loop that uses the call stack as its memory.",
            "cite": "mental model to keep"
          },
          {
            "type": "explain-back",
            "prompt": "You now have three pieces: a **tree of nodes**, the **BFS/DFS traversals** that visit them, and the **base-case + reduction** shape of a recursive function. Design a function that, given the root of a deeply-nested JSON config, returns the *depth* of the most deeply-buried key — explain which traversal you'd reach for and why, and name the one trade-off that would make you abandon recursion for an explicit stack.",
            "modelAnswer": "I'd model each object/array as a node whose children are its values, then write a recursive **DFS** because depth is naturally a property of how far down a single path you've walked — at each node I return `1 + max(depth(child) for child in children)`, with the **base case** being a scalar (or empty container) that returns 0. DFS over BFS here because I care about path length, not level order, and recursion mirrors the nesting one-to-one so the code reads like the problem. The **trade-off I'd watch**: Python caps the call stack near 1000 frames, so a pathologically deep config (or hostile input) blows up with `RecursionError`. The moment depth could exceed that — or I can't trust the input — I'd convert to an explicit stack of `(node, depth)` tuples and loop, trading the clean recursive shape for bounded, heap-backed memory I control.",
            "hint": "Depth is about one path down, not breadth across a level — that picks your traversal. Then ask: what's the hard ceiling on the call stack, and when does it bite?",
            "commit": {
              "q": "Your recursive depth function passes every test, then crashes on a 5,000-level-deep hostile config. What broke?",
              "opts": [
                "The heap filled up because each recursive call copies the subtree it visits",
                "DFS was the wrong traversal — finding max depth requires visiting level by level",
                "Python's call stack caps out near 1,000 frames, raising RecursionError"
              ],
              "answer": 2,
              "why": "Every recursive call pushes a stack frame, and Python's recursion limit sits near 1,000. That hard ceiling is exactly the trigger for switching to an explicit stack."
            }
          }
        ]
      }
    ]
  },
  "fund-stacks-queues": {
    "sections": [
      {
        "heading": "Order is the structure",
        "body": [
          {
            "type": "p",
            "text": "**A stack and a queue both hold a sequence of items — they differ only in which end you take from.** Stack: last in, first out (LIFO). Queue: first in, first out (FIFO). Same storage, different policy."
          },
          {
            "type": "p",
            "text": "**That tiny rule unlocks a lot.** The function call stack, undo history, expression parsing, and depth-first search are all stacks. Print queues, message brokers, breadth-first search, and request handlers are all queues. Spot the order, spot the structure."
          }
        ]
      },
      {
        "heading": "Stack — LIFO, and your code already uses one",
        "body": [
          {
            "type": "p",
            "text": "**Every function call pushes a frame onto the call stack.** That frame holds local variables and the return address. When the function returns, its frame pops off and execution resumes where it left off. Recursion stacks frames; deep recursion overflows the stack."
          },
          {
            "type": "p",
            "text": "**Undo is a stack too.** Each user action pushes a reverse-operation onto a stack. Hit Ctrl-Z and you pop the top entry and apply it. Redo is the mirror image — a second stack you push to when you undo."
          },
          {
            "type": "diagram",
            "title": "Stack push / pop",
            "subtitle": "LAST IN, FIRST OUT",
            "height": 240,
            "nodes": [
              {
                "id": "in",
                "label": "push(C)",
                "subtitle": "INPUT",
                "accent": "water",
                "x": 0.1,
                "y": 0.05
              },
              {
                "id": "top",
                "label": "[C]",
                "subtitle": "TOP",
                "accent": "fire",
                "x": 0.4,
                "y": 0.3
              },
              {
                "id": "mid",
                "label": "[B]",
                "subtitle": "BELOW",
                "accent": "amber",
                "x": 0.4,
                "y": 0.55
              },
              {
                "id": "bot",
                "label": "[A]",
                "subtitle": "BOTTOM",
                "accent": "earth",
                "x": 0.4,
                "y": 0.8
              },
              {
                "id": "out",
                "label": "pop() → C",
                "subtitle": "OUTPUT",
                "accent": "sky",
                "x": 0.78,
                "y": 0.05
              }
            ],
            "edges": [
              {
                "from": "in",
                "to": "top",
                "kind": "solid",
                "label": "push"
              },
              {
                "from": "top",
                "to": "out",
                "kind": "dashed",
                "label": "pop"
              },
              {
                "from": "top",
                "to": "mid",
                "kind": "dashed"
              },
              {
                "from": "mid",
                "to": "bot",
                "kind": "dashed"
              }
            ]
          },
          {
            "type": "code",
            "lang": "python",
            "text": "# A tiny undo system — pure stack semantics on a list.\nundo = []  # the stack: top is the end (.append / .pop)\n\nundo.append(('type', 'A'))  # push — O(1)\nundo.append(('type', 'd'))\nundo.append(('type', 'a'))  # \"Ada\" has been typed\n\nlast = undo.pop()  # ('type', 'a') — LIFO, you get the newest action\nprint('undoing:', last)\nprint('history:', undo)  # [('type', 'A'), ('type', 'd')]\n\n# Same pattern: balanced-brackets check uses a stack.\ndef balanced(s):\n    pairs = {')': '(', ']': '[', '}': '{'}\n    stack = []\n    for ch in s:\n        if ch in '([{':\n            stack.append(ch)  # push opener\n        elif ch in ')]}':\n            if not stack or stack.pop() != pairs[ch]:\n                return False  # mismatch — bracket unbalanced\n    return not stack  # empty stack means everything matched\n\nprint(balanced('([])'))  # True\nprint(balanced('([)]'))  # False"
          }
        ]
      },
      {
        "heading": "Queue — FIFO, and why BFS needs one",
        "body": [
          {
            "type": "p",
            "text": "**A queue serves the oldest item first.** Print jobs run in submission order, message brokers deliver in arrival order, and breadth-first search visits every neighbor at depth `d` before any neighbor at depth `d+1`. That \"oldest first\" promise is the queue."
          },
          {
            "type": "p",
            "text": "**`collections.deque` is the right Python tool** — a double-ended queue with O(1) push and pop at both ends. A plain `list` works as a stack but is O(n) for `pop(0)`, which is what makes naive list-based queues slow."
          },
          {
            "type": "table",
            "headers": [
              "Structure",
              "Add",
              "Remove",
              "Real-world example"
            ],
            "rows": [
              [
                "Stack",
                "push (top)",
                "pop (top)",
                "Function calls, undo history"
              ],
              [
                "Queue",
                "enqueue (back)",
                "dequeue (front)",
                "Print queue, message broker"
              ],
              [
                "Deque",
                "both ends",
                "both ends",
                "BFS frontier, sliding-window scan"
              ]
            ]
          },
          {
            "type": "code",
            "lang": "python",
            "text": "from collections import deque\n\n# A BFS over a tiny graph — queue holds the frontier.\ngraph = {\n    'ada':  ['alex', 'sam'],   # adjacency list\n    'alex': ['maya'],\n    'sam':  ['liam'],\n    'maya': [],\n    'liam': [],\n}\n\ndef bfs(start):\n    seen = {start}\n    frontier = deque([start])  # O(1) push/pop on either end\n    order = []\n    while frontier:\n        node = frontier.popleft()  # FIFO — visit oldest first\n        order.append(node)\n        for nbr in graph[node]:\n            if nbr not in seen:\n                seen.add(nbr)\n                frontier.append(nbr)  # enqueue at the back\n    return order\n\nprint(bfs('ada'))  # ['ada', 'alex', 'sam', 'maya', 'liam']"
          },
          {
            "type": "practice",
            "lang": "python",
            "prompt": "Reverse a string using only stack operations (push every char, then pop them off).",
            "varName": "result",
            "starter": "stack = []\nfor ch in 'recursion':\n    stack.append(ch)  # push each char\n\nout = []\nwhile stack:\n    out.append(stack.pop())  # LIFO unwinds in reverse\n\nresult = ''.join(out)\nprint(result)\n",
            "hint": "A stack reverses anything you pour into it — that's why undo and \"go back\" work the way they do."
          },
          {
            "type": "pros-cons",
            "goodLabel": "GOOD FOR",
            "watchLabel": "WATCH OUT FOR",
            "good": [
              "Stack: undo/redo, parsing, DFS, reversing a sequence",
              "Queue: BFS, scheduling, async work pools, request buffering",
              "Deque: sliding-window algorithms, double-ended history",
              "Anywhere ordering is part of the contract"
            ],
            "watch": [
              "Using `list.pop(0)` as a queue — O(n) per call, switch to `deque`",
              "Stack overflow from unbounded recursion — convert to an explicit stack",
              "Forgetting to mark nodes seen in BFS — infinite loop on cycles",
              "Treating a priority queue as a plain queue — different structure (`heapq`)"
            ]
          },
          {
            "type": "quote",
            "text": "Same boxes, different door. Pick the end and you've picked the algorithm.",
            "cite": "the LIFO vs FIFO rule"
          }
        ]
      }
    ]
  },
  "fund-capstone-tasktracker": {
    "sections": [
      {
        "heading": "What you're building",
        "body": [
          {
            "type": "p",
            "text": "Everything so far was practice reps. This is the real thing: **`tasker`**, a command-line task tracker you build on your own machine, in your own VS Code, and keep forever. By the end you'll type `python tasker.py add \"water the plants\"` in a terminal and your tool will remember it — across reboots, in a file you can open and read."
          },
          {
            "type": "ul",
            "items": [
              "**argparse** — git-style subcommands (`add`, `list`, `done`)",
              "**JSON file I/O** — your data survives the program exiting",
              "**Functions with one job** — the layout that makes testing possible",
              "**pytest** — proof it works, not vibes"
            ]
          },
          {
            "type": "diagram",
            "title": "One command, one round trip",
            "height": 210,
            "caption": "Every command takes the same trip: argparse reads what you typed, one function does the work, the result lands in tasks.json.",
            "nodes": [
              {
                "id": "cmd",
                "label": "Terminal",
                "subtitle": "tasker add",
                "accent": "water",
                "x": 0.1,
                "y": 0.3
              },
              {
                "id": "parse",
                "label": "argparse",
                "subtitle": "reads argv",
                "accent": "sky",
                "x": 0.45,
                "y": 0.3
              },
              {
                "id": "logic",
                "label": "Commands",
                "subtitle": "add · list · done",
                "accent": "amber",
                "x": 0.8,
                "y": 0.3
              },
              {
                "id": "file",
                "label": "tasks.json",
                "subtitle": "load · save",
                "accent": "earth",
                "x": 0.8,
                "y": 0.8
              }
            ],
            "edges": [
              {
                "from": "cmd",
                "to": "parse",
                "kind": "solid",
                "label": "argv"
              },
              {
                "from": "parse",
                "to": "logic",
                "kind": "solid",
                "label": "dispatch"
              },
              {
                "from": "logic",
                "to": "file",
                "kind": "solid",
                "label": "save"
              },
              {
                "from": "file",
                "to": "logic",
                "kind": "dashed",
                "label": "load"
              }
            ]
          },
          {
            "type": "p",
            "text": "**Rules of engagement:** the steps below show you exactly what to type and why — but you type it in **your own editor and terminal**, not in this app. Don't copy-paste. Typing it is where it sticks."
          }
        ]
      },
      {
        "heading": "Set up the project",
        "body": [
          {
            "type": "p",
            "text": "Two minutes of setup buys you a clean, isolated project — the same skeleton you'll use for every Python tool from now on."
          },
          {
            "type": "build-along",
            "title": "Create the project",
            "goal": "A fresh folder with its own virtual environment, git history, and pytest installed. Run each line in your terminal as you click through.",
            "lang": "bash",
            "file": "terminal",
            "steps": [
              {
                "title": "Make the project its own folder",
                "say": "Every project gets its own directory — mixing projects in one folder is how dependency chaos starts.",
                "add": "mkdir tasker && cd tasker  # && only runs cd if mkdir succeeded"
              },
              {
                "title": "Create a virtual environment",
                "say": "A venv is a private Python just for this project. Packages you install here can't break anything else on your machine.",
                "add": "python -m venv .venv  # .venv is the conventional name — tools auto-detect it"
              },
              {
                "title": "Activate it",
                "say": "Activation points `python` and `pip` at the venv. Your prompt grows a (.venv) prefix — that's how you know it worked.",
                "add": "source .venv/bin/activate  # Windows PowerShell: .venv\\Scripts\\Activate.ps1"
              },
              {
                "title": "Install the one dependency",
                "say": "pytest is the test runner. Everything else in this project is the standard library — zero other installs.",
                "add": "pip install pytest  # lands inside .venv only, not system-wide"
              },
              {
                "title": "Start git history + ignore the junk",
                "say": "The venv and Python's bytecode cache are machine-local noise — they never belong in version control.",
                "add": "git init  # version control from minute one, not after it works\nprintf '.venv/\\n__pycache__/\\n' > .gitignore  # keep generated stuff out of git"
              },
              {
                "title": "Create the two files and open VS Code",
                "say": "One file for the tool, one for its tests. That's the whole project.",
                "add": "touch tasker.py test_tasker.py  # empty for now — you fill them next\ncode .  # opens this folder in VS Code"
              }
            ]
          },
          {
            "type": "p",
            "text": "**Sanity check:** run `pytest --version`. If it prints a version number, your setup is done. If it says *command not found*, your venv isn't activated — redo the activate step."
          }
        ]
      },
      {
        "heading": "The data layer — load and save",
        "body": [
          {
            "type": "p",
            "text": "Everything the tool remembers lives in one JSON file. Exactly **two functions** are allowed to touch that file — every other function works on plain Python lists. This split is the most important design decision in the whole project."
          },
          {
            "type": "table",
            "headers": [
              "Field",
              "Type",
              "Example"
            ],
            "rows": [
              [
                "`id`",
                "int",
                "`3` — auto-incremented, never reused"
              ],
              [
                "`title`",
                "str",
                "`\"water the plants\"`"
              ],
              [
                "`done`",
                "bool",
                "`false` — every task starts open"
              ],
              [
                "`created`",
                "str",
                "`\"2026-07-07\"` — ISO date, sorts as text"
              ]
            ],
            "align": [
              "left",
              "left",
              "left"
            ]
          },
          {
            "type": "build-along",
            "title": "tasker.py — part 1 of 3: storage",
            "goal": "Imports, one constant, and the only two functions that ever read or write the file. Type each chunk into tasker.py as you go.",
            "lang": "python",
            "file": "tasker.py",
            "steps": [
              {
                "title": "Imports and the file location",
                "say": "Everything here is the standard library — a tool with zero pip dependencies is a tool that runs anywhere Python does.",
                "add": "import argparse  # stdlib CLI parser — no install needed\nimport json  # tasks persist as human-readable JSON\nfrom datetime import date  # stamps each task with its creation day\nfrom pathlib import Path  # Path objects beat raw strings for file work\n\nTASKS_FILE = Path(\"tasks.json\")  # one constant — change storage in one place"
              },
              {
                "title": "Load — and survive the very first run",
                "say": "The first time anyone runs your tool, tasks.json doesn't exist yet. Handling 'file missing' as a normal case, not an error, is what separates tools that work from tools that crash on day one.",
                "add": "\ndef load_tasks():\n    if not TASKS_FILE.exists():  # first run — the file isn't there yet\n        return []  # empty list, not a crash\n    return json.loads(TASKS_FILE.read_text())  # JSON text -> list of dicts"
              },
              {
                "title": "Save — pretty-printed on purpose",
                "say": "indent=2 makes the file readable by humans and diffable by git. Compact JSON saves bytes you don't care about and costs you debuggability you do.",
                "add": "\ndef save_tasks(tasks):\n    text = json.dumps(tasks, indent=2)  # indent=2 keeps the file readable + git-diffable\n    TASKS_FILE.write_text(text)  # full rewrite — fine at personal-tool scale"
              }
            ]
          },
          {
            "type": "p",
            "text": "**Why the split matters:** if you ever swap JSON for SQLite or a web API, `load_tasks` and `save_tasks` are the *only* two functions that change. Everything you write next has no idea a file exists."
          }
        ]
      },
      {
        "heading": "The commands — add, list, done",
        "body": [
          {
            "type": "p",
            "text": "Each command is one small function that takes plain values and returns plain values. No printing inside the logic, no file access — that comes later, in `main()`. Keep typing into `tasker.py`, right below part 1."
          },
          {
            "type": "build-along",
            "title": "tasker.py — part 2 of 3: the logic",
            "goal": "Three functions, one per command. Each is independently testable because it never touches the terminal or the disk.",
            "lang": "python",
            "file": "tasker.py",
            "steps": [
              {
                "title": "add_task — new ids without a counter file",
                "say": "Deriving the next id from the data itself means there's no separate counter to drift out of sync. The default=0 handles the empty-list case that would otherwise crash max().",
                "add": "\ndef add_task(tasks, title):\n    next_id = max((t[\"id\"] for t in tasks), default=0) + 1  # default=0 covers the empty list\n    task = {\n        \"id\": next_id,\n        \"title\": title,\n        \"done\": False,  # every task starts open\n        \"created\": date.today().isoformat(),  # \"2026-07-07\" — sorts correctly as text\n    }\n    tasks.append(task)  # mutate the list in place; the caller decides when to save\n    return task  # returned so the CLI can print a confirmation"
              },
              {
                "title": "list_tasks — hide the noise by default",
                "say": "Finished tasks are clutter. Defaulting to open-only, with an opt-in flag for everything, is the ADHD-friendly default — and the pattern every good CLI uses.",
                "add": "\ndef list_tasks(tasks, show_all=False):\n    for t in tasks:\n        if t[\"done\"] and not show_all:  # hide finished tasks unless asked\n            continue\n        mark = \"x\" if t[\"done\"] else \" \"  # checkbox-style status column\n        print(f\"[{mark}] {t['id']:>3}  {t['title']}\")  # :>3 right-aligns ids up to 999"
              },
              {
                "title": "complete_task — fail soft, decide loud later",
                "say": "The function reports 'not found' by returning None instead of crashing. Whether that's a polite message or an error exit is main()'s call — logic functions don't get to kill the program.",
                "add": "\ndef complete_task(tasks, task_id):\n    for t in tasks:\n        if t[\"id\"] == task_id:\n            t[\"done\"] = True  # flip the flag; saving is the caller's job\n            return t  # hand back the task for the confirmation message\n    return None  # unknown id — signal it, don't crash here"
              }
            ]
          },
          {
            "type": "p",
            "text": "Notice what's *missing*: none of these functions open files or call `input()`. They take a list, do one thing, and hand back a result. In the test section you'll see exactly why that was worth being strict about."
          }
        ]
      },
      {
        "heading": "Wire it to the terminal — argparse",
        "body": [
          {
            "type": "p",
            "text": "argparse turns `python tasker.py add \"buy milk\"` into a tidy object: `args.command == \"add\"`, `args.title == \"buy milk\"`. Subparsers give you the git-style `tool verb` shape — one subcommand per action."
          },
          {
            "type": "build-along",
            "title": "tasker.py — part 3 of 3: the CLI shell",
            "goal": "Declare the interface, then route each command to its function. After this, the tool is fully usable.",
            "lang": "python",
            "file": "tasker.py",
            "steps": [
              {
                "title": "Declare the interface",
                "say": "This function only DESCRIBES the CLI — what commands exist and what arguments they take. It does zero work. Free bonus: argparse generates --help text from it automatically.",
                "add": "\ndef build_parser():\n    parser = argparse.ArgumentParser(prog=\"tasker\", description=\"Tiny task tracker\")\n    sub = parser.add_subparsers(dest=\"command\", required=True)  # git-style subcommands\n\n    p_add = sub.add_parser(\"add\", help=\"add a new task\")\n    p_add.add_argument(\"title\")  # positional — quote it to include spaces\n\n    p_list = sub.add_parser(\"list\", help=\"show open tasks\")\n    p_list.add_argument(\"--all\", action=\"store_true\")  # a flag: present = True, absent = False\n\n    p_done = sub.add_parser(\"done\", help=\"mark a task complete\")\n    p_done.add_argument(\"task_id\", type=int)  # type=int converts AND validates for you\n    return parser"
              },
              {
                "title": "main — the thin traffic cop",
                "say": "main() is the ONLY function that touches the outside world: argv, the file, and printing. Parse, load, route to one function, save, confirm. Nothing clever lives here — that's the point.",
                "add": "\ndef main():\n    args = build_parser().parse_args()  # bad input exits here with usage help\n    tasks = load_tasks()  # one read at the start\n    if args.command == \"add\":\n        task = add_task(tasks, args.title)\n        save_tasks(tasks)  # persist AFTER the mutation succeeded\n        print(f\"Added #{task['id']}: {task['title']}\")\n    elif args.command == \"list\":\n        list_tasks(tasks, show_all=args.all)  # read-only — nothing to save\n    elif args.command == \"done\":\n        task = complete_task(tasks, args.task_id)\n        if task is None:\n            raise SystemExit(f\"No task #{args.task_id}\")  # message + exit code 1, no traceback\n        save_tasks(tasks)\n        print(f\"Done: {task['title']}\")"
              },
              {
                "title": "The import guard",
                "say": "This line is why your tests can 'import tasker' without the CLI firing. Executed directly, __name__ is \"__main__\" and main() runs; imported, it isn't and main() doesn't.",
                "add": "\nif __name__ == \"__main__\":  # run only when executed, not when imported by tests\n    main()"
              }
            ]
          },
          {
            "type": "p",
            "text": "**Take it for a spin.** Run these in your terminal, in order, and compare against the expected results in the comments:"
          },
          {
            "type": "code",
            "lang": "bash",
            "text": "python tasker.py add \"read one lesson\"  # -> Added #1: read one lesson\npython tasker.py add \"water the plants\"  # -> Added #2 — ids auto-increment\npython tasker.py list  # both tasks, both unchecked\npython tasker.py done 1  # -> Done: read one lesson\npython tasker.py list  # only #2 shows — done tasks hide by default\npython tasker.py list --all  # both again, #1 now [x]\npython tasker.py done 99  # -> No task #99, and exits with code 1\ncat tasks.json  # peek at exactly what your tool saved"
          },
          {
            "type": "p",
            "text": "If something errors, read the traceback **bottom-up**: the last line names the problem, the lines above it point at the exact file and line number. Fix, re-run, repeat — that loop *is* the job."
          }
        ]
      },
      {
        "heading": "Prove it with tests",
        "body": [
          {
            "type": "p",
            "text": "Here's the payoff for keeping logic out of `main()`: tests just import your functions and call them with plain lists. No fake keyboard, no captured screens — for the file test, pytest even hands you a throwaway folder."
          },
          {
            "type": "build-along",
            "title": "test_tasker.py — four tests, whole tool covered",
            "goal": "Each test tells a one-sentence story: given this input, that output. Type them into test_tasker.py.",
            "lang": "python",
            "file": "test_tasker.py",
            "steps": [
              {
                "title": "Test that ids increment",
                "say": "Arrange (empty list), act (add twice), assert (1 then 2). Note there's no file anywhere — add_task works on plain lists, so the test does too.",
                "add": "import tasker  # safe: the __main__ guard stops main() from running on import\n\n\ndef test_add_assigns_incrementing_ids():\n    tasks = []  # in-memory list — no file needed for logic tests\n    first = tasker.add_task(tasks, \"one\")\n    second = tasker.add_task(tasks, \"two\")\n    assert first[\"id\"] == 1  # ids start at 1\n    assert second[\"id\"] == 2  # and increment from the data itself"
              },
              {
                "title": "Test completing — the happy path and the miss",
                "say": "Every function gets both tests: does it work, and does it fail the way we promised. The 'is True' check is stricter than '== True' — it catches accidentally-truthy returns.",
                "add": "\ndef test_complete_flips_done_flag():\n    tasks = []\n    task = tasker.add_task(tasks, \"finish capstone\")\n    result = tasker.complete_task(tasks, task[\"id\"])\n    assert result[\"done\"] is True  # 'is True' rejects truthy-but-wrong values\n\n\ndef test_complete_unknown_id_returns_none():\n    assert tasker.complete_task([], 99) is None  # a miss must signal, never crash"
              },
              {
                "title": "Test the file round trip — safely",
                "say": "tmp_path is a fresh throwaway directory from pytest; monkeypatch redirects TASKS_FILE into it for this one test. Your real tasks.json is never touched — tests that write to real files are tests you learn to fear.",
                "add": "\ndef test_save_then_load_round_trips(tmp_path, monkeypatch):\n    fake = tmp_path / \"tasks.json\"  # tmp_path = throwaway dir pytest creates per test\n    monkeypatch.setattr(tasker, \"TASKS_FILE\", fake)  # point storage at it, auto-undone after\n    tasks = []\n    tasker.add_task(tasks, \"persist me\")\n    tasker.save_tasks(tasks)\n    assert tasker.load_tasks() == tasks  # what you save is exactly what you load"
              }
            ]
          },
          {
            "type": "code",
            "lang": "bash",
            "text": "pytest -v  # -v names each test as it runs — expect 4 passed"
          },
          {
            "type": "p",
            "text": "Four green tests mean you can now change *anything* — rename a function, swap the storage format — and know in five seconds whether you broke something. That safety is what tests actually buy."
          }
        ]
      },
      {
        "heading": "Verify, commit, stretch",
        "body": [
          {
            "type": "ol",
            "items": [
              "Delete `tasks.json`, then run the whole *take it for a spin* sequence again — first-run behavior has to work too",
              "Run `pytest -v` one last time — 4 passed",
              "Run `python tasker.py --help` and admire the docs argparse wrote for you",
              "Commit it — an uncommitted project doesn't exist"
            ]
          },
          {
            "type": "code",
            "lang": "bash",
            "text": "git add tasker.py test_tasker.py .gitignore  # source + tests only — never the venv\ngit commit -m \"CLI task tracker with tests\"  # your first complete, tested tool"
          },
          {
            "type": "h3",
            "text": "Stretch goals — pick ONE and ship it"
          },
          {
            "type": "ul",
            "items": [
              "**`delete` command** — a fourth subcommand; you now know the full recipe",
              "**`--sort created`** on `list` — newest first",
              "**Priorities** — `add --high`, and `list` shows high-priority tasks first",
              "**Search** — `tasker find milk` prints tasks whose title contains the word"
            ]
          },
          {
            "type": "explain-back",
            "prompt": "Your `main()` is a thin traffic cop: parse, load, call one function, save, print. Why was keeping ALL the real logic **out** of `main()` the one design choice that made your tests possible?",
            "hint": "What would a test for `add` have had to fake if the logic lived inside `main()`?",
            "modelAnswer": "Because tests import functions, not terminals. `add_task`, `complete_task`, and `list_tasks` take plain Python values — a list, a string, an int — and return plain values, so a test calls them directly: no fake command-line arguments, no capturing printed output, no real files. `main()` is the only place that touches the messy outside world (argv, the JSON file, printing), and it's so thin there's almost nothing in it to break. This pattern has a name — **pure logic in the core, I/O at the edges** — and it scales from this 60-line tool to production services: the testable core grows, the untested shell stays thin.",
            "commit": {
              "q": "You add a `delete` command next week. Where does the code go?",
              "opts": [
                "Inside `main()` — it's only a few lines",
                "A new `delete_task(tasks, task_id)` function that `main()` calls in one line",
                "Inside `build_parser()` — that's where the subcommand gets declared"
              ],
              "answer": 1,
              "why": "Same shape as the other three commands: logic in a small testable function, `main()` just routes to it. `build_parser()` only *declares* the interface — it never does the work."
            }
          }
        ]
      }
    ]
  },
  "fund-capstone-logdigest": {
    "sections": [
      {
        "heading": "Your mission",
        "body": [
          {
            "type": "p",
            "text": "The training wheels come off. Last capstone you built along; this time you get what working engineers get — **requirements and a contract** — and you write every line yourself in VS Code. Expect to get stuck. Getting unstuck is the workout."
          },
          {
            "type": "p",
            "text": "**The tool:** `logdigest.py`. Point it at a server log file and it prints a one-screen summary — line counts by level, the top error messages, and the time range covered. Ops engineers write throwaway versions of exactly this tool constantly; yours won't be throwaway, because yours will have tests."
          },
          {
            "type": "diagram",
            "title": "The whole tool in one line",
            "height": 170,
            "caption": "Read a log file, crunch it, print a digest. Small tool — but every requirement below is a real-world sharp edge.",
            "nodes": [
              {
                "id": "log",
                "label": "app.log",
                "subtitle": "raw log lines",
                "accent": "water",
                "x": 0.12,
                "y": 0.5
              },
              {
                "id": "tool",
                "label": "logdigest.py",
                "subtitle": "parse · count",
                "accent": "amber",
                "x": 0.5,
                "y": 0.5
              },
              {
                "id": "out",
                "label": "Digest",
                "subtitle": "printed report",
                "accent": "fire",
                "x": 0.88,
                "y": 0.5
              }
            ],
            "edges": [
              {
                "from": "log",
                "to": "tool",
                "kind": "solid",
                "label": "read"
              },
              {
                "from": "tool",
                "to": "out",
                "kind": "solid",
                "label": "print"
              }
            ]
          },
          {
            "type": "h3",
            "text": "Requirements"
          },
          {
            "type": "ul",
            "items": [
              "`python logdigest.py app.log` prints the digest (exact contract below)",
              "`python logdigest.py app.log --level ERROR` prints only the matching raw lines — like grep, but level-aware",
              "Malformed lines (no timestamp or level) **never crash the tool** — they're counted and reported in the digest",
              "Missing file → one clear error line and **exit code 1** (verify with `echo $?`)",
              "All parsing/counting logic lives in functions that take **lists of strings** — only `main()` opens files",
              "At least **4 pytest tests**, all green, none of them touching the disk"
            ]
          }
        ]
      },
      {
        "heading": "The contract",
        "body": [
          {
            "type": "p",
            "text": "Save this as `app.log` — it's your test fixture. Line 7 is deliberately broken; your tool has to shrug it off."
          },
          {
            "type": "code",
            "lang": "text",
            "text": "2026-07-07 09:14:02 INFO Server started on port 8080\n2026-07-07 09:14:05 INFO Health check passed\n2026-07-07 09:15:11 WARN Slow query took 1200ms\n2026-07-07 09:16:40 ERROR Database connection refused\n2026-07-07 09:17:02 INFO Retrying database connection\n2026-07-07 09:17:31 ERROR Database connection refused\nthis line is corrupted -- no timestamp, no level\n2026-07-07 09:21:09 WARN Disk usage at 85 percent\n2026-07-07 09:28:55 ERROR Timeout calling billing service\n2026-07-07 09:31:47 INFO Shutdown requested"
          },
          {
            "type": "p",
            "text": "`python logdigest.py app.log` must produce this. Exact spacing is your call — **the numbers are the contract**:"
          },
          {
            "type": "code",
            "lang": "text",
            "text": "DIGEST  app.log\nlines   10 (1 malformed)\nrange   09:14:02 -> 09:31:47\nINFO    4\nWARN    2\nERROR   3\ntop errors\n  2x Database connection refused\n  1x Timeout calling billing service"
          },
          {
            "type": "table",
            "headers": [
              "You run",
              "It must do"
            ],
            "rows": [
              [
                "`python logdigest.py app.log`",
                "Print the digest above"
              ],
              [
                "`python logdigest.py app.log --level ERROR`",
                "Print only the 3 raw ERROR lines"
              ],
              [
                "`python logdigest.py missing.log`",
                "One error line, exit code 1, no traceback"
              ],
              [
                "`pytest`",
                "All tests green"
              ]
            ],
            "align": [
              "left",
              "left"
            ]
          }
        ]
      },
      {
        "heading": "Success criteria",
        "body": [
          {
            "type": "ol",
            "items": [
              "Digest numbers match the sample exactly: 4 INFO, 2 WARN, 3 ERROR, 1 malformed, range `09:14:02 -> 09:31:47`",
              "Top errors ranked by count — the 2x connection-refused line prints **before** the 1x timeout",
              "`--level` works for all three levels, not just ERROR",
              "`missing.log` exits with code 1 and a human-readable message — a traceback is a fail",
              "`pytest` is green, and every test feeds hand-built lists of strings to your functions — zero file I/O in tests",
              "Cold-start proof: close everything, reopen a fresh terminal, run all four contract rows again"
            ]
          },
          {
            "type": "pros-cons",
            "goodLabel": "IN SCOPE",
            "watchLabel": "OUT OF SCOPE",
            "good": [
              "Parsing with `str.split` — no regex needed",
              "`collections.Counter` (or a plain dict) for counting",
              "argparse with one positional arg + one `--level` option"
            ],
            "watch": [
              "Regex mastery — `split` genuinely is enough here",
              "Streaming gigantic files in chunks — read the whole file",
              "Timezones — treat timestamps as plain sortable text",
              "Colors, progress bars, packaging — ship the boring version first"
            ]
          }
        ]
      },
      {
        "heading": "Hints — open only when stuck",
        "body": [
          {
            "type": "p",
            "text": "Give yourself a real 25-minute wrestle before each peek — the struggle is where the learning compounds. Hints run from gentle nudge to near-spoiler."
          },
          {
            "type": "terms",
            "items": [
              {
                "term": "1 · Where to start",
                "def": "Write `parse_line(line)` first: return `(time, level, message)`, or `None` for malformed. `line.split(\" \", 3)` yields exactly four pieces — date, time, level, message. Fewer than four pieces, or a level that isn't INFO/WARN/ERROR? That's your `None`."
              },
              {
                "term": "2 · Counting levels",
                "def": "`collections.Counter` is a dict where every key starts at 0. Feed it the level from each parsed line and `counts[\"INFO\"]` just works — no key-exists checks."
              },
              {
                "term": "3 · Top errors",
                "def": "Collect the message of every ERROR line into a list, then `Counter(messages).most_common(3)` hands back `(message, count)` pairs already sorted by count."
              },
              {
                "term": "4 · Time range",
                "def": "Timestamps like `09:14:02` sort correctly as plain strings — zero-padded, fixed-width. `min()` and `max()` over the parsed times is the entire feature."
              },
              {
                "term": "5 · Exit code 1",
                "def": "`raise SystemExit(\"logdigest: app.log not found\")` prints the message to stderr and exits with code 1 — no traceback, no imports, one line."
              },
              {
                "term": "6 · Tests without files",
                "def": "Because your functions take lists of strings, a test is one line: `assert parse_line(\"2026-07-07 09:14:02 INFO hi\") == (\"09:14:02\", \"INFO\", \"hi\")`. Paste three sample lines into the test file as a Python list and assert on the counts."
              }
            ]
          }
        ]
      },
      {
        "heading": "Done? Prove it, then level up",
        "body": [
          {
            "type": "ol",
            "items": [
              "Run all four contract rows from a fresh terminal — every one behaves as specified",
              "Run `pytest -v` — green across the board",
              "Commit it"
            ]
          },
          {
            "type": "code",
            "lang": "bash",
            "text": "git add logdigest.py test_logdigest.py app.log  # the sample log ships with the tests\ngit commit -m \"log digest tool\"  # requirements-driven, zero hand-holding"
          },
          {
            "type": "h3",
            "text": "Stretch goals — pick ONE"
          },
          {
            "type": "ul",
            "items": [
              "`--top N` — make the top-errors count configurable (default 3)",
              "Multiple files: `logdigest.py *.log` prints one combined digest",
              "Cron-ready: exit code 2 when ERROR count exceeds a `--max-errors` threshold",
              "Busiest minute: which `HH:MM` had the most lines?"
            ]
          },
          {
            "type": "explain-back",
            "prompt": "The requirements forced one design rule on you: parsing and counting functions take **lists of strings**, and only `main()` opens files. What did that rule buy you when you wrote the tests?",
            "hint": "What would every single test have needed to create on disk otherwise?",
            "modelAnswer": "Every test became a two-liner: hand a small hand-written list of lines to a function, assert on the return value. No fixture files to create, no cleanup, no temp directories, no monkeypatching paths. The filesystem is the slowest and flakiest thing a test can touch — by pushing all file access to the edge (`main()`), the core became pure input → output, which is the easiest possible thing to test. It's the same **logic in the core, I/O at the edges** split from the task tracker — and it's the default shape of every CLI tool you'll ever write.",
            "commit": {
              "q": "Next month the logs start arriving gzipped as `app.log.gz`. With this design, what has to change?",
              "opts": [
                "Every parsing function — they all need to learn about gzip",
                "Only `main()` — it decompresses into lines; the functions never know",
                "The tests — they must regenerate gzipped fixture files"
              ],
              "answer": 1,
              "why": "I/O at the edges pays off exactly here: `main()` swaps `open()` for `gzip.open()`, still hands the same list of strings down, and every function — and every test — is untouched."
            }
          }
        ]
      }
    ]
  },
  "fund-capstone-backup-design": {
    "sections": [
      {
        "heading": "The brief",
        "body": [
          {
            "type": "p",
            "text": "No steps. No hints. No code. This time you're the **architect**: you'll design a small backup tool on paper before a single line exists — the way real projects should start. You make the calls, write down *why*, then check yourself against a strong answer at the end."
          },
          {
            "type": "p",
            "text": "**Scenario.** Maya keeps ~40 GB of photos and documents in one folder on her laptop. She wants a CLI tool — call it `shelfback` — that backs that folder up to a 500 GB external USB drive every night. Your deliverable is the *design*: boxes, file layouts, and failure stories."
          },
          {
            "type": "h3",
            "text": "Hard constraints"
          },
          {
            "type": "ul",
            "items": [
              "Runs **nightly, unattended** — nobody is watching for errors at 3 AM",
              "The drive is sometimes unplugged — a run must fail *safely* and **never corrupt past backups**",
              "Files get renamed and moved often — a rename shouldn't cost a 4 GB re-copy",
              "40 GB today, growing ~5 GB/year, on a 500 GB drive — do the math before picking retention",
              "No cloud, no database servers — files, folders, and standard-library-level tools only",
              "A backup you can't **restore** from is worthless — the restore path is part of the design"
            ]
          }
        ]
      },
      {
        "heading": "Decisions you must make",
        "body": [
          {
            "type": "p",
            "text": "Six decisions, each with a cheap option and an expensive one. There is no universally right column — there are only trade-offs you can or can't defend against the constraints above."
          },
          {
            "type": "table",
            "headers": [
              "Decision",
              "Your options",
              "What it changes"
            ],
            "rows": [
              [
                "Full vs incremental",
                "Copy everything nightly · copy only what changed",
                "Runtime, drive wear, and how many nights of history fit on 500 GB"
              ],
              [
                "Change detection",
                "Modified time · file size · content hash",
                "Speed vs correctness — mtime lies after some copies and restores"
              ],
              [
                "Layout on the drive",
                "Plain mirror · dated snapshot folders · manifest + content store",
                "Restore simplicity vs deduplicating renamed files"
              ],
              [
                "Mid-run failure",
                "Hope · temp file + atomic rename · write the manifest last",
                "Whether a crash can corrupt the previous good backup"
              ],
              [
                "Retention",
                "Keep 1 · keep N nights · nightly/weekly/monthly ladder",
                "How far back \"I deleted it last week\" can reach"
              ],
              [
                "Verification",
                "Trust the copy · re-read and compare hashes",
                "Silent corruption gets caught now — or on restore day"
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
            "text": "**Anchor number:** full snapshots cost 40 GB a night — the drive is full in about 12 nights. If you want weeks of history, something has to give: retention, dedup, or both. Let that number drive your layout decision."
          }
        ]
      },
      {
        "heading": "Your deliverable",
        "body": [
          {
            "type": "p",
            "text": "Timebox: **45 minutes**, paper or whiteboard. Phone-photograph the result — this is portfolio material and your notes for the reveal at the end."
          },
          {
            "type": "ol",
            "items": [
              "**One diagram** — laptop folder, the tool, the drive layout, with arrows for a normal nightly run",
              "**The drive's folder tree after 3 nights** — write out real example paths, not hand-waves",
              "**The failure story** — the drive unplugs at file 200 of 300; narrate what state the drive is in and exactly what the next night's run does",
              "**Three trade-offs, defended** — for each: the option you chose, the option you rejected, and one sentence on why the constraints forced your hand"
            ]
          },
          {
            "type": "pros-cons",
            "goodLabel": "A STRONG DESIGN HAS",
            "watchLabel": "RED FLAGS",
            "good": [
              "A named failure behavior for **every arrow** in the diagram",
              "A restore path Maya could follow from your notes alone",
              "A reason welded to every choice — \"hash, because mtime lies after restores\"",
              "Retention that survives the 40 GB × nights arithmetic"
            ],
            "watch": [
              "\"It just copies the files\" — with no manifest, night 2 can't tell what changed",
              "Failure handling that amounts to \"re-run it and hope\"",
              "\"Keep everything forever\" on a drive that fills in 12 nights of full copies",
              "No restore story — the half of the tool that only matters on the worst day"
            ]
          }
        ]
      },
      {
        "heading": "Defend it, then compare",
        "body": [
          {
            "type": "p",
            "text": "Design in hand? Commit to the checkpoint below, then put your failure story next to a strong model answer. You're not grading yourself on matching it — you're checking whether your design *answers the same questions*."
          },
          {
            "type": "explain-back",
            "prompt": "Walk your design through its worst night: 300 files changed, the drive unplugs at file 200, and tomorrow night the run fires again. What state is the drive in after the failure — and why does the second run produce a correct backup instead of a corrupted mix?",
            "hint": "If the manifest is the LAST thing written, what does its absence tell the next run?",
            "modelAnswer": "A strong design never lets a half-finished run *count* as a backup. One robust shape: each night, `shelfback` copies changed files into an **in-progress area** (a temp folder, or a content store keyed by file hash), and only after every copy lands does it write the night's **manifest** — the small file listing every path and its hash — as the *final* step. The manifest is the commit point: no manifest, no backup. So when the drive unplugs at file 200, the drive holds all previous nights intact plus 200 orphaned copies and **no new manifest** — messy, but nothing corrupted, because past backups were never touched. Tomorrow's run re-scans, compares hashes against the *last completed* manifest, and re-copies what's missing; files already in a hash-keyed store are skipped for free, so the crash cost is minutes, not a 40 GB do-over. That one ordering rule — **data first, manifest last, never modify old backups** — is the same write-ahead idea that makes databases and git safe, scaled down to a folder of photos.",
            "commit": {
              "q": "Your tool crashes halfway through a nightly run. Which design makes the NEXT run safe?",
              "opts": [
                "Overwrite files in place each night — simplest possible layout",
                "Copy data first, write the manifest last, and have each run re-check against the last completed manifest",
                "A lock file that blocks all future runs until a human investigates"
              ],
              "answer": 1,
              "why": "Manifest-last makes finishing atomic: a crashed run simply never happened as far as restores are concerned, and the next run heals it by re-checking. In-place overwrites can corrupt your only copy mid-write; a human-gated lock file breaks the *unattended* constraint on night one."
            }
          },
          {
            "type": "ul",
            "items": [
              "**Score your own failure story:** did it leave every previous night's backup untouched?",
              "Did your next-run behavior work *without a human* doing anything?",
              "Could your rename-heavy constraint survive — or does moving a folder re-copy gigabytes?",
              "If you answered yes twice and defended three trade-offs: that's an architecture review, and you just passed your first one."
            ]
          }
        ]
      }
    ]
  }
};
