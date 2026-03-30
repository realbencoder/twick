import { ProjectJSON } from '../types';

type CaptionLike = {
    s: number;
    e: number;
    text: string;
};
export declare const getCaptionElements: (project: ProjectJSON, language?: string) => CaptionLike[];
export declare const getCaptionLanguages: (project: ProjectJSON) => string[];
export declare const exportCaptionsAsSRT: (project: ProjectJSON, language?: string) => string;
export declare const exportCaptionsAsVTT: (project: ProjectJSON, language?: string) => string;
export {};
//# sourceMappingURL=caption-export.d.ts.map