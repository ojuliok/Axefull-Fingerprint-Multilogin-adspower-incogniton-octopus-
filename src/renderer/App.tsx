import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import { PomodoroProvider } from './context/PomodoroContext';
import { SecurityProvider } from './context/SecurityContext';
import { WorkspaceProvider } from './context/WorkspaceContext';

import Dashboard from './pages/Dashboard';
import DadosClean from './pages/DadosClean';
import ProxiesPage from './pages/ProxiesPage';
import SettingsPage from './pages/SettingsPage';
import CanvasPage from './pages/CanvasPage';
import TasksView from './features/Tasks/Tasks/TasksView';
import LoginPage from './pages/LoginPage';
import SalesPage from './pages/SalesPage';
import DownloadPage from './pages/DownloadPage';
import NavegadorMobile from './pages/NavegadorMobile';
import VitrinePage from './pages/VitrinePage';
import HomeW97 from './pages/HomeW97';
import NotesPage from './pages/NotesPage';
import NotesWidgetWindow from './pages/NotesWidgetWindow';

import { LayoutManager } from './components/Layout/LayoutManager';
import { isWebMode } from './utils/env';

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
                                    <Routes>
                                        <Route path="/" element={<ProtectedRoute><LayoutManager /></ProtectedRoute>}>
                                        <Route index element={<Navigate to="/home" replace />} />
                                        <Route path="home" element={<HomeW97 />} />
                                        <Route path="profiles" element={<Dashboard onOpenExtensions={() => {}} onOpenProxies={() => {}} />} />
                                        <Route path="dadosclean" element={<DadosClean />} />
                                        <Route path="canvas" element={<CanvasPage />} />
                                        <Route path="tasks" element={<TasksView />} />
                                        <Route path="settings" element={<SettingsPage />} />
                                        <Route path="download" element={<DownloadPage />} />
                                        <Route path="navegador" element={<NavegadorMobile />} />
                                        <Route path="vitrine" element={<VitrinePage />} />
                                        <Route path="notes" element={<NotesPage />} />
                                        </Route>
                                        {/* Standalone Window Routes */}
                                        <Route path="/notes-widget" element={<NotesWidgetWindow />} />
                                    </Routes>
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
