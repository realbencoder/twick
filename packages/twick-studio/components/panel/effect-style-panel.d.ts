import { TrackElement } from '@twick/timeline';

interface EffectStylePanelProps {
    selectedElement: TrackElement | null;
    addElement: (element: TrackElement) => void;
    updateElement: (element: TrackElement) => void;
}
export declare function EffectStylePanel({ selectedElement, addElement, updateElement, }: EffectStylePanelProps): import("react/jsx-runtime").JSX.Element;
export {};
