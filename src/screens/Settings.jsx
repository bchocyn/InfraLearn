import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore.js';
import ProgressPanel from '../components/ProgressPanel.jsx';
import WeekRecap from '../components/WeekRecap.jsx';
import { PATHS, PATH_KEYS } from '../data/content.js';
import { LEVELS, LEVEL_LABEL } from '../data/beasts.js';
import { LOCALES, getLocale, setLocale, useT } from '../i18n/index.js';
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
  const s = useStore();
  const [tab, setTab] = useState('profile');
  return (
    <div className="screen fade-in">
      <h1 className="h1">Settings<span className="dot">.</span></h1>
      <p className="caption" style={{ marginBottom: 12 }}>{s.displayName} · {LEVEL_LABEL[s.level]}</p>

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
  const s = useStore();
  const nav = useNavigate();
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
          onClick={() => { s.resetTour(); nav('/'); }}>
          ↺ Replay the app tour
        </button>
      </div>

      <div className="card">
        <div className="kicker" style={{ marginBottom: 8 }}>Display name</div>
        <input value={s.displayName} onChange={(e) => s.setName(e.target.value)}
          style={inputStyle} />
      </div>

      <div className="card">
        <div className="kicker" style={{ marginBottom: 8 }}>Self-assessed tier</div>
        <div className="row" style={{ gap: 6 }}>
          {LEVELS.map((lvl) => {
            const active = lvl === s.level;
            return (
              <button key={lvl} type="button" onClick={() => s.setLevel(lvl)}
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
        <select value={s.activePath} onChange={(e) => s.setActivePath(e.target.value)} style={inputStyle}>
          {PATH_KEYS.map((k) => <option key={k} value={k}>{PATHS[k].icon} {PATHS[k].name}</option>)}
        </select>
      </div>
    </>
  );
}

function DisplayTab() {
  const s = useStore();
  return (
    <>
      <LanguageCard />

      <div className="card">
        <div className="kicker" style={{ marginBottom: 10 }}>Accent color</div>
        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          {ACCENT_KEYS.map((k) => {
            const p = ACCENT_PRESETS[k];
            const active = (s.settings.accent || 'amber') === k;
            return (
              <button key={k} onClick={() => s.setSetting('accent', k)}
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
            const active = (s.settings.background || 'gruvbox') === k;
            // Preview palette: prefer the theme's baked-in colors so the
            // mini card actually looks like the chosen theme.
            const previewAccent  = t.accent     || 'var(--accent-amber)';
            const previewText    = t.textPrimary    || '#F4EFE3';
            const previewSub     = t.textSecondary  || '#C7BFA9';
            return (
              <button key={k} onClick={() => s.setSetting('background', k)}
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
            const active = (s.settings.deviceMode || 'mobile') === d.id;
            return (
              <button key={d.id} onClick={() => s.setSetting('deviceMode', d.id)}
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
        <Toggle label="Reduced motion" v={s.settings.reducedMotion} onChange={(v) => s.setSetting('reducedMotion', v)} />
        <Toggle label="Hide companion on home" v={s.settings.hideCompanion} onChange={(v) => s.setSetting('hideCompanion', v)} />
      </div>
    </>
  );
}

function ReviewTab() {
  const s = useStore();
  const fileRef = useRef();
  const [importMsg, setImportMsg] = useState('');

  const doExport = () => {
    const blob = new Blob([s.exportData()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'infralearn-backup.json'; a.click();
    URL.revokeObjectURL(url);
  };

  const MAX_IMPORT_BYTES = 1_000_000; // 1 MB — backup files should be a few KB at most.
  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > MAX_IMPORT_BYTES) {
      setImportMsg(`Import failed: file too large (${Math.round(f.size / 1024)} KB; limit 1000 KB).`);
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const mode = window.confirm('OK = Merge with current progress.\nCancel = Replace everything.') ? 'merge' : 'replace';
      const res = s.importData(String(reader.result), mode);
      setImportMsg(res.ok ? `Imported (${mode}).` : `Import failed: ${res.error}`);
    };
    reader.readAsText(f);
  };

  const totalDone = Object.keys(s.completed).length;
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
          const done = p.lessons.filter((l) => s.completed[l.id]).length;
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
        {importMsg && <div className="caption" style={{ marginTop: 8, color: 'var(--status-success)' }}>{importMsg}</div>}
      </div>

      <button className="btn btn-block" style={{ color: 'var(--status-error)', borderColor: 'transparent' }}
        onClick={() => { if (window.confirm('Reset all progress? This cannot be undone.')) s.resetAll(); }}>
        Reset all progress
      </button>
    </>
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

// LanguageCard — switches the UI locale (TabBar, lesson nav, settings labels,
// error boundary, etc.). Lesson content stays English by design — the picker
// hint makes that clear so users don't expect translated lesson bodies.
function LanguageCard() {
  const t = useT();
  const current = getLocale();
  return (
    <div className="card">
      <div className="kicker" style={{ marginBottom: 10 }}>{t('settings.language')}</div>
      <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
        {LOCALES.map((loc) => {
          const active = current === loc.code;
          return (
            <button
              key={loc.code}
              type="button"
              onClick={() => setLocale(loc.code)}
              style={{
                flex: '1 1 calc(50% - 4px)',
                padding: '10px 12px',
                borderRadius: 10,
                border: `1.5px solid ${active ? 'var(--accent-amber)' : 'var(--border-subtle)'}`,
                background: active ? 'var(--accent-amber-bg)' : 'var(--bg-card)',
                color: active ? 'var(--accent-amber)' : 'var(--text-secondary)',
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                letterSpacing: '.06em',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span
                className="mono"
                style={{ display: 'block', fontSize: 9, opacity: 0.7, marginBottom: 2 }}
              >
                {loc.code.toUpperCase()}
              </span>
              {loc.label}
            </button>
          );
        })}
      </div>
      <p className="caption" style={{ marginTop: 8, fontSize: 12 }}>
        {t('settings.language.hint')}
      </p>
    </div>
  );
}
