var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { forwardRef, createElement, useState, useEffect, useRef, useCallback, createContext, useContext, useMemo } from "react";
import { useTimelineContext, TrackElement, Track, ImageElement, AudioElement, VideoElement, TextElement, TIMELINE_ELEMENT_TYPE, EffectElement, computeCaptionGeometry, CAPTION_STYLE, CaptionElement, TRACK_TYPES, LineElement, ArrowElement, RectElement, CircleElement, ElementTextEffect, ElementAnimation, CAPTION_STYLE_OPTIONS, exportChaptersAsYouTube, exportChaptersAsJSON, getCaptionLanguages, exportCaptionsAsSRT, exportCaptionsAsVTT, PLAYER_STATE } from "@twick/timeline";
import { AudioElement as AudioElement2, CAPTION_COLOR, CAPTION_FONT, CAPTION_STYLE as CAPTION_STYLE2, CAPTION_STYLE_OPTIONS as CAPTION_STYLE_OPTIONS2, CaptionElement as CaptionElement2, CircleElement as CircleElement2, ElementAdder, ElementAnimation as ElementAnimation2, ElementCloner, ElementDeserializer, ElementFrameEffect, ElementRemover, ElementSerializer, ElementSplitter, ElementTextEffect as ElementTextEffect2, ElementUpdater, ElementValidator, INITIAL_TIMELINE_DATA, IconElement, ImageElement as ImageElement2, PROCESS_STATE, RectElement as RectElement2, TIMELINE_ACTION, TIMELINE_ELEMENT_TYPE as TIMELINE_ELEMENT_TYPE2, TextElement as TextElement2, TimelineEditor, TimelineProvider, Track as Track2, TrackElement as TrackElement2, VideoElement as VideoElement2, WORDS_PER_PHRASE, generateShortUuid, getCurrentElements, getTotalDuration, isElementId, isTrackId, useTimelineContext as useTimelineContext2 } from "@twick/timeline";
import VideoEditor, { useEditorManager, BrowserMediaManager, TIMELINE_DROP_MEDIA_TYPE, throttle, AVAILABLE_TEXT_FONTS, TEXT_EFFECTS, ANIMATIONS } from "@twick/video-editor";
import { ANIMATIONS as ANIMATIONS2, BaseMediaManager, BrowserMediaManager as BrowserMediaManager2, PlayerControls, TEXT_EFFECTS as TEXT_EFFECTS2, TimelineManager, default as default2, animationGifs, getAnimationGif, setElementColors, useEditorManager as useEditorManager2, usePlayerControl, useTimelineControl } from "@twick/video-editor";
import { useLivePlayerContext } from "@twick/live-player";
import { LivePlayer, LivePlayerProvider, PLAYER_STATE as PLAYER_STATE2, generateId, getBaseProject, useLivePlayerContext as useLivePlayerContext2 } from "@twick/live-player";
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const toKebabCase = (string) => string.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
const toCamelCase = (string) => string.replace(
  /^([A-Z])|[\s-_]+(\w)/g,
  (match, p1, p2) => p2 ? p2.toUpperCase() : p1.toLowerCase()
);
const toPascalCase = (string) => {
  const camelCase = toCamelCase(string);
  return camelCase.charAt(0).toUpperCase() + camelCase.slice(1);
};
const mergeClasses = (...classes) => classes.filter((className, index, array) => {
  return Boolean(className) && className.trim() !== "" && array.indexOf(className) === index;
}).join(" ").trim();
const hasA11yProp = (props) => {
  for (const prop in props) {
    if (prop.startsWith("aria-") || prop === "role" || prop === "title") {
      return true;
    }
  }
};
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
var defaultAttributes = {
  xmlns: "http://www.w3.org/2000/svg",
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round"
};
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Icon = forwardRef(
  ({
    color = "currentColor",
    size = 24,
    strokeWidth = 2,
    absoluteStrokeWidth,
    className = "",
    children,
    iconNode,
    ...rest
  }, ref) => createElement(
    "svg",
    {
      ref,
      ...defaultAttributes,
      width: size,
      height: size,
      stroke: color,
      strokeWidth: absoluteStrokeWidth ? Number(strokeWidth) * 24 / Number(size) : strokeWidth,
      className: mergeClasses("lucide", className),
      ...!children && !hasA11yProp(rest) && { "aria-hidden": "true" },
      ...rest
    },
    [
      ...iconNode.map(([tag, attrs]) => createElement(tag, attrs)),
      ...Array.isArray(children) ? children : [children]
    ]
  )
);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const createLucideIcon = (iconName, iconNode) => {
  const Component = forwardRef(
    ({ className, ...props }, ref) => createElement(Icon, {
      ref,
      iconNode,
      className: mergeClasses(
        `lucide-${toKebabCase(toPascalCase(iconName))}`,
        `lucide-${iconName}`,
        className
      ),
      ...props
    })
  );
  Component.displayName = toPascalCase(iconName);
  return Component;
};
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$v = [
  ["path", { d: "M17 12H7", key: "16if0g" }],
  ["path", { d: "M19 18H5", key: "18s9l3" }],
  ["path", { d: "M21 6H3", key: "1jwq7v" }]
];
const AlignCenter = createLucideIcon("align-center", __iconNode$v);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$u = [
  ["path", { d: "M15 12H3", key: "6jk70r" }],
  ["path", { d: "M17 18H3", key: "1amg6g" }],
  ["path", { d: "M21 6H3", key: "1jwq7v" }]
];
const AlignLeft = createLucideIcon("align-left", __iconNode$u);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$t = [
  ["path", { d: "M21 12H9", key: "dn1m92" }],
  ["path", { d: "M21 18H7", key: "1ygte8" }],
  ["path", { d: "M21 6H3", key: "1jwq7v" }]
];
const AlignRight = createLucideIcon("align-right", __iconNode$t);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$s = [
  [
    "path",
    { d: "M6 12h9a4 4 0 0 1 0 8H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h7a4 4 0 0 1 0 8", key: "mg9rjx" }
  ]
];
const Bold = createLucideIcon("bold", __iconNode$s);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$r = [["path", { d: "m6 9 6 6 6-6", key: "qrunsl" }]];
const ChevronDown = createLucideIcon("chevron-down", __iconNode$r);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$q = [["path", { d: "m9 18 6-6-6-6", key: "mthhwq" }]];
const ChevronRight = createLucideIcon("chevron-right", __iconNode$q);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$p = [["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }]];
const Circle = createLucideIcon("circle", __iconNode$p);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$o = [
  ["path", { d: "M12 15V3", key: "m9g1x1" }],
  ["path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", key: "ih7n3h" }],
  ["path", { d: "m7 10 5 5 5-5", key: "brsn70" }]
];
const Download = createLucideIcon("download", __iconNode$o);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$n = [
  ["path", { d: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z", key: "1rqfz7" }],
  ["path", { d: "M14 2v4a2 2 0 0 0 2 2h4", key: "tnqrlb" }]
];
const File = createLucideIcon("file", __iconNode$n);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$m = [
  ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2", ry: "2", key: "1m3agn" }],
  ["circle", { cx: "9", cy: "9", r: "2", key: "af1f0g" }],
  ["path", { d: "m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21", key: "1xmnt7" }]
];
const Image = createLucideIcon("image", __iconNode$m);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$l = [
  ["line", { x1: "19", x2: "10", y1: "4", y2: "4", key: "15jd3p" }],
  ["line", { x1: "14", x2: "5", y1: "20", y2: "20", key: "bu0au3" }],
  ["line", { x1: "15", x2: "9", y1: "4", y2: "20", key: "uljnxc" }]
];
const Italic = createLucideIcon("italic", __iconNode$l);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$k = [
  ["path", { d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z", key: "1lielz" }]
];
const MessageSquare = createLucideIcon("message-square", __iconNode$k);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$j = [
  ["circle", { cx: "8", cy: "18", r: "4", key: "1fc0mg" }],
  ["path", { d: "M12 18V2l7 4", key: "g04rme" }]
];
const Music2 = createLucideIcon("music-2", __iconNode$j);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$i = [
  ["path", { d: "M9 18V5l12-2v13", key: "1jmyc2" }],
  ["circle", { cx: "6", cy: "18", r: "3", key: "fqmcym" }],
  ["circle", { cx: "18", cy: "16", r: "3", key: "1hluhg" }]
];
const Music = createLucideIcon("music", __iconNode$i);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$h = [
  [
    "path",
    {
      d: "M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z",
      key: "e79jfc"
    }
  ],
  ["circle", { cx: "13.5", cy: "6.5", r: ".5", fill: "currentColor", key: "1okk4w" }],
  ["circle", { cx: "17.5", cy: "10.5", r: ".5", fill: "currentColor", key: "f64h9f" }],
  ["circle", { cx: "6.5", cy: "12.5", r: ".5", fill: "currentColor", key: "qy21gx" }],
  ["circle", { cx: "8.5", cy: "7.5", r: ".5", fill: "currentColor", key: "fotxhn" }]
];
const Palette = createLucideIcon("palette", __iconNode$h);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$g = [
  ["rect", { x: "14", y: "4", width: "4", height: "16", rx: "1", key: "zuxfzm" }],
  ["rect", { x: "6", y: "4", width: "4", height: "16", rx: "1", key: "1okwgv" }]
];
const Pause = createLucideIcon("pause", __iconNode$g);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$f = [["polygon", { points: "6 3 20 12 6 21 6 3", key: "1oa8hb" }]];
const Play = createLucideIcon("play", __iconNode$f);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$e = [
  ["path", { d: "M5 12h14", key: "1ays0h" }],
  ["path", { d: "M12 5v14", key: "s699le" }]
];
const Plus = createLucideIcon("plus", __iconNode$e);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$d = [
  ["rect", { width: "20", height: "12", x: "2", y: "6", rx: "2", key: "9lu3g6" }]
];
const RectangleHorizontal = createLucideIcon("rectangle-horizontal", __iconNode$d);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$c = [
  ["rect", { width: "12", height: "20", x: "6", y: "2", rx: "2", key: "1oxtiu" }]
];
const RectangleVertical = createLucideIcon("rectangle-vertical", __iconNode$c);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$b = [
  [
    "path",
    {
      d: "M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z",
      key: "icamh8"
    }
  ],
  ["path", { d: "m14.5 12.5 2-2", key: "inckbg" }],
  ["path", { d: "m11.5 9.5 2-2", key: "fmmyf7" }],
  ["path", { d: "m8.5 6.5 2-2", key: "vc6u1g" }],
  ["path", { d: "m17.5 15.5 2-2", key: "wo5hmg" }]
];
const Ruler = createLucideIcon("ruler", __iconNode$b);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$a = [
  [
    "path",
    {
      d: "M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z",
      key: "1c8476"
    }
  ],
  ["path", { d: "M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7", key: "1ydtos" }],
  ["path", { d: "M7 3v4a1 1 0 0 0 1 1h7", key: "t51u73" }]
];
const Save = createLucideIcon("save", __iconNode$a);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$9 = [
  ["circle", { cx: "6", cy: "6", r: "3", key: "1lh9wr" }],
  ["path", { d: "M8.12 8.12 12 12", key: "1alkpv" }],
  ["path", { d: "M20 4 8.12 15.88", key: "xgtan2" }],
  ["circle", { cx: "6", cy: "18", r: "3", key: "fqmcym" }],
  ["path", { d: "M14.8 14.8 20 20", key: "ptml3r" }]
];
const Scissors = createLucideIcon("scissors", __iconNode$9);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$8 = [
  ["path", { d: "m21 21-4.34-4.34", key: "14j7rj" }],
  ["circle", { cx: "11", cy: "11", r: "8", key: "4ej97u" }]
];
const Search = createLucideIcon("search", __iconNode$8);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$7 = [
  [
    "path",
    {
      d: "M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z",
      key: "4pj2yx"
    }
  ],
  ["path", { d: "M20 3v4", key: "1olli1" }],
  ["path", { d: "M22 5h-4", key: "1gvqau" }],
  ["path", { d: "M4 17v2", key: "vumght" }],
  ["path", { d: "M5 18H3", key: "zchphs" }]
];
const Sparkles = createLucideIcon("sparkles", __iconNode$7);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$6 = [
  ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2", key: "afitv7" }]
];
const Square = createLucideIcon("square", __iconNode$6);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$5 = [
  ["path", { d: "M3 6h18", key: "d0wm0j" }],
  ["path", { d: "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6", key: "4alrt4" }],
  ["path", { d: "M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2", key: "v07s0e" }],
  ["line", { x1: "10", x2: "10", y1: "11", y2: "17", key: "1uufr5" }],
  ["line", { x1: "14", x2: "14", y1: "11", y2: "17", key: "xtxkd" }]
];
const Trash2 = createLucideIcon("trash-2", __iconNode$5);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$4 = [
  ["path", { d: "M12 4v16", key: "1654pz" }],
  ["path", { d: "M4 7V5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2", key: "e0r10z" }],
  ["path", { d: "M9 20h6", key: "s66wpe" }]
];
const Type = createLucideIcon("type", __iconNode$4);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$3 = [
  ["path", { d: "M12 3v12", key: "1x0j5s" }],
  ["path", { d: "m17 8-5-5-5 5", key: "7q97r8" }],
  ["path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", key: "ih7n3h" }]
];
const Upload = createLucideIcon("upload", __iconNode$3);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$2 = [
  [
    "path",
    {
      d: "m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5",
      key: "ftymec"
    }
  ],
  ["rect", { x: "2", y: "6", width: "14", height: "12", rx: "2", key: "158x01" }]
];
const Video = createLucideIcon("video", __iconNode$2);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$1 = [
  [
    "path",
    {
      d: "M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z",
      key: "uqj9uw"
    }
  ],
  ["path", { d: "M16 9a5 5 0 0 1 0 6", key: "1q6k2b" }],
  ["path", { d: "M19.364 18.364a9 9 0 0 0 0-12.728", key: "ijwkga" }]
];
const Volume2 = createLucideIcon("volume-2", __iconNode$1);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode = [
  [
    "path",
    {
      d: "m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72",
      key: "ul74o6"
    }
  ],
  ["path", { d: "m14 7 3 3", key: "1r5n42" }],
  ["path", { d: "M5 6v4", key: "ilb8ba" }],
  ["path", { d: "M19 14v4", key: "blhpug" }],
  ["path", { d: "M10 2v2", key: "7u0qdc" }],
  ["path", { d: "M7 8H3", key: "zfb6yr" }],
  ["path", { d: "M21 16h-4", key: "1cnmox" }],
  ["path", { d: "M11 3H9", key: "1obp7u" }]
];
const WandSparkles = createLucideIcon("wand-sparkles", __iconNode);
const defaultToolCategories = [
  // { id: 'templates', name: 'Templates', icon: 'Plus', description: 'Start from a project template' },
  // { id: 'record', name: 'Record', icon: 'Upload', description: 'Record screen and import clip' },
  { id: "video", name: "Video", icon: "Video", description: "Add a video element" },
  { id: "image", name: "Image", icon: "Image", description: "Add an image element" },
  { id: "audio", name: "Audio", icon: "Audio", description: "Add an audio element" },
  { id: "text", name: "Text", icon: "Type", description: "Add text elements" },
  { id: "text-style", name: "Text Style", icon: "Type", description: "Apply text style presets" },
  { id: "effect", name: "Effect", icon: "Wand2", description: "Apply GL video effects" },
  { id: "shape", name: "Shape", icon: "Square", description: "Add lines, arrows, boxes, and circles" },
  // { id: 'chapters', name: 'Chapters', icon: 'File', description: 'Manage chapter markers' },
  // { id: 'script', name: 'Script', icon: 'Type', description: 'Build timeline from a script outline' },
  { id: "caption", name: "Subtitles", icon: "MessageSquare", description: "Manage subtitles" }
];
const getIcon = (iconName) => {
  switch (iconName) {
    case "Plus":
      return Plus;
    case "Type":
      return Type;
    case "Upload":
      return Upload;
    case "Square":
      return Square;
    case "Image":
      return Image;
    case "Video":
      return Video;
    case "Audio":
      return Music;
    case "Circle":
      return Circle;
    case "Rect":
      return Square;
    case "MessageSquare":
      return MessageSquare;
    case "Wand2":
      return WandSparkles;
    case "File":
      return File;
    default:
      return Plus;
  }
};
function Toolbar({
  selectedTool,
  setSelectedTool,
  customTools = [],
  hiddenTools = []
}) {
  const mergedTools = [...defaultToolCategories, ...customTools].filter(
    (tool) => !hiddenTools.includes(tool.id)
  );
  const handleToolSelect = (toolId) => {
    setSelectedTool(toolId);
  };
  return /* @__PURE__ */ jsx("div", { className: "sidebar", children: mergedTools.map((tool) => {
    const Icon2 = getIcon(tool.icon);
    const isSelected = selectedTool === tool.id;
    const tooltipText = `${tool.name}${tool.shortcut ? ` (${tool.shortcut})` : ""}`;
    return /* @__PURE__ */ jsxs(
      "div",
      {
        onClick: () => handleToolSelect(tool.id),
        className: `toolbar-btn ${isSelected ? "active" : ""}`,
        title: tooltipText,
        "data-tooltip": tooltipText,
        children: [
          /* @__PURE__ */ jsx(Icon2, { className: "icon-sm" }),
          /* @__PURE__ */ jsx("span", { className: "toolbar-label", children: tool.name })
        ]
      },
      tool.id
    );
  }) });
}
const StudioHeader = ({
  setVideoResolution,
  onNewProject,
  onLoadProject,
  onSaveProject,
  onExportVideo
}) => {
  const [orientation, setOrientation] = useState(
    "vertical"
  );
  useEffect(() => {
    const orientation2 = localStorage.getItem("orientation");
    if (orientation2) {
      setOrientation(orientation2);
    }
  }, []);
  const handleOrientationChange = (nextOrientation) => {
    if (nextOrientation === orientation) return;
    const confirmMessage = "Changing orientation will create a new project with the new resolution. Do you want to continue?";
    if (!window.confirm(confirmMessage)) {
      return;
    }
    onNewProject();
    setOrientation(nextOrientation);
  };
  useEffect(() => {
    if (orientation === "horizontal") {
      localStorage.setItem("orientation", "horizontal");
      setVideoResolution({ width: 1280, height: 720 });
    } else {
      localStorage.setItem("orientation", "vertical");
      setVideoResolution({ width: 720, height: 1280 });
    }
  }, [orientation]);
  return /* @__PURE__ */ jsxs("header", { className: "header", children: [
    /* @__PURE__ */ jsx("div", { className: "flex-container", children: /* @__PURE__ */ jsxs("div", { className: "flex-container", style: { gap: "0.5rem" }, children: [
      /* @__PURE__ */ jsx("span", { className: "text-sm opacity-80", children: "Orientation" }),
      /* @__PURE__ */ jsx(
        "button",
        {
          className: `btn-ghost ${orientation === "vertical" ? "btn-primary" : ""}`,
          title: "Portrait (720×1280)",
          onClick: () => handleOrientationChange("vertical"),
          children: /* @__PURE__ */ jsx(RectangleVertical, { className: "icon-sm" })
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          className: `btn-ghost ${orientation === "horizontal" ? "btn-primary" : ""}`,
          title: "Landscape (1280×720)",
          onClick: () => handleOrientationChange("horizontal"),
          children: /* @__PURE__ */ jsx(RectangleHorizontal, { className: "icon-sm" })
        }
      )
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "flex-container", children: [
      /* @__PURE__ */ jsxs(
        "button",
        {
          className: "btn-ghost",
          title: "New Project",
          onClick: onNewProject,
          children: [
            /* @__PURE__ */ jsx(Plus, { className: "icon-sm" }),
            "New Project"
          ]
        }
      ),
      /* @__PURE__ */ jsxs(
        "button",
        {
          className: "btn-ghost",
          title: "Load Project",
          onClick: onLoadProject,
          children: [
            /* @__PURE__ */ jsx(File, { className: "icon-sm" }),
            "Load Project"
          ]
        }
      ),
      /* @__PURE__ */ jsxs(
        "button",
        {
          className: "btn-ghost",
          title: "Save Draft",
          onClick: onSaveProject,
          children: [
            /* @__PURE__ */ jsx(Save, { className: "icon-sm" }),
            "Save Draft"
          ]
        }
      ),
      /* @__PURE__ */ jsxs(
        "button",
        {
          className: "btn-primary",
          title: "Export",
          onClick: onExportVideo,
          children: [
            /* @__PURE__ */ jsx(Download, { className: "icon-sm" }),
            "Export"
          ]
        }
      )
    ] })
  ] });
};
const SHAPES_TOOLS = ["rect", "circle", "line", "arrow"];
const useStudioManager = () => {
  const [selectedProp, setSelectedProp] = useState("element-props");
  const { selectedItem } = useTimelineContext();
  const { addElement, updateElement } = useEditorManager();
  const selectedElement = selectedItem instanceof TrackElement ? selectedItem : null;
  const [selectedTool, setSelectedTool] = useState("none");
  const isToolChanged = useRef(false);
  useEffect(() => {
    if (selectedItem instanceof TrackElement) {
      const elementType = selectedItem.getType();
      if (SHAPES_TOOLS.includes(elementType)) {
        setSelectedTool("shape");
      } else {
        setSelectedTool(selectedItem.getType());
      }
      isToolChanged.current = true;
    } else if (selectedItem instanceof Track) ;
    else {
      setSelectedTool("video");
    }
  }, [selectedItem]);
  return {
    selectedProp,
    setSelectedProp,
    selectedTool,
    setSelectedTool,
    selectedElement,
    addElement,
    updateElement
  };
};
const putFileWithProgress = (uploadUrl, file, onProgress) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        onProgress(e.loaded / e.total * 100);
      }
    });
    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(100);
        resolve();
      } else {
        reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
      }
    });
    xhr.addEventListener("error", () => reject(new Error("Upload failed")));
    xhr.addEventListener("abort", () => reject(new Error("Upload aborted")));
    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.send(file);
  });
};
const useCloudMediaUpload = (config) => {
  const { uploadApiUrl, provider } = config;
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const resetError = useCallback(() => {
    setError(null);
  }, []);
  const uploadFile = useCallback(
    async (file) => {
      setIsUploading(true);
      setProgress(0);
      setError(null);
      try {
        if (provider === "s3") {
          const presignRes = await fetch(uploadApiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              filename: file.name,
              contentType: file.type || "application/octet-stream"
            })
          });
          if (!presignRes.ok) {
            const errBody = await presignRes.json().catch(() => ({}));
            throw new Error(
              errBody.error ?? `Failed to get upload URL: ${presignRes.statusText}`
            );
          }
          const presignData = await presignRes.json();
          const uploadUrl = presignData.uploadUrl;
          await putFileWithProgress(uploadUrl, file, setProgress);
          const publicUrl = uploadUrl.split("?")[0];
          return { url: publicUrl };
        }
        if (provider === "gcs") {
          setProgress(10);
          const formData = new FormData();
          formData.append("file", file);
          const uploadRes = await fetch(uploadApiUrl, {
            method: "POST",
            body: formData
          });
          if (!uploadRes.ok) {
            const errBody = await uploadRes.json().catch(() => ({}));
            throw new Error(
              errBody.error ?? `Upload failed: ${uploadRes.statusText}`
            );
          }
          setProgress(100);
          const data = await uploadRes.json();
          if (!data.url) {
            throw new Error("Upload response missing url");
          }
          return { url: data.url };
        }
        throw new Error(`Unknown provider: ${provider}`);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Upload failed";
        setError(message);
        throw err;
      } finally {
        setIsUploading(false);
        setProgress(0);
      }
    },
    [uploadApiUrl, provider]
  );
  return {
    uploadFile,
    isUploading,
    progress,
    error,
    resetError
  };
};
const CloudMediaUpload = ({
  onSuccess,
  onError,
  accept,
  uploadApiUrl,
  provider,
  buttonText = "Upload to cloud",
  className,
  disabled = false,
  id: providedId,
  icon
}) => {
  const id = providedId ?? `cloud-media-upload-${Math.random().toString(36).slice(2, 9)}`;
  const inputRef = useRef(null);
  const {
    uploadFile,
    isUploading,
    progress,
    error,
    resetError
  } = useCloudMediaUpload({ uploadApiUrl, provider });
  const handleFileChange = async (e) => {
    var _a;
    const file = (_a = e.target.files) == null ? void 0 : _a[0];
    if (!file) return;
    try {
      const { url } = await uploadFile(file);
      onSuccess(url, file);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      onError == null ? void 0 : onError(message);
    }
  };
  const handleLabelClick = () => {
    if (disabled || isUploading) return;
    resetError();
  };
  return /* @__PURE__ */ jsxs("div", { className: "file-input-container cloud-media-upload-container", children: [
    /* @__PURE__ */ jsx(
      "input",
      {
        ref: inputRef,
        type: "file",
        accept,
        className: "file-input-hidden",
        id,
        onChange: handleFileChange,
        disabled: disabled || isUploading,
        "aria-label": buttonText
      }
    ),
    /* @__PURE__ */ jsxs(
      "label",
      {
        htmlFor: id,
        className: className ?? "btn-primary file-input-label",
        onClick: handleLabelClick,
        style: { pointerEvents: disabled || isUploading ? "none" : void 0 },
        children: [
          icon ?? /* @__PURE__ */ jsx(Upload, { className: "icon-sm" }),
          isUploading ? `${Math.round(progress)}%` : buttonText
        ]
      }
    ),
    isUploading && /* @__PURE__ */ jsx("div", { className: "cloud-media-upload-progress", role: "progressbar", "aria-valuenow": progress, "aria-valuemin": 0, "aria-valuemax": 100, children: /* @__PURE__ */ jsx(
      "div",
      {
        className: "cloud-media-upload-progress-fill",
        style: { width: `${progress}%` }
      }
    ) }),
    error && /* @__PURE__ */ jsx("div", { className: "cloud-media-upload-error", role: "alert", children: error })
  ] });
};
const _MediaManagerSingleton = class _MediaManagerSingleton {
  constructor() {
  }
  static getInstance() {
    if (!_MediaManagerSingleton.instance) {
      _MediaManagerSingleton.instance = new BrowserMediaManager();
    }
    return _MediaManagerSingleton.instance;
  }
  static async initializeDefaults() {
    if (_MediaManagerSingleton.isInitialized) {
      return;
    }
    if (_MediaManagerSingleton.initializationPromise) {
      await _MediaManagerSingleton.initializationPromise;
      return;
    }
    let resolvePromise;
    let rejectPromise;
    _MediaManagerSingleton.initializationPromise = new Promise((resolve, reject) => {
      resolvePromise = resolve;
      rejectPromise = reject;
    });
    (async () => {
      try {
        await _MediaManagerSingleton.doInitializeDefaults();
        _MediaManagerSingleton.isInitialized = true;
        resolvePromise();
      } catch (error) {
        _MediaManagerSingleton.initializationPromise = null;
        rejectPromise(error);
      }
    })();
    return _MediaManagerSingleton.initializationPromise;
  }
  static async doInitializeDefaults() {
    const manager = _MediaManagerSingleton.getInstance();
    const defaultVideos = [
      {
        name: "Mountain Road",
        url: "https://videos.pexels.com/video-files/31708803/13510402_1080_1920_30fps.mp4",
        type: "video",
        metadata: {
          name: "Mountain Road",
          source: "pexels"
        }
      },
      {
        name: "Vase",
        url: "https://videos.pexels.com/video-files/4622990/4622990-uhd_1440_2560_30fps.mp4",
        type: "video",
        metadata: {
          name: "Vase",
          source: "pexels"
        }
      }
    ];
    const defaultImages = [
      {
        name: "Mountain Road",
        url: "https://images.pexels.com/photos/1955134/pexels-photo-1955134.jpeg",
        type: "image",
        metadata: {
          name: "Mountain Road",
          source: "pexels"
        }
      },
      {
        name: "Waterfall",
        url: "https://images.pexels.com/photos/358457/pexels-photo-358457.jpeg",
        type: "image",
        metadata: {
          name: "Waterfall",
          source: "pexels"
        }
      }
    ];
    const defaultAudios = [
      {
        name: "Audio 1",
        url: "https://cdn.pixabay.com/audio/2022/03/14/audio_782eeb590e.mp3",
        type: "audio",
        metadata: {
          name: "Audio 1",
          source: "pixabay"
        }
      },
      {
        name: "Audio 2",
        url: "https://cdn.pixabay.com/audio/2025/01/24/audio_24048c78b6.mp3",
        type: "audio",
        metadata: {
          name: "Audio 2",
          source: "pixabay"
        }
      }
    ];
    try {
      const existingVideos = await manager.search({
        type: "video",
        query: ""
      });
      const existingVideoUrls = new Set(existingVideos.map((v) => v.url));
      const videosToAdd = defaultVideos.filter(
        (video) => !existingVideoUrls.has(video.url)
      );
      if (videosToAdd.length > 0) {
        const finalCheck = await manager.search({
          type: "video",
          query: ""
        });
        const finalVideoUrls = new Set(finalCheck.map((v) => v.url));
        const finalVideosToAdd = videosToAdd.filter(
          (video) => !finalVideoUrls.has(video.url)
        );
        if (finalVideosToAdd.length > 0) {
          await manager.addItems(finalVideosToAdd);
        }
      }
      const existingImages = await manager.search({
        type: "image",
        query: ""
      });
      const existingImageUrls = new Set(existingImages.map((img) => img.url));
      const imagesToAdd = defaultImages.filter(
        (image) => !existingImageUrls.has(image.url)
      );
      if (imagesToAdd.length > 0) {
        const finalCheck = await manager.search({
          type: "image",
          query: ""
        });
        const finalImageUrls = new Set(finalCheck.map((img) => img.url));
        const finalImagesToAdd = imagesToAdd.filter(
          (image) => !finalImageUrls.has(image.url)
        );
        if (finalImagesToAdd.length > 0) {
          await manager.addItems(finalImagesToAdd);
        }
      }
      const existingAudios = await manager.search({
        type: "audio",
        query: ""
      });
      const existingAudioUrls = new Set(existingAudios.map((a) => a.url));
      const audiosToAdd = defaultAudios.filter(
        (audio) => !existingAudioUrls.has(audio.url)
      );
      if (audiosToAdd.length > 0) {
        const finalCheck = await manager.search({
          type: "audio",
          query: ""
        });
        const finalAudioUrls = new Set(finalCheck.map((a) => a.url));
        const finalAudiosToAdd = audiosToAdd.filter(
          (audio) => !finalAudioUrls.has(audio.url)
        );
        if (finalAudiosToAdd.length > 0) {
          await manager.addItems(finalAudiosToAdd);
        }
      }
    } catch (error) {
      throw error;
    }
  }
};
__publicField(_MediaManagerSingleton, "instance", null);
__publicField(_MediaManagerSingleton, "initializationPromise", null);
__publicField(_MediaManagerSingleton, "isInitialized", false);
let MediaManagerSingleton = _MediaManagerSingleton;
const getMediaManager = () => MediaManagerSingleton.getInstance();
const initializeDefaultVideos = () => MediaManagerSingleton.initializeDefaults();
const EXTENSIONS = {
  video: ["mp4", "webm", "ogg", "mov", "mkv", "m3u8"],
  audio: ["mp3", "wav", "ogg", "m4a", "aac", "flac"],
  image: ["jpg", "jpeg", "png", "gif", "webp", "svg"]
};
function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
function matchesType(url, type) {
  const pathname = (() => {
    try {
      return new URL(url).pathname.toLowerCase();
    } catch {
      return url.toLowerCase();
    }
  })();
  const ext = pathname.split(".").pop() || "";
  return EXTENSIONS[type].includes(ext);
}
function UrlInput({
  type,
  onSubmit
}) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const tryAdd = async () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    if (!isValidUrl(trimmed)) {
      setError("Enter a valid URL");
      return;
    }
    if (!matchesType(trimmed, type)) {
      setError(`URL must be a ${type} (${EXTENSIONS[type].join(", ")})`);
      return;
    }
    setError("");
    onSubmit(trimmed);
    setUrl("");
  };
  const onKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      void tryAdd();
    }
  };
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsxs("div", { className: "flex-container", children: [
      /* @__PURE__ */ jsx(
        "input",
        {
          type: "url",
          placeholder: `Paste ${type} URL...`,
          value: url,
          onChange: (e) => setUrl(e.target.value),
          onKeyDown,
          className: "input w-full"
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          className: "btn-ghost",
          onClick: () => void tryAdd(),
          "aria-label": `Add ${type} by URL`,
          children: /* @__PURE__ */ jsx(Plus, { size: 16 })
        }
      )
    ] }),
    error ? /* @__PURE__ */ jsx("span", { className: "text-error", children: error }) : null
  ] });
}
const initialMediaState = {
  items: [],
  searchQuery: "",
  isLoading: false
};
const MediaContext = createContext(null);
function MediaProvider({ children }) {
  const [videoState, setVideoState] = useState(initialMediaState);
  const [audioState, setAudioState] = useState(initialMediaState);
  const [imageState, setImageState] = useState(initialMediaState);
  const mediaManager = getMediaManager();
  const getStateAndSetter = (type) => {
    switch (type) {
      case "video":
        return [videoState, setVideoState];
      case "audio":
        return [audioState, setAudioState];
      case "image":
        return [imageState, setImageState];
    }
  };
  const loadItems = async (type, query) => {
    const [state, setState] = getStateAndSetter(type);
    setState({ ...state, isLoading: true });
    try {
      const results = await mediaManager.search({
        query,
        type
      });
      setState({
        items: results,
        searchQuery: query,
        isLoading: false
      });
    } catch (error) {
      console.error(`Error loading ${type} items:`, error);
      setState({
        ...state,
        isLoading: false
      });
    }
  };
  useEffect(() => {
    const initialize = async () => {
      await initializeDefaultVideos();
      loadItems("video", "");
      loadItems("audio", "");
      loadItems("image", "");
    };
    initialize();
  }, []);
  const setSearchQuery = (type, query) => {
    const [state, setState] = getStateAndSetter(type);
    setState({ ...state, searchQuery: query });
    loadItems(type, query);
  };
  const addItem = (type, newItem) => {
    const [state, setState] = getStateAndSetter(type);
    setState({
      ...state,
      items: [...state.items, newItem]
    });
  };
  return /* @__PURE__ */ jsx(
    MediaContext.Provider,
    {
      value: {
        videoState,
        audioState,
        imageState,
        setSearchQuery,
        addItem
      },
      children
    }
  );
}
function useMedia(type) {
  const context = useContext(MediaContext);
  if (!context) {
    throw new Error("useMedia must be used within a MediaProvider");
  }
  const state = context[`${type}State`];
  return {
    items: state.items,
    searchQuery: state.searchQuery,
    isLoading: state.isLoading,
    setSearchQuery: (query) => context.setSearchQuery(type, query),
    addItem: (item) => context.addItem(type, item)
  };
}
const mediaConfigs = {
  video: {
    acceptFileTypes: ["video/*"],
    createElement: (url, parentSize) => new VideoElement(url, parentSize),
    updateElement: async (element, url) => {
      if (element instanceof VideoElement) {
        element.setSrc(url);
        await element.updateVideoMeta();
      }
    }
  },
  audio: {
    acceptFileTypes: ["audio/*"],
    createElement: (url, _parentSize) => new AudioElement(url),
    updateElement: async (element, url) => {
      if (element instanceof AudioElement) {
        element.setSrc(url);
        await element.updateAudioMeta();
      }
    }
  },
  image: {
    acceptFileTypes: ["image/*"],
    createElement: (url, parentSize) => new ImageElement(url, parentSize),
    updateElement: async (element, url) => {
      if (element instanceof ImageElement) {
        element.setSrc(url);
        await element.updateImageMeta();
      }
    }
  }
};
const useMediaPanel = (type, {
  selectedElement,
  addElement,
  updateElement
}, videoResolution) => {
  const { items, searchQuery, setSearchQuery, addItem, isLoading } = useMedia(type);
  const mediaManager = getMediaManager();
  const handleSelection = async (item, forceAdd) => {
    const config2 = mediaConfigs[type];
    if (forceAdd) {
      const element = config2.createElement(item.url, videoResolution);
      addElement(element);
    } else {
      if (selectedElement) {
        await config2.updateElement(selectedElement, item.url);
        updateElement(selectedElement);
      } else {
        const element = config2.createElement(item.url, videoResolution);
        addElement(element);
      }
    }
  };
  const handleFileUpload = async (fileData) => {
    const arrayBuffer = await fileData.file.arrayBuffer();
    const newItem = await mediaManager.addItem({
      name: fileData.file.name,
      url: fileData.blobUrl,
      type,
      arrayBuffer,
      metadata: {
        name: fileData.file.name,
        size: fileData.file.size,
        type: fileData.file.type
      }
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
    acceptFileTypes: config.acceptFileTypes
  };
};
const useAudioPreview = () => {
  const [playingAudio, setPlayingAudio] = useState(null);
  const audioRef = useRef(null);
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);
  const stopPlayback = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPlayingAudio(null);
  }, []);
  const togglePlayPause = useCallback((item) => {
    if (playingAudio === item.id) {
      stopPlayback();
      return;
    }
    stopPlayback();
    const audio = new Audio(item.url);
    audio.addEventListener("ended", stopPlayback);
    audio.play();
    audioRef.current = audio;
    setPlayingAudio(item.id);
  }, [playingAudio, stopPlayback]);
  return {
    playingAudio,
    audioElement: audioRef.current,
    togglePlayPause,
    stopPlayback
  };
};
const AudioPanel = ({
  items,
  onItemSelect,
  onUrlAdd,
  isLoading,
  canLoadMore,
  onLoadMore
}) => {
  const { playingAudio, togglePlayPause } = useAudioPreview();
  return /* @__PURE__ */ jsxs("div", { className: "panel-container", children: [
    /* @__PURE__ */ jsx("div", { className: "panel-title", children: "Audio Library" }),
    /* @__PURE__ */ jsx("div", { className: "panel-section", children: /* @__PURE__ */ jsx(UrlInput, { type: "audio", onSubmit: onUrlAdd }) }),
    /* @__PURE__ */ jsxs("div", { className: "media-content", children: [
      /* @__PURE__ */ jsx("div", { className: "media-list", children: (items || []).map((item) => {
        var _a, _b;
        return /* @__PURE__ */ jsx(
          "div",
          {
            draggable: true,
            onDoubleClick: () => onItemSelect(item),
            onDragStart: (e) => {
              e.dataTransfer.setData(
                TIMELINE_DROP_MEDIA_TYPE,
                JSON.stringify({ type: "audio", url: item.url })
              );
              e.dataTransfer.effectAllowed = "copy";
            },
            className: "media-list-item media-item-draggable",
            children: /* @__PURE__ */ jsxs("div", { className: "media-list-content", children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: (e) => {
                    e.stopPropagation();
                    togglePlayPause(item);
                  },
                  className: "media-action-btn",
                  children: playingAudio === item.id ? /* @__PURE__ */ jsx(Pause, { className: "icon-sm" }) : /* @__PURE__ */ jsx(Play, { className: "icon-sm" })
                }
              ),
              /* @__PURE__ */ jsx("div", { className: `media-list-icon ${playingAudio === item.id ? "active" : ""}`, children: /* @__PURE__ */ jsx(Volume2, { className: "icon-sm" }) }),
              /* @__PURE__ */ jsx("div", { className: "media-list-title", children: ((_a = item.metadata) == null ? void 0 : _a.title) || ((_b = item.metadata) == null ? void 0 : _b.name) }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: (e) => {
                    e.stopPropagation();
                    onItemSelect(item, true);
                  },
                  className: "media-action-btn",
                  children: /* @__PURE__ */ jsx(Plus, { className: "icon-sm" })
                }
              )
            ] })
          },
          item.id
        );
      }) }),
      items.length === 0 && /* @__PURE__ */ jsx("div", { className: "empty-state", children: /* @__PURE__ */ jsxs("div", { className: "empty-state-content", children: [
        /* @__PURE__ */ jsx(WandSparkles, { className: "empty-state-icon" }),
        /* @__PURE__ */ jsx("p", { className: "empty-state-text", children: "No audio files found" })
      ] }) }),
      onLoadMore && canLoadMore && /* @__PURE__ */ jsx("div", { className: "panel-section", children: /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          className: "btn-ghost w-full",
          onClick: onLoadMore,
          disabled: isLoading,
          children: isLoading ? "Loading..." : "Load more"
        }
      ) })
    ] })
  ] });
};
const SearchInput = ({
  searchQuery,
  setSearchQuery
}) => {
  return /* @__PURE__ */ jsxs("div", { className: "search-container", children: [
    /* @__PURE__ */ jsx(
      "input",
      {
        type: "text",
        placeholder: "Search media...",
        value: searchQuery,
        onChange: (e) => setSearchQuery(e.target.value),
        className: "input search-input w-full"
      }
    ),
    /* @__PURE__ */ jsx(Search, { className: "search-icon" })
  ] });
};
const DEFAULT_PAGE_SIZE = 50;
async function listUserAssets(params) {
  const mediaManager = getMediaManager();
  const all = await mediaManager.search({
    query: params.query,
    type: params.type
  });
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  return {
    items: all.slice(start, end),
    page,
    pageSize,
    total: all.length
  };
}
async function listPublicAssets(params) {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;
  const searchParams = new URLSearchParams();
  searchParams.set("source", "public");
  if (params.type) searchParams.set("type", params.type);
  if (params.query) searchParams.set("query", params.query);
  if (params.provider) searchParams.set("provider", params.provider);
  searchParams.set("page", String(page));
  searchParams.set("pageSize", String(pageSize));
  const res = await fetch(`/api/assets/search?${searchParams.toString()}`);
  if (!res.ok) {
    throw new Error(`Failed to search public assets (${res.status})`);
  }
  const data = await res.json();
  const items = (data.items || []).map((asset) => ({
    id: asset.id,
    name: asset.name,
    type: asset.type,
    url: asset.url,
    previewUrl: asset.previewUrl,
    thumbnail: asset.previewUrl ?? asset.thumbnail,
    waveformUrl: asset.waveformUrl,
    duration: asset.duration,
    width: asset.width,
    height: asset.height,
    sizeBytes: asset.sizeBytes,
    source: asset.source,
    origin: asset.origin,
    provider: asset.provider,
    providerId: asset.providerId,
    providerUrl: asset.providerUrl,
    attribution: asset.attribution,
    tags: asset.tags,
    metadata: asset.metadata
  }));
  return {
    items,
    page: data.page ?? page,
    pageSize: data.pageSize ?? pageSize,
    total: data.total ?? items.length
  };
}
const studioAssetLibrary = {
  async listAssets(params) {
    if (params.source === "user") {
      return listUserAssets(params);
    }
    return listPublicAssets(params);
  },
  async getAsset(id) {
    const mediaManager = getMediaManager();
    const item = await mediaManager.getItem(id);
    return item ?? null;
  },
  async uploadAsset(file, options) {
    const mediaManager = getMediaManager();
    const arrayBuffer = await file.arrayBuffer();
    const type = (options == null ? void 0 : options.type) ?? file.type.split("/")[0];
    const item = await mediaManager.addItem({
      name: file.name,
      url: URL.createObjectURL(new Blob([arrayBuffer], { type: file.type })),
      type,
      arrayBuffer,
      metadata: {
        ...(options == null ? void 0 : options.metadata) ?? {},
        name: file.name,
        size: file.size,
        type: file.type,
        source: "upload"
      }
    });
    return item;
  },
  async deleteAsset(id) {
    const mediaManager = getMediaManager();
    await mediaManager.deleteItem(id);
  },
  async listPublicProviders() {
    const res = await fetch("/api/assets/providers/config");
    if (!res.ok) {
      throw new Error(`Failed to load asset providers (${res.status})`);
    }
    const data = await res.json();
    return data.providers ?? [];
  }
};
const getAssetLibrary = () => studioAssetLibrary;
const AudioPanelContainer = (props) => {
  const [activeSource, setActiveSource] = useState("user");
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("div", { className: "panel-section", children: /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          className: `btn-ghost w-full ${activeSource === "user" ? "btn-primary" : ""}`,
          onClick: () => setActiveSource("user"),
          children: "My assets"
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          className: `btn-ghost w-full ${activeSource === "public" ? "btn-primary" : ""}`,
          onClick: () => setActiveSource("public"),
          children: "Public"
        }
      )
    ] }) }),
    activeSource === "user" ? /* @__PURE__ */ jsx(AudioUserAssetsSection, { ...props }) : /* @__PURE__ */ jsx(AudioPublicAssetsSection, {})
  ] });
};
function AudioUserAssetsSection(props) {
  const { addItem } = useMedia("audio");
  const mediaManager = getMediaManager();
  const {
    items,
    searchQuery,
    setSearchQuery,
    handleSelection,
    handleFileUpload,
    isLoading,
    acceptFileTypes
  } = useMediaPanel(
    "audio",
    {
      selectedElement: props.selectedElement ?? null,
      addElement: props.addElement,
      updateElement: props.updateElement
    },
    props.videoResolution
  );
  const onUrlAdd = async (url) => {
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
      metadata: { source: "url" }
    });
    addItem(newItem);
  };
  const onCloudUploadSuccess = async (url, file) => {
    var _a;
    const newItem = await mediaManager.addItem({
      name: file.name,
      url,
      type: "audio",
      metadata: { source: ((_a = props.uploadConfig) == null ? void 0 : _a.provider) ?? "s3" }
    });
    addItem(newItem);
  };
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    props.uploadConfig && /* @__PURE__ */ jsx("div", { className: "flex panel-section", children: /* @__PURE__ */ jsx(
      CloudMediaUpload,
      {
        uploadApiUrl: props.uploadConfig.uploadApiUrl,
        provider: props.uploadConfig.provider,
        accept: "audio/*",
        onSuccess: onCloudUploadSuccess,
        buttonText: "Upload audio",
        className: "btn-ghost w-full"
      }
    ) }),
    /* @__PURE__ */ jsx(
      AudioPanel,
      {
        items,
        searchQuery,
        onSearchChange: setSearchQuery,
        onItemSelect: handleSelection,
        onFileUpload: handleFileUpload,
        isLoading,
        acceptFileTypes,
        onUrlAdd
      }
    )
  ] });
}
function AudioPublicAssetsSection() {
  const assetLibrary = getAssetLibrary();
  const [providerConfigs, setProviderConfigs] = useState(
    []
  );
  const [activeProviderId, setActiveProviderId] = useState(
    "all"
  );
  const [publicItems, setPublicItems] = useState([]);
  const [publicSearchQuery, setPublicSearchQuery] = useState("");
  const [isPublicLoading, setIsPublicLoading] = useState(false);
  useEffect(() => {
    const loadProviders = async () => {
      try {
        const configs = await assetLibrary.listPublicProviders();
        setProviderConfigs(
          configs.filter((c) => {
            var _a;
            return (_a = c.supportedTypes) == null ? void 0 : _a.includes("audio");
          })
        );
      } catch (err) {
        console.error("Failed to load asset providers", err);
      }
    };
    void loadProviders();
  }, [assetLibrary]);
  const loadPublicAssets = async (query) => {
    setIsPublicLoading(true);
    try {
      const result = await assetLibrary.listAssets({
        source: "public",
        type: "audio",
        query,
        provider: activeProviderId === "all" ? void 0 : activeProviderId
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
    () => throttle(loadPublicAssets, 1e3),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [assetLibrary, activeProviderId]
  );
  useEffect(() => {
    if (publicSearchQuery) {
      void throttledLoadPublicAssets(publicSearchQuery);
    }
  }, [activeProviderId, publicSearchQuery]);
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs("div", { className: "panel-section", children: [
      /* @__PURE__ */ jsxs("div", { className: "property-row", children: [
        /* @__PURE__ */ jsx("div", { className: "property-row-label", children: /* @__PURE__ */ jsx("span", { className: "property-label", children: "Provider" }) }),
        /* @__PURE__ */ jsx("div", { className: "property-row-control", children: /* @__PURE__ */ jsxs(
          "select",
          {
            className: "select-dark",
            value: activeProviderId,
            onChange: (e) => setActiveProviderId(e.target.value),
            children: [
              /* @__PURE__ */ jsx("option", { value: "all", children: "All providers" }),
              providerConfigs.filter((p) => p.enabled).map((p) => /* @__PURE__ */ jsx("option", { value: p.id, children: p.label }, p.id))
            ]
          }
        ) })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "property-row-control", children: /* @__PURE__ */ jsx(
        SearchInput,
        {
          searchQuery: publicSearchQuery,
          setSearchQuery: (q) => {
            setPublicSearchQuery(q);
          }
        }
      ) })
    ] }),
    /* @__PURE__ */ jsx(
      AudioPanel,
      {
        items: publicItems,
        searchQuery: publicSearchQuery,
        onSearchChange: setPublicSearchQuery,
        onItemSelect: () => {
        },
        onFileUpload: () => {
        },
        isLoading: isPublicLoading,
        acceptFileTypes: [],
        onUrlAdd: () => {
        }
      }
    )
  ] });
}
function ImagePanel({
  items,
  onItemSelect,
  onUrlAdd,
  isLoading,
  canLoadMore,
  onLoadMore,
  showAddByUrl = true
}) {
  return /* @__PURE__ */ jsxs("div", { className: "panel-container", children: [
    /* @__PURE__ */ jsx("div", { className: "panel-title", children: "Image Library" }),
    showAddByUrl && /* @__PURE__ */ jsx("div", { className: "panel-section", children: /* @__PURE__ */ jsx(UrlInput, { type: "image", onSubmit: onUrlAdd }) }),
    /* @__PURE__ */ jsxs("div", { className: "media-content", children: [
      /* @__PURE__ */ jsx("div", { className: "media-grid", children: (items || []).map((item) => /* @__PURE__ */ jsxs(
        "div",
        {
          draggable: true,
          onDoubleClick: () => onItemSelect(item),
          onDragStart: (e) => {
            e.dataTransfer.setData(
              TIMELINE_DROP_MEDIA_TYPE,
              JSON.stringify({ type: "image", url: item.url })
            );
            e.dataTransfer.effectAllowed = "copy";
          },
          className: "media-item media-item-draggable",
          children: [
            /* @__PURE__ */ jsx("img", { src: item.url, alt: "", className: "media-item-content" }),
            /* @__PURE__ */ jsx("div", { className: "media-actions media-actions-corner", children: /* @__PURE__ */ jsx(
              "button",
              {
                onClick: (e) => {
                  e.stopPropagation();
                  onItemSelect(item, true);
                },
                className: "media-action-btn",
                children: /* @__PURE__ */ jsx(Plus, { className: "icon-sm" })
              }
            ) })
          ]
        },
        item.id
      )) }),
      items.length === 0 && /* @__PURE__ */ jsx("div", { className: "empty-state", children: /* @__PURE__ */ jsxs("div", { className: "empty-state-content", children: [
        /* @__PURE__ */ jsx(WandSparkles, { className: "empty-state-icon" }),
        /* @__PURE__ */ jsx("p", { className: "empty-state-text", children: "No images found" })
      ] }) }),
      onLoadMore && canLoadMore && /* @__PURE__ */ jsx("div", { className: "panel-section", children: /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          className: "btn-ghost w-full",
          onClick: onLoadMore,
          disabled: isLoading,
          children: isLoading ? "Loading..." : "Load more"
        }
      ) })
    ] })
  ] });
}
function ImagePanelContainer(props) {
  const [activeSource, setActiveSource] = useState("user");
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("div", { className: "panel-section", children: /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          className: `btn-ghost w-full ${activeSource === "user" ? "btn-primary" : ""}`,
          onClick: () => setActiveSource("user"),
          children: "My assets"
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          className: `btn-ghost w-full ${activeSource === "public" ? "btn-primary" : ""}`,
          onClick: () => setActiveSource("public"),
          children: "Public"
        }
      )
    ] }) }),
    activeSource === "user" ? /* @__PURE__ */ jsx(ImageUserAssetsSection, { ...props }) : /* @__PURE__ */ jsx(ImagePublicAssetsSection, {})
  ] });
}
function ImageUserAssetsSection(props) {
  const { addItem } = useMedia("image");
  const mediaManager = getMediaManager();
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 30;
  const {
    items,
    searchQuery,
    setSearchQuery,
    handleSelection,
    handleFileUpload,
    isLoading,
    acceptFileTypes
  } = useMediaPanel(
    "image",
    {
      selectedElement: props.selectedElement ?? null,
      addElement: props.addElement,
      updateElement: props.updateElement
    },
    props.videoResolution
  );
  const onUrlAdd = async (url) => {
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
      type: "image",
      metadata: { source: "url" }
    });
    addItem(newItem);
  };
  const onCloudUploadSuccess = async (url, file) => {
    var _a;
    const newItem = await mediaManager.addItem({
      name: file.name,
      url,
      type: "image",
      metadata: { source: ((_a = props.uploadConfig) == null ? void 0 : _a.provider) ?? "s3" }
    });
    addItem(newItem);
  };
  const visibleItems = items.slice(0, page * PAGE_SIZE);
  const canLoadMore = items.length > visibleItems.length;
  useEffect(() => {
    setPage(1);
  }, [searchQuery]);
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    props.uploadConfig && /* @__PURE__ */ jsx("div", { className: "flex panel-section", children: /* @__PURE__ */ jsx(
      CloudMediaUpload,
      {
        uploadApiUrl: props.uploadConfig.uploadApiUrl,
        provider: props.uploadConfig.provider,
        accept: "image/*",
        onSuccess: onCloudUploadSuccess,
        buttonText: "Upload image",
        className: "btn-ghost w-full"
      }
    ) }),
    /* @__PURE__ */ jsx(
      ImagePanel,
      {
        items: visibleItems,
        searchQuery,
        onSearchChange: setSearchQuery,
        onItemSelect: handleSelection,
        onFileUpload: handleFileUpload,
        isLoading,
        acceptFileTypes,
        onUrlAdd,
        canLoadMore,
        onLoadMore: () => setPage((prev) => prev + 1)
      }
    )
  ] });
}
function ImagePublicAssetsSection() {
  const assetLibrary = getAssetLibrary();
  const [providerConfigs, setProviderConfigs] = useState(
    []
  );
  const [activeProviderId, setActiveProviderId] = useState(
    "all"
  );
  const [publicItems, setPublicItems] = useState([]);
  const [publicSearchQuery, setPublicSearchQuery] = useState("nature");
  const [isPublicLoading, setIsPublicLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 20;
  useEffect(() => {
    const loadProviders = async () => {
      try {
        const configs = await assetLibrary.listPublicProviders();
        setProviderConfigs(
          configs.filter((c) => {
            var _a;
            return (_a = c.supportedTypes) == null ? void 0 : _a.includes("image");
          })
        );
      } catch (err) {
        console.error("Failed to load asset providers", err);
      }
    };
    void loadProviders();
  }, [assetLibrary]);
  const loadPublicAssets = async (query) => {
    setIsPublicLoading(true);
    try {
      const result = await assetLibrary.listAssets({
        source: "public",
        type: "image",
        query,
        provider: activeProviderId === "all" ? void 0 : activeProviderId,
        page: 1,
        pageSize: PAGE_SIZE
      });
      setPublicItems(result.items);
      setPage(1);
      setHasMore(result.items.length === PAGE_SIZE);
    } catch (err) {
      console.error("Failed to load public image assets", err);
      setPublicItems([]);
    } finally {
      setIsPublicLoading(false);
    }
  };
  const throttledLoadPublicAssets = useMemo(
    () => throttle(loadPublicAssets, 1e3),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [assetLibrary, activeProviderId]
  );
  useEffect(() => {
    if (publicSearchQuery) {
      void throttledLoadPublicAssets(publicSearchQuery);
    }
  }, [activeProviderId, publicSearchQuery]);
  const loadMore = async () => {
    if (!hasMore || isPublicLoading) return;
    const nextPage = page + 1;
    setIsPublicLoading(true);
    try {
      const result = await assetLibrary.listAssets({
        source: "public",
        type: "image",
        query: publicSearchQuery,
        provider: activeProviderId === "all" ? void 0 : activeProviderId,
        page: nextPage,
        pageSize: PAGE_SIZE
      });
      setPublicItems((prev) => [...prev, ...result.items]);
      setPage(nextPage);
      setHasMore(result.items.length === PAGE_SIZE);
    } catch (err) {
      console.error("Failed to load more public image assets", err);
    } finally {
      setIsPublicLoading(false);
    }
  };
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs("div", { className: "panel-section", children: [
      /* @__PURE__ */ jsxs("div", { className: "property-row", children: [
        /* @__PURE__ */ jsx("div", { className: "property-row-label", children: /* @__PURE__ */ jsx("span", { className: "property-label", children: "Provider" }) }),
        /* @__PURE__ */ jsx("div", { className: "property-row-control", children: /* @__PURE__ */ jsxs(
          "select",
          {
            className: "select-dark",
            value: activeProviderId,
            onChange: (e) => setActiveProviderId(e.target.value),
            children: [
              /* @__PURE__ */ jsx("option", { value: "all", children: "All providers" }),
              providerConfigs.filter((p) => p.enabled).map((p) => /* @__PURE__ */ jsx("option", { value: p.id, children: p.label }, p.id))
            ]
          }
        ) })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "property-row-control", children: /* @__PURE__ */ jsx(
        SearchInput,
        {
          searchQuery: publicSearchQuery,
          setSearchQuery: (q) => {
            setPublicSearchQuery(q);
          }
        }
      ) })
    ] }),
    /* @__PURE__ */ jsx(
      ImagePanel,
      {
        items: publicItems,
        searchQuery: publicSearchQuery,
        onSearchChange: setPublicSearchQuery,
        onItemSelect: () => {
        },
        onFileUpload: () => {
        },
        isLoading: isPublicLoading,
        acceptFileTypes: [],
        onUrlAdd: () => {
        },
        showAddByUrl: false,
        canLoadMore: hasMore,
        onLoadMore: loadMore
      }
    )
  ] });
}
const useVideoPreview = () => {
  const [playingVideo, setPlayingVideo] = useState(null);
  const videoRef = useRef(null);
  useEffect(() => {
    return () => {
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current = null;
      }
    };
  }, []);
  const stopPlayback = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current = null;
    }
    setPlayingVideo(null);
  }, []);
  const togglePlayPause = useCallback((item, videoElement) => {
    if (playingVideo === item.id) {
      videoElement.pause();
      stopPlayback();
      return;
    }
    stopPlayback();
    videoElement.currentTime = 0;
    videoElement.play();
    videoRef.current = videoElement;
    setPlayingVideo(item.id);
    videoElement.addEventListener("ended", stopPlayback, { once: true });
  }, [playingVideo, stopPlayback]);
  return {
    playingVideo,
    videoElement: videoRef.current,
    togglePlayPause,
    stopPlayback
  };
};
function VideoPanel({
  items,
  onItemSelect,
  onUrlAdd,
  showAddByUrl = true,
  isLoading,
  canLoadMore,
  onLoadMore
}) {
  const { playingVideo, togglePlayPause } = useVideoPreview();
  return /* @__PURE__ */ jsxs("div", { className: "panel-container", children: [
    /* @__PURE__ */ jsx("div", { className: "panel-title", children: "Video Library" }),
    showAddByUrl && /* @__PURE__ */ jsx("div", { className: "flex panel-section", children: /* @__PURE__ */ jsx(UrlInput, { type: "video", onSubmit: onUrlAdd }) }),
    /* @__PURE__ */ jsxs("div", { className: "media-content", children: [
      /* @__PURE__ */ jsx("div", { className: "media-grid", children: (items || []).map((item) => /* @__PURE__ */ jsxs(
        "div",
        {
          draggable: true,
          onDoubleClick: () => onItemSelect(item),
          onDragStart: (e) => {
            e.dataTransfer.setData(
              TIMELINE_DROP_MEDIA_TYPE,
              JSON.stringify({ type: "video", url: item.url })
            );
            e.dataTransfer.effectAllowed = "copy";
          },
          className: "media-item media-item-draggable",
          children: [
            /* @__PURE__ */ jsx(
              "video",
              {
                src: item.url,
                poster: item.thumbnail,
                className: "media-item-content",
                ref: (el) => {
                  if (el) {
                    el.addEventListener("ended", () => {
                      el.currentTime = 0;
                    }, { once: true });
                  }
                }
              }
            ),
            /* @__PURE__ */ jsxs("div", { className: "media-actions media-actions-corner", children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: (e) => {
                    var _a, _b;
                    e.stopPropagation();
                    const videoEl = (_b = (_a = e.currentTarget.parentElement) == null ? void 0 : _a.parentElement) == null ? void 0 : _b.querySelector("video");
                    if (videoEl) {
                      togglePlayPause(item, videoEl);
                    }
                  },
                  className: "media-action-btn",
                  children: playingVideo === item.id ? /* @__PURE__ */ jsx(Pause, { className: "icon-sm" }) : /* @__PURE__ */ jsx(Play, { className: "icon-sm" })
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: (e) => {
                    e.stopPropagation();
                    onItemSelect(item, true);
                  },
                  className: "media-action-btn",
                  children: /* @__PURE__ */ jsx(Plus, { className: "icon-sm" })
                }
              )
            ] })
          ]
        },
        item.id
      )) }),
      items.length === 0 && /* @__PURE__ */ jsx("div", { className: "empty-state", children: /* @__PURE__ */ jsxs("div", { className: "empty-state-content", children: [
        /* @__PURE__ */ jsx(WandSparkles, { className: "empty-state-icon" }),
        /* @__PURE__ */ jsx("p", { className: "empty-state-text", children: "No videos found" })
      ] }) }),
      onLoadMore && canLoadMore && /* @__PURE__ */ jsx("div", { className: "panel-section", children: /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          className: "btn-ghost w-full",
          onClick: onLoadMore,
          disabled: isLoading,
          children: isLoading ? "Loading..." : "Load more"
        }
      ) })
    ] })
  ] });
}
function VideoPanelContainer(props) {
  const [activeSource, setActiveSource] = useState("user");
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("div", { className: "panel-section", children: /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          className: `btn-ghost w-full ${activeSource === "user" ? "btn-primary" : ""}`,
          onClick: () => setActiveSource("user"),
          children: "My assets"
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          className: `btn-ghost w-full ${activeSource === "public" ? "btn-primary" : ""}`,
          onClick: () => setActiveSource("public"),
          children: "Public"
        }
      )
    ] }) }),
    activeSource === "user" ? /* @__PURE__ */ jsx(VideoUserAssetsSection, { ...props }) : /* @__PURE__ */ jsx(VideoPublicAssetsSection, {})
  ] });
}
function VideoUserAssetsSection(props) {
  const { addItem } = useMedia("video");
  const mediaManager = getMediaManager();
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 30;
  const {
    items,
    handleSelection,
    handleFileUpload,
    isLoading,
    acceptFileTypes
  } = useMediaPanel(
    "video",
    {
      selectedElement: props.selectedElement ?? null,
      addElement: props.addElement,
      updateElement: props.updateElement
    },
    props.videoResolution
  );
  const onUrlAdd = async (url) => {
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
      metadata: { source: "url" }
    });
    addItem(newItem);
  };
  const onCloudUploadSuccess = async (url, file) => {
    var _a;
    const newItem = await mediaManager.addItem({
      name: file.name,
      url,
      type: "video",
      metadata: { source: ((_a = props.uploadConfig) == null ? void 0 : _a.provider) ?? "s3" }
    });
    addItem(newItem);
  };
  const visibleItems = items.slice(0, page * PAGE_SIZE);
  const canLoadMore = items.length > visibleItems.length;
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    props.uploadConfig && /* @__PURE__ */ jsx("div", { className: "flex panel-section", children: /* @__PURE__ */ jsx(
      CloudMediaUpload,
      {
        uploadApiUrl: props.uploadConfig.uploadApiUrl,
        provider: props.uploadConfig.provider,
        accept: "video/*",
        onSuccess: onCloudUploadSuccess,
        buttonText: "Upload video",
        className: "btn-ghost w-full"
      }
    ) }),
    /* @__PURE__ */ jsx(
      VideoPanel,
      {
        items: visibleItems,
        onItemSelect: handleSelection,
        onFileUpload: handleFileUpload,
        isLoading,
        acceptFileTypes,
        onUrlAdd,
        canLoadMore,
        onLoadMore: () => setPage((prev) => prev + 1)
      }
    )
  ] });
}
function VideoPublicAssetsSection() {
  const assetLibrary = getAssetLibrary();
  const [providerConfigs, setProviderConfigs] = useState(
    []
  );
  const [activeProviderId, setActiveProviderId] = useState(
    "all"
  );
  const [publicItems, setPublicItems] = useState([]);
  const [publicSearchQuery, setPublicSearchQuery] = useState("nature");
  const [isPublicLoading, setIsPublicLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 10;
  useEffect(() => {
    const loadProviders = async () => {
      try {
        const configs = await assetLibrary.listPublicProviders();
        setProviderConfigs(
          configs.filter((c) => {
            var _a;
            return (_a = c.supportedTypes) == null ? void 0 : _a.includes("video");
          })
        );
      } catch (err) {
        console.error("Failed to load asset providers", err);
      }
    };
    void loadProviders();
  }, [assetLibrary]);
  const loadPublicAssets = async (query) => {
    setIsPublicLoading(true);
    try {
      const result = await assetLibrary.listAssets({
        source: "public",
        type: "video",
        query,
        page: 1,
        pageSize: PAGE_SIZE,
        provider: activeProviderId === "all" ? void 0 : activeProviderId
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
    () => throttle(loadPublicAssets, 1e3),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [assetLibrary, activeProviderId]
  );
  useEffect(() => {
    void throttledLoadPublicAssets(publicSearchQuery);
  }, [activeProviderId]);
  useEffect(() => {
    if (publicSearchQuery) {
      void throttledLoadPublicAssets(publicSearchQuery);
    }
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
        provider: activeProviderId === "all" ? void 0 : activeProviderId
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
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs("div", { className: "panel-section", children: [
      /* @__PURE__ */ jsxs("div", { className: "property-row", children: [
        /* @__PURE__ */ jsx("div", { className: "property-row-label", children: /* @__PURE__ */ jsx("span", { className: "property-label", children: "Provider" }) }),
        /* @__PURE__ */ jsx("div", { className: "property-row-control", children: /* @__PURE__ */ jsxs(
          "select",
          {
            className: "select-dark",
            value: activeProviderId,
            onChange: (e) => setActiveProviderId(e.target.value),
            children: [
              /* @__PURE__ */ jsx("option", { value: "all", children: "All providers" }),
              providerConfigs.filter((p) => p.enabled).map((p) => /* @__PURE__ */ jsx("option", { value: p.id, children: p.label }, p.id))
            ]
          }
        ) })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "property-row-control", children: /* @__PURE__ */ jsx(
        SearchInput,
        {
          searchQuery: publicSearchQuery,
          setSearchQuery: (q) => {
            setPublicSearchQuery(q);
          }
        }
      ) })
    ] }),
    /* @__PURE__ */ jsx(
      VideoPanel,
      {
        items: publicItems,
        onItemSelect: () => {
        },
        onFileUpload: () => {
        },
        isLoading: isPublicLoading,
        acceptFileTypes: [],
        onUrlAdd: () => {
        },
        showAddByUrl: false,
        canLoadMore: hasMore,
        onLoadMore: loadMore
      }
    )
  ] });
}
function TextPanel({
  textContent,
  fontSize,
  selectedFont,
  isBold,
  isItalic,
  textColor,
  strokeColor,
  applyShadow,
  shadowColor,
  strokeWidth,
  applyBackground,
  backgroundColor,
  backgroundOpacity,
  fonts,
  operation,
  setTextContent,
  setFontSize,
  setSelectedFont,
  setIsBold,
  setIsItalic,
  setTextColor,
  setStrokeColor,
  setApplyShadow,
  setShadowColor,
  setStrokeWidth,
  setApplyBackground,
  setBackgroundColor,
  setBackgroundOpacity,
  handleApplyChanges
}) {
  return /* @__PURE__ */ jsxs("div", { className: "panel-container", children: [
    /* @__PURE__ */ jsx("div", { className: "panel-title", children: "Text" }),
    /* @__PURE__ */ jsx("div", { className: "flex panel-section", children: /* @__PURE__ */ jsx(
      "input",
      {
        type: "text",
        value: textContent,
        placeholder: "Sample",
        onChange: (e) => setTextContent(e.target.value),
        className: "input-dark"
      }
    ) }),
    /* @__PURE__ */ jsxs("div", { className: "panel-section", children: [
      /* @__PURE__ */ jsx("label", { className: "label-dark", children: "Font Size" }),
      /* @__PURE__ */ jsxs("div", { className: "slider-container", children: [
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "range",
            min: "8",
            max: "120",
            value: fontSize,
            onChange: (e) => setFontSize(Number(e.target.value)),
            className: "slider-purple"
          }
        ),
        /* @__PURE__ */ jsxs("span", { className: "slider-value", children: [
          fontSize,
          "px"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "panel-section", children: [
      /* @__PURE__ */ jsx("label", { className: "label-dark", children: "Font" }),
      /* @__PURE__ */ jsxs("div", { className: "font-controls", children: [
        /* @__PURE__ */ jsx(
          "select",
          {
            value: selectedFont,
            onChange: (e) => setSelectedFont(e.target.value),
            className: "select-dark",
            children: fonts.map((font) => /* @__PURE__ */ jsx("option", { value: font, children: font }, font))
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setIsBold(!isBold),
            className: `btn-icon ${isBold ? "btn-icon-active" : ""}`,
            children: "B"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setIsItalic(!isItalic),
            className: `btn-icon ${isItalic ? "btn-icon-active" : ""}`,
            children: "I"
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "panel-section", children: [
      /* @__PURE__ */ jsx("label", { className: "label-dark", children: "Colors" }),
      /* @__PURE__ */ jsxs("div", { className: "color-section", children: [
        /* @__PURE__ */ jsxs("div", { className: "color-control", children: [
          /* @__PURE__ */ jsx("label", { className: "label-small", children: "Text Color" }),
          /* @__PURE__ */ jsxs("div", { className: "color-inputs", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "color",
                value: textColor,
                onChange: (e) => setTextColor(e.target.value),
                className: "color-picker"
              }
            ),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                value: textColor,
                onChange: (e) => setTextColor(e.target.value),
                className: "color-text"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "color-control", children: [
          /* @__PURE__ */ jsx("label", { className: "label-small", children: "Stroke Color" }),
          /* @__PURE__ */ jsxs("div", { className: "color-inputs", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "color",
                value: strokeColor,
                onChange: (e) => setStrokeColor(e.target.value),
                className: "color-picker"
              }
            ),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                value: strokeColor,
                onChange: (e) => setStrokeColor(e.target.value),
                className: "color-text"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "checkbox-control", children: /* @__PURE__ */ jsxs("label", { className: "checkbox-label", children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "checkbox",
              checked: applyShadow,
              onChange: (e) => setApplyShadow(e.target.checked),
              className: "checkbox-purple"
            }
          ),
          "Apply Shadow"
        ] }) }),
        applyShadow && /* @__PURE__ */ jsxs("div", { className: "color-control", children: [
          /* @__PURE__ */ jsx("label", { className: "label-small", children: "Shadow Color" }),
          /* @__PURE__ */ jsxs("div", { className: "color-inputs", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "color",
                value: shadowColor,
                onChange: (e) => setShadowColor(e.target.value),
                className: "color-picker"
              }
            ),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                value: shadowColor,
                onChange: (e) => setShadowColor(e.target.value),
                className: "color-text"
              }
            )
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "panel-section", children: [
      /* @__PURE__ */ jsx("label", { className: "label-dark", children: "Stroke Width" }),
      /* @__PURE__ */ jsxs("div", { className: "slider-container", children: [
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "range",
            min: "0",
            max: "2",
            step: 0.1,
            value: strokeWidth,
            onChange: (e) => setStrokeWidth(Number(e.target.value)),
            className: "slider-purple"
          }
        ),
        /* @__PURE__ */ jsx("span", { className: "slider-value", children: strokeWidth })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "panel-section", children: [
      /* @__PURE__ */ jsx("label", { className: "label-dark", children: "Background" }),
      /* @__PURE__ */ jsxs("div", { className: "color-section", children: [
        /* @__PURE__ */ jsx("div", { className: "checkbox-control", children: /* @__PURE__ */ jsxs("label", { className: "checkbox-label", children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "checkbox",
              checked: applyBackground,
              onChange: (e) => setApplyBackground(e.target.checked),
              className: "checkbox-purple"
            }
          ),
          "Apply Background"
        ] }) }),
        applyBackground && /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsxs("div", { className: "color-control", children: [
            /* @__PURE__ */ jsx("label", { className: "label-small", children: "Background Color" }),
            /* @__PURE__ */ jsxs("div", { className: "color-inputs", children: [
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "color",
                  value: backgroundColor,
                  onChange: (e) => setBackgroundColor(e.target.value),
                  className: "color-picker"
                }
              ),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  value: backgroundColor,
                  onChange: (e) => setBackgroundColor(e.target.value),
                  className: "color-text"
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "panel-section", children: [
            /* @__PURE__ */ jsx("label", { className: "label-small", children: "Background Opacity" }),
            /* @__PURE__ */ jsxs("div", { className: "slider-container", children: [
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "range",
                  min: "0",
                  max: "1",
                  step: 0.1,
                  value: backgroundOpacity,
                  onChange: (e) => setBackgroundOpacity(Number(e.target.value)),
                  className: "slider-purple"
                }
              ),
              /* @__PURE__ */ jsxs("span", { className: "slider-value", children: [
                Math.round(backgroundOpacity * 100),
                "%"
              ] })
            ] })
          ] })
        ] })
      ] })
    ] }),
    operation !== "Apply Changes" && /* @__PURE__ */ jsx("div", { className: "flex panel-section", children: /* @__PURE__ */ jsx("button", { onClick: handleApplyChanges, className: "btn-primary w-full", children: operation }) })
  ] });
}
const DEFAULT_TEXT_PROPS = {
  text: "Sample",
  fontSize: 48,
  fontFamily: "Poppins",
  fontWeight: 400,
  fontStyle: "normal",
  textColor: "#ffffff",
  strokeColor: "#4d4d4d",
  strokeWidth: 0,
  applyShadow: false,
  shadowColor: "#000000",
  textAlign: "center",
  shadowOffset: [0, 0],
  shadowBlur: 2,
  shadowOpacity: 1
};
const useTextPanel = ({
  selectedElement,
  addElement,
  updateElement
}) => {
  const [textContent, setTextContent] = useState(DEFAULT_TEXT_PROPS.text);
  const [fontSize, setFontSize] = useState(DEFAULT_TEXT_PROPS.fontSize);
  const [selectedFont, setSelectedFont] = useState(DEFAULT_TEXT_PROPS.fontFamily);
  const [isBold, setIsBold] = useState(DEFAULT_TEXT_PROPS.fontWeight === 700);
  const [isItalic, setIsItalic] = useState(DEFAULT_TEXT_PROPS.fontStyle === "italic");
  const [textColor, setTextColor] = useState(DEFAULT_TEXT_PROPS.textColor);
  const [strokeColor, setStrokeColor] = useState(DEFAULT_TEXT_PROPS.strokeColor);
  const [applyShadow, setApplyShadow] = useState(DEFAULT_TEXT_PROPS.applyShadow);
  const [shadowColor, setShadowColor] = useState(DEFAULT_TEXT_PROPS.shadowColor);
  const [strokeWidth, setStrokeWidth] = useState(DEFAULT_TEXT_PROPS.strokeWidth);
  const [applyBackground, setApplyBackground] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState("#FACC15");
  const [backgroundOpacity, setBackgroundOpacity] = useState(1);
  const fonts = Object.values(AVAILABLE_TEXT_FONTS);
  const applyLiveChangesToExistingText = (overrides = {}) => {
    if (!(selectedElement instanceof TextElement)) {
      return;
    }
    const textElement = selectedElement;
    const nextState = {
      textContent,
      fontSize,
      selectedFont,
      isBold,
      isItalic,
      textColor,
      strokeColor,
      strokeWidth,
      applyShadow,
      shadowColor,
      applyBackground,
      backgroundColor,
      backgroundOpacity,
      ...overrides
    };
    textElement.setText(nextState.textContent);
    textElement.setFontSize(nextState.fontSize);
    textElement.setFontFamily(nextState.selectedFont);
    textElement.setFontWeight(nextState.isBold ? 700 : 400);
    textElement.setFontStyle(nextState.isItalic ? "italic" : "normal");
    textElement.setFill(nextState.textColor);
    textElement.setStrokeColor(nextState.strokeColor);
    textElement.setLineWidth(nextState.strokeWidth);
    textElement.setTextAlign(DEFAULT_TEXT_PROPS.textAlign);
    const nextProps = { ...textElement.getProps() };
    if (nextState.applyShadow) {
      nextProps.shadowColor = nextState.shadowColor;
      nextProps.shadowOffset = DEFAULT_TEXT_PROPS.shadowOffset;
      nextProps.shadowBlur = DEFAULT_TEXT_PROPS.shadowBlur;
      nextProps.shadowOpacity = DEFAULT_TEXT_PROPS.shadowOpacity;
    } else {
      nextProps.shadowColor = void 0;
      nextProps.shadowOffset = void 0;
      nextProps.shadowBlur = void 0;
      nextProps.shadowOpacity = void 0;
    }
    if (nextState.applyBackground) {
      nextProps.backgroundColor = nextState.backgroundColor;
      nextProps.backgroundOpacity = nextState.backgroundOpacity;
    } else {
      nextProps.backgroundColor = void 0;
      nextProps.backgroundOpacity = void 0;
    }
    textElement.setProps(nextProps);
    updateElement(textElement);
  };
  const handleTextContentChange = (text) => {
    setTextContent(text);
    applyLiveChangesToExistingText({ textContent: text });
  };
  const handleFontSizeChange = (size) => {
    setFontSize(size);
    applyLiveChangesToExistingText({ fontSize: size });
  };
  const handleSelectedFontChange = (font) => {
    setSelectedFont(font);
    applyLiveChangesToExistingText({ selectedFont: font });
  };
  const handleIsBoldChange = (bold) => {
    setIsBold(bold);
    applyLiveChangesToExistingText({ isBold: bold });
  };
  const handleIsItalicChange = (italic) => {
    setIsItalic(italic);
    applyLiveChangesToExistingText({ isItalic: italic });
  };
  const handleTextColorChange = (color) => {
    setTextColor(color);
    applyLiveChangesToExistingText({ textColor: color });
  };
  const handleStrokeColorChange = (color) => {
    setStrokeColor(color);
    applyLiveChangesToExistingText({ strokeColor: color });
  };
  const handleStrokeWidthChange = (width) => {
    setStrokeWidth(width);
    applyLiveChangesToExistingText({ strokeWidth: width });
  };
  const handleApplyShadowChange = (shadow) => {
    setApplyShadow(shadow);
    applyLiveChangesToExistingText({ applyShadow: shadow });
  };
  const handleShadowColorChange = (color) => {
    setShadowColor(color);
    applyLiveChangesToExistingText({ shadowColor: color });
  };
  const handleApplyBackgroundChange = (apply) => {
    setApplyBackground(apply);
    applyLiveChangesToExistingText({ applyBackground: apply });
  };
  const handleBackgroundColorChange = (color) => {
    setBackgroundColor(color);
    applyLiveChangesToExistingText({ backgroundColor: color });
  };
  const handleBackgroundOpacityChange = (opacity) => {
    setBackgroundOpacity(opacity);
    applyLiveChangesToExistingText({ backgroundOpacity: opacity });
  };
  const handleApplyChanges = async () => {
    if (selectedElement instanceof TextElement) {
      return;
    }
    const textElement = new TextElement(textContent).setFontSize(fontSize).setFontFamily(selectedFont).setFontWeight(isBold ? 700 : 400).setFontStyle(isItalic ? "italic" : "normal").setFill(textColor).setStrokeColor(strokeColor).setLineWidth(strokeWidth).setTextAlign("center");
    const nextProps = { ...textElement.getProps() };
    if (applyShadow) {
      nextProps.shadowColor = shadowColor;
      nextProps.shadowOffset = DEFAULT_TEXT_PROPS.shadowOffset;
      nextProps.shadowBlur = DEFAULT_TEXT_PROPS.shadowBlur;
      nextProps.shadowOpacity = DEFAULT_TEXT_PROPS.shadowOpacity;
    }
    if (applyBackground) {
      nextProps.backgroundColor = backgroundColor;
      nextProps.backgroundOpacity = backgroundOpacity;
    }
    textElement.setProps(nextProps);
    await addElement(textElement);
  };
  useEffect(() => {
    if (selectedElement instanceof TextElement) {
      setTextContent(selectedElement.getText());
      const textProps = selectedElement.getProps();
      setSelectedFont(textProps.fontFamily ?? DEFAULT_TEXT_PROPS.fontFamily);
      setFontSize(textProps.fontSize ?? DEFAULT_TEXT_PROPS.fontSize);
      setIsBold(textProps.fontWeight === 700);
      setIsItalic(textProps.fontStyle === "italic");
      setTextColor(textProps.fill ?? DEFAULT_TEXT_PROPS.textColor);
      setStrokeColor(textProps.stroke ?? DEFAULT_TEXT_PROPS.strokeColor);
      setStrokeWidth(textProps.lineWidth ?? DEFAULT_TEXT_PROPS.strokeWidth);
      const hasShadow = textProps.shadowColor !== void 0;
      setApplyShadow(hasShadow);
      if (hasShadow) {
        setShadowColor(textProps.shadowColor ?? DEFAULT_TEXT_PROPS.shadowColor);
      }
      const hasBackground = textProps.backgroundColor != null && textProps.backgroundColor !== "";
      setApplyBackground(hasBackground);
      if (hasBackground) {
        setBackgroundColor(textProps.backgroundColor ?? "#FACC15");
        setBackgroundOpacity(textProps.backgroundOpacity ?? 1);
      }
    } else {
      setTextContent(DEFAULT_TEXT_PROPS.text);
      setFontSize(DEFAULT_TEXT_PROPS.fontSize);
      setSelectedFont(DEFAULT_TEXT_PROPS.fontFamily);
      setIsBold(DEFAULT_TEXT_PROPS.fontWeight === 700);
      setIsItalic(DEFAULT_TEXT_PROPS.fontStyle === "italic");
      setTextColor(DEFAULT_TEXT_PROPS.textColor);
      setStrokeColor(DEFAULT_TEXT_PROPS.strokeColor);
      setStrokeWidth(DEFAULT_TEXT_PROPS.strokeWidth);
      setApplyShadow(DEFAULT_TEXT_PROPS.applyShadow);
      setShadowColor(DEFAULT_TEXT_PROPS.shadowColor);
      setApplyBackground(false);
      setBackgroundColor("#FACC15");
      setBackgroundOpacity(1);
    }
  }, [selectedElement]);
  return {
    textContent,
    fontSize,
    selectedFont,
    isBold,
    isItalic,
    textColor,
    strokeColor,
    applyShadow,
    shadowColor,
    strokeWidth,
    fonts,
    operation: selectedElement instanceof TextElement ? "Apply Changes" : "Add Text",
    setTextContent: handleTextContentChange,
    setFontSize: handleFontSizeChange,
    setSelectedFont: handleSelectedFontChange,
    setIsBold: handleIsBoldChange,
    setIsItalic: handleIsItalicChange,
    setTextColor: handleTextColorChange,
    setStrokeColor: handleStrokeColorChange,
    setApplyShadow: handleApplyShadowChange,
    setShadowColor: handleShadowColorChange,
    setStrokeWidth: handleStrokeWidthChange,
    applyBackground,
    backgroundColor,
    backgroundOpacity,
    setApplyBackground: handleApplyBackgroundChange,
    setBackgroundColor: handleBackgroundColorChange,
    setBackgroundOpacity: handleBackgroundOpacityChange,
    handleApplyChanges
  };
};
function TextPanelContainer(props) {
  const textPanelProps = useTextPanel(props);
  return /* @__PURE__ */ jsx(TextPanel, { ...textPanelProps });
}
const TEXT_STYLE_PRESETS = [
  // Utility / captions
  {
    id: "classic-subtitle",
    label: "Classic Subtitle",
    description: "White text with subtle outline",
    fontFamily: AVAILABLE_TEXT_FONTS.ROBOTO,
    fontSize: 32,
    fontWeight: 500,
    textColor: "#FFFFFF",
    strokeColor: "#000000",
    strokeWidth: 0.5,
    applyShadow: false,
    applyBackground: false
  },
  {
    id: "minimal-subtitle",
    label: "Minimal Subtitle",
    description: "Clean white text, no effects",
    fontFamily: AVAILABLE_TEXT_FONTS.MULISH,
    fontSize: 30,
    fontWeight: 500,
    textColor: "#FFFFFF",
    strokeColor: "#000000",
    strokeWidth: 0,
    applyShadow: false,
    applyBackground: false
  },
  {
    id: "bold-caption",
    label: "Bold Caption",
    description: "Bold white with strong outline",
    fontFamily: AVAILABLE_TEXT_FONTS.ROBOTO,
    fontSize: 34,
    fontWeight: 700,
    textColor: "#FFFFFF",
    strokeColor: "#000000",
    strokeWidth: 1,
    applyShadow: false,
    applyBackground: false
  },
  {
    id: "bar-caption",
    label: "Bar Caption",
    description: "White text on dark bar",
    fontFamily: AVAILABLE_TEXT_FONTS.RUBIK,
    fontSize: 30,
    fontWeight: 600,
    textColor: "#FFFFFF",
    strokeColor: "#000000",
    strokeWidth: 0,
    applyShadow: false,
    applyBackground: true,
    backgroundColor: "#020617",
    backgroundOpacity: 0.85
  },
  // Titles
  {
    id: "big-title",
    label: "Big Title",
    description: "Large bold center title",
    fontFamily: AVAILABLE_TEXT_FONTS.LUCKIEST_GUY,
    fontSize: 56,
    fontWeight: 700,
    textColor: "#FFFFFF",
    strokeColor: "#000000",
    strokeWidth: 0.5,
    applyShadow: true,
    shadowColor: "#000000",
    applyBackground: false
  },
  {
    id: "minimal-title",
    label: "Minimal Title",
    description: "Lightweight clean heading",
    fontFamily: AVAILABLE_TEXT_FONTS.PLAYFAIR_DISPLAY,
    fontSize: 42,
    fontWeight: 400,
    textColor: "#E5E7EB",
    strokeColor: "#000000",
    strokeWidth: 0,
    applyShadow: false,
    applyBackground: false
  },
  {
    id: "highlight-title",
    label: "Highlight Title",
    description: "Bold on yellow highlight",
    fontFamily: AVAILABLE_TEXT_FONTS.POPPINS,
    fontSize: 40,
    fontWeight: 700,
    textColor: "#111827",
    strokeColor: "#000000",
    strokeWidth: 0,
    applyShadow: false,
    applyBackground: true,
    backgroundColor: "#FACC15",
    backgroundOpacity: 0.9
  },
  {
    id: "outline-title",
    label: "Outline Title",
    description: "Bold outlined title",
    fontFamily: AVAILABLE_TEXT_FONTS.KUMAR_ONE_OUTLINE,
    fontSize: 48,
    fontWeight: 700,
    textColor: "#000000",
    strokeColor: "#FFFFFF",
    strokeWidth: 1.2,
    applyShadow: false,
    applyBackground: false
  },
  // Social / handle
  {
    id: "handle-chip",
    label: "Handle Chip",
    description: "@handle chip style",
    fontFamily: AVAILABLE_TEXT_FONTS.RUBIK,
    fontSize: 26,
    fontWeight: 600,
    textColor: "#0F172A",
    strokeColor: "#000000",
    strokeWidth: 0,
    applyShadow: false,
    applyBackground: true,
    backgroundColor: "#E5E7EB",
    backgroundOpacity: 1
  },
  {
    id: "cta-pill",
    label: "CTA Pill",
    description: "Call-to-action pill",
    fontFamily: AVAILABLE_TEXT_FONTS.LUCKIEST_GUY,
    fontSize: 28,
    fontWeight: 700,
    textColor: "#FFFFFF",
    strokeColor: "#000000",
    strokeWidth: 0,
    applyShadow: false,
    applyBackground: true,
    backgroundColor: "#22C55E",
    backgroundOpacity: 1
  }
];
function TextStylePanel({ addElement }) {
  const createTextFromPreset = async (preset) => {
    const textElement = new TextElement("Sample").setFontSize(preset.fontSize).setFontFamily(preset.fontFamily).setFontWeight(preset.fontWeight).setFontStyle("normal").setFill(preset.textColor).setStrokeColor(preset.strokeColor).setLineWidth(preset.strokeWidth).setTextAlign("center");
    const nextProps = { ...textElement.getProps() };
    if (preset.applyShadow && preset.shadowColor) {
      nextProps.shadowColor = preset.shadowColor;
      nextProps.shadowOffset = [0, 0];
      nextProps.shadowBlur = 2;
      nextProps.shadowOpacity = 1;
    }
    if (preset.applyBackground && preset.backgroundColor) {
      nextProps.backgroundColor = preset.backgroundColor;
      nextProps.backgroundOpacity = preset.backgroundOpacity ?? 1;
    }
    textElement.setProps(nextProps);
    await addElement(textElement);
  };
  const handlePresetClick = (preset) => {
    void createTextFromPreset(preset);
  };
  return /* @__PURE__ */ jsxs("div", { className: "panel-container", children: [
    /* @__PURE__ */ jsx("div", { className: "panel-title", children: "Text Style" }),
    /* @__PURE__ */ jsx("div", { className: "panel-section", children: /* @__PURE__ */ jsx("div", { className: "text-style-grid", children: TEXT_STYLE_PRESETS.map((preset) => /* @__PURE__ */ jsx(
      "button",
      {
        type: "button",
        className: "text-style-card",
        onClick: () => handlePresetClick(preset),
        children: /* @__PURE__ */ jsx("div", { className: "text-style-preview", children: /* @__PURE__ */ jsx(
          "div",
          {
            style: {
              padding: preset.applyBackground ? "0.35rem 0.9rem" : 0,
              borderRadius: preset.applyBackground ? "999px" : 0,
              backgroundColor: preset.applyBackground ? preset.backgroundColor : "transparent",
              boxShadow: preset.applyBackground && preset.backgroundOpacity && preset.backgroundOpacity > 0.8 ? "0 0 20px rgba(0, 0, 0, 0.55)" : void 0
            },
            children: /* @__PURE__ */ jsx(
              "span",
              {
                style: {
                  fontFamily: preset.fontFamily,
                  fontWeight: preset.fontWeight,
                  // Scale preview size relative to configured size but clamp for tiles
                  fontSize: Math.max(10, Math.min(18, preset.fontSize * 0.35)),
                  color: preset.textColor,
                  WebkitTextStroke: preset.strokeWidth > 0 ? `${preset.strokeWidth}px ${preset.strokeColor}` : void 0,
                  textShadow: preset.applyShadow && preset.shadowColor ? `0 0 16px ${preset.shadowColor}` : void 0
                },
                children: preset.label
              }
            )
          }
        ) })
      },
      preset.id
    )) }) })
  ] });
}
function TextStylePanelContainer({ addElement }) {
  return /* @__PURE__ */ jsx(
    TextStylePanel,
    {
      addElement
    }
  );
}
const BASIC_VERTEX_SHADER = `
  attribute vec2 a_position;
  attribute vec2 a_texCoord;
  varying vec2 v_texCoord;
  void main() {
    v_texCoord = a_texCoord;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;
const SEPIA_FRAGMENT = (
  /* glsl */
  `
  precision mediump float;
  varying vec2 v_texCoord;
  uniform sampler2D uTexture;
  uniform float uIntensity;
  void main() {
    vec4 color = texture2D(uTexture, v_texCoord);
    vec3 c = color.rgb;
    vec3 sepia = vec3(
      dot(c, vec3(0.393, 0.769, 0.189)),
      dot(c, vec3(0.349, 0.686, 0.168)),
      dot(c, vec3(0.272, 0.534, 0.131))
    );
    vec3 mixed = mix(c, sepia, clamp(uIntensity, 0.0, 1.0));
    gl_FragColor = vec4(mixed, color.a);
  }
`
);
const VIGNETTE_FRAGMENT = (
  /* glsl */
  `
  precision mediump float;
  varying vec2 v_texCoord;
  uniform sampler2D uTexture;
  uniform float uIntensity;
  void main() {
    vec2 uv = v_texCoord - 0.5;
    float dist = length(uv);
    float vignette = smoothstep(0.8, 0.3, dist);
    vec4 color = texture2D(uTexture, v_texCoord);
    color.rgb *= mix(1.0, vignette, clamp(uIntensity, 0.0, 1.0));
    gl_FragColor = color;
  }
`
);
const PIXELATE_FRAGMENT = (
  /* glsl */
  `
  precision mediump float;
  varying vec2 v_texCoord;
  uniform sampler2D uTexture;
  uniform vec2 uResolution;
  uniform float uIntensity;
  void main() {
    float pixelSize = mix(1.0, 20.0, clamp(uIntensity, 0.0, 1.0));
    vec2 uv = v_texCoord;
    vec2 coord = floor(uv * uResolution / pixelSize) * pixelSize / uResolution;
    vec4 color = texture2D(uTexture, coord);
    gl_FragColor = color;
  }
`
);
const WARP_FRAGMENT = (
  /* glsl */
  `
  precision mediump float;
  varying vec2 v_texCoord;
  uniform sampler2D uTexture;
  uniform float uTime;
  uniform float uIntensity;
  void main() {
    vec2 uv = v_texCoord;
    float strength = 0.03 * uIntensity;
    uv.x += sin(uv.y * 20.0 + uTime * 10.0) * strength;
    uv.y += cos(uv.x * 20.0 + uTime * 8.0) * strength;
    vec4 color = texture2D(uTexture, uv);
    gl_FragColor = color;
  }
`
);
const GLITCH_FRAGMENT = (
  /* glsl */
  `
  precision mediump float;
  varying vec2 v_texCoord;
  uniform sampler2D uTexture;
  uniform float uTime;
  uniform float uIntensity;

  float rand(float n) { return fract(sin(n) * 43758.5453123); }
  float rand2(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

  void main(void) {
    vec2 uv = v_texCoord;

    // Slice count and RGB offset scale with intensity
    float sliceCount = mix(6.0, 24.0, clamp(uIntensity, 0.0, 1.0));
    float baseShift = 0.01 * clamp(uIntensity, 0.0, 1.0);

    float sliceId = floor(uv.y * sliceCount);
    float sliceShift = (rand(sliceId + uTime * 10.0) - 0.5) * 0.25 * baseShift;
    uv.x += sliceShift;

    float rShift = baseShift;
    float gShift = -baseShift * 0.5;
    float bShift = baseShift * 0.75;

    vec3 col;
    col.r = texture2D(uTexture, uv + vec2(rShift, 0.0)).r;
    col.g = texture2D(uTexture, uv + vec2(gShift, 0.0)).g;
    col.b = texture2D(uTexture, uv + vec2(bShift, 0.0)).b;

    float noise = rand2(vec2(uTime * 50.0, uv.y * 100.0));
    float noiseIntensity = noise * 0.2 * clamp(uIntensity, 0.0, 1.0);

    col += noiseIntensity;
    gl_FragColor = vec4(col, 1.0);
  }
`
);
const RGB_SHIFT_FRAGMENT = (
  /* glsl */
  `
  precision mediump float;
  varying vec2 v_texCoord;
  uniform sampler2D uTexture;
  uniform float uTime;
  uniform float uIntensity;

  void main(void) {
    vec2 uv = v_texCoord;
    vec4 base = texture2D(uTexture, uv);
    if (base.a < 0.01) {
      gl_FragColor = base;
      return;
    }

    float shiftAmount = mix(0.001, 0.02, clamp(uIntensity, 0.0, 1.0));
    float angle = 0.5 + sin(uTime * 0.7) * 0.5;
    vec2 dir = vec2(cos(angle), sin(angle));

    float wobble = sin(uTime * 10.0) * shiftAmount * 0.5;

    vec2 rUV = clamp(uv + dir * shiftAmount + vec2(wobble, 0.0), 0.0, 1.0);
    vec2 gUV = clamp(uv, 0.0, 1.0);
    vec2 bUV = clamp(uv - dir * shiftAmount - vec2(wobble, 0.0), 0.0, 1.0);

    float r = texture2D(uTexture, rUV).r;
    float g = texture2D(uTexture, gUV).g;
    float b = texture2D(uTexture, bUV).b;

    gl_FragColor = vec4(r, g, b, base.a);
  }
`
);
const HALFTONE_FRAGMENT = (
  /* glsl */
  `
  precision mediump float;
  varying vec2 v_texCoord;
  uniform sampler2D uTexture;
  uniform float uTime;
  uniform float uIntensity;

  float luminance(vec3 c) {
    return dot(c, vec3(0.299, 0.587, 0.114));
  }

  void main(void) {
    vec2 uv = v_texCoord;

    float angle = uTime * 0.3;
    float ca = cos(angle);
    float sa = sin(angle);
    mat2 rot = mat2(ca, -sa, sa, ca);
    vec2 rotatedUV = rot * (uv - 0.5) + 0.5;

    float dotSize = mix(0.06, 0.015, clamp(uIntensity, 0.0, 1.0));
    vec2 grid = rotatedUV / dotSize;
    vec2 cell = floor(grid) + 0.5;
    vec2 cellCenter = cell * dotSize;

    vec4 texColor = texture2D(uTexture, uv);
    float lum = luminance(texColor.rgb);
    float radius = (1.0 - lum) * dotSize * 0.5;

    float dist = distance(rotatedUV, cellCenter);
    float mask = smoothstep(radius, radius * 0.8, dist);

    vec3 halftone = texColor.rgb * mask;
    float mixAmount = clamp(uIntensity, 0.0, 1.0);
    texColor.rgb = mix(texColor.rgb, halftone, mixAmount);

    gl_FragColor = texColor;
  }
`
);
const HUE_SHIFT_FRAGMENT = (
  /* glsl */
  `
  precision mediump float;
  varying vec2 v_texCoord;
  uniform sampler2D uTexture;
  uniform float uTime;
  uniform float uIntensity;

  vec3 hueShift(vec3 color, float angle) {
    float cosA = cos(angle);
    float sinA = sin(angle);
    mat3 rot = mat3(
      0.299 + 0.701 * cosA + 0.168 * sinA,
      0.587 - 0.587 * cosA + 0.330 * sinA,
      0.114 - 0.114 * cosA - 0.497 * sinA,

      0.299 - 0.299 * cosA - 0.328 * sinA,
      0.587 + 0.413 * cosA + 0.035 * sinA,
      0.114 - 0.114 * cosA + 0.292 * sinA,

      0.299 - 0.300 * cosA + 1.250 * sinA,
      0.587 - 0.588 * cosA - 1.050 * sinA,
      0.114 + 0.886 * cosA - 0.203 * sinA
    );
    return color * rot;
  }

  void main(void) {
    vec2 uv = v_texCoord;
    vec4 tex = texture2D(uTexture, uv);
    float amount = clamp(uIntensity, 0.0, 1.0);

    vec3 shifted = hueShift(tex.rgb, uTime * 2.5);
    tex.rgb = mix(tex.rgb, shifted, amount);

    gl_FragColor = tex;
  }
`
);
const WAVE_DISTORT_FRAGMENT = (
  /* glsl */
  `
  precision mediump float;
  varying vec2 v_texCoord;
  uniform sampler2D uTexture;
  uniform float uTime;
  uniform float uIntensity;

  void main(void) {
    vec2 uv = v_texCoord;
    float strength = mix(0.0, 0.03, clamp(uIntensity, 0.0, 1.0));
    float time = uTime * 10.0;
    float wave = sin((uv.y * 18.0) - time);
    float offsetX = wave * strength;
    vec2 distortedUV = clamp(uv + vec2(offsetX, 0.0), 0.0, 1.0);
    vec4 color = texture2D(uTexture, distortedUV);
    gl_FragColor = color;
  }
`
);
const TV_SCANLINES_FRAGMENT = (
  /* glsl */
  `
  precision mediump float;
  varying vec2 v_texCoord;
  uniform sampler2D uTexture;
  uniform float uTime;
  uniform float uIntensity;

  float rand(vec2 p) {
    return fract(sin(dot(p ,vec2(12.9898,78.233))) * 43758.5453);
  }

  void main(void) {
    vec2 uv = v_texCoord;
    vec4 tex = texture2D(uTexture, uv);
    vec3 base = tex.rgb;

    float lineThickness = mix(1.0, 3.0, clamp(uIntensity, 0.0, 1.0));
    float line = sin(uv.y * 800.0 * lineThickness) * 0.5 + 0.5;
    float lineIntensity = mix(0.2, 0.8, clamp(uIntensity, 0.0, 1.0));
    line = mix(1.0, line, lineIntensity);

    float noise = (rand(vec2(uTime, uv.y * 1000.0)) - 0.5) * 0.1 * clamp(uIntensity, 0.0, 1.0);
    vec3 color = base * line + noise;

    gl_FragColor = vec4(color, tex.a);
  }
`
);
const HDR_FRAGMENT = (
  /* glsl */
  `
  precision mediump float;
  varying vec2 v_texCoord;
  uniform sampler2D uTexture;
  uniform float uIntensity;

  vec3 adjustContrast(vec3 color, float contrast) {
    return (color - 0.5) * contrast + 0.5;
  }

  void main(void) {
    vec2 uv = v_texCoord;
    vec4 tex = texture2D(uTexture, uv);
    vec3 color = tex.rgb;

    float exposure = mix(1.0, 1.8, clamp(uIntensity, 0.0, 1.0));
    float contrast = mix(1.0, 2.0, clamp(uIntensity, 0.0, 1.0));

    color *= exposure;
    color = adjustContrast(color, contrast);
    color = color / (color + vec3(1.0));

    gl_FragColor = vec4(color, tex.a);
  }
`
);
const RETRO_70S_FRAGMENT = (
  /* glsl */
  `
  precision mediump float;
  varying vec2 v_texCoord;
  uniform sampler2D uTexture;
  uniform float uTime;
  uniform float uIntensity;

  float noise(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898,78.233)) + uTime) * 43758.5453);
  }

  void main(void) {
    vec2 uv = v_texCoord;
    vec4 tex = texture2D(uTexture, uv);
    vec3 color = tex.rgb;

    // Sepia-like fade
    vec3 sepia = vec3(
      dot(color, vec3(0.393, 0.769, 0.189)),
      dot(color, vec3(0.349, 0.686, 0.168)),
      dot(color, vec3(0.272, 0.534, 0.131))
    );
    float fade = clamp(uIntensity, 0.0, 1.0);
    vec3 faded = mix(color, sepia, mix(0.4, 0.9, fade));

    // Film grain
    float grainAmount = mix(0.0, 0.12, fade);
    float grain = (noise(uv * 500.0) - 0.5) * grainAmount;
    faded += grain;

    // Slight flicker
    float flicker = 0.97 + 0.03 * sin(uTime * 60.0);
    faded *= flicker;

    // Vignette
    float dist = distance(uv, vec2(0.5));
    float vignette = smoothstep(0.8, 1.0, dist);
    float vignetteStrength = mix(0.0, 1.0, fade);
    faded *= (1.0 - vignette * vignetteStrength);

    gl_FragColor = vec4(faded, tex.a);
  }
`
);
const BUBBLE_SPARKLES_FRAGMENT = (
  /* glsl */
  `
  precision mediump float;
  varying vec2 v_texCoord;
  uniform sampler2D uTexture;
  uniform float uTime;
  uniform float uIntensity;

  float rand(vec2 co) {
    return fract(sin(dot(co.xy, vec2(12.9898,78.233))) * 43758.5453);
  }

  float softCircle(vec2 uv, vec2 c, float r) {
    float d = distance(uv, c);
    return 1.0 - smoothstep(r * 0.6, r, d);
  }

  void main(void) {
    vec2 uv = v_texCoord;
    vec4 fg = texture2D(uTexture, uv);

    float bubbles = 0.0;
    float count = mix(20.0, 120.0, clamp(uIntensity, 0.0, 1.0));

    for (float i = 0.0; i < 200.0; i++) {
      if (i >= count) break;
      float t = uTime * 0.7 + i * 0.13;
      vec2 pos = vec2(rand(vec2(i, 1.23)), rand(vec2(i, 4.56)));
      float radius = mix(0.01, 0.03, rand(vec2(i, 9.87)));
      pos.y = fract(pos.y + t * 0.1);
      bubbles += softCircle(uv, pos, radius);
    }

    vec3 bubbleColor = vec3(1.0, 0.9, 0.5);
    fg.rgb += bubbleColor * bubbles * clamp(uIntensity, 0.0, 1.0);
    gl_FragColor = fg;
  }
`
);
const HEART_SPARKLES_FRAGMENT = (
  /* glsl */
  `
  precision mediump float;
  varying vec2 v_texCoord;
  uniform sampler2D uTexture;
  uniform float uTime;
  uniform float uIntensity;

  float rand(vec2 co) {
    return fract(sin(dot(co.xy, vec2(12.9898,78.233))) * 43758.5453);
  }

  float heartShape(vec2 p) {
    p = (p - 0.5) * 2.0;
    p.y = -p.y;
    p.y += 0.25;
    float x = p.x;
    float y = p.y;
    float v = pow(x*x + y*y - 1.0, 3.0) - x*x*y*y*y;
    return smoothstep(0.0, 0.02, -v);
  }

  void main(void) {
    vec2 uv = v_texCoord;
    vec4 base = texture2D(uTexture, uv);
    float hearts = 0.0;
    float count = mix(10.0, 80.0, clamp(uIntensity, 0.0, 1.0));

    for (float i = 0.0; i < 120.0; i++) {
      if (i >= count) break;
      vec2 pos = vec2(rand(vec2(i, 1.234)), rand(vec2(i, 5.678)));
      float size = mix(0.02, 0.05, rand(vec2(i, 9.1011)));
      float vibX = (rand(vec2(i, uTime)) - 0.5) * 0.02;
      float vibY = (rand(vec2(i + 1.0, uTime)) - 0.5) * 0.02;
      vec2 hUV = (uv - (pos + vec2(vibX, vibY))) / size + 0.5;
      float h = heartShape(hUV);
      float pulse = sin(uTime * 4.0 + i) * 0.2 + 1.0;
      hearts += h * pulse;
    }

    vec3 heartColor = vec3(1.0, 0.3, 0.6);
    base.rgb += heartColor * hearts * clamp(uIntensity, 0.0, 1.0);
    gl_FragColor = base;
  }
`
);
const BUTTERFLY_SPARKLES_FRAGMENT = (
  /* glsl */
  `
  precision mediump float;
  varying vec2 v_texCoord;
  uniform sampler2D uTexture;
  uniform float uTime;
  uniform float uIntensity;

  float rand(vec2 co) {
    return fract(sin(dot(co.xy, vec2(12.9898,78.233))) * 43758.5453);
  }

  float wing(vec2 p) {
    float d = pow(p.x, 2.0) + pow(p.y * 1.2, 2.0);
    return smoothstep(0.3, 0.0, d);
  }

  float butterflyShape(vec2 uv) {
    vec2 p = (uv - 0.5) * 2.0;
    float body = smoothstep(0.12, 0.05, abs(p.x)) * smoothstep(0.4, 0.0, abs(p.y));
    float wL = wing(vec2(p.x * 1.2 + 0.6, p.y));
    float wR = wing(vec2(p.x * 1.2 - 0.6, p.y));
    return clamp(wL + wR + body, 0.0, 1.0);
  }

  void main(void) {
    vec2 uv = v_texCoord;
    vec4 base = texture2D(uTexture, uv);
    float butterflies = 0.0;
    float count = mix(8.0, 40.0, clamp(uIntensity, 0.0, 1.0));

    for (float i = 0.0; i < 80.0; i++) {
      if (i >= count) break;
      vec2 pos = vec2(rand(vec2(i, 1.234)), rand(vec2(i, 5.678)));
      float size = mix(0.03, 0.08, rand(vec2(i, 9.1011)));
      float vibX = (rand(vec2(i, uTime)) - 0.5) * 0.02;
      float vibY = (rand(vec2(i + 1.0, uTime)) - 0.5) * 0.02;
      vec2 bUV = (uv - (pos + vec2(vibX, vibY))) / size + 0.5;
      float b = butterflyShape(bUV);
      float pulse = sin(uTime * 3.0 + i) * 0.25 + 1.0;
      butterflies += b * pulse;
    }

    vec3 butterflyColor = vec3(0.5, 0.6, 1.0);
    base.rgb += butterflyColor * butterflies * clamp(uIntensity, 0.0, 1.0);
    gl_FragColor = base;
  }
`
);
const LIGHTNING_FRAGMENT = (
  /* glsl */
  `
  precision mediump float;
  varying vec2 v_texCoord;
  uniform sampler2D uTexture;
  uniform float uTime;
  uniform float uIntensity;

  void main(void) {
    vec2 uv = v_texCoord;
    vec2 center = vec2(0.5, 0.5);
    float dist = distance(uv, center);

    float speed = 0.7;
    float progress = mod(uTime * speed, 1.0);
    float width = mix(0.01, 0.07, progress);
    float lightning = smoothstep(progress + width, progress, dist);
    float noise = sin((uv.x + uv.y) * 40.0 + uTime * 12.0) * 0.5 + 0.5;
    lightning *= noise;

    float explosion = smoothstep(0.85, 1.0, progress);
    float burst = explosion * smoothstep(0.25, 0.0, dist);

    vec3 lightningColor = vec3(1.0, 0.9, 0.6) * lightning * 2.0;
    vec3 explosionColor = vec3(1.0, 0.4, 0.2) * burst * 3.0;

    vec4 base = texture2D(uTexture, uv);
    vec3 mixed = base.rgb + (lightningColor + explosionColor) * clamp(uIntensity, 0.0, 1.0);
    gl_FragColor = vec4(mixed, base.a);
  }
`
);
const LIGHTNING_VEINS_FRAGMENT = (
  /* glsl */
  `
  precision mediump float;
  varying vec2 v_texCoord;
  uniform sampler2D uTexture;
  uniform float uTime;
  uniform float uIntensity;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) +
           (c - a) * u.y * (1.0 - u.x) +
           (d - b) * u.x * u.y;
  }

  void main(void) {
    vec2 uv = v_texCoord;
    vec2 center = vec2(0.5);
    vec2 dir = uv - center;
    float dist = length(dir);
    float t = uTime * 1.5;

    float veinNoise = noise(dir * 6.0 + t) * 0.6 +
                      noise(dir * 12.0 - t * 1.3) * 0.3;
    float warpedDist = dist + veinNoise * 0.08;
    float thickness = 0.04 + veinNoise * 0.02;
    float lightning = smoothstep(thickness, 0.0, warpedDist);

    float branches = smoothstep(0.02, 0.0, abs(noise(dir * 20.0 + t) - 0.5));
    lightning += branches * 0.35;

    float pulse = sin(uTime * 10.0) * 0.3 + 0.7;
    lightning *= pulse;

    vec3 veinColor = vec3(0.6, 0.85, 1.0) * lightning * 2.5 * clamp(uIntensity, 0.0, 1.0);
    vec4 base = texture2D(uTexture, uv);
    gl_FragColor = vec4(base.rgb + veinColor, base.a);
  }
`
);
const SPARKS_FRAGMENT = (
  /* glsl */
  `
  precision mediump float;
  varying vec2 v_texCoord;
  uniform sampler2D uTexture;
  uniform float uTime;
  uniform float uIntensity;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  vec3 randomColor(float h) {
    return vec3(
      0.5 + 0.5 * sin(h * 6.2831),
      0.5 + 0.5 * sin(h * 6.2831 + 2.1),
      0.5 + 0.5 * sin(h * 6.2831 + 4.2)
    );
  }

  void main(void) {
    vec2 uv = v_texCoord;
    vec4 base = texture2D(uTexture, uv);
    vec3 sparkColor = vec3(0.0);
    float sparkAlpha = 0.0;

    float density = mix(10.0, 40.0, clamp(uIntensity, 0.0, 1.0));
    vec2 grid = floor(uv * density);
    float h = hash(grid);
    vec2 offset = vec2(fract(h * 13.3), fract(h * 7.7 + uTime * 2.0));
    vec2 cellUV = fract(uv * density) - offset;
    float d = length(cellUV);

    float size = mix(0.1, 0.25, clamp(uIntensity, 0.0, 1.0));
    float spark = smoothstep(size, 0.0, d);
    vec3 color = randomColor(h) * spark;
    sparkColor += color;
    sparkAlpha += spark;

    vec3 finalColor = base.rgb + sparkColor;
    gl_FragColor = vec4(finalColor, max(base.a, sparkAlpha));
  }
`
);
const LASER_FRAGMENT = (
  /* glsl */
  `
  precision mediump float;
  varying vec2 v_texCoord;
  uniform sampler2D uTexture;
  uniform float uTime;
  uniform float uIntensity;

  float noise(float x) {
    return sin(x * 40.0) * 0.005;
  }

  void main(void) {
    vec2 uv = v_texCoord;
    vec4 baseColor = texture2D(uTexture, uv);

    float beamY = 0.5 + noise(uv.x + uTime * 5.0);
    float thickness = mix(0.01, 0.04, clamp(uIntensity, 0.0, 1.0));
    float dist = abs(uv.y - beamY);

    float core = smoothstep(thickness, 0.0, dist);
    float glow = smoothstep(thickness * 4.0, thickness, dist);
    float pulse = 0.6 + 0.4 * sin(uTime * 10.0);
    float laserMask = (core + glow * 1.5) * pulse * clamp(uIntensity, 0.0, 1.0);

    vec3 laserColor = vec3(1.0, 0.1, 0.3) * laserMask;
    vec3 color = baseColor.rgb + laserColor;
    gl_FragColor = vec4(color, baseColor.a);
  }
`
);
const WATER_REFLECTION_FRAGMENT = (
  /* glsl */
  `
  precision mediump float;
  varying vec2 v_texCoord;
  uniform sampler2D uTexture;
  uniform float uTime;
  uniform float uIntensity;

  void main(void) {
    vec2 uv = v_texCoord;

    if (uv.y < 0.5) {
      gl_FragColor = texture2D(uTexture, uv);
      return;
    }

    vec2 reflectUV = uv;
    reflectUV.y = 1.0 - uv.y;
    float wave =
      sin(reflectUV.y * 30.0 + uTime * 2.5) *
      mix(0.0, 0.03, clamp(uIntensity, 0.0, 1.0));
    reflectUV.x += wave;
    reflectUV = clamp(reflectUV, 0.0, 1.0);
    vec4 reflectColor = texture2D(uTexture, reflectUV);
    float fade = smoothstep(0.5, 1.0, uv.y);
    reflectColor.rgb *= (1.0 - fade) * 0.9;
    reflectColor.a *= (1.0 - fade);
    gl_FragColor = reflectColor;
  }
`
);
const BOUNCING_BALLS_FRAGMENT = (
  /* glsl */
  `
  precision mediump float;
  varying vec2 v_texCoord;
  uniform sampler2D uTexture;
  uniform float uTime;
  uniform float uIntensity;

  const int BALL_COUNT = 10;

  vec2 bounce(vec2 p) {
    return abs(fract(p) * 2.0 - 1.0);
  }

  void main(void) {
    vec2 uv = v_texCoord;
    vec4 color = texture2D(uTexture, uv);

    float radius = mix(0.03, 0.07, clamp(uIntensity, 0.0, 1.0));
    float border = radius * 0.25;
    float ballsAlpha = 0.0;

    for (int i = 0; i < BALL_COUNT; i++) {
      float id = float(i) + 1.0;
      vec2 speed = vec2(0.3 + id * 0.12, 0.25 + id * 0.15);
      vec2 pos = bounce(vec2(uTime * speed.x + id * 0.17, uTime * speed.y + id * 0.29));
      float d = distance(uv, pos);
      float edge = smoothstep(radius, radius - border, d) -
                   smoothstep(radius - border, radius - border - 0.01, d);
      ballsAlpha += edge;
    }

    ballsAlpha = clamp(ballsAlpha, 0.0, 1.0) * clamp(uIntensity, 0.0, 1.0);
    color.rgb = mix(color.rgb, vec3(1.0), ballsAlpha);
    gl_FragColor = color;
  }
`
);
const PAPER_BREAK_REVEAL_FRAGMENT = (
  /* glsl */
  `
  precision mediump float;
  varying vec2 v_texCoord;
  uniform sampler2D uTexture;
  uniform float uTime;
  uniform float uIntensity;

  float noise(float x) {
    return sin(x * 28.0) * 0.035;
  }

  void main(void) {
    vec2 uv = v_texCoord;
    vec4 base = texture2D(uTexture, uv);

    float t = clamp(uTime, 0.0, 1.0);
    float cutCenter = 0.5;
    float wiggle = noise(uv.y + uTime * 3.0) * 0.2 * t;
    float tearLine = cutCenter + wiggle * clamp(uIntensity, 0.0, 1.0);

    float split = 0.3 * t * clamp(uIntensity, 0.0, 1.0);
    vec2 leftUV = uv;
    vec2 rightUV = uv;
    leftUV.x -= split * step(uv.x, tearLine);
    rightUV.x += split * step(tearLine, uv.x);
    leftUV = clamp(leftUV, 0.0, 1.0);
    rightUV = clamp(rightUV, 0.0, 1.0);

    vec4 left = texture2D(uTexture, leftUV);
    vec4 right = texture2D(uTexture, rightUV);
    float cutMask = smoothstep(tearLine - 0.02, tearLine + 0.02, uv.x);
    vec4 broken = mix(left, right, cutMask);

    float edge = smoothstep(0.0, 0.02, abs(uv.x - tearLine)) *
                 (1.0 - smoothstep(0.02, 0.05, abs(uv.x - tearLine)));
    vec3 edgeColor = vec3(1.0) * edge * t;
    broken.rgb += edgeColor;

    gl_FragColor = mix(base, broken, t);
  }
`
);
const CAMERA_MOVE_FRAGMENT = (
  /* glsl */
  `
  precision mediump float;
  varying vec2 v_texCoord;
  uniform sampler2D uTexture;
  uniform float uTime;
  uniform float uIntensity;

  float rand(float x) {
    return fract(sin(x * 12.9898) * 43758.5453);
  }

  vec2 shakeOffset(float time, float intensity) {
    float x = (rand(time * 0.7) - 0.5) * intensity;
    float y = (rand(time * 1.3 + 10.0) - 0.5) * intensity;
    return vec2(x, y);
  }

  void main(void) {
    vec2 uv = v_texCoord;
    float intensity = mix(0.0, 0.04, clamp(uIntensity, 0.0, 1.0));
    vec2 offset = shakeOffset(uTime * 2.0, intensity);
    vec2 uvMoved = clamp(uv + offset, 0.0, 1.0);
    vec4 color = texture2D(uTexture, uvMoved);
    gl_FragColor = color;
  }
`
);
const BLACK_FLASH_FRAGMENT = (
  /* glsl */
  `
  precision mediump float;
  varying vec2 v_texCoord;
  uniform sampler2D uTexture;
  uniform float uTime;
  uniform float uIntensity;

  void main(void) {
    vec2 uv = v_texCoord;
    vec4 base = texture2D(uTexture, uv);
    float duration = 0.3;
    float m = mod(uTime, duration);
    float flash = smoothstep(0.0, duration * 0.5, m) *
                  (1.0 - smoothstep(duration * 0.5, duration, m));
    flash *= clamp(uIntensity, 0.0, 1.0);
    vec3 color = mix(base.rgb, vec3(0.0), flash);
    gl_FragColor = vec4(color, base.a);
  }
`
);
const BRIGHT_PULSE_FRAGMENT = (
  /* glsl */
  `
  precision mediump float;
  varying vec2 v_texCoord;
  uniform sampler2D uTexture;
  uniform float uTime;
  uniform float uIntensity;

  vec4 blur3(sampler2D tex, vec2 uv, vec2 texel) {
    vec4 c = vec4(0.0);
    c += texture2D(tex, uv + texel * vec2(-1.0, -1.0)) * 0.0625;
    c += texture2D(tex, uv + texel * vec2( 0.0, -1.0)) * 0.125;
    c += texture2D(tex, uv + texel * vec2( 1.0, -1.0)) * 0.0625;
    c += texture2D(tex, uv + texel * vec2(-1.0,  0.0)) * 0.125;
    c += texture2D(tex, uv) * 0.25;
    c += texture2D(tex, uv + texel * vec2( 1.0,  0.0)) * 0.125;
    c += texture2D(tex, uv + texel * vec2(-1.0,  1.0)) * 0.0625;
    c += texture2D(tex, uv + texel * vec2( 0.0,  1.0)) * 0.125;
    c += texture2D(tex, uv + texel * vec2( 1.0,  1.0)) * 0.0625;
    return c;
  }

  void main(void) {
    vec2 uv = v_texCoord;
    vec2 texel = vec2(1.0 / 1024.0);
    float pulse = 0.5 + 0.5 * sin(uTime * 3.0);
    float scale = 1.0 + pulse * 0.3 * clamp(uIntensity, 0.0, 1.0);
    vec2 center = vec2(0.5, 0.5);
    vec2 uvScaled = (uv - center) / scale + center;
    uvScaled = clamp(uvScaled, 0.0, 1.0);
    vec4 base = texture2D(uTexture, uvScaled);
    vec4 blurred = blur3(uTexture, uvScaled, texel * 1.5);
    vec4 colorValue = mix(base, blurred, 0.7 * clamp(uIntensity, 0.0, 1.0));
    gl_FragColor = colorValue;
  }
`
);
const RANDOM_ACCENTS_FRAGMENT = (
  /* glsl */
  `
  precision mediump float;
  varying vec2 v_texCoord;
  uniform sampler2D uTexture;
  uniform float uTime;
  uniform float uIntensity;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  vec3 accentColor(float h) {
    vec3 colorA = vec3(1.0, 0.2, 0.6);
    vec3 colorB = vec3(0.2, 0.8, 1.0);
    return mix(colorA, colorB, fract(h * 7.0));
  }

  void main(void) {
    vec2 uv = v_texCoord;
    vec4 base = texture2D(uTexture, uv);
    float density = mix(10.0, 25.0, clamp(uIntensity, 0.0, 1.0));
    vec2 gridUV = floor(uv * density);
    float h = hash(gridUV);

    vec2 offset = vec2(fract(h * 13.3), fract(h * 7.7));
    vec2 accentUV = fract(uv * density) - offset;
    float dist = length(accentUV);
    float size = mix(0.2, 0.08, clamp(uIntensity, 0.0, 1.0));
    float accent = smoothstep(size, 0.0, dist);
    accent *= 0.6 + 0.4 * sin(uTime * 10.0 + h * 6.2831);
    vec3 color = accentColor(h) * accent * clamp(uIntensity, 0.0, 1.0);
    float alpha = accent;
    gl_FragColor = vec4(color + base.rgb, max(base.a, alpha));
  }
`
);
const GRAFFITI_FRAGMENT = (
  /* glsl */
  `
  precision mediump float;
  varying vec2 v_texCoord;
  uniform sampler2D uTexture;
  uniform float uTime;
  uniform float uIntensity;

  float rand(vec2 st) {
    return fract(sin(dot(st, vec2(12.9898,78.233))) * 43758.5453123);
  }

  float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    float a = rand(i);
    float b = rand(i + vec2(1.0, 0.0));
    float c = rand(i + vec2(0.0, 1.0));
    float d = rand(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) +
           (c - a) * u.y * (1.0 - u.x) +
           (d - b) * u.x * u.y;
  }

  float spray(vec2 st, float radius) {
    float dist = length(st - vec2(0.28, 0.5));
    float base = smoothstep(radius, radius - 0.06, dist);
    float speckle =
      noise(st * 45.0 + uTime * 3.0) *
      noise(st * 90.0);
    return clamp(base + speckle * 0.7, 0.0, 1.0);
  }

  float drips(vec2 st, float mask) {
    float column = noise(vec2(st.x * 25.0, 0.0));
    float drip =
      smoothstep(0.3, 0.7, column) *
      smoothstep(0.1, 1.0, 1.0 - st.y);
    float flow =
      noise(vec2(st.x * 35.0, st.y * 6.0 + uTime * 2.5));
    return drip * flow * mask;
  }

  void main(void) {
    vec2 uv = v_texCoord;
    vec4 base = texture2D(uTexture, uv);
    vec3 graffitiColor = vec3(1.0, 0.0, 0.5);
    float reveal = clamp(uIntensity, 0.0, 1.0);
    float sprayMask = spray(uv, 0.35 * reveal);
    float dripMask = drips(uv, sprayMask) * reveal;
    float graffitiMask = clamp(sprayMask + dripMask * 1.3, 0.0, 1.0);
    vec3 graffiti = graffitiColor * graffitiMask;
    vec3 Color = base.rgb + graffiti;
    gl_FragColor = vec4(Color, base.a);
  }
`
);
const EFFECTS = {
  sepia: {
    key: "sepia",
    label: "Sepia",
    description: "Warm vintage sepia tone.",
    fragment: SEPIA_FRAGMENT,
    defaultUniforms: { uIntensity: { type: "float", value: 1 } }
  },
  vignette: {
    key: "vignette",
    label: "Vignette",
    description: "Darken edges to focus center.",
    fragment: VIGNETTE_FRAGMENT,
    defaultUniforms: { uIntensity: { type: "float", value: 0.8 } }
  },
  pixelate: {
    key: "pixelate",
    label: "Pixelate",
    description: "Blocky pixelation effect.",
    fragment: PIXELATE_FRAGMENT,
    defaultUniforms: { uIntensity: { type: "float", value: 0.7 } }
  },
  warp: {
    key: "warp",
    label: "Warp",
    description: "Sinusoidal warp of the frame.",
    fragment: WARP_FRAGMENT,
    defaultUniforms: { uIntensity: { type: "float", value: 0.8 } }
  },
  glitch: {
    key: "glitch",
    label: "Glitch",
    description: "RGB slice and noise glitch.",
    fragment: GLITCH_FRAGMENT,
    defaultUniforms: { uIntensity: { type: "float", value: 0.6 } }
  },
  rgbShift: {
    key: "rgbShift",
    label: "RGB Shift",
    description: "Chromatic aberration style RGB split.",
    fragment: RGB_SHIFT_FRAGMENT,
    defaultUniforms: { uIntensity: { type: "float", value: 0.7 } }
  },
  halftone: {
    key: "halftone",
    label: "Halftone",
    description: "Animated halftone dot shading.",
    fragment: HALFTONE_FRAGMENT,
    defaultUniforms: { uIntensity: { type: "float", value: 0.8 } }
  },
  hueShift: {
    key: "hueShift",
    label: "Hue Shift",
    description: "Animated hue rotation of colors.",
    fragment: HUE_SHIFT_FRAGMENT,
    defaultUniforms: { uIntensity: { type: "float", value: 1 } }
  },
  waveDistort: {
    key: "waveDistort",
    label: "Wave Distort",
    description: "Horizontal wave distortion.",
    fragment: WAVE_DISTORT_FRAGMENT,
    defaultUniforms: { uIntensity: { type: "float", value: 0.8 } }
  },
  tvScanlines: {
    key: "tvScanlines",
    label: "TV Scanlines",
    description: "Old TV scanlines with subtle noise.",
    fragment: TV_SCANLINES_FRAGMENT,
    defaultUniforms: { uIntensity: { type: "float", value: 0.7 } }
  },
  hdr: {
    key: "hdr",
    label: "HDR Boost",
    description: "Exposure and contrast HDR-style boost.",
    fragment: HDR_FRAGMENT,
    defaultUniforms: { uIntensity: { type: "float", value: 0.7 } }
  },
  retro70s: {
    key: "retro70s",
    label: "Retro 70s",
    description: "Grainy, faded, vignetted retro film look.",
    fragment: RETRO_70S_FRAGMENT,
    defaultUniforms: { uIntensity: { type: "float", value: 0.8 } }
  },
  bubbleSparkles: {
    key: "bubbleSparkles",
    label: "Bubble Sparkles",
    description: "Floating bubble-like sparkles.",
    fragment: BUBBLE_SPARKLES_FRAGMENT,
    defaultUniforms: { uIntensity: { type: "float", value: 0.8 } }
  },
  heartSparkles: {
    key: "heartSparkles",
    label: "Heart Sparkles",
    description: "Animated heart-shaped sparkles.",
    fragment: HEART_SPARKLES_FRAGMENT,
    defaultUniforms: { uIntensity: { type: "float", value: 0.9 } }
  },
  butterflySparkles: {
    key: "butterflySparkles",
    label: "Butterfly Sparkles",
    description: "Animated butterfly-shaped sparkles.",
    fragment: BUTTERFLY_SPARKLES_FRAGMENT,
    defaultUniforms: { uIntensity: { type: "float", value: 0.9 } }
  },
  lightning: {
    key: "lightning",
    label: "Lightning",
    description: "Radial lightning strike with flash.",
    fragment: LIGHTNING_FRAGMENT,
    defaultUniforms: { uIntensity: { type: "float", value: 1 } }
  },
  lightningVeins: {
    key: "lightningVeins",
    label: "Lightning Veins",
    description: "Energy veins radiating from center.",
    fragment: LIGHTNING_VEINS_FRAGMENT,
    defaultUniforms: { uIntensity: { type: "float", value: 1 } }
  },
  sparks: {
    key: "sparks",
    label: "Sparks",
    description: "Random colored sparks overlay.",
    fragment: SPARKS_FRAGMENT,
    defaultUniforms: { uIntensity: { type: "float", value: 0.9 } }
  },
  laser: {
    key: "laser",
    label: "Laser",
    description: "Horizontal laser beam across the frame.",
    fragment: LASER_FRAGMENT,
    defaultUniforms: { uIntensity: { type: "float", value: 0.8 } }
  },
  waterReflection: {
    key: "waterReflection",
    label: "Water Reflection",
    description: "Water reflection in the lower half of the frame.",
    fragment: WATER_REFLECTION_FRAGMENT,
    defaultUniforms: { uIntensity: { type: "float", value: 0.7 } }
  },
  bouncingBalls: {
    key: "bouncingBalls",
    label: "Bouncing Balls",
    description: "Bouncing light balls over the frame.",
    fragment: BOUNCING_BALLS_FRAGMENT,
    defaultUniforms: { uIntensity: { type: "float", value: 0.8 } }
  },
  paperBreakReveal: {
    key: "paperBreakReveal",
    label: "Paper Break Reveal",
    description: "Tearing paper style reveal.",
    fragment: PAPER_BREAK_REVEAL_FRAGMENT,
    defaultUniforms: { uIntensity: { type: "float", value: 1 } }
  },
  cameraMove: {
    key: "cameraMove",
    label: "Camera Move",
    description: "Camera shake / movement effect.",
    fragment: CAMERA_MOVE_FRAGMENT,
    defaultUniforms: { uIntensity: { type: "float", value: 0.7 } }
  },
  blackFlash: {
    key: "blackFlash",
    label: "Black Flash",
    description: "Periodic flash to black.",
    fragment: BLACK_FLASH_FRAGMENT,
    defaultUniforms: { uIntensity: { type: "float", value: 0.7 } }
  },
  brightPulse: {
    key: "brightPulse",
    label: "Bright Pulse",
    description: "Bright pulse with subtle blur.",
    fragment: BRIGHT_PULSE_FRAGMENT,
    defaultUniforms: { uIntensity: { type: "float", value: 0.8 } }
  },
  randomAccents: {
    key: "randomAccents",
    label: "Random Accents",
    description: "Random colored accent blobs.",
    fragment: RANDOM_ACCENTS_FRAGMENT,
    defaultUniforms: { uIntensity: { type: "float", value: 0.8 } }
  },
  graffiti: {
    key: "graffiti",
    label: "Graffiti",
    description: "Graffiti spray paint and drips.",
    fragment: GRAFFITI_FRAGMENT,
    defaultUniforms: { uIntensity: { type: "float", value: 1 } }
  }
};
const EFFECT_OPTIONS = Object.values(EFFECTS).map((cfg) => ({
  key: cfg.key,
  label: cfg.label,
  description: cfg.description
}));
const useEffectPanel = ({
  selectedElement,
  addElement,
  updateElement
}) => {
  const selectedEffectKey = useMemo(() => {
    var _a;
    if (!selectedElement) return null;
    if (selectedElement.getType() !== TIMELINE_ELEMENT_TYPE.EFFECT) return null;
    const effectElement = selectedElement;
    const props = (_a = effectElement.getProps) == null ? void 0 : _a.call(effectElement);
    const key = props == null ? void 0 : props.effectKey;
    return key ?? null;
  }, [selectedElement]);
  const handleAddEffect = (key) => {
    const effect = new EffectElement(key);
    addElement(effect);
  };
  const handleUpdateEffect = (key) => {
    if (!selectedElement) return;
    if (selectedElement.getType() !== TIMELINE_ELEMENT_TYPE.EFFECT) return;
    const effectElement = selectedElement;
    effectElement.setEffectKey(key);
    updateElement(effectElement);
  };
  return {
    selectedEffectKey,
    handleAddEffect,
    handleUpdateEffect
  };
};
let canvas = null;
let gl = null;
const PREVIEW_WIDTH = 160;
const PREVIEW_HEIGHT = 90;
const cache = /* @__PURE__ */ new Map();
const pending = /* @__PURE__ */ new Map();
function ensureContext() {
  if (typeof window === "undefined") return null;
  if (gl && canvas) {
    return gl;
  }
  canvas = document.createElement("canvas");
  canvas.width = PREVIEW_WIDTH;
  canvas.height = PREVIEW_HEIGHT;
  canvas.style.position = "absolute";
  canvas.style.left = "-9999px";
  canvas.style.top = "-9999px";
  canvas.style.width = `${PREVIEW_WIDTH}px`;
  canvas.style.height = `${PREVIEW_HEIGHT}px`;
  canvas.style.pointerEvents = "none";
  canvas.style.opacity = "0";
  document.body.appendChild(canvas);
  gl = canvas.getContext("webgl", {
    preserveDrawingBuffer: true
  }) || canvas.getContext("experimental-webgl", {
    preserveDrawingBuffer: true
  });
  if (!gl) {
    canvas.remove();
    canvas = null;
    return null;
  }
  return gl;
}
function createShader(gl2, type, source) {
  const shader = gl2.createShader(type);
  if (!shader) return null;
  gl2.shaderSource(shader, source);
  gl2.compileShader(shader);
  const ok = gl2.getShaderParameter(shader, gl2.COMPILE_STATUS);
  if (!ok) {
    gl2.deleteShader(shader);
    return null;
  }
  return shader;
}
async function renderEffectToDataUrl(effectKey) {
  const glCtx = ensureContext();
  if (!glCtx || !canvas) {
    return "";
  }
  const effect = EFFECTS[effectKey];
  if (!effect) return "";
  const vertexShader = createShader(glCtx, glCtx.VERTEX_SHADER, BASIC_VERTEX_SHADER);
  const fragmentShader = createShader(glCtx, glCtx.FRAGMENT_SHADER, effect.fragment);
  if (!vertexShader || !fragmentShader) {
    return "";
  }
  const program = glCtx.createProgram();
  if (!program) {
    glCtx.deleteShader(vertexShader);
    glCtx.deleteShader(fragmentShader);
    return "";
  }
  glCtx.attachShader(program, vertexShader);
  glCtx.attachShader(program, fragmentShader);
  glCtx.linkProgram(program);
  const linked = glCtx.getProgramParameter(program, glCtx.LINK_STATUS);
  if (!linked) {
    glCtx.deleteProgram(program);
    glCtx.deleteShader(vertexShader);
    glCtx.deleteShader(fragmentShader);
    return "";
  }
  glCtx.useProgram(program);
  const positionLocation = glCtx.getAttribLocation(program, "a_position");
  const texCoordLocation = glCtx.getAttribLocation(program, "a_texCoord");
  const positionBuffer = glCtx.createBuffer();
  glCtx.bindBuffer(glCtx.ARRAY_BUFFER, positionBuffer);
  const positions = new Float32Array([
    -1,
    -1,
    1,
    -1,
    -1,
    1,
    -1,
    1,
    1,
    -1,
    1,
    1
  ]);
  glCtx.bufferData(glCtx.ARRAY_BUFFER, positions, glCtx.STATIC_DRAW);
  glCtx.enableVertexAttribArray(positionLocation);
  glCtx.vertexAttribPointer(positionLocation, 2, glCtx.FLOAT, false, 0, 0);
  const texCoordBuffer = glCtx.createBuffer();
  glCtx.bindBuffer(glCtx.ARRAY_BUFFER, texCoordBuffer);
  const texCoords = new Float32Array([
    0,
    0,
    1,
    0,
    0,
    1,
    0,
    1,
    1,
    0,
    1,
    1
  ]);
  glCtx.bufferData(glCtx.ARRAY_BUFFER, texCoords, glCtx.STATIC_DRAW);
  glCtx.enableVertexAttribArray(texCoordLocation);
  glCtx.vertexAttribPointer(texCoordLocation, 2, glCtx.FLOAT, false, 0, 0);
  const texture = glCtx.createTexture();
  glCtx.bindTexture(glCtx.TEXTURE_2D, texture);
  const size = 64;
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const fx = x / (size - 1);
      const fy = y / (size - 1);
      data[i + 0] = fx * 255;
      data[i + 1] = fy * 255;
      data[i + 2] = 200;
      data[i + 3] = 255;
    }
  }
  glCtx.texImage2D(
    glCtx.TEXTURE_2D,
    0,
    glCtx.RGBA,
    size,
    size,
    0,
    glCtx.RGBA,
    glCtx.UNSIGNED_BYTE,
    data
  );
  glCtx.texParameteri(glCtx.TEXTURE_2D, glCtx.TEXTURE_MIN_FILTER, glCtx.LINEAR);
  glCtx.texParameteri(glCtx.TEXTURE_2D, glCtx.TEXTURE_MAG_FILTER, glCtx.LINEAR);
  glCtx.texParameteri(glCtx.TEXTURE_2D, glCtx.TEXTURE_WRAP_S, glCtx.CLAMP_TO_EDGE);
  glCtx.texParameteri(glCtx.TEXTURE_2D, glCtx.TEXTURE_WRAP_T, glCtx.CLAMP_TO_EDGE);
  const textureLocation = glCtx.getUniformLocation(program, "uTexture");
  if (textureLocation) {
    glCtx.uniform1i(textureLocation, 0);
  }
  const timeLocation = glCtx.getUniformLocation(program, "uTime");
  if (timeLocation) {
    glCtx.uniform1f(timeLocation, 1);
  }
  const intensityLocation = glCtx.getUniformLocation(program, "uIntensity");
  if (intensityLocation) {
    glCtx.uniform1f(intensityLocation, 0.9);
  }
  const resolutionLocation = glCtx.getUniformLocation(program, "uResolution");
  if (resolutionLocation) {
    glCtx.uniform2f(resolutionLocation, canvas.width, canvas.height);
  }
  glCtx.viewport(0, 0, canvas.width, canvas.height);
  glCtx.clearColor(0, 0, 0, 1);
  glCtx.clear(glCtx.COLOR_BUFFER_BIT);
  glCtx.drawArrays(glCtx.TRIANGLES, 0, 6);
  const url = canvas.toDataURL("image/png");
  glCtx.deleteTexture(texture);
  glCtx.deleteBuffer(positionBuffer);
  glCtx.deleteBuffer(texCoordBuffer);
  glCtx.deleteProgram(program);
  glCtx.deleteShader(vertexShader);
  glCtx.deleteShader(fragmentShader);
  return url;
}
function getEffectPreviewForEffect(effectKey) {
  if (cache.has(effectKey)) {
    return Promise.resolve(cache.get(effectKey));
  }
  if (pending.has(effectKey)) {
    return pending.get(effectKey);
  }
  const promise = (async () => {
    const url = await renderEffectToDataUrl(effectKey);
    if (url) {
      cache.set(effectKey, url);
    }
    pending.delete(effectKey);
    return url;
  })();
  pending.set(effectKey, promise);
  return promise;
}
function EffectPreview({ effectKey, label }) {
  const [src, setSrc] = useState(null);
  useEffect(() => {
    let cancelled = false;
    if (typeof window === "undefined") {
      return;
    }
    getEffectPreviewForEffect(effectKey).then((url) => {
      if (!cancelled && url) {
        setSrc(url);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [effectKey]);
  if (!src) {
    return /* @__PURE__ */ jsx("div", { className: "effect-preview-box-inner flex items-center justify-center text-xs text-neutral-400", children: label });
  }
  return /* @__PURE__ */ jsx(
    "img",
    {
      src,
      alt: label,
      className: "effect-preview-box-inner object-cover",
      loading: "lazy"
    }
  );
}
function EffectStylePanel({
  selectedElement,
  addElement,
  updateElement
}) {
  const { selectedEffectKey, handleAddEffect, handleUpdateEffect } = useEffectPanel({
    selectedElement,
    addElement,
    updateElement
  });
  const handleClick = (key) => {
    if (selectedEffectKey) {
      handleUpdateEffect(key);
    } else {
      handleAddEffect(key);
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "panel-container", children: [
    /* @__PURE__ */ jsx("div", { className: "panel-title", children: "Effect Style" }),
    /* @__PURE__ */ jsx("div", { className: "panel-section", children: /* @__PURE__ */ jsx("div", { className: "effect-grid", children: EFFECT_OPTIONS.map((effect) => {
      const isSelected = effect.key === selectedEffectKey;
      return /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          className: `effect-preview-card${isSelected ? " effect-preview-card-selected" : ""}`,
          onClick: () => handleClick(effect.key),
          children: /* @__PURE__ */ jsxs("div", { className: "effect-preview-box", children: [
            /* @__PURE__ */ jsx(EffectPreview, { effectKey: effect.key, label: effect.label }),
            /* @__PURE__ */ jsx("div", { className: "effect-preview-label", children: effect.label })
          ] })
        },
        effect.key
      );
    }) }) })
  ] });
}
function EffectStylePanelContainer({
  selectedElement,
  addElement,
  updateElement
}) {
  return /* @__PURE__ */ jsx(
    EffectStylePanel,
    {
      selectedElement,
      addElement,
      updateElement
    }
  );
}
const formatTime = (seconds) => {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00.00";
  const totalMs = Math.round(seconds * 1e3);
  const totalSeconds = Math.floor(totalMs / 1e3);
  const minutes = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  const ms = Math.floor(totalMs % 1e3 / 10);
  const pad = (n, l = 2) => String(n).padStart(l, "0");
  return `${minutes}:${pad(secs)}.${pad(ms)}`;
};
function CaptionsPanel({
  captions,
  addCaption,
  splitCaption,
  deleteCaption,
  updateCaption
}) {
  return /* @__PURE__ */ jsxs("div", { className: "panel-container captions-panel", children: [
    /* @__PURE__ */ jsxs("div", { className: "captions-panel-header", children: [
      /* @__PURE__ */ jsx("h3", { className: "panel-title", children: "Subtitles" }),
      /* @__PURE__ */ jsxs("div", { className: "captions-panel-header-meta", children: [
        captions.length === 0 ? /* @__PURE__ */ jsx("span", { className: "captions-panel-count", children: "No subtitles yet" }) : null,
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: addCaption,
            className: "btn-primary captions-panel-add-button",
            title: "Add subtitle",
            children: "Add subtitle"
          }
        )
      ] })
    ] }),
    captions.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "panel-section captions-panel-empty", children: [
      /* @__PURE__ */ jsx("p", { className: "captions-panel-empty-title", children: "Start your first subtitle" }),
      /* @__PURE__ */ jsx("p", { className: "captions-panel-empty-subtitle", children: "Use the button above to add the first subtitle block for the active track." }),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: addCaption,
          className: "btn-primary captions-panel-empty-button",
          title: "Add first caption",
          children: "Add subtitle"
        }
      )
    ] }) : /* @__PURE__ */ jsx("div", { className: "panel-section captions-panel-list", children: captions.map((caption, i) => {
      return /* @__PURE__ */ jsxs(
        "div",
        {
          className: "captions-panel-item",
          children: [
            /* @__PURE__ */ jsxs("div", { className: "captions-panel-item-header", children: [
              /* @__PURE__ */ jsx("span", { className: "captions-panel-time captions-panel-time-start", children: formatTime(caption.s) }),
              /* @__PURE__ */ jsx("span", { className: "captions-panel-time captions-panel-time-end", children: formatTime(caption.e) }),
              caption.isCustom ? /* @__PURE__ */ jsx(
                "span",
                {
                  className: "captions-panel-custom",
                  title: "This caption overrides track defaults",
                  children: "Custom"
                }
              ) : null
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "captions-panel-item-body", children: [
              /* @__PURE__ */ jsx(
                "textarea",
                {
                  placeholder: "Enter caption text",
                  value: caption.t,
                  onChange: (e) => updateCaption(i, { ...caption, t: e.target.value }),
                  className: "input-dark captions-panel-textarea"
                }
              ),
              /* @__PURE__ */ jsxs("div", { className: "captions-panel-actions", children: [
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => splitCaption(i),
                    className: "btn-ghost captions-panel-action-button",
                    title: "Split caption at midpoint",
                    children: /* @__PURE__ */ jsx(Scissors, { className: "icon-sm" })
                  }
                ),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => deleteCaption(i),
                    className: "btn-ghost captions-panel-action-button",
                    title: "Delete caption",
                    children: /* @__PURE__ */ jsx(
                      Trash2,
                      {
                        className: "icon-sm",
                        color: "var(--color-red-500)"
                      }
                    )
                  }
                )
              ] })
            ] })
          ]
        },
        i
      );
    }) })
  ] });
}
const HIGHLIGHT_BG_FONT_SIZE = 46;
const WORD_BY_WORD_FONT_SIZE = 46;
const WORD_BY_WORD_WITH_BG_FONT_SIZE = 46;
const OUTLINE_ONLY_FONT_SIZE = 42;
const SOFT_BOX_FONT_SIZE = 40;
const HIGHLIGHT_BG_GEOMETRY = computeCaptionGeometry(HIGHLIGHT_BG_FONT_SIZE, CAPTION_STYLE.WORD_BG_HIGHLIGHT);
const WORD_BY_WORD_GEOMETRY = computeCaptionGeometry(WORD_BY_WORD_FONT_SIZE, CAPTION_STYLE.WORD_BY_WORD);
const WORD_BY_WORD_WITH_BG_GEOMETRY = computeCaptionGeometry(WORD_BY_WORD_WITH_BG_FONT_SIZE, CAPTION_STYLE.WORD_BY_WORD_WITH_BG);
const OUTLINE_ONLY_GEOMETRY = computeCaptionGeometry(OUTLINE_ONLY_FONT_SIZE, CAPTION_STYLE.OUTLINE_ONLY);
const SOFT_BOX_GEOMETRY = computeCaptionGeometry(SOFT_BOX_FONT_SIZE, CAPTION_STYLE.SOFT_BOX);
const CAPTION_PROPS = {
  [CAPTION_STYLE.WORD_BG_HIGHLIGHT]: {
    font: {
      size: HIGHLIGHT_BG_FONT_SIZE,
      weight: 700,
      family: "Bangers"
    },
    colors: {
      text: "#ffffff",
      highlight: "#ff4081",
      bgColor: "#444444"
    },
    lineWidth: HIGHLIGHT_BG_GEOMETRY.lineWidth,
    rectProps: HIGHLIGHT_BG_GEOMETRY.rectProps,
    stroke: "#000000",
    fontWeight: 700,
    shadowOffset: [-1, 1],
    shadowColor: "#000000"
  },
  [CAPTION_STYLE.WORD_BY_WORD]: {
    font: {
      size: WORD_BY_WORD_FONT_SIZE,
      weight: 700,
      family: "Bangers"
    },
    colors: {
      text: "#ffffff",
      highlight: "#ff4081",
      bgColor: "#444444"
    },
    lineWidth: WORD_BY_WORD_GEOMETRY.lineWidth,
    rectProps: WORD_BY_WORD_GEOMETRY.rectProps,
    stroke: "#000000",
    shadowOffset: [-1, 1],
    shadowColor: "#000000",
    shadowBlur: 5
  },
  [CAPTION_STYLE.WORD_BY_WORD_WITH_BG]: {
    font: {
      size: WORD_BY_WORD_WITH_BG_FONT_SIZE,
      weight: 700,
      family: "Bangers"
    },
    colors: {
      text: "#ffffff",
      highlight: "#ff4081",
      bgColor: "#444444"
    },
    lineWidth: WORD_BY_WORD_WITH_BG_GEOMETRY.lineWidth,
    rectProps: WORD_BY_WORD_WITH_BG_GEOMETRY.rectProps,
    shadowOffset: [-1, 1],
    shadowColor: "#000000",
    shadowBlur: 5
  },
  [CAPTION_STYLE.OUTLINE_ONLY]: {
    font: {
      size: OUTLINE_ONLY_FONT_SIZE,
      weight: 600,
      family: "Arial"
    },
    colors: {
      text: "#ffffff",
      highlight: "#ff4081",
      bgColor: "#000000"
    },
    lineWidth: OUTLINE_ONLY_GEOMETRY.lineWidth,
    rectProps: OUTLINE_ONLY_GEOMETRY.rectProps,
    stroke: "#000000",
    fontWeight: 600,
    shadowOffset: [0, 0],
    shadowColor: "#000000",
    shadowBlur: 0
  },
  [CAPTION_STYLE.SOFT_BOX]: {
    font: {
      size: SOFT_BOX_FONT_SIZE,
      weight: 600,
      family: "Montserrat"
    },
    colors: {
      text: "#ffffff",
      highlight: "#ff4081",
      bgColor: "#333333"
    },
    lineWidth: SOFT_BOX_GEOMETRY.lineWidth,
    rectProps: SOFT_BOX_GEOMETRY.rectProps,
    stroke: "#000000",
    fontWeight: 600,
    shadowOffset: [-1, 1],
    shadowColor: "rgba(0,0,0,0.3)",
    shadowBlur: 3
  }
};
const useCaptionsPanel = () => {
  const [captions, setCaptions] = useState([]);
  const captionsTrack = useRef(null);
  const { editor } = useTimelineContext();
  const resolveCaptionTracks = () => {
    var _a;
    return (((_a = editor.getTimelineData()) == null ? void 0 : _a.tracks) || []).filter(
      (track) => track.getType() === "caption"
    );
  };
  const fetchCaptions = async () => {
    const captionTracks = resolveCaptionTracks();
    const editorCaptionsTrack = captionTracks[0];
    if (!editorCaptionsTrack) {
      captionsTrack.current = null;
      setCaptions([]);
      return;
    }
    captionsTrack.current = editorCaptionsTrack;
    setCaptions(
      editorCaptionsTrack.getElements().map((element) => {
        var _a;
        return {
          s: element.getStart(),
          e: element.getEnd(),
          t: element.getText(),
          isCustom: ((_a = element.getProps()) == null ? void 0 : _a.useTrackDefaults) === false
        };
      })
    );
  };
  useEffect(() => {
    fetchCaptions();
  }, []);
  const checkCaptionsTrack = () => {
    var _a;
    if (!captionsTrack.current) {
      captionsTrack.current = editor.addTrack("Subtitles", "caption");
      const props = {
        capStyle: CAPTION_STYLE.WORD_BG_HIGHLIGHT,
        ...CAPTION_PROPS[CAPTION_STYLE.WORD_BG_HIGHLIGHT],
        x: 0,
        y: 200
      };
      (_a = captionsTrack.current) == null ? void 0 : _a.setProps(props);
    }
  };
  const addCaption = () => {
    const newCaption = { s: 0, e: 0, t: "New Caption", isCustom: false };
    if (captions.length > 0) {
      newCaption.s = captions[captions.length - 1].e;
    }
    newCaption.e = newCaption.s + 1;
    setCaptions([...captions, newCaption]);
    checkCaptionsTrack();
    const captionElement = new CaptionElement(
      newCaption.t,
      newCaption.s,
      newCaption.e
    );
    editor.addElementToTrack(captionsTrack.current, captionElement);
  };
  const splitCaption = async (index) => {
    if (captionsTrack.current) {
      const element = captionsTrack.current.getElements()[index];
      const splitResult = await editor.splitElement(
        element,
        element.getStart() + element.getDuration() / 2
      );
      if (splitResult.success) {
        fetchCaptions();
      }
    }
  };
  const deleteCaption = (index) => {
    setCaptions(captions.filter((_, i) => i !== index));
    if (captionsTrack.current) {
      editor.removeElement(captionsTrack.current.getElements()[index]);
    }
  };
  const updateCaption = (index, caption) => {
    setCaptions(captions.map((sub, i) => i === index ? caption : sub));
    if (captionsTrack.current) {
      const element = captionsTrack.current.getElements()[index];
      element.setText(caption.t);
      editor.updateElement(element);
    }
  };
  return {
    captions,
    addCaption,
    splitCaption,
    deleteCaption,
    updateCaption
  };
};
function CaptionsPanelContainer() {
  const captionsPanelProps = useCaptionsPanel();
  return /* @__PURE__ */ jsx(CaptionsPanel, { ...captionsPanelProps });
}
const DEFAULT_IMAGE_DURATION = 5;
function GenerateMediaPanelContainer({
  videoResolution,
  addElement,
  studioConfig
}) {
  var _a, _b, _c;
  const { getCurrentTime } = useLivePlayerContext();
  const [tab, setTab] = useState("image");
  const [prompt2, setPrompt] = useState("");
  const [selectedEndpointId, setSelectedEndpointId] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(null);
  const imageService = studioConfig == null ? void 0 : studioConfig.imageGenerationService;
  const videoService = studioConfig == null ? void 0 : studioConfig.videoGenerationService;
  const hasAnyService = !!imageService || !!videoService;
  const imageModels = ((_a = imageService == null ? void 0 : imageService.getAvailableModels) == null ? void 0 : _a.call(imageService)) ?? [];
  const videoModels = ((_b = videoService == null ? void 0 : videoService.getAvailableModels) == null ? void 0 : _b.call(videoService)) ?? [];
  const endpoints = tab === "image" ? imageModels : videoModels;
  const defaultEndpointId = ((_c = endpoints[0]) == null ? void 0 : _c.endpointId) ?? "";
  const selectedEndpoint = endpoints.find((endpoint) => endpoint.endpointId === selectedEndpointId) ?? endpoints[0];
  const selectedProvider = selectedEndpoint == null ? void 0 : selectedEndpoint.provider;
  useEffect(() => {
    if (!selectedEndpointId && defaultEndpointId) {
      setSelectedEndpointId(defaultEndpointId);
    }
  }, [tab, defaultEndpointId, selectedEndpointId]);
  const pollStatus = useCallback(
    async (requestId) => {
      const service = tab === "image" ? imageService : videoService;
      if (!service) return;
      const interval = setInterval(async () => {
        try {
          const result = await service.getRequestStatus(requestId);
          if (result.status === "completed" && result.url) {
            clearInterval(interval);
            setIsGenerating(false);
            setStatus(null);
            setError(null);
            const currentTime = getCurrentTime();
            const duration = result.duration ?? DEFAULT_IMAGE_DURATION;
            if (tab === "image") {
              const element = new ImageElement(result.url, videoResolution);
              element.setStart(currentTime);
              element.setEnd(currentTime + duration);
              addElement(element);
            } else {
              const element = new VideoElement(result.url, videoResolution);
              element.setStart(currentTime);
              element.setEnd(currentTime + duration);
              addElement(element);
            }
          } else if (result.status === "failed") {
            clearInterval(interval);
            setIsGenerating(false);
            setStatus(null);
            setError(result.error ?? "Generation failed");
          }
        } catch {
        }
      }, 3e3);
      return () => clearInterval(interval);
    },
    [tab, imageService, videoService, getCurrentTime, videoResolution, addElement]
  );
  const handleGenerate = useCallback(async () => {
    if (!prompt2.trim()) {
      setError("Enter a prompt");
      return;
    }
    if (tab === "image" && !imageService) {
      setError("Image generation not configured");
      return;
    }
    if (tab === "video" && !videoService) {
      setError("Video generation not configured");
      return;
    }
    setIsGenerating(true);
    setError(null);
    setStatus("Starting...");
    try {
      const endpointId = selectedEndpointId || defaultEndpointId;
      const provider = selectedProvider;
      if (!endpointId || !provider) {
        setError("No model is configured for this tab");
        setIsGenerating(false);
        setStatus(null);
        return;
      }
      if (tab === "image" && imageService) {
        const requestId = await imageService.generateImage({
          provider,
          endpointId,
          prompt: prompt2.trim()
        });
        if (requestId) {
          setStatus("Generating image...");
          pollStatus(requestId);
        }
      } else if (tab === "video" && videoService) {
        const requestId = await videoService.generateVideo({
          provider,
          endpointId,
          prompt: prompt2.trim()
        });
        if (requestId) {
          setStatus("Generating video (this may take several minutes)...");
          pollStatus(requestId);
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Generation failed";
      setError(msg);
      setIsGenerating(false);
      setStatus(null);
    }
  }, [
    tab,
    prompt2,
    selectedEndpointId,
    defaultEndpointId,
    imageService,
    videoService,
    pollStatus,
    selectedProvider
  ]);
  if (!hasAnyService) {
    return /* @__PURE__ */ jsx("div", { className: "panel-container", children: /* @__PURE__ */ jsx("p", { className: "empty-state-text", children: "Image and video generation require configuration. Add imageGenerationService and videoGenerationService to StudioConfig." }) });
  }
  return /* @__PURE__ */ jsx("div", { className: "panel-container", children: /* @__PURE__ */ jsxs("div", { className: "panel-section", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex gap-2 mb-2", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          className: `btn-ghost ${tab === "image" ? "active" : ""}`,
          onClick: () => setTab("image"),
          disabled: !imageService,
          children: "Image"
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          className: `btn-ghost ${tab === "video" ? "active" : ""}`,
          onClick: () => setTab("video"),
          disabled: !videoService,
          children: "Video"
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mb-2", children: [
      /* @__PURE__ */ jsx("label", { className: "block text-sm mb-1", children: "Model" }),
      /* @__PURE__ */ jsx(
        "select",
        {
          className: "w-full p-2 border rounded",
          value: selectedEndpointId,
          onChange: (e) => setSelectedEndpointId(e.target.value),
          disabled: isGenerating,
          children: endpoints.map((ep) => /* @__PURE__ */ jsx("option", { value: ep.endpointId, children: ep.label }, ep.endpointId))
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mb-2", children: [
      /* @__PURE__ */ jsx("label", { className: "block text-sm mb-1", children: "Prompt" }),
      /* @__PURE__ */ jsx(
        "textarea",
        {
          className: "w-full p-2 border rounded min-h-[80px]",
          value: prompt2,
          onChange: (e) => setPrompt(e.target.value),
          placeholder: "Describe the image or video you want...",
          disabled: isGenerating
        }
      )
    ] }),
    error && /* @__PURE__ */ jsx("div", { className: "mb-2 text-red-600 text-sm", children: error }),
    status && /* @__PURE__ */ jsx("div", { className: "mb-2 text-sm text-gray-600", children: status }),
    /* @__PURE__ */ jsx(
      "button",
      {
        type: "button",
        className: "btn-primary w-full",
        onClick: handleGenerate,
        disabled: isGenerating || !prompt2.trim(),
        children: isGenerating ? "Generating..." : `Generate ${tab}`
      }
    )
  ] }) });
}
const DEFAULT_PROJECT_TEMPLATES = [
  {
    id: "blank-project",
    name: "Blank Project",
    description: "Start from a clean timeline.",
    category: "blank",
    project: {
      tracks: [],
      version: 1,
      metadata: {
        profile: "default",
        templateId: "blank-project"
      }
    }
  },
  {
    id: "edu-lesson",
    name: "Lesson Template",
    description: "Intro, content, and summary sections for educational videos.",
    category: "edu",
    project: {
      version: 1,
      backgroundColor: "#0f172a",
      metadata: {
        profile: "edu",
        templateId: "edu-lesson",
        chapters: [
          { id: "chapter-intro", title: "Introduction", time: 0 },
          { id: "chapter-content", title: "Main Lesson", time: 20 },
          { id: "chapter-summary", title: "Summary", time: 45 }
        ]
      },
      tracks: [
        {
          id: "t-edu-text",
          name: "Lesson Text",
          type: TRACK_TYPES.ELEMENT,
          elements: [
            {
              id: "e-edu-title",
              trackId: "t-edu-text",
              type: "text",
              name: "Title",
              s: 0,
              e: 6,
              props: {
                text: "Lesson Title",
                fontSize: 58,
                fill: "#ffffff"
              }
            }
          ]
        }
      ]
    }
  },
  {
    id: "demo-screen",
    name: "Screen Demo",
    description: "Template optimized for product demonstrations.",
    category: "demo",
    project: {
      version: 1,
      metadata: {
        profile: "demo",
        templateId: "demo-screen"
      },
      tracks: [
        {
          id: "t-demo-video",
          name: "Screen Recording",
          type: TRACK_TYPES.VIDEO,
          elements: []
        },
        {
          id: "t-demo-callout",
          name: "Callouts",
          type: TRACK_TYPES.ELEMENT,
          elements: []
        }
      ]
    }
  }
];
const TemplateGalleryPanel = ({
  studioConfig
}) => {
  var _a;
  const { editor } = useTimelineContext();
  const templates = ((_a = studioConfig == null ? void 0 : studioConfig.templates) == null ? void 0 : _a.length) ? studioConfig.templates : DEFAULT_PROJECT_TEMPLATES;
  const loadTemplate = (project) => {
    editor.loadProject(project);
  };
  return /* @__PURE__ */ jsxs("div", { className: "panel-container", children: [
    /* @__PURE__ */ jsx("div", { className: "panel-header", children: /* @__PURE__ */ jsx("h3", { children: "Templates" }) }),
    /* @__PURE__ */ jsx("div", { className: "panel-content", style: { display: "grid", gap: "12px" }, children: templates.map((template) => /* @__PURE__ */ jsxs(
      "button",
      {
        className: "toolbar-btn",
        onClick: () => loadTemplate(template.project),
        style: {
          width: "100%",
          justifyContent: "flex-start",
          textAlign: "left",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          padding: "12px",
          height: "auto"
        },
        children: [
          /* @__PURE__ */ jsx("span", { style: { fontWeight: 600 }, children: template.name }),
          /* @__PURE__ */ jsx("span", { style: { opacity: 0.8, fontSize: "12px" }, children: template.description }),
          /* @__PURE__ */ jsx("span", { style: { opacity: 0.6, fontSize: "11px", marginTop: "2px" }, children: template.category })
        ]
      },
      template.id
    )) })
  ] });
};
const useScreenRecorder = () => {
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const [state, setState] = useState("idle");
  const [mediaUrl, setMediaUrl] = useState(null);
  const [error, setError] = useState(null);
  const cleanupStream = () => {
    var _a;
    (_a = streamRef.current) == null ? void 0 : _a.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };
  const startRecording = async (withMic) => {
    try {
      setError(null);
      if (mediaUrl) {
        URL.revokeObjectURL(mediaUrl);
        setMediaUrl(null);
      }
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });
      let mixedStream = displayStream;
      if (withMic) {
        const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mixedStream = new MediaStream([
          ...displayStream.getVideoTracks(),
          ...displayStream.getAudioTracks(),
          ...micStream.getAudioTracks()
        ]);
      }
      streamRef.current = mixedStream;
      chunksRef.current = [];
      const recorder = new MediaRecorder(mixedStream, {
        mimeType: "video/webm"
      });
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      recorder.onerror = () => {
        setState("error");
        setError("Recording failed");
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        setMediaUrl(url);
        setState("stopped");
        cleanupStream();
      };
      recorder.start();
      setState("recording");
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : "Unable to start recording");
      cleanupStream();
    }
  };
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  };
  const clearRecording = () => {
    if (mediaUrl) {
      URL.revokeObjectURL(mediaUrl);
    }
    cleanupStream();
    setMediaUrl(null);
    setError(null);
    setState("idle");
  };
  return {
    state,
    mediaUrl,
    error,
    startRecording,
    stopRecording,
    clearRecording
  };
};
const RecordPanel = ({
  addElement,
  videoResolution
}) => {
  const [withMic, setWithMic] = useState(true);
  const { state, mediaUrl, error, startRecording, stopRecording, clearRecording } = useScreenRecorder();
  const addToTimeline = async () => {
    var _a;
    if (!mediaUrl || !addElement) return;
    const element = new VideoElement(mediaUrl, videoResolution).setEnd(5).setName("Screen Recording").setMetadata({
      source: "screen-recording",
      hasMic: withMic
    });
    await element.updateVideoMeta();
    const duration = ((_a = element.getMediaDuration) == null ? void 0 : _a.call(element)) ?? 5;
    element.setEnd(Math.max(1, duration));
    addElement(element);
  };
  return /* @__PURE__ */ jsxs("div", { className: "panel-container", children: [
    /* @__PURE__ */ jsx("div", { className: "panel-header", children: /* @__PURE__ */ jsx("h3", { children: "Record Screen" }) }),
    /* @__PURE__ */ jsxs("div", { className: "panel-content", style: { display: "grid", gap: "12px" }, children: [
      /* @__PURE__ */ jsxs("label", { style: { display: "flex", gap: "8px", alignItems: "center" }, children: [
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "checkbox",
            checked: withMic,
            onChange: (e) => setWithMic(e.target.checked)
          }
        ),
        "Include microphone"
      ] }),
      state !== "recording" ? /* @__PURE__ */ jsx("button", { className: "btn-primary", onClick: () => startRecording(withMic), children: "Start Recording" }) : /* @__PURE__ */ jsx("button", { className: "btn-ghost", onClick: stopRecording, children: "Stop Recording" }),
      error ? /* @__PURE__ */ jsx("span", { className: "text-sm", children: error }) : null,
      mediaUrl ? /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx("video", { src: mediaUrl, controls: true, style: { width: "100%", borderRadius: "8px" } }),
        /* @__PURE__ */ jsx("button", { className: "btn-primary", onClick: addToTimeline, children: "Add Recording To Timeline" }),
        /* @__PURE__ */ jsx("button", { className: "btn-ghost", onClick: clearRecording, children: "Clear Recording" })
      ] }) : null
    ] })
  ] });
};
const SHAPE_COLORS = {
  line: "#f97316",
  arrow: "#f59e0b",
  rect: "#facc15",
  circle: "#facc15"
};
const AnnotationsPanel = ({
  addElement,
  videoResolution
}) => {
  const addLine = async () => {
    if (!addElement) return;
    const element = new LineElement(SHAPE_COLORS.line, {
      width: Math.round(videoResolution.width * 0.35),
      height: 4
    }).setEnd(5).setName("Line");
    await addElement(element);
  };
  const addArrow = async () => {
    if (!addElement) return;
    const element = new ArrowElement(SHAPE_COLORS.arrow, { width: 220, height: 20 }).setEnd(5).setName("Arrow Callout");
    await addElement(element);
  };
  const addBox = async () => {
    if (!addElement) return;
    const element = new RectElement(SHAPE_COLORS.rect, {
      width: Math.round(videoResolution.width * 0.35),
      height: Math.round(videoResolution.height * 0.18)
    }).setEnd(5).setName("Box");
    await addElement(element);
  };
  const addCircle = async () => {
    if (!addElement) return;
    const radius = Math.round(Math.min(videoResolution.width, videoResolution.height) * 0.12);
    const element = new CircleElement(SHAPE_COLORS.circle, radius).setEnd(5).setName("Circle");
    await addElement(element);
  };
  return /* @__PURE__ */ jsxs("div", { className: "panel-container", children: [
    /* @__PURE__ */ jsx("div", { className: "panel-header", children: /* @__PURE__ */ jsx("h3", { children: "Shapes" }) }),
    /* @__PURE__ */ jsxs(
      "div",
      {
        className: "panel-content",
        style: {
          display: "grid",
          gap: "12px",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))"
        },
        children: [
          /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              className: "btn-ghost",
              onClick: addLine,
              style: {
                display: "flex",
                flexDirection: "column",
                alignItems: "stretch",
                padding: "10px 12px",
                textAlign: "left",
                minHeight: 90
              },
              children: [
                /* @__PURE__ */ jsx(
                  "div",
                  {
                    style: {
                      height: 6,
                      borderRadius: 999,
                      background: "rgba(249,115,22,1)",
                      marginBottom: 8
                    }
                  }
                ),
                /* @__PURE__ */ jsx("div", { style: { fontWeight: 600, marginBottom: 2 }, children: "Line" }),
                /* @__PURE__ */ jsx("div", { style: { fontSize: 12, opacity: 0.8 }, children: "Draw a straight segment to connect or underline." })
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              className: "btn-ghost",
              onClick: addArrow,
              style: {
                display: "flex",
                flexDirection: "column",
                alignItems: "stretch",
                padding: "10px 12px",
                textAlign: "left",
                minHeight: 90
              },
              children: [
                /* @__PURE__ */ jsx(
                  "div",
                  {
                    style: {
                      height: 10,
                      borderRadius: 999,
                      background: "rgba(249,115,22,1)",
                      position: "relative",
                      marginBottom: 8
                    },
                    children: /* @__PURE__ */ jsx(
                      "div",
                      {
                        style: {
                          position: "absolute",
                          right: -4,
                          top: "50%",
                          transform: "translateY(-50%)",
                          width: 0,
                          height: 0,
                          borderTop: "8px solid transparent",
                          borderBottom: "8px solid transparent",
                          borderLeft: "12px solid rgba(249,115,22,1)"
                        }
                      }
                    )
                  }
                ),
                /* @__PURE__ */ jsx("div", { style: { fontWeight: 600, marginBottom: 2 }, children: "Arrow callout" }),
                /* @__PURE__ */ jsx("div", { style: { fontSize: 12, opacity: 0.8 }, children: "Emphasize a button or region with a directional arrow." })
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              className: "btn-ghost",
              onClick: addBox,
              style: {
                display: "flex",
                flexDirection: "column",
                alignItems: "stretch",
                padding: "10px 12px",
                textAlign: "left",
                minHeight: 90
              },
              children: [
                /* @__PURE__ */ jsx(
                  "div",
                  {
                    style: {
                      height: 40,
                      borderRadius: 10,
                      backgroundColor: "rgba(250,204,21,0.35)",
                      border: "1px solid rgba(250,204,21,0.8)",
                      marginBottom: 8
                    }
                  }
                ),
                /* @__PURE__ */ jsx("div", { style: { fontWeight: 600, marginBottom: 2 }, children: "Box" }),
                /* @__PURE__ */ jsx("div", { style: { fontSize: 12, opacity: 0.8 }, children: "Draw attention to important text or UI with a soft highlight." })
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              className: "btn-ghost",
              onClick: addCircle,
              style: {
                display: "flex",
                flexDirection: "column",
                alignItems: "stretch",
                padding: "10px 12px",
                textAlign: "left",
                minHeight: 90
              },
              children: [
                /* @__PURE__ */ jsx(
                  "div",
                  {
                    style: {
                      height: 40,
                      width: 40,
                      borderRadius: 999,
                      border: "2px solid rgba(250,204,21,0.9)",
                      backgroundColor: "rgba(250,204,21,0.2)",
                      marginBottom: 8,
                      alignSelf: "flex-start"
                    }
                  }
                ),
                /* @__PURE__ */ jsx("div", { style: { fontWeight: 600, marginBottom: 2 }, children: "Circle" }),
                /* @__PURE__ */ jsx("div", { style: { fontSize: 12, opacity: 0.8 }, children: "Add a circular callout or highlight area." })
              ]
            }
          )
        ]
      }
    )
  ] });
};
const sortChapters = (chapters) => [...chapters].sort((a, b) => a.time - b.time);
const ChaptersPanel = (_props) => {
  var _a;
  const { editor, present } = useTimelineContext();
  const { getCurrentTime } = useLivePlayerContext();
  const [title, setTitle] = useState("");
  const chapters = useMemo(
    () => {
      var _a2;
      return sortChapters(((_a2 = present == null ? void 0 : present.metadata) == null ? void 0 : _a2.chapters) ?? []);
    },
    [(_a = present == null ? void 0 : present.metadata) == null ? void 0 : _a.chapters]
  );
  const persistChapters = (nextChapters) => {
    const metadata = editor.getMetadata() ?? {};
    editor.setMetadata({
      ...metadata,
      chapters: sortChapters(nextChapters)
    });
  };
  const addChapter = () => {
    if (!title.trim()) return;
    const time = getCurrentTime();
    const next = {
      id: `chapter-${Date.now()}`,
      title: title.trim(),
      time
    };
    persistChapters([...chapters || [], next]);
    setTitle("");
  };
  const removeChapter = (id) => {
    persistChapters(chapters.filter((chapter) => chapter.id !== id));
  };
  return /* @__PURE__ */ jsxs("div", { className: "panel-container", children: [
    /* @__PURE__ */ jsx("div", { className: "panel-header", children: /* @__PURE__ */ jsx("h3", { children: "Chapters" }) }),
    /* @__PURE__ */ jsxs("div", { className: "panel-content", style: { display: "grid", gap: "10px" }, children: [
      /* @__PURE__ */ jsx(
        "input",
        {
          className: "search-input",
          placeholder: "Chapter title at current playhead",
          value: title,
          onChange: (e) => setTitle(e.target.value)
        }
      ),
      /* @__PURE__ */ jsx("button", { className: "btn-primary", onClick: addChapter, children: "Add Chapter At Playhead" }),
      /* @__PURE__ */ jsx("div", { style: { display: "grid", gap: "8px" }, children: chapters.map((chapter) => /* @__PURE__ */ jsxs(
        "div",
        {
          className: "btn-ghost",
          style: {
            width: "100%",
            height: "auto",
            justifyContent: "space-between",
            padding: "8px 10px"
          },
          children: [
            /* @__PURE__ */ jsxs("span", { children: [
              Math.floor(chapter.time),
              "s - ",
              chapter.title
            ] }),
            /* @__PURE__ */ jsx(
              "button",
              {
                className: "btn-ghost",
                style: { padding: "2px 6px" },
                onClick: () => removeChapter(chapter.id),
                children: "Remove"
              }
            )
          ]
        },
        chapter.id
      )) })
    ] })
  ] });
};
const parseSections = (script) => script.split("\n").map((line) => line.trim()).filter((line) => !!line);
const ScriptPanel = ({ videoResolution }) => {
  const [script, setScript] = useState("");
  const { editor } = useTimelineContext();
  const buildTimelineFromScript = async () => {
    const sections = parseSections(script);
    if (!sections.length) return;
    const chapters = [];
    const track = editor.addTrack("Script Outline", "element");
    for (let index = 0; index < sections.length; index++) {
      const section = sections[index];
      const start = index * 6;
      const end = start + 5;
      chapters.push({
        id: `script-chapter-${Date.now()}-${index}`,
        title: section,
        time: start
      });
      const textElement = new TextElement(section).setStart(start).setEnd(end).setName(`Script Section ${index + 1}`).setPosition({
        x: Math.round(videoResolution.width / 2),
        y: Math.round(videoResolution.height * 0.2)
      });
      await editor.addElementToTrack(track, textElement);
    }
    const metadata = editor.getMetadata() ?? {};
    editor.setMetadata({
      ...metadata,
      chapters: [...metadata.chapters ?? [], ...chapters]
    });
    editor.refresh();
  };
  return /* @__PURE__ */ jsxs("div", { className: "panel-container", children: [
    /* @__PURE__ */ jsx("div", { className: "panel-header", children: /* @__PURE__ */ jsx("h3", { children: "Script" }) }),
    /* @__PURE__ */ jsxs("div", { className: "panel-content", style: { display: "grid", gap: "10px" }, children: [
      /* @__PURE__ */ jsx(
        "textarea",
        {
          className: "input-dark",
          rows: 10,
          placeholder: "Paste script outline (one section per line)",
          value: script,
          onChange: (e) => setScript(e.target.value)
        }
      ),
      /* @__PURE__ */ jsx("button", { className: "btn-primary", onClick: buildTimelineFromScript, children: "Generate Timeline From Outline" })
    ] })
  ] });
};
const ElementPanelContainer = ({
  selectedTool,
  videoResolution,
  selectedElement,
  addElement,
  updateElement,
  setSelectedTool,
  uploadConfig,
  studioConfig
}) => {
  const addNewElement = async (element) => {
    await addElement(element);
  };
  const renderLibrary = () => {
    var _a;
    const CustomPanel = (_a = studioConfig == null ? void 0 : studioConfig.customPanels) == null ? void 0 : _a[selectedTool];
    if (CustomPanel) {
      return /* @__PURE__ */ jsx(
        CustomPanel,
        {
          selectedElement,
          videoResolution,
          addElement: addNewElement,
          updateElement,
          uploadConfig,
          selectedTool,
          setSelectedTool,
          studioConfig
        }
      );
    }
    switch (selectedTool) {
      case "image":
        return /* @__PURE__ */ jsx(
          ImagePanelContainer,
          {
            videoResolution,
            selectedElement,
            addElement: addNewElement,
            updateElement,
            uploadConfig
          }
        );
      case "audio":
        return /* @__PURE__ */ jsx(
          AudioPanelContainer,
          {
            videoResolution,
            selectedElement,
            addElement: addNewElement,
            updateElement,
            uploadConfig
          }
        );
      case "video":
        return /* @__PURE__ */ jsx(
          VideoPanelContainer,
          {
            videoResolution,
            selectedElement,
            addElement: addNewElement,
            updateElement,
            uploadConfig
          }
        );
      case "text":
        return /* @__PURE__ */ jsx(
          TextPanelContainer,
          {
            selectedElement,
            addElement: addNewElement,
            updateElement
          }
        );
      case "text-style":
        return /* @__PURE__ */ jsx(
          TextStylePanelContainer,
          {
            selectedElement,
            addElement: addNewElement,
            updateElement
          }
        );
      case "effect":
        return /* @__PURE__ */ jsx(
          EffectStylePanelContainer,
          {
            selectedElement,
            addElement: addNewElement,
            updateElement
          }
        );
      case "caption":
        return /* @__PURE__ */ jsx(CaptionsPanelContainer, {});
      case "generate-media":
        return /* @__PURE__ */ jsx(
          GenerateMediaPanelContainer,
          {
            videoResolution,
            selectedElement,
            addElement: addNewElement,
            updateElement,
            studioConfig
          }
        );
      case "templates":
        return /* @__PURE__ */ jsx(TemplateGalleryPanel, { studioConfig });
      case "record":
        return /* @__PURE__ */ jsx(
          RecordPanel,
          {
            selectedElement,
            videoResolution,
            addElement: addNewElement,
            updateElement,
            uploadConfig,
            selectedTool,
            setSelectedTool,
            studioConfig
          }
        );
      case "shape":
        return /* @__PURE__ */ jsx(
          AnnotationsPanel,
          {
            selectedElement,
            videoResolution,
            addElement: addNewElement,
            updateElement,
            uploadConfig,
            selectedTool,
            setSelectedTool,
            studioConfig
          }
        );
      case "chapters":
        return /* @__PURE__ */ jsx(
          ChaptersPanel,
          {
            selectedElement,
            videoResolution,
            addElement: addNewElement,
            updateElement,
            uploadConfig,
            selectedTool,
            setSelectedTool,
            studioConfig
          }
        );
      case "script":
        return /* @__PURE__ */ jsx(
          ScriptPanel,
          {
            selectedElement,
            videoResolution,
            addElement: addNewElement,
            updateElement,
            uploadConfig,
            selectedTool,
            setSelectedTool,
            studioConfig
          }
        );
      default:
        return /* @__PURE__ */ jsx("div", { className: "panel-container", children: /* @__PURE__ */ jsx("div", { className: "empty-state", children: /* @__PURE__ */ jsxs("div", { className: "empty-state-content", children: [
          /* @__PURE__ */ jsx(WandSparkles, { className: "empty-state-icon" }),
          /* @__PURE__ */ jsx("p", { className: "empty-state-text", children: "Select an element from toolbar" })
        ] }) }) });
    }
  };
  return renderLibrary();
};
function PropertyRow({ label, children, secondary }) {
  return /* @__PURE__ */ jsxs("div", { className: "property-row", children: [
    /* @__PURE__ */ jsx("div", { className: "property-row-label", children: /* @__PURE__ */ jsx("span", { className: "property-label", children: label }) }),
    /* @__PURE__ */ jsx("div", { className: "property-row-control", children }),
    secondary && /* @__PURE__ */ jsx("div", { className: "property-row-secondary", children: secondary })
  ] });
}
function AccordionItem({ title, icon, children, isOpen, onToggle }) {
  return /* @__PURE__ */ jsxs("div", { className: "accordion-item", children: [
    /* @__PURE__ */ jsxs(
      "div",
      {
        onClick: onToggle,
        className: "accordion-header",
        children: [
          /* @__PURE__ */ jsxs("div", { className: "flex-container", children: [
            /* @__PURE__ */ jsx("div", { className: "accent-purple", children: icon }),
            /* @__PURE__ */ jsx("span", { className: "property-title", children: title })
          ] }),
          isOpen ? /* @__PURE__ */ jsx(ChevronDown, { className: "icon-sm accent-purple" }) : /* @__PURE__ */ jsx(ChevronRight, { className: "icon-sm accent-purple" })
        ]
      }
    ),
    /* @__PURE__ */ jsx(
      "div",
      {
        className: `accordion-content ${isOpen ? "expanded" : ""}`,
        children: /* @__PURE__ */ jsx("div", { className: "accordion-panel", children })
      }
    )
  ] });
}
function ElementProps({ selectedElement, updateElement }) {
  const opacity = (selectedElement == null ? void 0 : selectedElement.getOpacity()) || 1;
  const rotation = (selectedElement == null ? void 0 : selectedElement.getRotation()) || 0;
  const position = (selectedElement == null ? void 0 : selectedElement.getPosition()) || { x: 0, y: 0 };
  const handleRotationChange = (rotation2) => {
    if (selectedElement) {
      selectedElement.setRotation(rotation2);
      updateElement == null ? void 0 : updateElement(selectedElement);
    }
  };
  const handleOpacityChange = (opacity2) => {
    if (selectedElement) {
      selectedElement.setOpacity(opacity2);
      updateElement == null ? void 0 : updateElement(selectedElement);
    }
  };
  const handlePositionChange = (props) => {
    if (selectedElement) {
      selectedElement.setPosition({ x: props.x ?? 0, y: props.y ?? 0 });
      updateElement == null ? void 0 : updateElement(selectedElement);
    }
  };
  const handleDimensionsChange = (width, height) => {
    if (!selectedElement) return;
    if (selectedElement instanceof RectElement) {
      const size = selectedElement.getSize();
      selectedElement.setSize({ width: width ?? size.width, height: height ?? size.height });
      updateElement == null ? void 0 : updateElement(selectedElement);
    } else if (selectedElement instanceof CircleElement) {
      const dims = {
        width: selectedElement.getRadius() * 2,
        height: selectedElement.getRadius() * 2
      };
      const newDiameter = width !== void 0 && width !== dims.width ? width : height ?? dims.height;
      selectedElement.setRadius(newDiameter / 2);
      updateElement == null ? void 0 : updateElement(selectedElement);
    }
  };
  const hasShapeDimensions = selectedElement instanceof RectElement || selectedElement instanceof CircleElement;
  let dimensions = null;
  if (selectedElement instanceof RectElement) {
    dimensions = selectedElement.getSize();
  } else if (selectedElement instanceof CircleElement) {
    const r = selectedElement.getRadius();
    dimensions = { width: r * 2, height: r * 2 };
  }
  const [isTransformOpen, setIsTransformOpen] = useState(false);
  return /* @__PURE__ */ jsxs("div", { className: "panel-container", children: [
    /* @__PURE__ */ jsx("div", { className: "panel-title", children: "Properties" }),
    /* @__PURE__ */ jsx(
      AccordionItem,
      {
        title: "Transform",
        icon: /* @__PURE__ */ jsx(Ruler, { className: "icon-sm" }),
        isOpen: isTransformOpen,
        onToggle: () => setIsTransformOpen((open) => !open),
        children: /* @__PURE__ */ jsxs("div", { className: "properties-group", children: [
          /* @__PURE__ */ jsxs("div", { className: "property-section", children: [
            /* @__PURE__ */ jsx(PropertyRow, { label: "Position X", children: /* @__PURE__ */ jsx(
              "input",
              {
                type: "number",
                value: position.x ?? 0,
                onChange: (e) => handlePositionChange({ x: Number(e.target.value) }),
                className: "input-dark"
              }
            ) }),
            /* @__PURE__ */ jsx(PropertyRow, { label: "Position Y", children: /* @__PURE__ */ jsx(
              "input",
              {
                type: "number",
                value: position.y ?? 0,
                onChange: (e) => handlePositionChange({ y: Number(e.target.value) }),
                className: "input-dark"
              }
            ) })
          ] }),
          hasShapeDimensions && dimensions && /* @__PURE__ */ jsxs("div", { className: "property-section", children: [
            /* @__PURE__ */ jsx(PropertyRow, { label: "Width", children: /* @__PURE__ */ jsx(
              "input",
              {
                type: "number",
                min: 1,
                value: Math.round(dimensions.width),
                onChange: (e) => handleDimensionsChange(
                  Number(e.target.value),
                  dimensions.height
                ),
                className: "input-dark"
              }
            ) }),
            /* @__PURE__ */ jsx(PropertyRow, { label: "Height", children: /* @__PURE__ */ jsx(
              "input",
              {
                type: "number",
                min: 1,
                value: Math.round(dimensions.height),
                onChange: (e) => handleDimensionsChange(
                  dimensions.width,
                  Number(e.target.value)
                ),
                className: "input-dark"
              }
            ) })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "property-section", children: /* @__PURE__ */ jsx(
            PropertyRow,
            {
              label: "Opacity",
              secondary: /* @__PURE__ */ jsxs("span", { children: [
                Math.round((opacity ?? 1) * 100),
                "%"
              ] }),
              children: /* @__PURE__ */ jsx(
                "input",
                {
                  type: "range",
                  min: "0",
                  max: "100",
                  value: (opacity ?? 1) * 100,
                  onChange: (e) => handleOpacityChange(Number(e.target.value) / 100),
                  className: "slider-purple"
                }
              )
            }
          ) }),
          /* @__PURE__ */ jsx("div", { className: "property-section", children: /* @__PURE__ */ jsx(
            PropertyRow,
            {
              label: "Rotation",
              secondary: /* @__PURE__ */ jsxs("span", { children: [
                Math.round(rotation ?? 0),
                "°"
              ] }),
              children: /* @__PURE__ */ jsx(
                "input",
                {
                  type: "range",
                  min: "0",
                  max: "360",
                  value: rotation ?? 0,
                  onChange: (e) => handleRotationChange(Number(e.target.value)),
                  className: "slider-purple"
                }
              )
            }
          ) })
        ] })
      }
    )
  ] });
}
function TextEffects({
  selectedElement,
  updateElement
}) {
  if (!(selectedElement instanceof TextElement)) return null;
  const currentEffect = selectedElement.getTextEffect();
  const handleUpdateEffect = (props) => {
    if (!selectedElement || !(selectedElement instanceof TextElement)) return;
    let effect = currentEffect;
    if (props.name === "") {
      selectedElement.setTextEffect(void 0);
      updateElement == null ? void 0 : updateElement(selectedElement);
      return;
    }
    if (!effect || props.name && props.name !== effect.getName()) {
      effect = new ElementTextEffect(
        props.name || (currentEffect == null ? void 0 : currentEffect.getName()) || TEXT_EFFECTS[0].name
      );
      effect.setDelay(0);
      effect.setDuration(1);
      effect.setBufferTime(0.1);
    }
    if (props.delay !== void 0) effect.setDelay(props.delay);
    if (props.duration !== void 0) effect.setDuration(props.duration);
    if (props.bufferTime !== void 0) effect.setBufferTime(props.bufferTime);
    selectedElement.setTextEffect(effect);
    updateElement == null ? void 0 : updateElement(selectedElement);
  };
  const [isEffectsOpen, setIsEffectsOpen] = useState(false);
  return /* @__PURE__ */ jsxs("div", { className: "panel-container", children: [
    /* @__PURE__ */ jsx("div", { className: "panel-title", children: "Text Effects" }),
    /* @__PURE__ */ jsx(
      AccordionItem,
      {
        title: "Effects",
        icon: /* @__PURE__ */ jsx(Sparkles, { className: "icon-sm" }),
        isOpen: isEffectsOpen,
        onToggle: () => setIsEffectsOpen((open) => !open),
        children: /* @__PURE__ */ jsxs("div", { className: "properties-group", children: [
          /* @__PURE__ */ jsx("div", { className: "property-section", children: /* @__PURE__ */ jsx(PropertyRow, { label: "Preset", children: /* @__PURE__ */ jsxs(
            "select",
            {
              value: (currentEffect == null ? void 0 : currentEffect.getName()) || "",
              onChange: (e) => handleUpdateEffect({ name: e.target.value }),
              className: "select-dark w-full",
              children: [
                /* @__PURE__ */ jsx("option", { value: "", children: "No Effect" }),
                TEXT_EFFECTS.map((effect) => /* @__PURE__ */ jsx("option", { value: effect.name, children: effect.name.charAt(0).toUpperCase() + effect.name.slice(1) }, effect.name))
              ]
            }
          ) }) }),
          currentEffect && /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx("div", { className: "property-section", children: /* @__PURE__ */ jsx(PropertyRow, { label: "Delay (s)", children: /* @__PURE__ */ jsx(
              "input",
              {
                type: "number",
                min: "0",
                max: "5",
                step: "0.1",
                value: currentEffect.getDelay() ?? 0,
                onChange: (e) => handleUpdateEffect({ delay: Number(e.target.value) }),
                className: "input-dark"
              }
            ) }) }),
            /* @__PURE__ */ jsx("div", { className: "property-section", children: /* @__PURE__ */ jsx(PropertyRow, { label: "Duration (s)", children: /* @__PURE__ */ jsx(
              "input",
              {
                type: "number",
                min: "0.1",
                max: "10",
                step: "0.1",
                value: currentEffect.getDuration() ?? 1,
                onChange: (e) => handleUpdateEffect({ duration: Number(e.target.value) }),
                className: "input-dark"
              }
            ) }) }),
            /* @__PURE__ */ jsx("div", { className: "property-section", children: /* @__PURE__ */ jsx(PropertyRow, { label: "Buffer (s)", children: /* @__PURE__ */ jsx(
              "input",
              {
                type: "number",
                min: "0.05",
                max: "1",
                step: "0.05",
                value: currentEffect.getBufferTime() ?? 0.1,
                onChange: (e) => handleUpdateEffect({
                  bufferTime: Number(e.target.value)
                }),
                className: "input-dark"
              }
            ) }) })
          ] })
        ] })
      }
    )
  ] });
}
function Animation({
  selectedElement,
  updateElement
}) {
  if (!(selectedElement instanceof TrackElement)) return null;
  const currentAnimation = selectedElement == null ? void 0 : selectedElement.getAnimation();
  const handleUpdateAnimation = (props) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i;
    if (!selectedElement) return;
    let animation = currentAnimation;
    if (props.name === "") {
      selectedElement.setAnimation(void 0);
      updateElement == null ? void 0 : updateElement(selectedElement);
      return;
    }
    const animationDef = ANIMATIONS.find(
      (a) => a.name === (props.name || (currentAnimation == null ? void 0 : currentAnimation.getName()))
    );
    if (!animationDef) return;
    if (!animation || props.name && props.name !== animation.getName()) {
      animation = new ElementAnimation(
        props.name || (currentAnimation == null ? void 0 : currentAnimation.getName()) || ANIMATIONS[0].name
      );
      animation.setInterval(animationDef.interval || 1);
      animation.setDuration(animationDef.duration || 1);
      animation.setIntensity(animationDef.intensity || 1);
      animation.setAnimate(animationDef.animate || "enter");
      if (animationDef.mode) animation.setMode(animationDef.mode);
      if (animationDef.direction)
        animation.setDirection(animationDef.direction);
    }
    if (props.interval !== void 0) {
      const [min, max] = ((_a = animationDef.options) == null ? void 0 : _a.interval) || [0.1, 5];
      animation.setInterval(Math.min(Math.max(props.interval, min), max));
    }
    if (props.duration !== void 0) {
      const [min, max] = ((_b = animationDef.options) == null ? void 0 : _b.duration) || [0.1, 5];
      animation.setDuration(Math.min(Math.max(props.duration, min), max));
    }
    if (props.intensity !== void 0) {
      const [min, max] = ((_c = animationDef.options) == null ? void 0 : _c.intensity) || [0.1, 2];
      animation.setIntensity(Math.min(Math.max(props.intensity, min), max));
    }
    if (props.animate && ((_e = (_d = animationDef.options) == null ? void 0 : _d.animate) == null ? void 0 : _e.includes(props.animate))) {
      animation.setAnimate(props.animate);
    }
    if (props.mode && ((_g = (_f = animationDef.options) == null ? void 0 : _f.mode) == null ? void 0 : _g.includes(props.mode))) {
      animation.setMode(props.mode);
    }
    if (props.direction && ((_i = (_h = animationDef.options) == null ? void 0 : _h.direction) == null ? void 0 : _i.includes(props.direction))) {
      animation.setDirection(props.direction);
    }
    selectedElement.setAnimation(animation);
    updateElement == null ? void 0 : updateElement(selectedElement);
  };
  return /* @__PURE__ */ jsxs("div", { className: "panel-container", children: [
    /* @__PURE__ */ jsx("div", { className: "panel-title", children: "Animations" }),
    /* @__PURE__ */ jsxs("div", { className: "panel-section", children: [
      /* @__PURE__ */ jsx("label", { className: "label-dark", children: "Type" }),
      /* @__PURE__ */ jsxs(
        "select",
        {
          value: (currentAnimation == null ? void 0 : currentAnimation.getName()) || "",
          onChange: (e) => handleUpdateAnimation({ name: e.target.value }),
          className: "select-dark w-full",
          children: [
            /* @__PURE__ */ jsx("option", { value: "", children: "No Animation" }),
            ANIMATIONS.map((animation) => /* @__PURE__ */ jsx("option", { value: animation.name, children: animation.name.charAt(0).toUpperCase() + animation.name.slice(1) }, animation.name))
          ]
        }
      )
    ] }),
    currentAnimation && /* @__PURE__ */ jsx(Fragment, { children: (() => {
      var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o;
      const animationDef = ANIMATIONS.find(
        (a) => a.name === currentAnimation.getName()
      );
      if (!animationDef || !animationDef.options) return null;
      return /* @__PURE__ */ jsxs(Fragment, { children: [
        ((_a = animationDef.options) == null ? void 0 : _a.animate) && /* @__PURE__ */ jsxs("div", { className: "panel-section", children: [
          /* @__PURE__ */ jsx("label", { className: "label-dark", children: "When to Animate" }),
          /* @__PURE__ */ jsx(
            "select",
            {
              value: currentAnimation.getAnimate(),
              onChange: (e) => handleUpdateAnimation({
                animate: e.target.value
              }),
              className: "select-dark w-full",
              children: (_b = animationDef.options) == null ? void 0 : _b.animate.map((option) => /* @__PURE__ */ jsx("option", { value: option, children: option.charAt(0).toUpperCase() + option.slice(1) }, option))
            }
          )
        ] }),
        ((_c = animationDef.options) == null ? void 0 : _c.direction) && /* @__PURE__ */ jsxs("div", { className: "panel-section", children: [
          /* @__PURE__ */ jsx("label", { className: "label-dark", children: "Direction" }),
          /* @__PURE__ */ jsx(
            "select",
            {
              value: currentAnimation.getDirection(),
              onChange: (e) => handleUpdateAnimation({
                direction: e.target.value
              }),
              className: "select-dark w-full",
              children: (_d = animationDef.options) == null ? void 0 : _d.direction.map((option) => /* @__PURE__ */ jsx("option", { value: option, children: option.charAt(0).toUpperCase() + option.slice(1) }, option))
            }
          )
        ] }),
        ((_e = animationDef.options) == null ? void 0 : _e.mode) && /* @__PURE__ */ jsxs("div", { className: "panel-section", children: [
          /* @__PURE__ */ jsx("label", { className: "label-dark", children: "Mode" }),
          /* @__PURE__ */ jsx(
            "select",
            {
              value: currentAnimation.getMode(),
              onChange: (e) => handleUpdateAnimation({
                mode: e.target.value
              }),
              className: "select-dark w-full",
              children: (_f = animationDef.options) == null ? void 0 : _f.mode.map((option) => /* @__PURE__ */ jsx("option", { value: option, children: option.charAt(0).toUpperCase() + option.slice(1) }, option))
            }
          )
        ] }),
        ((_g = animationDef.options) == null ? void 0 : _g.duration) && /* @__PURE__ */ jsxs("div", { className: "panel-section", children: [
          /* @__PURE__ */ jsx("label", { className: "label-dark", children: "Duration (seconds)" }),
          /* @__PURE__ */ jsxs("div", { className: "slider-container", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "range",
                min: (_h = animationDef.options) == null ? void 0 : _h.duration[0],
                max: (_i = animationDef.options) == null ? void 0 : _i.duration[1],
                step: "0.1",
                value: currentAnimation.getDuration(),
                onChange: (e) => handleUpdateAnimation({
                  duration: Number(e.target.value)
                }),
                className: "slider-purple"
              }
            ),
            /* @__PURE__ */ jsx("span", { className: "slider-value", children: currentAnimation.getDuration() })
          ] })
        ] }),
        ((_j = animationDef.options) == null ? void 0 : _j.interval) && /* @__PURE__ */ jsxs("div", { className: "panel-section", children: [
          /* @__PURE__ */ jsx("label", { className: "label-dark", children: "Interval (seconds)" }),
          /* @__PURE__ */ jsxs("div", { className: "slider-container", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "range",
                min: (_k = animationDef.options) == null ? void 0 : _k.interval[0],
                max: (_l = animationDef.options) == null ? void 0 : _l.interval[1],
                step: "0.1",
                value: currentAnimation.getInterval(),
                onChange: (e) => handleUpdateAnimation({
                  interval: Number(e.target.value)
                }),
                className: "slider-purple"
              }
            ),
            /* @__PURE__ */ jsx("span", { className: "slider-value", children: currentAnimation.getInterval() })
          ] })
        ] }),
        ((_m = animationDef.options) == null ? void 0 : _m.intensity) && /* @__PURE__ */ jsxs("div", { className: "panel-section", children: [
          /* @__PURE__ */ jsx("label", { className: "label-dark", children: "Intensity" }),
          /* @__PURE__ */ jsxs("div", { className: "slider-container", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "range",
                min: (_n = animationDef.options) == null ? void 0 : _n.intensity[0],
                max: (_o = animationDef.options) == null ? void 0 : _o.intensity[1],
                step: "0.1",
                value: currentAnimation.getIntensity(),
                onChange: (e) => handleUpdateAnimation({
                  intensity: Number(e.target.value)
                }),
                className: "slider-purple"
              }
            ),
            /* @__PURE__ */ jsx("span", { className: "slider-value", children: currentAnimation.getIntensity() })
          ] })
        ] })
      ] });
    })() })
  ] });
}
const CAPTION_FONT2 = {
  size: 40,
  family: "Bangers"
};
const CAPTION_COLOR2 = {
  text: "#ffffff",
  highlight: "#ff4081",
  bgColor: "#8C52FF",
  outlineColor: "#000000"
};
const CAPTION_STYLE_COLOR_META = {
  // Word background highlight - white text on colored pill
  highlight_bg: {
    // Text color, and background pill color used in animation.
    usedColors: ["text", "bgColor"],
    labels: {
      text: "Text Color",
      bgColor: "Highlight Background"
    }
  },
  // Simple word-by-word – text only
  word_by_word: {
    // Visualizer uses text as fill + outlineColor for stroke, and highlight for active word.
    usedColors: ["text", "highlight", "outlineColor"],
    labels: {
      text: "Text Color",
      highlight: "Highlight Color",
      outlineColor: "Outline Color"
    }
  },
  // Word-by-word with a phrase bar background
  word_by_word_with_bg: {
    // Text color (fill), highlight for active word, outlineColor (stroke), bgColor used by phrase rect.
    usedColors: ["text", "highlight", "bgColor", "outlineColor"],
    labels: {
      text: "Text Color",
      bgColor: "Bar Background",
      highlight: "Highlight Color",
      outlineColor: "Outline Color"
    }
  },
  // Classic outlined text
  outline_only: {
    // Outline-only style: fill + outline color; highlight not used in animation.
    usedColors: ["text", "outlineColor"],
    labels: {
      text: "Fill Color",
      outlineColor: "Outline Color"
    }
  },
  // Soft rounded box behind text
  soft_box: {
    usedColors: ["text", "bgColor", "highlight", "outlineColor"],
    labels: {
      text: "Text Color",
      highlight: "Highlight Color",
      bgColor: "Box Background",
      outlineColor: "Outline Color"
    }
  },
  // Broadcast style lower-third bar
  lower_third: {
    // Title text, bar background, highlight color and outline color.
    usedColors: ["text", "bgColor", "outlineColor"],
    labels: {
      text: "Title Text Color",
      bgColor: "Bar Background",
      highlight: "Highlight Color",
      outlineColor: "Outline Color"
    }
  },
  // Typewriter – text only
  typewriter: {
    // Text color and outline color (stroke) used by visualizer; highlight not animated.
    usedColors: ["text", "outlineColor"],
    labels: {
      text: "Text Color",
      outlineColor: "Outline Color"
    }
  },
  // Karaoke – base text plus active word highlight
  karaoke: {
    // Base text color, active word highlight color, outline color.
    usedColors: ["text", "highlight", "outlineColor"],
    labels: {
      text: "Text Color",
      highlight: "Highlight Color",
      outlineColor: "Outline Color"
    }
  },
  // Karaoke-word – single active word, previous words dimmed
  "karaoke-word": {
    // Same color needs as karaoke.
    usedColors: ["text", "highlight", "outlineColor"],
    labels: {
      text: "Text Color",
      highlight: "Highlight Color",
      outlineColor: "Outline Color"
    }
  },
  // Pop / scale – text only
  pop_scale: {
    // Text color, highlight color for active word, and outline color; no background.
    usedColors: ["text", "highlight", "outlineColor"],
    labels: {
      text: "Text Color",
      highlight: "Highlight Color",
      outlineColor: "Outline Color"
    }
  }
};
const DEFAULT_COLOR_META = {
  usedColors: ["text", "bgColor", "outlineColor"],
  labels: {
    text: "Text Color",
    bgColor: "Background Color",
    outlineColor: "Outline Color"
  }
};
const CAPTION_FONTS = Object.values(AVAILABLE_TEXT_FONTS);
function CaptionPropPanel({
  selectedElement,
  updateElement,
  setApplyPropsToAllCaption
}) {
  var _a;
  const { editor, changeLog } = useTimelineContext();
  const captionRef = useRef(null);
  const [capStyle, setCapStyle] = useState(
    CAPTION_STYLE_OPTIONS[CAPTION_STYLE.WORD_BG_HIGHLIGHT]
  );
  const [fontSize, setFontSize] = useState(CAPTION_FONT2.size);
  const [fontFamily, setFontFamily] = useState(CAPTION_FONT2.family);
  const [colors, setColors] = useState({
    text: CAPTION_COLOR2.text,
    highlight: CAPTION_COLOR2.highlight,
    bgColor: CAPTION_COLOR2.bgColor,
    outlineColor: CAPTION_COLOR2.outlineColor
  });
  const [useHighlight, setUseHighlight] = useState(true);
  const [useOutline, setUseOutline] = useState(true);
  const track = selectedElement instanceof CaptionElement ? editor.getTrackById(selectedElement.getTrackId()) : null;
  const trackProps = (track == null ? void 0 : track.getProps()) ?? {};
  const elementProps = ((_a = selectedElement == null ? void 0 : selectedElement.getProps) == null ? void 0 : _a.call(selectedElement)) ?? {};
  const useTrackDefaults = (elementProps == null ? void 0 : elementProps.useTrackDefaults) ?? true;
  const getEffectiveColors = ({
    nextColors,
    highlightEnabled,
    outlineEnabled
  }) => {
    let effectiveColors = { ...nextColors };
    if (!highlightEnabled) {
      const { highlight, ...rest } = effectiveColors;
      effectiveColors = rest;
    }
    if (!outlineEnabled) {
      const { outlineColor, ...rest } = effectiveColors;
      effectiveColors = rest;
    }
    return effectiveColors;
  };
  const handleUseTrackDefaultsChange = (enabled) => {
    const captionElement = selectedElement;
    if (!captionElement) return;
    const prev = captionElement.getProps() ?? {};
    const next = { ...prev, useTrackDefaults: enabled };
    if (enabled) {
      const keysToClear = [
        "capStyle",
        "x",
        "y",
        "width",
        "maxWidth",
        "textAlign",
        "rotation",
        "opacity",
        "colors",
        "font",
        "lineWidth",
        "rectProps",
        "shadowColor",
        "shadowBlur",
        "shadowOffset",
        "fill",
        "stroke"
      ];
      for (const k of keysToClear) {
        delete next[k];
      }
    }
    captionElement.setProps(next);
    updateElement == null ? void 0 : updateElement(captionElement);
    setApplyPropsToAllCaption == null ? void 0 : setApplyPropsToAllCaption(enabled);
  };
  const handleUpdateCaption = (updates) => {
    const captionElement = selectedElement;
    if (!captionElement) return;
    const nextFontSize = updates.fontSize ?? fontSize;
    const geometry = computeCaptionGeometry(nextFontSize, updates.style ?? (capStyle == null ? void 0 : capStyle.value) ?? "");
    const highlightEnabled = updates.useHighlightOverride ?? useHighlight;
    const outlineEnabled = updates.useOutlineOverride ?? useOutline;
    const rawNextColors = updates.colors ?? colors;
    const effectiveColors = getEffectiveColors({
      nextColors: rawNextColors,
      highlightEnabled,
      outlineEnabled
    });
    if (useTrackDefaults && track) {
      const nextFont = {
        size: nextFontSize,
        family: updates.fontFamily ?? fontFamily
      };
      const nextColors = effectiveColors;
      const nextCapStyle = updates.style ?? (capStyle == null ? void 0 : capStyle.value);
      editor.updateTrackProps(track.getId(), {
        capStyle: nextCapStyle,
        font: { ...(trackProps == null ? void 0 : trackProps.font) ?? {}, ...nextFont },
        colors: nextColors,
        lineWidth: geometry.lineWidth,
        rectProps: geometry.rectProps
      });
    } else {
      const elementProps2 = captionElement.getProps() ?? {};
      captionElement.setProps({
        ...elementProps2,
        useTrackDefaults: false,
        capStyle: updates.style ?? (capStyle == null ? void 0 : capStyle.value),
        font: {
          size: nextFontSize,
          family: updates.fontFamily ?? fontFamily
        },
        colors: effectiveColors,
        lineWidth: geometry.lineWidth
      });
      updateElement == null ? void 0 : updateElement(captionElement);
    }
  };
  useEffect(() => {
    const captionElement = selectedElement;
    if (captionElement) {
      if (captionRef.current) {
        captionRef.current.value = captionElement == null ? void 0 : captionElement.getText();
      }
      const elementProps2 = captionElement.getProps() ?? {};
      const elementUseTrackDefaults = (elementProps2 == null ? void 0 : elementProps2.useTrackDefaults) ?? true;
      const resolvedCapStyle = elementUseTrackDefaults ? trackProps == null ? void 0 : trackProps.capStyle : (elementProps2 == null ? void 0 : elementProps2.capStyle) ?? (trackProps == null ? void 0 : trackProps.capStyle);
      const resolvedFont = elementUseTrackDefaults ? trackProps == null ? void 0 : trackProps.font : {
        ...(trackProps == null ? void 0 : trackProps.font) ?? {},
        ...(elementProps2 == null ? void 0 : elementProps2.font) ?? {}
      };
      const resolvedColors = elementUseTrackDefaults ? trackProps == null ? void 0 : trackProps.colors : {
        ...(trackProps == null ? void 0 : trackProps.colors) ?? {},
        ...(elementProps2 == null ? void 0 : elementProps2.colors) ?? {}
      };
      const _capStyle = resolvedCapStyle;
      if (_capStyle && _capStyle in CAPTION_STYLE_OPTIONS) {
        setCapStyle(CAPTION_STYLE_OPTIONS[_capStyle]);
      }
      setFontSize((resolvedFont == null ? void 0 : resolvedFont.size) ?? CAPTION_FONT2.size);
      setFontFamily((resolvedFont == null ? void 0 : resolvedFont.family) ?? CAPTION_FONT2.family);
      const c = resolvedColors;
      setColors({
        text: (c == null ? void 0 : c.text) ?? CAPTION_COLOR2.text,
        highlight: (c == null ? void 0 : c.highlight) ?? CAPTION_COLOR2.highlight,
        bgColor: (c == null ? void 0 : c.bgColor) ?? CAPTION_COLOR2.bgColor,
        outlineColor: (c == null ? void 0 : c.outlineColor) ?? CAPTION_COLOR2.outlineColor
      });
      setUseHighlight((c == null ? void 0 : c.highlight) != null);
      setUseOutline((c == null ? void 0 : c.outlineColor) != null);
    }
  }, [selectedElement, track, changeLog]);
  if (!(selectedElement instanceof CaptionElement)) {
    return null;
  }
  const currentStyleKey = capStyle == null ? void 0 : capStyle.value;
  const currentColorMeta = currentStyleKey && CAPTION_STYLE_COLOR_META[currentStyleKey] || DEFAULT_COLOR_META;
  const defaultColorLabels = {
    text: "Text Color",
    bgColor: "Background Color",
    highlight: "Highlight Color",
    outlineColor: "Outline Color"
  };
  const renderColorControl = (key) => {
    if (key === "highlight" && !useHighlight) {
      return null;
    }
    if (key === "outlineColor" && !useOutline) {
      return null;
    }
    const label = currentColorMeta.labels[key] ?? defaultColorLabels[key];
    const value = colors[key];
    const handleChange = (next) => {
      const nextColors = { ...colors, [key]: next };
      setColors(nextColors);
      handleUpdateCaption({ colors: nextColors });
    };
    if (value == null) {
      return null;
    }
    return /* @__PURE__ */ jsxs("div", { className: "color-control", children: [
      /* @__PURE__ */ jsx("label", { className: "label-small", children: label }),
      /* @__PURE__ */ jsxs("div", { className: "color-inputs", children: [
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "color",
            value,
            onChange: (e) => handleChange(e.target.value),
            className: "color-picker"
          }
        ),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "text",
            value,
            onChange: (e) => handleChange(e.target.value),
            className: "color-text"
          }
        )
      ] })
    ] }, key);
  };
  return /* @__PURE__ */ jsxs("div", { className: "panel-container", children: [
    /* @__PURE__ */ jsx("div", { className: "panel-section", children: /* @__PURE__ */ jsx("div", { className: "checkbox-control", children: /* @__PURE__ */ jsxs("label", { className: "checkbox-label", children: [
      /* @__PURE__ */ jsx(
        "input",
        {
          type: "checkbox",
          checked: useTrackDefaults,
          onChange: (e) => handleUseTrackDefaultsChange(e.target.checked),
          className: "checkbox-purple"
        }
      ),
      "Use track defaults"
    ] }) }) }),
    /* @__PURE__ */ jsxs("div", { className: "panel-section", children: [
      /* @__PURE__ */ jsx("label", { className: "label-dark", children: "Subtitle Style" }),
      /* @__PURE__ */ jsx(
        "select",
        {
          value: capStyle.value,
          onChange: (e) => {
            const val = e.target.value;
            if (val in CAPTION_STYLE_OPTIONS) {
              setCapStyle(CAPTION_STYLE_OPTIONS[val]);
            }
            handleUpdateCaption({ style: e.target.value });
          },
          className: "select-dark w-full",
          children: Object.values(CAPTION_STYLE_OPTIONS).map((option) => /* @__PURE__ */ jsx("option", { value: option.value, children: option.label }, option.value))
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "panel-section", children: [
      /* @__PURE__ */ jsx("label", { className: "label-dark", children: "Font Size" }),
      /* @__PURE__ */ jsxs("div", { className: "slider-container", children: [
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "range",
            min: "8",
            max: "72",
            step: "1",
            value: fontSize,
            onChange: (e) => {
              const value = Number(e.target.value);
              setFontSize(value);
              handleUpdateCaption({ fontSize: value });
            },
            className: "slider-purple"
          }
        ),
        /* @__PURE__ */ jsxs("span", { className: "slider-value", children: [
          fontSize,
          "px"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "panel-section", children: [
      /* @__PURE__ */ jsx("label", { className: "label-dark", children: "Font" }),
      /* @__PURE__ */ jsx(
        "select",
        {
          value: fontFamily,
          onChange: (e) => {
            const value = e.target.value;
            setFontFamily(value);
            handleUpdateCaption({ fontFamily: value });
          },
          className: "select-dark w-full",
          children: CAPTION_FONTS.map((font) => /* @__PURE__ */ jsx("option", { value: font, children: font }, font))
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "panel-section", children: [
      /* @__PURE__ */ jsx("label", { className: "label-dark", children: "Colors" }),
      /* @__PURE__ */ jsxs("div", { className: "color-section", children: [
        currentColorMeta.usedColors.includes("highlight") && /* @__PURE__ */ jsx("div", { className: "checkbox-control", children: /* @__PURE__ */ jsxs("label", { className: "checkbox-label", children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "checkbox",
              checked: useHighlight,
              onChange: (e) => {
                const enabled = e.target.checked;
                setUseHighlight(enabled);
                const nextColors = enabled ? { ...colors, highlight: colors.highlight || CAPTION_COLOR2.highlight } : { ...colors };
                setColors(nextColors);
                handleUpdateCaption({
                  colors: nextColors,
                  useHighlightOverride: enabled
                });
              },
              className: "checkbox-purple"
            }
          ),
          "Use Highlight Color"
        ] }) }),
        currentColorMeta.usedColors.includes("outlineColor") && /* @__PURE__ */ jsx("div", { className: "checkbox-control", children: /* @__PURE__ */ jsxs("label", { className: "checkbox-label", children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "checkbox",
              checked: useOutline,
              onChange: (e) => {
                const enabled = e.target.checked;
                setUseOutline(enabled);
                const nextColors = enabled ? {
                  ...colors,
                  outlineColor: colors.outlineColor || CAPTION_COLOR2.outlineColor
                } : { ...colors };
                setColors(nextColors);
                handleUpdateCaption({
                  colors: nextColors,
                  useOutlineOverride: enabled
                });
              },
              className: "checkbox-purple"
            }
          ),
          "Use Outline Color"
        ] }) }),
        currentColorMeta.usedColors.map((key) => renderColorControl(key))
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "panel-section", children: /* @__PURE__ */ jsx(
      "button",
      {
        className: "btn-primary w-full",
        onClick: () => {
          if (!track || !(selectedElement instanceof CaptionElement)) return;
          const captionProps = selectedElement.getProps() ?? {};
          const currentStyle = {};
          const styleKeys = [
            "capStyle",
            "fontSize",
            "fontFamily",
            "colors",
            "useHighlightOverride",
            "useOutlineOverride",
            "x",
            "y"
          ];
          for (const key of styleKeys) {
            if (captionProps[key] !== void 0) {
              currentStyle[key] = captionProps[key];
            }
          }
          currentStyle.fontSize = fontSize;
          currentStyle.fontFamily = fontFamily;
          currentStyle.colors = getEffectiveColors({
            nextColors: colors,
            highlightEnabled: useHighlight,
            outlineEnabled: useOutline
          });
          currentStyle.capStyle = capStyle.value;
          track.setProps({ ...trackProps, ...currentStyle });
          const allCaptions = track.getElements();
          const friend = track.createFriend();
          allCaptions.forEach((el) => {
            if (el instanceof CaptionElement) {
              const p = el.getProps() ?? {};
              el.setProps({ ...p, useTrackDefaults: true });
              friend.updateElement(el);
            }
          });
        },
        children: "Apply style to all subtitles"
      }
    ) })
  ] });
}
const MIN_DB = -60;
const MAX_DB = 6;
function linearToDb(linear) {
  if (linear <= 0) return MIN_DB;
  const db = 20 * Math.log10(linear);
  return Math.max(MIN_DB, Math.min(MAX_DB, db));
}
function dbToLinear(db) {
  if (db <= MIN_DB) return 0;
  const linear = Math.pow(10, db / 20);
  return Math.min(linear, Math.pow(10, MAX_DB / 20));
}
const PLAYBACK_RATE_MIN = 0.25;
const PLAYBACK_RATE_MAX = 2;
const PLAYBACK_RATE_STEP = 0.25;
function PlaybackPropsPanel({
  selectedElement,
  updateElement
}) {
  const elementProps = (selectedElement == null ? void 0 : selectedElement.getProps()) || {};
  const volumeLinear = elementProps.volume ?? 1;
  const volumeDb = linearToDb(volumeLinear);
  const playbackRate = elementProps.playbackRate ?? 1;
  const handleUpdateElement = (props) => {
    if (selectedElement) {
      updateElement == null ? void 0 : updateElement(selectedElement == null ? void 0 : selectedElement.setProps({ ...elementProps, ...props }));
    }
  };
  const handleVolumeDbChange = (db) => {
    handleUpdateElement({ volume: dbToLinear(db) });
  };
  const handlePlaybackRateChange = (rate) => {
    handleUpdateElement({ playbackRate: rate });
  };
  const [isPlaybackOpen, setIsPlaybackOpen] = useState(false);
  return /* @__PURE__ */ jsxs("div", { className: "panel-container", children: [
    /* @__PURE__ */ jsx("div", { className: "panel-title", children: "Playback" }),
    /* @__PURE__ */ jsx(
      AccordionItem,
      {
        title: "Playback",
        icon: /* @__PURE__ */ jsx(Music2, { className: "icon-sm" }),
        isOpen: isPlaybackOpen,
        onToggle: () => setIsPlaybackOpen((open) => !open),
        children: /* @__PURE__ */ jsxs("div", { className: "properties-group", children: [
          /* @__PURE__ */ jsx("div", { className: "property-section", children: /* @__PURE__ */ jsx(
            PropertyRow,
            {
              label: "Playback rate",
              secondary: /* @__PURE__ */ jsxs("span", { children: [
                playbackRate,
                "×"
              ] }),
              children: /* @__PURE__ */ jsx(
                "input",
                {
                  type: "range",
                  min: PLAYBACK_RATE_MIN,
                  max: PLAYBACK_RATE_MAX,
                  step: PLAYBACK_RATE_STEP,
                  value: playbackRate,
                  onChange: (e) => handlePlaybackRateChange(Number(e.target.value)),
                  className: "slider-purple"
                }
              )
            }
          ) }),
          /* @__PURE__ */ jsx("div", { className: "property-section", children: /* @__PURE__ */ jsx(
            PropertyRow,
            {
              label: "Volume",
              secondary: /* @__PURE__ */ jsx("span", { children: volumeDb <= MIN_DB ? "−∞" : `${Math.round(volumeDb)} dB` }),
              children: /* @__PURE__ */ jsx(
                "input",
                {
                  type: "range",
                  min: MIN_DB,
                  max: MAX_DB,
                  step: 1,
                  value: volumeDb,
                  onChange: (e) => handleVolumeDbChange(Number(e.target.value)),
                  className: "slider-purple"
                }
              )
            }
          ) })
        ] })
      }
    )
  ] });
}
function TextPropsPanel({
  selectedElement,
  updateElement
}) {
  if (!(selectedElement instanceof TextElement)) return null;
  const textProps = selectedElement.getProps() || {};
  const [isTypographyOpen, setIsTypographyOpen] = useState(false);
  const currentAlign = textProps.textAlign ?? "center";
  const currentWeight = textProps.fontWeight ?? 400;
  const isBold = currentWeight >= 600;
  const isItalic = textProps.fontStyle === "italic";
  const handleUpdate = (patch) => {
    if (!selectedElement) return;
    const next = { ...textProps, ...patch };
    selectedElement.setProps(next);
    updateElement == null ? void 0 : updateElement(selectedElement);
  };
  const toggleBold = () => {
    handleUpdate({ fontWeight: isBold ? 400 : 700 });
  };
  const toggleItalic = () => {
    handleUpdate({ fontStyle: isItalic ? "normal" : "italic" });
  };
  const setAlign = (align) => {
    handleUpdate({ textAlign: align });
  };
  return /* @__PURE__ */ jsxs("div", { className: "panel-container", children: [
    /* @__PURE__ */ jsx("div", { className: "panel-title", children: "Typography" }),
    /* @__PURE__ */ jsx(
      AccordionItem,
      {
        title: "Typography",
        icon: /* @__PURE__ */ jsx(Type, { className: "icon-sm" }),
        isOpen: isTypographyOpen,
        onToggle: () => setIsTypographyOpen((open) => !open),
        children: /* @__PURE__ */ jsxs("div", { className: "properties-group", children: [
          /* @__PURE__ */ jsx("div", { className: "property-section", children: /* @__PURE__ */ jsx(
            PropertyRow,
            {
              label: "Font size",
              secondary: /* @__PURE__ */ jsxs("span", { children: [
                textProps.fontSize ?? 48,
                "px"
              ] }),
              children: /* @__PURE__ */ jsx(
                "input",
                {
                  type: "range",
                  min: 8,
                  max: 160,
                  value: textProps.fontSize ?? 48,
                  onChange: (e) => handleUpdate({ fontSize: Number(e.target.value) }),
                  className: "slider-purple"
                }
              )
            }
          ) }),
          /* @__PURE__ */ jsx("div", { className: "property-section", children: /* @__PURE__ */ jsxs(PropertyRow, { label: "Style", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                className: `form-btn ${isBold ? "active" : ""}`,
                onClick: toggleBold,
                title: "Bold",
                children: /* @__PURE__ */ jsx(Bold, { className: "icon-sm" })
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                className: `form-btn ${isItalic ? "active" : ""}`,
                onClick: toggleItalic,
                title: "Italic",
                children: /* @__PURE__ */ jsx(Italic, { className: "icon-sm" })
              }
            )
          ] }) }),
          /* @__PURE__ */ jsx("div", { className: "property-section", children: /* @__PURE__ */ jsxs(PropertyRow, { label: "Align", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                className: `form-btn ${currentAlign === "left" ? "active" : ""}`,
                onClick: () => setAlign("left"),
                title: "Align left",
                children: /* @__PURE__ */ jsx(AlignLeft, { className: "icon-sm" })
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                className: `form-btn ${currentAlign === "center" ? "active" : ""}`,
                onClick: () => setAlign("center"),
                title: "Align center",
                children: /* @__PURE__ */ jsx(AlignCenter, { className: "icon-sm" })
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                className: `form-btn ${currentAlign === "right" ? "active" : ""}`,
                onClick: () => setAlign("right"),
                title: "Align right",
                children: /* @__PURE__ */ jsx(AlignRight, { className: "icon-sm" })
              }
            )
          ] }) })
        ] })
      }
    )
  ] });
}
function fillToHex(fill) {
  if (!fill) return "#f59e0b";
  if (fill.startsWith("#")) return fill.slice(0, 7);
  const rgba = fill.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgba) {
    const r = Number(rgba[1]).toString(16).padStart(2, "0");
    const g = Number(rgba[2]).toString(16).padStart(2, "0");
    const b = Number(rgba[3]).toString(16).padStart(2, "0");
    return `#${r}${g}${b}`;
  }
  return "#f59e0b";
}
function isShapeElement(el) {
  return el != null && (el instanceof ArrowElement || el instanceof LineElement || el instanceof RectElement || el instanceof CircleElement);
}
function AnnotationStylePanel({
  selectedElement,
  updateElement
}) {
  const [styleOpen, setStyleOpen] = useState(true);
  const [fill, setFill] = useState("#f59e0b");
  const [opacity, setOpacity] = useState(1);
  const [radius, setRadius] = useState(null);
  const [thickness, setThickness] = useState(null);
  const shape = isShapeElement(selectedElement) ? selectedElement : null;
  useEffect(() => {
    if (!shape) return;
    const props = shape.getProps();
    const currentFill = (props == null ? void 0 : props.fill) ?? (shape instanceof RectElement || shape instanceof CircleElement ? shape.getFill() : void 0);
    setFill(fillToHex(currentFill));
    setOpacity(shape.getOpacity() ?? 1);
    if (shape instanceof RectElement) {
      setRadius(shape.getCornerRadius());
      setThickness(null);
    } else if (shape instanceof CircleElement) {
      setRadius(shape.getRadius());
      setThickness(null);
    } else if (shape instanceof LineElement) {
      setThickness((props == null ? void 0 : props.height) ?? 4);
      setRadius((props == null ? void 0 : props.radius) ?? 4);
    } else if (shape instanceof ArrowElement) {
      setRadius((props == null ? void 0 : props.radius) ?? 4);
      setThickness(null);
    }
  }, [shape, selectedElement == null ? void 0 : selectedElement.getId()]);
  const handleFillChange = (value) => {
    if (!shape) return;
    setFill(value);
    const props = shape.getProps();
    if (shape instanceof RectElement || shape instanceof CircleElement) {
      shape.setFill(value);
    } else {
      shape.setProps({ ...props, fill: value });
    }
    updateElement == null ? void 0 : updateElement(shape);
  };
  const handleOpacityChange = (value) => {
    if (!shape) return;
    setOpacity(value);
    shape.setOpacity(value);
    updateElement == null ? void 0 : updateElement(shape);
  };
  const handleRadiusChange = (value) => {
    if (!shape) return;
    setRadius(value);
    if (shape instanceof RectElement) {
      shape.setCornerRadius(value);
    } else if (shape instanceof CircleElement) {
      shape.setRadius(value);
    } else {
      const props = shape.getProps();
      shape.setProps({ ...props, radius: value });
    }
    updateElement == null ? void 0 : updateElement(shape);
  };
  const handleThicknessChange = (value) => {
    if (!shape || !(shape instanceof LineElement)) return;
    setThickness(value);
    const props = shape.getProps();
    shape.setProps({ ...props, height: value, lineWidth: value });
    updateElement == null ? void 0 : updateElement(shape);
  };
  if (!shape) return null;
  return /* @__PURE__ */ jsx("div", { className: "panel-container", children: /* @__PURE__ */ jsx(
    AccordionItem,
    {
      title: "Shape style",
      icon: /* @__PURE__ */ jsx(Palette, { className: "icon-sm" }),
      isOpen: styleOpen,
      onToggle: () => setStyleOpen((open) => !open),
      children: /* @__PURE__ */ jsxs("div", { className: "properties-group", children: [
        /* @__PURE__ */ jsxs("div", { className: "panel-section", children: [
          /* @__PURE__ */ jsx("label", { className: "label-dark", children: "Color" }),
          /* @__PURE__ */ jsxs("div", { className: "color-control", children: [
            /* @__PURE__ */ jsx("label", { className: "label-small", children: "Fill" }),
            /* @__PURE__ */ jsxs("div", { className: "color-inputs", children: [
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "color",
                  value: fill,
                  onChange: (e) => handleFillChange(e.target.value),
                  className: "color-picker"
                }
              ),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  value: fill,
                  onChange: (e) => handleFillChange(e.target.value),
                  className: "color-text"
                }
              )
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "panel-section", children: [
          /* @__PURE__ */ jsx("label", { className: "label-dark", children: "Opacity" }),
          /* @__PURE__ */ jsxs("div", { className: "slider-container", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "range",
                min: "0",
                max: "100",
                step: "1",
                value: Math.round(opacity * 100),
                onChange: (e) => handleOpacityChange(Number(e.target.value) / 100),
                className: "slider-purple"
              }
            ),
            /* @__PURE__ */ jsxs("span", { className: "slider-value", children: [
              Math.round(opacity * 100),
              "%"
            ] })
          ] })
        ] }),
        radius !== null && /* @__PURE__ */ jsxs("div", { className: "panel-section", children: [
          /* @__PURE__ */ jsx("label", { className: "label-dark", children: shape instanceof CircleElement ? "Radius (size)" : "Corner radius" }),
          /* @__PURE__ */ jsxs("div", { className: "slider-container", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "range",
                min: "0",
                max: "200",
                step: "1",
                value: radius,
                onChange: (e) => handleRadiusChange(Number(e.target.value)),
                className: "slider-purple"
              }
            ),
            /* @__PURE__ */ jsx("span", { className: "slider-value", children: Math.round(radius) })
          ] })
        ] }),
        thickness !== null && shape instanceof LineElement && /* @__PURE__ */ jsxs("div", { className: "panel-section", children: [
          /* @__PURE__ */ jsx("label", { className: "label-dark", children: "Thickness" }),
          /* @__PURE__ */ jsxs("div", { className: "slider-container", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "range",
                min: "1",
                max: "40",
                step: "1",
                value: thickness,
                onChange: (e) => handleThicknessChange(Number(e.target.value)),
                className: "slider-purple"
              }
            ),
            /* @__PURE__ */ jsxs("span", { className: "slider-value", children: [
              Math.round(thickness),
              " px"
            ] })
          ] })
        ] })
      ] })
    }
  ) });
}
const DEFAULT_CANVAS_BACKGROUND = "#000000";
function PropertiesPanelContainer({
  selectedElement,
  updateElement,
  videoResolution
}) {
  const { editor, present } = useTimelineContext();
  const backgroundColor = (present == null ? void 0 : present.backgroundColor) ?? editor.getBackgroundColor() ?? DEFAULT_CANVAS_BACKGROUND;
  const handleBackgroundColorChange = useCallback(
    (value) => {
      editor.setBackgroundColor(value);
    },
    [editor]
  );
  const annotationTitle = selectedElement instanceof ArrowElement ? "Arrow callout" : selectedElement instanceof LineElement ? "Line" : selectedElement instanceof RectElement ? "Box" : selectedElement instanceof CircleElement ? "Circle" : null;
  const title = annotationTitle ?? (selectedElement instanceof TextElement ? selectedElement.getText() : null) ?? (selectedElement == null ? void 0 : selectedElement.getName()) ?? (selectedElement == null ? void 0 : selectedElement.getType()) ?? "Element";
  return /* @__PURE__ */ jsxs("aside", { className: "properties-panel", "aria-label": "Element properties inspector", children: [
    /* @__PURE__ */ jsxs("div", { className: "properties-header", children: [
      !selectedElement && /* @__PURE__ */ jsx("h3", { className: "properties-title", children: "Composition" }),
      selectedElement && selectedElement.getType() === "caption" && /* @__PURE__ */ jsx("h3", { className: "properties-title", children: "Subtitle" }),
      selectedElement && selectedElement.getType() !== "caption" && /* @__PURE__ */ jsx("h3", { className: "properties-title", children: title })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "prop-content", children: [
      !selectedElement && /* @__PURE__ */ jsxs("div", { className: "panel-container", children: [
        /* @__PURE__ */ jsx("div", { className: "panel-title", children: "Canvas & Render" }),
        /* @__PURE__ */ jsxs("div", { className: "properties-group", children: [
          /* @__PURE__ */ jsxs("div", { className: "property-section", children: [
            /* @__PURE__ */ jsx("span", { className: "property-label", children: "Size" }),
            /* @__PURE__ */ jsxs("span", { className: "properties-size-readonly", children: [
              videoResolution.width,
              " × ",
              videoResolution.height
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "color-control", children: [
            /* @__PURE__ */ jsx("label", { className: "label-small", children: "Background Color" }),
            /* @__PURE__ */ jsxs("div", { className: "color-inputs", children: [
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "color",
                  value: backgroundColor,
                  onChange: (e) => handleBackgroundColorChange(e.target.value),
                  className: "color-picker"
                }
              ),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  value: backgroundColor,
                  onChange: (e) => handleBackgroundColorChange(e.target.value),
                  className: "color-text"
                }
              )
            ] })
          ] })
        ] })
      ] }),
      selectedElement instanceof CaptionElement && /* @__PURE__ */ jsx(Fragment, { children: /* @__PURE__ */ jsx(
        CaptionPropPanel,
        {
          selectedElement,
          updateElement
        }
      ) }),
      selectedElement && !(selectedElement instanceof CaptionElement) && /* @__PURE__ */ jsx(Fragment, { children: (() => {
        const isText = selectedElement instanceof TextElement;
        const isVideo = selectedElement instanceof VideoElement;
        const isAudio = selectedElement instanceof AudioElement;
        const isAnnotation = selectedElement instanceof ArrowElement || selectedElement instanceof LineElement || selectedElement instanceof RectElement || selectedElement instanceof CircleElement;
        return /* @__PURE__ */ jsxs(Fragment, { children: [
          isText && /* @__PURE__ */ jsx(
            TextPropsPanel,
            {
              selectedElement,
              updateElement
            }
          ),
          !isAudio && /* @__PURE__ */ jsx(
            ElementProps,
            {
              selectedElement,
              updateElement
            }
          ),
          isAnnotation && /* @__PURE__ */ jsx(
            AnnotationStylePanel,
            {
              selectedElement,
              updateElement
            }
          ),
          (isVideo || isAudio) && /* @__PURE__ */ jsx(
            PlaybackPropsPanel,
            {
              selectedElement,
              updateElement
            }
          ),
          isText && /* @__PURE__ */ jsx(
            TextEffects,
            {
              selectedElement,
              updateElement
            }
          ),
          !isAudio && /* @__PURE__ */ jsx(
            Animation,
            {
              selectedElement,
              updateElement
            }
          )
        ] });
      })() })
    ] })
  ] });
}
const loadFile = (accept) => {
  return new Promise((resolve, reject) => {
    try {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = accept;
      input.style.display = "none";
      document.body.appendChild(input);
      const cleanup = () => {
        input.value = "";
        document.body.removeChild(input);
      };
      input.onchange = () => {
        const file = input.files && input.files[0];
        cleanup();
        if (!file) {
          reject(new Error("No file selected"));
          return;
        }
        resolve(file);
      };
      input.click();
    } catch (error) {
      reject(error);
    }
  });
};
const saveAsFile = (content, type, name) => {
  const blob = typeof content === "string" ? new Blob([content], { type }) : content;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
};
const useStudioOperation = (studioConfig) => {
  const { editor, present, videoResolution } = useTimelineContext();
  const { setSeekTime, setPlayerState } = useLivePlayerContext();
  const [projectName, setProjectName] = useState("");
  const onNewProject = () => {
    setPlayerState(PLAYER_STATE.PAUSED);
    editor.loadProject({
      tracks: [],
      version: 0
    });
    setSeekTime(0);
  };
  const onLoadProject = async () => {
    let project;
    setPlayerState(PLAYER_STATE.PAUSED);
    if (studioConfig == null ? void 0 : studioConfig.loadProject) {
      project = await studioConfig.loadProject();
    } else {
      const file = await loadFile("application/json");
      const text = await file.text();
      setProjectName(file.name);
      project = JSON.parse(text);
    }
    editor.loadProject(project);
    setSeekTime(0.01);
  };
  const onSaveProject = async () => {
    let fileName;
    if (projectName) {
      fileName = projectName;
    } else {
      fileName = prompt("Enter the name of the project") || "untitled-project";
      fileName = fileName + ".json";
      setProjectName(fileName);
    }
    if ((studioConfig == null ? void 0 : studioConfig.saveProject) && present) {
      await studioConfig.saveProject(present, fileName);
    } else {
      const file = await saveAsFile(
        JSON.stringify(present),
        "application/json",
        fileName
      );
      if (file) {
        console.log("File saved", file);
      }
    }
  };
  const onExportVideo = async () => {
    if ((studioConfig == null ? void 0 : studioConfig.exportVideo) && present) {
      await studioConfig.exportVideo(present, {
        outFile: "output.mp4",
        fps: 30,
        resolution: {
          width: videoResolution.width,
          height: videoResolution.height
        }
      });
    } else {
      console.warn("Export video service not configured");
    }
  };
  const onExportCaptions = async (format) => {
    if (!present) return;
    const baseName = (projectName || "captions").replace(/\.json$/i, "");
    const languages = getCaptionLanguages(present);
    if (languages.length <= 1) {
      const content = format === "srt" ? exportCaptionsAsSRT(present, languages[0]) : exportCaptionsAsVTT(present, languages[0]);
      await saveAsFile(content, "text/plain", `${baseName}.${format}`);
      return;
    }
    for (const language of languages) {
      const content = format === "srt" ? exportCaptionsAsSRT(present, language) : exportCaptionsAsVTT(present, language);
      await saveAsFile(content, "text/plain", `${baseName}.${language}.${format}`);
    }
  };
  const onExportChapters = async (format) => {
    if (!present) return;
    const content = format === "youtube" ? exportChaptersAsYouTube(present) : exportChaptersAsJSON(present);
    const fileName = `${(projectName || "chapters").replace(/\.json$/i, "")}.${format === "youtube" ? "txt" : "json"}`;
    await saveAsFile(content, "text/plain", fileName);
  };
  const addCaptionsToTimeline = (captions) => {
    var _a;
    const updatedProjectJSON = (_a = studioConfig == null ? void 0 : studioConfig.captionGenerationService) == null ? void 0 : _a.updateProjectWithCaptions(captions);
    if (updatedProjectJSON) {
      editor.loadProject(updatedProjectJSON);
    }
  };
  const getCaptionstatus = async (reqId) => {
    if (studioConfig == null ? void 0 : studioConfig.captionGenerationService) {
      const service = studioConfig.captionGenerationService;
      return await service.getRequestStatus(reqId);
    }
    return {
      status: "failed",
      error: "Caption generation service not found"
    };
  };
  return {
    onLoadProject,
    onSaveProject,
    onExportVideo,
    onNewProject,
    onExportCaptions,
    onExportChapters,
    addCaptionsToTimeline,
    getCaptionstatus
  };
};
function TwickStudio({ studioConfig }) {
  var _a;
  const {
    selectedTool,
    setSelectedTool,
    selectedElement,
    addElement,
    updateElement
  } = useStudioManager();
  const { editor, present, videoResolution, setVideoResolution } = useTimelineContext();
  const {
    onNewProject,
    onLoadProject,
    onSaveProject,
    onExportVideo,
    onExportCaptions,
    onExportChapters
  } = useStudioOperation(studioConfig);
  const twickStudiConfig = useMemo(
    () => {
      var _a2;
      return {
        canvasMode: true,
        ...studioConfig || {},
        videoProps: {
          ...(studioConfig == null ? void 0 : studioConfig.videoProps) || {},
          width: videoResolution.width,
          height: videoResolution.height,
          backgroundColor: (present == null ? void 0 : present.backgroundColor) ?? editor.getBackgroundColor() ?? ((_a2 = studioConfig == null ? void 0 : studioConfig.videoProps) == null ? void 0 : _a2.backgroundColor)
        }
      };
    },
    [videoResolution, studioConfig, present == null ? void 0 : present.backgroundColor, editor]
  );
  return /* @__PURE__ */ jsx(MediaProvider, { children: /* @__PURE__ */ jsxs("div", { className: "studio-container", children: [
    !(studioConfig == null ? void 0 : studioConfig.hideHeader) && /* @__PURE__ */ jsx(
      StudioHeader,
      {
        setVideoResolution,
        onNewProject,
        onLoadProject,
        onSaveProject,
        onExportVideo,
        onExportCaptions,
        onExportChapters
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "studio-content", children: [
      /* @__PURE__ */ jsx(
        Toolbar,
        {
          selectedTool,
          setSelectedTool,
          customTools: twickStudiConfig.customTools,
          hiddenTools: twickStudiConfig.hiddenTools
        }
      ),
      /* @__PURE__ */ jsx("div", { className: "studio-left-panel", children: /* @__PURE__ */ jsx(
        ElementPanelContainer,
        {
          videoResolution,
          selectedTool,
          setSelectedTool,
          selectedElement,
          addElement,
          updateElement,
          uploadConfig: twickStudiConfig.uploadConfig,
          studioConfig: twickStudiConfig
        }
      ) }),
      /* @__PURE__ */ jsx("main", { className: "main-container", children: /* @__PURE__ */ jsx("div", { className: "canvas-wrapper", children: /* @__PURE__ */ jsx(
        "div",
        {
          className: "canvas-container",
          style: {
            maxWidth: ((_a = twickStudiConfig.playerProps) == null ? void 0 : _a.maxWidth) ?? "100%"
          },
          children: /* @__PURE__ */ jsx(VideoEditor, { editorConfig: twickStudiConfig })
        }
      ) }) }),
      /* @__PURE__ */ jsx("div", { className: "studio-right-panel", children: /* @__PURE__ */ jsx(
        PropertiesPanelContainer,
        {
          selectedElement,
          updateElement,
          videoResolution
        }
      ) })
    ] })
  ] }) });
}
const useGenerateCaptions = (studioConfig) => {
  var _a;
  const { editor, present } = useTimelineContext();
  const onGenerateCaptions = async (videoElement, language, phraseLength) => {
    if (studioConfig == null ? void 0 : studioConfig.captionGenerationService) {
      const service = studioConfig.captionGenerationService;
      const reqId = await service.generateCaptions(
        videoElement,
        present,
        language,
        phraseLength
      );
      return reqId;
    }
    console.warn("Subtitle generation service not configured");
    return null;
  };
  const addCaptionsToTimeline = (captions) => {
    var _a2;
    const updatedProjectJSON = (_a2 = studioConfig == null ? void 0 : studioConfig.captionGenerationService) == null ? void 0 : _a2.updateProjectWithCaptions(
      captions
    );
    if (updatedProjectJSON) {
      editor.loadProject(updatedProjectJSON);
    }
  };
  const getCaptionstatus = async (reqId) => {
    if (studioConfig == null ? void 0 : studioConfig.captionGenerationService) {
      const service = studioConfig.captionGenerationService;
      return await service.getRequestStatus(reqId);
    }
    return {
      status: "failed",
      error: "Caption generation service not found"
    };
  };
  const pollingIntervalMs = ((_a = studioConfig == null ? void 0 : studioConfig.captionGenerationService) == null ? void 0 : _a.pollingIntervalMs) ?? 5e3;
  return {
    onGenerateCaptions,
    addCaptionsToTimeline,
    getCaptionstatus,
    pollingIntervalMs
  };
};
function CirclePanel({
  radius,
  fillColor,
  strokeColor,
  lineWidth,
  operation,
  setRadius,
  setFillColor,
  setStrokeColor,
  setLineWidth,
  handleApplyChanges
}) {
  return /* @__PURE__ */ jsxs("div", { className: "panel-container", children: [
    /* @__PURE__ */ jsx("div", { className: "panel-title", children: "Circle" }),
    /* @__PURE__ */ jsxs("div", { className: "panel-section", children: [
      /* @__PURE__ */ jsx("label", { className: "label-dark", children: "Radius" }),
      /* @__PURE__ */ jsxs("div", { className: "slider-container", children: [
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "range",
            min: "10",
            max: "300",
            value: radius,
            onChange: (e) => setRadius(Number(e.target.value)),
            className: "slider-purple"
          }
        ),
        /* @__PURE__ */ jsxs("span", { className: "slider-value", children: [
          radius,
          "px"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "panel-section", children: [
      /* @__PURE__ */ jsx("label", { className: "label-dark", children: "Fill Color" }),
      /* @__PURE__ */ jsxs("div", { className: "color-inputs", children: [
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "color",
            value: fillColor,
            onChange: (e) => setFillColor(e.target.value),
            className: "color-picker"
          }
        ),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "text",
            value: fillColor,
            onChange: (e) => setFillColor(e.target.value),
            className: "color-text"
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "panel-section", children: [
      /* @__PURE__ */ jsx("label", { className: "label-dark", children: "Stroke Color" }),
      /* @__PURE__ */ jsxs("div", { className: "color-inputs", children: [
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "color",
            value: strokeColor,
            onChange: (e) => setStrokeColor(e.target.value),
            className: "color-picker"
          }
        ),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "text",
            value: strokeColor,
            onChange: (e) => setStrokeColor(e.target.value),
            className: "color-text"
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "panel-section", children: [
      /* @__PURE__ */ jsx("label", { className: "label-dark", children: "Line Width" }),
      /* @__PURE__ */ jsxs("div", { className: "slider-container", children: [
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "range",
            min: "0",
            max: "20",
            value: lineWidth,
            onChange: (e) => setLineWidth(Number(e.target.value)),
            className: "slider-purple"
          }
        ),
        /* @__PURE__ */ jsxs("span", { className: "slider-value", children: [
          lineWidth,
          "px"
        ] })
      ] })
    ] }),
    operation !== "Apply Changes" && /* @__PURE__ */ jsx("div", { className: "flex panel-section", children: /* @__PURE__ */ jsx("button", { onClick: handleApplyChanges, className: "btn-primary w-full", children: operation }) })
  ] });
}
function RectPanel({
  cornerRadius,
  fillColor,
  strokeColor,
  lineWidth,
  operation,
  setCornerRadius,
  setFillColor,
  setStrokeColor,
  setLineWidth,
  handleApplyChanges
}) {
  return /* @__PURE__ */ jsxs("div", { className: "panel-container", children: [
    /* @__PURE__ */ jsx("div", { className: "panel-title", children: "Rectangle" }),
    /* @__PURE__ */ jsxs("div", { className: "panel-section", children: [
      /* @__PURE__ */ jsx("label", { className: "label-dark", children: "Corner Radius" }),
      /* @__PURE__ */ jsxs("div", { className: "slider-container", children: [
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "range",
            min: "0",
            max: "100",
            value: cornerRadius,
            onChange: (e) => setCornerRadius(Number(e.target.value)),
            className: "slider-purple"
          }
        ),
        /* @__PURE__ */ jsxs("span", { className: "slider-value", children: [
          cornerRadius,
          "px"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "panel-section", children: [
      /* @__PURE__ */ jsx("label", { className: "label-dark", children: "Fill Color" }),
      /* @__PURE__ */ jsxs("div", { className: "color-inputs", children: [
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "color",
            value: fillColor,
            onChange: (e) => setFillColor(e.target.value),
            className: "color-picker"
          }
        ),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "text",
            value: fillColor,
            onChange: (e) => setFillColor(e.target.value),
            className: "color-text"
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "panel-section", children: [
      /* @__PURE__ */ jsx("label", { className: "label-dark", children: "Stroke Color" }),
      /* @__PURE__ */ jsxs("div", { className: "color-inputs", children: [
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "color",
            value: strokeColor,
            onChange: (e) => setStrokeColor(e.target.value),
            className: "color-picker"
          }
        ),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "text",
            value: strokeColor,
            onChange: (e) => setStrokeColor(e.target.value),
            className: "color-text"
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "panel-section", children: [
      /* @__PURE__ */ jsx("label", { className: "label-dark", children: "Line Width" }),
      /* @__PURE__ */ jsxs("div", { className: "slider-container", children: [
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "range",
            min: "0",
            max: "20",
            value: lineWidth,
            onChange: (e) => setLineWidth(Number(e.target.value)),
            className: "slider-purple"
          }
        ),
        /* @__PURE__ */ jsxs("span", { className: "slider-value", children: [
          lineWidth,
          "px"
        ] })
      ] })
    ] }),
    operation !== "Apply Changes" && /* @__PURE__ */ jsx("div", { className: "flex panel-section", children: /* @__PURE__ */ jsx(
      "button",
      {
        onClick: handleApplyChanges,
        className: "btn-primary w-full",
        children: operation
      }
    ) })
  ] });
}
const sharedVideoProps = {
  width: 720,
  height: 1280
};
const DEFAULT_STUDIO_CONFIG = {
  videoProps: sharedVideoProps,
  templates: DEFAULT_PROJECT_TEMPLATES
};
const EDU_STUDIO_CONFIG = {
  ...DEFAULT_STUDIO_CONFIG,
  hiddenTools: ["circle", "rect", "generate-media"],
  templates: DEFAULT_PROJECT_TEMPLATES.filter(
    (template) => template.category === "edu" || template.category === "blank"
  )
};
const DEMO_STUDIO_CONFIG = {
  ...DEFAULT_STUDIO_CONFIG,
  hiddenTools: ["circle", "rect"],
  templates: DEFAULT_PROJECT_TEMPLATES.filter(
    (template) => template.category === "demo" || template.category === "blank"
  )
};
const MARKETING_STUDIO_CONFIG = {
  ...DEFAULT_STUDIO_CONFIG,
  hiddenTools: [],
  templates: DEFAULT_PROJECT_TEMPLATES
};
function exportProjectBundle(project, options) {
  const languages = getCaptionLanguages(project);
  const captions = (languages.length ? languages : ["default"]).map((language) => ({
    language,
    srt: exportCaptionsAsSRT(project, language),
    vtt: exportCaptionsAsVTT(project, language)
  }));
  return {
    project,
    metadata: project.metadata,
    chaptersJson: exportChaptersAsJSON(project),
    captions,
    video: {
      url: options == null ? void 0 : options.videoUrl,
      fileName: options == null ? void 0 : options.outFile
    }
  };
}
export {
  ANIMATIONS2 as ANIMATIONS,
  AnnotationsPanel,
  AudioElement2 as AudioElement,
  AudioPanel,
  BaseMediaManager,
  BrowserMediaManager2 as BrowserMediaManager,
  CAPTION_COLOR,
  CAPTION_FONT,
  CAPTION_PROPS,
  CAPTION_STYLE2 as CAPTION_STYLE,
  CAPTION_STYLE_OPTIONS2 as CAPTION_STYLE_OPTIONS,
  CaptionElement2 as CaptionElement,
  CaptionsPanel,
  ChaptersPanel,
  CircleElement2 as CircleElement,
  CirclePanel,
  CloudMediaUpload,
  DEFAULT_PROJECT_TEMPLATES,
  DEFAULT_STUDIO_CONFIG,
  DEMO_STUDIO_CONFIG,
  EDU_STUDIO_CONFIG,
  ElementAdder,
  ElementAnimation2 as ElementAnimation,
  ElementCloner,
  ElementDeserializer,
  ElementFrameEffect,
  ElementRemover,
  ElementSerializer,
  ElementSplitter,
  ElementTextEffect2 as ElementTextEffect,
  ElementUpdater,
  ElementValidator,
  INITIAL_TIMELINE_DATA,
  IconElement,
  ImageElement2 as ImageElement,
  ImagePanel,
  LivePlayer,
  LivePlayerProvider,
  MARKETING_STUDIO_CONFIG,
  PLAYER_STATE2 as PLAYER_STATE,
  PROCESS_STATE,
  PlayerControls,
  RecordPanel,
  RectElement2 as RectElement,
  RectPanel,
  ScriptPanel,
  StudioHeader,
  TEXT_EFFECTS2 as TEXT_EFFECTS,
  TIMELINE_ACTION,
  TIMELINE_ELEMENT_TYPE2 as TIMELINE_ELEMENT_TYPE,
  TemplateGalleryPanel,
  TextElement2 as TextElement,
  TextPanel,
  TimelineEditor,
  TimelineManager,
  TimelineProvider,
  Toolbar,
  Track2 as Track,
  TrackElement2 as TrackElement,
  TwickStudio,
  default2 as VideoEditor,
  VideoElement2 as VideoElement,
  VideoPanel,
  WORDS_PER_PHRASE,
  animationGifs,
  TwickStudio as default,
  exportProjectBundle,
  generateId,
  generateShortUuid,
  getAnimationGif,
  getBaseProject,
  getCurrentElements,
  getTotalDuration,
  isElementId,
  isTrackId,
  setElementColors,
  useCloudMediaUpload,
  useEditorManager2 as useEditorManager,
  useGenerateCaptions,
  useLivePlayerContext2 as useLivePlayerContext,
  usePlayerControl,
  useScreenRecorder,
  useStudioManager,
  useTimelineContext2 as useTimelineContext,
  useTimelineControl
};
//# sourceMappingURL=index.mjs.map
