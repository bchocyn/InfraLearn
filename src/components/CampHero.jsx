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
        text: `The watchfires gutter, Keeper — ${dueCount} wraith${dueCount === 1 ? '' : 's'} on the patrol route.`,
        to: '/watchfire',
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
          text: `A relay waits in ${prov.name} — Chapter ${nextCh} is ready to walk.`,
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
        {/* Pixel-art camp backdrop (pixellab, public/worldmap/camp-*.png) over
            the sky-gradient fallback. Dawn/day share the day scene, dusk/night
            the night one — tent left, fire at ~29%, open ground on the right
            where the Keeper and beast stand. NOTE for the keyer script: these
            are FULL-BLEED scenes, excluded from key-worldmap.mjs by name. */}
        <img
          className="camp-scene-art"
          src={`${import.meta.env.BASE_URL}worldmap/camp-${tod === 'night' || tod === 'dusk' ? 'night' : 'day'}.png`}
          alt=""
          aria-hidden="true"
          draggable={false}
        />
        {/* Watchfire glow — breathes over the art's fire (static under
            reduced motion via .camp-static). */}
        <span className="camp-fire-glow" aria-hidden="true" />

        {/* Keeper at the fire, beast beside it. HTML overlay > foreignObject. */}
        <div className="camp-avatar" aria-hidden="true">
          <AvatarSprite avatar={avatar} size={64} />
        </div>
        <div className={`camp-beast${sleepy ? ' camp-beast-sleepy' : ''}`} aria-hidden="true">
          <BeastSprite species={companion} tier={beastTier} size={62} />
          {sleepy && <span className="camp-zzz">z z</span>}
          {badgeToday && !sleepy && <span className="camp-sparkle">✦</span>}
        </div>

        {/* Identity strip — ONE line (the old two-row kicker+meta stack was
            the panel's biggest noise source; the epithet lives on the
            Roadmap's province banner where it belongs). */}
        <div className="camp-info">
          <div className="camp-form-row">
            <span className="camp-form-name">{formName}</span>
            <span className="camp-form-meta">
              T{beastTier} {ELEMENTS[beast.element].icon} · {prov.name.toUpperCase()}
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
