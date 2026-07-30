import { ipcMain, IpcMainInvokeEvent, dialog } from 'electron';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import {
    createProfile,
    getAllProfiles,
    getProfileById,
    updateProfile,
    updateProfileProxy,
    regenerateProfileFingerprint,
    deleteProfile,
    updateProfileStatus,
    cloneProfile,
    importProfiles,
    emptyTrash,
} from '../features/profile/profile-manager';
import { exportProfile, importProfile } from '../features/profile/backup-manager';
import { logAction } from '../features/ai/audit-logger';
import { isProfileActive, closeProfile } from '../features/browser/browser-engine';
import { CreateProfileInput, UpdateProfileInput, UpdateProxyInput, ProfileStatus } from '../features/profile/types';
import { findAll, insert, update, remove, getDb } from '../database/db';

export function registerProfileIpcHandlers(): void {
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

    // Import profiles from a JSON file
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

    // Empty trash
    ipcMain.handle('profile:empty-trash', async () => {
        try {
            const count = emptyTrash();
            return { success: true, data: { count } };
        } catch (error) {
            console.error('[IPC] profile:empty-trash error:', error);
            return { success: false, error: String(error) };
        }
    });

    // Export ZIP (Perfil + Navegador + Fingerprint)
    ipcMain.handle('profile:export-zip', async (_event: IpcMainInvokeEvent, profileId: string, destPath?: string) => {
        try {
            let targetPath = destPath;
            if (!targetPath) {
                const profile = getProfileById(profileId);
                const safeName = (profile?.name || profileId).replace(/[^a-zA-Z0-9_-]/g, '_');
                const { filePath, canceled } = await dialog.showSaveDialog({
                    title: 'Extrair Todos os Dados do Perfil e Navegador',
                    defaultPath: `axe_profile_${safeName}_data.axeprofile`,
                    filters: [
                        { name: 'Axe Profile Package (.axeprofile)', extensions: ['axeprofile'] },
                        { name: 'Arquivo ZIP (.zip)', extensions: ['zip'] }
                    ],
                });
                if (canceled || !filePath) return { success: false, error: 'cancelled' };
                targetPath = filePath;
            }
            await exportProfile(profileId, targetPath);
            return { success: true, data: { path: targetPath } };
        } catch (error: any) {
            console.error('Error in profile:export-zip:', error);
            return { success: false, error: error.message };
        }
    });

    // Import ZIP (Perfil + Navegador + Fingerprint)
    ipcMain.handle('profile:import-zip', async (_event: IpcMainInvokeEvent, sourcePath?: string) => {
        try {
            let targetPath = sourcePath;
            if (!targetPath) {
                const { filePaths, canceled } = await dialog.showOpenDialog({
                    title: 'Importar Pacote Completo de Perfil e Navegador',
                    filters: [
                        { name: 'Axe Profile Package (.axeprofile, .zip)', extensions: ['axeprofile', 'zip'] }
                    ],
                    properties: ['openFile'],
                });
                if (canceled || filePaths.length === 0) return { success: false, error: 'cancelled' };
                targetPath = filePaths[0];
            }
            const profile = await importProfile(targetPath);
            return { success: true, profile };
        } catch (error: any) {
            console.error('Error in profile:import-zip:', error);
            return { success: false, error: error.message };
        }
    });

    // Export JSON (Completo com Fingerprint, Cookies, Histórico, Bookmarks, Proxy)
    ipcMain.handle('profile:export', async (_event: IpcMainInvokeEvent, profileIds: string[]) => {
        try {
            const dataManager = await import('../features/profile/data-manager');
            const fullProfiles = await Promise.all(profileIds.map(async (id) => {
                const profile = getProfileById(id);
                if (!profile) return null;

                const [cookies, history, bookmarks] = await Promise.all([
                    dataManager.getCookies(id).catch(() => []),
                    dataManager.getHistory(id, 500).catch(() => []),
                    dataManager.getBookmarks(id).catch(() => []),
                ]);

                return {
                    ...profile,
                    cookies,
                    history,
                    bookmarks,
                };
            }));

            const validProfiles = fullProfiles.filter(Boolean);

            const exportData = {
                version: '2.0',
                app: 'Axe MultiLogin',
                exported_at: new Date().toISOString(),
                count: validProfiles.length,
                profiles: validProfiles,
            };

            const { filePath, canceled } = await dialog.showSaveDialog({
                title: 'Exportar Perfis Completo (JSON)',
                defaultPath: `axe-profiles-full-${Date.now()}.json`,
                filters: [{ name: 'Axe Profile Full Export (JSON)', extensions: ['json'] }],
            });

            if (canceled || !filePath) {
                return { success: false, error: 'cancelled' };
            }

            fs.writeFileSync(filePath, JSON.stringify(exportData, null, 2), 'utf-8');
            logAction('profiles_exported', { count: validProfiles.length, path: filePath });
            return { success: true, data: { path: filePath, count: validProfiles.length } };
        } catch (error) {
            console.error('[IPC] profile:export error:', error);
            return { success: false, error: String(error) };
        }
    });
}
