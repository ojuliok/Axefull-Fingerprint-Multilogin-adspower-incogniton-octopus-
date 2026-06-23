import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronRight, User, MessageCircle, AlertCircle, Image as ImageIcon, Plus, MoreVertical, Trash2, Edit2, Maximize2 } from 'lucide-react';
import { useCRMState } from './CRMContext';
import { MarketingCardData, MarketingPriority, MarketingGroup } from './marketingStorage';

const PRIORITY_COLORS: Record<MarketingPriority, string> = {
    'Alta': '#4c1d95',
    'Média': '#5b21b6',
    'Baixa': '#3b82f6'
};

const AVAILABLE_STATUS = [
    { label: 'Novo', color: '#0ea5e9' },
    { label: 'Em Contato', color: '#f59e0b' },
    { label: 'Proposta', color: '#8b5cf6' },
    { label: 'Parado', color: '#ef4444' },
    { label: 'Ganho', color: '#10b981' }
];

const AVAILABLE_COLUMNS = [
    { id: 'status', label: 'Status' },
    { id: 'assignee', label: 'Pessoas' },
    { id: 'deadline', label: 'Data' },
    { id: 'priority', label: 'Prioridade' },
    { id: 'notes', label: 'Texto (Notas)' },
    { id: 'budget', label: 'Números (Orçamento)' },
    { id: 'files', label: 'Arquivos' }
];

const getRelativeDeadline = (deadline: number | null) => {
    if (!deadline) return { label: 'Definir...', color: 'var(--text-tertiary)' };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadlineDate = new Date(deadline);
    deadlineDate.setHours(0, 0, 0, 0);
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
        return { label: `Atrasado (${deadlineDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })})`, color: '#ef4444' };
    } else if (diffDays === 0) {
        return { label: 'Hoje', color: '#f59e0b' };
    } else if (diffDays === 1) {
        return { label: 'Amanhã', color: '#3b82f6' };
    } else {
        return { label: deadlineDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }), color: 'var(--text-secondary)' };
    }
};

const getColIcon = (id: string) => {
    switch (id) {
        case 'status':
            return <div style={{ width: '14px', height: '14px', borderRadius: '3px', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: '6px', height: '6px', border: '1.2px solid white', borderRadius: '0.5px' }}></div></div>;
        case 'assignee':
            return <User size={12} color="#0ea5e9" />;
        case 'deadline':
            return <div style={{ width: '14px', height: '14px', borderRadius: '3px', background: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: '6px', height: '6px', border: '1.2px solid white', borderTop: 'none', position: 'relative' }}><div style={{ position: 'absolute', top: -2, left: 0, right: 0, height: 1, background: 'white' }}></div></div></div>;
        case 'priority':
            return <ChevronDown size={12} color="#10b981" />;
        case 'notes':
            return <div style={{ width: '14px', height: '14px', borderRadius: '3px', background: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '9px' }}>T</div>;
        case 'budget':
            return <div style={{ width: '14px', height: '14px', borderRadius: '3px', background: '#eab308', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '8px' }}>123</div>;
        case 'files':
            return <ImageIcon size={12} color="var(--text-secondary)" />;
        default:
            return <Plus size={12} />;
    }
};

// Custom Dropdown to fix native select outline
const CustomDropdown = ({ 
    value, 
    options, 
    onChange, 
    color,
    onOpenChange
}: { 
    value: string, 
    options: { label: string, color: string }[], 
    onChange: (val: string) => void, 
    color?: string,
    onOpenChange?: (isOpen: boolean) => void
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (onOpenChange) {
            onOpenChange(isOpen);
        }
    }, [isOpen, onOpenChange]);

    const selectedOption = options.find(o => o.label === value);
    const bgColor = selectedOption?.color || color || 'var(--bg-tertiary)';

    return (
        <div ref={ref} style={{ position: 'relative', width: '100%', height: '100%', zIndex: isOpen ? 100 : 1 }}>
            <div 
                onClick={() => setIsOpen(!isOpen)}
                style={{ 
                    width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    background: bgColor, color: '#fff', cursor: 'pointer', fontWeight: 500, fontSize: '12px'
                }}
            >
                {value || '-'}
            </div>
            
            {isOpen && (
                <div style={{
                    position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', 
                    background: 'var(--bg-card)', border: '1px solid var(--border-default)', 
                    borderRadius: '6px', padding: '8px', zIndex: 100, width: '140px',
                    boxShadow: 'var(--shadow-md)', display: 'flex', flexDirection: 'column', gap: '4px'
                }}>
                    {options.map(opt => (
                        <div 
                            key={opt.label}
                            onClick={() => { onChange(opt.label); setIsOpen(false); }}
                            style={{ 
                                padding: '6px 8px', background: opt.color, color: '#fff', 
                                borderRadius: '4px', cursor: 'pointer', textAlign: 'center', fontSize: '12px', fontWeight: 500 
                            }}
                        >
                            {opt.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const ColumnHeader = ({ 
    colId, 
    label, 
    onRemove, 
    onRename,
    onOpenChange
}: { 
    colId: string, 
    label: string, 
    onRemove: () => void,
    onRename: (newName: string) => void,
    onOpenChange?: (isOpen: boolean) => void
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editVal, setEditVal] = useState(label);
    const ref = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setEditVal(label);
    }, [label]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (onOpenChange) {
            onOpenChange(isOpen);
        }
    }, [isOpen, onOpenChange]);

    const handleSave = () => {
        setIsEditing(false);
        if (editVal.trim() && editVal.trim() !== label) {
            onRename(editVal.trim());
        }
    };

    if (isEditing) {
        return (
            <div ref={ref} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', padding: '0 8px' }}>
                <input 
                    ref={inputRef}
                    value={editVal}
                    onChange={(e) => setEditVal(e.target.value)}
                    onBlur={handleSave}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSave();
                        if (e.key === 'Escape') { setEditVal(label); setIsEditing(false); }
                    }}
                    style={{
                        width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border-focus)',
                        color: 'var(--text-primary)', fontSize: '11px', outline: 'none', borderRadius: '4px',
                        padding: '2px 4px', textAlign: 'center'
                    }}
                />
            </div>
        );
    }

    return (
        <div 
            ref={ref} 
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', width: '100%', height: '100%', cursor: 'pointer' }} 
            onClick={() => setIsOpen(!isOpen)}
            onDoubleClick={(e) => { e.stopPropagation(); setIsEditing(true); setIsOpen(false); }}
        >
            <span>{label}</span>
            {isOpen && (
                <div style={{
                    position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', 
                    background: 'var(--bg-card)', border: '1px solid var(--border-default)', 
                    borderRadius: '6px', padding: '4px', zIndex: 1000, width: '160px',
                    boxShadow: 'var(--shadow-md)', display: 'flex', flexDirection: 'column', gap: '2px'
                }}>
                    <div 
                        onClick={(e) => { e.stopPropagation(); setIsEditing(true); setIsOpen(false); }}
                        style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', fontSize: '12px', cursor: 'pointer', borderRadius: '4px' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                        <Edit2 size={12} /> Renomear Coluna
                    </div>
                    <div 
                        onClick={(e) => { e.stopPropagation(); onRemove(); setIsOpen(false); }}
                        style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontSize: '12px', cursor: 'pointer', borderRadius: '4px' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                        <Trash2 size={12} /> Remover Coluna
                    </div>
                </div>
            )}
        </div>
    );
};

// Inline Editable Cell that does not break layout height
const InlineEdit = ({ 
    value, 
    onSave, 
    type = 'text', 
    placeholder = '', 
    style = {}, 
    trigger = 'click' 
}: { 
    value: string | number, 
    onSave: (val: string) => void, 
    type?: string, 
    placeholder?: string, 
    style?: React.CSSProperties,
    trigger?: 'click' | 'doubleClick'
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [currentValue, setCurrentValue] = useState(value);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { setCurrentValue(value); }, [value]);
    useEffect(() => { if (isEditing && inputRef.current) inputRef.current.focus(); }, [isEditing]);

    const handleBlur = () => {
        setIsEditing(false);
        if (currentValue !== value) onSave(String(currentValue));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleBlur();
        if (e.key === 'Escape') { setCurrentValue(value); setIsEditing(false); }
    };

    const startEditing = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsEditing(true);
    };

    if (isEditing) {
        return (
            <input 
                ref={inputRef} type={type} value={currentValue} onChange={(e) => setCurrentValue(e.target.value)}
                onBlur={handleBlur} onKeyDown={handleKeyDown}
                onClick={(e) => e.stopPropagation()}
                style={{ 
                    width: '100%', padding: '0', border: 'none', background: 'transparent',
                    outline: 'none', color: 'var(--text-primary)', fontSize: '12px', ...style
                }}
            />
        );
    }

    return (
        <div 
            onClick={trigger === 'click' ? startEditing : undefined}
            onDoubleClick={trigger === 'doubleClick' ? startEditing : undefined}
            style={{ 
                cursor: 'text', display: 'flex', alignItems: 'center', width: '100%', height: '100%',
                fontSize: '12px', color: value ? 'var(--text-primary)' : 'var(--text-tertiary)', 
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', ...style
            }}
            title={String(value || placeholder)}
        >
            {value || placeholder}
        </div>
    );
};

const ListGroup: React.FC<{ 
    group: MarketingGroup; 
    leads: MarketingCardData[]; 
    columns: string[];
    selectedIds: string[];
    setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>;
    addColumn: (colId: string) => void;
    columnWidths: Record<string, string>;
    startResize: (e: React.MouseEvent, colId: string) => void;
    createCustomColumn: (type: 'status' | 'dropdown' | 'text' | 'date' | 'people' | 'number') => void;
}> = ({ group, leads, columns, selectedIds, setSelectedIds, addColumn, columnWidths, startResize, createCustomColumn }) => {
    const { setSelectedLeadId, updateLead, addLead, updateBoard, activeBoard, updateGroup, deleteGroup } = useCRMState();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(group.title);
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const [showColDropdown, setShowColDropdown] = useState(false);
    const colDropdownRef = useRef<HTMLDivElement>(null);
    const [isInputFocused, setIsInputFocused] = useState(false);
    const [isHeaderDropdownOpen, setIsHeaderDropdownOpen] = useState(false);
    const [activeRowDropdown, setActiveRowDropdown] = useState<string | null>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (colDropdownRef.current && !colDropdownRef.current.contains(e.target as Node)) {
                setShowColDropdown(false);
            }
        };
        if (showColDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showColDropdown]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setShowMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    const color = group.color;
    const totalBudget = leads.reduce((acc, lead) => acc + (lead.budget || 0), 0);
    const totalFiles = 0; // Mock

    const handleAddLead = () => {
        if (newTaskTitle.trim()) {
            addLead(group.boardId, group.id, newTaskTitle);
            setNewTaskTitle('');
        }
    };

    const removeColumn = (colId: string) => {
        if (activeBoard) {
            updateBoard(activeBoard.id, { columns: columns.filter(c => c !== colId) });
        }
    };

    const handleRename = () => {
        if (editTitle.trim()) {
            updateGroup(group.id, { title: editTitle.trim() });
            setIsEditing(false);
        }
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm(`Tem certeza que deseja excluir o grupo "${group.title}" e todas as suas tarefas?`)) {
            deleteGroup(group.id);
        }
    };

    const handleColorChange = (newColor: string) => {
        updateGroup(group.id, { color: newColor });
        setShowMenu(false);
    };

    const colorPalette = ['#0ea5e9', '#f59e0b', '#8b5cf6', '#ef4444', '#10b981', '#ec4899', '#64748b'];

    // Checkbox + Title + Dynamic Columns + Empty End Space (to prevent layout collapse)
    const gridTemplateColumns = `32px ${columnWidths.task} ${columns.map(c => columnWidths[c] || '100px').join(' ')} 40px`;

    return (
        <div style={{ marginBottom: '32px' }}>
            <div 
                style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', cursor: 'pointer', color: color, position: 'relative' }}
                onClick={() => !isEditing && setIsCollapsed(!isCollapsed)}
            >
                {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                
                {isEditing ? (
                    <input 
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={handleRename}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRename();
                            if (e.key === 'Escape') { setEditTitle(group.title); setIsEditing(false); }
                        }}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: 'var(--bg-secondary)', border: '1px solid var(--border-focus)',
                            padding: '2px 6px', fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', outline: 'none',
                            borderRadius: '4px', height: '24px'
                        }}
                    />
                ) : (
                    <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>{group.title}</h3>
                )}
                
                <span style={{ color: 'var(--text-tertiary)', fontSize: '12px', fontWeight: 400 }}>{leads.length} Tarefas</span>
                
                {!isEditing && (
                    <div style={{ position: 'relative' }} ref={menuRef} onClick={(e) => e.stopPropagation()}>
                        <button 
                            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                            style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        >
                            <MoreVertical size={14} />
                        </button>
                        {showMenu && (
                            <div style={{
                                position: 'absolute', top: '100%', left: 0, background: 'var(--bg-card)',
                                border: '1px solid var(--border-default)', borderRadius: '6px', padding: '6px',
                                zIndex: 100, width: '150px', boxShadow: 'var(--shadow-md)', display: 'flex', flexDirection: 'column', gap: '4px'
                            }}>
                                <div 
                                    onClick={(e) => { e.stopPropagation(); setIsEditing(true); setShowMenu(false); }}
                                    style={{ padding: '6px 8px', fontSize: '12px', color: 'var(--text-primary)', cursor: 'pointer', borderRadius: '4px' }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    Renomear grupo
                                </div>
                                <div 
                                    onClick={handleDelete}
                                    style={{ padding: '6px 8px', fontSize: '12px', color: '#ef4444', cursor: 'pointer', borderRadius: '4px' }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    Excluir grupo
                                </div>
                                <div style={{ height: '1px', background: 'var(--border-default)', margin: '4px 0' }}></div>
                                <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', padding: '0 8px 4px 8px' }}>Mudar cor:</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', padding: '0 8px' }}>
                                    {colorPalette.map(c => (
                                        <div 
                                            key={c} 
                                            onClick={() => handleColorChange(c)}
                                            style={{ width: '16px', height: '16px', borderRadius: '50%', background: c, cursor: 'pointer', border: c === group.color ? '2px solid white' : 'none' }}
                                            title={c}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {!isCollapsed && (
                <div style={{ 
                    borderRadius: '6px', 
                    border: '1px solid var(--border-default)', 
                    overflow: 'visible', // Prevent cutting off popovers
                    background: 'var(--bg-primary)',
                    position: 'relative',
                    zIndex: showColDropdown ? 50 : 1,
                    minWidth: 'fit-content'
                }}>
                    
                    {/* Header Row */}
                    <div style={{ 
                        display: 'grid', gridTemplateColumns, borderBottom: isCollapsed ? 'none' : '1px solid var(--border-default)',
                        color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 500, background: 'var(--bg-secondary)', height: '34px',
                        borderTopLeftRadius: '6px', borderTopRightRadius: '6px',
                        borderBottomLeftRadius: isCollapsed ? '6px' : '0', borderBottomRightRadius: isCollapsed ? '6px' : '0',
                        position: 'relative',
                        zIndex: (showColDropdown || isHeaderDropdownOpen) ? 100 : 3
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid var(--border-default)' }}>
                            <input 
                                type="checkbox" 
                                checked={leads.length > 0 && leads.every(l => selectedIds.includes(l.id))}
                                onChange={() => {
                                    const leadIds = leads.map(l => l.id);
                                    const allSelected = leads.length > 0 && leadIds.every(id => selectedIds.includes(id));
                                    if (allSelected) {
                                        setSelectedIds(prev => prev.filter(id => !leadIds.includes(id)));
                                    } else {
                                        setSelectedIds(prev => {
                                            const newIds = [...prev];
                                            leadIds.forEach(id => {
                                                if (!newIds.includes(id)) newIds.push(id);
                                            });
                                            return newIds;
                                        });
                                    }
                                }}
                                style={{ cursor: 'pointer', width: '12px', height: '12px' }} 
                            />
                        </div>
                        <div style={{ 
                            padding: '0 12px', 
                            display: 'flex', 
                            alignItems: 'center', 
                            borderRight: '1px solid var(--border-default)',
                            position: 'relative'
                        }}>
                            Tarefa
                            <div 
                                onMouseDown={(e) => startResize(e, 'task')}
                                style={{
                                    position: 'absolute', right: -3, top: 0, bottom: 0, width: '6px',
                                    cursor: 'col-resize', zIndex: 10, background: 'transparent',
                                    transition: 'background 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#0ea5e9'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            />
                        </div>
                        
                        {columns.map(col => (
                            <div key={col} style={{ borderRight: '1px solid var(--border-default)', position: 'relative' }}>
                                <ColumnHeader 
                                    colId={col} 
                                    label={activeBoard.customColumnNames?.[col] || AVAILABLE_COLUMNS.find(c => c.id === col)?.label || col} 
                                    onRemove={() => removeColumn(col)}
                                    onRename={(newName) => {
                                        if (activeBoard) {
                                            const currentNames = activeBoard.customColumnNames || {};
                                            updateBoard(activeBoard.id, {
                                                customColumnNames: {
                                                    ...currentNames,
                                                    [col]: newName
                                                }
                                            });
                                        }
                                    }}
                                    onOpenChange={(isOpen) => setIsHeaderDropdownOpen(isOpen)}
                                />
                                <div 
                                    onMouseDown={(e) => startResize(e, col)}
                                    style={{
                                        position: 'absolute', right: -3, top: 0, bottom: 0, width: '6px',
                                        cursor: 'col-resize', zIndex: 10, background: 'transparent',
                                        transition: 'background 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = '#0ea5e9'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                />
                            </div>
                        ))}
                        <div 
                            ref={colDropdownRef}
                            onClick={(e) => e.stopPropagation()}
                            style={{ 
                                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                position: 'relative', height: '100%',
                                zIndex: showColDropdown ? 9999 : 1
                            }}
                        >
                            <button 
                                onClick={() => setShowColDropdown(!showColDropdown)}
                                style={{ 
                                    background: 'transparent', border: 'none', cursor: 'pointer', 
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                    width: '100%', height: '100%', color: 'var(--text-tertiary)',
                                    transition: 'color 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-tertiary)'}
                            >
                                <Plus size={14} />
                            </button>
                            {showColDropdown && (
                                <div style={{
                                    position: 'absolute', top: '100%', right: 0, marginTop: '6px',
                                    background: 'var(--bg-card)', border: '1px solid var(--border-default)',
                                    borderRadius: '8px', padding: '12px', zIndex: 1000, width: '280px',
                                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)',
                                    textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '8px'
                                }}>
                                    {/* Existing Columns Section */}
                                    <div>
                                        <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>
                                            Adicionar Existente
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            {AVAILABLE_COLUMNS.filter(c => !columns.includes(c.id)).length === 0 ? (
                                                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', padding: '4px 6px' }}>
                                                    Todas as colunas estão ativas
                                                </div>
                                            ) : (
                                                AVAILABLE_COLUMNS.filter(c => !columns.includes(c.id)).map(col => (
                                                    <div 
                                                        key={col.id}
                                                        onClick={() => { addColumn(col.id); setShowColDropdown(false); }}
                                                        style={{ 
                                                            display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', 
                                                            fontSize: '12px', color: 'var(--text-primary)', cursor: 'pointer', 
                                                            borderRadius: '4px', transition: 'background 0.2s'
                                                        }}
                                                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                                    >
                                                        {getColIcon(col.id)}
                                                        <span>{col.label}</span>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    <div style={{ height: '1px', background: 'var(--border-default)', margin: '4px 0' }} />

                                    {/* Create New Section (Essenciais) */}
                                    <div>
                                        <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>
                                            Criar Novo (Essenciais)
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                                            {/* Status */}
                                            <div 
                                                onClick={() => { createCustomColumn('status'); setShowColDropdown(false); }}
                                                style={{ 
                                                    display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 8px', 
                                                    fontSize: '11px', color: 'var(--text-primary)', cursor: 'pointer', 
                                                    borderRadius: '4px', border: '1px solid var(--border-default)', background: 'var(--bg-primary)'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-primary)'}
                                            >
                                                <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <div style={{ width: '8px', height: '8px', border: '1.5px solid white', borderRadius: '1px' }}></div>
                                                </div>
                                                <span>Status</span>
                                            </div>
                                            {/* Dropdown */}
                                            <div 
                                                onClick={() => { createCustomColumn('dropdown'); setShowColDropdown(false); }}
                                                style={{ 
                                                    display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 8px', 
                                                    fontSize: '11px', color: 'var(--text-primary)', cursor: 'pointer', 
                                                    borderRadius: '4px', border: '1px solid var(--border-default)', background: 'var(--bg-primary)'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-primary)'}
                                            >
                                                <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <ChevronDown size={10} color="white" />
                                                </div>
                                                <span>Lista sup.</span>
                                            </div>
                                            {/* Texto */}
                                            <div 
                                                onClick={() => { createCustomColumn('text'); setShowColDropdown(false); }}
                                                style={{ 
                                                    display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 8px', 
                                                    fontSize: '11px', color: 'var(--text-primary)', cursor: 'pointer', 
                                                    borderRadius: '4px', border: '1px solid var(--border-default)', background: 'var(--bg-primary)'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-primary)'}
                                            >
                                                <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '10px' }}>
                                                    T
                                                </div>
                                                <span>Texto</span>
                                            </div>
                                            {/* Data */}
                                            <div 
                                                onClick={() => { createCustomColumn('date'); setShowColDropdown(false); }}
                                                style={{ 
                                                    display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 8px', 
                                                    fontSize: '11px', color: 'var(--text-primary)', cursor: 'pointer', 
                                                    borderRadius: '4px', border: '1px solid var(--border-default)', background: 'var(--bg-primary)'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-primary)'}
                                            >
                                                <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <div style={{ width: '8px', height: '8px', border: '1.5px solid white', borderTop: 'none', position: 'relative' }}>
                                                        <div style={{ position: 'absolute', top: -3, left: 0, right: 0, height: 1.5, background: 'white' }}></div>
                                                    </div>
                                                </div>
                                                <span>Data</span>
                                            </div>
                                            {/* Pessoas */}
                                            <div 
                                                onClick={() => { createCustomColumn('people'); setShowColDropdown(false); }}
                                                style={{ 
                                                    display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 8px', 
                                                    fontSize: '11px', color: 'var(--text-primary)', cursor: 'pointer', 
                                                    borderRadius: '4px', border: '1px solid var(--border-default)', background: 'var(--bg-primary)'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-primary)'}
                                            >
                                                <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <User size={10} color="white" />
                                                </div>
                                                <span>Pessoas</span>
                                            </div>
                                            {/* Numeros */}
                                            <div 
                                                onClick={() => { createCustomColumn('number'); setShowColDropdown(false); }}
                                                style={{ 
                                                    display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 8px', 
                                                    fontSize: '11px', color: 'var(--text-primary)', cursor: 'pointer', 
                                                    borderRadius: '4px', border: '1px solid var(--border-default)', background: 'var(--bg-primary)'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-primary)'}
                                            >
                                                <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: '#eab308', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '9px' }}>
                                                    123
                                                </div>
                                                <span>Números</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Data Rows */}
                    {leads.map(lead => {
                        const isSelected = selectedIds.includes(lead.id);
                        return (
                            <div 
                                key={lead.id} 
                                className="row-hover" 
                                style={{ 
                                    display: 'grid', 
                                    gridTemplateColumns, 
                                    borderBottom: '1px solid var(--border-default)', 
                                    height: '34px', 
                                    background: isSelected ? 'rgba(14, 165, 233, 0.05)' : 'var(--bg-primary)',
                                    boxShadow: isSelected ? 'inset 0 0 0 1px #0ea5e9' : 'none',
                                    position: 'relative',
                                    zIndex: activeRowDropdown === lead.id ? 50 : (isSelected ? 2 : 1)
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid var(--border-default)', background: 'var(--bg-secondary)' }}>
                                    <input 
                                        type="checkbox" 
                                        checked={selectedIds.includes(lead.id)}
                                        onChange={() => {
                                            setSelectedIds(prev => 
                                                prev.includes(lead.id) 
                                                    ? prev.filter(id => id !== lead.id) 
                                                    : [...prev, lead.id]
                                            );
                                        }}
                                        style={{ cursor: 'pointer', width: '12px', height: '12px' }} 
                                    />
                                </div>
                                
                                <div style={{ padding: '0 12px', display: 'flex', alignItems: 'center', borderRight: '1px solid var(--border-default)', gap: '6px', position: 'relative' }}>
                                    <div style={{ borderLeft: `3px solid ${color}`, height: '100%', position: 'absolute', left: 0 }} />
                                    <div style={{ width: '4px' }}></div> {/* Spacer for the left border */}
                                    
                                    {/* Inline Edit for Title */}
                                    <div style={{ flex: 1, overflow: 'hidden' }}>
                                        <InlineEdit value={lead.title} onSave={(val) => updateLead(lead.id, { title: val })} style={{ fontWeight: 500 }} />
                                    </div>
 
                                    {/* Open Task Modal Button */}
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setSelectedLeadId(lead.id); }}
                                        style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-default)', borderRadius: '4px', color: 'var(--text-secondary)', cursor: 'pointer', padding: '2px 4px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px' }}
                                        title="Abrir detalhes"
                                    >
                                        <Maximize2 size={10} /> Abrir
                                    </button>
                                </div>
                                
                                {columns.map(col => {
                                    if (col.startsWith('custom_status_')) {
                                        return (
                                            <div key={col} style={{ borderRight: '1px solid var(--border-default)', height: '100%' }}>
                                                <CustomDropdown 
                                                    value={(lead as any)[col] || 'Novo'} 
                                                    options={AVAILABLE_STATUS}
                                                    onChange={(val) => updateLead(lead.id, { [col]: val })}
                                                    onOpenChange={(isOpen) => setActiveRowDropdown(isOpen ? lead.id : null)}
                                                />
                                            </div>
                                        );
                                    }
                                    if (col.startsWith('custom_dropdown_')) {
                                        const options = [
                                            { label: 'Opção 1', color: '#0ea5e9' },
                                            { label: 'Opção 2', color: '#8b5cf6' },
                                            { label: 'Opção 3', color: '#f59e0b' }
                                        ];
                                        return (
                                            <div key={col} style={{ borderRight: '1px solid var(--border-default)', height: '100%' }}>
                                                <CustomDropdown 
                                                    value={(lead as any)[col] || 'Opção 1'} 
                                                    options={options}
                                                    onChange={(val) => updateLead(lead.id, { [col]: val })}
                                                    onOpenChange={(isOpen) => setActiveRowDropdown(isOpen ? lead.id : null)}
                                                />
                                            </div>
                                        );
                                    }
                                    if (col.startsWith('custom_text_')) {
                                        return (
                                            <div key={col} style={{ padding: '0 8px', display: 'flex', alignItems: 'center', borderRight: '1px solid var(--border-default)', height: '100%' }}>
                                                <InlineEdit 
                                                    value={(lead as any)[col] || ''} 
                                                    onSave={(val) => updateLead(lead.id, { [col]: val })} 
                                                    placeholder="Digitar..." 
                                                />
                                            </div>
                                        );
                                    }
                                    if (col.startsWith('custom_date_')) {
                                        const timestamp = (lead as any)[col] || null;
                                        const { label, color } = getRelativeDeadline(timestamp);
                                        return (
                                            <div key={col} style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid var(--border-default)', height: '100%', padding: '0 4px' }}>
                                                <span style={{ fontSize: '11px', color, fontWeight: timestamp ? 600 : 400, pointerEvents: 'none' }}>
                                                    {label}
                                                </span>
                                                <input 
                                                    type="date"
                                                    value={timestamp ? new Date(timestamp).toISOString().split('T')[0] : ''}
                                                    onChange={(e) => updateLead(lead.id, { [col]: e.target.value ? new Date(e.target.value).getTime() : null })}
                                                    style={{ 
                                                        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
                                                        opacity: 0, cursor: 'pointer' 
                                                    }}
                                                />
                                            </div>
                                        );
                                    }
                                    if (col.startsWith('custom_people_')) {
                                        const val = (lead as any)[col] || '';
                                        return (
                                            <div key={col} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid var(--border-default)', height: '100%' }}>
                                                <InlineEdit 
                                                    value={val} 
                                                    onSave={(newVal) => updateLead(lead.id, { [col]: newVal })} 
                                                    placeholder="Pessoas..." 
                                                    style={{ textAlign: 'center' }}
                                                />
                                            </div>
                                        );
                                    }
                                    if (col.startsWith('custom_number_')) {
                                        return (
                                            <div key={col} style={{ padding: '0 8px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', borderRight: '1px solid var(--border-default)', fontFamily: 'monospace', height: '100%' }}>
                                                <InlineEdit 
                                                    type="number" 
                                                    value={(lead as any)[col] || 0} 
                                                    onSave={(val) => updateLead(lead.id, { [col]: Number(val) })} 
                                                    style={{ textAlign: 'right' }} 
                                                    placeholder="0" 
                                                />
                                            </div>
                                        );
                                    }
                                    if (col === 'status') {
                                        return (
                                            <div key={col} style={{ borderRight: '1px solid var(--border-default)', height: '100%' }}>
                                                <CustomDropdown 
                                                    value={lead.status} 
                                                    options={AVAILABLE_STATUS}
                                                    onChange={(val) => updateLead(lead.id, { status: val })}
                                                    onOpenChange={(isOpen) => setActiveRowDropdown(isOpen ? lead.id : null)}
                                                />
                                            </div>
                                        );
                                    }
                                    if (col === 'assignee') {
                                        return (
                                            <div key={col} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid var(--border-default)' }}>
                                                {lead.assignee && lead.assignee !== 'Não atribuído' ? (
                                                    <div title={lead.assignee} style={{ width: 22, height: 22, borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 'bold', color: '#fff' }}>
                                                        {lead.assignee.charAt(0).toUpperCase()}
                                                    </div>
                                                ) : (
                                                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'transparent', border: '1px dashed var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', cursor: 'pointer' }}>
                                                        <User size={12} />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    }
                                    if (col === 'deadline') {
                                        const { label, color } = getRelativeDeadline(lead.deadline || null);
                                        return (
                                            <div key={col} style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid var(--border-default)', height: '100%', padding: '0 4px' }}>
                                                <span style={{ fontSize: '11px', color, fontWeight: lead.deadline ? 600 : 400, pointerEvents: 'none' }}>
                                                    {label}
                                                </span>
                                                <input 
                                                    type="date"
                                                    value={lead.deadline ? new Date(lead.deadline).toISOString().split('T')[0] : ''}
                                                    onChange={(e) => updateLead(lead.id, { deadline: e.target.value ? new Date(e.target.value).getTime() : null })}
                                                    style={{ 
                                                        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
                                                        opacity: 0, cursor: 'pointer' 
                                                    }}
                                                />
                                            </div>
                                        );
                                    }
                                    if (col === 'priority') {
                                        const prioOptions = [
                                            { label: 'Alta', color: PRIORITY_COLORS['Alta'] },
                                            { label: 'Média', color: PRIORITY_COLORS['Média'] },
                                            { label: 'Baixa', color: PRIORITY_COLORS['Baixa'] },
                                        ];
                                        return (
                                            <div key={col} style={{ borderRight: '1px solid var(--border-default)', height: '100%' }}>
                                                <CustomDropdown 
                                                    value={lead.priority || 'Média'} 
                                                    options={prioOptions}
                                                    onChange={(val) => updateLead(lead.id, { priority: val as MarketingPriority })}
                                                    onOpenChange={(isOpen) => setActiveRowDropdown(isOpen ? lead.id : null)}
                                                />
                                            </div>
                                        );
                                    }
                                    if (col === 'notes') {
                                        return (
                                            <div key={col} style={{ padding: '0 8px', display: 'flex', alignItems: 'center', borderRight: '1px solid var(--border-default)' }}>
                                                <InlineEdit value={lead.notes || ''} onSave={(val) => updateLead(lead.id, { notes: val })} placeholder="Adicionar nota..." />
                                            </div>
                                        );
                                    }
                                    if (col === 'budget') {
                                        return (
                                            <div key={col} style={{ padding: '0 8px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', borderRight: '1px solid var(--border-default)', fontFamily: 'monospace' }}>
                                                <InlineEdit type="number" value={lead.budget || 0} onSave={(val) => updateLead(lead.id, { budget: Number(val) })} style={{ textAlign: 'right' }} placeholder="R$ 0" />
                                            </div>
                                        );
                                    }
                                    if (col === 'files') {
                                        return (
                                            <div key={col} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', borderRight: '1px solid var(--border-default)', cursor: 'pointer' }}>
                                                <ImageIcon size={14} />
                                            </div>
                                        );
                                    }
                                    return <div key={col} style={{ borderRight: '1px solid var(--border-default)' }}></div>;
                                })}
                                <div></div>
                            </div>
                        );
                    })}

                    {/* Add New Row (using EXACT gridTemplateColumns to prevent layout breakage) */}
                    <div style={{ display: 'grid', gridTemplateColumns, borderBottom: '1px solid var(--border-default)', height: '34px', background: 'var(--bg-primary)' }}>
                        <div style={{ borderRight: '1px solid var(--border-default)', height: '100%', borderLeft: `3px solid ${color}`, background: 'var(--bg-secondary)' }}></div>
                        <div style={{ padding: '0 12px', display: 'flex', alignItems: 'center', borderRight: '1px solid var(--border-default)', height: '100%' }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                width: '100%',
                                height: '26px',
                                padding: '0 8px',
                                borderRadius: '6px',
                                border: isInputFocused ? '1px solid #7c3aed' : '1px solid transparent',
                                background: isInputFocused ? 'var(--bg-secondary)' : 'transparent',
                                transition: 'all 0.15s ease'
                            }}>
                                <input 
                                    type="text" 
                                    placeholder="+ Adicionar tarefa (Aperte Enter)" 
                                    value={newTaskTitle}
                                    onChange={(e) => setNewTaskTitle(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddLead()}
                                    onBlur={() => { handleAddLead(); setIsInputFocused(false); }}
                                    onFocus={() => setIsInputFocused(true)}
                                    style={{ 
                                        background: 'transparent', 
                                        border: 'none', 
                                        color: 'var(--text-primary)', 
                                        outline: 'none', 
                                        width: '100%', 
                                        fontSize: '12px',
                                        height: '100%'
                                    }}
                                />
                            </div>
                        </div>
                        {/* Fill the rest of the columns with empty divs to maintain grid integrity */}
                        {columns.map(col => <div key={col} style={{ borderRight: '1px solid var(--border-default)' }}></div>)}
                        <div></div>
                    </div>

                    {/* Footer Row (Totals) */}
                    <div style={{ 
                        display: 'grid', gridTemplateColumns, alignItems: 'center', fontSize: '11px', 
                        color: 'var(--text-secondary)', background: 'var(--bg-primary)', height: '38px',
                        borderBottomLeftRadius: '6px', borderBottomRightRadius: '6px'
                    }}>
                        <div></div><div></div>
                        {columns.map(col => {
                            if (col === 'status') {
                                return (
                                    <div key={col} style={{ display: 'flex', height: '100%', alignItems: 'flex-end', padding: '0 10%' }}>
                                        <div style={{ width: '100%', height: '24px', background: color, borderTopLeftRadius: 6, borderTopRightRadius: 6, opacity: 0.8 }}></div>
                                    </div>
                                );
                            }
                            if (col === 'budget') {
                                return (
                                    <div key={col} style={{ padding: '4px 8px', textAlign: 'right', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(totalBudget)}
                                        <div style={{ fontSize: '9px', color: 'var(--text-tertiary)', fontWeight: 400, marginTop: '-2px' }}>Total</div>
                                    </div>
                                );
                            }
                            if (col === 'files') {
                                return (
                                    <div key={col} style={{ padding: '4px 8px', textAlign: 'center', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                        {totalFiles}
                                        <div style={{ fontSize: '9px', color: 'var(--text-tertiary)', fontWeight: 400, marginTop: '-2px' }}>Arquivos</div>
                                    </div>
                                );
                            }
                            return <div key={col}></div>;
                        })}
                        <div></div>
                    </div>
                </div>
            )}
        </div>
    );
};

const CRMList: React.FC = () => {
    const { activeBoard, activeGroups, activeLeads, updateBoard, addGroup, updateLead, deleteLead } = useCRMState();
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const [columnWidths, setColumnWidths] = useState<Record<string, string>>(() => {
        try {
            const saved = localStorage.getItem('axe_crm_col_widths');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.task) {
                    if (parsed.task.endsWith('px')) {
                        const pxVal = parseInt(parsed.task, 10);
                        if (pxVal < 150) {
                            parsed.task = '150px';
                        }
                    }
                    return parsed;
                }
            }
        } catch {}
        
        return {
            'task': '50%',
            'status': '120px',
            'assignee': '100px',
            'deadline': '110px',
            'priority': '100px',
            'notes': '180px',
            'budget': '110px',
            'files': '80px'
        };
    });

    const startResize = (e: React.MouseEvent, colId: string) => {
        e.preventDefault();
        const headerCell = e.currentTarget.parentElement;
        if (!headerCell) return;
        
        const startX = e.clientX;
        const startWidth = headerCell.getBoundingClientRect().width;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const dx = moveEvent.clientX - startX;
            const minW = colId === 'task' ? 150 : 80;
            const newWidth = Math.max(minW, startWidth + dx);
            setColumnWidths(prev => ({
                ...prev,
                [colId]: `${newWidth}px`
            }));
        };

        const handleMouseUp = () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            // Save to localStorage
            setColumnWidths(current => {
                localStorage.setItem('axe_crm_col_widths', JSON.stringify(current));
                return current;
            });
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    const createCustomColumn = (type: 'status' | 'dropdown' | 'text' | 'date' | 'people' | 'number') => {
        if (!activeBoard) return;
        const uuid = Math.random().toString(36).substring(2, 9);
        const colId = `custom_${type}_${uuid}`;
        
        let defaultLabel = '';
        let defaultValue: any = undefined;
        if (type === 'status') {
            defaultLabel = 'Status Novo';
            defaultValue = 'Novo';
        }
        else if (type === 'dropdown') {
            defaultLabel = 'Lista suspensa';
            defaultValue = 'Opção 1';
        }
        else if (type === 'text') defaultLabel = 'Texto';
        else if (type === 'date') defaultLabel = 'Data';
        else if (type === 'people') defaultLabel = 'Pessoas';
        else if (type === 'number') defaultLabel = 'Números';

        const currentColumns = activeBoard.columns || ['status'];
        const updatedColumns = [...currentColumns, colId];
        const updatedNames = {
            ...(activeBoard.customColumnNames || {}),
            [colId]: defaultLabel
        };

        updateBoard(activeBoard.id, {
            columns: updatedColumns,
            customColumnNames: updatedNames
        });

        if (defaultValue !== undefined) {
            activeLeads.forEach(lead => {
                updateLead(lead.id, { [colId]: defaultValue });
            });
        }
    };
    
    if (!activeBoard) return null;

    const columns = activeBoard.columns || ['status'];

    const addColumn = (colId: string) => {
        if (!columns.includes(colId)) {
            updateBoard(activeBoard.id, { columns: [...columns, colId] });
            
            activeLeads.forEach(lead => {
                if (colId === 'priority' && !lead.priority) {
                    updateLead(lead.id, { priority: 'Média' });
                } else if (colId === 'status' && !lead.status) {
                    updateLead(lead.id, { status: 'Novo' });
                } else if (colId === 'assignee' && !lead.assignee) {
                    updateLead(lead.id, { assignee: 'Não atribuído' });
                } else if (colId === 'budget' && (lead.budget === undefined || lead.budget === null)) {
                    updateLead(lead.id, { budget: 0 });
                } else if (colId === 'notes' && !lead.notes) {
                    updateLead(lead.id, { notes: '' });
                }
            });
        }
    };

    const handleCreateGroup = () => {
        // Find highest order
        const colorPalette = ['#0ea5e9', '#f59e0b', '#8b5cf6', '#ef4444', '#10b981', '#ec4899'];
        const color = colorPalette[activeGroups.length % colorPalette.length];
        addGroup(activeBoard.id, 'Novo Grupo', color);
    };

    return (
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto', padding: '24px 32px', position: 'relative' }}>
            {/* Column Manager hidden from top - moved to popover */}

            {activeGroups.map(group => (
                <ListGroup 
                    key={group.id} 
                    group={group} 
                    leads={activeLeads.filter(l => l.groupId === group.id)} 
                    columns={columns}
                    selectedIds={selectedIds}
                    setSelectedIds={setSelectedIds}
                    addColumn={addColumn}
                    columnWidths={columnWidths}
                    startResize={startResize}
                    createCustomColumn={createCustomColumn}
                />
            ))}

            <div style={{ marginTop: '16px', marginBottom: selectedIds.length > 0 ? '60px' : '0' }}>
                <button 
                    onClick={handleCreateGroup}
                    style={{ background: 'transparent', border: '1px dashed var(--border-default)', padding: '8px 16px', borderRadius: '6px', color: 'var(--text-secondary)', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--text-tertiary)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-default)'; }}
                >
                    <Plus size={14} /> Adicionar novo grupo
                </button>
            </div>

            {/* Floating Bulk Action Bar */}
            {selectedIds.length > 0 && (
                <div style={{
                    position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
                    background: 'var(--bg-secondary)', border: '1px solid var(--border-focus)',
                    borderRadius: '8px', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '16px',
                    boxShadow: 'var(--shadow-xl)', zIndex: 999, animation: 'fadeIn 0.2s ease-out'
                }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {selectedIds.length} {selectedIds.length === 1 ? 'tarefa selecionada' : 'tarefas selecionadas'}
                    </span>
                    <div style={{ width: '1px', height: '20px', background: 'var(--border-default)' }}></div>
                    
                    {/* Action: Move to Group */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Mover para:</span>
                        <select 
                            onChange={(e) => {
                                const newGroupId = e.target.value;
                                if (newGroupId) {
                                    const targetGroup = activeGroups.find(g => g.id === newGroupId);
                                    selectedIds.forEach(id => {
                                        updateLead(id, { 
                                            groupId: newGroupId,
                                            status: targetGroup ? targetGroup.title : 'Novo'
                                        });
                                    });
                                    setSelectedIds([]);
                                }
                            }}
                            defaultValue=""
                            style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-default)', borderRadius: '4px', padding: '4px 8px', fontSize: '12px', color: 'var(--text-primary)', outline: 'none' }}
                        >
                            <option value="" disabled>Selecionar...</option>
                            {activeGroups.map(g => (
                                <option key={g.id} value={g.id}>{g.title}</option>
                            ))}
                        </select>
                    </div>

                    {/* Action: Change Priority */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Prioridade:</span>
                        <select 
                            onChange={(e) => {
                                const newPriority = e.target.value as MarketingPriority;
                                if (newPriority) {
                                    selectedIds.forEach(id => {
                                        updateLead(id, { priority: newPriority });
                                    });
                                    setSelectedIds([]);
                                }
                            }}
                            defaultValue=""
                            style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-default)', borderRadius: '4px', padding: '4px 8px', fontSize: '12px', color: 'var(--text-primary)', outline: 'none' }}
                        >
                            <option value="" disabled>Selecionar...</option>
                            <option value="Alta">Alta</option>
                            <option value="Média">Média</option>
                            <option value="Baixa">Baixa</option>
                        </select>
                    </div>

                    {/* Action: Delete */}
                    <button 
                        onClick={() => {
                            if (confirm(`Tem certeza que deseja excluir as ${selectedIds.length} tarefas selecionadas?`)) {
                                selectedIds.forEach(id => {
                                    deleteLead(id);
                                });
                                setSelectedIds([]);
                            }
                        }}
                        style={{ background: '#ef4444', color: 'white', padding: '6px 12px', borderRadius: '4px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                        <Trash2 size={14} /> Excluir
                    </button>

                    <div style={{ width: '1px', height: '20px', background: 'var(--border-default)' }}></div>
                    
                    <button 
                        onClick={() => setSelectedIds([])}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px' }}
                    >
                        Desmarcar tudo
                    </button>
                </div>
            )}
        </div>
    );
};

export default CRMList;
