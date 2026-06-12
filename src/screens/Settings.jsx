import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore.js';
// Cloud sync facade — contains ZERO firebase code. The firebase SDK lives in
// a lazy chunk behind getCloud()'s dynamic import and is only fetched after
// the user interacts with the card (or auto-resumed via the enabled flag).
import { isCloudConfigured, getCloud, syncNow, LAST_SYNC_KEY, ENABLED_KEY } from '../cloud/sync.js';
import ProgressPanel from '../components/ProgressPanel.jsx';
import WeekRecap from '../components/WeekRecap.jsx';
import { PATHS, PATH_KEYS } from '../data/content.js';
import { LEVELS, LEVEL_LABEL } from '../data/beasts.js';
// Theme tables live in their own tiny module so main.jsx can read them
// SYNCHRONOUSLY without dragging in the whole Settings screen. We re-export
// them here so any code that already imports from '../screens/Settings.jsx'
// (and there is some) keeps resolving — no behavior change.
import {
  ACCENT_PRESETS,
  ACCENT_KEYS,
  BG_THEMES,
  BG_KEYS,
} from './settingsThemes.js';
export { ACCENT_PRESETS, ACCENT_KEYS, BG_THEMES, BG_KEYS };

const TABS = [
  { id: 'profile', icon: '◇', label: 'PROFILE' },
  { id: 'display', icon: '◎', label: 'DISPLAY' },
  { id: 'review',  icon: '▤', label: 'REVIEW'  },
];

export default function Settings() {
  // Narrow subscriptions — only the two fields the header actually renders.
  const displayName = useStore((st) => st.displayName);
  const level = useStore((st) => st.level);
  const [tab, setTab] = useState('profile');
  return (
    <div className="screen fade-in">
      <h1 className="h1">Settings<span className="dot">.</span></h1>
      <p className="caption" style={{ marginBottom: 12 }}>{displayName} · {LEVEL_LABEL[level]}</p>

      <div className="row" style={{ gap: 6, marginBottom: 14 }}>
        {TABS.map((t) => {
          const active = t.id === tab;
          return (
            <button key={t.id} className="btn btn-block" onClick={() => setTab(t.id)}
              style={active ? { borderColor: 'var(--accent-amber)', color: 'var(--accent-amber)' } : {}}>
              <span style={{ marginRight: 4 }}>{t.icon}</span>{t.label}
            </button>
          );
        })}
      </div>

      {tab === 'profile' && <ProfileTab />}
      {tab === 'display' && <DisplayTab />}
      {tab === 'review'  && <ReviewTab />}
    </div>
  );
}

function ProfileTab() {
  // Per-field selectors: three data fields + four actions (stable refs).
  const displayName = useStore((st) => st.displayName);
  const level = useStore((st) => st.level);
  const activePath = useStore((st) => st.activePath);
  const setName = useStore((st) => st.setName);
  const resetTour = useStore((st) => st.resetTour);
  const setLevel = useStore((st) => st.setLevel);
  const setActivePath = useStore((st) => st.setActivePath);
  const nav = useNavigate();
  // Draft buffer for the display name. Writing every keystroke through
  // setName let the store's scrubber turn an empty field into 'Learner'
  // mid-edit (select-all + delete instantly stamped it). Commit on blur /
  // Enter instead.
  const [nameDraft, setNameDraft] = useState(displayName);
  const commitName = () => {
    setName(nameDraft);
    // Re-sync the draft to whatever the scrubber accepted ('' → 'Learner',
    // control chars stripped, 64-char clamp).
    setNameDraft(useStore.getState().displayName);
  };
  return (
    <>
      <WeekRecap />
      <ProgressPanel />
      <div className="card">
        <div className="kicker" style={{ marginBottom: 8 }}>How it works</div>
        <p className="caption" style={{ margin: '0 0 10px' }}>
          A quick tour of Home — the daily challenge, reviews, your path, and your Byte Beast.
        </p>
        <button type="button" className="btn btn-block"
          onClick={() => { resetTour(); nav('/'); }}>
          ↺ Replay the app tour
        </button>
      </div>

      <div className="card">
        <div className="kicker" style={{ marginBottom: 8 }}>Display name</div>
        <input
          value={nameDraft}
          onChange={(e) => setNameDraft(e.target.value)}
          onBlur={commitName}
          onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
          style={inputStyle}
        />
      </div>

      <div className="card">
        <div className="kicker" style={{ marginBottom: 8 }}>Self-assessed tier</div>
        <div className="row" style={{ gap: 6 }}>
          {LEVELS.map((lvl) => {
            const active = lvl === level;
            return (
              <button key={lvl} type="button" onClick={() => setLevel(lvl)}
                style={{ flex: 1, minWidth: 0, minHeight: 44, padding: '10px 2px', borderRadius: 8,
                  border: `1.5px solid ${active ? 'var(--accent-amber)' : 'var(--border-subtle)'}`,
                  background: active ? 'var(--accent-amber-bg)' : 'var(--bg-card)',
                  color: active ? 'var(--accent-amber)' : 'var(--text-secondary)',
                  fontFamily: 'var(--font-mono)',
                  // Fluid: 9px at 375px iPhone (where "DISTINGUISHED" risks overflow),
                  // back to 10px on roomier screens.
                  fontSize: 'clamp(9px, 2.4vw, 10px)',
                  letterSpacing: '.04em', cursor: 'pointer', textAlign: 'center' }}>
                {LEVEL_LABEL[lvl]}
              </button>
            );
          })}
        </div>
        <p className="caption" style={{ marginTop: 8, fontSize: 12 }}>
          Daily Practice and Library adapt to this tier. Completing lessons can promote you but never demote.
        </p>
      </div>

      <div className="card">
        <div className="kicker" style={{ marginBottom: 8 }}>Active path</div>
        <select value={activePath} onChange={(e) => setActivePath(e.target.value)} style={inputStyle}>
          {PATH_KEYS.map((k) => <option key={k} value={k}>{PATHS[k].icon} {PATHS[k].name}</option>)}
        </select>
      </div>
    </>
  );
}

function DisplayTab() {
  // `settings` is replaced wholesale by setSetting, so one reference-equal
  // selector covers every preference read here; the action is a stable ref.
  const settings = useStore((st) => st.settings);
  const setSetting = useStore((st) => st.setSetting);
  return (
    <>
      <div className="card">
        <div className="kicker" style={{ marginBottom: 10 }}>Accent color</div>
        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          {ACCENT_KEYS.map((k) => {
            const p = ACCENT_PRESETS[k];
            const active = (settings.accent || 'amber') === k;
            return (
              <button key={k} onClick={() => setSetting('accent', k)}
                style={{ flex: '1 1 calc(50% - 4px)', padding: '10px 12px', borderRadius: 10,
                  border: `1.5px solid ${active ? p.color : 'var(--border-subtle)'}`,
                  background: active ? `${p.color}1A` : 'var(--bg-card)',
                  display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <span style={{ width: 18, height: 18, borderRadius: '50%', background: p.color, boxShadow: active ? `0 0 12px ${p.color}80` : 'none' }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '.06em',
                  color: active ? p.color : 'var(--text-secondary)' }}>{p.name.toUpperCase()}</span>
              </button>
            );
          })}
        </div>
        <p className="caption" style={{ marginTop: 8, fontSize: 12 }}>Recolors highlights, progress, and call-to-action buttons.</p>
      </div>

      <div className="card">
        <div className="kicker" style={{ marginBottom: 4 }}>Theme</div>
        <p className="caption" style={{ marginTop: 0, marginBottom: 12, fontSize: 12 }}>
          Switch reading modes. <strong style={{ color: 'var(--text-secondary)' }}>Light</strong>, <strong style={{ color: 'var(--text-secondary)' }}>Sepia</strong>, and <strong style={{ color: 'var(--text-secondary)' }}>Paper</strong> are lowest-glare for long reading.
        </p>
        <div className="theme-grid">
          {BG_KEYS.map((k) => {
            const t = BG_THEMES[k];
            const active = (settings.background || 'gruvbox') === k;
            // Preview palette: prefer the theme's baked-in colors so the
            // mini card actually looks like the chosen theme.
            const previewAccent  = t.accent     || 'var(--accent-amber)';
            const previewText    = t.textPrimary    || '#F4EFE3';
            const previewSub     = t.textSecondary  || '#C7BFA9';
            return (
              <button key={k} onClick={() => setSetting('background', k)}
                className={`theme-card${active ? ' theme-card-active' : ''}`}>
                <div className="theme-preview" style={{ background: t.base, borderColor: t.border }}>
                  <span className="theme-preview-accent" style={{ background: previewAccent }} />
                  <span className="theme-preview-line"   style={{ background: previewText }} />
                  <span className="theme-preview-line theme-preview-line-sub" style={{ background: previewSub }} />
                </div>
                <div className="theme-name">{t.name}</div>
                <div className="theme-desc">{t.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="card">
        <div className="kicker" style={{ marginBottom: 10 }}>Device layout</div>
        <div className="row" style={{ gap: 8 }}>
          {[
            { id: 'mobile',  label: '📱 iPhone / Mobile', hint: 'Phone column · bottom tabs' },
            { id: 'desktop', label: '💻 Laptop / PC',     hint: 'Side rail · fills window' },
          ].map((d) => {
            const active = (settings.deviceMode || 'mobile') === d.id;
            return (
              <button key={d.id} onClick={() => setSetting('deviceMode', d.id)}
                style={{ flex: 1, padding: '10px 12px', borderRadius: 10,
                  border: `1.5px solid ${active ? 'var(--accent-amber)' : 'var(--border-subtle)'}`,
                  background: active ? 'var(--accent-amber-bg)' : 'var(--bg-card)',
                  cursor: 'pointer', textAlign: 'left' }}>
                <div style={{ fontSize: 13, fontWeight: 600,
                  color: active ? 'var(--accent-amber)' : 'var(--text-primary)' }}>{d.label}</div>
                <div className="mono" style={{ fontSize: 9, color: 'var(--text-tertiary)', letterSpacing: '.06em', marginTop: 2 }}>
                  {d.hint}
                </div>
              </button>
            );
          })}
        </div>
        <p className="caption" style={{ marginTop: 8, fontSize: 12 }}>Reloads layout instantly — picks the same default as your first-run choice.</p>
      </div>

      <div className="card">
        <div className="kicker" style={{ marginBottom: 10 }}>Preferences</div>
        <Toggle label="Reduced motion" v={settings.reducedMotion} onChange={(v) => setSetting('reducedMotion', v)} />
        <Toggle label="Hide companion on home" v={settings.hideCompanion} onChange={(v) => setSetting('hideCompanion', v)} />
      </div>
    </>
  );
}

function ReviewTab() {
  // One data field (completed drives the progress overview) + three actions.
  const completed = useStore((st) => st.completed);
  const exportData = useStore((st) => st.exportData);
  const importData = useStore((st) => st.importData);
  const resetAll = useStore((st) => st.resetAll);
  const fileRef = useRef();
  // { ok: boolean, text: string } | null — ok drives the status color so a
  // failure no longer renders in success-green.
  const [importMsg, setImportMsg] = useState(null);

  const doExport = () => {
    const blob = new Blob([exportData()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'infralearn-backup.json';
    // Clicking a detached anchor + revoking synchronously historically aborts
    // the download in Firefox/Safari — attach, click, remove, revoke async.
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const MAX_IMPORT_BYTES = 1_000_000; // 1 MB — backup files should be a few KB at most.
  const onFile = (e) => {
    // Capture the input element NOW — React pools synthetic events, so
    // e.target is not reliable inside the async FileReader callbacks.
    const input = e.target;
    const f = input.files?.[0];
    if (!f) return;
    if (f.size > MAX_IMPORT_BYTES) {
      setImportMsg({ ok: false, text: `Import failed: file too large (${Math.round(f.size / 1024)} KB; limit 1000 KB).` });
      input.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      // Always reset so re-picking the same file fires onChange again.
      input.value = '';
      // Two-step confirm: Cancel/Escape can never fall through into the
      // destructive replace. First dialog offers the safe merge; the second
      // explicitly arms replace; cancelling both aborts with nothing changed.
      let mode;
      if (window.confirm('Merge the backup into your current progress?\n\nOK = Merge (recommended — keeps everything you\'ve earned)\nCancel = more options…')) {
        mode = 'merge';
      } else if (window.confirm('REPLACE all current progress with the backup?\n\nOK = Replace everything\nCancel = abort the import (nothing changes)')) {
        mode = 'replace';
      } else {
        setImportMsg(null);
        return; // aborted — nothing imported
      }
      const res = importData(String(reader.result), mode);
      setImportMsg(res.ok
        ? { ok: true, text: `Imported (${mode}).` }
        : { ok: false, text: `Import failed: ${res.error}` });
    };
    reader.onerror = () => {
      input.value = '';
      setImportMsg({ ok: false, text: 'Import failed: the file could not be read.' });
    };
    reader.readAsText(f);
  };

  const totalDone = Object.keys(completed).length;
  const overallLessons = PATH_KEYS.reduce((acc, k) => acc + PATHS[k].lessons.length, 0);

  return (
    <>
      <div className="card">
        <div className="kicker" style={{ marginBottom: 10 }}>Progress overview</div>
        <div className="row" style={{ marginBottom: 8 }}>
          <span style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 700 }}>
            {totalDone} / {overallLessons}
          </span>
          <span className="spacer" />
          <span className="mono" style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
            {overallLessons > 0 ? Math.round((totalDone / overallLessons) * 100) : 0}% OVERALL
          </span>
        </div>
        {PATH_KEYS.map((k) => {
          const p = PATHS[k];
          const done = p.lessons.filter((l) => completed[l.id]).length;
          const pct = p.lessons.length > 0 ? done / p.lessons.length : 0;
          return (
            <div key={k} style={{ marginBottom: 8 }}>
              <div className="row" style={{ marginBottom: 4 }}>
                <span style={{ fontSize: 12 }}>{p.icon} {p.name}</span>
                <span className="spacer" />
                <span className="mono" style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{done}/{p.lessons.length}</span>
              </div>
              <div className="progress"><i style={{ width: `${pct * 100}%` }} /></div>
            </div>
          );
        })}
      </div>

      <div className="card">
        <div className="kicker" style={{ marginBottom: 8 }}>Backup</div>
        <div className="row" style={{ gap: 8 }}>
          <button className="btn btn-block" onClick={doExport}>↓ Export</button>
          <button className="btn btn-block" onClick={() => fileRef.current?.click()}>↑ Import</button>
          <input ref={fileRef} type="file" accept="application/json" onChange={onFile} style={{ display: 'none' }} />
        </div>
        {importMsg && (
          <div
            className="caption"
            style={{ marginTop: 8, color: importMsg.ok ? 'var(--status-success)' : 'var(--status-error)' }}
          >
            {importMsg.text}
          </div>
        )}
      </div>

      <CloudSyncCard />

      <button className="btn btn-block" style={{ color: 'var(--status-error)', borderColor: 'transparent' }}
        onClick={() => { if (window.confirm('Reset all progress? This cannot be undone.')) resetAll(); }}>
        Reset all progress
      </button>
    </>
  );
}

// ── Cloud sync card (REVIEW tab, next to Backup) ─────────────────────────
// Three states:
//   1. Not configured (CLOUD_CONFIG null) — muted info card, zero buttons,
//      zero firebase bytes ever requested.
//   2. Configured + signed out — a single "Sign in with Google" button. The
//      firebase chunk loads only when it's clicked, UNLESS a previous session
//      signed in (ENABLED_KEY flag), in which case we auto-subscribe on mount
//      so a returning user lands signed in without re-clicking.
//   3. Signed in — email + "Sync now" + "Sign out", with the last-sync
//      timestamp persisted by sync.js in localStorage.
// localStorage access goes through try/catch helpers — some privacy modes
// throw on access, and the flags are conveniences, not state of record.
function lsGet(k) { try { return localStorage.getItem(k); } catch { return null; } }
function lsSet(k, v) { try { localStorage.setItem(k, v); } catch { /* cosmetic */ } }
function lsDel(k) { try { localStorage.removeItem(k); } catch { /* cosmetic */ } }
function errMsg(e) { return e?.message || String(e); }
function fmtSyncTime(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function CloudSyncCard() {
  const configured = isCloudConfigured();
  // null = signed out / unknown; object = { uid, email, displayName }.
  const [user, setUser] = useState(null);
  // True while the auto-resume subscription waits for its first auth
  // callback, so the button shows "Checking session…" instead of flashing
  // the signed-out state at a signed-in returning user.
  const [checking, setChecking] = useState(false);
  const [busy, setBusy] = useState(false);        // sign-in / sign-out in flight
  const [syncing, setSyncing] = useState(false);  // syncNow in flight
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);     // last syncNow result
  const [lastSync, setLastSync] = useState(() => lsGet(LAST_SYNC_KEY));
  const unsubRef = useRef(null);

  // Subscribe to auth state exactly once (idempotent across calls).
  const ensureSubscribed = async () => {
    const cloud = await getCloud();
    if (!unsubRef.current) {
      unsubRef.current = cloud.subscribeAuth((u) => {
        setUser(u);
        setChecking(false);
      });
    }
    return cloud;
  };

  useEffect(() => {
    // Auto-load firebase on mount ONLY when a previous session opted in (the
    // enabled flag set on first sign-in). Without it, the lazy chunk stays
    // unfetched until the user clicks "Sign in with Google".
    if (configured && lsGet(ENABLED_KEY) === '1') {
      setChecking(true);
      ensureSubscribed().catch((e) => {
        setChecking(false);
        setError(errMsg(e));
      });
    }
    return () => {
      if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doSignIn = async () => {
    setError(null);
    setBusy(true);
    try {
      const cloud = await ensureSubscribed();
      await cloud.signInWithGoogle();
      // Remember the opt-in so the next visit resumes the session on mount.
      lsSet(ENABLED_KEY, '1');
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  const doSignOut = async () => {
    setError(null);
    setBusy(true);
    try {
      const cloud = await getCloud();
      await cloud.signOutCloud();
      // Clear the opt-in: the next visit renders signed-out WITHOUT loading
      // any firebase code.
      lsDel(ENABLED_KEY);
      setResult(null);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  const doSync = async () => {
    setError(null);
    setSyncing(true);
    setResult(null);
    try {
      const res = await syncNow(useStore);
      setResult(res);
      setLastSync(res.at);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setSyncing(false);
    }
  };

  if (!configured) {
    return (
      <div className="card" style={{ opacity: 0.65 }}>
        <div className="kicker" style={{ marginBottom: 8 }}>Cloud sync</div>
        <p className="caption" style={{ margin: 0, fontSize: 12 }}>
          Not configured. This build is fully local — your progress lives in this browser
          (use Backup above to move it between devices). See{' '}
          <span className="mono">docs/SETUP-CLOUD.md</span> to enable cloud sync.
        </p>
      </div>
    );
  }

  const lastSyncLabel = fmtSyncTime(lastSync);

  return (
    <div className="card">
      <div className="kicker" style={{ marginBottom: 8 }}>Cloud sync</div>
      {user ? (
        <>
          <div className="row" style={{ marginBottom: 10 }}>
            <span style={{ fontSize: 13, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.email || user.displayName || 'Signed in'}
            </span>
            <span className="spacer" />
            <span className="mono" style={{ fontSize: 9, color: 'var(--status-success)', letterSpacing: '.06em' }}>
              ● SIGNED IN
            </span>
          </div>
          <div className="row" style={{ gap: 8 }}>
            <button className="btn btn-block" onClick={doSync} disabled={syncing || busy}>
              {syncing ? 'Syncing…' : '⇅ Sync now'}
            </button>
            <button className="btn btn-block" onClick={doSignOut} disabled={syncing || busy}>
              Sign out
            </button>
          </div>
          {result && !error && (
            <div className="caption" style={{ marginTop: 8, color: 'var(--status-success)' }}>
              {result.pulled
                ? 'Merged remote progress · pushed latest'
                : 'No remote snapshot yet · pushed latest'}
            </div>
          )}
          {lastSyncLabel && !syncing && (
            <div className="caption" style={{ marginTop: result ? 2 : 8, fontSize: 11, color: 'var(--text-tertiary)' }}>
              Synced · {lastSyncLabel}
            </div>
          )}
        </>
      ) : (
        <>
          <p className="caption" style={{ margin: '0 0 10px', fontSize: 12 }}>
            Optional: sign in to keep a private cloud backup and sync progress across
            devices. Everything keeps working offline and logged out.
          </p>
          <button className="btn btn-block" onClick={doSignIn} disabled={busy || checking}>
            {checking ? 'Checking session…' : busy ? 'Opening Google sign-in…' : 'Sign in with Google'}
          </button>
        </>
      )}
      {error && (
        <div className="caption" style={{ marginTop: 8, color: 'var(--status-error)' }}>
          {error}
        </div>
      )}
    </div>
  );
}

function Toggle({ label, v, onChange }) {
  // Per mobile-ux-principles 44px touch target: the visual switch is 42×24
  // but the hit area on the wrapping button extends to a 44px-tall row so
  // a thumb-tap anywhere on the row toggles it. The inner span paints the
  // pill so the look is unchanged.
  return (
    <div className="row" style={{ padding: '4px 0' }}>
      <span style={{ fontSize: 14 }}>{label}</span>
      <span className="spacer" />
      <button
        type="button"
        onClick={() => onChange(!v)}
        aria-pressed={v}
        aria-label={`${label} (${v ? 'on' : 'off'})`}
        style={{
          minWidth: 60, minHeight: 44, padding: '10px 9px',
          background: 'transparent', border: 'none', cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <span style={{
          position: 'relative', display: 'inline-block', width: 42, height: 24,
          borderRadius: 12, background: v ? 'var(--accent-amber)' : 'var(--border-default)',
          transition: 'background .2s',
        }}>
          <span style={{
            position: 'absolute', top: 2, left: v ? 20 : 2, width: 20, height: 20,
            borderRadius: '50%', background: '#0B0A08', transition: 'left .2s',
          }} />
        </span>
      </button>
    </div>
  );
}

const inputStyle = {
  width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
  borderRadius: 8, padding: '10px', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: 13,
};

// (The language picker that lived here was removed — the app ships
// English-only. The i18n module stays so chrome strings remain keyed and a
// locale can be reintroduced by registering a catalog in src/i18n/index.js.)
