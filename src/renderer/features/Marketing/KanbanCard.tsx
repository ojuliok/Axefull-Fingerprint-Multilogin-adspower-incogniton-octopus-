import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Trash2, Building2, User } from 'lucide-react';
import { MarketingCardData } from './marketingStorage';
import styles from '../../pages/MarketingPage.module.css';
import { useCRMState } from './CRMContext';

interface KanbanCardProps {
    card: MarketingCardData;
    onDelete: (id: string) => void;
}

const KanbanCard: React.FC<KanbanCardProps> = ({ card, onDelete }) => {
    const { setSelectedLeadId } = useCRMState();
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: card.id, data: { ...card } });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const formattedValue = card.budget 
        ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(card.budget)
        : null;

    const getPriorityColor = () => {
        if (card.priority === 'Alta') return '#ef4444';
        if (card.priority === 'Média') return '#f59e0b';
        return '#10b981';
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`${styles.card} ${isDragging ? styles.isDragging : ''}`}
            onClick={() => setSelectedLeadId(card.id)}
        >
            <button 
                className={styles.deleteCardBtn}
                onClick={(e) => { e.stopPropagation(); onDelete(card.id); }}
                title="Excluir"
            >
                <Trash2 size={14} />
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div style={{ flex: 1, paddingRight: '16px' }}>
                    <div className={styles.cardTitle} style={{ marginBottom: 4 }}>{card.title}</div>
                    {card.priority && (
                        <div style={{ display: 'inline-block', fontSize: '10px', fontWeight: 600, padding: '2px 6px', borderRadius: '4px', backgroundColor: `${getPriorityColor()}20`, color: getPriorityColor() }}>
                            {card.priority}
                        </div>
                    )}
                </div>
                
                {card.assignee && (
                    <div title={`Responsável: ${card.assignee}`} style={{ width: 24, height: 24, borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 'bold', color: '#fff', flexShrink: 0 }}>
                        {card.assignee.charAt(0).toUpperCase()}
                    </div>
                )}
            </div>
            
            {card.notes && (
                <div className={styles.cardDesc}>{card.notes}</div>
            )}
            
            <div className={styles.cardFooter}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <div className={styles.cardValue}>
                        {formattedValue || '-'}
                    </div>
                    {(() => {
                        if (!card.deadline) return null;
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const deadlineDate = new Date(card.deadline);
                        deadlineDate.setHours(0, 0, 0, 0);
                        const diffTime = deadlineDate.getTime() - today.getTime();
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        
                        let label = '';
                        let color = '';
                        if (diffDays < 0) {
                            label = `Atrasado (${deadlineDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })})`;
                            color = '#ef4444';
                        } else if (diffDays === 0) {
                            label = 'Hoje';
                            color = '#f59e0b';
                        } else if (diffDays === 1) {
                            label = 'Amanhã';
                            color = '#3b82f6';
                        } else {
                            label = deadlineDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
                            color = 'var(--text-secondary)';
                        }
                        return (
                            <div style={{ fontSize: '10px', color, fontWeight: 600 }}>
                                📅 {label}
                            </div>
                        );
                    })()}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {card.company && (
                        <div className={styles.cardMeta} title={`Empresa: ${card.company}`}>
                            <div className={styles.cardMetaIcon}><Building2 size={10} /></div>
                        </div>
                    )}
                    {card.contact && (
                        <div className={styles.cardMeta} title={`Contato: ${card.contact}`}>
                            <div className={styles.cardMetaIcon}><User size={10} /></div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default KanbanCard;
