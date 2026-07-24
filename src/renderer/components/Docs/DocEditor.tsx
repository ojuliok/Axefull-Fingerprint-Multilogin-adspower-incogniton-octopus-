import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Placeholder from '@tiptap/extension-placeholder';
import TiptapImage from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';

import { useTheme } from '../../context/ThemeContext';
import { 
    Smile, Image as ImageIcon, Clock, FileText, Share2, MoreHorizontal, 
    Sparkles, X, Plus, CheckSquare, Layers, Tag, User, Calendar, Table as TableIcon
} from 'lucide-react';

import { NotionBlockMenu } from './NotionBlockMenu';
import { SlashMenu } from './SlashMenu';
import { BubbleMenuToolbar } from './BubbleMenuToolbar';
import { NotionBlockGrip } from './NotionBlockGrip';
import { NotionDatabase } from './NotionDatabase';
import './DocEditor.css';

interface DocEditorProps {
    noteId: string;
    title: string;
    icon?: string;
    content: string;
    updatedAt?: string;
    onTitleChange: (title: string) => void;
    onIconChange?: (icon: string) => void;
    onContentChange: (content: string) => void;
}

export interface DatabaseBlockItem {
    id: string;
    initialViewType: 'table' | 'kanban' | 'list';
}

const EMOJI_LIST = ['📝', '🚀', '💡', '🔥', '🎯', '⚡️', '🎨', '📚', '🧠', '💼', '📌', '🌐', '🛠️', '⚙️', '🌟', '📁', '📊', '📅', '🔑', '🏷️'];

const PRESET_COVERS = [
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80'
];

const STARTER_TEMPLATES = [
    {
        title: '🚀 Planejamento de Projeto (AppFlowy)',
        icon: '🚀',
        content: `<h1>🚀 Planejamento de Projeto</h1><p>Visão geral e metas do projeto.</p><h2>Metas Principais</h2><ul data-type="taskList"><li data-type="taskItem" data-checked="false"><div><p>Definir arquitetura</p></div></li><li data-type="taskItem" data-checked="false"><div><p>Criar protótipo inicial</p></div></li><li data-type="taskItem" data-checked="false"><div><p>Testar com usuários</p></div></li></ul><p>[[DATABASE:table]]</p>`
    },
    {
        title: '📋 Notas de Reunião',
        icon: '📋',
        content: `<h1>📋 Notas de Reunião</h1><p><strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}</p><h2>Participantes</h2><ul><li><p>Equipe Principal</p></li></ul><h2>Pauta</h2><ol><li><p>Status do projeto</p></li><li><p>Próximos passos</p></li></ol>`
    },
    {
        title: '🎯 Lista de Tarefas & OKRs',
        icon: '🎯',
        content: `<h1>🎯 Objetivos & OKRs</h1><p>Acompanhamento de metas trimestrais.</p><h2>Metas Chave</h2><ul data-type="taskList"><li data-type="taskItem" data-checked="true"><div><p>Lançamento da versão 1.0</p></div></li><li data-type="taskItem" data-checked="false"><div><p>Alcançar 100% de cobertura</p></div></li></ul><p>[[DATABASE:kanban]]</p>`
    }
];

export const DocEditor: React.FC<DocEditorProps> = ({
    noteId,
    title,
    icon = '📝',
    content,
    updatedAt,
    onTitleChange,
    onIconChange,
    onContentChange,
}) => {
    const { theme } = useTheme();
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showCoverModal, setShowCoverModal] = useState(false);
    const [coverImage, setCoverImage] = useState<string | null>(null);

    // Track embedded databases with individual view configuration
    const [databaseBlocks, setDatabaseBlocks] = useState<DatabaseBlockItem[]>([]);

    // Notion Block Grip Handle state
    const editorContainerRef = useRef<HTMLDivElement>(null);
    const [gripState, setGripState] = useState<{
        visible: boolean;
        position: { top: number; left: number } | null;
        targetElement: HTMLElement | null;
    }>({ visible: false, position: null, targetElement: null });

    // Notion / AppFlowy Block Context Menu state
    const [blockMenuState, setBlockMenuState] = useState<{
        isOpen: boolean;
        position: { x: number; y: number } | null;
    }>({ isOpen: false, position: null });

    // AppFlowy Slash Menu state
    const [slashMenuState, setSlashMenuState] = useState<{
        isOpen: boolean;
        position: { x: number; y: number } | null;
    }>({ isOpen: false, position: null });

    // AppFlowy Selection Bubble Toolbar state ("Ver ao selecionar o texto")
    const [bubbleState, setBubbleState] = useState<{
        isOpen: boolean;
        position: { x: number; y: number } | null;
    }>({ isOpen: false, position: null });

    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const triggerContentSave = (html: string) => {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => {
            onContentChange(html);
        }, 300);
    };

    // Parse databases from content
    const syncDatabasesFromHtml = (html: string) => {
        if (!html) return;
        const matches = html.match(/\[\[DATABASE:(table|kanban|list)\]\]/g);
        if (matches) {
            const parsed: DatabaseBlockItem[] = matches.map((m, idx) => {
                const typeMatch = m.match(/\[\[DATABASE:(table|kanban|list)\]\]/);
                const viewType = (typeMatch && typeMatch[1]) ? (typeMatch[1] as 'table' | 'kanban' | 'list') : 'table';
                return { id: `db-${idx}`, initialViewType: viewType };
            });
            setDatabaseBlocks(parsed);
        }
    };

    // Tiptap Editor Instance with comprehensive null guards
    const editor = useEditor({
        extensions: [
            StarterKit,
            TaskList,
            TaskItem.configure({ nested: true }),
            Placeholder.configure({
                placeholder: 'Pressione "/" para comandos ou comece a escrever seu documento...',
            }),
            TiptapImage,
            Link.configure({ openOnClick: false }),
        ],
        content: content || '<p></p>',
        onUpdate: ({ editor }) => {
            if (!editor || editor.isDestroyed || !editor.view) return;
            try {
                const html = editor.getHTML();
                triggerContentSave(html);
                syncDatabasesFromHtml(html);

                // Detect Slash Command typing
                const { selection } = editor.state;
                if (selection) {
                    const textBefore = editor.state.doc.textBetween(Math.max(0, selection.from - 2), selection.from, '\n');
                    if (textBefore.endsWith('/')) {
                        const domSelection = window.getSelection();
                        if (domSelection && domSelection.rangeCount > 0) {
                            const rect = domSelection.getRangeAt(0).getBoundingClientRect();
                            setSlashMenuState({
                                isOpen: true,
                                position: { x: rect.left, y: rect.bottom + 6 }
                            });
                        }
                    } else {
                        setSlashMenuState({ isOpen: false, position: null });
                    }
                }
            } catch (e) {
                console.warn('[DocEditor] Safe onUpdate caught error:', e);
            }
        },
        onSelectionUpdate: ({ editor }) => {
            if (!editor || editor.isDestroyed || !editor.view) return;
            try {
                const { selection } = editor.state;
                if (selection && !selection.empty) {
                    const domSelection = window.getSelection();
                    if (domSelection && domSelection.rangeCount > 0) {
                        const rect = domSelection.getRangeAt(0).getBoundingClientRect();
                        setBubbleState({
                            isOpen: true,
                            position: { x: Math.max(16, rect.left + rect.width / 2 - 140), y: Math.max(10, rect.top - 46) }
                        });
                    }
                } else {
                    setBubbleState({ isOpen: false, position: null });
                }
            } catch (e) {
                console.warn('[DocEditor] Safe onSelectionUpdate caught error:', e);
            }
        }
    });

    const currentNoteIdRef = useRef(noteId);
    const isFirstRender = useRef(true);

    // Update editor content when note changes (with view existence check preventing 'commands' null getter crash)
    useEffect(() => {
        if (!editor || editor.isDestroyed || !editor.view) return;

        if (currentNoteIdRef.current !== noteId || isFirstRender.current) {
            currentNoteIdRef.current = noteId;
            isFirstRender.current = false;
            try {
                if (editor.commands && typeof editor.commands.setContent === 'function') {
                    editor.commands.setContent(content || '<p></p>');
                }
            } catch (err) {
                console.warn('[DocEditor] Safe setContent prevented crash:', err);
            }
            if (content) syncDatabasesFromHtml(content);
        }
    }, [noteId, editor, content]);

    // Hide raw [[DATABASE:...]] placeholder text paragraphs from view in real-time
    useEffect(() => {
        if (!editorContainerRef.current) return;
        const paragraphs = editorContainerRef.current.querySelectorAll('.tiptap p');
        paragraphs.forEach(p => {
            if (p.textContent && p.textContent.includes('[[DATABASE:')) {
                (p as HTMLElement).style.display = 'none';
            }
        });
    });

    // Handle mouse movement for left :: grip handle with safe margin
    const handleMouseMove = (e: React.MouseEvent) => {
        if (!editorContainerRef.current) return;

        const targetEl = (e.target as HTMLElement).closest('p, h1, h2, h3, li, blockquote, pre') as HTMLElement;
        if (targetEl && editorContainerRef.current.contains(targetEl)) {
            const containerRect = editorContainerRef.current.getBoundingClientRect();
            const elRect = targetEl.getBoundingClientRect();

            setGripState({
                visible: true,
                position: {
                    top: elRect.top - containerRect.top + elRect.height / 2,
                    left: 6,
                },
                targetElement: targetEl,
            });
        }
    };

    const handleMouseLeave = () => {
        setGripState(prev => ({ ...prev, visible: false }));
    };

    // Handle Canvas Context Menu (Right Click)
    const handleCanvasContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        setBlockMenuState({
            isOpen: true,
            position: { x: e.clientX, y: e.clientY },
        });
    };

    // Open block menu from :: grip handle
    const handleOpenGripMenu = (e: React.MouseEvent) => {
        e.stopPropagation();
        setBlockMenuState({
            isOpen: true,
            position: { x: e.clientX, y: e.clientY },
        });
    };

    // Add block below from + grip handle
    const handleAddBlockBelow = () => {
        if (!editor || editor.isDestroyed || !editor.view) return;
        try {
            editor.chain().focus().insertContent('<p></p>').run();
        } catch (e) { }
    };

    // Add inline database with explicit view type
    const handleAddDatabase = (viewType: 'table' | 'kanban' | 'list' = 'table') => {
        const dbId = `db-${Date.now()}`;
        setDatabaseBlocks(prev => [...prev, { id: dbId, initialViewType: viewType }]);
        if (editor && !editor.isDestroyed && editor.view) {
            try {
                editor.chain().focus().insertContent(`<p>[[DATABASE:${viewType}]]</p>`).run();
            } catch (e) { }
        }
    };

    // Drag start for :: handle
    const handleGripDragStart = (e: React.DragEvent) => {
        if (gripState.targetElement) {
            e.dataTransfer.setData('text/html', gripState.targetElement.outerHTML);
        }
    };

    // Execute Slash Command
    const handleExecuteSlashCommand = (cmd: (editor: any) => void) => {
        if (!editor || editor.isDestroyed || !editor.view) return;
        try {
            const { selection } = editor.state;
            if (selection) {
                editor.chain().focus().deleteRange({ from: selection.from - 1, to: selection.from }).run();
            }
            cmd(editor);
        } catch (e) { }
        setSlashMenuState({ isOpen: false, position: null });
    };

    // Turn into handler for Block Menu
    const handleTurnIntoBlock = (type: string, props?: any) => {
        if (!editor || editor.isDestroyed || !editor.view) return;

        try {
            editor.chain().focus();

            switch (type) {
                case 'paragraph':
                    editor.chain().focus().setNode('paragraph').run();
                    break;
                case 'heading':
                    const level = props?.level || 1;
                    editor.chain().focus().setNode('heading', { level }).run();
                    break;
                case 'checkListItem':
                    editor.chain().focus().toggleTaskList().run();
                    break;
                case 'toggleListItem':
                    editor.chain().focus().toggleBulletList().run();
                    break;
                case 'codeBlock':
                    editor.chain().focus().toggleCodeBlock().run();
                    break;
                case 'quote':
                case 'callout':
                    editor.chain().focus().toggleBlockquote().run();
                    break;
                case 'database-table':
                    handleAddDatabase('table');
                    break;
                case 'database-kanban':
                    handleAddDatabase('kanban');
                    break;
                case 'database-list':
                    handleAddDatabase('list');
                    break;
                default:
                    if (type.endsWith('columns')) {
                        const count = parseInt(type.charAt(0), 10) || 2;
                        let colsHtml = `<div style="display: grid; grid-template-columns: repeat(${count}, 1fr); gap: 16px; margin: 12px 0;">`;
                        for (let i = 0; i < count; i++) {
                            colsHtml += `<div style="padding: 12px; border: 1px dashed rgba(255,255,255,0.1); border-radius: 8px;"><p>Coluna ${i + 1}</p></div>`;
                        }
                        colsHtml += `</div>`;
                        editor.chain().focus().insertContent(colsHtml).run();
                    }
                    break;
            }
        } catch (e) { }

        setBlockMenuState({ isOpen: false, position: null });
    };

    const handleSetBlockColor = (textColor?: string, backgroundColor?: string) => {
        if (!editor || editor.isDestroyed || !editor.view) return;
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const span = document.createElement('span');
            if (textColor && textColor !== 'default') span.style.color = textColor;
            if (backgroundColor && backgroundColor !== 'default') span.style.backgroundColor = backgroundColor;
            try {
                range.surroundContents(span);
            } catch (e) {
                console.warn('Selection color wrap error:', e);
            }
        }
        setBlockMenuState({ isOpen: false, position: null });
    };

    const handleDuplicateBlock = () => {
        if (!editor || editor.isDestroyed || !editor.view) return;
        try {
            const currentHtml = editor.getHTML();
            editor.chain().focus().insertContent(currentHtml).run();
        } catch (e) { }
        setBlockMenuState({ isOpen: false, position: null });
    };

    const handleCopyBlockLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setBlockMenuState({ isOpen: false, position: null });
    };

    const handleDeleteBlock = () => {
        if (!editor || editor.isDestroyed || !editor.view) return;
        try {
            editor.chain().focus().clearNodes().run();
        } catch (e) { }
        setBlockMenuState({ isOpen: false, position: null });
    };

    // Calculate document statistics
    const stats = useMemo(() => {
        const text = content ? content.replace(/<[^>]*>/g, ' ').replace(/[#*`~]/g, '') : '';
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        const chars = text.length;
        const readTimeMinutes = Math.max(1, Math.ceil(words / 200));
        return { words, chars, readTimeMinutes };
    }, [content]);

    const handleApplyTemplate = (templateContent: string, templateIcon: string, templateTitle: string) => {
        onTitleChange(templateTitle);
        if (onIconChange) onIconChange(templateIcon);
        if (editor && !editor.isDestroyed && editor.view) {
            try {
                if (editor.commands && typeof editor.commands.setContent === 'function') {
                    editor.commands.setContent(templateContent);
                    syncDatabasesFromHtml(templateContent);
                }
            } catch (e) { }
        }
    };

    return (
        <div className="appflowy-editor-wrapper flex-1 flex flex-col h-full bg-[#0b0c10] text-zinc-100 overflow-y-auto scrollbar-thin font-sans relative">
            {/* Optional Cover Banner Header */}
            {coverImage ? (
                <div className="relative h-56 w-full group overflow-hidden bg-gradient-to-r from-amber-900/40 via-purple-900/40 to-indigo-900/40">
                    <img src={coverImage} alt="Cover" className="w-full h-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute top-4 right-6 flex items-center gap-2">
                        <button
                            onClick={() => setShowCoverModal(true)}
                            className="bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs hover:bg-black text-zinc-200 border border-white/10 transition-all shadow-md cursor-pointer"
                        >
                            Alterar Capa
                        </button>
                        <button
                            onClick={() => setCoverImage(null)}
                            className="bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs hover:bg-red-500/80 text-zinc-200 border border-white/10 transition-all shadow-md cursor-pointer"
                        >
                            Remover Capa
                        </button>
                    </div>
                </div>
            ) : null}

            {/* Document Header Container */}
            <div className="max-w-4xl w-full mx-auto px-8 pt-8 pb-4">
                {/* Stats & Actions Header Bar */}
                <div className="flex items-center justify-between mb-4 text-xs text-zinc-500">
                    <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-amber-400" />
                            {updatedAt ? `Atualizado ${new Date(updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Rascunho'}
                        </span>
                        <span>•</span>
                        <span>{stats.words} palavras</span>
                        <span>•</span>
                        <span>{stats.readTimeMinutes} min de leitura</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handleAddDatabase('table')}
                            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-all font-semibold cursor-pointer"
                        >
                            <TableIcon className="w-3.5 h-3.5" />
                            <span>+ Base de Dados</span>
                        </button>

                        {!coverImage && (
                            <button
                                onClick={() => setShowCoverModal(true)}
                                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-zinc-200 border border-white/5 transition-colors cursor-pointer"
                            >
                                <ImageIcon className="w-3.5 h-3.5" />
                                <span>Adicionar Capa</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* AppFlowy Icon & Emoji Picker */}
                <div className="relative mb-3 flex items-center gap-3">
                    <button
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className="text-5xl p-2 rounded-2xl hover:bg-white/5 transition-all active:scale-95 flex items-center justify-center cursor-pointer border border-transparent hover:border-white/10"
                        title="Alterar Ícone da Página"
                    >
                        {icon}
                    </button>

                    {showEmojiPicker && (
                        <div className="absolute z-30 top-16 left-0 p-3 bg-[#18181b] border border-white/10 rounded-2xl shadow-2xl flex flex-wrap gap-2 max-w-xs animate-in fade-in zoom-in-95">
                            {EMOJI_LIST.map(e => (
                                <button
                                    key={e}
                                    onClick={() => {
                                        if (onIconChange) onIconChange(e);
                                        setShowEmojiPicker(false);
                                    }}
                                    className="text-2xl p-2 hover:bg-white/10 rounded-xl transition-transform hover:scale-110 cursor-pointer"
                                >
                                    {e}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Page Title Input */}
                <input
                    type="text"
                    value={title}
                    onChange={(e) => onTitleChange(e.target.value)}
                    placeholder="Sem título"
                    className="w-full bg-transparent text-4xl font-black tracking-tight text-white placeholder-zinc-700 focus:outline-none mb-4 font-sans border-none"
                />

                {/* Page Metadata Properties Bar */}
                <div className="flex items-center gap-6 py-2.5 px-4 bg-white/[0.02] border border-white/5 rounded-xl text-xs text-zinc-400 mb-6">
                    <div className="flex items-center gap-2">
                        <Tag className="w-3.5 h-3.5 text-zinc-500" />
                        <span>Status:</span>
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-semibold text-[11px] border border-amber-500/30">
                            Em edição
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                        <span>Criado:</span>
                        <span className="text-zinc-300 font-mono text-[11px]">
                            {updatedAt ? new Date(updatedAt).toLocaleDateString('pt-BR') : 'Hoje'}
                        </span>
                    </div>
                </div>

                {/* Starter Templates Bar if empty */}
                {(!content || content.trim() === '' || content === '<p></p>') && (
                    <div className="mb-6 p-4 border border-dashed border-amber-500/30 rounded-2xl bg-amber-500/[0.02]">
                        <div className="flex items-center gap-2 mb-3 text-xs font-bold text-amber-400">
                            <Sparkles className="w-4 h-4" />
                            <span>Iniciar com um modelo rápido (AppFlowy):</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {STARTER_TEMPLATES.map((tmpl, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleApplyTemplate(tmpl.content, tmpl.icon, tmpl.title)}
                                    className="p-3 bg-white/[0.03] hover:bg-amber-500/10 border border-white/10 hover:border-amber-500/40 rounded-xl text-left transition-all group cursor-pointer"
                                >
                                    <div className="text-base mb-1">{tmpl.icon}</div>
                                    <div className="text-xs font-bold text-zinc-200 group-hover:text-amber-300 truncate">
                                        {tmpl.title}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="h-px bg-white/[0.06] w-full my-2" />
            </div>

            {/* AppFlowy Floating Selection Formatting Toolbar ("Ver ao selecionar o texto") */}
            {bubbleState.isOpen && bubbleState.position && editor && (
                <div
                    style={{ top: `${bubbleState.position.y}px`, left: `${bubbleState.position.x}px` }}
                    className="fixed z-50 animate-in fade-in zoom-in-95 duration-100"
                >
                    <BubbleMenuToolbar 
                        editor={editor} 
                        onOpenColorMenu={(e) => {
                            setBlockMenuState({ isOpen: true, position: { x: e.clientX, y: e.clientY } });
                        }}
                    />
                </div>
            )}

            {/* AppFlowy Tiptap Canvas with Left Margin Grip Handle :: */}
            <div
                ref={editorContainerRef}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                onContextMenu={handleCanvasContextMenu}
                className="max-w-4xl w-full mx-auto px-10 pb-32 flex-1 cursor-text relative"
            >
                {/* Hover Drag Handle :: and + button */}
                <NotionBlockGrip
                    visible={gripState.visible}
                    position={gripState.position}
                    onAddBlockBelow={handleAddBlockBelow}
                    onOpenBlockMenu={handleOpenGripMenu}
                    onDragStart={handleGripDragStart}
                />

                <EditorContent editor={editor} className="tiptap min-h-[40px]" />

                {/* Embedded Notion Databases with explicit initial view type */}
                {databaseBlocks.map((dbItem) => (
                    <NotionDatabase
                        key={dbItem.id}
                        id={dbItem.id}
                        initialViewType={dbItem.initialViewType}
                        onDelete={() => {
                            setDatabaseBlocks(prev => prev.filter(item => item.id !== dbItem.id));
                            if (editor && !editor.isDestroyed && editor.view) {
                                try {
                                    const html = editor.getHTML();
                                    const cleaned = html.replace(/<p>[^<]*\[\[DATABASE:[^\]]+\]\][^<]*<\/p>/gi, '');
                                    if (editor.commands && typeof editor.commands.setContent === 'function') {
                                        editor.commands.setContent(cleaned || '<p></p>');
                                    }
                                } catch (e) { }
                            }
                        }}
                        onAddTextAbove={() => {
                            if (editor && !editor.isDestroyed && editor.view) {
                                try {
                                    editor.chain().focus().insertContent('<p></p>').run();
                                } catch (e) { }
                            }
                        }}
                        onAddTextBelow={() => {
                            if (editor && !editor.isDestroyed && editor.view) {
                                try {
                                    editor.chain().focus().insertContent('<p></p>').run();
                                } catch (e) { }
                            }
                        }}
                    />
                ))}
            </div>

            {/* AppFlowy Slash Command Menu */}
            <SlashMenu
                isOpen={slashMenuState.isOpen}
                position={slashMenuState.position}
                onClose={() => setSlashMenuState({ isOpen: false, position: null })}
                onSelectCommand={handleExecuteSlashCommand}
            />

            {/* Notion / AppFlowy Block Context Menu Modal (Turn into, Cores, Duplicar, Excluir) */}
            <NotionBlockMenu
                isOpen={blockMenuState.isOpen}
                position={blockMenuState.position}
                onClose={() => setBlockMenuState({ isOpen: false, position: null })}
                onTurnInto={handleTurnIntoBlock}
                onSetColor={handleSetBlockColor}
                onDuplicate={handleDuplicateBlock}
                onCopyLink={handleCopyBlockLink}
                onDelete={handleDeleteBlock}
                authorName="Julio Cesar"
                lastEditedTime={updatedAt ? `Hoje às ${new Date(updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Hoje às 20:56'}
            />

            {/* Cover Selector Modal */}
            {showCoverModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md animate-in fade-in duration-150">
                    <div className="w-full max-w-lg bg-[#18181b] border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col gap-4 animate-in zoom-in-95">
                        <div className="flex items-center justify-between border-b border-white/10 pb-3">
                            <div className="flex items-center gap-2 font-bold text-sm text-zinc-200">
                                <ImageIcon className="w-4 h-4 text-amber-400" />
                                <span>Galeria de Capas</span>
                            </div>
                            <button onClick={() => setShowCoverModal(false)} className="text-zinc-400 hover:text-zinc-200 cursor-pointer">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
                            {PRESET_COVERS.map((url, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => {
                                        setCoverImage(url);
                                        setShowCoverModal(false);
                                    }}
                                    className="relative h-24 rounded-xl overflow-hidden cursor-pointer group border border-white/10 hover:border-amber-400 transition-all"
                                >
                                    <img src={url} alt={`Cover ${idx}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
