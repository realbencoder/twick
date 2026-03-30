import { Size } from '@twick/timeline';
import { StudioConfig, GenerateVideoParams } from '../types';

export declare const useGenerateVideo: (studioConfig?: StudioConfig) => {
    generateVideo: (params: GenerateVideoParams) => Promise<string | null>;
    addVideoToTimeline: (url: string, videoResolution: Size, startTime: number, duration: number) => void;
    isGenerating: boolean;
    error: string | null;
    hasService: boolean;
};
