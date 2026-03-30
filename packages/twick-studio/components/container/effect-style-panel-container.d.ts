import { TrackElement } from '@twick/timeline';

interface EffectStylePanelContainerProps {
    selectedElement: TrackElement | null;
    addElement: (element: TrackElement) => void;
    updateElement: (element: TrackElement) => void;
}
export declare function EffectStylePanelContainer({ selectedElement, addElement, updateElement, }: EffectStylePanelContainerProps): import("react/jsx-runtime").JSX.Element;
export {};
