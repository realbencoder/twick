/**
 * ImagePanel Component
 *
 * A panel for managing image elements in the studio. Provides functionality
 * for searching, uploading, previewing, and adding image files to the timeline.
 * Features a grid layout with image thumbnails and hover actions.
 *
 * @component
 * @param {Object} props
 * @param {MediaItem[]} props.items - List of image items to display
 * @param {string} props.searchQuery - Current search query
 * @param {(query: string) => void} props.setSearchQuery - Handle search query changes
 * @param {(item: MediaItem) => void} props.handleSelection - Handle image item selection
 * @param {(data: { file: File; blobUrl: string }) => void} props.handleFileUpload - Handle file uploads
 *
 * @example
 * ```tsx
 * <ImagePanel
 *   items={imageItems}
 *   searchQuery=""
 *   setSearchQuery={setSearchQuery}
 *   handleSelection={handleSelect}
 *   handleFileUpload={handleUpload}
 * />
 * ```
 */

import { Wand2, Plus } from "lucide-react";
import type { MediaItem } from "@twick/video-editor";
import { TIMELINE_DROP_MEDIA_TYPE } from "@twick/video-editor";
import type { ImagePanelProps } from "../../types/media-panel";
import UrlInput from "../shared/url-input";

export function ImagePanel({
  items,
  onItemSelect,
  onUrlAdd,
  isLoading,
  dragNeedsProxy,
  proxyingId,
  canLoadMore,
  onLoadMore,
  showAddByUrl = true,
}: ImagePanelProps) {
  return (
    <div className="panel-container">
      <div className="panel-title">Image Library</div>

      {/* Add by URL */}
      {showAddByUrl && (
        <div className="panel-section">
          <UrlInput type="image" onSubmit={onUrlAdd} />
        </div>
      )}

      {/* Media Grid */}
      <div className="media-content">
        <div className="media-grid">
          {(items || []).map((item: MediaItem) => (
            <div
              key={item.id}
              draggable
              // Always ADD (forceAdd=true) — matches the "+" button and drag-drop. Without this,
              // double-clicking a media item while a clip is selected REPLACES that clip's source
              // (silent data loss). To swap a source, use an explicit replace affordance, not a click.
              onDoubleClick={() => onItemSelect(item, true)}
              onDragStart={(e) => {
                e.dataTransfer.setData(
                  TIMELINE_DROP_MEDIA_TYPE,
                  JSON.stringify({
                    type: "image",
                    url: item.url,
                    // Public items must proxy before entering the timeline (drop path resolves it).
                    needsProxy: !!dragNeedsProxy,
                    name: `pexels-${item.id}.jpg`,
                  })
                );
                e.dataTransfer.effectAllowed = "copy";
              }}
              className="media-item media-item-draggable"
            
              style={proxyingId === item.id ? { opacity: 0.55, pointerEvents: "none" } : undefined}
            >
              {proxyingId === item.id && (
                <div
                  style={{
                    position: "absolute", inset: 0, display: "flex", alignItems: "center",
                    justifyContent: "center", zIndex: 5, fontSize: 11, fontWeight: 600,
                    color: "#fff", background: "rgba(0,0,0,0.45)", borderRadius: 6,
                  }}
                >
                  Adding…
                </div>
              )}
              <img src={item.url} alt="" className="media-item-content" />
              <div className="media-actions media-actions-corner">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onItemSelect(item, true);
                  }}
                  onDoubleClick={(e) => e.stopPropagation()}
                  className="media-action-btn"
                >
                  <Plus className="icon-sm" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty state */}
        {items.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-content">
              <Wand2 className="empty-state-icon" />
              <p className="empty-state-text">No images found</p>
            </div>
          </div>
        )}

        {onLoadMore && canLoadMore && (
          <div className="panel-section">
            <button
              type="button"
              className="btn-ghost w-full"
              onClick={onLoadMore}
              disabled={isLoading}
            >
              {isLoading ? "Loading..." : "Load more"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
