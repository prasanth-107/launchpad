-- ==============================================================================
-- MODERN PLACEMENT LAUNCHPAD - PHASE 10: APPLICATION TRACKING & PLACEMENT PIPELINE
-- Migration: 20260911000001_applications_schema.sql
-- Description: Creates canonical public.applications table (Entity 15) with
--              unique constraint, RLS policies, and canonical status constraints.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    opportunity_id TEXT NOT NULL,
    company_name TEXT NOT NULL,
    role_title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'applied' CHECK (status IN ('saved', 'applied', 'assessment', 'interview', 'offer', 'selected', 'rejected', 'withdrawn')),
    applied_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    notes TEXT DEFAULT '',
    next_action TEXT,
    next_action_date TIMESTAMPTZ,
    assessment_date TIMESTAMPTZ,
    interview_date TIMESTAMPTZ,
    offer_date TIMESTAMPTZ,
    rejection_date TIMESTAMPTZ,
    application_url TEXT,
    CONSTRAINT unique_user_opportunity UNIQUE (user_id, opportunity_id)
);

-- Index for high-performance user query filtering
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON public.applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications(status);

-- Enable Row Level Security (RLS)
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Strict User Ownership RLS Policy (auth.uid() = user_id)
DROP POLICY IF EXISTS Users can access own applications ON public.applications;
CREATE POLICY Users can access own applications ON public.applications
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
