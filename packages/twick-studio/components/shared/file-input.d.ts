declare const FileInput: ({ acceptFileTypes, onFileLoad, buttonText, id, className, icon, }: {
    acceptFileTypes: string[];
    onFileLoad: (content: any) => void;
    buttonText: string;
    id: string;
    className?: string;
    icon?: React.ReactNode;
}) => import("react/jsx-runtime").JSX.Element;
export default FileInput;
