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
// On a new SW activation, all previous infralearn-* caches are deleted.
// (ONLY infralearn-* — the bchocyn.github.io origin is shared by every
// project site, so other apps' caches must be left alone.) There's no
// long-tail cache version compatibility — the next visit picks up the
// freshest shell.

// Lifecycle: install does NOT unconditionally call skipWaiting() (that
// hijacked open tabs mid-session). Activation does not self-claim. A new
// SW waits in the 'installed' state until the page explicitly posts
// {type:'SKIP_WAITING'} after the user confirms the update toast.

// Build-time-injected precache manifest. The `precache-manifest` plugin in
// vite.config.js replaces the sentinel below (after the build emits dist/)
// with a JSON array of the hashed JS/CSS/font chunks + beast sprites and
// beasts/manifest.json, as base-relative paths. An empty array keeps the SW
// functional in dev / before substitution.
const PRECACHE_ASSETS = /*__PRECACHE_MANIFEST_START__*/[]/*__PRECACHE_MANIFEST_END__*/;

// Cache version is DERIVED from the precache manifest (short djb2 hash of
// its JSON) instead of hand-bumped. Any deploy that changes the emitted
// asset set therefore gets fresh cache names, so a waiting SW installs into
// ITS OWN caches — it never writes into the caches the live SW is serving
// from — and the activate cleanup below prunes every superseded
// infralearn-* cache (stale hashed chunks included) in one sweep.
// NB: PRECACHE_ASSETS must be defined above — the manifest is injected into
// this file before the SW evaluates, so the hash sees the real array.
function precacheHash(list) {
  const str = JSON.stringify(list);
  let h = 5381;
  for (let i = 0; i < str.length; i += 1) {
    h = ((h << 5) + h + str.charCodeAt(i)) >>> 0; // djb2 (h*33 + c), unsigned 32-bit
  }
  return h.toString(36);
}
const CACHE_VERSION = `infralearn-${precacheHash(PRECACHE_ASSETS)}`;
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const ASSETS_CACHE = `${CACHE_VERSION}-assets`;

// The shell URL the SW falls back to when offline. Computed relative to the
// SW's own scope, which matches the Vite `base` (/InfraLearn/).
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
    // NB: no unconditional self.skipWaiting() here — that hijacked open tabs
    // mid-session, breaking in-progress lessons. The new SW now sits in
    // 'installed' until the page posts {type:'SKIP_WAITING'} (driven by the
    // user-facing "Update available — Reload" toast in main.jsx).
    //
    // Warm the shell cache so the very first offline load works.
    // {cache:'reload'} bypasses the HTTP cache: GitHub Pages serves HTML
    // with max-age=600, so a default-mode fetch during an update could
    // precache a 10-minute-stale shell.
    const cache = await caches.open(SHELL_CACHE);
    try {
      await cache.add(new Request(shellURL(), { cache: 'reload' }));
    } catch (_) { /* offline at install time — ignore */ }
    // Pre-cache offline.html so cold-install offline navigations have something
    // branded to render. Failure here is non-fatal; the navigation handler
    // gracefully degrades to a plain 503 if neither shell nor offline.html
    // are available.
    try {
      await cache.add(new Request(offlineURL(), { cache: 'reload' }));
    } catch (_) { /* same */ }
    // Pre-cache the build-time manifest of hashed assets so a first-time
    // offline navigation to an unvisited route resolves without a chunk-load
    // failure. Each asset is fetched individually because cache.addAll() is
    // atomic — one 404 (e.g. a stale beast PNG path) would abort the whole
    // install. Per-asset try/catch keeps the SW installable even if a few
    // entries miss.
    const assetCache = await caches.open(ASSETS_CACHE);
    await Promise.all(PRECACHE_ASSETS.map(async (path) => {
      try {
        const url = new URL(path, self.registration.scope).href;
        // assets/* are content-hashed, hence immutable: when any existing
        // infralearn-* cache (the outgoing version's, typically) already
        // holds this URL, copy the cached response forward instead of
        // re-downloading the whole bundle on every deploy. Non-hashed
        // entries (beasts/, etc.) always take the {cache:'reload'} network
        // path so updates to them are actually picked up.
        if (path.startsWith('assets/')) {
          const old = await caches.match(url);
          if (old) {
            await assetCache.put(url, old.clone());
            return;
          }
        }
        const res = await fetch(url, { cache: 'reload' });
        if (res && res.ok) await assetCache.put(url, res);
      } catch (_) { /* one bad asset shouldn't break install */ }
    }));
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // Drop caches from older versions of this SW — but ONLY our own
    // infralearn-* caches. The Cache Storage API is per-ORIGIN and
    // bchocyn.github.io hosts every project site, so an unprefixed filter
    // here would delete sibling projects' caches too.
    const keep = new Set([SHELL_CACHE, ASSETS_CACHE]);
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((k) => k.startsWith('infralearn-') && !keep.has(k))
        .map((k) => caches.delete(k))
    );
    // NB: no clients.claim() — the new SW only takes control once existing
    // tabs reload (which the update-toast in main.jsx triggers via the
    // controllerchange handler). This prevents the new SW from intercepting
    // chunk requests for an old, still-rendered app.
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
  // User confirmed the "Update available — Reload" toast. Promote this
  // waiting SW to active; main.jsx's controllerchange listener then
  // triggers exactly one location.reload().
  if (data.type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }
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
        // Only refresh the cached shell when the navigation actually WAS the
        // shell. Every same-origin HTML navigation lands here (offline.html,
        // 404.html, …) and blindly cache.put()ing it under the shell key
        // would poison the offline shell — e.g. one online visit to
        // offline.html and offline users get the offline page forever.
        // And never cache a 4xx/5xx, opaque, or redirected response.
        const isShellNav =
          new URL(req.url).pathname === new URL(shellURL(), self.location).pathname;
        if (isShellNav && fresh && fresh.ok && fresh.type === 'basic') {
          const cache = await caches.open(SHELL_CACHE);
          cache.put(shellURL(), fresh.clone()).catch(() => {});
        }
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
