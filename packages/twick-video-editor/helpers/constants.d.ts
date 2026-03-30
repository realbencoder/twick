import { ElementColors } from './types';
import { TimelineTickConfig } from '../components/video-editor';

/**
 * Initial timeline data structure for new video editor projects.
 * Provides a default timeline with a sample text element to get started.
 */
export declare const INITIAL_TIMELINE_DATA: {
    tracks: {
        type: string;
        id: string;
        name: string;
        elements: {
            id: string;
            trackId: string;
            name: string;
            type: string;
            s: number;
            e: number;
            props: {
                text: string;
                fill: string;
            };
        }[];
    }[];
    version: number;
};
/**
 * Minimum duration for timeline elements in seconds.
 * Used to prevent elements from having zero or negative duration.
 */
export declare const MIN_DURATION = 0.1;
export declare const TIMELINE_DROP_MEDIA_TYPE = "application/x-twick-media";
export declare const DRAG_TYPE: {
    /** Drag operation is starting */
    readonly START: "start";
    /** Drag operation is in progress */
    readonly MOVE: "move";
    /** Drag operation has ended */
    readonly END: "end";
};
export declare const DEFAULT_TIMELINE_ZOOM = 1.5;
/**
 * Default timeline zoom configuration including min, max, step, and default values.
 * Controls the zoom behavior and constraints for the timeline view.
 */
/**
 * Default frames per second for timeline time display.
 * Used for MM:SS.FF format (e.g. 00:15.12 = 15.4 seconds at 30fps).
 */
export declare const DEFAULT_FPS = 30;
/** Snap threshold in pixels - used to convert to seconds based on zoom */
export declare const SNAP_THRESHOLD_PX = 10;
export declare const DEFAULT_TIMELINE_ZOOM_CONFIG: {
    /** Minimum zoom level (10%) */
    min: number;
    /** Maximum zoom level (300%) */
    max: number;
    /** Zoom step increment/decrement (10%) */
    step: number;
    /** Default zoom level (150%) */
    default: number;
};
/**
 * Default timeline tick configurations for different duration ranges.
 * Defines major tick intervals and number of minor ticks between majors
 * to provide optimal timeline readability at various durations.
 *
 * Each configuration applies when the duration is less than the specified threshold.
 * Configurations are ordered by duration threshold ascending.
 */
export declare const DEFAULT_TIMELINE_TICK_CONFIGS: TimelineTickConfig[];
/**
 * Default color scheme for different element types in the timeline.
 * Provides consistent visual distinction between various timeline elements.
 */
export declare const DEFAULT_ELEMENT_COLORS: ElementColors;
/**
 * Available text fonts for video editor text elements.
 * Includes Google Fonts, display fonts, and custom CDN fonts.
 */
export declare const AVAILABLE_TEXT_FONTS: {
    /** Modern sans-serif font */
    readonly RUBIK: "Rubik";
    /** Clean and readable font */
    readonly MULISH: "Mulish";
    /** Bold display font */
    readonly LUCKIEST_GUY: "Luckiest Guy";
    /** Elegant serif font */
    readonly PLAYFAIR_DISPLAY: "Playfair Display";
    /** Classic sans-serif font */
    readonly ROBOTO: "Roboto";
    /** Modern geometric font */
    readonly POPPINS: "Poppins";
    /** Comic-style display font */
    readonly BANGERS: "Bangers";
    /** Handwritten-style font */
    readonly BIRTHSTONE: "Birthstone";
    /** Elegant script font */
    readonly CORINTHIA: "Corinthia";
    /** Formal script font */
    readonly IMPERIAL_SCRIPT: "Imperial Script";
    /** Bold outline font */
    readonly KUMAR_ONE_OUTLINE: "Kumar One Outline";
    /** Light outline font */
    readonly LONDRI_OUTLINE: "Londrina Outline";
    /** Casual script font */
    readonly MARCK_SCRIPT: "Marck Script";
    /** Modern sans-serif font */
    readonly MONTSERRAT: "Montserrat";
    /** Stylish display font */
    readonly PATTAYA: "Pattaya";
    /** Unique display font */
    readonly PERALTA: "Peralta";
    /** Handwritten-style font */
    readonly LUMANOSIMO: "Lumanosimo";
    /** Custom display font */
    readonly KAPAKANA: "Kapakana";
};
