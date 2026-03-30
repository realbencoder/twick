import { TrackElement } from './base.element';
import { ElementVisitor } from '../visitor/element-visitor';
import { EffectProps } from '../../types';

export declare class EffectElement extends TrackElement {
    protected props: EffectProps;
    constructor(effectKey: EffectProps["effectKey"], props?: Partial<EffectProps>);
    getEffectKey(): EffectProps["effectKey"];
    getIntensity(): number;
    getProps(): EffectProps;
    setEffectKey(effectKey: EffectProps["effectKey"]): this;
    setIntensity(intensity: number): this;
    setProps(props: EffectProps): this;
    accept<T>(visitor: ElementVisitor<T>): T;
}
//# sourceMappingURL=effect.element.d.ts.map