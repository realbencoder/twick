/**
 * Hit-test: given clientY relative to timeline content area, return whether
 * the pointer is over a track or a separator (gap between tracks). OpenVideo-style.
 */
export type DropTarget = {
    type: "track";
    trackIndex: number;
} | {
    type: "separator";
    separatorIndex: number;
} | null;
export declare function getTrackOrSeparatorAt(clientY: number, containerTop: number, trackHeight: number): DropTarget;
