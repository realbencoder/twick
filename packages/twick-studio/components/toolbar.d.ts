import { ToolCategory } from '../types';

export declare function Toolbar({ selectedTool, setSelectedTool, customTools, hiddenTools, }: {
    selectedTool: string;
    setSelectedTool: (tool: string) => void;
    customTools?: ToolCategory[];
    hiddenTools?: string[];
}): import("react/jsx-runtime").JSX.Element;
