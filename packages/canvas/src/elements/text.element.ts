import type { CanvasElementHandler } from "../types";
import { addTextElement } from "../components/elements";
import { convertToVideoPosition, getObjectCanvasCenter, getObjectCanvasAngle } from "../helpers/canvas.util";
import { ELEMENT_TYPES } from "../helpers/constants";

/**
 * The only gestures that change a text element's font size. Everything else — moving it,
 * rotating it, dragging an edge handle to re-wrap it — must leave fontSize ALONE.
 *
 * Why this matters: a Fabric Textbox is built at floor(fontSize * scaleX) canvas px and read
 * back as round(canvasFontSize / scaleX), so the round trip LOSES up to one canvas pixel. On a
 * portrait editor (scaleX ~0.37) that is ~2.7 video px, and it RATCHETS: measured 87 -> 86,
 * 48 -> 46, 47 -> 46, 36 -> 35 on a drag that changed only the width. Recomputing fontSize
 * from a gesture that never touched it is what turns rounding noise into permanent shrinkage.
 */
const FONT_SIZE_CHANGING_ACTIONS = new Set(["scale", "scaleX", "scaleY"]);

/**
 * The only gestures that change a text element's WRAP WIDTH: a corner scale (baked into
 * width by handleObjectMoved) and the left/right edge drag. Moving or rotating must leave it
 * alone, for a sharper reason than the fontSize case above.
 *
 * Fabric REFUSES to render a Textbox narrower than its longest word: initDimensions does
 * `if (this.dynamicMinWidth > this.width) this._set('width', this.dynamicMinWidth)`. So a
 * creator who sets a narrow width via the Typography slider has a Fabric box that is WIDER
 * than what they asked for, and reading that box back on an unrelated gesture overwrites their
 * value with Fabric's. MEASURED: stored width 200 video px on a 100px-font line, one plain
 * drag, persisted width 638 — a 3x silent change from a gesture that only moved the element.
 */
const WIDTH_CHANGING_ACTIONS = new Set(["scale", "scaleX", "scaleY", "resizing"]);

export const TextElement: CanvasElementHandler = {
  name: ELEMENT_TYPES.TEXT,

  async add(params) {
    const { element, index, canvas, canvasMetadata } = params;
    await addTextElement({
      element,
      index,
      canvas,
      canvasMetadata,
    });
  },

  updateFromFabricObject(object, element, context) {
    const canvasCenter = getObjectCanvasCenter(object);
    const { x, y } = convertToVideoPosition(
      canvasCenter.x,
      canvasCenter.y,
      context.canvasMetadata,
      context.videoSize
    );
    const prevWidth = element.props?.width;
    const gestureResized =
      context.action == null || WIDTH_CHANGING_ACTIONS.has(context.action);
    const videoWidth =
      !gestureResized && typeof prevWidth === "number" && Number.isFinite(prevWidth) && prevWidth > 0
        ? prevWidth
        : ((object.width ?? 0) * (object.scaleX ?? 1)) / context.canvasMetadata.scaleX;
    // Preserve the stored size unless the gesture genuinely scaled the element. An unknown
    // action (legacy caller that passes none) still recomputes, so this can only ever narrow
    // the set of writes, never invent one.
    const prevFontSize = element.props?.fontSize;
    const gestureScaled =
      context.action == null || FONT_SIZE_CHANGING_ACTIONS.has(context.action);
    const videoFontSize =
      !gestureScaled && typeof prevFontSize === "number" && Number.isFinite(prevFontSize)
        ? prevFontSize
        : Math.round((object.fontSize ?? 36) / context.canvasMetadata.scaleX);
    // The Fabric box IS the creator's width. maxWidth is a legacy clamp the app never
    // writes; if it survived an explicit width write it would silently narrow the new box
    // in the preview, the export AND the next canvas rebuild.
    const props: typeof element.props = { ...element.props };
    delete props.maxWidth;
    return {
      element: {
        ...element,
        props: {
          ...props,
          rotation: getObjectCanvasAngle(object),
          x,
          y,
          width: videoWidth,
          fontSize: videoFontSize,
        },
      },
    };
  },
};
