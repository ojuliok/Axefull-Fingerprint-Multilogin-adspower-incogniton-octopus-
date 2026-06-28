import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
    LayoutGrid, Settings, Eraser, Puzzle, Monitor, CheckSquare, Home, StickyNote, PanelLeftClose, PanelLeftOpen,
    Sun, Moon, Bell, ChevronDown, ChevronUp, Plus, Cloud, Database, LogOut, Check, Globe
} from 'lucide-react';

import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';
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
const DEFAULT_ORDER = ['home', 'profiles', 'canvas', 'tasks', 'notes'];

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, onOpenExtensions }) => {
    const { theme, toggleTheme, layout } = useTheme();
    const { toast } = useToast();
    const { user, logout } = useAuth();
    const { workspaces, currentWorkspace, setCurrentWorkspace, createWorkspace } = useWorkspace();

    const isSplitPanel = layout === 'split-panel';
    const isLight = theme === 'light';
    const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : 'JU';

    const [storageMode, setStorageMode] = useState<'online' | 'offline'>(() => (localStorage.getItem('axe_storage_mode') as 'online' | 'offline') || 'online');
    const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);
    const [showStorageMenu, setShowStorageMenu] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [ajustesHovered, setAjustesHovered] = useState(false);

    const hoverTimeoutRef = useRef<any>(null);

    const handleAjustesMouseEnter = () => {
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
        setAjustesHovered(true);
    };

    const handleAjustesMouseLeave = () => {
        hoverTimeoutRef.current = setTimeout(() => {
            setAjustesHovered(false);
            setShowWorkspaceMenu(false);
            setShowStorageMenu(false);
        }, 300);
    };

    const [canvasSidebarExpanded, setCanvasSidebarExpanded] = React.useState(() => {
        try {
            const saved = localStorage.getItem('axe_canvas_menu_mode');
            return saved !== 'collapsed';
        } catch {
            return true;
        }
    });

    React.useEffect(() => {
        const handleToggle = () => {
            setCanvasSidebarExpanded(prev => !prev);
        };
        window.addEventListener('toggle-canvas-sidebar', handleToggle);
        return () => window.removeEventListener('toggle-canvas-sidebar', handleToggle);
    }, []);

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
                {['profiles'].map(key => {
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

                {/* Secondary Menu Toggle (Tela Sidebar) */}
                {currentView === 'canvas' && (
                    <button
                        onClick={() => {
                            window.dispatchEvent(new CustomEvent('toggle-canvas-sidebar'));
                        }}
                        className={`
                            flex rounded-lg transition-all relative group text-theme-text-muted hover:bg-theme-border
                            ${isSplitPanel ? 'w-full flex-row items-center justify-start gap-3 px-3.5 py-2.5' : 'w-full flex-col items-center justify-center gap-1 py-2.5'}
                        `}
                        title={canvasSidebarExpanded ? "Recolher Menu Lateral" : "Expandir Menu Lateral"}
                    >
                        <div className="relative flex items-center justify-center shrink-0">
                            {canvasSidebarExpanded ? (
                                <PanelLeftClose size={isSplitPanel ? 16 : 18} strokeWidth={2} className="group-hover:scale-105 transition-transform" />
                            ) : (
                                <PanelLeftOpen size={isSplitPanel ? 16 : 18} strokeWidth={2} className="group-hover:scale-105 transition-transform" />
                            )}
                        </div>
                        <span className={`tracking-tight font-medium ${isSplitPanel ? 'text-xs' : 'text-[9px]'}`}>
                            {canvasSidebarExpanded ? "Recolher" : "Menu"}
                        </span>
                    </button>
                )}

                {/* Divider prior to interactive tools */}
                <div className="w-full h-[1px] bg-theme-border/30 my-1" />

                {/* Notifications (directly above Ajustes) */}
                <button 
                    className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors text-theme-text-muted hover:bg-theme-border hover:text-theme-text mb-0.5"
                    title="Notificações"
                >
                    <Bell size={isSplitPanel ? 16 : 18} />
                </button>

                {/* Settings / Ajustes with Hover Popover */}
                <div 
                    className="relative w-full flex justify-center"
                    onMouseEnter={handleAjustesMouseEnter}
                    onMouseLeave={handleAjustesMouseLeave}
                >
                    <button
                        onClick={() => onViewChange('settings')}
                        className={`
                            flex rounded-lg transition-all relative group w-full
                            ${isSplitPanel ? 'flex-row items-center justify-start gap-3 px-3.5 py-2.5' : 'flex-col items-center justify-center gap-1 py-2.5'}
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

                    {/* Popover content (Workspace switcher + Theme selection + Online status) */}
                    {ajustesHovered && (
                        <div 
                            className="absolute bottom-0 ml-2 w-64 bg-theme-surface border border-theme-border shadow-[0_8px_30px_rgba(0,0,0,0.3)] rounded-xl py-3 px-4 z-[999] flex flex-col gap-3 animate-fade-in-scale"
                            style={{ left: isSplitPanel ? '100%' : '60px' }}
                        >
                            {/* Workspace Selector */}
                            <div className="flex flex-col gap-1.5">
                                <span className="text-[10px] font-bold text-theme-text-muted uppercase tracking-wider text-left">Workspace Atual</span>
                                <div className="relative">
                                    <button 
                                        onClick={() => setShowWorkspaceMenu(!showWorkspaceMenu)}
                                        className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg border border-theme-border/40 hover:bg-theme-border/60 transition-colors text-xs text-theme-text"
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 rounded bg-emerald-500 flex items-center justify-center text-white font-bold text-[9px]">
                                                {currentWorkspace?.name ? currentWorkspace.name.charAt(0).toUpperCase() : 'W'}
                                            </div>
                                            <span className="truncate max-w-[140px] font-medium text-left">{currentWorkspace?.name || 'Workspace'}</span>
                                        </div>
                                        <ChevronDown size={12} className="text-theme-text-muted shrink-0" />
                                    </button>

                                    {showWorkspaceMenu && (
                                        <div className="absolute bottom-full left-0 mb-1 w-full bg-theme-card border border-theme-border shadow-lg rounded-lg py-1.5 z-[1000] max-h-40 overflow-y-auto">
                                            {workspaces.map(ws => (
                                                <button
                                                    key={ws.id}
                                                    onClick={() => {
                                                        setCurrentWorkspace(ws);
                                                        setShowWorkspaceMenu(false);
                                                    }}
                                                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-xs transition-colors hover:bg-theme-border text-left ${currentWorkspace?.id === ws.id ? 'text-[var(--brand-primary)] font-semibold' : 'text-theme-text'}`}
                                                >
                                                    <span className="truncate flex-1 text-left">{ws.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="w-full h-px bg-theme-border/40" />

                            {/* Storage Mode */}
                            <div className="flex flex-col gap-1.5">
                                <span className="text-[10px] font-bold text-theme-text-muted uppercase tracking-wider text-left">Armazenamento</span>
                                <button
                                    onClick={() => {
                                        const next = storageMode === 'online' ? 'offline' : 'online';
                                        localStorage.setItem('axe_storage_mode', next);
                                        setStorageMode(next);
                                        window.location.reload();
                                    }}
                                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg border transition-all text-xs ${storageMode === 'online' ? 'bg-violet-500/10 text-violet-400 border-violet-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}
                                >
                                    <div className="flex items-center gap-1.5">
                                        {storageMode === 'online' ? <Cloud size={12} /> : <Database size={12} />}
                                        <span className="font-medium">{storageMode === 'online' ? 'Salvar na Nuvem' : 'Salvar Local'}</span>
                                    </div>
                                    <span className="text-[9px] font-bold uppercase tracking-wider bg-theme-border px-1.5 py-0.5 rounded text-theme-text-muted">
                                        {storageMode === 'online' ? 'Online' : 'Offline'}
                                    </span>
                                </button>
                            </div>

                            <div className="w-full h-px bg-theme-border/40" />

                            {/* Theme Toggle */}
                            <div className="flex flex-col gap-1.5">
                                <span className="text-[10px] font-bold text-theme-text-muted uppercase tracking-wider text-left">Aparência</span>
                                <button
                                    onClick={toggleTheme}
                                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg border border-theme-border/40 hover:bg-theme-border text-xs text-theme-text-muted hover:text-theme-text transition-colors"
                                >
                                    <div className="flex items-center gap-1.5">
                                        {isLight ? <Moon size={12} /> : <Sun size={12} />}
                                        <span className="font-medium">Alternar Tema</span>
                                    </div>
                                    <span className="text-[10px] text-theme-text-muted font-bold capitalize">{theme}</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Perfil Button (below Ajustes) */}
                <div className="relative w-full flex justify-center mt-1">
                    <button 
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                        className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-theme-text text-xs font-bold shadow-sm transition-transform active:scale-95 hover:scale-105"
                    >
                        {initials}
                    </button>

                    {showProfileMenu && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                            <div 
                                className="absolute bottom-0 w-56 bg-theme-surface border border-theme-border/60 shadow-[0_8px_30px_rgba(0,0,0,0.2)] rounded-xl py-1 z-50 animate-fade-in-scale"
                                style={{ left: isSplitPanel ? '100%' : '60px' }}
                            >
                                <div className="px-4 py-3 border-b border-theme-border/50 text-left">
                                    <p className="text-xs font-semibold truncate text-theme-text">{user?.email}</p>
                                    <p className="text-[10px] mt-0.5 text-theme-text-muted">Plano: {user?.plan_label || user?.plan || 'Free'}</p>
                                </div>
                                <div className="p-1">
                                    <button 
                                        onClick={() => { onViewChange('settings'); setShowProfileMenu(false); }}
                                        className="w-full flex items-center px-3 py-2 text-xs rounded-lg transition-colors text-theme-text-muted hover:bg-theme-border text-left"
                                    >
                                        Configurações da Conta
                                    </button>
                                    <button 
                                        onClick={logout}
                                        className="w-full flex items-center px-3 py-2 text-xs rounded-lg transition-colors text-red-500 hover:bg-red-500/10 text-left"
                                    >
                                        <LogOut size={12} className="mr-1.5" />
                                        Sair
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
