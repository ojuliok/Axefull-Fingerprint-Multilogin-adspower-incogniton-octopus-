import { Fingerprint } from '../profile/types';
import presets from './presets/data.json';

type ConsistencyResult = {
    isConsistent: boolean;
    score: number;
    issues: ConsistencyIssue[];
};

type ConsistencyIssue = {
    field: string;
    severity: 'critical' | 'warning' | 'info';
    message: string;
    expected: string;
    actual: string;
};

/**
 * Validate that a fingerprint is internally consistent.
 * Returns a score 0-100 and list of issues.
 */
export function validateConsistency(
    fingerprint: Fingerprint,
    proxyCountry?: string,
    proxyTimezone?: string
): ConsistencyResult {
    const issues: ConsistencyIssue[] = [];

    // === 1. User-Agent vs Platform ===
    const ua = fingerprint.user_agent;
    const platform = fingerprint.platform;

    if (ua.includes('Windows') && platform !== 'Win32') {
        issues.push({
            field: 'platform',
            severity: 'critical',
            message: 'User-Agent diz Windows mas platform não é Win32',
            expected: 'Win32',
            actual: platform,
        });
    }
    if (ua.includes('Macintosh') && platform !== 'MacIntel') {
        issues.push({
            field: 'platform',
            severity: 'critical',
            message: 'User-Agent diz macOS mas platform não é MacIntel',
            expected: 'MacIntel',
            actual: platform,
        });
    }
    if (ua.includes('Linux') && !platform.includes('Linux')) {
        issues.push({
            field: 'platform',
            severity: 'critical',
            message: 'User-Agent diz Linux mas platform não contém Linux',
            expected: 'Linux x86_64',
            actual: platform,
        });
    }

    // === 2. User-Agent vs Vendor ===
    const isFirefox = ua.includes('Firefox');
    const isSafari = ua.includes('Safari') && !ua.includes('Chrome');
    const isEdge = ua.includes('Edg/');

    if (isFirefox && fingerprint.vendor !== '') {
        issues.push({
            field: 'vendor',
            severity: 'warning',
            message: 'Firefox não tem vendor (deve ser string vazia)',
            expected: '',
            actual: fingerprint.vendor,
        });
    }
    if (isSafari && fingerprint.vendor !== 'Apple Computer, Inc.') {
        issues.push({
            field: 'vendor',
            severity: 'warning',
            message: 'Safari deve ter vendor Apple Computer, Inc.',
            expected: 'Apple Computer, Inc.',
            actual: fingerprint.vendor,
        });
    }

    // === 3. WebGL Renderer vs OS ===
    const renderer = fingerprint.renderer;
    if (ua.includes('Macintosh')) {
        if (renderer.includes('Direct3D')) {
            issues.push({
                field: 'renderer',
                severity: 'critical',
                message: 'macOS não usa Direct3D (deveria ser OpenGL/Metal)',
                expected: 'Apple M* ou OpenGL Engine',
                actual: renderer,
            });
        }
    }
    if (ua.includes('Linux')) {
        if (renderer.includes('Direct3D')) {
            issues.push({
                field: 'renderer',
                severity: 'critical',
                message: 'Linux não usa Direct3D',
                expected: 'OpenGL ou Mesa',
                actual: renderer,
            });
        }
    }

    // === 4. WebGL Vendor vs Renderer ===
    const webglVendor = fingerprint.webgl_vendor;
    if (renderer.includes('NVIDIA') && !webglVendor.includes('NVIDIA')) {
        issues.push({
            field: 'webgl_vendor',
            severity: 'critical',
            message: 'Renderer é NVIDIA mas vendor não combina',
            expected: 'Google Inc. (NVIDIA)',
            actual: webglVendor,
        });
    }
    if (renderer.includes('AMD') && !webglVendor.includes('AMD')) {
        issues.push({
            field: 'webgl_vendor',
            severity: 'critical',
            message: 'Renderer é AMD mas vendor não combina',
            expected: 'Google Inc. (AMD)',
            actual: webglVendor,
        });
    }
    if (renderer.includes('Apple') && !webglVendor.includes('Apple')) {
        issues.push({
            field: 'webgl_vendor',
            severity: 'critical',
            message: 'Renderer é Apple mas vendor não combina',
            expected: 'Apple',
            actual: webglVendor,
        });
    }

    // === 5. Screen vs Viewport ===
    if (fingerprint.viewport_width > fingerprint.screen_width) {
        issues.push({
            field: 'viewport_width',
            severity: 'critical',
            message: 'Viewport não pode ser maior que a tela',
            expected: `<= ${fingerprint.screen_width}`,
            actual: String(fingerprint.viewport_width),
        });
    }
    if (fingerprint.viewport_height > fingerprint.screen_height) {
        issues.push({
            field: 'viewport_height',
            severity: 'critical',
            message: 'Viewport height não pode ser maior que a tela',
            expected: `<= ${fingerprint.screen_height}`,
            actual: String(fingerprint.viewport_height),
        });
    }

    // === 6. Timezone vs Proxy Country ===
    if (proxyCountry && proxyTimezone) {
        const geoProfile = (presets.geoProfiles as any)[proxyCountry];
        if (geoProfile) {
            const validTimezones: string[] = geoProfile.timezones;
            if (!validTimezones.includes(fingerprint.timezone)) {
                issues.push({
                    field: 'timezone',
                    severity: 'critical',
                    message: `Proxy está em ${proxyCountry} mas timezone não bate`,
                    expected: validTimezones.join(' ou '),
                    actual: fingerprint.timezone,
                });
            }
        }
    }

    // === 7. Language vs Timezone/Proxy ===
    if (proxyCountry) {
        const geoProfile = (presets.geoProfiles as any)[proxyCountry];
        if (geoProfile) {
            const validLanguages: string[] = geoProfile.languages.map((l: any) => l.primary);
            if (!validLanguages.includes(fingerprint.language)) {
                issues.push({
                    field: 'language',
                    severity: 'warning',
                    message: `Proxy em ${proxyCountry} mas idioma não é típico da região`,
                    expected: validLanguages.join(' ou '),
                    actual: fingerprint.language,
                });
            }
        }
    }

    // === 8. Pixel Ratio vs Resolution ===
    if (fingerprint.screen_width >= 3840 && fingerprint.pixel_ratio === 1) {
        issues.push({
            field: 'pixel_ratio',
            severity: 'info',
            message: 'Tela 4K geralmente tem pixel ratio > 1',
            expected: '1.5 ou 2',
            actual: String(fingerprint.pixel_ratio),
        });
    }

    // === 9. Hardware Concurrency vs Device Memory ===
    if (fingerprint.hardware_concurrency >= 16 && fingerprint.device_memory <= 4) {
        issues.push({
            field: 'device_memory',
            severity: 'warning',
            message: 'CPU com 16+ cores geralmente tem >= 8GB RAM',
            expected: '>= 8',
            actual: String(fingerprint.device_memory),
        });
    }

    // === Calculate score ===
    let score = 100;
    for (const issue of issues) {
        if (issue.severity === 'critical') score -= 15;
        else if (issue.severity === 'warning') score -= 5;
        else score -= 2;
    }
    score = Math.max(0, score);

    return {
        isConsistent: issues.filter(i => i.severity === 'critical').length === 0,
        score,
        issues,
    };
}
