import { useCallback } from "react";
import { getAssetTypeFromFile, DroppableAssetType } from "../helpers/asset-type";
import { TIMELINE_DROP_MEDIA_TYPE } from "../helpers/constants";
import { pickMediaRange, rangeOfPick, type PickedMediaRange } from "../helpers/media-range";
import {
  addDroppedUpload,
  parsePanelDrop,
  resolveDroppedMediaUrl,
  uploadDroppedFile,
} from "./use-timeline-drop";

export interface CanvasDropPayload {
  type: DroppableAssetType;
  url: string;
  canvasX?: number;
  canvasY?: number;
  /** The part of a video the creator picked, in source seconds; absent = the whole clip. */
  range?: PickedMediaRange;
}

/**
 * Hook for handling file/media drops on the canvas.
 * Accepts both files from OS and media dragged from studio panels.
 */
export function useCanvasDrop({
  containerRef,
  videoSize,
  onDrop,
  enabled = true,
}: {
  containerRef: React.RefObject<HTMLElement | null>;
  videoSize: { width: number; height: number };
  onDrop: (payload: CanvasDropPayload) => Promise<void>;
  enabled?: boolean;
}) {
  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      if (!enabled) return;
      e.preventDefault();
      e.stopPropagation();
      const hasFiles = e.dataTransfer.types.includes("Files");
      const hasPanelMedia = e.dataTransfer.types.includes(TIMELINE_DROP_MEDIA_TYPE);
      if (!hasFiles && !hasPanelMedia) return;
      e.dataTransfer.dropEffect = "copy";
    },
    [enabled]
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      if (!enabled || !containerRef.current) return;
      e.preventDefault();
      e.stopPropagation();

      // Everything this drop needs comes off the event NOW, before the first await: the browser
      // empties the drag data store once the drop handlers return, and the picker below waits on
      // the creator for as long as they like (the preview can be gone or moved by then).
      const canvasX = getCanvasX(e, containerRef.current, videoSize);
      const canvasY = getCanvasY(e, containerRef.current, videoSize);
      const panelPayload = e.dataTransfer.types.includes(TIMELINE_DROP_MEDIA_TYPE)
        ? e.dataTransfer.getData(TIMELINE_DROP_MEDIA_TYPE)
        : null;
      const files = panelPayload === null ? Array.from(e.dataTransfer.files || []) : [];

      // Handle media dragged from studio panels
      if (panelPayload !== null) {
        const data = parsePanelDrop(panelPayload);
        if (!data) return;
        // A video asks the host which part to add, on the RAW url, before any proxy (a cancel
        // costs no proxy call). The drag payload's name is made up, so the picker gets none.
        let range: PickedMediaRange | undefined;
        if (data.type === "video") {
          const pick = await pickMediaRange({ url: data.url });
          if (pick.kind === "cancel") return;
          range = rangeOfPick(pick);
        }
        // Public items proxy through S3 first (see resolveDroppedMediaUrl) — null = failed,
        // event already fired, drop is abandoned cleanly.
        const resolvedUrl = await resolveDroppedMediaUrl(data);
        if (!resolvedUrl) return;
        try {
          await onDrop({ type: data.type, url: resolvedUrl, canvasX, canvasY, range });
          if (data.needsProxy) window.dispatchEvent(new CustomEvent("twick-media-add-done"));
        } catch (err) {
          // The add failed: surface it (rule #26), proxied or not.
          console.error("[twick] adding the dropped media failed", err);
          window.dispatchEvent(new CustomEvent("twick-media-add-failed"));
        }
        return;
      }

      // Handle files from OS
      for (const file of files) {
        const detectedType = getAssetTypeFromFile(file);
        if (!detectedType) continue;
        // Permanent CDN URL via the app upload bridge — a revoked blob: src broke the element
        // in-session and on restore (audit persistence trace).
        const uploadedUrl = await uploadDroppedFile(file);
        if (!uploadedUrl) return;
        await addDroppedUpload({ type: detectedType, url: uploadedUrl, name: file.name }, (range) =>
          onDrop({ type: detectedType, url: uploadedUrl, canvasX, canvasY, range })
        );
        return;
      }
    },
    [enabled, containerRef, videoSize, onDrop]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      // Could reset drop state if needed
    }
  }, []);

  return { handleDragOver, handleDragLeave, handleDrop };
}

function getCanvasX(
  e: React.DragEvent,
  container: HTMLElement,
  videoSize: { width: number; height: number }
): number {
  const rect = container.getBoundingClientRect();
  const relX = (e.clientX - rect.left) / rect.width;
  return Math.max(0, Math.min(videoSize.width, relX * videoSize.width));
}

function getCanvasY(
  e: React.DragEvent,
  container: HTMLElement,
  videoSize: { width: number; height: number }
): number {
  const rect = container.getBoundingClientRect();
  const relY = (e.clientY - rect.top) / rect.height;
  return Math.max(0, Math.min(videoSize.height, relY * videoSize.height));
}
