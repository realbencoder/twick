import { Track } from '../track/track';
import { TimelineTrackData } from '../../services/data.service';
import { SplitResult } from '../visitor/element-splitter';
import { TrackElement } from '../elements/base.element';
import { ElementJSON, ProjectJSON, ProjectMetadata, TrackJSON } from '../../types';
import { default as Watermark } from '../addOns/watermark';

/** Event names emitted by TimelineEditor after mutations */
export type TimelineEditorEvent = "element:added" | "element:removed" | "element:updated" | "elements:removed" | "track:added" | "track:removed" | "track:reordered" | "project:loaded";
/**
 * Type for timeline operation context
 */
export interface TimelineOperationContext {
    contextId: string;
    setTotalDuration: (duration: number) => void;
    setPresent: (data: ProjectJSON) => void;
    handleUndo: () => ProjectJSON | null;
    handleRedo: () => ProjectJSON | null;
    handleResetHistory: () => void;
    updateChangeLog: () => void;
    setTimelineAction?: (action: string, payload?: unknown) => void;
}
export interface TrackUpsertInput {
    id?: string;
    name: string;
    type?: string;
    language?: string;
    props?: Record<string, unknown>;
}
export interface TrackOverlapIssue {
    elementId: string;
    overlapsWithElementId: string;
    trackId: string;
}
/**
 * TimelineEditor
 *
 * This class provides an interface to execute all timeline operations
 * using a direct, class-based approach with track-based management.
 * It also handles undo/redo operations internally.
 */
export declare class TimelineEditor {
    private context;
    private totalDuration;
    private eventListeners;
    constructor(context: TimelineOperationContext);
    registerElementType(type: string, deserializer: (json: ElementJSON) => TrackElement | null): void;
    unregisterElementType(type: string): void;
    /**
     * Subscribe to timeline mutation events.
     */
    on(event: TimelineEditorEvent, handler: (payload: unknown) => void): void;
    /**
     * Unsubscribe from timeline mutation events.
     */
    off(event: TimelineEditorEvent, handler: (payload: unknown) => void): void;
    private emit;
    getContext(): TimelineOperationContext;
    pauseVideo(): void;
    getTimelineData(): TimelineTrackData | null;
    getLatestVersion(): number;
    protected setTimelineData({ tracks, version, watermark, backgroundColor, metadata, updatePlayerData, forceUpdate, }: {
        tracks: Track[];
        version?: number;
        updatePlayerData?: boolean;
        forceUpdate?: boolean;
        watermark?: Watermark;
        backgroundColor?: string;
        metadata?: ProjectMetadata;
    }): TimelineTrackData;
    addTrack(name: string, type?: string): Track;
    getTrackById(id: string): Track | null;
    getTrackByName(name: string): Track | null;
    getCaptionsTrack(): Track | null;
    getTracksByType(type: string): Track[];
    getTracksByPredicate(predicate: (track: Track, index: number) => boolean): Track[];
    updateTrackProps(trackId: string, propsPatch: Record<string, unknown>): Track | null;
    replaceTrackProps(trackId: string, nextProps: Record<string, unknown>): Track | null;
    upsertTrack(input: TrackUpsertInput): Track;
    validateTrackOverlaps(trackId: string): {
        valid: boolean;
        issues: TrackOverlapIssue[];
    };
    removeTrackById(id: string): void;
    removeTrack(track: Track): void;
    /**
     * Refresh the timeline data
     */
    refresh(): void;
    /**
     * Add an element to a specific track using the visitor pattern.
     * @param track The track to add the element to.
     * @param element The element to add.
     * @returns A promise that resolves to `true` if the element was added successfully, otherwise `false`.
     */
    addElementToTrack(track: Track, element: TrackElement): Promise<boolean>;
    /**
     * Remove an element from a specific track using the visitor pattern.
     * @param element The element to remove.
     * @returns `true` if the element was removed successfully, otherwise `false`.
     */
    removeElement(element: TrackElement): boolean;
    /**
     * Update an element in a specific track using the visitor pattern.
     * @param element The updated element.
     * @returns The updated `TrackElement`.
     */
    updateElement(element: TrackElement): TrackElement;
    /**
     * Split an element at a specific time point using the visitor pattern
     * @param element The element to split
     * @param splitTime The time point to split at
     * @returns SplitResult with first element, second element, and success status
     */
    splitElement(element: TrackElement, splitTime: number): Promise<SplitResult>;
    /**
     * Clone an element using the visitor pattern
     * @param element The element to clone
     * @returns TrackElement | null - the cloned element or null if cloning failed
     */
    cloneElement(element: TrackElement): TrackElement | null;
    reorderTracks(tracks: Track[]): void;
    /**
     * Move an element to a new track inserted at the given index (OpenVideo-style separator drop).
     * Removes the element from its current track, creates a new track at targetTrackIndex,
     * sets element start/end, and adds the element to the new track.
     */
    moveElementToNewTrackAt(element: TrackElement, targetTrackIndex: number, startSec: number): Promise<boolean>;
    updateHistory(timelineTrackData: TimelineTrackData): void;
    /**
     * Trigger undo operation and update timeline data
     */
    undo(): void;
    /**
     * Trigger redo operation and update timeline data
     */
    redo(): void;
    /**
     * Reset history and clear timeline data
     */
    resetHistory(): void;
    loadProject({ tracks, version, backgroundColor, metadata, }: {
        tracks: TrackJSON[];
        version: number;
        backgroundColor?: string;
        metadata?: ProjectMetadata;
    }): void;
    loadProjectSnapshot({ tracks, version, backgroundColor, metadata, }: {
        tracks: TrackJSON[];
        version: number;
        backgroundColor?: string;
        metadata?: ProjectMetadata;
    }): void;
    getWatermark(): Watermark | null;
    setWatermark(watermark: Watermark): void;
    removeWatermark(): void;
    getVideoAudio(): Promise<string>;
    /**
     * Add transition metadata from one element to the next (e.g. crossfade).
     * Sets optional transition on the "from" element; visualizer can interpret it when implemented.
     */
    addTransition(fromElementId: string, toElementId: string, kind: string, duration: number): boolean;
    /**
     * Remove transition metadata from an element.
     */
    removeTransition(elementId: string): boolean;
    private findElementById;
    /**
     * Get the current project as ProjectJSON (same shape consumed by visualizer).
     */
    getProject(): ProjectJSON;
    getBackgroundColor(): string | undefined;
    setBackgroundColor(backgroundColor: string): void;
    getMetadata(): ProjectMetadata | undefined;
    setMetadata(metadata: ProjectMetadata): void;
    /**
     * Ripple delete: remove content in [fromTime, toTime] and shift later content left.
     * Single undo step.
     */
    rippleDelete(fromTime: number, toTime: number): Promise<void>;
    /**
     * Trim an element to new start and end times. Validates bounds and updates via updateElement.
     */
    trimElement(element: TrackElement, newStart: number, newEnd: number): boolean;
    /**
     * Apply multiple element updates in one batch; single setTimelineData and undo step.
     */
    updateElements(updates: Array<{
        elementId: string;
        updates: Partial<ElementJSON>;
    }>): void;
    /**
     * For caption elements with existing wordsMs arrays, keep word timings aligned
     * when their time range changes. If the wordsMs length matches the word count,
     * shift/scale existing timings into the new [s, e] interval. If the length no
     * longer matches, regenerate wordsMs using a letter-weighted distribution.
     */
    private adjustCaptionWordsForTimeChange;
    /**
     * Remove multiple elements by id in one batch; single setTimelineData and undo step.
     */
    removeElements(elementIds: string[]): void;
    /**
     * Replace all elements with the given src (e.g. placeholder or same URL) with a new element definition.
     * Preserves id, s, e, and track for each replaced element. Single setTimelineData at end.
     */
    replaceElementsBySource(src: string, newElementJson: ElementJSON): number;
    /**
     * Center an element in the scene by setting its position to the center of scene dimensions.
     */
    centerElementInScene(elementId: string, sceneWidth: number, sceneHeight: number): boolean;
    /**
     * Scale an element to fit within scene dimensions while preserving aspect ratio.
     * Updates width/height in props or frame when present.
     */
    scaleElementToFit(elementId: string, sceneWidth: number, sceneHeight: number): boolean;
    /**
     * Duplicate multiple elements by id; adds clones to the same track. Single setTimelineData at end.
     */
    duplicateElements(elementIds: string[]): Promise<TrackElement[]>;
}
//# sourceMappingURL=timeline.editor.d.ts.map