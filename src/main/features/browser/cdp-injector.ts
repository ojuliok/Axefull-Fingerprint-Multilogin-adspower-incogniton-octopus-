/**
 * CDP Fingerprint Injector
 * 
 * Connects to a natively-launched Chrome browser via Chrome DevTools Protocol
 * and injects all fingerprint spoofing scripts using Page.addScriptToEvaluateOnNewDocument.
 * 
 * This approach:
 * - Uses native Chrome (no Playwright-managed Chrome with automation flags)
 * - Injects scripts via CDP so they run BEFORE any page JavaScript
 * - The cleanup script (00-cleanup.js) removes any Playwright connection artifacts
 * - Handles new tabs/pages automatically via context.addInitScript
 */

import http from 'http';
import { chromium, BrowserContext, Browser } from 'playwright';
import { Fingerprint, BrowserType } from '../profile/types';
import fontsData from '../fingerprint/presets/fonts.json';
import path from 'path';
import fs from 'fs';

// ============================================================
// Script cache — loaded once, reused across all profiles
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
        const filePath = path.join(dir, f);
        if (fs.existsSync(filePath)) {
            _scriptCache.set(f, fs.readFileSync(filePath, 'utf-8'));
        } else {
            console.warn(`[CDPInjector] Script file not found: ${filePath}`);
        }
    }
    return _scriptCache;
}

function readScript(filename: string): string {
    const content = getScriptCache().get(filename);
    if (!content) {
        console.error(`[CDPInjector] Missing script: ${filename}`);
        return '';
    }
    return content;
}

// ============================================================
// Script builders — substitute fingerprint values into templates
// ============================================================

function getCleanupScript(fingerprint: Fingerprint): string {
    // Pass platform so getPlatformInfo can be dynamic
    let osVal = 'win';
    if (fingerprint.platform === 'MacIntel') osVal = 'mac';
    else if (fingerprint.platform.includes('Linux')) osVal = 'linux';

    return readScript('00-cleanup.js')
        .replaceAll("'PLATFORM_OS_PLACEHOLDER'", JSON.stringify(osVal));
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

function getCanvasScript(fingerprint: Fingerprint): string {
    return readScript('canvas.js')
        .replaceAll("'CANVAS_SEED_PLACEHOLDER'", JSON.stringify(fingerprint.canvas_noise_seed));
}

function getWebGLScript(fingerprint: Fingerprint): string {
    return readScript('webgl.js')
        .replaceAll("'WEBGL_VENDOR_PLACEHOLDER'", JSON.stringify(fingerprint.webgl_vendor))
        .replaceAll("'WEBGL_RENDERER_PLACEHOLDER'", JSON.stringify(fingerprint.renderer))
        .replaceAll("'WEBGL_SEED_PLACEHOLDER'", JSON.stringify(fingerprint.webgl_noise_seed));
}

function getWebRTCScript(fingerprint: Fingerprint): string {
    return readScript('webrtc.js')
        .replaceAll("'WEBRTC_MODE_PLACEHOLDER'", JSON.stringify(fingerprint.webrtc_mode));
}

function getAudioScript(fingerprint: Fingerprint): string {
    return readScript('audio.js')
        .replaceAll("'AUDIO_SEED_PLACEHOLDER'", JSON.stringify(fingerprint.audio_noise_seed));
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
        .replaceAll("'TIMEZONE_PLACEHOLDER'", JSON.stringify(fingerprint.timezone))
        .replaceAll("'CANVAS_SEED_PLACEHOLDER'", JSON.stringify(fingerprint.canvas_noise_seed));
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
// Header builders for fingerprint consistency
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
    const major = majorMatch ? majorMatch[1] : '137';
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
// CDP connection and injection
// ============================================================

/**
 * Wait for Chrome's CDP endpoint to become available.
 * Chrome needs a moment to start up and bind the debugging port.
 */
function waitForCDP(port: number, timeoutMs: number = 15000): Promise<void> {
    return new Promise((resolve, reject) => {
        const start = Date.now();

        function attempt() {
            if (Date.now() - start > timeoutMs) {
                reject(new Error(`[CDPInjector] CDP not available on port ${port} after ${timeoutMs}ms`));
                return;
            }

            const req = http.get(`http://127.0.0.1:${port}/json/version`, (res) => {
                let body = '';
                res.on('data', (chunk: Buffer) => { body += chunk.toString(); });
                res.on('end', () => {
                    try {
                        JSON.parse(body);
                        resolve();
                    } catch {
                        setTimeout(attempt, 250);
                    }
                });
            });

            req.on('error', () => {
                setTimeout(attempt, 250);
            });

            req.setTimeout(2000, () => {
                req.destroy();
                setTimeout(attempt, 250);
            });
        }

        attempt();
    });
}

/**
 * Build all 14 fingerprint injection scripts in the correct order.
 * Each script is a self-contained IIFE that patches specific browser APIs.
 */
function buildInjectionScripts(fingerprint: Fingerprint): string[] {
    return [
        getCleanupScript(fingerprint),     // 1. Remove automation traces FIRST
        getNavigatorScript(fingerprint),    // 2. Spoof navigator & screen
        getCanvasScript(fingerprint),       // 3. Canvas noise
        getWebGLScript(fingerprint),        // 4. WebGL vendor/renderer spoof
        getWebRTCScript(fingerprint),       // 5. WebRTC leak prevention
        getAudioScript(fingerprint),        // 6. Audio fingerprint noise
        getFontsScript(fingerprint),        // 7. Font enumeration control
        getIntlScript(fingerprint),         // 8. Timezone & locale
        getProtectionScript(),              // 9. Anti-detection hardening
        getGeolocationScript(fingerprint),  // 10. Geolocation spoof
        getSensorsScript(fingerprint),      // 11. Sensor & device API spoof
        getAdvancedScript(fingerprint),     // 12. Extended API spoof
        getWorkerBridgeScript(fingerprint), // 13. Web Worker injection
        getExtrasScript(),                  // 14. Remaining API stubs + cleanup
    ].filter(s => s.length > 0); // Skip any scripts that failed to load
}

/**
 * Stores active CDP connections so they can be cleaned up on browser close.
 */
const activeCDPBrowsers: Map<string, Browser> = new Map();

/**
 * Connect to a running Chrome instance via CDP and inject fingerprint scripts.
 * 
 * @param profileId - Profile identifier for tracking
 * @param cdpPort - Chrome's remote debugging port
 * @param fingerprint - The fingerprint data to inject
 * @param browserType - chromium or firefox
 * @returns The Playwright Browser object (for cleanup) or null on failure
 */
export async function injectFingerprint(
    profileId: string,
    cdpPort: number,
    fingerprint: Fingerprint,
    browserType: BrowserType = 'chromium'
): Promise<Browser | null> {
    try {
        console.log(`[CDPInjector] Waiting for CDP on port ${cdpPort}...`);
        await waitForCDP(cdpPort);
        console.log(`[CDPInjector] CDP available. Connecting...`);

        // Connect Playwright to the running Chrome via CDP
        const cdpBrowser = await chromium.connectOverCDP(`http://127.0.0.1:${cdpPort}`);

        // Get the default browser context (the one Chrome opens with)
        const contexts = cdpBrowser.contexts();
        if (contexts.length === 0) {
            console.error(`[CDPInjector] No browser contexts found`);
            await cdpBrowser.close().catch(() => {});
            return null;
        }

        const context = contexts[0];

        // Build all injection scripts
        const scripts = buildInjectionScripts(fingerprint);
        console.log(`[CDPInjector] Injecting ${scripts.length} fingerprint scripts...`);

        // Add scripts to context — they will run on EVERY new page/navigation
        // Order matters: cleanup must be first
        for (const script of scripts) {
            await context.addInitScript({ content: script });
        }

        // Set consistent HTTP headers (Accept-Language, Sec-CH-UA, etc.)
        const headers = buildConsistentHeaders(fingerprint, browserType);
        await context.setExtraHTTPHeaders(headers);

        // Also inject into any already-open pages (e.g., the initial new tab page)
        const pages = context.pages();
        for (const page of pages) {
            try {
                // Combine all scripts into one evaluation to minimize round trips
                const combined = scripts.join('\n;\n');
                await page.evaluate(combined).catch(() => {
                    // If evaluate fails (e.g., on chrome:// pages), that's OK
                });
            } catch {
                // Ignore errors on internal pages
            }
        }

        // Store for cleanup
        activeCDPBrowsers.set(profileId, cdpBrowser);

        console.log(`[CDPInjector] ✓ Fingerprint injected successfully for profile ${profileId}`);
        console.log(`[CDPInjector]   UA: ${fingerprint.user_agent.substring(0, 60)}...`);
        console.log(`[CDPInjector]   Platform: ${fingerprint.platform}`);
        console.log(`[CDPInjector]   Timezone: ${fingerprint.timezone}`);
        console.log(`[CDPInjector]   Resolution: ${fingerprint.screen_width}x${fingerprint.screen_height}`);
        console.log(`[CDPInjector]   WebRTC: ${fingerprint.webrtc_mode}`);

        return cdpBrowser;
    } catch (err) {
        console.error(`[CDPInjector] Failed to inject fingerprint for profile ${profileId}:`, err);
        return null;
    }
}

/**
 * Disconnect the CDP connection for a profile.
 * Called when the browser is closed.
 */
export async function disconnectCDP(profileId: string): Promise<void> {
    const browser = activeCDPBrowsers.get(profileId);
    if (browser) {
        try {
            await browser.close();
        } catch {
            // Browser might already be closed
        }
        activeCDPBrowsers.delete(profileId);
        console.log(`[CDPInjector] CDP disconnected for profile ${profileId}`);
    }
}

/**
 * Check if a CDP connection is active for a profile.
 */
export function isCDPConnected(profileId: string): boolean {
    return activeCDPBrowsers.has(profileId);
}

/**
 * Build the Chrome launch flags needed for CDP and anti-detection.
 */
export function buildChromeAntiDetectFlags(
    fingerprint: Fingerprint,
    cdpPort: number,
    extensionPaths: string[] = []
): string[] {
    const args = [
        `--remote-debugging-port=${cdpPort}`,
        `--lang=${fingerprint.language}`,
        '--no-first-run',
        '--no-default-browser-check',
        '--start-maximized',
        // Anti-automation detection — Chrome 129+ removed the blink-features flag.
        // The correct modern approach is --disable-features=AutomationControlled
        // plus removing navigator.webdriver via our inject scripts (00-cleanup.js).
        '--disable-features=AutomationControlled',
        // Suppress the "Chrome is being controlled by automated software" infobar
        '--disable-infobars',
        // WebRTC leak prevention at Chrome level
        '--force-webrtc-ip-handling-policy=disable_non_proxied_udp',
        '--enforce-webrtc-ip-permission-check',
        // DNS security
        '--dns-over-https-mode=secure',
        // Disable throttling features that could fingerprint as automation
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        // Prevent Chrome from showing "unsupported command line flags" errors
        '--no-sandbox-and-elevated',
    ];

    // Load extensions if any
    if (extensionPaths.length > 0) {
        args.push(`--load-extension=${extensionPaths.join(',')}`);
        args.push(`--disable-extensions-except=${extensionPaths.join(',')}`);
    }

    return args;
}

export {
    getCleanupScript,
    getNavigatorScript,
    getCanvasScript,
    getWebGLScript,
    getWebRTCScript,
    getAudioScript,
    getIntlScript,
    getFontsScript,
    getProtectionScript,
    getGeolocationScript,
    getSensorsScript,
    getAdvancedScript,
    getWorkerBridgeScript,
    getExtrasScript
};
