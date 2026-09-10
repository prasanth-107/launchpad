import React from 'react';
import { Inbox } from 'lucide-react';

export function EmptyState({ 
  icon: Icon = Inbox, 
  title = 'No records found', 
  description = 'There is currently no data to display for this section.', 
  actionLabel, 
  onAction,
  className = ''
}) {
  return (
    <div className={`p-8 sm:p-12 text-center rounded-xl bg-white border border-dashed border-slate-200 flex flex-col items-center justify-center ${className}`}>
      <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mb-3 shadow-2xs">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-bold text-slate-800 tracking-tight">{title}</h3>
      <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
