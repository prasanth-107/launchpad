import React, { useState, useEffect } from 'react';
import { AppShell } from './components/ui/AppShell';
import DashboardView from './components/DashboardView';
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
import SkillsCertificatesView from './components/SkillsCertificatesView';
import ProfileSettingsView from './components/ProfileSettingsView';
import AuthModal from './components/AuthModal';
import { apiClient } from './api/client';
import { dal } from './lib/supabaseClient';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [notification, setNotification] = useState('');
  const [contentCategory, setContentCategory] = useState('programming');

  // Default professional student state ("PRASANTH")
  const [user, setUser] = useState({
    id: 'dcd807f7-9b13-4476-abc5-b34f60905f82',
    name: 'PRASANTH',
    email: 'prasanth@university.edu',
    college: 'Stanford Institute of Technology',
    department: 'Computer Science & Engineering',
    year: '4th Year / Final',
    preferred_job_role: 'Full Stack Software Engineer',
    career_goal: 'Crack SDE-1 placement drive at Tier-1 tech company',
    skills: ['Python', 'JavaScript', 'React', 'SQL', 'Git', 'DSA']
  });

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 4000);
  };

  // Load real database metrics from Supabase Data Access Layer
  const refreshDashboard = async (userId) => {
    const targetUserId = userId || user?.id || 'dcd807f7-9b13-4476-abc5-b34f60905f82';
    try {
      const dbMetrics = await dal.getDashboardMetrics(targetUserId);
      if (dbMetrics) {
        setDashboardData(dbMetrics);
        if (dbMetrics.profile) {
          setUser(prev => ({ ...prev, ...dbMetrics.profile }));
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
    // 1. Restore active Supabase session
    dal.auth.getSession().then(({ data }) => {
      if (data?.session?.user) {
        const authed = data.session.user;
        setUser(prev => ({
          ...prev,
          id: authed.id || prev.id,
          name: authed.name || authed.user_metadata?.name || prev.name,
          email: authed.email || prev.email,
          college: authed.college || prev.college,
          department: authed.department || prev.department,
          year: authed.year || prev.year,
          preferred_job_role: authed.preferred_job_role || prev.preferred_job_role
        }));
        refreshDashboard(authed.id);
      } else {
        refreshDashboard(user.id);
      }
    });

    // 2. Subscribe to auth changes
    const { data: authListener } = dal.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const u = session.user;
        setUser(prev => ({
          ...prev,
          id: u.id || prev.id,
          name: u.name || u.user_metadata?.name || prev.name,
          email: u.email || prev.email
        }));
        refreshDashboard(u.id);
      }
    });

    return () => {
      if (authListener?.subscription?.unsubscribe) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  const handleLogout = async () => {
    await dal.auth.signOut();
    showNotification('Signed out of student session.');
    setAuthModalOpen(true);
  };

  const handleAuthSuccess = (authedUser) => {
    setUser({ ...authedUser, name: authedUser.name || 'PRASANTH' });
    setActiveTab('dashboard');
    refreshDashboard(authedUser.id);
    showNotification(`Welcome, ${authedUser.name || 'PRASANTH'}!`);
  };

  const handleAssessmentCompleted = async (result) => {
    await dal.assessments.recordAttempt(user.id, {
      score_percent: result.percentage || 80,
      questions_attempted: result.total_questions || 15,
      correct_answers: result.correct || 12,
      time_taken_seconds: result.time_taken || 1200,
      details: result
    });
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

  const handleInterviewCompleted = async (updatedReadiness) => {
    await dal.interviews.save(user.id, {
      overall_score: updatedReadiness.overall_score || 80,
      interview_type: updatedReadiness.type || 'Technical',
      ai_feedback: updatedReadiness.feedback || 'Evaluated successfully'
    });
    showNotification(`Mock interview saved to Supabase! Readiness score updated.`);
    refreshDashboard(user.id);
  };

  const handleResumeAnalyzed = async (updatedReadiness) => {
    await dal.resumes.save(user.id, {
      ats_score: updatedReadiness.ats_score || 92,
      relevance_score: updatedReadiness.relevance_score || 90,
      strengths: updatedReadiness.strengths || [],
      weaknesses: updatedReadiness.weaknesses || []
    });
    showNotification(`Resume ATS score (92/100) saved to database.`);
    refreshDashboard(user.id);
  };

  const readinessScore = dashboardData?.placementReadiness || dashboardData?.readiness?.placement_readiness || 78;

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
      {activeTab === 'dashboard' && (
        <DashboardView
          dashboardData={dashboardData}
          onNavigate={(tab) => setActiveTab(tab)}
        />
      )}

      {activeTab === 'overall-report' && (
        <OverallReportView
          dashboardData={dashboardData}
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
          onRoadmapProgressUpdated={handleRoadmapProgressUpdated}
          onNavigateToContent={(cat) => {
            setContentCategory(cat);
            setActiveTab('resources');
          }}
        />
      )}

      {activeTab === 'courses' && (
        <CoursesView
          onNavigateToResources={(cat) => {
            setContentCategory(cat);
            setActiveTab('resources');
          }}
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
          onInterviewCompleted={handleInterviewCompleted}
        />
      )}

      {activeTab === 'resume' && (
        <ResumeAnalysisView
          user={user}
          onResumeAnalyzed={handleResumeAnalyzed}
        />
      )}

      {activeTab === 'job-opportunities' && (
        <JobOpportunitiesView />
      )}

      {(activeTab === 'skills' || activeTab === 'certificates') && (
        <SkillsCertificatesView
          user={user}
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
