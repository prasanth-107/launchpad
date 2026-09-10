-- ==============================================================================
-- MODERN PLACEMENT LAUNCHPAD - PHASE 13: PREPARATION WORKSPACE & DAILY ACTION PLAN
-- Migration: 20260911000004_preparation_workspace_schema.sql
-- Description: Creates canonical public.preparation_actions (Entity 19)
--              to persist daily completed actions with strict RLS policies.
-- ==============================================================================

-- 1. Preparation Actions Table (Entity 19)
CREATE TABLE IF NOT EXISTS public.preparation_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    action_key TEXT NOT NULL,
    action_date DATE NOT NULL DEFAULT CURRENT_DATE,
    completed BOOLEAN NOT NULL DEFAULT true,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_user_action_date UNIQUE (user_id, action_key, action_date)
);

-- Index for efficient user daily action lookup and streak computation
CREATE INDEX IF NOT EXISTS idx_preparation_actions_user_date ON public.preparation_actions(user_id, action_date DESC);

-- Enable Row Level Security (RLS) on preparation_actions
ALTER TABLE public.preparation_actions ENABLE ROW LEVEL SECURITY;

-- Strict User Ownership RLS Policy for preparation_actions
DROP POLICY IF EXISTS "Users can manage own preparation actions" ON public.preparation_actions;
CREATE POLICY "Users can manage own preparation actions" ON public.preparation_actions
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
