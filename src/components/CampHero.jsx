// CampHero — Home's "Keeper and companion at camp" hero panel (journey §11).
// Replaces the static beast strip. A layered scene: time-of-day sky, two
// parallax hill bands, a flickering watchfire, the Keeper avatar and the
// beast breathing beside it. The beast's mood mirrors retention state —
// sleepy with zzz when ≥5 reviews are due, sparkling when a badge landed
// today — a gentle, non-punitive nudge (the pet never looks punished).
//
// The speech bubble cycles short barks that double as story hooks; tapping
// it deep-links to the GATING ACTION (reviews / next lesson / practice),
// not just the ByteBeast tab. Tapping anywhere else on the stage opens
// ByteBeast like the old strip did.
//
// reducedMotion (the user setting AND the media query, via CSS) disables
// the drift/flicker/breathing layers and pins the bubble to its first bark.

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore, beastForm, getReviewsDue, journeyGate } from '../store/useStore.js';
import { JOURNEY_CHAPTERS } from '../data/lore.js';
import { BEASTS, ELEMENTS } from '../data/beasts.js';
import { PATHS } from '../data/content.js';
import { PROVINCES, FIVE_LAPSES } from '../data/lore.js';
import BeastSprite from './BeastSprite.jsx';
import AvatarSprite from './AvatarSprite.jsx';

// Local-calendar day stamp — mirrors the store's internal isoDay() so the
// "today" comparisons line up with dailyPractice/badge dates.
function localIsoDay(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Sky palette key by local hour. Computed once per mount — a session that
// straddles a boundary repaints on the next Home visit, which is enough.
function timeOfDay(h = new Date().getHours()) {
  if (h >= 5 && h < 8) return 'dawn';
  if (h >= 8 && h < 17) return 'day';
  if (h >= 17 && h < 20) return 'dusk';
  return 'night';
}

const BARK_CYCLE_MS = 8000;

export default function CampHero() {
  const nav = useNavigate();
  const companion = useStore((s) => s.companion);
  const beastTier = useStore((s) => s.beastTier);
  const avatar = useStore((s) => s.avatar);
  const activePath = useStore((s) => s.activePath);
  const completed = useStore((s) => s.completed);
  const reviewQueue = useStore((s) => s.reviewQueue);
  const badges = useStore((s) => s.badges);
  const dailyPractice = useStore((s) => s.dailyPractice);
  const reducedMotion = useStore((s) => s.settings?.reducedMotion);
  const journey = useStore((s) => s.journey);
  const beastTiers = useStore((s) => s.beastTiers);
  const streakHighWater = useStore((s) => s.streakHighWater);

  const beast = BEASTS[companion] || BEASTS.dragon;
  const formName = beastForm({ companion, beastTier });
  const prov = PROVINCES[activePath] || PROVINCES.devops;
  const lapse = FIVE_LAPSES[prov.lapse];
  const path = PATHS[activePath] || PATHS.devops;
  const today = localIsoDay();
  const tod = useMemo(() => timeOfDay(), []);

  const dueCount = useMemo(
    () => getReviewsDue({ reviewQueue: reviewQueue || {} }).length,
    [reviewQueue, today], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const practiceDone = !!(dailyPractice && dailyPractice.date === today && dailyPractice.done);
  const nextLesson = path.lessons.find((l) => !completed[l.id]);
  const badgeToday = Object.values(badges || {}).some((b) => b?.unlockedAt === today);

  // Mood: sleepy droop wins (it's the actionable one); sparkle is additive.
  const sleepy = dueCount >= 5;

  // Barks in gating-priority order. Each one's tap target is the action that
  // unblocks it — the forcing loop made visible (§10 "camp hero panel").
  const barks = useMemo(() => {
    const out = [];
    if (dueCount > 0) {
      out.push({
        text: `The watchfires gutter, Keeper — ${dueCount} patrol${dueCount === 1 ? '' : 's'} wait${dueCount === 1 ? 's' : ''}.`,
        to: '/reviews',
      });
    }
    if (nextLesson) {
      out.push({
        text: `${prov.name} stirs. “${nextLesson.title}” lies ahead.`,
        to: `/lesson/${nextLesson.id}`,
      });
    }
    if (!practiceDone) {
      out.push({
        text: 'Camp drills before nightfall keep the blade sharp.',
        scrollTo: '#daily-practice',
      });
    }
    // A journey chapter whose gate is met but not yet entered — the story
    // hook that surfaces the forcing loop (§10 camp hero panel).
    {
      const cur = journey?.[activePath] || { chapter: 0, paid: 0 };
      const nextCh = cur.chapter + 1;
      if (cur.paid < nextCh && nextCh <= JOURNEY_CHAPTERS.length
        && journeyGate(activePath, nextCh, { completed, beastTiers, streakHighWater }).met) {
        out.push({
          text: `A relay waits in ${prov.name}. Chapter ${nextCh} asks ${JOURNEY_CHAPTERS[nextCh - 1].cost} ⟡ at the threshold.`,
          to: '/journey',
        });
      }
    }
    if (out.length === 0) {
      out.push({
        text: lapse ? `All quiet. ${lapse.name} ${lapse.title} watches from beyond the fire.` : prov.intro,
        to: '/roadmap',
      });
    }
    return out;
  }, [dueCount, nextLesson, practiceDone, prov, lapse, journey, activePath, completed, beastTiers, streakHighWater]);

  // Cycle barks; pinned to the first (highest-priority) one under reduced
  // motion or when there's only one to show.
  const [barkIdx, setBarkIdx] = useState(0);
  useEffect(() => {
    setBarkIdx(0);
    if (reducedMotion || barks.length < 2) return undefined;
    const t = setInterval(() => setBarkIdx((i) => (i + 1) % barks.length), BARK_CYCLE_MS);
    return () => clearInterval(t);
  }, [barks, reducedMotion]);
  const bark = barks[barkIdx] || barks[0];

  const onBark = (e) => {
    e.stopPropagation();
    if (bark.to) nav(bark.to);
    else if (bark.scrollTo) {
      document.querySelector(bark.scrollTo)?.scrollIntoView({
        behavior: reducedMotion ? 'auto' : 'smooth',
        block: 'center',
      });
    }
  };

  const motionCls = reducedMotion ? ' camp-static' : '';

  return (
    <div className={`camp-hero${motionCls}`}>
      <button
        type="button"
        className={`camp-stage camp-sky-${tod}`}
        onClick={() => nav('/beast')}
        aria-label={`Open Byte Beast: ${formName}, tier ${beastTier}. ${dueCount > 0 ? `${dueCount} reviews due.` : ''}`}
      >
        {/* Scene scaffolding — stars, hills, watchfire. Pure SVG, pixel-style. */}
        <svg
          className="camp-scene"
          viewBox="0 0 400 170"
          preserveAspectRatio="xMidYMax slice"
          shapeRendering="crispEdges"
          aria-hidden="true"
        >
          {(tod === 'night' || tod === 'dusk') && (
            <g className="camp-stars" fill="#F4EFE3">
              <rect x="48" y="22" width="2" height="2" />
              <rect x="120" y="38" width="2" height="2" />
              <rect x="208" y="16" width="2" height="2" />
              <rect x="300" y="30" width="3" height="3" />
              <rect x="356" y="52" width="2" height="2" />
            </g>
          )}
          {tod === 'day' && <circle cx="330" cy="34" r="14" fill="#F5D87A" opacity="0.9" />}
          {tod === 'night' && <circle cx="330" cy="34" r="11" fill="#D8D4C8" opacity="0.85" />}
          {/* Back hills drift slower than front — two-layer parallax. */}
          <g className="camp-hills-back">
            <polygon points="0,170 0,118 70,92 150,122 240,86 330,118 400,98 400,170" fill="var(--camp-hill-back, #2E2A36)" />
          </g>
          <g className="camp-hills-front">
            <polygon points="0,170 0,140 90,116 190,142 290,112 400,136 400,170" fill="var(--camp-hill-front, #211E28)" />
          </g>
          {/* Watchfire — logs, layered flame, amber glow. */}
          <g transform="translate(196, 128)">
            <circle className="camp-glow" cx="6" cy="6" r="34" fill="#F5B842" opacity="0.13" />
            <rect x="-8" y="16" width="28" height="4" fill="#4A3520" />
            <rect x="-2" y="13" width="18" height="4" fill="#6B4226" />
            <g className="camp-flame">
              <rect x="0" y="-2" width="12" height="16" fill="#E07856" />
              <rect x="2" y="-8" width="8" height="10" fill="#F5B842" />
              <rect x="4" y="-12" width="4" height="6" fill="#F5D87A" />
            </g>
          </g>
        </svg>

        {/* Keeper at the fire, beast beside it. HTML overlay > foreignObject. */}
        <div className="camp-avatar" aria-hidden="true">
          <AvatarSprite avatar={avatar} size={34} />
        </div>
        <div className={`camp-beast${sleepy ? ' camp-beast-sleepy' : ''}`} aria-hidden="true">
          <BeastSprite species={companion} tier={beastTier} size={62} />
          {sleepy && <span className="camp-zzz">z z</span>}
          {badgeToday && !sleepy && <span className="camp-sparkle">✦</span>}
        </div>

        {/* Province + beast identity strip. */}
        <div className="camp-info">
          <div className="camp-kicker">{prov.name.toUpperCase()} · {prov.epithet.toUpperCase()}</div>
          <div className="camp-form-row">
            <span className="camp-form-name">{formName}</span>
            <span className="camp-form-meta">
              TIER {beastTier} · {ELEMENTS[beast.element].icon} {beast.name.toUpperCase()}
            </span>
            <span className="camp-arrow">→</span>
          </div>
        </div>
      </button>

      {/* Speech bubble — sibling of the stage button (no nested interactive
          elements). Tap goes to the bark's gating action. */}
      <button type="button" className="camp-bubble" onClick={onBark} key={barkIdx}>
        {bark.text}
      </button>
    </div>
  );
}
