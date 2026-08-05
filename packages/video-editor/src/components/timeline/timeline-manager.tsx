import { useState, useCallback } from "react";
import { useLivePlayerContext } from "@twick/live-player";
import { PLAYER_STATE } from "@twick/live-player";
import SeekControl from "../controls/seek-control";
import TimelineView from "./timeline-view";
import {
  ChapterMarker,
  TRACK_TYPES,
  useTimelineContext,
  VALIDATION_ERROR_CODE,
  ValidationError,
} from "@twick/timeline";
import { useTimelineManager } from "../../hooks/use-timeline-manager";
import { useTimelineSelection } from "../../hooks/use-timeline-selection";
import { TimelineTickConfig } from "../video-editor";
import { ElementColors } from "../../helpers/types";
import { PlayheadState } from "../track/seek-track";
import { createElementFromDrop } from "../../hooks/use-timeline-drop";
import { canDropElementOnTrack } from "../../helpers/editor.utils";

const TimelineManager = ({
  trackZoom,
  timelineTickConfigs,
  elementColors,
}: {
  trackZoom: number;
  timelineTickConfigs?: TimelineTickConfig[];
  elementColors?: ElementColors;
}) => {
  const { playerState, currentTime } = useLivePlayerContext();
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

  const handleDropOnTimeline = useCallback(
    async (params: {
      track: import("@twick/timeline").Track | null;
      timeSec: number;
      type: import("../../helpers/asset-type").DroppableAssetType;
      url: string;
    }) => {
      const { track, timeSec, type, url } = params;
      const element = createElementFromDrop(type, url, videoResolution);
      element.setStart(timeSec);

      // Re-resolve the drop track by ID: a proxied drop awaits 5-30s between capture and here,
      // and any ripple/reorder/undo in that window rebuilds every Track via fromJSON — adding to
      // the DETACHED instance would mutate an orphan and silently persist nothing (review #120
      // finding 1). A track deleted mid-flight falls through to the insert-new-track branch.
      const liveTrack = track ? editor.getTrackById(track.getId()) ?? null : null;

      // Type gate (same rule as cross-track element drops): new media must not land on an
      // incompatible track — a stock clip released over the subtitle row would otherwise be
      // ADDED TO THE CAPTION TRACK (and similarly onto the main recording track or a text
      // lane). Incompatible target → fall through to the insert-new-track branch below.
      const compatibleTrack =
        liveTrack && canDropElementOnTrack(element, liveTrack) ? liveTrack : null;

      // If no target track, insert above video (after caption track)
      let targetTrack = compatibleTrack;
      if (!targetTrack) {
        const _tlTracks = editor.getTimelineData()?.tracks || [];
        const _tlCaptionIdx = _tlTracks.findIndex((t2: any) => t2.getType() === TRACK_TYPES.CAPTION);
        const _tlInsertIdx = _tlCaptionIdx >= 0 ? _tlCaptionIdx + 1 : 0;
        targetTrack = editor.addTrack(`Track_${Date.now()}`, undefined, _tlInsertIdx);
      }

      const tryAdd = async (
        t: import("@twick/timeline").Track
      ): Promise<boolean> => {
        try {
          const result = await editor.addElementToTrack(t, element);
          if (result) {
            setSelectedItem(element);
            return true;
          }
        } catch (err) {
          if (
            err instanceof ValidationError &&
            err.errors?.includes(VALIDATION_ERROR_CODE.COLLISION_ERROR)
          ) {
            const _collTracks = editor.getTimelineData()?.tracks || [];
            const _collCaptionIdx = _collTracks.findIndex((t3: any) => t3.getType() === TRACK_TYPES.CAPTION);
            const _collInsertIdx = _collCaptionIdx >= 0 ? _collCaptionIdx + 1 : 0;
            const newTrack = editor.addTrack(`Track_${Date.now()}`, undefined, _collInsertIdx);
            return tryAdd(newTrack);
          }
          throw err;
        }
        return false;
      };

      await tryAdd(targetTrack);
      editor.refresh();
    },
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
          timelineCount={timelineData?.tracks?.length ?? 0}
          timelineTickConfigs={timelineTickConfigs}
          onPlayheadUpdate={handlePlayheadUpdate}
        />
      }
    />
  );
};

export default TimelineManager;
