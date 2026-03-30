import { Size } from '@twick/timeline';

interface StudioHeaderProps {
    setVideoResolution: (resolution: Size) => void;
    onNewProject: () => void;
    onLoadProject: () => void;
    onSaveProject: () => void;
    onExportVideo: () => void;
    onExportCaptions: (format: "srt" | "vtt") => void;
    onExportChapters: (format: "youtube" | "json") => void;
}
export declare const StudioHeader: ({ setVideoResolution, onNewProject, onLoadProject, onSaveProject, onExportVideo, }: StudioHeaderProps) => import("react/jsx-runtime").JSX.Element;
export default StudioHeader;
