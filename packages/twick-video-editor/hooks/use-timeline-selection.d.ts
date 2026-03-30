import { Track, TrackElement } from '@twick/timeline';

/**
 * Handles timeline selection with multi-select support.
 * - Single click: replace selection
 * - Cmd/Ctrl+click: toggle item in selection
 * - Shift+click: range select (elements in same track, or tracks)
 */
export declare function useTimelineSelection(): {
    handleItemSelect: (item: Track | TrackElement, event: React.MouseEvent) => void;
    handleEmptyClick: () => void;
    handleMarqueeSelect: (ids: Set<string>) => void;
};
