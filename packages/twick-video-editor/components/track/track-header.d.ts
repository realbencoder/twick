import { default as React } from 'react';
import { Track } from '@twick/timeline';

interface TrackHeaderProps {
    track: Track;
    selectedIds: Set<string>;
    onSelect: (track: Track, event: React.MouseEvent) => void;
    onDragStart: (e: React.DragEvent, track: Track) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent, track: Track) => void;
}
declare const TrackHeader: ({ track, selectedIds, onDragStart, onDragOver, onDrop, onSelect, }: TrackHeaderProps) => import("react/jsx-runtime").JSX.Element;
export default TrackHeader;
