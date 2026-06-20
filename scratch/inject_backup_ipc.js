const fs = require('fs');

let code = fs.readFileSync('src/main/ipc-handlers.ts', 'utf8');

if (!code.includes("import { exportProfile, importProfile }")) {
    code = code.replace(
        "import { generateFingerprint } from './fingerprint/generator';",
        "import { generateFingerprint } from './fingerprint/generator';\nimport { exportProfile, importProfile } from './profile/backup-manager';"
    );
}

const exportImportHandlers = `
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
`;

if (!code.includes("ipcMain.handle('profile:export-zip'")) {
    code = code.replace(
        "ipcMain.handle('profile:export', async (_event: IpcMainInvokeEvent, profileIds: string[]) => {",
        exportImportHandlers + "\n    ipcMain.handle('profile:export', async (_event: IpcMainInvokeEvent, profileIds: string[]) => {"
    );
}

fs.writeFileSync('src/main/ipc-handlers.ts', code);
console.log("Added backup/zip IPC handlers.");
