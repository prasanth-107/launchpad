import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Target,
  CheckCircle2,
  Clock,
  Award,
  Calendar,
  ChevronRight,
  Download,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  FileText,
  Mic2,
  Layers,
  BookOpen,
  ArrowRight,
  Filter,
  Check,
  Compass,
  Code2,
  Zap,
  Info
} from 'lucide-react';
import { StatCard } from './ui/StatCard';
import { ProgressBar } from './ui/ProgressBar';
import { Badge } from './ui/Badge';
import { dal } from '../lib/supabaseClient';
import { PERIOD_FILTERS, SKILL_THRESHOLDS } from '../lib/progressAnalyticsEngine';

export function AnalyticsView({ user, onNavigate }) {
  const [period, setPeriod] = useState('all'); // '7d' | '30d' | '90d' | 'all'
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'assessments' | 'skills' | 'learning' | 'resume_interview' | 'applications'
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const userId = user?.id || 'dcd807f7-9b13-4476-abc5-b34f60905f82';
      const data = await dal.analytics.getAnalyticsData(userId, period);
      setAnalyticsData(data);
    } catch (err) {
      console.warn('Analytics loading note:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [user?.id, period]);

  const readiness = analyticsData?.readinessReport || {};
  const overview = analyticsData?.overview || {};
  const pillars = analyticsData?.pillarProgress || [];
  const trend = analyticsData?.readinessTrend || {};
  const timeline = analyticsData?.activityTimeline || [];
  const skills = analyticsData?.skillProgress || {};
  const learning = analyticsData?.learningProgress || {};
  const assessments = analyticsData?.assessmentAnalytics || {};
  const applications = analyticsData?.applicationPipeline || {};
  const insights = analyticsData?.insights || {};

  const hasReadiness = readiness?.score !== null && readiness?.score !== undefined;

  return (
    <div className="space-y-6 text-left">

      {/* 1. Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Placement Progress & Analytics
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
              <Sparkles className="w-3 h-3 text-indigo-600" />
              Verified Telemetry
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Data-grounded performance metrics, readiness historical trends, and activity telemetry.
          </p>
        </div>

        {/* Period Filter & Export Actions */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Period Filter Pills */}
          <div className="inline-flex items-center p-1 rounded-lg bg-slate-100 border border-slate-200">
            {Object.values(PERIOD_FILTERS).map(p => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  period === p.id 
                    ? 'bg-white text-indigo-700 shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <button
            onClick={fetchAnalytics}
            title="Refresh Analytics"
            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* 2. Primary Hero: Placement Readiness & 7 Core Pillars */}
      <div className="saas-card p-6 sm:p-7">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                PLACEMENT READINESS INDEX
              </span>
              <Badge variant={hasReadiness ? (readiness.score >= 80 ? 'success' : 'primary') : 'neutral'}>
                {readiness.status || 'In Progress'}
              </Badge>
            </div>
            <p className="text-xs text-slate-500">
              Proportionally normalized across {readiness?.coverage?.summary || 'evaluated placement pillars'}
            </p>
          </div>

          <div className="flex items-center gap-6 self-start lg:self-auto">
            <div className="text-right">
              <div className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
                {hasReadiness ? `${readiness.score}` : '—'}
                <span className="text-sm font-semibold text-slate-400"> / 100</span>
              </div>
              <span className="text-[11px] font-medium text-slate-400 block mt-0.5">
                {readiness?.coverageText || '0 of 7 pillars evaluated'}
              </span>
            </div>

            <div className="h-10 w-px bg-slate-200 hidden sm:block" />

            {/* Quick Action CTA */}
            <button
              onClick={() => onNavigate && onNavigate(readiness?.nextAction?.targetRoute || 'assessments')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer shrink-0"
            >
              <span>{readiness?.nextAction?.label || 'Take Assessment'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 7 Pillars Progress Grid */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              7 Core Placement Pillars Breakdown
            </span>
            <span className="text-xs text-slate-400 font-medium">
              Canonical Hiring Benchmarks (70%–85%)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {pillars.map((p) => {
              const isEval = Boolean(p.available);
              const score = isEval ? p.score : null;
              const metBenchmark = isEval && score >= p.targetBenchmark;

              return (
                <div 
                  key={p.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isEval 
                      ? 'bg-slate-50/70 border-slate-200' 
                      : 'bg-slate-50/30 border-dashed border-slate-200 opacity-75'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 truncate" title={p.name}>
                      {p.shortName || p.name}
                    </span>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                      isEval 
                        ? (metBenchmark ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800') 
                        : 'bg-slate-200 text-slate-600'
                    }`}>
                      {isEval ? (metBenchmark ? 'Cleared' : `-${p.gap}%`) : 'Unassessed'}
                    </span>
                  </div>

                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="text-lg font-extrabold text-slate-900">
                      {isEval ? `${score}%` : '—'}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      Target: {p.targetBenchmark}%
                    </span>
                  </div>

                  <div className="mt-2">
                    <ProgressBar 
                      value={isEval ? score : 0} 
                      max={100} 
                      variant={isEval ? (metBenchmark ? 'success' : 'primary') : 'neutral'} 
                    />
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">
                      {isEval ? `Weight: ${p.effectiveWeight}%` : 'Not in index'}
                    </span>
                    {onNavigate && p.actionTarget && (
                      <button
                        onClick={() => onNavigate(p.actionTarget)}
                        className="font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                      >
                        {p.actionLabel || 'Improve'} →
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Historical Readiness Trend & Grounded Insights (2-column layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Historical Readiness Trend Visualization */}
        <div className="lg:col-span-2 saas-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Historical Readiness Progression
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verified snapshots stored over time ({period.toUpperCase()})
                </p>
              </div>

              {trend.hasEnoughData && (
                <div className="text-right">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    trend.scoreDelta >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                  }`}>
                    {trend.scoreDelta >= 0 ? '+' : ''}{trend.scoreDelta} pts
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Overall Growth</span>
                </div>
              )}
            </div>

            {/* Trend Chart Area */}
            <div className="mt-6 min-h-[180px] flex items-center justify-center">
              {trend.hasEnoughData ? (
                <div className="w-full space-y-4">
                  {/* SVG Line / Area Graph */}
                  <div className="h-36 w-full relative flex items-end">
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 500 120" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="readinessGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Area Fill */}
                      {(() => {
                        const pts = trend.points;
                        const min = Math.min(40, ...pts.map(p => p.score));
                        const max = Math.max(90, ...pts.map(p => p.score));
                        const range = Math.max(1, max - min);
                        const coords = pts.map((p, i) => {
                          const x = (i / (pts.length - 1)) * 500;
                          const y = 110 - ((p.score - min) / range) * 90;
                          return `${x},${y}`;
                        });
                        const areaPath = `M ${coords[0]} L ${coords.join(' L ')} L 500,120 L 0,120 Z`;
                        const linePath = `M ${coords.join(' L ')}`;

                        return (
                          <>
                            <path d={areaPath} fill="url(#readinessGrad)" />
                            <path d={linePath} fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" />
                            {pts.map((p, i) => {
                              const x = (i / (pts.length - 1)) * 500;
                              const y = 110 - ((p.score - min) / range) * 90;
                              return (
                                <g key={p.id}>
                                  <circle cx={x} cy={y} r="4.5" fill="#ffffff" stroke="#4f46e5" strokeWidth="2" />
                                  <text x={x} y={y - 8} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#1e1b4b">
                                    {p.score}
                                  </text>
                                </g>
                              );
                            })}
                          </>
                        );
                      })()}
                    </svg>
                  </div>

                  {/* Dates Axis */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium px-1">
                    {trend.points.map((p) => (
                      <span key={p.id}>{p.date}</span>
                    ))}
                  </div>
                </div>
              ) : (
                /* Honest Empty State for < 2 snapshots */
                <div className="py-8 px-6 text-center max-w-md mx-auto space-y-2.5">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Trend Line In Progress
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {trend.message || 'Your readiness trend will appear as you complete more assessments and placement activities.'}
                  </p>
                  <p className="text-[11px] text-slate-400 font-medium">
                    {trend.snapshotsCount === 1 
                      ? '1 baseline evaluation recorded. Complete your next test to generate progression deltas.' 
                      : '0 recorded snapshots. Take a diagnostic test to initialize your timeline.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Data grounded: Real snapshots only</span>
            <span>Zero synthetic projections</span>
          </div>
        </div>

        {/* Grounded Placement Readiness Insights */}
        <div className="saas-card p-6 flex flex-col justify-between space-y-5">
          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Zap className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Readiness Intelligence
              </h3>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              {/* What's Improving */}
              <div>
                <span className="font-bold text-emerald-700 uppercase text-[10px] tracking-wider flex items-center gap-1 mb-1">
                  <CheckCircle2 className="w-3 h-3" />
                  What's Improving
                </span>
                <p className="text-slate-600 leading-relaxed bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100">
                  {insights?.improving?.[0] || 'Initial assessment metrics recorded.'}
                </p>
              </div>

              {/* What's Holding You Back */}
              <div>
                <span className="font-bold text-rose-700 uppercase text-[10px] tracking-wider flex items-center gap-1 mb-1">
                  <AlertCircle className="w-3 h-3" />
                  Holding You Back
                </span>
                <p className="text-slate-600 leading-relaxed bg-rose-50/50 p-2.5 rounded-lg border border-rose-100">
                  {insights?.holdingBack?.[0] || 'Unassessed pillars limit placement clearance.'}
                </p>
              </div>

              {/* Next Focus */}
              {insights?.nextFocus && (
                <div>
                  <span className="font-bold text-indigo-700 uppercase text-[10px] tracking-wider flex items-center gap-1 mb-1">
                    <Target className="w-3 h-3" />
                    Recommended Next Focus
                  </span>
                  <div className="bg-indigo-50/70 p-3 rounded-lg border border-indigo-100 space-y-2">
                    <p className="font-semibold text-slate-900">
                      {insights.nextFocus.title}
                    </p>
                    <p className="text-slate-600 leading-relaxed">
                      {insights.nextFocus.description}
                    </p>
                    {onNavigate && (
                      <button
                        onClick={() => onNavigate(insights.nextFocus.targetRoute)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-[11px] transition-colors shadow-2xs cursor-pointer"
                      >
                        <span>{insights.nextFocus.label}</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* 4. Progress Overview (7 Key Indicators) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Roadmap</span>
          <span className="text-base font-extrabold text-slate-900 block mt-1">
            {overview.roadmap?.hasData ? `${overview.roadmap.percentage}%` : '—'}
          </span>
          <span className="text-[10px] text-slate-500 block truncate">
            {overview.roadmap?.completed || 0} / {overview.roadmap?.total || 0} stages
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Courses</span>
          <span className="text-base font-extrabold text-slate-900 block mt-1">
            {overview.courses?.hasData ? `${overview.courses.avgProgress}%` : '—'}
          </span>
          <span className="text-[10px] text-slate-500 block truncate">
            {overview.courses?.enrolled || 0} enrolled
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tests Cleared</span>
          <span className="text-base font-extrabold text-slate-900 block mt-1">
            {overview.assessments?.passedCount || 0}
          </span>
          <span className="text-[10px] text-slate-500 block truncate">
            {overview.assessments?.totalAttempts || 0} attempts
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Skills Mastered</span>
          <span className="text-base font-extrabold text-slate-900 block mt-1">
            {overview.skills?.masteredCount || 0}
          </span>
          <span className="text-[10px] text-slate-500 block truncate">
            {overview.skills?.evaluatedCount || 0} benchmarked
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Resume ATS</span>
          <span className="text-base font-extrabold text-slate-900 block mt-1">
            {overview.resume?.hasData ? `${overview.resume.latestScore}/100` : '—'}
          </span>
          <span className="text-[10px] text-slate-500 block truncate">
            {overview.resume?.hasData ? 'Verified scan' : 'No upload'}
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Mock Interview</span>
          <span className="text-base font-extrabold text-slate-900 block mt-1">
            {overview.mockInterview?.hasData ? `${overview.mockInterview.latestScore}/100` : '—'}
          </span>
          <span className="text-[10px] text-slate-500 block truncate">
            {overview.mockInterview?.completedCount || 0} completed
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs col-span-2 sm:col-span-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pipeline</span>
          <span className="text-base font-extrabold text-slate-900 block mt-1">
            {overview.applications?.activeCount || 0}
          </span>
          <span className="text-[10px] text-slate-500 block truncate">
            Active applications
          </span>
        </div>
      </div>

      {/* 5. Modular Deep-Dive Analytics (Sub-Tabs) */}
      <div className="saas-card overflow-hidden">
        {/* Tab Navigation */}
        <div className="border-b border-slate-200 bg-slate-50/60 px-4 sm:px-6 flex items-center overflow-x-auto scrollbar-none gap-2">
          {[
            { id: 'all', label: 'All Telemetry' },
            { id: 'assessments', label: `Assessments (${assessments?.totalAttempts || 0})` },
            { id: 'skills', label: `Skill Competencies (${skills?.totalEvaluated || 0})` },
            { id: 'learning', label: `Learning Path (${learning?.completedMilestones || 0}/${learning?.totalMilestones || 0})` },
            { id: 'applications', label: `Recruitment Pipeline (${applications?.total || 0})` }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`py-3.5 px-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-all cursor-pointer ${
                activeTab === t.id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Sub-tab 1: Assessments Deep-Dive */}
          {(activeTab === 'all' || activeTab === 'assessments') && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                  Assessment Performance Breakdown
                </span>
                <span className="text-xs text-slate-400">
                  Avg: {assessments.avgScore !== null ? `${assessments.avgScore}%` : '—'} • Pass Rate: {assessments.passRate !== null ? `${assessments.passRate}%` : '—'}
                </span>
              </div>

              {assessments.hasData ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {assessments.categories.map((c, idx) => (
                    <div key={idx} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 truncate" title={c.name}>
                          {c.name}
                        </span>
                        <Badge variant={c.highestScore >= 80 ? 'success' : (c.highestScore >= 70 ? 'primary' : 'warning')}>
                          {c.status}
                        </Badge>
                      </div>
                      <div className="flex items-baseline justify-between text-xs">
                        <span className="text-slate-500">Highest Score</span>
                        <span className="font-extrabold text-slate-900">{c.highestScore}%</span>
                      </div>
                      <div className="flex items-baseline justify-between text-xs">
                        <span className="text-slate-500">Average ({c.attemptsCount} attempts)</span>
                        <span className="font-medium text-slate-700">{c.avgScore}%</span>
                      </div>
                      <ProgressBar value={c.highestScore} max={100} variant={c.highestScore >= 80 ? 'success' : 'primary'} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                  No diagnostic assessments completed in this period. Take a test to unlock scoring analytics.
                </div>
              )}
            </div>
          )}

          {/* Sub-tab 2: Skills Deep-Dive */}
          {(activeTab === 'all' || activeTab === 'skills') && (
            <div className="space-y-4 mt-8 pt-8 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-indigo-600" />
                  Skill Gap & Competency Analysis (Phase 4 Thresholds)
                </span>
                <div className="flex items-center gap-3 text-[11px]">
                  <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Strong (&ge;80%)
                  </span>
                  <span className="flex items-center gap-1 text-amber-700 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-amber-500" /> Improving (60-79%)
                  </span>
                  <span className="flex items-center gap-1 text-rose-700 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-rose-500" /> Critical (&lt;60%)
                  </span>
                </div>
              </div>

              {skills.hasData ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Strong */}
                  <div className="p-3.5 rounded-lg bg-emerald-50/40 border border-emerald-100 space-y-2">
                    <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                      Strong Skills ({skills.strong?.length || 0})
                    </span>
                    <div className="space-y-1.5">
                      {skills.strong?.length > 0 ? (
                        skills.strong.map(s => (
                          <div key={s.id} className="p-2 rounded bg-white border border-emerald-200/80 flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-800">{s.name}</span>
                            <div className="flex items-center gap-1.5">
                              {s.delta !== null && (
                                <span className={`text-[10px] font-bold ${s.delta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                  {s.delta >= 0 ? `+${s.delta}%` : `${s.delta}%`}
                                </span>
                              )}
                              <span className="font-bold text-emerald-700">{s.proficiency}%</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-400 italic">No skills currently &ge;80%.</p>
                      )}
                    </div>
                  </div>

                  {/* Improving */}
                  <div className="p-3.5 rounded-lg bg-amber-50/40 border border-amber-100 space-y-2">
                    <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
                      Developing Skills ({skills.improving?.length || 0})
                    </span>
                    <div className="space-y-1.5">
                      {skills.improving?.length > 0 ? (
                        skills.improving.map(s => (
                          <div key={s.id} className="p-2 rounded bg-white border border-amber-200/80 flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-800">{s.name}</span>
                            <span className="font-bold text-amber-700">{s.proficiency}%</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-400 italic">No skills in 60%–79% bracket.</p>
                      )}
                    </div>
                  </div>

                  {/* Critical */}
                  <div className="p-3.5 rounded-lg bg-rose-50/40 border border-rose-100 space-y-2">
                    <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider block">
                      Critical Gaps ({skills.critical?.length || 0})
                    </span>
                    <div className="space-y-1.5">
                      {skills.critical?.length > 0 ? (
                        skills.critical.map(s => (
                          <div key={s.id} className="p-2 rounded bg-white border border-rose-200/80 flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-800">{s.name}</span>
                            <span className="font-bold text-rose-700">{s.proficiency}%</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-400 italic">Zero critical gaps (&lt;60%).</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                  No verified skills assessed yet. Complete diagnostic assessments to benchmark your skills.
                </div>
              )}
            </div>
          )}

          {/* Sub-tab 3: Learning Progression */}
          {(activeTab === 'all' || activeTab === 'learning') && (
            <div className="space-y-4 mt-8 pt-8 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-indigo-600" />
                  Personalized Roadmap & Learning Velocity
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {learning.progressPercent || 0}% Cleared • Est. {learning.remainingHours || 0} hrs remaining
                </span>
              </div>

              {learning.hasData ? (
                <div className="space-y-3">
                  <ProgressBar value={learning.progressPercent} max={100} variant="primary" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {learning.stages.map((st) => (
                      <div 
                        key={st.id} 
                        className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
                          st.completed 
                            ? 'bg-indigo-50/40 border-indigo-200/80 text-indigo-950 font-semibold' 
                            : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                            st.completed ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'
                          }`}>
                            {st.completed ? <Check className="w-3 h-3" /> : st.step_number}
                          </div>
                          <span className="truncate">{st.title}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 ml-2 shrink-0">{st.target_hours || 4}h</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                  Complete an assessment to generate your personalized learning roadmap.
                </div>
              )}
            </div>
          )}

          {/* Sub-tab 4: Recruitment Pipeline Funnel */}
          {(activeTab === 'all' || activeTab === 'applications') && (
            <div className="space-y-4 mt-8 pt-8 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  Placement Recruitment Funnel Conversion
                </span>
                <span className="text-xs text-slate-400">
                  {applications.total || 0} Total Applications Tracked
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Applications</span>
                  <span className="text-lg font-bold text-slate-900 block mt-1">{applications.appliedCount || 0}</span>
                  <span className="text-[10px] text-slate-500">Submitted drives</span>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Interviews</span>
                  <span className="text-lg font-bold text-slate-900 block mt-1">{applications.interviewCount || 0}</span>
                  <span className="text-[10px] text-indigo-600 font-semibold">
                    Conversion: {applications?.funnel?.appliedToInterviewRate !== null ? `${applications.funnel.appliedToInterviewRate}%` : '—'}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Offers</span>
                  <span className="text-lg font-bold text-slate-900 block mt-1">{applications.offerCount || 0}</span>
                  <span className="text-[10px] text-emerald-600 font-semibold">
                    Conversion: {applications?.funnel?.interviewToOfferRate !== null ? `${applications.funnel.interviewToOfferRate}%` : '—'}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Final Selections</span>
                  <span className="text-lg font-bold text-slate-900 block mt-1">{applications.selectedCount || 0}</span>
                  <span className="text-[10px] text-purple-600 font-semibold">
                    Conversion: {applications?.funnel?.offerToSelectedRate !== null ? `${applications.funnel.offerToSelectedRate}%` : '—'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 6. Real Activity Intelligence Timeline */}
      <div className="saas-card p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Recent Placement Activity Telemetry
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Genuine event log from verified assessments, resumes, roadmap steps, and mock rounds
            </p>
          </div>

          <span className="text-xs font-semibold text-slate-400">
            {timeline.length} Event(s)
          </span>
        </div>

        <div className="mt-5">
          {timeline.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {timeline.map((act) => (
                <div key={act.id} className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 mt-0.5">
                      {act.type === 'assessment' && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                      {act.type === 'course' && <BookOpen className="w-4 h-4 text-emerald-600" />}
                      {act.type === 'roadmap' && <Compass className="w-4 h-4 text-sky-600" />}
                      {act.type === 'resume' && <FileText className="w-4 h-4 text-purple-600" />}
                      {act.type === 'interview' && <Mic2 className="w-4 h-4 text-amber-600" />}
                      {act.type === 'application' && <Layers className="w-4 h-4 text-blue-600" />}
                      {act.type === 'skill' && <Target className="w-4 h-4 text-indigo-600" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{act.title}</span>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">
                          • {act.categoryLabel}
                        </span>
                      </div>
                      <p className="text-slate-500 mt-0.5">{act.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-start sm:self-auto shrink-0 pl-10 sm:pl-0">
                    {act.badge && (
                      <Badge variant={act.badgeVariant || 'neutral'}>
                        {act.badge}
                      </Badge>
                    )}
                    <span className="text-[11px] text-slate-400 whitespace-nowrap">
                      {new Date(act.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {onNavigate && act.targetRoute && (
                      <button
                        onClick={() => onNavigate(act.targetRoute)}
                        className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors cursor-pointer"
                        title="View Details"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 px-6 text-center space-y-2">
              <p className="text-xs font-semibold text-slate-700">
                Your placement activity will appear here as you start preparing.
              </p>
              <p className="text-xs text-slate-400">
                Take an assessment, upload a resume, or practice a mock interview to record telemetry.
              </p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

export default AnalyticsView;
