'use client';

import React from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

export function AppDetailSkeleton() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col font-sans text-zinc-900 dark:text-zinc-100">
      <Navbar />

      <main className="flex-1 pb-16">
        {/* Top Header Banner Skeleton */}
        <section className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 py-10 sm:py-12 animate-pulse">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Back Button Skeleton */}
            <div className="w-28 h-4 rounded-lg bg-zinc-200 dark:bg-zinc-800 mb-6" />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex items-start gap-5 w-full sm:w-auto">
                {/* Large App Icon */}
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-zinc-200 dark:bg-zinc-800 shrink-0" />

                <div className="space-y-2.5 flex-1 max-w-xl">
                  {/* Badges */}
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-5 rounded-md bg-purple-100 dark:bg-purple-950/50" />
                    <div className="w-14 h-5 rounded-md bg-zinc-200 dark:bg-zinc-800" />
                  </div>

                  {/* Title */}
                  <div className="w-48 sm:w-64 h-8 rounded-xl bg-zinc-200 dark:bg-zinc-800" />

                  {/* Tagline */}
                  <div className="w-full sm:w-80 h-4 rounded bg-zinc-100 dark:bg-zinc-800/70" />

                  {/* Rating Stars */}
                  <div className="flex items-center gap-2 pt-1">
                    <div className="w-28 h-4 rounded bg-amber-100 dark:bg-amber-950/40" />
                    <div className="w-12 h-4 rounded bg-zinc-200 dark:bg-zinc-800" />
                  </div>
                </div>
              </div>

              {/* Action Buttons Skeleton */}
              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <div className="w-36 h-12 rounded-2xl bg-purple-200 dark:bg-purple-900/40" />
                <div className="w-28 h-12 rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
                <div className="w-12 h-12 rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
              </div>
            </div>
          </div>
        </section>

        {/* Media / Screenshots Carousel Skeleton */}
        <section className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-44 h-5 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
              <div className="w-20 h-4 rounded-md bg-zinc-200 dark:bg-zinc-800" />
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="w-56 sm:w-64 h-96 rounded-3xl bg-zinc-200 dark:bg-zinc-800/80 shrink-0 animate-pulse border border-zinc-200/80 dark:border-zinc-800"
                />
              ))}
            </div>
          </div>
        </section>

        {/* Content Section: 2 Columns */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column (8 cols): Overview & Features */}
            <div className="lg:col-span-8 space-y-6">
              {/* Overview Card */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-4 animate-pulse">
                <div className="w-36 h-6 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
                <div className="space-y-2">
                  <div className="w-full h-4 rounded bg-zinc-100 dark:bg-zinc-800/70" />
                  <div className="w-full h-4 rounded bg-zinc-100 dark:bg-zinc-800/70" />
                  <div className="w-3/4 h-4 rounded bg-zinc-100 dark:bg-zinc-800/70" />
                </div>
              </div>

              {/* Key Features Card */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-4 animate-pulse">
                <div className="w-32 h-6 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[1, 2, 3, 4].map((f) => (
                    <div
                      key={f}
                      className="p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800/50 flex items-center gap-3"
                    >
                      <div className="w-5 h-5 rounded-full bg-purple-200 dark:bg-purple-900/60 shrink-0" />
                      <div className="w-3/4 h-4 rounded bg-zinc-200 dark:bg-zinc-800" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Technical Specifications Card */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-4 animate-pulse">
                <div className="w-48 h-6 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((spec) => (
                    <div key={spec} className="p-3.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800/50 space-y-1.5">
                      <div className="w-16 h-3 rounded bg-zinc-200 dark:bg-zinc-800" />
                      <div className="w-20 h-4 rounded bg-zinc-300 dark:bg-zinc-700" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column (4 cols): Quick Download & Reviews Skeleton */}
            <div className="lg:col-span-4 space-y-6">
              {/* Quick Download Card */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 space-y-4 animate-pulse">
                <div className="w-32 h-5 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
                <div className="w-full h-12 rounded-2xl bg-purple-200 dark:bg-purple-900/40" />
                <div className="w-4/5 h-3 rounded bg-zinc-100 dark:bg-zinc-800/60 mx-auto" />
              </div>

              {/* Reviews Summary Skeleton */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 space-y-4 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="w-36 h-5 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
                  <div className="w-14 h-4 rounded bg-zinc-200 dark:bg-zinc-800" />
                </div>
                <div className="flex items-center gap-4 py-2">
                  <div className="w-16 h-12 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
                  <div className="space-y-1 flex-1">
                    <div className="w-24 h-4 rounded bg-amber-100 dark:bg-amber-950/40" />
                    <div className="w-16 h-3 rounded bg-zinc-100 dark:bg-zinc-800/60" />
                  </div>
                </div>
                {/* Rating bars */}
                <div className="space-y-2 pt-2">
                  {[5, 4, 3, 2, 1].map((star) => (
                    <div key={star} className="flex items-center gap-2">
                      <div className="w-6 h-3 rounded bg-zinc-200 dark:bg-zinc-800" />
                      <div className="flex-1 h-2 rounded-full bg-zinc-100 dark:bg-zinc-800" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
