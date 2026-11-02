import type { CutPreview } from "../../helpers/cut-preview";
import type { TimeScale } from "../../helpers/time-scale";

/** Below this width the "Will be deleted" label does not fit, so the red band shows alone. */
const LABEL_MIN_PX = 96;

/**
 * The red preview of a delete before / after the playhead (Ben, 2026-11-02): a translucent red band
 * over exactly `[from, to]`, the stretch the hovered or focused button would delete. It spans the
 * whole track area, top to bottom, because Q and W cut every track. Positioned through the
 * timeline's own TimeScale (the clip frame), so it lines up with the clips at every zoom. It never
 * takes a pointer event. It sits above the track lanes (z 10) and below the playhead line and the
 * sticky track headers (z 30), so both stay readable over it.
 */
export function CutPreviewOverlay({
  preview,
  timeScale,
}: {
  preview: CutPreview | null | undefined;
  timeScale: TimeScale;
}) {
  if (!preview) return null;
  const left = timeScale.timeToContentX(preview.from);
  const width = timeScale.timeToPx(preview.to) - timeScale.timeToPx(preview.from);
  return (
    <div
      className="twick-cut-preview"
      data-side={preview.side}
      aria-hidden="true"
      style={{
        position: "absolute",
        top: 0,
        bottom: 0,
        left,
        width,
        zIndex: 26,
        pointerEvents: "none",
        backgroundColor: "rgba(239, 68, 68, 0.28)",
        boxShadow: "inset 0 0 0 1px rgba(248, 113, 113, 0.9)",
      }}
    >
      {width >= LABEL_MIN_PX ? (
        <span
          className="twick-cut-preview-label"
          style={{
            position: "absolute",
            top: 4,
            // Beside the playhead, the edge the creator is looking at: the band's left edge for
            // "after" (the playhead is its start), its right edge for "before".
            ...(preview.side === "after" ? { left: 6 } : { right: 6 }),
            pointerEvents: "none",
            padding: "1px 6px",
            borderRadius: 4,
            backgroundColor: "rgba(127, 29, 29, 0.85)",
            color: "#fff",
            fontSize: 11,
            fontWeight: 600,
            lineHeight: "16px",
            whiteSpace: "nowrap",
          }}
        >
          Will be deleted
        </span>
      ) : null}
    </div>
  );
}
