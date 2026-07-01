import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';
import { launchProfile } from '../features/browser/browser-engine';
import { getProfileById } from '../features/profile/profile-manager';
import path from 'path';
import { getDb, insert, getBrowserDataPath } from '../database/db';
import { generateFingerprint } from '../features/fingerprint/generator';
import fs from 'fs';
import { app } from 'electron';
import { getSupabase } from '../database/supabase-client';

let listenerChannel: any = null;


// Helper to ensure profile exists in local SQLite DB
export async function ensureLocalProfile(profileId: string) {
    if (getProfileById(profileId)) return;
    
    console.log(`[Sync] Perfil ${profileId} não encontrado localmente. Buscando do Supabase...`);
    const supabase = getSupabase();
    const { data: profileData, error } = await supabase.from('profiles').select('*').eq('id', profileId).single();
    
    if (error || !profileData) {
        console.error(`Falha ao buscar perfil ${profileId} no Supabase:`, error);
        return;
    }

    const name = profileData.name || `Profile ${profileId}`;
    const os = profileData.custom_fields?.os || 'windows';
    const country = profileData.custom_fields?.country || 'BR';
    
    // Create profile locally to satisfy browser-engine
    const browserDataPath = getBrowserDataPath();
    const dataDirPath = path.join(browserDataPath, profileId);
    if (!fs.existsSync(dataDirPath)) fs.mkdirSync(dataDirPath, { recursive: true });

    insert('profiles', {
        id: profileId,
        name,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_used: null,
        data_dir_path: dataDirPath,
        notes: null,
        status: 'active',
        is_active: 1 // active
    });

    const fp = profileData.custom_fields?.fingerprint
        ? { ...profileData.custom_fields.fingerprint, profile_id: profileId }
        : generateFingerprint(profileId, os as any, country as any);
    insert('fingerprints', fp as any);

    if (profileData.custom_fields?.proxy) {
        const p = profileData.custom_fields.proxy;
        insert('proxies', {
            id: p.id || Math.random().toString(36).substring(2),
            profile_id: profileId,
            type: p.type || 'http',
            host: p.host || '',
            port: p.port || 80,
            username: p.username || null,
            password: p.password || null
        });
    }
}

export async function startSupabaseListener() {
    console.log('⚡ Iniciando Agente Supabase (Listener de Comandos)...');
    const supabase = getSupabase();
    
    try {
        const { error: authError } = await supabase.auth.signInAnonymously();
        if (authError) {
            console.warn('⚠️ Agente (Supabase Auth):', authError.message, '- O Agente tentará escutar os canais mesmo sem login.');
        } else {
            console.log('✅ Agente autenticado no Supabase com sucesso.');
        }
    } catch (err: any) {
        console.warn('⚠️ Agente (Supabase Auth Exception):', err.message);
    }

    // Cancelar comandos antigos pendentes (evita abrir perfis antigos que ficaram presos)
    try {
        await supabase
            .from('launch_commands')
            .update({ status: 'cancelled_by_restart' })
            .eq('status', 'pending');
        console.log('[Supabase] Comandos antigos pendentes foram cancelados com segurança.');
    } catch (e) { }

    listenerChannel = supabase
        .channel('agent-commands')
        .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'launch_commands', filter: "status=eq.pending" },
            async (payload: any) => {
                const data = payload.new;
                const commandId = data.id;
                console.log(`[Command ${commandId}] Novo comando recebido para o perfil: ${data.profile_id}`);
                
                if (data.action === 'close') {
                    console.log(`[Command ${commandId}] Fechando perfil ${data.profile_id}`);
                    try {
                        const { closeProfile } = await import('../features/browser/browser-engine');
                        await closeProfile(data.profile_id);
                        
                        await supabase.from('launch_commands').update({ status: 'active' }).eq('id', commandId);
                        await supabase.from('profiles').update({ session_status: 'closed' }).eq('id', data.profile_id);
                        
                        console.log(`[Command ${commandId}] Perfil ${data.profile_id} fechado com sucesso.`);
                    } catch (error: any) {
                        console.error(`[Command ${commandId}] Erro ao fechar:`, error);
                        await supabase.from('launch_commands').update({ status: 'error', error_message: error.message }).eq('id', commandId);
                    }
                    return;
                }

                // Ação: Abrir
                try {
                    await supabase.from('launch_commands').update({ status: 'launching' }).eq('id', commandId);
                    await supabase.from('profiles').update({ session_status: 'launching' }).eq('id', data.profile_id);
                    
                    await ensureLocalProfile(data.profile_id);
                    const context = await launchProfile(data.profile_id);
                    
                    await supabase.from('launch_commands').update({ status: 'active' }).eq('id', commandId);
                    await supabase.from('profiles').update({ session_status: 'running' }).eq('id', data.profile_id);
                    console.log(`[Command ${commandId}] Perfil ${data.profile_id} aberto com sucesso!`);

                    // Escuta quando o usuário fechar a janela do navegador localmente
                    context.on('close', async () => {
                        console.log(`[Event] Janela do Perfil ${data.profile_id} foi fechada.`);
                        try {
                            await supabase.from('profiles').update({ session_status: 'closed' }).eq('id', data.profile_id);
                        } catch (e) {
                            console.error('Falha ao atualizar session_status para closed', e);
                        }
                    });
                } catch (error: any) {
                    console.error(`[Command ${commandId}] Erro ao lançar navegador:`, error);
                    await supabase.from('launch_commands').update({ status: 'error', error_message: error.message }).eq('id', commandId);
                    await supabase.from('profiles').update({ session_status: 'error' }).eq('id', data.profile_id);
                }
            }
        )
        .subscribe((status: any) => {
            if (status === 'SUBSCRIBED') {
                console.log('📡 Agente Supabase escutando novos comandos em tempo real...');
            }
        });
}

export function stopSupabaseListener() {
    if (listenerChannel) {
        const supabase = getSupabase();
        supabase.removeChannel(listenerChannel);
        listenerChannel = null;
        console.log('⚡ Listener do Supabase encerrado.');
    }
}
