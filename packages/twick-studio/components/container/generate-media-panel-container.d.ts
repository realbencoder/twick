import { default as React } from 'react';
import { Size, TrackElement } from '@twick/timeline';
import { StudioConfig } from '../../types';

interface GenerateMediaPanelContainerProps {
    videoResolution: Size;
    selectedElement: TrackElement | null;
    addElement: (element: TrackElement) => void;
    updateElement: (element: TrackElement) => void;
    studioConfig?: StudioConfig;
}
export declare function GenerateMediaPanelContainer({ videoResolution, addElement, studioConfig, }: GenerateMediaPanelContainerProps): React.ReactElement;
export {};
