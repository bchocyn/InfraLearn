// Concept tags — the soft cross-path layer (IMPROVEMENTS §3.5).
//
// The 8 paths are deliberate silos, but several concepts are taught in more
// than one of them (SQL three times, caching three times, monitoring four,
// TLS twice). Each copy seeds its own spaced-repetition card, so a learner
// who touched two paths got redundant, uncoordinated reviews of the same
// memory — a direct retention miss in a retention product.
//
// This map is the lightest fix: lessons sharing a tag are treated as one
// concept by the DUE LIST (only the oldest-due sibling serves on a given
// day) and by the scheduler's deferral rule (proving one sibling pushes the
// others' near-term due dates out two days — a DEFERRAL, never fabricated
// review history; the evidence log only ever records real answers).
//
// Deliberately NOT here: hard prerequisite links (locked decision — gates
// fight the ADHD on-ramp) and within-path adjacent topics (a path's own
// ordering already spaces those).
export const CONCEPT_TAGS = {
  // SQL — taught cold in swe and twice in fullstack.
  'sql-basics': 'sql',
  'fs-sql-essentials': 'sql',
  'fs-postgres-basics': 'sql',
  // Caching — layers (swe), eviction (faang), strategies (fullstack).
  'sd-cache-layers': 'caching',
  'faang-cache-eviction': 'caching',
  'fs-caching-strategies': 'caching',
  // Monitoring / observability — devops ×2, mlops, fullstack.
  'prometheus-stack': 'monitoring',
  'cloud-observability': 'monitoring',
  'mlops-monitoring': 'monitoring',
  'fs-monitoring': 'monitoring',
  // TLS — fundamentals intro + the cybersec deep dive.
  'net-tls': 'tls',
  'sec-https-deep': 'tls',
};

// tag → [lessonIds] (derived once; the map above stays the single source).
export const CONCEPT_GROUPS = (() => {
  const groups = {};
  for (const [id, tag] of Object.entries(CONCEPT_TAGS)) {
    (groups[tag] ||= []).push(id);
  }
  return groups;
})();

// Sibling lesson ids sharing `id`'s concept tag (excluding `id` itself).
export function conceptSiblings(id) {
  const tag = CONCEPT_TAGS[id];
  if (!tag) return [];
  return CONCEPT_GROUPS[tag].filter((other) => other !== id);
}
