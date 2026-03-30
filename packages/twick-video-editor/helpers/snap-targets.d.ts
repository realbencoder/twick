import { Track } from '@twick/timeline';

/**
 * Collects snap target times for the timeline.
 * Includes: playhead, clip edges (excluding the dragging element), 0, and duration.
 */
export declare function getSnapTargets(tracks: Track[], currentTime: number, duration: number, excludeElementId?: string): number[];
