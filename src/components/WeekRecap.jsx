import { useMemo } from 'react';
import { useStore } from '../store/useStore.js';

// "This week" recap card — a lightweight Wrapped-style summary of the last 7
// days (XP, days active, lessons, streak). Derived from the store's rolling
// per-day dailyStats counters + the activityDays log; renders nothing until
// there's something to show. (The old version summed xpHistory, but that log
// is capped at 20 entries — an active day generates 20+ gains, so weekly
// totals undercounted badly for exactly the users a recap should flatter.)

const iso = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export default function WeekRecap() {
  const dailyStats = useStore((s) => s.dailyStats);
  const activityDays = useStore((s) => s.activityDays);
  const streak = useStore((s) => s.streak);

  const stats = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const cutoff = new Date(today); cutoff.setDate(cutoff.getDate() - 6);
    const cutoffKey = iso(cutoff);
    const inWeek = (k) => typeof k === 'string' && k >= cutoffKey; // ISO days sort lexically

    let xp = 0;
    let lessons = 0;
    const days = new Set((activityDays || []).filter(inWeek));
    for (const [day, entry] of Object.entries(dailyStats || {})) {
      if (!inWeek(day) || !entry) continue;
      xp += entry.xp || 0;          // post-multiplier XP, every gain counted
      lessons += entry.lessons || 0;
      if ((entry.xp || 0) > 0 || (entry.lessons || 0) > 0 || (entry.reviews || 0) > 0) {
        days.add(day);
      }
    }
    return { xp, lessons, days: days.size };
  }, [dailyStats, activityDays]);

  if (stats.xp === 0 && stats.days === 0) return null;

  return (
    <div className="card week-recap">
      <div className="kicker week-recap-kicker">📅 This week</div>
      <div className="week-recap-stats">
        <div className="wr-stat"><span className="wr-num">{stats.xp}</span><span className="wr-lbl">XP</span></div>
        <div className="wr-stat"><span className="wr-num">{stats.days}</span><span className="wr-lbl">days active</span></div>
        <div className="wr-stat"><span className="wr-num">{stats.lessons}</span><span className="wr-lbl">lessons</span></div>
        <div className="wr-stat"><span className="wr-num">{streak}</span><span className="wr-lbl">day streak</span></div>
      </div>
    </div>
  );
}
