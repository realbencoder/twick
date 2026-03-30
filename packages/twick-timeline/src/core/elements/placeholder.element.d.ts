import { Size } from '../../types';
import { TrackElement } from './base.element';
import { ElementVisitor } from '../visitor/element-visitor';

/**
 * Placeholder element for lazy-loaded or not-yet-available media.
 * Rendered as skipped by the visualizer until a handler is registered.
 * Use replaceElementsBySource to replace with the real element once loaded.
 */
export declare class PlaceholderElement extends TrackElement {
    protected parentSize: Size;
    constructor(src: string, parentSize: Size, expectedDuration?: number);
    getSrc(): string;
    getExpectedDuration(): number | undefined;
    getParentSize(): Size;
    accept<T>(visitor: ElementVisitor<T>): T;
}
//# sourceMappingURL=placeholder.element.d.ts.map