import { useEffect, useRef } from "react";

/**
 * Keys the editor never reads: one a focused control already handled (`defaultPrevented`), or one
 * typed into an input, textarea or contenteditable.
 */
function shouldIgnoreKeydown(e: KeyboardEvent): boolean {
  if (e.defaultPrevented) return true;
  const active = document.activeElement;
  if (!active) return false;
  const tag = active.tagName.toLowerCase();
  if (tag === "input" || tag === "textarea") return true;
  if ((active as HTMLElement).isContentEditable) return true;
  return false;
}

/**
 * Where the creator's attention is on something else: a native select (the inspector has several),
 * a listbox, menu or combobox, or a dialog (modal or not: popovers are role="dialog" too).
 */
const FOCUS_ELSEWHERE_SELECTOR = [
  "select",
  '[role="listbox"]',
  '[role="menu"]',
  '[role="menuitem"]',
  '[role="combobox"]',
  '[role="dialog"]',
  '[role="alertdialog"]',
  '[aria-modal="true"]',
].join(", ");

/**
 * Focus is on or inside one of FOCUS_ELSEWHERE_SELECTOR. The timeline EDIT keys (S, Cmd/Ctrl+B,
 * Q, W, Delete, Backspace) then do nothing: S, Q and W act with nothing selected, so a bare s/q/w
 * meant for a select's typeahead or a menu cut the video, and behind a modal the cut happened
 * unseen and was autosaved. Undo and redo still work there, as before: changing an inspector
 * dropdown (focus stays on the select) and pressing Cmd+Z must still undo it.
 */
function isFocusElsewhere(): boolean {
  return !!document.activeElement?.closest(FOCUS_ELSEWHERE_SELECTOR);
}

/**
 * The host app's side panels whose own words a creator selects: the transcript
 * (`data-tool="transcript"`) and the Subtitles panel (`.captions-panel`).
 */
const TEXT_PANEL_SELECTOR = '[data-tool="transcript"], .captions-panel';

const isInTextPanel = (node: Node | null | undefined): boolean => {
  // A Text node (where a drag-selection usually anchors) has no closest(): ask its parent.
  const el = !node ? null : node.nodeType === 1 ? (node as Element) : node.parentElement;
  return !!el?.closest(TEXT_PANEL_SELECTOR);
};

/** Where the creator's most recent pointerdown landed; null before the first one. */
type LastPress = "panel" | "elsewhere" | null;

/** A focused button is a control the creator clicked, not the creator working in a panel's words. */
const BUTTON_SELECTOR = 'button, [role="button"]';

/**
 * Delete/Backspace are aimed at the panel, not the timeline, when the creator's last pointerdown
 * did NOT land outside both panels, and either:
 * - focus is inside the transcript or Subtitles panel, on anything but a button; or
 * - the last pointerdown landed inside one of those panels AND a drag-selection (non-collapsed)
 *   is anchored in one.
 *
 * Their words are not inputs, so shouldIgnoreKeydown never saw them, and a timeline clip still
 * selected from earlier was deleted by a Backspace meant for the words.
 * - The last press decides first. The transcript never clears its own selection, a press on a
 *   timeline clip (`user-select: none`) leaves it in place, and a press whose mousedown default is
 *   prevented leaves focus on the transcript root (checked in Chromium, 2026-10-30), so "select
 *   words, press a clip, Delete" must still delete the clip whatever the selection and focus say.
 * - A focused button never counts: Chrome focuses a clicked button, so after "Add subtitle" (which
 *   selects the new subtitle) Delete did nothing at all. The transcript root itself (a div,
 *   `tabIndex=-1`, focused by a press in its body) still counts.
 * - A collapsed caret never counts: clicking a word leaves one behind.
 */
function isDeleteForTextPanel(lastPress: LastPress): boolean {
  if (lastPress === "elsewhere") return false;
  const active = document.activeElement;
  if (active && isInTextPanel(active) && !active.matches(BUTTON_SELECTOR)) return true;
  if (lastPress !== "panel") return false;
  const sel = typeof window.getSelection === "function" ? window.getSelection() : null;
  return !!sel && !sel.isCollapsed && isInTextPanel(sel.anchorNode);
}

/**
 * Registers keyboard shortcuts for editor actions.
 * - S or Cmd/Ctrl+B: split at the playhead (the host decides the target: the selected clip when
 *   the playhead is inside it, otherwise the main video clip under the playhead)
 * - Q: delete from the start of the main video clip under the playhead to the playhead
 * - W: delete from the playhead to the end of that clip
 * - Delete, Backspace: delete the selection
 * - Cmd/Ctrl+Z: undo
 * - Cmd/Ctrl+Shift+Z or Cmd/Ctrl+Y: redo
 *
 * Q and W fire only with no modifier held (Cmd+W and friends stay the browser's). S, Cmd/Ctrl+B, Q
 * and W ignore a held key's auto-repeat (`e.repeat`): one press is one cut, or one refusal, never a
 * toast per repeat. Undo and redo still repeat while held.
 * Every key is ignored when a focused control already handled it (`defaultPrevented`), or while
 * focus is in an input, textarea or contenteditable. The edit keys (all but undo and redo) are
 * also ignored while focus is in a select, listbox, menu, combobox or dialog (isFocusElsewhere).
 * Delete and Backspace are also ignored while the creator works in the transcript or Subtitles
 * panel: focus there (not on a button), or a drag-selection there after the last pointerdown
 * landed there, and never once the last pointerdown landed outside both (see isDeleteForTextPanel;
 * a capture-phase pointerdown listener on document records where the last one landed). S, Q and W
 * keep working in the panels.
 */
export function useCanvasKeyboard({
  onDelete,
  onUndo,
  onRedo,
  onSplit,
  onDeleteBefore,
  onDeleteAfter,
  enabled = true,
}: {
  onDelete?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onSplit?: () => void;
  onDeleteBefore?: () => void;
  onDeleteAfter?: () => void;
  enabled?: boolean;
}) {
  // Where the creator's most recent pointerdown landed: inside the transcript or Subtitles panel,
  // or elsewhere. A ref: it is read only inside the keydown handler and must never re-render the host.
  const lastPressRef = useRef<LastPress>(null);

  useEffect(() => {
    if (!enabled) return;

    // Capture phase, so a panel or clip that stops propagation still tells us where it landed.
    const handlePointerDown = (e: PointerEvent) => {
      lastPressRef.current = isInTextPanel(e.target as Node | null) ? "panel" : "elsewhere";
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (shouldIgnoreKeydown(e)) return;

      const key = e.key.toLowerCase();

      // Modifier-aware shortcuts (Cmd/Ctrl)
      const hasPrimaryModifier = e.metaKey || e.ctrlKey;

      if (hasPrimaryModifier) {
        // Undo: Cmd/Ctrl+Z (without Shift)
        if (key === "z" && !e.shiftKey) {
          e.preventDefault();
          onUndo?.();
          return;
        }

        // Redo: Cmd/Ctrl+Shift+Z or Cmd/Ctrl+Y
        if (key === "y" || (key === "z" && e.shiftKey)) {
          e.preventDefault();
          onRedo?.();
          return;
        }
      }

      // Every key below edits the timeline: never from a select, menu or dialog. Not claimed, so
      // the focused control keeps the key (a select's typeahead, a menu's own keys).
      if (isFocusElsewhere()) return;

      if (hasPrimaryModifier) {
        // Split: Cmd/Ctrl+B (CapCut convention). Claimed even when repeating, acted on once.
        if (key === "b" && !e.shiftKey) {
          e.preventDefault();
          if (!e.repeat) onSplit?.();
          return;
        }
      }

      // Split: S (single key, no modifier: fast split). Claimed even when repeating, acted on once.
      if (!hasPrimaryModifier && key === "s") {
        e.preventDefault();
        if (!e.repeat) onSplit?.();
        return;
      }

      // Delete before / after the playhead: Q / W with no modifier at all.
      if (!hasPrimaryModifier && !e.altKey && !e.shiftKey && (key === "q" || key === "w")) {
        e.preventDefault();
        if (e.repeat) return;
        if (key === "q") onDeleteBefore?.();
        else onDeleteAfter?.();
        return;
      }

      // Delete / Backspace (no modifiers), unless the creator is working in a text panel.
      if (!hasPrimaryModifier && (key === "delete" || key === "backspace")) {
        if (isDeleteForTextPanel(lastPressRef.current)) return;
        e.preventDefault();
        onDelete?.();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown, true);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled, onDelete, onUndo, onRedo, onSplit, onDeleteBefore, onDeleteAfter]);
}
