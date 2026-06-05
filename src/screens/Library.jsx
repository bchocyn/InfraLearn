import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore.js';
import { PATHS, PATH_KEYS } from '../data/content.js';

const LANG_BUCKETS = [
  { id: 'all',        label: 'All languages' },
  { id: 'python',     label: 'Python',     match: /\bpython|\bpy\b|pandas|numpy|pytorch|tensorflow|jupyter/i },
  { id: 'bash',       label: 'Bash · CLI', match: /\bbash|\bshell|linux|cli|command line|zsh|grep|sed|awk|xargs/i },
  { id: 'yaml',       label: 'YAML · k8s', match: /\byaml|kubernetes|k8s|helm|compose|ansible|manifest/i },
  { id: 'sql',        label: 'SQL · DB',   match: /\bsql\b|postgres|mysql|sqlite|query|database|dbt/i },
  { id: 'docker',     label: 'Docker',     match: /docker|container|dockerfile|image|registry/i },
  { id: 'js',         label: 'JS · Web',   match: /\bjs\b|javascript|typescript|node|react|api|rest|http/i },
  { id: 'go',         label: 'Go · Rust',  match: /\bgo\b|\bgolang|\brust\b/i },
  { id: 'iac',        label: 'IaC',        match: /terraform|pulumi|cloudformation|ansible|cdk|iac/i },
];

const KIND_FILTERS = [
  { id: 'all',     label: 'All types' },
  { id: 'concept', label: 'Concepts only' },
  { id: 'lab',     label: 'Labs only' },
  { id: 'sd',      label: 'SD insights' },
];

function lessonMatchesLang(lesson, langId) {
  if (langId === 'all') return true;
  const bucket = LANG_BUCKETS.find((b) => b.id === langId);
  if (!bucket || !bucket.match) return true;
  const haystack = `${lesson.title || ''} ${lesson.tagline || ''} ${lesson.section || ''} ${lesson.id || ''}`;
  return bucket.match.test(haystack);
}

export default function Library() {
  const nav = useNavigate();
  const s = useStore();
  const [pathKey, setPathKey] = useState('all');
  const [langKey, setLangKey] = useState('all');
  const [kindKey, setKindKey] = useState('all');
  const [search, setSearch] = useState('');
  const [hideCompleted, setHideCompleted] = useState(false);

  const categories = useMemo(() => buildCategories(s.completed), [s.completed]);

  const visibleCategories = useMemo(() => {
    const q = search.trim().toLowerCase();
    return categories
      .map((cat) => {
        let lessons = cat.lessons;
        if (pathKey !== 'all') {
          lessons = lessons.filter((l) => l.pathKeys.includes(pathKey));
        }
        if (langKey !== 'all') {
          lessons = lessons.filter((l) => lessonMatchesLang(l, langKey));
        }
        if (kindKey !== 'all') {
          lessons = lessons.filter((l) => (l.kind || 'concept') === kindKey);
        }
        if (hideCompleted) {
          lessons = lessons.filter((l) => !s.completed[l.id]);
        }
        if (q) {
          lessons = lessons.filter((l) =>
            (`${l.title || ''} ${l.tagline || ''}`).toLowerCase().includes(q)
          );
        }
        if (!lessons.length) return null;
        const done = lessons.filter((l) => s.completed[l.id]).length;
        return {
          ...cat,
          lessons,
          done,
          total: lessons.length,
          pct: lessons.length ? done / lessons.length : 0,
        };
      })
      .filter(Boolean);
  }, [categories, pathKey, langKey, kindKey, hideCompleted, search, s.completed]);

  const overallTotal = visibleCategories.reduce((n, c) => n + c.total, 0);
  const overallDone = visibleCategories.reduce((n, c) => n + c.done, 0);
  const overallPct = overallTotal ? overallDone / overallTotal : 0;

  const selectStyle = {
    flex: 1,
    minWidth: 0,
    background: 'var(--bg-elevated)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-default)',
    borderRadius: 8,
    padding: '10px 28px 10px 10px',
    fontFamily: 'inherit',
    fontSize: 'clamp(11px, 2.9vw, 13px)',
    fontWeight: 500,
    minHeight: 44,
    cursor: 'pointer',
    appearance: 'none',
    backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path d='M1 1l4 4 4-4' stroke='%23F5B842' stroke-width='1.5' fill='none' stroke-linecap='round'/></svg>\")",
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 10px center',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
  };

  return (
    <div className="screen fade-in">
      <h1 className="h1">Library<span className="dot">.</span></h1>
      <p className="caption" style={{ marginBottom: 12 }}>
        Search and filter across every concept, lab, and language.
      </p>

      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search lessons…"
        aria-label="Search lessons"
        style={{
          width: '100%',
          boxSizing: 'border-box',
          background: 'var(--bg-elevated)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-default)',
          borderRadius: 8,
          padding: '12px 14px',
          fontFamily: 'inherit',
          fontSize: 'clamp(13px, 3.2vw, 15px)',
          minHeight: 44,
          marginBottom: 10,
        }}
      />

      <div className="row" style={{ gap: 8, marginBottom: 12, flexWrap: 'nowrap' }}>
        <select
          value={pathKey}
          onChange={(e) => setPathKey(e.target.value)}
          style={selectStyle}
          aria-label="Career path"
        >
          <option value="all">All paths</option>
          {PATH_KEYS.map((k) => (
            <option key={k} value={k}>{PATHS[k].icon} {PATHS[k].name}</option>
          ))}
        </select>
        <select
          value={langKey}
          onChange={(e) => setLangKey(e.target.value)}
          style={selectStyle}
          aria-label="Language"
        >
          {LANG_BUCKETS.map((b) => (
            <option key={b.id} value={b.id}>{b.label}</option>
          ))}
        </select>
        <select
          value={kindKey}
          onChange={(e) => setKindKey(e.target.value)}
          style={selectStyle}
          aria-label="Lesson type"
        >
          {KIND_FILTERS.map((k) => (
            <option key={k.id} value={k.id}>{k.label}</option>
          ))}
        </select>
      </div>

      <div className="row" style={{ gap: 8, marginBottom: 12 }}>
        <button
          className={`lib-toggle${hideCompleted ? ' is-active' : ''}`}
          aria-pressed={hideCompleted}
          onClick={() => setHideCompleted((v) => !v)}
        >
          {hideCompleted ? '✓ ' : ''}Hide completed
        </button>
        <span className="spacer" />
        <span className="mono" style={{ fontSize: 10, color: 'var(--text-tertiary)', letterSpacing: '.08em' }}>
          {overallDone} / {overallTotal} · {Math.round(overallPct * 100)}%
        </span>
      </div>

      {visibleCategories.length === 0 ? (
        <div className="card caption" style={{ textAlign: 'center' }}>
          No lessons match these filters.
        </div>
      ) : (
        visibleCategories.map((cat) => (
          <CategoryCard
            key={cat.key}
            cat={cat}
            completed={s.completed}
            onOpen={(id) => nav(`/lesson/${id}`)}
          />
        ))
      )}
    </div>
  );
}

function CategoryCard({ cat, completed, onOpen }) {
  const [open, setOpen] = useState(cat.defaultOpen);
  const allDone = cat.total > 0 && cat.done === cat.total;
  return (
    <div className={`concept-group${open ? ' is-open' : ''}`}>
      <button
        type="button"
        className="concept-group-summary"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="concept-group-chevron" aria-hidden>{open ? '▾' : '▸'}</span>
        <span className="concept-group-label">{cat.displayName}</span>
        <span className="spacer" />
        <span
          className="concept-group-count mono"
          style={{ color: allDone ? 'var(--status-success)' : 'var(--text-tertiary)' }}
        >
          {cat.done} / {cat.total}{allDone ? ' ✓' : ''}
        </span>
      </button>
      <div className="concept-group-progress">
        <div className="progress">
          <i style={{ width: `${cat.pct * 100}%`, background: allDone ? 'var(--status-success)' : 'var(--accent-amber)' }} />
        </div>
      </div>
      {open && (
        <div className="concept-group-body">
          {cat.lessons.map((l) => (
            <LessonRow
              key={l.id}
              lesson={l}
              done={!!completed[l.id]}
              onOpen={() => onOpen(l.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function LessonRow({ lesson, done, onOpen }) {
  const kind = lesson.kind || 'concept';
  const icon = done ? '✓' : kind === 'sd' ? '◇' : kind === 'lab' ? '⚒' : '◆';
  const iconColor = done ? 'var(--status-success)' : kind === 'sd' ? 'var(--el-water)' : kind === 'lab' ? 'var(--accent-amber)' : 'var(--accent-amber)';
  const iconBg = done ? 'rgba(143,168,118,.2)' : kind === 'sd' ? 'rgba(123,159,181,.15)' : 'var(--accent-amber-bg)';
  // Was <div onClick> — anti-pattern per mobile-ux-principles. Switching to a
  // real <button> gives keyboard nav + screen-reader semantics + native focus
  // ring at no cost. We reset button chrome (background/border/font) so the
  // visual matches the original card.
  return (
    <button
      type="button"
      onClick={onOpen}
      className="card row"
      style={{
        marginBottom: 6,
        cursor: 'pointer',
        width: '100%',
        textAlign: 'left',
        font: 'inherit',
        color: 'inherit',
        minHeight: 44,
      }}
    >
      <div style={{ width: 28, height: 28, borderRadius: 7, background: iconBg, color: iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 13 }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>
          {lesson.title}
          {kind === 'lab' && <span className="pill" style={{ marginLeft: 6 }}>⚒ LAB</span>}
          {kind === 'sd' && <span className="pill el-water" style={{ marginLeft: 6 }}>◇ SD</span>}
          {lesson.deep && <span className="pill el-mystic" style={{ marginLeft: 6 }}>DEEP</span>}
        </div>
        <div className="mono" style={{ fontSize: 9, color: 'var(--text-tertiary)', marginTop: 2, letterSpacing: '.06em' }}>
          {lesson.pathBadges} · {lesson.duration || `${lesson.min} MIN`}
        </div>
      </div>
      <span style={{ color: 'var(--accent-amber)', flexShrink: 0 }}>→</span>
    </button>
  );
}

// Build a flat list of categories merged across every path. Section names are
// normalized (trim + casefold) for the merge key; the display form keeps the
// longest-seen original (ties: first-seen wins). Each lesson tracks every path
// it appears in so the path-filter pill row can hide/show categories without
// losing rows that show up in multiple paths.
function buildCategories(completed) {
  const byKey = new Map();
  const order = [];

  for (const pk of PATH_KEYS) {
    const path = PATHS[pk];
    for (const lesson of path.lessons) {
      const rawSection = lesson.section || `${path.name.toUpperCase()} · OTHER`;
      const norm = rawSection.trim().toLowerCase();
      let cat = byKey.get(norm);
      if (!cat) {
        cat = {
          key: norm,
          displayName: rawSection.trim(),
          deeperCuts: /deeper cuts/i.test(rawSection),
          lessonsByID: new Map(),
          firstSeenIdx: order.length,
        };
        byKey.set(norm, cat);
        order.push(cat);
      } else if (rawSection.trim().length > cat.displayName.length) {
        cat.displayName = rawSection.trim();
      }
      const existing = cat.lessonsByID.get(lesson.id);
      if (existing) {
        if (!existing.pathKeys.includes(pk)) existing.pathKeys.push(pk);
      } else {
        cat.lessonsByID.set(lesson.id, { ...lesson, pathKeys: [pk] });
      }
    }
  }

  const cats = order.map((cat) => {
    const lessons = Array.from(cat.lessonsByID.values()).map((l) => ({
      ...l,
      pathBadges: l.pathKeys.map((k) => `${PATHS[k].icon} ${PATHS[k].name.toUpperCase()}`).join(' · '),
    }));
    const done = lessons.filter((l) => completed[l.id]).length;
    return {
      key: cat.key,
      displayName: cat.displayName,
      deeperCuts: cat.deeperCuts,
      lessons,
      done,
      total: lessons.length,
      pct: lessons.length ? done / lessons.length : 0,
    };
  });

  let openCount = 0;
  for (const cat of cats) {
    const allDone = cat.total > 0 && cat.done === cat.total;
    if (cat.deeperCuts) {
      cat.defaultOpen = false;
    } else {
      cat.defaultOpen = !allDone && openCount < 3;
      if (cat.defaultOpen) openCount += 1;
    }
  }
  return cats;
}
