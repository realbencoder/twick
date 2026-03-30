import { ProjectJSON, VideoElement } from '@twick/timeline';
import { CaptionEntry, CaptionPhraseLength, ICaptionGenerationPollingResponse, ICaptionGenerationService } from '../types';

declare class GenerateCaptionsService implements ICaptionGenerationService {
    /**
     * Compatibility wrapper for legacy Studio caption service flow.
     * New AI workflows should prefer @twick/workflow directly.
     */
    videoElement: VideoElement | null;
    projectJSON: ProjectJSON | null;
    generateSubtiltesApi: (videoUrl: string, language?: string, phraseLength?: CaptionPhraseLength) => Promise<string>;
    requestStatusApi: (reqId: string) => Promise<ICaptionGenerationPollingResponse>;
    constructor({ generateSubtiltesApi, requestStatusApi, }: {
        generateSubtiltesApi: (videoUrl: string, language?: string, phraseLength?: CaptionPhraseLength) => Promise<string>;
        requestStatusApi: (reqId: string) => Promise<ICaptionGenerationPollingResponse>;
    });
    generateCaptions(videoElement: VideoElement, projectJSON: ProjectJSON, language?: string, phraseLength?: CaptionPhraseLength): Promise<string>;
    getRequestStatus(reqId: string): Promise<ICaptionGenerationPollingResponse>;
    updateProjectWithCaptions(captions: CaptionEntry[]): ProjectJSON;
    generateCaptionVideo(videoUrl: string, videoSize?: {
        width: number;
        height: number;
    }): Promise<string>;
}
export default GenerateCaptionsService;
