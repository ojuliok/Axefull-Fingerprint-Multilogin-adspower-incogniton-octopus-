import React, { useState, useEffect, useRef, useCallback } from 'react';

export interface ContextMenuItem {
    id: string;
    label: string;
    icon?: React.ReactNode;
    shortcut?: string;
    danger?: boolean;
    disabled?: boolean;
    divider?: boolean;
    onClick?: () => void;
}

export interface ContextMenuPosition {
    x: number;
    y: number;
}

interface ContextMenuProps {
    position: ContextMenuPosition | null;
    items: ContextMenuItem[];
    onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ position, items, onClose }) => {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (position) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [position, onClose]);

    if (!position) return null;

    // Adjust position to stay inside screen viewport
    const adjustedX = Math.min(position.x, window.innerWidth - 220);
    const adjustedY = Math.min(position.y, window.innerHeight - (items.length * 36 + 20));

    return (
        <div
            ref={menuRef}
            style={{ top: `${adjustedY}px`, left: `${adjustedX}px` }}
            className="fixed z-50 min-w-[200px] bg-[#18181b]/95 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl py-1.5 text-xs text-zinc-200 animate-in fade-in zoom-in-95 duration-100"
        >
            {items.map((item, idx) => {
                if (item.divider) {
                    return <div key={`div-${idx}`} className="my-1 border-t border-white/10" />;
                }

                return (
                    <button
                        key={item.id || idx}
                        disabled={item.disabled}
                        onClick={() => {
                            if (item.onClick && !item.disabled) {
                                item.onClick();
                                onClose();
                            }
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-left font-medium transition-colors ${
                            item.disabled
                                ? 'opacity-40 cursor-not-allowed'
                                : item.danger
                                ? 'text-red-400 hover:bg-red-500/15 hover:text-red-300'
                                : 'hover:bg-amber-500/15 hover:text-amber-300'
                        }`}
                    >
                        <div className="flex items-center gap-2.5">
                            {item.icon && <span className="w-4 h-4 flex items-center justify-center text-current">{item.icon}</span>}
                            <span>{item.label}</span>
                        </div>
                        {item.shortcut && (
                            <span className="text-[10px] text-zinc-500 font-mono pl-3">{item.shortcut}</span>
                        )}
                    </button>
                );
            })}
        </div>
    );
};

export const useContextMenu = () => {
    const [contextMenu, setContextMenu] = useState<{
        position: ContextMenuPosition | null;
        targetData?: any;
    }>({ position: null });

    const handleContextMenu = useCallback((e: React.MouseEvent, data?: any) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({
            position: { x: e.clientX, y: e.clientY },
            targetData: data
        });
    }, []);

    const closeContextMenu = useCallback(() => {
        setContextMenu({ position: null });
    }, []);

    return {
        position: contextMenu.position,
        targetData: contextMenu.targetData,
        handleContextMenu,
        closeContextMenu
    };
};
