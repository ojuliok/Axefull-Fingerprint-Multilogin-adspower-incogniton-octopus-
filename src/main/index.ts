import { app, BrowserWindow, Tray, Menu } from 'electron';
import path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });
dotenv.config({ path: path.join(__dirname, '..', '..', '..', 'Axefull - CRM', '.env.local') });

import { initDatabase, closeDatabase } from './database/db';
import {
    registerIpcHandlers,
    registerLicenseHandlers,
    registerAuthHandlers,
    registerDataHandlers,
    registerExtensionHandlers,
    registerTeamHandlers,
    registerAiHandlers,
    registerCardHandlers,
    registerAppHandlers,
    registerTemplateHandlers,
    registerProxyPoolHandlers
} from './ipc-handlers';
import { registerBulkVideoHandlers } from './ipc/bulkVideoHandlers';
import { closeAllProfiles } from './browser/browser-engine';
import { startSupabaseListener, stopSupabaseListener } from './supabase-listener';
import { startLocalApiServer, stopLocalApiServer } from './local-api/local-api-server';

let tray: Tray | null = null;
let mainWindow: BrowserWindow | null = null;
let isQuitting = false;

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', (event, commandLine) => {
        const url = commandLine.find(arg => arg.startsWith('axeagent://'));
        if (url) {
            handleProtocolUrl(url);
        }
        // Se o usuário tentou abrir uma segunda instância, mostrar a janela existente
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.show();
            mainWindow.focus();
        }
    });
}

app.on('open-url', (event, url) => {
    event.preventDefault();
    handleProtocolUrl(url);
});

function handleProtocolUrl(urlStr: string) {
    try {
        const parsedUrl = new URL(urlStr);
        if (parsedUrl.host === 'bind') {
            const token = parsedUrl.searchParams.get('token');
            if (token) {
                const fs = require('fs');
                const configPath = path.join(app.getPath('userData'), 'config.json');
                let config: any = {};
                if (fs.existsSync(configPath)) {
                    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                }
                config.supabaseToken = token;
                fs.writeFileSync(configPath, JSON.stringify(config));
                
                stopSupabaseListener();
                startSupabaseListener();
                console.log('✅ Agente vinculado com sucesso via protocolo!');
            }
        }
    } catch (error) {
        console.error('Falha ao processar URL do protocolo:', error);
    }
}

/**
 * Create the main application window with the React UI
 */
function createMainWindow(): void {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 900,
        minHeight: 600,
        show: false,
        title: 'Axefull - Fingerprint Browser',
        icon: path.join(__dirname, '..', '..', 'assets', 'icon.png'),
        webPreferences: {
            preload: path.join(__dirname, '..', 'preload', 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            webviewTag: true,
        },
    });

    // Carregar a UI: em desenvolvimento usa o Vite dev server, em produção o build
    if (process.env.NODE_ENV === 'development') {
        mainWindow.loadURL('http://localhost:5173');
        // Abrir DevTools automaticamente em dev
        mainWindow.webContents.openDevTools({ mode: 'detach' });
    } else {
        mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
    }

    // Mostrar janela somente quando estiver pronta (evita flash branco)
    mainWindow.once('ready-to-show', () => {
        mainWindow?.show();
    });

    // Minimizar para o tray ao fechar a janela (ao invés de encerrar o app)
    mainWindow.on('close', (event) => {
        if (!isQuitting) {
            event.preventDefault();
            mainWindow?.hide();
        }
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

/**
 * Initialize System Tray with option to reopen the main window
 */
function createTray(): void {
    try {
        const iconPath = path.join(__dirname, '..', '..', 'assets', 'icon.png');
        tray = new Tray(iconPath);
        const contextMenu = Menu.buildFromTemplate([
            { label: 'Axefull Fingerprint - Online', enabled: false },
            { type: 'separator' },
            {
                label: 'Abrir Painel',
                click: () => {
                    if (mainWindow) {
                        mainWindow.show();
                        mainWindow.focus();
                    } else {
                        createMainWindow();
                    }
                }
            },
            { type: 'separator' },
            {
                label: 'Sair Completamente',
                click: () => {
                    isQuitting = true;
                    app.quit();
                }
            }
        ]);
        tray.setToolTip('Axefull - Fingerprint Browser');
        tray.setContextMenu(contextMenu);

        // Clique no ícone do tray reabre a janela
        tray.on('click', () => {
            if (mainWindow) {
                if (mainWindow.isVisible()) {
                    mainWindow.focus();
                } else {
                    mainWindow.show();
                    mainWindow.focus();
                }
            } else {
                createMainWindow();
            }
        });
    } catch (e) {
        console.error('Erro ao carregar icone do tray', e);
    }
}

/**
 * Initialize the application
 */
async function init(): Promise<void> {
    console.log('[Main] Initializing Axefull Fingerprint Browser...');

    // Inicializar bandeja do sistema
    createTray();

    // Criar janela principal com a interface React
    createMainWindow();

    // Initialize database (async for sql.js)
    await initDatabase();

    // Register IPC handlers
    registerAuthHandlers();
    registerIpcHandlers();
    registerLicenseHandlers();
    registerDataHandlers();
    registerExtensionHandlers();
    registerAppHandlers();
    registerTemplateHandlers();
    registerProxyPoolHandlers();
    registerTeamHandlers();
    registerAiHandlers();
    registerCardHandlers();
    registerBulkVideoHandlers();

    // Start Supabase listener for launch commands
    startSupabaseListener();

    // Start local REST API server on port 54345
    startLocalApiServer();

    console.log('[Main] Initialization complete. Interface aberta.');
}

// App ready
app.whenReady().then(init);

// Não fechar o app quando todas as janelas forem fechadas (fica no tray)
app.on('window-all-closed', () => {
    // App continua rodando na bandeja do sistema
});

// Re-criar janela no macOS quando o ícone do dock for clicado
app.on('activate', () => {
    if (!mainWindow) {
        createMainWindow();
    } else {
        mainWindow.show();
    }
});

// Marcar que está realmente encerrando antes de quit
let isActuallyQuitting = false;
app.on('before-quit', async (event) => {
    if (isActuallyQuitting) return;
    
    event.preventDefault(); // Evita que o app feche antes do encerramento assíncrono
    isActuallyQuitting = true;
    isQuitting = true;

    console.log('[Main] Shutting down...');
    try {
        stopSupabaseListener();
        stopLocalApiServer();
        await closeAllProfiles();
        closeDatabase();
    } catch (err) {
        console.error('[Main] Error during shutdown:', err);
    } finally {
        app.quit(); // Agora sim, encerra o app
    }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('[Main] Uncaught exception:', error);
});

process.on('unhandledRejection', (reason) => {
    console.error('[Main] Unhandled rejection:', reason);
});
