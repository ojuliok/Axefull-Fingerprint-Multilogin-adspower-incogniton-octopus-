import React, { useState, useEffect, useRef } from 'react';
import { 
    Heading1, Heading2, Heading3, Type, CheckSquare, List, ListOrdered, 
    Code, Quote, AlertTriangle, Minus, Search, Table, Kanban, LayoutList,
    Columns, ListFilter, Sparkles 
} from 'lucide-react';

export interface SlashMenuItem {
    id: string;
    title: string;
    description: string;
    category: 'Básicos' | 'Listas & Organização' | 'Mídia & Destaques' | 'Bases de Dados Embutidas' | 'Layout & Estrutura';
    shortcut?: string;
    icon: React.ReactNode;
    command: (editor: any) => void;
}

interface SlashMenuProps {
    isOpen: boolean;
    position: { x: number; y: number } | null;
    onClose: () => void;
    onSelectCommand: (command: (editor: any) => void) => void;
}

export const SLASH_COMMANDS: SlashMenuItem[] = [
    // 📝 Básicos
    {
        id: 'text',
        title: 'Texto',
        description: 'Parágrafo normal de texto simples.',
        category: 'Básicos',
        shortcut: 'Texto',
        icon: <Type className="w-4 h-4 text-zinc-300" />,
        command: (editor: any) => editor.chain().focus().setParagraph().run(),
    },
    {
        id: 'h1',
        title: 'Título 1',
        description: 'Título principal de seção grande.',
        category: 'Básicos',
        shortcut: '⌘ 1',
        icon: <Heading1 className="w-4 h-4 text-amber-400" />,
        command: (editor: any) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
    },
    {
        id: 'h2',
        title: 'Título 2',
        description: 'Subtítulo de seção média.',
        category: 'Básicos',
        shortcut: '⌘ 2',
        icon: <Heading2 className="w-4 h-4 text-amber-400" />,
        command: (editor: any) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
        id: 'h3',
        title: 'Título 3',
        description: 'Subtítulo pequeno para tópicos.',
        category: 'Básicos',
        shortcut: '⌘ 3',
        icon: <Heading3 className="w-4 h-4 text-amber-400" />,
        command: (editor: any) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
    },

    // ☑️ Listas & Organização
    {
        id: 'todo',
        title: 'To-do list (Tarefas)',
        description: 'Lista de tarefas interativa com checkbox.',
        category: 'Listas & Organização',
        shortcut: '/todo',
        icon: <CheckSquare className="w-4 h-4 text-emerald-400" />,
        command: (editor: any) => editor.chain().focus().toggleTaskList().run(),
    },
    {
        id: 'toggle',
        title: 'Toggle list',
        description: 'Lista retrátil para ocultar conteúdos.',
        category: 'Listas & Organização',
        shortcut: '/toggle',
        icon: <ListFilter className="w-4 h-4 text-indigo-400" />,
        command: (editor: any) => editor.chain().focus().toggleBulletList().run(),
    },
    {
        id: 'bullet',
        title: 'Lista com marcadores',
        description: 'Criar uma lista simples com marcadores.',
        category: 'Listas & Organização',
        shortcut: '/bullet',
        icon: <List className="w-4 h-4 text-sky-400" />,
        command: (editor: any) => editor.chain().focus().toggleBulletList().run(),
    },
    {
        id: 'number',
        title: 'Lista numerada',
        description: 'Criar uma lista com sequência numérica.',
        category: 'Listas & Organização',
        shortcut: '1.',
        icon: <ListOrdered className="w-4 h-4 text-purple-400" />,
        command: (editor: any) => editor.chain().focus().toggleOrderedList().run(),
    },

    // 🎨 Mídia & Destaques
    {
        id: 'code',
        title: 'Bloco de Código',
        description: 'Container de código com destaque de sintaxe.',
        category: 'Mídia & Destaques',
        shortcut: '```',
        icon: <Code className="w-4 h-4 text-pink-400" />,
        command: (editor: any) => editor.chain().focus().toggleCodeBlock().run(),
    },
    {
        id: 'quote',
        title: 'Citação',
        description: 'Destacar frases ou citações importantes.',
        category: 'Mídia & Destaques',
        shortcut: '>',
        icon: <Quote className="w-4 h-4 text-amber-300" />,
        command: (editor: any) => editor.chain().focus().toggleBlockquote().run(),
    },
    {
        id: 'callout',
        title: 'Callout (Destaque)',
        description: 'Caixa de alerta com aviso em destaque.',
        category: 'Mídia & Destaques',
        shortcut: '/callout',
        icon: <AlertTriangle className="w-4 h-4 text-amber-500" />,
        command: (editor: any) => editor.chain().focus().toggleBlockquote().run(),
    },

    // 📊 Bases de Dados Embutidas (AppFlowy / Coda Individual Views)
    {
        id: 'tabela',
        title: 'Base de Dados: Visão em Tabela',
        description: 'Inserir uma base de dados no formato Tabela Grid.',
        category: 'Bases de Dados Embutidas',
        shortcut: '/tabela',
        icon: <Table className="w-4 h-4 text-amber-400" />,
        command: (editor: any) => editor.chain().focus().insertContent('<p>[[DATABASE:table]]</p>').run(),
    },
    {
        id: 'kanban',
        title: 'Base de Dados: Visão em Quadro (Kanban)',
        description: 'Inserir uma base de dados no formato Quadro Kanban.',
        category: 'Bases de Dados Embutidas',
        shortcut: '/kanban',
        icon: <Kanban className="w-4 h-4 text-purple-400" />,
        command: (editor: any) => editor.chain().focus().insertContent('<p>[[DATABASE:kanban]]</p>').run(),
    },
    {
        id: 'lista',
        title: 'Base de Dados: Visão em Lista',
        description: 'Inserir uma base de dados no formato de Lista Enxuta.',
        category: 'Bases de Dados Embutidas',
        shortcut: '/lista',
        icon: <LayoutList className="w-4 h-4 text-sky-400" />,
        command: (editor: any) => editor.chain().focus().insertContent('<p>[[DATABASE:list]]</p>').run(),
    },

    // 📐 Layout & Estrutura
    {
        id: 'divider',
        title: 'Divisor',
        description: 'Linha horizontal para separar conteúdo.',
        category: 'Layout & Estrutura',
        shortcut: '---',
        icon: <Minus className="w-4 h-4 text-zinc-500" />,
        command: (editor: any) => editor.chain().focus().setHorizontalRule().run(),
    },
    {
        id: '2cols',
        title: '2 Colunas',
        description: 'Dividir o conteúdo em 2 colunas paralelas.',
        category: 'Layout & Estrutura',
        shortcut: '/2cols',
        icon: <Columns className="w-4 h-4 text-teal-400" />,
        command: (editor: any) => editor.chain().focus().insertContent('<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 12px 0;"><div style="padding: 12px; border: 1px dashed rgba(255,255,255,0.1); border-radius: 8px;"><p>Coluna 1</p></div><div style="padding: 12px; border: 1px dashed rgba(255,255,255,0.1); border-radius: 8px;"><p>Coluna 2</p></div></div>').run(),
    },
];

export const SlashMenu: React.FC<SlashMenuProps> = ({
    isOpen,
    position,
    onClose,
    onSelectCommand,
}) => {
    const [search, setSearch] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const menuRef = useRef<HTMLDivElement>(null);

    const filteredItems = SLASH_COMMANDS.filter(item =>
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.id.toLowerCase().includes(search.toLowerCase()) ||
        item.category.toLowerCase().includes(search.toLowerCase())
    );

    useEffect(() => {
        setSelectedIndex(0);
    }, [search]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % Math.max(1, filteredItems.length));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (filteredItems[selectedIndex]) {
                    onSelectCommand(filteredItems[selectedIndex].command);
                }
            } else if (e.key === 'Escape') {
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
    }, [isOpen, filteredItems, selectedIndex, onClose, onSelectCommand]);

    if (!isOpen || !position) return null;

    const adjustedX = Math.min(position.x, window.innerWidth - 320);
    const adjustedY = Math.min(position.y, window.innerHeight - 420);

    // Group items by category
    const categories = Array.from(new Set(filteredItems.map(i => i.category)));

    return (
        <div
            ref={menuRef}
            style={{ top: `${adjustedY}px`, left: `${adjustedX}px` }}
            className="fixed z-50 w-80 bg-[#18181b]/95 border border-white/10 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden py-1.5 font-sans animate-in fade-in zoom-in-95 duration-100 select-none"
        >
            {/* Search Bar Header */}
            <div className="px-3.5 py-2 border-b border-white/10 flex items-center gap-2 bg-white/[0.02]">
                <Search className="w-3.5 h-3.5 text-zinc-500" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Filtrar comandos por nome ou categoria..."
                    className="w-full bg-transparent text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none"
                    autoFocus
                />
            </div>

            {/* Categorized Commands List */}
            <div className="max-h-72 overflow-y-auto scrollbar-thin py-1">
                {filteredItems.length === 0 ? (
                    <div className="px-4 py-3 text-xs text-zinc-500 italic">Nenhum comando encontrado</div>
                ) : (
                    categories.map((catName) => {
                        const itemsInCat = filteredItems.filter(i => i.category === catName);
                        return (
                            <div key={catName} className="mb-1">
                                <div className="px-3.5 py-1 text-[10px] font-bold text-amber-400/80 uppercase tracking-wider bg-white/[0.01]">
                                    {catName}
                                </div>
                                {itemsInCat.map((item) => {
                                    const globalIdx = filteredItems.indexOf(item);
                                    const isSelected = globalIdx === selectedIndex;
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => onSelectCommand(item.command)}
                                            onMouseEnter={() => setSelectedIndex(globalIdx)}
                                            className={`w-full flex items-center justify-between px-3.5 py-2 text-left transition-all cursor-pointer ${
                                                isSelected ? 'bg-amber-500/15 text-amber-300 border-l-2 border-amber-400 pl-3' : 'text-zinc-300 hover:bg-white/5'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="p-1.5 rounded-lg bg-white/[0.04] border border-white/10 shrink-0">
                                                    {item.icon}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="text-xs font-bold truncate">{item.title}</div>
                                                    <div className="text-[10px] text-zinc-500 truncate">{item.description}</div>
                                                </div>
                                            </div>
                                            {item.shortcut && (
                                                <span className="text-[10px] font-mono text-zinc-500 bg-white/5 px-1.5 py-0.5 rounded border border-white/10 shrink-0 ml-2">
                                                    {item.shortcut}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};
