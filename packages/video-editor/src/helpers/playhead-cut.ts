import { canSplitElement } from "@twick/timeline";
import type { Track, TrackElement } from "@twick/timeline";
import { isMainVideoTrack } from "./editor.utils";

/**
 * Decisions for cutting at the playhead (Split, delete before, delete after). Pure: they read the
 * tracks and say what to do or why not; the caller performs the edit and shows the message.
 * The smallest piece allowed is whatever `canSplitElement` says, and nothing else.
 */
export type PlayheadCutAction = "split" | "delete-before" | "delete-after";
export type PlayheadCutRefusal = "no-clip" | "near-edge" | "main-locked" | "selected-locked";
export type SplitTarget =
  | { kind: "split"; element: TrackElement; selectionWasTarget: boolean }
  | { kind: "refuse"; reason: PlayheadCutRefusal };
export type DeleteRange =
  | { kind: "cut"; from: number; to: number; seekTo: number | null }
  | { kind: "refuse"; reason: PlayheadCutRefusal };

/** Fired on window by the editor when a cut is refused, so the host app can show the message. */
export const PLAYHEAD_CUT_REFUSED_EVENT = "twick-playhead-cut-refused";

const isTrackLocked = (track: Track | undefined | null): boolean =>
  (track?.getProps() as { locked?: boolean } | undefined)?.locked === true;

const isElement = (item: Track | TrackElement | null | undefined): item is TrackElement =>
  !!item && typeof (item as TrackElement).getStart === "function";

type MainClip =
  | { kind: "clip"; element: TrackElement }
  | { kind: "refuse"; reason: PlayheadCutRefusal };

/** The main-track clip under the playhead, with the shared refusal order. */
function mainClipAt(tracks: Track[], t: number): MainClip {
  const main = tracks.find((tr) => isMainVideoTrack(tr));
  const clip = main?.getElements().find((el) => el.getStart() <= t && t < el.getEnd());
  if (!main || !clip) return { kind: "refuse", reason: "no-clip" };
  if (isTrackLocked(main)) return { kind: "refuse", reason: "main-locked" };
  if (!canSplitElement(clip, t)) return { kind: "refuse", reason: "near-edge" };
  return { kind: "clip", element: clip };
}

/**
 * The selected element as the timeline holds it NOW, with its track: the element under the same id
 * on the track that owns it, so a stale copy of the selection resolves to the live instance. Null
 * when no track holds it (removed since it was selected), which counts as nothing selected, so a
 * press never "splits" a clip that is not on the timeline.
 */
function liveSelection(
  selectedItem: Track | TrackElement | null,
  tracks: Track[],
): { element: TrackElement; track: Track } | null {
  if (!isElement(selectedItem)) return null;
  const id = selectedItem.getId();
  const track = tracks.find((tr) => tr.getElementById(id) !== undefined);
  const element = track?.getElementById(id);
  return track && element ? { element: element as TrackElement, track } : null;
}

export function resolveSplitTarget(
  selectedItem: Track | TrackElement | null,
  tracks: Track[],
  t: number,
): SplitTarget {
  const selected = liveSelection(selectedItem, tracks);
  if (selected && selected.element.getStart() < t && t < selected.element.getEnd()) {
    if (isTrackLocked(selected.track)) return { kind: "refuse", reason: "selected-locked" };
    if (!canSplitElement(selected.element, t)) return { kind: "refuse", reason: "near-edge" };
    return { kind: "split", element: selected.element, selectionWasTarget: true };
  }
  const main = mainClipAt(tracks, t);
  if (main.kind === "refuse") return main;
  return { kind: "split", element: main.element, selectionWasTarget: false };
}

export function resolveDeleteRange(tracks: Track[], t: number, side: "before" | "after"): DeleteRange {
  const main = mainClipAt(tracks, t);
  if (main.kind === "refuse") return main;
  const clip = main.element;
  return side === "before"
    ? { kind: "cut", from: clip.getStart(), to: t, seekTo: clip.getStart() }
    : { kind: "cut", from: t, to: clip.getEnd(), seekTo: null };
}

const MESSAGES: Record<PlayheadCutAction, Record<PlayheadCutRefusal, string>> = {
  split: {
    "no-clip": "Move the playhead over your video to split it",
    "near-edge": "Too close to the edge of the clip to split",
    "main-locked": "Unlock the video track to cut it",
    "selected-locked": "Unlock this clip's track to split it",
  },
  "delete-before": {
    "no-clip": "Move the playhead over your video to cut it",
    "near-edge": "Move the playhead into the clip to cut before it",
    "main-locked": "Unlock the video track to cut it",
    "selected-locked": "Unlock the video track to cut it",
  },
  "delete-after": {
    "no-clip": "Move the playhead over your video to cut it",
    "near-edge": "Move the playhead into the clip to cut after it",
    "main-locked": "Unlock the video track to cut it",
    "selected-locked": "Unlock the video track to cut it",
  },
};

export function playheadCutMessage(action: PlayheadCutAction, reason: PlayheadCutRefusal): string {
  return MESSAGES[action][reason];
}
