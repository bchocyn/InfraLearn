import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store/useStore.js';

// InstallPrompt — non-intrusive "📲 Install InfraLearn" nudge.
//
// Why this matters: per the project's ADHD-friendly + engagement principles,
// an icon on the home screen is one tap away — vastly higher daily-open
// likelihood than a browser bookmark. Per Duolingo's data, daily-open rituals
// drive retention; installation is the single biggest UX moment that creates
// that ritual.
//
// Trigger gates (ALL must pass, ANY of the "earned" conditions is enough):
//   a) streak ≥ 3 days, OR
//   b) completed ≥ 3 lessons, OR
//   c) this is the user's 3rd app-open today (tracked in localStorage).
// AND none of:
//   - localStorage 'install-dismissed' is today's date
//   - already running standalone (matchMedia 'display-mode: standalone')
//   - browser hasn't fired beforeinstallprompt (no deferred prompt available).
//
// iOS Safari NEVER fires beforeinstallprompt. We still show the card on iOS
// when the engagement gates pass — with a "Tap Share → Add to Home Screen"
// hint instead of an Install button, because iOS has no programmatic install.
//
// Renders nothing on the server (no `window` access), nothing when gates fail,
// nothing once dismissed today. Safe to mount unconditionally.

const STORAGE_DISMISSED  = 'install-dismissed';   // YYYY-MM-DD of last dismiss
const STORAGE_OPEN_LOG   = 'install-open-log';    // JSON: { date: 'YYYY-MM-DD', count: N }

// ── Module-scope beforeinstallprompt stash ─────────────────────────────────
// Chrome fires `beforeinstallprompt` ONCE per page load — often before any
// React effect runs, and possibly while the user is on Onboarding or a deep
// link where this component isn't mounted at all. Capturing it inside a
// component effect therefore permanently misses it. Capture at module scope
// instead; mounted components subscribe to the stash and read it on mount.
let stashedPrompt = null;
const stashListeners = new Set();
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Stop Chrome's mini-infobar — we'll show our own card instead.
    e.preventDefault();
    stashedPrompt = e;
    stashListeners.forEach((fn) => fn());
  });
}

// Once-per-JS-load latch for the open counter. The component remounts on
// every Home navigation (and StrictMode double-invokes effects in dev), so
// counting per mount would trip the "3rd app-open today" gate in one sitting.
let bumpedThisLoad = false;

function todayKey() {
  const d = new Date();
  // YYYY-MM-DD in local time. Avoid toISOString — that's UTC and would
  // roll the day at the wrong moment for users west of GMT.
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${da}`;
}

function readJSON(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch { /* quota / private mode — silent */ }
}

// Increment "opens today" exactly once per JS load (see bumpedThisLoad above).
// Subsequent calls in the same load just report the current count.
function bumpOpenCount() {
  const today = todayKey();
  const log = readJSON(STORAGE_OPEN_LOG, { date: today, count: 0 });
  if (bumpedThisLoad) {
    return (log && log.date === today) ? log.count : 0;
  }
  bumpedThisLoad = true;
  const next = (log && log.date === today) ? { date: today, count: log.count + 1 } : { date: today, count: 1 };
  writeJSON(STORAGE_OPEN_LOG, next);
  return next.count;
}

function isStandalone() {
  if (typeof window === 'undefined') return false;
  try {
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) return true;
  } catch {}
  // iOS Safari uses a non-standard navigator.standalone bool.
  // eslint-disable-next-line no-undef
  if (typeof navigator !== 'undefined' && navigator.standalone === true) return true;
  return false;
}

function detectIOS() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  // iPad on iPadOS 13+ reports as Mac; the touchpoints check catches it.
  return /iPad|iPhone|iPod/.test(ua) || (ua.includes('Mac') && navigator.maxTouchPoints > 1);
}

export default function InstallPrompt() {
  // Pull just the bits we need from the store. completedCount is a derived
  // value off the `completed` map; reading the whole map and counting locally
  // avoids touching store internals owned by other agents.
  const streak = useStore((s) => s.streak) || 0;
  const completed = useStore((s) => s.completed) || {};
  const completedCount = Object.values(completed).filter(Boolean).length;

  // The browser-fired install event. Held in a ref so the cleanup callback
  // on unmount doesn't leak it, and so re-renders don't drop it.
  const deferredPromptRef = useRef(null);
  const [hasPrompt, setHasPrompt] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [opensToday, setOpensToday] = useState(0);
  const [iosFallback, setIosFallback] = useState(false);

  useEffect(() => {
    // SSR / no-window guard, even though this app is client-only Vite.
    if (typeof window === 'undefined') return undefined;

    // Bump open count once per mount.
    setOpensToday(bumpOpenCount());

    // Already dismissed today? Stay hidden. Wrapped in try/catch — Safari
    // private mode + some privacy modes throw on localStorage access entirely.
    try {
      const dismissedDay = window.localStorage.getItem(STORAGE_DISMISSED);
      if (dismissedDay === todayKey()) setDismissed(true);
    } catch { /* ignore — treat as not-dismissed */ }

    // Already installed? Stay hidden forever (this session).
    if (isStandalone()) setInstalled(true);

    // iOS fallback hint — no beforeinstallprompt available there.
    if (detectIOS() && !isStandalone()) setIosFallback(true);

    // Adopt whatever the module-scope listener already stashed (the event may
    // have fired long before this mount), then subscribe for a later fire.
    const adoptStash = () => {
      if (stashedPrompt) {
        deferredPromptRef.current = stashedPrompt;
        setHasPrompt(true);
      }
    };
    adoptStash();
    stashListeners.add(adoptStash);

    const onInstalled = () => {
      // Fired by Chrome once the user confirms install. Clear state so the
      // card vanishes mid-session.
      stashedPrompt = null;
      deferredPromptRef.current = null;
      setHasPrompt(false);
      setInstalled(true);
    };

    window.addEventListener('appinstalled', onInstalled);
    return () => {
      stashListeners.delete(adoptStash);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  // Engagement gate — any of the three thresholds qualifies.
  const earned = streak >= 3 || completedCount >= 3 || opensToday >= 3;

  // Render nothing unless we have something actionable to show.
  if (installed) return null;
  if (dismissed) return null;
  if (!earned) return null;
  // Need EITHER a real prompt OR the iOS hint — otherwise there's no action
  // the user can actually take from the card.
  if (!hasPrompt && !iosFallback) return null;

  const dismissForToday = () => {
    try {
      window.localStorage.setItem(STORAGE_DISMISSED, todayKey());
    } catch {}
    setDismissed(true);
  };

  const install = async () => {
    const evt = deferredPromptRef.current;
    if (!evt) return;
    try {
      await evt.prompt();
      // userChoice resolves with { outcome: 'accepted' | 'dismissed' }.
      const choice = await evt.userChoice;
      // The event is single-use — drop it from the module stash too so a
      // remount can't re-adopt a consumed prompt.
      if (stashedPrompt === evt) stashedPrompt = null;
      deferredPromptRef.current = null;
      setHasPrompt(false);
      if (choice && choice.outcome === 'dismissed') {
        dismissForToday();
      }
      // 'accepted' lets the 'appinstalled' listener flip the installed flag.
    } catch {
      // Prompt can throw if it was already used; just dismiss for today.
      if (stashedPrompt === evt) stashedPrompt = null;
      deferredPromptRef.current = null;
      setHasPrompt(false);
      dismissForToday();
    }
  };

  return (
    <div
      className="card fade-in"
      role="region"
      aria-label="Install InfraLearn"
      style={{
        borderColor: 'rgba(245,184,66,.3)',
        background: 'linear-gradient(90deg, rgba(245,184,66,.08), transparent)',
        marginTop: 12,
      }}
    >
      <div className="row" style={{ alignItems: 'flex-start', gap: 10 }}>
        <span aria-hidden style={{ fontSize: 22, lineHeight: 1 }}>📲</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="kicker" style={{ marginBottom: 4 }}>INSTALL · 1-TAP ACCESS</div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 15, fontWeight: 600, lineHeight: 1.3 }}>
            Install InfraLearn for 1-tap access.
          </div>
          <div className="caption" style={{ fontSize: 12, marginTop: 4 }}>
            {iosFallback
              ? 'Tap the Share icon, then "Add to Home Screen" — no app store needed.'
              : 'No app store needed. Works offline. Lives on your home screen.'}
          </div>
        </div>
      </div>
      <div className="row" style={{ gap: 8, marginTop: 12 }}>
        {hasPrompt && (
          <button
            type="button"
            className="btn btn-primary"
            style={{ flex: 1 }}
            onClick={install}
          >
            Install →
          </button>
        )}
        <button
          type="button"
          className="btn"
          style={{ flex: hasPrompt ? 0 : 1 }}
          onClick={dismissForToday}
        >
          {hasPrompt ? 'Maybe later' : 'Got it'}
        </button>
      </div>
    </div>
  );
}
