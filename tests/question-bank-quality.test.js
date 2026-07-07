import { describe, it, expect } from 'vitest';
import { DAILY_QUESTIONS } from '../src/data/dailyQuestions.js';
import mathQuizzes from '../src/data/mathQuizzes.js';
import { rawPathPool, dealBattle, BOSS_QUESTIONS, BATTLE_BANKED_PATHS } from '../src/data/battles.js';
import { PATHS } from '../src/data/content.js';
import fundamentals from '../src/data/lessons/fundamentals.js';
import devops from '../src/data/lessons/devops.js';
import mlops from '../src/data/lessons/mlops.js';
import swe from '../src/data/lessons/swe.js';
import mleng from '../src/data/lessons/mleng.js';
import faang from '../src/data/lessons/faang.js';
import fullstack from '../src/data/lessons/fullstack.js';
import cybersec from '../src/data/lessons/cybersec.js';

// Question-bank quality gates.
//
// These encode the measured defects of the 2026-07 audit so they can't
// regress: answer-position bias (the correct answer sat at one slot 83% of
// the time in mathQuizzes), longest-option bias (correct = strictly longest
// in 75-93% of questions — "tap the longest" scored without recall), thin
// pools (a 5-question bank dealt 7-question boss fights), and one-directional
// content integrity (a typo'd PATHS id shipped the "hasn't been authored"
// card with CI green).
//
// LEGACY exemptions: the fullstack + cybersec daily banks (authored before
// these rules) still carry position/length bias. Render-time shuffling
// (battles normalize(), pickDailySession permuteOptions, MathQuiz
// shuffleOptions) neutralizes POSITION bias everywhere in-app; LENGTH bias
// survives shuffling, so rewriting those banks' distractors is the standing
// TODO. New/expanded banks must pass strict.

const LEGACY_POSITION = new Set(['fullstack']);            // pos dist [9,19,0]
const LEGACY_LENGTH = new Set(['fullstack', 'cybersec']);  // 82% / 93% longest-correct

const flatten = (bank) => Object.values(bank).flat();
const longestCorrectRate = (qs, optsKey, ansKey) => {
  let n = 0;
  for (const q of qs) {
    const lens = q[optsKey].map((o) => o.length);
    const max = Math.max(...lens);
    if (lens[q[ansKey]] === max && lens.filter((l) => l === max).length === 1) n += 1;
  }
  return qs.length ? n / qs.length : 0;
};

describe('daily-question banks', () => {
  for (const [pathKey, bank] of Object.entries(DAILY_QUESTIONS)) {
    describe(pathKey, () => {
      const qs = flatten(bank);

      it('every question is fully shaped (3 opts, valid answer, full feedback)', () => {
        for (const q of qs) {
          expect(typeof q.q, q.q).toBe('string');
          expect(q.opts, q.q).toHaveLength(3);
          expect([0, 1, 2], q.q).toContain(q.answer);
          expect(typeof q.whyCorrect, `whyCorrect missing: ${q.q}`).toBe('string');
          for (let i = 0; i < 3; i += 1) {
            if (i === q.answer) continue;
            const ww = q.whyWrong || {};
            const has = ww[i] != null || ww[String(i)] != null || ww.default != null;
            expect(has, `whyWrong[${i}] missing: ${q.q}`).toBe(true);
          }
        }
      });

      it('has no duplicate stems', () => {
        const stems = qs.map((q) => q.q);
        expect(new Set(stems).size).toBe(stems.length);
      });

      it('answer positions are used and not lopsided', () => {
        if (LEGACY_POSITION.has(pathKey)) return; // see LEGACY note above
        const dist = [0, 0, 0];
        for (const q of qs) dist[q.answer] += 1;
        for (let i = 0; i < 3; i += 1) {
          expect(dist[i], `position ${i} never correct`).toBeGreaterThan(0);
        }
        expect(Math.max(...dist) / qs.length, `lopsided: ${dist}`).toBeLessThanOrEqual(0.62);
      });

      it('the correct option is not systematically the longest', () => {
        if (LEGACY_LENGTH.has(pathKey)) return; // see LEGACY note above
        expect(longestCorrectRate(qs, 'opts', 'answer')).toBeLessThanOrEqual(0.5);
      });
    });
  }
});

describe('battle pools', () => {
  it('every banked path deals from a real pool (>= 25 questions with zero completions)', () => {
    for (const pathKey of BATTLE_BANKED_PATHS) {
      expect(rawPathPool(pathKey, {}).length, pathKey).toBeGreaterThanOrEqual(25);
    }
  });

  it('every boss fight deals a FULL hand (short decks repeated questions mid-fight)', () => {
    const full = {};
    for (const p of Object.values(PATHS)) for (const l of p.lessons) full[l.id] = true;
    for (const pathKey of BATTLE_BANKED_PATHS) {
      const deck = dealBattle(pathKey, full, 'boss', 0, BOSS_QUESTIONS);
      expect(deck.length, `${pathKey} boss`).toBe(BOSS_QUESTIONS);
    }
  });
});

describe('math-quiz banks', () => {
  const banks = Object.entries(mathQuizzes);

  it('every entry is fully shaped (4 opts, valid answer, feedback)', () => {
    for (const [id, bank] of banks) {
      for (const q of bank.questions || []) {
        expect(Array.isArray(q.options), `${id}: ${q.prompt}`).toBe(true);
        expect(q.options).toHaveLength(4);
        expect(q.answer).toBeGreaterThanOrEqual(0);
        expect(q.answer).toBeLessThan(4);
      }
    }
  });
  // Position/length bias in mathQuizzes (answer at B in 49/59) is neutralized
  // at render by MathQuiz's per-mount option shuffle; a distractor-length
  // rewrite is the standing content TODO before a strict gate lands here.
});

describe('content integrity (inverse direction)', () => {
  // The schema test checks bodies → PATHS (orphan bodies). This is the other
  // direction: every lesson PATHS promises must actually have an authored
  // body, or the learner gets the "hasn't been authored yet" card in
  // production with CI green.
  const bodies = { ...fundamentals, ...devops, ...mlops, ...swe, ...mleng, ...faang, ...fullstack, ...cybersec };

  it('every PATHS lesson id has an authored body', () => {
    const missing = [];
    for (const [pathKey, p] of Object.entries(PATHS)) {
      for (const l of p.lessons) {
        if (!bodies[l.id]) missing.push(`${pathKey}/${l.id}`);
      }
    }
    expect(missing).toEqual([]);
  });
});
