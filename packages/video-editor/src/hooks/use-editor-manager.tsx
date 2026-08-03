import { useLivePlayerContext } from "@twick/live-player";
import {
  Track,
  TRACK_TYPES,
  TrackElement,
  useTimelineContext,
  VALIDATION_ERROR_CODE,
  ValidationError,
} from "@twick/timeline";
import { useEffect, useRef } from "react";

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
  // GESTURE-COALESCED commit. The properties-panel sliders (volume/opacity/scale/rotation/rate)
  // call updateElement from onChange — dozens of events per thumb drag. Committing each one pushed
  // 2 history entries per event and a single slider drag evicted the entire undo stack (audit
  // 2026-08-03, U2). Now: PREVIEW instantly (element is already mutated by the panel — refresh()
  // is history-free re-render + player update), and COMMIT once, 400ms after the last change per
  // element (a new element flushes the previous one immediately, unmount flushes pending).
  const pendingCommitRef = useRef<{ element: TrackElement; timer: ReturnType<typeof setTimeout> } | null>(null);

  // NOTE: no setSelectedItem here — the deferred commit fires up to 400ms after the gesture and
  // must never clobber a selection the user changed in the meantime (preview already selected).
  const commitNow = (element: TrackElement) => {
    editor.updateElement(element);
    editor.refresh();
  };

  const flushPending = () => {
    const pending = pendingCommitRef.current;
    if (!pending) return;
    clearTimeout(pending.timer);
    pendingCommitRef.current = null;
    commitNow(pending.element);
  };

  useEffect(() => flushPending, []); // flush on unmount so a trailing edit is never history-less

  const updateElement = (element: TrackElement) => {
    const pending = pendingCommitRef.current;
    if (pending && pending.element.getId() !== element.getId()) {
      flushPending(); // switching elements mid-window — commit the previous gesture first
    } else if (pending) {
      clearTimeout(pending.timer);
    }
    // Instant preview: mutation already applied by the caller; re-render + player update only.
    editor.refresh();
    setSelectedItem(element);
    pendingCommitRef.current = {
      element,
      timer: setTimeout(() => {
        pendingCommitRef.current = null;
        commitNow(element);
      }, 400),
    };
  };

  return {
    addElement,
    updateElement,
  };
};
