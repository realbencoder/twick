import { useEffect } from "react";

function shouldIgnoreKeydown(): boolean {
  const active = document.activeElement;
  if (!active) return false;
  const tag = active.tagName.toLowerCase();
  if (tag === "input" || tag === "textarea") return true;
  if ((active as HTMLElement).isContentEditable) return true;
  return false;
}

/**
 * Registers keyboard shortcuts for editor actions.
 * - Delete, Backspace: delete
 * - Cmd/Ctrl+Z: undo
 * - Cmd/Ctrl+Shift+Z or Cmd/Ctrl+Y: redo
 * - Cmd/Ctrl+B or S: split the selected clip at the playhead
 * Ignores events when focus is in input, textarea, or contenteditable.
 */
export function useCanvasKeyboard({
  onDelete,
  onUndo,
  onRedo,
  onSplit,
  enabled = true,
}: {
  onDelete?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onSplit?: () => void;
  enabled?: boolean;
}) {
  useEffect(() => {
    if (!enabled) return;

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

        // Split: Cmd/Ctrl+B (CapCut convention)
        if (key === "b" && !e.shiftKey) {
          e.preventDefault();
          onSplit?.();
          return;
        }
      }

      // Split: S (single key, no modifier — fast split)
      if (!hasPrimaryModifier && key === "s") {
        e.preventDefault();
        onSplit?.();
        return;
      }

      // Delete / Backspace (no modifiers)
      if (!hasPrimaryModifier && (key === "delete" || key === "backspace")) {
        e.preventDefault();
        onDelete?.();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [enabled, onDelete, onUndo, onRedo, onSplit]);
}
