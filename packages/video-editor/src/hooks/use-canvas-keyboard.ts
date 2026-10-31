import { useEffect, useRef } from "react";

function shouldIgnoreKeydown(): boolean {
  const active = document.activeElement;
  if (!active) return false;
  const tag = active.tagName.toLowerCase();
  if (tag === "input" || tag === "textarea") return true;
  if ((active as HTMLElement).isContentEditable) return true;
  return false;
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

/**
 * Delete/Backspace are aimed at the panel, not the timeline, when either:
 * - focus is inside the transcript or Subtitles panel; or
 * - the creator's last pointerdown landed inside one of those panels AND a drag-selection
 *   (non-collapsed) is anchored in one.
 *
 * Their words are not inputs, so shouldIgnoreKeydown never saw them, and a timeline clip still
 * selected from earlier was deleted by a Backspace meant for the words. The selection alone is not
 * enough: the transcript never clears its own selection, and a click on a timeline clip
 * (`user-select: none`) leaves it in place, so "select words, click a clip, Delete" must still
 * delete the clip. The last pointerdown says where the creator is working now. A collapsed caret
 * never counts: clicking a word leaves one behind.
 */
function isDeleteForTextPanel(lastPointerDownInPanel: boolean): boolean {
  if (isInTextPanel(document.activeElement)) return true;
  if (!lastPointerDownInPanel) return false;
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
 * Every key is ignored while focus is in an input, textarea or contenteditable. Delete and
 * Backspace are also ignored while focus is in the transcript or Subtitles panel, or while the
 * last pointerdown was in one of them and a drag-selection sits in one (see isDeleteForTextPanel;
 * a capture-phase pointerdown listener on document records where the last one landed). S, Q and W
 * keep working there.
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
  // Whether the creator's most recent pointerdown landed inside the transcript or Subtitles panel.
  // A ref: it is read only inside the keydown handler and must never re-render the host.
  const lastPointerDownInPanelRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    // Capture phase, so a panel or clip that stops propagation still tells us where it landed.
    const handlePointerDown = (e: PointerEvent) => {
      lastPointerDownInPanelRef.current = isInTextPanel(e.target as Node | null);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (shouldIgnoreKeydown()) return;

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
        if (isDeleteForTextPanel(lastPointerDownInPanelRef.current)) return;
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
