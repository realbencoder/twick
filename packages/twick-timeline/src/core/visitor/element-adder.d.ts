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
 * ElementAdder visitor for adding elements to tracks.
 * Uses the visitor pattern to handle different element types
 * and implements the Friend Class Pattern for explicit access control.
 * Automatically calculates start and end times for elements based on
 * existing track content.
 */
export declare class ElementAdder implements ElementVisitor<Promise<boolean>> {
    private track;
    private trackFriend;
    /**
     * Creates a new ElementAdder instance for the specified track.
     *
     * @param track - The track to add elements to
     *
     * @example
     * ```js
     * const adder = new ElementAdder(track);
     * const success = await adder.visitVideoElement(videoElement);
     * ```
     */
    constructor(track: Track);
    /**
     * Adds a video element to the track.
     * Updates video metadata and calculates appropriate start/end times
     * based on existing track elements.
     *
     * @param element - The video element to add
     * @returns Promise resolving to true if element was added successfully
     *
     * @example
     * ```js
     * const success = await adder.visitVideoElement(videoElement);
     * // success = true if element was added successfully
     * ```
     */
    visitVideoElement(element: VideoElement): Promise<boolean>;
    /**
     * Adds an audio element to the track.
     * Updates audio metadata and calculates appropriate start/end times
     * based on existing track elements.
     *
     * @param element - The audio element to add
     * @returns Promise resolving to true if element was added successfully
     *
     * @example
     * ```js
     * const success = await adder.visitAudioElement(audioElement);
     * // success = true if element was added successfully
     * ```
     */
    visitAudioElement(element: AudioElement): Promise<boolean>;
    /**
     * Adds an image element to the track.
     * Updates image metadata and calculates appropriate start/end times
     * based on existing track elements.
     *
     * @param element - The image element to add
     * @returns Promise resolving to true if element was added successfully
     *
     * @example
     * ```js
     * const success = await adder.visitImageElement(imageElement);
     * // success = true if element was added successfully
     * ```
     */
    visitImageElement(element: ImageElement): Promise<boolean>;
    /**
     * Adds a text element to the track.
     * Calculates appropriate start/end times based on existing track elements.
     *
     * @param element - The text element to add
     * @returns Promise resolving to true if element was added successfully
     *
     * @example
     * ```js
     * const success = await adder.visitTextElement(textElement);
     * // success = true if element was added successfully
     * ```
     */
    visitTextElement(element: TextElement): Promise<boolean>;
    /**
     * Adds a caption element to the track.
     * Calculates appropriate start/end times based on existing track elements.
     *
     * @param element - The caption element to add
     * @returns Promise resolving to true if element was added successfully
     *
     * @example
     * ```js
     * const success = await adder.visitCaptionElement(captionElement);
     * // success = true if element was added successfully
     * ```
     */
    visitCaptionElement(element: CaptionElement): Promise<boolean>;
    /**
     * Adds an icon element to the track.
     * Calculates appropriate start/end times based on existing track elements.
     *
     * @param element - The icon element to add
     * @returns Promise resolving to true if element was added successfully
     *
     * @example
     * ```js
     * const success = await adder.visitIconElement(iconElement);
     * // success = true if element was added successfully
     * ```
     */
    visitIconElement(element: IconElement): Promise<boolean>;
    /**
     * Adds a circle element to the track.
     * Calculates appropriate start/end times based on existing track elements.
     *
     * @param element - The circle element to add
     * @returns Promise resolving to true if element was added successfully
     *
     * @example
     * ```js
     * const success = await adder.visitCircleElement(circleElement);
     * // success = true if element was added successfully
     * ```
     */
    visitCircleElement(element: CircleElement): Promise<boolean>;
    /**
     * Adds a rectangle element to the track.
     * Calculates appropriate start/end times based on existing track elements.
     *
     * @param element - The rectangle element to add
     * @returns Promise resolving to true if element was added successfully
     *
     * @example
     * ```js
     * const success = await adder.visitRectElement(rectElement);
     * // success = true if element was added successfully
     * ```
     */
    visitRectElement(element: RectElement): Promise<boolean>;
    visitPlaceholderElement(element: PlaceholderElement): Promise<boolean>;
    /**
     * Adds a line element to the track.
     * Uses the same default duration semantics as other simple shapes.
     */
    visitLineElement(element: LineElement): Promise<boolean>;
    visitArrowElement(element: ArrowElement): Promise<boolean>;
    /**
     * Adds an effect element to the track.
     * For now, uses the same default duration semantics as other simple elements.
     */
    visitEffectElement(element: EffectElement): Promise<boolean>;
}
//# sourceMappingURL=element-adder.d.ts.map