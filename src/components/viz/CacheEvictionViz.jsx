// CacheEvictionViz — interactive LRU / LFU / FIFO eviction playground.
//
// Five cache slots up top, a horizontal stream of incoming key requests at
// the bottom. The learner taps the next request (or hits ▶ Auto-play) and
// watches the active policy decide what gets evicted. Switching policies
// mid-stream resets and re-plays the same request stream so the difference
// between LRU vs LFU vs FIFO becomes a side-by-side dopamine moment.
//
// Why each piece is here:
//   • VizCanvas — shared SVG wrapper; we draw slots + freshness/counter
//     overlays inside it so resizing on mobile is automatic (375px fits).
//   • .lib-pill row — matches the rest of the app's segmented-toggle look
//     (Home MCQ/recall practice toggle uses the same primitive).
//   • Pure React state; no new deps. setTimeout drives the auto-play loop
//     and a short-lived `flash` map paints the hit/miss feedback.
//
// Hard constraint we honor: only this file is touched. Lesson.jsx +
// viz/index.jsx already register `cache-eviction` -> this default export.
import { useEffect, useMemo, useRef, useState } from 'react';
import { VizCanvas, VizLegend } from './widgets.jsx';

// ----- Constants ---------------------------------------------------------
//
// Stream chosen so A and B are "hot" (re-requested many times) and C..H are
// "cold" (touched once or twice). Under LRU + LFU, A and B should mostly
// stay resident; under FIFO they get evicted on schedule regardless of
// reuse — that contrast is the teaching moment.
const STREAM = ['A', 'B', 'C', 'D', 'A', 'B', 'E', 'A', 'B', 'F', 'A', 'G', 'A', 'B', 'H'];
const CAPACITY = 5;
const POLICIES = [
  { id: 'lru', label: 'LRU' },
  { id: 'lfu', label: 'LFU' },
  { id: 'fifo', label: 'FIFO' },
];
const AUTOPLAY_MS = 800;

// SVG user-space dims. Wide and short — slot row sits at top, queue at bottom.
const VB_W = 400;
const VB_H = 220;
const SLOT_W = 56;
const SLOT_H = 70;
const SLOT_GAP = 8;
const SLOT_ROW_Y = 24;
const SLOT_ROW_X =
  (VB_W - (CAPACITY * SLOT_W + (CAPACITY - 1) * SLOT_GAP)) / 2;

// Pick the slot index to evict given the active policy. Returns -1 if the
// cache has empty space (caller will fill that slot instead).
function pickEvictIndex(slots, policy) {
  const emptyIdx = slots.findIndex((s) => s == null);
  if (emptyIdx !== -1) return emptyIdx;
  if (policy === 'lru') {
    // smallest lastUsed = oldest touch
    let best = 0;
    for (let i = 1; i < slots.length; i++) {
      if (slots[i].lastUsed < slots[best].lastUsed) best = i;
    }
    return best;
  }
  if (policy === 'lfu') {
    // smallest useCount; ties broken by oldest lastUsed so we don't
    // perpetually evict the just-inserted (count=1) cold key over an
    // equally cold but older slot.
    let best = 0;
    for (let i = 1; i < slots.length; i++) {
      if (
        slots[i].useCount < slots[best].useCount ||
        (slots[i].useCount === slots[best].useCount &&
          slots[i].lastUsed < slots[best].lastUsed)
      ) {
        best = i;
      }
    }
    return best;
  }
  // fifo: smallest insertedAt — oldest insertion wins
  let best = 0;
  for (let i = 1; i < slots.length; i++) {
    if (slots[i].insertedAt < slots[best].insertedAt) best = i;
  }
  return best;
}

// One step forward through the stream. Returns the new state object plus
// a transient `flash` descriptor so the UI can paint hit/miss feedback.
function step(state) {
  const { slots, requestIdx, hits, misses, tick, policy } = state;
  if (requestIdx >= STREAM.length) return state; // end of stream
  const key = STREAM[requestIdx];
  const hitIdx = slots.findIndex((s) => s && s.key === key);
  const nextTick = tick + 1;
  if (hitIdx !== -1) {
    // HIT — update freshness + counter on the existing slot.
    const newSlots = slots.slice();
    newSlots[hitIdx] = {
      ...newSlots[hitIdx],
      lastUsed: nextTick,
      useCount: newSlots[hitIdx].useCount + 1,
    };
    return {
      ...state,
      slots: newSlots,
      requestIdx: requestIdx + 1,
      hits: hits + 1,
      tick: nextTick,
      flash: { kind: 'hit', slotIdx: hitIdx, key },
    };
  }
  // MISS — evict (or fill empty) and insert.
  const evictIdx = pickEvictIndex(slots, policy);
  const newSlots = slots.slice();
  newSlots[evictIdx] = {
    key,
    lastUsed: nextTick,
    useCount: 1,
    insertedAt: nextTick,
  };
  return {
    ...state,
    slots: newSlots,
    requestIdx: requestIdx + 1,
    misses: misses + 1,
    tick: nextTick,
    flash: { kind: 'miss', slotIdx: evictIdx, key },
  };
}

// Initial / reset state. Slots start empty (null) so the first 5 misses
// fill them without any "evictions" — feels intuitive.
function initialState(policy) {
  return {
    policy,
    slots: Array.from({ length: CAPACITY }, () => null),
    requestIdx: 0,
    hits: 0,
    misses: 0,
    tick: 0,
    flash: null,
  };
}

// Color palette per unique key, so a key keeps the same chip color whether
// it's in a slot or in the queue. Cycles through the four elemental hues.
const KEY_COLORS = {
  A: 'var(--el-fire)',
  B: 'var(--el-water)',
  C: 'var(--el-earth)',
  D: 'var(--el-sky)',
  E: 'var(--accent-amber)',
  F: 'var(--el-fire)',
  G: 'var(--el-water)',
  H: 'var(--el-earth)',
};

export default function CacheEvictionViz() {
  const [state, setState] = useState(() => initialState('lru'));
  const [autoPlay, setAutoPlay] = useState(false);
  // flash is cleared by a separate effect so the green/red highlight only
  // sticks for ~600ms before fading back to the normal slot color.
  const flashTimerRef = useRef(null);

  // ----- Auto-play loop ----------------------------------------------------
  // setTimeout (not setInterval) so the cadence resets cleanly when the user
  // toggles policy / pauses / resumes mid-stream.
  useEffect(() => {
    if (!autoPlay) return;
    if (state.requestIdx >= STREAM.length) {
      setAutoPlay(false);
      return;
    }
    const t = setTimeout(() => {
      setState((s) => step(s));
    }, AUTOPLAY_MS);
    return () => clearTimeout(t);
  }, [autoPlay, state.requestIdx, state.tick]);

  // Clear the transient flash so the slot returns to its neutral color.
  useEffect(() => {
    if (!state.flash) return;
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    flashTimerRef.current = setTimeout(() => {
      setState((s) => ({ ...s, flash: null }));
    }, 600);
    return () => {
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    };
  }, [state.flash]);

  function setPolicy(policy) {
    if (policy === state.policy) return;
    // Switching policy resets the run — that's the whole point: replay the
    // identical stream under a different rule and compare hit rates.
    setAutoPlay(false);
    setState(initialState(policy));
  }
  function advance() {
    if (state.requestIdx >= STREAM.length) return;
    setState((s) => step(s));
  }
  function reset() {
    setAutoPlay(false);
    setState(initialState(state.policy));
  }

  const total = state.hits + state.misses;
  const hitRate = total === 0 ? 0 : Math.round((state.hits / total) * 100);
  const done = state.requestIdx >= STREAM.length;

  // Sort slot indexes by freshness/use so the small caption under each
  // slot shows the policy's "priority" intuitively without re-sorting the
  // visual row (which would be disorienting).
  const policyCaption = useMemo(() => {
    if (state.policy === 'lru') return 'TICKS SINCE USE';
    if (state.policy === 'lfu') return 'HITS';
    return 'INSERT ORDER';
  }, [state.policy]);

  return (
    <div className="cache-viz">
      {/* ----- Policy toggle row ----- */}
      <div
        role="tablist"
        aria-label="Eviction policy"
        style={{
          display: 'flex',
          gap: 8,
          justifyContent: 'center',
          flexWrap: 'wrap',
          marginBottom: 12,
        }}
      >
        {POLICIES.map((p) => (
          <button
            key={p.id}
            role="tab"
            aria-selected={state.policy === p.id}
            className={
              'lib-pill' + (state.policy === p.id ? ' is-active' : '')
            }
            onClick={() => setPolicy(p.id)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* ----- Canvas: slots + queue ----- */}
      <VizCanvas width={VB_W} height={VB_H}>
        {/* Slot row */}
        {state.slots.map((slot, i) => {
          const x = SLOT_ROW_X + i * (SLOT_W + SLOT_GAP);
          const isFlash = state.flash && state.flash.slotIdx === i;
          const flashColor =
            isFlash && state.flash.kind === 'hit'
              ? 'var(--status-success)'
              : isFlash
                ? 'var(--status-error)'
                : null;
          const fill = slot
            ? 'var(--bg-card)'
            : 'transparent';
          const stroke = flashColor
            ? flashColor
            : slot
              ? KEY_COLORS[slot.key] || 'var(--accent-amber)'
              : 'var(--border-default)';
          const strokeDash = slot ? undefined : '4 4';
          // Caption under each slot encodes the policy's priority signal:
          //   LRU  -> ticks since last use (small = recent = safe)
          //   LFU  -> hit count            (big   = popular = safe)
          //   FIFO -> insertion order      (small = oldest  = next out)
          let caption = '·';
          if (slot) {
            if (state.policy === 'lru') {
              caption = String(Math.max(0, state.tick - slot.lastUsed));
            } else if (state.policy === 'lfu') {
              caption = String(slot.useCount);
            } else {
              caption = `#${slot.insertedAt}`;
            }
          }
          return (
            <g key={i}>
              <rect
                x={x}
                y={SLOT_ROW_Y}
                width={SLOT_W}
                height={SLOT_H}
                rx={8}
                fill={fill}
                stroke={stroke}
                strokeWidth={isFlash ? 2.5 : 1.5}
                strokeDasharray={strokeDash}
                style={{ transition: 'stroke 200ms ease, stroke-width 200ms ease' }}
              />
              {slot ? (
                <>
                  <text
                    x={x + SLOT_W / 2}
                    y={SLOT_ROW_Y + 32}
                    textAnchor="middle"
                    fontFamily="var(--font-mono)"
                    fontSize="22"
                    fontWeight="600"
                    fill={KEY_COLORS[slot.key] || 'var(--accent-amber)'}
                  >
                    {slot.key}
                  </text>
                  <text
                    x={x + SLOT_W / 2}
                    y={SLOT_ROW_Y + 56}
                    textAnchor="middle"
                    fontFamily="var(--font-mono)"
                    fontSize="10"
                    letterSpacing="0.08em"
                    fill="var(--text-tertiary)"
                  >
                    {caption}
                  </text>
                </>
              ) : (
                <text
                  x={x + SLOT_W / 2}
                  y={SLOT_ROW_Y + 42}
                  textAnchor="middle"
                  fontFamily="var(--font-mono)"
                  fontSize="11"
                  letterSpacing="0.12em"
                  fill="var(--text-quaternary)"
                >
                  EMPTY
                </text>
              )}
            </g>
          );
        })}

        {/* Caption row under slots — names the metric in the slot caption */}
        <text
          x={VB_W / 2}
          y={SLOT_ROW_Y + SLOT_H + 14}
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fontSize="9"
          letterSpacing="0.18em"
          fill="var(--text-quaternary)"
        >
          {policyCaption}
        </text>

        {/* Queue row — upcoming requests, with the next-up highlighted */}
        {STREAM.map((key, i) => {
          // Chip width chosen so 15 chips fit across 400 user-space units
          // with a little margin. (400 - 16) / 15 ≈ 25.6 -> 24 + 2 gap.
          const chipW = 22;
          const chipGap = 2;
          const totalW = STREAM.length * chipW + (STREAM.length - 1) * chipGap;
          const startX = (VB_W - totalW) / 2;
          const x = startX + i * (chipW + chipGap);
          const y = 160;
          const isNext = i === state.requestIdx && !done;
          const isPast = i < state.requestIdx;
          const opacity = isPast ? 0.25 : isNext ? 1 : 0.7;
          const color = KEY_COLORS[key] || 'var(--accent-amber)';
          return (
            <g
              key={i}
              opacity={opacity}
              style={{ transition: 'opacity 200ms ease' }}
            >
              <rect
                x={x}
                y={y}
                width={chipW}
                height={26}
                rx={5}
                fill={isNext ? color : 'var(--bg-card)'}
                stroke={color}
                strokeWidth={isNext ? 2 : 1}
              />
              <text
                x={x + chipW / 2}
                y={y + 17}
                textAnchor="middle"
                fontFamily="var(--font-mono)"
                fontSize="11"
                fontWeight="600"
                fill={isNext ? 'var(--bg-base)' : color}
              >
                {key}
              </text>
            </g>
          );
        })}

        {/* Tiny instruction below the queue, swapped for "DONE" at end */}
        <text
          x={VB_W / 2}
          y={206}
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fontSize="9"
          letterSpacing="0.18em"
          fill="var(--text-tertiary)"
        >
          {done ? 'STREAM COMPLETE' : 'TAP NEXT REQUEST OR ▶ AUTO-PLAY'}
        </text>
      </VizCanvas>

      {/* ----- Hits / misses readout ----- */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 12,
          flexWrap: 'wrap',
          marginTop: 10,
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          letterSpacing: '0.06em',
          color: 'var(--text-secondary)',
        }}
      >
        <span>
          Hits:{' '}
          <span style={{ color: 'var(--status-success)' }}>{state.hits}</span>
        </span>
        <span style={{ color: 'var(--text-quaternary)' }}>·</span>
        <span>
          Misses:{' '}
          <span style={{ color: 'var(--status-error)' }}>{state.misses}</span>
        </span>
        <span style={{ color: 'var(--text-quaternary)' }}>·</span>
        <span>
          Hit rate:{' '}
          <span style={{ color: 'var(--accent-amber)' }}>{hitRate}%</span>
        </span>
      </div>

      {/* ----- Controls: advance, autoplay, reset ----- */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          justifyContent: 'center',
          marginTop: 12,
          flexWrap: 'wrap',
        }}
      >
        <button
          type="button"
          className={'lib-pill' + (done ? '' : ' is-active')}
          onClick={advance}
          disabled={done}
          aria-label="Advance one request"
          style={done ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
        >
          Step ▸
        </button>
        <button
          type="button"
          className={'lib-pill' + (autoPlay ? ' is-active' : '')}
          onClick={() => {
            if (done) return;
            setAutoPlay((v) => !v);
          }}
          disabled={done}
          aria-pressed={autoPlay}
          style={done ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
        >
          {autoPlay ? '❚❚ Pause' : '▶ Auto-play'}
        </button>
        <button
          type="button"
          className="lib-pill"
          onClick={reset}
          aria-label="Reset stream"
        >
          ↺ Reset
        </button>
      </div>

      {/* ----- Legend explains hit/miss colors ----- */}
      <VizLegend
        items={[
          { label: 'HIT', color: 'var(--status-success)' },
          { label: 'MISS / EVICT', color: 'var(--status-error)' },
          { label: 'NEXT REQUEST', color: 'var(--accent-amber)' },
        ]}
      />
    </div>
  );
}
