// FsrsCurveViz — interactive forgetting-curve visualization.
//
// Shows a 2D plot of retention probability R(t) over time, where t is the
// number of days since the last review. The curve uses the FSRS-style
// exponential decay model:
//
//   R(t) = exp( -t / (S * D^-0.5) )
//
// `stability` (S) widens the curve to the right — higher S means slower
// forgetting. `difficulty` (D) steepens it — higher D means the same S
// produces faster forgetting (since D^-0.5 < 1 shrinks the effective
// half-life). The learner drags two sliders to feel this relationship.
//
// A "Review now (good)" button simulates a successful FSRS review: stability
// multiplies by ~2.5 (the "good" rating multiplier in /reviews), and the
// curve restarts at 98% retention. We animate the transition over 400ms via
// requestAnimationFrame because CSS transitions on SVG `d` are unreliable
// across browsers — we interpolate the *parameters* (S/D/start) frame-by-frame
// and re-derive the path string each tick.
//
// Mobile-first: viewBox is 360×200 so it shrinks cleanly to a 360px phone;
// sliders stack vertically below 600px via the existing .viz-slider CSS rules.
import { useEffect, useRef, useState } from 'react';
import { Slider, VizCanvas } from './widgets.jsx';

// ----- Geometry constants (SVG user-space) --------------------------------
const VB_W = 360;            // viewBox width
const VB_H = 200;             // viewBox height
const PAD_L = 36;             // left padding — room for y-axis labels
const PAD_R = 12;
const PAD_T = 14;
const PAD_B = 28;             // bottom padding — room for x-axis labels
const PLOT_W = VB_W - PAD_L - PAD_R;
const PLOT_H = VB_H - PAD_T - PAD_B;
const MAX_DAYS = 365;         // x-axis domain (log-scaled visually)

// "Now" marker sits 1/3 of the way across — gives both the past curve and
// the future projection visible room. Expressed in days (log-scaled below).
const NOW_DAYS = 30;

// Animation duration for the Review-Now transition, in ms.
const ANIM_MS = 400;

// FSRS-style multiplier applied on a "good" rating. Matches the simplified
// model in /reviews — exact value isn't load-bearing for the demo.
const REVIEW_MULT = 2.5;

// ----- Math helpers -------------------------------------------------------

// Retention probability at day `t` given stability S and difficulty D.
// startRet lets us begin the curve at <100% (used right after a review).
function retention(t, S, D, startRet = 1) {
  // Effective decay constant: higher D shrinks the half-life.
  const k = S * Math.pow(D, -0.5);
  if (k <= 0) return 0;
  return startRet * Math.exp(-t / k);
}

// Map a day count (0..MAX_DAYS) onto x-pixel using log scale. log(0) is
// undefined so we shift by 1.
function dayToX(d) {
  const lo = Math.log10(1);
  const hi = Math.log10(MAX_DAYS + 1);
  const norm = (Math.log10(d + 1) - lo) / (hi - lo);
  return PAD_L + norm * PLOT_W;
}

// Map a retention probability (0..1) onto y-pixel. Y grows downward in SVG,
// so 100% retention sits at the top (PAD_T) and 0% at the bottom.
function retToY(r) {
  return PAD_T + (1 - r) * PLOT_H;
}

// Build an SVG path "M x0 y0 L x1 y1 ..." sampling N points across the
// x-domain. We sample in *log* space so the curve has dense points where the
// x-axis is dense (near t=0) — keeps the early steep part smooth.
function buildPath(S, D, startRet, sinceReview) {
  const N = 80;
  const lo = Math.log10(1);
  const hi = Math.log10(MAX_DAYS + 1);
  let d = '';
  for (let i = 0; i <= N; i++) {
    const logT = lo + (hi - lo) * (i / N);
    const tFromReview = Math.pow(10, logT) - 1;           // 0..MAX_DAYS
    const tDisplay = tFromReview + sinceReview;            // shift right
    if (tDisplay > MAX_DAYS) break;
    const r = retention(tFromReview, S, D, startRet);
    const x = dayToX(tDisplay);
    const y = retToY(r);
    d += (i === 0 ? 'M' : 'L') + x.toFixed(2) + ' ' + y.toFixed(2) + ' ';
  }
  return d.trim();
}

// Linear interpolation helper for the rAF animation.
function lerp(a, b, t) { return a + (b - a) * t; }

// Ease-out cubic — quick start, gentle settle. Matches the rest of the app's
// "feels responsive but not jumpy" motion language.
function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

// ----- Component ---------------------------------------------------------
export default function FsrsCurveViz() {
  // Slider state — these are the *target* values the user controls.
  const [stability, setStability] = useState(7);   // days
  const [difficulty, setDifficulty] = useState(5); // 1..10

  // "Animated" state — what the curve actually draws this frame. During an
  // animation these lag behind the targets and catch up via rAF.
  const [animS, setAnimS] = useState(7);
  const [animStart, setAnimStart] = useState(1);   // starting retention
  const [animSince, setAnimSince] = useState(0);   // days since last review

  // Track the rAF id so we can cancel a mid-flight animation if the user
  // clicks Review Now twice in quick succession.
  const rafRef = useRef(0);

  // When stability slider moves, snap the animated S to match (no animation
  // on slider drag — the curve should track the thumb live).
  useEffect(() => {
    if (rafRef.current === 0) setAnimS(stability);
  }, [stability]);

  // Cleanup any in-flight rAF on unmount to avoid setState-after-unmount.
  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  function handleReview() {
    // Cancel any prior animation so rapid clicks don't fight each other.
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    // Capture starting and ending parameter values for the interpolation.
    const fromS = animS;
    const fromStart = animStart;
    const fromSince = animSince;
    const toS = stability * REVIEW_MULT;     // FSRS "good" boost
    const toStart = 0.98;                     // restart near (not at) 100%
    const toSince = 0;                        // reset clock — review = day 0

    // Also push the slider value up so the UI stays in sync after the anim.
    setStability(Math.min(MAX_DAYS, stability * REVIEW_MULT));

    const t0 = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - t0) / ANIM_MS);
      const e = easeOut(t);
      setAnimS(lerp(fromS, toS, e));
      setAnimStart(lerp(fromStart, toStart, e));
      setAnimSince(lerp(fromSince, toSince, e));
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        rafRef.current = 0;
      }
    };
    rafRef.current = requestAnimationFrame(step);
  }

  // Path for the current (animated) parameters.
  const pathD = buildPath(animS, difficulty, animStart, animSince);

  // X-axis tick positions (in days) — log-spaced so they're evenly visible.
  const xTicks = [1, 7, 30, 90, 365];

  // Y-axis horizontal grid lines (retention thresholds learners care about).
  const yGrid = [
    { val: 0.5, label: '50%' },
    { val: 0.8, label: '80%' },
    { val: 0.9, label: '90%' },
  ];

  // "Now" marker x-pixel — fixed position, doesn't shift with sliders.
  const nowX = dayToX(NOW_DAYS);

  // Retention right now (for the readout next to the Review button). The
  // curve has been shifted right by `animSince` days, so the visible
  // retention at NOW_DAYS corresponds to `NOW_DAYS - animSince` of decay.
  const tFromReview = Math.max(0, NOW_DAYS - animSince);
  const rNow = retention(tFromReview, animS, difficulty, animStart);

  return (
    <div>
      {/* ----- Sliders ----- */}
      <Slider
        label="Stability (days)"
        min={1}
        max={MAX_DAYS}
        step={1}
        value={stability}
        onChange={setStability}
        format={(v) => v < 10 ? v.toFixed(1) : Math.round(v) + 'd'}
      />
      <Slider
        label="Difficulty"
        min={1}
        max={10}
        step={1}
        value={difficulty}
        onChange={setDifficulty}
      />

      {/* ----- Plot ----- */}
      <VizCanvas width={VB_W} height={VB_H}>
        {/* Horizontal grid lines + their y-axis labels */}
        {yGrid.map((g) => (
          <g key={g.val}>
            <line
              x1={PAD_L}
              x2={VB_W - PAD_R}
              y1={retToY(g.val)}
              y2={retToY(g.val)}
              stroke="var(--border-subtle)"
              strokeDasharray="2 3"
            />
            <text
              x={PAD_L - 6}
              y={retToY(g.val) + 3}
              fontSize="9"
              textAnchor="end"
              fontFamily="var(--font-mono)"
              fill="var(--text-tertiary)"
            >
              {g.label}
            </text>
          </g>
        ))}

        {/* X-axis baseline + tick labels (log-spaced) */}
        <line
          x1={PAD_L}
          x2={VB_W - PAD_R}
          y1={retToY(0)}
          y2={retToY(0)}
          stroke="var(--border-default)"
        />
        {xTicks.map((d) => (
          <g key={d}>
            <line
              x1={dayToX(d)}
              x2={dayToX(d)}
              y1={retToY(0)}
              y2={retToY(0) + 3}
              stroke="var(--border-default)"
            />
            <text
              x={dayToX(d)}
              y={retToY(0) + 14}
              fontSize="9"
              textAnchor="middle"
              fontFamily="var(--font-mono)"
              fill="var(--text-tertiary)"
            >
              {d === 365 ? '1y' : d + 'd'}
            </text>
          </g>
        ))}

        {/* "Now" vertical dashed line */}
        <line
          x1={nowX}
          x2={nowX}
          y1={PAD_T}
          y2={retToY(0)}
          stroke="var(--accent-amber-dim)"
          strokeDasharray="3 3"
          opacity="0.7"
        />
        <text
          x={nowX}
          y={PAD_T - 3}
          fontSize="9"
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fill="var(--accent-amber)"
          letterSpacing="0.1em"
        >
          NOW
        </text>

        {/* The forgetting curve itself */}
        <path
          d={pathD}
          fill="none"
          stroke="var(--accent-amber)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Marker dot at the "now" position on the curve */}
        <circle
          cx={nowX}
          cy={retToY(rNow)}
          r="3.5"
          fill="var(--accent-amber)"
          stroke="var(--bg-elevated)"
          strokeWidth="1.5"
        />
      </VizCanvas>

      {/* ----- Review-now action row ----- */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginTop: 10,
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--text-tertiary)',
            letterSpacing: '0.06em',
          }}
        >
          R(now) = {(rNow * 100).toFixed(0)}%
        </span>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleReview}
          style={{ minHeight: 44 }}
        >
          ⌃ Review now (good)
        </button>
      </div>

      <p className="viz-block-caption">
        Forgetting probability = e^(-t/S × d^-0.5). Click ⌃ to see what spaced
        review buys you.
      </p>
    </div>
  );
}
