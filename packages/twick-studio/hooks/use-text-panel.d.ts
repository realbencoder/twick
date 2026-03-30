import { TrackElement, TextAlign } from '@twick/timeline';

export declare const DEFAULT_TEXT_PROPS: {
    text: string;
    fontSize: number;
    fontFamily: string;
    fontWeight: number;
    fontStyle: string;
    textColor: string;
    strokeColor: string;
    strokeWidth: number;
    applyShadow: boolean;
    shadowColor: string;
    textAlign: TextAlign;
    shadowOffset: number[];
    shadowBlur: number;
    shadowOpacity: number;
};
export interface TextPanelState {
    textContent: string;
    fontSize: number;
    selectedFont: string;
    isBold: boolean;
    isItalic: boolean;
    textColor: string;
    strokeColor: string;
    applyShadow: boolean;
    shadowColor: string;
    strokeWidth: number;
    applyBackground: boolean;
    backgroundColor: string;
    backgroundOpacity: number;
    fonts: string[];
    operation: string;
}
export interface TextPanelActions {
    setTextContent: (text: string) => void;
    setFontSize: (size: number) => void;
    setSelectedFont: (font: string) => void;
    setIsBold: (bold: boolean) => void;
    setIsItalic: (italic: boolean) => void;
    setTextColor: (color: string) => void;
    setStrokeColor: (color: string) => void;
    setApplyShadow: (shadow: boolean) => void;
    setShadowColor: (color: string) => void;
    setStrokeWidth: (width: number) => void;
    setApplyBackground: (apply: boolean) => void;
    setBackgroundColor: (color: string) => void;
    setBackgroundOpacity: (opacity: number) => void;
    handleApplyChanges: () => void;
}
export declare const useTextPanel: ({ selectedElement, addElement, updateElement, }: {
    selectedElement: TrackElement | null;
    addElement: (element: TrackElement) => void;
    updateElement: (element: TrackElement) => void;
}) => TextPanelState & TextPanelActions;
