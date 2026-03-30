import { TrackElement } from '@twick/timeline';
import { ElementColors } from '../../helpers/types';

export interface TrackElementDragPayload {
    element: TrackElement;
    dragType: string;
    updates: {
        start: number;
        end: number;
    };
}
export interface DropPointer {
    clientX: number;
    clientY: number;
}
export declare const TrackElementView: React.FC<{
    element: TrackElement;
    selectedItem: TrackElement | null;
    selectedIds: Set<string>;
    parentWidth: number;
    duration: number;
    nextStart: number | null;
    prevEnd: number;
    allowOverlap: boolean;
    onSelection: (element: TrackElement, event: React.MouseEvent) => void;
    onDrag: (payload: TrackElementDragPayload, dropPointer?: DropPointer) => void;
    onDragStateChange?: (isDragging: boolean, element?: TrackElement) => void;
    elementColors?: ElementColors;
}>;
export default TrackElementView;
