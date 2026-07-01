import { ipcMain, IpcMainInvokeEvent } from 'electron';
import * as aiBridge from '../features/ai/score-engine';
import { extractProfileFeatures } from '../features/ai/feature-extractor';
import { getRecentLogs } from '../features/ai/audit-logger';

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
