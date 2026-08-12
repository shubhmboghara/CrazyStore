'use client';

import React from 'react';

export function ReviewSkeleton() {
  return (
    <div className="space-y-4" id="review-skeletons">
      {[1, 2, 3].map((index) => (
        <div
          key={index}
          className="p-5 rounded-2xl bg-zinc-100 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 animate-pulse space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-zinc-300 dark:bg-zinc-800" />
              <div className="space-y-1.5">
                <div className="w-28 h-3.5 rounded bg-zinc-300 dark:bg-zinc-800" />
                <div className="w-20 h-3 rounded bg-zinc-200 dark:bg-zinc-800/80" />
              </div>
            </div>
            <div className="w-24 h-4 rounded bg-zinc-300 dark:bg-zinc-800" />
          </div>
          <div className="space-y-2 pt-1">
            <div className="w-full h-3 rounded bg-zinc-200 dark:bg-zinc-800/80" />
            <div className="w-4/5 h-3 rounded bg-zinc-200 dark:bg-zinc-800/80" />
          </div>
        </div>
      ))}
    </div>
  );
}
