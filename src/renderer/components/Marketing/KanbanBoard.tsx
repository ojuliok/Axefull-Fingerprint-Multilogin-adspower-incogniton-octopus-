import React, { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { useCRMState } from './CRMContext';
import KanbanColumn from './KanbanColumn';
import KanbanCard from './KanbanCard';
import styles from '../../pages/MarketingPage.module.css';

const KanbanBoard: React.FC = () => {
    const { activeLeads, activeGroups, moveLead, deleteLead, addGroup, activeBoard } = useCRMState();
    const [activeId, setActiveId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        if (activeId === overId) return;

        const isActiveCard = active.data.current?.type !== 'Column';
        const isOverColumn = activeGroups.map(g => g.id).includes(overId as string);
        
        if (isActiveCard && isOverColumn) {
            const currentLead = activeLeads.find(l => l.id === activeId);
            if (currentLead && currentLead.groupId !== overId) {
                moveLead(activeId as string, overId as string);
            }
        } else if (isActiveCard) {
            // Over another card
            const overLead = activeLeads.find(l => l.id === overId);
            const currentLead = activeLeads.find(l => l.id === activeId);
            
            if (overLead && currentLead && overLead.groupId !== currentLead.groupId) {
                moveLead(activeId as string, overLead.groupId);
            }
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        setActiveId(null);
    };

    const activeCard = activeId ? activeLeads.find(c => c.id === activeId) : null;

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div className={styles.boardContainer}>
                {activeGroups.map(group => (
                    <KanbanColumn
                        key={group.id}
                        id={group.id}
                        title={group.title}
                        cards={activeLeads.filter(c => c.groupId === group.id)}
                        onDeleteCard={deleteLead}
                    />
                ))}

                {/* Add Column Button */}
                <div style={{ flex: '0 0 280px', display: 'flex', flexDirection: 'column' }}>
                    <button 
                        onClick={() => {
                            const colorPalette = ['#0ea5e9', '#f59e0b', '#8b5cf6', '#ef4444', '#10b981', '#ec4899'];
                            const color = colorPalette[activeGroups.length % colorPalette.length];
                            if (activeBoard) addGroup(activeBoard.id, 'Nova Coluna', color);
                        }}
                        style={{ 
                            background: 'transparent', border: '1px dashed var(--border-default)', 
                            borderRadius: '12px', padding: '16px', color: 'var(--text-secondary)', 
                            fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', 
                            justifyContent: 'center', gap: '8px', height: '54px', transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--text-tertiary)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-default)'; }}
                    >
                        <Plus size={16} /> Adicionar Coluna
                    </button>
                </div>
            </div>

            <DragOverlay>
                {activeCard ? <KanbanCard card={activeCard} onDelete={deleteLead} /> : null}
            </DragOverlay>
        </DndContext>
    );
};

export default KanbanBoard;
