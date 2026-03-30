declare const TimelineZoom: ({ zoomLevel, setZoomLevel, minZoom, maxZoom, zoomStep, }: {
    zoomLevel: number;
    setZoomLevel: (zoom: number) => void;
    minZoom?: number;
    maxZoom?: number;
    zoomStep?: number;
}) => import("react/jsx-runtime").JSX.Element;
export default TimelineZoom;
