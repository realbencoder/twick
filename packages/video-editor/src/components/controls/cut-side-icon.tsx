/**
 * The delete before / after the playhead icons (Ben, 2026-11-02: "a scissors with the side it
 * removes marked"). A small scissors whose blades point at a crossed-out box on the side the button
 * removes: the box on the left for "before", on the right for "after". The old ArrowLeftToLine /
 * ArrowRightToLine read as "jump to start / end", too close to the transport's SkipBack /
 * SkipForward, and Ben pressed one by accident.
 *
 * Drawn on lucide's 24 px grid with lucide's stroke (2, round caps and joins, currentColor), so it
 * sits beside the Scissors and Undo icons at the same weight. The scissors is lucide's own
 * `scissors` geometry at 0.6 scale; "after" is the exact mirror of "before". Coordinates are
 * written out, not transformed, so the box's side is plain in the markup.
 */
const SHAPES = {
  before: {
    box: { x: 1.5, y: 5, width: 8.5, height: 14 },
    cross: "M4 9.5 7.5 14.5M7.5 9.5 4 14.5",
    handles: [
      { cx: 21, cy: 8.4 },
      { cx: 21, cy: 15.6 },
    ],
    blades: ["M19.73 9.67 17.4 12", "M12.6 7.2 19.73 14.33", "M15.72 13.68 12.6 16.8"],
  },
  after: {
    box: { x: 14, y: 5, width: 8.5, height: 14 },
    cross: "M20 9.5 16.5 14.5M16.5 9.5 20 14.5",
    handles: [
      { cx: 3, cy: 8.4 },
      { cx: 3, cy: 15.6 },
    ],
    blades: ["M4.27 9.67 6.6 12", "M11.4 7.2 4.27 14.33", "M8.28 13.68 11.4 16.8"],
  },
} as const;

export const CutSideIcon = ({ side, className = "" }: { side: "before" | "after"; className?: string }) => {
  const s = SHAPES[side];
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`twick-cut-side-icon ${className}`.trim()}
      data-side={side}
      aria-hidden="true"
    >
      <rect x={s.box.x} y={s.box.y} width={s.box.width} height={s.box.height} rx={1.5} />
      <path d={s.cross} />
      {s.handles.map((h) => (
        <circle key={`${h.cx}-${h.cy}`} cx={h.cx} cy={h.cy} r={1.8} />
      ))}
      {s.blades.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
};
