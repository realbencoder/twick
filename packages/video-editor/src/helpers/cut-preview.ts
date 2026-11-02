import { useSyncExternalStore } from "react";

/**
 * The red preview of a delete before / after the playhead (Ben, 2026-11-02): the stretch
 * `[from, to]` (timeline seconds) that the hovered or focused button would delete.
 *
 * A small store shared inside this package, keyed by the timeline's `contextId` so two editors
 * never see each other's preview. ControlManager is its only writer: it sets the preview while an
 * ENABLED before/after button is hovered or focused and clears it otherwise, and on unmount. The
 * timeline view reads it (useCutPreview) and draws the overlay. Module scope, never a window
 * global, so nothing outside the editor can leave it set.
 */
export type CutPreview = { side: "before" | "after"; from: number; to: number };

const previews = new Map<string, CutPreview>();
const listeners = new Set<() => void>();

const same = (a: CutPreview | null, b: CutPreview | null): boolean =>
  a === b || (!!a && !!b && a.side === b.side && a.from === b.from && a.to === b.to);

/** Sets (or, with null, clears) the preview for one timeline. A value equal to the current one is a no-op. */
export function setCutPreview(contextId: string, preview: CutPreview | null): void {
  if (same(previews.get(contextId) ?? null, preview)) return;
  if (preview) previews.set(contextId, preview);
  else previews.delete(contextId);
  listeners.forEach((listener) => listener());
}

export function getCutPreview(contextId: string): CutPreview | null {
  return previews.get(contextId) ?? null;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** The preview for this timeline, re-rendering when it changes. */
export function useCutPreview(contextId: string): CutPreview | null {
  return useSyncExternalStore(
    subscribe,
    () => getCutPreview(contextId),
    () => null
  );
}
