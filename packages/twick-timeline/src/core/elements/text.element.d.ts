import { TextAlign, TextProps } from '../../types';
import { TrackElement } from './base.element';
import { ElementVisitor } from '../visitor/element-visitor';
import { ElementTextEffect } from '../addOns/text-effect';

export declare class TextElement extends TrackElement {
    protected textEffect?: ElementTextEffect;
    protected props: TextProps;
    constructor(text: string, props?: Omit<TextProps, 'text'>);
    getTextEffect(): ElementTextEffect | undefined;
    getText(): string;
    getStrokeColor(): string | undefined;
    getLineWidth(): number | undefined;
    getProps(): TextProps;
    setText(text: string): this;
    setFill(fill: string): this;
    setRotation(rotation: number): this;
    setFontSize(fontSize: number): this;
    setFontFamily(fontFamily: string): this;
    setFontWeight(fontWeight: number): this;
    setFontStyle(fontStyle: "normal" | "italic"): this;
    setTextEffect(textEffect?: ElementTextEffect): this;
    setTextAlign(textAlign: TextAlign): this;
    setStrokeColor(stroke: string): this;
    setLineWidth(lineWidth: number): this;
    setProps(props: TextProps): this;
    accept<T>(visitor: ElementVisitor<T>): T;
}
//# sourceMappingURL=text.element.d.ts.map