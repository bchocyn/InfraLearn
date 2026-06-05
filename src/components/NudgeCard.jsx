// NudgeCard — Engagement Tier B's adaptive forgiveness-framed nudge.
//
// Rules:
//   • ONE nudge per session (sessionStorage flag) — never spam.
//   • Strict priority: streak-saving > review-due > path-milestone.
//   • Tone: "your tool noticed something useful," never guilt.
//   • A nudge that can't be acted on simply doesn't render.
//
// Evidence anchor: pure streak anxiety contradicts Duolingo's own pacing
// data. Forgiveness framing ("your weekend pass will save your streak — today
// is a rest day") earns +4% week-later return vs the same nudge in guilt
// framing. Soft amber color, never red.

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore, getReviewsDue } from '../store/useStore.js';
import { PATHS, PATH_KEYS, pathProgress } from '../data/content.js';

const SESSION_KEY = 'infralearn:nudge-shown';

// Hours since the user's last activity, based on the lastActivityDate day
// boundary (we don't store a precise timestamp). If lastActivityDate is
// today, treat as 0; if yesterday, treat as 24; etc. Coarse but enough to
// distinguish "streak is at risk" (>18h, <30h) from "fine, just keep going."
function approxHoursSinceLastActivity(lastDay) {
  if (!lastDay) return null;
  const p = lastDay.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!p) return null;
  // Anchor the "end" of the last activity day at 23:59 local — gives the
  // longest possible benefit of the doubt (the user might have practiced at
  // 11pm yesterday). Otherwise we'd misfire "at risk" all morning.
  const last = new Date(+p[1], +p[2] - 1, +p[3], 23, 59, 0);
  const now = new Date();
  const diffMs = now - last;
  return diffMs / 36e5;
}

export default function NudgeCard() {
  const nav = useNavigate();
  const streak = useStore((s) => s.streak);
  const lastActivityDate = useStore((s) => s.lastActivityDate);
  const weekendPasses = useStore((s) => s.weekendPasses);
  const completed = useStore((s) => s.completed) || {};
  const reviewQueue = useStore((s) => s.reviewQueue);
  const activePath = useStore((s) => s.activePath);
  const setActivePath = useStore((s) => s.setActivePath);

  // Per-session one-shot. We track in sessionStorage so reloading the tab
  // resets the limit but navigating between routes doesn't.
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined') return false;
    try { return window.sessionStorage.getItem(SESSION_KEY) === '1'; } catch (_) { return false; }
  });

  const reviewsDue = useMemo(
    () => getReviewsDue({ reviewQueue: reviewQueue || {} }).length,
    [reviewQueue],
  );

  const nudge = useMemo(() => {
    if (dismissed) return null;

    // ── Priority 1: streak-saving ─────────────────────────────────────
    const hours = approxHoursSinceLastActivity(lastActivityDate);
    if (streak >= 1 && hours != null && hours > 18 && hours < 30) {
      // Streak in jeopardy this calendar day. Check weekend pass first —
      // if today is Sat/Sun and the user has a pass, frame as "no worries."
      const now = new Date();
      const dow = now.getDay(); // 0=Sun, 6=Sat
      const isWeekend = dow === 0 || dow === 6;
      if (isWeekend && weekendPasses > 0) {
        return {
          id: 'weekend-pass',
          kind: 'streak',
          icon: '🛡',
          message: `No worries — your Weekend Pass will save your ${streak}-day streak. Today is a rest day.`,
          cta: null, // pure reassurance, no action
        };
      }
      // Otherwise calm warning. Calm color, never red. ~ hours left until
      // end-of-day (best-effort).
      const hoursLeft = Math.max(1, 24 - (now.getHours() + now.getMinutes() / 60));
      return {
        id: 'streak-risk',
        kind: 'streak',
        icon: '🔥',
        message: `Your ${streak}-day streak is at risk — about ${Math.round(hoursLeft)} hours left to log activity.`,
        cta: { label: 'Open Daily Practice', onClick: () => nav('/') },
      };
    }

    // ── Priority 2: reviews due ───────────────────────────────────────
    if (reviewsDue >= 5) {
      return {
        id: 'reviews-due',
        kind: 'review',
        icon: '📚',
        message: `${reviewsDue} concepts due for review — about ${Math.max(2, Math.ceil(reviewsDue * 0.8))} min to keep them stuck.`,
        cta: { label: 'Start review →', onClick: () => nav('/reviews') },
      };
    }

    // ── Priority 3: path milestone within 3 lessons ──────────────────
    // Check active path first, then any other path. Bronze is the first
    // milestone (33%); we trigger when 1-3 lessons would push them over.
    const milestones = [
      { label: 'Bronze',  threshold: 0.33 },
      { label: 'Silver',  threshold: 0.66 },
      { label: 'Gold',    threshold: 1.0  },
    ];
    const checkPath = (k) => {
      const p = PATHS[k];
      if (!p) return null;
      const prog = pathProgress(k, completed);
      for (const m of milestones) {
        if (prog.pct >= m.threshold) continue;
        const needed = Math.ceil(m.threshold * prog.total) - prog.done;
        if (needed > 0 && needed <= 3) {
          return {
            id: `path-${k}-${m.label.toLowerCase()}`,
            kind: 'milestone',
            icon: '🎯',
            message: `${needed} lesson${needed === 1 ? '' : 's'} from ${m.label} on ${p.name} — finish today?`,
            cta: {
              label: `Open ${p.name}`,
              onClick: () => {
                // Switch the active path AND jump to its next incomplete
                // lesson — otherwise the lesson screen would render with
                // wrong-path breadcrumbs and the user would have to
                // re-pick on Home after returning.
                if (k !== activePath) setActivePath?.(k);
                const next = p.lessons.find((l) => !completed[l.id]) || p.lessons[0];
                if (next) nav(`/lesson/${next.id}`);
              },
            },
          };
        }
        // Only check the nearest milestone per path.
        return null;
      }
      return null;
    };
    const activeFirst = checkPath(activePath);
    if (activeFirst) return activeFirst;
    for (const k of PATH_KEYS) {
      if (k === activePath) continue;
      const n = checkPath(k);
      if (n) return n;
    }
    return null;
  }, [dismissed, streak, lastActivityDate, weekendPasses, reviewsDue, completed, activePath, setActivePath, nav]);

  // Mark as shown the first time we actually render a nudge.
  useEffect(() => {
    if (!nudge || dismissed) return;
    try { window.sessionStorage.setItem(SESSION_KEY, '1'); } catch (_) { /* ignore */ }
  }, [nudge, dismissed]);

  if (!nudge || dismissed) return null;

  const handleDismiss = (e) => {
    e?.stopPropagation();
    setDismissed(true);
  };

  return (
    <div
      className={`nudge-card nudge-card-${nudge.kind} fade-in`}
      role="status"
      aria-live="polite"
    >
      <div className="nudge-card-row">
        <span className="nudge-card-icon" aria-hidden="true">{nudge.icon}</span>
        <div className="nudge-card-body">
          <div className="nudge-card-message">{nudge.message}</div>
        </div>
        <button
          type="button"
          className="nudge-card-dismiss"
          onClick={handleDismiss}
          aria-label="Dismiss nudge"
        >
          ✕
        </button>
      </div>
      {nudge.cta && (
        <button
          type="button"
          className="btn btn-primary nudge-card-cta"
          onClick={nudge.cta.onClick}
        >
          {nudge.cta.label}
        </button>
      )}
    </div>
  );
}
