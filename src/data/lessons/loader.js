// Per-path dynamic loader for lesson bodies. Keeps Lesson.jsx's bundle small:
// instead of importing the merged `lessonContent` object (which static-merges
// all 8 path files at build time, producing a ~1.2 MB chunk), we import only
// the path file the current lesson belongs to. Each path file becomes its own
// async chunk, fetched on demand.
//
// The aggregator at `./index.js` is still used by tests + by the legacy
// `src/data/lessonContent.js` shim, but production lesson rendering routes
// through here so Vite tree-shakes the aggregator out of the route bundle.

const loaders = {
  fundamentals: () => import('./fundamentals.js'),
  devops: () => import('./devops.js'),
  mlops: () => import('./mlops.js'),
  swe: () => import('./swe.js'),
  mleng: () => import('./mleng.js'),
  faang: () => import('./faang.js'),
  fullstack: () => import('./fullstack.js'),
  cybersec: () => import('./cybersec.js'),
};

// Tiny in-memory cache so re-rendering the same path doesn't re-import.
const cache = new Map();

export async function loadLessonsForPath(pathKey) {
  if (!pathKey || !loaders[pathKey]) return {};
  if (cache.has(pathKey)) return cache.get(pathKey);
  const mod = await loaders[pathKey]();
  const bodies = mod.default || {};
  cache.set(pathKey, bodies);
  return bodies;
}

export const LESSON_PATH_KEYS = Object.keys(loaders);
