import React from 'react';

export function ProgressBar({ value = 0, max = 100, label, showPercentage = true, color = 'indigo', size = 'sm', className = '' }) {
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  const colorStyles = {
    indigo: 'bg-indigo-600',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
    purple: 'bg-purple-600',
    sky: 'bg-sky-500'
  };

  const heightStyles = {
    xs: 'h-1.5',
    sm: 'h-2',
    md: 'h-2.5',
    lg: 'h-3'
  };

  return (
    <div className={`w-full ${className}`}>
      {(label || showPercentage) && (
        <div className="flex items-center justify-between text-xs text-slate-600 font-medium mb-1.5">
          {label && <span>{label}</span>}
          {showPercentage && <span className="font-semibold text-slate-800">{percentage}%</span>}
        </div>
      )}
      <div className={`w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/60 ${heightStyles[size] || heightStyles.sm}`}>
        <div 
          className={`h-full rounded-full transition-all duration-500 ${colorStyles[color] || colorStyles.indigo}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
