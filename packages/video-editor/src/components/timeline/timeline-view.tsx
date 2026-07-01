import { useEffect, useMemo, useRef, useState, useCallback } from "react";
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
import { useTimeScale, LABEL_WIDTH, SEPARATOR_HEIGHT } from "../../helpers/time-scale";
import { getSnapTargets as computeSnapTargets } from "../../helpers/snap-targets";
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

  const { selectedTrackElement } = useMemo(() => {
    if (selectedItem && "elements" in selectedItem) {
      return { selectedTrackElement: null };
    }
    return { selectedTrackElement: selectedItem };
  }, [selectedItem]);

  const handleDragWithDrop = useCallback(
    (payload: TrackElementDragPayload, dropPointer?: { clientX: number; clientY: number }) => {
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
    [onElementDrag, onElementDrop, tracks]
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

  // Keep playhead centered when zoom changes
  const prevZoomRef = useRef(zoomLevel);
  useEffect(() => {
    if (prevZoomRef.current !== zoomLevel && containerRef.current) {
      const container = containerRef.current;
      const viewportWidth = container.clientWidth;
      // Calculate where the playhead is in the new zoom
      const playheadPx = timeScale.timeToContentX(currentTime);
      // Center the playhead in the viewport
      const newScroll = Math.max(0, playheadPx - viewportWidth / 2);
      container.scrollLeft = newScroll;
      // Also sync the seek container
      if (seekContainerRef.current) {
        seekContainerRef.current.scrollLeft = newScroll;
      }
    }
    prevZoomRef.current = zoomLevel;
  }, [zoomLevel, currentTime, duration]);

  // Sync scroll between seek container and timeline container
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollPosition = e.currentTarget.scrollLeft;
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
                activeDropTarget?.type === "separator" && activeDropTarget.separatorIndex === 0
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
                  elementColors={elementColors}
                  getSnapTargets={getSnapTargets}
                />
              </div>
              <div
                className="twick-timeline-separator"
                style={{
                  height: SEPARATOR_HEIGHT,
                  background:
                    activeDropTarget?.type === "separator" && activeDropTarget.separatorIndex === index + 1
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
