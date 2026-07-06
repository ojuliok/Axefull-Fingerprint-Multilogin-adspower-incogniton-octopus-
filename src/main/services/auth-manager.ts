import * as keytar from 'keytar';
import * as dns from 'dns/promises';
import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';
import { AuthUser } from '../features/profile/types';

const SERVICE = 'AxeMultiLogin';
const ACCOUNT_SESSION = 'session';

let supabaseInstance: any = null;
function getSupabase() {
    if (!supabaseInstance) {
        const url = process.env.VITE_SUPABASE_URL || '';
        const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
        if (!url || !key) {
            console.error('[AuthManager] ERROR: Supabase credentials not found in process.env!');
        }
        supabaseInstance = createClient(url, key, {
            realtime: {
                transport: WebSocket as any
            }
        });
    }
    return supabaseInstance;
}

const PLAN_LIMITS: Record<string, { max_profiles: number; label: string }> = {
    free:       { max_profiles: 3,   label: 'Free' },
    starter:    { max_profiles: 10,  label: 'Starter' },
    pro:        { max_profiles: 50,  label: 'Pro' },
    enterprise: { max_profiles: 999, label: 'Enterprise' },
};

export const SERVER_URL = process.env.AXE_SERVER_URL ?? 'http://localhost:3001';

// ─── Internet ─────────────────────────────────────────────────────────────────

export async function checkInternet(): Promise<boolean> {
    try {
        await dns.lookup('google.com');
        return true;
    } catch {
        return false;
    }
}

// ─── Session storage (keytar) ─────────────────────────────────────────────────

interface StoredSession {
    access_token: string;
    idToken: string; // Added for backward compatibility with ipc-handlers.ts
    refresh_token: string;
    expiresAt: number;
    userId: string;
    email: string;
}

export async function saveSession(session: StoredSession): Promise<void> {
    await keytar.setPassword(SERVICE, ACCOUNT_SESSION, JSON.stringify(session));
}

export async function getStoredSession(): Promise<StoredSession | null> {
    const raw = await keytar.getPassword(SERVICE, ACCOUNT_SESSION);
    if (!raw) return null;
    try {
        return JSON.parse(raw) as StoredSession;
    } catch {
        return null;
    }
}

export async function clearSession(): Promise<void> {
    await keytar.deletePassword(SERVICE, ACCOUNT_SESSION);
}

// ─── Auth types ───────────────────────────────────────────────────────────────

export interface AuthResult {
    success: boolean;
    user?: AuthUser;
    error?: string;
    session?: {
        access_token: string;
        refresh_token: string;
    };
}

// ─── Auth actions (direto no Supabase) ─────────────────────────────────────────

export async function login(email: string, password: string): Promise<AuthResult> {
    const user: AuthUser = {
        id: 'local-user',
        email: email || 'local@axefull.com',
        plan: 'enterprise',
        plan_label: 'Enterprise (Local)',
        max_profiles: 9999,
        is_active: true
    };
    return { success: true, user };
}

export async function resetPassword(email: string): Promise<AuthResult> {
    return { success: true };
}

export async function register(email: string, password: string, name?: string): Promise<AuthResult> {
    const user: AuthUser = {
        id: 'local-user',
        email: email || 'local@axefull.com',
        plan: 'enterprise',
        plan_label: 'Enterprise (Local)',
        max_profiles: 9999,
        is_active: true
    };
    return { success: true, user };
}

export async function validateSession(): Promise<AuthResult> {
    const user: AuthUser = {
        id: 'local-user',
        email: 'local@axefull.com',
        plan: 'enterprise',
        plan_label: 'Enterprise (Local)',
        max_profiles: 9999,
        is_active: true
    };
    return { success: true, user };
}

export async function logout(): Promise<void> {
    // no-op
}

export async function heartbeat(): Promise<{ ok: boolean; action?: string }> {
    return { ok: true };
}
