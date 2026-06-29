import React, { useState, lazy, Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import { PomodoroProvider } from './context/PomodoroContext';
import { SecurityProvider } from './context/SecurityContext';
import { WorkspaceProvider } from './context/WorkspaceContext';

import { LayoutManager } from './components/Layout/LayoutManager';
import { isWebMode } from './utils/env';

// Lazy Load Pages to optimize initial loading
const Dashboard = lazy(() => import('./pages/Dashboard'));
const DadosClean = lazy(() => import('./pages/DadosClean'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const CanvasPage = lazy(() => import('./pages/CanvasPage'));
const TasksView = lazy(() => import('./features/Tasks/Tasks/TasksView'));
const AgendaView = lazy(() => import('./features/Tasks/Tasks/AgendaView'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SalesPage = lazy(() => import('./pages/SalesPage'));
const DownloadPage = lazy(() => import('./pages/DownloadPage'));
const VitrinePage = lazy(() => import('./pages/VitrinePage'));
const HomeW97 = lazy(() => import('./pages/HomeW97'));
const NotesPage = lazy(() => import('./pages/NotesPage'));
const NotesWidgetWindow = lazy(() => import('./pages/NotesWidgetWindow'));

// A sleek fallback loading screen between route transitions
const PageLoader = () => (
    <div className="flex flex-col items-center justify-center w-full h-full min-h-[50vh] gap-4">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin shadow-lg shadow-blue-500/20"></div>
        <span className="text-sm text-zinc-400 font-medium animate-pulse tracking-wide">Carregando interface...</span>
    </div>
);

function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { state } = useAuth();
    const [unauthView, setUnauthView] = useState<'sales' | 'login' | 'register'>('sales');

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

    return <>{children}</>;
}

const App: React.FC = () => {
    return (
        <ThemeProvider>
            <AuthProvider>
                <SecurityProvider>
                    <ToastProvider>
                        <PomodoroProvider>
                            <WorkspaceProvider>
                                <HashRouter>
                                    <Suspense fallback={<PageLoader />}>
                                        <Routes>
                                            <Route path="/" element={<ProtectedRoute><LayoutManager /></ProtectedRoute>}>
                                                <Route index element={<Navigate to="/home" replace />} />
                                                <Route path="home" element={<HomeW97 />} />
                                                <Route path="profiles" element={<Dashboard onOpenExtensions={() => window.dispatchEvent(new CustomEvent('open-extensions-modal'))} onOpenProxies={() => window.dispatchEvent(new CustomEvent('open-proxies-modal'))} />} />
                                                <Route path="dadosclean" element={<DadosClean />} />
                                                <Route path="overview" element={<CanvasPage key="overview" />} />
                                                <Route path="canvas" element={<CanvasPage key="canvas" />} />
                                                <Route path="tasks" element={<TasksView />} />
                                                <Route path="agenda" element={<AgendaView />} />
                                                <Route path="settings" element={<SettingsPage />} />
                                                <Route path="download" element={<DownloadPage />} />
                                                <Route path="vitrine" element={<VitrinePage />} />
                                                <Route path="notes" element={<NotesPage />} />
                                            </Route>
                                            {/* Standalone Window Routes */}
                                            <Route path="/notes-widget" element={<NotesWidgetWindow />} />
                                        </Routes>
                                    </Suspense>
                                </HashRouter>
                            </WorkspaceProvider>
                        </PomodoroProvider>
                    </ToastProvider>
                </SecurityProvider>
            </AuthProvider>
        </ThemeProvider>
    );
};

export default App;
