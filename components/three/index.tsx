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
      <div className="w-10 h-10 rounded-xl bg-purple-950/60 border border-purple-800/40 flex items-center justify-center animate-pulse">
        <span className="text-xs">📱</span>
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

export const Screenshot3DGallery = dynamic(
  () => import('./Screenshot3DGallery').then((mod) => mod.Screenshot3DGallery),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[420px] rounded-2xl bg-zinc-950/80 border border-purple-900/40 flex items-center justify-center animate-pulse">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
          <span className="text-xs font-black text-purple-400 tracking-widest">LOADING 3D GALLERY</span>
        </div>
      </div>
    ),
  }
);
