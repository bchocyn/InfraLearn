// Unit tests for the ember economy (journey layer §10) in useStore.js.
//
// Embers ⟡ are earned ONLY by learning actions — lesson +3 · lab +5 (on top
// of the lesson credit) · review graded +1 capped 10/day · daily practice
// done +2 · streak day +1 — and spent through spendEmbers. Every earn path
// must be farm-proof: re-completion, remount re-grades and spam-grading all
// earn zero. Import must scrub the balance and the merge must take max.
//
// Same harness as store-retention.test.js: fake timers pin "today", resetAll
// + localStorage.clear() between tests, assertions against the real store.

import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { useStore } from '../src/store/useStore.js';
import { PATHS } from '../src/data/content.js';

const VALID_IDS = (() => {
  const out = [];
  for (const p of Object.values(PATHS)) {
    for (const l of p.lessons) {
      if (l.kind !== 'lab' && l.kind !== 'sd') out.push(l.id);
      if (out.length >= 15) break;
    }
    if (out.length >= 15) break;
  }
  return out;
})();
const LESSON_A = VALID_IDS[0];
const LESSON_B = VALID_IDS[1];

function isoDay(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Wed 2026-06-03 — non-weekend so streak forgiveness never interferes.
const FIXED_TODAY = new Date(2026, 5, 3, 12, 0, 0);
const TODAY = isoDay(FIXED_TODAY);

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(FIXED_TODAY);
  try { localStorage.clear(); } catch { /* jsdom always provides it */ }
  useStore.getState().resetAll();
});

afterEach(() => {
  vi.useRealTimers();
});

// Consume the "first activity of the day" edge (streak-day +1 ember) so a
// test can isolate the earn path it actually cares about.
function burnStreakDayEmber() {
  useStore.getState().recordActivity();
}

describe('ember earning', () => {
  it('awards +3 on a fresh lesson completion, 0 on re-completion', () => {
    burnStreakDayEmber();
    const base = useStore.getState().embers;
    useStore.getState().completeLesson(LESSON_A);
    expect(useStore.getState().embers).toBe(base + 3);
    // Re-completing (IntersectionObserver remount, StrictMode double-fire)
    // must not re-mint — same stance as the FSRS double-grade guard.
    useStore.getState().completeLesson(LESSON_A);
    expect(useStore.getState().embers).toBe(base + 3);
  });

  it('awards +1 per graded review including misses, capped at 10/day', () => {
    burnStreakDayEmber();
    useStore.getState().completeLesson(LESSON_A);
    const base = useStore.getState().embers;
    // 12 graded reviews in one day — mixed grades, misses included.
    for (let i = 0; i < 12; i++) {
      useStore.getState().markReviewed(LESSON_A, (i % 4) + 1);
    }
    expect(useStore.getState().embers).toBe(base + 10);
    expect(useStore.getState().emberDaily).toEqual({ date: TODAY, reviews: 10 });
  });

  it('resets the review cap on the next calendar day', () => {
    burnStreakDayEmber();
    useStore.getState().completeLesson(LESSON_A);
    for (let i = 0; i < 10; i++) useStore.getState().markReviewed(LESSON_A, 3);
    const dayOneTotal = useStore.getState().embers;
    // Next day: cap re-opens (plus the new day's streak ember rides the
    // first markReviewed via recordActivity).
    vi.setSystemTime(new Date(2026, 5, 4, 12, 0, 0));
    useStore.getState().markReviewed(LESSON_A, 3);
    expect(useStore.getState().embers).toBe(dayOneTotal + 1 + 1);
    expect(useStore.getState().emberDaily.reviews).toBe(1);
  });

  it('awards +2 exactly once on the daily-practice done latch', () => {
    burnStreakDayEmber();
    const base = useStore.getState().embers;
    expect(useStore.getState().markDailyPracticeDone()).toBe(true);
    expect(useStore.getState().embers).toBe(base + 2);
    // Latch already set — remounts can't re-earn.
    expect(useStore.getState().markDailyPracticeDone()).toBe(false);
    expect(useStore.getState().embers).toBe(base + 2);
  });

  it('awards +1 per streak-bearing day, once per day', () => {
    useStore.getState().recordActivity();
    expect(useStore.getState().embers).toBe(1);
    useStore.getState().recordActivity(); // same-day no-op
    expect(useStore.getState().embers).toBe(1);
    vi.setSystemTime(new Date(2026, 5, 4, 12, 0, 0));
    useStore.getState().recordActivity();
    expect(useStore.getState().embers).toBe(2);
  });

  it('completeLab nets +8 total (3 lesson credit + 5 lab bonus)', () => {
    burnStreakDayEmber();
    const base = useStore.getState().embers;
    // Any string id works for labProgress; the inner completeLesson only
    // credits embers when the id is a real lesson, so use one.
    useStore.getState().completeLab(LESSON_B);
    expect(useStore.getState().embers).toBe(base + 8);
    // Idempotent — a second completeLab earns nothing.
    useStore.getState().completeLab(LESSON_B);
    expect(useStore.getState().embers).toBe(base + 8);
  });
});

describe('spendEmbers', () => {
  it('deducts and returns true when the balance covers the cost', () => {
    useStore.setState({ embers: 10 });
    expect(useStore.getState().spendEmbers(4)).toBe(true);
    expect(useStore.getState().embers).toBe(6);
  });

  it('returns false and leaves the balance untouched when short', () => {
    useStore.setState({ embers: 3 });
    expect(useStore.getState().spendEmbers(4)).toBe(false);
    expect(useStore.getState().embers).toBe(3);
  });

  it('rejects garbage amounts', () => {
    useStore.setState({ embers: 5 });
    expect(useStore.getState().spendEmbers(-2)).toBe(false);
    expect(useStore.getState().spendEmbers(NaN)).toBe(false);
    expect(useStore.getState().spendEmbers('3')).toBe(false);
    expect(useStore.getState().embers).toBe(5);
  });
});

describe('embers in celebrations', () => {
  it('annotates the live celebration so the toast can show +n ⟡', () => {
    burnStreakDayEmber();
    useStore.getState().clearCelebration();
    useStore.getState().completeLesson(LESSON_A);
    const c = useStore.getState().celebrate;
    expect(c).toBeTruthy();
    expect(c.embers).toBe(3);
  });

  it('never creates a celebration on its own', () => {
    useStore.getState().clearCelebration();
    useStore.getState().addEmbers(5);
    expect(useStore.getState().celebrate).toBeNull();
    expect(useStore.getState().embers).toBe(5);
  });
});

describe('import / merge safety', () => {
  it('replace-import scrubs a tampered balance to sane bounds', () => {
    const r1 = useStore.getState().importData(JSON.stringify({ embers: -50 }));
    expect(r1.ok).toBe(true);
    expect(useStore.getState().embers).toBe(0);
    const r2 = useStore.getState().importData(JSON.stringify({ embers: 99e9 }));
    expect(r2.ok).toBe(true);
    expect(useStore.getState().embers).toBe(0);
    const r3 = useStore.getState().importData(JSON.stringify({ embers: 'rich' }));
    expect(r3.ok).toBe(true);
    expect(useStore.getState().embers).toBe(0);
  });

  it('replace-import accepts a sane balance and a well-formed daily slot', () => {
    const r = useStore.getState().importData(JSON.stringify({
      embers: 42,
      emberDaily: { date: TODAY, reviews: 7 },
    }));
    expect(r.ok).toBe(true);
    expect(useStore.getState().embers).toBe(42);
    expect(useStore.getState().emberDaily).toEqual({ date: TODAY, reviews: 7 });
  });

  it('merge-import takes the max balance and cannot reopen today\'s cap', () => {
    useStore.setState({ embers: 30, emberDaily: { date: TODAY, reviews: 10 } });
    const r = useStore.getState().importData(
      JSON.stringify({ embers: 12, emberDaily: { date: TODAY, reviews: 0 } }),
      'merge',
    );
    expect(r.ok).toBe(true);
    expect(useStore.getState().embers).toBe(30);
    // Local slot is today's — the import's zeroed counter must not win.
    expect(useStore.getState().emberDaily).toEqual({ date: TODAY, reviews: 10 });
  });

  it('merge-import lifts a lower local balance to the backup\'s', () => {
    useStore.setState({ embers: 5 });
    const r = useStore.getState().importData(JSON.stringify({ embers: 21 }), 'merge');
    expect(r.ok).toBe(true);
    expect(useStore.getState().embers).toBe(21);
  });

  it('emberDaily with a malformed date collapses to the empty slot', () => {
    const r = useStore.getState().importData(JSON.stringify({
      embers: 1,
      emberDaily: { date: 'someday', reviews: 9 },
    }));
    expect(r.ok).toBe(true);
    expect(useStore.getState().emberDaily).toEqual({ date: null, reviews: 0 });
  });
});
