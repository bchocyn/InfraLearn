// Aggregated lesson bodies — split from the legacy monolith lessonContent.js.
import fundamentals from './fundamentals.js';
import devops from './devops.js';
import mlops from './mlops.js';
import swe from './swe.js';
import mleng from './mleng.js';
import faang from './faang.js';
import fullstack from './fullstack.js';
import cybersec from './cybersec.js';

const lessons = {
  ...fundamentals,
  ...devops,
  ...mlops,
  ...swe,
  ...mleng,
  ...faang,
  ...fullstack,
  ...cybersec,
};

export default lessons;
