import React from 'react';

export function StatCard({ icon: Icon, label, value, trend, trendType = 'neutral', subtitle, className = '', onClick }) {
  const trendColors = {
    positive: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    negative: 'text-rose-700 bg-rose-50 border-rose-200',
    warning: 'text-amber-700 bg-amber-50 border-amber-200',
    neutral: 'text-slate-600 bg-slate-100 border-slate-200'
  };

  return (
    <div 
      onClick={onClick}
      className={`saas-card p-5 transition-all text-left flex flex-col justify-between ${
        onClick ? 'cursor-pointer hover:border-indigo-300 hover:shadow-xs' : 'hover:border-slate-300'
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </span>
        {Icon && (
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-2">
        <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          {value}
        </span>
        {trend && (
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${trendColors[trendType] || trendColors.neutral}`}>
            {trend}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="text-xs text-slate-500 mt-1 font-normal">
          {subtitle}
        </p>
      )}
    </div>
  );
}
