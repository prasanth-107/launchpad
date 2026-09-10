import React from 'react';
import { 
  Target, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle, 
  Award,
  ChevronRight,
  Sparkles,
  TrendingUp,
  Layers,
  FileText,
  Mic2,
  BookOpen,
  HelpCircle,
  BarChart3
} from 'lucide-react';
import { ProgressBar } from './ui/ProgressBar';
import { Badge } from './ui/Badge';
import { computePlacementReadiness } from '../lib/placementReadinessEngine';

export default function PlacementReadinessView({ dashboardData, onNavigate }) {
  // Centralized Readiness Report (Single source of truth)
  const readiness = dashboardData?.readinessReport || dashboardData?.readiness || computePlacementReadiness();
  const score = readiness.score;
  const isEvaluated = readiness.isEvaluated && score !== null && score !== undefined;
  const coverage = readiness.coverage || { available: 0, total: 7, percentage: 0, summary: '0 of 7 pillars' };
  const pillars = readiness.pillars || [];
  const strongest = readiness.strongestArea;
  const priorityGap = readiness.priorityGap;
  const nextAction = readiness.nextAction;

  return (
    <div className="space-y-6 text-left">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Placement Readiness Model</span>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
            <span className="text-xs text-slate-500 font-medium">Data Coverage: {coverage.summary}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Placement Readiness Index
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Transparent 7-pillar recruitment composite with proportional missing-data normalization. Zero fabricated scores.
          </p>
        </div>

        {onNavigate && (
          <button
            onClick={() => onNavigate('assessments')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors shrink-0"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Take Diagnostic Test</span>
          </button>
        )}
      </div>

      {/* Main Score Hero Card */}
      <div className="saas-card p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              OVERALL PLACEMENT READINESS COMPOSITE
            </span>

            {isEvaluated ? (
              <div className="flex items-baseline gap-3 mt-1">
                <span className="text-5xl sm:text-6xl font-black text-slate-900 tracking-tight font-mono">
                  {score}
                </span>
                <span className="text-2xl font-bold text-slate-400 font-mono">/ 100</span>
                <Badge 
                  variant={readiness.statusTier?.variant || 'primary'} 
                  size="md"
                >
                  {readiness.status}
                </Badge>
              </div>
            ) : (
              <div className="flex items-baseline gap-3 mt-1">
                <span className="text-5xl sm:text-6xl font-black text-slate-400 tracking-tight font-mono">
                  --
                </span>
                <span className="text-2xl font-bold text-slate-300 font-mono">/ 100</span>
                <Badge variant="neutral" size="md">
                  Assessment in Progress
                </Badge>
              </div>
            )}

            <p className="text-xs text-slate-500 mt-2 max-w-xl leading-relaxed">
              {isEvaluated ? (
                <>
                  Readiness calculated from <strong>{coverage.available} of {coverage.total} measurable pillars</strong> with proportional weight normalization. Missing pillars do not penalize your score with zero.
                </>
              ) : (
                <>
                  Complete your first diagnostic test, resume audit, or mock interview to begin calculating your Placement Readiness Index.
                </>
              )}
            </p>
          </div>

          {/* Data Coverage & Confidence Widget */}
          <div className="md:text-right space-y-2 shrink-0">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              <span>Data Coverage: <strong>{coverage.available} / {coverage.total} Pillars</strong></span>
            </div>
            <div className="w-48 md:ml-auto">
              <ProgressBar value={coverage.percentage} size="xs" color="indigo" showPercentage={false} />
            </div>
            <span className="block text-[11px] text-slate-400">
              {coverage.percentage >= 70 ? 'High Confidence Audit' : coverage.percentage >= 40 ? 'Moderate Coverage' : 'Preliminary Score'}
            </span>
          </div>
        </div>

        {/* Actionable Next Step Banner */}
        {nextAction && (
          <div className="mt-6 p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Sparkles className="w-4.5 h-4.5" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider block">
                  Recommended Priority Action
                </span>
                <p className="text-xs font-semibold text-indigo-950 mt-0.5">
                  {nextAction.text}
                </p>
              </div>
            </div>

            {onNavigate && (
              <button
                onClick={() => onNavigate(nextAction.targetRoute)}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shrink-0 transition-colors shadow-xs"
              >
                {nextAction.label || 'Take Action'} →
              </button>
            )}
          </div>
        )}
      </div>

      {/* Strengths & Priority Gap Callouts */}
      {isEvaluated && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Strongest Area */}
          <div className="saas-card p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Strongest Evaluated Area</span>
              <h3 className="text-base font-bold text-slate-900 truncate mt-0.5">
                {strongest?.name || '—'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Current score: <strong className="text-emerald-700 font-mono">{strongest?.score}%</strong> (Benchmark: {strongest?.targetBenchmark}%)
              </p>
            </div>
          </div>

          {/* Priority Focus Gap */}
          <div className="saas-card p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block">Priority Focus Area</span>
              <h3 className="text-base font-bold text-slate-900 truncate mt-0.5">
                {priorityGap?.name || 'None'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {priorityGap?.gap > 0 ? (
                  <>Score: <strong className="text-rose-700 font-mono">{priorityGap?.score}%</strong> • Deficit: <strong className="text-rose-700 font-mono">-{priorityGap?.gap}%</strong></>
                ) : (
                  <span className="text-emerald-600 font-semibold">All evaluated pillars cleared benchmark!</span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* The 7 Canonical Placement Pillars Breakdown */}
      <div className="saas-card p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">7-Pillar Competency Breakdown</h3>
            <p className="text-xs text-slate-500">
              Evaluated against real campus hiring requirements. Proportional normalization distributes missing weights.
            </p>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-medium text-slate-500">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Evaluated & Met</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Deficit Gap</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-300" /> Not Evaluated Yet</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pillars.map((pillar) => (
            <div 
              key={pillar.id}
              className={`p-5 rounded-xl border transition-all ${
                pillar.available 
                  ? 'bg-white border-slate-200' 
                  : 'bg-slate-50/60 border-dashed border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900">{pillar.name}</h4>
                    <span className="text-[10px] text-slate-400 font-mono">
                      (Base: {pillar.baseWeight}%)
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{pillar.description}</p>
                </div>

                <div className="text-right shrink-0">
                  {pillar.available ? (
                    <>
                      <span className="text-xl font-black text-slate-900 font-mono">
                        {pillar.score}%
                      </span>
                      <span className="block text-[10px] font-bold text-indigo-600 font-mono">
                        Eff. Weight: {pillar.effectiveWeight}%
                      </span>
                    </>
                  ) : (
                    <Badge variant="neutral" size="xs">
                      Not evaluated yet
                    </Badge>
                  )}
                </div>
              </div>

              {pillar.available ? (
                <div className="mt-3 space-y-1.5">
                  <ProgressBar 
                    value={pillar.score} 
                    size="xs" 
                    color={pillar.score >= pillar.targetBenchmark ? 'emerald' : pillar.score >= 60 ? 'amber' : 'rose'} 
                    showPercentage={false} 
                  />
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                    <span>Target: <strong>{pillar.targetBenchmark}%</strong></span>
                    <span className={pillar.gap === 0 ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                      {pillar.statusLabel}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400 italic">No score recorded in database</span>
                  {onNavigate && (
                    <button
                      onClick={() => onNavigate(pillar.actionTarget)}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                    >
                      {pillar.actionLabel} →
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Placement Tier Guidelines Reference Table */}
      <div className="saas-card p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">Campus Placement Tier Guidelines</h3>
            <p className="text-xs text-slate-500">Benchmark clearance criteria established with university Training & Placement Officers (TPO)</p>
          </div>
          <Badge variant="neutral" size="xs">TPO Benchmarks</Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/30 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-900">90% – 100%</span>
              <Badge variant="success" size="xs">Tier-1 Product</Badge>
            </div>
            <p className="font-semibold text-emerald-800">Placement Ready</p>
            <p className="text-[11px] text-slate-500">Shortlist probability &gt; 85% for Google, Microsoft, Amazon, Atlassian.</p>
          </div>

          <div className="p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/30 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-indigo-900">75% – 89%</span>
              <Badge variant="primary" size="xs">Tier-2 High Growth</Badge>
            </div>
            <p className="font-semibold text-indigo-800">Almost Ready</p>
            <p className="text-[11px] text-slate-500">Qualified for high-growth tech startups, unicorn firms, and Fintech roles.</p>
          </div>

          <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/30 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-900">60% – 74%</span>
              <Badge variant="warning" size="xs">Services & Core</Badge>
            </div>
            <p className="font-semibold text-amber-800">Needs Improvement</p>
            <p className="text-[11px] text-slate-500">Qualified for IT services and core engineering; targeted drills recommended.</p>
          </div>

          <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/30 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-rose-900">&lt; 60%</span>
              <Badge variant="danger" size="xs">Preparation</Badge>
            </div>
            <p className="font-semibold text-rose-800">Needs Significant Prep</p>
            <p className="text-[11px] text-slate-500">Requires foundational course enrollment before initial campus screening rounds.</p>
          </div>
        </div>
      </div>

    </div>
  );
}
