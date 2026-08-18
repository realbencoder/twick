import React, { useRef, useState, useMemo, useEffect } from "react";
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

  // VISIBLE WINDOW of the ruler, in px. This container's scrollLeft is kept in sync with the
  // timeline's by timeline-view (`seekContainerRef.current.scrollLeft = scrollPosition`), so
  // reading it here IS the timeline viewport. Used to render only the ticks on screen — see the
  // density cap below for why that matters.
  const [rulerViewport, setRulerViewport] = useState({ scrollLeft: 0, width: 0 });
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let raf = 0;
    const read = () => {
      raf = 0;
      // Return the PREVIOUS object when nothing moved: this state feeds the ruler memo, and a fresh
      // object on every scroll event would rebuild every tick div at scroll rate.
      setRulerViewport((prev) =>
        prev.scrollLeft === el.scrollLeft && prev.width === el.clientWidth
          ? prev
          : { scrollLeft: el.scrollLeft, width: el.clientWidth }
      );
    };
    const schedule = () => { if (!raf) raf = requestAnimationFrame(read); };
    read();
    el.addEventListener("scroll", schedule, { passive: true });
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(schedule) : null;
    ro?.observe(el);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      el.removeEventListener("scroll", schedule);
      ro?.disconnect();
    };
  }, []);

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
    // DENSITY CAP, measured against the VISIBLE SPAN — not the whole duration.
    //
    // This cap used to read `duration / NICE[idx][0] > MAX_MAJORS`, with zoom absent from the
    // expression entirely. Since it ran AFTER the zoom-aware choice above, it simply overrode it:
    // a 1454s video needs a step of at least 1454/300 = 4.85s to stay under 300 majors, so it was
    // pinned to 5s or 10s ticks at EVERY zoom level, forever. Zooming to 300% changed nothing.
    // A 142s video (142/300 = 0.47) got second-by-second. The founder noticed unprompted.
    //
    // The ruler now renders only the visible window (see the tick loop), so the count that matters
    // is ~viewportWidth/TARGET_LABEL_PX majors — about 11 on a 1064px viewport. The cap stays as a
    // safety net for degenerate geometry but no longer binds in normal use, which lets the
    // zoom-aware choice above finally survive.
    const MAX_MAJORS = 300;
    const MAX_MINORS = 700;
    // Before first measure (width 0) fall back to the whole duration — that is today's behaviour,
    // for exactly one frame, rather than guessing a viewport we do not have yet.
    const spanSec = rulerViewport.width > 0 ? rulerViewport.width / pxPerSec : duration;
    while (idx < NICE.length - 1 && spanSec / NICE[idx][0] > MAX_MAJORS) idx++;
    let [major, minorSub] = NICE[idx];
    while (minorSub > 1 && spanSec / (major / minorSub) > MAX_MINORS) {
      minorSub = Math.max(1, Math.floor(minorSub / 2));
    }
    return {
      majorIntervalSec: major,
      minorIntervalSec: minorSub > 0 ? major / minorSub : major,
    };
  }, [duration, timelineTickConfigs, ts, rulerViewport.width]);


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

    // Clock format (m:ss) once the scale is a minute or coarser, or the video itself is >= 1 min —
    // "0:05" reads better than "5s" on a long timeline. Short videos keep the terser "5s".
    //
    // PRECISION FOLLOWS THE TICK INTERVAL, NEVER THE DURATION. The old code took the clock branch on
    // `duration >= 60` and then always printed WHOLE seconds, which made the sub-second branch below
    // unreachable for any video over a minute: at a 0.5s tick interval the ruler printed
    // "0:01, 0:01, 0:02, 0:02" — adjacent labels identical, so you could not tell which tick was
    // which while trimming. That fired on any video >= 60s zoomed past ~1.9x, i.e. the 83-second
    // average recording. Windowing the ruler makes sub-second intervals reachable on LONG videos
    // too, so this had to be fixed in the same change or the defect would have gone universal.
    const fmtLabel = (t: number): string => {
      const subSecond = majorIntervalSec < 1;
      const clock = majorIntervalSec >= 60 || duration >= 60;
      if (clock) {
        // Round the TOTAL before splitting. Rounding the seconds part alone yields "1:60" at 59.6s.
        if (subSecond) {
          const total = Math.round(t * 10) / 10;
          const m = Math.floor(total / 60);
          const s = total - m * 60;
          return `${m}:${s.toFixed(1).padStart(4, "0")}`;
        }
        const total = Math.round(t);
        const m = Math.floor(total / 60);
        const s = total % 60;
        return `${m}:${s.toString().padStart(2, "0")}`;
      }
      return subSecond ? `${t.toFixed(1)}s` : `${Math.round(t)}s`;
    };

    // Number of minor ticks per major (integer, guards float drift in the isMajor test below).
    const minorsPerMajor = Math.max(1, Math.round(majorIntervalSec / minorIntervalSec));

    // Build minor-tick positions by INDEX (i * minor) so "is this a major tick" is an exact integer
    // test (i % minorsPerMajor === 0) — the old (t/major) rounding test drifted at fine intervals.
    // WINDOWED: build only the ticks in view, plus one viewport of overscan each side so a scroll
    // never exposes a bare stretch before the next rebuild. Keys stay index-based (`tick-${i}`),
    // so React reconciles the overlap between two windows instead of remounting every node.
    //
    // This is what lets the density cap above stop binding: at any zoom the loop emits roughly
    // (3 viewports / minor spacing) nodes — a couple of hundred — instead of one per minor tick
    // across the entire video.
    const pxPerSecNow = (ts as unknown as { pxPerSec?: number }).pxPerSec || 1;
    const windowed = rulerViewport.width > 0;
    const fromT = windowed
      ? Math.max(0, (rulerViewport.scrollLeft - rulerViewport.width) / pxPerSecNow)
      : 0;
    const toT = windowed
      ? Math.min(duration, (rulerViewport.scrollLeft + rulerViewport.width * 2) / pxPerSecNow)
      : duration;
    const firstMinor = Math.max(0, Math.floor((fromT + epsilon) / minorIntervalSec));
    const lastMinor = Math.floor((toT + epsilon) / minorIntervalSec);
    for (let i = firstMinor; i <= lastMinor; i++) {
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
  }, [duration, minorIntervalSec, majorIntervalSec, ts, totalWidth, rulerViewport]);

  return (
    <div className="twick-seek-track">
      <div
        ref={containerRef}
        className="twick-seek-track-container-no-scrollbar"
        // DRAG ANYWHERE ON THE RULER. The binding used to sit on the playhead div, so live
        // drag-scrub — which is built, shipped and ON by default for every creator — was reachable
        // only by grabbing a ~12px handle. Everywhere else in this editor is a drag surface; the
        // ruler was a click surface. The handler already derives its position from this container's
        // rect + scrollLeft, so it works unchanged from any x.
        //
        // onClick stays for tap-to-seek. A tap also runs the drag handler (down then up at the same
        // x), so it seeks twice to the SAME time — idempotent, and cheaper than a movement-threshold
        // guard that would have to duplicate @use-gesture's tap filtering.
        {...bind()}
        onClick={(e) => seekFromClientX(e.clientX)}
        style={{
          overflowX: "auto",
          overflowY: "hidden",
          position: "relative",
          // Required for the drag: without it the browser claims the pointer for panning and the
          // gesture never reaches us. Desktop-only editor (1024px+ gate), so no touch-scroll loss.
          touchAction: "none",
          scrollbarWidth: "none", // Firefox
          msOverflowStyle: "none", // IE/Edge
        }}
      >
        {/* Ruler with individual tick divs to prevent overlap (memoized above as `ruler`) */}
        {ruler}
        
        {/* Seek tip (playhead) */}
        <div
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
