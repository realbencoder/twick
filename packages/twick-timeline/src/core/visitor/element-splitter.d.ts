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
import { ArrowElement } from '../elements/arrow.element';
import { LineElement } from '../elements/line.element';
import { EffectElement } from '../elements/effect.element';

export interface SplitResult {
    firstElement: any;
    secondElement: any;
    success: boolean;
}
export declare class ElementSplitter implements ElementVisitor<SplitResult> {
    private splitTime;
    private elementCloner;
    constructor(splitTime: number);
    visitVideoElement(element: VideoElement): SplitResult;
    visitAudioElement(element: AudioElement): SplitResult;
    visitImageElement(element: ImageElement): SplitResult;
    visitTextElement(element: TextElement): SplitResult;
    visitCaptionElement(element: CaptionElement): SplitResult;
    visitRectElement(element: RectElement): SplitResult;
    visitCircleElement(element: CircleElement): SplitResult;
    visitIconElement(element: IconElement): SplitResult;
    visitPlaceholderElement(element: PlaceholderElement): SplitResult;
    visitArrowElement(element: ArrowElement): SplitResult;
    visitLineElement(element: LineElement): SplitResult;
    visitEffectElement(element: EffectElement): SplitResult;
}
//# sourceMappingURL=element-splitter.d.ts.map