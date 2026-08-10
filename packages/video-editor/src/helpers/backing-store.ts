/**
 * Canvas backing-store sizing for the timeline strip renderers (waveform + filmstrip).
 *
 * THE BUG THIS EXISTS TO FIX (diagnosed 2026-08-09, SILENCE-CARRYOVER.md §6b): both strip
 * canvases were sized `Math.max(1, Math.round(cssWidth * dpr))` — a floor and NO ceiling. The
 * CSS width is the clip's full on-screen width and grows without limit with zoom: at 300% zoom a
 * 157s clip is ~70,000 CSS px ≈ 140,000 device px at dpr 2 — to fill a ~1,500px viewport. Past
 * the browser's canvas dimension cap the allocation does not throw, it silently yields a BLANK
 * surface (the founder's all-white waveform track); under the cap it still reallocates a
 * tens-of-thousands-px backing store per clip per zoom step (`canvas.width =` reallocates,
 * never resizes), which is the zoom slowness.
 *
 * FIX: clamp the backing store to MAX_BACKING_PX and derive the draw transform from the REAL
 * ratio (pxW / cssWidth) instead of assuming dpr. Below the clamp the ratio IS dpr (modulo
 * rounding) and nothing changes; at the clamp the drawing compresses into the store and CSS
 * stretches it back out — soft at extreme zoom, but you are already drawing ~90x more pixels
 * than the screen shows. Visible-but-soft beats white.
 */

/** 8192 is allocatable on every browser/GPU we run on (Chromium's per-dimension cap is far
 *  higher, but 8192 keeps the store under ~1.5MB/strip at 44px tracks and is universally safe). */
export const MAX_BACKING_PX = 8192;

export interface BackingStore {
  /** Clamped device-pixel dimensions to assign to canvas.width/height. */
  pxW: number;
  pxH: number;
  /** Transform scale that maps CSS-coordinate drawing into the (possibly clamped) store. */
  scaleX: number;
  scaleY: number;
}

/** Pure sizing decision — exported for tests. */
export function backingStoreFor(cssWidth: number, cssHeight: number, dpr: number): BackingStore {
  const pxW = Math.max(1, Math.min(MAX_BACKING_PX, Math.round(cssWidth * dpr)));
  const pxH = Math.max(1, Math.min(MAX_BACKING_PX, Math.round(cssHeight * dpr)));
  return {
    pxW,
    pxH,
    scaleX: cssWidth > 0 ? pxW / cssWidth : 1,
    scaleY: cssHeight > 0 ? pxH / cssHeight : 1,
  };
}
