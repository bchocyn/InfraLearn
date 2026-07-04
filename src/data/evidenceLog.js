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

// Append one review-evidence event. Fire-and-forget.
export function logReviewEvent(conceptId, grade, elapsedDays) {
  openDb().then((db) => {
    const tx = db.transaction('events', 'readwrite');
    tx.objectStore('events').add({
      t: Date.now(),
      c: String(conceptId),
      g: grade,
      e: Number.isFinite(elapsedDays) ? elapsedDays : null,
    });
  }).catch(() => {});
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
// { streak, lastActivityDate, dueCount, updatedAt }.
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
