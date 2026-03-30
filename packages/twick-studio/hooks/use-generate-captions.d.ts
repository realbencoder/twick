import { VideoElement } from '@twick/timeline';
import { ICaptionGenerationPollingResponse, StudioConfig, CaptionEntry, CaptionPhraseLength } from '../types';

declare const useGenerateCaptions: (studioConfig?: StudioConfig) => {
    onGenerateCaptions: (videoElement: VideoElement, language?: string, phraseLength?: CaptionPhraseLength) => Promise<string | null>;
    addCaptionsToTimeline: (captions: CaptionEntry[]) => void;
    getCaptionstatus: (reqId: string) => Promise<ICaptionGenerationPollingResponse>;
    pollingIntervalMs: number;
};
export default useGenerateCaptions;
