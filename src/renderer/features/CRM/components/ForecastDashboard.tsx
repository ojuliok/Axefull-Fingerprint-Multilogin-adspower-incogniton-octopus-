import React from 'react';
import { usePipeline } from '../context/PipelineContext';
import { TrendingUp, DollarSign, Target, Activity } from 'lucide-react';

export const ForecastDashboard: React.FC = () => {
    const { deals, stages } = usePipeline();

    const totalDeals = deals.length;
    const wonDeals = deals.filter(d => d.status === 'won').length;
    const lostDeals = deals.filter(d => d.status === 'lost').length;
    const openDeals = totalDeals - wonDeals - lostDeals;

    const totalValue = deals.reduce((acc, d) => acc + d.deal_value, 0);
    const totalForecast = deals.reduce((acc, d) => acc + d.forecast_value, 0);
    const wonValue = deals.filter(d => d.status === 'won').reduce((acc, d) => acc + d.deal_value, 0);

    const winRate = totalDeals > 0 ? ((wonDeals / totalDeals) * 100).toFixed(1) : '0.0';

    return (
        <div style={{ padding: '20px', background: 'var(--bg-primary)', flex: 1, overflow: 'auto' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '20px' }}>Dashboard de Forecast</h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '10px', border: '1px solid var(--border-default)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                        <DollarSign size={16} /> <span style={{ fontSize: '13px', fontWeight: 500 }}>Valor Total (Pipeline)</span>
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </div>
                </div>

                <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '10px', border: '1px solid var(--border-default)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', marginBottom: '12px' }}>
                        <TrendingUp size={16} /> <span style={{ fontSize: '13px', fontWeight: 500 }}>Forecast (Ponderado)</span>
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: '#10b981' }}>
                        {totalForecast.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </div>
                </div>

                <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '10px', border: '1px solid var(--border-default)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#3b82f6', marginBottom: '12px' }}>
                        <Target size={16} /> <span style={{ fontSize: '13px', fontWeight: 500 }}>Valor Ganho (Won)</span>
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: '#3b82f6' }}>
                        {wonValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </div>
                </div>

                <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '10px', border: '1px solid var(--border-default)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b', marginBottom: '12px' }}>
                        <Activity size={16} /> <span style={{ fontSize: '13px', fontWeight: 500 }}>Taxa de Conversão</span>
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: '#f59e0b' }}>
                        {winRate}%
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                        {wonDeals} de {totalDeals} negócios
                    </div>
                </div>
            </div>

            <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '10px', border: '1px solid var(--border-default)' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>Funil de Vendas</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {stages.map(stage => {
                        const stageDeals = deals.filter(d => d.stage_id === stage.id);
                        const stageValue = stageDeals.reduce((acc, d) => acc + d.deal_value, 0);
                        const percentage = totalValue > 0 ? (stageValue / totalValue) * 100 : 0;

                        return (
                            <div key={stage.id} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{ width: '120px', fontSize: '13px', color: 'var(--text-secondary)' }}>{stage.name} ({stageDeals.length})</div>
                                <div style={{ flex: 1, background: 'var(--bg-tertiary)', height: '16px', borderRadius: '8px', overflow: 'hidden' }}>
                                    <div style={{ width: `${percentage}%`, height: '100%', background: stage.color || '#0ea5e9' }}></div>
                                </div>
                                <div style={{ width: '100px', textAlign: 'right', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                                    {stageValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
