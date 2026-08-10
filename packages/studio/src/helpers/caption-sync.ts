/**
 * caption-sync — pure helpers for the Subtitles panel ⇄ timeline ⇄ playhead sync.
 *
 * DOM-free by design (scroll math takes numbers, not elements) so every rule here
 * unit-tests with plain values. All consumers share these — no second copy anywhere.
 */

export type CaptionCue = { id: string; s: number; e: number };

export const CUE_EPS = 1e-3;

/**
 * Which cue is "current" at time t. `cues` MUST be sorted by `s` ascending.
 *
 * The rule is `s <= t`, deliberately NOT `s <= t < e`: subtitle grouping inserts an
 * ~80ms gap between every group, so requiring `t < e` blinks the highlight off
 * ~20x/minute. Holding the last-started cue gives a continuous "you are here".
 * After the final cue the last card stays current — harmless and correct.
 * CUE_EPS makes click-to-seek-at-exact-start deterministic against float drift.
 */
export function activeIndexAt(cues: CaptionCue[], t: number): number {
  if (cues.length === 0) return -1;
  if (t + CUE_EPS < cues[0].s) return -1;
  let lo = 0,
    hi = cues.length - 1,
    ans = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (cues[mid].s <= t + CUE_EPS) {
      ans = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return ans;
}

export type FollowInput = {
  /** TimelineContext.followPlayheadEnabled — the ONE existing toggle, reused. */
  followEnabled: boolean;
  /** Non-null while focus is inside a caption textarea. */
  editingId: string | null;
  /** performance.now() of the last INTENT gesture in the list (wheel/touch/pointerdown/focusin). */
  detachedAt: number | null;
  now: number;
  reattachIdleMs: number;
};

/**
 * Whether playhead-follow may auto-scroll the list right now.
 *
 * Deliberate absences (each is a way this normally goes wrong):
 * - NO `playing` gate: follow keys off "active id changed", which also fires during a
 *   paused scrub — exactly when a creator is hunting for a line.
 * - NO `hovering` gate: parking the cursor over the panel must not kill follow.
 *   Suppress on ACTIONS, not presence.
 * - Intent is wheel/touchmove/pointerdown/focusin — NEVER the `scroll` event, because
 *   our own auto-scroll fires `scroll` and would detach itself (a self-cancelling
 *   feature that reads as "randomly stops working").
 */
export function shouldAutoScroll(i: FollowInput): boolean {
  if (!i.followEnabled) return false;
  if (i.editingId !== null) return false;
  if (i.detachedAt === null) return true;
  return i.now - i.detachedAt >= i.reattachIdleMs;
}

/**
 * Container-relative scroll delta that brings [rowTop,rowBottom] into
 * [viewTop,viewBottom] with `pad` breathing room. Returns 0 when no scroll is needed —
 * callers use that as the "row is comfortably visible" signal (follow re-arm).
 *
 * The tall-row guard is `viewH - 2*pad` wide (not `viewH`): a row taller than the
 * padded band would otherwise bounce between the top and bottom branches forever
 * (-pad, +pad, -pad, …), never returning 0 — jitter at every cue boundary and a
 * follow re-arm that never fires. Pinning its top is stable: a second call on the
 * result returns exactly 0.
 */
export function scrollDeltaFor(
  rowTop: number,
  rowBottom: number,
  viewTop: number,
  viewBottom: number,
  pad: number
): number {
  if (rowBottom - rowTop >= viewBottom - viewTop - 2 * pad) return rowTop - viewTop - pad;
  if (rowTop < viewTop + pad) return rowTop - viewTop - pad;
  if (rowBottom > viewBottom - pad) return rowBottom - viewBottom + pad;
  return 0;
}

/**
 * First scrollable ancestor of `start`, walking upward through `stopAt` INCLUSIVE and
 * no further. `stopAt` must therefore be an ancestor ABOVE every candidate scroller
 * (the panel root), not the first candidate itself — passing the list as the boundary
 * would return null the moment the list isn't the scroller, silently killing every
 * scroll this module exists to perform.
 */
export function findScrollContainer(
  start: HTMLElement | null,
  stopAt: HTMLElement | null
): HTMLElement | null {
  let n: HTMLElement | null = start;
  for (let depth = 0; n && depth < 10; depth++) {
    if (n.scrollHeight > n.clientHeight + 1) {
      const oy =
        typeof window !== "undefined" ? window.getComputedStyle(n).overflowY : "auto";
      if (oy === "auto" || oy === "scroll") return n;
    }
    if (n === stopAt) return null;
    n = n.parentElement;
  }
  return null;
}

/**
 * Overlay the in-progress edit onto a freshly rebuilt entry list so a changeLog
 * re-sync (split elsewhere, undo, Remove Silences) never clobbers what the user is
 * typing. Only the EDITING row's text is preserved; times and every other row come
 * from the timeline (the source of truth).
 */
export function mergeEditingText<T extends { id: string; t: string }>(
  next: T[],
  editingId: string | null,
  dirtyText: string | undefined
): T[] {
  if (!editingId || dirtyText === undefined) return next;
  return next.map((c) => (c.id === editingId ? { ...c, t: dirtyText } : c));
}
