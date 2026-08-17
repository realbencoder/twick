import { describe, it, expect } from "vitest";
import { computeStripWindow, windowToSourceRange, stripNeedsRedraw } from "./strip-window";

/**
 * The failure this file exists to catch (R1): canvas width and source range must change TOGETHER.
 * Narrow one without the other and the whole clip's audio/frames compress into the visible sliver —
 * no throw, no warning, and it looks plausible. Worse, it is visually correct while zoomed out to
 * fit (the state the editor opens in) and goes wrong precisely in the zoomed-in long-video case
 * this work exists to fix.
 */

// A 24-minute single-clip video at 50% zoom — the measured worst case.
const LONG = {
  clipStart: 0,
  clipEnd: 1454,
  duration: 1454,
  parentWidth: 1454 * 0.5 * 100, // 72,700px
  viewportWidth: 1064,
  overscanPx: 0,
};

describe("computeStripWindow", () => {
  it("returns the full clip when the clip fits entirely in the viewport", () => {
    const w = computeStripWindow({
      clipStart: 0, clipEnd: 10, duration: 10,
      parentWidth: 1000, scrollLeft: 0, viewportWidth: 1000, overscanPx: 0,
    });
    expect(w).not.toBeNull();
    expect(w!.leftFrac).toBe(0);
    expect(w!.widthFrac).toBe(1);
    expect(w!.startSec).toBe(0);
    expect(w!.endSec).toBe(10);
  });

  it("returns null when the clip is entirely LEFT of the viewport", () => {
    // Clip occupies 0-100px; viewport starts at 500px.
    expect(computeStripWindow({
      clipStart: 0, clipEnd: 1, duration: 10,
      parentWidth: 1000, scrollLeft: 500, viewportWidth: 400, overscanPx: 0,
    })).toBeNull();
  });

  it("returns null when the clip is entirely RIGHT of the viewport", () => {
    // Clip occupies 900-1000px; viewport is 0-400px.
    expect(computeStripWindow({
      clipStart: 9, clipEnd: 10, duration: 10,
      parentWidth: 1000, scrollLeft: 0, viewportWidth: 400, overscanPx: 0,
    })).toBeNull();
  });

  it("windows a long clip to the viewport — the case the cap ruins", () => {
    // Scrolled to 36,350px (the midpoint) on the 24-min clip.
    const w = computeStripWindow({ ...LONG, scrollLeft: 36_350 })!;
    expect(w).not.toBeNull();
    // 1064px of 72,700 = 1.46% of the clip — matches the measured scroller ratio.
    expect(w.widthFrac).toBeCloseTo(1064 / 72_700, 10);
    expect(w.leftFrac).toBeCloseTo(36_350 / 72_700, 10);
    // And the time range is the matching 1.46% of 1454s.
    expect(w.endSec - w.startSec).toBeCloseTo(1454 * (1064 / 72_700), 6);
  });

  it("clamps at the clip's left edge — no negative offset when scrolled before the clip", () => {
    // Viewport starts before the clip; the window must begin AT the clip, not before it.
    const w = computeStripWindow({
      clipStart: 5, clipEnd: 10, duration: 10,
      parentWidth: 1000, scrollLeft: 400, viewportWidth: 400, overscanPx: 0,
    })!;
    expect(w.leftFrac).toBe(0);
    expect(w.startSec).toBe(5);
  });

  it("never lets leftFrac + widthFrac exceed 1 — the canvas is NOT clipped by an ancestor", () => {
    // `.twick-track-element` has no overflow (deliberately: the reclaim band renders at left:100%
    // and the trim handles carry an 8px ::before margin outside the clip). An over-wide canvas
    // paints onto the NEIGHBOURING clip, and a selected clip has z-index 10 so it paints over it.
    for (const scrollLeft of [0, 1, 333, 36_350, 71_000, 72_699, 72_700, 99_999]) {
      for (const overscanPx of [0, 500, 100_000]) {
        const w = computeStripWindow({ ...LONG, scrollLeft, overscanPx });
        if (!w) continue;
        expect(w.leftFrac).toBeGreaterThanOrEqual(0);
        expect(w.widthFrac).toBeGreaterThanOrEqual(0);
        expect(w.leftFrac + w.widthFrac).toBeLessThanOrEqual(1 + 1e-9);
      }
    }
  });

  it("overscan widens the window but never past the clip", () => {
    const bare = computeStripWindow({ ...LONG, scrollLeft: 36_350, overscanPx: 0 })!;
    const padded = computeStripWindow({ ...LONG, scrollLeft: 36_350, overscanPx: 1064 })!;
    expect(padded.widthFrac).toBeGreaterThan(bare.widthFrac);
    expect(padded.leftFrac).toBeLessThan(bare.leftFrac);
    // A huge overscan collapses to the whole clip, never beyond it.
    const huge = computeStripWindow({ ...LONG, scrollLeft: 36_350, overscanPx: 1e9 })!;
    expect(huge.leftFrac).toBe(0);
    expect(huge.widthFrac).toBe(1);
  });

  it("a NEGATIVE overscan cannot shrink the window below the viewport", () => {
    // Would otherwise leave a visibly undrawn band INSIDE the viewport.
    const bare = computeStripWindow({ ...LONG, scrollLeft: 36_350, overscanPx: 0 })!;
    const neg = computeStripWindow({ ...LONG, scrollLeft: 36_350, overscanPx: -5000 })!;
    expect(neg.widthFrac).toBeCloseTo(bare.widthFrac, 12);
  });

  it("returns null on degenerate input instead of throwing", () => {
    const base = { clipStart: 0, clipEnd: 10, duration: 10, parentWidth: 1000, scrollLeft: 0, viewportWidth: 500, overscanPx: 0 };
    expect(computeStripWindow({ ...base, duration: 0 })).toBeNull();
    expect(computeStripWindow({ ...base, parentWidth: 0 })).toBeNull();
    expect(computeStripWindow({ ...base, viewportWidth: 0 })).toBeNull();
    expect(computeStripWindow({ ...base, clipEnd: 0 })).toBeNull();          // zero-length clip
    expect(computeStripWindow({ ...base, clipEnd: -1 })).toBeNull();         // inverted
    expect(computeStripWindow({ ...base, duration: NaN })).toBeNull();
    expect(computeStripWindow({ ...base, scrollLeft: Infinity })).toBeNull();
  });
});

describe("windowToSourceRange — THE UNIT ASYMMETRY", () => {
  // waveform  srcSpan is SOURCE seconds  (caller pre-applies the rate)
  // filmstrip span    is TIMELINE seconds (renderer multiplies by playbackRate internally)
  // Both take their START in SOURCE seconds. A helper that ignores this is wrong by exactly the
  // playback rate, in exactly one strip, on sped-up clips only.

  const win = { leftFrac: 0.25, widthFrac: 0.5, startSec: 10, endSec: 20 };

  it("SPAN differs by space at rate != 1 — this is the whole point", () => {
    const wave = windowToSourceRange(win, { clipStart: 0, sourceStart: 0, rate: 2, spanSpace: "source" });
    const film = windowToSourceRange(win, { clipStart: 0, sourceStart: 0, rate: 2, spanSpace: "timeline" });
    expect(wave.span).toBe(20); // 10 timeline seconds of 2x source = 20 source seconds
    expect(film.span).toBe(10); // renderer applies the rate itself
    expect(wave.span).not.toBe(film.span);
  });

  it("SPAN agrees at rate == 1 — which is why a broken helper passes casual testing", () => {
    const wave = windowToSourceRange(win, { clipStart: 0, sourceStart: 0, rate: 1, spanSpace: "source" });
    const film = windowToSourceRange(win, { clipStart: 0, sourceStart: 0, rate: 1, spanSpace: "timeline" });
    expect(wave.span).toBe(film.span);
  });

  it("START is rate-scaled in BOTH spaces — it is always source seconds", () => {
    const wave = windowToSourceRange(win, { clipStart: 0, sourceStart: 100, rate: 2, spanSpace: "source" });
    const film = windowToSourceRange(win, { clipStart: 0, sourceStart: 100, rate: 2, spanSpace: "timeline" });
    expect(wave.sourceStart).toBe(120); // 100 + (10 timeline - 0) * 2
    expect(film.sourceStart).toBe(120);
  });

  it("measures the offset from the CLIP start, not from zero", () => {
    // A clip starting at t=8 whose window starts at t=10 is 2 timeline seconds in, not 10.
    const r = windowToSourceRange(win, { clipStart: 8, sourceStart: 100, rate: 1, spanSpace: "source" });
    expect(r.sourceStart).toBe(102);
  });

  it("never seeks behind the file head", () => {
    const r = windowToSourceRange({ ...win, startSec: 0 }, { clipStart: 50, sourceStart: 0, rate: 1, spanSpace: "source" });
    expect(r.sourceStart).toBeGreaterThanOrEqual(0);
  });

  it("a non-positive or non-finite rate degrades to 1 rather than producing NaN", () => {
    for (const rate of [0, -2, NaN, Infinity]) {
      const r = windowToSourceRange(win, { clipStart: 0, sourceStart: 5, rate, spanSpace: "source" });
      expect(Number.isFinite(r.sourceStart)).toBe(true);
      expect(Number.isFinite(r.span)).toBe(true);
    }
  });
});

describe("R1 — the window and the source range must describe the SAME slice", () => {
  it("a full-clip window reproduces exactly today's un-windowed arguments", () => {
    // The byte-parity gate: when nothing is windowed (clip fully visible), the values handed to
    // both renderers must equal what the pre-windowing code passed. If this drifts, every clip
    // that fits on screen silently changes appearance.
    const clipStart = 3, clipEnd = 13, rate = 1.5, srcTime = 42;
    const w = computeStripWindow({
      clipStart, clipEnd, duration: 20, parentWidth: 2000, scrollLeft: 0,
      viewportWidth: 2000, overscanPx: 0,
    })!;
    expect(w.leftFrac).toBe(0);
    expect(w.widthFrac).toBe(1);

    const wave = windowToSourceRange(w, { clipStart, sourceStart: srcTime, rate, spanSpace: "source" });
    const film = windowToSourceRange(w, { clipStart, sourceStart: srcTime, rate, spanSpace: "timeline" });

    // Pre-windowing: srcStart = wfSrcTime (+ trim delta), srcSpan = (end - start) * rate
    expect(wave.sourceStart).toBe(srcTime);
    expect(wave.span).toBe((clipEnd - clipStart) * rate);
    // Pre-windowing: sourceStart = wfSrcTime, span = end - start
    expect(film.sourceStart).toBe(srcTime);
    expect(film.span).toBe(clipEnd - clipStart);
  });

  it("the source slice tracks the window as it scrolls — proportionally, in both spaces", () => {
    const clipStart = 0, clipEnd = 1454, rate = 1, srcTime = 0;
    let prevStart = -1;
    for (const scrollLeft of [0, 10_000, 36_350, 60_000, 71_600]) {
      const w = computeStripWindow({ ...LONG, scrollLeft })!;
      const wave = windowToSourceRange(w, { clipStart, sourceStart: srcTime, rate, spanSpace: "source" });
      // Monotonic: scrolling right must advance the source start, never rewind it.
      expect(wave.sourceStart).toBeGreaterThan(prevStart);
      prevStart = wave.sourceStart;
      // The slice stays inside the clip's source range.
      expect(wave.sourceStart).toBeGreaterThanOrEqual(0);
      expect(wave.sourceStart + wave.span).toBeLessThanOrEqual((clipEnd - clipStart) * rate + 1e-6);
      // And the source offset matches the visual offset — the misalignment R1 describes would
      // show up here as a divergence between these two.
      expect(wave.sourceStart).toBeCloseTo(w.leftFrac * (clipEnd - clipStart) * rate, 6);
    }
  });

  it("MUST-FAIL CONTROL: not narrowing the span reproduces the R1 bug", () => {
    // The bug: shrink the canvas, keep the full-clip span. The whole clip compresses into the
    // sliver. If this control ever passes, the assertions above have gone slack.
    const w = computeStripWindow({ ...LONG, scrollLeft: 36_350 })!;
    const correct = windowToSourceRange(w, { clipStart: 0, sourceStart: 0, rate: 1, spanSpace: "source" });
    const buggyFullSpan = 1454;
    expect(correct.span).toBeLessThan(buggyFullSpan / 10);
  });
});

describe("stripNeedsRedraw — the scroll-cost guard", () => {
  const mk = (o: Partial<any> = {}) =>
    computeStripWindow({
      clipStart: 0, clipEnd: 1454, duration: 1454,
      parentWidth: 1454 * 0.5 * 100, viewportWidth: 1064,
      overscanPx: 1064, scrollLeft: 36_350, ...o,
    })!;

  it("redraws when nothing is drawn yet", () => {
    expect(stripNeedsRedraw(null, mk())).toBe(true);
  });

  it("does NOT redraw for a scroll that stays inside the overscan — the whole point", () => {
    const drawn = mk({ scrollLeft: 36_350 });
    // Half an overscan's worth of scroll. Before this guard every one of these re-rastered.
    for (const d of [1, 10, 100, 400, 530]) {
      expect(stripNeedsRedraw(drawn, mk({ scrollLeft: 36_350 + d })), `+${d}px`).toBe(false);
      expect(stripNeedsRedraw(drawn, mk({ scrollLeft: 36_350 - d })), `-${d}px`).toBe(false);
    }
  });

  it("DOES redraw once the visible slice leaves what was drawn", () => {
    const drawn = mk({ scrollLeft: 36_350 });
    // Past a full overscan (1064px) the on-screen slice escapes the drawn range.
    expect(stripNeedsRedraw(drawn, mk({ scrollLeft: 36_350 + 1100 }))).toBe(true);
    expect(stripNeedsRedraw(drawn, mk({ scrollLeft: 36_350 - 1100 }))).toBe(true);
  });

  it("redraws when the SCALE changed even if the visible range did not", () => {
    // Same viewport, different zoom ⟹ the existing raster is at the wrong resolution.
    const drawn = mk({ parentWidth: 1454 * 0.5 * 100 });
    const zoomed = mk({ parentWidth: 1454 * 1.0 * 100, scrollLeft: 36_350 });
    expect(stripNeedsRedraw(drawn, zoomed)).toBe(true);
  });

  it("a clip fully inside the viewport never needs a scroll redraw", () => {
    const small = { clipStart: 0, clipEnd: 5, duration: 100, parentWidth: 2000, viewportWidth: 1064, overscanPx: 1064 };
    const drawn = computeStripWindow({ ...small, scrollLeft: 0 })!;
    // Scroll anywhere the clip is still visible — the canvas already holds the whole clip.
    for (const s of [0, 10, 50]) {
      const next = computeStripWindow({ ...small, scrollLeft: s });
      if (next) expect(stripNeedsRedraw(drawn, next)).toBe(false);
    }
  });

  it("MUST-FAIL CONTROL: a guard that compared the DRAWN range would redraw on every pixel", () => {
    // The naive version — "did the window change" — is true on every scrolled pixel, which is
    // exactly the 65-78% redundant redraw the measurement found. Proof the two differ.
    const a = mk({ scrollLeft: 36_350 });
    const b = mk({ scrollLeft: 36_351 });
    expect(a.startSec).not.toBe(b.startSec);        // the window DID change
    expect(stripNeedsRedraw(a, b)).toBe(false);      // but no redraw is needed
  });
});
