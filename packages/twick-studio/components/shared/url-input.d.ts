type MediaType = "video" | "audio" | "image";
export default function UrlInput({ type, onSubmit, }: {
    type: MediaType;
    onSubmit: (url: string) => void;
}): import("react/jsx-runtime").JSX.Element;
export {};
