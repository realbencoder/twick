import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * Eye-contact exclusion lane.
 *
 * A dedicated row the creator drags on to send a span of the video back to their ORIGINAL
 * footage (or to restore it to the corrected version). It is a SEPARATE ROW on purpose:
 * dragging on a clip would select or trim it, and this lane must never participate in
 * selection — it holds no selection state and calls no selection API, so `S`, `Cmd/Ctrl+B`
 * and Delete (which all operate on the selected element) can never reach it.
 *
 * App bridge, same shape as __twick_silence_preview / __twick_waveform / __twick_filmstrip:
 *   window.__twick_eyecontact_lane = { ranges: [[from, to], ...] }  // TIMELINE seconds
 *   window dispatchEvent('twick-eyecontact-lane')                   // re-read
 * Emits:
 *   'twick-eyecontact-edit' { action: 'exclude' | 'restore', from, to }  // TIMELINE seconds
 *
 * Bands are positioned as a PERCENTAGE of the lane's own width, and pointer positions are
 * read from getBoundingClientRect — which already accounts for scroll — so zoom and scroll
 * need no arithmetic here at all.
 */

/** Below this, a press is a click, not a sweep. Matches the timeline's own drag threshold. */
const DRAG_THRESHOLD_PX = 3;

export interface EyeContactLaneProps {
  /** Total timeline duration in seconds. */
  duration: number;
  /** Width of the sticky label gutter. NOT subtracted from the band area — see below. */
  labelWidth: number;
  /**
   * The FULL clip frame width (helpers/time-scale.ts `contentWidth`, === timelineWidth).
   *
   * The band area is exactly this wide and the label sits BESIDE it, because that is how
   * every other row works: time-scale.ts maps `timeToContentX = labelWidth + t/dur*contentWidth`
   * and its docblock names deriving the frame by subtracting labelWidth as a regression a
   * prior version already caused. Doing it with flexGrow put this lane in a frame 40px
   * narrower than the ruler, playhead and clips — up to 40s of drift at low zoom.
   */
  timelineWidth: number;
}

type LaneData = { ranges: Array<[number, number]> } | null | undefined;

export function EyeContactLane({ duration, labelWidth, timelineWidth }: EyeContactLaneProps) {
  const [tick, setTick] = useState(0);
  const areaRef = useRef<HTMLDivElement>(null);
  const [sweep, setSweep] = useState<{ from: number; to: number } | null>(null);
  const dragRef = useRef<{ startX: number; startTime: number; armed: boolean } | null>(null);

  useEffect(() => {
    const bump = () => setTick((t) => t + 1);
    window.addEventListener("twick-eyecontact-lane", bump);
    return () => window.removeEventListener("twick-eyecontact-lane", bump);
  }, []);

  const ranges = useMemo(() => {
    const data = (window as any).__twick_eyecontact_lane as LaneData;
    return data?.ranges?.length ? data.ranges : [];
    // tick re-reads on every bridge dispatch.
  }, [tick]);

  const active = (window as any).__twick_eyecontact_lane != null;

  const timeAt = useCallback(
    (clientX: number) => {
      const el = areaRef.current;
      if (!el || !(duration > 0)) return 0;
      const r = el.getBoundingClientRect();
      if (!(r.width > 0)) return 0;
      const pct = (clientX - r.left) / r.width;
      return Math.max(0, Math.min(duration, pct * duration));
    },
    [duration]
  );

  const isInsideExclusion = useCallback(
    (t: number) => ranges.some(([a, b]) => t >= a && t < b),
    [ranges]
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      // NOT setPointerCapture here: capturing on pointerdown retargets the click and is the
      // documented cause of the teleprompter's dead tap-a-word on every mouse (UX-17).
      dragRef.current = { startX: e.clientX, startTime: timeAt(e.clientX), armed: false };
    },
    [timeAt]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const d = dragRef.current;
      if (!d) return;
      // The press ended somewhere we never saw — the pointer left this 18px strip, and a
      // mouse gets no implicit capture. Without this, a later HOVER arms the drag, captures
      // a button-less pointer, and the next click commits and PERSISTS an exclusion nobody
      // asked for.
      if (e.buttons === 0) {
        dragRef.current = null;
        setSweep(null);
        return;
      }
      if (!d.armed) {
        if (Math.abs(e.clientX - d.startX) < DRAG_THRESHOLD_PX) return;
        d.armed = true;
        // Capture only once this is provably a drag, so a plain click is never swallowed.
        try {
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        } catch {
          /* capture is best-effort */
        }
      }
      const now = timeAt(e.clientX);
      setSweep({ from: Math.min(d.startTime, now), to: Math.max(d.startTime, now) });
    },
    [timeAt]
  );

  /** The interaction was taken away — abandon it. Committing here would write a range from
   *  wherever the pointer happened to be when the browser cancelled. */
  const onPointerCancel = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current = null;
    setSweep(null);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  }, []);

  /** Leaving un-armed drops the press; an ARMED drag keeps going via pointer capture. */
  const onPointerLeave = useCallback(() => {
    if (dragRef.current && !dragRef.current.armed) {
      dragRef.current = null;
      setSweep(null);
    }
  }, []);

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const d = dragRef.current;
      dragRef.current = null;
      setSweep(null);
      if (!d || !d.armed) return;
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      const end = timeAt(e.clientX);
      const from = Math.min(d.startTime, end);
      const to = Math.max(d.startTime, end);
      if (!(to - from > 0)) return;
      // Where the sweep STARTED decides the intent: begin inside an excluded span and you
      // are restoring it, begin on corrected lane and you are excluding.
      const action = isInsideExclusion(d.startTime) ? "restore" : "exclude";
      window.dispatchEvent(
        new CustomEvent("twick-eyecontact-edit", { detail: { action, from, to } })
      );
    },
    [timeAt, isInsideExclusion]
  );

  if (!active) return null;

  // Clamped: exclusions are clamped to the MASTER duration, which can exceed the EDITED
  // timeline, and an unclamped band widens the scroll container or collapses to width:auto.
  const pct = (t: number) =>
    duration > 0 ? Math.max(0, Math.min(100, (t / duration) * 100)) : 0;
  /**
   * Band geometry from the clamped ENDS, not from a clamped width.
   *
   * `pct(to - from)` clamps each call but not the band's end: [90,140] on a 100s timeline
   * gave left 90% + width 50% = 140%. overflow:hidden masked it, but the arithmetic was wrong.
   */
  const band = (from: number, to: number) => {
    // Rounded: differencing two percentages reintroduces float noise (55-50 => 5.000000000000007),
    // which is invisible in CSS but makes the emitted string non-deterministic.
    const r = (n: number) => Math.round(n * 1e6) / 1e6;
    const l = pct(from);
    return { left: `${r(l)}%`, width: `${r(Math.max(0, pct(to) - l))}%` };
  };

  return (
    // WIDTH is load-bearing for the sticky label: sticky is bounded by its containing block,
    // and without an explicit width this flex child stretches to the SCROLLPORT, so the label
    // unpins past roughly one viewport of scroll. The track rows get theirs from an ancestor
    // sized to the content.
    <div
      style={{
        display: "flex",
        alignItems: "stretch",
        height: 18,
        width: labelWidth + timelineWidth,
      }}
    >
      <div
        style={{
          width: labelWidth,
          flex: "none",
          // Sticky like .twick-track-header — otherwise the label scrolls away at any
          // scrollLeft > 0 and the lane becomes an unlabelled grey strip.
          position: "sticky",
          left: 0,
          zIndex: 2,
          background: "#171717",
          fontSize: 9,
          color: "rgba(255,255,255,0.45)",
          display: "flex",
          alignItems: "center",
          paddingLeft: 8,
          userSelect: "none",
        }}
      >
        Eye contact
      </div>
      <div
        ref={areaRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onPointerLeave={onPointerLeave}
        title="Drag to use your original footage here. Drag across a marked range to correct it again."
        style={{
          position: "relative",
          width: timelineWidth,
          flex: "none",
          overflow: "hidden",
          cursor: "ew-resize",
          background: "rgba(255,255,255,0.04)",
          borderRadius: 3,
          touchAction: "none",
        }}
      >
        {ranges.map(([from, to], i) => (
          <div
            key={`${i}-${from.toFixed(3)}`}
            style={{
              position: "absolute",
              ...band(from, to),
              top: 2,
              bottom: 2,
              background: "rgba(148,163,184,0.55)",
              border: "1px solid rgba(203,213,225,0.7)",
              borderRadius: 2,
              pointerEvents: "none",
            }}
          />
        ))}
        {sweep && sweep.to > sweep.from && (
          <div
            style={{
              position: "absolute",
              ...band(sweep.from, sweep.to),
              top: 0,
              bottom: 0,
              background: "rgba(249,115,22,0.35)",
              border: "1px solid rgba(249,115,22,0.9)",
              borderRadius: 2,
              pointerEvents: "none",
            }}
          />
        )}
      </div>
    </div>
  );
}

export default EyeContactLane;
