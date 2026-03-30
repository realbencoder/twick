type UndoRedoControlsProps = {
    canUndo: boolean;
    canRedo: boolean;
    onUndo?: () => void;
    onRedo?: () => void;
};
export declare const UndoRedoControls: ({ canUndo, canRedo, onUndo, onRedo }: UndoRedoControlsProps) => import("react/jsx-runtime").JSX.Element;
export {};
