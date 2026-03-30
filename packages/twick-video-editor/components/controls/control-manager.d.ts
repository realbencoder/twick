import { TimelineZoomConfig } from '../video-editor';

declare const ControlManager: ({ trackZoom, setTrackZoom, zoomConfig, fps, }: {
    trackZoom: number;
    setTrackZoom: (zoom: number) => void;
    zoomConfig: TimelineZoomConfig;
    fps?: number;
}) => import("react/jsx-runtime").JSX.Element;
export default ControlManager;
