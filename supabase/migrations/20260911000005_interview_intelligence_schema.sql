-- ==============================================================================
-- MODERN PLACEMENT LAUNCHPAD - PHASE 15: ADVANCED INTERVIEW INTELLIGENCE & COMMUNICATION COACHING
-- Migration: 20260911000005_interview_intelligence_schema.sql
-- Description: Enhances public.mock_interviews (Entity 12) with communication analysis,
--              technical analysis, STAR analysis, improvement signals, and intelligence summary.
-- ==============================================================================

-- 1. Add non-breaking interview intelligence columns to public.mock_interviews
ALTER TABLE public.mock_interviews 
    ADD COLUMN IF NOT EXISTS communication_analysis JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS technical_analysis JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS star_analysis JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS improvement_signals JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS intelligence_summary TEXT;

-- 2. Index for efficient user interview intelligence lookup by recency
CREATE INDEX IF NOT EXISTS idx_mock_interviews_user_created ON public.mock_interviews(user_id, created_at DESC);

-- 3. Ensure Row Level Security (RLS) is enabled and policy strictly enforced
ALTER TABLE public.mock_interviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can access own mock interviews" ON public.mock_interviews;
CREATE POLICY "Users can access own mock interviews" ON public.mock_interviews
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
