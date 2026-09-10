import React, { useState, useEffect } from 'react';
import { AppShell } from './components/ui/AppShell';
import DashboardView from './components/DashboardView';
import PreparationWorkspaceView from './components/PreparationWorkspaceView';
import AdaptivePracticeView from './components/AdaptivePracticeView';
import AnalyticsView from './components/AnalyticsView';
import OverallReportView from './components/OverallReportView';
import PlacementReadinessView from './components/PlacementReadinessView';
import RoadmapView from './components/RoadmapView';
import CoursesView from './components/CoursesView';
import AssessmentView from './components/AssessmentView';
import DsaSheetsView from './components/DsaSheetsView';
import LearningResourcesView from './components/LearningResourcesView';
import MockInterviewView from './components/MockInterviewView';
import ResumeAnalysisView from './components/ResumeAnalysisView';
import JobOpportunitiesView from './components/JobOpportunitiesView';
import ApplicationTrackingView from './components/ApplicationTrackingView';
import SkillsCertificatesView from './components/SkillsCertificatesView';
import ProfileSettingsView from './components/ProfileSettingsView';
import { CareerCoachView } from './components/CareerCoachView';
import AuthView from './components/AuthView';
import AuthModal from './components/AuthModal';
import { apiClient } from './api/client';
import { dal } from './lib/supabaseClient';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [practiceOpportunity, setPracticeOpportunity] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [notification, setNotification] = useState('');
  const [contentCategory, setContentCategory] = useState('programming');
  const [authLoading, setAuthLoading] = useState(true);

  // Authenticated user state (null when unauthenticated)
  const [user, setUser] = useState(null);

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 4000);
  };

  const handleNavigate = (tab, options = {}) => {
    if (options?.practiceOpportunity) {
      setPracticeOpportunity(options.practiceOpportunity);
    } else if (tab !== 'adaptive-practice' && tab !== 'practice') {
      setPracticeOpportunity(null);
    }
    setActiveTab(tab);
  };

  // Load real database metrics from Supabase Data Access Layer
  const refreshDashboard = async (userId) => {
    const targetUserId = userId || user?.id || 'dcd807f7-9b13-4476-abc5-b34f60905f82';
    try {
      const dbMetrics = await dal.getDashboardMetrics(targetUserId);
      if (dbMetrics) {
        setDashboardData(dbMetrics);
        if (dbMetrics.profile) {
          setUser(prev => prev ? ({ ...prev, ...dbMetrics.profile }) : prev);
        }
      }
    } catch (err) {
      console.warn('Using companion backend fallback for dashboard:', err);
      try {
        const backendData = await apiClient.getDashboard(targetUserId);
        setDashboardData(backendData);
      } catch (backendErr) {
        console.warn('Backend query note:', backendErr);
      }
    }
  };

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        // 1. Check for active Supabase Auth session
        const { data: sessionData } = await dal.auth.getSession();
        const activeSupabaseUser = sessionData?.session?.user;

        if (activeSupabaseUser) {
          const profile = await dal.profiles.get(activeSupabaseUser.id);
          const resolvedUser = {
            id: activeSupabaseUser.id,
            email: activeSupabaseUser.email,
            name: profile?.name || activeSupabaseUser.user_metadata?.name || 'PRASANTH',
            college: profile?.college || 'Stanford Institute of Technology',
            department: profile?.department || 'Computer Science & Engineering',
            year: profile?.year || '4th Year / Final',
            preferred_job_role: profile?.preferred_job_role || 'Full Stack Software Engineer',
            career_goal: profile?.career_goal || 'Crack SDE-1 placement drive at Tier-1 tech company',
            skills: profile?.skills || ['Python', 'JavaScript', 'React', 'SQL', 'Git', 'DSA']
          };
          if (isMounted) {
            setUser(resolvedUser);
            localStorage.setItem('mpl_current_user', JSON.stringify(resolvedUser));
            refreshDashboard(resolvedUser.id);
          }
        } else {
          // 2. Check for locally remembered session (e.g., from evaluator demo)
          const storedUserStr = localStorage.getItem('mpl_current_user');
          if (storedUserStr) {
            try {
              const parsed = JSON.parse(storedUserStr);
              if (parsed?.id && isMounted) {
                setUser(parsed);
                refreshDashboard(parsed.id);
              }
            } catch (e) {
              localStorage.removeItem('mpl_current_user');
            }
          }
        }
      } catch (err) {
        console.warn('Auth session resolution note:', err);
      } finally {
        if (isMounted) {
          setAuthLoading(false);
        }
      }
    };

    initAuth();

    // 3. Subscribe to real-time auth events
    const { data: authListener } = dal.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const u = session.user;
        const profile = await dal.profiles.get(u.id);
        const resolvedUser = {
          id: u.id,
          email: u.email,
          name: profile?.name || u.user_metadata?.name || 'PRASANTH',
          college: profile?.college || 'Stanford Institute of Technology',
          department: profile?.department || 'Computer Science & Engineering',
          year: profile?.year || '4th Year / Final',
          preferred_job_role: profile?.preferred_job_role || 'Full Stack Software Engineer',
          career_goal: profile?.career_goal || 'Crack SDE-1 placement drive at Tier-1 tech company',
          skills: profile?.skills || ['Python', 'JavaScript', 'React', 'SQL', 'Git', 'DSA']
        };
        if (isMounted) {
          setUser(resolvedUser);
          localStorage.setItem('mpl_current_user', JSON.stringify(resolvedUser));
          refreshDashboard(u.id);
        }
      } else if (event === 'SIGNED_OUT') {
        if (isMounted) {
          setUser(null);
          localStorage.removeItem('mpl_current_user');
          setDashboardData(null);
        }
      }
    });

    return () => {
      isMounted = false;
      if (authListener?.subscription?.unsubscribe) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  const handleLogout = async () => {
    try {
      await dal.auth.signOut();
    } catch (e) {
      console.warn('Sign out notice:', e);
    }
    localStorage.removeItem('mpl_current_user');
    setUser(null);
    setDashboardData(null);
    showNotification('Signed out of student session.');
  };

  const handleAuthSuccess = (authedUser) => {
    const cleanUser = {
      id: authedUser.id || 'dcd807f7-9b13-4476-abc5-b34f60905f82',
      name: authedUser.name || authedUser.user_metadata?.name || 'PRASANTH',
      email: authedUser.email || 'prasanth@university.edu',
      college: authedUser.college || 'Stanford Institute of Technology',
      department: authedUser.department || 'Computer Science & Engineering',
      year: authedUser.year || '4th Year / Final',
      preferred_job_role: authedUser.preferred_job_role || 'Full Stack Software Engineer',
      career_goal: authedUser.career_goal || 'Crack SDE-1 placement drive at Tier-1 tech company',
      skills: authedUser.skills || ['Python', 'JavaScript', 'React', 'SQL', 'Git', 'DSA']
    };
    setUser(cleanUser);
    localStorage.setItem('mpl_current_user', JSON.stringify(cleanUser));
    setActiveTab('dashboard');
    refreshDashboard(cleanUser.id);
    showNotification(`Welcome, ${cleanUser.name}!`);
  };

  const handleAssessmentCompleted = async (result) => {
    if (!result?._alreadySaved) {
      await dal.assessments.recordAttempt(user.id, {
        assessment_id: result.assessment_id,
        assessment_title: result.assessment_title || result.category,
        category: result.category,
        score_percent: Number(result.percentage) || 0,
        passed: result.passed !== undefined ? result.passed : (Number(result.percentage) >= 70),
        questions_attempted: Number(result.total || result.total_questions) || 0,
        correct_answers: Number(result.correct) || 0,
        time_taken_seconds: Number(result.time_spent_seconds || result.time_taken) || 0,
        details: result
      });
    }
    showNotification(`Assessment saved to database! Score: ${result.percentage}%. Placement Readiness updated.`);
    refreshDashboard(user.id);
  };

  const handleRoadmapProgressUpdated = async (updatedReadiness) => {
    if (updatedReadiness.node_id) {
      await dal.learningPaths.toggleStep(user.id, updatedReadiness.node_id);
    }
    showNotification(`Milestone updated in Supabase! Placement Readiness: ${updatedReadiness.placement_readiness || 78}%.`);
    refreshDashboard(user.id);
  };

  const handleInterviewCompleted = async (sessionData) => {
    if (sessionData && !sessionData._alreadySaved && user?.id) {
      await dal.interviews.save(user.id, sessionData);
    }
    const score = sessionData?.overall_score ?? sessionData?.overallScore;
    const scoreText = score !== undefined && score !== null ? ` Score: ${score}/100.` : '';
    showNotification(`Mock interview saved to Supabase!${scoreText} Placement Readiness updated.`);
    if (user?.id) {
      refreshDashboard(user.id);
    }
  };

  const handleResumeAnalyzed = async (resumeData) => {
    const score = resumeData?.atsScore ?? resumeData?.ats_score ?? null;
    if (score !== null && score !== undefined) {
      showNotification(`Resume ATS analyzed: ${score}/100. Placement Readiness updated.`);
    } else {
      showNotification('Resume analysis updated.');
    }
    refreshDashboard(user.id);
  };

  const readinessScore = dashboardData?.placementReadiness ?? dashboardData?.readiness?.placement_readiness ?? null;

  // 1. Session Verification Loading State (Prevents flash of protected content)
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center font-sans antialiased text-slate-800">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md animate-pulse mb-4">
          <span className="font-black text-xl">MP</span>
        </div>
        <p className="text-sm font-semibold text-slate-700">Verifying Placement Portal Session...</p>
        <p className="text-xs text-slate-400 mt-1">Connecting to Supabase PostgreSQL & Auth</p>
      </div>
    );
  }

  // 2. Unauthenticated State: Render SaaS Full-Page Authentication View
  if (!user) {
    return <AuthView onAuthSuccess={handleAuthSuccess} />;
  }

  // 3. Authenticated State: Render SaaS AppShell & Modules
  return (
    <AppShell
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      user={user}
      onLogout={handleLogout}
      readinessScore={readinessScore}
    >
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg border border-slate-700 text-xs font-semibold flex items-center gap-2 transition-all">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* View Routing */}
      {(activeTab === 'adaptive-practice' || activeTab === 'practice') && (
        <AdaptivePracticeView
          user={user}
          onNavigate={handleNavigate}
          practiceOpportunity={practiceOpportunity}
        />
      )}

      {(activeTab === 'preparation' || activeTab === 'daily-plan') && (
        <PreparationWorkspaceView
          user={user}
          onNavigate={handleNavigate}
        />
      )}

      {activeTab === 'dashboard' && (
        <DashboardView
          dashboardData={dashboardData}
          onNavigate={(tab) => setActiveTab(tab)}
        />
      )}

      {(activeTab === 'career-coach' || activeTab === 'coach' || activeTab === 'placement-copilot' || activeTab === 'ai-career-coach') && (
        <CareerCoachView
          user={user}
          onNavigate={handleNavigate}
        />
      )}

      {(activeTab === 'analytics' || activeTab === 'overall-report' || activeTab === 'progress') && (
        <AnalyticsView
          user={user}
          onNavigate={handleNavigate}
        />
      )}

      {activeTab === 'placement-readiness' && (
        <PlacementReadinessView
          dashboardData={dashboardData}
          onNavigate={(tab) => setActiveTab(tab)}
        />
      )}

      {activeTab === 'roadmap' && (
        <RoadmapView
          user={user}
          dashboardData={dashboardData}
          onNavigate={(tab) => setActiveTab(tab)}
          onRoadmapProgressUpdated={() => refreshDashboard(user?.id)}
          onNavigateToContent={(cat) => {
            setContentCategory(cat);
            setActiveTab('resources');
          }}
        />
      )}

      {activeTab === 'courses' && (
        <CoursesView
          user={user}
          onNavigateToResources={(cat) => {
            setContentCategory(cat);
            setActiveTab('resources');
          }}
          onCourseProgressUpdated={() => refreshDashboard(user?.id)}
        />
      )}

      {activeTab === 'assessments' && (
        <AssessmentView
          user={user}
          onAssessmentCompleted={handleAssessmentCompleted}
        />
      )}

      {activeTab === 'dsa-sheets' && (
        <DsaSheetsView />
      )}

      {activeTab === 'resources' && (
        <LearningResourcesView
          initialCategory={contentCategory}
        />
      )}

      {(activeTab === 'interview' || activeTab === 'interview-history') && (
        <MockInterviewView
          user={user}
          initialTab={activeTab === 'interview-history' ? 'history' : 'simulate'}
          onInterviewCompleted={handleInterviewCompleted}
          onNavigate={handleNavigate}
        />
      )}

      {activeTab === 'resume' && (
        <ResumeAnalysisView
          user={user}
          onResumeAnalyzed={handleResumeAnalyzed}
          onNavigate={handleNavigate}
        />
      )}

      {activeTab === 'job-opportunities' && (
        <JobOpportunitiesView 
          user={user}
          onNavigate={handleNavigate}
        />
      )}

      {activeTab === 'applications' && (
        <ApplicationTrackingView 
          user={user}
          onNavigate={handleNavigate}
          onApplicationUpdated={() => refreshDashboard(user?.id)}
        />
      )}

      {(activeTab === 'skills' || activeTab === 'certificates' || activeTab === 'skill-gap') && (
        <SkillsCertificatesView
          user={user}
          initialTab={activeTab === 'certificates' ? 'certificates' : activeTab === 'skills' ? 'skills' : 'skill-gap'}
          onNavigate={(tab) => setActiveTab(tab)}
        />
      )}

      {activeTab === 'profile' && (
        <ProfileSettingsView
          user={user}
          onUpdateProfile={(updated) => {
            setUser(prev => ({ ...prev, ...updated }));
            showNotification('Profile updated successfully!');
          }}
          initialTab="profile"
        />
      )}

      {activeTab === 'settings' && (
        <ProfileSettingsView
          user={user}
          onUpdateProfile={(updated) => {
            setUser(prev => ({ ...prev, ...updated }));
            showNotification('Settings updated successfully!');
          }}
          initialTab="settings"
        />
      )}

      {/* Auth Modal for Login/Registration */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultTab="login"
        onAuthSuccess={handleAuthSuccess}
      />
    </AppShell>
  );
}
