'use client';

import React from 'react';
import { Smartphone } from 'lucide-react';
import { FaGithub, FaLinkedin, FaInstagram } from 'react-icons/fa6';

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

        <div className="flex items-center gap-5">
          <a href="https://github.com/shubhmboghara" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors" aria-label="GitHub">
            <FaGithub className="w-5 h-5" />
          </a>
          <a href="https://linkedin.com/in/shubham-boghara-60b4a1343" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors" aria-label="LinkedIn">
            <FaLinkedin className="w-5 h-5" />
          </a>
          <a href="https://instagram.com/shubhambogharadotcom" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors" aria-label="Instagram">
            <FaInstagram className="w-5 h-5" />
          </a>
        </div>
      </div>
    </footer>
  );
}


