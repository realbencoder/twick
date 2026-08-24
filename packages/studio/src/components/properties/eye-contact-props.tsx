import { useEffect, useState } from "react";
import type { PropertiesPanelProps } from "../../types";
import { PropertyRow } from "./property-row";

/**
 * Per-clip eye contact.
 *
 * Reads the app bridge (SOURCE seconds) and emits the clip's own source window back. There is
 * deliberately NO timeline<->source mapping: a mapper returning fewer ranges than it was given
 * is what crashed the previous design in production.
 */
type Bridge = {
  ranges: Array<[number, number]>;
  active: boolean;
  /** Only the MAIN recording has eye contact. B-roll satisfies `isVideo` too, so without
   *  this the row would appear on stock footage and offer a meaningless choice. */
  mainTrackId: string;
} | null | undefined;

const midpointExcluded = (from: number, to: number, ranges: Array<[number, number]>) => {
  const mid = (from + to) / 2;
  for (const [a, b] of ranges) if (mid >= a && mid < b) return true;
  return false;
};

export function EyeContactProps({ selectedElement }: PropertiesPanelProps) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const bump = () => setTick((t) => t + 1);
    window.addEventListener("twick-eyecontact", bump);
    return () => window.removeEventListener("twick-eyecontact", bump);
  }, []);

  const bridge = (window as any).__twick_eyecontact as Bridge;
  // Absent bridge = no correction, or the master toggle is off. Either way a per-clip
  // "use original" is meaningless, so the row does not exist.
  if (!bridge?.active || !selectedElement) return null;
  // B-roll and overlays are not the recording eye contact corrected.
  if (selectedElement.getTrackId?.() !== bridge.mainTrackId) return null;

  const props = selectedElement.getProps?.() ?? {};
  const rate = Number(props.playbackRate) || 1;
  const from = Math.max(0, Number(props.time) || 0);
  const to = from + Math.max(0, (selectedElement.getEnd() - selectedElement.getStart()) * rate);
  const off = midpointExcluded(from, to, bridge.ranges ?? []);
  void tick; // re-read on every bridge dispatch

  const toggle = () => {
    window.dispatchEvent(
      new CustomEvent("twick-eyecontact-clip", {
        detail: { sourceStart: from, sourceEnd: to, off: !off },
      })
    );
  };

  return (
    <div className="panel-container">
      <div className="panel-title">Eye contact</div>
      <PropertyRow label="Eye contact">
        <button
          type="button"
          onClick={toggle}
          aria-pressed={!off}
          data-testid="eye-contact-toggle"
          className={off ? "twick-toggle" : "twick-toggle twick-toggle-on"}
        >
          {off ? "Off" : "On"}
        </button>
      </PropertyRow>
      <div className="property-hint" data-testid="eye-contact-hint">
        {off
          ? "Using your original footage here. Everything else stays corrected."
          : "Using the corrected version of this clip."}
      </div>
    </div>
  );
}

export default EyeContactProps;
