import React, { useState } from 'react';
import { usePipeline } from '../context/PipelineContext';
import { Deal } from '../api/dealService';
import { PipelineStage } from '../api/pipelineService';

export const PipelineList: React.FC = () => {
    const { deals, stages, updateDeal } = usePipeline();
    const [editingDealId, setEditingDealId] = useState<string | null>(null);

    const getStageName = (stageId: string) => {
        return stages.find(s => s.id === stageId)?.name || 'Sem Estágio';
    };

    const getStageColor = (stageId: string) => {
        return stages.find(s => s.id === stageId)?.color || '#94a3b8';
    };

    return (
        <div style={{ flex: 1, overflow: 'auto', background: 'var(--bg-primary)', padding: '20px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}>
                        <th style={{ padding: '10px 12px', fontWeight: 500 }}>Oportunidade (Deal)</th>
                        <th style={{ padding: '10px 12px', fontWeight: 500 }}>Estágio</th>
                        <th style={{ padding: '10px 12px', fontWeight: 500 }}>Valor (R$)</th>
                        <th style={{ padding: '10px 12px', fontWeight: 500 }}>Prob. (%)</th>
                        <th style={{ padding: '10px 12px', fontWeight: 500 }}>Forecast (R$)</th>
                        <th style={{ padding: '10px 12px', fontWeight: 500 }}>Data Prev.</th>
                        <th style={{ padding: '10px 12px', fontWeight: 500 }}>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {deals.map(deal => (
                        <tr key={deal.id} style={{ borderBottom: '1px solid var(--border-default)', color: 'var(--text-primary)' }}>
                            <td style={{ padding: '10px 12px', fontWeight: 500 }}>{deal.title}</td>
                            <td style={{ padding: '10px 12px' }}>
                                <select 
                                    value={deal.stage_id} 
                                    onChange={(e) => updateDeal(deal.id, { stage_id: e.target.value })}
                                    style={{
                                        background: getStageColor(deal.stage_id),
                                        color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 8px',
                                        fontSize: '12px', cursor: 'pointer', outline: 'none'
                                    }}
                                >
                                    {stages.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </td>
                            <td style={{ padding: '10px 12px' }}>
                                <input 
                                    type="number" 
                                    defaultValue={deal.deal_value}
                                    onBlur={(e) => updateDeal(deal.id, { deal_value: Number(e.target.value) })}
                                    style={{ background: 'transparent', border: '1px solid transparent', color: 'inherit', width: '80px', outline: 'none' }}
                                />
                            </td>
                            <td style={{ padding: '10px 12px' }}>
                                <input 
                                    type="number" 
                                    defaultValue={deal.close_probability}
                                    onBlur={(e) => updateDeal(deal.id, { close_probability: Number(e.target.value) })}
                                    style={{ background: 'transparent', border: '1px solid transparent', color: 'inherit', width: '50px', outline: 'none' }}
                                />
                            </td>
                            <td style={{ padding: '10px 12px', fontWeight: 600, color: '#10b981' }}>
                                {deal.forecast_value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </td>
                            <td style={{ padding: '10px 12px' }}>
                                <input 
                                    type="date" 
                                    defaultValue={deal.expected_close_date || ''}
                                    onChange={(e) => updateDeal(deal.id, { expected_close_date: e.target.value })}
                                    style={{ background: 'transparent', border: '1px solid transparent', color: 'inherit', outline: 'none' }}
                                />
                            </td>
                            <td style={{ padding: '10px 12px' }}>
                                <select 
                                    value={deal.status} 
                                    onChange={(e) => updateDeal(deal.id, { status: e.target.value as any })}
                                    style={{
                                        background: deal.status === 'won' ? '#10b981' : deal.status === 'lost' ? '#ef4444' : 'var(--bg-secondary)',
                                        color: deal.status !== 'open' ? '#fff' : 'inherit', border: '1px solid var(--border-default)', borderRadius: '4px', padding: '4px 8px',
                                        fontSize: '12px', cursor: 'pointer', outline: 'none'
                                    }}
                                >
                                    <option value="open">Aberto</option>
                                    <option value="won">Ganho</option>
                                    <option value="lost">Perdido</option>
                                </select>
                            </td>
                        </tr>
                    ))}
                    {deals.length === 0 && (
                        <tr>
                            <td colSpan={7} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-tertiary)' }}>
                                Nenhuma oportunidade neste pipeline.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};
