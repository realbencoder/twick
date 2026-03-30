import { default as React } from 'react';
import { PLAYER_STATE } from '@twick/live-player';
import { TrackElement, Track } from '@twick/timeline';
import { TimelineZoomConfig } from '../video-editor';

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
declare const PlayerControls: React.FC<PlayerControlsProps>;
export default PlayerControls;
