import { TrackElement } from './base.element';
import { ElementVisitor } from '../visitor/element-visitor';

export declare class CaptionElement extends TrackElement {
    protected t: string;
    constructor(t: string, start: number, end: number);
    getText(): string;
    setText(t: string): this;
    accept<T>(visitor: ElementVisitor<T>): T;
}
//# sourceMappingURL=caption.element.d.ts.map