import { memo, useRef } from "react";
import { Track, TrackElement } from "@twick/timeline";
import "../../styles/timeline.css";
import TrackElementView from "./track-element";
import { ElementColors } from "../../helpers/types";
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
}: TrackBaseProps) => {
  const trackRef = useRef<HTMLDivElement>(null);

  const trackWidthStyle = `${Math.max(100, duration * zoom * 100)}px`;

  const elements = track.getElements();
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
          isMainVideoTrack={track.getName?.() === "Video"}
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
