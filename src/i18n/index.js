// Minimal i18n layer for InfraLearn.
//
// Scope decision: the curriculum content (lesson bodies, quiz banks, FAANG
// stories) stays English-only because translating them faithfully is a
// week-long content task, not a code task. What this module DOES translate is
// the **chrome**: tab labels, settings strings, primary CTAs, status badges,
// errors — the wrapper a non-English speaker hits on every screen.
//
// Public API:
//   t(key, vars?)            → translated string, with {var} interpolation
//   useT()                   → React hook returning t() bound to the current locale
//   setLocale(code)          → switch UI locale ('en' | 'es' | ...)
//   LOCALES                  → list of { code, label } for the picker
//
// The current locale is mirrored into <html lang="..."> on change, both for
// screen readers and for any future date / number formatters.

import { useSyncExternalStore } from 'react';
import { en } from './locales/en.js';
import { es } from './locales/es.js';

const CATALOGS = { en, es };
export const LOCALES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
];

const STORAGE_KEY = 'infralearn-locale';
const DEFAULT_LOCALE = 'en';

function detectInitial() {
  // 1. Explicit user choice via localStorage (set by the settings picker).
  try {
    const saved = typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEY);
    if (saved && CATALOGS[saved]) return saved;
  } catch (_) { /* ignore */ }
  // 2. Browser preference (only if we have a matching catalog).
  if (typeof navigator !== 'undefined' && Array.isArray(navigator.languages)) {
    for (const lang of navigator.languages) {
      const code = String(lang || '').slice(0, 2).toLowerCase();
      if (CATALOGS[code]) return code;
    }
  }
  return DEFAULT_LOCALE;
}

let currentLocale = detectInitial();
applyHtmlLang(currentLocale);

// Subscriber set so React components re-render when the locale changes.
const subscribers = new Set();
function notify() {
  for (const cb of subscribers) cb();
}

function applyHtmlLang(code) {
  if (typeof document !== 'undefined' && document.documentElement) {
    document.documentElement.lang = code;
  }
}

export function getLocale() {
  return currentLocale;
}

export function setLocale(code) {
  if (!CATALOGS[code] || code === currentLocale) return;
  currentLocale = code;
  applyHtmlLang(code);
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, code);
  } catch (_) { /* ignore quota */ }
  notify();
}

// Translate a key. Falls back to English when the active locale lacks the
// key, and finally to the key itself so missing strings stay visible.
//   t('home.welcome', { name: 'Learner' })  →  "Welcome back, Learner"
export function t(key, vars) {
  const cat = CATALOGS[currentLocale] || CATALOGS[DEFAULT_LOCALE];
  let val = cat && cat[key];
  if (typeof val !== 'string') val = CATALOGS[DEFAULT_LOCALE][key];
  if (typeof val !== 'string') return key;          // key missing in every catalog
  if (vars && typeof vars === 'object') {
    return val.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));
  }
  return val;
}

// React-friendly hook. Components re-render when setLocale() is called.
export function useT() {
  useSyncExternalStore(
    (cb) => { subscribers.add(cb); return () => subscribers.delete(cb); },
    () => currentLocale,
    () => DEFAULT_LOCALE,
  );
  return t;
}
