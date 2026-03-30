import { TrackElement, Track } from '@twick/timeline';

/**
 * Custom hook to manage timeline control operations.
 * Provides functions for deleting items, splitting elements,
 * and handling undo/redo operations in the video editor.
 *
 * @returns Object containing timeline control functions
 *
 * @example
 * ```js
 * const { deleteItem, splitElement, handleUndo, handleRedo } = useTimelineControl();
 *
 * // Delete a track or element
 * deleteItem(trackOrElement);
 *
 * // Split an element at current time
 * splitElement(element, 5.5);
 * ```
 */
declare const useTimelineControl: () => {
    splitElement: (element: TrackElement, currentTime: number) => void;
    deleteItem: (item?: Track | TrackElement) => void;
    handleUndo: () => void;
    handleRedo: () => void;
};
export default useTimelineControl;
