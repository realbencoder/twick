import { TrackElement } from './base.element';
import { ElementVisitor } from '../visitor/element-visitor';
import { Size } from '../../types';

export declare class IconElement extends TrackElement {
    constructor(src: string, size: Size, fill?: string);
    getSrc(): string;
    getFill(): string;
    getSize(): Size | undefined;
    setSrc(src: string): this;
    setFill(fill: string): this;
    setSize(size: Size): this;
    accept<T>(visitor: ElementVisitor<T>): T;
}
//# sourceMappingURL=icon.element.d.ts.map