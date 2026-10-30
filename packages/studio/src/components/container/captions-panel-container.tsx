import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import { useTimelineContext } from "@twick/timeline";
import { useLivePlayerTime } from "@twick/live-player";
import { CaptionsPanel } from "../panel/captions-panel";
import { useCaptionsPanel } from "../../hooks/use-captions-panel";
import { activeIndexAt, type CaptionCue } from "../../helpers/caption-sync";

/**
 * CaptionPlayerLink — the ONLY subscriber to the TICKING clock (useLivePlayerTime) in the
 * captions stack.
 *
 * The playback time lives in its own context and changes ~20Hz during playback, so every
 * consumer of it re-renders at that rate. This component renders NOTHING and exists
 * solely to absorb that churn: it derives the active cue id and notifies the parent
 * only when the id actually changes (cue cadence, ~seconds), so the card list —
 * potentially hundreds of controlled textareas — never sees the 20Hz stream.
 *
 * It also keeps the hook's `playheadRef` current, which is where Add subtitle reads the playhead
 * at click time. So neither useCaptionsPanel nor this container's body subscribes to ANY player
 * context, and the panel shell re-renders only when the active cue changes, never on a tick or a
 * seek inside one cue (PR #870 audit, M7: it used to re-render on every seek, because the hook
 * read LivePlayerContext, whose value changes on each one). Keep it that way: never
 * useLivePlayerTime() or useLivePlayerContext() in the hook or the container body.
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
  playheadRef,
}: {
  cues: CaptionCue[];
  cueVersion: number;
  onActiveChange: (id: string | null) => void;
  /** useCaptionsPanel's playhead, read by Add subtitle at click time. */
  playheadRef: MutableRefObject<number | null>;
}) {
  const currentTime = useLivePlayerTime();
  const lastIdRef = useRef<string | null>(null);

  // Before the active-cue effect, and in an effect (a ref written in a discarded concurrent
  // render would hold a time the screen never showed).
  useEffect(() => {
    playheadRef.current = currentTime;
  }, [currentTime, playheadRef]);

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
  const { playheadRef, ...captionsPanelProps } = useCaptionsPanel();
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
        playheadRef={playheadRef}
      />
      <CaptionsPanel
        {...captionsPanelProps}
        activeId={activeId}
        followEnabled={followPlayheadEnabled ?? true}
      />
    </>
  );
}
