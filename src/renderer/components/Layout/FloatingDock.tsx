import React, { useState } from 'react';
import {
    LayoutGrid, Settings, Eraser, Puzzle, Monitor, Network, Sun, Moon, CheckSquare, Home
} from 'lucide-react';

import { useTheme } from '../../context/ThemeContext';
import { isWebMode } from '../../utils/env';

interface FloatingDockProps {
    currentView: string;
    onViewChange: (view: string) => void;
    onOpenExtensions: () => void;
    onOpenProxies: () => void;
}

const DOCK_ITEMS = isWebMode()
    ? [
        { id: 'home',      label: 'Início',    icon: Home,       color: 'text-sky-500 hover:bg-sky-500/10' },
        { id: 'canvas',    label: 'Tela',      icon: Monitor,    color: 'text-amber-500 hover:bg-amber-500/10' },
        { id: 'tasks',     label: 'Tarefas',   icon: CheckSquare, color: 'text-blue-500 hover:bg-blue-500/10' }
      ]
    : [
        { id: 'home',      label: 'Início',    icon: Home,       color: 'text-sky-500 hover:bg-sky-500/10' },
        { id: 'profiles',  label: 'Perfis',    icon: LayoutGrid, color: 'text-violet-500 hover:bg-violet-500/10' },
        { id: 'canvas',    label: 'Tela',      icon: Monitor,    color: 'text-amber-500 hover:bg-amber-500/10' },
      ];

export const FloatingDock: React.FC<FloatingDockProps> = ({
    currentView,
    onViewChange,
    onOpenExtensions,
    onOpenProxies
}) => {
    const { theme, setTheme } = useTheme();
    const isLight = theme === 'light';
    const [showThemeMenu, setShowThemeMenu] = useState(false);

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl flex items-center gap-4 transition-all duration-300 shadow-2xl border border-white/10
            backdrop-blur-xl bg-opacity-80
            bg-[#15151b] border-white/[0.08]
            [data-theme='light']:bg-white/90 [data-theme='light']:border-black/[0.06] [data-theme='light']:shadow-[0_12px_40px_rgba(0,0,0,0.12)]
        ">
            {/* Nav Views */}
            <div className="flex items-center gap-2">
                {DOCK_ITEMS.map((item) => {
                    const isActive = currentView === item.id;
                    const IconComponent = item.icon;

                    return (
                        <button
                            key={item.id}
                            onClick={() => onViewChange(item.id as ViewType)}
                            className={`relative w-11 h-11 flex items-center justify-center rounded-xl transition-all duration-200 hover:-translate-y-1 hover:scale-110 group
                                ${item.color}
                                ${isActive ? 'bg-white/10 scale-105' : 'text-theme-text-muted'}
                            `}
                        >
                            <IconComponent size={20} strokeWidth={2} />
                            
                            {/* Active Dot */}
                            {isActive && (
                                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-violet-400" />
                            )}

                            {/* Tooltip */}
                            <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none bg-theme-elevated text-theme-text shadow-lg">
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Divider */}
            <div className="w-px h-6 bg-white/15" />

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
                {/* Proxies */}
                <button
                    onClick={onOpenProxies}
                    title="Proxies"
                    className="w-10 h-10 flex items-center justify-center rounded-xl text-theme-text-muted hover:text-theme-text hover:bg-white/5 transition-all hover:-translate-y-0.5"
                >
                    <Network size={18} />
                </button>

                {/* Theme Toggle / Picker */}
                <div className="relative flex items-center justify-center">
                    <button
                        onClick={() => setShowThemeMenu(!showThemeMenu)}
                        title="Tema"
                        className="w-10 h-10 flex items-center justify-center rounded-xl text-theme-text-muted hover:text-theme-text hover:bg-white/5 transition-all hover:-translate-y-0.5"
                    >
                        {isLight ? <Moon size={18} /> : <Sun size={18} />}
                    </button>
                    {showThemeMenu && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowThemeMenu(false)} />
                            <div className="absolute bottom-full mb-4 right-0 w-48 rounded-xl border border-white/10 shadow-2xl py-1 z-50 bg-[#15151b]/95 backdrop-blur-xl [data-theme='light']:bg-white [data-theme='light']:border-black/10">
                                <div className="px-4 py-2 border-b border-white/10 [data-theme='light']:border-black/5">
                                    <p className="text-xs font-semibold text-theme-text-muted">Selecionar Tema</p>
                                </div>
                                <div className="p-1 max-h-64 overflow-y-auto scrollbar-none relative z-50">
                                    {[
                                        { id: 'light',          label: 'Claro' },
                                        { id: 'dark',           label: 'Escuro' },
                                        { id: 'retro-vintage',  label: 'Retro Vintage' },
                                        { id: 'cyber-retro',    label: 'Retro Cyber' },
                                        { id: 'luxury-supreme', label: 'Luxury Supreme' },
                                        { id: 'cool-tech',      label: 'Cool Tech' },
                                        { id: 'pool-vibe',      label: 'Pool Vibe' },
                                        { id: 'custom',         label: 'Personalizado' }
                                    ].map(t => (
                                        <button 
                                            key={t.id}
                                            onClick={() => { setTheme(t.id as any); setShowThemeMenu(false); }}
                                            className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors
                                                ${theme === t.id ? 'bg-violet-500/10 text-violet-500' : 'text-theme-text hover:bg-white/5 [data-theme="light"]:hover:bg-black/5'}
                                            `}
                                        >
                                            {t.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Extensions */}
                {!isWebMode() && (
                    <button
                        onClick={onOpenExtensions}
                        title="Extensões"
                        className="w-10 h-10 flex items-center justify-center rounded-xl text-theme-text-muted hover:text-theme-text hover:bg-white/5 transition-all hover:-translate-y-0.5"
                    >
                        <Puzzle size={18} />
                    </button>
                )}

                {/* Settings */}
                <button
                    onClick={() => onViewChange('settings')}
                    title="Ajustes"
                    className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all hover:-translate-y-0.5
                        ${currentView === 'settings' ? 'text-violet-400 bg-white/5' : 'text-theme-text-muted hover:text-theme-text hover:bg-white/5'}
                    `}
                >
                    <Settings size={18} />
                </button>
            </div>
        </div>
    );
};
