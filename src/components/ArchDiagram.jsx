import { useEffect, useMemo, useRef, useState } from 'react';

// ArchDiagram — responsive architecture diagram primitive (Mockup 1 Proposal 8).
//
// Lesson bodies can drop one of these in to render a small node/edge picture
// (e.g. "Client → Load Balancer → API → Postgres") that gracefully degrades on
// narrow phones: nodes can swap to a short abbreviation when the rendered box
// gets too small, and the whole diagram flips to a stacked vertical layout
// when the container width drops below 360px.
//
// Props:
//   nodes  — [{ id, label, x: 0..1, abbrev? }]
//     x is the proportional horizontal position inside the viewBox (0 = left,
//     1 = right). The component computes the pixel x as `x * viewBoxWidth`.
//     If `abbrev` is set, the short form is shown when the computed node box
//     is narrower than the ABBREV_THRESHOLD (120px).
//   edges  — [{ from, to, label? }]
//     `from` and `to` reference node ids. `label` floats above the line midpoint.
//   title  — optional mono caption rendered above the SVG.
//   height — optional viewBox height for the horizontal layout (default 140).
//
// Rendering rules:
//   - viewBox is "0 0 360 H" — the phone-narrowest case. The SVG itself scales
//     via CSS (`width: 100%; height: auto`).
//   - Below STACK_THRESHOLD (360px container width) we re-emit as a stacked
//     layout. The flip is signalled to CSS via `data-orientation="stacked"`.
//   - Width is measured once after mount with ResizeObserver so the component
//     stays correct under panel resizes (e.g. desktop sidebar collapsing).

const VIEWBOX_WIDTH = 360;
const NODE_WIDTH = 100;
const NODE_HEIGHT = 36;
const ABBREV_THRESHOLD = 120;   // px — below this width, use node.abbrev
const STACK_THRESHOLD = 360;    // px — below this width, switch to stacked layout

export default function ArchDiagram({ nodes = [], edges = [], title, height = 140 }) {
  const containerRef = useRef(null);
  // measuredWidth starts null so the first paint uses the wide layout; once we
  // measure we may flip to stacked. This avoids a layout flash for desktop
  // (where stacked never triggers) and keeps SSR-friendly behaviour.
  const [measuredWidth, setMeasuredWidth] = useState(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;
    // One-shot measure on mount, then keep listening for resizes. We only care
    // about the container's clientWidth — height is driven by the viewBox.
    const measure = () => setMeasuredWidth(el.clientWidth);
    measure();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Pre-compute which nodes should use their abbreviation. The threshold is
  // applied to the *rendered* node width, which is NODE_WIDTH scaled by the
  // ratio of measured container width to viewBox width.
  const useAbbrev = useMemo(() => {
    if (measuredWidth == null) return false;
    const renderedNodeWidth = NODE_WIDTH * (measuredWidth / VIEWBOX_WIDTH);
    return renderedNodeWidth < ABBREV_THRESHOLD;
  }, [measuredWidth]);

  const stacked = measuredWidth != null && measuredWidth < STACK_THRESHOLD;

  return (
    <figure className="arch-diagram" ref={containerRef}>
      {title && <figcaption className="arch-diagram-title">{title}</figcaption>}
      {stacked
        ? <StackedDiagram nodes={nodes} edges={edges} title={title} useAbbrev={useAbbrev} />
        : <HorizontalDiagram nodes={nodes} edges={edges} title={title} height={height} useAbbrev={useAbbrev} />}
    </figure>
  );
}

// Shared <defs> — a single amber arrowhead marker. Marker id is suffixed with
// the orientation so horizontal and stacked variants can coexist on one page
// without colliding ids.
function Arrowhead({ id }) {
  return (
    <defs>
      <marker
        id={id}
        viewBox="0 0 10 10"
        refX="9"
        refY="5"
        markerWidth="6"
        markerHeight="6"
        orient="auto-start-reverse"
      >
        <path d="M0,0 L10,5 L0,10 z" fill="var(--accent-amber)" />
      </marker>
    </defs>
  );
}

function NodeBox({ x, y, label, abbrev, useAbbrev }) {
  const shown = useAbbrev && abbrev ? abbrev : label;
  return (
    <g>
      <title>{label}</title>
      <rect
        x={x}
        y={y}
        width={NODE_WIDTH}
        height={NODE_HEIGHT}
        rx={6}
        ry={6}
        fill="var(--bg-elevated)"
        stroke="var(--accent-amber)"
        strokeWidth={1}
        style={{ shapeRendering: 'crispEdges' }}
        aria-label={label}
      />
      <text
        x={x + NODE_WIDTH / 2}
        y={y + NODE_HEIGHT / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fill="var(--text-primary)"
        fontSize={12}
        fontFamily="var(--font-mono)"
      >
        {shown}
      </text>
    </g>
  );
}

function EdgeLabel({ x, y, children }) {
  // The label is a tiny mono pill floating above the line midpoint. We use
  // a <rect> sized roughly to the text via a paint-order trick: stroke first
  // for a subtle outline, then fill.
  const padX = 4;
  const charW = 6; // approx for the 10px mono — fine for the short labels we expect
  const w = Math.max(children.length * charW + padX * 2, 16);
  const h = 14;
  return (
    <g>
      <rect
        x={x - w / 2}
        y={y - h / 2}
        width={w}
        height={h}
        rx={3}
        ry={3}
        fill="var(--bg-card)"
        stroke="var(--border-subtle)"
        strokeWidth={1}
        style={{ shapeRendering: 'crispEdges' }}
      />
      <text
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="central"
        fill="var(--text-tertiary)"
        fontSize={10}
        fontFamily="var(--font-mono)"
      >
        {children}
      </text>
    </g>
  );
}

function HorizontalDiagram({ nodes, edges, title, height, useAbbrev }) {
  // Build a quick id → {cx, cy, x, y} map so edge rendering can look nodes up
  // by id without scanning the array each time.
  const nodePositions = useMemo(() => {
    const cy = height / 2;
    const map = new Map();
    for (const n of nodes) {
      // Center the box on n.x * viewBoxWidth, then clamp so it stays inside.
      const cx = n.x * VIEWBOX_WIDTH;
      let x = cx - NODE_WIDTH / 2;
      if (x < 0) x = 0;
      if (x + NODE_WIDTH > VIEWBOX_WIDTH) x = VIEWBOX_WIDTH - NODE_WIDTH;
      const y = cy - NODE_HEIGHT / 2;
      map.set(n.id, { x, y, cx: x + NODE_WIDTH / 2, cy: y + NODE_HEIGHT / 2 });
    }
    return map;
  }, [nodes, height]);

  const markerId = 'arch-arrow-h';

  return (
    <svg
      viewBox={`0 0 ${VIEWBOX_WIDTH} ${height}`}
      role="img"
      aria-label={title || 'Architecture diagram'}
      data-orientation="horizontal"
      preserveAspectRatio="xMidYMid meet"
    >
      <Arrowhead id={markerId} />
      {edges.map((e, i) => {
        const a = nodePositions.get(e.from);
        const b = nodePositions.get(e.to);
        if (!a || !b) return null;
        // Arrow runs between adjacent box edges, not centers, so the head
        // doesn't bury itself inside the destination rect.
        const goingRight = b.cx >= a.cx;
        const x1 = goingRight ? a.x + NODE_WIDTH : a.x;
        const x2 = goingRight ? b.x : b.x + NODE_WIDTH;
        const y = a.cy;
        const midX = (x1 + x2) / 2;
        return (
          <g key={`edge-${i}`}>
            <line
              x1={x1}
              y1={y}
              x2={x2}
              y2={y}
              stroke="var(--accent-amber)"
              strokeWidth={1.5}
              markerEnd={`url(#${markerId})`}
            />
            {e.label && <EdgeLabel x={midX} y={y - 12}>{e.label}</EdgeLabel>}
          </g>
        );
      })}
      {nodes.map((n) => {
        const p = nodePositions.get(n.id);
        if (!p) return null;
        return (
          <NodeBox
            key={n.id}
            x={p.x}
            y={p.y}
            label={n.label}
            abbrev={n.abbrev}
            useAbbrev={useAbbrev}
          />
        );
      })}
    </svg>
  );
}

function StackedDiagram({ nodes, edges, title, useAbbrev }) {
  // Stacked layout ignores node.x — we evenly space the nodes top-to-bottom
  // centered on the viewBox horizontal midline. Height grows with the node
  // count so each node + arrow gap has enough room.
  const gap = 24; // vertical gap between node bottom and next node top
  const totalHeight = nodes.length * NODE_HEIGHT + Math.max(0, nodes.length - 1) * gap + 16;
  const cx = VIEWBOX_WIDTH / 2;
  const nodeX = cx - NODE_WIDTH / 2;

  const nodePositions = useMemo(() => {
    const map = new Map();
    let y = 8; // top padding inside viewBox
    for (const n of nodes) {
      map.set(n.id, { x: nodeX, y, cx, cy: y + NODE_HEIGHT / 2 });
      y += NODE_HEIGHT + gap;
    }
    return map;
  }, [nodes, nodeX, cx]);

  const markerId = 'arch-arrow-v';

  return (
    <svg
      viewBox={`0 0 ${VIEWBOX_WIDTH} ${totalHeight}`}
      role="img"
      aria-label={title || 'Architecture diagram'}
      data-orientation="stacked"
      preserveAspectRatio="xMidYMid meet"
    >
      <Arrowhead id={markerId} />
      {edges.map((e, i) => {
        const a = nodePositions.get(e.from);
        const b = nodePositions.get(e.to);
        if (!a || !b) return null;
        const y1 = a.y + NODE_HEIGHT;
        const y2 = b.y;
        const midY = (y1 + y2) / 2;
        return (
          <g key={`edge-${i}`}>
            <line
              x1={cx}
              y1={y1}
              x2={cx}
              y2={y2}
              stroke="var(--accent-amber)"
              strokeWidth={1.5}
              markerEnd={`url(#${markerId})`}
            />
            {e.label && <EdgeLabel x={cx + 28} y={midY}>{e.label}</EdgeLabel>}
          </g>
        );
      })}
      {nodes.map((n) => {
        const p = nodePositions.get(n.id);
        if (!p) return null;
        return (
          <NodeBox
            key={n.id}
            x={p.x}
            y={p.y}
            label={n.label}
            abbrev={n.abbrev}
            useAbbrev={useAbbrev}
          />
        );
      })}
    </svg>
  );
}
