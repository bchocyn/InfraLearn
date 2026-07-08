// Concept coalescing (src/data/conceptTags.js + the store's due-list dedupe
// and sibling deferral). The 8 paths teach several concepts more than once
// (SQL ×3, caching ×3, monitoring ×4, TLS ×2); without coalescing each copy
// demanded its own review of the same memory.
import { beforeEach, describe, expect, it } from 'vitest';
import { useStore, getReviewsDue } from '../src/store/useStore.js';
import { CONCEPT_TAGS, CONCEPT_GROUPS, conceptSiblings } from '../src/data/conceptTags.js';
import { PATHS } from '../src/data/content.js';

const ALL_IDS = new Set(
  Object.values(PATHS).flatMap((p) => p.lessons.map((l) => l.id)),
);

function isoDay(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function addDays(iso, n) {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d + n);
  return isoDay(dt);
}

const card = (dueAt) => ({
  lastSeen: addDays(dueAt, -3), dueAt, stability: 2.5, difficulty: 5, reps: 1, lapses: 0,
});

beforeEach(() => {
  localStorage.clear();
  useStore.getState().resetAll();
});

describe('CONCEPT_TAGS integrity', () => {
  it('every tagged id is a real lesson', () => {
    for (const id of Object.keys(CONCEPT_TAGS)) {
      expect(ALL_IDS.has(id), id).toBe(true);
    }
  });

  it('every group spans at least two lessons', () => {
    for (const [tag, ids] of Object.entries(CONCEPT_GROUPS)) {
      expect(ids.length, tag).toBeGreaterThanOrEqual(2);
    }
  });
});

describe('due-list coalescing', () => {
  const [SQL_A, SQL_B] = CONCEPT_GROUPS.sql;

  it('serves only the oldest-due sibling of a concept group per day', () => {
    const today = isoDay();
    const due = getReviewsDue({
      reviewQueue: {
        [SQL_A]: card(addDays(today, -5)), // older-due — must win
        [SQL_B]: card(addDays(today, -1)),
      },
    });
    expect(due).toContain(SQL_A);
    expect(due).not.toContain(SQL_B);
  });

  it('untagged concepts are never deduped', () => {
    const today = isoDay();
    const plain = [...ALL_IDS].filter((id) => !CONCEPT_TAGS[id]).slice(0, 2);
    const due = getReviewsDue({
      reviewQueue: {
        [plain[0]]: card(addDays(today, -2)),
        [plain[1]]: card(addDays(today, -2)),
      },
    });
    expect(due).toContain(plain[0]);
    expect(due).toContain(plain[1]);
  });
});

describe('sibling deferral on recall', () => {
  const [SQL_A, SQL_B] = CONCEPT_GROUPS.sql;

  it('a grade-3 recall pushes a due sibling two days out (deferral, not evidence)', () => {
    const today = isoDay();
    useStore.setState({
      reviewQueue: {
        [SQL_A]: card(addDays(today, -2)),
        [SQL_B]: card(addDays(today, -1)),
      },
    });
    const before = useStore.getState().reviewQueue[SQL_B];
    useStore.getState().scheduleReview(SQL_A, 3);
    const after = useStore.getState().reviewQueue[SQL_B];
    expect(after.dueAt).toBe(addDays(today, 2));
    // Deferral only — no fabricated review history on the sibling.
    expect(after.reps).toBe(before.reps);
    expect(after.stability).toBe(before.stability);
    expect(after.lastSeen).toBe(before.lastSeen);
  });

  it('a miss defers nothing — a failed recall needs MORE looks, not fewer', () => {
    const today = isoDay();
    useStore.setState({
      reviewQueue: {
        [SQL_A]: card(addDays(today, -2)),
        [SQL_B]: card(addDays(today, -1)),
      },
    });
    useStore.getState().scheduleReview(SQL_A, 1);
    expect(useStore.getState().reviewQueue[SQL_B].dueAt).toBe(addDays(today, -1));
  });

  it('far-future siblings are left alone', () => {
    const today = isoDay();
    const far = addDays(today, 20);
    useStore.setState({
      reviewQueue: {
        [SQL_A]: card(addDays(today, -2)),
        [SQL_B]: card(far),
      },
    });
    useStore.getState().scheduleReview(SQL_A, 3);
    expect(useStore.getState().reviewQueue[SQL_B].dueAt).toBe(far);
  });

  it('conceptSiblings excludes the id itself', () => {
    expect(conceptSiblings(SQL_A)).not.toContain(SQL_A);
    expect(conceptSiblings(SQL_A).length).toBeGreaterThanOrEqual(1);
  });
});
