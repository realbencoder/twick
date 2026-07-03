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

// Module-level sheet cache, shared across every clip (sheets are reused between clips + redraws).
// Value: a decoded <img> ready to draw, or 'error' (load failed — never retried, degrades to blank).
const SHEET_CACHE = new Map<string, HTMLImageElement | "error">();
// Per-URL set of redraw callbacks waiting on an in-flight load — ALL fire when the sheet decodes
// (multiple clips can share a sheet; firing only the first caller's callback would leave the others
// blank until an unrelated redraw).
const SHEET_WAITERS = new Map<string, Set<() => void>>();

/**
 * Return the decoded sheet for `url` if cached, else kick off a one-time load and return null.
 * `onLoad` fires once the sheet decodes so the caller can redraw. No crossOrigin — draw-only.
 */
function ensureSheet(url: string, onLoad: () => void): HTMLImageElement | null {
  const cached = SHEET_CACHE.get(url);
  if (cached === "error") return null;
  if (cached) return cached;

  const existing = SHEET_WAITERS.get(url);
  if (existing) {
    existing.add(onLoad); // load already in flight — just join its waiters
    return null;
  }

  const waiters = new Set<() => void>([onLoad]);
  SHEET_WAITERS.set(url, waiters);
  const img = new Image();
  img.onload = () => {
    SHEET_CACHE.set(url, img);
    SHEET_WAITERS.delete(url);
    waiters.forEach((cb) => {
      try {
        cb();
      } catch {
        /* a stale/unmounted clip's redraw — ignore */
      }
    });
  };
  img.onerror = () => {
    SHEET_CACHE.set(url, "error");
    SHEET_WAITERS.delete(url);
  };
  img.src = url;
  return null;
}

/** Locate the sprite-sheet sub-rect for a SOURCE time (pure arithmetic — mirrors StoryboardSheets). */
function locateTile(
  meta: FilmstripMeta,
  sourceTime: number
): { sheetIdx: number; sx: number; sy: number; sw: number; sh: number } {
  const idx = Math.max(0, Math.min(meta.totalTiles - 1, Math.floor(sourceTime / meta.interval)));
  const sheetIdx = Math.floor(idx / meta.tilesPerSheet); // 0-indexed into sheetUrls
  const within = idx % meta.tilesPerSheet;
  const col = within % meta.cols;
  const row = Math.floor(within / meta.cols);
  return { sheetIdx, sx: col * meta.tileW, sy: row * meta.tileH, sw: meta.tileW, sh: meta.tileH };
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

  canvas.width = Math.max(1, Math.round(widthPx * dpr));
  canvas.height = Math.max(1, Math.round(heightPx * dpr));
  canvas.style.width = `${widthPx}px`;
  canvas.style.height = `${heightPx}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, widthPx, heightPx);

  // Each frame keeps the tile's aspect; cap the count so a very long clip doesn't blit hundreds of
  // frames per paint (16 frames min-width when the aspect makes them tiny).
  const frameAspect = meta.tileW / (meta.tileH || 1);
  const frameW = Math.max(24, Math.round(heightPx * frameAspect));
  const n = Math.max(1, Math.min(120, Math.ceil(widthPx / frameW)));
  const rate = playbackRate > 0 ? playbackRate : 1;

  for (let i = 0; i < n; i++) {
    // Sample the CENTER of each frame slot → source time (honors cuts/reorders via sourceStart).
    const frac = (i + 0.5) / n;
    const sourceTime = sourceStart + frac * span * rate;
    const loc = locateTile(meta, sourceTime);
    const url = meta.sheetUrls[loc.sheetIdx];
    if (!url) continue;
    const img = ensureSheet(url, onSheetLoad);
    if (!img) continue; // still loading — leave transparent, redraw on load
    const dx = i * frameW;
    // Last frame may overrun; clamp its width so it doesn't spill past the clip edge.
    const drawW = Math.min(frameW, widthPx - dx);
    if (drawW <= 0) break;
    try {
      ctx.drawImage(img, loc.sx, loc.sy, loc.sw, loc.sh, dx, 0, drawW, heightPx);
    } catch {
      // drawImage can throw only on a broken img; treat as blank for this frame.
    }
  }
}
