type RecorderState = "idle" | "recording" | "stopped" | "error";
interface UseScreenRecorderReturn {
    state: RecorderState;
    mediaUrl: string | null;
    error: string | null;
    startRecording: (withMic: boolean) => Promise<void>;
    stopRecording: () => void;
    clearRecording: () => void;
}
export declare const useScreenRecorder: () => UseScreenRecorderReturn;
export {};
