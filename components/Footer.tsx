'use client';

import React from 'react';
import Link from 'next/link';
import { Smartphone, ShieldCheck, Sparkles, ExternalLink } from 'lucide-react';
import { FaGithub, FaLinkedin, FaInstagram } from 'react-icons/fa6';
import { NavLogo3D } from '@/components/three';

export function Footer() {
  return (
    <footer className="border-t border-zinc-800 bg-zinc-950 text-zinc-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* Column 1: Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2.5 group">
              <NavLogo3D size="sm" />
              <span className="font-extrabold text-base text-zinc-100 tracking-tight group-hover:text-purple-300 transition-colors">
                CrazyStore
              </span>
            </Link>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Curated, high-performance Android applications built with Kotlin and Jetpack Compose. 100% open-source and free forever.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://github.com/shubhmboghara/CrazyStore"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl bg-zinc-900 hover:bg-purple-950/60 hover:text-purple-400 text-zinc-300 flex items-center justify-center transition-colors border border-zinc-800 focus-visible:ring-2 focus-visible:ring-purple-400"
                aria-label="GitHub Repository"
              >
                <FaGithub className="w-4 h-4" />
              </a>
              <a
                href="https://linkedin.com/in/shubham-boghara-60b4a1343"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl bg-zinc-900 hover:bg-purple-950/60 hover:text-purple-400 text-zinc-300 flex items-center justify-center transition-colors border border-zinc-800 focus-visible:ring-2 focus-visible:ring-purple-400"
                aria-label="LinkedIn"
              >
                <FaLinkedin className="w-4 h-4" />
              </a>
              <a
                href="https://instagram.com/shubhambogharadotcom"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl bg-zinc-900 hover:bg-purple-950/60 hover:text-purple-400 text-zinc-300 flex items-center justify-center transition-colors border border-zinc-800 focus-visible:ring-2 focus-visible:ring-purple-400"
                aria-label="Instagram"
              >
                <FaInstagram className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Column 2: Storefront */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-100 mb-3">
              Storefront &amp; Discover
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/#catalog" className="hover:text-purple-400 transition-colors inline-block py-1">
                  Curated App Catalog
                </Link>
              </li>
              <li>
                <Link href="/#features" className="hover:text-purple-400 transition-colors inline-block py-1">
                  120Hz &amp; FOSS Architecture
                </Link>
              </li>
              <li>
                <Link href="/#standards" className="hover:text-purple-400 transition-colors inline-block py-1">
                  Verification Standards
                </Link>
              </li>
              <li>
                <Link href="/apps/videohub" className="hover:text-purple-400 transition-colors inline-block py-1">
                  Interactive 3D Device Studio
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/shubhmboghara/CrazyStore/releases"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-purple-400 transition-colors inline-flex items-center gap-1 py-1"
                >
                  GitHub Releases <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Open Source & Developer */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-100 mb-3">
              Open Source & Devs
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a
                  href="https://github.com/shubhmboghara/CrazyStore"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-purple-500 transition-colors inline-flex items-center gap-1"
                >
                  <FaGithub className="w-3 h-3" /> GitHub Repository
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/shubhmboghara/CrazyStore/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-purple-500 transition-colors"
                >
                  Report Issue / Bug
                </a>
              </li>
              <li>
                <a
                  href="https://developer.android.com/jetpack/compose"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-purple-500 transition-colors"
                >
                  Jetpack Compose Docs
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-zinc-800 pt-6 flex flex-col sm:row items-center justify-between gap-4 text-xs text-zinc-400">
          <div>
            © {new Date().getFullYear()} CrazyStore. Built with Next.js, Kotlin, and Tailwind CSS.
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-emerald-500">
              <ShieldCheck className="w-3.5 h-3.5" /> All APKs VirusTotal Scanned
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
