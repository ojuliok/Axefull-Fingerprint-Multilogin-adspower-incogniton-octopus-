import React, { useState } from 'react';
import { Search, Sun, Moon, Bell, Menu, X, MonitorPlay, Network, ChevronDown, Plus, Cloud, Database } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useWorkspace } from '../../context/WorkspaceContext';

interface TopbarProps {
    runningProfilesCount: number;
    onOpenActiveProfiles: () => void;
    onOpenProxies: () => void;
}

const Topbar: React.FC<TopbarProps> = ({ runningProfilesCount, onOpenActiveProfiles, onOpenProxies }) => {
    const { theme, toggleTheme } = useTheme();
    const { user, logout } = useAuth();
    const { workspaces, currentWorkspace, setCurrentWorkspace, createWorkspace } = useWorkspace();
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);


    const isLight = theme === 'light';
    const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : 'Axe';

    return (
        <header className={`h-14 flex items-center justify-between px-4 shrink-0 transition-colors duration-300 backdrop-blur-md bg-theme-surface/80 border-b border-theme-border/30 z-[60]`}>
            {/* Left side: Workspace / Branding */}
            <div className="flex items-center gap-3 relative">
                <div 
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-transparent transition-colors cursor-pointer hover:bg-theme-border"
                    onClick={() => setShowWorkspaceMenu(!showWorkspaceMenu)}
                >
                    <div className="w-6 h-6 rounded bg-emerald-500 flex items-center justify-center text-white font-bold text-xs">
                        {currentWorkspace?.name ? currentWorkspace.name.charAt(0).toUpperCase() : 'W'}
                    </div>
                    <span className="font-semibold text-sm text-theme-text">{currentWorkspace?.name || 'Axe Workspace'}</span>
                    <ChevronDown size={14} className="text-theme-text-muted" />
                </div>

                {showWorkspaceMenu && (
                    <div className="absolute top-full left-0 mt-1 w-64 bg-theme-surface/95 backdrop-blur-xl border border-theme-border/60 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-xl py-2 z-[70] animate-fade-in-scale" style={{ borderTopLeftRadius: '4px' }}>
                        <div className="px-3 pb-2 mb-2 border-b border-theme-border/50 text-[11px] tracking-wider font-bold text-theme-text-muted uppercase">
                            Seus Workspaces
                        </div>
                        <div className="max-h-60 overflow-y-auto px-1">
                            {workspaces.map(ws => (
                                <button
                                    key={ws.id}
                                    onClick={() => {
                                        setCurrentWorkspace(ws);
                                        setShowWorkspaceMenu(false);
                                    }}
                                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${currentWorkspace?.id === ws.id ? 'bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] font-medium' : 'text-theme-text hover:bg-theme-border'}`}
                                >
                                    <div className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${currentWorkspace?.id === ws.id ? 'bg-[var(--brand-primary)] text-white' : 'bg-theme-border text-theme-text-muted'}`}>
                                        {ws.name.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="truncate flex-1 text-left">{ws.name}</span>
                                    {ws.owner_id !== user?.id && (
                                        <span className="text-[10px] bg-theme-border px-1.5 py-0.5 rounded text-theme-text-muted">Convidado</span>
                                    )}
                                </button>
                            ))}
                        </div>
                        <div className="px-2 mt-2 pt-2 border-t border-theme-border/50">
                            <button 
                                onClick={async () => {
                                    const name = prompt('Nome do novo Workspace:');
                                    if (name) {
                                        await createWorkspace(name);
                                        setShowWorkspaceMenu(false);
                                    }
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors text-theme-text-muted hover:bg-theme-border hover:text-theme-text"
                            >
                                <Plus size={14} />
                                Criar Workspace
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Center: Search */}
            <div className="flex-1 max-w-xl px-6">
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors text-theme-text-muted group-focus-within:text-violet-500" />
                    <input 
                        type="text" 
                        placeholder="Pesquisar..." 
                        className="w-full h-9 pl-9 pr-12 rounded-lg border border-theme-border/50 outline-none text-sm transition-all placeholder:text-theme-text-faint bg-theme-base/50 backdrop-blur-sm focus:bg-theme-base focus:border-[var(--brand-primary)]/50 focus:ring-2 focus:ring-[var(--brand-primary)]/20 text-theme-text"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <kbd className="px-1.5 py-0.5 rounded text-[10px] font-medium border bg-theme-card border-theme-border text-theme-text-muted">Ctrl</kbd>
                        <kbd className="px-1.5 py-0.5 rounded text-[10px] font-medium border bg-theme-card border-theme-border text-theme-text-muted">K</kbd>
                    </div>
                </div>
            </div>

            {/* Right side: Tools & Profile */}
            <div className="flex items-center gap-2">
                {/* Active Profiles Button */}
                {runningProfilesCount > 0 && (
                    <button 
                        onClick={onOpenActiveProfiles}
                        className="relative flex items-center gap-1.5 px-3 h-8 rounded-lg transition-colors border bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20"
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
                        <span className="text-xs font-semibold">{runningProfilesCount} Ativos</span>
                    </button>
                )}

                {/* Proxies Modal Button */}
                <button
                    onClick={onOpenProxies}
                    title="Gerenciador de Proxies"
                    className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors text-theme-text-muted hover:bg-theme-border hover:text-theme-text"
                >
                    <Network size={16} />
                </button>



                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    title={isLight ? 'Modo Escuro' : 'Modo Claro'}
                    className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors text-theme-text-muted hover:bg-theme-border hover:text-theme-text"
                >
                    {isLight ? <Moon size={16} /> : <Sun size={16} />}
                </button>

                {/* Notifications */}
                <button className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors text-theme-text-muted hover:bg-theme-border hover:text-theme-text">
                    <Bell size={16} />
                </button>

                {/* Divider */}
                <div className="w-px h-5 mx-1 bg-theme-border" />

                {/* User Profile */}
                <div className="relative">
                    <button 
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                        className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-theme-text text-xs font-bold shadow-sm transition-transform active:scale-95"
                    >
                        {initials}
                    </button>

                    {/* Profile Dropdown */}
                    {showProfileMenu && (
                        <div className="absolute right-0 top-full mt-2 w-56 glass-card py-1 z-50 animate-fade-in-scale">
                            <div className="px-4 py-3 border-b border-theme-border/50">
                                <p className="text-sm font-semibold truncate text-theme-text">{user?.email}</p>
                                <p className="text-xs mt-0.5 text-theme-text-muted">Plano: {user?.plan_label || user?.plan}</p>
                            </div>
                            <div className="p-1">
                                <button className="w-full flex items-center px-3 py-2 text-sm rounded-lg transition-colors text-theme-text-muted hover:bg-theme-border">
                                    Configurações da Conta
                                </button>
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
            {showWorkspaceMenu && (
                <div className="fixed inset-0 z-40" onClick={() => setShowWorkspaceMenu(false)} />
            )}
            {showStorageMenu && (
                <div className="fixed inset-0 z-40" onClick={() => setShowStorageMenu(false)} />
            )}
        </header>
    );
};

export default Topbar;
