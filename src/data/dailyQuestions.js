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
