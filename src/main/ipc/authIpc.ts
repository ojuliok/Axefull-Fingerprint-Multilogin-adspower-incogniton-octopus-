import { ipcMain, IpcMainInvokeEvent } from 'electron';
import * as authManager from '../services/auth-manager';
import { logAction } from '../features/ai/audit-logger';

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
            return { success: result.success, data: result.user, error: result.error, session: result.session };
        } catch (err) {
            return { success: false, error: String(err) };
        }
    });

    ipcMain.handle('auth:register', async (_event: IpcMainInvokeEvent, email: string, password: string, name?: string) => {
        try {
            const result = await authManager.register(email, password, name);
            return { success: result.success, data: result.user, error: result.error, session: result.session };
        } catch (err) {
            return { success: false, error: String(err) };
        }
    });

    ipcMain.handle('auth:validate-session', async () => {
        try {
            const result = await authManager.validateSession();
            return { success: result.success, data: result.user, error: result.error, session: result.session };
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
