import { useLivePlayerContext } from "@twick/live-player";
import { canDropElementOnTrack, isMainVideoTrack } from "../helpers/editor.utils";
import {
  TrackElement,
  Track,
  ProjectMetadata,
  useTimelineContext,
  VideoElement,
  AudioElement,
  resolveIds,
  TRACK_TYPES,
} from "@twick/timeline";
import { useMemo } from "react";
import { DRAG_TYPE } from "../helpers/constants";
import type { DropTarget } from "../utils/drop-target";

export interface ElementDropParams {
  element: TrackElement;
  dragType: string;
  updates: { start: number; end: number };
  dropTarget: DropTarget | null;
}

interface TimelineManagerReturn {
  timelineData: { tracks: Track[]; version: number; metadata?: ProjectMetadata } | null;
  onAddTrack: () => void;
  onElementDrag: (params: {
    element: TrackElement;
    dragType: string;
    updates: { start: number; end: number };
  }) => void;
  onElementDrop: (params: ElementDropParams) => Promise<void>;
  /** Commit a main-track drag-to-reorder at a non-identity insertion slot (see timeline-view). */
  onMainReorder: (
    payload: { element: TrackElement; dragType: string; updates: { start: number; end: number } },
    toSlot: number
  ) => void;
  onReorder: (reorderedItems: Track[]) => void;
  onSeek: (time: number) => void;
  onSelectionChange: (selectedItem: TrackElement | Track | null) => void;
  selectedItem: Track | TrackElement | null;
  totalDuration: number;
}
/**
 * Custom hook to manage timeline operations and state.
 * Provides functions for handling element dragging, track reordering,
 * seeking, and selection changes in the video editor.
 *
 * @returns Object containing timeline management functions and state
 *
 * @example
 * ```js
 * const { timelineData, onElementDrag, onSeek, onSelectionChange } = useTimelineManager();
 *
 * // Handle element dragging
 * onElementDrag({ element, dragType: "START", updates: { start: 5, end: 10 } });
 *
 * // Seek to specific time
 * onSeek(15.5);
 * ```
 */
export const useTimelineManager = (): TimelineManagerReturn => {
  const { selectedItem, changeLog, setSelectedItem, totalDuration, editor, selectedIds } =
    useTimelineContext();
  /**
   * Handles element dragging operations on the timeline.
   * Updates element start/end times and handles special cases
   * for video and audio elements with playback rate adjustments.
   *
   * @param element - The element being dragged
   * @param dragType - The type of drag operation
   * @param updates - Object containing new start and end times
   *
   * @example
   * ```js
   * onElementDrag({
   *   element: videoElement,
   *   dragType: "START",
   *   updates: { start: 5.0, end: 15.0 }
   * });
   * ```
   */
  const onElementDrag = ({
    element,
    dragType,
    updates,
  }: {
    updates: { start: number; end: number };
    element: TrackElement;
    dragType: string;
  }) => {
    const tracks = editor.getTimelineData()?.tracks ?? [];
    const duration = totalDuration;

    if (dragType === DRAG_TYPE.MOVE && selectedIds.has(element.getId()) && selectedIds.size > 1) {
      const resolved = resolveIds(selectedIds, tracks);
      const elements = resolved.filter((item): item is TrackElement => item instanceof TrackElement);
      if (elements.length > 1) {
        // MAGNETIC MAIN TRACK: main-recording clips are GLUED (see the MOVE pin in
        // track-element.tsx) — exclude them from batch moves too, otherwise a cross-track
        // marquee drag (e.g. grab a caption while a video clip is co-selected) displaces the
        // recording, leaves a main-track gap the gate can't see, and a LATER unrelated drag
        // closes it with a surprise caption ripple (adversarial-review finding #2).
        const isMainTrackEl = (el: TrackElement) =>
          isMainVideoTrack(editor.getTrackById(el.getTrackId()));
        const movable = elements.filter((el) => !isMainTrackEl(el));
        if (movable.length === 0) {
          setSelectedItem(element);
          editor.refresh();
          return;
        }
        const minStart = Math.min(...movable.map((el) => el.getStart()));
        const maxEnd = Math.max(...movable.map((el) => el.getEnd()));
        const delta = updates.start - element.getStart();
        const deltaMin = -minStart;
        const deltaMax = duration - maxEnd;
        const clampedDelta = Math.max(deltaMin, Math.min(deltaMax, delta));

        const batchUpdates = movable.map((el) => ({
          elementId: el.getId(),
          updates: {
            s: el.getStart() + clampedDelta,
            e: el.getEnd() + clampedDelta,
          },
        }));

        editor.updateElements(batchUpdates);
        setSelectedItem(element);
        editor.refresh();
        closeMainTrackGapsIfNeeded(element);
        return;
      }
    }

    if (dragType === DRAG_TYPE.START) {
      if (element instanceof VideoElement || element instanceof AudioElement) {
        const elementProps = element.getProps();
        // Convert the timeline-delta of the START edge into a source-in-point delta. MUST parenthesize
        // the subtraction: `a - b * rate` reads as `a - (b*rate)` and mis-trims sped-up/slowed clips
        // (rate ≠ 1). Correct form is `(start - getStart()) * rate` (matches ElementSplitter's math).
        const delta =
          (updates.start - element.getStart()) *
          (elementProps?.playbackRate || 1);

        if (element instanceof AudioElement) {
          (element as AudioElement).setStartAt(element.getStartAt() + delta);
        } else {
          (element as VideoElement).setStartAt(element.getStartAt() + delta);
        }
      }
    }
    // Clamp end handle drags:
    // - Main video: clamp to file duration (can't extend past actual source video)
    // - Overlays: clamp to timeline duration (can't extend past video end)
    let clampedEnd = updates.end;
    if (dragType === DRAG_TYPE.END) {
      const _elTrack = editor.getTrackById(element.getTrackId());
      const _isMainVideo = _elTrack && _elTrack.getType() === TRACK_TYPES.VIDEO;
      if (_isMainVideo) {
        // Main video: clamp to actual file duration if available
        const _props: any = element.getProps?.() ?? {};
        const _fileDur = _props.fileDuration;
        const _startAt = _props.time ?? _props.startAt ?? 0;
        if (_fileDur && _fileDur > 0) {
          const maxEnd = updates.start + (_fileDur - _startAt);
          if (clampedEnd > maxEnd) clampedEnd = maxEnd;
        }
      } else if (totalDuration > 0 && clampedEnd > totalDuration) {
        clampedEnd = totalDuration;
      }
    }
    editor.updateElements([
      { elementId: element.getId(), updates: { s: updates.start, e: clampedEnd } },
    ]);
    // When shortening a video element's end, trim/remove subtitle elements past the new video end.
    // Subtitles are time-synced to the video — if the video is shorter, subtitles past the end
    // should not remain on the timeline.
    if (dragType === DRAG_TYPE.END && (element instanceof VideoElement)) {
      const allTracks = editor.getTimelineData()?.tracks ?? [];
      // Find the new max end across all video elements
      let maxVideoEnd = 0;
      for (const t of allTracks) {
        if (t.getType() === TRACK_TYPES.VIDEO) {
          for (const el of t.getElements()) {
            const elEnd = el.getEnd();
            if (elEnd > maxVideoEnd) maxVideoEnd = elEnd;
          }
        }
      }
      if (maxVideoEnd > 0) {
        for (const t of allTracks) {
          if (t.getType() !== TRACK_TYPES.CAPTION) continue;
          const friend = t.createFriend();
          for (const el of t.getElements()) {
            if (el.getStart() >= maxVideoEnd) {
              // Entirely past video end — remove
              friend.removeElement(el);
            } else if (el.getEnd() > maxVideoEnd) {
              // Partially overlapping — trim to video end + adjust word timing
              const prevStart = el.getStart();
              const prevEnd = el.getEnd();
              el.setEnd(maxVideoEnd);
              editor.adjustCaptionWordsForTimeChange(el, prevStart, prevEnd);
            }
          }
        }
      }
    }
    setSelectedItem(element);
    editor.refresh();
    closeMainTrackGapsIfNeeded(element);
  };

  /**
   * MAGNETIC MAIN TRACK: after any drag commit on the main "Video" track, close every gap
   * (including the leading one at t=0) so the recording is always contiguous from 0:00 — dragging
   * a clip toward the start snaps it flush, trimming a clip's head pulls everything left, and no
   * black dead-space can be left behind (founder-reported UX bug). Overlay/B-roll/text tracks are
   * NOT normalized — they're free-floating by design. Fire-and-forget: closeVideoTrackGaps is a
   * separate one-undo commit (undo #1 reopens the gap, undo #2 reverts the drag). Duck-typed so a
   * stale vendored/node_modules timeline build degrades to today's behavior instead of throwing.
   */
  const closeMainTrackGapsIfNeeded = (element: TrackElement) => {
    try {
      const track = editor.getTrackById(element.getTrackId());
      if (!isMainVideoTrack(track)) return;
      const close = (editor as any).closeVideoTrackGaps;
      if (typeof close === "function") {
        Promise.resolve(close.call(editor)).catch(() => {});
      }
    } catch {
      /* non-fatal — magnetic close is an enhancement, never break the drag commit */
    }
  };

  /**
   * Commit a main-track drag-to-reorder. The view has already guaranteed: reorder was ACTIVATED
   * (8px/long-press gates), not cancelled (Esc/pointercancel/blur), and `toSlot` is a
   * NON-IDENTITY slot recomputed from the drop pointer. One engine op = one undo entry = one
   * autosave; the engine re-checks identity/bounds as a belt (returns moved:false, no commit).
   * Contiguity is true by construction — closeMainTrackGapsIfNeeded is NOT called here.
   */
  const onMainReorder = (
    payload: { element: TrackElement; dragType: string; updates: { start: number; end: number } },
    toSlot: number
  ) => {
    try {
      const reorder = (editor as unknown as {
        reorderMainTrackElement?: (id: string, slot: number) => { moved: boolean; overlaysPinnedCount: number };
      }).reorderMainTrackElement;
      if (typeof reorder !== "function") return; // duck-typed — older dist without the op = no-op
      const commit = () => {
        const result = reorder.call(editor, payload.element.getId(), toSlot);
        if (result?.moved) {
          setSelectedItem(payload.element);
          editor.refresh();
          if (result.overlaysPinnedCount > 0) {
            // One-time "overlays and B-roll stay where they are" toast — the app listens.
            try {
              window.dispatchEvent(new CustomEvent("twick-reorder-overlays-pinned"));
            } catch {
              /* non-fatal */
            }
          }
        }
      };
      // If playback restarted mid-drag (space bar), settle the pool before permuting s/e.
      const ctrl = (window as unknown as {
        __webcodecs_controller?: { isPlaying?: () => boolean; pause?: () => void; state?: string };
      }).__webcodecs_controller;
      // PlaybackController exposes a `state` field, not isPlaying() — check both so the
      // mid-drag playback-restart defer actually runs (adversarial review #118 finding 1).
      const playing = ctrl?.isPlaying?.() ?? ctrl?.state === "playing";
      if (playing) {
        ctrl?.pause?.();
        requestAnimationFrame(commit);
      } else {
        commit();
      }
    } catch (err) {
      // Non-fatal — the pin means the timeline is visibly unchanged — but never silent (#26).
      console.error("[reorder] commit failed (timeline unchanged):", err);
    }
  };

  /**
   * Only allow separator drop (new track) when the element may leave its track at all.
   * Captions are excluded: they are time-pinned to THEIR caption track — a separator drop
   * would strand them on a generic 'element' track and silently strip caption semantics
   * (ripple caption guards, styling tools, the host app's subtitle pipeline).
   */
  const wouldBeElementTrack = (el: TrackElement): boolean => {
    const elType = el.getType().toLowerCase();
    return (
      elType !== "video" &&
      elType !== "image" &&
      elType !== "audio" &&
      elType !== "caption"
    );
  };

  const onElementDrop = async (params: ElementDropParams): Promise<void> => {
    const { element, dragType, updates, dropTarget } = params;
    const tracks = editor.getTimelineData()?.tracks ?? [];

    // Rejected cross-track drops MUST NOT silently return: the clip's local drag position has
    // already moved horizontally, and nothing would snap it back (element start/end unchanged →
    // TrackElementView never re-syncs → clip stays visually displaced until an unrelated
    // re-render). Committing the drag as a same-track move keeps the UI truthful: the vertical
    // component is ignored, the horizontal (time) component applies on the element's own track.
    const fallBackToSameTrackMove = () => {
      onElementDrag({ element, dragType, updates });
    };

    // A trim is NEVER a cross-track intent — the handles keep dragType START/END precisely so
    // the edge-drag source-offset math runs (setStartAt etc. lives on the onElementDrag path
    // only). Routing is by release coordinate, so without this belt an END-trim released with
    // the pointer drifted onto a compatible lane would remove+re-add the clip cross-track:
    // wrong source slice on START trims, and a main-track clip ripped out of the recording
    // (the main-track pin covers MOVE only). Audit 2026-07-12 finding 1.
    if (dragType === DRAG_TYPE.START || dragType === DRAG_TYPE.END) {
      fallBackToSameTrackMove();
      return;
    }

    if (!dropTarget) {
      return;
    }

    if (dropTarget.type === "separator") {
      if (!wouldBeElementTrack(element)) {
        fallBackToSameTrackMove();
        return;
      }
      await editor.moveElementToNewTrackAt(
        element,
        dropTarget.separatorIndex,
        updates.start
      );
      setSelectedItem(element);
      editor.refresh();
      return;
    }

    const targetTrack = tracks[dropTarget.trackIndex];
    if (!targetTrack) {
      fallBackToSameTrackMove();
      return;
    }

    if (!canDropElementOnTrack(element, targetTrack)) {
      fallBackToSameTrackMove();
      return;
    }

    const start = updates.start;
    const end = updates.end;
    const elementId = element.getId();
    const currentTrackId = element.getTrackId();

    let hasOverlap = false;
    const others = targetTrack.getElements().filter((el) => el.getId() !== elementId);
    for (const other of others) {
      const oStart = other.getStart();
      const oEnd = other.getEnd();
      if (start < oEnd && end > oStart) {
        hasOverlap = true;
        break;
      }
    }

    if (hasOverlap) {
      await editor.moveElementToNewTrackAt(
        element,
        dropTarget.trackIndex + 1,
        updates.start
      );
      setSelectedItem(element);
      editor.refresh();
      return;
    }

    if (currentTrackId === targetTrack.getId()) {
      onElementDrag({ element, dragType, updates });
      return;
    }

    editor.removeElement(element);
    element.setStart(updates.start);
    element.setEnd(updates.end);
    const added = await editor.addElementToTrack(targetTrack, element);
    if (added) {
      setSelectedItem(element);
      editor.refresh();
    }
  };

  // Get timeline data from editor
  const timelineData = useMemo(() => editor.getTimelineData(), [changeLog]);

  const { setSeekTime, setCurrentTime } = useLivePlayerContext();

  /**
   * Handles track reordering in the timeline.
   * Updates the track order in the editor based on the
   * new arrangement of tracks.
   *
   * @param reorderedItems - Array of tracks in their new order
   *
   * @example
   * ```js
   * onReorder([track1, track2, track3]);
   * // Reorders tracks in the specified sequence
   * ```
   */
  const onReorder = (reorderedItems: Track[]) => {
    editor.reorderTracks(reorderedItems);
    editor.refresh();
  };

  /**
   * Handles seeking to a specific time in the timeline.
   * Updates both the current time and seek time in the player.
   *
   * @param time - The time in seconds to seek to
   *
   * @example
   * ```js
   * onSeek(30.5);
   * // Seeks to 30.5 seconds in the timeline
   * ```
   */
  const onSeek = (time: number) => {
    setCurrentTime(time);
    setSeekTime(time);
  };

  /**
   * Handles selection changes in the timeline.
   * Updates the selected item in the timeline context.
   *
   * @param selectedItem - The newly selected track or element
   *
   * @example
   * ```js
   * onSelectionChange(videoElement);
   * // Selects the specified video element
   *
   * onSelectionChange(null);
   * // Clears the current selection
   * ```
   */
  const onSelectionChange = (selectedItem: TrackElement | Track | null) => {
    setSelectedItem(selectedItem);
  };

  const onAddTrack = () => {
    const tracks = editor.getTimelineData()?.tracks || [];
    editor.addTrack(`Track_${tracks.length + 1}`);
  };

  return {
    timelineData,
    onAddTrack,
    onElementDrag,
    onElementDrop,
    onMainReorder,
    onReorder,
    onSeek,
    onSelectionChange,
    selectedItem,
    totalDuration,
  };
};
