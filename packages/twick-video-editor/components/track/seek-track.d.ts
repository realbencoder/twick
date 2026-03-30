import { TimelineTickConfig } from '../video-editor';

export interface PlayheadState {
    positionPx: number;
    isDragging: boolean;
}
interface SeekTrackProps {
    currentTime: number;
    duration: number;
    zoom?: number;
    onSeek: (time: number) => void;
    timelineCount?: number;
    timelineTickConfigs?: TimelineTickConfig[];
    /** Called when playhead position or drag state changes (for auto-scroll) */
    onPlayheadUpdate?: (state: PlayheadState) => void;
}
export default function SeekTrack({ currentTime, duration, zoom, onSeek, timelineCount, timelineTickConfigs, onPlayheadUpdate, }: SeekTrackProps): import("react/jsx-runtime").JSX.Element;
export {};
