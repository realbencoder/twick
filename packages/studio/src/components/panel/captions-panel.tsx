/**
 * CaptionsPanel — the Subtitles list, synced three ways:
 *
 *  - timeline selection → the matching card scrolls into view and highlights
 *  - playhead → the current card carries an accent; the list follows unless the
 *    user is acting in it (typing, wheeling, dragging) — intent, not hover
 *  - card click → seeks the playhead to the caption and selects it on the timeline
 *
 * Rows are keyed and addressed by ELEMENT ID (never index — a split/delete/undo
 * renumbers the list and index keys hand a row's textarea DOM to the wrong caption).
 */

import {
  memo,
  useCallback,
  useEffect,
  useRef,
  type FocusEvent,
} from "react";
import { Trash2, Scissors } from "lucide-react";
import type { CaptionPanelEntry } from "../../types";
import {
  findScrollContainer,
  scrollDeltaFor,
  shouldAutoScroll,
} from "../../helpers/caption-sync";

const SCROLL_PAD = 8;
const REATTACH_IDLE_MS = 4000;

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00.00";
  const totalMs = Math.round(seconds * 1000);
  const totalSeconds = Math.floor(totalMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  const ms = Math.floor((totalMs % 1000) / 10);
  const pad = (n: number, l = 2) => String(n).padStart(l, "0");
  return `${minutes}:${pad(secs)}.${pad(ms)}`;
};

type RowProps = {
  caption: CaptionPanelEntry;
  isActive: boolean;
  isSelected: boolean;
  registerRef: (id: string, el: HTMLDivElement | null) => void;
  onCardClick: (id: string) => void;
  updateCaption: (id: string, text: string) => void;
  finalizeCaptionText: (id: string) => void;
  onEditStart: (id: string) => void;
  splitCaption: (id: string) => void | Promise<void>;
  deleteCaption: (id: string) => void;
};

const CaptionRow = memo(function CaptionRow({
  caption,
  isActive,
  isSelected,
  registerRef,
  onCardClick,
  updateCaption,
  finalizeCaptionText,
  onEditStart,
  splitCaption,
  deleteCaption,
}: RowProps) {
  return (
    <div
      ref={(el) => registerRef(caption.id, el)}
      data-caption-id={caption.id}
      className={[
        "captions-panel-item",
        isSelected ? "captions-panel-item-selected" : "",
        isActive ? "captions-panel-item-active" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={() => onCardClick(caption.id)}
    >
      <div className="captions-panel-item-header">
        <span className="captions-panel-time captions-panel-time-start">
          {formatTime(caption.s)}
        </span>
        <span className="captions-panel-time captions-panel-time-end">
          {formatTime(caption.e)}
        </span>
        {caption.isCustom ? (
          <span
            className="captions-panel-custom"
            title="This caption overrides track defaults"
          >
            Custom
          </span>
        ) : null}
      </div>

      <div className="captions-panel-item-body">
        <textarea
          placeholder="Enter caption text"
          value={caption.t}
          onFocus={() => onEditStart(caption.id)}
          onChange={(e) => updateCaption(caption.id, e.target.value)}
          onBlur={() => finalizeCaptionText(caption.id)}
          onClick={(e) => e.stopPropagation()}
          className="input-dark captions-panel-textarea"
        />
        <div className="captions-panel-actions">
          <button
            onClick={(e) => {
              e.stopPropagation();
              splitCaption(caption.id);
            }}
            className="btn-ghost captions-panel-action-button"
            title="Split caption at midpoint"
          >
            <Scissors className="icon-sm" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteCaption(caption.id);
            }}
            className="btn-ghost captions-panel-action-button"
            title="Delete caption"
          >
            <Trash2 className="icon-sm" color="var(--color-red-500)" />
          </button>
        </div>
      </div>
    </div>
  );
});

export function CaptionsPanel({
  captions,
  activeId,
  selectedId,
  editingId,
  followEnabled,
  addCaption,
  splitCaption,
  deleteCaption,
  updateCaption,
  finalizeCaptionText,
  focusCaption,
  onEditStart,
}: {
  captions: CaptionPanelEntry[];
  /** Caption under the playhead (null before the first cue). */
  activeId: string | null;
  /** Caption selected on the timeline (null when selection is elsewhere). */
  selectedId: string | null;
  /** Caption whose textarea holds focus (suppresses follow). */
  editingId: string | null;
  /** TimelineContext.followPlayheadEnabled — the shared follow toggle. */
  followEnabled: boolean;
  addCaption: () => void;
  splitCaption: (id: string) => void | Promise<void>;
  deleteCaption: (id: string) => void;
  updateCaption: (id: string, text: string) => void;
  finalizeCaptionText: (id: string) => void;
  focusCaption: (id: string) => void;
  onEditStart: (id: string) => void;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const rowRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  /** performance.now() of the last intent gesture inside the list; null = attached. */
  const detachedAtRef = useRef<number | null>(null);

  const registerRef = useCallback((id: string, el: HTMLDivElement | null) => {
    if (el) rowRefs.current.set(id, el);
    else rowRefs.current.delete(id);
  }, []);

  const scrollRowIntoView = useCallback(
    (id: string, behavior: ScrollBehavior): number | null => {
      const row = rowRefs.current.get(id);
      const root = rootRef.current;
      if (!row || !root) return null;
      const container = findScrollContainer(row.parentElement, root);
      if (!container) return null;
      const rowRect = row.getBoundingClientRect();
      const viewRect = container.getBoundingClientRect();
      const delta = scrollDeltaFor(
        rowRect.top,
        rowRect.bottom,
        viewRect.top,
        viewRect.bottom,
        SCROLL_PAD
      );
      if (delta !== 0) {
        container.scrollTo({ top: container.scrollTop + delta, behavior });
      }
      return delta;
    },
    []
  );

  // Intent listeners — actions, never presence, and never the `scroll` event
  // (our own auto-scroll fires `scroll`; using it as intent self-detaches follow).
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const detach = () => {
      detachedAtRef.current = performance.now();
    };
    root.addEventListener("wheel", detach, { passive: true });
    root.addEventListener("touchmove", detach, { passive: true });
    root.addEventListener("pointerdown", detach);
    const onFocusIn = (e: Event) => {
      const t = e.target as HTMLElement | null;
      if (t && t.tagName === "TEXTAREA") detach();
    };
    root.addEventListener("focusin", onFocusIn);
    return () => {
      root.removeEventListener("wheel", detach);
      root.removeEventListener("touchmove", detach);
      root.removeEventListener("pointerdown", detach);
      root.removeEventListener("focusin", onFocusIn);
    };
  }, []);

  // Timeline selection → smooth scroll + highlight (an explicit user navigation:
  // always honored, and it re-attaches follow).
  useEffect(() => {
    if (!selectedId) return;
    scrollRowIntoView(selectedId, "smooth");
    detachedAtRef.current = null;
  }, [selectedId, scrollRowIntoView]);

  // Playhead → instant follow (smooth scrolls cancel each other at cue cadence and
  // read as stutter). Re-arms itself when the active row is already fully visible.
  useEffect(() => {
    if (!activeId) return;
    const follow = shouldAutoScroll({
      followEnabled,
      editingId,
      detachedAt: detachedAtRef.current,
      now: performance.now(),
      reattachIdleMs: REATTACH_IDLE_MS,
    });
    if (!follow) {
      // The user scrolled back on their own: a zero delta means the row is
      // comfortably visible again, so re-arm without waiting out the idle timer.
      const row = rowRefs.current.get(activeId);
      const root = rootRef.current;
      if (row && root) {
        const container = findScrollContainer(row.parentElement, root);
        if (container) {
          const rowRect = row.getBoundingClientRect();
          const viewRect = container.getBoundingClientRect();
          if (
            scrollDeltaFor(
              rowRect.top,
              rowRect.bottom,
              viewRect.top,
              viewRect.bottom,
              SCROLL_PAD
            ) === 0
          ) {
            detachedAtRef.current = null;
          }
        }
      }
      return;
    }
    const delta = scrollRowIntoView(activeId, "auto");
    if (delta === 0) detachedAtRef.current = null;
  }, [activeId, editingId, followEnabled, scrollRowIntoView]);

  // Defensive: if the focused row vanished with the panel open (the hook also clears
  // its own state), make sure a stale editingId can't wedge follow via OUR props.
  const onListBlurCapture = useCallback((_e: FocusEvent) => {
    /* editing state is owned by the hook via onEditStart/finalizeCaptionText */
  }, []);

  return (
    <div className="panel-container captions-panel" ref={rootRef}>
      {/* Header */}
      <div className="captions-panel-header">
        <h3 className="panel-title">Subtitles</h3>
        <div className="captions-panel-header-meta">
          {captions.length === 0 ? (
            <span className="captions-panel-count">No subtitles yet</span>
          ) : null}
          <button
            onClick={addCaption}
            className="btn-primary captions-panel-add-button"
            title="Add subtitle"
          >
            Add subtitle
          </button>
        </div>
      </div>

      {/* Caption list */}
      {captions.length === 0 ? (
        <div className="panel-section captions-panel-empty">
          <p className="captions-panel-empty-title">Start your first subtitle</p>
          <p className="captions-panel-empty-subtitle">
            Use the button above to add the first subtitle block for the active
            track.
          </p>
          <button
            onClick={addCaption}
            className="btn-primary captions-panel-empty-button"
            title="Add first caption"
          >
            Add subtitle
          </button>
        </div>
      ) : (
        <div
          className="panel-section captions-panel-list"
          onBlurCapture={onListBlurCapture}
        >
          {captions.map((caption) => (
            <CaptionRow
              key={caption.id}
              caption={caption}
              isActive={caption.id === activeId}
              isSelected={caption.id === selectedId}
              registerRef={registerRef}
              onCardClick={focusCaption}
              updateCaption={updateCaption}
              finalizeCaptionText={finalizeCaptionText}
              onEditStart={onEditStart}
              splitCaption={splitCaption}
              deleteCaption={deleteCaption}
            />
          ))}
        </div>
      )}
    </div>
  );
}
