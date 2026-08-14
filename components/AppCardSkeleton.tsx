'use client';

import React from 'react';

interface AppCardSkeletonProps {
  count?: number;
}

export function AppCardSkeleton({ count = 6 }: AppCardSkeletonProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl p-6 shadow-xs relative overflow-hidden animate-pulse"
        >
          {/* Shimmer overlay gradient effect */}
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-zinc-200/40 dark:via-zinc-800/40 to-transparent pointer-events-none" />

          {/* Top row: Icon + Badges */}
          <div className="flex items-start justify-between mb-6">
            {/* App Icon Box */}
            <div className="w-14 h-14 rounded-2xl bg-zinc-200 dark:bg-zinc-800 shrink-0" />

            {/* Badges / Version */}
            <div className="flex flex-col items-end gap-2">
              <div className="w-14 h-4 rounded-md bg-zinc-200 dark:bg-zinc-800" />
              <div className="w-24 h-4 rounded-md bg-purple-100 dark:bg-purple-950/40" />
            </div>
          </div>

          {/* Title and Tagline */}
          <div className="flex-1 space-y-2.5 mb-6">
            <div className="w-3/4 h-6 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
            <div className="w-full h-3.5 rounded bg-zinc-100 dark:bg-zinc-800/60" />
            <div className="w-5/6 h-3.5 rounded bg-zinc-100 dark:bg-zinc-800/60" />
          </div>

          {/* Bottom row: Rating & View Button */}
          <div className="pt-5 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="w-20 h-3.5 rounded bg-amber-100 dark:bg-amber-950/40" />
              <div className="w-6 h-3 rounded bg-zinc-200 dark:bg-zinc-800" />
            </div>
            <div className="w-20 h-4 rounded bg-purple-100 dark:bg-purple-950/40" />
          </div>
        </div>
      ))}
    </div>
  );
}
