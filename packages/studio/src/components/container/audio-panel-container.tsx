import { useEffect, useMemo, useState, useRef } from "react";
import { useMediaPanel } from "../../hooks/use-media-panel";
import { AudioPanel } from "../panel/audio-panel";
import type { PanelProps } from "../../types";
import { useMedia } from "../../context/media-context";
import { getMediaManager, CloudMediaUpload } from "../shared";
import SearchInput from "../shared/search-input";
import type { AssetProviderConfig, MediaItem } from "@twick/video-editor";
import { getAssetLibrary } from "../../helpers/asset-library";
import { throttle } from "@twick/video-editor";

export const AudioPanelContainer = (props: PanelProps) => {
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
        <AudioUserAssetsSection {...props} />
      ) : (
        <AudioPublicAssetsSection {...props} />
      )}
    </>
  );
};

function AudioUserAssetsSection(props: PanelProps) {
  const { addItem } = useMedia("audio");
  const mediaManager = getMediaManager();
  const {
    items,
    searchQuery,
    setSearchQuery,
    handleSelection,
    handleFileUpload,
    isLoading,
    acceptFileTypes,
  } = useMediaPanel(
    "audio",
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
      type: "audio",
      metadata: { source: "url" },
    });
    addItem(newItem);
  };

  const onCloudUploadSuccess = async (url: string, file: File) => {
    const newItem = await mediaManager.addItem({
      name: file.name,
      url,
      type: "audio",
      metadata: { source: props.uploadConfig?.provider ?? "s3" },
    });
    addItem(newItem);
  };

  return (
    <>
      {props.uploadConfig && (
        <div className="flex panel-section">
          <CloudMediaUpload
            uploadApiUrl={props.uploadConfig.uploadApiUrl}
            provider={props.uploadConfig.provider}
            headers={props.uploadConfig.headers}
            accept="audio/*"
            onSuccess={onCloudUploadSuccess}
            buttonText="Upload audio"
            className="btn-ghost w-full"
          />
        </div>
      )}
      <AudioPanel
        items={items}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onItemSelect={handleSelection}
        onFileUpload={handleFileUpload}
        isLoading={isLoading}
        acceptFileTypes={acceptFileTypes}
        onUrlAdd={onUrlAdd}
      />
    </>
  );
}

function AudioPublicAssetsSection(props: PanelProps) {
  const { handleSelection } = useMediaPanel(
    "audio",
    {
      selectedElement: props.selectedElement ?? null,
      addElement: props.addElement!,
      updateElement: props.updateElement!,
    },
    props.videoResolution,
  );
  const [proxyingId, setProxyingId] = useState<string | null>(null);
  // Ref mirror for the re-entrancy guard (house rule #9): a useState-only guard has a stale-
  // closure window between click 1's setState and React's commit — two near-simultaneous clicks
  // could both pass. The ref is set synchronously, so the second caller always sees it.
  const proxyingRef = useRef(false);

  const handlePublicSelection = async (item: MediaItem, forceAdd?: boolean) => {
    // Re-entrancy guard: the proxy takes seconds; without this every extra click during the
    // window queued another identical add (audit finding #2 — duplicate stacks).
    if (proxyingRef.current) return;
    proxyingRef.current = true;
    setProxyingId(item.id);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (props.uploadConfig?.headers) Object.assign(headers, props.uploadConfig.headers);
      const res = await fetch("/api/assets/proxy", {
        method: "POST",
        headers,
        body: JSON.stringify({ url: item.url, type: "audio", name: `pexels-${item.id}.mp3` }),
      });
      if (res.ok) {
        const data = await res.json();
        // Awaited so an ADD-stage rejection (not just a proxy failure) hits the catch below
        // and surfaces via the failed event instead of an unhandled rejection (review #120 nit).
        await handleSelection({ ...item, url: data.url }, forceAdd);
      } else {
        // Proxy failed — do NOT fall back to the raw external URL (persists a broken,
        // CORS-hostile asset into project_data). Surface it instead.
        window.dispatchEvent(new CustomEvent("twick-media-add-failed"));
      }
    } catch {
      window.dispatchEvent(new CustomEvent("twick-media-add-failed"));
    }
    setProxyingId(null);
    proxyingRef.current = false;
  };

  const assetLibrary = getAssetLibrary();
  const [providerConfigs, setProviderConfigs] = useState<AssetProviderConfig[]>(
    [],
  );
  const [activeProviderId, setActiveProviderId] = useState<string | "all">(
    "all",
  );
  const [publicItems, setPublicItems] = useState<MediaItem[]>([]);
  const [publicSearchQuery, setPublicSearchQuery] = useState("");
  const [isPublicLoading, setIsPublicLoading] = useState(false);

  useEffect(() => {
    const loadProviders = async () => {
      try {
        const configs = await assetLibrary.listPublicProviders();
        // Only show providers that actually support audio
        setProviderConfigs(
          configs.filter((c) => c.supportedTypes?.includes("audio")),
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
        type: "audio",
        query,
        provider: activeProviderId === "all" ? undefined : activeProviderId,
      });
      setPublicItems(result.items);
    } catch (err) {
      console.error("Failed to load public audio assets", err);
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
    if (publicSearchQuery) {
      void throttledLoadPublicAssets(publicSearchQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProviderId, publicSearchQuery]);

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
      <AudioPanel
        items={publicItems}
        dragNeedsProxy
        proxyingId={proxyingId}
        searchQuery={publicSearchQuery}
        onSearchChange={setPublicSearchQuery}
        onItemSelect={handlePublicSelection}
        onFileUpload={() => { }}
        isLoading={isPublicLoading || !!proxyingId}
        acceptFileTypes={[]}
        onUrlAdd={() => { }}
      />
    </>
  );
}
