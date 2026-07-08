import { useEffect } from 'react';

// useFocusTrap — the missing half of aria-modal.
//
// Every overlay in the app sets aria-modal="true", which TELLS assistive
// tech the page behind is inert — but without a trap, Tab happily walks
// into that "inert" background while a screen reader insists it isn't
// there. This hook closes the gap:
//   - on mount: remembers the trigger element, moves focus to the first
//     focusable inside the container (or the container itself)
//   - Tab / Shift+Tab wrap at the container's edges
//   - Escape calls onClose (when given)
//   - on unmount: focus returns to whatever opened the dialog
//
// Usage: const ref = useRef(null); useFocusTrap(ref, { onClose });
//        <div ref={ref} role="dialog" aria-modal="true">…</div>

const FOCUSABLE = [
  'a[href]', 'button:not([disabled])', 'input:not([disabled])',
  'select:not([disabled])', 'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export function useFocusTrap(ref, { onClose, active = true } = {}) {
  useEffect(() => {
    if (!active) return undefined;
    const node = ref.current;
    if (!node) return undefined;
    const returnTo = document.activeElement;

    // Initial focus: first focusable child, else the container itself.
    const focusables = () => [...node.querySelectorAll(FOCUSABLE)]
      .filter((el) => el.offsetParent !== null || el === document.activeElement);
    const first = focusables()[0];
    if (first) first.focus();
    else { node.tabIndex = -1; node.focus(); }

    const onKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      // Nested dialogs (TrophyDetail inside Trophies): the innermost trap
      // handles the Tab; stop it from bubbling to an outer trap that would
      // re-wrap focus to ITS edges.
      e.stopPropagation();
      const items = focusables();
      if (items.length === 0) { e.preventDefault(); return; }
      const firstEl = items[0];
      const lastEl = items[items.length - 1];
      // Wrap at the edges; also catch focus that escaped the container.
      if (e.shiftKey && (document.activeElement === firstEl || !node.contains(document.activeElement))) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && (document.activeElement === lastEl || !node.contains(document.activeElement))) {
        e.preventDefault();
        firstEl.focus();
      }
    };

    node.addEventListener('keydown', onKeyDown);
    return () => {
      node.removeEventListener('keydown', onKeyDown);
      // Restore focus to the opener — losing your place after closing a
      // dialog is the keyboard-user equivalent of a scroll reset.
      if (returnTo && typeof returnTo.focus === 'function' && document.contains(returnTo)) {
        returnTo.focus();
      }
    };
  }, [ref, onClose, active]);
}

export default useFocusTrap;
