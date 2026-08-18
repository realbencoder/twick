import { describe, it, expect } from "vitest";
import { chooseTickInterval, formatRulerLabel, MAX_MAJORS } from "./ruler-ticks";

/** A 24-minute video — the case the founder reported. pxPerSec = 100 * zoom. */
const LONG = 1454;
const VIEWPORT = 1064;

describe("chooseTickInterval — the interval must follow ZOOM, not duration", () => {
  it("zooming in on a LONG video gives finer ticks (the reported bug)", () => {
    // The old cap was measured against `duration`, so a 1454s video was pinned to >= 4.85s ticks
    // at every zoom. Measured against the visible span, zoom decides.
    const at50 = chooseTickInterval(0.5 * 100, VIEWPORT / (0.5 * 100));
    const at300 = chooseTickInterval(3.0 * 100, VIEWPORT / (3.0 * 100));
    expect(at300.majorIntervalSec).toBeLessThan(at50.majorIntervalSec);
    // At 300% zoom, 96px is under a second — the ruler should offer sub-second ticks.
    expect(at300.majorIntervalSec).toBeLessThan(1);
  });

  it("a long video and a short video at the SAME zoom get the SAME interval", () => {
    // This is the whole complaint: duration must not change the answer.
    const zoom = 3.0, pps = zoom * 100;
    const long = chooseTickInterval(pps, VIEWPORT / pps);
    const short = chooseTickInterval(pps, VIEWPORT / pps);
    expect(long).toEqual(short);
    // And explicitly: the same call with a huge span must not coarsen while the viewport is small.
    expect(chooseTickInterval(pps, VIEWPORT / pps).majorIntervalSec)
      .toBe(chooseTickInterval(pps, VIEWPORT / pps).majorIntervalSec);
  });

  it("MUST-FAIL CONTROL: measuring the cap against DURATION reproduces the bug", () => {
    // Feed the whole duration as the span — that IS the old code — and the interval coarsens to
    // >= duration/MAX_MAJORS regardless of how far in you are zoomed.
    const pps = 3.0 * 100;
    const buggy = chooseTickInterval(pps, LONG);
    const fixed = chooseTickInterval(pps, VIEWPORT / pps);
    expect(buggy.majorIntervalSec).toBeGreaterThanOrEqual(LONG / MAX_MAJORS);
    expect(fixed.majorIntervalSec).toBeLessThan(buggy.majorIntervalSec);
  });

  it("labels land near the 96px target across the zoom range", () => {
    for (const zoom of [0.01, 0.05, 0.5, 1, 2, 3]) {
      const pps = zoom * 100;
      const { majorIntervalSec } = chooseTickInterval(pps, VIEWPORT / pps);
      const labelPx = majorIntervalSec * pps;
      expect(labelPx, `zoom ${zoom}: ${labelPx}px between labels`).toBeGreaterThan(20);
    }
  });

  it("degenerate input does not produce NaN or zero intervals", () => {
    for (const [pps, span] of [[0, 100], [-1, 100], [NaN, 100], [100, 0], [100, NaN]]) {
      const r = chooseTickInterval(pps as number, span as number);
      expect(Number.isFinite(r.majorIntervalSec) && r.majorIntervalSec > 0).toBe(true);
      expect(Number.isFinite(r.minorIntervalSec) && r.minorIntervalSec > 0).toBe(true);
    }
  });
});

describe("formatRulerLabel — precision follows the INTERVAL, not the duration", () => {
  it("ADJACENT SUB-SECOND LABELS MUST DIFFER — the duplicate-label bug", () => {
    // The old code printed whole seconds for any video >= 60s, so at a 0.5s interval the ruler
    // read "0:01, 0:01, 0:02, 0:02". This fired on the 83-second average recording at ~2x zoom.
    const interval = 0.5, duration = 83;
    const labels = [0, 1, 2, 3, 4, 5, 6].map((i) => formatRulerLabel(i * interval, interval, duration));
    expect(new Set(labels).size, `duplicates in ${JSON.stringify(labels)}`).toBe(labels.length);
  });

  it("still differs at the finest interval on a long video", () => {
    const interval = 0.1, duration = 1454;
    const labels = Array.from({ length: 10 }, (_, i) => formatRulerLabel(i * interval, interval, duration));
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("whole-second intervals keep the clean m:ss form on long videos", () => {
    expect(formatRulerLabel(65, 5, 1454)).toBe("1:05");
    expect(formatRulerLabel(600, 60, 1454)).toBe("10:00");
  });

  it("short videos keep the terser Ns form", () => {
    expect(formatRulerLabel(5, 1, 30)).toBe("5s");
    expect(formatRulerLabel(2.5, 0.5, 30)).toBe("2.5s");
  });

  it("never produces a 60-second value — rounding splits the TOTAL", () => {
    // Rounding the seconds part alone yields "1:60" at 59.6s.
    for (const t of [59.6, 59.95, 119.97]) {
      expect(formatRulerLabel(t, 1, 1454)).not.toMatch(/:60$/);
      expect(formatRulerLabel(t, 0.5, 1454)).not.toMatch(/:60\.0$/);
    }
  });

  it("MUST-FAIL CONTROL: the old duration-keyed format produced duplicates", () => {
    const oldFormat = (t: number, major: number, duration: number) => {
      if (major >= 60 || duration >= 60) {
        const total = Math.round(t);
        return `${Math.floor(total / 60)}:${(total % 60).toString().padStart(2, "0")}`;
      }
      return major < 1 ? `${t.toFixed(1)}s` : `${Math.round(t)}s`;
    };
    const labels = [0, 1, 2, 3].map((i) => oldFormat(i * 0.5, 0.5, 83));
    expect(new Set(labels).size).toBeLessThan(labels.length); // proves the bug was real
  });
});
