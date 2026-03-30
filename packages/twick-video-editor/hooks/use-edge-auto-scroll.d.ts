export interface UseEdgeAutoScrollParams {
    isActive: boolean;
    getMouseClientX: () => number;
    scrollContainerRef: React.RefObject<HTMLDivElement | null>;
    contentWidth: number;
    edgeThreshold?: number;
    maxScrollSpeed?: number;
}
/**
 * Auto-scrolls the timeline horizontally when the pointer is near the left/right edge during drag (OpenVideo-style).
 */
export declare function useEdgeAutoScroll({ isActive, getMouseClientX, scrollContainerRef, contentWidth, edgeThreshold, maxScrollSpeed, }: UseEdgeAutoScrollParams): void;
