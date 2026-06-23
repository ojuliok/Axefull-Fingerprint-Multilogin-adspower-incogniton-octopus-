import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import Dashboard from './pages/Dashboard';
import DadosClean from './pages/DadosClean';
import ProxiesPage from './pages/ProxiesPage';
import SettingsPage from './pages/SettingsPage';
import CanvasPage from './pages/CanvasPage';
import TasksView from './components/Tasks/TasksView';
import LoginPage from './pages/LoginPage';
import SalesPage from './pages/SalesPage';
import DownloadPage from './pages/DownloadPage';
import NavegadorMobile from './pages/NavegadorMobile';
import Sidebar from './components/Layout/Sidebar';
import Topbar from './components/Layout/Topbar';
import { NavbarHorizontal } from './components/Layout/NavbarHorizontal';
import { FloatingDock } from './components/Layout/FloatingDock';
import { MobileBottomNav } from './components/Layout/MobileBottomNav';
import ExtensionsModal from './components/Extensions/ExtensionsModal';
import ProxiesModal from './components/Proxies/ProxiesModal';
import GlobalTaskWidget from './components/GlobalTaskWidget';
import { isWebMode } from './utils/env';
import { PomodoroProvider } from './context/PomodoroContext';
import FloatingPomodoro from './components/FloatingPomodoro';
import { SecurityProvider } from './context/SecurityContext';
import { LockScreen } from './components/Security/LockScreen';

export type ViewType = 'profiles' | 'settings' | 'dadosclean' | 'canvas' | 'tasks' | 'download' | 'navegador';

function AppShell() {
    const { state } = useAuth();
    const { theme, layout } = useTheme();
    const [currentView, setCurrentView] = useState<ViewType>(isWebMode() ? 'canvas' : 'profiles');
    const [unauthView, setUnauthView] = useState<'sales' | 'login' | 'register'>('sales');
    const [showExtensions, setShowExtensions] = useState(false);
    const [showProxiesModal, setShowProxiesModal] = useState(false);
    const [runningProfiles, setRunningProfiles] = useState<Array<{ id: string; name: string }>>([]);

    useEffect(() => {
        const updateActiveProfiles = async () => {
            try {
                if (window.api && window.api.profiles) {
                    const result = await window.api.profiles.list();
                    if (result.success && Array.isArray(result.data)) {
                        const active = result.data.filter((p: any) => p.is_active === 1 || p.status === 'running');
                        setRunningProfiles(active.map((p: any) => ({ id: p.id, name: p.name })));
                    }
                }
            } catch (err) {
                console.error('[AppShell] Error fetching profiles:', err);
            }
        };

        if (state === 'authenticated') {
            updateActiveProfiles();
            
            let cleanupClose = () => {};
            if (window.api && window.api.browser) {
                cleanupClose = window.api.browser.onProfileClosed((profileId: string) => {
                    setRunningProfiles(prev => prev.filter(p => p.id !== profileId));
                });
            }
            
            const interval = setInterval(updateActiveProfiles, 3000);
            return () => {
                cleanupClose();
                clearInterval(interval);
            };
        }
    }, [state]);

    if (state === 'loading' || state === 'offline') {
        return <LoginPage />;
    }

    if (state === 'unauthenticated') {
        if (unauthView === 'sales') {
            return (
                <SalesPage 
                    onLogin={() => setUnauthView('login')} 
                    onRegister={() => setUnauthView('register')} 
                />
            );
        }
        return (
            <LoginPage 
                initialMode={unauthView === 'login' ? 'login' : 'register'} 
                onBack={() => setUnauthView('sales')} 
            />
        );
    }

    const renderContent = () => {
        switch (currentView) {
            case 'profiles': return <Dashboard onOpenExtensions={() => setShowExtensions(true)} onOpenProxies={() => setShowProxiesModal(true)} />;
            case 'dadosclean': return <DadosClean />;
            case 'canvas': return <CanvasPage />;
            case 'tasks': return <TasksView />;
            case 'settings': return <SettingsPage />;
            case 'download': return <DownloadPage />;
            case 'navegador': return <NavegadorMobile />;
            default: return <Dashboard />;
        }
    };

    const isLight = theme === 'light';
    const bgApp = isLight ? 'bg-[#f1f5f9]' : 'bg-[#09090b]';

    const renderLayout = () => {
        if (layout === 'top-navigation') {
            return (
                <div className="flex flex-col flex-1 h-screen overflow-hidden">
                    <NavbarHorizontal
                        currentView={currentView}
                        onViewChange={setCurrentView}
                        onOpenExtensions={() => setShowExtensions(true)}
                        onOpenProxies={() => setShowProxiesModal(true)}
                        runningProfilesCount={runningProfiles.length}
                    />
                    <main className={`flex-1 overflow-hidden relative border-t ${isLight ? 'bg-white border-black/[0.08] shadow-sm' : 'bg-[#18181b] border-white/[0.05] shadow-lg'}`}>
                        {renderContent()}
                    </main>
                </div>
            );
        }

        if (layout === 'floating-dock') {
            return (
                <div className="flex flex-col flex-1 h-screen overflow-hidden relative">
                    <main className={`flex-1 overflow-hidden relative pb-24 ${isLight ? 'bg-white' : 'bg-[#18181b]'}`}>
                        {renderContent()}
                    </main>
                    <FloatingDock
                        currentView={currentView}
                        onViewChange={setCurrentView}
                        onOpenExtensions={() => setShowExtensions(true)}
                        onOpenProxies={() => setShowProxiesModal(true)}
                    />
                </div>
            );
        }

        if (layout === 'futuristic-console') {
            return (
                <div className="flex flex-1 h-screen overflow-hidden p-2 bg-black relative">
                    {/* Futuristic scanline overlay */}
                    <div className="pointer-events-none absolute inset-0 z-50 bg-[linear-gradient(to_bottom,rgba(255,255,255,0),rgba(255,255,255,0)_50%,rgba(0,0,0,0.3)_50%,rgba(0,0,0,0.3))] bg-[length:100%_4px] opacity-10" />
                    
                    <div className="flex flex-1 overflow-hidden border border-brand-primary rounded-lg shadow-[0_0_15px_rgba(0,255,67,0.15)] bg-[#0c0d0e]">
                        <Sidebar
                            currentView={currentView}
                            onViewChange={setCurrentView}
                            onOpenExtensions={() => setShowExtensions(true)}
                        />
                        <div className="flex flex-col flex-1 overflow-hidden relative">
                            <Topbar 
                                runningProfilesCount={runningProfiles.length}
                                onOpenActiveProfiles={() => {}}
                                onOpenProxies={() => setShowProxiesModal(true)}
                            />
                            <main className="flex-1 overflow-hidden relative border-t border-l border-brand-primary/20 bg-[#0f1112]">
                                {renderContent()}
                            </main>
                        </div>
                    </div>
                </div>
            );
        }

        // Default: classic-sidebar or split-panel (which dynamically sizes via Sidebar)
        return (
            <div className="flex flex-col md:flex-row flex-1 h-screen overflow-hidden">
                <div className="hidden md:flex">
                    <Sidebar
                        currentView={currentView}
                        onViewChange={setCurrentView}
                        onOpenExtensions={() => setShowExtensions(true)}
                    />
                </div>
                
                <div className="flex flex-col flex-1 overflow-hidden relative">
                    <Topbar 
                        runningProfilesCount={runningProfiles.length}
                        onOpenActiveProfiles={() => {/* TODO: Implement Active Profiles Drawer/Modal */}}
                        onOpenProxies={() => setShowProxiesModal(true)}
                    />
                    <main className={`flex-1 overflow-hidden relative border-t border-l ${isLight ? 'bg-white border-black/[0.08] shadow-sm' : 'bg-[#18181b] border-white/[0.05] shadow-lg'} rounded-tl-[16px]`}>
                        {renderContent()}
                    </main>
                </div>
                <MobileBottomNav 
                    currentView={currentView} 
                    onViewChange={setCurrentView} 
                />
            </div>
        );
    };

    return (
        <div className={`flex h-screen overflow-hidden ${bgApp} transition-colors duration-300`}>
            {renderLayout()}


            {showExtensions && (
                <ExtensionsModal onClose={() => setShowExtensions(false)} />
            )}

            {showProxiesModal && (
                <ProxiesModal onClose={() => setShowProxiesModal(false)} />
            )}

            <GlobalTaskWidget />
            <FloatingPomodoro />
            <LockScreen />
        </div>
    );
}

const App: React.FC = () => {
    return (
        <ThemeProvider>
            <AuthProvider>
                <SecurityProvider>
                    <ToastProvider>
                        <PomodoroProvider>
                            <AppShell />
                        </PomodoroProvider>
                    </ToastProvider>
                </SecurityProvider>
            </AuthProvider>
        </ThemeProvider>
    );
};

export default App;
