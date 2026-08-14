import { useEffect, useMemo, useRef, useState } from "react";
import { useTimelineContext } from "@twick/timeline";
import { useLivePlayerTime } from "@twick/live-player";
import { CaptionsPanel } from "../panel/captions-panel";
import { useCaptionsPanel } from "../../hooks/use-captions-panel";
import { activeIndexAt, type CaptionCue } from "../../helpers/caption-sync";

/**
 * CaptionPlayerLink — the ONLY LivePlayerContext subscriber in the captions stack.
 *
 * LivePlayerContext rebuilds its value object every render, so every consumer
 * re-renders at ~20Hz during playback. This component renders NOTHING and exists
 * solely to absorb that churn: it derives the active cue id and notifies the parent
 * only when the id actually changes (cue cadence, ~seconds), so the card list —
 * potentially hundreds of controlled textareas — never sees the 20Hz stream.
 *
 * The computation runs in an EFFECT, never during render (a parent setState from a
 * child's render phase is illegal, and a ref advanced in a discarded concurrent
 * render silently freezes the highlight). `cueVersion` is a dependency because the
 * cue list can change WITHOUT time moving — Remove Silences or an undo while paused
 * puts a different cue under a stationary playhead.
 */
function CaptionPlayerLink({
  cues,
  cueVersion,
  onActiveChange,
}: {
  cues: CaptionCue[];
  cueVersion: number;
  onActiveChange: (id: string | null) => void;
}) {
  const currentTime = useLivePlayerTime();
  const lastIdRef = useRef<string | null>(null);

  useEffect(() => {
    const idx = activeIndexAt(cues, currentTime);
    const id = idx >= 0 ? cues[idx].id : null;
    if (id !== lastIdRef.current) {
      lastIdRef.current = id;
      onActiveChange(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTime, cueVersion]);

  return null;
}

export function CaptionsPanelContainer() {
  const captionsPanelProps = useCaptionsPanel();
  const { followPlayheadEnabled } = useTimelineContext();
  const [activeId, setActiveId] = useState<string | null>(null);

  const cues = useMemo<CaptionCue[]>(
    () =>
      captionsPanelProps.captions.map((c) => ({ id: c.id, s: c.s, e: c.e })),
    [captionsPanelProps.captions]
  );

  return (
    <>
      <CaptionPlayerLink
        cues={cues}
        cueVersion={captionsPanelProps.cueVersion}
        onActiveChange={setActiveId}
      />
      <CaptionsPanel
        {...captionsPanelProps}
        activeId={activeId}
        followEnabled={followPlayheadEnabled ?? true}
      />
    </>
  );
}
