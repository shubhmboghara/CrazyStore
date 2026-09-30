'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Smartphone, Menu, X, Sparkles } from 'lucide-react';
import { FaGithub } from 'react-icons/fa6';
import { NavLogo3D } from '@/components/three';

export function Navbar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isHomeRoute = pathname === '/';

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo with Three.js 3D Emblem */}
        <Link
          href="/"
          id="nav-logo"
          className="flex items-center gap-3 group transition-transform hover:scale-[1.02]"
        >
          <NavLogo3D />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg text-zinc-100 tracking-tight flex items-center gap-1">
                CrazyStore
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800/50">
                3D FOSS
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 -mt-1 hidden sm:block">
              Open-Source 3D Kotlin Store
            </p>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          <Link
            href="/"
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              isHomeRoute
                ? 'bg-purple-950/60 text-purple-300'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            Storefront
          </Link>

          <Link
            href="/#catalog"
            className="px-3 py-1.5 rounded-xl text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all"
          >
            Categories
          </Link>

          <Link
            href="/apps/videohub"
            className="px-3 py-1.5 rounded-xl text-xs font-bold text-purple-300 bg-purple-950/40 hover:bg-purple-900/60 border border-purple-800/40 transition-all flex items-center gap-1.5"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
            3D Studio
          </Link>
        </nav>

        {/* Right side controls */}
        <div className="flex items-center gap-2.5">
          {/* GitHub Repo */}
          <a
            href="https://github.com/shubhmboghara/CrazyStore"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 transition-all border border-zinc-800"
            aria-label="GitHub Repository"
          >
            <FaGithub className="w-4 h-4" />
          </a>

          {/* Mobile menu hamburger button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-zinc-400 hover:bg-zinc-900"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-zinc-800 bg-zinc-950 px-4 py-4 space-y-2 animate-in slide-in-from-top duration-200">
          <Link
            href="/"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`block px-4 py-2.5 rounded-xl text-sm font-bold ${
              isHomeRoute
                ? 'bg-purple-950/60 text-purple-300'
                : 'text-zinc-300'
            }`}
          >
            🛍️ Storefront & Discover
          </Link>

          <Link
            href="/#catalog"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block px-4 py-2.5 rounded-xl text-sm font-bold text-zinc-300 hover:bg-zinc-900"
          >
            📂 Browse Categories
          </Link>

          <Link
            href="/apps/videohub"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block px-4 py-2.5 rounded-xl text-sm font-bold text-purple-300 bg-purple-950/40 hover:bg-purple-900/60 border border-purple-800/40"
          >
            📱 3D Device Studio
          </Link>
        </div>
      )}
    </header>
  );
}
