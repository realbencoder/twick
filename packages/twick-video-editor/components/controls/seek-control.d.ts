import { PlayheadState } from '../track/seek-track';
import { TimelineTickConfig } from '../video-editor';

declare const SeekControl: ({ duration, zoom, timelineCount, onSeek, timelineTickConfigs, onPlayheadUpdate, }: {
    duration: number;
    zoom: number;
    timelineCount: number;
    onSeek: (time: number) => void;
    timelineTickConfigs?: TimelineTickConfig[];
    onPlayheadUpdate?: (state: PlayheadState) => void;
}) => import("react/jsx-runtime").JSX.Element;
export default SeekControl;
