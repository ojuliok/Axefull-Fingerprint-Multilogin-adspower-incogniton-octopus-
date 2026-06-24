import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { NavbarHorizontal } from './NavbarHorizontal';
import { FloatingDock } from './FloatingDock';
import { MobileBottomNav } from './MobileBottomNav';
import ExtensionsModal from '../../features/Extensions/ExtensionsModal';
import ProxiesModal from '../../features/Proxies/ProxiesModal';
import GlobalTaskWidget from '../../features/Tasks/GlobalTaskWidget';
import FloatingPomodoro from '../../features/Tasks/FloatingPomodoro';
import { LockScreen } from '../../features/Security/LockScreen';

export const LayoutManager: React.FC = () => {
    const { layout } = useTheme();
    const { state } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Mapping paths to "currentView" for backward compatibility in Layout components
    const path = location.pathname.split('/')[1] || 'profiles';
    const currentView = path as any;

    const onViewChange = (view: string) => {
        navigate(`/${view}`);
    };

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
                console.error('[LayoutManager] Error fetching profiles:', err);
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

    const renderLayout = () => {
        if (layout === 'top-navigation') {
            return (
                <div className="flex flex-col flex-1 h-[100dvh] overflow-hidden">
                    <NavbarHorizontal
                        currentView={currentView}
                        onViewChange={onViewChange}
                        onOpenExtensions={() => setShowExtensions(true)}
                        onOpenProxies={() => setShowProxiesModal(true)}
                        runningProfilesCount={runningProfiles.length}
                    />
                    <main className="flex-1 overflow-hidden relative border-t bg-theme-surface border-theme-border shadow-sm">
                        <Outlet />
                    </main>
                </div>
            );
        }

        if (layout === 'floating-dock') {
            return (
                <div className="flex flex-col flex-1 h-[100dvh] overflow-hidden relative">
                    <main className="flex-1 overflow-hidden relative pb-24 bg-theme-surface">
                        <Outlet />
                    </main>
                    <FloatingDock
                        currentView={currentView}
                        onViewChange={onViewChange}
                        onOpenExtensions={() => setShowExtensions(true)}
                        onOpenProxies={() => setShowProxiesModal(true)}
                    />
                </div>
            );
        }

        if (layout === 'futuristic-console') {
            return (
                <div className="flex flex-1 h-[100dvh] overflow-hidden p-2 bg-theme-base relative">
                    {/* Futuristic scanline overlay */}
                    <div className="pointer-events-none absolute inset-0 z-50 bg-[linear-gradient(to_bottom,rgba(255,255,255,0),rgba(255,255,255,0)_50%,rgba(0,0,0,0.3)_50%,rgba(0,0,0,0.3))] bg-[length:100%_4px] opacity-10" />
                    
                    <div className="flex flex-1 overflow-hidden border border-theme-border rounded-lg shadow-sm bg-theme-surface">
                        <Sidebar
                            currentView={currentView}
                            onViewChange={onViewChange}
                            onOpenExtensions={() => setShowExtensions(true)}
                        />
                        <div className="flex flex-col flex-1 overflow-hidden relative">
                            <Topbar 
                                runningProfilesCount={runningProfiles.length}
                                onOpenActiveProfiles={() => {}}
                                onOpenProxies={() => setShowProxiesModal(true)}
                            />
                            <main className="flex-1 overflow-hidden relative border-t border-l border-theme-border bg-theme-base">
                                <Outlet />
                            </main>
                        </div>
                    </div>
                </div>
            );
        }

        // Default: classic-sidebar or split-panel
        return (
            <div className="flex flex-col md:flex-row flex-1 h-[100dvh] overflow-hidden">
                <div className="hidden md:flex">
                    <Sidebar
                        currentView={currentView}
                        onViewChange={onViewChange}
                        onOpenExtensions={() => setShowExtensions(true)}
                    />
                </div>
                
                <div className="flex flex-col flex-1 overflow-hidden relative">
                    <Topbar 
                        runningProfilesCount={runningProfiles.length}
                        onOpenActiveProfiles={() => {}}
                        onOpenProxies={() => setShowProxiesModal(true)}
                    />
                    <main className="flex-1 overflow-hidden relative border-t border-l bg-theme-surface border-theme-border shadow-sm rounded-tl-[16px]">
                        <Outlet />
                    </main>
                </div>
                <MobileBottomNav 
                    currentView={currentView} 
                    onViewChange={onViewChange} 
                />
            </div>
        );
    };

    return (
        <div className="flex h-[100dvh] overflow-hidden bg-theme-base transition-colors duration-500 relative">
            {/* Premium Animated Ambient Background */}
            <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[var(--brand-primary)]/10 blur-[100px] animate-pulse-slow"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[var(--brand-secondary)]/10 blur-[100px] animate-pulse-slow" style={{ animationDelay: '1.5s' }}></div>
            </div>

            <div className="relative z-10 flex flex-1 w-full h-full">
                {renderLayout()}
            </div>

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
};
