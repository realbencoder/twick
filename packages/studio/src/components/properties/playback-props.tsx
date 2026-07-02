import type { PropertiesPanelProps } from "../../types";
import { AccordionItem } from "../shared/accordion-item";
import { PropertyRow } from "./property-row";
import { Music2 } from "lucide-react";
import { useState } from "react";

const PLAYBACK_RATE_MIN = 0.25;
const PLAYBACK_RATE_MAX = 2;
const PLAYBACK_RATE_STEP = 0.25;

// Volume shown as PERCENT (100% = original loudness), the creator-friendly convention
// (CapCut/Descript). The old dB display read "0 dB" at unity, which users read as "silent"
// (founder-reported confusion). Stored prop stays LINEAR gain (volume = pct/100) — same
// semantics the render pipeline and the timeline waveform gain already consume.
const VOLUME_PCT_MIN = 0;
const VOLUME_PCT_MAX = 200;

export function PlaybackPropsPanel({
  selectedElement,
  updateElement,
}: PropertiesPanelProps) {
  const elementProps = selectedElement?.getProps() || {};
  const volumeLinear = elementProps.volume ?? 1;
  const volumePct = Math.round(volumeLinear * 100);
  const playbackRate = elementProps.playbackRate ?? 1;

  const handleUpdateElement = (props: Record<string, any>) => {
    if (selectedElement) {
      updateElement?.(selectedElement?.setProps({ ...elementProps, ...props }));
    }
  };

  const handleVolumePctChange = (pct: number) => {
    handleUpdateElement({ volume: Math.max(0, pct) / 100 });
  };

  const handlePlaybackRateChange = (rate: number) => {
    handleUpdateElement({ playbackRate: rate });
  };

  const [isPlaybackOpen, setIsPlaybackOpen] = useState(false);

  return (
    <div className="panel-container">
      <div className="panel-title">Playback</div>
      <AccordionItem
        title="Playback"
        icon={<Music2 className="icon-sm" />}
        isOpen={isPlaybackOpen}
        onToggle={() => setIsPlaybackOpen((open) => !open)}
      >
        <div className="properties-group">
          {/* Playback rate */}
          <div className="property-section">
            <PropertyRow
              label="Playback rate"
              secondary={<span>{playbackRate}×</span>}
            >
              <input
                type="range"
                min={PLAYBACK_RATE_MIN}
                max={PLAYBACK_RATE_MAX}
                step={PLAYBACK_RATE_STEP}
                value={playbackRate}
                onChange={(e) =>
                  handlePlaybackRateChange(Number(e.target.value))
                }
                className="slider-purple"
              />
            </PropertyRow>
          </div>

          {/* Volume (%) — 100% = original, 0% = muted */}
          <div className="property-section">
            <PropertyRow
              label="Volume"
              secondary={
                <span>{volumePct === 0 ? "Muted" : `${volumePct}%`}</span>
              }
            >
              <input
                type="range"
                min={VOLUME_PCT_MIN}
                max={VOLUME_PCT_MAX}
                step={1}
                value={volumePct}
                onChange={(e) =>
                  handleVolumePctChange(Number(e.target.value))
                }
                className="slider-purple"
              />
            </PropertyRow>
          </div>
        </div>
      </AccordionItem>
    </div>
  );
}
