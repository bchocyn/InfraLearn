import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useStore } from '../store/useStore.js';
import { useFocusTrap } from '../hooks/useFocusTrap.js';

// CoachTour — first-run "how to use the app" tour.
//
// A skippable, replayable spotlight tour that fires once after onboarding, the
// first time the user lands on Home. Each step dims the screen and lights up one
// real element (matched by a `data-tour="…"` attribute) with a one-line caption.
// Re-run anytime via Settings → "How it works" (which calls resetTour()).
//
// Design: ADHD-friendly — ≤5 short stops, one idea each, Skip on every step,
// Next advances, the last step finishes. Steps whose target isn't on the page
// (e.g. "reviews due" before any reviews exist) are filtered out at start so the
// counter and flow stay honest. View-only: the dim blocks stray taps so the
// user can't wander off mid-tour; Next/Skip/Esc are the only exits.
const STEPS = [
  { target: 'streak',      title: 'Streak & XP',     body: 'Top-right tracks your streak. A freeze forgives one missed day.' },
  { target: 'daily',       title: 'Daily Challenge', body: 'Your 60-second daily win — one quick recall question.' },
  { target: 'reviews',     title: 'Reviews',         body: 'We resurface concepts right before you’d forget them.' },
  { target: 'tab-roadmap', title: 'Your path',       body: 'One concept a day. The map tracks your progress.' },
  { target: 'tab-beast',   title: 'Byte Beast',      body: 'Your companion evolves through four forms as you climb.' },
];

const q = (t) => document.querySelector(`[data-tour="${t}"]`);

export default function CoachTour() {
  const onboarded = useStore((s) => s.onboarded);
  const tourSeen = useStore((s) => s.tourSeen);
  const completeTour = useStore((s) => s.completeTour);
  const { pathname } = useLocation();

  const [steps, setSteps] = useState([]);
  const [idx, setIdx] = useState(0);
  const [active, setActive] = useState(false);
  const [rect, setRect] = useState(null);

  // Arm the tour once Home has painted: filter to steps whose target exists.
  useEffect(() => {
    if (!onboarded || tourSeen || pathname !== '/' || active) return undefined;
    const t = setTimeout(() => {
      const avail = STEPS.filter((s) => q(s.target));
      if (avail.length === 0) { completeTour(); return; }
      setSteps(avail);
      setIdx(0);
      setActive(true);
    }, 650);
    return () => clearTimeout(t);
  }, [onboarded, tourSeen, pathname, active, completeTour]);

  const step = active ? steps[idx] : null;

  // Measure the current target; keep it pinned through scroll/resize.
  useLayoutEffect(() => {
    if (!step) return undefined;
    const measure = () => {
      const el = q(step.target);
      if (!el) { setRect(null); return; }
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    };
    const el = q(step.target);
    if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    // Measure after the smooth-scroll settles, then track further changes.
    const t = setTimeout(measure, 220);
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [step]);

  // Esc finishes the tour.
  useEffect(() => {
    if (!active) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') { setActive(false); completeTour(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  // Tab cycles Skip ↔ Next instead of walking the dimmed page behind the
  // overlay (Escape is handled above at the window level).
  const trapRef = useRef(null);
  useFocusTrap(trapRef, { active: active && !!step });

  if (!active || !step) return null;

  const finish = () => { setActive(false); completeTour(); };
  const next = () => { if (idx + 1 < steps.length) setIdx(idx + 1); else finish(); };
  const isLast = idx + 1 >= steps.length;

  // Tooltip placement: below the spot if there's room, else above. Clamp into
  // the viewport so it never clips off-screen on a phone.
  const TIP_W = 268;
  const vw = typeof window !== 'undefined' ? window.innerWidth : 375;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 700;
  let tipStyle;
  if (rect) {
    const below = rect.top + rect.height + 168 < vh;
    const left = Math.max(12, Math.min(rect.left + rect.width / 2 - TIP_W / 2, vw - TIP_W - 12));
    tipStyle = below
      ? { top: rect.top + rect.height + 12, left }
      : { top: Math.max(12, rect.top - 12), left, transform: 'translateY(-100%)' };
  } else {
    tipStyle = { top: '42%', left: '50%', transform: 'translateX(-50%)' };
  }

  return (
    <div ref={trapRef} className={`coach-overlay${rect ? '' : ' coach-overlay-flat'}`} role="dialog" aria-modal="true" aria-label="App tour">
      {rect && (
        <div
          className="coach-spot"
          style={{ top: rect.top - 6, left: rect.left - 6, width: rect.width + 12, height: rect.height + 12 }}
          aria-hidden
        />
      )}
      <div className="coach-tip" style={{ width: TIP_W, ...tipStyle }}>
        <div className="coach-tip-step mono">{idx + 1} / {steps.length}</div>
        <div className="coach-tip-title">{step.title}</div>
        <p className="coach-tip-body">{step.body}</p>
        <div className="coach-tip-actions">
          <button type="button" className="coach-skip" onClick={finish}>
            {isLast ? 'Close' : 'Skip'}
          </button>
          <button type="button" className="coach-next" onClick={next}>
            {isLast ? 'Done ✓' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  );
}
