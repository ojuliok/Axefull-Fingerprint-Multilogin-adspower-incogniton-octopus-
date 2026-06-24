import React, { useState } from 'react';
import {
    LayoutGrid, Settings, Eraser, Puzzle, Monitor, Network, Sun, Moon, Bell, Search, CheckSquare
} from 'lucide-react';

import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { isWebMode } from '../../utils/env';

interface NavbarHorizontalProps {
    currentView: string;
    onViewChange: (view: string) => void;
    onOpenExtensions: () => void;
    onOpenProxies: () => void;
    runningProfilesCount: number;
}

const NAV_ITEMS = isWebMode()
    ? [
        { id: 'canvas',    label: 'Tela',      icon: Monitor,    colorClass: 'text-amber-500' },
        { id: 'tasks',     label: 'Tarefas',   icon: CheckSquare, colorClass: 'text-blue-500' },
      ]
    : [
        { id: 'profiles',  label: 'Multi',     icon: LayoutGrid, colorClass: 'text-violet-500' },
        { id: 'canvas',    label: 'Tela',      icon: Monitor,    colorClass: 'text-amber-500' },
      ];

export const NavbarHorizontal: React.FC<NavbarHorizontalProps> = ({
    currentView,
    onViewChange,
    onOpenExtensions,
    onOpenProxies,
    runningProfilesCount
}) => {
    const { theme, toggleTheme } = useTheme();
    const { user, logout } = useAuth();
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    const isLight = theme === 'light';
    const textClass = 'text-theme-text';
    const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : 'Axe';

    return (
        <header className="h-16 flex items-center justify-between px-6 shrink-0 border-b border-theme-border transition-colors duration-300 relative z-30 bg-theme-base">
            {/* Left Section: Logo & Brand */}
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => onViewChange('profiles')}>
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-md">
                        <span className="text-theme-text font-bold text-[10px]">Axe</span>
                    </div>
                    <span className={`font-bold text-base tracking-tight ${textClass}`}>Axe VAULT</span>
                </div>
            </div>

            {/* Center Section: Tabs Navigation */}
            <nav className="flex items-center gap-1">
                {NAV_ITEMS.map((item) => {
                    const isActive = currentView === item.id;
                    const IconComponent = item.icon;

                    return (
                        <button
                            key={item.id}
                            onClick={() => {
                                if (isActive) {
                                    if (item.id === 'canvas') {
                                        window.dispatchEvent(new CustomEvent('toggle-canvas-sidebar'));
                                    } else if (item.id === 'tasks') {
                                        window.dispatchEvent(new CustomEvent('toggle-tasks-sidebar'));
                                    }
                                } else {
                                    onViewChange(item.id as ViewType);
                                }
                            }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                                ${isActive 
                                    ? 'bg-theme-border text-violet-500 shadow-sm' 
                                    : 'text-theme-text-muted hover:bg-theme-border'}
                            `}
                        >
                            <IconComponent size={16} className={isActive ? item.colorClass : 'text-theme-text-faint'} />
                            <span>{item.label}</span>
                        </button>
                    );
                })}
            </nav>

            {/* Right Section: Control Panel & Avatar */}
            <div className="flex items-center gap-3">
                {/* Active Profiles Badge */}
                {runningProfilesCount > 0 && (
                    <div className="flex items-center gap-1.5 px-3 h-8 rounded-lg border bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-semibold">{runningProfilesCount} Ativos</span>
                    </div>
                )}

                {/* Proxies */}
                <button
                    onClick={onOpenProxies}
                    title="Proxies"
                    className="w-9 h-9 flex items-center justify-center rounded-lg transition-colors text-theme-text-muted hover:bg-theme-border"
                >
                    <Network size={16} />
                </button>

                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    title="Tema"
                    className="w-9 h-9 flex items-center justify-center rounded-lg transition-colors text-theme-text-muted hover:bg-theme-border"
                >
                    {isLight ? <Moon size={16} /> : <Sun size={16} />}
                </button>

                {/* Extensions */}
                <button
                    onClick={onOpenExtensions}
                    title="Extensões"
                    className="w-9 h-9 flex items-center justify-center rounded-lg transition-colors text-theme-text-muted hover:bg-theme-border"
                >
                    <Puzzle size={16} />
                </button>

                {/* Settings */}
                <button
                    onClick={() => onViewChange('settings')}
                    title="Configurações"
                    className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors
                        ${currentView === 'settings' 
                            ? 'bg-theme-border text-violet-500' 
                            : 'text-theme-text-muted hover:bg-theme-border'}
                    `}
                >
                    <Settings size={16} />
                </button>

                <div className="w-px h-5 mx-1 bg-theme-border" />

                {/* User Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                        className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-theme-text text-xs font-bold shadow-sm transition-transform active:scale-95"
                    >
                        {initials}
                    </button>

                    {showProfileMenu && (
                        <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-theme-border shadow-xl py-1 z-50 bg-theme-card">
                            <div className="px-4 py-3 border-b border-theme-border">
                                <p className={`text-sm font-semibold truncate ${textClass}`}>{user?.email}</p>
                                <p className="text-xs mt-0.5 text-theme-text-muted">Plano: {user?.plan_label || user?.plan}</p>
                            </div>
                            <div className="p-1">
                                <button 
                                    onClick={logout}
                                    className="w-full flex items-center px-3 py-2 text-sm rounded-lg transition-colors text-red-500 hover:bg-red-500/10"
                                >
                                    Sair
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {showProfileMenu && (
                <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
            )}
        </header>
    );
};

