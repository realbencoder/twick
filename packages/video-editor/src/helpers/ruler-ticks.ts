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
