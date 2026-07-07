import { app, webContents, WebContents } from 'electron';

function isGoogleAuthUrl(urlStr: string): boolean {
    try {
        const url = new URL(urlStr);
        return (
            url.hostname === 'accounts.google.com' ||
            (url.hostname.endsWith('google.com') && url.pathname.startsWith('/o/oauth2'))
        );
    } catch {
        return false;
    }
}

function handleBlockedNavigation(wc: WebContents, url: string, trigger: string): void {
    console.warn(`[ComplianceGuard] BLOCKED embedded Google auth navigation! URL: ${url}, Trigger: ${trigger}`);
    
    // Log to audit system
    try {
        const { logSecurityEvent } = require('../database/db');
        logSecurityEvent(
            'BLOCKED_EMBEDDED_GOOGLE_LOGIN',
            `Blocked attempt to load ${url} via ${trigger}`,
            'WARNING'
        );
    } catch (err) {
        console.error('[ComplianceGuard] Failed to log compliance event to DB:', err);
    }

    // Notify the renderer
    try {
        wc.send('compliance:blocked-google-auth', { url, trigger });
    } catch {}
}

/**
 * Initialize the global compliance guard.
 * Hooks into Electron web contents lifecycle events to intercept embedded auth attempts.
 */
export function initComplianceGuard(): void {
    app.on('web-contents-created', (_, wc) => {
        // Intercept standard navigations
        wc.on('will-navigate', (event, url) => {
            if (isGoogleAuthUrl(url)) {
                event.preventDefault();
                handleBlockedNavigation(wc, url, 'will-navigate');
            }
        });

        // Intercept client-side redirects
        wc.on('will-redirect', (event, url) => {
            if (isGoogleAuthUrl(url)) {
                event.preventDefault();
                handleBlockedNavigation(wc, url, 'will-redirect');
            }
        });
        
        // Intercept embedded webviews loading Google auth
        wc.on('will-attach-webview', (event, _, params) => {
            if (params.src && isGoogleAuthUrl(params.src)) {
                event.preventDefault();
                handleBlockedNavigation(wc, params.src, 'will-attach-webview');
            }
        });
    });

    console.log('[ComplianceGuard] Compliance guard active. Intercepting embedded Google logins.');
}

/**
 * Audit arguments before spawning browsers to ensure compliance with authentication standards.
 */
export function auditLaunchArguments(args: string[]): void {
    const hasHeadless = args.some(arg => arg.includes('--headless'));
    if (hasHeadless) {
        try {
            const { logSecurityEvent } = require('../database/db');
            logSecurityEvent('BLOCKED_HEADLESS_LAUNCH', 'Blocked attempt to launch browser in headless mode', 'ERROR');
        } catch {}
        throw new Error('Compliance Guard Error: Running browser in headless mode is prohibited.');
    }
}
