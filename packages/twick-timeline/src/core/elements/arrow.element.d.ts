import { ArrowProps, Size } from '../../types';
import { TrackElement } from './base.element';
import { ElementVisitor } from '../visitor/element-visitor';

export declare class ArrowElement extends TrackElement {
    protected props: ArrowProps;
    constructor(fill: string, size: Size);
    accept<T>(visitor: ElementVisitor<T>): T;
}
//# sourceMappingURL=arrow.element.d.ts.map