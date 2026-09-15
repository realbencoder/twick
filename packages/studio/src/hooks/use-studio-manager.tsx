/**
 * useStudioManager Hook
 *
 * A custom hook that manages the studio's state and operations.
 * Handles tool selection, element management, and timeline interactions.
 *
 * @returns {Object} Studio manager methods and state
 * @property {string} selectedTool - Currently selected tool ID
 * @property {(tool: string) => void} setSelectedTool - Update selected tool
 * @property {TrackElement | null} selectedElement - Currently selected timeline element
 * @property {(element: TrackElement) => void} addElement - Add element to timeline
 * @property {(element: TrackElement) => void} updateElement - Update existing element
 *
 * @example
 * ```tsx
 * const {
 *   selectedTool,
 *   setSelectedTool,
 *   selectedElement,
 *   addElement,
 *   updateElement
 * } = useStudioManager();
 * ```
 */

import { Track, TrackElement, useTimelineContext } from "@twick/timeline";
import { useEditorManager } from "@twick/video-editor";
import { useEffect, useRef, useState } from "react";

const SHAPES_TOOLS = ["rect", "circle", "line", "arrow"] as string[];

export const useStudioManager = () => {
  const [selectedProp, setSelectedProp] = useState("element-props");

  const { selectedItem } = useTimelineContext();

  const { addElement, updateElement } = useEditorManager();

  const selectedElement =
    selectedItem instanceof TrackElement ? selectedItem : null;

  // Initial tool is "video" (the media panel), NOT "none": the deleted
  // selection-cleared else-branch used to double as the MOUNT initializer
  // (selectedItem is null on first render), so removing it alone left the
  // editor opening on the empty "Select an element from toolbar" placeholder
  // instead of the media library — found by the fix-commit adversarial pass,
  // 2026-08-10. The initial value now carries the mount default; the effect
  // below still never touches the tool on selection CLEAR.
  const [selectedTool, setSelectedTool] = useState<string>("video");

  const isToolChanged = useRef(false);

  // The id of the item the tool last followed. The auto-switch below must key on the selected
  // element's ID CHANGING, never on `selectedItem`'s object identity: TimelineContext derives
  // `selectedItem` with a useMemo over [selectedIds, changeLog], so EVERY timeline mutation
  // re-resolves the same selected id to a fresh object. A ripple delete deep-clones every track
  // and surviving clips keep their ids, so with the main clip selected a transcript-panel Delete
  // (or Remove Silences, or any updateElement) re-fired this effect and snapped the tool back to
  // "video" — unmounting the panel the creator was working in (founder-reported 2026-09-14).
  // A re-resolved object with the same id is not a new selection.
  const followedIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (selectedItem instanceof TrackElement) {
      const id = selectedItem.getId();
      if (followedIdRef.current === id) return; // same element, re-resolved after a mutation
      followedIdRef.current = id;
      const elementType = selectedItem.getType();
      if(SHAPES_TOOLS.includes(elementType)) {
        setSelectedTool("shape");
      } else {
        setSelectedTool(selectedItem.getType());
      }
      isToolChanged.current = true;
    } else if (selectedItem instanceof Track) {
      // do-nothing for the tool — but remember the track, so picking an ELEMENT afterwards reads
      // as a new selection even if it is the one the tool followed before the track click.
      followedIdRef.current = selectedItem.getId();
    } else {
      // Selection CLEARED (null): keep the current tool instead of forcing "video".
      // Auto-switching only on selection SET matches CapCut/Premiere, and forcing
      // "video" here unmounted the Subtitles panel mid-use on three reachable paths
      // (delete the last caption, Escape, the right properties panel's close) —
      // implementation-review finding A2, 2026-08-10. Shared studio behaviour change:
      // deselecting on the canvas no longer snaps the left panel back to Video.
      // Re-arm: after a clear, an explicit re-pick of the same clip IS a new selection.
      followedIdRef.current = null;
    }
  }, [selectedItem]);

  return {
    selectedProp,
    setSelectedProp,
    selectedTool,
    setSelectedTool,
    selectedElement,
    addElement,
    updateElement,
  };
};
