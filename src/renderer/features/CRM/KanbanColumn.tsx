import React, { useState, useRef, useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus, MoreVertical } from 'lucide-react';
import { MarketingCardData } from './crmStorage';
import KanbanCard from './KanbanCard';
import styles from '../../pages/CRMPage.module.css';
import { useCRMState } from './CRMContext';

interface KanbanColumnProps {
    id: string;
    title: string;
    cards: MarketingCardData[];
    onDeleteCard: (id: string) => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ id, title, cards, onDeleteCard }) => {
    const { addLead, activeBoard, updateGroup, deleteGroup, activeGroups } = useCRMState();
    const [isAdding, setIsAdding] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(title);
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const { setNodeRef } = useDroppable({
        id: id,
    });

    useEffect(() => {
        if (isAdding && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isAdding]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setShowMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleAddSubmit = () => {
        if (newTitle.trim() && activeBoard) {
            addLead(activeBoard.id, id, newTitle.trim());
        }
        setNewTitle('');
        setIsAdding(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleAddSubmit();
        } else if (e.key === 'Escape') {
            setIsAdding(false);
            setNewTitle('');
        }
    };

    const handleRename = () => {
        if (editTitle.trim()) {
            updateGroup(id, { title: editTitle.trim() });
            setIsEditing(false);
        }
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm(`Tem certeza que deseja excluir o grupo "${title}" e todas as suas tarefas?`)) {
            deleteGroup(id);
        }
    };

    const handleColorChange = (newColor: string) => {
        updateGroup(id, { color: newColor });
        setShowMenu(false);
    };

    const colorPalette = ['#0ea5e9', '#f59e0b', '#8b5cf6', '#ef4444', '#10b981', '#ec4899', '#64748b'];
    const group = activeGroups.find(g => g.id === id);

    return (
        <div className={styles.column}>
            <div className={styles.columnHeader} style={{ position: 'relative' }}>
                <div className={styles.columnTitleWrap} style={{ flex: 1, minWidth: 0 }}>
                    <div 
                        className={styles.statusIndicator} 
                        style={{ 
                            backgroundColor: group?.color || '#0ea5e9', 
                            boxShadow: `0 0 10px ${(group?.color || '#0ea5e9')}60`,
                            width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0
                        }} 
                    />
                    {isEditing ? (
                        <input 
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onBlur={handleRename}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleRename();
                                if (e.key === 'Escape') { setEditTitle(title); setIsEditing(false); }
                            }}
                            autoFocus
                            style={{
                                background: 'var(--bg-secondary)', border: '1px solid var(--border-focus)',
                                padding: '2px 4px', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', outline: 'none',
                                borderRadius: '4px', width: '100%'
                            }}
                        />
                    ) : (
                        <span className={styles.columnTitle} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</span>
                    )}
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span className={styles.columnCount}>{cards.length}</span>
                    {!isEditing && (
                        <div style={{ position: 'relative' }} ref={menuRef}>
                            <button 
                                onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                            >
                                <MoreVertical size={14} />
                            </button>
                            {showMenu && (
                                <div style={{
                                    position: 'absolute', top: '100%', right: 0, background: 'var(--bg-card)',
                                    border: '1px solid var(--border-default)', borderRadius: '6px', padding: '6px',
                                    zIndex: 100, width: '150px', boxShadow: 'var(--shadow-md)', display: 'flex', flexDirection: 'column', gap: '4px'
                                }}>
                                    <div 
                                        onClick={(e) => { e.stopPropagation(); setIsEditing(true); setShowMenu(false); }}
                                        style={{ padding: '6px 8px', fontSize: '12px', color: 'var(--text-primary)', cursor: 'pointer', borderRadius: '4px' }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        Renomear coluna
                                    </div>
                                    <div 
                                        onClick={handleDelete}
                                        style={{ padding: '6px 8px', fontSize: '12px', color: '#ef4444', cursor: 'pointer', borderRadius: '4px' }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        Excluir coluna
                                    </div>
                                    <div style={{ height: '1px', background: 'var(--border-default)', margin: '4px 0' }}></div>
                                    <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', padding: '0 8px 4px 8px' }}>Mudar cor:</div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', padding: '0 8px' }}>
                                        {colorPalette.map(c => (
                                            <div 
                                                key={c} 
                                                onClick={() => handleColorChange(c)}
                                                style={{ width: '16px', height: '16px', borderRadius: '50%', background: c, cursor: 'pointer', border: c === (group?.color || '') ? '2px solid white' : 'none' }}
                                                title={c}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            
            <SortableContext id={id} items={cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
                <div ref={setNodeRef} className={styles.columnList}>
                    {cards.map((card) => (
                        <KanbanCard key={card.id} card={card} onDelete={onDeleteCard} />
                    ))}
                    {isAdding && (
                        <div style={{ padding: '8px', background: '#27272a', borderRadius: '8px', border: '1px solid #0ea5e9' }}>
                            <input 
                                ref={inputRef}
                                type="text"
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                                onKeyDown={handleKeyDown}
                                onBlur={() => {
                                    if(newTitle.trim()) handleAddSubmit();
                                    else setIsAdding(false);
                                }}
                                placeholder="Nome do lead..."
                                style={{
                                    width: '100%',
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#fff',
                                    outline: 'none',
                                    fontSize: '14px'
                                }}
                            />
                        </div>
                    )}
                </div>
            </SortableContext>
            
            {!isAdding && (
                <button className={styles.addCardBtn} onClick={() => setIsAdding(true)}>
                    <Plus size={14} /> Adicionar Lead
                </button>
            )}
        </div>
    );
};

export default KanbanColumn;
