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

  const [selectedTool, setSelectedTool] = useState<string>("none");

  const isToolChanged = useRef(false);

  useEffect(() => {
    if (selectedItem instanceof TrackElement) {
      const elementType = selectedItem.getType();
      if(SHAPES_TOOLS.includes(elementType)) {
        setSelectedTool("shape");
      } else {
        setSelectedTool(selectedItem.getType());
      }
      isToolChanged.current = true;
    } else if (selectedItem instanceof Track) {
      // do-nothing
    }
    // Selection CLEARED (null): keep the current tool instead of forcing "video".
    // Auto-switching only on selection SET matches CapCut/Premiere, and forcing
    // "video" here unmounted the Subtitles panel mid-use on three reachable paths
    // (delete the last caption, Escape, the right properties panel's close) —
    // implementation-review finding A2, 2026-08-10. Shared studio behaviour change:
    // deselecting on the canvas no longer snaps the left panel back to Video.
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
