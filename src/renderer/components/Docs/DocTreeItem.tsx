import React, { useState } from 'react';
import { FileText, ChevronRight, ChevronDown, Plus, MoreVertical, Star, FilePlus, Trash2 } from 'lucide-react';

export interface Note {
    id: string;
    parentId?: string | null;
    spaceId: string;
    title: string;
    content: string;
    icon?: string;
    isStarred?: boolean;
    children?: Note[];
    created_at: string;
    updated_at: string;
}

interface DocTreeItemProps {
    note: Note;
    activeNoteId: string | null;
    level?: number;
    onSelectNote: (noteId: string) => void;
    onCreateSubNote?: (parentId: string) => void;
    onContextMenu?: (e: React.MouseEvent, note: Note) => void;
    onDeleteNote?: (noteId: string) => void;
    onToggleStar?: (noteId: string) => void;
}

export const DocTreeItem: React.FC<DocTreeItemProps> = ({
    note,
    activeNoteId,
    level = 0,
    onSelectNote,
    onCreateSubNote,
    onContextMenu,
    onDeleteNote,
    onToggleStar
}) => {
    const [isExpanded, setIsExpanded] = useState<boolean>(true);
    const hasChildren = Boolean(note.children && note.children.length > 0);
    const isActive = activeNoteId === note.id;

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsExpanded(prev => !prev);
    };

    const handleSelect = (e: React.MouseEvent) => {
        e.stopPropagation();
        onSelectNote(note.id);
    };

    const handleAddSubPage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsExpanded(true);
        if (onCreateSubNote) {
            onCreateSubNote(note.id);
        }
    };

    const handleRightClick = (e: React.MouseEvent) => {
        if (onContextMenu) {
            onContextMenu(e, note);
        }
    };

    return (
        <div className="select-none text-sm font-sans">
            <div
                onClick={handleSelect}
                onContextMenu={handleRightClick}
                style={{ paddingLeft: `${level * 12 + 8}px` }}
                className={`group flex items-center justify-between py-1.5 pr-2 rounded-lg cursor-pointer transition-all duration-150 border border-transparent ${
                    isActive
                        ? 'bg-amber-500/15 text-amber-300 font-semibold border-amber-500/20 shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04]'
                }`}
            >
                <div className="flex items-center gap-1.5 min-w-0 flex-1 pr-1">
                    {/* Expand/Collapse Chevron */}
                    <button
                        type="button"
                        onClick={handleToggle}
                        className={`w-4 h-4 flex items-center justify-center rounded hover:bg-white/10 text-zinc-500 transition-colors ${
                            !hasChildren ? 'opacity-30 cursor-default' : ''
                        }`}
                    >
                        {hasChildren ? (
                            isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />
                        ) : (
                            <span className="w-2 h-2 rounded-full bg-zinc-600/40" />
                        )}
                    </button>

                    {/* Document Icon */}
                    <span className="shrink-0 text-base leading-none">
                        {note.icon ? (
                            note.icon
                        ) : (
                            <FileText className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-zinc-400'}`} />
                        )}
                    </span>

                    {/* Document Title */}
                    <span className="truncate text-xs tracking-wide">
                        {note.title || 'Sem título'}
                    </span>
                </div>

                {/* Hover Quick Actions */}
                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
                    {onToggleStar && (
                        <button
                            type="button"
                            title="Favoritar"
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleStar(note.id);
                            }}
                            className={`p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-amber-400 ${
                                note.isStarred ? 'text-amber-400 opacity-100' : ''
                            }`}
                        >
                            <Star className="w-3 h-3 fill-current" />
                        </button>
                    )}

                    {onCreateSubNote && (
                        <button
                            type="button"
                            title="Adicionar sub-página"
                            onClick={handleAddSubPage}
                            className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-amber-300"
                        >
                            <Plus className="w-3 h-3" />
                        </button>
                    )}

                    {onContextMenu && (
                        <button
                            type="button"
                            title="Mais opções"
                            onClick={handleRightClick}
                            className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-zinc-200"
                        >
                            <MoreVertical className="w-3 h-3" />
                        </button>
                    )}
                </div>
            </div>

            {/* Render Nested Children recursively */}
            {hasChildren && isExpanded && (
                <div className="flex flex-col gap-0.5">
                    {note.children!.map(child => (
                        <DocTreeItem
                            key={child.id}
                            note={child}
                            activeNoteId={activeNoteId}
                            level={level + 1}
                            onSelectNote={onSelectNote}
                            onCreateSubNote={onCreateSubNote}
                            onContextMenu={onContextMenu}
                            onDeleteNote={onDeleteNote}
                            onToggleStar={onToggleStar}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
