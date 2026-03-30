import { TrackElement } from '@twick/timeline';

export declare const useStudioManager: () => {
    selectedProp: string;
    setSelectedProp: import('react').Dispatch<import('react').SetStateAction<string>>;
    selectedTool: string;
    setSelectedTool: import('react').Dispatch<import('react').SetStateAction<string>>;
    selectedElement: TrackElement | null;
    addElement: (element: TrackElement) => Promise<void>;
    updateElement: (element: TrackElement) => void;
};
