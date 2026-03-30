import { ElementVisitor } from '../visitor/element-visitor';
import { ElementAnimation } from '../addOns/animation';
import { ElementMetadata, ElementTransitionJSON, Position } from '../../types';

export declare abstract class TrackElement {
    protected id: string;
    protected type: string;
    protected s: number;
    protected e: number;
    protected trackId: string;
    protected name: string;
    protected animation?: ElementAnimation;
    protected props: Record<string, any>;
    protected metadata?: ElementMetadata;
    constructor(type: string, id?: string);
    abstract accept<T>(visitor: ElementVisitor<T>): T;
    getId(): string;
    getType(): string;
    getStart(): number;
    getEnd(): number;
    getDuration(): number;
    getTrackId(): string;
    getProps(): Record<string, any>;
    getMetadata(): ElementMetadata | undefined;
    getName(): string;
    getAnimation(): ElementAnimation | undefined;
    getPosition(): Position;
    getRotation(): number;
    getOpacity(): number;
    setId(id: string): this;
    setType(type: string): this;
    setStart(s: number): this;
    setEnd(e: number): this;
    setTrackId(trackId: string): this;
    setName(name: string): this;
    setAnimation(animation?: ElementAnimation): this;
    setPosition(position: Position): this;
    setRotation(rotation: number): this;
    setOpacity(opacity: number): this;
    setProps(props: Record<string, any>): this;
    setMetadata(metadata?: ElementMetadata): this;
    getTransition(): ElementTransitionJSON | undefined;
    setTransition(transition: ElementTransitionJSON | undefined): this;
}
//# sourceMappingURL=base.element.d.ts.map