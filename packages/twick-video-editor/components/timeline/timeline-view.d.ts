import { Track, TrackElement, Size, ChapterMarker } from '@twick/timeline';
import { ElementColors } from '../../helpers/types';
import { DropTarget } from '../../utils/drop-target';

declare function TimelineView({ zoomLevel, selectedItem, duration, tracks, seekTrack, onAddTrack, onReorder, onItemSelect, onEmptyClick, onMarqueeSelect, onElementDrag, onElementDrop, onSeek, elementColors, selectedIds, playheadPositionPx, isPlayheadActive, onDropOnTimeline, videoResolution, enableDropOnTimeline, chapters, }: {
    zoomLevel: number;
    duration: number;
    tracks: Track[];
    selectedItem: Track | TrackElement | null;
    seekTrack?: React.ReactNode;
    onAddTrack: () => void;
    onReorder: (tracks: Track[]) => void;
    onElementDrag: (params: {
        element: TrackElement;
        dragType: string;
        updates: {
            start: number;
            end: number;
        };
    }) => void;
    onElementDrop?: (params: {
        element: TrackElement;
        dragType: string;
        updates: {
            start: number;
            end: number;
        };
        dropTarget: DropTarget | null;
    }) => Promise<void>;
    onSeek: (time: number) => void;
    onItemSelect: (item: Track | TrackElement, event: React.MouseEvent) => void;
    onEmptyClick: () => void;
    onMarqueeSelect: (ids: Set<string>) => void;
    onDeletion: (element: TrackElement | Track) => void;
    selectedIds: Set<string>;
    elementColors?: ElementColors;
    /** Playhead position in pixels (for auto-scroll) */
    playheadPositionPx?: number;
    /** Whether playhead is moving (playing or dragging) */
    isPlayheadActive?: boolean;
    /** Called when a file or panel media item is dropped on the timeline */
    onDropOnTimeline?: (params: {
        track: Track | null;
        timeSec: number;
        type: "video" | "audio" | "image";
        url: string;
    }) => Promise<void>;
    /** Video resolution for creating elements from dropped files */
    videoResolution?: Size;
    /** Whether to enable drop-on-timeline */
    enableDropOnTimeline?: boolean;
    chapters?: ChapterMarker[];
}): import("react/jsx-runtime").JSX.Element;
export default TimelineView;
