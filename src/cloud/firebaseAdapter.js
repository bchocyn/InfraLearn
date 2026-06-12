// Firebase adapter — the ONLY file in the codebase that imports firebase.
// It is reached exclusively through the dynamic `import('./firebaseAdapter.js')`
// in src/cloud/sync.js (getCloud), so every firebase byte stays in a lazy
// chunk that an unconfigured or signed-out build never downloads or executes.
//
// Storage model: one Firestore document per user at `users/{uid}/data/snapshot`
// holding `{ json, updatedAt }`, where `json` is the exact string produced by
// useStore.exportData(). Keeping the snapshot opaque (a string, not a mapped
// document) means the battle-tested importData() scrubbers stay the single
// validation path — the cloud can never inject shapes the local import
// wouldn't accept.

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
} from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

let app = null;
let auth = null;
let db = null;

// Idempotent — getCloud() only calls this once per page load, but guarding
// keeps a hot-reload or double-init harmless.
export function init(config) {
  if (app) return;
  app = initializeApp(config);
  auth = getAuth(app);
  db = getFirestore(app);
}

function requireInit() {
  if (!auth || !db) {
    throw new Error('Cloud sync is not initialized. This is a bug — init(config) must run first.');
  }
}

function requireUid() {
  requireInit();
  const u = auth.currentUser;
  if (!u) throw new Error('Not signed in. Sign in with Google to sync your progress.');
  return u.uid;
}

// Translate firebase's error codes into messages the Settings card can show
// verbatim. Unknown errors pass through with their original message intact.
function friendlyError(e) {
  const code = e?.code || '';
  if (code === 'auth/popup-blocked') {
    return new Error('The browser blocked the sign-in popup. Allow popups for this site and try again.');
  }
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
    return new Error('Sign-in was cancelled before it finished. Try again when ready.');
  }
  if (code === 'auth/unauthorized-domain') {
    return new Error('This domain is not authorized for sign-in. Add it under Firebase → Authentication → Authorized domains.');
  }
  if (code === 'auth/operation-not-allowed') {
    return new Error('Google sign-in is not enabled for this Firebase project. Enable it under Authentication → Sign-in method.');
  }
  if (code === 'auth/network-request-failed' || code === 'unavailable') {
    return new Error('You appear to be offline. Cloud sync needs a connection — your progress is safe locally and will sync next time.');
  }
  if (code === 'permission-denied') {
    return new Error('The cloud rejected the request (permission denied). Check the Firestore security rules in docs/SETUP-CLOUD.md.');
  }
  if (e instanceof Error) return e;
  return new Error(String(e?.message || e));
}

// cb receives { uid, email, displayName } when signed in, null when signed
// out. Returns the unsubscribe function from onAuthStateChanged.
export function subscribeAuth(cb) {
  requireInit();
  return onAuthStateChanged(auth, (u) => {
    cb(u ? { uid: u.uid, email: u.email, displayName: u.displayName } : null);
  });
}

export async function signInWithGoogle() {
  requireInit();
  try {
    const res = await signInWithPopup(auth, new GoogleAuthProvider());
    const u = res.user;
    return { uid: u.uid, email: u.email, displayName: u.displayName };
  } catch (e) {
    throw friendlyError(e);
  }
}

export async function signOutCloud() {
  requireInit();
  try {
    await signOut(auth);
  } catch (e) {
    throw friendlyError(e);
  }
}

// Returns the stored snapshot JSON string, or null when this user has never
// pushed one (first sync from a new account).
export async function pullSnapshot() {
  const uid = requireUid();
  try {
    const snap = await getDoc(doc(db, 'users', uid, 'data', 'snapshot'));
    if (!snap.exists()) return null;
    const json = snap.data()?.json;
    return typeof json === 'string' ? json : null;
  } catch (e) {
    throw friendlyError(e);
  }
}

export async function pushSnapshot(json) {
  const uid = requireUid();
  if (typeof json !== 'string' || json.length === 0) {
    throw new Error('pushSnapshot expects the JSON string from exportData().');
  }
  try {
    await setDoc(doc(db, 'users', uid, 'data', 'snapshot'), {
      json,
      updatedAt: new Date().toISOString(),
    });
  } catch (e) {
    throw friendlyError(e);
  }
}
