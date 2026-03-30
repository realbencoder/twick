import { TrackElement } from './base.element';
import { ElementVisitor } from '../visitor/element-visitor';
import { AudioProps } from '../../types';

export declare class AudioElement extends TrackElement {
    protected mediaDuration: number;
    protected props: AudioProps;
    constructor(src: string);
    getMediaDuration(): number;
    getStartAt(): number;
    getEndAt(): number;
    getSrc(): string;
    getPlaybackRate(): number;
    getVolume(): number;
    updateAudioMeta(): Promise<void>;
    setSrc(src: string): Promise<this>;
    setMediaDuration(mediaDuration: number): this;
    setVolume(volume: number): this;
    setLoop(loop: boolean): this;
    setStartAt(time: number): this;
    setPlaybackRate(playbackRate: number): this;
    setProps(props: Omit<any, "src">): this;
    accept<T>(visitor: ElementVisitor<T>): T;
}
//# sourceMappingURL=audio.element.d.ts.map