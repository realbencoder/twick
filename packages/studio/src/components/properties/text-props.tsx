import { TextElement } from "@twick/timeline";
import type { PropertiesPanelProps } from "../../types";
import { AccordionItem } from "../shared/accordion-item";
import { PropertyRow } from "./property-row";
import { Type, AlignLeft, AlignCenter, AlignRight, Bold, Italic } from "lucide-react";
import { useState } from "react";

/**
 * The renderers' default line advance: src/lib/text-layout.ts TEXT_LINE_HEIGHT, which is
 * Fabric's own 1.16 x 1.13. The app's text-props dist test pins the slider default to it.
 */
const TEXT_DEFAULT_LINE_HEIGHT = 1.3108;
const LINE_HEIGHT_MIN = 0.8;
const LINE_HEIGHT_MAX = 2;
const LINE_HEIGHT_STEP = 0.01;
/** A width-less text wraps at 90% of the canvas in BOTH renderers (TEXT_DEFAULT_WIDTH_RATIO). */
const TEXT_DEFAULT_WIDTH_RATIO = 0.9;
const WIDTH_MIN_RATIO = 0.1;

export function TextPropsPanel({
  selectedElement,
  updateElement,
  videoResolution,
}: PropertiesPanelProps) {
  if (!(selectedElement instanceof TextElement)) return null;

  const textProps = selectedElement.getProps() || {};

  // Open by default: the Width and Line height rows are the point of this section, and a
  // collapsed accordion hid them (founder call 2026-09-13).
  const [isTypographyOpen, setIsTypographyOpen] = useState(true);

  const currentAlign = textProps.textAlign ?? "center";
  const currentWeight = textProps.fontWeight ?? 400;
  const isBold = currentWeight >= 600;
  const isItalic = textProps.fontStyle === "italic";

  const canvasWidth = Math.max(1, Math.round(videoResolution?.width ?? 1080));
  const widthMin = Math.round(canvasWidth * WIDTH_MIN_RATIO);
  const hasWidth =
    typeof textProps.width === "number" && Number.isFinite(textProps.width) && textProps.width > 0;
  const widthValue = Math.min(
    canvasWidth,
    Math.max(
      widthMin,
      Math.round(hasWidth ? (textProps.width as number) : canvasWidth * TEXT_DEFAULT_WIDTH_RATIO)
    )
  );
  const hasLineHeight =
    typeof textProps.lineHeight === "number" &&
    Number.isFinite(textProps.lineHeight) &&
    textProps.lineHeight > 0;
  const lineHeightValue = hasLineHeight ? (textProps.lineHeight as number) : TEXT_DEFAULT_LINE_HEIGHT;

  /** Keys whose patch value is `undefined` are DELETED from props — absent means "auto". */
  const handleUpdate = (patch: Partial<typeof textProps>) => {
    if (!selectedElement) return;
    const next: Record<string, unknown> = { ...textProps };
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined) delete next[key];
      else next[key] = value;
    }
    selectedElement.setProps(next as unknown as typeof textProps);
    updateElement?.(selectedElement);
  };

  const toggleBold = () => {
    handleUpdate({ fontWeight: isBold ? 400 : 700 });
  };

  const toggleItalic = () => {
    handleUpdate({ fontStyle: isItalic ? "normal" : "italic" });
  };

  const setAlign = (align: "left" | "center" | "right") => {
    handleUpdate({ textAlign: align });
  };

  return (
    <div className="panel-container">
      <div className="panel-title">Typography</div>
      <AccordionItem
        title="Typography"
        icon={<Type className="icon-sm" />}
        isOpen={isTypographyOpen}
        onToggle={() => setIsTypographyOpen((open) => !open)}
      >
        <div className="properties-group">
          {/* Font size */}
          <div className="property-section">
            <PropertyRow
              label="Font size"
              secondary={<span>{textProps.fontSize ?? 48}px</span>}
            >
              <input
                type="range"
                min={8}
                max={160}
                value={textProps.fontSize ?? 48}
                onChange={(e) =>
                  handleUpdate({ fontSize: Number(e.target.value) })
                }
                className="slider-purple"
              />
            </PropertyRow>
          </div>

          {/* Width: the wrap width, independent of font size. The same value the left/right
              edge handles on the canvas write; the font size never moves with it. */}
          <div className="property-section">
            <PropertyRow
              label="Width"
              secondary={
                <span>{hasWidth ? `${Math.round(textProps.width as number)}px` : "Auto"}</span>
              }
            >
              <input
                type="range"
                min={widthMin}
                max={canvasWidth}
                step={1}
                value={widthValue}
                onChange={(e) =>
                  handleUpdate({ width: Number(e.target.value), maxWidth: undefined })
                }
                className="slider-purple"
                aria-label="Width"
              />
            </PropertyRow>
          </div>

          {/* Line height: a multiple of the font size. Absent = the renderers' default. */}
          <div className="property-section">
            <PropertyRow
              label="Line height"
              secondary={
                <span>
                  {hasLineHeight ? lineHeightValue.toFixed(2) : "Auto"}
                  {hasLineHeight && (
                    <button
                      type="button"
                      className="form-btn"
                      onClick={() => handleUpdate({ lineHeight: undefined })}
                      title="Reset line height"
                      aria-label="Reset line height"
                    >
                      Reset
                    </button>
                  )}
                </span>
              }
            >
              <input
                type="range"
                min={LINE_HEIGHT_MIN}
                max={LINE_HEIGHT_MAX}
                step={LINE_HEIGHT_STEP}
                value={lineHeightValue}
                onChange={(e) =>
                  handleUpdate({ lineHeight: Number(e.target.value) })
                }
                className="slider-purple"
                aria-label="Line height"
              />
            </PropertyRow>
          </div>

          {/* Style: bold / italic */}
          <div className="property-section">
            <PropertyRow label="Style">
              <button
                type="button"
                className={`form-btn ${isBold ? "active" : ""}`}
                onClick={toggleBold}
                title="Bold"
              >
                <Bold className="icon-sm" />
              </button>
              <button
                type="button"
                className={`form-btn ${isItalic ? "active" : ""}`}
                onClick={toggleItalic}
                title="Italic"
              >
                <Italic className="icon-sm" />
              </button>
            </PropertyRow>
          </div>

          {/* Alignment */}
          <div className="property-section">
            <PropertyRow label="Align">
              <button
                type="button"
                className={`form-btn ${currentAlign === "left" ? "active" : ""}`}
                onClick={() => setAlign("left")}
                title="Align left"
              >
                <AlignLeft className="icon-sm" />
              </button>
              <button
                type="button"
                className={`form-btn ${
                  currentAlign === "center" ? "active" : ""
                }`}
                onClick={() => setAlign("center")}
                title="Align center"
              >
                <AlignCenter className="icon-sm" />
              </button>
              <button
                type="button"
                className={`form-btn ${currentAlign === "right" ? "active" : ""}`}
                onClick={() => setAlign("right")}
                title="Align right"
              >
                <AlignRight className="icon-sm" />
              </button>
            </PropertyRow>
          </div>

        </div>
      </AccordionItem>
    </div>
  );
}
