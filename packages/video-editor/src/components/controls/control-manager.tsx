import { useLivePlayerContext, useLivePlayerTime } from "@twick/live-player";
import PlayerControls, { PlayerControlsProps } from "./player-controls";
import { useTimelineContext } from "@twick/timeline";
import { usePlayerControl } from "../../hooks/use-player-control";
import useTimelineControl from "../../hooks/use-timeline-control";
import { useCanvasKeyboard } from "../../hooks/use-canvas-keyboard";
import { TimelineZoomConfig } from "../video-editor";
import { DEFAULT_FPS } from "../../helpers/constants";
import { resolveSplitTarget, playheadCutMessage } from "../../helpers/playhead-cut";

const ControlManager = ({
  trackZoom,
  setTrackZoom,
  zoomConfig,
  fps,
  skipRefreshCycle,
}: {
  trackZoom: number;
  setTrackZoom: (zoom: number) => void;
  zoomConfig: TimelineZoomConfig;
  fps?: number;
  /** When true, play goes directly Paused→Playing (no Refresh cycle). For external player. */
  skipRefreshCycle?: boolean;
}) => {
  const { playerState, setSeekTime, setCurrentTime, getCurrentTime } = useLivePlayerContext();
  const currentTime = useLivePlayerTime();
  const { togglePlayback } = usePlayerControl(skipRefreshCycle);
  const {
    editor,
    canRedo,
    canUndo,
    totalDuration,
    selectedItem,
    selectedIds,
    followPlayheadEnabled,
    setFollowPlayheadEnabled,
  } = useTimelineContext();
  const { deleteItem, splitAtPlayhead, handleUndo, handleRedo, deleteBlockedReason } =
    useTimelineControl();

  // Split at the playhead: the key and the button run the same splitAtPlayhead, which decides the
  // target from the live tracks at the moment of the press (a refusal fires the toast event). The
  // press reads the clock through getCurrentTime(), never staler than the rendered time.
  const splitNow = () => {
    void splitAtPlayhead(getCurrentTime());
  };

  useCanvasKeyboard({
    onDelete: () => deleteItem(),
    onUndo: () => handleUndo(),
    onRedo: () => handleRedo(),
    onSplit: splitNow,
  });

  // The Scissors button's state, from the SAME rule the press uses (resolveSplitTarget), so the
  // button and the press agree on the target and on every refusal the rule can foresee. Disabled,
  // its title is the refusal message the key press would toast. A split the engine still fails
  // after the rule allowed it is announced by the press itself (split-failed), never silent.
  const splitTarget = resolveSplitTarget(selectedItem, editor.getTimelineData()?.tracks ?? [], currentTime);
  const playheadCut: PlayerControlsProps["playheadCut"] = {
    split:
      splitTarget.kind === "split"
        ? { enabled: true, title: "Split at the playhead (S)" }
        : { enabled: false, title: playheadCutMessage("split", splitTarget.reason) },
    onSplit: splitNow,
  };

  const handleSeek = (time: number) => {
    const clamped = Math.max(0, Math.min(totalDuration, time));
    setCurrentTime(clamped);
    setSeekTime(clamped);
  };

  return (
    <div className="twick-editor-timeline-controls">
      <PlayerControls
        selectedItem={selectedItem}
        selectedIds={selectedIds}
        duration={totalDuration}
        currentTime={currentTime}
        playerState={playerState}
        togglePlayback={togglePlayback}
        canUndo={canUndo}
        canRedo={canRedo}
        onDelete={() => deleteItem()}
        deleteBlockedReason={deleteBlockedReason}
        playheadCut={playheadCut}
        onUndo={handleUndo}
        onRedo={handleRedo}
        zoomLevel={trackZoom}
        setZoomLevel={setTrackZoom}
        zoomConfig={zoomConfig}
        fps={fps ?? DEFAULT_FPS}
        onSeek={handleSeek}
        followPlayheadEnabled={followPlayheadEnabled}
        onFollowPlayheadToggle={() => setFollowPlayheadEnabled(!followPlayheadEnabled)}
      />
    </div>
  );
};

export default ControlManager;
