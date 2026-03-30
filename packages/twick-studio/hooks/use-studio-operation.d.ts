import { ICaptionGenerationPollingResponse, StudioConfig, CaptionEntry } from '../types';

declare const useStudioOperation: (studioConfig?: StudioConfig) => {
    onLoadProject: () => Promise<void>;
    onSaveProject: () => Promise<void>;
    onExportVideo: () => Promise<void>;
    onNewProject: () => void;
    onExportCaptions: (format: "srt" | "vtt") => Promise<void>;
    onExportChapters: (format: "youtube" | "json") => Promise<void>;
    addCaptionsToTimeline: (captions: CaptionEntry[]) => void;
    getCaptionstatus: (reqId: string) => Promise<ICaptionGenerationPollingResponse>;
};
export default useStudioOperation;
