/**
 * ============================================================================
 * MÓDULO MULTI - HANDLERS IPC
 * ============================================================================
 * Registra os canais IPC para interação com a UI do Multi no Renderer Process.
 */

import { ipcMain } from 'electron';
import { MultiManager } from './multi-manager';

export function registerMultiIpcHandlers(): void {
    ipcMain.handle('multi:launch-profiles', async (_, profileIds: string[]) => {
        return await MultiManager.launchProfiles(profileIds);
    });

    ipcMain.handle('multi:stop-profiles', async (_, profileIds: string[]) => {
        return await MultiManager.stopProfiles(profileIds);
    });

    ipcMain.handle('multi:stop-all', async () => {
        await MultiManager.stopAll();
        return true;
    });

    ipcMain.handle('multi:get-status', () => {
        return MultiManager.getActiveProfilesStatus();
    });
}
