import { useState, useEffect, useRef } from "react";
import {
  CAPTION_STYLE,
  CaptionElement,
  Track,
  useTimelineContext,
} from "@twick/timeline";
import { CAPTION_PROPS } from "../helpers/constant";
import type { CaptionPanelEntry } from "../types";

export const useCaptionsPanel = () => {
  const [captions, setCaptions] = useState<CaptionPanelEntry[]>([]);
  const captionsTrack = useRef<Track | null>(null);
  const { editor } = useTimelineContext();

  const resolveCaptionTracks = (): Track[] => {
    return (editor.getTimelineData()?.tracks || []).filter(
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
      editorCaptionsTrack.getElements().map((element) => ({
        s: element.getStart(),
        e: element.getEnd(),
        t: (element as CaptionElement).getText(),
        isCustom: (element.getProps() as any)?.useTrackDefaults === false,
      }))
    );
  };

  useEffect(() => {
    fetchCaptions();
  }, []);

  const checkCaptionsTrack = () => {
    if (!captionsTrack.current) {
      captionsTrack.current = editor.addTrack("Subtitles", "caption");
      const props: Record<string, any> = {
        capStyle: CAPTION_STYLE.WORD_BG_HIGHLIGHT,
        ...CAPTION_PROPS[CAPTION_STYLE.WORD_BG_HIGHLIGHT],
        x: 0,
        y: 200,
      };
      captionsTrack.current?.setProps(props);
    }
  };

  const addCaption = () => {
    const newCaption: CaptionPanelEntry = { s: 0, e: 0, t: "New Caption", isCustom: false };
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
    editor.addElementToTrack(captionsTrack.current as Track, captionElement);
  };

  const splitCaption = async (index: number) => {
    if (captionsTrack.current) {
      const element = captionsTrack.current.getElements()[
        index
      ] as CaptionElement;
      const splitResult = await editor.splitElement(
        element,
        element.getStart() + element.getDuration() / 2
      );
      if (splitResult.success) {
        fetchCaptions();
      }
    }
  };

  const deleteCaption = (index: number) => {
    if (captionsTrack.current) {
      // Get element BEFORE updating state to avoid index mismatch
      const elements = captionsTrack.current.getElements();
      if (index < elements.length) {
        editor.rippleRemoveElement(elements[index]);
      }
    }
    setCaptions(captions.filter((_, i) => i !== index));
  };

  const updateCaption = (index: number, caption: CaptionPanelEntry) => {
    if (captionsTrack.current) {
      // Get element BEFORE updating state to avoid index mismatch
      const elements = captionsTrack.current.getElements();
      if (index < elements.length) {
        const element = elements[index] as CaptionElement;
        element.setText(caption.t);
        editor.updateElement(element);
      }
    }
    setCaptions(captions.map((sub, i) => (i === index ? caption : sub)));
  };

  // Re-sync word-level timings to the edited text — called on BLUR (end of the edit session),
  // NOT per keystroke. Per-keystroke would destroy acoustic timings on transient states: deleting
  // a word then retyping it (count 3→2→3) would hit the count-mismatch regen on the intermediate
  // state, permanently replacing Deepgram-aligned times with synthetic letter-weighted ones even
  // though the FINAL text has the same word count. On blur, only the final text matters:
  // no wordsMs → no-op (manual captions untouched); same final count → no-op (equal window ⟹
  // zero delta, acoustic timing preserved); changed count → letter-weighted regeneration.
  // Without this, a word-count-changing edit leaves wordsMs stale and word-by-word/karaoke
  // highlighting desyncs (activeIdx computed against the old word list).
  const finalizeCaptionText = (index: number) => {
    if (!captionsTrack.current) return;
    const elements = captionsTrack.current.getElements();
    if (index >= elements.length) return;
    const element = elements[index] as CaptionElement;
    // Gate: adjust is only MEANINGFUL when the word count no longer matches wordsMs (Case 2 regen).
    // Same-count is a mathematical no-op (equal window ⟹ zero delta), and blur fires on every
    // focus-out — without this gate, a no-edit click-through would still call updateElement and
    // pollute undo history with an empty commit. Tokenize the same way the editor method does.
    const props = (element.getProps() ?? {}) as Record<string, unknown>;
    const meta = (element.getMetadata?.() ?? {}) as Record<string, unknown>;
    const wordsArr = Array.isArray(props.wordsMs)
      ? (props.wordsMs as unknown[])
      : Array.isArray(meta.wordsMs)
      ? (meta.wordsMs as unknown[])
      : null;
    if (!wordsArr) return; // manual caption — nothing to re-sync
    const wordCount = String(element.getText() ?? "")
      .split(" ")
      .map((w) => w.trim())
      .filter((w) => w.length > 0).length;
    if (wordCount === 0 || wordsArr.length === wordCount) return; // in sync — no commit
    editor.adjustCaptionWordsForTimeChange(
      element,
      element.getStart(),
      element.getEnd()
    );
    editor.updateElement(element);
  };

  return {
    captions,
    addCaption,
    splitCaption,
    deleteCaption,
    updateCaption,
    finalizeCaptionText,
  };
};
