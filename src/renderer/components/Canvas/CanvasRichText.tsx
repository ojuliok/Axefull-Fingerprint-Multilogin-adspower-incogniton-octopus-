import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
    CanvasInfo, updateCanvasInfo, getCanvasList, 
    createCanvas, softDeleteCanvas
} from './canvasStorage';
import { 
    FileText, CheckSquare, List, Quote, AlertCircle, Code, 
    Image, Database, Plus, GripVertical, ExternalLink, Trash2, 
    Heading, ChevronDown, Link2, X, Copy, LayoutDashboard, Upload
} from 'lucide-react';
import styles from './CanvasRichText.module.css';

interface Block {
    id: string;
    type: 'text' | 'h1' | 'h2' | 'h3' | 'todo' | 'bullet' | 'quote' | 'callout' | 'code' | 'image' | 'database' | 'page' | 'canvas';
    content: string;
    checked?: boolean;
    meta?: any;
}

interface CanvasRichTextProps {
    canvasInfo: CanvasInfo;
    onUpdate: () => void;
    onSelectCanvas?: (id: string) => void;
}

type BlockTypeItem = {
    type: string;
    label: string;
    desc: string;
    icon: any;
    color?: string;
    bgColor?: string;
};

const BLOCK_TYPES: readonly BlockTypeItem[] = [
    { type: 'text', label: 'Texto', desc: 'Comece a digitar texto simples', icon: FileText },
    { type: 'h1', label: 'Título 1', desc: 'Título de seção grande', icon: Heading },
    { type: 'h2', label: 'Título 2', desc: 'Título de seção médio', icon: Heading },
    { type: 'h3', label: 'Título 3', desc: 'Título de seção pequeno', icon: Heading },
    { type: 'todo', label: 'Lista de tarefas', desc: 'Lista com caixas de seleção', icon: CheckSquare },
    { type: 'bullet', label: 'Lista com marcadores', desc: 'Lista com marcadores simples', icon: List },
    { type: 'quote', label: 'Citação', desc: 'Inserir uma citação em destaque', icon: Quote, color: '#c4b5fd', bgColor: 'rgba(139, 92, 246, 0.2)' },
    { type: 'callout', label: 'Destaque', desc: 'Texto em destaque com emoji', icon: AlertCircle },
    { type: 'code', label: 'Código', desc: 'Bloco de código formatado', icon: Code },
    { type: 'image', label: 'Imagem', desc: 'Adicionar uma imagem via link', icon: Image },
    { type: 'database', label: 'Banco de Dados (Tabela)', desc: 'Relacionar/exibir uma Tabela', icon: Database, color: '#c4b5fd', bgColor: 'rgba(139, 92, 246, 0.2)' },
    { type: 'page', label: 'Sub-página', desc: 'Relacionar/abrir uma Página', icon: FileText },
    { type: 'canvas', label: 'Quadro', desc: 'Relacionar/abrir um Quadro', icon: LayoutDashboard },
];

const COMMAND_GROUPS = [
    { title: 'Básico', items: ['text', 'h1', 'h2', 'h3', 'todo', 'bullet'] },
    { title: 'Destaque e Formatação', items: ['quote', 'callout', 'code'] },
    { title: 'Mídia e Conexões', items: ['image', 'database', 'page', 'canvas'] }
];

const ContentEditableBlock: React.FC<{
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    className?: string;
    onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
    blockIndex: number;
    style?: React.CSSProperties;
}> = ({ value, onChange, placeholder, className, onKeyDown, blockIndex, style }) => {
    const ref = useRef<HTMLDivElement>(null);

    // Keep text content in sync with value when block/value changes externally
    useEffect(() => {
        const el = ref.current;
        if (el && el.innerText !== value) {
            el.innerText = value;
        }
    }, [value, blockIndex]);

    const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
        onChange(e.currentTarget.innerText);
    };

    return (
        <div
            ref={ref}
            contentEditable={true}
            suppressContentEditableWarning={true}
            onInput={handleInput}
            onKeyDown={onKeyDown}
            className={`${styles.blockEditable} ${className || ''}`}
            data-block-index={blockIndex}
            data-empty={value === ''}
            placeholder={placeholder}
            style={{ 
                outline: 'none !important', 
                border: 'none !important', 
                boxShadow: 'none !important',
                background: 'transparent',
                width: '100%',
                minHeight: '1.6em',
                wordBreak: 'break-word',
                ...style 
            }}
        />
    );
};

const RelationSelector: React.FC<{
    typeLabel: string;
    items: CanvasInfo[];
    onCreateNew: () => void;
    onSelect: (id: string) => void;
}> = ({ typeLabel, items, onCreateNew, onSelect }) => {
    const [search, setSearch] = useState('');
    const filtered = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className={styles.relationSelectorWrapper}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#a1a1aa', marginBottom: 8 }}>Vincular {typeLabel}</div>
            <input 
                type="text"
                placeholder={`Buscar ${typeLabel.toLowerCase()}...`}
                className={styles.imageInput}
                style={{ width: '100%', marginBottom: 8 }}
                value={search}
                onChange={e => setSearch(e.target.value)}
            />
            <div className={styles.relationList}>
                <button className={styles.relationListItemCreate} onClick={onCreateNew}>
                    <Plus size={14} style={{ marginRight: 6 }} /> Criar Novo(a) {typeLabel}
                </button>
                {filtered.map(item => (
                    <button key={item.id} className={styles.relationListItem} onClick={() => onSelect(item.id)}>
                        {item.name}
                    </button>
                ))}
                {filtered.length === 0 && (
                    <div style={{ padding: '8px 12px', fontSize: 12, color: '#71717a' }}>Nenhum encontrado.</div>
                )}
            </div>
        </div>
    );
};

const CanvasRichText: React.FC<CanvasRichTextProps> = ({ canvasInfo, onUpdate, onSelectCanvas }) => {
    const [title, setTitle] = useState(canvasInfo.name);
    
    const initBlocks = () => {
        let initialBlocks: Block[] = [];
        try {
            if (canvasInfo.notes && canvasInfo.notes.trim().startsWith('[')) {
                initialBlocks = JSON.parse(canvasInfo.notes);
            } else {
                initialBlocks = [{
                    id: 'block-init',
                    type: 'text',
                    content: canvasInfo.notes || ''
                }];
            }
        } catch {
            initialBlocks = [{
                id: 'block-init',
                type: 'text',
                content: canvasInfo.notes || ''
            }];
        }
        if (initialBlocks.length === 0) {
            initialBlocks = [{ id: 'block-init', type: 'text', content: '' }];
        }
        return initialBlocks;
    };

    const [blocks, setBlocks] = useState<Block[]>(initBlocks);
    
    // Block interaction states
    const [hoveredBlockIndex, setHoveredBlockIndex] = useState<number | null>(null);
    const [draggedBlockIndex, setDraggedBlockIndex] = useState<number | null>(null);
    
    // Command slash menu states
    const [commandBlockIndex, setCommandBlockIndex] = useState<number | null>(null);
    const [commandQuery, setCommandQuery] = useState('');

    const [showCoverMenu, setShowCoverMenu] = useState(false);
    const [coverLinkUrl, setCoverLinkUrl] = useState('');
    const coverFileInputRef = useRef<HTMLInputElement>(null);

    const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const base64 = event.target?.result as string;
            updateCanvasInfo(canvasInfo.id, { coverImage: base64 });
            onUpdate();
            setShowCoverMenu(false);
        };
        reader.readAsDataURL(file);
    };

    const handleCoverLinkSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (coverLinkUrl.trim()) {
            updateCanvasInfo(canvasInfo.id, { coverImage: coverLinkUrl.trim() });
            onUpdate();
            setShowCoverMenu(false);
            setCoverLinkUrl('');
        }
    };

    const handleRemoveCover = () => {
        updateCanvasInfo(canvasInfo.id, { coverImage: undefined });
        onUpdate();
    };

    const [activeCommandMenuIndex, setActiveCommandMenuIndex] = useState(0);
    const [blockMenuIndex, setBlockMenuIndex] = useState<number | null>(null);

    // Save timeout ref
    const saveTimeout = useRef<NodeJS.Timeout | null>(null);

    // Refs for menus to calculate dynamic position
    const commandMenuRef = useRef<HTMLDivElement>(null);
    const blockOptionsMenuRef = useRef<HTMLDivElement>(null);

    const adjustMenuPosition = (menuEl: HTMLDivElement | null) => {
        if (!menuEl) return;
        
        let anchorEl = null;
        if (commandBlockIndex !== null) {
             anchorEl = document.querySelector(`[data-block-index="${commandBlockIndex}"]`);
        } else if (blockMenuIndex !== null) {
             anchorEl = document.querySelector(`[data-block-index="${blockMenuIndex}"]`);
        }
        
        if (!anchorEl) return;
        
        if (window.innerWidth > 768) {
            const rect = anchorEl.getBoundingClientRect();
            menuEl.style.position = 'fixed';
            menuEl.style.top = `${rect.bottom + 4}px`;
            menuEl.style.left = `${rect.left + 24}px`;
            menuEl.style.bottom = 'auto';
            menuEl.style.transform = 'none';
            
            const windowHeight = window.innerHeight;
            const menuHeight = menuEl.offsetHeight || 320;
            
            if (rect.bottom + menuHeight > windowHeight - 20) {
                // Open upwards
                menuEl.style.top = 'auto';
                menuEl.style.bottom = `${windowHeight - rect.top + 8}px`;
            }
        } else {
            // Mobile handled by CSS
            menuEl.style.position = '';
            menuEl.style.top = '';
            menuEl.style.bottom = '';
            menuEl.style.left = '';
            menuEl.style.transform = '';
        }
    };

    // Auto-scroll slash command menu and adjust position
    useEffect(() => {
        if (commandBlockIndex !== null) {
            const activeEl = document.getElementById(`cmd-item-${activeCommandMenuIndex}`);
            if (activeEl) {
                activeEl.scrollIntoView({ block: 'nearest' });
            }
            setTimeout(() => adjustMenuPosition(commandMenuRef.current), 0);
        }
    }, [activeCommandMenuIndex, commandBlockIndex, commandQuery]);

    // Adjust block options menu position
    useEffect(() => {
        if (blockMenuIndex !== null) {
            setTimeout(() => adjustMenuPosition(blockOptionsMenuRef.current), 0);
        }
    }, [blockMenuIndex]);

    // Close menus when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent | TouchEvent) => {
            const target = e.target as Node;
            
            // Check command menu
            if (commandBlockIndex !== null && commandMenuRef.current && !commandMenuRef.current.contains(target)) {
                setCommandBlockIndex(null);
            }
            
            // Check block options menu
            if (blockMenuIndex !== null && blockOptionsMenuRef.current && !blockOptionsMenuRef.current.contains(target)) {
                setBlockMenuIndex(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
        
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [commandBlockIndex, blockMenuIndex]);

    // Parse block notes on mount or canvas id change
    useEffect(() => {
        setTitle(canvasInfo.name);
        setBlocks(initBlocks());
    }, [canvasInfo.id]);

    const triggerSave = (t: string, updatedBlocks: Block[]) => {
        if (saveTimeout.current) clearTimeout(saveTimeout.current);
        saveTimeout.current = setTimeout(() => {
            updateCanvasInfo(canvasInfo.id, { 
                name: t, 
                notes: JSON.stringify(updatedBlocks) 
            });
            onUpdate();
        }, 500);
    };

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTitle = e.target.value;
        setTitle(newTitle);
        triggerSave(newTitle, blocks);
    };

    const handleBlockContentChange = (content: string, index: number) => {
        const newBlocks = [...blocks];
        newBlocks[index].content = content;
        setBlocks(newBlocks);
        triggerSave(title, newBlocks);

        // Check slash command query
        const lastSlashIndex = content.lastIndexOf('/');
        if (lastSlashIndex !== -1 && lastSlashIndex === content.length - 1) {
            setCommandBlockIndex(index);
            setCommandQuery('');
            setActiveCommandMenuIndex(0);
        } else if (commandBlockIndex === index) {
            if (lastSlashIndex === -1) {
                setCommandBlockIndex(null);
            } else {
                const query = content.substring(lastSlashIndex + 1);
                setCommandQuery(query.toLowerCase());
                setActiveCommandMenuIndex(0);
            }
        }
    };

    const executeCommand = (index: number, type: Block['type']) => {
        const newBlocks = [...blocks];
        // Clean slash command symbol
        const currentContent = newBlocks[index].content;
        const lastSlashIndex = currentContent.lastIndexOf('/');
        if (lastSlashIndex !== -1) {
            newBlocks[index].content = currentContent.substring(0, lastSlashIndex);
        }
        newBlocks[index].type = type;
        
        // Setup initial metadata
        if (type === 'todo') {
            newBlocks[index].checked = false;
        } else if (type === 'callout') {
            newBlocks[index].meta = { emoji: '💡' };
        } else if (type === 'database') {
            newBlocks[index].meta = { tableId: '' };
        } else if (type === 'page') {
            newBlocks[index].meta = { pageId: '' };
        } else if (type === 'canvas') {
            newBlocks[index].meta = { canvasId: '' };
        } else if (type === 'image') {
            newBlocks[index].meta = { url: '' };
        }

        setBlocks(newBlocks);
        triggerSave(title, newBlocks);
        setCommandBlockIndex(null);

        setTimeout(() => {
            focusBlock(index);
        }, 50);
    };

    const focusBlock = (index: number) => {
        const element = document.querySelector(`[data-block-index="${index}"]`) as HTMLDivElement;
        if (element) {
            element.focus();
            
            // Move caret/cursor to the end of the contentEditable div
            const range = document.createRange();
            const selection = window.getSelection();
            range.selectNodeContents(element);
            range.collapse(false); // collapse to end
            if (selection) {
                selection.removeAllRanges();
                selection.addRange(range);
            }
        }
    };

    const deleteBlock = (index: number) => {
        const block = blocks[index];
        if (block.meta) {
            const relationId = block.meta.pageId || block.meta.tableId || block.meta.canvasId;
            if (relationId) {
                const entity = getCanvasList().find(c => c.id === relationId);
                if (entity && entity.parentId === canvasInfo.id) {
                    softDeleteCanvas(relationId);
                    onUpdate(); // Trigger parent update to refresh sidebar
                }
            }
        }
        
        const newBlocks = [...blocks];
        newBlocks.splice(index, 1);
        if (newBlocks.length === 0) {
            newBlocks.push({ id: `block-${Date.now()}`, type: 'text', content: '' });
        }
        setBlocks(newBlocks);
        triggerSave(title, newBlocks);
        if (commandBlockIndex === index) setCommandBlockIndex(null);
        if (blockMenuIndex === index) setBlockMenuIndex(null);
    };

    const handleBlockKeyDown = (e: React.KeyboardEvent<HTMLDivElement>, index: number) => {
        const filtered = getFilteredCommands();

        // If slash command menu is open
        if (commandBlockIndex === index && filtered.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveCommandMenuIndex((prev) => (prev + 1) % filtered.length);
                return;
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveCommandMenuIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
                return;
            } else if (e.key === 'Enter') {
                e.preventDefault();
                executeCommand(index, filtered[activeCommandMenuIndex].type);
                return;
            } else if (e.key === 'Escape') {
                e.preventDefault();
                setCommandBlockIndex(null);
                return;
            }
        }

        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const newBlocks = [...blocks];
            const newBlock: Block = {
                id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                type: 'text',
                content: ''
            };
            newBlocks.splice(index + 1, 0, newBlock);
            setBlocks(newBlocks);
            triggerSave(title, newBlocks);

            setTimeout(() => {
                focusBlock(index + 1);
            }, 50);
        } else if (e.key === 'Backspace' && blocks[index].content === '') {
            e.preventDefault();
            if (blocks.length > 1) {
                deleteBlock(index);
                const nextFocus = index > 0 ? index - 1 : 0;
                setTimeout(() => {
                    focusBlock(nextFocus);
                }, 0);
            } else {
                if (blocks[index].type !== 'text') {
                    const newBlocks = [...blocks];
                    newBlocks[index].type = 'text';
                    newBlocks[index].meta = undefined;
                    setBlocks(newBlocks);
                    triggerSave(title, newBlocks);
                }
            }
        } else if (e.key === 'ArrowUp') {
            if (index > 0) {
                e.preventDefault();
                focusBlock(index - 1);
            }
        } else if (e.key === 'ArrowDown') {
            if (index < blocks.length - 1) {
                e.preventDefault();
                focusBlock(index + 1);
            }
        }
    };

    const getFilteredCommands = () => {
        return BLOCK_TYPES.filter(cmd => 
            cmd.label.toLowerCase().includes(commandQuery) || 
            cmd.desc.toLowerCase().includes(commandQuery) ||
            cmd.type.toLowerCase().includes(commandQuery)
        );
    };

    // HTML5 Drag and Drop Reordering
    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedBlockIndex(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedBlockIndex === null || draggedBlockIndex === index) return;

        const updated = [...blocks];
        const [movedBlock] = updated.splice(draggedBlockIndex, 1);
        updated.splice(index, 0, movedBlock);
        
        setBlocks(updated);
        triggerSave(title, updated);
        setDraggedBlockIndex(null);
    };

    // Render helpers for blocks
    const getBlockPlaceholder = (type: Block['type']) => {
        if (type === 'h1') return 'Título 1';
        if (type === 'h2') return 'Título 2';
        if (type === 'h3') return 'Título 3';
        if (type === 'quote') return 'Citação...';
        if (type === 'callout') return 'Texto em destaque...';
        if (type === 'code') return 'Escreva o código aqui...';
        return "Digite '/' para ver os comandos...";
    };

    const getBlockClass = (type: Block['type']) => {
        if (type === 'h1') return styles.blockH1;
        if (type === 'h2') return styles.blockH2;
        if (type === 'h3') return styles.blockH3;
        if (type === 'code') return styles.blockCode;
        return '';
    };

    return (
        <div className={styles.editorContainer}>
            <div className={styles.editorContentWrapper}>
                {/* Cover Image Section */}
                {canvasInfo.coverImage ? (
                    <div className={styles.coverImageContainer}>
                        <img src={canvasInfo.coverImage} className={styles.coverImage} alt="Cover" />
                        <div className={styles.coverImageActions}>
                            <button onClick={() => setShowCoverMenu(!showCoverMenu)} className={styles.coverActionBtn}>
                                <Image size={14} /> Alterar Capa
                            </button>
                            <button onClick={handleRemoveCover} className={styles.coverActionBtn}>
                                <Trash2 size={14} /> Remover
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className={styles.addCoverWrapper}>
                        <button className={styles.addCoverBtn} onClick={() => setShowCoverMenu(!showCoverMenu)}>
                            <Image size={14} /> Adicionar Capa
                        </button>
                    </div>
                )}

                {showCoverMenu && (
                    <div className={styles.coverMenuPopover}>
                        <div className={styles.coverMenuHeader}>
                            Adicionar capa
                            <button onClick={() => setShowCoverMenu(false)}><X size={14} /></button>
                        </div>
                        <div className={styles.coverMenuBody}>
                            <button 
                                className={styles.coverMenuOption}
                                onClick={() => coverFileInputRef.current?.click()}
                            >
                                <Upload size={14} /> Fazer upload de arquivo
                            </button>
                            <div className={styles.coverMenuDivider} />
                            <form onSubmit={handleCoverLinkSubmit} className={styles.coverLinkForm}>
                                <input 
                                    type="url" 
                                    value={coverLinkUrl}
                                    onChange={(e) => setCoverLinkUrl(e.target.value)}
                                    placeholder="Colar link da imagem..."
                                    className={styles.coverLinkInput}
                                    autoFocus
                                />
                                <button type="submit" className={styles.coverLinkSubmit}>Inserir</button>
                            </form>
                        </div>
                        <input 
                            type="file" 
                            ref={coverFileInputRef} 
                            style={{ display: 'none' }} 
                            accept="image/*"
                            onChange={handleCoverFileChange}
                        />
                    </div>
                )}

                <input
                    type="text"
                    value={title}
                    onChange={handleTitleChange}
                    placeholder="Sem título"
                    className={styles.titleInput}
                />

                {blocks.map((block, idx) => {
                    const blockClass = getBlockClass(block.type);
                    const placeholder = getBlockPlaceholder(block.type);

                    return (
                        <div 
                            key={block.id}
                            className={styles.blockRow}
                            onMouseEnter={() => setHoveredBlockIndex(idx)}
                            onMouseLeave={() => setHoveredBlockIndex(null)}
                            onDragOver={(e) => handleDragOver(e, idx)}
                            onDrop={(e) => handleDrop(e, idx)}
                        >
                            <div className={styles.blockGutter}>
                                <button 
                                    className={styles.plusBtn}
                                    onClick={() => {
                                        setCommandBlockIndex(idx);
                                        setCommandQuery('');
                                        setActiveCommandMenuIndex(0);
                                    }}
                                >
                                    <Plus size={12} />
                                </button>
                                <div 
                                    className={styles.dragHandle}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, idx)}
                                    onClick={() => setBlockMenuIndex(blockMenuIndex === idx ? null : idx)}
                                >
                                    <GripVertical size={12} />
                                </div>
                            </div>

                            <div className={styles.blockContent}>
                                {block.type === 'bullet' && (
                                    <div className={styles.bulletItem}>
                                        <div className={styles.bulletDot} />
                                        <ContentEditableBlock
                                            value={block.content}
                                            onChange={(val) => handleBlockContentChange(val, idx)}
                                            placeholder={placeholder}
                                            className={blockClass}
                                            blockIndex={idx}
                                            onKeyDown={(e) => handleBlockKeyDown(e, idx)}
                                        />
                                    </div>
                                )}

                                {block.type === 'todo' && (
                                    <div className={styles.todoItem}>
                                        <div 
                                            className={`${styles.todoCheckbox} ${block.checked ? styles.todoCheckboxChecked : ''}`}
                                            onClick={() => {
                                                const updated = [...blocks];
                                                updated[idx].checked = !updated[idx].checked;
                                                setBlocks(updated);
                                                triggerSave(title, updated);
                                            }}
                                        >
                                            {block.checked && <CheckSquare size={12} strokeWidth={3} />}
                                        </div>
                                        <ContentEditableBlock
                                            value={block.content}
                                            onChange={(val) => handleBlockContentChange(val, idx)}
                                            placeholder={placeholder}
                                            className={blockClass}
                                            blockIndex={idx}
                                            onKeyDown={(e) => handleBlockKeyDown(e, idx)}
                                            style={{ textDecoration: block.checked ? 'line-through' : 'none', opacity: block.checked ? 0.6 : 1 }}
                                        />
                                    </div>
                                )}

                                {block.type === 'quote' && (
                                    <div className={styles.quoteItem}>
                                        <ContentEditableBlock
                                            value={block.content}
                                            onChange={(val) => handleBlockContentChange(val, idx)}
                                            placeholder={placeholder}
                                            className={blockClass}
                                            blockIndex={idx}
                                            onKeyDown={(e) => handleBlockKeyDown(e, idx)}
                                        />
                                    </div>
                                )}

                                {block.type === 'callout' && (
                                    <div className={styles.calloutItem}>
                                        <span 
                                            className={styles.calloutEmoji}
                                            onClick={() => {
                                                const newEmoji = prompt('Digite um emoji para o destaque:', block.meta?.emoji || '💡');
                                                if (newEmoji) {
                                                    const updated = [...blocks];
                                                    updated[idx].meta = { ...updated[idx].meta, emoji: newEmoji };
                                                    setBlocks(updated);
                                                    triggerSave(title, updated);
                                                }
                                            }}
                                        >
                                            {block.meta?.emoji || '💡'}
                                        </span>
                                        <ContentEditableBlock
                                            value={block.content}
                                            onChange={(val) => handleBlockContentChange(val, idx)}
                                            placeholder={placeholder}
                                            className={blockClass}
                                            blockIndex={idx}
                                            onKeyDown={(e) => handleBlockKeyDown(e, idx)}
                                        />
                                    </div>
                                )}

                                {block.type === 'code' && (
                                    <ContentEditableBlock
                                        value={block.content}
                                        onChange={(val) => handleBlockContentChange(val, idx)}
                                        placeholder={placeholder}
                                        className={`${blockClass} ${styles.codeItem}`}
                                        blockIndex={idx}
                                        onKeyDown={(e) => handleBlockKeyDown(e, idx)}
                                    />
                                )}

                                {block.type === 'image' && (
                                    <div className={styles.imageCard}>
                                        {block.meta?.url ? (
                                            <>
                                                <img src={block.meta.url} alt="Imagem do bloco" className={styles.imageElement} />
                                                <div style={{ display: 'flex', justifyContent: 'flex-end', padding: 8 }}>
                                                    <button 
                                                        className={styles.plusBtn}
                                                        onClick={() => {
                                                            const updated = [...blocks];
                                                            updated[idx].meta = { url: '' };
                                                            setBlocks(updated);
                                                            triggerSave(title, updated);
                                                        }}
                                                        title="Alterar Link"
                                                    >
                                                        <Trash2 size={13} />
                                                    </button>
                                                </div>
                                            </>
                                        ) : (
                                            <div className={styles.imageInputWrapper}>
                                                <input 
                                                    type="text"
                                                    placeholder="Cole o endereço da imagem..."
                                                    className={styles.imageInput}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            const val = (e.target as HTMLInputElement).value;
                                                            if (val) {
                                                                const updated = [...blocks];
                                                                updated[idx].meta = { url: val };
                                                                setBlocks(updated);
                                                                triggerSave(title, updated);
                                                            }
                                                        }
                                                    }}
                                                />
                                                <button 
                                                    className={styles.imageInputButton}
                                                    onClick={(e) => {
                                                        const input = (e.target as HTMLButtonElement).previousSibling as HTMLInputElement;
                                                        if (input.value) {
                                                            const updated = [...blocks];
                                                            updated[idx].meta = { url: input.value };
                                                            setBlocks(updated);
                                                            triggerSave(title, updated);
                                                        }
                                                    }}
                                                >
                                                    Inserir
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {block.type === 'database' && (
                                    <div style={{ width: '100%' }}>
                                        {block.meta?.tableId ? (
                                            (() => {
                                                const tableInfo = getCanvasList().find(c => c.id === block.meta.tableId);
                                                return (
                                                    <div 
                                                        className={styles.relationCard}
                                                        onClick={() => onSelectCanvas && onSelectCanvas(block.meta.tableId)}
                                                    >
                                                        <div className={styles.relationIcon}>
                                                            <Database size={16} />
                                                        </div>
                                                        <div className={styles.relationTitle}>
                                                            {tableInfo?.name || 'Tabela Sem Nome'}
                                                        </div>
                                                        <div className={styles.relationMeta}>
                                                            <span>Abrir Tabela</span>
                                                            <ExternalLink size={12} />
                                                        </div>
                                                        <button 
                                                            className={styles.plusBtn}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const updated = [...blocks];
                                                                updated[idx].meta = { tableId: '' };
                                                                setBlocks(updated);
                                                                triggerSave(title, updated);
                                                            }}
                                                        >
                                                            <X size={12} />
                                                        </button>
                                                    </div>
                                                );
                                            })()
                                        ) : (
                                            <RelationSelector
                                                typeLabel="Banco de Dados"
                                                items={getCanvasList().filter(c => c.type === 'table' && !c.isDeleted)}
                                                onCreateNew={() => {
                                                    const newTable = createCanvas("Novo Banco de Dados", canvasInfo.id, "table");
                                                    const updated = [...blocks];
                                                    updated[idx].meta = { tableId: newTable.id };
                                                    setBlocks(updated);
                                                    triggerSave(title, updated);
                                                    onUpdate();
                                                }}
                                                onSelect={(val) => {
                                                    const updated = [...blocks];
                                                    updated[idx].meta = { tableId: val };
                                                    setBlocks(updated);
                                                    triggerSave(title, updated);
                                                }}
                                            />
                                        )}
                                    </div>
                                )}

                                {block.type === 'page' && (
                                    <div style={{ width: '100%' }}>
                                        {block.meta?.pageId ? (
                                            (() => {
                                                const pageInfo = getCanvasList().find(c => c.id === block.meta.pageId);
                                                return (
                                                    <div 
                                                        className={styles.relationCard}
                                                        onClick={() => onSelectCanvas && onSelectCanvas(block.meta.pageId)}
                                                    >
                                                        <div className={styles.relationIcon}>
                                                            <FileText size={16} />
                                                        </div>
                                                        <div className={styles.relationTitle}>
                                                            {pageInfo?.name || 'Página Sem Nome'}
                                                        </div>
                                                        <div className={styles.relationMeta}>
                                                            <span>Abrir Página</span>
                                                            <ExternalLink size={12} />
                                                        </div>
                                                        <button 
                                                            className={styles.plusBtn}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const updated = [...blocks];
                                                                updated[idx].meta = { pageId: '' };
                                                                setBlocks(updated);
                                                                triggerSave(title, updated);
                                                            }}
                                                        >
                                                            <X size={12} />
                                                        </button>
                                                    </div>
                                                );
                                            })()
                                        ) : (
                                            <RelationSelector
                                                typeLabel="Página"
                                                items={getCanvasList().filter(c => c.type === 'page' && !c.isDeleted && c.id !== canvasInfo.id)}
                                                onCreateNew={() => {
                                                    const newPage = createCanvas("Nova Página", canvasInfo.id, "page");
                                                    const updated = [...blocks];
                                                    updated[idx].meta = { pageId: newPage.id };
                                                    setBlocks(updated);
                                                    triggerSave(title, updated);
                                                    onUpdate();
                                                }}
                                                onSelect={(val) => {
                                                    const updated = [...blocks];
                                                    updated[idx].meta = { pageId: val };
                                                    setBlocks(updated);
                                                    triggerSave(title, updated);
                                                }}
                                            />
                                        )}
                                    </div>
                                )}

                                {block.type === 'canvas' && (
                                    <div style={{ width: '100%' }}>
                                        {block.meta?.canvasId ? (
                                            (() => {
                                                const cInfo = getCanvasList().find(c => c.id === block.meta.canvasId);
                                                return (
                                                    <div 
                                                        className={styles.relationCard}
                                                        onClick={() => onSelectCanvas && onSelectCanvas(block.meta.canvasId)}
                                                    >
                                                        <div className={styles.relationIcon}>
                                                            <LayoutDashboard size={16} />
                                                        </div>
                                                        <div className={styles.relationTitle}>
                                                            {cInfo?.name || 'Quadro Sem Nome'}
                                                        </div>
                                                        <div className={styles.relationMeta}>
                                                            <span>Abrir Quadro</span>
                                                            <ExternalLink size={12} />
                                                        </div>
                                                        <button 
                                                            className={styles.plusBtn}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const updated = [...blocks];
                                                                updated[idx].meta = { canvasId: '' };
                                                                setBlocks(updated);
                                                                triggerSave(title, updated);
                                                            }}
                                                        >
                                                            <X size={12} />
                                                        </button>
                                                    </div>
                                                );
                                            })()
                                        ) : (
                                            <RelationSelector
                                                typeLabel="Quadro"
                                                items={getCanvasList().filter(c => c.type === 'canvas' && !c.isDeleted && c.id !== canvasInfo.id)}
                                                onCreateNew={() => {
                                                    const newCanvas = createCanvas("Novo Quadro", canvasInfo.id, "canvas");
                                                    const updated = [...blocks];
                                                    updated[idx].meta = { canvasId: newCanvas.id };
                                                    setBlocks(updated);
                                                    triggerSave(title, updated);
                                                    onUpdate();
                                                }}
                                                onSelect={(val) => {
                                                    const updated = [...blocks];
                                                    updated[idx].meta = { canvasId: val };
                                                    setBlocks(updated);
                                                    triggerSave(title, updated);
                                                }}
                                            />
                                        )}
                                    </div>
                                )}

                                {block.type !== 'bullet' && block.type !== 'todo' && block.type !== 'quote' && block.type !== 'callout' && block.type !== 'image' && block.type !== 'database' && block.type !== 'page' && block.type !== 'canvas' && (
                                    <ContentEditableBlock
                                        value={block.content}
                                        onChange={(val) => handleBlockContentChange(val, idx)}
                                        placeholder={placeholder}
                                        className={blockClass}
                                        blockIndex={idx}
                                        onKeyDown={(e) => handleBlockKeyDown(e, idx)}
                                    />
                                )}
                            </div>

                            {/* Floating Commands Menu */}
                            {commandBlockIndex === idx && createPortal(
                                <div ref={commandMenuRef} className={styles.commandMenu} style={{ zIndex: 999999, position: 'fixed' }}>
                                    {(() => {
                                        const filtered = getFilteredCommands();
                                        let globalIndex = 0;
                                        return (
                                            <>
                                                {COMMAND_GROUPS.map(group => {
                                                    const groupCommands = filtered.filter(cmd => group.items.includes(cmd.type));
                                                    if (groupCommands.length === 0) return null;
                                                    return (
                                                        <React.Fragment key={group.title}>
                                                            <div className={styles.commandMenuHeader}>{group.title}</div>
                                                            {groupCommands.map(cmd => {
                                                                const currentIndex = globalIndex++;
                                                                const Icon = cmd.icon;
                                                                return (
                                                                    <div
                                                                        key={cmd.type}
                                                                        id={`cmd-item-${currentIndex}`}
                                                                        className={`${styles.commandMenuItem} ${activeCommandMenuIndex === currentIndex ? styles.commandMenuItemActive : ''}`}
                                                                        onClick={() => executeCommand(idx, cmd.type)}
                                                                        onMouseEnter={() => setActiveCommandMenuIndex(currentIndex)}
                                                                    >
                                                                        <div className={styles.commandItemIcon} style={{ 
                                                                            color: activeCommandMenuIndex === currentIndex ? undefined : cmd.color, 
                                                                            backgroundColor: activeCommandMenuIndex === currentIndex ? undefined : cmd.bgColor 
                                                                        }}>
                                                                            <Icon size={14} />
                                                                        </div>
                                                                        <div className={styles.commandItemText}>
                                                                            <span className={styles.commandItemTitle}>{cmd.label}</span>
                                                                            <span className={styles.commandItemDesc}>{cmd.desc}</span>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </React.Fragment>
                                                    );
                                                })}
                                                {filtered.length === 0 && (
                                                    <div style={{ padding: '8px 12px', fontSize: 12, color: '#71717a' }}>Nenhum comando encontrado</div>
                                                )}
                                            </>
                                        );
                                    })()}
                                </div>,
                                document.body
                            )}

                            {/* Block Options Menu */}
                            {blockMenuIndex === idx && createPortal(
                                <div ref={blockOptionsMenuRef} className={styles.blockOptionsMenu} style={{ zIndex: 999999, position: 'fixed' }} onMouseLeave={() => setBlockMenuIndex(null)}>
                                    <div className={styles.commandMenuHeader}>Ações do Bloco</div>
                                    <div 
                                        className={styles.commandMenuItem}
                                        onClick={() => {
                                            const updated = [...blocks];
                                            const newBlock = { ...updated[idx], id: `block-${Date.now()}` };
                                            updated.splice(idx + 1, 0, newBlock);
                                            setBlocks(updated);
                                            triggerSave(title, updated);
                                            setBlockMenuIndex(null);
                                        }}
                                    >
                                        <div className={styles.commandItemIcon}><Copy size={14} /></div>
                                        <div className={styles.commandItemText}><span className={styles.commandItemTitle}>Duplicar</span></div>
                                    </div>
                                    <div 
                                        className={styles.commandMenuItem}
                                        onClick={() => deleteBlock(idx)}
                                    >
                                        <div className={styles.commandItemIcon}><Trash2 size={14} color="#ef4444" /></div>
                                        <div className={styles.commandItemText}><span className={styles.commandItemTitle} style={{ color: '#ef4444' }}>Excluir</span></div>
                                    </div>
                                    <div className={styles.blockOptionsDivider} />
                                    <div className={styles.commandMenuHeader}>Transformar em...</div>
                                    {BLOCK_TYPES.map((cmd) => {
                                        const Icon = cmd.icon;
                                        return (
                                            <div
                                                key={`transform-${cmd.type}`}
                                                className={styles.commandMenuItem}
                                                onClick={() => {
                                                    const updated = [...blocks];
                                                    updated[idx].type = cmd.type;
                                                    if (cmd.type === 'todo' && updated[idx].checked === undefined) updated[idx].checked = false;
                                                    if (cmd.type === 'callout' && !updated[idx].meta?.emoji) updated[idx].meta = { emoji: '💡' };
                                                    if (cmd.type === 'database' && !updated[idx].meta?.tableId) updated[idx].meta = { tableId: '' };
                                                    if (cmd.type === 'page' && !updated[idx].meta?.pageId) updated[idx].meta = { pageId: '' };
                                                    if (cmd.type === 'canvas' && !updated[idx].meta?.canvasId) updated[idx].meta = { canvasId: '' };
                                                    setBlocks(updated);
                                                    triggerSave(title, updated);
                                                    setBlockMenuIndex(null);
                                                }}
                                            >
                                                <div className={styles.commandItemIcon} style={{ 
                                                    color: cmd.color, 
                                                    backgroundColor: cmd.bgColor 
                                                }}>
                                                    <Icon size={14} />
                                                </div>
                                                <div className={styles.commandItemText}><span className={styles.commandItemTitle}>{cmd.label}</span></div>
                                            </div>
                                        );
                                    })}
                                </div>,
                                document.body
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default CanvasRichText;
