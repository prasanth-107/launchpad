import React from 'react';

export function Skeleton({ className = '' }) {
  return (
    <div className={`animate-pulse bg-slate-200/80 rounded-md ${className}`} />
  );
}

export function StatCardSkeleton() {
  return (
    <div className="saas-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <Skeleton className="h-7 w-16" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

export function TableRowSkeleton({ cols = 5 }) {
  return (
    <div className="py-3 px-4 flex items-center justify-between gap-4 border-b border-slate-100">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} className={`h-4 ${i === 0 ? 'w-48' : 'w-20'}`} />
      ))}
    </div>
  );
}
