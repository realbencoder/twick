import { CAPTION_STYLE, CAPTION_STYLE_OPTIONS } from '@twick/timeline';
import { PropertiesPanelProps } from '../../types';

export { CAPTION_STYLE, CAPTION_STYLE_OPTIONS };
export declare const CAPTION_FONT: {
    size: number;
    family: string;
};
export declare const CAPTION_COLOR: {
    text: string;
    highlight: string;
    bgColor: string;
    outlineColor: string;
};
interface CaptionPropPanelProps {
    /** No-op when using fixed config. Kept for API compatibility. */
    setApplyPropsToAllCaption?: (apply: boolean) => void;
}
export declare function CaptionPropPanel({ selectedElement, updateElement, setApplyPropsToAllCaption, }: CaptionPropPanelProps & PropertiesPanelProps): import("react/jsx-runtime").JSX.Element | null;
export default CaptionPropPanel;
