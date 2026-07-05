import type { MediaItem } from "@twick/video-editor";

export type MediaType = "video" | "audio" | "image";

export interface MediaPanelBasePropsCommon {
  /** Public (Pexels) tab: dragged items must proxy through S3 before entering the timeline. */
  dragNeedsProxy?: boolean;
  /** Item id currently being proxied (click path) — the panel shows a spinner on that tile. */
  proxyingId?: string | null;
  items: MediaItem[];
  isLoading: boolean;
  acceptFileTypes: string[];
  onItemSelect: (item: MediaItem, forceAdd?: boolean) => void;
  onFileUpload: (fileData: { file: File; blobUrl: string }) => void;
  canLoadMore?: boolean;
  onLoadMore?: () => void;
}

export interface SearchablePanelProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export interface VideoPanelProps extends MediaPanelBasePropsCommon {
  onUrlAdd: (url: string) => void;
  showAddByUrl?: boolean;
}

export interface AudioPanelProps extends MediaPanelBasePropsCommon, SearchablePanelProps {
  onUrlAdd: (url: string) => void;
}
export interface ImagePanelProps extends MediaPanelBasePropsCommon, SearchablePanelProps {
  onUrlAdd: (url: string) => void;
  showAddByUrl?: boolean;
}
