import { TimelineTickConfig } from '../video-editor';
import { ElementColors } from '../../helpers/types';

declare const TimelineManager: ({ trackZoom, timelineTickConfigs, elementColors, }: {
    trackZoom: number;
    timelineTickConfigs?: TimelineTickConfig[];
    elementColors?: ElementColors;
}) => import("react/jsx-runtime").JSX.Element;
export default TimelineManager;
