import { ElementVisitor } from "./element-visitor";
import { VideoElement } from "../elements/video.element";
import { AudioElement } from "../elements/audio.element";
import { ImageElement } from "../elements/image.element";
import { TextElement } from "../elements/text.element";
import { CaptionElement } from "../elements/caption.element";
import { RectElement } from "../elements/rect.element";
import { CircleElement } from "../elements/circle.element";
import { IconElement } from "../elements/icon.element";
import { PlaceholderElement } from "../elements/placeholder.element";
import { ElementCloner } from "./element-cloner";
import { canSplitElement } from "../../utils/timeline.utils";
import { ArrowElement } from "../elements/arrow.element";
import { LineElement } from "../elements/line.element";
import { EffectElement } from "../elements/effect.element";

export interface SplitResult {
  firstElement: any;
  secondElement: any;
  success: boolean;
}

export class ElementSplitter implements ElementVisitor<SplitResult> {
  private splitTime: number;
  private elementCloner: ElementCloner;
  constructor(splitTime: number) {
    this.splitTime = splitTime;
    this.elementCloner = new ElementCloner();
  }

  visitVideoElement(element: VideoElement): SplitResult {
    if (!canSplitElement(element, this.splitTime)) {
      return { firstElement: null, secondElement: null, success: false };
    }

    const firstElement = this.elementCloner.visitVideoElement(
      element
    ) as VideoElement;
    const secondElement = this.elementCloner.visitVideoElement(
      element
    ) as VideoElement;

    const props = element.getProps();
    const secondStartAt =
      (props!.time ?? 0) +
      (this.splitTime - element.getStart()) * (props!.playbackRate ?? 1);
    firstElement.setEnd(this.splitTime);
    secondElement.setStart(this.splitTime).setStartAt(secondStartAt);

    return { firstElement, secondElement, success: true };
  }

  visitAudioElement(element: AudioElement): SplitResult {
    if (!canSplitElement(element, this.splitTime)) {
      return { firstElement: null, secondElement: null, success: false };
    }
    const firstElement = this.elementCloner.visitAudioElement(
      element
    ) as AudioElement;
    const secondElement = this.elementCloner.visitAudioElement(
      element
    ) as AudioElement;

    const props = element.getProps();
    const secondStartAt =
      (props!.time ?? 0) +
      (this.splitTime - element.getStart()) * (props!.playbackRate ?? 1);
    firstElement.setEnd(this.splitTime);
    secondElement.setStart(this.splitTime).setStartAt(secondStartAt);

    return { firstElement, secondElement, success: true };
  }

  visitImageElement(element: ImageElement): SplitResult {
    if (!canSplitElement(element, this.splitTime)) {
      return { firstElement: null, secondElement: null, success: false };
    }
    const firstElement = this.elementCloner.visitImageElement(
      element
    ) as ImageElement;
    const secondElement = this.elementCloner.visitImageElement(
      element
    ) as ImageElement;
    firstElement.setEnd(this.splitTime);
    secondElement.setStart(this.splitTime);
    return { firstElement, secondElement, success: true };
  }

  visitTextElement(element: TextElement): SplitResult {
    if (!canSplitElement(element, this.splitTime)) {
      return { firstElement: null, secondElement: null, success: false };
    }
    const originalText = element.getText() || "";
    const originalTextArray = originalText.split(" ");
    const percentage =
      (this.splitTime - element.getStart()) / element.getDuration();
    const firstElement = this.elementCloner.visitTextElement(
      element
    ) as TextElement;
    firstElement.setText(
      originalTextArray
        .slice(0, Math.floor(originalTextArray.length * percentage))
        .join(" ")
    );
    firstElement.setEnd(this.splitTime);
    const secondElement = this.elementCloner.visitTextElement(
      element
    ) as TextElement;
    secondElement.setText(
      originalTextArray
        .slice(
          Math.floor(originalTextArray.length * percentage),
          originalTextArray.length
        )
        .join(" ")
    );
    secondElement.setStart(this.splitTime);
    return { firstElement, secondElement, success: true };
  }

  visitCaptionElement(element: CaptionElement): SplitResult {
    if (!canSplitElement(element, this.splitTime)) {
      return { firstElement: null, secondElement: null, success: false };
    }
    const originalText = element.getText() || "";
    const originalTextArray = originalText.split(" ");
    const percentage =
      (this.splitTime - element.getStart()) / element.getDuration();
    // A single-word (or empty) caption can't split into two non-empty halves —
    // leave it whole rather than emit an empty-text caption that renders NOTHING
    // for its entire window (the "a section shows no subtitle after a cut" bug).
    // Ripple-delete will trim it later if footage is actually removed.
    if (originalTextArray.length < 2) {
      return { firstElement: null, secondElement: null, success: false };
    }
    // Clamp so NEITHER half is empty. A cut inside the first word's time-fraction
    // would give index 0 (empty first half); inside the last word's fraction would
    // give index === length (empty second half). Keep both halves at >= 1 word.
    const splitWordIndex = Math.max(
      1,
      Math.min(
        originalTextArray.length - 1,
        Math.floor(originalTextArray.length * percentage)
      )
    );

    const firstElement = this.elementCloner.visitCaptionElement(
      element
    ) as CaptionElement;
    firstElement.setText(
      originalTextArray.slice(0, splitWordIndex).join(" ")
    );
    firstElement.setEnd(this.splitTime);

    const secondElement = this.elementCloner.visitCaptionElement(
      element
    ) as CaptionElement;
    secondElement.setText(
      originalTextArray.slice(splitWordIndex).join(" ")
    );
    secondElement.setStart(this.splitTime);

    // Split wordsMs array to match the text split — each half gets only
    // the word timestamps that belong to its words. Without this, both
    // halves inherit the full original wordsMs, causing word count vs
    // array length mismatch and completely wrong subtitle timing.
    const originalProps = element.getProps() ?? {};
    const originalMeta = element.getMetadata?.() ?? {};
    const propsWordsMs = (originalProps as Record<string, unknown>).wordsMs;
    const metaWordsMs = (originalMeta as Record<string, unknown>).wordsMs;

    if (Array.isArray(propsWordsMs) && propsWordsMs.length > 0) {
      const firstProps = firstElement.getProps() ?? {};
      (firstProps as Record<string, unknown>).wordsMs = propsWordsMs.slice(0, splitWordIndex);
      firstElement.setProps(firstProps);

      const secondProps = secondElement.getProps() ?? {};
      (secondProps as Record<string, unknown>).wordsMs = propsWordsMs.slice(splitWordIndex);
      secondElement.setProps(secondProps);
    }
    if (Array.isArray(metaWordsMs) && metaWordsMs.length > 0) {
      const firstMeta = firstElement.getMetadata?.() ?? {};
      (firstMeta as Record<string, unknown>).wordsMs = metaWordsMs.slice(0, splitWordIndex);
      firstElement.setMetadata?.(firstMeta);

      const secondMeta = secondElement.getMetadata?.() ?? {};
      (secondMeta as Record<string, unknown>).wordsMs = metaWordsMs.slice(splitWordIndex);
      secondElement.setMetadata?.(secondMeta);
    }

    return { firstElement, secondElement, success: true };
  }

  visitRectElement(element: RectElement): SplitResult {
    if (!canSplitElement(element, this.splitTime)) {
      return { firstElement: null, secondElement: null, success: false };
    }
    const firstElement = this.elementCloner.visitRectElement(
      element
    ) as RectElement;
    const secondElement = this.elementCloner.visitRectElement(
      element
    ) as RectElement;
    firstElement.setEnd(this.splitTime);
    secondElement.setStart(this.splitTime);
    return { firstElement, secondElement, success: true };
  }

  visitCircleElement(element: CircleElement): SplitResult {
    if (!canSplitElement(element, this.splitTime)) {
      return { firstElement: null, secondElement: null, success: false };
    }
    const firstElement = this.elementCloner.visitCircleElement(element);
    const secondElement = this.elementCloner.visitCircleElement(element);
    firstElement.setEnd(this.splitTime);
    secondElement.setStart(this.splitTime);
    return { firstElement, secondElement, success: true };
  }

  visitIconElement(element: IconElement): SplitResult {
    if (!canSplitElement(element, this.splitTime)) {
      return { firstElement: null, secondElement: null, success: false };
    }
    const firstElement = this.elementCloner.visitIconElement(element);
    const secondElement = this.elementCloner.visitIconElement(element);
    firstElement.setEnd(this.splitTime);
    secondElement.setStart(this.splitTime);
    return { firstElement, secondElement, success: true };
  }

  visitPlaceholderElement(element: PlaceholderElement): SplitResult {
    if (!canSplitElement(element, this.splitTime)) {
      return { firstElement: null, secondElement: null, success: false };
    }
    const firstElement = this.elementCloner.visitPlaceholderElement(element);
    const secondElement = this.elementCloner.visitPlaceholderElement(element);
    firstElement.setEnd(this.splitTime);
    secondElement.setStart(this.splitTime);
    return { firstElement, secondElement, success: true };
  }

  visitArrowElement(element: ArrowElement): SplitResult {
    if (!canSplitElement(element, this.splitTime)) {
      return { firstElement: null, secondElement: null, success: false };
    }
    const firstElement = this.elementCloner.visitArrowElement(element);
    const secondElement = this.elementCloner.visitArrowElement(element);
    firstElement.setEnd(this.splitTime);
    secondElement.setStart(this.splitTime);
    return { firstElement, secondElement, success: true };
  }

  visitLineElement(element: LineElement): SplitResult {
    if (!canSplitElement(element, this.splitTime)) {
      return { firstElement: null, secondElement: null, success: false };
    }
    const firstElement = this.elementCloner.visitLineElement(element) as LineElement;
    const secondElement = this.elementCloner.visitLineElement(element) as LineElement;
    firstElement.setEnd(this.splitTime);
    secondElement.setStart(this.splitTime);
    return { firstElement, secondElement, success: true };
  }

  visitEffectElement(element: EffectElement): SplitResult {
    if (!canSplitElement(element, this.splitTime)) {
      return { firstElement: null, secondElement: null, success: false };
    }
    const firstElement = this.elementCloner.visitEffectElement(
      element
    ) as EffectElement;
    const secondElement = this.elementCloner.visitEffectElement(
      element
    ) as EffectElement;
    firstElement.setEnd(this.splitTime);
    secondElement.setStart(this.splitTime);
    return { firstElement, secondElement, success: true };
  }
}
