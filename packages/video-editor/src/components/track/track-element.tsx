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
import { drawClipWaveform, getTimelineWaveform } from "../../helpers/waveform-render";
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
      video.src = src;
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
  // a few hundred rects). If the app registers the waveform AFTER mount (async video load), the
  // 'twick-waveform-ready' event triggers the first paint.
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
    const draw = () => {
      const wf = getTimelineWaveform();
      if (!wf) return false;
      const srcSpan = Math.max(0, (position.end - position.start) * wfRate);
      // Cap DPR at 2 — retina-crisp without 3x-display overdraw on a long timeline of clips.
      const dpr = Math.min(2, (typeof window !== "undefined" && window.devicePixelRatio) || 1);
      return drawClipWaveform(canvas, wf, {
        gain: wfVolume,
        srcStart: wfSrcTime,
        srcSpan,
        cssWidth: canvas.clientWidth,
        cssHeight: canvas.clientHeight,
        dpr,
      });
    };
    if (draw()) return;
    const onReady = () => {
      draw();
    };
    window.addEventListener("twick-waveform-ready", onReady);
    return () => window.removeEventListener("twick-waveform-ready", onReady);
  }, [showWaveform, element.getId(), position.start, position.end, wfSrcTime, wfRate, wfVolume, parentWidth, duration]);

  // Snaps a candidate edge time (seconds) to the nearest timeline target within SNAP_THRESHOLD_PX,
  // measured in the CURRENT zoom (pixelsPerSecond = parentWidth / duration). Returns the input
  // unchanged when snapping is disabled (no getSnapTargets) or nothing is within threshold.
  const snapEdgeTime = (t: number, targets: number[]): number => {
    if (targets.length === 0 || !parentWidth || duration <= 0) return t;
    const thresholdSec = pxToSecThreshold(SNAP_THRESHOLD_PX, parentWidth / duration);
    return snapTime(t, targets, thresholdSec).time;
  };

  const bind = useDrag(({ delta: [dx], event }) => {
    if (locked) return; // locked track — clips can't be moved
    if (!parentWidth) return;
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
      let newStart = prev.start + (dx / parentWidth) * duration;
      newStart = Math.max(0, newStart);
      if (!allowOverlap) {
        if (prevEnd !== null && newStart < prevEnd) {
          newStart = prevEnd;
        }
        if (nextStart !== null && newStart + span > nextStart) {
          newStart = nextStart - span;
        }
      }
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

  const bindStartHandle = useDrag(({ delta: [dx], event, last }) => {
    if (locked) return; // locked track — clips can't be trimmed
    if (event) {
      event.stopPropagation();
    }
    if (dx === 0 && !last) return;
    dragType.current = DRAG_TYPE.START;
    if (last) return; // Keep dragType as START so sendUpdate adjusts startAt
    const snapTargets = getSnapTargets?.(element.getId()) ?? [];
    setPosition((prev) => {
      let newStart = prev.start + (dx / parentWidth) * duration;
      newStart = Math.max(0, Math.min(newStart, prev.end - MIN_DURATION));
      if (prevEnd !== null && !allowOverlap && newStart < prevEnd) {
        newStart = prevEnd;
      }
      // Snap the leading edge, then re-honor the same clamps.
      if (snapTargets.length) {
        let snapped = snapEdgeTime(newStart, snapTargets);
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

  const bindEndHandle = useDrag(({ delta: [dx], event, last }) => {
    if (locked) return; // locked track — clips can't be trimmed
    if (event) {
      event.stopPropagation();
    }
    if (dx === 0 && !last) return;
    dragType.current = DRAG_TYPE.END;
    if (last) return; // Keep dragType as END so sendUpdate knows it was an edge drag
    const snapTargets = getSnapTargets?.(element.getId()) ?? [];
    setPosition((prev) => {
      let newEnd = prev.end + (dx / parentWidth) * duration;
      newEnd = Math.max(newEnd, prev.start + MIN_DURATION);
      // Note: end clamping for overlays is handled in onElementDrag (useTimelineManager)
      // where editor context is available to check track type.
      if (!allowOverlap) {
        if (nextStart !== null && newEnd > nextStart) {
          newEnd = nextStart;
        }
      }
      // Snap the trailing edge, then re-honor the same clamps.
      if (snapTargets.length) {
        let snapped = snapEdgeTime(newEnd, snapTargets);
        snapped = Math.max(snapped, prev.start + MIN_DURATION);
        if (!allowOverlap && nextStart !== null && snapped > nextStart) snapped = nextStart;
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
    const payload: TrackElementDragPayload = {
      element,
      updates: {
        start: getDecimalNumber(position.start),
        end: getDecimalNumber(position.end),
      },
      dragType: dragType.current || "",
    };
    const didChange =
      lastPosRef.current?.start !== position.start ||
      lastPosRef.current?.end !== position.end;
    if (didChange || dropPointer) {
      onDrag(payload, dropPointer);
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

  // Window blur mid-gesture: no mouseup/touchend will arrive — reset local drag + reorder state
  // (the view cancels its own visuals on blur; nothing to restore since the pin never moved).
  useEffect(() => {
    if (!isDragging) return;
    const onBlur = () => {
      setIsDragging(false);
      onDragStateChange?.(false, element);
      settleReorder();
    };
    window.addEventListener("blur", onBlur);
    return () => window.removeEventListener("blur", onBlur);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDragging]);

  const isSelected = useMemo(() => {
    return selectedIds.has(element.getId());
  }, [selectedIds, element]);

  const hasHandles =
    selectedItem?.getId() === element.getId();

  const motionProps: HTMLMotionProps<"div"> = {
    ref,
    className: `twick-track-element ${
      isSelected
        ? "twick-track-element-selected"
        : "twick-track-element-default"
    } ${isDragging ? "twick-track-element-dragging" : ""} ${isReordering ? "twick-track-element-reordering" : ""} ${locked ? "twick-track-element-locked" : ""}`,
    onMouseDown: (e) => {
      if (e.target === ref.current) {
        setLastPos();
      }
    },
    onTouchStart: (e) => {
      if (e.target === ref.current) {
        setLastPos();
      }
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
              zIndex: 0,
            }}
          />
        ) : null}
        {hasHandles ? (
          <div
            style={{ touchAction: "none" , zIndex: isSelected? 100 : 1}}
            {...bindStartHandle()}
            className="twick-track-element-handle twick-track-element-handle-start"
          />
        ) : null}
        <div className="twick-track-element-content">
          {element.getType() === TIMELINE_ELEMENT_TYPE.EFFECT
            ? (element as any).getProps?.()?.effectKey ?? "Effect"
            : (element as any).getText
            ? (element as any).getText()
            : element.getName() || element.getType()}
        </div>
        {hasHandles ? (
          <div
            style={{ touchAction: "none", zIndex: isSelected? 100 : 1 }}
            {...bindEndHandle()}
            className="twick-track-element-handle twick-track-element-handle-end"
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
