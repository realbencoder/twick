import { CanvasConfig } from '../../helpers/types';

/**
 * PlayerManager component that manages video playback and canvas rendering.
 * Integrates the live player with canvas operations, handling both video playback
 * and static canvas display modes. Automatically updates canvas when paused and
 * manages player state transitions.
 *
 * @param props - Component configuration props
 * @param props.videoProps - Video dimensions and background color
 * @param props.playerProps - Optional player quality settings
 * @param props.canvasMode - Whether to show canvas overlay when paused
 * @param props.canvasConfig - Canvas behavior options (e.g. enableShiftAxisLock)
 * @returns JSX element containing player and canvas components
 *
 * @example
 * ```tsx
 * <PlayerManager
 *   videoProps={{ width: 1920, height: 1080, backgroundColor: '#000' }}
 *   playerProps={{ quality: 720 }}
 *   canvasMode={true}
 *   canvasConfig={{ enableShiftAxisLock: true }}
 * />
 * ```
 */
export declare const PlayerManager: ({ videoProps, playerProps, canvasMode, canvasConfig, }: {
    videoProps: {
        width: number;
        height: number;
        backgroundColor?: string;
    };
    playerProps?: {
        quality?: number;
    };
    canvasMode: boolean;
    canvasConfig?: CanvasConfig;
}) => import("react/jsx-runtime").JSX.Element;
