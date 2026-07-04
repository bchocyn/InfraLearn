// Unit tests for minion/boss quiz-battle progression.
//
// Invariants under test: the watermark advances sequentially (stage k needs
// k-1 beaten), XP mints exactly once per stage (replays are free practice),
// the boss needs all five minions, import scrubs hostile shapes, merge never
// regresses battle progress, and the eager-bundle BATTLE_BANKED_PATHS list
// can't silently drift from what the question banks can actually deal.

import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { useStore } from '../src/store/useStore.js';
import { PATHS, PATH_KEYS } from '../src/data/content.js';
import { dealBattle, rawPathPool } from '../src/data/battles.js';
import {
  BATTLE_BANKED_PATHS, encounterStatus,
  battleGateForLesson, battleBlockForLessonId,
} from '../src/data/battleMeta.js';

const P = 'devops'; // any banked path

const FIXED_TODAY = new Date(2026, 5, 3, 12, 0, 0);

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(FIXED_TODAY);
  try { localStorage.clear(); } catch { /* jsdom always provides it */ }
  useStore.getState().resetAll();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('recordBattleWin — sequential watermark', () => {
  it('advances one stage at a time and mints XP once per stage', () => {
    const s = useStore.getState();
    const xp0 = useStore.getState().xp;
    s.recordBattleWin(P, 2);                      // skipping ahead: rejected
    expect(useStore.getState().battles[P]).toBeUndefined();
    s.recordBattleWin(P, 1);
    expect(useStore.getState().battles[P].minions).toBe(1);
    const xp1 = useStore.getState().xp;
    expect(xp1).toBeGreaterThan(xp0);
    useStore.getState().recordBattleWin(P, 1);    // replay: watermark + XP unchanged
    expect(useStore.getState().battles[P].minions).toBe(1);
    expect(useStore.getState().xp).toBe(xp1);
  });

  it('boss requires all five minions, then latches', () => {
    useStore.getState().recordBattleWin(P, 'boss');
    expect(useStore.getState().battles[P]?.boss).not.toBe(true);
    useStore.setState({ battles: { [P]: { minions: 5, boss: false } } });
    useStore.getState().recordBattleWin(P, 'boss');
    expect(useStore.getState().battles[P].boss).toBe(true);
    const xp = useStore.getState().xp;
    useStore.getState().recordBattleWin(P, 'boss'); // replay: no re-mint
    expect(useStore.getState().xp).toBe(xp);
  });

  it('rejects junk paths and stages', () => {
    const s = useStore.getState();
    s.recordBattleWin('not-a-path', 1);
    s.recordBattleWin(P, 0);
    s.recordBattleWin(P, 6);
    s.recordBattleWin(P, 1.5);
    expect(useStore.getState().battles['not-a-path']).toBeUndefined();
    expect(useStore.getState().battles[P]).toBeUndefined();
  });
});

describe('importData — battles scrub + merge', () => {
  it('replace scrubs hostile shapes: out-of-range resets, boss only with 5 minions', () => {
    useStore.getState().importData(JSON.stringify({
      battles: {
        [P]: { minions: 5, boss: true },           // legit full clear → survives
        swe: { minions: 3, boss: true },           // boss without 5 minions → dropped
        mleng: { minions: 99, boss: true },        // tampered overflow → conservative reset
        'ghost-path': { minions: 2, boss: false }, // unknown path → dropped
        faang: 'garbage',                          // non-object → dropped
      },
    }), 'replace');
    const b = useStore.getState().battles;
    expect(b[P]).toEqual({ minions: 5, boss: true });
    expect(b.swe).toEqual({ minions: 3, boss: false });
    expect(b.mleng).toEqual({ minions: 0, boss: false });
    expect(b['ghost-path']).toBeUndefined();
    expect(b.faang).toBeUndefined();
  });

  it('merge unions by max and never regresses', () => {
    useStore.setState({ battles: { [P]: { minions: 4, boss: false }, swe: { minions: 2, boss: false } } });
    useStore.getState().importData(JSON.stringify({
      battles: { [P]: { minions: 1, boss: false }, swe: { minions: 5, boss: true } },
    }), 'merge');
    const b = useStore.getState().battles;
    expect(b[P].minions).toBe(4);         // local higher wins
    expect(b.swe).toEqual({ minions: 5, boss: true }); // import higher wins
  });
});

describe('battle deck + gating', () => {
  it('BATTLE_BANKED_PATHS matches what the banks can actually deal (drift guard)', () => {
    for (const k of PATH_KEYS) {
      const canDeal = rawPathPool(k, {}).length > 0;
      expect(
        BATTLE_BANKED_PATHS.has(k),
        `battleMeta.BATTLE_BANKED_PATHS drift for "${k}" — update the set to match the banks`
      ).toBe(canDeal);
    }
  });

  it('deals 4-option questions with in-range answers, deterministic per attempt', () => {
    const a = dealBattle(P, {}, 1, 0);
    const b = dealBattle(P, {}, 1, 0);
    const c = dealBattle(P, {}, 1, 1);
    expect(a.length).toBe(5);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));       // same attempt = same hand
    expect(JSON.stringify(a)).not.toBe(JSON.stringify(c));   // retry = fresh hand
    for (const q of a) {
      expect(q.opts.length).toBe(4);
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThan(q.opts.length);
      expect(new Set(q.opts).size).toBe(q.opts.length);       // no duplicate options
    }
  });

  it('battleGateForLesson: minions bar the road at each sixth of the trail', () => {
    // count=36 → encounter thresholds before lesson indices 6/12/18/24/30.
    expect(battleGateForLesson(P, 0, 36, {}).blocked).toBe(false);
    expect(battleGateForLesson(P, 5, 36, {}).blocked).toBe(false);           // last free lesson
    expect(battleGateForLesson(P, 6, 36, {})).toEqual({ blocked: true, stage: 1 });
    expect(battleGateForLesson(P, 6, 36, { [P]: { minions: 1, boss: false } }).blocked).toBe(false);
    // Deep in the path with 4/5 beaten: the 5th (next due) fight is demanded.
    expect(battleGateForLesson(P, 35, 36, { [P]: { minions: 4, boss: false } })).toEqual({ blocked: true, stage: 5 });
    expect(battleGateForLesson(P, 35, 36, { [P]: { minions: 5, boss: false } }).blocked).toBe(false);
    // Paths without question banks never block. (As of the 2026-07 content
    // fan-out EVERY real path is banked, so exercise the bypass branch with
    // an unknown key — it must fail open, never trap a lesson.)
    expect(battleGateForLesson('not-a-real-path', 30, 36, {}).blocked).toBe(false);
  });

  it('battleBlockForLessonId resolves a lesson to its path gate (route-level guard)', () => {
    const lessons = PATHS[P].lessons;
    const deep = lessons[lessons.length - 1];
    const r = battleBlockForLessonId(deep.id, {});
    expect(r.pathKey).toBe(P);
    expect(r.blocked).toBe(true);
    expect(r.stage).toBe(1);
    expect(battleBlockForLessonId('no-such-lesson', {}).blocked).toBe(false);
  });

  it('encounterStatus: stage gates on progress + previous stage; boss on 100% + 5 minions', () => {
    expect(encounterStatus(P, 1, 0.1, {}).unlocked).toBe(false);
    expect(encounterStatus(P, 1, 0.2, {}).unlocked).toBe(true);
    // Stage 2 locked until stage 1 beaten, even with enough progress.
    expect(encounterStatus(P, 2, 0.9, { [P]: { minions: 0, boss: false } }).unlocked).toBe(false);
    expect(encounterStatus(P, 2, 0.9, { [P]: { minions: 1, boss: false } }).unlocked).toBe(true);
    expect(encounterStatus(P, 'boss', 1, { [P]: { minions: 4, boss: false } }).unlocked).toBe(false);
    expect(encounterStatus(P, 'boss', 0.9, { [P]: { minions: 5, boss: false } }).unlocked).toBe(false);
    expect(encounterStatus(P, 'boss', 1, { [P]: { minions: 5, boss: false } }).unlocked).toBe(true);
  });
});
