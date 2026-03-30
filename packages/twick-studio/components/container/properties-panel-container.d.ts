import { TrackElement, Size } from '@twick/timeline';

interface PropertiesPanelContainerProps {
    selectedElement: TrackElement | null;
    updateElement: (element: TrackElement) => void;
    videoResolution: Size;
}
export declare function PropertiesPanelContainer({ selectedElement, updateElement, videoResolution, }: PropertiesPanelContainerProps): import("react/jsx-runtime").JSX.Element;
export {};
