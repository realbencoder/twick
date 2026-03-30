import { TrackElement } from './base.element';
import { ElementVisitor } from '../visitor/element-visitor';
import { CircleProps } from '../../types';

export declare class CircleElement extends TrackElement {
    protected props: CircleProps;
    constructor(fill: string, radius: number);
    getFill(): string;
    getRadius(): number;
    getStrokeColor(): string;
    getLineWidth(): number;
    setFill(fill: string): this;
    setRadius(radius: number): this;
    setStrokeColor(strokeColor: string): this;
    setLineWidth(lineWidth: number): this;
    accept<T>(visitor: ElementVisitor<T>): T;
}
//# sourceMappingURL=circle.element.d.ts.map