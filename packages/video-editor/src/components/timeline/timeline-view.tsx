import { useEffect, useLayoutEffect, useMemo, useRef, useState, useCallback } from "react";
import "../../styles/timeline.css";
import TrackHeader from "../track/track-header";
import TrackBase from "../track/track-base";
import { Track, TrackElement } from "@twick/timeline";
import { Plus } from "lucide-react";
import { ElementColors } from "../../helpers/types";
import { usePlayheadScroll } from "../../hooks/use-playhead-scroll";
import { useMarqueeSelection } from "../../hooks/use-marquee-selection";
import { useTimelineDrop } from "../../hooks/use-timeline-drop";
import { useEdgeAutoScroll } from "../../hooks/use-edge-auto-scroll";
import { MarqueeOverlay } from "./marquee-overlay";
import { getTrackOrSeparatorAt, type DropTarget } from "../../utils/drop-target";
import { useTimeScale, createTimeScale, LABEL_WIDTH, SEPARATOR_HEIGHT } from "../../helpers/time-scale";
import { getSnapTargets as computeSnapTargets } from "../../helpers/snap-targets";
import { isMainVideoTrack } from "../../helpers/editor.utils";
import { DRAG_TYPE } from "../../helpers/constants";
import type { Size } from "@twick/timeline";
import type { ChapterMarker } from "@twick/timeline";
import type { TrackElementDragPayload } from "../track/track-element";

/** Width of sticky left area (add track button + track headers) in pixels */
// LABEL_WIDTH and SEPARATOR_HEIGHT imported from ../../helpers/time-scale (single source of truth)
const TRACK_HEIGHT = 44;

function TimelineView({
  zoomLevel,
  selectedItem,
  duration,
  tracks,
  seekTrack,
  onAddTrack,
  onReorder,
  onItemSelect,
  onEmptyClick,
  onMarqueeSelect,
  onElementDrag,
  onElementDrop,
  onMainReorder,
  onMainPinSettle,
  onSeek,
  elementColors,
  selectedIds,
  playheadPositionPx = 0,
  isPlayheadActive = false,
  currentTime = 0,
  onDropOnTimeline,
  videoResolution,
  enableDropOnTimeline = true,
  chapters = [],
}: {
  zoomLevel: number;
  duration: number;
  tracks: Track[];
  selectedItem: Track | TrackElement | null;
  seekTrack?: React.ReactNode;
  onAddTrack: () => void; 
  onReorder: (tracks: Track[]) => void;
  onElementDrag: (params: {
    element: TrackElement;
    dragType: string;
    updates: { start: number; end: number };
  }) => void;
  onElementDrop?: (params: {
    element: TrackElement;
    dragType: string;
    updates: { start: number; end: number };
    dropTarget: DropTarget | null;
  }) => Promise<void>;
  /**
   * Commit a main-track clip reorder (drag-to-reorder). `toSlot` is the insertion slot in
   * PRE-removal indexing (0..N), recomputed from the DROP pointer — never last-hover state.
   * The view guarantees this is only called for an ACTIVATED, non-cancelled, non-identity drop.
   */
  onMainReorder?: (payload: TrackElementDragPayload, toSlot: number) => void;
  /**
   * R3: settle a COMPLETED main-track pin-MOVE that committed no reorder — the manager heals any
   * real gap (gap-gated inside closeVideoTrackGaps; gapless = zero mutation). Never called for
   * cancelled gestures.
   */
  onMainPinSettle?: (payload: TrackElementDragPayload) => void;
  onSeek: (time: number) => void;
  onItemSelect: (item: Track | TrackElement, event: React.MouseEvent) => void;
  onEmptyClick: () => void;
  onMarqueeSelect: (ids: Set<string>) => void;
  onDeletion: (element: TrackElement | Track) => void;
  selectedIds: Set<string>;
  elementColors?: ElementColors;
  /** Playhead position in pixels (for auto-scroll) */
  playheadPositionPx?: number;
  /** Whether playhead is moving (playing or dragging) */
  isPlayheadActive?: boolean;
  /** Current playhead time in seconds (used for zoom-recenter in the new-zoom frame) */
  currentTime?: number;
  /** Called when a file or panel media item is dropped on the timeline */
  onDropOnTimeline?: (params: {
    track: Track | null;
    timeSec: number;
    type: "video" | "audio" | "image";
    url: string;
  }) => Promise<void>;
  /** Video resolution for creating elements from dropped files */
  videoResolution?: Size;
  /** Whether to enable drop-on-timeline */
  enableDropOnTimeline?: boolean;
  chapters?: ChapterMarker[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const seekContainerRef = useRef<HTMLDivElement>(null);
  const timelineContentRef = useRef<HTMLDivElement>(null);
  const [, setScrollLeft] = useState(0);
  const pointerRef = useRef<{ clientX: number; clientY: number } | null>(null);

  const [draggedTimeline, setDraggedTimeline] = useState<Track | null>(null);
  const [draggingElementId, setDraggingElementId] = useState<string | null>(null);
  const [activeDropTarget, setActiveDropTarget] = useState<DropTarget | null>(null);

  // ── Drag-to-reorder (main track): the lifted clip stays PINNED in its slot (rendered truth);
  // the view owns all reorder visuals — a pointer-anchored thumbnail ghost + an orange insertion
  // caret. State for render, ref-mirror for callbacks (memo/useCallback house rule).
  const [reorderState, setReorderState] = useState<{
    element: TrackElement;
    thumbUrl: string | null;
    ghostW: number;
  } | null>(null);
  const reorderStateRef = useRef<typeof reorderState>(null);
  const reorderCancelledRef = useRef(false);
  // Caret: slot index + precomputed content-X of its boundary (null = hidden, incl. identity slots).
  const [caret, setCaret] = useState<{ slot: number; x: number } | null>(null);
  const caretRef = useRef<typeof caret>(null);
  const ghostRef = useRef<HTMLDivElement>(null);

  /**
   * Slot math (pointer-based, not ghost-edge-based): map clientX → content time, then to an
   * insertion slot between sorted main-track clips (midpoint rule). Returns null when the pointer
   * resolves to an identity slot (dropping there changes nothing — caret hidden, drop no-ops).
   */
  const computeReorderSlot = (clientX: number, draggedId: string): { slot: number; x: number } | null => {
    const rect = timelineContentRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const main = (tracks || []).find((t) => isMainVideoTrack(t));
    if (!main) return null;
    const els = [...main.getElements()].sort((a, b) => a.getStart() - b.getStart());
    const N = els.length;
    if (N < 2) return null;
    const i = els.findIndex((el) => el.getId() === draggedId);
    if (i === -1) return null;
    const scale = createTimeScale(zoomLevel, duration);
    const t = scale.contentXToTime(clientX - rect.left);
    let slot: number;
    const lastEnd = els[N - 1].getEnd();
    if (t <= 0) slot = 0;
    else if (t >= lastEnd) slot = N;
    else {
      slot = N;
      for (let j = 0; j < N; j++) {
        const sj = els[j].getStart();
        const ej = els[j].getEnd();
        if (t < ej) {
          slot = t < (sj + ej) / 2 ? j : j + 1;
          break;
        }
      }
    }
    if (slot === i || slot === i + 1) return null; // identity — hidden caret, no-op drop
    const boundaryTime = slot === 0 ? 0 : els[slot - 1].getEnd();
    return { slot, x: scale.timeToContentX(boundaryTime) };
  };

  const clearReorderVisuals = () => {
    setReorderState(null);
    reorderStateRef.current = null;
    setCaret(null);
    caretRef.current = null;
  };

  // Lift/settle notifications from the dragged TrackElementView (threaded through TrackBase).
  const handleReorderStateChange = useCallback(
    (active: boolean, element?: TrackElement, thumbUrl?: string | null) => {
      if (active && element) {
        reorderCancelledRef.current = false;
        const scale = createTimeScale(zoomLevel, duration);
        const ghostW = Math.max(
          40,
          Math.min(160, (element.getEnd() - element.getStart()) * scale.pxPerSec)
        );
        const next = { element, thumbUrl: thumbUrl ?? null, ghostW };
        setReorderState(next);
        reorderStateRef.current = next;
      } else {
        setReorderState(null);
        reorderStateRef.current = null;
        setCaret(null);
        caretRef.current = null;
      }
    },
    // zoomLevel/duration only affect ghost width at LIFT time — safe to refresh identity on them.
    [zoomLevel, duration]
  );

  // Cancel matrix: Escape / pointercancel / touchcancel / window blur → zero mutation, zero
  // history entry. The eventual sendUpdate (if any) hits the routing guard and no-ops; the clip
  // never moved (MOVE-pin), so there is nothing to restore.
  useEffect(() => {
    if (!reorderState) return;
    const cancel = () => {
      reorderCancelledRef.current = true;
      clearReorderVisuals();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") cancel();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointercancel", cancel);
    document.addEventListener("touchcancel", cancel);
    window.addEventListener("blur", cancel);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointercancel", cancel);
      document.removeEventListener("touchcancel", cancel);
      window.removeEventListener("blur", cancel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reorderState]);

  const { selectedTrackElement } = useMemo(() => {
    if (selectedItem && "elements" in selectedItem) {
      return { selectedTrackElement: null };
    }
    return { selectedTrackElement: selectedItem };
  }, [selectedItem]);

  // While dragging a CAPTION, suppress the separator drop-zone highlight — captions are
  // track-locked (see the pin in handleDragWithDrop), so the highlight would advertise a
  // drop that will never happen.
  const draggingCaption = useMemo(() => {
    if (!draggingElementId) return false;
    for (const t of tracks || []) {
      const el = t.getElements().find((e) => e.getId() === draggingElementId);
      if (el) return el.getType().toLowerCase() === "caption";
    }
    return false;
  }, [draggingElementId, tracks]);

  // Drag routing must NOT change identity on a playhead tick — same rule, and the same ref idiom,
  // as getSnapTargets below (#8 / P1b). TimelineManager re-renders ~20-30x/sec during playback from
  // TWO independent drivers (its own useLivePlayerTime, and SeekTrack publishing a FRESH object
  // literal into setPlayheadState, which React can never bail out of), and each of those renders
  // re-mints the four un-memoized handlers out of useTimelineManager. A fresh onDrag here defeats
  // React.memo on TrackBase AND on every TrackElementView beneath it — and each TrackElementView
  // builds THREE useDrag controllers whose applyConfig re-parses unconditionally in the render body
  // (no dep array, no guard), plus a framer-motion root with three no-dep effects. At 1,571 caption
  // elements that is ~4,700 controllers rebuilt per tick. MEASURED on a 24-min video: removing the
  // caption elements entirely took the tab from 200% CPU / 919MB to 20% / 417MB.
  //
  // Refs, not a dep list: a dep list silently re-breaks the moment someone adds an unstable entry,
  // which is exactly how this regressed — five of six props on this boundary were already hardened
  // deliberately, and onDrag was the one that was missed.
  //
  // computeReorderSlot and clearReorderVisuals are mirrored too, NOT just the four handlers. They
  // are plain functions redefined each render that close over tracks/zoomLevel/duration (see the
  // createTimeScale call inside computeReorderSlot), and they are deliberately absent from the old
  // dep array. Freezing this callback WITHOUT mirroring them would pin the first render's closure
  // forever and silently break drag-to-reorder slot math after any zoom change or edit — a
  // regression with no error and no visible symptom until a creator drags a clip.
  const dragRefs = useRef({
    onElementDrag,
    onElementDrop,
    onMainReorder,
    onMainPinSettle,
    tracks,
    computeReorderSlot,
    clearReorderVisuals,
  });
  dragRefs.current = {
    onElementDrag,
    onElementDrop,
    onMainReorder,
    onMainPinSettle,
    tracks,
    computeReorderSlot,
    clearReorderVisuals,
  };

  const handleDragWithDrop = useCallback(
    (payload: TrackElementDragPayload, dropPointer?: { clientX: number; clientY: number }) => {
      const {
        onElementDrag,
        onElementDrop,
        onMainReorder,
        onMainPinSettle,
        tracks,
        computeReorderSlot,
        clearReorderVisuals,
      } = dragRefs.current;
      // ── EXCLUSIVE main-track MOVE routing (drag-to-reorder). Goes FIRST, before every
      // fallthrough to onElementDrag/onElementDrop: a main-clip MOVE release must never reach
      // updateElements (whose ElementUpdater sets changed=true with no value diff → a spurious
      // history entry per pinned release) or the cross-track drop path. Non-activated jiggles
      // and cancelled gestures clean up and return with ZERO mutation.
      {
        const elTrack = (tracks || []).find((t) => t.getId() === payload.element.getTrackId());
        if (payload.dragType === DRAG_TYPE.MOVE && isMainVideoTrack(elTrack)) {
          const active = !!reorderStateRef.current && !reorderCancelledRef.current;
          // Consume the cancel flag per gesture: it is only reset at the next LIFT, so without
          // this a pointercancel'd reorder would suppress the settle of a LATER pin jiggle that
          // never lifts (touch sub-8px drags never re-arm the flag).
          const wasCancelled = reorderCancelledRef.current;
          reorderCancelledRef.current = false;
          // Recompute the slot from the DROP pointer (never trust last-hover state — pointer-up
          // ordering differs across mouse/touch). Identity slots return null → no-op.
          const dropSlot =
            active && dropPointer
              ? computeReorderSlot(dropPointer.clientX, payload.element.getId())
              : null;
          clearReorderVisuals();
          if (active && dropSlot && onMainReorder) {
            onMainReorder(payload, dropSlot.slot);
          } else if (!wasCancelled && onMainPinSettle) {
            // R3 (drag-to-snap commits): a COMPLETED main-clip MOVE that committed no reorder —
            // a sub-8px pin jiggle or an identity-slot ghost drop — still settles the pin. The
            // MOVE pin rendered the clip flush at its magnetic slot all gesture; if the track
            // holds a real gap that rendered position was never engine truth ("looks snapped,
            // zoomed out it isn't"). The heal is gap-gated inside closeVideoTrackGaps, so a
            // gapless release stays zero-mutation/zero-history (the guard this branch exists
            // for). Cancelled gestures (Esc/pointercancel/blur) keep their zero-mutation
            // contract and never reach here.
            onMainPinSettle(payload);
          }
          return;
        }
      }
      // ── CAPTION TRACK-LOCK: captions are time-pinned to THEIR caption track. A release is
      // ALWAYS committed as a same-track drag (horizontal/time component only) no matter where
      // the pointer let go — cross-track routing is by release coordinate, so without this pin
      // an accidental vertical flick would send a subtitle to another track and silently strip
      // its caption semantics. Belt in onElementDrop covers the same rule at the mutation
      // choke point (drop logic is split across the two layers).
      if (payload.element.getType().toLowerCase() === "caption") {
        onElementDrag(payload);
        return;
      }

      // ── TRIM PIN: a START/END release is an edge drag, never a cross-track intent — route
      // straight to the same-track commit regardless of where the pointer let go. Belt for
      // the same rule at the top of onElementDrop.
      if (payload.dragType === DRAG_TYPE.START || payload.dragType === DRAG_TYPE.END) {
        onElementDrag(payload);
        return;
      }

      // No drop pointer or no drop handler – treat as a simple drag (update s/e on same track).
      if (!dropPointer || !onElementDrop) {
        onElementDrag(payload);
        return;
      }

      const rect = timelineContentRef.current?.getBoundingClientRect();
      const dropTarget = rect
        ? getTrackOrSeparatorAt(dropPointer.clientY, rect.top, TRACK_HEIGHT)
        : null;

      // If there is no valid drop target, or the target is the same track,
      // treat this as an in-track drag (just update start/end).
      if (dropTarget?.type === "track") {
        const elementTrackId = payload.element.getTrackId();
        const elementTrackIndex = (tracks || []).findIndex(
          (t) => t.getId() === elementTrackId
        );
        if (elementTrackIndex === dropTarget.trackIndex) {
          onElementDrag(payload);
          return;
        }
      } else if (!dropTarget) {
        onElementDrag(payload);
        return;
      }

      // For separator drops or moves to a different track, use onElementDrop so
      // cross-track behavior stays as implemented.
      onElementDrop({ ...payload, dropTarget });
    },
    // EMPTY, and it must stay empty: every value this reads comes from dragRefs.current, refreshed
    // on each render above. Adding a dep here re-breaks both memo boundaries and the ~4,700 gesture
    // controllers beneath them. Pinned by tests/unit/timeline-drag-identity.test.ts in the app repo.
    []
  );

  useEdgeAutoScroll({
    isActive: !!draggingElementId,
    getMouseClientX: () => pointerRef.current?.clientX ?? 0,
    scrollContainerRef: containerRef,
    contentWidth: Math.max(100, duration * zoomLevel * 100),
  });

  useEffect(() => {
    if (!draggingElementId) return;
    const onMove = (e: MouseEvent | TouchEvent) => {
      const pt = "touches" in e ? e.touches[0] : e;
      if (pt) {
        pointerRef.current = { clientX: pt.clientX, clientY: pt.clientY };
        const rect = timelineContentRef.current?.getBoundingClientRect();
        if (rect) {
          setActiveDropTarget(getTrackOrSeparatorAt(pt.clientY, rect.top, TRACK_HEIGHT));
        }
        // Reorder visuals: ghost follows the pointer by DIRECT DOM mutation (zero React state
        // per pixel); caret slot is state but only SET when the computed slot changes.
        const rs = reorderStateRef.current;
        if (rs && !reorderCancelledRef.current && rect) {
          if (ghostRef.current) {
            const isTouch = "touches" in e;
            const gx = pt.clientX - rect.left - rs.ghostW / 2;
            const gy = pt.clientY - rect.top - (isTouch ? TRACK_HEIGHT + 24 : TRACK_HEIGHT / 2);
            ghostRef.current.style.transform = `translate(${gx}px, ${gy}px)`;
          }
          const next = computeReorderSlot(pt.clientX, rs.element.getId());
          const prev = caretRef.current;
          if ((next?.slot ?? null) !== (prev?.slot ?? null)) {
            caretRef.current = next;
            setCaret(next);
          }
        }
      }
    };
    const onUp = () => {
      pointerRef.current = null;
      setActiveDropTarget(null);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("touchmove", onMove, { passive: true });
    document.addEventListener("mouseup", onUp);
    document.addEventListener("touchend", onUp);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.removeEventListener("touchend", onUp);
    };
  }, [draggingElementId]);

  // Calculate track width - using the same calculation for all tracks
  const timelineWidth = Math.max(100, duration * zoomLevel * 100);
  const timelineWidthPx = `${timelineWidth}px`;

  // Single source of truth for time <-> pixel geometry (matches the clip frame).
  const timeScale = useTimeScale(zoomLevel, duration);

  // ANCHOR-PRESERVING zoom (no jump): the previous version force-CENTERED the playhead on every
  // zoom change, so if the playhead sat at 20% of the viewport (or off-screen) the whole timeline
  // visibly leapt (founder-reported). Gold standard: the point under the user's eye stays put —
  // if the playhead is visible, it keeps its exact viewport position; if not, the time at the
  // viewport center stays at the center. Computed against the PREVIOUS zoom's scale.
  const prevZoomRef = useRef(zoomLevel);
  // Zoom-frame authority handoff to usePlayheadScroll (see use-playhead-scroll.ts, audit Z2).
  const followSuppressUntilRef = useRef(0);
  // Pre-zoom scroll truth: on zoom-OUT the content width shrinks in the SAME commit, so by the
  // time this effect reads container.scrollLeft the browser has already CLAMPED it to the new,
  // smaller max — computing the anchor from the clamped value threw the view backwards when
  // zoomed out near the right edge (adversarial-review finding #3). handleScroll keeps this ref
  // at the last REAL pre-zoom scroll position; the clamp's own scroll event fires after paint,
  // i.e. after this effect already consumed the ref.
  const lastScrollLeftRef = useRef(0);
  // useLayoutEffect, NOT useEffect — load-bearing for the windowed strip canvases.
  //
  // Each main-video clip sizes its filmstrip/waveform canvas to the visible slice, read from this
  // container's scrollLeft at draw time (helpers/strip-window.ts). React runs ALL layout effects
  // before ANY passive effect, and within each pass CHILD before PARENT. As a passive effect this
  // assignment therefore landed AFTER the child draws — so a zoom step drew every strip with the
  // NEW zoom against the OLD scroll, and the whole timeline flickered one frame per zoom click.
  // As a layout effect it lands before the draws, pre-paint.
  //
  // Do NOT "solve" that by caching the scroll value instead: on zoom-OUT the content shrinks in
  // the same commit and the browser has already re-clamped scrollLeft to a third value that is
  // neither the old nor the intended new one — which is exactly why lastScrollLeftRef exists
  // (see the comment above it).
  useLayoutEffect(() => {
    const prevZoom = prevZoomRef.current;
    prevZoomRef.current = zoomLevel;
    if (prevZoom === zoomLevel || !containerRef.current) return;
    const container = containerRef.current;
    const viewportWidth = container.clientWidth;
    const prevScale = createTimeScale(prevZoom, duration);
    const oldScroll = lastScrollLeftRef.current;

    const prevPlayheadPx = prevScale.timeToContentX(currentTime);
    const playheadOffset = prevPlayheadPx - oldScroll; // where the playhead WAS on screen
    const playheadVisible = playheadOffset >= 0 && playheadOffset <= viewportWidth;

    let newScroll: number;
    if (playheadVisible) {
      // Keep the playhead at its exact current on-screen position.
      newScroll = timeScale.timeToContentX(currentTime) - playheadOffset;
    } else {
      // Playhead off-screen: keep the TIME at the viewport center stationary instead.
      const centerTime = prevScale.contentXToTime(oldScroll + viewportWidth / 2);
      newScroll = timeScale.timeToContentX(centerTime) - viewportWidth / 2;
    }
    newScroll = Math.max(0, newScroll);
    container.scrollLeft = newScroll;
    lastScrollLeftRef.current = container.scrollLeft; // post-assign (browser may clamp) = new truth
    // Also sync the seek container
    if (seekContainerRef.current) {
      seekContainerRef.current.scrollLeft = newScroll;
    }
    // The anchor is authoritative for this zoom frame — hold followPlayhead off until the
    // playhead pixels published by SeekTrack have caught up with the new scale (audit Z2).
    followSuppressUntilRef.current = performance.now() + 150;
  }, [zoomLevel, currentTime, duration]);

  // Sync scroll between seek container and timeline container
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollPosition = e.currentTarget.scrollLeft;
    lastScrollLeftRef.current = scrollPosition;
    setScrollLeft(scrollPosition);

    // Update all containers to the same scroll position
    if (
      seekContainerRef.current &&
      e.currentTarget !== seekContainerRef.current
    ) {
      seekContainerRef.current.scrollLeft = scrollPosition;
    }

    if (containerRef.current && e.currentTarget !== containerRef.current) {
      containerRef.current.scrollLeft = scrollPosition;
    }

    if (
      timelineContentRef.current &&
      e.currentTarget !== timelineContentRef.current
    ) {
      timelineContentRef.current.scrollLeft = scrollPosition;
    }
  };

  const [, setTrackWidth] = useState(0);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setTrackWidth(containerRef.current.clientWidth);
      }
    };

    updateWidth(); // Initial set
    window.addEventListener("resize", updateWidth); // Handle resize

    return () => {
      window.removeEventListener("resize", updateWidth);
    };
  }, [duration, zoomLevel]);

  usePlayheadScroll(containerRef, playheadPositionPx, isPlayheadActive, {
    labelWidth: LABEL_WIDTH,
    suppressUntilRef: followSuppressUntilRef,
  });

  const { marquee, handleMouseDown: handleMarqueeMouseDown } =
    useMarqueeSelection({
      duration,
      zoomLevel,
      labelWidth: LABEL_WIDTH,
      trackCount: tracks?.length ?? 0,
      trackHeight: TRACK_HEIGHT,
      tracks: tracks ?? [],
      containerRef: timelineContentRef,
      onMarqueeSelect,
      onEmptyClick,
    });

  const { preview, handleDragOver, handleDragLeave, handleDrop } =
    useTimelineDrop({
      containerRef: timelineContentRef,
      scrollContainerRef: containerRef,
      tracks: tracks ?? [],
      duration,
      zoomLevel,
      labelWidth: LABEL_WIDTH,
      trackHeight: TRACK_HEIGHT,
      trackContentWidth: timelineWidth - LABEL_WIDTH,
      onDrop: onDropOnTimeline ?? (async () => {}),
      enabled: enableDropOnTimeline && !!onDropOnTimeline && !!videoResolution,
    });

  // Track reordering handlers
  const handleTrackDragStart = (e: React.DragEvent, track: Track) => {
    setDraggedTimeline(track);
    e.dataTransfer.setData("application/json", JSON.stringify(track));
  };

  const handleTrackDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleTrackDrop = (e: React.DragEvent, targetTrack: Track) => {
    e.preventDefault();

    // Reset opacity
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "1";
    }

    if (!draggedTimeline || draggedTimeline.getId() === targetTrack.getId())
      return;

    // Reorder timeline
    const reordered = [...(tracks || [])];
    const draggedIndex = reordered.findIndex(
      (t) => t.getId() === draggedTimeline.getId()
    );
    const targetIndex = reordered.findIndex(
      (t) => t.getId() === targetTrack.getId()
    );

    if (draggedIndex !== -1 && targetIndex !== -1) {
      // Remove the dragged timeline from its position
      const [removed] = reordered.splice(draggedIndex, 1);
      // Insert it at the target position
      reordered.splice(targetIndex, 0, removed);

      if (onReorder) {
        onReorder(reordered);
      }
      // Here you would also update the state in your backend or Redux store
      // dispatch(updateTimelineOrder(reordered));
    }

    setDraggedTimeline(null);
  };

  // useCallback so the memoized TrackBase/TrackElement don't re-render every playhead tick from a
  // fresh function ref — without stable props, React.memo on the tracks is a no-op (see #8).
  const handleItemSelection = useCallback(
    (item: Track | TrackElement, event: React.MouseEvent) => {
      onItemSelect(item, event);
    },
    [onItemSelect]
  );

  const handleDragStateChange = useCallback(
    (isDragging: boolean, el?: TrackElement) => {
      setDraggingElementId(isDragging && el ? el.getId() : null);
    },
    []
  );

  // Snapping: give each clip a STABLE getSnapTargets so it can magnetize its edges to other clips'
  // edges, the playhead, 0, and the timeline end while dragging. Read tracks/currentTime/duration
  // from refs (mirrored below) so this callback's identity NEVER changes on a playhead tick — a
  // fresh ref here would defeat the TrackBase/TrackElement memo and re-introduce the per-tick
  // re-render cascade (#8 / P1b). Targets are read at drag time, so they're always current.
  const snapTracksRef = useRef(tracks);
  const snapCurrentTimeRef = useRef(currentTime);
  const snapDurationRef = useRef(duration);
  snapTracksRef.current = tracks;
  snapCurrentTimeRef.current = currentTime;
  snapDurationRef.current = duration;
  const getSnapTargets = useCallback(
    (excludeElementId: string) =>
      computeSnapTargets(
        snapTracksRef.current ?? [],
        snapCurrentTimeRef.current,
        snapDurationRef.current,
        excludeElementId
      ),
    []
  );

  return (
    <div
      ref={containerRef}
      className="twick-timeline-scroll-container"
      onScroll={handleScroll}
    >
      <div style={{ width: timelineWidthPx }}>
        {seekTrack ? (
          <div style={{ display: "flex", position: "relative", minHeight: 34 }}>
            <div className="twick-seek-track-empty-space" onClick={onAddTrack}>
              <Plus color="white" size={20}/>
            </div>
            <div style={{ flexGrow: 1 }}>{seekTrack}</div>
            {chapters.map((chapter) => {
              const left = timeScale.timeToContentX(chapter.time);
              return (
                <button
                  key={chapter.id}
                  className="btn-ghost"
                  title={chapter.title}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSeek(chapter.time);
                  }}
                  style={{
                    position: "absolute",
                    left,
                    top: 0,
                    height: "100%",
                    padding: "0 4px",
                    borderRadius: 0,
                    borderLeft: "1px solid rgba(255,255,255,0.4)",
                    borderRight: "none",
                    minWidth: 0,
                  }}
                >
                  <span style={{ fontSize: 10, opacity: 0.9 }}>{chapter.title}</span>
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
      <div
        ref={timelineContentRef}
        style={{ width: timelineWidthPx, position: "relative" }}
        onMouseDown={handleMarqueeMouseDown}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <MarqueeOverlay marquee={marquee} />
        {/* Drag-to-reorder ghost: pointer-anchored clip thumbnail, DOM-positioned (see onMove). */}
        {reorderState && (
          <div
            ref={ghostRef}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: reorderState.ghostW,
              height: TRACK_HEIGHT,
              pointerEvents: "none",
              zIndex: 60,
              opacity: 0.75,
              borderRadius: 6,
              boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
              background: reorderState.thumbUrl
                ? `url(${reorderState.thumbUrl}) center/cover no-repeat`
                : "rgba(249,115,22,0.35)",
              border: "1px solid rgba(249,115,22,0.8)",
              transform: "translate(-9999px, 0)",
            }}
          />
        )}
        {/* Insertion caret: full-height orange bar + triangle cap over the main-track row. Only
            rendered for non-identity slots — a visible caret always means "this drop changes
            something". */}
        {caret != null && (() => {
          const mainIdx = (tracks || []).findIndex((t) => isMainVideoTrack(t));
          if (mainIdx < 0) return null;
          const top = SEPARATOR_HEIGHT + mainIdx * timeScale.trackStride;
          return (
            <div
              style={{
                position: "absolute",
                left: caret.x - 1,
                top,
                width: 2,
                height: TRACK_HEIGHT,
                background: "#f97316",
                zIndex: 55,
                pointerEvents: "none",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: -5,
                  left: -4,
                  width: 0,
                  height: 0,
                  borderLeft: "5px solid transparent",
                  borderRight: "5px solid transparent",
                  borderTop: "6px solid #f97316",
                }}
              />
            </div>
          );
        })()}
        {preview && (
          <div
            className="twick-drop-preview"
            style={{
              position: "absolute",
              left: timeScale.timeToContentX(preview.timeSec),
              top: preview.trackIndex * timeScale.trackStride + SEPARATOR_HEIGHT + 2,
              width: (preview.widthPct / 100) * timeScale.contentWidth,
              height: TRACK_HEIGHT - 4,
            }}
          />
        )}
        <div style={{ position: "relative", zIndex: 10 }}>
          {/* Top separator (drop zone above first track) */}
          <div
            className="twick-timeline-separator"
            style={{
              height: SEPARATOR_HEIGHT,
              background:
                activeDropTarget?.type === "separator" &&
                activeDropTarget.separatorIndex === 0 &&
                !draggingCaption
                  ? "rgba(255,255,255,0.2)"
                  : "transparent",
            }}
          />
          {(tracks || []).map((track: Track, index: number) => (
            <div key={track.getId()}>
              <div className="twick-timeline-container">
                <div className="twick-timeline-header-container">
                  <TrackHeader
                    track={track}
                    selectedIds={selectedIds}
                    onSelect={handleItemSelection}
                    onDragStart={handleTrackDragStart}
                    onDragOver={handleTrackDragOver}
                    onDrop={handleTrackDrop}
                  />
                </div>
                <TrackBase
                  track={track}
                  duration={duration}
                  selectedItem={selectedTrackElement}
                  selectedIds={selectedIds}
                  zoom={zoomLevel}
                  allowOverlap={false}
                  trackWidth={timelineWidth - LABEL_WIDTH}
                  onItemSelection={handleItemSelection}
                  onDrag={handleDragWithDrop}
                  onDragStateChange={handleDragStateChange}
                  onReorderStateChange={handleReorderStateChange}
                  elementColors={elementColors}
                  getSnapTargets={getSnapTargets}
                />
              </div>
              <div
                className="twick-timeline-separator"
                style={{
                  height: SEPARATOR_HEIGHT,
                  background:
                    activeDropTarget?.type === "separator" &&
                    activeDropTarget.separatorIndex === index + 1 &&
                    !draggingCaption
                      ? "rgba(255,255,255,0.2)"
                      : "transparent",
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default TimelineView;
