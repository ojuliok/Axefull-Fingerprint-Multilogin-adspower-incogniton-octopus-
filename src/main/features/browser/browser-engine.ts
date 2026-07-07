import { chromium, firefox, BrowserContext, Page } from 'playwright';
import { downloadBrowser } from './downloader';
import { isBrowserInstalled } from '../../diagnostics/health';
import { launchNativeBrowser } from '../../browser-launcher/launcher';
import { logSecurityEvent } from '../../database/db';
import { startProxyTunnel, stopProxyTunnel } from '../proxy/tunnel-manager';
import path from 'path';
import fs from 'fs';
import net from 'net';
import { EventEmitter } from 'events';
import { ChildProcess } from 'child_process';
import { BrowserWindow, app, shell } from 'electron';
import { Fingerprint, Proxy, ProfileWithDetails, BrowserType } from '../profile/types';
import { getProfileById, setProfileActive, updateLastUsed } from '../profile/profile-manager';
import { getExtensionPaths } from '../../services/extensions-manager';
import fontsData from '../fingerprint/presets/fonts.json';
import { logAction } from '../ai/audit-logger';
import { extractProfileFeatures } from '../ai/feature-extractor';

export class NativeBrowserContext extends EventEmitter {
    constructor(
        public profileId: string,
        public process: ChildProcess,
        public browserType: string
    ) {
        super();
        this.process.on('close', (code) => {
            this.emit('close');
        });
    }

    async close(): Promise<void> {
        return new Promise((resolve) => {
            if (this.process.killed) {
                resolve();
                return;
            }
            this.process.once('close', () => resolve());
            this.process.kill();
        });
    }
}

// Store active browser contexts
const activeContexts: Map<string, NativeBrowserContext> = new Map();

// Store CDP debug ports per profile
const activePorts: Map<string, number> = new Map();

// Store active warmup AbortControllers
const activeWarmups: Map<string, AbortController> = new Map();

// Store pending browser launch promises to prevent concurrent duplicate launches
const pendingLaunches: Map<string, Promise<NativeBrowserContext>> = new Map();

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

function prepareChromeProfileConfig(dataDirPath: string, profileName: string): void {
    try {
        if (!fs.existsSync(dataDirPath)) {
            fs.mkdirSync(dataDirPath, { recursive: true });
        }

        // 1. Configure Local State (Profile Name)
        const localStatePath = path.join(dataDirPath, 'Local State');
        let localState: any = {};
        if (fs.existsSync(localStatePath)) {
            try {
                localState = JSON.parse(fs.readFileSync(localStatePath, 'utf-8'));
            } catch {
                localState = {};
            }
        }

        if (!localState.profile) {
            localState.profile = {};
        }
        if (!localState.profile.info_cache) {
            localState.profile.info_cache = {};
        }
        if (!localState.profile.info_cache.Default) {
            localState.profile.info_cache.Default = {};
        }

        localState.profile.info_cache.Default.name = profileName;
        localState.profile.info_cache.Default.shortcut_name = profileName;
        localState.profile.info_cache.Default.is_using_default_name = false;
        localState.profile.last_active_profiles = ['Default'];

        fs.writeFileSync(localStatePath, JSON.stringify(localState, null, 2), 'utf-8');

        // 2. Configure Default/Preferences (Bookmarks Bar always visible)
        const defaultDir = path.join(dataDirPath, 'Default');
        if (!fs.existsSync(defaultDir)) {
            fs.mkdirSync(defaultDir, { recursive: true });
        }

        const preferencesPath = path.join(defaultDir, 'Preferences');
        let preferences: any = {};
        if (fs.existsSync(preferencesPath)) {
            try {
                preferences = JSON.parse(fs.readFileSync(preferencesPath, 'utf-8'));
            } catch {
                preferences = {};
            }
        }

        if (!preferences.bookmark_bar) {
            preferences.bookmark_bar = {};
        }
        preferences.bookmark_bar.show_on_all_tabs = true;

        // We inject the fixed bookmark here!
        injectFixedBookmark(dataDirPath);
    } catch (err) {
        console.error('[BrowserEngine] Failed to prepare Chrome profile configurations:', err);
    }
}

function injectFixedBookmark(dataDirPath: string): void {
    try {
        const configPath = path.join(app.getPath('userData'), 'config.json');
        if (!fs.existsSync(configPath)) return;
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        const { fixedBookmarkName, fixedBookmarkUrl } = config;
        if (!fixedBookmarkUrl) return; // No URL set

        const defaultDir = path.join(dataDirPath, 'Default');
        if (!fs.existsSync(defaultDir)) {
            fs.mkdirSync(defaultDir, { recursive: true });
        }
        const bookmarksPath = path.join(defaultDir, 'Bookmarks');

        let raw: any = {};
        if (fs.existsSync(bookmarksPath)) {
            try { raw = JSON.parse(fs.readFileSync(bookmarksPath, 'utf-8')); } catch { }
        }

        if (!raw.roots) {
            raw.roots = { 
                bookmark_bar: { children: [], id: '1', name: 'Bookmarks bar', type: 'folder' }, 
                other: { children: [], id: '2', name: 'Other bookmarks', type: 'folder' } 
            };
        }
        if (!raw.roots.bookmark_bar.children) raw.roots.bookmark_bar.children = [];

        // Check if a bookmark with the same URL already exists
        const children = raw.roots.bookmark_bar.children;
        const idx = children.findIndex((item: any) => item.type === 'url' && item.url === fixedBookmarkUrl);

        if (idx !== -1) {
            // Update name in case it changed
            children[idx].name = fixedBookmarkName || 'Favorito Fixo';
        } else {
            // Check if there is a bookmark with the configured name in case the URL changed
            const nameToFind = fixedBookmarkName || 'Favorito Fixo';
            const nameIdx = children.findIndex((item: any) => item.type === 'url' && item.name === nameToFind);
            if (nameIdx !== -1) {
                // Update URL in case URL changed but name remained
                children[nameIdx].url = fixedBookmarkUrl;
            } else {
                // Add new bookmark
                const newId = String(Date.now());
                const nowMicros = String(BigInt(Date.now()) * BigInt(1000) + BigInt('11644473600000000'));
                children.push({
                    date_added: nowMicros,
                    id: newId,
                    name: fixedBookmarkName || 'Favorito Fixo',
                    type: 'url',
                    url: fixedBookmarkUrl
                });
            }
        }

        raw.version = 1;
        raw.checksum = '';

        fs.writeFileSync(bookmarksPath, JSON.stringify(raw, null, 2), 'utf-8');
    } catch (err) {
        console.error('[BrowserEngine] Failed to inject fixed bookmark:', err);
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
            '--disable-blink-features=AutomationControlled',
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

export async function launchProfile(profileId: string): Promise<NativeBrowserContext> {
    if (activeContexts.has(profileId)) {
        return activeContexts.get(profileId)!;
    }
    if (pendingLaunches.has(profileId)) {
        return pendingLaunches.get(profileId)!;
    }

    const launchPromise = (async () => {
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
        prepareChromeProfileConfig(data_dir_path, profile.name);

        console.log(`[BrowserEngine] Launching profile ${profileId} (${profile.name}) with native browser: ${browserType}...`);

        let childProcess: ChildProcess;
        try {
            // Map standard browserType values
            const browserName = browserType === 'chromium' ? 'chrome' : browserType;
            
            let localProxyConfig: any = undefined;
            if (proxy) {
                const bypassList = profile.bypass_list ? profile.bypass_list.split(',').map((s: string) => s.trim()) : [];
                // Start local proxy loopback server
                const localPort = await startProxyTunnel(
                    profileId,
                    proxy.host,
                    proxy.port,
                    proxy.username || undefined,
                    proxy.password || undefined,
                    bypassList
                );
                localProxyConfig = {
                    host: '127.0.0.1',
                    port: localPort
                };
            }

            childProcess = launchNativeBrowser(browserName, data_dir_path, localProxyConfig);
        } catch (error) {
            setProfileActive(profileId, false);
            await stopProxyTunnel(profileId);
            throw new Error(`Failed to launch browser: ${(error as Error).message}`);
        }

        const context = new NativeBrowserContext(profileId, childProcess, browserType);

        activeContexts.set(profileId, context);
        setProfileActive(profileId, true);
        updateLastUsed(profileId);

        logAction('browser_launched', { headless: false, browserType }, profileId);
        logSecurityEvent('BROWSER_LAUNCHED', `Launched native browser ${browserType} for profile ${profile.name}`, 'INFO', profileId);

        context.on('close', async () => {
            activeContexts.delete(profileId);
            setProfileActive(profileId, false);
            
            // Shut down local proxy tunnel
            await stopProxyTunnel(profileId);

            const features = extractProfileFeatures(profileId);
            logAction('browser_closed', { features }, profileId);
            logSecurityEvent('BROWSER_CLOSED', `Browser closed for profile ${profile.name}`, 'INFO', profileId);

            BrowserWindow.getAllWindows().forEach(win => {
                win.webContents.send('profile:closed', profileId);
            });
        });

        return context;
    })();

    pendingLaunches.set(profileId, launchPromise);

    try {
        return await launchPromise;
    } finally {
        pendingLaunches.delete(profileId);
    }
}

// ============================================================
// Profile warmup — stubbed out for native execution
// ============================================================

export interface WarmupProgress {
    current: number;
    total: number;
    url: string;
}

export async function warmupProfile(
    profileId: string,
    onProgress: (progress: WarmupProgress) => void
): Promise<{ ok: boolean; sitesVisited: number; error?: string }> {
    console.log(`[BrowserEngine] Warmup requested for profile: ${profileId} (No-op in Native mode)`);
    return { ok: true, sitesVisited: 0 };
}

export function stopWarmupProfile(profileId: string): boolean {
    return false;
}

// ============================================================
// Profile management helpers
// ============================================================

export async function closeProfile(profileId: string): Promise<boolean> {
    const context = activeContexts.get(profileId);
    if (!context) return false;

    await context.close();
    return true;
}

export function getActiveContexts(): Map<string, NativeBrowserContext> {
    return activeContexts;
}

export function isProfileActive(profileId: string): boolean {
    return activeContexts.has(profileId);
}

export async function openNewTab(profileId: string, url?: string): Promise<any | null> {
    if (url) {
        shell.openExternal(url);
    }
    return null;
}

export function getProfilePages(profileId: string): any[] {
    return [];
}

export async function closeAllProfiles(): Promise<void> {
    await Promise.all(Array.from(activeContexts.keys()).map(id => closeProfile(id)));
}
