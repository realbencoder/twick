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

export declare class ElementCloner implements ElementVisitor<TrackElement> {
    cloneElementProperties(srcElement: TrackElement, destElement: TrackElement): TrackElement;
    visitVideoElement(element: VideoElement): TrackElement;
    visitAudioElement(element: AudioElement): TrackElement;
    visitImageElement(element: ImageElement): TrackElement;
    visitTextElement(element: TextElement): TrackElement;
    visitCaptionElement(element: CaptionElement): TrackElement;
    visitRectElement(element: RectElement): TrackElement;
    visitCircleElement(element: CircleElement): TrackElement;
    visitIconElement(element: IconElement): TrackElement;
    visitPlaceholderElement(element: PlaceholderElement): TrackElement;
    visitArrowElement(element: ArrowElement): TrackElement;
    visitLineElement(element: LineElement): TrackElement;
    visitEffectElement(element: EffectElement): TrackElement;
}
//# sourceMappingURL=element-cloner.d.ts.map