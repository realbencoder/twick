import { TrackElement } from '@twick/timeline';

interface TextStylePanelContainerProps {
    selectedElement: TrackElement | null;
    addElement: (element: TrackElement) => void;
    updateElement: (element: TrackElement) => void;
}
export declare function TextStylePanelContainer({ addElement }: TextStylePanelContainerProps): import("react/jsx-runtime").JSX.Element;
export {};
