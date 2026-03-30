import { Track } from '../core/track/track';
import { TrackElement } from '../core/elements/base.element';

/** Resolve a single ID to Track | TrackElement | null */
export declare function resolveId(id: string, tracks: Track[]): Track | TrackElement | null;
/** Resolve multiple IDs to (Track | TrackElement)[] */
export declare function resolveIds(ids: Set<string>, tracks: Track[]): (Track | TrackElement)[];
/**
 * Get all element IDs in a track between two elements (inclusive).
 * Used for Shift+click range selection.
 */
export declare function getElementIdsInRange(track: Track, fromElementId: string, toElementId: string): string[];
//# sourceMappingURL=selection.d.ts.map