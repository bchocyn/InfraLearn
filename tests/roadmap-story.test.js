// Render smoke tests for the Roadmap v5 story layers (stage numbers, star
// fans, sites of grace, the fog gate + Null Beast sprite) and the Codex's
// Lapse art.
//
// Strategy: CLIENT-render the real screens into jsdom with createRoot inside
// act(), against the real Zustand store. NOT renderToString: zustand v4 hands
// React its INITIAL state as the SSR snapshot (api.getServerState ||
// api.getInitialState), so store mutations made by a test are invisible to
// renderToString — only a client render sees them.
// No JSX — vitest's include pattern is *.test.js, so we use createElement.

import { beforeEach, describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { MemoryRouter } from 'react-router-dom';
import { useStore } from '../src/store/useStore.js';
import { PATHS } from '../src/data/content.js';
import Roadmap from '../src/screens/Roadmap.jsx';
import Codex from '../src/screens/Codex.jsx';
import { LAPSE_KEYS } from '../src/data/lore.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function render(Screen) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(createElement(MemoryRouter, null, createElement(Screen)));
  });
  const html = container.innerHTML;
  act(() => root.unmount());
  container.remove();
  return html;
}

beforeEach(() => {
  localStorage.clear();
  useStore.getState().resetAll();
  useStore.setState({ activePath: 'devops' });
});

describe('Roadmap v5 story layers', () => {
  it('fresh path: stage numbers, waiting Lapse behind the fog gate, current-stage bubble', () => {
    const html = render(Roadmap);
    // World-map stage plates (section 1, stages 1 and 2 always exist).
    expect(html).toContain('1-1');
    expect(html).toContain('1-2');
    // The province's Lapse waits behind the fog gate, drawn with its sprite.
    expect(html).toContain('WAITS BEYOND THE FOG');
    expect(html).toMatch(/beasts\/null_[a-z_]+\.png/);
    // "You are here" bubble on the current stage.
    expect(html).toContain('roadmap-bang-bob');
    // Journey-star tally pill.
    expect(html).toContain('✦ 0/15');
    // PixelLab node chips: the current stage wears the amber candy button,
    // upcoming stages the dark recessed one.
    expect(html).toContain('ui_node_amber.png');
    expect(html).toContain('ui_node_dark.png');
  });

  it('cleared stages grow a star fan rated by quiz misses', () => {
    const first = PATHS.devops.lessons[0];
    // Clean run → 3 gold star sprites, no dim sockets.
    useStore.setState({ completed: { [first.id]: true } });
    let html = render(Roadmap);
    expect(html).toContain('ui_star.png');
    expect(html).not.toContain('roadmap-star-socket');
    // Two missed prompts → 2 stars; the dim third socket appears.
    useStore.setState({
      quizMisses: { [first.id]: { 'q one': { picked: 0 }, 'q two': { picked: 1 } } },
    });
    html = render(Roadmap);
    expect(html).toContain('roadmap-star-socket');
  });

  it('grace sites ignite once a section has progress', () => {
    const lessons = PATHS.devops.lessons;
    // Fresh: no lit grace anywhere (the lantern-glow class is grace-only now).
    expect(render(Roadmap)).not.toContain('roadmap-lantern-glow');
    // Complete the SECOND section's first lesson — its grace lights.
    // (Section 1 has no grace marker; boundaries start at section 2.)
    const secondSectionStart = lessons.findIndex(
      (l, i) => i > 0 && l.section !== lessons[0].section
    );
    expect(secondSectionStart).toBeGreaterThan(0);
    useStore.setState({ completed: { [lessons[secondSectionStart].id]: true } });
    expect(render(Roadmap)).toContain('roadmap-lantern-glow');
  });

  it('fog gate shatters when the province is fully reclaimed', () => {
    const all = {};
    for (const l of PATHS.devops.lessons) all[l.id] = true;
    useStore.setState({ completed: all });
    const html = render(Roadmap);
    expect(html).toContain('HAS FLED — FOR NOW');
    expect(html).not.toContain('WAITS BEYOND THE FOG');
    expect(html).not.toMatch(/beasts\/null_[a-z_]+\.png/);
  });
});

describe('Codex Lapse art', () => {
  it('every Lapse entry carries its Null Beast sprite, silhouetted while locked', () => {
    const html = render(Codex);
    for (const id of LAPSE_KEYS) {
      expect(html).toContain(`null_${id.replace(/-/g, '_')}.png`);
    }
    // Nothing unlocked on a fresh store → all five render as silhouettes.
    expect(html).toContain('codex-shadow');
    expect(html).toContain('A presence unnamed');
  });
});
