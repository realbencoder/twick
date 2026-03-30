import { ImageProps, Position, TextProps, WatermarkJSON } from '../../types';

declare class Watermark {
    private id;
    private type;
    private position?;
    private rotation?;
    private opacity?;
    private props?;
    constructor(type: 'text' | 'image');
    getId(): string;
    getType(): "text" | "image";
    getPosition(): Position | undefined;
    getRotation(): number | undefined;
    getOpacity(): number | undefined;
    getProps(): TextProps | ImageProps | undefined;
    setProps(props: TextProps | ImageProps): this;
    setPosition(position: Position): this;
    setRotation(rotation: number): this;
    setOpacity(opacity: number): this;
    toJSON(): WatermarkJSON;
    static fromJSON(json: WatermarkJSON): Watermark;
}
export default Watermark;
//# sourceMappingURL=watermark.d.ts.map