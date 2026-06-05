// Lesson bodies were split into src/data/lessons/<path>.js. This file is kept as a
// thin shim so existing imports of `lessonContent` (and the default export) still
// resolve to the same merged object.
import lessons from './lessons/index.js';

export const lessonContent = lessons;
export default lessons;
