import { spawn, ChildProcess } from 'child_process';
import fs from 'fs';
import { isBrowserInstalled } from '../diagnostics/health';
import { auditLaunchArguments } from '../security/compliance-guard';

export interface ProxyConfig {
    host: string;
    port: number;
    username?: string;
    password?: string;
}

export function getBrowserExecutablePath(browser: string): string {
    const bLower = browser.toLowerCase();
    
    if (process.platform === 'win32') {
        const paths: Record<string, string[]> = {
            chrome: [
                'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
                'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
                `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`
            ],
            chrome_beta: [
                'C:\\Program Files\\Google\\Chrome Beta\\Application\\chrome.exe',
                'C:\\Program Files (x86)\\Google\\Chrome Beta\\Application\\chrome.exe'
            ],
            edge: [
                'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
                'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
            ],
            brave: [
                'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
                'C:\\Program Files (x86)\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
                `${process.env.LOCALAPPDATA}\\BraveSoftware\\Brave-Browser\\Application\\brave.exe`
            ],
            firefox: [
                'C:\\Program Files\\Mozilla Firefox\\firefox.exe',
                'C:\\Program Files (x86)\\Mozilla Firefox\\firefox.exe'
            ]
        };

        const candidates = paths[bLower];
        if (candidates) {
            for (const p of candidates) {
                if (fs.existsSync(p)) return p;
            }
        }
    } else if (process.platform === 'darwin') {
        const paths: Record<string, string[]> = {
            chrome: ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'],
            chrome_beta: ['/Applications/Google Chrome Beta.app/Contents/MacOS/Google Chrome Beta'],
            edge: ['/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'],
            brave: ['/Applications/Brave Browser.app/Contents/MacOS/Brave Browser'],
            firefox: ['/Applications/Firefox.app/Contents/MacOS/firefox-bin']
        };

        const candidates = paths[bLower];
        if (candidates) {
            for (const p of candidates) {
                if (fs.existsSync(p)) return p;
            }
        }
    } else {
        // Linux fallbacks
        const cmd = bLower === 'edge' ? 'microsoft-edge' : bLower === 'chrome_beta' ? 'google-chrome-beta' : bLower;
        return cmd; // Assumes it is in PATH
    }
    
    throw new Error(`Browser "${browser}" executable not found on this system.`);
}

/**
 * Launch an isolated native desktop browser window for a specific profile.
 * Supports Chrome, Edge, Brave, and Firefox.
 * 
 * @param extraArgs - Additional command-line arguments (e.g., CDP port, anti-detection flags)
 */
export function launchNativeBrowser(
    browser: string,
    profilePath: string,
    proxy?: ProxyConfig,
    onExit?: (code: number | null) => void,
    extraArgs: string[] = []
): ChildProcess {
    if (!isBrowserInstalled(browser)) {
        throw new Error(`Browser "${browser}" is not installed.`);
    }

    const exePath = getBrowserExecutablePath(browser);
    const bLower = browser.toLowerCase();
    const args: string[] = [];

    if (bLower === 'firefox') {
        // Firefox profile isolation flags
        args.push('-profile', profilePath);
        args.push('-no-remote');
        
        // Firefox proxy configuration must be set in prefs.js in the profile dir,
        // command line proxy is not natively supported in standard Firefox.
    } else {
        // Chromium-based profile isolation flags
        args.push(`--user-data-dir=${profilePath}`);

        if (proxy) {
            // Apply proxy server argument
            args.push(`--proxy-server=${proxy.host}:${proxy.port}`);
            // Note: proxy credentials authentication (user/pass) in native Chromium
            // is handled via prompt or local PAC / forwarding tunnel.
        }
    }

    // Append extra arguments (CDP port, anti-detection flags, etc.)
    args.push(...extraArgs);

    // Audit arguments via compliance guard to block headless/auto-sign-in attempts
    auditLaunchArguments(args);

    console.log(`[BrowserLauncher] Spawning browser: ${exePath} with args:`, args);

    const child = spawn(exePath, args, {
        detached: true,
        stdio: 'ignore'
    });

    // Keep process tracked for CDP connection management
    // The Electron app will handle cleanup on exit
    child.unref();

    child.on('close', (code) => {
        console.log(`[BrowserLauncher] Browser process closed (PID: ${child.pid}, Exit Code: ${code})`);
        if (onExit) onExit(code);
    });
    child.on('error', (err) => {
        console.error(`[BrowserLauncher] Browser process error:`, err);
    });

    return child;
}
