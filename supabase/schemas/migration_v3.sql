-- ==========================================================
-- AXEFULL SUPABASE SCHEMA MIGRATION V3
-- Run this in your Supabase SQL Editor to sync your schema and resolve PostgREST cache errors.
-- ==========================================================

-- 1. Fix nodes table (Unified tree structure for Spaces, Folders, Canvas, CRM Boards, Task Boards)
ALTER TABLE public.nodes ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.nodes(id) ON DELETE CASCADE;
ALTER TABLE public.nodes ADD COLUMN IF NOT EXISTS icon TEXT;
ALTER TABLE public.nodes ADD COLUMN IF NOT EXISTS color TEXT;
ALTER TABLE public.nodes ADD COLUMN IF NOT EXISTS cover_image TEXT;
ALTER TABLE public.nodes ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.nodes ADD COLUMN IF NOT EXISTS properties JSONB;
ALTER TABLE public.nodes ADD COLUMN IF NOT EXISTS tags JSONB;
ALTER TABLE public.nodes ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.nodes ADD COLUMN IF NOT EXISTS content_data JSONB;
ALTER TABLE public.nodes ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE;
ALTER TABLE public.nodes ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE public.nodes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.nodes ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Fix tasks table
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS node_id UUID REFERENCES public.nodes(id) ON DELETE CASCADE;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS time_spent_seconds INT DEFAULT 0;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS tags JSONB;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS metadata JSONB;

-- 3. Fix CRM groups table
ALTER TABLE public.crm_groups ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#6b7280';
ALTER TABLE public.crm_groups ADD COLUMN IF NOT EXISTS order_index INT DEFAULT 0;

-- 4. Fix CRM cards table
ALTER TABLE public.crm_cards ADD COLUMN IF NOT EXISTS contact_info JSONB;
ALTER TABLE public.crm_cards ADD COLUMN IF NOT EXISTS custom_fields JSONB;

-- 5. Indexes for fast query performance
CREATE INDEX IF NOT EXISTS idx_nodes_workspace ON public.nodes(workspace_id);
CREATE INDEX IF NOT EXISTS idx_nodes_parent ON public.nodes(parent_id);
CREATE INDEX IF NOT EXISTS idx_tasks_node ON public.tasks(node_id);
CREATE INDEX IF NOT EXISTS idx_tasks_workspace ON public.tasks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_crm_groups_board ON public.crm_groups(board_node_id);
CREATE INDEX IF NOT EXISTS idx_crm_cards_group ON public.crm_cards(group_id);
CREATE INDEX IF NOT EXISTS idx_crm_cards_board ON public.crm_cards(board_node_id);

-- 6. Reload PostgREST schema cache to resolve "Could not find column in schema cache" error
NOTIFY pgrst, 'reload schema';
