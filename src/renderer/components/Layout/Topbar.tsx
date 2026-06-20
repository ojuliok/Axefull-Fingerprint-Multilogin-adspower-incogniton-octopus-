import React, { useState } from 'react';
import { Search, Sun, Moon, Bell, Menu, X, MonitorPlay, Network } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

interface TopbarProps {
    runningProfilesCount: number;
    onOpenActiveProfiles: () => void;
    onOpenProxies: () => void;
}

const Topbar: React.FC<TopbarProps> = ({ runningProfilesCount, onOpenActiveProfiles, onOpenProxies }) => {
    const { theme, toggleTheme } = useTheme();
    const { user, logout } = useAuth();
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    const isLight = theme === 'light';
    const bgClass = 'bg-transparent';
    const textClass = isLight ? 'text-slate-700' : 'text-slate-200';
    const inputBg = isLight ? 'bg-black/[0.04] hover:bg-black/[0.06] border-black/[0.05]' : 'bg-white/[0.04] hover:bg-white/[0.06] border-white/[0.05]';
    const inputFocus = isLight ? 'focus:bg-white focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20' : 'focus:bg-[#09090b] focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20';

    const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : 'Axe';

    return (
        <header className={`h-14 flex items-center justify-between px-4 shrink-0 transition-colors duration-300 ${bgClass}`}>
            {/* Left side: Workspace / Branding */}
            <div className="flex items-center gap-3">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors cursor-pointer
                    ${isLight ? 'hover:bg-black/[0.03] border-transparent hover:border-black/[0.05]' : 'hover:bg-white/[0.03] border-transparent hover:border-white/[0.05]'}
                `}>
                    <div className="w-6 h-6 rounded bg-emerald-500 flex items-center justify-center text-white font-bold text-xs">
                        W
                    </div>
                    <span className={`font-semibold text-sm ${textClass}`}>Axe Workspace</span>
                </div>
            </div>

            {/* Center: Search */}
            <div className="flex-1 max-w-xl px-6">
                <div className="relative group">
                    <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${isLight ? 'text-slate-400 group-focus-within:text-violet-500' : 'text-slate-500 group-focus-within:text-violet-400'}`} />
                    <input 
                        type="text" 
                        placeholder="Pesquisar..." 
                        className={`w-full h-9 pl-9 pr-12 rounded-lg border outline-none text-sm transition-all placeholder:text-slate-400
                            ${inputBg}
                            ${inputFocus}
                            ${textClass}
                        `}
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <kbd className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${isLight ? 'bg-white border-black/10 text-slate-500' : 'bg-black/20 border-white/10 text-slate-400'}`}>Ctrl</kbd>
                        <kbd className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${isLight ? 'bg-white border-black/10 text-slate-500' : 'bg-black/20 border-white/10 text-slate-400'}`}>K</kbd>
                    </div>
                </div>
            </div>

            {/* Right side: Tools & Profile */}
            <div className="flex items-center gap-2">
                {/* Active Profiles Button */}
                {runningProfilesCount > 0 && (
                    <button 
                        onClick={onOpenActiveProfiles}
                        className={`relative flex items-center gap-1.5 px-3 h-8 rounded-lg transition-colors border
                            ${isLight ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'}
                        `}
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
                        <span className="text-xs font-semibold">{runningProfilesCount} Ativos</span>
                    </button>
                )}

                {/* Proxies Modal Button */}
                <button
                    onClick={onOpenProxies}
                    title="Gerenciador de Proxies"
                    className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors
                        ${isLight ? 'text-slate-500 hover:bg-black/[0.05]' : 'text-slate-400 hover:bg-white/[0.06] hover:text-slate-200'}
                    `}
                >
                    <Network size={16} />
                </button>

                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    title={isLight ? 'Modo Escuro' : 'Modo Claro'}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors
                        ${isLight ? 'text-slate-500 hover:bg-black/[0.05]' : 'text-slate-400 hover:bg-white/[0.06] hover:text-slate-200'}
                    `}
                >
                    {isLight ? <Moon size={16} /> : <Sun size={16} />}
                </button>

                {/* Notifications */}
                <button className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors
                    ${isLight ? 'text-slate-500 hover:bg-black/[0.05]' : 'text-slate-400 hover:bg-white/[0.06] hover:text-slate-200'}
                `}>
                    <Bell size={16} />
                </button>

                {/* Divider */}
                <div className={`w-px h-5 mx-1 ${isLight ? 'bg-black/10' : 'bg-white/10'}`} />

                {/* User Profile */}
                <div className="relative">
                    <button 
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                        className={`w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-sm transition-transform active:scale-95`}
                    >
                        {initials}
                    </button>

                    {/* Profile Dropdown */}
                    {showProfileMenu && (
                        <div className={`absolute right-0 top-full mt-2 w-56 rounded-xl border shadow-xl py-1 z-50
                            ${isLight ? 'bg-white border-black/10' : 'bg-[#18181b] border-white/10'}
                        `}>
                            <div className={`px-4 py-3 border-b ${isLight ? 'border-black/5' : 'border-white/5'}`}>
                                <p className={`text-sm font-semibold truncate ${textClass}`}>{user?.email}</p>
                                <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Plano: {user?.plan_label || user?.plan}</p>
                            </div>
                            <div className="p-1">
                                <button className={`w-full flex items-center px-3 py-2 text-sm rounded-lg transition-colors
                                    ${isLight ? 'text-slate-600 hover:bg-black/5' : 'text-slate-300 hover:bg-white/5'}
                                `}>
                                    Configurações da Conta
                                </button>
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

export default Topbar;
