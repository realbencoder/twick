import { useEffect, useMemo, useState } from "react";
import type { PanelProps } from "../../types";
import { VideoPanel } from "../panel/video-panel";
import { useMediaPanel } from "../../hooks/use-media-panel";
import { useMedia } from "../../context/media-context";
import { getMediaManager, CloudMediaUpload } from "../shared";
import SearchInput from "../shared/search-input";
import type { AssetProviderConfig, MediaItem } from "@twick/video-editor";
import { throttle } from "@twick/video-editor";
import { getAssetLibrary } from "../../helpers/asset-library";

export function VideoPanelContainer(props: PanelProps) {
  const [activeSource, setActiveSource] = useState<"user" | "public">("user");
  return (
    <>
      <div className="panel-section">
        <div className="flex gap-2">
          <button
            type="button"
            className={`btn-ghost w-full ${activeSource === "user" ? "btn-primary" : ""
              }`}
            onClick={() => setActiveSource("user")}
          >
            My assets
          </button>
          <button
            type="button"
            className={`btn-ghost w-full ${activeSource === "public" ? "btn-primary" : ""
              }`}
            onClick={() => setActiveSource("public")}
          >
            Public
          </button>
        </div>
      </div>

      {activeSource === "user" ? (
        <VideoUserAssetsSection {...props} />
      ) : (
        <VideoPublicAssetsSection {...props} />
      )}
    </>
  );
}

function VideoUserAssetsSection(props: PanelProps) {
  const { addItem } = useMedia("video");
  const mediaManager = getMediaManager();
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 30;
  const {
    items,
    handleSelection,
    handleFileUpload,
    isLoading,
    acceptFileTypes,
  } = useMediaPanel(
    "video",
    {
      selectedElement: props.selectedElement ?? null,
      addElement: props.addElement!,
      updateElement: props.updateElement!,
    },
    props.videoResolution,
  );

  const onUrlAdd = async (url: string) => {
    const nameFromUrl = (() => {
      try {
        const u = new URL(url);
        const parts = u.pathname.split("/").filter(Boolean);
        return decodeURIComponent(parts[parts.length - 1] || url);
      } catch {
        return url;
      }
    })();

    const newItem = await mediaManager.addItem({
      name: nameFromUrl,
      url,
      type: "video",
      metadata: { source: "url" },
    });
    addItem(newItem);
  };

  const onCloudUploadSuccess = async (url: string, file: File) => {
    const newItem = await mediaManager.addItem({
      name: file.name,
      url,
      type: "video",
      metadata: { source: props.uploadConfig?.provider ?? "s3" },
    });
    addItem(newItem);
  };

  const visibleItems = items.slice(0, page * PAGE_SIZE);
  const canLoadMore = items.length > visibleItems.length;

  return (
    <>
      {props.uploadConfig && (
        <div className="flex panel-section">
          <CloudMediaUpload
            uploadApiUrl={props.uploadConfig.uploadApiUrl}
            provider={props.uploadConfig.provider}
            headers={props.uploadConfig.headers}
            accept="video/*"
            onSuccess={onCloudUploadSuccess}
            buttonText="Upload video"
            className="btn-ghost w-full"
          />
        </div>
      )}
      <VideoPanel
        items={visibleItems}
        onItemSelect={handleSelection}
        onFileUpload={handleFileUpload}
        isLoading={isLoading}
        acceptFileTypes={acceptFileTypes}
        onUrlAdd={onUrlAdd}
        canLoadMore={canLoadMore}
        onLoadMore={() => setPage((prev) => prev + 1)}
      />
    </>
  );
}

function VideoPublicAssetsSection(props: PanelProps) {
  const { handleSelection } = useMediaPanel(
    "video",
    {
      selectedElement: props.selectedElement ?? null,
      addElement: props.addElement!,
      updateElement: props.updateElement!,
    },
    props.videoResolution,
  );
  const [proxyingId, setProxyingId] = useState<string | null>(null);

  // Proxy public video assets through our S3 before adding to timeline
  const handlePublicSelection = async (item: MediaItem, forceAdd?: boolean) => {
    // Re-entrancy guard: the proxy takes seconds; without this every extra click during the
    // window queued another identical add (audit finding #2 — duplicate B-roll stacks).
    if (proxyingId) return;
    setProxyingId(item.id);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (props.uploadConfig?.headers) Object.assign(headers, props.uploadConfig.headers);
      const res = await fetch("/api/assets/proxy", {
        method: "POST",
        headers,
        body: JSON.stringify({ url: item.url, type: "video", name: `pexels-${item.id}.mp4` }),
      });
      if (res.ok) {
        const data = await res.json();
        handleSelection({ ...item, url: data.url }, forceAdd);
      } else {
        // Proxy failed — do NOT fall back to the raw external URL (it persists a broken,
        // CORS-hostile asset into project_data; audit finding #3). Surface it instead.
        window.dispatchEvent(new CustomEvent("twick-media-add-failed"));
      }
    } catch {
      window.dispatchEvent(new CustomEvent("twick-media-add-failed"));
    }
    setProxyingId(null);
  };

  const assetLibrary = getAssetLibrary();
  const [providerConfigs, setProviderConfigs] = useState<AssetProviderConfig[]>(
    [],
  );
  const [activeProviderId, setActiveProviderId] = useState<string | "all">(
    "all",
  );
  const [publicItems, setPublicItems] = useState<MediaItem[]>([]);
  const [publicSearchQuery, setPublicSearchQuery] = useState("nature");
  const [isPublicLoading, setIsPublicLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 10;

  useEffect(() => {
    const loadProviders = async () => {
      try {
        const configs = await assetLibrary.listPublicProviders();
        // Only show providers that actually support video
        setProviderConfigs(
          configs.filter((c) => c.supportedTypes?.includes("video")),
        );
      } catch (err) {
        console.error("Failed to load asset providers", err);
      }
    };
    void loadProviders();
  }, [assetLibrary]);

  const loadPublicAssets = async (query: string) => {
    setIsPublicLoading(true);
    try {
      const result = await assetLibrary.listAssets({
        source: "public",
        type: "video",
        query,
        page: 1,
        pageSize: PAGE_SIZE,
        provider: activeProviderId === "all" ? undefined : activeProviderId,
      });
      setPublicItems(result.items);
      setPage(1);
      setHasMore(result.items.length === PAGE_SIZE);
    } catch (err) {
      console.error("Failed to load public video assets", err);
      setPublicItems([]);
    } finally {
      setIsPublicLoading(false);
    }
  };

  const throttledLoadPublicAssets = useMemo(
    () => throttle(loadPublicAssets, 1000),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [assetLibrary, activeProviderId],
  );

  useEffect(() => {
    void throttledLoadPublicAssets(publicSearchQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProviderId]);

  useEffect(() => {
    if (publicSearchQuery) {
      void throttledLoadPublicAssets(publicSearchQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicSearchQuery]);

  const loadMore = async () => {
    if (!hasMore || isPublicLoading) return;
    const nextPage = page + 1;
    setIsPublicLoading(true);
    try {
      const result = await assetLibrary.listAssets({
        source: "public",
        type: "video",
        query: publicSearchQuery,
        page: nextPage,
        pageSize: PAGE_SIZE,
        provider: activeProviderId === "all" ? undefined : activeProviderId,
      });
      setPublicItems((prev) => [...prev, ...result.items]);
      setPage(nextPage);
      setHasMore(result.items.length === PAGE_SIZE);
    } catch (err) {
      console.error("Failed to load more public video assets", err);
    } finally {
      setIsPublicLoading(false);
    }
  };

  return (
    <>
      <div className="panel-section">
        <div className="property-row">
          <div className="property-row-label">
            <span className="property-label">Provider</span>
          </div>
          <div className="property-row-control">
            <select
              className="select-dark"
              value={activeProviderId}
              onChange={(e) =>
                setActiveProviderId(e.target.value as string | "all")
              }
            >
              <option value="all">All providers</option>
              {providerConfigs
                .filter((p) => p.enabled)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
            </select>
          </div>
        </div>
        <div className="property-row-control">
          <SearchInput
            searchQuery={publicSearchQuery}
            setSearchQuery={(q) => {
              setPublicSearchQuery(q);
            }}
          />
        </div>
      </div>
      <VideoPanel
        items={publicItems}
        dragNeedsProxy
        proxyingId={proxyingId}
        onItemSelect={handlePublicSelection}
        onFileUpload={() => { }}
        isLoading={isPublicLoading || !!proxyingId}
        acceptFileTypes={[]}
        onUrlAdd={() => { }}
        showAddByUrl={false}
        canLoadMore={hasMore}
        onLoadMore={loadMore}
      />
    </>
  );
}
