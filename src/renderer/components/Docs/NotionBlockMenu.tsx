import React, { useState, useEffect, useRef } from 'react';
import { 
    Search, RefreshCw, Palette, Link, Copy, ArrowRight, Trash2, Edit3, 
    Sparkles, CheckSquare, ListFilter, Code, Quote, AlertTriangle, Columns,
    ChevronRight, ChevronDown, Check, Clock, User, Table, Kanban, LayoutList
} from 'lucide-react';

export interface NotionBlockMenuProps {
    isOpen: boolean;
    position: { x: number; y: number } | null;
    onClose: () => void;
    onTurnInto: (type: string, props?: any) => void;
    onSetColor: (textColor?: string, backgroundColor?: string) => void;
    onDuplicate: () => void;
    onCopyLink: () => void;
    onDelete: () => void;
    authorName?: string;
    lastEditedTime?: string;
}

const TEXT_COLORS = [
    { name: 'Default text', color: '#ffffff', key: 'default' },
    { name: 'Gray text', color: '#9ca3af', key: 'gray' },
    { name: 'Brown text', color: '#d97706', key: 'brown' },
    { name: 'Orange text', color: '#f97316', key: 'orange' },
    { name: 'Yellow text', color: '#eab308', key: 'yellow' },
    { name: 'Green text', color: '#22c55e', key: 'green' },
    { name: 'Blue text', color: '#3b82f6', key: 'blue' },
    { name: 'Purple text', color: '#a855f7', key: 'purple' },
    { name: 'Pink text', color: '#ec4899', key: 'pink' },
    { name: 'Red text', color: '#ef4444', key: 'red' },
];

const BG_COLORS = [
    { name: 'Default background', bg: 'transparent', key: 'default' },
    { name: 'Gray background', bg: 'rgba(156, 163, 175, 0.2)', key: 'gray' },
    { name: 'Brown background', bg: 'rgba(217, 119, 6, 0.2)', key: 'brown' },
    { name: 'Orange background', bg: 'rgba(249, 115, 22, 0.2)', key: 'orange' },
    { name: 'Yellow background', bg: 'rgba(234, 179, 8, 0.2)', key: 'yellow' },
    { name: 'Green background', bg: 'rgba(34, 197, 94, 0.2)', key: 'green' },
    { name: 'Blue background', bg: 'rgba(59, 130, 246, 0.2)', key: 'blue' },
    { name: 'Purple background', bg: 'rgba(168, 85, 247, 0.2)', key: 'purple' },
    { name: 'Pink background', bg: 'rgba(236, 72, 153, 0.2)', key: 'pink' },
    { name: 'Red background', bg: 'rgba(239, 68, 68, 0.2)', key: 'red' },
];

const TURN_INTO_OPTIONS = [
    // Básicos
    { label: 'Texto', type: 'paragraph', category: 'Básicos', icon: <span className="font-serif text-sm">T</span> },
    { label: 'Título 1', type: 'heading', props: { level: 1 }, category: 'Básicos', icon: <span className="font-bold text-xs text-amber-400">H1</span> },
    { label: 'Título 2', type: 'heading', props: { level: 2 }, category: 'Básicos', icon: <span className="font-bold text-xs text-amber-400">H2</span> },
    { label: 'Título 3', type: 'heading', props: { level: 3 }, category: 'Básicos', icon: <span className="font-bold text-xs text-amber-400">H3</span> },
    
    // Listas
    { label: 'To-do list', type: 'checkListItem', category: 'Listas', icon: <CheckSquare className="w-3.5 h-3.5 text-emerald-400" /> },
    { label: 'Toggle list', type: 'toggleListItem', category: 'Listas', icon: <ListFilter className="w-3.5 h-3.5 text-purple-400" /> },
    
    // Destaques
    { label: 'Code', type: 'codeBlock', category: 'Destaques', icon: <Code className="w-3.5 h-3.5 text-pink-400" /> },
    { label: 'Quote', type: 'quote', category: 'Destaques', icon: <Quote className="w-3.5 h-3.5 text-amber-300" /> },
    { label: 'Callout', type: 'callout', category: 'Destaques', icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> },
    
    // Bases de Dados
    { label: 'Tabela', type: 'database-table', category: 'Bases de Dados', icon: <Table className="w-3.5 h-3.5 text-amber-400" /> },
    { label: 'Quadro (Kanban)', type: 'database-kanban', category: 'Bases de Dados', icon: <Kanban className="w-3.5 h-3.5 text-purple-400" /> },
    { label: 'Lista', type: 'database-list', category: 'Bases de Dados', icon: <LayoutList className="w-3.5 h-3.5 text-sky-400" /> },
    
    // Layout
    { label: '2 Colunas', type: '2columns', category: 'Layout', icon: <Columns className="w-3.5 h-3.5 text-teal-400" /> },
    { label: '3 Colunas', type: '3columns', category: 'Layout', icon: <Columns className="w-3.5 h-3.5 text-teal-400" /> },
    { label: '4 Colunas', type: '4columns', category: 'Layout', icon: <Columns className="w-3.5 h-3.5 text-teal-400" /> },
    { label: '5 Colunas', type: '5columns', category: 'Layout', icon: <Columns className="w-3.5 h-3.5 text-teal-400" /> },
];

export const NotionBlockMenu: React.FC<NotionBlockMenuProps> = ({
    isOpen,
    position,
    onClose,
    onTurnInto,
    onSetColor,
    onDuplicate,
    onCopyLink,
    onDelete,
    authorName = 'Julio Cesar',
    lastEditedTime = 'Hoje às 18:57'
}) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeSubmenu, setActiveSubmenu] = useState<'none' | 'turnInto' | 'color'>('none');

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

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen || !position) return null;

    const adjustedX = Math.min(position.x, window.innerWidth - 280);
    const adjustedY = Math.min(position.y, window.innerHeight - 400);

    const turnIntoCategories = Array.from(new Set(TURN_INTO_OPTIONS.map(o => o.category)));

    return (
        <div
            ref={menuRef}
            style={{ top: `${adjustedY}px`, left: `${adjustedX}px` }}
            className="fixed z-50 flex gap-2 font-sans select-none animate-in fade-in zoom-in-95 duration-100"
        >
            {/* Primary Context Menu Panel */}
            <div className="w-64 bg-[#18181b]/95 border border-white/10 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden py-1.5 text-xs text-zinc-200">
                {/* Search Input Filter */}
                <div className="px-3 py-1.5 border-b border-white/10 flex items-center gap-2 bg-white/[0.02]">
                    <Search className="w-3.5 h-3.5 text-zinc-500" />
                    <input
                        type="text"
                        placeholder="Filtrar..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-transparent text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none"
                    />
                </div>

                {/* Submenu Trigger: Turn Into */}
                <div 
                    onMouseEnter={() => setActiveSubmenu('turnInto')}
                    className="relative"
                >
                    <button
                        className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-white/[0.06] hover:text-amber-300 transition-colors ${activeSubmenu === 'turnInto' ? 'bg-white/[0.06] text-amber-300' : ''}`}
                    >
                        <div className="flex items-center gap-2.5">
                            <RefreshCw className="w-4 h-4 text-amber-400" />
                            <span className="font-semibold">Turn into</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
                    </button>
                </div>

                {/* Submenu Trigger: Color */}
                <div 
                    onMouseEnter={() => setActiveSubmenu('color')}
                    className="relative"
                >
                    <button
                        className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-white/[0.06] hover:text-amber-300 transition-colors ${activeSubmenu === 'color' ? 'bg-white/[0.06] text-amber-300' : ''}`}
                    >
                        <div className="flex items-center gap-2.5">
                            <Palette className="w-4 h-4 text-purple-400" />
                            <span className="font-semibold">Color</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
                    </button>
                </div>

                <div className="my-1 border-t border-white/10" />

                {/* Copy Link to Block */}
                <button
                    onClick={() => {
                        onCopyLink();
                        onClose();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-white/[0.06] hover:text-white transition-colors cursor-pointer"
                >
                    <div className="flex items-center gap-2.5">
                        <Link className="w-4 h-4 text-zinc-400" />
                        <span>Copiar link do bloco</span>
                    </div>
                    <span className="text-[10px] text-zinc-500 font-mono">Alt+L</span>
                </button>

                {/* Duplicate */}
                <button
                    onClick={() => {
                        onDuplicate();
                        onClose();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-white/[0.06] hover:text-white transition-colors cursor-pointer"
                >
                    <div className="flex items-center gap-2.5">
                        <Copy className="w-4 h-4 text-zinc-400" />
                        <span>Duplicar bloco</span>
                    </div>
                    <span className="text-[10px] text-zinc-500 font-mono">Ctrl+D</span>
                </button>

                {/* Delete */}
                <button
                    onClick={() => {
                        onDelete();
                        onClose();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-left text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors cursor-pointer"
                >
                    <div className="flex items-center gap-2.5">
                        <Trash2 className="w-4 h-4 text-current" />
                        <span>Excluir bloco</span>
                    </div>
                    <span className="text-[10px] text-zinc-500 font-mono">Del</span>
                </button>

                <div className="my-1 border-t border-white/10" />

                {/* Authorship & Timestamp Footer */}
                <div className="px-3 py-2 bg-black/20 text-[10px] text-zinc-500 space-y-0.5">
                    <div className="flex items-center gap-1.5 text-zinc-400 font-medium">
                        <User className="w-3 h-3 text-zinc-500" />
                        <span>Editado por <strong className="text-zinc-200">{authorName}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5 pl-4 text-zinc-500 font-mono">
                        <Clock className="w-2.5 h-2.5" />
                        <span>{lastEditedTime}</span>
                    </div>
                </div>
            </div>

            {/* Submenu: Turn into Categorized */}
            {activeSubmenu === 'turnInto' && (
                <div className="w-60 bg-[#18181b]/95 border border-white/10 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden py-1.5 text-xs text-zinc-200 max-h-[380px] overflow-y-auto scrollbar-thin animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3 py-1.5 text-[10px] font-bold text-amber-400/80 uppercase tracking-wider border-b border-white/10">
                        Transformar Bloco em:
                    </div>
                    {turnIntoCategories.map(cat => {
                        const itemsInCat = TURN_INTO_OPTIONS.filter(o => o.category === cat);
                        return (
                            <div key={cat} className="mb-1">
                                <div className="px-3 py-1 text-[9px] font-bold text-zinc-500 uppercase tracking-wider bg-white/[0.01]">
                                    {cat}
                                </div>
                                {itemsInCat.map((opt, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => {
                                            onTurnInto(opt.type, opt.props);
                                            onClose();
                                        }}
                                        className="w-full flex items-center gap-2.5 px-3 py-1.5 text-left hover:bg-amber-500/15 hover:text-amber-300 transition-colors cursor-pointer"
                                    >
                                        <span className="w-4 h-4 flex items-center justify-center shrink-0">{opt.icon}</span>
                                        <span className="truncate">{opt.label}</span>
                                    </button>
                                ))}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Submenu: Color (Text & Background) */}
            {activeSubmenu === 'color' && (
                <div className="w-60 bg-[#18181b]/95 border border-white/10 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden py-1.5 text-xs text-zinc-200 max-h-[380px] overflow-y-auto scrollbar-thin animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3 py-1.5 text-[10px] font-bold text-amber-400/80 uppercase tracking-wider border-b border-white/10">Cor do Texto</div>
                    {TEXT_COLORS.map((c) => (
                        <button
                            key={c.key}
                            onClick={() => {
                                onSetColor(c.key, undefined);
                                onClose();
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-1.5 text-left hover:bg-white/[0.06] transition-colors cursor-pointer"
                        >
                            <span className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0" style={{ backgroundColor: c.color }} />
                            <span>{c.name}</span>
                        </button>
                    ))}

                    <div className="px-3 py-1.5 text-[10px] font-bold text-amber-400/80 uppercase tracking-wider border-t border-b border-white/10 mt-1">Cor de Fundo</div>
                    {BG_COLORS.map((c) => (
                        <button
                            key={c.key}
                            onClick={() => {
                                onSetColor(undefined, c.key);
                                onClose();
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-1.5 text-left hover:bg-white/[0.06] transition-colors cursor-pointer"
                        >
                            <span className="w-3.5 h-3.5 rounded border border-white/20 shrink-0" style={{ backgroundColor: c.bg }} />
                            <span>{c.name}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
