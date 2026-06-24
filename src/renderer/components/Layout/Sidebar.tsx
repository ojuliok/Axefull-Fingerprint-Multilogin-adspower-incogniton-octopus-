import React, { useState } from 'react';
import {
    LayoutGrid, Settings, Eraser, Puzzle, Monitor, CheckSquare, Home, StickyNote
} from 'lucide-react';

import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { isWebMode } from '../../utils/env';
import logoImg from '../../logo.png';

interface SidebarProps {
    currentView: string;
    onViewChange: (view: string) => void;
    onOpenExtensions: () => void;
}

const ALL_ITEMS: Record<string, { id: string; label: string; icon: React.FC<any>; colorClass: string }> = {
    home:       { id: 'home',       label: 'Início',    icon: Home,        colorClass: 'text-sky-500' },
    profiles:   { id: 'profiles',   label: 'Multi',     icon: LayoutGrid,  colorClass: 'text-violet-500' },
    canvas:     { id: 'canvas',     label: 'Tela',      icon: Monitor,     colorClass: 'text-amber-500' },
    tasks:      { id: 'tasks',      label: 'Tarefas',   icon: CheckSquare, colorClass: 'text-blue-500' },
    dadosclean: { id: 'dadosclean', label: 'MetaClean', icon: Eraser,      colorClass: 'text-emerald-500' },
    notes:      { id: 'notes',      label: 'Notas',     icon: StickyNote,  colorClass: 'text-amber-500' }
};

// Ordem Padrão solicitada
const DEFAULT_ORDER = ['home', 'profiles', 'canvas', 'tasks', 'dadosclean', 'notes'];

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, onOpenExtensions }) => {
    const { theme, layout } = useTheme();
    const { toast } = useToast();
    const isSplitPanel = layout === 'split-panel';

    // Drag and Drop State
    const [itemOrder, setItemOrder] = useState<string[]>(() => {
        try {
            const saved = localStorage.getItem('axe_sidebar_order');
            if (saved) {
                const parsed = JSON.parse(saved) as string[];
                // Adicionar itens novos que não existem na ordem salva
                const allKeys = Object.keys(ALL_ITEMS);
                const missing = allKeys.filter(k => !parsed.includes(k));
                if (missing.length > 0) {
                    const merged = [...parsed, ...missing];
                    localStorage.setItem('axe_sidebar_order', JSON.stringify(merged));
                    return merged;
                }
                return parsed;
            }
        } catch {}
        return DEFAULT_ORDER;
    });

    const [draggedItem, setDraggedItem] = useState<string | null>(null);

    const handleDragStart = (e: React.DragEvent, id: string) => {
        setDraggedItem(id);
        e.dataTransfer.effectAllowed = 'move';
        // Hide the ghost image if possible, or leave default
    };

    const handleDragOver = (e: React.DragEvent, id: string) => {
        e.preventDefault();
        if (!draggedItem || draggedItem === id) return;

        const draggedIdx = itemOrder.indexOf(draggedItem);
        const targetIdx = itemOrder.indexOf(id);
        
        if (draggedIdx === -1 || targetIdx === -1) return;

        const newOrder = [...itemOrder];
        newOrder.splice(draggedIdx, 1);
        newOrder.splice(targetIdx, 0, draggedItem);
        
        setItemOrder(newOrder);
    };

    const handleDrop = () => {
        setDraggedItem(null);
        localStorage.setItem('axe_sidebar_order', JSON.stringify(itemOrder));
    };

    const handleDragEnd = () => {
        setDraggedItem(null);
        localStorage.setItem('axe_sidebar_order', JSON.stringify(itemOrder));
    };

    return (
        <aside className={`
            flex flex-col relative z-20 transition-all duration-300 backdrop-blur-xl shrink-0
            ${isSplitPanel ? 'w-[220px] shadow-xl' : 'w-[64px]'}
        `} style={{ backgroundColor: 'var(--glass-bg)' }}>
            {/* Logo Area */}
            <div className={`h-14 flex items-center shrink-0 border-b border-transparent ${isSplitPanel ? 'px-4 gap-3' : 'justify-center'}`}>
                <img src={logoImg} alt="Axe Logo" className="w-8 h-8 rounded-xl object-contain shadow-md shrink-0 cursor-pointer" onClick={() => onViewChange('home')} />
                {isSplitPanel && (
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-theme-text-muted tracking-tight leading-none">Axe Multi</span>
                        <span className="text-[9px] text-emerald-400 font-semibold mt-0.5 leading-none">v1.0.0</span>
                    </div>
                )}
            </div>

            {/* Main Nav */}
            <nav className={`flex-1 py-4 flex flex-col gap-1.5 overflow-y-auto scrollbar-none ${isSplitPanel ? 'px-3' : 'items-center px-2'}`}>
                {itemOrder
                    .filter(key => key !== 'profiles' && key !== 'dadosclean')
                    .map(key => {
                        const item = ALL_ITEMS[key];
                        if (!item) return null;

                        const isActive = currentView === item.id;
                        const IconComponent = item.icon;
                        const isDragging = draggedItem === item.id;

                    return (
                        <button
                            key={item.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, item.id)}
                            onDragOver={(e) => handleDragOver(e, item.id)}
                            onDrop={handleDrop}
                            onDragEnd={handleDragEnd}
                            onClick={() => {
                                if (isActive) {
                                    if (item.id === 'canvas') {
                                        window.dispatchEvent(new CustomEvent('toggle-canvas-sidebar'));
                                    } else if (item.id === 'tasks') {
                                        window.dispatchEvent(new CustomEvent('toggle-tasks-sidebar'));
                                    }
                                } else {
                                    onViewChange(item.id);
                                }
                            }}
                            className={`
                                flex rounded-lg transition-all relative group
                                ${isSplitPanel ? 'w-full flex-row items-center justify-start gap-3 px-3.5 py-3' : 'w-full flex-col items-center justify-center gap-1 py-2.5'}
                                ${isDragging ? 'opacity-30' : 'opacity-100'}
                                ${isActive ? 'bg-theme-card shadow-sm text-theme-text' : 'text-theme-text-muted hover:bg-theme-border'}
                            `}
                        >
                            {/* Destaque lateral moderno para item ativo com glow premium */}
                            {isActive && (
                                <>
                                    <div className="absolute inset-0 bg-gradient-to-r from-[var(--brand-primary)]/10 to-transparent rounded-lg pointer-events-none" />
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-3/5 bg-[var(--brand-primary)] rounded-r-md shadow-[0_0_10px_var(--brand-primary)]" />
                                </>
                            )}

                            <div className="relative flex items-center justify-center shrink-0">
                                <IconComponent 
                                    size={isSplitPanel ? 18 : 20} 
                                    strokeWidth={isActive ? 2.5 : 2} 
                                    className={`relative z-10 transition-transform duration-200
                                        ${isActive ? item.colorClass : 'group-hover:scale-105 group-hover:text-theme-text'}
                                    `} 
                                />
                            </div>
                            {/* Fonte super minimalista */}
                            <span className={`tracking-tight transition-colors ${isSplitPanel ? 'text-xs' : 'text-[9px]'} ${isActive ? 'font-bold' : 'font-medium'}`}>
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </nav>

            {/* Bottom Nav / Footer */}
            <div className={`mt-auto pb-4 flex flex-col gap-1.5 shrink-0 ${isSplitPanel ? 'px-3' : 'items-center px-2'}`}>
                <div className={`w-full h-px mb-1.5 ${isSplitPanel ? 'bg-transparent' : 'bg-theme-border'}`} />

                {/* Desktop-only features */}
                {['profiles', 'dadosclean'].map(key => {
                    const item = ALL_ITEMS[key];
                    if (!item) return null;
                    const isActive = currentView === item.id;
                    const IconComponent = item.icon;
                    return (
                        <button
                            key={item.id}
                            onClick={() => {
                                if (isWebMode()) {
                                    onViewChange('download');
                                    return;
                                }
                                onViewChange(item.id);
                            }}
                            className={`
                                flex rounded-lg transition-all relative group
                                ${isSplitPanel ? 'w-full flex-row items-center justify-start gap-3 px-3.5 py-2.5' : 'w-full flex-col items-center justify-center gap-1 py-2.5'}
                                ${isActive ? 'bg-theme-card shadow-sm text-theme-text' : 'text-theme-text-muted hover:bg-theme-border'}
                            `}
                        >
                            {isActive && (
                                <>
                                    <div className="absolute inset-0 bg-gradient-to-r from-[var(--brand-primary)]/10 to-transparent rounded-lg pointer-events-none" />
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-3/5 bg-[var(--brand-primary)] rounded-r-md shadow-[0_0_10px_var(--brand-primary)]" />
                                </>
                            )}
                            <IconComponent 
                                size={isSplitPanel ? 16 : 18} 
                                strokeWidth={isActive ? 2.5 : 2} 
                                className={`relative z-10 transition-transform duration-200
                                    ${isActive ? item.colorClass : 'group-hover:scale-105 group-hover:text-theme-text'}
                                `} 
                            />
                            <span className={`tracking-tight ${isActive ? 'font-bold' : 'font-medium'} ${isSplitPanel ? 'text-xs' : 'text-[9px]'}`}>
                                {item.label}
                            </span>
                        </button>
                    );
                })}

                {/* Extensions Button */}
                {!isWebMode() && (
                    <button
                        onClick={onOpenExtensions}
                        className={`
                            flex rounded-lg transition-all relative group text-theme-text-muted hover:bg-theme-border
                            ${isSplitPanel ? 'w-full flex-row items-center justify-start gap-3 px-3.5 py-2.5' : 'w-full flex-col items-center justify-center gap-1 py-2.5'}
                        `}
                    >
                        <Puzzle size={isSplitPanel ? 16 : 18} strokeWidth={2} className="group-hover:scale-105 transition-transform" />
                        <span className={`tracking-tight font-medium ${isSplitPanel ? 'text-xs' : 'text-[9px]'}`}>Extensões</span>
                    </button>
                )}

                {/* Settings Button */}
                <button
                    onClick={() => onViewChange('settings')}
                    className={`
                        flex rounded-lg transition-all relative group
                        ${isSplitPanel ? 'w-full flex-row items-center justify-start gap-3 px-3.5 py-2.5' : 'w-full flex-col items-center justify-center gap-1 py-2.5'}
                        ${currentView === 'settings' ? 'bg-theme-card shadow-sm text-theme-text' : 'text-theme-text-muted hover:bg-theme-border'}
                    `}
                >
                    {currentView === 'settings' && (
                        <>
                            <div className="absolute inset-0 bg-gradient-to-r from-[var(--brand-primary)]/10 to-transparent rounded-lg pointer-events-none" />
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-3/5 bg-[var(--brand-primary)] rounded-r-md shadow-[0_0_10px_var(--brand-primary)]" />
                        </>
                    )}
                    <Settings 
                        size={isSplitPanel ? 16 : 18} 
                        strokeWidth={currentView === 'settings' ? 2.5 : 2} 
                        className={`relative z-10 transition-transform duration-200
                            ${currentView === 'settings' ? 'text-theme-text-faint' : 'group-hover:scale-105'}
                        `} 
                    />
                    <span className={`tracking-tight ${currentView === 'settings' ? 'font-bold' : 'font-medium'} ${isSplitPanel ? 'text-xs' : 'text-[9px]'}`}>
                        Ajustes
                    </span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
