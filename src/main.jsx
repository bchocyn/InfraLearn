import React, { useEffect, useRef, useState, lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, Routes, Route, useNavigate } from 'react-router-dom';
// Self-hosted fonts (bundled into the build — no third-party requests).
import '@fontsource-variable/fraunces';
import '@fontsource-variable/inter-tight';
import '@fontsource-variable/jetbrains-mono';
import './styles/theme.css';
import TabBar from './components/TabBar.jsx';
// Home is the landing page — keep it eager so first paint is instant. Roadmap
// is one tap away from Home and the most common second-screen; keeping it
// eager too avoids a flash on the very first navigation. Everything else is
// lazy-split below so the initial bundle drops well under the route-explosion
// CodeMirror pushed us into.
import Home from './screens/Home.jsx';
import Roadmap from './screens/Roadmap.jsx';
// ACCENT_PRESETS + BG_THEMES live inside Settings.jsx and we need them
// SYNCHRONOUSLY on first render (the theme effects run before any route
// renders). Pull them out of a side-import so the Settings *component* can
// still lazy-load while the theme tables stay eager.
import { ACCENT_PRESETS, BG_THEMES } from './screens/settingsThemes.js';
import Onboarding from './screens/Onboarding.jsx';
import EvolutionNotice from './components/EvolutionNotice.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import KeyboardHelp from './components/KeyboardHelp.jsx';
import { useStore } from './store/useStore.js';

// ─── Lazy routes ─────────────────────────────────────────────────────────
// Each of these becomes its own JS chunk, fetched only when the user
// actually navigates there. The biggest wins are Lesson (drags in all 8
// lesson-content path files) and Sandbox (drags in the CodeMirror lang
// plugins via its editors).
const Lesson           = lazy(() => import('./screens/Lesson.jsx'));
const Library          = lazy(() => import('./screens/Library.jsx'));
const ByteBeast        = lazy(() => import('./screens/ByteBeast.jsx'));
const Settings         = lazy(() => import('./screens/Settings.jsx'));
const Sandbox          = lazy(() => import('./screens/Sandbox.jsx'));
const Reviews          = lazy(() => import('./screens/Reviews.jsx'));
const ReviewWeakSpots  = lazy(() => import('./screens/ReviewWeakSpots.jsx'));

// Suspense fallback — deliberately NOT a spinner. A serif "Loading…" in the
// app's own font fades in after a short delay so we don't strobe on fast
// chunks. Mobile-first; the wrapper takes the same screen padding as a real
// screen so layout doesn't jump when the lazy component lands.
function RouteFallback() {
  return (
    <div className="app-suspense" role="status" aria-live="polite">
      <span className="app-suspense-text">Loading…</span>
    </div>
  );
}

// Global keyboard shortcuts — chord nav (g→h, g→r, g→l, g→s) + '?' help
// toggle. Lives inside the router so useNavigate works; mounted by App.
//
// Chord state is held in a ref (not React state) so a fast double-key doesn't
// race against a re-render. When the user presses 'g' we arm the chord and
// set a 1500 ms timeout to disarm; the next non-modifier key either resolves
// the chord (and is consumed) or is treated as a regular key.
//
// Same guard rules as useKeyboardShortcuts: ignore when focus is in a text
// field, ignore when any modifier is held (so Cmd/Ctrl + L still focuses the
// browser URL bar, etc.).
function useGlobalShortcuts(onToggleHelp) {
  const nav = useNavigate();
  const chordRef = useRef({ pending: null, timer: null });

  useEffect(() => {
    const clearChord = () => {
      if (chordRef.current.timer) {
        clearTimeout(chordRef.current.timer);
      }
      chordRef.current = { pending: null, timer: null };
    };

    const onKey = (e) => {
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
      const k = e.key;

      // '?' toggles the help overlay from anywhere. (Shift is allowed — '?'
      // is a shifted '/' on US layouts, and the metaKey/ctrlKey/altKey guard
      // above explicitly does NOT include shiftKey.)
      if (k === '?') {
        e.preventDefault();
        clearChord();
        onToggleHelp();
        return;
      }

      // Resolve a pending chord on the SECOND keystroke.
      if (chordRef.current.pending === 'g') {
        const dest = {
          h: '/',
          r: '/roadmap',
          l: '/library',
          s: '/sandbox',
        }[k];
        clearChord();
        if (dest) {
          e.preventDefault();
          nav(dest);
        }
        return;
      }

      // Arm a new chord on 'g'. The 1500 ms window matches Vim/Gmail-style
      // chord muscle memory without leaving the user trapped in a "what was
      // I doing" state.
      if (k === 'g') {
        e.preventDefault();
        chordRef.current.pending = 'g';
        chordRef.current.timer = setTimeout(() => {
          chordRef.current = { pending: null, timer: null };
        }, 1500);
      }
    };

    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      if (chordRef.current.timer) clearTimeout(chordRef.current.timer);
    };
  }, [nav, onToggleHelp]);
}

function App() {
  const onboarded = useStore((s) => s.onboarded);
  const accent = useStore((s) => s.settings.accent) || 'amber';
  const background = useStore((s) => s.settings.background) || 'amber';
  const deviceMode = useStore((s) => s.settings.deviceMode); // null until first-run device gate is answered
  const shellClass = `app-shell app-shell-${deviceMode || 'mobile'}`;

  // Global keyboard-help overlay state. The '?' toggle and chord nav are
  // wired in useGlobalShortcuts; the overlay component itself listens for
  // Escape internally.
  const [helpOpen, setHelpOpen] = useState(false);
  useGlobalShortcuts(() => setHelpOpen((v) => !v));

  // Reading-mode themes (sepia/paper/nord/etc) bake their own accent into
  // the palette, so the user-picked accent shouldn't override it. We let
  // the bg theme win when it specifies one; otherwise the accent preset
  // drives --accent-amber as before.
  const bgTheme = BG_THEMES[background] || BG_THEMES.amber;

  useEffect(() => {
    const preset = ACCENT_PRESETS[accent] || ACCENT_PRESETS.amber;
    const r = document.documentElement.style;
    const color = bgTheme.accent || preset.color;
    const dim   = bgTheme.accentDim || preset.dim;
    r.setProperty('--accent-amber', color);
    r.setProperty('--accent-amber-dim', dim);
    // Keep the soft tinted background tied to the chosen accent.
    r.setProperty('--accent-amber-bg', `${color}14`); // ~8% alpha
  }, [accent, bgTheme]);

  useEffect(() => {
    const t = bgTheme;
    const r = document.documentElement.style;
    r.setProperty('--bg-base',       t.base);
    r.setProperty('--bg-elevated',   t.elev);
    r.setProperty('--bg-card',       t.card);
    r.setProperty('--bg-card-hover', t.cardHover);
    r.setProperty('--border-subtle', t.subtle);
    r.setProperty('--border-default', t.border);
    r.setProperty('--border-strong', t.strong);
    // Optional text overrides. removeProperty when absent so the theme.css
    // :root default takes over again (e.g. switching Light → Amber must
    // restore the cream-on-charcoal text).
    const setOrClear = (name, value) => {
      if (value) r.setProperty(name, value);
      else r.removeProperty(name);
    };
    setOrClear('--text-primary',    t.textPrimary);
    setOrClear('--text-secondary',  t.textSecondary);
    setOrClear('--text-tertiary',   t.textTertiary);
    setOrClear('--text-quaternary', t.textQuaternary);
  }, [bgTheme]);

  if (!onboarded) return (
    <div className={shellClass}>
      <Onboarding />
      <EvolutionNotice />
      <KeyboardHelp open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
  return (
    <div className={shellClass}>
      <TabBar />
      <main className="app-main">
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/roadmap" element={<Roadmap />} />
            <Route path="/library" element={<Library />} />
            <Route path="/beast" element={<ByteBeast />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/lesson/:id" element={<Lesson />} />
            <Route path="/weak-spots" element={<ReviewWeakSpots />} />
            <Route path="/reviews" element={<Reviews />} />
            <Route path="/sandbox" element={<Sandbox />} />
          </Routes>
        </Suspense>
      </main>
      <EvolutionNotice />
      <KeyboardHelp open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}

// Service worker registration — production builds only. Dev builds skip
// registration so Vite's HMR isn't fighting a cached shell on every save.
// The SW lives at <base>/sw.js (Vite copies public/sw.js to dist root).
//
// Update flow: the SW no longer self-skipWaiting()s, so when a new version
// is deployed it sits in 'installed' until the user confirms via the
// non-blocking "Update available — Reload" toast below. controllerchange
// fires once SKIP_WAITING promotes the new SW; we reload exactly once.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    const swUrl = new URL('sw.js', import.meta.env.BASE_URL).href;

    // Show a single non-blocking toast prompting the user to reload. The
    // toast is a plain DOM node (no React state, no re-render churn) so it
    // works even if a render-time bug took down the app tree.
    const showUpdateToast = (waitingWorker) => {
      if (document.getElementById('infralearn-sw-update-toast')) return;
      const toast = document.createElement('div');
      toast.id = 'infralearn-sw-update-toast';
      toast.className = 'sw-update-toast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      toast.innerHTML =
        '<span class="sw-update-toast-text">Update available</span>' +
        '<button type="button" class="sw-update-toast-btn">Reload</button>' +
        '<button type="button" class="sw-update-toast-dismiss" aria-label="Dismiss">×</button>';
      const reloadBtn = toast.querySelector('.sw-update-toast-btn');
      const dismissBtn = toast.querySelector('.sw-update-toast-dismiss');
      reloadBtn.addEventListener('click', () => {
        // Ask the waiting SW to take over. controllerchange (registered
        // once below) then reloads the page.
        try { waitingWorker.postMessage({ type: 'SKIP_WAITING' }); }
        catch (_) { window.location.reload(); }
      });
      dismissBtn.addEventListener('click', () => {
        toast.remove();
      });
      document.body.appendChild(toast);
    };

    // Reload exactly once when the new SW takes control. The refreshing
    // guard prevents the well-known Chrome double-reload bug.
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });

    navigator.serviceWorker.register(swUrl).then((registration) => {
      // If a worker is already waiting at registration time (user dismissed
      // an earlier toast then revisited), re-surface the prompt.
      if (registration.waiting && navigator.serviceWorker.controller) {
        showUpdateToast(registration.waiting);
      }
      registration.addEventListener('updatefound', () => {
        const installing = registration.installing;
        if (!installing) return;
        installing.addEventListener('statechange', () => {
          // 'installed' + an existing controller means this is an UPDATE,
          // not the first install. (First install: no controller yet, so
          // we let it activate silently.)
          if (
            installing.state === 'installed' &&
            navigator.serviceWorker.controller
          ) {
            showUpdateToast(installing);
          }
        });
      });
    }).catch((err) => {
      // eslint-disable-next-line no-console
      console.warn('[InfraLearn] SW registration failed:', err);
    });
  });
}

// HashRouter avoids GitHub Pages deep-link 404s entirely (belt-and-suspenders with 404.html).
// ErrorBoundary wraps everything so a render-time bug shows a readable card +
// "clear stored state" escape hatch instead of an empty black/white screen.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <HashRouter>
        <App />
      </HashRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
