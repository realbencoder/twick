import { TrackElement } from '@twick/timeline';
import { EffectKey } from '@twick/effects';

export interface UseEffectPanelParams {
    selectedElement: TrackElement | null;
    addElement: (element: TrackElement) => void;
    updateElement: (element: TrackElement) => void;
}
export interface UseEffectPanelResult {
    selectedEffectKey: EffectKey | null;
    handleAddEffect: (key: EffectKey) => void;
    handleUpdateEffect: (key: EffectKey) => void;
}
export declare const useEffectPanel: ({ selectedElement, addElement, updateElement, }: UseEffectPanelParams) => UseEffectPanelResult;
