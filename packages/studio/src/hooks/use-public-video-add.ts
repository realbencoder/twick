import { useRef, useState } from "react";
import type { MediaItem, MediaRangePick } from "@twick/video-editor";
import { addPublicVideo } from "../helpers/public-video-add";

/**
 * The Public (Pexels) video tab's + and double-click, as the panel wires them: the host's range
 * picker on the RAW url, then the copy into our S3 (`/api/assets/proxy`, only after Add), then
 * `handleSelection` with the proxied item AND the pick, so the panel never opens a second picker
 * on the proxied url.
 * - `proxyingId` (the tile's spinner) is set only once the proxy starts, never behind the picker.
 * - A ref guard is held across the WHOLE add (picker, proxy and add), so extra clicks meanwhile
 *   queue nothing (audit finding #2, duplicate B-roll stacks). A ref, not state: a state-only
 *   guard has a stale-closure window between the first click's setState and React's commit
 *   (house rule #9).
 *
 * Exported FOR TESTING: the app suite runs it against the shipped dist with the real
 * useMediaPanel (tests/unit/media-range-add-paths-dist.test.tsx).
 */
export function usePublicVideoAdd({
  handleSelection,
  headers,
}: {
  handleSelection: (item: MediaItem, forceAdd?: boolean, pick?: MediaRangePick) => Promise<void>;
  /** Extra request headers for the proxy call (the studio's uploadConfig headers). */
  headers?: Record<string, string>;
}) {
  const [proxyingId, setProxyingId] = useState<string | null>(null);
  const proxyingRef = useRef(false);

  const handlePublicSelection = async (item: MediaItem, forceAdd?: boolean) => {
    if (proxyingRef.current) return;
    proxyingRef.current = true;
    try {
      await addPublicVideo(item, {
        proxy: async (rawUrl) => {
          const requestHeaders: Record<string, string> = { "Content-Type": "application/json" };
          if (headers) Object.assign(requestHeaders, headers);
          const res = await fetch("/api/assets/proxy", {
            method: "POST",
            headers: requestHeaders,
            body: JSON.stringify({ url: rawUrl, type: "video", name: `pexels-${item.id}.mp4` }),
          });
          if (!res.ok) {
            console.error(`[twick] the Public video proxy answered ${res.status}`);
            return null;
          }
          const data = await res.json();
          return typeof data?.url === "string" && data.url ? data.url : null;
        },
        add: (proxied, pick) => handleSelection(proxied, forceAdd, pick),
        onProxyStart: () => setProxyingId(item.id),
      });
    } finally {
      setProxyingId(null);
      proxyingRef.current = false;
    }
  };

  return { proxyingId, handlePublicSelection };
}
