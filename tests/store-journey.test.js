// Unit tests for journey chapter progression (journey design §5/§10).
//
// The access invariant under test: chapters open on HARD gates only (real
// learning milestones, journeyGate) — never on currency. Embers are an earned
// reward, never a toll, so a met gate opens regardless of balance. Chapters
// open in order, re-open idempotently, and award their +5 XP exactly once.
// Import scrubs the shape; merge never regresses story progress.

import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { useStore, journeyGate } from '../src/store/useStore.js';
import { PATHS, PATH_KEYS } from '../src/data/content.js';

const PATH_A = PATH_KEYS[0];
const LESSON_A = PATHS[PATH_A].lessons[0].id;

function completeFraction(pathKey, fraction) {
  const ids = PATHS[pathKey].lessons.map((l) => l.id);
  const out = {};
  for (const id of ids.slice(0, Math.ceil(ids.length * fraction))) out[id] = true;
  return out;
}

const FIXED_TODAY = new Date(2026, 5, 3, 12, 0, 0); // Wed 2026-06-03 local

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(FIXED_TODAY);
  try { localStorage.clear(); } catch { /* jsdom always provides it */ }
  useStore.getState().resetAll();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('journeyGate', () => {
  it('chapter 1 opens on the first lesson, 2 at bronze, 5 at gold', () => {
    expect(journeyGate(PATH_A, 1, {}).met).toBe(false);
    expect(journeyGate(PATH_A, 1, { completed: { [LESSON_A]: true } }).met).toBe(true);
    expect(journeyGate(PATH_A, 2, { completed: { [LESSON_A]: true } }).met).toBe(false);
    expect(journeyGate(PATH_A, 2, { completed: completeFraction(PATH_A, 0.34) }).met).toBe(true);
    expect(journeyGate(PATH_A, 5, { completed: completeFraction(PATH_A, 0.9) }).met).toBe(false);
    expect(journeyGate(PATH_A, 5, { completed: completeFraction(PATH_A, 1) }).met).toBe(true);
  });

  it('chapter 3 needs ANY species at tier 2 on this path; 4 needs the Long Watch', () => {
    expect(journeyGate(PATH_A, 3, { beastTiers: { dragon: { [PATH_A]: 1 } } }).met).toBe(false);
    expect(journeyGate(PATH_A, 3, { beastTiers: { kraken: { [PATH_A]: 2 } } }).met).toBe(true);
    // Tier on a DIFFERENT path doesn't open this province's relay.
    const other = PATH_KEYS[1];
    expect(journeyGate(PATH_A, 3, { beastTiers: { kraken: { [other]: 4 } } }).met).toBe(false);
    expect(journeyGate(PATH_A, 4, { streakHighWater: 6 }).met).toBe(false);
    expect(journeyGate(PATH_A, 4, { streakHighWater: 7 }).met).toBe(true);
  });
});

describe('enterChapter — gate-only access (no toll)', () => {
  it('an unmet gate stays shut no matter the ember balance', () => {
    useStore.setState({ embers: 999 });
    const r = useStore.getState().enterChapter(PATH_A, 1);
    expect(r).toEqual({ ok: false, reason: 'gate' });
    expect(useStore.getState().embers).toBe(999);
  });

  it('a met gate opens regardless of embers — learning is never charged', () => {
    useStore.setState({ completed: { [LESSON_A]: true }, embers: 0 });
    const r = useStore.getState().enterChapter(PATH_A, 1);
    expect(r).toEqual({ ok: true, reason: 'open' });
    expect(useStore.getState().embers).toBe(0);
    expect(useStore.getState().journey[PATH_A].paid).toBe(1);
  });

  it('opens once and re-opening is idempotent, never touching embers', () => {
    useStore.setState({ completed: { [LESSON_A]: true }, embers: 10 });
    expect(useStore.getState().enterChapter(PATH_A, 1)).toEqual({ ok: true, reason: 'open' });
    expect(useStore.getState().embers).toBe(10); // not spent
    expect(useStore.getState().journey[PATH_A].paid).toBe(1);
    // Re-opening an already-open chapter is a no-op.
    expect(useStore.getState().enterChapter(PATH_A, 1)).toEqual({ ok: true, reason: 'already-open' });
    expect(useStore.getState().embers).toBe(10);
  });

  it('chapters cannot be skipped even with gates met', () => {
    useStore.setState({ completed: completeFraction(PATH_A, 0.5), embers: 50 });
    expect(useStore.getState().enterChapter(PATH_A, 2)).toEqual({ ok: false, reason: 'chapter-order' });
  });
});

describe('completeChapter', () => {
  function payChapterOne() {
    useStore.setState({ completed: { [LESSON_A]: true }, embers: 10 });
    useStore.getState().enterChapter(PATH_A, 1);
  }

  it('requires payment first and latches XP exactly once', () => {
    useStore.setState({ completed: { [LESSON_A]: true } });
    useStore.getState().completeChapter(PATH_A, 1, 3); // unpaid — no-op
    expect(useStore.getState().journey[PATH_A]).toBeUndefined();

    payChapterOne();
    const xpBefore = useStore.getState().xp;
    useStore.getState().completeChapter(PATH_A, 1, 3);
    const j = useStore.getState().journey[PATH_A];
    expect(j.chapter).toBe(1);
    expect(j.stars).toBe(3);
    expect(useStore.getState().xp).toBe(xpBefore + 5);
    // Re-completion is a no-op — no XP farm, no star inflation.
    useStore.getState().completeChapter(PATH_A, 1, 3);
    expect(useStore.getState().xp).toBe(xpBefore + 5);
    expect(useStore.getState().journey[PATH_A].stars).toBe(3);
  });

  it('clamps stars into 1..3', () => {
    payChapterOne();
    useStore.getState().completeChapter(PATH_A, 1, 99);
    expect(useStore.getState().journey[PATH_A].stars).toBe(3);
  });
});

describe('import / merge safety', () => {
  it('replace-import scrubs unknown provinces and enforces the paid invariant', () => {
    const r = useStore.getState().importData(JSON.stringify({
      journey: {
        // paid races ahead of chapter+1; stars out of range (rejected to 0,
        // the codebase's scrubInt stance — tampered values aren't clamped,
        // they're refused).
        [PATH_A]: { chapter: 2, paid: 5, stars: 99 },
        atlantis: { chapter: 5, paid: 5, stars: 15 },     // unknown province
      },
    }));
    expect(r.ok).toBe(true);
    const j = useStore.getState().journey;
    expect(j[PATH_A]).toEqual({ chapter: 2, paid: 3, stars: 0 });
    expect(j.atlantis).toBeUndefined();
  });

  it('merge never regresses story progress', () => {
    useStore.setState({ journey: { [PATH_A]: { chapter: 3, paid: 4, stars: 8 } } });
    const r = useStore.getState().importData(
      JSON.stringify({ journey: { [PATH_A]: { chapter: 1, paid: 1, stars: 3 } } }),
      'merge',
    );
    expect(r.ok).toBe(true);
    expect(useStore.getState().journey[PATH_A]).toEqual({ chapter: 3, paid: 4, stars: 8 });
  });
});
