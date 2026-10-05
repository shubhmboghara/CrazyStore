'use client';

import React from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-4 font-sans antialiased">
        <div className="w-full max-w-md p-8 rounded-3xl bg-zinc-900 border border-zinc-800 text-center space-y-5 shadow-2xl">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-950/60 border border-rose-800/50 flex items-center justify-center text-rose-400 font-bold text-xl">
            !
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-black text-zinc-100">Something Went Wrong</h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              An unexpected error occurred while rendering the page. You can attempt to recover by retrying.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => reset()}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/25 transition-all cursor-pointer"
            >
              Try Again
            </button>
            <a
              href="/"
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs transition-all border border-zinc-700/50"
            >
              Return Home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
