import { default as React } from 'react';

export interface CanvasContextMenuProps {
    x: number;
    y: number;
    elementId: string;
    onBringToFront: (elementId: string) => void;
    onSendToBack: (elementId: string) => void;
    onBringForward: (elementId: string) => void;
    onSendBackward: (elementId: string) => void;
    onDelete: (elementId: string) => void;
    onClose: () => void;
}
/**
 * Context menu for canvas elements: z-order actions (Bring to Front, Send to Back, etc.).
 * Renders at the given coordinates and closes on action or click outside.
 */
export declare const CanvasContextMenu: React.FC<CanvasContextMenuProps>;
