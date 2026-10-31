import {
  TrackElement,
  Track,
  useTimelineContext,
  resolveIds,
} from "@twick/timeline";
import { isMainVideoTrack } from "../helpers/editor.utils";
import { recordCaptionRemoval } from "../helpers/caption-records";
import {
  resolveSplitTarget,
  resolveDeleteRange,
  playheadCutMessage,
  PLAYHEAD_CUT_REFUSED_EVENT,
} from "../helpers/playhead-cut";
import type { PlayheadCutAction, PlayheadCutRefusal } from "../helpers/playhead-cut";

/** Force-pause all media after a split, so a cut while playing does not leak audio. */
const pauseAllMediaSoon = () => {
  if (typeof document === "undefined") return;
  setTimeout(() => {
    document.querySelectorAll("video, audio").forEach((el) => {
      try { (el as HTMLMediaElement).pause(); } catch {}
    });
  }, 100);
};

/** The host app's player controller, duck-typed (the app's WebCodecs PlaybackController). */
type HostPlayerController = { pause?: () => void; seek?: (time: number) => void };
const hostPlayerController = (): HostPlayerController | undefined =>
  (globalThis as { __webcodecs_controller?: HostPlayerController }).__webcodecs_controller;

/**
 * A cut while playing pauses at the cut (Ben, 2026-10-30: "Pause at the cut"). Called only after
 * a SUCCESSFUL cut: a refusal or an engine failure changes nothing, playback included.
 *
 * With the host's player controller, it pauses through `controller.pause()`, so its state, picture,
 * sound and playhead stop together and the transport follows (rule #17: the controller drives the
 * React state, never the reverse). pauseAllMediaSoon would pause the controller's pooled `<video>`s
 * behind its back: it stayed "playing" with a frozen picture, no sound and a running playhead.
 * Without a controller (a host on the stock player), every media element is paused, as before.
 */
const pauseAfterCut = () => {
  const controller = hostPlayerController();
  if (controller && typeof controller.pause === "function") controller.pause();
  else pauseAllMediaSoon();
};

/**
 * A cut at the playhead that did nothing says why: PLAYHEAD_CUT_REFUSED_EVENT on window with
 * `{ action, reason, message }` for the host to show (a disabled button carries the same message as
 * its title). Returns false, the press's result.
 */
const refuse = (action: PlayheadCutAction, reason: PlayheadCutRefusal): false => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(PLAYHEAD_CUT_REFUSED_EVENT, {
        detail: { action, reason, message: playheadCutMessage(action, reason) },
      })
    );
  }
  return false;
};

/**
 * Custom hook to manage timeline control operations.
 * Provides functions for deleting items, splitting elements,
 * and handling undo/redo operations in the video editor.
 *
 * @returns Object containing timeline control functions
 * 
 * @example
 * ```js
 * const { deleteItem, splitElement, handleUndo, handleRedo } = useTimelineControl();
 * 
 * // Delete a track or element
 * deleteItem(trackOrElement);
 * 
 * // Split an element at current time
 * splitElement(element, 5.5);
 * ```
 */
const useTimelineControl = () => {
  const { editor, setSelectedItem, selectedIds, selectedItem } = useTimelineContext();

  /**
   * Deletes selected item(s) from the timeline.
   * When multiple items are selected, deletes all of them.
   *
   * @param item - The track or element to delete (optional; uses selection when not provided)
   */
  const deleteItem = (item?: Track | TrackElement) => {
    const tracks = editor.getTimelineData()?.tracks ?? [];
    const toDelete =
      item !== undefined
        ? [item]
        : resolveIds(selectedIds, tracks);

    const isTrackLocked = (t?: Track | null) =>
      (t?.getProps() as { locked?: boolean } | undefined)?.locked === true;

    // A track delete is a BULK delete wearing a single-click costume: it takes every clip on the
    // track, and the timeline just shows one fewer row, which is easy not to notice — and the
    // project autosaves ~3s later, so an unnoticed one becomes permanent. Confirm it, naming what
    // is lost (the same shape the studio header's canvas-switch confirm uses). An EMPTY track
    // deletes silently — there is nothing to lose. Founder decision 2026-08-04.
    const tracksToConfirm = toDelete.filter(
      (el): el is Track =>
        el instanceof Track &&
        !isMainVideoTrack(el) &&
        !isTrackLocked(el) &&
        (el.getElements?.()?.length ?? 0) > 0
    );
    if (tracksToConfirm.length > 0 && typeof window !== "undefined") {
      const describe = (t: Track) => {
        const n = t.getElements?.()?.length ?? 0;
        const name = t.getName?.() || "this";
        return `${name} track (${n} item${n === 1 ? "" : "s"})`;
      };
      const what =
        tracksToConfirm.length === 1
          ? `the ${describe(tracksToConfirm[0])}`
          : `${tracksToConfirm.length} tracks`;
      if (!window.confirm(`Delete ${what}? Everything on it is removed.`)) return;
    }

    let removed = 0;
    let keptLocked = 0;
    // ONE undo entry for the whole selection. Each removeTrack/rippleRemoveElement snapshots on its
    // own, so deleting 5 clips wrote 5 entries — Cmd+Z then walked back through four intermediate
    // states the creator never saw, and looked like "undo only removes one at a time".
    editor.batchHistory(() => {
    for (const el of toDelete) {
      if (el instanceof Track) {
        // The MAIN recording track is not deletable. The track header is also the drag handle,
        // so clicking it to grab a track SELECTS it — and a bare Delete/Backspace then removed
        // the creator's whole recording with no confirmation. Nothing in the editor offers a way
        // to put it back, the video-less project autosaves within 3s, and it renders with no
        // picture. Extends isMainVideoTrack's existing role (canDropElementOnTrack already
        // enforces "the main track is reorder-only") with "and it can't be deleted".
        // Guarding at the MUTATION site covers the button, the keyboard, and any future caller.
        if (isMainVideoTrack(el)) continue;
        if (isTrackLocked(el)) { keptLocked++; continue; } // locked track — don't delete it
        editor.removeTrack(el);
        removed++;
      } else if (el instanceof TrackElement) {
        const elTrack = editor.getTrackById(el.getTrackId());
        if (isTrackLocked(elTrack)) { keptLocked++; continue; } // clip on a locked track — don't delete
        // A subtitle the creator deletes stays deleted: its id goes on the Subtitles track's
        // removedSourceIds inside this same batch, so a later restore of nearby footage never
        // brings it back, and one undo takes back both (helpers/caption-records.ts).
        recordCaptionRemoval(elTrack, el);
        editor.rippleRemoveElement(el);
        removed++;
      }
    }
    });
    // A MIXED selection deletes what it can and keeps the locked ones — refusing the whole batch
    // would defeat the lock's main use (protecting the subtitle track WHILE you cut video). But it
    // must not be silent: say what was kept, and leave those items SELECTED so it is visible.
    // Founder decision 2026-08-04.
    if (removed > 0 && keptLocked > 0 && typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("twick-delete-kept-locked", { detail: { removed, keptLocked } })
      );
    }
    // Only clear the selection when something actually went AND nothing was held back. Clearing
    // unconditionally made a REFUSED delete look exactly like a successful one: the clip stayed
    // but its selection vanished, so the creator read it as deleted-then-reappeared.
    if (removed > 0 && keptLocked === 0) setSelectedItem(null);
  };
  
  /**
   * Splits an element at the specified time.
   * Creates two separate elements from the original element
   * at the given time point.
   *
   * @param element - The element to split
   * @param currentTime - The time at which to split the element
   * 
   * @example
   * ```js
   * splitElement(videoElement, 10.5);
   * // Splits the video element at 10.5 seconds
   * ```
   */
  const splitElement = async (element: TrackElement, currentTime: number) => {
    // Locked track — clips can't be split (the padlock protects the whole track's content).
    const _elTrack = editor.getTrackById(element.getTrackId());
    if ((_elTrack?.getProps() as { locked?: boolean } | undefined)?.locked === true) return;
    // Split the element AND cascade to spanning captions as ONE atomic undo step. A video cut splits
    // the captions sitting on top of it (so they stay in sync); a single Cmd+Z must reverse the whole
    // thing. The old code looped editor.splitElement per caption, each snapshotting history, so undo
    // only reversed the last caption split (video stayed cut). See splitElementWithCaptionCascade.
    const result = await editor.splitElementWithCaptionCascade(element, currentTime);
    // Select the first piece so timeline doesn't zoom to nothing
    if (result?.success && result?.firstElement) {
      setSelectedItem(result.firstElement);
    }
    pauseAllMediaSoon();
  };

  /**
   * Split at the playhead without clicking a clip first (S, Cmd/Ctrl+B, the Scissors button).
   * The target is the selected clip when the playhead is inside it, otherwise the MAIN video clip
   * under the playhead (resolveSplitTarget decides; B-roll, music and overlays the creator did not
   * select are never cut). Subtitles over a main clip split with it, in the same single undo entry.
   *
   * A refusal changes nothing and says why: it fires PLAYHEAD_CUT_REFUSED_EVENT on window with
   * `{ action: "split", reason, message }` for the host to show, and returns false. That includes
   * an engine split that fails after the rules allowed it (`split-failed`).
   *
   * A successful split while playing pauses there (pauseAfterCut).
   *
   * Selection afterwards (both pieces are NEW ids: ElementSplitter clones the clip twice, so the
   * original id never survives a split):
   * - a selected B-roll, subtitle or text the split cut: its right piece is selected (the playhead
   *   sits at its start), so the next S further on keeps cutting that clip instead of falling back
   *   to the main video;
   * - a selected MAIN video clip the split cut: nothing is selected (Ben, 2026-10-30: "Leave it
   *   alone"). Selecting the right piece, a new id, made the host's side panel follow it and
   *   unmounted the transcript on every S in the "click a word, press S" flow; the cleared
   *   selection never moves it. (The timeline drops the gone id on its own; clearing it here
   *   also drops any other ids, so a remaining one cannot become a new selection either.)
   * - the main clip cut with something else or nothing selected: the selection is left as it was.
   */
  const splitAtPlayhead = async (t: number): Promise<boolean> => {
    const tracks = editor.getTimelineData()?.tracks ?? [];
    const target = resolveSplitTarget(selectedItem, tracks, t);
    if (target.kind === "refuse") return refuse("split", target.reason);
    const onMainTrack = isMainVideoTrack(editor.getTrackById(target.element.getTrackId()));
    const result = await editor.splitElementWithCaptionCascade(target.element, t);
    if (!result?.success) {
      // The rules said yes and the engine said no (a case resolveSplitTarget does not foresee):
      // still a refusal the creator hears about, never a silent no-op.
      console.error("[Timeline] split at the playhead failed", { id: target.element.getId(), t });
      return refuse("split", "split-failed");
    }
    pauseAfterCut();
    if (target.selectionWasTarget) {
      if (onMainTrack) setSelectedItem(null);
      else if (result.secondElement) setSelectedItem(result.secondElement);
    }
    return true;
  };

  /**
   * Delete before the playhead (Q: from the start of the main video clip under the playhead to the
   * playhead) or after it (W: from the playhead to that clip's end). resolveDeleteRange decides the
   * range from the MAIN clip only; the selection plays no part and is never changed.
   *
   * The cut is ONE `editor.rippleDeleteRanges` call, so one undo entry: every track loses the same
   * stretch and everything after it slides left (B-roll and music crossing it are trimmed, subtitle
   * words inside it are dropped), locked B-roll and subtitle tracks included, exactly as transcript
   * Delete cuts. Only a locked MAIN track refuses.
   *
   * After a delete before, the playhead moves to the new join (the clip's old start, where the kept
   * footage now begins) through the host's player controller (`__webcodecs_controller.seek`, which
   * does not drop a repeat seek to the same time), or `fallbackSeek` when no controller exists.
   * After a delete after, the playhead is already on the join and does not move. Either way a cut
   * while playing then pauses (pauseAfterCut), AFTER the seek: the controller's seek() pauses as it
   * moves and publishes the new time before the paused state, so the playhead ends paused at the
   * join and the pause() that follows finds it paused already. A pause() first would publish the
   * OLD time into the live-player context, where the throttled seek time could then be dropped.
   *
   * A refusal changes nothing and says why (PLAYHEAD_CUT_REFUSED_EVENT with action "delete-before"
   * or "delete-after"), and returns false. So does a cut the engine throws on (`split-failed`),
   * which is also logged: rippleDeleteRanges cuts a clone and commits once at its end, so a throw
   * before that commit leaves the timeline as it was.
   */
  const deleteAtPlayhead = async (
    side: "before" | "after",
    t: number,
    fallbackSeek?: (time: number) => void
  ): Promise<boolean> => {
    const action: PlayheadCutAction = side === "before" ? "delete-before" : "delete-after";
    const range = resolveDeleteRange(editor.getTimelineData()?.tracks ?? [], t, side);
    if (range.kind === "refuse") return refuse(action, range.reason);
    try {
      await editor.rippleDeleteRanges([[range.from, range.to]]);
    } catch (error) {
      console.error("[Timeline] delete at the playhead failed", { side, t, error });
      return refuse(action, "split-failed");
    }
    if (range.seekTo !== null) {
      const controller = hostPlayerController();
      if (controller && typeof controller.seek === "function") controller.seek(range.seekTo);
      else fallbackSeek?.(range.seekTo);
    }
    pauseAfterCut();
    return true;
  };

  /**
   * Handles undo operation for timeline changes.
   * Reverts the last action performed on the timeline.
   * 
   * @example
   * ```js
   * handleUndo();
   * // Reverts the last timeline action
   * ```
   */
  const handleUndo = () => {
    editor.undo();
  }

  /**
   * Handles redo operation for timeline changes.
   * Reapplies the last undone action on the timeline.
   */
  const handleRedo = () => {
    editor.redo();
  };

  // Why Delete would refuse, computed from the SAME guards deleteItem enforces so the button can
  // never advertise an action the mutation site will silently drop. null = deletable.
  const deleteBlockedReason: string | null = (() => {
    const tracks = editor.getTimelineData()?.tracks ?? [];
    const sel = resolveIds(selectedIds, tracks);
    if (sel.length === 0) return null; // nothing selected — the plain disabled state covers it
    const lockedTrack = (t?: Track | null) =>
      (t?.getProps() as { locked?: boolean } | undefined)?.locked === true;
    const deletable = sel.filter((el) => {
      if (el instanceof Track) return !isMainVideoTrack(el) && !lockedTrack(el);
      if (el instanceof TrackElement) return !lockedTrack(editor.getTrackById(el.getTrackId()));
      return false;
    });
    if (deletable.length > 0) return null; // mixed selection keeps delete-what-you-can
    if (sel.some((el) => el instanceof Track && isMainVideoTrack(el)))
      return "The main video track can't be deleted";
    return "This track is locked — unlock it to delete";
  })();

  return {
    splitElement,
    splitAtPlayhead,
    deleteAtPlayhead,
    deleteItem,
    handleUndo,
    handleRedo,
    deleteBlockedReason,
  };
};

export default useTimelineControl;
