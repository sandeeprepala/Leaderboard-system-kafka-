import React from 'react';

export function StatSkeleton() {
  return (
    <div className="glass-card rounded-2xl p-6 animate-pulse border border-white/[0.08]">
      <div className="h-4 bg-white/10 rounded w-1/3 mb-4" />
      <div className="h-8 bg-white/10 rounded w-2/3" />
    </div>
  );
}

export function ListSkeleton({ rows = 5 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, idx) => (
        <div key={idx} className="glass rounded-xl p-4 flex items-center justify-between animate-pulse border border-white/[0.06]">
          <div className="flex items-center gap-3 w-1/2">
            <div className="w-8 h-8 bg-white/10 rounded-full" />
            <div className="h-4 bg-white/10 rounded w-2/3" />
          </div>
          <div className="h-4 bg-white/10 rounded w-16" />
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="glass-card rounded-2xl p-6 animate-pulse border border-white/[0.08]">
      <div className="h-6 bg-white/10 rounded w-1/2 mb-4" />
      <div className="h-4 bg-white/10 rounded w-full mb-2" />
      <div className="h-4 bg-white/10 rounded w-5/6 mb-6" />
      <div className="h-10 bg-white/10 rounded w-1/3" />
    </div>
  );
}
