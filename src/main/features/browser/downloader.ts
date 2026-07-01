import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import { app } from 'electron';
import type { BrowserType } from '../profile/types';

export interface DownloadProgress {
  percent: number;
  transferred: number;
  total: number;
}

let currentDownloadProgress: DownloadProgress | null = null;

export function getDownloadStatus() {
  return currentDownloadProgress;
}

/**
 * Get the Playwright browsers cache directory.
 * Playwright stores downloaded browsers under a well-known path.
 * On Windows: %LOCALAPPDATA%\ms-playwright
 * Fallback: <userData>/ms-playwright
 */
function getPlaywrightCacheDir(): string {
  if (process.platform === 'win32' && process.env.LOCALAPPDATA) {
    return path.join(process.env.LOCALAPPDATA, 'ms-playwright');
  }
  if (process.env.HOME) {
    if (process.platform === 'darwin') {
      return path.join(process.env.HOME, 'Library', 'Caches', 'ms-playwright');
    }
    return path.join(process.env.HOME, '.cache', 'ms-playwright');
  }
  return path.join(app.getPath('userData'), 'ms-playwright');
}

/**
 * Check if a Playwright browser is installed by attempting to find its directory.
 */
export function isBrowserInstalled(browserType: BrowserType): boolean {
  const cacheDir = getPlaywrightCacheDir();
  if (!fs.existsSync(cacheDir)) return false;

  try {
    const entries = fs.readdirSync(cacheDir);
    const prefix = browserType === 'chromium' ? 'chromium-' : 'firefox-';
    return entries.some(entry => {
      if (!entry.startsWith(prefix)) return false;
      const fullPath = path.join(cacheDir, entry);
      return fs.statSync(fullPath).isDirectory();
    });
  } catch {
    return false;
  }
}

/**
 * Get the executable path for a Playwright-managed browser.
 * Returns undefined if the browser is not installed.
 */
export function getBrowserExecutablePath(browserType: BrowserType): string | undefined {
  const cacheDir = getPlaywrightCacheDir();
  if (!fs.existsSync(cacheDir)) return undefined;

  try {
    const entries = fs.readdirSync(cacheDir).sort().reverse(); // newest first
    const prefix = browserType === 'chromium' ? 'chromium-' : 'firefox-';
    
    for (const entry of entries) {
      if (!entry.startsWith(prefix)) continue;
      const browserDir = path.join(cacheDir, entry);
      if (!fs.statSync(browserDir).isDirectory()) continue;

      let execPath: string | undefined;
      if (browserType === 'chromium') {
        if (process.platform === 'win32') {
          // Playwright versions use different dir names: chrome-win64, chrome-win, chrome-win32
          for (const dir of ['chrome-win64', 'chrome-win', 'chrome-win32']) {
            const candidate = path.join(browserDir, dir, 'chrome.exe');
            if (fs.existsSync(candidate)) { execPath = candidate; break; }
          }
        } else if (process.platform === 'darwin') {
          for (const dir of ['chrome-mac', 'chrome-mac-x64', 'chrome-mac-arm64']) {
            const candidate = path.join(browserDir, dir, 'Chromium.app', 'Contents', 'MacOS', 'Chromium');
            if (fs.existsSync(candidate)) { execPath = candidate; break; }
          }
        } else {
          for (const dir of ['chrome-linux', 'chrome-linux64']) {
            const candidate = path.join(browserDir, dir, 'chrome');
            if (fs.existsSync(candidate)) { execPath = candidate; break; }
          }
        }
      } else {
        // Firefox
        if (process.platform === 'win32') {
          execPath = path.join(browserDir, 'firefox', 'firefox.exe');
        } else if (process.platform === 'darwin') {
          execPath = path.join(browserDir, 'firefox', 'Nightly.app', 'Contents', 'MacOS', 'firefox');
        } else {
          execPath = path.join(browserDir, 'firefox', 'firefox');
        }
      }

      if (execPath && fs.existsSync(execPath)) return execPath;
    }
  } catch (err) {
    console.error(`[Downloader] Error searching for ${browserType} executable:`, err);
  }

  return undefined;
}

/**
 * Download a browser using Playwright's CLI.
 * This delegates to `npx playwright install <browser>` which handles
 * downloading the correct revision for the installed Playwright version.
 */
export async function downloadBrowser(
  browserType: BrowserType,
  onProgress?: (progress: DownloadProgress) => void
): Promise<string> {
  console.log(`[Downloader] Starting Playwright install for ${browserType}...`);

  currentDownloadProgress = { percent: 0, transferred: 0, total: 100 };
  if (onProgress) onProgress(currentDownloadProgress);

  try {
    // npx playwright install <chromium|firefox>
    // This downloads the exact revision compatible with the installed Playwright version
    execSync(`npx playwright install ${browserType}`, {
      stdio: 'pipe',
      env: { ...process.env },
      timeout: 300000, // 5 minutes max
    });

    currentDownloadProgress = { percent: 100, transferred: 100, total: 100 };
    if (onProgress) onProgress(currentDownloadProgress);

    const execPath = getBrowserExecutablePath(browserType);
    if (!execPath) {
      throw new Error(`Browser ${browserType} was installed but executable not found`);
    }

    console.log(`[Downloader] ${browserType} installed successfully at: ${execPath}`);
    return execPath;
  } catch (err) {
    currentDownloadProgress = null;
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[Downloader] Failed to install ${browserType}:`, msg);
    throw new Error(`Falha ao instalar ${browserType}: ${msg}`);
  }
}

// ============================================================
// Legacy compatibility aliases
// ============================================================

/** @deprecated Use isBrowserInstalled('chromium') instead */
export function isChromiumInstalled(): boolean {
  return isBrowserInstalled('chromium');
}

/** @deprecated Use getBrowserExecutablePath('chromium') instead */
export function getChromiumExecutablePath(): string {
  return getBrowserExecutablePath('chromium') || '';
}

/** @deprecated Use downloadBrowser('chromium') instead */
export async function downloadChromium(onProgress?: (progress: DownloadProgress) => void): Promise<string> {
  return downloadBrowser('chromium', onProgress);
}
