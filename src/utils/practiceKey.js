// Shared key derivation for inline practice block persistence.
//
// PracticeBlock, LintEditor, and Lesson.PracticeInline all need to compute
// the SAME localStorage key for a given (lessonId, starter) pair so the
// "Open in Sandbox" hand-off targets exactly the bucket the inline editor
// is writing to. This helper is the single source of truth — never
// re-implement the djb2 hash inline.

// Cheap deterministic djb2 hash for an arbitrary string.
export function practiceHash(str) {
  let h = 5381;
  const s = str || '';
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h) ^ s.charCodeAt(i);
  }
  return (h >>> 0).toString(36);
}

// Build the canonical practice storage key. lessonId may be falsy — in that
// case we use the 'anon' bucket so test/preview surfaces still persist.
export function practiceStorageKey(lessonId, starter) {
  const h = practiceHash(starter);
  return lessonId ? `practice-${lessonId}-${h}` : `practice-anon-${h}`;
}
