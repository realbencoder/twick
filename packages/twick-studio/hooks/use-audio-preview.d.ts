import { MediaItem } from '@twick/video-editor';

export interface AudioPreviewState {
    playingAudio: string | null;
    audioElement: HTMLAudioElement | null;
}
export interface AudioPreviewActions {
    togglePlayPause: (item: MediaItem) => void;
    stopPlayback: () => void;
}
export declare const useAudioPreview: () => AudioPreviewState & AudioPreviewActions;
