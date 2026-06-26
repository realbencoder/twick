import { useState, useEffect, useRef, useMemo } from "react";
import { useDrag } from "@use-gesture/react";
import { motion, HTMLMotionProps } from "framer-motion";
import {
  MIN_DURATION,
  DRAG_TYPE,
} from "../../helpers/constants";
import { ELEMENT_COLORS } from "../../helpers/editor.utils";
import {
  FrameEffect,
  getDecimalNumber,
  TrackElement,
  TIMELINE_ELEMENT_TYPE,
} from "@twick/timeline";
import { ElementColors } from "../../helpers/types";
import "../../styles/timeline.css";

export interface TrackElementDragPayload {
  element: TrackElement;
  dragType: string;
  updates: { start: number; end: number };
}

export interface DropPointer {
  clientX: number;
  clientY: number;
}

export const TrackElementView: React.FC<{
  element: TrackElement;
  selectedItem: TrackElement | null;
  selectedIds: Set<string>;
  parentWidth: number;
  duration: number;
  nextStart: number | null;
  prevEnd: number;
  allowOverlap: boolean;
  onSelection: (element: TrackElement, event: React.MouseEvent) => void;
  onDrag: (payload: TrackElementDragPayload, dropPointer?: DropPointer) => void;
  onDragStateChange?: (isDragging: boolean, element?: TrackElement) => void;
  elementColors?: ElementColors;
}> = ({
  element,
  parentWidth,
  duration,
  nextStart,
  prevEnd,
  selectedItem,
  selectedIds,
  onSelection,
  onDrag,
  allowOverlap = false,
  onDragStateChange,
  elementColors,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const dragType = useRef<string | null>(null);
  const lastPosRef = useRef<{ start: number; end: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);

  // Extract a single thumbnail frame for video/image elements
  useEffect(() => {
    const type = element.getType();
    if (type !== 'video' && type !== 'image') return;
    const props = (element as any).getProps?.() ?? {};
    const src = props.src;
    if (!src) return;

    if (type === 'image') {
      setThumbUrl(src);
      return;
    }

    // Video: extract one frame from ~1 second in (avoid black first frame)
    let cancelled = false;

    function tryExtract(useCors: boolean) {
      const video = document.createElement('video');
      if (useCors) video.crossOrigin = 'anonymous';
      video.muted = true;
      video.preload = 'auto';

      video.onloadeddata = () => {
        if (cancelled) return;
        video.currentTime = Math.min(1, video.duration * 0.1);
      };
      video.onseeked = () => {
        if (cancelled) return;
        try {
          const w = 320;
          const h = Math.round(w * (video.videoHeight / (video.videoWidth || 1)));
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h || w;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
            if (!cancelled) setThumbUrl(dataUrl);
          }
        } catch {
          // Canvas tainted (CORS) — retry without crossOrigin won't help for toDataURL
          // Just skip thumbnail for this element
        }
        video.src = '';
        video.load();
      };
      video.onerror = () => {
        if (useCors && !cancelled) {
          // CORS blocked — retry without crossOrigin
          tryExtract(false);
        }
      };
      video.src = src;
    }

    tryExtract(true);

    return () => { cancelled = true; };
  }, [element.getId()]);

  const [position, setPosition] = useState({
    start: 0,
    end: 0,
  });

  useEffect(() => {
    setPosition({
      start: element.getStart(),
      end: element.getEnd(),
    });
  }, [element.getStart(), element.getEnd(), parentWidth, duration]);

  const bind = useDrag(({ delta: [dx], event }) => {
    if (!parentWidth) return;
    if (dx == 0) return;
    // Don't start a move if user is dragging a handle
    if (dragType.current === DRAG_TYPE.START || dragType.current === DRAG_TYPE.END) return;
    if ((event?.target as HTMLElement)?.closest?.('.twick-track-element-handle')) return;
    if (!isDragging) {
      setIsDragging(true);
      onDragStateChange?.(true, element);
    }
    dragType.current = DRAG_TYPE.MOVE;
    setPosition((prev) => {
      const span = prev.end - prev.start;
      if (span <= 0) return prev; // Prevent degenerate state
      let newStart = prev.start + (dx / parentWidth) * duration;
      newStart = Math.max(0, newStart);
      if (!allowOverlap) {
        if (prevEnd !== null && newStart < prevEnd) {
          newStart = prevEnd;
        }
        if (nextStart !== null && newStart + span > nextStart) {
          newStart = nextStart - span;
        }
      }
      // Ensure end > start always
      const newEnd = newStart + span;
      if (newEnd <= newStart) return prev;

      return {
        start: newStart,
        end: newEnd,
      };
    });
  });

  const bindStartHandle = useDrag(({ delta: [dx], event, last }) => {
    if (event) {
      event.stopPropagation();
    }
    if (dx === 0 && !last) return;
    dragType.current = DRAG_TYPE.START;
    if (last) return; // Keep dragType as START so sendUpdate adjusts startAt
    setPosition((prev) => {
      let newStart = prev.start + (dx / parentWidth) * duration;
      newStart = Math.max(0, Math.min(newStart, prev.end - MIN_DURATION));
      if (prevEnd !== null && !allowOverlap && newStart < prevEnd) {
        newStart = prevEnd;
      }
      return {
        start: newStart,
        end: prev.end,
      };
    });
  });

  const bindEndHandle = useDrag(({ delta: [dx], event, last }) => {
    if (event) {
      event.stopPropagation();
    }
    if (dx === 0 && !last) return;
    dragType.current = DRAG_TYPE.END;
    if (last) return; // Keep dragType as END so sendUpdate knows it was an edge drag
    setPosition((prev) => {
      let newEnd = prev.end + (dx / parentWidth) * duration;
      newEnd = Math.max(newEnd, prev.start + MIN_DURATION);
      // Note: end clamping for overlays is handled in onElementDrag (useTimelineManager)
      // where editor context is available to check track type.
      if (!allowOverlap) {
        if (nextStart !== null && newEnd > nextStart) {
          newEnd = nextStart;
        }
      }
      return {
        start: prev.start,
        end: newEnd,
      };
    });
  });

  const setLastPos = () => {
    lastPosRef.current = position;
  };

  const sendUpdate = (e?: React.MouseEvent | React.TouchEvent) => {
    let dropPointer: DropPointer | undefined;
    if (e) {
      if ("clientX" in e) {
        dropPointer = { clientX: e.clientX, clientY: e.clientY };
      } else if ("changedTouches" in e && e.changedTouches?.[0]) {
        const t = e.changedTouches[0];
        dropPointer = { clientX: t.clientX, clientY: t.clientY };
      }
    }
    setIsDragging(false);
    onDragStateChange?.(false, element);
    const payload: TrackElementDragPayload = {
      element,
      updates: {
        start: getDecimalNumber(position.start),
        end: getDecimalNumber(position.end),
      },
      dragType: dragType.current || "",
    };
    const didChange =
      lastPosRef.current?.start !== position.start ||
      lastPosRef.current?.end !== position.end;
    if (didChange || dropPointer) {
      onDrag(payload, dropPointer);
    }
  };

  const getElementColor = (elementType: string) => {
    const colors = elementColors || ELEMENT_COLORS;

    const key =
      elementType === TIMELINE_ELEMENT_TYPE.VIDEO
        ? "video"
        : elementType === TIMELINE_ELEMENT_TYPE.AUDIO
        ? "audio"
        : elementType === TIMELINE_ELEMENT_TYPE.IMAGE
        ? "image"
        : elementType === TIMELINE_ELEMENT_TYPE.TEXT
        ? "text"
        : elementType === TIMELINE_ELEMENT_TYPE.CAPTION
        ? "caption"
        : elementType === TIMELINE_ELEMENT_TYPE.RECT
        ? "rect"
        : elementType === TIMELINE_ELEMENT_TYPE.CIRCLE
        ? "circle"
        : elementType === TIMELINE_ELEMENT_TYPE.ICON
        ? "icon"
        : elementType === TIMELINE_ELEMENT_TYPE.EFFECT
        ? "effect"
        : "element";

    if (key in colors) {
      return colors[key as keyof typeof colors];
    }
    return ELEMENT_COLORS.element;
  };

  const isSelected = useMemo(() => {
    return selectedIds.has(element.getId());
  }, [selectedIds, element]);

  const hasHandles =
    selectedItem?.getId() === element.getId();

  const motionProps: HTMLMotionProps<"div"> = {
    ref,
    className: `twick-track-element ${
      isSelected
        ? "twick-track-element-selected"
        : "twick-track-element-default"
    } ${isDragging ? "twick-track-element-dragging" : ""}`,
    onMouseDown: (e) => {
      if (e.target === ref.current) {
        setLastPos();
      }
    },
    onTouchStart: (e) => {
      if (e.target === ref.current) {
        setLastPos();
      }
    },
    onMouseUp: (e) => sendUpdate(e),
    onTouchEnd: (e) => sendUpdate(e),
    onClick: (e: React.MouseEvent) => {
      if (onSelection) {
        onSelection(element, e);
      }
    },
    style: {
      backgroundColor: getElementColor(element.getType()),
      width: `${((position.end - position.start) / duration) * 100}%`,
      left: `${(position.start / duration) * 100}%`,
      touchAction: "none",
      ...(thumbUrl ? {
        backgroundImage: `url(${thumbUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      } : {}),
    },
  };

  return (
    <motion.div {...motionProps}>
      <div style={{ touchAction: "none", height: "100%" }} {...bind()}>
        {hasHandles ? (
          <div
            style={{ touchAction: "none" , zIndex: isSelected? 100 : 1}}
            {...bindStartHandle()}
            className="twick-track-element-handle twick-track-element-handle-start"
          />
        ) : null}
        <div className="twick-track-element-content">
          {element.getType() === TIMELINE_ELEMENT_TYPE.EFFECT
            ? (element as any).getProps?.()?.effectKey ?? "Effect"
            : (element as any).getText
            ? (element as any).getText()
            : element.getName() || element.getType()}
        </div>
        {hasHandles ? (
          <div
            style={{ touchAction: "none", zIndex: isSelected? 100 : 1 }}
            {...bindEndHandle()}
            className="twick-track-element-handle twick-track-element-handle-end"
          />
        ) : null}
        {(element as any).getFrameEffects
          ? (element as any)
              .getFrameEffects()
              .map((frameEffect: FrameEffect) => {
                return (
                  <div
                    className="twick-track-element-frame-effect"
                    key={frameEffect.s + frameEffect.e}
                    style={{
                      backgroundColor: getElementColor("frameEffect"),
                      width: `${
                        ((frameEffect.e - frameEffect.s) /
                          element.getDuration()) *
                        100
                      }%`,
                      left: `${(frameEffect.s / element.getDuration()) * 100}%`,
                    }}
                  ></div>
                );
              })
          : null}
      </div>
    </motion.div>
  );
};

export default TrackElementView;
