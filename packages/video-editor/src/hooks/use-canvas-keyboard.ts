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
 * a listbox, menu or combobox, or a dialog (modal or not: popovers are role="dialog" too). A CLOSED
 * dropdown is the exception for the cut keys only (see isClosedDropdown).
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
 * meant for an open list or a menu cut the video, and behind a modal the cut happened unseen and
 * was autosaved. (A CLOSED dropdown hands S, Cmd/Ctrl+B, Q and W to the editor first: see
 * isClosedDropdown.) Undo and redo still work there, as before: changing an inspector dropdown
 * (focus stays on the select) and pressing Cmd+Z must still undo it.
 */
function isFocusElsewhere(): boolean {
  return !!document.activeElement?.closest(FOCUS_ELSEWHERE_SELECTOR);
}

/**
 * A dropdown that has focus but is CLOSED, the state a pick with the mouse leaves behind (Chrome
 * keeps focus on a native select after a pick; Radix Select returns it to its trigger):
 * - a native single select whose list is not showing. Chromium reports a showing list as `:open`,
 *   and where it draws the list in the page it DOES send the page keydowns while it shows (the
 *   headless shell, checked 2026-11-01), so an open one is never claimed. A browser without `:open`
 *   cannot tell, so its select is left alone, as before.
 *   A list-box select (`multiple`, or `size` above 1) is always showing.
 * - a combobox (a Radix Select trigger) with `aria-expanded="false"`. An open Radix Select moves
 *   focus into its listbox, so the trigger only has focus while closed.
 * Not inside any other FOCUS_ELSEWHERE_SELECTOR container (a dropdown in a dialog stays the dialog's).
 * Text entry (an autocomplete input) never gets here: shouldIgnoreKeydown already passed it on.
 */
function isClosedDropdown(el: Element): boolean {
  if (el.parentElement?.closest(FOCUS_ELSEWHERE_SELECTOR)) return false;
  if (el.tagName === "SELECT") {
    const select = el as HTMLSelectElement;
    if (select.multiple || select.size > 1) return false;
    try {
      return !select.matches(":open");
    } catch {
      return false;
    }
  }
  return el.matches('[role="combobox"][aria-expanded="false"]');
}

/** The cut a key asks for, or null: the one mapping both keydown listeners use. */
type CutKey = "split" | "delete-before" | "delete-after";
function cutKeyOf(e: KeyboardEvent): CutKey | null {
  const key = e.key.toLowerCase();
  if (e.metaKey || e.ctrlKey) return key === "b" && !e.shiftKey ? "split" : null; // Cmd/Ctrl+B
  if (key === "s") return "split";
  if (e.altKey || e.shiftKey) return null; // Q and W take no modifier at all
  if (key === "q") return "delete-before";
  if (key === "w") return "delete-after";
  return null;
}

/**
 * A press on a control the creator cannot use right now (a greyed-out cut button, which the host
 * makes hoverable for its tooltip, or its icon): it does nothing, so it never changes where
 * Delete/Backspace go. Chrome fires pointerdown there but leaves a transcript word selection on
 * screen, and the next Backspace deleted a timeline clip selected earlier.
 */
const DISABLED_CONTROL_SELECTOR = 'button:disabled, [aria-disabled="true"], .btn-disabled';

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
 * also ignored while focus is in a select, listbox, menu, combobox or dialog (isFocusElsewhere),
 * with one exception (Ben, 2026-11-01: "Editor keys win"): on a CLOSED dropdown (isClosedDropdown)
 * S, Cmd/Ctrl+B, Q and W are the editor's. A capture-phase keydown listener on document claims
 * exactly those keys there (preventDefault, then the cut) BEFORE the dropdown sees them: Chrome's
 * type-ahead on a closed native select runs as the key's default action, and Radix Select's on its
 * trigger runs in React's root listener, ahead of any bubble listener on document; Radix skips it
 * for a keydown already defaultPrevented. Propagation is never stopped. Every other key there
 * (Delete and Backspace included) is left to the dropdown, as before.
 * Delete and Backspace are also ignored while the creator works in the transcript or Subtitles
 * panel: focus there (not on a button), or a drag-selection there after the last pointerdown
 * landed there, and never once the last pointerdown landed outside both (see isDeleteForTextPanel;
 * a capture-phase pointerdown listener on document records where the last one landed, and a press
 * on a disabled control does not count). S, Q and W keep working in the panels.
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
      const target = e.target as Node | null;
      const el = !target ? null : target.nodeType === 1 ? (target as Element) : target.parentElement;
      if (el?.closest(DISABLED_CONTROL_SELECTOR)) return; // a press that did nothing
      lastPressRef.current = isInTextPanel(target) ? "panel" : "elsewhere";
    };

    const runCut = (cut: CutKey) => {
      if (cut === "split") onSplit?.();
      else if (cut === "delete-before") onDeleteBefore?.();
      else onDeleteAfter?.();
    };

    // Capture phase: a cut key on a CLOSED dropdown is claimed before the dropdown's own
    // type-ahead can take it. Only these keys, only that target; never stops propagation.
    const handleKeyDownCapture = (e: KeyboardEvent) => {
      if (shouldIgnoreKeydown(e)) return;
      const cut = cutKeyOf(e);
      const active = document.activeElement;
      if (!cut || !active || !isClosedDropdown(active)) return;
      e.preventDefault();
      if (!e.repeat) runCut(cut);
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
      // the focused control keeps the key (a select's typeahead, a menu's own keys). A cut key on a
      // closed dropdown never gets here: the capture listener above claimed it.
      if (isFocusElsewhere()) return;

      // Split: S (single key, no modifier: fast split) or Cmd/Ctrl+B (CapCut convention). Delete
      // before / after the playhead: Q / W with no modifier at all. Claimed even when repeating,
      // acted on once.
      const cut = cutKeyOf(e);
      if (cut) {
        e.preventDefault();
        if (!e.repeat) runCut(cut);
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
    document.addEventListener("keydown", handleKeyDownCapture, true);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
      document.removeEventListener("keydown", handleKeyDownCapture, true);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled, onDelete, onUndo, onRedo, onSplit, onDeleteBefore, onDeleteAfter]);
}
