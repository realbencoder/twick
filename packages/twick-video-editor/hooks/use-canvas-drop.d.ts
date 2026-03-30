import { DroppableAssetType } from '../helpers/asset-type';

export interface CanvasDropPayload {
    type: DroppableAssetType;
    url: string;
    canvasX?: number;
    canvasY?: number;
}
/**
 * Hook for handling file/media drops on the canvas.
 * Accepts both files from OS and media dragged from studio panels.
 */
export declare function useCanvasDrop({ containerRef, videoSize, onDrop, enabled, }: {
    containerRef: React.RefObject<HTMLElement | null>;
    videoSize: {
        width: number;
        height: number;
    };
    onDrop: (payload: CanvasDropPayload) => Promise<void>;
    enabled?: boolean;
}): {
    handleDragOver: (e: React.DragEvent) => void;
    handleDragLeave: (e: React.DragEvent) => void;
    handleDrop: (e: React.DragEvent) => Promise<void>;
};
