export type CloudUploadProvider = "s3" | "gcs";
export interface UseCloudMediaUploadConfig {
    uploadApiUrl: string;
    provider: CloudUploadProvider;
}
/** Response from S3 presign API (e.g. file-uploader Lambda). */
export interface S3PresignResponse {
    uploadUrl: string;
    key?: string;
    bucket?: string;
    contentType?: string;
    expiresIn?: number;
}
/** Response from GCS upload API (server-side upload). */
export interface GCSUploadResponse {
    url: string;
}
export interface UseCloudMediaUploadReturn {
    uploadFile: (file: File) => Promise<{
        url: string;
    }>;
    isUploading: boolean;
    progress: number;
    error: string | null;
    resetError: () => void;
}
export declare const useCloudMediaUpload: (config: UseCloudMediaUploadConfig) => UseCloudMediaUploadReturn;
