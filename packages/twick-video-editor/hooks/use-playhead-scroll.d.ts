/**
 * Configuration for playhead scroll behavior.
 */
export interface PlayheadScrollConfig {
    /** Pixels to keep between playhead and viewport edge before auto-scrolling */
    margin?: number;
    /** Width of the label/track-header area (left of seek track) in pixels */
    labelWidth?: number;
}
/**
 * Scrolls the timeline container to keep the playhead visible when it reaches
 * the viewport edge. Used during playback and when dragging the playhead.
 *
 * @param scrollContainerRef - Ref to the scrollable timeline container
 * @param playheadPositionPx - Playhead position in pixels (from left of content)
 * @param isActive - Whether to run scroll logic (playing or dragging)
 * @param config - Optional margin and label width
 */
export declare function usePlayheadScroll(scrollContainerRef: React.RefObject<HTMLElement | null>, playheadPositionPx: number, isActive: boolean, config?: PlayheadScrollConfig): void;
