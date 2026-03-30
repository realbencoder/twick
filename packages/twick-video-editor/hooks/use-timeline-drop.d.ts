import { Track, VideoElement, AudioElement, ImageElement, Size } from '@twick/timeline';
import { DroppableAssetType } from '../helpers/asset-type';

export interface DropPreview {
    trackIndex: number;
    timeSec: number;
    /** Approximate width for preview (based on default duration) */
    widthPct: number;
}
/**
 * Hook for handling file drops on the timeline.
 * Computes drop position from coordinates and provides handlers for drag/drop.
 */
export declare function useTimelineDrop({ containerRef, scrollContainerRef, tracks, duration, zoomLevel, labelWidth, trackHeight, 
/** Width of the track content area (timeline minus labels). Used for accurate time mapping. */
trackContentWidth, onDrop, enabled, }: {
    containerRef: React.RefObject<HTMLElement | null>;
    /** Ref to scroll container; used for scrollLeft. Falls back to containerRef if not provided. */
    scrollContainerRef?: React.RefObject<HTMLElement | null>;
    tracks: Track[];
    duration: number;
    zoomLevel: number;
    labelWidth: number;
    trackHeight: number;
    trackContentWidth?: number;
    onDrop: (params: {
        track: Track | null;
        timeSec: number;
        type: DroppableAssetType;
        url: string;
    }) => Promise<void>;
    enabled?: boolean;
}): {
    preview: DropPreview | null;
    isDraggingOver: boolean;
    handleDragOver: (e: React.DragEvent) => void;
    handleDragLeave: (e: React.DragEvent) => void;
    handleDrop: (e: React.DragEvent) => Promise<void>;
};
export declare function createElementFromDrop(type: DroppableAssetType, blobUrl: string, parentSize: Size): VideoElement | AudioElement | ImageElement;
