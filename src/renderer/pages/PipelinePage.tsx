import React, { useState } from 'react';
import { PipelineProvider, usePipeline } from '../features/CRM/context/PipelineContext';
import { PipelineList } from '../features/CRM/components/PipelineList';
import { PipelineKanban } from '../features/CRM/components/PipelineKanban';
import { ContactsAccounts } from '../features/CRM/components/ContactsAccounts';
import { ForecastDashboard } from '../features/CRM/components/ForecastDashboard';
import { LayoutGrid, List, Plus, Search, Filter, Loader2, Users, TrendingUp } from 'lucide-react';

const PipelineHeader: React.FC<{
    viewMode: 'kanban' | 'list' | 'contacts' | 'dashboard';
    setViewMode: (v: 'kanban' | 'list' | 'contacts' | 'dashboard') => void;
}> = ({ viewMode, setViewMode }) => {
    const { activePipeline, isLoading, addPipeline } = usePipeline();

    return (
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border-default)', background: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {activePipeline ? activePipeline.name : 'Pipelines (CRM)'}
                        </h1>
                        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                            {activePipeline ? activePipeline.code : 'Gerencie suas oportunidades'}
                        </span>
                    </div>
                    {isLoading && <Loader2 size={16} className="animate-spin" style={{ color: 'var(--text-tertiary)' }} />}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button 
                        onClick={() => addPipeline('Novo Pipeline', 'NOVO-' + Date.now())}
                        style={{ background: '#0ea5e9', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                        <Plus size={16} /> Criar Pipeline
                    </button>
                </div>
            </div>

            {activePipeline && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-tertiary)', padding: '4px', borderRadius: '8px' }}>
                        <button 
                            onClick={() => setViewMode('list')}
                            style={{ 
                                display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '6px', border: 'none', fontSize: '13px', cursor: 'pointer',
                                background: viewMode === 'list' ? 'var(--bg-card)' : 'transparent',
                                color: viewMode === 'list' ? 'var(--text-primary)' : 'var(--text-secondary)',
                                boxShadow: viewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                fontWeight: viewMode === 'list' ? 600 : 400
                            }}
                        >
                            <List size={16} /> Tabela
                        </button>
                        <button 
                            onClick={() => setViewMode('kanban')}
                            style={{ 
                                display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '6px', border: 'none', fontSize: '13px', cursor: 'pointer',
                                background: viewMode === 'kanban' ? 'var(--bg-card)' : 'transparent',
                                color: viewMode === 'kanban' ? 'var(--text-primary)' : 'var(--text-secondary)',
                                boxShadow: viewMode === 'kanban' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                fontWeight: viewMode === 'kanban' ? 600 : 400
                            }}
                        >
                            <LayoutGrid size={16} /> Kanban
                        </button>
                        <button 
                            onClick={() => setViewMode('contacts')}
                            style={{ 
                                display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '6px', border: 'none', fontSize: '13px', cursor: 'pointer',
                                background: viewMode === 'contacts' ? 'var(--bg-card)' : 'transparent',
                                color: viewMode === 'contacts' ? 'var(--text-primary)' : 'var(--text-secondary)',
                                boxShadow: viewMode === 'contacts' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                fontWeight: viewMode === 'contacts' ? 600 : 400
                            }}
                        >
                            <Users size={16} /> Contatos
                        </button>
                        <button 
                            onClick={() => setViewMode('dashboard')}
                            style={{ 
                                display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '6px', border: 'none', fontSize: '13px', cursor: 'pointer',
                                background: viewMode === 'dashboard' ? 'var(--bg-card)' : 'transparent',
                                color: viewMode === 'dashboard' ? 'var(--text-primary)' : 'var(--text-secondary)',
                                boxShadow: viewMode === 'dashboard' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                fontWeight: viewMode === 'dashboard' ? 600 : 400
                            }}
                        >
                            <TrendingUp size={16} /> Forecast
                        </button>
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                        <div style={{ position: 'relative' }}>
                            <Search size={14} style={{ position: 'absolute', left: 10, top: 8, color: 'var(--text-secondary)' }} />
                            <input 
                                type="text" 
                                placeholder="Pesquisar deal..." 
                                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', padding: '6px 12px 6px 30px', borderRadius: '6px', color: 'var(--text-primary)', outline: 'none', fontSize: '13px', width: '200px' }}
                            />
                        </div>
                        <button style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', padding: '6px 12px', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Filter size={14} /> Filtros
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const PipelinePageContent: React.FC = () => {
    const [viewMode, setViewMode] = useState<'kanban' | 'list' | 'contacts' | 'dashboard'>('kanban');
    const { activePipeline } = usePipeline();

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-primary)' }}>
            <PipelineHeader viewMode={viewMode} setViewMode={setViewMode} />
            
            {!activePipeline ? (
                <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--text-tertiary)' }}>
                    Crie um pipeline para começar.
                </div>
            ) : (
                <>
                    {viewMode === 'kanban' && <PipelineKanban />}
                    {viewMode === 'list' && <PipelineList />}
                    {viewMode === 'contacts' && <ContactsAccounts />}
                    {viewMode === 'dashboard' && <ForecastDashboard />}
                </>
            )}
        </div>
    );
};

export const PipelineCanvasView = ({ pipelineId }: { pipelineId?: string }) => {
    return (
        <PipelineProvider>
            <PipelinePageContent />
        </PipelineProvider>
    );
};


