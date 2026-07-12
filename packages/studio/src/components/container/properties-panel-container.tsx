import { ElementProps } from "../properties/element-props";
import { TextEffects } from "../properties/text-effects";
import {
  VideoElement,
  TextElement,
  AudioElement,
  CaptionElement,
  ArrowElement,
  LineElement,
  RectElement,
  CircleElement,
  type TrackElement,
  Size,
  useTimelineContext,
} from "@twick/timeline";
import { CaptionPropPanel } from "../properties/caption-prop";
import { PlaybackPropsPanel } from "../properties/playback-props";
import { TextPropsPanel } from "../properties/text-props";
import { AnnotationStylePanel } from "../properties/annotation-style-panel";
import { HostPanelExtra } from "./host-panel-extra";
import { useCallback } from "react";

const DEFAULT_CANVAS_BACKGROUND = "#000000";

interface PropertiesPanelContainerProps {
  selectedElement: TrackElement | null;
  updateElement: (element: TrackElement) => void;
  videoResolution: Size;
}

export function PropertiesPanelContainer({
  selectedElement,
  updateElement,
  videoResolution,
}: PropertiesPanelContainerProps) {
  const { editor, present } = useTimelineContext();
  const backgroundColor =
    present?.backgroundColor ??
    editor.getBackgroundColor() ??
    DEFAULT_CANVAS_BACKGROUND;

  const handleBringForward = useCallback(() => {
    if (!selectedElement || !present?.tracks) return;
    const tracks = present.tracks;
    const trackIdx = tracks.findIndex((t: any) => t.elements?.some((e: any) => e.id === selectedElement.getId()));
    if (trackIdx > 0) {
      const editorTracks = editor.getTracksByPredicate(() => true);
      if (trackIdx < editorTracks.length) {
        const reordered = [...editorTracks];
        [reordered[trackIdx - 1], reordered[trackIdx]] = [reordered[trackIdx], reordered[trackIdx - 1]];
        editor.reorderTracks(reordered);
      }
    }
  }, [selectedElement, present, editor]);

  const handleSendBackward = useCallback(() => {
    if (!selectedElement || !present?.tracks) return;
    const tracks = present.tracks;
    const trackIdx = tracks.findIndex((t: any) => t.elements?.some((e: any) => e.id === selectedElement.getId()));
    if (trackIdx >= 0 && trackIdx < tracks.length - 1) {
      const editorTracks = editor.getTracksByPredicate(() => true);
      if (trackIdx < editorTracks.length - 1) {
        const reordered = [...editorTracks];
        [reordered[trackIdx], reordered[trackIdx + 1]] = [reordered[trackIdx + 1], reordered[trackIdx]];
        editor.reorderTracks(reordered);
      }
    }
  }, [selectedElement, present, editor]);

  // Whether Front/Back can actually move the selected element — mirrors the boundary guards in
  // handleBringForward (trackIdx > 0) and handleSendBackward (trackIdx < tracks.length - 1) EXACTLY,
  // computed against present.tracks (the same list the handlers swap within, incl. caption tracks),
  // so we never disable a button that would in fact reorder, and never leave one enabled at the
  // stacking boundary where it silently no-ops. -1 (element not found) disables both.
  const selectedTrackIdx =
    selectedElement && present?.tracks
      ? present.tracks.findIndex((t: any) =>
          t.elements?.some((e: any) => e.id === selectedElement.getId())
        )
      : -1;
  const canBringForward = selectedTrackIdx > 0;
  const canSendBackward =
    selectedTrackIdx >= 0 && selectedTrackIdx < (present?.tracks?.length ?? 0) - 1;

  const handleBackgroundColorChange = useCallback(
    (value: string) => {
      editor.setBackgroundColor(value);
    },
    [editor]
  );

  const annotationTitle =
    selectedElement instanceof ArrowElement
      ? "Arrow callout"
      : selectedElement instanceof LineElement
        ? "Line"
        : selectedElement instanceof RectElement
          ? "Box"
          : selectedElement instanceof CircleElement
            ? "Circle"
            : null;
  const title = annotationTitle
    ?? (selectedElement instanceof TextElement ? selectedElement.getText() : null)
    ?? selectedElement?.getName()
    ?? selectedElement?.getType()
    ?? "Element";

  return (
    <aside className="properties-panel" aria-label="Element properties inspector">
      <div className="properties-header">
        {!selectedElement && (
          <h3 className="properties-title">Composition</h3>
        )}
        {selectedElement && selectedElement.getType() === "caption" && (
          <h3 className="properties-title">Subtitle</h3>
        )}
        {selectedElement && selectedElement.getType() !== "caption" && (
          <h3 className="properties-title">
            {title}
          </h3>
        )}
      </div>

      <div className="prop-content">
        {/* Composition inspector when nothing selected */}
        {!selectedElement && (
          <div className="panel-container">
            <div className="panel-title">Canvas & Render</div>
            <div className="properties-group">
              <div className="property-section">
                <span className="property-label">Size</span>
                <span className="properties-size-readonly">
                  {videoResolution.width} × {videoResolution.height}
                </span>
              </div>
              <div className="color-control">
                <label className="label-small">Background Color</label>
                <div className="color-inputs">
                  <input
                    type="color"
                    value={backgroundColor}
                    onChange={(e) =>
                      handleBackgroundColorChange(e.target.value)}
                    className="color-picker"
                  />
                  <input
                    type="text"
                    value={backgroundColor}
                    onChange={(e) =>
                      handleBackgroundColorChange(e.target.value)}
                    className="color-text"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Caption inspector when caption is selected */}
        {selectedElement instanceof CaptionElement && (
            <>
              <CaptionPropPanel
                selectedElement={selectedElement}
                updateElement={updateElement}
              />
              {/* Host-app slot (e.g. saved subtitle style presets) */}
              <HostPanelExtra kind="caption" />
            </>
          )}

        {/* Element inspector when non-caption is selected */}
        {selectedElement && !(selectedElement instanceof CaptionElement) && (
            <>
              {(() => {
                const isText = selectedElement instanceof TextElement;
                const isVideo = selectedElement instanceof VideoElement;
                const isAudio = selectedElement instanceof AudioElement;

                const isAnnotation =
                  selectedElement instanceof ArrowElement ||
                  selectedElement instanceof LineElement ||
                  selectedElement instanceof RectElement ||
                  selectedElement instanceof CircleElement;

                return (
                  <>
                    {/* Typography (Text only) */}
                    {isText && (
                      <TextPropsPanel
                        selectedElement={selectedElement}
                        updateElement={updateElement}
                      />
                    )}

                    {/* Transform – visual elements only (not audio) */}
                    {!isAudio && (
                      <ElementProps
                        selectedElement={selectedElement}
                        updateElement={updateElement}
                        onBringForward={handleBringForward}
                        onSendBackward={handleSendBackward}
                        canBringForward={canBringForward}
                        canSendBackward={canSendBackward}
                      />
                    )}

                    {/* Annotation style – color & opacity (arrow, highlight, blur) */}
                    {isAnnotation && (
                      <AnnotationStylePanel
                        selectedElement={selectedElement}
                        updateElement={updateElement}
                      />
                    )}

                    {/* Playback + Volume – video and audio */}
                    {(isVideo || isAudio) && (
                      <PlaybackPropsPanel
                        selectedElement={selectedElement}
                        updateElement={updateElement}
                      />
                    )}

                    {/* Text Effects – text only */}
                    {isText && (
                      <TextEffects
                        selectedElement={selectedElement}
                        updateElement={updateElement}
                      />
                    )}

                    {/* Host-app slot (e.g. saved text style presets) – text only */}
                    {isText && <HostPanelExtra kind="text" />}

                    {/* Animations panel REMOVED — the element fade/enter/exit animation
                        props it wrote were a no-op: our WebCodecs editor preview has no
                        time-based element animation, and the server render (all videos)
                        never reads animation props. Configuring a Fade did nothing in
                        preview OR output — a silent trap. Same rationale as the fork's
                        removed generate-media/Effect/Shape tools. If real element fade
                        in/out is ever wanted, wire it into BOTH playback-controller and
                        render-worker/canvas-renderer.mjs, then restore this panel. */}

                    {/* Generate subtitles is handled by the host app's header button */}
                  </>
                );
              })()}
            </>
          )}
      </div>
    </aside>
  );
}
