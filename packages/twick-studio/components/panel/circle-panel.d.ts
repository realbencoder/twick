import { CirclePanelState, CirclePanelActions } from '../../hooks/use-circle-panel';

export type CirclePanelProps = CirclePanelState & CirclePanelActions;
export declare function CirclePanel({ radius, fillColor, strokeColor, lineWidth, operation, setRadius, setFillColor, setStrokeColor, setLineWidth, handleApplyChanges, }: CirclePanelProps): import("react/jsx-runtime").JSX.Element;
