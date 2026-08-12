import { memo, useMemo, useRef } from "react";
import { Track, TrackElement } from "@twick/timeline";
import "../../styles/timeline.css";
import TrackElementView from "./track-element";
import { ElementColors } from "../../helpers/types";
import { isMainVideoTrack } from "../../helpers/editor.utils";
import { reclaimMapForTrack } from "../../helpers/seam-give-back";

/** Shared empty map — a fresh `new Map()` per render would defeat the memo for every other track. */
const EMPTY_RECLAIM: ReadonlyMap<string, number> = new Map<string, number>();
import type { TrackElementDragPayload } from "./track-element";
import type { DropPointer } from "./track-element";

interface TrackBaseProps {
  duration: number;
  zoom: number;
  track: Track;
  trackWidth: number;
  selectedItem: TrackElement | null;
  selectedIds: Set<string>;
  allowOverlap?: boolean;
  onItemSelection: (element: TrackElement, event: React.MouseEvent) => void;
  onDrag: (payload: TrackElementDragPayload, dropPointer?: DropPointer) => void;
  onDragStateChange?: (isDragging: boolean, element?: TrackElement) => void;
  elementColors?: ElementColors;
  /** Stable callback returning timeline snap-target times (see TrackElementView). Optional. */
  getSnapTargets?: (excludeElementId: string) => number[];
  /** Reorder lift/settle notifications, threaded to each TrackElementView (visuals in timeline-view). */
  onReorderStateChange?: (active: boolean, element?: TrackElement, thumbUrl?: string | null) => void;
}

// Memoized: clips/tracks are logically INDEPENDENT of the playhead tick (nothing here reads
// currentTime; the playhead is a single overlay in seek-track, not per-track). With stable props
// from timeline-view (onItemSelection/onDragStateChange are useCallback'd), default shallow compare
// skips the ~20×/sec playback re-renders that used to cascade through every track + clip.
const TrackBase = memo(({
  duration,
  zoom,
  track,
  trackWidth,
  selectedItem,
  selectedIds,
  onItemSelection,
  onDrag,
  allowOverlap = false,
  onDragStateChange,
  elementColors,
  getSnapTargets,
  onReorderStateChange,
}: TrackBaseProps) => {
  const trackRef = useRef<HTMLDivElement>(null);

  const trackWidthStyle = `${Math.max(100, duration * zoom * 100)}px`;

  const elements = track.getElements();
  // GIVE-BACK headroom, main track ONLY. Gated before the call, not inside it: a caption track can
  // carry hundreds of elements and would pay for a number it can never use.
  const isMainTrack = isMainVideoTrack(track);
  // ONE pass for the whole track, not one per clip. The per-element call re-sorted the track and
  // re-parsed a URL per sibling — O(n^2) `new URL()` on the exact track Remove Silences fills with
  // 10-150 clips, and this memo is the only thing standing between that and every render:
  // `onElementDrag` is re-created on each TimelineManager render and TimelineManager re-renders on
  // every `currentTime` tick (~20Hz in playback, per-frame during #93 live drag-scrub). Measured
  // before the hoist: 7.2-10.2ms per pass at 150 clips, 27-42ms at 300.
  const reclaimByElement = useMemo(
    () => (isMainTrack ? reclaimMapForTrack(track) : EMPTY_RECLAIM),
    // `elements` is the frozen view the engine hands out; a new array identity is exactly the
    // signal that a clip moved, split or was trimmed — i.e. when these budgets can change.
    [isMainTrack, track, elements]
  );
  return (
    <div
      ref={trackRef}
      className={"twick-track"}
      style={{
        width: trackWidthStyle,
      }}
    >
      {elements?.map((element, index) => (
        <TrackElementView
          key={element.getId()}
          element={element}
          duration={duration}
          allowOverlap={allowOverlap}
          parentWidth={trackWidth}
          selectedItem={selectedItem}
          selectedIds={selectedIds}
          onSelection={onItemSelection}
          onDrag={onDrag}
          onDragStateChange={onDragStateChange}
          elementColors={elementColors}
          getSnapTargets={getSnapTargets}
          isMainVideoTrack={isMainTrack}
          mainTrackElementCount={isMainTrack ? (elements?.length ?? 0) : 0}
          reclaimSeconds={reclaimByElement.get(element.getId()) ?? 0}
          onReorderStateChange={onReorderStateChange}
          locked={(track.getProps() as { locked?: boolean } | undefined)?.locked === true}
          nextStart={
            index < elements.length - 1
              ? elements[index + 1].getStart()
              : null
          }
          prevEnd={index > 0 ? elements[index - 1].getEnd() : 0}
        />
      ))}
    </div>
  );
});

export default TrackBase;
