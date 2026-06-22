-- Execute este script no SQL Editor do seu painel Supabase.
-- Ele garante que a estrutura do Supabase está idêntica ao seu banco SQLite local (sql.js).

-- 1. Folders table (criada primeiro devido à Foreign Key)
CREATE TABLE IF NOT EXISTS folders (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    is_default INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_used TIMESTAMPTZ,
    data_dir_path TEXT NOT NULL UNIQUE,
    notes TEXT,
    status TEXT DEFAULT 'ready',
    is_active INTEGER DEFAULT 0,
    tags TEXT,
    category TEXT DEFAULT 'all',
    folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
    browser_type TEXT DEFAULT 'chromium'
);

-- 3. Fingerprints table
CREATE TABLE IF NOT EXISTS fingerprints (
    id UUID PRIMARY KEY,
    profile_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    user_agent TEXT NOT NULL,
    platform TEXT NOT NULL,
    vendor TEXT NOT NULL,
    renderer TEXT NOT NULL,
    webgl_vendor TEXT NOT NULL,
    viewport_width INTEGER NOT NULL,
    viewport_height INTEGER NOT NULL,
    screen_width INTEGER NOT NULL,
    screen_height INTEGER NOT NULL,
    color_depth INTEGER DEFAULT 24,
    pixel_ratio REAL DEFAULT 1.0,
    hardware_concurrency INTEGER NOT NULL,
    device_memory INTEGER NOT NULL,
    timezone TEXT NOT NULL,
    language TEXT NOT NULL,
    languages TEXT NOT NULL,
    canvas_noise_seed TEXT NOT NULL,
    webgl_noise_seed TEXT NOT NULL,
    audio_noise_seed TEXT NOT NULL,
    webrtc_mode TEXT DEFAULT 'disabled'
);

-- 4. Proxies table
CREATE TABLE IF NOT EXISTS proxies (
    id UUID PRIMARY KEY,
    profile_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    host TEXT NOT NULL,
    port INTEGER NOT NULL,
    username TEXT,
    password TEXT
);

-- 5. Profile templates table
CREATE TABLE IF NOT EXISTS profile_templates (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    platform TEXT DEFAULT 'windows',
    tags TEXT,
    fingerprint_snapshot TEXT NOT NULL,
    proxy_snapshot TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Proxy pool table
CREATE TABLE IF NOT EXISTS proxy_pool (
    id UUID PRIMARY KEY,
    label TEXT,
    type TEXT NOT NULL DEFAULT 'http',
    host TEXT NOT NULL,
    port INTEGER NOT NULL,
    username TEXT,
    password TEXT,
    last_tested_at TEXT,
    last_status TEXT DEFAULT 'untested',
    last_latency_ms INTEGER,
    assigned_profile_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Activity/Audit logs table
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    action_type TEXT NOT NULL,
    profile_id UUID,
    details TEXT,
    integrity_hash TEXT NOT NULL
);
