// Unit tests for the retention engine (streak / weekend pass / FSRS spaced
// repetition / reviews-due selector) inside src/store/useStore.js.
//
// Strategy: useStore is a Zustand `create(persist(...))` store. Its internal
// pure helpers (isoDay, daysBetween, addDays, missedDayWasWeekend, levelFromXp)
// are NOT exported — extracting them would require editing useStore.js which is
// off-limits per the hard constraints. Instead, we:
//   1. Re-implement the same pure helpers here (kept identical to the source
//      so any drift would itself be a test failure, see TODO note below).
//   2. Drive the store via its public actions (recordActivity, scheduleReview,
//      refillWeekendPassesIfNewMonth) and seed pre-conditions via setState.
//   3. For determinism around "today", we monkey-patch Date so isoDay()
//      resolves to a fixed value inside each test.
//
// Reset strategy: between tests we call resetAll() and clear localStorage so
// persist doesn't bleed state across cases (jsdom provides a real localStorage).

import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { useStore, getReviewsDue } from '../src/store/useStore.js';
import { PATHS } from '../src/data/content.js';

// Pick a known-valid lesson ID + a couple more for multi-concept tests. These
// must exist in PATHS or scheduleReview silently no-ops.
const VALID_IDS = (() => {
  const out = [];
  for (const p of Object.values(PATHS)) {
    for (const l of p.lessons) {
      if (l.kind !== 'lab' && l.kind !== 'sd') out.push(l.id);
      if (out.length >= 5) break;
    }
    if (out.length >= 5) break;
  }
  return out;
})();
const LESSON_A = VALID_IDS[0];
const LESSON_B = VALID_IDS[1];
const LESSON_C = VALID_IDS[2];

// ── Mirror of the in-store pure helpers ─────────────────────────────────────
// These MUST stay in sync with src/store/useStore.js. If the store changes its
// date math the integration tests below will catch the drift (the mirrors are
// only used to BUILD expected fixtures; the assertions are against the store).
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
function addDays(day, n) {
  const p = day.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const ms = Date.UTC(+p[1], +p[2] - 1, +p[3], 12) + Math.floor(n) * 86400000;
  const d = new Date(ms);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

// Pin "today" to a non-weekend (Wednesday 2026-06-03) so weekend-pass logic
// behaves predictably. Each test can override via setSystemTime if needed.
const FIXED_TODAY = new Date(2026, 5, 3, 12, 0, 0); // Wed 2026-06-03 local
const TODAY = isoDay(FIXED_TODAY);

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(FIXED_TODAY);
  // Clear persisted state so each test starts pristine.
  try { localStorage.clear(); } catch {}
  useStore.getState().resetAll();
});

afterEach(() => {
  vi.useRealTimers();
});

// ─────────────────────────────────────────────────────────────────────────────
// recordActivity — streak progression + forgiveness
// ─────────────────────────────────────────────────────────────────────────────
describe('recordActivity', () => {
  it('opens the streak at 1 on first-ever activity', () => {
    useStore.getState().recordActivity();
    const s = useStore.getState();
    expect(s.streak).toBe(1);
    expect(s.lastActivityDate).toBe(TODAY);
    expect(s.streakHighWater).toBeGreaterThanOrEqual(1);
  });

  it('is a no-op when called twice on the same day', () => {
    useStore.getState().recordActivity();
    const before = useStore.getState().streak;
    useStore.getState().recordActivity();
    const after = useStore.getState().streak;
    expect(after).toBe(before);
  });

  it('increments the streak by 1 on a consecutive day (gap = 1)', () => {
    // Seed: last activity was yesterday.
    useStore.setState({ streak: 3, lastActivityDate: addDays(TODAY, -1), streakHighWater: 3 });
    useStore.getState().recordActivity();
    const s = useStore.getState();
    expect(s.streak).toBe(4);
    expect(s.lastActivityDate).toBe(TODAY);
    expect(s.streakHighWater).toBe(4);
  });

  it('resets the streak to 1 on a 2-day weekday gap with no forgiveness', () => {
    // Seed: last activity was 2 days ago, and the missed day is a WEEKDAY
    // (so weekend-pass auto-consume doesn't trigger). TODAY = Wed, gap = 2,
    // missed day = Tuesday, dow = 2 → not weekend.
    useStore.setState({
      streak: 10,
      lastActivityDate: addDays(TODAY, -2),
      streakHighWater: 10,
      weekendPasses: 0,
      pendingFreeze: false,
    });
    useStore.getState().recordActivity();
    const s = useStore.getState();
    expect(s.streak).toBe(1);
    expect(s.lastActivityDate).toBe(TODAY);
    // High-water preserved at 10 (best streak ever still stands).
    expect(s.streakHighWater).toBe(10);
  });

  it('auto-consumes a weekend pass to preserve streak after a Sat/Sun miss', () => {
    // Set "today" to a Monday so the missed day was Sunday.
    const MON = new Date(2026, 5, 1, 12, 0, 0); // Mon 2026-06-01
    vi.setSystemTime(MON);
    const monIso = isoDay(MON);
    useStore.setState({
      streak: 7,
      lastActivityDate: addDays(monIso, -2), // Saturday
      weekendPasses: 2,
      weekendPassMonth: isoMonth(MON),       // already refilled for the month
      streakHighWater: 7,
    });
    useStore.getState().recordActivity();
    const s = useStore.getState();
    expect(s.streak).toBe(8);
    expect(s.weekendPasses).toBe(1);
    expect(s.lastActivityDate).toBe(monIso);
  });

  it('resets streak when a weekend miss has no passes left', () => {
    const MON = new Date(2026, 5, 1, 12, 0, 0);
    vi.setSystemTime(MON);
    const monIso = isoDay(MON);
    useStore.setState({
      streak: 7,
      lastActivityDate: addDays(monIso, -2), // Saturday
      weekendPasses: 0,
      weekendPassMonth: isoMonth(MON),       // critical — same month so refill no-op
      streakHighWater: 7,
    });
    useStore.getState().recordActivity();
    const s = useStore.getState();
    expect(s.streak).toBe(1);
    expect(s.weekendPasses).toBe(0);
  });

  it('pendingFreeze covers exactly ONE missed weekday', () => {
    // TODAY = Wed; last = Mon → missed Tue (one weekday).
    useStore.setState({
      streak: 5,
      lastActivityDate: addDays(TODAY, -2),
      pendingFreeze: true,
      streakFreezes: 0,
      weekendPasses: 2,
      weekendPassMonth: isoMonth(FIXED_TODAY),
      streakHighWater: 5,
    });
    useStore.getState().recordActivity();
    const s = useStore.getState();
    expect(s.streak).toBe(6);
    expect(s.pendingFreeze).toBe(false);
    expect(s.weekendPasses).toBe(2); // weekday miss — passes untouched
  });

  it('pendingFreeze cannot cover a multi-day weekday gap (no unbounded forgiveness)', () => {
    // TODAY = Wed; last = Sun → missed Mon + Tue (two weekdays). A single
    // freeze covers one day, so the streak resets and the failed freeze
    // is cleared instead of lingering for some future unrelated gap.
    useStore.setState({
      streak: 5,
      lastActivityDate: addDays(TODAY, -3),
      pendingFreeze: true,
      streakFreezes: 0,
      weekendPasses: 0,
      weekendPassMonth: isoMonth(FIXED_TODAY),
      streakHighWater: 5,
    });
    useStore.getState().recordActivity();
    const s = useStore.getState();
    expect(s.streak).toBe(1);
    expect(s.pendingFreeze).toBe(false);
    expect(s.streakHighWater).toBe(5);
  });

  it('Fri→Mon gap consumes two weekend passes and preserves the streak', () => {
    const MON = new Date(2026, 5, 1, 12, 0, 0); // Mon 2026-06-01
    vi.setSystemTime(MON);
    const monIso = isoDay(MON);
    useStore.setState({
      streak: 9,
      lastActivityDate: addDays(monIso, -3), // Friday — missed Sat + Sun
      weekendPasses: 2,
      weekendPassMonth: isoMonth(MON),
      streakHighWater: 9,
    });
    useStore.getState().recordActivity();
    const s = useStore.getState();
    expect(s.streak).toBe(10);
    expect(s.weekendPasses).toBe(0);
    expect(s.lastActivityDate).toBe(monIso);
  });

  it('combines a weekend pass + pendingFreeze across a mixed Thu→Sun gap', () => {
    const SUN = new Date(2026, 5, 7, 12, 0, 0); // Sun 2026-06-07
    vi.setSystemTime(SUN);
    const sunIso = isoDay(SUN);
    useStore.setState({
      streak: 4,
      lastActivityDate: addDays(sunIso, -3), // Thursday — missed Fri (weekday) + Sat (weekend)
      pendingFreeze: true,
      streakFreezes: 0,
      weekendPasses: 1,
      weekendPassMonth: isoMonth(SUN),
      streakHighWater: 4,
    });
    useStore.getState().recordActivity();
    const s = useStore.getState();
    expect(s.streak).toBe(5);
    expect(s.weekendPasses).toBe(0);   // pass covered Saturday
    expect(s.pendingFreeze).toBe(false); // freeze covered Friday
  });

  it('heals a FUTURE lastActivityDate instead of freezing the streak machinery', () => {
    useStore.setState({
      streak: 4,
      lastActivityDate: addDays(TODAY, 5), // skewed clock / tampered import
      streakHighWater: 4,
    });
    useStore.getState().recordActivity();
    const s = useStore.getState();
    expect(s.streak).toBe(4);              // kept, not reset
    expect(s.lastActivityDate).toBe(TODAY); // re-anchored — recording resumes
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// scheduleReview — FSRS-flavored stability / difficulty / interval math
// ─────────────────────────────────────────────────────────────────────────────
describe('scheduleReview', () => {
  it('initial entry on grade=3 starts from stability=1, difficulty=5, then multiplies by 2.5', () => {
    useStore.getState().scheduleReview(LESSON_A, 3);
    const e = useStore.getState().reviewQueue[LESSON_A];
    expect(e).toBeDefined();
    // After first "good": stability = 1 * 2.5 = 2.5, difficulty stays at 5.
    expect(e.stability).toBeCloseTo(2.5, 5);
    expect(e.difficulty).toBeCloseTo(5, 5);
    expect(e.reps).toBe(1);
    expect(e.lapses).toBe(0);
    expect(e.lastSeen).toBe(TODAY);
    // interval = ceil(2.5 * 5^-0.5) = ceil(2.5 / 2.236...) = ceil(1.118) = 2
    expect(e.dueAt).toBe(addDays(TODAY, 2));
  });

  it('grade=4 (easy) multiplies stability by 3.5 and nudges difficulty down', () => {
    useStore.getState().scheduleReview(LESSON_A, 4);
    const e = useStore.getState().reviewQueue[LESSON_A];
    expect(e.stability).toBeCloseTo(3.5, 5);
    expect(e.difficulty).toBeCloseTo(4.85, 5); // 5 - 0.15
    expect(e.reps).toBe(1);
  });

  it('grade=1 (miss) resets stability to 1 and schedules dueAt = today + 1', () => {
    // Seed: an established review with stability=10
    useStore.setState({
      reviewQueue: {
        [LESSON_A]: { lastSeen: addDays(TODAY, -3), dueAt: addDays(TODAY, -1), stability: 10, difficulty: 5, reps: 2, lapses: 0 },
      },
    });
    useStore.getState().scheduleReview(LESSON_A, 1);
    const e = useStore.getState().reviewQueue[LESSON_A];
    expect(e.stability).toBe(1);
    expect(e.difficulty).toBeCloseTo(5.5, 5); // +0.5, capped at 10
    expect(e.lapses).toBe(1);
    expect(e.reps).toBe(3);
    expect(e.dueAt).toBe(addDays(TODAY, 1));
  });

  it('grade=3 on a second review compounds stability multiplicatively', () => {
    // First "good" → stability=2.5
    useStore.getState().scheduleReview(LESSON_A, 3);
    // Second "good" → stability = 2.5 * 2.5 = 6.25
    useStore.getState().scheduleReview(LESSON_A, 3);
    const e = useStore.getState().reviewQueue[LESSON_A];
    expect(e.stability).toBeCloseTo(6.25, 5);
    expect(e.reps).toBe(2);
  });

  it('silently no-ops on unknown concept IDs (allow-list scrub)', () => {
    useStore.getState().scheduleReview('not-a-real-lesson-id', 3);
    expect(useStore.getState().reviewQueue['not-a-real-lesson-id']).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// refillWeekendPassesIfNewMonth — monthly idempotent refill
// ─────────────────────────────────────────────────────────────────────────────
describe('refillWeekendPassesIfNewMonth', () => {
  it('refills passes to 2 when stored month is null', () => {
    useStore.setState({ weekendPasses: 0, weekendPassMonth: null });
    useStore.getState().refillWeekendPassesIfNewMonth();
    const s = useStore.getState();
    expect(s.weekendPasses).toBe(2);
    expect(s.weekendPassMonth).toBe(isoMonth(FIXED_TODAY));
  });

  it('refills passes when crossing into a new month', () => {
    useStore.setState({ weekendPasses: 0, weekendPassMonth: '2026-05' });
    useStore.getState().refillWeekendPassesIfNewMonth();
    const s = useStore.getState();
    expect(s.weekendPasses).toBe(2);
    expect(s.weekendPassMonth).toBe('2026-06');
  });

  it('is a no-op when the stored month matches today', () => {
    useStore.setState({ weekendPasses: 1, weekendPassMonth: '2026-06' });
    useStore.getState().refillWeekendPassesIfNewMonth();
    const s = useStore.getState();
    expect(s.weekendPasses).toBe(1); // unchanged — does NOT clobber mid-month
    expect(s.weekendPassMonth).toBe('2026-06');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getReviewsDue selector — pure, sorts oldest-due first
// ─────────────────────────────────────────────────────────────────────────────
describe('getReviewsDue', () => {
  it('returns only entries with dueAt <= today, sorted oldest-first', () => {
    const state = {
      reviewQueue: {
        [LESSON_A]: { dueAt: addDays(TODAY, -3) }, // overdue 3 days
        [LESSON_B]: { dueAt: TODAY },              // due today
        [LESSON_C]: { dueAt: addDays(TODAY, 5) },  // not yet due
      },
    };
    const due = getReviewsDue(state);
    expect(due).toEqual([LESSON_A, LESSON_B]);
  });

  it('returns an empty array when reviewQueue is empty', () => {
    expect(getReviewsDue({ reviewQueue: {} })).toEqual([]);
  });

  it('gracefully handles missing reviewQueue field', () => {
    expect(getReviewsDue({})).toEqual([]);
  });

  it('skips entries with null/missing dueAt', () => {
    const state = {
      reviewQueue: {
        [LESSON_A]: { dueAt: null },
        [LESSON_B]: { dueAt: addDays(TODAY, -1) },
        [LESSON_C]: {},
      },
    };
    expect(getReviewsDue(state)).toEqual([LESSON_B]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// XP math — Engagement Tier B has shipped (addXp + XP_LEVEL_THRESHOLDS exist).
// Conservative coverage only — the agent's full surface is still in flux.
// ─────────────────────────────────────────────────────────────────────────────
describe('addXp (Engagement Tier B, present at test-authoring time)', () => {
  it('adds XP and emits a celebration', () => {
    useStore.getState().addXp(10, 'test:reason');
    const s = useStore.getState();
    expect(s.xp).toBe(10);
    expect(s.xpLevel).toBe(1);
    expect(s.xpHistory[0]).toMatchObject({ amount: 10, reason: 'test:reason' });
    expect(s.celebrate?.kind).toBe('xp');
  });

  it('crossing the 100-xp threshold promotes xpLevel to 2 and fires a level celebration', () => {
    useStore.getState().addXp(100, 'test:bump');
    const s = useStore.getState();
    expect(s.xpLevel).toBe(2);
    expect(s.celebrate?.kind).toBe('level');
    expect(s.celebrate?.level).toBe(2);
  });

  it('ignores zero / negative / non-finite amounts', () => {
    useStore.getState().addXp(0, 'noop');
    useStore.getState().addXp(-50, 'noop');
    useStore.getState().addXp(NaN, 'noop');
    expect(useStore.getState().xp).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Celebration priority — level > badge > xp within a synchronous batch
// ─────────────────────────────────────────────────────────────────────────────
describe('celebration priority', () => {
  it('a plain XP toast does not clobber a fresh badge celebration', () => {
    useStore.getState().grantBadge('streak:3');
    useStore.getState().addXp(5, 'lesson:complete');
    expect(useStore.getState().celebrate?.kind).toBe('badge');
  });

  it('a level-up replaces a fresh badge celebration', () => {
    useStore.getState().grantBadge('streak:3');
    useStore.getState().addXp(100, 'test:bump'); // crosses level 2
    expect(useStore.getState().celebrate?.kind).toBe('level');
  });

  it('a badge does not clobber a fresh level-up', () => {
    useStore.getState().addXp(100, 'test:bump');
    useStore.getState().grantBadge('streak:3');
    expect(useStore.getState().celebrate?.kind).toBe('level');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// completeLesson — re-completion must not re-grade the FSRS card or re-award
// ─────────────────────────────────────────────────────────────────────────────
describe('completeLesson idempotency', () => {
  it('first completion schedules a review; re-completion leaves it untouched', () => {
    useStore.getState().completeLesson(LESSON_A);
    const first = useStore.getState().reviewQueue[LESSON_A];
    expect(first.stability).toBeCloseTo(2.5, 5);
    const xpAfterFirst = useStore.getState().xp;

    useStore.getState().completeLesson(LESSON_A);
    const second = useStore.getState().reviewQueue[LESSON_A];
    expect(second.stability).toBeCloseTo(2.5, 5); // NOT 6.25
    expect(second.reps).toBe(1);
    expect(useStore.getState().xp).toBe(xpAfterFirst); // no double award
  });

  it('counts the lesson in dailyStats once', () => {
    useStore.getState().completeLesson(LESSON_A);
    useStore.getState().completeLesson(LESSON_A);
    const stats = useStore.getState().dailyStats[TODAY];
    expect(stats.lessons).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Daily-practice persistence — XP farming closed
// ─────────────────────────────────────────────────────────────────────────────
describe('recordDailyAnswer / markDailyPracticeDone', () => {
  it('returns true only the first time an index is answered today', () => {
    expect(useStore.getState().recordDailyAnswer(0, 'right')).toBe(true);
    expect(useStore.getState().recordDailyAnswer(0, 'right')).toBe(false);
    expect(useStore.getState().recordDailyAnswer(0, 'wrong')).toBe(false);
    expect(useStore.getState().recordDailyAnswer(1, 'wrong')).toBe(true);
    const dp = useStore.getState().dailyPractice;
    expect(dp.date).toBe(TODAY);
    expect(dp.answered).toEqual({ 0: 'right', 1: 'wrong' });
  });

  it('latches done exactly once per day', () => {
    expect(useStore.getState().markDailyPracticeDone()).toBe(true);
    expect(useStore.getState().markDailyPracticeDone()).toBe(false);
    expect(useStore.getState().dailyPractice.done).toBe(true);
  });

  it('rejects out-of-range indices', () => {
    expect(useStore.getState().recordDailyAnswer(-1, 'right')).toBe(false);
    expect(useStore.getState().recordDailyAnswer(10, 'right')).toBe(false);
    expect(useStore.getState().recordDailyAnswer('0', 'right')).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// reviewer:10 badge — counted via dailyStats (misses included)
// ─────────────────────────────────────────────────────────────────────────────
describe('reviewer:10 badge', () => {
  it('unlocks after 10 graded reviews in a day, even all misses', () => {
    for (let i = 0; i < 10; i++) {
      useStore.getState().markReviewed(LESSON_A, 1); // misses award no XP
    }
    expect(useStore.getState().dailyStats[TODAY].reviews).toBe(10);
    expect(useStore.getState().badges['reviewer:10']).toBeDefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Path Ascension — gold seal queues the cinematic exactly once per path
// ─────────────────────────────────────────────────────────────────────────────
describe('path ascension', () => {
  it('queues pendingAscension once when a path first reaches gold', () => {
    const all = {};
    for (const l of PATHS.fundamentals.lessons) all[l.id] = true;
    useStore.setState({ completed: all });
    useStore.getState().computeNewBadges();
    const s1 = useStore.getState();
    expect(s1.badges['path:fundamentals:gold']).toBeDefined();
    expect(s1.pendingAscension).toBe('fundamentals');
    expect(s1.ascensionsSeen.fundamentals).toBe(true);

    useStore.getState().clearPendingAscension();
    useStore.getState().computeNewBadges(); // recompute must not re-queue
    expect(useStore.getState().pendingAscension).toBe(null);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// importData — merge folds progress in; replace derives xpLevel; scrubbers
// ─────────────────────────────────────────────────────────────────────────────
describe('importData', () => {
  it('merge keeps local badges/xp/streak/name and unions completed', () => {
    useStore.setState({
      completed: { [LESSON_A]: true },
      badges: { 'streak:3': { unlockedAt: '2026-05-01' } },
      xp: 500,
      xpLevel: 4,
      streak: 6,
      streakHighWater: 6,
      lastActivityDate: TODAY,
      displayName: 'LocalName',
    });
    const backup = JSON.stringify({
      app: 'infralearn',
      version: 1,
      data: {
        completed: { [LESSON_B]: true },
        badges: { 'recall:first': { unlockedAt: '2026-04-01' } },
        xp: 100,
        xpLevel: 2,
        streak: 2,
        displayName: 'BackupName',
      },
    });
    const res = useStore.getState().importData(backup, 'merge');
    expect(res.ok).toBe(true);
    const s = useStore.getState();
    expect(s.completed[LESSON_A]).toBe(true);
    expect(s.completed[LESSON_B]).toBe(true);
    expect(s.xp).toBe(500);                       // max, not replaced
    expect(s.streak).toBe(6);                     // max, not replaced
    expect(s.badges['streak:3']).toBeDefined();   // local badge survives
    expect(s.badges['recall:first']).toBeDefined(); // imported badge added
    expect(s.displayName).toBe('LocalName');      // identity stays local
  });

  it('replace derives xpLevel from xp instead of trusting the file', () => {
    const backup = JSON.stringify({ data: { xp: 250, xpLevel: 9 } });
    const res = useStore.getState().importData(backup, 'replace');
    expect(res.ok).toBe(true);
    const s = useStore.getState();
    expect(s.xp).toBe(250);
    expect(s.xpLevel).toBe(3); // thresholds: 0,100,250 → level 3
  });

  it('preserves __daily_practice__ quiz misses through an import', () => {
    const backup = JSON.stringify({
      data: {
        quizMisses: {
          '__daily_practice__': { 'What does CIDR notation describe?': { picked: null } },
          'not-a-real-lesson': { 'Bogus?': { picked: 1 } },
        },
      },
    });
    const res = useStore.getState().importData(backup, 'replace');
    expect(res.ok).toBe(true);
    const misses = useStore.getState().quizMisses;
    expect(misses['__daily_practice__']).toBeDefined();
    expect(misses['not-a-real-lesson']).toBeUndefined();
  });

  it('never imports a queued ascension cinematic, but keeps seen-flags', () => {
    const backup = JSON.stringify({
      data: { pendingAscension: 'devops', ascensionsSeen: { devops: true, 'not-a-path': true } },
    });
    const res = useStore.getState().importData(backup, 'replace');
    expect(res.ok).toBe(true);
    expect(useStore.getState().pendingAscension).toBe(null);
    expect(useStore.getState().ascensionsSeen.devops).toBe(true);
    expect(useStore.getState().ascensionsSeen['not-a-path']).toBeUndefined();
  });

  it('merge grants newly-satisfied badges from the unioned completed map', () => {
    // Import a backup whose completed set, unioned with local, finishes a
    // path tier — the badge must appear right after import, not on the next
    // organic completion.
    const fundamentals = PATHS.fundamentals.lessons.map((l) => l.id);
    const third = Math.ceil(fundamentals.length * 0.34);
    const data = { completed: {} };
    for (const id of fundamentals.slice(0, third)) data.completed[id] = true;
    const res = useStore.getState().importData(JSON.stringify({ data }), 'merge');
    expect(res.ok).toBe(true);
    expect(useStore.getState().badges['path:fundamentals:bronze']).toBeDefined();
  });
});
