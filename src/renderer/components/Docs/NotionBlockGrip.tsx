import React from 'react';
import { Plus, GripVertical } from 'lucide-react';

interface NotionBlockGripProps {
    visible: boolean;
    position: { top: number; left: number } | null;
    onOpenSlashMenu: (e: React.MouseEvent) => void;
    onOpenBlockMenu: (e: React.MouseEvent) => void;
    onDragStart: (e: React.DragEvent) => void;
}

export const NotionBlockGrip: React.FC<NotionBlockGripProps> = ({
    visible,
    position,
    onOpenSlashMenu,
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
            {/* Quick Plus button — opens Slash Insert Menu (like Notion) */}
            <button
                type="button"
                onClick={onOpenSlashMenu}
                className="p-1 rounded-md text-zinc-500 hover:text-amber-400 hover:bg-white/10 transition-colors cursor-pointer"
                title="Inserir bloco (Slash Menu)"
            >
                <Plus className="w-3.5 h-3.5" />
            </button>

            {/* Drag Handle :: — click to open Turn Into / Block Menu, drag to reorder */}
            <div
                draggable
                onDragStart={onDragStart}
                onClick={onOpenBlockMenu}
                className="p-1 rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-white/10 cursor-grab active:cursor-grabbing transition-colors flex items-center justify-center"
                title="Arrastar para mover bloco  |  Clicar para opções (Turn into, Cores, Excluir)"
            >
                <GripVertical className="w-4 h-4" />
            </div>
        </div>
    );
};
