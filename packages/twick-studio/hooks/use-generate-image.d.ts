import { Size } from '@twick/timeline';
import { StudioConfig, GenerateImageParams } from '../types';

export declare const useGenerateImage: (studioConfig?: StudioConfig) => {
    generateImage: (params: GenerateImageParams) => Promise<string | null>;
    addImageToTimeline: (url: string, videoResolution: Size, startTime: number, duration: number) => void;
    isGenerating: boolean;
    error: string | null;
    hasService: boolean;
};
