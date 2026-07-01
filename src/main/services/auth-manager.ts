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
    try {
        const supabase = getSupabase();
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return { success: false, error: error.message };
        if (!data.session || !data.user) return { success: false, error: 'Falha ao recuperar sessão' };

        const userId = data.user.id;
        
        // Fetch user profile from profiles table in Supabase
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

        // If profile doesn't exist, we use defaults
        let plan = 'free';
        let maxProfiles = PLAN_LIMITS.free.max_profiles;
        let isActive = true;

        if (profile) {
            plan = profile.plan || 'free';
            maxProfiles = profile.max_profiles || PLAN_LIMITS[plan]?.max_profiles || PLAN_LIMITS.free.max_profiles;
            isActive = profile.is_active !== false;
        }

        if (!isActive) {
            await supabase.auth.signOut();
            return { success: false, error: 'Conta suspensa. Entre em contato com o suporte.' };
        }

        const user: AuthUser = {
            id: userId,
            email: data.user.email!,
            plan,
            plan_label: PLAN_LIMITS[plan]?.label || 'Free',
            max_profiles: maxProfiles,
            is_active: isActive
        };

        const expiresAt = Date.now() + (data.session.expires_in || 3600) * 1000;
        await saveSession({
            access_token: data.session.access_token,
            idToken: data.session.access_token,
            refresh_token: data.session.refresh_token,
            expiresAt,
            userId,
            email: user.email
        });

        // Set session in client in case we need to make authenticated requests
        await supabase.auth.setSession({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token
        });

        return { 
            success: true, 
            user, 
            session: { 
                access_token: data.session.access_token, 
                refresh_token: data.session.refresh_token 
            } 
        };
    } catch (err: any) {
        console.error('[Auth] login error:', err);
        return { success: false, error: err.message || 'Erro ao fazer login' };
    }
}

export async function resetPassword(email: string): Promise<AuthResult> {
    try {
        const supabase = getSupabase();
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: undefined
        });
        if (error) return { success: false, error: error.message };
        return { success: true };
    } catch (err: any) {
        console.error('[Auth] resetPassword error:', err);
        return { success: false, error: err.message || 'Erro ao enviar email de recuperação' };
    }
}

export async function register(email: string, password: string, name?: string): Promise<AuthResult> {
    try {
        const supabase = getSupabase();
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { name }
            }
        });
        if (error) return { success: false, error: error.message };
        if (!data.user) return { success: false, error: 'Cadastro realizado, mas usuário não retornado.' };

        if (data.session) {
            const userId = data.user.id;
            const plan = 'free';
            const user: AuthUser = {
                id: userId,
                email: data.user.email!,
                plan,
                plan_label: PLAN_LIMITS.free.label,
                max_profiles: PLAN_LIMITS.free.max_profiles,
                is_active: true
            };

            const expiresAt = Date.now() + (data.session.expires_in || 3600) * 1000;
            await saveSession({
                access_token: data.session.access_token,
                idToken: data.session.access_token,
                refresh_token: data.session.refresh_token,
                expiresAt,
                userId,
                email: user.email
            });

            return { 
                success: true, 
                user, 
                session: { 
                    access_token: data.session.access_token, 
                    refresh_token: data.session.refresh_token 
                } 
            };
        } else {
            return { success: true, error: 'Confirme seu email para ativar a conta.' };
        }
    } catch (err: any) {
        console.error('[Auth] register error:', err);
        return { success: false, error: err.message || 'Não foi possível criar a conta' };
    }
}

export async function validateSession(): Promise<AuthResult> {
    const stored = await getStoredSession();
    if (!stored) return { success: false, error: 'no_session' };

    try {
        const supabase = getSupabase();
        let { access_token, refresh_token, expiresAt, userId, email } = stored;

        // Refresh token if expired or close to expiring (within 2 minutes)
        if (Date.now() >= expiresAt - 2 * 60 * 1000) {
            const { data, error } = await supabase.auth.setSession({
                access_token,
                refresh_token
            });

            if (error || !data.session || !data.user) {
                // Try refresh token explicitly
                const { data: refreshData, error: refreshErr } = await supabase.auth.refreshSession({ refresh_token });
                if (refreshErr || !refreshData.session || !refreshData.user) {
                    await clearSession();
                    return { success: false, error: 'session_expired' };
                }
                access_token = refreshData.session.access_token;
                refresh_token = refreshData.session.refresh_token;
                expiresAt = Date.now() + (refreshData.session.expires_in || 3600) * 1000;
                userId = refreshData.user.id;
            } else {
                access_token = data.session.access_token;
                refresh_token = data.session.refresh_token;
                expiresAt = Date.now() + (data.session.expires_in || 3600) * 1000;
                userId = data.user.id;
            }
        } else {
            // Restore session in memory
            await supabase.auth.setSession({ access_token, refresh_token });
        }

        // Fetch profile
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

        let plan = 'free';
        let maxProfiles = PLAN_LIMITS.free.max_profiles;
        let isActive = true;

        if (profile) {
            plan = profile.plan || 'free';
            maxProfiles = profile.max_profiles || PLAN_LIMITS[plan]?.max_profiles || PLAN_LIMITS.free.max_profiles;
            isActive = profile.is_active !== false;
        }

        if (!isActive) {
            await clearSession();
            await supabase.auth.signOut();
            return { success: false, error: 'account_suspended' };
        }

        const user: AuthUser = {
            id: userId,
            email,
            plan,
            plan_label: PLAN_LIMITS[plan]?.label || 'Free',
            max_profiles: maxProfiles,
            is_active: isActive
        };

        await saveSession({ access_token, idToken: access_token, refresh_token, expiresAt, userId, email });
        return { 
            success: true, 
            user, 
            session: { 
                access_token, 
                refresh_token 
            } 
        };
    } catch (err) {
        console.error('[Auth] validateSession error:', err);
        return { success: false, error: 'Não foi possível conectar ao servidor' };
    }
}

export async function logout(): Promise<void> {
    try {
        const supabase = getSupabase();
        await supabase.auth.signOut();
    } catch {
        // silently fail
    } finally {
        await clearSession();
    }
}

export async function heartbeat(): Promise<{ ok: boolean; action?: string }> {
    const stored = await getStoredSession();
    if (!stored) return { ok: false };
    try {
        const supabase = getSupabase();
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('is_active')
            .eq('id', stored.userId)
            .maybeSingle();
            
        if (profile && profile.is_active === false) {
            return { ok: false, action: 'logout' };
        }
        return { ok: true };
    } catch {
        return { ok: false };
    }
}
