import { ipcMain, IpcMainInvokeEvent, dialog } from 'electron';
import fs from 'fs';
import * as dataManager from '../features/profile/data-manager';

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
