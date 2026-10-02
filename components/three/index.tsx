'use client';

import React from 'react';
import dynamic from 'next/dynamic';

export { Card3DTilt } from './Card3DTilt';

// Dynamically import Three.js WebGL components with ssr: false to prevent SSR hydration mismatches
export const Global3DBackground = dynamic(
  () => import('./Global3DBackground').then((mod) => mod.Global3DBackground),
  { ssr: false }
);

export const NavLogo3D = dynamic(
  () => import('./NavLogo3D').then((mod) => mod.NavLogo3D),
  {
    ssr: false,
    loading: () => (
      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-purple-500 p-0.5 shadow-md shadow-purple-500/25 flex items-center justify-center shrink-0">
        <div className="w-full h-full bg-zinc-950 rounded-[10px] flex items-center justify-center overflow-hidden p-1">
          <img src="/icon.svg" alt="CrazyStore Logo" className="w-full h-full object-contain" />
        </div>
      </div>
    ),
  }
);

export const Feature3DCanvas = dynamic(
  () => import('./Feature3DCanvas').then((mod) => mod.Feature3DCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center animate-pulse">
        <span className="text-xs">⚡</span>
      </div>
    ),
  }
);


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


export const FloatingAndroid3D = dynamic(
  () => import('./FloatingAndroid3D').then((mod) => mod.FloatingAndroid3D),
  {
    ssr: false,
  }
);

export const Screenshots3DBackdrop = dynamic(
  () => import('./Screenshots3DBackdrop').then((mod) => mod.Screenshots3DBackdrop),
  {
    ssr: false,
  }
);

export const Screenshots3DPhoneView = dynamic(
  () => import('./Screenshots3DPhoneView').then((mod) => mod.Screenshots3DPhoneView),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[420px] sm:h-[480px] rounded-2xl sm:rounded-3xl bg-zinc-950 border border-zinc-800 flex items-center justify-center animate-pulse">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-950/60 border border-purple-800/40 flex items-center justify-center">
            <span className="text-xl">📱</span>
          </div>
          <span className="text-xs font-bold text-purple-300">Initializing 3D Device View...</span>
        </div>
      </div>
    ),
  }
);

