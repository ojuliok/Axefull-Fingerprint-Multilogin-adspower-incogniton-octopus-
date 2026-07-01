import React, { useState, useEffect } from 'react';
import { X, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { MarketingGroup, MarketingCardData } from './crmStorage';

interface CsvData {
    headers: string[];
    rows: any[];
}

export interface ImportMapping {
    csvHeader: string;
    targetField: 'title' | 'status' | 'assignee' | 'priority' | 'budget' | 'ignore' | 'custom';
    customType?: 'text' | 'number' | 'dropdown';
}

interface SpreadsheetImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    csvData: CsvData | null;
    onConfirm: (mappings: ImportMapping[], data: any[]) => void;
    existingColumns: string[];
}

const SpreadsheetImportModal: React.FC<SpreadsheetImportModalProps> = ({ isOpen, onClose, csvData, onConfirm, existingColumns }) => {
    const [mappings, setMappings] = useState<ImportMapping[]>([]);

    useEffect(() => {
        if (isOpen && csvData) {
            // Auto-guess mapping
            const newMappings: ImportMapping[] = csvData.headers.map(header => {
                const lower = header.toLowerCase();
                let targetField: ImportMapping['targetField'] = 'custom';
                
                if (['title', 'nome', 'título', 'name', 'lead'].includes(lower)) targetField = 'title';
                else if (['status', 'fase', 'etapa', 'stage'].includes(lower)) targetField = 'status';
                else if (['responsável', 'assignee', 'dono', 'owner'].includes(lower)) targetField = 'assignee';
                else if (['prioridade', 'priority'].includes(lower)) targetField = 'priority';
                else if (['orçamento', 'budget', 'valor', 'value'].includes(lower)) targetField = 'budget';

                let customType: ImportMapping['customType'] = 'text';
                if (targetField === 'custom') {
                    let isNumber = true;
                    const uniqueValues = new Set();
                    csvData.rows.forEach(row => {
                        const val = row[header];
                        if (val !== undefined && val !== null && val !== '') {
                            if (isNaN(Number(val))) isNumber = false;
                            uniqueValues.add(val);
                        }
                    });
                    if (isNumber) customType = 'number';
                    else if (uniqueValues.size > 0 && uniqueValues.size <= 10) customType = 'dropdown';
                }

                return { csvHeader: header, targetField, customType };
            });
            setMappings(newMappings);
        }
    }, [isOpen, csvData]);

    if (!isOpen || !csvData) return null;

    const handleTargetChange = (index: number, newTarget: ImportMapping['targetField']) => {
        const newMappings = [...mappings];
        newMappings[index].targetField = newTarget;
        setMappings(newMappings);
    };

    const handleCustomTypeChange = (index: number, newType: ImportMapping['customType']) => {
        const newMappings = [...mappings];
        newMappings[index].customType = newType;
        setMappings(newMappings);
    };

    const handleConfirm = () => {
        // Validate required fields (at least title)
        const hasTitle = mappings.some(m => m.targetField === 'title');
        if (!hasTitle) {
            alert('Você precisa mapear pelo menos uma coluna para "Nome/Título do Lead".');
            return;
        }
        onConfirm(mappings, csvData.rows);
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'var(--bg-card)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 2000, color: 'var(--text-primary)'
        }} onClick={onClose}>
            <div style={{
                background: 'var(--bg-secondary)', border: '1px solid var(--border-default)',
                borderRadius: '12px', width: '800px', maxWidth: '90vw', maxHeight: '90vh',
                display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)',
                overflow: 'hidden'
            }} onClick={(e) => e.stopPropagation()}>
                
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--border-default)' }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Mapear Colunas da Planilha</h3>
                        <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                            Nós identificamos {csvData.headers.length} colunas no seu arquivo. Escolha para onde enviar cada dado no seu CRM.
                        </p>
                    </div>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 2fr', gap: '16px', fontWeight: 600, fontSize: '12px', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-default)', paddingBottom: '8px' }}>
                        <div>Coluna do Arquivo CSV (Exemplo)</div>
                        <div style={{ textAlign: 'center' }}>Ação</div>
                        <div>Destino no CRM</div>
                    </div>

                    {mappings.map((mapping, idx) => {
                        // Get 2 sample values
                        const samples = csvData.rows.slice(0, 2).map(r => r[mapping.csvHeader]).filter(Boolean);
                        const sampleText = samples.length > 0 ? samples.join(', ') : 'Sem dados';

                        return (
                            <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 2fr', gap: '16px', alignItems: 'center', background: 'var(--bg-tertiary)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-default)' }}>
                                
                                {/* Source Column */}
                                <div style={{ overflow: 'hidden' }}>
                                    <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                                        {mapping.csvHeader}
                                    </div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', marginTop: '4px' }}>
                                        Ex: {sampleText}
                                    </div>
                                </div>

                                {/* Arrow */}
                                <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                                    <ArrowRight size={16} />
                                </div>

                                {/* Target Select */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <select 
                                        value={mapping.targetField}
                                        onChange={(e) => handleTargetChange(idx, e.target.value as any)}
                                        style={{ 
                                            background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', 
                                            padding: '8px', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', cursor: 'pointer' 
                                        }}
                                    >
                                        <option value="title">Nome / Título do Lead</option>
                                        <option value="status">Status / Etapa</option>
                                        <option value="assignee">Responsável (Assignee)</option>
                                        <option value="priority">Prioridade</option>
                                        <option value="budget">Orçamento</option>
                                        <option value="custom">+ Criar Nova Coluna Customizada</option>
                                        <option value="ignore" style={{ color: '#ef4444' }}>Ignorar (Não importar)</option>
                                    </select>

                                    {mapping.targetField === 'custom' && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Tipo:</span>
                                            <select
                                                value={mapping.customType}
                                                onChange={(e) => handleCustomTypeChange(idx, e.target.value as any)}
                                                style={{ 
                                                    background: 'transparent', border: '1px solid var(--border-default)', 
                                                    padding: '4px', borderRadius: '4px', color: 'var(--text-primary)', fontSize: '11px', outline: 'none', cursor: 'pointer' 
                                                }}
                                            >
                                                <option value="text">Texto</option>
                                                <option value="number">Número</option>
                                                <option value="dropdown">Opções (Dropdown)</option>
                                            </select>
                                        </div>
                                    )}
                                </div>

                            </div>
                        );
                    })}

                </div>

                {/* Footer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderTop: '1px solid var(--border-default)', background: 'var(--bg-tertiary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                        <AlertCircle size={16} />
                        As colunas customizadas criadas ficarão visíveis nas propriedades dos leads.
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button onClick={onClose} style={{ background: 'transparent', border: '1px solid var(--border-default)', color: 'var(--text-secondary)', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', fontWeight: 500 }}>
                            Cancelar
                        </button>
                        <button onClick={handleConfirm} style={{ background: '#0ea5e9', border: 'none', color: '#fff', padding: '8px 24px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 10px rgba(14, 165, 233, 0.3)' }}>
                            <CheckCircle2 size={16} />
                            Finalizar Importação
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default SpreadsheetImportModal;
