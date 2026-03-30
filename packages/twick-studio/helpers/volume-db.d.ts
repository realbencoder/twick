/**
 * Volume conversion between linear (0-1) and dB scale.
 * Used for PlaybackPropsPanel to match professional audio tools (e.g. -60 dB to +6 dB).
 *
 * Formula: dB = 20 * log10(linear)
 * - 0 dB = 1.0 linear (full volume)
 * - -60 dB ≈ 0.001 linear (effectively mute)
 * - +6 dB ≈ 2.0 linear (amplification)
 */
declare const MIN_DB = -60;
declare const MAX_DB = 6;
/**
 * Convert linear volume (0 to ~2) to dB.
 * Returns MIN_DB for linear <= 0 to avoid -Infinity.
 */
export declare function linearToDb(linear: number): number;
/**
 * Convert dB to linear volume.
 * Returns 0 for dB <= MIN_DB (mute).
 */
export declare function dbToLinear(db: number): number;
export { MIN_DB, MAX_DB };
