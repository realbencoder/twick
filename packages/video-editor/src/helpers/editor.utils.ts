import { TRACK_TYPES, type Track, type TrackElement } from "@twick/timeline";
import { DEFAULT_ELEMENT_COLORS } from "./constants";
import { ElementColors } from "./types";

export let ELEMENT_COLORS: ElementColors = { ...DEFAULT_ELEMENT_COLORS };

export const setElementColors = (colors: Partial<ElementColors>) => {
  ELEMENT_COLORS = {
    ...DEFAULT_ELEMENT_COLORS,
    ...colors,
  };
};
/**
 * The magnetic MAIN video track is resolved by NAME ("Video") — never by getType(), which also
 * matches B-roll video tracks (the known manager END-clamp inconsistency; do not copy it).
 * Single source of truth for track-base, use-timeline-manager, and the reorder routing guard.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isMainVideoTrack = (track?: unknown): boolean =>
  (track as any)?.getName?.() === "Video";

/**
 * Cross-track drop compatibility — the single rule for BOTH drag-drop paths (existing-element
 * drops in use-timeline-manager's onElementDrop, and new-media drops in TimelineManager's
 * handleDropOnTimeline).
 *
 * - CAPTIONS are time-pinned to their own track: a cross-track caption drop is never intended.
 *   Off its caption track a caption silently loses caption semantics (ripple caption guards,
 *   caption styling tools, and the host app's subtitle pipeline all key off the caption track).
 * - The MAIN recording track is reorder-only (magnetic, contiguous by construction) — nothing
 *   may be dropped INTO it.
 * - Caption-type tracks hold only captions; nothing may be dropped ONTO them.
 * - Typed tracks (video/audio) accept only their own kind (video tracks also accept images —
 *   the engine's own element→track map in moveElementToNewTrackAt treats them as one lane kind).
 * - Generic 'element' tracks (the default for panel/OS-drop-created tracks) are judged by
 *   CONTENT: the dragged element's type must match the elements already on the track (a text
 *   overlay can't land on a B-roll lane and vice versa). An EMPTY element track accepts any
 *   non-caption element.
 *
 * Callers must fall back to a same-track move (not a silent return) when this rejects, so the
 * clip never stays visually displaced from its committed position.
 */
export const canDropElementOnTrack = (
  element: TrackElement,
  targetTrack: Track
): boolean => {
  const elType = element.getType().toLowerCase();
  if (elType === "caption") return false;
  if (isMainVideoTrack(targetTrack)) return false;
  const trackType = targetTrack.getType();
  if (trackType === TRACK_TYPES.CAPTION || trackType === TRACK_TYPES.SCENE) return false;
  if (trackType === TRACK_TYPES.VIDEO && elType !== "video" && elType !== "image") return false;
  if (trackType === TRACK_TYPES.AUDIO && elType !== "audio") return false;
  const existing = targetTrack.getElements();
  if (
    existing.length > 0 &&
    existing.some((el) => el.getType().toLowerCase() !== elType)
  ) {
    return false;
  }
  return true;
};
