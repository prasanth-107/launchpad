-- ==============================================================================
-- MODERN PLACEMENT LAUNCHPAD - PHASE 11: AI CAREER COACH / PLACEMENT COPILOT
-- Migration: 20260911000002_career_coach_schema.sql
-- Description: Creates canonical public.coach_sessions (Entity 16) and
--              public.coach_messages (Entity 17) with strict RLS policies.
-- ==============================================================================

-- 1. Coach Sessions Table (Entity 16)
CREATE TABLE IF NOT EXISTS public.coach_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Placement Coaching Session',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index for user-scoped session queries
CREATE INDEX IF NOT EXISTS idx_coach_sessions_user_id ON public.coach_sessions(user_id);

-- Enable Row Level Security (RLS) on coach_sessions
ALTER TABLE public.coach_sessions ENABLE ROW LEVEL SECURITY;

-- Strict User Ownership RLS Policy for coach_sessions
DROP POLICY IF EXISTS "Users can manage own coach sessions" ON public.coach_sessions;
CREATE POLICY "Users can manage own coach sessions" ON public.coach_sessions
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- 2. Coach Messages Table (Entity 17)
CREATE TABLE IF NOT EXISTS public.coach_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.coach_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for high-performance session conversation retrieval
CREATE INDEX IF NOT EXISTS idx_coach_messages_session_id ON public.coach_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_coach_messages_user_id ON public.coach_messages(user_id);

-- Enable Row Level Security (RLS) on coach_messages
ALTER TABLE public.coach_messages ENABLE ROW LEVEL SECURITY;

-- Strict User Ownership RLS Policy for coach_messages
DROP POLICY IF EXISTS "Users can manage own coach messages" ON public.coach_messages;
CREATE POLICY "Users can manage own coach messages" ON public.coach_messages
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
