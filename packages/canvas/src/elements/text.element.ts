import type { CanvasElementHandler } from "../types";
import { addTextElement } from "../components/elements";
import { convertToVideoPosition, getObjectCanvasCenter, getObjectCanvasAngle } from "../helpers/canvas.util";
import { ELEMENT_TYPES } from "../helpers/constants";

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
    const videoWidth = (object.width ?? 0) * (object.scaleX ?? 1) / context.canvasMetadata.scaleX;
    const videoFontSize = Math.round((object.fontSize ?? 36) / context.canvasMetadata.scaleX);
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
