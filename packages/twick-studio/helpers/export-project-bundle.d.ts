import { ProjectJSON } from '@twick/timeline';

export interface ProjectBundleExport {
    project: ProjectJSON;
    metadata: ProjectJSON["metadata"];
    chaptersJson: string;
    captions: Array<{
        language: string;
        srt: string;
        vtt: string;
    }>;
    video?: {
        url?: string;
        fileName?: string;
    };
}
export interface ExportProjectBundleOptions {
    videoUrl?: string;
    outFile?: string;
}
/**
 * Creates a portable export bundle with project JSON, chapters, and captions.
 * This intentionally avoids zip dependencies; callers can zip externally.
 */
export declare function exportProjectBundle(project: ProjectJSON, options?: ExportProjectBundleOptions): ProjectBundleExport;
