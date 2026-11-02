import { useCallback, useState } from "react";
import {
  Track,
  TRACK_TYPES,
  VideoElement,
  AudioElement,
  ImageElement,
  TimelineEditor,
  TrackElement,
  ValidationError,
  VALIDATION_ERROR_CODE,
} from "@twick/timeline";
import { canDropElementOnTrack, isMainVideoTrack } from "../helpers/editor.utils";
import { getAssetTypeFromFile, DroppableAssetType } from "../helpers/asset-type";
import { TIMELINE_DROP_MEDIA_TYPE } from "../helpers/constants";
import { createTimeScale } from "../helpers/time-scale";
import {
  applyMediaRange,
  hasMediaRangePicker,
  pickMediaRange,
  placeKeepingLength,
  rangeOfPick,
  type PickedMediaRange,
} from "../helpers/media-range";
import type { Size } from "@twick/timeline";

export interface DropPreview {
  trackIndex: number;
  timeSec: number;
  /** Approximate width for preview (based on default duration) */
  widthPct: number;
}

const DEFAULT_DROP_DURATION = 5;

/**
 * Hook for handling file drops on the timeline.
 * Computes drop position from coordinates and provides handlers for drag/drop.
 */
export function useTimelineDrop({
  containerRef,
  scrollContainerRef,
  tracks,
  duration,
  zoomLevel,
  labelWidth,
  trackHeight,
  /** Width of the track content area (timeline minus labels). Used for accurate time mapping. */
  trackContentWidth,
  onDrop,
  enabled = true,
}: {
  containerRef: React.RefObject<HTMLElement | null>;
  /** Ref to scroll container; used for scrollLeft. Falls back to containerRef if not provided. */
  scrollContainerRef?: React.RefObject<HTMLElement | null>;
  tracks: Track[];
  duration: number;
  zoomLevel: number;
  labelWidth: number;
  trackHeight: number;
  trackContentWidth?: number;
  /** `range`: the part of a video the creator picked, in source seconds; absent = the whole clip. */
  onDrop: (params: {
    track: Track | null;
    timeSec: number;
    type: DroppableAssetType;
    url: string;
    range?: PickedMediaRange;
  }) => Promise<void>;
  enabled?: boolean;
}) {
  const [preview, setPreview] = useState<DropPreview | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const computePosition = useCallback(
    (clientX: number, clientY: number) => {
      if (!containerRef.current) return null;
      const rect = containerRef.current.getBoundingClientRect();
      const scrollEl = scrollContainerRef?.current ?? containerRef.current;
      const scrollLeft = scrollEl?.scrollLeft ?? 0;
      // Use scroll container's rect for X so we match the scroll viewport coordinate system.
      // contentX = (mouse X in viewport) + scrollOffset - labelWidth
      const viewportLeft = scrollEl?.getBoundingClientRect?.()?.left ?? rect.left;
      const contentX = (clientX - viewportLeft) + scrollLeft - labelWidth;
      const relY = clientY - rect.top;
      const ts = createTimeScale(zoomLevel, duration, labelWidth);
      const rawTrackIndex = ts.yToTrackIndex(relY);
      const trackIndex =
        tracks.length === 0
          ? 0
          : Math.max(0, Math.min(tracks.length - 1, rawTrackIndex));
      // contentX is already label-subtracted (content-relative, 0 at t=0),
      // so map it straight through the clip frame's pxPerSec = contentWidth/duration.
      const timeSec = Math.max(0, Math.min(duration, ts.pxToTime(contentX)));
      return { trackIndex, timeSec };
    },
    [
      containerRef,
      scrollContainerRef,
      tracks.length,
      labelWidth,
      trackHeight,
      zoomLevel,
      duration,
      trackContentWidth,
    ]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      if (!enabled) return;
      e.preventDefault();
      e.stopPropagation();
      const hasFiles = e.dataTransfer.types.includes("Files");
      const hasPanelMedia = e.dataTransfer.types.includes(TIMELINE_DROP_MEDIA_TYPE);
      if (!hasFiles && !hasPanelMedia) return;
      e.dataTransfer.dropEffect = "copy";
      setIsDraggingOver(true);

      const pos = computePosition(e.clientX, e.clientY);
      if (pos) {
        const track = tracks[pos.trackIndex] ?? null;
        // Never advertise a landing spot the drop gate always rejects: the asset type is
        // unreadable during dragover (HTML5 keeps dataTransfer contents drop-only), but the
        // main recording track and caption/scene tracks reject EVERY new-media type
        // (canDropElementOnTrack in handleDropOnTimeline re-routes to a fresh track), so a
        // preview rectangle on those rows would promise a drop that will not happen there —
        // same principle as the caption separator-highlight suppression.
        const alwaysRejects =
          track != null &&
          (isMainVideoTrack(track) ||
            track.getType() === TRACK_TYPES.CAPTION ||
            track.getType() === TRACK_TYPES.SCENE);
        if (alwaysRejects) {
          setPreview(null);
        } else if (track || tracks.length === 0) {
          setPreview({
            trackIndex: pos.trackIndex,
            timeSec: pos.timeSec,
            widthPct: Math.min(
              100,
              (DEFAULT_DROP_DURATION / duration) * 100
            ),
          });
        }
      }
    },
    [enabled, computePosition, tracks, duration]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDraggingOver(false);
      setPreview(null);
    }
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      if (!enabled) return;
      e.preventDefault();
      e.stopPropagation();
      setIsDraggingOver(false);
      setPreview(null);

      // Everything this drop needs comes off the event NOW, before the first await: the browser
      // empties the drag data store once the drop handlers return, and the picker below waits on
      // the creator for as long as they like.
      const pos = computePosition(e.clientX, e.clientY);
      if (!pos || pos.trackIndex < 0) return;
      const track = tracks[pos.trackIndex] ?? null;
      const panelPayload = e.dataTransfer.types.includes(TIMELINE_DROP_MEDIA_TYPE)
        ? e.dataTransfer.getData(TIMELINE_DROP_MEDIA_TYPE)
        : null;
      const files = panelPayload === null ? Array.from(e.dataTransfer.files || []) : [];

      // Handle media dragged from studio panels (video, audio, image)
      if (panelPayload !== null) {
        const data = parsePanelDrop(panelPayload);
        if (!data) return;
        // A video asks the host which part to add, on the RAW url (a Public item is proxied only
        // after Add, so a cancel costs no proxy call). The drag payload's name is made up
        // (`pexels-<id>.mp4`), so the picker gets none.
        let range: PickedMediaRange | undefined;
        if (data.type === "video") {
          const pick = await pickMediaRange({ url: data.url });
          if (pick.kind === "cancel") return;
          range = rangeOfPick(pick);
        }
        // Public items proxy through S3 first — a raw pexels URL must never reach the timeline.
        const resolvedUrl = await resolveDroppedMediaUrl(data);
        if (!resolvedUrl) return;
        try {
          await onDrop({ track, timeSec: pos.timeSec, type: data.type, url: resolvedUrl, range });
          // Add actually completed — settle the loading toast (only meaningful when a proxy
          // fired 'started'; the app's listener no-ops otherwise).
          if (data.needsProxy) window.dispatchEvent(new CustomEvent("twick-media-add-done"));
        } catch (err) {
          // The add stage failed: surface it, never swallow (rule #26 / review #120: the old
          // empty catch let a failed add read as success).
          console.error("[twick] adding the dropped media failed", err);
          window.dispatchEvent(new CustomEvent("twick-media-add-failed"));
        }
        return;
      }

      // Handle files dragged from OS (Finder, Explorer, etc.)
      for (const file of files) {
        const type = getAssetTypeFromFile(file);
        if (!type) continue;
        // Upload to S3/CDN via the app bridge — a blob: URL revoked after add broke the element
        // in-session AND persisted a dead src (audit persistence trace). Permanent URL only.
        const uploadedUrl = await uploadDroppedFile(file);
        if (!uploadedUrl) break;
        // (Stale-track safety lives downstream: dropMediaOnTimeline re-resolves by id.)
        await addDroppedUpload({ type, url: uploadedUrl, name: file.name }, (range) =>
          onDrop({ track, timeSec: pos.timeSec, type, url: uploadedUrl, range })
        );
        break; // Only first valid file for now
      }
    },
    [enabled, computePosition, tracks, onDrop]
  );

  return { preview, isDraggingOver, handleDragOver, handleDragLeave, handleDrop };
}

/**
 * Resolve a panel-dragged media URL before any element is created. Public (Pexels) items set
 * `needsProxy` — their raw external URL must NEVER enter project_data (CORS/expiry: the exact
 * failure class /api/assets/proxy exists to prevent; the CLICK path proxies, the drag path
 * previously didn't — audit finding #1). The proxy runs through the app-registered
 * `window.__twick_proxy_media` bridge (same app↔editor pattern as __twick_waveform /
 * __webcodecs_controller) so auth stays in the app. On ANY failure: fire
 * 'twick-media-add-failed' (the app shows a toast) and return null — never fall back to the
 * raw URL (audit finding #3: silent fallback persisted broken assets).
 */
export async function resolveDroppedMediaUrl(data: {
  type?: DroppableAssetType;
  url?: string;
  needsProxy?: boolean;
  name?: string;
}): Promise<string | null> {
  if (!data.url) return null;
  if (!data.needsProxy) return data.url; // My-assets / OS files — already ours
  try {
    window.dispatchEvent(new CustomEvent("twick-media-add-started"));
    const proxy = (window as unknown as {
      __twick_proxy_media?: (url: string, type: string, name?: string) => Promise<string | null>;
    }).__twick_proxy_media;
    const proxied = typeof proxy === "function" ? await proxy(data.url, data.type ?? "video", data.name) : null;
    // NOTE: 'done' is NOT fired here — proxy success isn't add success (the element can still
    // fail to land, e.g. its track was rebuilt mid-await). Call sites fire done/failed after
    // the add actually completes (review #120 finding 1).
    if (proxied) return proxied;
  } catch {
    /* fall through to the failure event below */
  }
  window.dispatchEvent(new CustomEvent("twick-media-add-failed"));
  return null;
}

/**
 * Upload an OS-dragged File through the app bridge (`window.__twick_upload_media` — presign + PUT
 * + CDN readUrl, auth in the app) and return a PERMANENT URL. The old path created a blob: URL and
 * revoked it immediately after the add — the element broke even in-session, and auto-save persisted
 * a dead blob: src (B-roll audit, persistence trace). Fires the same started/done/failed events as
 * the proxy path so the user sees progress + honest failures.
 */
export async function uploadDroppedFile(file: File): Promise<string | null> {
  try {
    window.dispatchEvent(new CustomEvent("twick-media-add-started"));
    const upload = (window as unknown as {
      __twick_upload_media?: (file: File) => Promise<string | null>;
    }).__twick_upload_media;
    const url = typeof upload === "function" ? await upload(file) : null;
    if (url) return url; // the caller settles 'done' (addDroppedUpload)
  } catch {
    /* fall through */
  }
  window.dispatchEvent(new CustomEvent("twick-media-add-failed"));
  return null;
}

/**
 * A panel drag's payload (video-panel.tsx and friends), or null when it is not one: logged and
 * surfaced as `twick-media-add-failed`, never a drop that silently does nothing (rule #26).
 */
export function parsePanelDrop(
  raw: string
): { type: DroppableAssetType; url: string; needsProxy?: boolean; name?: string } | null {
  try {
    const data = JSON.parse(raw || "{}") as {
      type?: DroppableAssetType;
      url?: string;
      needsProxy?: boolean;
      name?: string;
    };
    if (data && data.type && data.url) return data as { type: DroppableAssetType; url: string };
    console.error("[twick] a panel drop with no type or url; adding nothing", data);
  } catch (err) {
    console.error("[twick] an unreadable panel drop; adding nothing", err);
  }
  window.dispatchEvent(new CustomEvent("twick-media-add-failed"));
  return null;
}

/**
 * Adds an OS-dropped file once `uploadDroppedFile` has put it on the CDN. A video is a library add
 * with extra steps: when the host has a picker, the upload's toast settles FIRST ('done'), so it
 * never spins behind the picker, then the picker opens with the file's real name. A cancel, or a
 * file the picker can't play (an iPhone HEVC .MOV), adds nothing; the upload stays a library row
 * by design. With no picker, and for any other type, the add runs as before and settles after the
 * add. A failed add is logged and surfaced.
 */
export async function addDroppedUpload(
  file: { type: DroppableAssetType; url: string; name: string },
  add: (range: PickedMediaRange | undefined) => Promise<void>
): Promise<void> {
  let range: PickedMediaRange | undefined;
  const picks = file.type === "video" && hasMediaRangePicker();
  if (picks) {
    window.dispatchEvent(new CustomEvent("twick-media-add-done"));
    const pick = await pickMediaRange({ url: file.url, name: file.name });
    if (pick.kind === "cancel") return;
    range = rangeOfPick(pick);
  }
  try {
    await add(range);
    if (!picks) window.dispatchEvent(new CustomEvent("twick-media-add-done"));
  } catch (err) {
    console.error("[twick] adding the dropped file failed", err);
    window.dispatchEvent(new CustomEvent("twick-media-add-failed"));
  }
}

/**
 * Builds the element a drop adds. A video with a picked `range` starts at its in-point and is
 * preset to the range's length (applyMediaRange); place it with `placeKeepingLength`.
 */
export function createElementFromDrop(
  type: DroppableAssetType,
  blobUrl: string,
  parentSize: Size,
  range?: PickedMediaRange
): VideoElement | AudioElement | ImageElement {
  switch (type) {
    case "video": {
      const el = new VideoElement(blobUrl, parentSize);
      // B-roll / stock video dragged onto the timeline defaults MUTED (rule #21) — matches the
      // click-add default. The drag path previously left it at full volume, so stock ambient audio
      // competed with the voiceover (audit #4). The creator can un-mute via the volume slider.
      el.setVolume(0);
      if (range) applyMediaRange(el, range);
      return el;
    }
    case "audio":
      return new AudioElement(blobUrl);
    case "image":
      return new ImageElement(blobUrl, parentSize);
    default:
      throw new Error(`Unknown asset type: ${type}`);
  }
}

/**
 * Adds a dropped media item at the drop x (TimelineManager's onDrop). With a picked `range` the
 * element starts at the range's in-point and keeps its length at `timeSec`; without one it is the
 * whole clip, as before. It lands on the row under the pointer when that row takes it, else on a
 * new row just under Subtitles, and a collision moves it to a new row too.
 *
 * Exported FOR TESTING too: the app suite runs it against the shipped dist
 * (tests/unit/media-range-add-paths-dist.test.tsx).
 */
export async function dropMediaOnTimeline(
  editor: TimelineEditor,
  params: {
    track: Track | null;
    timeSec: number;
    type: DroppableAssetType;
    url: string;
    range?: PickedMediaRange;
  },
  videoResolution: Size,
  setSelectedItem: (el: TrackElement) => void
): Promise<void> {
  const { track, timeSec, type, url, range } = params;
  const element = createElementFromDrop(type, url, videoResolution, range);
  placeKeepingLength(element, timeSec);

  // Re-resolve the drop track by ID: a proxied drop awaits 5-30s between capture and here (and a
  // picked one waits on the creator), and any ripple/reorder/undo in that window rebuilds every
  // Track via fromJSON — adding to the DETACHED instance would mutate an orphan and silently
  // persist nothing (review #120 finding 1). A track deleted mid-flight falls through to the
  // insert-new-track branch.
  const liveTrack = track ? editor.getTrackById(track.getId()) ?? null : null;

  // Type gate (same rule as cross-track element drops): new media must not land on an
  // incompatible track — a stock clip released over the subtitle row would otherwise be
  // ADDED TO THE CAPTION TRACK (and similarly onto the main recording track or a text
  // lane). Incompatible target → fall through to the insert-new-track branch below.
  const compatibleTrack =
    liveTrack && canDropElementOnTrack(element, liveTrack) ? liveTrack : null;

  // If no target track, insert above video (after caption track)
  let targetTrack = compatibleTrack;
  if (!targetTrack) {
    const _tlTracks = editor.getTimelineData()?.tracks || [];
    const _tlCaptionIdx = _tlTracks.findIndex((t2: any) => t2.getType() === TRACK_TYPES.CAPTION);
    const _tlInsertIdx = _tlCaptionIdx >= 0 ? _tlCaptionIdx + 1 : 0;
    targetTrack = editor.addTrack(`Track_${Date.now()}`, undefined, _tlInsertIdx);
  }

  const tryAdd = async (t: Track): Promise<boolean> => {
    try {
      const result = await editor.addElementToTrack(t, element);
      if (result) {
        setSelectedItem(element);
        return true;
      }
    } catch (err) {
      if (
        err instanceof ValidationError &&
        err.errors?.includes(VALIDATION_ERROR_CODE.COLLISION_ERROR)
      ) {
        const _collTracks = editor.getTimelineData()?.tracks || [];
        const _collCaptionIdx = _collTracks.findIndex((t3: any) => t3.getType() === TRACK_TYPES.CAPTION);
        const _collInsertIdx = _collCaptionIdx >= 0 ? _collCaptionIdx + 1 : 0;
        const newTrack = editor.addTrack(`Track_${Date.now()}`, undefined, _collInsertIdx);
        return tryAdd(newTrack);
      }
      throw err;
    }
    return false;
  };

  await tryAdd(targetTrack);
  editor.refresh();
}
