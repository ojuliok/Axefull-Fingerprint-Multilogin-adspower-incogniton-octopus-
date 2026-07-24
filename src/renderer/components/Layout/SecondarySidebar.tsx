import React, { useState } from 'react';
import { 
    Search, Plus, Star, Folder, Trash2, ChevronLeft, ChevronRight, FileText, 
    Layers, Key, Sparkles, Settings, HelpCircle, ChevronDown, Command
} from 'lucide-react';
import { DocTreeItem, Note } from '../Docs/DocTreeItem';

interface SpaceItem {
    id: string;
    name: string;
    icon: string;
}

interface SecondarySidebarProps {
    spaces: SpaceItem[];
    activeSpaceId: string;
    onSelectSpace: (spaceId: string) => void;
    notes: Note[];
    activeNoteId: string | null;
    searchQuery: string;
    onSearchChange: (q: string) => void;
    onSelectNote: (noteId: string) => void;
    onCreateNote: (parentId?: string) => void;
    onCreateSpace?: () => void;
    onContextMenuNote?: (e: React.MouseEvent, note: Note) => void;
    onToggleStarNote?: (noteId: string) => void;
    onDeleteNote?: (noteId: string) => void;
    onSelectPassVault?: () => void;
    isPassSelected?: boolean;
    onOpenSearchModal?: () => void;
}

export const SecondarySidebar: React.FC<SecondarySidebarProps> = ({
    spaces,
    activeSpaceId,
    onSelectSpace,
    notes,
    activeNoteId,
    searchQuery,
    onSearchChange,
    onSelectNote,
    onCreateNote,
    onCreateSpace,
    onContextMenuNote,
    onToggleStarNote,
    onDeleteNote,
    onSelectPassVault,
    isPassSelected,
    onOpenSearchModal
}) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [showSpaceMenu, setShowSpaceMenu] = useState(false);

    // Build hierarchical tree structure for notes
    const buildTree = (allNotes: Note[], spaceId: string, search: string): Note[] => {
        const filtered = allNotes.filter(n => n.spaceId === spaceId);

        if (search.trim() !== '') {
            const query = search.toLowerCase();
            return filtered.filter(n => n.title.toLowerCase().includes(query) || n.content.toLowerCase().includes(query));
        }

        const map = new Map<string, Note>();
        const roots: Note[] = [];

        filtered.forEach(n => {
            map.set(n.id, { ...n, children: [] });
        });

        filtered.forEach(n => {
            const item = map.get(n.id)!;
            if (n.parentId && map.has(n.parentId)) {
                map.get(n.parentId)!.children!.push(item);
            } else {
                roots.push(item);
            }
        });

        return roots;
    };

    const treeNotes = buildTree(notes, activeSpaceId, searchQuery);
    const starredNotes = notes.filter(n => n.isStarred);
    const currentSpace = spaces.find(s => s.id === activeSpaceId) || spaces[0];

    if (isCollapsed) {
        return (
            <div className="w-12 h-full bg-[#121318] border-r border-white/10 flex flex-col items-center py-4 gap-4 z-20 shrink-0">
                <button
                    onClick={() => setIsCollapsed(false)}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                    title="Expandir Sidebar"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>

                <button
                    onClick={() => onCreateNote()}
                    className="p-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 transition-colors"
                    title="Nova Página"
                >
                    <Plus className="w-4 h-4" />
                </button>
            </div>
        );
    }

    return (
        <aside className="w-64 h-full bg-[#121318] border-r border-white/10 flex flex-col z-20 select-none font-sans text-xs shrink-0">
            {/* Workspace Header Dropdown */}
            <div className="relative border-b border-white/10">
                <div
                    onClick={() => setShowSpaceMenu(!showSpaceMenu)}
                    className="p-3 flex items-center justify-between cursor-pointer hover:bg-white/[0.04] transition-colors"
                >
                    <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500/30 to-purple-600/30 border border-white/10 flex items-center justify-center text-sm">
                            {currentSpace?.icon || '🚀'}
                        </span>
                        <div className="flex flex-col min-w-0">
                            <span className="font-bold text-zinc-100 truncate text-xs">
                                {currentSpace?.name || 'Workspace'}
                            </span>
                            <span className="text-[10px] text-zinc-500">Notion Workspace</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsCollapsed(true);
                            }}
                            className="p-1 rounded hover:bg-white/10 text-zinc-500 hover:text-zinc-200"
                            title="Recolher Sidebar"
                        >
                            <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>

                {/* Space Switcher Popup */}
                {showSpaceMenu && (
                    <div className="absolute top-12 left-2 right-2 z-40 bg-[#18181b] border border-white/10 rounded-xl shadow-2xl p-1.5 space-y-1 animate-in fade-in zoom-in-95">
                        <div className="px-2.5 py-1 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                            Trocar Espaço de Trabalho
                        </div>
                        {spaces.map(s => (
                            <button
                                key={s.id}
                                onClick={() => {
                                    onSelectSpace(s.id);
                                    setShowSpaceMenu(false);
                                }}
                                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                                    activeSpaceId === s.id
                                        ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30'
                                        : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                                }`}
                            >
                                <span className="text-sm">{s.icon}</span>
                                <span className="truncate">{s.name}</span>
                            </button>
                        ))}
                        {onCreateSpace && (
                            <button
                                onClick={() => {
                                    onCreateSpace();
                                    setShowSpaceMenu(false);
                                }}
                                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-amber-400 hover:bg-amber-500/10 font-medium transition-colors border-t border-white/5 mt-1"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Criar Novo Espaço</span>
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Quick Command Search Bar (Ctrl+K) */}
            <div className="p-2.5 border-b border-white/5">
                <button
                    onClick={() => {
                        if (onOpenSearchModal) onOpenSearchModal();
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 rounded-xl text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <Search className="w-3.5 h-3.5 text-zinc-500" />
                        <span className="text-xs">Buscar ou ir para...</span>
                    </div>
                    <kbd className="px-1.5 py-0.5 text-[9px] font-mono bg-white/10 text-zinc-400 rounded">
                        Ctrl+K
                    </kbd>
                </button>
            </div>

            {/* Quick Action: New Page Button */}
            <div className="px-2.5 pt-2">
                <button
                    onClick={() => onCreateNote()}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold rounded-xl border border-amber-500/30 transition-all shadow-sm active:scale-95"
                >
                    <Plus className="w-4 h-4" />
                    <span>Nova Página</span>
                </button>
            </div>

            {/* Main Tree & Lists Scroll Container */}
            <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4 scrollbar-thin">
                {/* Starred Favorites Section */}
                {starredNotes.length > 0 && (
                    <div>
                        <div className="px-2 py-1 flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-amber-400/80 uppercase">
                            <Star className="w-3 h-3 fill-amber-400/80" />
                            <span>Favoritos</span>
                        </div>
                        <div className="mt-1 space-y-0.5">
                            {starredNotes.map(n => (
                                <div
                                    key={n.id}
                                    onClick={() => onSelectNote(n.id)}
                                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors ${
                                        activeNoteId === n.id ? 'bg-amber-500/20 text-amber-300 font-medium' : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                                    }`}
                                >
                                    <div className="flex items-center gap-2 truncate">
                                        <span>{n.icon || '📝'}</span>
                                        <span className="truncate">{n.title || 'Sem título'}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Documents Navigation Tree */}
                <div>
                    <div className="px-2 py-1 flex items-center justify-between text-[10px] font-bold tracking-wider text-zinc-500 uppercase">
                        <span>Páginas do Workspace</span>
                        <span className="text-[9px] text-zinc-600 font-mono">{treeNotes.length}</span>
                    </div>

                    <div className="mt-1 space-y-0.5">
                        {treeNotes.length > 0 ? (
                            treeNotes.map(note => (
                                <DocTreeItem
                                    key={note.id}
                                    note={note}
                                    activeNoteId={activeNoteId}
                                    onSelectNote={onSelectNote}
                                    onCreateSubNote={(parentId) => onCreateNote(parentId)}
                                    onContextMenu={onContextMenuNote}
                                    onToggleStar={onToggleStarNote}
                                    onDeleteNote={onDeleteNote}
                                />
                            ))
                        ) : (
                            <div className="text-center py-6 text-zinc-500 text-xs italic">
                                Nenhuma página neste espaço
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Pass Vault Footer */}
            {onSelectPassVault && (
                <div className="p-2 border-t border-white/10 bg-black/20">
                    <button
                        onClick={onSelectPassVault}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all font-medium ${
                            isPassSelected
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold'
                                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            <Key className="w-4 h-4 text-amber-400" />
                            <span>Cofre Pass</span>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-zinc-400 font-mono">Criptografado</span>
                    </button>
                </div>
            )}
        </aside>
    );
};
