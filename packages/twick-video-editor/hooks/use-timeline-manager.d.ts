import { TrackElement, Track, ProjectMetadata } from '@twick/timeline';
import { DropTarget } from '../utils/drop-target';

export interface ElementDropParams {
    element: TrackElement;
    dragType: string;
    updates: {
        start: number;
        end: number;
    };
    dropTarget: DropTarget | null;
}
interface TimelineManagerReturn {
    timelineData: {
        tracks: Track[];
        version: number;
        metadata?: ProjectMetadata;
    } | null;
    onAddTrack: () => void;
    onElementDrag: (params: {
        element: TrackElement;
        dragType: string;
        updates: {
            start: number;
            end: number;
        };
    }) => void;
    onElementDrop: (params: ElementDropParams) => Promise<void>;
    onReorder: (reorderedItems: Track[]) => void;
    onSeek: (time: number) => void;
    onSelectionChange: (selectedItem: TrackElement | Track | null) => void;
    selectedItem: Track | TrackElement | null;
    totalDuration: number;
}
/**
 * Custom hook to manage timeline operations and state.
 * Provides functions for handling element dragging, track reordering,
 * seeking, and selection changes in the video editor.
 *
 * @returns Object containing timeline management functions and state
 *
 * @example
 * ```js
 * const { timelineData, onElementDrag, onSeek, onSelectionChange } = useTimelineManager();
 *
 * // Handle element dragging
 * onElementDrag({ element, dragType: "START", updates: { start: 5, end: 10 } });
 *
 * // Seek to specific time
 * onSeek(15.5);
 * ```
 */
export declare const useTimelineManager: () => TimelineManagerReturn;
export {};
