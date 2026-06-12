// Schema integrity tests for lesson bodies in src/data/lessons/*.js
//
// Catches integration bugs from the path-split + concurrent agent authoring:
//   - lesson body present but referenced lessonId not in any PATH (orphan body)
//   - lesson body missing required structural fields (sections / heading / body)
//   - a block missing its `type` discriminator (renderer would silently skip)
//
// Note: contrary to a stricter "title + blocks" shape, the actual schema in
// src/data/lessons/*.js uses `sections: [{ heading, body: [{ type, ... }] }]`.
// Lesson titles live in PATHS (content.js), not in the body — the body's
// section headings act as in-lesson chapter titles. We test the real schema.

import { describe, expect, it } from 'vitest';
import lessons from '../src/data/lessons/index.js';
import { PATHS } from '../src/data/content.js';

const PATH_LESSON_IDS = new Set(
  Object.values(PATHS).flatMap((p) => p.lessons.map((l) => l.id)),
);

const BODY_IDS = Object.keys(lessons);

describe('lesson body schema', () => {
  it('exposes a non-empty lesson map', () => {
    expect(BODY_IDS.length).toBeGreaterThan(0);
  });

  // Per-lesson schema check. Some lessons may legitimately have an empty
  // `sections` array (e.g. labs with content elsewhere) — assert structure,
  // not non-emptiness.
  for (const id of BODY_IDS) {
    it(`lesson body "${id}" has a valid sections array with typed blocks`, () => {
      const body = lessons[id];
      expect(body, `body for ${id}`).toBeDefined();
      expect(body, `body for ${id}`).not.toBeNull();
      expect(Array.isArray(body.sections), `${id}.sections must be an array`).toBe(true);
      for (const [si, section] of body.sections.entries()) {
        expect(typeof section.heading, `${id}.sections[${si}].heading must be a string`).toBe('string');
        expect(Array.isArray(section.body), `${id}.sections[${si}].body must be an array`).toBe(true);
        for (const [bi, block] of section.body.entries()) {
          expect(block && typeof block === 'object', `${id}.sections[${si}].body[${bi}] must be an object`).toBe(true);
          expect(typeof block.type, `${id}.sections[${si}].body[${bi}].type must be a string`).toBe('string');
          expect(block.type.length, `${id}.sections[${si}].body[${bi}].type must be non-empty`).toBeGreaterThan(0);

          // Sequence diagrams: the renderer slices actors to 4 (a 5th lane
          // silently vanishes) and drops events whose lane ids don't resolve.
          // Same-lane events must use the { self } form — the from/to form
          // renders a zero-length arrow with its label centred on the lane.
          if (block.type === 'sequence') {
            const where = `${id}.sections[${si}].body[${bi}]`;
            const actors = Array.isArray(block.actors) ? block.actors : [];
            expect(
              actors.length >= 2 && actors.length <= 4,
              `${where}: sequence needs 2-4 actors, got ${actors.length}`,
            ).toBe(true);
            const laneIds = new Set(actors.map((a) => a.id));
            for (const [ei, ev] of (Array.isArray(block.events) ? block.events : []).entries()) {
              if (ev.self != null) {
                expect(laneIds.has(ev.self), `${where} event ${ei}: unknown self lane "${ev.self}"`).toBe(true);
              } else {
                expect(laneIds.has(ev.from), `${where} event ${ei}: unknown from lane "${ev.from}"`).toBe(true);
                expect(laneIds.has(ev.to), `${where} event ${ei}: unknown to lane "${ev.to}"`).toBe(true);
                expect(ev.from !== ev.to, `${where} event ${ei}: same-lane event must use { self: "${ev.from}" }`).toBe(true);
              }
            }
          }

          // Walkthroughs: steps referencing unknown node ids silently render
          // nothing (no highlight / no edge), so catch typos here.
          if (block.type === 'walkthrough') {
            const where = `${id}.sections[${si}].body[${bi}]`;
            const nodeIds = new Set((Array.isArray(block.nodes) ? block.nodes : []).map((n) => n.id));
            for (const [sti, st] of (Array.isArray(block.steps) ? block.steps : []).entries()) {
              for (const nid of st.activeNodes || []) {
                expect(nodeIds.has(nid), `${where} step ${sti}: unknown activeNode "${nid}"`).toBe(true);
              }
              for (const ed of st.activeEdges || []) {
                expect(nodeIds.has(ed.from), `${where} step ${sti}: unknown edge.from "${ed.from}"`).toBe(true);
                expect(nodeIds.has(ed.to), `${where} step ${sti}: unknown edge.to "${ed.to}"`).toBe(true);
              }
            }
          }
        }
      }
    });
  }

  it('every lesson body ID corresponds to a lesson in PATHS (no orphan bodies)', () => {
    const orphans = BODY_IDS.filter((id) => !PATH_LESSON_IDS.has(id));
    expect(orphans, `orphan lesson bodies (no PATHS entry): ${orphans.join(', ')}`).toEqual([]);
  });
});
