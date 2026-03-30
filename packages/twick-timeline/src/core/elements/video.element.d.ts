import { Frame, ObjectFit, Position, Size, VideoProps } from '../../types';
import { TrackElement } from './base.element';
import { ElementVisitor } from '../visitor/element-visitor';
import { ElementFrameEffect } from '../addOns/frame-effect';

export declare class VideoElement extends TrackElement {
    protected baseSize: Size;
    protected mediaDuration: number;
    protected parentSize: Size;
    protected backgroundColor: string;
    protected objectFit: ObjectFit;
    protected frameEffects?: ElementFrameEffect[];
    protected frame: Frame;
    protected props: VideoProps;
    constructor(src: string, parentSize: Size);
    getParentSize(): Size;
    getFrame(): Frame;
    getFrameEffects(): ElementFrameEffect[] | undefined;
    getBackgroundColor(): string;
    getObjectFit(): ObjectFit;
    getMediaDuration(): number;
    getStartAt(): number;
    getEndAt(): number;
    getSrc(): string;
    getPlaybackRate(): number;
    getVolume(): number;
    getRotation(): number;
    setRotation(rotation: number): this;
    getPosition(): Position;
    updateVideoMeta(updateFrame?: boolean): Promise<void>;
    setPosition(position: Position): this;
    setSrc(src: string): Promise<this>;
    setMediaDuration(mediaDuration: number): this;
    setParentSize(parentSize: Size): this;
    setObjectFit(objectFit: ObjectFit): this;
    setFrame(frame: Frame): this;
    setPlaybackRate(playbackRate: number): this;
    setStartAt(time: number): this;
    setMediaFilter(mediaFilter: string): this;
    setVolume(volume: number): this;
    setBackgroundColor(backgroundColor: string): this;
    setProps(props: Omit<any, "src">): this;
    setFrameEffects(frameEffects?: ElementFrameEffect[]): this;
    addFrameEffect(frameEffect: ElementFrameEffect): this;
    accept<T>(visitor: ElementVisitor<T>): T;
}
//# sourceMappingURL=video.element.d.ts.map