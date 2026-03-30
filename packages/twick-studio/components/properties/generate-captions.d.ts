import { TrackElement, VideoElement } from '@twick/timeline';
import { CaptionPhraseLength, ICaptionGenerationPollingResponse } from '../../types';

export declare function GenerateCaptionsPanel({ selectedElement, addCaptionsToTimeline, onGenerateCaptions, getCaptionstatus, pollingIntervalMs, }: {
    selectedElement: TrackElement;
    addCaptionsToTimeline: (captions: {
        s: number;
        e: number;
        t: string;
        w?: number[];
    }[]) => void;
    onGenerateCaptions: (videoElement: VideoElement, language?: string, phraseLength?: CaptionPhraseLength) => Promise<string | null>;
    getCaptionstatus: (reqId: string) => Promise<ICaptionGenerationPollingResponse>;
    pollingIntervalMs?: number;
}): import("react/jsx-runtime").JSX.Element;
