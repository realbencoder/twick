import { CaptionPanelEntry } from '../../types';

export declare function CaptionsPanel({ captions, addCaption, splitCaption, deleteCaption, updateCaption, }: {
    captions: CaptionPanelEntry[];
    addCaption: () => void;
    splitCaption: (index: number) => void | Promise<void>;
    deleteCaption: (index: number) => void;
    updateCaption: (index: number, caption: CaptionPanelEntry) => void;
}): import("react/jsx-runtime").JSX.Element;
