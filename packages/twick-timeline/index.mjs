var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
import { jsx } from "react/jsx-runtime";
import React, { useState, createContext, useContext, useRef, useMemo, useEffect, useCallback } from "react";
const TRACK_TYPES = {
  /** Video track – video clips */
  VIDEO: "video",
  /** Audio track – audio clips */
  AUDIO: "audio",
  /** Caption track – captions / captions */
  CAPTION: "caption",
  /** Scene track – scene containers (e.g. image/video as full scene) */
  SCENE: "scene",
  /** Element track – text, shapes, icons, images (overlay elements) */
  ELEMENT: "element"
};
const INITIAL_TIMELINE_DATA = {
  tracks: [
    {
      type: TRACK_TYPES.ELEMENT,
      id: "t-sample",
      name: "sample",
      elements: [
        {
          id: "e-sample",
          trackId: "t-sample",
          name: "sample",
          type: "text",
          s: 0,
          e: 5,
          props: {
            text: "Your text here",
            fill: "#FFFFFF"
          }
        }
      ]
    }
  ],
  version: 1
};
const PLAYER_STATE = {
  /** Player is refreshing/reloading content */
  REFRESH: "Refresh",
  /** Player is actively playing content */
  PLAYING: "Playing",
  /** Player is paused */
  PAUSED: "Paused"
};
const CAPTION_STYLE = {
  /** Highlights background of each word */
  WORD_BG_HIGHLIGHT: "highlight_bg",
  /** Animates text word by word */
  WORD_BY_WORD: "word_by_word",
  /** Animates text word by word with background highlighting */
  WORD_BY_WORD_WITH_BG: "word_by_word_with_bg",
  /** Classic outline: white text with black stroke, no background */
  OUTLINE_ONLY: "outline_only",
  /** Soft box: full phrase in semi-transparent rounded box */
  SOFT_BOX: "soft_box",
  /** Lower third: single line with optional bar (broadcast style) */
  LOWER_THIRD: "lower_third",
  /** Typewriter: characters appear one by one */
  TYPEWRITER: "typewriter",
  /** Karaoke: one word highlighted at a time */
  KARAOKE: "karaoke",
  /** Karaoke-word: previous words dim while current stays highlighted */
  KARAOKE_WORD: "karaoke-word",
  /** Pop / scale: words pop in with a short scale animation */
  POP_SCALE: "pop_scale"
};
const CAPTION_STYLE_OPTIONS = {
  [CAPTION_STYLE.WORD_BG_HIGHLIGHT]: {
    label: "Highlight Background",
    value: CAPTION_STYLE.WORD_BG_HIGHLIGHT
  },
  [CAPTION_STYLE.WORD_BY_WORD]: {
    label: "Word by Word",
    value: CAPTION_STYLE.WORD_BY_WORD
  },
  [CAPTION_STYLE.WORD_BY_WORD_WITH_BG]: {
    label: "Word with Background",
    value: CAPTION_STYLE.WORD_BY_WORD_WITH_BG
  },
  [CAPTION_STYLE.OUTLINE_ONLY]: {
    label: "Classic Outline",
    value: CAPTION_STYLE.OUTLINE_ONLY
  },
  [CAPTION_STYLE.SOFT_BOX]: {
    label: "Soft Box",
    value: CAPTION_STYLE.SOFT_BOX
  },
  [CAPTION_STYLE.LOWER_THIRD]: {
    label: "Lower Third",
    value: CAPTION_STYLE.LOWER_THIRD
  },
  [CAPTION_STYLE.TYPEWRITER]: {
    label: "Typewriter",
    value: CAPTION_STYLE.TYPEWRITER
  },
  [CAPTION_STYLE.KARAOKE]: {
    label: "Karaoke",
    value: CAPTION_STYLE.KARAOKE
  },
  [CAPTION_STYLE.KARAOKE_WORD]: {
    label: "Karaoke (Word Fade)",
    value: CAPTION_STYLE.KARAOKE_WORD
  },
  [CAPTION_STYLE.POP_SCALE]: {
    label: "Pop / Scale",
    value: CAPTION_STYLE.POP_SCALE
  }
};
const CAPTION_FONT = {
  /** Font size in pixels */
  size: 40
};
const CAPTION_COLOR = {
  /** Text color in hex format */
  text: "#ffffff",
  /** Highlight color in hex format */
  highlight: "#ff4081",
  /** Background color in hex format */
  bgColor: "#8C52FF"
};
const WORDS_PER_PHRASE = 4;
const TIMELINE_ACTION = {
  /** No action being performed */
  NONE: "none",
  /** Setting the player state (play/pause) */
  SET_PLAYER_STATE: "setPlayerState",
  /** Updating player data */
  UPDATE_PLAYER_DATA: "updatePlayerData",
  /** Player has been updated */
  ON_PLAYER_UPDATED: "onPlayerUpdated"
};
const TIMELINE_ELEMENT_TYPE = {
  /** Video element type */
  VIDEO: "video",
  /** Caption element type */
  CAPTION: "caption",
  /** Image element type */
  IMAGE: "image",
  /** Audio element type */
  AUDIO: "audio",
  /** Text element type */
  TEXT: "text",
  /** Rectangle element type */
  RECT: "rect",
  /** Circle element type */
  CIRCLE: "circle",
  /** Icon element type */
  ICON: "icon",
  /** Placeholder element type (e.g. for lazy-loaded media) */
  PLACEHOLDER: "placeholder",
  /** Line annotation / shape element type */
  LINE: "line",
  /** Arrow annotation element type */
  ARROW: "arrow",
  /** Global / adjustment-layer style effect element */
  EFFECT: "effect"
};
const PROCESS_STATE = {
  /** Process is idle */
  IDLE: "Idle",
  /** Process is currently running */
  PROCESSING: "Processing",
  /** Process has completed successfully */
  COMPLETED: "Completed",
  /** Process has failed */
  FAILED: "Failed"
};
const imageDimensionsCache = {};
const videoMetaCache = {};
const audioDurationCache = {};
const getAudioDuration = (audioSrc) => {
  if (audioDurationCache[audioSrc]) {
    return Promise.resolve(audioDurationCache[audioSrc]);
  }
  return new Promise((resolve, reject) => {
    const audio = document.createElement("audio");
    audio.preload = "metadata";
    const isSafeUrl = /^(https?:|blob:|data:audio\/)/i.test(audioSrc);
    if (!isSafeUrl) {
      throw new Error("Unsafe audio source URL");
    }
    audio.src = audioSrc;
    audio.onloadedmetadata = () => {
      const duration = audio.duration;
      audioDurationCache[audioSrc] = duration;
      resolve(duration);
    };
    audio.onerror = () => {
      reject(new Error("Failed to load audio metadata"));
    };
  });
};
const concurrencyLimit = 5;
let activeCount = 0;
const queue = [];
function runNext() {
  if (queue.length === 0 || activeCount >= concurrencyLimit) return;
  const next = queue.shift();
  if (next) {
    activeCount++;
    next();
  }
}
function limit(fn2) {
  return new Promise((resolve, reject) => {
    const task = () => {
      fn2().then(resolve).catch(reject).finally(() => {
        activeCount--;
        runNext();
      });
    };
    if (activeCount < concurrencyLimit) {
      activeCount++;
      task();
    } else {
      queue.push(task);
    }
  });
}
const loadImageDimensions = (url) => {
  return new Promise((resolve, reject) => {
    if (typeof document === "undefined") {
      reject(new Error("getImageDimensions() is only available in the browser."));
      return;
    }
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = reject;
    img.src = url;
  });
};
const getImageDimensions = (url) => {
  if (imageDimensionsCache[url]) {
    return Promise.resolve(imageDimensionsCache[url]);
  }
  return limit(() => loadImageDimensions(url)).then((dimensions) => {
    imageDimensionsCache[url] = dimensions;
    return dimensions;
  });
};
const getVideoMeta = (videoSrc) => {
  if (videoMetaCache[videoSrc]) {
    return Promise.resolve(videoMetaCache[videoSrc]);
  }
  return new Promise((resolve, reject) => {
    const isSafeUrl = /^(https?:|blob:|data:video\/)/i.test(videoSrc);
    if (!isSafeUrl) {
      reject(new Error("Unsafe video source URL"));
      return;
    }
    const tryLoadVideo = (useCors) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.crossOrigin = useCors ? "anonymous" : null;
      video.src = videoSrc;
      video.onloadedmetadata = () => {
        const meta = {
          width: video.videoWidth,
          height: video.videoHeight,
          duration: video.duration
        };
        videoMetaCache[videoSrc] = meta;
        resolve(meta);
      };
      video.onerror = () => {
        if (useCors) {
          video.src = "";
          tryLoadVideo(false);
        } else {
          reject(new Error("Failed to load video metadata. This may be due to CORS restrictions or an invalid video URL."));
        }
      };
    };
    tryLoadVideo(true);
  });
};
const extractAudio = async ({
  src,
  playbackRate = 1,
  start = 0,
  end
}) => {
  if (!src) throw new Error("src is required");
  if (playbackRate <= 0) throw new Error("playbackRate must be > 0");
  const isSafeUrl = /^(https?:|blob:|data:)/i.test(src);
  if (!isSafeUrl) throw new Error("Unsafe media source URL");
  const audioBuffer = await fetchAndDecodeAudio(src);
  if (audioBuffer.duration === 0 || audioBuffer.length === 0) {
    throw new Error("No audio track found in the media source");
  }
  if (isAudioSilent(audioBuffer)) {
    throw new Error("Audio track is silent (no audio content detected)");
  }
  const clampedStart = Math.max(0, start || 0);
  const fullDuration = audioBuffer.duration;
  const clampedEnd = Math.min(
    typeof end === "number" ? end : fullDuration,
    fullDuration
  );
  if (clampedEnd <= clampedStart)
    throw new Error("Invalid range: end must be greater than start");
  const renderedBuffer = await renderAudioSegment(
    audioBuffer,
    clampedStart,
    clampedEnd,
    playbackRate
  );
  const mp3Blob = await audioBufferToMp3(renderedBuffer);
  return URL.createObjectURL(mp3Blob);
};
const stitchAudio = async (segments, totalDuration) => {
  if (!segments || segments.length === 0) {
    throw new Error("At least one audio segment is required");
  }
  const duration = totalDuration || Math.max(...segments.map((s2) => s2.e));
  const renderedBuffer = await createAudioTimeline(segments, duration);
  const mp3Blob = await audioBufferToMp3(renderedBuffer);
  return URL.createObjectURL(mp3Blob);
};
const fetchAndDecodeAudio = async (src) => {
  const response = await fetch(src);
  if (!response.ok) throw new Error(`Failed to fetch source: ${response.status}`);
  const arrayBuffer = await response.arrayBuffer();
  return decodeAudioData(arrayBuffer);
};
const decodeAudioData = async (arrayBuffer) => {
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextCtor) throw new Error("Web Audio API not supported");
  const audioContext = new AudioContextCtor();
  try {
    return await new Promise((resolve, reject) => {
      audioContext.decodeAudioData(
        arrayBuffer.slice(0),
        (buf) => resolve(buf),
        (err) => reject(err || new Error("Failed to decode audio: no audio track found or unsupported format"))
      );
    });
  } finally {
    audioContext.close();
  }
};
const isAudioSilent = (buffer, threshold = 1e-3) => {
  for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i2 = 0; i2 < channelData.length; i2 += 100) {
      if (Math.abs(channelData[i2]) > threshold) {
        return false;
      }
    }
  }
  return true;
};
const renderAudioSegment = async (audioBuffer, start, end, playbackRate) => {
  const OfflineAudioContextCtor = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  if (!OfflineAudioContextCtor) throw new Error("OfflineAudioContext not supported");
  const sampleRate = audioBuffer.sampleRate;
  const numChannels = audioBuffer.numberOfChannels;
  const sourceDuration = end - start;
  const renderedFrames = Math.max(
    1,
    Math.ceil(sourceDuration / playbackRate * sampleRate)
  );
  const offline = new OfflineAudioContextCtor(numChannels, renderedFrames, sampleRate);
  const sourceNode = offline.createBufferSource();
  sourceNode.buffer = audioBuffer;
  sourceNode.playbackRate.value = playbackRate;
  sourceNode.connect(offline.destination);
  sourceNode.start(0, start, sourceDuration);
  return await offline.startRendering();
};
const createAudioTimeline = async (segments, duration) => {
  const OfflineAudioContextCtor = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  if (!OfflineAudioContextCtor) throw new Error("OfflineAudioContext not supported");
  const sampleRate = 44100;
  const totalFrames = Math.ceil(duration * sampleRate);
  const offline = new OfflineAudioContextCtor(2, totalFrames, sampleRate);
  for (const segment of segments) {
    if (segment.s >= segment.e) continue;
    const volume = segment.volume ?? 1;
    if (volume <= 0) continue;
    try {
      const audioBuffer = await fetchAndDecodeAudio(segment.src);
      const segmentDuration = segment.e - segment.s;
      const sourceDuration = Math.min(segmentDuration, audioBuffer.duration);
      const source = offline.createBufferSource();
      source.buffer = audioBuffer;
      if (volume !== 1) {
        const gainNode = offline.createGain();
        gainNode.gain.value = volume;
        source.connect(gainNode);
        gainNode.connect(offline.destination);
      } else {
        source.connect(offline.destination);
      }
      source.start(segment.s, 0, sourceDuration);
    } catch {
    }
  }
  return await offline.startRendering();
};
const audioBufferToMp3 = async (buffer) => {
  try {
    const wavArrayBuffer = audioBufferToWavArrayBuffer(buffer);
    const pcmBuffer = await decodeAudioData(wavArrayBuffer);
    return await encodePcmToMp3(pcmBuffer);
  } catch (error) {
    return audioBufferToWavBlob(buffer);
  }
};
const audioBufferToWavArrayBuffer = (buffer) => {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const numFrames = buffer.length;
  const interleaved = interleave(buffer, numChannels, numFrames);
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = interleaved.length * bytesPerSample;
  const bufferSize = 44 + dataSize;
  const arrayBuffer = new ArrayBuffer(bufferSize);
  const view = new DataView(arrayBuffer);
  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, "data");
  view.setUint32(40, dataSize, true);
  floatTo16BitPCM(view, 44, interleaved);
  return arrayBuffer;
};
const encodePcmToMp3 = async (buffer) => {
  const lamejs = await import("./index-CXhwwSX--SW4K-mAQ.mjs").then((n2) => n2.i);
  const channels = buffer.numberOfChannels >= 2 ? 2 : 1;
  const targetSampleRate = 22050;
  const downsampledBuffer = downsampleAudioBuffer(buffer, targetSampleRate);
  const kbps = 48;
  const mp3encoder = new lamejs.default.Mp3Encoder(channels, targetSampleRate, kbps);
  const samplesPerFrame = 1152;
  const leftFloat = downsampledBuffer.getChannelData(0);
  const left = floatTo16(leftFloat);
  let right;
  if (channels === 2) {
    const rightFloat = downsampledBuffer.getChannelData(1);
    right = floatTo16(rightFloat);
  }
  const mp3Chunks = [];
  for (let i2 = 0; i2 < left.length; i2 += samplesPerFrame) {
    const leftChunk = left.subarray(i2, Math.min(i2 + samplesPerFrame, left.length));
    let mp3buf;
    if (channels === 2 && right) {
      const rightChunk = right.subarray(i2, Math.min(i2 + samplesPerFrame, right.length));
      mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);
    } else {
      mp3buf = mp3encoder.encodeBuffer(leftChunk);
    }
    if (mp3buf.length > 0) mp3Chunks.push(mp3buf);
  }
  const end = mp3encoder.flush();
  if (end.length > 0) mp3Chunks.push(end);
  return new Blob(mp3Chunks, { type: "audio/mpeg" });
};
const audioBufferToWavBlob = (buffer) => {
  const arrayBuffer = audioBufferToWavArrayBuffer(buffer);
  return new Blob([arrayBuffer], { type: "audio/wav" });
};
const downsampleAudioBuffer = (buffer, targetSampleRate) => {
  if (buffer.sampleRate === targetSampleRate) {
    return buffer;
  }
  const ratio = buffer.sampleRate / targetSampleRate;
  const newLength = Math.round(buffer.length / ratio);
  const newBuffer = new AudioContext().createBuffer(
    buffer.numberOfChannels,
    newLength,
    targetSampleRate
  );
  for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
    const oldData = buffer.getChannelData(channel);
    const newData = newBuffer.getChannelData(channel);
    for (let i2 = 0; i2 < newLength; i2++) {
      const oldIndex = Math.floor(i2 * ratio);
      newData[i2] = oldData[oldIndex];
    }
  }
  return newBuffer;
};
const interleave = (buffer, numChannels, numFrames) => {
  if (numChannels === 1) {
    return buffer.getChannelData(0).slice(0, numFrames);
  }
  const result = new Float32Array(numFrames * numChannels);
  const channelData = [];
  for (let ch = 0; ch < numChannels; ch++) {
    channelData[ch] = buffer.getChannelData(ch);
  }
  let writeIndex = 0;
  for (let i2 = 0; i2 < numFrames; i2++) {
    for (let ch = 0; ch < numChannels; ch++) {
      result[writeIndex++] = channelData[ch][i2];
    }
  }
  return result;
};
const floatTo16BitPCM = (view, offset, input) => {
  let pos = offset;
  for (let i2 = 0; i2 < input.length; i2++, pos += 2) {
    let s2 = Math.max(-1, Math.min(1, input[i2]));
    view.setInt16(pos, s2 < 0 ? s2 * 32768 : s2 * 32767, true);
  }
};
const floatTo16 = (input) => {
  const output = new Int16Array(input.length);
  for (let i2 = 0; i2 < input.length; i2++) {
    const s2 = Math.max(-1, Math.min(1, input[i2]));
    output[i2] = s2 < 0 ? s2 * 32768 : s2 * 32767;
  }
  return output;
};
const writeString = (view, offset, str) => {
  for (let i2 = 0; i2 < str.length; i2++) {
    view.setUint8(offset + i2, str.charCodeAt(i2));
  }
};
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
class TrackElement {
  constructor(type, id) {
    __publicField(this, "id");
    __publicField(this, "type");
    __publicField(this, "s");
    __publicField(this, "e");
    __publicField(this, "trackId");
    __publicField(this, "name");
    __publicField(this, "animation");
    __publicField(this, "props");
    __publicField(this, "metadata");
    this.id = id ?? `e-${generateShortUuid()}`;
    this.type = type;
    this.props = {
      x: 0,
      y: 0,
      opacity: 1,
      rotation: 0
    };
  }
  getId() {
    return this.id;
  }
  getType() {
    return this.type;
  }
  getStart() {
    return this.s;
  }
  getEnd() {
    return this.e;
  }
  getDuration() {
    return this.e - this.s;
  }
  getTrackId() {
    return this.trackId;
  }
  getProps() {
    return this.props;
  }
  getMetadata() {
    return this.metadata;
  }
  getName() {
    return this.name;
  }
  getAnimation() {
    return this.animation;
  }
  getPosition() {
    var _a, _b;
    return {
      x: ((_a = this.props) == null ? void 0 : _a.x) ?? 0,
      y: ((_b = this.props) == null ? void 0 : _b.y) ?? 0
    };
  }
  getRotation() {
    return this.props.rotation ?? 0;
  }
  getOpacity() {
    return this.props.opacity ?? 1;
  }
  setId(id) {
    this.id = id;
    return this;
  }
  setType(type) {
    this.type = type;
    return this;
  }
  setStart(s2) {
    this.s = Math.max(0, s2);
    return this;
  }
  setEnd(e2) {
    this.e = Math.max(this.s ?? 0, e2);
    return this;
  }
  setTrackId(trackId) {
    this.trackId = trackId;
    return this;
  }
  setName(name2) {
    this.name = name2;
    return this;
  }
  setAnimation(animation) {
    this.animation = animation;
    return this;
  }
  setPosition(position) {
    this.props.x = position.x;
    this.props.y = position.y;
    return this;
  }
  setRotation(rotation) {
    this.props.rotation = rotation;
    return this;
  }
  setOpacity(opacity) {
    this.props.opacity = opacity;
    return this;
  }
  setProps(props) {
    this.props = structuredClone(props);
    return this;
  }
  setMetadata(metadata) {
    this.metadata = metadata ? structuredClone(metadata) : void 0;
    return this;
  }
  getTransition() {
    var _a;
    return (_a = this.props) == null ? void 0 : _a.transition;
  }
  setTransition(transition) {
    if (!this.props) this.props = {};
    this.props.transition = transition;
    return this;
  }
}
class VideoElement extends TrackElement {
  constructor(src, parentSize) {
    super(TIMELINE_ELEMENT_TYPE.VIDEO);
    __publicField(this, "baseSize");
    __publicField(this, "mediaDuration");
    __publicField(this, "parentSize");
    __publicField(this, "backgroundColor");
    __publicField(this, "objectFit");
    __publicField(this, "frameEffects");
    __publicField(this, "frame");
    this.objectFit = "cover";
    this.frameEffects = [];
    this.parentSize = parentSize;
    this.props = {
      src,
      playbackRate: 1,
      time: 0,
      mediaFilter: "none",
      volume: 1
    };
  }
  getParentSize() {
    return this.parentSize;
  }
  getFrame() {
    return this.frame;
  }
  getFrameEffects() {
    return this.frameEffects;
  }
  getBackgroundColor() {
    return this.backgroundColor;
  }
  getObjectFit() {
    return this.objectFit;
  }
  getMediaDuration() {
    return this.mediaDuration;
  }
  getStartAt() {
    return this.props.time || 0;
  }
  getEndAt() {
    return this.getDuration() * this.getPlaybackRate();
  }
  getSrc() {
    return this.props.src;
  }
  getPlaybackRate() {
    return this.props.playbackRate ?? 1;
  }
  getVolume() {
    return this.props.volume ?? 1;
  }
  getRotation() {
    var _a;
    return ((_a = this.frame) == null ? void 0 : _a.rotation) ?? 0;
  }
  setRotation(rotation) {
    this.frame.rotation = rotation;
    return this;
  }
  getPosition() {
    return {
      x: this.frame.x ?? 0,
      y: this.frame.y ?? 0
    };
  }
  async updateVideoMeta(updateFrame = true) {
    const meta = await getVideoMeta(this.props.src);
    if (updateFrame) {
      const baseSize = getObjectFitSize(
        "contain",
        { width: meta.width, height: meta.height },
        this.parentSize
      );
      this.frame = {
        ...this.frame,
        size: [baseSize.width, baseSize.height]
      };
    }
    this.mediaDuration = meta.duration;
  }
  setPosition(position) {
    this.frame.x = position.x;
    this.frame.y = position.y;
    return this;
  }
  async setSrc(src) {
    this.props.src = src;
    await this.updateVideoMeta();
    return this;
  }
  setMediaDuration(mediaDuration) {
    this.mediaDuration = mediaDuration;
    return this;
  }
  setParentSize(parentSize) {
    this.parentSize = structuredClone(parentSize);
    return this;
  }
  setObjectFit(objectFit) {
    this.objectFit = objectFit;
    return this;
  }
  setFrame(frame) {
    this.frame = structuredClone(frame);
    return this;
  }
  setPlaybackRate(playbackRate) {
    this.props.playbackRate = playbackRate;
    return this;
  }
  setStartAt(time) {
    this.props.time = Math.max(0, time);
    return this;
  }
  setMediaFilter(mediaFilter) {
    this.props.mediaFilter = mediaFilter;
    return this;
  }
  setVolume(volume) {
    this.props.volume = volume;
    return this;
  }
  setBackgroundColor(backgroundColor) {
    this.backgroundColor = backgroundColor;
    return this;
  }
  setProps(props) {
    this.props = {
      ...structuredClone(props),
      src: this.props.src
    };
    return this;
  }
  setFrameEffects(frameEffects) {
    this.frameEffects = frameEffects;
    return this;
  }
  addFrameEffect(frameEffect) {
    var _a;
    (_a = this.frameEffects) == null ? void 0 : _a.push(frameEffect);
    return this;
  }
  accept(visitor) {
    return visitor.visitVideoElement(this);
  }
}
const getDecimalNumber = (num, precision = 3) => {
  return Number(num.toFixed(precision));
};
const getTotalDuration = (tracks) => {
  return (tracks || []).reduce(
    (maxDuration, timeline) => Math.max(
      maxDuration,
      ((timeline == null ? void 0 : timeline.elements) || []).reduce(
        (timelineDuration, element) => Math.max(timelineDuration, element.e),
        0
      )
    ),
    0
  );
};
const generateShortUuid = () => {
  return "xxxxxxxxxxxx".replace(/[xy]/g, (c2) => {
    const r2 = Math.random() * 16 | 0, v2 = c2 === "x" ? r2 : r2 & 3 | 8;
    return v2.toString(16);
  });
};
const getCurrentElements = (currentTime, tracks) => {
  const currentElements = [];
  if (tracks == null ? void 0 : tracks.length) {
    for (let i2 = 0; i2 < tracks.length; i2++) {
      if (tracks[i2]) {
        const elements = tracks[i2].getElements();
        for (let j2 = 0; j2 < elements.length; j2++) {
          const element = elements[j2];
          if (element.getStart() <= currentTime && element.getEnd() >= currentTime) {
            currentElements.push(element);
          }
        }
      }
    }
  }
  return currentElements;
};
const canSplitElement = (element, currentTime) => {
  return element.getStart() <= currentTime && element.getEnd() >= currentTime;
};
const isElementId = (id) => id.startsWith("e-");
const isTrackId = (id) => id.startsWith("t-");
const extractVideoAudio = async (tracks, duration) => {
  const videoSegments = [];
  tracks.forEach(
    (track) => track.getElements().forEach((element) => {
      if (element instanceof VideoElement) {
        videoSegments.push({
          src: element.getSrc(),
          startAt: element.getStartAt(),
          endAt: element.getEndAt(),
          s: element.getStart(),
          e: element.getEnd(),
          volume: element.getVolume(),
          playbackRate: element.getPlaybackRate()
        });
      }
    })
  );
  const videoAudioPromises = videoSegments.map((segment) => {
    return extractAudio({
      src: segment.src,
      startAt: segment.startAt,
      endAt: segment.endAt,
      volume: segment.volume,
      playbackRate: segment.playbackRate
    });
  });
  const audioUrls = await Promise.all(videoAudioPromises);
  const extractedAudio = await stitchAudio(
    audioUrls.map((url, index) => ({
      src: url,
      s: videoSegments[index].s,
      e: videoSegments[index].e,
      volume: videoSegments[index].volume
    })),
    duration
  );
  return extractedAudio;
};
const CURRENT_PROJECT_VERSION = 2;
const migrateToV1 = (project) => ({
  ...project,
  version: 1,
  tracks: project.tracks || []
});
const migrateToV2 = (project) => ({
  ...project,
  version: 2,
  metadata: project.metadata ?? {},
  tracks: (project.tracks || []).map((track) => ({
    ...track,
    elements: (track.elements || []).map((element) => ({
      ...element,
      metadata: element.metadata ?? void 0
    }))
  }))
});
const MIGRATIONS = {
  1: migrateToV1,
  2: migrateToV2
};
function migrateProject(project, targetVersion = CURRENT_PROJECT_VERSION) {
  const safeProject = {
    tracks: (project == null ? void 0 : project.tracks) || [],
    version: Math.max(0, (project == null ? void 0 : project.version) || 0),
    ...(project == null ? void 0 : project.watermark) !== void 0 && { watermark: project.watermark },
    ...(project == null ? void 0 : project.backgroundColor) !== void 0 && {
      backgroundColor: project.backgroundColor
    },
    ...(project == null ? void 0 : project.metadata) !== void 0 && { metadata: project.metadata }
  };
  let currentVersion = safeProject.version;
  let migrated = safeProject;
  while (currentVersion < targetVersion) {
    const nextVersion = currentVersion + 1;
    const migration = MIGRATIONS[nextVersion];
    if (!migration) break;
    migrated = migration(migrated);
    currentVersion = nextVersion;
  }
  return {
    ...migrated,
    version: Math.max(currentVersion, migrated.version)
  };
}
class AudioElement extends TrackElement {
  constructor(src) {
    super(TIMELINE_ELEMENT_TYPE.AUDIO);
    __publicField(this, "mediaDuration");
    this.props = {
      src,
      time: 0,
      playbackRate: 1,
      volume: 1,
      loop: false
    };
  }
  getMediaDuration() {
    return this.mediaDuration;
  }
  getStartAt() {
    return this.props.time || 0;
  }
  getEndAt() {
    return this.getDuration() * this.getPlaybackRate();
  }
  getSrc() {
    return this.props.src;
  }
  getPlaybackRate() {
    return this.props.playbackRate ?? 1;
  }
  getVolume() {
    return this.props.volume ?? 1;
  }
  async updateAudioMeta() {
    this.mediaDuration = await getAudioDuration(this.props.src);
  }
  async setSrc(src) {
    this.props.src = src;
    await this.updateAudioMeta();
    return this;
  }
  setMediaDuration(mediaDuration) {
    this.mediaDuration = mediaDuration;
    return this;
  }
  setVolume(volume) {
    this.props.volume = volume;
    return this;
  }
  setLoop(loop) {
    this.props.loop = loop;
    return this;
  }
  setStartAt(time) {
    this.props.time = Math.max(0, time);
    return this;
  }
  setPlaybackRate(playbackRate) {
    this.props.playbackRate = playbackRate;
    return this;
  }
  setProps(props) {
    this.props = {
      ...structuredClone(props),
      src: this.props.src
    };
    return this;
  }
  accept(visitor) {
    return visitor.visitAudioElement(this);
  }
}
class ImageElement extends TrackElement {
  constructor(src, parentSize) {
    super(TIMELINE_ELEMENT_TYPE.IMAGE);
    __publicField(this, "backgroundColor");
    __publicField(this, "parentSize");
    __publicField(this, "objectFit");
    __publicField(this, "frameEffects");
    __publicField(this, "frame");
    this.parentSize = parentSize;
    this.objectFit = "cover";
    this.frameEffects = [];
    this.props = {
      src,
      mediaFilter: "none"
    };
    this.frame = {
      x: 0,
      y: 0
    };
  }
  getParentSize() {
    return this.parentSize;
  }
  getFrame() {
    return this.frame;
  }
  getFrameEffects() {
    return this.frameEffects;
  }
  getBackgroundColor() {
    return this.backgroundColor;
  }
  getObjectFit() {
    return this.objectFit;
  }
  getRotation() {
    var _a;
    return ((_a = this.frame) == null ? void 0 : _a.rotation) ?? 0;
  }
  setRotation(rotation) {
    this.frame.rotation = rotation;
    return this;
  }
  getPosition() {
    return {
      x: this.frame.x ?? 0,
      y: this.frame.y ?? 0
    };
  }
  async updateImageMeta(updateFrame = true) {
    const meta = await getImageDimensions(this.props.src);
    if (updateFrame) {
      const baseSize = getObjectFitSize(
        "contain",
        { width: meta.width, height: meta.height },
        this.parentSize
      );
      this.frame = {
        size: [baseSize.width, baseSize.height],
        ...this.frame
      };
    }
  }
  setPosition(position) {
    this.frame.x = position.x;
    this.frame.y = position.y;
    return this;
  }
  async setSrc(src) {
    this.props.src = src;
    await this.updateImageMeta();
    return this;
  }
  setObjectFit(objectFit) {
    this.objectFit = objectFit;
    return this;
  }
  setFrame(frame) {
    this.frame = structuredClone(frame);
    return this;
  }
  setParentSize(parentSize) {
    this.parentSize = structuredClone(parentSize);
    return this;
  }
  setMediaFilter(mediaFilter) {
    this.props.mediaFilter = mediaFilter;
    return this;
  }
  setBackgroundColor(backgroundColor) {
    this.backgroundColor = backgroundColor;
    return this;
  }
  setProps(props) {
    this.props = { ...structuredClone(props), src: this.props.src };
    return this;
  }
  setFrameEffects(frameEffects) {
    this.frameEffects = frameEffects;
    return this;
  }
  addFrameEffect(frameEffect) {
    var _a;
    (_a = this.frameEffects) == null ? void 0 : _a.push(frameEffect);
    return this;
  }
  accept(visitor) {
    return visitor.visitImageElement(this);
  }
}
class TextElement extends TrackElement {
  constructor(text, props) {
    super(TIMELINE_ELEMENT_TYPE.TEXT);
    __publicField(this, "textEffect");
    this.props = {
      text,
      fill: "#888888",
      //default-grey,
      ...props || {}
    };
  }
  getTextEffect() {
    return this.textEffect;
  }
  getText() {
    return this.props.text;
  }
  getStrokeColor() {
    return this.props.stroke;
  }
  getLineWidth() {
    return this.props.lineWidth;
  }
  getProps() {
    return this.props;
  }
  setText(text) {
    this.props.text = text;
    return this;
  }
  setFill(fill) {
    this.props.fill = fill;
    return this;
  }
  setRotation(rotation) {
    this.props.rotation = rotation;
    return this;
  }
  setFontSize(fontSize) {
    this.props.fontSize = fontSize;
    return this;
  }
  setFontFamily(fontFamily) {
    this.props.fontFamily = fontFamily;
    return this;
  }
  setFontWeight(fontWeight) {
    this.props.fontWeight = fontWeight;
    return this;
  }
  setFontStyle(fontStyle) {
    this.props.fontStyle = fontStyle;
    return this;
  }
  setTextEffect(textEffect) {
    this.textEffect = textEffect;
    return this;
  }
  setTextAlign(textAlign) {
    this.props.textAlign = textAlign;
    return this;
  }
  setStrokeColor(stroke) {
    this.props.stroke = stroke;
    return this;
  }
  setLineWidth(lineWidth) {
    this.props.lineWidth = lineWidth;
    return this;
  }
  setProps(props) {
    this.props = structuredClone(props);
    return this;
  }
  accept(visitor) {
    return visitor.visitTextElement(this);
  }
}
class CaptionElement extends TrackElement {
  constructor(t2, start, end) {
    super(TIMELINE_ELEMENT_TYPE.CAPTION);
    __publicField(this, "t");
    this.t = t2;
    this.s = start;
    this.e = end;
    this.props = {};
  }
  getText() {
    return this.t;
  }
  setText(t2) {
    this.t = t2;
    return this;
  }
  accept(visitor) {
    return visitor.visitCaptionElement(this);
  }
}
class IconElement extends TrackElement {
  constructor(src, size, fill = "#866bbf") {
    super(TIMELINE_ELEMENT_TYPE.ICON);
    this.props = {
      src,
      fill,
      size
    };
  }
  getSrc() {
    return this.props.src;
  }
  getFill() {
    return this.props.fill;
  }
  getSize() {
    return this.props.size;
  }
  setSrc(src) {
    this.props.src = src;
    return this;
  }
  setFill(fill) {
    this.props.fill = fill;
    return this;
  }
  setSize(size) {
    this.props.size = size;
    return this;
  }
  accept(visitor) {
    return visitor.visitIconElement(this);
  }
}
class CircleElement extends TrackElement {
  constructor(fill, radius) {
    super(TIMELINE_ELEMENT_TYPE.CIRCLE);
    this.props = {
      radius,
      height: radius * 2,
      width: radius * 2,
      fill,
      strokeColor: fill,
      lineWidth: 1
    };
  }
  getFill() {
    return this.props.fill;
  }
  getRadius() {
    return this.props.radius;
  }
  getStrokeColor() {
    return this.props.strokeColor || this.props.fill;
  }
  getLineWidth() {
    return this.props.lineWidth ?? 0;
  }
  setFill(fill) {
    this.props.fill = fill;
    return this;
  }
  setRadius(radius) {
    this.props.radius = radius;
    this.props.width = radius * 2;
    this.props.height = radius * 2;
    return this;
  }
  setStrokeColor(strokeColor) {
    this.props.strokeColor = strokeColor;
    return this;
  }
  setLineWidth(lineWidth) {
    this.props.lineWidth = lineWidth;
    return this;
  }
  accept(visitor) {
    return visitor.visitCircleElement(this);
  }
}
class RectElement extends TrackElement {
  constructor(fill, size) {
    super(TIMELINE_ELEMENT_TYPE.RECT);
    this.props = {
      width: size.width,
      height: size.height,
      fill,
      radius: 0,
      strokeColor: fill,
      lineWidth: 1
    };
  }
  getFill() {
    return this.props.fill;
  }
  setFill(fill) {
    this.props.fill = fill;
    return this;
  }
  getSize() {
    return { width: this.props.width, height: this.props.height };
  }
  getCornerRadius() {
    return this.props.radius;
  }
  getStrokeColor() {
    return this.props.strokeColor || this.props.fill;
  }
  getLineWidth() {
    return this.props.lineWidth ?? 0;
  }
  setSize(size) {
    this.props.width = size.width;
    this.props.height = size.height;
    return this;
  }
  setCornerRadius(cornerRadius) {
    this.props.radius = cornerRadius;
    return this;
  }
  setStrokeColor(strokeColor) {
    this.props.strokeColor = strokeColor;
    return this;
  }
  setLineWidth(lineWidth) {
    this.props.lineWidth = lineWidth;
    return this;
  }
  accept(visitor) {
    return visitor.visitRectElement(this);
  }
}
class PlaceholderElement extends TrackElement {
  constructor(src, parentSize, expectedDuration) {
    super(TIMELINE_ELEMENT_TYPE.PLACEHOLDER);
    __publicField(this, "parentSize");
    this.parentSize = parentSize;
    this.props = {
      src,
      ...expectedDuration != null && { expectedDuration }
    };
  }
  getSrc() {
    var _a;
    return ((_a = this.props) == null ? void 0 : _a.src) ?? "";
  }
  getExpectedDuration() {
    var _a;
    return (_a = this.props) == null ? void 0 : _a.expectedDuration;
  }
  getParentSize() {
    return this.parentSize;
  }
  accept(visitor) {
    return visitor.visitPlaceholderElement(this);
  }
}
class ElementAnimation {
  constructor(name2) {
    __publicField(this, "name");
    __publicField(this, "interval");
    __publicField(this, "duration");
    __publicField(this, "intensity");
    __publicField(this, "animate");
    __publicField(this, "mode");
    __publicField(this, "direction");
    this.name = name2;
  }
  getName() {
    return this.name;
  }
  getInterval() {
    return this.interval;
  }
  getDuration() {
    return this.duration;
  }
  getIntensity() {
    return this.intensity;
  }
  getAnimate() {
    return this.animate;
  }
  getMode() {
    return this.mode;
  }
  getDirection() {
    return this.direction;
  }
  setInterval(interval) {
    this.interval = interval;
    return this;
  }
  setDuration(duration) {
    this.duration = duration;
    return this;
  }
  setIntensity(intensity) {
    this.intensity = intensity;
    return this;
  }
  setAnimate(animate) {
    this.animate = animate;
    return this;
  }
  setMode(mode) {
    this.mode = mode;
    return this;
  }
  setDirection(direction) {
    this.direction = direction;
    return this;
  }
  toJSON() {
    return {
      name: this.name,
      interval: this.interval,
      duration: this.duration,
      intensity: this.intensity,
      animate: this.animate,
      mode: this.mode,
      direction: this.direction
    };
  }
  static fromJSON(json) {
    const animation = new ElementAnimation(json.name);
    animation.setInterval(json.interval);
    animation.setDuration(json.duration);
    animation.setIntensity(json.intensity);
    animation.setAnimate(json.animate);
    animation.setMode(json.mode);
    animation.setDirection(json.direction);
    return animation;
  }
}
class ElementFrameEffect {
  constructor(start, end) {
    __publicField(this, "s");
    __publicField(this, "e");
    __publicField(this, "props");
    this.s = start;
    this.e = end;
  }
  setProps(props) {
    this.props = props;
    return this;
  }
  getProps() {
    return this.props;
  }
  getStart() {
    return this.s;
  }
  getEnd() {
    return this.e;
  }
  setStart(start) {
    this.s = start;
    return this;
  }
  setEnd(end) {
    this.e = end;
    return this;
  }
  toJSON() {
    return {
      s: this.s,
      e: this.e,
      props: this.props
    };
  }
  static fromJSON(json) {
    const effect = new ElementFrameEffect(json.s, json.e);
    effect.setProps(json.props);
    return effect;
  }
}
class ElementTextEffect {
  constructor(name2) {
    __publicField(this, "name");
    __publicField(this, "duration");
    __publicField(this, "delay");
    __publicField(this, "bufferTime");
    this.name = name2;
  }
  getName() {
    return this.name;
  }
  getDuration() {
    return this.duration;
  }
  getDelay() {
    return this.delay;
  }
  getBufferTime() {
    return this.bufferTime;
  }
  setDuration(duration) {
    this.duration = duration;
    return this;
  }
  setDelay(delay) {
    this.delay = delay;
    return this;
  }
  setBufferTime(bufferTime) {
    this.bufferTime = bufferTime;
    return this;
  }
  toJSON() {
    return {
      name: this.name,
      delay: this.delay,
      duration: this.duration ?? 1,
      bufferTime: this.bufferTime
    };
  }
  static fromJSON(json) {
    const effect = new ElementTextEffect(json.name);
    effect.setDelay(json.delay);
    effect.setDuration(json.duration);
    effect.setBufferTime(json.bufferTime);
    return effect;
  }
}
class ArrowElement extends TrackElement {
  constructor(fill, size) {
    super(TIMELINE_ELEMENT_TYPE.ARROW);
    this.props = {
      fill,
      width: size.width,
      height: size.height,
      lineWidth: 4
    };
  }
  accept(visitor) {
    return visitor.visitArrowElement(this);
  }
}
class LineElement extends TrackElement {
  constructor(fill, size) {
    super(TIMELINE_ELEMENT_TYPE.LINE);
    this.props = {
      fill,
      width: size.width,
      height: size.height,
      radius: 4,
      lineWidth: size.height
    };
  }
  accept(visitor) {
    return visitor.visitLineElement(this);
  }
}
class EffectElement extends TrackElement {
  constructor(effectKey, props) {
    super(TIMELINE_ELEMENT_TYPE.EFFECT);
    this.props = {
      effectKey,
      intensity: 1,
      ...props || {}
    };
  }
  getEffectKey() {
    return this.props.effectKey;
  }
  getIntensity() {
    return this.props.intensity ?? 1;
  }
  getProps() {
    return this.props;
  }
  setEffectKey(effectKey) {
    this.props.effectKey = effectKey;
    return this;
  }
  setIntensity(intensity) {
    this.props.intensity = intensity;
    return this;
  }
  setProps(props) {
    this.props = structuredClone(props);
    return this;
  }
  accept(visitor) {
    return visitor.visitEffectElement(this);
  }
}
const _ElementDeserializer = class _ElementDeserializer {
  static registerCustomType(type, deserializer) {
    if (!(type == null ? void 0 : type.trim())) {
      throw new Error("Element type is required for custom deserializer registration");
    }
    this.customDeserializers[type] = deserializer;
  }
  static unregisterCustomType(type) {
    delete this.customDeserializers[type];
  }
  static deserializeBaseElement(element, json) {
    if (json.id) element.setId(json.id);
    if (json.trackId) element.setTrackId(json.trackId);
    if (json.name) element.setName(json.name);
    if (json.s !== void 0) element.setStart(json.s);
    if (json.e !== void 0) element.setEnd(json.e);
    const props = { ...json.props || {} };
    if (json.zIndex !== void 0) props.zIndex = json.zIndex;
    if (Object.keys(props).length) element.setProps(props);
    if (json.metadata) element.setMetadata(json.metadata);
    if (json.transition) element.setTransition(json.transition);
    if (json.animation) element.setAnimation(ElementAnimation.fromJSON(json.animation));
  }
  static deserializeVideoElement(json) {
    var _a;
    const parentSize = json.frame && json.frame.size ? { width: json.frame.size[0], height: json.frame.size[1] } : { width: 0, height: 0 };
    const videoElement = new VideoElement(((_a = json.props) == null ? void 0 : _a.src) || "", parentSize);
    _ElementDeserializer.deserializeBaseElement(videoElement, json);
    if (json.mediaDuration !== void 0) videoElement.setMediaDuration(json.mediaDuration);
    if (json.objectFit) videoElement.setObjectFit(json.objectFit);
    if (json.frame) videoElement.setFrame(json.frame);
    if (json.frameEffects) videoElement.setFrameEffects(json.frameEffects.map((frameEffect) => ElementFrameEffect.fromJSON(frameEffect)));
    if (json.backgroundColor) videoElement.setBackgroundColor(json.backgroundColor);
    return videoElement;
  }
  static deserializeAudioElement(json) {
    var _a;
    const audioElement = new AudioElement(((_a = json.props) == null ? void 0 : _a.src) || "");
    _ElementDeserializer.deserializeBaseElement(audioElement, json);
    if (json.mediaDuration !== void 0) audioElement.setMediaDuration(json.mediaDuration);
    return audioElement;
  }
  static deserializeImageElement(json) {
    var _a;
    const parentSize = json.frame && json.frame.size ? { width: json.frame.size[0], height: json.frame.size[1] } : { width: 0, height: 0 };
    const imageElement = new ImageElement(((_a = json.props) == null ? void 0 : _a.src) || "", parentSize);
    _ElementDeserializer.deserializeBaseElement(imageElement, json);
    if (json.objectFit) imageElement.setObjectFit(json.objectFit);
    if (json.frame) imageElement.setFrame(json.frame);
    if (json.frameEffects) imageElement.setFrameEffects(json.frameEffects.map((frameEffect) => ElementFrameEffect.fromJSON(frameEffect)));
    if (json.backgroundColor) imageElement.setBackgroundColor(json.backgroundColor);
    return imageElement;
  }
  static deserializeTextElement(json) {
    var _a;
    const textElement = new TextElement(((_a = json.props) == null ? void 0 : _a.text) || "");
    _ElementDeserializer.deserializeBaseElement(textElement, json);
    if (json.textEffect) textElement.setTextEffect(ElementTextEffect.fromJSON(json.textEffect));
    return textElement;
  }
  static deserializeCaptionElement(json) {
    const captionElement = new CaptionElement(
      json.t || "",
      json.s || 0,
      json.e || 0
    );
    _ElementDeserializer.deserializeBaseElement(captionElement, json);
    return captionElement;
  }
  static deserializeIconElement(json) {
    var _a, _b, _c;
    const size = ((_a = json.props) == null ? void 0 : _a.size) ?? { width: 100, height: 100 };
    const iconElement = new IconElement(
      ((_b = json.props) == null ? void 0 : _b.src) || "",
      size,
      (_c = json.props) == null ? void 0 : _c.fill
    );
    _ElementDeserializer.deserializeBaseElement(iconElement, json);
    return iconElement;
  }
  static deserializeCircleElement(json) {
    var _a, _b;
    const circleElement = new CircleElement(
      ((_a = json.props) == null ? void 0 : _a.fill) || "",
      ((_b = json.props) == null ? void 0 : _b.radius) || 0
    );
    _ElementDeserializer.deserializeBaseElement(circleElement, json);
    return circleElement;
  }
  static deserializeRectElement(json) {
    var _a, _b, _c;
    const rectElement = new RectElement(
      ((_a = json.props) == null ? void 0 : _a.fill) || "",
      {
        width: ((_b = json.props) == null ? void 0 : _b.width) || 0,
        height: ((_c = json.props) == null ? void 0 : _c.height) || 0
      }
    );
    _ElementDeserializer.deserializeBaseElement(rectElement, json);
    return rectElement;
  }
  static deserializePlaceholderElement(json) {
    var _a, _b, _c, _d;
    const parentSize = ((_a = json.props) == null ? void 0 : _a.parentSize) ?? (((_b = json.frame) == null ? void 0 : _b.size) ? { width: json.frame.size[0], height: json.frame.size[1] } : { width: 0, height: 0 });
    const placeholderElement = new PlaceholderElement(
      ((_c = json.props) == null ? void 0 : _c.src) ?? "",
      parentSize,
      (_d = json.props) == null ? void 0 : _d.expectedDuration
    );
    _ElementDeserializer.deserializeBaseElement(placeholderElement, json);
    return placeholderElement;
  }
  static deserializeArrowElement(json) {
    var _a, _b, _c;
    const arrowElement = new ArrowElement(((_a = json.props) == null ? void 0 : _a.fill) || "#ffcc00", {
      width: ((_b = json.props) == null ? void 0 : _b.width) || 180,
      height: ((_c = json.props) == null ? void 0 : _c.height) || 30
    });
    _ElementDeserializer.deserializeBaseElement(arrowElement, json);
    return arrowElement;
  }
  static deserializeLineElement(json) {
    var _a, _b, _c;
    const lineElement = new LineElement(((_a = json.props) == null ? void 0 : _a.fill) || "#f97316", {
      width: ((_b = json.props) == null ? void 0 : _b.width) || 200,
      height: ((_c = json.props) == null ? void 0 : _c.height) || 4
    });
    _ElementDeserializer.deserializeBaseElement(lineElement, json);
    return lineElement;
  }
  static deserializeEffectElement(json) {
    var _a;
    const effectKey = ((_a = json.props) == null ? void 0 : _a.effectKey) ?? "";
    const effectElement = new EffectElement(effectKey, json.props);
    _ElementDeserializer.deserializeBaseElement(effectElement, json);
    return effectElement;
  }
  static fromJSON(json) {
    var _a, _b;
    try {
      const customDeserializer = _ElementDeserializer.customDeserializers[json.type];
      if (customDeserializer) {
        return customDeserializer(json);
      }
      switch (json.type) {
        case "video":
          return _ElementDeserializer.deserializeVideoElement(json);
        case "audio":
          return _ElementDeserializer.deserializeAudioElement(json);
        case "image":
          return _ElementDeserializer.deserializeImageElement(json);
        case "text":
          return _ElementDeserializer.deserializeTextElement(json);
        case "caption":
          return _ElementDeserializer.deserializeCaptionElement(json);
        case "icon":
          return _ElementDeserializer.deserializeIconElement(json);
        case "circle":
          return _ElementDeserializer.deserializeCircleElement(json);
        case "rect":
          return _ElementDeserializer.deserializeRectElement(json);
        case "placeholder":
          return _ElementDeserializer.deserializePlaceholderElement(json);
        case "line":
          return _ElementDeserializer.deserializeLineElement(json);
        case "arrow":
          return _ElementDeserializer.deserializeArrowElement(json);
        case "effect":
          return _ElementDeserializer.deserializeEffectElement(json);
        default:
          return _ElementDeserializer.deserializePlaceholderElement({
            ...json,
            type: "placeholder",
            props: {
              ...json.props || {},
              src: ((_a = json.props) == null ? void 0 : _a.src) ?? "",
              parentSize: (_b = json.props) == null ? void 0 : _b.parentSize,
              expectedDuration: json.e - json.s
            }
          });
      }
    } catch (error) {
      console.error("Error deserializing element:", error);
      return null;
    }
  }
};
__publicField(_ElementDeserializer, "customDeserializers", {});
let ElementDeserializer = _ElementDeserializer;
class ElementSerializer {
  serializeElement(element) {
    var _a, _b, _c;
    const props = structuredClone(element.getProps());
    const zIndex = props == null ? void 0 : props.zIndex;
    const transition = (_a = element.getTransition) == null ? void 0 : _a.call(element);
    return {
      id: element.getId(),
      trackId: element.getTrackId(),
      type: element.getType(),
      name: element.getName(),
      s: element.getStart(),
      e: element.getEnd(),
      props,
      metadata: (_b = element.getMetadata) == null ? void 0 : _b.call(element),
      ...zIndex !== void 0 && { zIndex },
      ...transition !== void 0 && { transition },
      animation: (_c = element.getAnimation()) == null ? void 0 : _c.toJSON()
    };
  }
  visitVideoElement(element) {
    var _a;
    return {
      ...this.serializeElement(element),
      frame: structuredClone(element.getFrame()),
      frameEffects: (_a = element.getFrameEffects()) == null ? void 0 : _a.map((frameEffect) => frameEffect.toJSON()),
      backgroundColor: element.getBackgroundColor(),
      objectFit: element.getObjectFit(),
      mediaDuration: element.getMediaDuration()
    };
  }
  visitAudioElement(element) {
    return {
      ...this.serializeElement(element),
      mediaDuration: element.getMediaDuration()
    };
  }
  visitImageElement(element) {
    var _a;
    return {
      ...this.serializeElement(element),
      frame: structuredClone(element.getFrame()),
      frameEffects: (_a = element.getFrameEffects()) == null ? void 0 : _a.map((frameEffect) => frameEffect.toJSON()),
      backgroundColor: element.getBackgroundColor(),
      objectFit: element.getObjectFit()
    };
  }
  visitTextElement(element) {
    var _a;
    return {
      ...this.serializeElement(element),
      textEffect: (_a = element.getTextEffect()) == null ? void 0 : _a.toJSON()
    };
  }
  visitCaptionElement(element) {
    return {
      ...this.serializeElement(element),
      t: structuredClone(element.getText())
    };
  }
  visitIconElement(element) {
    return {
      ...this.serializeElement(element)
    };
  }
  visitCircleElement(element) {
    return {
      ...this.serializeElement(element)
    };
  }
  visitRectElement(element) {
    return {
      ...this.serializeElement(element)
    };
  }
  visitPlaceholderElement(element) {
    return this.serializeElement(element);
  }
  visitLineElement(element) {
    return this.serializeElement(element);
  }
  visitArrowElement(element) {
    return this.serializeElement(element);
  }
  visitEffectElement(element) {
    return this.serializeElement(element);
  }
}
const VALIDATION_ERROR_CODE = {
  ELEMENT_NOT_FOUND: "ELEMENT_NOT_FOUND",
  ELEMENT_NOT_ADDED: "ELEMENT_NOT_ADDED",
  ELEMENT_NOT_UPDATED: "ELEMENT_NOT_UPDATED",
  ELEMENT_NOT_REMOVED: "ELEMENT_NOT_REMOVED",
  COLLISION_ERROR: "COLLISION_ERROR",
  INVALID_TIMING: "INVALID_TIMING"
};
class ValidationError extends Error {
  constructor(message, errors, warnings = []) {
    super(message);
    this.errors = errors;
    this.warnings = warnings;
    this.name = "ValidationError";
  }
}
class ElementValidator {
  validateBasicProperties(element) {
    const errors = [];
    const warnings = [];
    if (!element.getId()) {
      errors.push("Element must have an ID");
    }
    if (!element.getType()) {
      errors.push("Element must have a type");
    }
    if (element.getStart() === void 0 || element.getStart() === null) {
      errors.push("Element must have a start time (s)");
    }
    if (element.getEnd() === void 0 || element.getEnd() === null) {
      errors.push("Element must have an end time (e)");
    }
    if (element.getStart() !== void 0 && element.getEnd() !== void 0) {
      if (element.getStart() < 0) {
        errors.push("Start time cannot be negative");
      }
      if (element.getEnd() <= element.getStart()) {
        errors.push("End time must be greater than start time");
      }
    }
    if (!element.getName()) {
      warnings.push("Element should have a name for better identification");
    }
    if (!element.getTrackId()) {
      warnings.push("Element should have a track Id");
    }
    return { errors, warnings };
  }
  validateTextElement(element) {
    const basicValidation = this.validateBasicProperties(element);
    const errors = [...basicValidation.errors];
    const warnings = [...basicValidation.warnings];
    const props = element.getProps();
    if (!(props == null ? void 0 : props.text)) {
      errors.push("Text element must have text content");
    }
    if ((props == null ? void 0 : props.fontSize) !== void 0 && props.fontSize <= 0) {
      errors.push("Font size must be greater than 0");
    }
    if ((props == null ? void 0 : props.fontWeight) !== void 0 && props.fontWeight < 0) {
      errors.push("Font weight cannot be negative");
    }
    return { errors, warnings };
  }
  validateVideoElement(element) {
    const basicValidation = this.validateBasicProperties(element);
    const errors = [...basicValidation.errors];
    const warnings = [...basicValidation.warnings];
    const props = element.getProps();
    if (!(props == null ? void 0 : props.src)) {
      errors.push("Video element must have a source URL");
    }
    if ((props == null ? void 0 : props.volume) !== void 0 && (props.volume < 0 || props.volume > 3)) {
      errors.push("Volume must be between 0 and 3 (linear; ~+6 dB max)");
    }
    if ((props == null ? void 0 : props.playbackRate) !== void 0 && props.playbackRate <= 0) {
      errors.push("Playback rate must be greater than 0");
    }
    return { errors, warnings };
  }
  validateAudioElement(element) {
    const basicValidation = this.validateBasicProperties(element);
    const errors = [...basicValidation.errors];
    const warnings = [...basicValidation.warnings];
    const props = element.getProps();
    if (!(props == null ? void 0 : props.src)) {
      errors.push("Audio element must have a source URL");
    }
    if ((props == null ? void 0 : props.volume) !== void 0 && (props.volume < 0 || props.volume > 3)) {
      errors.push("Volume must be between 0 and 3 (linear; ~+6 dB max)");
    }
    if ((props == null ? void 0 : props.playbackRate) !== void 0 && props.playbackRate <= 0) {
      errors.push("Playback rate must be greater than 0");
    }
    return { errors, warnings };
  }
  validateImageElement(element) {
    const basicValidation = this.validateBasicProperties(element);
    const errors = [...basicValidation.errors];
    const warnings = [...basicValidation.warnings];
    const props = element.getProps();
    if (!(props == null ? void 0 : props.src)) {
      errors.push("Image element must have a source URL");
    }
    return { errors, warnings };
  }
  validateCaptionElement(element) {
    const basicValidation = this.validateBasicProperties(element);
    const errors = [...basicValidation.errors];
    const warnings = [...basicValidation.warnings];
    const text = element.getText();
    if (!text || text.trim() === "") {
      errors.push("Caption element must have text content");
    }
    return { errors, warnings };
  }
  validateIconElement(element) {
    const basicValidation = this.validateBasicProperties(element);
    const errors = [...basicValidation.errors];
    const warnings = [...basicValidation.warnings];
    return { errors, warnings };
  }
  validateCircleElement(element) {
    const basicValidation = this.validateBasicProperties(element);
    const errors = [...basicValidation.errors];
    const warnings = [...basicValidation.warnings];
    const props = element.getProps();
    if ((props == null ? void 0 : props.radius) !== void 0 && props.radius <= 0) {
      errors.push("Circle radius must be greater than 0");
    }
    return { errors, warnings };
  }
  validateRectElement(element) {
    const basicValidation = this.validateBasicProperties(element);
    const errors = [...basicValidation.errors];
    const warnings = [...basicValidation.warnings];
    const props = element.getProps();
    if ((props == null ? void 0 : props.width) !== void 0 && props.width <= 0) {
      errors.push("Rectangle width must be greater than 0");
    }
    if ((props == null ? void 0 : props.height) !== void 0 && props.height <= 0) {
      errors.push("Rectangle height must be greater than 0");
    }
    return { errors, warnings };
  }
  validateEffectElement(element) {
    const basicValidation = this.validateBasicProperties(element);
    const errors = [...basicValidation.errors];
    const warnings = [...basicValidation.warnings];
    const props = element.getProps();
    if (!(props == null ? void 0 : props.effectKey) || typeof props.effectKey !== "string") {
      errors.push("Effect element must have a valid effectKey");
    }
    if ((props == null ? void 0 : props.intensity) !== void 0) {
      if (props.intensity < 0 || props.intensity > 1) {
        errors.push("Effect intensity must be between 0 and 1");
      }
    }
    return { errors, warnings };
  }
  visitVideoElement(element) {
    const validation = this.validateVideoElement(element);
    if (validation.errors.length > 0) {
      throw new ValidationError(
        `Video element validation failed: ${validation.errors.join(", ")}`,
        validation.errors,
        validation.warnings
      );
    }
    return true;
  }
  visitAudioElement(element) {
    const validation = this.validateAudioElement(element);
    if (validation.errors.length > 0) {
      throw new ValidationError(
        `Audio element validation failed: ${validation.errors.join(", ")}`,
        validation.errors,
        validation.warnings
      );
    }
    return true;
  }
  visitImageElement(element) {
    const validation = this.validateImageElement(element);
    if (validation.errors.length > 0) {
      throw new ValidationError(
        `Image element validation failed: ${validation.errors.join(", ")}`,
        validation.errors,
        validation.warnings
      );
    }
    return true;
  }
  visitTextElement(element) {
    const validation = this.validateTextElement(element);
    if (validation.errors.length > 0) {
      throw new ValidationError(
        `Text element validation failed: ${validation.errors.join(", ")}`,
        validation.errors,
        validation.warnings
      );
    }
    return true;
  }
  visitCaptionElement(element) {
    const validation = this.validateCaptionElement(element);
    if (validation.errors.length > 0) {
      throw new ValidationError(
        `Caption element validation failed: ${validation.errors.join(", ")}`,
        validation.errors,
        validation.warnings
      );
    }
    return true;
  }
  visitIconElement(element) {
    const validation = this.validateIconElement(element);
    if (validation.errors.length > 0) {
      throw new ValidationError(
        `Icon element validation failed: ${validation.errors.join(", ")}`,
        validation.errors,
        validation.warnings
      );
    }
    return true;
  }
  visitCircleElement(element) {
    const validation = this.validateCircleElement(element);
    if (validation.errors.length > 0) {
      throw new ValidationError(
        `Circle element validation failed: ${validation.errors.join(", ")}`,
        validation.errors,
        validation.warnings
      );
    }
    return true;
  }
  visitRectElement(element) {
    const validation = this.validateRectElement(element);
    if (validation.errors.length > 0) {
      throw new ValidationError(
        `Rectangle element validation failed: ${validation.errors.join(", ")}`,
        validation.errors,
        validation.warnings
      );
    }
    return true;
  }
  visitPlaceholderElement(element) {
    const validation = this.validateBasicProperties(element);
    if (validation.errors.length > 0) {
      throw new ValidationError(
        `Placeholder element validation failed: ${validation.errors.join(", ")}`,
        validation.errors,
        validation.warnings
      );
    }
    return true;
  }
  visitArrowElement(element) {
    const validation = this.validateBasicProperties(element);
    if (validation.errors.length > 0) {
      throw new ValidationError(
        `Arrow element validation failed: ${validation.errors.join(", ")}`,
        validation.errors,
        validation.warnings
      );
    }
    return true;
  }
  visitLineElement(element) {
    const validation = this.validateBasicProperties(element);
    if (validation.errors.length > 0) {
      throw new ValidationError(
        `Line element validation failed: ${validation.errors.join(", ")}`,
        validation.errors,
        validation.warnings
      );
    }
    return true;
  }
  visitEffectElement(element) {
    const validation = this.validateEffectElement(element);
    if (validation.errors.length > 0) {
      throw new ValidationError(
        `Effect element validation failed: ${validation.errors.join(", ")}`,
        validation.errors,
        validation.warnings
      );
    }
    return true;
  }
}
class TrackFriend {
  constructor(track) {
    this.track = track;
  }
  /**
   * Add an element to the track with validation
   * @param element The element to add
   * @param skipValidation If true, skips validation (use with caution)
   * @returns true if element was added successfully, throws ValidationError if validation fails
   */
  addElement(element, skipValidation = false) {
    return this.track.addElementViaFriend(element, skipValidation);
  }
  /**
   * Remove an element from the track
   * @param element The element to remove
   */
  removeElement(element) {
    this.track.removeElementViaFriend(element);
  }
  /**
   * Update an element in the track with validation
   * @param element The element to update
   * @returns true if element was updated successfully, throws ValidationError if validation fails
   */
  updateElement(element) {
    return this.track.updateElementViaFriend(element);
  }
  /**
   * Get the track instance (for advanced operations)
   * @returns The track instance
   */
  getTrack() {
    return this.track;
  }
}
class Track {
  /**
   * Creates a new Track instance.
   * 
   * @param name - The display name for the track
   * @param type - The type of the track
   * @param id - Optional unique identifier (auto-generated if not provided)
   * 
   * @example
   * ```js
   * const track = new Track("My Video Track");
   * const trackWithId = new Track("Audio Track", "element", "video-track-1");
   * ```
   */
  constructor(name2, type = TRACK_TYPES.ELEMENT, id) {
    __publicField(this, "id");
    __publicField(this, "name");
    __publicField(this, "type");
    __publicField(this, "language");
    __publicField(this, "props");
    __publicField(this, "elements");
    __publicField(this, "validator");
    this.name = name2;
    this.id = id ?? `t-${generateShortUuid()}`;
    this.type = type;
    this.props = {};
    this.elements = [];
    this.validator = new ElementValidator();
  }
  /**
   * Creates a friend instance for explicit access to protected methods.
   * This implements the Friend Class Pattern to allow controlled access
   * to protected methods while maintaining encapsulation.
   * 
   * @returns TrackFriend instance that can access protected methods
   * 
   * @example
   * ```js
   * const track = new Track("My Track");
   * const friend = track.createFriend();
   * 
   * // Use friend to add elements
   * const element = new VideoElement({ src: "video.mp4", start: 0, end: 10 });
   * friend.addElement(element);
   * ```
   */
  createFriend() {
    return new TrackFriend(this);
  }
  /**
   * Friend method to add element (called by TrackFriend).
   * Provides controlled access to the protected addElement method.
   * 
   * @param element - The element to add to the track
   * @param skipValidation - If true, skips validation (use with caution)
   * @returns true if element was added successfully
   * 
   * @example
   * ```js
   * const track = new Track("My Track");
   * const friend = track.createFriend();
   * const element = new VideoElement({ src: "video.mp4", start: 0, end: 10 });
   * 
   * const success = track.addElementViaFriend(element);
   * // success = true if element was added successfully
   * ```
   */
  addElementViaFriend(element, skipValidation = false) {
    return this.addElement(element, skipValidation);
  }
  /**
   * Friend method to remove element (called by TrackFriend).
   * Provides controlled access to the protected removeElement method.
   * 
   * @param element - The element to remove from the track
   * 
   * @example
   * ```js
   * const track = new Track("My Track");
   * const element = new VideoElement({ src: "video.mp4", start: 0, end: 10 });
   * 
   * track.removeElementViaFriend(element);
   * // Element is removed from the track
   * ```
   */
  removeElementViaFriend(element) {
    this.removeElement(element);
  }
  /**
   * Friend method to update element (called by TrackFriend).
   * Provides controlled access to the protected updateElement method.
   * 
   * @param element - The updated element to replace the existing one
   * @returns true if element was updated successfully
   * 
   * @example
   * ```js
   * const track = new Track("My Track");
   * const element = new VideoElement({ src: "video.mp4", start: 0, end: 10 });
   * 
   * // Update the element
   * element.setEnd(15);
   * const success = track.updateElementViaFriend(element);
   * // success = true if element was updated successfully
   * ```
   */
  updateElementViaFriend(element) {
    return this.updateElement(element);
  }
  /**
   * Gets the unique identifier of the track.
   * 
   * @returns The track's unique ID string
   * 
   * @example
   * ```js
   * const track = new Track("My Track", "element", "track-123");
   * const id = track.getId(); // "track-123"
   * ```
   */
  getId() {
    return this.id;
  }
  /**
   * Gets the display name of the track.
   * 
   * @returns The track's display name
   * 
   * @example
   * ```js
   * const track = new Track("Video Track");
   * const name = track.getName(); // "Video Track"
   * ```
   */
  getName() {
    return this.name;
  }
  setName(name2) {
    this.name = name2;
    return this;
  }
  /**
   * Gets the type of the track.
   * 
   * @returns The track's type string
   * 
   * @example
   * ```js
   * const track = new Track("My Track");
   * const type = track.getType(); // "element"
   * ```
   */
  getType() {
    return this.type;
  }
  setType(type) {
    this.type = type;
    return this;
  }
  getLanguage() {
    return this.language;
  }
  setLanguage(language) {
    this.language = language;
    return this;
  }
  /**
   * Gets a read-only array of all elements in the track.
   * Returns a copy of the elements array to prevent external modification.
   * 
   * @returns Read-only array of track elements
   * 
   * @example
   * ```js
   * const track = new Track("My Track");
   * const elements = track.getElements();
   * // elements is a read-only array of TrackElement instances
   * 
   * elements.forEach(element => {
   *   console.log(`Element: ${element.getId()}, Duration: ${element.getEnd() - element.getStart()}`);
   * });
   * ```
   */
  getElements() {
    return [...this.elements];
  }
  getProps() {
    return this.props;
  }
  setProps(props) {
    this.props = structuredClone(props);
    return this;
  }
  /**
   * Validates a single element using the track's validator.
   * Checks if the element meets all validation requirements.
   * 
   * @param element - The element to validate
   * @returns true if valid, throws ValidationError if invalid
   * 
   * @example
   * ```js
   * const track = new Track("My Track");
   * const element = new VideoElement({ src: "video.mp4", start: 0, end: 10 });
   * 
   * try {
   *   const isValid = track.validateElement(element);
   *   console.log('Element is valid:', isValid);
   * } catch (error) {
   *   if (error instanceof ValidationError) {
   *     console.log('Validation failed:', error.errors);
   *   }
   * }
   * ```
   */
  validateElement(element) {
    return element.accept(this.validator);
  }
  /**
   * Gets the total duration of the track.
   * Calculates the duration based on the end time of the last element.
   * 
   * @returns The total duration of the track in seconds
   * 
   * @example
   * ```js
   * const track = new Track("My Track");
   * const duration = track.getTrackDuration(); // 0 if no elements
   * 
   * // After adding elements
   * const element = new VideoElement({ src: "video.mp4", start: 0, end: 30 });
   * track.createFriend().addElement(element);
   * const newDuration = track.getTrackDuration(); // 30
   * ```
   */
  getTrackDuration() {
    var _a;
    return ((_a = this.elements) == null ? void 0 : _a.length) ? this.elements[this.elements.length - 1].getEnd() : 0;
  }
  /**
   * Adds an element to the track with validation.
   * Protected method that should be accessed through TrackFriend.
   * 
   * @param element - The element to add to the track
   * @param skipValidation - If true, skips validation (use with caution)
   * @returns true if element was added successfully, throws ValidationError if validation fails
   * 
   * @example
   * ```js
   * const track = new Track("My Track");
   * const element = new VideoElement({ src: "video.mp4", start: 0, end: 10 });
   * 
   * // Use friend to access this protected method
   * const friend = track.createFriend();
   * const success = friend.addElement(element);
   * ```
   */
  addElement(element, skipValidation = false) {
    element.setTrackId(this.id);
    if (skipValidation) {
      this.elements.push(element);
      return true;
    }
    try {
      const isValid = this.validateElement(element);
      if (isValid) {
        if (this.isElementColliding(element)) {
          throw new ValidationError("Element is colliding with another element", ["COLLISION_ERROR"]);
        } else {
          this.elements.push(element);
          return true;
        }
      }
    } catch (error) {
      throw error;
    }
    return false;
  }
  isElementColliding(element) {
    return this.elements.some((e2) => e2.getStart() < element.getEnd() && e2.getEnd() > element.getStart());
  }
  /**
   * Removes an element from the track.
   * Protected method that should be accessed through TrackFriend.
   * 
   * @param element - The element to remove from the track
   * 
   * @example
   * ```js
   * const track = new Track("My Track");
   * const element = new VideoElement({ src: "video.mp4", start: 0, end: 10 });
   * 
   * // Use friend to access this protected method
   * const friend = track.createFriend();
   * friend.removeElement(element);
   * ```
   */
  removeElement(element) {
    const index = this.elements.findIndex((e2) => e2.getId() === element.getId());
    if (index !== -1) {
      this.elements.splice(index, 1);
    }
  }
  /**
   * Updates an element in the track with validation.
   * Protected method that should be accessed through TrackFriend.
   * 
   * @param element - The updated element to replace the existing one
   * @returns true if element was updated successfully, throws ValidationError if validation fails
   * 
   * @example
   * ```js
   * const track = new Track("My Track");
   * const element = new VideoElement({ src: "video.mp4", start: 0, end: 10 });
   * 
   * // Use friend to access this protected method
   * const friend = track.createFriend();
   * element.setEnd(15);
   * const success = friend.updateElement(element);
   * ```
   */
  updateElement(element) {
    try {
      const isValid = this.validateElement(element);
      if (isValid) {
        const index = this.elements.findIndex(
          (e2) => e2.getId() === element.getId()
        );
        if (index !== -1) {
          this.elements[index] = element;
          return true;
        }
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw error;
    }
    return false;
  }
  /**
   * Finds an element in the track by its ID.
   * 
   * @param id - The unique identifier of the element to find
   * @returns The found element or undefined if not found
   * 
   * @example
   * ```js
   * const track = new Track("My Track");
   * const element = new VideoElement({ src: "video.mp4", start: 0, end: 10 });
   * track.createFriend().addElement(element);
   * 
   * const foundElement = track.getElementById(element.getId());
   * // foundElement is the same element instance
   * ```
   */
  getElementById(id) {
    const element = this.elements.find((e2) => e2.getId() === id);
    if (!element) return void 0;
    return element;
  }
  /**
   * Validates all elements in the track and returns combined result and per-element status.
   * Provides detailed validation information for each element including errors and warnings.
   * 
   * @returns Object with overall isValid and array of per-element validation results
   * 
   * @example
   * ```js
   * const track = new Track("My Track");
   * const element1 = new VideoElement({ src: "video.mp4", start: 0, end: 10 });
   * const element2 = new TextElement({ text: "Hello", start: 5, end: 15 });
   * 
   * track.createFriend().addElement(element1);
   * track.createFriend().addElement(element2);
   * 
   * const validation = track.validateAllElements();
   * console.log('Overall valid:', validation.isValid);
   * 
   * validation.results.forEach(result => {
   *   console.log(`Element ${result.element.getId()}: ${result.isValid ? 'Valid' : 'Invalid'}`);
   *   if (result.errors) {
   *     console.log('Errors:', result.errors);
   *   }
   *   if (result.warnings) {
   *     console.log('Warnings:', result.warnings);
   *   }
   * });
   * ```
   */
  validateAllElements() {
    let validResult = true;
    const results = this.elements.map((element) => {
      try {
        const isValid = this.validateElement(element);
        if (!isValid) {
          validResult = false;
        }
        return { element, isValid };
      } catch (error) {
        if (error instanceof ValidationError) {
          validResult = false;
          return {
            element,
            isValid: false,
            errors: error.errors,
            warnings: error.warnings
          };
        }
        return {
          element,
          isValid: false,
          errors: [error instanceof Error ? error.message : "Unknown error"]
        };
      }
    });
    return { isValid: validResult, results };
  }
  /**
   * Serializes the track and all its elements to JSON format.
   * Converts the track structure to a format that can be stored or transmitted.
   * 
   * @returns TrackJSON object representing the track and its elements
   * 
   * @example
   * ```js
   * const track = new Track("My Track");
   * const element = new VideoElement({ src: "video.mp4", start: 0, end: 10 });
   * track.createFriend().addElement(element);
   * 
   * const trackData = track.serialize();
   * // trackData = {
   * //   id: "t-abc123",
   * //   name: "My Track",
   * //   type: "element",
   * //   elements: [{ ... }]
   * // }
   * 
   * // Save to localStorage
   * localStorage.setItem('track-data', JSON.stringify(trackData));
   * ```
   */
  serialize() {
    const serializer = new ElementSerializer();
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      language: this.language,
      props: this.props,
      elements: this.elements.map(
        (element) => element.accept(serializer)
      )
    };
  }
  /**
   * Creates a Track instance from JSON data.
   * Static factory method for deserializing track data.
   * 
   * @param json - JSON object containing track data
   * @returns New Track instance with loaded data
   * 
   * @example
   * ```js
   * const trackData = {
   *   id: "t-abc123",
   *   name: "My Track",
   *   type: "element",
   *   elements: [
   *     {
   *       id: "e-def456",
   *       type: "video",
   *       src: "video.mp4",
   *       start: 0,
   *       end: 10
   *     }
   *   ]
   * };
   * 
   * const track = Track.fromJSON(trackData);
   * console.log(track.getName()); // "My Track"
   * console.log(track.getElements().length); // 1
   * ```
   */
  static fromJSON(json) {
    if (!json || typeof json !== "object") {
      throw new Error("Invalid JSON data for Track deserialization");
    }
    const track = new Track(json.name || "", json.type ?? TRACK_TYPES.ELEMENT, json.id);
    track.type = json.type;
    track.language = json.language;
    track.props = json.props || {};
    track.elements = (json.elements || []).map(ElementDeserializer.fromJSON).filter((element) => element !== null);
    return track;
  }
}
const _TimelineContextStore = class _TimelineContextStore {
  constructor() {
    __publicField(this, "storeMap");
    this.storeMap = /* @__PURE__ */ new Map();
  }
  static getInstance() {
    if (!_TimelineContextStore.instance) {
      _TimelineContextStore.instance = new _TimelineContextStore();
    }
    return _TimelineContextStore.instance;
  }
  initializeContext(contextId) {
    if (!this.storeMap.has(contextId)) {
      this.storeMap.set(contextId, {
        tracks: [],
        version: 0,
        elementMap: {},
        trackMap: {},
        captionProps: {}
      });
    }
  }
  getTimelineData(contextId) {
    const timelineStore = this.storeMap.get(contextId);
    return timelineStore ? {
      tracks: timelineStore.tracks,
      version: timelineStore.version,
      backgroundColor: timelineStore.backgroundColor,
      metadata: timelineStore.metadata
    } : null;
  }
  setTimelineData(contextId, timelineData) {
    this.ensureContext(contextId);
    const store = this.storeMap.get(contextId);
    store.tracks = timelineData.tracks;
    store.version = timelineData.version;
    if (timelineData.backgroundColor !== void 0) {
      store.backgroundColor = timelineData.backgroundColor;
    }
    if (timelineData.metadata !== void 0) {
      store.metadata = timelineData.metadata;
    }
    return timelineData;
  }
  getElementMap(contextId) {
    this.ensureContext(contextId);
    return this.storeMap.get(contextId).elementMap;
  }
  setElementMap(contextId, elementMap) {
    this.ensureContext(contextId);
    this.storeMap.get(contextId).elementMap = elementMap;
  }
  getTrackMap(contextId) {
    this.ensureContext(contextId);
    return this.storeMap.get(contextId).trackMap;
  }
  setTrackMap(contextId, trackMap) {
    this.ensureContext(contextId);
    this.storeMap.get(contextId).trackMap = trackMap;
  }
  getCaptionProps(contextId) {
    this.ensureContext(contextId);
    return this.storeMap.get(contextId).captionProps;
  }
  setCaptionProps(contextId, captionProps) {
    this.ensureContext(contextId);
    this.storeMap.get(contextId).captionProps = captionProps;
  }
  clearContext(contextId) {
    this.storeMap.delete(contextId);
  }
  ensureContext(contextId) {
    if (!this.storeMap.has(contextId)) {
      this.initializeContext(contextId);
    }
  }
};
__publicField(_TimelineContextStore, "instance");
let TimelineContextStore = _TimelineContextStore;
const timelineContextStore = TimelineContextStore.getInstance();
class ElementAdder {
  /**
   * Creates a new ElementAdder instance for the specified track.
   *
   * @param track - The track to add elements to
   * 
   * @example
   * ```js
   * const adder = new ElementAdder(track);
   * const success = await adder.visitVideoElement(videoElement);
   * ```
   */
  constructor(track) {
    __publicField(this, "track");
    __publicField(this, "trackFriend");
    this.track = track;
    this.trackFriend = track.createFriend();
  }
  /**
   * Adds a video element to the track.
   * Updates video metadata and calculates appropriate start/end times
   * based on existing track elements.
   *
   * @param element - The video element to add
   * @returns Promise resolving to true if element was added successfully
   * 
   * @example
   * ```js
   * const success = await adder.visitVideoElement(videoElement);
   * // success = true if element was added successfully
   * ```
   */
  async visitVideoElement(element) {
    await element.updateVideoMeta();
    const elements = this.track.getElements();
    const lastEndtime = (elements == null ? void 0 : elements.length) ? elements[elements.length - 1].getEnd() : 0;
    if (isNaN(element.getStart())) {
      element.setStart(lastEndtime);
    }
    if (isNaN(element.getEnd())) {
      element.setEnd(element.getStart() + element.getMediaDuration());
    }
    return this.trackFriend.addElement(element);
  }
  /**
   * Adds an audio element to the track.
   * Updates audio metadata and calculates appropriate start/end times
   * based on existing track elements.
   *
   * @param element - The audio element to add
   * @returns Promise resolving to true if element was added successfully
   * 
   * @example
   * ```js
   * const success = await adder.visitAudioElement(audioElement);
   * // success = true if element was added successfully
   * ```
   */
  async visitAudioElement(element) {
    await element.updateAudioMeta();
    const elements = this.track.getElements();
    const lastEndtime = (elements == null ? void 0 : elements.length) ? elements[elements.length - 1].getEnd() : 0;
    if (isNaN(element.getStart())) {
      element.setStart(lastEndtime);
    }
    if (isNaN(element.getEnd())) {
      element.setEnd(element.getStart() + element.getMediaDuration());
    }
    return this.trackFriend.addElement(element);
  }
  /**
   * Adds an image element to the track.
   * Updates image metadata and calculates appropriate start/end times
   * based on existing track elements.
   *
   * @param element - The image element to add
   * @returns Promise resolving to true if element was added successfully
   * 
   * @example
   * ```js
   * const success = await adder.visitImageElement(imageElement);
   * // success = true if element was added successfully
   * ```
   */
  async visitImageElement(element) {
    await element.updateImageMeta();
    const elements = this.track.getElements();
    const lastEndtime = (elements == null ? void 0 : elements.length) ? elements[elements.length - 1].getEnd() : 0;
    if (isNaN(element.getStart())) {
      element.setStart(lastEndtime);
    }
    if (isNaN(element.getEnd())) {
      element.setEnd(element.getStart() + 1);
    }
    return this.trackFriend.addElement(element);
  }
  /**
   * Adds a text element to the track.
   * Calculates appropriate start/end times based on existing track elements.
   *
   * @param element - The text element to add
   * @returns Promise resolving to true if element was added successfully
   * 
   * @example
   * ```js
   * const success = await adder.visitTextElement(textElement);
   * // success = true if element was added successfully
   * ```
   */
  async visitTextElement(element) {
    const elements = this.track.getElements();
    const lastEndtime = (elements == null ? void 0 : elements.length) ? elements[elements.length - 1].getEnd() : 0;
    if (isNaN(element.getStart())) {
      element.setStart(lastEndtime);
    }
    if (isNaN(element.getEnd())) {
      element.setEnd(element.getStart() + 1);
    }
    return this.trackFriend.addElement(element);
  }
  /**
   * Adds a caption element to the track.
   * Calculates appropriate start/end times based on existing track elements.
   *
   * @param element - The caption element to add
   * @returns Promise resolving to true if element was added successfully
   * 
   * @example
   * ```js
   * const success = await adder.visitCaptionElement(captionElement);
   * // success = true if element was added successfully
   * ```
   */
  async visitCaptionElement(element) {
    const elements = this.track.getElements();
    const lastEndtime = (elements == null ? void 0 : elements.length) ? elements[elements.length - 1].getEnd() : 0;
    if (isNaN(element.getStart())) {
      element.setStart(lastEndtime);
    }
    if (isNaN(element.getEnd())) {
      element.setEnd(element.getStart() + 1);
    }
    return this.trackFriend.addElement(element);
  }
  /**
   * Adds an icon element to the track.
   * Calculates appropriate start/end times based on existing track elements.
   *
   * @param element - The icon element to add
   * @returns Promise resolving to true if element was added successfully
   * 
   * @example
   * ```js
   * const success = await adder.visitIconElement(iconElement);
   * // success = true if element was added successfully
   * ```
   */
  async visitIconElement(element) {
    const elements = this.track.getElements();
    const lastEndtime = (elements == null ? void 0 : elements.length) ? elements[elements.length - 1].getEnd() : 0;
    if (isNaN(element.getStart())) {
      element.setStart(lastEndtime);
    }
    if (isNaN(element.getEnd())) {
      element.setEnd(element.getStart() + 1);
    }
    return this.trackFriend.addElement(element);
  }
  /**
   * Adds a circle element to the track.
   * Calculates appropriate start/end times based on existing track elements.
   *
   * @param element - The circle element to add
   * @returns Promise resolving to true if element was added successfully
   * 
   * @example
   * ```js
   * const success = await adder.visitCircleElement(circleElement);
   * // success = true if element was added successfully
   * ```
   */
  async visitCircleElement(element) {
    const elements = this.track.getElements();
    const lastEndtime = (elements == null ? void 0 : elements.length) ? elements[elements.length - 1].getEnd() : 0;
    if (isNaN(element.getStart())) {
      element.setStart(lastEndtime);
    }
    if (isNaN(element.getEnd())) {
      element.setEnd(element.getStart() + 1);
    }
    return this.trackFriend.addElement(element);
  }
  /**
   * Adds a rectangle element to the track.
   * Calculates appropriate start/end times based on existing track elements.
   *
   * @param element - The rectangle element to add
   * @returns Promise resolving to true if element was added successfully
   * 
   * @example
   * ```js
   * const success = await adder.visitRectElement(rectElement);
   * // success = true if element was added successfully
   * ```
   */
  async visitRectElement(element) {
    const elements = this.track.getElements();
    const lastEndtime = (elements == null ? void 0 : elements.length) ? elements[elements.length - 1].getEnd() : 0;
    if (isNaN(element.getStart())) {
      element.setStart(lastEndtime);
    }
    if (isNaN(element.getEnd())) {
      element.setEnd(element.getStart() + 1);
    }
    return this.trackFriend.addElement(element);
  }
  async visitPlaceholderElement(element) {
    const elements = this.track.getElements();
    const lastEndtime = (elements == null ? void 0 : elements.length) ? elements[elements.length - 1].getEnd() : 0;
    if (isNaN(element.getStart())) {
      element.setStart(lastEndtime);
    }
    if (isNaN(element.getEnd())) {
      const duration = element.getExpectedDuration();
      element.setEnd(element.getStart() + (duration ?? 1));
    }
    return this.trackFriend.addElement(element);
  }
  /**
   * Adds a line element to the track.
   * Uses the same default duration semantics as other simple shapes.
   */
  async visitLineElement(element) {
    const elements = this.track.getElements();
    const lastEndtime = (elements == null ? void 0 : elements.length) ? elements[elements.length - 1].getEnd() : 0;
    if (isNaN(element.getStart())) {
      element.setStart(lastEndtime);
    }
    if (isNaN(element.getEnd())) {
      element.setEnd(element.getStart() + 1);
    }
    return this.trackFriend.addElement(element);
  }
  async visitArrowElement(element) {
    const elements = this.track.getElements();
    const lastEndtime = (elements == null ? void 0 : elements.length) ? elements[elements.length - 1].getEnd() : 0;
    if (isNaN(element.getStart())) {
      element.setStart(lastEndtime);
    }
    if (isNaN(element.getEnd())) {
      element.setEnd(element.getStart() + 1);
    }
    return this.trackFriend.addElement(element);
  }
  /**
   * Adds an effect element to the track.
   * For now, uses the same default duration semantics as other simple elements.
   */
  async visitEffectElement(element) {
    const elements = this.track.getElements();
    const lastEndtime = (elements == null ? void 0 : elements.length) ? elements[elements.length - 1].getEnd() : 0;
    if (isNaN(element.getStart())) {
      element.setStart(lastEndtime);
    }
    if (isNaN(element.getEnd())) {
      element.setEnd(element.getStart() + 1);
    }
    return this.trackFriend.addElement(element);
  }
}
class ElementRemover {
  constructor(track) {
    __publicField(this, "trackFriend");
    this.trackFriend = track.createFriend();
  }
  visitVideoElement(element) {
    this.trackFriend.removeElement(element);
    return true;
  }
  visitAudioElement(element) {
    this.trackFriend.removeElement(element);
    return true;
  }
  visitImageElement(element) {
    this.trackFriend.removeElement(element);
    return true;
  }
  visitTextElement(element) {
    this.trackFriend.removeElement(element);
    return true;
  }
  visitCaptionElement(element) {
    this.trackFriend.removeElement(element);
    return true;
  }
  visitIconElement(element) {
    this.trackFriend.removeElement(element);
    return true;
  }
  visitCircleElement(element) {
    this.trackFriend.removeElement(element);
    return true;
  }
  visitRectElement(element) {
    this.trackFriend.removeElement(element);
    return true;
  }
  visitPlaceholderElement(element) {
    this.trackFriend.removeElement(element);
    return true;
  }
  visitArrowElement(element) {
    this.trackFriend.removeElement(element);
    return true;
  }
  visitLineElement(element) {
    this.trackFriend.removeElement(element);
    return true;
  }
  visitEffectElement(element) {
    this.trackFriend.removeElement(element);
    return true;
  }
}
class ElementUpdater {
  constructor(track) {
    __publicField(this, "trackFriend");
    this.trackFriend = track.createFriend();
  }
  visitVideoElement(element) {
    return this.trackFriend.updateElement(element);
  }
  visitAudioElement(element) {
    return this.trackFriend.updateElement(element);
  }
  visitImageElement(element) {
    return this.trackFriend.updateElement(element);
  }
  visitTextElement(element) {
    return this.trackFriend.updateElement(element);
  }
  visitCaptionElement(element) {
    return this.trackFriend.updateElement(element);
  }
  visitIconElement(element) {
    return this.trackFriend.updateElement(element);
  }
  visitCircleElement(element) {
    return this.trackFriend.updateElement(element);
  }
  visitRectElement(element) {
    return this.trackFriend.updateElement(element);
  }
  visitPlaceholderElement(element) {
    return this.trackFriend.updateElement(element);
  }
  visitArrowElement(element) {
    return this.trackFriend.updateElement(element);
  }
  visitLineElement(element) {
    return this.trackFriend.updateElement(element);
  }
  visitEffectElement(element) {
    return this.trackFriend.updateElement(element);
  }
}
class ElementCloner {
  cloneElementProperties(srcElement, destElement) {
    var _a;
    return destElement.setName(srcElement.getName()).setType(srcElement.getType()).setStart(srcElement.getStart()).setEnd(srcElement.getEnd()).setProps(srcElement.getProps()).setMetadata((_a = srcElement.getMetadata) == null ? void 0 : _a.call(srcElement)).setAnimation(srcElement.getAnimation());
  }
  visitVideoElement(element) {
    const props = element.getProps();
    const clonedElement = new VideoElement(props.src, element.getParentSize());
    this.cloneElementProperties(element, clonedElement);
    clonedElement.setParentSize(element.getParentSize()).setMediaDuration(element.getMediaDuration()).setFrame(element.getFrame()).setFrameEffects(element.getFrameEffects() ?? []).setBackgroundColor(element.getBackgroundColor()).setObjectFit(element.getObjectFit());
    return clonedElement;
  }
  visitAudioElement(element) {
    const clonedElement = new AudioElement(element.getProps().src);
    this.cloneElementProperties(element, clonedElement);
    clonedElement.setMediaDuration(element.getMediaDuration());
    return clonedElement;
  }
  visitImageElement(element) {
    const clonedElement = new ImageElement(
      element.getProps().src,
      element.getParentSize()
    );
    this.cloneElementProperties(element, clonedElement);
    clonedElement.setParentSize(element.getParentSize()).setFrame(element.getFrame()).setFrameEffects(element.getFrameEffects()).setBackgroundColor(element.getBackgroundColor()).setObjectFit(element.getObjectFit());
    return clonedElement;
  }
  visitTextElement(element) {
    const clonedElement = new TextElement(element.getProps().text);
    this.cloneElementProperties(element, clonedElement);
    clonedElement.setTextEffect(element.getTextEffect());
    return clonedElement;
  }
  visitCaptionElement(element) {
    const clonedElement = new CaptionElement(
      element.getProps().text,
      element.getStart(),
      element.getEnd()
    );
    this.cloneElementProperties(element, clonedElement);
    return clonedElement;
  }
  visitRectElement(element) {
    const clonedElement = new RectElement(
      element.getProps().fill,
      element.getProps().size
    );
    this.cloneElementProperties(element, clonedElement);
    return clonedElement;
  }
  visitCircleElement(element) {
    const clonedElement = new CircleElement(
      element.getProps().fill,
      element.getProps().radius
    );
    this.cloneElementProperties(element, clonedElement);
    return clonedElement;
  }
  visitIconElement(element) {
    const clonedElement = new IconElement(
      element.getProps().src,
      element.getProps().size,
      element.getProps().fill
    );
    this.cloneElementProperties(element, clonedElement);
    return clonedElement;
  }
  visitPlaceholderElement(element) {
    const clonedElement = new PlaceholderElement(
      element.getSrc(),
      element.getParentSize(),
      element.getExpectedDuration()
    );
    this.cloneElementProperties(element, clonedElement);
    return clonedElement;
  }
  visitArrowElement(element) {
    const clonedElement = new ArrowElement(
      element.getProps().fill,
      { width: element.getProps().width, height: element.getProps().height }
    );
    this.cloneElementProperties(element, clonedElement);
    return clonedElement;
  }
  visitLineElement(element) {
    const clonedElement = new LineElement(
      element.getProps().fill,
      { width: element.getProps().width, height: element.getProps().height }
    );
    this.cloneElementProperties(element, clonedElement);
    return clonedElement;
  }
  visitEffectElement(element) {
    const clonedElement = new EffectElement(element.getEffectKey(), element.getProps());
    this.cloneElementProperties(element, clonedElement);
    return clonedElement;
  }
}
class ElementSplitter {
  constructor(splitTime) {
    __publicField(this, "splitTime");
    __publicField(this, "elementCloner");
    this.splitTime = splitTime;
    this.elementCloner = new ElementCloner();
  }
  visitVideoElement(element) {
    if (!canSplitElement(element, this.splitTime)) {
      return { firstElement: null, secondElement: null, success: false };
    }
    const firstElement = this.elementCloner.visitVideoElement(
      element
    );
    const secondElement = this.elementCloner.visitVideoElement(
      element
    );
    const props = element.getProps();
    const secondStartAt = (props.time ?? 0) + (this.splitTime - element.getStart()) * (props.playbackRate ?? 1);
    firstElement.setEnd(this.splitTime);
    secondElement.setStart(this.splitTime).setStartAt(secondStartAt);
    return { firstElement, secondElement, success: true };
  }
  visitAudioElement(element) {
    if (!canSplitElement(element, this.splitTime)) {
      return { firstElement: null, secondElement: null, success: false };
    }
    const firstElement = this.elementCloner.visitAudioElement(
      element
    );
    const secondElement = this.elementCloner.visitAudioElement(
      element
    );
    const props = element.getProps();
    const secondStartAt = (props.time ?? 0) + (this.splitTime - element.getStart()) * (props.playbackRate ?? 1);
    firstElement.setEnd(this.splitTime);
    secondElement.setStart(this.splitTime).setStartAt(secondStartAt);
    return { firstElement, secondElement, success: true };
  }
  visitImageElement(element) {
    if (!canSplitElement(element, this.splitTime)) {
      return { firstElement: null, secondElement: null, success: false };
    }
    const firstElement = this.elementCloner.visitImageElement(
      element
    );
    const secondElement = this.elementCloner.visitImageElement(
      element
    );
    firstElement.setEnd(this.splitTime);
    secondElement.setStart(this.splitTime);
    return { firstElement, secondElement, success: true };
  }
  visitTextElement(element) {
    if (!canSplitElement(element, this.splitTime)) {
      return { firstElement: null, secondElement: null, success: false };
    }
    const originalText = element.getText() || "";
    const originalTextArray = originalText.split(" ");
    const percentage = (this.splitTime - element.getStart()) / element.getDuration();
    const firstElement = this.elementCloner.visitTextElement(
      element
    );
    firstElement.setText(
      originalTextArray.slice(0, Math.floor(originalTextArray.length * percentage)).join(" ")
    );
    firstElement.setEnd(this.splitTime);
    const secondElement = this.elementCloner.visitTextElement(
      element
    );
    secondElement.setText(
      originalTextArray.slice(
        Math.floor(originalTextArray.length * percentage),
        originalTextArray.length
      ).join(" ")
    );
    secondElement.setStart(this.splitTime);
    return { firstElement, secondElement, success: true };
  }
  visitCaptionElement(element) {
    if (!canSplitElement(element, this.splitTime)) {
      return { firstElement: null, secondElement: null, success: false };
    }
    const originalText = element.getText() || "";
    const originalTextArray = originalText.split(" ");
    const percentage = (this.splitTime - element.getStart()) / element.getDuration();
    const firstElement = this.elementCloner.visitCaptionElement(
      element
    );
    firstElement.setText(
      originalTextArray.slice(0, Math.floor(originalTextArray.length * percentage)).join(" ")
    );
    firstElement.setEnd(this.splitTime);
    const secondElement = this.elementCloner.visitCaptionElement(
      element
    );
    secondElement.setText(
      originalTextArray.slice(
        Math.floor(originalTextArray.length * percentage),
        originalTextArray.length
      ).join(" ")
    );
    secondElement.setStart(this.splitTime);
    return { firstElement, secondElement, success: true };
  }
  visitRectElement(element) {
    if (!canSplitElement(element, this.splitTime)) {
      return { firstElement: null, secondElement: null, success: false };
    }
    const firstElement = this.elementCloner.visitRectElement(
      element
    );
    const secondElement = this.elementCloner.visitRectElement(
      element
    );
    firstElement.setEnd(this.splitTime);
    secondElement.setStart(this.splitTime);
    return { firstElement, secondElement, success: true };
  }
  visitCircleElement(element) {
    if (!canSplitElement(element, this.splitTime)) {
      return { firstElement: null, secondElement: null, success: false };
    }
    const firstElement = this.elementCloner.visitCircleElement(element);
    const secondElement = this.elementCloner.visitCircleElement(element);
    firstElement.setEnd(this.splitTime);
    secondElement.setStart(this.splitTime);
    return { firstElement, secondElement, success: true };
  }
  visitIconElement(element) {
    if (!canSplitElement(element, this.splitTime)) {
      return { firstElement: null, secondElement: null, success: false };
    }
    const firstElement = this.elementCloner.visitIconElement(element);
    const secondElement = this.elementCloner.visitIconElement(element);
    firstElement.setEnd(this.splitTime);
    secondElement.setStart(this.splitTime);
    return { firstElement, secondElement, success: true };
  }
  visitPlaceholderElement(element) {
    if (!canSplitElement(element, this.splitTime)) {
      return { firstElement: null, secondElement: null, success: false };
    }
    const firstElement = this.elementCloner.visitPlaceholderElement(element);
    const secondElement = this.elementCloner.visitPlaceholderElement(element);
    firstElement.setEnd(this.splitTime);
    secondElement.setStart(this.splitTime);
    return { firstElement, secondElement, success: true };
  }
  visitArrowElement(element) {
    if (!canSplitElement(element, this.splitTime)) {
      return { firstElement: null, secondElement: null, success: false };
    }
    const firstElement = this.elementCloner.visitArrowElement(element);
    const secondElement = this.elementCloner.visitArrowElement(element);
    firstElement.setEnd(this.splitTime);
    secondElement.setStart(this.splitTime);
    return { firstElement, secondElement, success: true };
  }
  visitLineElement(element) {
    if (!canSplitElement(element, this.splitTime)) {
      return { firstElement: null, secondElement: null, success: false };
    }
    const firstElement = this.elementCloner.visitLineElement(element);
    const secondElement = this.elementCloner.visitLineElement(element);
    firstElement.setEnd(this.splitTime);
    secondElement.setStart(this.splitTime);
    return { firstElement, secondElement, success: true };
  }
  visitEffectElement(element) {
    if (!canSplitElement(element, this.splitTime)) {
      return { firstElement: null, secondElement: null, success: false };
    }
    const firstElement = this.elementCloner.visitEffectElement(
      element
    );
    const secondElement = this.elementCloner.visitEffectElement(
      element
    );
    firstElement.setEnd(this.splitTime);
    secondElement.setStart(this.splitTime);
    return { firstElement, secondElement, success: true };
  }
}
class TimelineEditor {
  constructor(context) {
    __publicField(this, "context");
    __publicField(this, "totalDuration", 0);
    __publicField(this, "eventListeners", /* @__PURE__ */ new Map());
    this.context = context;
    timelineContextStore.initializeContext(this.context.contextId);
  }
  registerElementType(type, deserializer) {
    ElementDeserializer.registerCustomType(type, deserializer);
  }
  unregisterElementType(type) {
    ElementDeserializer.unregisterCustomType(type);
  }
  /**
   * Subscribe to timeline mutation events.
   */
  on(event, handler) {
    let set = this.eventListeners.get(event);
    if (!set) {
      set = /* @__PURE__ */ new Set();
      this.eventListeners.set(event, set);
    }
    set.add(handler);
  }
  /**
   * Unsubscribe from timeline mutation events.
   */
  off(event, handler) {
    var _a;
    (_a = this.eventListeners.get(event)) == null ? void 0 : _a.delete(handler);
  }
  emit(event, payload) {
    var _a;
    (_a = this.eventListeners.get(event)) == null ? void 0 : _a.forEach((h2) => h2(payload));
  }
  getContext() {
    return this.context;
  }
  pauseVideo() {
    var _a;
    if ((_a = this.context) == null ? void 0 : _a.setTimelineAction) {
      this.context.setTimelineAction(
        TIMELINE_ACTION.SET_PLAYER_STATE,
        PLAYER_STATE.PAUSED
      );
    }
  }
  getTimelineData() {
    const contextId = this.context.contextId;
    return timelineContextStore.getTimelineData(contextId);
  }
  getLatestVersion() {
    const contextId = this.context.contextId;
    const timelineData = timelineContextStore.getTimelineData(contextId);
    return (timelineData == null ? void 0 : timelineData.version) || 0;
  }
  setTimelineData({
    tracks,
    version: version2,
    watermark,
    backgroundColor,
    metadata,
    updatePlayerData,
    forceUpdate
  }) {
    var _a, _b, _c;
    const prevTimelineData = this.getTimelineData();
    const updatedVersion = version2 ?? ((prevTimelineData == null ? void 0 : prevTimelineData.version) || 0) + 1;
    const resolvedBackgroundColor = backgroundColor !== void 0 ? backgroundColor : prevTimelineData == null ? void 0 : prevTimelineData.backgroundColor;
    const resolvedMetadata = metadata !== void 0 ? metadata : prevTimelineData == null ? void 0 : prevTimelineData.metadata;
    const updatedTimelineData = {
      tracks,
      version: updatedVersion,
      watermark,
      backgroundColor: resolvedBackgroundColor,
      metadata: resolvedMetadata
    };
    timelineContextStore.setTimelineData(
      this.context.contextId,
      updatedTimelineData
    );
    this.updateHistory(updatedTimelineData);
    this.context.updateChangeLog();
    if (updatePlayerData) {
      const serializedTracks = tracks.map((t2) => t2.serialize());
      (_c = (_a = this.context) == null ? void 0 : _a.setTimelineAction) == null ? void 0 : _c.call(_a, TIMELINE_ACTION.UPDATE_PLAYER_DATA, {
        tracks: serializedTracks,
        version: updatedVersion,
        forceUpdate: forceUpdate ?? false,
        watermark: watermark != null ? (_b = watermark.toJSON) == null ? void 0 : _b.call(watermark) : void 0,
        backgroundColor: resolvedBackgroundColor,
        metadata: resolvedMetadata
      });
    }
    return updatedTimelineData;
  }
  addTrack(name2, type = TRACK_TYPES.ELEMENT) {
    const prevTimelineData = this.getTimelineData();
    const id = `t-${generateShortUuid()}`;
    const track = new Track(name2, type, id);
    const updatedTimelines = [...(prevTimelineData == null ? void 0 : prevTimelineData.tracks) || [], track];
    this.setTimelineData({ tracks: updatedTimelines, updatePlayerData: true });
    this.emit("track:added", { track: track.serialize(), index: updatedTimelines.length - 1 });
    return track;
  }
  getTrackById(id) {
    const prevTimelineData = this.getTimelineData();
    const track = prevTimelineData == null ? void 0 : prevTimelineData.tracks.find((t2) => t2.getId() === id);
    return track;
  }
  getTrackByName(name2) {
    const prevTimelineData = this.getTimelineData();
    const track = prevTimelineData == null ? void 0 : prevTimelineData.tracks.find((t2) => t2.getName() === name2);
    return track;
  }
  getCaptionsTrack() {
    const prevTimelineData = this.getTimelineData();
    const track = prevTimelineData == null ? void 0 : prevTimelineData.tracks.find((t2) => t2.getType() === TRACK_TYPES.CAPTION);
    return track;
  }
  getTracksByType(type) {
    const prevTimelineData = this.getTimelineData();
    return (prevTimelineData == null ? void 0 : prevTimelineData.tracks.filter((track) => track.getType() === type)) ?? [];
  }
  getTracksByPredicate(predicate) {
    const prevTimelineData = this.getTimelineData();
    return (prevTimelineData == null ? void 0 : prevTimelineData.tracks.filter((track, index) => predicate(track, index))) ?? [];
  }
  updateTrackProps(trackId, propsPatch) {
    const track = this.getTrackById(trackId);
    if (!track) {
      return null;
    }
    const currentProps = track.getProps() ?? {};
    track.setProps({
      ...currentProps,
      ...propsPatch
    });
    this.refresh();
    return track;
  }
  replaceTrackProps(trackId, nextProps) {
    const track = this.getTrackById(trackId);
    if (!track) {
      return null;
    }
    track.setProps(nextProps);
    this.refresh();
    return track;
  }
  upsertTrack(input) {
    if (input.id) {
      const existing = this.getTrackById(input.id);
      if (existing) {
        if (input.name) {
          existing.setName(input.name);
        }
        if (input.type) {
          existing.setType(input.type);
        }
        if (input.language !== void 0) {
          existing.setLanguage(input.language);
        }
        if (input.props !== void 0) {
          existing.setProps(input.props);
        }
        this.refresh();
        return existing;
      }
    }
    const created = this.addTrack(input.name, input.type ?? TRACK_TYPES.ELEMENT);
    if (input.language !== void 0) {
      created.setLanguage(input.language);
    }
    if (input.props !== void 0) {
      created.setProps(input.props);
    }
    this.refresh();
    return created;
  }
  validateTrackOverlaps(trackId) {
    const track = this.getTrackById(trackId);
    if (!track) {
      return {
        valid: true,
        issues: []
      };
    }
    const elements = [...track.getElements()].sort(
      (a2, b2) => a2.getStart() - b2.getStart()
    );
    const issues = [];
    for (let index = 0; index < elements.length - 1; index += 1) {
      const current = elements[index];
      const next = elements[index + 1];
      if (current.getEnd() > next.getStart()) {
        issues.push({
          elementId: current.getId(),
          overlapsWithElementId: next.getId(),
          trackId
        });
      }
    }
    return {
      valid: issues.length === 0,
      issues
    };
  }
  removeTrackById(id) {
    var _a;
    const tracks = ((_a = this.getTimelineData()) == null ? void 0 : _a.tracks) || [];
    const updatedTracks = tracks.filter((t2) => t2.getId() !== id);
    this.setTimelineData({ tracks: updatedTracks, updatePlayerData: true });
    this.emit("track:removed", { trackId: id });
  }
  removeTrack(track) {
    var _a;
    const tracks = ((_a = this.getTimelineData()) == null ? void 0 : _a.tracks) || [];
    const updatedTracks = tracks.filter((t2) => t2.getId() !== track.getId());
    this.setTimelineData({ tracks: updatedTracks, updatePlayerData: true });
    this.emit("track:removed", { trackId: track.getId() });
  }
  /**
   * Refresh the timeline data
   */
  refresh() {
    const currentData = this.getTimelineData();
    if (currentData) {
      this.setTimelineData({ tracks: currentData.tracks, updatePlayerData: true, forceUpdate: true });
    }
  }
  /**
   * Add an element to a specific track using the visitor pattern.
   * @param track The track to add the element to.
   * @param element The element to add.
   * @returns A promise that resolves to `true` if the element was added successfully, otherwise `false`.
   */
  async addElementToTrack(track, element) {
    var _a;
    if (!track) {
      throw new Error("TRACK_NOT_FOUND");
    }
    try {
      const elementAdder = new ElementAdder(track);
      const result = await element.accept(elementAdder);
      if (result) {
        const currentData = this.getTimelineData();
        if (currentData) {
          this.setTimelineData({ tracks: currentData.tracks, updatePlayerData: true });
        }
        this.emit("element:added", { element, trackId: track.getId() });
        return true;
      } else {
        return false;
      }
    } catch (error) {
      if (error instanceof ValidationError && ((_a = error.errors) == null ? void 0 : _a.length) > 0) {
        throw error;
      } else {
        throw new Error("ELEMENT_NOT_ADDED");
      }
    }
  }
  /**
   * Remove an element from a specific track using the visitor pattern.
   * @param element The element to remove.
   * @returns `true` if the element was removed successfully, otherwise `false`.
   */
  removeElement(element) {
    const track = this.getTrackById(element.getTrackId());
    if (!track) {
      return false;
    }
    try {
      const elementRemover = new ElementRemover(track);
      const result = element.accept(elementRemover);
      if (result) {
        const currentData = this.getTimelineData();
        if (currentData) {
          this.setTimelineData({ tracks: currentData.tracks, updatePlayerData: true });
        }
        this.emit("element:removed", { elementId: element.getId(), trackId: element.getTrackId() });
      }
      return result;
    } catch (error) {
      return false;
    }
  }
  /**
   * Update an element in a specific track using the visitor pattern.
   * @param element The updated element.
   * @returns The updated `TrackElement`.
   */
  updateElement(element) {
    const track = this.getTrackById(element.getTrackId());
    if (!track) {
      return element;
    }
    try {
      const elementUpdater = new ElementUpdater(track);
      const result = element.accept(elementUpdater);
      if (result) {
        const currentData = this.getTimelineData();
        if (currentData) {
          this.setTimelineData({ tracks: currentData.tracks, updatePlayerData: true });
        }
        this.emit("element:updated", { element });
      }
      return element;
    } catch (error) {
      return element;
    }
  }
  /**
   * Split an element at a specific time point using the visitor pattern
   * @param element The element to split
   * @param splitTime The time point to split at
   * @returns SplitResult with first element, second element, and success status
   */
  async splitElement(element, splitTime) {
    const track = this.getTrackById(element.getTrackId());
    if (!track) {
      return { firstElement: element, secondElement: null, success: false };
    }
    try {
      const elementSplitter = new ElementSplitter(splitTime);
      const result = element.accept(elementSplitter);
      if (result.success) {
        const elementRemover = new ElementRemover(track);
        element.accept(elementRemover);
        const elementAdder = new ElementAdder(track);
        result.firstElement.accept(elementAdder);
        result.secondElement.accept(elementAdder);
        const currentData = this.getTimelineData();
        if (currentData) {
          this.setTimelineData({ tracks: currentData.tracks, updatePlayerData: true });
        }
      }
      return result;
    } catch (error) {
      return { firstElement: element, secondElement: null, success: false };
    }
  }
  /**
   * Clone an element using the visitor pattern
   * @param element The element to clone
   * @returns TrackElement | null - the cloned element or null if cloning failed
   */
  cloneElement(element) {
    try {
      const elementCloner = new ElementCloner();
      return element.accept(elementCloner);
    } catch (error) {
      return null;
    }
  }
  reorderTracks(tracks) {
    this.setTimelineData({ tracks, updatePlayerData: true });
    this.emit("track:reordered", { tracks: tracks.map((t2) => t2.serialize()) });
  }
  /**
   * Move an element to a new track inserted at the given index (OpenVideo-style separator drop).
   * Removes the element from its current track, creates a new track at targetTrackIndex,
   * sets element start/end, and adds the element to the new track.
   */
  async moveElementToNewTrackAt(element, targetTrackIndex, startSec) {
    const removed = this.removeElement(element);
    if (!removed) return false;
    const currentData = this.getTimelineData();
    const currentTracks = (currentData == null ? void 0 : currentData.tracks) ?? [];
    const elType = element.getType().toLowerCase();
    let trackType = TRACK_TYPES.ELEMENT;
    if (elType === "video" || elType === "image") trackType = TRACK_TYPES.VIDEO;
    else if (elType === "audio") trackType = TRACK_TYPES.AUDIO;
    else if (elType === "caption" || elType === "text") trackType = TRACK_TYPES.ELEMENT;
    const newTrack = new Track(
      `${trackType.charAt(0).toUpperCase() + trackType.slice(1)} Track`,
      trackType
    );
    const prevStart = element.getStart();
    const prevEnd = element.getEnd();
    const duration = prevEnd - prevStart;
    element.setStart(startSec);
    element.setEnd(startSec + duration);
    this.adjustCaptionWordsForTimeChange(element, prevStart, prevEnd);
    const elementAdder = new ElementAdder(newTrack);
    await element.accept(elementAdder);
    const insertIndex = Math.max(0, Math.min(targetTrackIndex, currentTracks.length));
    const newTracks = [
      ...currentTracks.slice(0, insertIndex),
      newTrack,
      ...currentTracks.slice(insertIndex)
    ];
    this.setTimelineData({ tracks: newTracks, updatePlayerData: true });
    this.emit("element:added", { element, trackId: newTrack.getId() });
    this.emit("element:updated", { element });
    return true;
  }
  updateHistory(timelineTrackData) {
    const tracks = timelineTrackData.tracks.map((t2) => t2.serialize());
    this.totalDuration = getTotalDuration(tracks);
    this.context.setTotalDuration(this.totalDuration);
    const version2 = timelineTrackData.version;
    this.context.setPresent({
      tracks,
      version: version2,
      ...timelineTrackData.backgroundColor !== void 0 && {
        backgroundColor: timelineTrackData.backgroundColor
      },
      ...timelineTrackData.metadata !== void 0 && {
        metadata: timelineTrackData.metadata
      }
    });
  }
  /**
   * Trigger undo operation and update timeline data
   */
  undo() {
    var _a;
    const result = this.context.handleUndo();
    if (result && result.tracks) {
      const tracks = result.tracks.map((t2) => Track.fromJSON(t2));
      timelineContextStore.setTimelineData(this.context.contextId, {
        tracks,
        version: result.version,
        ...result.backgroundColor !== void 0 && {
          backgroundColor: result.backgroundColor
        },
        ...result.metadata !== void 0 && {
          metadata: result.metadata
        }
      });
      this.totalDuration = getTotalDuration(result.tracks);
      this.context.setTotalDuration(this.totalDuration);
      this.context.updateChangeLog();
      if ((_a = this.context) == null ? void 0 : _a.setTimelineAction) {
        this.context.setTimelineAction(TIMELINE_ACTION.UPDATE_PLAYER_DATA, {
          tracks: result.tracks,
          version: result.version,
          ...result.backgroundColor !== void 0 && {
            backgroundColor: result.backgroundColor
          },
          ...result.metadata !== void 0 && {
            metadata: result.metadata
          }
        });
      }
    }
  }
  /**
   * Trigger redo operation and update timeline data
   */
  redo() {
    var _a;
    const result = this.context.handleRedo();
    if (result && result.tracks) {
      const tracks = result.tracks.map((t2) => Track.fromJSON(t2));
      timelineContextStore.setTimelineData(this.context.contextId, {
        tracks,
        version: result.version,
        ...result.backgroundColor !== void 0 && {
          backgroundColor: result.backgroundColor
        },
        ...result.metadata !== void 0 && {
          metadata: result.metadata
        }
      });
      this.totalDuration = getTotalDuration(result.tracks);
      this.context.setTotalDuration(this.totalDuration);
      this.context.updateChangeLog();
      if ((_a = this.context) == null ? void 0 : _a.setTimelineAction) {
        this.context.setTimelineAction(TIMELINE_ACTION.UPDATE_PLAYER_DATA, {
          tracks: result.tracks,
          version: result.version,
          ...result.backgroundColor !== void 0 && {
            backgroundColor: result.backgroundColor
          },
          ...result.metadata !== void 0 && {
            metadata: result.metadata
          }
        });
      }
    }
  }
  /**
   * Reset history and clear timeline data
   */
  resetHistory() {
    var _a;
    this.context.handleResetHistory();
    timelineContextStore.setTimelineData(this.context.contextId, {
      tracks: [],
      version: 0,
      metadata: void 0
    });
    this.context.setTotalDuration(0);
    this.context.updateChangeLog();
    if ((_a = this.context) == null ? void 0 : _a.setTimelineAction) {
      this.context.setTimelineAction(TIMELINE_ACTION.UPDATE_PLAYER_DATA, {
        tracks: [],
        version: 0,
        metadata: void 0
      });
    }
  }
  loadProject({
    tracks,
    version: version2,
    backgroundColor,
    metadata
  }) {
    var _a;
    const migratedProject = migrateProject(
      {
        tracks,
        version: version2,
        backgroundColor,
        metadata
      },
      CURRENT_PROJECT_VERSION
    );
    this.pauseVideo();
    this.context.handleResetHistory();
    const timelineTracks = migratedProject.tracks.map((t2) => Track.fromJSON(t2));
    this.setTimelineData({
      tracks: timelineTracks,
      version: migratedProject.version,
      backgroundColor: migratedProject.backgroundColor,
      metadata: migratedProject.metadata,
      updatePlayerData: true
    });
    if ((_a = this.context) == null ? void 0 : _a.setTimelineAction) {
      this.context.setTimelineAction(TIMELINE_ACTION.UPDATE_PLAYER_DATA, {
        tracks: migratedProject.tracks,
        version: migratedProject.version,
        backgroundColor: migratedProject.backgroundColor,
        metadata: migratedProject.metadata,
        forceUpdate: true
      });
    }
    this.emit("project:loaded", {
      tracks: migratedProject.tracks,
      version: migratedProject.version
    });
  }
  loadProjectSnapshot({
    tracks,
    version: version2,
    backgroundColor,
    metadata
  }) {
    const migratedProject = migrateProject(
      {
        tracks,
        version: version2,
        backgroundColor,
        metadata
      },
      CURRENT_PROJECT_VERSION
    );
    const timelineTracks = migratedProject.tracks.map((track) => Track.fromJSON(track));
    this.setTimelineData({
      tracks: timelineTracks,
      version: migratedProject.version,
      backgroundColor: migratedProject.backgroundColor,
      metadata: migratedProject.metadata,
      updatePlayerData: true
    });
    this.emit("project:loaded", {
      tracks: migratedProject.tracks,
      version: migratedProject.version
    });
  }
  getWatermark() {
    const currentData = this.getTimelineData();
    return (currentData == null ? void 0 : currentData.watermark) || null;
  }
  setWatermark(watermark) {
    const currentData = this.getTimelineData();
    if (currentData) {
      this.setTimelineData({
        tracks: currentData.tracks,
        updatePlayerData: true,
        watermark
      });
    }
  }
  removeWatermark() {
    const currentData = this.getTimelineData();
    if (currentData) {
      this.setTimelineData({
        tracks: currentData.tracks,
        updatePlayerData: true
      });
    }
  }
  async getVideoAudio() {
    var _a;
    const tracks = ((_a = this.getTimelineData()) == null ? void 0 : _a.tracks) || [];
    const audioBlobUrl = await extractVideoAudio(tracks, this.totalDuration);
    return audioBlobUrl;
  }
  /**
   * Add transition metadata from one element to the next (e.g. crossfade).
   * Sets optional transition on the "from" element; visualizer can interpret it when implemented.
   */
  addTransition(fromElementId, toElementId, kind, duration) {
    const fromElement = this.findElementById(fromElementId);
    if (!fromElement) return false;
    const transition = {
      toElementId,
      duration,
      kind
    };
    fromElement.setTransition(transition);
    this.updateElement(fromElement);
    return true;
  }
  /**
   * Remove transition metadata from an element.
   */
  removeTransition(elementId) {
    const element = this.findElementById(elementId);
    if (!element) return false;
    element.setTransition(void 0);
    this.updateElement(element);
    return true;
  }
  findElementById(elementId) {
    var _a;
    const tracks = ((_a = this.getTimelineData()) == null ? void 0 : _a.tracks) ?? [];
    for (const track of tracks) {
      const el = track.getElementById(elementId);
      if (el) return el;
    }
    return null;
  }
  /**
   * Get the current project as ProjectJSON (same shape consumed by visualizer).
   */
  getProject() {
    var _a, _b;
    const data = this.getTimelineData();
    if (!data) {
      return { tracks: [], version: 0 };
    }
    return {
      tracks: data.tracks.map((t2) => t2.serialize()),
      version: data.version,
      watermark: data.watermark != null ? (_b = (_a = data.watermark).toJSON) == null ? void 0 : _b.call(_a) : void 0,
      ...data.backgroundColor !== void 0 && {
        backgroundColor: data.backgroundColor
      },
      ...data.metadata !== void 0 && {
        metadata: data.metadata
      }
    };
  }
  getBackgroundColor() {
    var _a;
    return (_a = this.getTimelineData()) == null ? void 0 : _a.backgroundColor;
  }
  setBackgroundColor(backgroundColor) {
    const currentData = this.getTimelineData();
    if (currentData) {
      this.setTimelineData({
        tracks: currentData.tracks,
        backgroundColor,
        metadata: currentData.metadata,
        updatePlayerData: true
      });
    }
  }
  getMetadata() {
    var _a;
    return (_a = this.getTimelineData()) == null ? void 0 : _a.metadata;
  }
  setMetadata(metadata) {
    const currentData = this.getTimelineData();
    if (currentData) {
      this.setTimelineData({
        tracks: currentData.tracks,
        backgroundColor: currentData.backgroundColor,
        metadata,
        updatePlayerData: true
      });
    }
  }
  /**
   * Ripple delete: remove content in [fromTime, toTime] and shift later content left.
   * Single undo step.
   */
  async rippleDelete(fromTime, toTime) {
    var _a;
    if (fromTime >= toTime) return;
    const durationToRemove = toTime - fromTime;
    const currentTracks = ((_a = this.getTimelineData()) == null ? void 0 : _a.tracks) ?? [];
    const newTracks = [];
    for (const track of currentTracks) {
      const newTrack = Track.fromJSON(track.serialize());
      const friend = newTrack.createFriend();
      const elementsCopy = newTrack.getElements();
      for (const element of elementsCopy) {
        const start = element.getStart();
        const end = element.getEnd();
        if (end <= fromTime) {
          continue;
        }
        if (start >= toTime) {
          element.setStart(start - durationToRemove);
          element.setEnd(end - durationToRemove);
          continue;
        }
        if (start >= fromTime && end <= toTime) {
          friend.removeElement(element);
          continue;
        }
        if (start < fromTime && end > toTime) {
          const splitter = new ElementSplitter(fromTime);
          const result = element.accept(splitter);
          friend.removeElement(element);
          if (result.success && result.firstElement && result.secondElement) {
            result.secondElement.setEnd(fromTime + (end - toTime));
            friend.addElement(result.firstElement, true);
            friend.addElement(result.secondElement, true);
          }
          continue;
        }
        if (start < fromTime && end <= toTime) {
          element.setEnd(fromTime);
          continue;
        }
        if (start >= fromTime && end > toTime) {
          element.setStart(fromTime);
          element.setEnd(fromTime + (end - toTime));
        }
      }
      newTracks.push(newTrack);
    }
    this.setTimelineData({ tracks: newTracks, updatePlayerData: true });
  }
  /**
   * Trim an element to new start and end times. Validates bounds and updates via updateElement.
   */
  trimElement(element, newStart, newEnd) {
    if (newStart >= newEnd) return false;
    const start = element.getStart();
    const end = element.getEnd();
    if (newStart < start || newEnd > end) return false;
    element.setStart(newStart);
    element.setEnd(newEnd);
    this.updateElement(element);
    return true;
  }
  /**
   * Apply multiple element updates in one batch; single setTimelineData and undo step.
   */
  updateElements(updates) {
    var _a;
    const currentData = this.getTimelineData();
    if (!currentData) return;
    const tracks = currentData.tracks;
    let changed = false;
    for (const { elementId, updates: patch } of updates) {
      for (const track of tracks) {
        const element = track.getElementById(elementId);
        if (!element) continue;
        const prevStart = element.getStart();
        const prevEnd = element.getEnd();
        if (patch.s !== void 0) element.setStart(patch.s);
        if (patch.e !== void 0) element.setEnd(patch.e);
        if (patch.props != null) element.setProps(patch.props);
        if (patch.t != null) (_a = element.setText) == null ? void 0 : _a.call(element, patch.t);
        if (patch.position != null) element.setPosition(patch.position);
        if (patch.rotation != null) element.setRotation(patch.rotation);
        if (patch.opacity != null) element.setOpacity(patch.opacity);
        this.adjustCaptionWordsForTimeChange(element, prevStart, prevEnd);
        Object.keys(patch).forEach((key) => {
          if (!["id", "type", "s", "e", "t", "position", "rotation", "opacity", "props"].includes(key) && patch[key] !== void 0) {
            element[key] = patch[key];
          }
        });
        const updater = new ElementUpdater(track);
        element.accept(updater);
        changed = true;
        break;
      }
    }
    if (changed) {
      this.setTimelineData({ tracks, updatePlayerData: true });
    }
  }
  /**
   * For caption elements with existing wordsMs arrays, keep word timings aligned
   * when their time range changes. If the wordsMs length matches the word count,
   * shift/scale existing timings into the new [s, e] interval. If the length no
   * longer matches, regenerate wordsMs using a letter-weighted distribution.
   */
  adjustCaptionWordsForTimeChange(element, prevStart, prevEnd) {
    var _a;
    if (element.getType().toLowerCase() !== "caption") return;
    const props = element.getProps() ?? {};
    const metadata = element.getMetadata() ?? {};
    const propsWords = props.wordsMs;
    const metaWords = metadata.wordsMs;
    const hasPropsWords = Array.isArray(propsWords);
    const hasMetaWords = Array.isArray(metaWords);
    const text = ((_a = element.getText) == null ? void 0 : _a.call(element)) ?? "";
    const words = String(text).split(" ").map((w2) => w2.trim()).filter((w2) => w2.length > 0);
    if (!words.length || !hasPropsWords && !hasMetaWords) return;
    const existingLength = hasPropsWords ? propsWords.length : hasMetaWords ? metaWords.length : 0;
    const startSec = element.getStart();
    const endSec = element.getEnd();
    if (!(endSec > startSec)) return;
    const prevDuration = prevEnd - prevStart;
    const nextDuration = endSec - startSec;
    if (existingLength === words.length && prevDuration > 0 && nextDuration > 0) {
      const adjustWords = (wordsArr) => {
        if (!Array.isArray(wordsArr) || wordsArr.length === 0) return null;
        const prevDurationMs = prevDuration * 1e3;
        const nextDurationMs = nextDuration * 1e3;
        const startMsPrev = prevStart * 1e3;
        const startMsNext = startSec * 1e3;
        if (Math.abs(prevDuration - nextDuration) < 1e-6) {
          const deltaMs = startMsNext - startMsPrev;
          return wordsArr.map((w2) => w2 + deltaMs);
        }
        return wordsArr.map((w2) => {
          const rel = prevDurationMs ? (w2 - startMsPrev) / prevDurationMs : 0;
          const clampedRel = Math.max(0, Math.min(1, rel));
          return startMsNext + clampedRel * nextDurationMs;
        });
      };
      const nextPropsWords = adjustWords(propsWords);
      const nextMetaWords = adjustWords(metaWords);
      if (nextPropsWords) {
        props.wordsMs = nextPropsWords;
        element.setProps(props);
      }
      if (nextMetaWords) {
        metadata.wordsMs = nextMetaWords;
        element.setMetadata(metadata);
      }
      return;
    }
    const totalDurationMs = (endSec - startSec) * 1e3;
    const baseMs = startSec * 1e3;
    const letterCounts = words.map((w2) => w2.replace(/\s+/g, "").length || 1);
    const totalLetters = letterCounts.reduce((sum, n2) => sum + n2, 0);
    if (totalLetters <= 0) return;
    let accumulatedLetters = 0;
    const newWordsMs = letterCounts.map((count) => {
      const t2 = baseMs + accumulatedLetters / totalLetters * totalDurationMs;
      accumulatedLetters += count;
      return t2;
    });
    if (hasPropsWords) {
      props.wordsMs = newWordsMs;
      element.setProps(props);
    }
    if (hasMetaWords) {
      metadata.wordsMs = newWordsMs;
      element.setMetadata(metadata);
    }
  }
  /**
   * Remove multiple elements by id in one batch; single setTimelineData and undo step.
   */
  removeElements(elementIds) {
    const currentData = this.getTimelineData();
    if (!currentData) return;
    const tracks = currentData.tracks;
    const idsSet = new Set(elementIds);
    let changed = false;
    for (const track of tracks) {
      const elements = track.getElements();
      for (const el of elements) {
        if (idsSet.has(el.getId())) {
          const remover = new ElementRemover(track);
          el.accept(remover);
          changed = true;
        }
      }
    }
    if (changed) {
      this.setTimelineData({ tracks, updatePlayerData: true });
      this.emit("elements:removed", { elementIds });
    }
  }
  /**
   * Replace all elements with the given src (e.g. placeholder or same URL) with a new element definition.
   * Preserves id, s, e, and track for each replaced element. Single setTimelineData at end.
   */
  replaceElementsBySource(src, newElementJson) {
    var _a, _b;
    const currentData = this.getTimelineData();
    if (!currentData) return 0;
    const tracks = currentData.tracks;
    let replacedCount = 0;
    for (const track of tracks) {
      const elements = track.getElements();
      for (const element of elements) {
        const elementSrc = ((_a = element.getProps()) == null ? void 0 : _a.src) ?? ((_b = element.getSrc) == null ? void 0 : _b.call(element));
        if (elementSrc !== src) continue;
        const newElement = ElementDeserializer.fromJSON(newElementJson);
        if (!newElement) continue;
        newElement.setId(element.getId());
        newElement.setStart(element.getStart());
        newElement.setEnd(element.getEnd());
        newElement.setTrackId(track.getId());
        const friend = track.createFriend();
        friend.removeElement(element);
        friend.addElement(newElement, true);
        replacedCount++;
      }
    }
    if (replacedCount > 0) {
      this.setTimelineData({ tracks, updatePlayerData: true });
    }
    return replacedCount;
  }
  /**
   * Center an element in the scene by setting its position to the center of scene dimensions.
   */
  centerElementInScene(elementId, sceneWidth, sceneHeight) {
    var _a, _b, _c, _d, _e2, _f;
    const element = this.findElementById(elementId);
    if (!element) return false;
    const props = element.getProps() ?? {};
    const w2 = props.width ?? ((_c = (_b = (_a = element.getFrame) == null ? void 0 : _a.call(element)) == null ? void 0 : _b.size) == null ? void 0 : _c[0]) ?? 0;
    const h2 = props.height ?? ((_f = (_e2 = (_d = element.getFrame) == null ? void 0 : _d.call(element)) == null ? void 0 : _e2.size) == null ? void 0 : _f[1]) ?? 0;
    const x2 = sceneWidth / 2 - w2 / 2;
    const y2 = sceneHeight / 2 - h2 / 2;
    element.setPosition({ x: x2, y: y2 });
    this.updateElement(element);
    return true;
  }
  /**
   * Scale an element to fit within scene dimensions while preserving aspect ratio.
   * Updates width/height in props or frame when present.
   */
  scaleElementToFit(elementId, sceneWidth, sceneHeight) {
    var _a, _b, _c, _d;
    const element = this.findElementById(elementId);
    if (!element) return false;
    const props = element.getProps() ?? {};
    const frame = (_a = element.getFrame) == null ? void 0 : _a.call(element);
    const w2 = props.width ?? ((_b = frame == null ? void 0 : frame.size) == null ? void 0 : _b[0]) ?? sceneWidth;
    const h2 = props.height ?? ((_c = frame == null ? void 0 : frame.size) == null ? void 0 : _c[1]) ?? sceneHeight;
    if (w2 <= 0 || h2 <= 0) return false;
    const scale = Math.min(sceneWidth / w2, sceneHeight / h2);
    const newW = w2 * scale;
    const newH = h2 * scale;
    if (frame && Array.isArray(frame.size)) {
      (_d = element.setFrame) == null ? void 0 : _d.call(element, { ...frame, size: [newW, newH] });
    } else {
      element.setProps({ ...props, width: newW, height: newH });
    }
    const x2 = sceneWidth / 2 - newW / 2;
    const y2 = sceneHeight / 2 - newH / 2;
    element.setPosition({ x: x2, y: y2 });
    this.updateElement(element);
    return true;
  }
  /**
   * Duplicate multiple elements by id; adds clones to the same track. Single setTimelineData at end.
   */
  async duplicateElements(elementIds) {
    const currentData = this.getTimelineData();
    if (!currentData) return [];
    const tracks = currentData.tracks;
    const added = [];
    const elementCloner = new ElementCloner();
    for (const elementId of elementIds) {
      for (const track of tracks) {
        const element = track.getElementById(elementId);
        if (!element) continue;
        const clone = element.accept(elementCloner);
        if (clone) {
          clone.setId(`e-${generateShortUuid()}`);
          const adder = new ElementAdder(track);
          const result = await clone.accept(adder);
          if (result) added.push(clone);
        }
        break;
      }
    }
    if (added.length > 0) {
      this.setTimelineData({ tracks, updatePlayerData: true });
    }
    return added;
  }
}
const MAX_HISTORY = 20;
const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};
const UndoRedoContext = createContext(
  void 0
);
const STORAGE_KEY_PREFIX = "twick_undo_redo_";
const isBrowser = typeof window !== "undefined" && typeof window.localStorage !== "undefined";
const saveToStorage = (key, state) => {
  if (!isBrowser) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(state));
  } catch (error) {
    console.warn("Failed to save undo-redo state to localStorage:", error);
  }
};
const loadFromStorage = (key) => {
  if (!isBrowser) return null;
  try {
    const stored = window.localStorage.getItem(key);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch (error) {
    console.warn("Failed to load undo-redo state from localStorage:", error);
    return null;
  }
};
const UndoRedoProvider = ({
  children,
  persistenceKey,
  maxHistorySize = MAX_HISTORY
}) => {
  const [state, setState] = useState(() => {
    if (persistenceKey) {
      const stored = loadFromStorage(STORAGE_KEY_PREFIX + persistenceKey);
      if (stored) {
        return {
          past: stored.past,
          present: stored.present,
          future: stored.future
        };
      }
    }
    return {
      past: [],
      present: null,
      future: []
    };
  });
  const saveState = (newState) => {
    if (persistenceKey) {
      saveToStorage(STORAGE_KEY_PREFIX + persistenceKey, newState);
    }
  };
  const setPresent = (data) => {
    setState((prevState) => {
      let newPast = [...prevState.past];
      if (prevState.present) {
        newPast.push(deepClone(prevState.present));
      }
      const newState = {
        past: newPast,
        present: deepClone(data),
        future: []
        // Clear future because it's a new change
      };
      if (newState.past.length > maxHistorySize) {
        newState.past.shift();
      }
      saveState(newState);
      return newState;
    });
  };
  const undo = () => {
    let undoResult = null;
    setState((prevState) => {
      if (prevState.past.length === 0) return prevState;
      const previous = prevState.past[prevState.past.length - 1];
      const newState = {
        past: prevState.past.slice(0, -1),
        // Remove last item
        present: previous,
        future: prevState.present ? [deepClone(prevState.present), ...prevState.future] : prevState.future
      };
      undoResult = previous;
      saveState(newState);
      return newState;
    });
    return undoResult;
  };
  const redo = () => {
    let redoResult = null;
    setState((prevState) => {
      if (prevState.future.length === 0) return prevState;
      const next = prevState.future[0];
      const newState = {
        past: prevState.present ? [...prevState.past, deepClone(prevState.present)] : prevState.past,
        present: next,
        future: prevState.future.slice(1)
        // Remove first item
      };
      if (newState.past.length > maxHistorySize) {
        newState.past.shift();
      }
      redoResult = next;
      saveState(newState);
      return newState;
    });
    return redoResult;
  };
  const getLastPersistedState = () => {
    if (persistenceKey) {
      const stored = loadFromStorage(STORAGE_KEY_PREFIX + persistenceKey);
      return (stored == null ? void 0 : stored.present) || null;
    }
    return null;
  };
  const resetHistory = () => {
    const newState = {
      past: [],
      present: null,
      future: []
    };
    setState(newState);
    if (persistenceKey && isBrowser) {
      window.localStorage.removeItem(STORAGE_KEY_PREFIX + persistenceKey);
    }
  };
  const disablePersistence = () => {
    if (persistenceKey && isBrowser) {
      window.localStorage.removeItem(STORAGE_KEY_PREFIX + persistenceKey);
    }
  };
  const contextValue = {
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    present: state.present,
    setPresent,
    undo,
    redo,
    resetHistory,
    getLastPersistedState,
    disablePersistence
  };
  return /* @__PURE__ */ jsx(UndoRedoContext.Provider, { value: contextValue, children });
};
const useUndoRedo = () => {
  const context = useContext(UndoRedoContext);
  if (context === void 0) {
    throw new Error("useUndoRedo must be used within an UndoRedoProvider");
  }
  return context;
};
function resolveId(id, tracks) {
  if (isTrackId(id)) {
    return tracks.find((t2) => t2.getId() === id) ?? null;
  }
  for (const track of tracks) {
    const el = track.getElementById(id);
    if (el) return el;
  }
  return null;
}
function resolveIds(ids, tracks) {
  const result = [];
  for (const id of ids) {
    const item = resolveId(id, tracks);
    if (item) result.push(item);
  }
  return result;
}
function getElementIdsInRange(track, fromElementId, toElementId) {
  const elements = track.getElements();
  const fromIdx = elements.findIndex((e2) => e2.getId() === fromElementId);
  const toIdx = elements.findIndex((e2) => e2.getId() === toElementId);
  if (fromIdx === -1 || toIdx === -1) return [];
  const [start, end] = fromIdx <= toIdx ? [fromIdx, toIdx] : [toIdx, fromIdx];
  return elements.slice(start, end + 1).map((e2) => e2.getId());
}
const editorRegistry = /* @__PURE__ */ new Map();
if (typeof window !== "undefined") {
  window.twickTimelineEditors = editorRegistry;
}
var t = "undefined" != typeof window ? window : void 0, i = "undefined" != typeof globalThis ? globalThis : t;
"undefined" == typeof self && (i.self = i), "undefined" == typeof File && (i.File = function() {
});
var e = Array.prototype, r = e.forEach, s = e.indexOf, n = null == i ? void 0 : i.navigator, o = null == i ? void 0 : i.document, a = null == i ? void 0 : i.location, l = null == i ? void 0 : i.fetch, u = null != i && i.XMLHttpRequest && "withCredentials" in new i.XMLHttpRequest() ? i.XMLHttpRequest : void 0, h = null == i ? void 0 : i.AbortController, d = null == n ? void 0 : n.userAgent, v = null != t ? t : {}, c = { DEBUG: false, LIB_VERSION: "1.335.5" };
function f(t2, i2, e2, r2, s2, n2, o2) {
  try {
    var a2 = t2[n2](o2), l2 = a2.value;
  } catch (t3) {
    return void e2(t3);
  }
  a2.done ? i2(l2) : Promise.resolve(l2).then(r2, s2);
}
function p(t2) {
  return function() {
    var i2 = this, e2 = arguments;
    return new Promise(function(r2, s2) {
      var n2 = t2.apply(i2, e2);
      function o2(t3) {
        f(n2, r2, s2, o2, a2, "next", t3);
      }
      function a2(t3) {
        f(n2, r2, s2, o2, a2, "throw", t3);
      }
      o2(void 0);
    });
  };
}
function g() {
  return g = Object.assign ? Object.assign.bind() : function(t2) {
    for (var i2 = 1; i2 < arguments.length; i2++) {
      var e2 = arguments[i2];
      for (var r2 in e2) ({}).hasOwnProperty.call(e2, r2) && (t2[r2] = e2[r2]);
    }
    return t2;
  }, g.apply(null, arguments);
}
function _(t2, i2) {
  if (null == t2) return {};
  var e2 = {};
  for (var r2 in t2) if ({}.hasOwnProperty.call(t2, r2)) {
    if (-1 !== i2.indexOf(r2)) continue;
    e2[r2] = t2[r2];
  }
  return e2;
}
var m = ["amazonbot", "amazonproductbot", "app.hypefactors.com", "applebot", "archive.org_bot", "awariobot", "backlinksextendedbot", "baiduspider", "bingbot", "bingpreview", "chrome-lighthouse", "dataforseobot", "deepscan", "duckduckbot", "facebookexternal", "facebookcatalog", "http://yandex.com/bots", "hubspot", "ia_archiver", "leikibot", "linkedinbot", "meta-externalagent", "mj12bot", "msnbot", "nessus", "petalbot", "pinterest", "prerender", "rogerbot", "screaming frog", "sebot-wa", "sitebulb", "slackbot", "slurp", "trendictionbot", "turnitin", "twitterbot", "vercel-screenshot", "vercelbot", "yahoo! slurp", "yandexbot", "zoombot", "bot.htm", "bot.php", "(bot;", "bot/", "crawler", "ahrefsbot", "ahrefssiteaudit", "semrushbot", "siteauditbot", "splitsignalbot", "gptbot", "oai-searchbot", "chatgpt-user", "perplexitybot", "better uptime bot", "sentryuptimebot", "uptimerobot", "headlesschrome", "cypress", "google-hoteladsverifier", "adsbot-google", "apis-google", "duplexweb-google", "feedfetcher-google", "google favicon", "google web preview", "google-read-aloud", "googlebot", "googleother", "google-cloudvertexbot", "googleweblight", "mediapartners-google", "storebot-google", "google-inspectiontool", "bytespider"], y = function(t2, i2) {
  if (void 0 === i2 && (i2 = []), !t2) return false;
  var e2 = t2.toLowerCase();
  return m.concat(i2).some((t3) => {
    var i3 = t3.toLowerCase();
    return -1 !== e2.indexOf(i3);
  });
}, b = ["$snapshot", "$pageview", "$pageleave", "$set", "survey dismissed", "survey sent", "survey shown", "$identify", "$groupidentify", "$create_alias", "$$client_ingestion_warning", "$web_experiment_applied", "$feature_enrollment_update", "$feature_flag_called"];
function w(t2, i2) {
  return -1 !== t2.indexOf(i2);
}
var x = function(t2) {
  return t2.trim();
}, E = function(t2) {
  return t2.replace(/^\$/, "");
};
var S = Array.isArray, k = Object.prototype, P = k.hasOwnProperty, T = k.toString, I = S || function(t2) {
  return "[object Array]" === T.call(t2);
}, C = (t2) => "function" == typeof t2, R = (t2) => t2 === Object(t2) && !I(t2), F = (t2) => {
  if (R(t2)) {
    for (var i2 in t2) if (P.call(t2, i2)) return false;
    return true;
  }
  return false;
}, M = (t2) => void 0 === t2, O = (t2) => "[object String]" == T.call(t2), A = (t2) => O(t2) && 0 === t2.trim().length, D = (t2) => null === t2, j = (t2) => M(t2) || D(t2), L = (t2) => "[object Number]" == T.call(t2) && t2 == t2, N = (t2) => L(t2) && t2 > 0, U = (t2) => "[object Boolean]" === T.call(t2), z = (t2) => t2 instanceof FormData, H = (t2) => w(b, t2);
function B(t2) {
  return null === t2 || "object" != typeof t2;
}
function q(t2, i2) {
  return Object.prototype.toString.call(t2) === "[object " + i2 + "]";
}
function W(t2) {
  return !M(Event) && function(t3, i2) {
    try {
      return t3 instanceof i2;
    } catch (t4) {
      return false;
    }
  }(t2, Event);
}
var G = [true, "true", 1, "1", "yes"], V = (t2) => w(G, t2), J = [false, "false", 0, "0", "no"];
function K(t2, i2, e2, r2, s2) {
  return i2 > e2 && (r2.warn("min cannot be greater than max."), i2 = e2), L(t2) ? t2 > e2 ? (r2.warn(" cannot be  greater than max: " + e2 + ". Using max value instead."), e2) : t2 < i2 ? (r2.warn(" cannot be less than min: " + i2 + ". Using min value instead."), i2) : t2 : (r2.warn(" must be a number. using max or fallback. max: " + e2 + ", fallback: " + s2), K(s2 || e2, i2, e2, r2));
}
class Y {
  constructor(t2) {
    this.t = {}, this.i = t2.i, this.o = K(t2.bucketSize, 0, 100, t2.h), this.m = K(t2.refillRate, 0, this.o, t2.h), this.$ = K(t2.refillInterval, 0, 864e5, t2.h);
  }
  S(t2, i2) {
    var e2 = i2 - t2.lastAccess, r2 = Math.floor(e2 / this.$);
    if (r2 > 0) {
      var s2 = r2 * this.m;
      t2.tokens = Math.min(t2.tokens + s2, this.o), t2.lastAccess = t2.lastAccess + r2 * this.$;
    }
  }
  consumeRateLimit(t2) {
    var i2, e2 = Date.now(), r2 = String(t2), s2 = this.t[r2];
    return s2 ? this.S(s2, e2) : (s2 = { tokens: this.o, lastAccess: e2 }, this.t[r2] = s2), 0 === s2.tokens || (s2.tokens--, 0 === s2.tokens && (null == (i2 = this.i) || i2.call(this, t2)), 0 === s2.tokens);
  }
  stop() {
    this.t = {};
  }
}
var X = "Mobile", Q = "iOS", Z = "Android", tt = "Tablet", it = Z + " " + tt, et = "iPad", rt = "Apple", st = rt + " Watch", nt = "Safari", ot = "BlackBerry", at = "Samsung", lt = at + "Browser", ut = at + " Internet", ht = "Chrome", dt = ht + " OS", vt = ht + " " + Q, ct = "Internet Explorer", ft = ct + " " + X, pt = "Opera", gt = pt + " Mini", _t = "Edge", mt = "Microsoft " + _t, yt = "Firefox", bt = yt + " " + Q, wt = "Nintendo", xt = "PlayStation", Et = "Xbox", $t = Z + " " + X, St = X + " " + nt, kt = "Windows", Pt = kt + " Phone", Tt = "Nokia", It = "Ouya", Ct = "Generic", Rt = Ct + " " + X.toLowerCase(), Ft = Ct + " " + tt.toLowerCase(), Mt = "Konqueror", Ot = "(\\d+(\\.\\d+)?)", At = new RegExp("Version/" + Ot), Dt = new RegExp(Et, "i"), jt = new RegExp(xt + " \\w+", "i"), Lt = new RegExp(wt + " \\w+", "i"), Nt = new RegExp(ot + "|PlayBook|BB10", "i"), Ut = { "NT3.51": "NT 3.11", "NT4.0": "NT 4.0", "5.0": "2000", 5.1: "XP", 5.2: "XP", "6.0": "Vista", 6.1: "7", 6.2: "8", 6.3: "8.1", 6.4: "10", "10.0": "10" };
var zt, Ht, Bt, qt = (t2, i2) => i2 && w(i2, rt) || function(t3) {
  return w(t3, nt) && !w(t3, ht) && !w(t3, Z);
}(t2), Wt = function(t2, i2) {
  return i2 = i2 || "", w(t2, " OPR/") && w(t2, "Mini") ? gt : w(t2, " OPR/") ? pt : Nt.test(t2) ? ot : w(t2, "IE" + X) || w(t2, "WPDesktop") ? ft : w(t2, lt) ? ut : w(t2, _t) || w(t2, "Edg/") ? mt : w(t2, "FBIOS") ? "Facebook " + X : w(t2, "UCWEB") || w(t2, "UCBrowser") ? "UC Browser" : w(t2, "CriOS") ? vt : w(t2, "CrMo") || w(t2, ht) ? ht : w(t2, Z) && w(t2, nt) ? $t : w(t2, "FxiOS") ? bt : w(t2.toLowerCase(), Mt.toLowerCase()) ? Mt : qt(t2, i2) ? w(t2, X) ? St : nt : w(t2, yt) ? yt : w(t2, "MSIE") || w(t2, "Trident/") ? ct : w(t2, "Gecko") ? yt : "";
}, Gt = { [ft]: [new RegExp("rv:" + Ot)], [mt]: [new RegExp(_t + "?\\/" + Ot)], [ht]: [new RegExp("(" + ht + "|CrMo)\\/" + Ot)], [vt]: [new RegExp("CriOS\\/" + Ot)], "UC Browser": [new RegExp("(UCBrowser|UCWEB)\\/" + Ot)], [nt]: [At], [St]: [At], [pt]: [new RegExp("(Opera|OPR)\\/" + Ot)], [yt]: [new RegExp(yt + "\\/" + Ot)], [bt]: [new RegExp("FxiOS\\/" + Ot)], [Mt]: [new RegExp("Konqueror[:/]?" + Ot, "i")], [ot]: [new RegExp(ot + " " + Ot), At], [$t]: [new RegExp("android\\s" + Ot, "i")], [ut]: [new RegExp(lt + "\\/" + Ot)], [ct]: [new RegExp("(rv:|MSIE )" + Ot)], Mozilla: [new RegExp("rv:" + Ot)] }, Vt = function(t2, i2) {
  var e2 = Wt(t2, i2), r2 = Gt[e2];
  if (M(r2)) return null;
  for (var s2 = 0; s2 < r2.length; s2++) {
    var n2 = r2[s2], o2 = t2.match(n2);
    if (o2) return parseFloat(o2[o2.length - 2]);
  }
  return null;
}, Jt = [[new RegExp(Et + "; " + Et + " (.*?)[);]", "i"), (t2) => [Et, t2 && t2[1] || ""]], [new RegExp(wt, "i"), [wt, ""]], [new RegExp(xt, "i"), [xt, ""]], [Nt, [ot, ""]], [new RegExp(kt, "i"), (t2, i2) => {
  if (/Phone/.test(i2) || /WPDesktop/.test(i2)) return [Pt, ""];
  if (new RegExp(X).test(i2) && !/IEMobile\b/.test(i2)) return [kt + " " + X, ""];
  var e2 = /Windows NT ([0-9.]+)/i.exec(i2);
  if (e2 && e2[1]) {
    var r2 = e2[1], s2 = Ut[r2] || "";
    return /arm/i.test(i2) && (s2 = "RT"), [kt, s2];
  }
  return [kt, ""];
}], [/((iPhone|iPad|iPod).*?OS (\d+)_(\d+)_?(\d+)?|iPhone)/, (t2) => {
  if (t2 && t2[3]) {
    var i2 = [t2[3], t2[4], t2[5] || "0"];
    return [Q, i2.join(".")];
  }
  return [Q, ""];
}], [/(watch.*\/(\d+\.\d+\.\d+)|watch os,(\d+\.\d+),)/i, (t2) => {
  var i2 = "";
  return t2 && t2.length >= 3 && (i2 = M(t2[2]) ? t2[3] : t2[2]), ["watchOS", i2];
}], [new RegExp("(" + Z + " (\\d+)\\.(\\d+)\\.?(\\d+)?|" + Z + ")", "i"), (t2) => {
  if (t2 && t2[2]) {
    var i2 = [t2[2], t2[3], t2[4] || "0"];
    return [Z, i2.join(".")];
  }
  return [Z, ""];
}], [/Mac OS X (\d+)[_.](\d+)[_.]?(\d+)?/i, (t2) => {
  var i2 = ["Mac OS X", ""];
  if (t2 && t2[1]) {
    var e2 = [t2[1], t2[2], t2[3] || "0"];
    i2[1] = e2.join(".");
  }
  return i2;
}], [/Mac/i, ["Mac OS X", ""]], [/CrOS/, [dt, ""]], [/Linux|debian/i, ["Linux", ""]]], Kt = function(t2) {
  return Lt.test(t2) ? wt : jt.test(t2) ? xt : Dt.test(t2) ? Et : new RegExp(It, "i").test(t2) ? It : new RegExp("(" + Pt + "|WPDesktop)", "i").test(t2) ? Pt : /iPad/.test(t2) ? et : /iPod/.test(t2) ? "iPod Touch" : /iPhone/.test(t2) ? "iPhone" : /(watch)(?: ?os[,/]|\d,\d\/)[\d.]+/i.test(t2) ? st : Nt.test(t2) ? ot : /(kobo)\s(ereader|touch)/i.test(t2) ? "Kobo" : new RegExp(Tt, "i").test(t2) ? Tt : /(kf[a-z]{2}wi|aeo[c-r]{2})( bui|\))/i.test(t2) || /(kf[a-z]+)( bui|\)).+silk\//i.test(t2) ? "Kindle Fire" : /(Android|ZTE)/i.test(t2) ? new RegExp(X).test(t2) && !/(9138B|TB782B|Nexus [97]|pixel c|HUAWEISHT|BTV|noble nook|smart ultra 6)/i.test(t2) || /pixel[\daxl ]{1,6}/i.test(t2) && !/pixel c/i.test(t2) || /(huaweimed-al00|tah-|APA|SM-G92|i980|zte|U304AA)/i.test(t2) || /lmy47v/i.test(t2) && !/QTAQZ3/i.test(t2) ? Z : it : new RegExp("(pda|" + X + ")", "i").test(t2) ? Rt : new RegExp(tt, "i").test(t2) && !new RegExp(tt + " pc", "i").test(t2) ? Ft : "";
}, Yt = (t2) => t2 instanceof Error;
function Xt(t2) {
  var i2 = globalThis._posthogChunkIds;
  if (i2) {
    var e2 = Object.keys(i2);
    return Bt && e2.length === Ht || (Ht = e2.length, Bt = e2.reduce((e3, r2) => {
      zt || (zt = {});
      var s2 = zt[r2];
      if (s2) e3[s2[0]] = s2[1];
      else for (var n2 = t2(r2), o2 = n2.length - 1; o2 >= 0; o2--) {
        var a2 = n2[o2], l2 = null == a2 ? void 0 : a2.filename, u2 = i2[r2];
        if (l2 && u2) {
          e3[l2] = u2, zt[r2] = [l2, u2];
          break;
        }
      }
      return e3;
    }, {})), Bt;
  }
}
class Qt {
  constructor(t2, i2, e2) {
    void 0 === e2 && (e2 = []), this.coercers = t2, this.stackParser = i2, this.modifiers = e2;
  }
  buildFromUnknown(t2, i2) {
    void 0 === i2 && (i2 = {});
    var e2 = i2 && i2.mechanism || { handled: true, type: "generic" }, r2 = this.buildCoercingContext(e2, i2, 0).apply(t2), s2 = this.buildParsingContext(), n2 = this.parseStacktrace(r2, s2);
    return { $exception_list: this.convertToExceptionList(n2, e2), $exception_level: "error" };
  }
  modifyFrames(t2) {
    var i2 = this;
    return p(function* () {
      for (var e2 of t2) e2.stacktrace && e2.stacktrace.frames && I(e2.stacktrace.frames) && (e2.stacktrace.frames = yield i2.applyModifiers(e2.stacktrace.frames));
      return t2;
    })();
  }
  coerceFallback(t2) {
    var i2;
    return { type: "Error", value: "Unknown error", stack: null == (i2 = t2.syntheticException) ? void 0 : i2.stack, synthetic: true };
  }
  parseStacktrace(t2, i2) {
    var e2, r2;
    return null != t2.cause && (e2 = this.parseStacktrace(t2.cause, i2)), "" != t2.stack && null != t2.stack && (r2 = this.applyChunkIds(this.stackParser(t2.stack, t2.synthetic ? 1 : 0), i2.chunkIdMap)), g({}, t2, { cause: e2, stack: r2 });
  }
  applyChunkIds(t2, i2) {
    return t2.map((t3) => (t3.filename && i2 && (t3.chunk_id = i2[t3.filename]), t3));
  }
  applyCoercers(t2, i2) {
    for (var e2 of this.coercers) if (e2.match(t2)) return e2.coerce(t2, i2);
    return this.coerceFallback(i2);
  }
  applyModifiers(t2) {
    var i2 = this;
    return p(function* () {
      var e2 = t2;
      for (var r2 of i2.modifiers) e2 = yield r2(e2);
      return e2;
    })();
  }
  convertToExceptionList(t2, i2) {
    var e2, r2, s2, n2 = { type: t2.type, value: t2.value, mechanism: { type: null !== (e2 = i2.type) && void 0 !== e2 ? e2 : "generic", handled: null === (r2 = i2.handled) || void 0 === r2 || r2, synthetic: null !== (s2 = t2.synthetic) && void 0 !== s2 && s2 } };
    t2.stack && (n2.stacktrace = { type: "raw", frames: t2.stack });
    var o2 = [n2];
    return null != t2.cause && o2.push(...this.convertToExceptionList(t2.cause, g({}, i2, { handled: true }))), o2;
  }
  buildParsingContext() {
    return { chunkIdMap: Xt(this.stackParser) };
  }
  buildCoercingContext(t2, i2, e2) {
    void 0 === e2 && (e2 = 0);
    var r2 = (e3, r3) => {
      if (r3 <= 4) {
        var s2 = this.buildCoercingContext(t2, i2, r3);
        return this.applyCoercers(e3, s2);
      }
    };
    return g({}, i2, { syntheticException: 0 == e2 ? i2.syntheticException : void 0, mechanism: t2, apply: (t3) => r2(t3, e2), next: (t3) => r2(t3, e2 + 1) });
  }
}
var Zt = "?";
function ti(t2, i2, e2, r2, s2) {
  var n2 = { platform: t2, filename: i2, function: "<anonymous>" === e2 ? Zt : e2, in_app: true };
  return M(r2) || (n2.lineno = r2), M(s2) || (n2.colno = s2), n2;
}
var ii = (t2, i2) => {
  var e2 = -1 !== t2.indexOf("safari-extension"), r2 = -1 !== t2.indexOf("safari-web-extension");
  return e2 || r2 ? [-1 !== t2.indexOf("@") ? t2.split("@")[0] : Zt, e2 ? "safari-extension:" + i2 : "safari-web-extension:" + i2] : [t2, i2];
}, ei = /^\s*at (\S+?)(?::(\d+))(?::(\d+))\s*$/i, ri = /^\s*at (?:(.+?\)(?: \[.+\])?|.*?) ?\((?:address at )?)?(?:async )?((?:<anonymous>|[-a-z]+:|.*bundle|\/)?.*?)(?::(\d+))?(?::(\d+))?\)?\s*$/i, si = /\((\S*)(?::(\d+))(?::(\d+))\)/, ni = (t2, i2) => {
  var e2 = ei.exec(t2);
  if (e2) {
    var [, r2, s2, n2] = e2;
    return ti(i2, r2, Zt, +s2, +n2);
  }
  var o2 = ri.exec(t2);
  if (o2) {
    if (o2[2] && 0 === o2[2].indexOf("eval")) {
      var a2 = si.exec(o2[2]);
      a2 && (o2[2] = a2[1], o2[3] = a2[2], o2[4] = a2[3]);
    }
    var [l2, u2] = ii(o2[1] || Zt, o2[2]);
    return ti(i2, u2, l2, o2[3] ? +o2[3] : void 0, o2[4] ? +o2[4] : void 0);
  }
}, oi = /^\s*(.*?)(?:\((.*?)\))?(?:^|@)?((?:[-a-z]+)?:\/.*?|\[native code\]|[^@]*(?:bundle|\d+\.js)|\/[\w\-. /=]+)(?::(\d+))?(?::(\d+))?\s*$/i, ai = /(\S+) line (\d+)(?: > eval line \d+)* > eval/i, li = (t2, i2) => {
  var e2 = oi.exec(t2);
  if (e2) {
    if (e2[3] && e2[3].indexOf(" > eval") > -1) {
      var r2 = ai.exec(e2[3]);
      r2 && (e2[1] = e2[1] || "eval", e2[3] = r2[1], e2[4] = r2[2], e2[5] = "");
    }
    var s2 = e2[3], n2 = e2[1] || Zt;
    return [n2, s2] = ii(n2, s2), ti(i2, s2, n2, e2[4] ? +e2[4] : void 0, e2[5] ? +e2[5] : void 0);
  }
}, ui = /\(error: (.*)\)/, hi = 50;
function di() {
  return function(t2) {
    for (var i2 = arguments.length, e2 = new Array(i2 > 1 ? i2 - 1 : 0), r2 = 1; r2 < i2; r2++) e2[r2 - 1] = arguments[r2];
    return function(i3, r3) {
      void 0 === r3 && (r3 = 0);
      for (var s2 = [], n2 = i3.split("\n"), o2 = r3; o2 < n2.length; o2++) {
        var a2 = n2[o2];
        if (!(a2.length > 1024)) {
          var l2 = ui.test(a2) ? a2.replace(ui, "$1") : a2;
          if (!l2.match(/\S*Error: /)) {
            for (var u2 of e2) {
              var h2 = u2(l2, t2);
              if (h2) {
                s2.push(h2);
                break;
              }
            }
            if (s2.length >= hi) break;
          }
        }
      }
      return function(t3) {
        if (!t3.length) return [];
        var i4 = Array.from(t3);
        return i4.reverse(), i4.slice(0, hi).map((t4) => {
          return g({}, t4, { filename: t4.filename || (e3 = i4, e3[e3.length - 1] || {}).filename, function: t4.function || Zt });
          var e3;
        });
      }(s2);
    };
  }("web:javascript", ni, li);
}
class vi {
  match(t2) {
    return this.isDOMException(t2) || this.isDOMError(t2);
  }
  coerce(t2, i2) {
    var e2 = O(t2.stack);
    return { type: this.getType(t2), value: this.getValue(t2), stack: e2 ? t2.stack : void 0, cause: t2.cause ? i2.next(t2.cause) : void 0, synthetic: false };
  }
  getType(t2) {
    return this.isDOMError(t2) ? "DOMError" : "DOMException";
  }
  getValue(t2) {
    var i2 = t2.name || (this.isDOMError(t2) ? "DOMError" : "DOMException");
    return t2.message ? i2 + ": " + t2.message : i2;
  }
  isDOMException(t2) {
    return q(t2, "DOMException");
  }
  isDOMError(t2) {
    return q(t2, "DOMError");
  }
}
class ci {
  match(t2) {
    return ((t3) => t3 instanceof Error)(t2);
  }
  coerce(t2, i2) {
    return { type: this.getType(t2), value: this.getMessage(t2, i2), stack: this.getStack(t2), cause: t2.cause ? i2.next(t2.cause) : void 0, synthetic: false };
  }
  getType(t2) {
    return t2.name || t2.constructor.name;
  }
  getMessage(t2, i2) {
    var e2 = t2.message;
    return e2.error && "string" == typeof e2.error.message ? String(e2.error.message) : String(e2);
  }
  getStack(t2) {
    return t2.stacktrace || t2.stack || void 0;
  }
}
class fi {
  constructor() {
  }
  match(t2) {
    return q(t2, "ErrorEvent") && null != t2.error;
  }
  coerce(t2, i2) {
    var e2, r2 = i2.apply(t2.error);
    return r2 || { type: "ErrorEvent", value: t2.message, stack: null == (e2 = i2.syntheticException) ? void 0 : e2.stack, synthetic: true };
  }
}
var pi = /^(?:[Uu]ncaught (?:exception: )?)?(?:((?:Eval|Internal|Range|Reference|Syntax|Type|URI|)Error): )?(.*)$/i;
class gi {
  match(t2) {
    return "string" == typeof t2;
  }
  coerce(t2, i2) {
    var e2, [r2, s2] = this.getInfos(t2);
    return { type: null != r2 ? r2 : "Error", value: null != s2 ? s2 : t2, stack: null == (e2 = i2.syntheticException) ? void 0 : e2.stack, synthetic: true };
  }
  getInfos(t2) {
    var i2 = "Error", e2 = t2, r2 = t2.match(pi);
    return r2 && (i2 = r2[1], e2 = r2[2]), [i2, e2];
  }
}
var _i = ["fatal", "error", "warning", "log", "info", "debug"];
function mi(t2, i2) {
  void 0 === i2 && (i2 = 40);
  var e2 = Object.keys(t2);
  if (e2.sort(), !e2.length) return "[object has no keys]";
  for (var r2 = e2.length; r2 > 0; r2--) {
    var s2 = e2.slice(0, r2).join(", ");
    if (!(s2.length > i2)) return r2 === e2.length || s2.length <= i2 ? s2 : s2.slice(0, i2) + "...";
  }
  return "";
}
class yi {
  match(t2) {
    return "object" == typeof t2 && null !== t2;
  }
  coerce(t2, i2) {
    var e2, r2 = this.getErrorPropertyFromObject(t2);
    return r2 ? i2.apply(r2) : { type: this.getType(t2), value: this.getValue(t2), stack: null == (e2 = i2.syntheticException) ? void 0 : e2.stack, level: this.isSeverityLevel(t2.level) ? t2.level : "error", synthetic: true };
  }
  getType(t2) {
    return W(t2) ? t2.constructor.name : "Error";
  }
  getValue(t2) {
    if ("name" in t2 && "string" == typeof t2.name) {
      var i2 = "'" + t2.name + "' captured as exception";
      return "message" in t2 && "string" == typeof t2.message && (i2 += " with message: '" + t2.message + "'"), i2;
    }
    if ("message" in t2 && "string" == typeof t2.message) return t2.message;
    var e2 = this.getObjectClassName(t2);
    return (e2 && "Object" !== e2 ? "'" + e2 + "'" : "Object") + " captured as exception with keys: " + mi(t2);
  }
  isSeverityLevel(t2) {
    return O(t2) && !A(t2) && _i.indexOf(t2) >= 0;
  }
  getErrorPropertyFromObject(t2) {
    for (var i2 in t2) if (Object.prototype.hasOwnProperty.call(t2, i2)) {
      var e2 = t2[i2];
      if (Yt(e2)) return e2;
    }
  }
  getObjectClassName(t2) {
    try {
      var i2 = Object.getPrototypeOf(t2);
      return i2 ? i2.constructor.name : void 0;
    } catch (t3) {
      return;
    }
  }
}
class bi {
  match(t2) {
    return W(t2);
  }
  coerce(t2, i2) {
    var e2, r2 = t2.constructor.name;
    return { type: r2, value: r2 + " captured as exception with keys: " + mi(t2), stack: null == (e2 = i2.syntheticException) ? void 0 : e2.stack, synthetic: true };
  }
}
class wi {
  match(t2) {
    return B(t2);
  }
  coerce(t2, i2) {
    var e2;
    return { type: "Error", value: "Primitive value captured as exception: " + String(t2), stack: null == (e2 = i2.syntheticException) ? void 0 : e2.stack, synthetic: true };
  }
}
class xi {
  match(t2) {
    return q(t2, "PromiseRejectionEvent");
  }
  coerce(t2, i2) {
    var e2, r2 = this.getUnhandledRejectionReason(t2);
    return B(r2) ? { type: "UnhandledRejection", value: "Non-Error promise rejection captured with value: " + String(r2), stack: null == (e2 = i2.syntheticException) ? void 0 : e2.stack, synthetic: true } : i2.apply(r2);
  }
  getUnhandledRejectionReason(t2) {
    if (B(t2)) return t2;
    try {
      if ("reason" in t2) return t2.reason;
      if ("detail" in t2 && "reason" in t2.detail) return t2.detail.reason;
    } catch (t3) {
    }
    return t2;
  }
}
var Ei = function(i2, e2) {
  var { debugEnabled: r2 } = void 0 === e2 ? {} : e2, s2 = { k: function(e3) {
    if (t && (c.DEBUG || v.POSTHOG_DEBUG || r2) && !M(t.console) && t.console) {
      for (var s3 = ("__rrweb_original__" in t.console[e3]) ? t.console[e3].__rrweb_original__ : t.console[e3], n2 = arguments.length, o2 = new Array(n2 > 1 ? n2 - 1 : 0), a2 = 1; a2 < n2; a2++) o2[a2 - 1] = arguments[a2];
      s3(i2, ...o2);
    }
  }, info: function() {
    for (var t2 = arguments.length, i3 = new Array(t2), e3 = 0; e3 < t2; e3++) i3[e3] = arguments[e3];
    s2.k("log", ...i3);
  }, warn: function() {
    for (var t2 = arguments.length, i3 = new Array(t2), e3 = 0; e3 < t2; e3++) i3[e3] = arguments[e3];
    s2.k("warn", ...i3);
  }, error: function() {
    for (var t2 = arguments.length, i3 = new Array(t2), e3 = 0; e3 < t2; e3++) i3[e3] = arguments[e3];
    s2.k("error", ...i3);
  }, critical: function() {
    for (var t2 = arguments.length, e3 = new Array(t2), r3 = 0; r3 < t2; r3++) e3[r3] = arguments[r3];
    console.error(i2, ...e3);
  }, uninitializedWarning: (t2) => {
    s2.error("You must initialize PostHog before calling " + t2);
  }, createLogger: (t2, e3) => Ei(i2 + " " + t2, e3) };
  return s2;
}, $i = Ei("[PostHog.js]"), Si = $i.createLogger, ki = Si("[ExternalScriptsLoader]"), Pi = (t2, i2, e2) => {
  if (t2.config.disable_external_dependency_loading) return ki.warn(i2 + " was requested but loading of external scripts is disabled."), e2("Loading of external scripts is disabled");
  var r2 = null == o ? void 0 : o.querySelectorAll("script");
  if (r2) {
    for (var s2, n2 = function() {
      if (r2[a2].src === i2) {
        var t3 = r2[a2];
        return t3.__posthog_loading_callback_fired ? { v: e2() } : (t3.addEventListener("load", (i3) => {
          t3.__posthog_loading_callback_fired = true, e2(void 0, i3);
        }), t3.onerror = (t4) => e2(t4), { v: void 0 });
      }
    }, a2 = 0; a2 < r2.length; a2++) if (s2 = n2()) return s2.v;
  }
  var l2 = () => {
    if (!o) return e2("document not found");
    var r3 = o.createElement("script");
    if (r3.type = "text/javascript", r3.crossOrigin = "anonymous", r3.src = i2, r3.onload = (t3) => {
      r3.__posthog_loading_callback_fired = true, e2(void 0, t3);
    }, r3.onerror = (t3) => e2(t3), t2.config.prepare_external_dependency_script && (r3 = t2.config.prepare_external_dependency_script(r3)), !r3) return e2("prepare_external_dependency_script returned null");
    if ("head" === t2.config.external_scripts_inject_target) o.head.appendChild(r3);
    else {
      var s3, n3 = o.querySelectorAll("body > script");
      if (n3.length > 0) null == (s3 = n3[0].parentNode) || s3.insertBefore(r3, n3[0]);
      else o.body.appendChild(r3);
    }
  };
  null != o && o.body ? l2() : null == o || o.addEventListener("DOMContentLoaded", l2);
};
v.__PosthogExtensions__ = v.__PosthogExtensions__ || {}, v.__PosthogExtensions__.loadExternalDependency = (t2, i2, e2) => {
  var r2 = "/static/" + i2 + ".js?v=" + t2.version;
  if ("remote-config" === i2 && (r2 = "/array/" + t2.config.token + "/config.js"), "toolbar" === i2) {
    var s2 = 3e5;
    r2 = r2 + "&t=" + Math.floor(Date.now() / s2) * s2;
  }
  var n2 = t2.requestRouter.endpointFor("assets", r2);
  Pi(t2, n2, e2);
}, v.__PosthogExtensions__.loadSiteApp = (t2, i2, e2) => {
  var r2 = t2.requestRouter.endpointFor("api", i2);
  Pi(t2, r2, e2);
};
var Ti = {};
function Ii(t2, i2, e2) {
  if (I(t2)) {
    if (r && t2.forEach === r) t2.forEach(i2, e2);
    else if ("length" in t2 && t2.length === +t2.length) {
      for (var s2 = 0, n2 = t2.length; s2 < n2; s2++) if (s2 in t2 && i2.call(e2, t2[s2], s2) === Ti) return;
    }
  }
}
function Ci(t2, i2, e2) {
  if (!j(t2)) {
    if (I(t2)) return Ii(t2, i2, e2);
    if (z(t2)) {
      for (var r2 of t2.entries()) if (i2.call(e2, r2[1], r2[0]) === Ti) return;
    } else for (var s2 in t2) if (P.call(t2, s2) && i2.call(e2, t2[s2], s2) === Ti) return;
  }
}
var Ri = function(t2) {
  for (var i2 = arguments.length, e2 = new Array(i2 > 1 ? i2 - 1 : 0), r2 = 1; r2 < i2; r2++) e2[r2 - 1] = arguments[r2];
  return Ii(e2, function(i3) {
    for (var e3 in i3) void 0 !== i3[e3] && (t2[e3] = i3[e3]);
  }), t2;
}, Fi = function(t2) {
  for (var i2 = arguments.length, e2 = new Array(i2 > 1 ? i2 - 1 : 0), r2 = 1; r2 < i2; r2++) e2[r2 - 1] = arguments[r2];
  return Ii(e2, function(i3) {
    Ii(i3, function(i4) {
      t2.push(i4);
    });
  }), t2;
};
function Mi(t2) {
  for (var i2 = Object.keys(t2), e2 = i2.length, r2 = new Array(e2); e2--; ) r2[e2] = [i2[e2], t2[i2[e2]]];
  return r2;
}
var Oi = function(t2) {
  try {
    return t2();
  } catch (t3) {
    return;
  }
}, Ai = function(t2) {
  return function() {
    try {
      for (var i2 = arguments.length, e2 = new Array(i2), r2 = 0; r2 < i2; r2++) e2[r2] = arguments[r2];
      return t2.apply(this, e2);
    } catch (t3) {
      $i.critical("Implementation error. Please turn on debug mode and open a ticket on https://app.posthog.com/home#panel=support%3Asupport%3A."), $i.critical(t3);
    }
  };
}, Di = function(t2) {
  var i2 = {};
  return Ci(t2, function(t3, e2) {
    (O(t3) && t3.length > 0 || L(t3)) && (i2[e2] = t3);
  }), i2;
};
function ji(t2, i2) {
  return e2 = t2, r2 = (t3) => O(t3) && !D(i2) ? t3.slice(0, i2) : t3, s2 = /* @__PURE__ */ new Set(), function t3(i3, e3) {
    return i3 !== Object(i3) ? r2 ? r2(i3, e3) : i3 : s2.has(i3) ? void 0 : (s2.add(i3), I(i3) ? (n2 = [], Ii(i3, (i4) => {
      n2.push(t3(i4));
    })) : (n2 = {}, Ci(i3, (i4, e4) => {
      s2.has(i4) || (n2[e4] = t3(i4, e4));
    })), n2);
    var n2;
  }(e2);
  var e2, r2, s2;
}
var Li = ["herokuapp.com", "vercel.app", "netlify.app"];
function Ni(t2) {
  var i2 = null == t2 ? void 0 : t2.hostname;
  if (!O(i2)) return false;
  var e2 = i2.split(".").slice(-2).join(".");
  for (var r2 of Li) if (e2 === r2) return false;
  return true;
}
function Ui(t2, i2) {
  for (var e2 = 0; e2 < t2.length; e2++) if (i2(t2[e2])) return t2[e2];
}
function zi(t2, i2, e2, r2) {
  var { capture: s2 = false, passive: n2 = true } = null != r2 ? r2 : {};
  null == t2 || t2.addEventListener(i2, e2, { capture: s2, passive: n2 });
}
var Hi = "$people_distinct_id", Bi = "__alias", qi = "__timers", Wi = "$autocapture_disabled_server_side", Gi = "$heatmaps_enabled_server_side", Vi = "$exception_capture_enabled_server_side", Ji = "$error_tracking_suppression_rules", Ki = "$error_tracking_capture_extension_exceptions", Yi = "$web_vitals_enabled_server_side", Xi = "$dead_clicks_enabled_server_side", Qi = "$product_tours_enabled_server_side", Zi = "$web_vitals_allowed_metrics", te = "$session_recording_remote_config", ie = "$sesid", ee = "$session_is_sampled", re = "$enabled_feature_flags", se = "$early_access_features", ne = "$feature_flag_details", oe = "$stored_person_properties", ae = "$stored_group_properties", le = "$surveys", ue = "$flag_call_reported", he = "$user_state", de = "$client_session_props", ve = "$capture_rate_limit", ce = "$initial_campaign_params", fe = "$initial_referrer_info", pe = "$initial_person_info", ge = "$epp", _e = "__POSTHOG_TOOLBAR__", me = "$posthog_cookieless", ye = [Hi, Bi, "__cmpns", qi, "$session_recording_enabled_server_side", Gi, ie, re, Ji, he, se, ne, ae, oe, le, ue, de, ve, ce, fe, ge, pe, "$conversations_widget_session_id", "$conversations_ticket_id", "$conversations_widget_state", "$conversations_user_traits"];
function be(t2) {
  return t2 instanceof Element && (t2.id === _e || !(null == t2.closest || !t2.closest(".toolbar-global-fade-container")));
}
function we(t2) {
  return !!t2 && 1 === t2.nodeType;
}
function xe(t2, i2) {
  return !!t2 && !!t2.tagName && t2.tagName.toLowerCase() === i2.toLowerCase();
}
function Ee(t2) {
  return !!t2 && 3 === t2.nodeType;
}
function $e(t2) {
  return !!t2 && 11 === t2.nodeType;
}
function Se(t2) {
  return t2 ? x(t2).split(/\s+/) : [];
}
function ke(i2) {
  var e2 = null == t ? void 0 : t.location.href;
  return !!(e2 && i2 && i2.some((t2) => e2.match(t2)));
}
function Pe(t2) {
  var i2 = "";
  switch (typeof t2.className) {
    case "string":
      i2 = t2.className;
      break;
    case "object":
      i2 = (t2.className && "baseVal" in t2.className ? t2.className.baseVal : null) || t2.getAttribute("class") || "";
      break;
    default:
      i2 = "";
  }
  return Se(i2);
}
function Te(t2) {
  return j(t2) ? null : x(t2).split(/(\s+)/).filter((t3) => Ke(t3)).join("").replace(/[\r\n]/g, " ").replace(/[ ]+/g, " ").substring(0, 255);
}
function Ie(t2) {
  var i2 = "";
  return ze(t2) && !He(t2) && t2.childNodes && t2.childNodes.length && Ci(t2.childNodes, function(t3) {
    var e2;
    Ee(t3) && t3.textContent && (i2 += null !== (e2 = Te(t3.textContent)) && void 0 !== e2 ? e2 : "");
  }), x(i2);
}
function Ce(t2) {
  return M(t2.target) ? t2.srcElement || null : null != (i2 = t2.target) && i2.shadowRoot ? t2.composedPath()[0] || null : t2.target || null;
  var i2;
}
var Re = ["a", "button", "form", "input", "select", "textarea", "label"];
function Fe(t2, i2) {
  if (M(i2)) return true;
  var e2, r2 = function(t3) {
    if (i2.some((i3) => t3.matches(i3))) return { v: true };
  };
  for (var s2 of t2) if (e2 = r2(s2)) return e2.v;
  return false;
}
function Me(t2) {
  var i2 = t2.parentNode;
  return !(!i2 || !we(i2)) && i2;
}
var Oe = ["next", "previous", "prev", ">", "<"], Ae = 10;
var De = [".ph-no-rageclick", ".ph-no-capture"];
function je(i2, e2) {
  if (!t || Le(i2)) return false;
  var r2, s2, n2;
  U(e2) ? (r2 = !!e2 && De, s2 = void 0) : (r2 = null !== (n2 = null == e2 ? void 0 : e2.css_selector_ignorelist) && void 0 !== n2 ? n2 : De, s2 = null == e2 ? void 0 : e2.content_ignorelist);
  if (false === r2) return false;
  var { targetElementList: o2 } = Ne(i2, false);
  return !function(t2, i3) {
    if (false === t2 || M(t2)) return false;
    var e3;
    if (true === t2) e3 = Oe;
    else {
      if (!I(t2)) return false;
      if (t2.length > Ae) return $i.error("[PostHog] content_ignorelist array cannot exceed " + Ae + " items. Use css_selector_ignorelist for more complex matching."), false;
      e3 = t2.map((t3) => t3.toLowerCase());
    }
    return i3.some((t3) => {
      var { safeText: i4, ariaLabel: r3 } = t3;
      return e3.some((t4) => i4.includes(t4) || r3.includes(t4));
    });
  }(s2, o2.map((t2) => {
    var i3;
    return { safeText: Ie(t2).toLowerCase(), ariaLabel: (null == (i3 = t2.getAttribute("aria-label")) ? void 0 : i3.toLowerCase().trim()) || "" };
  })) && !Fe(o2, r2);
}
var Le = (t2) => !t2 || xe(t2, "html") || !we(t2), Ne = (i2, e2) => {
  if (!t || Le(i2)) return { parentIsUsefulElement: false, targetElementList: [] };
  for (var r2 = false, s2 = [i2], n2 = i2; n2.parentNode && !xe(n2, "body"); ) if ($e(n2.parentNode)) s2.push(n2.parentNode.host), n2 = n2.parentNode.host;
  else {
    var o2 = Me(n2);
    if (!o2) break;
    if (e2 || Re.indexOf(o2.tagName.toLowerCase()) > -1) r2 = true;
    else {
      var a2 = t.getComputedStyle(o2);
      a2 && "pointer" === a2.getPropertyValue("cursor") && (r2 = true);
    }
    s2.push(o2), n2 = o2;
  }
  return { parentIsUsefulElement: r2, targetElementList: s2 };
};
function Ue(i2, e2, r2, s2, n2) {
  var o2, a2, l2, u2;
  if (void 0 === r2 && (r2 = void 0), !t || Le(i2)) return false;
  if (null != (o2 = r2) && o2.url_allowlist && !ke(r2.url_allowlist)) return false;
  if (null != (a2 = r2) && a2.url_ignorelist && ke(r2.url_ignorelist)) return false;
  if (null != (l2 = r2) && l2.dom_event_allowlist) {
    var h2 = r2.dom_event_allowlist;
    if (h2 && !h2.some((t2) => e2.type === t2)) return false;
  }
  var { parentIsUsefulElement: d2, targetElementList: v2 } = Ne(i2, s2);
  if (!function(t2, i3) {
    var e3 = null == i3 ? void 0 : i3.element_allowlist;
    if (M(e3)) return true;
    var r3, s3 = function(t3) {
      if (e3.some((i4) => t3.tagName.toLowerCase() === i4)) return { v: true };
    };
    for (var n3 of t2) if (r3 = s3(n3)) return r3.v;
    return false;
  }(v2, r2)) return false;
  if (!Fe(v2, null == (u2 = r2) ? void 0 : u2.css_selector_allowlist)) return false;
  var c2 = t.getComputedStyle(i2);
  if (c2 && "pointer" === c2.getPropertyValue("cursor") && "click" === e2.type) return true;
  var f2 = i2.tagName.toLowerCase();
  switch (f2) {
    case "html":
      return false;
    case "form":
      return (n2 || ["submit"]).indexOf(e2.type) >= 0;
    case "input":
    case "select":
    case "textarea":
      return (n2 || ["change", "click"]).indexOf(e2.type) >= 0;
    default:
      return d2 ? (n2 || ["click"]).indexOf(e2.type) >= 0 : (n2 || ["click"]).indexOf(e2.type) >= 0 && (Re.indexOf(f2) > -1 || "true" === i2.getAttribute("contenteditable"));
  }
}
function ze(t2) {
  for (var i2 = t2; i2.parentNode && !xe(i2, "body"); i2 = i2.parentNode) {
    var e2 = Pe(i2);
    if (w(e2, "ph-sensitive") || w(e2, "ph-no-capture")) return false;
  }
  if (w(Pe(t2), "ph-include")) return true;
  var r2 = t2.type || "";
  if (O(r2)) switch (r2.toLowerCase()) {
    case "hidden":
    case "password":
      return false;
  }
  var s2 = t2.name || t2.id || "";
  if (O(s2)) {
    if (/^cc|cardnum|ccnum|creditcard|csc|cvc|cvv|exp|pass|pwd|routing|seccode|securitycode|securitynum|socialsec|socsec|ssn/i.test(s2.replace(/[^a-zA-Z0-9]/g, ""))) return false;
  }
  return true;
}
function He(t2) {
  return !!(xe(t2, "input") && !["button", "checkbox", "submit", "reset"].includes(t2.type) || xe(t2, "select") || xe(t2, "textarea") || "true" === t2.getAttribute("contenteditable"));
}
var Be = "(4[0-9]{12}(?:[0-9]{3})?)|(5[1-5][0-9]{14})|(6(?:011|5[0-9]{2})[0-9]{12})|(3[47][0-9]{13})|(3(?:0[0-5]|[68][0-9])[0-9]{11})|((?:2131|1800|35[0-9]{3})[0-9]{11})", qe = new RegExp("^(?:" + Be + ")$"), We = new RegExp(Be), Ge = "\\d{3}-?\\d{2}-?\\d{4}", Ve = new RegExp("^(" + Ge + ")$"), Je = new RegExp("(" + Ge + ")");
function Ke(t2, i2) {
  if (void 0 === i2 && (i2 = true), j(t2)) return false;
  if (O(t2)) {
    if (t2 = x(t2), (i2 ? qe : We).test((t2 || "").replace(/[- ]/g, ""))) return false;
    if ((i2 ? Ve : Je).test(t2)) return false;
  }
  return true;
}
function Ye(t2) {
  var i2 = Ie(t2);
  return Ke(i2 = (i2 + " " + Xe(t2)).trim()) ? i2 : "";
}
function Xe(t2) {
  var i2 = "";
  return t2 && t2.childNodes && t2.childNodes.length && Ci(t2.childNodes, function(t3) {
    var e2;
    if (t3 && "span" === (null == (e2 = t3.tagName) ? void 0 : e2.toLowerCase())) try {
      var r2 = Ie(t3);
      i2 = (i2 + " " + r2).trim(), t3.childNodes && t3.childNodes.length && (i2 = (i2 + " " + Xe(t3)).trim());
    } catch (t4) {
      $i.error("[AutoCapture]", t4);
    }
  }), i2;
}
function Qe(t2) {
  return function(t3) {
    var i2 = t3.map((t4) => {
      var i3, e2, r2 = "";
      if (t4.tag_name && (r2 += t4.tag_name), t4.attr_class) for (var s2 of (t4.attr_class.sort(), t4.attr_class)) r2 += "." + s2.replace(/"/g, "");
      var n2 = g({}, t4.text ? { text: t4.text } : {}, { "nth-child": null !== (i3 = t4.nth_child) && void 0 !== i3 ? i3 : 0, "nth-of-type": null !== (e2 = t4.nth_of_type) && void 0 !== e2 ? e2 : 0 }, t4.href ? { href: t4.href } : {}, t4.attr_id ? { attr_id: t4.attr_id } : {}, t4.attributes), o2 = {};
      return Mi(n2).sort((t5, i4) => {
        var [e3] = t5, [r3] = i4;
        return e3.localeCompare(r3);
      }).forEach((t5) => {
        var [i4, e3] = t5;
        return o2[Ze(i4.toString())] = Ze(e3.toString());
      }), r2 += ":", r2 += Mi(o2).map((t5) => {
        var [i4, e3] = t5;
        return i4 + '="' + e3 + '"';
      }).join("");
    });
    return i2.join(";");
  }(function(t3) {
    return t3.map((t4) => {
      var i2, e2, r2 = { text: null == (i2 = t4.$el_text) ? void 0 : i2.slice(0, 400), tag_name: t4.tag_name, href: null == (e2 = t4.attr__href) ? void 0 : e2.slice(0, 2048), attr_class: tr(t4), attr_id: t4.attr__id, nth_child: t4.nth_child, nth_of_type: t4.nth_of_type, attributes: {} };
      return Mi(t4).filter((t5) => {
        var [i3] = t5;
        return 0 === i3.indexOf("attr__");
      }).forEach((t5) => {
        var [i3, e3] = t5;
        return r2.attributes[i3] = e3;
      }), r2;
    });
  }(t2));
}
function Ze(t2) {
  return t2.replace(/"|\\"/g, '\\"');
}
function tr(t2) {
  var i2 = t2.attr__class;
  return i2 ? I(i2) ? i2 : Se(i2) : void 0;
}
class ir {
  constructor(t2) {
    this.disabled = false === t2;
    var i2 = R(t2) ? t2 : {};
    this.thresholdPx = i2.threshold_px || 30, this.timeoutMs = i2.timeout_ms || 1e3, this.clickCount = i2.click_count || 3, this.clicks = [];
  }
  isRageClick(t2, i2, e2) {
    if (this.disabled) return false;
    var r2 = this.clicks[this.clicks.length - 1];
    if (r2 && Math.abs(t2 - r2.x) + Math.abs(i2 - r2.y) < this.thresholdPx && e2 - r2.timestamp < this.timeoutMs) {
      if (this.clicks.push({ x: t2, y: i2, timestamp: e2 }), this.clicks.length === this.clickCount) return true;
    } else this.clicks = [{ x: t2, y: i2, timestamp: e2 }];
    return false;
  }
}
var er = (t2) => {
  var i2 = null == o ? void 0 : o.createElement("a");
  return M(i2) ? null : (i2.href = t2, i2);
}, rr = function(t2, i2) {
  var e2, r2;
  void 0 === i2 && (i2 = "&");
  var s2 = [];
  return Ci(t2, function(t3, i3) {
    M(t3) || M(i3) || "undefined" === i3 || (e2 = encodeURIComponent(((t4) => t4 instanceof File)(t3) ? t3.name : t3.toString()), r2 = encodeURIComponent(i3), s2[s2.length] = r2 + "=" + e2);
  }), s2.join(i2);
}, sr = function(t2, i2) {
  for (var e2, r2 = ((t2.split("#")[0] || "").split(/\?(.*)/)[1] || "").replace(/^\?+/g, "").split("&"), s2 = 0; s2 < r2.length; s2++) {
    var n2 = r2[s2].split("=");
    if (n2[0] === i2) {
      e2 = n2;
      break;
    }
  }
  if (!I(e2) || e2.length < 2) return "";
  var o2 = e2[1];
  try {
    o2 = decodeURIComponent(o2);
  } catch (t3) {
    $i.error("Skipping decoding for malformed query param: " + o2);
  }
  return o2.replace(/\+/g, " ");
}, nr = function(t2, i2, e2) {
  if (!t2 || !i2 || !i2.length) return t2;
  for (var r2 = t2.split("#"), s2 = r2[0] || "", n2 = r2[1], o2 = s2.split("?"), a2 = o2[1], l2 = o2[0], u2 = (a2 || "").split("&"), h2 = [], d2 = 0; d2 < u2.length; d2++) {
    var v2 = u2[d2].split("=");
    I(v2) && (i2.includes(v2[0]) ? h2.push(v2[0] + "=" + e2) : h2.push(u2[d2]));
  }
  var c2 = l2;
  return null != a2 && (c2 += "?" + h2.join("&")), null != n2 && (c2 += "#" + n2), c2;
}, or = function(t2, i2) {
  var e2 = t2.match(new RegExp(i2 + "=([^&]*)"));
  return e2 ? e2[1] : null;
}, ar = "$copy_autocapture", lr = Si("[AutoCapture]");
function ur(t2, i2) {
  return i2.length > t2 ? i2.slice(0, t2) + "..." : i2;
}
function hr(t2) {
  if (t2.previousElementSibling) return t2.previousElementSibling;
  var i2 = t2;
  do {
    i2 = i2.previousSibling;
  } while (i2 && !we(i2));
  return i2;
}
function dr(t2, i2, e2, r2) {
  var s2 = t2.tagName.toLowerCase(), n2 = { tag_name: s2 };
  Re.indexOf(s2) > -1 && !e2 && ("a" === s2.toLowerCase() || "button" === s2.toLowerCase() ? n2.$el_text = ur(1024, Ye(t2)) : n2.$el_text = ur(1024, Ie(t2)));
  var o2 = Pe(t2);
  o2.length > 0 && (n2.classes = o2.filter(function(t3) {
    return "" !== t3;
  })), Ci(t2.attributes, function(e3) {
    var s3;
    if ((!He(t2) || -1 !== ["name", "id", "class", "aria-label"].indexOf(e3.name)) && ((null == r2 || !r2.includes(e3.name)) && !i2 && Ke(e3.value) && (s3 = e3.name, !O(s3) || "_ngcontent" !== s3.substring(0, 10) && "_nghost" !== s3.substring(0, 7)))) {
      var o3 = e3.value;
      "class" === e3.name && (o3 = Se(o3).join(" ")), n2["attr__" + e3.name] = ur(1024, o3);
    }
  });
  for (var a2 = 1, l2 = 1, u2 = t2; u2 = hr(u2); ) a2++, u2.tagName === t2.tagName && l2++;
  return n2.nth_child = a2, n2.nth_of_type = l2, n2;
}
function vr(i2, e2) {
  for (var r2, s2, { e: n2, maskAllElementAttributes: o2, maskAllText: a2, elementAttributeIgnoreList: l2, elementsChainAsString: u2 } = e2, h2 = [i2], d2 = i2; d2.parentNode && !xe(d2, "body"); ) $e(d2.parentNode) ? (h2.push(d2.parentNode.host), d2 = d2.parentNode.host) : (h2.push(d2.parentNode), d2 = d2.parentNode);
  var v2, c2 = [], f2 = {}, p2 = false, g2 = false;
  if (Ci(h2, (t2) => {
    var i3 = ze(t2);
    "a" === t2.tagName.toLowerCase() && (p2 = t2.getAttribute("href"), p2 = i3 && p2 && Ke(p2) && p2), w(Pe(t2), "ph-no-capture") && (g2 = true), c2.push(dr(t2, o2, a2, l2));
    var e3 = function(t3) {
      if (!ze(t3)) return {};
      var i4 = {};
      return Ci(t3.attributes, function(t4) {
        if (t4.name && 0 === t4.name.indexOf("data-ph-capture-attribute")) {
          var e4 = t4.name.replace("data-ph-capture-attribute-", ""), r3 = t4.value;
          e4 && r3 && Ke(r3) && (i4[e4] = r3);
        }
      }), i4;
    }(t2);
    Ri(f2, e3);
  }), g2) return { props: {}, explicitNoCapture: g2 };
  if (a2 || ("a" === i2.tagName.toLowerCase() || "button" === i2.tagName.toLowerCase() ? c2[0].$el_text = Ye(i2) : c2[0].$el_text = Ie(i2)), p2) {
    var _2, m2;
    c2[0].attr__href = p2;
    var y2 = null == (_2 = er(p2)) ? void 0 : _2.host, b2 = null == t || null == (m2 = t.location) ? void 0 : m2.host;
    y2 && b2 && y2 !== b2 && (v2 = p2);
  }
  return { props: Ri({ $event_type: n2.type, $ce_version: 1 }, u2 ? {} : { $elements: c2 }, { $elements_chain: Qe(c2) }, null != (r2 = c2[0]) && r2.$el_text ? { $el_text: null == (s2 = c2[0]) ? void 0 : s2.$el_text } : {}, v2 && "click" === n2.type ? { $external_click_url: v2 } : {}, f2) };
}
class cr {
  constructor(t2) {
    this.P = false, this.T = null, this.I = false, this.instance = t2, this.rageclicks = new ir(t2.config.rageclick), this.C = null;
  }
  get R() {
    var t2, i2, e2 = R(this.instance.config.autocapture) ? this.instance.config.autocapture : {};
    return e2.url_allowlist = null == (t2 = e2.url_allowlist) ? void 0 : t2.map((t3) => new RegExp(t3)), e2.url_ignorelist = null == (i2 = e2.url_ignorelist) ? void 0 : i2.map((t3) => new RegExp(t3)), e2;
  }
  F() {
    if (this.isBrowserSupported()) {
      if (t && o) {
        var i2 = (i3) => {
          i3 = i3 || (null == t ? void 0 : t.event);
          try {
            this.M(i3);
          } catch (t2) {
            lr.error("Failed to capture event", t2);
          }
        };
        if (zi(o, "submit", i2, { capture: true }), zi(o, "change", i2, { capture: true }), zi(o, "click", i2, { capture: true }), this.R.capture_copied_text) {
          var e2 = (i3) => {
            i3 = i3 || (null == t ? void 0 : t.event), this.M(i3, ar);
          };
          zi(o, "copy", e2, { capture: true }), zi(o, "cut", e2, { capture: true });
        }
      }
    } else lr.info("Disabling Automatic Event Collection because this browser is not supported");
  }
  startIfEnabled() {
    this.isEnabled && !this.P && (this.F(), this.P = true);
  }
  onRemoteConfig(t2) {
    t2.elementsChainAsString && (this.I = t2.elementsChainAsString), this.instance.persistence && this.instance.persistence.register({ [Wi]: !!t2.autocapture_opt_out }), this.T = !!t2.autocapture_opt_out, this.startIfEnabled();
  }
  setElementSelectors(t2) {
    this.C = t2;
  }
  getElementSelectors(t2) {
    var i2, e2 = [];
    return null == (i2 = this.C) || i2.forEach((i3) => {
      var r2 = null == o ? void 0 : o.querySelectorAll(i3);
      null == r2 || r2.forEach((r3) => {
        t2 === r3 && e2.push(i3);
      });
    }), e2;
  }
  get isEnabled() {
    var t2, i2, e2 = null == (t2 = this.instance.persistence) ? void 0 : t2.props[Wi], r2 = this.T;
    if (D(r2) && !U(e2) && !this.instance.O()) return false;
    var s2 = null !== (i2 = this.T) && void 0 !== i2 ? i2 : !!e2;
    return !!this.instance.config.autocapture && !s2;
  }
  M(i2, e2) {
    if (void 0 === e2 && (e2 = "$autocapture"), this.isEnabled) {
      var r2, s2 = Ce(i2);
      if (Ee(s2) && (s2 = s2.parentNode || null), "$autocapture" === e2 && "click" === i2.type && i2 instanceof MouseEvent) this.instance.config.rageclick && null != (r2 = this.rageclicks) && r2.isRageClick(i2.clientX, i2.clientY, i2.timeStamp || (/* @__PURE__ */ new Date()).getTime()) && je(s2, this.instance.config.rageclick) && this.M(i2, "$rageclick");
      var n2 = e2 === ar;
      if (s2 && Ue(s2, i2, this.R, n2, n2 ? ["copy", "cut"] : void 0)) {
        var { props: o2, explicitNoCapture: a2 } = vr(s2, { e: i2, maskAllElementAttributes: this.instance.config.mask_all_element_attributes, maskAllText: this.instance.config.mask_all_text, elementAttributeIgnoreList: this.R.element_attribute_ignorelist, elementsChainAsString: this.I });
        if (a2) return false;
        var l2 = this.getElementSelectors(s2);
        if (l2 && l2.length > 0 && (o2.$element_selectors = l2), e2 === ar) {
          var u2, h2 = Te(null == t || null == (u2 = t.getSelection()) ? void 0 : u2.toString()), d2 = i2.type || "clipboard";
          if (!h2) return false;
          o2.$selected_content = h2, o2.$copy_type = d2;
        }
        return this.instance.capture(e2, o2), true;
      }
    }
  }
  isBrowserSupported() {
    return C(null == o ? void 0 : o.querySelectorAll);
  }
}
Math.trunc || (Math.trunc = function(t2) {
  return t2 < 0 ? Math.ceil(t2) : Math.floor(t2);
}), Number.isInteger || (Number.isInteger = function(t2) {
  return L(t2) && isFinite(t2) && Math.floor(t2) === t2;
});
var fr = "0123456789abcdef";
class pr {
  constructor(t2) {
    if (this.bytes = t2, 16 !== t2.length) throw new TypeError("not 128-bit length");
  }
  static fromFieldsV7(t2, i2, e2, r2) {
    if (!Number.isInteger(t2) || !Number.isInteger(i2) || !Number.isInteger(e2) || !Number.isInteger(r2) || t2 < 0 || i2 < 0 || e2 < 0 || r2 < 0 || t2 > 281474976710655 || i2 > 4095 || e2 > 1073741823 || r2 > 4294967295) throw new RangeError("invalid field value");
    var s2 = new Uint8Array(16);
    return s2[0] = t2 / Math.pow(2, 40), s2[1] = t2 / Math.pow(2, 32), s2[2] = t2 / Math.pow(2, 24), s2[3] = t2 / Math.pow(2, 16), s2[4] = t2 / Math.pow(2, 8), s2[5] = t2, s2[6] = 112 | i2 >>> 8, s2[7] = i2, s2[8] = 128 | e2 >>> 24, s2[9] = e2 >>> 16, s2[10] = e2 >>> 8, s2[11] = e2, s2[12] = r2 >>> 24, s2[13] = r2 >>> 16, s2[14] = r2 >>> 8, s2[15] = r2, new pr(s2);
  }
  toString() {
    for (var t2 = "", i2 = 0; i2 < this.bytes.length; i2++) t2 = t2 + fr.charAt(this.bytes[i2] >>> 4) + fr.charAt(15 & this.bytes[i2]), 3 !== i2 && 5 !== i2 && 7 !== i2 && 9 !== i2 || (t2 += "-");
    if (36 !== t2.length) throw new Error("Invalid UUIDv7 was generated");
    return t2;
  }
  clone() {
    return new pr(this.bytes.slice(0));
  }
  equals(t2) {
    return 0 === this.compareTo(t2);
  }
  compareTo(t2) {
    for (var i2 = 0; i2 < 16; i2++) {
      var e2 = this.bytes[i2] - t2.bytes[i2];
      if (0 !== e2) return Math.sign(e2);
    }
    return 0;
  }
}
class gr {
  constructor() {
    this.A = 0, this.D = 0, this.j = new yr();
  }
  generate() {
    var t2 = this.generateOrAbort();
    if (M(t2)) {
      this.A = 0;
      var i2 = this.generateOrAbort();
      if (M(i2)) throw new Error("Could not generate UUID after timestamp reset");
      return i2;
    }
    return t2;
  }
  generateOrAbort() {
    var t2 = Date.now();
    if (t2 > this.A) this.A = t2, this.L();
    else {
      if (!(t2 + 1e4 > this.A)) return;
      this.D++, this.D > 4398046511103 && (this.A++, this.L());
    }
    return pr.fromFieldsV7(this.A, Math.trunc(this.D / Math.pow(2, 30)), this.D & Math.pow(2, 30) - 1, this.j.nextUint32());
  }
  L() {
    this.D = 1024 * this.j.nextUint32() + (1023 & this.j.nextUint32());
  }
}
var _r, mr = (t2) => {
  if ("undefined" != typeof UUIDV7_DENY_WEAK_RNG && UUIDV7_DENY_WEAK_RNG) throw new Error("no cryptographically strong RNG available");
  for (var i2 = 0; i2 < t2.length; i2++) t2[i2] = 65536 * Math.trunc(65536 * Math.random()) + Math.trunc(65536 * Math.random());
  return t2;
};
t && !M(t.crypto) && crypto.getRandomValues && (mr = (t2) => crypto.getRandomValues(t2));
class yr {
  constructor() {
    this.N = new Uint32Array(8), this.U = 1 / 0;
  }
  nextUint32() {
    return this.U >= this.N.length && (mr(this.N), this.U = 0), this.N[this.U++];
  }
}
var br = () => wr().toString(), wr = () => (_r || (_r = new gr())).generate(), xr = "";
var Er = /[a-z0-9][a-z0-9-]+\.[a-z]{2,}$/i;
function $r(t2, i2) {
  if (i2) {
    var e2 = function(t3, i3) {
      if (void 0 === i3 && (i3 = o), xr) return xr;
      if (!i3) return "";
      if (["localhost", "127.0.0.1"].includes(t3)) return "";
      for (var e3 = t3.split("."), r3 = Math.min(e3.length, 8), s2 = "dmn_chk_" + br(); !xr && r3--; ) {
        var n2 = e3.slice(r3).join("."), a2 = s2 + "=1;domain=." + n2 + ";path=/";
        i3.cookie = a2 + ";max-age=3", i3.cookie.includes(s2) && (i3.cookie = a2 + ";max-age=0", xr = n2);
      }
      return xr;
    }(t2);
    if (!e2) {
      var r2 = ((t3) => {
        var i3 = t3.match(Er);
        return i3 ? i3[0] : "";
      })(t2);
      r2 !== e2 && $i.info("Warning: cookie subdomain discovery mismatch", r2, e2), e2 = r2;
    }
    return e2 ? "; domain=." + e2 : "";
  }
  return "";
}
var Sr = { H: () => !!o, B: function(t2) {
  $i.error("cookieStore error: " + t2);
}, q: function(t2) {
  if (o) {
    try {
      for (var i2 = t2 + "=", e2 = o.cookie.split(";").filter((t3) => t3.length), r2 = 0; r2 < e2.length; r2++) {
        for (var s2 = e2[r2]; " " == s2.charAt(0); ) s2 = s2.substring(1, s2.length);
        if (0 === s2.indexOf(i2)) return decodeURIComponent(s2.substring(i2.length, s2.length));
      }
    } catch (t3) {
    }
    return null;
  }
}, W: function(t2) {
  var i2;
  try {
    i2 = JSON.parse(Sr.q(t2)) || {};
  } catch (t3) {
  }
  return i2;
}, G: function(t2, i2, e2, r2, s2) {
  if (o) try {
    var n2 = "", a2 = "", l2 = $r(o.location.hostname, r2);
    if (e2) {
      var u2 = /* @__PURE__ */ new Date();
      u2.setTime(u2.getTime() + 24 * e2 * 60 * 60 * 1e3), n2 = "; expires=" + u2.toUTCString();
    }
    s2 && (a2 = "; secure");
    var h2 = t2 + "=" + encodeURIComponent(JSON.stringify(i2)) + n2 + "; SameSite=Lax; path=/" + l2 + a2;
    return h2.length > 3686.4 && $i.warn("cookieStore warning: large cookie, len=" + h2.length), o.cookie = h2, h2;
  } catch (t3) {
    return;
  }
}, V: function(t2, i2) {
  if (null != o && o.cookie) try {
    Sr.G(t2, "", -1, i2);
  } catch (t3) {
    return;
  }
} }, kr = null, Pr = { H: function() {
  if (!D(kr)) return kr;
  var i2 = true;
  if (M(t)) i2 = false;
  else try {
    var e2 = "__mplssupport__";
    Pr.G(e2, "xyz"), '"xyz"' !== Pr.q(e2) && (i2 = false), Pr.V(e2);
  } catch (t2) {
    i2 = false;
  }
  return i2 || $i.error("localStorage unsupported; falling back to cookie store"), kr = i2, i2;
}, B: function(t2) {
  $i.error("localStorage error: " + t2);
}, q: function(i2) {
  try {
    return null == t ? void 0 : t.localStorage.getItem(i2);
  } catch (t2) {
    Pr.B(t2);
  }
  return null;
}, W: function(t2) {
  try {
    return JSON.parse(Pr.q(t2)) || {};
  } catch (t3) {
  }
  return null;
}, G: function(i2, e2) {
  try {
    null == t || t.localStorage.setItem(i2, JSON.stringify(e2));
  } catch (t2) {
    Pr.B(t2);
  }
}, V: function(i2) {
  try {
    null == t || t.localStorage.removeItem(i2);
  } catch (t2) {
    Pr.B(t2);
  }
} }, Tr = ["$device_id", "distinct_id", ie, ee, ge, pe], Ir = {}, Cr = { H: function() {
  return true;
}, B: function(t2) {
  $i.error("memoryStorage error: " + t2);
}, q: function(t2) {
  return Ir[t2] || null;
}, W: function(t2) {
  return Ir[t2] || null;
}, G: function(t2, i2) {
  Ir[t2] = i2;
}, V: function(t2) {
  delete Ir[t2];
} }, Rr = null, Fr = { H: function() {
  if (!D(Rr)) return Rr;
  if (Rr = true, M(t)) Rr = false;
  else try {
    var i2 = "__support__";
    Fr.G(i2, "xyz"), '"xyz"' !== Fr.q(i2) && (Rr = false), Fr.V(i2);
  } catch (t2) {
    Rr = false;
  }
  return Rr;
}, B: function(t2) {
  $i.error("sessionStorage error: ", t2);
}, q: function(i2) {
  try {
    return null == t ? void 0 : t.sessionStorage.getItem(i2);
  } catch (t2) {
    Fr.B(t2);
  }
  return null;
}, W: function(t2) {
  try {
    return JSON.parse(Fr.q(t2)) || null;
  } catch (t3) {
  }
  return null;
}, G: function(i2, e2) {
  try {
    null == t || t.sessionStorage.setItem(i2, JSON.stringify(e2));
  } catch (t2) {
    Fr.B(t2);
  }
}, V: function(i2) {
  try {
    null == t || t.sessionStorage.removeItem(i2);
  } catch (t2) {
    Fr.B(t2);
  }
} }, Mr = function(t2) {
  return t2[t2.PENDING = -1] = "PENDING", t2[t2.DENIED = 0] = "DENIED", t2[t2.GRANTED = 1] = "GRANTED", t2;
}({});
class Or {
  constructor(t2) {
    this._instance = t2;
  }
  get R() {
    return this._instance.config;
  }
  get consent() {
    return this.J() ? Mr.DENIED : this.K;
  }
  isOptedOut() {
    return "always" === this.R.cookieless_mode || (this.consent === Mr.DENIED || this.consent === Mr.PENDING && (this.R.opt_out_capturing_by_default || "on_reject" === this.R.cookieless_mode));
  }
  isOptedIn() {
    return !this.isOptedOut();
  }
  isExplicitlyOptedOut() {
    return this.consent === Mr.DENIED;
  }
  optInOut(t2) {
    this.Y.G(this.X, t2 ? 1 : 0, this.R.cookie_expiration, this.R.cross_subdomain_cookie, this.R.secure_cookie);
  }
  reset() {
    this.Y.V(this.X, this.R.cross_subdomain_cookie);
  }
  get X() {
    var { token: t2, opt_out_capturing_cookie_prefix: i2, consent_persistence_name: e2 } = this._instance.config;
    return e2 || (i2 ? i2 + t2 : "__ph_opt_in_out_" + t2);
  }
  get K() {
    var t2 = this.Y.q(this.X);
    return V(t2) ? Mr.GRANTED : w(J, t2) ? Mr.DENIED : Mr.PENDING;
  }
  get Y() {
    if (!this.Z) {
      var t2 = this.R.opt_out_capturing_persistence_type;
      this.Z = "localStorage" === t2 ? Pr : Sr;
      var i2 = "localStorage" === t2 ? Sr : Pr;
      i2.q(this.X) && (this.Z.q(this.X) || this.optInOut(V(i2.q(this.X))), i2.V(this.X, this.R.cross_subdomain_cookie));
    }
    return this.Z;
  }
  J() {
    return !!this.R.respect_dnt && !!Ui([null == n ? void 0 : n.doNotTrack, null == n ? void 0 : n.msDoNotTrack, v.doNotTrack], (t2) => V(t2));
  }
}
var Ar = Si("[Dead Clicks]"), Dr = () => true, jr = (t2) => {
  var i2, e2 = !(null == (i2 = t2.instance.persistence) || !i2.get_property(Xi)), r2 = t2.instance.config.capture_dead_clicks;
  return U(r2) ? r2 : !!R(r2) || e2;
};
class Lr {
  get lazyLoadedDeadClicksAutocapture() {
    return this.tt;
  }
  constructor(t2, i2, e2) {
    this.instance = t2, this.isEnabled = i2, this.onCapture = e2, this.startIfEnabled();
  }
  onRemoteConfig(t2) {
    this.instance.persistence && this.instance.persistence.register({ [Xi]: null == t2 ? void 0 : t2.captureDeadClicks }), this.startIfEnabled();
  }
  startIfEnabled() {
    this.isEnabled(this) && this.it(() => {
      this.et();
    });
  }
  it(t2) {
    var i2, e2;
    null != (i2 = v.__PosthogExtensions__) && i2.initDeadClicksAutocapture && t2(), null == (e2 = v.__PosthogExtensions__) || null == e2.loadExternalDependency || e2.loadExternalDependency(this.instance, "dead-clicks-autocapture", (i3) => {
      i3 ? Ar.error("failed to load script", i3) : t2();
    });
  }
  et() {
    var t2;
    if (o) {
      if (!this.tt && null != (t2 = v.__PosthogExtensions__) && t2.initDeadClicksAutocapture) {
        var i2 = R(this.instance.config.capture_dead_clicks) ? this.instance.config.capture_dead_clicks : {};
        i2.__onCapture = this.onCapture, this.tt = v.__PosthogExtensions__.initDeadClicksAutocapture(this.instance, i2), this.tt.start(o), Ar.info("starting...");
      }
    } else Ar.error("`document` not found. Cannot start.");
  }
  stop() {
    this.tt && (this.tt.stop(), this.tt = void 0, Ar.info("stopping..."));
  }
}
var Nr = Si("[ExceptionAutocapture]");
class Ur {
  constructor(i2) {
    var e2, r2, s2;
    this.rt = () => {
      var i3;
      if (t && this.isEnabled && null != (i3 = v.__PosthogExtensions__) && i3.errorWrappingFunctions) {
        var e3 = v.__PosthogExtensions__.errorWrappingFunctions.wrapOnError, r3 = v.__PosthogExtensions__.errorWrappingFunctions.wrapUnhandledRejection, s3 = v.__PosthogExtensions__.errorWrappingFunctions.wrapConsoleError;
        try {
          !this.st && this.R.capture_unhandled_errors && (this.st = e3(this.captureException.bind(this))), !this.nt && this.R.capture_unhandled_rejections && (this.nt = r3(this.captureException.bind(this))), !this.ot && this.R.capture_console_errors && (this.ot = s3(this.captureException.bind(this)));
        } catch (t2) {
          Nr.error("failed to start", t2), this.ut();
        }
      }
    }, this._instance = i2, this.ht = !(null == (e2 = this._instance.persistence) || !e2.props[Vi]), this.dt = new Y({ refillRate: null !== (r2 = this._instance.config.error_tracking.__exceptionRateLimiterRefillRate) && void 0 !== r2 ? r2 : 1, bucketSize: null !== (s2 = this._instance.config.error_tracking.__exceptionRateLimiterBucketSize) && void 0 !== s2 ? s2 : 10, refillInterval: 1e4, h: Nr }), this.R = this.vt(), this.startIfEnabledOrStop();
  }
  vt() {
    var t2 = this._instance.config.capture_exceptions, i2 = { capture_unhandled_errors: false, capture_unhandled_rejections: false, capture_console_errors: false };
    return R(t2) ? i2 = g({}, i2, t2) : (M(t2) ? this.ht : t2) && (i2 = g({}, i2, { capture_unhandled_errors: true, capture_unhandled_rejections: true })), i2;
  }
  get isEnabled() {
    return this.R.capture_console_errors || this.R.capture_unhandled_errors || this.R.capture_unhandled_rejections;
  }
  startIfEnabledOrStop() {
    this.isEnabled ? (Nr.info("enabled"), this.ut(), this.it(this.rt)) : this.ut();
  }
  it(t2) {
    var i2, e2;
    null != (i2 = v.__PosthogExtensions__) && i2.errorWrappingFunctions && t2(), null == (e2 = v.__PosthogExtensions__) || null == e2.loadExternalDependency || e2.loadExternalDependency(this._instance, "exception-autocapture", (i3) => {
      if (i3) return Nr.error("failed to load script", i3);
      t2();
    });
  }
  ut() {
    var t2, i2, e2;
    null == (t2 = this.st) || t2.call(this), this.st = void 0, null == (i2 = this.nt) || i2.call(this), this.nt = void 0, null == (e2 = this.ot) || e2.call(this), this.ot = void 0;
  }
  onRemoteConfig(t2) {
    var i2 = t2.autocaptureExceptions;
    this.ht = !!i2 || false, this._instance.persistence && this._instance.persistence.register({ [Vi]: this.ht }), this.R = this.vt(), this.startIfEnabledOrStop();
  }
  onConfigChange() {
    this.R = this.vt();
  }
  captureException(t2) {
    var i2, e2, r2 = null !== (i2 = null == t2 || null == (e2 = t2.$exception_list) || null == (e2 = e2[0]) ? void 0 : e2.type) && void 0 !== i2 ? i2 : "Exception";
    this.dt.consumeRateLimit(r2) ? Nr.info("Skipping exception capture because of client rate limiting.", { exception: r2 }) : this._instance.exceptions.sendExceptionEvent(t2);
  }
}
function zr(t2, i2, e2) {
  try {
    if (!(i2 in t2)) return () => {
    };
    var r2 = t2[i2], s2 = e2(r2);
    return C(s2) && (s2.prototype = s2.prototype || {}, Object.defineProperties(s2, { __posthog_wrapped__: { enumerable: false, value: true } })), t2[i2] = s2, () => {
      t2[i2] = r2;
    };
  } catch (t3) {
    return () => {
    };
  }
}
class Hr {
  constructor(i2) {
    var e2;
    this._instance = i2, this.ct = (null == t || null == (e2 = t.location) ? void 0 : e2.pathname) || "";
  }
  get isEnabled() {
    return "history_change" === this._instance.config.capture_pageview;
  }
  startIfEnabled() {
    this.isEnabled && ($i.info("History API monitoring enabled, starting..."), this.monitorHistoryChanges());
  }
  stop() {
    this.ft && this.ft(), this.ft = void 0, $i.info("History API monitoring stopped");
  }
  monitorHistoryChanges() {
    var i2, e2;
    if (t && t.history) {
      var r2 = this;
      null != (i2 = t.history.pushState) && i2.__posthog_wrapped__ || zr(t.history, "pushState", (t2) => function(i3, e3, s2) {
        t2.call(this, i3, e3, s2), r2._t("pushState");
      }), null != (e2 = t.history.replaceState) && e2.__posthog_wrapped__ || zr(t.history, "replaceState", (t2) => function(i3, e3, s2) {
        t2.call(this, i3, e3, s2), r2._t("replaceState");
      }), this.yt();
    }
  }
  _t(i2) {
    try {
      var e2, r2 = null == t || null == (e2 = t.location) ? void 0 : e2.pathname;
      if (!r2) return;
      r2 !== this.ct && this.isEnabled && this._instance.capture("$pageview", { navigation_type: i2 }), this.ct = r2;
    } catch (t2) {
      $i.error("Error capturing " + i2 + " pageview", t2);
    }
  }
  yt() {
    if (!this.ft) {
      var i2 = () => {
        this._t("popstate");
      };
      zi(t, "popstate", i2), this.ft = () => {
        t && t.removeEventListener("popstate", i2);
      };
    }
  }
}
var Br = Si("[SegmentIntegration]");
function qr(t2, i2) {
  var e2 = t2.config.segment;
  if (!e2) return i2();
  !function(t3, i3) {
    var e3 = t3.config.segment;
    if (!e3) return i3();
    var r2 = (e4) => {
      var r3 = () => e4.anonymousId() || br();
      t3.config.get_device_id = r3, e4.id() && (t3.register({ distinct_id: e4.id(), $device_id: r3() }), t3.persistence.set_property(he, "identified")), i3();
    }, s2 = e3.user();
    "then" in s2 && C(s2.then) ? s2.then(r2) : r2(s2);
  }(t2, () => {
    e2.register(((t3) => {
      Promise && Promise.resolve || Br.warn("This browser does not have Promise support, and can not use the segment integration");
      var i3 = (i4, e3) => {
        if (!e3) return i4;
        i4.event.userId || i4.event.anonymousId === t3.get_distinct_id() || (Br.info("No userId set, resetting PostHog"), t3.reset()), i4.event.userId && i4.event.userId !== t3.get_distinct_id() && (Br.info("UserId set, identifying with PostHog"), t3.identify(i4.event.userId));
        var r2 = t3.calculateEventProperties(e3, i4.event.properties);
        return i4.event.properties = Object.assign({}, r2, i4.event.properties), i4;
      };
      return { name: "PostHog JS", type: "enrichment", version: "1.0.0", isLoaded: () => true, load: () => Promise.resolve(), track: (t4) => i3(t4, t4.event.event), page: (t4) => i3(t4, "$pageview"), identify: (t4) => i3(t4, "$identify"), screen: (t4) => i3(t4, "$screen") };
    })(t2)).then(() => {
      i2();
    });
  });
}
var Wr = "posthog-js";
function Gr(t2, i2) {
  var { organization: e2, projectId: r2, prefix: s2, severityAllowList: n2 = ["error"], sendExceptionsToPostHog: o2 = true } = void 0 === i2 ? {} : i2;
  return (i3) => {
    var a2, l2, u2, h2, d2;
    if (!("*" === n2 || n2.includes(i3.level)) || !t2.__loaded) return i3;
    i3.tags || (i3.tags = {});
    var v2 = t2.requestRouter.endpointFor("ui", "/project/" + t2.config.token + "/person/" + t2.get_distinct_id());
    i3.tags["PostHog Person URL"] = v2, t2.sessionRecordingStarted() && (i3.tags["PostHog Recording URL"] = t2.get_session_replay_url({ withTimestamp: true }));
    var c2 = (null == (a2 = i3.exception) ? void 0 : a2.values) || [], f2 = c2.map((t3) => g({}, t3, { stacktrace: t3.stacktrace ? g({}, t3.stacktrace, { type: "raw", frames: (t3.stacktrace.frames || []).map((t4) => g({}, t4, { platform: "web:javascript" })) }) : void 0 })), p2 = { $exception_message: (null == (l2 = c2[0]) ? void 0 : l2.value) || i3.message, $exception_type: null == (u2 = c2[0]) ? void 0 : u2.type, $exception_level: i3.level, $exception_list: f2, $sentry_event_id: i3.event_id, $sentry_exception: i3.exception, $sentry_exception_message: (null == (h2 = c2[0]) ? void 0 : h2.value) || i3.message, $sentry_exception_type: null == (d2 = c2[0]) ? void 0 : d2.type, $sentry_tags: i3.tags };
    return e2 && r2 && (p2.$sentry_url = (s2 || "https://sentry.io/organizations/") + e2 + "/issues/?project=" + r2 + "&query=" + i3.event_id), o2 && t2.exceptions.sendExceptionEvent(p2), i3;
  };
}
class Vr {
  constructor(t2, i2, e2, r2, s2, n2) {
    this.name = Wr, this.setupOnce = function(o2) {
      o2(Gr(t2, { organization: i2, projectId: e2, prefix: r2, severityAllowList: s2, sendExceptionsToPostHog: null == n2 || n2 }));
    };
  }
}
var Jr = null != t && t.location ? or(t.location.hash, "__posthog") || or(location.hash, "state") : null, Kr = "_postHogToolbarParams", Yr = Si("[Toolbar]"), Xr = function(t2) {
  return t2[t2.UNINITIALIZED = 0] = "UNINITIALIZED", t2[t2.LOADING = 1] = "LOADING", t2[t2.LOADED = 2] = "LOADED", t2;
}(Xr || {});
class Qr {
  constructor(t2) {
    this.instance = t2;
  }
  bt(t2) {
    v.ph_toolbar_state = t2;
  }
  wt() {
    var t2;
    return null !== (t2 = v.ph_toolbar_state) && void 0 !== t2 ? t2 : Xr.UNINITIALIZED;
  }
  maybeLoadToolbar(i2, e2, r2) {
    if (void 0 === i2 && (i2 = void 0), void 0 === e2 && (e2 = void 0), void 0 === r2 && (r2 = void 0), !t || !o) return false;
    i2 = null != i2 ? i2 : t.location, r2 = null != r2 ? r2 : t.history;
    try {
      if (!e2) {
        try {
          t.localStorage.setItem("test", "test"), t.localStorage.removeItem("test");
        } catch (t2) {
          return false;
        }
        e2 = null == t ? void 0 : t.localStorage;
      }
      var s2, n2 = Jr || or(i2.hash, "__posthog") || or(i2.hash, "state"), a2 = n2 ? Oi(() => JSON.parse(atob(decodeURIComponent(n2)))) || Oi(() => JSON.parse(decodeURIComponent(n2))) : null;
      return a2 && "ph_authorize" === a2.action ? ((s2 = a2).source = "url", s2 && Object.keys(s2).length > 0 && (a2.desiredHash ? i2.hash = a2.desiredHash : r2 ? r2.replaceState(r2.state, "", i2.pathname + i2.search) : i2.hash = "")) : ((s2 = JSON.parse(e2.getItem(Kr) || "{}")).source = "localstorage", delete s2.userIntent), !(!s2.token || this.instance.config.token !== s2.token) && (this.loadToolbar(s2), true);
    } catch (t2) {
      return false;
    }
  }
  xt(t2) {
    var i2 = v.ph_load_toolbar || v.ph_load_editor;
    !j(i2) && C(i2) ? i2(t2, this.instance) : Yr.warn("No toolbar load function found");
  }
  loadToolbar(i2) {
    var e2 = !(null == o || !o.getElementById(_e));
    if (!t || e2) return false;
    var r2 = "custom" === this.instance.requestRouter.region && this.instance.config.advanced_disable_toolbar_metrics, s2 = g({ token: this.instance.config.token }, i2, { apiURL: this.instance.requestRouter.endpointFor("ui") }, r2 ? { instrument: false } : {});
    if (t.localStorage.setItem(Kr, JSON.stringify(g({}, s2, { source: void 0 }))), this.wt() === Xr.LOADED) this.xt(s2);
    else if (this.wt() === Xr.UNINITIALIZED) {
      var n2;
      this.bt(Xr.LOADING), null == (n2 = v.__PosthogExtensions__) || null == n2.loadExternalDependency || n2.loadExternalDependency(this.instance, "toolbar", (t2) => {
        if (t2) return Yr.error("[Toolbar] Failed to load", t2), void this.bt(Xr.UNINITIALIZED);
        this.bt(Xr.LOADED), this.xt(s2);
      }), zi(t, "turbolinks:load", () => {
        this.bt(Xr.UNINITIALIZED), this.loadToolbar(s2);
      });
    }
    return true;
  }
  Et(t2) {
    return this.loadToolbar(t2);
  }
  maybeLoadEditor(t2, i2, e2) {
    return void 0 === t2 && (t2 = void 0), void 0 === i2 && (i2 = void 0), void 0 === e2 && (e2 = void 0), this.maybeLoadToolbar(t2, i2, e2);
  }
}
var Zr = Si("[TracingHeaders]");
class ts {
  constructor(t2) {
    this.$t = void 0, this.St = void 0, this.rt = () => {
      var t3, i2;
      M(this.$t) && (null == (t3 = v.__PosthogExtensions__) || null == (t3 = t3.tracingHeadersPatchFns) || t3._patchXHR(this._instance.config.__add_tracing_headers || [], this._instance.get_distinct_id(), this._instance.sessionManager));
      M(this.St) && (null == (i2 = v.__PosthogExtensions__) || null == (i2 = i2.tracingHeadersPatchFns) || i2._patchFetch(this._instance.config.__add_tracing_headers || [], this._instance.get_distinct_id(), this._instance.sessionManager));
    }, this._instance = t2;
  }
  it(t2) {
    var i2, e2;
    null != (i2 = v.__PosthogExtensions__) && i2.tracingHeadersPatchFns && t2(), null == (e2 = v.__PosthogExtensions__) || null == e2.loadExternalDependency || e2.loadExternalDependency(this._instance, "tracing-headers", (i3) => {
      if (i3) return Zr.error("failed to load script", i3);
      t2();
    });
  }
  startIfEnabledOrStop() {
    var t2, i2;
    this._instance.config.__add_tracing_headers ? this.it(this.rt) : (null == (t2 = this.$t) || t2.call(this), null == (i2 = this.St) || i2.call(this), this.$t = void 0, this.St = void 0);
  }
}
var is = "https?://(.*)", es = ["gclid", "gclsrc", "dclid", "gbraid", "wbraid", "fbclid", "msclkid", "twclid", "li_fat_id", "igshid", "ttclid", "rdt_cid", "epik", "qclid", "sccid", "irclid", "_kx"], rs = Fi(["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "gad_source", "mc_cid"], es), ss = "<masked>", ns = ["li_fat_id"];
function os(t2, i2, e2) {
  if (!o) return {};
  var r2, s2 = i2 ? Fi([], es, e2 || []) : [], n2 = as(nr(o.URL, s2, ss), t2), a2 = (r2 = {}, Ci(ns, function(t3) {
    var i3 = Sr.q(t3);
    r2[t3] = i3 || null;
  }), r2);
  return Ri(a2, n2);
}
function as(t2, i2) {
  var e2 = rs.concat(i2 || []), r2 = {};
  return Ci(e2, function(i3) {
    var e3 = sr(t2, i3);
    r2[i3] = e3 || null;
  }), r2;
}
function ls(t2) {
  var i2 = function(t3) {
    return t3 ? 0 === t3.search(is + "google.([^/?]*)") ? "google" : 0 === t3.search(is + "bing.com") ? "bing" : 0 === t3.search(is + "yahoo.com") ? "yahoo" : 0 === t3.search(is + "duckduckgo.com") ? "duckduckgo" : null : null;
  }(t2), e2 = "yahoo" != i2 ? "q" : "p", r2 = {};
  if (!D(i2)) {
    r2.$search_engine = i2;
    var s2 = o ? sr(o.referrer, e2) : "";
    s2.length && (r2.ph_keyword = s2);
  }
  return r2;
}
function us() {
  return navigator.language || navigator.userLanguage;
}
function hs() {
  return (null == o ? void 0 : o.referrer) || "$direct";
}
function ds(t2, i2) {
  var e2 = t2 ? Fi([], es, i2 || []) : [], r2 = null == a ? void 0 : a.href.substring(0, 1e3);
  return { r: hs().substring(0, 1e3), u: r2 ? nr(r2, e2, ss) : void 0 };
}
function vs(t2) {
  var i2, { r: e2, u: r2 } = t2, s2 = { $referrer: e2, $referring_domain: null == e2 ? void 0 : "$direct" == e2 ? "$direct" : null == (i2 = er(e2)) ? void 0 : i2.host };
  if (r2) {
    s2.$current_url = r2;
    var n2 = er(r2);
    s2.$host = null == n2 ? void 0 : n2.host, s2.$pathname = null == n2 ? void 0 : n2.pathname;
    var o2 = as(r2);
    Ri(s2, o2);
  }
  if (e2) {
    var a2 = ls(e2);
    Ri(s2, a2);
  }
  return s2;
}
function cs() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (t2) {
    return;
  }
}
function fs() {
  try {
    return (/* @__PURE__ */ new Date()).getTimezoneOffset();
  } catch (t2) {
    return;
  }
}
function ps(i2, e2) {
  if (!d) return {};
  var r2, s2, n2, o2 = i2 ? Fi([], es, e2 || []) : [], [l2, u2] = function(t2) {
    for (var i3 = 0; i3 < Jt.length; i3++) {
      var [e3, r3] = Jt[i3], s3 = e3.exec(t2), n3 = s3 && (C(r3) ? r3(s3, t2) : r3);
      if (n3) return n3;
    }
    return ["", ""];
  }(d);
  return Ri(Di({ $os: l2, $os_version: u2, $browser: Wt(d, navigator.vendor), $device: Kt(d), $device_type: (s2 = d, n2 = Kt(s2), n2 === et || n2 === it || "Kobo" === n2 || "Kindle Fire" === n2 || n2 === Ft ? tt : n2 === wt || n2 === Et || n2 === xt || n2 === It ? "Console" : n2 === st ? "Wearable" : n2 ? X : "Desktop"), $timezone: cs(), $timezone_offset: fs() }), { $current_url: nr(null == a ? void 0 : a.href, o2, ss), $host: null == a ? void 0 : a.host, $pathname: null == a ? void 0 : a.pathname, $raw_user_agent: d.length > 1e3 ? d.substring(0, 997) + "..." : d, $browser_version: Vt(d, navigator.vendor), $browser_language: us(), $browser_language_prefix: (r2 = us(), "string" == typeof r2 ? r2.split("-")[0] : void 0), $screen_height: null == t ? void 0 : t.screen.height, $screen_width: null == t ? void 0 : t.screen.width, $viewport_height: null == t ? void 0 : t.innerHeight, $viewport_width: null == t ? void 0 : t.innerWidth, $lib: "web", $lib_version: c.LIB_VERSION, $insert_id: Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10), $time: Date.now() / 1e3 });
}
var gs = Si("[Web Vitals]"), _s = 9e5;
class ms {
  constructor(t2) {
    var i2;
    this.kt = false, this.P = false, this.N = { url: void 0, metrics: [], firstMetricTimestamp: void 0 }, this.Pt = () => {
      clearTimeout(this.Tt), 0 !== this.N.metrics.length && (this._instance.capture("$web_vitals", this.N.metrics.reduce((t3, i3) => g({}, t3, { ["$web_vitals_" + i3.name + "_event"]: g({}, i3), ["$web_vitals_" + i3.name + "_value"]: i3.value }), {})), this.N = { url: void 0, metrics: [], firstMetricTimestamp: void 0 });
    }, this.It = (t3) => {
      var i3, e2 = null == (i3 = this._instance.sessionManager) ? void 0 : i3.checkAndGetSessionAndWindowId(true);
      if (M(e2)) gs.error("Could not read session ID. Dropping metrics!");
      else {
        this.N = this.N || { url: void 0, metrics: [], firstMetricTimestamp: void 0 };
        var r2 = this.Ct();
        if (!M(r2)) if (j(null == t3 ? void 0 : t3.name) || j(null == t3 ? void 0 : t3.value)) gs.error("Invalid metric received", t3);
        else if (this.Rt && t3.value >= this.Rt) gs.error("Ignoring metric with value >= " + this.Rt, t3);
        else this.N.url !== r2 && (this.Pt(), this.Tt = setTimeout(this.Pt, this.flushToCaptureTimeoutMs)), M(this.N.url) && (this.N.url = r2), this.N.firstMetricTimestamp = M(this.N.firstMetricTimestamp) ? Date.now() : this.N.firstMetricTimestamp, t3.attribution && t3.attribution.interactionTargetElement && (t3.attribution.interactionTargetElement = void 0), this.N.metrics.push(g({}, t3, { $current_url: r2, $session_id: e2.sessionId, $window_id: e2.windowId, timestamp: Date.now() })), this.N.metrics.length === this.allowedMetrics.length && this.Pt();
      }
    }, this.rt = () => {
      if (!this.P) {
        var t3, i3, e2, r2, s2 = v.__PosthogExtensions__;
        M(s2) || M(s2.postHogWebVitalsCallbacks) || ({ onLCP: t3, onCLS: i3, onFCP: e2, onINP: r2 } = s2.postHogWebVitalsCallbacks), t3 && i3 && e2 && r2 ? (this.allowedMetrics.indexOf("LCP") > -1 && t3(this.It.bind(this)), this.allowedMetrics.indexOf("CLS") > -1 && i3(this.It.bind(this)), this.allowedMetrics.indexOf("FCP") > -1 && e2(this.It.bind(this)), this.allowedMetrics.indexOf("INP") > -1 && r2(this.It.bind(this)), this.P = true) : gs.error("web vitals callbacks not loaded - not starting");
      }
    }, this._instance = t2, this.kt = !(null == (i2 = this._instance.persistence) || !i2.props[Yi]), this.startIfEnabled();
  }
  get allowedMetrics() {
    var t2, i2, e2 = R(this._instance.config.capture_performance) ? null == (t2 = this._instance.config.capture_performance) ? void 0 : t2.web_vitals_allowed_metrics : void 0;
    return M(e2) ? (null == (i2 = this._instance.persistence) ? void 0 : i2.props[Zi]) || ["CLS", "FCP", "INP", "LCP"] : e2;
  }
  get flushToCaptureTimeoutMs() {
    return (R(this._instance.config.capture_performance) ? this._instance.config.capture_performance.web_vitals_delayed_flush_ms : void 0) || 5e3;
  }
  get useAttribution() {
    var t2 = R(this._instance.config.capture_performance) ? this._instance.config.capture_performance.web_vitals_attribution : void 0;
    return null == t2 || t2;
  }
  get Rt() {
    var t2 = R(this._instance.config.capture_performance) && L(this._instance.config.capture_performance.__web_vitals_max_value) ? this._instance.config.capture_performance.__web_vitals_max_value : _s;
    return 0 < t2 && t2 <= 6e4 ? _s : t2;
  }
  get isEnabled() {
    var t2 = null == a ? void 0 : a.protocol;
    if ("http:" !== t2 && "https:" !== t2) return gs.info("Web Vitals are disabled on non-http/https protocols"), false;
    var i2 = R(this._instance.config.capture_performance) ? this._instance.config.capture_performance.web_vitals : U(this._instance.config.capture_performance) ? this._instance.config.capture_performance : void 0;
    return U(i2) ? i2 : this.kt;
  }
  startIfEnabled() {
    this.isEnabled && !this.P && (gs.info("enabled, starting..."), this.it(this.rt));
  }
  onRemoteConfig(t2) {
    var i2 = R(t2.capturePerformance) && !!t2.capturePerformance.web_vitals, e2 = R(t2.capturePerformance) ? t2.capturePerformance.web_vitals_allowed_metrics : void 0;
    this._instance.persistence && (this._instance.persistence.register({ [Yi]: i2 }), this._instance.persistence.register({ [Zi]: e2 })), this.kt = i2, this.startIfEnabled();
  }
  it(t2) {
    var i2, e2;
    null != (i2 = v.__PosthogExtensions__) && i2.postHogWebVitalsCallbacks ? t2() : null == (e2 = v.__PosthogExtensions__) || null == e2.loadExternalDependency || e2.loadExternalDependency(this._instance, "web-vitals", (i3) => {
      var e3;
      if (i3) gs.error("failed to load script", i3);
      else {
        var r2 = null == (e3 = v.__PosthogExtensions__) ? void 0 : e3.loadWebVitalsCallbacks;
        r2 ? (r2(this.useAttribution), t2()) : t2();
      }
    });
  }
  Ct() {
    var i2 = t ? t.location.href : void 0;
    if (i2) {
      var e2 = this._instance.config.mask_personal_data_properties, r2 = this._instance.config.custom_personal_data_properties, s2 = e2 ? Fi([], es, r2 || []) : [];
      return nr(i2, s2, ss);
    }
    gs.error("Could not determine current URL");
  }
}
var ys = Si("[Heatmaps]");
function bs(t2) {
  return R(t2) && "clientX" in t2 && "clientY" in t2 && L(t2.clientX) && L(t2.clientY);
}
class ws {
  constructor(t2) {
    var i2;
    this.kt = false, this.P = false, this.Ft = null, this.instance = t2, this.kt = !(null == (i2 = this.instance.persistence) || !i2.props[Gi]), this.rageclicks = new ir(t2.config.rageclick);
  }
  get flushIntervalMilliseconds() {
    var t2 = 5e3;
    return R(this.instance.config.capture_heatmaps) && this.instance.config.capture_heatmaps.flush_interval_milliseconds && (t2 = this.instance.config.capture_heatmaps.flush_interval_milliseconds), t2;
  }
  get isEnabled() {
    return M(this.instance.config.capture_heatmaps) ? M(this.instance.config.enable_heatmaps) ? this.kt : this.instance.config.enable_heatmaps : false !== this.instance.config.capture_heatmaps;
  }
  startIfEnabled() {
    if (this.isEnabled) {
      if (this.P) return;
      ys.info("starting..."), this.Mt(), this.Ot();
    } else {
      var t2;
      clearInterval(null !== (t2 = this.Ft) && void 0 !== t2 ? t2 : void 0), this.At(), this.getAndClearBuffer();
    }
  }
  onRemoteConfig(t2) {
    var i2 = !!t2.heatmaps;
    this.instance.persistence && this.instance.persistence.register({ [Gi]: i2 }), this.kt = i2, this.startIfEnabled();
  }
  getAndClearBuffer() {
    var t2 = this.N;
    return this.N = void 0, t2;
  }
  Dt(t2) {
    this.jt(t2.originalEvent, "deadclick");
  }
  Ot() {
    this.Ft && clearInterval(this.Ft), this.Ft = function(t2) {
      return "visible" === (null == t2 ? void 0 : t2.visibilityState);
    }(o) ? setInterval(this.Lt.bind(this), this.flushIntervalMilliseconds) : null;
  }
  Mt() {
    t && o && (this.Nt = this.Lt.bind(this), zi(t, "beforeunload", this.Nt), this.Ut = (i2) => this.jt(i2 || (null == t ? void 0 : t.event)), zi(o, "click", this.Ut, { capture: true }), this.zt = (i2) => this.Ht(i2 || (null == t ? void 0 : t.event)), zi(o, "mousemove", this.zt, { capture: true }), this.Bt = new Lr(this.instance, Dr, this.Dt.bind(this)), this.Bt.startIfEnabled(), this.qt = this.Ot.bind(this), zi(o, "visibilitychange", this.qt), this.P = true);
  }
  At() {
    var i2;
    t && o && (this.Nt && t.removeEventListener("beforeunload", this.Nt), this.Ut && o.removeEventListener("click", this.Ut, { capture: true }), this.zt && o.removeEventListener("mousemove", this.zt, { capture: true }), this.qt && o.removeEventListener("visibilitychange", this.qt), clearTimeout(this.Wt), null == (i2 = this.Bt) || i2.stop(), this.P = false);
  }
  Gt(i2, e2) {
    var r2 = this.instance.scrollManager.scrollY(), s2 = this.instance.scrollManager.scrollX(), n2 = this.instance.scrollManager.scrollElement(), o2 = function(i3, e3, r3) {
      for (var s3 = i3; s3 && we(s3) && !xe(s3, "body"); ) {
        if (s3 === r3) return false;
        if (w(e3, null == t ? void 0 : t.getComputedStyle(s3).position)) return true;
        s3 = Me(s3);
      }
      return false;
    }(Ce(i2), ["fixed", "sticky"], n2);
    return { x: i2.clientX + (o2 ? 0 : s2), y: i2.clientY + (o2 ? 0 : r2), target_fixed: o2, type: e2 };
  }
  jt(t2, i2) {
    var e2;
    if (void 0 === i2 && (i2 = "click"), !be(t2.target) && bs(t2)) {
      var r2 = this.Gt(t2, i2);
      null != (e2 = this.rageclicks) && e2.isRageClick(t2.clientX, t2.clientY, (/* @__PURE__ */ new Date()).getTime()) && this.Vt(g({}, r2, { type: "rageclick" })), this.Vt(r2);
    }
  }
  Ht(t2) {
    !be(t2.target) && bs(t2) && (clearTimeout(this.Wt), this.Wt = setTimeout(() => {
      this.Vt(this.Gt(t2, "mousemove"));
    }, 500));
  }
  Vt(i2) {
    if (t) {
      var e2 = t.location.href, r2 = this.instance.config.mask_personal_data_properties, s2 = this.instance.config.custom_personal_data_properties, n2 = r2 ? Fi([], es, s2 || []) : [], o2 = nr(e2, n2, ss);
      this.N = this.N || {}, this.N[o2] || (this.N[o2] = []), this.N[o2].push(i2);
    }
  }
  Lt() {
    this.N && !F(this.N) && this.instance.capture("$$heatmap", { $heatmap_data: this.getAndClearBuffer() });
  }
}
class xs {
  constructor(t2) {
    this.Jt = (t3, i2, e2) => {
      e2 && (e2.noSessionId || e2.activityTimeout || e2.sessionPastMaximumLength) && ($i.info("[PageViewManager] Session rotated, clearing pageview state", { sessionId: t3, changeReason: e2 }), this.Kt = void 0, this._instance.scrollManager.resetContext());
    }, this._instance = t2, this.Yt();
  }
  Yt() {
    var t2;
    this.Xt = null == (t2 = this._instance.sessionManager) ? void 0 : t2.onSessionId(this.Jt);
  }
  destroy() {
    var t2;
    null == (t2 = this.Xt) || t2.call(this), this.Xt = void 0;
  }
  doPageView(i2, e2) {
    var r2, s2 = this.Qt(i2, e2);
    return this.Kt = { pathname: null !== (r2 = null == t ? void 0 : t.location.pathname) && void 0 !== r2 ? r2 : "", pageViewId: e2, timestamp: i2 }, this._instance.scrollManager.resetContext(), s2;
  }
  doPageLeave(t2) {
    var i2;
    return this.Qt(t2, null == (i2 = this.Kt) ? void 0 : i2.pageViewId);
  }
  doEvent() {
    var t2;
    return { $pageview_id: null == (t2 = this.Kt) ? void 0 : t2.pageViewId };
  }
  Qt(t2, i2) {
    var e2 = this.Kt;
    if (!e2) return { $pageview_id: i2 };
    var r2 = { $pageview_id: i2, $prev_pageview_id: e2.pageViewId }, s2 = this._instance.scrollManager.getContext();
    if (s2 && !this._instance.config.disable_scroll_properties) {
      var { maxScrollHeight: n2, lastScrollY: o2, maxScrollY: a2, maxContentHeight: l2, lastContentY: u2, maxContentY: h2 } = s2;
      if (!(M(n2) || M(o2) || M(a2) || M(l2) || M(u2) || M(h2))) {
        n2 = Math.ceil(n2), o2 = Math.ceil(o2), a2 = Math.ceil(a2), l2 = Math.ceil(l2), u2 = Math.ceil(u2), h2 = Math.ceil(h2);
        var d2 = n2 <= 1 ? 1 : K(o2 / n2, 0, 1, $i), v2 = n2 <= 1 ? 1 : K(a2 / n2, 0, 1, $i), c2 = l2 <= 1 ? 1 : K(u2 / l2, 0, 1, $i), f2 = l2 <= 1 ? 1 : K(h2 / l2, 0, 1, $i);
        r2 = Ri(r2, { $prev_pageview_last_scroll: o2, $prev_pageview_last_scroll_percentage: d2, $prev_pageview_max_scroll: a2, $prev_pageview_max_scroll_percentage: v2, $prev_pageview_last_content: u2, $prev_pageview_last_content_percentage: c2, $prev_pageview_max_content: h2, $prev_pageview_max_content_percentage: f2 });
      }
    }
    return e2.pathname && (r2.$prev_pageview_pathname = e2.pathname), e2.timestamp && (r2.$prev_pageview_duration = (t2.getTime() - e2.timestamp.getTime()) / 1e3), r2;
  }
}
var $s = function(t2) {
  return t2.GZipJS = "gzip-js", t2.Base64 = "base64", t2;
}({}), Ss = Uint8Array, ks = Uint16Array, Ps = Uint32Array, Ts = new Ss([0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0, 0, 0, 0]), Is = new Ss([0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13, 0, 0]), Cs = new Ss([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]), Rs = function(t2, i2) {
  for (var e2 = new ks(31), r2 = 0; r2 < 31; ++r2) e2[r2] = i2 += 1 << t2[r2 - 1];
  var s2 = new Ps(e2[30]);
  for (r2 = 1; r2 < 30; ++r2) for (var n2 = e2[r2]; n2 < e2[r2 + 1]; ++n2) s2[n2] = n2 - e2[r2] << 5 | r2;
  return [e2, s2];
}, Fs = Rs(Ts, 2), Ms = Fs[0], Os = Fs[1];
Ms[28] = 258, Os[258] = 28;
for (var As = Rs(Is, 0)[1], Ds = new ks(32768), js = 0; js < 32768; ++js) {
  var Ls = (43690 & js) >>> 1 | (21845 & js) << 1;
  Ls = (61680 & (Ls = (52428 & Ls) >>> 2 | (13107 & Ls) << 2)) >>> 4 | (3855 & Ls) << 4, Ds[js] = ((65280 & Ls) >>> 8 | (255 & Ls) << 8) >>> 1;
}
var Ns = function(t2, i2, e2) {
  for (var r2 = t2.length, s2 = 0, n2 = new ks(i2); s2 < r2; ++s2) ++n2[t2[s2] - 1];
  var o2, a2 = new ks(i2);
  for (s2 = 0; s2 < i2; ++s2) a2[s2] = a2[s2 - 1] + n2[s2 - 1] << 1;
  for (o2 = new ks(r2), s2 = 0; s2 < r2; ++s2) o2[s2] = Ds[a2[t2[s2] - 1]++] >>> 15 - t2[s2];
  return o2;
}, Us = new Ss(288);
for (js = 0; js < 144; ++js) Us[js] = 8;
for (js = 144; js < 256; ++js) Us[js] = 9;
for (js = 256; js < 280; ++js) Us[js] = 7;
for (js = 280; js < 288; ++js) Us[js] = 8;
var zs = new Ss(32);
for (js = 0; js < 32; ++js) zs[js] = 5;
var Hs = Ns(Us, 9), Bs = Ns(zs, 5), qs = function(t2) {
  return (t2 / 8 >> 0) + (7 & t2 && 1);
}, Ws = function(t2, i2, e2) {
  (null == e2 || e2 > t2.length) && (e2 = t2.length);
  var r2 = new (t2 instanceof ks ? ks : t2 instanceof Ps ? Ps : Ss)(e2 - i2);
  return r2.set(t2.subarray(i2, e2)), r2;
}, Gs = function(t2, i2, e2) {
  e2 <<= 7 & i2;
  var r2 = i2 / 8 >> 0;
  t2[r2] |= e2, t2[r2 + 1] |= e2 >>> 8;
}, Vs = function(t2, i2, e2) {
  e2 <<= 7 & i2;
  var r2 = i2 / 8 >> 0;
  t2[r2] |= e2, t2[r2 + 1] |= e2 >>> 8, t2[r2 + 2] |= e2 >>> 16;
}, Js = function(t2, i2) {
  for (var e2 = [], r2 = 0; r2 < t2.length; ++r2) t2[r2] && e2.push({ s: r2, f: t2[r2] });
  var s2 = e2.length, n2 = e2.slice();
  if (!s2) return [new Ss(0), 0];
  if (1 == s2) {
    var o2 = new Ss(e2[0].s + 1);
    return o2[e2[0].s] = 1, [o2, 1];
  }
  e2.sort(function(t3, i3) {
    return t3.f - i3.f;
  }), e2.push({ s: -1, f: 25001 });
  var a2 = e2[0], l2 = e2[1], u2 = 0, h2 = 1, d2 = 2;
  for (e2[0] = { s: -1, f: a2.f + l2.f, l: a2, r: l2 }; h2 != s2 - 1; ) a2 = e2[e2[u2].f < e2[d2].f ? u2++ : d2++], l2 = e2[u2 != h2 && e2[u2].f < e2[d2].f ? u2++ : d2++], e2[h2++] = { s: -1, f: a2.f + l2.f, l: a2, r: l2 };
  var v2 = n2[0].s;
  for (r2 = 1; r2 < s2; ++r2) n2[r2].s > v2 && (v2 = n2[r2].s);
  var c2 = new ks(v2 + 1), f2 = Ks(e2[h2 - 1], c2, 0);
  if (f2 > i2) {
    r2 = 0;
    var p2 = 0, g2 = f2 - i2, _2 = 1 << g2;
    for (n2.sort(function(t3, i3) {
      return c2[i3.s] - c2[t3.s] || t3.f - i3.f;
    }); r2 < s2; ++r2) {
      var m2 = n2[r2].s;
      if (!(c2[m2] > i2)) break;
      p2 += _2 - (1 << f2 - c2[m2]), c2[m2] = i2;
    }
    for (p2 >>>= g2; p2 > 0; ) {
      var y2 = n2[r2].s;
      c2[y2] < i2 ? p2 -= 1 << i2 - c2[y2]++ - 1 : ++r2;
    }
    for (; r2 >= 0 && p2; --r2) {
      var b2 = n2[r2].s;
      c2[b2] == i2 && (--c2[b2], ++p2);
    }
    f2 = i2;
  }
  return [new Ss(c2), f2];
}, Ks = function(t2, i2, e2) {
  return -1 == t2.s ? Math.max(Ks(t2.l, i2, e2 + 1), Ks(t2.r, i2, e2 + 1)) : i2[t2.s] = e2;
}, Ys = function(t2) {
  for (var i2 = t2.length; i2 && !t2[--i2]; ) ;
  for (var e2 = new ks(++i2), r2 = 0, s2 = t2[0], n2 = 1, o2 = function(t3) {
    e2[r2++] = t3;
  }, a2 = 1; a2 <= i2; ++a2) if (t2[a2] == s2 && a2 != i2) ++n2;
  else {
    if (!s2 && n2 > 2) {
      for (; n2 > 138; n2 -= 138) o2(32754);
      n2 > 2 && (o2(n2 > 10 ? n2 - 11 << 5 | 28690 : n2 - 3 << 5 | 12305), n2 = 0);
    } else if (n2 > 3) {
      for (o2(s2), --n2; n2 > 6; n2 -= 6) o2(8304);
      n2 > 2 && (o2(n2 - 3 << 5 | 8208), n2 = 0);
    }
    for (; n2--; ) o2(s2);
    n2 = 1, s2 = t2[a2];
  }
  return [e2.subarray(0, r2), i2];
}, Xs = function(t2, i2) {
  for (var e2 = 0, r2 = 0; r2 < i2.length; ++r2) e2 += t2[r2] * i2[r2];
  return e2;
}, Qs = function(t2, i2, e2) {
  var r2 = e2.length, s2 = qs(i2 + 2);
  t2[s2] = 255 & r2, t2[s2 + 1] = r2 >>> 8, t2[s2 + 2] = 255 ^ t2[s2], t2[s2 + 3] = 255 ^ t2[s2 + 1];
  for (var n2 = 0; n2 < r2; ++n2) t2[s2 + n2 + 4] = e2[n2];
  return 8 * (s2 + 4 + r2);
}, Zs = function(t2, i2, e2, r2, s2, n2, o2, a2, l2, u2, h2) {
  Gs(i2, h2++, e2), ++s2[256];
  for (var d2 = Js(s2, 15), v2 = d2[0], c2 = d2[1], f2 = Js(n2, 15), p2 = f2[0], g2 = f2[1], _2 = Ys(v2), m2 = _2[0], y2 = _2[1], b2 = Ys(p2), w2 = b2[0], x2 = b2[1], E2 = new ks(19), S2 = 0; S2 < m2.length; ++S2) E2[31 & m2[S2]]++;
  for (S2 = 0; S2 < w2.length; ++S2) E2[31 & w2[S2]]++;
  for (var k2 = Js(E2, 7), P2 = k2[0], T2 = k2[1], I2 = 19; I2 > 4 && !P2[Cs[I2 - 1]]; --I2) ;
  var C2, R2, F2, M2, O2 = u2 + 5 << 3, A2 = Xs(s2, Us) + Xs(n2, zs) + o2, D2 = Xs(s2, v2) + Xs(n2, p2) + o2 + 14 + 3 * I2 + Xs(E2, P2) + (2 * E2[16] + 3 * E2[17] + 7 * E2[18]);
  if (O2 <= A2 && O2 <= D2) return Qs(i2, h2, t2.subarray(l2, l2 + u2));
  if (Gs(i2, h2, 1 + (D2 < A2)), h2 += 2, D2 < A2) {
    C2 = Ns(v2, c2), R2 = v2, F2 = Ns(p2, g2), M2 = p2;
    var j2 = Ns(P2, T2);
    Gs(i2, h2, y2 - 257), Gs(i2, h2 + 5, x2 - 1), Gs(i2, h2 + 10, I2 - 4), h2 += 14;
    for (S2 = 0; S2 < I2; ++S2) Gs(i2, h2 + 3 * S2, P2[Cs[S2]]);
    h2 += 3 * I2;
    for (var L2 = [m2, w2], N2 = 0; N2 < 2; ++N2) {
      var U2 = L2[N2];
      for (S2 = 0; S2 < U2.length; ++S2) {
        var z2 = 31 & U2[S2];
        Gs(i2, h2, j2[z2]), h2 += P2[z2], z2 > 15 && (Gs(i2, h2, U2[S2] >>> 5 & 127), h2 += U2[S2] >>> 12);
      }
    }
  } else C2 = Hs, R2 = Us, F2 = Bs, M2 = zs;
  for (S2 = 0; S2 < a2; ++S2) if (r2[S2] > 255) {
    z2 = r2[S2] >>> 18 & 31;
    Vs(i2, h2, C2[z2 + 257]), h2 += R2[z2 + 257], z2 > 7 && (Gs(i2, h2, r2[S2] >>> 23 & 31), h2 += Ts[z2]);
    var H2 = 31 & r2[S2];
    Vs(i2, h2, F2[H2]), h2 += M2[H2], H2 > 3 && (Vs(i2, h2, r2[S2] >>> 5 & 8191), h2 += Is[H2]);
  } else Vs(i2, h2, C2[r2[S2]]), h2 += R2[r2[S2]];
  return Vs(i2, h2, C2[256]), h2 + R2[256];
}, tn = new Ps([65540, 131080, 131088, 131104, 262176, 1048704, 1048832, 2114560, 2117632]), en = function() {
  for (var t2 = new Ps(256), i2 = 0; i2 < 256; ++i2) {
    for (var e2 = i2, r2 = 9; --r2; ) e2 = (1 & e2 && 3988292384) ^ e2 >>> 1;
    t2[i2] = e2;
  }
  return t2;
}(), rn = function(t2, i2, e2, r2, s2) {
  return function(t3, i3, e3, r3, s3, n2) {
    var o2 = t3.length, a2 = new Ss(r3 + o2 + 5 * (1 + Math.floor(o2 / 7e3)) + s3), l2 = a2.subarray(r3, a2.length - s3), u2 = 0;
    if (!i3 || o2 < 8) for (var h2 = 0; h2 <= o2; h2 += 65535) {
      var d2 = h2 + 65535;
      d2 < o2 ? u2 = Qs(l2, u2, t3.subarray(h2, d2)) : (l2[h2] = n2, u2 = Qs(l2, u2, t3.subarray(h2, o2)));
    }
    else {
      for (var v2 = tn[i3 - 1], c2 = v2 >>> 13, f2 = 8191 & v2, p2 = (1 << e3) - 1, g2 = new ks(32768), _2 = new ks(p2 + 1), m2 = Math.ceil(e3 / 3), y2 = 2 * m2, b2 = function(i4) {
        return (t3[i4] ^ t3[i4 + 1] << m2 ^ t3[i4 + 2] << y2) & p2;
      }, w2 = new Ps(25e3), x2 = new ks(288), E2 = new ks(32), S2 = 0, k2 = 0, P2 = (h2 = 0, 0), T2 = 0, I2 = 0; h2 < o2; ++h2) {
        var C2 = b2(h2), R2 = 32767 & h2, F2 = _2[C2];
        if (g2[R2] = F2, _2[C2] = R2, T2 <= h2) {
          var M2 = o2 - h2;
          if ((S2 > 7e3 || P2 > 24576) && M2 > 423) {
            u2 = Zs(t3, l2, 0, w2, x2, E2, k2, P2, I2, h2 - I2, u2), P2 = S2 = k2 = 0, I2 = h2;
            for (var O2 = 0; O2 < 286; ++O2) x2[O2] = 0;
            for (O2 = 0; O2 < 30; ++O2) E2[O2] = 0;
          }
          var A2 = 2, D2 = 0, j2 = f2, L2 = R2 - F2 & 32767;
          if (M2 > 2 && C2 == b2(h2 - L2)) for (var N2 = Math.min(c2, M2) - 1, U2 = Math.min(32767, h2), z2 = Math.min(258, M2); L2 <= U2 && --j2 && R2 != F2; ) {
            if (t3[h2 + A2] == t3[h2 + A2 - L2]) {
              for (var H2 = 0; H2 < z2 && t3[h2 + H2] == t3[h2 + H2 - L2]; ++H2) ;
              if (H2 > A2) {
                if (A2 = H2, D2 = L2, H2 > N2) break;
                var B2 = Math.min(L2, H2 - 2), q2 = 0;
                for (O2 = 0; O2 < B2; ++O2) {
                  var W2 = h2 - L2 + O2 + 32768 & 32767, G2 = W2 - g2[W2] + 32768 & 32767;
                  G2 > q2 && (q2 = G2, F2 = W2);
                }
              }
            }
            L2 += (R2 = F2) - (F2 = g2[R2]) + 32768 & 32767;
          }
          if (D2) {
            w2[P2++] = 268435456 | Os[A2] << 18 | As[D2];
            var V2 = 31 & Os[A2], J2 = 31 & As[D2];
            k2 += Ts[V2] + Is[J2], ++x2[257 + V2], ++E2[J2], T2 = h2 + A2, ++S2;
          } else w2[P2++] = t3[h2], ++x2[t3[h2]];
        }
      }
      u2 = Zs(t3, l2, n2, w2, x2, E2, k2, P2, I2, h2 - I2, u2);
    }
    return Ws(a2, 0, r3 + qs(u2) + s3);
  }(t2, null == i2.level ? 6 : i2.level, null == i2.mem ? Math.ceil(1.5 * Math.max(8, Math.min(13, Math.log(t2.length)))) : 12 + i2.mem, e2, r2, true);
}, sn = function(t2, i2, e2) {
  for (; e2; ++i2) t2[i2] = e2, e2 >>>= 8;
};
function nn(t2, i2) {
  void 0 === i2 && (i2 = {});
  var e2 = /* @__PURE__ */ function() {
    var t3 = 4294967295;
    return { p: function(i3) {
      for (var e3 = t3, r3 = 0; r3 < i3.length; ++r3) e3 = en[255 & e3 ^ i3[r3]] ^ e3 >>> 8;
      t3 = e3;
    }, d: function() {
      return 4294967295 ^ t3;
    } };
  }(), r2 = t2.length;
  e2.p(t2);
  var s2, n2 = rn(t2, i2, 10 + ((s2 = i2).filename && s2.filename.length + 1 || 0), 8), o2 = n2.length;
  return function(t3, i3) {
    var e3 = i3.filename;
    if (t3[0] = 31, t3[1] = 139, t3[2] = 8, t3[8] = i3.level < 2 ? 4 : 9 == i3.level ? 2 : 0, t3[9] = 3, 0 != i3.mtime && sn(t3, 4, Math.floor(new Date(i3.mtime || Date.now()) / 1e3)), e3) {
      t3[3] = 8;
      for (var r3 = 0; r3 <= e3.length; ++r3) t3[r3 + 10] = e3.charCodeAt(r3);
    }
  }(n2, i2), sn(n2, o2 - 8, e2.d()), sn(n2, o2 - 4, r2), n2;
}
var on = function(t2) {
  var i2, e2, r2, s2, n2 = "";
  for (i2 = e2 = 0, r2 = (t2 = (t2 + "").replace(/\r\n/g, "\n").replace(/\r/g, "\n")).length, s2 = 0; s2 < r2; s2++) {
    var o2 = t2.charCodeAt(s2), a2 = null;
    o2 < 128 ? e2++ : a2 = o2 > 127 && o2 < 2048 ? String.fromCharCode(o2 >> 6 | 192, 63 & o2 | 128) : String.fromCharCode(o2 >> 12 | 224, o2 >> 6 & 63 | 128, 63 & o2 | 128), D(a2) || (e2 > i2 && (n2 += t2.substring(i2, e2)), n2 += a2, i2 = e2 = s2 + 1);
  }
  return e2 > i2 && (n2 += t2.substring(i2, t2.length)), n2;
}, an = !!u || !!l, ln = "text/plain", un = function(t2, i2, e2) {
  var r2;
  void 0 === e2 && (e2 = true);
  var [s2, n2] = t2.split("?"), o2 = g({}, i2), a2 = null !== (r2 = null == n2 ? void 0 : n2.split("&").map((t3) => {
    var i3, [r3, s3] = t3.split("="), n3 = e2 && null !== (i3 = o2[r3]) && void 0 !== i3 ? i3 : s3;
    return delete o2[r3], r3 + "=" + n3;
  })) && void 0 !== r2 ? r2 : [], l2 = rr(o2);
  return l2 && a2.push(l2), s2 + "?" + a2.join("&");
}, hn = (t2, i2) => JSON.stringify(t2, (t3, i3) => "bigint" == typeof i3 ? i3.toString() : i3, i2), dn = (t2) => {
  var { data: i2, compression: e2 } = t2;
  if (i2) {
    if (e2 === $s.GZipJS) {
      var r2 = nn(function(t3, i3) {
        var e3 = t3.length;
        if ("undefined" != typeof TextEncoder) return new TextEncoder().encode(t3);
        for (var r3 = new Ss(t3.length + (t3.length >>> 1)), s3 = 0, n3 = function(t4) {
          r3[s3++] = t4;
        }, o3 = 0; o3 < e3; ++o3) {
          if (s3 + 5 > r3.length) {
            var a3 = new Ss(s3 + 8 + (e3 - o3 << 1));
            a3.set(r3), r3 = a3;
          }
          var l2 = t3.charCodeAt(o3);
          l2 < 128 || i3 ? n3(l2) : l2 < 2048 ? (n3(192 | l2 >>> 6), n3(128 | 63 & l2)) : l2 > 55295 && l2 < 57344 ? (n3(240 | (l2 = 65536 + (1047552 & l2) | 1023 & t3.charCodeAt(++o3)) >>> 18), n3(128 | l2 >>> 12 & 63), n3(128 | l2 >>> 6 & 63), n3(128 | 63 & l2)) : (n3(224 | l2 >>> 12), n3(128 | l2 >>> 6 & 63), n3(128 | 63 & l2));
        }
        return Ws(r3, 0, s3);
      }(hn(i2)), { mtime: 0 }), s2 = new Blob([r2], { type: ln });
      return { contentType: ln, body: s2, estimatedSize: s2.size };
    }
    if (e2 === $s.Base64) {
      var n2 = function(t3) {
        var i3, e3, r3, s3, n3, o3 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=", a3 = 0, l2 = 0, u2 = "", h2 = [];
        if (!t3) return t3;
        t3 = on(t3);
        do {
          i3 = (n3 = t3.charCodeAt(a3++) << 16 | t3.charCodeAt(a3++) << 8 | t3.charCodeAt(a3++)) >> 18 & 63, e3 = n3 >> 12 & 63, r3 = n3 >> 6 & 63, s3 = 63 & n3, h2[l2++] = o3.charAt(i3) + o3.charAt(e3) + o3.charAt(r3) + o3.charAt(s3);
        } while (a3 < t3.length);
        switch (u2 = h2.join(""), t3.length % 3) {
          case 1:
            u2 = u2.slice(0, -2) + "==";
            break;
          case 2:
            u2 = u2.slice(0, -1) + "=";
        }
        return u2;
      }(hn(i2)), o2 = ((t3) => "data=" + encodeURIComponent("string" == typeof t3 ? t3 : hn(t3)))(n2);
      return { contentType: "application/x-www-form-urlencoded", body: o2, estimatedSize: new Blob([o2]).size };
    }
    var a2 = hn(i2);
    return { contentType: "application/json", body: a2, estimatedSize: new Blob([a2]).size };
  }
}, vn = [];
l && vn.push({ transport: "fetch", method: (t2) => {
  var i2, e2, { contentType: r2, body: s2, estimatedSize: n2 } = null !== (i2 = dn(t2)) && void 0 !== i2 ? i2 : {}, o2 = new Headers();
  Ci(t2.headers, function(t3, i3) {
    o2.append(i3, t3);
  }), r2 && o2.append("Content-Type", r2);
  var a2 = t2.url, u2 = null;
  if (h) {
    var d2 = new h();
    u2 = { signal: d2.signal, timeout: setTimeout(() => d2.abort(), t2.timeout) };
  }
  l(a2, g({ method: (null == t2 ? void 0 : t2.method) || "GET", headers: o2, keepalive: "POST" === t2.method && (n2 || 0) < 52428.8, body: s2, signal: null == (e2 = u2) ? void 0 : e2.signal }, t2.fetchOptions)).then((i3) => i3.text().then((e3) => {
    var r3 = { statusCode: i3.status, text: e3 };
    if (200 === i3.status) try {
      r3.json = JSON.parse(e3);
    } catch (t3) {
      $i.error(t3);
    }
    null == t2.callback || t2.callback(r3);
  })).catch((i3) => {
    $i.error(i3), null == t2.callback || t2.callback({ statusCode: 0, text: i3 });
  }).finally(() => u2 ? clearTimeout(u2.timeout) : null);
} }), u && vn.push({ transport: "XHR", method: (t2) => {
  var i2, e2 = new u();
  e2.open(t2.method || "GET", t2.url, true);
  var { contentType: r2, body: s2 } = null !== (i2 = dn(t2)) && void 0 !== i2 ? i2 : {};
  Ci(t2.headers, function(t3, i3) {
    e2.setRequestHeader(i3, t3);
  }), r2 && e2.setRequestHeader("Content-Type", r2), t2.timeout && (e2.timeout = t2.timeout), t2.disableXHRCredentials || (e2.withCredentials = true), e2.onreadystatechange = () => {
    if (4 === e2.readyState) {
      var i3 = { statusCode: e2.status, text: e2.responseText };
      if (200 === e2.status) try {
        i3.json = JSON.parse(e2.responseText);
      } catch (t3) {
      }
      null == t2.callback || t2.callback(i3);
    }
  }, e2.send(s2);
} }), null != n && n.sendBeacon && vn.push({ transport: "sendBeacon", method: (t2) => {
  var i2 = un(t2.url, { beacon: "1" });
  try {
    var e2, { contentType: r2, body: s2 } = null !== (e2 = dn(t2)) && void 0 !== e2 ? e2 : {}, o2 = "string" == typeof s2 ? new Blob([s2], { type: r2 }) : s2;
    n.sendBeacon(i2, o2);
  } catch (t3) {
  }
} });
var cn = function(t2, i2) {
  if (!function(t3) {
    try {
      new RegExp(t3);
    } catch (t4) {
      return false;
    }
    return true;
  }(i2)) return false;
  try {
    return new RegExp(i2).test(t2);
  } catch (t3) {
    return false;
  }
};
function fn(t2, i2, e2) {
  return hn({ distinct_id: t2, userPropertiesToSet: i2, userPropertiesToSetOnce: e2 });
}
var pn = { exact: (t2, i2) => i2.some((i3) => t2.some((t3) => i3 === t3)), is_not: (t2, i2) => i2.every((i3) => t2.every((t3) => i3 !== t3)), regex: (t2, i2) => i2.some((i3) => t2.some((t3) => cn(i3, t3))), not_regex: (t2, i2) => i2.every((i3) => t2.every((t3) => !cn(i3, t3))), icontains: (t2, i2) => i2.map(gn).some((i3) => t2.map(gn).some((t3) => i3.includes(t3))), not_icontains: (t2, i2) => i2.map(gn).every((i3) => t2.map(gn).every((t3) => !i3.includes(t3))), gt: (t2, i2) => i2.some((i3) => {
  var e2 = parseFloat(i3);
  return !isNaN(e2) && t2.some((t3) => e2 > parseFloat(t3));
}), lt: (t2, i2) => i2.some((i3) => {
  var e2 = parseFloat(i3);
  return !isNaN(e2) && t2.some((t3) => e2 < parseFloat(t3));
}) }, gn = (t2) => t2.toLowerCase();
function _n(t2, i2) {
  return !t2 || Object.entries(t2).every((t3) => {
    var [e2, r2] = t3, s2 = null == i2 ? void 0 : i2[e2];
    if (M(s2) || D(s2)) return false;
    var n2 = [String(s2)], o2 = pn[r2.operator];
    return !!o2 && o2(r2.values, n2);
  });
}
var mn = Si("[Error tracking]");
class yn {
  constructor(t2) {
    var i2, e2;
    this.Zt = [], this.ti = new Qt([new vi(), new xi(), new fi(), new ci(), new bi(), new yi(), new gi(), new wi()], di()), this._instance = t2, this.Zt = null !== (i2 = null == (e2 = this._instance.persistence) ? void 0 : e2.get_property(Ji)) && void 0 !== i2 ? i2 : [];
  }
  onRemoteConfig(t2) {
    var i2, e2, r2, s2 = null !== (i2 = null == (e2 = t2.errorTracking) ? void 0 : e2.suppressionRules) && void 0 !== i2 ? i2 : [], n2 = null == (r2 = t2.errorTracking) ? void 0 : r2.captureExtensionExceptions;
    this.Zt = s2, this._instance.persistence && this._instance.persistence.register({ [Ji]: this.Zt, [Ki]: n2 });
  }
  get ii() {
    var t2, i2 = !!this._instance.get_property(Ki), e2 = this._instance.config.error_tracking.captureExtensionExceptions;
    return null !== (t2 = null != e2 ? e2 : i2) && void 0 !== t2 && t2;
  }
  buildProperties(t2, i2) {
    return this.ti.buildFromUnknown(t2, { syntheticException: null == i2 ? void 0 : i2.syntheticException, mechanism: { handled: null == i2 ? void 0 : i2.handled } });
  }
  sendExceptionEvent(t2) {
    var i2 = t2.$exception_list;
    if (this.ei(i2)) {
      if (this.ri(i2)) return void mn.info("Skipping exception capture because a suppression rule matched");
      if (!this.ii && this.si(i2)) return void mn.info("Skipping exception capture because it was thrown by an extension");
      if (!this._instance.config.error_tracking.__capturePostHogExceptions && this.ni(i2)) return void mn.info("Skipping exception capture because it was thrown by the PostHog SDK");
    }
    return this._instance.capture("$exception", t2, { _noTruncate: true, _batchKey: "exceptionEvent" });
  }
  ri(t2) {
    if (0 === t2.length) return false;
    var i2 = t2.reduce((t3, i3) => {
      var { type: e2, value: r2 } = i3;
      return O(e2) && e2.length > 0 && t3.$exception_types.push(e2), O(r2) && r2.length > 0 && t3.$exception_values.push(r2), t3;
    }, { $exception_types: [], $exception_values: [] });
    return this.Zt.some((t3) => {
      var e2 = t3.values.map((t4) => {
        var e3, r2 = pn[t4.operator], s2 = I(t4.value) ? t4.value : [t4.value], n2 = null !== (e3 = i2[t4.key]) && void 0 !== e3 ? e3 : [];
        return s2.length > 0 && r2(s2, n2);
      });
      return "OR" === t3.type ? e2.some(Boolean) : e2.every(Boolean);
    });
  }
  si(t2) {
    return t2.flatMap((t3) => {
      var i2, e2;
      return null !== (i2 = null == (e2 = t3.stacktrace) ? void 0 : e2.frames) && void 0 !== i2 ? i2 : [];
    }).some((t3) => t3.filename && t3.filename.startsWith("chrome-extension://"));
  }
  ni(t2) {
    if (t2.length > 0) {
      var i2, e2, r2, s2, n2 = null !== (i2 = null == (e2 = t2[0].stacktrace) ? void 0 : e2.frames) && void 0 !== i2 ? i2 : [], o2 = n2[n2.length - 1];
      return null !== (r2 = null == o2 || null == (s2 = o2.filename) ? void 0 : s2.includes("posthog.com/static")) && void 0 !== r2 && r2;
    }
    return false;
  }
  ei(t2) {
    return !j(t2) && I(t2);
  }
}
var bn = Si("[FeatureFlags]"), wn = Si("[FeatureFlags]", { debugEnabled: true }), xn = "$active_feature_flags", En = "$override_feature_flags", $n = "$feature_flag_payloads", Sn = "$override_feature_flag_payloads", kn = "$feature_flag_request_id", Pn = "$feature_flag_evaluated_at", Tn = (t2) => {
  var i2 = {};
  for (var [e2, r2] of Mi(t2 || {})) r2 && (i2[e2] = r2);
  return i2;
}, In = (t2) => {
  var i2 = t2.flags;
  return i2 ? (t2.featureFlags = Object.fromEntries(Object.keys(i2).map((t3) => {
    var e2;
    return [t3, null !== (e2 = i2[t3].variant) && void 0 !== e2 ? e2 : i2[t3].enabled];
  })), t2.featureFlagPayloads = Object.fromEntries(Object.keys(i2).filter((t3) => i2[t3].enabled).filter((t3) => {
    var e2;
    return null == (e2 = i2[t3].metadata) ? void 0 : e2.payload;
  }).map((t3) => {
    var e2;
    return [t3, null == (e2 = i2[t3].metadata) ? void 0 : e2.payload];
  }))) : bn.warn("Using an older version of the feature flags endpoint. Please upgrade your PostHog server to the latest version"), t2;
}, Cn = function(t2) {
  return t2.FeatureFlags = "feature_flags", t2.Recordings = "recordings", t2;
}({});
class Rn {
  constructor(t2) {
    this.oi = false, this.ai = false, this.li = false, this.ui = false, this.hi = false, this.di = false, this.vi = false, this.ci = false, this._instance = t2, this.featureFlagEventHandlers = [];
  }
  fi() {
    var t2, i2 = null !== (t2 = this._instance.config.evaluation_contexts) && void 0 !== t2 ? t2 : this._instance.config.evaluation_environments;
    return !this._instance.config.evaluation_environments || this._instance.config.evaluation_contexts || this.ci || (bn.warn("evaluation_environments is deprecated. Use evaluation_contexts instead. evaluation_environments will be removed in a future version."), this.ci = true), null != i2 && i2.length ? i2.filter((t3) => {
      var i3 = t3 && "string" == typeof t3 && t3.trim().length > 0;
      return i3 || bn.error("Invalid evaluation context found:", t3, "Expected non-empty string"), i3;
    }) : [];
  }
  pi() {
    return this.fi().length > 0;
  }
  flags() {
    if (this._instance.config.__preview_remote_config) this.di = true;
    else {
      var t2 = !this.gi && (this._instance.config.advanced_disable_feature_flags || this._instance.config.advanced_disable_feature_flags_on_first_load);
      this.mi({ disableFlags: t2 });
    }
  }
  get hasLoadedFlags() {
    return this.ai;
  }
  getFlags() {
    return Object.keys(this.getFlagVariants());
  }
  getFlagsWithDetails() {
    var t2 = this._instance.get_property(ne), i2 = this._instance.get_property(En), e2 = this._instance.get_property(Sn);
    if (!e2 && !i2) return t2 || {};
    var r2 = Ri({}, t2 || {}), s2 = [.../* @__PURE__ */ new Set([...Object.keys(e2 || {}), ...Object.keys(i2 || {})])];
    for (var n2 of s2) {
      var o2, a2, l2 = r2[n2], u2 = null == i2 ? void 0 : i2[n2], h2 = M(u2) ? null !== (o2 = null == l2 ? void 0 : l2.enabled) && void 0 !== o2 && o2 : !!u2, d2 = M(u2) ? l2.variant : "string" == typeof u2 ? u2 : void 0, v2 = null == e2 ? void 0 : e2[n2], c2 = g({}, l2, { enabled: h2, variant: h2 ? null != d2 ? d2 : null == l2 ? void 0 : l2.variant : void 0 });
      if (h2 !== (null == l2 ? void 0 : l2.enabled) && (c2.original_enabled = null == l2 ? void 0 : l2.enabled), d2 !== (null == l2 ? void 0 : l2.variant) && (c2.original_variant = null == l2 ? void 0 : l2.variant), v2) c2.metadata = g({}, null == l2 ? void 0 : l2.metadata, { payload: v2, original_payload: null == l2 || null == (a2 = l2.metadata) ? void 0 : a2.payload });
      r2[n2] = c2;
    }
    return this.oi || (bn.warn(" Overriding feature flag details!", { flagDetails: t2, overriddenPayloads: e2, finalDetails: r2 }), this.oi = true), r2;
  }
  getFlagVariants() {
    var t2 = this._instance.get_property(re), i2 = this._instance.get_property(En);
    if (!i2) return t2 || {};
    for (var e2 = Ri({}, t2), r2 = Object.keys(i2), s2 = 0; s2 < r2.length; s2++) e2[r2[s2]] = i2[r2[s2]];
    return this.oi || (bn.warn(" Overriding feature flags!", { enabledFlags: t2, overriddenFlags: i2, finalFlags: e2 }), this.oi = true), e2;
  }
  getFlagPayloads() {
    var t2 = this._instance.get_property($n), i2 = this._instance.get_property(Sn);
    if (!i2) return t2 || {};
    for (var e2 = Ri({}, t2 || {}), r2 = Object.keys(i2), s2 = 0; s2 < r2.length; s2++) e2[r2[s2]] = i2[r2[s2]];
    return this.oi || (bn.warn(" Overriding feature flag payloads!", { flagPayloads: t2, overriddenPayloads: i2, finalPayloads: e2 }), this.oi = true), e2;
  }
  reloadFeatureFlags() {
    this.ui || this._instance.config.advanced_disable_feature_flags || this.gi || (this.gi = setTimeout(() => {
      this.mi();
    }, 5));
  }
  yi() {
    clearTimeout(this.gi), this.gi = void 0;
  }
  ensureFlagsLoaded() {
    this.ai || this.li || this.gi || this.reloadFeatureFlags();
  }
  setAnonymousDistinctId(t2) {
    this.$anon_distinct_id = t2;
  }
  setReloadingPaused(t2) {
    this.ui = t2;
  }
  mi(t2) {
    var i2;
    if (this.yi(), !this._instance.O()) if (this.li) this.hi = true;
    else {
      var e2 = this._instance.config.token, r2 = this._instance.get_property("$device_id"), s2 = { token: e2, distinct_id: this._instance.get_distinct_id(), groups: this._instance.getGroups(), $anon_distinct_id: this.$anon_distinct_id, person_properties: g({}, (null == (i2 = this._instance.persistence) ? void 0 : i2.get_initial_props()) || {}, this._instance.get_property(oe) || {}), group_properties: this._instance.get_property(ae) };
      D(r2) || M(r2) || (s2.$device_id = r2), (null != t2 && t2.disableFlags || this._instance.config.advanced_disable_feature_flags) && (s2.disable_flags = true), this.pi() && (s2.evaluation_contexts = this.fi());
      var n2 = this._instance.config.__preview_remote_config, o2 = n2 ? "/flags/?v=2" : "/flags/?v=2&config=true", a2 = this._instance.config.advanced_only_evaluate_survey_feature_flags ? "&only_evaluate_survey_feature_flags=true" : "", l2 = this._instance.requestRouter.endpointFor("flags", o2 + a2);
      n2 && (s2.timezone = cs()), this.li = true, this._instance._send_request({ method: "POST", url: l2, data: s2, compression: this._instance.config.disable_compression ? void 0 : $s.Base64, timeout: this._instance.config.feature_flag_request_timeout_ms, callback: (t3) => {
        var i3, e3, r3 = true;
        (200 === t3.statusCode && (this.hi || (this.$anon_distinct_id = void 0), r3 = false), this.li = false, this.di) || (this.di = true, this._instance.bi(null !== (e3 = t3.json) && void 0 !== e3 ? e3 : {}));
        if (!s2.disable_flags || this.hi) if (this.vi = !r3, t3.json && null != (i3 = t3.json.quotaLimited) && i3.includes(Cn.FeatureFlags)) bn.warn("You have hit your feature flags quota limit, and will not be able to load feature flags until the quota is reset.  Please visit https://posthog.com/docs/billing/limits-alerts to learn more.");
        else {
          var n3;
          if (!s2.disable_flags) this.receivedFeatureFlags(null !== (n3 = t3.json) && void 0 !== n3 ? n3 : {}, r3);
          this.hi && (this.hi = false, this.mi());
        }
      } });
    }
  }
  getFeatureFlag(t2, i2) {
    if (void 0 === i2 && (i2 = {}), this.ai || this.getFlags() && this.getFlags().length > 0) {
      var e2 = this.getFlagVariants()[t2], r2 = "" + e2, s2 = this._instance.get_property(kn) || void 0, n2 = this._instance.get_property(Pn) || void 0, o2 = this._instance.get_property(ue) || {};
      if ((i2.send_event || !("send_event" in i2)) && (!(t2 in o2) || !o2[t2].includes(r2))) {
        var a2, l2, u2, h2, d2, v2, c2, f2, p2;
        I(o2[t2]) ? o2[t2].push(r2) : o2[t2] = [r2], null == (a2 = this._instance.persistence) || a2.register({ [ue]: o2 });
        var g2 = this.getFeatureFlagDetails(t2), _2 = { $feature_flag: t2, $feature_flag_response: e2, $feature_flag_payload: this.getFeatureFlagPayload(t2) || null, $feature_flag_request_id: s2, $feature_flag_evaluated_at: n2, $feature_flag_bootstrapped_response: (null == (l2 = this._instance.config.bootstrap) || null == (l2 = l2.featureFlags) ? void 0 : l2[t2]) || null, $feature_flag_bootstrapped_payload: (null == (u2 = this._instance.config.bootstrap) || null == (u2 = u2.featureFlagPayloads) ? void 0 : u2[t2]) || null, $used_bootstrap_value: !this.vi };
        M(null == g2 || null == (h2 = g2.metadata) ? void 0 : h2.version) || (_2.$feature_flag_version = g2.metadata.version);
        var m2, y2 = null !== (d2 = null == g2 || null == (v2 = g2.reason) ? void 0 : v2.description) && void 0 !== d2 ? d2 : null == g2 || null == (c2 = g2.reason) ? void 0 : c2.code;
        if (y2 && (_2.$feature_flag_reason = y2), null != g2 && null != (f2 = g2.metadata) && f2.id && (_2.$feature_flag_id = g2.metadata.id), M(null == g2 ? void 0 : g2.original_variant) && M(null == g2 ? void 0 : g2.original_enabled) || (_2.$feature_flag_original_response = M(g2.original_variant) ? g2.original_enabled : g2.original_variant), null != g2 && null != (p2 = g2.metadata) && p2.original_payload) _2.$feature_flag_original_payload = null == g2 || null == (m2 = g2.metadata) ? void 0 : m2.original_payload;
        this._instance.capture("$feature_flag_called", _2);
      }
      return e2;
    }
    bn.warn('getFeatureFlag for key "' + t2 + `" failed. Feature flags didn't load in time.`);
  }
  getFeatureFlagDetails(t2) {
    return this.getFlagsWithDetails()[t2];
  }
  getFeatureFlagPayload(t2) {
    return this.getFlagPayloads()[t2];
  }
  getRemoteConfigPayload(t2, i2) {
    var e2 = this._instance.config.token, r2 = { distinct_id: this._instance.get_distinct_id(), token: e2 };
    this.pi() && (r2.evaluation_contexts = this.fi()), this._instance._send_request({ method: "POST", url: this._instance.requestRouter.endpointFor("flags", "/flags/?v=2&config=true"), data: r2, compression: this._instance.config.disable_compression ? void 0 : $s.Base64, timeout: this._instance.config.feature_flag_request_timeout_ms, callback: (e3) => {
      var r3, s2 = null == (r3 = e3.json) ? void 0 : r3.featureFlagPayloads;
      i2((null == s2 ? void 0 : s2[t2]) || void 0);
    } });
  }
  isFeatureEnabled(t2, i2) {
    if (void 0 === i2 && (i2 = {}), this.ai || this.getFlags() && this.getFlags().length > 0) {
      var e2 = this.getFeatureFlag(t2, i2);
      return M(e2) ? void 0 : !!e2;
    }
    bn.warn('isFeatureEnabled for key "' + t2 + `" failed. Feature flags didn't load in time.`);
  }
  addFeatureFlagsHandler(t2) {
    this.featureFlagEventHandlers.push(t2);
  }
  removeFeatureFlagsHandler(t2) {
    this.featureFlagEventHandlers = this.featureFlagEventHandlers.filter((i2) => i2 !== t2);
  }
  receivedFeatureFlags(t2, i2) {
    if (this._instance.persistence) {
      this.ai = true;
      var e2 = this.getFlagVariants(), r2 = this.getFlagPayloads(), s2 = this.getFlagsWithDetails();
      !function(t3, i3, e3, r3, s3) {
        void 0 === e3 && (e3 = {}), void 0 === r3 && (r3 = {}), void 0 === s3 && (s3 = {});
        var n2 = In(t3), o2 = n2.flags, a2 = n2.featureFlags, l2 = n2.featureFlagPayloads;
        if (a2) {
          var u2 = t3.requestId, h2 = t3.evaluatedAt;
          if (I(a2)) {
            bn.warn("v1 of the feature flags endpoint is deprecated. Please use the latest version.");
            var d2 = {};
            if (a2) for (var v2 = 0; v2 < a2.length; v2++) d2[a2[v2]] = true;
            i3 && i3.register({ [xn]: a2, [re]: d2 });
          } else {
            var c2 = a2, f2 = l2, p2 = o2;
            t3.errorsWhileComputingFlags && (c2 = g({}, e3, c2), f2 = g({}, r3, f2), p2 = g({}, s3, p2)), i3 && i3.register(g({ [xn]: Object.keys(Tn(c2)), [re]: c2 || {}, [$n]: f2 || {}, [ne]: p2 || {} }, u2 ? { [kn]: u2 } : {}, h2 ? { [Pn]: h2 } : {}));
          }
        }
      }(t2, this._instance.persistence, e2, r2, s2), this.wi(i2);
    }
  }
  override(t2, i2) {
    void 0 === i2 && (i2 = false), bn.warn("override is deprecated. Please use overrideFeatureFlags instead."), this.overrideFeatureFlags({ flags: t2, suppressWarning: i2 });
  }
  overrideFeatureFlags(t2) {
    if (!this._instance.__loaded || !this._instance.persistence) return bn.uninitializedWarning("posthog.featureFlags.overrideFeatureFlags");
    if (false === t2) return this._instance.persistence.unregister(En), this._instance.persistence.unregister(Sn), this.wi(), wn.info("All overrides cleared");
    if (t2 && "object" == typeof t2 && ("flags" in t2 || "payloads" in t2)) {
      var i2, e2 = t2;
      if (this.oi = Boolean(null !== (i2 = e2.suppressWarning) && void 0 !== i2 && i2), "flags" in e2) {
        if (false === e2.flags) this._instance.persistence.unregister(En), wn.info("Flag overrides cleared");
        else if (e2.flags) {
          if (I(e2.flags)) {
            for (var r2 = {}, s2 = 0; s2 < e2.flags.length; s2++) r2[e2.flags[s2]] = true;
            this._instance.persistence.register({ [En]: r2 });
          } else this._instance.persistence.register({ [En]: e2.flags });
          wn.info("Flag overrides set", { flags: e2.flags });
        }
      }
      return "payloads" in e2 && (false === e2.payloads ? (this._instance.persistence.unregister(Sn), wn.info("Payload overrides cleared")) : e2.payloads && (this._instance.persistence.register({ [Sn]: e2.payloads }), wn.info("Payload overrides set", { payloads: e2.payloads }))), void this.wi();
    }
    this.wi();
  }
  onFeatureFlags(t2) {
    if (this.addFeatureFlagsHandler(t2), this.ai) {
      var { flags: i2, flagVariants: e2 } = this.xi();
      t2(i2, e2);
    }
    return () => this.removeFeatureFlagsHandler(t2);
  }
  updateEarlyAccessFeatureEnrollment(t2, i2, e2) {
    var r2, s2 = (this._instance.get_property(se) || []).find((i3) => i3.flagKey === t2), n2 = { ["$feature_enrollment/" + t2]: i2 }, o2 = { $feature_flag: t2, $feature_enrollment: i2, $set: n2 };
    s2 && (o2.$early_access_feature_name = s2.name), e2 && (o2.$feature_enrollment_stage = e2), this._instance.capture("$feature_enrollment_update", o2), this.setPersonPropertiesForFlags(n2, false);
    var a2 = g({}, this.getFlagVariants(), { [t2]: i2 });
    null == (r2 = this._instance.persistence) || r2.register({ [xn]: Object.keys(Tn(a2)), [re]: a2 }), this.wi();
  }
  getEarlyAccessFeatures(t2, i2, e2) {
    void 0 === i2 && (i2 = false);
    var r2 = this._instance.get_property(se), s2 = e2 ? "&" + e2.map((t3) => "stage=" + t3).join("&") : "";
    if (r2 && !i2) return t2(r2);
    this._instance._send_request({ url: this._instance.requestRouter.endpointFor("api", "/api/early_access_features/?token=" + this._instance.config.token + s2), method: "GET", callback: (i3) => {
      var e3, r3;
      if (i3.json) {
        var s3 = i3.json.earlyAccessFeatures;
        return null == (e3 = this._instance.persistence) || e3.unregister(se), null == (r3 = this._instance.persistence) || r3.register({ [se]: s3 }), t2(s3);
      }
    } });
  }
  xi() {
    var t2 = this.getFlags(), i2 = this.getFlagVariants();
    return { flags: t2.filter((t3) => i2[t3]), flagVariants: Object.keys(i2).filter((t3) => i2[t3]).reduce((t3, e2) => (t3[e2] = i2[e2], t3), {}) };
  }
  wi(t2) {
    var { flags: i2, flagVariants: e2 } = this.xi();
    this.featureFlagEventHandlers.forEach((r2) => r2(i2, e2, { errorsLoading: t2 }));
  }
  setPersonPropertiesForFlags(t2, i2) {
    void 0 === i2 && (i2 = true);
    var e2 = this._instance.get_property(oe) || {};
    this._instance.register({ [oe]: g({}, e2, t2) }), i2 && this._instance.reloadFeatureFlags();
  }
  resetPersonPropertiesForFlags() {
    this._instance.unregister(oe);
  }
  setGroupPropertiesForFlags(t2, i2) {
    void 0 === i2 && (i2 = true);
    var e2 = this._instance.get_property(ae) || {};
    0 !== Object.keys(e2).length && Object.keys(e2).forEach((i3) => {
      e2[i3] = g({}, e2[i3], t2[i3]), delete t2[i3];
    }), this._instance.register({ [ae]: g({}, e2, t2) }), i2 && this._instance.reloadFeatureFlags();
  }
  resetGroupPropertiesForFlags(t2) {
    if (t2) {
      var i2 = this._instance.get_property(ae) || {};
      this._instance.register({ [ae]: g({}, i2, { [t2]: {} }) });
    } else this._instance.unregister(ae);
  }
  reset() {
    this.ai = false, this.li = false, this.ui = false, this.hi = false, this.di = false, this.vi = false, this.$anon_distinct_id = void 0, this.yi(), this.oi = false;
  }
}
var Fn = ["cookie", "localstorage", "localstorage+cookie", "sessionstorage", "memory"];
class Mn {
  constructor(t2, i2) {
    this.R = t2, this.props = {}, this.Ei = false, this.$i = ((t3) => {
      var i3 = "";
      return t3.token && (i3 = t3.token.replace(/\+/g, "PL").replace(/\//g, "SL").replace(/=/g, "EQ")), t3.persistence_name ? "ph_" + t3.persistence_name : "ph_" + i3 + "_posthog";
    })(t2), this.Y = this.Si(t2), this.load(), t2.debug && $i.info("Persistence loaded", t2.persistence, g({}, this.props)), this.update_config(t2, t2, i2), this.save();
  }
  isDisabled() {
    return !!this.ki;
  }
  Si(i2) {
    -1 === Fn.indexOf(i2.persistence.toLowerCase()) && ($i.critical("Unknown persistence type " + i2.persistence + "; falling back to localStorage+cookie"), i2.persistence = "localStorage+cookie");
    var e2 = function(i3) {
      void 0 === i3 && (i3 = []);
      var e3 = [...Tr, ...i3];
      return g({}, Pr, { W: function(t2) {
        try {
          var i4 = {};
          try {
            i4 = Sr.W(t2) || {};
          } catch (t3) {
          }
          var e4 = Ri(i4, JSON.parse(Pr.q(t2) || "{}"));
          return Pr.G(t2, e4), e4;
        } catch (t3) {
        }
        return null;
      }, G: function(t2, i4, r3, s2, n2, o2) {
        try {
          Pr.G(t2, i4, void 0, void 0, o2);
          var a2 = {};
          e3.forEach((t3) => {
            i4[t3] && (a2[t3] = i4[t3]);
          }), Object.keys(a2).length && Sr.G(t2, a2, r3, s2, n2, o2);
        } catch (t3) {
          Pr.B(t3);
        }
      }, V: function(i4, e4) {
        try {
          null == t || t.localStorage.removeItem(i4), Sr.V(i4, e4);
        } catch (t2) {
          Pr.B(t2);
        }
      } });
    }(i2.cookie_persisted_properties || []), r2 = i2.persistence.toLowerCase();
    return "localstorage" === r2 && Pr.H() ? Pr : "localstorage+cookie" === r2 && e2.H() ? e2 : "sessionstorage" === r2 && Fr.H() ? Fr : "memory" === r2 ? Cr : "cookie" === r2 ? Sr : e2.H() ? e2 : Sr;
  }
  properties() {
    var t2 = {};
    return Ci(this.props, function(i2, e2) {
      if (e2 === re && R(i2)) for (var r2 = Object.keys(i2), n2 = 0; n2 < r2.length; n2++) t2["$feature/" + r2[n2]] = i2[r2[n2]];
      else a2 = e2, l2 = false, (D(o2 = ye) ? l2 : s && o2.indexOf === s ? -1 != o2.indexOf(a2) : (Ci(o2, function(t3) {
        if (l2 || (l2 = t3 === a2)) return Ti;
      }), l2)) || (t2[e2] = i2);
      var o2, a2, l2;
    }), t2;
  }
  load() {
    if (!this.ki) {
      var t2 = this.Y.W(this.$i);
      t2 && (this.props = Ri({}, t2));
    }
  }
  save() {
    this.ki || this.Y.G(this.$i, this.props, this.Pi, this.Ti, this.Ii, this.R.debug);
  }
  remove() {
    this.Y.V(this.$i, false), this.Y.V(this.$i, true);
  }
  clear() {
    this.remove(), this.props = {};
  }
  register_once(t2, i2, e2) {
    if (R(t2)) {
      M(i2) && (i2 = "None"), this.Pi = M(e2) ? this.Ci : e2;
      var r2 = false;
      if (Ci(t2, (t3, e3) => {
        this.props.hasOwnProperty(e3) && this.props[e3] !== i2 || (this.props[e3] = t3, r2 = true);
      }), r2) return this.save(), true;
    }
    return false;
  }
  register(t2, i2) {
    if (R(t2)) {
      this.Pi = M(i2) ? this.Ci : i2;
      var e2 = false;
      if (Ci(t2, (i3, r2) => {
        t2.hasOwnProperty(r2) && this.props[r2] !== i3 && (this.props[r2] = i3, e2 = true);
      }), e2) return this.save(), true;
    }
    return false;
  }
  unregister(t2) {
    t2 in this.props && (delete this.props[t2], this.save());
  }
  update_campaign_params() {
    if (!this.Ei) {
      var t2 = os(this.R.custom_campaign_params, this.R.mask_personal_data_properties, this.R.custom_personal_data_properties);
      F(Di(t2)) || this.register(t2), this.Ei = true;
    }
  }
  update_search_keyword() {
    var t2;
    this.register((t2 = null == o ? void 0 : o.referrer) ? ls(t2) : {});
  }
  update_referrer_info() {
    var t2;
    this.register_once({ $referrer: hs(), $referring_domain: null != o && o.referrer && (null == (t2 = er(o.referrer)) ? void 0 : t2.host) || "$direct" }, void 0);
  }
  set_initial_person_info() {
    this.props[ce] || this.props[fe] || this.register_once({ [pe]: ds(this.R.mask_personal_data_properties, this.R.custom_personal_data_properties) }, void 0);
  }
  get_initial_props() {
    var t2 = {};
    Ci([fe, ce], (i3) => {
      var e3 = this.props[i3];
      e3 && Ci(e3, function(i4, e4) {
        t2["$initial_" + E(e4)] = i4;
      });
    });
    var i2, e2, r2 = this.props[pe];
    if (r2) {
      var s2 = (i2 = vs(r2), e2 = {}, Ci(i2, function(t3, i3) {
        e2["$initial_" + E(i3)] = t3;
      }), e2);
      Ri(t2, s2);
    }
    return t2;
  }
  safe_merge(t2) {
    return Ci(this.props, function(i2, e2) {
      e2 in t2 || (t2[e2] = i2);
    }), t2;
  }
  update_config(t2, i2, e2) {
    if (this.Ci = this.Pi = t2.cookie_expiration, this.set_disabled(t2.disable_persistence || !!e2), this.set_cross_subdomain(t2.cross_subdomain_cookie), this.set_secure(t2.secure_cookie), t2.persistence !== i2.persistence || !((t3, i3) => {
      if (t3.length !== i3.length) return false;
      var e3 = [...t3].sort(), r3 = [...i3].sort();
      return e3.every((t4, i4) => t4 === r3[i4]);
    })(t2.cookie_persisted_properties || [], i2.cookie_persisted_properties || [])) {
      var r2 = this.Si(t2), s2 = this.props;
      this.clear(), this.Y = r2, this.props = s2, this.save();
    }
  }
  set_disabled(t2) {
    this.ki = t2, this.ki ? this.remove() : this.save();
  }
  set_cross_subdomain(t2) {
    t2 !== this.Ti && (this.Ti = t2, this.remove(), this.save());
  }
  set_secure(t2) {
    t2 !== this.Ii && (this.Ii = t2, this.remove(), this.save());
  }
  set_event_timer(t2, i2) {
    var e2 = this.props[qi] || {};
    e2[t2] = i2, this.props[qi] = e2, this.save();
  }
  remove_event_timer(t2) {
    var i2 = (this.props[qi] || {})[t2];
    return M(i2) || (delete this.props[qi][t2], this.save()), i2;
  }
  get_property(t2) {
    return this.props[t2];
  }
  set_property(t2, i2) {
    this.props[t2] = i2, this.save();
  }
}
var On = Si("[Product Tours]"), An = "ph_product_tours";
class Dn {
  constructor(t2) {
    this.Ri = null, this.Fi = null, this._instance = t2;
  }
  onRemoteConfig(t2) {
    this._instance.persistence && this._instance.persistence.register({ [Qi]: !(null == t2 || !t2.productTours) }), this.loadIfEnabled();
  }
  loadIfEnabled() {
    var t2, i2;
    this.Ri || ((t2 = this._instance).config.disable_product_tours || null == (i2 = t2.persistence) || !i2.get_property(Qi)) || this.it(() => this.Mi());
  }
  it(t2) {
    var i2, e2;
    null != (i2 = v.__PosthogExtensions__) && i2.generateProductTours ? t2() : null == (e2 = v.__PosthogExtensions__) || null == e2.loadExternalDependency || e2.loadExternalDependency(this._instance, "product-tours", (i3) => {
      i3 ? On.error("Could not load product tours script", i3) : t2();
    });
  }
  Mi() {
    var t2;
    !this.Ri && null != (t2 = v.__PosthogExtensions__) && t2.generateProductTours && (this.Ri = v.__PosthogExtensions__.generateProductTours(this._instance, true));
  }
  getProductTours(t2, i2) {
    if (void 0 === i2 && (i2 = false), !I(this.Fi) || i2) {
      var e2 = this._instance.persistence;
      if (e2) {
        var r2 = e2.props[An];
        if (I(r2) && !i2) return this.Fi = r2, void t2(r2, { isLoaded: true });
      }
      this._instance._send_request({ url: this._instance.requestRouter.endpointFor("api", "/api/product_tours/?token=" + this._instance.config.token), method: "GET", callback: (i3) => {
        var r3 = i3.statusCode;
        if (200 !== r3 || !i3.json) {
          var s2 = "Product Tours API could not be loaded, status: " + r3;
          return On.error(s2), void t2([], { isLoaded: false, error: s2 });
        }
        var n2 = I(i3.json.product_tours) ? i3.json.product_tours : [];
        this.Fi = n2, e2 && e2.register({ [An]: n2 }), t2(n2, { isLoaded: true });
      } });
    } else t2(this.Fi, { isLoaded: true });
  }
  getActiveProductTours(t2) {
    j(this.Ri) ? t2([], { isLoaded: false, error: "Product tours not loaded" }) : this.Ri.getActiveProductTours(t2);
  }
  showProductTour(t2) {
    var i2;
    null == (i2 = this.Ri) || i2.showTourById(t2);
  }
  previewTour(t2) {
    this.Ri ? this.Ri.previewTour(t2) : this.it(() => {
      var i2;
      this.Mi(), null == (i2 = this.Ri) || i2.previewTour(t2);
    });
  }
  dismissProductTour() {
    var t2;
    null == (t2 = this.Ri) || t2.dismissTour("user_clicked_skip");
  }
  nextStep() {
    var t2;
    null == (t2 = this.Ri) || t2.nextStep();
  }
  previousStep() {
    var t2;
    null == (t2 = this.Ri) || t2.previousStep();
  }
  clearCache() {
    var t2;
    this.Fi = null, null == (t2 = this._instance.persistence) || t2.unregister(An);
  }
  resetTour(t2) {
    var i2;
    null == (i2 = this.Ri) || i2.resetTour(t2);
  }
  resetAllTours() {
    var t2;
    null == (t2 = this.Ri) || t2.resetAllTours();
  }
  cancelPendingTour(t2) {
    var i2;
    null == (i2 = this.Ri) || i2.cancelPendingTour(t2);
  }
}
var jn = function(t2) {
  return t2.Activation = "events", t2.Cancellation = "cancelEvents", t2;
}({});
(function(t2) {
  return t2.Button = "button", t2.Tab = "tab", t2.Selector = "selector", t2;
})({});
(function(t2) {
  return t2.TopLeft = "top_left", t2.TopRight = "top_right", t2.TopCenter = "top_center", t2.MiddleLeft = "middle_left", t2.MiddleRight = "middle_right", t2.MiddleCenter = "middle_center", t2.Left = "left", t2.Center = "center", t2.Right = "right", t2.NextToTrigger = "next_to_trigger", t2;
})({});
(function(t2) {
  return t2.Top = "top", t2.Left = "left", t2.Right = "right", t2.Bottom = "bottom", t2;
})({});
var zn = function(t2) {
  return t2.Popover = "popover", t2.API = "api", t2.Widget = "widget", t2.ExternalSurvey = "external_survey", t2;
}({});
(function(t2) {
  return t2.Open = "open", t2.MultipleChoice = "multiple_choice", t2.SingleChoice = "single_choice", t2.Rating = "rating", t2.Link = "link", t2;
})({});
(function(t2) {
  return t2.NextQuestion = "next_question", t2.End = "end", t2.ResponseBased = "response_based", t2.SpecificQuestion = "specific_question", t2;
})({});
(function(t2) {
  return t2.Once = "once", t2.Recurring = "recurring", t2.Always = "always", t2;
})({});
var Wn = function(t2) {
  return t2.SHOWN = "survey shown", t2.DISMISSED = "survey dismissed", t2.SENT = "survey sent", t2.ABANDONED = "survey abandoned", t2;
}({}), Gn = function(t2) {
  return t2.SURVEY_ID = "$survey_id", t2.SURVEY_NAME = "$survey_name", t2.SURVEY_RESPONSE = "$survey_response", t2.SURVEY_ITERATION = "$survey_iteration", t2.SURVEY_ITERATION_START_DATE = "$survey_iteration_start_date", t2.SURVEY_PARTIALLY_COMPLETED = "$survey_partially_completed", t2.SURVEY_SUBMISSION_ID = "$survey_submission_id", t2.SURVEY_QUESTIONS = "$survey_questions", t2.SURVEY_COMPLETED = "$survey_completed", t2.PRODUCT_TOUR_ID = "$product_tour_id", t2.SURVEY_LAST_SEEN_DATE = "$survey_last_seen_date", t2;
}({}), Vn = function(t2) {
  return t2.Popover = "popover", t2.Inline = "inline", t2;
}({}), Jn = Si("[Surveys]");
var Kn = "seenSurvey_", Yn = (t2, i2) => {
  var e2 = "$survey_" + i2 + "/" + t2.id;
  return t2.current_iteration && t2.current_iteration > 0 && (e2 = "$survey_" + i2 + "/" + t2.id + "/" + t2.current_iteration), e2;
}, Xn = (t2) => ((t3, i2) => {
  var e2 = "" + t3 + i2.id;
  return i2.current_iteration && i2.current_iteration > 0 && (e2 = "" + t3 + i2.id + "_" + i2.current_iteration), e2;
})(Kn, t2), Qn = [zn.Popover, zn.Widget, zn.API], Zn = { ignoreConditions: false, ignoreDelay: false, displayType: Vn.Popover };
class to {
  constructor() {
    this.Oi = {}, this.Oi = {};
  }
  on(t2, i2) {
    return this.Oi[t2] || (this.Oi[t2] = []), this.Oi[t2].push(i2), () => {
      this.Oi[t2] = this.Oi[t2].filter((t3) => t3 !== i2);
    };
  }
  emit(t2, i2) {
    for (var e2 of this.Oi[t2] || []) e2(i2);
    for (var r2 of this.Oi["*"] || []) r2(t2, i2);
  }
}
function io(t2, i2, e2) {
  if (j(t2)) return false;
  switch (e2) {
    case "exact":
      return t2 === i2;
    case "contains":
      var r2 = i2.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/_/g, ".").replace(/%/g, ".*");
      return new RegExp(r2, "i").test(t2);
    case "regex":
      try {
        return new RegExp(i2).test(t2);
      } catch (t3) {
        return false;
      }
    default:
      return false;
  }
}
class eo {
  constructor(t2) {
    this.Ai = new to(), this.Di = (t3, i2) => this.ji(t3, i2) && this.Li(t3, i2) && this.Ni(t3, i2) && this.Ui(t3, i2), this.ji = (t3, i2) => null == i2 || !i2.event || (null == t3 ? void 0 : t3.event) === (null == i2 ? void 0 : i2.event), this._instance = t2, this.zi = /* @__PURE__ */ new Set(), this.Hi = /* @__PURE__ */ new Set();
  }
  init() {
    var t2;
    if (!M(null == (t2 = this._instance) ? void 0 : t2._addCaptureHook)) {
      var i2;
      null == (i2 = this._instance) || i2._addCaptureHook((t3, i3) => {
        this.on(t3, i3);
      });
    }
  }
  register(t2) {
    var i2, e2;
    if (!M(null == (i2 = this._instance) ? void 0 : i2._addCaptureHook) && (t2.forEach((t3) => {
      var i3, e3;
      null == (i3 = this.Hi) || i3.add(t3), null == (e3 = t3.steps) || e3.forEach((t4) => {
        var i4;
        null == (i4 = this.zi) || i4.add((null == t4 ? void 0 : t4.event) || "");
      });
    }), null != (e2 = this._instance) && e2.autocapture)) {
      var r2, s2 = /* @__PURE__ */ new Set();
      t2.forEach((t3) => {
        var i3;
        null == (i3 = t3.steps) || i3.forEach((t4) => {
          null != t4 && t4.selector && s2.add(null == t4 ? void 0 : t4.selector);
        });
      }), null == (r2 = this._instance) || r2.autocapture.setElementSelectors(s2);
    }
  }
  on(t2, i2) {
    var e2;
    null != i2 && 0 != t2.length && (this.zi.has(t2) || this.zi.has(null == i2 ? void 0 : i2.event)) && this.Hi && (null == (e2 = this.Hi) ? void 0 : e2.size) > 0 && this.Hi.forEach((t3) => {
      this.Bi(i2, t3) && this.Ai.emit("actionCaptured", t3.name);
    });
  }
  qi(t2) {
    this.onAction("actionCaptured", (i2) => t2(i2));
  }
  Bi(t2, i2) {
    if (null == (null == i2 ? void 0 : i2.steps)) return false;
    for (var e2 of i2.steps) if (this.Di(t2, e2)) return true;
    return false;
  }
  onAction(t2, i2) {
    return this.Ai.on(t2, i2);
  }
  Li(t2, i2) {
    if (null != i2 && i2.url) {
      var e2, r2 = null == t2 || null == (e2 = t2.properties) ? void 0 : e2.$current_url;
      if (!r2 || "string" != typeof r2) return false;
      if (!io(r2, i2.url, i2.url_matching || "contains")) return false;
    }
    return true;
  }
  Ni(t2, i2) {
    return !!this.Wi(t2, i2) && (!!this.Gi(t2, i2) && !!this.Vi(t2, i2));
  }
  Wi(t2, i2) {
    var e2;
    if (null == i2 || !i2.href) return true;
    var r2 = this.Ji(t2);
    if (r2.length > 0) return r2.some((t3) => io(t3.href, i2.href, i2.href_matching || "exact"));
    var s2, n2 = (null == t2 || null == (e2 = t2.properties) ? void 0 : e2.$elements_chain) || "";
    return !!n2 && io((s2 = n2.match(/(?::|")href="(.*?)"/)) ? s2[1] : "", i2.href, i2.href_matching || "exact");
  }
  Gi(t2, i2) {
    var e2;
    if (null == i2 || !i2.text) return true;
    var r2 = this.Ji(t2);
    if (r2.length > 0) return r2.some((t3) => io(t3.text, i2.text, i2.text_matching || "exact") || io(t3.$el_text, i2.text, i2.text_matching || "exact"));
    var s2, n2, o2, a2 = (null == t2 || null == (e2 = t2.properties) ? void 0 : e2.$elements_chain) || "";
    return !!a2 && (s2 = function(t3) {
      for (var i3, e3 = [], r3 = /(?::|")text="(.*?)"/g; !j(i3 = r3.exec(t3)); ) e3.includes(i3[1]) || e3.push(i3[1]);
      return e3;
    }(a2), n2 = i2.text, o2 = i2.text_matching || "exact", s2.some((t3) => io(t3, n2, o2)));
  }
  Vi(t2, i2) {
    var e2, r2;
    if (null == i2 || !i2.selector) return true;
    var s2 = null == t2 || null == (e2 = t2.properties) ? void 0 : e2.$element_selectors;
    if (null != s2 && s2.includes(i2.selector)) return true;
    var n2 = (null == t2 || null == (r2 = t2.properties) ? void 0 : r2.$elements_chain) || "";
    if (i2.selector_regex && n2) try {
      return new RegExp(i2.selector_regex).test(n2);
    } catch (t3) {
      return false;
    }
    return false;
  }
  Ji(t2) {
    var i2;
    return null == (null == t2 || null == (i2 = t2.properties) ? void 0 : i2.$elements) ? [] : null == t2 ? void 0 : t2.properties.$elements;
  }
  Ui(t2, i2) {
    return null == i2 || !i2.properties || 0 === i2.properties.length || _n(i2.properties.reduce((t3, i3) => {
      var e2 = I(i3.value) ? i3.value.map(String) : null != i3.value ? [String(i3.value)] : [];
      return t3[i3.key] = { values: e2, operator: i3.operator || "exact" }, t3;
    }, {}), null == t2 ? void 0 : t2.properties);
  }
}
class ro {
  constructor(t2) {
    this._instance = t2, this.Ki = /* @__PURE__ */ new Map(), this.Yi = /* @__PURE__ */ new Map(), this.Xi = /* @__PURE__ */ new Map();
  }
  Qi(t2, i2) {
    return !!t2 && _n(t2.propertyFilters, null == i2 ? void 0 : i2.properties);
  }
  Zi(t2, i2) {
    var e2 = /* @__PURE__ */ new Map();
    return t2.forEach((t3) => {
      var r2;
      null == (r2 = t3.conditions) || null == (r2 = r2[i2]) || null == (r2 = r2.values) || r2.forEach((i3) => {
        if (null != i3 && i3.name) {
          var r3 = e2.get(i3.name) || [];
          r3.push(t3.id), e2.set(i3.name, r3);
        }
      });
    }), e2;
  }
  te(t2, i2, e2) {
    var r2 = (e2 === jn.Activation ? this.Ki : this.Yi).get(t2), s2 = [];
    return this.ie((t3) => {
      s2 = t3.filter((t4) => null == r2 ? void 0 : r2.includes(t4.id));
    }), s2.filter((r3) => {
      var s3, n2 = null == (s3 = r3.conditions) || null == (s3 = s3[e2]) || null == (s3 = s3.values) ? void 0 : s3.find((i3) => i3.name === t2);
      return this.Qi(n2, i2);
    });
  }
  register(t2) {
    var i2;
    M(null == (i2 = this._instance) ? void 0 : i2._addCaptureHook) || (this.ee(t2), this.re(t2));
  }
  re(t2) {
    var i2 = t2.filter((t3) => {
      var i3, e2;
      return (null == (i3 = t3.conditions) ? void 0 : i3.actions) && (null == (e2 = t3.conditions) || null == (e2 = e2.actions) || null == (e2 = e2.values) ? void 0 : e2.length) > 0;
    });
    if (0 !== i2.length) {
      if (null == this.se) {
        this.se = new eo(this._instance), this.se.init();
        this.se.qi((t3) => {
          this.onAction(t3);
        });
      }
      i2.forEach((t3) => {
        var i3, e2, r2, s2, n2;
        t3.conditions && null != (i3 = t3.conditions) && i3.actions && null != (e2 = t3.conditions) && null != (e2 = e2.actions) && e2.values && (null == (r2 = t3.conditions) || null == (r2 = r2.actions) || null == (r2 = r2.values) ? void 0 : r2.length) > 0 && (null == (s2 = this.se) || s2.register(t3.conditions.actions.values), null == (n2 = t3.conditions) || null == (n2 = n2.actions) || null == (n2 = n2.values) || n2.forEach((i4) => {
          if (i4 && i4.name) {
            var e3 = this.Xi.get(i4.name);
            e3 && e3.push(t3.id), this.Xi.set(i4.name, e3 || [t3.id]);
          }
        }));
      });
    }
  }
  ee(t2) {
    var i2, e2 = t2.filter((t3) => {
      var i3, e3;
      return (null == (i3 = t3.conditions) ? void 0 : i3.events) && (null == (e3 = t3.conditions) || null == (e3 = e3.events) || null == (e3 = e3.values) ? void 0 : e3.length) > 0;
    }), r2 = t2.filter((t3) => {
      var i3, e3;
      return (null == (i3 = t3.conditions) ? void 0 : i3.cancelEvents) && (null == (e3 = t3.conditions) || null == (e3 = e3.cancelEvents) || null == (e3 = e3.values) ? void 0 : e3.length) > 0;
    });
    if (0 !== e2.length || 0 !== r2.length) {
      null == (i2 = this._instance) || i2._addCaptureHook((t3, i3) => {
        this.onEvent(t3, i3);
      }), this.Ki = this.Zi(t2, jn.Activation), this.Yi = this.Zi(t2, jn.Cancellation);
    }
  }
  onEvent(t2, i2) {
    var e2, r2 = this.ne(), s2 = this.oe(), n2 = this.ae(), o2 = (null == (e2 = this._instance) || null == (e2 = e2.persistence) ? void 0 : e2.props[s2]) || [];
    if (n2 === t2 && i2 && o2.length > 0) {
      var a2, l2;
      r2.info("event matched, removing item from activated items", { event: t2, eventPayload: i2, existingActivatedItems: o2 });
      var u2 = (null == i2 || null == (a2 = i2.properties) ? void 0 : a2.$survey_id) || (null == i2 || null == (l2 = i2.properties) ? void 0 : l2.$product_tour_id);
      if (u2) {
        var h2 = o2.indexOf(u2);
        h2 >= 0 && (o2.splice(h2, 1), this.le(o2));
      }
    } else {
      if (this.Yi.has(t2)) {
        var d2 = this.te(t2, i2, jn.Cancellation);
        d2.length > 0 && (r2.info("cancel event matched, cancelling items", { event: t2, itemsToCancel: d2.map((t3) => t3.id) }), d2.forEach((t3) => {
          var i3 = o2.indexOf(t3.id);
          i3 >= 0 && o2.splice(i3, 1), this.ue(t3.id);
        }), this.le(o2));
      }
      if (this.Ki.has(t2)) {
        r2.info("event name matched", { event: t2, eventPayload: i2, items: this.Ki.get(t2) });
        var v2 = this.te(t2, i2, jn.Activation);
        this.le(o2.concat(v2.map((t3) => t3.id) || []));
      }
    }
  }
  onAction(t2) {
    var i2, e2 = this.oe(), r2 = (null == (i2 = this._instance) || null == (i2 = i2.persistence) ? void 0 : i2.props[e2]) || [];
    this.Xi.has(t2) && this.le(r2.concat(this.Xi.get(t2) || []));
  }
  le(t2) {
    var i2, e2 = this.ne(), r2 = this.oe(), s2 = [...new Set(t2)].filter((t3) => !this.he(t3));
    e2.info("updating activated items", { activatedItems: s2 }), null == (i2 = this._instance) || null == (i2 = i2.persistence) || i2.register({ [r2]: s2 });
  }
  getActivatedIds() {
    var t2, i2 = this.oe(), e2 = null == (t2 = this._instance) || null == (t2 = t2.persistence) ? void 0 : t2.props[i2];
    return e2 || [];
  }
  getEventToItemsMap() {
    return this.Ki;
  }
  de() {
    return this.se;
  }
}
class so extends ro {
  constructor(t2) {
    super(t2);
  }
  oe() {
    return "$surveys_activated";
  }
  ae() {
    return Wn.SHOWN;
  }
  ie(t2) {
    var i2;
    null == (i2 = this._instance) || i2.getSurveys(t2);
  }
  ue(t2) {
    var i2;
    null == (i2 = this._instance) || i2.cancelPendingSurvey(t2);
  }
  ne() {
    return Jn;
  }
  he() {
    return false;
  }
  getSurveys() {
    return this.getActivatedIds();
  }
  getEventToSurveys() {
    return this.getEventToItemsMap();
  }
}
class no {
  constructor(t2) {
    this.ve = void 0, this._surveyManager = null, this.ce = false, this.fe = [], this.pe = null, this._instance = t2, this._surveyEventReceiver = null;
  }
  onRemoteConfig(t2) {
    if (!this._instance.config.disable_surveys) {
      var i2 = t2.surveys;
      if (j(i2)) return Jn.warn("Flags not loaded yet. Not loading surveys.");
      var e2 = I(i2);
      this.ve = e2 ? i2.length > 0 : i2, Jn.info("flags response received, isSurveysEnabled: " + this.ve), this.loadIfEnabled();
    }
  }
  reset() {
    localStorage.removeItem("lastSeenSurveyDate");
    for (var t2 = [], i2 = 0; i2 < localStorage.length; i2++) {
      var e2 = localStorage.key(i2);
      (null != e2 && e2.startsWith(Kn) || null != e2 && e2.startsWith("inProgressSurvey_")) && t2.push(e2);
    }
    t2.forEach((t3) => localStorage.removeItem(t3));
  }
  loadIfEnabled() {
    if (!this._surveyManager) if (this.ce) Jn.info("Already initializing surveys, skipping...");
    else if (this._instance.config.disable_surveys) Jn.info("Disabled. Not loading surveys.");
    else if (this._instance.config.cookieless_mode && this._instance.consent.isOptedOut()) Jn.info("Not loading surveys in cookieless mode without consent.");
    else {
      var t2 = null == v ? void 0 : v.__PosthogExtensions__;
      if (t2) {
        if (!M(this.ve) || this._instance.config.advanced_enable_surveys) {
          var i2 = this.ve || this._instance.config.advanced_enable_surveys;
          this.ce = true;
          try {
            var e2 = t2.generateSurveys;
            if (e2) return void this.ge(e2, i2);
            var r2 = t2.loadExternalDependency;
            if (!r2) return void this._e("PostHog loadExternalDependency extension not found.");
            r2(this._instance, "surveys", (e3) => {
              e3 || !t2.generateSurveys ? this._e("Could not load surveys script", e3) : this.ge(t2.generateSurveys, i2);
            });
          } catch (t3) {
            throw this._e("Error initializing surveys", t3), t3;
          } finally {
            this.ce = false;
          }
        }
      } else Jn.error("PostHog Extensions not found.");
    }
  }
  ge(t2, i2) {
    this._surveyManager = t2(this._instance, i2), this._surveyEventReceiver = new so(this._instance), Jn.info("Surveys loaded successfully"), this.me({ isLoaded: true });
  }
  _e(t2, i2) {
    Jn.error(t2, i2), this.me({ isLoaded: false, error: t2 });
  }
  onSurveysLoaded(t2) {
    return this.fe.push(t2), this._surveyManager && this.me({ isLoaded: true }), () => {
      this.fe = this.fe.filter((i2) => i2 !== t2);
    };
  }
  getSurveys(t2, i2) {
    if (void 0 === i2 && (i2 = false), this._instance.config.disable_surveys) return Jn.info("Disabled. Not loading surveys."), t2([]);
    var e2, r2 = this._instance.get_property(le);
    if (r2 && !i2) return t2(r2, { isLoaded: true });
    "undefined" != typeof Promise && this.pe ? this.pe.then((i3) => {
      var { surveys: e3, context: r3 } = i3;
      return t2(e3, r3);
    }) : ("undefined" != typeof Promise && (this.pe = new Promise((t3) => {
      e2 = t3;
    })), this._instance._send_request({ url: this._instance.requestRouter.endpointFor("api", "/api/surveys/?token=" + this._instance.config.token), method: "GET", timeout: this._instance.config.surveys_request_timeout_ms, callback: (i3) => {
      var r3;
      this.pe = null;
      var s2 = i3.statusCode;
      if (200 !== s2 || !i3.json) {
        var n2 = "Surveys API could not be loaded, status: " + s2;
        Jn.error(n2);
        var o2 = { isLoaded: false, error: n2 };
        return t2([], o2), void (null == e2 || e2({ surveys: [], context: o2 }));
      }
      var a2, l2 = i3.json.surveys || [], u2 = l2.filter((t3) => function(t4) {
        return !(!t4.start_date || t4.end_date);
      }(t3) && (function(t4) {
        var i4;
        return !(null == (i4 = t4.conditions) || null == (i4 = i4.events) || null == (i4 = i4.values) || !i4.length);
      }(t3) || function(t4) {
        var i4;
        return !(null == (i4 = t4.conditions) || null == (i4 = i4.actions) || null == (i4 = i4.values) || !i4.length);
      }(t3)));
      u2.length > 0 && (null == (a2 = this._surveyEventReceiver) || a2.register(u2));
      null == (r3 = this._instance.persistence) || r3.register({ [le]: l2 });
      var h2 = { isLoaded: true };
      t2(l2, h2), null == e2 || e2({ surveys: l2, context: h2 });
    } }));
  }
  me(t2) {
    for (var i2 of this.fe) try {
      if (!t2.isLoaded) return i2([], t2);
      this.getSurveys(i2);
    } catch (t3) {
      Jn.error("Error in survey callback", t3);
    }
  }
  getActiveMatchingSurveys(t2, i2) {
    if (void 0 === i2 && (i2 = false), !j(this._surveyManager)) return this._surveyManager.getActiveMatchingSurveys(t2, i2);
    Jn.warn("init was not called");
  }
  ye(t2) {
    var i2 = null;
    return this.getSurveys((e2) => {
      var r2;
      i2 = null !== (r2 = e2.find((i3) => i3.id === t2)) && void 0 !== r2 ? r2 : null;
    }), i2;
  }
  be(t2) {
    if (j(this._surveyManager)) return { eligible: false, reason: "SDK is not enabled or survey functionality is not yet loaded" };
    var i2 = "string" == typeof t2 ? this.ye(t2) : t2;
    return i2 ? this._surveyManager.checkSurveyEligibility(i2) : { eligible: false, reason: "Survey not found" };
  }
  canRenderSurvey(t2) {
    if (j(this._surveyManager)) return Jn.warn("init was not called"), { visible: false, disabledReason: "SDK is not enabled or survey functionality is not yet loaded" };
    var i2 = this.be(t2);
    return { visible: i2.eligible, disabledReason: i2.reason };
  }
  canRenderSurveyAsync(t2, i2) {
    return j(this._surveyManager) ? (Jn.warn("init was not called"), Promise.resolve({ visible: false, disabledReason: "SDK is not enabled or survey functionality is not yet loaded" })) : new Promise((e2) => {
      this.getSurveys((i3) => {
        var r2, s2 = null !== (r2 = i3.find((i4) => i4.id === t2)) && void 0 !== r2 ? r2 : null;
        if (s2) {
          var n2 = this.be(s2);
          e2({ visible: n2.eligible, disabledReason: n2.reason });
        } else e2({ visible: false, disabledReason: "Survey not found" });
      }, i2);
    });
  }
  renderSurvey(t2, i2, e2) {
    var r2;
    if (j(this._surveyManager)) Jn.warn("init was not called");
    else {
      var s2 = "string" == typeof t2 ? this.ye(t2) : t2;
      if (null != s2 && s2.id) if (Qn.includes(s2.type)) {
        var n2 = null == o ? void 0 : o.querySelector(i2);
        if (n2) return null != (r2 = s2.appearance) && r2.surveyPopupDelaySeconds ? (Jn.info("Rendering survey " + s2.id + " with delay of " + s2.appearance.surveyPopupDelaySeconds + " seconds"), void setTimeout(() => {
          var t3, i3;
          Jn.info("Rendering survey " + s2.id + " with delay of " + (null == (t3 = s2.appearance) ? void 0 : t3.surveyPopupDelaySeconds) + " seconds"), null == (i3 = this._surveyManager) || i3.renderSurvey(s2, n2, e2), Jn.info("Survey " + s2.id + " rendered");
        }, 1e3 * s2.appearance.surveyPopupDelaySeconds)) : void this._surveyManager.renderSurvey(s2, n2, e2);
        Jn.warn("Survey element not found");
      } else Jn.warn("Surveys of type " + s2.type + " cannot be rendered in the app");
      else Jn.warn("Survey not found");
    }
  }
  displaySurvey(t2, i2) {
    var e2;
    if (j(this._surveyManager)) Jn.warn("init was not called");
    else {
      var r2 = this.ye(t2);
      if (r2) {
        var s2 = r2;
        if (null != (e2 = r2.appearance) && e2.surveyPopupDelaySeconds && i2.ignoreDelay && (s2 = g({}, r2, { appearance: g({}, r2.appearance, { surveyPopupDelaySeconds: 0 }) })), i2.displayType !== Vn.Popover && i2.initialResponses && Jn.warn("initialResponses is only supported for popover surveys. prefill will not be applied."), false === i2.ignoreConditions) {
          var n2 = this.canRenderSurvey(r2);
          if (!n2.visible) return void Jn.warn("Survey is not eligible to be displayed: ", n2.disabledReason);
        }
        i2.displayType !== Vn.Inline ? this._surveyManager.handlePopoverSurvey(s2, i2) : this.renderSurvey(s2, i2.selector, i2.properties);
      } else Jn.warn("Survey not found");
    }
  }
  cancelPendingSurvey(t2) {
    j(this._surveyManager) ? Jn.warn("init was not called") : this._surveyManager.cancelSurvey(t2);
  }
  handlePageUnload() {
    var t2;
    null == (t2 = this._surveyManager) || t2.handlePageUnload();
  }
}
var oo = Si("[Conversations]");
class ao {
  constructor(t2) {
    this.we = void 0, this._conversationsManager = null, this.xe = false, this.Ee = null, this._instance = t2;
  }
  onRemoteConfig(t2) {
    if (!this._instance.config.disable_conversations) {
      var i2 = t2.conversations;
      j(i2) || (U(i2) ? this.we = i2 : (this.we = i2.enabled, this.Ee = i2), this.loadIfEnabled());
    }
  }
  reset() {
    var t2;
    null == (t2 = this._conversationsManager) || t2.reset(), this._conversationsManager = null, this.we = void 0, this.Ee = null;
  }
  loadIfEnabled() {
    if (!this._conversationsManager && !this.xe && !(this._instance.config.disable_conversations || this._instance.config.cookieless_mode && this._instance.consent.isOptedOut())) {
      var t2 = null == v ? void 0 : v.__PosthogExtensions__;
      if (t2 && !M(this.we) && this.we) if (this.Ee && this.Ee.token) {
        this.xe = true;
        try {
          var i2 = t2.initConversations;
          if (i2) return this.$e(i2), void (this.xe = false);
          var e2 = t2.loadExternalDependency;
          if (!e2) return void this.Se("PostHog loadExternalDependency extension not found.");
          e2(this._instance, "conversations", (i3) => {
            i3 || !t2.initConversations ? this.Se("Could not load conversations script", i3) : this.$e(t2.initConversations), this.xe = false;
          });
        } catch (t3) {
          this.Se("Error initializing conversations", t3), this.xe = false;
        }
      } else oo.error("Conversations enabled but missing token in remote config.");
    }
  }
  $e(t2) {
    if (this.Ee) try {
      this._conversationsManager = t2(this.Ee, this._instance), oo.info("Conversations loaded successfully");
    } catch (t3) {
      this.Se("Error completing conversations initialization", t3);
    }
    else oo.error("Cannot complete initialization: remote config is null");
  }
  Se(t2, i2) {
    oo.error(t2, i2), this._conversationsManager = null, this.xe = false;
  }
  show() {
    this._conversationsManager ? this._conversationsManager.show() : oo.warn("Conversations not loaded yet.");
  }
  hide() {
    this._conversationsManager && this._conversationsManager.hide();
  }
  isAvailable() {
    return true === this.we && !D(this._conversationsManager);
  }
  isVisible() {
    var t2, i2;
    return null !== (t2 = null == (i2 = this._conversationsManager) ? void 0 : i2.isVisible()) && void 0 !== t2 && t2;
  }
  sendMessage(t2, i2, e2) {
    var r2 = this;
    return p(function* () {
      return r2._conversationsManager ? r2._conversationsManager.sendMessage(t2, i2, e2) : (oo.warn("Conversations not available yet."), null);
    })();
  }
  getMessages(t2, i2) {
    var e2 = this;
    return p(function* () {
      return e2._conversationsManager ? e2._conversationsManager.getMessages(t2, i2) : (oo.warn("Conversations not available yet."), null);
    })();
  }
  markAsRead(t2) {
    var i2 = this;
    return p(function* () {
      return i2._conversationsManager ? i2._conversationsManager.markAsRead(t2) : (oo.warn("Conversations not available yet."), null);
    })();
  }
  getTickets(t2) {
    var i2 = this;
    return p(function* () {
      return i2._conversationsManager ? i2._conversationsManager.getTickets(t2) : (oo.warn("Conversations not available yet."), null);
    })();
  }
  getCurrentTicketId() {
    var t2, i2;
    return null !== (t2 = null == (i2 = this._conversationsManager) ? void 0 : i2.getCurrentTicketId()) && void 0 !== t2 ? t2 : null;
  }
  getWidgetSessionId() {
    var t2, i2;
    return null !== (t2 = null == (i2 = this._conversationsManager) ? void 0 : i2.getWidgetSessionId()) && void 0 !== t2 ? t2 : null;
  }
}
class lo {
  constructor(t2) {
    var i2;
    this.ke = false, this.Pe = false, this._instance = t2, this._instance && null != (i2 = this._instance.config.logs) && i2.captureConsoleLogs && (this.ke = true);
  }
  onRemoteConfig(t2) {
    var i2, e2 = null == (i2 = t2.logs) ? void 0 : i2.captureConsoleLogs;
    !j(e2) && e2 && (this.ke = true, this.loadIfEnabled());
  }
  reset() {
  }
  loadIfEnabled() {
    if (this.ke && !this.Pe) {
      var t2 = Si("[logs]"), i2 = null == v ? void 0 : v.__PosthogExtensions__;
      if (i2) {
        var e2 = i2.loadExternalDependency;
        e2 ? e2(this._instance, "logs", (e3) => {
          var r2;
          e3 || null == (r2 = i2.logs) || !r2.initializeLogs ? t2.error("Could not load logs script", e3) : (i2.logs.initializeLogs(this._instance), this.Pe = true);
        }) : t2.error("PostHog loadExternalDependency extension not found.");
      } else t2.error("PostHog Extensions not found.");
    }
  }
}
var uo = Si("[RateLimiter]");
class ho {
  constructor(t2) {
    this.serverLimits = {}, this.lastEventRateLimited = false, this.checkForLimiting = (t3) => {
      var i2 = t3.text;
      if (i2 && i2.length) try {
        (JSON.parse(i2).quota_limited || []).forEach((t4) => {
          uo.info((t4 || "events") + " is quota limited."), this.serverLimits[t4] = (/* @__PURE__ */ new Date()).getTime() + 6e4;
        });
      } catch (t4) {
        return void uo.warn('could not rate limit - continuing. Error: "' + (null == t4 ? void 0 : t4.message) + '"', { text: i2 });
      }
    }, this.instance = t2, this.lastEventRateLimited = this.clientRateLimitContext(true).isRateLimited;
  }
  get captureEventsPerSecond() {
    var t2;
    return (null == (t2 = this.instance.config.rate_limiting) ? void 0 : t2.events_per_second) || 10;
  }
  get captureEventsBurstLimit() {
    var t2;
    return Math.max((null == (t2 = this.instance.config.rate_limiting) ? void 0 : t2.events_burst_limit) || 10 * this.captureEventsPerSecond, this.captureEventsPerSecond);
  }
  clientRateLimitContext(t2) {
    var i2, e2, r2;
    void 0 === t2 && (t2 = false);
    var { captureEventsBurstLimit: s2, captureEventsPerSecond: n2 } = this, o2 = (/* @__PURE__ */ new Date()).getTime(), a2 = null !== (i2 = null == (e2 = this.instance.persistence) ? void 0 : e2.get_property(ve)) && void 0 !== i2 ? i2 : { tokens: s2, last: o2 };
    a2.tokens += (o2 - a2.last) / 1e3 * n2, a2.last = o2, a2.tokens > s2 && (a2.tokens = s2);
    var l2 = a2.tokens < 1;
    return l2 || t2 || (a2.tokens = Math.max(0, a2.tokens - 1)), !l2 || this.lastEventRateLimited || t2 || this.instance.capture("$$client_ingestion_warning", { $$client_ingestion_warning_message: "posthog-js client rate limited. Config is set to " + n2 + " events per second and " + s2 + " events burst limit." }, { skip_client_rate_limiting: true }), this.lastEventRateLimited = l2, null == (r2 = this.instance.persistence) || r2.set_property(ve, a2), { isRateLimited: l2, remainingTokens: a2.tokens };
  }
  isServerRateLimited(t2) {
    var i2 = this.serverLimits[t2 || "events"] || false;
    return false !== i2 && (/* @__PURE__ */ new Date()).getTime() < i2;
  }
}
var vo = Si("[RemoteConfig]");
class co {
  constructor(t2) {
    this._instance = t2;
  }
  get remoteConfig() {
    var t2;
    return null == (t2 = v._POSTHOG_REMOTE_CONFIG) || null == (t2 = t2[this._instance.config.token]) ? void 0 : t2.config;
  }
  Te(t2) {
    var i2, e2;
    null != (i2 = v.__PosthogExtensions__) && i2.loadExternalDependency ? null == (e2 = v.__PosthogExtensions__) || null == e2.loadExternalDependency || e2.loadExternalDependency(this._instance, "remote-config", () => t2(this.remoteConfig)) : (vo.error("PostHog Extensions not found. Cannot load remote config."), t2());
  }
  Ie(t2) {
    this._instance._send_request({ method: "GET", url: this._instance.requestRouter.endpointFor("assets", "/array/" + this._instance.config.token + "/config"), callback: (i2) => {
      t2(i2.json);
    } });
  }
  load() {
    try {
      if (this.remoteConfig) return vo.info("Using preloaded remote config", this.remoteConfig), void this.bi(this.remoteConfig);
      if (this._instance.O()) return void vo.warn("Remote config is disabled. Falling back to local config.");
      this.Te((t2) => {
        if (!t2) return vo.info("No config found after loading remote JS config. Falling back to JSON."), void this.Ie((t3) => {
          this.bi(t3);
        });
        this.bi(t2);
      });
    } catch (t2) {
      vo.error("Error loading remote config", t2);
    }
  }
  bi(t2) {
    t2 ? this._instance.config.__preview_remote_config ? (this._instance.bi(t2), false !== t2.hasFeatureFlags && this._instance.featureFlags.ensureFlagsLoaded()) : vo.info("__preview_remote_config is disabled. Logging config instead", t2) : vo.error("Failed to fetch remote config from PostHog.");
  }
}
var fo = 3e3;
class po {
  constructor(t2, i2) {
    this.Ce = true, this.Re = [], this.Fe = K((null == i2 ? void 0 : i2.flush_interval_ms) || fo, 250, 5e3, $i.createLogger("flush interval"), fo), this.Me = t2;
  }
  enqueue(t2) {
    this.Re.push(t2), this.Oe || this.Ae();
  }
  unload() {
    this.De();
    var t2 = this.Re.length > 0 ? this.je() : {}, i2 = Object.values(t2);
    [...i2.filter((t3) => 0 === t3.url.indexOf("/e")), ...i2.filter((t3) => 0 !== t3.url.indexOf("/e"))].map((t3) => {
      this.Me(g({}, t3, { transport: "sendBeacon" }));
    });
  }
  enable() {
    this.Ce = false, this.Ae();
  }
  Ae() {
    var t2 = this;
    this.Ce || (this.Oe = setTimeout(() => {
      if (this.De(), this.Re.length > 0) {
        var i2 = this.je(), e2 = function() {
          var e3 = i2[r2], s2 = (/* @__PURE__ */ new Date()).getTime();
          e3.data && I(e3.data) && Ci(e3.data, (t3) => {
            t3.offset = Math.abs(t3.timestamp - s2), delete t3.timestamp;
          }), t2.Me(e3);
        };
        for (var r2 in i2) e2();
      }
    }, this.Fe));
  }
  De() {
    clearTimeout(this.Oe), this.Oe = void 0;
  }
  je() {
    var t2 = {};
    return Ci(this.Re, (i2) => {
      var e2, r2 = i2, s2 = (r2 ? r2.batchKey : null) || r2.url;
      M(t2[s2]) && (t2[s2] = g({}, r2, { data: [] })), null == (e2 = t2[s2].data) || e2.push(r2.data);
    }), this.Re = [], t2;
  }
}
var go = ["retriesPerformedSoFar"];
class _o {
  constructor(i2) {
    this.Le = false, this.Ne = 3e3, this.Re = [], this._instance = i2, this.Re = [], this.Ue = true, !M(t) && "onLine" in t.navigator && (this.Ue = t.navigator.onLine, this.ze = () => {
      this.Ue = true, this.Lt();
    }, this.He = () => {
      this.Ue = false;
    }, zi(t, "online", this.ze), zi(t, "offline", this.He));
  }
  get length() {
    return this.Re.length;
  }
  retriableRequest(t2) {
    var { retriesPerformedSoFar: i2 } = t2, e2 = _(t2, go);
    N(i2) && (e2.url = un(e2.url, { retry_count: i2 })), this._instance._send_request(g({}, e2, { callback: (t3) => {
      200 !== t3.statusCode && (t3.statusCode < 400 || t3.statusCode >= 500) && (null != i2 ? i2 : 0) < 10 ? this.Be(g({ retriesPerformedSoFar: i2 }, e2)) : null == e2.callback || e2.callback(t3);
    } }));
  }
  Be(t2) {
    var i2 = t2.retriesPerformedSoFar || 0;
    t2.retriesPerformedSoFar = i2 + 1;
    var e2 = function(t3) {
      var i3 = 3e3 * Math.pow(2, t3), e3 = i3 / 2, r3 = Math.min(18e5, i3), s3 = (Math.random() - 0.5) * (r3 - e3);
      return Math.ceil(r3 + s3);
    }(i2), r2 = Date.now() + e2;
    this.Re.push({ retryAt: r2, requestOptions: t2 });
    var s2 = "Enqueued failed request for retry in " + e2;
    navigator.onLine || (s2 += " (Browser is offline)"), $i.warn(s2), this.Le || (this.Le = true, this.qe());
  }
  qe() {
    if (this.We && clearTimeout(this.We), 0 === this.Re.length) return this.Le = false, void (this.We = void 0);
    this.We = setTimeout(() => {
      this.Ue && this.Re.length > 0 && this.Lt(), this.qe();
    }, this.Ne);
  }
  Lt() {
    var t2 = Date.now(), i2 = [], e2 = this.Re.filter((e3) => e3.retryAt < t2 || (i2.push(e3), false));
    if (this.Re = i2, e2.length > 0) for (var { requestOptions: r2 } of e2) this.retriableRequest(r2);
  }
  unload() {
    for (var { requestOptions: i2 } of (this.We && (clearTimeout(this.We), this.We = void 0), this.Le = false, M(t) || (this.ze && (t.removeEventListener("online", this.ze), this.ze = void 0), this.He && (t.removeEventListener("offline", this.He), this.He = void 0)), this.Re)) try {
      this._instance._send_request(g({}, i2, { transport: "sendBeacon" }));
    } catch (t2) {
      $i.error(t2);
    }
    this.Re = [];
  }
}
class mo {
  constructor(t2) {
    this.Ge = () => {
      var t3, i2, e2, r2;
      this.Ve || (this.Ve = {});
      var s2 = this.scrollElement(), n2 = this.scrollY(), o2 = s2 ? Math.max(0, s2.scrollHeight - s2.clientHeight) : 0, a2 = n2 + ((null == s2 ? void 0 : s2.clientHeight) || 0), l2 = (null == s2 ? void 0 : s2.scrollHeight) || 0;
      this.Ve.lastScrollY = Math.ceil(n2), this.Ve.maxScrollY = Math.max(n2, null !== (t3 = this.Ve.maxScrollY) && void 0 !== t3 ? t3 : 0), this.Ve.maxScrollHeight = Math.max(o2, null !== (i2 = this.Ve.maxScrollHeight) && void 0 !== i2 ? i2 : 0), this.Ve.lastContentY = a2, this.Ve.maxContentY = Math.max(a2, null !== (e2 = this.Ve.maxContentY) && void 0 !== e2 ? e2 : 0), this.Ve.maxContentHeight = Math.max(l2, null !== (r2 = this.Ve.maxContentHeight) && void 0 !== r2 ? r2 : 0);
    }, this._instance = t2;
  }
  getContext() {
    return this.Ve;
  }
  resetContext() {
    var t2 = this.Ve;
    return setTimeout(this.Ge, 0), t2;
  }
  startMeasuringScrollPosition() {
    zi(t, "scroll", this.Ge, { capture: true }), zi(t, "scrollend", this.Ge, { capture: true }), zi(t, "resize", this.Ge);
  }
  scrollElement() {
    if (!this._instance.config.scroll_root_selector) return null == t ? void 0 : t.document.documentElement;
    var i2 = I(this._instance.config.scroll_root_selector) ? this._instance.config.scroll_root_selector : [this._instance.config.scroll_root_selector];
    for (var e2 of i2) {
      var r2 = null == t ? void 0 : t.document.querySelector(e2);
      if (r2) return r2;
    }
  }
  scrollY() {
    if (this._instance.config.scroll_root_selector) {
      var i2 = this.scrollElement();
      return i2 && i2.scrollTop || 0;
    }
    return t && (t.scrollY || t.pageYOffset || t.document.documentElement.scrollTop) || 0;
  }
  scrollX() {
    if (this._instance.config.scroll_root_selector) {
      var i2 = this.scrollElement();
      return i2 && i2.scrollLeft || 0;
    }
    return t && (t.scrollX || t.pageXOffset || t.document.documentElement.scrollLeft) || 0;
  }
}
var yo = (t2) => ds(null == t2 ? void 0 : t2.config.mask_personal_data_properties, null == t2 ? void 0 : t2.config.custom_personal_data_properties);
class bo {
  constructor(t2, i2, e2, r2) {
    this.Je = (t3) => {
      var i3 = this.Ke();
      if (!i3 || i3.sessionId !== t3) {
        var e3 = { sessionId: t3, props: this.Ye(this._instance) };
        this.Xe.register({ [de]: e3 });
      }
    }, this._instance = t2, this.Qe = i2, this.Xe = e2, this.Ye = r2 || yo, this.Qe.onSessionId(this.Je);
  }
  Ke() {
    return this.Xe.props[de];
  }
  getSetOnceProps() {
    var t2, i2 = null == (t2 = this.Ke()) ? void 0 : t2.props;
    return i2 ? "r" in i2 ? vs(i2) : { $referring_domain: i2.referringDomain, $pathname: i2.initialPathName, utm_source: i2.utm_source, utm_campaign: i2.utm_campaign, utm_medium: i2.utm_medium, utm_content: i2.utm_content, utm_term: i2.utm_term } : {};
  }
  getSessionProps() {
    var t2 = {};
    return Ci(Di(this.getSetOnceProps()), (i2, e2) => {
      "$current_url" === e2 && (e2 = "url"), t2["$session_entry_" + E(e2)] = i2;
    }), t2;
  }
}
var wo = Si("[SessionId]");
class xo {
  on(t2, i2) {
    return this.Ze.on(t2, i2);
  }
  constructor(t2, i2, e2) {
    var r2;
    if (this.tr = [], this.ir = void 0, this.Ze = new to(), this.er = (t3, i3) => !(!N(t3) || !N(i3)) && Math.abs(t3 - i3) > this.sessionTimeoutMs, !t2.persistence) throw new Error("SessionIdManager requires a PostHogPersistence instance");
    if ("always" === t2.config.cookieless_mode) throw new Error('SessionIdManager cannot be used with cookieless_mode="always"');
    this.R = t2.config, this.Xe = t2.persistence, this.rr = void 0, this.sr = void 0, this._sessionStartTimestamp = null, this._sessionActivityTimestamp = null, this.nr = i2 || br, this.ar = e2 || br;
    var s2 = this.R.persistence_name || this.R.token, n2 = this.R.session_idle_timeout_seconds || 1800;
    if (this._sessionTimeoutMs = 1e3 * K(n2, 60, 36e3, wo.createLogger("session_idle_timeout_seconds"), 1800), t2.register({ $configured_session_timeout_ms: this._sessionTimeoutMs }), this.lr(), this.ur = "ph_" + s2 + "_window_id", this.hr = "ph_" + s2 + "_primary_window_exists", this.dr()) {
      var o2 = Fr.W(this.ur), a2 = Fr.W(this.hr);
      o2 && !a2 ? this.rr = o2 : Fr.V(this.ur), Fr.G(this.hr, true);
    }
    if (null != (r2 = this.R.bootstrap) && r2.sessionID) try {
      var l2 = ((t3) => {
        var i3 = t3.replace(/-/g, "");
        if (32 !== i3.length) throw new Error("Not a valid UUID");
        if ("7" !== i3[12]) throw new Error("Not a UUIDv7");
        return parseInt(i3.substring(0, 12), 16);
      })(this.R.bootstrap.sessionID);
      this.vr(this.R.bootstrap.sessionID, (/* @__PURE__ */ new Date()).getTime(), l2);
    } catch (t3) {
      wo.error("Invalid sessionID in bootstrap", t3);
    }
    this.cr();
  }
  get sessionTimeoutMs() {
    return this._sessionTimeoutMs;
  }
  onSessionId(t2) {
    return M(this.tr) && (this.tr = []), this.tr.push(t2), this.sr && t2(this.sr, this.rr), () => {
      this.tr = this.tr.filter((i2) => i2 !== t2);
    };
  }
  dr() {
    return "memory" !== this.R.persistence && !this.Xe.ki && Fr.H();
  }
  pr(t2) {
    t2 !== this.rr && (this.rr = t2, this.dr() && Fr.G(this.ur, t2));
  }
  gr() {
    return this.rr ? this.rr : this.dr() ? Fr.W(this.ur) : null;
  }
  vr(t2, i2, e2) {
    t2 === this.sr && i2 === this._sessionActivityTimestamp && e2 === this._sessionStartTimestamp || (this._sessionStartTimestamp = e2, this._sessionActivityTimestamp = i2, this.sr = t2, this.Xe.register({ [ie]: [i2, t2, e2] }));
  }
  _r() {
    var t2 = this.Xe.props[ie];
    return I(t2) && 2 === t2.length && t2.push(t2[0]), t2 || [0, null, 0];
  }
  resetSessionId() {
    this.vr(null, null, null);
  }
  destroy() {
    clearTimeout(this.mr), this.mr = void 0, this.ir && t && (t.removeEventListener("beforeunload", this.ir, { capture: false }), this.ir = void 0), this.tr = [];
  }
  cr() {
    this.ir = () => {
      this.dr() && Fr.V(this.hr);
    }, zi(t, "beforeunload", this.ir, { capture: false });
  }
  checkAndGetSessionAndWindowId(t2, i2) {
    if (void 0 === t2 && (t2 = false), void 0 === i2 && (i2 = null), "always" === this.R.cookieless_mode) throw new Error('checkAndGetSessionAndWindowId should not be called with cookieless_mode="always"');
    var e2 = i2 || (/* @__PURE__ */ new Date()).getTime(), [r2, s2, n2] = this._r(), o2 = this.gr(), a2 = N(n2) && Math.abs(e2 - n2) > 864e5, l2 = false, u2 = !s2, h2 = !u2 && !t2 && this.er(e2, r2);
    u2 || h2 || a2 ? (s2 = this.nr(), o2 = this.ar(), wo.info("new session ID generated", { sessionId: s2, windowId: o2, changeReason: { noSessionId: u2, activityTimeout: h2, sessionPastMaximumLength: a2 } }), n2 = e2, l2 = true) : o2 || (o2 = this.ar(), l2 = true);
    var d2 = !!N(r2) && t2 && !a2 ? r2 : e2, v2 = !N(n2) ? (/* @__PURE__ */ new Date()).getTime() : n2;
    return this.pr(o2), this.vr(s2, d2, v2), t2 || this.lr(), l2 && this.tr.forEach((t3) => t3(s2, o2, l2 ? { noSessionId: u2, activityTimeout: h2, sessionPastMaximumLength: a2 } : void 0)), { sessionId: s2, windowId: o2, sessionStartTimestamp: v2, changeReason: l2 ? { noSessionId: u2, activityTimeout: h2, sessionPastMaximumLength: a2 } : void 0, lastActivityTimestamp: r2 };
  }
  lr() {
    clearTimeout(this.mr), this.mr = setTimeout(() => {
      var [t2] = this._r();
      if (this.er((/* @__PURE__ */ new Date()).getTime(), t2)) {
        var i2 = this.sr;
        this.resetSessionId(), this.Ze.emit("forcedIdleReset", { idleSessionId: i2 });
      }
    }, 1.1 * this.sessionTimeoutMs);
  }
}
var Eo = ["$set_once", "$set"], $o = Si("[SiteApps]");
class So {
  constructor(t2) {
    this._instance = t2, this.yr = [], this.apps = {};
  }
  get isEnabled() {
    return !!this._instance.config.opt_in_site_apps;
  }
  br(t2, i2) {
    if (i2) {
      var e2 = this.globalsForEvent(i2);
      this.yr.push(e2), this.yr.length > 1e3 && (this.yr = this.yr.slice(10));
    }
  }
  get siteAppLoaders() {
    var t2;
    return null == (t2 = v._POSTHOG_REMOTE_CONFIG) || null == (t2 = t2[this._instance.config.token]) ? void 0 : t2.siteApps;
  }
  init() {
    if (this.isEnabled) {
      var t2 = this._instance._addCaptureHook(this.br.bind(this));
      this.wr = () => {
        t2(), this.yr = [], this.wr = void 0;
      };
    }
  }
  globalsForEvent(t2) {
    var i2, e2, r2, s2, n2, o2, a2;
    if (!t2) throw new Error("Event payload is required");
    var l2 = {}, u2 = this._instance.get_property("$groups") || [], h2 = this._instance.get_property("$stored_group_properties") || {};
    for (var [d2, v2] of Object.entries(h2)) l2[d2] = { id: u2[d2], type: d2, properties: v2 };
    var { $set_once: c2, $set: f2 } = t2;
    return { event: g({}, _(t2, Eo), { properties: g({}, t2.properties, f2 ? { $set: g({}, null !== (i2 = null == (e2 = t2.properties) ? void 0 : e2.$set) && void 0 !== i2 ? i2 : {}, f2) } : {}, c2 ? { $set_once: g({}, null !== (r2 = null == (s2 = t2.properties) ? void 0 : s2.$set_once) && void 0 !== r2 ? r2 : {}, c2) } : {}), elements_chain: null !== (n2 = null == (o2 = t2.properties) ? void 0 : o2.$elements_chain) && void 0 !== n2 ? n2 : "", distinct_id: null == (a2 = t2.properties) ? void 0 : a2.distinct_id }), person: { properties: this._instance.get_property("$stored_person_properties") }, groups: l2 };
  }
  setupSiteApp(t2) {
    var i2 = this.apps[t2.id], e2 = () => {
      var e3;
      (!i2.errored && this.yr.length && ($o.info("Processing " + this.yr.length + " events for site app with id " + t2.id), this.yr.forEach((t3) => null == i2.processEvent ? void 0 : i2.processEvent(t3)), i2.processedBuffer = true), Object.values(this.apps).every((t3) => t3.processedBuffer || t3.errored)) && (null == (e3 = this.wr) || e3.call(this));
    }, r2 = false, s2 = (s3) => {
      i2.errored = !s3, i2.loaded = true, $o.info("Site app with id " + t2.id + " " + (s3 ? "loaded" : "errored")), r2 && e2();
    };
    try {
      var { processEvent: n2 } = t2.init({ posthog: this._instance, callback: (t3) => {
        s2(t3);
      } });
      n2 && (i2.processEvent = n2), r2 = true;
    } catch (i3) {
      $o.error("Error while initializing PostHog app with config id " + t2.id, i3), s2(false);
    }
    if (r2 && i2.loaded) try {
      e2();
    } catch (e3) {
      $o.error("Error while processing buffered events PostHog app with config id " + t2.id, e3), i2.errored = true;
    }
  }
  Er() {
    var t2 = this.siteAppLoaders || [];
    for (var i2 of t2) this.apps[i2.id] = { id: i2.id, loaded: false, errored: false, processedBuffer: false };
    for (var e2 of t2) this.setupSiteApp(e2);
  }
  $r(t2) {
    if (0 !== Object.keys(this.apps).length) {
      var i2 = this.globalsForEvent(t2);
      for (var e2 of Object.values(this.apps)) try {
        null == e2.processEvent || e2.processEvent(i2);
      } catch (i3) {
        $o.error("Error while processing event " + t2.event + " for site app " + e2.id, i3);
      }
    }
  }
  onRemoteConfig(t2) {
    var i2, e2, r2, s2 = this;
    if (null != (i2 = this.siteAppLoaders) && i2.length) return this.isEnabled ? (this.Er(), void this._instance.on("eventCaptured", (t3) => this.$r(t3))) : void $o.error('PostHog site apps are disabled. Enable the "opt_in_site_apps" config to proceed.');
    if (null == (e2 = this.wr) || e2.call(this), null != (r2 = t2.siteApps) && r2.length) if (this.isEnabled) {
      var n2 = function(t3) {
        var i3;
        v["__$$ph_site_app_" + t3] = s2._instance, null == (i3 = v.__PosthogExtensions__) || null == i3.loadSiteApp || i3.loadSiteApp(s2._instance, a2, (i4) => {
          if (i4) return $o.error("Error while initializing PostHog app with config id " + t3, i4);
        });
      };
      for (var { id: o2, url: a2 } of t2.siteApps) n2(o2);
    } else $o.error('PostHog site apps are disabled. Enable the "opt_in_site_apps" config to proceed.');
  }
}
var ko = function(t2, i2) {
  if (!t2) return false;
  var e2 = t2.userAgent;
  if (e2 && y(e2, i2)) return true;
  try {
    var r2 = null == t2 ? void 0 : t2.userAgentData;
    if (null != r2 && r2.brands && r2.brands.some((t3) => y(null == t3 ? void 0 : t3.brand, i2))) return true;
  } catch (t3) {
  }
  return !!t2.webdriver;
}, Po = function(t2) {
  return t2.US = "us", t2.EU = "eu", t2.CUSTOM = "custom", t2;
}({}), To = "i.posthog.com";
class Io {
  constructor(t2) {
    this.Sr = {}, this.instance = t2;
  }
  get apiHost() {
    var t2 = this.instance.config.api_host.trim().replace(/\/$/, "");
    return "https://app.posthog.com" === t2 ? "https://us.i.posthog.com" : t2;
  }
  get flagsApiHost() {
    var t2 = this.instance.config.flags_api_host;
    return t2 ? t2.trim().replace(/\/$/, "") : this.apiHost;
  }
  get uiHost() {
    var t2, i2 = null == (t2 = this.instance.config.ui_host) ? void 0 : t2.replace(/\/$/, "");
    return i2 || (i2 = this.apiHost.replace("." + To, ".posthog.com")), "https://app.posthog.com" === i2 ? "https://us.posthog.com" : i2;
  }
  get region() {
    return this.Sr[this.apiHost] || (/https:\/\/(app|us|us-assets)(\.i)?\.posthog\.com/i.test(this.apiHost) ? this.Sr[this.apiHost] = Po.US : /https:\/\/(eu|eu-assets)(\.i)?\.posthog\.com/i.test(this.apiHost) ? this.Sr[this.apiHost] = Po.EU : this.Sr[this.apiHost] = Po.CUSTOM), this.Sr[this.apiHost];
  }
  endpointFor(t2, i2) {
    if (void 0 === i2 && (i2 = ""), i2 && (i2 = "/" === i2[0] ? i2 : "/" + i2), "ui" === t2) return this.uiHost + i2;
    if ("flags" === t2) return this.flagsApiHost + i2;
    if (this.region === Po.CUSTOM) return this.apiHost + i2;
    var e2 = To + i2;
    switch (t2) {
      case "assets":
        return "https://" + this.region + "-assets." + e2;
      case "api":
        return "https://" + this.region + "." + e2;
    }
  }
}
var Co = { icontains: (i2, e2) => !!t && e2.href.toLowerCase().indexOf(i2.toLowerCase()) > -1, not_icontains: (i2, e2) => !!t && -1 === e2.href.toLowerCase().indexOf(i2.toLowerCase()), regex: (i2, e2) => !!t && cn(e2.href, i2), not_regex: (i2, e2) => !!t && !cn(e2.href, i2), exact: (t2, i2) => i2.href === t2, is_not: (t2, i2) => i2.href !== t2 };
class Ro {
  constructor(t2) {
    var i2 = this;
    this.getWebExperimentsAndEvaluateDisplayLogic = function(t3) {
      void 0 === t3 && (t3 = false), i2.getWebExperiments((t4) => {
        Ro.kr("retrieved web experiments from the server"), i2.Pr = /* @__PURE__ */ new Map(), t4.forEach((t5) => {
          if (t5.feature_flag_key) {
            var e2;
            if (i2.Pr) Ro.kr("setting flag key ", t5.feature_flag_key, " to web experiment ", t5), null == (e2 = i2.Pr) || e2.set(t5.feature_flag_key, t5);
            var r2 = i2._instance.getFeatureFlag(t5.feature_flag_key);
            O(r2) && t5.variants[r2] && i2.Tr(t5.name, r2, t5.variants[r2].transforms);
          } else if (t5.variants) for (var s2 in t5.variants) {
            var n2 = t5.variants[s2];
            Ro.Ir(n2) && i2.Tr(t5.name, s2, n2.transforms);
          }
        });
      }, t3);
    }, this._instance = t2, this._instance.onFeatureFlags((t3) => {
      this.onFeatureFlags(t3);
    });
  }
  onFeatureFlags(t2) {
    if (this._is_bot()) Ro.kr("Refusing to render web experiment since the viewer is a likely bot");
    else if (!this._instance.config.disable_web_experiments) {
      if (j(this.Pr)) return this.Pr = /* @__PURE__ */ new Map(), this.loadIfEnabled(), void this.previewWebExperiment();
      Ro.kr("applying feature flags", t2), t2.forEach((t3) => {
        var i2;
        if (this.Pr && null != (i2 = this.Pr) && i2.has(t3)) {
          var e2, r2 = this._instance.getFeatureFlag(t3), s2 = null == (e2 = this.Pr) ? void 0 : e2.get(t3);
          r2 && null != s2 && s2.variants[r2] && this.Tr(s2.name, r2, s2.variants[r2].transforms);
        }
      });
    }
  }
  previewWebExperiment() {
    var t2 = Ro.getWindowLocation();
    if (null != t2 && t2.search) {
      var i2 = sr(null == t2 ? void 0 : t2.search, "__experiment_id"), e2 = sr(null == t2 ? void 0 : t2.search, "__experiment_variant");
      i2 && e2 && (Ro.kr("previewing web experiments " + i2 + " && " + e2), this.getWebExperiments((t3) => {
        this.Cr(parseInt(i2), e2, t3);
      }, false, true));
    }
  }
  loadIfEnabled() {
    this._instance.config.disable_web_experiments || this.getWebExperimentsAndEvaluateDisplayLogic();
  }
  getWebExperiments(t2, i2, e2) {
    if (this._instance.config.disable_web_experiments && !e2) return t2([]);
    var r2 = this._instance.get_property("$web_experiments");
    if (r2 && !i2) return t2(r2);
    this._instance._send_request({ url: this._instance.requestRouter.endpointFor("api", "/api/web_experiments/?token=" + this._instance.config.token), method: "GET", callback: (i3) => {
      if (200 !== i3.statusCode || !i3.json) return t2([]);
      var e3 = i3.json.experiments || [];
      return t2(e3);
    } });
  }
  Cr(t2, i2, e2) {
    var r2 = e2.filter((i3) => i3.id === t2);
    r2 && r2.length > 0 && (Ro.kr("Previewing web experiment [" + r2[0].name + "] with variant [" + i2 + "]"), this.Tr(r2[0].name, i2, r2[0].variants[i2].transforms));
  }
  static Ir(t2) {
    return !j(t2.conditions) && (Ro.Rr(t2) && Ro.Fr(t2));
  }
  static Rr(t2) {
    var i2;
    if (j(t2.conditions) || j(null == (i2 = t2.conditions) ? void 0 : i2.url)) return true;
    var e2, r2, s2, n2 = Ro.getWindowLocation();
    return !!n2 && (null == (e2 = t2.conditions) || !e2.url || Co[null !== (r2 = null == (s2 = t2.conditions) ? void 0 : s2.urlMatchType) && void 0 !== r2 ? r2 : "icontains"](t2.conditions.url, n2));
  }
  static getWindowLocation() {
    return null == t ? void 0 : t.location;
  }
  static Fr(t2) {
    var i2;
    if (j(t2.conditions) || j(null == (i2 = t2.conditions) ? void 0 : i2.utm)) return true;
    var e2 = os();
    if (e2.utm_source) {
      var r2, s2, n2, o2, a2, l2, u2, h2, d2 = null == (r2 = t2.conditions) || null == (r2 = r2.utm) || !r2.utm_campaign || (null == (s2 = t2.conditions) || null == (s2 = s2.utm) ? void 0 : s2.utm_campaign) == e2.utm_campaign, v2 = null == (n2 = t2.conditions) || null == (n2 = n2.utm) || !n2.utm_source || (null == (o2 = t2.conditions) || null == (o2 = o2.utm) ? void 0 : o2.utm_source) == e2.utm_source, c2 = null == (a2 = t2.conditions) || null == (a2 = a2.utm) || !a2.utm_medium || (null == (l2 = t2.conditions) || null == (l2 = l2.utm) ? void 0 : l2.utm_medium) == e2.utm_medium, f2 = null == (u2 = t2.conditions) || null == (u2 = u2.utm) || !u2.utm_term || (null == (h2 = t2.conditions) || null == (h2 = h2.utm) ? void 0 : h2.utm_term) == e2.utm_term;
      return d2 && c2 && f2 && v2;
    }
    return false;
  }
  static kr(t2) {
    for (var i2 = arguments.length, e2 = new Array(i2 > 1 ? i2 - 1 : 0), r2 = 1; r2 < i2; r2++) e2[r2 - 1] = arguments[r2];
    $i.info("[WebExperiments] " + t2, e2);
  }
  Tr(t2, i2, e2) {
    this._is_bot() ? Ro.kr("Refusing to render web experiment since the viewer is a likely bot") : "control" !== i2 ? e2.forEach((e3) => {
      if (e3.selector) {
        var r2;
        Ro.kr("applying transform of variant " + i2 + " for experiment " + t2 + " ", e3);
        var s2 = null == (r2 = document) ? void 0 : r2.querySelectorAll(e3.selector);
        null == s2 || s2.forEach((t3) => {
          var i3 = t3;
          e3.html && (i3.innerHTML = e3.html), e3.css && i3.setAttribute("style", e3.css);
        });
      }
    }) : Ro.kr("Control variants leave the page unmodified.");
  }
  _is_bot() {
    return n && this._instance ? ko(n, this._instance.config.custom_blocked_useragents) : void 0;
  }
}
var Fo = Si("[PostHog ExternalIntegrations]"), Mo = { intercom: "intercom-integration", crispChat: "crisp-chat-integration" };
class Oo {
  constructor(t2) {
    this._instance = t2;
  }
  it(t2, i2) {
    var e2;
    null == (e2 = v.__PosthogExtensions__) || null == e2.loadExternalDependency || e2.loadExternalDependency(this._instance, t2, (t3) => {
      if (t3) return Fo.error("failed to load script", t3);
      i2();
    });
  }
  startIfEnabledOrStop() {
    var t2 = this, i2 = function(i3) {
      var e3, s3, n2;
      (!r2 || null != (e3 = v.__PosthogExtensions__) && null != (e3 = e3.integrations) && e3[i3] || t2.it(Mo[i3], () => {
        var e4;
        null == (e4 = v.__PosthogExtensions__) || null == (e4 = e4.integrations) || null == (e4 = e4[i3]) || e4.start(t2._instance);
      }), !r2 && null != (s3 = v.__PosthogExtensions__) && null != (s3 = s3.integrations) && s3[i3]) && (null == (n2 = v.__PosthogExtensions__) || null == (n2 = n2.integrations) || null == (n2 = n2[i3]) || n2.stop());
    };
    for (var [e2, r2] of Object.entries(null !== (s2 = this._instance.config.integrations) && void 0 !== s2 ? s2 : {})) {
      var s2;
      i2(e2);
    }
  }
}
var Ao = "[SessionRecording]", Do = Si(Ao);
class jo {
  get started() {
    var t2;
    return !(null == (t2 = this.Mr) || !t2.isStarted);
  }
  get status() {
    return this.Mr ? this.Mr.status : this.Or && !this.Ar ? "disabled" : "lazy_loading";
  }
  constructor(t2) {
    if (this._forceAllowLocalhostNetworkCapture = false, this.Or = false, this.Dr = void 0, this._instance = t2, !this._instance.sessionManager) throw Do.error("started without valid sessionManager"), new Error(Ao + " started without valid sessionManager. This is a bug.");
    if ("always" === this._instance.config.cookieless_mode) throw new Error(Ao + ' cannot be used with cookieless_mode="always"');
  }
  get Ar() {
    var i2, e2 = !(null == (i2 = this._instance.get_property(te)) || !i2.enabled), r2 = !this._instance.config.disable_session_recording, s2 = this._instance.config.disable_session_recording || this._instance.consent.isOptedOut();
    return t && e2 && r2 && !s2;
  }
  startIfEnabledOrStop(t2) {
    var i2;
    if (!this.Ar || null == (i2 = this.Mr) || !i2.isStarted) {
      var e2 = !M(Object.assign) && !M(Array.from);
      this.Ar && e2 ? (this.jr(t2), Do.info("starting")) : this.stopRecording();
    }
  }
  jr(t2) {
    var i2, e2, r2;
    this.Ar && (null != v && null != (i2 = v.__PosthogExtensions__) && null != (i2 = i2.rrweb) && i2.record && null != (e2 = v.__PosthogExtensions__) && e2.initSessionRecording ? this.Lr(t2) : null == (r2 = v.__PosthogExtensions__) || null == r2.loadExternalDependency || r2.loadExternalDependency(this._instance, this.Nr, (i3) => {
      if (i3) return Do.error("could not load recorder", i3);
      this.Lr(t2);
    }));
  }
  stopRecording() {
    var t2, i2;
    null == (t2 = this.Dr) || t2.call(this), this.Dr = void 0, null == (i2 = this.Mr) || i2.stop();
  }
  Ur() {
    var t2;
    null == (t2 = this._instance.persistence) || t2.unregister(ee);
  }
  zr(t2) {
    if (this._instance.persistence) {
      var i2, e2, r2 = this._instance.persistence, s2 = () => {
        var i3 = false === t2.sessionRecording ? void 0 : t2.sessionRecording, e3 = null == i3 ? void 0 : i3.sampleRate, s3 = j(e3) ? null : parseFloat(e3);
        j(s3) && this.Ur();
        var n2 = null == i3 ? void 0 : i3.minimumDurationMilliseconds;
        r2.register({ [te]: g({ enabled: !!i3 }, i3, { networkPayloadCapture: g({ capturePerformance: t2.capturePerformance }, null == i3 ? void 0 : i3.networkPayloadCapture), canvasRecording: { enabled: null == i3 ? void 0 : i3.recordCanvas, fps: null == i3 ? void 0 : i3.canvasFps, quality: null == i3 ? void 0 : i3.canvasQuality }, sampleRate: s3, minimumDurationMilliseconds: M(n2) ? null : n2, endpoint: null == i3 ? void 0 : i3.endpoint, triggerMatchType: null == i3 ? void 0 : i3.triggerMatchType, masking: null == i3 ? void 0 : i3.masking, urlTriggers: null == i3 ? void 0 : i3.urlTriggers }) });
      };
      s2(), null == (i2 = this.Dr) || i2.call(this), this.Dr = null == (e2 = this._instance.sessionManager) ? void 0 : e2.onSessionId(s2);
    }
  }
  onRemoteConfig(t2) {
    "sessionRecording" in t2 ? false !== t2.sessionRecording ? (this.zr(t2), this.Or = true, this.startIfEnabledOrStop()) : this.Or = true : Do.info("skipping remote config with no sessionRecording", t2);
  }
  log(t2, i2) {
    var e2;
    void 0 === i2 && (i2 = "log"), null != (e2 = this.Mr) && e2.log ? this.Mr.log(t2, i2) : Do.warn("log called before recorder was ready");
  }
  get Nr() {
    var t2, i2, e2 = null == (t2 = this._instance) || null == (t2 = t2.persistence) ? void 0 : t2.get_property(te);
    return (null == e2 || null == (i2 = e2.scriptConfig) ? void 0 : i2.script) || "lazy-recorder";
  }
  Lr(t2) {
    var i2, e2;
    if (null == (i2 = v.__PosthogExtensions__) || !i2.initSessionRecording) throw Error("Called on script loaded before session recording is available");
    this.Mr || (this.Mr = null == (e2 = v.__PosthogExtensions__) ? void 0 : e2.initSessionRecording(this._instance), this.Mr._forceAllowLocalhostNetworkCapture = this._forceAllowLocalhostNetworkCapture);
    this.Mr.start(t2);
  }
  onRRwebEmit(t2) {
    var i2;
    null == (i2 = this.Mr) || null == i2.onRRwebEmit || i2.onRRwebEmit(t2);
  }
  overrideLinkedFlag() {
    var t2, i2;
    this.Mr || (null == (i2 = this._instance.persistence) || i2.register({ $replay_override_linked_flag: true }));
    null == (t2 = this.Mr) || t2.overrideLinkedFlag();
  }
  overrideSampling() {
    var t2, i2;
    this.Mr || (null == (i2 = this._instance.persistence) || i2.register({ $replay_override_sampling: true }));
    null == (t2 = this.Mr) || t2.overrideSampling();
  }
  overrideTrigger(t2) {
    var i2, e2;
    this.Mr || (null == (e2 = this._instance.persistence) || e2.register({ ["url" === t2 ? "$replay_override_url_trigger" : "$replay_override_event_trigger"]: true }));
    null == (i2 = this.Mr) || i2.overrideTrigger(t2);
  }
  get sdkDebugProperties() {
    var t2;
    return (null == (t2 = this.Mr) ? void 0 : t2.sdkDebugProperties) || { $recording_status: this.status };
  }
  tryAddCustomEvent(t2, i2) {
    var e2;
    return !(null == (e2 = this.Mr) || !e2.tryAddCustomEvent(t2, i2));
  }
}
var Lo = {}, No = () => {
}, Uo = "posthog", zo = !an && -1 === (null == d ? void 0 : d.indexOf("MSIE")) && -1 === (null == d ? void 0 : d.indexOf("Mozilla")), Ho = (i2) => {
  var e2;
  return g({ api_host: "https://us.i.posthog.com", flags_api_host: null, ui_host: null, token: "", autocapture: true, cross_subdomain_cookie: Ni(null == o ? void 0 : o.location), persistence: "localStorage+cookie", persistence_name: "", cookie_persisted_properties: [], loaded: No, save_campaign_params: true, custom_campaign_params: [], custom_blocked_useragents: [], save_referrer: true, capture_pageleave: "if_capture_pageview", defaults: null != i2 ? i2 : "unset", __preview_deferred_init_extensions: false, debug: a && O(null == a ? void 0 : a.search) && -1 !== a.search.indexOf("__posthog_debug=true") || false, cookie_expiration: 365, upgrade: false, disable_session_recording: false, disable_persistence: false, disable_web_experiments: true, disable_surveys: false, disable_surveys_automatic_display: false, disable_conversations: false, disable_product_tours: true, disable_external_dependency_loading: false, enable_recording_console_log: void 0, secure_cookie: "https:" === (null == t || null == (e2 = t.location) ? void 0 : e2.protocol), ip: false, opt_out_capturing_by_default: false, opt_out_persistence_by_default: false, opt_out_useragent_filter: false, opt_out_capturing_persistence_type: "localStorage", consent_persistence_name: null, opt_out_capturing_cookie_prefix: null, opt_in_site_apps: false, property_denylist: [], respect_dnt: false, sanitize_properties: null, request_headers: {}, request_batching: true, properties_string_max_length: 65535, mask_all_element_attributes: false, mask_all_text: false, mask_personal_data_properties: false, custom_personal_data_properties: [], advanced_disable_flags: false, advanced_disable_decide: false, advanced_disable_feature_flags: false, advanced_disable_feature_flags_on_first_load: false, advanced_only_evaluate_survey_feature_flags: false, advanced_enable_surveys: false, advanced_disable_toolbar_metrics: false, feature_flag_request_timeout_ms: 3e3, surveys_request_timeout_ms: 1e4, on_request_error: (t2) => {
    var i3 = "Bad HTTP status: " + t2.statusCode + " " + t2.text;
    $i.error(i3);
  }, get_device_id: (t2) => t2, capture_performance: void 0, name: "posthog", bootstrap: {}, disable_compression: false, session_idle_timeout_seconds: 1800, person_profiles: "identified_only", before_send: void 0, request_queue_config: { flush_interval_ms: fo }, error_tracking: {}, _onCapture: No, __preview_eager_load_replay: false }, ((t2) => ({ rageclick: !(t2 && t2 >= "2025-11-30") || { content_ignorelist: true }, capture_pageview: !(t2 && t2 >= "2025-05-24") || "history_change", session_recording: t2 && t2 >= "2025-11-30" ? { strictMinimumDuration: true } : {}, external_scripts_inject_target: t2 && t2 >= "2026-01-30" ? "head" : "body" }))(i2));
}, Bo = (t2) => {
  var i2 = {};
  M(t2.process_person) || (i2.person_profiles = t2.process_person), M(t2.xhr_headers) || (i2.request_headers = t2.xhr_headers), M(t2.cookie_name) || (i2.persistence_name = t2.cookie_name), M(t2.disable_cookie) || (i2.disable_persistence = t2.disable_cookie), M(t2.store_google) || (i2.save_campaign_params = t2.store_google), M(t2.verbose) || (i2.debug = t2.verbose);
  var e2 = Ri({}, i2, t2);
  return I(t2.property_blacklist) && (M(t2.property_denylist) ? e2.property_denylist = t2.property_blacklist : I(t2.property_denylist) ? e2.property_denylist = [...t2.property_blacklist, ...t2.property_denylist] : $i.error("Invalid value for property_denylist config: " + t2.property_denylist)), e2;
};
class qo {
  constructor() {
    this.__forceAllowLocalhost = false;
  }
  get Hr() {
    return this.__forceAllowLocalhost;
  }
  set Hr(t2) {
    $i.error("WebPerformanceObserver is deprecated and has no impact on network capture. Use `_forceAllowLocalhostNetworkCapture` on `posthog.sessionRecording`"), this.__forceAllowLocalhost = t2;
  }
}
class Wo {
  get decideEndpointWasHit() {
    var t2, i2;
    return null !== (t2 = null == (i2 = this.featureFlags) ? void 0 : i2.hasLoadedFlags) && void 0 !== t2 && t2;
  }
  get flagsEndpointWasHit() {
    var t2, i2;
    return null !== (t2 = null == (i2 = this.featureFlags) ? void 0 : i2.hasLoadedFlags) && void 0 !== t2 && t2;
  }
  constructor() {
    this.webPerformance = new qo(), this.Br = false, this.version = c.LIB_VERSION, this.qr = new to(), this._calculate_event_properties = this.calculateEventProperties.bind(this), this.config = Ho(), this.SentryIntegration = Vr, this.sentryIntegration = (t2) => function(t3, i2) {
      var e2 = Gr(t3, i2);
      return { name: Wr, processEvent: (t4) => e2(t4) };
    }(this, t2), this.__request_queue = [], this.__loaded = false, this.analyticsDefaultEndpoint = "/e/", this.Wr = false, this.Gr = null, this.Vr = null, this.Jr = null, this.featureFlags = new Rn(this), this.toolbar = new Qr(this), this.scrollManager = new mo(this), this.pageViewManager = new xs(this), this.surveys = new no(this), this.conversations = new ao(this), this.logs = new lo(this), this.experiments = new Ro(this), this.exceptions = new yn(this), this.rateLimiter = new ho(this), this.requestRouter = new Io(this), this.consent = new Or(this), this.externalIntegrations = new Oo(this), this.people = { set: (t2, i2, e2) => {
      var r2 = O(t2) ? { [t2]: i2 } : t2;
      this.setPersonProperties(r2), null == e2 || e2({});
    }, set_once: (t2, i2, e2) => {
      var r2 = O(t2) ? { [t2]: i2 } : t2;
      this.setPersonProperties(void 0, r2), null == e2 || e2({});
    } }, this.on("eventCaptured", (t2) => $i.info('send "' + (null == t2 ? void 0 : t2.event) + '"', t2));
  }
  init(t2, i2, e2) {
    if (e2 && e2 !== Uo) {
      var r2, s2 = null !== (r2 = Lo[e2]) && void 0 !== r2 ? r2 : new Wo();
      return s2._init(t2, i2, e2), Lo[e2] = s2, Lo[Uo][e2] = s2, s2;
    }
    return this._init(t2, i2, e2);
  }
  _init(i2, e2, r2) {
    var s2;
    if (void 0 === e2 && (e2 = {}), M(i2) || A(i2)) return $i.critical("PostHog was initialized without a token. This likely indicates a misconfiguration. Please check the first argument passed to posthog.init()"), this;
    if (this.__loaded) return console.warn("[PostHog.js]", "You have already initialized PostHog! Re-initializing is a no-op"), this;
    this.__loaded = true, this.config = {}, e2.debug = this.Kr(e2.debug), this.Yr = e2, this.Xr = [], e2.person_profiles && (this.Vr = e2.person_profiles), this.set_config(Ri({}, Ho(e2.defaults), Bo(e2), { name: r2, token: i2 })), this.config.on_xhr_error && $i.error("on_xhr_error is deprecated. Use on_request_error instead"), this.compression = e2.disable_compression ? void 0 : $s.GZipJS;
    var n2 = this.Qr();
    this.persistence = new Mn(this.config, n2), this.sessionPersistence = "sessionStorage" === this.config.persistence || "memory" === this.config.persistence ? this.persistence : new Mn(g({}, this.config, { persistence: "sessionStorage" }), n2);
    var o2 = g({}, this.persistence.props), a2 = g({}, this.sessionPersistence.props);
    this.register({ $initialization_time: (/* @__PURE__ */ new Date()).toISOString() }), this.Zr = new po((t2) => this.ts(t2), this.config.request_queue_config), this.es = new _o(this), this.__request_queue = [];
    var l2 = "always" === this.config.cookieless_mode || "on_reject" === this.config.cookieless_mode && this.consent.isExplicitlyOptedOut();
    if (l2 || (this.sessionManager = new xo(this), this.sessionPropsManager = new bo(this, this.sessionManager, this.persistence)), this.config.__preview_deferred_init_extensions ? ($i.info("Deferring extension initialization to improve startup performance"), setTimeout(() => {
      this.rs(l2);
    }, 0)) : ($i.info("Initializing extensions synchronously"), this.rs(l2)), c.DEBUG = c.DEBUG || this.config.debug, c.DEBUG && $i.info("Starting in debug mode", { this: this, config: e2, thisC: g({}, this.config), p: o2, s: a2 }), void 0 !== (null == (s2 = e2.bootstrap) ? void 0 : s2.distinctID)) {
      var u2, h2, d2 = this.config.get_device_id(br()), v2 = null != (u2 = e2.bootstrap) && u2.isIdentifiedID ? d2 : e2.bootstrap.distinctID;
      this.persistence.set_property(he, null != (h2 = e2.bootstrap) && h2.isIdentifiedID ? "identified" : "anonymous"), this.register({ distinct_id: e2.bootstrap.distinctID, $device_id: v2 });
    }
    if (this.ss()) {
      var f2, p2, _2 = Object.keys((null == (f2 = e2.bootstrap) ? void 0 : f2.featureFlags) || {}).filter((t2) => {
        var i3;
        return !(null == (i3 = e2.bootstrap) || null == (i3 = i3.featureFlags) || !i3[t2]);
      }).reduce((t2, i3) => {
        var r3;
        return t2[i3] = (null == (r3 = e2.bootstrap) || null == (r3 = r3.featureFlags) ? void 0 : r3[i3]) || false, t2;
      }, {}), m2 = Object.keys((null == (p2 = e2.bootstrap) ? void 0 : p2.featureFlagPayloads) || {}).filter((t2) => _2[t2]).reduce((t2, i3) => {
        var r3, s3;
        null != (r3 = e2.bootstrap) && null != (r3 = r3.featureFlagPayloads) && r3[i3] && (t2[i3] = null == (s3 = e2.bootstrap) || null == (s3 = s3.featureFlagPayloads) ? void 0 : s3[i3]);
        return t2;
      }, {});
      this.featureFlags.receivedFeatureFlags({ featureFlags: _2, featureFlagPayloads: m2 });
    }
    if (l2) this.register_once({ distinct_id: me, $device_id: null }, "");
    else if (!this.get_distinct_id()) {
      var y2 = this.config.get_device_id(br());
      this.register_once({ distinct_id: y2, $device_id: y2 }, ""), this.persistence.set_property(he, "anonymous");
    }
    return zi(t, "onpagehide" in self ? "pagehide" : "unload", this._handle_unload.bind(this), { passive: false }), this.toolbar.maybeLoadToolbar(), e2.segment ? qr(this, () => this.ns()) : this.ns(), C(this.config._onCapture) && this.config._onCapture !== No && ($i.warn("onCapture is deprecated. Please use `before_send` instead"), this.on("eventCaptured", (t2) => this.config._onCapture(t2.event, t2))), this.config.ip && $i.warn('The `ip` config option has NO EFFECT AT ALL and has been deprecated. Use a custom transformation or "Discard IP data" project setting instead. See https://posthog.com/tutorials/web-redact-properties#hiding-customer-ip-address for more information.'), this;
  }
  rs(t2) {
    var i2 = performance.now();
    this.historyAutocapture = new Hr(this), this.historyAutocapture.startIfEnabled();
    var e2 = [];
    e2.push(() => {
      new ts(this).startIfEnabledOrStop();
    }), e2.push(() => {
      var t3;
      this.siteApps = new So(this), null == (t3 = this.siteApps) || t3.init();
    }), t2 || e2.push(() => {
      this.sessionRecording = new jo(this), this.sessionRecording.startIfEnabledOrStop();
    }), this.config.disable_scroll_properties || e2.push(() => {
      this.scrollManager.startMeasuringScrollPosition();
    }), e2.push(() => {
      this.autocapture = new cr(this), this.autocapture.startIfEnabled();
    }), e2.push(() => {
      this.surveys.loadIfEnabled();
    }), e2.push(() => {
      this.logs.loadIfEnabled();
    }), e2.push(() => {
      this.conversations.loadIfEnabled();
    }), e2.push(() => {
      this.productTours = new Dn(this), this.productTours.loadIfEnabled();
    }), e2.push(() => {
      this.heatmaps = new ws(this), this.heatmaps.startIfEnabled();
    }), e2.push(() => {
      this.webVitalsAutocapture = new ms(this);
    }), e2.push(() => {
      this.exceptionObserver = new Ur(this), this.exceptionObserver.startIfEnabledOrStop();
    }), e2.push(() => {
      this.deadClicksAutocapture = new Lr(this, jr), this.deadClicksAutocapture.startIfEnabled();
    }), e2.push(() => {
      if (this.os) {
        var t3 = this.os;
        this.os = void 0, this.bi(t3);
      }
    }), this.ls(e2, i2);
  }
  ls(t2, i2) {
    for (; t2.length > 0; ) {
      if (this.config.__preview_deferred_init_extensions) {
        if (performance.now() - i2 >= 30 && t2.length > 0) return void setTimeout(() => {
          this.ls(t2, i2);
        }, 0);
      }
      var e2 = t2.shift();
      if (e2) try {
        e2();
      } catch (t3) {
        $i.error("Error initializing extension:", t3);
      }
    }
    var r2 = Math.round(performance.now() - i2);
    this.register_for_session({ $sdk_debug_extensions_init_method: this.config.__preview_deferred_init_extensions ? "deferred" : "synchronous", $sdk_debug_extensions_init_time_ms: r2 }), this.config.__preview_deferred_init_extensions && $i.info("PostHog extensions initialized (" + r2 + "ms)");
  }
  bi(t2) {
    var i2, e2, r2, s2, n2, a2, l2, u2, h2;
    if (!o || !o.body) return $i.info("document not ready yet, trying again in 500 milliseconds..."), void setTimeout(() => {
      this.bi(t2);
    }, 500);
    this.config.__preview_deferred_init_extensions && (this.os = t2), this.compression = void 0, t2.supportedCompression && !this.config.disable_compression && (this.compression = w(t2.supportedCompression, $s.GZipJS) ? $s.GZipJS : w(t2.supportedCompression, $s.Base64) ? $s.Base64 : void 0), null != (i2 = t2.analytics) && i2.endpoint && (this.analyticsDefaultEndpoint = t2.analytics.endpoint), this.set_config({ person_profiles: this.Vr ? this.Vr : "identified_only" }), null == (e2 = this.siteApps) || e2.onRemoteConfig(t2), null == (r2 = this.sessionRecording) || r2.onRemoteConfig(t2), null == (s2 = this.autocapture) || s2.onRemoteConfig(t2), null == (n2 = this.heatmaps) || n2.onRemoteConfig(t2), this.surveys.onRemoteConfig(t2), this.logs.onRemoteConfig(t2), this.conversations.onRemoteConfig(t2), null == (a2 = this.productTours) || a2.onRemoteConfig(t2), null == (l2 = this.webVitalsAutocapture) || l2.onRemoteConfig(t2), null == (u2 = this.exceptionObserver) || u2.onRemoteConfig(t2), this.exceptions.onRemoteConfig(t2), null == (h2 = this.deadClicksAutocapture) || h2.onRemoteConfig(t2);
  }
  ns() {
    try {
      this.config.loaded(this);
    } catch (t2) {
      $i.critical("`loaded` function failed", t2);
    }
    this.us(), this.config.capture_pageview && setTimeout(() => {
      (this.consent.isOptedIn() || "always" === this.config.cookieless_mode) && this.hs();
    }, 1), new co(this).load(), this.featureFlags.flags();
  }
  us() {
    var t2;
    this.is_capturing() && (this.config.request_batching && (null == (t2 = this.Zr) || t2.enable()));
  }
  _dom_loaded() {
    this.is_capturing() && Ii(this.__request_queue, (t2) => this.ts(t2)), this.__request_queue = [], this.us();
  }
  _handle_unload() {
    var t2, i2;
    this.surveys.handlePageUnload(), this.config.request_batching ? (this.ds() && this.capture("$pageleave"), null == (t2 = this.Zr) || t2.unload(), null == (i2 = this.es) || i2.unload()) : this.ds() && this.capture("$pageleave", null, { transport: "sendBeacon" });
  }
  _send_request(t2) {
    this.__loaded && (zo ? this.__request_queue.push(t2) : this.rateLimiter.isServerRateLimited(t2.batchKey) || (t2.transport = t2.transport || this.config.api_transport, t2.url = un(t2.url, { ip: this.config.ip ? 1 : 0 }), t2.headers = g({}, this.config.request_headers, t2.headers), t2.compression = "best-available" === t2.compression ? this.compression : t2.compression, t2.disableXHRCredentials = this.config.__preview_disable_xhr_credentials, this.config.__preview_disable_beacon && (t2.disableTransport = ["sendBeacon"]), t2.fetchOptions = t2.fetchOptions || this.config.fetch_options, ((t3) => {
      var i2, e2, r2, s2 = g({}, t3);
      s2.timeout = s2.timeout || 6e4, s2.url = un(s2.url, { _: (/* @__PURE__ */ new Date()).getTime().toString(), ver: c.LIB_VERSION, compression: s2.compression });
      var n2 = null !== (i2 = s2.transport) && void 0 !== i2 ? i2 : "fetch", o2 = vn.filter((t4) => !s2.disableTransport || !t4.transport || !s2.disableTransport.includes(t4.transport)), a2 = null !== (e2 = null == (r2 = Ui(o2, (t4) => t4.transport === n2)) ? void 0 : r2.method) && void 0 !== e2 ? e2 : o2[0].method;
      if (!a2) throw new Error("No available transport method");
      a2(s2);
    })(g({}, t2, { callback: (i2) => {
      var e2, r2;
      (this.rateLimiter.checkForLimiting(i2), i2.statusCode >= 400) && (null == (e2 = (r2 = this.config).on_request_error) || e2.call(r2, i2));
      null == t2.callback || t2.callback(i2);
    } }))));
  }
  ts(t2) {
    this.es ? this.es.retriableRequest(t2) : this._send_request(t2);
  }
  _execute_array(t2) {
    var i2, e2 = [], r2 = [], s2 = [];
    Ii(t2, (t3) => {
      t3 && (i2 = t3[0], I(i2) ? s2.push(t3) : C(t3) ? t3.call(this) : I(t3) && "alias" === i2 ? e2.push(t3) : I(t3) && -1 !== i2.indexOf("capture") && C(this[i2]) ? s2.push(t3) : r2.push(t3));
    });
    var n2 = function(t3, i3) {
      Ii(t3, function(t4) {
        if (I(t4[0])) {
          var e3 = i3;
          Ci(t4, function(t5) {
            e3 = e3[t5[0]].apply(e3, t5.slice(1));
          });
        } else this[t4[0]].apply(this, t4.slice(1));
      }, i3);
    };
    n2(e2, this), n2(r2, this), n2(s2, this);
  }
  ss() {
    var t2, i2;
    return (null == (t2 = this.config.bootstrap) ? void 0 : t2.featureFlags) && Object.keys(null == (i2 = this.config.bootstrap) ? void 0 : i2.featureFlags).length > 0 || false;
  }
  push(t2) {
    this._execute_array([t2]);
  }
  capture(t2, i2, e2) {
    var r2;
    if (this.__loaded && this.persistence && this.sessionPersistence && this.Zr) {
      if (this.is_capturing()) if (!M(t2) && O(t2)) {
        var s2 = !this.config.opt_out_useragent_filter && this._is_bot();
        if (!(s2 && !this.config.__preview_capture_bot_pageviews)) {
          var n2 = null != e2 && e2.skip_client_rate_limiting ? void 0 : this.rateLimiter.clientRateLimitContext();
          if (null == n2 || !n2.isRateLimited) {
            null != i2 && i2.$current_url && !O(null == i2 ? void 0 : i2.$current_url) && ($i.error("Invalid `$current_url` property provided to `posthog.capture`. Input must be a string. Ignoring provided value."), null == i2 || delete i2.$current_url), this.sessionPersistence.update_search_keyword(), this.config.save_campaign_params && this.sessionPersistence.update_campaign_params(), this.config.save_referrer && this.sessionPersistence.update_referrer_info(), (this.config.save_campaign_params || this.config.save_referrer) && this.persistence.set_initial_person_info();
            var o2 = /* @__PURE__ */ new Date(), a2 = (null == e2 ? void 0 : e2.timestamp) || o2, l2 = br(), u2 = { uuid: l2, event: t2, properties: this.calculateEventProperties(t2, i2 || {}, a2, l2) };
            "$pageview" === t2 && this.config.__preview_capture_bot_pageviews && s2 && (u2.event = "$bot_pageview", u2.properties.$browser_type = "bot"), n2 && (u2.properties.$lib_rate_limit_remaining_tokens = n2.remainingTokens), (null == e2 ? void 0 : e2.$set) && (u2.$set = null == e2 ? void 0 : e2.$set);
            var h2, d2 = "$groupidentify" !== t2, v2 = this.vs(null == e2 ? void 0 : e2.$set_once, d2);
            if (v2 && (u2.$set_once = v2), (u2 = ji(u2, null != e2 && e2._noTruncate ? null : this.config.properties_string_max_length)).timestamp = a2, M(null == e2 ? void 0 : e2.timestamp) || (u2.properties.$event_time_override_provided = true, u2.properties.$event_time_override_system_time = o2), t2 === Wn.DISMISSED || t2 === Wn.SENT) {
              var c2 = null == i2 ? void 0 : i2[Gn.SURVEY_ID], f2 = null == i2 ? void 0 : i2[Gn.SURVEY_ITERATION];
              h2 = { id: c2, current_iteration: f2 }, localStorage.getItem(Xn(h2)) || localStorage.setItem(Xn(h2), "true"), u2.$set = g({}, u2.$set, { [Yn({ id: c2, current_iteration: f2 }, t2 === Wn.SENT ? "responded" : "dismissed")]: true });
            } else t2 === Wn.SHOWN && (u2.$set = g({}, u2.$set, { [Gn.SURVEY_LAST_SEEN_DATE]: (/* @__PURE__ */ new Date()).toISOString() }));
            var p2 = g({}, u2.properties.$set, u2.$set);
            if (F(p2) || this.setPersonPropertiesForFlags(p2), !j(this.config.before_send)) {
              var _2 = this.cs(u2);
              if (!_2) return;
              u2 = _2;
            }
            this.qr.emit("eventCaptured", u2);
            var m2 = { method: "POST", url: null !== (r2 = null == e2 ? void 0 : e2._url) && void 0 !== r2 ? r2 : this.requestRouter.endpointFor("api", this.analyticsDefaultEndpoint), data: u2, compression: "best-available", batchKey: null == e2 ? void 0 : e2._batchKey };
            return !this.config.request_batching || e2 && (null == e2 || !e2._batchKey) || null != e2 && e2.send_instantly ? this.ts(m2) : this.Zr.enqueue(m2), u2;
          }
          $i.critical("This capture call is ignored due to client rate limiting.");
        }
      } else $i.error("No event name provided to posthog.capture");
    } else $i.uninitializedWarning("posthog.capture");
  }
  _addCaptureHook(t2) {
    return this.on("eventCaptured", (i2) => t2(i2.event, i2));
  }
  calculateEventProperties(t2, i2, e2, r2, s2) {
    if (e2 = e2 || /* @__PURE__ */ new Date(), !this.persistence || !this.sessionPersistence) return i2;
    var n2 = s2 ? void 0 : this.persistence.remove_event_timer(t2), a2 = g({}, i2);
    if (a2.token = this.config.token, a2.$config_defaults = this.config.defaults, ("always" == this.config.cookieless_mode || "on_reject" == this.config.cookieless_mode && this.consent.isExplicitlyOptedOut()) && (a2.$cookieless_mode = true), "$snapshot" === t2) {
      var l2 = g({}, this.persistence.properties(), this.sessionPersistence.properties());
      return a2.distinct_id = l2.distinct_id, (!O(a2.distinct_id) && !L(a2.distinct_id) || A(a2.distinct_id)) && $i.error("Invalid distinct_id for replay event. This indicates a bug in your implementation"), a2;
    }
    var u2, h2 = ps(this.config.mask_personal_data_properties, this.config.custom_personal_data_properties);
    if (this.sessionManager) {
      var { sessionId: v2, windowId: c2 } = this.sessionManager.checkAndGetSessionAndWindowId(s2, e2.getTime());
      a2.$session_id = v2, a2.$window_id = c2;
    }
    this.sessionPropsManager && Ri(a2, this.sessionPropsManager.getSessionProps());
    try {
      var f2;
      this.sessionRecording && Ri(a2, this.sessionRecording.sdkDebugProperties), a2.$sdk_debug_retry_queue_size = null == (f2 = this.es) ? void 0 : f2.length;
    } catch (t3) {
      a2.$sdk_debug_error_capturing_properties = String(t3);
    }
    if (this.requestRouter.region === Po.CUSTOM && (a2.$lib_custom_api_host = this.config.api_host), u2 = "$pageview" !== t2 || s2 ? "$pageleave" !== t2 || s2 ? this.pageViewManager.doEvent() : this.pageViewManager.doPageLeave(e2) : this.pageViewManager.doPageView(e2, r2), a2 = Ri(a2, u2), "$pageview" === t2 && o && (a2.title = o.title), !M(n2)) {
      var p2 = e2.getTime() - n2;
      a2.$duration = parseFloat((p2 / 1e3).toFixed(3));
    }
    d && this.config.opt_out_useragent_filter && (a2.$browser_type = this._is_bot() ? "bot" : "browser"), (a2 = Ri({}, h2, this.persistence.properties(), this.sessionPersistence.properties(), a2)).$is_identified = this._isIdentified(), I(this.config.property_denylist) ? Ci(this.config.property_denylist, function(t3) {
      delete a2[t3];
    }) : $i.error("Invalid value for property_denylist config: " + this.config.property_denylist + " or property_blacklist config: " + this.config.property_blacklist);
    var _2 = this.config.sanitize_properties;
    _2 && ($i.error("sanitize_properties is deprecated. Use before_send instead"), a2 = _2(a2, t2));
    var m2 = this.fs();
    return a2.$process_person_profile = m2, m2 && !s2 && this.ps("_calculate_event_properties"), a2;
  }
  vs(t2, i2) {
    var e2;
    if (void 0 === i2 && (i2 = true), !this.persistence || !this.fs()) return t2;
    if (this.Br) return t2;
    var r2 = this.persistence.get_initial_props(), s2 = null == (e2 = this.sessionPropsManager) ? void 0 : e2.getSetOnceProps(), n2 = Ri({}, r2, s2 || {}, t2 || {}), o2 = this.config.sanitize_properties;
    return o2 && ($i.error("sanitize_properties is deprecated. Use before_send instead"), n2 = o2(n2, "$set_once")), i2 && (this.Br = true), F(n2) ? void 0 : n2;
  }
  register(t2, i2) {
    var e2;
    null == (e2 = this.persistence) || e2.register(t2, i2);
  }
  register_once(t2, i2, e2) {
    var r2;
    null == (r2 = this.persistence) || r2.register_once(t2, i2, e2);
  }
  register_for_session(t2) {
    var i2;
    null == (i2 = this.sessionPersistence) || i2.register(t2);
  }
  unregister(t2) {
    var i2;
    null == (i2 = this.persistence) || i2.unregister(t2);
  }
  unregister_for_session(t2) {
    var i2;
    null == (i2 = this.sessionPersistence) || i2.unregister(t2);
  }
  gs(t2, i2) {
    this.register({ [t2]: i2 });
  }
  getFeatureFlag(t2, i2) {
    return this.featureFlags.getFeatureFlag(t2, i2);
  }
  getFeatureFlagPayload(t2) {
    var i2 = this.featureFlags.getFeatureFlagPayload(t2);
    try {
      return JSON.parse(i2);
    } catch (t3) {
      return i2;
    }
  }
  isFeatureEnabled(t2, i2) {
    return this.featureFlags.isFeatureEnabled(t2, i2);
  }
  reloadFeatureFlags() {
    this.featureFlags.reloadFeatureFlags();
  }
  updateFlags(t2, i2, e2) {
    var r2 = null != e2 && e2.merge ? this.featureFlags.getFlagVariants() : {}, s2 = null != e2 && e2.merge ? this.featureFlags.getFlagPayloads() : {}, n2 = g({}, r2, t2), o2 = g({}, s2, i2), a2 = {};
    for (var [l2, u2] of Object.entries(n2)) {
      var h2 = "string" == typeof u2;
      a2[l2] = { key: l2, enabled: !!h2 || Boolean(u2), variant: h2 ? u2 : void 0, reason: void 0, metadata: M(null == o2 ? void 0 : o2[l2]) ? void 0 : { id: 0, version: void 0, description: void 0, payload: o2[l2] } };
    }
    this.featureFlags.receivedFeatureFlags({ flags: a2 });
  }
  updateEarlyAccessFeatureEnrollment(t2, i2, e2) {
    this.featureFlags.updateEarlyAccessFeatureEnrollment(t2, i2, e2);
  }
  getEarlyAccessFeatures(t2, i2, e2) {
    return void 0 === i2 && (i2 = false), this.featureFlags.getEarlyAccessFeatures(t2, i2, e2);
  }
  on(t2, i2) {
    return this.qr.on(t2, i2);
  }
  onFeatureFlags(t2) {
    return this.featureFlags.onFeatureFlags(t2);
  }
  onSurveysLoaded(t2) {
    return this.surveys.onSurveysLoaded(t2);
  }
  onSessionId(t2) {
    var i2, e2;
    return null !== (i2 = null == (e2 = this.sessionManager) ? void 0 : e2.onSessionId(t2)) && void 0 !== i2 ? i2 : () => {
    };
  }
  getSurveys(t2, i2) {
    void 0 === i2 && (i2 = false), this.surveys.getSurveys(t2, i2);
  }
  getActiveMatchingSurveys(t2, i2) {
    void 0 === i2 && (i2 = false), this.surveys.getActiveMatchingSurveys(t2, i2);
  }
  renderSurvey(t2, i2) {
    this.surveys.renderSurvey(t2, i2);
  }
  displaySurvey(t2, i2) {
    void 0 === i2 && (i2 = Zn), this.surveys.displaySurvey(t2, i2);
  }
  cancelPendingSurvey(t2) {
    this.surveys.cancelPendingSurvey(t2);
  }
  canRenderSurvey(t2) {
    return this.surveys.canRenderSurvey(t2);
  }
  canRenderSurveyAsync(t2, i2) {
    return void 0 === i2 && (i2 = false), this.surveys.canRenderSurveyAsync(t2, i2);
  }
  identify(t2, i2, e2) {
    if (!this.__loaded || !this.persistence) return $i.uninitializedWarning("posthog.identify");
    if (L(t2) && (t2 = t2.toString(), $i.warn("The first argument to posthog.identify was a number, but it should be a string. It has been converted to a string.")), t2) if (["distinct_id", "distinctid"].includes(t2.toLowerCase())) $i.critical('The string "' + t2 + '" was set in posthog.identify which indicates an error. This ID should be unique to the user and not a hardcoded string.');
    else if (t2 !== me) {
      if (this.ps("posthog.identify")) {
        var r2 = this.get_distinct_id();
        if (this.register({ $user_id: t2 }), !this.get_property("$device_id")) {
          var s2 = r2;
          this.register_once({ $had_persisted_distinct_id: true, $device_id: s2 }, "");
        }
        t2 !== r2 && t2 !== this.get_property(Bi) && (this.unregister(Bi), this.register({ distinct_id: t2 }));
        var n2 = "anonymous" === (this.persistence.get_property(he) || "anonymous");
        t2 !== r2 && n2 ? (this.persistence.set_property(he, "identified"), this.setPersonPropertiesForFlags(g({}, e2 || {}, i2 || {}), false), this.capture("$identify", { distinct_id: t2, $anon_distinct_id: r2 }, { $set: i2 || {}, $set_once: e2 || {} }), this.Jr = fn(t2, i2, e2), this.featureFlags.setAnonymousDistinctId(r2)) : (i2 || e2) && this.setPersonProperties(i2, e2), t2 !== r2 && (this.reloadFeatureFlags(), this.unregister(ue));
      }
    } else $i.critical('The string "' + me + '" was set in posthog.identify which indicates an error. This ID is only used as a sentinel value.');
    else $i.error("Unique user id has not been set in posthog.identify");
  }
  setPersonProperties(t2, i2) {
    if ((t2 || i2) && this.ps("posthog.setPersonProperties")) {
      var e2 = fn(this.get_distinct_id(), t2, i2);
      this.Jr !== e2 ? (this.setPersonPropertiesForFlags(g({}, i2 || {}, t2 || {})), this.capture("$set", { $set: t2 || {}, $set_once: i2 || {} }), this.Jr = e2) : $i.info("A duplicate setPersonProperties call was made with the same properties. It has been ignored.");
    }
  }
  group(t2, i2, e2) {
    if (t2 && i2) {
      var r2 = this.getGroups();
      r2[t2] !== i2 && this.resetGroupPropertiesForFlags(t2), this.register({ $groups: g({}, r2, { [t2]: i2 }) }), e2 && (this.capture("$groupidentify", { $group_type: t2, $group_key: i2, $group_set: e2 }), this.setGroupPropertiesForFlags({ [t2]: e2 })), r2[t2] === i2 || e2 || this.reloadFeatureFlags();
    } else $i.error("posthog.group requires a group type and group key");
  }
  resetGroups() {
    this.register({ $groups: {} }), this.resetGroupPropertiesForFlags(), this.reloadFeatureFlags();
  }
  setPersonPropertiesForFlags(t2, i2) {
    void 0 === i2 && (i2 = true), this.featureFlags.setPersonPropertiesForFlags(t2, i2);
  }
  resetPersonPropertiesForFlags() {
    this.featureFlags.resetPersonPropertiesForFlags();
  }
  setGroupPropertiesForFlags(t2, i2) {
    void 0 === i2 && (i2 = true), this.ps("posthog.setGroupPropertiesForFlags") && this.featureFlags.setGroupPropertiesForFlags(t2, i2);
  }
  resetGroupPropertiesForFlags(t2) {
    this.featureFlags.resetGroupPropertiesForFlags(t2);
  }
  reset(t2) {
    var i2, e2, r2, s2;
    if ($i.info("reset"), !this.__loaded) return $i.uninitializedWarning("posthog.reset");
    var n2 = this.get_property("$device_id");
    if (this.consent.reset(), null == (i2 = this.persistence) || i2.clear(), null == (e2 = this.sessionPersistence) || e2.clear(), this.surveys.reset(), this.featureFlags.reset(), null == (r2 = this.persistence) || r2.set_property(he, "anonymous"), null == (s2 = this.sessionManager) || s2.resetSessionId(), this.Jr = null, "always" === this.config.cookieless_mode) this.register_once({ distinct_id: me, $device_id: null }, "");
    else {
      var o2 = this.config.get_device_id(br());
      this.register_once({ distinct_id: o2, $device_id: t2 ? o2 : n2 }, "");
    }
    this.register({ $last_posthog_reset: (/* @__PURE__ */ new Date()).toISOString() }, 1);
  }
  get_distinct_id() {
    return this.get_property("distinct_id");
  }
  getGroups() {
    return this.get_property("$groups") || {};
  }
  get_session_id() {
    var t2, i2;
    return null !== (t2 = null == (i2 = this.sessionManager) ? void 0 : i2.checkAndGetSessionAndWindowId(true).sessionId) && void 0 !== t2 ? t2 : "";
  }
  get_session_replay_url(t2) {
    if (!this.sessionManager) return "";
    var { sessionId: i2, sessionStartTimestamp: e2 } = this.sessionManager.checkAndGetSessionAndWindowId(true), r2 = this.requestRouter.endpointFor("ui", "/project/" + this.config.token + "/replay/" + i2);
    if (null != t2 && t2.withTimestamp && e2) {
      var s2, n2 = null !== (s2 = t2.timestampLookBack) && void 0 !== s2 ? s2 : 10;
      if (!e2) return r2;
      r2 += "?t=" + Math.max(Math.floor(((/* @__PURE__ */ new Date()).getTime() - e2) / 1e3) - n2, 0);
    }
    return r2;
  }
  alias(t2, i2) {
    return t2 === this.get_property(Hi) ? ($i.critical("Attempting to create alias for existing People user - aborting."), -2) : this.ps("posthog.alias") ? (M(i2) && (i2 = this.get_distinct_id()), t2 !== i2 ? (this.gs(Bi, t2), this.capture("$create_alias", { alias: t2, distinct_id: i2 })) : ($i.warn("alias matches current distinct_id - skipping api call."), this.identify(t2), -1)) : void 0;
  }
  set_config(t2) {
    var i2 = g({}, this.config);
    if (R(t2)) {
      var e2, r2, s2, n2, o2, a2, l2;
      Ri(this.config, Bo(t2));
      var u2 = this.Qr();
      null == (e2 = this.persistence) || e2.update_config(this.config, i2, u2), this.sessionPersistence = "sessionStorage" === this.config.persistence || "memory" === this.config.persistence ? this.persistence : new Mn(g({}, this.config, { persistence: "sessionStorage" }), u2);
      var h2 = this.Kr(this.config.debug);
      U(h2) && (this.config.debug = h2), U(this.config.debug) && (this.config.debug ? (c.DEBUG = true, Pr.H() && Pr.G("ph_debug", "true"), $i.info("set_config", { config: t2, oldConfig: i2, newConfig: g({}, this.config) })) : (c.DEBUG = false, Pr.H() && Pr.V("ph_debug"))), null == (r2 = this.exceptionObserver) || r2.onConfigChange(), null == (s2 = this.sessionRecording) || s2.startIfEnabledOrStop(), null == (n2 = this.autocapture) || n2.startIfEnabled(), null == (o2 = this.heatmaps) || o2.startIfEnabled(), null == (a2 = this.exceptionObserver) || a2.startIfEnabledOrStop(), this.surveys.loadIfEnabled(), this._s(), null == (l2 = this.externalIntegrations) || l2.startIfEnabledOrStop();
    }
  }
  startSessionRecording(t2) {
    var i2 = true === t2, e2 = { sampling: i2 || !(null == t2 || !t2.sampling), linked_flag: i2 || !(null == t2 || !t2.linked_flag), url_trigger: i2 || !(null == t2 || !t2.url_trigger), event_trigger: i2 || !(null == t2 || !t2.event_trigger) };
    if (Object.values(e2).some(Boolean)) {
      var r2, s2, n2, o2, a2;
      if (null == (r2 = this.sessionManager) || r2.checkAndGetSessionAndWindowId(), e2.sampling) null == (s2 = this.sessionRecording) || s2.overrideSampling();
      if (e2.linked_flag) null == (n2 = this.sessionRecording) || n2.overrideLinkedFlag();
      if (e2.url_trigger) null == (o2 = this.sessionRecording) || o2.overrideTrigger("url");
      if (e2.event_trigger) null == (a2 = this.sessionRecording) || a2.overrideTrigger("event");
    }
    this.set_config({ disable_session_recording: false });
  }
  stopSessionRecording() {
    this.set_config({ disable_session_recording: true });
  }
  sessionRecordingStarted() {
    var t2;
    return !(null == (t2 = this.sessionRecording) || !t2.started);
  }
  captureException(t2, i2) {
    var e2 = new Error("PostHog syntheticException"), r2 = this.exceptions.buildProperties(t2, { handled: true, syntheticException: e2 });
    return this.exceptions.sendExceptionEvent(g({}, r2, i2));
  }
  startExceptionAutocapture(t2) {
    this.set_config({ capture_exceptions: null == t2 || t2 });
  }
  stopExceptionAutocapture() {
    this.set_config({ capture_exceptions: false });
  }
  loadToolbar(t2) {
    return this.toolbar.loadToolbar(t2);
  }
  get_property(t2) {
    var i2;
    return null == (i2 = this.persistence) ? void 0 : i2.props[t2];
  }
  getSessionProperty(t2) {
    var i2;
    return null == (i2 = this.sessionPersistence) ? void 0 : i2.props[t2];
  }
  toString() {
    var t2, i2 = null !== (t2 = this.config.name) && void 0 !== t2 ? t2 : Uo;
    return i2 !== Uo && (i2 = Uo + "." + i2), i2;
  }
  _isIdentified() {
    var t2, i2;
    return "identified" === (null == (t2 = this.persistence) ? void 0 : t2.get_property(he)) || "identified" === (null == (i2 = this.sessionPersistence) ? void 0 : i2.get_property(he));
  }
  fs() {
    var t2, i2;
    return !("never" === this.config.person_profiles || "identified_only" === this.config.person_profiles && !this._isIdentified() && F(this.getGroups()) && (null == (t2 = this.persistence) || null == (t2 = t2.props) || !t2[Bi]) && (null == (i2 = this.persistence) || null == (i2 = i2.props) || !i2[ge]));
  }
  ds() {
    return true === this.config.capture_pageleave || "if_capture_pageview" === this.config.capture_pageleave && (true === this.config.capture_pageview || "history_change" === this.config.capture_pageview);
  }
  createPersonProfile() {
    this.fs() || this.ps("posthog.createPersonProfile") && this.setPersonProperties({}, {});
  }
  ps(t2) {
    return "never" === this.config.person_profiles ? ($i.error(t2 + ' was called, but process_person is set to "never". This call will be ignored.'), false) : (this.gs(ge, true), true);
  }
  Qr() {
    if ("always" === this.config.cookieless_mode) return true;
    var t2 = this.consent.isOptedOut(), i2 = this.config.opt_out_persistence_by_default || "on_reject" === this.config.cookieless_mode;
    return this.config.disable_persistence || t2 && !!i2;
  }
  _s() {
    var t2, i2, e2, r2, s2 = this.Qr();
    (null == (t2 = this.persistence) ? void 0 : t2.ki) !== s2 && (null == (e2 = this.persistence) || e2.set_disabled(s2));
    (null == (i2 = this.sessionPersistence) ? void 0 : i2.ki) !== s2 && (null == (r2 = this.sessionPersistence) || r2.set_disabled(s2));
    return s2;
  }
  opt_in_capturing(t2) {
    var i2;
    if ("always" !== this.config.cookieless_mode) {
      var e2, r2, s2;
      if ("on_reject" === this.config.cookieless_mode && this.consent.isExplicitlyOptedOut()) this.reset(true), null == (e2 = this.sessionManager) || e2.destroy(), null == (r2 = this.pageViewManager) || r2.destroy(), this.sessionManager = new xo(this), this.pageViewManager = new xs(this), this.persistence && (this.sessionPropsManager = new bo(this, this.sessionManager, this.persistence)), this.sessionRecording = new jo(this), this.sessionRecording.startIfEnabledOrStop();
      if (this.consent.optInOut(true), this._s(), this.us(), null == (i2 = this.sessionRecording) || i2.startIfEnabledOrStop(), "on_reject" == this.config.cookieless_mode && this.surveys.loadIfEnabled(), M(null == t2 ? void 0 : t2.captureEventName) || null != t2 && t2.captureEventName) this.capture(null !== (s2 = null == t2 ? void 0 : t2.captureEventName) && void 0 !== s2 ? s2 : "$opt_in", null == t2 ? void 0 : t2.captureProperties, { send_instantly: true });
      this.config.capture_pageview && this.hs();
    } else $i.warn('Consent opt in/out is not valid with cookieless_mode="always" and will be ignored');
  }
  opt_out_capturing() {
    var t2, i2, e2;
    "always" !== this.config.cookieless_mode ? ("on_reject" === this.config.cookieless_mode && this.consent.isOptedIn() && this.reset(true), this.consent.optInOut(false), this._s(), "on_reject" === this.config.cookieless_mode && (this.register({ distinct_id: me, $device_id: null }), null == (t2 = this.sessionManager) || t2.destroy(), null == (i2 = this.pageViewManager) || i2.destroy(), this.sessionManager = void 0, this.sessionPropsManager = void 0, null == (e2 = this.sessionRecording) || e2.stopRecording(), this.sessionRecording = void 0, this.hs())) : $i.warn('Consent opt in/out is not valid with cookieless_mode="always" and will be ignored');
  }
  has_opted_in_capturing() {
    return this.consent.isOptedIn();
  }
  has_opted_out_capturing() {
    return this.consent.isOptedOut();
  }
  get_explicit_consent_status() {
    var t2 = this.consent.consent;
    return t2 === Mr.GRANTED ? "granted" : t2 === Mr.DENIED ? "denied" : "pending";
  }
  is_capturing() {
    return "always" === this.config.cookieless_mode || ("on_reject" === this.config.cookieless_mode ? this.consent.isExplicitlyOptedOut() || this.consent.isOptedIn() : !this.has_opted_out_capturing());
  }
  clear_opt_in_out_capturing() {
    this.consent.reset(), this._s();
  }
  _is_bot() {
    return n ? ko(n, this.config.custom_blocked_useragents) : void 0;
  }
  hs() {
    o && ("visible" === o.visibilityState ? this.Wr || (this.Wr = true, this.capture("$pageview", { title: o.title }, { send_instantly: true }), this.Gr && (o.removeEventListener("visibilitychange", this.Gr), this.Gr = null)) : this.Gr || (this.Gr = this.hs.bind(this), zi(o, "visibilitychange", this.Gr)));
  }
  debug(i2) {
    false === i2 ? (null == t || t.console.log("You've disabled debug mode."), this.set_config({ debug: false })) : (null == t || t.console.log("You're now in debug mode. All calls to PostHog will be logged in your console.\nYou can disable this with `posthog.debug(false)`."), this.set_config({ debug: true }));
  }
  O() {
    var t2, i2, e2, r2, s2, n2, o2, a2 = this.Yr || {};
    return "advanced_disable_flags" in a2 ? !!a2.advanced_disable_flags : false !== this.config.advanced_disable_flags ? !!this.config.advanced_disable_flags : true === this.config.advanced_disable_decide ? ($i.warn("Config field 'advanced_disable_decide' is deprecated. Please use 'advanced_disable_flags' instead. The old field will be removed in a future major version."), true) : (e2 = "advanced_disable_decide", r2 = false, s2 = $i, n2 = (i2 = "advanced_disable_flags") in (t2 = a2) && !M(t2[i2]), o2 = e2 in t2 && !M(t2[e2]), n2 ? t2[i2] : o2 ? (s2 && s2.warn("Config field '" + e2 + "' is deprecated. Please use '" + i2 + "' instead. The old field will be removed in a future major version."), t2[e2]) : r2);
  }
  cs(t2) {
    if (j(this.config.before_send)) return t2;
    var i2 = I(this.config.before_send) ? this.config.before_send : [this.config.before_send], e2 = t2;
    for (var r2 of i2) {
      if (e2 = r2(e2), j(e2)) {
        var s2 = "Event '" + t2.event + "' was rejected in beforeSend function";
        return H(t2.event) ? $i.warn(s2 + ". This can cause unexpected behavior.") : $i.info(s2), null;
      }
      e2.properties && !F(e2.properties) || $i.warn("Event '" + t2.event + "' has no properties after beforeSend function, this is likely an error.");
    }
    return e2;
  }
  getPageViewId() {
    var t2;
    return null == (t2 = this.pageViewManager.Kt) ? void 0 : t2.pageViewId;
  }
  captureTraceFeedback(t2, i2) {
    this.capture("$ai_feedback", { $ai_trace_id: String(t2), $ai_feedback_text: i2 });
  }
  captureTraceMetric(t2, i2, e2) {
    this.capture("$ai_metric", { $ai_trace_id: String(t2), $ai_metric_name: i2, $ai_metric_value: String(e2) });
  }
  Kr(t2) {
    var i2 = U(t2) && !t2, e2 = Pr.H() && "true" === Pr.q("ph_debug");
    return !i2 && (!!e2 || t2);
  }
}
!function(t2, i2) {
  for (var e2 = 0; e2 < i2.length; e2++) t2.prototype[i2[e2]] = Ai(t2.prototype[i2[e2]]);
}(Wo, ["identify"]);
var Go, Jo = (Go = Lo[Uo] = new Wo(), function() {
  function i2() {
    i2.done || (i2.done = true, zo = false, Ci(Lo, function(t2) {
      t2._dom_loaded();
    }));
  }
  null != o && o.addEventListener ? "complete" === o.readyState ? i2() : zi(o, "DOMContentLoaded", i2, { capture: false }) : t && $i.error("Browser doesn't support `document.addEventListener` so PostHog couldn't be initialized");
}(), Go);
var PostHogContext = createContext({
  client: Jo,
  bootstrap: void 0
});
function isDeepEqual(obj1, obj2, visited) {
  if (visited === void 0) {
    visited = /* @__PURE__ */ new WeakMap();
  }
  if (obj1 === obj2) {
    return true;
  }
  if (typeof obj1 !== "object" || obj1 === null || typeof obj2 !== "object" || obj2 === null) {
    return false;
  }
  if (visited.has(obj1) && visited.get(obj1) === obj2) {
    return true;
  }
  visited.set(obj1, obj2);
  var keys1 = Object.keys(obj1);
  var keys2 = Object.keys(obj2);
  if (keys1.length !== keys2.length) {
    return false;
  }
  for (var _i2 = 0, keys1_1 = keys1; _i2 < keys1_1.length; _i2++) {
    var key = keys1_1[_i2];
    if (!keys2.includes(key)) {
      return false;
    }
    if (!isDeepEqual(obj1[key], obj2[key], visited)) {
      return false;
    }
  }
  return true;
}
function PostHogProvider(_a) {
  var _b, _c;
  var children = _a.children, client = _a.client, apiKey = _a.apiKey, options = _a.options;
  var previousInitializationRef = useRef(null);
  var posthog = useMemo(function() {
    if (client) {
      if (apiKey) {
        console.warn("[PostHog.js] You have provided both `client` and `apiKey` to `PostHogProvider`. `apiKey` will be ignored in favour of `client`.");
      }
      if (options) {
        console.warn("[PostHog.js] You have provided both `client` and `options` to `PostHogProvider`. `options` will be ignored in favour of `client`.");
      }
      return client;
    }
    if (apiKey) {
      return Jo;
    }
    console.warn("[PostHog.js] No `apiKey` or `client` were provided to `PostHogProvider`. Using default global `window.posthog` instance. You must initialize it manually. This is not recommended behavior.");
    return Jo;
  }, [client, apiKey, JSON.stringify(options)]);
  useEffect(function() {
    if (client) {
      return;
    }
    var previousInitialization = previousInitializationRef.current;
    if (!previousInitialization) {
      if (Jo.__loaded) {
        console.warn("[PostHog.js] `posthog` was already loaded elsewhere. This may cause issues.");
      }
      Jo.init(apiKey, options);
      previousInitializationRef.current = {
        apiKey,
        options: options !== null && options !== void 0 ? options : {}
      };
    } else {
      if (apiKey !== previousInitialization.apiKey) {
        console.warn("[PostHog.js] You have provided a different `apiKey` to `PostHogProvider` than the one that was already initialized. This is not supported by our provider and we'll keep using the previous key. If you need to toggle between API Keys you need to control the `client` yourself and pass it in as a prop rather than an `apiKey` prop.");
      }
      if (options && !isDeepEqual(options, previousInitialization.options)) {
        Jo.set_config(options);
      }
      previousInitializationRef.current = {
        apiKey,
        options: options !== null && options !== void 0 ? options : {}
      };
    }
  }, [client, apiKey, JSON.stringify(options)]);
  return React.createElement(PostHogContext.Provider, { value: { client: posthog, bootstrap: (_b = options === null || options === void 0 ? void 0 : options.bootstrap) !== null && _b !== void 0 ? _b : (_c = client === null || client === void 0 ? void 0 : client.config) === null || _c === void 0 ? void 0 : _c.bootstrap } }, children);
}
var isFunction = function(f2) {
  return typeof f2 === "function";
};
var extendStatics = function(d2, b2) {
  extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d3, b3) {
    d3.__proto__ = b3;
  } || function(d3, b3) {
    for (var p2 in b3) if (Object.prototype.hasOwnProperty.call(b3, p2)) d3[p2] = b3[p2];
  };
  return extendStatics(d2, b2);
};
function __extends(d2, b2) {
  if (typeof b2 !== "function" && b2 !== null)
    throw new TypeError("Class extends value " + String(b2) + " is not a constructor or null");
  extendStatics(d2, b2);
  function __() {
    this.constructor = d2;
  }
  d2.prototype = b2 === null ? Object.create(b2) : (__.prototype = b2.prototype, new __());
}
typeof SuppressedError === "function" ? SuppressedError : function(error, suppressed, message) {
  var e2 = new Error(message);
  return e2.name = "SuppressedError", e2.error = error, e2.suppressed = suppressed, e2;
};
var INITIAL_STATE = {
  componentStack: null,
  exceptionEvent: null,
  error: null
};
var __POSTHOG_ERROR_MESSAGES = {
  INVALID_FALLBACK: "[PostHog.js][PostHogErrorBoundary] Invalid fallback prop, provide a valid React element or a function that returns a valid React element."
};
(function(_super) {
  __extends(PostHogErrorBoundary, _super);
  function PostHogErrorBoundary(props) {
    var _this = _super.call(this, props) || this;
    _this.state = INITIAL_STATE;
    return _this;
  }
  PostHogErrorBoundary.prototype.componentDidCatch = function(error, errorInfo) {
    var additionalProperties = this.props.additionalProperties;
    var currentProperties;
    if (isFunction(additionalProperties)) {
      currentProperties = additionalProperties(error);
    } else if (typeof additionalProperties === "object") {
      currentProperties = additionalProperties;
    }
    var client = this.context.client;
    var exceptionEvent = client.captureException(error, currentProperties);
    var componentStack = errorInfo.componentStack;
    this.setState({
      error,
      componentStack: componentStack !== null && componentStack !== void 0 ? componentStack : null,
      exceptionEvent
    });
  };
  PostHogErrorBoundary.prototype.render = function() {
    var _a = this.props, children = _a.children, fallback = _a.fallback;
    var state = this.state;
    if (state.componentStack == null) {
      return isFunction(children) ? children() : children;
    }
    var element = isFunction(fallback) ? React.createElement(fallback, {
      error: state.error,
      componentStack: state.componentStack,
      exceptionEvent: state.exceptionEvent
    }) : fallback;
    if (React.isValidElement(element)) {
      return element;
    }
    console.warn(__POSTHOG_ERROR_MESSAGES.INVALID_FALLBACK);
    return React.createElement(React.Fragment, null);
  };
  PostHogErrorBoundary.contextType = PostHogContext;
  return PostHogErrorBoundary;
})(React.Component);
const name = "@twick/timeline";
const version = "0.15.0";
const packageJson = {
  name,
  version
};
function getPackageVersion() {
  return packageJson.version;
}
function getPackageName() {
  return packageJson.name;
}
const __vite_import_meta_env__ = {};
function isAnalyticsEnabled(config) {
  var _a, _b;
  if (typeof window !== "undefined") {
    const envDisabled = window.__TWICK_ANALYTICS_DISABLED__ === true || (__vite_import_meta_env__ == null ? void 0 : __vite_import_meta_env__.VITE_TWICK_ANALYTICS_ENABLED) === "false" || typeof process !== "undefined" && ((_a = process.env) == null ? void 0 : _a.TWICK_ANALYTICS_ENABLED) === "false";
    if (envDisabled) return false;
  }
  if ((config == null ? void 0 : config.enabled) === false) return false;
  if ((config == null ? void 0 : config.enabled) === true) return true;
  const envEnabled = typeof window !== "undefined" && (__vite_import_meta_env__ == null ? void 0 : __vite_import_meta_env__.VITE_TWICK_ANALYTICS_ENABLED) === "true" || typeof process !== "undefined" && ((_b = process.env) == null ? void 0 : _b.TWICK_ANALYTICS_ENABLED) === "true";
  return envEnabled;
}
function getPostHogApiKey(config) {
  var _a;
  return (config == null ? void 0 : config.apiKey) || typeof window !== "undefined" && (__vite_import_meta_env__ == null ? void 0 : __vite_import_meta_env__.VITE_POSTHOG_API_KEY) || typeof process !== "undefined" && ((_a = process.env) == null ? void 0 : _a.POSTHOG_API_KEY);
}
function getPostHogApiHost(config) {
  return (config == null ? void 0 : config.apiHost) || "https://us.i.posthog.com";
}
function trackEvent(posthog, eventName, properties, config) {
  if (!isAnalyticsEnabled(config)) {
    return;
  }
  try {
    const packageVersion = getPackageVersion();
    const packageName = getPackageName();
    posthog.capture(eventName, {
      ...properties,
      packageName,
      packageVersion,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (error) {
  }
}
function getPostHogOptions(config, onLoaded) {
  return {
    api_host: getPostHogApiHost(config),
    disable_session_recording: (config == null ? void 0 : config.disableSessionRecording) ?? true,
    loaded: onLoaded
  };
}
const TimelineContext = createContext(
  void 0
);
const TimelineProviderInner = ({
  contextId,
  children,
  resolution,
  initialData
}) => {
  const [timelineAction, setTimelineActionState] = useState({
    type: TIMELINE_ACTION.NONE,
    payload: null
  });
  const [selectedIds, setSelectedIds] = useState(/* @__PURE__ */ new Set());
  const [followPlayheadEnabled, setFollowPlayheadEnabled] = useState(true);
  const setSelectedItem = useCallback(
    (item) => {
      setSelectedIds(item ? /* @__PURE__ */ new Set([item.getId()]) : /* @__PURE__ */ new Set());
    },
    []
  );
  const setSelection = useCallback(
    (ids) => {
      setSelectedIds(ids);
    },
    []
  );
  const [videoResolution, setVideoResolution] = useState(
    resolution ?? { width: 720, height: 1280 }
  );
  const [totalDuration, setTotalDuration] = useState(0);
  const [changeLog, setChangeLog] = useState(0);
  const undoRedoContext = useUndoRedo();
  const dataInitialized = useRef(false);
  const updateChangeLog = () => {
    setChangeLog((prev) => prev + 1);
  };
  const editor = useMemo(() => {
    if (editorRegistry.has(contextId)) {
      editorRegistry.delete(contextId);
    }
    const newEditor = new TimelineEditor({
      contextId,
      setTotalDuration,
      setPresent: undoRedoContext.setPresent,
      handleUndo: undoRedoContext.undo,
      handleRedo: undoRedoContext.redo,
      handleResetHistory: undoRedoContext.resetHistory,
      updateChangeLog,
      setTimelineAction: (action, payload) => {
        setTimelineActionState({ type: action, payload });
      }
    });
    editorRegistry.set(contextId, newEditor);
    return newEditor;
  }, [contextId]);
  const selectedItem = useMemo(() => {
    var _a;
    if (selectedIds.size === 0) return null;
    const tracks = ((_a = editor.getTimelineData()) == null ? void 0 : _a.tracks) ?? [];
    const primaryId = [...selectedIds][0];
    return resolveId(primaryId, tracks);
  }, [selectedIds, changeLog, editor]);
  useEffect(() => {
    var _a;
    const tracks = ((_a = editor.getTimelineData()) == null ? void 0 : _a.tracks) ?? [];
    const validIds = /* @__PURE__ */ new Set();
    for (const t2 of tracks) {
      validIds.add(t2.getId());
      for (const el of t2.getElements()) {
        validIds.add(el.getId());
      }
    }
    setSelectedIds((prev) => {
      const next = new Set([...prev].filter((id) => validIds.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [changeLog, editor]);
  const setTimelineAction = (type, payload) => {
    setTimelineActionState({ type, payload });
  };
  const initialize = (data) => {
    const lastPersistedState = undoRedoContext.getLastPersistedState();
    if (lastPersistedState) {
      editor.loadProject(lastPersistedState);
      return;
    } else {
      editor.loadProject(data);
    }
  };
  useEffect(() => {
    if (initialData && !dataInitialized.current) {
      initialize(initialData);
      dataInitialized.current = true;
    }
  }, [initialData]);
  const contextValue = {
    contextId,
    selectedItem,
    selectedIds,
    setSelection,
    timelineAction,
    totalDuration,
    changeLog,
    videoResolution,
    present: undoRedoContext.present,
    canUndo: undoRedoContext.canUndo,
    canRedo: undoRedoContext.canRedo,
    setVideoResolution,
    setSelectedItem,
    setTimelineAction,
    editor,
    followPlayheadEnabled,
    setFollowPlayheadEnabled
  };
  return /* @__PURE__ */ jsx(TimelineContext.Provider, { value: contextValue, children });
};
const TimelineProvider = ({
  contextId,
  children,
  resolution = { width: 720, height: 1280 },
  initialData,
  undoRedoPersistenceKey,
  maxHistorySize,
  analytics
}) => {
  const analyticsEnabled = isAnalyticsEnabled(analytics);
  const apiKey = getPostHogApiKey(analytics);
  const onPostHogLoaded = (posthog) => {
    trackEvent(posthog, "timeline_editor_created", {
      contextId,
      url: typeof window !== "undefined" ? window.location.href : void 0,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  };
  const postHogOptions = getPostHogOptions(analytics, onPostHogLoaded);
  if (!analyticsEnabled || !apiKey) {
    return /* @__PURE__ */ jsx(
      UndoRedoProvider,
      {
        persistenceKey: undoRedoPersistenceKey,
        maxHistorySize,
        children: /* @__PURE__ */ jsx(
          TimelineProviderInner,
          {
            resolution,
            initialData,
            contextId,
            undoRedoPersistenceKey,
            maxHistorySize,
            analytics,
            children
          }
        )
      }
    );
  }
  return /* @__PURE__ */ jsx(
    PostHogProvider,
    {
      apiKey,
      options: postHogOptions,
      children: /* @__PURE__ */ jsx(
        UndoRedoProvider,
        {
          persistenceKey: undoRedoPersistenceKey,
          maxHistorySize,
          children: /* @__PURE__ */ jsx(
            TimelineProviderInner,
            {
              resolution,
              initialData,
              contextId,
              undoRedoPersistenceKey,
              maxHistorySize,
              analytics,
              children
            }
          )
        }
      )
    }
  );
};
const useTimelineContext = () => {
  const context = useContext(TimelineContext);
  if (context === void 0) {
    throw new Error(
      "useTimelineContext must be used within a TimelineProvider"
    );
  }
  return context;
};
class Watermark {
  constructor(type) {
    __publicField(this, "id");
    __publicField(this, "type");
    __publicField(this, "position");
    __publicField(this, "rotation");
    __publicField(this, "opacity");
    __publicField(this, "props");
    this.type = type;
    this.id = "e-watermark";
  }
  getId() {
    return this.id;
  }
  getType() {
    return this.type;
  }
  getPosition() {
    return this.position;
  }
  getRotation() {
    return this.rotation;
  }
  getOpacity() {
    return this.opacity;
  }
  getProps() {
    if (this.type === "text") {
      return this.props;
    } else if (this.type === "image") {
      return this.props;
    }
  }
  setProps(props) {
    if (this.type === "text") {
      this.props = props;
    } else if (this.type === "image") {
      this.props = props;
    }
    return this;
  }
  setPosition(position) {
    this.position = position;
    return this;
  }
  setRotation(rotation) {
    this.rotation = rotation;
    return this;
  }
  setOpacity(opacity) {
    this.opacity = opacity;
    return this;
  }
  toJSON() {
    return {
      id: "e-watermark",
      type: this.type,
      position: this.position,
      rotation: this.rotation,
      opacity: this.opacity,
      props: this.props
    };
  }
  static fromJSON(json) {
    const watermark = new Watermark(json.type);
    watermark.setPosition(json.position ?? { x: 0, y: 0 });
    watermark.setRotation(json.rotation ?? 0);
    watermark.setOpacity(json.opacity ?? 1);
    watermark.setProps(json.props);
    return watermark;
  }
}
function formatTimeWithFrames(timeSeconds, fps = 30) {
  const totalSeconds = Math.max(0, timeSeconds);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const frames = Math.floor(totalSeconds % 1 * fps);
  const mm = minutes.toString().padStart(2, "0");
  const ss2 = seconds.toString().padStart(2, "0");
  const ff = frames.toString().padStart(2, "0");
  return `${mm}:${ss2}.${ff}`;
}
function formatTimeSimple(timeSeconds) {
  const totalSeconds = Math.max(0, timeSeconds);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const mm = minutes.toString().padStart(2, "0");
  const ss2 = seconds.toString().padStart(2, "0");
  return `${mm}:${ss2}`;
}
const pad = (n2, size = 2) => String(n2).padStart(size, "0");
const toSrtTime = (seconds) => {
  const totalMs = Math.max(0, Math.floor(seconds * 1e3));
  const ms2 = totalMs % 1e3;
  const totalSec = Math.floor(totalMs / 1e3);
  const sec = totalSec % 60;
  const totalMin = Math.floor(totalSec / 60);
  const min = totalMin % 60;
  const hrs = Math.floor(totalMin / 60);
  return `${pad(hrs)}:${pad(min)}:${pad(sec)},${pad(ms2, 3)}`;
};
const toVttTime = (seconds) => {
  const totalMs = Math.max(0, Math.floor(seconds * 1e3));
  const ms2 = totalMs % 1e3;
  const totalSec = Math.floor(totalMs / 1e3);
  const sec = totalSec % 60;
  const totalMin = Math.floor(totalSec / 60);
  const min = totalMin % 60;
  const hrs = Math.floor(totalMin / 60);
  return `${pad(hrs)}:${pad(min)}:${pad(sec)}.${pad(ms2, 3)}`;
};
const getCaptionText = (element) => {
  var _a;
  const fromTextField = typeof element.t === "string" ? element.t : "";
  const fromProps = typeof ((_a = element.props) == null ? void 0 : _a.text) === "string" ? element.props.text : "";
  return (fromTextField || fromProps).trim();
};
const getCaptionElements = (project, language) => {
  const captions = (project.tracks || []).filter((track) => {
    if (track.type !== "caption") return false;
    if (!language) return true;
    return (track.language || "default") === language;
  }).flatMap((track) => track.elements || []).filter((element) => element.type === "caption").map((element) => ({
    s: element.s,
    e: element.e,
    text: getCaptionText(element)
  })).filter((caption) => caption.text && caption.e > caption.s).sort((a2, b2) => a2.s - b2.s);
  return captions;
};
const getCaptionLanguages = (project) => {
  const languages = (project.tracks || []).filter((track) => track.type === "caption").map((track) => track.language || "default");
  return [...new Set(languages)];
};
const exportCaptionsAsSRT = (project, language) => {
  const captions = getCaptionElements(project, language);
  return captions.map(
    (caption, index) => `${index + 1}
${toSrtTime(caption.s)} --> ${toSrtTime(caption.e)}
${caption.text}
`
  ).join("\n");
};
const exportCaptionsAsVTT = (project, language) => {
  const captions = getCaptionElements(project, language);
  const body = captions.map(
    (caption) => `${toVttTime(caption.s)} --> ${toVttTime(caption.e)}
${caption.text}
`
  ).join("\n");
  return `WEBVTT

${body}`.trimEnd();
};
const formatSeconds = (value) => {
  const sec = Math.max(0, Math.floor(value));
  const h2 = Math.floor(sec / 3600);
  const m2 = Math.floor(sec % 3600 / 60);
  const s2 = sec % 60;
  if (h2 > 0) {
    return `${h2}:${String(m2).padStart(2, "0")}:${String(s2).padStart(2, "0")}`;
  }
  return `${m2}:${String(s2).padStart(2, "0")}`;
};
const getChapterMarkers = (project) => {
  var _a;
  const chapters = ((_a = project.metadata) == null ? void 0 : _a.chapters) ?? [];
  return [...chapters].sort((a2, b2) => a2.time - b2.time);
};
const exportChaptersAsYouTube = (project) => {
  const chapters = getChapterMarkers(project);
  return chapters.map((chapter) => `${formatSeconds(chapter.time)} ${chapter.title}`).join("\n");
};
const exportChaptersAsJSON = (project) => {
  return JSON.stringify(getChapterMarkers(project), null, 2);
};
function snapTime(time, targets, thresholdSec = 0.1) {
  if (targets.length === 0 || thresholdSec <= 0) {
    return { time, didSnap: false };
  }
  let nearestTarget;
  let minDist = thresholdSec;
  for (const target of targets) {
    const dist = Math.abs(time - target);
    if (dist < minDist) {
      minDist = dist;
      nearestTarget = target;
    }
  }
  if (nearestTarget !== void 0) {
    return { time: nearestTarget, didSnap: true, snapTarget: nearestTarget };
  }
  return { time, didSnap: false };
}
function pxToSecThreshold(thresholdPx, pixelsPerSecond) {
  if (pixelsPerSecond <= 0) return Infinity;
  return thresholdPx / pixelsPerSecond;
}
function computeCaptionGeometry(fontSize, captionStyle) {
  const safeFontSize = fontSize ?? 8;
  const lineWidth = captionStyle === CAPTION_STYLE.WORD_BG_HIGHLIGHT ? 0.1 : parseFloat((safeFontSize * 0.05).toFixed(3));
  const gap = captionStyle === CAPTION_STYLE.WORD_BG_HIGHLIGHT ? 0 : Math.round(safeFontSize * 0.2);
  return {
    lineWidth,
    rectProps: {
      gap
    }
  };
}
if (typeof window !== "undefined") {
  window.Twick = {
    Track,
    TrackElement,
    ElementDeserializer,
    ElementSerializer,
    ElementValidator,
    ElementAdder,
    ElementRemover,
    ElementUpdater,
    ElementSplitter,
    ElementCloner,
    TimelineEditor,
    TimelineProvider,
    TIMELINE_ELEMENT_TYPE,
    // Element types
    CaptionElement,
    RectElement,
    TextElement,
    ImageElement,
    AudioElement,
    CircleElement,
    IconElement,
    VideoElement,
    PlaceholderElement,
    ArrowElement,
    LineElement,
    ElementAnimation,
    ElementFrameEffect,
    ElementTextEffect,
    // Utility functions
    generateShortUuid,
    getTotalDuration,
    getCurrentElements,
    isTrackId,
    isElementId
  };
}
export {
  ArrowElement,
  AudioElement,
  CAPTION_COLOR,
  CAPTION_FONT,
  CAPTION_STYLE,
  CAPTION_STYLE_OPTIONS,
  CURRENT_PROJECT_VERSION,
  CaptionElement,
  CircleElement,
  EffectElement,
  ElementAdder,
  ElementAnimation,
  ElementCloner,
  ElementDeserializer,
  ElementFrameEffect,
  ElementRemover,
  ElementSerializer,
  ElementSplitter,
  ElementTextEffect,
  ElementUpdater,
  ElementValidator,
  INITIAL_TIMELINE_DATA,
  IconElement,
  ImageElement,
  LineElement,
  PLAYER_STATE,
  PROCESS_STATE,
  PlaceholderElement,
  RectElement,
  TIMELINE_ACTION,
  TIMELINE_ELEMENT_TYPE,
  TRACK_TYPES,
  TextElement,
  TimelineEditor,
  TimelineProvider,
  Track,
  TrackElement,
  VALIDATION_ERROR_CODE,
  ValidationError,
  VideoElement,
  WORDS_PER_PHRASE,
  Watermark,
  canSplitElement,
  computeCaptionGeometry,
  exportCaptionsAsSRT,
  exportCaptionsAsVTT,
  exportChaptersAsJSON,
  exportChaptersAsYouTube,
  extractVideoAudio,
  formatTimeSimple,
  formatTimeWithFrames,
  generateShortUuid,
  getCaptionElements,
  getCaptionLanguages,
  getChapterMarkers,
  getCurrentElements,
  getDecimalNumber,
  getElementIdsInRange,
  getTotalDuration,
  isElementId,
  isTrackId,
  migrateProject,
  pxToSecThreshold,
  resolveId,
  resolveIds,
  snapTime,
  useTimelineContext
};
//# sourceMappingURL=index.mjs.map
