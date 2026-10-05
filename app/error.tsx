'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, RotateCcw, Home } from 'lucide-react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App-level error boundary caught error:', error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 sm:p-6 text-zinc-100">
      <div className="w-full max-w-md p-8 rounded-3xl bg-zinc-900 border border-zinc-800 text-center space-y-5 shadow-2xl animate-in fade-in">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-950/60 border border-rose-800/50 flex items-center justify-center text-rose-400">
          <AlertCircle className="w-6 h-6" />
        </div>

        <div className="space-y-1">
          <h2 className="text-xl font-black text-zinc-100">Application Error</h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            We encountered a temporary issue while displaying this page. You can try refreshing the component.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/25 transition-all cursor-pointer flex items-center justify-center gap-1.5 focus-visible:ring-2 focus-visible:ring-purple-400"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs transition-all border border-zinc-700/50 flex items-center justify-center gap-1.5 focus-visible:ring-2 focus-visible:ring-purple-400"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Storefront</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
