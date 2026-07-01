import React from 'react';
import { Play, StopCircle, Copy, Fingerprint, Folder as FolderIcon, Download, Trash2, X } from 'lucide-react';
import styles from '../../pages/Dashboard.module.css';

interface FloatingBulkActionsProps {
    selectedCount: number;
    onClearSelection: () => void;
    onStart: () => void;
    onStop: () => void;
    onClone: () => void;
    onFingerprint: () => void;
    onMoveToFolder: (e: React.MouseEvent) => void;
    onExport: () => void;
    onDelete: () => void;
}

export const FloatingBulkActions: React.FC<FloatingBulkActionsProps> = ({
    selectedCount,
    onClearSelection,
    onStart,
    onStop,
    onClone,
    onFingerprint,
    onMoveToFolder,
    onExport,
    onDelete
}) => {
    if (selectedCount === 0) return null;

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center bg-[#18181b]/80 backdrop-blur-md border border-white/10 shadow-2xl rounded-2xl px-4 py-3 gap-4 animate-in slide-in-from-bottom-10 fade-in duration-300">
            <div className="flex items-center gap-3 pr-4 border-r border-white/10">
                <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold">
                    {selectedCount}
                </div>
                <span className="text-sm font-medium text-slate-200">selecionados</span>
                <button 
                    onClick={onClearSelection}
                    className="p-1 hover:bg-theme-border rounded-lg text-theme-text-muted hover:text-theme-text transition-colors"
                    title="Limpar seleção"
                >
                    <X size={14} />
                </button>
            </div>

            <div className="flex items-center gap-1">
                <button onClick={onStart} className="flex items-center gap-2 px-3 py-1.5 hover:bg-emerald-500/10 text-slate-300 hover:text-emerald-400 rounded-lg transition-colors text-sm font-medium" title="Iniciar">
                    <Play size={15} /> Iniciar
                </button>
                <button onClick={onStop} className="flex items-center gap-2 px-3 py-1.5 hover:bg-amber-500/10 text-slate-300 hover:text-amber-400 rounded-lg transition-colors text-sm font-medium" title="Parar">
                    <StopCircle size={15} /> Parar
                </button>
                <button onClick={onClone} className="flex items-center gap-2 px-3 py-1.5 hover:bg-theme-border text-theme-text-muted hover:text-theme-text rounded-lg transition-colors text-sm font-medium" title="Clonar">
                    <Copy size={16} />
                    <span>Clonar</span>
                </button>
                <button onClick={onFingerprint} className="flex items-center gap-2 px-3 py-1.5 hover:bg-theme-border text-theme-text-muted hover:text-theme-text rounded-lg transition-colors text-sm font-medium" title="Nova Fingerprint">
                    <Fingerprint size={16} />
                    <span>Nova FP</span>
                </button>
                <button onClick={onMoveToFolder} className="flex items-center gap-2 px-3 py-1.5 hover:bg-theme-border text-theme-text-muted hover:text-theme-text rounded-lg transition-colors text-sm font-medium" title="Mover para Pasta">
                    <FolderIcon size={16} />
                    <span>Mover</span>
                </button>
                <button onClick={onExport} className="flex items-center gap-2 px-3 py-1.5 hover:bg-theme-border text-theme-text-muted hover:text-theme-text rounded-lg transition-colors text-sm font-medium" title="Exportar">
                    <Download size={16} />
                    <span>Exportar</span>
                </button>
                <div className="w-px h-6 bg-theme-border mx-1" />
                <button onClick={onDelete} className="flex items-center gap-2 px-3 py-1.5 hover:bg-red-500/10 text-slate-300 hover:text-red-400 rounded-lg transition-colors text-sm font-medium" title="Excluir">
                    <Trash2 size={15} /> Excluir
                </button>
            </div>
        </div>
    );
};
