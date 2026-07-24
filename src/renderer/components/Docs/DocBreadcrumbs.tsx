import React from 'react';
import { ChevronRight, Layers, FileText, Lock, Star, Share2, MoreHorizontal, Pin } from 'lucide-react';
import { Note } from './DocTreeItem';

interface DocBreadcrumbsProps {
    spaceName?: string;
    spaceIcon?: string;
    note?: Note;
    parentNote?: Note;
    isStarred?: boolean;
    onToggleStar?: () => void;
    onFloatWidget?: () => void;
    onOpenSearch?: () => void;
}

export const DocBreadcrumbs: React.FC<DocBreadcrumbsProps> = ({
    spaceName = 'Meu Workspace',
    spaceIcon = '🚀',
    note,
    parentNote,
    isStarred,
    onToggleStar,
    onFloatWidget,
    onOpenSearch
}) => {
    return (
        <div className="h-12 w-full border-b border-white/10 px-4 flex items-center justify-between bg-[#121318]/80 backdrop-blur-md shrink-0 select-none text-xs text-zinc-400">
            {/* Left: Breadcrumbs Trail */}
            <div className="flex items-center gap-1.5 min-w-0 flex-1 truncate pr-4">
                <span className="flex items-center gap-1 font-semibold text-zinc-300 hover:text-white cursor-pointer transition-colors">
                    <span className="text-sm">{spaceIcon}</span>
                    <span className="truncate">{spaceName}</span>
                </span>

                {parentNote && (
                    <>
                        <ChevronRight className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                        <span className="flex items-center gap-1 text-zinc-400 hover:text-zinc-200 cursor-pointer transition-colors truncate">
                            <span>{parentNote.icon || '📝'}</span>
                            <span className="truncate">{parentNote.title}</span>
                        </span>
                    </>
                )}

                {note && (
                    <>
                        <ChevronRight className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                        <span className="flex items-center gap-1 font-bold text-amber-300 truncate">
                            <span>{note.icon || '📝'}</span>
                            <span className="truncate">{note.title || 'Sem título'}</span>
                        </span>
                    </>
                )}
            </div>

            {/* Right: Quick Page Tools & Search Trigger */}
            <div className="flex items-center gap-2 shrink-0">
                {onOpenSearch && (
                    <button
                        onClick={onOpenSearch}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-zinc-200 border border-white/5 transition-colors font-mono text-[11px]"
                        title="Busca Rápida (Ctrl + K)"
                    >
                        <span>Ctrl+K</span>
                    </button>
                )}

                {onToggleStar && (
                    <button
                        onClick={onToggleStar}
                        className={`p-1.5 rounded-lg border transition-all ${
                            isStarred
                                ? 'bg-amber-500/20 border-amber-500/30 text-amber-400'
                                : 'bg-white/5 border-white/10 text-zinc-400 hover:text-zinc-200'
                        }`}
                        title={isStarred ? 'Remover dos Favoritos' : 'Adicionar aos Favoritos'}
                    >
                        <Star className="w-3.5 h-3.5 fill-current" />
                    </button>
                )}

                {onFloatWidget && (
                    <button
                        onClick={onFloatWidget}
                        className="p-1.5 rounded-lg border bg-white/5 border-white/10 text-zinc-400 hover:text-amber-400 transition-all"
                        title="Fixar como Widget Flutuante"
                    >
                        <Pin className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>
        </div>
    );
};
