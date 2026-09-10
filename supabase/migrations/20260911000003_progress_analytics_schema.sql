-- ==============================================================================
-- MODERN PLACEMENT LAUNCHPAD - PHASE 12: PROGRESS INTELLIGENCE & ANALYTICS
-- Migration: 20260911000003_progress_analytics_schema.sql
-- Description: Creates canonical public.readiness_snapshots (Entity 18)
--              with strict RLS user ownership policies.
-- ==============================================================================

-- 1. Readiness Snapshots Table (Entity 18)
CREATE TABLE IF NOT EXISTS public.readiness_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    readiness_score NUMERIC(5, 2) NOT NULL,
    evaluated_pillars INT NOT NULL DEFAULT 0,
    strongest_area TEXT,
    priority_gap TEXT,
    pillar_breakdown JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index for efficient user historical trend queries
CREATE INDEX IF NOT EXISTS idx_readiness_snapshots_user_id ON public.readiness_snapshots(user_id, created_at DESC);

-- Enable Row Level Security (RLS) on readiness_snapshots
ALTER TABLE public.readiness_snapshots ENABLE ROW LEVEL SECURITY;

-- Strict User Ownership RLS Policy for readiness_snapshots
DROP POLICY IF EXISTS "Users can manage own readiness snapshots" ON public.readiness_snapshots;
CREATE POLICY "Users can manage own readiness snapshots" ON public.readiness_snapshots
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
