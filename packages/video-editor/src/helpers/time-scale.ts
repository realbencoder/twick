import { useMemo } from "react";

/**
 * SINGLE SOURCE OF TRUTH for the timeline's time <-> pixel geometry.
 *
 * The timeline previously carried TWO inconsistent reference frames: the pixel subsystems
 * (ruler, playhead, marquee, drop-preview) used `px = time * 100 * zoom` and subtracted a
 * hardcoded 40px label offset, while the CLIPS positioned themselves as `left:(start/duration)*100%`
 * inside a track of width `timelineWidth - 40`. Those two only agreed by coincidence, which caused
 * the playhead-jumps-on-zoom, marquee-wrong-track, and drop-preview-offset bugs.
 *
 * The fix: derive `pxPerSec` from the CLIP frame (`contentWidth / duration`) and route every pixel
 * subsystem through this module. The clips are ground truth and DO NOT change — the subsystems move
 * to match them. `timeToPx` is content-relative (0 at t=0, inside the post-header track); use
 * `timeToContentX` when you need the absolute X within the horizontally-scrolling content (which
 * includes the 40px sticky label column).
 */

export const LABEL_WIDTH = 40; // sticky track-header / seek empty-space column (timeline.css)
export const TRACK_HEIGHT = 44; // .twick-timeline-container = 2.75rem
export const SEPARATOR_HEIGHT = 6; // .twick-timeline-separator (matches utils/drop-target.ts)
export const BASE_PX_PER_SEC = 100; // the "×100" base that scales with zoom
export const MIN_TIMELINE_WIDTH = 100;

export interface TimeScale {
  /** Clip-frame pixels per second = contentWidth / duration (NOT 100*zoom). */
  pxPerSec: number;
  /** Width of the clip track area (timelineWidth minus the label column). */
  contentWidth: number;
  /** Full row width including the label region: max(100, duration*zoom*100). */
  timelineWidth: number;
  /** seconds -> content-relative px (0 at t=0, inside the post-header track). */
  timeToPx: (t: number) => number;
  /** content-relative px -> seconds (inverse of timeToPx). */
  pxToTime: (px: number) => number;
  /** seconds -> absolute X in the scroll content (LABEL_WIDTH + timeToPx). */
  timeToContentX: (t: number) => number;
  /** absolute X in the scroll content -> seconds (inverse of timeToContentX). */
  contentXToTime: (x: number) => number;
  /** vertical stride between track rows = TRACK_HEIGHT + SEPARATOR_HEIGHT. */
  trackStride: number;
  /** content-relative Y (from the top of the track area) -> track index, accounting for the leading separator. */
  yToTrackIndex: (yInContent: number) => number;
  labelWidth: number;
  LABEL_WIDTH: number;
  SEPARATOR_HEIGHT: number;
  TRACK_HEIGHT: number;
}

/**
 * Pure factory — safe to call from React render, event handlers, and tests. Prefer this in
 * non-React contexts (document listeners in the marquee/drop hooks). Use the `useTimeScale` wrapper
 * in components for a memoized instance.
 */
export function createTimeScale(
  zoom: number,
  duration: number,
  labelWidth: number = LABEL_WIDTH
): TimeScale {
  const timelineWidth = Math.max(MIN_TIMELINE_WIDTH, duration * zoom * BASE_PX_PER_SEC);
  // The clip track (.twick-track) is `timelineWidth` wide — the 40px label is a SEPARATE sticky DOM
  // element, NOT a width subtraction. Clips position via % of that FULL width, so the ruler/playhead
  // must map across the same full width or the ruler ends 40px short and clips hang off the right end
  // (the regression a prior version caused by subtracting labelWidth here). contentWidth == timelineWidth;
  // pxPerSec == 100*zoom. The 40px offset is applied separately via timeToContentX (+labelWidth).
  const contentWidth = timelineWidth;
  const safeDuration = Math.max(duration, 1e-6);
  const pxPerSec = contentWidth / safeDuration; // === 100*zoom === the clip frame (.twick-track width / duration)
  const trackStride = TRACK_HEIGHT + SEPARATOR_HEIGHT;
  return {
    pxPerSec,
    contentWidth,
    timelineWidth,
    timeToPx: (t) => (t / safeDuration) * contentWidth,
    pxToTime: (px) => (px / contentWidth) * safeDuration,
    timeToContentX: (t) => labelWidth + (t / safeDuration) * contentWidth,
    contentXToTime: (x) => ((x - labelWidth) / contentWidth) * safeDuration,
    trackStride,
    // Row layout is [sep0][track0][sep1][track1]… — mirror utils/drop-target.ts:getTrackOrSeparatorAt.
    yToTrackIndex: (y) => Math.floor(Math.max(0, y - SEPARATOR_HEIGHT) / trackStride),
    labelWidth,
    LABEL_WIDTH: labelWidth,
    SEPARATOR_HEIGHT,
    TRACK_HEIGHT,
  };
}

/** Memoized React wrapper around createTimeScale. */
export function useTimeScale(
  zoom: number,
  duration: number,
  labelWidth: number = LABEL_WIDTH
): TimeScale {
  return useMemo(
    () => createTimeScale(zoom, duration, labelWidth),
    [zoom, duration, labelWidth]
  );
}
