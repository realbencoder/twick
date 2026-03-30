import { FrameEffect, FrameEffectProps } from '../../types';

export declare class ElementFrameEffect {
    private s;
    private e;
    private props;
    constructor(start: number, end: number);
    setProps(props: FrameEffectProps): this;
    getProps(): FrameEffectProps;
    getStart(): number;
    getEnd(): number;
    setStart(start: number): this;
    setEnd(end: number): this;
    toJSON(): FrameEffect;
    static fromJSON(json: FrameEffect): ElementFrameEffect;
}
//# sourceMappingURL=frame-effect.d.ts.map