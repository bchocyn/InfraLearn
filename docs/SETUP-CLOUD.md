# Enabling optional cloud sync (Firebase)

InfraLearn ships **fully local**: all progress lives in this browser's
localStorage, and the Settings → Review → "Cloud sync" card shows
*Not configured*. This guide is for the app owner who wants to turn on the
optional Google-login + cloud-backup feature. Until you complete it, the
build contains the feature in a dormant, lazy-loaded chunk that no user ever
downloads or executes — zero behavior change.

## How it works (privacy model)

- Local-first stays the source of truth. The cloud holds a **backup**, not a
  server of record: one Firestore document per signed-in user at
  `users/{uid}/data/snapshot`, containing the same JSON string the
  Settings → Backup → Export button produces, plus an `updatedAt` timestamp.
- "Sync now" pulls that snapshot, **merges** it into local progress (badges
  union, max of XP/streak, completed-lessons union — the same battle-tested
  merge as backup import), then pushes the merged result back. Running it
  twice changes nothing; syncing from several devices converges on the union
  of everything earned anywhere.
- Nothing is public. The security rules below restrict every user's data to
  their own authenticated uid. The app never reads anyone else's documents.
- Signing in is **optional**. The app remains fully usable offline and
  logged out, forever — sign-in only adds the backup.

## One-time setup

### 1. Create a Firebase project

1. Go to <https://console.firebase.google.com> and **Add project** (any name,
   e.g. `infralearn`). Google Analytics is not needed — disable it.
2. In the project, click the **Web** (`</>`) icon to register a web app
   (nickname `infralearn-web`; no Firebase Hosting needed — the app stays on
   GitHub Pages).

### 2. Enable the Google sign-in provider

1. **Build → Authentication → Get started**.
2. **Sign-in method** tab → **Google** → Enable, pick a support email, Save.

### 3. Authorize the GitHub Pages domain

1. Still in **Authentication → Settings → Authorized domains**.
2. **Add domain** → `bchocyn.github.io` (the GitHub Pages host this app is
   deployed to). `localhost` is pre-authorized for local `npm run dev`
   testing.

### 4. Create the Firestore database

1. **Build → Firestore Database → Create database**.
2. Choose **production mode** (locked by default) and a region near you.

### 5. Paste the security rules

In **Firestore Database → Rules**, replace the contents with exactly this and
**Publish**:

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Each user may read/write ONLY their own subtree. Nobody can read or
    // write anyone else's snapshot; unauthenticated access is denied.
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null
                         && request.auth.uid == userId;
    }
  }
}
```

### 6. Copy the web config into the app

1. **Project settings (gear) → Your apps → infralearn-web → SDK setup and
   configuration → Config** — you'll see a `firebaseConfig` object.
2. Open `src/cloud/cloudConfig.js` and replace `export const CLOUD_CONFIG =
   null;` with your values:

```js
export const CLOUD_CONFIG = {
  apiKey: 'AIzaSy...',
  authDomain: 'your-project.firebaseapp.com',
  projectId: 'your-project',
  appId: '1:1234567890:web:abc123def456',
};
```

These are publishable client identifiers, not secrets — the security rules
from step 5 are what protect the data. Committing them is fine.

### 7. Rebuild and deploy

```
npm run build
```

Deploy `dist/` as usual. The Settings → Review → "Cloud sync" card now shows
**Sign in with Google**. The Firebase SDK still loads lazily — only after a
user taps sign-in (or returns with a remembered session) does any Firebase
code download.

## Notes

- The `index.html` Content-Security-Policy already allow-lists the Firebase
  Auth + Firestore endpoints (`apis.google.com`, `identitytoolkit` /
  `securetoken` / `firestore` / `www` `.googleapis.com`, and the
  `*.firebaseapp.com` + `accounts.google.com` sign-in iframes). No CSP edits
  needed when enabling.
- Firestore's free tier (1 GiB storage, 50k reads / 20k writes per day) is
  orders of magnitude beyond what per-user snapshots of a few KB will use.
- To turn the feature back off, set `CLOUD_CONFIG` back to `null` and
  rebuild. Existing local progress is untouched.
