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
