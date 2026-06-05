import { useEffect } from 'react';

// useKeyboardShortcuts — bind a { key: handler } map to window keydown.
//
// Why a hook (not a global dispatcher):
//   - per-screen wiring stays colocated with the screen it controls; when a
//     screen unmounts its listener detaches automatically.
//   - dependency array mirrors useEffect so handlers can close over fresh
//     props/state (next/prev lesson IDs, current page, etc.) without going
//     stale.
//
// Guard rules (intentionally conservative — ADHD users get frustrated when
// a key they pressed in an input "ate" their text):
//   - Ignore the event if focus is in <input>, <textarea>, or any
//     contentEditable element. The Reviews textarea and any future text
//     inputs MUST keep their natural keystrokes.
//   - Ignore if any modifier (Meta / Ctrl / Alt) is held so we never
//     stomp browser/OS shortcuts (Ctrl+R, Cmd+T, Ctrl+Enter for Run, …).
//   - Only call preventDefault() when we actually have a binding for the
//     pressed key — other keys flow through untouched.
export function useKeyboardShortcuts(map, deps = []) {
  useEffect(() => {
    const handler = (e) => {
      const t = e.target;
      if (
        t &&
        (t.tagName === 'INPUT' ||
          t.tagName === 'TEXTAREA' ||
          t.isContentEditable)
      ) {
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const key = e.key;
      if (map && typeof map[key] === 'function') {
        e.preventDefault();
        map[key](e);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

export default useKeyboardShortcuts;
