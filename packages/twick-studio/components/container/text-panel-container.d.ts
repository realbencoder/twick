import { TrackElement } from '@twick/timeline';

interface TextPanelContainerProps {
    selectedElement: TrackElement | null;
    addElement: (element: TrackElement) => void;
    updateElement: (element: TrackElement) => void;
}
export declare function TextPanelContainer(props: TextPanelContainerProps): import("react/jsx-runtime").JSX.Element;
export {};
