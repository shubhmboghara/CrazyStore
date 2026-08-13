'use client';

import React from 'react';
import { Smartphone } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
      <div className="max-w-7xl mx-auto px-6 sm:px-12 lg:px-24 py-12 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-zinc-900 dark:text-zinc-100" />
          <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100">
            CrazyStore
          </span>
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          © {new Date().getFullYear()} CrazyStore. All rights reserved. Open Source.
        </p>
      </div>
    </footer>
  );
}

