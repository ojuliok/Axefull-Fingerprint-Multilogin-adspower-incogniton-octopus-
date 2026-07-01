import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';
import path from 'path';
import fs from 'fs';
import { app } from 'electron';

let supabaseInstance: any = null;

export function getSupabase() {
    if (!supabaseInstance) {
        const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'COLOQUE_SUA_URL_AQUI';
        
        let token = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'COLOQUE_SUA_CHAVE_AQUI';
        try {
            const configPath = path.join(app.getPath('userData'), 'config.json');
            if (fs.existsSync(configPath)) {
                const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                if (config.supabaseToken) token = config.supabaseToken;
            }
        } catch (e) { }

        supabaseInstance = createClient(SUPABASE_URL, token, {
            auth: {
                persistSession: false
            },
            realtime: {
                transport: WebSocket as any
            }
        });
    }
    return supabaseInstance;
}
