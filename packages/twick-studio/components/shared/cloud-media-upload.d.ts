import { CloudUploadProvider } from '../../hooks/use-cloud-media-upload';

export interface CloudMediaUploadProps {
    onSuccess: (url: string, file: File) => void;
    onError?: (error: string) => void;
    accept?: string;
    uploadApiUrl: string;
    provider: CloudUploadProvider;
    buttonText?: string;
    className?: string;
    disabled?: boolean;
    id?: string;
    icon?: React.ReactNode;
}
export declare const CloudMediaUpload: ({ onSuccess, onError, accept, uploadApiUrl, provider, buttonText, className, disabled, id: providedId, icon, }: CloudMediaUploadProps) => import("react/jsx-runtime").JSX.Element;
