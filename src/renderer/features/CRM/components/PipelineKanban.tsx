import React from 'react';
import { usePipeline } from '../context/PipelineContext';
import { Deal } from '../api/dealService';
import { Plus, MoreHorizontal } from 'lucide-react';
import { DndContext, DragOverlay, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const SortableDeal = ({ deal }: { deal: Deal }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: deal.id });
    
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        background: 'var(--bg-secondary)',
        padding: '12px',
        borderRadius: '8px',
        border: '1px solid var(--border-default)',
        marginBottom: '10px',
        cursor: 'grab',
        boxShadow: isDragging ? 'var(--shadow-md)' : 'none'
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)', marginBottom: '8px' }}>{deal.title}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Valor:</span>
                <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                    {deal.deal_value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: '4px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Forecast:</span>
                <span style={{ fontWeight: 500, color: '#10b981' }}>
                    {deal.forecast_value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
            </div>
        </div>
    );
};

export const PipelineKanban: React.FC = () => {
    const { stages, deals, moveDeal } = usePipeline();
    const [activeId, setActiveId] = React.useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor)
    );

    const handleDragStart = (event: any) => {
        setActiveId(event.active.id);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        setActiveId(null);
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        // active is deal, over could be deal or stage column
        const activeDeal = deals.find(d => d.id === activeId);
        if (!activeDeal) return;

        let toStageId = '';
        if (stages.find(s => s.id === overId)) {
            // Over a column
            toStageId = overId;
        } else {
            // Over another deal
            const overDeal = deals.find(d => d.id === overId);
            if (overDeal) {
                toStageId = overDeal.stage_id;
            }
        }

        if (toStageId && toStageId !== activeDeal.stage_id) {
            moveDeal(activeId, toStageId);
        }
    };

    return (
        <div style={{ display: 'flex', flex: 1, overflowX: 'auto', overflowY: 'hidden', padding: '20px', gap: '16px', background: 'var(--bg-primary)' }}>
            <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                {stages.map(stage => {
                    const stageDeals = deals.filter(d => d.stage_id === stage.id);
                    const totalValue = stageDeals.reduce((acc, d) => acc + d.deal_value, 0);
                    const totalForecast = stageDeals.reduce((acc, d) => acc + d.forecast_value, 0);

                    return (
                        <div key={stage.id} style={{
                            flex: '0 0 300px',
                            background: 'var(--bg-card)',
                            borderRadius: '10px',
                            border: '1px solid var(--border-default)',
                            display: 'flex',
                            flexDirection: 'column',
                            maxHeight: '100%'
                        }}>
                            {/* Column Header */}
                            <div style={{ padding: '16px', borderBottom: `2px solid ${stage.color || '#94a3b8'}` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{stage.name}</h3>
                                    <span style={{ fontSize: '12px', background: 'var(--bg-tertiary)', padding: '2px 8px', borderRadius: '12px', color: 'var(--text-secondary)' }}>
                                        {stageDeals.length}
                                    </span>
                                </div>
                                <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span>Valor</span>
                                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right' }}>
                                        <span>Forecast</span>
                                        <span style={{ fontWeight: 600, color: '#10b981' }}>{totalForecast.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Column Body */}
                            <div id={stage.id} style={{ padding: '16px', flex: 1, overflowY: 'auto' }}>
                                <SortableContext items={stageDeals.map(d => d.id)} strategy={verticalListSortingStrategy}>
                                    {stageDeals.map(deal => (
                                        <SortableDeal key={deal.id} deal={deal} />
                                    ))}
                                </SortableContext>
                                
                                <button style={{
                                    width: '100%', padding: '10px', background: 'transparent', border: '1px dashed var(--border-default)',
                                    borderRadius: '6px', color: 'var(--text-tertiary)', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', fontSize: '13px'
                                }}>
                                    <Plus size={14} /> Novo Deal
                                </button>
                            </div>
                        </div>
                    );
                })}
                <DragOverlay>
                    {activeId ? (
                        <SortableDeal deal={deals.find(d => d.id === activeId)!} />
                    ) : null}
                </DragOverlay>
            </DndContext>
        </div>
    );
};
