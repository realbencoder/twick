import { RectElement, CircleElement, ImageElement, VideoElement, TrackElement } from "@twick/timeline";
import type { PropertiesPanelProps } from "../../types";
import { PropertyRow } from "./property-row";
import { Ruler, ArrowUp, ArrowDown } from "lucide-react";
import { AccordionItem } from "../shared/accordion-item";
import { useState, useRef, useEffect } from "react";

export function ElementProps({ selectedElement, updateElement, onBringForward, onSendBackward, canBringForward = true, canSendBackward = true }: PropertiesPanelProps & { onBringForward?: () => void; onSendBackward?: () => void; canBringForward?: boolean; canSendBackward?: boolean }) {
  const opacity = selectedElement?.getOpacity() || 1;
  const rotation = selectedElement?.getRotation() || 0;
  const position = selectedElement?.getPosition() || { x: 0, y: 0 };

  // Scale: track via local state for smooth slider interaction
  const hasFrame = selectedElement instanceof ImageElement || selectedElement instanceof VideoElement;
  const frame = hasFrame ? (selectedElement as any).getFrame?.() : null;
  const baseSizeRef = useRef<[number, number] | null>(null);
  const [scalePercent, setScalePercent] = useState(100);

  // Capture the initial size when element is first selected
  useEffect(() => {
    if (hasFrame && frame?.size) {
      baseSizeRef.current = [...frame.size] as [number, number];
      setScalePercent(100);
    }
    return () => { baseSizeRef.current = null; };
  }, [selectedElement]);

  const handleScaleChange = (percent: number) => {
    if (!selectedElement || !hasFrame || !frame || !baseSizeRef.current) return;
    setScalePercent(percent);
    const factor = percent / 100;
    const newW = Math.round(baseSizeRef.current[0] * factor);
    const newH = Math.round(baseSizeRef.current[1] * factor);
    (selectedElement as any).setFrame?.({ ...frame, size: [newW, newH] });
    updateElement?.(selectedElement as TrackElement);
  };

  const handleRotationChange = (rotation: number) => {
    if (selectedElement) {
      selectedElement.setRotation(rotation);
      updateElement?.(selectedElement as TrackElement);
    }
  }

  const handleOpacityChange = (opacity: number) => {
    if (selectedElement) {
      selectedElement.setOpacity(opacity);
      updateElement?.(selectedElement as TrackElement);
    }
  }
  const handlePositionChange = (props: Record<string, any>) => {
    if (selectedElement) {
      selectedElement.setPosition({ x: props.x ?? 0, y: props.y ?? 0 });
      updateElement?.(selectedElement as TrackElement);
    }
  }

  const handleDimensionsChange = (width?: number, height?: number) => {
    if (!selectedElement) return;
    if (selectedElement instanceof RectElement) {
      const size = selectedElement.getSize();
      selectedElement.setSize({ width: width ?? size.width, height: height ?? size.height });
      updateElement?.(selectedElement as TrackElement);
    } else if (selectedElement instanceof CircleElement) {
      const dims = {
        width: selectedElement.getRadius() * 2,
        height: selectedElement.getRadius() * 2,
      };
      const newDiameter =
        width !== undefined && width !== dims.width ? width : (height ?? dims.height);
      selectedElement.setRadius(newDiameter / 2);
      updateElement?.(selectedElement as TrackElement);
    }
  }

  const hasShapeDimensions =
    selectedElement instanceof RectElement || selectedElement instanceof CircleElement;

  let dimensions: { width: number; height: number } | null = null;
  if (selectedElement instanceof RectElement) {
    dimensions = selectedElement.getSize();
  } else if (selectedElement instanceof CircleElement) {
    const r = selectedElement.getRadius();
    dimensions = { width: r * 2, height: r * 2 };
  }

  const [isTransformOpen, setIsTransformOpen] = useState(false);

  return (
    <div className="panel-container">
      <div className="panel-title">Properties</div>

      <AccordionItem
        title="Transform"
        icon={<Ruler className="icon-sm" />}
        isOpen={isTransformOpen}
        onToggle={() => setIsTransformOpen((open) => !open)}
      >
        <div className="properties-group">
          <div className="property-section">
            <PropertyRow label="Position X">
              <input
                type="number"
                value={position.x ?? 0}
                onChange={(e) =>
                  handlePositionChange({ x: Number(e.target.value) })
                }
                className="input-dark"
              />
            </PropertyRow>
            <PropertyRow label="Position Y">
              <input
                type="number"
                value={position.y ?? 0}
                onChange={(e) =>
                  handlePositionChange({ y: Number(e.target.value) })
                }
                className="input-dark"
              />
            </PropertyRow>
          </div>

          {/* Dimensions - for rect, circle only; image/video resize via canvas */}
          {hasShapeDimensions && dimensions && (
            <div className="property-section">
              <PropertyRow label="Width">
                <input
                  type="number"
                  min={1}
                  value={Math.round(dimensions.width)}
                  onChange={(e) =>
                    handleDimensionsChange(
                      Number(e.target.value),
                      dimensions!.height
                    )
                  }
                  className="input-dark"
                />
              </PropertyRow>
              <PropertyRow label="Height">
                <input
                  type="number"
                  min={1}
                  value={Math.round(dimensions.height)}
                  onChange={(e) =>
                    handleDimensionsChange(
                      dimensions!.width,
                      Number(e.target.value)
                    )
                  }
                  className="input-dark"
                />
              </PropertyRow>
            </div>
          )}

          {/* Opacity */}
          <div className="property-section">
            <PropertyRow
              label="Opacity"
              secondary={
                <span>
                  {Math.round((opacity ?? 1) * 100)}
                  %
                </span>
              }
            >
              <input
                type="range"
                min="0"
                max="100"
                value={(opacity ?? 1) * 100}
                onChange={(e) =>
                  handleOpacityChange(Number(e.target.value) / 100)
                }
                className="slider-purple"
              />
            </PropertyRow>
          </div>

          {/* Scale — for image/video elements */}
          {hasFrame && (
            <div className="property-section">
              <PropertyRow
                label="Scale"
                secondary={
                  <span>{scalePercent}%</span>
                }
              >
                <input
                  type="range"
                  min="10"
                  max="400"
                  step="1"
                  value={scalePercent}
                  onChange={(e) => handleScaleChange(Number(e.target.value))}
                  className="slider-purple"
                />
              </PropertyRow>
            </div>
          )}

          {/* Rotation */}
          <div className="property-section">
            <PropertyRow
              label="Rotation"
              secondary={
                <span>
                  {Math.round(rotation ?? 0)}
                  °
                </span>
              }
            >
              <input
                type="range"
                min="0"
                max="360"
                value={rotation ?? 0}
                onChange={(e) => handleRotationChange(Number(e.target.value))}
                className="slider-purple"
              />
            </PropertyRow>
          </div>

          {/* Layer order */}
          <div className="property-section">
            <PropertyRow label="Layer">
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  type="button"
                  onClick={onBringForward}
                  disabled={!canBringForward}
                  className="btn-ghost"
                  title={canBringForward ? "Bring forward" : "Already at the front"}
                  style={{ padding: '4px 8px', fontSize: '11px', opacity: canBringForward ? 1 : 0.4, cursor: canBringForward ? 'pointer' : 'not-allowed' }}
                >
                  <ArrowUp className="icon-sm" /> Front
                </button>
                <button
                  type="button"
                  onClick={onSendBackward}
                  disabled={!canSendBackward}
                  className="btn-ghost"
                  title={canSendBackward ? "Send backward" : "Already at the back"}
                  style={{ padding: '4px 8px', fontSize: '11px', opacity: canSendBackward ? 1 : 0.4, cursor: canSendBackward ? 'pointer' : 'not-allowed' }}
                >
                  <ArrowDown className="icon-sm" /> Back
                </button>
              </div>
            </PropertyRow>
          </div>
        </div>
      </AccordionItem>
    </div>
  );
}
