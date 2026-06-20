import React, { useState } from 'react';
import {
    LayoutGrid, Settings, Eraser, Puzzle, Monitor, Network, Sun, Moon, Bell, Search, CheckSquare
} from 'lucide-react';
import { ViewType } from '../../App';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { isWebMode } from '../../utils/env';

interface NavbarHorizontalProps {
    currentView: ViewType;
    onViewChange: (view: ViewType) => void;
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
    const textClass = isLight ? 'text-slate-700' : 'text-slate-200';
    const inputBg = isLight ? 'bg-black/[0.04] border-black/[0.05]' : 'bg-white/[0.04] border-white/[0.05]';
    const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : 'Axe';

    return (
        <header className={`h-16 flex items-center justify-between px-6 shrink-0 border-b border-white/[0.05] transition-colors duration-300 relative z-30
            ${isLight ? 'bg-white border-black/[0.06]' : 'bg-[#0f0f14] border-white/[0.04]'}
        `}>
            {/* Left Section: Logo & Brand */}
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => onViewChange('profiles')}>
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-md">
                        <span className="text-white font-bold text-[10px]">Axe</span>
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
                            onClick={() => onViewChange(item.id as ViewType)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                                ${isActive 
                                    ? (isLight ? 'bg-black/[0.04] text-violet-600 shadow-sm' : 'bg-white/[0.05] text-violet-400') 
                                    : (isLight ? 'text-slate-500 hover:bg-black/[0.02]' : 'text-slate-400 hover:bg-white/[0.02]')}
                            `}
                        >
                            <IconComponent size={16} className={isActive ? item.colorClass : 'text-slate-400'} />
                            <span>{item.label}</span>
                        </button>
                    );
                })}
            </nav>

            {/* Right Section: Control Panel & Avatar */}
            <div className="flex items-center gap-3">
                {/* Active Profiles Badge */}
                {runningProfilesCount > 0 && (
                    <div className={`flex items-center gap-1.5 px-3 h-8 rounded-lg border
                        ${isLight ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}
                    `}>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-semibold">{runningProfilesCount} Ativos</span>
                    </div>
                )}

                {/* Proxies */}
                <button
                    onClick={onOpenProxies}
                    title="Proxies"
                    className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors
                        ${isLight ? 'text-slate-500 hover:bg-black/[0.04]' : 'text-slate-400 hover:bg-white/[0.04]'}
                    `}
                >
                    <Network size={16} />
                </button>

                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    title="Tema"
                    className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors
                        ${isLight ? 'text-slate-500 hover:bg-black/[0.04]' : 'text-slate-400 hover:bg-white/[0.04]'}
                    `}
                >
                    {isLight ? <Moon size={16} /> : <Sun size={16} />}
                </button>

                {/* Extensions */}
                <button
                    onClick={onOpenExtensions}
                    title="Extensões"
                    className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors
                        ${isLight ? 'text-slate-500 hover:bg-black/[0.04]' : 'text-slate-400 hover:bg-white/[0.04]'}
                    `}
                >
                    <Puzzle size={16} />
                </button>

                {/* Settings */}
                <button
                    onClick={() => onViewChange('settings')}
                    title="Configurações"
                    className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors
                        ${currentView === 'settings' 
                            ? (isLight ? 'bg-black/[0.04] text-violet-600' : 'bg-white/[0.05] text-violet-400') 
                            : (isLight ? 'text-slate-500 hover:bg-black/[0.04]' : 'text-slate-400 hover:bg-white/[0.04]')}
                    `}
                >
                    <Settings size={16} />
                </button>

                <div className={`w-px h-5 mx-1 ${isLight ? 'bg-black/10' : 'bg-white/10'}`} />

                {/* User Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                        className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-sm transition-transform active:scale-95"
                    >
                        {initials}
                    </button>

                    {showProfileMenu && (
                        <div className={`absolute right-0 top-full mt-2 w-56 rounded-xl border shadow-xl py-1 z-50
                            ${isLight ? 'bg-white border-black/10' : 'bg-[#18181b] border-white/10'}
                        `}>
                            <div className={`px-4 py-3 border-b ${isLight ? 'border-black/5' : 'border-white/5'}`}>
                                <p className={`text-sm font-semibold truncate ${textClass}`}>{user?.email}</p>
                                <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Plano: {user?.plan_label || user?.plan}</p>
                            </div>
                            <div className="p-1">
                                <button 
                                    onClick={logout}
                                    className={`w-full flex items-center px-3 py-2 text-sm rounded-lg transition-colors text-red-500
                                        ${isLight ? 'hover:bg-red-50' : 'hover:bg-red-500/10'}
                                    `}
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
