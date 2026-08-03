import React, { useRef, useState, useMemo } from "react";
import { useDrag } from "@use-gesture/react";
import "../../styles/timeline.css";
import { TimelineTickConfig } from "../video-editor";
import { useTimeScale } from "../../helpers/time-scale";

export interface PlayheadState {
  positionPx: number;
  isDragging: boolean;
}


interface SeekTrackProps {
  currentTime: number;
  duration: number; // in seconds
  zoom?: number; // e.g. 1 = 100px/sec
  onSeek: (time: number) => void;
  timelineCount?: number; // number of timeline to calculate pin height
  timelineTickConfigs?: TimelineTickConfig[]; // custom tick configurations
  /** Called when playhead position or drag state changes (for auto-scroll) */
  onPlayheadUpdate?: (state: PlayheadState) => void;
}

export default function SeekTrack({
  currentTime,
  duration,
  zoom = 1,
  onSeek,
  timelineCount = 0,
  timelineTickConfigs,
  onPlayheadUpdate,
}: SeekTrackProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState<number | null>(null);
  // After drag end, keep playhead at release position until currentTime catches up (avoids snap-back + transition shake)
  const [pendingSeekTime, setPendingSeekTime] = useState<number | null>(null);

  const ts = useTimeScale(zoom, duration);
  const totalWidth = ts.contentWidth;

  // Zoom changes teleport the playhead's CONTENT-pixel position by (Δzoom × pxPerSec × time) —
  // hundreds of px in one step — while the anchor-zoom effect snaps scrollLeft instantly in the
  // same commit. With the 150ms transform transition active, the playhead was still mid-glide at
  // its OLD pixel when the scroll snapped, so it visibly lurched across the screen on every zoom
  // step ("jumps all over the place", audit 2026-08-03, Z1). Suppress the transition for any
  // render where the zoom identity changed; the next currentTime render restores it.
  const prevZoomRef = useRef(zoom);
  const zoomJustChanged = prevZoomRef.current !== zoom;
  prevZoomRef.current = zoom;

  // Calculate pin height based on number of timeline
  const pinHeight = 2 + timelineCount * (2.75 + 0.5); // 2.75rem height + 0.5rem margin per timeline

  // Clear pending seek once context currentTime has caught up
  React.useEffect(() => {
    if (pendingSeekTime === null) return;
    if (Math.abs(currentTime - pendingSeekTime) < 0.05) {
      setPendingSeekTime(null);
    }
  }, [currentTime, pendingSeekTime]);

  // Calculate seek position: when dragging use dragPosition; when we have a pending seek use that; else use currentTime
  const seekPosition = useMemo(() => {
    if (isDragging && dragPosition !== null) {
      return Math.max(0, dragPosition);
    }
    if (pendingSeekTime !== null) {
      return Math.max(0, ts.timeToPx(pendingSeekTime));
    }
    return Math.max(0, ts.timeToPx(currentTime));
  }, [isDragging, dragPosition, currentTime, pendingSeekTime, ts]);

  // Notify parent of playhead state for auto-scroll during playback/drag
  React.useEffect(() => {
    onPlayheadUpdate?.({
      positionPx: seekPosition,
      isDragging,
    });
  }, [seekPosition, isDragging, onPlayheadUpdate]);

  // Tick config (major/minor) based on duration tiers with more density for longer videos
  const { majorIntervalSec, minorIntervalSec } = useMemo(() => {
    // Use custom tick configs if provided
    if (timelineTickConfigs && timelineTickConfigs.length > 0) {
      // Sort configs by duration threshold ascending
      const sortedConfigs = [...timelineTickConfigs].sort((a, b) => a.durationThreshold - b.durationThreshold);
      
      // Find the first config where duration < threshold
      for (const config of sortedConfigs) {
        if (duration < config.durationThreshold) {
          return {
            majorIntervalSec: config.majorInterval,
            minorIntervalSec: config.minorTicks > 0 ? config.majorInterval / (config.minorTicks + 1) : config.majorInterval,
          };
        }
      }
      
      // If no threshold matched, use the last config
      const lastConfig = sortedConfigs[sortedConfigs.length - 1];
      return {
        majorIntervalSec: lastConfig.majorInterval,
        minorIntervalSec: lastConfig.minorTicks > 0 ? lastConfig.majorInterval / (lastConfig.minorTicks + 1) : lastConfig.majorInterval,
      };
    }

    // ZOOM-AWARE default: choose the major interval from actual pixels-per-second so labels sit a
    // comfortable ~96px apart at ANY zoom — instead of coarse duration buckets that left a 10.0s
    // clip showing only "5s"/"10s" (the old `duration < 10` bucket was exclusive, so an exactly-10s
    // video fell through to the 5s-major tier). Each nice interval carries a sensible minor count.
    const pxPerSec = (ts as unknown as { pxPerSec?: number }).pxPerSec || 1;
    const TARGET_LABEL_PX = 96;
    const idealSec = TARGET_LABEL_PX / pxPerSec;
    // [majorSeconds, minorSubdivisions] — minors chosen so a minor tick never falls below ~10px.
    const NICE: Array<[number, number]> = [
      [0.1, 2], [0.25, 5], [0.5, 5], [1, 4], [2, 4], [5, 5], [10, 5],
      [15, 3], [30, 6], [60, 4], [120, 4], [300, 5], [600, 5], [900, 3], [1800, 6], [3600, 6],
    ];
    let idx = NICE.length - 1;
    for (let k = 0; k < NICE.length; k++) {
      if (NICE[k][0] >= idealSec) { idx = k; break; }
    }
    // DENSITY CAP: the ruler renders one <div> per minor tick across the WHOLE content width, so a
    // long video at high zoom could otherwise emit thousands of nodes. Coarsen up the NICE table
    // until the MAJOR-label count is bounded, then thin the minor subdivisions if minors are still
    // too many. Keeps DOM bounded (~a few hundred ticks) at any zoom/duration.
    const MAX_MAJORS = 300;
    const MAX_MINORS = 700;
    while (idx < NICE.length - 1 && duration / NICE[idx][0] > MAX_MAJORS) idx++;
    let [major, minorSub] = NICE[idx];
    while (minorSub > 1 && duration / (major / minorSub) > MAX_MINORS) {
      minorSub = Math.max(1, Math.floor(minorSub / 2));
    }
    return {
      majorIntervalSec: major,
      minorIntervalSec: minorSub > 0 ? major / minorSub : major,
    };
  }, [duration, timelineTickConfigs, ts]);

  // Container width not needed; tick rendering uses CSS backgrounds sized by totalWidth

  // Seek based on an absolute time value (seconds)
  const seekToTime = React.useCallback(
    (time: number) => {
      const clamped = Math.max(0, Math.min(duration, time));
      onSeek(clamped);
    },
    [duration, onSeek]
  );

  // Seek based on clientX coordinate (click or drag position)
  const seekFromClientX = React.useCallback(
    (clientX: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = clientX - rect.left + (containerRef.current.scrollLeft || 0);
      const newTime = Math.max(0, Math.min(duration, ts.pxToTime(x)));
      seekToTime(newTime);
    },
    [duration, ts, seekToTime]
  );

  // LIVE DRAG-SCRUB — now DEFAULT ON: dragging the playhead updates the preview continuously
  // (CapCut/Premiere behavior) instead of only on release. Safe on any machine because the paused
  // scrub uses the pre-generated storyboard/filmstrip tile floor (pure drawImage, no decode) — a
  // weak GPU degrades to thumbnails-while-dragging, never a freeze or black flash. Escape hatch:
  // set ?liveScrub=0, localStorage __editorLiveScrub='0', or window.__editorLiveScrub=false to
  // restore the old seek-on-release behavior. Read once on mount.
  const liveScrubRef = React.useRef(true);
  React.useEffect(() => {
    try {
      const w = window as unknown as { __editorLiveScrub?: boolean };
      const disabled =
        w.__editorLiveScrub === false ||
        (typeof localStorage !== "undefined" && localStorage.getItem("__editorLiveScrub") === "0") ||
        new URLSearchParams(window.location.search).get("liveScrub") === "0";
      liveScrubRef.current = !disabled;
    } catch {
      liveScrubRef.current = true;
    }
  }, []);
  // rAF-throttle so a fast pointer emits at most one seek per frame (always the LATEST target).
  const rafPendingTimeRef = React.useRef<number | null>(null);
  const rafIdRef = React.useRef<number | null>(null);
  React.useEffect(
    () => () => {
      if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
      // Safety net: if we unmount mid-drag, don't leave the controller stuck in scrub-mode.
      if (liveScrubRef.current) {
        (window as unknown as { __webcodecs_controller?: { setScrubbing?: (a: boolean) => void } })
          .__webcodecs_controller?.setScrubbing?.(false);
      }
    },
    []
  );

  const bind = useDrag(({ event, xy: [x], active }) => {
    if (event) {
      event.stopPropagation();
    }

    setIsDragging(active);

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const xPos = x - rect.left + (containerRef.current.scrollLeft || 0);
    const newTime = Math.max(0, Math.min(duration, ts.pxToTime(xPos)));

    if (active) {
      setDragPosition(xPos); // visual playhead follows the finger instantly (unchanged)
      if (liveScrubRef.current) {
        // Tell the app player to enter scrub-mode (storyboard-first, no awaited decode → any machine).
        (window as unknown as { __webcodecs_controller?: { setScrubbing?: (a: boolean) => void } })
          .__webcodecs_controller?.setScrubbing?.(true);
        // rAF-throttled continuous seek: store the latest target, emit once per frame.
        rafPendingTimeRef.current = newTime;
        if (rafIdRef.current === null) {
          rafIdRef.current = requestAnimationFrame(() => {
            rafIdRef.current = null;
            const t = rafPendingTimeRef.current;
            rafPendingTimeRef.current = null;
            if (t !== null) seekToTime(t);
          });
        }
      }
    } else {
      // On drag end: cancel any pending throttled seek, leave scrub-mode (→ exact frame), settle.
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      rafPendingTimeRef.current = null;
      if (liveScrubRef.current) {
        (window as unknown as { __webcodecs_controller?: { setScrubbing?: (a: boolean) => void } })
          .__webcodecs_controller?.setScrubbing?.(false);
      }
      // keep playhead at release position until currentTime catches up (avoids snap-back)
      setDragPosition(null);
      setPendingSeekTime(newTime);
      seekToTime(newTime);
    }
  });

  // Memoized ruler: ticks/labels depend only on duration + zoom (via ts) + the tick intervals — NOT
  // on the playhead. Building the ~110 tick <div>s used to run on every SeekTrack render (~20×/sec
  // during playback, since seekPosition recomputes each tick). Now the node is reused by reference
  // between playhead ticks; it rebuilds only when duration/zoom/intervals change.
  const ruler = useMemo(() => {
    const ticks: React.ReactElement[] = [];
    const labels: React.ReactElement[] = [];
    const epsilon = 1e-6;

    // mm:ss once the scale is a minute or coarser (or the video itself is >= 1 min); sub-second
    // precision when the major interval is finer than 1s; whole seconds otherwise.
    const fmtLabel = (t: number): string => {
      if (majorIntervalSec >= 60 || duration >= 60) {
        const total = Math.round(t);
        const m = Math.floor(total / 60);
        const s = total % 60;
        return `${m}:${s.toString().padStart(2, "0")}`;
      }
      if (majorIntervalSec < 1) return `${t.toFixed(1)}s`;
      return `${Math.round(t)}s`;
    };

    // Number of minor ticks per major (integer, guards float drift in the isMajor test below).
    const minorsPerMajor = Math.max(1, Math.round(majorIntervalSec / minorIntervalSec));

    // Build minor-tick positions by INDEX (i * minor) so "is this a major tick" is an exact integer
    // test (i % minorsPerMajor === 0) — the old (t/major) rounding test drifted at fine intervals.
    const totalMinors = Math.floor((duration + epsilon) / minorIntervalSec);
    for (let i = 0; i <= totalMinors; i++) {
      const t = i * minorIntervalSec;
      const left = ts.timeToPx(t);
      const isMajor = i % minorsPerMajor === 0;

      ticks.push(
        <div
          key={`tick-${i}`}
          style={{
            position: "absolute",
            left,
            top: 0,
            width: "1px",
            height: isMajor ? "13px" : "7px",
            // Minors are now clearly visible (was 0.2 — read as empty between the two big numbers).
            backgroundColor: isMajor ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.32)",
            pointerEvents: "none",
          }}
        />
      );

      if (isMajor && t > epsilon) {
        // Anchor so the first/last labels never clip: left-align near 0, right-align near the end,
        // center in the middle. (The old center-anchored end label hung half-off into overflow:hidden.)
        const nearEnd = left >= totalWidth - 22;
        const anchor = nearEnd ? "translateX(-100%)" : "translateX(-50%)";
        const leftPx = nearEnd ? Math.min(left, totalWidth - 2) : left;
        labels.push(
          <div
            key={`lbl-${i}`}
            style={{
              position: "absolute",
              left: leftPx,
              bottom: "6px",
              transform: anchor,
              color: "rgba(255,255,255,0.72)",
              font: "600 10px system-ui, sans-serif",
              fontVariantNumeric: "tabular-nums",
              whiteSpace: "nowrap",
              pointerEvents: "none",
              textShadow: "0 1px 2px rgba(0,0,0,0.85)",
            }}
          >
            {fmtLabel(t)}
          </div>
        );
      }
    }

    return (
      <div
        style={{
          overflow: "hidden",
          position: "relative",
          width: `${Math.max(1, Math.round(totalWidth))}px`,
          height: "32px",
          backgroundColor: "#0f0f0f",
        }}
      >
        {ticks}
        {labels}
      </div>
    );
  }, [duration, minorIntervalSec, majorIntervalSec, ts, totalWidth]);

  return (
    <div className="twick-seek-track">
      <div
        ref={containerRef}
        className="twick-seek-track-container-no-scrollbar"
        onClick={(e) => seekFromClientX(e.clientX)}
        style={{
          overflowX: "auto",
          overflowY: "hidden",
          position: "relative",
          scrollbarWidth: "none", // Firefox
          msOverflowStyle: "none", // IE/Edge
        }}
      >
        {/* Ruler with individual tick divs to prevent overlap (memoized above as `ruler`) */}
        {ruler}
        
        {/* Seek tip (playhead) */}
        <div
          {...bind()}
          className="twick-seek-track-playhead"
          style={{ 
            position: "absolute",
            left: 0,
            transform: `translateX(${seekPosition}px)`,
            top: 0,
            touchAction: "none",
            transition: isDragging || zoomJustChanged ? "none" : "transform 150ms cubic-bezier(0.4, 0, 0.2, 1)",
            willChange: isDragging ? "transform" : "auto",
          }}
        >
          <div className="twick-seek-track-handle"></div>
          <div 
            className="twick-seek-track-pin"
            style={{ height: `${pinHeight}rem` }}
          ></div>
        </div>
      </div>
    </div>
  );
}
