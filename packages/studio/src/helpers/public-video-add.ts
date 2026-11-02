import { pickMediaRange } from "@twick/video-editor";
import type { MediaItem, MediaRangePick } from "@twick/video-editor";

/**
 * The Public (Pexels) + and double-click. The host's range picker opens on the RAW provider url,
 * for preview only, and the copy into our storage (`proxy`) runs only once the creator presses
 * Add, so a cancel costs no proxy call and no library row. `onProxyStart` is when the tile shows
 * its spinner: never behind the picker. The picked part is handed to `add` with the proxied url
 * (the raw url must never reach the timeline). A failed proxy, or an `add` that REJECTS, is logged
 * and surfaced as `twick-media-add-failed` (rule #26); a broken picker is surfaced by pickMediaRange
 * itself.
 *
 * "added" means `add` resolved, not that the clip is on the timeline. As wired, `add` ends in
 * `useEditorManager().addElement`, which never rejects: an add that fails inside it (the proxied
 * copy will not load) is logged, toasted and cleaned up there (its `failAdd`), and this still
 * returns "added". The event fires once either way.
 *
 * Exported FOR TESTING too: the app suite runs it against the shipped dist
 * (tests/unit/media-range-add-paths-dist.test.tsx).
 */
export async function addPublicVideo(
  item: MediaItem,
  deps: {
    proxy: (url: string) => Promise<string | null>;
    add: (proxied: MediaItem, pick: MediaRangePick) => Promise<void>;
    onProxyStart?: () => void;
  }
): Promise<"added" | "cancelled" | "failed"> {
  // No name: a provider's title is not the file's name.
  const pick = await pickMediaRange({ url: item.url });
  if (pick.kind === "cancel") return "cancelled";

  deps.onProxyStart?.();
  let proxied: string | null = null;
  try {
    proxied = await deps.proxy(item.url);
  } catch (err) {
    console.error("[twick] copying the Public video into storage failed", err);
  }
  if (!proxied) {
    // Never fall back to the raw external url: it persists a broken, CORS-hostile asset into the
    // project (audit finding #3).
    window.dispatchEvent(new CustomEvent("twick-media-add-failed"));
    return "failed";
  }

  try {
    await deps.add({ ...item, url: proxied }, pick);
  } catch (err) {
    console.error("[twick] adding the Public video failed", err);
    window.dispatchEvent(new CustomEvent("twick-media-add-failed"));
    return "failed";
  }
  return "added";
}
