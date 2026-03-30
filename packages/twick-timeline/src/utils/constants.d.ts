/**
 * Track type constants for timeline tracks.
 * Use these instead of raw strings for type safety and consistency.
 *
 * @example
 * ```js
 * import { TRACK_TYPES } from '@twick/timeline';
 *
 * editor.addTrack("Video", TRACK_TYPES.VIDEO);
 * const captionsTrack = editor.getCaptionsTrack(); // first track with type TRACK_TYPES.CAPTION
 * ```
 */
export declare const TRACK_TYPES: {
    /** Video track – video clips */
    readonly VIDEO: "video";
    /** Audio track – audio clips */
    readonly AUDIO: "audio";
    /** Caption track – captions / captions */
    readonly CAPTION: "caption";
    /** Scene track – scene containers (e.g. image/video as full scene) */
    readonly SCENE: "scene";
    /** Element track – text, shapes, icons, images (overlay elements) */
    readonly ELEMENT: "element";
};
/** Union type of valid track type strings */
export type TrackType = (typeof TRACK_TYPES)[keyof typeof TRACK_TYPES];
/**
 * Initial timeline data structure for new video editor projects.
 * Provides a default timeline with a sample text element to get started.
 *
 * @example
 * ```js
 * import { INITIAL_TIMELINE_DATA } from '@twick/timeline';
 *
 * // Use as starting point for new projects
 * const newProject = {
 *   ...INITIAL_TIMELINE_DATA,
 *   tracks: [...INITIAL_TIMELINE_DATA.tracks, newTrack]
 * };
 * ```
 */
export declare const INITIAL_TIMELINE_DATA: {
    tracks: {
        type: "element";
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
 * Player state constants for timeline playback control.
 * Defines the different states that a timeline player can be in during playback.
 *
 * @example
 * ```js
 * import { PLAYER_STATE } from '@twick/timeline';
 *
 * if (playerState === PLAYER_STATE.PLAYING) {
 *   console.log('Timeline is currently playing');
 * }
 * ```
 */
export declare const PLAYER_STATE: {
    /** Player is refreshing/reloading content */
    readonly REFRESH: "Refresh";
    /** Player is actively playing content */
    readonly PLAYING: "Playing";
    /** Player is paused */
    readonly PAUSED: "Paused";
};
/**
 * Caption styling options for text elements.
 * Defines different visual styles for caption text rendering.
 *
 * @example
 * ```js
 * import { CAPTION_STYLE } from '@twick/timeline';
 *
 * const captionElement = new CaptionElement({
 *   style: CAPTION_STYLE.WORD_BY_WORD
 * });
 * ```
 */
export declare const CAPTION_STYLE: {
    /** Highlights background of each word */
    readonly WORD_BG_HIGHLIGHT: "highlight_bg";
    /** Animates text word by word */
    readonly WORD_BY_WORD: "word_by_word";
    /** Animates text word by word with background highlighting */
    readonly WORD_BY_WORD_WITH_BG: "word_by_word_with_bg";
    /** Classic outline: white text with black stroke, no background */
    readonly OUTLINE_ONLY: "outline_only";
    /** Soft box: full phrase in semi-transparent rounded box */
    readonly SOFT_BOX: "soft_box";
    /** Lower third: single line with optional bar (broadcast style) */
    readonly LOWER_THIRD: "lower_third";
    /** Typewriter: characters appear one by one */
    readonly TYPEWRITER: "typewriter";
    /** Karaoke: one word highlighted at a time */
    readonly KARAOKE: "karaoke";
    /** Karaoke-word: previous words dim while current stays highlighted */
    readonly KARAOKE_WORD: "karaoke-word";
    /** Pop / scale: words pop in with a short scale animation */
    readonly POP_SCALE: "pop_scale";
};
/**
 * Human-readable options for caption styles.
 * Provides user-friendly labels for caption style selection.
 *
 * @example
 * ```js
 * import { CAPTION_STYLE_OPTIONS } from '@twick/timeline';
 *
 * const options = Object.values(CAPTION_STYLE_OPTIONS);
 * // Returns array of style options with labels
 * ```
 */
export declare const CAPTION_STYLE_OPTIONS: {
    readonly highlight_bg: {
        readonly label: "Highlight Background";
        readonly value: "highlight_bg";
    };
    readonly word_by_word: {
        readonly label: "Word by Word";
        readonly value: "word_by_word";
    };
    readonly word_by_word_with_bg: {
        readonly label: "Word with Background";
        readonly value: "word_by_word_with_bg";
    };
    readonly outline_only: {
        readonly label: "Classic Outline";
        readonly value: "outline_only";
    };
    readonly soft_box: {
        readonly label: "Soft Box";
        readonly value: "soft_box";
    };
    readonly lower_third: {
        readonly label: "Lower Third";
        readonly value: "lower_third";
    };
    readonly typewriter: {
        readonly label: "Typewriter";
        readonly value: "typewriter";
    };
    readonly karaoke: {
        readonly label: "Karaoke";
        readonly value: "karaoke";
    };
    readonly "karaoke-word": {
        readonly label: "Karaoke (Word Fade)";
        readonly value: "karaoke-word";
    };
    readonly pop_scale: {
        readonly label: "Pop / Scale";
        readonly value: "pop_scale";
    };
};
/**
 * Default font settings for caption elements.
 * Defines the standard typography configuration for captions.
 *
 * @example
 * ```js
 * import { CAPTION_FONT } from '@twick/timeline';
 *
 * const fontSize = CAPTION_FONT.size; // 40
 * ```
 */
export declare const CAPTION_FONT: {
    /** Font size in pixels */
    readonly size: 40;
};
/**
 * Default color scheme for caption elements.
 * Defines the standard color palette for caption text and backgrounds.
 *
 * @example
 * ```js
 * import { CAPTION_COLOR } from '@twick/timeline';
 *
 * const textColor = CAPTION_COLOR.text; // "#ffffff"
 * const highlightColor = CAPTION_COLOR.highlight; // "#ff4081"
 * ```
 */
export declare const CAPTION_COLOR: {
    /** Text color in hex format */
    readonly text: "#ffffff";
    /** Highlight color in hex format */
    readonly highlight: "#ff4081";
    /** Background color in hex format */
    readonly bgColor: "#8C52FF";
};
/**
 * Number of words to display per phrase in caption animations.
 * Controls the chunking of text for word-by-word animations.
 *
 * @example
 * ```js
 * import { WORDS_PER_PHRASE } from '@twick/timeline';
 *
 * const phraseLength = WORDS_PER_PHRASE; // 4
 * ```
 */
export declare const WORDS_PER_PHRASE = 4;
/**
 * Timeline action types for state management.
 * Defines the different actions that can be performed on the timeline.
 *
 * @example
 * ```js
 * import { TIMELINE_ACTION } from '@twick/timeline';
 *
 * if (action.type === TIMELINE_ACTION.SET_PLAYER_STATE) {
 *   // Handle player state change
 * }
 * ```
 */
export declare const TIMELINE_ACTION: {
    /** No action being performed */
    readonly NONE: "none";
    /** Setting the player state (play/pause) */
    readonly SET_PLAYER_STATE: "setPlayerState";
    /** Updating player data */
    readonly UPDATE_PLAYER_DATA: "updatePlayerData";
    /** Player has been updated */
    readonly ON_PLAYER_UPDATED: "onPlayerUpdated";
};
/**
 * Element type constants for timeline elements.
 * Defines the different types of elements that can be added to timeline tracks.
 *
 * @example
 * ```js
 * import { TIMELINE_ELEMENT_TYPE } from '@twick/timeline';
 *
 * if (element.type === TIMELINE_ELEMENT_TYPE.VIDEO) {
 *   // Handle video element
 * }
 * ```
 */
export declare const TIMELINE_ELEMENT_TYPE: {
    /** Video element type */
    readonly VIDEO: "video";
    /** Caption element type */
    readonly CAPTION: "caption";
    /** Image element type */
    readonly IMAGE: "image";
    /** Audio element type */
    readonly AUDIO: "audio";
    /** Text element type */
    readonly TEXT: "text";
    /** Rectangle element type */
    readonly RECT: "rect";
    /** Circle element type */
    readonly CIRCLE: "circle";
    /** Icon element type */
    readonly ICON: "icon";
    /** Placeholder element type (e.g. for lazy-loaded media) */
    readonly PLACEHOLDER: "placeholder";
    /** Line annotation / shape element type */
    readonly LINE: "line";
    /** Arrow annotation element type */
    readonly ARROW: "arrow";
    /** Global / adjustment-layer style effect element */
    readonly EFFECT: "effect";
};
/**
 * Process state constants for async operations.
 * Defines the different states of background processing operations.
 *
 * @example
 * ```js
 * import { PROCESS_STATE } from '@twick/timeline';
 *
 * if (processState === PROCESS_STATE.PROCESSING) {
 *   // Show loading indicator
 * }
 * ```
 */
export declare const PROCESS_STATE: {
    /** Process is idle */
    readonly IDLE: "Idle";
    /** Process is currently running */
    readonly PROCESSING: "Processing";
    /** Process has completed successfully */
    readonly COMPLETED: "Completed";
    /** Process has failed */
    readonly FAILED: "Failed";
};
//# sourceMappingURL=constants.d.ts.map