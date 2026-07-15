/**
 * REPRODUCTION of the timeline-filmstrip freeze (storyboard videos, slow wifi).
 *
 * A full-length clip's filmstrip draws frames from ALL of a video's storyboard sheets at once. On
 * slow wifi the sheets arrive one at a time, and each arrival fires the clip's "redraw" callback.
 * The BUG: track-element.tsx passes a FRESH `() => draw()` closure on every redraw, and
 * filmstrip-render's `ensureSheet` accumulates every distinct callback in a per-sheet waiter Set,
 * firing them ALL when a sheet loads. So each sheet-load re-subscribes a new callback to every
 * still-loading sheet → redraws multiply 1,2,4,8,… → the main thread drowns → page unresponsive.
 *
 * This test drives the REAL `drawClipFilmstrip` (with minimal DOM stubs) two ways:
 *   - "fresh callback" (current behaviour)  → asserts the redraw count EXPLODES exponentially.
 *   - "stable callback" (the fix)           → asserts the redraw count stays LINEAR (~1 per sheet).
 *
 * Run: npx vitest run --root ~/Downloads/twick/packages/video-editor/src/helpers filmstrip-cascade
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { drawClipFilmstrip, clearFilmstripCache, type FilmstripMeta } from './filmstrip-render';

// ---- minimal DOM stubs (node env; no jsdom needed) ------------------------------------------------
const createdImages: MockImage[] = [];
class MockImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  naturalWidth = 2400;
  naturalHeight = 1350;
  private _src = '';
  set src(v: string) {
    this._src = v;
    if (v) createdImages.push(this); // a real sheet-load request (ensureSheet also does img.src='' to free)
  }
  get src() {
    return this._src;
  }
}
const ctxStub = {
  imageSmoothingQuality: 'high',
  setTransform() {},
  clearRect() {},
  drawImage() {},
};
function canvasStub(clientWidth: number, clientHeight: number) {
  return {
    width: 0,
    height: 0,
    clientWidth,
    clientHeight,
    getContext: () => ctxStub,
  } as unknown as HTMLCanvasElement;
}

const origImage = (globalThis as any).Image;
const origDocument = (globalThis as any).document;
beforeEach(() => {
  createdImages.length = 0;
  clearFilmstripCache();
  (globalThis as any).Image = MockImage;
  (globalThis as any).document = { createElement: (tag: string) => (tag === 'canvas' ? canvasStub(1, 1) : {}) };
});
afterEach(() => {
  (globalThis as any).Image = origImage;
  (globalThis as any).document = origDocument;
});

// A 20-sheet video (25 tiles/sheet → 500 tiles → 250s at 0.5s/tile). A wide clip so the frame loop
// samples across the WHOLE span and touches every sheet — exactly the full-length-clip case.
const meta: FilmstripMeta = {
  interval: 0.5,
  tileW: 480,
  tileH: 270,
  cols: 5,
  rows: 5,
  tilesPerSheet: 25,
  sheetCount: 20,
  totalTiles: 500,
  sheetUrls: Array.from({ length: 20 }, (_, i) => `https://cdn/sb_${String(i + 1).padStart(3, '0')}.jpg`),
};
const opts = { sourceStart: 0, span: 250, playbackRate: 1, widthPx: 8000, heightPx: 44, dpr: 2 };

/** Fire the next N still-unfired sheet <img> onloads in creation order = sequential slow-wifi arrival. */
function loadSheetsSequentially(fired: Set<MockImage>, maxToFire: number): void {
  let n = 0;
  while (n < maxToFire) {
    const next = createdImages.find((img) => !fired.has(img));
    if (!next) break;
    fired.add(next);
    next.onload?.(); // SYNCHRONOUS: fires all its accumulated waiters → each triggers a redraw
    n++;
  }
}

describe('filmstrip redraw cascade (the open-a-storyboard-video freeze)', () => {
  it('BUG: a fresh callback per redraw makes redraws EXPLODE exponentially as sheets load', () => {
    let drawCount = 0;
    const draw = () => {
      drawCount++;
      // The bug: a NEW closure every draw → ensureSheet stores each one → they all re-fire.
      drawClipFilmstrip(canvasStub(8000, 44), meta, opts, () => draw());
    };
    draw(); // initial paint (mount)
    expect(createdImages.length).toBe(20); // all 20 sheets requested at once — the full-clip case

    const fired = new Set<MockImage>();
    const progression: number[] = [];
    for (let sheet = 1; sheet <= 12; sheet++) {
      loadSheetsSequentially(fired, 1); // one sheet arrives (slow wifi)
      progression.push(drawCount);
    }
    console.log('  BUG  redraws after each sheet loads (slow wifi):', progression.join(' → '));
    console.log(`  BUG  12 sheets loaded → ${drawCount} redraws (would be ~1,000,000 at all 20). FREEZE.`);

    // 12 sheet-loads must NOT cause ~12 redraws — they cause thousands (2^12 ≈ 4096). That IS the freeze.
    expect(drawCount).toBeGreaterThan(1000);
  });

  it('FIX: a stable callback keeps redraws LINEAR — ~one per sheet, no cascade', () => {
    let drawCount = 0;
    const stableRedraw = () => {
      drawCount++;
      drawClipFilmstrip(canvasStub(8000, 44), meta, opts, stableRedraw); // SAME ref every time → Set dedups
    };
    stableRedraw(); // initial paint
    expect(createdImages.length).toBe(20);

    const fired = new Set<MockImage>();
    loadSheetsSequentially(fired, 20); // load ALL sheets
    console.log(`  FIX  all 20 sheets loaded → ${drawCount} redraws total. Linear. No freeze.`);

    // 20 sheet-loads → ~21 redraws total. Linear. No freeze. (generous bound for float/order slack)
    expect(drawCount).toBeLessThanOrEqual(30);
  });
});
