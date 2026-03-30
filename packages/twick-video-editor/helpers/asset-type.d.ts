/**
 * Maps file MIME type or extension to timeline element type.
 * Used for drop-on-timeline to determine which element to create.
 */
export type DroppableAssetType = "video" | "audio" | "image";
export declare function getAssetTypeFromFile(file: File): DroppableAssetType | null;
