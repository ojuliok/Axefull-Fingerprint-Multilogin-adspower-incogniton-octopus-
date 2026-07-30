import React, { useState } from 'react';
import { STATUS_CONFIG, getStatusMap, saveCustomStatusConfig } from '../../utils/constants';
import styles from '../../pages/Dashboard.module.css';
import { Plus, Check, Palette, RotateCcw, Trash2, Edit3, Layers, X } from 'lucide-react';

interface StatusPickerPopupProps {
    profileId: string;
    currentStatus: string;
    position: { x: number; y: number };
    onSelect: (profileId: string, status: string) => void;
    onClose: () => void;
    onStatusMapUpdated?: () => void;
}

const COLOR_PRESETS = [
    '#38bdf8', // Sky
    '#34d399', // Emerald
    '#f59e0b', // Amber
    '#f87171', // Red/Rose
    '#a78bfa', // Violet
    '#ec4899', // Pink
    '#06b6d4', // Cyan
    '#10b981', // Green
    '#6366f1', // Indigo
    '#eab308', // Yellow
    '#64748b', // Slate
    '#14b8a6', // Teal
];

const STATUS_TEMPLATES = [
    {
        name: 'Gestão Social Media',
        statuses: {
            ready:     { label: 'PRONTO', cls: 'text-slate-400 bg-slate-500/10', dot: '#64748b' },
            new:       { label: 'NOVO', cls: 'text-sky-400 bg-sky-500/10', dot: '#38bdf8' },
            farming:   { label: 'AQUECIMENTO', cls: 'text-blue-400 bg-blue-500/10', dot: '#60a5fa' },
            warning:   { label: 'SOLICITOU 2FA', cls: 'text-amber-400 bg-amber-500/10', dot: '#f59e0b' },
            banned:    { label: 'BLOQUEADO', cls: 'text-red-400 bg-red-500/10', dot: '#f87171' },
            verified:  { label: 'ANÚNCIOS ATIVOS', cls: 'text-emerald-400 bg-emerald-500/10', dot: '#34d399' },
        }
    },
    {
        name: 'Afiliados & E-Commerce',
        statuses: {
            maturado:  { label: 'MATURADO', cls: 'text-emerald-400 bg-emerald-500/10', dot: '#10b981' },
            analise:   { label: 'EM ANÁLISE', cls: 'text-amber-400 bg-amber-500/10', dot: '#f59e0b' },
            suspenso:  { label: 'SUSPENSO', cls: 'text-red-400 bg-red-500/10', dot: '#f87171' },
            aprovado:  { label: 'APROVADO', cls: 'text-sky-400 bg-sky-500/10', dot: '#06b6d4' },
            revisao:   { label: 'REVISÃO', cls: 'text-violet-400 bg-violet-500/10', dot: '#a78bfa' },
        }
    },
    {
        name: 'Crypto & Web3',
        statuses: {
            kyc:       { label: 'KYC APROVADO', cls: 'text-emerald-400 bg-emerald-500/10', dot: '#34d399' },
            wallet:    { label: 'CARTEIRA CONECTADA', cls: 'text-indigo-400 bg-indigo-500/10', dot: '#6366f1' },
            pendente:  { label: 'PENDENTE', cls: 'text-amber-400 bg-amber-500/10', dot: '#f59e0b' },
            inativo:   { label: 'INATIVO', cls: 'text-slate-400 bg-slate-500/10', dot: '#64748b' },
        }
    }
];

export const StatusPickerPopup: React.FC<StatusPickerPopupProps> = ({
    profileId, currentStatus, position, onSelect, onClose, onStatusMapUpdated
}) => {
    const [statusMap, setStatusMap] = useState(() => getStatusMap());
    const [viewMode, setViewMode] = useState<'list' | 'create' | 'edit' | 'templates'>('list');
    
    // For creating / editing
    const [editKey, setEditKey] = useState<string | null>(null);
    const [labelInput, setLabelInput] = useState('');
    const [colorInput, setColorInput] = useState('#38bdf8');

    const persistStatusMap = (updated: Record<string, { label: string; cls: string; dot: string }>) => {
        saveCustomStatusConfig(updated);
        setStatusMap(updated);
        onStatusMapUpdated?.();
    };

    const handleSaveStatus = () => {
        if (!labelInput.trim()) return;
        const key = editKey || labelInput.trim().toLowerCase().replace(/\s+/g, '_');
        const updated = {
            ...statusMap,
            [key]: {
                label: labelInput.trim().toUpperCase(),
                cls: `text-white bg-opacity-20`,
                dot: colorInput,
            }
        };
        persistStatusMap(updated);
        onSelect(profileId, key);
        setViewMode('list');
        setEditKey(null);
    };

    const handleDeleteStatus = (e: React.MouseEvent, keyToDelete: string) => {
        e.stopPropagation();
        const updated = { ...statusMap };
        delete updated[keyToDelete];
        persistStatusMap(updated);
    };

    const handleStartEdit = (e: React.MouseEvent, key: string, currentLabel: string, currentDot: string) => {
        e.stopPropagation();
        setEditKey(key);
        setLabelInput(currentLabel);
        setColorInput(currentDot);
        setViewMode('edit');
    };

    const handleResetDefaults = () => {
        localStorage.removeItem('axe_custom_status_config');
        setStatusMap(STATUS_CONFIG);
        onStatusMapUpdated?.();
        setViewMode('list');
    };

    const handleApplyTemplate = (templateStatuses: Record<string, { label: string; cls: string; dot: string }>) => {
        persistStatusMap(templateStatuses);
        setViewMode('list');
    };

    return (
        <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 498 }} onClick={onClose} />
            <div 
                className={styles.pickerPopup} 
                style={{ 
                    left: position.x, 
                    top: position.y, 
                    width: '260px',
                    maxHeight: '440px',
                    overflowY: 'auto',
                    zIndex: 499,
                    background: '#18181b',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '5px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
                    padding: '8px',
                    fontFamily: 'sans-serif'
                }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-2 py-1.5 mb-1.5 border-b border-white/10">
                    <p className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider">Status do Perfil</p>
                    <div className="flex items-center gap-1">
                        <button 
                            onClick={() => setViewMode(viewMode === 'templates' ? 'list' : 'templates')} 
                            className="p-1 text-zinc-400 hover:text-white hover:bg-white/10 rounded-[5px] transition-colors"
                            title="Templates Prontos"
                        >
                            <Layers size={13} />
                        </button>
                        <button 
                            onClick={handleResetDefaults} 
                            className="p-1 text-zinc-400 hover:text-amber-400 hover:bg-white/10 rounded-[5px] transition-colors"
                            title="Restaurar Padrões"
                        >
                            <RotateCcw size={13} />
                        </button>
                        <button 
                            onClick={() => {
                                setEditKey(null);
                                setLabelInput('');
                                setColorInput('#38bdf8');
                                setViewMode(viewMode === 'create' ? 'list' : 'create');
                            }} 
                            className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-0.5 p-1 hover:bg-white/10 rounded-[5px] transition-colors"
                            title="Criar novo status"
                        >
                            <Plus size={13} /> {viewMode === 'create' ? 'Cancelar' : 'Novo'}
                        </button>
                    </div>
                </div>

                {/* Templates View */}
                {viewMode === 'templates' && (
                    <div className="p-2 space-y-2 bg-white/5 rounded-[5px] border border-white/10 animate-in fade-in">
                        <div className="flex items-center justify-between">
                            <p className="text-[11px] font-bold text-zinc-200">Escolha um Template</p>
                            <button onClick={() => setViewMode('list')} className="text-zinc-400 hover:text-white p-0.5"><X size={13} /></button>
                        </div>
                        {STATUS_TEMPLATES.map((tmpl) => (
                            <button
                                key={tmpl.name}
                                onClick={() => handleApplyTemplate(tmpl.statuses)}
                                className="w-full text-left p-2 bg-black/40 hover:bg-white/10 rounded-[5px] border border-white/5 transition-all text-xs text-zinc-200 flex flex-col gap-1 cursor-pointer"
                            >
                                <span className="font-bold text-emerald-400">{tmpl.name}</span>
                                <div className="flex flex-wrap gap-1">
                                    {Object.values(tmpl.statuses).map(st => (
                                        <span key={st.label} className="text-[9px] px-1.5 py-0.5 rounded-[3px] font-mono text-white" style={{ background: st.dot }}>
                                            {st.label}
                                        </span>
                                    ))}
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {/* Create / Edit View */}
                {(viewMode === 'create' || viewMode === 'edit') && (
                    <div className="p-2 space-y-3 bg-white/5 rounded-[5px] border border-white/10 my-1 animate-in fade-in">
                        <div className="flex items-center justify-between">
                            <p className="text-[11px] font-bold text-zinc-200">{viewMode === 'edit' ? 'Editar Status' : 'Novo Status'}</p>
                            <button onClick={() => setViewMode('list')} className="text-zinc-400 hover:text-white p-0.5"><X size={13} /></button>
                        </div>
                        <input
                            type="text"
                            value={labelInput}
                            onChange={(e) => setLabelInput(e.target.value)}
                            placeholder="Nome (ex: CONTA AQUECIDA)..."
                            className="w-full bg-black/40 border border-white/10 rounded-[5px] px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
                            autoFocus
                        />

                        <div>
                            <p className="text-[10px] text-zinc-400 font-medium mb-1.5 flex items-center gap-1">
                                <Palette size={10} /> Cor da Etiqueta
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                                {COLOR_PRESETS.map((color) => (
                                    <button
                                        key={color}
                                        onClick={() => setColorInput(color)}
                                        className={`w-5 h-5 rounded-[4px] border transition-transform cursor-pointer flex items-center justify-center ${
                                            colorInput === color ? 'scale-110 border-white ring-2 ring-white/30' : 'border-transparent hover:scale-105'
                                        }`}
                                        style={{ background: color }}
                                    >
                                        {colorInput === color && <Check size={10} className="text-white drop-shadow" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            disabled={!labelInput.trim()}
                            onClick={handleSaveStatus}
                            className="w-full py-1.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-bold text-xs rounded-[5px] shadow transition-all active:scale-95 cursor-pointer"
                        >
                            {viewMode === 'edit' ? 'Salvar Alteração' : 'Criar Status'}
                        </button>
                    </div>
                )}

                {/* List View */}
                {viewMode === 'list' && (
                    <div className="space-y-0.5">
                        {Object.entries(statusMap).map(([key, cfg]) => (
                            <div
                                key={key}
                                className={`w-full group px-2 py-1.5 rounded-[5px] flex items-center justify-between text-xs font-semibold transition-colors cursor-pointer ${
                                    currentStatus === key ? 'bg-white/10 text-white' : 'text-zinc-300 hover:bg-white/5 hover:text-white'
                                }`}
                                onClick={() => { onSelect(profileId, key); onClose(); }}
                            >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style={{ background: cfg.dot }} />
                                    <span className="truncate">{cfg.label}</span>
                                </div>

                                <div className="flex items-center gap-1">
                                    {currentStatus === key && <Check size={13} className="text-emerald-400 shrink-0 mr-1" />}
                                    
                                    {/* Action buttons on hover */}
                                    <button 
                                        onClick={(e) => handleStartEdit(e, key, cfg.label, cfg.dot)}
                                        className="p-1 opacity-0 group-hover:opacity-100 hover:text-emerald-400 text-zinc-500 transition-opacity rounded-[3px]"
                                        title="Editar Status"
                                    >
                                        <Edit3 size={11} />
                                    </button>
                                    <button 
                                        onClick={(e) => handleDeleteStatus(e, key)}
                                        className="p-1 opacity-0 group-hover:opacity-100 hover:text-red-400 text-zinc-500 transition-opacity rounded-[3px]"
                                        title="Remover Status"
                                    >
                                        <Trash2 size={11} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
};
