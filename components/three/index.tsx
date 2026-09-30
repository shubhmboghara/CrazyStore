'use client';

import React from 'react';
import dynamic from 'next/dynamic';

export { Card3DTilt } from './Card3DTilt';

// Dynamically import Three.js WebGL components with ssr: false to prevent SSR hydration mismatches
export const Hero3DExperience = dynamic(
  () => import('./Hero3DExperience').then((mod) => mod.Hero3DExperience),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[520px] sm:h-[600px] flex items-center justify-center rounded-3xl bg-zinc-900/30 border border-zinc-800/60 animate-pulse">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-900/30 border border-purple-800/40 flex items-center justify-center">
            <span className="text-xl">📱</span>
          </div>
          <span className="text-xs font-bold text-zinc-400">Loading 3D WebGL Studio...</span>
        </div>
      </div>
    ),
  }
);

export const AppDevice3DStudio = dynamic(
  () => import('./AppDevice3DStudio').then((mod) => mod.AppDevice3DStudio),
  {
    ssr: false,
    loading: () => (
      <div className="w-full min-h-[500px] flex items-center justify-center rounded-3xl bg-zinc-950 border border-zinc-800 animate-pulse">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-950/60 border border-purple-800/40 flex items-center justify-center">
            <span className="text-xl">📱</span>
          </div>
          <span className="text-xs font-bold text-purple-300">Initializing 3D Device Studio...</span>
        </div>
      </div>
    ),
  }
);

export const FloatingAndroid3D = dynamic(
  () => import('./FloatingAndroid3D').then((mod) => mod.FloatingAndroid3D),
  {
    ssr: false,
  }
);
