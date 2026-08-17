import { useState, useEffect, useRef, useMemo, memo } from "react";
import { useDrag } from "@use-gesture/react";
import { motion, HTMLMotionProps } from "framer-motion";
import {
  MIN_DURATION,
  DRAG_TYPE,
  SNAP_THRESHOLD_PX,
} from "../../helpers/constants";
import { ELEMENT_COLORS } from "../../helpers/editor.utils";
import {
  FrameEffect,
  getDecimalNumber,
  TrackElement,
  TIMELINE_ELEMENT_TYPE,
  snapTime,
  pxToSecThreshold,
} from "@twick/timeline";
import { ElementColors } from "../../helpers/types";
import {
  endHandleLimit,
  endHandleSnapTargets,
  reclaimAffordance,
  snapFloorForGrowth,
} from "../../helpers/seam-give-back";
import { drawClipWaveform, getTimelineWaveform } from "../../helpers/waveform-render";
import { drawClipFilmstrip, getFilmstripMeta } from "../../helpers/filmstrip-render";
import {
  computeStripWindow,
  windowToSourceRange,
  readTimelineViewport,
  STRIP_OVERSCAN_FACTOR,
  TIMELINE_SCROLL_SELECTOR,
} from "../../helpers/strip-window";
import { Volume2, VolumeX } from "lucide-react";
import "../../styles/timeline.css";

// Thumbnail cache keyed by SOURCE (not element id) so split-clone siblings sharing a src reuse one
// decode, and a remount (e.g. aspect-ratio switch) doesn't re-decode every clip. Values are ~320px
// JPEG data URLs (~10-30KB); distinct sources are far fewer than clips, so unbounded is fine here.
// (If a project ever loads hundreds of distinct large sources, wrap this in a bounded LRU.)
const THUMB_CACHE = new Map<string, string>();

export interface TrackElementDragPayload {
  element: TrackElement;
  dragType: string;
  updates: { start: number; end: number };
}

export interface DropPointer {
  clientX: number;
  clientY: number;
}

interface TrackElementViewProps {
  element: TrackElement;
  selectedItem: TrackElement | null;
  selectedIds: Set<string>;
  parentWidth: number;
  duration: number;
  nextStart: number | null;
  prevEnd: number;
  allowOverlap: boolean;
  onSelection: (element: TrackElement, event: React.MouseEvent) => void;
  onDrag: (payload: TrackElementDragPayload, dropPointer?: DropPointer) => void;
  onDragStateChange?: (isDragging: boolean, element?: TrackElement) => void;
  elementColors?: ElementColors;
  /**
   * Returns the timeline snap-target times (in seconds) — other clips' edges, the playhead, 0, and
   * the timeline end — excluding the given element. MUST be a stable reference (parent wraps in
   * useCallback reading refs) so this memoized component is not re-created on every playhead tick.
   * Optional: when omitted, dragging behaves exactly as before (no snapping).
   */
  getSnapTargets?: (excludeElementId: string) => number[];
  /**
   * True when this element lives on the MAIN "Video" track (the recording itself — its audio is
   * embedded in the video element; there is no separate main-audio track). Gates the waveform
   * strip: the app-registered waveform (window.__twick_waveform) describes the main recording's
   * audio only, so B-roll/overlay video elements must never draw it.
   */
  isMainVideoTrack?: boolean;
  /**
   * True when this element's TRACK is locked (the padlock in the track header). Locked clips must
   * not move, trim, or delete — the lock previously only toggled a CSS class + blocked row reorder,
   * so clips inside a "locked" track stayed fully editable (the padlock lied). Gates the drag/trim
   * binds here; delete/split are gated in use-timeline-manager.
   */
  locked?: boolean;
  /** Element count on the magnetic main track — reorder never activates with < 2 clips. */
  mainTrackElementCount?: number;
  /**
   * TIMELINE seconds this clip may reclaim past `nextStart` — the footage a ripple cut removed at
   * this seam (see helpers/seam-give-back.ts). 0 for every clip that cannot give anything back
   * (the last clip, a different-source neighbour, a pure split seam), which is exactly today's
   * behaviour. Computed ONCE in track-base from the same function the commit clamps to, so the
   * tooltip can never advertise headroom the commit refuses.
   */
  reclaimSeconds?: number;
  /** Reorder lift/settle notifications (ghost + caret visuals live in timeline-view). */
  onReorderStateChange?: (active: boolean, element?: TrackElement, thumbUrl?: string | null) => void;
}

// Memoized (see track-base): a clip is independent of the playhead tick, so with stable props from
// the parent default shallow compare skips playback re-renders. Local drag/resize state lives BELOW
// this boundary so interactions still update live; a real edit changes selectedItem/selectedIds refs
// → shallow compare re-renders exactly the affected clip.
export const TrackElementView = memo(({
  element,
  parentWidth,
  duration,
  nextStart,
  prevEnd,
  selectedItem,
  selectedIds,
  onSelection,
  onDrag,
  allowOverlap = false,
  onDragStateChange,
  elementColors,
  getSnapTargets,
  isMainVideoTrack = false,
  locked = false,
  mainTrackElementCount,
  reclaimSeconds = 0,
  onReorderStateChange,
}: TrackElementViewProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const dragType = useRef<string | null>(null);
  const lastPosRef = useRef<{ start: number; end: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [thumbUrl, setThumbUrl] = useState<string | null>(() => {
    // Seed synchronously from the cache so a remount with a warm src shows no thumbnail flash.
    const s = (element as any).getProps?.()?.src;
    return s && THUMB_CACHE.has(s) ? THUMB_CACHE.get(s)! : null;
  });

  // ── Drag-to-reorder (main track) activation state. The MOVE-pin stays the rendered truth;
  // reorder only LIFTS a ghost (timeline-view owns all visuals). Mouse: >8px cumulative |dx|.
  // Touch: 250ms long-press with <8px movement (movement first = today's pin drag — protects
  // tap-select and scroll intent).
  const [isReordering, setIsReordering] = useState(false);
  const reorderActiveRef = useRef(false);
  const accumDxRef = useRef(0);
  const touchDragRef = useRef(false);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const canActivateReorder = () =>
    !!isMainVideoTrack &&
    !locked &&
    element.getType() === "video" &&
    selectedIds.size <= 1 &&
    (mainTrackElementCount ?? 0) >= 2;

  const activateReorder = () => {
    if (reorderActiveRef.current) return;
    reorderActiveRef.current = true;
    // Settle playback before any permutation math — established vendored pattern (transport buttons).
    (window as unknown as { __webcodecs_controller?: { pause?: () => void } })
      .__webcodecs_controller?.pause?.();
    setIsReordering(true);
    onReorderStateChange?.(true, element, thumbUrl);
  };

  const settleReorder = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    accumDxRef.current = 0;
    touchDragRef.current = false;
    if (reorderActiveRef.current) {
      reorderActiveRef.current = false;
      setIsReordering(false);
      onReorderStateChange?.(false, element);
    }
  };

  // Extract a single thumbnail frame for video/image elements
  useEffect(() => {
    const type = element.getType();
    if (type !== 'video' && type !== 'image') return;
    const props = (element as any).getProps?.() ?? {};
    const src = props.src;
    if (!src) return;

    // Cache hit — no decode, no hidden <video> created (the whole point of #11).
    if (THUMB_CACHE.has(src)) {
      setThumbUrl(THUMB_CACHE.get(src)!);
      return;
    }

    if (type === 'image') {
      THUMB_CACHE.set(src, src);
      setThumbUrl(src);
      return;
    }

    // Video: extract one frame from ~1 second in (avoid black first frame)
    let cancelled = false;

    function tryExtract(useCors: boolean) {
      const video = document.createElement('video');
      if (useCors) video.crossOrigin = 'anonymous';
      video.muted = true;
      video.preload = 'auto';
      // Cache-busting param on the CORS attempt (root cause of 'thumbnail disappears on editor
      // re-entry'): a prior plain <video> playback (no Origin header) poisons the browser/CDN
      // cache with a no-ACAO response; the crossOrigin extraction then hits that cached copy,
      // errors, falls back to the no-CORS retry — which loads but TAINTS the canvas, so
      // toDataURL throws and the thumbnail is silently skipped. A fresh cache key forces a
      // request WITH Origin → ACAO attached → extraction succeeds. NEVER append to presigned
      // URLs (X-Amz- signature covers the query string — extra params 403).
      let extractSrc = src;
      if (useCors && !src.includes('X-Amz-') && !src.startsWith('blob:')) {
        extractSrc = src + (src.includes('?') ? '&' : '?') + 'cs_thumb=1';
      }

      video.onloadeddata = () => {
        if (cancelled) return;
        video.currentTime = Math.min(1, video.duration * 0.1);
      };
      video.onseeked = () => {
        if (cancelled) return;
        try {
          const w = 320;
          const h = Math.round(w * (video.videoHeight / (video.videoWidth || 1)));
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h || w;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
            if (!cancelled) {
              THUMB_CACHE.set(src, dataUrl);
              setThumbUrl(dataUrl);
            }
          }
        } catch {
          // Canvas tainted (CORS) — retry without crossOrigin won't help for toDataURL
          // Just skip thumbnail for this element
        }
        video.src = '';
        video.load();
      };
      video.onerror = () => {
        if (useCors && !cancelled) {
          // CORS blocked — retry without crossOrigin
          tryExtract(false);
        }
      };
      video.src = extractSrc;
    }

    tryExtract(true);

    return () => { cancelled = true; };
  }, [element.getId()]);

  const [position, setPosition] = useState({
    start: 0,
    end: 0,
  });

  useEffect(() => {
    setPosition({
      start: element.getStart(),
      end: element.getEnd(),
    });
  }, [element.getStart(), element.getEnd(), parentWidth, duration]);

  // Waveform strip (MAIN video clips only) — draws this clip's SOURCE slice of the app-registered
  // waveform (window.__twick_waveform) as mirrored bars along the bottom of the clip. Split-aware:
  // the slice starts at props.time (source offset), so a split/trimmed clip shows ITS audio, not
  // the start of the file. Redraws on trim/drag/zoom via the position/parentWidth deps (cheap —
  // a few hundred rects). The 'twick-waveform-ready' listener stays attached even after a
  // successful paint: the app registers the waveform in TIERS (instant 50/sec from the DB, then
  // an async 300/sec HD artifact from S3) and re-dispatches on each swap — an early-return after
  // the first paint would leave every already-painted clip on the low-res tier forever.
  const waveformCanvasRef = useRef<HTMLCanvasElement>(null);
  const showWaveform = isMainVideoTrack && element.getType() === "video";
  // Read the source offset at RENDER time so it participates in the draw-effect deps. A start-edge
  // trim commits by mutating props.time IN PLACE while the committed start/end can be numerically
  // identical to the local drag state (snapping/clamping produces exactly this) — so position deps
  // alone would never re-fire and the bars would keep the pre-trim offset (adversarial-review
  // finding). srcTime/rate in the deps re-draw on the post-commit render.
  const wfProps = showWaveform ? ((element as any).getProps?.() ?? {}) : null;
  const wfSrcTime = wfProps ? Number(wfProps.time) || 0 : 0;
  const wfRate = wfProps ? Number(wfProps.playbackRate) || 1 : 1;
  // Clip volume (linear, 1 = unity) — bars scale with the Playback panel's volume slider.
  const wfVolume = wfProps ? Number(wfProps.volume ?? 1) : 1;
  useEffect(() => {
    if (!showWaveform) return;
    const canvas = waveformCanvasRef.current;
    if (!canvas) return;
    let rafId = 0;
    let cancelled = false;
    const draw = () => {
      if (cancelled) return false;
      const wf = getTimelineWaveform();
      if (!wf) return false;
      // LIVE source start during an in-flight START trim: the commit advances props.time only on
      // release, so drawing from the committed offset showed audio `delta` seconds EARLIER than
      // what plays at each pixel — the silence the user aimed at migrated under the cursor and the
      // release landed on speech (audit 2026-08-03, T3). Head-trim keeps on-screen content
      // anchored, so the live window is [time + delta, …]: bars crop from the LEFT. Delta is 0 at
      // rest/after commit (position === element), and MOVE/END drags don't shift the source.
      const liveTrimDelta =
        dragType.current === DRAG_TYPE.START
          ? (position.start - element.getStart()) * wfRate
          : 0;
      // ── WINDOWING. Size the canvas to the VISIBLE slice of this clip and narrow the source
      // range to match. Both halves are required: the bar COUNT derives from cssWidth, so a
      // narrower canvas alone still produces the sparse comb that makes long-clip waveforms
      // unreadable. See helpers/strip-window.ts for the measurements.
      const vp = readTimelineViewport(canvas);
      const win = vp
        ? computeStripWindow({
            clipStart: position.start,
            clipEnd: position.end,
            duration,
            parentWidth,
            scrollLeft: vp.scrollLeft,
            viewportWidth: vp.viewportWidth,
            overscanPx: vp.viewportWidth * STRIP_OVERSCAN_FACTOR,
          })
        : null;
      if (vp && !win) {
        // Entirely off screen — skip the draw. This gate is what keeps scroll-driven redraws
        // affordable: without it every scroll frame would redraw all N main-track clips.
        return false;
      }
      // No scroller (tests, detached render) ⟹ fall back to today's full-clip behaviour.
      canvas.style.left = win ? `${win.leftFrac * 100}%` : "0";
      canvas.style.width = win ? `${win.widthFrac * 100}%` : "100%";

      const { sourceStart, span: srcSpan } = win
        ? windowToSourceRange(win, {
            clipStart: position.start,
            sourceStart: wfSrcTime + liveTrimDelta,
            rate: wfRate,
            // SOURCE seconds — the waveform's caller pre-applies the rate. The filmstrip below
            // wants TIMELINE seconds. Getting this backwards is wrong by exactly the playback
            // rate, on sped-up clips only.
            spanSpace: "source",
          })
        : {
            sourceStart: Math.max(0, wfSrcTime + liveTrimDelta),
            span: Math.max(0, (position.end - position.start) * wfRate),
          };

      // Cap DPR at 2 — retina-crisp without 3x-display overdraw on a long timeline of clips.
      const dpr = Math.min(2, (typeof window !== "undefined" && window.devicePixelRatio) || 1);
      return drawClipWaveform(canvas, wf, {
        gain: wfVolume,
        srcStart: sourceStart,
        srcSpan,
        cssWidth: canvas.clientWidth,
        cssHeight: canvas.clientHeight,
        dpr,
      });
    };
    // rAF-coalesced: scroll and resize both fire far faster than a frame, and a burst must not
    // queue a redraw each. Mirrors the filmstrip's existing scheduleRedraw.
    const schedule = () => {
      if (cancelled || rafId) return;
      rafId = requestAnimationFrame(() => { rafId = 0; draw(); });
    };
    draw();
    const onReady = () => { draw(); };
    window.addEventListener("twick-waveform-ready", onReady);
    // Scroll does not bubble, so subscribe on the scroller itself. Deliberately NOT a prop and
    // NOT a dep: TrackBase and TrackElementView are both memo'd and every prop is referentially
    // stable on a pure scroll, so the memo bails today — a scroll prop would defeat it at the
    // deep boundary where 3 useDrag bindings per clip re-parse their config unguarded.
    const scroller = canvas.closest(TIMELINE_SCROLL_SELECTOR) as HTMLElement | null;
    scroller?.addEventListener("scroll", schedule, { passive: true });
    // The right properties panel is a CONDITIONAL flex sibling, so toggling it changes the
    // scroller's width with NO resize event and nothing in these deps can notice. The panel
    // DISAPPEARING is the silent direction: the window stays too narrow and the rightmost
    // 240-360px of every strip keeps no canvas coverage until the next zoom or window resize.
    const ro = scroller && typeof ResizeObserver !== "undefined" ? new ResizeObserver(schedule) : null;
    if (scroller && ro) ro.observe(scroller);
    return () => {
      cancelled = true;
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("twick-waveform-ready", onReady);
      scroller?.removeEventListener("scroll", schedule);
      ro?.disconnect();
    };
  }, [showWaveform, element.getId(), position.start, position.end, wfSrcTime, wfRate, wfVolume, parentWidth, duration]);

  // Timeline FILMSTRIP: a row of frames across each main-video clip (from the scrub storyboard the
  // app registers on window.__twick_filmstrip). Draw-only sprite blits — never toDataURL'd, so
  // unlike the single-frame thumbnail extractor this can't taint or fail on a CORS-less response.
  // Same source-offset handling as the waveform (wfSrcTime/wfRate), so a split/trimmed/reordered
  // clip shows ITS content. Falls back to nothing (the single-frame background shows) when the
  // video has no storyboard. 'twick-filmstrip-ready' triggers the first paint if it registers late.
  const filmstripCanvasRef = useRef<HTMLCanvasElement>(null);
  const showFilmstrip = isMainVideoTrack && element.getType() === "video";

  // ── Silence-cut PREVIEW BANDS (auto-silence Phase 2, item 10) ─────────────
  // While the app's Remove Silences popover is open it registers the candidate
  // cut ranges on window.__twick_silence_preview ({ ranges: [[from,to]...] in
  // TIMELINE seconds, excluded: number[] of range indices }) and dispatches
  // 'twick-silence-preview' — the same app↔fork bridge shape as the waveform
  // and filmstrip. Bands are DISPLAY-ONLY (pointer-events none): included cuts
  // amber, excluded cuts dimmed grey — so the creator sees exactly where every
  // cut lands on their own footage before committing 10-130 edits on trust.
  // Cleared (bridge nulled + event) when the popover closes.
  const [silenceTick, setSilenceTick] = useState(0);
  useEffect(() => {
    if (!isMainVideoTrack) return;
    const bump = () => setSilenceTick((t) => t + 1);
    window.addEventListener("twick-silence-preview", bump);
    return () => window.removeEventListener("twick-silence-preview", bump);
  }, [isMainVideoTrack]);
  const silenceBands = useMemo(() => {
    if (!isMainVideoTrack || element.getType() !== "video") return [];
    const data = (window as any).__twick_silence_preview as
      | { ranges: Array<[number, number]>; excluded?: number[] }
      | null
      | undefined;
    if (!data?.ranges?.length) return [];
    const clipStart = position.start;
    const clipSpan = position.end - position.start;
    if (!(clipSpan > 0)) return [];
    const excluded = new Set(data.excluded ?? []);
    const bands: Array<{ leftPct: number; widthPct: number; excluded: boolean; key: string }> = [];
    data.ranges.forEach(([f, t], i) => {
      const lo = Math.max(f, clipStart);
      const hi = Math.min(t, position.end);
      if (hi - lo <= 0.01) return;
      bands.push({
        key: `${i}-${f.toFixed(3)}`,
        leftPct: ((lo - clipStart) / clipSpan) * 100,
        widthPct: ((hi - lo) / clipSpan) * 100,
        excluded: excluded.has(i),
      });
    });
    return bands;
    // silenceTick re-derives on every bridge dispatch; position keeps bands glued through drags.
  }, [silenceTick, isMainVideoTrack, element, position.start, position.end]);
  useEffect(() => {
    if (!showFilmstrip) return;
    const canvas = filmstripCanvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    // COALESCED redraw. A full-length clip's filmstrip samples from ~ALL of a video's storyboard
    // sheets at once; on slow wifi they arrive one at a time and each arrival fires this "a sheet
    // decoded → redraw" callback. It MUST be a single STABLE ref: filmstrip-render's per-sheet waiter
    // Set dedups a stable ref, so a redraw re-subscribing to the still-loading sheets is a no-op.
    // Passing a fresh `() => draw()` per redraw (the old code) instead accumulated a new callback on
    // every still-loading sheet, so each sheet-load re-fired every prior callback → redraws doubled
    // 1,2,4,8,… → the main thread froze the instant you opened a storyboard video on slow wifi. The
    // rAF also coalesces a burst of near-simultaneous sheet-loads into one repaint. (Verified by
    // helpers/filmstrip-cascade.test.ts: 4096 redraws → 21.)
    let rafId = 0;
    const scheduleRedraw = () => {
      if (cancelled || rafId) return;
      rafId = requestAnimationFrame(() => { rafId = 0; draw(); });
    };
    function draw(): boolean {
      if (cancelled) return false;
      const meta = getFilmstripMeta();
      if (!meta) return false;
      // Same live head-trim offset as the waveform (audit T3) — frames crop from the LEFT during
      // an in-flight START drag instead of sliding under the cursor.
      const liveTrimDelta =
        dragType.current === DRAG_TYPE.START
          ? (position.start - element.getStart()) * wfRate
          : 0;
      // ── WINDOWING (see the waveform above and helpers/strip-window.ts). The frame count caps at
      // 120 for the whole clip, so on a long clip each 270x480 tile is stretched ~14:1. Narrowing
      // the canvas AND the span is what restores the intended frame density.
      const vp = readTimelineViewport(canvas);
      const win = vp
        ? computeStripWindow({
            clipStart: position.start,
            clipEnd: position.end,
            duration,
            parentWidth,
            scrollLeft: vp.scrollLeft,
            viewportWidth: vp.viewportWidth,
            overscanPx: vp.viewportWidth * STRIP_OVERSCAN_FACTOR,
          })
        : null;
      if (vp && !win) return false; // entirely off screen — skip
      canvas!.style.left = win ? `${win.leftFrac * 100}%` : "0";
      canvas!.style.width = win ? `${win.widthFrac * 100}%` : "100%";

      const { sourceStart, span } = win
        ? windowToSourceRange(win, {
            clipStart: position.start,
            sourceStart: wfSrcTime + liveTrimDelta,
            rate: wfRate,
            // TIMELINE seconds — drawClipFilmstrip multiplies by playbackRate itself (:217).
            // The waveform above wants SOURCE seconds. This asymmetry is the whole reason
            // windowToSourceRange takes an explicit space and has no default.
            spanSpace: "timeline",
          })
        : {
            sourceStart: Math.max(0, wfSrcTime + liveTrimDelta),
            span: Math.max(0, position.end - position.start),
          };

      // Measured AFTER the width assignment above — clientWidth must reflect the windowed size,
      // or the canvas is sized for the whole clip while the source range covers only the slice
      // (R1 inverted: the sliver's audio stretched across the full clip).
      const widthPx = canvas!.clientWidth;
      const heightPx = canvas!.clientHeight;
      if (widthPx <= 0 || heightPx <= 0) return false;
      const dpr = Math.min(2, (typeof window !== "undefined" && window.devicePixelRatio) || 1);
      drawClipFilmstrip(
        canvas!,
        meta,
        { sourceStart, span, playbackRate: wfRate, widthPx, heightPx, dpr },
        scheduleRedraw // STABLE ref → deduped by ensureSheet; rAF coalesces bursts. NEVER a fresh closure.
      );
      return true;
    }
    const drewNow = draw();
    const onReady = () => { draw(); };
    // Only listen for late registration if the first paint couldn't draw yet (filmstrip not registered).
    if (!drewNow) window.addEventListener("twick-filmstrip-ready", onReady);
    const scroller = canvas.closest(TIMELINE_SCROLL_SELECTOR) as HTMLElement | null;
    scroller?.addEventListener("scroll", scheduleRedraw, { passive: true });
    const ro = scroller && typeof ResizeObserver !== "undefined" ? new ResizeObserver(scheduleRedraw) : null;
    if (scroller && ro) ro.observe(scroller);
    return () => {
      cancelled = true;
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("twick-filmstrip-ready", onReady);
      scroller?.removeEventListener("scroll", scheduleRedraw);
      ro?.disconnect();
    };
  }, [showFilmstrip, element.getId(), position.start, position.end, wfSrcTime, wfRate, parentWidth, duration]);

  // Snaps a candidate edge time (seconds) to the nearest timeline target within SNAP_THRESHOLD_PX,
  // measured in the CURRENT zoom (pixelsPerSecond = parentWidth / duration). Returns the input
  // unchanged when snapping is disabled (no getSnapTargets) or nothing is within threshold.
  const snapEdgeTime = (t: number, targets: number[]): number => {
    if (targets.length === 0 || !parentWidth || duration <= 0) return t;
    const thresholdSec = pxToSecThreshold(SNAP_THRESHOLD_PX, parentWidth / duration);
    return snapTime(t, targets, thresholdSec).time;
  };

  const rawMoveRef = useRef<number | null>(null);
  const bind = useDrag(({ delta: [dx], event, first }) => {
    if (locked) return; // locked track — clips can't be moved
    if (!parentWidth) return;
    if (first) rawMoveRef.current = null;
    if (dx == 0) return;
    // Don't start a move if user is dragging a handle
    if (dragType.current === DRAG_TYPE.START || dragType.current === DRAG_TYPE.END) return;
    if ((event?.target as HTMLElement)?.closest?.('.twick-track-element-handle')) return;
    if (!isDragging) {
      setIsDragging(true);
      onDragStateChange?.(true, element);
    }
    dragType.current = DRAG_TYPE.MOVE;
    if (isMainVideoTrack) {
      accumDxRef.current += Math.abs(dx);
      if (accumDxRef.current > 8) {
        if (touchDragRef.current) {
          // Touch moved past the dead zone before the long-press fired → the user is
          // pin-dragging or scrolling, not reordering. Cancel the pending lift.
          if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
          }
        } else if (!reorderActiveRef.current && canActivateReorder()) {
          activateReorder();
        }
      }
    }
    // Read snap targets ONCE per move, OUTSIDE the state updater (updater stays pure).
    const snapTargets = getSnapTargets?.(element.getId()) ?? [];
    setPosition((prev) => {
      const span = prev.end - prev.start;
      if (span <= 0) return prev; // Prevent degenerate state
      // RAW accumulator (see rawEdgeRef above): advance from the unsnapped position so the clip
      // can escape a snap target with a slow drag instead of being re-absorbed every event.
      let newStart = (rawMoveRef.current ?? prev.start) + (dx / parentWidth) * duration;
      newStart = Math.max(0, newStart);
      if (!allowOverlap) {
        if (prevEnd !== null && newStart < prevEnd) {
          newStart = prevEnd;
        }
        if (nextStart !== null && newStart + span > nextStart) {
          newStart = nextStart - span;
        }
      }
      rawMoveRef.current = newStart;
      // MAGNETIC MAIN TRACK: main-recording clips are GLUED edge-to-edge (their position comes
      // from clip order, not free placement) until drag-to-REORDER ships. A free rightward MOVE
      // creates a displacement gap whose auto-close ripples caption/overlay tracks — silently
      // deleting/desyncing captions while the video snaps back looking untouched (adversarial-
      // review finding). So MOVE pins the clip to its magnetic slot; the START/END trim handles
      // remain the editing surface for main clips.
      if (isMainVideoTrack) {
        newStart = prevEnd !== null ? prevEnd : 0;
        const pinnedEnd = newStart + span;
        if (pinnedEnd <= newStart) return prev;
        return { start: newStart, end: pinnedEnd };
      }
      // Magnetic snap: snap whichever edge (start OR end) sits closest to a target, preserving the
      // clip's span, then re-honor the neighbor clamps (a clamp override cancels the snap).
      if (snapTargets.length) {
        const s = snapEdgeTime(newStart, snapTargets);
        const e = snapEdgeTime(newStart + span, snapTargets);
        const sDist = s !== newStart ? Math.abs(s - newStart) : Infinity;
        const eDist = e !== newStart + span ? Math.abs(e - (newStart + span)) : Infinity;
        if (sDist !== Infinity && sDist <= eDist) {
          newStart = s;
        } else if (eDist !== Infinity) {
          newStart = e - span;
        }
        newStart = Math.max(0, newStart);
        if (!allowOverlap) {
          if (prevEnd !== null && newStart < prevEnd) newStart = prevEnd;
          if (nextStart !== null && newStart + span > nextStart) newStart = nextStart - span;
        }
      }
      // Ensure end > start always
      const newEnd = newStart + span;
      if (newEnd <= newStart) return prev;

      return {
        start: newStart,
        end: newEnd,
      };
    });
  });

  // RAW (unsnapped) edge position for the in-flight trim gesture. Snapping must be display-only:
  // the old code advanced from the PREVIOUSLY-SNAPPED position each move, so while the edge sat on
  // a snap target every sub-threshold delta was re-absorbed back to the target — a slow careful
  // drag never escaped, and only a single-event flick (>10px between two pointer events) could move
  // the handle at all (audit 2026-08-03, T1: "trim only works over 5-10 seconds"). The raw value
  // keeps accumulating under the snap, so the handle escapes the moment the pointer genuinely
  // leaves the capture radius. Reset per gesture via `first`.
  const rawEdgeRef = useRef<number | null>(null);

  const bindStartHandle = useDrag(({ delta: [dx], event, first, last }) => {
    if (locked) return; // locked track — clips can't be trimmed
    if (event) {
      event.stopPropagation();
    }
    if (first) rawEdgeRef.current = null;
    if (dx === 0 && !last) return;
    dragType.current = DRAG_TYPE.START;
    if (last) { rawEdgeRef.current = null; return; } // Keep dragType as START so sendUpdate adjusts startAt
    const snapTargets = getSnapTargets?.(element.getId()) ?? [];
    setPosition((prev) => {
      let raw = (rawEdgeRef.current ?? prev.start) + (dx / parentWidth) * duration;
      raw = Math.max(0, Math.min(raw, prev.end - MIN_DURATION));
      if (prevEnd !== null && !allowOverlap && raw < prevEnd) {
        raw = prevEnd;
      }
      rawEdgeRef.current = raw;
      let newStart = raw;
      // Snap the leading edge for DISPLAY, then re-honor the same clamps.
      if (snapTargets.length) {
        let snapped = snapEdgeTime(raw, snapTargets);
        snapped = Math.max(0, Math.min(snapped, prev.end - MIN_DURATION));
        if (prevEnd !== null && !allowOverlap && snapped < prevEnd) snapped = prevEnd;
        newStart = snapped;
      }
      return {
        start: newStart,
        end: prev.end,
      };
    });
  });

  const bindEndHandle = useDrag(({ delta: [dx], event, first, last }) => {
    if (locked) return; // locked track — clips can't be trimmed
    if (event) {
      event.stopPropagation();
    }
    if (first) rawEdgeRef.current = null;
    if (dx === 0 && !last) return;
    dragType.current = DRAG_TYPE.END;
    if (last) { rawEdgeRef.current = null; return; } // Keep dragType as END so sendUpdate knows it was an edge drag
    const snapTargets = getSnapTargets?.(element.getId()) ?? [];
    setPosition((prev) => {
      let raw = (rawEdgeRef.current ?? prev.end) + (dx / parentWidth) * duration;
      raw = Math.max(raw, prev.start + MIN_DURATION);
      // GIVE-BACK: the neighbour clamp is widened by whatever a ripple cut removed at this seam, so
      // a clip on the contiguous main track can be dragged back out to reclaim its own removed
      // footage (helpers/seam-give-back.ts). `reclaimSeconds` is 0 everywhere it doesn't apply, so
      // this reduces to the original `raw > nextStart → nextStart` clamp by construction.
      // Note: end clamping for overlays is handled in onElementDrag (useTimelineManager)
      // where editor context is available to check track type.
      const endLimit = endHandleLimit(nextStart, reclaimSeconds);
      if (!allowOverlap) {
        if (endLimit !== null && raw > endLimit) {
          raw = endLimit;
        }
      }
      rawEdgeRef.current = raw;
      let newEnd = raw;
      // Snap the trailing edge for DISPLAY, then re-honor the same clamps. The seam target is
      // dropped while growing past it — see endHandleSnapTargets (must-fix #1: otherwise the handle
      // snaps straight back and the whole feature is invisible).
      if (snapTargets.length) {
        const targets = endHandleSnapTargets(snapTargets, raw, nextStart, reclaimSeconds);
        let snapped = targets.length ? snapEdgeTime(raw, targets) : raw;
        snapped = Math.max(snapped, prev.start + MIN_DURATION);
        // Dropping the seam target removed the nearest target; the next survivor can be BEHIND the
        // seam (the previous clip's end is this clip's start), and the capture radius is pixels, so
        // at low zoom it is seconds wide. Without this floor a rightward reclaim drag snapped
        // backward and silently DELETED footage. See snapFloorForGrowth.
        snapped = snapFloorForGrowth(snapped, raw, nextStart, reclaimSeconds);
        if (!allowOverlap && endLimit !== null && snapped > endLimit) snapped = endLimit;
        newEnd = snapped;
      }
      return {
        start: prev.start,
        end: newEnd,
      };
    });
  });

  const setLastPos = () => {
    lastPosRef.current = position;
  };

  const sendUpdate = (e?: React.MouseEvent | React.TouchEvent) => {
    // Locked track — bail on mouse/touch-up entirely. The `bind` guard only skips the position
    // update; the native onMouseUp still fires sendUpdate, and a cross-track RELEASE is routed by
    // the drop coordinate (not by whether the clip moved), so without this a locked clip could be
    // dragged onto another track (audit #2 — cross-track bypass).
    if (locked) return;
    let dropPointer: DropPointer | undefined;
    if (e) {
      if ("clientX" in e) {
        dropPointer = { clientX: e.clientX, clientY: e.clientY };
      } else if ("changedTouches" in e && e.changedTouches?.[0]) {
        const t = e.changedTouches[0];
        dropPointer = { clientX: t.clientX, clientY: t.clientY };
      }
    }
    setIsDragging(false);
    onDragStateChange?.(false, element);
    // Only a REAL gesture commits. A plain selection click used to fall through here with a
    // virgin/stale dragType and `didChange || dropPointer` always true (dropPointer exists for
    // every mouse event, and lastPosRef was rarely seeded because clicks land on inner children),
    // silently rewriting the element with toFixed(3)-ROUNDED s/e on EVERY click — the drift
    // injector behind "deleted clip's gap won't close" plus a spurious history/autosave churn per
    // click (audit 2026-08-03, R2). dragType is only ever set by actual useDrag movement, so it is
    // the ground truth for "did a drag happen since the last commit".
    const gesture = dragType.current;
    dragType.current = null; // reset per gesture — a stale START/END must not replay on a click
    if (gesture) {
      // Round only the edge(s) the user actually authored in this gesture; re-writing the OTHER
      // edge rounded nudged exact engine floats by ±0.5ms per commit (same drift injector).
      const payload: TrackElementDragPayload = {
        element,
        updates: {
          start: gesture === DRAG_TYPE.END ? position.start : getDecimalNumber(position.start),
          end: gesture === DRAG_TYPE.START ? position.end : getDecimalNumber(position.end),
        },
        dragType: gesture,
      };
      const didChange =
        lastPosRef.current === null ||
        lastPosRef.current.start !== position.start ||
        lastPosRef.current.end !== position.end;
      if (didChange || dropPointer) {
        onDrag(payload, dropPointer);
      }
    }
    // AFTER onDrag: the view's routing guard + onMainReorder run synchronously inside it and
    // need the view-side reorder state alive; settle only once the drop has been consumed.
    settleReorder();
  };

  const getElementColor = (elementType: string) => {
    const colors = elementColors || ELEMENT_COLORS;

    const key =
      elementType === TIMELINE_ELEMENT_TYPE.VIDEO
        ? "video"
        : elementType === TIMELINE_ELEMENT_TYPE.AUDIO
        ? "audio"
        : elementType === TIMELINE_ELEMENT_TYPE.IMAGE
        ? "image"
        : elementType === TIMELINE_ELEMENT_TYPE.TEXT
        ? "text"
        : elementType === TIMELINE_ELEMENT_TYPE.CAPTION
        ? "caption"
        : elementType === TIMELINE_ELEMENT_TYPE.RECT
        ? "rect"
        : elementType === TIMELINE_ELEMENT_TYPE.CIRCLE
        ? "circle"
        : elementType === TIMELINE_ELEMENT_TYPE.ICON
        ? "icon"
        : elementType === TIMELINE_ELEMENT_TYPE.EFFECT
        ? "effect"
        : "element";

    if (key in colors) {
      return colors[key as keyof typeof colors];
    }
    return ELEMENT_COLORS.element;
  };

  // Aborted-gesture reset: window blur / touchcancel / pointercancel mean no mouseup/touchend
  // will arrive — reset local drag + reorder state (the view cancels its own visuals; nothing to
  // restore since the pin never moved). Gated on isDragging OR isReordering: a stationary touch
  // long-press lifts WITHOUT ever setting isDragging (the useDrag bind never fires), and a
  // touchcancel there would otherwise leave the clip dimmed until the next tap (review #118).
  useEffect(() => {
    if (!isDragging && !isReordering) return;
    const reset = () => {
      setIsDragging(false);
      onDragStateChange?.(false, element);
      settleReorder();
    };
    window.addEventListener("blur", reset);
    document.addEventListener("touchcancel", reset);
    document.addEventListener("pointercancel", reset);
    return () => {
      window.removeEventListener("blur", reset);
      document.removeEventListener("touchcancel", reset);
      document.removeEventListener("pointercancel", reset);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDragging, isReordering]);

  const isSelected = useMemo(() => {
    return selectedIds.has(element.getId());
  }, [selectedIds, element]);

  // Audio-state badge for video clips: you previously could NOT tell whether a clip would make
  // sound (B-roll defaults muted by design, but nothing said so — founder seed bug A). Reads
  // props.volume at render time (same pattern as wfVolume) so the Playback panel's slider
  // updates it live. Muted = crossed speaker; audible = speaker.
  const isVideoEl = element.getType() === "video";
  const badgeVolume = isVideoEl
    ? Number(((element as any).getProps?.() ?? {}).volume ?? 1)
    : 1;
  const showAudioBadge = isVideoEl;
  const isMutedClip = badgeVolume <= 0;

  const hasHandles =
    selectedItem?.getId() === element.getId();

  // ── GIVE-BACK AFFORDANCE (must-fix #2 of the design). A handle that silently moves at some seams
  // and not others — manual split, different-source neighbour, reordered track, ~0 headroom — with
  // zero visual difference is the same bug in a new costume. So the reclaim state is DRAWN: the end
  // handle changes colour, its tooltip carries the real number, and a dashed band over the
  // neighbour shows exactly how much footage is still there to take back. The band measures the
  // REMAINING budget against the live drag position, so it drains to nothing as you consume it.
  const {
    canReclaim,
    bandPct: reclaimBandPct,
    label: reclaimTitle,
  } = reclaimAffordance({
    reclaimSeconds,
    nextStart,
    start: position.start,
    end: position.end,
    locked,
  });

  const motionProps: HTMLMotionProps<"div"> = {
    ref,
    className: `twick-track-element ${
      isSelected
        ? "twick-track-element-selected"
        : "twick-track-element-default"
    } ${isDragging ? "twick-track-element-dragging" : ""} ${isReordering ? "twick-track-element-reordering" : ""} ${locked ? "twick-track-element-locked" : ""}`,
    // Seed the gesture-start position UNCONDITIONALLY. The old `e.target === ref.current` gate
    // almost never passed (pointer-downs land on the inner bind() div / handle children), leaving
    // lastPosRef null and `didChange` vacuously true on every release (audit 2026-08-03, R2).
    onMouseDown: () => {
      setLastPos();
    },
    onTouchStart: (e) => {
      setLastPos();
      // Never arm the long-press on a trim handle: handle drags bypass the MOVE branch, so
      // accumDx stays 0 and a slow trim would false-fire the lift at 250ms.
      const onHandle = !!(e.target as HTMLElement)?.closest?.(".twick-track-element-handle");
      if (!onHandle && canActivateReorder()) {
        touchDragRef.current = true;
        accumDxRef.current = 0;
        if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = setTimeout(() => {
          longPressTimerRef.current = null;
          // Re-check the drag type at fire time as a belt: a handle drag that somehow armed the
          // timer must never lift.
          if (
            accumDxRef.current < 8 &&
            dragType.current !== DRAG_TYPE.START &&
            dragType.current !== DRAG_TYPE.END &&
            canActivateReorder()
          ) {
            activateReorder();
          }
        }, 250);
      }
    },
    onMouseUp: (e) => sendUpdate(e),
    onTouchEnd: (e) => sendUpdate(e),
    onClick: (e: React.MouseEvent) => {
      if (onSelection) {
        onSelection(element, e);
      }
    },
    style: {
      backgroundColor: getElementColor(element.getType()),
      width: `${((position.end - position.start) / duration) * 100}%`,
      left: `${(position.start / duration) * 100}%`,
      touchAction: "none",
      // Locked clips get a not-allowed cursor + slight dim so a drag-that-does-nothing reads as
      // "protected", not "broken" (drag/trim/delete/split are all gated when locked).
      ...(locked ? { cursor: "not-allowed", opacity: 0.6 } : {}),
      ...(thumbUrl ? {
        backgroundImage: `url(${thumbUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      } : {}),
    },
  };

  return (
    <motion.div {...motionProps}>
      <div style={{ touchAction: "none", height: "100%" }} {...bind()}>
        {/* Filmstrip fills the clip BEHIND the waveform (rendered first → lower paint order).
            Transparent where a sheet is still loading, so the single-frame background shows through
            until frames arrive — a graceful progressive load, never a black gap. */}
        {showFilmstrip ? (
          <canvas
            ref={filmstripCanvasRef}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              pointerEvents: "none",
              zIndex: 0,
              opacity: 0.9,
            }}
          />
        ) : null}
        {showWaveform ? (
          <canvas
            ref={waveformCanvasRef}
            style={{
              position: "absolute",
              left: 0,
              bottom: 0,
              width: "100%",
              height: "46%",
              pointerEvents: "none",
              zIndex: 1,
            }}
          />
        ) : null}
        {silenceBands.map((b) => (
          <div
            key={b.key}
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: `${b.leftPct}%`,
              width: `${b.widthPct}%`,
              zIndex: 2,
              pointerEvents: "none",
              background: b.excluded ? "rgba(120,120,120,0.30)" : "rgba(251,146,60,0.40)",
              borderLeft: b.excluded ? "1px dashed rgba(160,160,160,0.8)" : "1px solid rgba(251,146,60,0.95)",
              borderRight: b.excluded ? "1px dashed rgba(160,160,160,0.8)" : "1px solid rgba(251,146,60,0.95)",
            }}
          />
        ))}
        {hasHandles ? (
          <div
            style={{ touchAction: "none" , zIndex: isSelected? 100 : 1}}
            {...bindStartHandle()}
            className="twick-track-element-handle twick-track-element-handle-start"
          />
        ) : null}
        {showAudioBadge ? (
          <div
            title={isMutedClip ? "Muted — this clip won't make sound (set volume in Playback)" : "This clip plays audio"}
            style={{
              position: "absolute",
              top: 3,
              right: 4,
              zIndex: 3,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 16,
              height: 16,
              borderRadius: 4,
              background: "rgba(0,0,0,0.55)",
              color: isMutedClip ? "rgba(255,255,255,0.55)" : "#4ade80",
              pointerEvents: "none",
            }}
          >
            {isMutedClip ? <VolumeX size={11} /> : <Volume2 size={11} />}
          </div>
        ) : null}
        <div className="twick-track-element-content">
          {element.getType() === TIMELINE_ELEMENT_TYPE.EFFECT
            ? (element as any).getProps?.()?.effectKey ?? "Effect"
            : (element as any).getText
            ? (element as any).getText()
            : element.getName() || element.getType()}
        </div>
        {hasHandles && canReclaim && reclaimBandPct > 0 ? (
          <div
            className="twick-track-element-reclaim-band"
            title={reclaimTitle}
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: "100%",
              width: `${reclaimBandPct}%`,
              zIndex: 4,
              pointerEvents: "none",
            }}
          />
        ) : null}
        {hasHandles ? (
          <div
            style={{ touchAction: "none", zIndex: isSelected? 100 : 1 }}
            {...bindEndHandle()}
            title={reclaimTitle}
            className={`twick-track-element-handle twick-track-element-handle-end${
              canReclaim ? " twick-track-element-handle-reclaim" : ""
            }`}
          />
        ) : null}
        {(element as any).getFrameEffects
          ? (element as any)
              .getFrameEffects()
              .map((frameEffect: FrameEffect) => {
                return (
                  <div
                    className="twick-track-element-frame-effect"
                    key={frameEffect.s + frameEffect.e}
                    style={{
                      backgroundColor: getElementColor("frameEffect"),
                      width: `${
                        ((frameEffect.e - frameEffect.s) /
                          element.getDuration()) *
                        100
                      }%`,
                      left: `${(frameEffect.s / element.getDuration()) * 100}%`,
                    }}
                  ></div>
                );
              })
          : null}
      </div>
    </motion.div>
  );
});

export default TrackElementView;
