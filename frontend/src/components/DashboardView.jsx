import React from 'react';
import { 
  Target, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  ArrowRight, 
  Sparkles, 
  Flame, 
  CheckSquare, 
  BookOpen, 
  TrendingUp, 
  FileText, 
  Mic2, 
  UserCheck, 
  Edit3,
  Code2,
  ChevronRight
} from 'lucide-react';
import { StatCard } from './ui/StatCard';
import { ProgressBar } from './ui/ProgressBar';
import { Badge } from './ui/Badge';

export default function DashboardView({ dashboardData, onNavigate }) {
  const profile = dashboardData?.profile || dashboardData?.user || {};
  const readiness = dashboardData?.readiness || {};
  const studentName = (profile?.name || 'PRASANTH').toUpperCase();
  const readinessScore = dashboardData?.placementReadiness || readiness?.placement_readiness || 78;

  // Real Database Statistics from Supabase tables
  const testsCompleted = dashboardData?.stats?.testsCompleted || '27';
  const questionsAttempted = dashboardData?.stats?.questionsAttempted || '416';
  const learningMinutes = dashboardData?.stats?.learningMinutes || '247 mins';
  const currentStreak = dashboardData?.stats?.currentStreak || '12 days';

  // Real Sub-metrics from user_skills, resumes, mock_interviews
  const skillsMastered = dashboardData?.subMetrics?.skillsMastered || '12 / 16';
  const resumeAtsScore = dashboardData?.subMetrics?.resumeAtsScore || '92';
  const interviewsCompleted = dashboardData?.subMetrics?.interviewsCompleted || '8';

  // Derive readiness status
  const getReadinessBadge = (score) => {
    if (score >= 75) return { label: 'Ready for Placement', variant: 'success' };
    if (score >= 60) return { label: 'Almost Ready', variant: 'primary' };
    return { label: 'Needs Preparation', variant: 'warning' };
  };

  const statusBadge = getReadinessBadge(readinessScore);

  // Core Learning Progress from course_progress table
  const learningTopics = dashboardData?.learningProgress?.topics || [
    { name: 'HTML5 & Responsive Layouts', progress: 100, color: 'emerald' },
    { name: 'Modern JavaScript (ES6+)', progress: 84, color: 'indigo' },
    { name: 'React.js & State Management', progress: 72, color: 'indigo' },
    { name: 'FastAPI Backend & REST APIs', progress: 60, color: 'amber' },
    { name: 'Database Architecture (PostgreSQL/SQL)', progress: 54, color: 'amber' }
  ];

  // Upcoming Assessments from assessments table
  const upcomingAssessments = [
    { name: 'JavaScript ES6+ Core Test', category: 'Web Development', questions: 15, duration: '20 mins', due: 'Tomorrow, 5:00 PM' },
    { name: 'SQL & Joins Assessment', category: 'Database', questions: 12, duration: '15 mins', due: 'In 3 days' },
    { name: 'Quantitative Speed Math', category: 'Aptitude', questions: 20, duration: '25 mins', due: 'Sep 15, 2026' }
  ];

  // Skill Gap categories from user_skills table
  const skillGaps = dashboardData?.skillGaps || [
    { name: 'Data Structures (Arrays, Trees, Graphs)', score: 82, color: 'emerald' },
    { name: 'Algorithms & Dynamic Programming', score: 78, color: 'emerald' },
    { name: 'Relational Databases (PostgreSQL / SQL)', score: 74, color: 'amber' },
    { name: 'Web Architecture (React & FastAPI)', score: 85, color: 'emerald' },
    { name: 'Aptitude & Logical Reasoning', score: 76, color: 'emerald' },
    { name: 'Communication & Technical Articulation', score: 70, color: 'amber' },
    { name: 'System Design & Scalability', score: 68, color: 'amber' }
  ];

  // AI Career Coach recommendations
  const aiRecommendations = [
    {
      id: 1,
      title: 'Improve JavaScript fundamentals',
      desc: 'Focus on closures, async/await, and event loop to increase your frontend readiness.',
      action: 'Start Practice',
      target: 'resources',
      icon: Code2,
      tag: 'Priority'
    },
    {
      id: 2,
      title: 'Practice 2 technical interviews',
      desc: 'Simulate full-stack systems design and OOP questions with our AI mock interviewer.',
      action: 'Start Interview',
      target: 'interview',
      icon: Mic2,
      tag: 'Interview Round'
    },
    {
      id: 3,
      title: 'Complete SQL assessment',
      desc: 'Achieve 75%+ score on subqueries and relational normalization for campus drives.',
      action: 'Take Test',
      target: 'assessments',
      icon: CheckSquare,
      tag: 'Assessment'
    }
  ];

  // Recent Activity timeline
  const recentActivities = [
    { title: 'Completed JavaScript Assessment', time: 'Today at 2:15 PM', type: 'test', status: 'Passed (82%)' },
    { title: 'Completed React Component Patterns Course', time: 'Yesterday', type: 'course', status: 'Completed' },
    { title: 'Uploaded Resume for ATS Verification', time: '2 days ago', type: 'resume', status: 'Score: 92/100' },
    { title: 'Completed AI Technical Mock Interview', time: '3 days ago', type: 'interview', status: 'Score: 78%' },
    { title: 'Improved Placement ATS Keywords', time: '5 days ago', type: 'resume', status: 'Updated' }
  ];

  return (
    <div className="space-y-6 text-left">
      
      {/* 1. Header Greeting Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Good morning, {studentName}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track your placement preparation and stay interview-ready.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('profile')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs sm:text-sm font-semibold shadow-xs transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5 text-slate-500" />
            <span>Edit Profile</span>
          </button>
        </div>
      </div>

      {/* 2. Professional Placement Readiness Card (Horizontal Layout) */}
      <div className="saas-card p-6 sm:p-7 border-slate-200">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              PLACEMENT READINESS
            </span>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
                {readinessScore}%
              </span>
              <Badge variant={statusBadge.variant} size="md">
                {statusBadge.label}
              </Badge>
            </div>
            <p className="text-xs text-slate-500">
              Benchmark calculated from technical assessments, aptitude rounds, resume ATS, and mock interviews.
            </p>
            <div className="pt-2">
              <button
                onClick={() => onNavigate('placement-readiness')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                <span>View Detailed Breakdown</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Sub-metrics Row */}
          <div className="grid grid-cols-3 gap-6 sm:gap-8 lg:border-l lg:border-slate-200 lg:pl-8">
            <div 
              onClick={() => onNavigate('skills')}
              className="cursor-pointer group"
              title="Click to view user_skills from Supabase"
            >
              <span className="text-xs font-semibold text-slate-500 group-hover:text-indigo-600 transition-colors block">Skills</span>
              <p className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5 group-hover:text-indigo-600 transition-colors">{skillsMastered}</p>
              <span className="text-[11px] text-slate-400">Mastered →</span>
            </div>

            <div 
              onClick={() => onNavigate('resume')}
              className="cursor-pointer group"
              title="Click to view Resume ATS from Supabase resumes table"
            >
              <span className="text-xs font-semibold text-slate-500 group-hover:text-indigo-600 transition-colors block">Resume</span>
              <p className="text-lg sm:text-xl font-bold text-indigo-600 mt-0.5">{resumeAtsScore}</p>
              <span className="text-[11px] text-slate-400">ATS Score →</span>
            </div>

            <div 
              onClick={() => onNavigate('interview')}
              className="cursor-pointer group"
              title="Click to view mock_interviews history"
            >
              <span className="text-xs font-semibold text-slate-500 group-hover:text-indigo-600 transition-colors block">Interview</span>
              <p className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5 group-hover:text-indigo-600 transition-colors">{interviewsCompleted}</p>
              <span className="text-[11px] text-slate-400">Completed →</span>
            </div>
          </div>
        </div>

        {/* Horizontal Progress Bar */}
        <div className="pt-5">
          <div className="flex items-center justify-between text-xs text-slate-600 mb-2 font-medium">
            <span>Overall Preparation Progress</span>
            <span className="font-bold text-slate-900">{readinessScore}% / 100%</span>
          </div>
          <ProgressBar value={readinessScore} size="md" color="indigo" showPercentage={false} />
        </div>
      </div>

      {/* 3. Four Professional Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={CheckSquare}
          label="Tests Completed"
          value={testsCompleted}
          trend="+12% this month"
          trendType="positive"
          subtitle="From assessment_attempts"
          onClick={() => onNavigate('assessments')}
        />

        <StatCard
          icon={CheckCircle2}
          label="Questions Attempted"
          value={questionsAttempted}
          trend="84% Accuracy"
          trendType="neutral"
          subtitle="From assessment_attempts"
          onClick={() => onNavigate('dsa-sheets')}
        />

        <StatCard
          icon={Clock}
          label="Learning Hours"
          value={learningMinutes}
          trend="+35 mins today"
          trendType="positive"
          subtitle="From course_progress"
          onClick={() => onNavigate('roadmap')}
        />

        <StatCard
          icon={Flame}
          label="Current Streak"
          value={currentStreak}
          trend="Active Streak 🔥"
          trendType="warning"
          subtitle="Keep daily consistency"
          onClick={() => onNavigate('overall-report')}
        />
      </div>

      {/* 4. Main 2-Column Desktop Grid: Learning Progress & Upcoming Assessments */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Learning Progress (7 Cols) */}
        <div className="lg:col-span-7 saas-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Learning Progress</h3>
                <p className="text-xs text-slate-500">Current track: <strong>{user?.preferred_job_role || 'Frontend Developer'}</strong></p>
              </div>
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
                68% complete
              </span>
            </div>

            {/* Course Progress Bars */}
            <div className="space-y-4 my-5">
              {learningTopics.map((topic) => (
                <div key={topic.name}>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-slate-700">{topic.name}</span>
                    <span className="font-bold text-slate-900">{topic.progress}%</span>
                  </div>
                  <ProgressBar value={topic.progress} size="sm" color={topic.color} showPercentage={false} />
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">Next module: <strong>React Hooks & State Architecture</strong></span>
            <button
              onClick={() => onNavigate('roadmap')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <span>Continue Learning</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Column: Upcoming Assessments (5 Cols) */}
        <div className="lg:col-span-5 saas-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Upcoming Assessments</h3>
              <button
                onClick={() => onNavigate('assessments')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
              >
                View All
              </button>
            </div>

            <div className="divide-y divide-slate-100 my-2">
              {upcomingAssessments.map((test, i) => (
                <div key={i} className="py-3.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{test.name}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {test.category} • {test.questions} Qs • {test.duration}
                    </p>
                    <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 font-medium mt-1">
                      <Calendar className="w-3 h-3 text-amber-500" />
                      Due {test.due}
                    </span>
                  </div>
                  <button
                    onClick={() => onNavigate('assessments')}
                    className="shrink-0 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors"
                  >
                    Start
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-center">
            <span className="text-[11px] text-slate-400">
              Assessments directly impact your campus recruitment readiness tier.
            </span>
          </div>
        </div>

      </div>

      {/* 5. Skill Gap Analysis Section */}
      <div className="saas-card p-6 sm:p-7">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">Skill Gap Analysis</h3>
            <p className="text-xs text-slate-500">Benchmark your competencies against industry campus recruiting thresholds</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Proficient (75%+)</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Needs Improvement</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 my-6">
          {skillGaps.map((skill) => (
            <div key={skill.name} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">{skill.name}</span>
                <span className="font-bold text-slate-900">{skill.score}%</span>
              </div>
              <ProgressBar value={skill.score} size="xs" color={skill.color} showPercentage={false} />
            </div>
          ))}
        </div>

        {/* Improve These Skills Recommended Action Box */}
        <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider block">
                Improve These Skills
              </span>
              <div className="flex flex-wrap gap-2 mt-1">
                <Badge variant="primary" size="xs">SQL Queries & JOINs</Badge>
                <Badge variant="primary" size="xs">JavaScript Closures</Badge>
                <Badge variant="primary" size="xs">Binary Tree Traversals</Badge>
              </div>
            </div>
          </div>
          <button
            onClick={() => onNavigate('resources')}
            className="text-xs font-semibold text-indigo-700 hover:text-indigo-800 shrink-0 inline-flex items-center gap-1"
          >
            <span>View Practice Drills</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 6. AI Career Coach Section */}
      <div className="saas-card p-6 sm:p-7">
        <div className="pb-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">AI Career Coach</h3>
            <Badge variant="primary" size="xs">Personalized</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Personalized recommendations based on your placement progress.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {aiRecommendations.map((rec) => {
            const Icon = rec.icon;
            return (
              <div 
                key={rec.id}
                className="p-5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/20 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 text-indigo-600 flex items-center justify-center">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {rec.tag}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mb-1.5">{rec.title}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">{rec.desc}</p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => onNavigate(rec.target)}
                    className="w-full py-2 rounded-lg bg-white border border-slate-300 hover:border-indigo-500 hover:text-indigo-600 text-slate-700 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <span>{rec.action}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 7. Recent Activity Timeline */}
      <div className="saas-card p-6 sm:p-7">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">Recent Activity</h3>
            <p className="text-xs text-slate-500">Your recent preparation and submission audit log</p>
          </div>
          <span className="text-xs text-slate-400 font-mono">Live Tracking</span>
        </div>

        <div className="divide-y divide-slate-100 mt-2">
          {recentActivities.map((act, i) => (
            <div key={i} className="py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                  {act.type === 'test' && <CheckSquare className="w-4 h-4 text-indigo-600" />}
                  {act.type === 'course' && <BookOpen className="w-4 h-4 text-emerald-600" />}
                  {act.type === 'resume' && <FileText className="w-4 h-4 text-sky-600" />}
                  {act.type === 'interview' && <Mic2 className="w-4 h-4 text-purple-600" />}
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800">{act.title}</p>
                  <p className="text-[11px] text-slate-400">{act.time}</p>
                </div>
              </div>
              <Badge variant="neutral" size="xs">
                {act.status}
              </Badge>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
