-- ==============================================================================
-- MODERN PLACEMENT LAUNCHPAD - SUPABASE POSTGRESQL DATABASE SCHEMA & MIGRATIONS
-- Version: 1.0.0
-- Description: Complete schema with 14 entities, triggers, RLS policies, and seed data.
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 2. USER PROFILES TABLE (Entity 4)
-- Links directly to auth.users. Each student has exactly one profile.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    college TEXT DEFAULT 'Stanford Institute of Technology',
    department TEXT DEFAULT 'Computer Science & Engineering',
    year TEXT DEFAULT '4th Year / Final',
    preferred_job_role TEXT DEFAULT 'Full Stack Software Engineer',
    career_goal TEXT DEFAULT 'Crack SDE-1 placement drive at Tier-1 tech company',
    avatar_url TEXT,
    phone TEXT,
    github_url TEXT DEFAULT 'https://github.com/prasanth-dev',
    linkedin_url TEXT DEFAULT 'https://linkedin.com/in/prasanth-placement',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 3. COURSES TABLE (Entity 5)
-- Curated catalog of campus preparation courses.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    instructor TEXT NOT NULL,
    description TEXT,
    duration_hours INT NOT NULL DEFAULT 10,
    modules_count INT NOT NULL DEFAULT 6,
    level TEXT NOT NULL DEFAULT 'Intermediate',
    thumbnail_url TEXT,
    video_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 4. COURSE PROGRESS TABLE (Entity 6)
-- Tracks individual student completion and progress across enrolled courses.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.course_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    progress_percent INT NOT NULL DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
    completed_modules INT NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('enrolled', 'in_progress', 'completed')),
    last_accessed TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_user_course UNIQUE (user_id, course_id)
);

-- ==============================================================================
-- 5. ASSESSMENTS TABLE (Entity 7)
-- Canonical technical and aptitude tests for campus drives.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    duration_mins INT NOT NULL DEFAULT 30,
    total_questions INT NOT NULL DEFAULT 15,
    difficulty TEXT NOT NULL DEFAULT 'Medium' CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
    passing_percent INT NOT NULL DEFAULT 70,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 6. ASSESSMENT ATTEMPTS TABLE (Entity 8)
-- Historical test submissions, scores, timer metrics, and answer breakdown.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.assessment_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
    score_percent INT NOT NULL CHECK (score_percent >= 0 AND score_percent <= 100),
    passed BOOLEAN NOT NULL DEFAULT false,
    questions_attempted INT NOT NULL DEFAULT 0,
    correct_answers INT NOT NULL DEFAULT 0,
    time_taken_seconds INT NOT NULL DEFAULT 0,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 7. SKILLS REGISTRY (Entity 9)
-- Industry standard skills benchmarked for campus placements.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 8. USER SKILLS TABLE (Entity 10)
-- Student mastered skills, verified proficiency %, and gap analysis.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.user_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
    proficiency_percent INT NOT NULL DEFAULT 0 CHECK (proficiency_percent >= 0 AND proficiency_percent <= 100),
    status TEXT NOT NULL DEFAULT 'learning' CHECK (status IN ('learning', 'proficient', 'mastered')),
    verified BOOLEAN NOT NULL DEFAULT false,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_user_skill UNIQUE (user_id, skill_id)
);

-- ==============================================================================
-- 9. RESUMES & ATS AUDIT (Entity 11)
-- Stores uploaded resume texts, ATS score (92/100), keyword match, and Google X-Y-Z advice.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.resumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL DEFAULT 'prasanth_resume.pdf',
    ats_score INT NOT NULL CHECK (ats_score >= 0 AND ats_score <= 100),
    relevance_score INT NOT NULL DEFAULT 85,
    formatting_score INT NOT NULL DEFAULT 90,
    strengths JSONB NOT NULL DEFAULT '[]'::jsonb,
    weaknesses JSONB NOT NULL DEFAULT '[]'::jsonb,
    extracted_keywords JSONB NOT NULL DEFAULT '[]'::jsonb,
    missing_keywords JSONB NOT NULL DEFAULT '[]'::jsonb,
    recommendations JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 10. MOCK INTERVIEWS TABLE (Entity 12)
-- Speech-to-text transcripts, AI evaluation rubrics, and dynamic follow-ups.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.mock_interviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    interview_type TEXT NOT NULL DEFAULT 'Technical',
    target_role TEXT NOT NULL DEFAULT 'Full Stack Software Engineer',
    overall_score INT NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
    communication_score INT NOT NULL DEFAULT 75,
    relevance_score INT NOT NULL DEFAULT 80,
    confidence_score INT NOT NULL DEFAULT 70,
    technical_score INT NOT NULL DEFAULT 78,
    transcript JSONB NOT NULL DEFAULT '[]'::jsonb,
    ai_feedback TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 11. LEARNING PATHS & ROADMAPS (Entity 13)
-- Linear canonical 8-step placement preparation roadmap.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.learning_paths (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    step_number INT NOT NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    target_hours INT NOT NULL DEFAULT 10,
    completed BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_user_step UNIQUE (user_id, step_number)
);

-- ==============================================================================
-- 12. CERTIFICATES & CREDENTIALS (Entity 14)
-- Verified placement readiness credentials and course certificates.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    issuer TEXT NOT NULL DEFAULT 'Modern Placement Launchpad',
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    credential_id TEXT NOT NULL UNIQUE,
    verification_url TEXT,
    grade TEXT DEFAULT 'A+',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 13. AUTOMATIC PROFILE CREATION TRIGGER
-- Triggers on auth.users after insert to provision a corresponding public.profiles entry.
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, name, email, college, department, year, preferred_job_role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'college', 'Stanford Institute of Technology'),
        COALESCE(NEW.raw_user_meta_data->>'department', 'Computer Science & Engineering'),
        COALESCE(NEW.raw_user_meta_data->>'year', '4th Year / Final'),
        COALESCE(NEW.raw_user_meta_data->>'preferred_job_role', 'Full Stack Software Engineer')
    )
    ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        email = EXCLUDED.email;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 14. ROW LEVEL SECURITY (RLS) POLICIES
-- Strict user-scoped isolation for all sensitive data.
-- ==============================================================================

-- A. Reference Catalogs: Public Read Access
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view courses" ON public.courses;
CREATE POLICY "Public can view courses" ON public.courses FOR SELECT USING (true);

ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view assessments" ON public.assessments;
CREATE POLICY "Public can view assessments" ON public.assessments FOR SELECT USING (true);

ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view skills" ON public.skills;
CREATE POLICY "Public can view skills" ON public.skills FOR SELECT USING (true);

-- B. User-Specific Tables: Strictly Scoped to Authenticated User (auth.uid())
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can access own profile" ON public.profiles;
CREATE POLICY "Users can access own profile" ON public.profiles
    FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

ALTER TABLE public.course_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can access own course progress" ON public.course_progress;
CREATE POLICY "Users can access own course progress" ON public.course_progress
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.assessment_attempts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can access own assessment attempts" ON public.assessment_attempts;
CREATE POLICY "Users can access own assessment attempts" ON public.assessment_attempts
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can access own user skills" ON public.user_skills;
CREATE POLICY "Users can access own user skills" ON public.user_skills
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can access own resumes" ON public.resumes;
CREATE POLICY "Users can access own resumes" ON public.resumes
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.mock_interviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can access own mock interviews" ON public.mock_interviews;
CREATE POLICY "Users can access own mock interviews" ON public.mock_interviews
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.learning_paths ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can access own learning paths" ON public.learning_paths;
CREATE POLICY "Users can access own learning paths" ON public.learning_paths
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can access own certificates" ON public.certificates;
CREATE POLICY "Users can access own certificates" ON public.certificates
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ==============================================================================
-- 15. SEED DATA FOR COURSES, ASSESSMENTS, SKILLS
-- ==============================================================================

-- Seed Skills
INSERT INTO public.skills (name, category, description) VALUES
('Python', 'Programming', 'Core syntax, OOP, libraries, problem solving'),
('JavaScript', 'Programming', 'ES6+, DOM, asynchronous promises, closures'),
('React.js', 'Web Development', 'Hooks, state architecture, virtual DOM, components'),
('SQL', 'Database', 'Relational design, JOINs, subqueries, indexing'),
('Data Structures', 'Core CS', 'Arrays, Linked Lists, Trees, Heaps, Hash Tables'),
('Algorithms', 'Core CS', 'Dynamic Programming, Binary Search, Graphs, Greedy'),
('System Design', 'Architecture', 'Scalability, caching, load balancing, microservices'),
('Aptitude', 'Problem Solving', 'Quantitative problem solving and logical puzzles'),
('Communication', 'Soft Skills', 'Presentation, active listening, executive communication')
ON CONFLICT (name) DO NOTHING;

-- Seed Courses
INSERT INTO public.courses (title, category, instructor, duration_hours, modules_count, level, description) VALUES
('Full Stack Web Architecture with React & FastAPI', 'Web Development', 'Sarah Connor, Lead Architect', 24, 8, 'Intermediate', 'Build enterprise scalable full-stack applications with modern React patterns and FastAPI.'),
('Campus DSA Masterclass (Java & C++)', 'Data Structures', 'Dr. Arvind Sharma', 40, 12, 'Advanced', 'Comprehensive 450 campus interview problem sheet covering DP, Trees, and Graph algorithms.'),
('System Design for University Graduates', 'System Design', 'Alex Rivera, Ex-FAANG SDE', 18, 6, 'Intermediate', 'Master microservices, distributed caching, database sharding, and interview frameworks.'),
('Quantitative Aptitude & Logical Reasoning for Campus Drives', 'Aptitude', 'Meera Kapoor', 15, 5, 'Beginner', 'Speed math techniques, permutation, combination, probability, and logical deduction.')
ON CONFLICT DO NOTHING;

-- Seed Assessments
INSERT INTO public.assessments (title, category, duration_mins, total_questions, difficulty, passing_percent, description) VALUES
('Data Structures & Algorithms Diagnostic', 'Data Structures', 45, 15, 'Hard', 75, 'Evaluate dynamic programming, graph traversal, and binary tree questions.'),
('Modern JavaScript & React Ecosystem', 'Web Development', 30, 15, 'Medium', 70, 'Closures, Event Loop, Promises, React Hooks, and component rendering cycles.'),
('SQL Queries & Relational Normalization', 'Database', 30, 12, 'Medium', 75, 'Complex multi-table JOINs, subqueries, grouping, and indexing optimizations.'),
('Campus Quantitative Aptitude Screening', 'Aptitude', 35, 20, 'Medium', 70, 'Speed math, time & distance, work equations, and data interpretation.')
ON CONFLICT DO NOTHING;
