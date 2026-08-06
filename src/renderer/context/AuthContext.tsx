import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { TelemetryProvider } from '../utils/TelemetryProvider';

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
    const [state, setState] = useState<AuthState>('authenticated');
    const [user, setUser] = useState<AuthUser | null>({
        id: 'local-user',
        email: 'local@axefull.com',
        plan: 'enterprise',
        plan_label: 'Enterprise (Local)',
        max_profiles: 9999,
        is_active: true
    });

    const login = useCallback(async (email: string, password: string) => {
        return { success: true };
    }, []);

    const register = useCallback(async (email: string, password: string, name?: string) => {
        return { success: true };
    }, []);

    const logout = useCallback(async () => {
        // no-op
    }, []);

    const retryConnection = useCallback(async () => {
        // no-op
    }, []);

    return (
        <AuthContext.Provider value={{ state, user, login, register, logout, retryConnection }}>
            <TelemetryProvider />
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
}
