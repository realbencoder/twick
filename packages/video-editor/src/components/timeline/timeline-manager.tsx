import { useState, useCallback } from "react";
import { useLivePlayerContext, useLivePlayerTime } from "@twick/live-player";
import { PLAYER_STATE } from "@twick/live-player";
import SeekControl from "../controls/seek-control";
import TimelineView from "./timeline-view";
import { ChapterMarker, useTimelineContext } from "@twick/timeline";
import { useTimelineManager } from "../../hooks/use-timeline-manager";
import { useTimelineSelection } from "../../hooks/use-timeline-selection";
import { TimelineTickConfig } from "../video-editor";
import { ElementColors } from "../../helpers/types";
import { PlayheadState } from "../track/seek-track";
import { dropMediaOnTimeline } from "../../hooks/use-timeline-drop";

const TimelineManager = ({
  trackZoom,
  timelineTickConfigs,
  elementColors,
}: {
  trackZoom: number;
  timelineTickConfigs?: TimelineTickConfig[];
  elementColors?: ElementColors;
}) => {
  const { playerState } = useLivePlayerContext();
  const currentTime = useLivePlayerTime();
  const { followPlayheadEnabled, editor, videoResolution, setSelectedItem } =
    useTimelineContext();
  const {
    timelineData,
    totalDuration,
    selectedItem,
    onAddTrack,
    onReorder,
    onElementDrag,
    onElementDrop,
    onMainReorder,
    onMainPinSettle,
    onSeek,
  } = useTimelineManager();
  const { selectedIds } = useTimelineContext();
  const { handleItemSelect, handleEmptyClick, handleMarqueeSelect } =
    useTimelineSelection();

  const [playheadState, setPlayheadState] = useState<PlayheadState>({
    positionPx: 0,
    isDragging: false,
  });

  const handlePlayheadUpdate = useCallback((state: PlayheadState) => {
    setPlayheadState(state);
  }, []);

  const isPlayheadActive =
    (followPlayheadEnabled && playerState === PLAYER_STATE.PLAYING) ||
    playheadState.isDragging;

  // The drop body lives in dropMediaOnTimeline (hooks/use-timeline-drop.ts) so the app suite can
  // execute it against the shipped dist; a picked range lands at the drop x keeping its length.
  const handleDropOnTimeline = useCallback(
    (params: Parameters<typeof dropMediaOnTimeline>[1]) =>
      dropMediaOnTimeline(editor, params, videoResolution, setSelectedItem),
    [editor, videoResolution, setSelectedItem]
  );

  return (
    <TimelineView
      tracks={timelineData?.tracks ?? []}
      zoomLevel={trackZoom}
      duration={totalDuration}
      selectedItem={selectedItem}
      selectedIds={selectedIds}
      onDeletion={() => {}}
      onAddTrack={onAddTrack}
      onReorder={onReorder}
      onMainReorder={onMainReorder}
      onMainPinSettle={onMainPinSettle}
      onElementDrag={onElementDrag}
      onElementDrop={onElementDrop}
      onSeek={onSeek}
      onItemSelect={handleItemSelect}
      onEmptyClick={handleEmptyClick}
      onMarqueeSelect={handleMarqueeSelect}
      elementColors={elementColors}
      playheadPositionPx={playheadState.positionPx}
      isPlayheadActive={isPlayheadActive}
      currentTime={currentTime}
      chapters={(timelineData?.metadata?.chapters as ChapterMarker[] | undefined) ?? []}
      onDropOnTimeline={handleDropOnTimeline}
      videoResolution={videoResolution}
      enableDropOnTimeline={true}
      seekTrack={
        <SeekControl
          duration={totalDuration}
          zoom={trackZoom}
          onSeek={onSeek}
          timelineTickConfigs={timelineTickConfigs}
          onPlayheadUpdate={handlePlayheadUpdate}
        />
      }
    />
  );
};

export default TimelineManager;
