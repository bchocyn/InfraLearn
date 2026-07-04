import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { resolveTier, BEASTS, SPECIES_KEYS } from '../data/beasts.js';
import { PATHS, PATH_KEYS, BACKGROUNDS, pathProgress, badgeFor, labProgress as labProgressFromContent } from '../data/content.js';
import { PROVINCES, LAPSE_KEYS, JOURNEY_CHAPTERS } from '../data/lore.js';
import { ACCENT_KEYS, BG_KEYS } from '../screens/settingsThemes.js';
import { TAMER_KEYS } from '../data/tamers.js';
import { ARMOR_KEYS } from '../data/armorSets.js';

// Allow-lists derived from static data — used to scrub user-supplied backups
// so a malicious or hand-edited file can't inject unexpected state.
const VALID_LESSON_IDS = new Set(Object.values(PATHS).flatMap((p) => p.lessons.map((l) => l.id)));
const VALID_BACKGROUND_IDS = new Set(BACKGROUNDS.map((b) => b.id));
const VALID_TAMER_IDS = new Set(TAMER_KEYS);
const VALID_ARMOR_IDS = new Set(ARMOR_KEYS);
// Lab ID → set of valid milestone IDs. Used to scrub `labMilestones` on
// import so a tampered backup can't add unknown lab IDs or milestone IDs.
const VALID_LAB_MILESTONES = (() => {
  const out = {};
  for (const p of Object.values(PATHS)) {
    for (const l of p.lessons) {
      if ((l.kind === 'lab' || l.lab === true) && Array.isArray(l.milestones)) {
        out[l.id] = new Set(l.milestones.map((m) => m.id));
      }
    }
  }
  return out;
})();
const VALID_LAB_IDS = new Set(Object.keys(VALID_LAB_MILESTONES));
// Derived from the theme tables so a theme added to Settings can never be
// silently rejected here (the old hand-copied list omitted 'amber', so the
// v2 migrate rescue force-reset Amber Dark users to Gruvbox on every
// version bump).
const VALID_ACCENTS = ACCENT_KEYS;
const VALID_BG_THEMES = BG_KEYS;
// Canonical codex fragment IDs (see loreFragmentTitle in lore.js for the
// schema). Derived from static data so adding a species/path/lapse extends
// the allow-list automatically.
const VALID_LORE_IDS = new Set([
  'world:myth',
  ...PATH_KEYS.map((k) => `province:${k}`),
  ...LAPSE_KEYS.map((k) => `lapse:${k}`),
  ...SPECIES_KEYS.flatMap((sp) => ['origin', 'field', 'saga', 'scar'].map((p) => `beast:${sp}:${p}`)),
]);

// ── Journey chapter gates (§5/§10) ─────────────────────────────────────────
// HARD gates — real learning milestones that no ember balance can buy past.
// Pure + exported so the Journey screen and tests share one source of truth.
// Returns { met, label } for chapter n (1..5) of the given province.
export function journeyGate(pathKey, n, state) {
  const completed = state.completed || {};
  const { pct, done } = pathProgress(pathKey, completed);
  const pathName = PATHS[pathKey]?.name || pathKey;
  const chapter = JOURNEY_CHAPTERS[n - 1];
  const label = chapter ? chapter.gateLabel(pathName) : '';
  switch (n) {
    case 1: return { met: done > 0, label };
    case 2: return { met: pct >= 0.33, label };
    case 3: {
      // Any species' tier on THIS path — switching companions mid-journey
      // must never lock a chapter the Keeper already earned.
      const tiers = state.beastTiers || {};
      const onPath = Object.values(tiers).map((cells) => cells?.[pathKey] || 1);
      return { met: Math.max(1, ...onPath) >= 2, label };
    }
    case 4: return { met: (state.streakHighWater || 0) >= 7, label };
    case 5: return { met: pct >= 1, label };
    default: return { met: false, label: '' };
  }
}

// Pure derivation: which codex fragments does this state qualify for?
// Shared by recomputeLore (organic unlocks, celebrated) and the v15 migrate
// (silent backfill so long-time users open the codex to their real history).
// Works on both live store state and the raw persisted blob — it only reads
// completed / beastTiers / companion.
export function deriveLoreUnlocks(state) {
  const out = new Set(['world:myth']);
  const completed = state.completed || {};
  const tiers = state.beastTiers || {};
  let anyGold = false;
  for (const k of PATH_KEYS) {
    const { pct, done } = pathProgress(k, completed);
    if (done > 0) out.add(`province:${k}`);
    // The province's lapse stirs once you push to bronze — deep enough in
    // for the villain to take notice.
    if (pct >= 0.33 && PROVINCES[k]?.lapse) out.add(`lapse:${PROVINCES[k].lapse}`);
    if (pct >= 1) anyGold = true;
  }
  // The Unteacher (finale) only reveals himself to Keepers who have
  // reclaimed a province outright.
  if (anyGold) out.add('lapse:hollow-ink');
  for (const sp of SPECIES_KEYS) {
    const cells = tiers[sp] || {};
    const trained = Object.keys(cells).length > 0;
    if (sp === state.companion || trained) out.add(`beast:${sp}:origin`);
    const maxTier = trained ? Math.max(...Object.values(cells).map((t) => (Number.isInteger(t) ? t : 1))) : 0;
    if (maxTier >= 2) out.add(`beast:${sp}:field`);
    if (maxTier >= 3) out.add(`beast:${sp}:saga`);
    if (maxTier >= 4) out.add(`beast:${sp}:scar`);
  }
  return out;
}
const MAX_STR_LEN = 64;

// Background unlock req strings live in BACKGROUNDS as free-form text like
// "Fundamentals · 6 lessons", "DevOps · Gold", "All paths · 100%". We parse
// them lazily here so the BACKGROUNDS data stays human-readable. Returns
// true when the user's `completed` map satisfies the condition.
// Derived from PATHS so newly added paths (fullstack, cybersec, …) are
// automatically resolvable — the old hand-maintained 6-entry map silently
// evaluated any req naming a newer path to false forever.
const PATH_NAME_TO_KEY = Object.fromEntries(
  PATH_KEYS.map((k) => [PATHS[k].name, k]),
);
function evalBackgroundReq(req, completed) {
  if (!req || typeof req !== 'string') return false;
  const s = req.replace(/\s+/g, ' ').trim();

  // "All paths · 100%" — every known path at full completion.
  if (/^All paths\s*·\s*100%$/i.test(s)) {
    return PATH_KEYS.every((k) => pathProgress(k, completed).pct >= 1);
  }
  // "{Path} · N lessons" — at least N concept lessons completed in that path.
  let m = s.match(/^(.+?)\s*·\s*(\d+)\s+lessons$/i);
  if (m) {
    const key = PATH_NAME_TO_KEY[m[1].trim()];
    if (!key) return false;
    const lessons = (PATHS[key]?.lessons || []).filter((l) => l.kind !== 'lab' && l.kind !== 'sd');
    const done = lessons.filter((l) => completed[l.id]).length;
    return done >= parseInt(m[2], 10);
  }
  // "{Path} · Gold" — pct >= 1.0 in that path (gold badge threshold).
  // "{Path} · 100%" — same condition.
  m = s.match(/^(.+?)\s*·\s*(Gold|100%)$/i);
  if (m) {
    const key = PATH_NAME_TO_KEY[m[1].trim()];
    if (!key) return false;
    return pathProgress(key, completed).pct >= 1;
  }
  // "{Path} · Silver" / "Bronze" — partial badges (33% / 66%).
  m = s.match(/^(.+?)\s*·\s*(Silver|Bronze)$/i);
  if (m) {
    const key = PATH_NAME_TO_KEY[m[1].trim()];
    if (!key) return false;
    const threshold = m[2].toLowerCase() === 'silver' ? 0.66 : 0.33;
    return pathProgress(key, completed).pct >= threshold;
  }
  return false;
}

function scrubString(v, fallback = '') {
  if (typeof v !== 'string') return fallback;
  // Strip ASCII control chars (0x00-0x1F, 0x7F) + clamp length.
  return v.replace(/[\x00-\x1F\x7F]/g, '').slice(0, MAX_STR_LEN) || fallback;
}
function scrubEnum(v, allowed, fallback) {
  return allowed.includes(v) ? v : fallback;
}
function scrubInt(v, min, max, fallback) {
  return Number.isInteger(v) && v >= min && v <= max ? v : fallback;
}
function scrubBoolMap(obj, validKeys) {
  if (!obj || typeof obj !== 'object') return {};
  const out = {};
  for (const k of Object.keys(obj)) {
    if (validKeys.has(k) && obj[k] === true) out[k] = true;
  }
  return out;
}
function scrubStringArray(arr, validSet) {
  if (!Array.isArray(arr)) return [];
  const seen = new Set();
  for (const v of arr) if (typeof v === 'string' && validSet.has(v)) seen.add(v);
  return [...seen];
}
// Scrub the labMilestones map: keep only known lab IDs, and within each
// lab keep only known milestone IDs whose value is strictly `true`.
// Scrub the quizMisses map: keep only known lesson IDs, and within each
// lesson keep only entries whose value is a {picked: int 0..3 | null} shape.
function scrubQuizMisses(obj) {
  if (!obj || typeof obj !== 'object') return {};
  const out = {};
  for (const lessonId of Object.keys(obj)) {
    // '__daily_practice__' is the synthetic bucket Home's daily-practice
    // recall misses live under — a real key, not tampering. Dropping it
    // here silently deleted those weak spots on every backup round-trip.
    if (!VALID_LESSON_IDS.has(lessonId) && lessonId !== '__daily_practice__') continue;
    const inner = obj[lessonId];
    if (!inner || typeof inner !== 'object') continue;
    const cleanInner = {};
    for (const prompt of Object.keys(inner)) {
      const v = inner[prompt];
      if (typeof prompt !== 'string') continue;
      if (prompt.length === 0 || prompt.length > 500) continue;
      const picked = v && Number.isInteger(v.picked) && v.picked >= 0 && v.picked <= 3
        ? v.picked
        : null;
      cleanInner[prompt] = { picked };
    }
    if (Object.keys(cleanInner).length > 0) out[lessonId] = cleanInner;
  }
  return out;
}

// Scrub the beastTiers matrix: keep only known species → known pathKey →
// integer tier in 1..4. Tamper-resistant for backup import.
function scrubBeastTiers(obj) {
  if (!obj || typeof obj !== 'object') return {};
  const out = {};
  for (const species of Object.keys(obj)) {
    if (!SPECIES_KEYS.includes(species)) continue;
    const inner = obj[species];
    if (!inner || typeof inner !== 'object') continue;
    const cleanInner = {};
    for (const pathKey of Object.keys(inner)) {
      if (!PATH_KEYS.includes(pathKey)) continue;
      const t = inner[pathKey];
      if (Number.isInteger(t) && t >= 1 && t <= 4) cleanInner[pathKey] = t;
    }
    if (Object.keys(cleanInner).length > 0) out[species] = cleanInner;
  }
  return out;
}

// Scrub the reviewQueue map: keep only known lesson IDs, clamp numeric
// FSRS fields to sane ranges, validate ISO date strings. A tampered backup
// can't inject a 10_000-day stability or a review for a non-existent lesson.
function scrubReviewQueue(obj) {
  if (!obj || typeof obj !== 'object') return {};
  const isIsoDay = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
  const out = {};
  for (const conceptId of Object.keys(obj)) {
    if (!VALID_LESSON_IDS.has(conceptId)) continue;
    const e = obj[conceptId];
    if (!e || typeof e !== 'object') continue;
    const stability = (typeof e.stability === 'number' && isFinite(e.stability))
      ? Math.min(36500, Math.max(0.1, e.stability)) : 1;
    const difficulty = (typeof e.difficulty === 'number' && isFinite(e.difficulty))
      ? Math.min(10, Math.max(1, e.difficulty)) : 5;
    const reps = scrubInt(e.reps, 0, 100000, 0);
    const lapses = scrubInt(e.lapses, 0, 100000, 0);
    out[conceptId] = {
      lastSeen: isIsoDay(e.lastSeen) ? e.lastSeen : null,
      // A malformed dueAt on an entry with history must resurface (due today),
      // not get nulled — a null dueAt strands the concept out of rotation forever.
      dueAt: isIsoDay(e.dueAt) ? e.dueAt : ((isIsoDay(e.lastSeen) || reps > 0) ? isoDay() : null),
      stability,
      difficulty,
      reps,
      lapses,
    };
  }
  return out;
}

function scrubLabMilestones(obj) {
  if (!obj || typeof obj !== 'object') return {};
  const out = {};
  for (const labId of Object.keys(obj)) {
    if (!VALID_LAB_IDS.has(labId)) continue;
    const inner = obj[labId];
    if (!inner || typeof inner !== 'object') continue;
    const validIds = VALID_LAB_MILESTONES[labId];
    const cleanInner = {};
    for (const mid of Object.keys(inner)) {
      if (validIds.has(mid) && inner[mid] === true) cleanInner[mid] = true;
    }
    if (Object.keys(cleanInner).length > 0) out[labId] = cleanInner;
  }
  return out;
}

// ── XP system (Engagement Tier B) ────────────────────────────────────────
// Cumulative thresholds for levels 1..10. xpLevel = highest index whose
// threshold is <= xp, +1 (so xp=0 → level 1, xp=100 → level 2, etc.).
// Evidence anchor: XP gains are tied to TESTED items (recall, daily-practice
// correct answers, review grades) — not lesson reading. Reading a lesson is
// free; the lightweight +5 completion ack is just the receipt.
export const XP_LEVEL_THRESHOLDS = [
  0, 100, 250, 500, 1000, 2000, 4000, 7500, 12000, 20000,
];
// Streak-milestone XP bonuses (read alongside the milestone set in Home.jsx).
const STREAK_MILESTONE_BONUS = { 3: 25, 7: 50, 14: 100, 30: 200, 100: 500 };
function levelFromXp(xp) {
  let lvl = 1;
  for (let i = 0; i < XP_LEVEL_THRESHOLDS.length; i++) {
    if (xp >= XP_LEVEL_THRESHOLDS[i]) lvl = i + 1;
    else break;
  }
  return lvl;
}

// Per-day activity counters (xp gained, lessons completed, reviews graded),
// bounded to the most recent N days. WeekRecap and the reviewer:10 badge
// read these instead of inferring from the 20-entry xpHistory log, which
// evicts far too fast to count anything reliably (an active day generates
// 20+ gains, so review entries fell out of the window before reaching 10).
const DAILY_STATS_KEEP = 14;
function bumpStat(stats, day, field, n) {
  const cur = (stats && typeof stats === 'object') ? stats : {};
  const entry = { xp: 0, lessons: 0, reviews: 0, ...(cur[day] || {}) };
  entry[field] = (entry[field] || 0) + n;
  const next = { ...cur, [day]: entry };
  const keys = Object.keys(next).sort();
  while (keys.length > DAILY_STATS_KEEP) delete next[keys.shift()];
  return next;
}

// Celebration priority — level-up beats badge beats XP toast. The slot is
// single-valued and every grant used to overwrite it unconditionally, so a
// streak-milestone badge or level-up fired earlier in completeLesson's
// synchronous batch was routinely clobbered by the trailing "+5 XP" ack.
// Equal rank → latest wins; anything older than 4s is stale (its moment
// has either been shown by CelebrationMoment or never will be).
const CELEBRATE_RANK = { level: 4, badge: 3, lore: 2, xp: 1 };
function shouldReplaceCelebrate(cur, nextKind) {
  if (!cur) return true;
  if (Date.now() - (cur.at || 0) > 4000) return true;
  return (CELEBRATE_RANK[nextKind] || 0) >= (CELEBRATE_RANK[cur.kind] || 0);
}

// Badge ID schema:
//   section:{normalized-section-name}   — every lesson in a content section
//                                         (e.g. 'section:fundamentals-essentials')
//   streak:{N}                          — 3 / 7 / 14 / 30 / 100
//   path:{pathKey}:bronze|silver|gold   — path completion tiers
//   daily:perfect                       — Daily Practice 5/5
//   recall:first                        — first free-recall ✓ Got it
//   reviewer:10                         — 10 reviews completed in one session
function normalizeSectionName(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Build the section → [lessonId, lessonId, ...] map up-front so the badge
// detector is O(1) per section. Empty sections (lessons without a `section`
// field) are skipped — only labeled sections grant badges.
const SECTION_LESSONS = (() => {
  const out = {};
  for (const p of Object.values(PATHS)) {
    for (const l of p.lessons) {
      if (typeof l.section === 'string' && l.section.trim().length > 0) {
        const key = normalizeSectionName(l.section);
        if (!out[key]) out[key] = [];
        out[key].push(l.id);
      }
    }
  }
  return out;
})();

const initial = {
  displayName: 'Learner',
  // The custom build-from-parts avatar was retired; a new account starts as a
  // default Beast Tamer. The legacy part fields stay in the shape for backup
  // migration safety but are no longer edited or rendered.
  avatar: { hair: 0, hairColor: '#6B4226', top: 0, topColor: '#7B9FB5', bottom: 0, shoes: 0, hat: 0, held: 0, tamer: 'ember_warden', armor: null },
  activePath: 'devops',
  companion: 'dragon',       // chosen species
  // Live evolution tier for the active (species, activePath) cell. Kept as a
  // top-level value so existing screens can read `s.beastTier` directly. The
  // source of truth is `beastTiers[species][pathKey]`; this is just a mirror.
  beastTier: 1,
  // Per-pet per-path evolution matrix. Shape: { [species]: { [pathKey]: 1..4 } }.
  // When a user switches companion or active path, beastTier above re-syncs to
  // the relevant cell (defaulting to 1 for cells never trained). No de-evolution:
  // recomputeEvolution only writes when the computed tier is strictly higher.
  beastTiers: {},
  beastBackground: 'meadow',
  completed: {},             // { lessonId: true }
  // Per-lab milestone progress for multi-week labs. Shape:
  //   { [labId]: { [milestoneId]: true } }
  // Labs without a `milestones` array in content.js never write here; their
  // single-completion behavior via `completed` is unchanged.
  labMilestones: {},
  unlockedBackgrounds: ['meadow'],
  // Math-quiz misses tracked for Review Weak Spots. Shape:
  //   { [lessonId]: { [questionPrompt]: { picked: 0..3 } } }
  // Keyed by prompt because the question array gets shuffled per attempt;
  // prompt text is the stable identifier across runs.
  quizMisses: {},
  pendingEvolution: null,    // species when a morph is waiting to be viewed
  // ── Path Ascension cinematic (journey layer) ────────────────────────────
  // When a path first reaches its gold seal (100%), the full-screen
  // "province reclaimed" cinematic queues here (pathKey) until viewed.
  // ascensionsSeen guarantees once-per-path even across re-imports.
  pendingAscension: null,
  ascensionsSeen: {},        // { [pathKey]: true }
  // ── Story cutscenes (journey layer) ─────────────────────────────────────
  // pendingCutscene holds a cutscene id ('enter:devops', 'notice:devops',
  // 'turn:devops') while one is queued; cutscenesSeen guarantees once-ever,
  // even across re-imports. Queued by setActivePath (province entry) and
  // computeNewBadges (bronze = the Lapse notices you, silver = the tide
  // turns). Gold already has the PathAscension cinematic.
  pendingCutscene: null,
  cutscenesSeen: {},         // { [cutsceneId]: true }
  // ── Ember economy (journey layer §10) ───────────────────────────────────
  // Embers ⟡ are the journey's soft currency, earned ONLY by learning
  // actions: lesson +3 · lab +5 · review graded +1 (cap 10/day) · daily
  // practice done +2 · streak day +1. Spent on journey stage entry, retries
  // and cosmetics in later phases. Mini-games never mint embers, and no
  // ember balance can skip a hard gate (path %, seals, tiers, streaks).
  embers: 0,
  // Per-day earn-cap counter for review embers. Same date-keyed slot pattern
  // as dailyPractice — a stale date means fresh counters.
  emberDaily: { date: null, reviews: 0 },
  // ── Codex fragments (journey layer §3) ──────────────────────────────────
  // { [fragmentId]: 'YYYY-MM-DD' } — unlock dates for lore fragments, granted
  // by real milestones via recomputeLore (never by games or purchases). IDs
  // are validated against VALID_LORE_IDS on import.
  loreUnlocked: {},
  // ── Journey chapter progress (§5) ────────────────────────────────────────
  // { [pathKey]: { chapter, paid, stars } } — chapter = highest COMPLETED
  // (0..5), paid = highest entry fee spent (chapter ≤ paid ≤ chapter+1, so a
  // paid-but-unfinished encounter survives navigation), stars = cumulative
  // encounter performance (≤3 per chapter, 15 max). Entering needs BOTH the
  // hard gate (journeyGate) and the ember fee — gates can't be bought.
  journey: {},
  // ── Minion/boss battle progress (Pokémon-style quiz battles) ─────────────
  // { [pathKey]: { minions, boss } } — minions = highest DEFEATED encounter
  // stage (0..5, a watermark like journey.chapter), boss = the province's
  // Lapse has been beaten. Encounters gate on path progress + the previous
  // stage; rewards mint only when the watermark advances (retries are free
  // practice, never XP farms).
  battles: {},
  onboarded: false,
  // First-run app tour ("how to use the app"). false until completed or skipped;
  // resetTour() flips it back so Settings → "How it works" can replay it.
  tourSeen: false,
  // deviceMode: null until the user picks one on the very first run, then 'mobile' | 'desktop'.
  // Determines whether .app-shell scales up with `zoom` on wide windows or stays as a phone column.
  settings: { reducedMotion: false, hideCompanion: false, accent: 'amber', background: 'gruvbox', deviceMode: null },
  // ── Streak system (Duolingo-style with forgiveness) ──────────────────
  // Evidence: streaks + insurance → +4% week-later return, -5% streak loss.
  // Pure streak anxiety w/o forgiveness contradicts Duolingo's own pacing data.
  streak: 0,                      // current consecutive-day streak count
  lastActivityDate: null,         // ISO 'YYYY-MM-DD' of last activity day
  streakFreezes: 1,               // earned freezes; spent manually pre-miss
  pendingFreeze: false,           // if true, next gap day burns a freeze instead of the streak
  weekendPasses: 2,               // auto-consumed on missed Sat/Sun; regen monthly
  weekendPassMonth: null,         // 'YYYY-MM' tracking last regen month
  // Every calendar day with any activity — drives the consistency heatmap.
  // Appended in recordActivity(); capped to the most recent ~400 days.
  activityDays: [],
  streakHighWater: 0,             // best streak ever (for celebration moments)
  // ── Spaced-repetition review queue (FSRS-flavored) ─────────────────────
  // Evidence: Cepeda 2006 meta (839 assessments) — spaced > massed, optimal
  // inter-study gap is an inverted-U over the retention horizon. FSRS-6 beats
  // SM-2 for 99.6% of users. We use a simplified FSRS-flavored scheduler:
  // stability grows on grade, difficulty creeps up on misses, due interval =
  // ceil(stability * difficulty^-0.5). Keyed by lesson ID so the review queue
  // joins cleanly to PATHS[*].lessons for titles, taglines, etc.
  // Shape: { [conceptId]: { lastSeen, dueAt, stability, difficulty, reps, lapses } }
  reviewQueue: {},

  // ── XP & badges (Engagement Tier B) ─────────────────────────────────────
  // Evidence: tie engagement to TESTED items (recall > recognition), provide
  // celebration moments, collection drives retention after dopamine fades.
  xp: 0,                     // total earned
  xpLevel: 1,                // derived level (computed from xp via thresholds)
  xpHistory: [],             // last 20 gains: [{ amount, reason, at: 'YYYY-MM-DD' }, ...]
  // badges: { [badgeId]: { unlockedAt: 'YYYY-MM-DD' } }
  badges: {},
  // Ephemeral one-shot signal for CelebrationMoment to display. Cleared by
  // consumer. Shape: { id, kind: 'xp' | 'level' | 'badge', amount?, level?,
  //                    badgeId?, at: timestamp }
  celebrate: null,
  // ── Daily Challenge (Brilliant + ustwo case-study pick) ─────────────────
  // ONE recall question per day, drawn from concepts the user has already
  // completed. Pinned card on Home — single CTA, ~60s, +8 XP on correct.
  // Reuses the spaced-rep `reviewQueue.lastSeen` signal to bias toward stale
  // concepts. Day-stable: once picked for a given calendar day, the concept
  // doesn't change even on remount. `date` is the ISO day this challenge
  // belongs to; mismatch with today → repick. `dailyChallengeStreak` is a
  // separate counter from the global activity streak so a user who only
  // does daily challenges still gets visible progress on the card.
  dailyChallenge: { date: null, conceptId: null, answered: false, correct: false },
  dailyChallengeStreak: 0,
  // Confidence calibration from daily challenges — per stated confidence level,
  // how many were right vs total. Drives the calibration readout in Settings.
  calibration: { guess: { right: 0, total: 0 }, likely: { right: 0, total: 0 }, certain: { right: 0, total: 0 } },
  // ── Combo multiplier (Engagement Layer) ────────────────────────────────
  // Consecutive-correct counter for tested items (predict/practice/fix-it/
  // fill-blank/explain-back/review:good/easy). One miss → 0. Capped at 5.
  // Learning-anchored, not session-length-anchored, per deep-research caveat
  // against slot-machine perception. Multiplier table (applied inside addXp):
  //   combo 0-2 → 1.0x  (no bonus shown)
  //   combo 3-4 → 1.5x
  //   combo 5   → 2.0x  (hard cap — never goes higher)
  practiceCombo: 0,

  // ── Daily Practice slot (persisted) ─────────────────────────────────────
  // Home's daily-practice card used to keep its whole session in component
  // state — remounting reset it to question 1 and re-awarded XP without
  // bound. The store owns one slot per local calendar day:
  //   { date: 'YYYY-MM-DD', answered: { [questionIdx]: 'right'|'wrong' }, done }
  // recordDailyAnswer() returns true only the FIRST time an index is
  // answered that day; callers gate XP on it.
  dailyPractice: { date: null, answered: {}, done: false },
  // ── Per-day stats (see bumpStat above) ──────────────────────────────────
  // { [isoDay]: { xp, lessons, reviews } }, last 14 days.
  dailyStats: {},

  // ── Cliffhanger (Zeigarnik open-loop) ────────────────────────────────────
  // When a lesson with a top-level `cliffhanger` field is completed, we stash
  // the unresolved question here so it surfaces as the FIRST card on the
  // user's NEXT session-open. Open loops drive both retention (the question
  // primes recall) and return (curiosity gap pulls the user back). Only one
  // slot — newer cliffhangers overwrite older ones. Cleared on view/dismiss.
  // Shape: { lessonId, question, savedAt: 'YYYY-MM-DD' } or { null, null, null }.
  pendingCliffhanger: { lessonId: null, question: null, savedAt: null },

  // ── System-design lab progress ─────────────────────────────────────────
  // Tracks multi-phase system-design lab state. Distinct from `labMilestones`
  // (which is for older milestone-tracked labs in content.js) — this map is
  // owned by the in-lesson "system-design-lab" block type and stores per-phase
  // completion + the learner's final reflection text + an ISO timestamp set
  // when completeLab() is called. Shape:
  //   { [labId]: { phasesCompleted: boolean[], reflection: string,
  //                completedAt: 'YYYY-MM-DDTHH:mm:ss.sssZ' | null } }
  // The phasesCompleted array length is set when the user first opens a phase
  // (the renderer pads/truncates to match the lab's authored phase count, so
  // editing a lab's phase count later doesn't corrupt the saved entry).
  labProgress: {},
};

// Combo → XP multiplier table. Single source of truth so the chip on Home
// and the addXp scaling agree on the threshold.
function comboMultiplier(combo) {
  if (combo >= 5) return 2.0;
  if (combo >= 3) return 1.5;
  return 1.0;
}
// Reason prefixes that count as "tested item" — these are what scale by the
// combo multiplier. Lesson-completion ack, streak day bonuses, daily-challenge
// and free-recall already-distinct flows are intentionally excluded so the
// multiplier stays anchored to consecutive-correct learning events.
const COMBO_REASON_PREFIXES = [
  'predict:',
  'practice:',
  'fix-it:',
  'fill-blank:',
  'explain-back:',
];
// Reviews are intentionally NOT combo-eligible: the combo is the lesson-practice
// chain (built via practicePass), so scaling review XP by it applied a stale
// multiplier that reviews could neither build nor break. Keep review XP flat.
const COMBO_REASON_EXACT = new Set();
function reasonCountsForCombo(reason) {
  if (typeof reason !== 'string') return false;
  if (COMBO_REASON_EXACT.has(reason)) return true;
  for (const p of COMBO_REASON_PREFIXES) if (reason.startsWith(p)) return true;
  return false;
}

// Local-date helpers. Use the user's clock — UTC would silently break streaks
// for anyone west of GMT after midnight local. Days are 'YYYY-MM-DD' strings
// (sortable, JSON-safe, no Date drift via persist round-trips).
function isoDay(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function isoMonth(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}
// Difference in calendar days between two 'YYYY-MM-DD' strings (b - a).
// Returns null if either is invalid. Uses noon UTC to dodge DST edge cases.
function daysBetween(a, b) {
  if (!a || !b) return null;
  const pa = a.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const pb = b.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!pa || !pb) return null;
  const da = Date.UTC(+pa[1], +pa[2] - 1, +pa[3], 12);
  const db = Date.UTC(+pb[1], +pb[2] - 1, +pb[3], 12);
  return Math.round((db - da) / 86400000);
}
// Add N days to a 'YYYY-MM-DD' string and return the new ISO day. N is
// floored to an integer; negatives are allowed but the FSRS scheduler only
// ever produces positives. Uses noon UTC anchoring like daysBetween so DST
// transitions don't shift the result by a day.
function addDays(day, n) {
  if (!day) return isoDay();
  const p = day.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!p) return isoDay();
  const ms = Date.UTC(+p[1], +p[2] - 1, +p[3], 12) + Math.floor(n) * 86400000;
  const d = new Date(ms);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

// Is the given 'YYYY-MM-DD' a Saturday or Sunday? Noon-UTC anchored like
// daysBetween so DST transitions can't shift the day-of-week. recordActivity
// walks every missed day in a gap through this to decide how many weekend
// passes the gap needs.
function dayIsWeekend(day) {
  const p = String(day || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!p) return false;
  const dow = new Date(Date.UTC(+p[1], +p[2] - 1, +p[3], 12)).getUTCDay();
  return dow === 0 || dow === 6;   // 0 = Sun, 6 = Sat
}

export const useStore = create(
  persist(
    (set, get) => ({
      ...initial,

      setName: (displayName) => set({ displayName: scrubString(displayName, 'Learner') }),
      setAvatar: (patch) => set((s) => ({ avatar: { ...s.avatar, ...patch } })),
      setActivePath: (activePath) => {
        const changed = activePath !== get().activePath;
        set((s) => {
          // Re-sync the mirror beastTier to the cell for the new (species, path).
          const cell = s.beastTiers?.[s.companion]?.[activePath] || 1;
          // Clear a stale pending-evolution (from the old path's higher tier)
          // when the new path's cell is lower — no dot/modal for a non-evolution.
          return { activePath, beastTier: cell, pendingEvolution: cell >= s.beastTier ? s.pendingEvolution : null };
        });
        get().recomputeEvolution();
        // Crossing into a new province for the first time plays its entry
        // cutscene. Onboarding's initial pick is exempt — the journey hasn't
        // started yet, and the Onboarding screen does its own scene-setting.
        if (changed && get().onboarded) get().queueCutscene(`enter:${activePath}`);
      },

      // ── Story cutscenes ────────────────────────────────────────────────
      // Queue a cutscene exactly once, ever. A queued Ascension cinematic
      // outranks story beats — the Cutscene component defers to it at render
      // time, and the pending slot survives until viewed either way.
      queueCutscene: (id) => {
        if (get().cutscenesSeen?.[id]) return;
        set((s) => ({
          pendingCutscene: s.pendingCutscene || id,
          cutscenesSeen: { ...(s.cutscenesSeen || {}), [id]: true },
        }));
      },
      clearPendingCutscene: () => set({ pendingCutscene: null }),
      // replayCutscene: re-show a cutscene on demand (e.g. the Journey screen's
      // "replay story" button), bypassing the once-ever cutscenesSeen guard.
      replayCutscene: (id) => set({ pendingCutscene: id }),
      chooseCompanion: (companion) => {
        set((s) => {
          // Switching companion drops the live tier to whatever that species
          // has already earned on the active path (1 if untouched).
          const cell = s.beastTiers?.[companion]?.[s.activePath] || 1;
          return { companion, beastTier: cell };
        });
        // Bonding with a species unlocks its origin fragment.
        get().recomputeLore();
      },
      setBackground: (beastBackground) => set({ beastBackground }),
      finishOnboarding: () => set({ onboarded: true }),
      completeTour: () => set({ tourSeen: true }),
      resetTour: () => set({ tourSeen: false }),
      setSetting: (k, v) => set((s) => ({ settings: { ...s.settings, [k]: v } })),
      clearPendingEvolution: () => set({ pendingEvolution: null }),

      completeLesson: (lessonId) => {
        // Guard against double-credit: re-marking an already-done lesson
        // (IntersectionObserver remount, completeLab passthrough, StrictMode
        // double-fire) still counts as activity but must NOT re-grade the
        // FSRS card — a fake "good" review inflates stability ×2.5 with zero
        // recall evidence and pushes the due date out.
        const alreadyDone = !!get().completed[lessonId];
        if (alreadyDone) {
          get().recordActivity();
          return;
        }
        set((s) => ({
          completed: { ...s.completed, [lessonId]: true },
          dailyStats: bumpStat(s.dailyStats, isoDay(), 'lessons', 1),
        }));
        get().recomputeEvolution();
        get().recomputeBackgrounds();
        get().recordActivity();
        // Fresh completion = grade 3 ("good"). Enters the spaced-repetition
        // queue so the user sees it again before they'd otherwise forget it.
        get().scheduleReview(lessonId, 3);
        // Lightweight ack — XP system intentionally weighs RECALL heavier.
        get().addXp(5, 'lesson:complete');
        get().computeNewBadges();
        // After badges so a lore moment never clobbers a fresh gold seal —
        // CELEBRATE_RANK puts badge above lore.
        get().recomputeLore();
        // Embers last: the +3 ⟡ suffix annotates whichever celebration
        // survived the batch (badge > lore > the plain XP ack).
        get().addEmbers(3);
      },

      // ── XP machinery (Engagement Tier B) ─────────────────────────────
      // Increments xp, appends to bounded history, recomputes derived level,
      // and emits a celebration signal. Level-up celebrations override XP
      // celebrations (a bigger moment beats a smaller one). Reason strings
      // are short namespaced tokens so we can grep call sites later.
      addXp: (amount, reason) => {
        const baseN = Number.isFinite(amount) ? Math.max(0, Math.floor(amount)) : 0;
        if (baseN <= 0) return;
        const reasonStr = String(reason || 'unknown');
        set((s) => {
          // Combo multiplier scales only tested-item reasons; everything else
          // (lesson:complete, streak:*, daily-challenge:*, recall:got-it,
          // daily:correct/perfect) stays at 1.0x so reading/streak rewards
          // can't compound the multiplier off-anchor.
          const mult = reasonCountsForCombo(reasonStr)
            ? comboMultiplier(s.practiceCombo || 0)
            : 1.0;
          const n = Math.floor(baseN * mult);
          const nextXp = s.xp + n;
          const nextLevel = levelFromXp(nextXp);
          const today = isoDay();
          const entry = { amount: n, reason: reasonStr, at: today };
          // Keep last 20 entries — bounded so persist stays small.
          const history = [entry, ...(Array.isArray(s.xpHistory) ? s.xpHistory : [])].slice(0, 20);
          const leveledUp = nextLevel > (s.xpLevel || 1);
          const kind = leveledUp ? 'level' : 'xp';
          // Respect celebration priority — a routine "+5 XP" toast must not
          // clobber a level-up or badge fired earlier in the same batch.
          const celebrate = shouldReplaceCelebrate(s.celebrate, kind)
            ? (leveledUp
              ? { id: `lvl-${nextLevel}-${Date.now()}`, kind: 'level', level: nextLevel, amount: n, at: Date.now() }
              : { id: `xp-${Date.now()}-${Math.floor(Math.random() * 1e6)}`, kind: 'xp', amount: n, at: Date.now() })
            : s.celebrate;
          return {
            xp: nextXp,
            xpLevel: nextLevel,
            xpHistory: history,
            celebrate,
            dailyStats: bumpStat(s.dailyStats, today, 'xp', n),
          };
        });
      },

      // ── Combo machinery (Engagement Layer) ───────────────────────────
      // practicePass / practiceMiss are wired from block renderers that grade
      // a tested item. Increment caps at 5 — beyond that the multiplier flat-
      // lines at 2.0x, so storing higher counts would only mislead the chip.
      // practiceMiss resets to 0; that's the "one mistake breaks the chain"
      // rule keeping the combo learning-anchored rather than session-anchored.
      practicePass: () => {
        set((s) => ({ practiceCombo: Math.min(5, (s.practiceCombo || 0) + 1) }));
      },
      practiceMiss: () => {
        set({ practiceCombo: 0 });
      },
      clearCelebration: () => set({ celebrate: null }),

      // ── Ember economy (journey layer) ────────────────────────────────
      // addEmbers: bump the balance and annotate the LIVE celebration (one
      // emitted in this same action batch) so the toast reads "+5 XP · +3 ⟡".
      // Embers never create their own celebration — they ride bigger moments.
      // The freshness window keeps a silent earn (e.g. a graded miss, which
      // awards no XP) from retro-labeling a stale toast from a prior action.
      addEmbers: (amount) => {
        const n = Number.isFinite(amount) ? Math.max(0, Math.floor(amount)) : 0;
        if (n <= 0) return;
        set((s) => {
          const fresh = s.celebrate && (Date.now() - (s.celebrate.at || 0)) < 1000;
          return {
            embers: Math.min(1_000_000, (s.embers || 0) + n),
            celebrate: fresh
              ? { ...s.celebrate, embers: (s.celebrate.embers || 0) + n }
              : s.celebrate,
          };
        });
      },
      // spendEmbers: deduct when the balance covers the cost; returns whether
      // it did. Callers (journey stage entry, retries, crafting) check hard
      // gates separately — embers pace, gates force the learning.
      spendEmbers: (amount) => {
        const n = Number.isFinite(amount) ? Math.max(0, Math.floor(amount)) : 0;
        if (n <= 0) return false;
        let ok = false;
        set((s) => {
          if ((s.embers || 0) < n) return s;
          ok = true;
          return { embers: s.embers - n };
        });
        return ok;
      },

      // ── Cliffhanger (Zeigarnik open-loop) ────────────────────────────────
      // setCliffhanger stamps the slot with today as savedAt. Called from
      // completeLesson when the lesson body carries a top-level `cliffhanger`
      // field (see Lesson.jsx). Single-slot — newer cliffhangers overwrite
      // older unviewed ones so the user only ever sees the most recent open
      // loop. clearCliffhanger resets to nulls on view or dismiss.
      setCliffhanger: (lessonId, question) => {
        if (typeof lessonId !== 'string' || typeof question !== 'string') return;
        if (lessonId.length === 0 || question.length === 0) return;
        set({
          pendingCliffhanger: {
            lessonId,
            question,
            savedAt: isoDay(),
          },
        });
      },
      clearCliffhanger: () => set({
        pendingCliffhanger: { lessonId: null, question: null, savedAt: null },
      }),

      // ── Daily Challenge ──────────────────────────────────────────────
      // Pick today's challenge concept. Called once on Home mount per day.
      // Selection rules:
      //   1. Pool = concepts the user has completed.
      //   2. Skip any concept asked in the last 7 days (its dailyChallenge
      //      slot would carry over otherwise — we only track ONE slot, so
      //      "last 7 days" is approximated by: if today is within 7 days of
      //      the existing entry's `date` AND it's the same conceptId, repick).
      //   3. Among the rest, prefer concepts whose reviewQueue.lastSeen is
      //      oldest (longest gap → highest marginal benefit, per Cepeda).
      //   4. If no review-queue data, fall back to a random completed
      //      concept (deterministic per day via dayIndex seed).
      // If the user has zero completions, the field stays { date: today,
      // conceptId: null } so the card renders the "complete your first
      // lesson" empty state without retrying on every render.
      pickDailyChallenge: () => {
        const today = isoDay();
        const current = get().dailyChallenge || {};
        // Same-day reuse — don't burn cycles repicking on every mount.
        // Truthy conceptId = a real pick already made today (no-op on remount).
        // A null placeholder (zero-completion empty state) must fall through so a
        // freshly-completed first lesson unlocks the challenge same-day.
        if (current.date === today && current.conceptId != null) return;

        const completed = get().completed || {};
        const completedIds = Object.keys(completed).filter(
          (id) => completed[id] && VALID_LESSON_IDS.has(id),
        );
        if (completedIds.length === 0) {
          // Skip the write when an identical placeholder is already in the
          // slot — every set() is a full persist serialization, and this
          // ran on EVERY Home mount for zero-completion users.
          if (current.date !== today) {
            set({ dailyChallenge: { date: today, conceptId: null, answered: false, correct: false } });
          }
          return;
        }

        // Bias against "the same concept two days in a row" — if yesterday's
        // challenge is still in the slot and today's repick lands on it,
        // we'll prefer anything else when possible.
        const yesterdayConcept = current.conceptId;

        // Sort by lastSeen ascending (older first). Concepts with no queue
        // entry sort BEFORE concepts with any lastSeen — they're maximally
        // stale by definition (never tested since completion).
        const reviewQueue = get().reviewQueue || {};
        const ranked = completedIds.slice().sort((a, b) => {
          const la = reviewQueue[a]?.lastSeen || '';
          const lb = reviewQueue[b]?.lastSeen || '';
          if (la === lb) return a < b ? -1 : 1;
          return la < lb ? -1 : 1;
        });

        // Drop yesterday's concept from the head when we have alternatives.
        let candidates = ranked;
        if (yesterdayConcept && ranked.length > 1) {
          candidates = ranked.filter((id) => id !== yesterdayConcept);
        }

        // Pick from the top-3 stalest using a day-stable index so the choice
        // doesn't reshuffle within a calendar day on remount.
        const topK = candidates.slice(0, Math.min(3, candidates.length));
        const seed = today.split('-').reduce((acc, n) => acc * 31 + parseInt(n, 10), 7);
        const conceptId = topK[seed % topK.length];

        set({
          dailyChallenge: {
            date: today,
            conceptId,
            answered: false,
            correct: false,
          },
        });
      },

      // Record the user's answer to today's challenge. `correct` is the
      // outcome of grading (caller does the grading — store doesn't know
      // the question shape). Side effects:
      //   - flips answered=true, stores the correct flag
      //   - if correct: bumps dailyChallengeStreak, awards +8 XP, calls
      //     recordActivity() so the global streak also counts
      //   - if incorrect: resets dailyChallengeStreak to 0 (loose streak —
      //     it's a fun nudge, not a punishment ladder), still calls
      //     recordActivity() so the user gets streak credit for trying
      // Idempotent on the same calendar day — repeat calls become no-ops
      // so the user can't farm XP by re-clicking.
      answerDailyChallenge: (correct, confidence) => {
        const today = isoDay();
        const cur = get().dailyChallenge || {};
        if (cur.date !== today) return;          // stale slot, ignore
        if (cur.answered) return;                // already answered today
        const isCorrect = !!correct;
        set((s) => {
          const next = {
            dailyChallenge: { ...cur, answered: true, correct: isCorrect },
            dailyChallengeStreak: isCorrect
              ? (s.dailyChallengeStreak || 0) + 1
              : 0,
          };
          // Record confidence calibration when a level was given (MCQ path).
          if (confidence === 'guess' || confidence === 'likely' || confidence === 'certain') {
            const c = s.calibration || {};
            const slot = c[confidence] || { right: 0, total: 0 };
            next.calibration = {
              ...c,
              [confidence]: { right: slot.right + (isCorrect ? 1 : 0), total: slot.total + 1 },
            };
          }
          return next;
        });
        get().recordActivity();
        if (isCorrect) get().addXp(8, 'daily-challenge:correct');
      },

      // ── Daily Practice persistence ───────────────────────────────────
      // See the `dailyPractice` slot in `initial`. Returns true only the
      // FIRST time `idx` is answered on the current local day — Home gates
      // XP on the return value, which closes the remount-and-re-answer
      // farming loop the old component-state version allowed.
      recordDailyAnswer: (idx, verdict) => {
        if (!Number.isInteger(idx) || idx < 0 || idx > 9) return false;
        const v = verdict === 'right' ? 'right' : 'wrong';
        const today = isoDay();
        let first = false;
        set((s) => {
          const cur = (s.dailyPractice && s.dailyPractice.date === today)
            ? s.dailyPractice
            : { date: today, answered: {}, done: false };
          if (cur.answered[idx] != null) return { dailyPractice: cur };
          first = true;
          return { dailyPractice: { ...cur, answered: { ...cur.answered, [idx]: v } } };
        });
        return first;
      },
      // Latch today's done flag. Returns true exactly once per day (the
      // latch edge) so the +20 perfect bonus can't repeat either.
      markDailyPracticeDone: () => {
        const today = isoDay();
        let latched = false;
        set((s) => {
          const cur = (s.dailyPractice && s.dailyPractice.date === today)
            ? s.dailyPractice
            : { date: today, answered: {}, done: false };
          if (cur.done) return { dailyPractice: cur };
          latched = true;
          return { dailyPractice: { ...cur, done: true } };
        });
        // Drill embers ride the same once-a-day latch as the perfect bonus.
        if (latched) get().addEmbers(2);
        return latched;
      },

      // Grant a badge by id with today's date. Idempotent — re-granting an
      // already-owned badge is a no-op. Emits a celebration so the UI flashes
      // a confetti burst on unlock. Caller should pass the canonical badge id
      // (see schema above).
      grantBadge: (id) => {
        if (typeof id !== 'string' || id.length === 0) return;
        const cur = get().badges || {};
        if (cur[id]) return;
        const today = isoDay();
        set((s) => ({
          badges: { ...(s.badges || {}), [id]: { unlockedAt: today } },
          // Priority-aware: a badge replaces an XP toast but never a fresh
          // level-up moment (see shouldReplaceCelebrate).
          celebrate: shouldReplaceCelebrate(s.celebrate, 'badge')
            ? { id: `badge-${id}-${Date.now()}`, kind: 'badge', badgeId: id, at: Date.now() }
            : s.celebrate,
        }));
      },

      // Detect newly earned badges after any state change. Idempotent — only
      // grants badges that aren't already in the map. Called from
      // completeLesson (section unlocks), recordActivity (streak milestones),
      // recomputeEvolution path-tier checks happen elsewhere, etc.
      computeNewBadges: () => {
        const s = get();
        const have = s.badges || {};
        const completed = s.completed || {};

        // Section badges — every lesson in a section completed.
        for (const sectionKey of Object.keys(SECTION_LESSONS)) {
          const id = `section:${sectionKey}`;
          if (have[id]) continue;
          const ids = SECTION_LESSONS[sectionKey];
          if (ids.length > 0 && ids.every((lid) => completed[lid])) {
            get().grantBadge(id);
          }
        }

        // Path tier badges — bronze (33%) / silver (66%) / gold (100%).
        // Ascending order: when several tiers unlock in one pass (e.g. a big
        // import), the LAST grant wins the celebration slot among equal-rank
        // badges — so the user sees gold, not bronze.
        for (const k of PATH_KEYS) {
          const { pct } = pathProgress(k, completed);
          if (pct >= 0.33 && !have[`path:${k}:bronze`]) {
            get().grantBadge(`path:${k}:bronze`);
            // A third of the province reclaimed — its Lapse takes notice.
            get().queueCutscene(`notice:${k}`);
          }
          if (pct >= 0.66 && !have[`path:${k}:silver`]) {
            get().grantBadge(`path:${k}:silver`);
            // Two thirds — the tide turns, and the Lapse feels it.
            get().queueCutscene(`turn:${k}`);
          }
          if (pct >= 1 && !have[`path:${k}:gold`]) {
            get().grantBadge(`path:${k}:gold`);
            // Province reclaimed — queue the Ascension cinematic exactly once
            // per path, ever (survives re-imports via ascensionsSeen).
            if (!get().ascensionsSeen?.[k]) {
              set((s) => ({
                pendingAscension: k,
                ascensionsSeen: { ...(s.ascensionsSeen || {}), [k]: true },
              }));
            }
          }
        }
      },

      clearPendingAscension: () => set({ pendingAscension: null }),

      // ── Codex fragment unlocks (journey layer §3) ─────────────────────
      // Diff current entitlements (deriveLoreUnlocks) against loreUnlocked
      // and grant what's missing, stamped with today. Emits ONE "Codex
      // fragment recovered" celebration for the last newly-granted fragment
      // — except world:myth, which is ambient scene-setting, not a moment.
      // Idempotent; cheap enough to call after any milestone-bearing action.
      recomputeLore: () => {
        const s = get();
        const have = s.loreUnlocked || {};
        const wanted = deriveLoreUnlocks(s);
        const today = isoDay();
        let added = null;
        let next = null;
        for (const id of wanted) {
          if (have[id]) continue;
          if (!next) next = { ...have };
          next[id] = today;
          if (id !== 'world:myth') added = id;
        }
        if (!next) return;
        set((st) => ({
          loreUnlocked: next,
          celebrate: (added && shouldReplaceCelebrate(st.celebrate, 'lore'))
            ? { id: `lore-${added}-${Date.now()}`, kind: 'lore', loreId: added, at: Date.now() }
            : st.celebrate,
        }));
      },

      // ── Journey chapter actions (§5/§10) ──────────────────────────────
      // enterChapter: open chapter n of a province. Gated on REAL LEARNING
      // only (journeyGate) — never on currency. The next chapter opens once its
      // hard gate is met; re-opening is idempotent (the `paid` field is the
      // "opened up to" watermark, kept for save-shape compatibility). Returns
      // { ok, reason } so the screen can explain a refusal. Embers are an earned
      // reward now, never a toll on learning.
      enterChapter: (pathKey, n) => {
        if (!PATH_KEYS.includes(pathKey)) return { ok: false, reason: 'unknown-province' };
        if (!Number.isInteger(n) || n < 1 || n > JOURNEY_CHAPTERS.length) {
          return { ok: false, reason: 'unknown-chapter' };
        }
        const cur = get().journey?.[pathKey] || { chapter: 0, paid: 0, stars: 0 };
        if (cur.paid >= n) return { ok: true, reason: 'already-open' };
        if (n !== cur.chapter + 1) return { ok: false, reason: 'chapter-order' };
        if (!journeyGate(pathKey, n, get()).met) return { ok: false, reason: 'gate' };
        set((s) => ({
          journey: {
            ...(s.journey || {}),
            [pathKey]: { ...cur, paid: n },
          },
        }));
        return { ok: true, reason: 'open' };
      },
      // completeChapter: the encounter was answered correctly. Awards +5 XP
      // exactly once per chapter (the chapter watermark is the latch) and
      // records stars (3 = first try, floor 1). Story beats re-read freely.
      completeChapter: (pathKey, n, stars) => {
        if (!PATH_KEYS.includes(pathKey)) return;
        if (!Number.isInteger(n) || n < 1 || n > JOURNEY_CHAPTERS.length) return;
        const cur = get().journey?.[pathKey] || { chapter: 0, paid: 0, stars: 0 };
        if (cur.paid < n || cur.chapter >= n) return;
        const earned = Math.min(3, Math.max(1, Number.isInteger(stars) ? stars : 1));
        set((s) => ({
          journey: {
            ...(s.journey || {}),
            [pathKey]: { ...cur, chapter: n, stars: Math.min(15, (cur.stars || 0) + earned) },
          },
        }));
        get().addXp(5, `journey:${pathKey}:${n}`);
        // The chapter's story plays as a cinematic cutscene (once per chapter).
        get().queueCutscene(`chapter:${pathKey}:${n}`);
      },

      // recordBattleWin: a minion encounter (stage 1..5) or the province boss
      // was defeated in a quiz battle. Watermark semantics like completeChapter:
      // XP mints only when the watermark actually advances, so replaying a
      // beaten stage is free practice, not a farm. Boss needs all 5 minions.
      recordBattleWin: (pathKey, stage) => {
        if (!PATH_KEYS.includes(pathKey)) return;
        const cur = get().battles?.[pathKey] || { minions: 0, boss: false };
        if (stage === 'boss') {
          if (cur.boss || cur.minions < 5) return;
          set((s) => ({ battles: { ...(s.battles || {}), [pathKey]: { ...cur, boss: true } } }));
          get().addXp(40, `battle:boss:${pathKey}`);
          get().recordActivity();
          return;
        }
        if (!Number.isInteger(stage) || stage < 1 || stage > 5) return;
        // Sequential: can only advance the watermark by exactly one.
        if (stage !== cur.minions + 1) return;
        set((s) => ({ battles: { ...(s.battles || {}), [pathKey]: { ...cur, minions: stage } } }));
        get().addXp(15, `battle:minion:${pathKey}:${stage}`);
        get().recordActivity();
      },

      // ── Spaced-repetition scheduler (FSRS-flavored) ──────────────────
      // grade: 1=miss, 2=hard, 3=good, 4=easy.
      // Stability grows multiplicatively with grade; difficulty (1..10) creeps
      // up on misses and clamps. Interval = ceil(stability * difficulty^-0.5)
      // — higher difficulty pulls the next review CLOSER, which is the inverse
      // relationship FSRS uses (a hard card should come back sooner). For miss,
      // we hard-reset stability to 1 and force a 1-day re-look (Cepeda's
      // optimal-gap inverted-U at the short end).
      scheduleReview: (conceptId, grade) => {
        if (!VALID_LESSON_IDS.has(conceptId)) return;
        const g = Number.isInteger(grade) && grade >= 1 && grade <= 4 ? grade : 3;
        const today = isoDay();
        set((s) => {
          const prev = s.reviewQueue[conceptId] || {
            lastSeen: null, dueAt: null,
            stability: 1, difficulty: 5,
            reps: 0, lapses: 0,
          };
          let stability = prev.stability;
          let difficulty = prev.difficulty;
          let lapses = prev.lapses;
          let interval;

          if (g === 1) {
            // Miss — reset stability, bump difficulty (capped at 10), revisit tomorrow.
            stability = 1;
            difficulty = Math.min(10, difficulty + 0.5);
            lapses = lapses + 1;
            interval = 1;
          } else {
            // Hard / good / easy — multiplicatively grow stability, then schedule
            // by stability scaled down by sqrt(difficulty). Constants chosen so a
            // first "good" review lands ~1 day out, a second ~3 days, a third
            // ~7-8 days (Cepeda inverted-U: ~20-40% of a 1-week horizon).
            const mult = g === 2 ? 1.2 : g === 3 ? 2.5 : 3.5;
            stability = Math.min(36500, stability * mult);
            // "Easy" nudges difficulty down slightly so a streak of easies pushes
            // the card further out, matching FSRS-6's difficulty-decay behavior.
            if (g === 4) difficulty = Math.max(1, difficulty - 0.15);
            interval = Math.max(1, Math.ceil(stability * Math.pow(difficulty, -0.5)));
          }

          const next = {
            lastSeen: today,
            dueAt: addDays(today, interval),
            stability,
            difficulty,
            reps: prev.reps + 1,
            lapses,
          };
          return { reviewQueue: { ...s.reviewQueue, [conceptId]: next } };
        });
      },

      // markReviewed = scheduleReview + recordActivity (so a review session
      // counts toward the streak). Used by the Reviews screen self-grade row.
      // XP awarded by grade: Hard +3, Good/Easy +6, Miss 0 (recall failure
      // doesn't earn — it'll come back tomorrow for another shot).
      markReviewed: (conceptId, grade) => {
        get().scheduleReview(conceptId, grade);
        get().recordActivity();
        const g = Number.isInteger(grade) ? grade : 3;
        const today = isoDay();
        // Count EVERY graded review — misses too — toward the day's tally.
        // The old xpHistory-based count missed grade-1 reviews (no XP entry)
        // and got starved by the 20-entry eviction window.
        set((s) => ({ dailyStats: bumpStat(s.dailyStats, today, 'reviews', 1) }));
        if (g === 2)      get().addXp(3, 'review:hard');
        else if (g >= 3)  get().addXp(6, 'review:good');
        // Patrol embers: +1 per graded review — misses included, a patrol
        // walked is a patrol walked — capped at 10/day so spam-grading can't
        // mint currency (same anti-farm stance as daily practice).
        let emberEarned = false;
        set((s) => {
          const cur = (s.emberDaily && s.emberDaily.date === today)
            ? s.emberDaily
            : { date: today, reviews: 0 };
          if (cur.reviews >= 10) return { emberDaily: cur };
          emberEarned = true;
          return { emberDaily: { ...cur, reviews: cur.reviews + 1 } };
        });
        if (emberEarned) get().addEmbers(1);
        // Reviewer:10 badge — 10 reviews graded in one calendar day.
        const todayReviews = get().dailyStats?.[today]?.reviews || 0;
        if (todayReviews >= 10 && !(get().badges || {})['reviewer:10']) {
          get().grantBadge('reviewer:10');
        }
      },

      // ── Streak machinery ─────────────────────────────────────────────
      // Call when the user completes a lesson, daily-practice session, or
      // review session. Same-day calls are no-ops. Logic:
      //   gap = 0  → already counted today
      //   gap = 1  → consecutive, streak += 1
      //   gap > 1  → check forgiveness: pendingFreeze (manual) → weekend
      //              pass (auto, if missed day was Sat/Sun) → reset to 1
      //   first activity ever → streak = 1
      recordActivity: () => {
        get().refillWeekendPassesIfNewMonth();
        const today = isoDay();
        // Capture pre-update streak so we can detect milestone crossings + the
        // "this is a new day" condition. The set() below is the source of
        // truth for the new streak; we award XP afterwards based on the diff.
        const before = {
          streak: get().streak,
          last: get().lastActivityDate,
        };
        set((s) => {
          // First-ever activity: open the streak at 1.
          if (!s.lastActivityDate) {
            return {
              streak: 1,
              lastActivityDate: today,
              streakHighWater: Math.max(1, s.streakHighWater || 0),
            };
          }
          const gap = daysBetween(s.lastActivityDate, today);
          // Same day → no streak change.
          if (gap === 0) return s;
          // Garbage or FUTURE lastActivityDate (skewed clock, tampered
          // import) used to freeze the entire streak machinery until the
          // wall clock caught up — gap stayed <= 0 and the date was never
          // rewritten. Heal: re-anchor to today, keep the streak.
          if (gap === null || gap < 0) {
            const kept = Math.max(1, s.streak || 0);
            return {
              streak: kept,
              lastActivityDate: today,
              streakHighWater: Math.max(kept, s.streakHighWater || 0),
            };
          }
          if (gap === 1) {
            const next = s.streak + 1;
            return {
              streak: next,
              lastActivityDate: today,
              streakHighWater: Math.max(next, s.streakHighWater || 0),
            };
          }
          // gap > 1 — day(s) were missed. The streak survives when EVERY
          // missed day is covered: weekend passes cover missed Sat/Sun days
          // (one pass each — so Fri→Mon burns two), and an armed freeze
          // covers ONE missed day of any kind. A 2-week vacation can never
          // be forgiven by a single freeze — at most 3 days (2 passes + 1
          // freeze) are coverable, which was the old unbounded-freeze bug.
          const missedCount = gap - 1;
          let weekendMissed = 0;
          for (let i = 1; i <= missedCount; i++) {
            if (dayIsWeekend(addDays(s.lastActivityDate, i))) weekendMissed++;
          }
          const passesUsed = Math.min(weekendMissed, s.weekendPasses || 0);
          const uncovered = missedCount - passesUsed;
          const freezeUsed = s.pendingFreeze === true && uncovered === 1;
          if (uncovered === 0 || freezeUsed) {
            const next = s.streak + 1;
            return {
              streak: next,
              lastActivityDate: today,
              weekendPasses: (s.weekendPasses || 0) - passesUsed,
              pendingFreeze: freezeUsed ? false : s.pendingFreeze,
              streakHighWater: Math.max(next, s.streakHighWater || 0),
            };
          }
          // No forgiveness combination covers the gap → reset (today counts).
          // A pendingFreeze that couldn't save this streak is cleared rather
          // than silently lingering to absorb some unrelated future gap.
          return {
            streak: 1,
            lastActivityDate: today,
            pendingFreeze: false,
            streakHighWater: Math.max(1, s.streakHighWater || 0),
          };
        });
        // After the set: if we crossed into a new calendar day, award the
        // automatic +2 streak-day XP and any milestone bonus. Skip on no-op
        // same-day calls so reading three lessons doesn't trigger three +2s.
        const after = { streak: get().streak, last: get().lastActivityDate };
        if (after.last === today && before.last !== today) {
          set((s) => ({ activityDays: [...new Set([...(s.activityDays || []), today])].slice(-400) }));
          get().addXp(2, 'streak:day');
          // A night held on the Long Watch — one ember per streak-bearing day.
          get().addEmbers(1);
          const bonus = STREAK_MILESTONE_BONUS[after.streak];
          if (bonus) {
            get().addXp(bonus, `streak:milestone:${after.streak}`);
            get().grantBadge(`streak:${after.streak}`);
            // Big milestones also bank a streak freeze (capped at 2).
            // Freezes previously had NO earn path — once the single starter
            // freeze was spent, the Settings freeze button was dead forever.
            if (after.streak === 7 || after.streak === 30 || after.streak === 100) {
              set((s) => ({ streakFreezes: Math.min(2, (s.streakFreezes || 0) + 1) }));
            }
          }
        }
      },

      // User-initiated: "I know I'll miss tomorrow." Sets the pendingFreeze
      // flag so recordActivity's next gap-detection consumes the freeze
      // instead of resetting. No-op when the user has no freezes left or
      // one is already pending.
      spendFreeze: () => {
        set((s) => {
          if (s.streakFreezes <= 0 || s.pendingFreeze) return s;
          return { streakFreezes: s.streakFreezes - 1, pendingFreeze: true };
        });
      },

      // Idempotent monthly refill. Called on app load + every activity record
      // so a user who comes back after a month break still gets fresh passes.
      refillWeekendPassesIfNewMonth: () => {
        const m = isoMonth();
        const s = get();
        if (s.weekendPassMonth !== m) {
          set({ weekendPasses: 2, weekendPassMonth: m });
        }
      },

      // Mark or clear a single milestone on a lab. No-op when the lab id
      // isn't a known multi-milestone lab — guards against typos and
      // tampered callers.
      setLabMilestone: (labId, milestoneId, done) => {
        if (!VALID_LAB_IDS.has(labId)) return;
        if (!VALID_LAB_MILESTONES[labId].has(milestoneId)) return;
        set((s) => {
          const inner = { ...(s.labMilestones[labId] || {}) };
          if (done) inner[milestoneId] = true;
          else delete inner[milestoneId];
          return { labMilestones: { ...s.labMilestones, [labId]: inner } };
        });
      },

      // ── System-design lab actions ────────────────────────────────────
      // markPhaseComplete: flip the boolean for one phase. The phasesCompleted
      // array is auto-grown to (phaseIndex + 1) so callers don't have to seed
      // it up front. Existing trailing booleans are preserved; newly added
      // slots default to false. Idempotent — re-marking a completed phase
      // is a no-op.
      markPhaseComplete: (labId, phaseIndex) => {
        if (typeof labId !== 'string' || labId.length === 0) return;
        if (!Number.isInteger(phaseIndex) || phaseIndex < 0 || phaseIndex > 32) return;
        set((s) => {
          const cur = s.labProgress?.[labId] || {
            phasesCompleted: [],
            reflection: '',
            completedAt: null,
          };
          const arr = Array.isArray(cur.phasesCompleted) ? cur.phasesCompleted.slice() : [];
          while (arr.length <= phaseIndex) arr.push(false);
          if (arr[phaseIndex] === true) return s; // no-op
          arr[phaseIndex] = true;
          return {
            labProgress: {
              ...s.labProgress,
              [labId]: { ...cur, phasesCompleted: arr },
            },
          };
        });
      },

      // setLabReflection: store the learner's free-text reflection. Length-
      // clamped so a paste of war-and-peace can't bloat persisted state.
      setLabReflection: (labId, text) => {
        if (typeof labId !== 'string' || labId.length === 0) return;
        const t = typeof text === 'string' ? text.slice(0, 2000) : '';
        set((s) => {
          const cur = s.labProgress?.[labId] || {
            phasesCompleted: [],
            reflection: '',
            completedAt: null,
          };
          return {
            labProgress: {
              ...s.labProgress,
              [labId]: { ...cur, reflection: t },
            },
          };
        });
      },

      // completeLab: stamp completedAt, mark the lab as a completed "lesson"
      // (so it counts toward path progress / badges if it appears in content),
      // award +100 XP, and record activity for the streak. Idempotent on
      // the same lab — if completedAt is already set, we still hit
      // recordActivity but skip the XP grant + completion side-effects.
      completeLab: (labId) => {
        if (typeof labId !== 'string' || labId.length === 0) return;
        const already = !!get().labProgress?.[labId]?.completedAt;
        if (already) {
          get().recordActivity();
          return;
        }
        set((s) => {
          const cur = s.labProgress?.[labId] || {
            phasesCompleted: [],
            reflection: '',
            completedAt: null,
          };
          return {
            labProgress: {
              ...s.labProgress,
              [labId]: { ...cur, completedAt: new Date().toISOString() },
            },
          };
        });
        get().completeLesson(labId);
        get().addXp(100, `lab:${labId}`);
        // Lab bonus on top of the lesson-credit embers (3 + 5 = 8 total),
        // mirroring how lab XP stacks on the lesson ack (+5 + 100).
        get().addEmbers(5);
        get().recordActivity();
      },

      // Evolve the companion if thresholds are met for the active path.
      // Per-pet per-path: writes into beastTiers[species][pathKey], then
      // re-syncs the mirror beastTier value if the active cell moved up.
      // No de-evolution — only writes when the computed tier is strictly
      // higher than the current cell.
      recomputeEvolution: () => {
        const s = get();
        const { pct } = pathProgress(s.activePath, s.completed);
        const badge = badgeFor(pct);
        const current = s.beastTiers?.[s.companion]?.[s.activePath] || 1;
        const nextTier = resolveTier(current, { lessons: Object.keys(s.completed).length, pathPct: pct, badge });
        if (nextTier > current) {
          const nextTiers = {
            ...s.beastTiers,
            [s.companion]: {
              ...(s.beastTiers[s.companion] || {}),
              [s.activePath]: nextTier,
            },
          };
          set({
            beastTiers: nextTiers,
            beastTier: nextTier,           // keep mirror in sync for consumers
            pendingEvolution: s.companion,
          });
          // Tier-ups unlock beast codex fragments (field/saga/scar).
          get().recomputeLore();
        }
      },

      unlockBackground: (id) =>
        set((s) => s.unlockedBackgrounds.includes(id) ? s : { unlockedBackgrounds: [...s.unlockedBackgrounds, id] }),

      // Record a wrong answer to a quiz question. Called from MathQuiz the
      // moment the user submits a wrong choice; the entry stays until the
      // user retakes that quiz and gets the same question right (handled
      // by clearQuizMiss). Idempotent — repeated wrong picks just overwrite.
      recordQuizMiss: (lessonId, prompt, picked) => {
        if (typeof lessonId !== 'string' || typeof prompt !== 'string') return;
        set((s) => ({
          quizMisses: {
            ...s.quizMisses,
            [lessonId]: {
              ...(s.quizMisses[lessonId] || {}),
              [prompt]: { picked: Number.isInteger(picked) ? picked : null },
            },
          },
        }));
      },
      clearQuizMiss: (lessonId, prompt) => {
        set((s) => {
          const lessonMap = s.quizMisses[lessonId];
          if (!lessonMap || !(prompt in lessonMap)) return s;
          const { [prompt]: _gone, ...rest } = lessonMap;
          const next = { ...s.quizMisses };
          if (Object.keys(rest).length === 0) delete next[lessonId];
          else next[lessonId] = rest;
          return { quizMisses: next };
        });
      },

      // Re-evaluate every background's `req` against current progress and
      // unlock the ones whose condition now passes. Idempotent — already
      // unlocked entries stay unlocked. Called after lesson completion so
      // the unlocked-scenes list is always in sync with progress.
      recomputeBackgrounds: () => {
        const s = get();
        const nextUnlocked = [...s.unlockedBackgrounds];
        let changed = false;
        for (const bg of BACKGROUNDS) {
          if (!bg.req) continue;                       // 'meadow' has req: null
          if (nextUnlocked.includes(bg.id)) continue;  // already earned
          if (evalBackgroundReq(bg.req, s.completed)) {
            nextUnlocked.push(bg.id);
            changed = true;
          }
        }
        if (changed) set({ unlockedBackgrounds: nextUnlocked });
      },

      // Backup export / import
      exportData: () => {
        const s = get();
        // Only the keys in `initial` are exported — actions and any future
        // transients never leak into the backup file.
        const payload = {};
        for (const k of Object.keys(initial)) payload[k] = s[k];
        return JSON.stringify({ app: 'infralearn', version: 1, data: payload }, null, 2);
      },
      importData: (json, mode = 'replace') => {
        try {
          const parsed = JSON.parse(json);
          const raw = parsed?.data || parsed;
          if (typeof raw !== 'object' || raw === null) return { ok: false, error: 'Invalid backup format' };

          // Strictly scrub every accepted field against the static allow-lists.
          // Anything unrecognized is silently dropped — even if the JSON included
          // it. This is the real anti-tamper barrier; the type check alone is not
          // enough (e.g. wouldn't catch companion: "ghost").
          const clean = {
            displayName: scrubString(raw.displayName, 'Learner'),
            activePath:  scrubEnum(raw.activePath, PATH_KEYS, 'devops'),
            companion:   scrubEnum(raw.companion, SPECIES_KEYS, 'dragon'),
            beastTier:   scrubInt(raw.beastTier, 1, 4, 1),
            beastTiers:  scrubBeastTiers(raw.beastTiers),
            beastBackground: scrubEnum(raw.beastBackground, [...VALID_BACKGROUND_IDS], 'meadow'),
            completed:   scrubBoolMap(raw.completed, VALID_LESSON_IDS),
            labMilestones: scrubLabMilestones(raw.labMilestones),
            // System-design lab progress. Conservative scrub — keep any
            // string-keyed entry whose inner shape parses. Boolean array is
            // clamped at 32 phases (matches markPhaseComplete bound).
            labProgress: (() => {
              const out = {};
              const m = raw.labProgress;
              if (!m || typeof m !== 'object') return out;
              for (const id of Object.keys(m)) {
                if (typeof id !== 'string' || id.length === 0 || id.length > 80) continue;
                const e = m[id];
                if (!e || typeof e !== 'object') continue;
                const arr = Array.isArray(e.phasesCompleted)
                  ? e.phasesCompleted.slice(0, 32).map((v) => v === true)
                  : [];
                const reflection = typeof e.reflection === 'string'
                  ? e.reflection.slice(0, 2000) : '';
                const completedAt = (typeof e.completedAt === 'string'
                  && /^\d{4}-\d{2}-\d{2}T/.test(e.completedAt))
                  ? e.completedAt : null;
                out[id] = { phasesCompleted: arr, reflection, completedAt };
              }
              return out;
            })(),
            quizMisses: scrubQuizMisses(raw.quizMisses),
            reviewQueue: scrubReviewQueue(raw.reviewQueue),
            unlockedBackgrounds: Array.from(new Set(['meadow', ...scrubStringArray(raw.unlockedBackgrounds, VALID_BACKGROUND_IDS)])),
            onboarded:   raw.onboarded === true,
            tourSeen:    raw.tourSeen === true,
            pendingEvolution: scrubEnum(raw.pendingEvolution, SPECIES_KEYS, null),
            // Never import a queued cinematic; do import which ones were seen
            // so a restore can't replay every ascension.
            pendingAscension: null,
            ascensionsSeen: scrubBoolMap(raw.ascensionsSeen, new Set(PATH_KEYS)),
            // Same policy for story cutscenes: never a queued one, keep seen.
            pendingCutscene: null,
            cutscenesSeen: scrubBoolMap(
              raw.cutscenesSeen,
              new Set(PATH_KEYS.flatMap((k) => [`enter:${k}`, `notice:${k}`, `turn:${k}`]))
            ),
            // Ember balance — clamped like xp so a tampered backup can't mint
            // a fortune. The daily review-cap slot only survives with a well-
            // formed date and an in-range count (mirrors dailyPractice).
            embers: scrubInt(raw.embers, 0, 1_000_000, 0),
            emberDaily: (() => {
              const d = raw.emberDaily;
              const empty = { date: null, reviews: 0 };
              if (!d || typeof d !== 'object') return empty;
              const date = (typeof d.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d.date)) ? d.date : null;
              if (!date) return empty;
              return { date, reviews: scrubInt(d.reviews, 0, 10, 0) };
            })(),
            // Journey progress — per-province ints clamped to the chapter
            // count; paid can lead chapter by at most one (the invariant the
            // actions maintain), so a tampered backup can't pre-pay the road.
            journey: (() => {
              const out = {};
              const m = raw.journey;
              if (!m || typeof m !== 'object') return out;
              for (const k of Object.keys(m)) {
                if (!PATH_KEYS.includes(k)) continue;
                const e = m[k];
                if (!e || typeof e !== 'object') continue;
                const chapter = scrubInt(e.chapter, 0, JOURNEY_CHAPTERS.length, 0);
                const paid = Math.min(scrubInt(e.paid, 0, JOURNEY_CHAPTERS.length, 0), chapter + 1);
                out[k] = {
                  chapter,
                  paid: Math.max(paid, chapter),
                  stars: scrubInt(e.stars, 0, 15, 0),
                };
              }
              return out;
            })(),
            // Battle watermarks — same threat model as journey: clamp the
            // minion stage, boss only survives if all five minions did.
            battles: (() => {
              const out = {};
              const m = raw.battles;
              if (!m || typeof m !== 'object') return out;
              for (const k of Object.keys(m)) {
                if (!PATH_KEYS.includes(k)) continue;
                const e = m[k];
                if (!e || typeof e !== 'object') continue;
                const minions = scrubInt(e.minions, 0, 5, 0);
                out[k] = { minions, boss: e.boss === true && minions === 5 };
              }
              return out;
            })(),
            // Codex fragments — only canonical IDs survive, each with a
            // well-formed unlock date (malformed dates fall back to today so
            // a legit fragment isn't dropped over a mangled timestamp).
            loreUnlocked: (() => {
              const out = {};
              const m = raw.loreUnlocked;
              if (!m || typeof m !== 'object') return out;
              for (const id of Object.keys(m)) {
                if (!VALID_LORE_IDS.has(id)) continue;
                const at = (typeof m[id] === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(m[id]))
                  ? m[id] : isoDay();
                out[id] = at;
              }
              return out;
            })(),
            settings: {
              reducedMotion: raw.settings?.reducedMotion === true,
              hideCompanion: raw.settings?.hideCompanion === true,
              accent:     scrubEnum(raw.settings?.accent,     VALID_ACCENTS,   'amber'),
              background: scrubEnum(raw.settings?.background, VALID_BG_THEMES, 'gruvbox'),
              deviceMode: scrubEnum(raw.settings?.deviceMode, ['mobile', 'desktop'], null),
              // DailyPractice's MCQ/recall preference — written at runtime via
              // setSetting. Missing-key → 'mcq' (the default for fresh users).
              practiceMode: scrubEnum(raw.settings?.practiceMode, ['mcq', 'recall'], 'mcq'),
            },
            // avatar is a small fixed-shape object; rebuild it from known fields only.
            avatar: {
              hair: scrubInt(raw.avatar?.hair, 0, 99, 0),
              hairColor: scrubString(raw.avatar?.hairColor, '#6B4226'),
              top: scrubInt(raw.avatar?.top, 0, 99, 0),
              topColor: scrubString(raw.avatar?.topColor, '#7B9FB5'),
              bottom: scrubInt(raw.avatar?.bottom, 0, 99, 0),
              shoes:  scrubInt(raw.avatar?.shoes,  0, 99, 0),
              hat:    scrubInt(raw.avatar?.hat,    0, 99, 0),
              held:   scrubInt(raw.avatar?.held,   0, 99, 0),
              tamer:  (typeof raw.avatar?.tamer === 'string' && VALID_TAMER_IDS.has(raw.avatar.tamer)) ? raw.avatar.tamer : null,
              armor:  (typeof raw.avatar?.armor === 'string' && VALID_ARMOR_IDS.has(raw.avatar.armor)) ? raw.avatar.armor : null,
            },
            // Streak fields — bound to sane ranges so a tampered backup can't
            // hand the user a 10_000-day streak or negative freeze counts.
            streak: scrubInt(raw.streak, 0, 100000, 0),
            lastActivityDate: (typeof raw.lastActivityDate === 'string'
              && /^\d{4}-\d{2}-\d{2}$/.test(raw.lastActivityDate))
              ? raw.lastActivityDate : null,
            activityDays: Array.isArray(raw.activityDays)
              ? raw.activityDays.filter((d) => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)).slice(-400)
              : [],
            streakFreezes:    scrubInt(raw.streakFreezes,    0, 99, 1),
            pendingFreeze:    raw.pendingFreeze === true,
            weekendPasses:    scrubInt(raw.weekendPasses,    0,  2, 2),
            weekendPassMonth: (typeof raw.weekendPassMonth === 'string'
              && /^\d{4}-\d{2}$/.test(raw.weekendPassMonth))
              ? raw.weekendPassMonth : null,
            streakHighWater:  scrubInt(raw.streakHighWater,  0, 100000, 0),
            // XP / badges (Engagement Tier B). xp/level clamped to sane
            // ranges so a tampered backup can't hand the user a level 99
            // novice. xpHistory is dropped on import — it's a transient
            // recent-gains log, not state worth carrying across machines.
            xp:       scrubInt(raw.xp,      0, 10_000_000, 0),
            // Derived from xp, never trusted from the file — a tampered
            // backup can't ship "level 10, 0 xp".
            xpLevel:  levelFromXp(scrubInt(raw.xp, 0, 10_000_000, 0)),
            xpHistory: [],
            badges: (() => {
              const out = {};
              const b = raw.badges;
              if (!b || typeof b !== 'object') return out;
              for (const id of Object.keys(b)) {
                if (typeof id !== 'string' || id.length === 0 || id.length > 80) continue;
                const e = b[id];
                if (!e || typeof e !== 'object') continue;
                const at = (typeof e.unlockedAt === 'string'
                  && /^\d{4}-\d{2}-\d{2}$/.test(e.unlockedAt)) ? e.unlockedAt : null;
                out[id] = { unlockedAt: at };
              }
              return out;
            })(),
            // Daily challenge slot — only accept a known conceptId, and only
            // when the ISO date string is well-formed. A tampered backup
            // can't pre-fill a `correct=true` for an unknown lesson.
            dailyChallenge: (() => {
              const d = raw.dailyChallenge;
              if (!d || typeof d !== 'object') {
                return { date: null, conceptId: null, answered: false, correct: false };
              }
              const date = (typeof d.date === 'string'
                && /^\d{4}-\d{2}-\d{2}$/.test(d.date)) ? d.date : null;
              const conceptId = (typeof d.conceptId === 'string' && VALID_LESSON_IDS.has(d.conceptId))
                ? d.conceptId
                : null;
              return {
                date,
                conceptId,
                answered: d.answered === true,
                correct: d.correct === true,
              };
            })(),
            dailyChallengeStreak: scrubInt(raw.dailyChallengeStreak, 0, 100000, 0),
            calibration: (() => {
              const c0 = raw.calibration;
              const lvl = (o) => {
                if (!o || typeof o !== 'object') return { right: 0, total: 0 };
                const total = scrubInt(o.total, 0, 10000000, 0);
                return { right: Math.min(scrubInt(o.right, 0, 10000000, 0), total), total };
              };
              return (c0 && typeof c0 === 'object')
                ? { guess: lvl(c0.guess), likely: lvl(c0.likely), certain: lvl(c0.certain) }
                : { guess: { right: 0, total: 0 }, likely: { right: 0, total: 0 }, certain: { right: 0, total: 0 } };
            })(),
            // Combo counter — clamped 0..5 so a tampered backup can't seed a
            // perpetually-maxed multiplier.
            practiceCombo: scrubInt(raw.practiceCombo, 0, 5, 0),
            // Daily-practice slot — only a well-formed date is accepted; the
            // answered map is rebuilt from integer keys 0..9 with known verdicts.
            dailyPractice: (() => {
              const d = raw.dailyPractice;
              const empty = { date: null, answered: {}, done: false };
              if (!d || typeof d !== 'object') return empty;
              const date = (typeof d.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d.date)) ? d.date : null;
              if (!date) return empty;
              const answered = {};
              if (d.answered && typeof d.answered === 'object') {
                for (const k of Object.keys(d.answered)) {
                  const i = Number(k);
                  if (Number.isInteger(i) && i >= 0 && i <= 9
                    && (d.answered[k] === 'right' || d.answered[k] === 'wrong')) {
                    answered[i] = d.answered[k];
                  }
                }
              }
              return { date, answered, done: d.done === true };
            })(),
            // dailyStats is a transient rolling log (like xpHistory) — not
            // worth carrying across machines; it rebuilds from activity.
            dailyStats: {},
            // Cliffhanger slot — only accept a known lessonId and a sane
            // question string. A tampered backup can't pre-fill a cliffhanger
            // for an unknown lesson or inject HTML through the question text.
            pendingCliffhanger: (() => {
              const c = raw.pendingCliffhanger;
              const empty = { lessonId: null, question: null, savedAt: null };
              if (!c || typeof c !== 'object') return empty;
              const lessonId = (typeof c.lessonId === 'string' && VALID_LESSON_IDS.has(c.lessonId))
                ? c.lessonId : null;
              const question = (typeof c.question === 'string'
                && c.question.length > 0 && c.question.length <= 500)
                ? c.question : null;
              const savedAt = (typeof c.savedAt === 'string'
                && /^\d{4}-\d{2}-\d{2}$/.test(c.savedAt))
                ? c.savedAt : null;
              if (!lessonId || !question) return empty;
              return { lessonId, question, savedAt };
            })(),
          };

          if (mode === 'merge') {
            // MERGE = "fold the backup's progress into mine". The old code
            // spread `...clean` and unioned only 7 keys, so badges, XP,
            // streak, beast tiers, settings, name and avatar were silently
            // REPLACED by the backup — importing a week-old file destroyed
            // everything earned since. Now: local identity/preferences stay
            // untouched; progress fields take the better of the two.
            set((s) => {
              // Per-lab milestone merge: union the milestone flags per lab id.
              const mergedMilestones = { ...(s.labMilestones || {}) };
              for (const labId of Object.keys(clean.labMilestones)) {
                mergedMilestones[labId] = { ...(mergedMilestones[labId] || {}), ...clean.labMilestones[labId] };
              }
              // Quiz-miss merge: union by lesson + prompt. Imported entries
              // override existing ones (newer wrong pick is what mattered).
              const mergedMisses = { ...(s.quizMisses || {}) };
              for (const lessonId of Object.keys(clean.quizMisses || {})) {
                mergedMisses[lessonId] = { ...(mergedMisses[lessonId] || {}), ...clean.quizMisses[lessonId] };
              }
              // Review-queue / lab-progress: imported entries override per
              // key; existing entries not in the import are kept.
              const mergedReviews = { ...(s.reviewQueue || {}), ...(clean.reviewQueue || {}) };
              const mergedLabProgress = { ...(s.labProgress || {}), ...(clean.labProgress || {}) };
              // Badges union — earliest unlock date wins, so a re-import
              // can't rewrite history.
              const mergedBadges = { ...(clean.badges || {}) };
              for (const id of Object.keys(s.badges || {})) {
                const a = s.badges[id];
                const b = mergedBadges[id];
                mergedBadges[id] = !b
                  ? a
                  : { unlockedAt: [a?.unlockedAt, b?.unlockedAt].filter(Boolean).sort()[0] || null };
              }
              // Beast tiers — cell-wise max (evolution never regresses).
              const mergedTiers = {};
              for (const src of [s.beastTiers || {}, clean.beastTiers || {}]) {
                for (const sp of Object.keys(src)) {
                  mergedTiers[sp] = mergedTiers[sp] || {};
                  for (const pk of Object.keys(src[sp])) {
                    mergedTiers[sp][pk] = Math.max(mergedTiers[sp][pk] || 1, src[sp][pk]);
                  }
                }
              }
              // Calibration — keep whichever side has seen more answers per
              // confidence level (idempotent under re-import, unlike summing).
              const mergedCal = {};
              for (const lvl of ['guess', 'likely', 'certain']) {
                const a = s.calibration?.[lvl] || { right: 0, total: 0 };
                const b = clean.calibration?.[lvl] || { right: 0, total: 0 };
                mergedCal[lvl] = (b.total > a.total) ? b : a;
              }
              const mergedXp = Math.max(s.xp || 0, clean.xp);
              const mergedStreak = Math.max(s.streak || 0, clean.streak);
              const laterDate = (x, y) => (!x ? y : (!y ? x : (x > y ? x : y)));
              const today = isoDay();
              return {
                completed: { ...s.completed, ...clean.completed },
                labMilestones: mergedMilestones,
                labProgress: mergedLabProgress,
                quizMisses: mergedMisses,
                reviewQueue: mergedReviews,
                unlockedBackgrounds: Array.from(new Set([...(s.unlockedBackgrounds || []), ...clean.unlockedBackgrounds])),
                activityDays: Array.from(new Set([...(s.activityDays || []), ...clean.activityDays])).sort().slice(-400),
                badges: mergedBadges,
                beastTiers: mergedTiers,
                beastTier: Math.max(s.beastTier || 1, mergedTiers?.[s.companion]?.[s.activePath] || 1),
                calibration: mergedCal,
                xp: mergedXp,
                xpLevel: levelFromXp(mergedXp),
                streak: mergedStreak,
                streakHighWater: Math.max(s.streakHighWater || 0, clean.streakHighWater, mergedStreak),
                lastActivityDate: laterDate(s.lastActivityDate, clean.lastActivityDate),
                streakFreezes: Math.max(s.streakFreezes || 0, clean.streakFreezes),
                weekendPasses: Math.max(s.weekendPasses || 0, clean.weekendPasses),
                dailyChallengeStreak: Math.max(s.dailyChallengeStreak || 0, clean.dailyChallengeStreak),
                dailyChallenge: (s.dailyChallenge?.date === today)
                  ? s.dailyChallenge
                  : (clean.dailyChallenge?.date === today ? clean.dailyChallenge : s.dailyChallenge),
                dailyPractice: (s.dailyPractice?.date === today)
                  ? s.dailyPractice
                  : (clean.dailyPractice?.date === today ? clean.dailyPractice : s.dailyPractice),
                onboarded: s.onboarded || clean.onboarded,
                tourSeen: s.tourSeen || clean.tourSeen,
                ascensionsSeen: { ...(s.ascensionsSeen || {}), ...clean.ascensionsSeen },
                // Embers: max of both (same stance as xp/streak — merging two
                // devices must never halve a balance). The daily cap slot only
                // takes the import's counter when it's TODAY's and local isn't,
                // so a stale backup can't reopen an already-spent daily cap.
                embers: Math.max(s.embers || 0, clean.embers),
                emberDaily: (s.emberDaily?.date === today)
                  ? s.emberDaily
                  : (clean.emberDaily?.date === today ? clean.emberDaily : (s.emberDaily || { date: null, reviews: 0 })),
                // Journey — per-province field-wise max (story progress
                // never regresses; mirrors the beastTiers stance).
                journey: (() => {
                  const merged = { ...(s.journey || {}) };
                  for (const k of Object.keys(clean.journey || {})) {
                    const a = merged[k] || { chapter: 0, paid: 0, stars: 0 };
                    const b = clean.journey[k];
                    merged[k] = {
                      chapter: Math.max(a.chapter || 0, b.chapter),
                      paid: Math.max(a.paid || 0, b.paid),
                      stars: Math.max(a.stars || 0, b.stars),
                    };
                  }
                  return merged;
                })(),
                // Battle union — watermark max, boss survives from either side.
                battles: (() => {
                  const merged = { ...(s.battles || {}) };
                  for (const k of Object.keys(clean.battles || {})) {
                    const a = merged[k] || { minions: 0, boss: false };
                    const b = clean.battles[k];
                    merged[k] = {
                      minions: Math.max(a.minions || 0, b.minions),
                      boss: a.boss === true || b.boss === true,
                    };
                  }
                  return merged;
                })(),
                // Codex union — earliest unlock date wins, like badges.
                loreUnlocked: (() => {
                  const merged = { ...(clean.loreUnlocked || {}) };
                  for (const id of Object.keys(s.loreUnlocked || {})) {
                    const a = s.loreUnlocked[id];
                    const b = merged[id];
                    merged[id] = !b ? a : ([a, b].filter(Boolean).sort()[0] || a);
                  }
                  return merged;
                })(),
                pendingCliffhanger: s.pendingCliffhanger?.lessonId ? s.pendingCliffhanger : clean.pendingCliffhanger,
                // NOT merged on purpose (local wins): displayName, avatar,
                // settings, activePath, companion, pendingEvolution,
                // practiceCombo, pendingFreeze, xpHistory, dailyStats.
              };
            });
          } else {
            set({ ...initial, ...clean });
          }
          get().recomputeEvolution();
          // A merged `completed` union can newly satisfy section/path badges
          // and background reqs — grant them now, not on the next organic
          // completion (which might never come for review-only users).
          get().computeNewBadges();
          get().recomputeBackgrounds();
          // Merged progress can newly satisfy codex fragments too.
          get().recomputeLore();
          return { ok: true };
        } catch (e) {
          return { ok: false, error: String(e) };
        }
      },

      resetAll: () => set({ ...initial }),
    }),
    {
      name: 'infralearn-store',
      // Migrate persisted state when invariants change.
      //  v2: remap removed background-theme IDs so stale localStorage doesn't
      //      crash the CSS-var loader.
      //  v3: per-pet per-path beast tiers. Old shape stored a single
      //      `beastTier`; new shape adds `beastTiers[species][pathKey]`. We
      //      seed the matrix from the user's current (companion, activePath)
      //      cell so they don't visually de-evolve on first load.
      //  v4: math-quiz misses (Review Weak Spots). Initialize empty.
      //  v5: streak system + forgiveness mechanic (Duolingo-style). Seed
      //      fields to neutral defaults so existing users don't get a
      //      surprise broken streak or pre-spent freezes.
      //  v6: spaced-repetition review queue (FSRS-flavored). Initialize
      //      empty for existing users — completed lessons don't retroactively
      //      get scheduled; the queue fills on the next completion or
      //      self-grade. Avoids overwhelming a returning user with a wall
      //      of "due" reviews on first load.
      //  v7: XP / level / badge collection (Engagement Tier B). Seed xp=0,
      //      xpLevel=1, empty xpHistory + badges. We do NOT retroactively
      //      grant XP for previously-completed lessons — XP starts now so the
      //      level ladder is forward-looking.
      //  v8: daily challenge slot + dailyChallengeStreak counter. Empty
      //      defaults so pickDailyChallenge gets a clean repick on first mount.
      //  v9: combo multiplier (Engagement Layer). Initialize practiceCombo=0
      //      for existing users — the combo starts fresh on first tested
      //      answer after the upgrade. Capped at 5 to match the 2.0x ceiling.
      // v11: system-design lab progress map. Initialize labProgress: {} for
      //      existing users — no retroactive credit for past lab work; the
      //      map fills the first time a learner marks a phase complete.
      // v10: cliffhanger open-loop slot. Initialize pendingCliffhanger to the
      //      neutral null tuple so existing users get a clean slate — we do
      //      NOT retroactively synthesize cliffhangers for previously-
      //      completed lessons (the open-loop value comes from the question
      //      being unresolved at the moment of completion).
      // v12: daily-practice persistence + per-day stats counters. Empty
      //      defaults; both fill from ongoing activity (no backfill).
      // v13: journey layer — pendingAscension cinematic slot + ascensionsSeen.
      //      Existing gold-seal holders do NOT retroactively get the cinematic
      //      queued (we mark their golds as seen so the new system starts
      //      forward-looking, mirroring the v7 no-backfill stance).
      // v14: ember economy (journey forcing loop). Forward-looking like v7's
      //      XP stance — no backfill from past lessons; the balance starts at
      //      0 and accrues from the next learning action. emberDaily is the
      //      per-day review-earn cap counter (10/day).
      // v15: codex fragments (loreUnlocked). BACKFILLED from current progress
      //      — unlike XP, the codex is a record, not a reward stream: a
      //      Keeper with three provinces walked should open the reader to
      //      their real history. Seeding in migrate keeps the backfill
      //      silent (no celebration spam), mirroring the v13 stance.
      // v16: journey chapter progress. Empty default — chapters are new
      //      CONTENT to play, not a record: existing users keep their met
      //      gates (instant access) but still walk the road and pay the
      //      ember pacing like everyone else.
      version: 18,
      // Drop the transient celebrate signal from the persisted payload —
      // it's a one-shot UI flag (migrate also clears it defensively for
      // blobs written before this existed).
      partialize: (s) => {
        const out = { ...s };
        delete out.celebrate;
        delete out.persistFailed;   // transient — a persisted "not saving" flag would lie on reload
        return out;
      },
      // Custom PersistStorage (NOT createJSONStorage) for two reasons:
      // 1. Write coalescing ABOVE the stringify: one user action
      //    (completeLesson) fires ~8-10 set() calls, each of which used to
      //    JSON.stringify the FULL store and write localStorage
      //    synchronously. setItem now just stashes the latest snapshot and
      //    flushes once per task via queueMicrotask — microtasks run before
      //    the browser can navigate or unload, so nothing is lost.
      // 2. localStorage can throw (quota full — shared with the practice-*
      //    editor buckets — or privacy modes); a failed persist degrades to
      //    an in-memory session plus a console warning instead of a crash
      //    in whatever event handler triggered the set().
      storage: (() => {
        let pending = null;   // { name, value } — latest snapshot only
        let scheduled = false;
        const flush = () => {
          scheduled = false;
          if (!pending) return;
          const { name, value } = pending;
          pending = null;
          try {
            // Rotate the last known-good blob to a .bak sibling BEFORE the
            // primary write. A truncated/corrupt primary (browser killed
            // mid-write, quota race) then recovers from .bak on next load
            // instead of resetting the account to defaults. Best-effort: a
            // .bak quota failure must never block the primary save.
            const prev = localStorage.getItem(name);
            if (prev) { try { localStorage.setItem(`${name}.bak`, prev); } catch { /* best-effort */ } }
            localStorage.setItem(name, JSON.stringify(value));
            // Recovered? Clear the banner (guarded — no set() churn on the hot path).
            if (useStore.getState().persistFailed) useStore.setState({ persistFailed: false });
          } catch (e) {
            console.warn('[InfraLearn] saving progress failed (storage full?):', e);
            // Surface it — the in-memory session keeps earning XP that will
            // evaporate on reload; the user must be told, not the console.
            try { useStore.setState({ persistFailed: true }); } catch { /* store mid-init */ }
          }
        };
        return {
          getItem: (name) => {
            try {
              const str = localStorage.getItem(name);
              if (str) {
                try { return JSON.parse(str); }
                catch { /* corrupt primary — fall through to the backup */ }
              }
              // Primary missing or unparseable: try the .bak rotation before
              // surrendering to a fresh-account reset.
              const bak = localStorage.getItem(`${name}.bak`);
              if (bak) {
                const parsed = JSON.parse(bak); // throws → outer catch → null
                console.warn('[InfraLearn] primary save unreadable — recovered from backup copy.');
                return parsed;
              }
              return null;
            } catch { return null; }
          },
          setItem: (name, value) => {
            pending = { name, value };
            if (!scheduled) {
              scheduled = true;
              // Promise microtask == queueMicrotask semantics; flushes at the
              // end of the current task, before any navigation/unload.
              Promise.resolve().then(flush);
            }
          },
          removeItem: (name) => {
            pending = null;
            // A persist-level remove is a full-wipe intent — the backup goes
            // too, or a deliberate reset would silently resurrect on reload.
            try { localStorage.removeItem(name); } catch { /* ignore */ }
            try { localStorage.removeItem(`${name}.bak`); } catch { /* ignore */ }
          },
        };
      })(),
      migrate: (persisted, prevVersion) => {
        if (!persisted) return persisted;
        // v2 — background-theme rescue
        const s = persisted.settings || {};
        const bg = s.background;
        if (bg && !VALID_BG_THEMES.includes(bg)) {
          persisted.settings = { ...s, background: 'gruvbox' };
        }
        // v3 — per-pet per-path beastTiers
        if (prevVersion < 3 || !persisted.beastTiers) {
          const species = persisted.companion || 'dragon';
          const pathKey = persisted.activePath || 'devops';
          const t = Number.isInteger(persisted.beastTier) ? persisted.beastTier : 1;
          persisted.beastTiers = { [species]: { [pathKey]: t } };
        }
        // v4 — quizMisses default
        if (prevVersion < 4 || !persisted.quizMisses) {
          persisted.quizMisses = {};
        }
        // v5 — streak system. Initialize each field independently so a
        // partial upgrade from a hand-edited localStorage still ends up
        // consistent. Existing users start with streak=0 (no fake streak
        // gifted), but DO get the one-freeze + two-pass starter inventory
        // so the forgiveness UI has something to show day one.
        if (prevVersion < 5) {
          if (typeof persisted.streak !== 'number')           persisted.streak = 0;
          if (typeof persisted.lastActivityDate !== 'string') persisted.lastActivityDate = null;
          if (typeof persisted.streakFreezes !== 'number')    persisted.streakFreezes = 1;
          if (typeof persisted.pendingFreeze !== 'boolean')   persisted.pendingFreeze = false;
          if (typeof persisted.weekendPasses !== 'number')    persisted.weekendPasses = 2;
          if (typeof persisted.weekendPassMonth !== 'string') persisted.weekendPassMonth = null;
          if (typeof persisted.streakHighWater !== 'number')  persisted.streakHighWater = 0;
        }
        // v6 — empty reviewQueue default. Same defensive shape-check as v4's
        // quizMisses so a hand-edited localStorage with reviewQueue: null
        // still ends up with a usable object.
        if (prevVersion < 6 || !persisted.reviewQueue || typeof persisted.reviewQueue !== 'object') {
          persisted.reviewQueue = {};
        }
        // v7 — XP / level / badges defaults. Forward-looking: we don't
        // backfill XP from previously completed lessons (that would shower
        // returning users with a level-up cascade they didn't earn through
        // the new tested-items rules). Each defensive shape-check stands
        // alone so a hand-edited localStorage still ends up consistent.
        if (prevVersion < 7) {
          if (typeof persisted.xp !== 'number')      persisted.xp = 0;
          if (typeof persisted.xpLevel !== 'number') persisted.xpLevel = 1;
          if (!Array.isArray(persisted.xpHistory))   persisted.xpHistory = [];
          if (!persisted.badges || typeof persisted.badges !== 'object') {
            persisted.badges = {};
          }
        }
        // v8 — daily challenge slot + streak counter. Empty defaults so
        // pickDailyChallenge gets a clean repick on first mount after the
        // upgrade. Existing users start at dailyChallengeStreak=0 (no
        // backfill — the streak begins now).
        if (prevVersion < 8) {
          if (!persisted.dailyChallenge || typeof persisted.dailyChallenge !== 'object') {
            persisted.dailyChallenge = { date: null, conceptId: null, answered: false, correct: false };
          }
          if (typeof persisted.dailyChallengeStreak !== 'number') {
            persisted.dailyChallengeStreak = 0;
          }
        }
        // v9 — combo multiplier counter. Existing users start at 0 (no
        // backfill — combo begins on the next tested-item correct answer).
        // Clamp on rehydrate in case a hand-edited localStorage holds an
        // out-of-range value; persist's own scrub doesn't reach into here.
        if (prevVersion < 9) {
          if (
            typeof persisted.practiceCombo !== 'number'
            || !Number.isInteger(persisted.practiceCombo)
            || persisted.practiceCombo < 0
            || persisted.practiceCombo > 5
          ) {
            persisted.practiceCombo = 0;
          }
        }
        // v10 — cliffhanger open-loop slot. Initialize the neutral null tuple
        // for existing users so the Home selector finds a usable shape on the
        // very first render after upgrade. Defensive shape-check so a hand-
        // edited localStorage with pendingCliffhanger: null still ends up
        // consistent.
        if (
          prevVersion < 10
          || !persisted.pendingCliffhanger
          || typeof persisted.pendingCliffhanger !== 'object'
        ) {
          persisted.pendingCliffhanger = {
            lessonId: null,
            question: null,
            savedAt: null,
          };
        }
        // v11 — system-design lab progress map. Empty default so the first
        // markPhaseComplete after upgrade lands on a usable object. Defensive
        // shape-check so a hand-edited localStorage with labProgress: null
        // still ends up consistent.
        if (
          prevVersion < 11
          || !persisted.labProgress
          || typeof persisted.labProgress !== 'object'
        ) {
          persisted.labProgress = {};
        }
        // v12 — daily-practice slot + per-day stats counters. Empty defaults
        // so the first recordDailyAnswer / bumpStat lands on usable shapes.
        if (
          prevVersion < 12
          || !persisted.dailyPractice
          || typeof persisted.dailyPractice !== 'object'
        ) {
          persisted.dailyPractice = { date: null, answered: {}, done: false };
        }
        if (
          prevVersion < 12
          || !persisted.dailyStats
          || typeof persisted.dailyStats !== 'object'
        ) {
          persisted.dailyStats = {};
        }
        // v13 — journey layer. Seed ascensionsSeen from already-earned gold
        // badges so long-time users don't get a backlog of cinematics for
        // paths they finished before the feature existed.
        if (prevVersion < 13 || !persisted.ascensionsSeen || typeof persisted.ascensionsSeen !== 'object') {
          const seen = {};
          const badges = persisted.badges && typeof persisted.badges === 'object' ? persisted.badges : {};
          for (const k of PATH_KEYS) {
            if (badges[`path:${k}:gold`]) seen[k] = true;
          }
          persisted.ascensionsSeen = seen;
        }
        if (prevVersion < 13 || persisted.pendingAscension === undefined) {
          persisted.pendingAscension = null;
        }
        // v14 — ember economy. Defensive shape-checks stand alone (same as
        // every block above) so a hand-edited localStorage still heals.
        if (
          prevVersion < 14
          || !Number.isInteger(persisted.embers)
          || persisted.embers < 0
        ) {
          persisted.embers = 0;
        }
        if (
          prevVersion < 14
          || !persisted.emberDaily
          || typeof persisted.emberDaily !== 'object'
        ) {
          persisted.emberDaily = { date: null, reviews: 0 };
        }
        // v15 — codex fragments, backfilled silently from real progress so
        // the reader opens to the user's actual history (no celebrations
        // fire from migrate; recomputeLore only celebrates future diffs).
        if (
          prevVersion < 15
          || !persisted.loreUnlocked
          || typeof persisted.loreUnlocked !== 'object'
        ) {
          const seeded = {};
          const today = isoDay();
          for (const id of deriveLoreUnlocks(persisted)) seeded[id] = today;
          persisted.loreUnlocked = seeded;
        }
        // v16 — journey chapters. Empty default; the road is walked, not
        // backfilled (gates already met simply open immediately).
        if (
          prevVersion < 16
          || !persisted.journey
          || typeof persisted.journey !== 'object'
        ) {
          persisted.journey = {};
        }
        // v17 — story cutscenes. Backfill cutscenesSeen from existing badges
        // and progress so long-time users don't get a backlog of story beats
        // for provinces they've already pushed through (same policy as the
        // v13 ascension backfill).
        if (prevVersion < 17 || !persisted.cutscenesSeen || typeof persisted.cutscenesSeen !== 'object') {
          const seen = {};
          const badges = persisted.badges && typeof persisted.badges === 'object' ? persisted.badges : {};
          const completed = persisted.completed && typeof persisted.completed === 'object' ? persisted.completed : {};
          for (const k of PATH_KEYS) {
            if (badges[`path:${k}:bronze`]) seen[`notice:${k}`] = true;
            if (badges[`path:${k}:silver`]) seen[`turn:${k}`] = true;
            const { done } = pathProgress(k, completed);
            if (done > 0 || persisted.activePath === k) seen[`enter:${k}`] = true;
          }
          persisted.cutscenesSeen = seen;
        }
        if (prevVersion < 17 || persisted.pendingCutscene === undefined) {
          persisted.pendingCutscene = null;
        }
        // v18 — minion/boss quiz battles. Empty default; encounters are
        // fought, not backfilled (a 100% path still has to beat its Lapse).
        if (prevVersion < 18 || !persisted.battles || typeof persisted.battles !== 'object') {
          persisted.battles = {};
        }
        // Always clear the ephemeral celebrate flag on rehydrate — it's a
        // transient UI signal, persisting it would replay celebrations on
        // every reload.
        persisted.celebrate = null;
        return persisted;
      },
    },
  )
);

// Cross-tab sync. persist is write-only — without this, two open contexts
// (an installed PWA window plus a browser tab is the common case) clobber
// each other wholesale: each holds its own full-state snapshot and the last
// writer wins. The storage event fires only in the OTHER tabs, so each tab
// folds in foreign writes before its own next write.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === 'infralearn-store' && e.newValue && e.newValue !== e.oldValue) {
      useStore.persist.rehydrate();
    }
  });
}

// Helper selectors (pure)
export function activePathProgress(state) {
  return pathProgress(state.activePath, state.completed);
}
// Compute milestone progress for a lab. Thin wrapper over content.labProgress
// that pulls the per-lab map straight off store state for convenience.
export function labProgress(state, labId) {
  return labProgressFromContent(labId, state.labMilestones || {});
}
export function beastForm(state) {
  const b = BEASTS[state.companion];
  return b ? b.forms[state.beastTier - 1] : '';
}

// Return the concept IDs whose review is due today or earlier, sorted by
// dueAt ascending (oldest-due first — Cepeda's "near the forgetting curve"
// items have the highest marginal benefit per review). Pure selector so
// it can be memoized in components.
export function getReviewsDue(state) {
  const q = state.reviewQueue || {};
  const today = isoDay();
  const due = [];
  for (const conceptId of Object.keys(q)) {
    const entry = q[conceptId];
    if (entry && entry.dueAt && entry.dueAt <= today) {
      due.push({ conceptId, dueAt: entry.dueAt });
    }
  }
  due.sort((a, b) => (a.dueAt < b.dueAt ? -1 : a.dueAt > b.dueAt ? 1 : 0));
  return due.map((d) => d.conceptId);
}
