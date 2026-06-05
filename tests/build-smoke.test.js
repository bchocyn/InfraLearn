// CI-style smoke: importing the store and the lesson aggregator must not throw.
// Catches the "persist migration crashes on first run" regression class and
// "lesson body file has a syntax error" / "import cycle" classes.

import { describe, expect, it } from 'vitest';

describe('build smoke', () => {
  it('useStore constructs without throwing and exposes the expected actions', async () => {
    const mod = await import('../src/store/useStore.js');
    expect(mod.useStore).toBeDefined();
    const state = mod.useStore.getState();
    // Spot-check critical actions exist — if the file rewrites broke the shape
    // (e.g. accidental `useStore = ...` overwrite), these would be undefined.
    for (const key of ['recordActivity', 'scheduleReview', 'refillWeekendPassesIfNewMonth', 'completeLesson', 'resetAll']) {
      expect(typeof state[key], `useStore.getState().${key}`).toBe('function');
    }
  });

  it('the lesson aggregator imports cleanly and exposes lesson bodies', async () => {
    const mod = await import('../src/data/lessons/index.js');
    expect(mod.default).toBeDefined();
    expect(typeof mod.default).toBe('object');
    expect(Object.keys(mod.default).length).toBeGreaterThan(0);
  });

  it('content.js exposes PATHS and selector helpers', async () => {
    const mod = await import('../src/data/content.js');
    expect(mod.PATHS).toBeDefined();
    expect(typeof mod.pathProgress).toBe('function');
    expect(typeof mod.badgeFor).toBe('function');
    expect(Array.isArray(mod.PATH_KEYS)).toBe(true);
  });
});
