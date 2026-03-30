import { Animation } from '../../types';

export declare class ElementAnimation {
    private name;
    private interval?;
    private duration?;
    private intensity?;
    private animate?;
    private mode?;
    private direction?;
    constructor(name: string);
    getName(): string;
    getInterval(): number | undefined;
    getDuration(): number | undefined;
    getIntensity(): number | undefined;
    getAnimate(): "enter" | "exit" | "both" | undefined;
    getMode(): "in" | "out" | undefined;
    getDirection(): "left" | "center" | "right" | "up" | "down" | undefined;
    setInterval(interval?: number): this;
    setDuration(duration?: number): this;
    setIntensity(intensity?: number): this;
    setAnimate(animate?: "enter" | "exit" | "both"): this;
    setMode(mode?: "in" | "out"): this;
    setDirection(direction?: "up" | "down" | "left" | "right" | "center"): this;
    toJSON(): Animation;
    static fromJSON(json: Animation): ElementAnimation;
}
//# sourceMappingURL=animation.d.ts.map