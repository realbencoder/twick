import { Track } from '../core/track/track';
import { TrackElement } from '../core/elements/base.element';
import { ProjectJSON, Size } from '../types';
import { TimelineEditor } from '../core/editor/timeline.editor';
import { AnalyticsConfig } from '../utils/analytics';

/**
 * Type definition for the Timeline context.
 * Contains all the state and functions needed to manage a timeline instance.
 * Provides access to the timeline editor, selected items, undo/redo functionality,
 * and timeline actions.
 *
 * @example
 * ```js
 * const {
 *   editor,
 *   selectedItem,
 *   totalDuration,
 *   canUndo,
 *   canRedo,
 *   setSelectedItem,
 *   setTimelineAction
 * } = useTimelineContext();
 * ```
 */
export type TimelineContextType = {
    /** Unique identifier for this timeline context */
    contextId: string;
    /** The timeline editor instance for this context */
    editor: TimelineEditor;
    /** Currently selected track or element (primary selection, for backward compat) */
    selectedItem: Track | TrackElement | null;
    /** Set of selected IDs (tracks and elements) for multi-select */
    selectedIds: Set<string>;
    /** Change counter for tracking modifications */
    changeLog: number;
    /** Current timeline action being performed */
    timelineAction: {
        type: string;
        payload: any;
    };
    /** Resolution of the video */
    videoResolution: Size;
    /** Total duration of the timeline in seconds */
    totalDuration: number;
    /** Current project state */
    present: ProjectJSON | null;
    /** Whether undo operation is available */
    canUndo: boolean;
    /** Whether redo operation is available */
    canRedo: boolean;
    /** Function to set the selected item (single select, clears multi-select) */
    setSelectedItem: (item: Track | TrackElement | null) => void;
    /** Function to update selection (multi-select) */
    setSelection: (ids: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
    /** Function to set timeline actions */
    setTimelineAction: (type: string, payload: any) => void;
    /** Function to set the video resolution */
    setVideoResolution: (size: Size) => void;
    /** Whether timeline follows playhead during playback */
    followPlayheadEnabled: boolean;
    /** Toggle follow playhead during playback */
    setFollowPlayheadEnabled: (enabled: boolean) => void;
};
/**
 * Props for the TimelineProvider component.
 * Defines the configuration options for timeline context initialization.
 *
 * @example
 * ```jsx
 * <TimelineProvider
 *   contextId="my-timeline"
 *   initialData={{ tracks: [], version: 1 }}
 *   undoRedoPersistenceKey="timeline-state"
 *   maxHistorySize={50}
 * >
 *   <YourApp />
 * </TimelineProvider>
 * ```
 */
export interface TimelineProviderProps {
    /** React children to wrap with timeline context */
    children: React.ReactNode;
    /** Unique identifier for this timeline context */
    contextId: string;
    /** resolution of the video */
    resolution?: Size;
    /** Initial timeline data to load */
    initialData?: ProjectJSON;
    /** Key for persisting undo/redo state */
    undoRedoPersistenceKey?: string;
    /** Maximum number of history states to keep */
    maxHistorySize?: number;
    /**
     * Analytics configuration.
     * Set to `{ enabled: false }` to disable tracking.
     */
    analytics?: AnalyticsConfig;
}
/**
 * Provider component for the Timeline context.
 * Wraps the timeline functionality with PostHog analytics and undo/redo support.
 * Manages the global state for timeline instances including tracks, elements,
 * playback state, and history management.
 *
 * @param props - Timeline provider configuration
 * @returns Context provider with timeline state management
 *
 * @example
 * ```jsx
 * <TimelineProvider
 *   contextId="my-timeline"
 *   initialData={{ tracks: [], version: 1 }}
 *   undoRedoPersistenceKey="timeline-state"
 * >
 *   <YourApp />
 * </TimelineProvider>
 * ```
 *
 * @example
 * Disable analytics:
 * ```jsx
 * <TimelineProvider
 *   contextId="my-timeline"
 *   analytics={{ enabled: false }}
 * >
 *   <YourApp />
 * </TimelineProvider>
 * ```
 */
export declare const TimelineProvider: ({ contextId, children, resolution, initialData, undoRedoPersistenceKey, maxHistorySize, analytics, }: TimelineProviderProps) => import("react/jsx-runtime").JSX.Element;
/**
 * Hook to access the Timeline context.
 * Provides access to timeline state, editor instance, and timeline management functions.
 * Must be used within a TimelineProvider component.
 *
 * @returns TimelineContextType object with all timeline state and controls
 * @throws Error if used outside of TimelineProvider
 *
 * @example
 * ```js
 * const {
 *   editor,
 *   selectedItem,
 *   totalDuration,
 *   canUndo,
 *   canRedo,
 *   setSelectedItem,
 *   setTimelineAction
 * } = useTimelineContext();
 *
 * // Access the timeline editor
 * const tracks = editor.getTracks();
 *
 * // Check if undo is available
 * if (canUndo) {
 *   editor.undo();
 * }
 *
 * // Set timeline action
 * setTimelineAction(TIMELINE_ACTION.SET_PLAYER_STATE, { playing: true });
 * ```
 */
export declare const useTimelineContext: () => TimelineContextType;
//# sourceMappingURL=timeline-context.d.ts.map