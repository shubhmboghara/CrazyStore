'use client';

import React from 'react';
import Link from 'next/link';
import { Smartphone } from 'lucide-react';

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link
          href="/"
          id="nav-logo"
          className="flex items-center gap-3 group transition-transform hover:scale-[1.02]"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-purple-500 p-0.5 shadow-md shadow-purple-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-zinc-950 rounded-[10px] flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-purple-400 group-hover:rotate-6 transition-transform" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg text-zinc-900 dark:text-zinc-100 tracking-tight">
                CrazyStore
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50">
                Android
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 -mt-1 hidden sm:block">
              Kotlin & Jetpack Compose Apps
            </p>
          </div>
        </Link>

        {/* Right side controls */}
        <div className="flex items-center gap-3">
        </div>
      </div>
    </header>
  );
}
