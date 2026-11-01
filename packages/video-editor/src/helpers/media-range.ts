import { TrackElement, VideoElement } from "@twick/timeline";

/** The part of a source video the creator chose to add, in SOURCE seconds. */
export interface PickedMediaRange {
  inSec: number;
  outSec: number;
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
