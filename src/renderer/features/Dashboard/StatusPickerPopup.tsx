import React, { useState } from 'react';
import { STATUS_CONFIG, getStatusMap, saveCustomStatusConfig, renderStatusIcon, StatusDefinition } from '../../utils/constants';
import styles from '../../pages/Dashboard.module.css';
import { Plus, Check, Palette, RotateCcw, Trash2, Edit3, Layers, X, Lock, AlertTriangle, Flame, Zap, Star, Shield } from 'lucide-react';

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

type StatusIconType = 'none' | 'pulse' | 'lock' | 'check' | 'alert' | 'flame' | 'zap' | 'star' | 'shield';

const ICON_OPTIONS: { id: StatusIconType; label: string; iconNode: React.ReactNode }[] = [
    { id: 'none', label: 'Sem Ícone', iconNode: <span className="text-[10px] font-mono text-zinc-400">Ø</span> },
    { id: 'pulse', label: 'Pulsante', iconNode: <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> },
    { id: 'lock', label: 'Cadeado', iconNode: <Lock size={12} className="text-amber-400" /> },
    { id: 'check', label: 'Verificado', iconNode: <Check size={12} className="text-emerald-400" /> },
    { id: 'alert', label: 'Alerta', iconNode: <AlertTriangle size={12} className="text-red-400" /> },
    { id: 'flame', label: 'Aquecimento', iconNode: <Flame size={12} className="text-orange-400" /> },
    { id: 'zap', label: 'Raio', iconNode: <Zap size={12} className="text-yellow-400" /> },
    { id: 'star', label: 'Estrela', iconNode: <Star size={12} className="text-amber-300" /> },
    { id: 'shield', label: 'Escudo', iconNode: <Shield size={12} className="text-sky-400" /> },
];

const STATUS_TEMPLATES = [
    {
        name: 'Gestão Social Media',
        statuses: {
            ready:     { label: 'PRONTO', cls: '', dot: '#64748b', icon: 'none' as StatusIconType },
            new:       { label: 'NOVO', cls: '', dot: '#38bdf8', icon: 'none' as StatusIconType },
            farming:   { label: 'AQUECIMENTO', cls: '', dot: '#60a5fa', icon: 'flame' as StatusIconType },
            warning:   { label: 'SOLICITOU 2FA', cls: '', dot: '#f59e0b', icon: 'lock' as StatusIconType },
            banned:    { label: 'BLOQUEADO', cls: '', dot: '#f87171', icon: 'alert' as StatusIconType },
            verified:  { label: 'ANÚNCIOS ATIVOS', cls: '', dot: '#34d399', icon: 'check' as StatusIconType },
        }
    },
    {
        name: 'Afiliados & E-Commerce',
        statuses: {
            maturado:  { label: 'MATURADO', cls: '', dot: '#10b981', icon: 'check' as StatusIconType },
            analise:   { label: 'EM ANÁLISE', cls: '', dot: '#f59e0b', icon: 'none' as StatusIconType },
            suspenso:  { label: 'SUSPENSO', cls: '', dot: '#f87171', icon: 'alert' as StatusIconType },
            aprovado:  { label: 'APROVADO', cls: '', dot: '#06b6d4', icon: 'check' as StatusIconType },
            revisao:   { label: 'REVISÃO', cls: '', dot: '#a78bfa', icon: 'none' as StatusIconType },
        }
    },
    {
        name: 'Crypto & Web3',
        statuses: {
            kyc:       { label: 'KYC APROVADO', cls: '', dot: '#34d399', icon: 'shield' as StatusIconType },
            wallet:    { label: 'CARTEIRA CONECTADA', cls: '', dot: '#6366f1', icon: 'zap' as StatusIconType },
            pendente:  { label: 'PENDENTE', cls: '', dot: '#f59e0b', icon: 'none' as StatusIconType },
            inativo:   { label: 'INATIVO', cls: '', dot: '#64748b', icon: 'none' as StatusIconType },
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
    const [selectedIcon, setSelectedIcon] = useState<StatusIconType>('none');

    const persistStatusMap = (updated: Record<string, StatusDefinition>) => {
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
                icon: selectedIcon,
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

    const handleStartEdit = (e: React.MouseEvent, key: string, cfg: StatusDefinition) => {
        e.stopPropagation();
        setEditKey(key);
        setLabelInput(cfg.label);
        setColorInput(cfg.dot);
        setSelectedIcon(cfg.icon || 'none');
        setViewMode('edit');
    };

    const handleResetDefaults = () => {
        localStorage.removeItem('axe_custom_status_config');
        setStatusMap(STATUS_CONFIG);
        onStatusMapUpdated?.();
        setViewMode('list');
    };

    const handleApplyTemplate = (templateStatuses: Record<string, StatusDefinition>) => {
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
                    width: '270px',
                    maxHeight: '460px',
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
                                setSelectedIcon('none');
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
                                        <span key={st.label} className="text-[9px] px-2 py-0.5 rounded-full border flex items-center gap-1 font-bold" style={{ borderColor: `${st.dot}60`, color: st.dot, fontFamily: "'Ubuntu', sans-serif" }}>
                                            {renderStatusIcon(st.icon, st.dot, 10)}
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
                    <div className="p-2.5 space-y-3 bg-white/5 rounded-[5px] border border-white/10 my-1 animate-in fade-in">
                        <div className="flex items-center justify-between">
                            <p className="text-[11px] font-bold text-zinc-200">{viewMode === 'edit' ? 'Editar Status' : 'Novo Status'}</p>
                            <button onClick={() => setViewMode('list')} className="text-zinc-400 hover:text-white p-0.5"><X size={13} /></button>
                        </div>

                        {/* Label Input */}
                        <div>
                            <p className="text-[10px] text-zinc-400 font-semibold mb-1">Nome do Status</p>
                            <input
                                type="text"
                                value={labelInput}
                                onChange={(e) => setLabelInput(e.target.value)}
                                placeholder="Nome (ex: INSTAGRAM ATIVO)..."
                                className="w-full bg-black/40 border border-white/10 rounded-[5px] px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500 font-semibold"
                                style={{ fontFamily: "'Ubuntu', sans-serif" }}
                                autoFocus
                            />
                        </div>

                        {/* Color Picker */}
                        <div>
                            <p className="text-[10px] text-zinc-400 font-semibold mb-1.5 flex items-center gap-1">
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

                        {/* Icon Picker (Inserir ou Remover Ícone) */}
                        <div>
                            <p className="text-[10px] text-zinc-400 font-semibold mb-1.5 flex items-center gap-1">
                                Ícone (Opcional - Nativamente sem ícone)
                            </p>
                            <div className="grid grid-cols-3 gap-1">
                                {ICON_OPTIONS.map((opt) => (
                                    <button
                                        key={opt.id}
                                        type="button"
                                        onClick={() => setSelectedIcon(opt.id)}
                                        className={`px-2 py-1 rounded-[4px] border text-[10px] font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                                            selectedIcon === opt.id 
                                                ? 'bg-white/15 border-white text-white shadow' 
                                                : 'bg-black/20 border-white/5 text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                                        }`}
                                    >
                                        {opt.iconNode}
                                        <span className="truncate">{opt.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Save Button */}
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
                    <div className="space-y-1">
                        {Object.entries(statusMap).map(([key, cfg]) => {
                            const isSelected = currentStatus === key;
                            return (
                                <div
                                    key={key}
                                    className={`w-full group px-2.5 py-1.5 rounded-full flex items-center justify-between text-xs font-bold transition-all cursor-pointer ${
                                        isSelected 
                                            ? 'bg-white/10 ring-1 ring-white/30 text-white shadow-lg' 
                                            : 'hover:bg-white/5 text-zinc-300 hover:text-white'
                                    }`}
                                    style={{
                                        background: 'transparent',
                                        border: isSelected ? `1px solid ${cfg.dot}60` : '1px solid transparent',
                                    }}
                                    onClick={() => { onSelect(profileId, key); onClose(); }}
                                >
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                        {renderStatusIcon(cfg.icon, cfg.dot, 12)}
                                        <span 
                                            className="truncate uppercase text-[11px] tracking-wide font-bold" 
                                            style={{ fontFamily: "'Ubuntu', sans-serif", color: cfg.dot }}
                                        >
                                            {cfg.label}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        {isSelected && <Check size={13} className="text-white shrink-0 mr-1" />}
                                        
                                        {/* Action buttons on hover */}
                                        <button 
                                            onClick={(e) => handleStartEdit(e, key, cfg)}
                                            className="p-1 opacity-0 group-hover:opacity-100 hover:text-emerald-400 text-zinc-400 transition-opacity rounded-full hover:bg-white/10"
                                            title="Editar Status"
                                        >
                                            <Edit3 size={11} />
                                        </button>
                                        <button 
                                            onClick={(e) => handleDeleteStatus(e, key)}
                                            className="p-1 opacity-0 group-hover:opacity-100 hover:text-red-400 text-zinc-400 transition-opacity rounded-full hover:bg-white/10"
                                            title="Remover Status"
                                        >
                                            <Trash2 size={11} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </>
    );
};
