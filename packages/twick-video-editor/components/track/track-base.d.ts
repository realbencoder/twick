import { Track, TrackElement } from '@twick/timeline';
import { ElementColors } from '../../helpers/types';
import { TrackElementDragPayload, DropPointer } from './track-element';

interface TrackBaseProps {
    duration: number;
    zoom: number;
    track: Track;
    trackWidth: number;
    selectedItem: TrackElement | null;
    selectedIds: Set<string>;
    allowOverlap?: boolean;
    onItemSelection: (element: TrackElement, event: React.MouseEvent) => void;
    onDrag: (payload: TrackElementDragPayload, dropPointer?: DropPointer) => void;
    onDragStateChange?: (isDragging: boolean, element?: TrackElement) => void;
    elementColors?: ElementColors;
}
declare const TrackBase: ({ duration, zoom, track, trackWidth, selectedItem, selectedIds, onItemSelection, onDrag, allowOverlap, onDragStateChange, elementColors, }: TrackBaseProps) => import("react/jsx-runtime").JSX.Element;
export default TrackBase;
