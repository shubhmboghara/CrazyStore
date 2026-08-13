'use client';

import React from 'react';
import { AdminAppUpload } from '@/components/AdminAppUpload';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

export default function AdminPage() {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <AdminAppUpload />
      </main>
      <Footer />
    </div>
  );
}
