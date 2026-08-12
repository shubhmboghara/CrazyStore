'use client';

import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { AdminAppUpload } from '@/components/AdminAppUpload';
import { Smartphone, ArrowLeft } from 'lucide-react';

export default function AdminPage() {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-purple-600 text-white">
                <Smartphone className="w-5 h-5" />
              </span>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                Developer Admin Portal
              </h1>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Upload new Android apps, manage Google Drive APK download links, and monitor reviews catalog.
            </p>
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:text-purple-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> View Public Site
          </Link>
        </div>

        {/* Admin App Upload Component */}
        <AdminAppUpload />
      </main>

      <Footer />
    </div>
  );
}
