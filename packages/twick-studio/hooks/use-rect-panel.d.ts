import { TrackElement } from '@twick/timeline';

export declare const DEFAULT_RECT_PROPS: {
    cornerRadius: number;
    fillColor: string;
    opacity: number;
    strokeColor: string;
    lineWidth: number;
};
export interface RectPanelState {
    cornerRadius: number;
    fillColor: string;
    opacity: number;
    strokeColor: string;
    lineWidth: number;
    operation: string;
}
export interface RectPanelActions {
    setCornerRadius: (radius: number) => void;
    setFillColor: (color: string) => void;
    setOpacity: (opacity: number) => void;
    setStrokeColor: (color: string) => void;
    setLineWidth: (width: number) => void;
    handleApplyChanges: () => void;
}
export declare const useRectPanel: ({ selectedElement, addElement, updateElement, }: {
    selectedElement: TrackElement | null;
    addElement: (element: TrackElement) => void;
    updateElement: (element: TrackElement) => void;
}) => RectPanelState & RectPanelActions;
