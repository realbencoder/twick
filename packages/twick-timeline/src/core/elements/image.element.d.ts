import { Frame, ImageProps, ObjectFit, Position, Size } from '../../types';
import { TrackElement } from './base.element';
import { ElementVisitor } from '../visitor/element-visitor';
import { ElementFrameEffect } from '../addOns/frame-effect';

export declare class ImageElement extends TrackElement {
    protected backgroundColor: string;
    protected parentSize: Size;
    protected objectFit: ObjectFit;
    frameEffects?: ElementFrameEffect[];
    frame: Frame;
    protected props: ImageProps;
    constructor(src: string, parentSize: Size);
    getParentSize(): Size;
    getFrame(): Frame;
    getFrameEffects(): ElementFrameEffect[] | undefined;
    getBackgroundColor(): string;
    getObjectFit(): ObjectFit;
    getRotation(): number;
    setRotation(rotation: number): this;
    getPosition(): Position;
    updateImageMeta(updateFrame?: boolean): Promise<void>;
    setPosition(position: Position): this;
    setSrc(src: string): Promise<this>;
    setObjectFit(objectFit: ObjectFit): this;
    setFrame(frame: Frame): this;
    setParentSize(parentSize: Size): this;
    setMediaFilter(mediaFilter: string): this;
    setBackgroundColor(backgroundColor: string): this;
    setProps(props: Omit<any, "src">): this;
    setFrameEffects(frameEffects?: ElementFrameEffect[]): this;
    addFrameEffect(frameEffect: ElementFrameEffect): this;
    accept<T>(visitor: ElementVisitor<T>): T;
}
//# sourceMappingURL=image.element.d.ts.map