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
  fundamentals: {
    novice: [
      {
        q: 'What does RAM hold while a program runs?',
        opts: ['Working data the CPU needs right now', 'Permanent files', 'Network packets'],
        answer: 0,
        whyWrong: {
          1: 'Permanent files live on disk (SSD/HDD). RAM loses its contents the moment power is gone.',
          2: 'Network packets briefly pass through RAM, but RAM is general-purpose working memory, not a packet buffer.',
        },
        whyCorrect: 'RAM is the CPU\'s scratch pad — fast, volatile, and the place running programs keep their variables, stacks, and heap allocations while they execute.',
        bestPractices: 'When a process gets sluggish, check memory pressure first (`free -h`, `top`). Out-of-memory usually shows as paging/swap thrash before it shows as CPU pegging.',
      },
      {
        q: 'Which command lists files in a directory?',
        opts: ['cat', 'ls', 'grep'],
        answer: 1,
        whyWrong: {
          0: '`cat` prints file contents to stdout — it doesn\'t enumerate the directory.',
          2: '`grep` searches inside files for a pattern. Useful, but it\'s a filter, not a directory lister.',
        },
        whyCorrect: '`ls` is the canonical directory listing tool. `ls -lah` adds long-form, hidden files, and human-readable sizes.',
        bestPractices: 'Memorize three forms: `ls` (quick scan), `ls -la` (perms + hidden), `ls -lah` (with sizes). Aliases like `ll` save keystrokes daily.',
      },
      {
        q: 'A "file path" is...',
        opts: ['The CPU instruction queue', 'A network route', 'The address that locates a file on disk'],
        answer: 2,
        whyWrong: {
          0: 'The CPU instruction queue is hardware-internal scheduling — unrelated to user-visible filenames.',
          1: 'Network routes (IPs, hops) move packets between machines. Paths name files within one filesystem.',
        },
        whyCorrect: 'A path — like `/home/user/notes.txt` — is a string that names exactly one file inside a filesystem hierarchy.',
        bestPractices: 'Prefer absolute paths in scripts (`/var/log/app.log`) so they don\'t silently break when the working directory changes.',
      },
    ],
    junior: [
      {
        q: 'Which of these is a process attribute, not a file attribute?',
        opts: ['PID', 'Owner', 'Permissions'],
        answer: 0,
        whyWrong: {
          1: 'Both files AND processes have owners. The owner attribute exists on both, so it\'s not exclusive to processes.',
          2: 'Permissions (rwx for user/group/other) are a file/inode attribute. Processes have a UID and capabilities, not chmod-style bits.',
        },
        whyCorrect: 'PID — Process ID — only exists for live processes. It\'s the kernel\'s handle into the task struct and dies with the process.',
        bestPractices: 'Use `ps -ef` or `pgrep -fl name` to map processes to PIDs. Never hard-code PIDs in scripts — pgrep/pidof at runtime.',
      },
      {
        q: 'What does "stdin" usually refer to?',
        opts: ['A storage device', 'Standard input stream', 'A scheduler'],
        answer: 1,
        whyWrong: {
          0: 'Storage devices show up under `/dev/sd*` or `/dev/nvme*`. stdin is file descriptor 0, not a physical device.',
          2: 'The scheduler is a kernel component that picks the next process to run. stdin is just a stream.',
        },
        whyCorrect: 'stdin is file descriptor 0 — the default input stream a program reads from. By default it\'s the terminal, but pipes and `<` redirect it.',
        bestPractices: 'Build CLIs that read from stdin when no file arg is given. It composes cleanly with pipes (`grep ERROR < log.txt` or `cat log.txt | grep ERROR`).',
      },
    ],
    senior: [
      {
        q: 'What is the kernel\'s primary job?',
        opts: ['Drawing the UI', 'Hosting web servers', 'Mediating between hardware and software'],
        answer: 2,
        whyWrong: {
          0: 'UI drawing is a userspace concern (X11, Wayland, the compositor). The kernel exposes input devices and framebuffers; it doesn\'t draw widgets.',
          1: 'Web servers (nginx, Apache) are userspace processes. The kernel gives them sockets, but doesn\'t serve HTTP itself.',
        },
        whyCorrect: 'The kernel arbitrates access to CPU, memory, disks, and network — exposing safe syscall interfaces so user processes don\'t corrupt each other or the hardware.',
        bestPractices: 'When perf is mysterious, profile syscalls (`strace -c`, `perf trace`). Userspace bugs often hide as "kernel slowness" until you see the syscall pattern.',
      },
    ],
    distinguished: [
      {
        q: 'In a context switch, what is most expensive on modern CPUs?',
        opts: ['TLB / cache flushes', 'Saving registers', 'Updating the PID counter'],
        answer: 0,
        whyWrong: {
          1: 'Saving the register file is a few hundred cycles at most — negligible vs. losing your warm caches.',
          2: 'PID housekeeping is a couple of pointer writes. Not on the hot path.',
        },
        whyCorrect: 'Switching to another address space invalidates the TLB and pollutes L1/L2 caches. The new process pays thousands of cycles in cache misses before it\'s warm again — that\'s where the real cost hides.',
        bestPractices: 'For latency-sensitive code, pin threads to cores (taskset / sched_setaffinity) and reduce context switches with batching. Profile with `perf stat -e context-switches,cache-misses`.',
      },
    ],
  },
  devops: {
    novice: [
      {
        q: 'What is Git mainly used for?',
        opts: ['Compiling code', 'Tracking file changes over time', 'Running databases'],
        answer: 1,
        whyWrong: {
          0: 'Compilation is done by a compiler/toolchain (gcc, tsc, javac). Git stores source — it doesn\'t build it.',
          2: 'Databases are runtime data stores. Git stores immutable snapshots of files, not live queryable rows.',
        },
        whyCorrect: 'Git is a distributed version control system — every commit is a hashed snapshot, letting you branch, diff, merge, and travel back in history.',
        bestPractices: 'Commit small and often with a clear subject line. `git commit --amend` and `git rebase -i` are your friends for cleaning up before pushing.',
      },
      {
        q: 'A container is best described as...',
        opts: ['A heavy VM with its own kernel', 'A type of database', 'A lightweight isolated process bundle'],
        answer: 2,
        whyWrong: {
          0: 'That describes a VM. VMs run a full guest kernel via a hypervisor. Containers share the host kernel — that\'s why they\'re lightweight.',
          1: 'Databases store data. Containers are a packaging + isolation mechanism for any process (including databases).',
        },
        whyCorrect: 'A container is a process (or process tree) isolated via Linux namespaces and constrained via cgroups. It packages its filesystem and dependencies in an image but shares the host kernel.',
        bestPractices: 'Treat containers as immutable. Build an image, tag it, run it. Mutating a running container is a sign you\'re using it wrong.',
      },
      {
        q: 'What does "cd" do in a shell?',
        opts: ['Changes the working directory', 'Copies a directory', 'Deletes a directory'],
        answer: 0,
        whyWrong: {
          1: 'Copy is `cp -r dir/ dest/`. `cd` doesn\'t move bytes.',
          2: 'Delete is `rm -rf` (use with extreme care). `cd` just moves where you\'re standing.',
        },
        whyCorrect: '`cd` (change directory) updates the shell\'s `PWD` — every subsequent relative path resolves from that location.',
        bestPractices: 'Use `cd -` to bounce back to your previous directory. In scripts, prefer `pushd`/`popd` so you can restore state cleanly.',
      },
    ],
    junior: [
      {
        q: 'What does a Kubernetes Service primarily provide?',
        opts: ['Persistent storage', 'Stable networking to a set of pods', 'Container image builds'],
        answer: 1,
        whyWrong: {
          0: 'Persistent storage is the job of PersistentVolumes and PVCs. Services don\'t store anything.',
          2: 'Image builds happen in CI (or Kaniko/BuildKit). Services consume already-built images; they don\'t produce them.',
        },
        whyCorrect: 'A Service is a stable virtual IP and DNS name that load-balances across whichever pods match its selector. Pods are ephemeral; the Service is the steady address clients talk to.',
        bestPractices: 'Use ClusterIP for in-cluster traffic, NodePort/LoadBalancer for external. For HTTP, prefer an Ingress on top of Services so you get host/path routing in one place.',
      },
      {
        q: 'A Dockerfile is...',
        opts: ['A running container', 'A registry URL', 'A recipe for building an image'],
        answer: 2,
        whyWrong: {
          0: 'A running container is an instance of an image. The Dockerfile is the build-time recipe, not the runtime artifact.',
          1: 'Registry URLs (like `docker.io/library/python`) point at hosted images. The Dockerfile produces what gets pushed there.',
        },
        whyCorrect: 'A Dockerfile is a declarative build script — each instruction (`FROM`, `COPY`, `RUN`) produces a cached layer in the resulting image.',
        bestPractices: 'Order Dockerfile instructions from least- to most-frequently-changed (dependencies before app code). Multi-stage builds keep final images small.',
      },
    ],
    senior: [
      {
        q: 'Why use Infrastructure-as-Code?',
        opts: ['Reproducible, version-controlled infra', 'Faster runtime', 'Lower egress cost'],
        answer: 0,
        whyWrong: {
          1: 'IaC describes infra, it doesn\'t make running services faster. The underlying VM is the same speed whether you clicked it in a console or terraform-applied it.',
          2: 'Egress cost is a function of how much data you move, not how you provisioned. IaC neither raises nor lowers it directly.',
        },
        whyCorrect: 'IaC turns infra into reviewable code — diffs in PRs, history in git, identical environments across dev/staging/prod, and easy disaster recovery by re-applying the manifests.',
        bestPractices: 'Keep state files (terraform.tfstate) in remote backends with locking. Never edit infra by hand in the console — drift will bite you within a week.',
      },
    ],
    distinguished: [
      {
        q: 'In K8s, what does a readiness probe gate?',
        opts: ['Pod restart', 'Inclusion in Service endpoints', 'Image pull retry'],
        answer: 1,
        whyWrong: {
          0: 'Pod restart is gated by the **liveness** probe (or a crash). Readiness failures keep the pod running but quiet.',
          2: 'Image pull retry is the kubelet\'s backoff loop on `ImagePullBackOff`. Probes never run before the container starts.',
        },
        whyCorrect: 'A failing readiness probe removes the pod from the Service\'s endpoint list — traffic stops flowing to it — but the pod keeps running so it can warm up, finish a slow startup, or drain in-flight requests.',
        bestPractices: 'Use readiness for "ready to take traffic" (DB connected, cache warm) and liveness for "totally stuck, please restart me". Conflating them causes restart storms.',
      },
    ],
  },
  mlops: {
    novice: [
      {
        q: 'In supervised learning, what does the model learn from?',
        opts: ['Random noise', 'Its own predictions only', 'Labeled examples'],
        answer: 2,
        whyWrong: {
          0: 'Random noise is what regularization tries to avoid memorizing. A model trained on pure noise generalizes to nothing.',
          1: 'Learning purely from its own predictions is closer to unsupervised / self-supervised setups. Supervised means an external teacher signal.',
        },
        whyCorrect: 'Supervised learning means each input x has a known label y. The model minimizes the gap between its prediction ŷ and y — labels are the "supervision".',
        bestPractices: 'Audit label quality before model quality. A 10% label noise rate caps your achievable accuracy regardless of how fancy the architecture is.',
      },
      {
        q: 'What is a "feature" in ML?',
        opts: ['An input variable to the model', 'A bug', 'A type of GPU'],
        answer: 0,
        whyWrong: {
          1: 'That\'s the software engineering joke meaning. Different domain.',
          2: 'GPUs are hardware. Features live in your dataset columns, not on a circuit board.',
        },
        whyCorrect: 'A feature is one column / dimension of input — age, pixel intensity, embedding component, etc. The model maps features to predictions.',
        bestPractices: 'Treat feature engineering as half the model. A weak model with great features beats a strong model with garbage features almost every time.',
      },
      {
        q: 'Training data is used to...',
        opts: ['Test final accuracy', 'Fit the model parameters', 'Replace the model'],
        answer: 1,
        whyWrong: {
          0: 'Test accuracy is measured on a held-out test set you never trained on. Evaluating on training data overestimates real-world performance.',
          2: 'Data and models are different things — data feeds the model, doesn\'t become it.',
        },
        whyCorrect: 'Training data drives the optimization: the model adjusts its parameters to minimize the loss on these examples. The test set is reserved for honest final evaluation.',
        bestPractices: 'Always split train/val/test BEFORE looking at the data. If you peek at the test set during model selection, you\'ve leaked information and your metric is optimistic.',
      },
    ],
    junior: [
      {
        q: 'What is model serving?',
        opts: ['Training a model', 'Visualizing weights', 'Exposing a trained model to make predictions'],
        answer: 2,
        whyWrong: {
          0: 'Training is the offline learning phase. Serving is what happens after — using the result in production.',
          1: 'Visualizing weights is a debugging / interpretability activity. Useful, but not what "serving" means.',
        },
        whyCorrect: 'Serving puts a trained model behind an API (REST, gRPC, batch job) so other systems can send inputs and get predictions back — usually with latency, throughput, and version constraints.',
        bestPractices: 'Wrap models with versioned APIs (e.g. `/v1/predict`). Roll new models out behind A/B or shadow traffic before flipping 100%.',
      },
    ],
    senior: [
      {
        q: 'What is data drift?',
        opts: ['Input distribution shifting from training', 'GPU memory leaking', 'A dropout layer'],
        answer: 0,
        whyWrong: {
          1: 'GPU memory leaks are an infrastructure problem. Drift is about *data*, not memory.',
          2: 'Dropout is a regularization technique used during training. Unrelated to monitoring.',
        },
        whyCorrect: 'Data drift means the live input distribution P(x) no longer matches what the model was trained on. The model can still predict, but accuracy quietly degrades because it\'s seeing inputs it never saw before.',
        bestPractices: 'Monitor input feature distributions in production (KS test, PSI, embedding-space distances). Trigger retraining or alerting when drift exceeds a threshold.',
      },
    ],
    distinguished: [
      {
        q: 'Accuracy is steady but business KPI drops. Most likely cause?',
        opts: ['Code bug', 'Concept drift (label meaning changed)', 'Hardware failure'],
        answer: 1,
        whyWrong: {
          0: 'A code bug usually surfaces as obvious errors or accuracy drops — not as "metrics fine, business worse".',
          2: 'Hardware failures cause unavailability, not silent KPI degradation while accuracy holds.',
        },
        whyCorrect: 'Concept drift = P(y|x) changed. The model still predicts the old relationship perfectly, but the world\'s definition of "correct" shifted. Accuracy on stale labels stays flat while real impact erodes.',
        bestPractices: 'Tie model success to downstream KPIs, not just offline accuracy. Sample live predictions for human labeling and watch the gap between offline accuracy and business outcome.',
      },
    ],
  },
  swe: {
    novice: [
      {
        q: 'What is a function?',
        opts: ['A network port', 'A variable type', 'Reusable named block of code'],
        answer: 2,
        whyWrong: {
          0: 'Network ports (80, 443, ...) are TCP/UDP endpoints. Functions are a programming construct.',
          1: 'Variables hold values. Functions are callable blocks. Different building blocks of a program.',
        },
        whyCorrect: 'A function packages a named block of behavior you can call with inputs (arguments) and get outputs (return value) — the fundamental unit of code reuse.',
        bestPractices: 'Keep functions small (one screen, one job). Pure functions (no side effects) are easiest to test and reason about.',
      },
      {
        q: 'Which data structure is FIFO?',
        opts: ['Queue', 'Stack', 'Tree'],
        answer: 0,
        whyWrong: {
          1: 'A stack is LIFO — Last In, First Out. Think stack of plates: you grab the top one.',
          2: 'A tree is hierarchical (parent → children), not ordered as a single in/out line.',
        },
        whyCorrect: 'A queue is First In, First Out — the first thing pushed is the first thing popped. Like a line at a checkout.',
        bestPractices: 'Use queues for work item processing (job queues, message queues). Use stacks for backtracking, parsing, and recursion-style state.',
      },
      {
        q: 'Big-O describes...',
        opts: ['Memory layout', 'How runtime/space scales with input size', 'CPU clock'],
        answer: 1,
        whyWrong: {
          0: 'Memory layout (stack vs heap, alignment) is a separate runtime topic. Big-O is about growth rate, not arrangement.',
          2: 'CPU clock speed is a hardware constant. Big-O is about how work *scales*, independent of clock.',
        },
        whyCorrect: 'Big-O captures the asymptotic growth of runtime or memory as input size n grows — O(1), O(log n), O(n), O(n²), etc. It ignores constants because those wash out at large n.',
        bestPractices: 'Whenever you write a nested loop, ask: "what\'s the outer × inner?" Catching O(n²) at design time is way cheaper than catching it in prod at n=1M.',
      },
    ],
    junior: [
      {
        q: 'Big-O of binary search on a sorted array?',
        opts: ['O(n)', 'O(n log n)', 'O(log n)'],
        answer: 2,
        whyWrong: {
          0: 'O(n) is a linear scan. Binary search halves the range each step, so it\'s exponentially faster than that.',
          1: 'O(n log n) is sorting (mergesort, heapsort). Binary search assumes the array is *already* sorted and just locates one element.',
        },
        whyCorrect: 'Each comparison eliminates half the remaining range, so after k steps you\'ve narrowed n down to n/2^k. Solve for k: O(log₂ n).',
        bestPractices: 'Binary search needs a sorted, random-access structure. If you find yourself sorting once to search many times, the sort cost amortizes — that\'s when it really shines.',
      },
    ],
    senior: [
      {
        q: 'What problem does memoization solve?',
        opts: ['Recomputing the same subproblem', 'Compiling slow code', 'Network latency'],
        answer: 0,
        whyWrong: {
          1: 'Compilation speed is the compiler\'s problem. Memoization is a runtime caching pattern.',
          2: 'Network latency is solved with CDNs, connection pooling, or moving compute closer. Memoization caches *function results*, not network calls (though it can cache responses).',
        },
        whyCorrect: 'Memoization caches the result of f(x) keyed by x, so the next call with the same input returns instantly. Classic win for overlapping subproblems in recursion (e.g. naive Fibonacci is O(2^n), memoized is O(n)).',
        bestPractices: 'Memoize only pure functions (same input → same output). Mind the cache key — mutable args defeat memoization or, worse, return stale results.',
      },
    ],
    distinguished: [
      {
        q: 'Why is Agile iterative delivery valuable?',
        opts: ['Avoids tests', 'Learns from real users sooner', 'Removes deadlines'],
        answer: 1,
        whyWrong: {
          0: 'Agile doesn\'t avoid tests — well-run Agile usually has MORE tests (CI, TDD). The "avoid tests" framing is a misconception.',
          2: 'Agile still has deadlines, sprints, and commitments. What it changes is the *frequency* of feedback, not whether dates exist.',
        },
        whyCorrect: 'Shipping small increments puts real software in front of real users early. That feedback either validates assumptions or invalidates them while course-correcting is still cheap.',
        bestPractices: 'Define "done" per increment (deployed + measured), not "code merged". Without measurement, iteration is just busywork — you have to learn from each ship.',
      },
    ],
  },
  mleng: {
    novice: [
      {
        q: 'A neural network is loosely inspired by what?',
        opts: ['Banking ledgers', 'Phone networks', 'Networks of biological neurons'],
        answer: 2,
        whyWrong: {
          0: 'Banking ledgers are double-entry bookkeeping. No relation to NN topology.',
          1: 'Phone networks route calls between subscribers. The graph structure differs and there\'s no learning involved.',
        },
        whyCorrect: 'Neural nets borrow the metaphor of neurons firing through weighted connections. The math (weighted sums + nonlinearity) is a vastly simplified abstraction, but the inspiration is biological.',
        bestPractices: 'Don\'t over-extend the brain analogy when debugging. NNs are matrix multiplications + activations — the math, not the metaphor, is what predicts behavior.',
      },
      {
        q: 'What\'s an "epoch" in training?',
        opts: ['One full pass through the dataset', 'One sample', 'One GPU'],
        answer: 0,
        whyWrong: {
          1: 'One sample is a single example. The unit that processes one sample at a time is a "step" (or "iteration" in batch=1).',
          2: 'A GPU is hardware. Epochs are a logical training-progress unit, independent of hardware count.',
        },
        whyCorrect: 'An epoch is one complete sweep over every example in the training set. Multiple epochs = repeated passes; the model usually needs many to converge.',
        bestPractices: 'Track loss per epoch on both train and val. If val loss plateaus or rises while train loss drops, you\'re overfitting — stop early or regularize.',
      },
    ],
    junior: [
      {
        q: 'What does backpropagation compute?',
        opts: ['Predictions', 'Gradients of the loss w.r.t. weights', 'Batch size'],
        answer: 1,
        whyWrong: {
          0: 'Predictions come from the forward pass. Backprop happens AFTER you have a prediction and a loss.',
          2: 'Batch size is a hyperparameter you choose, not a computed value.',
        },
        whyCorrect: 'Backprop is the chain rule applied layer-by-layer, walking backward from the loss to compute ∂L/∂w for every weight. The optimizer then uses those gradients to update weights.',
        bestPractices: 'Don\'t implement backprop by hand for new architectures — frameworks (PyTorch autograd, JAX) handle it. But DO understand the math when debugging vanishing/exploding gradients.',
      },
    ],
    senior: [
      {
        q: 'Why use a validation set distinct from train and test?',
        opts: ['Compress data', 'Speed up training', 'Tune hyperparameters without leaking test info'],
        answer: 2,
        whyWrong: {
          0: 'Validation sets don\'t compress anything — they\'re held-out data, same format as train.',
          1: 'Adding a val set actually means LESS training data. The trade is honest evaluation, not speed.',
        },
        whyCorrect: 'Hyperparameter search (LR, layers, regularization) needs a feedback signal. If you tune on test, you overfit to test and your final number is dishonest. Val provides that signal; test is sacred final evaluation.',
        bestPractices: 'Typical split: 70/15/15 or 80/10/10 (train/val/test). Touch the test set exactly once, at the very end, after all decisions are frozen.',
      },
    ],
    distinguished: [
      {
        q: 'Vanishing gradients hurt which layers most?',
        opts: ['Early layers in a deep net', 'Output layer', 'Bias terms'],
        answer: 0,
        whyWrong: {
          1: 'The output layer is closest to the loss — its gradient is computed directly. It\'s the LEAST affected.',
          2: 'Bias terms get the same scaling as their layer\'s weights. They\'re not specially vulnerable.',
        },
        whyCorrect: 'Backprop multiplies gradients layer-by-layer. If each layer\'s local gradient is < 1, the product shrinks exponentially as you walk backward — so the EARLY layers see vanishingly small updates and essentially stop learning.',
        bestPractices: 'Mitigations: ReLU-family activations (preserve gradient magnitude), residual connections (gradient shortcuts), batch norm / layer norm, careful initialization (Xavier/He).',
      },
    ],
  },
  faang: {
    novice: [
      {
        q: 'What is system design (briefly)?',
        opts: ['Drawing logos', 'Architecting how services and data fit together', 'Buying servers'],
        answer: 1,
        whyWrong: {
          0: 'Logos are branding. System design is technical architecture.',
          2: 'Purchasing is procurement. System design is the conceptual structure — what should exist and how it talks.',
        },
        whyCorrect: 'System design is the discipline of deciding the components (services, databases, queues, caches), how they communicate, and how the whole thing handles load, failure, and growth.',
        bestPractices: 'Start every design from requirements: QPS, data volume, consistency needs, latency SLO. Without those numbers, "design" is just whiteboard art.',
      },
      {
        q: 'A cache is mainly used to...',
        opts: ['Permanently store data', 'Encrypt traffic', 'Serve hot data faster'],
        answer: 2,
        whyWrong: {
          0: 'Permanent storage is the database. Caches are explicitly NOT durable — data can evict at any time.',
          1: 'Encryption is TLS/TLS-terminating proxies. Different layer.',
        },
        whyCorrect: 'A cache trades durability and capacity for latency. It keeps the most-accessed data in fast memory (RAM, edge) so reads don\'t hammer the origin.',
        bestPractices: 'Always have a "cache miss → backing store" path tested. And design for cache invalidation up front — it\'s famously one of the two hard problems in CS.',
      },
    ],
    junior: [
      {
        q: 'CAP theorem says you can have at most two of...',
        opts: ['Consistency, Availability, Partition-tolerance', 'Cost, Auth, Performance', 'CPU, API, Persistence'],
        answer: 0,
        whyWrong: {
          1: 'Those are real concerns, but they\'re not the letters in CAP. CAP is a specific distributed-systems result.',
          2: 'Same — those are real but not the CAP triplet.',
        },
        whyCorrect: 'CAP: under a network Partition, you must choose between Consistency (all reads see the latest write) and Availability (every request gets a non-error response). You cannot have both during a partition.',
        bestPractices: 'In practice, partitions are rare but inevitable. Decide ahead of time whether YOUR system is CP (e.g. financial ledger) or AP (e.g. social feed) and document it.',
      },
    ],
    senior: [
      {
        q: 'Why is DP often O(n*m) instead of exponential?',
        opts: ['Hardware speed', 'Memoizing overlapping subproblems', 'Loop unrolling'],
        answer: 1,
        whyWrong: {
          0: 'Hardware doesn\'t change asymptotic complexity. A 10× faster CPU still loses to exponential growth at modest n.',
          2: 'Loop unrolling is a constant-factor optimization. DP\'s win is algorithmic — different complexity class.',
        },
        whyCorrect: 'Naive recursion re-solves the same subproblems exponentially many times. DP stores each subproblem\'s answer in a table (n × m cells) and computes each once — collapsing exponential to polynomial.',
        bestPractices: 'Spot DP by drawing the recursion tree: if you see the same (state) node repeated, memoize. Bottom-up tabulation usually wins on constant factors and avoids stack-overflow risk.',
      },
    ],
    distinguished: [
      {
        q: 'In a write-heavy service, what is often the first bottleneck?',
        opts: ['CPU', 'DNS', 'Disk / log throughput'],
        answer: 2,
        whyWrong: {
          0: 'CPU bottlenecks show up on compute-heavy workloads (ML inference, JSON parsing at scale). Writes are usually I/O-bound first.',
          1: 'DNS is a one-time resolution at connection setup. Doesn\'t scale with write volume.',
        },
        whyCorrect: 'Durable writes hit the storage subsystem — the WAL fsync on a transactional DB, or the commit log on Kafka — and that\'s a serial, latency-bound path. You typically saturate disk IOPS / log throughput before CPU.',
        bestPractices: 'Batch writes (group commits, log appends), use SSDs / NVMe for hot logs, and partition aggressively so each shard\'s write rate stays under the disk\'s sustained IOPS budget.',
      },
    ],
  },

  // fullstack — authored 2026-07 (workflow: infralearn-content-fanout),
  // grounded in src/data/lessons/fullstack.js. Unlocks daily practice,
  // journey encounters, and minion battles for this path.
  fullstack: {
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
        "bestPractices": "Run the keyboard test: if you can't Tab to it and press Enter, the markup is wrong."
      },
      {
        "q": "With `box-sizing: border-box`, what does `width: 300px` mean?",
        "opts": [
          "The content area alone is 300px; padding and border push the total wider",
          "Content + padding + border total 300px",
          "Content + padding + border + margin total 300px"
        ],
        "answer": 1,
        "whyCorrect": "`border-box` makes `width` the total box including padding and border — the number you actually wanted. That's why the global `*, *::before, *::after { box-sizing: border-box }` reset exists.",
        "whyWrong": {
          "0": "That describes the legacy `content-box` default — the treacherous behavior `border-box` was invented to fix.",
          "2": "Margin is always outside the box in both models; no sizing mode folds it into `width`."
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
          "Legal — const guards the binding, not the value",
          "Legal only in non-strict mode"
        ],
        "answer": 1,
        "whyCorrect": "`const` prevents *rebinding* the variable (`user = {}` throws), but the object it points to stays mutable — mutating a property is perfectly legal.",
        "whyWrong": {
          "0": "That's what `Object.freeze` does — `const` never freezes the value, only the binding.",
          "2": "Strict mode changes nothing here; property mutation on a const-bound object is legal everywhere."
        },
        "bestPractices": "Default to `const`, use `let` only when you must rebind, and never use `var` in new code."
      },
      {
        "q": "Your `fetch` call gets a 500 from the server. What does the Promise do?",
        "opts": [
          "Rejects — your `.catch` handles it",
          "Resolves normally — you must check `res.ok` yourself",
          "Retries once automatically before rejecting"
        ],
        "answer": 1,
        "whyCorrect": "`fetch` only rejects on network failure — a 4xx or 5xx is a *successful* HTTP exchange as far as fetch is concerned, so `res.ok` is your job. Forgetting this is the most common bug in a first React app.",
        "whyWrong": {
          "0": "The catch only fires for network-level failures (DNS, offline, aborted) — an error status code sails straight into your `.then`.",
          "2": "fetch has no retry logic at all; retries come from libraries like React Query, not the platform."
        },
        "bestPractices": "Every fetch wrapper starts with `if (!res.ok) throw new Error(\\`HTTP ${res.status}\\`)` — make it muscle memory."
      },
      {
        "q": "A closure remembers variables from...",
        "opts": [
          "Where the function was defined — a live link, not a copy",
          "Where the function is called",
          "A frozen snapshot taken at definition time"
        ],
        "answer": 0,
        "whyCorrect": "A closure keeps a live reference to the variables in the scope where it was *defined* — that's how `makeCounter`'s inner function keeps incrementing the same `count` across calls.",
        "whyWrong": {
          "1": "Call site is irrelevant — that confusion is about `this` in old-style functions, not closures.",
          "2": "Closures capture *by reference*, not by value — that's exactly why loop counters and stale React state bite."
        },
        "bestPractices": "When a React value seems 'stuck' at an old value inside an effect, suspect a closure capturing stale state."
      }
    ],
    "junior": [
      {
        "q": "An Express middleware runs its logic but never calls `next()` and never responds. What happens to the request?",
        "opts": [
          "Express advances to the next middleware when the function returns",
          "It hangs until the client times out",
          "Express throws and routes to the error handler"
        ],
        "answer": 1,
        "whyCorrect": "Control in the middleware chain is explicit — each middleware either responds or calls `next()`. Do neither and the request just sits there until the client gives up.",
        "whyWrong": {
          "0": "Express never auto-advances; returning from the function without `next()` leaves the chain parked forever.",
          "2": "The error handler only fires on a thrown error or `next(err)` — silently doing nothing triggers nothing."
        },
        "bestPractices": "Every middleware ends in exactly one of two ways: a response, or `next()`. Audit for the third way — neither."
      },
      {
        "q": "A `useEffect` with an empty `[]` deps array reads a prop inside its body. What's the bug?",
        "opts": [
          "The effect re-runs on every render anyway",
          "The effect captured a stale closure — the prop is frozen at its first-render value",
          "React automatically adds the prop to the deps for you"
        ],
        "answer": 1,
        "whyCorrect": "`[]` means run once, and the effect closes over whatever the prop was on that first render — future prop changes never reach it. This is the classic stale-closure trap the exhaustive-deps lint exists to catch.",
        "whyWrong": {
          "0": "Empty array genuinely means once — the problem isn't extra runs, it's the frozen value inside the one run.",
          "2": "React never edits your deps array; the lint rule *warns* you, but the code ships broken if you ignore it."
        },
        "bestPractices": "Trust the exhaustive-deps lint. If a dep makes the effect run too often, fix the dep's stability (useRef, functional setters), don't delete it."
      },
      {
        "q": "Your POST endpoint creates a new user. Which response is the contract?",
        "opts": [
          "`200 OK` with the user in the body",
          "`201 Created` with a `Location` header pointing at the new resource",
          "`204 No Content` — creation implies nothing to return"
        ],
        "answer": 1,
        "whyCorrect": "`201` says something new exists, and the paired `Location` header tells the client exactly where to find it — clients can follow it without parsing your body shape.",
        "whyWrong": {
          "0": "`200` works but wastes the signal — clients can't distinguish 'created' from 'read', and you skip the Location convention.",
          "2": "`204` is for operations with genuinely nothing to say, like DELETE — a create has a new resource to point at."
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
        "bestPractices": "One listener at the root beats a thousand at the leaves — and `closest()` beats manual parent-walking loops."
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
          "`WHERE count(p.id) >= 5`",
          "`HAVING count(p.id) >= 5`",
          "Either — WHERE and HAVING are interchangeable with aggregates"
        ],
        "answer": 1,
        "whyCorrect": "`WHERE` filters rows *before* grouping; `HAVING` filters groups *after* aggregation — a condition on `count()` can only exist once groups exist, so it must be HAVING.",
        "whyWrong": {
          "0": "Postgres rejects aggregates in WHERE outright, because WHERE runs before GROUP BY has produced anything to count.",
          "2": "They run at different stages of execution and are never interchangeable — mixing them up is how dashboards lie."
        },
        "bestPractices": "Read queries in execution order — FROM, WHERE, GROUP BY, HAVING, SELECT, ORDER BY — and most 'why didn't my filter work' bugs dissolve."
      },
      {
        "q": "You curl a POST with a JSON body but forget the `Content-Type: application/json` header. What does `req.body` contain?",
        "opts": [
          "Nothing useful — `express.json()` only parses when the header matches",
          "The parsed object — Express sniffs the body format",
          "Express returns 415 Unsupported Media Type automatically"
        ],
        "answer": 0,
        "whyCorrect": "`express.json()` keys off the Content-Type header; without it the parser skips the body entirely and `req.body` arrives undefined/empty.",
        "whyWrong": {
          "1": "There's no content sniffing — the middleware trusts the header, full stop.",
          "2": "Express does nothing automatic here; your handler just sees a missing body and probably 400s for the wrong reason."
        },
        "bestPractices": "When an API 'ignores' your payload, check the Content-Type header before anything else — `curl -i` shows you both sides."
      }
    ],
    "senior": [
      {
        "q": "A `/users` list page that also shows each user's posts takes 3 seconds. What's the right first move?",
        "opts": [
          "Add indexes to every column on the posts table",
          "Confirm and fix the N+1 with eager-loading first, then `EXPLAIN ANALYZE` and index the FK",
          "Raise the DB connection pool size so the queries run in parallel"
        ],
        "answer": 1,
        "whyCorrect": "Round-trip count and per-query speed are different problems, fixed in that order — a perfect index on a query you run N times is still N round trips. Collapse the N+1 with a JOIN or ORM `include`, then let EXPLAIN tell you if the remaining query needs an index.",
        "whyWrong": {
          "0": "Blanket indexing taxes every write and doesn't touch the real bottleneck: N separate network hops.",
          "2": "Parallelizing N+1 queries hides the symptom while multiplying DB load — the structural fix is one query, not fifty concurrent ones."
        },
        "bestPractices": "Diagnose by counting queries in the log, not by guessing. Your slow page is usually N+1; your second-slowest is a missing FK index."
      },
      {
        "q": "Why not add an index to every column 'just in case'?",
        "opts": [
          "Postgres limits how many indexes a table can carry",
          "Every INSERT and UPDATE must maintain every index touching the changed column — reads get faster, writes pay for it",
          "B-tree indexes only work on primary key columns"
        ],
        "answer": 1,
        "whyCorrect": "Indexes are a read/write trade: five indexes on a hot table turns every write into six disk writes. Index foreign keys and the columns hot queries filter or sort on — and measure with `EXPLAIN ANALYZE` before adding more.",
        "whyWrong": {
          "0": "There's no meaningful cap — the cost is per-write maintenance, not a hard limit.",
          "2": "You can index any column; PRIMARY KEY and UNIQUE just happen to get one for free."
        },
        "bestPractices": "A 'Seq Scan' in EXPLAIN on a big table means no usable index; on a tiny table it means the index would have been pure write cost."
      },
      {
        "q": "You add `WHERE p.published = true` to a query that LEFT JOINs users to posts. What actually happens?",
        "opts": [
          "The LEFT JOIN is silently demoted to INNER — users with zero posts vanish from the result",
          "Nothing changes semantically — it just filters earlier",
          "Postgres raises an error because WHERE can't reference the right table of a LEFT JOIN"
        ],
        "answer": 0,
        "whyCorrect": "For matchless users the right side is all NULLs, so `p.published = true` evaluates false and the row is filtered out — exactly the rows the LEFT JOIN existed to keep. Put the condition in the JOIN's ON clause instead.",
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
          "You can't un-issue it — you wait for `exp` or keep a blocklist, which is just stateful sessions in disguise",
          "Rotate the signing secret to invalidate that one user's token"
        ],
        "answer": 1,
        "whyCorrect": "The token IS the state, signed and self-contained — the server has nothing to delete. That's why the practical compromise is short-lived access tokens (5–15 min) plus a revocable refresh token in the DB.",
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
          "It's too fast — GPUs try billions of hashes per second, so a leaked DB gets cracked overnight",
          "SHA-256 is reversible with enough compute"
        ],
        "answer": 1,
        "whyCorrect": "Password hashing must be *intentionally slow* — bcrypt, Argon2, and scrypt all take a tunable work factor precisely so each guess costs real money. Speed, not output size, is the vulnerability.",
        "whyWrong": {
          "0": "256 bits is plenty of output; the problem is how cheaply an attacker can compute candidates.",
          "2": "SHA-256 isn't reversible — attackers don't reverse it, they brute-force forward at GPU speed, which fast hashes make economical."
        },
        "bestPractices": "bcrypt cost 12+ or Argon2id, use the library's `compare` (timing-safe), and re-hash on login when the stored cost is below your floor."
      },
      {
        "q": "In cache-aside, why does `updateUser` DELETE the Redis key instead of overwriting it with the new value?",
        "opts": [
          "DEL is a cheaper Redis operation than SET",
          "Overwriting risks caching a half-updated object — deleting lets the next reader refill from the canonical DB row",
          "Redis refuses to overwrite keys that carry a TTL"
        ],
        "answer": 1,
        "whyCorrect": "The DB is the source of truth; writing your patched object back to the cache risks shipping an incomplete or stale composite. Delete-and-refill keeps consistency biased toward the DB.",
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
        "bestPractices": "The DB is a ratchet, not a yo-yo: every change is a migration, `db push` never touches prod, and applied migration files are immutable."
      }
    ],
    "distinguished": [
      {
        "q": "A JWT verifier is configured with `algorithms: ['HS256', 'RS256']`. What's the risk?",
        "opts": [
          "Algorithm confusion — letting the token pick between symmetric and asymmetric verification is a classic CVE; pin exactly one",
          "Only performance — RS256 verification is slower than HS256",
          "None — accepting more algorithms just improves compatibility"
        ],
        "answer": 0,
        "whyCorrect": "When the verifier accepts multiple algorithm families, an attacker can exploit the mismatch between how HS256 and RS256 keys are used — the same class of real-world CVE as `alg: none`. Pinning one algorithm (as an explicit array of one) is the defense, and it's the exact footgun PASETO removes by versioning the crypto so there's no `alg` field to swap.",
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
          "It's fire-and-forget: a subscriber whose connection blips for 200ms misses those messages permanently — no durability, no replay",
          "Redis caps the number of channels well below your group count"
        ],
        "answer": 1,
        "whyCorrect": "Classic Pub/Sub delivers to currently-connected subscribers and immediately forgets — lossy by design. For chat that's catastrophic on every reconnect; the durable options are Redis Streams (consumer groups + checkpointing) or Kafka partitioned by conversation.",
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
        "bestPractices": "Pick the pattern whose failure mode you can survive: a cache-aside Redis crash costs latency, never data; a write-back crash costs the data itself."
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
          "To detect half-open connections — proxies, mobile NAT, and LB idle timeouts silently drop the TCP link while neither end's socket object notices",
          "The WebSocket spec requires a keepalive to hold the upgrade"
        ],
        "answer": 1,
        "whyCorrect": "Intermediaries kill idle TCP connections without telling either side — the client thinks it's connected, the server has forgotten it, and messages silently stop flowing. A missed pong lets you `terminate()` and trigger reconnection; it's the single most common production WebSocket bug.",
        "whyWrong": {
          "0": "Heartbeats don't make delivery faster — they make dead connections *detectable*.",
          "2": "The spec defines ping/pong frames but mandates no cadence; the 30s rhythm is operational self-defense, not compliance."
        },
        "bestPractices": "Heartbeat is non-negotiable even in v1 — and pair it with at-least-once thinking: clients resend on reconnect, so both ends dedupe by a client-generated message ID."
      }
    ]
  },

  // cybersec — authored 2026-07 (workflow: infralearn-content-fanout),
  // grounded in src/data/lessons/cybersec.js. Unlocks daily practice,
  // journey encounters, and minion battles for this path.
  cybersec: {
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
        "bestPractices": "Keep the two gates separate in code: an authn dependency that returns identity or 401, an authz check that returns allow/deny or 403."
      },
      {
        "q": "What makes a cryptographic hash different from encryption?",
        "opts": [
          "A hash is one-way — you can't recover the input from the output",
          "A hash uses a public/private key pair",
          "A hash is just faster encryption"
        ],
        "answer": 0,
        "whyCorrect": "A hash turns any input into a fixed-size fingerprint with no way back. That's why it's used for integrity checks — and why it's the wrong tool when you ever need the data back.",
        "whyWrong": {
          "1": "Key pairs belong to asymmetric encryption (RSA, Ed25519). Hashing uses no key at all — same input, same fingerprint, every time.",
          "2": "Encryption is reversible with the key; a hash is designed to be irreversible. Speed isn't the distinction — direction is."
        },
        "bestPractices": "Pick the family by the job: hash for fingerprints, symmetric for bulk data, asymmetric for key exchange and signatures."
      },
      {
        "q": "What is the actual fix for SQL injection?",
        "opts": [
          "Strip quote characters from user input",
          "Encrypt the database at rest",
          "Parameterized queries — input is bound as data, never parsed as code"
        ],
        "answer": 2,
        "whyCorrect": "Parameterization sends the SQL and the values separately, so user input can never rewrite the query's structure. Every SQLi is the same bug: input that should have been data got parsed as code.",
        "whyWrong": {
          "0": "Blocklist sanitization always has a bypass — hex encodings and Unicode tricks defeat naive quote filters. Parameterize instead.",
          "1": "Encryption at rest protects against a stolen disk. The injected query runs with the app's own credentials and gets decrypted data like any legitimate query."
        },
        "bestPractices": "Treat every raw/f-string escape hatch in your ORM (raw(), extra(), cursor.execute) as a hand-rolled query and audit it like one."
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
        "bestPractices": "Add a pre-commit scanner (gitleaks, truffleHog) so secrets are caught before push, not after."
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
          "It's too fast — GPUs crack low-entropy passwords in milliseconds"
        ],
        "answer": 2,
        "whyCorrect": "Passwords are low-entropy human strings, so the defense is making each guess expensive. bcrypt (cost ≥ 12) and Argon2id are deliberately slow, salted, and memory-hard to frustrate GPU/ASIC attackers.",
        "whyWrong": {
          "0": "SHA-256 is fine for integrity and fingerprints — it's not broken, it's mis-applied. The problem is speed, not weakness.",
          "1": "256 bits is plenty. The attacker isn't reversing the hash — they're guessing inputs at GPU speed, and a fast hash lets them."
        },
        "bestPractices": "Use Argon2id for new systems (the OWASP recommendation) and re-hash on login when cost parameters have drifted upward."
      },
      {
        "q": "Why does TLS use asymmetric crypto only to set up the connection, then switch to symmetric?",
        "opts": [
          "Asymmetric is too slow for bulk data — it's used once to agree on a fast symmetric session key",
          "Symmetric encryption is more secure",
          "Symmetric keys are easier to rotate"
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
        "bestPractices": "Set SameSite explicitly on every session cookie, and watch for GET endpoints with side effects — Lax still allows those across sites."
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
          "Smaller node_modules",
          "Automatic security patches",
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
          "Authentication — impersonating a user gets harder",
          "Both equally"
        ],
        "answer": 1,
        "whyCorrect": "MFA is stronger authentication: a second factor makes it harder to *be* Alice. It says nothing about what Alice's identity — or her hijacked session — is allowed to touch once inside.",
        "whyWrong": {
          "0": "MFA doesn't change what Alice can do after login — a hijacked post-login session carries all her permissions.",
          "2": "MFA lives entirely at the identity gate. Least privilege, deny-default, and RBAC are what strengthen authorization."
        },
        "bestPractices": "Strengthen the two gates independently: MFA/FIDO2 for authn, least-privilege and deny-default for authz."
      }
    ],
    "senior": [
      {
        "q": "In envelope encryption, why encrypt data with a DEK and then wrap the DEK with a KMS-held KEK?",
        "opts": [
          "Two layers of encryption are twice as hard to brute-force",
          "You can rotate the KEK by re-wrapping one small DEK instead of re-encrypting petabytes",
          "The DEK provides forward secrecy"
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
          "The key policy doesn't list your role — key policy and IAM must BOTH allow",
          "KMS requires MFA for decrypt operations",
          "The key was rotated and old ciphertext is unreadable"
        ],
        "answer": 0,
        "whyCorrect": "Key policies are not IAM policies: the key policy gates the key itself, IAM gates the principal, and the request succeeds only when both allow. 'My role has kms:* but it still fails' is the classic symptom.",
        "whyWrong": {
          "1": "MFA conditions are optional policy add-ons, not a KMS default behavior.",
          "2": "KMS rotation keeps old backing material precisely so previously encrypted ciphertext still decrypts."
        },
        "bestPractices": "Debug the AND-gate in order: IAM allows the action? Key policy lists the principal? Conditions like kms:ViaService match? CloudTrail shows which one denied."
      },
      {
        "q": "After adding a NACL to a subnet, outbound requests succeed but the responses never arrive. Why?",
        "opts": [
          "NACLs are stateless — you must open the return direction explicitly",
          "The security group is blocking return traffic",
          "NACLs only apply to ingress"
        ],
        "answer": 0,
        "whyCorrect": "Security groups track connections; NACLs don't. A stateless subnet filter needs explicit allows in both directions or return packets are silently dropped — the classic stateful/stateless mixup.",
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
          "CORS gates who can READ the response — the forged request is still sent, and the side effect already happened",
          "CORS is enforced by the server, which the attacker controls"
        ],
        "answer": 1,
        "whyCorrect": "A CSRF attacker never needs to see the response — the transfer already executed under the victim's cookie. CORS controls reading responses; SameSite and CSRF tokens control whether the request is honored at all.",
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
        "bestPractices": "Also disable auto-redirects or re-validate every hop — a safe URL that 302s to the metadata IP is the same bug."
      }
    ],
    "distinguished": [
      {
        "q": "Why do teams run a new IPS rule in alert-only mode for a week before enabling block?",
        "opts": [
          "To collect enough samples to train the anomaly model",
          "An IPS blocks inline — a noisy rule can knock prod offline faster than the attack it targets",
          "Alert-only mode is required by change-management standards"
        ],
        "answer": 1,
        "whyCorrect": "An IDS that fires wrong wastes an analyst's time; an IPS that fires wrong drops legitimate traffic in-line. The soak period measures the false-positive rate while the blast radius is still zero.",
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
          "Operational friction — every new service-to-service call needs an explicit allow, and a forgotten rule looks like a mysterious 'connection refused'"
        ],
        "answer": 2,
        "whyCorrect": "Deny-default fails closed: something's broken and visible, instead of everything reachable and silent. You pay in onboarding speed and confusing timeouts; you get a blast radius of one service instead of the whole flat network.",
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
          "Immutability must be structural — WORM storage or hash chains — because anyone with UPDATE rights makes the log unprovable"
        ],
        "answer": 2,
        "whyCorrect": "If you can't prove an entry wasn't edited after the fact, it's a story, not evidence. S3 Object Lock in compliance mode, a hash-chained log, or a write-only separate account make tampering structurally impossible or detectable.",
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
          "Two valid credentials exist at once — a stolen v1 keeps working until you cut over",
          "The vault becomes a single point of failure"
        ],
        "answer": 1,
        "whyCorrect": "Dual-accept trades a wider attack window for a zero-downtime rollout: v1 stays valid while clients migrate to v2. The judgment is sizing the window — long enough that nothing 401s mid-deploy, short enough that a compromised v1 dies fast.",
        "whyWrong": {
          "0": "Well-built clients hot-reload or pick up v2 on their normal rollout — a double restart isn't the cost.",
          "2": "The vault's availability story is real but orthogonal — it's the same before, during, and after rotation."
        },
        "bestPractices": "Shrink the problem at the root: short TTLs and OIDC/workload identity mean there's rarely a static key to dual-accept at all."
      }
    ]
  },
};

// Day counter aligned to the user's LOCAL calendar — the same boundary the
// store's isoDay() streak logic uses. Seeding with the raw UTC epoch-day
// flipped the "daily" question set at 4-7pm local for US timezones,
// mid-session, and disagreed with the streak day.
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

// pickDailySession — return 5 questions sampled deterministically by day index,
// drawn from the full DAILY_QUESTIONS pool (ignores active path / level). Same
// 5 questions across the LOCAL calendar day; rotates at local midnight.
export function pickDailySession() {
  const POOL = Object.values(DAILY_QUESTIONS).flatMap((byLevel) =>
    Object.values(byLevel).flat()
  );
  if (POOL.length === 0) return [];
  const dayIndex = localDayIndex();
  const out = [];
  for (let i = 0; i < 5; i += 1) {
    out.push(POOL[(dayIndex * 137 + i * 31) % POOL.length]);
  }
  return out;
}
