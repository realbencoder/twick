import { TrackElement } from '../core/elements/base.element';
import { Track } from '../core/track/track';
import { TrackJSON } from '../types';

/**
 * Rounds a number to a specified decimal precision.
 * Useful for ensuring consistent decimal places in timeline calculations.
 *
 * @param num - The number to round
 * @param precision - The number of decimal places to round to
 * @returns The rounded number
 *
 * @example
 * ```js
 * const rounded = getDecimalNumber(3.14159, 2);
 * // rounded = 3.14
 * ```
 */
export declare const getDecimalNumber: (num: number, precision?: number) => number;
/**
 * Calculates the total duration of all tracks in a timeline.
 * Finds the maximum end time across all elements in all tracks
 * to determine the overall timeline duration.
 *
 * @param tracks - Array of track data containing elements
 * @returns The total duration in seconds
 *
 * @example
 * ```js
 * const duration = getTotalDuration(tracks);
 * // duration = 120.5 (2 minutes and 0.5 seconds)
 * ```
 */
export declare const getTotalDuration: (tracks: TrackJSON[]) => number;
/**
 * Generates a short UUID for element and track identification.
 * Creates a 12-character unique identifier using a simplified
 * UUID generation algorithm.
 *
 * @returns A 12-character unique identifier string
 *
 * @example
 * ```js
 * const id = generateShortUuid();
 * // id = "a1b2c3d4e5f6"
 * ```
 */
export declare const generateShortUuid: () => string;
/**
 * Gets all elements that are currently active at the specified time.
 * Searches through all tracks to find elements whose time range
 * includes the current playback time.
 *
 * @param currentTime - The current playback time in seconds
 * @param tracks - Array of track objects to search through
 * @returns Array of elements currently active at the specified time
 *
 * @example
 * ```js
 * const activeElements = getCurrentElements(5.5, tracks);
 * // Returns all elements active at 5.5 seconds
 * ```
 */
export declare const getCurrentElements: (currentTime: number, tracks: Track[]) => Array<Readonly<TrackElement>>;
/**
 * Checks if an element can be split at the specified time.
 * Determines if the current time falls within the element's
 * start and end time range.
 *
 * @param element - The element to check for splitting
 * @param currentTime - The time at which to check if splitting is possible
 * @returns True if the element can be split at the specified time
 *
 * @example
 * ```js
 * const canSplit = canSplitElement(videoElement, 10.5);
 * // canSplit = true if element spans across 10.5 seconds
 * ```
 */
export declare const canSplitElement: (element: TrackElement, currentTime: number) => boolean;
/**
 * Checks if an ID represents an element.
 * Validates if the ID follows the element naming convention.
 *
 * @param id - The ID to check
 * @returns True if the ID represents an element
 *
 * @example
 * ```js
 * const isElement = isElementId("e-abc123");
 * // isElement = true
 * ```
 */
export declare const isElementId: (id: string) => boolean;
/**
 * Checks if an ID represents a track.
 * Validates if the ID follows the track naming convention.
 *
 * @param id - The ID to check
 * @returns True if the ID represents a track
 *
 * @example
 * ```js
 * const isTrack = isTrackId("t-xyz789");
 * // isTrack = true
 * ```
 */
export declare const isTrackId: (id: string) => boolean;
/**
 * Extracts and stitches audio from video elements across all tracks.
 * Processes all video elements in the timeline, extracts their audio segments,
 * and combines them into a single audio file with proper timing.
 *
 * @param tracks - Array of track objects containing video elements
 * @param duration - The total duration of the output audio
 * @returns Promise resolving to a Blob URL of the combined audio
 *
 * @example
 * ```js
 * const audioUrl = await extractVideoAudio(tracks, 120);
 * // audioUrl = "blob:http://localhost:3000/abc123"
 * ```
 */
export declare const extractVideoAudio: (tracks: Track[], duration: number) => Promise<any>;
//# sourceMappingURL=timeline.utils.d.ts.map