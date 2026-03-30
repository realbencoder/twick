import { Track } from '@twick/timeline';

export interface MarqueeRect {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
}
interface UseMarqueeSelectionOptions {
    duration: number;
    zoomLevel: number;
    labelWidth: number;
    trackCount: number;
    trackHeight: number;
    tracks: Track[];
    containerRef: React.RefObject<HTMLDivElement | null>;
    onMarqueeSelect: (ids: Set<string>) => void;
    onEmptyClick: () => void;
}
export declare function useMarqueeSelection({ duration, zoomLevel, labelWidth, trackCount, trackHeight, tracks, containerRef, onMarqueeSelect, onEmptyClick, }: UseMarqueeSelectionOptions): {
    marquee: MarqueeRect | null;
    handleMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
};
export {};
