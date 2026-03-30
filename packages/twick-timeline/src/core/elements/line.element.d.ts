import { LineProps, Size } from '../../types';
import { TrackElement } from './base.element';
import { ElementVisitor } from '../visitor/element-visitor';

/**
 * LineElement represents a simple line/segment shape.
 *
 * Semantics:
 * - props.width  → visual length of the line
 * - props.height → visual thickness of the line
 * - props.fill   → line color
 * - props.radius → roundedness of the caps (handled by canvas/visualizer)
 */
export declare class LineElement extends TrackElement {
    protected props: LineProps;
    constructor(fill: string, size: Size);
    accept<T>(visitor: ElementVisitor<T>): T;
}
//# sourceMappingURL=line.element.d.ts.map