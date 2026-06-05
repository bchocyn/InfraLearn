// InfraLearn service worker.
//
// Strategy:
//   - HTML navigation requests → network-first, fall back to cached shell
//     when offline. This way an update to index.html is picked up on every
//     refresh as long as the user is online; offline they still get the app.
//   - When the shell ISN'T cached (cold-install offline navigation), fall
//     back to offline.html — a self-contained branded page that lists any
//     lesson URLs already in cache and a "Try again" button.
//   - Hashed assets (/assets/*) → cache-first, immutable. Vite hashes the
//     filename so the cache key is the content fingerprint.
//   - Beast PNGs / icons / fonts / manifest → cache-first.
//   - Pyodide CDN (cdn.jsdelivr.net) → bypass; jsdelivr already cdn-caches
//     and the WASM is large; better to let the browser HTTP cache handle it.
//   - Anything else cross-origin → bypass.
//
// On a new SW activation, all previous caches are deleted. There's no
// long-tail cache version compatibility — the next visit picks up the
// freshest shell.

// Bumped to v2 because the install step now also pre-caches offline.html
// and the runtime contract gained a message handler. The activate-step
// cleanup drops every v1-* cache on first activation.
const CACHE_VERSION = 'infralearn-v2';
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const ASSETS_CACHE = `${CACHE_VERSION}-assets`;

// The shell URL the SW falls back to when offline. Computed relative to the
// SW's own scope, which matches the Vite `base` (e.g. /MLOps-Fundaments-learning-page/).
function shellURL() {
  return new URL('./', self.registration.scope).href;
}

// Branded offline-fallback URL, served when the network is down AND the
// app shell isn't cached (cold-install offline visit).
function offlineURL() {
  return new URL('offline.html', self.registration.scope).href;
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    // Skip waiting so a freshly-installed SW takes over without a manual reload.
    self.skipWaiting();
    // Warm the shell cache so the very first offline load works.
    const cache = await caches.open(SHELL_CACHE);
    try {
      await cache.add(shellURL());
    } catch (_) { /* offline at install time — ignore */ }
    // Pre-cache offline.html so cold-install offline navigations have something
    // branded to render. Failure here is non-fatal; the navigation handler
    // gracefully degrades to a plain 503 if neither shell nor offline.html
    // are available.
    try {
      await cache.add(offlineURL());
    } catch (_) { /* same */ }
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // Drop caches from older versions of this SW.
    const keep = new Set([SHELL_CACHE, ASSETS_CACHE]);
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => !keep.has(k)).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

// ── Message handler: list-cached-lessons ─────────────────────────────────
// offline.html asks the SW for any lesson pages it has cached so it can
// render a "you've still got these" list. Pages use HashRouter so every
// lesson lives under the SAME URL (the index.html shell) — there's no
// per-lesson HTTP request to cache. Instead we surface a hard-coded set of
// representative starting points so the user has at least one tap target
// back into the app. The shell handles the rest client-side.
self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type !== 'list-cached-lessons') return;
  const port = event.ports && event.ports[0];
  if (!port) return;
  (async () => {
    try {
      const base = new URL('./', self.registration.scope).href;
      const shellCache = await caches.open(SHELL_CACHE);
      const hasShell = !!(await shellCache.match(shellURL()));
      // Even without per-lesson caching we can offer the active path's
      // entry point as long as the shell is cached — HashRouter routes
      // client-side from there. If the shell isn't cached either, return
      // an empty list and let offline.html render its empty state.
      const lessons = hasShell
        ? [
            { id: 'HOME',     title: 'Home — pick up where you left off', url: base + '#/' },
            { id: 'ROADMAP',  title: 'Roadmap — see your progress',       url: base + '#/roadmap' },
            { id: 'LIBRARY',  title: 'Library — browse every lesson',     url: base + '#/library' },
            { id: 'REVIEWS',  title: 'Reviews — spaced-repetition queue', url: base + '#/reviews' },
          ]
        : [];
      port.postMessage({ lessons });
    } catch (_) {
      port.postMessage({ lessons: [] });
    }
  })();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;             // only GET is cacheable

  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;

  // Don't touch cross-origin requests — Pyodide CDN, fonts CDN, etc.
  if (!sameOrigin) return;

  // HTML navigations: network-first with cache fallback.
  const isHTML = req.mode === 'navigate'
    || (req.headers.get('accept') || '').includes('text/html');
  if (isHTML) {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(SHELL_CACHE);
        cache.put(shellURL(), fresh.clone()).catch(() => {});
        return fresh;
      } catch (_) {
        // 1. Try the cached app shell — keeps HashRouter alive offline.
        const cachedShell = await caches.match(shellURL());
        if (cachedShell) return cachedShell;
        // 2. Fall back to the branded offline page.
        const cachedOffline = await caches.match(offlineURL());
        if (cachedOffline) return cachedOffline;
        // 3. Worst case: a tiny plain response so the browser doesn't show
        //    the default Chrome dinosaur in a weird half-app state.
        return new Response('Offline.', { status: 503, statusText: 'Offline' });
      }
    })());
    return;
  }

  // Static assets: cache-first.
  event.respondWith((async () => {
    const cache = await caches.open(ASSETS_CACHE);
    const cached = await cache.match(req);
    if (cached) return cached;
    try {
      const fresh = await fetch(req);
      // Cache successful, basic-type responses only (avoid opaque cross-origin).
      if (fresh && fresh.ok && fresh.type === 'basic') {
        cache.put(req, fresh.clone()).catch(() => {});
      }
      return fresh;
    } catch (_) {
      return new Response('Asset unavailable offline.', { status: 503 });
    }
  })());
});
