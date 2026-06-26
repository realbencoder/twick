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
    return {
      element: {
        ...element,
        props: {
          ...element.props,
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
