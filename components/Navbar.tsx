'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Search, ShieldCheck, Sparkles, Layers } from 'lucide-react';
import { NavLogo3D } from '@/components/three';
import { CommandPalette } from '@/components/CommandPalette';

export function Navbar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  const isHomeRoute = pathname === '/';
  const isAppDetail = pathname.startsWith('/apps/');

  // Global Cmd+K / Ctrl+K and / shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      } else if (
        e.key === '/' &&
        !isCommandPaletteOpen &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen]);

  // Close mobile drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen]);

  // Lock body scroll slightly when mobile menu is active for better touch UX
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo & Context */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              id="nav-logo"
              className="flex items-center gap-3 group transition-transform hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-purple-500 rounded-xl"
              aria-label="CrazyStore Home"
            >
              <NavLogo3D size="md" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-lg text-zinc-100 tracking-tight">
                    CrazyStore
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800/50">
                    FOSS
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 font-medium hidden sm:block">
                  Open-Source Android App Vault
                </p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav aria-label="Main Navigation" className="hidden md:flex items-center gap-1.5">
            <Link
              href="/"
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all min-h-[40px] inline-flex items-center ${
                isHomeRoute
                  ? 'bg-purple-950/80 text-purple-300 border border-purple-800/40 shadow-xs'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              Storefront
            </Link>

            <Link
              href="/#catalog"
              className="px-3 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all min-h-[40px] inline-flex items-center"
            >
              Catalog
            </Link>

            <Link
              href="/apps/videohub"
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all min-h-[40px] inline-flex items-center gap-1.5 ${
                isAppDetail
                  ? 'bg-purple-950/80 text-purple-300 border border-purple-800/40 shadow-xs'
                  : 'text-zinc-400 hover:text-purple-300 hover:bg-purple-950/40'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              3D Studio
            </Link>
          </nav>

          {/* Right side controls */}
          <div className="flex items-center gap-2">
            {/* Desktop Spotlight Command Palette Button */}
            <button
              type="button"
              onClick={() => setIsCommandPaletteOpen(true)}
              className="hidden sm:inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800/90 text-zinc-300 hover:text-zinc-100 border border-zinc-800 hover:border-purple-700/60 text-xs font-medium transition-all shadow-xs hover:shadow-purple-950/20 cursor-pointer min-h-[38px] group"
              title="Search apps (Ctrl+K or Cmd+K or /)"
            >
              <Search className="w-3.5 h-3.5 text-purple-400 group-hover:scale-110 transition-transform" />
              <span>Search apps...</span>
              <kbd className="hidden lg:inline-flex items-center gap-0.5 text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-zinc-950 text-zinc-400 border border-zinc-700/80 group-hover:text-purple-300 group-hover:border-purple-800/60 transition-colors">
                ⌘K
              </kbd>
            </button>

            {/* Mobile Dedicated Search Button with WCAG 44x44 Touch Target */}
            <button
              type="button"
              onClick={() => setIsCommandPaletteOpen(true)}
              className="sm:hidden p-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer"
              aria-label="Search applications"
              title="Search applications"
            >
              <Search className="w-5 h-5 text-purple-400" />
            </button>

            {/* Mobile menu hamburger button with WCAG 44x44 touch target */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2.5 rounded-xl text-zinc-400 hover:bg-zinc-900 hover:text-white min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer transition-colors"
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-nav-drawer"
              aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5 text-purple-400" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Accessible Mobile Drawer & Backdrop */}
        {isMobileMenuOpen && (
          <>
            <div
              className="fixed inset-0 top-16 bg-black/70 backdrop-blur-xs z-30 md:hidden animate-in fade-in duration-200"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-hidden="true"
            />
            <div
              id="mobile-nav-drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Mobile Navigation Menu"
              className="relative z-40 md:hidden border-t border-zinc-800 bg-zinc-950 px-4 py-5 space-y-2 animate-in slide-in-from-top-2 duration-200 shadow-2xl"
            >
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsCommandPaletteOpen(true);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-purple-200 bg-purple-950/60 hover:bg-purple-900/70 border border-purple-800/50 min-h-[48px] text-left cursor-pointer transition-all"
              >
                <Search className="w-4 h-4 text-purple-400" />
                <span>Instant Spotlight Search</span>
              </button>

              <Link
                href="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold min-h-[48px] ${
                  isHomeRoute
                    ? 'bg-purple-950/80 text-purple-300 border border-purple-800/50'
                    : 'text-zinc-300 hover:bg-zinc-900'
                }`}
              >
                <Layers className="w-4 h-4 text-purple-400" />
                <span>Storefront &amp; Discover</span>
              </Link>

              <Link
                href="/#catalog"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-zinc-300 hover:bg-zinc-900 min-h-[48px]"
              >
                <Search className="w-4 h-4 text-purple-400" />
                <span>Browse Catalog &amp; Search</span>
              </Link>

              <Link
                href="/#standards"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-zinc-300 hover:bg-zinc-900 min-h-[48px]"
              >
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                <span>FOSS Standards &amp; Safety</span>
              </Link>

              <Link
                href="/apps/videohub"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-purple-300 bg-purple-950/50 hover:bg-purple-900/60 border border-purple-800/40 min-h-[48px]"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>3D Device Studio</span>
              </Link>
            </div>
          </>
        )}
      </header>

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />
    </>
  );
}
