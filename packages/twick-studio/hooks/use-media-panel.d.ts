import { TrackElement, Size } from '@twick/timeline';
import { MediaItem } from '@twick/video-editor';

export interface MediaPanelState {
    items: MediaItem[];
    searchQuery: string;
    isLoading: boolean;
    acceptFileTypes: string[];
}
export interface MediaPanelActions {
    setSearchQuery: (query: string) => void;
    handleSelection: (item: MediaItem, forceAdd?: boolean) => void;
    handleFileUpload: (fileData: {
        file: File;
        blobUrl: string;
    }) => void;
}
export type MediaType = "video" | "audio" | "image";
export declare const useMediaPanel: (type: MediaType, { selectedElement, addElement, updateElement, }: {
    selectedElement: TrackElement | null;
    addElement: (element: TrackElement) => void;
    updateElement: (element: TrackElement) => void;
}, videoResolution: Size) => MediaPanelState & MediaPanelActions;
