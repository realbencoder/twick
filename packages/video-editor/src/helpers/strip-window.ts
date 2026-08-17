/**
 * Which slice of a clip's strips (filmstrip + waveform) is actually on screen.
 *
 * WHY THIS EXISTS. Each main-video clip carries two canvases sized to the WHOLE clip
 * (`width: 100%` of a clip div whose width is `clipDurationSeconds * zoom * 100`). Their backing
 * store is capped at MAX_BACKING_PX = 8192, so past `clipDur * zoom > ~41` (dpr 2) the canvas is
 * drawn at a fraction of its CSS size and stretched. MEASURED on a 24-min single-clip video at 50%
 * zoom: css 72,721px, backing 8,192 — one real pixel across nine.
 *
 * Two further caps derive from the same full width and are the reason a windowed CANVAS is not
 * enough on its own:
 *   - the waveform's bar COUNT pins at floor(8192/3) = 2730, which on that clip is 1.88 bars/sec
 *     drawing 2px bars at a 26.6px stride — a 7.4% duty cycle where the design intends 67%. That
 *     sparse comb IS the "waveform is impossible to read" report; it is not blurriness.
 *   - the filmstrip's frame count pins at 120, stretching 270x480 tiles to ~606x44.
 *
 * So the source range must narrow WITH the canvas. Shrinking the canvas alone still computes both
 * counts from the full width and the comb survives.
 *
 * WHAT THIS DELIBERATELY DOES NOT DO. Nothing here helps when the whole video is on screen: at that
 * zoom the clip is ~25 audio peaks per pixel and is a solid block at any resolution. That is
 * information density, not resolution, and making it readable would need a different renderer
 * (an envelope over downsampled peaks). Founder decision 2026-08-17: out of scope. Zoomed out
 * stays "audio exists here"; this fixes zoomed IN, which is where a creator reads a waveform.
 */

/** The scroll container that owns the timeline viewport. One per editor. */
export const TIMELINE_SCROLL_SELECTOR = ".twick-timeline-scroll-container";

/**
 * Live viewport geometry, read from the DOM at draw time.
 *
 * READING THE DOM HERE IS ONLY CORRECT BECAUSE the anchor-zoom scroll assignment runs in a
 * `useLayoutEffect`. React runs ALL layout effects (child, then parent) before ANY passive effect,
 * so the parent's zoom assignment lands before these child draw effects read it. If that assignment
 * is ever moved back to `useEffect`, every draw during a zoom step reads the OLD scroll against the
 * NEW zoom and the strips flicker one frame per zoom click.
 *
 * Do NOT "fix" that by caching a scroll value instead: on zoom-OUT the content shrinks in the same
 * commit and the browser has already re-clamped `scrollLeft` to a third value that is neither the
 * old one nor the intended new one. The DOM is the only place that value exists.
 */
export function readTimelineViewport(
  el: HTMLElement | null
): { scrollLeft: number; viewportWidth: number } | null {
  const scroller = el?.closest(TIMELINE_SCROLL_SELECTOR) as HTMLElement | null;
  if (!scroller) return null;
  const viewportWidth = scroller.clientWidth;
  if (!(viewportWidth > 0)) return null;
  return { scrollLeft: scroller.scrollLeft, viewportWidth };
}

/**
 * Overscan: draw one viewport-width beyond each edge so a small scroll does not expose an undrawn
 * band before the redraw lands. One viewport is far below the ~41s x zoom of VISIBLE width at
 * which the backing-store cap re-engages, so the padding can never reintroduce the defect.
 */
export const STRIP_OVERSCAN_FACTOR = 1;

export interface StripWindowInput {
  /** Clip start, TIMELINE seconds. */
  clipStart: number;
  /** Clip end, TIMELINE seconds. */
  clipEnd: number;
  /** Whole timeline duration, seconds. */
  duration: number;
  /** Track width in px — `duration * zoom * 100` minus the label column. Never a DOM read. */
  parentWidth: number;
  /** Scroll container scrollLeft, px. */
  scrollLeft: number;
  /** Scroll container clientWidth, px. */
  viewportWidth: number;
  /** Extra px drawn each side so a small scroll does not expose an undrawn edge. */
  overscanPx: number;
}

export interface StripWindow {
  /** Offset of the visible slice within the clip, as a fraction of clip width (0..1). */
  leftFrac: number;
  /** Width of the visible slice, as a fraction of clip width (0..1]. */
  widthFrac: number;
  /** Visible slice start, absolute TIMELINE seconds. */
  startSec: number;
  /** Visible slice end, absolute TIMELINE seconds. */
  endSec: number;
}

/**
 * Returns the visible slice of a clip, or `null` when the clip is entirely off screen.
 *
 * A `null` return is the caller's signal to skip the draw ENTIRELY — that gating is what keeps
 * scroll-driven redraws affordable. Scrolling causes zero canvas redraws today, so windowing adds
 * a redraw class that did not exist; without gating it would be N redraws per frame where N is the
 * number of main-track video clips (10-150 after a Remove Silences pass).
 *
 * Degenerate inputs return `null` rather than throwing. A strip that fails to draw shows the
 * single-frame clip background — the same graceful degradation the filmstrip already relies on
 * while sheets load. Throwing here would take the whole timeline down.
 */
export function computeStripWindow(input: StripWindowInput): StripWindow | null {
  const { clipStart, clipEnd, duration, parentWidth, scrollLeft, viewportWidth, overscanPx } = input;

  // Guard every divisor and reject non-finite input. `duration` and `parentWidth` are both
  // divisors below, and a 0-duration timeline is reachable before metadata resolves.
  if (
    !Number.isFinite(clipStart) ||
    !Number.isFinite(clipEnd) ||
    !Number.isFinite(duration) ||
    !Number.isFinite(parentWidth) ||
    !Number.isFinite(scrollLeft) ||
    !Number.isFinite(viewportWidth) ||
    duration <= 0 ||
    parentWidth <= 0 ||
    viewportWidth <= 0
  ) {
    return null;
  }

  const clipSpanSec = clipEnd - clipStart;
  if (!(clipSpanSec > 0)) return null;

  const pxPerSec = parentWidth / duration;
  const clipLeftPx = clipStart * pxPerSec;
  const clipRightPx = clipEnd * pxPerSec;
  const clipWidthPx = clipRightPx - clipLeftPx;
  if (!(clipWidthPx > 0)) return null;

  // The overscan is clamped non-negative so a caller passing a negative value cannot shrink the
  // window BELOW the viewport, which would leave a visibly undrawn band inside the viewport itself.
  const pad = Math.max(0, overscanPx);
  const viewLeftPx = scrollLeft - pad;
  const viewRightPx = scrollLeft + viewportWidth + pad;

  const visLeftPx = Math.max(clipLeftPx, viewLeftPx);
  const visRightPx = Math.min(clipRightPx, viewRightPx);

  // Entirely off screen — caller skips the draw.
  if (!(visRightPx > visLeftPx)) return null;

  const leftFrac = (visLeftPx - clipLeftPx) / clipWidthPx;
  const widthFrac = (visRightPx - visLeftPx) / clipWidthPx;

  return {
    // Clamp the fractions into [0,1]. Float error at the boundaries can otherwise produce a
    // hair-negative left or a width a hair over 1, and the canvas is NOT clipped by an ancestor
    // (`.twick-track-element` has no `overflow`, deliberately — the reclaim band renders at
    // `left: 100%` and both trim handles carry an 8px `::before` grab margin outside the clip).
    // An over-wide canvas would paint over the neighbouring clip, and the selected clip has
    // `z-index: 10`, so it would paint OVER it rather than under.
    leftFrac: Math.min(1, Math.max(0, leftFrac)),
    widthFrac: Math.min(1 - Math.min(1, Math.max(0, leftFrac)), Math.max(0, widthFrac)),
    startSec: visLeftPx / pxPerSec,
    endSec: visRightPx / pxPerSec,
  };
}

/**
 * Convert a window into the SOURCE-space arguments each strip renderer expects.
 *
 * THE UNIT ASYMMETRY — the trap this function exists to contain. The two renderers do not agree
 * on units, and a shared helper that ignores it is wrong by exactly the playback rate, in exactly
 * one of the two strips, on sped-up clips only:
 *
 *   waveform   `srcSpan`  is SOURCE seconds  — the rate is pre-applied by the caller
 *   filmstrip  `span`     is TIMELINE seconds — the renderer multiplies by playbackRate itself
 *
 * Both take `srcStart`/`sourceStart` in SOURCE seconds, so the windowed offset is rate-scaled for
 * both. Only the SPAN differs. Hence the explicit `spanSpace` argument: there is no safe default.
 */
export function windowToSourceRange(
  win: StripWindow,
  opts: {
    /** Clip start in TIMELINE seconds — the origin the window offset is measured from. */
    clipStart: number;
    /** Committed source offset (`props.time`) plus any live head-trim delta, SOURCE seconds. */
    sourceStart: number;
    /** Clip playback rate. */
    rate: number;
    /** Which space the consuming renderer wants its SPAN in. */
    spanSpace: "source" | "timeline";
  }
): { sourceStart: number; span: number } {
  const rate = Number.isFinite(opts.rate) && opts.rate > 0 ? opts.rate : 1;
  const timelineOffset = Math.max(0, win.startSec - opts.clipStart);
  const timelineSpan = Math.max(0, win.endSec - win.startSec);
  return {
    // The window starts `timelineOffset` timeline-seconds into the clip; in source space that is
    // scaled by the rate. Floored at 0 so a float-negative offset cannot seek behind the file head.
    sourceStart: Math.max(0, opts.sourceStart + timelineOffset * rate),
    span: opts.spanSpace === "source" ? timelineSpan * rate : timelineSpan,
  };
}
