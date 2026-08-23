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
  /** Width of the label gutter, so the lane lines up with the track rows above it. */
  labelWidth: number;
}

type LaneData = { ranges: Array<[number, number]> } | null | undefined;

export function EyeContactLane({ duration, labelWidth }: EyeContactLaneProps) {
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

  const pct = (t: number) => (duration > 0 ? (t / duration) * 100 : 0);

  return (
    <div style={{ display: "flex", alignItems: "stretch", height: 18 }}>
      <div
        style={{
          width: labelWidth,
          flexShrink: 0,
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
        onPointerCancel={onPointerUp}
        title="Drag to use your original footage here. Drag across a marked range to correct it again."
        style={{
          position: "relative",
          flexGrow: 1,
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
              left: `${pct(from)}%`,
              width: `${pct(to - from)}%`,
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
              left: `${pct(sweep.from)}%`,
              width: `${pct(sweep.to - sweep.from)}%`,
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
