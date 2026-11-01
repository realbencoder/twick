import {
  canSplitElement,
  CaptionElement,
  TextElement,
  ElementSplitter,
  ElementValidator,
} from "@twick/timeline";
import type { Track, TrackElement } from "@twick/timeline";
import { isMainVideoTrack } from "./editor.utils";

/**
 * Decisions for cutting at the playhead (Split, delete before, delete after). Pure: they read the
 * tracks and say what to do or why not; the caller performs the edit and shows the message.
 * The smallest piece allowed is whatever `canSplitElement` says, and nothing else.
 */
export type PlayheadCutAction = "split" | "delete-before" | "delete-after";
export type PlayheadCutRefusal =
  | "no-clip"
  | "near-edge"
  | "main-locked"
  | "off-selection-main-locked"
  | "selected-locked"
  | "one-word"
  | "unsplittable-text"
  | "split-failed";
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

/**
 * Whether the engine's split of this subtitle or text overlay at `t` would succeed. It runs the
 * engine's own ElementSplitter (which only CLONES: the halves are new elements, the selected one is
 * never touched) and the track's ElementValidator on both halves, the checks `splitElementNoCommit`
 * makes before it commits. So it fails exactly where the engine fails: the text splits on " " only
 * and needs two or more pieces ("Hello\nworld" and a non-breaking space are one piece), the cut
 * lands at a word index chosen from `t` (word timings, else the fraction), and a half left empty
 * by a stray space is rejected (a caption's: blank after trim).
 */
function engineSplitsText(element: TrackElement, t: number): boolean {
  try {
    const halves = element.accept(new ElementSplitter(t));
    if (!halves.success) return false;
    const validator = new ElementValidator();
    halves.firstElement.accept(validator);
    halves.secondElement.accept(validator);
    return true;
  } catch {
    return false;
  }
}

/**
 * Why a selected subtitle or text overlay cannot be split at `t`, or null when it can. One word
 * (counting whitespace-separated words, so "Hello " is one) is always `one-word`: the engine either
 * fails or leaves a blank half. Two or more words the engine cannot split here are
 * `unsplittable-text` (words joined by a line break or a non-breaking space; or a stray space that
 * leaves a half empty at this playhead). Refusing here means Split says why instead of the engine
 * failing with a red `split-failed`.
 */
function textSplitRefusal(element: TrackElement, t: number): PlayheadCutRefusal | null {
  if (!(element instanceof CaptionElement || element instanceof TextElement)) return null;
  const words = (element.getText() || "").split(/\s+/).filter(Boolean).length;
  if (words < 2) return "one-word";
  return engineSplitsText(element, t) ? null : "unsplittable-text";
}

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

/**
 * The selected clip is the target while the playhead is on it, its two edges included (Ben,
 * 2026-11-01: "Refuse, don't cut"): a second S, a double-click on the Scissors, or a subtitle-card
 * click leaves the playhead exactly on the selected clip's start, and canSplitElement refuses there
 * (near-edge) instead of the press falling back to cut the main video. Only a playhead OFF the
 * selected clip (or nothing selected) cuts the main clip under it.
 */
export function resolveSplitTarget(
  selectedItem: Track | TrackElement | null,
  tracks: Track[],
  t: number,
): SplitTarget {
  const selected = liveSelection(selectedItem, tracks);
  if (selected && selected.element.getStart() <= t && t <= selected.element.getEnd()) {
    if (isTrackLocked(selected.track)) return { kind: "refuse", reason: "selected-locked" };
    if (!canSplitElement(selected.element, t)) return { kind: "refuse", reason: "near-edge" };
    // Selected targets only: the main-clip target is a video, and the engine's caption cascade
    // already leaves a subtitle it cannot split over the cut whole.
    const textRefusal = textSplitRefusal(selected.element, t);
    if (textRefusal) return { kind: "refuse", reason: textRefusal };
    return { kind: "split", element: selected.element, selectionWasTarget: true };
  }
  const main = mainClipAt(tracks, t);
  // A clip is selected but the playhead is off it, and the video track is locked: say both, since
  // "unlock the video track" alone reads as if the press was aimed at the video.
  if (main.kind === "refuse" && main.reason === "main-locked" && selected) {
    return { kind: "refuse", reason: "off-selection-main-locked" };
  }
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
    "off-selection-main-locked": "The playhead isn't on the selected clip, and the video track is locked",
    "selected-locked": "Unlock this clip's track to split it",
    "one-word": "A single word can't be split",
    "unsplittable-text": "This text can't be split",
    "split-failed": "Couldn't split here. Try moving the playhead a little.",
  },
  "delete-before": {
    "no-clip": "Move the playhead over your video to cut it",
    "near-edge": "Too close to the edge of the clip to cut",
    "main-locked": "Unlock the video track to cut it",
    // Unreachable: delete before/after decides from the main clip only, never the selection.
    "off-selection-main-locked": "Unlock the video track to cut it",
    "selected-locked": "Unlock the video track to cut it",
    // Unreachable: delete before/after cuts the main video clip, never a subtitle or text.
    "one-word": "A single word can't be split",
    "unsplittable-text": "This text can't be split",
    "split-failed": "Couldn't cut here. Try moving the playhead a little.",
  },
  "delete-after": {
    "no-clip": "Move the playhead over your video to cut it",
    "near-edge": "Too close to the edge of the clip to cut",
    "main-locked": "Unlock the video track to cut it",
    // Unreachable: delete before/after decides from the main clip only, never the selection.
    "off-selection-main-locked": "Unlock the video track to cut it",
    "selected-locked": "Unlock the video track to cut it",
    // Unreachable: delete before/after cuts the main video clip, never a subtitle or text.
    "one-word": "A single word can't be split",
    "unsplittable-text": "This text can't be split",
    "split-failed": "Couldn't cut here. Try moving the playhead a little.",
  },
};

export function playheadCutMessage(action: PlayheadCutAction, reason: PlayheadCutRefusal): string {
  return MESSAGES[action][reason];
}
