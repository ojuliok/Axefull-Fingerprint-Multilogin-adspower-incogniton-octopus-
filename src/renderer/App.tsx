import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import { PomodoroProvider } from './context/PomodoroContext';
import { SecurityProvider } from './context/SecurityContext';

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
                            <HashRouter>
                                <Routes>
                                    <Route path="/" element={<ProtectedRoute><LayoutManager /></ProtectedRoute>}>
                                        <Route index element={<Navigate to={isWebMode() ? "/canvas" : "/profiles"} replace />} />
                                        <Route path="profiles" element={<Dashboard onOpenExtensions={() => {}} onOpenProxies={() => {}} />} />
                                        <Route path="dadosclean" element={<DadosClean />} />
                                        <Route path="canvas" element={<CanvasPage />} />
                                        <Route path="tasks" element={<TasksView />} />
                                        <Route path="settings" element={<SettingsPage />} />
                                        <Route path="download" element={<DownloadPage />} />
                                        <Route path="navegador" element={<NavegadorMobile />} />
                                    </Route>
                                </Routes>
                            </HashRouter>
                        </PomodoroProvider>
                    </ToastProvider>
                </SecurityProvider>
            </AuthProvider>
        </ThemeProvider>
    );
};

export default App;
