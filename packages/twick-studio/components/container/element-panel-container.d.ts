import { default as React } from 'react';
import { Size, TrackElement } from '@twick/timeline';
import { StudioConfig, UploadConfig } from '../../types';

/**
 * Props interface for the ElementPanelContainer component.
 * Defines the configuration and callback functions for element management.
 */
interface ElementPanelContainerProps {
    selectedTool: string;
    selectedElement: TrackElement | null;
    videoResolution: Size;
    setSelectedTool: (tool: string) => void;
    addElement: (element: TrackElement) => void;
    updateElement: (element: TrackElement) => void;
    uploadConfig?: UploadConfig;
    studioConfig?: StudioConfig;
}
/**
 * ElementPanelContainer component that renders the appropriate element panel
 * based on the currently selected tool. Provides a unified interface for
 * managing different types of timeline elements including media, text, shapes,
 * and captions. Shows an empty state when no tool is selected.
 *
 * @param props - Component props for element panel configuration
 * @returns JSX element containing the appropriate element panel or empty state
 *
 * @example
 * ```tsx
 * <ElementPanelContainer
 *   selectedTool="text"
 *   selectedElement={currentElement}
 *   videoResolution={{ width: 1920, height: 1080 }}
 *   setSelectedTool={setTool}
 *   addElement={addToTimeline}
 *   updateElement={updateInTimeline}
 * />
 * ```
 */
declare const ElementPanelContainer: ({ selectedTool, videoResolution, selectedElement, addElement, updateElement, setSelectedTool, uploadConfig, studioConfig, }: ElementPanelContainerProps) => React.ReactElement;
export default ElementPanelContainer;
