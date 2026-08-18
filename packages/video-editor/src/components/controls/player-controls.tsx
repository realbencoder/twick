import React, { useCallback } from "react";
import { PLAYER_STATE } from "@twick/live-player";
import "../../styles/player-controls.css";
import {
  Trash2,
  Scissors,
  Play,
  Pause,
  Loader2,
  ZoomIn,
  ZoomOut,
  SkipBack,
  SkipForward,
  Crosshair,
} from "lucide-react";
import { UndoRedoControls } from "./undo-redo-controls";
import { TrackElement, Track, formatTimeWithFrames, canSplitElement } from "@twick/timeline";
import { TimelineZoomConfig } from "../video-editor";
import {
  DEFAULT_TIMELINE_ZOOM_CONFIG,
  DEFAULT_FPS,
} from "../../helpers/constants";

/**
 * Props for the PlayerControls component.
 * Defines the configuration options and callback functions for player controls.
 *
 * @example
 * ```jsx
 * <PlayerControls
 *   selectedItem={selectedElement}
 *   currentTime={5.5}
 *   duration={120}
 *   canUndo={true}
 *   canRedo={false}
 *   playerState={PLAYER_STATE.PLAYING}
 *   togglePlayback={handleTogglePlayback}
 *   onUndo={handleUndo}
 *   onRedo={handleRedo}
 *   onDelete={handleDelete}
 *   onSplit={handleSplit}
 *   zoomLevel={1.0}
 *   setZoomLevel={handleZoomChange}
 * />
 * ```
 */
export interface PlayerControlsProps {
  /** Currently selected timeline element or track (primary) */
  selectedItem: TrackElement | Track | null;
  /** Why Delete is refused (locked track / main video track), or null when deletable. */
  deleteBlockedReason?: string | null;
  /** Set of selected IDs for multi-select */
  selectedIds?: Set<string>;
  /** Current playback time in seconds */
  currentTime: number;
  /** Total duration of the timeline in seconds */
  duration: number;
  /** Whether undo operation is available */
  canUndo: boolean;
  /** Whether redo operation is available */
  canRedo: boolean;
  /** Current player state (playing, paused, refresh) */
  playerState: keyof typeof PLAYER_STATE;
  /** Function to toggle between play and pause */
  togglePlayback: () => void;
  /** Optional callback for undo operation */
  onUndo?: () => void;
  /** Optional callback for redo operation */
  onRedo?: () => void;
  /** Optional callback for delete operation (deletes all selected) */
  onDelete?: () => void;
  /** Optional callback for split operation */
  onSplit?: (item: TrackElement, splitTime: number) => void;
  /** Current zoom level for timeline */
  zoomLevel?: number;
  /** Function to set zoom level */
  setZoomLevel?: (zoom: number) => void;
  /** Optional CSS class name for styling */
  className?: string;
  /** Timeline zoom configuration (min, max, step, default) */
  zoomConfig?: TimelineZoomConfig;
  /** Frames per second for time display (MM:SS.FF format) */
  fps?: number;
  /** Callback to seek to a specific time (for jump to start/end) */
  onSeek?: (time: number) => void;
  /** Whether timeline follows playhead during playback */
  followPlayheadEnabled?: boolean;
  /** Toggle follow playhead */
  onFollowPlayheadToggle?: () => void;
}

const PlayerControls: React.FC<PlayerControlsProps> = ({
  selectedItem,
  deleteBlockedReason = null,
  selectedIds = new Set(),
  duration,
  currentTime,
  playerState,
  togglePlayback,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  onSplit,
  onDelete,
  zoomLevel = 1,
  setZoomLevel,
  className = "",
  zoomConfig = DEFAULT_TIMELINE_ZOOM_CONFIG,
  fps = DEFAULT_FPS,
  onSeek,
  followPlayheadEnabled = true,
  onFollowPlayheadToggle,
}) => {

  const MAX_ZOOM = zoomConfig.max;
  const MIN_ZOOM = zoomConfig.min;
  // Per-click zoom ratio (see handleZoomIn) — kept near the old 0.1 step's feel at mid zoom.
  const ZOOM_RATIO = 1.25;

  const formatTime = useCallback(
    (time: number) => formatTimeWithFrames(time, fps),
    [fps]
  );

  const handleSeekToStart = useCallback(() => {
    onSeek?.(0);
  }, [onSeek]);

  const handleSeekToEnd = useCallback(() => {
    onSeek?.(duration);
  }, [onSeek, duration]);

  const hasSelection = selectedIds.size > 0;

  // The padlock and the main-track rule are enforced at the MUTATION site (deleteItem), so an
  // enabled-looking Delete could refuse silently — the clip stayed and only its selection
  // vanished, which reads as "deleted, then it came back". `deleteBlockedReason` is computed from
  // those same guards and handed down, so the button can never advertise an action that will be
  // dropped. Same disabled+explanatory-title shape the Split button below already uses.
  const canDelete = hasSelection && !deleteBlockedReason;

  const handleDelete = useCallback(() => {
    if (canDelete && onDelete) {
      onDelete();
    }
  }, [canDelete, onDelete]);

  // Split only works when the playhead is strictly INSIDE the selected clip (canSplitElement — the
  // same validator splitElement uses). Outside, split is a silent no-op; gate the button on it so
  // the affordance tells the truth (disabled + "move playhead over the clip" tooltip).
  const canSplit =
    selectedItem instanceof TrackElement && canSplitElement(selectedItem, currentTime);
  // Two different refusals, two different tooltips. Once canSplitElement also rejects a split that
  // would leave a sub-frame sliver, "move the playhead over the clip" became a lie for a playhead
  // that IS over the clip, just too near an edge (audit 2026-08-04, R2-24).
  const playheadInsideClip =
    selectedItem instanceof TrackElement &&
    selectedItem.getStart() < currentTime &&
    selectedItem.getEnd() > currentTime;
  const handleSplit = useCallback(() => {
    if (canSplit && onSplit) {
      onSplit(selectedItem as TrackElement, currentTime);
    }
  }, [canSplit, selectedItem, onSplit, currentTime]);

  // MULTIPLICATIVE zoom. The step used to be ADDITIVE (0.1, with a 0.02 special case below 0.2),
  // which makes the control uneven at both ends of a 0.01-3.0 range: 0.5 -> 0.01 took thirteen
  // clicks and 0.5 -> 3.0 took twenty-five, while one click near the floor changed the scale by 3x
  // and near the ceiling by 3%. A constant RATIO gives the same perceptual change per click
  // everywhere, and removes the need for the low-zoom special case.
  const handleZoomIn = useCallback(() => {
    if (setZoomLevel && zoomLevel < MAX_ZOOM) {
      setZoomLevel(Math.min(MAX_ZOOM, zoomLevel * ZOOM_RATIO));
    }
  }, [zoomLevel, setZoomLevel, MAX_ZOOM]);

  const handleZoomOut = useCallback(() => {
    if (setZoomLevel && zoomLevel > MIN_ZOOM) {
      setZoomLevel(Math.max(MIN_ZOOM, zoomLevel / ZOOM_RATIO));
    }
  }, [zoomLevel, setZoomLevel, MIN_ZOOM]);

  return (
    <div className={`player-controls ${className}`}>
      {/* Edit Controls */}
      <div className="edit-controls">
        <button
          onClick={handleDelete}
          disabled={!canDelete}
          title={
            deleteBlockedReason
              ? deleteBlockedReason
              : selectedItem instanceof Track
              ? "Delete this whole track"
              : "Delete"
          }
          className={`control-btn delete-btn ${
            !canDelete ? "btn-disabled" : ""
          }`}
        >
          <Trash2 className="icon-md" />
        </button>

        <button
          onClick={handleSplit}
          disabled={!canSplit}
          title={
            !(selectedItem instanceof TrackElement)
              ? "Select a clip to split"
              : canSplit
              ? "Split at playhead"
              : playheadInsideClip
              ? "Too close to the edge of the clip to split"
              : "Move the playhead over the selected clip to split it"
          }
          className={`control-btn split-btn ${!canSplit ? "btn-disabled" : ""}`}
        >
          <Scissors className="icon-md" />
        </button>

        <UndoRedoControls
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={onUndo}
          onRedo={onRedo}
        />
      </div>

      <div className="playback-controls">
        {/* Follow Playhead Toggle */}
        {onFollowPlayheadToggle && (
          <button
            onClick={onFollowPlayheadToggle}
            title={followPlayheadEnabled ? "Follow playhead on (click to disable)" : "Follow playhead off (click to enable)"}
            className={`control-btn ${followPlayheadEnabled ? "follow-btn-active" : ""}`}
          >
            <Crosshair className="icon-md" />
          </button>
        )}
        {/* Jump to Start */}
        <button
          onClick={handleSeekToStart}
          disabled={playerState === PLAYER_STATE.REFRESH}
          title="Jump to start"
          className="control-btn"
        >
          <SkipBack className="icon-md" />
        </button>

        {/* Playback Controls */}
        <button
          onClick={togglePlayback}
          disabled={playerState === PLAYER_STATE.REFRESH}
          title={
            playerState === PLAYER_STATE.PLAYING
              ? "Pause"
              : playerState === PLAYER_STATE.REFRESH
              ? "Refreshing"
              : "Play"
          }
          className="control-btn play-pause-btn"
        >
          {playerState === PLAYER_STATE.PLAYING ? (
            <Pause className="icon-lg" />
          ) : playerState === PLAYER_STATE.REFRESH ? (
            <Loader2 className="icon-lg animate-spin" />
          ) : (
            <Play className="icon-lg" />
          )}
        </button>

        {/* Jump to End */}
        <button
          onClick={handleSeekToEnd}
          disabled={playerState === PLAYER_STATE.REFRESH}
          title="Jump to end"
          className="control-btn"
        >
          <SkipForward className="icon-md" />
        </button>

        {/* Time Display */}
        <div className="time-display">
          <span className="current-time">{formatTime(currentTime)}</span>
          <span className="time-separator">/</span>
          <span className="total-time">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Right side - Zoom Controls */}
      {setZoomLevel && (
        <div className="twick-track-zoom-container">
          <button
            onClick={handleZoomOut}
            disabled={zoomLevel <= MIN_ZOOM}
            title="Zoom Out"
            className={`control-btn ${
              zoomLevel <= MIN_ZOOM ? "btn-disabled" : ""
            }`}
          >
            <ZoomOut className="icon-md" />
          </button>

          {/* Zoom Level Display */}
          <div className="zoom-level">{Math.round(zoomLevel * 100)}%</div>

          <button
            onClick={handleZoomIn}
            disabled={zoomLevel >= MAX_ZOOM}
            title="Zoom In"
            className={`control-btn ${
              zoomLevel >= MAX_ZOOM ? "btn-disabled" : ""
            }`}
          >
            <ZoomIn className="icon-md" />
          </button>
        </div>
      )}
    </div>
  );
};

export default PlayerControls;
