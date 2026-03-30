import { RectPanelState, RectPanelActions } from '../../hooks/use-rect-panel';

export type RectPanelProps = RectPanelState & RectPanelActions;
export declare function RectPanel({ cornerRadius, fillColor, strokeColor, lineWidth, operation, setCornerRadius, setFillColor, setStrokeColor, setLineWidth, handleApplyChanges, }: RectPanelProps): import("react/jsx-runtime").JSX.Element;
