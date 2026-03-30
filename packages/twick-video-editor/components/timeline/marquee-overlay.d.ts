interface MarqueeRect {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
}
interface MarqueeOverlayProps {
    marquee: MarqueeRect | null;
}
/** Renders the marquee selection rectangle. Does not capture pointer events. */
export declare function MarqueeOverlay({ marquee }: MarqueeOverlayProps): import("react/jsx-runtime").JSX.Element;
export {};
