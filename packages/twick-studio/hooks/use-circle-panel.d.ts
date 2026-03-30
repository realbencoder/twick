import { TrackElement } from '@twick/timeline';

export declare const DEFAULT_CIRCLE_PROPS: {
    radius: number;
    fillColor: string;
    opacity: number;
    strokeColor: string;
    lineWidth: number;
};
export interface CirclePanelState {
    radius: number;
    fillColor: string;
    opacity: number;
    strokeColor: string;
    lineWidth: number;
    operation: string;
}
export interface CirclePanelActions {
    setRadius: (radius: number) => void;
    setFillColor: (color: string) => void;
    setOpacity: (opacity: number) => void;
    setStrokeColor: (color: string) => void;
    setLineWidth: (width: number) => void;
    handleApplyChanges: () => void;
}
export declare const useCirclePanel: ({ selectedElement, addElement, updateElement, }: {
    selectedElement: TrackElement | null;
    addElement: (element: TrackElement) => void;
    updateElement: (element: TrackElement) => void;
}) => CirclePanelState & CirclePanelActions;
