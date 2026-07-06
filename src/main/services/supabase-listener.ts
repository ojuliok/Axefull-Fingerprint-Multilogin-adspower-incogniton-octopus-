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
    console.log('⚡ Agente Supabase (Listener de Comandos) desativado (Modo Local).');
}

export function stopSupabaseListener() {
    // no-op
}
