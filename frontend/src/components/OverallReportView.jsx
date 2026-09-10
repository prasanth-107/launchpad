import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  Award, 
  Calendar,
  ChevronUp,
  Download,
  Share2
} from 'lucide-react';
import { StatCard } from './ui/StatCard';
import { ProgressBar } from './ui/ProgressBar';
import { Badge } from './ui/Badge';

export default function OverallReportView({ dashboardData }) {
  const readiness = dashboardData?.readiness || {};
  const overallScore = readiness.placement_readiness || 78;

  // Monthly readiness progression
  const monthlyTrend = [
    { month: 'May', score: 45 },
    { month: 'Jun', score: 54 },
    { month: 'Jul', score: 62 },
    { month: 'Aug', score: 71 },
    { month: 'Sep (Current)', score: overallScore }
  ];

  // Assessment score distribution
  const assessmentHistory = [
    { subject: 'Data Structures & Algorithms', attempts: 5, avgScore: 76, highest: 90, status: 'Passed' },
    { subject: 'SQL & Relational Databases', attempts: 4, avgScore: 68, highest: 82, status: 'Review Needed' },
    { subject: 'JavaScript Core & ES6', attempts: 6, avgScore: 84, highest: 95, status: 'Proficient' },
    { subject: 'Quantitative Aptitude', attempts: 4, avgScore: 72, highest: 85, status: 'Passed' },
    { subject: 'Logical Reasoning & Puzzles', attempts: 3, avgScore: 78, highest: 88, status: 'Passed' },
    { subject: 'HR Behavioral STAR Questions', attempts: 5, avgScore: 75, highest: 85, status: 'Passed' }
  ];

  return (
    <div className="space-y-6 text-left">
      
      {/* Header with Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Overall Placement Analytics Report
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Historical progression, assessment performance, and interview readiness telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* High-level summary row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={TrendingUp}
          label="Readiness Growth"
          value="+33%"
          trend="Over 5 months"
          trendType="positive"
          subtitle="45% → 78%"
        />
        <StatCard
          icon={CheckCircle2}
          label="Assessments Cleared"
          value="27 / 32"
          trend="84.3% Pass rate"
          trendType="positive"
          subtitle="Across technical & logic"
        />
        <StatCard
          icon={Award}
          label="Highest Score"
          value="95%"
          trend="JavaScript ES6+"
          trendType="positive"
          subtitle="Top 5% in cohort"
        />
        <StatCard
          icon={Clock}
          label="Total Study Time"
          value="38.5 hrs"
          trend="On track"
          trendType="neutral"
          subtitle="Avg 1.2 hrs/day"
        />
      </div>

      {/* Trend & Growth Visualizer */}
      <div className="saas-card p-6 sm:p-7">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">Placement Readiness Progression Trend</h3>
            <p className="text-xs text-slate-500">Monthly progression benchmarked against campus drive eligibility</p>
          </div>
          <span className="text-xs font-semibold text-emerald-600 inline-flex items-center gap-1">
            <ChevronUp className="w-4 h-4" />
            +7% This Month
          </span>
        </div>

        {/* Clean Bar Chart Representation */}
        <div className="grid grid-cols-5 gap-4 pt-8 pb-4 items-end max-w-2xl mx-auto h-48">
          {monthlyTrend.map((item, idx) => (
            <div key={idx} className="flex flex-col items-center gap-2 h-full justify-end">
              <span className="text-xs font-bold text-slate-700">{item.score}%</span>
              <div 
                className={`w-full max-w-[48px] rounded-t-lg transition-all ${
                  idx === monthlyTrend.length - 1 ? 'bg-indigo-600' : 'bg-indigo-200 hover:bg-indigo-300'
                }`}
                style={{ height: `${item.score * 1.5}px` }}
              />
              <span className="text-[11px] font-medium text-slate-500 whitespace-nowrap mt-1">{item.month}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Assessment Performance Data Table */}
      <div className="saas-card p-6 sm:p-7 overflow-hidden">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">Assessment Performance Matrix</h3>
            <p className="text-xs text-slate-500">Subject-wise scoring breakdown and attempt frequency</p>
          </div>
          <span className="text-xs font-mono text-slate-400">6 Domains Tracked</span>
        </div>

        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-semibold border-y border-slate-200">
              <tr>
                <th className="p-3">Assessment Domain</th>
                <th className="p-3">Attempts</th>
                <th className="p-3">Average Score</th>
                <th className="p-3">Peak Score</th>
                <th className="p-3">Competency Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {assessmentHistory.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                  <td className="p-3 font-semibold text-slate-900">{row.subject}</td>
                  <td className="p-3 font-mono">{row.attempts} tests</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{row.avgScore}%</span>
                      <div className="w-20 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${row.avgScore}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="p-3 font-mono text-emerald-600 font-bold">{row.highest}%</td>
                  <td className="p-3">
                    <Badge variant={row.status.includes('Proficient') ? 'success' : row.status.includes('Passed') ? 'primary' : 'warning'} size="xs">
                      {row.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
