import net from 'net';
import fs from 'fs';
import { execSync } from 'child_process';

/**
 * Check if a local TCP port is currently occupied.
 */
export function checkPortAvailable(port: number): Promise<boolean> {
    return new Promise((resolve) => {
        const server = net.createServer();
        server.once('error', (err: any) => {
            if (err.code === 'EADDRINUSE') {
                resolve(false);
            } else {
                resolve(true);
            }
        });
        server.once('listening', () => {
            server.close(() => resolve(true));
        });
        server.listen(port);
    });
}

/**
 * Check if a specific native browser is installed on the user's host OS.
 * Supported browsers: 'chrome', 'chrome_beta', 'edge', 'brave', 'firefox'.
 */
export function isBrowserInstalled(browser: string): boolean {
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
        if (!candidates) return false;
        return candidates.some(p => fs.existsSync(p));
    } else if (process.platform === 'darwin') {
        const paths: Record<string, string[]> = {
            chrome: ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'],
            chrome_beta: ['/Applications/Google Chrome Beta.app/Contents/MacOS/Google Chrome Beta'],
            edge: ['/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'],
            brave: ['/Applications/Brave Browser.app/Contents/MacOS/Brave Browser'],
            firefox: ['/Applications/Firefox.app/Contents/MacOS/firefox-bin']
        };

        const candidates = paths[bLower];
        if (!candidates) return false;
        return candidates.some(p => fs.existsSync(p));
    } else {
        // Linux fallback using command check
        try {
            const cmd = bLower === 'edge' ? 'microsoft-edge' : bLower === 'chrome_beta' ? 'google-chrome-beta' : bLower;
            execSync(`which ${cmd}`, { stdio: 'ignore' });
            return true;
        } catch {
            return false;
        }
    }
}

/**
 * Validate whether a session has expired based on UNIX timestamp.
 */
export function isSessionExpired(expiresAtMs: number): boolean {
    return Date.now() > expiresAtMs;
}

/**
 * Check if the network can establish a raw TCP connection with a proxy host.
 */
export function testProxyConnection(host: string, port: number, timeoutMs = 4000): Promise<{ ok: boolean; error?: string }> {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        let isResolved = false;

        const timer = setTimeout(() => {
            if (isResolved) return;
            isResolved = true;
            socket.destroy();
            resolve({ ok: false, error: 'Connection timed out' });
        }, timeoutMs);

        socket.connect(port, host, () => {
            if (isResolved) return;
            isResolved = true;
            clearTimeout(timer);
            socket.end();
            resolve({ ok: true });
        });

        socket.on('error', (err) => {
            if (isResolved) return;
            isResolved = true;
            clearTimeout(timer);
            resolve({ ok: false, error: err.message });
        });
    });
}
