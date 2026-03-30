import { TrackElement } from '@twick/timeline';

/**
 * Custom hook for managing video editor operations.
 * Provides functionality to add and update timeline elements with automatic
 * collision detection and error handling. Integrates with live player context
 * to position elements at the current playback time.
 *
 * @returns Object containing editor management functions
 * @property {Function} addElement - Add a new element to the timeline
 * @property {Function} updateElement - Update an existing timeline element
 *
 * @example
 * ```tsx
 * const { addElement, updateElement } = useEditorManager();
 *
 * // Add a new element at current playback time
 * await addElement(newElement);
 *
 * // Update an existing element
 * updateElement(modifiedElement);
 * ```
 */
export declare const useEditorManager: () => {
    addElement: (element: TrackElement) => Promise<void>;
    updateElement: (element: TrackElement) => void;
};
