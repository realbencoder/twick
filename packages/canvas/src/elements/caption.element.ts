import type { CanvasElementHandler } from "../types";
import { addCaptionElement } from "../components/elements";
import { convertToVideoPosition, getObjectCanvasCenter } from "../helpers/canvas.util";
import { ELEMENT_TYPES } from "../helpers/constants";
import { CANVAS_OPERATIONS } from "../helpers/constants";

export const CaptionElement: CanvasElementHandler = {
  name: ELEMENT_TYPES.CAPTION,

  async add(params) {
    const { element, index, canvas, captionProps, canvasMetadata, lockAspectRatio } = params;
    await addCaptionElement({
      element,
      index,
      canvas,
      captionProps: (captionProps ?? {}) as import("../types").CaptionProps,
      canvasMetadata,
      lockAspectRatio: lockAspectRatio ?? element.props?.lockAspectRatio,
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
    // Convert display-space values back to video-space
    const videoWidth = (object.width ?? 0) * (object.scaleX ?? 1) / context.canvasMetadata.scaleX;
    // fontSize on the Fabric object is in display pixels — convert back to video pixels
    const videoFontSize = Math.round((object.fontSize ?? 48) / context.canvasMetadata.scaleX);

    const useTrackDefaults = (element.props as any)?.useTrackDefaults ?? true;
    if (useTrackDefaults) {
      const currentProps = (context.captionPropsRef.current ?? {}) as Record<string, any>;
      return {
        element,
        operation: CANVAS_OPERATIONS.CAPTION_PROPS_UPDATED,
        payload: {
          element,
          props: {
            ...currentProps,
            x,
            y,
            width: videoWidth,
            font: {
              ...(currentProps.font ?? {}),
              size: videoFontSize,
            },
          },
        },
      };
    }
    return {
      element: {
        ...element,
        props: {
          ...element.props,
          x,
          y,
          width: videoWidth,
          font: {
            ...((element.props as any)?.font ?? {}),
            size: videoFontSize,
          },
        },
      },
    };
  },
};
