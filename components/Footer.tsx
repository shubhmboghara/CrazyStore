'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { FaGithub, FaLinkedin, FaInstagram } from 'react-icons/fa6';
import { NavLogo3D } from '@/components/three';

export function Footer() {
  return (
    <footer className="border-t border-zinc-800 bg-zinc-950 text-zinc-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Brand & Tagline */}
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 text-center sm:text-left">
            <Link href="/" className="flex items-center gap-2.5 group">
              <NavLogo3D size="sm" />
              <span className="font-extrabold text-base text-zinc-100 tracking-tight group-hover:text-purple-300 transition-colors">
                CrazyStore
              </span>
            </Link>
            <span className="hidden sm:inline text-zinc-700">|</span>
            <p className="text-xs text-zinc-400">
              Curated, open-source Android apps built with Kotlin &amp; Compose. Free forever.
            </p>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-3">
            <a
              href="https://github.com/shubhmboghara/CrazyStore"
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-xl bg-zinc-900 hover:bg-purple-950/60 hover:text-purple-400 text-zinc-300 flex items-center justify-center transition-colors border border-zinc-800 focus-visible:ring-2 focus-visible:ring-purple-400"
              aria-label="GitHub Repository"
            >
              <FaGithub className="w-4 h-4" />
            </a>
            <a
              href="https://linkedin.com/in/shubham-boghara-60b4a1343"
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-xl bg-zinc-900 hover:bg-purple-950/60 hover:text-purple-400 text-zinc-300 flex items-center justify-center transition-colors border border-zinc-800 focus-visible:ring-2 focus-visible:ring-purple-400"
              aria-label="LinkedIn"
            >
              <FaLinkedin className="w-4 h-4" />
            </a>
            <a
              href="https://instagram.com/shubhambogharadotcom"
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-xl bg-zinc-900 hover:bg-purple-950/60 hover:text-purple-400 text-zinc-300 flex items-center justify-center transition-colors border border-zinc-800 focus-visible:ring-2 focus-visible:ring-purple-400"
              aria-label="Instagram"
            >
              <FaInstagram className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-zinc-800/80 mt-6 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500">
          <div>
            &copy; {new Date().getFullYear()} CrazyStore. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" /> All APKs VirusTotal Scanned
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
