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
import PlayerControls, { PlayerControlsProps } from "./components/controls/player-controls";
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
export type { PlayerControlsProps, VideoEditorProps, VideoEditorConfig, TimelineTickConfig, TimelineZoomConfig, CanvasConfig };

export { throttle, debounce } from "./helpers/function.utils";
export { clearFilmstripCache } from "./helpers/filmstrip-render";
// Give-back drag (extend a clip after a cut). Exported as PURE functions so the host app can pin
// the seam-budget arithmetic and the round-trip against the shipped dist — the same artifact the
// editor runs, so the test doubles as proof the dist was actually rebuilt.
export {
  planSeamGiveBack,
  reclaimableSeconds,
  reclaimMapForTrack,
  mainSeamNeighbourStart,
  seamSourceBudget,
  endHandleLimit,
  endHandleSnapTargets,
  snapFloorForGrowth,
  reclaimAffordance,
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
// Ruler tick decisions. Exported for the same reason as the strip-window helpers above: so the app
// suite can EXECUTE the shipped arithmetic. Grep-only marker tests let nine silent reverts through
// on an earlier change in this package.
export {
  chooseTickInterval,
  formatRulerLabel,
  NICE_TICK_INTERVALS,
  TARGET_LABEL_PX,
  MAX_MAJORS,
  MAX_MINORS,
} from "./helpers/ruler-ticks";
export type { TickInterval } from "./helpers/ruler-ticks";
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