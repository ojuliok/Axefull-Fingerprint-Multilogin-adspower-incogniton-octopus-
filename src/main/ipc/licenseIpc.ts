import { ipcMain, IpcMainInvokeEvent } from 'electron';
import * as licenseManager from '../services/license-manager';

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
}
