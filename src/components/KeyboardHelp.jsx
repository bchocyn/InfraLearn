import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

// KeyboardHelp — global shortcut cheat-sheet overlay.
//
// Mounted once from main.jsx; visibility is owned by `open`/`onClose` props
// driven by the global '?' chord handler. We do NOT bind '?' here — the
// global handler in main.jsx does, so the same key reliably opens the
// overlay from any screen (including ones that don't have their own
// useKeyboardShortcuts call).
//
// Sections are derived from the current route via useLocation so the visible
// shortcuts always match what's actually wired. Global chords (g h / g r /
// …) are always shown so the user knows nav is one keystroke away.
//
// Dismissal: Escape (caught here so it works regardless of focus target) or
// click on the dim backdrop. The card itself swallows clicks.
function Kbd({ children }) {
  return <kbd className="kbd-key">{children}</kbd>;
}

function Row({ keys, label }) {
  return (
    <div className="kbd-row">
      <span className="kbd-row-label">{label}</span>
      <span className="kbd-row-keys">
        {keys.map((k, i) => (
          <span key={i} className="kbd-row-key-slot">
            {i > 0 && <span className="kbd-row-sep">then</span>}
            <Kbd>{k}</Kbd>
          </span>
        ))}
      </span>
    </div>
  );
}

function Section({ title, rows }) {
  if (!rows || rows.length === 0) return null;
  return (
    <div className="kbd-section">
      <div className="kbd-section-title mono">{title}</div>
      {rows.map((r, i) => (
        <Row key={i} keys={r.keys} label={r.label} />
      ))}
    </div>
  );
}

const GLOBAL_ROWS = [
  { keys: ['g', 'h'], label: 'Go home' },
  { keys: ['g', 'r'], label: 'Go to roadmap' },
  { keys: ['g', 'l'], label: 'Go to library' },
  { keys: ['g', 's'], label: 'Go to sandbox' },
  { keys: ['?'],      label: 'Toggle this help' },
];

const LESSON_ROWS = [
  { keys: ['→'], label: 'Next page / lesson' },
  { keys: ['l'], label: 'Next page / lesson' },
  { keys: ['←'], label: 'Previous page / lesson' },
  { keys: ['h'], label: 'Previous page / lesson' },
  { keys: ['m'], label: 'Mark lesson complete' },
];

const SANDBOX_ROWS = [
  { keys: ['1'], label: 'Python tab' },
  { keys: ['2'], label: 'Bash tab' },
  { keys: ['3'], label: 'YAML tab' },
  { keys: ['4'], label: 'SQL tab' },
  { keys: ['5'], label: 'Dockerfile tab' },
  { keys: ['6'], label: 'JSON tab' },
];

const REVIEWS_ROWS = [
  { keys: ['Enter'], label: 'Reveal answer' },
  { keys: ['Space'], label: 'Reveal answer' },
  { keys: ['1'], label: 'Grade: Miss' },
  { keys: ['2'], label: 'Grade: Hard' },
  { keys: ['3'], label: 'Grade: Good' },
  { keys: ['4'], label: 'Grade: Easy' },
];

function contextualSection(pathname) {
  if (pathname.startsWith('/lesson/')) {
    return { title: 'LESSON', rows: LESSON_ROWS };
  }
  if (pathname.startsWith('/sandbox')) {
    return { title: 'SANDBOX', rows: SANDBOX_ROWS };
  }
  if (pathname.startsWith('/reviews')) {
    return { title: 'REVIEWS', rows: REVIEWS_ROWS };
  }
  return null;
}

export default function KeyboardHelp({ open, onClose }) {
  const cardRef = useRef(null);
  const loc = useLocation();

  // Escape-to-close lives on document so it fires even if focus is on the
  // body (which it usually is — the chord handler doesn't move focus).
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const ctx = contextualSection(loc.pathname);

  const onBackdrop = (e) => {
    // Only close if the click was on the backdrop itself, not bubbled from
    // inside the card.
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="kbd-help-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
      onClick={onBackdrop}
    >
      <div className="kbd-help-card" ref={cardRef}>
        <div className="kbd-help-head">
          <div className="kbd-help-title">Keyboard shortcuts</div>
          <button
            type="button"
            className="kbd-help-close"
            aria-label="Close shortcuts help"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className="kbd-help-body">
          {ctx && <Section title={ctx.title} rows={ctx.rows} />}
          <Section title="GLOBAL" rows={GLOBAL_ROWS} />
        </div>
        <div className="kbd-help-foot mono">
          Esc to close · shortcuts ignored while typing
        </div>
      </div>
    </div>
  );
}
