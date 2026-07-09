// Daily Practice question bank + day-seeded pickers.
//
// Split out of content.js so the question bank stays OUT of the eager Home
// bundle — Home lazy-loads this module via dynamic import() when the
// DailyPractice card mounts. Everything below was moved VERBATIM from
// content.js (including the local-day seeding fix in localDayIndex); do not
// statically import this file from anything in the eager graph or the
// code-split is undone.

// Daily Practice question bank, indexed by [pathKey][level].
// Falls back to fundamentals/novice when an entry is missing.
//
// Schema (v3):
//   q             — prompt string
//   opts          — array of 3 option strings
//   answer        — index of the correct option (0..2)
//   whyCorrect?   — paragraph explaining what makes the correct option right
//   whyWrong?     — object keyed by option index → string, OR a single string
//                   fallback used for any wrong option not specifically called out.
//                   Use the literal key `default` for the catch-all string.
//   bestPractices?— short practical takeaway / drill recommendation
//   explanation?  — legacy one-line summary (kept for back-compat; new schema
//                   fields take precedence when present)
export const DAILY_QUESTIONS = {
  "fundamentals": {
    "novice": [
      {
        "q": "What does RAM hold while a program runs?",
        "opts": [
          "Working data the CPU needs right now",
          "Permanent files",
          "Network packets"
        ],
        "answer": 0,
        "whyWrong": {
          "1": "Permanent files live on disk (SSD/HDD). RAM loses its contents the moment power is gone.",
          "2": "Network packets briefly pass through RAM, but RAM is general-purpose working memory, not a packet buffer."
        },
        "whyCorrect": "RAM is the CPU's scratch pad — fast, volatile, and the place running programs keep their variables, stacks, and heap allocations while they execute.",
        "bestPractices": "When a process gets sluggish, check memory pressure first (`free -h`, `top`). Out-of-memory usually shows as paging/swap thrash before it shows as CPU pegging."
      },
      {
        "q": "Which command lists files in a directory?",
        "opts": [
          "cat",
          "ls",
          "grep"
        ],
        "answer": 1,
        "whyWrong": {
          "0": "`cat` prints file contents to stdout — it doesn't enumerate the directory.",
          "2": "`grep` searches inside files for a pattern. Useful, but it's a filter, not a directory lister."
        },
        "whyCorrect": "`ls` is the canonical directory listing tool. `ls -lah` adds long-form, hidden files, and human-readable sizes.",
        "bestPractices": "Memorize three forms: `ls` (quick scan), `ls -la` (perms + hidden), `ls -lah` (with sizes). Aliases like `ll` save keystrokes daily.",
        "lessonId": "f3"
      },
      {
        "q": "A \"file path\" is...",
        "opts": [
          "The CPU instruction queue",
          "A network route",
          "The address that locates a file on disk"
        ],
        "answer": 2,
        "whyWrong": {
          "0": "The CPU instruction queue is hardware-internal scheduling — unrelated to user-visible filenames.",
          "1": "Network routes (IPs, hops) move packets between machines. Paths name files within one filesystem."
        },
        "whyCorrect": "A path — like `/home/user/notes.txt` — is a string that names exactly one file inside a filesystem hierarchy.",
        "bestPractices": "Prefer absolute paths in scripts (`/var/log/app.log`) so they don't silently break when the working directory changes."
      },
      {
        "q": "In a Lists exercise you write `a = [1, 2, 3]`, then `b = a`, then `b.append(4)`. What does `a` hold now?",
        "opts": [
          "[1, 2, 3] — assignment copied the list, so `b` grew independently of `a`",
          "[1, 2, 3, 4] — `b = a` made a second label on the same list object",
          "It raises an error, because two variables cannot point at one list"
        ],
        "answer": 1,
        "whyWrong": {
          "0": "Assignment in Python binds a name to an object — it never copies. If you want an independent list you must ask for one explicitly with `a.copy()` or `list(a)`.",
          "2": "Perfectly legal — any number of names can reference one object. That's called aliasing, and it's the default behavior, not an error."
        },
        "whyCorrect": "Every assignment binds a name to an object. `b = a` re-points a second label at the *same* list, so mutating through either name is visible through both. This is the aliasing bug that eats juniors.",
        "bestPractices": "When handing a list to another variable or function, decide consciously: share it (`b = a`) or copy it (`b = a.copy()`). For nested structures, remember `.copy()` is shallow — inner objects still share."
      },
      {
        "q": "Inside a Python conditional like `if value:`, which of these values is truthy?",
        "opts": [
          "The string \"False\" — any non-empty string is truthy, whatever it spells",
          "The float 0.0 — floats are truthy because they aren't the integer 0",
          "The empty list [] — a list is an object, and objects are always truthy"
        ],
        "answer": 0,
        "whyWrong": {
          "1": "Any numeric zero is falsy — 0, 0.0, and 0j all count. The type doesn't matter; the zero-ness does.",
          "2": "Empty containers ([], (), {}, set()) are falsy — Python falls back to `__len__`, and length zero means falsy."
        },
        "whyCorrect": "Truthiness for strings is about length, not spelling. \"False\" has five characters, so `bool(\"False\")` is True. The falsy list is short: None, False, numeric zeros, and empty strings/containers — everything else is truthy.",
        "bestPractices": "Watch the classic trap: `if x:` and `if x is not None:` differ when x is 0 or []. When you mean \"was a value provided?\", write `is not None` explicitly."
      },
      {
        "q": "In Python loops, when does the `else` clause attached to a `for` loop actually run?",
        "opts": [
          "When the loop body raised an exception that was caught somewhere above it",
          "When the loop exited early via `break` — `else` is the 'stopped early' handler",
          "When the loop exhausted naturally, without ever hitting a `break`"
        ],
        "answer": 2,
        "whyWrong": {
          "0": "Exceptions have nothing to do with the loop's `else` — an uncaught exception skips it entirely and propagates. `try/except/else` is a different construct.",
          "1": "Exactly backwards — `break` is the one thing that *skips* the `else`. If it helps, read `else` as `nobreak`."
        },
        "whyCorrect": "The loop `else` runs only when the loop finishes all its iterations without a `break`. Its idiomatic use is search-and-not-found: `break` when you find the needle, and the `else` handles the 'never found it' case.",
        "bestPractices": "Mentally rename `else` to \"no break\" every time you read it. If a loop has no `break` inside, an attached `else` is dead weight — always paired, or not at all."
      },
      {
        "q": "A function defined as `def add(x, bag=[])` keeps growing the same list across separate calls. Why?",
        "opts": [
          "Default values are evaluated once at `def` time, so every call shares one list object",
          "Python memoizes the function's most recent return value, and that cached list leaks into the following call",
          "Lists used as defaults become global variables, so every function in the module shares them"
        ],
        "answer": 0,
        "whyWrong": {
          "1": "Python doesn't memoize function results — you'd have to add `functools.lru_cache` yourself. The state lives in the default object, not in any return-value cache.",
          "2": "The list never becomes global — it's stored on the function object itself (`add.__defaults__`). Other functions can't see it; only repeat calls to `add` share it."
        },
        "whyCorrect": "Defaults are built exactly once, when `def` executes — not per call. A mutable default like `[]` is therefore one shared object that accumulates state across calls. It's the most-failed Python interview question for a reason.",
        "bestPractices": "Use the sentinel pattern: `def add(x, bag=None):` then `if bag is None: bag = []` inside. Reserve mutable defaults for the rare case where you *want* shared state, and comment it loudly."
      },
      {
        "q": "While navigating the filesystem, you run `cd ../logs`. Where do you end up?",
        "opts": [
          "In a `logs` directory inside your home directory — `..` is a shortcut for `~`",
          "In the `logs` directory that sits next to your current directory, one level up",
          "In `/logs` at the root of the filesystem — paths containing `/` are always absolute"
        ],
        "answer": 1,
        "whyWrong": {
          "0": "`..` means the parent of where you are now; `~` is the home-directory shortcut. They only coincide if you happen to be one level below home.",
          "2": "Only a *leading* `/` makes a path absolute. `../logs` starts with `..`, so it's relative — resolved from your current directory, not from root."
        },
        "whyCorrect": "`..` climbs one level to the parent directory, then `/logs` descends into its `logs` child — a sibling of where you started. Relative paths are always resolved against the current working directory.",
        "bestPractices": "In scripts, prefer absolute paths (or anchor with `cd \"$(dirname \"$0\")\"`) so behavior doesn't change with the caller's working directory. Interactively, `cd -` jumps back to wherever you just were.",
        "lessonId": "cli-navigate"
      },
      {
        "q": "In Python file I/O, why is `with open('data.txt') as f:` preferred over a bare `open()` call?",
        "opts": [
          "`with` reads the whole file into memory up front, which makes every later read faster",
          "`with` places an OS-level lock on the file so no other process can modify it while your block runs",
          "The context manager closes the file automatically, even if an exception fires mid-read"
        ],
        "answer": 2,
        "whyWrong": {
          "0": "`with` changes nothing about *how* the file is read — reads are still lazy and buffered. It only manages the open/close lifecycle.",
          "1": "No lock is taken — other processes can still write to the file. File locking is a separate mechanism (`fcntl`, `msvcrt`), not something `with` provides."
        },
        "whyCorrect": "`with` runs the file's cleanup (`close()`) on every exit path — normal completion, `return`, or an exception raised halfway through. Forgotten file handles leak descriptors and can hold buffered writes hostage.",
        "bestPractices": "Reach for `with` on anything that holds a resource: files, sockets, locks, DB connections. If you ever write `f = open(...)` without `with`, you now own a `try/finally: f.close()` — and you will eventually forget it."
      },
      {
        "q": "You're preparing your first commit. What does `git add file.py` actually do?",
        "opts": [
          "Immediately records a permanent snapshot of `file.py` into the repository's commit history",
          "Uploads `file.py` to GitHub so your teammates can see the work in progress",
          "Puts the file's current state into the staging area, marking it for the next commit"
        ],
        "answer": 2,
        "whyWrong": {
          "0": "Nothing is in history until `git commit` runs. `add` only stages — you can keep editing, re-add, or unstage without leaving any trace in the log.",
          "1": "`add` is entirely local — the network is never touched. Sharing with a remote is a separate, explicit step: `git push`."
        },
        "whyCorrect": "`git add` copies the file's current state into the staging area (the index) — a draft of the next commit. That middle layer is what lets you commit some edits while leaving others out.",
        "bestPractices": "Run `git status` before every commit to see what's staged vs merely modified, and `git diff --staged` to review exactly what the commit will contain. Stage deliberately — `git add -p` for piece-by-piece control."
      },
      {
        "q": "Working with dictionaries, what's the practical difference between `d['missing']` and `d.get('missing')`?",
        "opts": [
          "The square brackets raise `KeyError`; `.get()` quietly returns `None` (or a default you pass)",
          "They behave identically — `.get()` is just the older, pre-Python-3 spelling of the same lookup",
          "`.get()` is O(n) because it linearly scans every key, while square brackets hash straight to the bucket"
        ],
        "answer": 0,
        "whyWrong": {
          "1": "They differ exactly on missing keys — brackets raise, `.get()` doesn't. Neither is deprecated; they're two tools for two intents.",
          "2": "Both go through the same hash-table lookup and are O(1) on average. `.get()` differs in error behavior, not in algorithm."
        },
        "whyCorrect": "`d[k]` is the loud version — a missing key raises `KeyError` immediately. `d.get(k)` returns `None`, and `d.get(k, default)` returns your fallback. Same O(1) hash lookup underneath, different failure contract.",
        "bestPractices": "Pick by intent: brackets when the key *must* exist (crash early beats corrupt state), `.get(k, default)` for genuinely optional keys. For counting or grouping, look at `setdefault`, `defaultdict`, and `Counter`.",
        "lessonId": "py-dicts"
      },
      {
        "q": "From the Strings lesson: `s = \"abc\"` then `s[0] = \"z\"` raises `TypeError`. What's going on?",
        "opts": [
          "Index 0 is reserved by CPython for the string's internal length header, so assigning to it is blocked",
          "Strings are immutable — you can't edit one in place, only build a new one and rebind the name",
          "Single characters can only be assigned through `s.replace()`, never with square brackets"
        ],
        "answer": 1,
        "whyWrong": {
          "0": "Index 0 is just the first character — `s[0]` reads 'a' fine. There's no reserved header slot; *every* index assignment on a str fails the same way.",
          "2": "`s.replace()` doesn't assign anything either — it returns a brand-new string and leaves `s` untouched. No method mutates a str; that's the whole point."
        },
        "whyCorrect": "Strings are immutable sequences. Every 'edit' — `replace`, `upper`, slicing, concatenation — builds a new string object; the original can never change. `s = \"z\" + s[1:]` is the idiom: construct and rebind.",
        "bestPractices": "Building a string in a loop with `+=` re-copies every time — collect pieces in a list and `''.join(parts)` once. Immutability is also why strings can serve as dict keys."
      },
      {
        "q": "An HTTP response comes back with status 503. Which status-code family is that, and what does it signal?",
        "opts": [
          "4xx — the client sent something invalid and must fix its request before retrying",
          "3xx — the resource has moved, and the client should follow the `Location` header",
          "5xx — the server failed to handle a valid request; retrying later may succeed"
        ],
        "answer": 2,
        "whyWrong": {
          "0": "4xx blames the *client* — malformed input, missing auth, no such resource. A 503 says the request was fine; the server itself is in trouble.",
          "1": "3xx codes are redirects (301, 302, 304 and friends). A 503 carries no `Location` to follow — it's the server saying 'not right now'."
        },
        "whyCorrect": "The first digit is the family: 5xx means the server side failed — 503 specifically is 'service unavailable', often a deploy, overload, or crashed backend. Unlike a 4xx, the same request can succeed later, which is why clients retry 5xx with backoff.",
        "bestPractices": "Memorize the families before individual codes: 2xx success, 3xx redirect, 4xx client's fault, 5xx server's fault. Retry 5xx with exponential backoff; never blind-retry 4xx — the request itself is the problem."
      },
      {
        "q": "In Python exception handling, when does the `finally` block execute?",
        "opts": [
          "Always — whether the `try` body succeeded, raised, or even returned early",
          "Only when an exception was actually raised — it's the place to log the failure",
          "Only when no exception occurred — it's the success path that follows `try`"
        ],
        "answer": 0,
        "whyWrong": {
          "1": "That's the job of `except` — it runs on failure. `finally` runs on failure *and* success alike; that's what makes it safe for cleanup.",
          "2": "The success-only slot is `else` on a try block. `finally` runs regardless of outcome — including when the exception isn't caught at all."
        },
        "whyCorrect": "`finally` is the guaranteed-exit hook: normal completion, a raised exception, an early `return` — the block runs on every path out of the `try`. That guarantee is why cleanup (closing files, releasing locks) belongs there.",
        "bestPractices": "Full shape: `try` / `except` (failure) / `else` (success only) / `finally` (always). If your `finally` just closes a resource, a `with` block usually says it better.",
        "lessonId": "py-exceptions"
      },
      {
        "kind": "order",
        "q": "Put the steps of loading a web page in the order they happen — from typing the URL to seeing the page.",
        "items": [
          "DNS resolves the domain name to an IP address",
          "A TCP connection opens to that IP",
          "TLS handshake encrypts the connection",
          "The browser sends the HTTP request",
          "The server's response renders as the page"
        ],
        "whyWrong": "The most common flip is putting the HTTP request before TLS — but the request would travel unencrypted. Every layer prepares the ground for the one after it: you can't connect before you know the address, and you can't speak privately before the handshake.",
        "whyCorrect": "Name → connection → encryption → request → response. Each step needs the previous one's output: TCP needs the IP from DNS, TLS needs the open TCP pipe, and HTTP rides inside the encrypted channel.",
        "bestPractices": "When a page won't load, debug in this exact order: can you resolve the name (dig), can you connect (ping/curl -v), does TLS succeed, THEN look at the app."
      },
      {
        "kind": "order",
        "code": true,
        "q": "Arrange this script from the Files & I/O lesson so it writes a config dict to disk and reads it back — everything set up before it's used, the write finished before the read.",
        "items": [
          "import json",
          "config = {'host': 'localhost', 'port': 5432}",
          "with open('config.json', 'w') as f:",
          "    json.dump(config, f, indent=2)",
          "with open('config.json') as f:",
          "    config = json.load(f)"
        ],
        "whyWrong": "The classic flips: putting `json.load` before `json.dump` (the file doesn't exist yet — FileNotFoundError), or putting a `dump`/`load` line above the `with open(...)` that creates `f` (NameError — no file handle to write to). The indented lines only make sense inside their `with` block.",
        "whyCorrect": "Import before use, build the dict before dumping it, open-for-write before writing, and finish the write block before opening for read. Each line consumes something the line above produced: `json` from the import, `config` from the assignment, `f` from each `with open(...)`.",
        "bestPractices": "Always pair file work with `with` — it auto-closes even on exceptions, and closing is what guarantees the write is flushed before the next reader opens the file.",
        "lessonId": "py-fileio"
      },
      {
        "q": "In Python file I/O, opening a file with mode ____ truncates it to zero bytes the moment you open it — even if you never call `write()`.",
        "opts": [
          "'w' (write)",
          "'a' (append)",
          "'x' (create-or-fail)"
        ],
        "answer": 0,
        "whyWrong": {
          "1": "'a' is the safe one — it only ever adds to the end of the file and never destroys existing content.",
          "2": "'x' is the paranoid one — it refuses to open at all if the file already exists, so it can't wipe anything."
        },
        "whyCorrect": "'w' wipes the file at open time, before any write happens. Crash between `open('out.txt', 'w')` and your first `write()` and you've already destroyed the old contents.",
        "bestPractices": "For files you can't afford to half-destroy, write to `out.txt.tmp` and then `os.replace('out.txt.tmp', 'out.txt')` — the rename is atomic, so readers see either the old file or the new one, never a torn middle.",
        "lessonId": "py-fileio"
      },
      {
        "q": "A stack is a ____ structure: every function call pushes a frame holding its locals, and returning pops that frame off the top.",
        "opts": [
          "first-in, first-out (FIFO)",
          "random-access, index-anywhere",
          "last-in, first-out (LIFO)"
        ],
        "answer": 2,
        "whyWrong": {
          "0": "FIFO is the queue's policy — first item in is first item out. If calls returned FIFO, `main` would have to finish before anything it called.",
          "1": "Random access is the array's superpower. A stack deliberately restricts you to one end — that restriction IS the structure."
        },
        "whyCorrect": "Last in, first out: the most recently pushed frame is the first popped, which is exactly why the innermost function returns first and execution resumes where it left off. Undo history and depth-first search run on the same policy.",
        "bestPractices": "When you meet a new problem, ask which end you take from. Need most-recent-first (undo, call frames, DFS)? Stack. Need arrival order (jobs, messages, BFS)? Queue. Spot the order, spot the structure.",
        "lessonId": "fund-stacks-queues"
      }
    ],
    "junior": [
      {
        "q": "Which of these is a process attribute, not a file attribute?",
        "opts": [
          "PID",
          "Owner",
          "Permissions"
        ],
        "answer": 0,
        "whyWrong": {
          "1": "Both files AND processes have owners. The owner attribute exists on both, so it's not exclusive to processes.",
          "2": "Permissions (rwx for user/group/other) are a file/inode attribute. Processes have a UID and capabilities, not chmod-style bits."
        },
        "whyCorrect": "PID — Process ID — only exists for live processes. It's the kernel's handle into the task struct and dies with the process.",
        "bestPractices": "Use `ps -ef` or `pgrep -fl name` to map processes to PIDs. Never hard-code PIDs in scripts — pgrep/pidof at runtime."
      },
      {
        "q": "What does \"stdin\" usually refer to?",
        "opts": [
          "A storage device",
          "Standard input stream",
          "A scheduler"
        ],
        "answer": 1,
        "whyWrong": {
          "0": "Storage devices show up under `/dev/sd*` or `/dev/nvme*`. stdin is file descriptor 0, not a physical device.",
          "2": "The scheduler is a kernel component that picks the next process to run. stdin is just a stream."
        },
        "whyCorrect": "stdin is file descriptor 0 — the default input stream a program reads from. By default it's the terminal, but pipes and `<` redirect it.",
        "bestPractices": "Build CLIs that read from stdin when no file arg is given. It composes cleanly with pipes (`grep ERROR < log.txt` or `cat log.txt | grep ERROR`)."
      },
      {
        "q": "You run `cmd 2>&1 > out.log` to redirect both streams into the file, but errors still print to the terminal. Why?",
        "opts": [
          "Redirects apply left to right — fd2 copied fd1 while it still pointed at the terminal, before fd1 moved to the file",
          "stderr can never share a file with stdout; capturing both always requires two separate log files",
          "The shell buffers stderr differently from stdout, so error lines flush to the terminal before the redirect has a chance to take effect"
        ],
        "answer": 0,
        "whyWrong": {
          "1": "They can absolutely share — `cmd > out.log 2>&1` (or bash's `&>`) does exactly that. The problem here is only the ordering of the two redirects.",
          "2": "Buffering affects *when* output appears, never *where* it goes. Redirection wiring is fixed before the command starts, purely by left-to-right evaluation."
        },
        "whyCorrect": "`2>&1` means 'make fd2 a copy of wherever fd1 points *right now*'. Written first, fd2 duplicates the terminal; then fd1 alone moves to the file. The working order is `cmd > out.log 2>&1` — stdout to the file first, then stderr copies it.",
        "bestPractices": "Memorize the correct form `> file 2>&1` — it's in every Dockerfile, systemd unit, and CI script you'll read. In bash, `&> file` is the shortcut, but it isn't POSIX."
      },
      {
        "q": "In a shell script you write `if grep -q ERROR app.log; then alert; fi`. What makes this idiom work when searching with grep?",
        "opts": [
          "`-q` makes grep return the count of matches, and the shell treats any number over zero as true",
          "The `if` checks whether grep printed any output — quiet mode prints nothing only when the search fails",
          "grep's exit code — 0 when a match is found, 1 when not — and `if` runs the body on exit 0"
        ],
        "answer": 2,
        "whyWrong": {
          "0": "Counting is `-c`, and it goes to stdout, not the return status. `-q` suppresses output entirely and communicates through the exit code alone.",
          "1": "`if` never looks at output — it tests the command's exit status. With `-q`, grep prints nothing in *either* case and exits the moment it finds a match."
        },
        "whyCorrect": "Shell `if` runs a command and branches on its exit code: 0 is success. grep exits 0 on match, 1 on no match (2 on error), and `-q` silences output while exiting early on the first hit — perfect for conditionals.",
        "bestPractices": "This convention powers `&&` and `||` chains too: `grep -q pattern file && do_thing`. Remember exit 0 = true in shell — the opposite of most programming languages.",
        "lessonId": "cli-grep"
      },
      {
        "q": "You set `MODE=dev` in your shell without `export`, then run a Python script that reads environment variables. What does `os.getenv('MODE')` return?",
        "opts": [
          "'dev' — every variable you set in a shell automatically becomes part of the environment that children inherit",
          "None — a bare assignment stays shell-local; only exported variables are copied into child processes",
          "'dev', but only if the script is launched from the same terminal window as the assignment"
        ],
        "answer": 1,
        "whyWrong": {
          "0": "Bare assignments are shell-local by design. Only `export` promotes a variable into the environment block that `fork()` hands to children.",
          "2": "Same window isn't enough — the boundary is process inheritance, not the terminal. Without `export`, even a child launched from that exact shell sees nothing."
        },
        "whyCorrect": "`MODE=dev` creates a shell variable; `export MODE=dev` promotes it into the environment that child processes inherit. The Python script is a child process, so without the export it sees nothing and `getenv` returns None.",
        "bestPractices": "One-off runs can inline it: `MODE=dev python app.py` exports for just that command. In code, use `os.environ['X']` for required config (crash loudly at boot) and `os.getenv('X', default)` for true optionals — and cast, env values are always strings.",
        "lessonId": "cli-env"
      },
      {
        "q": "SSH refuses to connect to a server you've used for months: 'REMOTE HOST IDENTIFICATION HAS CHANGED'. What does this mean?",
        "opts": [
          "The server's host key no longer matches the fingerprint pinned in your `known_hosts` — the machine was rebuilt, or someone is intercepting",
          "Your private key has expired — SSH keypairs must be regenerated on a fixed schedule, and yours lapsed while the server config kept the old public half",
          "The server rotated its TLS certificate, so the certificate authority no longer vouches for the hostname you're dialing"
        ],
        "answer": 0,
        "whyWrong": {
          "1": "SSH keys don't expire on a schedule, and a client-key problem shows up as an authentication failure — this error fires *before* auth, during host verification.",
          "2": "SSH doesn't use TLS or certificate authorities. Trust comes from pinning the host key in `known_hosts` on first connect — that pinned fingerprint mismatching is exactly this error."
        },
        "whyCorrect": "On first connect, SSH pins the server's host key into `~/.ssh/known_hosts`. If the key later changes, SSH refuses rather than silently trusting — either the server was legitimately rebuilt, or you're being man-in-the-middled. The refusal is a feature.",
        "bestPractices": "Don't reflexively delete the `known_hosts` line — first confirm out-of-band (with whoever runs the box) that the host was reprovisioned. If it was, remove just that entry with `ssh-keygen -R hostname` and re-verify the new fingerprint.",
        "lessonId": "f5"
      },
      {
        "q": "A teammate pushed commits to GitHub. You run `git fetch`. Where do their commits now live on your machine?",
        "opts": [
          "Directly in your local `main` and working directory — fetch is how you sync everything in one shot",
          "Nowhere yet — fetch only queries the remote for changes and prints a summary without downloading them",
          "In `origin/main`, your remote-tracking branch — your own `main` and working files are untouched"
        ],
        "answer": 2,
        "whyWrong": {
          "0": "That's `git pull`, which is literally fetch *plus* merge. Fetch alone deliberately leaves your branch and files exactly where they were.",
          "1": "Fetch does download the commits — they're safely in your object store. What it doesn't do is integrate them into your branch."
        },
        "whyCorrect": "Fetch updates `origin/main` — your local, read-only cache of what the remote looked like at fetch time — and touches nothing else. That separation lets you inspect incoming work (`git log main..origin/main`) before merging it.",
        "bestPractices": "Fetch-then-look beats blind pulling on unfamiliar repos: `git fetch` then `git log --oneline main..origin/main` shows exactly what's incoming. Remember `pull = fetch + merge` — it's two operations wearing one name."
      },
      {
        "q": "You merge a feature branch and Git fast-forwards instead of creating a merge commit. What made that possible?",
        "opts": [
          "The branch contained only a single commit, and single commits never warrant a merge commit",
          "`main` hadn't moved since you branched, so Git just slid the `main` pointer forward",
          "You had `--no-ff` disabled in your Git config, which forces every merge to fast-forward"
        ],
        "answer": 1,
        "whyWrong": {
          "0": "Commit count is irrelevant — a 50-commit branch fast-forwards fine if `main` never diverged, and a 1-commit branch needs a merge commit if it did.",
          "2": "There's no such toggle — `--no-ff` is a per-merge flag that *prevents* fast-forwarding. Whether ff is possible depends on history shape, not config defaults."
        },
        "whyCorrect": "Fast-forward happens when the target branch is a direct ancestor of yours — no divergence, nothing to reconcile. Git just moves the `main` pointer to your branch tip: no new commit, linear history. If `main` gained commits meanwhile, Git must create a two-parent merge commit instead.",
        "bestPractices": "Pick a policy: `--ff-only` keeps history strictly linear (fails when divergence exists, prompting a rebase), `--no-ff` always records that a feature branch existed. Either beats letting history shape vary by accident."
      },
      {
        "q": "You update a DNS A record, but users keep hitting the old IP for hours. The record's TTL was 86400. What's the cause?",
        "opts": [
          "Resolvers worldwide cache the old answer until its TTL runs out — a day-long TTL means up to a day of stale traffic",
          "The change is still replicating from the root servers down through the TLD servers, which takes most of a day for a `.com` domain",
          "Your registrar batches DNS edits and publishes them in a single daily push at midnight UTC"
        ],
        "answer": 0,
        "whyWrong": {
          "1": "Root and TLD servers never hold your A record — they only delegate, pointing resolvers at your authoritative nameserver, which answers with the new value immediately. The delay lives in resolver caches.",
          "2": "Authoritative updates typically publish within seconds or minutes. Even after publishing, though, every resolver that cached the old record keeps serving it until TTL expiry — that's the real wait."
        },
        "whyCorrect": "TTL is a promise to resolvers: 'this answer is good for N seconds.' With TTL=86400, any resolver that cached the old IP just before your change will serve it for up to 24 more hours, and you can't recall it. The authoritative server updated instantly — the caches didn't.",
        "bestPractices": "Before a migration, drop the TTL to 60–300s a full old-TTL-period ahead of the cutover, migrate, then raise it back. And verify with `dig` against multiple resolvers — one machine's answer proves nothing about the world's caches."
      },
      {
        "q": "Your code pops from the front of a Python list — `pop(0)` in a hot loop — and slows to a crawl as the list grows. Why is that O(n) per call, and what's the fix?",
        "opts": [
          "Popping the front invalidates the list's internal hash index, forcing a full rebuild of the bucket array — switch to a `set` for O(1) removal",
          "The list re-sorts itself after every removal to keep elements in order, and sorting costs O(n log n) each time",
          "Every remaining element shifts left one slot to close the gap — use `collections.deque` for O(1) pops at both ends"
        ],
        "answer": 2,
        "whyWrong": {
          "0": "Lists have no hash index — they're contiguous arrays addressed by position. Hash buckets belong to dicts and sets, and a set can't replace a queue anyway: it has no order.",
          "1": "Lists never sort themselves — order is exactly insertion order unless *you* call `.sort()`. The cost here is memmove, not comparison."
        },
        "whyCorrect": "A list is a contiguous array. Removing index 0 leaves a hole at the front, so every remaining element must shuffle one slot left — n moves per pop, quadratic across the loop. `collections.deque` is built for this: O(1) `popleft()` and `appendleft()`.",
        "bestPractices": "Match structure to access pattern: list for end-appends and indexed reads, deque for either-end queues, set for membership tests, dict for key lookup. `pop(0)` or `insert(0, x)` inside a loop is a code smell worth a benchmark."
      },
      {
        "q": "A test 'worked yesterday' and fails today, with 60 commits landed in between. Which debugging move beats print statements here?",
        "opts": [
          "Add logging to every function the failing test touches, rerun once, and read the whole trace from top to bottom",
          "Bisect — binary-search the commit range, testing the midpoint each time: about 6 checks instead of 60",
          "Revert all 60 commits and reapply them one at a time, running the full test suite after each one"
        ],
        "answer": 1,
        "whyWrong": {
          "0": "Logging shows you *how* it fails now, not *which change* broke it. With a known-good yesterday, the commit history is the search space — use it.",
          "2": "That's a linear scan — 60 reapply-and-test cycles, plus reverting published history creates its own mess. Bisection gets the same answer in log2(60) ≈ 6 checks without rewriting anything."
        },
        "whyCorrect": "When you have a known-good state and a known-bad state, binary search finds the breaking change in log2(n) steps. `git bisect` automates it: mark good and bad, Git checks out midpoints, you test and mark, and it corners the guilty commit.",
        "bestPractices": "If the test is scriptable, `git bisect run ./test.sh` does the whole hunt unattended. The prerequisite is a reliable repro — bisecting a flaky test just teaches you to distrust bisect.",
        "lessonId": "fund-debugging"
      },
      {
        "kind": "order",
        "q": "Order the git workflow for sharing a change — from editing a file to teammates seeing it.",
        "items": [
          "Edit the file in your working directory",
          "Stage the change with git add",
          "Commit the snapshot with a message",
          "Push the commit to the remote",
          "Teammates pull it into their copies"
        ],
        "whyWrong": "Commit-before-add is the classic trip: git only commits what's STAGED, so an unstaged edit silently stays out of the snapshot. Push doesn't send files — it sends commits.",
        "whyCorrect": "Working directory → staging area → local history → remote → everyone else. Each git command moves the change exactly one station down the line.",
        "bestPractices": "Run git status between every step until the flow is muscle memory — it names which station your change is currently sitting at."
      },
      {
        "kind": "order",
        "code": true,
        "q": "Arrange this pytest test into the Arrange · Act · Assert shape — inputs set up first, one call to the thing under test, then the expectation.",
        "items": [
          "def test_add_handles_negative_numbers():",
          "    a, b = -2, 3  # arrange",
          "    result = add(a, b)  # act",
          "    assert result == 1  # assert"
        ],
        "whyWrong": "Asserting before acting checks a `result` that doesn't exist yet (NameError). Acting before arranging calls `add` on names that haven't been bound. And nothing runs at all until the `def` line opens the test function — pytest discovers tests by that name.",
        "whyCorrect": "Arrange, Act, Assert is a dependency chain: the assert needs `result`, `result` needs the call, and the call needs its inputs. The `def` line comes first because everything else lives indented inside it.",
        "bestPractices": "Keep the three parts visually separated — one blank line or a `# arrange / # act / # assert` comment each — and name the test like a sentence (`test_add_handles_negative_numbers`), so a red test tells you what broke before you open the file.",
        "lessonId": "fund-testing-intro"
      },
      {
        "q": "A hash map finds a value's bucket by computing ____, which is why average lookup is O(1) — you go straight to the slot with no scanning.",
        "opts": [
          "a binary search over the sorted key array",
          "`hash(key)` modulo the bucket count",
          "a linear walk comparing each stored key"
        ],
        "answer": 1,
        "whyWrong": {
          "0": "Binary search is the sorted array's trick — O(log n), and it needs the keys kept in order. Hash maps keep no order at all; that's part of the bargain.",
          "2": "A linear walk is O(n) — that's what the hash exists to avoid. The only walking is inside one bucket when two keys collide."
        },
        "whyCorrect": "`hash(key) % buckets` turns any key into an array index in constant time. Python `dict` and JS `Map` both work this way: an array of buckets plus a hash function, dressed up as key-value soup.",
        "bestPractices": "This is why dict keys must be hashable (immutable): mutate a key after insert and its hash no longer points at the bucket it lives in. Reach for a dict whenever the question is 'have I seen this key before?'",
        "lessonId": "fund-hash-maps"
      },
      {
        "q": "A config loader runs `retries = config.get(\"retries\") or 3`. A user sets `\"retries\": 0` to disable retrying, yet the app still retries 3 times. What's the bug?",
        "opts": [
          "`or` evaluates to a boolean, so `retries` ends up as `True` rather than the number the user configured",
          "`0` is falsy, so `or` throws away the user's explicit value and falls through to the default `3`",
          "`config.get` raises `KeyError` when the key is missing, so the `or` default can never actually run"
        ],
        "answer": 1,
        "whyWrong": {
          "0": "Python's `or` returns one of its operands, never a coerced boolean — that's exactly what makes it usable as a default-picker (and what makes this trap possible).",
          "2": "That's the difference between `d[key]` and `d.get(key)` — `.get` returns `None` on a missing key instead of raising, which is why the `or` fallback fires at all."
        },
        "whyCorrect": "`x or default` replaces EVERY falsy value — `None`, but also `0`, `\"\"`, and `[]`. The user's explicit `0` is indistinguishable from 'not set', so it silently becomes `3`.",
        "bestPractices": "When zero or empty is a legal value, use `config.get(\"retries\", 3)` — the second argument only applies when the key is truly missing. Reserve `x or default` for cases where all falsy values really should fall through.",
        "lessonId": "py-conditionals"
      },
      {
        "q": "This cleanup loop — `for task in tasks:` then `if task.done: tasks.remove(task)` — leaves some finished tasks in the list whenever two of them sit next to each other. What's the bug?",
        "opts": [
          "`remove()` shifts every later item one slot left, so the iterator skips the element right after each removal",
          "Python locks a list while it's being iterated, so each `remove()` raises `RuntimeError` and the loop silently aborts early",
          "`remove()` matches by identity, so tasks that are equal but not the same object never get deleted"
        ],
        "answer": 0,
        "whyWrong": {
          "1": "That protection exists for dicts and sets — changing their keys mid-iteration raises `RuntimeError`. Lists let you mutate freely and just misbehave quietly, which is worse.",
          "2": "`remove()` deletes the first item that compares equal (`==`), not identical. Matching isn't the problem here — the shifting indices are."
        },
        "whyCorrect": "Removing an item shifts everything after it one position left, but the loop's internal index still advances — so the element that slid into the removed slot is never visited. Adjacent done tasks: the first is removed, the second is skipped.",
        "bestPractices": "Never mutate a list you're iterating. Build the survivors instead — `tasks = [t for t in tasks if not t.done]` — or iterate a copy (`for task in tasks[:]`) when you must delete in place.",
        "lessonId": "py-loops"
      }
    ],
    "senior": [
      {
        "q": "What is the kernel's primary job?",
        "opts": [
          "Drawing the UI",
          "Hosting web servers",
          "Mediating between hardware and software"
        ],
        "answer": 2,
        "whyWrong": {
          "0": "UI drawing is a userspace concern (X11, Wayland, the compositor). The kernel exposes input devices and framebuffers; it doesn't draw widgets.",
          "1": "Web servers (nginx, Apache) are userspace processes. The kernel gives them sockets, but doesn't serve HTTP itself."
        },
        "whyCorrect": "The kernel arbitrates access to CPU, memory, disks, and network — exposing safe syscall interfaces so user processes don't corrupt each other or the hardware.",
        "bestPractices": "When perf is mysterious, profile syscalls (`strace -c`, `perf trace`). Userspace bugs often hide as \"kernel slowness\" until you see the syscall pattern."
      },
      {
        "q": "A Python service does heavy CPU-bound math. You add 8 threads and throughput doesn't move. Through the processes-vs-threads lens, what's the fix?",
        "opts": [
          "Pin each thread to its own core with `taskset` so the scheduler stops bouncing them between CPUs",
          "Raise the thread count to 32 — beyond a threshold the GIL begins time-slicing efficiently enough to approximate parallelism",
          "Use a process pool — each process carries its own GIL, so the cores can genuinely run in parallel"
        ],
        "answer": 2,
        "whyWrong": {
          "0": "Core pinning can't help — the GIL admits one thread into the bytecode interpreter at a time no matter which cores the threads sit on. Seven of your eight threads are waiting on a lock, not on the scheduler.",
          "1": "There is no threshold where the GIL relents — pure-Python CPU work is single-core at any thread count. More threads just add lock contention and context-switch overhead."
        },
        "whyCorrect": "CPython's Global Interpreter Lock allows one thread to execute Python bytecode at a time — threads give zero CPU parallelism. A `ProcessPoolExecutor` sidesteps it: one interpreter and one GIL per worker, so 8 workers really use 8 cores. The tax is pickling arguments across the process boundary.",
        "bestPractices": "Split by bottleneck: threads for I/O-bound work (the GIL is released during blocking syscalls), processes for CPU-bound work, C-extension libraries (NumPy, Polars) when they drop the GIL internally. Real services often layer both — gunicorn's `--workers N --threads M`.",
        "lessonId": "processes-threads"
      },
      {
        "q": "On Linux, `malloc` of 1 TB succeeds instantly on a 16 GB box. How does virtual memory & paging make that sane — and when does the bill arrive?",
        "opts": [
          "The kernel overcommits: pages get backed by physical RAM only on first touch, and if memory truly runs out the OOM killer picks a victim",
          "The allocation is silently truncated to the physical RAM available at that moment, so the pointer you received really covers only a few GB",
          "malloc transparently reserves the full terabyte in swap space on disk at allocation time, then migrates hot pages into RAM as you use them"
        ],
        "answer": 0,
        "whyWrong": {
          "1": "Nothing is truncated — you really can address the whole region, and writes beyond the first few GB fault in normally. The lie is about *backing*, not size: pages materialize on first write.",
          "2": "Swap isn't reserved up front either — allocation creates page-table bookkeeping only. Swap enters later, as eviction overflow under memory pressure, not as a pre-paid reservation."
        },
        "whyCorrect": "Linux overcommits by default: `malloc` hands out virtual address space, which costs nothing until a page is first touched and the kernel must find a real frame. When RAM plus swap can't cover a fault, the OOM killer selects a process by `oom_score` and kills it — often not the one that actually bloated.",
        "bestPractices": "Monitor RSS (resident, real) not VSZ (virtual, the lie). In containers, remember cgroup limits OOM silently inside the cgroup — check `memory.events` rather than host dmesg. And treat a non-null `malloc` return as meaningless for capacity planning.",
        "lessonId": "virtual-memory"
      },
      {
        "q": "From the File Systems lesson: `write()` returned success, the machine lost power seconds later, and the data is gone. Why wasn't the write durable?",
        "opts": [
          "The filesystem journal records only metadata intent, never file contents, which means any file data written since the last mount is discarded after a crash",
          "The bytes were sitting in the page cache — only `fsync()` forces them to storage, and nobody called it",
          "The disk's write head needs several seconds to spin up from idle, and the power cut arrived before the hardware finished waking"
        ],
        "answer": 1,
        "whyWrong": {
          "0": "Journaling modes do vary (writeback vs ordered vs data), but no mode discards everything since mount — the journal protects filesystem *structure*. The actual gap here is that the data never left RAM.",
          "2": "Spin-up isn't the issue (and SSDs don't spin at all) — the kernel simply hadn't issued the write to the device yet. `write()` success means 'the kernel accepted these bytes', nothing more."
        },
        "whyCorrect": "Linux buffers writes in the page cache and flushes lazily — a successful `write()` promises acceptance, not persistence. `fsync(fd)` is the durability barrier: it blocks until data and metadata reach storage. That per-commit fsync on the WAL is exactly what bounds database transaction throughput.",
        "bestPractices": "For anything crash-critical: write, `fsync` the file, and fsync the containing directory if you created or renamed it. Remember `close()` does not imply fsync. This is also why moving a database's WAL onto low-fsync-latency NVMe is the cheapest perf win going.",
        "lessonId": "file-systems"
      },
      {
        "q": "An attacker records months of HTTPS traffic, then steals the server's private certificate key. With TLS 1.3, why can't they decrypt the recordings?",
        "opts": [
          "Sessions are encrypted with the certificate authority's key rather than the server's, and the CA's key never leaves the certificate authority",
          "TLS 1.3 servers rotate their certificate keys every 24 hours automatically, so a stolen key only ever exposes the current day of traffic",
          "Forward secrecy — each session key comes from an ephemeral Diffie-Hellman exchange; the certificate key only signs the handshake"
        ],
        "answer": 2,
        "whyWrong": {
          "0": "The CA never encrypts traffic — it only signs certificates to vouch for identity. Session encryption keys are derived between client and server; no CA key could decrypt anything.",
          "1": "Rotation frequency isn't the defense, and certs commonly live for 90 days. Even an unrotated key can't decrypt recordings, because it never encrypted the sessions in the first place."
        },
        "whyCorrect": "In TLS 1.3 the key_share exchange is ephemeral Diffie-Hellman: both sides derive a fresh session secret that is never transmitted and is discarded afterward. The server's long-term key only signs the handshake transcript to prove identity. Steal it tomorrow and yesterday's traffic stays sealed — that's forward secrecy.",
        "bestPractices": "When auditing TLS configs, the cipher-suite tell is ECDHE: no ECDHE means no forward secrecy. Prefer TLS 1.3 with a 1.2 ECDHE-GCM fallback, and treat 0-RTT resumption carefully — it's replayable, so idempotent requests only."
      },
      {
        "q": "A hash map's load factor crosses ~0.66 and one insert suddenly costs O(n). How can lookup still be advertised as O(1)?",
        "opts": [
          "The O(n) resize-and-rehash is rare — amortized across all the cheap O(1) inserts, the average stays constant",
          "The resize runs on a background thread while readers continue using the old bucket array, so callers never actually observe the O(n) cost",
          "After a resize the map converts itself into a balanced tree, which caps every subsequent operation at O(log n)"
        ],
        "answer": 0,
        "whyWrong": {
          "1": "Standard-library hash maps (Python dict, JS Map) resize synchronously inside the triggering insert — that one caller really does pay O(n). The claim survives because it's an *amortized* bound, not because the cost is hidden on another thread.",
          "2": "The structure stays a hash table — resize allocates a bigger bucket array and rehashes into it. (Tree fallback exists in some Java `HashMap` buckets, but that's collision handling, not what a resize does.)"
        },
        "whyCorrect": "Growth doubles the bucket array, so resizes get exponentially rarer as the map grows. Spread the occasional O(n) rehash over the many O(1) inserts between resizes and the amortized cost per operation is constant — the same accounting that makes list append O(1).",
        "bestPractices": "Amortized O(1) still means occasional latency spikes — in hot paths that matters. If you know the final size, pre-size the container to skip rehash storms entirely. And remember worst-case O(n) exists when keys collide adversarially.",
        "lessonId": "fund-hash-maps"
      },
      {
        "q": "You need the keys of a binary search tree in sorted order. Which traversal do you reach for, and why?",
        "opts": [
          "Preorder — visiting the root first guarantees the walk starts from the smallest key and grows upward",
          "Inorder — left subtree, then root, then right subtree yields ascending order in a BST",
          "BFS — level-by-level order is sorted order in a BST, because each deeper level holds strictly larger keys than the level above it"
        ],
        "answer": 1,
        "whyWrong": {
          "0": "Preorder visits the root *before* its left subtree, so the smallest key comes out after the root, not first. Preorder's real use is copying or serializing a tree — the root-first order rebuilds it.",
          "2": "Depth says nothing about magnitude in a BST — left children are smaller, right children larger, at every level. A level-order walk interleaves small and large keys arbitrarily."
        },
        "whyCorrect": "The BST invariant is left < root < right at every node. Inorder traversal visits exactly in that order — recurse left, emit root, recurse right — so the output is globally sorted. It's the one traversal whose sequence depends on the BST property paying off.",
        "bestPractices": "Map traversal to job: inorder for sorted output, preorder to copy/serialize, postorder to delete or fold bottom-up, BFS for shortest-path and nearest-first searches. In Python, mind recursion depth (~1000 frames) on deep or degenerate trees — switch to an explicit stack.",
        "lessonId": "fund-trees-recursion"
      }
    ],
    "distinguished": [
      {
        "q": "In a context switch, what is most expensive on modern CPUs?",
        "opts": [
          "TLB / cache flushes",
          "Saving registers",
          "Updating the PID counter"
        ],
        "answer": 0,
        "whyWrong": {
          "1": "Saving the register file is a few hundred cycles at most — negligible vs. losing your warm caches.",
          "2": "PID housekeeping is a couple of pointer writes. Not on the hot path."
        },
        "whyCorrect": "Switching to another address space invalidates the TLB and pollutes L1/L2 caches. The new process pays thousands of cycles in cache misses before it's warm again — that's where the real cost hides.",
        "bestPractices": "For latency-sensitive code, pin threads to cores (taskset / sched_setaffinity) and reduce context switches with batching. Profile with `perf stat -e context-switches,cache-misses`."
      },
      {
        "q": "Under virtual memory & paging, what actually separates a TLB miss from a page fault?",
        "opts": [
          "A TLB miss is handled in hardware — the MMU walks the page tables (~100 cycles); a page fault traps into the kernel and can cost milliseconds if disk is involved",
          "They're two names for the same event — the TLB raises a fault whenever a translation is missing, and the kernel services both identically",
          "A page fault is the cheaper of the two — the kernel keeps hot pages resident and ready, while a TLB miss must always fetch the translation from disk"
        ],
        "answer": 0,
        "whyWrong": {
          "1": "They're distinct layers: a TLB miss just means the translation cache is cold — the MMU resolves it from page tables without kernel involvement. Only when the page-table entry itself is invalid or swapped out does it escalate to a fault.",
          "2": "Backwards on both counts — the TLB miss is the cheap one (a hardware page walk, ~100 cycles, no disk), while a page fault is the expensive kernel trap that may have to read from disk."
        },
        "whyCorrect": "Three tiers on every memory access: TLB hit (~1 cycle, invisible), TLB miss (MMU walks 4 levels of page tables in RAM, 100+ cycles, still pure hardware), page fault (no valid mapping — CPU traps to the kernel, which allocates, swaps in, or kills). The units jump from cycles to potentially milliseconds at that last boundary.",
        "bestPractices": "Diagnose accordingly: heavy TLB misses (visible in `perf stat -e dTLB-load-misses`) suggest scattered access patterns or a case for hugepages; high major-fault counts (`ps -o maj_flt`, `sar -B`) mean you're touching disk — a working-set or swap problem, not a CPU one.",
        "lessonId": "virtual-memory"
      },
      {
        "q": "`mv big.iso /archive/` on the same filesystem returns instantly, but moving it to a different filesystem grinds for minutes. What explains the gap?",
        "opts": [
          "Moves inside one filesystem skip permission and quota checks entirely, while a cross-filesystem move must re-verify ownership and rescan every data block it transfers",
          "Within one filesystem, `mv` rewrites a single directory entry — the inode and data blocks never move; across filesystems it degrades to copy-then-delete",
          "The kernel checksums and recompresses file contents whenever they cross a filesystem boundary, which costs CPU time proportional to file size"
        ],
        "answer": 1,
        "whyWrong": {
          "0": "Permission checks happen in both cases and are microseconds either way. The asymmetry is structural: one path moves a name, the other moves every byte.",
          "2": "No checksumming or compression happens at the boundary. The bytes are simply read and rewritten wholesale, because inode numbers are meaningful only within their own filesystem."
        },
        "whyCorrect": "A file is an inode; its name is just a (name → inode number) entry in a directory. Same-filesystem `mv` rewrites that one dentry — O(1) regardless of file size. Inode numbers don't exist outside their filesystem, so a cross-filesystem move must copy all the data to a new inode, then unlink the original.",
        "bestPractices": "This model unlocks more than mv: hard links are extra dentries on one inode (file dies at link count zero), and atomic same-directory `rename()` is the standard trick for crash-safe file replacement. Plan data layout so huge files don't need to hop filesystems.",
        "lessonId": "cli-navigate"
      },
      {
        "q": "Git stores snapshots, not diffs — yet creating a branch on a 10 GB repo is instant. What is a branch, physically?",
        "opts": [
          "A shallow clone of the current tree that hard-links every unchanged file and copies files lazily as you modify them",
          "A compressed delta chain rooted at the commit where you branched, extended with a new delta on every commit you add",
          "A 41-byte file under `.git/refs/heads/` holding one commit SHA — creating a branch is O(1)"
        ],
        "answer": 2,
        "whyWrong": {
          "0": "Nothing is cloned or linked — the object store isn't touched at all. Sharing of unchanged content already happens via content addressing: identical bytes are one blob, untouched directories reuse one tree SHA.",
          "1": "Deltas don't exist at commit time — commits point at whole-tree snapshots. Delta compression only arrives later, inside packfiles, when `git gc` squeezes similar blobs for storage."
        },
        "whyCorrect": "A branch is a pointer: one file containing one commit SHA. The commit points to a tree, trees point to blobs, and everything is content-addressed, so the new branch shares 100% of existing objects. That's why branching, rebasing, and cherry-picking are cheap — they move pointers and rebuild trees, never copy the repo.",
        "bestPractices": "Explore it: `cat .git/refs/heads/main`, then `git cat-file -p <sha>` to walk commit → tree → blob yourself. The snapshot model explains the weird stuff — why `git gc` shrinks repos, why identical files cost nothing, why history rewrites are pointer surgery.",
        "lessonId": "f6"
      },
      {
        "q": "You build handlers in a loop — `for i in range(3): handlers.append(lambda: i)` — and every closure returns 2. What's the scope story?",
        "opts": [
          "Lambdas can't see loop variables at all, so each one silently falls back to the module-level value of `i`",
          "Closures capture variables by reference, not value — all three lambdas share the single `i`, which finished at 2; bind with `lambda i=i:` to snapshot",
          "`range` reuses one integer object for speed, so each iteration mutated that same number in place and every lambda ends up holding the final mutation"
        ],
        "answer": 1,
        "whyWrong": {
          "0": "Lambdas absolutely see enclosing-scope variables — that's precisely the problem. All three closed over the *same* loop variable; nothing falls back to globals.",
          "2": "Integers are immutable and iteration rebinds the name `i` to a new object each pass. The sharing happens at the variable (cell) level — three closures over one cell — not at the object level."
        },
        "whyCorrect": "A closure carries a reference to the variable itself, not a frozen copy of its value at capture time. All three lambdas point at the same `i`, and by the time any of them runs, the loop has left it at 2. The `lambda i=i:` fix works because default arguments *are* evaluated at definition time — the one eager corner of a lazy mechanism.",
        "bestPractices": "Any callback built in a loop needs value-binding: a default arg (`i=i`), `functools.partial`, or a factory function per iteration. Same trap exists in JS with `var` — and the deep pattern is worth internalizing: late binding of free variables, early binding of defaults.",
        "lessonId": "fund-functions-scope"
      }
    ]
  },
  "devops": {
    "novice": [
      {
        "q": "What is Git mainly used for?",
        "opts": [
          "Compiling code",
          "Tracking file changes over time",
          "Running databases"
        ],
        "answer": 1,
        "whyWrong": {
          "0": "Compilation is done by a compiler/toolchain (gcc, tsc, javac). Git stores source — it doesn't build it.",
          "2": "Databases are runtime data stores. Git stores immutable snapshots of files, not live queryable rows."
        },
        "whyCorrect": "Git is a distributed version control system — every commit is a hashed snapshot, letting you branch, diff, merge, and travel back in history.",
        "bestPractices": "Commit small and often with a clear subject line. `git commit --amend` and `git rebase -i` are your friends for cleaning up before pushing."
      },
      {
        "q": "A container is best described as...",
        "opts": [
          "A heavy VM with its own kernel",
          "A type of database",
          "A lightweight isolated process bundle"
        ],
        "answer": 2,
        "whyWrong": {
          "0": "That describes a VM. VMs run a full guest kernel via a hypervisor. Containers share the host kernel — that's why they're lightweight.",
          "1": "Databases store data. Containers are a packaging + isolation mechanism for any process (including databases)."
        },
        "whyCorrect": "A container is a process (or process tree) isolated via Linux namespaces and constrained via cgroups. It packages its filesystem and dependencies in an image but shares the host kernel.",
        "bestPractices": "Treat containers as immutable. Build an image, tag it, run it. Mutating a running container is a sign you're using it wrong."
      },
      {
        "q": "What does \"cd\" do in a shell?",
        "opts": [
          "Changes the working directory",
          "Copies a directory",
          "Deletes a directory"
        ],
        "answer": 0,
        "whyWrong": {
          "1": "Copy is `cp -r dir/ dest/`. `cd` doesn't move bytes.",
          "2": "Delete is `rm -rf` (use with extreme care). `cd` just moves where you're standing."
        },
        "whyCorrect": "`cd` (change directory) updates the shell's `PWD` — every subsequent relative path resolves from that location.",
        "bestPractices": "Use `cd -` to bounce back to your previous directory. In scripts, prefer `pushd`/`popd` so you can restore state cleanly."
      },
      {
        "q": "In a CI/CD pipeline, why does lint run before the test and build stages?",
        "opts": [
          "It's the fastest check, so a style slip fails in seconds instead of after a full build",
          "Linting must rewrite the code into a canonical format before the compiler can build it",
          "The deploy stage needs the lint report as an input artifact before it can promote the image"
        ],
        "answer": 0,
        "whyWrong": {
          "1": "Pipeline lint is a read-only gate — it flags issues and exits nonzero, it never rewrites your code. Formatters change code, but the build doesn't consume anything lint produces.",
          "2": "Deploy consumes the built image, not the lint report. Lint's only output is a pass/fail signal; nothing downstream imports it as an artifact."
        },
        "whyCorrect": "Pipelines order their gates cheapest-first. Lint takes seconds while a container build takes minutes, so putting lint at the front means a style slip fails the run almost instantly — each station refuses to pass the part downstream until its own gate is green.",
        "bestPractices": "Structure pipelines fastest-to-slowest: lint → unit tests → integration tests → build → deploy. Developer feedback time is the metric that keeps people actually using the pipeline.",
        "explanation": "Cheapest gate first: lint fails in seconds, saving the cost of a full build."
      },
      {
        "q": "In a YAML config, a teammate writes `country: NO` meaning Norway's country code. What does a standard parser hand your app?",
        "opts": [
          "The two-letter string \"NO\", because any value after a colon is read as literal text",
          "The boolean false — YAML 1.1 treats NO, off, and no as boolean literals",
          "A parse error, because uppercase reserved words must always be quoted in YAML"
        ],
        "answer": 1,
        "whyWrong": {
          "0": "YAML guesses the type of every unquoted scalar — int, float, bool, or null. A value is only guaranteed to stay text when you quote it.",
          "2": "YAML never errors on `NO`; it silently coerces it, which is worse than an error because the bug hides until the wrong value reaches production."
        },
        "whyCorrect": "This is the infamous 'Norway problem': YAML 1.1 reads yes/no/on/off (in any case) as booleans, so `country: NO` becomes `country: false`. Quoting — `country: \"NO\"` — turns the type guessing off.",
        "bestPractices": "Quote any scalar that must stay text: country codes, version strings like \"1.10\", IDs with leading zeros, and anything yes/no-ish. That one habit kills the whole bug category.",
        "explanation": "Unquoted NO is the Norway problem — YAML 1.1 coerces it to boolean false.",
        "lessonId": "yaml-basics"
      },
      {
        "q": "You store a startup script in YAML and need each command to stay on its own line. Which block style keeps your newlines exactly as written?",
        "opts": [
          "The folded style `>`, which is the default whenever a value spans more than one line",
          "Wrapping the whole script in double quotes and letting it continue across several lines",
          "The literal style `|` — newlines inside the block are preserved exactly as written"
        ],
        "answer": 2,
        "whyWrong": {
          "0": "`>` is the folded style — it collapses newlines into spaces, so your three commands become one long unrunnable line. And neither block style is a default; you must choose one.",
          "1": "Quoted multi-line scalars also fold line breaks into spaces, and escaping quotes inside a script gets ugly fast. Block styles exist precisely for this case."
        },
        "whyCorrect": "`|` is the literal block style: every newline inside is kept as-is, which is what scripts, certificates, and anything line-sensitive need. `>` folds; `|` keeps.",
        "bestPractices": "Memorize the 2x2: `|` keeps newlines, `>` folds them; add `-` (`|-`, `>-`) to strip the trailing newline when a tool compares the value byte-for-byte, like tokens or hashes.",
        "explanation": "`|` is literal — newlines preserved. `>` folds them into spaces."
      },
      {
        "q": "Your team builds the image `myapp:v1` once, then starts it ten times on one host. In terms of what containers actually are, what exists on that machine?",
        "opts": [
          "One read-only image and ten containers — like one class instantiated into ten objects",
          "Ten images and ten containers, because each `docker run` copies the image before starting it",
          "One image and one container that time-slices the ten workloads inside a single process"
        ],
        "answer": 0,
        "whyWrong": {
          "1": "`docker run` never copies the image. All ten containers share the same read-only image layers; each just gets its own thin writable layer on top.",
          "2": "Each `docker run` creates a separate container with its own process tree. Docker never multiplexes multiple runs into one container."
        },
        "whyCorrect": "The image is a frozen, read-only snapshot — a class definition. A container is a running instance of it — an object. One image, many containers, each with its own name, writable layer, and lifecycle.",
        "bestPractices": "Keep the verbs straight: `build` makes an image, `push`/`pull` move it through a registry, `run` instantiates a container. Container names (`--name web`) and image names live in different namespaces — don't conflate them in scripts.",
        "explanation": "Image = class, container = object. One image can spawn many containers."
      },
      {
        "q": "In your Linux command toolkit, why is `sort | uniq` the standard pairing instead of `uniq` alone?",
        "opts": [
          "`uniq` can't read from a pipe, so `sort` has to buffer the whole stream into a temporary file first",
          "`uniq` only removes adjacent duplicates, so unsorted input leaves repeats scattered through the output",
          "`sort` prepends an occurrence count to each line, which `uniq` requires in order to know which duplicates to drop"
        ],
        "answer": 1,
        "whyWrong": {
          "0": "`uniq` reads stdin happily — pipes are exactly how it's meant to be used. Its limitation is adjacency, not input source.",
          "2": "No counting happens in `sort`. Counting is `uniq -c`'s own feature, and it needs no help from `sort` to produce it — sorting just brings the duplicates together."
        },
        "whyCorrect": "`uniq` compares each line only to the one immediately before it. On unsorted input, identical lines separated by other text all survive. Sorting first makes duplicates adjacent so `uniq` can actually collapse them.",
        "bestPractices": "`sort -u` does both jobs in one step. For frequency tables, use `sort | uniq -c | sort -nr` — the classic top-talkers pipeline.",
        "explanation": "uniq only collapses adjacent duplicates — sort makes them adjacent.",
        "lessonId": "d1"
      },
      {
        "q": "During branch cleanup after a merge, `git branch -d feature/x` refuses to delete the branch. What's the safe reading of that refusal?",
        "opts": [
          "The branch's objects are corrupted and need a `git gc` pass before the ref can be removed",
          "Git requires you to delete the remote copy with `git push origin --delete` before it will remove the local one",
          "Git can't find those commits on main — with squash merges you confirm the PR landed, then force with -D"
        ],
        "answer": 2,
        "whyWrong": {
          "0": "`git gc` compacts loose objects and has nothing to do with branch deletion. The refusal is a merge-status safety check, not a repair prompt.",
          "1": "Local and remote deletion are completely independent. Git never enforces a remote-first ordering — the GitHub delete button and your local `-d` don't know about each other."
        },
        "whyCorrect": "Lowercase `-d` refuses to delete a branch whose commits aren't reachable from main. Squash merges rewrite the work into one new commit, so the branch's original SHAs never appear on main — verify the PR merged on the host, then use `-D`.",
        "bestPractices": "Pair every branch delete with `git fetch --prune` so stale `origin/feature-x` tracking refs vanish too. Deleted the wrong branch? `git reflog` keeps the old tip recoverable for ~90 days.",
        "explanation": "-d refuses unmerged-looking branches; squash merges hide the SHAs from main.",
        "lessonId": "d3"
      },
      {
        "q": "In the CI vs Delivery vs Deployment ladder, what is the exact delta between Continuous Delivery and Continuous Deployment?",
        "opts": [
          "One manual approval step — Delivery stages a release candidate and a human clicks deploy; Deployment removes the human",
          "Delivery ships artifacts only as far as the staging environment, while Deployment adds the machinery to build production-grade artifacts",
          "Delivery runs unit tests only, while Deployment adds the integration tests and smoke tests needed for production traffic"
        ],
        "answer": 0,
        "whyWrong": {
          "1": "Delivery already produces production-ready artifacts — that's its whole point. The release candidate is packaged, staged, and deployable; it's just waiting for a human decision.",
          "2": "Test depth isn't the divider — both stages need strong test coverage. The distinction is purely about who pushes the final button: a person or the pipeline."
        },
        "whyCorrect": "Everything upstream is identical. The only difference is that Continuous Delivery keeps a human approval before production, while Continuous Deployment lets every green build flow straight to prod. Most companies stop at Delivery.",
        "bestPractices": "When reading any team's pipeline, ask one question: 'who pushes the button?' That answer determines the release risk, test coverage requirements, and on-call model.",
        "explanation": "The delta is exactly one manual approval step — nothing else changes.",
        "lessonId": "d6"
      },
      {
        "q": "Among the cloud service models, your team wants to push code and never patch an operating system again — but still write the app themselves. Which stop on the slider fits?",
        "opts": [
          "IaaS — the provider manages the OS and runtime while you keep full control of the hypervisor",
          "PaaS — you push code; the platform owns the OS, runtime, and scaling",
          "SaaS — you configure a finished application instead of writing and deploying your own code"
        ],
        "answer": 1,
        "whyWrong": {
          "0": "IaaS is the opposite split: the cloud owns the hypervisor and hardware, while YOU install patches, the runtime, and the app. Renting a VM means owning its OS.",
          "2": "SaaS is the finished app — Gmail, Salesforce. The team writes no code at all, which contradicts the requirement to build the app themselves."
        },
        "whyCorrect": "PaaS (App Engine, Beanstalk, Heroku) hands you a managed runtime: you push code and the platform handles OS patching, scaling, and load balancing. You own only the application layer.",
        "bestPractices": "Pick the model by asking 'what do I want to stop caring about?' — then choose the rightmost option on the control-vs-convenience slider that still lets you sleep at night.",
        "explanation": "PaaS abstracts OS and runtime; you still own the application code.",
        "lessonId": "cloud-models"
      },
      {
        "q": "Using the 'Regions, AZs, and the edge' geography: a fire takes out a single datacenter building. Which deployment choice keeps your app up?",
        "opts": [
          "Deploying to multiple regions, because all AZs inside one region share the same physical building",
          "Putting a CDN edge POP in front, because edge nodes keep serving both reads and writes while the origin is down",
          "Spreading replicas across availability zones — each AZ is a separate building in the same region"
        ],
        "answer": 2,
        "whyWrong": {
          "0": "The premise is backwards: an AZ IS an isolated building. Multi-region protects against a whole city going dark, at the price of split-brain risk, double cost, and running two stacks — overkill for a single-building failure.",
          "1": "Edge is read-only — it serves cached static content, but writes still go to the origin region. A POP can't keep a transactional app alive when its backend is burning."
        },
        "whyCorrect": "Region is the city, AZ is the building. Multi-AZ replicas sit in physically separate buildings with 1-3 ms cross-AZ latency, so one building fire doesn't become an outage.",
        "bestPractices": "Default to multi-AZ for HA. Reach for multi-region only when the SLA truly demands it and the team can operate two stacks — active-active across regions means conflict resolution and double the ops surface.",
        "explanation": "AZ = building. Multi-AZ replicas survive a single-building fire.",
        "lessonId": "cloud-regions"
      },
      {
        "q": "Your Postgres data directory needs single-digit-millisecond random IO and full filesystem semantics. Of object, block, and file storage, which shape fits?",
        "opts": [
          "Block storage — a virtual disk attached to one VM, where databases live",
          "Object storage — 11-nines durability makes it the safest possible home for database files",
          "File storage — mounting the data directory from many VMs at once gives the database high availability"
        ],
        "answer": 0,
        "whyWrong": {
          "1": "Object stores speak HTTP PUT/GET on immutable blobs with tens-to-hundreds of ms latency and no partial writes — a database engine physically can't run on that. Durability isn't the constraint here; IO semantics are.",
          "2": "A shared NFS mount with multiple writers is how you corrupt a database, not how you make it highly available. HA comes from replication between instances, each on its own disk."
        },
        "whyCorrect": "Block storage (EBS, Persistent Disk) hands you a raw virtual disk: you mkfs it, get single-digit-ms latency, full filesystem semantics, and exactly one writer. That's precisely the shape a database needs.",
        "bestPractices": "Map workloads to shapes: object for static assets, backups, and ML datasets; block for databases, root volumes, and random IO; file for shared scratch space across a fleet.",
        "explanation": "Databases need low-latency random IO with one writer — that's block storage.",
        "lessonId": "cloud-storage"
      },
      {
        "kind": "order",
        "q": "Arrange a CI/CD pipeline's stages in the order a commit travels through them.",
        "items": [
          "Developer pushes the commit",
          "CI builds the artifact",
          "Automated tests run against the build",
          "The image is scanned and pushed to the registry",
          "The deploy rolls out to production"
        ],
        "whyWrong": "Testing after deploy is the order that pages you at 3am — the pipeline exists to catch failures while they're cheap. And you can't test what hasn't been built: every stage gates the next.",
        "whyCorrect": "Push → build → test → publish → deploy. Each stage is a quality gate; a failure stops the line before the blast radius grows.",
        "bestPractices": "Make every stage fail the pipeline loudly. A pipeline where a red test still deploys is theater, not CI/CD."
      },
      {
        "q": "In YAML, `startup: |-` keeps every newline inside the block exactly as written, but ____ the single trailing newline — which matters when a tool compares the value byte-for-byte.",
        "opts": [
          "strips",
          "repeats",
          "folds"
        ],
        "answer": 0,
        "whyWrong": {
          "1": "Nothing gets duplicated. The chomping indicator only decides the fate of the one newline at the very end of the block — keep it (`|`) or drop it (`|-`).",
          "2": "Folding is the `>` family's job — it turns inner newlines into spaces. The `-` after `|` doesn't touch inner newlines at all; it only removes the final one."
        },
        "whyCorrect": "The `-` is a chomping indicator: `|` keeps inner newlines and one trailing newline, while `|-` keeps the inner newlines but strips that final one. That invisible byte matters for tokens, hashes, and anything compared exactly.",
        "bestPractices": "Reach for `|-` whenever the value feeds a comparison or a signature — API keys, certs, checksummed configs. A trailing `\\n` you can't see is a miserable bug to find.",
        "lessonId": "yaml-basics"
      },
      {
        "q": "A deploy config says `app_version: 1.10`, but the pipeline reports it shipped version `1.1`. What is wrong with that line?",
        "opts": [
          "YAML read the trailing zero as octal notation — the same trap as `id: 010`",
          "The parser rounded the number down because floats keep only two significant digits by default",
          "Unquoted `1.10` parses as the float 1.1 — quote it as `\"1.10\"` to keep the text"
        ],
        "answer": 2,
        "whyWrong": {
          "0": "The octal trap needs a *leading* zero (`010`), not a trailing one. `1.10` never enters octal territory — it's read as a plain decimal float.",
          "1": "No rounding happens and YAML has no significant-digit rule. The value is exact — it's just that the number 1.10 and the number 1.1 are the same number."
        },
        "whyCorrect": "YAML type-guesses every unquoted scalar. `1.10` looks numeric, so it becomes the float 1.10 — which *equals* 1.1, and the trailing zero is gone the instant the file parses. Version strings and image tags must be quoted to stay text.",
        "bestPractices": "Quote any scalar that must stay text: versions like `\"1.10\"`, country codes like `\"NO\"`, IDs with leading zeros. Quoting turns the type guessing off — one habit, whole bug category gone.",
        "lessonId": "yaml-basics"
      }
    ],
    "junior": [
      {
        "q": "What does a Kubernetes Service primarily provide?",
        "opts": [
          "Persistent storage",
          "Stable networking to a set of pods",
          "Container image builds"
        ],
        "answer": 1,
        "whyWrong": {
          "0": "Persistent storage is the job of PersistentVolumes and PVCs. Services don't store anything.",
          "2": "Image builds happen in CI (or Kaniko/BuildKit). Services consume already-built images; they don't produce them."
        },
        "whyCorrect": "A Service is a stable virtual IP and DNS name that load-balances across whichever pods match its selector. Pods are ephemeral; the Service is the steady address clients talk to.",
        "bestPractices": "Use ClusterIP for in-cluster traffic, NodePort/LoadBalancer for external. For HTTP, prefer an Ingress on top of Services so you get host/path routing in one place."
      },
      {
        "q": "A Dockerfile is...",
        "opts": [
          "A running container",
          "A registry URL",
          "A recipe for building an image"
        ],
        "answer": 2,
        "whyWrong": {
          "0": "A running container is an instance of an image. The Dockerfile is the build-time recipe, not the runtime artifact.",
          "1": "Registry URLs (like `docker.io/library/python`) point at hosted images. The Dockerfile produces what gets pushed there."
        },
        "whyCorrect": "A Dockerfile is a declarative build script — each instruction (`FROM`, `COPY`, `RUN`) produces a cached layer in the resulting image.",
        "bestPractices": "Order Dockerfile instructions from least- to most-frequently-changed (dependencies before app code). Multi-stage builds keep final images small."
      },
      {
        "q": "In a GitHub Actions workflow, the lint and test jobs have no `needs:` between them, while build declares `needs: [lint, test]`. What execution does that produce?",
        "opts": [
          "Lint and test run in alphabetical order, then build runs only if the workflow file happens to list it last",
          "Lint and test run in parallel as siblings; build starts only after both finish green",
          "All three jobs start in parallel, and build automatically retries until lint and test have both completed"
        ],
        "answer": 1,
        "whyWrong": {
          "0": "Neither file order nor alphabetical order matters — the `needs:` dependency graph is the only thing that sequences jobs in GitHub Actions.",
          "2": "`needs:` blocks build from *starting* at all until its dependencies succeed. It never launches early and polls — a failed dependency simply skips the dependent job."
        },
        "whyCorrect": "Jobs are parallel by default; `needs:` declares the DAG. Making lint and test siblings roughly halves PR feedback time, and build waits for both gates before producing an image.",
        "bestPractices": "Keep PR feedback under ~3 minutes on a warm cache. Run independent checks as siblings, then require them as branch-protection checks so the pipeline is a gate, not a suggestion.",
        "explanation": "No needs: between jobs = parallel; needs: [lint, test] = build waits for both.",
        "lessonId": "gh-actions-ci"
      },
      {
        "q": "In a multi-service Docker Compose stack, your API connects with `postgres://db:5432` and it just works. What resolves the hostname `db`?",
        "opts": [
          "Compose writes every service's IP into each container's /etc/hosts file when the stack is built",
          "The db container broadcasts its address across the bridge at startup, and every other container caches that announcement",
          "Docker's embedded DNS server on the user-defined network resolves each service name to its container IP"
        ],
        "answer": 2,
        "whyWrong": {
          "0": "Static /etc/hosts entries were the old links-era approach and would go stale when a container restarts with a new IP. Compose uses live DNS instead, so resolution follows restarts.",
          "1": "There's no broadcast-and-cache protocol between containers. The bridge is just a virtual switch — discovery happens through DNS lookups, not announcements."
        },
        "whyCorrect": "Compose creates a user-defined bridge network, and inside it an embedded DNS server at 127.0.0.11 gives every service an A-record for its service name. `db` resolves to the postgres container's current IP on every lookup.",
        "bestPractices": "Let services talk over the Compose network by service name and skip publishing database ports to the host — the API can reach `db:5432` while the outside world never can.",
        "explanation": "Docker's embedded DNS (127.0.0.11) on the user-defined network resolves service names.",
        "lessonId": "compose-stack"
      },
      {
        "q": "Prod breaks minutes after a deploy. In a CI/CD pipeline with rollback done right, what does `./rollback.sh` actually do?",
        "opts": [
          "Reads the previous good SHA from the deploy log and re-deploys that already-built image — no rebuild",
          "Reverts the bad commit on main and waits for the pipeline to rebuild and ship a fresh image from source",
          "Restores every container from the most recent nightly snapshot of the production host's disk"
        ],
        "answer": 0,
        "whyWrong": {
          "1": "Reverting on main is a reasonable follow-up, but as the *rollback mechanism* it's slow — a full pipeline run under incident pressure — and it produces a brand-new artifact instead of the version you already know was good.",
          "2": "Snapshots restore machine state and data, not application versions — and a nightly snapshot would throw away a day of production data to fix an app bug. Rolling back a deploy is a tag flip, not a disk restore."
        },
        "whyCorrect": "Prod keeps a record of current + previous SHAs in a deploy log. Rollback reads the last known-good tag and re-deploys that exact image from the registry — a metadata flip that completes in seconds because nothing is rebuilt.",
        "bestPractices": "Tag every image with the commit SHA, never `:latest`; keep at least the last two tags in the registry; and only append to the deploy log after a promotion succeeds, so failed deploys never pollute the rollback target.",
        "explanation": "Rollback = re-deploy the previous SHA's existing image. Fast because nothing rebuilds.",
        "lessonId": "cicd-rollback"
      },
      {
        "q": "After a hardened container build on a distroless base, `docker exec -it app sh` fails with 'executable file not found'. Why is that failure the goal?",
        "opts": [
          "It proves the image was built with multi-stage caching enabled, which strips debug symbols and shells out of every layer",
          "No shell in the image means an attacker who gains code execution has no sh, package manager, or curl to pivot with",
          "Distroless images store their shell binaries compressed, so they only execute after the container is fully warmed up"
        ],
        "answer": 1,
        "whyWrong": {
          "0": "Multi-stage builds shrink images by copying only what you choose into the final stage, but they don't inherently remove shells — the shell is absent because the distroless base never ships one. Different mechanism.",
          "2": "Nothing is compressed and waiting. The shell binaries simply do not exist anywhere in the image — that's the entire point of a distroless base."
        },
        "whyCorrect": "Attack surface reduction: with no /bin/sh, no apt, and no curl, an attacker who achieves code execution has no living-off-the-land tools to explore, download payloads, or pivot. Combined with a non-root UID and read-only rootfs, the container is a dead end.",
        "bestPractices": "Verify hardening like a test suite: `exec sh` must fail, `id` must print uid=65532, and writing to /etc must error. Pin base images by digest and fail the build on HIGH/CRITICAL CVEs.",
        "explanation": "Distroless = no shell to find. An attacker with code exec has nothing to pivot with.",
        "lessonId": "hardened-container"
      },
      {
        "q": "In your Terraform AWS VPC module, app servers sit in a private subnet but still need to call external APIs. What gives them outbound internet without inbound exposure?",
        "opts": [
          "Attaching a second Internet Gateway configured as egress-only, so outbound traffic bypasses the public subnet entirely",
          "Adding a 0.0.0.0/0 route from the private subnet straight to the existing Internet Gateway",
          "A NAT Gateway — private subnets route egress through it while staying unreachable from outside"
        ],
        "answer": 2,
        "whyWrong": {
          "0": "The IGW is inherently bidirectional and a VPC uses one. The 'egress-only internet gateway' is a real but IPv6-only primitive — it doesn't solve IPv4 app traffic, which is what NAT exists for.",
          "1": "A default route to the IGW is literally the definition of a *public* subnet — it would make your app servers reachable from the internet, defeating the private-subnet design."
        },
        "whyCorrect": "The NAT Gateway is the one-way valve: private workloads can *initiate* outbound connections (API calls, package installs) through it, but nothing outside can initiate a connection back in.",
        "bestPractices": "NAT Gateways cost real money (~$32/mo each plus per-GB data). For learning labs, share a single NAT across AZs or skip the private subnet; for prod, one NAT per AZ avoids cross-AZ data charges.",
        "explanation": "NAT Gateway = outbound-initiate-only. Routing to the IGW would make the subnet public.",
        "lessonId": "terraform-vpc"
      },
      {
        "q": "An IAM role exists and its permission policy allows s3:GetObject, yet your service gets AccessDenied when it tries to assume the role. Which IAM fundamental is usually missing?",
        "opts": [
          "The trust policy — nothing authorized your service's principal to assume the role in the first place",
          "An inline Deny statement — AWS attaches one to every new role by default until it has been used once",
          "MFA on the service account — AWS refuses role assumption for any identity that hasn't registered a second factor"
        ],
        "answer": 0,
        "whyWrong": {
          "1": "AWS injects no default Deny statements. The implicit deny is simply the absence of an Allow — and the missing Allow here is on the *assume* side, not the permission side.",
          "2": "MFA is a control for humans. Services assume roles via short-lived STS credentials through the trust relationship; no second factor is involved in service-to-service assumption."
        },
        "whyCorrect": "IAM splits every role in two: the trust policy says *who can assume it*, the permission policy says *what it can do once assumed*. The role can be perfectly permissioned and still unusable if your principal isn't in the trust policy — the most common AccessDenied of all.",
        "bestPractices": "Debug in order: can my principal assume the role (trust)? Then what can the role do (permissions)? CloudTrail records the exact denied API call, which tells you which half failed.",
        "explanation": "Trust policy gates WHO can assume; permission policy gates WHAT it can do. Most denials are missing trust."
      },
      {
        "q": "Your nightly batch job takes 45 minutes. Why does the serverless functions-vs-containers split matter before you reach for Lambda?",
        "opts": [
          "Lambda bills by the hour with a one-hour minimum, so a 45-minute run costs the same as a full day of EC2",
          "Lambda's hard 15-minute ceiling kills the job — a serverless container (Fargate) or batch service fits instead",
          "Functions can't reach S3 or databases directly, so batch jobs have nowhere durable to write their results"
        ],
        "answer": 1,
        "whyWrong": {
          "0": "Lambda bills per millisecond of execution, not per hour — cost isn't the blocker here. The blocker is that the function is terminated at the platform's duration limit no matter what it costs.",
          "2": "Gluing S3, queues, and databases together is Lambda's bread and butter. IO access is fine; execution *duration* is the hard ceiling."
        },
        "whyCorrect": "Every serverless platform has hard limits: Lambda caps at 15 minutes, Cloud Run at 60, Fargate has none. A 45-minute job gets killed mid-run on Lambda — the duration ceiling has sunk more 'just use a function' migrations than cold starts ever did.",
        "bestPractices": "Before committing a workload, memorize your platform's ceilings — max duration, memory, and concurrency. Long-running or unpredictable-duration work belongs on serverless containers or a batch service.",
        "explanation": "Lambda hard-stops at 15 minutes. A 45-minute job needs Fargate/Batch.",
        "lessonId": "cloud-serverless"
      },
      {
        "q": "Your service health watchdog polls an upstream every 5 seconds. The upstream dies for an hour. Why should Slack get exactly one alert instead of 720?",
        "opts": [
          "Because Slack automatically drops duplicate messages with identical text posted to the same channel within an hour",
          "Because the poller should stop checking after the first failure until a human acknowledges the alert",
          "Because notifications should fire only on state transitions — healthy → down once, not on every failed tick"
        ],
        "answer": 2,
        "whyWrong": {
          "0": "Slack doesn't dedupe for you — it rate-limits webhooks at roughly 1/sec per channel, so a flood gets 429s and you may lose the one alert that mattered.",
          "1": "The poller must keep polling through the outage, or it can never detect recovery. Pausing on first failure means the down → healthy transition goes unnoticed."
        },
        "whyCorrect": "Notify only when `old != new`: the state machine flips healthy → down once and fires one alert, then stays silent until the next transition. A dead upstream produces one message; its recovery produces one more.",
        "bestPractices": "Add hysteresis — require 2-3 consecutive bad ticks before flipping state — or a single slow request crossing the p99 line will flap your alerts all night.",
        "explanation": "Alert on transitions, not ticks. One healthy→down message, one down→healthy.",
        "lessonId": "health-watchdog"
      },
      {
        "kind": "order",
        "q": "Order the life of a container — from writing the Dockerfile to a running process.",
        "items": [
          "Write the Dockerfile",
          "docker build produces an image",
          "The image is pushed to a registry",
          "The host pulls the image",
          "docker run starts the container from it"
        ],
        "whyWrong": "Run-before-build confuses the image (the frozen recipe) with the container (the live process). Registries hold images, never containers — you can't push something that's running.",
        "whyCorrect": "Recipe → image → registry → pull → process. The image is immutable and travels; the container is ephemeral and runs where it lands.",
        "bestPractices": "Tag images immutably (commit SHA, not just :latest) so the thing you tested is provably the thing you ran."
      },
      {
        "kind": "order",
        "code": true,
        "q": "Arrange the steps of the `lint` job in `.github/workflows/ci.yml` so the job can actually run.",
        "items": [
          "- uses: actions/checkout@v4",
          "- uses: actions/setup-python@v5",
          "  with: { python-version: '3.12', cache: 'pip' }",
          "- run: pip install -r requirements-dev.txt",
          "- run: ruff check ."
        ],
        "whyWrong": "Every other order breaks a dependency: without checkout there is no code to lint, `with:` configures nothing unless it sits directly under `setup-python`, `pip install` needs Python on the PATH, and `ruff` isn't installed until the dev requirements are.",
        "whyCorrect": "Setup before use, top to bottom: check out the source, install the toolchain (`with:` attaches its config to the step above it), install dependencies with that toolchain, then run the linter they provide.",
        "bestPractices": "Keep lint as its own job, sibling to `test` with no `needs:` between them — they run in parallel and a style slip fails in seconds. Add `cache: 'pip'` so the second run takes 10 s instead of 90.",
        "lessonId": "gh-actions-ci"
      },
      {
        "kind": "order",
        "code": true,
        "q": "Order the core lines of `deploy.sh` so a broken image can never take prod down.",
        "items": [
          "docker pull \"$IMAGE\"",
          "IMAGE=\"$IMAGE\" docker compose -f compose.new.yml up -d",
          "curl -fsS http://localhost:8081/healthz",
          "IMAGE=\"$IMAGE\" docker compose up -d app",
          "echo \"$(date -Iseconds) ${SHA} OK\" >> \"$LOG\""
        ],
        "whyWrong": "Promote before the health gate and you've deployed untested bytes — the exact 3am page this script exists to prevent. Log before promotion and a failed deploy lands in `deploys.log`, so the next rollback targets a broken SHA.",
        "whyCorrect": "Acquire, stage, validate, execute, record: pull the image (a bad tag aborts here, prod untouched), start it side-by-side on :8081, gate on `/healthz` with `-f` so a non-2xx exits nonzero, only then swap the prod tag, and append to the audit log strictly after promotion succeeds.",
        "bestPractices": "The log line is rollback's source of truth — `rollback.sh` reads the previous `OK` SHA from it, so only promoted deploys may ever be written. And never tag `:latest`: a mutable tag means there is no fixed point to roll back to.",
        "lessonId": "cicd-rollback"
      },
      {
        "q": "A floating base-image tag is a supply-chain hole — a hardened Dockerfile pins its `FROM` line by ____ so every build resolves to exactly the same bytes.",
        "opts": [
          "a semver tag such as `:3.12-slim`",
          "digest, as in `@sha256:abc123...`",
          "the registry's `:latest` alias"
        ],
        "answer": 1,
        "whyWrong": {
          "0": "Semver tags are still mutable pointers — the registry can re-point `:3.12-slim` at a rebuilt image tomorrow, and your 'reproducible' build silently changes underneath you.",
          "2": "`:latest` is the most mutable tag of all — it moves on every push. It's the opposite of pinning and the first thing a hardened build removes."
        },
        "whyCorrect": "A digest names the content itself: `@sha256:...` is a hash of the image bytes, so the pull either returns exactly those bytes or fails. No registry-side re-tag can swap what your build stands on.",
        "bestPractices": "Pin by digest, then let renovate or dependabot bump the digests for you — otherwise your base image rots while you sleep. Pinning without a bump-bot trades supply-chain risk for CVE rot.",
        "lessonId": "hardened-container"
      }
    ],
    "senior": [
      {
        "q": "Why use Infrastructure-as-Code?",
        "opts": [
          "Reproducible, version-controlled infra",
          "Faster runtime",
          "Lower egress cost"
        ],
        "answer": 0,
        "whyWrong": {
          "1": "IaC describes infra, it doesn't make running services faster. The underlying VM is the same speed whether you clicked it in a console or terraform-applied it.",
          "2": "Egress cost is a function of how much data you move, not how you provisioned. IaC neither raises nor lowers it directly."
        },
        "whyCorrect": "IaC turns infra into reviewable code — diffs in PRs, history in git, identical environments across dev/staging/prod, and easy disaster recovery by re-applying the manifests.",
        "bestPractices": "Keep state files (terraform.tfstate) in remote backends with locking. Never edit infra by hand in the console — drift will bite you within a week."
      },
      {
        "q": "A container started with `--memory 512m` reads /proc/meminfo and sees the host's full 64 GB. Which isolation lesson explains this?",
        "opts": [
          "The memory limit silently failed to apply — a correctly configured cgroup rewrites /proc/meminfo to report 512 MiB",
          "Docker only enforces memory limits when a matching namespace flag is passed alongside the cgroup setting at run time",
          "Cgroups budget what a process can USE; hiding what it can SEE is a namespace job — the two are orthogonal"
        ],
        "answer": 2,
        "whyWrong": {
          "0": "The limit is very much live — malloc past 512 MiB and the OOM killer terminates the process. Cgroups enforce budgets; they never claimed to fake what /proc reports.",
          "1": "No such combo flag exists. Namespaces and cgroups are independent kernel mechanisms that are both applied at container start — one doesn't activate the other."
        },
        "whyCorrect": "Namespaces answer 'what can I see?' and cgroups answer 'what can I use?'. /proc/meminfo visibility is a view problem, and standard containers don't virtualize it — so the budget is enforced at 512 MiB while the view still shows 64 GB.",
        "bestPractices": "Apps that size heaps or thread pools from /proc/meminfo mis-size themselves inside containers. Use container-aware runtime flags (modern JVMs, Go's GOMEMLIMIT) or read the cgroup files directly.",
        "explanation": "Cgroups limit usage; namespaces control visibility. Neither does the other's job."
      },
      {
        "q": "Twenty microservices each declared `type: LoadBalancer` and the cloud bill exploded. In the load-balancers-in-K8s pattern, what's the standard fix?",
        "opts": [
          "Front them with one Ingress — a single cloud LB doing L7 host/path routing to twenty ClusterIP Services",
          "Switch them all to NodePort and hand out the node IPs, which removes the cloud load balancer layer entirely",
          "Merge the microservices into fewer pods so the Service count drops below the provider's free load balancer tier"
        ],
        "answer": 0,
        "whyWrong": {
          "1": "NodePort exposes a high port (30000-32767) on every node and advertises node IPs to the world — fine for kicking the tires, awful for production: no stable VIP, no TLS termination, nodes become your public surface.",
          "2": "There is no free LB tier to duck under, and reshaping your service architecture to dodge a bill inverts the problem — the waste is in the routing layer, not the service boundaries."
        },
        "whyCorrect": "Each `type: LoadBalancer` Service provisions its own cloud LB — a separate bill and DNS record that scales linearly. Ingress consolidates: one cloud LB, one IP, with L7 host/path rules fanning traffic out to many internal ClusterIP Services.",
        "bestPractices": "Default to ClusterIP for everything inside the cluster. Reserve LoadBalancer for the single edge entry point and let an Ingress controller (nginx, Traefik, Envoy) do the HTTP fanout behind it.",
        "explanation": "One Ingress + many ClusterIPs replaces N cloud LBs with one.",
        "lessonId": "sd-loadbalancers-k8s"
      },
      {
        "q": "'Without good metrics, canary is just a slow blue-green.' In the blue-green vs canary decision, what makes that statement true?",
        "opts": [
          "Canary and blue-green share the same router configuration underneath, so under load the two strategies behave identically",
          "A canary only limits blast radius if you can detect sickness at 1% traffic — no observability means no early verdict, just a slower full rollout",
          "Blue-green always rolls back faster, so a canary stretched over hours converges to the same risk profile as an instant flip"
        ],
        "answer": 1,
        "whyWrong": {
          "0": "They differ exactly at the router: blue-green is an atomic 100% flip between two environments, canary is weighted routing that ramps 1% → 5% → 100%. The configs are opposites.",
          "2": "Rollback speed isn't what the quote is about — detection is. Blue-green's fast rollback doesn't help a canary; a canary you can't measure ramps the bad version to 100% anyway, just later."
        },
        "whyCorrect": "Canary's entire value is the observation loop: compare error rate, p99, and business KPIs between cohorts at small traffic percentages, and abort before the blast radius grows. Strip out the metrics and you're deploying to everyone anyway — just slowly.",
        "bestPractices": "Automate the ramp with metric gates (Argo Rollouts or Flagger wired to Prometheus), and define the abort thresholds *before* the deploy starts — during an incident is the wrong time to decide what 'sick' means.",
        "explanation": "Canary = small blast radius + metrics-driven verdict. Remove the metrics and only the slowness remains.",
        "lessonId": "sd-blue-green-canary"
      },
      {
        "q": "A payment API times out mid-request and the client safely retries. With Stripe-style idempotency keys, why is the customer charged once, not twice?",
        "opts": [
          "The payment gateway blocks all duplicate requests arriving from the same IP address within a short time window",
          "The retry is automatically downgraded to a GET, which the HTTP spec marks as safe, and the server replays the charge internally",
          "The server stored the first request's result under the client's key and returns that cached result instead of re-executing"
        ],
        "answer": 2,
        "whyWrong": {
          "0": "IP-window blocking would reject legitimate rapid purchases from shared IPs and miss retries routed through different paths. Deduplication has to key on the logical operation, not the network source.",
          "1": "Nothing rewrites HTTP verbs — a retried POST is still a POST. The safety comes from the key lookup on the server, not from changing the method."
        },
        "whyCorrect": "The client generates a UUID per logical operation; the server stores (idempotency key → result) for ~24 hours. The first request executes the charge; any retry with the same key gets the cached result back without re-running the side effect.",
        "bestPractices": "Accept an idempotency key on every side-effect endpoint you own — the cost is one DB row and an index lookup, the payoff is bullet-proof retries. In a distributed system, anything that *can* run twice eventually will.",
        "explanation": "Key → cached result. Retries return the stored outcome instead of re-charging.",
        "lessonId": "sd-idempotency-deploys"
      },
      {
        "q": "Among cloud networking primitives, security groups are 'stateful' and NACLs are 'stateless'. Operationally, what does that difference mean?",
        "opts": [
          "A security group auto-allows reply traffic for permitted requests; a NACL needs explicit rules in both directions",
          "Security group rules survive instance reboots, while NACL rules reset to their defaults whenever the subnet changes",
          "Security groups filter at L7 using request context like headers, while NACLs only understand raw IP addresses"
        ],
        "answer": 0,
        "whyWrong": {
          "1": "Both persist until someone changes them — 'state' here means connection tracking on live traffic, not configuration durability across reboots.",
          "2": "Both are L3/L4 filters working on ports, protocols, and CIDR ranges. Header-aware L7 filtering is a WAF's job, sitting at the load balancer."
        },
        "whyCorrect": "Stateful means connection tracking: if the security group allows the inbound request, the reply flows out automatically. Stateless NACLs evaluate every packet in isolation, so you must write explicit return-path rules — forget them and connections half-open and silently drop.",
        "bestPractices": "Use security groups as the daily firewall and reach for NACLs only for subnet-wide blocklists. When you do use NACLs, remember replies come back on ephemeral ports (1024-65535) — the classic missing rule.",
        "explanation": "Stateful = replies auto-allowed. Stateless NACLs need both directions written out.",
        "lessonId": "cloud-networking"
      },
      {
        "q": "In trunk-based development, half-finished features merge to main daily without breaking users. What makes that safe?",
        "opts": [
          "A dedicated release branch per sprint isolates the unfinished work until the sprint demo signs off on it",
          "Feature flags — the code ships dark, and turning it on is a separate decision from deploying it",
          "CI skips tests on commits marked work-in-progress so incomplete code can't fail the build"
        ],
        "answer": 1,
        "whyWrong": {
          "0": "Release branches are exactly the long-lived-branch model trunk-based development replaces. Isolating work in branches reintroduces the merge rot and integration risk you were trying to kill.",
          "2": "Precisely backwards — trunk-based development is suicidal without fast, reliable CI gating every merge. Nothing gets a test bypass; the trunk must stay always releasable."
        },
        "whyCorrect": "Decoupling deploy from release is the whole trick: unfinished code merges and ships behind a flag that's off, then gets enabled for staff, 1% of users, and finally everyone. The trunk stays releasable while work lands in small daily increments.",
        "bestPractices": "Kill flags within weeks of full rollout — flag debt is dead branching logic rotting in your codebase. And keep branches under 24 hours; a PR that sits overnight is a long-lived branch in disguise.",
        "explanation": "Feature flags let unfinished code ship dark — deploy and release become separate decisions.",
        "lessonId": "agile-trunk-based"
      },
      {
        "q": "In `.github/workflows/ci.yml`, a top-level `concurrency` group keyed on `${{ github.ref }}` with `cancel-in-progress: true` means a force-push to a branch ____.",
        "opts": [
          "queues the new run to start only after the in-flight run has finished",
          "re-runs the older commit to completion first so the history stays linear",
          "cancels the superseded in-flight run instead of letting it finish"
        ],
        "answer": 2,
        "whyWrong": {
          "0": "Queueing is what you get with `cancel-in-progress: false` (or no concurrency at all). The whole point of the `true` flag is to *not* wait — the stale run stops immediately.",
          "1": "CI never resurrects older commits. The superseded run is killed mid-flight; its commit's results simply stop mattering because a newer ref exists."
        },
        "whyCorrect": "The group key `ci-${{ github.ref }}` means one live run per ref: when a new commit lands on the same branch, `cancel-in-progress: true` kills the now-stale run so minutes aren't burned testing code nobody will merge.",
        "bestPractices": "Key concurrency on `github.ref`, not a fixed string — a fixed string would make unrelated branches cancel each other. Verify it works: force-push a branch and watch the old run flip to 'cancelled'.",
        "lessonId": "gh-actions-ci"
      },
      {
        "q": "The watchdog's percentile method reads `s = sorted(self.samples)` then `return s[int(len(s) * p)]` — and it crashes at startup, before the first poll completes. What's wrong?",
        "opts": [
          "`sorted()` sorts the live deque in place, so concurrent pollers corrupt the sample window",
          "There is no empty-window guard — with zero samples it indexes into an empty list",
          "`int()` truncates the index, so on small windows p99 silently returns the p50 sample"
        ],
        "answer": 1,
        "whyWrong": {
          "0": "`sorted()` is the *safe* call — it copies before sorting, which is exactly why the lesson uses it. In-place mutation is `.sort()`, and a deque doesn't even have one.",
          "2": "Truncation is handled by the clamp (`min(len(s)-1, ...)`) and it never crashes — at worst a tiny window makes p99 and p50 coincide. The startup crash is a different, louder failure."
        },
        "whyCorrect": "At startup the ring buffer is empty: `len(s)` is 0, `int(0 * p)` is 0, and `s[0]` on an empty list raises IndexError. The reference version guards first — `if not self.samples: return 0.0` — before it ever indexes.",
        "bestPractices": "Percentile code has two mandatory guards: an empty-window early return and an index clamp for tiny windows. And always copy-then-sort — sorting a buffer that another task is appending to is a race that only shows up under load.",
        "lessonId": "health-watchdog"
      }
    ],
    "distinguished": [
      {
        "q": "In K8s, what does a readiness probe gate?",
        "opts": [
          "Pod restart",
          "Inclusion in Service endpoints",
          "Image pull retry"
        ],
        "answer": 1,
        "whyWrong": {
          "0": "Pod restart is gated by the **liveness** probe (or a crash). Readiness failures keep the pod running but quiet.",
          "2": "Image pull retry is the kubelet's backoff loop on `ImagePullBackOff`. Probes never run before the container starts."
        },
        "whyCorrect": "A failing readiness probe removes the pod from the Service's endpoint list — traffic stops flowing to it — but the pod keeps running so it can warm up, finish a slow startup, or drain in-flight requests.",
        "bestPractices": "Use readiness for \"ready to take traffic\" (DB connected, cache warm) and liveness for \"totally stuck, please restart me\". Conflating them causes restart storms."
      },
      {
        "q": "In a K8s cluster on an overlay network, SSH and health checks between hosts work, but large HTTP responses between pods on different nodes hang forever. Which container-networking gotcha is this?",
        "opts": [
          "MTU mismatch — VXLAN adds ~50 bytes of header, so packets near 1500 bytes get dropped once encapsulated",
          "Port exhaustion — the docker-proxy runs out of ephemeral ports whenever a response spans multiple packets",
          "DNS TTL expiry — long responses outlive the service record, so the connection loses its route halfway through the transfer"
        ],
        "answer": 0,
        "whyWrong": {
          "1": "Ephemeral ports are consumed per *connection*, not per packet — a large response streaming over one TCP connection uses exactly one port pair, no matter how many packets it takes.",
          "2": "DNS is consulted once at connection setup. An established TCP connection routes by IP and never re-resolves mid-transfer, so record expiry can't sever it."
        },
        "whyCorrect": "VXLAN encapsulation adds ~50 bytes, so with a 1500-byte host MTU any inner packet over ~1450 bytes no longer fits after wrapping and silently vanishes. Small packets (SSH keystrokes, health probes) fit; bulk transfers stall — the signature symptom. Lower the overlay MTU.",
        "bestPractices": "When cross-host traffic half-works, tcpdump the bridge and compare packet sizes on both ends, or sweep with `ping -s` to find the size where loss starts. Check the CNI's configured MTU against the host NIC's.",
        "explanation": "Classic VXLAN MTU trap: small packets pass, near-MTU packets die after encapsulation.",
        "lessonId": "sd-container-networking"
      },
      {
        "q": "To debug faster, an engineer adds `user_id` as a label on every request metric. Months later the observability bill and dashboard query times explode. Why?",
        "opts": [
          "Metrics carrying string labels get stored internally as log lines, which bill at the much higher log-ingest rate",
          "Each label value mints a separate time series — high-cardinality labels multiply storage and query cost",
          "Labels are re-indexed nightly, and the reindex job holds a global lock that slows every dashboard while it runs"
        ],
        "answer": 1,
        "whyWrong": {
          "0": "Metrics stay metrics regardless of label type — there's no hidden conversion to log storage. The cost driver is the *count* of unique series, not the storage format.",
          "2": "Time-series databases don't run nightly reindex jobs with global locks. The slowdown is query-time fan-out: every dashboard panel now aggregates across millions of series instead of dozens."
        },
        "whyCorrect": "A time-series database keys storage on the unique combination of label values. A million users means a million separate series *per metric* — storage, ingestion, and every query's working set all scale with it. That's the cardinality trap.",
        "bestPractices": "Label metrics with low-cardinality dimensions only (service, route, status class). Per-user context belongs in traces and structured logs, where you can correlate back via trace IDs or exemplars.",
        "explanation": "Every unique label value is its own time series — user_id explodes cardinality.",
        "lessonId": "cloud-observability"
      },
      {
        "q": "Under FinOps cost models, which workload actually belongs on spot instances at 60-90% off?",
        "opts": [
          "The primary Postgres instance, since managed failover restarts it cleanly if the capacity gets reclaimed",
          "The customer-facing API fleet, because the autoscaler replaces preempted nodes within a couple of minutes",
          "Checkpointed ML training and stateless batch jobs that can absorb a two-minute preemption notice"
        ],
        "answer": 2,
        "whyWrong": {
          "0": "A two-minute reclaim on your primary database is a forced failover at the cloud's whim — connection storms, replication lag, possible data loss on unflushed writes. Steady stateful baseline belongs on reserved or savings-plan pricing.",
          "1": "Minutes of missing capacity is user-visible degradation every time the spot market moves against you. Betting your latency SLO on spare-capacity availability inverts the risk math — spot suits work that can pause, not work users are waiting on."
        },
        "whyCorrect": "Spot is unused capacity the cloud can yank back with two minutes' notice. Work that checkpoints often and holds no client connections — training runs, batch ETL — loses nothing when preempted and pockets the 60-90% discount.",
        "bestPractices": "Match pricing mode to workload shape: on-demand for spikes, reserved/savings plans for steady baseline, spot for interruptible compute. And set budget alarms at 50/80/100% of forecast so leaks surface before invoice day.",
        "explanation": "Spot = deep discount, 2-minute yank risk. Only interruptible, checkpointed work qualifies.",
        "lessonId": "cloud-cost"
      },
      {
        "q": "A service has a 99.9% availability SLO (~43 minutes/month of error budget) and burned it all by mid-month. In the SRE model, what does the team do?",
        "opts": [
          "Freeze feature releases and spend the rest of the month on reliability work until the budget is earned back",
          "Raise the SLO to 99.99% so the remaining half of the month runs under a stricter guard against further burn",
          "Reset the budget immediately after the blameless postmortem, since the review formally closes out the incident"
        ],
        "answer": 0,
        "whyWrong": {
          "1": "Tightening the SLO mid-incident shrinks the already-exhausted budget and changes nothing about the released risk. SLOs move deliberately, with product and user needs — never as a panic response to burn.",
          "2": "Blameless postmortems buy learning, not budget. The error budget replenishes with the rolling measurement window; no amount of review paperwork restores spent reliability."
        },
        "whyCorrect": "The error budget is a control loop you spend deliberately: inside budget, ship faster; budget burned, releases freeze and engineering effort shifts to the reliability work that earns it back. That math — not heroics — is what makes SRE a discipline instead of rebadged ops.",
        "bestPractices": "Publish budget burn on a dashboard everyone can see, and agree on the freeze rule *before* you need it — then enforcing it is arithmetic, not an argument between product and on-call.",
        "explanation": "Burned budget = release freeze + reliability work. The budget is the contract.",
        "lessonId": "cloud-models"
      }
    ]
  },
  "mlops": {
    "novice": [
      {
        "q": "In supervised learning, what does the model learn from?",
        "opts": [
          "Random noise",
          "Its own predictions only",
          "Labeled examples"
        ],
        "answer": 2,
        "whyWrong": {
          "0": "Random noise is what regularization tries to avoid memorizing. A model trained on pure noise generalizes to nothing.",
          "1": "Learning purely from its own predictions is closer to unsupervised / self-supervised setups. Supervised means an external teacher signal."
        },
        "whyCorrect": "Supervised learning means each input x has a known label y. The model minimizes the gap between its prediction ŷ and y — labels are the \"supervision\".",
        "bestPractices": "Audit label quality before model quality. A 10% label noise rate caps your achievable accuracy regardless of how fancy the architecture is."
      },
      {
        "q": "What is a \"feature\" in ML?",
        "opts": [
          "An input variable to the model",
          "A new capability in a product release",
          "One labeled example in the dataset"
        ],
        "answer": 0,
        "whyWrong": {
          "1": "That's the product-release meaning of 'feature'. In ML the word means an input column of the dataset.",
          "2": "That's an *example* (a row). A feature is a *column* — one measured property across every row."
        },
        "whyCorrect": "A feature is one column / dimension of input — age, pixel intensity, embedding component, etc. The model maps features to predictions.",
        "bestPractices": "Treat feature engineering as half the model. A weak model with great features beats a strong model with garbage features almost every time."
      },
      {
        "q": "Training data is used to...",
        "opts": [
          "Test final accuracy",
          "Fit the model parameters",
          "Replace the model"
        ],
        "answer": 1,
        "whyWrong": {
          "0": "Test accuracy is measured on a held-out test set you never trained on. Evaluating on training data overestimates real-world performance.",
          "2": "Data and models are different things — data feeds the model, doesn't become it."
        },
        "whyCorrect": "Training data drives the optimization: the model adjusts its parameters to minimize the loss on these examples. The test set is reserved for honest final evaluation.",
        "bestPractices": "Always split train/val/test BEFORE looking at the data. If you peek at the test set during model selection, you've leaked information and your metric is optimistic."
      },
      {
        "q": "In the ML lifecycle, a model that has decayed in production most often shows up as what?",
        "opts": [
          "A spike of exceptions and 500 errors that pages on-call the moment accuracy starts to slip",
          "Quietly wrong outputs — the service stays green while its decisions slowly get worse",
          "Failing unit tests in CI, because the test suite re-checks the model's predictions on every build"
        ],
        "answer": 1,
        "whyWrong": {
          "0": "Exceptions are the traditional-software failure mode. A decayed model still returns valid-looking predictions, so nothing throws, no 500s fire, and PagerDuty stays silent.",
          "2": "CI catches regressions when 'correct' is a fixed target. The lifecycle lesson's comparison table is explicit: tests do NOT catch ML regressions, because metrics drift silently while the code is unchanged."
        },
        "whyCorrect": "The lesson's traditional-vs-ML table lists the primary ML failure mode as 'quietly wrong' output. The world shifts under the trained weights, accuracy erodes, and no alarm fires — teams learn about it from customer complaints unless they built monitoring.",
        "bestPractices": "Build drift monitoring before you need it — watch input and prediction distributions in near-real-time, because accuracy is a trailing signal that depends on labels arriving late."
      },
      {
        "q": "During training & evaluation you plot both curves: training error is high AND validation error is high. Which regime are you in?",
        "opts": [
          "Underfitting — the model is too simple to capture the real structure, so it is wrong everywhere",
          "Overfitting — the model memorized the training set and the damage shows up on both curves at once",
          "Data leakage — the validation set contaminated training and dragged both error rates up together"
        ],
        "answer": 0,
        "whyWrong": {
          "1": "Overfitting has the opposite signature: training error near zero with validation error high — the gap is the tell. Here there is no gap; the model is bad on data it has already seen.",
          "2": "Leakage inflates offline scores rather than hurting them — it makes validation look too GOOD, and the disappointment arrives in production. Uniformly high error points at capacity, not contamination."
        },
        "whyCorrect": "High error on the training set itself means the model lacks the capacity to represent the pattern — high bias. Since it never fit the data it trained on, it cannot do better on held-out data either.",
        "bestPractices": "Fix underfitting by adding capacity or better features before touching regularization — regularizing an already-too-simple model pushes it further into high bias.",
        "lessonId": "training-eval"
      },
      {
        "q": "Per 'What ML actually does', which of these problems should stay as rule-based code rather than become an ML model?",
        "opts": [
          "Detecting fraud in card transactions, where the patterns are tangled and shift as fraudsters adapt",
          "Ranking search results, where relevance depends on messy signals nobody can fully enumerate",
          "Calculating payroll taxes, where the rules are written down and provable correctness is required"
        ],
        "answer": 2,
        "whyWrong": {
          "0": "Fraud is one of the lesson's canonical ML-shaped problems — the rules are too tangled to spell out by hand, and being right most of the time is acceptable because wrong answers are reviewable.",
          "1": "Search relevance is exactly where rule lists collapse under their own weight. ML earns its keep when humans struggle to articulate the pattern — that is the taste-tester, not the recipe."
        },
        "whyCorrect": "ML is what you reach for when you can't write the recipe. Payroll HAS a recipe: enumerable rules plus a hard requirement for provable correctness — something a statistical, fit-not-written function can never offer.",
        "bestPractices": "Before any ML project, ask whether a regex or an if-statement solves it. A simple rule that is 100% right beats a model that is 95% right and needs monitoring, retraining, and an on-call rotation."
      },
      {
        "q": "You open a teammate's notebook and see `kmeans.fit(X)` — no `y` anywhere. Using the supervised vs unsupervised vs RL sniff test, what are you looking at?",
        "opts": [
          "Supervised learning — k-means derives its own labels from the cluster assignments as it iterates",
          "Unsupervised learning — `.fit` takes only `X`, so the model is finding structure without an answer key",
          "Reinforcement learning — the cluster centers act as reward signals the algorithm maximizes over many tries"
        ],
        "answer": 1,
        "whyWrong": {
          "0": "Supervised means an EXTERNAL teacher signal — `.fit(X, y)` with human-provided labels. Cluster assignments are discovered structure the algorithm invents, not ground truth someone supplied.",
          "2": "RL's giveaway is an agent stepping through an environment collecting rewards — `env.step`, `reward`, a policy updated over time. K-means has no actions, no environment, and no delayed feedback."
        },
        "whyCorrect": "The lesson's sniff test: if `.fit` takes a `y`, it's supervised; if it takes only `X`, it's unsupervised; if you see `env.step` and `reward`, it's RL. K-means groups similar rows with no answer key — the kid alone with the Lego pile.",
        "bestPractices": "Reach for unsupervised methods when labels are expensive — clustering or self-supervised pretraining can give you 80% of the signal before you fund a labeling project.",
        "lessonId": "ml-intro-paradigms"
      },
      {
        "q": "Problem framing turns the business wish 'reduce churn' into what?",
        "opts": [
          "A one-sentence prediction contract naming the target, the inputs available at decision time, the horizon, and the unit of prediction",
          "A labeled training dataset — framing is chiefly about collecting enough churn examples before the modeling work can begin",
          "An early model-architecture decision — settling whether churn calls for trees, logistic regression, or a neural network"
        ],
        "answer": 0,
        "whyWrong": {
          "1": "Data collection comes AFTER framing. You cannot label examples until framing tells you what the label even is (cancel within 7 days? 30?) and which unit — user, session, transaction — gets one.",
          "2": "Architecture is one of the last decisions. The lesson's detective analogy applies: pick the wrong question and every clue collected afterward is wasted effort — model choice included."
        },
        "whyCorrect": "A well-framed problem reads like a sentence: 'Given a user's activity in the last 14 days, predict the probability they cancel in the next 7.' That answers the four framing questions — target, inputs, horizon, granularity — and gives the pipeline a contract to honor.",
        "bestPractices": "Write the framing sentence down before touching data, and record a baseline (a simple rule or last-week's-value). If the model can't beat the baseline, you haven't solved the framed task — you've just built a model.",
        "lessonId": "ml-intro-framing"
      },
      {
        "q": "In linear regression, why does the loss square the errors instead of just summing the raw differences?",
        "opts": [
          "Because squared loss is the only differentiable option — raw or absolute errors cannot be optimized numerically",
          "Because squaring rescales every error into the range [0, 1], keeping features on comparable scales during the fit",
          "So positive and negative misses can't cancel out, and big misses hurt disproportionately more than small ones"
        ],
        "answer": 2,
        "whyWrong": {
          "0": "Raw differences are perfectly differentiable — their problem is cancellation (a +5 and a −5 miss sum to a 'perfect' zero). Absolute error is also usable (that's L1 loss); squaring is a deliberate choice, not the only workable one.",
          "1": "Squaring bounds nothing — a miss of 10 becomes 100. Rescaling inputs to a range is feature scaling (standardization / min-max), a preprocessing step entirely separate from the loss function."
        },
        "whyCorrect": "The lesson defines 'as close as possible' as minimizing the sum of SQUARED distances: squaring stops positive and negative misses from cancelling, and it makes large misses cost disproportionately more — the line gets pulled hard toward big outliers in error.",
        "bestPractices": "If linear regression fits your problem, ship it — interpretability and speed beat a 0.3% accuracy bump from a model you can't debug. It's the null hypothesis every fancier model must beat.",
        "lessonId": "ml-core-linear-regression"
      },
      {
        "q": "One of your numerical features — follower count — spans from 3 to 30 million. What does the numerical features lesson say to do before feeding it to a gradient-based model?",
        "opts": [
          "Take log(1+x) first — it compresses the long tail so the huge magnitudes don't drown out every other feature",
          "Nothing — gradient-based models learn their own internal scaling during training, so raw magnitudes are fine to feed in directly",
          "Drop the column — a feature spanning several orders of magnitude carries too much noise to be a reliable signal"
        ],
        "answer": 0,
        "whyWrong": {
          "1": "Tree models are the forgiving ones; gradient-based models almost always need the transform. A feature in the millions drowns out the 0-to-1 features before training even starts — the ingredients are in grams and gallons.",
          "2": "Heavy-tailed features like income, file sizes, and follower counts are often among the STRONGEST signals. The fix is transforming the scale, not throwing the information away."
        },
        "whyCorrect": "When a feature spans many orders of magnitude, the lesson's standard first move is log(1+x): it compresses the long tail and makes the relationship more linear, which gradient-based models need.",
        "bestPractices": "Fit scaling statistics on the training set only, then apply that same transform to validation and test — computing them on the full dataset leaks test information into training.",
        "lessonId": "ml-data-numerical"
      },
      {
        "q": "A teammate encodes the categorical feature `country` as integers — JP=1, BR=2, KE=3 — and trains a linear model on it. What just went wrong?",
        "opts": [
          "Nothing yet — integer encoding is the standard first step, and the model will learn to ignore the arbitrary numbering",
          "The encoding invented an order and distances that don't exist — the model now believes Kenya is three times Japan",
          "Integers are fine for nominal data like country but break for ordinal data like small/medium/large, which needs one-hot"
        ],
        "answer": 1,
        "whyWrong": {
          "0": "A linear model can't 'ignore' the numbering — it multiplies the code by a single weight, so the fake magnitudes flow straight into every prediction. Only some tree implementations tolerate integer-coded categories.",
          "2": "That's exactly backwards. Ordinal categories (small < medium < large, bronze < silver < gold) are where integers give the model useful structure for free; nominal ones like country are where integers invent lies."
        },
        "whyCorrect": "Country labels don't have a size — Japan isn't bigger than Brazil. Categorical encoding is the job of turning names into numbers WITHOUT inventing an order that isn't there, which is why one-hot is the safe default for nominal features.",
        "bestPractices": "Fit the encoder on training data only, then persist and version it so serving applies the identical mapping — and decide the policy for unseen categories (an `unknown` bucket) at training time, not at 3am.",
        "lessonId": "ml-data-categorical"
      },
      {
        "kind": "order",
        "q": "Put the ML lifecycle stages in order — from a business wish to a model you can trust in production.",
        "items": [
          "Frame the problem as a measurable prediction task",
          "Collect and validate the data",
          "Train and evaluate candidate models",
          "Deploy the winner behind an API",
          "Monitor predictions and drift in production"
        ],
        "whyWrong": "Teams that start at 'train' ship models that answer the wrong question — framing decides the label, the metric, and whether the project can succeed at all. And a deploy without monitoring is a model you've agreed to stop understanding.",
        "whyCorrect": "Frame → data → train/eval → deploy → monitor, and the loop repeats: monitoring findings become the next round's training data. The loop, not the model, is the product.",
        "bestPractices": "Write the monitoring plan when you frame the problem — if you can't say how you'd detect the model going stale, the framing isn't done."
      }
    ],
    "junior": [
      {
        "q": "What is model serving?",
        "opts": [
          "Retraining a model on production traffic",
          "Visualizing a model's weights for debugging",
          "Exposing a trained model to make predictions"
        ],
        "answer": 2,
        "whyWrong": {
          "0": "Training is the offline learning phase. Serving is what happens after — using the result in production.",
          "1": "Visualizing weights is a debugging / interpretability activity. Useful, but not what \"serving\" means."
        },
        "whyCorrect": "Serving puts a trained model behind an API (REST, gRPC, batch job) so other systems can send inputs and get predictions back — usually with latency, throughput, and version constraints.",
        "bestPractices": "Wrap models with versioned APIs (e.g. `/v1/predict`). Roll new models out behind A/B or shadow traffic before flipping 100%.",
        "lessonId": "mlops-serving-apis"
      },
      {
        "q": "You randomly shuffle a time-series dataset into train/test splits and the metrics look amazing. Which kind of leakage did you most likely just create?",
        "opts": [
          "Group leakage — shuffling lands the same user in both splits, so the model just recognizes individuals",
          "Preprocessing leakage — the shuffle lets the scaler's mean and sigma absorb test-set statistics",
          "Temporal leakage — the model trains on the future and is tested on the past, a setup production can never reproduce"
        ],
        "answer": 2,
        "whyWrong": {
          "0": "Group leakage is real but it's a different mechanism — the same patient, user, or document appearing on both sides of the split. It happens with or without time; the time-series-specific trap is training on the future.",
          "1": "Preprocessing leakage comes from fitting transforms (scaler, imputer) on ALL rows before splitting — a separate mistake. Shuffling by itself doesn't touch your scaler."
        },
        "whyCorrect": "Random splits on time-series data let the model peek at tomorrow to predict yesterday, inflating offline metrics with information that won't exist at serve time. The lesson's rule: always split by time — rolling or expanding windows, e.g. TimeSeriesSplit.",
        "bestPractices": "Treat suspiciously high scores as a leak alarm, not a win — 99% on a hard problem almost always means leakage. Investigate before you celebrate.",
        "lessonId": "ml-data-splits-leakage"
      },
      {
        "q": "Your fraud classifier reports 99% accuracy and the team wants to ship. Per the classification & metrics lesson, what do you check first?",
        "opts": [
          "The class balance — with 1% fraud, a model that says 'never fraud' also scores 99%, so read recall and PR-AUC instead",
          "The calibration curve — accuracy that high usually means the predicted probabilities are badly miscalibrated",
          "The test-set size — a 99% accuracy figure is only trustworthy once you have evaluated on at least a million rows"
        ],
        "answer": 0,
        "whyWrong": {
          "1": "Calibration matters when you use the probabilities downstream, but it's orthogonal to this trap — a perfectly calibrated model on 99% negatives still makes accuracy a meaningless headline number.",
          "2": "More rows don't fix a broken metric — 'never fraud' scores 99% on a million examples too. The problem is what accuracy measures on imbalanced data, not how much data measured it."
        },
        "whyCorrect": "Accuracy is misleading on imbalanced data: at 1% fraud, the do-nothing classifier gets 99%. For fraud, missing a positive is the expensive failure, so the lesson points you at recall — and PR-AUC when ranking on imbalanced classes matters.",
        "bestPractices": "Never ship a classifier with one number. Ship the confusion matrix, the threshold you chose, and the cost assumption behind it — that's the artifact a stakeholder can actually argue with.",
        "lessonId": "ml-core-classification-metrics"
      },
      {
        "q": "When serving models as APIs with FastAPI, why does the lesson insist on loading the model at module scope instead of inside the request handler?",
        "opts": [
          "Module scope is thread-safe in Python — loading inside an async handler risks two requests corrupting the weights",
          "A handler-scoped load re-reads the artifact from disk on every request — module scope loads once at boot so the model is hot",
          "Handler-scoped loads leak GPU memory, because each request pins a fresh copy of the weights that never gets freed"
        ],
        "answer": 1,
        "whyWrong": {
          "0": "Model weights are read-only at inference — concurrent reads don't corrupt them. The cost of loading in the handler is latency and wasted I/O, not data corruption.",
          "2": "Per-request copies would be garbage-collected, so 'leak' is the wrong mental model. The documented failure is repeated disk/S3 reads on the hot path — every request pays the load time again."
        },
        "whyCorrect": "The lesson's watch-list names it directly: 'loading the model inside the handler — every request re-reads from disk.' Load once in module scope so the model is hot on every request; the related trap is cold start, where the first request after deploy pulls weights from S3 and can take 30s+.",
        "bestPractices": "Pre-warm replicas before shifting traffic to them (canary, autoscale) and run a worker pool — one model copy per worker. Add a batch endpoint: 100 single calls cost far more than one batch of 100.",
        "lessonId": "mlops-serving-apis"
      },
      {
        "q": "You retrain the churn model on fresh data — request and response fields are completely unchanged. Per API contracts for ML services, what gets bumped?",
        "opts": [
          "Both — every retrain becomes a new /v2 endpoint so client teams can pin exactly the model they integrated against",
          "Nothing — retrains should stay invisible to the contract; surfacing a version would only confuse client teams",
          "Only model_version in the response body — the API stays /v1 because the shape of the contract didn't change"
        ],
        "answer": 2,
        "whyWrong": {
          "0": "The model changes daily; the API changes quarterly. Conflating the axes means every retrain breaks your clients — /v2 is reserved for breaking shape changes, like renaming a required field.",
          "1": "Hiding the model version costs you debuggability. The lesson says echo model_version and request_id in every response, so during an incident you can answer 'which model gave this score?'"
        },
        "whyCorrect": "Model version and API version are different axes. A retrain on fresh data bumps model_version in the response body; the /v1 route only becomes /v2 when the contract's shape breaks — a renamed required field or a removed response key.",
        "bestPractices": "Give new request fields defaults so old clients keep working without a redeploy, and validate outputs too — a NaN score crashing the client is still your bug.",
        "lessonId": "mlops-api-contracts"
      },
      {
        "q": "After a crash, your change-data-capture consumer replays and processes some Kafka events twice. Which delivery semantics are you seeing?",
        "opts": [
          "At-least-once — the consumer commits its offset only after the side-effect, so a crash in between means redelivery",
          "At-most-once — crashes surface as duplicates because the broker fires and forgets every message it delivers",
          "Exactly-once — Kafka's transactional protocol guarantees single delivery end-to-end, so duplicates must mean a broker bug"
        ],
        "answer": 0,
        "whyWrong": {
          "1": "At-most-once is the opposite trade: fire-and-forget can DROP messages but never duplicates them. It fits data you can afford to lose — some metrics — not CDC feeding features.",
          "2": "Kafka's exactly-once holds WITHIN Kafka (transactional read-process-write loops). The moment your consumer writes to an external sink like Postgres, you're back to at-least-once unless the sink is idempotent — the lesson calls the marketing claim 'effectively-once if you design for it'."
        },
        "whyCorrect": "At-least-once is the default for CDC + Kafka: commit the offset only after the side-effect lands, so a crash between the write and the commit means the same event is re-delivered. Nothing is lost — but retries duplicate.",
        "bestPractices": "Make the sink idempotent: an upsert keyed on a stable id plus a monotonic source-LSN guard, so a replay can't double-count and an out-of-order event can't overwrite newer data with older data.",
        "lessonId": "mlops-cdc-semantics"
      },
      {
        "q": "Your A/B test for a new ML ranker hits p < 0.05 on day two, and the PM wants to stop early and ship. What's wrong with that?",
        "opts": [
          "Nothing, statistically — p < 0.05 means the result is significant no matter when in the experiment you look at it",
          "Peeking — stopping the moment p dips under 0.05 inflates false positives; sample size must be fixed up front from the MDE",
          "The threshold is too loose — stopping early is fine as long as you demand p < 0.001 before shipping the treatment"
        ],
        "answer": 1,
        "whyWrong": {
          "0": "A p-value assumes a sample size decided in advance. Checking continuously and stopping at the first significant dip is silently running many tests — some cross 0.05 by pure chance, so your false-positive rate balloons.",
          "2": "Tightening the threshold doesn't repair the peeking problem, and it throws away real wins by demanding extreme evidence. The lesson's discipline is: fix the sample size from your minimum detectable effect, then wait."
        },
        "whyCorrect": "The lesson lists peeking as the first trap: 'stopping the moment p < 0.05 inflates false positives — fix sample size up front.' Two days also can't average out day-of-week cycles or the novelty effect, where users click anything new for a week and then revert.",
        "bestPractices": "Lock the primary metric and MDE before launch, pre-register guardrails, and run at least one full weekly cycle. Sample size grows as 1/MDE² — halving the effect you want to detect needs 4x the traffic."
      },
      {
        "q": "A fraud model degrades badly over six months with zero code changes and green CI the whole time. Why does MLOps exist, per the short version?",
        "opts": [
          "The eval suite was too thin — with enough test coverage of the model's predictions, CI would have caught the regression",
          "Retraining wasn't scheduled — MLOps is essentially cron for training jobs, and a weekly retrain makes drift impossible",
          "The bug isn't in the code — it's in the relationship between the code and reality; the world moved while the artifact stayed identical"
        ],
        "answer": 2,
        "whyWrong": {
          "0": "CI catches regressions when 'correct' is a fixed target — same input, same output, forever. Here nothing in the artifact regressed; the environment around it shifted, which no code-level test can observe.",
          "1": "Retraining cadence is one tool, not the discipline — and a blind weekly retrain can happily refit on drifted or poisoned data. You still need monitoring, eval gates, and versioned data around it."
        },
        "whyCorrect": "The lesson's core line: 'In software, the artifact rots when you change it. In ML, the artifact rots when you don't.' Fraudsters changed tactics, so the identical model quietly stopped matching reality — the bug lives between the code and the world.",
        "bestPractices": "Build drift monitors before you build the model, and decide the retraining policy up front — scheduled, drift-triggered, or continuous. Never the unspoken fourth option: 'when someone complains.'",
        "lessonId": "m1"
      },
      {
        "kind": "order",
        "q": "Order the journey of a feature value for a real-time prediction — offline to online.",
        "items": [
          "Raw events land in the warehouse",
          "A pipeline computes the feature offline",
          "The value is materialized into the online store",
          "The serving API fetches it at request time",
          "The same value is logged for training parity"
        ],
        "whyWrong": "Fetching from the warehouse at request time is the tempting shortcut that adds seconds of latency — the whole point of the online store is precomputed lookups in milliseconds. Skipping the parity log is how training/serving skew sneaks in.",
        "whyCorrect": "Warehouse → offline compute → online materialization → low-latency fetch → parity logging. One definition of the feature, two synchronized homes.",
        "bestPractices": "Any feature served online must be reproducible offline from the same code path — if the two definitions can drift, they will."
      },
      {
        "kind": "order",
        "code": true,
        "q": "Order the body of this idempotent CDC consumer loop — one event, from poll to acknowledgement.",
        "items": [
          "msg = c.poll(1.0)  # blocking poll, returns one record",
          "evt = msg.value()  # {\"user_id\": 42, \"tier\": \"gold\", \"lsn\": 99421}",
          "cur.execute(UPSERT_SQL, (evt[\"user_id\"], evt[\"tier\"], evt[\"lsn\"]))  # idempotent upsert",
          "conn.commit()  # write lands first…",
          "c.commit(msg)  # …THEN acknowledge — crash here = safe replay"
        ],
        "whyWrong": "Committing the Kafka offset before the Postgres write flips you from at-least-once to at-most-once — a crash between the two silently drops the event forever. And upstream of that, you can't upsert a payload you haven't polled and parsed yet.",
        "whyCorrect": "Poll → parse → upsert → commit the write → only then commit the offset. The side-effect must land before the acknowledgement: a crash at any point replays the event instead of losing it, and the idempotent upsert makes the replay harmless.",
        "bestPractices": "Set `enable.auto.commit: False` so the offset commit is yours to place, and pair it with an idempotent sink — an upsert keyed on a stable id plus a monotonic source-LSN guard so a replay can't double-count.",
        "lessonId": "mlops-cdc-semantics"
      },
      {
        "q": "Per API contracts for ML services, a realtime endpoint should refuse nulls loudly: a feature missing at serve time usually means an upstream service is ____.",
        "opts": [
          "slow",
          "stale",
          "down"
        ],
        "answer": 2,
        "whyWrong": {
          "0": "A slow upstream shows up as latency — your p99 climbs, requests time out. The feature still arrives, just late. A null means the value never came at all.",
          "1": "Staleness gives you an OLD value, not a missing one — that's a materialization-lag problem for the online store to flag, and the request still carries a number."
        },
        "whyCorrect": "The lesson splits the contracts: batch jobs see nulls all the time (a backfill row missing yesterday's count is normal), but in realtime a missing feature means the service that computes it is down — so reject loudly, or return a fallback with `degraded: true`.",
        "bestPractices": "Give batch and realtime different nullability rules instead of one shared endpoint, and never silently coerce or zero-fill at the edge — the null is your outage signal, and masking it hides real drift.",
        "lessonId": "mlops-api-contracts"
      }
    ],
    "senior": [
      {
        "q": "What is data drift?",
        "opts": [
          "Input distribution shifting from training",
          "GPU memory leaking over long serving runs",
          "A dropout layer misfiring at inference"
        ],
        "answer": 0,
        "whyWrong": {
          "1": "GPU memory leaks are an infrastructure problem. Drift is about *data*, not memory.",
          "2": "Dropout is a regularization technique used during training. Unrelated to monitoring."
        },
        "whyCorrect": "Data drift means the live input distribution P(x) no longer matches what the model was trained on. The model can still predict, but accuracy quietly degrades because it's seeing inputs it never saw before.",
        "bestPractices": "Monitor input feature distributions in production (KS test, PSI, embedding-space distances). Trigger retraining or alerting when drift exceeds a threshold."
      },
      {
        "q": "When a feature store builds a training set from the offline store, what does the point-in-time (as-of) join actually protect you from?",
        "opts": [
          "Joining features as they look NOW onto historical examples — training would see information invisible at the prediction timestamp",
          "Duplicate rows in the entity dataframe — the as-of join deduplicates users so no training example gets counted twice",
          "Online-store staleness — the join refreshes Redis from the warehouse so inference always reads current feature values"
        ],
        "answer": 0,
        "whyWrong": {
          "1": "Deduplication is ordinary data hygiene, not what as-of joins do. The join's job is temporal: matching each training row to the feature values that existed at that row's event timestamp.",
          "2": "That's the wrong direction — materialization pushes warehouse values into the online store, and its lag is a separate metric to monitor. The as-of join lives on the offline/training path."
        },
        "whyCorrect": "Point-in-time correctness means training may only see data that WOULD have been visible at the prediction timestamp. A join that uses `now` instead of event time leaks the future into training — a classic cause of training-serving skew — and feature stores do the as-of join for you.",
        "bestPractices": "Treat the feature view's TTL as a freshness contract, not a hint — a 7-day TTL nulls anything older, which suits a fraud model but would blank out most rows for a slow-cycle churn model."
      },
      {
        "q": "In model monitoring, which drift signal requires no ground-truth labels at all and is often the first alarm to fire?",
        "opts": [
          "Concept drift — a shift in P(y|X) shows up instantly in the model's own confidence scores, before any labels arrive",
          "Prediction drift — the output histogram P(ŷ) changing shape is cheap to compute straight off the prediction log",
          "Accuracy drop — the live accuracy dashboard updates in real time as every prediction gets scored against outcomes"
        ],
        "answer": 1,
        "whyWrong": {
          "0": "Concept drift is precisely the one that NEEDS labels — same inputs, different correct answer, like fraud patterns evolving. Confirming that P(y|X) moved requires ground truth, which lands slowly; the lesson calls it 'slow but lethal'.",
          "2": "Accuracy is a trailing indicator: labels arrive days or weeks after predictions (chargebacks, churn outcomes). By the time that dashboard dips, you have already been wrong for a while."
        },
        "whyCorrect": "Prediction drift watches the shape of the model's outputs over a sliding window — no labels needed, computed directly from the X, ŷ, timestamp log — which is why it is often the first alarm to fire when something upstream changes.",
        "bestPractices": "Page on hard signals: PSI > 0.25 sustained on a required feature, prediction-rate cliffs, null-rate spikes. Leave per-feature distribution charts and confusion matrices on dashboards for the weekly review.",
        "lessonId": "mlops-monitoring"
      },
      {
        "q": "Your model shows a big generalization gap — train error near zero, validation error high. Which lever does the overfitting lesson call the cleanest fix?",
        "opts": [
          "Train for more epochs — with enough additional passes, the validation loss eventually catches up to the training loss",
          "Increase model capacity — a larger network can finally represent the validation examples it is currently missing",
          "Get more training data — it's hard to memorize a million examples, so the model is forced to learn the pattern"
        ],
        "answer": 2,
        "whyWrong": {
          "0": "More epochs deepen the memorization — train and validation loss diverge further. The lesson's advice runs the other way: early-stop around the epoch where validation loss bottoms out.",
          "1": "Capacity is the accelerant, not the cure. Overfitting means the model is already flexible enough to model the noise; the listed lever is a SIMPLER model — fewer parameters, shallower trees."
        },
        "whyCorrect": "The lesson orders the levers and puts more data first as 'the cleanest fix — hard to memorize a million examples.' Then: simpler model, regularization (L1/L2, dropout), early stopping, augmentation, and cross-validation for a stable estimate.",
        "bestPractices": "If validation looks great but production collapses, suspect leakage — it's overfitting in disguise. Hunt for features that secretly encode the label before blaming the architecture.",
        "lessonId": "ml-data-overfitting"
      },
      {
        "q": "The training/serving skew lesson insists skew is 'not a model problem.' What is the actual root-cause fix?",
        "opts": [
          "Collapse the two feature implementations into one shared transform, then continuously verify that the one is the one being used",
          "Retrain on fresher data more often — a model refreshed daily can't drift far enough from serving for skew to matter",
          "Add an accuracy-drop alert — offline metrics will flag the skew as soon as the two pipelines start disagreeing"
        ],
        "answer": 0,
        "whyWrong": {
          "1": "Skew isn't decay over time — it's two codepaths computing the 'same' feature differently (pandas mean in training, a streaming approximation in serving). Retraining refits on the offline version, so the mismatch survives every refresh.",
          "2": "Offline metrics are computed with the offline pipeline, so they are structurally blind to it — the lesson's whole tagline is 'the bug your offline metrics can't see.' Detection requires logging served features and replaying them through training code."
        },
        "whyCorrect": "Skew is a software engineering problem: 'two implementations of the same thing.' The fix is the same as for any duplicated-logic bug — collapse to one implementation (share the exact function, or serve and train from a feature store) and then continuously verify it.",
        "bestPractices": "Log the exact feature vector served with each prediction, and run a daily job that replays those vectors through the training transform and diffs the results — a cheap, always-on skew alarm.",
        "lessonId": "sd-training-serving-skew"
      },
      {
        "kind": "order",
        "code": true,
        "q": "Order this continuous-training run — pinned data to promoted model, with the eval gate holding everything behind it.",
        "items": [
          "subprocess.run([\"dvc\", \"pull\", \"data/train.csv.dvc\"], check=True)  # pin the exact data snapshot",
          "model = train_pipeline(\"data/train.csv\")  # fit on the pinned bytes",
          "auc = evaluate(model, \"data/holdout.csv\")  # gate metric",
          "if auc > 0.82:  # the eval gate — bad models stop here",
          "    client.transition_model_version_stage(name=\"churn\", version=v.version, stage=\"Staging\")  # promote for shadow traffic"
        ],
        "whyWrong": "Promoting before the gate pushes an unevaluated model toward live traffic; evaluating before training has nothing to score; and training before `dvc pull` fits on whatever bytes happen to be on disk — the run's lineage is gone.",
        "whyCorrect": "Pin the data, train on it, measure the gate metric, check the gate, and only inside the passing branch touch the registry. Validate before you execute — the stage transition is the side-effect the whole pipeline exists to guard.",
        "bestPractices": "CI promotes to Staging, never Production — a human approves the canary→prod hop after online metrics come back. Log the data SHA with the run so 'which bytes trained this model?' has an answer during an incident.",
        "lessonId": "mlops-continuous-training"
      },
      {
        "q": "In model monitoring, accuracy is a ____ indicator — labels land days or weeks after the predictions, so by the time the number drops you have already been wrong for a while.",
        "opts": [
          "leading",
          "trailing",
          "real-time"
        ],
        "answer": 1,
        "whyWrong": {
          "0": "Leading signals fire BEFORE the damage is confirmed — that's input and prediction drift, computed from live features and scores with no labels needed. Accuracy is the opposite end of that timeline.",
          "2": "There is nothing real-time about it: fraud labels are confirmed chargebacks, churn labels are cancellations — outcomes that arrive on their own delayed schedule, not with the request."
        },
        "whyCorrect": "Accuracy trails reality because it needs ground truth, and ground truth is late. The lesson's line: by the time accuracy drops, the question is how long you've been wrong — not whether. That's why monitoring watches inputs and outputs in near-real-time instead.",
        "bestPractices": "Treat input and prediction drift as your leading alarms (PSI, KS on sliding windows) and leave label-based accuracy on the weekly-review dashboard — it confirms incidents, it doesn't catch them.",
        "lessonId": "mlops-monitoring"
      },
      {
        "q": "In a Feast `FeatureView`, `ttl=timedelta(days=7)` is a freshness contract: an online value older than the TTL is served as ____.",
        "opts": [
          "NULL",
          "0.0",
          "-1"
        ],
        "answer": 0,
        "whyWrong": {
          "1": "Zero-filling would be worse than missing — `avg_basket_7d = 0.0` looks like a real customer who bought nothing, and the model would happily treat the staleness as signal.",
          "2": "A -1 sentinel is something YOUR code might choose to substitute downstream, but the store doesn't invent magic numbers — expired values simply stop being returned."
        },
        "whyCorrect": "TTL caps how stale a served value can be: past it, the online store returns NULL rather than an outdated number. That forces you to make the missing-feature policy explicit instead of silently serving last month's behavior as today's.",
        "bestPractices": "Size TTL to the model's cadence — an hour suits a fraud model, while a 7-day TTL would null-out most rows for a slow-cycle churn model. Then monitor materialization lag, because a healthy TTL can't fix a stalled pipeline.",
        "lessonId": "mlops-feature-stores"
      },
      {
        "q": "A teammate's drift monitor computes `cuts = np.quantile(current, np.linspace(0, 1, bins + 1))` inside `psi(reference, current)`. Why will its scores be misleading?",
        "opts": [
          "`np.quantile` with `bins + 1` points creates one bin too many, so the histogram counts are shifted off by one",
          "The bin edges come from the live window — the yardstick moves with the drift it is supposed to measure",
          "Quantile-based bins force every bin to hold equal counts, so PSI comes out near zero no matter which sample the edges were derived from"
        ],
        "answer": 1,
        "whyWrong": {
          "0": "`bins + 1` edges define exactly `bins` bins — that part matches the lesson's implementation. Fence-post counting isn't the problem here.",
          "2": "The equal-count property only holds for the sample the quantiles were fit on. PSI's whole signal is the OTHER sample landing unevenly in those bins — which works, as long as the edges are frozen from the reference."
        },
        "whyCorrect": "The lesson computes the cuts from `reference`. Deriving them from `current` re-fits the ruler every window: a shifted live distribution still fills its own quantile bins evenly, so PSI stays near zero while real drift sails past the alarm.",
        "bestPractices": "Freeze the reference statistics — bin edges, means, category frequencies — as a training-time artifact and version it with the model. And keep the outer edges at ±inf so values outside the training range still get counted.",
        "lessonId": "mlops-monitoring"
      },
      {
        "q": "Building a training set for predictions made back in May, a teammate writes `entity_df[\"event_ts\"] = pd.Timestamp.now()` before calling `store.get_historical_features(entity_df=entity_df, ...)`. What's wrong?",
        "opts": [
          "`event_ts` must be each row's original prediction timestamp — an as-of join against `now` leaks future feature values into training",
          "`get_historical_features` reads the online store, so every returned value is capped by the feature view's TTL and most rows come back NULL",
          "The entity dataframe is missing the label column, so the point-in-time join will silently drop every row that has no matching label"
        ],
        "answer": 0,
        "whyWrong": {
          "1": "Historical retrieval runs against the OFFLINE store (warehouse / parquet) — that's the whole point of the two-store split. TTL nulls apply to online lookups at inference time.",
          "2": "Labels ride along as ordinary columns; the join doesn't require or drop them. The join key is the entity plus its timestamp — which is exactly the field this code corrupts."
        },
        "whyCorrect": "Point-in-time correctness means training may only see data that would have been visible at the prediction timestamp. Stamping every row with `now` joins today's feature values onto May's examples — the model trains on the future and the offline metrics inflate, a classic training-serving skew source.",
        "bestPractices": "Carry the real event timestamp through your prediction logs and use it as `event_ts` when assembling training sets — the as-of join only protects you if you hand it the honest time.",
        "lessonId": "mlops-feature-stores"
      }
    ],
    "distinguished": [
      {
        "q": "Accuracy is steady but business KPI drops. Most likely cause?",
        "opts": [
          "A silent bug in the feature pipeline",
          "Concept drift (label meaning changed)",
          "A hardware fault slowing inference"
        ],
        "answer": 1,
        "whyWrong": {
          "0": "A pipeline bug moves the model's inputs, which shows up in accuracy or error rates — not as \"metrics fine, business worse\".",
          "2": "Hardware failures cause unavailability, not silent KPI degradation while accuracy holds."
        },
        "whyCorrect": "Concept drift = P(y|x) changed. The model still predicts the old relationship perfectly, but the world's definition of \"correct\" shifted. Accuracy on stale labels stays flat while real impact erodes.",
        "bestPractices": "Tie model success to downstream KPIs, not just offline accuracy. Sample live predictions for human labeling and watch the gap between offline accuracy and business outcome."
      },
      {
        "q": "You upgrade the embedding model behind your retrieval-augmented generation (RAG) index. What does the lesson say must happen next?",
        "opts": [
          "Only newly ingested documents need the new embedder — old vectors stay valid because similarity is relative within an index",
          "A full re-embed of the index — every old vector now lives in the wrong space, so queries stop landing near their answers",
          "Re-tune the generator prompt — the answering LLM needs to be told the embedding space behind retrieval has changed"
        ],
        "answer": 1,
        "whyWrong": {
          "0": "Mixing spaces silently breaks retrieval: a query embedded by the new model isn't geometrically comparable to vectors from the old one, so 'nearest' neighbors become noise. The lesson: treat embedder version as part of the index schema.",
          "2": "The embedder and the generator are separate models, picked separately. The answering LLM never sees vectors — only retrieved text — so no prompt change can repair a geometry mismatch inside the index."
        },
        "whyCorrect": "This is embedding drift: 'when you upgrade the embedder, every old vector in the index is now in the wrong space.' New embedder = full reindex — budget that cost up front instead of discovering it in production.",
        "bestPractices": "Keep an eval set of ~50 (question, ground-truth chunk) pairs and re-measure recall@k after any retrieval change. RAG fails silently — confident answers from confidently wrong chunks — so without eval, every change is vibes.",
        "lessonId": "llm-rag"
      },
      {
        "q": "With a model registry as the source of truth, what does 'promote v17 to production' actually mean mechanically?",
        "opts": [
          "CI bakes v17 into a fresh serving image and rolls the deployment — the registry then records which image actually shipped",
          "The training pipeline copies v17's artifact to the well-known S3 path that every serving replica reads at startup",
          "A single registry API call transitions v17's stage — serving resolves 'production' through the registry, so no redeploy happens"
        ],
        "answer": 2,
        "whyWrong": {
          "0": "That's promotion-by-deploy, the old pattern the lesson contrasts: model tangled into the image, every promotion a full release cycle. In the registry pattern, the serving image stays stable and models are pulled by stage.",
          "1": "Pointing servers at a magic S3 path recreates the pickle-on-a-laptop problem — no stages, no approvals, no lineage, and rollback becomes a nervous file copy. Serving should ask the registry for a URI, not trust a path."
        },
        "whyCorrect": "Promotion is a registry call — e.g. MLflow's transition_model_version_stage to Production with archive_existing_versions — and serving loads 'models:/name/Production'. Rollback is the inverse call. The release surface shrinks to one audited API call.",
        "bestPractices": "Never auto-promote to Production from CI — keep the human approval on the canary-to-prod hop. Registry lineage is what answers the incident question: which model, trained on what data, served this request?",
        "lessonId": "sd-model-registry-source-of-truth"
      },
      {
        "q": "Day three of a 50/50 A/B test between two models in production: across 400,000 users the assignment counts read 48/52. What's the correct call?",
        "opts": [
          "Stop and fix the splitter — a sample-ratio mismatch means assignment is broken and every downstream metric is untrustworthy",
          "Keep going — at large sample sizes, a 48/52 split is comfortably within normal random variation for a fair coin",
          "Treat it as an early read — users are accumulating in the treatment arm because the treatment model responds faster"
        ],
        "answer": 0,
        "whyWrong": {
          "1": "At 400k users, a fair 50/50 split lands within a small fraction of a percent — a 2-point gap is a statistical impossibility, which is exactly what the SRM check exists to catch. 'Roughly close' intuition fails at scale.",
          "2": "Assignment happens by hashing user_id (salted per experiment) BEFORE either model responds — response latency cannot move users between buckets. Bucket imbalance signals a broken splitter, not user preference."
        },
        "whyCorrect": "This is SRM — sample-ratio mismatch. The lesson is blunt: 'if the 50/50 split came out 48/52, the splitter is broken and the result is meaningless.' A KPI lift measured on a corrupted split proves nothing, so you fix assignment and restart.",
        "bestPractices": "Assign deterministically by hashing user_id salted with the experiment name, verify the realized split as a pre-analysis gate, and only then read the primary KPI — p < 0.05 with no guardrail regressions and no SRM."
      }
    ]
  },
  "swe": {
    "novice": [
      {
        "q": "What is a function?",
        "opts": [
          "A network port",
          "A variable type",
          "Reusable named block of code"
        ],
        "answer": 2,
        "whyWrong": {
          "0": "Network ports (80, 443, ...) are TCP/UDP endpoints. Functions are a programming construct.",
          "1": "Variables hold values. Functions are callable blocks. Different building blocks of a program."
        },
        "whyCorrect": "A function packages a named block of behavior you can call with inputs (arguments) and get outputs (return value) — the fundamental unit of code reuse.",
        "bestPractices": "Keep functions small (one screen, one job). Pure functions (no side effects) are easiest to test and reason about."
      },
      {
        "q": "Which data structure is FIFO?",
        "opts": [
          "Queue",
          "Stack",
          "Tree"
        ],
        "answer": 0,
        "whyWrong": {
          "1": "A stack is LIFO — Last In, First Out. Think stack of plates: you grab the top one.",
          "2": "A tree is hierarchical (parent → children), not ordered as a single in/out line."
        },
        "whyCorrect": "A queue is First In, First Out — the first thing pushed is the first thing popped. Like a line at a checkout.",
        "bestPractices": "Use queues for work item processing (job queues, message queues). Use stacks for backtracking, parsing, and recursion-style state.",
        "lessonId": "s1"
      },
      {
        "q": "Big-O describes...",
        "opts": [
          "Memory layout",
          "How runtime/space scales with input size",
          "CPU clock"
        ],
        "answer": 1,
        "whyWrong": {
          "0": "Memory layout (stack vs heap, alignment) is a separate runtime topic. Big-O is about growth rate, not arrangement.",
          "2": "CPU clock speed is a hardware constant. Big-O is about how work *scales*, independent of clock."
        },
        "whyCorrect": "Big-O captures the asymptotic growth of runtime or memory as input size n grows — O(1), O(log n), O(n), O(n²), etc. It ignores constants because those wash out at large n.",
        "bestPractices": "Whenever you write a nested loop, ask: \"what's the outer × inner?\" Catching O(n²) at design time is way cheaper than catching it in prod at n=1M."
      },
      {
        "q": "Your O(n²) function processes 1,000 items in about 1 second. Using Big O notation, roughly how long will 100,000 items take?",
        "opts": [
          "About 100 seconds — the input grew 100×, so the runtime grows 100× too",
          "About 10,000 seconds — input grew 100×, so work grows 100², or 10,000×",
          "Still about 1 second — Big O ignores constants, so wall-clock time stays flat"
        ],
        "answer": 1,
        "whyWrong": {
          "0": "That's linear reasoning. Quadratic cost grows with n squared — multiply the input by 100 and the comparisons multiply by 100² = 10,000, not 100.",
          "2": "Big O ignores constant *factors*, not growth. The shape of the curve is exactly what it predicts — and n² at 100× the input is a 10,000× blowup."
        },
        "whyCorrect": "O(n²) means work scales with the square of the input. 100× more items → 100² = 10,000× more work, so ~1 second becomes ~10,000 seconds (about 2.8 hours). The fix is structural — replace the nested loop with a hash lookup or sort-then-sweep, because no micro-optimization rescues a quadratic at n=100k.",
        "bestPractices": "When you see a nested loop, estimate outer × inner at production n before shipping. Catching a quadratic at design time is far cheaper than catching it in prod at n=1M.",
        "lessonId": "cs-bigo"
      },
      {
        "q": "A loop runs `if x in my_list` for every element of another list and it's crawling. Which data structures change fixes the complexity?",
        "opts": [
          "Convert the list to a set — membership checks drop from O(n) to O(1)",
          "Sort the list first — Python's `in` automatically binary-searches sorted lists",
          "Swap the list for a tuple — immutable structures have faster membership checks"
        ],
        "answer": 0,
        "whyWrong": {
          "1": "Sorting alone changes nothing — `in` on a list is a linear scan whether sorted or not. You'd have to explicitly call `bisect` to get O(log n), and a set beats that anyway.",
          "2": "A tuple is essentially an immutable list — membership is still a front-to-back O(n) scan. Immutability affects what you can change, not lookup cost."
        },
        "whyCorrect": "A set hashes its elements, so `x in my_set` is O(1) average. The whole loop drops from O(n²) to O(n) — the classic one-line fix for the most common accidental quadratic.",
        "bestPractices": "Any `in list` inside a loop is a smell. Build the set once before the loop; the O(n) conversion cost pays for itself on the second lookup.",
        "lessonId": "s1"
      },
      {
        "q": "In SQL basics, why does `HAVING COUNT(*) >= 10` work but `WHERE COUNT(*) >= 10` throw an error?",
        "opts": [
          "WHERE only accepts columns that have an index, and COUNT(*) can't be indexed",
          "WHERE filters rows before GROUP BY runs — the aggregate doesn't exist yet",
          "HAVING and WHERE are interchangeable; the error is a syntax quirk of older engines"
        ],
        "answer": 1,
        "whyWrong": {
          "0": "Indexes affect speed, never validity — WHERE happily filters unindexed columns. The real issue is *when* WHERE executes in the clause pipeline.",
          "2": "They're not interchangeable in any engine: WHERE filters individual rows, HAVING filters aggregated groups. Every SQL database enforces that split."
        },
        "whyCorrect": "SQL's logical execution order runs WHERE before GROUP BY, so at WHERE-time there are no groups and no COUNT to test. HAVING runs after grouping, when the aggregate finally exists.",
        "bestPractices": "Memorize the pipeline: FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT. It also explains why SELECT aliases work in ORDER BY but not in WHERE."
      },
      {
        "q": "A recursion has no base case. What actually happens when you call it?",
        "opts": [
          "It calls itself until the call stack overflows and the program crashes",
          "The compiler or interpreter rejects it — recursion requires a declared base case",
          "It stops on its own once the input can't get any smaller, and returns None"
        ],
        "answer": 0,
        "whyWrong": {
          "1": "No mainstream language statically checks for base cases — the function parses and compiles fine. The failure only shows up at runtime.",
          "2": "There's no automatic floor. Nothing stops the calls — each one pushes a new stack frame until the stack limit kills the process."
        },
        "whyCorrect": "Every recursive call pushes a stack frame. Without a base case to stop the chain, frames pile up until the runtime hits its limit — RecursionError in Python, a stack overflow elsewhere.",
        "bestPractices": "Write the base case first, then a recursive case that provably shrinks toward it. If the input doesn't strictly decrease on each call, you've built an infinite loop with extra steps."
      },
      {
        "q": "In the CLI todo with persistence build, why save via a temp file plus `os.replace` instead of writing `todos.json` directly?",
        "opts": [
          "Temp files bypass the filesystem cache, making large writes measurably faster",
          "os.replace validates the JSON before swapping, catching corrupt saves early",
          "Opening a file in 'w' mode truncates it first — a crash mid-write loses everything"
        ],
        "answer": 2,
        "whyWrong": {
          "0": "Temp files live on the same filesystem and hit the same cache — there's no speed win. The point is crash safety, not performance.",
          "1": "os.replace knows nothing about JSON — it just atomically swaps directory entries. Validation, if any, is your code's job before the rename."
        },
        "whyCorrect": "`open(path, 'w')` truncates the file to zero bytes before writing, so a crash mid-write has already destroyed the old data. Writing to a temp file, fsync-ing, then `os.replace`-ing swaps in a complete file atomically — the store is always the old version or the new one, never half of each.",
        "bestPractices": "Keep the temp file in the same directory as the target — same-directory rename is the only atomicity POSIX guarantees. Cross-filesystem renames silently degrade to copy + delete.",
        "lessonId": "cli-todo"
      },
      {
        "q": "The Agile Manifesto prefers 'working software over comprehensive documentation.' What does agile actually mean by 'over'?",
        "opts": [
          "Both still matter — docs just lose the tie when the two compete for time",
          "Documentation is waterfall-era waste that agile teams learn to stop producing",
          "Docs come after launch — agile defers writing them until the software stabilizes"
        ],
        "answer": 0,
        "whyWrong": {
          "1": "The manifesto's word is 'over', not 'instead of'. A team that skips writing things down and calls it Agile is just disorganized.",
          "2": "Deferring docs indefinitely is the same mistake with a schedule attached. The values rank priorities for trade-offs; they don't sequence the work."
        },
        "whyCorrect": "The four values are tie-breakers, not bans. Process, docs, contracts, and plans all still matter — they simply lose when they conflict with individuals, working software, customer collaboration, or responding to change.",
        "bestPractices": "In a debate over 'is this agile?', check whether a preference is being read as a prohibition. Most Agile Theater starts by deleting the right-hand side of the manifesto instead of de-prioritizing it.",
        "lessonId": "agile-mindset-what"
      },
      {
        "q": "What separates a real Kanban board from a glorified to-do list?",
        "opts": [
          "Visualizing every task as a card — seeing the work is the core discipline",
          "Enforced WIP limits — nothing new starts until something finishes",
          "Story-point estimates on each card so the team can measure its velocity"
        ],
        "answer": 1,
        "whyWrong": {
          "0": "Visualization is necessary but not sufficient — a board with uncapped columns is exactly the to-do list the lesson warns about. The discipline lives in the WIP limits.",
          "2": "Kanban drops story points and velocity entirely. Its core metric is cycle time — how long a card takes from pull to done."
        },
        "whyCorrect": "WIP limits force finish-before-start. When a column hits its cap, the team swarms the bottleneck instead of piling up more half-done work — Little's Law in action: cut WIP, cut cycle time.",
        "bestPractices": "Set caps that actually pinch (In Progress ≤ 3, Review ≤ 2) and track cycle time weekly. If it creeps up, the bottleneck has moved and the column caps need retuning.",
        "lessonId": "agile-kanban"
      },
      {
        "q": "A charge request times out, so the client retries. In how Stripe prevents duplicate charges, what does the retry send?",
        "opts": [
          "The same Idempotency-Key — the UUID belongs to the intent, not the attempt",
          "A fresh UUID for each attempt, so the server can count how many retries happened",
          "No key at all — the server fingerprints the request body to spot duplicates"
        ],
        "answer": 0,
        "whyWrong": {
          "1": "A new UUID per attempt defeats the whole mechanism — the server sees a brand-new key and executes a brand-new charge. That's exactly the double-charge bug.",
          "2": "The body fingerprint exists only to catch a key being *reused with different params* (which must error). Replay detection is driven by the key the client supplies."
        },
        "whyCorrect": "The key identifies one logical operation across all its retries. Same key → the server finds the stored result and replays the cached response, byte-identical, without touching the card again.",
        "bestPractices": "Generate the UUID when the user confirms the action, not when the HTTP call fires — every retry of that intent then naturally reuses it. Stripe keeps keys ~24h; a retry after the TTL will re-execute.",
        "lessonId": "stripe-idempotency"
      },
      {
        "kind": "order",
        "q": "Order these time complexities from fastest-growing... wait — from SLOWEST-growing (best) to fastest-growing (worst).",
        "items": [
          "O(1) — constant",
          "O(log n) — binary search",
          "O(n) — one pass",
          "O(n log n) — good sorting",
          "O(n²) — nested loops"
        ],
        "whyWrong": "The common slip is placing O(log n) above O(1) or below O(n log n) — remember log n barely grows (log of a billion is ~30), while n² at a million items is a trillion operations.",
        "whyCorrect": "Constant, then logarithmic, then linear, then linearithmic, then quadratic. Each step up means the input size hurts you more.",
        "bestPractices": "When an interviewer asks 'can you do better?', they're usually pointing one rung down this ladder — n² → n log n via sorting, n → log n via binary search, n → 1 via a hash map."
      },
      {
        "kind": "order",
        "code": true,
        "q": "From the CLI todo build: order the body of `save(tasks)` so a `kill -9` mid-save can never corrupt the store.",
        "items": [
          "    tmp = tempfile.NamedTemporaryFile(\"w\", dir=STORE.parent, delete=False)  # same dir = atomic rename",
          "    json.dump(tasks, tmp, indent=2)",
          "    tmp.flush(); os.fsync(tmp.fileno())  # force bytes to disk",
          "    tmp.close()",
          "    os.replace(tmp.name, STORE)  # atomic on POSIX + NTFS"
        ],
        "whyWrong": "The classic slip is calling `os.replace` before the `fsync` — the rename can land while the new bytes still sit in the page cache, so a crash swaps in a hollow file. And you can't dump JSON into a temp file that doesn't exist yet: create, write, sync, close, swap.",
        "whyCorrect": "Create the temp file next to the target, write the full JSON into it, force the bytes to disk, close the handle, and only then atomically swap it over the real store. At every instant `todos.json` is either the complete old version or the complete new one — never half of each.",
        "bestPractices": "Keep the temp file in the SAME directory as the target — same-directory rename is the only atomicity POSIX guarantees; a cross-filesystem rename silently degrades to copy + delete. On Windows, close every handle first or `os.replace` is blocked.",
        "lessonId": "cli-todo"
      },
      {
        "q": "A well-behaved CLI exits ____ so it composes with `&&`, `||`, and `set -e`.",
        "opts": [
          "0 on success and non-zero on failure",
          "1 on success and 0 on every kind of failure",
          "with its final status printed to stdout"
        ],
        "answer": 0,
        "whyWrong": {
          "1": "Exactly backwards — the shell treats exit code 0 as truthy/success. A tool that exits 1 on success would break every `&&` chain and abort every `set -e` script on its happy path.",
          "2": "stdout is for data, not status — `todo add | jq` should see JSON, not 'OK'. The shell reads the numeric exit code, which is why the todo build maps bad IDs to `sys.exit(1)` instead of printing 'error' and exiting 0."
        },
        "whyCorrect": "Zero means success, anything else means failure — that single convention is what lets `todo add \"ship lab\" && todo list` short-circuit correctly and lets cron or CI detect a broken run. The todo build uses 0 = ok, 1 = user error (bad ID), 2 = argparse usage error.",
        "bestPractices": "Print errors to stderr, data to stdout, and pick distinct non-zero codes for distinct failures (argparse gives you exit 2 on bad usage for free). Test with `echo $?` in bash or `$LASTEXITCODE` in PowerShell.",
        "lessonId": "cli-todo"
      },
      {
        "q": "In the CLI todo store, a teammate writes `new_id = len(tasks) + 1` to assign IDs. What's the bug?",
        "opts": [
          "It counts completed tasks too, so finished items keep inflating every newly assigned ID",
          "After a `rm`, the list shrinks and the next new ID collides with a live task's ID",
          "`len()` walks the whole list, so ID assignment gets slower as the store grows"
        ],
        "answer": 1,
        "whyWrong": {
          "0": "Counting done tasks only makes IDs larger, and large is harmless — IDs just need to be unique and stable. Inflation isn't the failure; collision is.",
          "2": "Python lists store their length, so `len()` is O(1) — and even if it were slow, slow is a nuisance, not a correctness bug. The real defect hands two tasks the same ID."
        },
        "whyCorrect": "With tasks 1, 2, 3 on the board, `rm 1` shrinks the list to length 2 — so the next add computes `2 + 1 = 3` and collides with the still-live task 3. Now `todo done 3` is ambiguous and any script holding the old ID mutates the wrong row. `max((t[\"id\"] for t in tasks), default=0) + 1` never reuses a live ID.",
        "bestPractices": "Stable IDs are a contract with every script that captured one. Derive new IDs from the IDs themselves (`max(id)+1` or a persisted `next_id` counter), never from the collection's current size.",
        "lessonId": "cli-todo"
      }
    ],
    "junior": [
      {
        "q": "Big-O of binary search on a sorted array?",
        "opts": [
          "O(n)",
          "O(n log n)",
          "O(log n)"
        ],
        "answer": 2,
        "whyWrong": {
          "0": "O(n) is a linear scan. Binary search halves the range each step, so it's exponentially faster than that.",
          "1": "O(n log n) is sorting (mergesort, heapsort). Binary search assumes the array is *already* sorted and just locates one element."
        },
        "whyCorrect": "Each comparison eliminates half the remaining range, so after k steps you've narrowed n down to n/2^k. Solve for k: O(log₂ n).",
        "bestPractices": "Binary search needs a sorted, random-access structure. If you find yourself sorting once to search many times, the sort cost amortizes — that's when it really shines."
      },
      {
        "q": "In the rate limiter from scratch, why must the token bucket's read-refill-decrement-write run as a single Redis Lua script?",
        "opts": [
          "Lua executes inside Redis itself, so it runs faster than the equivalent Python in the app",
          "Redis only allows multi-field hash updates when they come from inside a Lua script",
          "Atomicity — separate GET and SET calls from N app servers race and leak traffic"
        ],
        "answer": 2,
        "whyWrong": {
          "0": "Speed is a side bonus, not the reason. A fast race condition is still a race — two app servers can both read 1 token and both allow the request.",
          "1": "Redis happily runs HMSET/HSET from any client. That restriction doesn't exist — what Lua uniquely provides is executing the whole sequence without interleaving."
        },
        "whyCorrect": "Redis runs a Lua script as one atomic unit — no other command interleaves. If read-modify-write were separate calls, two servers could read the same token count and both spend it, leaking traffic well past the configured limit.",
        "bestPractices": "Load the script once with SCRIPT LOAD and call it via EVALSHA, but catch the NOSCRIPT error and fall back to EVAL — after a Redis restart the cached script is gone.",
        "lessonId": "rate-limiter"
      },
      {
        "q": "In waterfall vs agile, when does waterfall genuinely win?",
        "opts": [
          "When the team is spread across many time zones and can't physically hold the daily ceremonies",
          "When requirements truly are fixed and late mistakes are catastrophic — avionics, pacemakers",
          "It never wins — agile's shorter feedback loops dominate in every domain"
        ],
        "answer": 1,
        "whyWrong": {
          "0": "Distributed teams run agile fine — async standups and recorded demos are routine. Geography changes the logistics, not the feedback-loop economics.",
          "2": "The lesson is explicit that agile isn't universally correct: you cannot iterate on a flying plane, and fixed-bid contracts need a signed scope before funds release."
        },
        "whyCorrect": "Waterfall's up-front spec pays off when requirements genuinely won't change and late course-correction is unaffordable — regulated hardware, avionics, fixed-bid contracts, migrations with a known endpoint.",
        "bestPractices": "Before picking a process, ask two questions: how fixed are the requirements really, and what does being wrong late cost? Software usually answers 'not fixed' and 'recoverable' — that's why agile dominates it.",
        "lessonId": "agile-mindset-waterfall-vs"
      },
      {
        "q": "Why do feedback loops win even when no individual decision gets any smarter?",
        "opts": [
          "Short loops reduce meeting load, freeing engineers to spend more hours writing code",
          "The pressure of fast cycles trains engineers to make fewer mistakes on each change",
          "Decisions compound — a 5-minute loop makes 60× more calls per week than a 5-hour one"
        ],
        "answer": 2,
        "whyWrong": {
          "0": "Loop latency is about deploy-to-signal time, not calendar load. You can have zero meetings and still wait five hours to learn whether a change worked.",
          "1": "The lesson's claim is the opposite: each call is *no smarter*. The win is volume — more shipped decisions means more learning, even at the same error rate."
        },
        "whyCorrect": "Cut the loop from 5 hours to 5 minutes and you make 60× more decisions per week. Learning scales with decision count, so the faster loop compounds even if each individual judgment is only average.",
        "bestPractices": "Treat loop latency as a first-class metric. Find the slowest loop on your critical path — usually model promotion or deploy, not unit tests — and attack that one.",
        "lessonId": "agile-mindset-feedback-loops"
      },
      {
        "q": "In the Scrum framework, which event actually changes how the team works — and is the first one skipped when 'too busy'?",
        "opts": [
          "The retrospective — the team inspects its own process and changes it",
          "Sprint planning — it sets the goal that everything in the sprint serves",
          "The daily standup — it runs most often, so it corrects course the fastest"
        ],
        "answer": 0,
        "whyWrong": {
          "1": "Planning decides *what* gets built next sprint, not *how the team operates*. You can plan perfectly forever and never fix a broken review process.",
          "2": "Standup syncs the team on the current plan and surfaces blockers — it coordinates within the process rather than revising the process itself."
        },
        "whyCorrect": "The retro is the only Scrum event whose output is a change to the team's own way of working. Skip it and every process problem freezes in place — which is why skipping it when busy is the classic mistake the lesson flags.",
        "bestPractices": "Make retro actions real backlog tickets with an owner and a due date. If the same item resurfaces three sprints running, the retro has become theater.",
        "lessonId": "agile-scrum-framework"
      },
      {
        "q": "Why does a well-run daily standup walk the board right-to-left instead of going around the room?",
        "opts": [
          "It guarantees every person speaks exactly once, keeping the meeting inside 15 minutes",
          "Tickets nearest Done get attention first — finishing beats starting",
          "It hides who is behind, protecting psychological safety in front of stakeholders"
        ],
        "answer": 1,
        "whyWrong": {
          "0": "Round-robin by person is exactly the anti-pattern — it turns standup into serial status reports. Walking the board organizes the meeting around work, not people.",
          "2": "Standup isn't for stakeholders at all — they're silent observers. And the point is surfacing stuck work loudly, not hiding it."
        },
        "whyCorrect": "Right-to-left starts with tickets closest to Done, so the team's energy goes into pulling work across the line before starting anything new — the same finish-first instinct as a WIP limit.",
        "bestPractices": "Name blockers out loud, then park the fix — the two people who care solve it after the meeting. Hard stop at 15 minutes, same time every day.",
        "lessonId": "agile-daily-standup"
      },
      {
        "q": "Sprint planning keeps blowing its time-box and the team is estimating stories it has never seen. What's the real problem?",
        "opts": [
          "The sprints are too short — a longer sprint would justify a longer planning meeting",
          "The team lacks a proper estimation technique like planning poker or t-shirt sizing",
          "The backlog was never refined — planning should be selection, not discovery"
        ],
        "answer": 2,
        "whyWrong": {
          "0": "Longer sprints just mean bigger batches and slower feedback. The time-box (about two hours per week of sprint) is a symptom detector, not the disease.",
          "1": "Estimation technique can't rescue stories nobody has interrogated. Planning poker on an unrefined story just produces confident-looking noise."
        },
        "whyCorrect": "Stories should arrive at planning already refined — sliced, clarified, estimable. Refinement front-loads the thinking so planning is just picking from a ready queue; when it isn't, planning degenerates into a discovery workshop.",
        "bestPractices": "Reserve 1-2 hours weekly for backlog refinement and enforce a Definition of Ready. If planning exceeds two hours per week of sprint, refine more, plan faster.",
        "lessonId": "agile-sprint-planning"
      },
      {
        "q": "A user story is too big for one sprint. Per user stories & acceptance criteria, how do you split it?",
        "opts": [
          "Vertically — a thin slice through every layer that still ships something usable",
          "Horizontally — database layer this sprint, API next sprint, UI the sprint after",
          "Don't split it — let the story span two sprints and carry the points across"
        ],
        "answer": 0,
        "whyWrong": {
          "1": "Horizontal slices leave nothing a user can touch for three sprints — no feedback, no value, all the risk parked at the end. It's mini-waterfall.",
          "2": "Stories that span sprints break velocity's honesty (no partial credit) and hide risk. 'Small' is the S in INVEST for a reason."
        },
        "whyCorrect": "Vertical slices cut through DB, API, and UI at once, so each piece is independently shippable and valuable — even if barely. Users touch something real every sprint, and every slice teaches you something.",
        "bestPractices": "Slice by user journey: one role, one goal, one path. If a slice can't demo end-to-end, it's a task, not a story.",
        "lessonId": "agile-user-stories"
      },
      {
        "kind": "order",
        "q": "Put the TDD loop in order — one full cycle.",
        "items": [
          "Write a failing test for the next behavior",
          "Watch it fail for the RIGHT reason",
          "Write the smallest code that passes",
          "Refactor with the test staying green",
          "Commit and pick the next behavior"
        ],
        "whyWrong": "Skipping 'watch it fail' is the silent killer — a test that passes before you write the code is testing nothing. Refactor-before-green means changing two things at once with no safety net.",
        "whyCorrect": "Red for the right reason → minimal green → refactor under protection → commit. The failing test proves the test works; the green test protects the cleanup.",
        "bestPractices": "Keep the loop under ten minutes. If a cycle takes an hour, the behavior you picked was too big — split it."
      },
      {
        "kind": "order",
        "code": true,
        "q": "From How Stripe Prevents Duplicate Charges: order the `/charges` handler so the key is claimed BEFORE the card is touched.",
        "items": [
          "    key = req.headers[\"Idempotency-Key\"]  # client-supplied UUID",
          "    row = db.fetch(\"SELECT * FROM idem WHERE key=%s FOR UPDATE\", key)",
          "    if row and row.status == \"done\": return row.code, row.response  # replay, no side effect",
          "    db.exec(\"INSERT INTO idem(key,fingerprint,status) VALUES(%s,%s,'running')\", key, fp)",
          "    charge = stripe_charge(req.body)  # the actual side effect",
          "    db.exec(\"UPDATE idem SET status='done', code=200, response=%s WHERE key=%s\", json(resp), key)"
        ],
        "whyWrong": "Charging before the `INSERT` of the 'running' lock row reopens the race — two concurrent retries both pass the replay check and both hit the card. Checking for a stored response AFTER charging defeats the entire mechanism: the duplicate charge already happened.",
        "whyCorrect": "Read the key, lock its row with `FOR UPDATE`, replay if a finished result exists, claim the key as 'running', and only then run the side effect — persisting the result last so future retries replay it. Validate and acquire before you execute.",
        "bestPractices": "Only persist 2xx/4xx as final — caching a transient 500 replays that error forever; delete the lock row on failure instead. The `FOR UPDATE` lock is what serializes two parallel retries: one executes, the other waits and replays.",
        "lessonId": "stripe-idempotency"
      },
      {
        "q": "In the Redis token bucket, prefer ____ so all N app servers judge requests against one clock.",
        "opts": [
          "`tonumber(ARGV[3])`, the timestamp each app server passes in",
          "`math.floor(now_ms / 1000)` computed at the top of the script",
          "`redis.call('TIME')` from inside the Lua script itself"
        ],
        "answer": 2,
        "whyWrong": {
          "0": "That IS the skewed design the lesson warns about — `ARGV[3]` is whatever clock the calling pod has, and N pods means N clocks. A pod running 30s fast hands out free refill to every bucket it touches.",
          "1": "Rounding the caller's milliseconds into seconds is the same skewed clock in a different unit. The math happens in the script, but the time still came from N different app servers."
        },
        "whyCorrect": "`redis.call('TIME')` asks Redis itself what time it is, and there is exactly one Redis answering for the bucket — one source of truth. Refill math becomes consistent no matter which app pod sent the request.",
        "bestPractices": "Any Lua script that takes a caller-supplied timestamp inherits the caller's clock skew. While you're in there: call the script via `EVALSHA`, and catch `NOSCRIPT` with an `EVAL` fallback — the cached SHA dies with a Redis restart.",
        "lessonId": "rate-limiter"
      },
      {
        "q": "This refill line from the token-bucket Lua script is subtly wrong: `tokens = tokens + delta * refill`. What's the bug?",
        "opts": [
          "Nothing caps the sum at `cap`, so an idle key banks unlimited tokens and can burst far past its limit",
          "`delta` is measured in milliseconds here, so the bucket refills roughly a thousand times too fast",
          "The refill must run after the decrement, otherwise the request being judged pays for its own new tokens"
        ],
        "answer": 0,
        "whyWrong": {
          "1": "The script already converts: `delta = math.max(0, now_ms - last) / 1000` yields seconds before this line runs. Units are fine — the missing bound is the problem.",
          "2": "Refill-then-spend is the correct order: the bucket earns everything owed since its last touch, THEN the request asks for its cost. Flipping them just makes the accounting stale by one request."
        },
        "whyCorrect": "The real script clamps: `tokens = math.min(cap, tokens + delta * refill)`. Without `math.min`, a key idle for an hour at 10 tokens/sec has 36,000 banked tokens — its next burst blows straight through the limit the bucket exists to enforce. Capacity IS the burst ceiling.",
        "bestPractices": "When testing a limiter, always include the idle-then-burst case: sleep past several full refill periods, then hammer. Correct behavior is at most `capacity` successes, never `capacity + idle_time * refill`.",
        "lessonId": "rate-limiter"
      }
    ],
    "senior": [
      {
        "q": "What problem does memoization solve?",
        "opts": [
          "Recomputing the same subproblem",
          "Compiling slow code",
          "Network latency"
        ],
        "answer": 0,
        "whyWrong": {
          "1": "Compilation speed is the compiler's problem. Memoization is a runtime caching pattern.",
          "2": "Network latency is solved with CDNs, connection pooling, or moving compute closer. Memoization caches *function results*, not network calls (though it can cache responses)."
        },
        "whyCorrect": "Memoization caches the result of f(x) keyed by x, so the next call with the same input returns instantly. Classic win for overlapping subproblems in recursion (e.g. naive Fibonacci is O(2^n), memoized is O(n)).",
        "bestPractices": "Memoize only pure functions (same input → same output). Mind the cache key — mutable args defeat memoization or, worse, return stale results.",
        "lessonId": "sd-n-plus-one"
      },
      {
        "q": "Sprint ends with a 5-point story at 80% done. Under story points & velocity rules, what does it contribute?",
        "opts": [
          "Zero — partial credit is forbidden; that's what keeps velocity honest",
          "Four points — proportional credit keeps the rolling average realistic",
          "Five points — the effort was spent this sprint even if the demo slips"
        ],
        "answer": 0,
        "whyWrong": {
          "1": "Proportional credit turns velocity into a guess about invisible work-in-progress. '80% done' is famously unfalsifiable — the last 20% hides the integration pain.",
          "2": "Velocity measures *completed, Definition-of-Done-meeting* work, not effort expended. Counting spent effort rewards starting things rather than finishing them."
        },
        "whyCorrect": "Only stories that hit the Definition of Done count. The zero stings, but it keeps the rolling average a truthful forecast — and it pressures the team to slice stories small enough to actually finish.",
        "bestPractices": "Forecast next sprint from the rolling average of the last 3-5 sprints. If the must-haves exceed that number, cut scope at planning — not in week two.",
        "lessonId": "agile-story-points-velocity"
      },
      {
        "q": "In MVP & incremental delivery, what's the line between a real MVP and a mockup?",
        "opts": [
          "An MVP has a polished interface; a mockup is allowed to look unfinished",
          "An MVP is truly usable end-to-end — manual backends and ugly UI are fine",
          "An MVP includes the settings and admin surface; a mockup only shows the happy path"
        ],
        "answer": 1,
        "whyWrong": {
          "0": "Backwards — the lesson explicitly allows ugly: default Bootstrap, hardcoded copy, no dark mode. What it requires is *real*: someone can actually use it.",
          "2": "One user, one job, one path — no settings page, no admin panel. Scope breadth is exactly what an MVP cuts so the riskiest assumption gets tested sooner."
        },
        "whyCorrect": "The MVP bar is 'real is required': a working slice a real user can complete end-to-end, even if refunds are processed by hand for the first 20 customers. If no one can actually use it, it's a mockup, not an MVP.",
        "bestPractices": "Write down the riskiest assumption first, then design the smallest slice that tests exactly that. After 2-3 increments, stop calling it an MVP — it's the product; maintain it like one.",
        "lessonId": "agile-mvp-incremental"
      },
      {
        "q": "A page fires 5,001 queries — one for 5,000 users, then one per user for their team. What's the N+1 queries fix?",
        "opts": [
          "Move reads to a replica so the extra queries stop competing with the writes",
          "Cache each team row in Redis so the repeated per-user lookups become sub-millisecond",
          "Eager-load the relationship — select_related turns 5,001 queries into one JOIN"
        ],
        "answer": 2,
        "whyWrong": {
          "0": "Replicas spread the same wasteful workload across more machines — maybe 2-3× headroom for 5-10× the cost. The query *count* is the bug, and it travels with you.",
          "1": "Caching masks the symptom and adds invalidation complexity, but the request still does thousands of round trips on a cold cache. One JOIN was always available."
        },
        "whyCorrect": "The ORM is lazy-loading the relationship inside the loop. `select_related` (or `prefetch_related` for one-to-many) fetches parents and children in one or two queries — a 50-100× win for the price of a code review.",
        "bestPractices": "Watch for the picket fence in APM traces — a tall stack of identical short DB spans in one request. Tools like django-debug-toolbar or bullet can fail CI when a view exceeds its query budget."
      },
      {
        "q": "A hot table carries 8 secondary indexes. Per 'indexes aren't free', what does one INSERT actually cost?",
        "opts": [
          "One physical write — secondary indexes update lazily in a background thread",
          "Nine physical writes — the row plus every index, before WAL and replication",
          "Two physical writes — the row plus one merged update across all its indexes"
        ],
        "answer": 1,
        "whyWrong": {
          "0": "B-tree indexes update synchronously inside the transaction — they must, or reads through the index would miss committed rows. There's no lazy background catch-up.",
          "2": "Each index is its own B-tree with its own pages and its own splits. There's no merged update — every index touched is a separate physical write."
        },
        "whyCorrect": "Write amplification = 1 + indexes touched. Eight secondary indexes turn one logical INSERT into nine physical writes — plus WAL and replication on top. On hot tables this write tax dominates IOPS.",
        "bestPractices": "Audit ORM-generated indexes on every foreign key, and drop `(a)` when `(a, b)` exists — the composite serves both. In a design review, removing an index is usually the more senior move.",
        "lessonId": "sd-index-write-cost"
      },
      {
        "q": "In an at-least-once queue consumer, return ACK ____ — otherwise a crash mid-handler silently drops the message.",
        "opts": [
          "as soon as the message is pulled, so the partition keeps moving",
          "only after the side effects have fully succeeded",
          "on a fixed timer, so a slow handler can't stall the whole queue"
        ],
        "answer": 1,
        "whyWrong": {
          "0": "ACK-on-receipt converts at-least-once into at-most-once: the broker forgets the message the moment you take it, so a crash between pull and email means the confirmation is gone forever with nothing to retry.",
          "2": "A timer ACKs work that may not have happened — a handler that's slow because the warehouse API is down gets its message discarded at exactly the moment it needed redelivery."
        },
        "whyCorrect": "The unACKed message is your safety net: if the consumer dies after `send_confirmation_email` but before ACK, the broker redelivers and the idempotency-key check (`already_processed`) turns the replay into a no-op. ACK-after-success plus dedupe is the whole at-least-once contract.",
        "bestPractices": "Pair late ACKs with a dead-letter queue and a hard retry cap — a poison message that can never succeed will otherwise be redelivered forever and block its partition. Alert on queue-depth slope, not absolute depth.",
        "lessonId": "sd-queue-decoupling"
      }
    ],
    "distinguished": [
      {
        "q": "Why is Agile iterative delivery valuable?",
        "opts": [
          "Avoids tests",
          "Learns from real users sooner",
          "Removes deadlines"
        ],
        "answer": 1,
        "whyWrong": {
          "0": "Agile doesn't avoid tests — well-run Agile usually has MORE tests (CI, TDD). The \"avoid tests\" framing is a misconception.",
          "2": "Agile still has deadlines, sprints, and commitments. What it changes is the *frequency* of feedback, not whether dates exist."
        },
        "whyCorrect": "Shipping small increments puts real software in front of real users early. That feedback either validates assumptions or invalidates them while course-correcting is still cheap.",
        "bestPractices": "Define \"done\" per increment (deployed + measured), not \"code merged\". Without measurement, iteration is just busywork — you have to learn from each ship."
      },
      {
        "q": "Per API versioning and deprecation, the sunset date passes. What should a retired v1 endpoint return?",
        "opts": [
          "404 Not Found — the resource genuinely no longer exists at that path",
          "410 Gone with a link to the migration guide — end the contract loudly",
          "A 301 redirect to the v2 equivalent so unmigrated clients keep working"
        ],
        "answer": 1,
        "whyWrong": {
          "0": "A 404 is indistinguishable from a typo or an outage — integrators waste hours debugging the wrong thing. 410 says 'this existed and was deliberately retired'.",
          "2": "Silently redirecting to v2 hides the breaking change: v2's response shape differs, so old clients get 200s with payloads they can't parse. Failing loudly is kinder."
        },
        "whyCorrect": "410 Gone is the machine-readable 'deliberately retired' signal, and pairing it with a migration-guide link turns a hard failure into a self-service fix. The contract ends loudly, on the date you promised.",
        "bestPractices": "Run the full playbook: announce on day 0, dual-run for months, ship Sunset (RFC 8594) and Deprecation headers well before cutoff, then 410. Skipping any step burns integrator trust for years.",
        "lessonId": "api-versioning"
      },
      {
        "q": "Per idempotency and retries, which PATCH body is safe for a client to retry blindly?",
        "opts": [
          "`{\"inc\": 1}` — increments are tiny, so an occasional double-apply is harmless",
          "Neither — PATCH is never idempotent; only PUT can ever be retried safely",
          "`{\"value\": 7}` — an absolute update lands on the same state every time"
        ],
        "answer": 2,
        "whyWrong": {
          "0": "A retried delta mutates state twice — the counter reads 2 after one network blip, and in a payments context that 'tiny' double-apply is a double charge.",
          "1": "PATCH isn't categorically unsafe — it's *slippery*. Deltas double-apply on retry; absolute updates don't. The body's semantics decide, not the verb."
        },
        "whyCorrect": "Setting a field to an absolute value is naturally idempotent: run it once or five times, the row still ends at value=7. That's why the lesson says to prefer absolute updates over deltas whenever you can.",
        "bestPractices": "Design mutations so a retry lands on the same end state; where you truly need deltas (counters, balances), require an Idempotency-Key and dedupe server-side.",
        "lessonId": "api-idempotency"
      },
      {
        "q": "Per rate limiting and quotas, why is raw client IP usually the wrong rate-limit key?",
        "opts": [
          "IP addresses rotate too quickly for any counter to accumulate a useful signal",
          "Per-IP counters cost far more Redis memory than per-user counters would",
          "NATs and offices share one IP — one noisy client throttles a whole company"
        ],
        "answer": 2,
        "whyWrong": {
          "0": "Most clients keep an IP for hours or days — plenty of time to count. The failure mode is the opposite: too many *different* users pooled behind one stable address.",
          "1": "Counter cost is roughly identical either way — one key and one integer. The problem with IP keys is fairness, not memory."
        },
        "whyCorrect": "Behind corporate NAT, hundreds of legitimate users present as a single IP. One noisy neighbor drains the shared bucket and everyone in the building gets 429s. Prefer API key, user ID, or tenant ID — identities that map to actual customers.",
        "bestPractices": "Key authenticated traffic by user or tenant, fall back to IP only for anonymous routes, and use compound keys (user + endpoint) to protect expensive operations.",
        "lessonId": "api-rate-limiting"
      }
    ]
  },
  "mleng": {
    "novice": [
      {
        "q": "A neural network is loosely inspired by what?",
        "opts": [
          "Banking ledgers",
          "Phone networks",
          "Networks of biological neurons"
        ],
        "answer": 2,
        "whyWrong": {
          "0": "Banking ledgers are double-entry bookkeeping. No relation to NN topology.",
          "1": "Phone networks route calls between subscribers. The graph structure differs and there's no learning involved."
        },
        "whyCorrect": "Neural nets borrow the metaphor of neurons firing through weighted connections. The math (weighted sums + nonlinearity) is a vastly simplified abstraction, but the inspiration is biological.",
        "bestPractices": "Don't over-extend the brain analogy when debugging. NNs are matrix multiplications + activations — the math, not the metaphor, is what predicts behavior.",
        "lessonId": "ml-nn-fundamentals"
      },
      {
        "q": "What's an \"epoch\" in training?",
        "opts": [
          "One full pass through the dataset",
          "One sample",
          "One GPU"
        ],
        "answer": 0,
        "whyWrong": {
          "1": "One sample is a single example. The unit that processes one sample at a time is a \"step\" (or \"iteration\" in batch=1).",
          "2": "A GPU is hardware. Epochs are a logical training-progress unit, independent of hardware count."
        },
        "whyCorrect": "An epoch is one complete sweep over every example in the training set. Multiple epochs = repeated passes; the model usually needs many to converge.",
        "bestPractices": "Track loss per epoch on both train and val. If val loss plateaus or rises while train loss drops, you're overfitting — stop early or regularize."
      },
      {
        "q": "In Linear Algebra for ML, what does a large positive dot product between two vectors tell you?",
        "opts": [
          "That the two vectors have exactly the same magnitude, whatever their directions",
          "That the two vectors are perpendicular, carrying fully independent information",
          "That the two vectors point in roughly the same direction — they are aligned"
        ],
        "answer": 2,
        "whyWrong": {
          "0": "The dot product mixes direction AND magnitude — two equal-magnitude vectors pointing opposite ways give a large NEGATIVE dot product. Magnitude alone tells you nothing about the sign.",
          "1": "Perpendicular vectors have a dot product of exactly ZERO — that's the opposite of a large value. Zero means 'unrelated', not 'aligned'."
        },
        "whyCorrect": "The dot product is the sum of elementwise products, and it measures alignment: large positive = pointing the same way, zero = perpendicular, negative = opposing. This is exactly why attention scores are computed as q · k — 'how relevant is this key to this query' is an alignment question.",
        "bestPractices": "Read `W @ x` as 'W transforms x' and `q @ k` as 'how aligned are these'. Treating dot product as alignment is the single mental model that makes attention, cosine similarity, and embeddings click.",
        "lessonId": "math-linalg"
      },
      {
        "q": "In Calculus for ML, why does the SGD update subtract the gradient instead of adding it?",
        "opts": [
          "The gradient points toward steepest ascent, so stepping the opposite way reduces loss",
          "Subtraction keeps the weights positive, which most layers need for numerical stability",
          "Adding the gradient would apply the learning rate twice within a single update step"
        ],
        "answer": 0,
        "whyWrong": {
          "1": "Weights routinely go negative and that's perfectly fine — no layer requires positive weights. The subtraction is about direction on the loss surface, not the sign of the weights.",
          "2": "The learning rate scales the step identically whether you add or subtract. Adding wouldn't double-count anything — it would walk you uphill and MAXIMIZE the loss."
        },
        "whyCorrect": "∇L points in the direction of steepest ASCENT — the compass that always points uphill. Training wants to minimize loss, so you step the opposite way: w = w − η·∇L. It's not a trick, it's a sign.",
        "bestPractices": "When training diverges, check the two halves of that one line: the sign (direction is pure math) and η (step size is art — too large and you overshoot the valley and bounce off the opposite wall).",
        "lessonId": "math-calculus"
      },
      {
        "q": "Probability for ML: a disease test is 99% accurate, but only 0.1% of people are sick. You test positive. Why is your real chance of being sick only ~9%?",
        "opts": [
          "The test's sensitivity and specificity cancel each other out at low prevalence",
          "With a tiny prior, false alarms from the huge healthy pool swamp the true positives",
          "The 99% accuracy figure only applies to negative results, so positives carry no signal"
        ],
        "answer": 1,
        "whyWrong": {
          "0": "Sensitivity and specificity don't 'cancel' — both stay at 99% regardless of prevalence. What changes the answer is the base rate each one gets multiplied by in Bayes' rule.",
          "2": "The 99% applies both ways in this setup, and a positive DOES carry signal — it lifts your probability from 0.1% to ~9%, a 90× update. It just doesn't lift it to 99%."
        },
        "whyCorrect": "Bayes: for every 1 sick person there are ~999 healthy ones, and a 1% false-positive rate on 999 people produces ~10 false alarms per true positive. The tiny prior crushes the strong likelihood — posterior ≈ 9%.",
        "bestPractices": "The ML version bites constantly: a classifier with 99% accuracy on a 0.1% positive class is still mostly wrong about positives. Do the Bayes arithmetic before celebrating accuracy on imbalanced data.",
        "lessonId": "math-probability"
      },
      {
        "q": "In neural network fundamentals, what would happen if you removed every activation function from a 10-layer network?",
        "opts": [
          "Training would slow down slightly, but the network would keep the same expressive power",
          "Gradients could no longer flow backward, so none of the weights would ever update",
          "The stack would collapse into one linear map — composing linear layers is still linear"
        ],
        "answer": 2,
        "whyWrong": {
          "0": "It's not a speed issue — expressive power collapses. Ten stacked linear layers can represent exactly what ONE can: a single matrix multiply. All the depth is wasted.",
          "1": "Gradients flow perfectly well through linear layers — that's the easy case for backprop. The problem is what the network can express, not whether it can train."
        },
        "whyCorrect": "Composition of linear maps is linear: W₃(W₂(W₁x)) is just (W₃W₂W₁)x — one matrix. The nonlinear squash between layers is what lets the network bend space and learn curves; it's the entire reason 'deep' means anything.",
        "bestPractices": "Default to ReLU (or GELU in transformers) for hidden layers. Sigmoid and tanh saturate — their gradients flatten to zero in deep stacks, which is why they lost.",
        "lessonId": "ml-nn-fundamentals"
      },
      {
        "q": "In convolutional networks, why does sliding one shared kernel across the whole image beat a dense layer for vision?",
        "opts": [
          "A pattern learned in one spot fires anywhere it appears, using only a tiny fraction of the weights",
          "Each kernel sees the entire image at once, capturing global context in a single layer",
          "Sliding the kernel makes the network automatically robust to rotated and flipped objects"
        ],
        "answer": 0,
        "whyWrong": {
          "1": "The opposite — each conv neuron looks at a small local patch (3×3 or 5×5), and the receptive field only grows with depth. Global context in one layer is what attention does, not a kernel.",
          "2": "CNNs are NOT rotation-invariant — a sideways cat looks alien unless you augment with rotations and flips. Translation is the symmetry weight sharing buys you, not rotation."
        },
        "whyCorrect": "Weight sharing gives translation equivariance: a cat detector trained on the left side fires on the right too. And the parameter savings are brutal — a dense neuron on a 224×224 RGB image needs ~150K weights; a 3×3×3 kernel needs 27.",
        "bestPractices": "Count your receptive field: if the object is bigger than what the deepest neuron can see, the model can't reason about it. And augment with rotations/flips, since the architecture won't cover those for free.",
        "lessonId": "ml-nn-cnn"
      },
      {
        "q": "When comparing two embeddings, why is cosine similarity usually preferred over Euclidean distance?",
        "opts": [
          "Cosine is dramatically cheaper to compute than Euclidean distance on high-dimensional vectors",
          "Direction encodes meaning while magnitude often just tracks frequency — the angle is the signal",
          "Euclidean distance stops being meaningful beyond two or three dimensions, and embeddings have hundreds"
        ],
        "answer": 1,
        "whyWrong": {
          "0": "The compute cost is comparable — both are one pass over the dimensions. Pre-normalizing so cosine becomes a plain dot product is a nice optimization, but it's not WHY cosine wins.",
          "2": "Euclidean distance is perfectly well-defined in any number of dimensions — the formula generalizes fine. The issue is what it measures (magnitude differences), not whether it computes."
        },
        "whyCorrect": "In embedding space, direction is meaning and magnitude is mostly noise (often correlated with token frequency or document length). Cosine measures the angle: 1.0 = synonyms, 0 = unrelated, −1 = opposing.",
        "bestPractices": "L2-normalize every vector at write time — then cosine equals a dot product and your hot path becomes one matrix multiply. Skipping normalization with an inner-product index silently lets long documents win by magnitude alone."
      },
      {
        "q": "The intro to LLMs calls hallucination a core failure mode. What is the root cause?",
        "opts": [
          "The model optimizes for plausible-sounding text, not for truth",
          "The training data consisted mostly of false statements scraped from the web",
          "The context window is too small to hold the correct answer"
        ],
        "answer": 0,
        "whyWrong": {
          "1": "Web data has errors, but hallucination happens even on topics with clean training data — the next-token objective rewards fluent continuation, and fluent ≠ true.",
          "2": "A bigger context window doesn't stop hallucination; a model with an empty prompt will still confidently invent facts. Context limits cause truncation — a different failure entirely."
        },
        "whyCorrect": "An LLM is a next-token predictor: it's trained to produce the most plausible continuation, and 'plausible' is optimized directly while 'true' never appears in the loss. Confidently wrong text is the natural output of that objective.",
        "bestPractices": "Ground the model with retrieval and citations (RAG) instead of trusting recall, and treat everything after the training cutoff as unknown. Retrieved documents are user input, not gospel — watch for prompt injection."
      },
      {
        "q": "A 1000×1000 weight matrix turns out to have rank 3. In Linear Algebra for ML terms, what does that mean?",
        "opts": [
          "That the matrix is mostly zeros, so a sparse storage format will compress it well",
          "That the matrix must be invertible, since any square matrix with nonzero rank has an inverse",
          "That it only uses 3 independent directions — hugely compressible, the insight behind LoRA"
        ],
        "answer": 2,
        "whyWrong": {
          "0": "Low rank is not sparsity — a rank-3 matrix can have every single entry non-zero. The redundancy lives in the directions it uses, not in zero entries.",
          "1": "Backwards — a square matrix is invertible only at FULL rank (1000 here). Rank 3 means it squashes 1000-dimensional space down to 3 dimensions, destroying information; there's no inverse."
        },
        "whyCorrect": "Rank counts the independent directions a matrix actually uses. A 1000×1000 matrix with rank 3 is 'secretly tiny' — it can be written as the product of a 1000×3 and a 3×1000 matrix. That low-rank structure is exactly what LoRA, PCA, and embeddings exploit.",
        "bestPractices": "Never assume a square matrix is invertible — check the rank. And when you find low rank in a big matrix, exploit it: the real signal lives in few directions.",
        "lessonId": "math-linalg"
      }
    ],
    "junior": [
      {
        "q": "What does backpropagation compute?",
        "opts": [
          "Predictions",
          "Gradients of the loss w.r.t. weights",
          "Batch size"
        ],
        "answer": 1,
        "whyWrong": {
          "0": "Predictions come from the forward pass. Backprop happens AFTER you have a prediction and a loss.",
          "2": "Batch size is a hyperparameter you choose, not a computed value."
        },
        "whyCorrect": "Backprop is the chain rule applied layer-by-layer, walking backward from the loss to compute ∂L/∂w for every weight. The optimizer then uses those gradients to update weights.",
        "bestPractices": "Don't implement backprop by hand for new architectures — frameworks (PyTorch autograd, JAX) handle it. But DO understand the math when debugging vanishing/exploding gradients."
      },
      {
        "q": "In Transformers from Scratch, attention scores are divided by √d_k before the softmax. What goes wrong without that scaling?",
        "opts": [
          "The attention matrix rows stop summing to 1, which breaks the weighted mixing of values",
          "Dot products grow with dimension, softmax saturates to one-hot, and the gradients die",
          "The model can attend to future tokens, leaking information the causal mask should hide"
        ],
        "answer": 1,
        "whyWrong": {
          "0": "Softmax always normalizes each row to sum to 1 no matter how large the inputs are — normalization isn't the problem. Saturation is: huge inputs make the output effectively one-hot.",
          "2": "Peeking at future tokens is the causal mask's department, applied as -inf before softmax. Score scaling and masking are entirely separate mechanisms."
        },
        "whyCorrect": "Without the √d_k divisor, dot-product variance grows with head dimension. The softmax then saturates toward one-hot, its gradient flattens to near zero, and training stalls. Dividing by √d_k keeps the variance ~1 regardless of head size.",
        "bestPractices": "Divide by √d_k — the PER-HEAD dimension — not √d_model. And mask BEFORE softmax with -inf; multiplying by a mask after softmax leaks probability mass."
      },
      {
        "q": "Why do transformers & attention models need positional encodings at all?",
        "opts": [
          "They compress long sequences so that attention's quadratic cost stays manageable at scale",
          "They stop residual connections from washing out token identity in very deep stacks",
          "Attention is permutation-invariant — without them, 'dog bites man' equals 'man bites dog'"
        ],
        "answer": 2,
        "whyWrong": {
          "0": "Positional encodings add order information to embeddings — they don't shorten sequences or reduce compute. Taming the O(n²) bill is FlashAttention and sliding windows, a different toolbox.",
          "1": "Residual connections preserve information — they're a gradient highway, and they have nothing to do with token order. Position isn't something residuals could lose, because attention never had it."
        },
        "whyCorrect": "Attention treats its input as a set: shuffle the tokens and you get the shuffled output. Language needs order, so a position-dependent vector is added to each embedding before attention sees it — sinusoidal, learned, or (the modern default) RoPE.",
        "bestPractices": "Position handling limits context extension: models trained at 4k tokens degrade hard at 32k unless you use RoPE scaling or ALiBi, or fine-tune for the longer window.",
        "lessonId": "ml-nn-transformers"
      },
      {
        "q": "In backprop & training with PyTorch, what happens if you forget `optimizer.zero_grad()` between steps?",
        "opts": [
          "Gradients accumulate across steps, so every later update is corrupted by stale gradients",
          "PyTorch raises a runtime error the second time `loss.backward()` runs in the training loop",
          "The learning-rate schedule silently resets to its starting value at each epoch boundary"
        ],
        "answer": 0,
        "whyWrong": {
          "1": "No error is raised — that's exactly what makes this bug dangerous. Each new batch's backward pass happily ADDS into the existing `.grad` buffers and training silently degrades.",
          "2": "LR schedulers track their own step count and never touch gradient buffers. The corruption is in `.grad`, not in the learning rate."
        },
        "whyCorrect": "PyTorch accumulates gradients by default: `.backward()` adds into `.grad` rather than overwriting it. Skip the zero and each step applies the sum of every gradient since the last reset — training silently corrupts with no exception thrown.",
        "bestPractices": "The accumulate-by-default behavior is a feature when used deliberately: gradient accumulation divides the loss by accum_steps and calls `optimizer.step()` every N batches to fake a large batch in small memory.",
        "lessonId": "ml-nn-backprop"
      },
      {
        "q": "Your fraud model scores 0.98 ROC-AUC on data where 1 in 1000 transactions is fraud. In ML model evaluation terms, why check PR-AUC before celebrating?",
        "opts": [
          "ROC-AUC is mathematically undefined when the two classes are heavily imbalanced",
          "FPR's denominator is the huge negative class, so ROC looks great while most fraud slips through",
          "PR-AUC counts true negatives in its curve, which ROC-AUC completely ignores when ranking"
        ],
        "answer": 1,
        "whyWrong": {
          "0": "ROC-AUC is perfectly well-defined at any class ratio — it's a ranking measure. The problem is that it's misleadingly FLATTERING on rare positives, not that the math breaks.",
          "2": "Backwards — ROC is the one that uses true negatives (inside FPR's denominator), while precision and recall never touch TN at all. Ignoring the flood of easy negatives is exactly why PR tells the truth here."
        },
        "whyCorrect": "FPR = FP/(FP+TN), and with 999 negatives per positive that denominator is enormous — thousands of false alarms barely move the curve. PR-AUC keeps the rare class in both axes, so it exposes a model that's still missing most fraud.",
        "bestPractices": "On imbalanced problems, report PR-AUC plus the confusion matrix at your chosen threshold. And remember the threshold itself is a business decision — sweep it against your cost matrix, don't default to 0.5."
      },
      {
        "q": "Your support bot keeps citing last year's prices. Fine-tuning vs RAG vs prompting — which knob fixes stale facts, and why?",
        "opts": [
          "RAG — facts live in an index you can re-embed anytime, while fine-tuned weights freeze at training time",
          "Fine-tuning — gradient updates on fresh (prompt, completion) pairs write the new prices straight into the weights",
          "Prompting — a firmer system message telling the model never to state prices that are out of date"
        ],
        "answer": 0,
        "whyWrong": {
          "1": "Fine-tuning to inject facts works in demos and fails in prod: the model learns a PLAUSIBLE version of the fact and confidently corrupts it — and every Tuesday price change means another training run.",
          "2": "Instructions can't grant knowledge the model doesn't have. It will still emit plausible-looking stale prices, because the failure is missing facts, not disobedience."
        },
        "whyCorrect": "RAG wins on freshness because the INDEX changes, not the weights: update the docs, re-embed, ship in minutes with citations attached. The rule of thumb: prompt for policy, retrieve for facts, fine-tune for behavior.",
        "bestPractices": "Whichever knob you turn, keep a frozen eval set (~100 graded examples). Without it you can't tell whether your change helped or quietly regressed something else.",
        "lessonId": "ai-finetuning"
      },
      {
        "q": "In 'How Models Represent Meaning' terms, what's the tradeoff when jumping from 768-dim to 3072-dim embeddings?",
        "opts": [
          "Retrieval quality roughly quadruples, since embedding quality scales linearly with dimension",
          "Retrieval quality is unchanged — dimensionality only affects storage cost, never search accuracy",
          "Marginal quality gains past ~768, while storage, network, and every dot-product cost scale linearly"
        ],
        "answer": 2,
        "whyWrong": {
          "0": "Quality does NOT scale linearly with dimension — past ~768 the gains flatten hard while the bills keep climbing. 4× the dims buys single-digit-percent recall at best.",
          "1": "Dimension absolutely affects quality — 128-dim is measurably rougher than 768. The point is that the curve FLATTENS at the high end, not that it's flat everywhere."
        },
        "whyCorrect": "More dimensions ≠ better: past ~768 you hit diminishing returns while paying linearly more for RAM (~12 GB per million docs at 3072-D), network, and every similarity computation. 3072-D is 'marginal gain — only if eval proves it wins'.",
        "bestPractices": "Measure recall on YOUR data before paying for bigger vectors. And version the index by embedding-model name — vectors from different models live in different spaces, and cosine between them is meaningless.",
        "lessonId": "ai-embeddings"
      },
      {
        "kind": "order",
        "q": "Order a RAG pipeline's handling of one user question — from question to cited answer.",
        "items": [
          "Embed the user's question into a vector",
          "Search the index for nearest chunks",
          "Assemble the top chunks into the prompt context",
          "The LLM generates an answer grounded in that context",
          "The answer cites which chunks it used"
        ],
        "whyWrong": "Generating before retrieving is just a chatbot with extra steps — the model answers from stale weights and hallucinates. Retrieval must land in the prompt BEFORE generation, or the 'grounding' is decoration.",
        "whyCorrect": "Embed → retrieve → assemble → generate → cite. The question becomes a vector, the vector finds the facts, the facts constrain the model.",
        "bestPractices": "Log which chunks were retrieved for every answer — when RAG is wrong, the first question is always 'did retrieval fail or did generation ignore it?'"
      },
      {
        "kind": "order",
        "q": "Order one training step of a neural network — what happens between feeding a batch and better weights.",
        "items": [
          "The batch is tokenized into tensors",
          "The forward pass computes predictions",
          "The loss measures how wrong they were",
          "Backpropagation computes gradients",
          "The optimizer updates the weights"
        ],
        "whyWrong": "Gradients-before-loss is the usual flip — backprop differentiates THE LOSS, so there's nothing to propagate until the error is measured. The optimizer never sees data, only gradients.",
        "whyCorrect": "Tokenize → forward → loss → backward → step. Data flows forward to make a guess; error flows backward to assign blame; the optimizer cashes the blame into updates.",
        "bestPractices": "When training diverges, inspect in this order too: data batch first (garbage in?), then loss curve, then gradient norms — most 'model bugs' are data bugs."
      }
    ],
    "senior": [
      {
        "q": "Why use a validation set distinct from train and test?",
        "opts": [
          "Compress data",
          "Speed up training",
          "Tune hyperparameters without leaking test info"
        ],
        "answer": 2,
        "whyWrong": {
          "0": "Validation sets don't compress anything — they're held-out data, same format as train.",
          "1": "Adding a val set actually means LESS training data. The trade is honest evaluation, not speed."
        },
        "whyCorrect": "Hyperparameter search (LR, layers, regularization) needs a feedback signal. If you tune on test, you overfit to test and your final number is dishonest. Val provides that signal; test is sacred final evaluation.",
        "bestPractices": "Typical split: 70/15/15 or 80/10/10 (train/val/test). Touch the test set exactly once, at the very end, after all decisions are frozen."
      },
      {
        "q": "You build an MLP from scratch in NumPy and the loss is NaN in epoch 1. What's the classic culprit in the softmax?",
        "opts": [
          "A division by zero when a row of logits happens to sum to exactly zero during normalization",
          "exp() overflows to inf once any logit passes ~88 — you forgot to subtract the row max",
          "float32 weights can't represent probabilities smaller than 0.5, corrupting the loss"
        ],
        "answer": 1,
        "whyWrong": {
          "0": "The softmax denominator is a sum of exponentials, and every exp() is strictly positive — that sum can never be zero. The blowup happens one step earlier, inside exp() itself.",
          "2": "float32 represents values down to ~1e-38, so tiny probabilities are fine. The epoch-1 killer is overflow to inf, not underflow of small numbers."
        },
        "whyCorrect": "exp(logit) overflows to inf the moment any logit exceeds ~88, and inf/inf poisons the whole row into NaN. Subtracting the row max before exponentiating leaves softmax mathematically identical but numerically sane — it's non-negotiable.",
        "bestPractices": "Know the debug table: NaN at epoch 1 = softmax overflow; loss flat at 2.30 = log(10), you're guessing randomly; accuracy stuck at 10% = sign error in dz2 — check (probs − Y), not (Y − probs).",
        "lessonId": "lab-numpy-mlp"
      },
      {
        "q": "In distributed training at scale, what does ZeRO do differently from vanilla data parallelism?",
        "opts": [
          "It shards optimizer state, gradients, and parameters across GPUs instead of replicating them all",
          "It gathers all layers onto one master GPU and broadcasts activations out to the workers each step",
          "It compresses gradients to 1-bit before the all-reduce so slow networks can keep pace with compute"
        ],
        "answer": 0,
        "whyWrong": {
          "1": "That's the opposite of parallelism — one master GPU holding everything is exactly the memory wall ZeRO exists to break. No GPU holds the full training state under ZeRO-3.",
          "2": "Gradient compression is a real but separate technique. ZeRO's insight is about redundant STORAGE: with 32 data-parallel GPUs, why keep 32 identical copies of the Adam state?"
        },
        "whyCorrect": "Vanilla data parallelism replicates params + gradients + optimizer state on every GPU. ZeRO shards them instead: stage 1 shards optimizer state (the biggest consumer, ~4× saving), stage 2 adds gradients, stage 3 adds the parameters themselves. FSDP is the same idea built into PyTorch.",
        "bestPractices": "Reach for ZeRO-3/FSDP when memory is the bottleneck AND you have fast interconnect — the price of sharding is extra communication to gather slices during forward/backward.",
        "lessonId": "ai-distributed-training"
      },
      {
        "q": "After you fine-tune an LLM with LoRA, the saved artifact is ~30 MB instead of 14 GB. Why?",
        "opts": [
          "The base weights are quantized to 4-bit at save time, shrinking the checkpoint about 500-fold",
          "The trainer deduplicates the repeated attention layers, storing each unique layer exactly once",
          "Only the low-rank A and B matrices were trained — the frozen base isn't in the file at all"
        ],
        "answer": 2,
        "whyWrong": {
          "0": "4-bit quantization (QLoRA) is a trick for FITTING the base in VRAM during training — and 4-bit on 14 GB would still be ~3.5 GB. The save step simply doesn't include the base at all.",
          "1": "No such dedup exists — every attention layer has its own distinct learned weights. Sharing them across layers would be a different architecture entirely."
        },
        "whyCorrect": "LoRA freezes the base and trains only tiny rank-decomposed matrices (ΔW = B·A, r typically 8-16) injected into the attention projections — under 1% of parameters. `save_pretrained` writes just that adapter, which reloads on top of the untouched base in one line.",
        "bestPractices": "Remember α/r is the real learning-rate multiplier — doubling r without adjusting α changes your effective LR. And rollback is free: the base is bit-identical, so 'undo' is just not loading the adapter.",
        "lessonId": "lab-lora-finetune"
      },
      {
        "q": "In retrieval-augmented generation, why do production teams cap retrieval at top-k of 3-8 chunks instead of stuffing 50 into the prompt?",
        "opts": [
          "Vector databases can't return more than about ten results per approximate nearest-neighbor query",
          "Past ~10 chunks the model stops attending to the middle of the context, and every extra chunk costs tokens",
          "Anything past ten chunks would overflow the context window of every model on the market today"
        ],
        "answer": 1,
        "whyWrong": {
          "0": "ANN indexes happily return hundreds of neighbors — k is a parameter you choose, not a database limit. The constraint lives on the LLM side, not the retrieval side.",
          "2": "Modern 128k+ context windows fit far more than ten chunks with room to spare. The problem is attention quality and cost, not whether the tokens physically fit."
        },
        "whyCorrect": "Two compounding reasons: the 'lost in the middle' effect — past ~10 chunks the model under-attends to mid-context evidence — and economics, since every chunk is input tokens billed on every call. Context-stuffing tanks accuracy AND the bill at once.",
        "bestPractices": "Use two-stage retrieval: pull top-50 by cheap ANN, re-rank with a cross-encoder down to top-5. Add BM25 hybrid search for proper nouns and IDs, and force citations ([doc-N]) so hallucinations are auditable.",
        "lessonId": "mleng-rag"
      },
      {
        "q": "In tool use and function calling, your tool throws an exception mid-agent-loop. What does the production pattern do next?",
        "opts": [
          "Send the error text back as the tool result — the model can read what failed and change course",
          "Abort the conversation immediately, because the model can't be trusted after a failed tool call",
          "Retry the identical call automatically until it succeeds, since transient failures dominate"
        ],
        "answer": 0,
        "whyWrong": {
          "1": "Aborting throws away a recoverable turn. 'That file didn't exist, try a different path' is exactly the feedback models act on well — the failure was in the tool, not the model's trustworthiness.",
          "2": "Blindly retrying an identical call repeats the identical failure — and for side-effecting tools it's actively dangerous. The model needs to SEE the error so it can change its arguments or approach."
        },
        "whyCorrect": "Errors are inputs too: package the exception text as the tool_result and loop again. The model reads what failed and adapts — retries with fixed arguments, picks a different tool, or asks the user. That recovery loop is what makes agents robust.",
        "bestPractices": "Cap the loop (5-8 iterations) so a confused model can't burn budget chasing its tail, and gate side-effecting tools (refunds, deletes, emails) behind a confirm step — reads are safe to loop, writes are not.",
        "lessonId": "mleng-tool-use"
      },
      {
        "kind": "order",
        "code": true,
        "q": "Assemble one turn of the agent loop — from the user's question to the tool result going back to the model.",
        "items": [
          "messages = [{\"role\": \"user\", \"content\": \"Weather in Tokyo?\"}]",
          "resp = client.messages.create(model=\"claude-sonnet-4-6\", max_tokens=400, tools=tools, messages=messages)",
          "tu = next(b for b in resp.content if b.type == \"tool_use\")",
          "result = run_tool(tu.name, tu.input)",
          "messages.append({\"role\": \"user\", \"content\": [{\"type\": \"tool_result\", \"tool_use_id\": tu.id, \"content\": result}]})"
        ],
        "whyWrong": "You can't hunt for a `tool_use` block before the model has replied, and you can't append a `tool_result` before the tool has actually run — each line consumes what the previous one produced. Running the tool before the API call is the classic flip: the model hasn't asked for anything yet.",
        "whyCorrect": "Build the conversation → call the model → extract the tool_use block it requested → execute the tool → feed the result back as a tool_result message. Acquire before use, at every step: `tu` needs `resp`, `result` needs `tu`, and the append needs both `tu.id` and `result`.",
        "bestPractices": "Wrap this turn in a capped loop (`for _ in range(5)`) that exits when `stop_reason != \"tool_use\"` — an uncapped agent loop is how a confused model burns your budget chasing its tail.",
        "lessonId": "mleng-tool-use"
      },
      {
        "kind": "order",
        "code": true,
        "q": "Assemble a few-shot prompt: build the `messages` list so the examples teach the format before the real input arrives.",
        "items": [
          "messages = []",
          "for u, a in few_shot:",
          "    messages.append({\"role\": \"user\", \"content\": u})",
          "    messages.append({\"role\": \"assistant\", \"content\": a})",
          "messages.append({\"role\": \"user\", \"content\": user_input})"
        ],
        "whyWrong": "Appending `user_input` before the loop buries the real question under the examples — the model answers the last user turn, so it would answer an example instead. Flipping the two appends inside the loop breaks the user→assistant alternation that makes each pair read as question-then-model-answer.",
        "whyCorrect": "Initialize the list, then alternate user/assistant turns for each example, then put the real input LAST. That final position is the contract: the model continues from the last user turn, with every example pair in front of it locking the output format.",
        "bestPractices": "Two to five examples is the sweet spot — every example is input tokens billed on every call. Keep the stable rules in the system prompt (cacheable) and let the examples carry the edge cases: show, don't tell.",
        "lessonId": "mleng-prompting"
      },
      {
        "q": "In production LLM APIs, prompt caching lets you mark a long, stable prefix and pay about ____ of the input rate on cache hits.",
        "opts": [
          "~90%",
          "~10%",
          "~50%"
        ],
        "answer": 1,
        "whyWrong": {
          "0": "At ~90% the discount would barely matter and nobody would restructure prompts around it. The whole point of caching is that hits are nearly free compared to re-processing the prefix.",
          "2": "Half price is still a rough deal for a 4k-token system prompt called 100×/min. The real discount is much steeper — steep enough to change how you structure prompts."
        },
        "whyCorrect": "Cache hits bill at roughly 10% of the input rate. For a long, stable system prompt (rules, retrieved docs, tool schemas) called at high volume, that's the difference between a real budget and a runaway bill.",
        "bestPractices": "Caching only pays if the prefix is byte-stable across calls — keep dynamic data out of the system prompt and put it in the user turn, or every call is a cache miss at full price.",
        "lessonId": "mleng-llm-apis"
      },
      {
        "q": "For read-heavy semantic search under ~50M vectors, ____ is usually the winning index — graph-based with great recall, at the price of RAM.",
        "opts": [
          "IVF",
          "LSH",
          "HNSW"
        ],
        "answer": 2,
        "whyWrong": {
          "0": "IVF is the cluster-based one: smaller memory footprint but slower to build and typically lower recall at the same speed. It wins when RAM is tight, not as the read-heavy default.",
          "1": "LSH hashes vectors into buckets — an older ANN family that generally trails graph-based indexes on the recall/speed curve for text embeddings. It's not what pgvector, Chroma, or Weaviate reach for."
        },
        "whyCorrect": "HNSW builds a navigable graph over the vectors: excellent recall and fast queries, paid for in RAM. That trade suits read-heavy workloads under ~50M vectors, which is why it's the default index across pgvector, Chroma, and Weaviate.",
        "bestPractices": "Pin your metric to your embedding model too — normalized models (OpenAI `text-embedding-3-*`) are fine with dot product, others want cosine. Mixing metrics and models ships silently broken retrieval.",
        "lessonId": "mleng-embeddings"
      },
      {
        "q": "When bulk-ingesting a million embedded chunks into Postgres, use ____ instead of per-row INSERT — it loads about 10× faster.",
        "opts": [
          "COPY",
          "MERGE",
          "UPSERT"
        ],
        "answer": 0,
        "whyWrong": {
          "1": "MERGE reconciles two tables row-by-row (update-or-insert logic) — useful for syncing, but it still pays per-row overhead. Fresh bulk ingestion doesn't need reconciliation, it needs throughput.",
          "2": "UPSERT (`INSERT ... ON CONFLICT`) handles duplicate keys gracefully, but it's still one round-trip of parsing and planning per row. The 10× win comes from skipping that per-row cost entirely."
        },
        "whyCorrect": "COPY streams the whole batch into the table in one bulk operation, skipping per-row parse/plan/commit overhead — roughly 10× faster than row-by-row INSERT. It's the difference between a 10k-chunk ingest finishing in seconds versus minutes.",
        "bestPractices": "Batch the embedder too (~64 chunks per call) so neither side of the pipeline goes row-at-a-time. And if you use an `ivfflat` index, run `ANALYZE` after a big ingest or recall craters — `hnsw` doesn't need it.",
        "lessonId": "lab-rag-pipeline"
      },
      {
        "q": "This system prompt is marked for prompt caching:\n`system=[{\"type\": \"text\", \"text\": f\"You are a support bot. Open tickets: {ticket_dump}\", \"cache_control\": {\"type\": \"ephemeral\"}}]`\nWhat's wrong?",
        "opts": [
          "`cache_control` needs `\"type\": \"persistent\"` — ephemeral entries expire before the next call can ever hit them",
          "The f-string injects per-request data into the cached prefix, so every call is a cache miss billed at full input rate",
          "`system` must be a plain string — passing a list of blocks makes the API silently ignore the `cache_control` field"
        ],
        "answer": 1,
        "whyWrong": {
          "0": "`ephemeral` is the correct (and standard) cache type — entries live long enough to serve rapid repeated calls, which is exactly the high-volume case caching targets. The type isn't the bug.",
          "2": "Backwards — the list-of-blocks form is precisely what unlocks `cache_control` on the system prompt. A plain string is the form that can't carry the cache marker."
        },
        "whyCorrect": "Caching matches on the exact prefix bytes. `ticket_dump` changes every request, so the \"cached\" prefix never repeats — 100% cache misses, full input rate, plus the cache-write surcharge. The rule: system prompt holds stable rules and persona; variable data goes in the user turn.",
        "bestPractices": "Audit cache hit rate, not just the flag: a `cache_control` marker on a prefix that isn't byte-stable is worse than no caching at all. Keep dynamic content strictly below the cache boundary.",
        "lessonId": "mleng-llm-apis"
      },
      {
        "q": "This retrieval step picks chunks for the LLM:\n`ranked = sorted(docs.items(), key=lambda kv: cosine(q_vec, kv[1][1]))`\n`top = ranked[:2]  # feed the \"best\" 2 chunks to the prompt`\nWhat's wrong?",
        "opts": [
          "`sorted` is ascending, so the front slice keeps the two LEAST similar chunks — negate the key or pass `reverse=True`",
          "`cosine` returns values in [-1, 1], which must be rescaled to [0, 1] before Python can compare them as sort keys",
          "`kv[1][1]` selects the document's text instead of its vector, so `cosine` is comparing a string with an array"
        ],
        "answer": 0,
        "whyWrong": {
          "1": "Python sorts floats over any range just fine — negative similarity values compare correctly without rescaling. The math is valid; only the sort direction is wrong.",
          "2": "With `docs` values shaped as `(text, vector)` tuples, `kv[1][1]` is exactly the vector — `kv[1][0]` would be the text. The indexing is correct; the ordering is not."
        },
        "whyCorrect": "Higher cosine = more similar, but `sorted` defaults to ascending — so `ranked[:2]` grabs the two chunks LEAST related to the query and feeds the model pure noise. Use `key=lambda kv: -cosine(...)` or `reverse=True`. Retrieval still \"works\", answers just quietly degrade.",
        "bestPractices": "Silent sort-direction bugs are why you keep a labeled eval set: recall@k craters immediately and points straight at retrieval. Also log which chunks each answer used — the first debugging question is always \"did retrieval fail or did generation ignore it?\"",
        "lessonId": "mleng-embeddings"
      }
    ],
    "distinguished": [
      {
        "q": "Vanishing gradients hurt which layers most?",
        "opts": [
          "Early layers in a deep net",
          "Output layer",
          "Bias terms"
        ],
        "answer": 0,
        "whyWrong": {
          "1": "The output layer is closest to the loss — its gradient is computed directly. It's the LEAST affected.",
          "2": "Bias terms get the same scaling as their layer's weights. They're not specially vulnerable."
        },
        "whyCorrect": "Backprop multiplies gradients layer-by-layer. If each layer's local gradient is < 1, the product shrinks exponentially as you walk backward — so the EARLY layers see vanishingly small updates and essentially stop learning.",
        "bestPractices": "Mitigations: ReLU-family activations (preserve gradient magnitude), residual connections (gradient shortcuts), batch norm / layer norm, careful initialization (Xavier/He)."
      },
      {
        "q": "In pipeline parallelism — 'data, model, pipeline: pick how you cut the cake' — what is the bubble, and what shrinks it?",
        "opts": [
          "GPU memory fragmentation from uneven layers — fixed by rebalancing stages by parameter count",
          "Gradient noise from stale weights across stages — fixed by re-syncing after every microbatch",
          "Idle time while the pipe fills and drains — shrunk by streaming more microbatches through"
        ],
        "answer": 2,
        "whyWrong": {
          "0": "Memory fragmentation is a real ops concern, but it isn't the bubble. Rebalancing stages evens out per-GPU load; it does nothing about the fill/drain idle window at the ends of each step.",
          "1": "GPipe-style schedules keep weights consistent within a step, so staleness isn't the issue. The bubble is a scheduling gap — GPUs with nothing to chew on — not a correctness problem."
        },
        "whyCorrect": "With layers split across stages, the pipeline must fill before every GPU has work and drain at the end — that dead time is the bubble, roughly (stages − 1) / microbatches. Four stages with eight microbatches wastes ~37%; more microbatches shrink it, though too many starve each one.",
        "bestPractices": "Map parallelism to the bandwidth hierarchy: tensor parallel needs NVLink within a node, pipeline parallel tolerates InfiniBand across nodes, data parallel survives Ethernet. Mismatch that and a $50M cluster idles at 30% utilization.",
        "lessonId": "sd-parallelism-topologies"
      },
      {
        "q": "Inference and training are different businesses: why is autoregressive LLM serving usually memory-bandwidth-bound while training is FLOPs-bound?",
        "opts": [
          "Decoding emits one token at a time, so the GPU spends most cycles waiting on weights streaming from HBM",
          "Serving frameworks disable tensor cores for stability, pushing inference onto slower CUDA cores",
          "Training re-reads the dataset from disk each step, hiding memory-traffic costs behind the I/O"
        ],
        "answer": 0,
        "whyWrong": {
          "1": "No framework disables tensor cores in production serving — they run fine at inference. The bottleneck is data movement between HBM and compute, not which arithmetic units are available.",
          "2": "Dataset loading is prefetched and pipelined; it isn't what makes training compute-bound. Training's big controllable batches keep arithmetic intensity high — lots of math per byte moved."
        },
        "whyCorrect": "Training batches huge amounts of work per weight-read, saturating FLOPs. Autoregressive decoding generates one token per step, so each step streams the entire model's weights from HBM for a sliver of math — the GPU waits on memory, not compute. That's why vLLM-class engines lean on continuous batching and KV-cache paging.",
        "bestPractices": "Buy for the workload: training wants interconnect, inference wants HBM bandwidth and int8/fp8. And run the break-even math — most deployments spend more on inference over their lifetime than on training.",
        "lessonId": "sd-inference-vs-training-cost"
      },
      {
        "q": "When evaluating LLM systems with pairwise preference, why must you run both A-vs-B and B-vs-A orderings?",
        "opts": [
          "Two runs double the sample size, halving the statistical error of the preference estimate",
          "LLM judges have position bias — the same pair can flip verdicts when you swap the order",
          "Providers cache the first comparison, so repeating it in the same order returns a stale verdict"
        ],
        "answer": 1,
        "whyWrong": {
          "0": "It's not a sample-size play — re-running the SAME ordering twice would add samples too, yet fix nothing. The swap specifically cancels a directional bias in the judge.",
          "2": "Caching would return an identical response, which is consistency, not bias — and judges run at temperature 0 precisely to BE reproducible. The problem is the verdict depending on presentation order."
        },
        "whyCorrect": "LLM judges carry position bias: the same two answers can win or lose depending on which is shown first. Running A-vs-B and B-vs-A and keeping only agreements (or averaging) cancels the ordering artifact out of your preference data.",
        "bestPractices": "Stack the judge hygiene: use a judge stronger than the candidate, temperature 0, a strict rubric returning JSON — and remember judges also over-reward verbosity and their own model family. Keep a human-eval gate for high-stakes ships.",
        "lessonId": "mleng-llm-eval"
      }
    ]
  },
  "faang": {
    "novice": [
      {
        "q": "What is system design (briefly)?",
        "opts": [
          "Drawing logos",
          "Architecting how services and data fit together",
          "Buying servers"
        ],
        "answer": 1,
        "whyWrong": {
          "0": "Logos are branding. System design is technical architecture.",
          "2": "Purchasing is procurement. System design is the conceptual structure — what should exist and how it talks."
        },
        "whyCorrect": "System design is the discipline of deciding the components (services, databases, queues, caches), how they communicate, and how the whole thing handles load, failure, and growth.",
        "bestPractices": "Start every design from requirements: QPS, data volume, consistency needs, latency SLO. Without those numbers, \"design\" is just whiteboard art."
      },
      {
        "q": "A cache is mainly used to...",
        "opts": [
          "Permanently store data",
          "Encrypt traffic",
          "Serve hot data faster"
        ],
        "answer": 2,
        "whyWrong": {
          "0": "Permanent storage is the database. Caches are explicitly NOT durable — data can evict at any time.",
          "1": "Encryption is TLS/TLS-terminating proxies. Different layer."
        },
        "whyCorrect": "A cache trades durability and capacity for latency. It keeps the most-accessed data in fast memory (RAM, edge) so reads don't hammer the origin.",
        "bestPractices": "Always have a \"cache miss → backing store\" path tested. And design for cache invalidation up front — it's famously one of the two hard problems in CS."
      },
      {
        "q": "In a STAR framework behavioral answer, which letter should take up roughly 60% of your talking time?",
        "opts": [
          "Situation — interviewers need rich context before they can judge anything else",
          "Result — the measurable outcome is the only thing that actually gets scored",
          "Action — the specific steps you personally took, told in first person"
        ],
        "answer": 2,
        "whyWrong": {
          "0": "Situation should be one or two sentences with concrete numbers. Spending 90 seconds on context before any Action lands is a listed anti-pattern — it reads as rambling.",
          "1": "You should end on the Result, but it's a compact payoff — a metric or two. It can't be 60% of the answer because it's the outcome of the Action, not the story itself."
        },
        "whyCorrect": "The Action section is 60% of a strong STAR answer: what YOU did, step by step, with every sentence starting with 'I'. That's where interviewers find the signal they're scoring — ownership and concrete verbs.",
        "bestPractices": "Pre-load 4-5 stories that each cover 2-3 themes, memorize the numbers, and check you can privately label every sentence S/T/A/R. If a sentence is none of them, cut it.",
        "lessonId": "star-framework"
      },
      {
        "q": "In the big tech interview loop, what makes the bar raiser round different from every other round?",
        "opts": [
          "It's run by a senior engineer from a different org who holds veto power over the hire",
          "It's a softer culture-fit chat, since the technical bar was already checked in earlier rounds",
          "It's where the hiring manager finally discusses target level and compensation with you"
        ],
        "answer": 0,
        "whyWrong": {
          "1": "Treating the bar raiser like another behavioral chat is the classic mistake — it's often the hardest interviewer in the loop, calibrated to reject candidates who are merely average for the level.",
          "2": "Level and comp live with the recruiter and hiring manager. The bar raiser is deliberately from outside your target team, so they have no stake in filling the seat quickly."
        },
        "whyCorrect": "The bar raiser (Amazon's term — Meta calls it the jedi) is a cross-org senior IC whose only job is to protect the hiring bar. They can veto the hire even if every other interviewer scored you strong-hire.",
        "bestPractices": "Bring your A+ stories to the bar raiser, not your B stories. They're asking 'would we regret this hire in two years?', not 'can this person do the job today?'",
        "lessonId": "interview-loop"
      },
      {
        "q": "After the onsite in the interview loop, five interviewers submit scores. How does the debrief turn those into a decision?",
        "opts": [
          "Scores are averaged, so three strong-hires can absorb two weak rounds",
          "A consensus vote — one detractor with specifics beats vague positives",
          "The hiring manager's score counts double and normally settles the outcome"
        ],
        "answer": 1,
        "whyWrong": {
          "0": "The debrief is explicitly not an average. The scoring math in the lesson shows two lean-no-hires killing a packet that also contains three positive votes.",
          "2": "The hiring manager assesses team fit but gets no double weight — and the bar raiser can veto them entirely. No single positive voice can outvote specific negative evidence."
        },
        "whyCorrect": "Debriefs run on consensus. One strong-no-hire blocks the offer outright, and a single interviewer armed with specific, repeatable evidence will beat several vague 'seemed fine' votes.",
        "bestPractices": "Your goal in each round: give that interviewer one concrete, quotable reason to fight for you in the debrief. Treat every round as independent — a bad one early doesn't doom you if the rest are strong.",
        "lessonId": "interview-loop"
      },
      {
        "q": "How Cloudflare's 1.1.1.1 beat Google DNS on latency comes down mostly to what?",
        "opts": [
          "Anycast — one IP advertised from 300+ edge POPs; BGP routes you to the nearest",
          "A faster query-parsing engine that resolves each lookup in far fewer CPU cycles",
          "Skipping DNSSEC validation to shave milliseconds off every single lookup"
        ],
        "answer": 0,
        "whyWrong": {
          "1": "CPU time is a rounding error in DNS latency. The lesson's point is that the win was mostly geography — distance to the resolver — not code speed.",
          "2": "1.1.1.1 validates DNSSEC exactly like 8.8.8.8 — the comparison table shows both reject spoofed records. The real differentiator was privacy (no logging, refusing ECS), not skipped security."
        },
        "whyCorrect": "Anycasting 1.1.1.1 from 300+ POPs means your query usually lands within ~10ms of you, on a hot cache shared by millions of users — 11ms median globally vs Google's 19ms.",
        "bestPractices": "'DNS is a latency problem disguised as a lookup problem.' When a lookup-style service is slow, check distance-to-server and cache warmth before you profile the code.",
        "lessonId": "cloudflare-dns"
      },
      {
        "q": "Why did Discord migrate from MongoDB to Cassandra for message storage?",
        "opts": [
          "MongoDB ran out of raw capacity — they hit its maximum collection size at 120M messages/day",
          "An @everyone ping caused mass cold reads that evicted MongoDB's hot set from RAM",
          "Cassandra offered stronger multi-row transactions, which chat message ordering requires"
        ],
        "answer": 1,
        "whyWrong": {
          "0": "Raw capacity wasn't the issue — Mongo held the data fine. The killer was the access pattern: chat users scroll back to year-old messages, which fights a working-set database.",
          "2": "Cassandra is famously weaker on transactions than most stores. Discord chose it for the partition-key + clustering-key layout mapping to (channel_id, message_id), not for ACID."
        },
        "whyCorrect": "One @everyone in a busy server made every member request recent messages at once. MongoDB seeked to data that had been pushed out of RAM days earlier, and a single ping could spike p99 latency past 5 seconds across the entire database.",
        "bestPractices": "Model the access pattern before picking a store. Cassandra clusters recent messages together on disk per channel, so cold scrollback of one channel can't evict every other channel's hot data.",
        "lessonId": "discord-cassandra"
      },
      {
        "q": "What kicked off the 2017 AWS S3 outage that degraded Slack, Trello, Quora, and Medium for about four hours?",
        "opts": [
          "An engineer debugging billing ran a routine command with a typo that took far too many servers offline",
          "A coordinated DDoS overwhelmed S3's front-end request fleet in us-east-1",
          "A datacenter power failure destroyed storage hardware, permanently losing customer objects"
        ],
        "answer": 0,
        "whyWrong": {
          "1": "No attacker was involved — it was an internal operations command. That's why the fixes were command guardrails (minimum capacity increments, rate limiting), not DDoS defenses.",
          "2": "No data was lost — S3's 11-nines durability held. It was an availability outage, and recovery dragged because critical subsystems hadn't been cold-restarted in years."
        },
        "whyCorrect": "A typo in a routine capacity-removal command took down a large set of servers, including metadata subsystems the rest of S3 depended on. Even AWS's own status page couldn't update — it hosted its assets on S3.",
        "bestPractices": "Steal the postmortem fixes: cap how much any one command can remove, actually exercise subsystem independence instead of assuming it, and run restart drills so cold-start behavior isn't a surprise.",
        "lessonId": "aws-s3-outage"
      },
      {
        "q": "Chaos Monkey reshaped reliability at Netflix by killing EC2 instances at a very deliberate time. When, and why?",
        "opts": [
          "Sundays at 3am, when traffic is lowest and a failure affects the fewest streaming users",
          "Only in the staging environment, where instance kills can't hurt real customers",
          "During business hours in production, while engineers are watching and can fix it"
        ],
        "answer": 2,
        "whyWrong": {
          "0": "That's the instinct Chaos Monkey was built to reject. A 3am failure gets noticed by nobody and teaches nothing — real failures don't schedule themselves politely.",
          "1": "It ran in production on purpose. Staging survival proves nothing about production resilience, and the cultural forcing function only works when the stakes are real."
        },
        "whyCorrect": "Failures will happen; the only question is whether they arrive when engineers can respond. Killing instances at 2pm on a Tuesday means every service MUST be built to fail gracefully — there is no other option.",
        "bestPractices": "Start smaller than Netflix: kill one process in production during work hours and watch what breaks. If that idea terrifies you, the fear itself is your reliability backlog.",
        "lessonId": "netflix-chaos"
      },
      {
        "q": "When GitLab lost 6 hours of customer data in 2017, how many of their five backup mechanisms actually worked?",
        "opts": [
          "Zero — which is why the deleted production data was gone forever",
          "One — the other four had silently failed or been quietly disabled",
          "All five — the loss happened because an engineer restored the wrong snapshot"
        ],
        "answer": 1,
        "whyWrong": {
          "0": "One did work: a 24-hour LVM snapshot that happened to be 6 hours stale. That single working mechanism is the only reason the loss was 6 hours instead of everything.",
          "2": "Four of five failed: pg_dump had been silently broken for months with no alerts, Azure snapshots were disabled as 'redundant', S3 uploads went to a nonexistent bucket, and the replication slot was the thing being debugged."
        },
        "whyCorrect": "Exactly one — the LVM snapshot. Five backup mechanisms existed on paper; the postmortem's famous admission is that when they were actually needed, only one had real data in it.",
        "bestPractices": "A backup you've never restored is folklore. Monitor the backup PROCESS (did the script run? is the output the expected size?), not just the storage — and schedule restore drills.",
        "lessonId": "gitlab-data-loss"
      },
      {
        "q": "In a system design interview, why spend the first 90 seconds on back-of-envelope math — estimating QPS and storage at the whiteboard?",
        "opts": [
          "It proves you can do mental arithmetic precisely while under pressure",
          "It fills the awkward opening minutes while you think about the real architecture",
          "The numbers justify the architecture — read QPS earns a cache tier, TB/yr earns sharding"
        ],
        "answer": 2,
        "whyWrong": {
          "0": "Interviewers grade reasoning, not arithmetic. The lesson says to round with powers of ten — saying 'about 2 million QPS' beats fumbling toward 1,847,293.",
          "1": "Estimation IS the real work — it's the bridge between requirements and architecture, not filler. Skipping it is exactly what makes candidates look like architecture astronauts."
        },
        "whyCorrect": "Every component must be earned by a number. If reads peak at 1.8M QPS and one Redis node handles ~100k, the math justifies the cache tier. If your numbers don't justify a Kafka cluster, don't draw one.",
        "bestPractices": "Memorize the ladder: 86,400 s/day rounds to 10^5; 1 KB x 1M = 1 GB; 1 KB x 1B = 1 TB. Peak is 2-3x average — state the multiplier out loud, and re-estimate when a requirement changes.",
        "lessonId": "sd-back-of-envelope"
      }
    ],
    "junior": [
      {
        "q": "CAP theorem says you can have at most two of...",
        "opts": [
          "Consistency, Availability, Partition-tolerance",
          "Cost, Auth, Performance",
          "CPU, API, Persistence"
        ],
        "answer": 0,
        "whyWrong": {
          "1": "Those are real concerns, but they're not the letters in CAP. CAP is a specific distributed-systems result.",
          "2": "Same — those are real but not the CAP triplet."
        },
        "whyCorrect": "CAP: under a network Partition, you must choose between Consistency (all reads see the latest write) and Availability (every request gets a non-error response). You cannot have both during a partition.",
        "bestPractices": "In practice, partitions are rare but inevitable. Decide ahead of time whether YOUR system is CP (e.g. financial ledger) or AP (e.g. social feed) and document it."
      },
      {
        "q": "GitHub handles 100M requests/second while still running Ruby on Rails. What did they actually rewrite in faster languages?",
        "opts": [
          "Everything user-facing — Rails only survives today in internal admin tooling",
          "Only the hot paths — like git push/pull, served by a C-based server",
          "Nothing — Rails serves every request; they simply kept buying bigger servers"
        ],
        "answer": 1,
        "whyWrong": {
          "0": "The 90% of pages that are plain CRUD stayed in Rails, because rewriting them gains nothing. 'Rails doesn't scale' is mostly wrong — your architecture scales or doesn't, not the framework.",
          "2": "Vertical scaling alone can't absorb that traffic. The wins were architectural: hundreds of MySQL read replicas, caching at every layer, Sidekiq background jobs, sharded git storage — and yes, the git protocol left Rails."
        },
        "whyCorrect": "The rewrite criterion was surgical: rewrite only where the latency budget or correctness requirements exceed what the framework can give. Git push/pull runs on an internal C-based server talking directly to file storage; the CRUD majority stays in Rails.",
        "bestPractices": "Before proposing a rewrite, name the specific path whose latency budget the current stack can't meet. Rewriting the hot 10% and keeping the boring 90% beats a big-bang migration.",
        "lessonId": "github-scaling"
      },
      {
        "q": "Notion AI runs hybrid search — vector search AND keyword search (BM25) — in its RAG pipeline. Why not pure vector retrieval?",
        "opts": [
          "Vector catches paraphrases while keyword catches exact terms — each covers the other",
          "Keyword search is the fallback path that only activates when the vector database is unavailable",
          "BM25 is far cheaper, so keyword handles most queries and vectors run only for premium workspaces"
        ],
        "answer": 0,
        "whyWrong": {
          "1": "It's not failover — both searches run on every query and the results are merged with reciprocal rank fusion. The goal is retrieval quality, not availability.",
          "2": "There's no cost tiering in the design. The merged hybrid results feed a cross-encoder reranker that picks the top 5 for the LLM regardless of who's asking."
        },
        "whyCorrect": "Embeddings match meaning but fumble exact strings, and cosine similarity alone misses matches like 'rate limit' vs 'throttling'. BM25 nails exact identifiers but misses paraphrases. Fused together, then reranked, they cover each other's failure modes.",
        "bestPractices": "In RAG postmortems, 'the answer existed but wasn't retrieved' is the top failure. Add keyword search and a reranker before reaching for a bigger model — Notion calls the reranker the unsung hero.",
        "lessonId": "notion-ai"
      },
      {
        "q": "Spotify's Hendrix platform ships thousands of ML models. What does the platform team actually optimize for?",
        "opts": [
          "Squeezing maximum prediction accuracy out of each individual model on the platform",
          "Centralizing all model training under one expert ML team for consistency",
          "How fast a new team ships its first model — self-service, one CLI, standardized telemetry"
        ],
        "answer": 2,
        "whyWrong": {
          "0": "Model accuracy is the model teams' job. The lesson's crucial insight is that Hendrix's cleverest part 'isn't the ML pipeline' — it's the developer-experience layer around it.",
          "1": "The opposite: Hendrix keeps dozens of teams autonomous. Before it, every team deployed differently and tracked versions in spreadsheets. The fix was shared rails, not a central gatekeeper."
        },
        "whyCorrect": "The platform metric is 'how fast can a new team get to value' — first model shipped in a week instead of a quarter, via hendrix train/deploy/rollback, self-service onboarding, and telemetry shapes that make dashboards work for free.",
        "bestPractices": "This is platform engineering: you're building the system other engineers build on. Even a 3-person team benefits from one standard deploy path and consistent metric shapes.",
        "lessonId": "spotify-hendrix"
      },
      {
        "q": "Discord scaled to 19M concurrent users, yet rewrote its Go Read States service in Rust. What was actually wrong with the Go version?",
        "opts": [
          "GC pauses — scanning a multi-gigabyte heap of small objects spiked p99 to 300ms+",
          "Go's happy-path throughput was too slow to keep up with Discord's raw message volume",
          "Go couldn't express the packed struct layouts needed for CPU cache locality"
        ],
        "answer": 0,
        "whyWrong": {
          "1": "The lesson is explicit: Go was already fine on the happy path. Rust didn't win on raw speed — it won because no garbage collector means no periodic scan pauses.",
          "2": "Go structs are value types with perfectly workable layouts. The blocker was the garbage collector periodically scanning millions of small heap objects — no struct packing fixes that."
        },
        "whyCorrect": "Go's GC had to scan a multi-gigabyte heap every couple of minutes, spiking p99 from ~10ms to 300ms+. You can't tune under a pause that scales with heap size — removing the GC entirely (Rust) dropped p99 back to ~10ms on the same CPU budget.",
        "bestPractices": "Discord's own rule: Rust rewrites are not free — only do them when GC is provably the bottleneck, not because Rust is fashionable.",
        "lessonId": "discord-19m"
      },
      {
        "q": "In Discord's 19M-concurrent-user architecture, every guild lives on exactly one shard. What does that buy them?",
        "opts": [
          "Guaranteed even load — hashing guilds across shards keeps every shard equally busy",
          "Ordering without consensus — all of a guild's events flow through one process",
          "Durability — each shard persists its guilds' presence data safely to local disk"
        ],
        "answer": 1,
        "whyWrong": {
          "0": "The opposite trade: hot shards are real. A viral guild needs manual rebalancing, and 1M+ member guilds get a dedicated shard. Discord accepted load skew to win ordering.",
          "2": "Presence is explicitly never persisted to disk — it's read-heavy, write-bursty, in-memory state. Sharding here is about routing and ordering, not durability."
        },
        "whyCorrect": "With one process owning each guild, its events are naturally ordered and local. Snowflake IDs plus one-shard-per-guild means no consensus round on the message hot path — 'the shard is the unit of consistency; everything else is eventually consistent and you live with it.'",
        "bestPractices": "When you need ordering, first try making it local: route all writers for an entity through one owner process before paying for distributed consensus.",
        "lessonId": "discord-19m"
      },
      {
        "q": "'SQL, NoSQL, KV — pick by access pattern, not by hype.' A KV store gives you sub-ms reads at huge scale. What's the bill?",
        "opts": [
          "You lose durability — KV data can silently vanish whenever a node restarts",
          "Writes get slow — each KV write internally triggers a full table rewrite",
          "No secondary indexes — a query like 'all users in CA' degenerates into a full scan"
        ],
        "answer": 2,
        "whyWrong": {
          "0": "Durable KV stores exist — DynamoDB is one of the lesson's examples. Don't confuse the KV data model with an in-memory cache; persistence is a separate dial.",
          "1": "KV writes are typically as fast as reads — that's much of the appeal. There's no table to rewrite; the cost lives on the query side, not the write side."
        },
        "whyCorrect": "KV buys effortless horizontal scale and sub-ms lookups by known key, and you pay by losing secondary indexes: any access that isn't 'by key' means scanning. It's a locker room — great if you know your locker number, useless for 'find all the Smiths'.",
        "bestPractices": "Name the query first. 'Get user by id at 500k QPS' picks KV; 'refund the line item if the order is unshipped' picks SQL. Architecture follows access.",
        "lessonId": "sd-sql-vs-nosql-vs-kv"
      },
      {
        "q": "You solve a dynamic programming problem top-down with @cache memoization. What failure mode pushes production code toward bottom-up tabulation?",
        "opts": [
          "Deep recursion can blow the call stack — tabulation is loop-based and immune",
          "Memoization has strictly worse big-O than tabulation on the same problem",
          "The cache decorator only works on Fibonacci-shaped single-argument recursions"
        ],
        "answer": 0,
        "whyWrong": {
          "1": "Both flavors compute each subproblem exactly once — the asymptotic complexity is identical. Tabulation usually wins on constant factors, not complexity class.",
          "2": "@cache memoizes any function of hashable arguments — LCS, knapsack, and edit distance all work top-down. The limit is recursion depth, not problem shape."
        },
        "whyCorrect": "Top-down rides the call stack, so an input that needs 100,000 nested calls overflows it. Bottom-up fills the table iteratively from base cases — no recursion limit, and often a faster constant factor.",
        "bestPractices": "Interview move: write top-down first because it mirrors the recurrence, then mention the stack-overflow risk and offer to convert to tabulation if inputs are large."
      },
      {
        "q": "The FAANG round-by-round guide contrasts good prep with bad prep. Which habit lands in the 'bad prep' column?",
        "opts": [
          "Doing mock interviews with strangers on Pramp or interviewing.io who push back",
          "Grinding LeetCode silently, alone at 2am, marking problems 'solved' and never revisiting them",
          "Writing your STAR stories down and tagging each one to 2-3 leadership principles"
        ],
        "answer": 1,
        "whyWrong": {
          "0": "That's good prep — friends go easy on you. Strangers who push back generate the stress the real loop will, which is exactly what you need to rehearse under.",
          "2": "Also good prep. Written, tagged stories can be remixed across behavioral prompts on the fly; improvising answers cold is the bad-column version."
        },
        "whyCorrect": "Silent grinding trains the wrong skill. Interviewers score what they HEAR, so practice must be timed and narrated aloud — and wrong answers reviewed the same day, not marked solved and abandoned.",
        "bestPractices": "The behavioral round is technical — loops fail there more than people admit, usually after 200 hours on coding and 2 on stories. Allocate prep time to the rubric, not to what feels comfortable.",
        "lessonId": "g1"
      },
      {
        "kind": "order",
        "q": "Order the phases of a system design interview the way strong candidates run them.",
        "items": [
          "Nail down requirements and explicit non-goals",
          "Estimate the load — QPS, storage, growth",
          "Sketch the API and data model",
          "Draw the high-level architecture",
          "Deep-dive the bottleneck and scaling story"
        ],
        "whyWrong": "Jumping straight to the architecture diagram is the classic fail — without requirements and numbers, every box you draw is unjustifiable. The estimates are what EARN the cache tier and the shards.",
        "whyCorrect": "Requirements → numbers → contracts → structure → depth. Each phase produces the inputs the next phase needs to be defensible.",
        "bestPractices": "Say your non-goals out loud in minute one ('no analytics, no multi-region for v1') — scope you cut explicitly is competence; scope you forgot is a red flag."
      }
    ],
    "senior": [
      {
        "q": "Why is DP often O(n*m) instead of exponential?",
        "opts": [
          "Hardware speed",
          "Memoizing overlapping subproblems",
          "Loop unrolling"
        ],
        "answer": 1,
        "whyWrong": {
          "0": "Hardware doesn't change asymptotic complexity. A 10× faster CPU still loses to exponential growth at modest n.",
          "2": "Loop unrolling is a constant-factor optimization. DP's win is algorithmic — different complexity class."
        },
        "whyCorrect": "Naive recursion re-solves the same subproblems exponentially many times. DP stores each subproblem's answer in a table (n × m cells) and computes each once — collapsing exponential to polynomial.",
        "bestPractices": "Spot DP by drawing the recursion tree: if you see the same (state) node repeated, memoize. Bottom-up tabulation usually wins on constant factors and avoids stack-overflow risk."
      },
      {
        "q": "The Time & Clocks rule says retry timeouts must use the monotonic clock, never wall time. What goes wrong with wall time?",
        "opts": [
          "NTP can step the wall clock backwards or forwards, making your timer fire twice or never",
          "Wall clocks only offer second-level precision, which is too coarse for timeouts",
          "Reading the wall clock needs a syscall that's too slow for request hot paths"
        ],
        "answer": 0,
        "whyWrong": {
          "1": "Wall clocks give microsecond-or-better precision — resolution isn't the problem. The problem is the value can JUMP when NTP corrects drift or DST flips.",
          "2": "Both clock reads cost about the same. Performance isn't the distinction — monotonicity is: one value can go backwards, the other never does."
        },
        "whyCorrect": "time.time() can jump when NTP slews or steps the clock, so a deadline computed from it may land instantly in the past — or never arrive. time.monotonic() never goes backwards, which makes elapsed-time and timeout math safe.",
        "bestPractices": "Wall clock for human-facing timestamps and DB rows; monotonic for every duration, timeout, and rate limit. Mixing them is the #1 source of 'my retry loop fired twice' bugs.",
        "lessonId": "time-clocks"
      },
      {
        "q": "A user clicks save, sees the success toast, navigates back — and the change is gone. Refreshing brings it back. Classic eventual consistency. What happened?",
        "opts": [
          "The write failed silently and a background job replayed it a moment later",
          "The write hit the primary, but the read-back landed on a lagging replica",
          "The browser served a cached copy of the old page instead of asking the server"
        ],
        "answer": 1,
        "whyWrong": {
          "0": "The write succeeded on the first try — that's why the refresh finds it. The value was committed on the primary the whole time; nothing was replayed.",
          "2": "Plausible-sounding, but this bug reproduces with cache-busting requests and never appears on a single-node dev DB — the signature of replication lag on the server side, not browser caching."
        },
        "whyCorrect": "Writes go to the primary; reads load-balance across replicas that lag by milliseconds. The user's read raced the replication and lost. The fix is read-your-writes: pin the session to the primary for a short window after each write, or return the written row in the response so the client skips the re-read.",
        "bestPractices": "Size the sticky window from data — roughly 2x your p99 replication lag. Too short and users watch their writes vanish; too long and you crush the primary with pinned reads.",
        "lessonId": "faang-eventual-consistency"
      },
      {
        "q": "Hash, range, directory — the sharding strategies lesson pushes consistent hashing over plain hash(key) % N. What specifically does the ring fix?",
        "opts": [
          "It removes hotspots by spreading each hot key across multiple shards at once",
          "It makes range scans efficient by keeping adjacent keys together on one shard",
          "It shrinks resharding — adding a node moves only ~1/N of keys, not nearly all"
        ],
        "answer": 2,
        "whyWrong": {
          "0": "Hotspots are a shard-key-choice problem — a celebrity key still lands on exactly one node either way. Virtual nodes smooth NODE placement on the ring, not per-key heat.",
          "1": "Neither mod-N nor the ring helps range queries — hashing scatters adjacent keys by design. Fast range scans are what range sharding is for, at the price of hotspots."
        },
        "whyCorrect": "With plain mod-N, going from N to N+1 nodes rehashes nearly every key — effectively a full data migration. On the ring, only the slice that belonged to the displaced neighbor moves: ~1/N of keys. That's the difference between a 5-minute rebalance and a 5-hour outage.",
        "bestPractices": "Use ~150 virtual nodes per physical node, or a new node's load lands entirely on one neighbor. Staff-level move: start with more logical shards than physical nodes so future splits never rehash keys.",
        "lessonId": "sd-sharding-strategies"
      },
      {
        "q": "Pagination at scale: LIMIT 20 OFFSET 1000000 gets slower the deeper you page. Why?",
        "opts": [
          "The database walks and discards a million rows before returning your 20 — cost is O(N) at page N",
          "The offset value overflows the query planner's integer budget somewhere past a million",
          "Each offset page takes row locks on everything it skips, serializing concurrent readers"
        ],
        "answer": 0,
        "whyWrong": {
          "1": "Offsets are 64-bit integers — nothing overflows at a million. The cost is real work: the executor has to materialize every skipped row before discarding it.",
          "2": "Plain reads don't lock skipped rows under MVCC. The pain is the wasted scan — plus concurrent writes shuffling rows mid-scroll, so users see duplicates and gaps."
        },
        "whyCorrect": "OFFSET means 'compute these rows, then throw them away', so latency grows linearly with page depth. Cursor/keyset pagination encodes (created_at, id) and resumes with an index seek — O(log n), so page 1 and page 50,000 cost the same.",
        "bestPractices": "Always add a tiebreaker: ORDER BY created_at DESC, id DESC — timestamps tie, and a cursor without a unique key duplicates rows. Ship the cursor as an opaque, versioned token.",
        "lessonId": "faang-pagination"
      },
      {
        "q": "Your CDN edge uses LFU cache eviction. Last month's viral content died down and new content is trending — but the hit rate keeps sinking. What's the LFU failure mode?",
        "opts": [
          "LFU evicts on recency, so trending content gets kicked out the moment its traffic dips",
          "LFU's frequency counters overflow under viral load and reset hot keys back to zero",
          "Yesterday's hot keys banked huge hit counts and never leave — new can't win"
        ],
        "answer": 2,
        "whyWrong": {
          "0": "Evicting on recency is LRU, not LFU. LFU evicts the LOWEST hit count — its flaw is worshipping the past, not forgetting it.",
          "1": "Real LFU implementations use saturating or aged counters — overflow isn't the issue. The issue is stale frequency: the counts describe last month's traffic, not today's."
        },
        "whyCorrect": "LFU evicts the lowest-frequency key, so entries with big historical counts become unevictable even after traffic moves on. New keys enter with a count of 1 and lose every eviction fight. As the lesson puts it: 'LRU forgets the past, LFU worships it.'",
        "bestPractices": "Use decayed/aged counters, or switch to ARC — two adaptive LRU lists that self-tune between recency and frequency. It's the default in ZFS and Postgres's buffer manager for exactly this reason."
      },
      {
        "kind": "order",
        "q": "Trace a read request through a large-scale web stack — from the user to the source of truth.",
        "items": [
          "Client hits the CDN edge",
          "The load balancer picks an app server",
          "The app checks the cache tier",
          "On a miss, the database serves the read",
          "The result backfills the cache on the way out"
        ],
        "whyWrong": "Placing the cache check after the database defeats its purpose — the cache exists to absorb reads BEFORE they cost a DB round trip. The backfill (cache-aside) happens on the response path, not before the read.",
        "whyCorrect": "Edge → LB → cache → DB → backfill. Every layer exists to stop the request from reaching the expensive layer behind it.",
        "bestPractices": "Quote the hit-rate math when you design this: at 95% cache hit rate the DB sees 1/20th the traffic — that number is why the layer earns its complexity."
      },
      {
        "kind": "order",
        "code": true,
        "q": "Arrange this Stripe webhook handler so it verifies, dedupes, and applies — in the only safe order.",
        "items": [
          "ts, mac = parse(req.headers['Stripe-Signature'])  # split header into timestamp + hmac",
          "expected = hmac.new(secret, f\"{ts}.{body}\".encode(), hashlib.sha256).hexdigest()",
          "if not hmac.compare_digest(expected, mac): return 401  # constant-time — forged or tampered",
          "db.execute(\"INSERT INTO processed_events(id) VALUES (%s)\", (evt['id'],))  # unique constraint = dedupe lock",
          "apply_business_logic(evt)  # only runs once per event id"
        ],
        "whyWrong": "Dedupe before verify lets attackers stuff forged event IDs into processed_events — the genuine event that arrives later no-ops as a 'duplicate' and is silently dropped. Apply before dedupe means every at-least-once retry re-runs the side effect: double charges, double emails.",
        "whyCorrect": "Verify, then dedupe, then apply. The dataflow forces it too: computing the expected HMAC needs `ts` from the parsed header, the constant-time compare needs `expected`, and only a verified, never-before-seen event may reach business logic.",
        "bestPractices": "Return 200 on the duplicate path so the sender stops retrying, and let the DB unique constraint — not a Redis TTL shorter than the provider's multi-day retry budget — be the final line of dedupe defense.",
        "lessonId": "faang-idempotent-webhooks"
      },
      {
        "kind": "order",
        "code": true,
        "q": "Rebuild `charge_card` so a retried request can never bill the customer twice.",
        "items": [
          "def charge_card(user_id, amount, idem_key):",
          "    cached = db.fetch_one(\"SELECT result FROM charges WHERE idem_key = %s\", (idem_key,))  # seen this key?",
          "    if cached: return cached['result']  # same key, same answer — never re-charge",
          "    result = stripe.charge(user_id, amount)  # the real side effect",
          "    db.execute(\"INSERT INTO charges(idem_key, result) VALUES (%s, %s)\", (idem_key, json(result)))  # cache for the next retry",
          "    return result"
        ],
        "whyWrong": "Charging before checking the cache is the double-billing bug — a retry carrying the same key re-runs the side effect. Inserting the charges row before calling Stripe stores a result you don't have yet, so the next retry returns garbage.",
        "whyCorrect": "Look up the idempotency key BEFORE the side effect, run the charge exactly once, then record key and result so the next retry short-circuits to the cached answer instead of touching Stripe again.",
        "bestPractices": "Generate the key once, outside the retry loop, and send it on every attempt. Make lookup-then-insert atomic (one transaction, or INSERT ... ON CONFLICT) so two concurrent retries can't both slip past the cache check and charge.",
        "lessonId": "faang-resilience-trio"
      },
      {
        "q": "Keyset pagination orders by `created_at DESC, id DESC` — the `id` acts as a ____ so rows with identical timestamps can't duplicate or vanish across pages.",
        "opts": [
          "shard-routing key",
          "unique tiebreaker",
          "version marker"
        ],
        "answer": 1,
        "whyWrong": {
          "0": "Keyset pagination is a single index seek on one database — nothing here routes between shards. The `id` in the ORDER BY exists purely to break `created_at` ties.",
          "2": "Versioning lives in the opaque cursor envelope (the `v` field of the base64 token), not in the ORDER BY clause. The sort key's job is position, not schema evolution."
        },
        "whyCorrect": "Timestamps collide. Without a unique secondary sort key, the cursor position 'after created_at X' is ambiguous — several rows share X, so pages can repeat or skip rows. Adding `id` makes every position single and reproducible.",
        "bestPractices": "Always pair the sort column with a unique tiebreaker, encode BOTH in the cursor, and ship the cursor as an opaque, versioned base64url token so clients can't parse-and-break on it.",
        "lessonId": "faang-pagination"
      },
      {
        "q": "A distributed rate limiter runs its whole check-and-decrement inside one Redis Lua script because Redis executes the script ____ — no other client's command can interleave mid-check.",
        "opts": [
          "atomically",
          "in parallel",
          "on a replica"
        ],
        "answer": 0,
        "whyWrong": {
          "1": "The opposite — Redis processes commands on a single thread, and the value of Lua here is exactly that the script runs as one serial, uninterruptible unit.",
          "2": "Rate-limit state must live on the primary. A replica lags by design, so counting requests there would over-admit during the lag window."
        },
        "whyCorrect": "A read-then-write across the network races itself: two edges can both see 99/100 and both admit. Inside a Lua script, the evict-count-add sequence (ZREMRANGEBYSCORE, ZCARD, ZADD) is one indivisible unit and one round trip.",
        "bestPractices": "Decide fail-open vs fail-closed for a Redis outage before launch, and use server-side time in the script — clock skew between edge POPs shifts the window if callers supply their own timestamps.",
        "lessonId": "faang-distributed-ratelimit"
      },
      {
        "q": "ARC cache eviction keeps two LRU lists — recently-used-once vs frequently-used — and adapts the split toward whichever side is taking more ____.",
        "opts": [
          "cache writes",
          "ghost memory",
          "misses"
        ],
        "answer": 2,
        "whyWrong": {
          "0": "ARC balances on miss pressure, not write volume — the number of writes landing on a list says nothing about which list is mispredicting the workload.",
          "1": "Ghost entries are the mechanism, not the signal: they are IDs of recently evicted keys, and a hit on a ghost is how ARC learns a list evicted something it shouldn't have."
        },
        "whyCorrect": "When one list keeps missing on keys it recently evicted, ARC grows that list's share of the cache. That self-tuning between recency and frequency is why it beats plain LRU and LFU on mixed workloads and ships in ZFS and Postgres's buffer manager.",
        "bestPractices": "Reach for ARC when the workload mixes a hot set with bursty scans and you can afford the ghost-entry memory. Stick with LRU when recency dominates or the cache sits in a hot inner loop.",
        "lessonId": "faang-cache-eviction"
      },
      {
        "q": "This read handler implements read-your-writes routing, where `stuck` means the user wrote in the last 5 seconds: `const conn = stuck ? db.replica : db.primary;`. What's wrong?",
        "opts": [
          "The cookie check should compare a write timestamp, not a boolean — a boolean flag can never expire",
          "The routing is fine — the real bug is that a 5-second sticky window is far too long for production",
          "The ternary branches are swapped — recent writers get the lagging replica while everyone else hammers the primary"
        ],
        "answer": 2,
        "whyWrong": {
          "0": "The cookie's maxAge already expires the flag — a boolean plus a 5-second TTL is exactly the lesson's sticky-session pattern. Expiry is handled at the cookie layer, not in the value.",
          "1": "Five seconds is a sane window — the guidance is roughly 2x your p99 replication lag, and replication usually lags by milliseconds. The window size isn't the defect."
        },
        "whyCorrect": "It should read `stuck ? db.primary : db.replica`. As written it does the exact opposite of read-your-writes: the one user guaranteed to race replication reads the stale replica, and every cold read pins to the primary you were trying to protect.",
        "bestPractices": "Size the sticky window from data (about 2x p99 replication lag) and add an integration test that writes then immediately reads under artificial replica lag — this inversion passes every single-node test.",
        "lessonId": "faang-eventual-consistency"
      },
      {
        "q": "An LRU cache's hit rate keeps sinking, and its lookup is `def get(self, key):` / `    if key not in self.data: return None` / `    return self.data[key]`. What's the bug?",
        "opts": [
          "`get` never calls `move_to_end`, so hits don't refresh recency — eviction silently degrades to FIFO",
          "Returning `None` on a miss is the bug — callers can never distinguish a genuine miss from a stored `None` value",
          "The `key not in self.data` membership check walks the whole dict, making every lookup O(n) and starving eviction"
        ],
        "answer": 0,
        "whyWrong": {
          "1": "The None sentinel is a real API nit, but it can't move the hit rate — it changes what a miss looks like to the caller, not which keys survive eviction.",
          "2": "Dict membership is an O(1) hash lookup, not a scan — and there's no eviction thread to starve; eviction happens inline in `put`."
        },
        "whyCorrect": "LRU's contract is that a read counts as a touch. Without `self.data.move_to_end(key)` on a hit, a key read a million times still sits at its insertion position and gets evicted exactly like a cold one — the cache is now FIFO wearing an LRU costume.",
        "bestPractices": "Touch on every hit, and treat `put` on an existing key as a touch too. Regression test: fill the cache, hit key A repeatedly, insert past capacity, assert A survived.",
        "lessonId": "faang-cache-eviction"
      }
    ],
    "distinguished": [
      {
        "q": "In a write-heavy service, what is often the first bottleneck?",
        "opts": [
          "CPU",
          "DNS",
          "Disk / log throughput"
        ],
        "answer": 2,
        "whyWrong": {
          "0": "CPU bottlenecks show up on compute-heavy workloads (ML inference, JSON parsing at scale). Writes are usually I/O-bound first.",
          "1": "DNS is a one-time resolution at connection setup. Doesn't scale with write volume."
        },
        "whyCorrect": "Durable writes hit the storage subsystem — the WAL fsync on a transactional DB, or the commit log on Kafka — and that's a serial, latency-bound path. You typically saturate disk IOPS / log throughput before CPU.",
        "bestPractices": "Batch writes (group commits, log appends), use SSDs / NVMe for hot logs, and partition aggressively so each shard's write rate stays under the disk's sustained IOPS budget."
      },
      {
        "q": "In distributed transactions, two-phase commit has a killer flaw: the coordinator crashes after collecting every 'yes' vote but before broadcasting the decision. What happens to the participants?",
        "opts": [
          "They time out, roll back independently, and the transaction aborts safely everywhere",
          "They're stuck holding locks — unable to commit or abort without the coordinator",
          "They elect a replacement coordinator by majority vote and complete the commit themselves"
        ],
        "answer": 1,
        "whyWrong": {
          "0": "A prepared participant can't unilaterally abort — the coordinator may have durably decided COMMIT and already told another participant. Aborting locally could split the truth.",
          "2": "Vanilla 2PC has no election. That's what 3PC's pre-commit phase attempts — and it only works assuming bounded network delay, which the real internet refuses to provide."
        },
        "whyCorrect": "After voting yes, a participant is in-doubt: it must hold its locks until it learns the global decision. A dead coordinator means everyone blocks — which is why the coordinator must durably log the decision before notifying anyone, and why sagas trade atomicity for liveness.",
        "bestPractices": "Reach for 2PC only when participants share trusted infrastructure and operations are short. Cross-service, long-running flows want sagas with compensating actions — and sequence the irreversible steps (like emails) last.",
        "lessonId": "distributed-txns"
      },
      {
        "q": "In a 3-node distributed KV store built on Raft consensus, a network partition isolates the leader from the other two nodes. What happens to writes?",
        "opts": [
          "Both sides keep accepting writes and reconcile with last-write-wins when the partition heals",
          "The isolated leader keeps serving writes — it stays leader until explicitly told otherwise",
          "The old leader's side stalls; the two-node majority elects a new leader and keeps accepting writes"
        ],
        "answer": 2,
        "whyWrong": {
          "0": "Last-write-wins reconciliation is the eventual-consistency world. Raft explicitly refuses that trade: a partition can stall writes, but it can never create two conflicting truths.",
          "1": "A Raft leader can't commit anything without a majority acknowledging it. Cut off from both followers, its writes never commit, and it steps down once it can't reach a quorum."
        },
        "whyCorrect": "Raft acknowledges a write only after a majority (2 of 3) holds it. The minority side stops accepting writes; the majority side elects a new leader within seconds and continues — no data loss, no split brain. That's the linearizability etcd and Consul are built on.",
        "bestPractices": "This is exactly what the lab's chaos test verifies with iptables. Also route reads through the leader (or use lease reads) — a lagging follower serving stale reads is the classic Raft footgun.",
        "lessonId": "distributed-kv-store"
      },
      {
        "q": "Your idempotent webhook handler receives an event whose evt_ ID it has already processed. What should it return?",
        "opts": [
          "200 — acknowledge the duplicate and no-op, so the sender stops retrying",
          "409 Conflict — tell the sender explicitly that this event is a duplicate",
          "500 — surface it so on-call can investigate why duplicates are arriving at all"
        ],
        "answer": 0,
        "whyWrong": {
          "1": "Providers treat any non-2xx as a delivery failure — a 409 keeps the redeliveries coming. Duplicates aren't an error condition; at-least-once delivery makes them expected traffic.",
          "2": "Returning 500 on a duplicate creates a retry storm forever: the sender keeps redelivering an event you keep rejecting. A duplicate is normal behavior, not an incident."
        },
        "whyCorrect": "At-least-once is the default webhook contract — the same event WILL arrive twice or thrice. Dedupe with an atomic insert of the event ID under a unique constraint; when the insert collides, return 200 so the sender marks it delivered and goes quiet.",
        "bestPractices": "Order is verify (HMAC, 5-min window), then dedupe, then apply. Make your dedupe window at least as long as the provider's retry budget — Stripe retries for days, so a short Redis TTL leaks duplicates back in.",
        "lessonId": "faang-idempotent-webhooks"
      },
      {
        "q": "You're designing a distributed rate limiter with token buckets. A client idles for an hour, then bursts — and blows straight through its 1,000 req/min budget. Which missing line of code caused it?",
        "opts": [
          "An EXPIRE on the Redis key, so buckets belonging to idle clients get garbage-collected",
          "Clamping tokens to bucket capacity on refill — idle clients can't bank a flood",
          "Rounding elapsed time down to whole seconds before computing the token refill"
        ],
        "answer": 1,
        "whyWrong": {
          "0": "EXPIRE prevents memory leaks from one-shot clients — important for Redis RAM, but a missing TTL doesn't grant anyone extra budget.",
          "2": "Fractional-second refill is fine — continuous refill is exactly what defeats the fixed-window boundary attack. Precision isn't the bug; unbounded accumulation is."
        },
        "whyCorrect": "Refill must be tokens = min(capacity, tokens + elapsed * rate). Without the clamp, 60 idle minutes banks 60,000 tokens the client can burst all at once. Capacity IS the burst budget — tokens above it must be discarded, not saved.",
        "bestPractices": "The lab calls this the most common token-bucket bug in real code reviews. Also run the check-and-decrement inside one Lua script — a GET-then-SET round trip races itself at 100K req/sec across 50 edges.",
        "lessonId": "lab-rate-limiter"
      }
    ]
  },
  "fullstack": {
    "novice": [
      {
        "q": "Why is `<button>` better than `<div onClick>` for an action?",
        "opts": [
          "It gets keyboard focus, Enter/Space activation, and a role for free",
          "Divs cannot receive click handlers",
          "Buttons render faster than divs"
        ],
        "answer": 0,
        "whyCorrect": "A native `<button>` ships with focusability, keyboard activation, and an accessible role built in — a `<div onClick>` has none of those, so screen readers and keyboard users see nothing actionable.",
        "whyWrong": {
          "1": "A `<div>` happily takes an onClick — that's exactly why the trap is so common; it *works* for mouse users while silently excluding everyone else.",
          "2": "Rendering speed is identical — the difference is semantics and accessibility, not performance."
        },
        "bestPractices": "Run the keyboard test: if you can't Tab to it and press Enter, the markup is wrong.",
        "lessonId": "fs-github-actions"
      },
      {
        "q": "With `box-sizing: border-box`, what does `width: 300px` mean?",
        "opts": [
          "The content area alone is 300px; padding and border push the total wider",
          "Content + padding + border + margin total 300px",
          "Content + padding + border total 300px"
        ],
        "answer": 2,
        "whyCorrect": "`border-box` makes `width` the total box including padding and border — the number you actually wanted. That's why the global `*, *::before, *::after { box-sizing: border-box }` reset exists.",
        "whyWrong": {
          "0": "That describes the legacy `content-box` default — the treacherous behavior `border-box` was invented to fix.",
          "1": "Margin is always outside the box in both models; no sizing mode folds it into `width`."
        },
        "bestPractices": "Set `box-sizing: border-box` globally once, at the top of your stylesheet, and never think about it again."
      },
      {
        "q": "When do you reach for CSS Grid instead of Flexbox?",
        "opts": [
          "When rows AND columns need to align across the whole container",
          "Whenever there are more than three children",
          "Only for full-page layouts — flex handles everything inside them"
        ],
        "answer": 0,
        "whyCorrect": "Grid is two-dimensional: it aligns items across both axes of the container, which flex can't do — flex items in one row know nothing about the row below.",
        "whyWrong": {
          "1": "Child count is irrelevant — a nav bar with ten links is still one axis, still flex.",
          "2": "Grid works at any scale, including a small card component; the deciding question is one axis or two, not page vs component."
        },
        "bestPractices": "Flex for components, grid for layouts. When you're not sure, you probably want grid."
      },
      {
        "q": "`const user = { name: 'Ada' }; user.name = 'Grace';` — what happens?",
        "opts": [
          "TypeError — const values are frozen",
          "Legal only in non-strict mode",
          "Legal — const guards the binding, not the value"
        ],
        "answer": 2,
        "whyCorrect": "`const` prevents *rebinding* the variable (`user = {}` throws), but the object it points to stays mutable — mutating a property is perfectly legal.",
        "whyWrong": {
          "0": "That's what `Object.freeze` does — `const` never freezes the value, only the binding.",
          "1": "Strict mode changes nothing here; property mutation on a const-bound object is legal everywhere."
        },
        "bestPractices": "Default to `const`, use `let` only when you must rebind, and never use `var` in new code."
      },
      {
        "q": "Your `fetch` call gets a 500 from the server. What does the Promise do?",
        "opts": [
          "Rejects — your `.catch` handles it",
          "Retries once automatically before rejecting",
          "Resolves normally"
        ],
        "answer": 2,
        "whyCorrect": "`fetch` only rejects on network failure — a 4xx or 5xx is a *successful* HTTP exchange as far as fetch is concerned, so `res.ok` is your job. Forgetting this is the most common bug in a first React app. You must check `res.ok` yourself.",
        "whyWrong": {
          "0": "The catch only fires for network-level failures (DNS, offline, aborted) — an error status code sails straight into your `.then`.",
          "1": "fetch has no retry logic at all; retries come from libraries like React Query, not the platform."
        },
        "bestPractices": "Every fetch wrapper starts with `if (!res.ok) throw new Error(\\`HTTP ${res.status}\\`)` — make it muscle memory."
      },
      {
        "q": "A closure remembers variables from...",
        "opts": [
          "Where the function was defined",
          "Where the function is called",
          "A frozen snapshot taken at definition time"
        ],
        "answer": 0,
        "whyCorrect": "A closure keeps a live reference to the variables in the scope where it was *defined* — that's how `makeCounter`'s inner function keeps incrementing the same `count` across calls. A live link, not a copy.",
        "whyWrong": {
          "1": "Call site is irrelevant — that confusion is about `this` in old-style functions, not closures.",
          "2": "Closures capture *by reference*, not by value — that's exactly why loop counters and stale React state bite."
        },
        "bestPractices": "When a React value seems 'stuck' at an old value inside an effect, suspect a closure capturing stale state.",
        "lessonId": "fs-env-secrets"
      },
      {
        "q": "Screen-reader users skip straight past the nav to the real content because the page's ____ landmark marks where it starts — and there must be exactly one per page.",
        "opts": [
          "`<section>`",
          "`<main>`",
          "`<header>`"
        ],
        "answer": 1,
        "whyCorrect": "`<main>` is the skip-link target and the one-per-page landmark that says 'the actual content starts here' — one keystroke jumps a screen-reader user past all the chrome.",
        "whyWrong": {
          "0": "`<section>` is generic and repeatable — it carries no jump-target role, and a page full of them is just tidier div soup.",
          "2": "`<header>` exposes the `banner` role — it IS the chrome a skip link exists to skip, not the destination."
        },
        "bestPractices": "One `<h1>`, one `<main>`, no skipped heading levels — run the keyboard test before you ship any page.",
        "lessonId": "fs-html-structure"
      }
    ],
    "junior": [
      {
        "q": "An Express middleware runs its logic but never calls `next()` and never responds. What happens to the request?",
        "opts": [
          "Express advances to the next middleware when the function returns",
          "Express throws and routes to the error handler",
          "It hangs until the client times out"
        ],
        "answer": 2,
        "whyCorrect": "Control in the middleware chain is explicit — each middleware either responds or calls `next()`. Do neither and the request just sits there until the client gives up.",
        "whyWrong": {
          "0": "Express never auto-advances; returning from the function without `next()` leaves the chain parked forever.",
          "1": "The error handler only fires on a thrown error or `next(err)` — silently doing nothing triggers nothing."
        },
        "bestPractices": "Every middleware ends in exactly one of two ways: a response, or `next()`. Audit for the third way — neither."
      },
      {
        "q": "A `useEffect` with an empty `[]` deps array reads a prop inside its body. What's the bug?",
        "opts": [
          "The effect re-runs on every render anyway",
          "React automatically adds the prop to the deps for you",
          "The effect captured a stale closure"
        ],
        "answer": 2,
        "whyCorrect": "`[]` means run once, and the effect closes over whatever the prop was on that first render — future prop changes never reach it. This is the classic stale-closure trap the exhaustive-deps lint exists to catch. The prop is frozen at its first-render value.",
        "whyWrong": {
          "0": "Empty array genuinely means once — the problem isn't extra runs, it's the frozen value inside the one run.",
          "1": "React never edits your deps array; the lint rule *warns* you, but the code ships broken if you ignore it."
        },
        "bestPractices": "Trust the exhaustive-deps lint. If a dep makes the effect run too often, fix the dep's stability (useRef, functional setters), don't delete it."
      },
      {
        "q": "Your POST endpoint creates a new user. Which response is the contract?",
        "opts": [
          "`200 OK` with the user in the body",
          "`204 No Content` — creation implies nothing to return",
          "`201 Created` with a `Location` header pointing at the new resource"
        ],
        "answer": 2,
        "whyCorrect": "`201` says something new exists, and the paired `Location` header tells the client exactly where to find it — clients can follow it without parsing your body shape.",
        "whyWrong": {
          "0": "`200` works but wastes the signal — clients can't distinguish 'created' from 'read', and you skip the Location convention.",
          "1": "`204` is for operations with genuinely nothing to say, like DELETE — a create has a new resource to point at."
        },
        "bestPractices": "Pair every `201` with a `Location` header; return `204` from DELETE with no body."
      },
      {
        "q": "Why does event delegation attach ONE listener to a parent instead of N listeners on children?",
        "opts": [
          "Events bubble up, so the parent sees them all and `event.target` identifies which child fired",
          "Listeners on children inside lists don't fire reliably",
          "The capture phase requires a parent-level listener"
        ],
        "answer": 0,
        "whyCorrect": "Bubbling carries every child's event up through the parent, so one listener plus `e.target.closest('.row')` handles thousands of items with zero extra memory and no per-row teardown.",
        "whyWrong": {
          "1": "Child listeners fire fine — the problem is N registrations, N teardowns, and N leaks if you forget one, not reliability.",
          "2": "Delegation rides the *bubble* phase; capture is the top-down phase you rarely need."
        },
        "bestPractices": "One listener at the root beats a thousand at the leaves — and `closest()` beats manual parent-walking loops.",
        "lessonId": "fs-dom-events"
      },
      {
        "q": "What's the core win of 'parse, don't validate' with a schema (Zod) at the route edge?",
        "opts": [
          "The output is either a typed value you can trust or a structured 400 — no half-valid states reach your handler",
          "Schema parsing runs faster than manual if-checks",
          "It makes database constraints unnecessary"
        ],
        "answer": 0,
        "whyCorrect": "The schema turns an unknown blob into trusted, typed data before it touches a DB or queue — downstream code sheds all its defensive `if (!email)` clutter because invalid input already became a 400.",
        "whyWrong": {
          "1": "Speed isn't the point (a schema parse costs about the same) — the point is eliminating 'maybe valid' states.",
          "2": "DB constraints stay as the last line of defense; edge validation is the *first* line, not a replacement."
        },
        "bestPractices": "Define the schema once and reuse it across request, DB, and response — a changed field then breaks loudly everywhere until consistent."
      },
      {
        "q": "You want only users with 5 or more posts in a grouped query. Where does that filter go?",
        "opts": [
          "`HAVING count(p.id) >= 5`",
          "`WHERE count(p.id) >= 5`",
          "Either — WHERE and HAVING are interchangeable with aggregates"
        ],
        "answer": 0,
        "whyCorrect": "`WHERE` filters rows *before* grouping; `HAVING` filters groups *after* aggregation — a condition on `count()` can only exist once groups exist, so it must be HAVING.",
        "whyWrong": {
          "1": "Postgres rejects aggregates in WHERE outright, because WHERE runs before GROUP BY has produced anything to count.",
          "2": "They run at different stages of execution and are never interchangeable — mixing them up is how dashboards lie."
        },
        "bestPractices": "Read queries in execution order — FROM, WHERE, GROUP BY, HAVING, SELECT, ORDER BY — and most 'why didn't my filter work' bugs dissolve."
      },
      {
        "q": "You curl a POST with a JSON body but forget the `Content-Type: application/json` header. What does `req.body` contain?",
        "opts": [
          "Nothing useful",
          "The parsed object — Express sniffs the body format",
          "Express returns 415 Unsupported Media Type automatically"
        ],
        "answer": 0,
        "whyCorrect": "`express.json()` keys off the Content-Type header; without it the parser skips the body entirely and `req.body` arrives undefined/empty. `express.json()` only parses when the header matches.",
        "whyWrong": {
          "1": "There's no content sniffing — the middleware trusts the header, full stop.",
          "2": "Express does nothing automatic here; your handler just sees a missing body and probably 400s for the wrong reason."
        },
        "bestPractices": "When an API 'ignores' your payload, check the Content-Type header before anything else — `curl -i` shows you both sides."
      },
      {
        "kind": "order",
        "q": "Order what happens when a user submits a form in a modern full-stack app — click to updated UI.",
        "items": [
          "preventDefault stops the full-page reload",
          "fetch POSTs the JSON to the API",
          "The server validates the input at the boundary",
          "The database insert runs with parameterized SQL",
          "The UI re-renders from the API's response"
        ],
        "whyWrong": "Trusting client-side validation and skipping the server check is the ordering mistake that becomes a security hole — the browser's checks are a courtesy, the server's are the law. The DOM updates LAST, from the response, never optimistically-and-forgotten.",
        "whyCorrect": "Intercept → send → validate → persist → re-render. The database is the source of truth; the UI is a projection of the response.",
        "bestPractices": "Validate twice on purpose: client-side for fast feedback, server-side for safety. They're different jobs, not duplication."
      },
      {
        "kind": "order",
        "q": "Order a password-auth flow — from a new user signing up to their first authorized request.",
        "items": [
          "User submits email + password over HTTPS",
          "The server hashes the password with a salt",
          "The hash (never the password) is stored",
          "Login compares a fresh hash against the stored one",
          "A session cookie authorizes later requests"
        ],
        "whyWrong": "Storing before hashing — even 'temporarily' — is the breach headline. And comparing plaintext at login means you stored plaintext somewhere; the comparison must be hash-to-hash.",
        "whyCorrect": "Transport encrypted → hash with salt → store the hash → compare hashes → session carries the proof. The plaintext password exists only in transit and in memory, never at rest.",
        "bestPractices": "Use a purpose-built KDF (bcrypt/argon2), not a fast hash — the slowness is the security feature."
      },
      {
        "kind": "order",
        "code": true,
        "q": "Order the lines of a minimal Express server. Remember: requests walk the chain in registration order.",
        "items": [
          "const app = express();  // the app IS the middleware chain",
          "app.use(express.json());  // parses JSON bodies into req.body",
          "app.get('/health', (_req, res) => res.json({ ok: true }));",
          "app.use((err, _req, res, _next) => res.status(500).json({ error: 'server_error' }));",
          "app.listen(3000);"
        ],
        "whyWrong": "Register `express.json()` after the routes and every handler reads an undefined `req.body`. Put the 4-arg error handler before the routes and it catches nothing — errors route DOWN the chain, never back up.",
        "whyCorrect": "Create the app, register the body parser before any route that reads `req.body`, routes next, the 4-arg error handler after everything it must catch, and `listen()` once the chain is complete. Registration is routing.",
        "bestPractices": "Read any Express file top to bottom as the request's journey: parser, logger, routes, error handler, listen. If the order surprises you, the bugs will too.",
        "lessonId": "fs-node-express"
      },
      {
        "kind": "order",
        "code": true,
        "q": "Order the body of a `useEffect` fetch that can never set state on an unmounted component.",
        "items": [
          "const ctrl = new AbortController();  // one controller per effect run",
          "fetch(`/api/users/${id}`, { signal: ctrl.signal })",
          "  .then((res) => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json(); })",
          "  .then(setData)",
          "return () => ctrl.abort();  // cleanup cancels the in-flight request"
        ],
        "whyWrong": "Wiring `ctrl.signal` into fetch before the controller exists is a ReferenceError. Parsing JSON before the `res.ok` gate 'succeeds' on error pages. And an abort that isn't the returned cleanup never runs — the ghost-state leak stays.",
        "whyCorrect": "Acquire the controller first so fetch can borrow its signal, gate on `res.ok` before parsing (fetch never rejects on 4xx/5xx), hand only trusted data to `setData`, and return the abort as the cleanup — React calls it on unmount or id change.",
        "bestPractices": "Acquire before use, release in cleanup — every effect that starts something must return the function that stops it. Written this hook three times? Switch to React Query.",
        "lessonId": "fs-fetch-from-react"
      },
      {
        "q": "An HTTP method is ____ when calling it N times leaves the same end state as calling it once — the promise that lets a client retry on timeout without double-charging the card.",
        "opts": [
          "idempotent",
          "cacheable",
          "stateless"
        ],
        "answer": 0,
        "whyCorrect": "Idempotency is the retry contract: PUT and DELETE promise the same end state no matter how many times they land, so a timed-out client can safely resend. POST makes no such promise — that's the double-charge risk.",
        "whyWrong": {
          "1": "Cacheable follows from *safe* methods like GET (no state change at all) — a DELETE is idempotent but you'd never cache it.",
          "2": "Stateless describes servers that keep no memory between requests — a property of the architecture, not of a method's retry behavior."
        },
        "bestPractices": "Honor the verb contract and retries, caching, and predictability come free — a POST that quietly behaves like a PUT breaks every client that trusted the method.",
        "lessonId": "fs-rest-routes"
      },
      {
        "q": "`router.delete('/:id', (req, res) => {`\n`  users.delete(req.params.id);  // users is a Map keyed by numeric id`\n`  res.status(204).end();`\n`});` — the DELETE returns 204 every time, but the user is still there. What's wrong?",
        "opts": [
          "`req.params.id` is a string but the Map keys are numbers, so `delete` silently misses — cast with `Number()` first",
          "`res.status(204).end()` closes the response before the Map delete flushes, so the mutation is dropped",
          "Route params like `/:id` only match on GET requests, so this DELETE handler never actually runs"
        ],
        "answer": 0,
        "whyCorrect": "URL params are ALWAYS strings — `'42' !== 42`, so `Map.delete('42')` on a number-keyed Map removes nothing and returns false. The 204 still fires because nothing checked the result. Cast carefully at every param boundary.",
        "whyWrong": {
          "1": "`Map.delete` is synchronous — it fully completes before the next line runs; there is no flush or race to lose.",
          "2": "Params match on every method — `router.delete('/:id')` runs fine; the request reaches the handler and fails quietly inside it."
        },
        "bestPractices": "Treat every `req.params` and `req.query` value as a string until you've cast it — or let a schema coerce it at the edge so handlers never see raw params.",
        "lessonId": "fs-rest-routes"
      }
    ],
    "senior": [
      {
        "q": "A `/users` list page that also shows each user's posts takes 3 seconds. What's the right first move?",
        "opts": [
          "Confirm and fix the N+1 with eager-loading first, then `EXPLAIN ANALYZE` and index the FK",
          "Add indexes to every column on the posts table",
          "Raise the DB connection pool size so the queries run in parallel"
        ],
        "answer": 0,
        "whyCorrect": "Round-trip count and per-query speed are different problems, fixed in that order — a perfect index on a query you run N times is still N round trips. Collapse the N+1 with a JOIN or ORM `include`, then let EXPLAIN tell you if the remaining query needs an index.",
        "whyWrong": {
          "1": "Blanket indexing taxes every write and doesn't touch the real bottleneck: N separate network hops.",
          "2": "Parallelizing N+1 queries hides the symptom while multiplying DB load — the structural fix is one query, not fifty concurrent ones."
        },
        "bestPractices": "Diagnose by counting queries in the log, not by guessing. Your slow page is usually N+1; your second-slowest is a missing FK index."
      },
      {
        "q": "Why not add an index to every column 'just in case'?",
        "opts": [
          "Every INSERT and UPDATE must maintain every index touching the changed column — reads get faster, writes pay for it",
          "Postgres limits how many indexes a table can carry",
          "B-tree indexes only work on primary key columns"
        ],
        "answer": 0,
        "whyCorrect": "Indexes are a read/write trade: five indexes on a hot table turns every write into six disk writes. Index foreign keys and the columns hot queries filter or sort on — and measure with `EXPLAIN ANALYZE` before adding more.",
        "whyWrong": {
          "1": "There's no meaningful cap — the cost is per-write maintenance, not a hard limit.",
          "2": "You can index any column; PRIMARY KEY and UNIQUE just happen to get one for free."
        },
        "bestPractices": "A 'Seq Scan' in EXPLAIN on a big table means no usable index; on a tiny table it means the index would have been pure write cost."
      },
      {
        "q": "You add `WHERE p.published = true` to a query that LEFT JOINs users to posts. What actually happens?",
        "opts": [
          "The LEFT JOIN is silently demoted to INNER",
          "Nothing changes semantically — it just filters earlier",
          "Postgres raises an error because WHERE can't reference the right table of a LEFT JOIN"
        ],
        "answer": 0,
        "whyCorrect": "For matchless users the right side is all NULLs, so `p.published = true` evaluates false and the row is filtered out — exactly the rows the LEFT JOIN existed to keep. Put the condition in the JOIN's ON clause instead. Users with zero posts vanish from the result.",
        "whyWrong": {
          "1": "The semantics change completely — zero-post users disappear, which is how half of all dashboard undercounts happen.",
          "2": "It's perfectly legal SQL, which is what makes the bug so quiet."
        },
        "bestPractices": "On a LEFT JOIN, conditions about the right table belong in `ON`, conditions about the left table belong in `WHERE`."
      },
      {
        "q": "A user clicks logout, but your auth is a self-contained JWT. What's the honest situation?",
        "opts": [
          "Delete the token server-side and it's revoked",
          "You can't un-issue it",
          "Rotate the signing secret to invalidate that one user's token"
        ],
        "answer": 1,
        "whyCorrect": "The token IS the state, signed and self-contained — the server has nothing to delete. That's why the practical compromise is short-lived access tokens (5–15 min) plus a revocable refresh token in the DB. You wait for `exp` or keep a blocklist, which is just stateful sessions in disguise.",
        "whyWrong": {
          "0": "There's no server-side row to delete — that's the session model, and it's exactly the property JWTs traded away for statelessness.",
          "2": "Rotating the secret invalidates *every* user's token at once — a global logout, not a targeted one."
        },
        "bestPractices": "Default to sessions for first-party web apps; if you must use JWTs, pair a short-TTL access token with a DB-backed refresh token so logout isn't a lie."
      },
      {
        "q": "Why is SHA-256 the wrong tool for password storage even with a salt?",
        "opts": [
          "SHA-256 output is too short to be secure",
          "It's too fast",
          "SHA-256 is reversible with enough compute"
        ],
        "answer": 1,
        "whyCorrect": "Password hashing must be *intentionally slow* — bcrypt, Argon2, and scrypt all take a tunable work factor precisely so each guess costs real money. Speed, not output size, is the vulnerability. GPUs try billions of hashes per second, so a leaked DB gets cracked overnight.",
        "whyWrong": {
          "0": "256 bits is plenty of output; the problem is how cheaply an attacker can compute candidates.",
          "2": "SHA-256 isn't reversible — attackers don't reverse it, they brute-force forward at GPU speed, which fast hashes make economical."
        },
        "bestPractices": "bcrypt cost 12+ or Argon2id, use the library's `compare` (timing-safe), and re-hash on login when the stored cost is below your floor.",
        "lessonId": "fs-password-hashing"
      },
      {
        "q": "In cache-aside, why does `updateUser` DELETE the Redis key instead of overwriting it with the new value?",
        "opts": [
          "DEL is a cheaper Redis operation than SET",
          "Overwriting risks caching a half-updated object",
          "Redis refuses to overwrite keys that carry a TTL"
        ],
        "answer": 1,
        "whyCorrect": "The DB is the source of truth; writing your patched object back to the cache risks shipping an incomplete or stale composite. Delete-and-refill keeps consistency biased toward the DB. Deleting lets the next reader refill from the canonical DB row.",
        "whyWrong": {
          "0": "The op costs are negligible either way — this is a correctness decision, not a performance one.",
          "2": "Redis happily overwrites keys with TTLs; nothing stops you except the consistency bug you'd be buying."
        },
        "bestPractices": "Cache-aside recipe: short TTL as a staleness budget, delete on write, and a single-flight wrapper on hot keys so one DB query serves N concurrent misses."
      },
      {
        "q": "You change `NEXT_PUBLIC_API_URL` in the platform dashboard, restart the app, and nothing changes. Why?",
        "opts": [
          "Env var names are case-sensitive and the dashboard lowercased it",
          "Public-prefixed vars are inlined into the JS bundle at build time — only a redeploy rebuilds it",
          "The CDN is serving a cached copy of the old env file"
        ],
        "answer": 1,
        "whyCorrect": "`NEXT_PUBLIC_`/`VITE_` prefixed vars are baked into the client bundle when the build runs — changing them afterwards does nothing until you rebuild. Runtime vars like `DATABASE_URL` are the ones a restart picks up.",
        "whyWrong": {
          "0": "Casing isn't the issue — the layer is: build-time values live in the artifact, not the environment.",
          "2": "There's no env file being served; the old value is compiled into the JavaScript itself."
        },
        "bestPractices": "Know each var's layer before you touch it — and never put a secret behind a public prefix, because it ships to every browser."
      },
      {
        "q": "A migration that already ran in prod turns out to be wrong. What does a mature team do?",
        "opts": [
          "Run the down migration to undo it",
          "Write the NEXT migration that reverses the change — roll forward only",
          "Hand-edit prod with `ALTER TABLE` and update the migration file to match"
        ],
        "answer": 1,
        "whyCorrect": "Down migrations exist in docs and almost never in practice — they're hard to write correctly and harder to test. The fix is a new forward migration, committed and deployed through the same pipeline as everything else.",
        "whyWrong": {
          "0": "Rolling back an applied migration in prod is exactly the untested path that turns one incident into two.",
          "2": "Hand-editing prod breaks the versioned history, and editing an applied migration file causes checksum drift that fails the next deploy."
        },
        "bestPractices": "The DB is a ratchet, not a yo-yo: every change is a migration, `db push` never touches prod, and applied migration files are immutable.",
        "lessonId": "fs-orm-migrations"
      },
      {
        "q": "A ____ is an app-wide secret kept OUT of the database — if the users table leaks but this doesn't, every stolen hash is useless to the attacker.",
        "opts": [
          "salt",
          "work factor",
          "pepper"
        ],
        "answer": 2,
        "whyCorrect": "The pepper lives in env or KMS, never beside the hashes — so a DB-only breach hands the attacker hashes they can't even start guessing against. It's defense-in-depth on top of the salt, not a replacement.",
        "whyWrong": {
          "0": "The salt is stored ALONGSIDE each hash — it defeats rainbow tables, but it leaks with the database by design.",
          "1": "The work factor is a public cost knob embedded right in the hash string (`$2b$12$...`) — it slows guessing, it hides nothing."
        },
        "bestPractices": "Salt per user (the library handles it), pepper per app (env/KMS, never git, never the DB), work factor cranked until a hash costs ~250ms.",
        "lessonId": "fs-password-hashing"
      },
      {
        "q": "Login check: `if (stored === await bcrypt.hash(body.password, 12)) return ok();` — it rejects every correct password. What's wrong?",
        "opts": [
          "`===` compares the hashes in non-constant time, so the check leaks timing and intermittently rejects valid logins",
          "`bcrypt.hash` picks a fresh random salt every call, so it can never reproduce the stored hash — use `bcrypt.compare`",
          "The cost `12` passed at login differs from the cost embedded in the stored hash, so the two outputs never match"
        ],
        "answer": 1,
        "whyCorrect": "`bcrypt.hash` generates a new random salt each time, so hashing the same password twice yields two different strings — the equality is false even for the right password. `bcrypt.compare` reads the salt out of the stored hash and re-derives with it.",
        "whyWrong": {
          "0": "Timing side-channels leak information to an attacker — they never make `===` return the wrong boolean. The compare is wrong for a different reason.",
          "2": "The cost lives inside the stored hash string and `compare` reads it from there — mismatched costs are exactly the case the format was designed to survive."
        },
        "bestPractices": "Use the library's `hash` and `compare`, never string equality — and return the same 401 for unknown email and wrong password so nobody can enumerate users.",
        "lessonId": "fs-password-hashing"
      }
    ],
    "distinguished": [
      {
        "q": "A JWT verifier is configured with `algorithms: ['HS256', 'RS256']`. What's the risk?",
        "opts": [
          "Algorithm confusion",
          "Only performance — RS256 verification is slower than HS256",
          "None — accepting more algorithms just improves compatibility"
        ],
        "answer": 0,
        "whyCorrect": "When the verifier accepts multiple algorithm families, an attacker can exploit the mismatch between how HS256 and RS256 keys are used — the same class of real-world CVE as `alg: none`. Pinning one algorithm (as an explicit array of one) is the defense, and it's the exact footgun PASETO removes by versioning the crypto so there's no `alg` field to swap. Letting the token pick between symmetric and asymmetric verification is a classic CVE; pin exactly one.",
        "whyWrong": {
          "1": "The cost is a forged-token vulnerability, not milliseconds.",
          "2": "Flexibility here IS the attack surface — the token should never get a vote on how it's verified."
        },
        "bestPractices": "Pin the algorithm at sign AND verify, check `iss`/`aud`, and never leak which validation step failed in the 401."
      },
      {
        "q": "A logged-in user's browser is tricked into POSTing to your API from evil.com. Your CORS allowlist is strict. Are you protected?",
        "opts": [
          "Yes — the allowlist blocks the cross-origin request",
          "No — CORS only stops evil.com from READING the response; the state-changing POST still fires with cookies unless SameSite or a CSRF token stops it",
          "Yes, as long as helmet is also installed"
        ],
        "answer": 1,
        "whyCorrect": "CORS is a browser rule about who can read responses — it doesn't prevent the request from being sent, and the browser attaches your cookies regardless. The actual defense against cross-site writes is `SameSite=Lax/Strict` cookies or a CSRF token; the whole defense-in-depth stack has this deliberate gap.",
        "whyWrong": {
          "0": "This is the single most common CORS misconception — it's a read gate, not a send gate, and it does nothing against curl or another server either.",
          "2": "Helmet sets response headers against clickjacking and sniffing; it has no opinion about request forgery."
        },
        "bestPractices": "Auth cookies get `HttpOnly` + `Secure` + `SameSite=Lax` as the floor — and GET endpoints that mutate state are a bug no cookie attribute can save."
      },
      {
        "q": "You build chat fanout on Redis classic Pub/Sub — one channel per group, PUBLISH on send. What's the dominant failure mode?",
        "opts": [
          "Latency — Pub/Sub delivery is multi-second at scale",
          "It's fire-and-forget",
          "Redis caps the number of channels well below your group count"
        ],
        "answer": 1,
        "whyCorrect": "Classic Pub/Sub delivers to currently-connected subscribers and immediately forgets — lossy by design. For chat that's catastrophic on every reconnect; the durable options are Redis Streams (consumer groups + checkpointing) or Kafka partitioned by conversation. A subscriber whose connection blips for 200ms misses those messages permanently — no durability, no replay.",
        "whyWrong": {
          "0": "Pub/Sub is very fast — speed was never the problem; amnesia is.",
          "2": "Channel count isn't the constraint; the missing property is persistence."
        },
        "bestPractices": "Durable log as the backbone, ephemeral push as the hot path — and let reconnecting clients catch up via per-conversation cursors, not full refetches."
      },
      {
        "q": "For 200-member group chats with forever retention, why does per-user inbox fanout (push-at-write) lose to a shared conversation log?",
        "opts": [
          "Push-at-write makes reads cheap but one send becomes 200 writes, and storage scales with messages × group size — so push live delivery, pull history from one log",
          "Pull-at-read is strictly better because writes are the only cost that matters",
          "Per-user inboxes can't preserve message ordering"
        ],
        "answer": 0,
        "whyCorrect": "It's write amplification vs read amplification: per-user inboxes blow storage 200x under forever-retention, while a single append-only log per conversation costs one write per message. Real systems go hybrid — push to live members' sockets, pull scrollback from the shared log.",
        "whyWrong": {
          "1": "Pure pull makes every history open expensive and needs per-user cursors — the answer is matching the pattern to bounded fanout with unbounded history, not picking one absolutely.",
          "2": "Ordering is solved by sortable IDs (ULID/TIMEUUID) in either model; the killer is the 200x storage multiplier."
        },
        "bestPractices": "Partition by the entity that defines the query, cluster by the dimension you paginate on — get it wrong and every read is scatter-gather."
      },
      {
        "q": "Which caching pattern trades durability for throughput, and what does that cost you when it goes wrong?",
        "opts": [
          "Write-through — writes are durable but reads slow down",
          "Write-back — the app writes to cache and the DB is written async, so a cache crash before the flush means the mutations are simply gone",
          "Write-around — the cache is skipped on writes, so a crash loses the cached reads"
        ],
        "answer": 1,
        "whyCorrect": "Write-back acknowledges the write once it's in the cache and persists to the DB later — huge throughput, but the durability window between ack and flush is real data loss if the cache dies first.",
        "whyWrong": {
          "0": "Write-through is the opposite trade: writes go synchronously through cache to DB, so they're durable but your write latency inherits the DB's.",
          "2": "Write-around loses nothing on a crash — its cost is merely that the first read after every write is a guaranteed miss."
        },
        "bestPractices": "Pick the pattern whose failure mode you can survive: a cache-aside Redis crash costs latency, never data; a write-back crash costs the data itself.",
        "lessonId": "fs-caching-strategies"
      },
      {
        "q": "You drop a database column in the same deploy where the code stops reading it. What breaks?",
        "opts": [
          "Nothing — the migration and the code ship atomically",
          "Old pods still running the previous code query the dropped column mid-rollout and crash",
          "Postgres blocks the DROP while any connection has the table open"
        ],
        "answer": 1,
        "whyCorrect": "Deploys aren't atomic across a fleet — the migration lands while old-code pods are still serving traffic, and their SELECTs against the vanished column throw until the rollout completes. Stop using the column in one deploy, drop it in a later one.",
        "whyWrong": {
          "0": "There's no atomicity between a schema change and a rolling code deploy — that gap is the entire hazard.",
          "2": "Postgres takes a lock for the DDL moment but happily drops the column; the stale queries fail afterwards, not the DROP."
        },
        "bestPractices": "Schema changes ship in expand/contract order: add-and-dual-write first, migrate readers, remove last — every step compatible with the code one deploy behind."
      },
      {
        "q": "Why does every serious WebSocket server (Slack, Discord) send a ping/pong heartbeat every ~30 seconds?",
        "opts": [
          "To keep per-message latency low on idle connections",
          "To detect half-open connections",
          "The WebSocket spec requires a keepalive to hold the upgrade"
        ],
        "answer": 1,
        "whyCorrect": "Intermediaries kill idle TCP connections without telling either side — the client thinks it's connected, the server has forgotten it, and messages silently stop flowing. A missed pong lets you `terminate()` and trigger reconnection; it's the single most common production WebSocket bug. Proxies, mobile NAT, and LB idle timeouts silently drop the TCP link while neither end's socket object notices.",
        "whyWrong": {
          "0": "Heartbeats don't make delivery faster — they make dead connections *detectable*.",
          "2": "The spec defines ping/pong frames but mandates no cadence; the 30s rhythm is operational self-defense, not compliance."
        },
        "bestPractices": "Heartbeat is non-negotiable even in v1 — and pair it with at-least-once thinking: clients resend on reconnect, so both ends dedupe by a client-generated message ID."
      }
    ]
  },
  "cybersec": {
    "novice": [
      {
        "q": "A DDoS attack takes your checkout API offline for four hours. Which leg of the CIA triad did it break?",
        "opts": [
          "Confidentiality",
          "Integrity",
          "Availability"
        ],
        "answer": 2,
        "whyCorrect": "Denial of service maps to Availability — the data isn't stolen or tampered with, it's simply not there when needed. That's why DDoS is a security event, not just an ops problem.",
        "whyWrong": {
          "0": "Nothing was disclosed — the attacker never saw the data, they just made it unreachable.",
          "1": "The data wasn't modified; a flood attack leaves every record intact but unreachable."
        },
        "bestPractices": "For any attack or control, always ask which of the three legs it touches — if it maps to none, you're protecting nothing."
      },
      {
        "q": "Authentication answers which question?",
        "opts": [
          "Are you allowed to do that?",
          "Who are you?",
          "Is the connection encrypted?"
        ],
        "answer": 1,
        "whyCorrect": "Authn is the bouncer checking your ID — it produces an identity (user ID, claims) and nothing more. What that identity may do is a separate decision made by the policy layer.",
        "whyWrong": {
          "0": "That's authorization — the policy layer decides allow/deny on a resource, and it runs on every request, not once at login.",
          "2": "Encryption in transit is TLS's job — a separate concern from establishing who is on the other end."
        },
        "bestPractices": "Keep the two gates separate in code: an authn dependency that returns identity or 401, an authz check that returns allow/deny or 403.",
        "lessonId": "sec-authn-vs-authz"
      },
      {
        "q": "What makes a cryptographic hash different from encryption?",
        "opts": [
          "A hash is one-way",
          "A hash uses a public/private key pair",
          "A hash is just faster encryption"
        ],
        "answer": 0,
        "whyCorrect": "A hash turns any input into a fixed-size fingerprint with no way back. That's why it's used for integrity checks — and why it's the wrong tool when you ever need the data back. You can't recover the input from the output.",
        "whyWrong": {
          "1": "Key pairs belong to asymmetric encryption (RSA, Ed25519). Hashing uses no key at all — same input, same fingerprint, every time.",
          "2": "Encryption is reversible with the key; a hash is designed to be irreversible. Speed isn't the distinction — direction is."
        },
        "bestPractices": "Pick the family by the job: hash for fingerprints, symmetric for bulk data, asymmetric for key exchange and signatures.",
        "lessonId": "sec-kms-encryption"
      },
      {
        "q": "What is the actual fix for SQL injection?",
        "opts": [
          "Strip quote characters from user input",
          "Encrypt the database at rest",
          "Parameterized queries"
        ],
        "answer": 2,
        "whyCorrect": "Parameterization sends the SQL and the values separately, so user input can never rewrite the query's structure. Every SQLi is the same bug: input that should have been data got parsed as code. Input is bound as data, never parsed as code.",
        "whyWrong": {
          "0": "Blocklist sanitization always has a bypass — hex encodings and Unicode tricks defeat naive quote filters. Parameterize instead.",
          "1": "Encryption at rest protects against a stolen disk. The injected query runs with the app's own credentials and gets decrypted data like any legitimate query."
        },
        "bestPractices": "Treat every raw/f-string escape hatch in your ORM (raw(), extra(), cursor.execute) as a hand-rolled query and audit it like one.",
        "lessonId": "sec-sqli"
      },
      {
        "q": "You accidentally pushed an API key to a public GitHub repo. What's the correct response?",
        "opts": [
          "Rotate the key immediately and assume it leaked",
          "Delete the file and force-push",
          "Make the repository private"
        ],
        "answer": 0,
        "whyCorrect": "A secret in git is forever — thirty seconds of public exposure is enough, since bots scrape new commits within minutes. Rotate first; investigate after.",
        "whyWrong": {
          "1": "Git is content-addressed and append-only — the blob lives on in history, every clone, and every fork. git rm doesn't un-leak it.",
          "2": "Too late — the secret was already public, and scrapers move faster than you do. Privacy going forward doesn't erase the past."
        },
        "bestPractices": "Add a pre-commit scanner (gitleaks, truffleHog) so secrets are caught before push, not after.",
        "lessonId": "sec-ir-playbook"
      },
      {
        "q": "Where does an XSS payload actually execute?",
        "opts": [
          "On the web server",
          "In the victim's browser",
          "Inside the database"
        ],
        "answer": 1,
        "whyCorrect": "XSS is attacker-controlled data rendered as executable code in someone else's browser — reflected off a URL, stored in your DB and served to every viewer, or injected purely in the DOM.",
        "whyWrong": {
          "0": "The server just stores or reflects the string — the damage happens when a browser renders it as markup and runs the script.",
          "2": "Stored XSS sits in the DB as inert text; it only becomes dangerous when rendered into a page context that interprets it as code."
        },
        "bestPractices": "Encode for the destination context (HTML body, attribute, JS string, URL) instead of trying to sanitize the source — each context needs different encoding."
      }
    ],
    "junior": [
      {
        "q": "`GET /api/orders/42` returns Alice's order to logged-in Bob. What's the root failure?",
        "opts": [
          "Weak session encryption",
          "No server-side ownership check on the order row",
          "Missing rate limiting"
        ],
        "answer": 1,
        "whyCorrect": "This is the IDOR: the app authenticated Bob flawlessly and then treated his valid session as a permission slip. Authorization must run on every request, against the specific resource.",
        "whyWrong": {
          "0": "The session works fine — Bob authenticated correctly. The bug is that nobody asked whether this row belongs to him.",
          "2": "Rate limiting slows enumeration but doesn't stop it — a single unauthorized read is already the breach."
        },
        "bestPractices": "Check ownership server-side on every read AND mutation — broken access control is OWASP #1 for a reason."
      },
      {
        "q": "Why is plain SHA-256 the wrong tool for storing passwords?",
        "opts": [
          "SHA-256 is cryptographically broken",
          "Its output is too short to be secure",
          "It's too fast"
        ],
        "answer": 2,
        "whyCorrect": "Passwords are low-entropy human strings, so the defense is making each guess expensive. bcrypt (cost ≥ 12) and Argon2id are deliberately slow, salted, and memory-hard to frustrate GPU/ASIC attackers. GPUs crack low-entropy passwords in milliseconds.",
        "whyWrong": {
          "0": "SHA-256 is fine for integrity and fingerprints — it's not broken, it's mis-applied. The problem is speed, not weakness.",
          "1": "256 bits is plenty. The attacker isn't reversing the hash — they're guessing inputs at GPU speed, and a fast hash lets them."
        },
        "bestPractices": "Use Argon2id for new systems (the OWASP recommendation) and re-hash on login when cost parameters have drifted upward.",
        "lessonId": "sec-project-vault"
      },
      {
        "q": "Why does TLS use asymmetric crypto only to set up the connection, then switch to symmetric?",
        "opts": [
          "Asymmetric is too slow for bulk data — it's only used to agree on a session key",
          "Symmetric encryption is mathematically stronger, so it protects the real data",
          "Symmetric keys can be rotated mid-session without a fresh handshake"
        ],
        "answer": 0,
        "whyCorrect": "Asymmetric math is expensive per byte, so TLS uses it to negotiate a fresh symmetric session key, then encrypts the actual traffic with fast AEAD ciphers — all three crypto families working together.",
        "whyWrong": {
          "1": "It's not about strength — both are strong when used correctly. It's a performance division of labor.",
          "2": "Session keys are ephemeral by design, but that's a consequence of the handshake, not the reason for the split."
        },
        "bestPractices": "Remember the pattern: asymmetric for key exchange and signatures, symmetric for bulk bytes, hashing for integrity."
      },
      {
        "q": "Chrome defaulting cookies to `SameSite=Lax` mostly killed classic CSRF. Why?",
        "opts": [
          "The browser stops attaching the session cookie to cross-site POSTs",
          "Lax encrypts the cookie so other sites can't read it",
          "Lax blocks all requests from other origins"
        ],
        "answer": 0,
        "whyCorrect": "CSRF works because the browser helpfully attaches your cookies to requests triggered by other sites. Lax withholds the cookie on cross-site POSTs, so the forged transfer arrives unauthenticated.",
        "whyWrong": {
          "1": "SameSite has nothing to do with encryption or reading — it only controls when the browser *sends* the cookie.",
          "2": "Cross-site requests still happen — top-level GET navigations still carry the cookie under Lax. Only cookie attachment on cross-site POSTs is cut."
        },
        "bestPractices": "Set SameSite explicitly on every session cookie, and watch for GET endpoints with side effects — Lax still allows those across sites.",
        "lessonId": "sec-csrf"
      },
      {
        "q": "An attacker submits `http://169.254.169.254/latest/meta-data/...` to your image-preview endpoint. What are they after?",
        "opts": [
          "The instance's temporary IAM credentials",
          "A denial of service on your fetcher",
          "Your DNS records"
        ],
        "answer": 0,
        "whyCorrect": "That's SSRF against the EC2 metadata service, which hands back the instance role's IAM credentials — the exact chain behind the Capital One 2019 breach (106M records).",
        "whyWrong": {
          "1": "One GET won't hurt your fetcher — the payoff is what comes back in the response body.",
          "2": "169.254.169.254 isn't DNS — it's the link-local EC2 metadata endpoint, invisible from the internet but one GET away from your app."
        },
        "bestPractices": "Enforce IMDSv2 with hop-limit 1 on every instance, and validate resolved IPs against RFC1918 + link-local ranges before fetching any user-supplied URL."
      },
      {
        "q": "What does committing a lockfile and installing with `npm ci` actually buy you?",
        "opts": [
          "A smaller node_modules containing only production dependencies",
          "Every install automatically pulls in the latest security patches",
          "Every install gets the exact pinned versions, verified by hash"
        ],
        "answer": 2,
        "whyCorrect": "The lockfile resolves every dependency — including transitive ones — to one exact version and SHA hash; `npm ci` installs that graph byte-for-byte and fails the build on a hash mismatch. Without it, tomorrow's build pulls different bytes than today's.",
        "whyWrong": {
          "0": "Size is unchanged — the same dependency graph gets installed, just deterministically.",
          "1": "The opposite: pinning freezes versions. You still need audit tooling and refresh discipline, or you're pinned to the known-vulnerable."
        },
        "bestPractices": "Gate CI with `npm audit --audit-level=high` and refresh the lockfile deliberately — pinned + stale is its own vulnerability."
      },
      {
        "q": "Adding MFA to your login makes which property stronger?",
        "opts": [
          "Authorization — users can do less damage",
          "Authentication",
          "Both equally"
        ],
        "answer": 1,
        "whyCorrect": "MFA is stronger authentication: a second factor makes it harder to *be* Alice. It says nothing about what Alice's identity — or her hijacked session — is allowed to touch once inside. Impersonating a user gets harder.",
        "whyWrong": {
          "0": "MFA doesn't change what Alice can do after login — a hijacked post-login session carries all her permissions.",
          "2": "MFA lives entirely at the identity gate. Least privilege, deny-default, and RBAC are what strengthen authorization."
        },
        "bestPractices": "Strengthen the two gates independently: MFA/FIDO2 for authn, least-privilege and deny-default for authz."
      },
      {
        "kind": "order",
        "q": "Order the threat-modeling pipeline from the lesson — the four pieces are a sequence, not a checklist.",
        "items": [
          "Profile the attacker — who wants in, and why",
          "List the assets and tag each with its CIA leg",
          "Run STRIDE over each component to find threats",
          "Attach a control that restores the threatened leg",
          "Accept one trade-off consciously and write it down"
        ],
        "whyWrong": "Starting from controls ('we need a WAF!') is security shopping, not threat modeling — without the attacker and asset steps you can't say what the control is FOR, or notice what it fails to cover.",
        "whyCorrect": "Attacker → assets → threats → controls → accepted risk. Each step scopes the next; the written trade-off at the end is what makes the model a budget instead of a wish list.",
        "bestPractices": "Re-run the pipeline when the architecture changes, not on a calendar — a threat model of last year's system protects last year's system."
      },
      {
        "kind": "order",
        "code": true,
        "lessonId": "sec-secure-coding",
        "q": "Order this password-check handler so nothing untrusted is used before it's proven — each line earns the next.",
        "items": [
          "user = db.get_user(request.form.get('email', ''))",
          "if user is None: return abort(401)",
          "if not bcrypt.checkpw(password.encode(), user.pw_hash): return abort(401)",
          "session['user_id'] = user.id",
          "return redirect('/dashboard')"
        ],
        "whyWrong": "Setting the session before the bcrypt check is the ordering that logs in anyone with a valid email — the credential must be PROVEN before any state changes. And both failures must abort with the same 401, or the response leaks which emails exist.",
        "whyCorrect": "Look up → bail on unknown user → verify the hash → only then grant the session → redirect. Authentication is a gate: nothing on the other side runs until it closes.",
        "bestPractices": "Return the identical error for 'no such user' and 'wrong password' — different messages turn your login into an email-enumeration oracle."
      },
      {
        "q": "In defense in depth, each layer exists because ____ — that's the whole design assumption.",
        "opts": [
          "attackers always target the network first",
          "some other layer will eventually fail",
          "auditors require at least three controls"
        ],
        "answer": 1,
        "lessonId": "sec-defense-in-depth",
        "whyWrong": {
          "0": "Modern attacks land through phishing, dependencies, and leaked creds at least as often as the network — no layer 'goes first' reliably.",
          "2": "Compliance may count controls, but the engineering reason for layering is failure tolerance, not checkbox arithmetic."
        },
        "whyCorrect": "Every control has a bypass, a misconfiguration, or a bad day. Layers are designed on the assumption that any single one WILL fail — the attacker has to be lucky repeatedly, you only have to be lucky once per layer.",
        "bestPractices": "For each layer, ask 'what catches the attacker when THIS fails?' — if the answer is nothing, that layer is actually your only wall."
      },
      {
        "q": "What's wrong with this template? `element.innerHTML = '<b>Welcome, ' + user.name + '</b>'`",
        "opts": [
          "innerHTML is slower than textContent, so the page repaints twice",
          "The bold tag should come from CSS, not markup built in JavaScript",
          "user.name flows into live HTML — a stored XSS if the name contains a script payload"
        ],
        "answer": 2,
        "lessonId": "sec-xss",
        "whyWrong": {
          "0": "The performance difference is trivia here — the security hole is what matters, and it exists at any speed.",
          "1": "Styling taste has nothing to do with it — a CSS class would carry the exact same injected payload."
        },
        "whyCorrect": "A user who registered as `<img src=x onerror=steal()>` now executes in every visitor's browser. Untrusted data must be set with `textContent` (or output-encoded for the HTML context), never concatenated into `innerHTML`.",
        "bestPractices": "Encode for the destination at the moment of output — the same string is safe as text and lethal as markup."
      }
    ],
    "senior": [
      {
        "q": "In envelope encryption, why encrypt data with a DEK and then wrap the DEK with a KMS-held KEK?",
        "opts": [
          "Two layers of encryption doubles the work an attacker must brute-force",
          "You can rotate the KEK by re-wrapping one small DEK",
          "The DEK provides forward secrecy if the KEK ever leaks"
        ],
        "answer": 1,
        "whyCorrect": "The KEK never leaves KMS, and each unwrap is IAM-gated, logged, and revocable. Rotating the KEK means re-wrapping the small DEK — the encrypted petabytes never move.",
        "whyWrong": {
          "0": "Strength isn't the point — a single AES key is already unbruteforceable. The design win is operational: rotation and gated, auditable access.",
          "2": "Forward secrecy is a TLS-handshake property that comes from ephemeral key exchange — unrelated to envelope encryption at rest."
        },
        "bestPractices": "Use customer-managed keys per workload so each service has its own blast radius, and alert on anomalous decrypt volumes in CloudTrail."
      },
      {
        "q": "Your role has `kms:*` in IAM, but `kms:Decrypt` fails with AccessDenied. What's the likely cause?",
        "opts": [
          "The key policy doesn't list your role",
          "KMS requires MFA for decrypt operations",
          "The key was rotated and old ciphertext is unreadable"
        ],
        "answer": 0,
        "whyCorrect": "Key policies are not IAM policies: the key policy gates the key itself, IAM gates the principal, and the request succeeds only when both allow. 'My role has kms:* but it still fails' is the classic symptom. Key policy and IAM must BOTH allow.",
        "whyWrong": {
          "1": "MFA conditions are optional policy add-ons, not a KMS default behavior.",
          "2": "KMS rotation keeps old backing material precisely so previously encrypted ciphertext still decrypts."
        },
        "bestPractices": "Debug the AND-gate in order: IAM allows the action? Key policy lists the principal? Conditions like kms:ViaService match? CloudTrail shows which one denied."
      },
      {
        "q": "After adding a NACL to a subnet, outbound requests succeed but the responses never arrive. Why?",
        "opts": [
          "NACLs are stateless",
          "The security group is blocking return traffic",
          "NACLs only apply to ingress"
        ],
        "answer": 0,
        "whyCorrect": "Security groups track connections; NACLs don't. A stateless subnet filter needs explicit allows in both directions or return packets are silently dropped — the classic stateful/stateless mixup. You must open the return direction explicitly.",
        "whyWrong": {
          "1": "Security groups are stateful — return traffic for an allowed connection is automatic. That's exactly the property NACLs lack.",
          "2": "NACLs filter both directions, evaluated in rule-number order — which is why forgetting the return rule bites."
        },
        "bestPractices": "Chain security groups by SG reference for the fine-grained rules and keep NACLs as a coarse subnet-level backstop."
      },
      {
        "q": "Why doesn't CORS protect you from CSRF?",
        "opts": [
          "CORS only applies to GET requests",
          "CORS gates who can READ the response",
          "CORS is enforced by the server, which the attacker controls"
        ],
        "answer": 1,
        "whyCorrect": "A CSRF attacker never needs to see the response — the transfer already executed under the victim's cookie. CORS controls reading responses; SameSite and CSRF tokens control whether the request is honored at all. The forged request is still sent, and the side effect already happened.",
        "whyWrong": {
          "0": "CORS covers all methods — the issue is what it protects (reading), not which verbs it applies to.",
          "2": "CORS is enforced by the *browser*, and the attacker controls neither the victim's browser nor your server."
        },
        "bestPractices": "Memorize the split: CORS = who reads the response, SameSite = who sends the cookie. Confuse them and you ship the bug."
      },
      {
        "q": "Why is 'encode output for the destination' better XSS advice than 'sanitize input'?",
        "opts": [
          "Sanitizing input is too slow at scale",
          "Input sanitization breaks legitimate HTML in user content",
          "The same string is safe in one render context and a payload in another — only the destination knows which encoding applies"
        ],
        "answer": 2,
        "whyCorrect": "There's no universal 'clean' string: HTML body, attributes, JS strings, and URLs each need *different* encoding. Render time, per context, is the only place enough information exists to encode correctly.",
        "whyWrong": {
          "0": "Performance is irrelevant here — sanitization fails on correctness: a filter at input time can't know where the string will eventually land.",
          "1": "Occasionally true but not the principle — the real point is that each destination context interprets text differently."
        },
        "bestPractices": "Lean on default-escaping templates (React JSX, Jinja autoescape) and audit every dangerouslySetInnerHTML / v-html escape hatch like a hand-rolled query."
      },
      {
        "q": "Why is 'log everything into the SIEM' an anti-pattern?",
        "opts": [
          "More logs slow down the collectors",
          "Regulators forbid storing that much data",
          "It bankrupts the budget and buries the signal — ingest-priced SIEMs punish noise, and detections drown in heartbeats"
        ],
        "answer": 2,
        "whyCorrect": "The rule that works: log what you'd grep for during an incident — auth events, privileged actions, egress to new ASNs, control-plane mutations. Skip the heartbeats and 200-OKs; everything else is a bill, not a defense.",
        "whyWrong": {
          "0": "Collectors scale; the failure is economic and human — the bill explodes and analysts can't find the attack in the noise.",
          "1": "Data-minimization applies to personal data, but that's not why 'log everything' fails as a detection strategy."
        },
        "bestPractices": "Budget a human for tuning — every new app ships new noise, and a muted alert channel is an exploited one."
      },
      {
        "q": "Your SSRF defense checks the hostname against a denylist, then calls `requests.get(url)`. How does DNS rebinding beat it?",
        "opts": [
          "The attacker registers a lookalike domain",
          "The first DNS lookup (your check) returns a safe IP; the second (the actual fetch) returns 169.254.169.254",
          "DNS responses are spoofed on the wire"
        ],
        "answer": 1,
        "whyCorrect": "Validate-then-fetch does two separate resolutions, and the attacker's DNS server can answer each one differently. The fix: resolve once, validate that IP, then connect to the IP directly with the Host header set.",
        "whyWrong": {
          "0": "Typosquatting fools humans; rebinding fools your validator by answering the same name differently across lookups.",
          "2": "No spoofing needed — the attacker legitimately controls their own DNS server and its TTLs."
        },
        "bestPractices": "Also disable auto-redirects or re-validate every hop — a safe URL that 302s to the metadata IP is the same bug.",
        "lessonId": "sec-ssrf"
      },
      {
        "kind": "order",
        "q": "Order the incident-response phases — from the first alert to being genuinely better afterward.",
        "items": [
          "Detect — the alert fires and is triaged as real",
          "Contain — isolate the blast radius fast",
          "Eradicate — remove the attacker's access and artifacts",
          "Recover — restore systems and verify integrity",
          "Post-mortem — fix the class of failure, blamelessly"
        ],
        "whyWrong": "Eradicating before containing tips the attacker off while they still have reach — they burn your visibility and dig in deeper. Recovery before eradication restores systems the attacker still owns.",
        "whyCorrect": "Detect → contain → eradicate → recover → learn. Containment freezes the damage so eradication is complete; the post-mortem is what turns an incident into immunity.",
        "bestPractices": "Practice the order in game days before you need it — the middle of a breach is the worst possible time to design your process."
      },
      {
        "kind": "order",
        "code": true,
        "lessonId": "sec-vault-rotation",
        "q": "Order a zero-downtime secret rotation — the dual-accept window only works in this sequence.",
        "items": [
          "new_key = vault.create_secret_version('db-password')",
          "deploy_config(accept=[old_key, new_key])",
          "update_producers(use=new_key)",
          "verify_no_traffic_uses(old_key)",
          "vault.revoke(old_key)"
        ],
        "whyWrong": "Revoking the old key before every producer has switched is the rotation that causes the outage the runbook was meant to prevent — and switching producers before consumers accept both keys drops every request in between.",
        "whyCorrect": "Mint the new → accept BOTH → move writers to the new → prove the old is idle → revoke. The dual-accept window is scaffolding: it comes up before the switch and down only after the evidence.",
        "bestPractices": "During the window two valid credentials exist — treat it as elevated risk, keep it short, and alert on any old-key use after the switch."
      },
      {
        "q": "Your SIEM bill exploded and detections drown in noise. The fix is to ingest ____ rather than everything.",
        "opts": [
          "signals mapped to the threats you actually detect on",
          "only logs from production hosts, never staging",
          "a random 10% sample of every log stream"
        ],
        "answer": 0,
        "lessonId": "sec-siem",
        "whyWrong": {
          "1": "Staging noise isn't the core problem — plenty of production streams (debug logs, heartbeats) are just as useless for detection.",
          "2": "Random sampling drops the one malicious event with the same probability as the million boring ones — detection needs completeness on the streams that matter."
        },
        "whyCorrect": "Work backwards from detections: every alert you actually run names the events it needs, and THOSE streams get ingested completely. Ingest-priced SIEMs punish 'log everything' twice — in dollars and in buried signal.",
        "bestPractices": "Keep a mapping from each detection rule to its required log sources — anything no rule needs is a candidate for cheap cold storage instead of the SIEM."
      },
      {
        "q": "What's wrong with this audit trail? `UPDATE audit_log SET details = 'corrected' WHERE id = 42`",
        "opts": [
          "The statement proves the log is mutable — anyone with UPDATE rights can rewrite history, so it can't attest anything",
          "The WHERE clause should match on timestamp, because ids can be reused after a vacuum",
          "Corrections belong in a transaction so the change is atomic across replicas"
        ],
        "answer": 0,
        "lessonId": "sec-audit-logs",
        "whyWrong": {
          "1": "Primary-key ids aren't reused in any sane schema — and even a perfectly targeted UPDATE is exactly the problem.",
          "2": "Atomicity makes the rewrite consistent everywhere — a beautifully replicated falsification is still a falsification."
        },
        "whyCorrect": "An audit log's value is that it CANNOT be quietly edited. If UPDATE works, the log is unprovable — corrections must be new append-only entries, with immutability enforced structurally (WORM storage, hash chains), not by policy.",
        "bestPractices": "Immutability must be structural, not promised — anyone with UPDATE rights makes the log unprovable, DBAs included."
      },
      {
        "q": "In envelope encryption, compromise of a single DEK exposes ____ — that blast-radius math is the design's whole point.",
        "opts": [
          "every object the KMS has ever wrapped",
          "only the data that one key encrypted",
          "nothing, because DEKs never leave the KMS"
        ],
        "answer": 1,
        "lessonId": "sec-kms-encryption",
        "whyWrong": {
          "0": "That's the failure mode envelope encryption PREVENTS — keys are per-object or per-batch precisely so one leak doesn't cascade.",
          "2": "DEKs do leave the KMS — they do the bulk encryption locally; it's the KEK that never leaves. Mixing the two up inverts the model."
        },
        "whyCorrect": "Each DEK encrypts a bounded slice of data and is itself wrapped by the KEK. Lose a DEK and you lose that slice — not the estate. The KEK stays in the KMS, so rotating it means re-wrapping tiny DEKs, not re-encrypting petabytes.",
        "bestPractices": "Sketch the blast radius before choosing key granularity: 'if this exact key leaks, what exactly is readable?' should have a small, nameable answer."
      }
    ],
    "distinguished": [
      {
        "q": "Why do teams run a new IPS rule in alert-only mode for a week before enabling block?",
        "opts": [
          "To collect enough samples to train the anomaly model",
          "An IPS blocks inline",
          "Alert-only mode is required by change-management standards"
        ],
        "answer": 1,
        "whyCorrect": "An IDS that fires wrong wastes an analyst's time; an IPS that fires wrong drops legitimate traffic in-line. The soak period measures the false-positive rate while the blast radius is still zero. A noisy rule can knock prod offline faster than the attack it targets.",
        "whyWrong": {
          "0": "Soaking measures false positives on signature rules — it's not ML training.",
          "2": "It's an engineering-risk decision, not paperwork — the inline placement is what turns a false positive into an outage."
        },
        "bestPractices": "An IPS in block mode without a soak period is just a slower outage — soak, measure the true-positive rate, then flip."
      },
      {
        "q": "During containment of a compromised host, why capture memory and disk images BEFORE reimaging?",
        "opts": [
          "Reimaging destroys the attacker's persistence mechanisms and your forensic trail with them",
          "Backups are required before any infrastructure change",
          "The images are needed to restore the host afterward"
        ],
        "answer": 0,
        "whyCorrect": "Reimage first and the persistence, the tooling, and the answer to 'how did they get in?' are gone forever. Eradication without evidence means you re-open the same hole in 30 days.",
        "whyWrong": {
          "1": "This isn't change hygiene — it's evidence preservation. The image is a court exhibit and a map of what the attacker planted.",
          "2": "You restore from known-clean images, never the compromised one — that would reinstall the implant."
        },
        "bestPractices": "Same logic for compromised AWS keys: attach a deny-all policy instead of deleting — contain while preserving evidence and live attacker telemetry."
      },
      {
        "q": "What trade-off do you knowingly accept by enforcing deny-default network policy (ingress AND egress) everywhere?",
        "opts": [
          "Reduced throughput from packet inspection",
          "A larger attack surface from the policy engine itself",
          "Operational friction"
        ],
        "answer": 2,
        "whyCorrect": "Deny-default fails closed: something's broken and visible, instead of everything reachable and silent. You pay in onboarding speed and confusing timeouts; you get a blast radius of one service instead of the whole flat network. Every new service-to-service call needs an explicit allow, and a forgotten rule looks like a mysterious 'connection refused'.",
        "whyWrong": {
          "0": "NetworkPolicies are allow/deny matching, not deep packet inspection — the cost is human workflow, not CPU.",
          "1": "The policy layer adds negligible surface; the real cost is the day-to-day tax of 'nothing is allowed until you say so'."
        },
        "bestPractices": "Accept the friction knowingly — the anti-pattern is mistaking one strong perimeter ('we have a firewall') for depth."
      },
      {
        "q": "A SPA keeps its JWT in memory and sends it via the Authorization header instead of a cookie. What did it trade?",
        "opts": [
          "It gained CSRF immunity but accepted the XSS-steals-the-token risk",
          "It gained XSS immunity but became CSRF-vulnerable",
          "Nothing — headers and cookies are equivalent"
        ],
        "answer": 0,
        "whyCorrect": "Classic CSRF rides on automatic cookie attachment, which bearer headers never get — so the forgery vector dies. But any XSS in the page can now read the token itself, so output encoding and a strict CSP become load-bearing.",
        "whyWrong": {
          "1": "Backwards: XSS can read anything page JS can, including an in-memory token. What it can't do is make the browser auto-attach that token cross-site.",
          "2": "They differ exactly where it matters: browsers auto-attach cookies to cross-site requests; they never auto-attach Authorization headers."
        },
        "bestPractices": "Pick the storage model by which failure you can better defend: HttpOnly cookie + SameSite + CSRF token, or in-memory bearer + strict CSP."
      },
      {
        "q": "HPKP (public key pinning) offered real MITM protection. Why did browsers kill it?",
        "opts": [
          "It was cryptographically broken",
          "One key-rotation mistake could brick your site for months — the failure mode outweighed the protection",
          "Certificate authorities lobbied against it"
        ],
        "answer": 1,
        "whyCorrect": "A lost or mis-rotated pinned key locked every returning visitor out until the pin expired. Chrome killed it in favor of Certificate Transparency logs plus Expect-CT — similar detection of mis-issued certs without the suicide pact.",
        "whyWrong": {
          "0": "The crypto was sound — the operational failure mode was the problem.",
          "2": "The replacement (CT logs) makes CAs *more* accountable, not less — this wasn't a CA-friendliness decision."
        },
        "bestPractices": "Weigh a control's failure mode as heavily as its protection — a defense that can self-inflict a months-long outage is a liability."
      },
      {
        "q": "Why doesn't 'our DBAs promise not to modify the audit table' satisfy an auditor?",
        "opts": [
          "Auditors require encryption, not immutability",
          "DBAs aren't authorized to make compliance commitments",
          "Immutability must be structural"
        ],
        "answer": 2,
        "whyCorrect": "If you can't prove an entry wasn't edited after the fact, it's a story, not evidence. S3 Object Lock in compliance mode, a hash-chained log, or a write-only separate account make tampering structurally impossible or detectable. WORM storage or hash chains — because anyone with UPDATE rights makes the log unprovable.",
        "whyWrong": {
          "0": "Encryption protects confidentiality; the evidentiary property is tamper-evidence — proof the past wasn't rewritten.",
          "1": "It's not about who promises — a promise is policy, and policy can't prove a negative six months later."
        },
        "bestPractices": "Ship audit logs to a separate account the prod role can write to but never delete from, and chain each entry to the previous entry's hash."
      },
      {
        "q": "During a secret rotation's dual-accept window, what security cost are you knowingly paying?",
        "opts": [
          "Services must restart twice",
          "Two valid credentials exist at once",
          "The vault becomes a single point of failure"
        ],
        "answer": 1,
        "whyCorrect": "Dual-accept trades a wider attack window for a zero-downtime rollout: v1 stays valid while clients migrate to v2. The judgment is sizing the window — long enough that nothing 401s mid-deploy, short enough that a compromised v1 dies fast. A stolen v1 keeps working until you cut over.",
        "whyWrong": {
          "0": "Well-built clients hot-reload or pick up v2 on their normal rollout — a double restart isn't the cost.",
          "2": "The vault's availability story is real but orthogonal — it's the same before, during, and after rotation."
        },
        "bestPractices": "Shrink the problem at the root: short TTLs and OIDC/workload identity mean there's rarely a static key to dual-accept at all.",
        "lessonId": "sec-vault-rotation"
      }
    ]
  }
};

function localDayIndex() {
  const now = new Date();
  return Math.floor((now.getTime() - now.getTimezoneOffset() * 60_000) / 86_400_000);
}

// Pick today's question for the given path + level. Same question for a calendar day.
// Retained for back-compat; new screens should use pickDailySession() instead.
export function pickDailyQuestion(pathKey, level) {
  const path = DAILY_QUESTIONS[pathKey] || DAILY_QUESTIONS.fundamentals;
  const bank = path[level] || path.novice || DAILY_QUESTIONS.fundamentals.novice;
  const day = localDayIndex();
  return bank[day % bank.length];
}

// pickEncounterQuestion — deterministic question for a journey chapter
// micro-encounter (journey design §5: quiz-bank questions in story costume).
// Seeded by (pathKey, chapter) — NOT by day, a chapter encounter shouldn't
// morph at midnight — and shifted by attempt so a paid retry (1 ⟡) draws a
// fresh question instead of letting the user brute-force the same one.
export function pickEncounterQuestion(pathKey, chapter, attempt = 0) {
  const path = DAILY_QUESTIONS[pathKey] || DAILY_QUESTIONS.fundamentals;
  const pool = Object.values(path).flat();
  if (pool.length === 0) return null;
  const s = `${pathKey}:${chapter}`;
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return pool[(h + attempt * 17) % pool.length];
}

// Seeded option permutation. The banks skew heavily toward one answer slot
// (canonical order let "always tap the same letter" score without recall),
// so every serving surface must shuffle. Seeding by (dayIndex, question
// slot) keeps the order stable across remounts within a local day — the
// persisted verdict map is keyed by question index, and a mid-session
// remount must not present the same question re-ordered. The answer index
// and index-keyed whyWrong entries remap through the permutation.
function permuteOptions(entry, seed) {
  if (!Array.isArray(entry.opts) || entry.opts.length < 2) return entry;
  let s = seed >>> 0;
  const rnd = () => {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const perm = entry.opts.map((_, i) => i);
  for (let i = perm.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rnd() * (i + 1));
    [perm[i], perm[j]] = [perm[j], perm[i]];
  }
  let whyWrong = entry.whyWrong;
  if (whyWrong && typeof whyWrong === 'object') {
    const remapped = {};
    perm.forEach((orig, ni) => { if (whyWrong[orig] != null) remapped[ni] = whyWrong[orig]; });
    if (whyWrong.default != null) remapped.default = whyWrong.default;
    whyWrong = remapped;
  }
  return {
    ...entry,
    opts: perm.map((oi) => entry.opts[oi]),
    answer: perm.indexOf(entry.answer),
    whyWrong,
  };
}

// pickDailySession — return 5 questions sampled deterministically by day index.
// Same 5 questions (and option orders) across the LOCAL calendar day; rotates
// at local midnight. `pathKeys` optionally restricts the pool to given paths —
// Home passes the paths the user has actually touched so a day-0 beginner
// isn't quizzed on all 8 careers at once.
export function pickDailySession(pathKeys = null) {
  const source = Array.isArray(pathKeys) && pathKeys.length
    ? pathKeys.map((k) => DAILY_QUESTIONS[k]).filter(Boolean)
    : Object.values(DAILY_QUESTIONS);
  const POOL = source.flatMap((byLevel) => Object.values(byLevel).flat());
  if (POOL.length === 0) return [];
  const dayIndex = localDayIndex();
  const out = [];
  for (let i = 0; i < 5; i += 1) {
    out.push(permuteOptions(POOL[(dayIndex * 137 + i * 31) % POOL.length], dayIndex * 1013 + i));
  }
  return out;
}
