// ==============================================================================
// PHASE 20: DEMO MODE & EVALUATOR EXPERIENCE MANAGER
// Modern Placement Launchpad - Isolated Evaluator Personas & First-Time Onboarding
// ==============================================================================

export const DEMO_PERSONAS = {
  ACTIVE_CANDIDATE: {
    id: 'dcd807f7-9b13-4476-abc5-b34f60905f82',
    name: 'PRASANTH (Demo Candidate)',
    email: 'prasanth.demo@university.edu',
    college: 'Stanford Institute of Technology',
    department: 'Computer Science & Engineering',
    year: '4th Year / Final',
    preferred_job_role: 'Full Stack Software Engineer',
    career_goal: 'Crack SDE-1 placement drive at Tier-1 tech company',
    role: 'candidate',
    is_demo: true,
    skills: ['Python', 'JavaScript', 'React', 'SQL', 'Git', 'DSA']
  },

  ADMIN_COORDINATOR: {
    id: 'admin-evaluator-demo-2026',
    name: 'Dr. K. Ramanathan (Placement Officer)',
    email: 'placement.officer@university.edu',
    college: 'Stanford Institute of Technology',
    department: 'Placement & Corporate Relations',
    year: 'Administration',
    preferred_job_role: 'Placement Coordinator',
    career_goal: 'Maximize institutional placement readiness and corporate engagement',
    role: 'admin',
    is_demo: true,
    skills: []
  },

  FIRST_TIME_CANDIDATE: {
    id: 'new-student-first-time-2026',
    name: 'Aarav Sharma (First-Time User)',
    email: 'aarav.sharma@university.edu',
    college: 'Stanford Institute of Technology',
    department: 'Computer Science & Engineering',
    year: '3rd Year',
    preferred_job_role: 'Software Development Engineer',
    career_goal: 'Begin placement preparation from scratch',
    role: 'candidate',
    is_demo: true,
    skills: []
  }
};

/**
 * 10-Step First-Time User Onboarding Roadmap Checklist
 */
export const FIRST_TIME_ONBOARDING_STEPS = [
  { step: 1, title: 'Complete Profile', target: 'profile', desc: 'Set target role and career aspirations', icon: 'User' },
  { step: 2, title: 'Take Diagnostic Assessment', target: 'assessments', desc: 'Test technical baseline in DSA or Web Dev', icon: 'CheckSquare' },
  { step: 3, title: 'Review Skill Gaps', target: 'skill-gap', desc: 'Discover critical skill deficits below 80% benchmark', icon: 'Target' },
  { step: 4, title: 'Check Placement Readiness', target: 'placement-readiness', desc: 'Inspect your 0–100 Placement Readiness Index', icon: 'Sparkles' },
  { step: 5, title: 'Build Personalized Roadmap', target: 'roadmap', desc: 'Follow structured sequential milestones', icon: 'Compass' },
  { step: 6, title: 'Upload & Verify Resume', target: 'resume', desc: 'Get ATS score & keyword match breakdown', icon: 'FileText' },
  { step: 7, title: 'Practice AI Mock Interview', target: 'interview', desc: 'Conduct technical or STAR behavioral simulations', icon: 'Mic2' },
  { step: 8, title: 'Explore Campus Drives', target: 'job-opportunities', desc: 'Check eligibility for active company drives', icon: 'Briefcase' },
  { step: 9, title: 'Track Application Pipeline', target: 'applications', desc: 'Monitor interview rounds and offers', icon: 'Layers' },
  { step: 10, title: 'Execute Daily Preparation', target: 'preparation', desc: 'Follow daily prioritized workspace tasks', icon: 'CalendarCheck' }
];

/**
 * Checks if current user is an evaluator demo account
 */
export function isDemoSession(user) {
  return Boolean(user?.is_demo || user?.id === DEMO_PERSONAS.ACTIVE_CANDIDATE.id || user?.id === DEMO_PERSONAS.ADMIN_COORDINATOR.id || user?.id === DEMO_PERSONAS.FIRST_TIME_CANDIDATE.id);
}

/**
 * Safely switches evaluator persona without affecting database state
 */
export function getPersonaById(personaKey) {
  switch (personaKey) {
    case 'admin':
      return DEMO_PERSONAS.ADMIN_COORDINATOR;
    case 'new_student':
      return DEMO_PERSONAS.FIRST_TIME_CANDIDATE;
    case 'candidate':
    default:
      return DEMO_PERSONAS.ACTIVE_CANDIDATE;
  }
}
