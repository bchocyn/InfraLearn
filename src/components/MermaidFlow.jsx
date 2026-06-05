import { useEffect, useMemo, useRef, useState } from 'react';

const PAD_X = 10;
const PAD_Y = 7;
const MIN_BOX_W = 56;
const MAX_BOX_W = 180;
const ROW_GAP = 56;
const COL_GAP = 28;
const FRAME_PAD = 18;
const GROUP_PAD = 18;
const ROW_TOLERANCE = 0.1;
const LABEL_FONT = '600 10px "JetBrains Mono Variable", ui-monospace, monospace';
const LABEL_PAD_X = 8;
const LABEL_PAD_Y = 3;
const LABEL_GAP_MARGIN = 10;
const EDGE_LABEL_HEIGHT = 14;
// Required vertical clearance between an inter-row edge label and the
// destination row's node label/subtitle. Keeps the cream pill from sitting
// on top of either text.
const EDGE_LABEL_CLEARANCE = 8;
// Required horizontal clearance between an inter-row edge label and any
// unrelated node whose bounding box would otherwise underlap it.
const EDGE_LABEL_H_CLEARANCE = 6;

const ICON_GLYPH = {
  person: '\u{1F464}',
  bucket: '\u{1FAA3}',
  cloud: '☁',
  db: '\u{1F5C4}',
  server: '\u{1F5A5}',
};

function measureLabel(label, ctx) {
  if (!label) return MIN_BOX_W;
  ctx.font = '600 12px "Inter Tight", system-ui, sans-serif';
  const w = ctx.measureText(label).width;
  return Math.min(MAX_BOX_W, Math.max(MIN_BOX_W, Math.ceil(w + PAD_X * 2 + 4)));
}

function measureSubtitle(sub, ctx) {
  if (!sub) return 0;
  ctx.font = '500 9.5px "JetBrains Mono Variable", ui-monospace, monospace';
  return Math.ceil(ctx.measureText(String(sub).toUpperCase()).width) + PAD_X * 2;
}

function measureEdgeLabel(label, ctx) {
  if (!label) return 0;
  ctx.font = LABEL_FONT;
  return Math.ceil(ctx.measureText(String(label)).width) + LABEL_PAD_X * 2;
}

function rowsFromNodes(nodes) {
  const sorted = [...nodes].map((n, idx) => ({ n, idx, y: typeof n.y === 'number' ? n.y : 0.5 }));
  sorted.sort((a, b) => a.y - b.y || a.idx - b.idx);
  const rows = [];
  for (const entry of sorted) {
    const last = rows[rows.length - 1];
    if (last && Math.abs(entry.y - last.y) <= ROW_TOLERANCE) {
      last.items.push(entry);
      last.y = (last.y * (last.items.length - 1) + entry.y) / last.items.length;
    } else {
      rows.push({ y: entry.y, items: [entry] });
    }
  }
  for (const row of rows) {
    row.items.sort((a, b) => {
      const ax = typeof a.n.x === 'number' ? a.n.x : 0.5;
      const bx = typeof b.n.x === 'number' ? b.n.x : 0.5;
      return ax - bx || a.idx - b.idx;
    });
  }
  return rows;
}

function computeLayout(nodes, edges, groups, ctx, viewportW) {
  const widths = new Map();
  const heights = new Map();
  const subWidths = new Map();
  for (const n of nodes) {
    const labelW = measureLabel(n.label, ctx) + (n.icon ? 18 : 0);
    const subW = measureSubtitle(n.subtitle, ctx);
    subWidths.set(n.id, subW);
    widths.set(n.id, Math.min(MAX_BOX_W, Math.max(labelW, subW)));
    heights.set(n.id, 32);
  }
  const anySubtitle = nodes.some((n) => typeof n.subtitle === 'string' && n.subtitle.length > 0);
  const rowExtra = anySubtitle ? 14 : 0;
  const rows = rowsFromNodes(nodes);
  const idToRow = new Map();
  rows.forEach((row, ri) => row.items.forEach((e) => idToRow.set(e.n.id, ri)));
  const rowGap = rows.map(() => COL_GAP);
  if (Array.isArray(edges)) {
    for (const e of edges) {
      const from = idToRow.get(e.from);
      const to = idToRow.get(e.to);
      if (from === undefined || from !== to || !e.label) continue;
      const need = measureEdgeLabel(e.label, ctx) + LABEL_GAP_MARGIN * 2;
      if (need > rowGap[from]) rowGap[from] = need;
    }
  }
  rows.forEach((row, ri) => {
    for (let i = 0; i < row.items.length - 1; i++) {
      const a = row.items[i].n;
      const b = row.items[i + 1].n;
      const overhangR = Math.max(0, (subWidths.get(a.id) - widths.get(a.id)) / 2);
      const overhangL = Math.max(0, (subWidths.get(b.id) - widths.get(b.id)) / 2);
      const need = overhangR + overhangL + 12;
      if (need > rowGap[ri]) rowGap[ri] = need;
    }
  });

  // Fix 3: 3+-node rows with subtitle overhang.
  // The pairwise loop above doesn't account for the LEFTMOST node's left
  // overhang or the RIGHTMOST node's right overhang spilling outside the row
  // bounds, nor for the compounding effect of three or more subtitles that
  // each push slightly into their neighbor. For rows of 3+ nodes, recompute
  // the total required width and inflate rowGap until it fits.
  rows.forEach((row, ri) => {
    if (row.items.length < 3) return;
    const hasSub = row.items.some((e) => subWidths.get(e.n.id) > widths.get(e.n.id));
    if (!hasSub) return;
    // sum of widths is fixed; what matters is that EACH adjacent pair has
    // enough gap to fit (rightOverhang(i) + leftOverhang(i+1) + minPad).
    // Take the worst pair as the row gap so all pairs clear simultaneously.
    let worst = rowGap[ri];
    for (let i = 0; i < row.items.length - 1; i++) {
      const a = row.items[i].n;
      const b = row.items[i + 1].n;
      const overhangR = Math.max(0, (subWidths.get(a.id) - widths.get(a.id)) / 2);
      const overhangL = Math.max(0, (subWidths.get(b.id) - widths.get(b.id)) / 2);
      const need = overhangR + overhangL + 18; // 1.5x the original 12px breathing room
      if (need > worst) worst = need;
    }
    rowGap[ri] = worst;
  });

  // Fix 1: inter-row edge label vertical clearance.
  // For each edge crossing rows (from row Rf to row Rt where Rt !== Rf),
  // the edge label lands at the midpoint of the vertical run. We need that
  // midpoint to leave clearance above the destination row's node label AND
  // below the source row's subtitle (if any). Track the max inter-row label
  // height for each "row gap slot" — i.e. the space between row[ri-1] and
  // row[ri] — and use it to expand the row spacing below.
  const interRowSpacing = rows.map(() => 0);
  const interRowEdges = []; // collected once, reused for Fix 2
  if (Array.isArray(edges)) {
    for (const e of edges) {
      const from = idToRow.get(e.from);
      const to = idToRow.get(e.to);
      if (from === undefined || to === undefined || from === to) continue;
      if (!e.label) {
        interRowEdges.push({ edge: e, from, to, labelW: 0 });
        continue;
      }
      const labelW = measureEdgeLabel(e.label, ctx);
      interRowEdges.push({ edge: e, from, to, labelW });
      // The label sits at midY between row Rf and row Rt. The first row
      // immediately above the label (Rt going downward, or Rf+1 in normal
      // top-down flow) is what gets crashed into. We bump the spacing slot
      // for the LOWER of the two rows.
      const slot = Math.max(from, to);
      // Need EDGE_LABEL_HEIGHT + 2 * EDGE_LABEL_CLEARANCE total padding in
      // the inter-row gap on TOP of the natural ROW_GAP. The natural
      // ROW_GAP (56) accommodates ~one line of subtitle; if a label sits in
      // the middle, we need extra height so it clears both rows.
      const need = EDGE_LABEL_HEIGHT + EDGE_LABEL_CLEARANCE * 2;
      if (need > interRowSpacing[slot]) interRowSpacing[slot] = need;
    }
  }

  const rowWidths = rows.map((row, ri) => row.items.reduce((sum, e) => sum + widths.get(e.n.id), 0) + rowGap[ri] * Math.max(0, row.items.length - 1));
  // For 3+-node rows the end-subtitle overhang may also widen contentW so
  // the row visually fits without clipping. Account for half-subtitle on
  // each side.
  const rowEndOverhang = rows.map((row) => {
    if (!row.items.length) return 0;
    const first = row.items[0].n;
    const last = row.items[row.items.length - 1].n;
    const leftO = Math.max(0, (subWidths.get(first.id) - widths.get(first.id)) / 2);
    const rightO = Math.max(0, (subWidths.get(last.id) - widths.get(last.id)) / 2);
    return leftO + rightO;
  });
  const maxRowW = Math.max(...rowWidths.map((w, i) => w + rowEndOverhang[i]), 240);
  const contentW = Math.max(maxRowW + FRAME_PAD * 2, viewportW);
  const positions = new Map();
  let y = FRAME_PAD;
  rows.forEach((row, ri) => {
    const rowW = rowWidths[ri];
    const startX = (contentW - rowW) / 2;
    let x = startX;
    for (const entry of row.items) {
      const w = widths.get(entry.n.id);
      const h = heights.get(entry.n.id);
      positions.set(entry.n.id, { x, y, w, h, cx: x + w / 2, cy: y + h / 2, row: ri });
      x += w + rowGap[ri];
    }
    // Fix 1: add inter-row spacing AFTER this row, i.e. the slot leading
    // into row ri+1. We stored extra height keyed by the lower row index,
    // so consult interRowSpacing[ri + 1] when advancing to the next row.
    const nextExtra = ri + 1 < rows.length ? interRowSpacing[ri + 1] : 0;
    y += 32 + rowExtra + ROW_GAP + nextExtra;
  });
  const contentH = y - ROW_GAP + FRAME_PAD;

  // Fix 2: inter-row edge label horizontal positioning.
  // Now that nodes have absolute positions, compute the resolved (midX,
  // midY) for each inter-row edge label and shift it horizontally if it
  // collides with an unrelated node's bounding box. Store the resolved
  // coords on a Map keyed by edge index for the renderer.
  const edgeLabelPositions = new Map();
  if (Array.isArray(edges)) {
    edges.forEach((e, i) => {
      if (!e.label) return;
      const a = positions.get(e.from);
      const b = positions.get(e.to);
      if (!a || !b) return;
      if (a.row === b.row) return; // same-row uses orthogonalPath defaults
      const labelW = measureEdgeLabel(e.label, ctx);
      const path = orthogonalPath(a, b);
      let midX = path.midX;
      const midY = path.midY;
      const labelBox = {
        x: midX - labelW / 2,
        y: midY - EDGE_LABEL_HEIGHT / 2,
        w: labelW,
        h: EDGE_LABEL_HEIGHT,
      };
      // Collect every node that might collide (excluding endpoints).
      const obstacles = [];
      positions.forEach((p, id) => {
        if (id === e.from || id === e.to) return;
        // Only nodes whose Y band overlaps the label band can collide.
        const nodeTop = p.y - 4;
        const nodeBot = p.y + p.h + (anySubtitle ? 16 : 4);
        if (labelBox.y + labelBox.h < nodeTop) return;
        if (labelBox.y > nodeBot) return;
        obstacles.push({
          x: p.x - EDGE_LABEL_H_CLEARANCE,
          y: nodeTop,
          w: p.w + EDGE_LABEL_H_CLEARANCE * 2,
          h: nodeBot - nodeTop,
        });
      });
      const intersects = (box) => obstacles.some((o) =>
        box.x < o.x + o.w && box.x + box.w > o.x && box.y < o.y + o.h && box.y + box.h > o.y);
      if (intersects(labelBox)) {
        // Try shifting toward the source node (label "exits" from source).
        const sourceX = a.cx;
        const destX = b.cx;
        const dir = destX >= sourceX ? -1 : 1; // shift back toward source
        const step = 16;
        const maxShift = Math.abs(destX - sourceX);
        let shifted = false;
        for (let off = step; off <= maxShift; off += step) {
          for (const sign of [dir, -dir]) {
            const tryX = midX + sign * off;
            const tryBox = { ...labelBox, x: tryX - labelW / 2 };
            // Keep within contentW with FRAME_PAD slack.
            if (tryBox.x < FRAME_PAD - 4) continue;
            if (tryBox.x + tryBox.w > contentW - FRAME_PAD + 4) continue;
            if (!intersects(tryBox)) {
              midX = tryX;
              shifted = true;
              break;
            }
          }
          if (shifted) break;
        }
        if (!shifted) {
          // Fallback: park the label just above the source node's outgoing
          // anchor, where the edge starts. This is always free of other
          // nodes because the source node is its own endpoint and excluded.
          midX = sourceX + (dir === -1 ? -labelW / 2 - 4 : labelW / 2 + 4);
          // Clamp to canvas.
          midX = Math.max(FRAME_PAD + labelW / 2, Math.min(contentW - FRAME_PAD - labelW / 2, midX));
        }
      }
      edgeLabelPositions.set(i, { midX, midY });
    });
  }

  const groupBoxes = [];
  if (Array.isArray(groups)) {
    for (const g of groups) {
      const memberPositions = (g.nodes || []).map((id) => positions.get(id)).filter(Boolean);
      if (!memberPositions.length) continue;
      const minX = Math.min(...memberPositions.map((p) => p.x)) - GROUP_PAD;
      const maxX = Math.max(...memberPositions.map((p) => p.x + p.w)) + GROUP_PAD;
      const minY = Math.min(...memberPositions.map((p) => p.y)) - GROUP_PAD - 4;
      const maxY = Math.max(...memberPositions.map((p) => p.y + p.h)) + GROUP_PAD;
      groupBoxes.push({ id: g.id, label: g.label, x: minX, y: minY, w: maxX - minX, h: maxY - minY });
    }
  }
  return { positions, rows, contentW, contentH, groupBoxes, edgeLabelPositions };
}

function orthogonalPath(a, b) {
  if (a.row === b.row) {
    const x1 = a.x + a.w;
    const x2 = b.x;
    const y = a.cy;
    return { d: `M ${x1} ${y} L ${x2} ${y}`, midX: (x1 + x2) / 2, midY: a.y - 12 };
  }
  if (b.row > a.row) {
    const x1 = a.cx;
    const y1 = a.y + a.h;
    const x2 = b.cx;
    const y2 = b.y;
    if (Math.abs(x1 - x2) < 2) {
      return { d: `M ${x1} ${y1} L ${x2} ${y2}`, midX: x1 + 8, midY: (y1 + y2) / 2 };
    }
    const midY = (y1 + y2) / 2;
    return {
      d: `M ${x1} ${y1} L ${x1} ${midY} L ${x2} ${midY} L ${x2} ${y2}`,
      midX: (x1 + x2) / 2,
      midY,
    };
  }
  const x1 = a.cx;
  const y1 = a.y;
  const x2 = b.cx;
  const y2 = b.y + b.h;
  const midY = (y1 + y2) / 2;
  return {
    d: `M ${x1} ${y1} L ${x1} ${midY} L ${x2} ${midY} L ${x2} ${y2}`,
    midX: (x1 + x2) / 2,
    midY,
  };
}

function edgeColorVar(color) {
  if (color === 'red') return 'var(--mflow-edge-red)';
  if (color === 'green') return 'var(--mflow-edge-green)';
  if (color === 'amber') return 'var(--mflow-edge-amber)';
  return 'var(--mflow-edge)';
}

// Schema extensions (optional, additive — absence preserves prior render):
//   nodes: [{ id, label, subtitle?, accent?, x, y, n?: number }]
//     n? — optional callout badge number (1..99) shown in the top-right
//     corner of the node; lets prose reference "the node with badge 3".
export default function MermaidFlow({
  nodes,
  edges,
  groups,
  annotations,
  title,
  caption,
}) {
  const containerRef = useRef(null);
  const [viewportW, setViewportW] = useState(320);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;
    const measure = () => setViewportW(Math.max(280, el.clientWidth));
    measure();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const ctx = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const c = document.createElement('canvas');
    return c.getContext('2d');
  }, []);

  const layout = useMemo(() => {
    if (!ctx) return null;
    return computeLayout(nodes || [], edges, groups, ctx, viewportW);
  }, [nodes, edges, groups, ctx, viewportW]);

  const uid = useMemo(() => Math.random().toString(36).slice(2, 7), []);

  if (!layout) {
    return <figure className="mflow" ref={containerRef} />;
  }

  const { positions, contentW, contentH, groupBoxes, edgeLabelPositions } = layout;
  const filterId = `mflow-sketch-${uid}`;
  const markerNormalId = `mflow-arrow-${uid}`;
  const markerRedId = `mflow-arrow-red-${uid}`;
  const markerGreenId = `mflow-arrow-green-${uid}`;
  const markerAmberId = `mflow-arrow-amber-${uid}`;

  const safeEdges = Array.isArray(edges) ? edges : [];
  const safeAnnotations = Array.isArray(annotations) ? annotations : [];

  return (
    <figure className="mflow" ref={containerRef}>
      {title && <figcaption className="mflow-title">{title}</figcaption>}
      <div className="mflow-scroll">
        <svg
          className="mflow-svg"
          viewBox={`0 0 ${contentW} ${contentH}`}
          width={contentW}
          height={contentH}
          role="img"
          aria-label={title || 'Flow diagram'}
        >
          <defs>
            <filter id={filterId} x="-5%" y="-5%" width="110%" height="110%">
              <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed="3" />
              <feDisplacementMap in="SourceGraphic" scale="1.4" />
            </filter>
            {[
              { id: markerNormalId, fill: 'var(--mflow-edge)' },
              { id: markerRedId, fill: 'var(--mflow-edge-red)' },
              { id: markerGreenId, fill: 'var(--mflow-edge-green)' },
              { id: markerAmberId, fill: 'var(--mflow-edge-amber)' },
            ].map((m) => (
              <marker
                key={m.id}
                id={m.id}
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto-start-reverse"
              >
                <path d="M0,0 L10,5 L0,10 z" fill={m.fill} />
              </marker>
            ))}
          </defs>

          {groupBoxes.map((g) => (
            <g key={`g-${g.id}`} className="mflow-group">
              <rect
                x={g.x}
                y={g.y}
                width={g.w}
                height={g.h}
                rx={6}
                ry={6}
                className="mflow-group-rect"
                filter={`url(#${filterId})`}
              />
              {g.label && (
                <g>
                  <rect
                    x={g.x + 8}
                    y={g.y - 7}
                    width={g.label.length * 6 + 12}
                    height={14}
                    rx={2}
                    className="mflow-group-tab"
                  />
                  <text
                    x={g.x + 14}
                    y={g.y + 3}
                    className="mflow-group-label"
                  >
                    {g.label}
                  </text>
                </g>
              )}
            </g>
          ))}

          {safeEdges.map((e, i) => {
            const a = positions.get(e.from);
            const b = positions.get(e.to);
            if (!a || !b) return null;
            const { d } = orthogonalPath(a, b);
            const color = edgeColorVar(e.color);
            const markerId = e.color === 'red' ? markerRedId
              : e.color === 'green' ? markerGreenId
              : e.color === 'amber' ? markerAmberId
              : markerNormalId;
            return (
              <path
                key={`e-${i}`}
                d={d}
                fill="none"
                stroke={color}
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={e.dashed ? '5 4' : undefined}
                markerEnd={`url(#${markerId})`}
                filter={`url(#${filterId})`}
              />
            );
          })}

          {(nodes || []).map((n) => {
            const p = positions.get(n.id);
            if (!p) return null;
            const icon = n.icon && ICON_GLYPH[n.icon];
            const accent = n.accent || 'amber';
            return (
              <g key={n.id} className="mflow-node" data-accent={accent}>
                <title>{n.label}{n.subtitle ? ` — ${n.subtitle}` : ''}</title>
                <rect
                  x={p.x}
                  y={p.y}
                  width={p.w}
                  height={p.h}
                  rx={4}
                  ry={4}
                  className="mflow-node-rect"
                  filter={`url(#${filterId})`}
                />
                {icon && (
                  <text
                    x={p.x + 10}
                    y={p.cy + 4}
                    className="mflow-node-icon"
                  >
                    {icon}
                  </text>
                )}
                <text
                  x={p.cx + (icon ? 8 : 0)}
                  y={p.cy + 4}
                  textAnchor="middle"
                  className="mflow-node-label"
                >
                  {n.label}
                </text>
                {n.subtitle && (
                  <text
                    x={p.cx}
                    y={p.y + p.h + 10}
                    textAnchor="middle"
                    className="mflow-node-subtitle"
                  >
                    {String(n.subtitle).toUpperCase()}
                  </text>
                )}
                {typeof n.n === 'number' && n.n >= 1 && n.n <= 99 && (
                  /*  Callout badge: small circle overhanging the top-right
                   *  corner of the node. Centered 9px above-and-right of the
                   *  rect corner (so half the badge overhangs); never paints
                   *  over the label since the label sits at p.cy. */
                  <g className="mflow-node-callout" aria-hidden="true">
                    <circle
                      cx={p.x + p.w}
                      cy={p.y}
                      r={9}
                      className="mflow-node-callout-bg"
                    />
                    <text
                      x={p.x + p.w}
                      y={p.y}
                      textAnchor="middle"
                      dominantBaseline="central"
                      className="mflow-node-callout-text"
                    >
                      {n.n}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {safeEdges.map((e, i) => {
            if (!e.label) return null;
            const a = positions.get(e.from);
            const b = positions.get(e.to);
            if (!a || !b) return null;
            // For inter-row edges, computeLayout has already resolved a
            // collision-free (midX, midY) and stored it in edgeLabelPositions.
            // Same-row edges still use the orthogonal path's midpoint.
            const resolved = edgeLabelPositions && edgeLabelPositions.get(i);
            const { midX, midY } = resolved || orthogonalPath(a, b);
            const text = String(e.label);
            const w = text.length * 5.6 + LABEL_PAD_X * 2;
            return (
              <g key={`el-${i}`} className="mflow-edge-label">
                <rect
                  x={midX - w / 2}
                  y={midY - 7}
                  width={w}
                  height={14}
                  rx={3}
                />
                <text x={midX} y={midY + 3} textAnchor="middle">{text}</text>
              </g>
            );
          })}
        </svg>
      </div>
      {safeAnnotations.length > 0 && (
        <div className="mflow-annotations">
          {safeAnnotations.map((a, i) => (
            <div key={i} className="mflow-annotation">{a.label}</div>
          ))}
        </div>
      )}
      {caption && <figcaption className="mflow-caption">{caption}</figcaption>}
    </figure>
  );
}
