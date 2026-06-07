import { useMemo } from 'react';
import { useStore } from '../store/useStore.js';

// "This week" recap card — a lightweight Wrapped-style summary of the last 7
// days (XP, days active, lessons, streak). Derived from xpHistory + the
// activityDays log; renders nothing until there's something to show.

const iso = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export default function WeekRecap() {
  const xpHistory = useStore((s) => s.xpHistory);
  const activityDays = useStore((s) => s.activityDays);
  const streak = useStore((s) => s.streak);

  const stats = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const cutoff = new Date(today); cutoff.setDate(cutoff.getDate() - 6);
    const cutoffKey = iso(cutoff);
    const inWeek = (k) => typeof k === 'string' && k >= cutoffKey; // ISO days sort lexically

    const hist = (xpHistory || []).filter((e) => e && inWeek(e.at));
    const xp = hist.reduce((sum, e) => sum + (e.amount || 0), 0);
    const lessons = hist.filter((e) => typeof e.reason === 'string'
      && (e.reason.startsWith('lesson:') || e.reason.startsWith('lab:'))).length;
    const days = new Set((activityDays || []).filter(inWeek));
    hist.forEach((e) => days.add(e.at));
    return { xp, lessons, days: days.size };
  }, [xpHistory, activityDays]);

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
