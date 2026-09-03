/**
 * Track re-ordering for the canvas context menu (Bring to Front / Forward / Backward / Send to Back).
 *
 * CONVENTION: track index 0 renders ON TOP (the editor's inverted z-order — see canvas-compositor
 * sortByZOrder in the host app and the properties panel's handleBringForward, which swaps with
 * index - 1). "Front" therefore means TOWARD index 0 and "back" means toward the end.
 *
 * The handler in use-player-manager used to carry its own copy of this decision, and that copy was
 * INVERTED: "front" pushed the track to the END of the list (behind everything), "back" unshifted
 * it to index 0 (on top), and forward/backward swapped in the wrong direction. It also had no
 * floor, so "Bring to Front" on a text overlay pushed it behind the main video — gone from the
 * preview while the server render (which paints the main video as its base buffer) still shows it.
 *
 * FLOOR: a track never moves below the main video track (`mainTrackIndex`), the same rule the
 * properties panel enforces (founder decision 2026-08-04). With no main track the floor is the
 * last index. Returns a NEW array, or null when the move is a no-op at a boundary — callers must
 * not commit a null (an identity reorder would still write an undo entry).
 */
export type ZOrderDirection = "front" | "back" | "forward" | "backward";

export function reorderTracksForZOrder<T>(
  tracks: readonly T[],
  trackIndex: number,
  direction: ZOrderDirection,
  mainTrackIndex: number
): T[] | null {
  const n = tracks.length;
  if (trackIndex < 0 || trackIndex >= n) return null;
  const floor = mainTrackIndex >= 0 && mainTrackIndex < n ? mainTrackIndex - 1 : n - 1;

  const moveTo = (to: number): T[] => {
    const next = [...tracks];
    const [moved] = next.splice(trackIndex, 1);
    next.splice(to, 0, moved);
    return next;
  };

  switch (direction) {
    case "front":
      return trackIndex > 0 ? moveTo(0) : null;
    case "forward":
      return trackIndex > 0 ? moveTo(trackIndex - 1) : null;
    case "back":
      return trackIndex < floor ? moveTo(floor) : null;
    case "backward":
      return trackIndex < floor ? moveTo(trackIndex + 1) : null;
    default:
      return null;
  }
}
