/**
 * Utility helpers for deriving caption geometry from font settings.
 *
 * These helpers are intentionally lightweight and numeric-only so they can be
 * safely shared between timeline, Studio, workflow, canvas, and visualizer.
 */
export interface CaptionGeometry {
    /**
     * Stroke line width for caption text.
     * This is scaled relative to the font size to keep outlines proportional.
     */
    lineWidth: number;
    /**
     * Rect-level layout properties used by caption phrase containers.
     * Currently only drives horizontal gap between words, but can be extended
     * in a backwards-compatible way.
     */
    rectProps: {
        gap: number;
    };
}
/**
 * Compute caption geometry (stroke width and rect gap) from a font size.
 *
 * The current implementation uses a simple proportional mapping so that:
 * - Stroke width stays visually subtle across sizes
 * - Horizontal gaps scale with the font to avoid overcrowding or excessive spacing
 *
 * This function is the single source of truth for caption stroke + rect layout.
 */
export declare function computeCaptionGeometry(fontSize: number, captionStyle: string): CaptionGeometry;
//# sourceMappingURL=caption-geometry.d.ts.map