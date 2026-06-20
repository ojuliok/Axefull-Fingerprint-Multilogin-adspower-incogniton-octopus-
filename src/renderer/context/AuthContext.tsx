import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

export interface AuthUser {
    id: string;
    email: string;
    plan: string;
    plan_label: string;
    max_profiles: number;
    is_active: boolean;
}

type AuthState = 'loading' | 'offline' | 'unauthenticated' | 'authenticated';

interface AuthContextValue {
    state: AuthState;
    user: AuthUser | null;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    register: (email: string, password: string, name?: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => Promise<void>;
    retryConnection: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const HEARTBEAT_INTERVAL_MS = 5 * 60 * 1000; // 5 minutos

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<AuthState>('loading');
    const [user, setUser] = useState<AuthUser | null>(null);
    const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const startHeartbeat = useCallback(() => {
        if (heartbeatRef.current) clearInterval(heartbeatRef.current);

        heartbeatRef.current = setInterval(async () => {
            const result = await window.api.auth.heartbeat();
            if (result.success && result.data) {
                const data = result.data as { ok: boolean; action?: string };
                if (!data.ok || data.action === 'logout') {
                    clearInterval(heartbeatRef.current!);
                    setUser(null);
                    setState('unauthenticated');
                }
            }
        }, HEARTBEAT_INTERVAL_MS);
    }, []);

    const stopHeartbeat = useCallback(() => {
        if (heartbeatRef.current) {
            clearInterval(heartbeatRef.current);
            heartbeatRef.current = null;
        }
    }, []);

    const bootstrap = useCallback(async () => {
        setState('loading');

        const internetRes = await window.api.auth.checkInternet();
        const isOnline = internetRes.success && internetRes.data === true;

        if (!isOnline) {
            setState('offline');
            return;
        }

        const sessionRes = await window.api.auth.validateSession();

        if (sessionRes.success && sessionRes.data) {
            setUser(sessionRes.data as AuthUser);
            setState('authenticated');
            startHeartbeat();
        } else {
            setState('unauthenticated');
        }
    }, [startHeartbeat]);

    useEffect(() => {
        bootstrap();
        return () => stopHeartbeat();
    }, [bootstrap, stopHeartbeat]);

    const login = useCallback(async (email: string, password: string) => {
        const res = await window.api.auth.login(email, password);
        if (res.success && res.data) {
            setUser(res.data as AuthUser);
            setState('authenticated');
            startHeartbeat();
            return { success: true };
        }
        return { success: false, error: res.error ?? 'Erro ao fazer login' };
    }, [startHeartbeat]);

    const register = useCallback(async (email: string, password: string, name?: string) => {
        const res = await window.api.auth.register(email, password, name);
        if (res.success && res.data) {
            setUser(res.data as AuthUser);
            setState('authenticated');
            startHeartbeat();
            return { success: true };
        }
        return { success: false, error: res.error ?? 'Erro ao criar conta' };
    }, [startHeartbeat]);

    const logout = useCallback(async () => {
        stopHeartbeat();
        await window.api.auth.logout();
        setUser(null);
        setState('unauthenticated');
    }, [stopHeartbeat]);

    const retryConnection = useCallback(async () => {
        await bootstrap();
    }, [bootstrap]);

    return (
        <AuthContext.Provider value={{ state, user, login, register, logout, retryConnection }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
}
