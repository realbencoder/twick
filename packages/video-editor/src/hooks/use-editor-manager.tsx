import { useLivePlayerContext } from "@twick/live-player";
import {
  Track,
  TRACK_TYPES,
  TrackElement,
  useTimelineContext,
  VALIDATION_ERROR_CODE,
  ValidationError,
} from "@twick/timeline";

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
export const useEditorManager = () => {
  const { editor, selectedItem, setSelectedItem } = useTimelineContext();
  const { getCurrentTime } = useLivePlayerContext();

  /**
   * Adds a new element to the timeline at the current playback time.
   * Automatically handles track selection, collision detection, and error recovery.
   * Creates a new track if no track is selected or if collision errors occur.
   *
   * @param element - The track element to add to the timeline
   * @returns Promise that resolves when element is successfully added
   * 
   * @example
   * ```tsx
   * const newElement = new TrackElement();
   * await addElement(newElement);
   * // Element is added at current playback time
   * ```
   */
  const addElement = async (element: TrackElement) => {
    const currentTime = getCurrentTime();
    element.setStart(currentTime);

    // Clamp element end to main video duration — prevents B-roll/images from
    // extending the timeline beyond the actual video length
    const tracks = editor.getTimelineData()?.tracks || [];
    let mainVideoEnd = 0;
    for (const t of tracks) {
      for (const el of (t.getElements?.() || [])) {
        if (el.getType?.() === 'video') {
          mainVideoEnd = Math.max(mainVideoEnd, el.getEnd());
        }
      }
    }
    if (mainVideoEnd > 0 && element.getEnd() > mainVideoEnd) {
      element.setEnd(mainVideoEnd);
    }

    try {
      if (selectedItem instanceof Track) {
        const result = await editor.addElementToTrack(selectedItem, element);
        if (result) {
          setSelectedItem(element);
        }
      } else {
        const tracks2 = editor.getTimelineData()?.tracks || [];
        // Insert new overlay tracks just after caption track (index 0) — above all
        // existing overlay tracks (B-roll images, B-roll video, other text).
        // This ensures new elements always appear on top in the z-order.
        const captionTrackIdx = tracks2.findIndex((t2: any) => t2.getType() === TRACK_TYPES.CAPTION);
        const insertIdx = captionTrackIdx >= 0 ? captionTrackIdx + 1 : 0;
        const newTrack = editor.addTrack(`Track_${Date.now()}`, undefined, insertIdx);
        const result = await editor.addElementToTrack(newTrack, element);
        if (result) {
          setSelectedItem(element);
        }
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        if (error.errors.includes(VALIDATION_ERROR_CODE.COLLISION_ERROR)) {
          try {
            const tracks2 = editor.getTimelineData()?.tracks || [];
            const captionTrackIdx2 = tracks2.findIndex((t2: any) => t2.getType() === TRACK_TYPES.CAPTION);
            const insertIdx = captionTrackIdx2 >= 0 ? captionTrackIdx2 + 1 : 0;
            const newTrack = editor.addTrack(`Track_${Date.now()}`, undefined, insertIdx);
            const result = await editor.addElementToTrack(newTrack, element);
            if (result) {
              setSelectedItem(element);
            }
          } catch (innerErr) {
            console.error('Failed to add element to new track:', innerErr);
          }
        }
      }
    }
  };

  /**
   * Updates an existing timeline element and refreshes the editor.
   * Automatically updates the selected item to the modified element.
   *
   * @param element - The track element to update
   * @returns The updated element instance
   * 
   * @example
   * ```tsx
   * element.setDuration(10);
   * const updatedElement = updateElement(element);
   * // Element is updated and editor is refreshed
   * ```
   */
  const updateElement = (element: TrackElement) => {
    const updatedElement = editor.updateElement(element);
    editor.refresh();
    setSelectedItem(updatedElement);
  };

  return {
    addElement,
    updateElement,
  };
};
