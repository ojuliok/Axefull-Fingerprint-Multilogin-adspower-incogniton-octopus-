import { ipcMain, IpcMainInvokeEvent, dialog, app, session } from 'electron';
import { readMetadata, cleanFile, getHistory, clearHistory } from './metaclean';
import { v4 as uuidv4 } from 'uuid';
import { findAll, insert, update, remove, getDb } from './database/db';
import {
    createProfile,
    getAllProfiles,
    getProfileById,
    updateProfile,
    updateProfileProxy,
    regenerateProfileFingerprint,
    deleteProfile,
    updateProfileStatus,
    updateLastUsed,
    cloneProfile,
    importProfiles,
    emptyTrash,
} from './profile/profile-manager';
import { exportProfile, importProfile } from './profile/backup-manager';
import fs from 'fs';
import path from 'path';
import { logAction } from './ai/audit-logger';
import {
    launchProfile,
    closeProfile,
    isProfileActive,
    openNewTab,
    getProfilePages,
    closeAllProfiles,
    testProxy,
    getProfileCdpUrl,
    warmupProfile,
    stopWarmupProfile,
} from './browser/browser-engine';
import { isBrowserInstalled, downloadBrowser } from './browser/downloader';
import { listExtensions, installExtension, deleteExtension } from './extensions-manager';
import { CreateProfileInput, UpdateProfileInput, UpdateProxyInput, ProfileStatus, BrowserType } from './profile/types';
import {
    getTemplates,
    saveTemplate,
    deleteTemplate,
    createProfileFromTemplate,
    bulkCreateFromTemplate,
} from './profile/template-manager';
import {
    getProxyPool,
    addProxyToPool,
    bulkImportProxies,
    removeProxyFromPool,
    testPoolProxy,
    assignProxy,
    unassignProxy,
} from './proxy/proxy-pool-manager';

/**
 * Register all IPC handlers for profile and browser management
 */
export function registerIpcHandlers(): void {
    console.log('[IPC] Registering handlers...');

    // ============== Profile Handlers ==============

    // Create a new profile
    ipcMain.handle('profile:create', async (_event: IpcMainInvokeEvent, input: CreateProfileInput) => {
        try {
            const profile = createProfile(input);
            return { success: true, data: profile };
        } catch (error) {
            console.error('[IPC] profile:create error:', error);
            return { success: false, error: String(error) };
        }
    });

    // Get all profiles
    ipcMain.handle('profile:list', async (_event: IpcMainInvokeEvent, options?: { page?: number; limit?: number }) => {
        try {
            const profiles = getAllProfiles(options);
            return { success: true, data: profiles };
        } catch (error) {
            console.error('[IPC] profile:list error:', error);
            return { success: false, error: String(error) };
        }
    });

    // Get a single profile by ID
    ipcMain.handle('profile:get', async (_event: IpcMainInvokeEvent, id: string) => {
        try {
            const profile = getProfileById(id);
            if (!profile) {
                return { success: false, error: 'Profile not found' };
            }
            return { success: true, data: profile };
        } catch (error) {
            console.error('[IPC] profile:get error:', error);
            return { success: false, error: String(error) };
        }
    });

    // Update profile info
    ipcMain.handle('profile:update', async (_event: IpcMainInvokeEvent, id: string, input: UpdateProfileInput) => {
        try {
            const profile = updateProfile(id, input);
            if (!profile) {
                return { success: false, error: 'Profile not found' };
            }
            logAction('profile_updated', { id, ...input }, id);
            return { success: true, data: profile };
        } catch (error) {
            console.error('[IPC] profile:update error:', error);
            return { success: false, error: String(error) };
        }
    });

    // Update profile proxy
    ipcMain.handle('profile:update-proxy', async (_event: IpcMainInvokeEvent, profileId: string, input: UpdateProxyInput | null) => {
        try {
            const proxy = updateProfileProxy(profileId, input);
            logAction('profile_proxy_updated', { proxy: input }, profileId);
            return { success: true, data: proxy };
        } catch (error) {
            console.error('[IPC] profile:update-proxy error:', error);
            return { success: false, error: String(error) };
        }
    });

    // Regenerate fingerprint
    ipcMain.handle('profile:regenerate-fingerprint', async (_event: IpcMainInvokeEvent, profileId: string, platform?: string) => {
        try {
            const fingerprint = regenerateProfileFingerprint(
                profileId,
                (platform as 'windows' | 'macos' | 'linux') || 'windows'
            );
            if (!fingerprint) {
                return { success: false, error: 'Profile not found' };
            }
            logAction('profile_fingerprint_regenerated', { platform }, profileId);
            return { success: true, data: fingerprint };
        } catch (error) {
            console.error('[IPC] profile:regenerate-fingerprint error:', error);
            return { success: false, error: String(error) };
        }
    });

    // Delete profile
    ipcMain.handle('profile:delete', async (_event: IpcMainInvokeEvent, id: string) => {
        try {
            // Close if active
            if (isProfileActive(id)) {
                await closeProfile(id);
            }
            const deleted = deleteProfile(id);
            return { success: deleted };
        } catch (error) {
            console.error('[IPC] profile:delete error:', error);
            return { success: false, error: String(error) };
        }
    });

    // Update profile status
    ipcMain.handle('profile:update-status', async (_event: IpcMainInvokeEvent, id: string, status: ProfileStatus) => {
        try {
            const profile = updateProfileStatus(id, status);
            if (!profile) {
                return { success: false, error: 'Profile not found' };
            }
            return { success: true, data: profile };
        } catch (error) {
            console.error('[IPC] profile:update-status error:', error);
            return { success: false, error: String(error) };
        }
    });

    // List all folders
    ipcMain.handle('profile:list-folders', async () => {
        try {
            const folders = findAll<any>('folders');
            return { success: true, data: folders };
        } catch (error) {
            console.error('[IPC] profile:list-folders error:', error);
            return { success: false, error: String(error) };
        }
    });

    // Create a new folder
    ipcMain.handle('profile:create-folder', async (_event: IpcMainInvokeEvent, name: string) => {
        try {
            const id = uuidv4();
            insert('folders', { id, name, is_default: 0 });
            logAction('folder_created', { id, name });
            return { success: true, data: { id, name, is_default: 0 } };
        } catch (error) {
            console.error('[IPC] profile:create-folder error:', error);
            return { success: false, error: String(error) };
        }
    });

    // Update folder
    ipcMain.handle('profile:update-folder', async (_event: IpcMainInvokeEvent, id: string, name: string) => {
        try {
            update('folders', id, { name });
            logAction('folder_updated', { id, name });
            return { success: true };
        } catch (error) {
            console.error('[IPC] profile:update-folder error:', error);
            return { success: false, error: String(error) };
        }
    });

    // Delete folder
    ipcMain.handle('profile:delete-folder', async (_event: IpcMainInvokeEvent, id: string) => {
        try {
            // First, remove folder_id from profiles
            const db = getDb();
            db.run('UPDATE profiles SET folder_id = NULL WHERE folder_id = ?', [id]);
            
            remove('folders', id);
            logAction('folder_deleted', { id });
            return { success: true };
        } catch (error) {
            console.error('[IPC] profile:delete-folder error:', error);
            return { success: false, error: String(error) };
        }
    });

    // Clone a profile
    ipcMain.handle('profile:clone', async (_event: IpcMainInvokeEvent, profileId: string) => {
        try {
            const cloned = cloneProfile(profileId);
            return { success: true, data: cloned };
        } catch (error) {
            console.error('[IPC] profile:clone error:', error);
            return { success: false, error: String(error) };
        }
    });

    // Bulk clone profiles
    ipcMain.handle('profile:bulk-clone', async (_event: IpcMainInvokeEvent, profileIds: string[]) => {
        try {
            const cloned = profileIds.map(id => cloneProfile(id));
            logAction('bulk_profile_cloned', { count: profileIds.length, originalIds: profileIds });
            return { success: true, data: cloned };
        } catch (error) {
            console.error('[IPC] profile:bulk-clone error:', error);
            return { success: false, error: String(error) };
        }
    });

    // Bulk regenerate fingerprints
    ipcMain.handle('profile:bulk-fingerprint', async (_event: IpcMainInvokeEvent, profileIds: string[]) => {
        try {
            const results = profileIds.map(id => regenerateProfileFingerprint(id));
            logAction('bulk_fingerprint_regenerated', { count: profileIds.length, profileIds });
            return { success: true, data: results };
        } catch (error) {
            console.error('[IPC] profile:bulk-fingerprint error:', error);
            return { success: false, error: String(error) };
        }
    });

    // Import profiles from a JSON file chosen via dialog
    ipcMain.handle('profile:import', async () => {
        try {
            const { filePaths, canceled } = await dialog.showOpenDialog({
                title: 'Importar Perfis',
                filters: [{ name: 'Axe Profile Export (JSON)', extensions: ['json'] }],
                properties: ['openFile'],
            });

            if (canceled || filePaths.length === 0) {
                return { success: false, error: 'cancelled' };
            }

            const raw = fs.readFileSync(filePaths[0], 'utf-8');
            const data = JSON.parse(raw);

            if (!data.profiles || !Array.isArray(data.profiles)) {
                return { success: false, error: 'Arquivo inválido: não contém perfis.' };
            }

            const imported = importProfiles(data);
            logAction('profiles_imported', { count: imported.length });
            return { success: true, data: { count: imported.length, profiles: imported } };
        } catch (error) {
            console.error('[IPC] profile:import error:', error);
            return { success: false, error: String(error) };
        }
    });

    // Empty trash — permanently delete all trashed profiles
    ipcMain.handle('profile:empty-trash', async () => {
        try {
            const count = emptyTrash();
            return { success: true, data: { count } };
        } catch (error) {
            console.error('[IPC] profile:empty-trash error:', error);
            return { success: false, error: String(error) };
        }
    });

    // Export profiles as JSON file
    
    ipcMain.handle('profile:export-zip', async (_event: IpcMainInvokeEvent, profileId: string, destPath: string) => {
        try {
            await exportProfile(profileId, destPath);
            return { success: true };
        } catch (error: any) {
            console.error('Error in profile:export-zip:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('profile:import-zip', async (_event: IpcMainInvokeEvent, sourcePath: string) => {
        try {
            const profile = await importProfile(sourcePath);
            return { success: true, profile };
        } catch (error: any) {
            console.error('Error in profile:import-zip:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('profile:export', async (_event: IpcMainInvokeEvent, profileIds: string[]) => {
        try {
            const profiles = profileIds.map(id => getProfileById(id)).filter(Boolean);
            const exportData = {
                version: '1.0',
                app: 'Axe MultiLogin',
                exported_at: new Date().toISOString(),
                count: profiles.length,
                profiles,
            };

            const { filePath, canceled } = await dialog.showSaveDialog({
                title: 'Exportar Perfis',
                defaultPath: `axe-profiles-${Date.now()}.json`,
                filters: [{ name: 'Axe Profile Export (JSON)', extensions: ['json'] }],
            });

            if (canceled || !filePath) {
                return { success: false, error: 'cancelled' };
            }

            fs.writeFileSync(filePath, JSON.stringify(exportData, null, 2), 'utf-8');
            logAction('profiles_exported', { count: profileIds.length, path: filePath });
            return { success: true, data: { path: filePath, count: profiles.length } };
        } catch (error) {
            console.error('[IPC] profile:export error:', error);
            return { success: false, error: String(error) };
        }
    });

    // ============== Browser Handlers ==============

    // Launch a profile browser
    ipcMain.handle('browser:launch', async (_event: IpcMainInvokeEvent, profileId: string) => {
        try {
            await launchProfile(profileId);
            return { success: true };
        } catch (error) {
            console.error('[IPC] browser:launch error:', error);
            return { success: false, error: String(error) };
        }
    });

    // Close a profile browser
    ipcMain.handle('browser:close', async (_event: IpcMainInvokeEvent, profileId: string) => {
        try {
            const closed = await closeProfile(profileId);
            return { success: closed };
        } catch (error) {
            console.error('[IPC] browser:close error:', error);
            return { success: false, error: String(error) };
        }
    });

    // Check if profile is active
    ipcMain.handle('browser:is-active', async (_event: IpcMainInvokeEvent, profileId: string) => {
        try {
            const active = isProfileActive(profileId);
            return { success: true, data: active };
        } catch (error) {
            console.error('[IPC] browser:is-active error:', error);
            return { success: false, error: String(error) };
        }
    });

    // Open new tab in active profile
    ipcMain.handle('browser:new-tab', async (_event: IpcMainInvokeEvent, profileId: string, url?: string) => {
        try {
            const page = await openNewTab(profileId, url);
            if (!page) {
                return { success: false, error: 'Profile not active' };
            }
            return { success: true };
        } catch (error) {
            console.error('[IPC] browser:new-tab error:', error);
            return { success: false, error: String(error) };
        }
    });

    // Get page count for a profile
    ipcMain.handle('browser:page-count', async (_event: IpcMainInvokeEvent, profileId: string) => {
        try {
            const pages = getProfilePages(profileId);
            return { success: true, data: pages.length };
        } catch (error) {
            console.error('[IPC] browser:page-count error:', error);
            return { success: false, error: String(error) };
        }
    });

    // Close all browsers
    ipcMain.handle('browser:close-all', async () => {
        try {
            await closeAllProfiles();
            return { success: true };
        } catch (error) {
            console.error('[IPC] browser:close-all error:', error);
            return { success: false, error: String(error) };
        }
    });

    // Warm up a profile (visits real sites to build cookies & history)
    ipcMain.handle('profile:warmup-start', async (event: IpcMainInvokeEvent, profileId: string) => {
        try {
            const sender = event.sender;
            // Run warmup without blocking the IPC call — progress comes via events
            warmupProfile(profileId, (progress) => {
                if (!sender.isDestroyed()) {
                    sender.send('profile:warmup-progress', { profileId, ...progress });
                }
            }).then((result) => {
                if (!sender.isDestroyed()) {
                    sender.send('profile:warmup-complete', { profileId, ...result });
                }
            }).catch((err) => {
                if (!sender.isDestroyed()) {
                    sender.send('profile:warmup-complete', { profileId, ok: false, sitesVisited: 0, error: String(err) });
                }
            });
            return { success: true };
        } catch (error) {
            console.error('[IPC] profile:warmup-start error:', error);
            return { success: false, error: String(error) };
        }
    });

    // Stop warmup of a profile
    ipcMain.handle('profile:warmup-stop', async (_event: IpcMainInvokeEvent, profileId: string) => {
        try {
            const stopped = stopWarmupProfile(profileId);
            return { success: true, data: stopped };
        } catch (error) {
            console.error('[IPC] profile:warmup-stop error:', error);
            return { success: false, error: String(error) };
        }
    });

    // Test proxy connectivity
    ipcMain.handle('proxy:test', async (_event: IpcMainInvokeEvent, proxy: { type: string; host: string; port: number; username?: string; password?: string }) => {
        try {
            const result = await testProxy(proxy as any);
            logAction('proxy_tested', { host: proxy.host, port: proxy.port, success: result.ok });
            return { success: result.ok, data: result };
        } catch (error) {
            console.error('[IPC] proxy:test error:', error);
            return { success: false, error: String(error) };
        }
    });

    // Get CDP URL for an active profile
    ipcMain.handle('browser:cdp-url', (_event: IpcMainInvokeEvent, profileId: string) => {
        const url = getProfileCdpUrl(profileId);
        return { success: true, data: url };
    });

    // Check if a browser is installed (Playwright-managed)
    ipcMain.handle('browser:check-installed', async (_event: IpcMainInvokeEvent, browserType: BrowserType) => {
        try {
            const installed = isBrowserInstalled(browserType);
            return { success: true, data: installed };
        } catch (error) {
            console.error('[IPC] browser:check-installed error:', error);
            return { success: false, error: String(error) };
        }
    });

    // Download/install a browser via Playwright
    ipcMain.handle('browser:install', async (event: IpcMainInvokeEvent, browserType: BrowserType) => {
        try {
            const sender = event.sender;
            const execPath = await downloadBrowser(browserType, (progress) => {
                if (!sender.isDestroyed()) {
                    sender.send('browser:install-progress', { browserType, ...progress });
                }
            });
            logAction('browser_installed', { browserType, execPath });
            return { success: true, data: { execPath } };
        } catch (error) {
            console.error('[IPC] browser:install error:', error);
            return { success: false, error: String(error) };
        }
    });

    console.log('[IPC] All handlers registered');
}

// ============== Extension Handlers ==============

export function registerExtensionHandlers(): void {
    ipcMain.handle('extensions:list', () => {
        try {
            return { success: true, data: listExtensions() };
        } catch (error) {
            return { success: false, error: String(error) };
        }
    });

    ipcMain.handle('extensions:install', async () => {
        try {
            const { filePaths, canceled } = await dialog.showOpenDialog({
                title: 'Selecionar Pasta da Extensão (desempacotada)',
                properties: ['openDirectory'],
            });
            if (canceled || filePaths.length === 0) return { success: false, error: 'cancelled' };
            const ext = installExtension(filePaths[0]);
            logAction('extension_installed', { name: ext.name, id: ext.id });
            return { success: true, data: ext };
        } catch (error) {
            console.error('[IPC] extensions:install error:', error);
            return { success: false, error: String(error) };
        }
    });

    ipcMain.handle('extensions:delete', (_event: IpcMainInvokeEvent, extensionId: string) => {
        try {
            deleteExtension(extensionId);
            logAction('extension_deleted', { id: extensionId });
            return { success: true };
        } catch (error) {
            return { success: false, error: String(error) };
        }
    });
}

// ============== App Handlers ==============

export function registerAppHandlers(): void {
    ipcMain.handle('app:info', () => {
        return {
            success: true,
            data: {
                version: app.getVersion(),
                electronVersion: process.versions.electron,
                chromiumVersion: process.versions.chrome,
                dataDir: app.getPath('userData'),
            },
        };
    });

    ipcMain.handle('app:local-api-port', () => {
        return { success: true, data: { port: 54345 } };
    });
}

// ============== Template Handlers ==============

export function registerTemplateHandlers(): void {
    ipcMain.handle('template:list', () => {
        try { return { success: true, data: getTemplates() }; }
        catch (e) { return { success: false, error: String(e) }; }
    });

    ipcMain.handle('template:save', (_e, profileId: string, name: string, description?: string) => {
        try {
            const data = saveTemplate(profileId, name, description);
            logAction('template_created', { name, profileId });
            return { success: true, data };
        }
        catch (e) { return { success: false, error: String(e) }; }
    });

    ipcMain.handle('template:delete', (_e, id: string) => {
        try {
            deleteTemplate(id);
            logAction('template_deleted', { id });
            return { success: true };
        }
        catch (e) { return { success: false, error: String(e) }; }
    });

    ipcMain.handle('template:create-profile', (_e, templateId: string, name: string) => {
        try { return { success: true, data: createProfileFromTemplate(templateId, name) }; }
        catch (e) { return { success: false, error: String(e) }; }
    });

    ipcMain.handle('template:bulk-create', (_e, templateId: string, baseName: string, count: number) => {
        try { return { success: true, data: bulkCreateFromTemplate(templateId, baseName, count) }; }
        catch (e) { return { success: false, error: String(e) }; }
    });
}

// ============== Proxy Pool Handlers ==============

export function registerProxyPoolHandlers(): void {
    ipcMain.handle('proxy-pool:list', () => {
        try { return { success: true, data: getProxyPool() }; }
        catch (e) { return { success: false, error: String(e) }; }
    });

    ipcMain.handle('proxy-pool:add', (_e, input: any) => {
        try { return { success: true, data: addProxyToPool(input) }; }
        catch (e) { return { success: false, error: String(e) }; }
    });

    ipcMain.handle('proxy-pool:bulk-import', (_e, rawText: string) => {
        try { return { success: true, data: bulkImportProxies(rawText) }; }
        catch (e) { return { success: false, error: String(e) }; }
    });

    ipcMain.handle('proxy-pool:remove', (_e, id: string) => {
        try { removeProxyFromPool(id); return { success: true }; }
        catch (e) { return { success: false, error: String(e) }; }
    });

    ipcMain.handle('proxy-pool:test', async (_e, id: string) => {
        try { return { success: true, data: await testPoolProxy(id) }; }
        catch (e) { return { success: false, error: String(e) }; }
    });

    ipcMain.handle('proxy-pool:assign', (_e, proxyId: string, profileId: string) => {
        try { assignProxy(proxyId, profileId); return { success: true }; }
        catch (e) { return { success: false, error: String(e) }; }
    });

    ipcMain.handle('proxy-pool:unassign', (_e, proxyId: string) => {
        try { unassignProxy(proxyId); return { success: true }; }
        catch (e) { return { success: false, error: String(e) }; }
    });
}

// ============== Team Handlers ==============
import { getStoredSession, SERVER_URL } from './auth-manager';

export function registerTeamHandlers(): void {
    async function teamFetch(method: string, path: string, body?: unknown) {
        const session = await getStoredSession();
        if (!session) return { success: false, error: 'Não autenticado' };
        const res = await fetch(`${SERVER_URL}${path}`, {
            method,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.idToken}` },
            body: body ? JSON.stringify(body) : undefined,
        });
        const data = await res.json() as Record<string, unknown>;
        if (!res.ok) return { success: false, error: (data.error as string) ?? 'Erro no servidor' };
        return { success: true, data };
    }

    ipcMain.handle('team:me', () => teamFetch('GET', '/teams/me'));
    ipcMain.handle('team:create', (_e, name: string) => teamFetch('POST', '/teams/create', { name }));
    ipcMain.handle('team:invite', (_e, email: string) => teamFetch('POST', '/teams/invite', { email }));
    ipcMain.handle('team:remove-member', (_e, memberId: string) => teamFetch('DELETE', `/teams/members/${memberId}`));
    ipcMain.handle('team:change-role', (_e, memberId: string, role: string) => teamFetch('PATCH', `/teams/members/${memberId}/role`, { role }));
    ipcMain.handle('team:leave', () => teamFetch('POST', '/teams/leave'));
}

// ============== Auth Handlers ==============
import * as authManager from './auth-manager';

export function registerAuthHandlers(): void {
    ipcMain.handle('auth:check-internet', async () => {
        try {
            const online = await authManager.checkInternet();
            return { success: true, data: online };
        } catch {
            return { success: true, data: false };
        }
    });

    ipcMain.handle('auth:login', async (_event: IpcMainInvokeEvent, email: string, password: string) => {
        try {
            const result = await authManager.login(email, password);
            if (result.success && result.user) {
                logAction('user_logged_in', { email: result.user.email });
            }
            return { success: result.success, data: result.user, error: result.error };
        } catch (err) {
            return { success: false, error: String(err) };
        }
    });

    ipcMain.handle('auth:register', async (_event: IpcMainInvokeEvent, email: string, password: string, name?: string) => {
        try {
            const result = await authManager.register(email, password, name);
            return { success: result.success, data: result.user, error: result.error };
        } catch (err) {
            return { success: false, error: String(err) };
        }
    });

    ipcMain.handle('auth:validate-session', async () => {
        try {
            const result = await authManager.validateSession();
            return { success: result.success, data: result.user, error: result.error };
        } catch (err) {
            return { success: false, error: String(err) };
        }
    });

    ipcMain.handle('auth:logout', async () => {
        try {
            logAction('user_logged_out', {});
            await authManager.logout();
            return { success: true };
        } catch (err) {
            return { success: false, error: String(err) };
        }
    });

    ipcMain.handle('auth:heartbeat', async () => {
        try {
            const result = await authManager.heartbeat();
            return { success: true, data: result };
        } catch (err) {
            return { success: false, error: String(err) };
        }
    });

    ipcMain.handle('auth:reset-password', async (_event: IpcMainInvokeEvent, email: string) => {
        try {
            const result = await authManager.resetPassword(email);
            return { success: result.success, error: result.error };
        } catch (err) {
            return { success: false, error: String(err) };
        }
    });
}

// ============== License Handlers ==============
import * as licenseManager from './license-manager';

export function registerLicenseHandlers(): void {
    // Store license token
    ipcMain.handle('license:set', async (_event: IpcMainInvokeEvent, token: string) => {
        try {
            await licenseManager.setLicenseToken(token);
            return { success: true };
        } catch (err) {
            console.error('[IPC] license:set error:', err);
            return { success: false, error: String(err) };
        }
    });

    ipcMain.handle('license:get', async () => {
        try {
            const token = await licenseManager.getLicenseToken();
            return { success: true, data: token };
        } catch (err) {
            console.error('[IPC] license:get error:', err);
            return { success: false, error: String(err) };
        }
    });

    ipcMain.handle('license:remove', async () => {
        try {
            await licenseManager.removeLicenseToken();
            return { success: true };
        } catch (err) {
            console.error('[IPC] license:remove error:', err);
            return { success: false, error: String(err) };
        }
    });

    ipcMain.handle('license:validate-online', async (_event: IpcMainInvokeEvent, serverUrl: string) => {
        try {
            const res = await licenseManager.validateOnline(serverUrl);
            return { success: true, data: res };
        } catch (err) {
            console.error('[IPC] license:validate-online error:', err);
            return { success: false, error: String(err) };
        }
    });

    ipcMain.handle('license:issue-online', async (_event: IpcMainInvokeEvent, serverUrl: string, userId: string, plan?: string) => {
        try {
            const res = await licenseManager.issueLicenseOnline(serverUrl, userId, plan || 'default');
            return { success: true, data: res };
        } catch (err) {
            console.error('[IPC] license:issue-online error:', err);
            return { success: false, error: String(err) };
        }
    });

    ipcMain.handle('license:device-hwid', async () => {
        try {
            const hwid = licenseManager.deviceHwidHash();
            return { success: true, data: hwid };
        } catch (err) {
            console.error('[IPC] license:device-hwid error:', err);
            return { success: false, error: String(err) };
        }
    });

    // ============== MetaClean Handlers ==============

    ipcMain.handle('metaclean:open-dialog', async () => {
        try {
            const result = await dialog.showOpenDialog({
                properties: ['openFile', 'multiSelections'],
                filters: [
                    { name: 'Arquivos Suportados', extensions: ['jpg', 'jpeg', 'png', 'webp', 'pdf', 'docx', 'mp4', 'mov', 'mp3', 'wav'] },
                    { name: 'Todos os Arquivos', extensions: ['*'] },
                ],
            });
            return { success: true, data: result.canceled ? [] : result.filePaths };
        } catch (err) {
            return { success: false, error: String(err), data: [] };
        }
    });

    ipcMain.handle('metaclean:read-metadata', async (_event: IpcMainInvokeEvent, filePath: string) => {
        try {
            const fields = await readMetadata(filePath);
            return { success: true, data: fields };
        } catch (err) {
            console.error('[IPC] metaclean:read-metadata error:', err);
            return { success: false, error: String(err) };
        }
    });

    ipcMain.handle('metaclean:clean-file', async (_event: IpcMainInvokeEvent, filePath: string) => {
        try {
            const result = await cleanFile(filePath);
            logAction('metadata_cleaned', { filePath, success: result.success });
            return { success: result.success, data: result, error: result.error };
        } catch (err) {
            console.error('[IPC] metaclean:clean-file error:', err);
            return { success: false, error: String(err) };
        }
    });

    ipcMain.handle('metaclean:get-history', async () => {
        try {
            return { success: true, data: getHistory() };
        } catch (err) {
            return { success: false, error: String(err) };
        }
    });

    ipcMain.handle('metaclean:clear-history', async () => {
        try {
            clearHistory();
            logAction('metaclean_history_cleared', {});
            return { success: true };
        } catch (err) {
            return { success: false, error: String(err) };
        }
    });
}

// ============== Browser Data Handlers ==============
import * as dataManager from './profile/data-manager';

export function registerDataHandlers(): void {
    ipcMain.handle('data:stats', async (_e: IpcMainInvokeEvent, profileId: string) => {
        try {
            return { success: true, data: await dataManager.getDataStats(profileId) };
        } catch (err) { return { success: false, error: String(err) }; }
    });

    // ── Cookies ──
    ipcMain.handle('data:cookies:list', async (_e: IpcMainInvokeEvent, profileId: string) => {
        try {
            return { success: true, data: await dataManager.getCookies(profileId) };
        } catch (err) { return { success: false, error: String(err) }; }
    });

    ipcMain.handle('data:cookies:import', async (_e: IpcMainInvokeEvent, profileId: string, content: string) => {
        try {
            return { success: true, data: await dataManager.importCookiesNetscape(profileId, content) };
        } catch (err) { return { success: false, error: String(err) }; }
    });

    ipcMain.handle('data:cookies:export', async (_e: IpcMainInvokeEvent, profileId: string) => {
        try {
            return { success: true, data: await dataManager.exportCookiesNetscape(profileId) };
        } catch (err) { return { success: false, error: String(err) }; }
    });

    ipcMain.handle('data:cookies:clear', async (_e: IpcMainInvokeEvent, profileId: string) => {
        try {
            await dataManager.clearCookies(profileId);
            return { success: true };
        } catch (err) { return { success: false, error: String(err) }; }
    });

    ipcMain.handle('data:cookies:open-import-dialog', async (_e: IpcMainInvokeEvent, profileId: string) => {
        try {
            const result = await dialog.showOpenDialog({
                properties: ['openFile'],
                filters: [
                    { name: 'Cookie Files', extensions: ['txt', 'cookies'] },
                    { name: 'All Files', extensions: ['*'] },
                ],
            });
            if (result.canceled || !result.filePaths[0]) return { success: true, data: null };
            const content = fs.readFileSync(result.filePaths[0], 'utf-8');
            const stats = await dataManager.importCookiesNetscape(profileId, content);
            return { success: true, data: stats };
        } catch (err) { return { success: false, error: String(err) }; }
    });

    ipcMain.handle('data:cookies:save-export', async (_e: IpcMainInvokeEvent, profileId: string) => {
        try {
            const result = await dialog.showSaveDialog({
                defaultPath: `cookies_${profileId.slice(0, 8)}.txt`,
                filters: [{ name: 'Cookie File', extensions: ['txt'] }],
            });
            if (result.canceled || !result.filePath) return { success: true, data: null };
            const content = await dataManager.exportCookiesNetscape(profileId);
            fs.writeFileSync(result.filePath, content, 'utf-8');
            return { success: true, data: result.filePath };
        } catch (err) { return { success: false, error: String(err) }; }
    });

    // ── History ──
    ipcMain.handle('data:history:list', async (_e: IpcMainInvokeEvent, profileId: string, limit?: number) => {
        try {
            return { success: true, data: await dataManager.getHistory(profileId, limit ?? 200) };
        } catch (err) { return { success: false, error: String(err) }; }
    });

    ipcMain.handle('data:history:clear', async (_e: IpcMainInvokeEvent, profileId: string) => {
        try {
            await dataManager.clearHistory(profileId);
            return { success: true };
        } catch (err) { return { success: false, error: String(err) }; }
    });

    // ── Bookmarks ──
    ipcMain.handle('data:bookmarks:list', async (_e: IpcMainInvokeEvent, profileId: string) => {
        try {
            return { success: true, data: await dataManager.getBookmarks(profileId) };
        } catch (err) { return { success: false, error: String(err) }; }
    });

    ipcMain.handle('data:bookmarks:add', async (_e: IpcMainInvokeEvent, profileId: string, name: string, url: string) => {
        try {
            await dataManager.addBookmark(profileId, name, url);
            return { success: true };
        } catch (err) { return { success: false, error: String(err) }; }
    });

    ipcMain.handle('data:bookmarks:delete', async (_e: IpcMainInvokeEvent, profileId: string, bookmarkId: string) => {
        try {
            await dataManager.deleteBookmark(profileId, bookmarkId);
            return { success: true };
        } catch (err) { return { success: false, error: String(err) }; }
    });

    ipcMain.handle('data:bookmarks:clear', async (_e: IpcMainInvokeEvent, profileId: string) => {
        try {
            await dataManager.clearBookmarks(profileId);
            return { success: true };
        } catch (err) { return { success: false, error: String(err) }; }
    });

    // ── Clear All ──
    ipcMain.handle('data:clear-all', async (_e: IpcMainInvokeEvent, profileId: string, options: { cookies?: boolean; history?: boolean; bookmarks?: boolean; cache?: boolean }) => {
        try {
            await dataManager.clearAllData(profileId, options);
            return { success: true };
        } catch (err) { return { success: false, error: String(err) }; }
    });
}

// ============== AI Engine Handlers ==============
import * as aiBridge from './ai/score-engine';
import { extractProfileFeatures } from './ai/feature-extractor';
import { getRecentLogs } from './ai/audit-logger';

export function registerAiHandlers(): void {
    ipcMain.handle('ai:predict-score', async (_e: IpcMainInvokeEvent, profileId: string) => {
        try {
            const features = extractProfileFeatures(profileId);
            const prediction = await aiBridge.predictScore(features);
            return { success: true, data: prediction };
        } catch (err) {
            return { success: false, error: String(err) };
        }
    });

    ipcMain.handle('ai:submit-feedback', async (_e: IpcMainInvokeEvent, profileId: string, feedback: 'thumbs_up' | 'thumbs_down') => {
        try {
            const features = extractProfileFeatures(profileId);
            await aiBridge.submitFeedback(profileId, feedback, features);
            return { success: true };
        } catch (err) {
            return { success: false, error: String(err) };
        }
    });
    
    ipcMain.handle('ai:get-audit-logs', async (_e: IpcMainInvokeEvent, limit?: number) => {
        try {
            const logs = getRecentLogs(limit);
            return { success: true, data: logs };
        } catch (err) {
            return { success: false, error: String(err) };
        }
    });
}

// ============== Canvas Card File Handlers ==============
export function registerCardHandlers(): void {
    console.log('[IPC] Registering card handlers...');
    const CARDS_DIR = path.join(app.getPath('userData'), 'canvas-cards');

    // Make sure dir exists
    if (!fs.existsSync(CARDS_DIR)) {
        fs.mkdirSync(CARDS_DIR, { recursive: true });
    }

    ipcMain.handle('cards:save', async (_event: IpcMainInvokeEvent, cardId: string, data: any) => {
        try {
            const filePath = path.join(CARDS_DIR, `${cardId}.json`);
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');

            // Also save as an easily readable Markdown file for backup/recovery!
            const mdPath = path.join(CARDS_DIR, `${cardId}.md`);
            const title = data.title || 'Sem título';
            const content = data.content || '';
            const commentsSection = (data.comments || []).map((c: any) => {
                const author = c.author || 'Usuário';
                const date = c.createdAt ? new Date(c.createdAt).toLocaleString() : '';
                return `> **${author}** (${date}): ${c.text}`;
            }).join('\n\n');

            const mdContent = `# ${title}\n\n${content}\n\n## Comentários\n\n${commentsSection || '*Nenhum comentário.*'}`;
            fs.writeFileSync(mdPath, mdContent, 'utf-8');

            return { success: true, path: filePath, mdPath };
        } catch (error) {
            console.error('[IPC] cards:save error:', error);
            return { success: false, error: String(error) };
        }
    });

    ipcMain.handle('cards:get', async (_event: IpcMainInvokeEvent, cardId: string) => {
        try {
            const filePath = path.join(CARDS_DIR, `${cardId}.json`);
            if (fs.existsSync(filePath)) {
                const raw = fs.readFileSync(filePath, 'utf-8');
                return { success: true, data: JSON.parse(raw) };
            } else {
                // Return default card structured data
                return {
                    success: true,
                    data: {
                        title: 'Novo Card',
                        content: '',
                        comments: []
                    }
                };
            }
        } catch (error) {
            console.error('[IPC] cards:get error:', error);
            return { success: false, error: String(error) };
        }
    });
}
