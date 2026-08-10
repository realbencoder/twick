/**
 * Timeline audio-waveform rendering (mirrored bars) for track elements.
 *
 * DATA: the host app precomputes compact peaks server-side (one 0-255 max-amplitude byte per
 * bucket, per-clip normalized) and registers them via `window.__twick_waveform` — the same
 * app↔vendored-editor bridge pattern as `window.__webcodecs_controller`. The editor never decodes
 * audio client-side, so this works on any machine.
 *
 * DRAW (gold-standard checklist):
 *  - Retina-crisp: canvas backing store scaled by devicePixelRatio.
 *  - Aggregate-MAX downsampling: each drawn bar takes the max of all source peaks in its
 *    time-window — no aliasing/moiré when zoomed out (never sample-skips).
 *  - Split-aware: bars map the element's SOURCE window [srcStart, srcStart+srcSpan] (a split
 *    clip shows its own slice of the waveform, not the start of the file).
 *  - Perceptual gamma (0.65): keeps quiet-mid speech detail visible instead of near-flat bars.
 *  - Premium bar aesthetics: thin bars + hairline gaps, rounded caps, mirrored around a center
 *    baseline, translucent white over the track color.
 *
 * Pure drawing — no React. The component owns when to (re)draw.
 */

export interface TimelineWaveform {
  /** One 0-255 max-amplitude value per bucket (decoded from the stored base64). */
  peaks: Uint8Array;
  /**
   * Phase 6 dB display array (2026-08-09), when the host app has one for this video: per-bucket
   * peak dBFS quantized [DB_DISPLAY_FLOOR, 0] → 0–255, ABSOLUTE (never per-clip normalized),
   * parallel to `peaks`. When present the bars draw from THIS array — dB is already the
   * perceptual scale, so the linear path's displayNorm + GAMMA compensations don't apply.
   * Videos processed before the host app shipped it simply lack it (linear path unchanged).
   */
  dbPeaks?: Uint8Array;
  /** Effective buckets per second of source time. */
  peaksPerSecond: number;
  /** Source duration the peaks cover, in seconds. */
  durationSeconds: number;
}

declare global {
  interface Window {
    /** Set by the host app for the MAIN recording's audio (null/absent = no waveform). */
    __twick_waveform?: TimelineWaveform | null;
  }
}

/** Read + validate the app-registered main-video waveform. */
export function getTimelineWaveform(): TimelineWaveform | null {
  if (typeof window === "undefined") return null;
  const wf = window.__twick_waveform;
  if (!wf || !(wf.peaks instanceof Uint8Array) || wf.peaks.length === 0) return null;
  if (!(wf.peaksPerSecond > 0) || !(wf.durationSeconds > 0)) return null;
  return wf;
}

export interface DrawClipWaveformOpts {
  /** Element's source-time start (props.time), seconds. */
  srcStart: number;
  /** Element's source-time span (timeline span × playbackRate), seconds. */
  srcSpan: number;
  /** CSS pixel size to render at. */
  cssWidth: number;
  cssHeight: number;
  /** devicePixelRatio (clamped by caller if desired). */
  dpr: number;
  /** Bar fill style. Default: translucent white (reads on any track color). */
  color?: string;
  /**
   * Element volume as LINEAR gain (props.volume, 1 = unity). Bar heights scale with it so the
   * waveform reflects the user's volume adjustment (CapCut behavior) — muted draws near-flat,
   * boosted draws taller (clamped at full height).
   */
  gain?: number;
}

const BAR_CSS_WIDTH = 2; // px bar
const GAP_CSS_WIDTH = 1; // px hairline gap
const GAMMA = 0.65; // perceptual lift for quiet-mid detail
const MIN_BAR = 1; // px — a faint center tick even in silence keeps the strip continuous

/**
 * Phase 6 dB display (2026-08-09) — "the timeline stops hiding quiet speech".
 *
 * The linear peaks put −32…−48 dBFS — exactly where word tails and quiet speech live — into six
 * integer values, so −35 dB speech drew at 4/255: visually identical to silence on the strip the
 * founder edits by. `dbPeaks` maps [−70, 0] dBFS linearly onto 0–255, so bar height IS dB:
 * −35 dB speech sits at half height, room tone reads low but visible, digital silence stays flat.
 *
 * No displayNormFactor and no GAMMA on this path — both are compensations for linear-domain
 * crushing (the norm re-references the file's loudest sample; gamma lifts quiet mids), and dB
 * already does that job. Stacking them on top of a log scale would draw room tone at speech
 * height.
 */
const DB_DISPLAY_FLOOR = -70; // dBFS quantized to byte 0 by the host app's generator

/**
 * Bar height fraction (0..1) for one aggregated dB byte, with the clip's volume slider applied
 * as a dB SHIFT (gain 2 ≈ +6 dB ≈ +22 byte-units) rather than a linear multiply — multiplying a
 * log-domain value by gain would be unit nonsense. PURE, exported for tests.
 *
 * Byte 0 means at-or-below the −70 dBFS floor: measured silence. It stays flat at ANY gain — a
 * volume boost must never draw silence as audio.
 */
export function dbBarFraction(dbByte: number, gain: number): number {
  if (!(gain > 0) || !(dbByte > 0)) return 0;
  const shift = (255 / -DB_DISPLAY_FLOOR) * 20 * Math.log10(gain);
  const v = dbByte + shift;
  return v <= 0 ? 0 : v >= 255 ? 1 : v / 255;
}

/**
 * DISPLAY normalization (2026-08-06) — the fix for "the strip reads flat where I'm clearly
 * talking".
 *
 * The stored peaks are normalized by the server to the file's ABSOLUTE loudest sample, so one
 * loud moment sets the scale for the whole recording. Measured on the founder's own 158s take:
 * the peak is his own hook at 3.2s (peakDbfs -0.8), the conversational body sits at a median of
 * 30/255, and after GAMMA that draws 4.4px of a 16px half-height — 46% of all SPEECH buckets
 * rendered under 4px, i.e. visually flat while he is talking. Density cannot fix this (a denser
 * bucket of the same quiet audio is still quiet); the reference is what's wrong.
 *
 * So the STRIP rescales against a high percentile of the file instead of its single loudest
 * sample, and lets the rare loudest moments clip to full height. Same file, measured: speech
 * 4.6px -> 7.8px mean, non-speech 0.8px -> 1.0px (silence stays silent), speech-to-silence
 * separation 6.1x -> 7.8x, flat-speech 46% -> 24%, with only 5.6% of speech buckets clipping.
 *
 * DISPLAY-ONLY, and deliberately so: `wf.peaks` is ALSO the input to the app's auto-silence
 * detector, whose floor (`min(max(p15, 6), p90/6)`) mixes percentiles with an ABSOLUTE constant.
 * Rescaling the stored bytes would silently move that floor and change which pauses get cut.
 * Rescaling here changes pixels only — the detector reads the untouched array. It also needs no
 * re-processing, so every EXISTING video gets the corrected strip on load.
 *
 * The reference is FILE-WIDE, not per drawn slice: clips of one recording must keep their
 * relative loudness, or a quiet clip and a loud clip would both render "full" and the strip would
 * lie in a new way.
 */
const DISPLAY_REF_PERCENTILE = 0.95;
/** Never amplify more than this. The server already normalized to the file peak, so a reference
 *  this far down means a very spiky file; beyond 4x we would be drawing room tone as speech. */
const DISPLAY_NORM_MAX = 4;
/** Below this reference the file is silence/room tone (the server leaves those un-normalized, so
 *  the values are near zero) — amplifying would turn a silent clip into a full-height lie. */
const DISPLAY_NORM_MIN_REF = 8;

/** Cached per peaks array — the waveform object is registered once and swapped rarely, while
 *  draw() runs on every trim/drag/zoom frame. Values are 0-255, so an exact percentile is a
 *  256-bin histogram in one linear pass (no sort). */
const displayNormCache = new WeakMap<Uint8Array, number>();

/**
 * Multiplier applied to every bucket before gamma, so the strip fills the track on real speech.
 * Returns 1 (no change) for silence-only files and for anything already using its full range.
 */
export function displayNormFactor(peaks: Uint8Array): number {
  const cached = displayNormCache.get(peaks);
  if (cached !== undefined) return cached;
  let factor = 1;
  if (peaks.length > 0) {
    const hist = new Uint32Array(256);
    for (let i = 0; i < peaks.length; i++) hist[peaks[i]]++;
    const target = Math.floor(peaks.length * DISPLAY_REF_PERCENTILE);
    let cum = 0;
    let ref = 255;
    for (let v = 0; v < 256; v++) {
      cum += hist[v];
      if (cum >= target) {
        ref = v;
        break;
      }
    }
    if (ref >= DISPLAY_NORM_MIN_REF) {
      factor = Math.min(DISPLAY_NORM_MAX, 255 / ref);
    }
  }
  displayNormCache.set(peaks, factor);
  return factor;
}

/**
 * Draw the element's slice of the waveform as mirrored rounded bars.
 * Returns false when there was nothing to draw (caller may hide the canvas).
 */
export function drawClipWaveform(
  canvas: HTMLCanvasElement,
  wf: TimelineWaveform,
  opts: DrawClipWaveformOpts
): boolean {
  const { srcStart, srcSpan, cssWidth, cssHeight, dpr } = opts;
  if (!(cssWidth > 2) || !(cssHeight > 2) || !(srcSpan > 0)) return false;

  const ctx = canvas.getContext("2d");
  if (!ctx) return false;

  // Retina backing store; draw in CSS-px coordinates.
  const pxW = Math.max(1, Math.round(cssWidth * dpr));
  const pxH = Math.max(1, Math.round(cssHeight * dpr));
  if (canvas.width !== pxW) canvas.width = pxW;
  if (canvas.height !== pxH) canvas.height = pxH;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssWidth, cssHeight);

  const stride = BAR_CSS_WIDTH + GAP_CSS_WIDTH;
  const barCount = Math.max(1, Math.floor(cssWidth / stride));
  const secPerBar = srcSpan / barCount;
  const mid = cssHeight / 2;
  const halfMax = mid - 0.5;

  // Subtle bottom scrim so white bars stay readable over bright clip thumbnails (the clip body
  // draws its frame thumbnail as backgroundImage:cover behind this canvas). Fades to transparent
  // at the top of the strip — invisible over dark footage, just enough contrast over bright.
  const scrim = ctx.createLinearGradient(0, 0, 0, cssHeight);
  scrim.addColorStop(0, "rgba(0,0,0,0.10)");
  scrim.addColorStop(1, "rgba(0,0,0,0.50)");
  ctx.fillStyle = scrim;
  ctx.fillRect(0, 0, cssWidth, cssHeight);

  ctx.fillStyle = opts.color ?? "rgba(255,255,255,0.78)";
  // Clip volume as linear gain — bars mirror the user's volume slider (0 = flat, >1 = taller).
  const gain = Math.max(0, opts.gain ?? 1);
  // Phase 6: draw from the dB array when the host app provided one (see DB_DISPLAY_FLOOR above).
  // Length-mismatch means a corrupt payload — fall back to the linear path rather than guessing
  // at an index mapping.
  const db =
    wf.dbPeaks instanceof Uint8Array && wf.dbPeaks.length === wf.peaks.length ? wf.dbPeaks : null;
  // Rescale against the file's 95th percentile instead of its single loudest sample, so ordinary
  // speech fills the track instead of being crushed by one loud moment (see DISPLAY_* above).
  // Linear path only — the dB mapping is its own perceptual reference.
  const displayNorm = db ? 1 : displayNormFactor(wf.peaks);

  const roundRect =
    typeof (ctx as CanvasRenderingContext2D & { roundRect?: unknown }).roundRect === "function";

  for (let i = 0; i < barCount; i++) {
    // Source-time window for this bar → peak-bucket index range (aggregate MAX, no skipping).
    const t0 = srcStart + i * secPerBar;
    const t1 = t0 + secPerBar;
    let b0 = Math.floor(t0 * wf.peaksPerSecond);
    let b1 = Math.ceil(t1 * wf.peaksPerSecond);
    if (b1 <= b0) b1 = b0 + 1;
    if (b0 < 0) b0 = 0;
    if (b1 > wf.peaks.length) b1 = wf.peaks.length;

    const src = db ?? wf.peaks;
    let peak = 0;
    for (let b = b0; b < b1; b++) {
      const v = src[b];
      if (v > peak) peak = v;
    }

    // dB path: height IS dB (linear over [−70, 0]), volume applied as a dB shift.
    // Linear path: perceptual gamma so quiet-mid speech stays visible; gain applied pre-gamma so
    // the bars track the clip's EFFECTIVE loudness (clamped at unity), and displayNorm ahead of
    // it so the strip is referenced to typical speech, not the one loudest sample in the file.
    const frac = db
      ? dbBarFraction(peak, gain)
      : Math.pow(Math.min(1, (peak / 255) * displayNorm * gain), GAMMA);
    const half = Math.max(MIN_BAR / 2, frac * halfMax);
    const x = i * stride;
    const y = mid - half;
    const h = half * 2;

    if (roundRect) {
      ctx.beginPath();
      ctx.roundRect(x, y, BAR_CSS_WIDTH, h, BAR_CSS_WIDTH / 2);
      ctx.fill();
    } else {
      ctx.fillRect(x, y, BAR_CSS_WIDTH, h);
    }
  }
  return true;
}
