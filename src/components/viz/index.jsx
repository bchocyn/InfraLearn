// Visualization registry.
//
// Maps the `viz` field on an `interactive-viz` block to a React component.
// <Lesson.jsx>'s `InteractiveVizBlock` looks the component up here so lesson
// content can stay declarative (`{ type: 'interactive-viz', viz: 'big-o-race' }`)
// without any per-viz import churn in the lesson screen.
//
// Phase 1: components are placeholder stubs ("Coming soon: ...").
// Phase 2 will swap in the real MLU-Explain-style interactive visualizations.
// Phase 3 will embed `interactive-viz` blocks in lesson content.
//
// To register a new viz: import the component here and add an entry to
// VIZ_REGISTRY keyed by the string the lesson author types in `viz`.
import BigOraceViz from './BigOraceViz.jsx';
import CacheEvictionViz from './CacheEvictionViz.jsx';
import FsrsCurveViz from './FsrsCurveViz.jsx';

export const VIZ_REGISTRY = {
  'big-o-race': BigOraceViz,
  'cache-eviction': CacheEvictionViz,
  'fsrs-curve': FsrsCurveViz,
};
