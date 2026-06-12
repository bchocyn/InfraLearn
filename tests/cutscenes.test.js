// Story cutscene system: data builders, store queueing rules, and the
// overlay component. Client-rendered via createRoot/act (same harness as
// roadmap-story.test.js — renderToString would only see the store's initial
// state under zustand v4).

import { beforeEach, describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { useStore } from '../src/store/useStore.js';
import { PATHS, PATH_KEYS } from '../src/data/content.js';
import { PROVINCES, FIVE_LAPSES } from '../src/data/lore.js';
import { getCutscene, parseCutsceneId } from '../src/data/cutscenes.js';
import Cutscene from '../src/components/Cutscene.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function mount() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => { root.render(createElement(Cutscene)); });
  return {
    container,
    unmount: () => { act(() => root.unmount()); container.remove(); },
  };
}

beforeEach(() => {
  localStorage.clear();
  useStore.getState().resetAll();
  useStore.setState({ activePath: 'devops', onboarded: true });
});

describe('cutscene data', () => {
  it('builds all three beats for every province with lore', () => {
    for (const k of PATH_KEYS) {
      if (!PROVINCES[k]) continue;
      for (const beat of ['enter', 'notice', 'turn']) {
        const scene = getCutscene(`${beat}:${k}`);
        expect(scene, `${beat}:${k}`).toBeTruthy();
        expect(scene.panels.length).toBeGreaterThan(0);
        for (const p of scene.panels) {
          expect(p.actor?.type).toBeTruthy();
          expect(p.lines.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it('rejects malformed ids', () => {
    expect(parseCutsceneId('nonsense')).toBeNull();
    expect(getCutscene('enter:not-a-path')).toBeNull();
    expect(getCutscene('')).toBeNull();
  });
});

describe('cutscene queueing', () => {
  it('switching career paths queues the province-entry beat exactly once', () => {
    useStore.getState().setActivePath('mlops');
    expect(useStore.getState().pendingCutscene).toBe('enter:mlops');
    // Dismiss, switch away and back — seen-guard holds, nothing re-queues.
    useStore.getState().clearPendingCutscene();
    useStore.getState().setActivePath('devops');
    useStore.getState().clearPendingCutscene();
    useStore.getState().setActivePath('mlops');
    expect(useStore.getState().pendingCutscene).toBeNull();
  });

  it('does not queue before onboarding (the initial pick is scene-set by Onboarding)', () => {
    useStore.setState({ onboarded: false });
    useStore.getState().setActivePath('swe');
    expect(useStore.getState().pendingCutscene).toBeNull();
  });

  it('bronze progress queues the "Lapse notices" beat', () => {
    const lessons = PATHS.devops.lessons;
    const completed = {};
    for (const l of lessons.slice(0, Math.ceil(lessons.length * 0.34))) completed[l.id] = true;
    useStore.setState({ completed });
    useStore.getState().computeNewBadges();
    expect(useStore.getState().pendingCutscene).toBe('notice:devops');
  });

  it('a queued cutscene never clobbers an earlier one', () => {
    useStore.getState().queueCutscene('enter:devops');
    useStore.getState().queueCutscene('notice:devops');
    expect(useStore.getState().pendingCutscene).toBe('enter:devops');
    // Both are marked seen, so neither replays later.
    expect(useStore.getState().cutscenesSeen['notice:devops']).toBe(true);
  });
});

describe('Cutscene overlay', () => {
  it('renders the entry beat and advances panel-by-panel to dismissal', () => {
    useStore.getState().queueCutscene('enter:devops');
    const { container, unmount } = mount();
    const province = PROVINCES.devops;
    expect(container.innerHTML).toContain(province.name);
    expect(container.innerHTML).toContain('SKIP');
    // Tap through every panel; the last tap clears the pending slot.
    const panels = getCutscene('enter:devops').panels.length;
    for (let i = 0; i < panels; i++) {
      const overlay = container.querySelector('.cutscene-overlay');
      expect(overlay).toBeTruthy();
      act(() => { overlay.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    }
    expect(useStore.getState().pendingCutscene).toBeNull();
    expect(container.querySelector('.cutscene-overlay')).toBeNull();
    unmount();
  });

  it('shows the Lapse voice line on the notice beat', () => {
    useStore.getState().queueCutscene('notice:devops');
    const { container, unmount } = mount();
    const lapse = FIVE_LAPSES[PROVINCES.devops.lapse];
    act(() => {
      container.querySelector('.cutscene-overlay')
        .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(container.innerHTML).toContain(lapse.name);
    unmount();
  });

  it('defers to a pending Ascension cinematic', () => {
    useStore.getState().queueCutscene('enter:devops');
    useStore.setState({ pendingAscension: 'devops' });
    const { container, unmount } = mount();
    expect(container.querySelector('.cutscene-overlay')).toBeNull();
    // Ascension dismissed → the story beat takes the stage.
    act(() => { useStore.setState({ pendingAscension: null }); });
    expect(container.querySelector('.cutscene-overlay')).toBeTruthy();
    unmount();
  });
});
