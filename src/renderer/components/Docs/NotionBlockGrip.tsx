import React from 'react';
import { Plus, GripVertical } from 'lucide-react';

interface NotionBlockGripProps {
    visible: boolean;
    position: { top: number; left: number } | null;
    onAddBlockBelow: () => void;
    onOpenBlockMenu: (e: React.MouseEvent) => void;
    onDragStart: (e: React.DragEvent) => void;
}

export const NotionBlockGrip: React.FC<NotionBlockGripProps> = ({
    visible,
    position,
    onAddBlockBelow,
    onOpenBlockMenu,
    onDragStart,
}) => {
    if (!visible || !position) return null;

    return (
        <div
            style={{
                top: `${position.top}px`,
                left: `${position.left}px`,
            }}
            className="absolute z-20 flex items-center gap-0.5 -translate-y-1/2 select-none group/grip transition-opacity duration-150"
        >
            {/* Quick Plus button to add block below */}
            <button
                type="button"
                onClick={onAddBlockBelow}
                className="p-1 rounded-md text-zinc-500 hover:text-amber-400 hover:bg-white/10 transition-colors"
                title="Adicionar bloco abaixo"
            >
                <Plus className="w-3.5 h-3.5" />
            </button>

            {/* Drag Handle :: (GripVertical) */}
            <div
                draggable
                onDragStart={onDragStart}
                onClick={onOpenBlockMenu}
                onContextMenu={onOpenBlockMenu}
                className="p-1 rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-white/10 cursor-grab active:cursor-grabbing transition-colors flex items-center justify-center"
                title="Arrastar bloco ou clicar para opções (Turn into, Cores, Excluir)"
            >
                <GripVertical className="w-4 h-4" />
            </div>
        </div>
    );
};
