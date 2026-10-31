import { useLivePlayerContext, useLivePlayerTime } from "@twick/live-player";
import PlayerControls, { PlayerControlsProps } from "./player-controls";
import { useTimelineContext } from "@twick/timeline";
import { usePlayerControl } from "../../hooks/use-player-control";
import useTimelineControl from "../../hooks/use-timeline-control";
import { useCanvasKeyboard } from "../../hooks/use-canvas-keyboard";
import { TimelineZoomConfig } from "../video-editor";
import { DEFAULT_FPS } from "../../helpers/constants";
import {
  resolveSplitTarget,
  resolveDeleteRange,
  playheadCutMessage,
} from "../../helpers/playhead-cut";

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
  const {
    deleteItem,
    splitAtPlayhead,
    deleteAtPlayhead,
    handleUndo,
    handleRedo,
    deleteBlockedReason,
  } = useTimelineControl();

  const handleSeek = (time: number) => {
    const clamped = Math.max(0, Math.min(totalDuration, time));
    setCurrentTime(clamped);
    setSeekTime(clamped);
  };

  // Cutting at the playhead: each key and its button run the same press (splitAtPlayhead, or
  // deleteAtPlayhead before/after), which decides from the live tracks at the moment of the press
  // (a refusal fires the toast event). Delete before moves the playhead to the new join through the
  // app's player controller when there is one, else through handleSeek (the live-player context).
  //
  // A press cuts at the frame the canvas shows: the host player controller's own playhead
  // (`__webcodecs_controller.getCurrentTimeSec()`) when it has one and it is a finite number, else
  // the live-player context's getCurrentTime(). The app feeds the context on a 50 ms throttle with
  // no trailing update, so after quick frame steps the context can sit a frame behind the picture
  // and the cut would land a frame early. The buttons' enabled state below keeps the context time:
  // it only decides how a button looks, and the press re-decides at the press's own time.
  const pressTime = (): number => {
    const controller = (globalThis as { __webcodecs_controller?: { getCurrentTimeSec?: () => number } })
      .__webcodecs_controller;
    const t = typeof controller?.getCurrentTimeSec === "function" ? controller.getCurrentTimeSec() : undefined;
    return typeof t === "number" && Number.isFinite(t) ? t : getCurrentTime();
  };
  const splitNow = () => {
    void splitAtPlayhead(pressTime());
  };
  const deleteBeforeNow = () => {
    void deleteAtPlayhead("before", pressTime(), handleSeek);
  };
  const deleteAfterNow = () => {
    void deleteAtPlayhead("after", pressTime(), handleSeek);
  };

  useCanvasKeyboard({
    onDelete: () => deleteItem(),
    onUndo: () => handleUndo(),
    onRedo: () => handleRedo(),
    onSplit: splitNow,
    onDeleteBefore: deleteBeforeNow,
    onDeleteAfter: deleteAfterNow,
  });

  // The cut buttons' state, from the SAME rules the presses use (resolveSplitTarget,
  // resolveDeleteRange), so each button and its key agree on the target and on every refusal the
  // rules can foresee. Disabled, a button's title is the refusal message its key would toast. A cut
  // the engine still fails after the rules allowed it is announced by the press itself
  // (split-failed), never silent.
  const tracks = editor.getTimelineData()?.tracks ?? [];
  const splitTarget = resolveSplitTarget(selectedItem, tracks, currentTime);
  const beforeRange = resolveDeleteRange(tracks, currentTime, "before");
  const afterRange = resolveDeleteRange(tracks, currentTime, "after");
  const playheadCut: PlayerControlsProps["playheadCut"] = {
    split:
      splitTarget.kind === "split"
        ? { enabled: true, title: "Split at the playhead (S)" }
        : { enabled: false, title: playheadCutMessage("split", splitTarget.reason) },
    before:
      beforeRange.kind === "cut"
        ? { enabled: true, title: "Delete before the playhead (Q)" }
        : { enabled: false, title: playheadCutMessage("delete-before", beforeRange.reason) },
    after:
      afterRange.kind === "cut"
        ? { enabled: true, title: "Delete after the playhead (W)" }
        : { enabled: false, title: playheadCutMessage("delete-after", afterRange.reason) },
    onSplit: splitNow,
    onDeleteBefore: deleteBeforeNow,
    onDeleteAfter: deleteAfterNow,
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
