import { chromium, firefox, BrowserContext, Page } from 'playwright';
import { isBrowserInstalled, downloadBrowser, getBrowserExecutablePath } from './downloader';
import path from 'path';
import fs from 'fs';
import net from 'net';
import { BrowserWindow } from 'electron';
import { Fingerprint, Proxy, ProfileWithDetails, BrowserType } from '../profile/types';
import { getProfileById, setProfileActive, updateLastUsed } from '../profile/profile-manager';
import { getExtensionPaths } from '../extensions-manager';
import fontsData from '../fingerprint/presets/fonts.json';
import { logAction } from '../ai/audit-logger';
import { extractProfileFeatures } from '../ai/feature-extractor';

// Store active browser contexts
const activeContexts: Map<string, BrowserContext> = new Map();

// Store CDP debug ports per profile
const activePorts: Map<string, number> = new Map();

// Store active warmup AbortControllers
const activeWarmups: Map<string, AbortController> = new Map();

async function findFreePort(): Promise<number> {
    return new Promise((resolve, reject) => {
        const server = net.createServer();
        server.unref();
        server.on('error', reject);
        server.listen(0, () => {
            const port = (server.address() as net.AddressInfo).port;
            server.close(() => resolve(port));
        });
    });
}

export function getProfileCdpUrl(profileId: string): string | null {
    const port = activePorts.get(profileId);
    return port ? `http://127.0.0.1:${port}` : null;
}

// ============================================================
// HTTP header builders for fingerprint consistency
// ============================================================

function buildAcceptLanguage(languages: string): string {
    const langs = languages.split(',').map(l => l.trim()).filter(Boolean);
    return langs.map((lang, i) => {
        if (i === 0) return lang;
        const q = Math.max(0.1, 1 - i * 0.1).toFixed(1);
        return `${lang};q=${q}`;
    }).join(',');
}

function buildSecChUa(userAgent: string): string {
    const majorMatch = userAgent.match(/Chrome\/(\d+)/);
    const major = majorMatch ? majorMatch[1] : '131';
    const majorNum = parseInt(major, 10);
    const notBrandVersion = majorNum >= 128 ? '24' : '8';
    if (userAgent.includes('Edg/')) {
        const edgeMatch = userAgent.match(/Edg\/(\d+)/);
        const edgeMajor = edgeMatch ? edgeMatch[1] : major;
        return `"Microsoft Edge";v="${edgeMajor}", "Chromium";v="${major}", "Not A Brand";v="${notBrandVersion}"`;
    }
    return `"Google Chrome";v="${major}", "Chromium";v="${major}", "Not A Brand";v="${notBrandVersion}"`;
}

function buildSecChUaPlatform(platform: string): string {
    if (platform === 'MacIntel') return '"macOS"';
    if (platform.includes('Linux')) return '"Linux"';
    return '"Windows"';
}

function buildConsistentHeaders(fingerprint: Fingerprint, browserType: BrowserType): Record<string, string> {
    const headers: Record<string, string> = {
        'Accept-Language': buildAcceptLanguage(fingerprint.languages),
    };

    // Client Hints are Chromium-only — Firefox does not send them
    if (browserType === 'chromium') {
        headers['Sec-CH-UA'] = buildSecChUa(fingerprint.user_agent);
        headers['Sec-CH-UA-Mobile'] = '?0';
        headers['Sec-CH-UA-Platform'] = buildSecChUaPlatform(fingerprint.platform);
    }

    return headers;
}

// ============================================================
// Script cache — loaded once at first launch, not per profile
// ============================================================
let _scriptCache: Map<string, string> | null = null;

function getScriptCache(): Map<string, string> {
    if (_scriptCache) return _scriptCache;

    const dir = path.join(__dirname, '..', 'fingerprint', 'inject-scripts');
    const files = [
        '00-cleanup.js', 'navigator.js', 'canvas.js', 'webgl.js',
        'webrtc.js', 'audio.js', 'fonts.js', 'intl.js', 'protection.js',
        'geolocation.js', 'sensors.js', 'advanced.js', 'worker-bridge.js', 'extras.js',
    ];
    _scriptCache = new Map();
    for (const f of files) {
        _scriptCache.set(f, fs.readFileSync(path.join(dir, f), 'utf-8'));
    }
    return _scriptCache;
}

function readScript(filename: string): string {
    return getScriptCache().get(filename)!;
}

// ============================================================
// Script builders — use JSON.stringify for all string values
// to safely handle quotes, backslashes and other special chars
// ============================================================

function getCleanupScript(): string {
    return readScript('00-cleanup.js');
}

function getCanvasScript(seed: string): string {
    return readScript('canvas.js')
        .replaceAll("'CANVAS_SEED_PLACEHOLDER'", JSON.stringify(seed));
}

function getWebGLScript(fingerprint: Fingerprint): string {
    return readScript('webgl.js')
        .replaceAll("'WEBGL_VENDOR_PLACEHOLDER'", JSON.stringify(fingerprint.webgl_vendor))
        .replaceAll("'WEBGL_RENDERER_PLACEHOLDER'", JSON.stringify(fingerprint.renderer))
        .replaceAll("'WEBGL_SEED_PLACEHOLDER'", JSON.stringify(fingerprint.webgl_noise_seed));
}

function getNavigatorScript(fingerprint: Fingerprint): string {
    return readScript('navigator.js')
        .replaceAll("'USER_AGENT_PLACEHOLDER'", JSON.stringify(fingerprint.user_agent))
        .replaceAll("'PLATFORM_PLACEHOLDER'", JSON.stringify(fingerprint.platform))
        .replaceAll("'VENDOR_PLACEHOLDER'", JSON.stringify(fingerprint.vendor))
        .replaceAll('HARDWARE_CONCURRENCY_PLACEHOLDER', String(fingerprint.hardware_concurrency))
        .replaceAll('DEVICE_MEMORY_PLACEHOLDER', String(fingerprint.device_memory))
        .replaceAll('SCREEN_WIDTH_PLACEHOLDER', String(fingerprint.screen_width))
        .replaceAll('SCREEN_HEIGHT_PLACEHOLDER', String(fingerprint.screen_height))
        .replaceAll('VIEWPORT_WIDTH_PLACEHOLDER', String(fingerprint.viewport_width))
        .replaceAll('VIEWPORT_HEIGHT_PLACEHOLDER', String(fingerprint.viewport_height))
        .replaceAll('COLOR_DEPTH_PLACEHOLDER', String(fingerprint.color_depth))
        .replaceAll('PIXEL_RATIO_PLACEHOLDER', String(fingerprint.pixel_ratio))
        .replaceAll("'LANGUAGE_PLACEHOLDER'", JSON.stringify(fingerprint.language))
        .replaceAll("'LANGUAGES_PLACEHOLDER'", JSON.stringify(fingerprint.languages));
}

function getWebRTCScript(mode: string): string {
    return readScript('webrtc.js')
        .replaceAll("'WEBRTC_MODE_PLACEHOLDER'", JSON.stringify(mode));
}

function getAudioScript(seed: string): string {
    return readScript('audio.js')
        .replaceAll("'AUDIO_SEED_PLACEHOLDER'", JSON.stringify(seed));
}

function getIntlScript(fingerprint: Fingerprint): string {
    return readScript('intl.js')
        .replaceAll("'TIMEZONE_PLACEHOLDER'", JSON.stringify(fingerprint.timezone))
        .replaceAll("'LOCALE_PLACEHOLDER'", JSON.stringify(fingerprint.language));
}

function getFontsScript(fingerprint: Fingerprint): string {
    let osKey: 'windows' | 'macos' | 'linux' = 'windows';
    if (fingerprint.platform === 'MacIntel') osKey = 'macos';
    else if (fingerprint.platform.includes('Linux')) osKey = 'linux';

    const fonts = (fontsData as any)[osKey] || fontsData.windows;
    return readScript('fonts.js')
        .replaceAll('FONTS_LIST_PLACEHOLDER', JSON.stringify(fonts));
}

function getProtectionScript(): string {
    return readScript('protection.js');
}

function getGeolocationScript(fingerprint: Fingerprint): string {
    return readScript('geolocation.js')
        .replaceAll("'TIMEZONE_PLACEHOLDER'", JSON.stringify(fingerprint.timezone));
}

function getSensorsScript(fingerprint: Fingerprint): string {
    return readScript('sensors.js')
        .replaceAll("'PLATFORM_PLACEHOLDER'", JSON.stringify(fingerprint.platform))
        .replaceAll("'LANGUAGE_PLACEHOLDER'", JSON.stringify(fingerprint.language))
        .replaceAll('SCREEN_W_PLACEHOLDER', String(fingerprint.screen_width))
        .replaceAll('SCREEN_H_PLACEHOLDER', String(fingerprint.screen_height))
        .replaceAll('PIXEL_RATIO_PLACEHOLDER', String(fingerprint.pixel_ratio))
        .replaceAll('COLOR_DEPTH_PLACEHOLDER', String(fingerprint.color_depth));
}

function getAdvancedScript(fingerprint: Fingerprint): string {
    return readScript('advanced.js')
        .replaceAll('SCREEN_W_PLACEHOLDER', String(fingerprint.screen_width))
        .replaceAll('SCREEN_H_PLACEHOLDER', String(fingerprint.screen_height));
}

function getWorkerBridgeScript(fingerprint: Fingerprint): string {
    return readScript('worker-bridge.js')
        .replaceAll("'CANVAS_SEED_PLACEHOLDER'", JSON.stringify(fingerprint.canvas_noise_seed))
        .replaceAll("'USER_AGENT_PLACEHOLDER'", JSON.stringify(fingerprint.user_agent))
        .replaceAll('HW_CONCURRENCY_PLACEHOLDER', String(fingerprint.hardware_concurrency));
}

function getExtrasScript(): string {
    return readScript('extras.js');
}

// ============================================================
// Proxy configuration
// ============================================================

function buildProxyConfig(proxy: Proxy | null): { server: string; username?: string; password?: string } | undefined {
    if (!proxy) return undefined;

    // Playwright accepts http, https, socks4, socks5 — map type directly
    return {
        server: `${proxy.type}://${proxy.host}:${proxy.port}`,
        username: proxy.username || undefined,
        password: proxy.password || undefined,
    };
}

// ============================================================
// Test proxy connectivity — used by IPC handler
// ============================================================

export async function testProxy(proxy: Proxy): Promise<{ ok: boolean; ip?: string; latency?: number; error?: string }> {
    const start = Date.now();
    try {
        const proxyServer = `${proxy.type}://${proxy.host}:${proxy.port}`;
        let launchOpts: any = {
            headless: true,
            proxy: {
                server: proxyServer,
                username: proxy.username || undefined,
                password: proxy.password || undefined,
            },
            timeout: 15000,
        };

        // Use system Chrome directly — avoids Windows Defender blocking Playwright Chromium
        const sysChrome = findSystemChrome();
        if (sysChrome) {
            launchOpts.executablePath = sysChrome;
        } else {
            launchOpts.channel = 'chrome';
        }

        const context = await chromium.launchPersistentContext('', launchOpts);
        try {
            const page = await context.newPage();
            const res = await page.goto('https://api.ipify.org?format=json', { timeout: 10000 });
            const text = await res?.text();
            const ip = text ? JSON.parse(text).ip : undefined;
            return { ok: true, ip, latency: Date.now() - start };
        } finally {
            await context.close().catch(() => null);
        }
    } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
}

// ============================================================
// Shared helpers for profile launch and warmup
// ============================================================

function clearLocks(dataDirPath: string): void {
    const lockFiles = ['SingletonLock', 'SingletonSocket', 'SingletonCookie', 'lockfile'];
    for (const lockFile of lockFiles) {
        try {
            const lockPath = path.join(dataDirPath, lockFile);
            if (fs.existsSync(lockPath)) fs.unlinkSync(lockPath);
        } catch { /* ignore stale lock removal errors */ }
    }
}

/**
 * Find the system-installed Google Chrome executable.
 * Playwright's channel:'chrome' in recent versions resolves to Chrome for Testing
 * from its own cache, which gets blocked by Windows Defender.
 * We need to explicitly locate the real system Chrome.
 */
function findSystemChrome(): string | undefined {
    if (process.platform === 'win32') {
        const candidates = [
            path.join(process.env['PROGRAMFILES'] || 'C:\\Program Files', 'Google', 'Chrome', 'Application', 'chrome.exe'),
            path.join(process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)', 'Google', 'Chrome', 'Application', 'chrome.exe'),
            path.join(process.env['LOCALAPPDATA'] || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
        ];
        for (const candidate of candidates) {
            if (fs.existsSync(candidate)) return candidate;
        }
    } else if (process.platform === 'darwin') {
        const macPath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
        if (fs.existsSync(macPath)) return macPath;
    } else {
        // Linux
        for (const name of ['google-chrome', 'google-chrome-stable', 'chromium-browser', 'chromium']) {
            try {
                const result = require('child_process').execSync(`which ${name}`, { encoding: 'utf-8' }).trim();
                if (result) return result;
            } catch { /* not found */ }
        }
    }
    return undefined;
}

/**
 * Build launch options adapted for the target browser type.
 * Chromium and Firefox require different arguments.
 */
function buildLaunchOptions(profile: any, cdpPort: number, extensionsEnabled: boolean = true, browserType: BrowserType = 'chromium') {
    const { fingerprint, proxy } = profile;

    const baseOptions: any = {
        headless: false,
        viewport: null,
        screen: {
            width: fingerprint.screen_width,
            height: fingerprint.screen_height,
        },
        userAgent: fingerprint.user_agent,
        locale: fingerprint.language,
        timezoneId: fingerprint.timezone,
        proxy: buildProxyConfig(proxy),
    };

    if (browserType === 'chromium') {
        // Chromium-specific configuration
        // Use the system-installed Chrome directly to avoid Windows Defender blocking
        const systemChrome = findSystemChrome();
        if (systemChrome) {
            baseOptions.executablePath = systemChrome;
        } else {
            // Fallback: let Playwright try its own resolution
            baseOptions.channel = 'chrome';
        }

        const extPaths = extensionsEnabled ? getExtensionPaths() : [];
        const args = [
            `--remote-debugging-port=${cdpPort}`,
            `--lang=${fingerprint.language}`,
            '--no-first-run',
            '--no-default-browser-check',
            '--start-maximized',
            '--force-webrtc-ip-handling-policy=disable_non_proxied_udp',
            '--enforce-webrtc-ip-permission-check',
            '--dns-over-https-mode=secure',
        ];

        if (extPaths.length > 0) {
            args.push(`--load-extension=${extPaths.join(',')}`);
        }

        baseOptions.args = args;
        baseOptions.ignoreDefaultArgs = [
            '--enable-automation',
            '--enable-blink-features=IdleDetection',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--metrics-recording-only',
            '--no-service-autorun',
            '--export-tagged-pdf',
            '--disable-search-engine-choice-screen',
            '--password-store=basic',
            '--use-mock-keychain',
            '--disable-default-apps',
            '--disable-component-extensions-with-background-pages',
            '--disable-client-side-phishing-detection',
            '--disable-popup-blocking',
            '--disable-breakpad',
            '--allow-pre-commit-input',
        ];
    } else {
        // Firefox-specific configuration
        const firefoxExec = getBrowserExecutablePath('firefox');
        baseOptions.executablePath = firefoxExec || undefined;

        baseOptions.args = [
            '-width', String(fingerprint.screen_width),
            '-height', String(fingerprint.screen_height),
        ];

        // Firefox preferences for anti-fingerprint detection
        baseOptions.firefoxUserPrefs = {
            'media.peerconnection.enabled': fingerprint.webrtc_mode !== 'disabled',
            'media.navigator.enabled': false,
            'privacy.resistFingerprinting': false, // We handle our own fingerprint
            'dom.webdriver.enabled': false,
            'useAutomationExtension': false,
            'toolkit.telemetry.enabled': false,
            'datareporting.healthreport.uploadEnabled': false,
            'browser.newtabpage.activity-stream.feeds.telemetry': false,
            'browser.ping-centre.telemetry': false,
            'intl.accept_languages': fingerprint.languages.replace(/,/g, ', '),
        };
    }

    return baseOptions;
}

/**
 * Get the Playwright browser engine for the specified type.
 */
function getBrowserEngine(browserType: BrowserType) {
    return browserType === 'firefox' ? firefox : chromium;
}

export async function launchProfile(profileId: string): Promise<BrowserContext> {
    if (activeContexts.has(profileId)) {
        return activeContexts.get(profileId)!;
    }

    const profile = getProfileById(profileId);
    if (!profile) {
        throw new Error(`Profile not found: ${profileId}`);
    }

    const { fingerprint, proxy, data_dir_path } = profile;
    const browserType: BrowserType = (profile as any).browser_type || 'chromium';

    if (!fs.existsSync(data_dir_path)) {
        fs.mkdirSync(data_dir_path, { recursive: true });
    }

    clearLocks(data_dir_path);

    const cdpPort = await findFreePort();
    const launchOptions = buildLaunchOptions(profile, cdpPort, true, browserType);

    // Write debug info to a file
    try {
        const logPath = path.join(process.cwd(), 'debug-launch.log');
        const logContent = `\n--- [${new Date().toISOString()}] LaunchProfile Debug ---\n` +
            `Profile ID: ${profileId}\n` +
            `Browser Type: ${browserType}\n` +
            `findSystemChrome(): ${findSystemChrome() || 'undefined'}\n` +
            `Launch Options: ${JSON.stringify(launchOptions, null, 2)}\n`;
        fs.appendFileSync(logPath, logContent, 'utf-8');
    } catch (e) {
        console.error('Failed to write debug log:', e);
    }

    let context: BrowserContext;
    try {
        // Ensure browser is available
        if (browserType === 'chromium' && !launchOptions.executablePath) {
            // buildLaunchOptions couldn't find system Chrome — try channel fallback
            console.log(`[BrowserEngine] Chrome do sistema não encontrado. Usando channel fallback...`);
            launchOptions.channel = 'chrome';
        }

        const engine = getBrowserEngine(browserType);
        console.log(`[BrowserEngine] Launching profile ${profileId} with ${browserType}...`);
        
        try {
            context = await engine.launchPersistentContext(data_dir_path, {
                ...launchOptions,
                timeout: 30000,
            });
        } catch (firstError) {
            const firstMsg = firstError instanceof Error ? firstError.message : String(firstError);
            const isBlockedByOS = firstMsg.includes('spawn UNKNOWN') ||
                firstMsg.includes('EPERM') ||
                firstMsg.includes('EACCES') ||
                firstMsg.includes('blocked');

            // If launch failed (e.g. Windows Defender blocking), try with explicit system Chrome
            if (browserType === 'chromium' && isBlockedByOS) {
                const sysChrome = findSystemChrome();
                console.warn(`[BrowserEngine] Chromium bloqueado pelo sistema. Tentando com Chrome do sistema: ${sysChrome || 'não encontrado'}...`);
                if (sysChrome) {
                    launchOptions.executablePath = sysChrome;
                } else {
                    launchOptions.executablePath = undefined;
                    launchOptions.channel = 'chrome';
                }
                delete launchOptions.channel;
                
                context = await engine.launchPersistentContext(data_dir_path, {
                    ...launchOptions,
                    timeout: 30000,
                });
            } else {
                throw firstError;
            }
        }
    } catch (error) {
        setProfileActive(profileId, false);
        const msg = error instanceof Error ? error.message : String(error);
        const isBrowserMissing = msg.toLowerCase().includes('not found') ||
            msg.toLowerCase().includes('executable') ||
            msg.toLowerCase().includes('cannot find');
        const isBlockedByOS = msg.includes('spawn UNKNOWN') ||
            msg.includes('EPERM') ||
            msg.includes('EACCES');
        
        let userMessage: string;
        if (isBlockedByOS) {
            userMessage = `O navegador foi bloqueado pelo Windows Defender. Instale o Google Chrome no sistema ou adicione uma exclusão no Windows Defender para: ${getBrowserExecutablePath(browserType) || 'ms-playwright'}`;
        } else if (isBrowserMissing) {
            userMessage = `Navegador não encontrado. Instale o Google Chrome e tente novamente.`;
        } else {
            userMessage = `Falha ao iniciar o navegador: ${msg}`;
        }
        throw new Error(userMessage);
    }

    await injectFingerprintScripts(context, fingerprint, profile.name, proxy ? `${proxy.host}:${proxy.port}` : '', browserType);

    logAction('browser_launched', { cdpPort, headless: false, browserType }, profileId);

    activeContexts.set(profileId, context);
    activePorts.set(profileId, cdpPort);
    setProfileActive(profileId, true);
    updateLastUsed(profileId);

    console.log(`[BrowserEngine] Profile ${profileId} (${browserType}) CDP: http://127.0.0.1:${cdpPort}`);

    context.on('close', () => {
        activeContexts.delete(profileId);
        activePorts.delete(profileId);
        setProfileActive(profileId, false);

        const features = extractProfileFeatures(profileId);
        logAction('browser_closed', { features }, profileId);

        BrowserWindow.getAllWindows().forEach(win => {
            win.webContents.send('profile:closed', profileId);
        });
    });

    const pages = context.pages();
    if (pages.length === 0) {
        const page = await context.newPage();
        await page.goto('about:blank');
    }

    return context;
}

// ============================================================
// Profile warmup — visits real sites to build cookies/history
// ============================================================

export interface WarmupProgress {
    current: number;
    total: number;
    url: string;
}

export interface WarmupResult {
    ok: boolean;
    sitesVisited: number;
    error?: string;
}

// Sites ordered to maximise Google trust-score impact.
// First pass builds 3rd-party cookie relationships (GA, DoubleClick).
// Last two Google visits cement the session.
const WARMUP_SITES: Array<{ url: string; waitMs: number }> = [
    { url: 'https://www.uol.com.br', waitMs: 1800 },
    { url: 'https://www.wikipedia.org', waitMs: 1500 },
    { url: 'https://g1.globo.com', waitMs: 1800 },
    { url: 'https://www.google.com', waitMs: 2000 },
    { url: 'https://www.mercadolivre.com.br', waitMs: 1800 },
    { url: 'https://www.reddit.com', waitMs: 1500 },
    { url: 'https://www.terra.com.br', waitMs: 1200 },
    { url: 'https://www.amazon.com.br', waitMs: 1800 },
    { url: 'https://www.bbc.com', waitMs: 1500 },
    { url: 'https://www.globo.com', waitMs: 1800 },
    { url: 'https://www.youtube.com', waitMs: 2000 },
    { url: 'https://www.shopee.com.br', waitMs: 1500 },
    { url: 'https://www.r7.com', waitMs: 1200 },
    { url: 'https://www.folha.uol.com.br', waitMs: 1500 },
    { url: 'https://stackoverflow.com', waitMs: 1500 },
    { url: 'https://www.linkedin.com', waitMs: 1500 },
    { url: 'https://translate.google.com', waitMs: 1500 },
    { url: 'https://www.magazineluiza.com.br', waitMs: 1500 },
    { url: 'https://www.estadao.com.br', waitMs: 1200 },
    { url: 'https://www.olx.com.br', waitMs: 1200 },
    { url: 'https://maps.google.com', waitMs: 1800 },
    { url: 'https://www.nubank.com.br', waitMs: 1200 },
    { url: 'https://www.ifood.com.br', waitMs: 1200 },
    { url: 'https://www.americanas.com.br', waitMs: 1200 },
    { url: 'https://github.com', waitMs: 1200 },
    { url: 'https://www.reclameaqui.com.br', waitMs: 1200 },
    { url: 'https://www.booking.com', waitMs: 1500 },
    { url: 'https://www.spotify.com', waitMs: 1500 },
    { url: 'https://www.netflix.com', waitMs: 1200 },
    { url: 'https://www.imdb.com', waitMs: 1200 },
    { url: 'https://medium.com', waitMs: 1200 },
    { url: 'https://www.canva.com', waitMs: 1200 },
    { url: 'https://www.bing.com', waitMs: 1500 },
    { url: 'https://www.cnn.com', waitMs: 1500 },
    { url: 'https://www.microsoft.com', waitMs: 1200 },
    { url: 'https://www.enjoei.com.br', waitMs: 1000 },
    { url: 'https://www.airbnb.com.br', waitMs: 1200 },
    { url: 'https://www.weather.com', waitMs: 1000 },
    // Return to Google last — cements all collected 3rd-party signals
    { url: 'https://www.google.com.br', waitMs: 2000 },
    { url: 'https://www.youtube.com', waitMs: 1800 },
];

function buildVisualIdentifierScript(profileName: string, proxyIp: string): string {
    return `
        (function() {
            const profileName = ${JSON.stringify(profileName)};
            const proxyIp = ${JSON.stringify(proxyIp)};

            function updateTitle() {
                const prefix = "[" + profileName + "] ";
                if (document.title && !document.title.startsWith(prefix)) {
                    document.title = prefix + document.title;
                }
            }
            
            // Observe title modifications (needed for SPAs like YouTube, React, etc.)
            const titleObserver = new MutationObserver(updateTitle);
            titleObserver.observe(document.querySelector('title') || document.documentElement, {
                subtree: true, childList: true, characterData: true
            });
            updateTitle();

            // Inject badge on dom ready
            function injectBadge() {
                if (document.getElementById('axe-profile-badge')) return;
                
                const badge = document.createElement('div');
                badge.id = 'axe-profile-badge';
                badge.innerHTML = '<span class="status-dot"></span><span style="white-space: nowrap;">👤 ' + profileName + '</span>' + 
                    (proxyIp ? '<span style="opacity: 0.3; margin: 0 4px;">|</span><span style="opacity: 0.8; font-weight: 500;">🌐 ' + proxyIp + '</span>' : '');
                
                Object.assign(badge.style, {
                    position: 'fixed',
                    bottom: '12px',
                    right: '12px',
                    zIndex: '2147483647',
                    background: 'rgba(15, 23, 42, 0.85)',
                    backdropFilter: 'blur(8px)',
                    webkitBackdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#e2e8f0',
                    padding: '6px 12px',
                    borderRadius: '9999px',
                    fontSize: '11px',
                    fontWeight: '600',
                    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    transition: 'opacity 0.2s ease, transform 0.2s ease',
                    cursor: 'default',
                    userSelect: 'none',
                    pointerEvents: 'auto'
                });

                const style = document.createElement('style');
                style.innerHTML = '#axe-profile-badge:hover { opacity: 0.12 !important; transform: scale(0.95); } #axe-profile-badge .status-dot { width: 6px; height: 6px; background-color: #10b981; border-radius: 50%; box-shadow: 0 0 8px #10b981; animation: axe-pulse 2s infinite; } @keyframes axe-pulse { 0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); } 70% { box-shadow: 0 0 0 5px rgba(16, 185, 129, 0); } 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); } }';
                document.head.appendChild(style);
                document.documentElement.appendChild(badge);
            }

            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', injectBadge);
            } else {
                injectBadge();
            }
        })();
    `;
}

async function injectFingerprintScripts(context: BrowserContext, fingerprint: Fingerprint, profileName: string, proxyIp: string, browserType: BrowserType = 'chromium'): Promise<void> {
    await context.setExtraHTTPHeaders(buildConsistentHeaders(fingerprint, browserType));
    await context.addInitScript(getCleanupScript());
    await context.addInitScript(getNavigatorScript(fingerprint));
    await context.addInitScript(getCanvasScript(fingerprint.canvas_noise_seed));
    await context.addInitScript(getWebGLScript(fingerprint));
    await context.addInitScript(getWebRTCScript(fingerprint.webrtc_mode));
    await context.addInitScript(getAudioScript(fingerprint.audio_noise_seed));
    await context.addInitScript(getFontsScript(fingerprint));
    await context.addInitScript(getIntlScript(fingerprint));
    await context.addInitScript(getProtectionScript());
    await context.addInitScript(getGeolocationScript(fingerprint));
    await context.addInitScript(getSensorsScript(fingerprint));
    await context.addInitScript(getAdvancedScript(fingerprint));
    await context.addInitScript(getWorkerBridgeScript(fingerprint));
    await context.addInitScript(getExtrasScript());
    
    // Injeta script de identificação visual (título e badge flutuante)
    await context.addInitScript({ content: buildVisualIdentifierScript(profileName, proxyIp) });
}

export async function warmupProfile(
    profileId: string,
    onProgress: (progress: WarmupProgress) => void
): Promise<WarmupResult> {
    if (activeContexts.has(profileId)) {
        return { ok: false, sitesVisited: 0, error: 'Profile already running' };
    }

    // Cancel existing warmup if any
    const existingController = activeWarmups.get(profileId);
    if (existingController) {
        existingController.abort();
    }

    const controller = new AbortController();
    activeWarmups.set(profileId, controller);

    const profile = getProfileById(profileId);
    if (!profile) {
        activeWarmups.delete(profileId);
        return { ok: false, sitesVisited: 0, error: 'Profile not found' };
    }

    const { fingerprint, proxy, data_dir_path } = profile;
    const browserType: BrowserType = (profile as any).browser_type || 'chromium';

    if (!fs.existsSync(data_dir_path)) {
        fs.mkdirSync(data_dir_path, { recursive: true });
    }

    // Clear stale locks
    clearLocks(data_dir_path);

    const cdpPort = await findFreePort();
    const total = WARMUP_SITES.length;
    let sitesVisited = 0;
    let context: BrowserContext | null = null;

    try {
        logAction('warmup_started', { total_sites: total, browserType }, profileId);

        const launchOptions = buildLaunchOptions(profile, cdpPort, false, browserType);

        // For Chromium: prefer system Chrome to avoid Windows Defender blocks
        if (browserType === 'chromium') {
            launchOptions.executablePath = undefined;
            launchOptions.channel = 'chrome';
        } else if (browserType === 'firefox' && !isBrowserInstalled('firefox')) {
            console.log(`[BrowserEngine] Firefox não encontrado para warmup. Instale via npx playwright install firefox`);
            return { ok: false, sitesVisited: 0, error: 'Firefox não instalado. Execute: npx playwright install firefox' };
        }

        const engine = getBrowserEngine(browserType);
        context = await engine.launchPersistentContext(data_dir_path, {
            ...launchOptions,
            timeout: 30000,
        });

        await injectFingerprintScripts(context, fingerprint, profile.name, proxy ? `${proxy.host}:${proxy.port}` : '', browserType);

        const pages = context.pages();
        const page = pages.length > 0 ? pages[0] : await context.newPage();

        // Minimize the warmup window via CDP so it doesn't distract the user
        // Note: CDP sessions are Chromium-only; Firefox doesn't support this
        if (browserType === 'chromium') {
            try {
                const cdp = await context.newCDPSession(page);
                const { windowId } = await cdp.send('Browser.getWindowForTarget');
                await cdp.send('Browser.setWindowBounds', { windowId, bounds: { windowState: 'minimized' } });
                await cdp.detach();
            } catch { /* window stays visible if CDP minimize fails */ }
        }

        for (let i = 0; i < WARMUP_SITES.length; i++) {
            if (controller.signal.aborted) {
                throw new Error('Warmup cancelled');
            }
            const site = WARMUP_SITES[i];
            onProgress({ current: i + 1, total, url: site.url });

            try {
                if (controller.signal.aborted) throw new Error('Warmup cancelled');
                await page.goto(site.url, { waitUntil: 'domcontentloaded', timeout: 7000 });
                
                // Simulate reading — scroll a random amount
                const dist = Math.floor(Math.random() * 500) + 150;
                await page.evaluate(`window.scrollBy(0, ${dist})`).catch(() => {});
                
                // Randomise wait ± 300ms to look less robotic, with abort support
                const waitTime = site.waitMs + Math.floor(Math.random() * 300);
                await new Promise<void>((resolve, reject) => {
                    const timeout = setTimeout(() => {
                        controller.signal.removeEventListener('abort', onAbort);
                        resolve();
                    }, waitTime);
                    
                    const onAbort = () => {
                        clearTimeout(timeout);
                        reject(new Error('Warmup cancelled'));
                    };
                    
                    controller.signal.addEventListener('abort', onAbort);
                });
                
                sitesVisited++;
            } catch (err: any) {
                if (err.message === 'Warmup cancelled' || controller.signal.aborted) {
                    throw new Error('Warmup cancelled');
                }
                // Timeout or network error — skip this site, keep going
            }
        }

        const features = extractProfileFeatures(profileId);
        logAction('warmup_completed', { sitesVisited, features }, profileId);

        return { ok: true, sitesVisited };
    } catch (err) {
        logAction('warmup_failed', { error: String(err) }, profileId);
        return { ok: false, sitesVisited, error: String(err) };
    } finally {
        activeWarmups.delete(profileId);
        if (context) await context.close().catch(() => null);
    }
}

export function stopWarmupProfile(profileId: string): boolean {
    const controller = activeWarmups.get(profileId);
    if (controller) {
        controller.abort();
        activeWarmups.delete(profileId);
        return true;
    }
    return false;
}

// ============================================================
// Profile management helpers
// ============================================================

export async function closeProfile(profileId: string): Promise<boolean> {
    const context = activeContexts.get(profileId);
    if (!context) return false;

    // The 'close' event handler cleans up activeContexts and DB state
    await context.close();
    return true;
}

export function getActiveContexts(): Map<string, BrowserContext> {
    return activeContexts;
}

export function isProfileActive(profileId: string): boolean {
    return activeContexts.has(profileId);
}

export async function openNewTab(profileId: string, url?: string): Promise<Page | null> {
    const context = activeContexts.get(profileId);
    if (!context) return null;

    const page = await context.newPage();
    if (url) await page.goto(url);
    return page;
}

export function getProfilePages(profileId: string): Page[] {
    return activeContexts.get(profileId)?.pages() ?? [];
}

export async function closeAllProfiles(): Promise<void> {
    await Promise.all(Array.from(activeContexts.keys()).map(id => closeProfile(id)));
}
