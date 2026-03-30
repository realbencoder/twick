import { CanvasDropPayload } from './use-canvas-drop';
import { CanvasConfig } from '../helpers/types';

/**
 * Custom hook to manage player state and canvas interactions.
 * Handles player data updates, canvas operations, and timeline synchronization
 * for the video editor component.
 *
 * @param videoProps - Object containing video dimensions
 * @param canvasConfig - Canvas behavior options (e.g. enableShiftAxisLock) from editorConfig / studioConfig
 * @returns Object containing player management functions and state
 *
 * @example
 * ```js
 * const { twickCanvas, projectData, updateCanvas } = usePlayerManager({
 *   videoProps: { width: 1920, height: 1080 },
 *   canvasConfig: { enableShiftAxisLock: true }
 * });
 * ```
 */
export declare const usePlayerManager: ({ videoProps, canvasConfig, }: {
    videoProps: {
        width: number;
        height: number;
    };
    canvasConfig?: CanvasConfig;
}) => {
    twickCanvas: any;
    projectData: any;
    updateCanvas: (seekTime: number, forceRefresh?: boolean) => void;
    buildCanvas: any;
    resizeCanvas: any;
    setBackgroundColor: any;
    onPlayerUpdate: (event: CustomEvent) => void;
    playerUpdating: boolean;
    handleDropOnCanvas: (payload: CanvasDropPayload) => Promise<void>;
    bringToFront: any;
    sendToBack: any;
    bringForward: any;
    sendBackward: any;
    deleteElement: (elementId: string) => void;
};
