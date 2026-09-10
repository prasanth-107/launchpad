-- ==============================================================================
-- MODERN PLACEMENT LAUNCHPAD - PHASE 16 MIGRATION
-- Adaptive Practice & Question Intelligence Schema
-- ==============================================================================

-- 1. Adaptive Practice Sessions Table
CREATE TABLE IF NOT EXISTS public.adaptive_practice_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    topic TEXT NOT NULL,
    target_skill TEXT NOT NULL,
    initial_difficulty TEXT NOT NULL DEFAULT 'Medium' CHECK (initial_difficulty IN ('Easy', 'Medium', 'Hard')),
    final_difficulty TEXT NOT NULL DEFAULT 'Medium' CHECK (final_difficulty IN ('Easy', 'Medium', 'Hard')),
    total_questions INT NOT NULL DEFAULT 5,
    completed_questions INT NOT NULL DEFAULT 0,
    correct_count INT NOT NULL DEFAULT 0,
    accuracy_percent INT DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    completed_at TIMESTAMPTZ
);

-- 2. Adaptive Practice Question Attempts Table
CREATE TABLE IF NOT EXISTS public.adaptive_practice_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.adaptive_practice_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    question_id TEXT NOT NULL,
    question_text TEXT NOT NULL,
    skill TEXT NOT NULL,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
    user_answer TEXT,
    is_correct BOOLEAN NOT NULL DEFAULT false,
    explanation TEXT,
    reason TEXT,
    time_taken_seconds INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Indexes for fast query performance
CREATE INDEX IF NOT EXISTS idx_adaptive_practice_sessions_user_id ON public.adaptive_practice_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_adaptive_practice_sessions_created_at ON public.adaptive_practice_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_adaptive_practice_attempts_session_id ON public.adaptive_practice_attempts(session_id);
CREATE INDEX IF NOT EXISTS idx_adaptive_practice_attempts_user_id ON public.adaptive_practice_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_adaptive_practice_attempts_skill ON public.adaptive_practice_attempts(skill);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.adaptive_practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adaptive_practice_attempts ENABLE ROW LEVEL SECURITY;

-- 5. Row Level Security Policies
CREATE POLICY "Users can view their own adaptive practice sessions"
    ON public.adaptive_practice_sessions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own adaptive practice sessions"
    ON public.adaptive_practice_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own adaptive practice sessions"
    ON public.adaptive_practice_sessions FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own adaptive practice attempts"
    ON public.adaptive_practice_attempts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own adaptive practice attempts"
    ON public.adaptive_practice_attempts FOR INSERT
    WITH CHECK (auth.uid() = user_id);
