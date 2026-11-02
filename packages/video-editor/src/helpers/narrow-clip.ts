import { TIMELINE_ELEMENT_TYPE } from "@twick/timeline";

/**
 * NARROW SELECTED CLIPS STAY DRAGGABLE.
 *
 * A selected clip's trim handles are 6 px wide (timeline.css) and each `::before` hit zone reaches
 * 8 px further on BOTH sides, so together they cover 11 px inward from each edge. A selected clip
 * about 26 px or narrower therefore had no body left to grab, and the move gesture bails on any
 * press inside a handle: the clip could be trimmed but never moved.
 *
 * Under NARROW_CLIP_PX of rendered width, each handle's hit zone reaches OUTWARD only, and the
 * middle of the clip moves it. 48 px is where an 8 px inner grab per side still leaves 32 px of
 * body. Wider clips keep today's handles exactly.
 *
 * Overlay tracks only (B-roll, image, text, audio, Cutaways):
 *  - never the main "Video" track, where a body drag is the reorder lift and the give-back handles
 *    live;
 *  - never a caption: subtitles are nearly always narrow and sit edge to edge, so outward zones on
 *    the selected one (z-index 100) would steal the click meant to select the next subtitle.
 */
export const NARROW_CLIP_PX = 48;
/** How far a handle's hit zone reaches outward from its centre: half the 6 px handle + its 8 px ::before. */
export const NARROW_HANDLE_REACH_PX = 11;
/** The most a clip at the left edge keeps as an inner start grab. */
export const NARROW_INNER_GRAB_PX = 8;

export interface NarrowHitZones {
  /** Outward reach of each handle's hit zone, from the handle centre. */
  reachPx: number;
  /** How far the START zone reaches INTO the clip, from the handle centre. */
  startInnerPx: number;
  /** How far the END zone reaches INTO the clip, from the handle centre. Always 0 today. */
  endInnerPx: number;
}

/**
 * The hit zones for a selected clip, or null when its handles stay as they are.
 *
 * A clip whose start sits within NARROW_HANDLE_REACH_PX of the left edge of the timeline (the
 * first clip at 0:00) would have its outward start zone under the 40 px LABEL_WIDTH column, so it
 * keeps a small inner grab of min(8, width / 4) px instead.
 */
export function narrowClipHitZones(input: {
  widthPx: number;
  leftPx: number;
  isMainVideoTrack: boolean;
  elementType: string;
}): NarrowHitZones | null {
  const { widthPx, leftPx, isMainVideoTrack, elementType } = input;
  if (isMainVideoTrack) return null;
  if (elementType === TIMELINE_ELEMENT_TYPE.CAPTION) return null;
  // Written so NaN (a zero-length timeline) keeps today's handles.
  if (!(widthPx < NARROW_CLIP_PX)) return null;
  const atLeftEdge = leftPx < NARROW_HANDLE_REACH_PX;
  return {
    reachPx: NARROW_HANDLE_REACH_PX,
    startInnerPx: atLeftEdge ? Math.min(NARROW_INNER_GRAB_PX, Math.max(0, widthPx) / 4) : 0,
    endInnerPx: 0,
  };
}
