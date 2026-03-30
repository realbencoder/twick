import { ElementJSON } from '../../types';
import { VideoElement } from '../elements/video.element';
import { AudioElement } from '../elements/audio.element';
import { ImageElement } from '../elements/image.element';
import { TextElement } from '../elements/text.element';
import { CaptionElement } from '../elements/caption.element';
import { IconElement } from '../elements/icon.element';
import { CircleElement } from '../elements/circle.element';
import { RectElement } from '../elements/rect.element';
import { PlaceholderElement } from '../elements/placeholder.element';
import { TrackElement } from '../elements/base.element';
import { ArrowElement } from '../elements/arrow.element';
import { LineElement } from '../elements/line.element';
import { EffectElement } from '../elements/effect.element';

export declare class ElementDeserializer {
    private static customDeserializers;
    static registerCustomType(type: string, deserializer: (json: ElementJSON) => TrackElement | null): void;
    static unregisterCustomType(type: string): void;
    private static deserializeBaseElement;
    static deserializeVideoElement(json: ElementJSON): VideoElement;
    static deserializeAudioElement(json: ElementJSON): AudioElement;
    static deserializeImageElement(json: ElementJSON): ImageElement;
    static deserializeTextElement(json: ElementJSON): TextElement;
    static deserializeCaptionElement(json: ElementJSON): CaptionElement;
    static deserializeIconElement(json: ElementJSON): IconElement;
    static deserializeCircleElement(json: ElementJSON): CircleElement;
    static deserializeRectElement(json: ElementJSON): RectElement;
    static deserializePlaceholderElement(json: ElementJSON): PlaceholderElement;
    static deserializeArrowElement(json: ElementJSON): ArrowElement;
    static deserializeLineElement(json: ElementJSON): LineElement;
    static deserializeEffectElement(json: ElementJSON): EffectElement;
    static fromJSON(json: ElementJSON): TrackElement | null;
}
//# sourceMappingURL=element-deserializer.d.ts.map