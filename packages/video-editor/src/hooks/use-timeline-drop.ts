import { useCallback, useState } from "react";
import {
  Track,
  VideoElement,
  AudioElement,
  ImageElement,
} from "@twick/timeline";
import { getAssetTypeFromFile, DroppableAssetType } from "../helpers/asset-type";
import { TIMELINE_DROP_MEDIA_TYPE } from "../helpers/constants";
import { createTimeScale } from "../helpers/time-scale";
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
  onDrop: (params: {
    track: Track | null;
    timeSec: number;
    type: DroppableAssetType;
    url: string;
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
        if (track || tracks.length === 0) {
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

      const pos = computePosition(e.clientX, e.clientY);
      if (!pos || pos.trackIndex < 0) return;
      const track = tracks[pos.trackIndex] ?? null;

      // Handle media dragged from studio panels (video, audio, image)
      if (e.dataTransfer.types.includes(TIMELINE_DROP_MEDIA_TYPE)) {
        try {
          const data = JSON.parse(
            e.dataTransfer.getData(TIMELINE_DROP_MEDIA_TYPE) || "{}"
          ) as { type?: DroppableAssetType; url?: string; needsProxy?: boolean; name?: string };
          if (data.type && data.url) {
            // Public items proxy through S3 first — a raw pexels URL must never reach the timeline.
            const resolvedUrl = await resolveDroppedMediaUrl(data);
            if (!resolvedUrl) return;
            await onDrop({
              track,
              timeSec: pos.timeSec,
              type: data.type,
              url: resolvedUrl,
            });
            // Add actually completed — settle the loading toast (only meaningful when a proxy
            // fired 'started'; the app's listener no-ops otherwise).
            if (data.needsProxy) window.dispatchEvent(new CustomEvent("twick-media-add-done"));
          }
        } catch {
          // The add stage failed after a successful proxy — surface it, never swallow (rule #26 /
          // review #120: the old empty catch let a failed add read as success).
          window.dispatchEvent(new CustomEvent("twick-media-add-failed"));
        }
        return;
      }

      // Handle files dragged from OS (Finder, Explorer, etc.)
      const files = Array.from(e.dataTransfer.files || []);
      for (const file of files) {
        const type = getAssetTypeFromFile(file);
        if (!type) continue;
        // Upload to S3/CDN via the app bridge — a blob: URL revoked after add broke the element
        // in-session AND persisted a dead src (audit persistence trace). Permanent URL only.
        const uploadedUrl = await uploadDroppedFile(file);
        if (!uploadedUrl) break;
        try {
          // (Stale-track safety lives downstream: handleDropOnTimeline re-resolves by id.)
          await onDrop({
            track,
            timeSec: pos.timeSec,
            type,
            url: uploadedUrl,
          });
          window.dispatchEvent(new CustomEvent("twick-media-add-done"));
        } catch {
          window.dispatchEvent(new CustomEvent("twick-media-add-failed"));
        }
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
    if (url) return url; // caller fires 'done' after the ADD completes
  } catch {
    /* fall through */
  }
  window.dispatchEvent(new CustomEvent("twick-media-add-failed"));
  return null;
}

export function createElementFromDrop(
  type: DroppableAssetType,
  blobUrl: string,
  parentSize: Size
): VideoElement | AudioElement | ImageElement {
  switch (type) {
    case "video": {
      const el = new VideoElement(blobUrl, parentSize);
      // B-roll / stock video dragged onto the timeline defaults MUTED (rule #21) — matches the
      // click-add default. The drag path previously left it at full volume, so stock ambient audio
      // competed with the voiceover (audit #4). The creator can un-mute via the volume slider.
      el.setVolume(0);
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
