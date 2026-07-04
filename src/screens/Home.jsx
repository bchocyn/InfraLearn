import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore, getReviewsDue } from '../store/useStore.js';
import { PATHS, PATH_KEYS, pathProgress } from '../data/content.js';

// Career-path display order — derived from PATH_KEYS so content.js stays the
// single source of truth and a newly added path can never silently vanish
// from the career <select>. The old hand-maintained list omitted 'fullstack'
// and 'cybersec', which also made "MASTERY ACHIEVED" fire while those two
// paths sat at 0%.
const PATH_ORDER = PATH_KEYS;
// Streak milestones that trigger the celebratory inline toast.
const STREAK_MILESTONES = new Set([3, 7, 14, 30, 100]);
// CampHero replaced the static beast strip — Keeper + companion at the
// watchfire, with mood states and story barks that deep-link to the gating
// action (journey design §11).
import CampHero from '../components/CampHero.jsx';
import FeedbackPanel from '../components/FeedbackPanel.jsx';
import CelebrationMoment from '../components/CelebrationMoment.jsx';
import NudgeCard from '../components/NudgeCard.jsx';
// InstallPrompt mounts at the BOTTOM of Home (below the action row) on
// purpose — the engagement agent owns the StreakBadge / Nudge / Celebration
// cluster up top, and this card is a passive nudge that should never compete
// for the user's first-glance attention.
import InstallPrompt from '../components/InstallPrompt.jsx';
// Daily Challenge — pinned ~60s recall card. Mounts between StreakBadge and
// QuickPickers so it lives in the "first glance" zone but doesn't shove the
// path selector off-screen. Renders its own empty state when the user has
// zero completions, so it can always sit at this anchor point.
import DailyChallengeCard from '../components/DailyChallengeCard.jsx';

export default function Home() {
  const nav = useNavigate();
  // Per-field selectors instead of the old whole-store `useStore()` — every
  // store write (XP ticks, review grades, persist hydration…) re-rendered
  // Home; now only the fields this component actually reads do.
  const completed = useStore((st) => st.completed);
  const activePath = useStore((st) => st.activePath);
  const displayName = useStore((st) => st.displayName);
  const hideCompanion = useStore((st) => st.settings?.hideCompanion);
  const refillWeekendPassesIfNewMonth = useStore((st) => st.refillWeekendPassesIfNewMonth);
  const setActivePath = useStore((st) => st.setActivePath);

  const prog = pathProgress(activePath, completed);
  const path = PATHS[activePath] || PATHS.devops;
  const nextLesson = path.lessons.find((l) => !completed[l.id]) || path.lessons[path.lessons.length - 1];
  const isComplete = prog.pct >= 1;

  // Refill weekend passes once per mount if the calendar month rolled over.
  // Cheap, idempotent — the store action no-ops when already current.
  useEffect(() => {
    refillWeekendPassesIfNewMonth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const suggestedKey = PATH_ORDER.find((k) => {
    if (k === activePath) return false;
    const p = pathProgress(k, completed);
    return p.pct < 1;
  });
  const allDone = !suggestedKey;
  const nextPath = suggestedKey ? PATHS[suggestedKey] : PATHS.fundamentals;

  const startNextPath = (e) => {
    e.stopPropagation();
    const key = suggestedKey || 'fundamentals';
    setActivePath(key);
    const target = PATHS[key].lessons.find((l) => !completed[l.id]) || PATHS[key].lessons[0];
    nav(`/lesson/${target.id}`);
  };

  return (
    <div className="screen fade-in">
      <div className="row" style={{ marginBottom: 4, gap: 10, alignItems: 'flex-start' }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="kicker">🚀 Welcome back, {displayName}</div>
          <h1 className="h1" style={{ marginBottom: 0 }}>InfraLearn<span className="dot">.</span></h1>
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <EmberChip />
          <ComboChip />
          <StreakBadge />
        </div>
      </div>
      <p className="caption" style={{ marginBottom: 14 }}>DevOps fundamentals → MLOps in production.</p>

      <StreakCelebration />

      {/* Full-screen XP / level / badge celebration overlay. Driven by the
          store's `celebrate` field — auto-dismisses after 1.5s. Single mount
          per screen keeps the timer logic simple. */}
      <CelebrationMoment />

      {/* Adaptive forgiveness-framed nudge — at most ONE per session.
          Renders nothing when nothing helpful applies. */}
      <NudgeCard />

      {!hideCompanion && <CampHero />}

      {/* Cliffhanger — the FIRST thing a returning user sees when an earlier
          lesson stashed an open question (Zeigarnik effect: open loops drive
          both retention and return). Mounted ABOVE DailyChallengeCard on
          purpose. Renders nothing when there's no pending cliffhanger. */}
      <CliffhangerCard />

      {/* Daily Challenge — ONE recall question pulled from learned concepts.
          Pinned here so it sits above the path selector but below the streak
          / companion cluster. Renders its own empty + done states. */}
      <div data-tour="daily"><DailyChallengeCard /></div>

      <QuickPickers />


      <div
        className="card"
        style={{ borderColor: 'rgba(245,184,66,.3)', cursor: isComplete ? 'default' : 'pointer' }}
        onClick={isComplete ? undefined : () => nav(`/lesson/${nextLesson.id}`)}
      >
        <div className="kicker" style={{ marginBottom: 6 }}>Your path · {path.icon} {path.name}</div>
        <div className="row" style={{ marginBottom: 8 }}>
          <span style={{ fontFamily: 'var(--font-serif)', fontSize: 15, fontWeight: 600 }}>
            {prog.done} / {prog.total} · {Math.round(prog.pct * 100)}%
          </span>
        </div>
        <div className="progress"><i style={{ width: `${prog.pct * 100}%` }} /></div>
        {isComplete ? (
          <div style={{ marginTop: 12 }}>
            <div className="kicker" style={{ color: 'var(--status-success)', marginBottom: 4 }}>
              {allDone ? 'MASTERY ACHIEVED 🎉' : 'PATH COMPLETE 🎉'}
            </div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 17, fontWeight: 600, lineHeight: 1.25, marginBottom: 6 }}>
              {allDone ? "You're at 100% across every path." : `You finished ${path.name}.`}
            </div>
            <div className="caption" style={{ fontSize: 12, marginBottom: 10 }}>
              {allDone
                ? 'Mastery achieved. Browse the Library to revisit any lesson.'
                : <>Suggested next: <strong style={{ color: 'var(--text-secondary)' }}>{nextPath.icon} {nextPath.name}</strong></>}
            </div>
            <div className="row" style={{ gap: 8 }}>
              {allDone ? (
                <button className="btn btn-primary btn-block" onClick={(e) => { e.stopPropagation(); nav('/library'); }}>
                  Open Library →
                </button>
              ) : (
                <>
                  <button className="btn btn-primary" style={{ flex: 1 }} onClick={startNextPath}>
                    Start {nextPath.name} →
                  </button>
                  <button
                    className="btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      // The "Pick another" affordance used to scrollIntoView a
                      // `.lib-pill-row` that lives only on the Library screen —
                      // a dead-end query on Home. Navigate to the Library so
                      // the user actually lands somewhere they can pick a path.
                      nav('/library');
                    }}
                  >
                    Pick another
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="row" style={{ marginTop: 10 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Continue: {nextLesson.title}</div>
              <div className="mono" style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{nextLesson.min} MIN</div>
            </div>
            <span className="spacer" />
            <span style={{ color: 'var(--accent-amber)' }}>→</span>
          </div>
        )}
      </div>

      {/* The id anchors CampHero's "camp drills" bark scroll target. */}
      <div id="daily-practice"><DailyPractice /></div>

      <ReviewsDueTeaser />

      <WeakSpotsTeaser />

      <ProjectsTeaser />

      <div className="row" style={{ gap: 8 }}>
        <button className="btn btn-block" onClick={() => nav('/roadmap')}>◇ ROADMAP</button>
        <button className="btn btn-block" onClick={() => nav('/library')}>▤ LIBRARY</button>
      </div>

      {/* PWA install nudge — gated on engagement (streak ≥ 3, ≥ 3 lessons,
          or 3rd app-open today) and only when the browser actually has an
          install affordance. Renders nothing the rest of the time. */}
      <InstallPrompt />
    </div>
  );
}

// ── Cliffhanger card (Zeigarnik open-loop) ───────────────────────────────
// Surfaces the unresolved question from the user's most recently completed
// lesson (when that lesson opted in via a top-level `cliffhanger` field).
// Open loops are sticky — the question primes recall AND pulls the user back
// the next day. Renders nothing when:
//   - no cliffhanger is pending (the common case for fresh installs / lessons
//     that didn't author one)
//   - the user already dismissed today's cliffhanger (skip / reveal both
//     clear the slot via clearCliffhanger)
// Mounts ABOVE DailyChallengeCard so a returning user lands on the open
// question first — that's the whole point of the curiosity-gap framing.
function CliffhangerCard() {
  const nav = useNavigate();
  const pending = useStore((st) => st.pendingCliffhanger);
  const clearCliffhanger = useStore((st) => st.clearCliffhanger);

  if (!pending || !pending.question || !pending.lessonId) return null;

  const onReveal = () => {
    const targetId = pending.lessonId;
    // Clear BEFORE nav so a quick back-button doesn't re-show the card.
    clearCliffhanger();
    nav(`/lesson/${targetId}`);
  };
  const onSkip = () => {
    clearCliffhanger();
  };

  return (
    <div className="card cliffhanger-card fade-in">
      <div className="kicker cliffhanger-kicker">⏳ FROM YESTERDAY · OPEN QUESTION</div>
      <p className="cliffhanger-question">{pending.question}</p>
      <div className="row cliffhanger-actions">
        <button
          type="button"
          className="btn btn-primary"
          onClick={onReveal}
          style={{ flex: 1 }}
        >
          Reveal answer →
        </button>
        <button
          type="button"
          className="btn cliffhanger-skip"
          onClick={onSkip}
          aria-label="Skip this cliffhanger for today"
        >
          Skip
        </button>
      </div>
    </div>
  );
}

// ── Ember chip ───────────────────────────────────────────────────────────
// The journey economy's visibility anchor (design doc §10) — embers ⟡ are
// earned ONLY by learning actions and spent on journey content. Always
// rendered (a visible 0 is the curiosity hook that pulls a new Keeper into
// the loop); the count ticks live off the store.
function EmberChip() {
  const embers = useStore((st) => st.embers) || 0;
  return (
    <span
      className="ember-header-chip"
      role="status"
      aria-label={`Embers: ${embers}`}
      title="Embers — earned by learning, spent on the journey"
    >
      ⟡ {embers}
    </span>
  );
}

// ── Combo multiplier chip ────────────────────────────────────────────────
// Tiny amber pill that sits next to the StreakBadge when the user is on a
// run of consecutive-correct tested answers. Rendered nothing below combo=2
// so the chip only appears once the bonus is meaningfully close (combo=3 is
// the first 1.5x tier — combo=2 is the "one more and you unlock the bonus"
// nudge). At combo>=5 it locks at ×5 to mirror the 2.0x ceiling. Bounces in
// on first appearance so the moment registers without being noisy.
function ComboChip() {
  const combo = useStore((st) => st.practiceCombo) || 0;
  if (combo < 2) return null;
  return (
    <span
      className="combo-header-chip"
      role="status"
      aria-label={`Combo multiplier: ${combo} consecutive correct`}
    >
      🔥 COMBO ×{combo}
    </span>
  );
}

// ── Streak badge + expandable forgiveness panel ──────────────────────────
// Lives inline with the welcome row so it never pushes the dropdowns
// off-screen on 375px. Tap to expand inline (no modal — modals add friction
// per mobile-ux-principles). Animates on milestone days only (3/7/14/30/100).
function StreakBadge() {
  const streak = useStore((st) => st.streak);
  const highWater = useStore((st) => st.streakHighWater);
  const freezes = useStore((st) => st.streakFreezes);
  const passes = useStore((st) => st.weekendPasses);
  const pendingFreeze = useStore((st) => st.pendingFreeze);
  const spendFreeze = useStore((st) => st.spendFreeze);

  const [open, setOpen] = useState(false);
  const flameAnim = streak >= 3 && STREAK_MILESTONES.has(streak);

  return (
    <div style={{ flexShrink: 0, textAlign: 'right', position: 'relative' }}>
      <button
        type="button"
        data-tour="streak"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Streak: ${streak} days${highWater > streak ? `, best ${highWater}` : ''}. Tap for details.`}
        aria-expanded={open}
        style={{
          background: 'transparent',
          border: '1px solid var(--border-default)',
          borderRadius: 999,
          padding: '0 12px',
          color: 'var(--text-primary)',
          cursor: 'pointer',
          minHeight: 44,
          minWidth: 64,
          fontFamily: 'var(--font-serif)',
          fontSize: 16,
          fontWeight: 700,
          lineHeight: 1,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          whiteSpace: 'nowrap',
        }}
      >
        <span aria-hidden className={flameAnim ? 'fade-in' : undefined}>🔥</span>
        <span>{streak}</span>
      </button>
      {open && (
        <div
          className="card fade-in"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: 244,
            maxWidth: 'calc(100vw - 36px)',
            zIndex: 30,
            textAlign: 'left',
            borderColor: 'rgba(245,184,66,.3)',
          }}
        >
          <div className="kicker" style={{ marginBottom: 6 }}>STREAK · FORGIVENESS</div>
          <div className="row" style={{ marginBottom: 6 }}>
            <span style={{ fontSize: 13 }}>❄️ Freezes</span>
            <span className="spacer" />
            <span className="mono" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{freezes}</span>
          </div>
          <div className="row" style={{ marginBottom: 6 }}>
            <span style={{ fontSize: 13 }}>🛋️ Weekend passes</span>
            <span className="spacer" />
            <span className="mono" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{passes} / 2</span>
          </div>
          <p className="caption" style={{ fontSize: 11, marginTop: 4, marginBottom: 10, lineHeight: 1.45 }}>
            Spend a freeze before a day you know you&apos;ll miss — your streak survives.
            Weekend passes auto-apply for missed Saturdays or Sundays (refill monthly).
          </p>
          <button
            type="button"
            className="btn btn-primary btn-block"
            disabled={freezes <= 0 || pendingFreeze}
            onClick={(e) => { e.stopPropagation(); spendFreeze(); }}
            style={{ fontSize: 13 }}
          >
            {pendingFreeze ? 'Freeze armed ✓' : freezes <= 0 ? 'No freezes left' : 'Spend freeze →'}
          </button>
        </div>
      )}
    </div>
  );
}

// Inline celebration shown the moment the streak crosses a milestone. Auto-
// dismisses after 3 seconds. We watch `streak` and only fire when it lands
// on a milestone value AND the value changed since last render (so the toast
// doesn't reappear every time the user navigates back to Home).
function StreakCelebration() {
  const streak = useStore((st) => st.streak);
  const [visible, setVisible] = useState(false);
  const [shown, setShown] = useState(streak);  // last streak we showed for
  const prevRef = useRef(streak);

  useEffect(() => {
    const prev = prevRef.current;
    prevRef.current = streak;
    // Only celebrate when the streak GROWS into a milestone, not on first mount.
    if (streak > prev && STREAK_MILESTONES.has(streak) && shown !== streak) {
      setShown(streak);
      setVisible(true);
      const t = setTimeout(() => setVisible(false), 3000);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [streak, shown]);

  if (!visible) return null;
  return (
    <div
      className="card fade-in"
      role="status"
      aria-live="polite"
      style={{
        borderColor: 'var(--accent-amber)',
        background: 'linear-gradient(90deg, rgba(245,184,66,.14), rgba(245,184,66,.04))',
        marginBottom: 10,
      }}
    >
      <div className="row">
        <span style={{ fontSize: 20 }} aria-hidden>🔥</span>
        <div style={{ marginLeft: 8 }}>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 15, fontWeight: 600 }}>
            {streak}-day streak!
          </div>
          <div className="caption" style={{ fontSize: 11 }}>You&apos;re on it. Keep going.</div>
        </div>
      </div>
    </div>
  );
}

// Spaced-repetition teaser. Surfaces concepts whose review is due today
// (FSRS-flavored scheduler). Hidden when nothing is due — Home stays calm
// on a fresh install, the card only appears when there's something to act on.
// Single CTA, mono kicker — matches the WeakSpots/Sandbox teaser rhythm.
function ReviewsDueTeaser() {
  const nav = useNavigate();
  const reviewQueue = useStore((s) => s.reviewQueue);
  // getReviewsDue compares dueAt against the LOCAL calendar day internally,
  // so a session left open past midnight kept showing yesterday's count.
  // `today` (local y-m-d, same pattern as the store's isoDay) in the deps
  // recomputes the memo on the first render after the day flips. (A render
  // still has to happen — deliberate; no timers.)
  const today = localIsoDay();
  const count = useMemo(
    () => getReviewsDue({ reviewQueue: reviewQueue || {} }).length,
    [reviewQueue, today],
  );
  if (count === 0) return null;
  return (
    <div
      className="card"
      data-tour="reviews"
      style={{ borderLeft: '3px solid var(--el-water)', cursor: 'pointer' }}
      onClick={() => nav('/reviews')}
    >
      <div className="kicker" style={{ color: 'var(--el-water)' }}>REVIEWS DUE</div>
      <div className="row" style={{ marginTop: 6 }}>
        <span style={{ fontFamily: 'var(--font-serif)', fontSize: 16, fontWeight: 600 }}>
          {count} concept{count === 1 ? '' : 's'} due today
        </span>
        <span className="spacer" />
        <span style={{ color: 'var(--accent-amber)' }}>→</span>
      </div>
      <div className="caption" style={{ marginTop: 4 }}>
        5 min · spaced-repetition keeps it stuck
      </div>
      <div className="row" style={{ gap: 8, marginTop: 10 }}>
        <button
          type="button"
          className="btn btn-primary"
          style={{ flex: 1 }}
          onClick={(e) => { e.stopPropagation(); nav('/reviews'); }}
        >
          ▶ Start review
        </button>
        {/* Same cards, battle costume — markReviewed under both. */}
        <button
          type="button"
          className="btn"
          onClick={(e) => { e.stopPropagation(); nav('/watchfire'); }}
          title="The same reviews as a watchfire patrol"
        >
          🔥 Patrol
        </button>
      </div>
    </div>
  );
}

// Compact teaser surfacing missed math-quiz questions. Hidden when there
// are zero misses so the Home screen doesn't grow noise the user can't act on.
// Projects teaser — the capstone ramp used to be reachable ONLY via a card
// two taps deep inside Library, yet projects are the closest activity to the
// north-star end-state ("architect systems without AI"). Gated on a little
// momentum (≥3 completed lessons) so a brand-new user's Home stays calm.
function ProjectsTeaser() {
  const nav = useNavigate();
  const completed = useStore((s) => s.completed) || {};
  if (Object.keys(completed).length < 3) return null;
  return (
    <button
      type="button"
      className="card"
      onClick={() => nav('/projects')}
      aria-label="Open projects — guided builds and architect challenges"
      style={{
        borderLeft: '3px solid var(--accent-amber)',
        cursor: 'pointer', width: '100%', textAlign: 'left',
        font: 'inherit', color: 'inherit', minHeight: 44, display: 'block',
      }}
    >
      <div className="kicker" style={{ color: 'var(--accent-amber)' }}>🔨 BUILD · PROJECTS</div>
      <div className="row" style={{ marginTop: 6 }}>
        <span style={{ fontSize: 14, fontWeight: 600 }}>Ship something real</span>
        <span className="spacer" />
        <span style={{ color: 'var(--accent-amber)' }}>→</span>
      </div>
      <div className="caption" style={{ marginTop: 4 }}>
        Guided builds first, open architect challenges at the end — the skill that
        outlasts any single lesson.
      </div>
    </button>
  );
}

function WeakSpotsTeaser() {
  const nav = useNavigate();
  const quizMisses = useStore((s) => s.quizMisses) || {};
  const count = Object.values(quizMisses).reduce(
    (n, byPrompt) => n + Object.keys(byPrompt || {}).length,
    0,
  );
  if (count === 0) return null;
  return (
    <button
      type="button"
      className="card"
      onClick={() => nav('/weak-spots')}
      aria-label={`Review ${count} weak-spot question${count === 1 ? '' : 's'}`}
      style={{
        borderLeft: '3px solid var(--el-fire)',
        cursor: 'pointer', width: '100%', textAlign: 'left',
        font: 'inherit', color: 'inherit', minHeight: 44, display: 'block',
      }}
    >
      <div className="kicker" style={{ color: 'var(--el-fire)' }}>REVIEW · WEAK SPOTS</div>
      <div className="row" style={{ marginTop: 6 }}>
        <span style={{ fontSize: 14, fontWeight: 600 }}>
          {count} question{count === 1 ? '' : 's'} to revisit
        </span>
        <span className="spacer" />
        <span style={{ color: 'var(--accent-amber)' }}>→</span>
      </div>
      <div className="caption" style={{ marginTop: 4 }}>
        Math-quiz answers you've missed — clear them by retaking the lesson's quiz.
      </div>
    </button>
  );
}

function QuickPickers() {
  // Narrow selectors — the old whole-store subscription re-rendered the
  // pickers on EVERY store write (XP, streak ticks, review grades…).
  const activePath = useStore((st) => st.activePath);
  const setActivePath = useStore((st) => st.setActivePath);
  const completed = useStore((st) => st.completed);
  const selectStyle = {
    width: '100%',
    background: 'var(--bg-elevated)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-default)',
    borderRadius: 8,
    padding: '10px 12px',
    fontFamily: 'inherit',
    fontSize: 'clamp(12px, 3vw, 14px)',
    fontWeight: 500,
    minHeight: 44,
    cursor: 'pointer',
    appearance: 'none',
    backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path d='M1 1l4 4 4-4' stroke='%23F5B842' stroke-width='1.5' fill='none' stroke-linecap='round'/></svg>\")",
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
    paddingRight: 32,
  };
  return (
    <div className="card">
      <div className="kicker" style={{ marginBottom: 6 }}>Career path</div>
      <select
        value={activePath}
        onChange={(e) => setActivePath(e.target.value)}
        style={selectStyle}
        aria-label="Career path"
      >
        {PATH_ORDER.map((k) => {
          const p = PATHS[k];
          if (!p) return null;
          const pp = pathProgress(k, completed);
          return (
            <option key={k} value={k}>{p.icon} {p.name} · {Math.round(pp.pct * 100)}%</option>
          );
        })}
      </select>
    </div>
  );
}

// Daily Practice — 5-question random session sampled deterministically
// across ALL paths/levels by day index. The user answers one question at a
// time (pick A/B/C, auto-graded on click) and clicks Next to advance; on
// the last question Next closes the session and shows a "today's practice
// complete" card. (The old typed free-recall mode was removed by owner
// decision — every testing surface is MCQ + immediate feedback now; a
// legacy settings.practiceMode key may linger in old persists, ignored.)
//
// Session progress (verdicts + done flag) is persisted in the store's
// dailyPractice slot — see useStore.js. The question list is deterministic
// per local day (pickDailySession), so verdicts-by-index are all that's
// needed to rehydrate after a remount.

// Local-calendar day stamp, 'YYYY-MM-DD'. Mirrors the store's internal
// isoDay() (not exported) so dailyPractice.date comparisons line up.
function localIsoDay(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Module-level cache for the lazily-loaded question bank. The bank is ~half
// of the old content.js and is used ONLY here, so it's split into its own
// chunk (src/data/dailyQuestions.js) and fetched on first DailyPractice
// mount. Once resolved, remounts reuse it synchronously — no skeleton flash.
let dailyQuestionsMod = null;

function DailyPractice() {
  // Same 5 picks for the whole calendar day. The picks come from the lazy
  // dailyQuestions chunk; `session` is null while that chunk loads (a small
  // skeleton renders below). The dayIndex-based seed keeps the result stable
  // within a day, so loading async can't change which questions appear.
  const [session, setSession] = useState(() => (
    dailyQuestionsMod ? dailyQuestionsMod.pickDailySession() : null
  ));
  useEffect(() => {
    let cancelled = false;
    const apply = (m) => {
      dailyQuestionsMod = m;
      // Keep the existing array identity if the initializer already seeded it
      // (cached module) — avoids a pointless re-render of the chips row.
      if (!cancelled) setSession((cur) => cur || m.pickDailySession());
    };
    if (dailyQuestionsMod) apply(dailyQuestionsMod);
    else import('../data/dailyQuestions.js').then(apply);
    return () => { cancelled = true; };
  }, []);
  // Pull recordActivity off the store directly to keep finalization stable.
  const recordActivity = useStore((st) => st.recordActivity);
  // recordQuizMiss feeds Review Weak Spots on wrong MCQ answers.
  const recordQuizMiss = useStore((st) => st.recordQuizMiss);
  // XP / badge wiring for Engagement Tier B.
  const addXp = useStore((st) => st.addXp);
  const grantBadge = useStore((st) => st.grantBadge);
  const badges = useStore((st) => st.badges) || {};

  // Persisted session progress. The whole session used to live in component
  // state, so navigating away and back reset to question 1 and re-awarded
  // +8 / +12 / +20 XP without limit. The store now owns one slot per local
  // calendar day; verdicts are written through recordDailyAnswer and XP is
  // gated on its first-answer return value.
  const dailyPractice = useStore((st) => st.dailyPractice);
  const recordDailyAnswer = useStore((st) => st.recordDailyAnswer);
  const markDailyPracticeDone = useStore((st) => st.markDailyPracticeDone);
  const today = localIsoDay();
  // Today's verdict map: { [questionIdx]: 'right' | 'wrong' }. Empty when the
  // slot belongs to a previous day (fresh session).
  const storeAnswered = (dailyPractice && dailyPractice.date === today && dailyPractice.answered) || {};
  // Done card shows only when TODAY's slot is latched — yesterday's done flag
  // must not suppress a fresh session.
  const done = !!(dailyPractice && dailyPractice.date === today && dailyPractice.done);

  // MCQ state: picks[i] = chosen option index (or undefined). Local-only —
  // it drives the "which option did I click" highlight within this mount;
  // the verdict itself lives in the store.
  const [picks, setPicks] = useState({});

  // Resume at the first unanswered question of today's session; when every
  // question is answered but Finish wasn't clicked, park on the last one so
  // the Finish button stays reachable.
  const [idx, setIdx] = useState(() => {
    const dp = useStore.getState().dailyPractice;
    const ans = (dp && dp.date === localIsoDay() && dp.answered) || {};
    // Sessions are always 5 picks; fall back to 5 while the chunk loads so
    // the resume index lands the same as it did with a sync question list.
    const n = (session && session.length) || 5;
    for (let i = 0; i < n; i++) if (ans[i] == null) return i;
    return n - 1;
  });

  const total = (session && session.length) || 5;
  const Q = session ? session[idx] : null;

  // "answered" gates the feedback panel and Next button — an option was
  // clicked this mount, or a verdict hydrated from an earlier mount today.
  const picked = picks[idx];
  const storeVerdict = storeAnswered[idx];
  const answered = (picked !== undefined && picked !== null) || storeVerdict !== undefined;

  // One verdict per question per day.
  const correctCount = Object.values(storeAnswered).filter((g) => g === 'right').length;

  // --- MCQ handlers --------------------------------------------------------
  const submit = (i) => {
    if (answered) return;
    setPicks((p) => ({ ...p, [idx]: i }));
    const verdict = Q && i === Q.answer ? 'right' : 'wrong';
    // recordDailyAnswer returns true only the FIRST time this question index
    // is answered today — XP is gated on that edge so a remount can't farm
    // it. +4 keeps a light daily tap below review:good's +6 (the economy's
    // law: doing > answering > reading).
    const first = recordDailyAnswer?.(idx, verdict) === true;
    if (first && verdict === 'right') addXp?.(4, 'daily:correct');
    // Wrong answers feed Review Weak Spots (synthetic lessonId — daily
    // questions aren't anchored to one lesson; WeakSpots keys off prompt).
    if (first && verdict === 'wrong' && Q?.q) {
      recordQuizMiss?.('__daily_practice__', Q.q, null);
    }
  };

  const advance = () => {
    if (!answered) return;
    if (idx < total - 1) {
      setIdx(idx + 1);
    } else {
      // Latch today's done flag in the store — the done card renders off it,
      // and markDailyPracticeDone returns true exactly once per day so the
      // perfect bonus below can't repeat across remounts.
      const latched = markDailyPracticeDone?.() === true;
      // Daily Practice completion counts as a streak-bearing activity.
      // recordActivity is same-day idempotent, so this stays safe even if
      // the latch already happened on an earlier mount.
      recordActivity?.();
      // Perfect-session bonus: +20 XP and the daily:perfect badge when all
      // verdicts are 'right'. Read the post-grade answered map straight from
      // the store — the final verdict landed in recordDailyAnswer before
      // Finish became clickable, so this sees all of today's verdicts.
      if (latched) {
        const dp = useStore.getState().dailyPractice;
        const verdicts = (dp && dp.date === today && dp.answered) || {};
        const allRight = total > 0
          && Object.keys(verdicts).length >= total
          && Object.values(verdicts).every((v) => v === 'right');
        if (allRight) {
          addXp?.(20, 'daily:perfect');
          if (!badges['daily:perfect']) grantBadge?.('daily:perfect');
        }
      }
    }
  };

  // Keyboard shortcuts.
  //   MCQ:    1/2/3 to pick when unanswered, Enter/Right to advance.
  //   Recall: Enter to reveal (when not revealed) or advance (when graded).
  //   We deliberately don't bind keys for self-grade — the explicit click
  //   keeps people honest. Typing in the textarea is ignored here.
  useEffect(() => {
    // No bindings while done OR while the question chunk is still loading —
    // a hydrated mid-session verdict would otherwise let Enter advance `idx`
    // against questions that aren't on screen yet.
    if (done || !session) return undefined;
    const onKey = (e) => {
      const tag = e.target?.tagName;
      // Typing guard for BOTH modes: keystrokes that land while an input,
      // textarea, or select has focus must never grade or advance — digits
      // typed with the career <select> focused were submitting MCQ answers.
      // BUTTON is ignored too: Enter on a focused button (mode pill, streak
      // toggle) already activates it, so advancing as well double-fired.
      if (tag === 'TEXTAREA' || tag === 'INPUT' || tag === 'SELECT' || tag === 'BUTTON') return;
      if (!answered) {
        if (e.key === '1' || e.key === '2' || e.key === '3') {
          const i = parseInt(e.key, 10) - 1;
          if (Q && i < (Q.opts || []).length) submit(i);
        }
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        advance();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answered, idx, done, session]);

  if (done) {
    return (
      <div className="card fade-in">
        <div className="row" style={{ marginBottom: 10 }}>
          <span className="kicker">⚡ DAILY PRACTICE</span>
          <span className="spacer" />
          <span className="dp-session-counter">
            <span>{total}/{total}</span>
            <span>·</span>
            <span className="dp-counter-correct">{correctCount} ✓</span>
          </span>
        </div>
        <div className="dp-session-done">
          <span className="dp-session-tick">✓</span>
          Today&apos;s practice complete — see you tomorrow.
        </div>
      </div>
    );
  }

  // Question chunk still loading (first DailyPractice mount this page-load).
  // Small skeleton keeps the card's slot in the layout instead of popping in.
  // Placed AFTER the done check so an already-finished day renders its done
  // card instantly — that state needs no questions.
  if (!session) {
    return (
      <div className="card" aria-busy="true">
        <div className="row" style={{ marginBottom: 10 }}>
          <span className="kicker">⚡ DAILY PRACTICE</span>
          <span className="spacer" />
          <span className="dp-session-counter"><span>…</span></span>
        </div>
        <div className="caption">Loading today&apos;s questions…</div>
      </div>
    );
  }

  // No questions in the pool — nothing to render.
  if (!Q) {
    return null;
  }

  // Per-question chip state — mode-agnostic, read straight off the persisted
  // verdict map so chips survive remounts and mid-session mode switches.
  const chipState = (i) => {
    const g = storeAnswered[i];
    return { wasAnswered: g !== undefined, isCorrect: g === 'right' };
  };

  return (
    <div className="card">
      <div className="row" style={{ marginBottom: 10 }}>
        <span className="kicker">⚡ DAILY PRACTICE</span>
        <span className="spacer" />
        <span className="dp-session-counter">
          <span>{idx + 1}/{total}</span>
          <span>·</span>
          <span className="dp-counter-correct">{correctCount} ✓</span>
        </span>
      </div>

      {/* Progress chips: 1 ✓ 2 ✓ 3 4 5 — done get ✓/✗, current gets amber outline. */}
      <div className="dp-session-chips" aria-label="Session progress">
        {session.map((item, i) => {
          const { wasAnswered, isCorrect } = chipState(i);
          let cls = 'dp-chip';
          if (i === idx) cls += ' dp-chip-current';
          else if (wasAnswered && isCorrect) cls += ' dp-chip-done';
          else if (wasAnswered && !isCorrect) cls += ' dp-chip-wrong';
          return (
            <span key={i} className={cls} aria-label={`Question ${i + 1}`}>
              {wasAnswered ? (isCorrect ? '✓' : '✗') : i + 1}
            </span>
          );
        })}
      </div>

      <p style={{ fontSize: 14, margin: '0 0 12px', fontWeight: 500 }}>{Q.q}</p>

      {!answered && (
        <div className="caption mono" style={{ fontSize: 11, opacity: 0.6, marginBottom: 8 }}>
          Press 1 / 2 / 3 or click to answer.
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {Q.opts.map((o, i) => {
          const correct = i === Q.answer;
          const wasPicked = picked === i;
          let cls = 'btn dp-option';
          if (answered && correct) cls += ' dp-correct';
          else if (answered && wasPicked) cls += ' dp-wrong';
          return (
            <button key={i} className={cls} disabled={answered} onClick={() => submit(i)}>
              <span className="dp-letter">{String.fromCharCode(65 + i)}</span>
              <span className="dp-text">{o}</span>
              {answered && correct  && <span className="dp-mark">✓</span>}
              {answered && wasPicked && !correct && <span className="dp-mark">✗</span>}
            </button>
          );
        })}
      </div>

      {/* Feedback reveals only after an option is clicked. */}
      {answered && (
        <FeedbackPanel
          question={Q}
          picked={picked !== undefined && picked !== null
            ? picked
            // Hydrated answer — the chosen option index isn't persisted,
            // only the verdict, so synthesize a matching index.
            : (storeVerdict === 'right' ? Q.answer : -1)}
        />
      )}

      {answered && (
        <div className="row" style={{ marginTop: 14, justifyContent: 'flex-end' }}>
          <button className="btn btn-primary" onClick={advance}>
            {idx === total - 1 ? 'Finish ✓' : 'Next →'}
          </button>
        </div>
      )}
    </div>
  );
}
