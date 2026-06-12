// Provider-agnostic cloud sync API — the only cloud surface the UI talks to.
// This module is safe to import eagerly from anywhere: it contains zero
// firebase code. The adapter (and the whole firebase SDK with it) loads only
// when getCloud() runs, via a dynamic import that vite splits into its own
// lazy chunk. With CLOUD_CONFIG left null the chunk is never requested and
// the app behaves exactly like the fully-local build it always was.

import { CLOUD_CONFIG } from './cloudConfig.js';

// localStorage keys (exported so the Settings card and this module agree).
// ENABLED_KEY is set the first time a user signs in; its presence is what
// allows the Settings card to auto-subscribe to auth on later visits.
// Without it, no firebase code loads until the user clicks "Sign in".
export const LAST_SYNC_KEY = 'infralearn-cloud-last-sync';
export const ENABLED_KEY = 'infralearn-cloud-enabled';

export function isCloudConfigured() {
  return CLOUD_CONFIG != null;
}

// Module-level promise cache: the adapter chunk is imported and initialized
// at most once per page load. A failed load (e.g. the chunk request raced a
// flaky connection) clears the cache so a later attempt can retry instead of
// replaying the same rejected promise forever.
let adapterPromise = null;

export function getCloud() {
  if (!isCloudConfigured()) {
    return Promise.reject(new Error(
      'Cloud sync is not configured in this build. The app is fully local — see docs/SETUP-CLOUD.md to enable it.',
    ));
  }
  if (!adapterPromise) {
    adapterPromise = import('./firebaseAdapter.js')
      .then((mod) => {
        mod.init(CLOUD_CONFIG);
        return mod;
      })
      .catch((e) => {
        adapterPromise = null;
        throw e;
      });
  }
  return adapterPromise;
}

// One full sync pass: pull the remote snapshot (if any), MERGE it into local
// state, then push the merged result back up.
//
// Invariant — merge-then-push: local is the source of truth and the cloud is
// a backup, so we never blind-overwrite in either direction. importData's
// 'merge' mode is field-wise and monotonic (completed/badges union, max of
// xp/streak/tiers), which makes a sync pass idempotent — running it twice in
// a row changes nothing — and last-writer-safe across devices: whichever
// device syncs last pushes the union of everything every device has earned,
// so no device's progress can be lost to a stale write.
//
// `store` is the zustand store (useStore) — passed in rather than imported so
// this module stays dependency-free and trivially testable.
export async function syncNow(store) {
  const cloud = await getCloud();

  const remote = await cloud.pullSnapshot();
  let pulled = false;
  if (remote != null) {
    const res = store.getState().importData(remote, 'merge');
    if (!res || res.ok !== true) {
      // Don't push over a snapshot we couldn't read — that could destroy the
      // one good copy. Surface the problem instead.
      throw new Error(`Could not merge the cloud snapshot: ${res?.error || 'unknown error'}`);
    }
    pulled = true;
  }

  // Re-read state AFTER the merge so the push carries the union.
  await cloud.pushSnapshot(store.getState().exportData());

  const at = new Date().toISOString();
  try {
    localStorage.setItem(LAST_SYNC_KEY, at);
  } catch {
    // Private mode / quota — the timestamp is cosmetic, the sync succeeded.
  }
  return { pulled, pushed: true, at };
}
