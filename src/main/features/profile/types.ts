/**
 * Profile types and interfaces for the Fingerprint Browser
 */

export type ProfileStatus = 'ready' | 'running' | 'banned' | 'warning' | 'new' | 'farming';

export type BrowserType = 'chromium' | 'firefox';

export interface Profile {
    id: string;
    name: string;
    created_at: string;
    updated_at: string;
    last_used: string | null;
    data_dir_path: string;
    notes: string | null;
    status: ProfileStatus;
    is_active: number;
    tags: string | null;
    category: string | null;
    folder_id: string | null;
    browser_type: BrowserType;
    bypass_list?: string | null;
    avatar_color?: string | null;
    avatar_icon?: string | null;
}

export interface Folder {
    id: string;
    name: string;
    is_default: number;
    created_at: string;
}

export interface Fingerprint {
    id: string;
    profile_id: string;

    // User Agent & Platform
    user_agent: string;
    platform: string;
    vendor: string;

    // WebGL
    renderer: string;
    webgl_vendor: string;

    // Viewport & Screen
    viewport_width: number;
    viewport_height: number;
    screen_width: number;
    screen_height: number;
    color_depth: number;
    pixel_ratio: number;

    // Hardware
    hardware_concurrency: number;
    device_memory: number;

    // Locale & Timezone
    timezone: string;
    language: string;
    languages: string;

    // Noise seeds
    canvas_noise_seed: string;
    webgl_noise_seed: string;
    audio_noise_seed: string;

    // WebRTC
    webrtc_mode: 'disabled' | 'fake' | 'real';
}

export interface Proxy {
    id: string;
    profile_id: string;
    type: 'http' | 'https' | 'socks4' | 'socks5';
    host: string;
    port: number;
    username: string | null;
    password: string | null;
}

export interface ProfileWithDetails extends Profile {
    fingerprint: Fingerprint;
    proxy: Proxy | null;
}

export interface CreateProfileInput {
    name: string;
    notes?: string;
    platform?: 'windows' | 'macos' | 'linux';
    tags?: string;
    category?: string;
    folder_id?: string;
    browser_type?: BrowserType;
    proxy?: Omit<Proxy, 'id' | 'profile_id'>;
    avatar_color?: string | null;
    avatar_icon?: string | null;
    bypass_list?: string | null;
}

export interface UpdateProfileInput {
    name?: string;
    notes?: string | null;
    status?: ProfileStatus;
    tags?: string | null;
    category?: string | null;
    folder_id?: string | null;
    avatar_color?: string | null;
    avatar_icon?: string | null;
    bypass_list?: string | null;
    browser_type?: BrowserType;
}

export interface UpdateFingerprintInput {
    user_agent?: string;
    viewport_width?: number;
    viewport_height?: number;
    timezone?: string;
    language?: string;
    webrtc_mode?: 'disabled' | 'fake' | 'real';
}

export interface UpdateProxyInput {
    type?: 'http' | 'https' | 'socks4' | 'socks5';
    host?: string;
    port?: number;
    username?: string | null;
    password?: string | null;
}

export interface AuthUser {
    id: string;
    email: string;
    plan: string;
    plan_label: string;
    max_profiles: number;
    is_active: boolean;
}
