'use client';

import React from 'react';
import { Smartphone, Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-950/60 text-zinc-600 dark:text-zinc-400 py-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center text-white shrink-0">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-zinc-900 dark:text-zinc-100 text-sm block">
                CrazyStore Showcase
              </span>
              <p className="text-xs text-zinc-500 dark:text-zinc-500">
                Crafted with Next.js 15, Tailwind CSS & Supabase
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <a href="https://linkedin.com/in/shubham-boghara-60b4a1343" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 hover:text-purple-600 transition-colors" aria-label="LinkedIn">
              <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
            </a>
            <a href="https://instagram.com/shubhambogharadotcom" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 hover:text-purple-600 transition-colors" aria-label="Instagram">
              <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
            </a>
            <a href="https://github.com/shubhmboghara/" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 hover:text-purple-600 transition-colors" aria-label="GitHub">
              <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
            </a>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <p>© {new Date().getFullYear()} Shubham Boghara. Open-source Android showcase.</p>
          <p className="flex items-center gap-1">
            Built with <Heart className="w-3.5 h-3.5 text-purple-500 fill-purple-500" /> for Android Developers & Users
          </p>
        </div>
      </div>
    </footer>
  );
}
