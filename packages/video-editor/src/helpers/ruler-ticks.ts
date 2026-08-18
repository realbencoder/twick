/**
 * The two pure decisions behind the timeline ruler: how far apart the ticks go, and how a label
 * reads. Extracted from seek-track.tsx so they can be EXECUTED by a test rather than grepped for.
 *
 * WHY EXTRACTED. Marker tests that string-match the built bundle let nine distinct silent reverts
 * through on an earlier change in this package — including one that made a whole feature inert.
 * On fork code nothing lints and the dist is a separate artifact from the source the fork's own
 * tests import, so a test that cannot run the behaviour is decoration. These two functions carry
 * all the logic that was wrong, so these are the two worth being able to call.
 */

/** [majorSeconds, minorSubdivisions] — minors chosen so a minor tick never falls below ~10px. */
export const NICE_TICK_INTERVALS: Array<[number, number]> = [
  [0.1, 2], [0.25, 5], [0.5, 5], [1, 4], [2, 4], [5, 5], [10, 5],
  [15, 3], [30, 6], [60, 4], [120, 4], [300, 5], [600, 5], [900, 3], [1800, 6], [3600, 6],
];

/** Labels sit a comfortable ~96px apart at any zoom. */
export const TARGET_LABEL_PX = 96;

/**
 * Density safety net. It used to be measured against the whole DURATION, with zoom absent from the
 * expression — which meant it ran after the zoom-aware choice below and simply overrode it: a
 * 1454s video needs a step of at least 1454/300 = 4.85s to stay under MAX_MAJORS, so it was pinned
 * to 5-10s ticks at EVERY zoom level while a 142s video got second-by-second. Now that the ruler
 * renders only the visible window, this is measured against the VISIBLE span and stops binding in
 * normal use.
 */
export const MAX_MAJORS = 300;
export const MAX_MINORS = 700;

export interface TickInterval {
  majorIntervalSec: number;
  minorIntervalSec: number;
}

/**
 * Choose the tick interval for the CURRENT zoom.
 *
 * @param pxPerSec   pixels per second at the current zoom
 * @param spanSec    the span the cap is measured against — the VISIBLE span, not the duration.
 *                   Callers pass the whole duration only before the viewport has been measured.
 */
export function chooseTickInterval(pxPerSec: number, spanSec: number): TickInterval {
  const pps = Number.isFinite(pxPerSec) && pxPerSec > 0 ? pxPerSec : 1;
  const span = Number.isFinite(spanSec) && spanSec > 0 ? spanSec : 1;
  const idealSec = TARGET_LABEL_PX / pps;

  let idx = NICE_TICK_INTERVALS.length - 1;
  for (let k = 0; k < NICE_TICK_INTERVALS.length; k++) {
    if (NICE_TICK_INTERVALS[k][0] >= idealSec) { idx = k; break; }
  }
  while (idx < NICE_TICK_INTERVALS.length - 1 && span / NICE_TICK_INTERVALS[idx][0] > MAX_MAJORS) idx++;
  let [major, minorSub] = NICE_TICK_INTERVALS[idx];
  while (minorSub > 1 && span / (major / minorSub) > MAX_MINORS) {
    minorSub = Math.max(1, Math.floor(minorSub / 2));
  }
  return { majorIntervalSec: major, minorIntervalSec: minorSub > 0 ? major / minorSub : major };
}

/**
 * Format a ruler label.
 *
 * PRECISION FOLLOWS THE TICK INTERVAL, NEVER THE DURATION. The old version took the clock branch on
 * `duration >= 60` and then always printed whole seconds, making the sub-second branch unreachable
 * for any video over a minute: at a 0.5s interval it printed "0:01, 0:01, 0:02, 0:02" — adjacent
 * labels identical, so you could not tell which tick was which while trimming. That fired on the
 * 83-second average recording at ~2x zoom. Windowing the ruler makes sub-second intervals reachable
 * on long videos too, so the two fixes had to ship together or the defect would have gone universal.
 *
 * Clock format (m:ss) once the scale is a minute or coarser, or the video itself is >= 1 min —
 * "0:05" reads better than "5s" on a long timeline. Short videos keep the terser "5s".
 */
export function formatRulerLabel(t: number, majorIntervalSec: number, duration: number): string {
  const subSecond = majorIntervalSec < 1;
  const clock = majorIntervalSec >= 60 || duration >= 60;
  if (clock) {
    // Round the TOTAL before splitting. Rounding the seconds part alone yields "1:60" at 59.6s.
    if (subSecond) {
      const total = Math.round(t * 10) / 10;
      const m = Math.floor(total / 60);
      const s = total - m * 60;
      return `${m}:${s.toFixed(1).padStart(4, "0")}`;
    }
    const total = Math.round(t);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }
  return subSecond ? `${t.toFixed(1)}s` : `${Math.round(t)}s`;
}

/**
 * Choose the tick interval from GEOMETRY, deriving the visible span itself.
 *
 * THIS EXISTS BECAUSE OF THE BUG IT MAKES TESTABLE. `chooseTickInterval` takes a span, so a test
 * that hands it `viewportWidth / pxPerSec` proves the arithmetic and proves NOTHING about where
 * that width came from. The first attempt at this feature measured the ruler's OWN element —
 * which is laid out at content width and never overflows — so the terms cancelled
 * (`contentWidth / (contentWidth / duration)` === `duration`) and the ruler stayed zoom-blind at
 * every zoom level. Twelve executed tests passed against it, and the suite's own must-fail
 * control used the duration as its span, i.e. it encoded the live bug as the expected failure.
 *
 * Taking the WIDTH moves that mistake inside the function, where a test can express it: pass the
 * content width and you get the coarse (wrong) answer, pass the real viewport width and you get
 * the fine one. A revert to measuring the wrong element collapses the two into the same number
 * and the comparison fails.
 *
 * @param viewportWidth  px of ruler ACTUALLY ON SCREEN — the horizontal scroller's clientWidth,
 *                       NOT the content width. `null` before the first measurement, which falls
 *                       back to the whole duration (today's behaviour, for one frame).
 */
export function planRulerTicks(input: {
  duration: number;
  pxPerSec: number;
  viewportWidth: number | null;
}): TickInterval {
  const { duration, pxPerSec, viewportWidth } = input;
  const safePxPerSec = pxPerSec > 0 ? pxPerSec : 1;
  const spanSec =
    viewportWidth != null && viewportWidth > 0 ? viewportWidth / safePxPerSec : duration;
  return chooseTickInterval(safePxPerSec, spanSec);
}

/**
 * Tick-index quantisation block — see `planTickRange`.
 *
 * The rendered range is rounded OUT to a multiple of this so it changes once per block instead of
 * once per tick. That is what stops playback rebuilding the ruler at the playhead rate: the
 * timeline auto-scrolls to follow the playhead, and before this the range moved on every tick
 * crossed. Measured on a 1454s video at 200% zoom: 9.5 ruler rebuilds and ~1,724 tick divs created
 * per second of playback, where the pre-windowing build did zero ruler work while playing.
 *
 * 50 costs at most 100 extra tick divs (against ~110-160 drawn) and they sit OUTSIDE the visible
 * band, since the overscan already covers a full viewport each side.
 */
export const RANGE_BLOCK = 50;

/** Overscan: draw one viewport-width beyond each edge so a small scroll never exposes a bare strip. */
export const RULER_OVERSCAN_VIEWPORTS = 1;

export interface TickRange {
  /** First minor-tick INDEX to draw (multiply by minorIntervalSec for its time). */
  firstMinor: number;
  /** Last minor-tick index to draw, inclusive. */
  lastMinor: number;
}

/**
 * Which tick indices should the ruler actually render?
 *
 * EXTRACTED BECAUSE IT HAD NO EXECUTED COVERAGE. An adversarial review of the first version of
 * this feature found that every test exercised interval SELECTION and none exercised which ticks
 * get DRAWN — so the overscan could be deleted, or the range hardcoded, with the whole suite
 * green. That is the same shape that let a completely inert version of this feature ship past
 * twelve passing tests: the pure decision was proven, the wiring around it was not.
 *
 * Windowing is not a nicety here. It is what permits relaxing the density cap at all: on a 1454s
 * video at 200% zoom, second-by-second ticks across the full timeline would be 14,540 absolutely
 * positioned divs. Windowed, it is ~160.
 *
 * @param viewport `null` before the first measurement — falls back to the WHOLE duration, which is
 *                 the pre-windowing behaviour, for one frame.
 */
export function planTickRange(input: {
  duration: number;
  pxPerSec: number;
  minorIntervalSec: number;
  viewport: { scrollLeft: number; width: number } | null;
}): TickRange {
  const { duration, minorIntervalSec, viewport } = input;
  const epsilon = 1e-6;
  const pxPerSec = input.pxPerSec > 0 ? input.pxPerSec : 1;
  const minor = minorIntervalSec > 0 ? minorIntervalSec : 1;

  // Clamped to [0, duration] at BOTH ends. `toT` was already capped at duration while `fromT` was
  // only floored at 0, so a scrollLeft past the content produced firstMinor > lastMinor — and the
  // render loop is `for (i = firstMinor; i <= lastMinor; i++)`, which then draws NOTHING. A blank
  // ruler, from an inverted range, with no error. Browsers clamp scrollLeft to the scrollable
  // extent so this is not reachable today, but "not reachable today" is how the last silent no-op
  // in this file survived review.
  const fromT = viewport
    ? Math.min(duration, Math.max(0, (viewport.scrollLeft - viewport.width * RULER_OVERSCAN_VIEWPORTS) / pxPerSec))
    : 0;
  const toT = viewport
    ? Math.min(duration, (viewport.scrollLeft + viewport.width * (1 + RULER_OVERSCAN_VIEWPORTS)) / pxPerSec)
    : duration;

  const rawFirst = Math.max(0, Math.floor((fromT + epsilon) / minor));
  const rawLast = Math.floor((toT + epsilon) / minor);
  const firstMinor = Math.max(0, Math.floor(rawFirst / RANGE_BLOCK) * RANGE_BLOCK);
  return {
    firstMinor,
    // Belt-and-braces, and REDUNDANT given the fromT clamp above — mutation testing showed
    // removing this changes no result, because clamping fromT to duration already forces
    // rawFirst <= rawLast. Kept because an inverted range renders an empty ruler SILENTLY (the
    // draw loop is `for (i = firstMinor; i <= lastMinor; i++)`), and that is a bad thing to leave
    // one refactor away. Do not write a test claiming to cover it; nothing can reach it.
    lastMinor: Math.max(firstMinor, Math.ceil((rawLast + 1) / RANGE_BLOCK) * RANGE_BLOCK),
  };
}
