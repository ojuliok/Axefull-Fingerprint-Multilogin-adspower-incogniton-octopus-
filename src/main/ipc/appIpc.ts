import { ipcMain, IpcMainInvokeEvent, app, dialog, session, BrowserWindow, shell } from 'electron';
import path from 'path';
import fs from 'fs';
import { sendEmail } from '../services/email-manager';
import { listExtensions, installExtension, deleteExtension } from '../services/extensions-manager';
import {
    getTemplates,
    saveTemplate,
    deleteTemplate,
    createProfileFromTemplate,
    bulkCreateFromTemplate,
} from '../features/profile/template-manager';
import {
    getProxyPool,
    addProxyToPool,
    bulkImportProxies,
    removeProxyFromPool,
    testPoolProxy,
    assignProxy,
    unassignProxy,
} from '../features/proxy/proxy-pool-manager';
import { getStoredSession, SERVER_URL } from '../services/auth-manager';
import { logAction } from '../features/ai/audit-logger';

let notesWindow: BrowserWindow | null = null;

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

    ipcMain.handle('email:send', async (_event, params: any) => {
        return sendEmail(params);
    });

    // ── Webview Proxy (Corrected Handler) ──
    ipcMain.handle('app:set-webview-proxy', async (_event: IpcMainInvokeEvent, partitionId: string, proxyUrl: string) => {
        try {
            const ses = session.fromPartition(partitionId);
            await ses.setProxy({ proxyRules: proxyUrl });
            return { success: true };
        } catch (err) {
            console.error('[IPC] app:set-webview-proxy error:', err);
            return { success: false, error: String(err) };
        }
    });

    // ── Notes Widget Open/Close (Corrected Handlers) ──
    ipcMain.handle('app:open-notes-widget', () => {
        try {
            if (notesWindow) {
                notesWindow.show();
                return { success: true };
            }
            notesWindow = new BrowserWindow({
                width: 400,
                height: 600,
                webPreferences: {
                    preload: path.join(__dirname, '..', 'preload', 'preload.js'),
                    contextIsolation: true,
                    nodeIntegration: false,
                }
            });
            if (process.env.NODE_ENV === 'development') {
                notesWindow.loadURL('http://localhost:5173/#/notes-widget');
            } else {
                notesWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'), { hash: '/notes-widget' });
            }
            notesWindow.on('closed', () => {
                notesWindow = null;
            });
            return { success: true };
        } catch (err) {
            console.error('[IPC] app:open-notes-widget error:', err);
            return { success: false, error: String(err) };
        }
    });

    ipcMain.handle('app:close-notes-widget', () => {
        try {
            if (notesWindow) {
                notesWindow.close();
            }
            return { success: true };
        } catch (err) {
            console.error('[IPC] app:close-notes-widget error:', err);
            return { success: false, error: String(err) };
        }
    });

    // ── Open External (Corrected Handler) ──
    ipcMain.handle('app:open-external', async (_event: IpcMainInvokeEvent, url: string) => {
        try {
            await shell.openExternal(url);
            return { success: true };
        } catch (err) {
            console.error('[IPC] app:open-external error:', err);
            return { success: false, error: String(err) };
        }
    });

    // ── Fixed Bookmark Settings ──
    ipcMain.handle('app:get-fixed-bookmark', async () => {
        try {
            const configPath = path.join(app.getPath('userData'), 'config.json');
            let fixedBookmarkUrl = '';
            let fixedBookmarkName = '';
            if (fs.existsSync(configPath)) {
                const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                fixedBookmarkUrl = config.fixedBookmarkUrl || '';
                fixedBookmarkName = config.fixedBookmarkName || '';
            }
            return { success: true, data: { name: fixedBookmarkName, url: fixedBookmarkUrl } };
        } catch (err) {
            return { success: false, error: String(err) };
        }
    });

    ipcMain.handle('app:save-fixed-bookmark', async (_event, name: string, url: string) => {
        try {
            const configPath = path.join(app.getPath('userData'), 'config.json');
            let config: any = {};
            if (fs.existsSync(configPath)) {
                config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            }
            config.fixedBookmarkUrl = url;
            config.fixedBookmarkName = name;
            fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
            return { success: true };
        } catch (err) {
            return { success: false, error: String(err) };
        }
    });
}

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

    ipcMain.handle('proxy-pool:assign', (_e, proxyId: string, profileIds: string[]) => {
        try { assignProxy(proxyId, profileIds); return { success: true }; }
        catch (e) { return { success: false, error: String(e) }; }
    });

    ipcMain.handle('proxy-pool:unassign', (_e, proxyId: string) => {
        try { unassignProxy(proxyId); return { success: true }; }
        catch (e) { return { success: false, error: String(e) }; }
    });
}

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

export function registerCardHandlers(): void {
    const CARDS_DIR = path.join(app.getPath('userData'), 'canvas-cards');

    if (!fs.existsSync(CARDS_DIR)) {
        fs.mkdirSync(CARDS_DIR, { recursive: true });
    }

    ipcMain.handle('cards:save', async (_event: IpcMainInvokeEvent, cardId: string, data: any) => {
        try {
            const filePath = path.join(CARDS_DIR, `${cardId}.json`);
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');

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
