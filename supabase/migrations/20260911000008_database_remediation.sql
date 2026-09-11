-- ==============================================================================
-- MODERN PLACEMENT LAUNCHPAD - POST-AUDIT DATABASE REMEDIATION
-- Migration: 20260911000008_database_remediation.sql
-- Description: Idempotent, safe, and minimal database remediation implementing:
--   1. RLS policy fixes for public.applications and public.readiness_snapshots
--   2. Defensive ghost policy cleanup for non-existent table references
--   3. Privilege escalation prevention trigger on public.profiles(role)
--   4. High-impact query performance indexes for foreign keys & chronological lookups
--   5. Score range check constraints (0-100) with safe NULL handling
--   6. Supabase storage bucket & RLS policies for candidate resumes
-- ==============================================================================

-- ==============================================================================
-- SECTION 1: GHOST POLICY CLEANUP
-- Safely drop policies attached to non-canonical table names if they exist.
-- ==============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'job_applications') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Admins can view job applications" ON public.job_applications';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'placement_readiness_snapshots') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Admins can view readiness snapshots" ON public.placement_readiness_snapshots';
  END IF;
END $$;

-- ==============================================================================
-- SECTION 2: CANONICAL RLS POLICY REPAIR
-- Ensure public.applications and public.readiness_snapshots have properly quoted,
-- strictly scoped candidate access and administrator SELECT permissions.
-- ==============================================================================

-- A. public.applications (Entity 15)
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Candidate self-ownership policy (properly quoted)
DROP POLICY IF EXISTS "Users can access own applications" ON public.applications;
CREATE POLICY "Users can access own applications" ON public.applications
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Admin read-only policy for institution placement monitoring
DROP POLICY IF EXISTS "Admins can view applications" ON public.applications;
CREATE POLICY "Admins can view applications" ON public.applications
    FOR SELECT USING (public.is_admin(auth.uid()));

-- B. public.readiness_snapshots (Entity 18)
ALTER TABLE public.readiness_snapshots ENABLE ROW LEVEL SECURITY;

-- Candidate self-ownership policy
DROP POLICY IF EXISTS "Users can manage own readiness snapshots" ON public.readiness_snapshots;
CREATE POLICY "Users can manage own readiness snapshots" ON public.readiness_snapshots
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Admin read-only policy for cohort readiness trend evaluation
DROP POLICY IF EXISTS "Admins can view readiness snapshots" ON public.readiness_snapshots;
CREATE POLICY "Admins can view readiness snapshots" ON public.readiness_snapshots
    FOR SELECT USING (public.is_admin(auth.uid()));

-- ==============================================================================
-- SECTION 3: PRIVILEGE ESCALATION PREVENTION (PROFILES ROLE GUARD)
-- Prevent non-admin users from escalating their role to 'admin' via standard profile updates.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS TRIGGER AS $$
BEGIN
  -- If the role is being altered, ensure the caller possesses administrator privileges
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF NOT public.is_admin(auth.uid()) THEN
      RAISE EXCEPTION 'Unauthorized: Only placement administrators can modify user roles';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_protect_profile_role ON public.profiles;
CREATE TRIGGER trg_protect_profile_role
  BEFORE UPDATE OF role ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_role();

-- ==============================================================================
-- SECTION 4: HIGH-IMPACT VERIFIED PERFORMANCE INDEXES
-- Index frequently sorted/filtered foreign keys and chronological query paths.
-- ==============================================================================

-- 1. Assessment attempts chronological query index (used in readiness & gap calculations)
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_user_created 
  ON public.assessment_attempts(user_id, created_at DESC);

-- 2. Resumes chronological query index (used in ATS analysis & latest resume retrieval)
CREATE INDEX IF NOT EXISTS idx_resumes_user_created 
  ON public.resumes(user_id, created_at DESC);

-- 3. Certificates candidate foreign key index (used in profile credentials & cascade operations)
CREATE INDEX IF NOT EXISTS idx_certificates_user_id 
  ON public.certificates(user_id);

-- 4. Course progress course foreign key index (used in cohort progress rollups & cascade operations)
CREATE INDEX IF NOT EXISTS idx_course_progress_course_id 
  ON public.course_progress(course_id);

-- 5. User skills skill foreign key index (used in drive skill filtering & admin skill deficit audits)
CREATE INDEX IF NOT EXISTS idx_user_skills_skill_id 
  ON public.user_skills(skill_id);

-- ==============================================================================
-- SECTION 5: SCORE INTEGRITY CHECK CONSTRAINTS
-- Enforce 0-100 boundary constraints with safe NULL handling on all score columns.
-- ==============================================================================

DO $$
BEGIN
  -- A. public.mock_interviews score constraints
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_mock_interviews_communication_score') THEN
    ALTER TABLE public.mock_interviews ADD CONSTRAINT chk_mock_interviews_communication_score 
      CHECK (communication_score IS NULL OR (communication_score >= 0 AND communication_score <= 100));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_mock_interviews_relevance_score') THEN
    ALTER TABLE public.mock_interviews ADD CONSTRAINT chk_mock_interviews_relevance_score 
      CHECK (relevance_score IS NULL OR (relevance_score >= 0 AND relevance_score <= 100));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_mock_interviews_confidence_score') THEN
    ALTER TABLE public.mock_interviews ADD CONSTRAINT chk_mock_interviews_confidence_score 
      CHECK (confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 100));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_mock_interviews_technical_score') THEN
    ALTER TABLE public.mock_interviews ADD CONSTRAINT chk_mock_interviews_technical_score 
      CHECK (technical_score IS NULL OR (technical_score >= 0 AND technical_score <= 100));
  END IF;

  -- B. public.resumes score constraints
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_resumes_relevance_score') THEN
    ALTER TABLE public.resumes ADD CONSTRAINT chk_resumes_relevance_score 
      CHECK (relevance_score IS NULL OR (relevance_score >= 0 AND relevance_score <= 100));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_resumes_formatting_score') THEN
    ALTER TABLE public.resumes ADD CONSTRAINT chk_resumes_formatting_score 
      CHECK (formatting_score IS NULL OR (formatting_score >= 0 AND formatting_score <= 100));
  END IF;

  -- C. public.readiness_snapshots score constraint
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_readiness_snapshots_readiness_score') THEN
    ALTER TABLE public.readiness_snapshots ADD CONSTRAINT chk_readiness_snapshots_readiness_score 
      CHECK (readiness_score IS NULL OR (readiness_score >= 0 AND readiness_score <= 100));
  END IF;
END $$;

-- ==============================================================================
-- SECTION 6: SUPABASE STORAGE BUCKET & RLS POLICIES FOR RESUMES
-- Create private 'resumes' bucket and enforce user-folder isolation.
-- ==============================================================================

-- 1. Ensure private resumes bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Authenticated user upload to user-scoped folder: <user_id>/...
DROP POLICY IF EXISTS "Users can upload own resumes to storage" ON storage.objects;
CREATE POLICY "Users can upload own resumes to storage"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'resumes'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Authenticated user and admin read access
DROP POLICY IF EXISTS "Users can view own resumes from storage" ON storage.objects;
CREATE POLICY "Users can view own resumes from storage"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'resumes'
    AND auth.role() = 'authenticated'
    AND (
        (storage.foldername(name))[1] = auth.uid()::text
        OR public.is_admin(auth.uid())
    )
);

-- 4. Authenticated user update access within user-scoped folder
DROP POLICY IF EXISTS "Users can update own resumes in storage" ON storage.objects;
CREATE POLICY "Users can update own resumes in storage"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'resumes'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 5. Authenticated user delete access within user-scoped folder
DROP POLICY IF EXISTS "Users can delete own resumes in storage" ON storage.objects;
CREATE POLICY "Users can delete own resumes in storage"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'resumes'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);
