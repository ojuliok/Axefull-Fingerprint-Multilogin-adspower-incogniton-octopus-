import { v4 as uuidv4 } from 'uuid';
import { Fingerprint } from '../profile/types';
import presets from './presets/data.json';
import { validateConsistency } from './consistency-engine';

type Platform = 'windows' | 'macos' | 'linux';
type CountryCode = 'BR' | 'US' | 'GB' | 'DE' | 'FR' | 'JP' | 'AU' | 'CA' | 'ES' | 'IT';

/**
 * Pick random element from array
 */
function randomChoice<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Pick random element using weights
 */
function weightedChoice<T extends { weight: number }>(arr: T[]): T {
    const totalWeight = arr.reduce((sum, item) => sum + item.weight, 0);
    let random = Math.random() * totalWeight;
    for (const item of arr) {
        random -= item.weight;
        if (random <= 0) return item;
    }
    return arr[arr.length - 1];
}

/**
 * Generate a random noise seed
 */
function generateNoiseSeed(): string {
    return uuidv4().replace(/-/g, '').substring(0, 16);
}

/**
 * Detect browser type from user agent
 */
function detectBrowser(userAgent: string): 'chrome' | 'firefox' | 'safari' | 'edge' {
    if (userAgent.includes('Edg/')) return 'edge';
    if (userAgent.includes('Firefox')) return 'firefox';
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'safari';
    return 'chrome';
}

/**
 * Get WebGL vendor string from renderer
 */
function getWebGLVendor(renderer: string): string {
    if (renderer.includes('Apple')) return 'Apple';
    if (renderer.includes('AMD') || renderer.includes('Radeon')) return 'Google Inc. (AMD)';
    if (renderer.includes('Intel')) return 'Google Inc. (Intel)';
    return 'Google Inc. (NVIDIA)';
}

/**
 * Generate a CONSISTENT fingerprint.
 * All values are cross-validated to ensure no detectable inconsistencies.
 *
 * @param profileId - The profile this fingerprint belongs to
 * @param platform - Target OS: 'windows', 'macos', or 'linux'
 * @param country - Target country code (ISO 2-letter) for geo-consistency
 */
export function generateFingerprint(
    profileId: string,
    platform: Platform = 'windows',
    country: CountryCode = 'BR',
    _depth = 0
): Fingerprint {
    // === 1. Select User-Agent (platform-specific) ===
    const userAgents = presets.userAgents[platform] as string[];
    const userAgent = randomChoice(userAgents);
    const browser = detectBrowser(userAgent);

    // === 2. Platform string ===
    const platformString = presets.platforms[platform];

    // === 3. Vendor (browser-specific) ===
    const vendor = presets.vendors[browser] || presets.vendors.chrome;

    // === 4. WebGL Renderer (OS-specific — CRITICAL) ===
    const renderers = (presets.webglRenderers as any)[platform] as string[];
    const renderer = randomChoice(renderers);
    const webglVendor = getWebGLVendor(renderer);

    // === 5. Screen Resolution (weighted by real-world distribution) ===
    const resolution = weightedChoice(presets.resolutions);

    // === 6. Viewport (must be <= screen) ===
    const validViewports = presets.viewports.filter(
        v => v.width <= resolution.width && v.height <= resolution.height
    );
    const viewport = validViewports.length > 0
        ? randomChoice(validViewports)
        : { width: resolution.width, height: resolution.height - 80 };

    // === 7. Hardware (consistent combinations) ===
    const hardwareConcurrency = randomChoice(presets.hardwareConcurrencies);
    // RAM should be proportional to CPU cores
    const validMemories = presets.deviceMemories.filter(m => {
        if (hardwareConcurrency >= 16) return m >= 8;
        if (hardwareConcurrency >= 8) return m >= 4;
        return true;
    });
    const deviceMemory = randomChoice(validMemories);

    const colorDepth = randomChoice(presets.colorDepths);

    // Pixel ratio should be consistent with resolution
    let validPixelRatios = presets.pixelRatios;
    if (resolution.width >= 3840) {
        validPixelRatios = validPixelRatios.filter(r => r >= 1.5);
    } else if (resolution.width <= 1366) {
        validPixelRatios = validPixelRatios.filter(r => r <= 1.5);
    }
    const pixelRatio = randomChoice(validPixelRatios.length > 0 ? validPixelRatios : [1]);

    // === 8. Geo Profile (timezone + language MUST match proxy country) ===
    const geoProfile = (presets.geoProfiles as any)[country];
    let timezone: string;
    let languageData: { primary: string; list: string };

    if (geoProfile) {
        timezone = randomChoice(geoProfile.timezones);
        languageData = randomChoice(geoProfile.languages);
    } else {
        // Fallback
        timezone = 'America/Sao_Paulo';
        languageData = { primary: 'pt-BR', list: 'pt-BR,pt,en-US,en' };
    }

    // === 9. Build Fingerprint ===
    const fingerprint: Fingerprint = {
        id: uuidv4(),
        profile_id: profileId,
        user_agent: userAgent,
        platform: platformString,
        vendor,
        renderer,
        webgl_vendor: webglVendor,
        viewport_width: viewport.width,
        viewport_height: viewport.height,
        screen_width: resolution.width,
        screen_height: resolution.height,
        color_depth: colorDepth,
        pixel_ratio: pixelRatio,
        hardware_concurrency: hardwareConcurrency,
        device_memory: deviceMemory,
        timezone,
        language: languageData.primary,
        languages: languageData.list,
        canvas_noise_seed: generateNoiseSeed(),
        webgl_noise_seed: generateNoiseSeed(),
        audio_noise_seed: generateNoiseSeed(),
        webrtc_mode: 'fake', // Changed from 'disabled' — 'fake' is more natural
    };

    // === 10. Self-validate consistency ===
    const validation = validateConsistency(fingerprint, country);
    if (!validation.isConsistent) {
        if (_depth >= 5) {
            console.error('[Generator] Max recursion depth reached, using last fingerprint as-is');
            return fingerprint;
        }
        console.warn('[Generator] Consistency issues found, regenerating...');
        return generateFingerprint(profileId, platform, country, _depth + 1);
    }

    return fingerprint;
}

/**
 * Regenerate a fingerprint while keeping the same ID
 */
export function regenerateFingerprint(
    existingFingerprint: Fingerprint,
    platform: Platform = 'windows',
    country: CountryCode = 'BR'
): Fingerprint {
    const newFingerprint = generateFingerprint(existingFingerprint.profile_id, platform, country);
    return {
        ...newFingerprint,
        id: existingFingerprint.id,
    };
}

/**
 * Get list of supported countries for geo-profiles
 */
export function getSupportedCountries(): { code: string; timezones: string[] }[] {
    return Object.entries(presets.geoProfiles).map(([code, profile]) => ({
        code,
        timezones: (profile as any).timezones,
    }));
}
