/**
 * @twick/video-editor - Video Editor Package
 * 
 * A comprehensive React-based video editor component for the Twick platform.
 * Provides a complete video editing interface with timeline management,
 * player controls, media management, and animation capabilities.
 * 
 * @example
 * ```jsx
 * import VideoEditor, { 
 *   usePlayerControl, 
 *   BrowserMediaManager,
 *   ANIMATIONS,
 *   TEXT_EFFECTS,
 *   PlayerControlsProps,
 *   VideoEditorProps
 * } from '@twick/video-editor';
 * 
 * function App() {
 *   return (
 *     <VideoEditor
 *       editorConfig={{
 *         videoProps: { width: 1920, height: 1080 },
 *         canvasMode: true
 *       }}
 *       defaultPlayControls={true}
 *     />
 *   );
 * }
 * ```
 */

// Auto-import CSS styles
import "./styles/video-editor.css";

import VideoEditor, { VideoEditorProps, VideoEditorConfig, TimelineTickConfig, TimelineZoomConfig } from "./components/video-editor";
import PlayerControls, { PlayerControlsProps, CutButtonState } from "./components/controls/player-controls";
import TimelineManager from "./components/timeline/timeline-manager";
import { usePlayerControl } from "./hooks/use-player-control";
import { useEditorManager } from "./hooks/use-editor-manager";
import BrowserMediaManager from "./helpers/media-manager/browser-media-manager";
import { MediaItem, PaginationOptions, SearchOptions, Animation, TextEffect, ElementColors, CanvasConfig } from "./helpers/types";
import type { AssetLibrary, AssetListParams, AssetProviderConfig, Paginated as AssetPaginated } from "./helpers/asset-library";
import BaseMediaManager from "./helpers/media-manager/base-media-manager";
import { animationGifs, getAnimationGif } from "./assets";
import { ANIMATIONS } from "./helpers/animation-manager";
import { TEXT_EFFECTS } from "./helpers/text-effects-manager";
import useTimelineControl from "./hooks/use-timeline-control";
import { setElementColors } from "./helpers/editor.utils";  

export { setElementColors };

// Types and interfaces
export type {
  MediaItem,
  PaginationOptions,
  SearchOptions,
  Animation,
  TextEffect,
  ElementColors,
  AssetLibrary,
  AssetListParams,
  AssetProviderConfig,
  AssetPaginated,
};
export type { PlayerControlsProps, CutButtonState, VideoEditorProps, VideoEditorConfig, TimelineTickConfig, TimelineZoomConfig, CanvasConfig };

export { throttle, debounce } from "./helpers/function.utils";
export { clearFilmstripCache } from "./helpers/filmstrip-render";
// Give-back drag (extend a clip after a cut). Exported as PURE functions so the host app can pin
// the seam-budget arithmetic and the round-trip against the shipped dist — the same artifact the
// editor runs, so the test doubles as proof the dist was actually rebuilt.
export {
  planSeamGiveBack,
  planSeamGiveBackStart,
  reclaimableSeconds,
  reclaimMapForTrack,
  startReclaimMapForTrack,
  tailReclaimForTrack,
  mainTailEndLimit,
  eyeContactToReassert,
  mainSeamNeighbourStart,
  mainSeamNeighbourEnd,
  seamSourceBudget,
  endHandleLimit,
  startHandleLimit,
  startReclaimGrow,
  endHandleSnapTargets,
  snapFloorForGrowth,
  reclaimAffordance,
  startReclaimAffordance,
  outPointOf,
  inPointOf,
  normalizeSrc,
  resolveSourceDuration,
  MAIN_TRACK_NAME,
} from "./helpers/seam-give-back";
// Timeline strip windowing. EXPORTED SO THE APP CAN EXECUTE IT, not for app runtime use.
// An adversarial review landed NINE distinct silent reverts of this feature — including one that
// made it entirely inert — past a marker test that only string-matched the built bundle. The dist
// carries its own inlined copy of these functions, so the fork's unit tests were exercising a
// DIFFERENT copy than the one that ships, and nothing compared them. Exporting them lets the app
// suite run the shipped arithmetic against real numbers, which is the only thing that closes that
// hole. Do not remove without replacing the app-side execution test.
export {
  computeStripWindow,
  windowToSourceRange,
  stripNeedsRedraw,
  readTimelineViewport,
  STRIP_OVERSCAN_FACTOR,
  TIMELINE_SCROLL_SELECTOR,
} from "./helpers/strip-window";
export type { StripWindow, StripWindowInput } from "./helpers/strip-window";
// Canvas context-menu z-order decision. Exported so the app suite can EXECUTE the shipped rule
// (the inline copy it replaced was inverted for the product's whole life, and a marker test alone
// cannot tell "front moves toward index 0" from "front moves toward the end").
export { reorderTracksForZOrder } from "./helpers/z-order";
export type { ZOrderDirection } from "./helpers/z-order";
// The creator's subtitle records (edited / removed by hand), written by the Subtitles panel, the
// timeline's Delete and the canvas, read by the host's restore planner. Exported so the studio
// writes them through the same helpers and the app suite can execute them against the dist.
export {
  CAPTION_TEXT_EDITED_PROP,
  CAPTION_EDITED_IDS_PROP,
  CAPTION_REMOVED_IDS_PROP,
  recordCaptionTrackId,
  markCaptionTextEdited,
  recordCaptionRemoval,
  carryCaptionRecords,
} from "./helpers/caption-records";
export type { CaptionRecordKey } from "./helpers/caption-records";
// Cutting at the playhead (Split, delete before/after). Exported so the app suite EXECUTES the
// shipped decision rules instead of string-matching the bundle; see
// tests/unit/playhead-cut-dist.test.ts in the app. Do not remove without replacing that test.
export {
  resolveSplitTarget,
  resolveDeleteRange,
  playheadCutMessage,
  PLAYHEAD_CUT_REFUSED_EVENT,
} from "./helpers/playhead-cut";
export type {
  PlayheadCutAction,
  PlayheadCutRefusal,
  SplitTarget,
  DeleteRange,
} from "./helpers/playhead-cut";
// Ruler tick decisions. Exported for the same reason as the strip-window helpers above: so the app
// suite can EXECUTE the shipped arithmetic. Grep-only marker tests let nine silent reverts through
// on an earlier change in this package.
export {
  chooseTickInterval,
  planRulerTicks,
  planTickRange,
  RANGE_BLOCK,
  RULER_OVERSCAN_VIEWPORTS,
  formatRulerLabel,
  NICE_TICK_INTERVALS,
  TARGET_LABEL_PX,
  MAX_MAJORS,
  MAX_MINORS,
} from "./helpers/ruler-ticks";
export type { TickInterval, TickRange } from "./helpers/ruler-ticks";
// Adding a picked part of a video, and keeping a preset length at the playhead. Exported so the
// studio's add paths build elements the same way, and FOR TESTING: the app suite executes them and
// useEditorManager().addElement against the shipped dist (tests/unit/media-add-placement-dist.test.tsx).
export { applyMediaRange, placeKeepingLength } from "./helpers/media-range";
export type { PickedMediaRange } from "./helpers/media-range";
// SeekTrack (the ruler) is exported FOR TESTING, not for host use — mount it via VideoEditor.
//
// Three separate reviews of this component found the same hole: the tick DECISIONS are pure and
// provable, but WHICH ARGUMENTS the component hands them is not, and that is where every real
// defect lived. A version of this feature that was entirely inert shipped past twelve passing
// tests, and after two rounds of fixes three one-token mutations (`viewportWidth: null`,
// `viewport: null`, inverting the viewport guard) still passed a 15-test suite — the first of them
// restoring the original reported bug exactly.
//
// No pure helper can close that, because the mutation IS the call site. The only thing that can is
// rendering the component and reading what it drew. It takes seven plain props and no context, so
// this costs nothing structurally. See tests/unit/timeline-ruler-render.test.tsx in the app.
export { default as SeekTrack } from "./components/track/seek-track";
// TrackElementView (one clip on a track) is exported FOR TESTING too, for the same reason: the
// give-back's drag clamps, what a left-edge drag draws, and when a reclaim band paints are view
// decisions that a regex over the bundle cannot tell apart from their mutations. It takes plain
// props and no context. See tests/unit/track-element-give-back-render.test.tsx in the app.
export { TrackElementView } from "./components/track/track-element";
// useTimelineManager too: what a trim or give-back COMMITS (the tail clamp, the "lands where it was"
// no-op, the in-point write, eye contact on restored footage) is decided in its onElementDrag, and a
// regex over the bundle cannot tell those apart from their mutations either. It needs only the
// timeline and live-player providers. See tests/unit/timeline-manager-commit.test.tsx in the app.
export { useTimelineManager } from "./hooks/use-timeline-manager";
// ControlManager (the transport row and its keys) is exported FOR TESTING, not for host use; mount
// it via VideoEditor. Which clip S, Cmd/Ctrl+B and the Scissors button cut, what they select after,
// the refusal event and the button's title are decided where it hands the playhead time and the
// selection to resolveSplitTarget, and a regex over the bundle cannot tell those call sites apart
// from their mutations. It needs only the timeline and live-player providers. See
// tests/unit/playhead-cut-controls-dist.test.tsx in the app.
export { default as ControlManager } from "./components/controls/control-manager";
// usePlayerManager too, FOR TESTING: the canvas's Delete and caption drag write the creator's
// subtitle records (helpers/caption-records.ts) here. See
// tests/unit/subtitle-creator-records-dist.test.tsx in the app.
export { usePlayerManager } from "./hooks/use-player-manager";
export type {
  SeamGiveBackPlan,
  SeamElementLike,
  SeamTrackLike,
  ReclaimAffordance,
} from "./helpers/seam-give-back";
// Constants and configurations
export { ANIMATIONS, TEXT_EFFECTS };

// Components and hooks
export { 
  usePlayerControl, 
  useEditorManager,
  BrowserMediaManager, 
  BaseMediaManager, 
  animationGifs, 
  getAnimationGif, 
  PlayerControls, 
  TimelineManager, 
  useTimelineControl 
};

// Utilities and constants
export * from "./helpers/constants";

// Default export
export default VideoEditor;