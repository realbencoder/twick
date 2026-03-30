import { ProjectJSON } from '../types';

interface UndoRedoContextType {
    canUndo: boolean;
    canRedo: boolean;
    present: ProjectJSON | null;
    setPresent: (data: ProjectJSON) => void;
    undo: () => ProjectJSON | null;
    redo: () => ProjectJSON | null;
    resetHistory: () => void;
    getLastPersistedState: () => ProjectJSON | null;
    disablePersistence: () => void;
}
export interface UndoRedoProviderProps {
    children: React.ReactNode;
    persistenceKey?: string;
    maxHistorySize?: number;
}
export declare const UndoRedoProvider: React.FC<UndoRedoProviderProps>;
export declare const useUndoRedo: () => UndoRedoContextType;
export {};
//# sourceMappingURL=undo-redo-context.d.ts.map