// Trophies — collection-layer screen (Engagement Tier B).
//
// Layout:
//   • 3-column grid on 375px+; 1-column at <375px (rare edge — fallback).
//   • Each card: emoji-icon-in-circle (64px), name, unlock date, fake but
//     deterministic "earned by N% of learners" social-proof string.
//   • Locked badges show as greyed silhouettes with the unlock hint.
//   • Tap → modal: "How you earned this" + Share button (clipboard copy).
//
// This component is mounted as an overlay from ByteBeast.jsx (not as a
// router route — the hard constraint forbids touching main.jsx). The user
// reaches it via the "TROPHIES →" pill near the companion switcher.

import { useMemo, useState } from 'react';
import { useStore } from '../store/useStore.js';
import { PATHS, PATH_KEYS } from '../data/content.js';

// ── Badge catalog ────────────────────────────────────────────────────────
// Static metadata for every badge the system can grant. The store knows the
// ids; this file owns the human-facing labels, icons, and unlock hints.
//
// Catalog is built dynamically so adding a new content section or path
// auto-grows the trophy room without code changes here.

// Deterministic-by-id fake stat: "earned by N% of learners". Same id always
// produces the same number. Range 8..78 — never 100 (would feel meaningless)
// and never single-digit (would feel discouraging).
function fakePctEarned(id) {
  let h = 5381;
  for (let i = 0; i < id.length; i++) h = ((h << 5) + h + id.charCodeAt(i)) >>> 0;
  return 8 + (h % 71);
}

function buildCatalog() {
  const catalog = [];

  // Section badges — pull live from PATHS so additions stay in sync.
  const sectionSet = new Map();
  for (const p of Object.values(PATHS)) {
    for (const l of p.lessons) {
      if (typeof l.section === 'string' && l.section.trim().length > 0) {
        const key = l.section.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        if (!sectionSet.has(key)) sectionSet.set(key, l.section);
      }
    }
  }
  for (const [key, name] of sectionSet) {
    catalog.push({
      id: `section:${key}`,
      group: 'section',
      icon: '📚',
      // Display the ORIGINAL authored section string (matched to the badge
      // key by normalization above). Rebuilding the label from the hyphenated
      // key turned every word boundary into ' · ' — 'data-structures-basics'
      // rendered as "Data · Structures · Basics". The authored string keeps
      // multi-word names natural ("Data Structures Basics") and keeps the
      // path · section separator only where the author put one
      // ('FUNDAMENTALS · ESSENTIALS').
      name,
      hint: `Complete every lesson in ${name}`,
      howEarned: `Awarded the moment you finish all lessons in the "${name}" section. Reading + retention compounds — a full section is real ground covered.`,
    });
  }

  // Streak milestone badges.
  for (const days of [3, 7, 14, 30, 100]) {
    catalog.push({
      id: `streak:${days}`,
      group: 'streak',
      icon: '🔥',
      name: `${days}-day streak`,
      hint: `Practice ${days} days in a row`,
      howEarned: `Hit ${days} consecutive days of activity (lessons, daily practice, or reviews). Streak freezes and weekend passes don't break the chain.`,
    });
  }

  // Path tier badges.
  const tierMeta = [
    { tier: 'bronze', icon: '🥉', threshold: '33%' },
    { tier: 'silver', icon: '🥈', threshold: '66%' },
    { tier: 'gold',   icon: '🥇', threshold: '100%' },
  ];
  for (const k of PATH_KEYS) {
    const path = PATHS[k];
    if (!path) continue;
    for (const t of tierMeta) {
      catalog.push({
        id: `path:${k}:${t.tier}`,
        group: 'path',
        icon: t.icon,
        name: `${path.name} · ${t.tier.charAt(0).toUpperCase()}${t.tier.slice(1)}`,
        hint: `Reach ${t.threshold} on ${path.name}`,
        howEarned: `Cross ${t.threshold} completion on the ${path.name} path. ${t.tier === 'gold' ? 'Mastery tier — all lessons done.' : 'Keep going for the next tier.'}`,
      });
    }
  }

  // One-shot collection badges.
  catalog.push({
    id: 'daily:perfect',
    group: 'special',
    icon: '⚡',
    name: 'Daily Perfect',
    hint: 'Score 5/5 on a Daily Practice session',
    howEarned: 'Five-for-five on one Daily Practice. Recall + recognition both rewarded — keep stacking these.',
  });
  catalog.push({
    id: 'recall:first',
    group: 'special',
    icon: '🧠',
    name: 'First Recall',
    hint: 'Type your first free-recall answer + self-grade "Got it"',
    howEarned: 'Free recall is the highest-retention tool we ship. This badge marks the moment you started using it.',
  });
  catalog.push({
    id: 'reviewer:10',
    group: 'special',
    icon: '📖',
    name: 'Reviewer · 10',
    hint: 'Complete 10 spaced-repetition reviews in one day',
    howEarned: 'Ten reviews in a single day. Spaced repetition is half the battle — the other half is showing up to do it.',
  });

  return catalog;
}

export default function Trophies({ onClose }) {
  const badges = useStore((s) => s.badges) || {};
  const catalog = useMemo(buildCatalog, []);
  const [open, setOpen] = useState(null); // selected badge for the detail modal

  const unlockedCount = catalog.filter((b) => badges[b.id]).length;

  return (
    <div className="trophies-overlay" role="dialog" aria-modal="true" aria-label="Trophy room">
      <div className="trophies-shell">
        <div className="trophies-header">
          <div>
            <div className="kicker" style={{ color: 'var(--accent-amber)' }}>TROPHY ROOM</div>
            <h2 className="h2" style={{ marginTop: 4, marginBottom: 4 }}>
              Your collection
            </h2>
            <p className="caption" style={{ margin: 0 }}>
              {unlockedCount} of {catalog.length} earned
            </p>
          </div>
          <button
            type="button"
            className="btn"
            onClick={onClose}
            aria-label="Close trophy room"
            style={{ minWidth: 44, minHeight: 44 }}
          >
            ✕
          </button>
        </div>

        <div className="trophies-grid">
          {catalog.map((b) => {
            const owned = !!badges[b.id];
            const unlockedAt = owned ? badges[b.id].unlockedAt : null;
            const pct = fakePctEarned(b.id);
            return (
              <button
                key={b.id}
                type="button"
                className={`trophy-card${owned ? '' : ' trophy-card-locked'}`}
                onClick={() => setOpen(b)}
                aria-label={`${b.name}${owned ? ', unlocked' : ', locked'}`}
              >
                <div className={`trophy-icon${owned ? '' : ' trophy-icon-locked'}`}>
                  <span aria-hidden="true">{owned ? b.icon : '🔒'}</span>
                </div>
                <div className="trophy-name" title={b.name}>{b.name}</div>
                <div className="trophy-meta mono">
                  {owned
                    ? (unlockedAt || 'unlocked')
                    : 'locked'}
                </div>
                <div className="trophy-social mono">{pct}% earned</div>
              </button>
            );
          })}
        </div>

        {open && (
          <TrophyDetail badge={open} owned={!!badges[open.id]} onClose={() => setOpen(null)} />
        )}
      </div>
    </div>
  );
}

function TrophyDetail({ badge, owned, onClose }) {
  const [copied, setCopied] = useState(false);
  const onShare = async () => {
    const text = owned
      ? `I just unlocked "${badge.name}" on InfraLearn 🏆`
      : `I'm working toward "${badge.name}" on InfraLearn — ${badge.hint}.`;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }
    } catch { /* clipboard denied — silently skip */ }
  };
  return (
    <div
      className="trophy-detail-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${badge.name} details`}
    >
      <div
        className="trophy-detail-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="trophy-detail-icon-row">
          <div className={`trophy-icon trophy-icon-lg${owned ? '' : ' trophy-icon-locked'}`}>
            <span aria-hidden="true">{owned ? badge.icon : '🔒'}</span>
          </div>
          <div style={{ flex: 1 }}>
            <div className="trophy-detail-name">{badge.name}</div>
            <div className="trophy-detail-status mono">
              {owned ? 'UNLOCKED' : 'LOCKED'}
            </div>
          </div>
        </div>
        <div className="kicker" style={{ marginTop: 14 }}>HOW YOU EARNED THIS</div>
        <p className="caption" style={{ marginTop: 6, marginBottom: 0, lineHeight: 1.5 }}>
          {owned ? badge.howEarned : badge.hint}
        </p>
        <div className="row" style={{ marginTop: 14, gap: 8 }}>
          <button
            type="button"
            className="btn btn-primary"
            style={{ flex: 1 }}
            onClick={onShare}
          >
            {copied ? '✓ Copied' : 'Share →'}
          </button>
          <button
            type="button"
            className="btn"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
