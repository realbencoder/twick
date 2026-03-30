import { TimelineEditor } from '../core/editor/timeline.editor';

export declare const editorRegistry: Map<string, TimelineEditor>;
declare global {
    interface Window {
        twickTimelineEditors: Map<string, TimelineEditor>;
    }
}
//# sourceMappingURL=register-editor.d.ts.map