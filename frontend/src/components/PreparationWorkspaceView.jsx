import { generatePlacementStrategy } from '../lib/studentSuccessEngine';
import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Clock,
  Flame,
  Sparkles,
  ArrowRight,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Briefcase,
  Bot,
  BarChart3,
  BookOpen,
  FileText,
  Mic2,
  Layers,
  RefreshCw
} from 'lucide-react';
import { Badge } from './ui/Badge';
import { dal } from '../lib/supabaseClient';

export default function PreparationWorkspaceView({ user, onNavigate }) {
  const [loading, setLoading] = useState(true);
  const [prepData, setPrepData] = useState(null);
  const [actionStates, setActionStates] = useState({});
  const [togglingKey, setTogglingKey] = useState(null);

  const fetchWorkspaceData = async () => {
    setLoading(true);
    try {
      const data = await dal.preparation.getPreparationData(user?.id);
      setPrepData(data);
      
      // Initialize local action completion state
      const initialMap = {};
      (data?.dailyPlan?.plan || []).forEach(act => {
        initialMap[act.key] = Boolean(act.completed);
      });
      setActionStates(initialMap);
    } catch (err) {
      console.error('Error fetching preparation workspace data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaceData();
  }, [user?.id]);

  const handleToggleAction = async (actionKey) => {
    if (togglingKey) return;
    const currentState = Boolean(actionStates[actionKey]);
    const newState = !currentState;
    
    // Optimistic UI update
    setActionStates(prev => ({ ...prev, [actionKey]: newState }));
    setTogglingKey(actionKey);

    try {
      await dal.preparation.toggleAction(user?.id, actionKey, newState);
      // Re-fetch in background to update streak and daily counts cleanly
      const updated = await dal.preparation.getPreparationData(user?.id);
      setPrepData(updated);
    } catch (err) {
      console.error('Error toggling action:', err);
      // Rollback on failure
      setActionStates(prev => ({ ...prev, [actionKey]: currentState }));
    } finally {
      setTogglingKey(null);
    }
  };

  const plan = prepData?.dailyPlan?.plan || [];
  const topPriority = prepData?.dailyPlan?.topPriority || null;
  const mode = prepData?.dailyPlan?.mode || {};
  const streak = prepData?.streak || { currentStreak: 0, hasStreak: false, message: 'Start completing preparation actions to build your consistency.' };
  const weeklySummary = prepData?.weeklySummary || {};
  const insights = prepData?.insights || {};
  const readinessReport = prepData?.readinessReport || {};
  const hasReadiness = readinessReport?.isEvaluated && readinessReport?.score !== null && readinessReport?.score !== undefined;

  const completedTodayCount = Object.values(actionStates).filter(Boolean).length;
  const totalTodayCount = plan.length;

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/3"></div>
        <div className="h-4 bg-slate-100 rounded w-1/2"></div>
        <div className="h-32 bg-slate-100 rounded-xl"></div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-4">
            <div className="h-40 bg-slate-100 rounded-xl"></div>
            <div className="h-28 bg-slate-100 rounded-xl"></div>
          </div>
          <div className="lg:col-span-4 space-y-4">
            <div className="h-36 bg-slate-100 rounded-xl"></div>
            <div className="h-44 bg-slate-100 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in text-slate-800">
      
      {/* 1. Header & Context Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Your Placement Preparation
            </h1>
            <Badge variant={mode.badgeVariant || 'neutral'} size="sm">
              {mode.title || 'Assessment in Progress'}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Focus on the actions that will improve your placement readiness.
          </p>
        </div>

        {/* Cross-Service Shortcuts */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigate('career-coach')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 text-indigo-700 text-xs font-semibold transition-colors cursor-pointer"
            title="Ask AI Career Coach for guidance"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Ask Career Coach</span>
          </button>

          <button
            onClick={() => onNavigate('analytics')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            title="View Progress Analytics"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>View Progress Analytics</span>
          </button>

          <button
            onClick={fetchWorkspaceData}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer"
            title="Refresh Preparation Plan"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Preparation Mode Banner */}
      <div className={`p-4 sm:p-5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
        mode.badgeVariant === 'success' ? 'bg-emerald-50/50 border-emerald-200' :
        mode.badgeVariant === 'primary' ? 'bg-indigo-50/50 border-indigo-200' :
        mode.badgeVariant === 'warning' ? 'bg-amber-50/50 border-amber-200' :
        mode.badgeVariant === 'danger' ? 'bg-rose-50/50 border-rose-200' :
        'bg-slate-50 border-slate-200'
      }`}>
        <div className="flex items-start gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
            mode.badgeVariant === 'success' ? 'bg-emerald-100 text-emerald-700' :
            mode.badgeVariant === 'primary' ? 'bg-indigo-100 text-indigo-700' :
            mode.badgeVariant === 'warning' ? 'bg-amber-100 text-amber-700' :
            mode.badgeVariant === 'danger' ? 'bg-rose-100 text-rose-700' :
            'bg-slate-200 text-slate-600'
          }`}>
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">PREPARATION STATUS</span>
              <span className="text-xs font-semibold text-slate-500">•</span>
              <span className="text-xs font-bold text-slate-900">{mode.title}</span>
            </div>
            <p className="text-xs text-slate-700 font-medium mt-0.5">{mode.headline} {mode.guidance}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Readiness Index</span>
            <span className="text-base font-extrabold text-slate-900">
              {hasReadiness ? `${readinessReport.score}%` : 'In Progress'}
            </span>
          </div>
          <button
            onClick={() => onNavigate('placement-readiness')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
          >
            Breakdown →
          </button>
        </div>
      </div>

      {/* 3. Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ================================================================== */}
        {/* LEFT COLUMN: TODAY'S PRIORITY & ACTION PLAN (8 Cols) */}
        {/* ================================================================== */}
        <div className="lg:col-span-8 space-y-6">

          {/* 3A. TODAY'S PRIORITY (Single Highest-Value Action) */}
          {topPriority && (
            <div className="saas-card p-5 sm:p-6 border-l-4 border-l-indigo-600 bg-gradient-to-r from-indigo-50/40 via-white to-white space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold tracking-wider uppercase bg-rose-50 text-rose-700 border border-rose-200">
                    TODAY'S HIGHEST PRIORITY
                  </span>
                  <Badge variant={topPriority.priorityVariant || 'primary'} size="xs">
                    {topPriority.priority} {topPriority.priorityLabel}
                  </Badge>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{topPriority.estimated_minutes} min</span>
                </div>
              </div>

              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                  {topPriority.title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                  {topPriority.reason}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                <span className="text-[11px] text-slate-400 font-medium">
                  Source: <strong>{topPriority.source}</strong>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleAction(topPriority.key)}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                      actionStates[topPriority.key]
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>{actionStates[topPriority.key] ? 'Completed Today' : 'Mark Complete'}</span>
                  </button>

                  <button
                    onClick={() => onNavigate(topPriority.destination)}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    <span>{topPriority.actionLabel || 'Start Action'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 3B. TODAY'S ACTION PLAN (3 to 5 Bounded Actions) */}
          <div className="saas-card p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Today's Preparation Plan</h3>
                <p className="text-xs text-slate-500">Targeted actions derived from your placement readiness gaps</p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">
                {completedTodayCount} of {totalTodayCount} Done
              </span>
            </div>

            {plan.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <CheckSquare className="w-6 h-6 text-indigo-600" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-900">No Preparation Plan Available</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Complete your first assessment to generate a personalized preparation plan.
                  </p>
                </div>
                <button
                  onClick={() => onNavigate('assessments')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer mt-2"
                >
                  <span>Take First Assessment</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {plan.map((action, idx) => {
                  const isDone = Boolean(actionStates[action.key]);
                  return (
                    <div
                      key={action.id || idx}
                      className={`p-4 rounded-xl border transition-all ${
                        isDone
                          ? 'bg-slate-50/80 border-slate-200 opacity-75'
                          : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-2xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          {/* Interactive Checkbox */}
                          <button
                            onClick={() => handleToggleAction(action.key)}
                            disabled={togglingKey === action.key}
                            className={`w-5 h-5 rounded mt-0.5 flex items-center justify-center transition-colors cursor-pointer ${
                              isDone
                                ? 'bg-emerald-600 text-white border border-emerald-600'
                                : 'border border-slate-300 hover:border-indigo-500 bg-white'
                            }`}
                            title={isDone ? 'Mark as incomplete' : 'Mark as completed'}
                          >
                            {isDone && <CheckCircle2 className="w-4 h-4" />}
                          </button>

                          <div className="min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                                action.priority === 'P0' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                                action.priority === 'P1' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                                action.priority === 'P2' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                action.priority === 'P3' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                                action.priority === 'P4' ? 'bg-sky-50 text-sky-700 border border-sky-100' :
                                'bg-slate-100 text-slate-600'
                              }`}>
                                {action.priority} • {action.priorityLabel}
                              </span>
                              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                                {action.category}
                              </span>
                            </div>

                            <h4 className={`text-sm font-bold ${isDone ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                              {action.title}
                            </h4>

                            <p className="text-xs text-slate-600 leading-relaxed">
                              {action.reason}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                            <Clock className="w-3 h-3" />
                            {action.estimated_minutes}m
                          </span>

                          <button
                            onClick={() => onNavigate(action.destination)}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                          >
                            <span>{action.actionLabel || 'Start'}</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                        <span>Source: <strong className="text-slate-500">{action.source}</strong></span>
                        {isDone && <span className="text-emerald-600 font-semibold">Done for today</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ================================================================== */}
        {/* RIGHT COLUMN: STREAK, INSIGHTS, UPCOMING & SUMMARY (4 Cols) */}
        {/* ================================================================== */}
        <div className="lg:col-span-4 space-y-6">

          {/* 3C. Preparation Streak & Consistency */}
          <div className="saas-card p-5 space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center">
                  <Flame className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  CONSISTENCY STREAK
                </h3>
              </div>
              <Badge variant={streak.hasStreak ? 'warning' : 'neutral'} size="xs">
                {streak.hasStreak ? 'Active' : 'Unstarted'}
              </Badge>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {streak.currentStreak}
              </span>
              <span className="text-xs font-bold text-slate-500 uppercase">
                {streak.currentStreak === 1 ? 'Day' : 'Days'}
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {streak.message}
            </p>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span>Today's Actions:</span>
              <strong className="text-slate-700">{completedTodayCount} of {totalTodayCount} Complete</strong>
            </div>
          </div>

          {/* 3D. Grounded Preparation Insights */}
          <div className="saas-card p-5 space-y-3">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                PREPARATION INSIGHTS
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              {/* Strongest Improvement (only shown when 2 real points exist) */}
              {insights.strongestImprovement && (
                <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-200/80 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                    Strongest Improvement
                  </span>
                  <p className="text-emerald-950 font-medium leading-relaxed">
                    {insights.strongestImprovement.message}
                  </p>
                </div>
              )}

              {/* Biggest Blocker */}
              {insights.biggestBlocker && (
                <div className="p-3 rounded-lg bg-rose-50/60 border border-rose-200/80 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 block">
                    Biggest Blocker
                  </span>
                  <p className="text-rose-950 font-medium leading-relaxed">
                    {insights.biggestBlocker.message}
                  </p>
                </div>
              )}

              {/* Recommended Focus */}
              {insights.recommendedFocus && (
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Recommended Focus
                  </span>
                  <p className="text-slate-800 font-medium leading-relaxed">
                    {insights.recommendedFocus}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 3E. Upcoming Deadlines & Scheduled Events */}
          <div className="saas-card p-5 space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  UPCOMING DEADLINES
                </h3>
              </div>
              <button
                onClick={() => onNavigate('applications')}
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
              >
                Pipeline →
              </button>
            </div>

            {(() => {
              const appsWithDates = (prepData?.applications || []).filter(a => a.interview_date || a.assessment_date || a.next_action_date);
              if (appsWithDates.length === 0) {
                return (
                  <p className="text-xs text-slate-500 py-3 text-center">
                    Nothing scheduled yet. Explore placement drives to apply.
                  </p>
                );
              }

              return (
                <div className="space-y-2">
                  {appsWithDates.slice(0, 3).map((app, i) => {
                    const date = app.interview_date || app.assessment_date || app.next_action_date;
                    const eventType = app.interview_date ? 'Interview Round' : (app.assessment_date ? 'Assessment' : 'Scheduled Action');
                    return (
                      <div key={i} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                        <div className="min-w-0">
                          <span className="font-bold text-slate-900 block truncate">{app.company_name}</span>
                          <span className="text-[11px] text-slate-500">{eventType}</span>
                        </div>
                        <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded shrink-0">
                          {new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>

          {/* 3F. Weekly Preparation Summary */}
          <div className="saas-card p-5 space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                WEEKLY SUMMARY (7 DAYS)
              </h3>
              <span className="text-[10px] font-semibold text-slate-400">Verified Activity</span>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              <div className="py-2 flex items-center justify-between">
                <span className="text-slate-600">Actions Completed:</span>
                <strong className="text-slate-900">{weeklySummary.actionsCompleted ?? 0}</strong>
              </div>
              <div className="py-2 flex items-center justify-between">
                <span className="text-slate-600">Assessments Taken:</span>
                <strong className="text-slate-900">{weeklySummary.assessmentsCompleted ?? 0}</strong>
              </div>
              <div className="py-2 flex items-center justify-between">
                <span className="text-slate-600">Mock Interviews:</span>
                <strong className="text-slate-900">{weeklySummary.interviewsCompleted ?? 0}</strong>
              </div>
              <div className="py-2 flex items-center justify-between">
                <span className="text-slate-600">Resume Scans:</span>
                <strong className="text-slate-900">{weeklySummary.resumesUpdated ?? 0}</strong>
              </div>
              <div className="py-2 flex items-center justify-between">
                <span className="text-slate-600">Applications Submitted:</span>
                <strong className="text-slate-900">{weeklySummary.applicationsSubmitted ?? 0}</strong>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
