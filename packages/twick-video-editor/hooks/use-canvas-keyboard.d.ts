/**
 * Registers keyboard shortcuts for editor actions.
 * - Delete, Backspace: delete
 * - Cmd/Ctrl+Z: undo
 * - Cmd/Ctrl+Shift+Z or Cmd/Ctrl+Y: redo
 * Ignores events when focus is in input, textarea, or contenteditable.
 */
export declare function useCanvasKeyboard({ onDelete, onUndo, onRedo, enabled, }: {
    onDelete?: () => void;
    onUndo?: () => void;
    onRedo?: () => void;
    enabled?: boolean;
}): void;
