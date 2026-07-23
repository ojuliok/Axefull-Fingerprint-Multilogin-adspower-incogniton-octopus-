import { supabase } from './supabase';
import type { ElectronAPI, AuthUser, APIResponse } from '../../preload/preload';

function success(data?: any): APIResponse {
    return { success: true, data };
}

function error(msg: string): APIResponse {
    return { success: false, error: msg };
}

function unsupported(featureName: string): Promise<APIResponse> {
    console.warn(`[WebBridge] Acesso negado: O recurso "${featureName}" só funciona no Agente Desktop local.`);
    return Promise.resolve(error(`"${featureName}" requer o Agente Desktop rodando para funcionar.`));
}

export const webApiBridge: ElectronAPI = {
    auth: {
        checkInternet: async () => success(true),
        login: async (email, password) => {
            if (!supabase) return error('Supabase desconectado. Verifique o .env');
            const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
            if (err) return error(err.message);
            const user: AuthUser = {
                id: data.user.id,
                email: data.user.email!,
                plan: 'free',
                plan_label: 'Free Plan',
                max_profiles: 10,
                is_active: true
            };
            return { success: true, data: user, session: data.session };
        },
        register: async (email, password, name) => {
            if (!supabase) return error('Supabase desconectado. Verifique o .env');
            const { data, error: err } = await supabase.auth.signUp({ email, password });
            if (err) return error(err.message);
            return { success: true, data: { id: data.user?.id, email, plan: 'free', is_active: true }, session: data.session };
        },
        validateSession: async () => {
            if (!supabase) return error('Supabase não conectado. Configure o .env');
            const { data, error: err } = await supabase.auth.getSession();
            if (err || !data.session) return error('No session');
            const user: AuthUser = {
                id: data.session.user.id,
                email: data.session.user.email!,
                plan: 'free',
                plan_label: 'Free Plan',
                max_profiles: 10,
                is_active: true
            };
            return { success: true, data: user, session: data.session };
        },
        logout: async () => {
            await supabase.auth.signOut();
            return success();
        },
        heartbeat: async () => success({ ok: true }),
        resetPassword: async (email: string) => {
            if (!supabase) return error('Supabase desconectado. Verifique o .env');
            const { error: err } = await supabase.auth.resetPasswordForEmail(email);
            if (err) return error(err.message);
            return success();
        },
    },
    profiles: {
        create: async (input) => {
            if (!supabase) return error('Supabase não conectado');
            const { data: session } = await supabase.auth.getSession();
            if (!session.session) return error('Not logged in');

            const os = input.platform || 'windows';
            const tagsArray = input.tags ? input.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [];

            const mockFingerprint = {
                id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
                platform: os,
                user_agent: os === 'windows' 
                    ? 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' 
                    : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                vendor: 'Google Inc.',
                renderer: 'ANGLE (Intel, Intel(R) UHD Graphics Direct3D11 vs_5_0 ps_5_0)',
                webgl_vendor: 'WebKit',
                viewport_width: 1920,
                viewport_height: 1080,
                screen_width: 1920,
                screen_height: 1080,
                hardware_concurrency: 8,
                device_memory: 8,
                timezone: 'America/Sao_Paulo',
                language: 'pt-BR',
                languages: 'pt-BR,pt,en-US,en',
                canvas_noise_seed: 'seed_canvas_' + Math.random(),
                webgl_noise_seed: 'seed_webgl_' + Math.random(),
                audio_noise_seed: 'seed_audio_' + Math.random(),
                webrtc_mode: 'disabled'
            };

            const newProfileId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);

            const { data, error: err } = await supabase
                .from('profiles')
                .insert({
                    id: newProfileId,
                    owner_id: session.session.user.id,
                    name: input.name,
                    description: input.notes || '',
                    status: 'active',
                    session_status: 'closed',
                    tags: tagsArray,
                    group_name: (input as any).category || 'all',
                    custom_fields: {
                        os,
                        country: 'BR',
                        fingerprint: mockFingerprint,
                        proxy: null
                    }
                })
                .select('*')
                .single();

            if (err) return error(err.message);

            const custom = data.custom_fields || {};
            const createdProfile = {
                id: data.id,
                name: data.name,
                created_at: data.created_at,
                updated_at: data.updated_at,
                last_used: data.last_access_at || null,
                notes: data.description || null,
                status: data.status || 'active',
                session_status: data.session_status || 'closed',
                is_active: data.session_status === 'running' ? 1 : 0,
                tags: data.tags ? data.tags.join(', ') : '',
                category: data.group_name || 'all',
                fingerprint: custom.fingerprint || mockFingerprint,
                proxy: custom.proxy || null
            };

            return success(createdProfile);
        },
        list: async () => {
            if (!supabase) return error('Supabase não conectado');
            const { data: session } = await supabase.auth.getSession();
            if (!session.session) return error('Not logged in');
            const { data, error: err } = await supabase
                .from('profiles')
                .select('*')
                .eq('owner_id', session.session.user.id);

            if (err) return error(err.message);

            const mapped = (data || []).map((p: any) => {
                const custom = p.custom_fields || {};
                return {
                    id: p.id,
                    name: p.name,
                    created_at: p.created_at,
                    updated_at: p.updated_at,
                    last_used: p.last_access_at || null,
                    notes: p.description || null,
                    status: p.status || 'active',
                    session_status: p.session_status || 'closed',
                    is_active: p.session_status === 'running' ? 1 : 0,
                    tags: p.tags ? p.tags.join(', ') : '',
                    category: p.group_name || 'all',
                    fingerprint: custom.fingerprint || {
                        platform: custom.os || 'windows',
                        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                    },
                    proxy: custom.proxy || null
                };
            });

            return success(mapped);
        },
        get: async (id) => {
            if (!supabase) return error('Supabase não conectado');
            const { data, error: err } = await supabase.from('profiles').select('*').eq('id', id).single();
            if (err) return error(err.message);

            const custom = data.custom_fields || {};
            const profile = {
                id: data.id,
                name: data.name,
                created_at: data.created_at,
                updated_at: data.updated_at,
                last_used: data.last_access_at || null,
                notes: data.description || null,
                status: data.status || 'active',
                session_status: data.session_status || 'closed',
                is_active: data.session_status === 'running' ? 1 : 0,
                tags: data.tags ? data.tags.join(', ') : '',
                category: data.group_name || 'all',
                fingerprint: custom.fingerprint || {
                    platform: custom.os || 'windows'
                },
                proxy: custom.proxy || null
            };

            return success(profile);
        },
        update: async (id, input) => {
            if (!supabase) return error('Supabase não conectado');
            
            const updates: any = {};
            if (input.name !== undefined) updates.name = input.name;
            if (input.notes !== undefined) updates.description = input.notes;
            if (input.category !== undefined) updates.group_name = input.category;
            if (input.tags !== undefined) {
                updates.tags = input.tags ? input.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [];
            }

            const { data, error: err } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', id)
                .select('*')
                .single();

            if (err) return error(err.message);

            const custom = data.custom_fields || {};
            const profile = {
                id: data.id,
                name: data.name,
                created_at: data.created_at,
                updated_at: data.updated_at,
                last_used: data.last_access_at || null,
                notes: data.description || null,
                status: data.status || 'active',
                session_status: data.session_status || 'closed',
                is_active: data.session_status === 'running' ? 1 : 0,
                tags: data.tags ? data.tags.join(', ') : '',
                category: data.group_name || 'all',
                fingerprint: custom.fingerprint || {},
                proxy: custom.proxy || null
            };

            return success(profile);
        },
        updateStatus: async (id, status) => {
            if (!supabase) return error('Supabase não conectado');
            const { data, error: err } = await supabase
                .from('profiles')
                .update({ status })
                .eq('id', id)
                .select('*')
                .single();

            if (err) return error(err.message);

            const custom = data.custom_fields || {};
            const profile = {
                id: data.id,
                name: data.name,
                created_at: data.created_at,
                updated_at: data.updated_at,
                last_used: data.last_access_at || null,
                notes: data.description || null,
                status: data.status || 'active',
                session_status: data.session_status || 'closed',
                is_active: data.session_status === 'running' ? 1 : 0,
                tags: data.tags ? data.tags.join(', ') : '',
                category: data.group_name || 'all',
                fingerprint: custom.fingerprint || {},
                proxy: custom.proxy || null
            };

            return success(profile);
        },
        updateProxy: async (profileId, proxy) => {
            if (!supabase) return error('Supabase não conectado');

            const { data: profile, error: getErr } = await supabase
                .from('profiles')
                .select('custom_fields')
                .eq('id', profileId)
                .single();

            if (getErr) return error(getErr.message);

            const custom = profile.custom_fields || {};
            custom.proxy = proxy;

            const { error: err } = await supabase
                .from('profiles')
                .update({ custom_fields: custom })
                .eq('id', profileId);

            if (err) return error(err.message);
            return success(proxy);
        },
        regenerateFingerprint: async (profileId, platform) => unsupported('Gerar Fingerprint'),
        delete: async (id) => {
            if (!supabase) return error('Supabase não conectado');
            const { error: err } = await supabase.from('profiles').delete().eq('id', id);
            if (err) return error(err.message);
            return success(true);
        },
        listFolders: async () => success([]),
        createFolder: async (name) => unsupported('Criar Pasta'),
        updateFolder: async (id, name) => unsupported('Atualizar Pasta'),
        deleteFolder: async (id) => unsupported('Deletar Pasta'),
        clone: async (id) => unsupported('Clonar'),
        bulkClone: async (ids) => unsupported('Bulk Clone'),
        bulkRegenerateFingerprint: async (ids) => unsupported('Bulk Fingerprint'),
        export: async (ids) => unsupported('Exportar'),
        import: async () => unsupported('Importar'),
        emptyTrash: async () => unsupported('Esvaziar Lixeira')
    },
    browser: {
        launch: async (profileId) => {
            // 1. Tenta acionar a API Local diretamente via HTTP primeiro!
            try {
                const response = await fetch(`http://127.0.0.1:54345/profiles/${profileId}/start`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });
                if (response.ok) {
                    const resJson = await response.json();
                    if (resJson.success) {
                        console.log('[WebBridge] Perfil iniciado com sucesso via API Local.');
                        return success({ status: 'launched_locally', cdpUrl: resJson.data?.cdpUrl });
                    }
                }
            } catch (localErr) {
                console.log('[WebBridge] API Local inacessível. Usando fallback de comandos via Supabase...');
            }

            // 2. Fallback: Cria comando no Supabase para execução remota
            const { data: session } = await supabase.auth.getSession();
            if (!session.session) return error('Not logged in');
            
            const { error: err } = await supabase.from('launch_commands').insert({
                owner_id: session.session.user.id,
                profile_id: profileId,
                action: 'open',
                status: 'pending'
            });
            if (err) return error('Falha ao enviar comando para o Agente: ' + err.message);
            return success({ status: 'command_sent_to_agent' });
        },
        close: async (profileId) => {
            // 1. Tenta acionar a API Local diretamente via HTTP primeiro!
            try {
                const response = await fetch(`http://127.0.0.1:54345/profiles/${profileId}/stop`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });
                if (response.ok) {
                    const resJson = await response.json();
                    if (resJson.success) {
                        console.log('[WebBridge] Perfil fechado com sucesso via API Local.');
                        return success();
                    }
                }
            } catch (localErr) {
                console.log('[WebBridge] API Local inacessível ao fechar. Usando fallback via Supabase...');
            }

            // 2. Fallback: Cria comando no Supabase
            const { data: session } = await supabase.auth.getSession();
            if (!session.session) return error('Not logged in');
            
            const { error: err } = await supabase.from('launch_commands').insert({
                owner_id: session.session.user.id,
                profile_id: profileId,
                action: 'close',
                status: 'pending'
            });
            if (err) return error('Falha ao enviar comando de parada: ' + err.message);
            return success({ status: 'command_sent_to_agent' });
        },
        isActive: async () => success(false),
        newTab: async () => unsupported('Nova Aba'),
        pageCount: async () => success(0),
        closeAll: async () => unsupported('Fechar Tudo'),
        onProfileClosed: () => { return () => {}; },
        testProxy: async () => unsupported('Testar Proxy'),
        cdpUrl: async () => unsupported('URL CDP')
    },
    browserData: {
        stats: async () => success({}),
        cookies: { list: async () => unsupported('Cookies'), import: async () => unsupported('Cookies'), export: async () => unsupported('Cookies'), clear: async () => unsupported('Cookies'), openImportDialog: async () => unsupported('Cookies'), saveExport: async () => unsupported('Cookies') },
        history: { list: async () => success([]), clear: async () => unsupported('History') },
        bookmarks: { list: async () => success([]), add: async () => unsupported('Bookmarks'), delete: async () => unsupported('Bookmarks'), clear: async () => unsupported('Bookmarks') },
        clearAll: async () => unsupported('Limpar Tudo')
    },
    license: { set: async () => unsupported('Licença'), get: async () => unsupported('Licença'), remove: async () => unsupported('Licença'), validateOnline: async () => unsupported('Licença'), issueOnline: async () => unsupported('Licença'), deviceHwid: async () => success('web-browser') },
    metaClean: { openDialog: async () => unsupported('MetaClean'), readMetadata: async () => unsupported('MetaClean'), cleanFile: async () => unsupported('MetaClean'), getHistory: async () => success([]), clearHistory: async () => unsupported('MetaClean') },
    extensions: { list: async () => success([]), install: async () => unsupported('Extensões'), delete: async () => unsupported('Extensões') },
    app: { 
        info: async () => success({ version: 'Web', electronVersion: 'Web', chromiumVersion: 'Web', dataDir: 'Web' }), 
        localApiPort: async () => success(null), 
        setWebviewProxy: async () => unsupported('Proxy'), 
        openNotesWidget: async () => unsupported('Notes'), 
        closeNotesWidget: async () => unsupported('Notes'),
        openExternal: async (url: string) => {
            window.open(url, '_blank');
            return success();
        },
        getFixedBookmark: async () => success({ name: '', url: '' }),
        saveFixedBookmark: async (name: string, url: string) => success({ name, url })
    },
    templates: { list: async () => success([]), save: async () => unsupported('Templates'), delete: async () => unsupported('Templates'), createProfile: async () => unsupported('Templates'), bulkCreate: async () => unsupported('Templates') },
    proxyPool: { list: async () => success([]), add: async () => unsupported('Proxy Pool'), bulkImport: async () => unsupported('Proxy Pool'), remove: async () => unsupported('Proxy Pool'), test: async () => unsupported('Proxy Pool'), assign: async () => unsupported('Proxy Pool'), unassign: async () => unsupported('Proxy Pool') },
    team: { me: async () => unsupported('Team'), create: async () => unsupported('Team'), invite: async () => unsupported('Team'), removeMember: async () => unsupported('Team'), changeRole: async () => unsupported('Team'), leave: async () => unsupported('Team') },
    warmup: { start: async () => unsupported('Warmup'), onProgress: () => () => {}, onComplete: () => () => {} },
    ai: { predictScore: async () => unsupported('AI'), submitFeedback: async () => unsupported('AI'), getAuditLogs: async () => success([]) },
    cards: { save: async () => unsupported('Cards'), get: async () => unsupported('Cards') },
    email: { send: async () => unsupported('Email') },
    bulkVideo: { startRender: async () => unsupported('Bulk Video'), cancelJob: async () => unsupported('Bulk Video'), openOutputFolder: async () => unsupported('Bulk Video'), saveProject: async () => unsupported('Bulk Video'), getProjects: async () => success([]), deleteProject: async () => unsupported('Bulk Video'), pickFile: async () => unsupported('Bulk Video'), onProgress: () => () => {}, pickFolder: async () => unsupported('Bulk Video'), scanFolder: async () => unsupported('Bulk Video'), generateThumbnail: async () => unsupported('Bulk Video'), generateThumbnailsBatch: async () => unsupported('Bulk Video'), getVideoMetadata: async () => unsupported('Bulk Video'), startBulkEdit: async () => unsupported('Bulk Video'), onBulkEditProgress: () => () => {}, cancelBulkEdit: async () => unsupported('Bulk Video'), onThumbnailsProgress: () => () => {} },
    openExternal: async (url: string) => {
        window.open(url, '_blank');
        return success();
    }
};

export function injectWebBridge() {
    if (!(window as any).api) {
        console.log('[WebBridge] 🌐 Modo Navegador Detectado! Injetando o emulador de Desktop...');
        (window as any).api = webApiBridge;
    }
}
