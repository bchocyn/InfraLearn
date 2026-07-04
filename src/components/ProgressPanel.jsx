import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../store/useStore.js';
import { readReviewEvents, retentionCurve } from '../data/evidenceLog.js';

// Home "Your progress" card: a GitHub-style consistency heatmap. Reads the
// existing store — the heatmap unions the new activityDays log with xpHistory
// dates so it shows data even before activityDays has filled in.

const iso = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

const WEEKS = 18;

function StreakHeatmap() {
  const activityDays = useStore((s) => s.activityDays);
  const xpHistory = useStore((s) => s.xpHistory);
  const lastDay = useStore((s) => s.lastActivityDate);
  const streak = useStore((s) => s.streak);
  const highWater = useStore((s) => s.streakHighWater);

  const { cols, total } = useMemo(() => {
    const active = new Set(activityDays || []);
    (xpHistory || []).forEach((e) => { if (e && e.at) active.add(e.at); });
    if (lastDay) active.add(lastDay);

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayKey = iso(today);
    const lastSunday = addDays(today, -today.getDay());
    const firstSunday = addDays(lastSunday, -(WEEKS - 1) * 7);

    const out = [];
    for (let c = 0; c < WEEKS; c++) {
      const col = [];
      for (let r = 0; r < 7; r++) {
        const d = addDays(firstSunday, c * 7 + r);
        const k = iso(d);
        col.push({ k, on: active.has(k), isToday: k === todayKey, future: d > today });
      }
      out.push(col);
    }
    return { cols: out, total: active.size };
  }, [activityDays, xpHistory, lastDay]);

  return (
    <div className="heatmap-wrap">
      <div className="heatmap" role="img" aria-label={`${total} active days; current streak ${streak} days`}>
        {cols.map((col, ci) => (
          <div className="heatmap-col" key={ci}>
            {col.map((cell, ri) => (
              <span
                key={ri}
                className={`heatmap-cell${cell.on ? ' on' : ''}${cell.isToday ? ' today' : ''}${cell.future ? ' future' : ''}`}
                title={cell.k}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="heatmap-meta">
        <span>🔥 {streak}-day streak</span>
        <span className="spacer" />
        <span>{total} active days · best {Math.max(highWater || 0, streak)}</span>
      </div>
    </div>
  );
}

// Confidence calibration — per stated confidence level (from daily challenges),
// the share you got right. Surfaces over/under-confidence over time.
function CalibrationReadout() {
  const calibration = useStore((s) => s.calibration);
  const LEVELS = [
    { key: 'certain', label: '💪 Certain' },
    { key: 'likely', label: '👍 Likely' },
    { key: 'guess', label: '🤷 Guess' },
  ];
  const total = LEVELS.reduce((n, l) => n + ((calibration && calibration[l.key] && calibration[l.key].total) || 0), 0);
  if (!total) return null;
  return (
    <div className="calib-readout">
      <div className="calib-title">Confidence calibration <span className="calib-sub">· daily challenges</span></div>
      {LEVELS.map((l) => {
        const slot = (calibration && calibration[l.key]) || { right: 0, total: 0 };
        const pct = slot.total ? Math.round((slot.right / slot.total) * 100) : 0;
        return (
          <div className="calib-row" key={l.key}>
            <span className="calib-label">{l.label}</span>
            <div className="calib-bar">
              <span className="calib-bar-fill" style={{ width: slot.total ? `${pct}%` : '0%' }} />
            </div>
            <span className="calib-val mono">{slot.total ? `${slot.right}/${slot.total}` : '—'}</span>
          </div>
        );
      })}
    </div>
  );
}

// Personal forgetting curve — the north-star made visible. For each gap
// band, the share of graded recalls that held (grade >= 3), read from the
// append-only evidence log. This is what makes "users retain long-term"
// FALSIFIABLE for the user themself: if the 15-30d bar is strong, the
// spacing engine is doing its job; if it sags, the schedule needs work.
function RetentionCurveReadout() {
  const [curve, setCurve] = useState(null);
  useEffect(() => {
    let live = true;
    readReviewEvents().then((events) => {
      if (live) setCurve(retentionCurve(events));
    });
    return () => { live = false; };
  }, []);
  const bands = (curve || []).filter((b) => b.total > 0);
  // Needs a little real evidence before it says anything.
  const totalEvents = bands.reduce((n, b) => n + b.total, 0);
  if (totalEvents < 5) return null;
  return (
    <div className="calib-readout">
      <div className="calib-title">Your forgetting curve <span className="calib-sub">· recall held, by gap</span></div>
      {bands.map((b) => (
        <div className="calib-row" key={b.label}>
          <span className="calib-label mono">{b.label}</span>
          <div className="calib-bar">
            <span className="calib-bar-fill" style={{ width: `${Math.round((b.pct || 0) * 100)}%` }} />
          </div>
          <span className="calib-val mono">{Math.round((b.pct || 0) * 100)}% · {b.total}</span>
        </div>
      ))}
    </div>
  );
}

export default function ProgressPanel() {
  return (
    <div className="card progress-panel">
      <div className="kicker" style={{ marginBottom: 8 }}>Your progress</div>
      <StreakHeatmap />
      <RetentionCurveReadout />
      <CalibrationReadout />
    </div>
  );
}
