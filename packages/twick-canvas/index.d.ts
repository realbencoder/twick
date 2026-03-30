import { addBackgroundColor } from './components/elements';
import { addCaptionElement } from './components/elements';
import { AddElementToCanvasOptions } from './types';
import { addImageElement } from './components/elements';
import { addRectElement } from './components/elements';
import { addTextElement } from './components/elements';
import { addVideoElement } from './components/elements';
import { AddWatermarkToCanvasOptions } from './types';
import { BuildCanvasOptions } from './types';
import { CANVAS_OPERATIONS } from './helpers/constants';
import { CanvasElement } from './types';
import { CanvasElementAddParams } from './types';
import { CanvasElementHandler } from './types';
import { CanvasElementProps } from './types';
import { CanvasElementUpdateContext } from './types';
import { CanvasElementUpdateResult } from './types';
import { CanvasMetadata } from './types';
import { CanvasProps } from './types';
import { CaptionProps } from './types';
import { convertToCanvasPosition } from './helpers/canvas.util';
import { convertToVideoPosition } from './helpers/canvas.util';
import { createCanvas } from './helpers/canvas.util';
import { disabledControl } from './components/element-controls';
import { ELEMENT_TYPES } from './helpers/constants';
import { ElementController } from './controllers/element.controller';
import { default as elementController } from './controllers/element.controller';
import { FrameEffect } from './types';
import { getCanvasHandler } from './controllers/element.controller';
import { getCurrentFrameEffect } from './helpers/canvas.util';
import { registerCanvasHandler } from './controllers/element.controller';
import { reorderElementsByZIndex } from './helpers/canvas.util';
import { ResizeCanvasOptions } from './types';
import { rotateControl } from './components/element-controls';
import { SetCanvasElementsOptions } from './types';
import { useTwickCanvas } from './hooks/use-twick-canvas';
import { WatermarkUpdatePayload } from './types';

export { addBackgroundColor }

export { addCaptionElement }

export { AddElementToCanvasOptions }

export { addImageElement }

export { addRectElement }

export { addTextElement }

export { addVideoElement }

export { AddWatermarkToCanvasOptions }

export { BuildCanvasOptions }

export { CANVAS_OPERATIONS }

export { CanvasElement }

export { CanvasElementAddParams }

export { CanvasElementHandler }

export { CanvasElementProps }

export { CanvasElementUpdateContext }

export { CanvasElementUpdateResult }

export { CanvasMetadata }

export { CanvasProps }

export { CaptionProps }

export { convertToCanvasPosition }

export { convertToVideoPosition }

export { createCanvas }

export { disabledControl }

export { ELEMENT_TYPES }

export { ElementController }

export { elementController }

export { FrameEffect }

export { getCanvasHandler }

export { getCurrentFrameEffect }

export { registerCanvasHandler }

export { reorderElementsByZIndex }

export { ResizeCanvasOptions }

export { rotateControl }

export { SetCanvasElementsOptions }

export { useTwickCanvas }

export { WatermarkUpdatePayload }

export { }


declare module "fabric" {
    interface FabricObject {
        zIndex?: number;
    }
}

