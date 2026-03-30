"use strict";
var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const fabric = require("fabric");
const react = require("react");
const DEFAULT_TEXT_PROPS = {
  /** Font family for text elements */
  family: "Poppins",
  /** Font size in pixels */
  size: 48,
  /** Text fill color */
  fill: "#FFFFFF",
  /** Text stroke color */
  stroke: "#000000",
  /** Stroke line width */
  lineWidth: 0
};
const DEFAULT_CAPTION_PROPS = {
  /** Font family for caption elements (matches highlight_bg default) */
  family: "Bangers",
  /** Font size in pixels */
  size: 48,
  /** Text fill color */
  fill: "#FFFFFF",
  /** Font weight */
  fontWeight: 600,
  /** Stroke line width */
  lineWidth: 0.2,
  /** Shadow color */
  shadowColor: "#000000",
  /** Shadow blur radius */
  shadowBlur: 2,
  /** Shadow offset [x, y] */
  shadowOffset: [0, 0]
};
const CANVAS_OPERATIONS = {
  /** An item has been selected on the canvas */
  ITEM_SELECTED: "ITEM_SELECTED",
  /** An item has been updated/modified on the canvas */
  ITEM_UPDATED: "ITEM_UPDATED",
  /** An item has been deleted from the canvas */
  ITEM_DELETED: "ITEM_DELETED",
  /** A new item has been added to the canvas */
  ITEM_ADDED: "ITEM_ADDED",
  /** Items have been grouped together */
  ITEM_GROUPED: "ITEM_GROUPED",
  /** Items have been ungrouped */
  ITEM_UNGROUPED: "ITEM_UNGROUPED",
  /** Caption properties have been updated */
  CAPTION_PROPS_UPDATED: "CAPTION_PROPS_UPDATED",
  /** Watermark has been updated */
  WATERMARK_UPDATED: "WATERMARK_UPDATED",
  /** A new element was added via drop on canvas; payload is &#123; element &#125; */
  ADDED_NEW_ELEMENT: "ADDED_NEW_ELEMENT",
  /** Z-order changed (bring to front / send to back). Payload is &#123; elementId, direction &#125;. Timeline should reorder tracks. */
  Z_ORDER_CHANGED: "Z_ORDER_CHANGED"
};
const ELEMENT_TYPES = {
  /** Text element type */
  TEXT: "text",
  /** Caption element type */
  CAPTION: "caption",
  /** Image element type */
  IMAGE: "image",
  /** Video element type */
  VIDEO: "video",
  /** Rectangle element type */
  RECT: "rect",
  /** Circle element type */
  CIRCLE: "circle",
  /** Icon element type */
  ICON: "icon",
  /** Arrow annotation element type */
  ARROW: "arrow",
  /** Line annotation / shape element type */
  LINE: "line",
  /** Background color element type */
  BACKGROUND_COLOR: "backgroundColor",
  /** Global / adjustment-layer style effect element */
  EFFECT: "effect"
};
const isBrowser = typeof window !== "undefined";
const isCanvasSupported = isBrowser && !!window.HTMLCanvasElement;
function assertBrowser() {
  if (!isBrowser) {
    throw new Error("This code can only run in a browser environment");
  }
}
function assertCanvasSupport() {
  if (!isCanvasSupported) {
    throw new Error("Canvas is not supported in this environment");
  }
}
const createCanvas = ({
  videoSize,
  canvasSize,
  canvasRef,
  backgroundColor = "#000000",
  selectionBorderColor = "#2563eb",
  selectionLineWidth = 2,
  uniScaleTransform = true,
  enableRetinaScaling = true,
  touchZoomThreshold = 10
}) => {
  assertBrowser();
  assertCanvasSupport();
  const canvasMetadata = {
    width: canvasSize.width,
    height: canvasSize.height,
    aspectRatio: canvasSize.width / canvasSize.height,
    scaleX: Number((canvasSize.width / videoSize.width).toFixed(2)),
    scaleY: Number((canvasSize.height / videoSize.height).toFixed(2))
  };
  const canvas = new fabric.Canvas(canvasRef, {
    backgroundColor,
    width: canvasSize.width,
    height: canvasSize.height,
    preserveObjectStacking: true,
    enableRetinaScaling,
    selectionBorderColor,
    selectionLineWidth,
    uniScaleTransform,
    touchZoomThreshold,
    renderOnAddRemove: false,
    stateful: false,
    selection: true,
    skipTargetFind: false,
    controlsAboveOverlay: true
  });
  if (canvasRef) {
    canvas.setDimensions({
      width: canvasMetadata.width,
      height: canvasMetadata.height
    });
    canvas.renderAll();
  }
  return {
    canvas,
    canvasMetadata
  };
};
function measureTextWidth(text, options) {
  if (typeof document === "undefined" || !text) return 0;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return 0;
  const {
    fontSize,
    fontFamily,
    fontStyle = "normal",
    fontWeight = "normal"
  } = options;
  ctx.font = `${fontStyle} ${String(fontWeight)} ${fontSize}px ${fontFamily}`;
  const lines = text.split("\n");
  let maxWidth = 0;
  for (const line of lines) {
    const { width } = ctx.measureText(line);
    if (width > maxWidth) maxWidth = width;
  }
  return Math.ceil(maxWidth);
}
const reorderElementsByZIndex = (canvas) => {
  if (!canvas) return;
  const backgroundColor = canvas.backgroundColor;
  const objects = canvas.getObjects();
  objects.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
  canvas.clear();
  canvas.backgroundColor = backgroundColor;
  objects.forEach((obj) => canvas.add(obj));
  canvas.renderAll();
};
const changeZOrder = (canvas, elementId, direction) => {
  var _a, _b;
  if (!canvas) return null;
  const objects = canvas.getObjects();
  const sorted = [...objects].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
  const idx = sorted.findIndex((obj2) => {
    var _a2;
    return ((_a2 = obj2.get) == null ? void 0 : _a2.call(obj2, "id")) === elementId;
  });
  if (idx < 0) return null;
  const minZ = ((_a = sorted[0]) == null ? void 0 : _a.zIndex) ?? 0;
  const maxZ = ((_b = sorted[sorted.length - 1]) == null ? void 0 : _b.zIndex) ?? 0;
  const obj = sorted[idx];
  if (direction === "front") {
    obj.set("zIndex", maxZ + 1);
    reorderElementsByZIndex(canvas);
    return maxZ + 1;
  }
  if (direction === "back") {
    obj.set("zIndex", minZ - 1);
    reorderElementsByZIndex(canvas);
    return minZ - 1;
  }
  if (direction === "forward" && idx < sorted.length - 1) {
    const next = sorted[idx + 1];
    const myZ = obj.zIndex ?? idx;
    const nextZ = next.zIndex ?? idx + 1;
    obj.set("zIndex", nextZ);
    next.set("zIndex", myZ);
    reorderElementsByZIndex(canvas);
    return nextZ;
  }
  if (direction === "backward" && idx > 0) {
    const prev = sorted[idx - 1];
    const myZ = obj.zIndex ?? idx;
    const prevZ = prev.zIndex ?? idx - 1;
    obj.set("zIndex", prevZ);
    prev.set("zIndex", myZ);
    reorderElementsByZIndex(canvas);
    return prevZ;
  }
  return obj.zIndex ?? idx;
};
const getCanvasContext = (canvas) => {
  var _a, _b, _c, _d;
  if (!canvas || !((_b = (_a = canvas.elements) == null ? void 0 : _a.lower) == null ? void 0 : _b.ctx)) return;
  return (_d = (_c = canvas.elements) == null ? void 0 : _c.lower) == null ? void 0 : _d.ctx;
};
const clearCanvas = (canvas) => {
  try {
    if (!canvas || !getCanvasContext(canvas)) return;
    canvas.clear();
    canvas.renderAll();
  } catch (error) {
    console.warn("Error clearing canvas:", error);
  }
};
const convertToCanvasPosition = (x, y, canvasMetadata) => {
  return {
    x: x * canvasMetadata.scaleX + canvasMetadata.width / 2,
    y: y * canvasMetadata.scaleY + canvasMetadata.height / 2
  };
};
const getObjectCanvasCenter = (obj) => {
  if (obj.getCenterPoint) {
    const p = obj.getCenterPoint();
    return { x: p.x, y: p.y };
  }
  return { x: obj.left ?? 0, y: obj.top ?? 0 };
};
const getObjectCanvasAngle = (obj) => {
  if (typeof obj.getTotalAngle === "function") {
    return obj.getTotalAngle();
  }
  return obj.angle ?? 0;
};
const convertToVideoPosition = (x, y, canvasMetadata, videoSize) => {
  return {
    x: Number((x / canvasMetadata.scaleX - videoSize.width / 2).toFixed(2)),
    y: Number((y / canvasMetadata.scaleY - videoSize.height / 2).toFixed(2))
  };
};
const convertToVideoDimensions = (widthCanvas, heightCanvas, canvasMetadata) => {
  return {
    width: Number((widthCanvas / canvasMetadata.scaleX).toFixed(2)),
    height: Number((heightCanvas / canvasMetadata.scaleY).toFixed(2))
  };
};
const getCurrentFrameEffect = (item, seekTime) => {
  var _a;
  let currentFrameEffect;
  for (let i = 0; i < ((_a = item == null ? void 0 : item.frameEffects) == null ? void 0 : _a.length); i++) {
    if (item.frameEffects[i].s <= seekTime && item.frameEffects[i].e >= seekTime) {
      currentFrameEffect = item.frameEffects[i];
      break;
    }
  }
  return currentFrameEffect;
};
const hexToRgba = (hex, alpha) => {
  const color = hex.replace(/^#/, "");
  const fullHex = color.length === 3 ? color.split("").map((c) => c + c).join("") : color;
  if (fullHex.length !== 6) {
    return hex;
  }
  const r = parseInt(fullHex.slice(0, 2), 16);
  const g = parseInt(fullHex.slice(2, 4), 16);
  const b = parseInt(fullHex.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};
const disabledControl = new fabric.Control({
  /** X position offset */
  x: 0,
  /** Y position offset */
  y: -0.5,
  /** Additional Y offset */
  offsetY: 0,
  /** Cursor style when hovering */
  cursorStyle: "pointer",
  /** Action handler that does nothing */
  actionHandler: () => {
    return true;
  },
  /** Name of the action */
  actionName: "scale",
  /** Render function for the control */
  render: function(ctx, left, top) {
    const size = 0;
    ctx.save();
    ctx.translate(left, top);
    ctx.fillStyle = "#red";
    ctx.fillRect(-size / 2, -size / 2, size, size);
    ctx.restore();
  }
});
const rotateControl = new fabric.Control({
  /** X position offset */
  x: 0,
  /** Y position offset */
  y: -0.5,
  /** Additional Y offset for positioning */
  offsetY: -25,
  /** Cursor style when hovering */
  cursorStyle: "crosshair",
  /** Action handler with rotation and snapping */
  actionHandler: fabric.controlsUtils.rotationWithSnapping,
  /** Name of the action */
  actionName: "rotate",
  /** Whether to show connection line */
  withConnection: true
});
class LRUCache {
  constructor(maxSize = 100) {
    if (maxSize <= 0) {
      throw new Error("maxSize must be greater than 0");
    }
    this.maxSize = maxSize;
    this.cache = /* @__PURE__ */ new Map();
  }
  /**
   * Get a value from the cache.
   * Moves the item to the end (most recently used).
   */
  get(key) {
    const value = this.cache.get(key);
    if (value === void 0) {
      return void 0;
    }
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }
  /**
   * Set a value in the cache.
   * If cache is full, removes the least recently used item.
   */
  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== void 0) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, value);
  }
  /**
   * Check if a key exists in the cache.
   */
  has(key) {
    return this.cache.has(key);
  }
  /**
   * Delete a key from the cache.
   */
  delete(key) {
    return this.cache.delete(key);
  }
  /**
   * Clear all entries from the cache.
   */
  clear() {
    this.cache.clear();
  }
  /**
   * Get the current size of the cache.
   */
  get size() {
    return this.cache.size;
  }
}
class VideoFrameExtractor {
  constructor(options = {}) {
    this.frameCache = new LRUCache(
      options.maxCacheSize ?? 50
    );
    this.videoElements = /* @__PURE__ */ new Map();
    this.maxVideoElements = options.maxVideoElements ?? 5;
    this.loadTimeout = options.loadTimeout ?? 15e3;
    this.jpegQuality = options.jpegQuality ?? 0.8;
    this.playbackRate = options.playbackRate ?? 1;
  }
  /**
   * Get a frame thumbnail from a video at a specific time.
   * Uses caching and reuses video elements for optimal performance.
   * Uses 0.1s instead of 0 when seekTime is 0, since frames at t=0 are often blank.
   *
   * @param videoUrl - The URL of the video
   * @param seekTime - The time in seconds to extract the frame (0 is treated as 0.1)
   * @returns Promise resolving to a thumbnail image URL (data URL or blob URL)
   */
  async getFrame(videoUrl, seekTime = 0.1) {
    const effectiveSeekTime = seekTime === 0 ? 0.1 : seekTime;
    const cacheKey = this.getCacheKey(videoUrl, effectiveSeekTime);
    const cached = this.frameCache.get(cacheKey);
    if (cached) {
      return cached;
    }
    const videoState = await this.getVideoElement(videoUrl);
    const thumbnail = await this.extractFrame(videoState.video, effectiveSeekTime);
    this.frameCache.set(cacheKey, thumbnail);
    return thumbnail;
  }
  /**
   * Get or create a video element for the given URL.
   * Reuses existing elements and manages cleanup.
   */
  async getVideoElement(videoUrl) {
    let videoState = this.videoElements.get(videoUrl);
    if (videoState && videoState.isReady) {
      videoState.lastUsed = Date.now();
      return videoState;
    }
    if (videoState && videoState.isLoading && videoState.loadPromise) {
      await videoState.loadPromise;
      if (videoState.isReady) {
        videoState.lastUsed = Date.now();
        return videoState;
      }
    }
    if (this.videoElements.size >= this.maxVideoElements) {
      this.cleanupOldVideoElements();
    }
    videoState = await this.createVideoElement(videoUrl);
    this.videoElements.set(videoUrl, videoState);
    videoState.lastUsed = Date.now();
    return videoState;
  }
  /**
   * Create and initialize a new video element.
   */
  async createVideoElement(videoUrl) {
    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.muted = true;
    video.playsInline = true;
    video.autoplay = false;
    video.preload = "auto";
    video.playbackRate = this.playbackRate;
    video.style.position = "absolute";
    video.style.left = "-9999px";
    video.style.top = "-9999px";
    video.style.width = "1px";
    video.style.height = "1px";
    video.style.opacity = "0";
    video.style.pointerEvents = "none";
    video.style.zIndex = "-1";
    const state = {
      video,
      isReady: false,
      isLoading: true,
      loadPromise: null,
      lastUsed: Date.now()
    };
    state.loadPromise = new Promise((resolve, reject) => {
      let timeoutId;
      const cleanup = () => {
        if (timeoutId) clearTimeout(timeoutId);
      };
      const handleError = () => {
        var _a;
        cleanup();
        state.isLoading = false;
        reject(new Error(`Failed to load video: ${((_a = video.error) == null ? void 0 : _a.message) || "Unknown error"}`));
      };
      const handleLoadedMetadata = () => {
        cleanup();
        state.isReady = true;
        state.isLoading = false;
        resolve();
      };
      video.addEventListener("error", handleError, { once: true });
      video.addEventListener("loadedmetadata", handleLoadedMetadata, { once: true });
      timeoutId = window.setTimeout(() => {
        cleanup();
        state.isLoading = false;
        reject(new Error("Video loading timed out"));
      }, this.loadTimeout);
      video.src = videoUrl;
      document.body.appendChild(video);
    });
    try {
      await state.loadPromise;
    } catch (error) {
      if (video.parentNode) {
        video.remove();
      }
      throw error;
    }
    return state;
  }
  /**
   * Extract a frame from a video at the specified time.
   */
  async extractFrame(video, seekTime) {
    return new Promise((resolve, reject) => {
      video.pause();
      const timeThreshold = 0.1;
      if (Math.abs(video.currentTime - seekTime) < timeThreshold) {
        try {
          const canvas = document.createElement("canvas");
          const width = video.videoWidth || 640;
          const height = video.videoHeight || 360;
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Failed to get canvas context"));
            return;
          }
          ctx.drawImage(video, 0, 0, width, height);
          try {
            const dataUrl = canvas.toDataURL("image/jpeg", this.jpegQuality);
            resolve(dataUrl);
          } catch {
            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  reject(new Error("Failed to create Blob"));
                  return;
                }
                const blobUrl = URL.createObjectURL(blob);
                resolve(blobUrl);
              },
              "image/jpeg",
              this.jpegQuality
            );
          }
          return;
        } catch (err) {
          reject(new Error(`Error creating thumbnail: ${err}`));
          return;
        }
      }
      const handleSeeked = () => {
        try {
          const canvas = document.createElement("canvas");
          const width = video.videoWidth || 640;
          const height = video.videoHeight || 360;
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Failed to get canvas context"));
            return;
          }
          ctx.drawImage(video, 0, 0, width, height);
          try {
            const dataUrl = canvas.toDataURL("image/jpeg", this.jpegQuality);
            resolve(dataUrl);
          } catch {
            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  reject(new Error("Failed to create Blob"));
                  return;
                }
                const blobUrl = URL.createObjectURL(blob);
                resolve(blobUrl);
              },
              "image/jpeg",
              this.jpegQuality
            );
          }
        } catch (err) {
          reject(new Error(`Error creating thumbnail: ${err}`));
        }
      };
      video.addEventListener("seeked", handleSeeked, { once: true });
      const playPromise = video.play();
      if (playPromise !== void 0) {
        playPromise.then(() => {
          video.currentTime = seekTime;
        }).catch(() => {
          video.currentTime = seekTime;
        });
      } else {
        video.currentTime = seekTime;
      }
    });
  }
  /**
   * Generate cache key for a video URL and seek time.
   */
  getCacheKey(videoUrl, seekTime) {
    const roundedTime = Math.round(seekTime * 100) / 100;
    return `${videoUrl}:${roundedTime}`;
  }
  /**
   * Cleanup least recently used video elements.
   */
  cleanupOldVideoElements() {
    if (this.videoElements.size < this.maxVideoElements) {
      return;
    }
    const entries = Array.from(this.videoElements.entries());
    entries.sort((a, b) => a[1].lastUsed - b[1].lastUsed);
    const toRemove = entries.slice(0, entries.length - this.maxVideoElements + 1);
    for (const [url, state] of toRemove) {
      if (state.video.parentNode) {
        state.video.remove();
      }
      this.videoElements.delete(url);
    }
  }
  /**
   * Clear the frame cache.
   */
  clearCache() {
    this.frameCache.clear();
  }
  /**
   * Remove a specific video element and clear its cached frames.
   */
  removeVideo(videoUrl) {
    const state = this.videoElements.get(videoUrl);
    if (state) {
      if (state.video.parentNode) {
        state.video.remove();
      }
      this.videoElements.delete(videoUrl);
    }
    this.frameCache.clear();
  }
  /**
   * Dispose of all video elements and clear caches.
   * Removes all video elements from the DOM and clears both the frame cache
   * and video element cache. Call this when the extractor is no longer needed
   * to prevent memory leaks.
   */
  dispose() {
    for (const state of this.videoElements.values()) {
      if (state.video.parentNode) {
        state.video.remove();
      }
    }
    this.videoElements.clear();
    this.frameCache.clear();
  }
}
let defaultExtractor = null;
function getDefaultVideoFrameExtractor(options) {
  if (!defaultExtractor) {
    defaultExtractor = new VideoFrameExtractor(options);
  }
  return defaultExtractor;
}
async function getThumbnailCached(videoUrl, seekTime = 0.1, playbackRate) {
  const extractor = getDefaultVideoFrameExtractor(
    void 0
  );
  return extractor.getFrame(videoUrl, seekTime);
}
const getObjectFitSize = (objectFit, elementSize, containerSize) => {
  const elementAspectRatio = elementSize.width / elementSize.height;
  const containerAspectRatio = containerSize.width / containerSize.height;
  switch (objectFit) {
    case "contain":
      if (elementAspectRatio > containerAspectRatio) {
        return {
          width: containerSize.width,
          height: containerSize.width / elementAspectRatio
        };
      } else {
        return {
          width: containerSize.height * elementAspectRatio,
          height: containerSize.height
        };
      }
    case "cover":
      if (elementAspectRatio > containerAspectRatio) {
        return {
          width: containerSize.height * elementAspectRatio,
          height: containerSize.height
        };
      } else {
        return {
          width: containerSize.width,
          height: containerSize.width / elementAspectRatio
        };
      }
    case "fill":
      return {
        width: containerSize.width,
        height: containerSize.height
      };
    default:
      return {
        width: elementSize.width,
        height: elementSize.height
      };
  }
};
const MARGIN = 10;
const addTextElement = ({
  element,
  index,
  canvas,
  canvasMetadata
}) => {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _A, _B, _C;
  const { x, y } = convertToCanvasPosition(
    ((_a = element.props) == null ? void 0 : _a.x) || 0,
    ((_b = element.props) == null ? void 0 : _b.y) || 0,
    canvasMetadata
  );
  const fontSize = Math.floor(
    (((_c = element.props) == null ? void 0 : _c.fontSize) || DEFAULT_TEXT_PROPS.size) * canvasMetadata.scaleX
  );
  const fontFamily = ((_d = element.props) == null ? void 0 : _d.fontFamily) || DEFAULT_TEXT_PROPS.family;
  const fontStyle = ((_e = element.props) == null ? void 0 : _e.fontStyle) || "normal";
  const fontWeight = ((_f = element.props) == null ? void 0 : _f.fontWeight) || "normal";
  let width;
  if (((_g = element.props) == null ? void 0 : _g.width) != null && element.props.width > 0) {
    width = element.props.width * canvasMetadata.scaleX;
    if ((_h = element.props) == null ? void 0 : _h.maxWidth) {
      width = Math.min(width, element.props.maxWidth * canvasMetadata.scaleX);
    }
  } else {
    const textContent = ((_i = element.props) == null ? void 0 : _i.text) ?? element.t ?? "";
    width = measureTextWidth(textContent, {
      fontSize,
      fontFamily,
      fontStyle,
      fontWeight
    });
    const padding = 4;
    width = width + padding * 2;
    if ((_j = element.props) == null ? void 0 : _j.maxWidth) {
      width = Math.min(width, element.props.maxWidth * canvasMetadata.scaleX);
    }
    if (width <= 0) width = 100;
  }
  const backgroundColor = ((_k = element.props) == null ? void 0 : _k.backgroundColor) ? hexToRgba(
    element.props.backgroundColor,
    ((_l = element.props) == null ? void 0 : _l.backgroundOpacity) ?? 1
  ) : void 0;
  const text = new fabric.Textbox(((_m = element.props) == null ? void 0 : _m.text) || element.t || "", {
    left: x,
    top: y,
    originX: "center",
    originY: "center",
    angle: ((_n = element.props) == null ? void 0 : _n.rotation) || 0,
    fontSize,
    fontFamily,
    fontStyle,
    fontWeight,
    fill: ((_o = element.props) == null ? void 0 : _o.fill) || DEFAULT_TEXT_PROPS.fill,
    opacity: ((_p = element.props) == null ? void 0 : _p.opacity) ?? 1,
    width,
    splitByGrapheme: false,
    textAlign: ((_q = element.props) == null ? void 0 : _q.textAlign) || "center",
    stroke: ((_r = element.props) == null ? void 0 : _r.stroke) || DEFAULT_TEXT_PROPS.stroke,
    strokeWidth: (((_s = element.props) == null ? void 0 : _s.lineWidth) || DEFAULT_TEXT_PROPS.lineWidth) * 0.025,
    ...backgroundColor && { backgroundColor },
    shadow: ((_t = element.props) == null ? void 0 : _t.shadowColor) ? new fabric.Shadow({
      offsetX: ((_v = (_u = element.props) == null ? void 0 : _u.shadowOffset) == null ? void 0 : _v.length) && ((_x = (_w = element.props) == null ? void 0 : _w.shadowOffset) == null ? void 0 : _x.length) > 1 ? element.props.shadowOffset[0] / 2 : 1,
      offsetY: ((_z = (_y = element.props) == null ? void 0 : _y.shadowOffset) == null ? void 0 : _z.length) && ((_A = element.props) == null ? void 0 : _A.shadowOffset.length) > 1 ? element.props.shadowOffset[1] / 2 : 1,
      blur: (((_B = element.props) == null ? void 0 : _B.shadowBlur) || 2) / 2,
      color: (_C = element.props) == null ? void 0 : _C.shadowColor
    }) : void 0
  });
  text.set("id", element.id);
  text.set("zIndex", index);
  text.controls.mt = disabledControl;
  text.controls.mb = disabledControl;
  text.controls.ml = disabledControl;
  text.controls.mr = disabledControl;
  text.controls.bl = disabledControl;
  text.controls.br = disabledControl;
  text.controls.tl = disabledControl;
  text.controls.tr = disabledControl;
  text.controls.mtr = rotateControl;
  canvas.add(text);
  return text;
};
const setImageProps = ({
  img,
  element,
  index,
  canvasMetadata,
  lockAspectRatio = true
}) => {
  var _a, _b, _c, _d, _e;
  const width = (((_a = element.props) == null ? void 0 : _a.width) || 0) * canvasMetadata.scaleX || canvasMetadata.width;
  const height = (((_b = element.props) == null ? void 0 : _b.height) || 0) * canvasMetadata.scaleY || canvasMetadata.height;
  const { x, y } = convertToCanvasPosition(
    ((_c = element.props) == null ? void 0 : _c.x) || 0,
    ((_d = element.props) == null ? void 0 : _d.y) || 0,
    canvasMetadata
  );
  img.set("id", element.id);
  img.set("zIndex", index);
  img.set("width", width);
  img.set("height", height);
  img.set("left", x);
  img.set("top", y);
  img.set("opacity", ((_e = element.props) == null ? void 0 : _e.opacity) ?? 1);
  img.set("selectable", true);
  img.set("hasControls", true);
  img.set("touchAction", "all");
  img.set("lockUniScaling", lockAspectRatio);
};
const addCaptionElement = ({
  element,
  index,
  canvas,
  captionProps,
  canvasMetadata,
  lockAspectRatio = false
}) => {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y;
  const useTrackDefaults = ((_a = element.props) == null ? void 0 : _a.useTrackDefaults) ?? true;
  const trackColors = captionProps == null ? void 0 : captionProps.colors;
  const elementColors = (_b = element.props) == null ? void 0 : _b.colors;
  const resolvedColors = useTrackDefaults ? trackColors : { ...trackColors ?? {}, ...elementColors ?? {} };
  const captionTextColor = (resolvedColors == null ? void 0 : resolvedColors.text) ?? ((_c = captionProps == null ? void 0 : captionProps.color) == null ? void 0 : _c.text);
  const { x, y } = convertToCanvasPosition(
    (useTrackDefaults ? captionProps == null ? void 0 : captionProps.x : (_d = element.props) == null ? void 0 : _d.x) ?? (captionProps == null ? void 0 : captionProps.x) ?? 0,
    (useTrackDefaults ? captionProps == null ? void 0 : captionProps.y : (_e = element.props) == null ? void 0 : _e.y) ?? (captionProps == null ? void 0 : captionProps.y) ?? 0,
    canvasMetadata
  );
  let width = ((_f = element.props) == null ? void 0 : _f.width) ? element.props.width * canvasMetadata.scaleX : canvasMetadata.width - 2 * MARGIN;
  if ((_g = element.props) == null ? void 0 : _g.maxWidth) {
    width = Math.min(width, element.props.maxWidth * canvasMetadata.scaleX);
  }
  const resolvedFill = (useTrackDefaults ? void 0 : (_h = element.props) == null ? void 0 : _h.fill) ?? captionTextColor ?? DEFAULT_CAPTION_PROPS.fill;
  const trackStroke = trackColors == null ? void 0 : trackColors.outlineColor;
  const elementStroke = (elementColors == null ? void 0 : elementColors.outlineColor) ?? ((_i = element.props) == null ? void 0 : _i.stroke);
  const resolvedStroke = (useTrackDefaults ? trackStroke : elementStroke ?? trackStroke) ?? void 0;
  const trackFont = (captionProps == null ? void 0 : captionProps.font) ?? {};
  const elementFont = ((_j = element.props) == null ? void 0 : _j.font) ?? {};
  const resolvedFont = useTrackDefaults ? trackFont : { ...trackFont, ...elementFont };
  const caption = new fabric.Textbox(((_k = element.props) == null ? void 0 : _k.text) || element.t || "", {
    left: x,
    top: y,
    originX: "center",
    originY: "center",
    angle: ((_l = element.props) == null ? void 0 : _l.rotation) || 0,
    fontSize: Math.round(
      ((resolvedFont == null ? void 0 : resolvedFont.size) ?? DEFAULT_CAPTION_PROPS.size) * canvasMetadata.scaleX
    ),
    fontFamily: (resolvedFont == null ? void 0 : resolvedFont.family) ?? DEFAULT_CAPTION_PROPS.family,
    fill: resolvedFill,
    fontWeight: (resolvedFont == null ? void 0 : resolvedFont.weight) ?? DEFAULT_CAPTION_PROPS.fontWeight,
    ...resolvedStroke ? { stroke: resolvedStroke } : {},
    opacity: (useTrackDefaults ? void 0 : (_m = element.props) == null ? void 0 : _m.opacity) ?? (captionProps == null ? void 0 : captionProps.opacity) ?? 1,
    width,
    splitByGrapheme: false,
    textAlign: ((_n = element.props) == null ? void 0 : _n.textAlign) ?? "center",
    shadow: new fabric.Shadow({
      offsetX: (useTrackDefaults ? void 0 : (_p = (_o = element.props) == null ? void 0 : _o.shadowOffset) == null ? void 0 : _p[0]) ?? ((_q = captionProps == null ? void 0 : captionProps.shadowOffset) == null ? void 0 : _q[0]) ?? ((_r = DEFAULT_CAPTION_PROPS.shadowOffset) == null ? void 0 : _r[0]),
      offsetY: (useTrackDefaults ? void 0 : (_t = (_s = element.props) == null ? void 0 : _s.shadowOffset) == null ? void 0 : _t[1]) ?? ((_u = captionProps == null ? void 0 : captionProps.shadowOffset) == null ? void 0 : _u[1]) ?? ((_v = DEFAULT_CAPTION_PROPS.shadowOffset) == null ? void 0 : _v[1]),
      blur: (useTrackDefaults ? void 0 : (_w = element.props) == null ? void 0 : _w.shadowBlur) ?? (captionProps == null ? void 0 : captionProps.shadowBlur) ?? DEFAULT_CAPTION_PROPS.shadowBlur,
      color: (useTrackDefaults ? void 0 : (_x = element.props) == null ? void 0 : _x.shadowColor) ?? (captionProps == null ? void 0 : captionProps.shadowColor) ?? DEFAULT_CAPTION_PROPS.shadowColor
    }),
    strokeWidth: ((useTrackDefaults ? void 0 : (_y = element.props) == null ? void 0 : _y.lineWidth) ?? (captionProps == null ? void 0 : captionProps.lineWidth) ?? DEFAULT_CAPTION_PROPS.lineWidth) * 0.025
  });
  caption.set("id", element.id);
  caption.set("zIndex", index);
  caption.set("lockUniScaling", lockAspectRatio);
  caption.controls.mt = disabledControl;
  caption.controls.mb = disabledControl;
  caption.controls.ml = disabledControl;
  caption.controls.mr = disabledControl;
  caption.controls.bl = disabledControl;
  caption.controls.br = disabledControl;
  caption.controls.tl = disabledControl;
  caption.controls.tr = disabledControl;
  caption.controls.mtr = disabledControl;
  canvas.add(caption);
  return caption;
};
const addVideoElement = async ({
  element,
  index,
  canvas,
  snapTime,
  canvasMetadata,
  currentFrameEffect
}) => {
  var _a;
  try {
    const thumbnailUrl = await getThumbnailCached(
      ((_a = element == null ? void 0 : element.props) == null ? void 0 : _a.src) || "",
      snapTime
    );
    if (!thumbnailUrl) {
      console.error("Failed to get thumbnail");
      return;
    }
    return addImageElement({
      imageUrl: thumbnailUrl,
      element,
      index,
      canvas,
      canvasMetadata,
      currentFrameEffect
    });
  } catch {
  }
};
const addImageElement = async ({
  imageUrl,
  element,
  index,
  canvas,
  canvasMetadata,
  currentFrameEffect,
  lockAspectRatio = true
}) => {
  try {
    const img = await fabric.FabricImage.fromURL(imageUrl || element.props.src || "");
    img.set({
      originX: "center",
      originY: "center",
      lockMovementX: false,
      lockMovementY: false,
      lockUniScaling: lockAspectRatio,
      hasControls: false,
      selectable: false
    });
    if (element.frame) {
      return addMediaGroup({
        element,
        img,
        index,
        canvas,
        canvasMetadata,
        currentFrameEffect,
        lockAspectRatio
      });
    } else {
      setImageProps({ img, element, index, canvasMetadata, lockAspectRatio });
      canvas.add(img);
      return img;
    }
  } catch {
  }
};
const addMediaGroup = ({
  element,
  img,
  index,
  canvas,
  canvasMetadata,
  currentFrameEffect,
  lockAspectRatio = true
}) => {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n;
  let frameSize;
  let angle;
  let framePosition;
  let frameRadius = 0;
  if (currentFrameEffect) {
    frameSize = {
      width: (((_a = currentFrameEffect.props.frameSize) == null ? void 0 : _a[0]) || 0) * canvasMetadata.scaleX || canvasMetadata.width,
      height: (((_b = currentFrameEffect.props.frameSize) == null ? void 0 : _b[1]) || 0) * canvasMetadata.scaleY || canvasMetadata.height
    };
    angle = currentFrameEffect.props.rotation || 0;
    framePosition = currentFrameEffect.props.framePosition;
    if (currentFrameEffect.props.shape === "circle") {
      frameRadius = frameSize.width / 2;
    } else {
      frameRadius = ((_c = currentFrameEffect == null ? void 0 : currentFrameEffect.props) == null ? void 0 : _c.radius) || 0;
    }
  } else {
    frameRadius = ((_d = element == null ? void 0 : element.frame) == null ? void 0 : _d.radius) || 0;
    frameSize = {
      width: (((_f = (_e = element == null ? void 0 : element.frame) == null ? void 0 : _e.size) == null ? void 0 : _f[0]) || 0) * canvasMetadata.scaleX || canvasMetadata.width,
      height: (((_h = (_g = element == null ? void 0 : element.frame) == null ? void 0 : _g.size) == null ? void 0 : _h[1]) || 0) * canvasMetadata.scaleY || canvasMetadata.height
    };
    angle = ((_i = element == null ? void 0 : element.frame) == null ? void 0 : _i.rotation) || 0;
    framePosition = {
      x: ((_j = element == null ? void 0 : element.frame) == null ? void 0 : _j.x) || 0,
      y: ((_k = element == null ? void 0 : element.frame) == null ? void 0 : _k.y) || 0
    };
  }
  const newSize = getObjectFitSize(
    element.objectFit,
    { width: img.width, height: img.height },
    frameSize
  );
  const frameRect = new fabric.Rect({
    originX: "center",
    originY: "center",
    lockMovementX: false,
    lockMovementY: false,
    lockUniScaling: true,
    hasControls: false,
    selectable: false,
    width: frameSize.width,
    height: frameSize.height,
    stroke: ((_l = element == null ? void 0 : element.frame) == null ? void 0 : _l.stroke) || "#ffffff",
    strokeWidth: ((_m = element == null ? void 0 : element.frame) == null ? void 0 : _m.lineWidth) || 0,
    hasRotatingPoint: true,
    rx: frameRadius || 0,
    ry: frameRadius || 0
  });
  img.set({
    lockUniScaling: true,
    originX: "center",
    originY: "center",
    scaleX: newSize.width / img.width,
    scaleY: newSize.height / img.height,
    opacity: ((_n = element.props) == null ? void 0 : _n.opacity) ?? 1
  });
  const { x, y } = convertToCanvasPosition(
    (framePosition == null ? void 0 : framePosition.x) || 0,
    (framePosition == null ? void 0 : framePosition.y) || 0,
    canvasMetadata
  );
  const groupProps = {
    left: x,
    top: y,
    width: frameSize.width,
    height: frameSize.height,
    angle
  };
  const group = new fabric.Group([frameRect, img], {
    ...groupProps,
    originX: "center",
    originY: "center",
    angle: groupProps.angle,
    selectable: true,
    hasControls: true,
    hasBorders: true,
    clipPath: frameRect
  });
  group.controls.mt = disabledControl;
  group.controls.mb = disabledControl;
  group.controls.ml = disabledControl;
  group.controls.mr = disabledControl;
  group.controls.mtr = rotateControl;
  group.set("id", element.id);
  group.set("zIndex", index);
  group.set("lockUniScaling", lockAspectRatio);
  canvas.add(group);
  return group;
};
const addRectElement = ({
  element,
  index,
  canvas,
  canvasMetadata,
  lockAspectRatio = false
}) => {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k;
  const { x, y } = convertToCanvasPosition(
    ((_a = element.props) == null ? void 0 : _a.x) || 0,
    ((_b = element.props) == null ? void 0 : _b.y) || 0,
    canvasMetadata
  );
  const rect = new fabric.Rect({
    left: x,
    // X-coordinate on the canvas
    top: y,
    // Y-coordinate on the canvas
    originX: "center",
    // Center the rectangle based on its position
    originY: "center",
    // Center the rectangle based on its position
    angle: ((_c = element.props) == null ? void 0 : _c.rotation) || 0,
    // Rotation angle
    rx: (((_d = element.props) == null ? void 0 : _d.radius) || 0) * canvasMetadata.scaleX,
    // Horizontal radius for rounded corners
    ry: (((_e = element.props) == null ? void 0 : _e.radius) || 0) * canvasMetadata.scaleY,
    // Vertical radius for rounded corners
    stroke: ((_f = element.props) == null ? void 0 : _f.stroke) || "#000000",
    // Stroke color
    strokeWidth: (((_g = element.props) == null ? void 0 : _g.lineWidth) || 0) * canvasMetadata.scaleX,
    // Scaled stroke width
    fill: ((_h = element.props) == null ? void 0 : _h.fill) || "#000000",
    // Fill color
    opacity: ((_i = element.props) == null ? void 0 : _i.opacity) || 1,
    // Opacity level
    width: (((_j = element.props) == null ? void 0 : _j.width) || 0) * canvasMetadata.scaleX,
    // Scaled width
    height: (((_k = element.props) == null ? void 0 : _k.height) || 0) * canvasMetadata.scaleY
    // Scaled height
  });
  rect.set("id", element.id);
  rect.set("zIndex", index);
  rect.set("lockUniScaling", lockAspectRatio);
  rect.controls.mtr = rotateControl;
  canvas.add(rect);
  return rect;
};
const addCircleElement = ({
  element,
  index,
  canvas,
  canvasMetadata,
  lockAspectRatio = true
}) => {
  var _a, _b, _c, _d, _e, _f, _g;
  const { x, y } = convertToCanvasPosition(
    ((_a = element.props) == null ? void 0 : _a.x) || 0,
    ((_b = element.props) == null ? void 0 : _b.y) || 0,
    canvasMetadata
  );
  const circle = new fabric.Circle({
    left: x,
    // X-coordinate on the canvas
    top: y,
    // Y-coordinate on the canvas
    radius: (((_c = element.props) == null ? void 0 : _c.radius) || 0) * canvasMetadata.scaleX,
    fill: ((_d = element.props) == null ? void 0 : _d.fill) || "#000000",
    stroke: ((_e = element.props) == null ? void 0 : _e.stroke) || "#000000",
    strokeWidth: (((_f = element.props) == null ? void 0 : _f.lineWidth) || 0) * canvasMetadata.scaleX,
    originX: "center",
    originY: "center",
    // Respect element opacity (0–1). Defaults to fully opaque.
    opacity: ((_g = element.props) == null ? void 0 : _g.opacity) ?? 1
  });
  circle.controls.mt = disabledControl;
  circle.controls.mb = disabledControl;
  circle.controls.ml = disabledControl;
  circle.controls.mr = disabledControl;
  circle.controls.mtr = disabledControl;
  circle.set("id", element.id);
  circle.set("zIndex", index);
  circle.set("lockUniScaling", lockAspectRatio);
  canvas.add(circle);
  return circle;
};
const addBackgroundColor = ({
  element,
  index,
  canvas,
  canvasMetadata
}) => {
  const bgRect = new fabric.Rect({
    width: canvasMetadata.width,
    height: canvasMetadata.height,
    left: canvasMetadata.width / 2,
    top: canvasMetadata.height / 2,
    fill: element.backgoundColor ?? "#000000",
    originX: "center",
    originY: "center",
    hasControls: false,
    hasBorders: false,
    selectable: false
  });
  bgRect.controls.mt = disabledControl;
  bgRect.controls.mb = disabledControl;
  bgRect.controls.ml = disabledControl;
  bgRect.controls.mr = disabledControl;
  bgRect.controls.bl = disabledControl;
  bgRect.controls.br = disabledControl;
  bgRect.controls.tl = disabledControl;
  bgRect.controls.tr = disabledControl;
  bgRect.controls.mtr = disabledControl;
  bgRect.set("zIndex", index - 0.5);
  canvas.add(bgRect);
  return bgRect;
};
const VideoElement = {
  name: ELEMENT_TYPES.VIDEO,
  async add(params) {
    var _a, _b;
    const {
      element,
      index,
      canvas,
      canvasMetadata,
      seekTime = 0,
      elementFrameMapRef,
      getCurrentFrameEffect: getFrameEffect
    } = params;
    if (!getFrameEffect || !elementFrameMapRef) return;
    const currentFrameEffect = getFrameEffect(element, seekTime);
    elementFrameMapRef.current[element.id] = currentFrameEffect;
    const snapTime = (seekTime - ((element == null ? void 0 : element.s) ?? 0)) * (((_a = element == null ? void 0 : element.props) == null ? void 0 : _a.playbackRate) ?? 1) + (((_b = element == null ? void 0 : element.props) == null ? void 0 : _b.time) ?? 0);
    await addVideoElement({
      element,
      index,
      canvas,
      canvasMetadata,
      currentFrameEffect,
      snapTime
    });
    if (element.timelineType === "scene") {
      await addBackgroundColor({
        element,
        index,
        canvas,
        canvasMetadata
      });
    }
  },
  updateFromFabricObject(object, element, context) {
    const canvasCenter = getObjectCanvasCenter(object);
    const { x, y } = convertToVideoPosition(
      canvasCenter.x,
      canvasCenter.y,
      context.canvasMetadata,
      context.videoSize
    );
    const scaledW = (object.width ?? 0) * (object.scaleX ?? 1);
    const scaledH = (object.height ?? 0) * (object.scaleY ?? 1);
    const { width: fw, height: fh } = convertToVideoDimensions(
      scaledW,
      scaledH,
      context.canvasMetadata
    );
    const updatedFrameSize = [fw, fh];
    const currentFrameEffect = context.elementFrameMapRef.current[element.id];
    if (currentFrameEffect) {
      context.elementFrameMapRef.current[element.id] = {
        ...currentFrameEffect,
        props: {
          ...currentFrameEffect.props,
          framePosition: { x, y },
          frameSize: updatedFrameSize
        }
      };
      return {
        element: {
          ...element,
          frameEffects: (element.frameEffects || []).map(
            (fe) => fe.id === (currentFrameEffect == null ? void 0 : currentFrameEffect.id) ? {
              ...fe,
              props: {
                ...fe.props,
                framePosition: { x, y },
                frameSize: updatedFrameSize
              }
            } : fe
          )
        }
      };
    }
    const frame = element.frame;
    return {
      element: {
        ...element,
        frame: {
          ...frame,
          rotation: getObjectCanvasAngle(object),
          size: updatedFrameSize,
          x,
          y
        }
      }
    };
  }
};
const ImageElement = {
  name: ELEMENT_TYPES.IMAGE,
  async add(params) {
    var _a;
    const { element, index, canvas, canvasMetadata, lockAspectRatio } = params;
    await addImageElement({
      element,
      index,
      canvas,
      canvasMetadata,
      lockAspectRatio: lockAspectRatio ?? ((_a = element.props) == null ? void 0 : _a.lockAspectRatio)
    });
    if (element.timelineType === "scene") {
      await addBackgroundColor({
        element,
        index,
        canvas,
        canvasMetadata
      });
    }
  },
  updateFromFabricObject(object, element, context) {
    const canvasCenter = getObjectCanvasCenter(object);
    const { x, y } = convertToVideoPosition(
      canvasCenter.x,
      canvasCenter.y,
      context.canvasMetadata,
      context.videoSize
    );
    const currentFrameEffect = context.elementFrameMapRef.current[element.id];
    if (object.type === "group") {
      const scaledW2 = (object.width ?? 0) * (object.scaleX ?? 1);
      const scaledH2 = (object.height ?? 0) * (object.scaleY ?? 1);
      const { width: fw, height: fh } = convertToVideoDimensions(
        scaledW2,
        scaledH2,
        context.canvasMetadata
      );
      const updatedFrameSize = [fw, fh];
      if (currentFrameEffect) {
        context.elementFrameMapRef.current[element.id] = {
          ...currentFrameEffect,
          props: {
            ...currentFrameEffect.props,
            framePosition: { x, y },
            frameSize: updatedFrameSize
          }
        };
        return {
          element: {
            ...element,
            // Keep the base frame in sync with the active frame effect
            // so visualizer `Rect {...element.frame}` reflects the same size/position.
            frame: element.frame ? {
              ...element.frame,
              rotation: getObjectCanvasAngle(object),
              size: updatedFrameSize,
              x,
              y
            } : element.frame,
            frameEffects: (element.frameEffects || []).map(
              (fe) => fe.id === (currentFrameEffect == null ? void 0 : currentFrameEffect.id) ? {
                ...fe,
                props: {
                  ...fe.props,
                  framePosition: { x, y },
                  frameSize: updatedFrameSize
                }
              } : fe
            )
          }
        };
      }
      const frame = element.frame;
      return {
        element: {
          ...element,
          frame: {
            ...frame,
            rotation: getObjectCanvasAngle(object),
            size: updatedFrameSize,
            x,
            y
          }
        }
      };
    }
    const scaledW = (object.width ?? 0) * (object.scaleX ?? 1);
    const scaledH = (object.height ?? 0) * (object.scaleY ?? 1);
    const { width, height } = convertToVideoDimensions(
      scaledW,
      scaledH,
      context.canvasMetadata
    );
    return {
      element: {
        ...element,
        props: {
          ...element.props,
          rotation: getObjectCanvasAngle(object),
          width,
          height,
          x,
          y
        }
      }
    };
  }
};
const RectElement = {
  name: ELEMENT_TYPES.RECT,
  async add(params) {
    var _a;
    const { element, index, canvas, canvasMetadata, lockAspectRatio } = params;
    await addRectElement({
      element,
      index,
      canvas,
      canvasMetadata,
      lockAspectRatio: lockAspectRatio ?? ((_a = element.props) == null ? void 0 : _a.lockAspectRatio)
    });
  },
  updateFromFabricObject(object, element, context) {
    var _a, _b;
    const canvasCenter = getObjectCanvasCenter(object);
    const { x, y } = convertToVideoPosition(
      canvasCenter.x,
      canvasCenter.y,
      context.canvasMetadata,
      context.videoSize
    );
    return {
      element: {
        ...element,
        props: {
          ...element.props,
          rotation: getObjectCanvasAngle(object),
          width: (((_a = element.props) == null ? void 0 : _a.width) ?? 0) * object.scaleX,
          height: (((_b = element.props) == null ? void 0 : _b.height) ?? 0) * object.scaleY,
          x,
          y
        }
      }
    };
  }
};
const CircleElement = {
  name: ELEMENT_TYPES.CIRCLE,
  async add(params) {
    var _a;
    const { element, index, canvas, canvasMetadata, lockAspectRatio } = params;
    await addCircleElement({
      element,
      index,
      canvas,
      canvasMetadata,
      lockAspectRatio: lockAspectRatio ?? ((_a = element.props) == null ? void 0 : _a.lockAspectRatio)
    });
  },
  updateFromFabricObject(object, element, context) {
    var _a, _b;
    const canvasCenter = getObjectCanvasCenter(object);
    const { x, y } = convertToVideoPosition(
      canvasCenter.x,
      canvasCenter.y,
      context.canvasMetadata,
      context.videoSize
    );
    const radius = Number(
      ((((_a = element.props) == null ? void 0 : _a.radius) ?? 0) * object.scaleX).toFixed(2)
    );
    const opacity = object.opacity != null ? object.opacity : (_b = element.props) == null ? void 0 : _b.opacity;
    return {
      element: {
        ...element,
        props: {
          ...element.props,
          rotation: getObjectCanvasAngle(object),
          radius,
          height: radius * 2,
          width: radius * 2,
          x,
          y,
          ...opacity != null && { opacity }
        }
      }
    };
  }
};
const TextElement = {
  name: ELEMENT_TYPES.TEXT,
  async add(params) {
    const { element, index, canvas, canvasMetadata } = params;
    await addTextElement({
      element,
      index,
      canvas,
      canvasMetadata
    });
  },
  updateFromFabricObject(object, element, context) {
    const canvasCenter = getObjectCanvasCenter(object);
    const { x, y } = convertToVideoPosition(
      canvasCenter.x,
      canvasCenter.y,
      context.canvasMetadata,
      context.videoSize
    );
    return {
      element: {
        ...element,
        props: {
          ...element.props,
          rotation: getObjectCanvasAngle(object),
          x,
          y
        }
      }
    };
  }
};
const CaptionElement = {
  name: ELEMENT_TYPES.CAPTION,
  async add(params) {
    var _a;
    const { element, index, canvas, captionProps, canvasMetadata, lockAspectRatio } = params;
    await addCaptionElement({
      element,
      index,
      canvas,
      captionProps: captionProps ?? {},
      canvasMetadata,
      lockAspectRatio: lockAspectRatio ?? ((_a = element.props) == null ? void 0 : _a.lockAspectRatio)
    });
  },
  updateFromFabricObject(object, element, context) {
    var _a;
    const canvasCenter = getObjectCanvasCenter(object);
    const { x, y } = convertToVideoPosition(
      canvasCenter.x,
      canvasCenter.y,
      context.canvasMetadata,
      context.videoSize
    );
    const useTrackDefaults = ((_a = element.props) == null ? void 0 : _a.useTrackDefaults) ?? true;
    if (useTrackDefaults) {
      return {
        element,
        operation: CANVAS_OPERATIONS.CAPTION_PROPS_UPDATED,
        payload: {
          element,
          props: {
            ...context.captionPropsRef.current,
            x,
            y
          }
        }
      };
    }
    return {
      element: {
        ...element,
        props: {
          ...element.props,
          x,
          y
        }
      }
    };
  }
};
const WatermarkElement = {
  name: "watermark",
  async add(params) {
    const { element, index, canvas, canvasMetadata, watermarkPropsRef } = params;
    if (element.type === ELEMENT_TYPES.TEXT) {
      if (watermarkPropsRef) watermarkPropsRef.current = element.props;
      await addTextElement({
        element,
        index,
        canvas,
        canvasMetadata
      });
    } else if (element.type === ELEMENT_TYPES.IMAGE) {
      await addImageElement({
        element,
        index,
        canvas,
        canvasMetadata
      });
    }
  },
  updateFromFabricObject(object, element, context) {
    const { x, y } = convertToVideoPosition(
      object.left,
      object.top,
      context.canvasMetadata,
      context.videoSize
    );
    const rotation = object.angle != null ? object.angle : void 0;
    const opacity = object.opacity != null ? object.opacity : void 0;
    const baseProps = element.type === ELEMENT_TYPES.TEXT ? context.watermarkPropsRef.current ?? element.props ?? {} : { ...element.props };
    const props = element.type === ELEMENT_TYPES.IMAGE && (object.scaleX != null || object.scaleY != null) ? {
      ...baseProps,
      width: baseProps.width != null && object.scaleX != null ? baseProps.width * object.scaleX : baseProps.width,
      height: baseProps.height != null && object.scaleY != null ? baseProps.height * object.scaleY : baseProps.height
    } : baseProps;
    const payload = {
      position: { x, y },
      ...rotation != null && { rotation },
      ...opacity != null && { opacity },
      ...Object.keys(props).length > 0 && { props }
    };
    return {
      element: { ...element, props: { ...element.props, x, y, rotation, opacity, ...props } },
      operation: CANVAS_OPERATIONS.WATERMARK_UPDATED,
      payload
    };
  }
};
const ArrowElement = {
  name: ELEMENT_TYPES.ARROW,
  async add(params) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i;
    const { element, index, canvas, canvasMetadata, lockAspectRatio } = params;
    const baseWidth = ((_a = element.props) == null ? void 0 : _a.width) ?? 220;
    const baseHeight = ((_b = element.props) == null ? void 0 : _b.height) ?? 14;
    const { x, y } = convertToCanvasPosition(
      ((_c = element.props) == null ? void 0 : _c.x) ?? 0,
      ((_d = element.props) == null ? void 0 : _d.y) ?? 0,
      canvasMetadata
    );
    const fill = ((_e = element.props) == null ? void 0 : _e.fill) || "#f59e0b";
    const radius = (((_f = element.props) == null ? void 0 : _f.radius) ?? 4) * canvasMetadata.scaleX;
    const barWidth = baseWidth * canvasMetadata.scaleX;
    const barHeight = baseHeight * canvasMetadata.scaleY;
    const headSize = barHeight * 1.8;
    const barLength = barWidth - headSize * 0.5;
    const bar = new fabric.Rect({
      left: -barWidth / 2,
      top: -barHeight / 2,
      originX: "left",
      originY: "top",
      width: barLength,
      height: barHeight,
      rx: radius,
      ry: radius,
      fill
    });
    const arrowHead = new fabric.Triangle({
      left: barWidth / 2 - headSize * 0.25,
      top: 0,
      originX: "center",
      originY: "center",
      width: headSize,
      height: headSize,
      fill,
      angle: 90
    });
    const opacity = ((_g = element.props) == null ? void 0 : _g.opacity) ?? 1;
    const group = new fabric.Group([bar, arrowHead], {
      left: x,
      top: y,
      originX: "center",
      originY: "center",
      angle: ((_h = element.props) == null ? void 0 : _h.rotation) || 0,
      opacity,
      selectable: true,
      hasControls: true
    });
    group.set(
      "lockUniScaling",
      lockAspectRatio ?? ((_i = element.props) == null ? void 0 : _i.lockAspectRatio) ?? true
    );
    group.set("id", element.id);
    group.set("zIndex", index);
    canvas.add(group);
  },
  updateFromFabricObject(object, element, context) {
    var _a, _b, _c;
    const canvasCenter = getObjectCanvasCenter(object);
    const { x, y } = convertToVideoPosition(
      canvasCenter.x,
      canvasCenter.y,
      context.canvasMetadata,
      context.videoSize
    );
    const baseWidth = ((_a = element.props) == null ? void 0 : _a.width) ?? 220;
    const baseHeight = ((_b = element.props) == null ? void 0 : _b.height) ?? 14;
    const opacity = object.opacity ?? ((_c = element.props) == null ? void 0 : _c.opacity) ?? 1;
    return {
      element: {
        ...element,
        props: {
          ...element.props,
          rotation: getObjectCanvasAngle(object),
          width: baseWidth * object.scaleX,
          height: baseHeight * object.scaleY,
          x,
          y,
          opacity
        }
      }
    };
  }
};
const LineElement = {
  name: ELEMENT_TYPES.LINE,
  async add(params) {
    var _a;
    const { element, index, canvas, canvasMetadata, lockAspectRatio } = params;
    const lineProps = element.props ?? {};
    const lineElement = {
      ...element,
      props: {
        ...lineProps,
        // Use fill as stroke color when a stroke is desired; otherwise rely
        // on fill-only rendering. Avoid the generic "#000000" fallback.
        stroke: lineProps.stroke ?? lineProps.fill,
        // If a specific lineWidth is provided, keep it; otherwise default to 0
        // so the stroke does not override the visual fill color.
        lineWidth: lineProps.lineWidth ?? 0
      }
    };
    await addRectElement({
      element: lineElement,
      index,
      canvas,
      canvasMetadata,
      lockAspectRatio: lockAspectRatio ?? ((_a = lineElement.props) == null ? void 0 : _a.lockAspectRatio)
    });
  },
  updateFromFabricObject(object, element, context) {
    var _a, _b;
    const canvasCenter = getObjectCanvasCenter(object);
    const { x, y } = convertToVideoPosition(
      canvasCenter.x,
      canvasCenter.y,
      context.canvasMetadata,
      context.videoSize
    );
    return {
      element: {
        ...element,
        props: {
          ...element.props,
          rotation: getObjectCanvasAngle(object),
          width: (((_a = element.props) == null ? void 0 : _a.width) ?? 0) * object.scaleX,
          height: (((_b = element.props) == null ? void 0 : _b.height) ?? 0) * object.scaleY,
          x,
          y
        }
      }
    };
  }
};
const EffectElement = {
  name: ELEMENT_TYPES.EFFECT,
  async add() {
    return;
  }
};
class ElementController {
  constructor() {
    __publicField(this, "elements", /* @__PURE__ */ new Map());
  }
  register(handler) {
    this.elements.set(handler.name, handler);
  }
  get(name) {
    return this.elements.get(name);
  }
  list() {
    return Array.from(this.elements.keys());
  }
}
const elementController = new ElementController();
function registerElements() {
  elementController.register(VideoElement);
  elementController.register(ImageElement);
  elementController.register(RectElement);
  elementController.register(CircleElement);
  elementController.register(TextElement);
  elementController.register(CaptionElement);
  elementController.register(WatermarkElement);
  elementController.register(ArrowElement);
  elementController.register(LineElement);
  elementController.register(EffectElement);
}
registerElements();
function registerCanvasHandler(handler) {
  elementController.register(handler);
}
function getCanvasHandler(name) {
  return elementController.get(name);
}
const useTwickCanvas = ({
  onCanvasReady,
  onCanvasOperation,
  /**
   * When true, holding Shift while dragging an object will lock movement to
   * the dominant axis (horizontal or vertical). This mirrors behavior in
   * professional editors and improves precise alignment.
   *
   * Default: false (opt‑in to avoid surprising existing consumers).
   */
  enableShiftAxisLock = false
}) => {
  const [twickCanvas, setTwickCanvas] = react.useState(null);
  const elementMap = react.useRef({});
  const watermarkPropsRef = react.useRef(null);
  const elementFrameMap = react.useRef({});
  const twickCanvasRef = react.useRef(null);
  const videoSizeRef = react.useRef({ width: 1, height: 1 });
  const canvasResolutionRef = react.useRef({ width: 1, height: 1 });
  const captionPropsRef = react.useRef(null);
  const axisLockStateRef = react.useRef(null);
  const canvasMetadataRef = react.useRef({
    width: 0,
    height: 0,
    aspectRatio: 0,
    scaleX: 1,
    scaleY: 1
  });
  const resizeCanvas = ({
    canvasSize,
    videoSize = videoSizeRef.current
  }) => {
    const canvas = twickCanvasRef.current;
    if (!canvas || !getCanvasContext(canvas)) return;
    if (!(videoSize == null ? void 0 : videoSize.width) || !(videoSize == null ? void 0 : videoSize.height)) return;
    if (canvasResolutionRef.current.width === canvasSize.width && canvasResolutionRef.current.height === canvasSize.height) {
      return;
    }
    canvasMetadataRef.current = {
      width: canvasSize.width,
      height: canvasSize.height,
      aspectRatio: canvasSize.width / canvasSize.height,
      scaleX: Number((canvasSize.width / videoSize.width).toFixed(2)),
      scaleY: Number((canvasSize.height / videoSize.height).toFixed(2))
    };
    canvas.setDimensions({
      width: canvasSize.width,
      height: canvasSize.height
    });
    canvasResolutionRef.current = canvasSize;
    canvas.requestRenderAll();
  };
  const onVideoSizeChange = (videoSize) => {
    if (videoSize) {
      videoSizeRef.current = videoSize;
      canvasMetadataRef.current.scaleX = canvasMetadataRef.current.width / videoSize.width;
      canvasMetadataRef.current.scaleY = canvasMetadataRef.current.height / videoSize.height;
    }
  };
  const GUIDE_SNAP_THRESHOLD = 5;
  const guidelinesRef = react.useRef({
    vertical: false,
    horizontal: false
  });
  const drawGuidelines = (canvas) => {
    const ctx = canvas.getTopContext();
    if (!ctx) return;
    const { vertical, horizontal } = guidelinesRef.current;
    if (!vertical && !horizontal) return;
    ctx.save();
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    if (vertical) {
      const x = canvas.width / 2;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    if (horizontal) {
      const y = canvas.height / 2;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    ctx.restore();
  };
  const handleObjectMoving = (event) => {
    var _a;
    const target = event == null ? void 0 : event.target;
    const transform = event == null ? void 0 : event.transform;
    const pointerEvent = event == null ? void 0 : event.e;
    const canvas = twickCanvasRef.current;
    if (target && canvas) {
      const canvasW = canvas.width;
      const canvasH = canvas.height;
      const objCenterX = target.left + target.width * (target.scaleX ?? 1) / 2;
      const objCenterY = target.top + target.height * (target.scaleY ?? 1) / 2;
      const snapV = Math.abs(objCenterX - canvasW / 2) < GUIDE_SNAP_THRESHOLD;
      const snapH = Math.abs(objCenterY - canvasH / 2) < GUIDE_SNAP_THRESHOLD;
      guidelinesRef.current = { vertical: snapV, horizontal: snapH };
      if (snapV) {
        target.left = canvasW / 2 - target.width * (target.scaleX ?? 1) / 2;
      }
      if (snapH) {
        target.top = canvasH / 2 - target.height * (target.scaleY ?? 1) / 2;
      }
    }
    if (!enableShiftAxisLock || !target || !transform || !pointerEvent) {
      if (!enableShiftAxisLock) axisLockStateRef.current = null;
      return;
    }
    if (!pointerEvent.shiftKey) {
      axisLockStateRef.current = null;
      return;
    }
    const original = transform.original;
    if (!original || typeof target.left !== "number" || typeof target.top !== "number") {
      axisLockStateRef.current = null;
      return;
    }
    if (!axisLockStateRef.current) {
      const dx = Math.abs(target.left - original.left);
      const dy = Math.abs(target.top - original.top);
      axisLockStateRef.current = {
        axis: dx >= dy ? "x" : "y"
      };
    }
    if (axisLockStateRef.current.axis === "x") {
      target.top = original.top;
    } else {
      target.left = original.left;
    }
    (_a = target.canvas) == null ? void 0 : _a.requestRenderAll();
  };
  const handleObjectMoved = () => {
    var _a;
    guidelinesRef.current = { vertical: false, horizontal: false };
    (_a = twickCanvasRef.current) == null ? void 0 : _a.requestRenderAll();
  };
  const handleAfterRender = () => {
    const canvas = twickCanvasRef.current;
    if (canvas) drawGuidelines(canvas);
  };
  const applyMarqueeSelectionControls = () => {
    const canvasInstance = twickCanvasRef.current;
    if (!canvasInstance) return;
    const activeObject = canvasInstance.getActiveObject();
    if (!activeObject) return;
    if (activeObject instanceof fabric.ActiveSelection) {
      activeObject.controls.mt = disabledControl;
      activeObject.controls.mb = disabledControl;
      activeObject.controls.ml = disabledControl;
      activeObject.controls.mr = disabledControl;
      activeObject.controls.bl = disabledControl;
      activeObject.controls.br = disabledControl;
      activeObject.controls.tl = disabledControl;
      activeObject.controls.tr = disabledControl;
      activeObject.controls.mtr = rotateControl;
      canvasInstance.requestRenderAll();
    }
  };
  const buildCanvas = ({
    videoSize,
    canvasSize,
    canvasRef,
    backgroundColor = "#000000",
    selectionBorderColor = "#2563eb",
    selectionLineWidth = 2,
    uniScaleTransform = true,
    enableRetinaScaling = true,
    touchZoomThreshold = 10,
    forceBuild = false
  }) => {
    if (!canvasRef) return;
    if (!forceBuild && canvasResolutionRef.current.width === canvasSize.width && canvasResolutionRef.current.height === canvasSize.height) {
      return;
    }
    if (twickCanvasRef.current) {
      twickCanvasRef.current.off("mouse:up", handleMouseUp);
      twickCanvasRef.current.off("text:editing:exited", onTextEdit);
      twickCanvasRef.current.off("object:moving", handleObjectMoving);
      twickCanvasRef.current.off("object:modified", handleObjectMoved);
      twickCanvasRef.current.off("after:render", handleAfterRender);
      twickCanvasRef.current.off("selection:created", applyMarqueeSelectionControls);
      twickCanvasRef.current.off("selection:updated", applyMarqueeSelectionControls);
      twickCanvasRef.current.dispose();
    }
    const { canvas, canvasMetadata } = createCanvas({
      videoSize,
      canvasSize,
      canvasRef,
      backgroundColor,
      selectionBorderColor,
      selectionLineWidth,
      uniScaleTransform,
      enableRetinaScaling,
      touchZoomThreshold
    });
    canvasMetadataRef.current = canvasMetadata;
    videoSizeRef.current = videoSize;
    canvas == null ? void 0 : canvas.on("mouse:up", handleMouseUp);
    canvas == null ? void 0 : canvas.on("text:editing:exited", onTextEdit);
    canvas == null ? void 0 : canvas.on("object:moving", handleObjectMoving);
    canvas == null ? void 0 : canvas.on("object:modified", handleObjectMoved);
    canvas == null ? void 0 : canvas.on("after:render", handleAfterRender);
    canvas == null ? void 0 : canvas.on("selection:created", applyMarqueeSelectionControls);
    canvas == null ? void 0 : canvas.on("selection:updated", applyMarqueeSelectionControls);
    canvasResolutionRef.current = canvasSize;
    setTwickCanvas(canvas);
    twickCanvasRef.current = canvas;
    if (onCanvasReady) {
      onCanvasReady(canvas);
    }
  };
  const onTextEdit = (event) => {
    if (event.target) {
      const object = event.target;
      const elementId = object.get("id");
      elementMap.current[elementId] = {
        ...elementMap.current[elementId],
        props: {
          ...elementMap.current[elementId].props,
          text: object.text ?? elementMap.current[elementId].props.text
        }
      };
      onCanvasOperation == null ? void 0 : onCanvasOperation(
        CANVAS_OPERATIONS.ITEM_UPDATED,
        elementMap.current[elementId]
      );
    }
  };
  const handleMouseUp = (event) => {
    var _a, _b, _c;
    if (event.target) {
      const object = event.target;
      const elementId = object.get("id");
      const action = (_a = event.transform) == null ? void 0 : _a.action;
      if (action === "drag") {
        const original = event.transform.original;
        if (object.left === original.left && object.top === original.top) {
          onCanvasOperation == null ? void 0 : onCanvasOperation(
            CANVAS_OPERATIONS.ITEM_SELECTED,
            elementMap.current[elementId]
          );
          return;
        }
      }
      const context = {
        canvasMetadata: canvasMetadataRef.current,
        videoSize: videoSizeRef.current,
        elementFrameMapRef: elementFrameMap,
        captionPropsRef,
        watermarkPropsRef
      };
      if (object instanceof fabric.ActiveSelection && (action === "drag" || action === "rotate")) {
        const objects = object.getObjects();
        for (const fabricObj of objects) {
          const id = fabricObj.get("id");
          if (!id || id === "e-watermark") continue;
          const currentElement = elementMap.current[id];
          if (!currentElement) continue;
          const handler = elementController.get(currentElement.type);
          const result = (_b = handler == null ? void 0 : handler.updateFromFabricObject) == null ? void 0 : _b.call(
            handler,
            fabricObj,
            currentElement,
            context
          );
          if (result) {
            elementMap.current[id] = result.element;
            onCanvasOperation == null ? void 0 : onCanvasOperation(
              result.operation ?? CANVAS_OPERATIONS.ITEM_UPDATED,
              result.payload ?? result.element
            );
          }
        }
        return;
      }
      switch (action) {
        case "drag":
        case "scale":
        case "scaleX":
        case "scaleY":
        case "rotate": {
          const currentElement = elementMap.current[elementId];
          const handler = elementController.get(
            elementId === "e-watermark" ? "watermark" : currentElement == null ? void 0 : currentElement.type
          );
          const result = (_c = handler == null ? void 0 : handler.updateFromFabricObject) == null ? void 0 : _c.call(handler, object, currentElement ?? { id: elementId, type: "text", props: {} }, context);
          if (result) {
            elementMap.current[elementId] = result.element;
            onCanvasOperation == null ? void 0 : onCanvasOperation(
              result.operation ?? CANVAS_OPERATIONS.ITEM_UPDATED,
              result.payload ?? result.element
            );
          }
          break;
        }
      }
    }
  };
  const setCanvasElements = async ({
    elements,
    watermark,
    seekTime = 0,
    captionProps,
    cleanAndAdd = false,
    lockAspectRatio
  }) => {
    if (!twickCanvas || !getCanvasContext(twickCanvas)) return;
    try {
      if (cleanAndAdd && getCanvasContext(twickCanvas)) {
        const backgroundColor = twickCanvas.backgroundColor;
        clearCanvas(twickCanvas);
        if (backgroundColor) {
          twickCanvas.backgroundColor = backgroundColor;
          twickCanvas.renderAll();
        }
      }
      captionPropsRef.current = captionProps;
      const uniqueElements = [];
      const seenIds = /* @__PURE__ */ new Set();
      for (const el of elements) {
        if (!el || !el.id) continue;
        if (seenIds.has(el.id)) continue;
        seenIds.add(el.id);
        uniqueElements.push(el);
      }
      await Promise.all(
        uniqueElements.map(async (element, index) => {
          try {
            if (!element) return;
            const zOrder = element.zIndex ?? index;
            await addElementToCanvas({
              element,
              index: zOrder,
              reorder: false,
              seekTime,
              captionProps,
              lockAspectRatio
            });
          } catch {
          }
        })
      );
      if (watermark) {
        addWatermarkToCanvas({
          element: watermark
        });
      }
      reorderElementsByZIndex(twickCanvas);
    } catch {
    }
  };
  const addElementToCanvas = async ({
    element,
    index,
    reorder = true,
    seekTime,
    captionProps,
    lockAspectRatio
  }) => {
    var _a;
    if (!twickCanvas) return;
    const handler = elementController.get(element.type);
    if (handler) {
      await handler.add({
        element,
        index,
        canvas: twickCanvas,
        canvasMetadata: canvasMetadataRef.current,
        seekTime,
        captionProps: captionProps ?? null,
        elementFrameMapRef: elementFrameMap,
        getCurrentFrameEffect,
        lockAspectRatio: lockAspectRatio ?? ((_a = element.props) == null ? void 0 : _a.lockAspectRatio)
      });
    }
    elementMap.current[element.id] = { ...element, zIndex: element.zIndex ?? index };
    if (reorder) {
      reorderElementsByZIndex(twickCanvas);
    }
  };
  const addWatermarkToCanvas = ({ element }) => {
    if (!twickCanvas) return;
    const handler = elementController.get("watermark");
    if (handler) {
      handler.add({
        element,
        index: Object.keys(elementMap.current).length,
        canvas: twickCanvas,
        canvasMetadata: canvasMetadataRef.current,
        watermarkPropsRef
      });
      elementMap.current[element.id] = element;
    }
  };
  const applyZOrder = (elementId, direction) => {
    if (!twickCanvas) return false;
    const newZIndex = changeZOrder(twickCanvas, elementId, direction);
    if (newZIndex == null) return false;
    const element = elementMap.current[elementId];
    if (element) elementMap.current[elementId] = { ...element, zIndex: newZIndex };
    onCanvasOperation == null ? void 0 : onCanvasOperation(CANVAS_OPERATIONS.Z_ORDER_CHANGED, { elementId, direction });
    return true;
  };
  const bringToFront = (elementId) => applyZOrder(elementId, "front");
  const sendToBack = (elementId) => applyZOrder(elementId, "back");
  const bringForward = (elementId) => applyZOrder(elementId, "forward");
  const sendBackward = (elementId) => applyZOrder(elementId, "backward");
  const setBackgroundColor = react.useCallback((color) => {
    const canvas = twickCanvasRef.current;
    if (canvas) {
      canvas.backgroundColor = color;
      canvas.requestRenderAll();
    }
  }, []);
  return {
    twickCanvas,
    buildCanvas,
    resizeCanvas,
    setBackgroundColor,
    onVideoSizeChange,
    addWatermarkToCanvas,
    addElementToCanvas,
    setCanvasElements,
    bringToFront,
    sendToBack,
    bringForward,
    sendBackward
  };
};
exports.CANVAS_OPERATIONS = CANVAS_OPERATIONS;
exports.ELEMENT_TYPES = ELEMENT_TYPES;
exports.ElementController = ElementController;
exports.addBackgroundColor = addBackgroundColor;
exports.addCaptionElement = addCaptionElement;
exports.addImageElement = addImageElement;
exports.addRectElement = addRectElement;
exports.addTextElement = addTextElement;
exports.addVideoElement = addVideoElement;
exports.convertToCanvasPosition = convertToCanvasPosition;
exports.convertToVideoPosition = convertToVideoPosition;
exports.createCanvas = createCanvas;
exports.disabledControl = disabledControl;
exports.elementController = elementController;
exports.getCanvasHandler = getCanvasHandler;
exports.getCurrentFrameEffect = getCurrentFrameEffect;
exports.registerCanvasHandler = registerCanvasHandler;
exports.reorderElementsByZIndex = reorderElementsByZIndex;
exports.rotateControl = rotateControl;
exports.useTwickCanvas = useTwickCanvas;
//# sourceMappingURL=index.js.map
