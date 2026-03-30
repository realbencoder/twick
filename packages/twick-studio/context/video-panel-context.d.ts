import { ReactNode } from 'react';
import { MediaItem } from '@twick/video-editor';

interface VideoPanelContextType {
    items: MediaItem[];
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    addItem: (item: MediaItem) => void;
    isLoading: boolean;
}
export declare function VideoPanelProvider({ children }: {
    children: ReactNode;
}): import("react/jsx-runtime").JSX.Element;
export declare function useVideoPanel(): VideoPanelContextType;
export {};
