interface AccordionItemProps {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    isOpen: boolean;
    onToggle: () => void;
}
export declare function AccordionItem({ title, icon, children, isOpen, onToggle }: AccordionItemProps): import("react/jsx-runtime").JSX.Element;
export {};
