import { ElementVisitor } from './element-visitor';
import { VideoElement } from '../elements/video.element';
import { AudioElement } from '../elements/audio.element';
import { ImageElement } from '../elements/image.element';
import { TextElement } from '../elements/text.element';
import { CaptionElement } from '../elements/caption.element';
import { IconElement } from '../elements/icon.element';
import { CircleElement } from '../elements/circle.element';
import { RectElement } from '../elements/rect.element';
import { PlaceholderElement } from '../elements/placeholder.element';
import { ArrowElement } from '../elements/arrow.element';
import { LineElement } from '../elements/line.element';
import { EffectElement } from '../elements/effect.element';
import { Track } from '../track/track';

/**
 * ElementUpdater visitor for updating elements in tracks
 * Uses the visitor pattern to handle different element types
 * Implements the Friend Class Pattern for explicit access control
 */
export declare class ElementUpdater implements ElementVisitor<boolean> {
    private trackFriend;
    constructor(track: Track);
    visitVideoElement(element: VideoElement): boolean;
    visitAudioElement(element: AudioElement): boolean;
    visitImageElement(element: ImageElement): boolean;
    visitTextElement(element: TextElement): boolean;
    visitCaptionElement(element: CaptionElement): boolean;
    visitIconElement(element: IconElement): boolean;
    visitCircleElement(element: CircleElement): boolean;
    visitRectElement(element: RectElement): boolean;
    visitPlaceholderElement(element: PlaceholderElement): boolean;
    visitArrowElement(element: ArrowElement): boolean;
    visitLineElement(element: LineElement): boolean;
    visitEffectElement(element: EffectElement): boolean;
}
//# sourceMappingURL=element-updater.d.ts.map