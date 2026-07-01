-- ==========================================
-- AXEFULL COMPLETE SUPABASE SCHEMA (V2)
-- ==========================================
-- This file contains all necessary tables for a fresh Supabase instance.
-- It combines the core browser management tables with the unified Node-based
-- Workspace architecture (Canvas, Tasks, CRM, Notes).

-- ==========================================
-- CORE BROWSER MANAGEMENT
-- ==========================================

-- 1. Folders table (Profile Folders)
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

-- ==========================================
-- SECURITY & WORKSPACES
-- ==========================================

-- 8. User Profiles (Auth & Subscription Plans)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    plan TEXT DEFAULT 'free',
    max_profiles INTEGER DEFAULT 3,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to automatically create a user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, plan, max_profiles, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    'free',
    3,
    TRUE
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if trigger exists before creating to prevent errors
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;

-- 9. User Security Settings
CREATE TABLE IF NOT EXISTS user_security_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    pin_hash TEXT,
    password_hash TEXT,
    lock_timeout_minutes INTEGER DEFAULT 5,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. User Access Logs
CREATE TABLE IF NOT EXISTS user_access_logs (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    ip_address TEXT,
    device_info TEXT,
    accessed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Workspaces table
CREATE TABLE IF NOT EXISTS workspaces (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Workspace Members table
CREATE TABLE IF NOT EXISTS workspace_members (
    id UUID PRIMARY KEY,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'viewer', -- 'owner', 'editor', 'viewer'
    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ==========================================
-- UNIFIED ARCHITECTURE (Replaces canvases)
-- ==========================================

-- 12. Unified Tree Structure (Nodes)
-- Stores Folders, Pages, Canvases, CRM Boards, and Task Boards in a hierarchical tree.
CREATE TABLE IF NOT EXISTS nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES nodes(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    type TEXT NOT NULL, -- 'folder', 'page', 'canvas', 'crm_board', 'task_board'
    icon TEXT,
    color TEXT,
    cover_image TEXT,
    description TEXT,
    properties JSONB,
    tags JSONB,
    notes TEXT,
    content_data JSONB, -- Stores Canvas JSON, Page Markdown/HTML, or custom configurations
    is_favorite BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_nodes_workspace ON nodes(workspace_id);
CREATE INDEX IF NOT EXISTS idx_nodes_parent ON nodes(parent_id);

-- 13. Shared Items table
-- Para compartilhar itens (nodes) individuais com usuários específicos
CREATE TABLE IF NOT EXISTS shared_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    node_id UUID REFERENCES nodes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'viewer',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- PRODUCTIVITY (TASKS & CRM)
-- ==========================================

-- 14. Tasks Table (Tarefas)
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    node_id UUID REFERENCES nodes(id) ON DELETE CASCADE, -- Belongs to a specific Task Board or Canvas
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'todo', -- 'todo', 'in_progress', 'done'
    priority TEXT DEFAULT 'medium',
    due_date TIMESTAMPTZ,
    time_spent_seconds INT DEFAULT 0,
    assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    tags JSONB,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_node ON tasks(node_id);
CREATE INDEX IF NOT EXISTS idx_tasks_workspace ON tasks(workspace_id);

-- 15. CRM Groups (Columns/Stages in a Board)
CREATE TABLE IF NOT EXISTS crm_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    board_node_id UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    color TEXT DEFAULT '#6b7280',
    order_index INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_groups_board ON crm_groups(board_node_id);

-- 16. CRM Cards (Leads/Deals)
CREATE TABLE IF NOT EXISTS crm_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    board_node_id UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
    group_id UUID REFERENCES crm_groups(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT, -- Matches the stage/group string as fallback
    value NUMERIC(14,2) DEFAULT 0,
    contact_info JSONB, -- e.g., {"company": "...", "contact": "..."}
    custom_fields JSONB, -- Dynamic columns data
    assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_cards_group ON crm_cards(group_id);
CREATE INDEX IF NOT EXISTS idx_crm_cards_board ON crm_cards(board_node_id);

-- ==========================================
-- TELEMETRY & PROGRESS
-- ==========================================

-- 17. Onboarding Progress table
CREATE TABLE IF NOT EXISTS onboarding_progress (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_profile_created BOOLEAN NOT NULL DEFAULT FALSE,
    first_profile_launched BOOLEAN NOT NULL DEFAULT FALSE,
    canvas_node_created BOOLEAN NOT NULL DEFAULT FALSE,
    crm_card_moved BOOLEAN NOT NULL DEFAULT FALSE,
    activation_achieved BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMPTZ
);

-- 18. Product Events (Telemetry) table
CREATE TABLE IF NOT EXISTS product_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
    event_name VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_events_name_time ON product_events(event_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_events_user ON product_events(user_id);


-- ==========================================
-- ROW LEVEL SECURITY (Optional)
-- ==========================================
ALTER TABLE nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_cards ENABLE ROW LEVEL SECURITY;
-- Default basic policies (Update according to your actual permission logic)
-- CREATE POLICY "Enable read access for all users" ON nodes FOR SELECT USING (true);
-- CREATE POLICY "Enable insert access for all users" ON nodes FOR INSERT WITH CHECK (true);
-- CREATE POLICY "Enable update access for all users" ON nodes FOR UPDATE USING (true);
-- CREATE POLICY "Enable delete access for all users" ON nodes FOR DELETE USING (true);
