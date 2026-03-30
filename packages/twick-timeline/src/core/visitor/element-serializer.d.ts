import { ElementJSON } from '../../types';
import { ElementVisitor } from './element-visitor';
import { VideoElement } from '../elements/video.element';
import { AudioElement } from '../elements/audio.element';
import { ImageElement } from '../elements/image.element';
import { TextElement } from '../elements/text.element';
import { CaptionElement } from '../elements/caption.element';
import { RectElement } from '../elements/rect.element';
import { CircleElement } from '../elements/circle.element';
import { IconElement } from '../elements/icon.element';
import { PlaceholderElement } from '../elements/placeholder.element';
import { TrackElement } from '../elements/base.element';
import { ArrowElement } from '../elements/arrow.element';
import { LineElement } from '../elements/line.element';
import { EffectElement } from '../elements/effect.element';

export declare class ElementSerializer implements ElementVisitor<ElementJSON> {
    serializeElement(element: TrackElement): ElementJSON;
    visitVideoElement(element: VideoElement): ElementJSON;
    visitAudioElement(element: AudioElement): ElementJSON;
    visitImageElement(element: ImageElement): ElementJSON;
    visitTextElement(element: TextElement): ElementJSON;
    visitCaptionElement(element: CaptionElement): ElementJSON;
    visitIconElement(element: IconElement): ElementJSON;
    visitCircleElement(element: CircleElement): ElementJSON;
    visitRectElement(element: RectElement): ElementJSON;
    visitPlaceholderElement(element: PlaceholderElement): ElementJSON;
    visitLineElement(element: LineElement): ElementJSON;
    visitArrowElement(element: ArrowElement): ElementJSON;
    visitEffectElement(element: EffectElement): ElementJSON;
}
//# sourceMappingURL=element-serializer.d.ts.map