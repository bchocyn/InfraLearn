// Unit tests for codex fragment unlocks (journey layer §3) in useStore.js.
//
// Fragments are granted by recomputeLore from real milestones only:
// provinces from first lessons, beast pages from tier attunement, lapses
// from pushing an aligned province to bronze (33%), hollow-ink from a gold
// seal. Import must drop unknown IDs and the merge must keep the earliest
// unlock date. Same harness as the other store suites.

import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { useStore, deriveLoreUnlocks } from '../src/store/useStore.js';
import { PATHS, PATH_KEYS } from '../src/data/content.js';
import { PROVINCES } from '../src/data/lore.js';

function isoDay(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const FIXED_TODAY = new Date(2026, 5, 3, 12, 0, 0); // Wed 2026-06-03 local
const TODAY = isoDay(FIXED_TODAY);

// First path key + its first lesson id — used to cross a real province gate.
const PATH_A = PATH_KEYS[0];
const LESSON_A = PATHS[PATH_A].lessons[0].id;

// completed-map covering ≥33% of PATH_A (bronze) or 100% (gold).
function completeFraction(pathKey, fraction) {
  const ids = PATHS[pathKey].lessons.map((l) => l.id);
  const n = Math.ceil(ids.length * fraction);
  const out = {};
  for (const id of ids.slice(0, n)) out[id] = true;
  return out;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(FIXED_TODAY);
  try { localStorage.clear(); } catch { /* jsdom always provides it */ }
  useStore.getState().resetAll();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('deriveLoreUnlocks', () => {
  it('always includes the world myth', () => {
    expect(deriveLoreUnlocks({})).toContain('world:myth');
  });

  it('grants a province on first completion and its lapse at bronze', () => {
    const one = deriveLoreUnlocks({ completed: { [LESSON_A]: true } });
    expect(one).toContain(`province:${PATH_A}`);
    expect(one).not.toContain(`lapse:${PROVINCES[PATH_A].lapse}`);
    const bronze = deriveLoreUnlocks({ completed: completeFraction(PATH_A, 0.34) });
    expect(bronze).toContain(`lapse:${PROVINCES[PATH_A].lapse}`);
  });

  it('reveals hollow-ink (finale) only at a gold seal', () => {
    expect(deriveLoreUnlocks({ completed: completeFraction(PATH_A, 0.5) }))
      .not.toContain('lapse:hollow-ink');
    expect(deriveLoreUnlocks({ completed: completeFraction(PATH_A, 1) }))
      .toContain('lapse:hollow-ink');
  });

  it('maps beast tiers to origin/field/saga/scar fragments', () => {
    const got = deriveLoreUnlocks({
      companion: 'dragon',
      beastTiers: { kraken: { devops: 3 } },
    });
    expect(got).toContain('beast:dragon:origin');   // bonded companion
    expect(got).toContain('beast:kraken:origin');   // trained species
    expect(got).toContain('beast:kraken:field');
    expect(got).toContain('beast:kraken:saga');
    expect(got).not.toContain('beast:kraken:scar'); // tier 4 only
    expect(got).not.toContain('beast:dragon:field');
  });
});

describe('recomputeLore', () => {
  it('completing a first lesson unlocks the province fragment', () => {
    useStore.getState().completeLesson(LESSON_A);
    const lore = useStore.getState().loreUnlocked;
    expect(lore[`province:${PATH_A}`]).toBe(TODAY);
    expect(lore['world:myth']).toBe(TODAY);
  });

  it('celebrates a real fragment but never the ambient myth', () => {
    // A fresh store already qualifies the default companion's origin, so
    // grant the initial batch first, then strip ONLY the myth and re-run:
    // a myth-only diff must stay silent.
    useStore.getState().recomputeLore();
    useStore.getState().clearCelebration();
    const { 'world:myth': _gone, ...rest } = useStore.getState().loreUnlocked;
    useStore.setState({ loreUnlocked: rest });
    useStore.getState().recomputeLore();
    expect(useStore.getState().celebrate).toBeNull();
    expect(useStore.getState().loreUnlocked['world:myth']).toBe(TODAY);
    // A milestone-bearing diff celebrates with the lore kind.
    useStore.setState({ beastTiers: { dragon: { devops: 2 } } });
    useStore.getState().recomputeLore();
    const c = useStore.getState().celebrate;
    expect(c?.kind).toBe('lore');
    expect(typeof c?.loreId).toBe('string');
  });

  it('is idempotent — re-running grants nothing and keeps dates', () => {
    useStore.getState().completeLesson(LESSON_A);
    const before = useStore.getState().loreUnlocked;
    vi.setSystemTime(new Date(2026, 5, 9, 12, 0, 0));
    useStore.getState().recomputeLore();
    expect(useStore.getState().loreUnlocked).toEqual(before);
  });

  it('never clobbers a fresh badge celebration (badge outranks lore)', () => {
    // Completing to bronze grants the badge and the lapse fragment in the
    // same synchronous batch — the badge moment must survive.
    const completed = completeFraction(PATH_A, 0.34);
    const ids = Object.keys(completed);
    for (const id of ids) useStore.getState().completeLesson(id);
    const c = useStore.getState().celebrate;
    expect(c?.kind).toBe('badge');
  });
});

describe('import / merge safety', () => {
  it('replace-import drops unknown fragment ids and mangled dates heal', () => {
    const r = useStore.getState().importData(JSON.stringify({
      loreUnlocked: {
        'world:myth': '2026-01-02',
        'province:devops': 'not-a-date',
        'lapse:fake-villain': '2026-01-02',
        'beast:dragon:secret-page': '2026-01-02',
      },
    }));
    expect(r.ok).toBe(true);
    const lore = useStore.getState().loreUnlocked;
    expect(lore['world:myth']).toBe('2026-01-02');
    expect(lore['province:devops']).toBe(TODAY);      // healed date
    expect(lore['lapse:fake-villain']).toBeUndefined();
    expect(lore['beast:dragon:secret-page']).toBeUndefined();
  });

  it('merge keeps the earliest unlock date per fragment', () => {
    useStore.setState({ loreUnlocked: { 'world:myth': '2026-03-05' } });
    const r = useStore.getState().importData(
      JSON.stringify({ loreUnlocked: { 'world:myth': '2026-01-02', 'province:devops': '2026-02-02' } }),
      'merge',
    );
    expect(r.ok).toBe(true);
    const lore = useStore.getState().loreUnlocked;
    expect(lore['world:myth']).toBe('2026-01-02');
    expect(lore['province:devops']).toBe('2026-02-02');
  });
});
