import { TextEffect } from '../../types';

export declare class ElementTextEffect {
    private name;
    private duration?;
    private delay?;
    private bufferTime?;
    constructor(name: string);
    getName(): string;
    getDuration(): number | undefined;
    getDelay(): number | undefined;
    getBufferTime(): number | undefined;
    setDuration(duration?: number): this;
    setDelay(delay?: number): this;
    setBufferTime(bufferTime?: number): this;
    toJSON(): TextEffect;
    static fromJSON(json: TextEffect): ElementTextEffect;
}
//# sourceMappingURL=text-effect.d.ts.map