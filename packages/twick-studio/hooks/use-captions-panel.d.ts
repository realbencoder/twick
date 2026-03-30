import { CaptionPanelEntry } from '../types';

export declare const useCaptionsPanel: () => {
    captions: CaptionPanelEntry[];
    addCaption: () => void;
    splitCaption: (index: number) => Promise<void>;
    deleteCaption: (index: number) => void;
    updateCaption: (index: number, caption: CaptionPanelEntry) => void;
};
