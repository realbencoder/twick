import { RectProps, Size } from '../../types';
import { TrackElement } from './base.element';
import { ElementVisitor } from '../visitor/element-visitor';

export declare class RectElement extends TrackElement {
    protected props: RectProps;
    constructor(fill: string, size: Size);
    getFill(): string;
    setFill(fill: string): this;
    getSize(): Size;
    getCornerRadius(): number;
    getStrokeColor(): string;
    getLineWidth(): number;
    setSize(size: Size): this;
    setCornerRadius(cornerRadius: number): this;
    setStrokeColor(strokeColor: string): this;
    setLineWidth(lineWidth: number): this;
    accept<T>(visitor: ElementVisitor<T>): T;
}
//# sourceMappingURL=rect.element.d.ts.map