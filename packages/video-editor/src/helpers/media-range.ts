import { TrackElement, VideoElement } from "@twick/timeline";

/** The part of a source video the creator chose to add, in SOURCE seconds. */
export interface PickedMediaRange {
  inSec: number;
  outSec: number;
}

/**
 * The host's range picker ("Choose the part to add"). Every library VIDEO add path but Visuals
 * calls it BEFORE any timeline mutation, through this window bridge (the same app-to-editor pattern
 * as `__twick_proxy_media` and `__twick_upload_media`). The host resolves a range in SOURCE
 * seconds, or `null` when the creator cancels or the file can't play. Keep the shape identical to
 * the app's `src/lib/media-range.ts`.
 */
export const PICK_MEDIA_RANGE_BRIDGE = "__twick_pick_media_range";

/** What the picker is shown. `name` only when it is the file's real name (drag payloads have none). */
export interface PickMediaRangeItem {
  url: string;
  name?: string;
}

/** `whole`: no picker (a non-app host), add the whole clip as before. `cancel`: add nothing. */
export type MediaRangePick =
  | { kind: "whole" }
  | { kind: "cancel" }
  | { kind: "range"; inSec: number; outSec: number };

const isPickedRange = (r: unknown): r is PickedMediaRange => {
  const range = r as Partial<PickedMediaRange> | null;
  return (
    !!range &&
    typeof range.inSec === "number" &&
    typeof range.outSec === "number" &&
    Number.isFinite(range.inSec) &&
    Number.isFinite(range.outSec) &&
    range.inSec >= 0 &&
    range.outSec > range.inSec
  );
};

/**
 * Asks the host which part of a video to add. No bridge is `whole`; `null` is `cancel`. A bridge
 * that throws or answers anything but a real range (`outSec` after `inSec`, both finite, `inSec`
 * at or after 0) is also `cancel`, but a loud one: it logs and fires `twick-media-add-failed`, so
 * the creator sees the toast instead of a click that did nothing (rule #26).
 */
export async function pickMediaRange(item: PickMediaRangeItem): Promise<MediaRangePick> {
  const bridge =
    typeof window === "undefined"
      ? undefined
      : (window as unknown as Record<string, unknown>)[PICK_MEDIA_RANGE_BRIDGE];
  if (typeof bridge !== "function") return { kind: "whole" };
  const request: PickMediaRangeItem = item.name ? { url: item.url, name: item.name } : { url: item.url };
  try {
    const answer: unknown = await (bridge as (i: PickMediaRangeItem) => Promise<unknown>)(request);
    if (answer === null) return { kind: "cancel" };
    if (isPickedRange(answer)) return { kind: "range", inSec: answer.inSec, outSec: answer.outSec };
    console.error("[twick] the range picker answered something that is not a range; adding nothing", answer);
  } catch (err) {
    console.error("[twick] the range picker failed; adding nothing", err);
  }
  window.dispatchEvent(new CustomEvent("twick-media-add-failed"));
  return { kind: "cancel" };
}

/** The range to build with, or undefined for the whole clip. Call only on a pick that adds. */
export function rangeOfPick(pick: MediaRangePick): PickedMediaRange | undefined {
  return pick.kind === "range" ? { inSec: pick.inSec, outSec: pick.outSec } : undefined;
}

/**
 * Builds a video element for a picked range: the in-point goes to `props.time` and the element is
 * preset to the range's timeline length at 0. Whoever adds it moves it to its start with
 * `placeKeepingLength`, and ElementAdder keeps the in-point and the length.
 */
export function applyMediaRange(element: VideoElement, range: PickedMediaRange): VideoElement {
  const rate = element.getPlaybackRate() > 0 ? element.getPlaybackRate() : 1;
  element.setStartAt(range.inSec);
  element.setStart(0);
  element.setEnd((range.outSec - range.inSec) / rate);
  return element;
}

/**
 * Moves an element to `start`, keeping a preset length (a picked range, a shape's 5 s). An element
 * with only an end preset counts from 0. One with no end is left for ElementAdder's default length.
 */
export function placeKeepingLength(element: TrackElement, start: number): void {
  const presetStart = element.getStart();
  const presetEnd = element.getEnd();
  if (isNaN(presetEnd)) {
    element.setStart(start);
    return;
  }
  const length = presetEnd - (isNaN(presetStart) ? 0 : presetStart);
  element.setStart(start);
  element.setEnd(element.getStart() + Math.max(0, length));
}
