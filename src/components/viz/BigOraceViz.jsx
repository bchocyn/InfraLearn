// BigOraceViz — interactive Big-O race.
//
// Five horizontal bars (O(1), O(log n), O(n), O(n log n), O(n²)) grow as the
// user drags an N slider on a log scale from 10 to 1,000,000. Bars are
// normalized to the slowest curve in view (O(n²) for n>1); when O(n²) blows
// past the canvas, we render a dotted run-off pattern + the actual value to
// the right so the "n² is THAT bad" moment lands without rescaling everything
// every frame.
//
// Pure React + SVG. No deps. CSS transition on bar widths keeps the drag
// smooth (200ms ease-out, applied via inline style on each <rect>).
import { useState } from 'react';
import { Slider, VizCanvas, VizLegend } from './widgets.jsx';

// Canvas user-space dimensions. VizCanvas scales this fluidly to viewport.
const VB_W = 360;
const VB_H = 240;

// Bar geometry inside the viewbox.
const LABEL_W = 76;            // left gutter for "O(n log n)" labels
const VALUE_W = 64;             // right gutter for the formatted value
const BAR_X = LABEL_W;          // bars start here
const BAR_MAX_W = VB_W - LABEL_W - VALUE_W; // max drawable bar width
const BAR_H = 28;               // bar thickness
const BAR_GAP = 12;             // vertical gap between bars
const TOP_PAD = 12;             // top padding inside viewbox

// Slider drives n on a log scale: slider value s in [1, 6] maps to n = 10^s.
// Step of 0.01 makes the drag feel continuous without flooding state churn.
const S_MIN = 1;
const S_MAX = 6;
const S_STEP = 0.01;
const S_DEFAULT = 2; // n = 100 — close to the inflection where n² starts to bite

// One row per complexity class.
const SERIES = [
  { key: 'O1',    label: 'O(1)',       color: 'var(--el-earth)',     fn: () => 1 },
  { key: 'OlogN', label: 'O(log n)',   color: 'var(--el-water)',     fn: (n) => Math.log2(n) },
  { key: 'ON',    label: 'O(n)',       color: 'var(--accent-amber)', fn: (n) => n },
  { key: 'ONlogN',label: 'O(n log n)', color: 'var(--el-sky)',       fn: (n) => n * Math.log2(n) },
  { key: 'ON2',   label: 'O(n²)',      color: 'var(--el-fire)',      fn: (n) => n * n },
];

// Format a number for the right-side readout.
//   <1000    → integer with comma separators
//   <1M      → e.g. "12.3K"
//   ≥1M      → e.g. "1.2M"
// Anything past ~1e12 (i.e. n²=1e12 at n=1e6) gets "B"/"T" suffixes so the
// O(n²) row stays readable at the high end of the slider.
function fmtVal(v) {
  if (!isFinite(v)) return '∞';
  if (v < 1000) return Math.round(v).toLocaleString('en-US');
  if (v < 1e6) return (v / 1e3).toFixed(1) + 'K';
  if (v < 1e9) return (v / 1e6).toFixed(1) + 'M';
  if (v < 1e12) return (v / 1e9).toFixed(1) + 'B';
  return (v / 1e12).toFixed(1) + 'T';
}

// Format n for the slider readout — always comma-separated integer.
function fmtN(n) {
  return Math.round(n).toLocaleString('en-US');
}

export default function BigOraceViz() {
  // Single piece of state: the slider position (log10 of n). We derive n and
  // every bar length from this on each render — cheap, and keeps the
  // controlled-input wiring trivial.
  const [s, setS] = useState(S_DEFAULT);
  const n = Math.pow(10, s);

  // Compute raw values once per render.
  const values = SERIES.map((sr) => sr.fn(n));

  // Normalization target: the max value across all series. For n>1 this is
  // always O(n²), but computing it generically keeps the code honest if the
  // series list ever changes.
  const maxVal = Math.max(...values, 1);

  // Bars get normalized to BAR_MAX_W. If a series would render wider than the
  // canvas (which only happens if we ever rescale to something smaller than
  // maxVal — currently they all fit since maxVal IS the largest), we cap the
  // width and flag it so the row renders a "runs off" indicator.
  const rows = SERIES.map((sr, i) => {
    const v = values[i];
    const frac = v / maxVal;            // 0..1
    const wRaw = frac * BAR_MAX_W;
    const w = Math.min(wRaw, BAR_MAX_W);
    // "overflow" means the bar visually fills the canvas AND there are other
    // bars dwarfed by it — i.e. this is the runaway curve. We mark the
    // largest series as overflowing whenever its normalized width hits the
    // ceiling AND its value is meaningfully bigger than the runner-up. That
    // triggers the dotted run-off pattern past the bar.
    return { ...sr, v, w, frac };
  });

  // Identify the "runaway" row: largest value, AND ≥2× the runner-up. When
  // true we render the dotted overflow pattern past the bar end to signal
  // "this keeps going off-canvas".
  const sortedDesc = [...values].sort((a, b) => b - a);
  const top = sortedDesc[0];
  const runnerUp = sortedDesc[1] || 0;
  const hasRunaway = top > 0 && runnerUp > 0 && top / runnerUp >= 2;

  const legendItems = SERIES.map((sr) => ({ label: sr.label, color: sr.color }));

  return (
    <div className="viz-bigorace">
      <Slider
        label="N (input size)"
        min={S_MIN}
        max={S_MAX}
        step={S_STEP}
        value={s}
        onChange={setS}
        format={(sv) => fmtN(Math.pow(10, sv))}
      />

      <VizCanvas width={VB_W} height={VB_H}>
        {/* Dotted "runs off canvas" pattern — used as fill for a thin strip
            past the runaway bar. Repeating linear dots @ ~6px so it reads as
            "keeps going" on a phone without looking like noise. */}
        <defs>
          <pattern
            id="bigorace-runoff"
            width="6"
            height={BAR_H}
            patternUnits="userSpaceOnUse"
          >
            <circle cx="3" cy={BAR_H / 2} r="1.4" fill="var(--el-fire)" opacity="0.55" />
          </pattern>
        </defs>

        {rows.map((row, i) => {
          const y = TOP_PAD + i * (BAR_H + BAR_GAP);
          // Mark this row as the runaway if it's the top value and the gap
          // to runner-up is large enough.
          const isRunaway = hasRunaway && row.v === top;
          return (
            <g key={row.key}>
              {/* Left label — mono uppercase to match the rest of the app. */}
              <text
                x={LABEL_W - 8}
                y={y + BAR_H / 2}
                textAnchor="end"
                dominantBaseline="middle"
                fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                fontSize="12"
                fill="var(--text-2, #555)"
              >
                {row.label}
              </text>

              {/* Track — faint background bar so the row is readable when w≈0
                  (e.g. O(1) which is always 1 unit, basically invisible). */}
              <rect
                x={BAR_X}
                y={y}
                width={BAR_MAX_W}
                height={BAR_H}
                rx="4"
                fill="var(--surface-2, rgba(0,0,0,0.05))"
              />

              {/* The actual bar. CSS transition on width keeps the drag
                  buttery — 200ms ease-out as specified. */}
              <rect
                x={BAR_X}
                y={y}
                width={Math.max(row.w, 1)}
                height={BAR_H}
                rx="4"
                fill={row.color}
                style={{ transition: 'width 200ms ease-out' }}
              />

              {/* Runaway indicator: dotted strip filling the rest of the
                  track when this bar maxes out AND dominates. Visually says
                  "this curve runs off the canvas — its real value is →". */}
              {isRunaway && row.w >= BAR_MAX_W - 0.5 && (
                <rect
                  x={BAR_X + row.w}
                  y={y}
                  width={Math.max(0, BAR_MAX_W - row.w)}
                  height={BAR_H}
                  fill="url(#bigorace-runoff)"
                />
              )}

              {/* Right-side value readout. */}
              <text
                x={VB_W - 6}
                y={y + BAR_H / 2}
                textAnchor="end"
                dominantBaseline="middle"
                fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                fontSize="12"
                fontWeight={isRunaway ? 700 : 500}
                fill={isRunaway ? 'var(--el-fire)' : 'var(--text-1, #222)'}
              >
                {fmtVal(row.v)}
              </text>
            </g>
          );
        })}
      </VizCanvas>

      <VizLegend items={legendItems} />
    </div>
  );
}
