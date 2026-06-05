// Shared widgets for interactive visualizations.
//
// These are the primitive building blocks every viz in src/components/viz/*
// should reuse — keeping the visual language (amber accent, mono labels,
// 44px tap target) consistent across all viz components, and making each
// viz file itself stay tiny + focused on the math/animation logic.
//
// Pure React + SVG. No external deps. No bundle delta beyond the JSX itself.
import { useId } from 'react';

// ----- Slider -------------------------------------------------------------
//
// Labeled range input with a live value readout. Layout is a single row:
//
//   ┌──────────────┬──────────────────────┬──────────┐
//   │  label       │  ━━━●━━━━━━━━━━━     │  42      │
//   └──────────────┴──────────────────────┴──────────┘
//
// Props:
//   label    — string shown on the left (serif, prose).
//   min/max  — numeric bounds for the range input.
//   step     — optional step size (default 1).
//   value    — controlled current value.
//   onChange — receives the new numeric value.
//   format   — optional (val) => string for the right-side display.
//              Default just stringifies the number.
//
// Mobile-first: the native <input type="range"> handles touch correctly on
// iOS / Android, and our CSS bumps the thumb to a 44px tap target while
// keeping the visual thumb slimmer (see .viz-slider-input in theme.css).
export function Slider({
  label,
  min,
  max,
  step = 1,
  value,
  onChange,
  format,
}) {
  const id = useId();
  const display = format ? format(value) : String(value);
  // Compute amber fill % so the filled portion of the track is visually
  // distinct from the empty portion (background-image linear-gradient in CSS).
  const pct = max === min ? 0 : ((value - min) / (max - min)) * 100;
  return (
    <div className="viz-slider">
      <label className="viz-slider-label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className="viz-slider-input"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ '--viz-slider-pct': `${pct}%` }}
      />
      <output className="viz-slider-value" htmlFor={id}>
        {display}
      </output>
    </div>
  );
}

// ----- VizCanvas ----------------------------------------------------------
//
// Responsive SVG wrapper. Children render in the SVG's user-space coords
// (0..width, 0..height) — but the SVG itself shrinks to fit narrow viewports
// via viewBox + preserveAspectRatio. This lets a viz be authored against
// e.g. 400×260 fixed coords and still look right on a 360px phone.
//
// Props:
//   width / height — SVG user-space dimensions (default 400×260).
//   padding        — inner padding hint (optional; viz can read via React
//                    context if needed, but most viz components just hard-code).
//   children       — SVG nodes (lines, paths, circles, text…).
export function VizCanvas({
  width = 400,
  height = 260,
  padding,
  children,
}) {
  return (
    <div className="viz-canvas" style={padding ? { padding } : undefined}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        // width:100% lets the SVG fluidly resize; height auto-derives via
        // aspect-ratio CSS on .viz-canvas (see theme.css).
        style={{ width: '100%', height: 'auto', display: 'block' }}
      >
        {children}
      </svg>
    </div>
  );
}

// ----- VizLegend ----------------------------------------------------------
//
// Color-coded legend chips, one per series. Used to label the curves /
// regions in a VizCanvas without inlining labels everywhere (which gets
// cramped on mobile).
//
// Props:
//   items — array of { label, color }. `color` should be a CSS color string
//           (theme tokens recommended: var(--accent-amber), var(--el-water), …).
//
// Chips are mono-uppercase to match the existing label rhythm in the rest
// of the app (see .pill / .kicker in theme.css).
export function VizLegend({ items = [] }) {
  if (!items.length) return null;
  return (
    <div className="viz-legend">
      {items.map((it, i) => (
        <span key={i} className="viz-legend-chip">
          <span
            className="viz-legend-dot"
            style={{ background: it.color }}
            aria-hidden="true"
          />
          <span className="viz-legend-label">{it.label}</span>
        </span>
      ))}
    </div>
  );
}
