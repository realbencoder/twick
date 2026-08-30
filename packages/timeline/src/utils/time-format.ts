/**
 * Time formatting utilities for timeline display.
 * Pure functions, suitable for unit testing.
 *
 * @module time-format
 */

/**
 * NOTE: the transport no longer uses this — see `formatTimeTenths`. Retained because it is public
 * API of @twick/timeline (index.ts does `export * from "./utils/time-format"`).
 *
 * Formats time in seconds to MM:SS.FF (minutes:seconds.frames).
 * Frame count is zero-padded to 2 digits for standard frame rates.
 *
 * @param timeSeconds - Time in seconds (can be fractional)
 * @param fps - Frames per second (default: 30)
 * @returns Formatted string e.g. "01:23.15" for 1m 23.5s at 30fps
 *
 * @example
 * ```ts
 * formatTimeWithFrames(0, 30)      // "00:00.00"
 * formatTimeWithFrames(65.5, 30)   // "01:05.15"
 * formatTimeWithFrames(90, 24)     // "01:30.00"
 * ```
 */
export function formatTimeWithFrames(
  timeSeconds: number,
  fps: number = 30
): string {
  const totalSeconds = Math.max(0, timeSeconds);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const frames = Math.floor((totalSeconds % 1) * fps);

  const mm = minutes.toString().padStart(2, "0");
  const ss = seconds.toString().padStart(2, "0");
  const ff = frames.toString().padStart(2, "0");

  return `${mm}:${ss}.${ff}`;
}

/**
 * Formats time in seconds to MM:SS (minutes:seconds, no frames).
 *
 * @param timeSeconds - Time in seconds
 * @returns Formatted string e.g. "01:23"
 *
 * @example
 * ```ts
 * formatTimeSimple(65.5)  // "01:05"
 * ```
 */
export function formatTimeSimple(timeSeconds: number): string {
  const totalSeconds = Math.max(0, timeSeconds);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);

  const mm = minutes.toString().padStart(2, "0");
  const ss = seconds.toString().padStart(2, "0");

  return `${mm}:${ss}`;
}

/**
 * Formats time in seconds to M:SS.d — minutes unpadded, seconds zero-padded to 2, one decimal.
 *
 * This is the ruler's arm, verbatim (`formatRulerLabel`, video-editor/src/helpers/ruler-ticks.ts,
 * the `subSecond && clock` branch). It is copied rather than hand-rolled for one reason, which
 * that function's own comment states: ROUND THE TOTAL BEFORE SPLITTING. Rounding the seconds part
 * alone yields "1:60" at 59.6s. Verified over a 3.6M-sample sweep of 0-3600s at 1ms: zero ":60."
 * outputs and zero three-digit second fields.
 *
 * One decimal at 30fps is ~3-frame granularity. Two decimals were rejected as visual noise at the
 * transport's 20Hz update rate.
 *
 * @param timeSeconds - Time in seconds (can be fractional; negatives clamp to 0)
 * @returns Formatted string e.g. "0:20.5", "24:14.0"
 *
 * @example
 * ```ts
 * formatTimeTenths(0.5)   // "0:00.5"
 * formatTimeTenths(20.5)  // "0:20.5"
 * formatTimeTenths(59.96) // "1:00.0"  — not "0:60.0"
 * formatTimeTenths(1454)  // "24:14.0"
 * ```
 */
export function formatTimeTenths(timeSeconds: number): string {
  const total = Math.round(Math.max(0, timeSeconds) * 10) / 10;
  const m = Math.floor(total / 60);
  const s = total - m * 60;
  return `${m}:${s.toFixed(1).padStart(4, "0")}`;
}
