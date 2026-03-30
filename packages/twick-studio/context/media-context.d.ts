import { ReactNode } from 'react';
import { MediaItem } from '@twick/video-editor';

type MediaType = "video" | "audio" | "image";
export declare function MediaProvider({ children }: {
    children: ReactNode;
}): import("react/jsx-runtime").JSX.Element;
export declare function useMedia(type: MediaType): {
    items: MediaItem[];
    searchQuery: string;
    isLoading: boolean;
    setSearchQuery: (query: string) => void;
    addItem: (item: MediaItem) => void;
};
export {};
