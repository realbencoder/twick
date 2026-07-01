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
}

const BAR_CSS_WIDTH = 2; // px bar
const GAP_CSS_WIDTH = 1; // px hairline gap
const GAMMA = 0.65; // perceptual lift for quiet-mid detail
const MIN_BAR = 1; // px — a faint center tick even in silence keeps the strip continuous

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

  ctx.fillStyle = opts.color ?? "rgba(255,255,255,0.78)";

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

    let peak = 0;
    for (let b = b0; b < b1; b++) {
      const v = wf.peaks[b];
      if (v > peak) peak = v;
    }

    // Perceptual gamma so quiet-mid speech stays visible; mirrored half-height.
    const half = Math.max(MIN_BAR / 2, Math.pow(peak / 255, GAMMA) * halfMax);
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
