import {
  extractVideoAudio,
  generateShortUuid,
  getTotalDuration,
} from "../../utils/timeline.utils";
import { migrateProject, CURRENT_PROJECT_VERSION } from "../../utils/migrations";
import { TRACK_TYPES } from "../../utils/constants";
import { Track } from "../track/track";
import {
  timelineContextStore,
  TimelineTrackData,
} from "../../services/data.service";
import { PLAYER_STATE, TIMELINE_ACTION } from "../../utils/constants";
import { ElementAdder } from "../visitor/element-adder";
import { ElementRemover } from "../visitor/element-remover";
import { ElementUpdater } from "../visitor/element-updater";
import { ElementSplitter, SplitResult } from "../visitor/element-splitter";
import { ElementCloner } from "../visitor/element-cloner";
import { ElementDeserializer } from "../visitor/element-deserializer";
import { TrackElement } from "../elements/base.element";
import {
  ElementJSON,
  ElementTransitionJSON,
  ProjectJSON,
  ProjectMetadata,
  TrackJSON,
} from "../../types";
import { ValidationError } from "../visitor/element-validator";
import Watermark from "../addOns/watermark";

/** Event names emitted by TimelineEditor after mutations */
export type TimelineEditorEvent =
  | "element:added"
  | "element:removed"
  | "element:updated"
  | "elements:removed"
  | "track:added"
  | "track:removed"
  | "track:reordered"
  | "project:loaded";

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
export class TimelineEditor {
  private context: TimelineOperationContext;
  private totalDuration: number = 0;
  private eventListeners = new Map<
    TimelineEditorEvent,
    Set<(payload: unknown) => void>
  >();

  constructor(context: TimelineOperationContext) {
    this.context = context;
    // Ensure context is initialized in timelineContextStore
    timelineContextStore.initializeContext(this.context.contextId);
  }

  registerElementType(
    type: string,
    deserializer: (json: ElementJSON) => TrackElement | null
  ): void {
    ElementDeserializer.registerCustomType(type, deserializer);
  }

  unregisterElementType(type: string): void {
    ElementDeserializer.unregisterCustomType(type);
  }

  /**
   * Subscribe to timeline mutation events.
   */
  on(event: TimelineEditorEvent, handler: (payload: unknown) => void): void {
    let set = this.eventListeners.get(event);
    if (!set) {
      set = new Set();
      this.eventListeners.set(event, set);
    }
    set.add(handler);
  }

  /**
   * Unsubscribe from timeline mutation events.
   */
  off(event: TimelineEditorEvent, handler: (payload: unknown) => void): void {
    this.eventListeners.get(event)?.delete(handler);
  }

  private emit(event: TimelineEditorEvent, payload: unknown): void {
    this.eventListeners.get(event)?.forEach((h) => h(payload));
  }

  getContext(): TimelineOperationContext {
    return this.context;
  }

  pauseVideo(): void {
    if (this.context?.setTimelineAction) {
      this.context.setTimelineAction(
        TIMELINE_ACTION.SET_PLAYER_STATE,
        PLAYER_STATE.PAUSED
      );
    }
  }

  getTimelineData(): TimelineTrackData | null {
    const contextId = this.context.contextId;
    return timelineContextStore.getTimelineData(contextId);
  }

  getLatestVersion(): number {
    const contextId = this.context.contextId;
    const timelineData = timelineContextStore.getTimelineData(contextId);
    return timelineData?.version || 0;
  }

  protected setTimelineData({
    tracks,
    version,
    watermark,
    backgroundColor,
    metadata,
    updatePlayerData,
    forceUpdate,
  }: {
    tracks: Track[];
    version?: number;
    updatePlayerData?: boolean;
    forceUpdate?: boolean;
    watermark?: Watermark;
    backgroundColor?: string;
    metadata?: ProjectMetadata;
  }) {
    const prevTimelineData = this.getTimelineData();
    const updatedVersion = version ?? (prevTimelineData?.version || 0) + 1;
    const resolvedBackgroundColor =
      backgroundColor !== undefined ? backgroundColor : prevTimelineData?.backgroundColor;
    const resolvedMetadata =
      metadata !== undefined ? metadata : prevTimelineData?.metadata;
    const updatedTimelineData = {
      tracks,
      version: updatedVersion,
      watermark,
      backgroundColor: resolvedBackgroundColor,
      metadata: resolvedMetadata,
    };
    timelineContextStore.setTimelineData(
      this.context.contextId,
      updatedTimelineData
    );
    this.updateHistory(updatedTimelineData);
    this.context.updateChangeLog();
    if (updatePlayerData) {
      // Send serialized tracks (TrackJSON[]) so live-player/visualizer get proper JSON with z-ordered elements
      const serializedTracks: TrackJSON[] = tracks.map((t) => t.serialize());
      this.context?.setTimelineAction?.(TIMELINE_ACTION.UPDATE_PLAYER_DATA, {
        tracks: serializedTracks,
        version: updatedVersion,
        forceUpdate: forceUpdate ?? false,
        watermark: watermark != null ? (watermark as any).toJSON?.() : undefined,
        backgroundColor: resolvedBackgroundColor,
        metadata: resolvedMetadata,
      });
    }
    return updatedTimelineData as TimelineTrackData;
  }

  addTrack(name: string, type: string = TRACK_TYPES.ELEMENT, insertAtIndex?: number): Track {
    const prevTimelineData = this.getTimelineData();
    const id = `t-${generateShortUuid()}`;
    const track = new Track(name, type, id);
    let updatedTimelines: Track[];
    if (insertAtIndex !== undefined) {
      const tracks = prevTimelineData?.tracks || [];
      const idx = Math.max(0, Math.min(insertAtIndex, tracks.length));
      updatedTimelines = [...tracks.slice(0, idx), track, ...tracks.slice(idx)];
    } else {
      updatedTimelines = [...(prevTimelineData?.tracks || []), track];
    }
    this.setTimelineData({ tracks: updatedTimelines, updatePlayerData: true });
    this.emit("track:added", { track: track.serialize(), index: insertAtIndex ?? updatedTimelines.length - 1 });
    return track;
  }

  getTrackById(id: string): Track | null {
    const prevTimelineData = this.getTimelineData();
    const track = prevTimelineData?.tracks.find((t) => t.getId() === id);
    return track as Track | null;
  }

  getTrackByName(name: string): Track | null {
    const prevTimelineData = this.getTimelineData();
    const track = prevTimelineData?.tracks.find((t) => t.getName() === name);
    return track as Track | null;
  }

  getCaptionsTrack(): Track | null {
    const prevTimelineData = this.getTimelineData();
    const track = prevTimelineData?.tracks.find((t) => t.getType() === TRACK_TYPES.CAPTION);
    return track as Track | null;
  }

  getTracksByType(type: string): Track[] {
    const prevTimelineData = this.getTimelineData();
    return (prevTimelineData?.tracks.filter((track) => track.getType() === type) ??
      []) as Track[];
  }

  getTracksByPredicate(predicate: (track: Track, index: number) => boolean): Track[] {
    const prevTimelineData = this.getTimelineData();
    return (prevTimelineData?.tracks.filter((track, index) => predicate(track, index)) ??
      []) as Track[];
  }

  updateTrackProps(
    trackId: string,
    propsPatch: Record<string, unknown>
  ): Track | null {
    const track = this.getTrackById(trackId);
    if (!track) {
      return null;
    }
    const currentProps = track.getProps() ?? {};
    track.setProps({
      ...currentProps,
      ...propsPatch,
    });
    this.refresh();
    return track;
  }

  replaceTrackProps(trackId: string, nextProps: Record<string, unknown>): Track | null {
    const track = this.getTrackById(trackId);
    if (!track) {
      return null;
    }
    track.setProps(nextProps);
    this.refresh();
    return track;
  }

  upsertTrack(input: TrackUpsertInput): Track {
    if (input.id) {
      const existing = this.getTrackById(input.id);
      if (existing) {
        if (input.name) {
          existing.setName(input.name);
        }
        if (input.type) {
          existing.setType(input.type);
        }
        if (input.language !== undefined) {
          existing.setLanguage(input.language);
        }
        if (input.props !== undefined) {
          existing.setProps(input.props);
        }
        this.refresh();
        return existing;
      }
    }

    const created = this.addTrack(input.name, input.type ?? TRACK_TYPES.ELEMENT);
    if (input.language !== undefined) {
      created.setLanguage(input.language);
    }
    if (input.props !== undefined) {
      created.setProps(input.props);
    }
    this.refresh();
    return created;
  }

  validateTrackOverlaps(trackId: string): {
    valid: boolean;
    issues: TrackOverlapIssue[];
  } {
    const track = this.getTrackById(trackId);
    if (!track) {
      return {
        valid: true,
        issues: [],
      };
    }
    const elements = [...track.getElements()].sort(
      (a, b) => a.getStart() - b.getStart()
    );
    const issues: TrackOverlapIssue[] = [];
    for (let index = 0; index < elements.length - 1; index += 1) {
      const current = elements[index];
      const next = elements[index + 1];
      if (current.getEnd() > next.getStart()) {
        issues.push({
          elementId: current.getId(),
          overlapsWithElementId: next.getId(),
          trackId,
        });
      }
    }
    return {
      valid: issues.length === 0,
      issues,
    };
  }

  removeTrackById(id: string): void {
    const tracks = this.getTimelineData()?.tracks || [];
    const updatedTracks = tracks.filter((t) => t.getId() !== id);
    this.setTimelineData({ tracks: updatedTracks, updatePlayerData: true });
    this.emit("track:removed", { trackId: id });
  }

  removeTrack(track: Track): void {
    const tracks = this.getTimelineData()?.tracks || [];
    const updatedTracks = tracks.filter((t) => t.getId() !== track.getId());
    this.setTimelineData({ tracks: updatedTracks, updatePlayerData: true });
    this.emit("track:removed", { trackId: track.getId() });
  }

  /**
   * Refresh the timeline data
   */
  refresh(): void {
    const currentData = this.getTimelineData();
    if (currentData) {
      this.setTimelineData({ tracks: currentData.tracks, updatePlayerData: true, forceUpdate: true });
    }
  }

  /**
   * Add an element to a specific track using the visitor pattern.
   * @param track The track to add the element to.
   * @param element The element to add.
   * @returns A promise that resolves to `true` if the element was added successfully, otherwise `false`.
   */
  async addElementToTrack(
    track: Track,
    element: TrackElement
  ): Promise<boolean> {
    if (!track) {
      throw new Error("TRACK_NOT_FOUND");
    }
    try {
      // Find the main video track's end time to clamp overlay elements
      let maxDuration: number | undefined;
      if (track.getType() !== TRACK_TYPES.VIDEO) {
        const videoTracks = this.getTracksByType(TRACK_TYPES.VIDEO);
        if (videoTracks.length > 0) {
          const videoElements = videoTracks[0].getElements();
          if (videoElements.length > 0) {
            maxDuration = Math.max(...videoElements.map(el => el.getEnd()));
          }
        }
      }

      // Use the visitor pattern to handle different element types
      const elementAdder = new ElementAdder(track, false, maxDuration);
      const result = await element.accept(elementAdder);

      if (result) {
        // Update the timeline data to reflect the change
        const currentData = this.getTimelineData();
        if (currentData) {
          this.setTimelineData({tracks: currentData.tracks, updatePlayerData: true});
        }
        this.emit("element:added", { element, trackId: track.getId() });
        return true;
      } else {
        return false;
      }
    } catch (error) {
      if(error instanceof ValidationError && error.errors?.length > 0) {
        throw error;
      } else {
        throw new Error("ELEMENT_NOT_ADDED");
      }
    }
  }

  /**
   * Remove an element from a specific track using the visitor pattern.
   * @param element The element to remove.
   * @returns `true` if the element was removed successfully, otherwise `false`.
   */
  removeElement(element: TrackElement): boolean {
    const track = this.getTrackById(element.getTrackId());
    if (!track) {
      return false;
    }

    try {
      // Use the visitor pattern to handle different element types
      const elementRemover = new ElementRemover(track);
      const result = element.accept(elementRemover);

      if (result) {
        // Update the timeline data to reflect the change
        const currentData = this.getTimelineData();
        if (currentData) {
          this.setTimelineData({tracks: currentData.tracks, updatePlayerData: true});
        }
        this.emit("element:removed", { elementId: element.getId(), trackId: element.getTrackId() });
      }

      return result;
    } catch (error) {
      return false;
    }
  }

  /**
   * Remove an element and shift later elements on the SAME TRACK to close the gap.
   * When a VIDEO element is removed, also removes/trims/shifts caption track elements
   * that overlap the gap. Non-video deletions (B-roll, text, images) only affect same track
   * to prevent subtitle overlap.
   */
  rippleRemoveElement(element: TrackElement): boolean {
    const gapStart = element.getStart();
    const gapEnd = gapStart + element.getDuration();
    const gapDuration = element.getDuration();
    const elementId = element.getId();
    const elementTrackId = element.getTrackId();
    const elementTrack = this.getTrackById(elementTrackId);
    if (!elementTrack) return false;
    const isVideoTrack = elementTrack.getType() === TRACK_TYPES.VIDEO;
    // Captions are time-pinned to the audio — deleting ONE caption must NOT ripple-shift the
    // other captions (bug: deleting a subtitle slid every later subtitle out of sync). A direct
    // caption delete is a caption-on-caption-track removal; the video-removal caption cascade
    // (gated on isVideoTrack below) is a different path and stays unaffected.
    const isCaptionElementDelete = elementTrack.getType() === TRACK_TYPES.CAPTION;

    // Remove WITHOUT snapshotting (friend mutation) — the single trailing setTimelineData below
    // is the SOLE undo snapshot for the whole ripple. Previously this.removeElement (here AND in
    // the per-caption loop) each snapshotted, so one delete became K+2 history entries and Cmd+Z
    // landed on an intermediate, never-seen state ("undo cuts random things").
    elementTrack.createFriend().removeElement(element);
    if (gapDuration <= 0) {
      const committed = this.getTimelineData();
      if (committed) this.setTimelineData({ tracks: committed.tracks, updatePlayerData: true, forceUpdate: true });
      return true;
    }

    const currentData = this.getTimelineData();
    if (currentData) {
      for (const track of currentData.tracks) {
        const isSameTrack = track.getId() === elementTrackId;
        const isCaptionTrack = track.getType() === TRACK_TYPES.CAPTION;
        // Process same track always; also process caption tracks when a video element is removed
        if (!isSameTrack && !(isVideoTrack && isCaptionTrack)) continue;

        const elementsToRemove: TrackElement[] = [];
        for (const el of track.getElements()) {
          if (el.getId() === elementId) continue;
          const elStart = el.getStart();
          const elEnd = el.getEnd();

          // Caption OVERLAPPING the removed region — word-level cut: DROP the words whose
          // timestamps fall inside [gapStart, gapEnd], keep words before it unchanged, shift words
          // after it left; remove the caption only if NO word survives. Replaces the four old
          // trim/remove branches that called adjustCaptionWordsForTimeChange, which squeezed EVERY
          // word into the smaller window (losing/mangling the real words when a mistimed caption
          // straddled a cut — e.g. cutting dead-space at the start). Captions entirely BEFORE the
          // cut fall through unchanged; entirely AFTER, they shift below (the existing path) — both
          // left exactly as they were.
          if (isCaptionTrack && isVideoTrack && elStart < gapEnd && elEnd > gapStart) {
            const { survived } = this.applyCutToCaption(el, gapStart, gapEnd);
            if (!survived) elementsToRemove.push(el);
            continue;
          }
          // Element starts after the gap — shift left to close it. Skip for a caption-on-caption
          // delete: captions stay pinned to the audio (leave a gap, like overlay tracks already do).
          if (elStart >= gapEnd && !isCaptionElementDelete) {
            const prevStart = el.getStart();
            const prevEnd = el.getEnd();
            el.setStart(prevStart - gapDuration);
            el.setEnd(prevEnd - gapDuration);
            this.adjustCaptionWordsForTimeChange(el, prevStart, prevEnd);
          }
        }
        // Remove captions fully inside the gap — friend mutation, no per-element snapshot (the
        // single trailing setTimelineData is the sole undo entry; see the top of this method).
        const trackFriend = track.createFriend();
        for (const el of elementsToRemove) {
          trackFriend.removeElement(el);
        }
      }
      this.setTimelineData({ tracks: currentData.tracks, updatePlayerData: true, forceUpdate: true });
    }

    return true;
  }

  /**
   * Update an element in a specific track using the visitor pattern.
   * @param element The updated element.
   * @returns The updated `TrackElement`.
   */
  updateElement(element: TrackElement): TrackElement {
    const track = this.getTrackById(element.getTrackId());
    if (!track) {
      return element;
    }

    try {
      // Use the visitor pattern to handle different element types
      const elementUpdater = new ElementUpdater(track);
      const result = element.accept(elementUpdater);

      if (result) {
        // Update the timeline data to reflect the change (e.g. zIndex) so player/visualizer get new order
        const currentData = this.getTimelineData();
        if (currentData) {
          this.setTimelineData({ tracks: currentData.tracks, updatePlayerData: true });
        }
        this.emit("element:updated", { element });
      }

      return element;
    } catch (error) {
      return element;
    }
  }

  /**
   * Split an element at a specific time point using the visitor pattern
   * @param element The element to split
   * @param splitTime The time point to split at
   * @returns SplitResult with first element, second element, and success status
   */
  async splitElement(
    element: TrackElement,
    splitTime: number
  ): Promise<SplitResult> {
    const track = this.getTrackById(element.getTrackId());
    if (!track) {
      return { firstElement: element, secondElement: null, success: false };
    }
    const result = await this.splitElementNoCommit(element, track, splitTime);
    if (result.success) {
      // Single trailing commit = the sole undo snapshot for this split.
      const currentData = this.getTimelineData();
      if (currentData) {
        this.setTimelineData({ tracks: currentData.tracks, updatePlayerData: true });
      }
    }
    return result;
  }

  /**
   * Split a VIDEO element AND cascade the split to every caption spanning the cut point, as ONE
   * atomic undo step. Previously the caller looped `editor.splitElement(cap, …)` per caption and each
   * call snapshotted history, so a cut over N captions became N+1 undo entries and a single Cmd+Z
   * only reversed the last caption split (the video stayed cut — the exact class the cut-core work
   * fixed). This mirrors rippleRemoveElement: every split is a NO-COMMIT mutation, and one trailing
   * setTimelineData is the sole snapshot for the whole cut.
   */
  async splitElementWithCaptionCascade(
    element: TrackElement,
    splitTime: number
  ): Promise<SplitResult> {
    const track = this.getTrackById(element.getTrackId());
    if (!track) {
      return { firstElement: element, secondElement: null, success: false };
    }
    const primary = await this.splitElementNoCommit(element, track, splitTime);
    if (!primary.success) {
      // Nothing was committed (no setTimelineData), so there is no half-done state to undo.
      return primary;
    }

    // Cascade to captions only when the MAIN VIDEO element was split (captions ride the video
    // timeline). Gate on BOTH the track type AND the element type — this matches the pre-refactor
    // `element.getType()==='video'` check exactly, so an image parked on a video-typed track can
    // never trigger the caption cascade.
    if (
      track.getType() === TRACK_TYPES.VIDEO &&
      element.getType().toLowerCase() === "video"
    ) {
      const currentData = this.getTimelineData();
      if (currentData) {
        for (const trk of currentData.tracks) {
          if (trk.getType() !== TRACK_TYPES.CAPTION) continue;
          for (const cap of [...trk.getElements()]) {
            // Strict bounds: only captions that genuinely span the cut (not touching an edge).
            if (cap.getStart() < splitTime && cap.getEnd() > splitTime) {
              await this.splitElementNoCommit(cap, trk, splitTime);
            }
          }
        }
      }
    }

    // ONE trailing commit for the video split + all caption splits = a single undo entry.
    const committed = this.getTimelineData();
    if (committed) {
      this.setTimelineData({ tracks: committed.tracks, updatePlayerData: true });
    }
    return primary;
  }

  /**
   * Split a single element on its track WITHOUT committing (no setTimelineData / no history snapshot).
   * The caller MUST issue exactly one trailing setTimelineData so a multi-element operation (e.g. a
   * video cut cascading to its captions) collapses to a single undo entry. Atomic per element: if a
   * half fails to add, the original is restored (no data loss / green-thumbnail partial state).
   */
  private async splitElementNoCommit(
    element: TrackElement,
    track: Track,
    splitTime: number
  ): Promise<SplitResult> {
    try {
      // Use the visitor pattern to handle different element types
      const elementSplitter = new ElementSplitter(splitTime);
      const result = element.accept(elementSplitter);

      if (result.success) {
        const elementRemover = new ElementRemover(track);
        // Remove the original element from the track
        element.accept(elementRemover);

        // Add the split halves — MUST await since the adder is async. skipMetaUpdate=true because
        // the halves already carry full metadata from the cloner. ATOMIC: if a half fails to add,
        // roll back (remove any landed half, restore the original) instead of leaving the track
        // with the original GONE — that partial state was the data-loss / green-thumbnail bug.
        try {
          const elementAdder = new ElementAdder(track, true);
          await result.firstElement.accept(elementAdder);
          await result.secondElement.accept(elementAdder);
        } catch (addError) {
          const rollbackRemover = new ElementRemover(track);
          try { result.firstElement.accept(rollbackRemover); } catch {}
          try { result.secondElement.accept(rollbackRemover); } catch {}
          try {
            await element.accept(new ElementAdder(track, true));
          } catch (restoreError) {
            console.error("[Timeline] splitElement rollback could not restore the original element:", restoreError);
          }
          return { firstElement: element, secondElement: null, success: false };
        }
      }
      return result;
    } catch (error) {
      return { firstElement: element, secondElement: null, success: false };
    }
  }

  /**
   * Clone an element using the visitor pattern
   * @param element The element to clone
   * @returns TrackElement | null - the cloned element or null if cloning failed
   */
  cloneElement(element: TrackElement): TrackElement | null {
    try {
      const elementCloner = new ElementCloner();
      return element.accept(elementCloner);
    } catch (error) {
      return null;
    }
  }

  reorderTracks(tracks: Track[]): void {
    this.setTimelineData({tracks, updatePlayerData: true});
    this.emit("track:reordered", { tracks: tracks.map((t) => t.serialize()) });
  }

  /**
   * Move an element to a new track inserted at the given index (OpenVideo-style separator drop).
   * Removes the element from its current track, creates a new track at targetTrackIndex,
   * sets element start/end, and adds the element to the new track.
   */
  async moveElementToNewTrackAt(
    element: TrackElement,
    targetTrackIndex: number,
    startSec: number
  ): Promise<boolean> {
    const removed = this.removeElement(element);
    if (!removed) return false;

    const currentData = this.getTimelineData();
    const currentTracks = currentData?.tracks ?? [];
    const elType = element.getType().toLowerCase();
    let trackType: string = TRACK_TYPES.ELEMENT;
    if (elType === "video" || elType === "image") trackType = TRACK_TYPES.VIDEO;
    else if (elType === "audio") trackType = TRACK_TYPES.AUDIO;
    else if (elType === "caption" || elType === "text") trackType = TRACK_TYPES.ELEMENT;

    const newTrack = new Track(
      `${trackType.charAt(0).toUpperCase() + trackType.slice(1)} Track`,
      trackType
    );

    const prevStart = element.getStart();
    const prevEnd = element.getEnd();
    const duration = prevEnd - prevStart;
    element.setStart(startSec);
    element.setEnd(startSec + duration);

    this.adjustCaptionWordsForTimeChange(element, prevStart, prevEnd);

    const elementAdder = new ElementAdder(newTrack);
    await element.accept(elementAdder);

    const insertIndex = Math.max(0, Math.min(targetTrackIndex, currentTracks.length));
    const newTracks = [
      ...currentTracks.slice(0, insertIndex),
      newTrack,
      ...currentTracks.slice(insertIndex),
    ];

    this.setTimelineData({ tracks: newTracks, updatePlayerData: true });
    this.emit("element:added", { element, trackId: newTrack.getId() });
    this.emit("element:updated", { element });
    return true;
  }

  updateHistory(timelineTrackData: TimelineTrackData): void {
    const tracks = timelineTrackData.tracks.map((t) => t.serialize());
    this.totalDuration = getTotalDuration(tracks);
    this.context.setTotalDuration(this.totalDuration);
    const version = timelineTrackData.version;
    this.context.setPresent({
      tracks,
      version,
      ...(timelineTrackData.backgroundColor !== undefined && {
        backgroundColor: timelineTrackData.backgroundColor,
      }),
      ...(timelineTrackData.metadata !== undefined && {
        metadata: timelineTrackData.metadata,
      }),
    });
  }

  /**
   * Trigger undo operation and update timeline data
   */
  undo(): void {
    const result = this.context.handleUndo();
    if (result && result.tracks) {
      // Update the timeline data in the editor's store
      const tracks = result.tracks.map((t: TrackJSON) => Track.fromJSON(t));
      timelineContextStore.setTimelineData(this.context.contextId, {
        tracks,
        version: result.version,
        ...(result.backgroundColor !== undefined && {
          backgroundColor: result.backgroundColor,
        }),
        ...(result.metadata !== undefined && {
          metadata: result.metadata,
        }),
      });

      // Update total duration
      this.totalDuration = getTotalDuration(result.tracks);
      this.context.setTotalDuration(this.totalDuration);
      this.context.updateChangeLog();

      // Trigger timeline action to notify components
      if (this.context?.setTimelineAction) {
        this.context.setTimelineAction(TIMELINE_ACTION.UPDATE_PLAYER_DATA, {
          tracks: result.tracks,
          version: result.version,
          ...(result.backgroundColor !== undefined && {
            backgroundColor: result.backgroundColor,
          }),
          ...(result.metadata !== undefined && {
            metadata: result.metadata,
          }),
        });
      }
    }
  }

  /**
   * Trigger redo operation and update timeline data
   */
  redo(): void {
    const result = this.context.handleRedo();
    if (result && result.tracks) {
      // Update the timeline data in the editor's store
      const tracks = result.tracks.map((t: TrackJSON) => Track.fromJSON(t));
      timelineContextStore.setTimelineData(this.context.contextId, {
        tracks,
        version: result.version,
        ...(result.backgroundColor !== undefined && {
          backgroundColor: result.backgroundColor,
        }),
        ...(result.metadata !== undefined && {
          metadata: result.metadata,
        }),
      });

      // Update total duration
      this.totalDuration = getTotalDuration(result.tracks);
      this.context.setTotalDuration(this.totalDuration);
      this.context.updateChangeLog();

      // Trigger timeline action to notify components
      if (this.context?.setTimelineAction) {
        this.context.setTimelineAction(TIMELINE_ACTION.UPDATE_PLAYER_DATA, {
          tracks: result.tracks,
          version: result.version,
          ...(result.backgroundColor !== undefined && {
            backgroundColor: result.backgroundColor,
          }),
          ...(result.metadata !== undefined && {
            metadata: result.metadata,
          }),
        });
      }
    }
  }

  /**
   * Reset history and clear timeline data
   */
  resetHistory(): void {
    this.context.handleResetHistory();

    // Clear the timeline data in the editor's store
    timelineContextStore.setTimelineData(this.context.contextId, {
      tracks: [],
      version: 0,
      metadata: undefined,
    });

    // Reset total duration and version
    this.context.setTotalDuration(0);
    this.context.updateChangeLog();

    // Trigger timeline action to notify components
    if (this.context?.setTimelineAction) {
      this.context.setTimelineAction(TIMELINE_ACTION.UPDATE_PLAYER_DATA, {
        tracks: [],
        version: 0,
        metadata: undefined,
      });
    }
  }

  loadProject({
    tracks,
    version,
    backgroundColor,
    metadata,
  }: {
    tracks: TrackJSON[];
    version: number;
    backgroundColor?: string;
    metadata?: ProjectMetadata;
  }): void {
    const migratedProject = migrateProject(
      {
        tracks,
        version,
        backgroundColor,
        metadata,
      },
      CURRENT_PROJECT_VERSION
    );
    this.pauseVideo();
    this.context.handleResetHistory();
    // Convert Timeline[] to Track[] and set
    const timelineTracks = migratedProject.tracks.map((t) => Track.fromJSON(t));
    this.setTimelineData({
      tracks: timelineTracks,
      version: migratedProject.version,
      backgroundColor: migratedProject.backgroundColor,
      metadata: migratedProject.metadata,
      updatePlayerData: true,
    });
    if (this.context?.setTimelineAction) {
      this.context.setTimelineAction(TIMELINE_ACTION.UPDATE_PLAYER_DATA, {
        tracks: migratedProject.tracks,
        version: migratedProject.version,
        backgroundColor: migratedProject.backgroundColor,
        metadata: migratedProject.metadata,
        forceUpdate: true,
      });
    }
    this.emit("project:loaded", {
      tracks: migratedProject.tracks,
      version: migratedProject.version,
    });
  }

  loadProjectSnapshot({
    tracks,
    version,
    backgroundColor,
    metadata,
  }: {
    tracks: TrackJSON[];
    version: number;
    backgroundColor?: string;
    metadata?: ProjectMetadata;
  }): void {
    const migratedProject = migrateProject(
      {
        tracks,
        version,
        backgroundColor,
        metadata,
      },
      CURRENT_PROJECT_VERSION
    );
    const timelineTracks = migratedProject.tracks.map((track) => Track.fromJSON(track));
    this.setTimelineData({
      tracks: timelineTracks,
      version: migratedProject.version,
      backgroundColor: migratedProject.backgroundColor,
      metadata: migratedProject.metadata,
      updatePlayerData: true,
    });
    this.emit("project:loaded", {
      tracks: migratedProject.tracks,
      version: migratedProject.version,
    });
  }

  getWatermark(): Watermark | null {
    const currentData = this.getTimelineData();
    return currentData?.watermark || null;
  }

  setWatermark(watermark: Watermark): void {
    const currentData = this.getTimelineData();
    if (currentData) {
      this.setTimelineData({
        tracks: currentData.tracks,
        updatePlayerData: true,
        watermark: watermark,
      });
    }
  }

  removeWatermark(): void {
    const currentData = this.getTimelineData();
    if (currentData) {
      this.setTimelineData({
        tracks: currentData.tracks,
        updatePlayerData: true,
      });
    }
  }

  async getVideoAudio(): Promise<string> {
    const tracks = this.getTimelineData()?.tracks || [];
    const audioBlobUrl = await extractVideoAudio(tracks, this.totalDuration);
    return audioBlobUrl;
  }

  /**
   * Add transition metadata from one element to the next (e.g. crossfade).
   * Sets optional transition on the "from" element; visualizer can interpret it when implemented.
   */
  addTransition(
    fromElementId: string,
    toElementId: string,
    kind: string,
    duration: number
  ): boolean {
    const fromElement = this.findElementById(fromElementId);
    if (!fromElement) return false;
    const transition: ElementTransitionJSON = {
      toElementId,
      duration,
      kind,
    };
    fromElement.setTransition(transition);
    this.updateElement(fromElement);
    return true;
  }

  /**
   * Remove transition metadata from an element.
   */
  removeTransition(elementId: string): boolean {
    const element = this.findElementById(elementId);
    if (!element) return false;
    element.setTransition(undefined);
    this.updateElement(element);
    return true;
  }

  private findElementById(elementId: string): TrackElement | null {
    const tracks = this.getTimelineData()?.tracks ?? [];
    for (const track of tracks) {
      const el = track.getElementById(elementId);
      if (el) return el as TrackElement;
    }
    return null;
  }

  /**
   * Get the current project as ProjectJSON (same shape consumed by visualizer).
   */
  getProject(): ProjectJSON {
    const data = this.getTimelineData();
    if (!data) {
      return { tracks: [], version: 0 };
    }
    return {
      tracks: data.tracks.map((t) => t.serialize()),
      version: data.version,
      watermark:
        data.watermark != null
          ? (data.watermark as any).toJSON?.()
          : undefined,
      ...(data.backgroundColor !== undefined && {
        backgroundColor: data.backgroundColor,
      }),
      ...(data.metadata !== undefined && {
        metadata: data.metadata,
      }),
    };
  }

  getBackgroundColor(): string | undefined {
    return this.getTimelineData()?.backgroundColor;
  }

  setBackgroundColor(backgroundColor: string): void {
    const currentData = this.getTimelineData();
    if (currentData) {
      this.setTimelineData({
        tracks: currentData.tracks,
        backgroundColor,
        metadata: currentData.metadata,
        updatePlayerData: true,
      });
    }
  }

  getMetadata(): ProjectMetadata | undefined {
    return this.getTimelineData()?.metadata;
  }

  setMetadata(metadata: ProjectMetadata): void {
    const currentData = this.getTimelineData();
    if (currentData) {
      this.setTimelineData({
        tracks: currentData.tracks,
        backgroundColor: currentData.backgroundColor,
        metadata,
        updatePlayerData: true,
      });
    }
  }

  /**
   * Ripple delete: remove content in [fromTime, toTime] and shift later content left.
   * Single undo step.
   */
  async rippleDelete(fromTime: number, toTime: number): Promise<void> {
    if (fromTime >= toTime) return;
    const durationToRemove = toTime - fromTime;
    const currentTracks = this.getTimelineData()?.tracks ?? [];
    const newTracks: Track[] = [];

    for (const track of currentTracks) {
      const newTrack = Track.fromJSON(track.serialize());
      const friend = newTrack.createFriend();
      const elementsCopy = newTrack.getElements();

      for (const element of elementsCopy) {
        const start = element.getStart();
        const end = element.getEnd();

        if (end <= fromTime) {
          continue;
        }
        if (start >= toTime) {
          element.setStart(start - durationToRemove);
          element.setEnd(end - durationToRemove);
          this.adjustCaptionWordsForTimeChange(element, start, end);
          continue;
        }
        if (start >= fromTime && end <= toTime) {
          friend.removeElement(element);
          continue;
        }
        if (start < fromTime && end > toTime) {
          const splitter = new ElementSplitter(fromTime);
          const result = element.accept(splitter);
          friend.removeElement(element);
          if (result.success && result.firstElement && result.secondElement) {
            const secondPrevStart = result.secondElement.getStart();
            const secondPrevEnd = result.secondElement.getEnd();
            result.secondElement.setEnd(fromTime + (end - toTime));
            this.adjustCaptionWordsForTimeChange(result.secondElement, secondPrevStart, secondPrevEnd);
            friend.addElement(result.firstElement, true);
            friend.addElement(result.secondElement, true);
          }
          continue;
        }
        if (start < fromTime && end <= toTime) {
          const prevEnd = end;
          element.setEnd(fromTime);
          this.adjustCaptionWordsForTimeChange(element, start, prevEnd);
          continue;
        }
        if (start >= fromTime && end > toTime) {
          element.setStart(fromTime);
          element.setEnd(fromTime + (end - toTime));
          this.adjustCaptionWordsForTimeChange(element, start, end);
        }
      }
      newTracks.push(newTrack);
    }

    this.setTimelineData({ tracks: newTracks, updatePlayerData: true });
  }

  /**
   * Trim an element to new start and end times. Validates bounds and updates via updateElement.
   */
  trimElement(
    element: TrackElement,
    newStart: number,
    newEnd: number
  ): boolean {
    if (newStart >= newEnd) return false;
    const start = element.getStart();
    const end = element.getEnd();
    if (newStart < start || newEnd > end) return false;
    element.setStart(newStart);
    element.setEnd(newEnd);
    this.updateElement(element);
    return true;
  }

  /**
   * Apply multiple element updates in one batch; single setTimelineData and undo step.
   */
  updateElements(
    updates: Array<{ elementId: string; updates: Partial<ElementJSON> }>
  ): void {
    const currentData = this.getTimelineData();
    if (!currentData) return;
    const tracks = currentData.tracks;
    let changed = false;

    for (const { elementId, updates: patch } of updates) {
      for (const track of tracks) {
        const element = track.getElementById(elementId) as
          | TrackElement
          | undefined;
        if (!element) continue;

        const prevStart = element.getStart();
        const prevEnd = element.getEnd();

        if (patch.s !== undefined) element.setStart(patch.s);
        if (patch.e !== undefined) element.setEnd(patch.e);
        if (patch.props != null) element.setProps(patch.props);
        if (patch.t != null) (element as any).setText?.(patch.t);
        if (patch.position != null) element.setPosition(patch.position);
        if (patch.rotation != null) element.setRotation(patch.rotation);
        if (patch.opacity != null) element.setOpacity(patch.opacity);

        this.adjustCaptionWordsForTimeChange(element, prevStart, prevEnd);

        Object.keys(patch).forEach((key) => {
          if (
            !["id", "type", "s", "e", "t", "position", "rotation", "opacity", "props"].includes(key) &&
            (patch as Record<string, unknown>)[key] !== undefined
          ) {
            (element as any)[key] = (patch as Record<string, unknown>)[key];
          }
        });
        try {
          const updater = new ElementUpdater(track);
          element.accept(updater);
          changed = true;
        } catch (validationError) {
          // Revert to previous position if validation fails
          element.setStart(prevStart);
          element.setEnd(prevEnd);
          console.warn('[Timeline] Element update rejected:', (validationError as Error).message);
        }
        break;
      }
    }
    if (changed) {
      this.setTimelineData({ tracks, updatePlayerData: true });
    }
  }

  /**
   * For caption elements with existing wordsMs arrays, keep word timings aligned
   * when their time range changes. If the wordsMs length matches the word count,
   * shift/scale existing timings into the new [s, e] interval. If the length no
   * longer matches, regenerate wordsMs using a letter-weighted distribution.
   */
  public adjustCaptionWordsForTimeChange(
    element: TrackElement,
    prevStart: number,
    prevEnd: number
  ): void {
    if (element.getType().toLowerCase() !== "caption") return;

    const props = element.getProps() ?? {};
    const metadata = element.getMetadata() ?? {};

    const propsWords = (props as Record<string, unknown>).wordsMs;
    const metaWords = (metadata as Record<string, unknown>).wordsMs;

    const hasPropsWords = Array.isArray(propsWords);
    const hasMetaWords = Array.isArray(metaWords);

    const text = (element as any).getText?.() ?? "";
    const words = String(text)
      .split(" ")
      .map((w) => w.trim())
      .filter((w) => w.length > 0);
    if (!words.length || (!hasPropsWords && !hasMetaWords)) return;

    const existingLength = hasPropsWords
      ? (propsWords as unknown[]).length
      : hasMetaWords
      ? (metaWords as unknown[]).length
      : 0;

    const startSec = element.getStart();
    const endSec = element.getEnd();
    if (!(endSec > startSec)) return;

    const prevDuration = prevEnd - prevStart;
    const nextDuration = endSec - startSec;

    // Case 1: lengths match and durations are valid → shift/scale existing timings.
    if (existingLength === words.length && prevDuration > 0 && nextDuration > 0) {
      const adjustWords = (wordsArr: unknown): number[] | null => {
        if (!Array.isArray(wordsArr) || wordsArr.length === 0) return null;
        const prevDurationMs = prevDuration * 1000;
        const nextDurationMs = nextDuration * 1000;
        const startMsPrev = prevStart * 1000;
        const startMsNext = startSec * 1000;

        if (Math.abs(prevDuration - nextDuration) < 1e-6) {
          const deltaMs = startMsNext - startMsPrev;
          return (wordsArr as number[]).map((w) => w + deltaMs);
        }

        return (wordsArr as number[]).map((w) => {
          const rel = prevDurationMs ? (w - startMsPrev) / prevDurationMs : 0;
          const clampedRel = Math.max(0, Math.min(1, rel));
          return startMsNext + clampedRel * nextDurationMs;
        });
      };

      const nextPropsWords = adjustWords(propsWords);
      const nextMetaWords = adjustWords(metaWords);

      if (nextPropsWords) {
        (props as Record<string, unknown>).wordsMs = nextPropsWords;
        element.setProps(props);
      }
      if (nextMetaWords) {
        (metadata as Record<string, unknown>).wordsMs = nextMetaWords;
        element.setMetadata(metadata);
      }
      return;
    }

    // Case 2: we have wordsMs but the length no longer matches word count →
    // regenerate it using letter-weighted distribution across the clip.
    const totalDurationMs = (endSec - startSec) * 1000;
    const baseMs = startSec * 1000;

    const letterCounts = words.map((w) => w.replace(/\s+/g, "").length || 1);
    const totalLetters = letterCounts.reduce((sum, n) => sum + n, 0);
    if (totalLetters <= 0) return;

    let accumulatedLetters = 0;
    const newWordsMs = letterCounts.map((count) => {
      const t = baseMs + (accumulatedLetters / totalLetters) * totalDurationMs;
      accumulatedLetters += count;
      return t;
    });

    if (hasPropsWords) {
      (props as Record<string, unknown>).wordsMs = newWordsMs;
      element.setProps(props);
    }
    if (hasMetaWords) {
      (metadata as Record<string, unknown>).wordsMs = newWordsMs;
      element.setMetadata(metadata);
    }
  }

  /**
   * Cut the time region [gapStart, gapEnd] (seconds) out of a caption at the WORD level: DROP the
   * words whose timestamps fall inside the cut, keep words before it unchanged, and shift words
   * after it left by the removed duration; then set the caption's new bounds. Returns
   * { survived:false } (the caller removes the element) when NO word survives the cut.
   *
   * Unlike adjustCaptionWordsForTimeChange — which shifts/scales ALL words into the new window —
   * this drops the in-cut words, so cutting dead-space near a mistimed caption keeps the real words
   * instead of squeezing/losing the whole group. Also correctly handles captions entirely before
   * the cut (unchanged) and entirely after it (shifted), so one call covers every case.
   */
  private applyCutToCaption(
    element: TrackElement,
    gapStart: number,
    gapEnd: number
  ): { survived: boolean } {
    if (element.getType().toLowerCase() !== "caption") return { survived: true };
    const gapDuration = gapEnd - gapStart;
    if (!(gapDuration > 0)) return { survived: true };

    const origStart = element.getStart();
    const origEnd = element.getEnd();
    // New bounds: remove [gapStart, gapEnd], pulling content after the gap left.
    const cutBound = (t: number): number =>
      t <= gapStart ? t : t >= gapEnd ? t - gapDuration : gapStart;
    let newStart = cutBound(origStart);
    let newEnd = cutBound(origEnd);
    if (newEnd < newStart + 0.01) newEnd = newStart + 0.01; // editor min-duration

    const props = element.getProps() ?? {};
    const metadata = element.getMetadata() ?? {};
    const propsWords = (props as Record<string, unknown>).wordsMs;
    const metaWords = (metadata as Record<string, unknown>).wordsMs;
    const hasPropsWords = Array.isArray(propsWords) && (propsWords as unknown[]).length > 0;
    const hasMetaWords = Array.isArray(metaWords) && (metaWords as unknown[]).length > 0;

    const text = (element as any).getText?.() ?? "";
    const tokens = String(text)
      .split(" ")
      .map((w) => w.trim())
      .filter((w) => w.length > 0);
    const refWords = (hasPropsWords ? propsWords : hasMetaWords ? metaWords : null) as
      | number[]
      | null;

    // No per-word timing, or a length we can't safely map → fall back to the length-preserving
    // bounds adjust (today's behavior; never worse, and it can't lose specific words).
    if (!refWords || refWords.length !== tokens.length) {
      element.setStart(newStart);
      element.setEnd(newEnd);
      this.adjustCaptionWordsForTimeChange(element, origStart, origEnd);
      return { survived: true };
    }

    // Detect seconds-vs-ms like the compositor (legacy projects can store seconds). Compare in ms;
    // write back in the array's stored unit so a saved project is never double-converted.
    const maxVal = Math.max(...refWords);
    const isSeconds = maxVal > 0 && maxVal < origEnd * 2;
    const toMs = (v: number) => (isSeconds ? v * 1000 : v);
    const fromMs = (v: number) => (isSeconds ? v / 1000 : v);
    const gapStartMs = gapStart * 1000;
    const gapEndMs = gapEnd * 1000;
    const gapDurMs = gapDuration * 1000;

    // Survivors = words OUTSIDE [gapStart, gapEnd). props and metadata carry the same per-word
    // timings, so the same surviving indices apply to both.
    const keepIdx: number[] = [];
    for (let i = 0; i < refWords.length; i++) {
      const wMs = toMs(refWords[i]);
      if (wMs < gapStartMs || wMs >= gapEndMs) keepIdx.push(i);
    }
    if (keepIdx.length === 0) return { survived: false };

    const transform = (arr: number[]): number[] =>
      keepIdx.map((i) => {
        const wMs = toMs(arr[i]);
        return wMs < gapStartMs ? arr[i] : fromMs(wMs - gapDurMs);
      });

    (element as any).setText?.(keepIdx.map((i) => tokens[i]).join(" "));
    if (hasPropsWords) {
      (props as Record<string, unknown>).wordsMs = transform(propsWords as number[]);
      element.setProps(props);
    }
    if (hasMetaWords) {
      (metadata as Record<string, unknown>).wordsMs = transform(metaWords as number[]);
      element.setMetadata(metadata);
    }
    element.setStart(newStart);
    element.setEnd(newEnd);
    return { survived: true };
  }

  /**
   * Remove multiple elements by id in one batch; single setTimelineData and undo step.
   */
  removeElements(elementIds: string[]): void {
    const currentData = this.getTimelineData();
    if (!currentData) return;
    const tracks = currentData.tracks;
    const idsSet = new Set(elementIds);
    let changed = false;

    for (const track of tracks) {
      const elements = track.getElements();
      for (const el of elements) {
        if (idsSet.has(el.getId())) {
          const remover = new ElementRemover(track);
          el.accept(remover);
          changed = true;
        }
      }
    }
    if (changed) {
      this.setTimelineData({ tracks, updatePlayerData: true });
      this.emit("elements:removed", { elementIds });
    }
  }

  /**
   * Replace all elements with the given src (e.g. placeholder or same URL) with a new element definition.
   * Preserves id, s, e, and track for each replaced element. Single setTimelineData at end.
   */
  replaceElementsBySource(
    src: string,
    newElementJson: ElementJSON
  ): number {
    const currentData = this.getTimelineData();
    if (!currentData) return 0;
    const tracks = currentData.tracks;
    let replacedCount = 0;

    for (const track of tracks) {
      const elements = track.getElements();
      for (const element of elements) {
        const elementSrc =
          (element.getProps()?.src as string) ?? (element as any).getSrc?.();
        if (elementSrc !== src) continue;

        const newElement = ElementDeserializer.fromJSON(newElementJson);
        if (!newElement) continue;

        newElement.setId(element.getId());
        newElement.setStart(element.getStart());
        newElement.setEnd(element.getEnd());
        newElement.setTrackId(track.getId());

        const friend = track.createFriend();
        friend.removeElement(element);
        friend.addElement(newElement, true);
        replacedCount++;
      }
    }
    if (replacedCount > 0) {
      this.setTimelineData({ tracks, updatePlayerData: true });
    }
    return replacedCount;
  }

  /**
   * Center an element in the scene by setting its position to the center of scene dimensions.
   */
  centerElementInScene(
    elementId: string,
    sceneWidth: number,
    sceneHeight: number
  ): boolean {
    const element = this.findElementById(elementId);
    if (!element) return false;
    const props = element.getProps() ?? {};
    const w = props.width ?? (element as any).getFrame?.()?.size?.[0] ?? 0;
    const h = props.height ?? (element as any).getFrame?.()?.size?.[1] ?? 0;
    const x = sceneWidth / 2 - w / 2;
    const y = sceneHeight / 2 - h / 2;
    element.setPosition({ x, y });
    this.updateElement(element);
    return true;
  }

  /**
   * Scale an element to fit within scene dimensions while preserving aspect ratio.
   * Updates width/height in props or frame when present.
   */
  scaleElementToFit(
    elementId: string,
    sceneWidth: number,
    sceneHeight: number
  ): boolean {
    const element = this.findElementById(elementId);
    if (!element) return false;
    const props = element.getProps() ?? {};
    const frame = (element as any).getFrame?.();
    const w = props.width ?? frame?.size?.[0] ?? sceneWidth;
    const h = props.height ?? frame?.size?.[1] ?? sceneHeight;
    if (w <= 0 || h <= 0) return false;
    const scale = Math.min(sceneWidth / w, sceneHeight / h);
    const newW = w * scale;
    const newH = h * scale;
    if (frame && Array.isArray(frame.size)) {
      (element as any).setFrame?.({ ...frame, size: [newW, newH] });
    } else {
      element.setProps({ ...props, width: newW, height: newH });
    }
    const x = sceneWidth / 2 - newW / 2;
    const y = sceneHeight / 2 - newH / 2;
    element.setPosition({ x, y });
    this.updateElement(element);
    return true;
  }

  /**
   * Duplicate multiple elements by id; adds clones to the same track. Single setTimelineData at end.
   */
  async duplicateElements(elementIds: string[]): Promise<TrackElement[]> {
    const currentData = this.getTimelineData();
    if (!currentData) return [];
    const tracks = currentData.tracks;
    const added: TrackElement[] = [];
    const elementCloner = new ElementCloner();

    for (const elementId of elementIds) {
      for (const track of tracks) {
        const element = track.getElementById(elementId) as
          | TrackElement
          | undefined;
        if (!element) continue;
        const clone = element.accept(elementCloner);
        if (clone) {
          clone.setId(`e-${generateShortUuid()}`);
          const adder = new ElementAdder(track);
          const result = await clone.accept(adder);
          if (result) added.push(clone);
        }
        break;
      }
    }
    if (added.length > 0) {
      this.setTimelineData({ tracks, updatePlayerData: true });
    }
    return added;
  }
}
