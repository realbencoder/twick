import { MediaItem } from '@twick/video-editor';

export interface VideoPreviewState {
    playingVideo: string | null;
    videoElement: HTMLVideoElement | null;
}
export interface VideoPreviewActions {
    togglePlayPause: (item: MediaItem, videoElement: HTMLVideoElement) => void;
    stopPlayback: () => void;
}
export declare const useVideoPreview: () => VideoPreviewState & VideoPreviewActions;
