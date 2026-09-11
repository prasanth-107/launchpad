-- ==============================================================================
-- PHASE 18 — PLACEMENT COMMAND CENTER & ADMIN ACCESS CONTROL SCHEMA
-- Migration: 20260911000007_admin_command_center_schema.sql
-- ==============================================================================

-- 1. Add Role column to public.profiles if not exists
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'candidate' 
CHECK (role IN ('candidate', 'admin'));

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- 2. Helper function to verify admin status safely in PostgreSQL
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Update RLS policies to allow authorized admins to read student cohorts
-- while ensuring candidates CANNOT read other students' private data.

-- Profiles: Admins can view all student profiles for cohort tracking
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (public.is_admin(auth.uid()));

-- Assessment Attempts: Admins can view cohort attempts
DROP POLICY IF EXISTS "Admins can view assessment attempts" ON public.assessment_attempts;
CREATE POLICY "Admins can view assessment attempts" ON public.assessment_attempts
    FOR SELECT USING (public.is_admin(auth.uid()));

-- User Skills: Admins can view cohort skills
DROP POLICY IF EXISTS "Admins can view user skills" ON public.user_skills;
CREATE POLICY "Admins can view user skills" ON public.user_skills
    FOR SELECT USING (public.is_admin(auth.uid()));

-- Resumes: Admins can view resume ATS scores
DROP POLICY IF EXISTS "Admins can view resumes" ON public.resumes;
CREATE POLICY "Admins can view resumes" ON public.resumes
    FOR SELECT USING (public.is_admin(auth.uid()));

-- Mock Interviews: Admins can view mock interview scores
DROP POLICY IF EXISTS "Admins can view mock interviews" ON public.mock_interviews;
CREATE POLICY "Admins can view mock interviews" ON public.mock_interviews
    FOR SELECT USING (public.is_admin(auth.uid()));

-- Applications: Admins can view applications for placement statistics
DROP POLICY IF EXISTS "Admins can view applications" ON public.applications;
CREATE POLICY "Admins can view applications" ON public.applications
    FOR SELECT USING (public.is_admin(auth.uid()));

-- Readiness Snapshots: Admins can view snapshots for readiness trend analysis
DROP POLICY IF EXISTS "Admins can view readiness snapshots" ON public.readiness_snapshots;
CREATE POLICY "Admins can view readiness snapshots" ON public.readiness_snapshots
    FOR SELECT USING (public.is_admin(auth.uid()));

COMMENT ON COLUMN public.profiles.role IS 'User authorization role: candidate (default) or admin (institution/placement coordinator)';
