import { ReactNode } from 'react';

interface PropertyRowProps {
    label: string;
    children: ReactNode;
    /** Optional secondary label/value on the right (e.g. units, current value) */
    secondary?: ReactNode;
}
export declare function PropertyRow({ label, children, secondary }: PropertyRowProps): import("react/jsx-runtime").JSX.Element;
export {};
