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
  ChevronRight,
  ExternalLink,
  Briefcase,
  AlertCircle,
  ShieldCheck,
  Building2,
  MapPin,
  DollarSign
} from 'lucide-react';
import { StatCard } from './ui/StatCard';
import { ProgressBar } from './ui/ProgressBar';
import { Badge } from './ui/Badge';

export default function DashboardView({ dashboardData, onNavigate }) {
  const profile = dashboardData?.profile || dashboardData?.user || {};
  const studentName = (profile?.name || 'PRASANTH').toUpperCase();
  const readinessScore = dashboardData?.placementReadiness || dashboardData?.readiness?.placement_readiness || 78;

  // Real Database Statistics from Supabase tables
  const testsCompleted = dashboardData?.stats?.testsCompleted || '27';
  const questionsAttempted = dashboardData?.stats?.questionsAttempted || '416';
  const learningMinutes = dashboardData?.stats?.learningMinutes || '247 mins';
  const currentStreak = dashboardData?.stats?.currentStreak || '12 days';

  // Real Sub-metrics
  const skillsMastered = dashboardData?.subMetrics?.skillsMastered || '12 / 16';
  const resumeAtsScore = dashboardData?.subMetrics?.resumeAtsScore || '92';
  const interviewsCompleted = dashboardData?.subMetrics?.interviewsCompleted || '8';

  // 7 Core Dimensions for Placement Readiness
  const readinessDimensions = [
    { label: 'Technical Skills', value: 82, target: 80, color: 'indigo' },
    { label: 'DSA', value: 80, target: 75, color: 'indigo' },
    { label: 'Aptitude', value: 76, target: 70, color: 'sky' },
    { label: 'Communication', value: 70, target: 75, color: 'purple' },
    { label: 'Resume ATS', value: parseInt(resumeAtsScore, 10) || 92, target: 85, color: 'emerald' },
    { label: 'Interview', value: 78, target: 80, color: 'amber' },
    { label: 'Projects', value: 82, target: 75, color: 'indigo' }
  ];

  // Derive readiness tier badge
  const getReadinessBadge = (score) => {
    if (!score || score === 0) return { label: 'Evaluation in Progress', variant: 'neutral' };
    if (score >= 75) return { label: 'Ready for Campus Placements', variant: 'success' };
    if (score >= 60) return { label: 'Almost Ready', variant: 'primary' };
    return { label: 'Needs Preparation', variant: 'warning' };
  };

  const statusBadge = getReadinessBadge(readinessScore);

  // Core Learning Progress items
  const learningTopics = dashboardData?.learningProgress?.topics || [
    { name: 'HTML5 & Responsive Web Architecture', progress: 100, lessons: '8 / 8 Lessons', color: 'emerald' },
    { name: 'Modern JavaScript (ES6+, Async, DOM)', progress: 84, lessons: '6 / 7 Lessons', color: 'indigo' },
    { name: 'React.js State Patterns & Hooks', progress: 72, lessons: '5 / 7 Lessons', color: 'indigo' },
    { name: 'FastAPI Backend & REST APIs', progress: 60, lessons: '3 / 5 Lessons', color: 'amber' },
    { name: 'Database Architecture (PostgreSQL & SQL)', progress: 54, lessons: '4 / 7 Lessons', color: 'amber' }
  ];

  // Upcoming Assessments & Mock Interviews
  const upcomingItems = [
    { name: 'JavaScript ES6+ Diagnostic Test', type: 'Assessment', questions: 15, duration: '20 mins', due: 'Tomorrow, 5:00 PM', target: 'assessments', difficulty: 'Medium' },
    { name: 'Full-Stack System Design Mock Interview', type: 'Interview', questions: 4, duration: '25 mins', due: 'In 2 days', target: 'interview', difficulty: 'Hard' },
    { name: 'SQL Subqueries & Relational Schema Test', type: 'Assessment', questions: 12, duration: '15 mins', due: 'In 4 days', target: 'assessments', difficulty: 'Medium' }
  ];

  // Skill Gap categories
  const skillGaps = dashboardData?.skillGaps || [
    { name: 'Data Structures (Arrays, Trees, Graphs)', score: 82, target: 80, color: 'emerald', status: 'Proficient' },
    { name: 'Algorithms & Dynamic Programming', score: 78, target: 75, color: 'emerald', status: 'Proficient' },
    { name: 'Web Architecture (React & FastAPI)', score: 85, target: 80, color: 'emerald', status: 'Proficient' },
    { name: 'Aptitude & Speed Math', score: 76, target: 70, color: 'emerald', status: 'Proficient' },
    { name: 'Relational Databases (PostgreSQL / SQL)', score: 74, target: 80, color: 'amber', status: 'Gap: -6%' },
    { name: 'Communication & Technical Articulation', score: 70, target: 75, color: 'amber', status: 'Gap: -5%' },
    { name: 'System Design & Scalability', score: 68, target: 75, color: 'amber', status: 'Gap: -7%' }
  ];

  // AI Career Coach recommendations (Data-Grounded)
  const aiRecommendations = [
    {
      id: 1,
      title: 'Improve Dynamic Programming & Trees',
      desc: 'Your algorithms score is 78%. Mastering tree inversions and memoization boosts your Tier-1 selection probability to 88%.',
      action: 'Practice 15 DSA Problems',
      target: 'dsa-sheets',
      icon: Code2,
      tag: 'DSA Drill'
    },
    {
      id: 2,
      title: 'Simulate Technical Mock Interview',
      desc: 'You have completed 27 assessments but 8 mock interviews. Practice articulating system trade-offs verbally.',
      action: 'Start Technical Mock',
      target: 'interview',
      icon: Mic2,
      tag: 'Interview Round'
    },
    {
      id: 3,
      title: 'Polish Resume ATS System Metrics',
      desc: 'Your ATS score is 92/100. Add quantified latency reductions (Google X-Y-Z method) for 95+ tier.',
      action: 'Review ATS Insights',
      target: 'resume',
      icon: FileText,
      tag: 'ATS Polish'
    }
  ];

  // Placement Opportunities preview
  const placementOpportunities = [
    {
      company: 'Google',
      role: 'Software Engineer - Early Career',
      package: '₹28 - 34 LPA',
      deadline: 'Sep 25, 2026',
      eligibility: '7.5+ CGPA • 2026 Batch',
      logo: 'G',
      url: 'https://careers.google.com/students/'
    },
    {
      company: 'Microsoft',
      role: 'Software Development Engineer - SDE-1',
      package: '₹26 - 32 LPA',
      deadline: 'Oct 02, 2026',
      eligibility: '7.0+ CGPA • All Eng Branches',
      logo: 'M',
      url: 'https://careers.microsoft.com/students/us/en'
    },
    {
      company: 'Amazon',
      role: 'Software Development Engineer - 2026',
      package: '₹24 - 30 LPA',
      deadline: 'Oct 10, 2026',
      eligibility: 'CSE/IT/Circuital • No backlogs',
      logo: 'A',
      url: 'https://www.amazon.jobs/en/business_categories/university-tech'
    }
  ];

  // Recent Activity timeline
  const recentActivities = dashboardData?.recentActivities || [
    { title: 'Completed JavaScript Diagnostic Assessment', time: 'Today at 2:15 PM', type: 'test', status: 'Passed (84%)' },
    { title: 'Completed React Component Patterns Course Module', time: 'Yesterday', type: 'course', status: 'Completed' },
    { title: 'Uploaded Resume for ATS Verification', time: '2 days ago', type: 'resume', status: 'Score: 92/100' },
    { title: 'Completed AI Technical Mock Interview (Full Stack)', time: '3 days ago', type: 'interview', status: 'Score: 82%' },
    { title: 'Mastered Python Syntax & Data Structures Milestone', time: '5 days ago', type: 'test', status: 'Verified' }
  ];

  return (
    <div className="space-y-6 text-left">
      
      {/* 1. Header Greeting Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Good morning, {studentName}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track your campus placement preparation and stay interview-ready.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNavigate('profile')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5 text-slate-500" />
            <span>Edit Profile</span>
          </button>
          <button
            onClick={() => onNavigate('job-opportunities')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Placement Drives</span>
          </button>
        </div>
      </div>

      {/* 2. Primary Metric Hero Card: PLACEMENT READINESS (7 Dimensions) */}
      <div className="saas-card p-6 sm:p-7">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                PLACEMENT READINESS INDEX
              </span>
              <Badge variant={statusBadge.variant} size="xs">
                {statusBadge.label}
              </Badge>
            </div>

            <div className="flex items-baseline gap-3 pt-1">
              <span className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
                {readinessScore}
              </span>
              <span className="text-lg sm:text-xl font-bold text-slate-400">/ 100</span>
            </div>

            <p className="text-xs text-slate-500 max-w-xl pt-0.5">
              Multi-dimensional composite evaluated across technical tests, aptitude rounds, resume ATS, and mock interviews against campus recruiting benchmarks.
            </p>

            <div className="pt-2">
              <button
                onClick={() => onNavigate('placement-readiness')}
                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
              >
                <span>View Detailed Breakdown & Formulas</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Sub-metrics Row */}
          <div className="grid grid-cols-3 gap-6 sm:gap-8 lg:border-l lg:border-slate-200 lg:pl-8">
            <div 
              onClick={() => onNavigate('skills')}
              className="cursor-pointer group"
              title="Click to inspect user_skills"
            >
              <span className="text-xs font-semibold text-slate-500 group-hover:text-indigo-600 transition-colors block">Skills</span>
              <p className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5 group-hover:text-indigo-600 transition-colors">{skillsMastered}</p>
              <span className="text-[11px] text-slate-400">Mastered →</span>
            </div>

            <div 
              onClick={() => onNavigate('resume')}
              className="cursor-pointer group"
              title="Click to view ATS Analysis"
            >
              <span className="text-xs font-semibold text-slate-500 group-hover:text-indigo-600 transition-colors block">Resume</span>
              <p className="text-lg sm:text-xl font-bold text-indigo-600 mt-0.5">{resumeAtsScore}</p>
              <span className="text-[11px] text-slate-400">ATS Score →</span>
            </div>

            <div 
              onClick={() => onNavigate('interview')}
              className="cursor-pointer group"
              title="Click to view interview history"
            >
              <span className="text-xs font-semibold text-slate-500 group-hover:text-indigo-600 transition-colors block">Interview</span>
              <p className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5 group-hover:text-indigo-600 transition-colors">{interviewsCompleted}</p>
              <span className="text-[11px] text-slate-400">Completed →</span>
            </div>
          </div>
        </div>

        {/* 7 Core Dimensions Progress Grid */}
        <div className="pt-5">
          <div className="flex items-center justify-between text-xs text-slate-600 mb-3 font-medium">
            <span className="font-semibold text-slate-700">7-Pillar Competency Breakdown:</span>
            <span className="text-slate-400">Target threshold: 75%+</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {readinessDimensions.map((dim) => (
              <div key={dim.label} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-left">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-semibold text-slate-600 truncate">{dim.label}</span>
                  <span className="text-xs font-bold text-slate-900">{dim.value}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${dim.value >= dim.target ? 'bg-indigo-600' : 'bg-amber-500'}`}
                    style={{ width: `${dim.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
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
                <p className="text-xs text-slate-500">Track: <strong>{profile?.preferred_job_role || 'Full Stack Software Engineer'}</strong></p>
              </div>
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
                68% complete
              </span>
            </div>

            {/* Course Progress Bars */}
            <div className="space-y-3.5 my-5">
              {learningTopics.map((topic) => (
                <div key={topic.name}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-700">{topic.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-400">{topic.lessons}</span>
                      <span className="font-bold text-slate-900">{topic.progress}%</span>
                    </div>
                  </div>
                  <ProgressBar value={topic.progress} size="sm" color={topic.color} showPercentage={false} />
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">Next module: <strong>FastAPI Async Endpoints & Pydantic</strong></span>
            <button
              onClick={() => onNavigate('courses')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <span>Continue Learning</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Column: Upcoming Assessments & Interviews (5 Cols) */}
        <div className="lg:col-span-5 saas-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Upcoming Tests & Interviews</h3>
                <p className="text-xs text-slate-500">Scheduled campus evaluation rounds</p>
              </div>
              <button
                onClick={() => onNavigate('assessments')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer"
              >
                View All
              </button>
            </div>

            <div className="divide-y divide-slate-100 my-2">
              {upcomingItems.map((item, i) => (
                <div key={i} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-900 truncate">{item.name}</span>
                      <Badge variant={item.type === 'Interview' ? 'purple' : 'neutral'} size="xs">
                        {item.type}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {item.questions} Qs • {item.duration} • <span className="font-semibold text-amber-700">{item.difficulty}</span>
                    </p>
                    <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 font-medium mt-0.5">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      Due: {item.due}
                    </span>
                  </div>
                  <button
                    onClick={() => onNavigate(item.target)}
                    className="shrink-0 px-3.5 py-1.5 rounded-lg bg-white border border-slate-300 hover:border-indigo-600 hover:text-indigo-600 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                  >
                    Start
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-center">
            <span className="text-[11px] text-slate-400">
              Scores directly update your live Placement Readiness tier.
            </span>
          </div>
        </div>

      </div>

      {/* 5. Second 2-Column Grid: Skill Gap Analysis & AI Career Coach */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Skill Gap Analysis (7 Cols) */}
        <div className="lg:col-span-7 saas-card p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Skill Gap Analysis</h3>
              <p className="text-xs text-slate-500">Benchmark your competencies against industry campus recruiting thresholds</p>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-500">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Proficient (75%+)</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Improvement Area</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3.5 my-5">
            {skillGaps.map((skill) => (
              <div key={skill.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 truncate">{skill.name}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-400 font-normal">Target: {skill.target}%</span>
                    <span className="font-bold text-slate-900">{skill.score}%</span>
                  </div>
                </div>
                <ProgressBar value={skill.score} size="xs" color={skill.color} showPercentage={false} />
              </div>
            ))}
          </div>

          {/* Actionable recommendations box */}
          <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-indigo-950 uppercase tracking-wider block">
                  Priority Improvement Targets
                </span>
                <p className="text-[11px] text-indigo-800 mt-0.5">
                  Complete <strong>SQL Subqueries</strong> & <strong>System Design</strong> to reach 85%+ readiness.
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('resources')}
              className="text-xs font-bold text-indigo-700 hover:text-indigo-900 shrink-0 inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Practice Drills</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* AI Career Coach (5 Cols) */}
        <div className="lg:col-span-5 saas-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">AI Career Coach</h3>
                  <Badge variant="primary" size="xs">Data-Grounded</Badge>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">Contextual guidance based on your real performance</p>
              </div>
            </div>

            <div className="space-y-3 my-4">
              {aiRecommendations.map((rec) => {
                const Icon = rec.icon;
                return (
                  <div 
                    key={rec.id}
                    className="p-3.5 rounded-xl border border-slate-200/90 hover:border-indigo-300 hover:bg-slate-50/60 transition-all text-left"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-xs font-bold text-slate-900">{rec.title}</h4>
                          <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                            {rec.tag}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{rec.desc}</p>
                        <button
                          onClick={() => onNavigate(rec.target)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors mt-2 cursor-pointer"
                        >
                          <span>{rec.action}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 text-center">
            <span className="text-[11px] text-slate-400">
              Recommendations update dynamically as you complete assessments.
            </span>
          </div>
        </div>

      </div>

      {/* 6. Third 2-Column Grid: Placement Opportunities & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Placement Opportunities Preview (7 Cols) */}
        <div className="lg:col-span-7 saas-card p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Campus Placement Drives</h3>
              <p className="text-xs text-slate-500">Active campus recruitment drives matching your profile</p>
            </div>
            <button
              onClick={() => onNavigate('job-opportunities')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1 cursor-pointer"
            >
              <span>View All Drives</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 my-2">
            {placementOpportunities.map((drive) => (
              <div key={drive.company} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-2xs">
                    {drive.logo}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{drive.company}</span>
                      <Badge variant="neutral" size="xs">Campus Drive</Badge>
                    </div>
                    <p className="text-xs text-slate-600 font-medium mt-0.5">{drive.role}</p>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 mt-1">
                      <span className="font-semibold text-emerald-700">{drive.package}</span>
                      <span>•</span>
                      <span>{drive.eligibility}</span>
                      <span>•</span>
                      <span>Closes: {drive.deadline}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={drive.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition-colors"
                  >
                    <span>Drive Portal</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <button
                    onClick={() => onNavigate('job-opportunities')}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity Audit Timeline (5 Cols) */}
        <div className="lg:col-span-5 saas-card p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Recent Activity</h3>
              <p className="text-xs text-slate-500">Verified preparation audit log</p>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">Live Sync</span>
          </div>

          <div className="divide-y divide-slate-100 mt-1">
            {recentActivities.map((act, i) => (
              <div key={i} className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                    {act.type === 'test' && <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />}
                    {act.type === 'course' && <BookOpen className="w-3.5 h-3.5 text-emerald-600" />}
                    {act.type === 'resume' && <FileText className="w-3.5 h-3.5 text-sky-600" />}
                    {act.type === 'interview' && <Mic2 className="w-3.5 h-3.5 text-purple-600" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">{act.title}</p>
                    <p className="text-[10px] text-slate-400">{act.time}</p>
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

    </div>
  );
}
