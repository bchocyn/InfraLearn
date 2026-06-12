// Unlockable nature backgrounds for the Byte Beast tab.
export const BACKGROUNDS = [
  { id: 'meadow',  name: 'Green Meadow', req: null,                       grad: ['#8FC5E8', '#7EB058'] },
  { id: 'forest',  name: 'Deep Forest',  req: 'Fundamentals · 6 lessons', grad: ['#A8D8E8', '#3A5530'] },
  { id: 'sunset',  name: 'Sunset Ridge', req: 'DevOps · Gold',            grad: ['#F5A85E', '#7E5A8E'] },
  { id: 'flowers', name: 'Flower Field', req: 'SWE · 10 lessons',         grad: ['#A8D8E8', '#7EB058'] },
  { id: 'snow',    name: 'Snowpeak',     req: 'MLOps · Gold',             grad: ['#B8D8E8', '#E8F2F8'] },
  { id: 'autumn',  name: 'Autumn Wood',  req: 'ML Eng · 100%',            grad: ['#E89A5E', '#5A3A22'] },
  { id: 'twilight',name: 'Twilight Vale',req: 'FAANG · Gold',             grad: ['#5E5A8E', '#E89A8E'] },
  { id: 'falls',   name: 'Hidden Falls', req: 'All paths · 100%',         grad: ['#7EC8D8', '#4E8B5E'] },
];

// Career paths. Lesson IDs and titles align with `lessons_extracted.json` so the
// real lesson body content renders in <Lesson> via lookup by id. Minutes are
// estimated from extracted word count; `deep: true` flags theory-heavy lessons
// and `hasMathQuiz: true` flags ones with formulas / loss math worth quizzing.
//
// Schema additions (v3 path screen):
//   kind: 'concept' | 'sd' | 'lab'  — display row variant on the path screen.
//                                     Defaults to 'concept' when omitted.
//   section: string                  — section header above the row. Consecutive
//                                     entries with the same section collapse
//                                     into one card on the path screen.
//   tagline?: string                 — second-line text for SD insight rows.
//   duration?: string                — human-readable run length for labs
//                                     ("4H"). `min` stays canonical for stats.
//   unlockAfter?: string[]           — explicit gate for labs (lesson IDs).
//                                     If omitted, lab unlocks once every
//                                     concept in its section + all sections
//                                     above are complete.
//
// Legacy fields preserved:
//   sd: true / lab: true             — older readers still see these flags on
//                                     the relevant entries.
export const PATHS = {
  fundamentals: {
    name: 'Fundamentals', icon: '◆',
    lessons: [
      { id: 'py-variables',      title: 'Variables',                   min: 11, kind: 'concept', section: 'FUNDAMENTALS · ESSENTIALS', tierLevel: 'junior' },
      { id: 'py-types',          title: 'Numbers, Strings & Booleans', min: 5,  kind: 'concept', section: 'FUNDAMENTALS · ESSENTIALS', tierLevel: 'junior' },
      { id: 'py-strings',        title: 'Strings',                     min: 5,  kind: 'concept', section: 'FUNDAMENTALS · ESSENTIALS', tierLevel: 'junior' },
      { id: 'py-lists',          title: 'Lists',                       min: 5,  kind: 'concept', section: 'FUNDAMENTALS · ESSENTIALS', tierLevel: 'junior' },
      { id: 'py-conditionals',   title: 'Conditionals',                min: 5,  kind: 'concept', section: 'FUNDAMENTALS · ESSENTIALS', tierLevel: 'junior' },
      { id: 'py-loops',          title: 'Loops',                       min: 5,  kind: 'concept', section: 'FUNDAMENTALS · ESSENTIALS', tierLevel: 'junior' },
      { id: 'py-functions',      title: 'Functions',                   min: 5,  kind: 'concept', section: 'FUNDAMENTALS · ESSENTIALS', tierLevel: 'junior' },
      { id: 'py-dicts',          title: 'Dictionaries',                min: 5,  kind: 'concept', section: 'FUNDAMENTALS · ESSENTIALS', tierLevel: 'junior' },
      { id: 'py-oop',            title: 'Classes & Objects',           min: 5,  kind: 'concept', section: 'FUNDAMENTALS · ESSENTIALS', tierLevel: 'junior' },
      { id: 'py-exceptions',     title: 'Exception Handling',          min: 5,  kind: 'concept', section: 'FUNDAMENTALS · ESSENTIALS', tierLevel: 'junior' },
      { id: 'py-fileio',         title: 'Files & I/O',                 min: 5,  kind: 'concept', section: 'FUNDAMENTALS · ESSENTIALS', tierLevel: 'junior' },
      { id: 'py-modules',        title: 'Modules & Imports',           min: 5,  kind: 'concept', section: 'FUNDAMENTALS · ESSENTIALS', tierLevel: 'junior' },
      { id: 'python-basics',     title: 'Python Fundamentals',         min: 10, kind: 'concept', section: 'FUNDAMENTALS · ESSENTIALS', tierLevel: 'junior' },
      { id: 'python-idioms',     title: 'Python Idioms',               min: 14, kind: 'concept', section: 'FUNDAMENTALS · ESSENTIALS', tierLevel: 'junior' },
      { id: 'cli-navigate',      title: 'Navigating the filesystem',   min: 5,  kind: 'concept', section: 'FUNDAMENTALS · ESSENTIALS', tierLevel: 'junior' },
      { id: 'cli-files',         title: 'Working with files',          min: 5,  kind: 'concept', section: 'FUNDAMENTALS · ESSENTIALS', tierLevel: 'junior' },
      { id: 'cli-pipes',         title: 'Pipes & Redirects',           min: 5,  kind: 'concept', section: 'FUNDAMENTALS · ESSENTIALS', tierLevel: 'junior' },
      { id: 'cli-grep',          title: 'Searching with grep',         min: 5,  kind: 'concept', section: 'FUNDAMENTALS · ESSENTIALS', tierLevel: 'junior' },
      { id: 'cli-env',           title: 'Environment Variables',       min: 5,  kind: 'concept', section: 'FUNDAMENTALS · ESSENTIALS', tierLevel: 'junior' },
      { id: 'cli-ssh',           title: 'SSH Basics',                  min: 5,  kind: 'concept', section: 'FUNDAMENTALS · ESSENTIALS', tierLevel: 'junior' },
      { id: 'git-first-commit',  title: 'Your first commit',           min: 5,  kind: 'concept', section: 'FUNDAMENTALS · ESSENTIALS', tierLevel: 'junior' },
      { id: 'git-remote-basics', title: 'Pushing to GitHub',           min: 5,  kind: 'concept', section: 'FUNDAMENTALS · ESSENTIALS', tierLevel: 'junior' },
      { id: 'git-branches',      title: 'Branching & Merging',         min: 5,  kind: 'concept', section: 'FUNDAMENTALS · ESSENTIALS', tierLevel: 'junior' },
      { id: 'git-conflicts',     title: 'Resolving Merge Conflicts',   min: 5,  kind: 'concept', section: 'FUNDAMENTALS · ESSENTIALS', tierLevel: 'junior' },
      { id: 'net-http',          title: 'HTTP Fundamentals',           min: 5,  kind: 'concept', section: 'FUNDAMENTALS · ESSENTIALS', tierLevel: 'junior' },
      { id: 'net-dns',           title: 'How DNS Works',               min: 5,  kind: 'concept', section: 'FUNDAMENTALS · ESSENTIALS', tierLevel: 'junior' },
      { id: 'net-tls',           title: 'HTTPS & TLS',                 min: 6,  deep: true, kind: 'concept', section: 'FUNDAMENTALS · ESSENTIALS', tierLevel: 'senior' },
      { id: 'processes-threads', title: 'Processes vs Threads',        min: 9,  deep: true, kind: 'concept', section: 'FUNDAMENTALS · ESSENTIALS', tierLevel: 'senior' },
      { id: 'virtual-memory',    title: 'Virtual Memory & Paging',     min: 13, deep: true, kind: 'concept', section: 'FUNDAMENTALS · ESSENTIALS', tierLevel: 'senior' },
      { id: 'file-systems',      title: 'File Systems',                min: 12, deep: true, kind: 'concept', section: 'FUNDAMENTALS · ESSENTIALS', tierLevel: 'senior' },
      // Restored from legacy v14 archive (formerly orphan IDs):
      { id: 'f1',                title: 'How a computer actually works', min: 6, kind: 'concept', section: 'FUNDAMENTALS · ESSENTIALS', tierLevel: 'junior' },
      { id: 'd2',                title: 'Bash scripting',                min: 6, kind: 'concept', section: 'FUNDAMENTALS · ESSENTIALS', tierLevel: 'junior' },
      // Programming Foundations — the "before you can really learn DevOps/MLOps" gap-fillers:
      { id: 'fund-functions-scope', title: 'Functions, scope, closures',        tagline: 'A function is a value that carries its environment',   min: 8, section: 'Programming Foundations', kind: 'concept', tierLevel: 'junior' },
      { id: 'fund-error-handling',  title: 'Error handling philosophy',         tagline: 'Throw, catch, or bubble — pick on purpose',            min: 7, section: 'Programming Foundations', kind: 'concept', tierLevel: 'junior' },
      { id: 'fund-testing-intro',   title: 'Testing your first function',       tagline: 'Arrange · Act · Assert — and name it like a sentence', min: 8, section: 'Programming Foundations', kind: 'concept', tierLevel: 'junior' },
      { id: 'fund-debugging',       title: 'Debugging beyond print statements', tagline: 'Breakpoints, bisects, and rubber ducks',               min: 7, section: 'Programming Foundations', kind: 'concept', tierLevel: 'junior' },
      // Data Structures Basics — the vocabulary every dev needs:
      { id: 'fund-arrays-lists',    title: 'Arrays, lists, and big-O on access',   tagline: 'Contiguous memory and the cost of a front-insert', min: 9, section: 'Data Structures Basics', kind: 'concept', tierLevel: 'junior' },
      { id: 'fund-hash-maps',       title: 'Hash maps and how lookup is O(1)',     tagline: 'An array with a math function on the keys',        min: 9, section: 'Data Structures Basics', kind: 'concept', tierLevel: 'junior' },
      { id: 'fund-trees-recursion', title: 'Trees, traversal, and recursion',      tagline: 'Same shape repeated — base case, then shrink',     min: 9, section: 'Data Structures Basics', kind: 'concept', tierLevel: 'junior' },
      { id: 'fund-stacks-queues',   title: 'Stacks, queues, and what they enable', tagline: 'LIFO vs FIFO — ordering is half the structure',    min: 9, section: 'Data Structures Basics', kind: 'concept', tierLevel: 'junior' },
      // Deeper-cuts archive — different angle from the canonical lesson:
      { id: 'f2',                title: 'Threads & the GIL',           min: 7, deep: true, kind: 'concept', section: 'DEEPER CUTS', tierLevel: 'senior' },
      { id: 'f3',                title: 'pwd / ls / cd — directory commands', min: 5, kind: 'concept', section: 'DEEPER CUTS', tierLevel: 'junior' },
      { id: 'f4',                title: 'HTTP at a glance',             min: 5, kind: 'concept', section: 'DEEPER CUTS', tierLevel: 'junior' },
      { id: 'f5',                title: 'Servers and clients explained', min: 6, kind: 'concept', section: 'DEEPER CUTS', tierLevel: 'junior' },
      { id: 'f6',                title: 'Git snapshots, not diffs',     min: 6, kind: 'concept', section: 'DEEPER CUTS', tierLevel: 'junior' },
    ],
  },
  devops: {
    name: 'DevOps', icon: '🛠',
    lessons: [
      // ── Container Foundations ──────────────────────────────────────────────
      { id: 'ci-cd',                title: 'CI/CD Pipelines',                    min: 7,  kind: 'concept', section: 'CONTAINER FOUNDATIONS', tierLevel: 'junior' },
      { id: 'yaml-basics',          title: "YAML — the config language you can't avoid", min: 6, kind: 'concept', section: 'CONTAINER FOUNDATIONS', tierLevel: 'junior' },
      { id: 'compose-stack',        title: 'Multi-Service Docker Compose Stack', min: 25, kind: 'lab', lab: true, section: 'CONTAINER FOUNDATIONS', duration: '2H', tierLevel: 'junior',
        milestones: [
          { id: 'compose-file', title: 'Write the docker-compose.yml' },
          { id: 'deps-health',  title: 'Add health checks + depends_on' },
          { id: 'env-secrets',  title: 'Externalize env + secrets' },
          { id: 'up-tear',      title: 'Bring it up and tear it down cleanly' },
        ] },
      { id: 'sd-isolation',         title: 'Why processes need isolation — namespaces & cgroups',
        min: 6, kind: 'sd', sd: true, section: 'CONTAINER FOUNDATIONS',
        tagline: 'Why processes need isolation — namespaces & cgroups', tierLevel: 'junior' },
      { id: 'sd-container-networking', title: 'Container networking — bridges, overlays, and the gotchas',
        min: 6, kind: 'sd', sd: true, section: 'CONTAINER FOUNDATIONS',
        tagline: 'Container networking — bridges, overlays, and the gotchas', tierLevel: 'junior' },
      { id: 'hardened-container',   title: 'Hardened Container Build',           min: 13, kind: 'lab', lab: true, section: 'CONTAINER FOUNDATIONS', duration: '4H', tierLevel: 'junior',
        milestones: [
          { id: 'build',  title: 'Build the base image' },
          { id: 'scan',   title: 'Scan for CVEs' },
          { id: 'harden', title: 'Harden the runtime' },
        ] },

      // ── Orchestration ──────────────────────────────────────────────────────
      { id: 'gh-actions-ci',        title: 'GitHub Actions Multi-Stage CI/CD',   min: 5,  kind: 'concept', section: 'ORCHESTRATION', tierLevel: 'junior' },
      { id: 'sd-loadbalancers-k8s', title: 'Load balancers in K8s — same patterns, diff layer',
        min: 8, kind: 'sd', sd: true, section: 'ORCHESTRATION',
        tagline: 'Load balancers in K8s — same patterns, diff layer', tierLevel: 'junior' },
      { id: 'sd-blue-green-canary', title: 'Blue-green vs canary — making it safe to deploy',
        min: 8, kind: 'sd', sd: true, section: 'ORCHESTRATION',
        tagline: 'Blue-green vs canary — making it safe to deploy', tierLevel: 'junior' },
      { id: 'k8s-lab',              title: 'Kubernetes Deploy Lab',              min: 14, deep: true, kind: 'lab', lab: true, section: 'ORCHESTRATION', duration: '4H', tierLevel: 'senior',
        milestones: [
          { id: 'deploy',  title: 'Write the Deployment manifest' },
          { id: 'service', title: 'Expose it via a Service' },
          { id: 'ingress', title: 'Route external traffic with Ingress' },
          { id: 'health',  title: 'Add readiness & liveness probes' },
        ] },

      // ── Pipelines & Observability ──────────────────────────────────────────
      { id: 'cicd-rollback',        title: 'CI/CD Pipeline with Rollback',       min: 14, kind: 'concept', section: 'PIPELINES & OBSERVABILITY', tierLevel: 'junior' },
      { id: 'sd-idempotency-deploys', title: 'Idempotency — why your deploy can run twice safely',
        min: 6, kind: 'sd', sd: true, section: 'PIPELINES & OBSERVABILITY',
        tagline: 'Idempotency — why your deploy can run twice safely', tierLevel: 'junior' },
      { id: 'prometheus-stack',     title: 'Prometheus + Grafana Monitoring Stack', min: 5, kind: 'concept', section: 'PIPELINES & OBSERVABILITY', tierLevel: 'junior' },
      { id: 'health-watchdog',      title: 'Service Health Watchdog',            min: 13, kind: 'concept', section: 'PIPELINES & OBSERVABILITY', tierLevel: 'junior' },

      // ── Reliability Extras (kept from previous v2 path) ────────────────────
      { id: 'terraform-vpc',        title: 'Terraform AWS VPC Module',           min: 5,  kind: 'concept', section: 'RELIABILITY EXTRAS', tierLevel: 'junior' },
      { id: 'feature-flag-service', title: 'Feature Flag Service from Scratch',  min: 5,  kind: 'concept', section: 'RELIABILITY EXTRAS', tierLevel: 'junior' },
      { id: 'circuit-breaker-mesh', title: 'Circuit Breaker + Retry Mesh',       min: 5,  kind: 'concept', section: 'RELIABILITY EXTRAS', tierLevel: 'junior' },

      // ── Agile × DevOps ─────────────────────────────────────────────────────
      { id: 'agile-continuous',  title: 'Continuous everything',     min: 10, kind: 'concept', section: 'AGILE × DEVOPS', tierLevel: 'senior' },
      { id: 'agile-trunk-based', title: 'Trunk-based development',   min: 10, kind: 'concept', section: 'AGILE × DEVOPS', tierLevel: 'senior' },

      // ── Cloud Foundations ──────────────────────────────────────────────────
      { id: 'cloud-models',      title: 'Cloud service models',          min: 7, kind: 'concept', section: 'Cloud Foundations', tierLevel: 'junior' },
      { id: 'cloud-providers',   title: 'The three providers',           min: 8, kind: 'concept', section: 'Cloud Foundations', tierLevel: 'junior' },
      { id: 'cloud-regions',     title: 'Regions, AZs, and the edge',    min: 6, kind: 'concept', section: 'Cloud Foundations', tierLevel: 'junior' },
      { id: 'cloud-iam',         title: 'IAM fundamentals',              min: 9, kind: 'concept', section: 'Cloud Foundations', tierLevel: 'junior' },
      { id: 'cloud-networking',  title: 'Cloud networking primitives',   min: 9, kind: 'concept', section: 'Cloud Foundations', tierLevel: 'junior' },
      { id: 'cloud-cost',        title: 'Cost models and FinOps basics', min: 8, kind: 'concept', section: 'Cloud Foundations', tierLevel: 'junior' },
      { id: 'devops-role-map',   title: 'DevOps vs SRE vs Platform Engineering', tagline: 'Three job titles, one mission: keep the system reliable', min: 8, kind: 'concept', section: 'Cloud Foundations', tierLevel: 'junior' },

      // ── Cloud Operations ──────────────────────────────────────────────────
      { id: 'cloud-storage',       title: 'Object, block, and file storage',      min: 8, kind: 'concept', section: 'Cloud Operations', tierLevel: 'junior' },
      { id: 'cloud-databases',     title: 'Managed databases',                    min: 9, kind: 'concept', section: 'Cloud Operations', tierLevel: 'junior' },
      { id: 'cloud-serverless',    title: 'Serverless: functions and containers', min: 9, kind: 'concept', section: 'Cloud Operations', tierLevel: 'junior' },
      { id: 'cloud-cdn',           title: 'CDNs and edge delivery',               min: 7, kind: 'concept', section: 'Cloud Operations', tierLevel: 'junior' },
      { id: 'cloud-observability', title: 'Cloud observability',                  min: 8, kind: 'concept', section: 'Cloud Operations', tierLevel: 'junior' },

      // ── Deeper Cuts (legacy v14 archive — different angle from the canonical lessons) ──
      { id: 'd1',                title: 'Linux command toolkit',     min: 5, kind: 'concept', section: 'DEEPER CUTS', tierLevel: 'junior' },
      { id: 'd3',                title: 'Branch / merge / cleanup',  min: 5, kind: 'concept', section: 'DEEPER CUTS', tierLevel: 'junior' },
      { id: 'd4',                title: 'What containers actually are', min: 6, kind: 'concept', section: 'DEEPER CUTS', tierLevel: 'junior' },
      { id: 'd5',                title: 'Local K8s with kind / minikube', min: 8, kind: 'concept', section: 'DEEPER CUTS', tierLevel: 'junior' },
      { id: 'd6',                title: 'CI vs Delivery vs Deployment', min: 5, kind: 'concept', section: 'DEEPER CUTS', tierLevel: 'junior' },
      { id: 'd7',                title: 'Terraform VPC quick-build', min: 6, kind: 'concept', section: 'DEEPER CUTS', tierLevel: 'junior' },
    ],
  },
  mlops: {
    name: 'MLOps', icon: '🧠',
    lessons: [
      { id: 'ml-lifecycle',       title: 'The ML Lifecycle',             min: 8,  kind: 'concept', section: 'MLOPS · ESSENTIALS', tierLevel: 'junior' },
      { id: 'training-eval',      title: 'Training & Evaluation',        min: 9,  hasMathQuiz: true, kind: 'concept', section: 'MLOPS · ESSENTIALS', tierLevel: 'junior' },
      { id: 'ab-testing',         title: 'A/B Testing for ML',           min: 10, kind: 'concept', section: 'MLOPS · ESSENTIALS', tierLevel: 'junior' },
      { id: 'ml-inference-api',   title: 'ML Inference API',             min: 12, kind: 'concept', section: 'MLOPS · ESSENTIALS', tierLevel: 'junior' },
      { id: 'fastapi-ml-service', title: 'FastAPI ML Inference Service', min: 5,  kind: 'concept', section: 'MLOPS · ESSENTIALS', tierLevel: 'junior' },
      { id: 'mlops-serving-apis',  title: 'Serving models as APIs',        tagline: 'REST vs gRPC, latency budgets, and the cold-start trap', min: 9, kind: 'concept', section: 'Model APIs', tierLevel: 'junior' },
      { id: 'mlops-api-contracts', title: 'API contracts for ML services', tagline: 'Schemas, versioning, and graceful degradation',           min: 8, kind: 'concept', section: 'Model APIs', tierLevel: 'junior' },
      { id: 'mlops-cdc-semantics', title: 'Change data capture and delivery semantics', tagline: 'At-least-once, at-most-once, exactly-once — pick one (sort of)', min: 9, kind: 'concept', section: 'Model APIs', tierLevel: 'junior' },
      { id: 'drift-detector',     title: 'Drift Detection Service',      min: 15, deep: true, kind: 'concept', section: 'MLOPS · ESSENTIALS', tierLevel: 'senior' },
      { id: 'ml-platform',        title: 'End-to-End ML Platform',       min: 5,  kind: 'concept', section: 'MLOPS · ESSENTIALS', tierLevel: 'junior' },
      { id: 'llm-fundamentals',   title: 'How LLMs Actually Work',       min: 5,  deep: true, kind: 'concept', section: 'MLOPS · ESSENTIALS', tierLevel: 'senior' },
      { id: 'llm-prompting',      title: 'Prompt Engineering',           min: 8,  kind: 'concept', section: 'MLOPS · ESSENTIALS', tierLevel: 'junior' },
      { id: 'llm-rag',            title: 'Retrieval-Augmented Generation (RAG)', min: 8, deep: true, hasMathQuiz: true, kind: 'concept', section: 'MLOPS · ESSENTIALS', tierLevel: 'staff' },
      { id: 'sd-feature-store-vs-serve', title: "Feature stores vs serve-time engineering — pay now or pay forever", min: 7, kind: 'sd', sd: true, section: 'MLOPS · ESSENTIALS', tagline: "Feature stores vs serve-time engineering — pay now or pay forever", tierLevel: 'senior' },

      // ── ML Fundamentals (Google-based canonical curriculum) ────────────────
      { id: 'ml-intro-what-it-does', title: 'What ML actually does',     min: 7,  kind: 'concept', section: 'ML FUNDAMENTALS', tierLevel: 'junior' },
      { id: 'ml-intro-paradigms',    title: 'Supervised vs unsupervised vs RL', min: 7, kind: 'concept', section: 'ML FUNDAMENTALS', tierLevel: 'junior' },
      { id: 'ml-intro-framing',      title: 'Problem framing',           min: 8,  kind: 'concept', section: 'ML FUNDAMENTALS', tierLevel: 'junior' },

      // ── Core Models ────────────────────────────────────────────────────────
      { id: 'ml-core-linear-regression',     title: 'Linear regression',  min: 10, hasMathQuiz: true, kind: 'concept', section: 'CORE MODELS', tierLevel: 'junior' },
      { id: 'ml-core-logistic-regression',   title: 'Logistic regression', min: 10, hasMathQuiz: true, kind: 'concept', section: 'CORE MODELS', tierLevel: 'junior' },
      { id: 'ml-core-classification-metrics', title: 'Classification & metrics', min: 9, kind: 'concept', section: 'CORE MODELS', tierLevel: 'junior' },
      { id: 'ml-core-trees-forests',         title: 'Decision trees & forests', min: 11, kind: 'concept', section: 'CORE MODELS', tierLevel: 'senior' },

      // ── Working With Data ──────────────────────────────────────────────────
      { id: 'ml-data-numerical',     title: 'Numerical features',         min: 8,  kind: 'concept', section: 'WORKING WITH DATA', tierLevel: 'junior' },
      { id: 'ml-data-categorical',   title: 'Categorical features',       min: 8,  kind: 'concept', section: 'WORKING WITH DATA', tierLevel: 'junior' },
      { id: 'ml-data-splits-leakage', title: 'Datasets, splits, leakage', min: 9,  kind: 'concept', section: 'WORKING WITH DATA', tierLevel: 'junior' },
      { id: 'ml-data-overfitting',   title: 'Generalization & overfitting', min: 10, kind: 'concept', section: 'WORKING WITH DATA', tierLevel: 'senior' },
      { id: 'sd-training-serving-skew', title: "Training/serving skew — the bug your offline metrics can't see", min: 8, kind: 'sd', sd: true, section: 'WORKING WITH DATA', tagline: "Training/serving skew — the bug your offline metrics can't see", tierLevel: 'senior' },

      // ── Applied ML (recsys + clustering live in mlops; gan + rl in mleng) ──
      { id: 'ml-applied-recsys',     title: 'Recommendation systems',     min: 11, kind: 'concept', section: 'APPLIED ML', tierLevel: 'senior' },
      { id: 'ml-applied-clustering', title: 'Clustering',                 min: 10, kind: 'concept', section: 'APPLIED ML', tierLevel: 'senior' },
      { id: 'sd-online-vs-batch-inference', title: "Online vs batch inference — the latency-cost-freshness triangle", min: 7, kind: 'sd', sd: true, section: 'APPLIED ML', tagline: "Online vs batch inference — the latency-cost-freshness triangle", tierLevel: 'senior' },

      // ── Production ML ──────────────────────────────────────────────────────
      { id: 'ml-prod-systems',       title: 'Production ML systems',      min: 12, kind: 'concept', section: 'PRODUCTION ML', tierLevel: 'senior' },
      { id: 'ml-prod-automl',        title: 'AutoML',                     min: 9,  kind: 'concept', section: 'PRODUCTION ML', tierLevel: 'senior' },
      { id: 'ml-prod-managing',      title: 'Managing ML projects',       min: 10, kind: 'concept', section: 'PRODUCTION ML', tierLevel: 'senior' },
      { id: 'ml-prod-fairness',      title: 'ML fairness',                min: 11, kind: 'concept', section: 'PRODUCTION ML', tierLevel: 'senior' },
      { id: 'ml-prod-responsible-ai', title: 'Responsible AI',            min: 12, deep: true, kind: 'concept', section: 'PRODUCTION ML', tierLevel: 'senior' },
      { id: 'mlops-feature-stores',     title: 'Feature stores: online vs offline', tagline: 'Same definitions, two databases — kill training-serving skew', min: 9,  kind: 'concept', section: 'PRODUCTION ML', tierLevel: 'senior' },
      { id: 'mlops-monitoring',         title: 'Model monitoring + drift detection', tagline: 'Input, prediction, concept — three drifts, three alarms',     min: 10, kind: 'concept', section: 'PRODUCTION ML', tierLevel: 'senior' },
      { id: 'mlops-continuous-training', title: 'Continuous training pipelines',    tagline: 'Triggers, registries, and the gates a model passes to prod',  min: 9,  kind: 'concept', section: 'PRODUCTION ML', tierLevel: 'senior' },
      { id: 'mlops-ab-testing',         title: 'A/B testing models in production', tagline: 'Shadow → canary → 50/50 — the metrics that pay rent',          min: 10, kind: 'concept', section: 'PRODUCTION ML', tierLevel: 'senior' },

      // ── Deeper Cuts (legacy v14 archive — different angle from the canonical lessons) ──
      { id: 'm1',                title: 'Why MLOps exists (short version)', min: 5, kind: 'concept', section: 'DEEPER CUTS', tierLevel: 'junior' },
      { id: 'm4',                title: 'FastAPI inference quick-wrap',     min: 5, kind: 'concept', section: 'DEEPER CUTS', tierLevel: 'junior' },
      { id: 'm5',                title: 'Drift detection — milestones',     min: 6, kind: 'concept', section: 'DEEPER CUTS', tierLevel: 'junior' },
      { id: 'sd-model-registry-source-of-truth', title: "The model registry — your aircraft logbook for production ML", min: 7, kind: 'sd', sd: true, section: 'PRODUCTION ML', tagline: "The model registry — your aircraft logbook for production ML", tierLevel: 'staff' },
    ],
  },
  swe: {
    name: 'SWE', icon: '⌨',
    lessons: [
      { id: 'cs-bigo',            title: 'Big O Notation',                       min: 5,  deep: true, hasMathQuiz: true, kind: 'concept', section: 'SWE · ESSENTIALS', tierLevel: 'staff' },
      { id: 'cs-recursion',       title: 'Recursion',                            min: 5,  deep: true, kind: 'concept', section: 'SWE · ESSENTIALS', tierLevel: 'senior' },
      { id: 's1',                 title: 'Data structures',                      min: 7,  deep: true, kind: 'concept', section: 'SWE · ESSENTIALS', tierLevel: 'senior' },
      { id: 'sql-basics',         title: 'SQL Basics',                           min: 5,  kind: 'concept', section: 'SWE · ESSENTIALS', tierLevel: 'junior' },
      { id: 'cli-todo',           title: 'CLI Todo with Persistence',            min: 5,  kind: 'concept', section: 'SWE · ESSENTIALS', tierLevel: 'junior' },
      { id: 'rate-limiter',       title: 'Rate Limiter from Scratch',            min: 12, kind: 'concept', section: 'SWE · ESSENTIALS', tierLevel: 'junior' },
      { id: 'stripe-idempotency', title: 'How Stripe Prevents Duplicate Charges', min: 14, kind: 'concept', section: 'SWE · ESSENTIALS', tierLevel: 'junior' },
      { id: 'sd-cache-layers', title: "Caching layers — CDN, Redis, and the process heap", min: 7, kind: 'sd', sd: true, section: 'SWE · ESSENTIALS', tagline: "Three caches, three failure modes, one mental model", tierLevel: 'junior' },

      // ── Agile mindset & values ─────────────────────────────────────────────
      { id: 'agile-mindset-what',           title: 'What Agile actually means', min: 7, kind: 'concept', section: 'AGILE MINDSET', tierLevel: 'junior' },
      { id: 'agile-mindset-waterfall-vs',   title: 'Waterfall vs Agile',        min: 7, kind: 'concept', section: 'AGILE MINDSET', tierLevel: 'junior' },
      { id: 'agile-mindset-feedback-loops', title: 'Why feedback loops win',    min: 7, kind: 'concept', section: 'AGILE MINDSET', tierLevel: 'junior' },
      { id: 'sd-index-write-cost', title: "Indexes aren't free — every write pays the tax", min: 7, kind: 'sd', sd: true, section: 'AGILE MINDSET', tagline: "Why your read-heavy table is suddenly write-bound", tierLevel: 'senior' },

      // ── Scrum & Kanban ─────────────────────────────────────────────────────
      { id: 'agile-scrum-framework', title: 'Scrum framework',  min: 9, kind: 'concept', section: 'SCRUM & KANBAN', tierLevel: 'junior' },
      { id: 'agile-kanban',          title: 'Kanban',           min: 8, kind: 'concept', section: 'SCRUM & KANBAN', tierLevel: 'junior' },
      { id: 'agile-scrumban',        title: 'Scrumban & hybrids', min: 8, kind: 'concept', section: 'SCRUM & KANBAN', tierLevel: 'senior' },
      { id: 'sd-queue-decoupling', title: "Queues decouple time, not just services", min: 7, kind: 'sd', sd: true, section: 'SCRUM & KANBAN', tagline: "When async is the architecture, not the optimization", tierLevel: 'senior' },

      // ── Ceremonies & Practices ─────────────────────────────────────────────
      { id: 'agile-sprint-planning',     title: 'Sprint planning',       min: 7, kind: 'concept', section: 'CEREMONIES', tierLevel: 'junior' },
      { id: 'agile-daily-standup',       title: 'Daily standup',         min: 6, kind: 'concept', section: 'CEREMONIES', tierLevel: 'junior' },
      { id: 'agile-backlog-refinement',  title: 'Backlog refinement',    min: 7, kind: 'concept', section: 'CEREMONIES', tierLevel: 'junior' },
      { id: 'agile-review-retro',        title: 'Sprint review & retro', min: 7, kind: 'concept', section: 'CEREMONIES', tierLevel: 'junior' },

      // ── Artifacts & Estimation ─────────────────────────────────────────────
      { id: 'agile-user-stories',          title: 'User stories & acceptance criteria', min: 8, kind: 'concept', section: 'ARTIFACTS & ESTIMATION', tierLevel: 'junior' },
      { id: 'agile-story-points-velocity', title: 'Story points & velocity', min: 9, kind: 'concept', section: 'ARTIFACTS & ESTIMATION', tierLevel: 'senior' },
      { id: 'agile-mvp-incremental',       title: 'MVP & incremental delivery', min: 9, kind: 'concept', section: 'ARTIFACTS & ESTIMATION', tierLevel: 'senior' },
      { id: 'sd-n-plus-one', title: "N+1 queries — the scaling problem that isn't", min: 6, kind: 'sd', sd: true, section: 'ARTIFACTS & ESTIMATION', tagline: "Why 'we need bigger DB instances' usually means 'we need a JOIN'", tierLevel: 'junior' },

      // ── API Design ─────────────────────────────────────────────────────────
      { id: 'api-rest-design',    title: 'REST design patterns',           tagline: 'Resources are nouns, verbs are HTTP methods',  min: 8, kind: 'concept', section: 'API DESIGN', tierLevel: 'junior' },
      { id: 'api-versioning',     title: 'API versioning and deprecation', tagline: 'Announce, dual-run, enforce — never just delete', min: 8, kind: 'concept', section: 'API DESIGN', tierLevel: 'senior' },
      { id: 'api-rate-limiting',  title: 'Rate limiting and quotas',       tagline: 'Make the limit visible, the 429 actionable',     min: 8, kind: 'concept', section: 'API DESIGN', tierLevel: 'senior' },
      { id: 'api-idempotency',    title: 'Idempotency and retries',        tagline: 'Every mutation should survive a double-tap',     min: 8, kind: 'concept', section: 'API DESIGN', tierLevel: 'senior' },

      // ── Deeper Cuts (legacy v14 archive) ──
      { id: 's2',                          title: 'Big O — quick reference', min: 5, kind: 'concept', section: 'DEEPER CUTS', tierLevel: 'junior' },
    ],
  },
  mleng: {
    name: 'ML Eng', icon: '⚙',
    lessons: [
      { id: 'math-linalg',             title: 'Linear Algebra for ML',                  min: 20, deep: true, hasMathQuiz: true, kind: 'concept', section: 'ML ENG · ESSENTIALS', tierLevel: 'staff' },
      { id: 'math-calculus',           title: 'Calculus for ML',                        min: 19, deep: true, hasMathQuiz: true, kind: 'concept', section: 'ML ENG · ESSENTIALS', tierLevel: 'staff' },
      { id: 'math-probability',        title: 'Probability for ML',                     min: 16, deep: true, hasMathQuiz: true, kind: 'concept', section: 'ML ENG · ESSENTIALS', tierLevel: 'staff' },
      { id: 'ai-transformers',         title: 'Transformers from Scratch',              min: 18, deep: true, hasMathQuiz: true, kind: 'concept', section: 'ML ENG · ESSENTIALS', tierLevel: 'staff' },
      { id: 'ai-embeddings',           title: 'Embeddings — How Models Represent Meaning', min: 16, deep: true, kind: 'concept', section: 'ML ENG · ESSENTIALS', tierLevel: 'senior' },
      { id: 'ai-finetuning',           title: 'Fine-tuning vs RAG vs Prompting',        min: 18, deep: true, kind: 'concept', section: 'ML ENG · ESSENTIALS', tierLevel: 'senior' },
      { id: 'ai-evaluation',           title: 'ML Model Evaluation',                    min: 18, deep: true, hasMathQuiz: true, kind: 'concept', section: 'ML ENG · ESSENTIALS', tierLevel: 'staff' },
      { id: 'ai-distributed-training', title: 'Distributed Training at Scale',          min: 21, deep: true, kind: 'concept', section: 'ML ENG · ESSENTIALS', tierLevel: 'senior' },
      { id: 'lab-numpy-mlp',           title: 'Build an MLP from Scratch (NumPy)',      min: 9,  hasMathQuiz: true, kind: 'concept', section: 'ML ENG · ESSENTIALS', tierLevel: 'senior' },
      { id: 'lab-rag-pipeline',        title: 'Build a Production RAG Pipeline',        min: 8,  kind: 'concept', section: 'ML ENG · ESSENTIALS', tierLevel: 'senior' },
      { id: 'lab-lora-finetune',       title: 'Fine-tune an LLM with LoRA',             min: 8,  kind: 'concept', section: 'ML ENG · ESSENTIALS', tierLevel: 'senior' },
      { id: 'mleng-llm-apis',          title: 'LLM APIs in production',                 tagline: 'The hosted-LLM surface — request shape, streaming, retries, cost', min: 9, kind: 'concept', section: 'LLM ENGINEERING', tierLevel: 'senior' },
      { id: 'mleng-prompting',         title: 'Prompt engineering techniques',          tagline: 'System vs user prompts, few-shot, chain-of-thought, structured output', min: 9, kind: 'concept', section: 'LLM ENGINEERING', tierLevel: 'senior' },
      { id: 'mleng-rag',               title: 'RAG: retrieval-augmented generation',    tagline: 'Chunk · embed · retrieve · prompt — the pattern that beats fine-tuning most days', min: 10, kind: 'concept', section: 'LLM ENGINEERING', tierLevel: 'senior' },
      { id: 'mleng-embeddings',        title: 'Embeddings and vector search',           tagline: 'High-dim vectors, cosine vs dot, HNSW vs IVF, picking a vector DB', min: 9, kind: 'concept', section: 'LLM ENGINEERING', tierLevel: 'senior' },
      { id: 'mleng-tool-use',          title: 'Tool use and function calling',          tagline: 'The agent loop — JSON-schema tools, multi-turn calls, error recovery', min: 9, kind: 'concept', section: 'LLM ENGINEERING', tierLevel: 'senior' },
      { id: 'mleng-llm-eval',          title: 'Evaluating LLM systems',                 tagline: 'Golden sets, LLM-as-judge, pairwise preference, regression tracing', min: 9, kind: 'concept', section: 'LLM ENGINEERING', tierLevel: 'senior' },
      { id: 'sd-gpu-memory-budget', title: "GPU memory is a budget — and you'll blow it", min: 7, kind: 'sd', sd: true, section: 'ML ENG · ESSENTIALS', tagline: "Why batch size, model size, and gradient accumulation are the same conversation", tierLevel: 'senior' },

      // ── Neural Nets & Beyond (Google-based canonical curriculum) ───────────
      { id: 'ml-nn-fundamentals',  title: 'Neural network fundamentals', min: 12, deep: true, kind: 'concept', section: 'NEURAL NETS & BEYOND', tierLevel: 'senior' },
      { id: 'ml-nn-backprop',      title: 'Backprop & training',         min: 13, deep: true, hasMathQuiz: true, kind: 'concept', section: 'NEURAL NETS & BEYOND', tierLevel: 'staff' },
      { id: 'ml-nn-embeddings',    title: 'Embeddings',                  min: 11, deep: true, kind: 'concept', section: 'NEURAL NETS & BEYOND', tierLevel: 'senior' },
      { id: 'ml-nn-cnn',           title: 'Convolutional networks',      min: 12, deep: true, kind: 'concept', section: 'NEURAL NETS & BEYOND', tierLevel: 'senior' },
      { id: 'ml-nn-transformers',  title: 'Transformers & attention',    min: 15, deep: true, hasMathQuiz: true, kind: 'concept', section: 'NEURAL NETS & BEYOND', tierLevel: 'staff' },
      { id: 'ml-nn-llm-intro',     title: 'Intro to LLMs',               min: 12, kind: 'concept', section: 'NEURAL NETS & BEYOND', tierLevel: 'staff' },
      { id: 'sd-parallelism-topologies', title: "Data, model, pipeline — pick how you cut the cake", min: 8, kind: 'sd', sd: true, section: 'NEURAL NETS & BEYOND', tagline: "The three flavors of distributed training and what they actually cost you", tierLevel: 'staff' },
      { id: 'sd-batch-size-lr-coupling', title: "Batch size and learning rate are the same lever", min: 6, kind: 'sd', sd: true, section: 'NEURAL NETS & BEYOND', tagline: "Why doubling the batch should double the learning rate (until it shouldn't)", tierLevel: 'senior' },

      // ── Advanced Applied ───────────────────────────────────────────────────
      { id: 'ml-applied-gan-gen', title: 'GANs & generative models',     min: 13, deep: true, kind: 'concept', section: 'ADVANCED APPLIED', tierLevel: 'staff' },
      { id: 'ml-applied-rl',      title: 'Reinforcement learning',       min: 14, deep: true, kind: 'concept', section: 'ADVANCED APPLIED', tierLevel: 'staff' },
      { id: 'sd-inference-vs-training-cost', title: "Inference and training are different businesses", min: 8, kind: 'sd', sd: true, section: 'ADVANCED APPLIED', tagline: "Why the model that's cheap to train is expensive to serve", tierLevel: 'staff' },
    ],
  },
  faang: {
    name: 'FAANG', icon: '◈',
    lessons: [
      { id: 'star-framework',     title: 'STAR Framework for Behavioral',          min: 15, kind: 'concept', section: 'FAANG · ESSENTIALS', tierLevel: 'junior' },
      { id: 'g2',                 title: 'Dynamic programming',                    min: 8,  deep: true, kind: 'concept', section: 'FAANG · ESSENTIALS', tierLevel: 'senior' },
      { id: 'interview-loop',     title: 'The Big Tech Interview Loop',            min: 12, kind: 'concept', section: 'FAANG · ESSENTIALS', tierLevel: 'junior' },
      { id: 'time-clocks',        title: 'Time & Clocks',                          min: 10, deep: true, kind: 'concept', section: 'FAANG · ESSENTIALS', tierLevel: 'senior' },
      { id: 'consistency-models', title: 'Consistency Models',                     min: 12, deep: true, kind: 'concept', section: 'FAANG · ESSENTIALS', tierLevel: 'senior' },
      { id: 'distributed-txns',   title: 'Distributed Transactions',               min: 13, deep: true, kind: 'concept', section: 'FAANG · ESSENTIALS', tierLevel: 'senior' },
      { id: 'distributed-kv-store', title: 'Distributed KV Store with Raft Consensus', min: 8, deep: true, kind: 'concept', section: 'FAANG · ESSENTIALS', tierLevel: 'senior' },
      { id: 'cloudflare-dns',     title: 'How Cloudflare\'s 1.1.1.1 Beat Google DNS', min: 12, kind: 'concept', section: 'FAANG · ESSENTIALS', tierLevel: 'junior' },
      { id: 'discord-cassandra',  title: 'Why Discord Migrated from MongoDB to Cassandra', min: 15, kind: 'concept', section: 'FAANG · ESSENTIALS', tierLevel: 'junior' },
      { id: 'aws-s3-outage',      title: 'The 2017 AWS S3 Outage',                 min: 14, kind: 'concept', section: 'FAANG · ESSENTIALS', tierLevel: 'junior' },
      { id: 'netflix-chaos',      title: 'How Netflix\'s Chaos Monkey Reshaped Reliability', min: 11, kind: 'concept', section: 'FAANG · ESSENTIALS', tierLevel: 'junior' },
      { id: 'github-scaling',     title: 'How GitHub Handles 100M Requests/Second', min: 12, kind: 'concept', section: 'FAANG · ESSENTIALS', tierLevel: 'junior' },
      { id: 'notion-ai',          title: 'How Notion AI Actually Works',           min: 14, kind: 'concept', section: 'FAANG · ESSENTIALS', tierLevel: 'junior' },
      { id: 'spotify-hendrix',    title: 'How Spotify\'s Hendrix Platform Ships 1000s of ML Models', min: 11, kind: 'concept', section: 'FAANG · ESSENTIALS', tierLevel: 'junior' },
      { id: 'gitlab-data-loss',   title: 'The Day GitLab Lost 6 Hours of Customer Data', min: 13, kind: 'concept', section: 'FAANG · ESSENTIALS', tierLevel: 'junior' },
      { id: 'discord-19m',        title: 'How Discord Scaled to 19M Concurrent Users', min: 12, kind: 'concept', section: 'FAANG · ESSENTIALS', tierLevel: 'junior' },
      { id: 'sd-back-of-envelope', title: "Back-of-envelope on a whiteboard — estimate QPS and storage in 90 seconds", min: 7, kind: 'sd', sd: true, section: 'FAANG · ESSENTIALS', guidance: 'guided', tagline: "Estimate QPS and storage in 90 seconds", tierLevel: 'junior' },
      { id: 'sd-sql-vs-nosql-vs-kv', title: "SQL, NoSQL, KV — pick by access pattern, not by hype", min: 8, kind: 'sd', sd: true, section: 'FAANG · ESSENTIALS', guidance: 'guided', tagline: "Pick by access pattern, not by hype", tierLevel: 'senior' },
      { id: 'sd-sharding-strategies', title: "Hash, range, directory — sharding strategies and their failure modes", min: 9, kind: 'sd', sd: true, section: 'FAANG · ESSENTIALS', guidance: 'guided', tagline: "Hash, range, directory — and how each one fails", tierLevel: 'staff' },

      // ── System Design API Patterns (interview-tested) ──
      { id: 'faang-pagination',            title: 'Pagination at scale',          tagline: 'Offset breaks past 1M rows — cursors are the contract', min: 9, kind: 'concept', section: 'System Design API Patterns', tierLevel: 'senior' },
      { id: 'faang-distributed-ratelimit', title: 'Distributed rate limiting',    tagline: 'Token bucket across N edges without melting Redis',     min: 9, kind: 'concept', section: 'System Design API Patterns', tierLevel: 'senior' },
      { id: 'faang-eventual-consistency',  title: 'Eventual consistency in APIs', tagline: 'When the read lags the write — and how to lie nicely',  min: 9, kind: 'concept', section: 'System Design API Patterns', tierLevel: 'senior' },
      { id: 'faang-idempotent-webhooks',   title: 'Idempotent webhooks',          tagline: 'At-least-once is the default — your handler must cope',  min: 9, kind: 'concept', section: 'System Design API Patterns', tierLevel: 'senior' },
      { id: 'faang-resilience-trio',       title: 'Idempotency, retries, circuit breakers', tagline: 'The three things between you and a thundering retry storm', min: 10, kind: 'concept', section: 'System Design API Patterns', tierLevel: 'senior' },
      { id: 'faang-cache-eviction',        title: 'Cache eviction: LRU vs LFU vs ARC', tagline: 'When the cache is full, what gets kicked out?',     min: 9, kind: 'concept', section: 'System Design API Patterns', tierLevel: 'senior' },

      // ── System Design Labs (multi-phase whiteboard rehearsals) ──
      { id: 'lab-url-shortener',  title: 'Design a URL shortener',          tagline: '10M URLs/day, 100x read-heavy, p95 < 100ms',                   min: 25, kind: 'lab', lab: true, section: 'System Design Labs', duration: '25M', tierLevel: 'senior' },
      { id: 'lab-rate-limiter',   title: 'Design a distributed rate limiter', tagline: '100K req/s across 50 edges, per-API-key budgets',          min: 25, kind: 'lab', lab: true, section: 'System Design Labs', duration: '25M', tierLevel: 'senior' },

      // ── Deeper Cuts (legacy v14 archive) ──
      { id: 'g1',                title: 'FAANG round-by-round',         min: 6, kind: 'concept', section: 'DEEPER CUTS', tierLevel: 'junior' },
    ],
  },
  fullstack: {
    name: 'Full Stack', icon: '⌘',
    lessons: [
      { id: 'fs-html-structure', title: 'HTML structure & semantics',         tagline: 'Semantic tags, landmarks, and the a11y tree', min: 7, kind: 'concept', section: 'WEB FOUNDATIONS', tierLevel: 'junior' },
      { id: 'fs-css-layout',     title: 'CSS layout: flex + grid + box model', tagline: 'Four rectangles and two layout engines',     min: 9, kind: 'concept', section: 'WEB FOUNDATIONS', tierLevel: 'junior' },
      { id: 'fs-js-essentials',  title: 'JavaScript essentials',               tagline: 'Scope, closures, async, fetch — the minimum',  min: 9, kind: 'concept', section: 'WEB FOUNDATIONS', tierLevel: 'junior' },
      { id: 'fs-dom-events',     title: 'DOM, events, delegation',             tagline: 'Bubble vs capture and why delegation scales',  min: 7, kind: 'concept', section: 'WEB FOUNDATIONS', tierLevel: 'junior' },
      { id: 'fs-react-intro',    title: 'React: components and JSX',           tagline: 'UI is a function of state',                    min: 8, kind: 'concept', section: 'WEB FOUNDATIONS', tierLevel: 'junior' },
      { id: 'fs-react-state',    title: 'React: state with hooks',             tagline: 'useState, useEffect, and lifting state up',    min: 9, kind: 'concept', section: 'WEB FOUNDATIONS', tierLevel: 'junior' },
      { id: 'fs-node-express',       title: 'Node + Express basics',                    tagline: 'Event loop, middleware chain, request/response cycle',           min: 9, kind: 'concept', section: 'Backend & APIs', tierLevel: 'junior' },
      { id: 'fs-rest-routes',        title: 'REST APIs: routes, methods, status codes', tagline: 'Resources are nouns, verbs are HTTP methods',                    min: 8, kind: 'concept', section: 'Backend & APIs', tierLevel: 'junior' },
      { id: 'fs-request-validation', title: 'Request validation and error handling',    tagline: 'Validate at the edge, never leak stack traces',                  min: 9, kind: 'concept', section: 'Backend & APIs', tierLevel: 'junior' },
      { id: 'fs-fetch-from-react',   title: 'Talking to APIs from React',               tagline: 'Loading, error, success — and the stale-while-revalidate trick', min: 8, kind: 'concept', section: 'Backend & APIs', tierLevel: 'junior' },
      { id: 'fs-api-security',       title: 'API security basics',                      tagline: 'CORS, rate limits, helmet — enough to not get pwned',            min: 8, kind: 'concept', section: 'Backend & APIs', tierLevel: 'junior' },
      { id: 'fs-caching-strategies', title: 'Caching strategies',                       tagline: 'Cache-aside, read-through, write-through, write-back, write-around', min: 10, kind: 'concept', section: 'Backend & APIs', tierLevel: 'junior' },
      { id: 'fs-postgres-basics',    title: 'Postgres basics: tables, types, constraints', tagline: 'The DB is the source of truth — constrain it there', min: 9, kind: 'concept', section: 'Databases', tierLevel: 'junior' },
      { id: 'fs-sql-essentials',     title: 'SQL: SELECT, JOIN, GROUP BY',                  tagline: 'INNER vs LEFT, WHERE vs HAVING — and when each is wrong', min: 9, kind: 'concept', section: 'Databases', tierLevel: 'junior' },
      { id: 'fs-orm-migrations',     title: 'ORMs and migrations',                          tagline: 'Every change is a migration — and you only roll forward',  min: 9, kind: 'concept', section: 'Databases', tierLevel: 'junior' },
      { id: 'fs-indexes-n-plus-one', title: 'Indexes and the N+1 problem',                  tagline: 'Your slow page is usually N+1 — and indexes have a write cost', min: 9, kind: 'concept', section: 'Databases', tierLevel: 'junior' },
      { id: 'fs-password-hashing',   title: 'Password hashing the right way',               tagline: 'Bcrypt, Argon2, scrypt — salts, work factors, and a pepper',     min: 9, kind: 'concept', section: 'Auth & Sessions', tierLevel: 'junior' },
      { id: 'fs-sessions-vs-jwt',    title: 'Sessions vs JWTs',                              tagline: 'Server-side sessions vs stateless tokens — and the revocation tax', min: 9, kind: 'concept', section: 'Auth & Sessions', tierLevel: 'junior' },
      { id: 'fs-auth-comparison',    title: 'JWT vs Session vs Cookie vs PASETO',            tagline: 'The four-way auth comparison every interview asks about', min: 9, kind: 'concept', section: 'Auth & Sessions', tierLevel: 'junior' },
      { id: 'fs-oauth-oidc',         title: 'OAuth 2.0 and OIDC',                            tagline: 'Authorization code + PKCE, ID vs access tokens — never roll your own', min: 9, kind: 'concept', section: 'Auth & Sessions', tierLevel: 'junior' },
      { id: 'fs-oauth-variants',     title: 'OAuth 2.0 flow variants',                       tagline: 'When to use Authorization Code vs Client Credentials vs Device Code', min: 9, kind: 'concept', section: 'Auth & Sessions', tierLevel: 'junior' },
      { id: 'fs-csrf-cookies',       title: 'CSRF, cookies, and SameSite',                   tagline: 'HttpOnly, Secure, SameSite=Lax — and when you still need a token', min: 9, kind: 'concept', section: 'Auth & Sessions', tierLevel: 'junior' },
      { id: 'fs-platform-deploy',    title: 'Deploy to Vercel / Railway / Fly',              tagline: 'Git-push-to-deploy, preview URLs per PR, and where each PaaS wins',  min: 9,  kind: 'concept', section: 'Deploy & Iterate', tierLevel: 'junior' },
      { id: 'fs-env-secrets',        title: 'Environment variables and secrets',             tagline: '.env stays local, prod secrets live in a vault — twelve-factor or bust', min: 8, kind: 'concept', section: 'Deploy & Iterate', tierLevel: 'junior' },
      { id: 'fs-github-actions',     title: 'CI/CD with GitHub Actions',                     tagline: 'Workflow YAML, matrix builds, deploy gates — merge means ship',     min: 10, kind: 'concept', section: 'Deploy & Iterate', tierLevel: 'junior' },
      { id: 'fs-monitoring',         title: 'Production monitoring',                         tagline: 'Uptime, errors, performance — alerts you would actually wake up for', min: 9, kind: 'concept', section: 'Deploy & Iterate', tierLevel: 'junior' },

      // ── System Design Labs (multi-phase whiteboard rehearsals) ──
      { id: 'lab-realtime-chat', title: 'Design a real-time chat backend', tagline: '50K concurrent, 200-member groups, forever history', min: 30, kind: 'lab', lab: true, guidance: 'open', section: 'System Design Labs', duration: '30M', tierLevel: 'senior' },
    ],
  },
  cybersec: {
    name: 'Cybersecurity', icon: '▣',
    lessons: [
      { id: 'sec-cia-triad',        title: 'Threat models & the CIA triad',    tagline: 'Confidentiality, integrity, availability — the only three things you protect', min: 7, kind: 'concept', section: 'Security Foundations', tierLevel: 'junior' },
      { id: 'sec-authn-vs-authz',   title: 'Authentication vs authorization',  tagline: 'The bouncer checks your ID — the velvet rope decides where you go',           min: 7, kind: 'concept', section: 'Security Foundations', tierLevel: 'junior' },
      { id: 'sec-crypto-basics',    title: 'Cryptography fundamentals',        tagline: 'Hash, symmetric, asymmetric — and never roll your own',                       min: 9, kind: 'concept', section: 'Security Foundations', tierLevel: 'junior' },
      { id: 'sec-owasp-top-10',     title: 'The OWASP Top 10',                 tagline: 'The ten ways your app is already broken in production',                       min: 9, kind: 'concept', section: 'Security Foundations', tierLevel: 'junior' },
      { id: 'sec-secrets-mgmt',     title: 'Secrets management',               tagline: 'Once a secret hits git, it is forever — rotate immediately',                  min: 8, kind: 'concept', section: 'Security Foundations', tierLevel: 'junior' },
      { id: 'sec-defense-in-depth', title: 'Defense in depth',                 tagline: 'Layered controls so one mistake is not the breach',                            min: 8, kind: 'concept', section: 'Security Foundations', tierLevel: 'junior' },
      { id: 'sec-https-deep',       title: 'HTTPS / TLS handshake deep dive',  tagline: 'How a browser and server agree on a key without anyone ever sharing it',       min: 9, kind: 'concept', section: 'Security Foundations', tierLevel: 'junior' },

      // ── AppSec ────────────────────────────────────────────────────────────
      { id: 'sec-sqli',             title: 'SQL injection',                    tagline: "1' OR 1=1-- and why ORMs don't fully save you",                                 min: 8, kind: 'concept', section: 'AppSec', tierLevel: 'senior' },
      { id: 'sec-xss',              title: 'Cross-site scripting (XSS)',       tagline: 'Reflected, stored, DOM — and why innerHTML is dangerous',                       min: 9, kind: 'concept', section: 'AppSec', tierLevel: 'senior' },
      { id: 'sec-csrf',             title: 'CSRF and SameSite cookies',        tagline: 'The cross-site request problem, mostly killed by SameSite=Lax',                 min: 8, kind: 'concept', section: 'AppSec', tierLevel: 'senior' },
      { id: 'sec-ssrf',             title: 'SSRF: server-side request forgery', tagline: '169.254.169.254 — when your image-fetcher is a backdoor',                      min: 9, kind: 'concept', section: 'AppSec', tierLevel: 'senior' },
      { id: 'sec-secure-coding',    title: 'Secure coding patterns',           tagline: 'Validate at the boundary, encode at render, fail closed',                       min: 8, kind: 'concept', section: 'AppSec', tierLevel: 'senior' },
      { id: 'sec-dependency-vulns', title: 'Dependency vulnerabilities',       tagline: 'npm audit, lockfiles, SBOMs — the transitive-dep problem',                      min: 8, kind: 'concept', section: 'AppSec', tierLevel: 'senior' },

      // ── Cloud Security ───────────────────────────────────────────────────
      { id: 'sec-iam-hardening',    title: 'IAM hardening',                    tagline: 'Least privilege, no wildcards — and the workflow to find unused permissions', min: 9, kind: 'concept', section: 'Cloud Security', tierLevel: 'senior' },
      { id: 'sec-kms-encryption',   title: 'KMS and encryption at rest',       tagline: 'Envelope encryption, key policies, rotation — why "encrypted" is the floor',  min: 8, kind: 'concept', section: 'Cloud Security', tierLevel: 'senior' },
      { id: 'sec-vpc-security',     title: 'VPC and security groups',          tagline: 'SGs vs NACLs, private subnets, VPC endpoints — default-deny networking',     min: 9, kind: 'concept', section: 'Cloud Security', tierLevel: 'senior' },
      { id: 'sec-vault-rotation',   title: 'Secrets vault and rotation',       tagline: 'Dynamic vs static secrets, automatic rotation, sealed-secrets for k8s',       min: 8, kind: 'concept', section: 'Cloud Security', tierLevel: 'senior' },
      { id: 'sec-supply-chain',     title: 'Supply chain attacks',             tagline: 'SolarWinds, Codecov, xz-utils — SBOM, SLSA, cosign, provenance attestation',  min: 9, kind: 'concept', section: 'Cloud Security', tierLevel: 'senior' },

      // ── Detection & Response ─────────────────────────────────────────────
      { id: 'sec-siem',             title: 'SIEM and log aggregation',           tagline: 'Collect, normalize, correlate, alert — why SIEM tuning is a full-time job',     min: 8, kind: 'concept', section: 'Detection & Response', tierLevel: 'senior' },
      { id: 'sec-audit-logs',       title: 'Audit logging and trails',           tagline: 'Append-only, signed, tamper-evident — logs as legal evidence',                  min: 8, kind: 'concept', section: 'Detection & Response', tierLevel: 'senior' },
      { id: 'sec-ids-ips-edr',      title: 'Intrusion detection: IDS, IPS, EDR', tagline: 'Snort, Suricata, osquery, CrowdStrike — signature vs anomaly, alert vs block',  min: 9, kind: 'concept', section: 'Detection & Response', tierLevel: 'senior' },
      { id: 'sec-ir-playbook',      title: 'Incident response playbook',         tagline: 'The 6 phases, the first 15 minutes, and why drills beat documents',             min: 9, kind: 'concept', section: 'Detection & Response', tierLevel: 'senior' },
      { id: 'sec-blue-red-purple',  title: 'Blue team vs red team vs purple',    tagline: 'Defenders, attackers, the exercise that fuses them — assume breach',            min: 8, kind: 'concept', section: 'Detection & Response', tierLevel: 'senior' },

      // ── Compliance & Governance ─────────────────────────────────────────
      { id: 'sec-gdpr',                title: 'GDPR and data privacy',         tagline: "Lawful basis, 72-hour breach clock, right to erasure — PII isn't just SSN", min: 8, kind: 'concept', section: 'Compliance & Governance', tierLevel: 'senior' },
      { id: 'sec-soc2',                title: 'SOC 2 in practice',             tagline: 'Five trust principles, Type I vs Type II, and why every B2B deal demands it', min: 9, kind: 'concept', section: 'Compliance & Governance', tierLevel: 'senior' },
      { id: 'sec-pci-dss',             title: 'PCI-DSS for handling payments', tagline: 'The 12 requirements, merchant levels, and the tokenization escape hatch',     min: 8, kind: 'concept', section: 'Compliance & Governance', tierLevel: 'senior' },
      { id: 'sec-compliance-audits',   title: 'Audit trails for compliance',   tagline: 'Evidence chains, immutability, retention — pass the audit on the first pass', min: 7, kind: 'concept', section: 'Compliance & Governance', tierLevel: 'senior' },
    ],
  },
};

// Group a path's lessons into named sections. Returns
//   [{ name, rows: [{lesson, ...}, ...] }, ...]
// preserving the original order — consecutive lessons sharing the same
// `section` collapse into one card on the path screen.
export function groupedSections(path) {
  const out = [];
  let cur = null;
  for (const lesson of path.lessons || []) {
    const name = lesson.section || (path.name ? `${path.name.toUpperCase()} · ESSENTIALS` : 'LESSONS');
    if (!cur || cur.name !== name) {
      cur = { name, rows: [] };
      out.push(cur);
    }
    cur.rows.push({ lesson });
  }
  return out;
}

// Decide whether a lab is unlocked. The rule (per v3):
//   - If `unlockAfter` is set, every listed lesson ID must be completed.
//   - Otherwise: every concept (kind === 'concept') in the lab's own section
//     AND in every section above it must be completed.
// Returns { unlocked, needed } where `needed` is how many concept lessons are
// still missing (used to render the "needs N more lessons" hint).
export function labUnlockStatus(path, lab, completed) {
  if (Array.isArray(lab.unlockAfter) && lab.unlockAfter.length > 0) {
    const missing = lab.unlockAfter.filter((id) => !completed[id]);
    return { unlocked: missing.length === 0, needed: missing.length };
  }
  const sections = groupedSections(path);
  const idx = sections.findIndex((sec) => sec.rows.some((r) => r.lesson.id === lab.id));
  if (idx < 0) return { unlocked: true, needed: 0 };
  let needed = 0;
  for (let i = 0; i <= idx; i++) {
    for (const { lesson } of sections[i].rows) {
      if (lesson.kind === 'concept' && !completed[lesson.id]) needed += 1;
    }
  }
  return { unlocked: needed === 0, needed };
}

// Find a lab lesson (kind === 'lab') by id across every path. Returns null
// when the id doesn't resolve to a lab — callers should treat that as "no
// milestone behavior".
export function findLab(labId) {
  for (const k of Object.keys(PATHS)) {
    for (const l of PATHS[k].lessons) {
      if (l.id === labId && (l.kind === 'lab' || l.lab === true)) return l;
    }
  }
  return null;
}

// Compute milestone progress for a given lab id. Joins the lab's static
// `milestones` array against the user's `labMilestones[labId]` map.
// Returns { done, total, pct, lastDoneIdx, nextIdx, nextMilestone } so the
// LabCard can render "Resume at Milestone N" without re-deriving anything.
//   - lastDoneIdx: highest index of a completed milestone, -1 when none.
//   - nextIdx:     first incomplete milestone index, equals total when done.
export function labProgress(labId, labMilestonesMap) {
  const lab = findLab(labId);
  const milestones = lab?.milestones || [];
  const total = milestones.length;
  if (total === 0) return { done: 0, total: 0, pct: 0, lastDoneIdx: -1, nextIdx: 0, nextMilestone: null };
  const flags = (labMilestonesMap && labMilestonesMap[labId]) || {};
  let done = 0;
  let lastDoneIdx = -1;
  let nextIdx = total;
  for (let i = 0; i < total; i += 1) {
    if (flags[milestones[i].id]) {
      done += 1;
      lastDoneIdx = i;
    } else if (nextIdx === total) {
      nextIdx = i;
    }
  }
  return {
    done,
    total,
    pct: total ? done / total : 0,
    lastDoneIdx,
    nextIdx,
    nextMilestone: nextIdx < total ? milestones[nextIdx] : null,
  };
}

export const PATH_KEYS = Object.keys(PATHS);

export function pathProgress(pathKey, completed) {
  const lessons = PATHS[pathKey]?.lessons || [];
  if (!lessons.length) return { done: 0, total: 0, pct: 0 };
  const done = lessons.filter((l) => completed[l.id]).length;
  return { done, total: lessons.length, pct: done / lessons.length };
}

// Badge tier from path completion (Initiate/Pro/Apex => bronze/silver/gold).
export function badgeFor(pct) {
  if (pct >= 1) return 'gold';
  if (pct >= 0.66) return 'silver';
  if (pct >= 0.33) return 'bronze';
  return null;
}
