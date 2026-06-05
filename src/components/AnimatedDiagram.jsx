import { useEffect, useMemo, useRef, useState } from 'react';
import MermaidFlow from './MermaidFlow.jsx';

// AnimatedDiagram — concept-illustration SVG for lesson bodies.
//
// Inspired by the reference style: rounded role-coded nodes with a two-line
// label (NAME + uppercase SUBTITLE), curved arrows between them, and
// "marching-ant" dashed strokes on the in-flight edges to show data flow.
// Static "structural" edges stay solid; the dashed edges animate.
//
// Props:
//   nodes:  [{ id, label, subtitle?, accent?, x, y, n?: number }]
//     n? — optional callout badge (1..99); shown in the top-right corner
//     so prose can reference "the node with badge 3".
//     x,y are proportional (0..1) inside the viewBox. accent is one of
//     'amber' | 'fire' | 'water' | 'earth' | 'sky' — drives the node's
//     left accent bar + glow + arrow color.
//   edges:  [{ from, to, kind?, accent?, label?, curve? }]
//     kind: 'solid' (default) | 'dashed' (animated) | 'arc' (curved + animated)
//     accent: optional override; defaults to the destination node's accent.
//     label: short mono caption that floats on the edge midpoint.
//     curve: 0..1 — how far the bezier bulges (0 = straight). Defaults to 0.
//   title?  — optional caption shown above the diagram.
//   height? — viewBox height; default 220.
//   caption? — optional small mono caption beneath.

const VIEWBOX_W = 360;
const NODE_W = 92;
const NODE_H = 44;
const STACK_THRESHOLD = 360;
const MIN_NODE_W = 56;

// Horizontal layouts crowd badly when 4+ nodes have to share a 360px viewBox.
// Shrink the node box proportionally so labels don't overlap their neighbours.
// We never shrink below MIN_NODE_W; once nodes can't be readable we'd rather
// the SVG overflow than render an illegible diamond.
function nodeWidthFor(count) {
  if (count <= 3) return NODE_W;
  const fit = Math.floor((VIEWBOX_W - 16) / count) - 4;
  return Math.max(MIN_NODE_W, Math.min(NODE_W, fit));
}

// Map of accent → CSS var name. We rely on theme.css element tokens that
// already exist (el-fire/water/earth/sky + accent-amber).
const ACCENT_VAR = {
  amber: 'var(--accent-amber)',
  fire:  'var(--el-fire)',
  water: 'var(--el-water)',
  earth: 'var(--el-earth)',
  sky:   'var(--el-sky)',
};
function accentColor(a) {
  return ACCENT_VAR[a] || ACCENT_VAR.amber;
}

export default function AnimatedDiagram({
  nodes,
  edges,
  groups,
  annotations,
  rows,           // alternative: [{ label, nodes, edges }] for VARIANTS view
  title,
  caption,
  height = 220,
}) {
  const containerRef = useRef(null);
  const [measuredWidth, setMeasuredWidth] = useState(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;
    const measure = () => setMeasuredWidth(el.clientWidth);
    measure();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Dispatch rules for complex diagrams:
  //   1. `groups` field present → MermaidFlow (containers required).
  //   2. 4+ nodes AND topology is hub/diamond (one source with 3+ leaf peers,
  //      none of which have further outgoing edges) → EdgeListView chip-list.
  //   3. 4+ nodes otherwise → MermaidFlow (text-fit, orthogonal routing).
  //   4. ≤3 nodes → original SVG renderer below.
  const safeNodes = Array.isArray(nodes) ? nodes : [];
  const safeEdges = Array.isArray(edges) ? edges : [];
  const isHubDiamond = (() => {
    if (safeNodes.length < 4) return false;
    const outgoing = new Map();
    for (const e of safeEdges) {
      if (!outgoing.has(e.from)) outgoing.set(e.from, []);
      outgoing.get(e.from).push(e.to);
    }
    const sources = [...outgoing.keys()];
    if (sources.length !== 1) return false;
    const peers = outgoing.get(sources[0]) || [];
    if (peers.length < 3) return false;
    return peers.every((id) => !outgoing.has(id));
  })();
  const hasGroups = Array.isArray(groups) && groups.length > 0;
  const hasSubtitles = safeNodes.some((n) => typeof n.subtitle === 'string' && n.subtitle.length > 0);
  const hasEdgeLabels = safeEdges.some((e) => typeof e.label === 'string' && e.label.length > 0);
  const useFlow = Array.isArray(nodes) && (
    hasGroups
    || (nodes.length >= 4 && !isHubDiamond)
    || (nodes.length >= 2 && (hasSubtitles || hasEdgeLabels))
  );
  const useChipList = !useFlow && Array.isArray(nodes) && nodes.length >= 4 && isHubDiamond;
  if (useFlow) {
    return (
      <MermaidFlow
        nodes={nodes}
        edges={safeEdges}
        groups={groups}
        annotations={annotations}
        title={title}
        caption={caption}
      />
    );
  }
  if (useChipList) {
    return (
      <figure className="anim-diagram anim-diagram-chiplist" ref={containerRef}>
        {title && <figcaption className="anim-diagram-title">{title}</figcaption>}
        <EdgeListView nodes={nodes} edges={safeEdges} />
        {caption && <figcaption className="anim-diagram-caption">{caption}</figcaption>}
      </figure>
    );
  }

  // Variants mode: render each row as its own labeled mini-diagram.
  if (Array.isArray(rows) && rows.length > 0) {
    return (
      <figure className="anim-diagram anim-diagram-variants" ref={containerRef}>
        {title && <figcaption className="anim-diagram-title">{title}</figcaption>}
        {rows.map((row, i) => (
          <div className="anim-diagram-row" key={`row-${i}`}>
            {row.label && <div className="anim-diagram-row-kicker">{row.label}</div>}
            <DiagramSvg
              nodes={row.nodes || []}
              edges={row.edges || []}
              measuredWidth={measuredWidth}
              height={row.height || 80}
            />
          </div>
        ))}
        {caption && <figcaption className="anim-diagram-caption">{caption}</figcaption>}
      </figure>
    );
  }

  return (
    <figure className="anim-diagram" ref={containerRef}>
      {title && <figcaption className="anim-diagram-title">{title}</figcaption>}
      <DiagramSvg
        nodes={nodes || []}
        edges={edges || []}
        measuredWidth={measuredWidth}
        height={height}
        title={title}
      />
      {caption && <figcaption className="anim-diagram-caption">{caption}</figcaption>}
    </figure>
  );
}

// Pure SVG renderer — used both by the single-diagram path above and by each
// row inside the variants path. Doesn't read its own width; receives one from
// the parent figure (so multi-row variants share one ResizeObserver).
function DiagramSvg({ nodes, edges, measuredWidth, height, title }) {
  const stacked = measuredWidth != null && measuredWidth < STACK_THRESHOLD;
  // Adaptive node sizing: when many nodes have to share the viewBox horizontally
  // we shrink them so the boxes don't trample each other. Stacked layout always
  // gets the full box width (one node per row, no crowding).
  const nodeW = stacked ? NODE_W : nodeWidthFor(nodes.length);
  // Extra vertical room: nodes-per-row in horizontal mode is at most 5 even
  // with mixed y coords, so we just grow H if labels are long.
  const H = stacked ? Math.max(height, (nodes || []).length * (NODE_H + 28) + 32) : height;

  const positions = useMemo(() => {
    const map = new Map();
    if (stacked) {
      const cx = VIEWBOX_W / 2;
      const total = nodes.length;
      const slotH = (H - 16) / Math.max(total, 1);
      nodes.forEach((n, i) => {
        const cy = 8 + slotH * (i + 0.5);
        map.set(n.id, { cx, cy, x: cx - nodeW / 2, y: cy - NODE_H / 2 });
      });
    } else {
      nodes.forEach((n) => {
        const cx = clamp((n.x ?? 0.5) * VIEWBOX_W, nodeW / 2 + 4, VIEWBOX_W - nodeW / 2 - 4);
        const cy = clamp((n.y ?? 0.5) * H, NODE_H / 2 + 6, H - NODE_H / 2 - 6);
        map.set(n.id, { cx, cy, x: cx - nodeW / 2, y: cy - NODE_H / 2 });
      });
    }
    return map;
  }, [nodes, H, stacked, nodeW]);

  const markerIds = useMemo(() => {
    const used = new Set(['amber']);
    for (const e of edges) {
      const a = e.accent || destAccent(e, nodes);
      used.add(a || 'amber');
    }
    return [...used];
  }, [edges, nodes]);

  // Unique suffix so multiple SVGs on a page don't share marker IDs.
  const uid = useMemo(
    () => Math.random().toString(36).slice(2, 7),
    [],
  );

  return (
    <svg
      viewBox={`0 0 ${VIEWBOX_W} ${H}`}
      role="img"
      aria-label={title || 'Concept diagram'}
      preserveAspectRatio="xMidYMid meet"
      className="anim-diagram-svg"
      data-orientation={stacked ? 'stacked' : 'horizontal'}
    >
      <defs>
        {markerIds.map((a) => (
          <marker
            key={`m-${a}`}
            id={`anim-arrow-${a}-${uid}`}
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L10,5 L0,10 z" fill={accentColor(a)} />
          </marker>
        ))}
      </defs>

      {edges.map((e, i) => {
        const a = positions.get(e.from);
        const b = positions.get(e.to);
        if (!a || !b) return null;
        const acc = e.accent || destAccent(e, nodes) || 'amber';
        const stroke = accentColor(acc);
        const isDashed = e.kind === 'dashed' || e.kind === 'arc';
        const curve = typeof e.curve === 'number' ? e.curve : (e.kind === 'arc' ? 0.4 : 0);
        const { d, midX, midY } = pathBetween(a, b, curve, nodeW);
        // Clip label length to the available segment so it doesn't crash
        // through neighbouring nodes — short edges = short labels.
        const segPx = Math.hypot(b.cx - a.cx, b.cy - a.cy);
        const labelText = e.label ? clipLabel(e.label, segPx) : null;
        return (
          <g key={`edge-${i}`}>
            <path
              d={d}
              fill="none"
              stroke={stroke}
              strokeWidth={1.6}
              strokeLinecap="round"
              strokeDasharray={isDashed ? '6 5' : undefined}
              className={isDashed ? 'anim-edge-flow' : undefined}
              markerEnd={`url(#anim-arrow-${acc}-${uid})`}
              opacity={isDashed ? 0.95 : 0.75}
            />
            {labelText && <EdgeLabel x={midX} y={midY} accent={acc}>{labelText}</EdgeLabel>}
          </g>
        );
      })}

      {nodes.map((n) => {
        const p = positions.get(n.id);
        if (!p) return null;
        return (
          <NodeBox
            key={n.id}
            {...p}
            label={n.label}
            subtitle={n.subtitle}
            accent={n.accent || 'amber'}
            nodeW={nodeW}
            callout={n.n}
          />
        );
      })}
    </svg>
  );
}

// Clip an edge label to roughly fit the segment between its two anchor nodes.
// Each glyph in the EdgeLabel font is ~5.5px wide; the rect adds 10px padding.
// We aim for ~85% of the segment so the label doesn't actually touch either box.
function clipLabel(label, segPx) {
  const charW = 5.5;
  const maxChars = Math.max(3, Math.floor((segPx * 0.85 - 10) / charW));
  if (label.length <= maxChars) return label;
  return label.slice(0, Math.max(1, maxChars - 1)) + '…';
}

// EdgeListView — readable chip-list rendering for complex 2D diagrams.
// Each source node renders as a header chip. Its outgoing edges render as
// indented rows: arrow + label + target chip. Inbound-only nodes (no
// outgoing edges) still render as their own headerless chip at the end so
// the catalog is complete. Always crisp at any width — no SVG overlap math.
function EdgeListView({ nodes, edges }) {
  // Group edges by source
  const outgoingBySrc = new Map();
  for (const e of edges) {
    if (!outgoingBySrc.has(e.from)) outgoingBySrc.set(e.from, []);
    outgoingBySrc.get(e.from).push(e);
  }
  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  // Order: nodes that have outgoing edges first (in declaration order), then
  // sink-only nodes — the reading flow matches the conceptual flow.
  const ordered = [
    ...nodes.filter((n) => outgoingBySrc.has(n.id)),
    ...nodes.filter((n) => !outgoingBySrc.has(n.id)),
  ];
  return (
    <div className="anim-edgelist">
      {ordered.map((n) => {
        const outs = outgoingBySrc.get(n.id) || [];
        return (
          <div key={n.id} className="anim-edgelist-group">
            <NodeChip node={n} size="lg" />
            {outs.length > 0 && (
              <ul className="anim-edgelist-out">
                {outs.map((e, i) => {
                  const target = nodeById.get(e.to);
                  if (!target) return null;
                  const acc = e.accent || target.accent || 'amber';
                  return (
                    <li key={i} className="anim-edgelist-row">
                      <span
                        className="anim-edgelist-arrow"
                        aria-hidden="true"
                        style={{ color: accentColor(acc) }}
                      >→</span>
                      {e.label && (
                        <span className="anim-edgelist-label mono">{e.label}</span>
                      )}
                      <NodeChip node={target} size="sm" />
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Pill rendering of a node — used by EdgeListView. Solid left accent stripe
// + name + uppercase subtitle. Two sizes so the header chip reads as the
// "source" and the inline chips next to arrows are quieter targets.
function NodeChip({ node, size = 'lg' }) {
  const acc = accentColor(node.accent || 'amber');
  return (
    <span
      className={`anim-chip anim-chip-${size}`}
      style={{
        '--chip-accent': acc,
        borderColor: acc,
      }}
    >
      <span className="anim-chip-stripe" style={{ background: acc }} />
      <span className="anim-chip-text">
        <span className="anim-chip-name">{node.label}</span>
        {node.subtitle && (
          <span className="anim-chip-sub mono">{String(node.subtitle).toUpperCase()}</span>
        )}
      </span>
    </span>
  );
}

function destAccent(edge, nodes) {
  const dest = nodes.find((n) => n.id === edge.to);
  return dest && dest.accent;
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// Build an SVG path between two anchored points, bowing perpendicular to the
// line by `curve` * length / 2. Returns the path string and the midpoint
// (used for label placement). The endpoints are pulled in so the marker
// arrowhead lands on the node edge rather than the centre.
function pathBetween(a, b, curve, nodeW = NODE_W) {
  // Pull endpoints toward the boxes so the arrow stops at the edge.
  const dx = b.cx - a.cx;
  const dy = b.cy - a.cy;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;

  // Compute box-edge intersection for each side (axis-aligned rect).
  const aEdge = boxEdge(a, ux, uy, nodeW);
  const bEdge = boxEdge(b, -ux, -uy, nodeW);

  if (!curve) {
    const midX = (aEdge.x + bEdge.x) / 2;
    const midY = (aEdge.y + bEdge.y) / 2;
    return { d: `M ${aEdge.x} ${aEdge.y} L ${bEdge.x} ${bEdge.y}`, midX, midY };
  }

  // Quadratic Bezier control point: midpoint pushed perpendicular.
  const mx = (aEdge.x + bEdge.x) / 2;
  const my = (aEdge.y + bEdge.y) / 2;
  const segLen = Math.hypot(bEdge.x - aEdge.x, bEdge.y - aEdge.y);
  const px = -uy * curve * (segLen / 2);
  const py = ux * curve * (segLen / 2);
  const cx = mx + px;
  const cy = my + py;
  // Approximate midpoint of bezier at t=0.5 for label placement.
  const midX = 0.25 * aEdge.x + 0.5 * cx + 0.25 * bEdge.x;
  const midY = 0.25 * aEdge.y + 0.5 * cy + 0.25 * bEdge.y;
  return {
    d: `M ${aEdge.x} ${aEdge.y} Q ${cx} ${cy} ${bEdge.x} ${bEdge.y}`,
    midX,
    midY,
  };
}

// Find the point on the rectangle's edge where the ray from its center in
// (ux, uy) direction would exit. Works for axis-aligned (nodeW × NODE_H) rect.
function boxEdge(p, ux, uy, nodeW = NODE_W) {
  const hw = nodeW / 2 + 2;
  const hh = NODE_H / 2 + 2;
  if (ux === 0 && uy === 0) return { x: p.cx, y: p.cy };
  const tx = ux !== 0 ? hw / Math.abs(ux) : Infinity;
  const ty = uy !== 0 ? hh / Math.abs(uy) : Infinity;
  const t = Math.min(tx, ty);
  return { x: p.cx + ux * t, y: p.cy + uy * t };
}

function NodeBox({ x, y, cx, cy, label, subtitle, accent, nodeW = NODE_W, callout }) {
  const acc = accentColor(accent);
  // Clip long labels so they don't bleed out of a shrunken node box. Each
  // 12px serif glyph is ~6.5px wide — leave 8px padding each side.
  const charW = 6.5;
  const maxLabelChars = Math.max(3, Math.floor((nodeW - 16) / charW));
  const shown = label && label.length > maxLabelChars
    ? label.slice(0, Math.max(1, maxLabelChars - 1)) + '…'
    : label;
  const subMaxChars = Math.max(3, Math.floor((nodeW - 12) / 5));
  const shownSub = subtitle && subtitle.length > subMaxChars
    ? subtitle.slice(0, Math.max(1, subMaxChars - 1)) + '…'
    : subtitle;
  return (
    <g className="anim-node">
      <title>{label}{subtitle ? ` — ${subtitle}` : ''}</title>
      {/* Subtle glow halo */}
      <rect
        x={x - 1.5}
        y={y - 1.5}
        width={nodeW + 3}
        height={NODE_H + 3}
        rx={9}
        ry={9}
        fill="none"
        stroke={acc}
        strokeWidth={0.6}
        opacity={0.35}
      />
      {/* Body */}
      <rect
        x={x}
        y={y}
        width={nodeW}
        height={NODE_H}
        rx={8}
        ry={8}
        fill="var(--bg-elevated)"
        stroke={acc}
        strokeWidth={1.25}
      />
      {/* Left accent stripe */}
      <rect
        x={x}
        y={y}
        width={3}
        height={NODE_H}
        rx={1.5}
        ry={1.5}
        fill={acc}
      />
      {/* Label — title line */}
      <text
        x={cx + 1.5}
        y={subtitle ? cy - 5 : cy}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={12}
        fontWeight={600}
        fill="var(--text-primary)"
        fontFamily="var(--font-serif), serif"
      >
        {shown}
      </text>
      {/* Subtitle — uppercase mono kicker */}
      {subtitle && (
        <text
          x={cx + 1.5}
          y={cy + 8}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={7.5}
          fill="var(--text-tertiary)"
          fontFamily="var(--font-mono), monospace"
          letterSpacing="0.08em"
        >
          {String(shownSub).toUpperCase()}
        </text>
      )}
      {/* Callout badge — small numbered circle overhanging the top-right
       *  corner. Only renders when n is a finite integer in 1..99. The badge
       *  is half-outside the rect so it never paints over the label. */}
      {typeof callout === 'number' && callout >= 1 && callout <= 99 && (
        <g className="mflow-node-callout" data-accent={accent} aria-hidden="true">
          <circle
            cx={x + nodeW}
            cy={y}
            r={9}
            className="mflow-node-callout-bg"
            fill={acc}
            stroke="var(--bg-card)"
            strokeWidth={1.5}
          />
          <text
            x={x + nodeW}
            y={y}
            textAnchor="middle"
            dominantBaseline="central"
            className="mflow-node-callout-text"
            fontSize={11}
            fontWeight={700}
            fontFamily="var(--font-mono), monospace"
            fill="#fff"
          >
            {callout}
          </text>
        </g>
      )}
    </g>
  );
}

function EdgeLabel({ x, y, accent, children }) {
  const charW = 5.5;
  const padX = 5;
  const text = String(children);
  const w = Math.max(text.length * charW + padX * 2, 18);
  const h = 13;
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
        stroke={accentColor(accent)}
        strokeWidth={0.8}
        opacity={0.95}
      />
      <text
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={9}
        fill="var(--text-secondary)"
        fontFamily="var(--font-mono), monospace"
        letterSpacing="0.02em"
      >
        {text}
      </text>
    </g>
  );
}
