import React, { useState, useEffect, useRef } from 'react';
import { Search, FileText, Star, Plus, ArrowRight, CornerDownLeft, Sparkles, Folder } from 'lucide-react';
import { Note } from './DocTreeItem';

interface CommandPaletteProps {
    isOpen: boolean;
    onClose: () => void;
    notes: Note[];
    onSelectNote: (noteId: string) => void;
    onCreateNote: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
    isOpen,
    onClose,
    notes,
    onSelectNote,
    onCreateNote
}) => {
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    const filteredNotes = React.useMemo(() => {
        if (!query.trim()) return notes.slice(0, 8);
        const q = query.toLowerCase();
        return notes.filter(n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)).slice(0, 10);
    }, [query, notes]);

    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                if (isOpen) onClose();
                else {
                    // Open logic triggered by parent or global listener
                }
            }
            if (!isOpen) return;

            if (e.key === 'Escape') {
                onClose();
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % Math.max(1, filteredNotes.length));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + filteredNotes.length) % Math.max(1, filteredNotes.length));
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (filteredNotes[selectedIndex]) {
                    onSelectNote(filteredNotes[selectedIndex].id);
                    onClose();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, filteredNotes, selectedIndex, onClose, onSelectNote]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/70 backdrop-blur-md animate-in fade-in duration-150">
            <div
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-xl bg-[#18181b] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150 text-zinc-200"
            >
                {/* Search Bar Input */}
                <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/10 bg-white/[0.02]">
                    <Search className="w-5 h-5 text-amber-400 shrink-0" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setSelectedIndex(0);
                        }}
                        placeholder="Buscar página, documento ou comando... (ou digite para filtrar)"
                        className="w-full bg-transparent text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none"
                    />
                    <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono text-zinc-400 bg-white/10 rounded border border-white/10">
                        ESC
                    </kbd>
                </div>

                {/* Quick Results List */}
                <div className="max-h-[340px] overflow-y-auto p-2 space-y-1 scrollbar-thin">
                    <div className="px-3 py-1 text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center justify-between">
                        <span>Páginas sugeridas</span>
                        <span className="text-zinc-600 font-mono text-[9px]">{filteredNotes.length} resultados</span>
                    </div>

                    {filteredNotes.length > 0 ? (
                        filteredNotes.map((note, idx) => {
                            const isSelected = idx === selectedIndex;

                            return (
                                <div
                                    key={note.id}
                                    onClick={() => {
                                        onSelectNote(note.id);
                                        onClose();
                                    }}
                                    onMouseEnter={() => setSelectedIndex(idx)}
                                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                                        isSelected
                                            ? 'bg-amber-500/20 text-amber-300 font-medium border border-amber-500/30 shadow-sm'
                                            : 'hover:bg-white/5 text-zinc-300'
                                    }`}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span className="text-base shrink-0">{note.icon || '📝'}</span>
                                        <div className="flex flex-col min-w-0">
                                            <span className="truncate text-xs font-semibold">{note.title || 'Sem título'}</span>
                                            <span className="truncate text-[10px] text-zinc-500">
                                                {note.content ? note.content.replace(/<[^>]*>/g, '').slice(0, 60) : 'Documento vazio'}
                                            </span>
                                        </div>
                                    </div>

                                    {isSelected && (
                                        <div className="flex items-center gap-1 text-[10px] text-amber-400 font-mono shrink-0">
                                            <span>Abrir</span>
                                            <CornerDownLeft className="w-3 h-3" />
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <div className="py-8 text-center text-zinc-500 text-xs">
                            Nenhum documento encontrado com "{query}"
                        </div>
                    )}
                </div>

                {/* Quick Actions Footer */}
                <div className="p-3 border-t border-white/10 bg-black/30 flex items-center justify-between text-xs">
                    <button
                        onClick={() => {
                            onCreateNote();
                            onClose();
                        }}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold border border-amber-500/30 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Criar Nova Página</span>
                    </button>

                    <div className="flex items-center gap-3 text-[11px] text-zinc-500">
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 text-[9px] bg-white/10 rounded">↑↓</kbd> Navegar
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 text-[9px] bg-white/10 rounded">↵</kbd> Selecionar
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};
