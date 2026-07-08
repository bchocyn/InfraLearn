// Evidence log — the app's long-term memory about ITSELF.
//
// The product's thesis is long-term retention, but localStorage state is
// deliberately bounded (dailyStats 14d, xpHistory 20), so the thesis was
// unfalsifiable even for one user. This module is the fix: an append-only
// event log in IndexedDB (own quota bucket, ~GBs, survives localStorage
// pressure) recording every graded review as {t, c, g, e}:
//   t = epoch ms · c = conceptId · g = grade 1-4 · e = elapsed days since
//   the card was last seen (the gap the recall actually survived).
// From this, ProgressPanel draws a personal forgetting curve: recall
// accuracy as a function of gap length. No network, no telemetry — the
// data never leaves the device unless the user exports it.
//
// The same DB carries a tiny `kv` store used as the service-worker bridge
// (the SW can't read localStorage; it CAN open this DB to compose the
// daily-reminder notification).
//
// Every call is fire-and-forget and swallows failures: private modes and
// jsdom (tests) lack IndexedDB, and evidence collection must never break
// the learning loop it observes.

const DB_NAME = 'infralearn-evidence';
const DB_VERSION = 1;

let dbPromise = null;
function openDb() {
  if (typeof indexedDB === 'undefined') return Promise.reject(new Error('no idb'));
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('events')) {
          db.createObjectStore('events', { autoIncrement: true });
        }
        if (!db.objectStoreNames.contains('kv')) {
          db.createObjectStore('kv');
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => { dbPromise = null; reject(req.error); };
    });
  }
  return dbPromise;
}

// Hard cap on stored events. A heavy user writes ~10-20k/year; without a cap
// the log grows monotonically forever and every curve read getAll()s it into
// memory. Trimming the OLDEST past the cap keeps recent evidence intact —
// the curve is about current retention, not archaeology.
const EVENTS_CAP = 20000;

// Append one review-evidence event. Fire-and-forget. Occasionally trims the
// oldest events past EVENTS_CAP (count() is cheap; the cursor-delete only
// runs when actually over).
export function logReviewEvent(conceptId, grade, elapsedDays) {
  openDb().then((db) => {
    const tx = db.transaction('events', 'readwrite');
    const store = tx.objectStore('events');
    store.add({
      t: Date.now(),
      c: String(conceptId),
      g: grade,
      e: Number.isFinite(elapsedDays) ? elapsedDays : null,
    });
    const countReq = store.count();
    countReq.onsuccess = () => {
      let excess = countReq.result - EVENTS_CAP;
      if (excess <= 0) return;
      const cursorReq = store.openCursor(); // ascending key order = oldest first
      cursorReq.onsuccess = () => {
        const cursor = cursorReq.result;
        if (!cursor || excess <= 0) return;
        cursor.delete();
        excess -= 1;
        cursor.continue();
      };
    };
  }).catch(() => {});
}

// Wipe everything this module owns — the events log AND the whole kv store
// (notify-state + the localStorage mirror). Called by resetAll (and the
// ErrorBoundary nuke): "Reset all progress — cannot be undone" must not
// leave a pre-reset forgetting curve rendering, a stale streak in the
// reminder, or a mirror that would resurrect the wiped store on next boot.
// Resolves true on success.
export function clearEvidence() {
  return openDb().then((db) => new Promise((resolve) => {
    const tx = db.transaction(['events', 'kv'], 'readwrite');
    tx.objectStore('events').clear();
    tx.objectStore('kv').clear();
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => resolve(false);
  })).catch(() => false);
}

// ── localStorage mirror (iOS eviction survival) ─────────────────────────────
// Safari evicts a PWA's localStorage after ~7 days unused — i.e. the lapsed
// user the entire streak/forgiveness/comeback machinery exists to win back
// returns to a blank slate. IndexedDB lives in a different (less aggressively
// evicted) bucket, so every persist flush mirrors the raw store blob here;
// boot recovery (main.jsx) restores it when BOTH localStorage copies are gone.
export function mirrorStore(value) {
  if (typeof value !== 'string' || value.length === 0) return;
  openDb().then((db) => {
    const tx = db.transaction('kv', 'readwrite');
    tx.objectStore('kv').put(value, 'store-mirror');
  }).catch(() => {});
}

export function readStoreMirror() {
  return openDb().then((db) => new Promise((resolve) => {
    const tx = db.transaction('kv', 'readonly');
    const req = tx.objectStore('kv').get('store-mirror');
    req.onsuccess = () => resolve(typeof req.result === 'string' ? req.result : null);
    req.onerror = () => resolve(null);
  })).catch(() => null);
}

// Restore events from a backup file (Settings → Import). Validates each
// record's shape and skips exact duplicates of events already in the log,
// so merging your own backup back in can't double the curve's sample sizes.
// Resolves the number of events written.
export function importReviewEvents(events) {
  if (!Array.isArray(events) || events.length === 0) return Promise.resolve(0);
  const clean = events
    .filter((ev) => ev && typeof ev === 'object'
      && Number.isFinite(ev.t)
      && typeof ev.c === 'string' && ev.c.length > 0 && ev.c.length <= 120
      && Number.isInteger(ev.g) && ev.g >= 1 && ev.g <= 4
      && (ev.e === null || Number.isFinite(ev.e)))
    .slice(0, EVENTS_CAP);
  if (clean.length === 0) return Promise.resolve(0);
  return readReviewEvents().then((existing) => {
    const seen = new Set(existing.map((ev) => `${ev.t}:${ev.c}:${ev.g}`));
    const fresh = clean.filter((ev) => !seen.has(`${ev.t}:${ev.c}:${ev.g}`));
    if (fresh.length === 0) return 0;
    return openDb().then((db) => new Promise((resolve) => {
      const tx = db.transaction('events', 'readwrite');
      const store = tx.objectStore('events');
      for (const ev of fresh) {
        store.add({ t: ev.t, c: ev.c, g: ev.g, e: Number.isFinite(ev.e) ? ev.e : null });
      }
      tx.oncomplete = () => resolve(fresh.length);
      tx.onerror = () => resolve(0);
    }));
  }).catch(() => 0);
}

// Read the full event log (newest last). Resolves [] on any failure.
export function readReviewEvents() {
  return openDb().then((db) => new Promise((resolve) => {
    const tx = db.transaction('events', 'readonly');
    const req = tx.objectStore('events').getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => resolve([]);
  })).catch(() => []);
}

// ── Service-worker bridge ───────────────────────────────────────────────────
// A single small record the SW reads to compose the daily reminder:
// { streak, lastActivityDate, dueCount, dueDates, updatedAt }.
// `dueDates` is the SCHEDULE (sorted 'YYYY-MM-DD' dueAt stamps), not just a
// snapshot count: the reminder fires exclusively on days the app was NOT
// opened, which is exactly when a count frozen at last-open under-reports.
// The SW counts dueDates <= today at fire time instead.
export function setNotifyState(state) {
  openDb().then((db) => {
    const tx = db.transaction('kv', 'readwrite');
    tx.objectStore('kv').put({ ...state, updatedAt: Date.now() }, 'notify-state');
  }).catch(() => {});
}

export function getNotifyState() {
  return openDb().then((db) => new Promise((resolve) => {
    const tx = db.transaction('kv', 'readonly');
    const req = tx.objectStore('kv').get('notify-state');
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => resolve(null);
  })).catch(() => null);
}

// Bucket the log into a forgetting curve: for each gap band, the share of
// recalls that succeeded (grade >= 3). Pure — exported for tests.
export const CURVE_BANDS = [
  { label: '1d', min: 0, max: 1 },
  { label: '2-3d', min: 2, max: 3 },
  { label: '4-7d', min: 4, max: 7 },
  { label: '8-14d', min: 8, max: 14 },
  { label: '15-30d', min: 15, max: 30 },
  { label: '31d+', min: 31, max: Infinity },
];

export function retentionCurve(events) {
  return CURVE_BANDS.map((band) => {
    const inBand = events.filter((ev) => Number.isFinite(ev.e) && ev.e >= band.min && ev.e <= band.max);
    const total = inBand.length;
    const held = inBand.filter((ev) => ev.g >= 3).length;
    return { ...band, total, pct: total ? held / total : null };
  });
}
