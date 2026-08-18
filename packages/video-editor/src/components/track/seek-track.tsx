import React, { useRef, useState, useMemo, useLayoutEffect } from "react";
import { useDrag } from "@use-gesture/react";
import "../../styles/timeline.css";
import { planRulerTicks, planTickRange, formatRulerLabel } from "../../helpers/ruler-ticks";
import { readTimelineViewport, TIMELINE_SCROLL_SELECTOR } from "../../helpers/strip-window";
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

  // VISIBLE WINDOW, read from the timeline's REAL horizontal scroller — NOT from this element.
  //
  // THIS ELEMENT IS THE WRONG ONE TO MEASURE, and measuring it is a silent no-op rather than a
  // visible bug, which is why it shipped once already. `.twick-seek-track-container-no-scrollbar`
  // is `width:100%` inside a `width: duration*zoom*100` parent, so its clientWidth IS the content
  // width and it never overflows — `scrollLeft` is pinned at 0 and no scroll event ever fires.
  // Divide that width by pxPerSec and the terms cancel: `contentWidth / (contentWidth/duration)`
  // === `duration`, at every zoom. That is exactly the value the zoom-blind code used, so the
  // "fix" recomputed the old answer by a longer route and the ruler stayed at 5s ticks.
  //
  // The scroller is the ANCESTOR `.twick-timeline-scroll-container` (`overflow-x:auto`), which
  // seek-track is rendered inside. `readTimelineViewport` walks up to it — the same helper the
  // per-clip strip canvases use, so both features window against one definition of "on screen".
  const [rulerViewport, setRulerViewport] = useState<{ scrollLeft: number; width: number } | null>(null);
  // useLayoutEffect, NOT useEffect — measured, and it fixes two visible defects.
  //
  // The RENDER that follows a zoom step already has the new pxPerSec but still holds the viewport
  // measured under the OLD one, so the tick range is computed from mismatched halves. With a
  // passive effect the browser PAINTS that frame before the correction lands: measured in Chromium
  // on the 1454s video, zooming while scrolled deeper than ~4 minutes blanked the entire ruler for
  // one frame on 7 of 8 clicks, so rapid zooming strobed.
  //
  // A layout effect runs before paint and its setState re-renders synchronously, so the corrected
  // frame is the only one shown. The same reasoning covers first paint, where `rulerViewport` is
  // null and the ruler falls back to the whole duration: that fallback used to be painted once on
  // every editor open (~582 tick divs at the wrong spacing, replaced by 73 a frame later).
  //
  // This does NOT make scrolling synchronous — the effect body runs on mount and on `ts` change
  // only. Scroll updates arrive through the listener below, outside React's commit, and stay
  // passive.
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const scroller = el.closest(TIMELINE_SCROLL_SELECTOR) as HTMLElement | null;
    if (!scroller) {
      // Degrade to the un-windowed full-duration ruler rather than rendering nothing. Loud,
      // because a silent degradation here is indistinguishable from working (repo rule: a quiet
      // fallback on a quality path is how RAG stayed dead for months).
      console.warn("[seek-track] no .twick-timeline-scroll-container ancestor — ruler ticks will not follow zoom");
      return;
    }
    let raf = 0;
    const read = () => {
      raf = 0;
      const v = readTimelineViewport(el);
      if (!v) return;
      // Keep the PREVIOUS object when nothing moved. This feeds a memo; a fresh object per scroll
      // event would rebuild the ruler at scroll rate.
      setRulerViewport((prev) =>
        prev && prev.scrollLeft === v.scrollLeft && prev.width === v.viewportWidth
          ? prev
          : { scrollLeft: v.scrollLeft, width: v.viewportWidth }
      );
    };
    const schedule = () => { if (!raf) raf = requestAnimationFrame(read); };
    read();
    scroller.addEventListener("scroll", schedule, { passive: true });
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(schedule) : null;
    ro?.observe(scroller);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      scroller.removeEventListener("scroll", schedule);
      ro?.disconnect();
    };
    // Re-read on any time-scale change: a zoom step rewrites both the content width and
    // scrollLeft, and `ts` is memoized on [zoom, duration, labelWidth] so this does not re-run
    // during scrolling.
  }, [ts]);

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

    // ZOOM-AWARE: the interval comes from actual pixels-per-second so labels sit ~96px apart at ANY
    // zoom. The density cap inside chooseTickInterval is measured against the VISIBLE span, not the
    // duration — see helpers/ruler-ticks.ts for why that distinction is the whole bug.
    const pxPerSec = (ts as unknown as { pxPerSec?: number }).pxPerSec || 1;
    // Before the first measure, fall back to the whole duration — today's behaviour for exactly
    // one frame, rather than guessing a viewport we do not have yet.
    // planRulerTicks (not chooseTickInterval) so the WIDTH is what crosses the boundary — see
    // its docblock: handing a span across meant no test could express passing the wrong width,
    // which is precisely how the zoom-blind version shipped green.
    return planRulerTicks({ duration, pxPerSec, viewportWidth: rulerViewport?.width ?? null });
  }, [duration, timelineTickConfigs, ts, rulerViewport]);


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
  // TICK INDEX RANGE — hoisted out of the ruler memo deliberately, and this is load-bearing.
  //
  // The ruler memo used to depend on the `rulerViewport` OBJECT. That was harmless only while the
  // viewport was measured from the wrong element and scrollLeft was frozen at 0; the moment the
  // measurement is correct, a new object per scroll frame rebuilds every tick div at scroll rate
  // (measured on a harness of the shipped shapes: 120 rebuilds per 120 frames vs 8 with these
  // scalars, identical output). Fixing the measurement without this trades a tick bug for a
  // scroll-jank bug. The strip windowing next door states the same rule — see the comment in
  // track-element.tsx about a scroll prop defeating the memo.
  //
  // Scalars, not an object: the range only changes when the window crosses a whole tick, which is
  // what makes the rebuild rate a function of tick spacing rather than of pixels moved.
  const { firstMinor, lastMinor } = useMemo(
    () =>
      planTickRange({
        duration,
        pxPerSec: (ts as unknown as { pxPerSec?: number }).pxPerSec || 1,
        minorIntervalSec,
        viewport: rulerViewport,
      }),
    [rulerViewport, ts, duration, minorIntervalSec],
  );

  const ruler = useMemo(() => {
    const ticks: React.ReactElement[] = [];
    const labels: React.ReactElement[] = [];
    const epsilon = 1e-6;

    const fmtLabel = (t: number): string => formatRulerLabel(t, majorIntervalSec, duration);

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
    // NOTE the deps: firstMinor/lastMinor, NEVER rulerViewport. See the hoist comment above.
  }, [duration, minorIntervalSec, majorIntervalSec, ts, totalWidth, firstMinor, lastMinor]);

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
