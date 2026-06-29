import React, { useState, useEffect, useRef } from 'react';
import { 
    Megaphone, LayoutList, KanbanSquare, Plus, Filter, Search, User, 
    MoreVertical, LayoutTemplate, FolderOpen, ChevronRight, ChevronDown, PanelLeftClose, PanelLeft,
    X, Lock, Eye
} from 'lucide-react';
import styles from './MarketingPage.module.css';
import KanbanBoard from '../features/Marketing/KanbanBoard';
import CRMList from '../features/Marketing/CRMList';
import LeadDetailModal from '../features/Marketing/LeadDetailModal';
import { CRMProvider, useCRMState } from '../features/Marketing/CRMContext';
import { MarketingSpace, MarketingFolder, MarketingBoard } from '../features/Marketing/marketingStorage';

// ==========================================
// CUSTOM POPUPS & MODALS (ClickUp Inspired)
// ==========================================

interface CreateSpaceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (title: string, description: string, color: string, isPrivate: boolean) => void;
}

const CreateSpaceModal: React.FC<CreateSpaceModalProps> = ({ isOpen, onClose, onSave }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [color, setColor] = useState('#0ea5e9');
    const [isPrivate, setIsPrivate] = useState(false);

    if (!isOpen) return null;

    const colors = [
        '#0ea5e9', // Blue
        '#8b5cf6', // Purple
        '#f59e0b', // Orange
        '#ef4444', // Red
        '#10b981', // Green
        '#ec4899', // Pink
        '#64748b', // Slate
        '#14b8a6'  // Teal
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (title.trim()) {
            onSave(title.trim(), description.trim(), color, isPrivate);
            setTitle('');
            setDescription('');
            setColor('#0ea5e9');
            setIsPrivate(false);
            onClose();
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'var(--bg-card)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, color: 'var(--text-primary)'
        }} onClick={onClose}>
            <div style={{
                background: 'var(--bg-secondary)', border: '1px solid var(--border-default)',
                borderRadius: '12px', width: '450px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)',
                display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative'
            }} onClick={(e) => e.stopPropagation()}>
                
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                            width: '28px', height: '28px', borderRadius: '6px',
                            background: color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 'bold', fontSize: '14px', color: '#fff'
                        }}>
                            {title ? title.charAt(0).toUpperCase() : 'S'}
                        </div>
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Criar Espaço</h3>
                    </div>
                    <button 
                        onClick={onClose}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                        <X size={18} />
                    </button>
                </div>
                
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    Espaços organizam seus departamentos, equipes ou projetos de forma independente no CRM.
                </p>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Nome do Espaço */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Nome do Espaço *</label>
                        <input 
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Ex: Vendas, Marketing, RH"
                            required
                            autoFocus
                            style={{
                                background: 'var(--bg-tertiary)', border: '1px solid var(--border-default)',
                                borderRadius: '6px', padding: '10px 12px', color: 'var(--text-primary)',
                                outline: 'none', fontSize: '13px'
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--border-focus)'}
                            onBlur={(e) => e.target.style.borderColor = 'var(--border-default)'}
                        />
                    </div>

                    {/* Descrição */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Descrição (Opcional)</label>
                        <textarea 
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Uma breve descrição sobre a finalidade deste espaço"
                            rows={3}
                            style={{
                                background: 'var(--bg-tertiary)', border: '1px solid var(--border-default)',
                                borderRadius: '6px', padding: '8px 12px', color: 'var(--text-primary)',
                                outline: 'none', fontSize: '13px', resize: 'none'
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--border-focus)'}
                            onBlur={(e) => e.target.style.borderColor = 'var(--border-default)'}
                        />
                    </div>

                    {/* Cores */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Cor do Tema</label>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {colors.map(c => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setColor(c)}
                                    style={{
                                        width: '24px', height: '24px', borderRadius: '50%',
                                        background: c, border: color === c ? '2px solid #fff' : '2px solid transparent',
                                        cursor: 'pointer', transition: 'all 0.1s', outline: 'none',
                                        boxShadow: color === c ? '0 0 0 2px ' + c : 'none'
                                    }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Privacidade */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'var(--bg-tertiary)', borderRadius: '8px', border: '1px solid var(--border-default)' }}>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            {isPrivate ? <Lock size={16} color="#ef4444" /> : <Eye size={16} color="#10b981" />}
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: '13px', fontWeight: 600 }}>Tornar Privado</span>
                                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Apenas você e membros convidados verão este espaço</span>
                            </div>
                        </div>
                        <input 
                            type="checkbox"
                            checked={isPrivate}
                            onChange={(e) => setIsPrivate(e.target.checked)}
                            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                        />
                    </div>

                    {/* Ações */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                        <button 
                            type="button"
                            onClick={onClose}
                            style={{
                                background: 'transparent', border: '1px solid var(--border-default)',
                                color: 'var(--text-secondary)', padding: '8px 16px', borderRadius: '6px',
                                fontSize: '13px', cursor: 'pointer', fontWeight: 500
                            }}
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit"
                            style={{
                                background: color, border: 'none',
                                color: '#fff', padding: '8px 16px', borderRadius: '6px',
                                fontSize: '13px', cursor: 'pointer', fontWeight: 600,
                                boxShadow: `0 4px 10px ${color}40`
                            }}
                        >
                            Criar Espaço
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

interface CustomPromptModalProps {
    isOpen: boolean;
    title: string;
    placeholder: string;
    onClose: () => void;
    onSave: (value: string) => void;
}

const CustomPromptModal: React.FC<CustomPromptModalProps> = ({ isOpen, title, placeholder, onClose, onSave }) => {
    const [val, setVal] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (val.trim()) {
            onSave(val.trim());
            setVal('');
            onClose();
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'var(--bg-card)', backdropFilter: 'blur(2px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1100, color: 'var(--text-primary)'
        }} onClick={onClose}>
            <div style={{
                background: 'var(--bg-secondary)', border: '1px solid var(--border-default)',
                borderRadius: '8px', width: '350px', padding: '20px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)',
                display: 'flex', flexDirection: 'column', gap: '12px'
            }} onClick={(e) => e.stopPropagation()}>
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>{title}</h4>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <input 
                        value={val}
                        onChange={(e) => setVal(e.target.value)}
                        placeholder={placeholder}
                        required
                        autoFocus
                        style={{
                            background: 'var(--bg-tertiary)', border: '1px solid var(--border-default)',
                            borderRadius: '6px', padding: '8px 10px', color: 'var(--text-primary)',
                            outline: 'none', fontSize: '13px'
                        }}
                        onFocus={(e) => e.target.style.borderColor = 'var(--border-focus)'}
                        onBlur={(e) => e.target.style.borderColor = 'var(--border-default)'}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button 
                            type="button" 
                            onClick={onClose}
                            style={{
                                background: 'transparent', border: '1px solid var(--border-default)',
                                color: 'var(--text-secondary)', padding: '6px 12px', borderRadius: '4px',
                                fontSize: '12px', cursor: 'pointer'
                            }}
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit"
                            style={{
                                background: '#0ea5e9', border: 'none', color: '#fff',
                                padding: '6px 12px', borderRadius: '4px', fontSize: '12px',
                                cursor: 'pointer', fontWeight: 600
                            }}
                        >
                            Criar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ==========================================
// TREE NAVIGATION COMPONENTS
// ==========================================

const TreeNodeBoard = ({ 
    board, 
    depth = 0, 
    onAddClick 
}: { 
    board: MarketingBoard; 
    depth?: number; 
    onAddClick: (type: 'group' | 'task', boardId: string) => void;
}) => {
    const { activeBoardId, setActiveBoardId, updateBoard, deleteBoard } = useCRMState();
    const isActive = activeBoardId === board.id;
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(board.title);
    const [showMenu, setShowMenu] = useState(false);
    const [showPlusMenu, setShowPlusMenu] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    
    const menuRef = useRef<HTMLDivElement>(null);
    const plusMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setShowMenu(false);
            }
            if (plusMenuRef.current && !plusMenuRef.current.contains(e.target as Node)) {
                setShowPlusMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleRename = () => {
        if (editTitle.trim()) {
            updateBoard(board.id, { title: editTitle.trim() });
            setIsEditing(false);
        }
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm(`Tem certeza que deseja excluir o quadro "${board.title}"?`)) {
            deleteBoard(board.id);
        }
    };

    return (
        <div 
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => !isEditing && setActiveBoardId(board.id)}
            style={{
                display: 'flex', alignItems: 'center', gap: '8px', 
                padding: `6px 8px 6px ${depth * 12 + 8}px`, 
                borderRadius: '6px', cursor: 'pointer',
                background: isActive ? 'var(--bg-tertiary)' : 'transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: isActive ? 500 : 400,
                fontSize: '13px',
                position: 'relative'
            }}
        >
            <LayoutTemplate size={14} color={isActive ? '#0ea5e9' : 'currentColor'} />
            {isEditing ? (
                <input 
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={handleRename}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRename();
                        if (e.key === 'Escape') { setEditTitle(board.title); setIsEditing(false); }
                    }}
                    autoFocus
                    style={{
                        flex: 1, background: 'var(--bg-secondary)', border: '1px solid var(--border-focus)',
                        padding: '2px 4px', fontSize: '12px', color: 'var(--text-primary)', outline: 'none',
                        borderRadius: '4px'
                    }}
                    onClick={(e) => e.stopPropagation()}
                />
            ) : (
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {board.title}
                </span>
            )}
            
            {!isEditing && (
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
                    {(isHovered || isActive || showPlusMenu || showMenu) && (
                        <>
                            {/* Plus Button Dropdown */}
                            <div style={{ position: 'relative' }} ref={plusMenuRef}>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setShowPlusMenu(!showPlusMenu); }}
                                    title="Adicionar Tarefa ou Grupo"
                                    style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                >
                                    <Plus size={14} />
                                </button>
                                {showPlusMenu && (
                                    <div style={{
                                        position: 'absolute', top: '100%', right: 0, background: 'var(--bg-card)',
                                        border: '1px solid var(--border-default)', borderRadius: '6px', padding: '4px',
                                        zIndex: 100, width: '140px', boxShadow: 'var(--shadow-md)', fontWeight: 400
                                    }}>
                                        <div 
                                            onClick={(e) => { 
                                                e.stopPropagation(); 
                                                setShowPlusMenu(false);
                                                onAddClick('task', board.id); 
                                            }}
                                            style={{ padding: '6px 8px', fontSize: '12px', color: 'var(--text-primary)', cursor: 'pointer', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <Plus size={12} /> Nova Tarefa
                                        </div>
                                        <div 
                                            onClick={(e) => { 
                                                e.stopPropagation(); 
                                                setShowPlusMenu(false);
                                                onAddClick('group', board.id); 
                                            }}
                                            style={{ padding: '6px 8px', fontSize: '12px', color: 'var(--text-primary)', cursor: 'pointer', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <LayoutTemplate size={12} /> Grupo de Status
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Options Button Dropdown */}
                            <div style={{ position: 'relative' }} ref={menuRef}>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                                    style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                >
                                    <MoreVertical size={14} />
                                </button>
                                {showMenu && (
                                    <div style={{
                                        position: 'absolute', top: '100%', right: 0, background: 'var(--bg-card)',
                                        border: '1px solid var(--border-default)', borderRadius: '6px', padding: '4px',
                                        zIndex: 100, width: '110px', boxShadow: 'var(--shadow-md)', fontWeight: 400
                                    }}>
                                        <div 
                                            onClick={(e) => { e.stopPropagation(); setIsEditing(true); setShowMenu(false); }}
                                            style={{ padding: '6px 8px', fontSize: '12px', color: 'var(--text-primary)', cursor: 'pointer', borderRadius: '4px' }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            Renomear
                                        </div>
                                        <div 
                                            onClick={handleDelete}
                                            style={{ padding: '6px 8px', fontSize: '12px', color: '#ef4444', cursor: 'pointer', borderRadius: '4px' }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            Excluir
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

const TreeNodeFolder = ({ 
    folder, 
    boards, 
    spaceId, 
    onAddClick 
}: { 
    folder: MarketingFolder; 
    boards: MarketingBoard[]; 
    spaceId: string; 
    onAddClick: (type: 'folder' | 'board' | 'group' | 'task', spaceId: string, folderId: string | null, boardId?: string) => void;
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const { updateFolder, deleteFolder } = useCRMState();
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(folder.title);
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setShowMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleRename = () => {
        if (editTitle.trim()) {
            updateFolder(folder.id, { title: editTitle.trim() });
            setIsEditing(false);
        }
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm(`Tem certeza que deseja excluir a pasta "${folder.title}" e todos os seus quadros?`)) {
            deleteFolder(folder.id);
        }
    };

    return (
        <div>
            <div 
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onClick={() => !isEditing && setIsExpanded(!isExpanded)}
                style={{
                    display: 'flex', alignItems: 'center', gap: '8px', 
                    padding: `6px 8px 6px 16px`, 
                    borderRadius: '6px', cursor: 'pointer',
                    color: 'var(--text-primary)',
                    fontWeight: 500,
                    fontSize: '13px',
                    position: 'relative'
                }}
            >
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                <FolderOpen size={14} color="#8b5cf6" />
                {isEditing ? (
                    <input 
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={handleRename}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRename();
                            if (e.key === 'Escape') { setEditTitle(folder.title); setIsEditing(false); }
                        }}
                        autoFocus
                        style={{
                            flex: 1, background: 'var(--bg-secondary)', border: '1px solid var(--border-focus)',
                            padding: '2px 4px', fontSize: '12px', color: 'var(--text-primary)', outline: 'none',
                            borderRadius: '4px'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    />
                ) : (
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {folder.title}
                    </span>
                )}
                
                {!isEditing && (
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }} ref={menuRef} onClick={(e) => e.stopPropagation()}>
                        {(isHovered || showMenu) && (
                            <>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onAddClick('board', spaceId, folder.id); setIsExpanded(true); }}
                                    title="Novo Quadro"
                                    style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                >
                                    <Plus size={14} />
                                </button>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                                    style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                >
                                    <MoreVertical size={14} />
                                </button>
                                {showMenu && (
                                    <div style={{
                                        position: 'absolute', right: '16px', background: 'var(--bg-card)',
                                        border: '1px solid var(--border-default)', borderRadius: '6px', padding: '4px',
                                        zIndex: 100, width: '110px', boxShadow: 'var(--shadow-md)', fontWeight: 400
                                    }}>
                                        <div 
                                            onClick={(e) => { e.stopPropagation(); setIsEditing(true); setShowMenu(false); }}
                                            style={{ padding: '6px 8px', fontSize: '12px', color: 'var(--text-primary)', cursor: 'pointer', borderRadius: '4px' }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            Renomear
                                        </div>
                                        <div 
                                            onClick={handleDelete}
                                            style={{ padding: '6px 8px', fontSize: '12px', color: '#ef4444', cursor: 'pointer', borderRadius: '4px' }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            Excluir
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>
            
            {isExpanded && (
                <div style={{ paddingLeft: '8px' }}>
                    {boards.map(b => (
                        <TreeNodeBoard 
                            key={b.id} 
                            board={b} 
                            depth={2} 
                            onAddClick={(type, boardId) => onAddClick(type, spaceId, folder.id, boardId)}
                        />
                    ))}
                    {boards.length === 0 && <div style={{ padding: '4px 32px', fontSize: '11px', color: 'var(--text-tertiary)' }}>Vazio</div>}
                </div>
            )}
        </div>
    );
};

const TreeNodeSpace = ({ 
    space, 
    onAddClick 
}: { 
    space: MarketingSpace; 
    onAddClick: (type: 'folder' | 'board' | 'group' | 'task', spaceId: string, folderId: string | null, boardId?: string) => void;
}) => {
    const { folders, boards, updateSpace, deleteSpace } = useCRMState();
    const [isExpanded, setIsExpanded] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(space.title);
    
    const [isHovered, setIsHovered] = useState(false);
    const [showPlusMenu, setShowPlusMenu] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const plusMenuRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    
    const spaceFolders = folders.filter(f => f.spaceId === space.id);
    const orphanBoards = boards.filter(b => b.spaceId === space.id && !b.folderId);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (plusMenuRef.current && !plusMenuRef.current.contains(e.target as Node)) {
                setShowPlusMenu(false);
            }
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setShowMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleRename = () => {
        if (editTitle.trim()) {
            updateSpace(space.id, { title: editTitle.trim() });
            setIsEditing(false);
        }
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm(`Tem certeza que deseja excluir o espaço "${space.title}" e TODOS os seus conteúdos (pastas, quadros, tarefas)?`)) {
            deleteSpace(space.id);
        }
    };

    return (
        <div style={{ marginBottom: '16px' }}>
            <div 
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onClick={() => !isEditing && setIsExpanded(!isExpanded)}
                style={{
                    display: 'flex', alignItems: 'center', gap: '8px', 
                    padding: `8px`, 
                    cursor: 'pointer',
                    color: 'var(--text-primary)',
                    fontWeight: 600,
                    fontSize: '14px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    position: 'relative'
                }}
            >
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                
                {/* Space Color Dot Indicator */}
                <div style={{
                    width: '10px', height: '10px', borderRadius: '50%',
                    background: space.color || '#0ea5e9', display: 'inline-block'
                }} />

                {isEditing ? (
                    <input 
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={handleRename}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRename();
                            if (e.key === 'Escape') { setEditTitle(space.title); setIsEditing(false); }
                        }}
                        autoFocus
                        style={{
                            flex: 1, background: 'var(--bg-secondary)', border: '1px solid var(--border-focus)',
                            padding: '2px 4px', fontSize: '12px', color: 'var(--text-primary)', outline: 'none',
                            borderRadius: '4px', textTransform: 'none'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    />
                ) : (
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {space.title}
                    </span>
                )}
                
                {!isEditing && (
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
                        {(isHovered || showPlusMenu || showMenu) && (
                            <>
                                {/* Plus Dropdown */}
                                <div style={{ position: 'relative' }} ref={plusMenuRef}>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setShowPlusMenu(!showPlusMenu); }} 
                                        title="Adicionar item" 
                                        style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                    >
                                        <Plus size={14} />
                                    </button>
                                    {showPlusMenu && (
                                        <div style={{
                                            position: 'absolute', right: 0, top: '100%', background: 'var(--bg-card)',
                                            border: '1px solid var(--border-default)', borderRadius: '6px', padding: '4px',
                                            zIndex: 100, width: '130px', boxShadow: 'var(--shadow-md)', textTransform: 'none', fontWeight: 400
                                        }}>
                                            <div 
                                                onClick={(e) => { 
                                                    e.stopPropagation(); 
                                                    setShowPlusMenu(false); 
                                                    onAddClick('folder', space.id, null); 
                                                }}
                                                style={{ padding: '6px 8px', fontSize: '12px', color: 'var(--text-primary)', cursor: 'pointer', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                            >
                                                📁 Criar Pasta
                                            </div>
                                            <div 
                                                onClick={(e) => { 
                                                    e.stopPropagation(); 
                                                    setShowPlusMenu(false); 
                                                    onAddClick('board', space.id, null); 
                                                }}
                                                style={{ padding: '6px 8px', fontSize: '12px', color: 'var(--text-primary)', cursor: 'pointer', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                            >
                                                📋 Criar Quadro
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Options Dropdown */}
                                <div style={{ position: 'relative' }} ref={menuRef}>
                                    <button onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }} style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><MoreVertical size={14} /></button>
                                    {showMenu && (
                                        <div style={{
                                            position: 'absolute', right: 0, top: '100%', background: 'var(--bg-card)',
                                            border: '1px solid var(--border-default)', borderRadius: '6px', padding: '4px',
                                            zIndex: 100, width: '110px', boxShadow: 'var(--shadow-md)', textTransform: 'none', fontWeight: 400
                                        }}>
                                            <div 
                                                onClick={(e) => { e.stopPropagation(); setIsEditing(true); setShowMenu(false); }}
                                                style={{ padding: '6px 8px', fontSize: '12px', color: 'var(--text-primary)', cursor: 'pointer', borderRadius: '4px' }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                            >
                                                Renomear
                                            </div>
                                            <div 
                                                onClick={handleDelete}
                                                style={{ padding: '6px 8px', fontSize: '12px', color: '#ef4444', cursor: 'pointer', borderRadius: '4px' }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                            >
                                                Excluir
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            {isExpanded && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {spaceFolders.map(f => (
                        <TreeNodeFolder 
                            key={f.id} 
                            folder={f} 
                            boards={boards.filter(b => b.folderId === f.id)} 
                            spaceId={space.id} 
                            onAddClick={onAddClick}
                        />
                    ))}
                    {orphanBoards.map(b => (
                        <TreeNodeBoard 
                            key={b.id} 
                            board={b} 
                            depth={1} 
                            onAddClick={(type, boardId) => onAddClick(type, space.id, null, boardId)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const MarketingSidebar = ({ isCollapsed, setIsCollapsed }: { isCollapsed: boolean, setIsCollapsed: (v: boolean) => void }) => {
    const { spaces, addSpace, addFolder, addBoard, addGroup, addLead, groups } = useCRMState();
    const [showCreateSpace, setShowCreateSpace] = useState(false);
    
    // Custom prompt modal state
    const [promptModal, setPromptModal] = useState<{
        type: 'folder' | 'board' | 'group' | 'task';
        title: string;
        placeholder: string;
        spaceId: string;
        folderId: string | null;
        boardId?: string;
    } | null>(null);

    if (isCollapsed) {
        return (
            <div style={{ width: '48px', borderRight: '1px solid var(--border-default)', background: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 0', height: '100%' }}>
                <button onClick={() => setIsCollapsed(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                    <PanelLeft size={20} />
                </button>
            </div>
        );
    }

    const handleAddClick = (type: 'folder' | 'board' | 'group' | 'task', spaceId: string, folderId: string | null, boardId?: string) => {
        if (type === 'folder') {
            setPromptModal({
                type: 'folder',
                title: 'Criar Pasta',
                placeholder: 'Nome da Pasta (ex: Campanhas de Marketing)',
                spaceId,
                folderId: null
            });
        } else if (type === 'board') {
            setPromptModal({
                type: 'board',
                title: 'Criar Quadro',
                placeholder: 'Nome do Quadro (ex: Kanban de Vendas)',
                spaceId,
                folderId
            });
        } else if (type === 'group') {
            setPromptModal({
                type: 'group',
                title: 'Criar Grupo de Status',
                placeholder: 'Nome do Grupo (ex: Negociação)',
                spaceId,
                folderId,
                boardId
            });
        } else if (type === 'task') {
            setPromptModal({
                type: 'task',
                title: 'Criar Tarefa',
                placeholder: 'Nome da Tarefa / Lead (ex: Cliente ACME Corp)',
                spaceId,
                folderId,
                boardId
            });
        }
    };

    const handlePromptSave = (value: string) => {
        if (!promptModal) return;
        
        if (promptModal.type === 'folder') {
            addFolder(promptModal.spaceId, value);
        } else if (promptModal.type === 'board') {
            addBoard(promptModal.spaceId, promptModal.folderId, value);
        } else if (promptModal.type === 'group') {
            if (promptModal.boardId) {
                const colors = ['#0ea5e9', '#8b5cf6', '#f59e0b', '#ef4444', '#10b981', '#ec4899'];
                const randomColor = colors[Math.floor(Math.random() * colors.length)];
                addGroup(promptModal.boardId, value, randomColor);
            }
        } else if (promptModal.type === 'task') {
            if (promptModal.boardId) {
                const boardGroups = groups.filter(g => g.boardId === promptModal.boardId).sort((a, b) => a.order - b.order);
                const firstGroupId = boardGroups.length > 0 ? boardGroups[0].id : '';
                if (firstGroupId) {
                    addLead(promptModal.boardId, firstGroupId, value);
                }
            }
        }
    };

    return (
        <div style={{ width: '260px', borderRight: '1px solid var(--border-default)', background: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column', height: '100%', transition: 'width 0.2s' }}>
            <div style={{ padding: '16px', borderBottom: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>CRM</h2>
                <button onClick={() => setIsCollapsed(true)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                    <PanelLeftClose size={18} />
                </button>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 8px' }}>
                {spaces.map(space => (
                    <TreeNodeSpace 
                        key={space.id} 
                        space={space} 
                        onAddClick={handleAddClick}
                    />
                ))}
                
                <button 
                    onClick={() => setShowCreateSpace(true)}
                    style={{ marginTop: '16px', width: '100%', padding: '8px', background: 'transparent', border: '1px dashed var(--border-default)', borderRadius: '6px', color: 'var(--text-secondary)', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                    <Plus size={14} /> Adicionar Espaço
                </button>
            </div>

            {/* Modal de Criar Espaço */}
            <CreateSpaceModal 
                isOpen={showCreateSpace} 
                onClose={() => setShowCreateSpace(false)} 
                onSave={(name, desc, color, isPriv) => addSpace(name, desc, color, isPriv)}
            />

            {/* Modal Prompt para Pastas/Quadros/Grupos/Tarefas */}
            {promptModal && (
                <CustomPromptModal 
                    isOpen={!!promptModal} 
                    title={promptModal.title} 
                    placeholder={promptModal.placeholder} 
                    onClose={() => setPromptModal(null)} 
                    onSave={handlePromptSave}
                />
            )}
        </div>
    );
};

const MarketingPageContent = () => {
    const { 
        viewMode, setViewMode, activeBoard, activeSpace, folders, addLead, activeGroups,
        searchQuery, setSearchQuery, filterAssignee, setFilterAssignee, filterPriority, setFilterPriority, leads,
        addImportedData
    } = useCRMState();
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !activeBoard) return;
        
        import('papaparse').then((Papa) => {
            Papa.default.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    const data = results.data as any[];
                    if (data.length === 0) return;
                    
                    const headers = Object.keys(data[0]);
                    const newColumns: string[] = [];
                    const newCustomColumnNames: Record<string, string> = {};
                    const newGroups: import('../features/Marketing/marketingStorage').MarketingGroup[] = [];
                    const newLeads: import('../features/Marketing/marketingStorage').MarketingCardData[] = [];
                    
                    // Identify columns
                    headers.forEach(header => {
                        const lower = header.toLowerCase();
                        if (['title', 'nome', 'título'].includes(lower)) return;
                        if (['status', 'fase', 'etapa'].includes(lower)) return;
                        
                        let isNumber = true;
                        const uniqueValues = new Set();
                        data.forEach(row => {
                            const val = row[header];
                            if (val !== undefined && val !== null && val !== '') {
                                if (isNaN(Number(val))) isNumber = false;
                                uniqueValues.add(val);
                            }
                        });
                        
                        let type = 'text';
                        if (isNumber) type = 'number';
                        else if (uniqueValues.size > 0 && uniqueValues.size <= 10) type = 'dropdown';
                        
                        const colId = `custom_${type}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
                        newColumns.push(colId);
                        newCustomColumnNames[colId] = header;
                    });
                    
                    let defaultGroupId = activeGroups.length > 0 ? activeGroups[0].id : `group_${Date.now()}`;
                    if (activeGroups.length === 0) {
                        newGroups.push({ id: defaultGroupId, boardId: activeBoard.id, title: 'Importados', color: '#64748b', order: 0 });
                    }
                    
                    data.forEach((row: any) => {
                        const titleKey = headers.find(h => ['title', 'nome', 'título'].includes(h.toLowerCase())) || headers[0];
                        const statusKey = headers.find(h => ['status', 'fase', 'etapa'].includes(h.toLowerCase()));
                        
                        let statusVal = statusKey ? row[statusKey] : 'Novo';
                        if (!statusVal) statusVal = 'Novo';
                        
                        let group = activeGroups.find(g => g.title.toLowerCase() === String(statusVal).toLowerCase()) || newGroups.find(g => g.title.toLowerCase() === String(statusVal).toLowerCase());
                        if (!group) {
                            group = { id: `group_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, boardId: activeBoard.id, title: String(statusVal), color: '#0ea5e9', order: activeGroups.length + newGroups.length };
                            newGroups.push(group);
                        }
                        
                        const lead: import('../features/Marketing/marketingStorage').MarketingCardData = {
                            id: `lead_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                            boardId: activeBoard.id,
                            groupId: group.id,
                            title: row[titleKey] || 'Lead Importado',
                            description: '',
                            status: group.title,
                            createdAt: Date.now(),
                            updatedAt: Date.now(),
                            assignee: 'Não atribuído'
                        };
                        
                        newColumns.forEach(colId => {
                            const header = newCustomColumnNames[colId];
                            const val = row[header];
                            if (colId.startsWith('custom_number_')) {
                                (lead as any)[colId] = val ? Number(val) : 0;
                            } else {
                                (lead as any)[colId] = val || '';
                            }
                        });
                        
                        newLeads.push(lead);
                    });
                    
                    addImportedData(activeBoard.id, newColumns, newCustomColumnNames, newGroups, newLeads);
                }
            });
        });
        
        if (e.target) e.target.value = '';
    };

    if (!activeBoard) return <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>Nenhum quadro selecionado.</div>;

    const firstGroup = activeGroups.length > 0 ? activeGroups[0].id : '';
    const activeFolder = activeBoard.folderId ? folders.find(f => f.id === activeBoard.folderId) : null;

    // Get unique assignees
    const assignees = Array.from(new Set(leads.filter(l => l.boardId === activeBoard.id && l.assignee && l.assignee !== 'Não atribuído').map(l => l.assignee)));

    return (
        <div className={styles.pageContainer} style={{ flex: 1 }}>
            {/* COMPACT TOP NAV BAR */}
            <div style={{ display: 'flex', flexDirection: 'column', padding: '12px 24px', borderBottom: '1px solid var(--border-default)', background: 'var(--bg-primary)', zIndex: 10 }}>
                
                {/* Breadcrumbs & Title */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-tertiary)', marginBottom: '12px' }}>
                    <div style={{ width: '20px', height: '20px', background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                        <Megaphone size={12} />
                    </div>
                    <span>{activeSpace?.title}</span>
                    <span>/</span>
                    {activeFolder && (
                        <>
                            <span>{activeFolder.title}</span>
                            <span>/</span>
                        </>
                    )}
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{activeBoard.title}</span>
                </div>

                {/* Unified Control Line */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div className={styles.viewToggles} style={{ padding: '2px' }}>
                            <button className={`${styles.viewBtn} ${viewMode === 'list' ? styles.active : ''}`} onClick={() => setViewMode('list')} style={{ padding: '6px 12px', fontSize: '12px' }}>
                                <LayoutList size={14} /> Lista
                            </button>
                            <button className={`${styles.viewBtn} ${viewMode === 'board' ? styles.active : ''}`} onClick={() => setViewMode('board')} style={{ padding: '6px 12px', fontSize: '12px' }}>
                                <KanbanSquare size={14} /> Board
                            </button>
                        </div>

                        <div style={{ width: '1px', height: '20px', background: 'var(--border-default)' }}></div>

                        <button 
                            className={styles.primaryBtn} 
                            onClick={() => firstGroup && addLead(activeBoard.id, firstGroup, 'Novo Lead')} 
                            disabled={!firstGroup}
                            style={{ padding: '6px 12px', fontSize: '12px' }}
                        >
                            + Nova Tarefa
                        </button>
                        
                        <button 
                            className={styles.secondaryBtn} 
                            onClick={() => fileInputRef.current?.click()} 
                            style={{ padding: '6px 12px', fontSize: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', borderRadius: '6px', cursor: 'pointer' }}
                        >
                            Importar Planilha
                        </button>
                        <input type="file" accept=".csv" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImportCSV} />

                        <div style={{ position: 'relative' }}>
                            <Search size={14} style={{ position: 'absolute', left: 8, top: 7, color: 'var(--text-secondary)' }} />
                            <input 
                                type="text" placeholder="Pesquisar..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-default)', padding: '6px 8px 6px 28px', color: 'var(--text-primary)', fontSize: '12px', outline: 'none', width: '160px', borderRadius: '4px' }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {/* Assignee Filter Dropdown */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <User size={14} />
                            <select 
                                value={filterAssignee || ''} 
                                onChange={(e) => setFilterAssignee(e.target.value || null)}
                                style={{ background: 'transparent', border: 'none', color: filterAssignee ? '#0ea5e9' : 'var(--text-secondary)', cursor: 'pointer', outline: 'none', fontSize: '12px', padding: 0 }}
                            >
                                <option value="" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Responsáveis: Todos</option>
                                {assignees.map(a => (
                                    <option key={a} value={a} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{a}</option>
                                ))}
                            </select>
                        </div>

                        {/* Priority Filter Dropdown */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Filter size={14} />
                            <select 
                                value={filterPriority || ''} 
                                onChange={(e) => setFilterPriority(e.target.value || null)}
                                style={{ background: 'transparent', border: 'none', color: filterPriority ? '#0ea5e9' : 'var(--text-secondary)', cursor: 'pointer', outline: 'none', fontSize: '12px', padding: 0 }}
                            >
                                <option value="" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Prioridade: Todas</option>
                                <option value="Alta" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Alta</option>
                                <option value="Média" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Média</option>
                                <option value="Baixa" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Baixa</option>
                            </select>
                        </div>
                        
                        {(filterAssignee || filterPriority || searchQuery) && (
                            <button 
                                onClick={() => {
                                    setFilterAssignee(null);
                                    setFilterPriority(null);
                                    setSearchQuery('');
                                }}
                                style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 500 }}
                            >
                                Limpar filtros
                            </button>
                        )}
                        
                        <div style={{ width: '1px', height: '14px', background: 'var(--border-default)' }}></div>

                        <button style={{ background: 'transparent', border: 'none', color: '#0ea5e9', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontWeight: 500 }}>
                            Sugestão de IA
                        </button>
                    </div>
                </div>
            </div>

            {viewMode === 'board' ? <KanbanBoard /> : <CRMList />}
            <LeadDetailModal />
        </div>
    );
};

export const CRMCanvasView = ({ boardId }: { boardId: string }) => {
    return (
        <CRMProvider forcedBoardId={boardId}>
            <MarketingPageContent />
        </CRMProvider>
    );
};

// Removed old MarketingPage since it's deprecated
