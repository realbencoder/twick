import {
  TrackElement,
  VideoElement,
  AudioElement,
  ImageElement,
  Size,
} from "@twick/timeline";
import { applyMediaRange, pickMediaRange } from "@twick/video-editor";
import type { MediaItem, MediaRangePick, PickedMediaRange } from "@twick/video-editor";
import { getMediaManager } from "../components/shared";
import { useMedia } from "../context/media-context";

export interface MediaPanelState {
  items: MediaItem[];
  searchQuery: string;
  isLoading: boolean;
  acceptFileTypes: string[];
}

export interface MediaPanelActions {
  setSearchQuery: (query: string) => void;
  /**
   * Adds `item` at the playhead (forceAdd, or nothing selected), else swaps the selected clip's
   * source. A video add opens the host's range picker first unless `pick` says what was picked.
   */
  handleSelection: (item: MediaItem, forceAdd?: boolean, pick?: MediaRangePick) => Promise<void>;
  handleFileUpload: (fileData: { file: File; blobUrl: string }) => void;
}

export type MediaType = "video" | "audio" | "image";

const mediaConfigs = {
  video: {
    acceptFileTypes: ["video/*"] as string[],
    createElement: (url: string, parentSize: Size) =>
      new VideoElement(url, parentSize),
    updateElement: async (element: TrackElement, url: string) => {
      if (element instanceof VideoElement) {
        element.setSrc(url);
        await element.updateVideoMeta();
      }
    },
  },
  audio: {
    acceptFileTypes: ["audio/*"] as string[],
    createElement: (url: string, _parentSize: Size) => new AudioElement(url),
    updateElement: async (element: TrackElement, url: string) => {
      if (element instanceof AudioElement) {
        element.setSrc(url);
        await element.updateAudioMeta();
      }
    },
  },
  image: {
    acceptFileTypes: ["image/*"] as string[],
    createElement: (url: string, parentSize: Size) =>
      new ImageElement(url, parentSize),
    updateElement: async (element: TrackElement, url: string) => {
      if (element instanceof ImageElement) {
        element.setSrc(url);
        await element.updateImageMeta();
      }
    },
  },
};

export const useMediaPanel = (
  type: MediaType,
  {
    selectedElement,
    addElement,
    updateElement,
  }: {
    selectedElement: TrackElement | null;
    addElement: (element: TrackElement) => void | Promise<void>;
    updateElement: (element: TrackElement) => void;
  },
  videoResolution: Size
): MediaPanelState & MediaPanelActions => {
  const { items, searchQuery, setSearchQuery, addItem, isLoading } =
    useMedia(type);
  const mediaManager = getMediaManager();

  /**
   * Adds `item` as a new element at the playhead. A video asks the host's range picker which part
   * to add first, with the item's real name, unless the caller already asked (`pick`: the Public
   * path picks on the RAW url before its proxy). A cancel adds nothing and writes no undo entry;
   * no picker (a non-app host) adds the whole clip, as before.
   */
  const addNewElement = async (item: MediaItem, pick?: MediaRangePick) => {
    const config = mediaConfigs[type];
    let range: PickedMediaRange | undefined;
    if (type === "video") {
      const choice = pick ?? (await pickMediaRange({ url: item.url, name: item.name }));
      if (choice.kind === "cancel") return;
      if (choice.kind === "range") range = { inSec: choice.inSec, outSec: choice.outSec };
    }
    const element = config.createElement(item.url, videoResolution);
    // Mute B-roll video audio by default — users want visuals, not stock audio
    if (type === "video" && element instanceof VideoElement) {
      element.setProps({ ...element.getProps(), volume: 0 });
      if (range) applyMediaRange(element, range);
    }
    await addElement(element);
  };

  const handleSelection = async (item: MediaItem, forceAdd?: boolean, pick?: MediaRangePick) => {
    const config = mediaConfigs[type];
    if (forceAdd) {
      await addNewElement(item, pick);
    } else {
      if (selectedElement) {
        await config.updateElement(selectedElement, item.url);
        updateElement(selectedElement);
      } else {
        await addNewElement(item, pick);
      }
    }
  };

  const handleFileUpload = async (fileData: {
    file: File;
    blobUrl: string;
  }) => {
    const arrayBuffer = await fileData.file.arrayBuffer();
    const newItem = await mediaManager.addItem({
      name: fileData.file.name,
      url: fileData.blobUrl,
      type,
      arrayBuffer,
      metadata: {
        name: fileData.file.name,
        size: fileData.file.size,
        type: fileData.file.type,
      },
    });
    addItem(newItem);
  };

  const config = mediaConfigs[type];
  return {
    items,
    searchQuery,
    setSearchQuery,
    handleSelection,
    handleFileUpload,
    isLoading,
    acceptFileTypes: config.acceptFileTypes,
  };
};
