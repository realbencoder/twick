import { TextPanelState, TextPanelActions } from '../../hooks/use-text-panel';

export type TextPanelProps = TextPanelState & TextPanelActions;
export declare function TextPanel({ textContent, fontSize, selectedFont, isBold, isItalic, textColor, strokeColor, applyShadow, shadowColor, strokeWidth, applyBackground, backgroundColor, backgroundOpacity, fonts, operation, setTextContent, setFontSize, setSelectedFont, setIsBold, setIsItalic, setTextColor, setStrokeColor, setApplyShadow, setShadowColor, setStrokeWidth, setApplyBackground, setBackgroundColor, setBackgroundOpacity, handleApplyChanges, }: TextPanelProps): import("react/jsx-runtime").JSX.Element;
