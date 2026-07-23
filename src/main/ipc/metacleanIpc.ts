import { ipcMain, dialog } from 'electron';
import { readMetadata, cleanFile, getHistory, clearHistory } from '../services/metaclean';

export function registerMetaCleanHandlers(): void {
    // Abre o diálogo de seleção de arquivo e retorna a lista de arquivos selecionados
    ipcMain.handle('metaclean:open-dialog', async () => {
        const result = await dialog.showOpenDialog({
            title: 'Selecionar arquivo para limpar metadados',
            buttonLabel: 'Selecionar',
            filters: [
                {
                    name: 'Arquivos suportados',
                    extensions: ['jpg', 'jpeg', 'png', 'webp', 'pdf', 'docx', 'mp3', 'wav', 'mp4', 'mov'],
                },
                { name: 'Imagens', extensions: ['jpg', 'jpeg', 'png', 'webp'] },
                { name: 'Documentos', extensions: ['pdf', 'docx'] },
                { name: 'Áudio', extensions: ['mp3', 'wav'] },
                { name: 'Vídeo', extensions: ['mp4', 'mov'] },
                { name: 'Todos os arquivos', extensions: ['*'] },
            ],
            properties: ['openFile', 'multiSelections'],
        });

        if (result.canceled || result.filePaths.length === 0) {
            return { success: true, data: [] };
        }

        // Retorna os metadados de todos os arquivos selecionados
        const files = await Promise.all(
            result.filePaths.map(async (filePath) => {
                const fields = await readMetadata(filePath);
                return { path: filePath, fields };
            })
        );

        return { success: true, data: files };
    });

    // Lê os metadados de um arquivo específico
    ipcMain.handle('metaclean:read-metadata', async (_event, filePath: string) => {
        try {
            const fields = await readMetadata(filePath);
            return { success: true, data: fields };
        } catch (error) {
            return { success: false, error: String(error) };
        }
    });

    // Limpa os metadados de um arquivo específico
    ipcMain.handle('metaclean:clean-file', async (_event, filePath: string) => {
        try {
            const result = await cleanFile(filePath);
            return result.success
                ? { success: true, data: result }
                : { success: false, error: result.error };
        } catch (error) {
            return { success: false, error: String(error) };
        }
    });

    // Retorna o histórico de limpezas
    ipcMain.handle('metaclean:get-history', () => {
        try {
            const history = getHistory();
            return { success: true, data: history };
        } catch (error) {
            return { success: false, error: String(error) };
        }
    });

    // Limpa o histórico de limpezas
    ipcMain.handle('metaclean:clear-history', () => {
        try {
            clearHistory();
            return { success: true };
        } catch (error) {
            return { success: false, error: String(error) };
        }
    });
}
