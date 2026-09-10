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
  TrendingUp
} from 'lucide-react';
import { ProgressBar } from './ui/ProgressBar';
import { Badge } from './ui/Badge';

export default function PlacementReadinessView({ dashboardData, onNavigate }) {
  const readiness = dashboardData?.readiness || {};
  const score = dashboardData?.placementReadiness !== undefined 
    ? dashboardData.placementReadiness 
    : (readiness.placement_readiness ?? null);
  const hasScore = score !== null && score !== undefined && Number(score) > 0;

  const dimensions = [
    {
      name: 'Technical Skills',
      weight: '25%',
      score: hasScore ? (readiness.technical_score || 80) : 0,
      benchmark: '80%',
      color: 'indigo',
      desc: 'Algorithms, Data Structures, OOP, SQL, and system problem-solving.'
    },
    {
      name: 'Quantitative Aptitude & Logic',
      weight: '20%',
      score: hasScore ? (readiness.aptitude_score || 72) : 0,
      benchmark: '75%',
      color: 'sky',
      desc: 'Speed math, analytical puzzle resolution, and logical deductions.'
    },
    {
      name: 'Communication & Presentation',
      weight: '15%',
      score: hasScore ? (readiness.communication_score || 65) : 0,
      benchmark: '70%',
      color: 'purple',
      desc: 'STAR framework fluency, articulate expression, and active listening.'
    },
    {
      name: 'Mock Interview Performance',
      weight: '15%',
      score: hasScore ? (readiness.interview_score || 75) : 0,
      benchmark: '75%',
      color: 'amber',
      desc: 'Confidence, technical depth, and answer relevance in live simulations.'
    },
    {
      name: 'Resume ATS Verification',
      weight: '15%',
      score: hasScore ? (readiness.resume_score || 92) : 0,
      benchmark: '85%',
      color: 'emerald',
      desc: 'Role keyword density, measurable metrics, and clean formatting.'
    },
    {
      name: 'Projects & Applied Portfolio',
      weight: '10%',
      score: hasScore ? 82 : 0,
      benchmark: '75%',
      color: 'indigo',
      desc: 'Production deployment, clean GitHub repositories, and architectural complexity.'
    }
  ];

  return (
    <div className="space-y-6 text-left">
      
      {/* Header */}
      <div className="pb-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Placement Readiness Assessment
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Detailed multi-dimensional breakdown evaluated against campus hiring thresholds.
        </p>
      </div>

      {/* Main Score Hero Card */}
      <div className="saas-card p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              OVERALL PLACEMENT READINESS
            </span>
            {hasScore ? (
              <div className="flex items-baseline gap-3 mt-1">
                <span className="text-5xl sm:text-6xl font-black text-slate-900 tracking-tight">
                  {score}%
                </span>
                <Badge variant={score >= 75 ? 'success' : 'primary'} size="md">
                  {score >= 75 ? 'Ready for Campus Placements' : 'Almost Ready'}
                </Badge>
              </div>
            ) : (
              <div className="mt-2 mb-1">
                <span className="text-2xl sm:text-3xl font-bold text-slate-700 tracking-tight block">
                  Readiness score not available yet
                </span>
                <Badge variant="neutral" size="sm" className="mt-1.5">
                  Assessments Required
                </Badge>
              </div>
            )}
            <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-xl">
              {hasScore 
                ? 'You meet the qualification threshold for Tier-1 and Tier-2 product engineering recruitment drives. Strengthen Communication to hit the top 10% bracket.'
                : 'Complete assessments to calculate your readiness score and benchmark your competencies against campus recruiters.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <button
              onClick={() => onNavigate('assessments')}
              className="px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-xs transition-colors"
            >
              Take Skill Test
            </button>
            <button
              onClick={() => onNavigate('interview')}
              className="px-4 py-2.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm shadow-xs transition-colors"
            >
              Simulate Interview
            </button>
          </div>
        </div>

        {/* Linear Progress Indicator */}
        <div className="pt-6">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2 font-medium">
            <span>Progress toward 100% Placement Preparedness</span>
            <span className="font-bold text-slate-900">{score}% Complete</span>
          </div>
          <ProgressBar value={score} size="md" color="indigo" showPercentage={false} />
          <div className="flex justify-between text-[11px] text-slate-400 mt-2">
            <span>0% Developing</span>
            <span>60% Baseline Threshold</span>
            <span>75% Placement Ready 🎯</span>
            <span>100% Tier-1 Elite</span>
          </div>
        </div>
      </div>

      {/* Dimensional Breakdown Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dimensions.map((dim) => {
          const isAbove = dim.score >= parseInt(dim.benchmark);
          return (
            <div key={dim.name} className="saas-card p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                    Weight: {dim.weight}
                  </span>
                  <Badge variant={isAbove ? 'success' : 'warning'} size="xs">
                    {isAbove ? 'Meets Benchmark' : 'Improvement Needed'}
                  </Badge>
                </div>

                <h3 className="text-sm font-bold text-slate-900">{dim.name}</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{dim.desc}</p>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Current Score</span>
                  <span className="font-bold text-slate-900">{dim.score}%</span>
                </div>
                <ProgressBar value={dim.score} size="sm" color={dim.color} showPercentage={false} />
                <div className="flex justify-between text-[10px] text-slate-400 pt-0.5">
                  <span>Target Benchmark: {dim.benchmark}</span>
                  <span>{isAbove ? `+${dim.score - parseInt(dim.benchmark)}% Ahead` : `${parseInt(dim.benchmark) - dim.score}% Gap`}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Actionable Next Steps Summary */}
      <div className="saas-card p-6 sm:p-7">
        <h3 className="text-base font-bold text-slate-900 mb-2">What you should improve next to reach 85%+</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 text-xs">
          {[
            { step: '1', title: 'Improve SQL Queries', detail: 'Complete subquery & normalization module', action: 'assessments' },
            { step: '2', title: 'Practice DSA Trees', detail: 'Review binary search trees on LeetCode', action: 'dsa-sheets' },
            { step: '3', title: 'Refine STAR Delivery', detail: 'Simulate HR behavioral interview', action: 'interview' },
            { step: '4', title: 'ATS Metrics Polish', detail: 'Quantify project results on resume', action: 'resume' }
          ].map((item) => (
            <div key={item.step} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
              <div>
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[11px] mb-2">
                  {item.step}
                </span>
                <p className="font-bold text-slate-800">{item.title}</p>
                <p className="text-[11px] text-slate-500 mt-1">{item.detail}</p>
              </div>
              <button
                onClick={() => onNavigate(item.action)}
                className="mt-3 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1"
              >
                <span>Take Action</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
