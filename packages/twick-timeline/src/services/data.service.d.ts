import { default as Watermark } from '../core/addOns/watermark';
import { TrackElement } from '../core/elements/base.element';
import { Track } from '../core/track/track';
import { ProjectMetadata } from '../types';

export type TimelineTrackData = {
    tracks: Track[];
    version: number;
    backgroundColor?: string;
    watermark?: Watermark;
    metadata?: ProjectMetadata;
};
export declare class TimelineContextStore {
    private static instance;
    private storeMap;
    private constructor();
    static getInstance(): TimelineContextStore;
    initializeContext(contextId: string): void;
    getTimelineData(contextId: string): TimelineTrackData | null;
    setTimelineData(contextId: string, timelineData: TimelineTrackData): TimelineTrackData;
    getElementMap(contextId: string): Record<string, TrackElement>;
    setElementMap(contextId: string, elementMap: Record<string, TrackElement>): void;
    getTrackMap(contextId: string): Record<string, any>;
    setTrackMap(contextId: string, trackMap: Record<string, any>): void;
    getCaptionProps(contextId: string): Record<string, any>;
    setCaptionProps(contextId: string, captionProps: Record<string, any>): void;
    clearContext(contextId: string): void;
    private ensureContext;
}
export declare const timelineContextStore: TimelineContextStore;
//# sourceMappingURL=data.service.d.ts.map