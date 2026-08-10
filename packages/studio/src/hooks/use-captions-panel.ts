import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CAPTION_STYLE,
  CaptionElement,
  Track,
  useTimelineContext,
} from "@twick/timeline";
import { CAPTION_PROPS } from "../helpers/constant";
import { mergeEditingText } from "../helpers/caption-sync";
import type { CaptionPanelEntry } from "../types";

/**
 * Subtitles panel state — id-addressed, timeline-synced.
 *
 * Two invariants this hook exists to hold (both were live corruption paths before):
 *
 * 1. NEVER cache a Track instance. undo()/redo() and rippleDeleteRanges() (the Remove
 *    Silences path) rebuild every Track via Track.fromJSON — a cached ref becomes a
 *    detached orphan whose mutations persist NOTHING while reads return pre-undo
 *    elements. Every operation resolves editor.getCaptionsTrack() fresh at call time.
 *
 * 2. NEVER address elements by index. A split/delete/undo renumbers every later row;
 *    an index captured before the mutation then operates on the WRONG element.
 *    Element ids are stable across serialize/deserialize, so they are the join key
 *    for selection, mutation, and React keys alike.
 *
 * Commit model (founder decision 2026-08-10): typing gives LIVE canvas feedback via a
 * debounced el.setText + editor.refresh() — refresh() is public and explicitly
 * skipHistory, so keystrokes create ZERO undo entries — and blur is the SOLE
 * updateElement commit, so one edit session is exactly one undo step. The wordsMs
 * re-sync check is a BOOLEAN input to that commit, never an early return above it:
 * as returns, a manual caption (no wordsMs) or a same-word-count typo fix would skip
 * updateElement entirely and the edit would silently never persist.
 */
export const useCaptionsPanel = () => {
  const [captions, setCaptions] = useState<CaptionPanelEntry[]>([]);
  /** Bumped whenever the cue list is rebuilt — lets the playhead-link effect re-run
   *  even when currentTime hasn't moved (e.g. Remove Silences applied while paused). */
  const [cueVersion, setCueVersion] = useState(0);
  const { editor, changeLog, selectedItem, setSelectedItem } = useTimelineContext();

  /** id → in-progress textarea value (uncommitted). */
  const dirtyRef = useRef<Map<string, string>>(new Map());
  /** id currently holding focus, null when none. */
  const editingRef = useRef<string | null>(null);
  const [editingId, setEditingIdState] = useState<string | null>(null);
  const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const track = useCallback(
    (): Track | null => editor.getCaptionsTrack?.() ?? null,
    [editor]
  );

  const resolveElement = useCallback(
    (id: string): CaptionElement | null => {
      const t = track();
      if (!t) return null;
      const el = t.getElementById(id);
      return (el as CaptionElement) ?? null;
    },
    [track]
  );

  const setEditingId = useCallback((id: string | null) => {
    editingRef.current = id;
    setEditingIdState(id);
  }, []);

  const syncFromTimeline = useCallback(() => {
    const t = track();
    if (!t) {
      dirtyRef.current.clear();
      if (editingRef.current !== null) setEditingId(null);
      setCaptions([]);
      setCueVersion((v) => v + 1);
      return;
    }
    const next: CaptionPanelEntry[] = t.getElements().map((element) => ({
      id: element.getId(),
      s: element.getStart(),
      e: element.getEnd(),
      t: (element as CaptionElement).getText(),
      isCustom: (element.getProps() as any)?.useTrackDefaults === false,
    }));
    const ids = new Set(next.map((c) => c.id));
    // A stuck editingId kills playhead-follow for the whole session: when the focused
    // row's element is removed externally (ripple/undo), React unmounts the detached
    // textarea and no blur ever fires. Clear edit state for ids that no longer exist.
    for (const id of Array.from(dirtyRef.current.keys())) {
      if (!ids.has(id)) dirtyRef.current.delete(id);
    }
    if (editingRef.current !== null && !ids.has(editingRef.current)) {
      setEditingId(null);
    }
    // Overlay the in-progress edit so a background re-sync never clobbers typing.
    setCaptions(
      mergeEditingText(
        next,
        editingRef.current,
        editingRef.current !== null
          ? dirtyRef.current.get(editingRef.current)
          : undefined
      )
    );
    setCueVersion((v) => v + 1);
  }, [track, setEditingId]);

  // Re-sync on every timeline mutation (split on the timeline, ripple delete, undo,
  // Remove Silences, regenerate). The old mount-only fetch survived solely because
  // the panel unmounted on tool change; a live panel must track the timeline.
  useEffect(() => {
    syncFromTimeline();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [changeLog]);

  useEffect(() => {
    return () => {
      if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
    };
  }, []);

  const ensureCaptionsTrack = useCallback((): Track => {
    let t = track();
    if (!t) {
      t = editor.addTrack("Subtitles", "caption");
      const props: Record<string, any> = {
        capStyle: CAPTION_STYLE.WORD_BG_HIGHLIGHT,
        ...CAPTION_PROPS[CAPTION_STYLE.WORD_BG_HIGHLIGHT],
        x: 0,
        y: 200,
      };
      t?.setProps(props);
    }
    return t as Track;
  }, [editor, track]);

  const addCaption = useCallback(() => {
    const t = ensureCaptionsTrack();
    // Start after the last FRESH element — not after a possibly stale local list.
    const elements = t.getElements();
    const start =
      elements.length > 0 ? elements[elements.length - 1].getEnd() : 0;
    const captionElement = new CaptionElement("New Caption", start, start + 1);
    editor.addElementToTrack(t, captionElement);
    // No optimistic push: the changeLog effect owns the list. A transient id-less row
    // would make Split/Delete on it resolve getElementById(undefined) — a silent no-op.
    syncFromTimeline();
  }, [editor, ensureCaptionsTrack, syncFromTimeline]);

  const splitCaption = useCallback(
    async (id: string) => {
      const element = resolveElement(id);
      if (!element) return;
      await editor.splitElement(
        element,
        element.getStart() + element.getDuration() / 2
      );
      syncFromTimeline();
    },
    [editor, resolveElement, syncFromTimeline]
  );

  const deleteCaption = useCallback(
    (id: string) => {
      const element = resolveElement(id);
      if (!element) return;
      // A panel-initiated delete of the SELECTED caption must not clear selection:
      // the studio's tool-follows-selection effect would flip the left panel to the
      // Video tool, unmounting the panel mid-use. Hand selection to a neighbour first.
      if (selectedItem && selectedItem.getId?.() === id) {
        const t = track();
        const elements = t ? t.getElements() : [];
        const idx = elements.findIndex((e) => e.getId() === id);
        const neighbour = elements[idx + 1] ?? elements[idx - 1] ?? null;
        if (neighbour) setSelectedItem(neighbour);
      }
      editor.rippleRemoveElement(element);
      syncFromTimeline();
    },
    [editor, resolveElement, selectedItem, setSelectedItem, track, syncFromTimeline]
  );

  /**
   * Per-keystroke path: local state + a debounced LIVE PREVIEW. refresh() re-renders
   * the canvas with skipHistory, so the creator sees their words on the video as they
   * type while undo history stays untouched. The real commit happens on blur.
   */
  const updateCaption = useCallback(
    (id: string, text: string) => {
      dirtyRef.current.set(id, text);
      setCaptions((prev) =>
        prev.map((c) => (c.id === id ? { ...c, t: text } : c))
      );
      if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
      previewTimerRef.current = setTimeout(() => {
        previewTimerRef.current = null;
        const el = resolveElement(id);
        if (!el) return;
        el.setText(dirtyRef.current.get(id) ?? text);
        editor.refresh();
      }, 150);
    },
    [editor, resolveElement]
  );

  /**
   * Blur — the SOLE commit point. The wordsMs count check decides whether to ALSO
   * re-sync word timings; it must never gate updateElement itself (see docblock).
   */
  const finalizeCaptionText = useCallback(
    (id: string) => {
      if (editingRef.current === id) setEditingId(null);
      if (!dirtyRef.current.has(id)) return; // no edit this session — no empty commit
      if (previewTimerRef.current) {
        clearTimeout(previewTimerRef.current);
        previewTimerRef.current = null;
      }
      const text = dirtyRef.current.get(id) as string;
      dirtyRef.current.delete(id);
      const element = resolveElement(id);
      if (!element) return; // removed while editing — nothing to commit onto
      element.setText(text);
      const props = (element.getProps() ?? {}) as Record<string, unknown>;
      const meta = (element.getMetadata?.() ?? {}) as Record<string, unknown>;
      const wordsArr = Array.isArray(props.wordsMs)
        ? (props.wordsMs as unknown[])
        : Array.isArray(meta.wordsMs)
        ? (meta.wordsMs as unknown[])
        : null;
      const wordCount = String(element.getText() ?? "")
        .split(" ")
        .map((w) => w.trim())
        .filter((w) => w.length > 0).length;
      const needsWordResync =
        !!wordsArr && wordCount > 0 && wordsArr.length !== wordCount;
      if (needsWordResync) {
        editor.adjustCaptionWordsForTimeChange(
          element,
          element.getStart(),
          element.getEnd()
        );
      }
      editor.updateElement(element); // UNCONDITIONAL on the dirty path
    },
    [editor, resolveElement, setEditingId]
  );

  /** Card click: select on the timeline + seek the playhead to the caption start. */
  const focusCaption = useCallback(
    (id: string) => {
      const element = resolveElement(id);
      if (!element) return;
      setSelectedItem(element);
      // Call the controller directly (the established transport pattern, rule #17's
      // one-way flow): it bypasses the seekTime state dedupe that silently drops a
      // repeat click on the same card. Non-app hosts simply get selection without seek.
      const controller = (globalThis as any).__webcodecs_controller;
      if (controller && typeof controller.seek === "function") {
        controller.seek(element.getStart());
      }
    },
    [resolveElement, setSelectedItem]
  );

  const onEditStart = useCallback(
    (id: string) => {
      setEditingId(id);
      if (!dirtyRef.current.has(id)) {
        const el = resolveElement(id);
        if (el) dirtyRef.current.set(id, el.getText());
      }
    },
    [resolveElement, setEditingId]
  );

  const selectedId = useMemo(() => {
    if (!selectedItem || typeof (selectedItem as any).getId !== "function")
      return null;
    const id = (selectedItem as any).getId();
    return captions.some((c) => c.id === id) ? id : null;
  }, [selectedItem, captions]);

  return {
    captions,
    cueVersion,
    selectedId,
    editingId,
    addCaption,
    splitCaption,
    deleteCaption,
    updateCaption,
    finalizeCaptionText,
    focusCaption,
    onEditStart,
  };
};
