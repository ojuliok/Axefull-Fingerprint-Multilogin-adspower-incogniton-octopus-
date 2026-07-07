export type ProfileStatus = 'ready' | 'running' | 'banned' | 'warning' | 'new' | 'farming';

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
    browser_type: 'chromium' | 'firefox';
    fingerprint: Fingerprint;
    proxy: Proxy | null;
    bypass_list?: string | null;
    avatar_color?: string | null;
    avatar_icon?: string | null;
}

export interface Folder {
    id: string;
    name: string;
    is_default: number;
}

export interface Fingerprint {
    id?: string;
    profile_id?: string;
    user_agent: string;
    platform: string;
    vendor?: string;
    renderer?: string;
    webgl_vendor?: string;
    viewport_width: number;
    viewport_height: number;
    screen_width: number;
    screen_height: number;
    color_depth?: number;
    pixel_ratio?: number;
    hardware_concurrency: number;
    device_memory: number;
    timezone: string;
    language: string;
    languages?: string;
    canvas_noise_seed?: string;
    webgl_noise_seed?: string;
    audio_noise_seed?: string;
    webrtc_mode: string;
}

export interface Proxy {
    id?: string;
    profile_id?: string;
    type: string;
    host: string;
    port: number;
    username?: string | null;
    password?: string | null;
}
