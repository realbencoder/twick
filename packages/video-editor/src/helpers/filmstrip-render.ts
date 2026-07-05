/**
 * Timeline filmstrip renderer — draws a row of frames across a main-video clip so the clip visually
 * shows its content progression (scene changes are visible before you cut), instead of one stretched
 * frame. Frames come from the server-generated scrub STORYBOARD sprite sheets (the same JPEGs the
 * editor's never-black scrub floor uses) — the app registers them on `window.__twick_filmstrip`
 * (mirrors the `__twick_waveform` bridge). Sheets are loaded with NO crossOrigin and only ever
 * `drawImage`'d onto a DISPLAY canvas (never read back / toDataURL'd), so — unlike the single-frame
 * thumbnail extractor — this can NEVER taint a canvas or fail on a CORS-less CDN response.
 */

export interface FilmstripMeta {
  interval: number; // seconds of SOURCE time between adjacent tiles
  tileW: number;
  tileH: number;
  cols: number;
  rows: number;
  tilesPerSheet: number;
  sheetCount: number;
  totalTiles: number;
  sheetUrls: (string | null)[]; // presigned per sheet; index 0 → sb_001.jpg
}

/** Read the app-registered storyboard metadata (null when the video has no storyboard). */
export function getFilmstripMeta(): FilmstripMeta | null {
  try {
    const m = (window as unknown as { __twick_filmstrip?: FilmstripMeta }).__twick_filmstrip;
    if (!m || !Array.isArray(m.sheetUrls) || !(m.interval > 0) || !(m.totalTiles > 0)) return null;
    return m;
  } catch {
    return null;
  }
}

// BOUNDED, DOWNSCALED module-level sheet cache. A filmstrip draws frames from across a clip's WHOLE
// span simultaneously (unlike scrub, which shows one frame near the playhead), so a full-length clip
// can touch every sheet of a video at once — an 8-sheet cap of full-res sheets would thrash. Instead
// we DOWNSCALE each sheet on load into a small offscreen canvas, cache it, and free the full <img>.
// The downscale is chosen so each cached TILE stays ≥ TARGET_TILE_H px tall — always at least what
// a retina timeline shows (~88px = 44px track × dpr 2), so the on-screen draw only ever downsamples,
// never upsamples: PROVABLY no visible quality loss for portrait (480px tiles) OR landscape (270px
// tiles). Result: an entire video's sheets fit in ~tens of MB, no thrash, no per-video pileup. Still
// LRU-capped as a backstop, and clearFilmstripCache() is exported for editor unmount / video switch.
const TARGET_TILE_H = 120; // ≥ the ~88px retina display height + headroom → downsample-only draw
const MAX_SHEETS = 48; // one video's sheets max ~36 (TILE_BUDGET 900 / 25 per sheet); headroom
// Per-video downscale so cached tiles are ~TARGET_TILE_H tall (never upscaled: cap at 1). tileH is
// 480 (portrait) or 270 (landscape). All sheets of one video share tileH → one consistent scale.
function scaleForTile(tileH: number): number {
  return Math.min(1, TARGET_TILE_H / Math.max(1, tileH));
}
const SHEET_CACHE = new Map<string, HTMLCanvasElement>(); // insertion-ordered → LRU, downscaled
const SHEET_ERRORS = new Set<string>(); // load-failed URLs — never retried, tiny
// Per-URL set of redraw callbacks waiting on an in-flight load — ALL fire when the sheet decodes
// (multiple clips can share a sheet; firing only the first caller's callback would leave the others
// blank until an unrelated redraw).
const SHEET_WAITERS = new Map<string, Set<() => void>>();

function touchLRU(url: string, sheet: HTMLCanvasElement): void {
  SHEET_CACHE.delete(url);
  SHEET_CACHE.set(url, sheet); // re-insert at MRU end
  while (SHEET_CACHE.size > MAX_SHEETS) {
    const oldest = SHEET_CACHE.keys().next().value as string | undefined;
    if (oldest === undefined) break;
    const evicted = SHEET_CACHE.get(oldest);
    SHEET_CACHE.delete(oldest);
    if (evicted) { evicted.width = 0; evicted.height = 0; } // free the backing store
  }
}

/** Drop every cached sheet + pending waiter. Called on editor unmount / video switch. */
export function clearFilmstripCache(): void {
  SHEET_CACHE.forEach((c) => { c.width = 0; c.height = 0; });
  SHEET_CACHE.clear();
  SHEET_ERRORS.clear();
  SHEET_WAITERS.clear();
}

/**
 * Return the downscaled sheet canvas for `url` if cached, else kick off a one-time load + downscale
 * (by `scale`) and return null. `onLoad` fires once ready so the caller can redraw. No crossOrigin
 * — draw-only. `scale` is consistent per video (derived from tileH), so a URL always loads once.
 */
function ensureSheet(url: string, scale: number, onLoad: () => void): HTMLCanvasElement | null {
  if (SHEET_ERRORS.has(url)) return null;
  const cached = SHEET_CACHE.get(url);
  if (cached) {
    touchLRU(url, cached); // mark MRU so an actively-used sheet isn't evicted
    return cached;
  }

  const existing = SHEET_WAITERS.get(url);
  if (existing) {
    existing.add(onLoad); // load already in flight — just join its waiters
    return null;
  }

  const waiters = new Set<() => void>([onLoad]);
  SHEET_WAITERS.set(url, waiters);
  const img = new Image();
  img.onload = () => {
    SHEET_WAITERS.delete(url);
    // Downscale into a small offscreen canvas, then let the full <img> be GC'd. (drawImage of a
    // cross-origin img taints the offscreen canvas, but we only ever drawImage it onward — never
    // read it back — so the taint is inert.)
    const w = Math.max(1, Math.round((img.naturalWidth || 1) * scale));
    const h = Math.max(1, Math.round((img.naturalHeight || 1) * scale));
    const off = document.createElement("canvas");
    off.width = w;
    off.height = h;
    const octx = off.getContext("2d");
    if (!octx) {
      SHEET_ERRORS.add(url);
      return;
    }
    octx.imageSmoothingQuality = "high";
    octx.drawImage(img, 0, 0, w, h);
    touchLRU(url, off);
    waiters.forEach((cb) => {
      try {
        cb();
      } catch {
        /* a stale/unmounted clip's redraw — ignore */
      }
    });
  };
  img.onerror = () => {
    SHEET_ERRORS.add(url);
    SHEET_WAITERS.delete(url);
  };
  img.src = url;
  return null;
}

/**
 * Locate the sprite-sheet sub-rect for a SOURCE time (mirrors StoryboardSheets), pre-scaled by the
 * per-video `scale` so it indexes into the downscaled cached canvas.
 */
function locateTile(
  meta: FilmstripMeta,
  sourceTime: number,
  scale: number
): { sheetIdx: number; sx: number; sy: number; sw: number; sh: number } {
  const idx = Math.max(0, Math.min(meta.totalTiles - 1, Math.floor(sourceTime / meta.interval)));
  const sheetIdx = Math.floor(idx / meta.tilesPerSheet); // 0-indexed into sheetUrls
  const within = idx % meta.tilesPerSheet;
  const col = within % meta.cols;
  const row = Math.floor(within / meta.cols);
  return {
    sheetIdx,
    sx: col * meta.tileW * scale,
    sy: row * meta.tileH * scale,
    sw: meta.tileW * scale,
    sh: meta.tileH * scale,
  };
}

export interface DrawFilmstripOpts {
  sourceStart: number; // props.time — the clip's source offset in seconds
  span: number; // clip timeline duration (e - s) in seconds
  playbackRate: number; // 1 unless the clip is sped up/slowed
  widthPx: number; // clip's rendered width in CSS px
  heightPx: number; // clip's rendered height in CSS px
  dpr: number; // devicePixelRatio for crisp frames
}

/**
 * Draw the filmstrip for one clip onto `canvas`. Samples one frame per ~frame-width across the clip,
 * mapping each sample's position → SOURCE time → storyboard tile. Unloaded sheets leave that frame
 * transparent (the single-frame background thumbnail shows through until the sheet decodes, then
 * `onSheetLoad` triggers a redraw) — a graceful progressive load, never a black gap.
 */
export function drawClipFilmstrip(
  canvas: HTMLCanvasElement,
  meta: FilmstripMeta,
  opts: DrawFilmstripOpts,
  onSheetLoad: () => void
): void {
  const { sourceStart, span, playbackRate, widthPx, heightPx, dpr } = opts;
  if (widthPx <= 0 || heightPx <= 0) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // BUG-1 FIX: set ONLY the backing store from the measured CSS size — never `canvas.style.width/
  // height`. The JSX gives the canvas `position:absolute; inset:0` (fills the clip); pinning an
  // inline px width overrode that and froze the canvas at its first-draw width, so a zoom-in widened
  // the clip but not the canvas → the filmstrip only covered the left and the rest went bare. The
  // waveform canvas avoids exactly this — it also sets only canvas.width/height and lets CSS drive
  // display size. (Guard the assignment so an unchanged size doesn't needlessly re-clear.)
  const bw = Math.max(1, Math.round(widthPx * dpr));
  const bh = Math.max(1, Math.round(heightPx * dpr));
  if (canvas.width !== bw) canvas.width = bw;
  if (canvas.height !== bh) canvas.height = bh;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, widthPx, heightPx);

  const frameAspect = meta.tileW / (meta.tileH || 1);
  // Aspect-correct target frame width; the COUNT is capped so a very wide clip doesn't blit hundreds
  // of frames per paint.
  const idealW = Math.max(24, Math.round(heightPx * frameAspect));
  const n = Math.max(1, Math.min(120, Math.ceil(widthPx / idealW)));
  // BUG-2 FIX: slot each frame at widthPx/n so the n frames TILE the clip edge-to-edge. When the
  // count isn't capped this equals the aspect-correct width; when it IS (very wide clip), frames get
  // slightly wider instead of leaving the right side bare (the old fixed-idealW spacing left a gap
  // past idealW*120).
  const slotW = widthPx / n;
  const rate = playbackRate > 0 ? playbackRate : 1;
  // Per-video downscale (consistent across every sheet of this video) so cached tiles stay ≥ the
  // on-screen frame height — the cache stores at this scale and the sub-rects index at this scale.
  const scale = scaleForTile(meta.tileH);

  for (let i = 0; i < n; i++) {
    // Sample the CENTER of each frame slot → source time (honors cuts/reorders via sourceStart).
    const frac = (i + 0.5) / n;
    const sourceTime = sourceStart + frac * span * rate;
    const loc = locateTile(meta, sourceTime, scale);
    const url = meta.sheetUrls[loc.sheetIdx];
    if (!url) continue;
    const img = ensureSheet(url, scale, onSheetLoad);
    if (!img) continue; // still loading — leave transparent, redraw on load
    const dx = i * slotW;
    // Last slot reaches widthPx exactly; the min is float-safety.
    const drawW = Math.min(slotW, widthPx - dx);
    if (drawW <= 0.5) break;
    try {
      ctx.drawImage(img, loc.sx, loc.sy, loc.sw, loc.sh, dx, 0, drawW, heightPx);
    } catch {
      // drawImage can throw only on a broken img; treat as blank for this frame.
    }
  }
}
