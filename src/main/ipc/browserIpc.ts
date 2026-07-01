import { ipcMain, IpcMainInvokeEvent } from 'electron';
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
} from '../features/browser/browser-engine';
import { isBrowserInstalled, downloadBrowser } from '../features/browser/downloader';
import { logAction } from '../features/ai/audit-logger';
import { BrowserType } from '../features/profile/types';

export function registerBrowserIpcHandlers(): void {
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

    // Warm up a profile
    ipcMain.handle('profile:warmup-start', async (event: IpcMainInvokeEvent, profileId: string) => {
        try {
            const sender = event.sender;
            warmupProfile(profileId, (progress: any) => {
                if (!sender.isDestroyed()) {
                    sender.send('profile:warmup-progress', { profileId, ...progress });
                }
            }).then((result: any) => {
                if (!sender.isDestroyed()) {
                    sender.send('profile:warmup-complete', { profileId, ...result });
                }
            }).catch((err: any) => {
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

    // Check if a browser is installed
    ipcMain.handle('browser:check-installed', async (_event: IpcMainInvokeEvent, browserType: BrowserType) => {
        try {
            const installed = isBrowserInstalled(browserType);
            return { success: true, data: installed };
        } catch (error) {
            console.error('[IPC] browser:check-installed error:', error);
            return { success: false, error: String(error) };
        }
    });

    // Download/install a browser
    ipcMain.handle('browser:install', async (event: IpcMainInvokeEvent, browserType: BrowserType) => {
        try {
            const sender = event.sender;
            const execPath = await downloadBrowser(browserType, (progress: any) => {
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
}
