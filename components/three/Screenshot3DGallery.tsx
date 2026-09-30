'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { isWebGLAvailable, disposeThreeScene } from '@/lib/threeUtils';
import { Card3DTilt } from './Card3DTilt';
import { LazyScreenshot } from '@/components/LazyScreenshot';
import {
  Smartphone,
  Layers,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Sparkles,
  RotateCw,
  Compass,
  Eye,
  Check,
  Zap,
} from 'lucide-react';

interface ScreenshotItem {
  id?: string | number;
  url?: string;
  imageUrl?: string;
  title?: string;
  subtitle?: string;
}

interface Screenshot3DGalleryProps {
  screenshots: ScreenshotItem[];
  appName: string;
  onScreenshotClick?: (index: number) => void;
}

type AnglePreset = 'front' | 'iso-left' | 'iso-right' | 'dynamic';
type GalleryViewMode = 'stage' | 'flow';

/**
 * World-Class 3D Screenshot & Visuals Showcase.
 * Combines:
 * 1. Three.js WebGL Ambient Cyber Particle & Reflection Stage Canvas
 * 2. Ultra-realistic 3D Flagship Smartphone with dynamic gyro-tilt, titanium bezels, and specular glass glare
 * 3. 3D Angle Presets (Front, Isometric 3D Left, Isometric 3D Right, Dynamic Orbit)
 * 4. Interactive 3D Perspective Filmstrip Thumbnails with holographic glare
 * 5. 3D Visual Flow mode for reviewing all captures simultaneously
 */
export function Screenshot3DGallery({
  screenshots,
  appName,
  onScreenshotClick,
}: Screenshot3DGalleryProps) {
  const [activeIdx, setActiveIdx] = useState<number>(0);
  const [viewMode, setViewMode] = useState<GalleryViewMode>('stage');
  const [anglePreset, setAnglePreset] = useState<AnglePreset>('iso-left');
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [tiltStyle, setTiltStyle] = useState<React.CSSProperties>({
    transform: 'perspective(1200px) rotateX(10deg) rotateY(-18deg) scale3d(1, 1, 1)',
  });
  const [glarePosition, setGlarePosition] = useState<{ x: number; y: number; opacity: number }>({
    x: 40,
    y: 30,
    opacity: 0.25,
  });

  const ambientCanvasRef = useRef<HTMLCanvasElement>(null);
  const stageContainerRef = useRef<HTMLDivElement>(null);
  const filmstripRef = useRef<HTMLDivElement>(null);

  const count = screenshots.length;
  const currentScreenshot = screenshots[activeIdx] || screenshots[0];
  const currentUrl = currentScreenshot?.imageUrl || currentScreenshot?.url || '';
  const currentTitle = currentScreenshot?.title || `Preview ${activeIdx + 1}`;

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. Three.js WebGL Ambient Stage Canvas (Cyber Particles & Light Field)
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isWebGLAvailable() || !ambientCanvasRef.current) return;

    const canvas = ambientCanvasRef.current;
    const parent = canvas.parentElement;
    if (!parent) return;

    const W = parent.clientWidth || 800;
    const H = 480;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x09090b, 0.035);

    const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 100);
    camera.position.set(0, 0, 10);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: true,
      powerPreference: 'low-power',
    });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));

    // Pedestal Glowing Rings
    const ringGroup = new THREE.Group();
    const ring1Geo = new THREE.RingGeometry(2.4, 2.45, 64);
    const ring1Mat = new THREE.MeshBasicMaterial({
      color: 0xa855f7,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.35,
    });
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
    ring1.rotation.x = Math.PI / 2.3;
    ring1.position.y = -3.2;
    ringGroup.add(ring1);

    const ring2Geo = new THREE.RingGeometry(3.6, 3.65, 64);
    const ring2Mat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.22,
    });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.x = Math.PI / 2.3;
    ring2.position.y = -3.25;
    ringGroup.add(ring2);
    scene.add(ringGroup);

    // Cyber Dust Floating Particles
    const PARTICLE_COUNT = 140;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      pPos[i * 3] = (Math.random() - 0.5) * 24;
      pPos[i * 3 + 1] = (Math.random() - 0.5) * 12;
      pPos[i * 3 + 2] = (Math.random() - 0.5) * 10 - 2;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({
      color: 0xc084fc,
      size: 0.05,
      transparent: true,
      opacity: 0.5,
    });
    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    // Animation Loop
    let animId = 0;
    const clock = new THREE.Clock();

    function animate() {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      ringGroup.rotation.z = elapsed * 0.1;
      particles.rotation.y = elapsed * 0.03;

      const pArr = pGeo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        pArr.array[i * 3 + 1] = (pArr.array[i * 3 + 1] as number) + 0.004;
        if ((pArr.array[i * 3 + 1] as number) > 6) pArr.setY(i, -6);
      }
      pArr.needsUpdate = true;

      renderer.render(scene, camera);
    }
    animate();

    const handleResize = () => {
      if (!parent) return;
      const nw = parent.clientWidth;
      camera.aspect = nw / H;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, H);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      disposeThreeScene(scene, renderer);
    };
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. 3D Angle Preset Calculations
  // ─────────────────────────────────────────────────────────────────────────────
  const applyAnglePreset = useCallback((preset: AnglePreset) => {
    setAnglePreset(preset);
    let transform = '';
    let glareX = 50;
    let glareY = 50;

    switch (preset) {
      case 'front':
        transform = 'perspective(1200px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
        glareX = 50;
        glareY = 40;
        break;
      case 'iso-left':
        transform = 'perspective(1200px) rotateX(10deg) rotateY(-18deg) scale3d(1.02, 1.02, 1.02)';
        glareX = 35;
        glareY = 25;
        break;
      case 'iso-right':
        transform = 'perspective(1200px) rotateX(10deg) rotateY(18deg) scale3d(1.02, 1.02, 1.02)';
        glareX = 65;
        glareY = 25;
        break;
      case 'dynamic':
        transform = 'perspective(1200px) rotateX(16deg) rotateY(-24deg) rotateZ(3deg) scale3d(1.04, 1.04, 1.04)';
        glareX = 30;
        glareY = 20;
        break;
    }

    setTiltStyle({
      transform,
      transition: 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)',
    });
    setGlarePosition({ x: glareX, y: glareY, opacity: 0.3 });
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. Mouse 3D Gyro Tilt Handler
  // ─────────────────────────────────────────────────────────────────────────────
  const handleStageMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!stageContainerRef.current) return;
      const rect = stageContainerRef.current.getBoundingClientRect();
      const clientX = e.clientX;
      const clientY = e.clientY;

      const normX = (clientX - rect.left) / rect.width - 0.5;
      const normY = (clientY - rect.top) / rect.height - 0.5;

      const maxTilt = 16;
      let baseRotX = 0;
      let baseRotY = 0;

      if (anglePreset === 'iso-left') {
        baseRotX = 10;
        baseRotY = -18;
      } else if (anglePreset === 'iso-right') {
        baseRotX = 10;
        baseRotY = 18;
      } else if (anglePreset === 'dynamic') {
        baseRotX = 16;
        baseRotY = -24;
      }

      const rotX = baseRotX - normY * maxTilt;
      const rotY = baseRotY + normX * maxTilt;

      setTiltStyle({
        transform: `perspective(1200px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) scale3d(1.03, 1.03, 1.03)`,
        transition: 'transform 0.12s ease-out',
      });

      const glareX = Math.round((normX + 0.5) * 100);
      const glareY = Math.round((normY + 0.5) * 100);
      setGlarePosition({ x: glareX, y: glareY, opacity: 0.38 });
    },
    [anglePreset]
  );

  const handleStageMouseLeave = useCallback(() => {
    setIsHovered(false);
    applyAnglePreset(anglePreset);
  }, [anglePreset, applyAnglePreset]);

  // Navigate functions
  const goToNext = useCallback(() => {
    setActiveIdx((prev) => (prev + 1) % count);
  }, [count]);

  const goToPrev = useCallback(() => {
    setActiveIdx((prev) => (prev - 1 + count) % count);
  }, [count]);

  if (count === 0) return null;

  return (
    <div className="relative w-full space-y-6 select-none">
      {/* ─────────────────────────────────────────────────────────────────────── */}
      {/* Sub-Header: Mode Switcher & Angle Presets                                */}
      {/* ─────────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-zinc-800/60">
        {/* Left: View Mode Toggle */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-zinc-900 border border-zinc-800">
          <button
            type="button"
            onClick={() => setViewMode('stage')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'stage'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 ring-1 ring-purple-400/40'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-purple-300" />
            3D Device Stage
          </button>
          <button
            type="button"
            onClick={() => setViewMode('flow')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'flow'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 ring-1 ring-purple-400/40'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-cyan-300" />
            3D Visual Flow ({count})
          </button>
        </div>

        {/* Right: Angle Presets & Fullscreen */}
        {viewMode === 'stage' && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider hidden sm:inline-block">
              3D Angle:
            </span>
            <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1">
              <button
                type="button"
                onClick={() => applyAnglePreset('front')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  anglePreset === 'front'
                    ? 'bg-zinc-800 text-purple-300 border border-purple-500/40 shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Front
              </button>
              <button
                type="button"
                onClick={() => applyAnglePreset('iso-left')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  anglePreset === 'iso-left'
                    ? 'bg-zinc-800 text-purple-300 border border-purple-500/40 shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Isometric L
              </button>
              <button
                type="button"
                onClick={() => applyAnglePreset('iso-right')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  anglePreset === 'iso-right'
                    ? 'bg-zinc-800 text-purple-300 border border-purple-500/40 shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Isometric R
              </button>
              <button
                type="button"
                onClick={() => applyAnglePreset('dynamic')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  anglePreset === 'dynamic'
                    ? 'bg-zinc-800 text-purple-300 border border-purple-500/40 shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Dynamic
              </button>
            </div>

            <button
              type="button"
              onClick={() => onScreenshotClick?.(activeIdx)}
              className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-purple-300 transition-colors border border-zinc-800 cursor-pointer"
              title="Expand high-res lightbox"
              aria-label="Expand image"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────────────── */}
      {/* MODE 1: 3D DEVICE STAGE                                                 */}
      {/* ─────────────────────────────────────────────────────────────────────── */}
      {viewMode === 'stage' && (
        <div className="space-y-6">
          <div
            ref={stageContainerRef}
            onMouseMove={handleStageMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={handleStageMouseLeave}
            className="relative w-full h-[520px] sm:h-[580px] md:h-[620px] rounded-3xl bg-radial from-zinc-900/90 via-zinc-950 to-zinc-950 border border-zinc-800 flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing group shadow-2xl"
          >
            {/* Ambient Three.js WebGL particle background */}
            <canvas
              ref={ambientCanvasRef}
              className="absolute inset-0 w-full h-full pointer-events-none opacity-70"
            />

            {/* Ambient background glow orb */}
            <div
              aria-hidden
              className="absolute w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none"
              style={{
                background: 'radial-gradient(circle, #a855f7 0%, #06b6d4 100%)',
              }}
            />

            {/* 3D Smartphone Holographic Chassis */}
            <div
              style={tiltStyle}
              onClick={() => onScreenshotClick?.(activeIdx)}
              className="relative w-[240px] sm:w-[270px] md:w-[300px] h-[480px] sm:h-[530px] md:h-[570px] rounded-[44px] p-3 bg-gradient-to-b from-zinc-700 via-zinc-900 to-zinc-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_40px_rgba(168,85,247,0.25)] border-[3px] border-zinc-700/80 transition-shadow duration-300 hover:shadow-[0_30px_70px_-10px_rgba(0,0,0,0.95),0_0_60px_rgba(168,85,247,0.4)]"
            >
              {/* Phone Titanium Outer Bezel Ring */}
              <div className="absolute inset-0 rounded-[42px] border border-purple-500/20 pointer-events-none" />

              {/* Speaker Earpiece Slit */}
              <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-12 h-1 bg-zinc-800 rounded-full z-30 border border-zinc-700/50" />

              {/* Dynamic Camera Punch-hole Pill */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-14 h-3.5 bg-black rounded-full z-30 flex items-center justify-end px-2 border border-zinc-800/80 shadow-inner">
                <div className="w-2 h-2 rounded-full bg-zinc-900 border border-zinc-700/60" />
              </div>

              {/* OLED Screen Bezel & Container */}
              <div className="relative w-full h-full rounded-[34px] overflow-hidden bg-black border border-zinc-900 shadow-inner">
                {/* Real High-Resolution Screenshot Image (Zero CORS/Downsample Loss) */}
                <img
                  src={currentUrl}
                  alt={currentTitle}
                  className="w-full h-full object-cover object-top select-none transition-transform duration-500 group-hover:scale-102"
                />

                {/* Dynamic Specular Glass Glare Sweep */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 transition-opacity duration-300"
                  style={{
                    background: `radial-gradient(ellipse at ${glarePosition.x}% ${glarePosition.y}%, rgba(255, 255, 255, ${glarePosition.opacity}), transparent 60%)`,
                  }}
                />

                {/* Screen Edge Glass Bevel Glare */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 rounded-[34px] border border-white/10"
                />

                {/* Tap to expand hover hint */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 pointer-events-none">
                  <div className="p-3 rounded-2xl bg-purple-600/90 text-white shadow-xl backdrop-blur-md">
                    <Maximize2 className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-black text-white bg-black/70 px-3 py-1 rounded-full border border-purple-500/40 backdrop-blur-md">
                    Click for Fullscreen Zoom
                  </span>
                </div>
              </div>

              {/* Phone Shadow Pedestal Reflection */}
              <div
                aria-hidden
                className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-4/5 h-8 bg-purple-950/60 rounded-full blur-xl pointer-events-none"
              />
            </div>

            {/* Navigation Overlay Arrows */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goToPrev();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700/60 backdrop-blur-md transition-all shadow-xl hover:scale-110 cursor-pointer"
              aria-label="Previous screenshot"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700/60 backdrop-blur-md transition-all shadow-xl hover:scale-110 cursor-pointer"
              aria-label="Next screenshot"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Bottom Info Floating Card */}
            <div className="absolute bottom-4 inset-x-4 sm:inset-x-auto sm:left-6 flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-zinc-900/90 border border-zinc-700/60 backdrop-blur-md shadow-xl">
              <span className="px-2 py-0.5 rounded-md bg-purple-950 border border-purple-700/60 text-[10px] font-black text-purple-300 uppercase tracking-widest">
                {activeIdx + 1} / {count}
              </span>
              <span className="text-xs font-bold text-zinc-200 truncate max-w-xs">
                {currentTitle}
              </span>
            </div>

            {/* Top Interactive Tip Badge */}
            <div className="absolute top-4 left-6 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-zinc-400 text-[11px] backdrop-blur-md pointer-events-none">
              <Compass className="w-3.5 h-3.5 text-purple-400 animate-spin" style={{ animationDuration: '8s' }} />
              Hover &amp; move cursor to rotate device in 3D
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────────── */}
          {/* 3D Interactive Filmstrip Thumbnails Ribbon                           */}
          {/* ─────────────────────────────────────────────────────────────────── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-zinc-400 px-1">
              <span>All App Screenshots ({count})</span>
              <span>Tap to switch 3D device screen</span>
            </div>

            <div
              ref={filmstripRef}
              className="flex items-center gap-3.5 overflow-x-auto pb-3 pt-1 hide-scrollbar snap-x no-scrollbar"
            >
              {screenshots.map((shot, idx) => {
                const sUrl = shot.imageUrl || shot.url || '';
                const sTitle = shot.title || `Capture ${idx + 1}`;
                const isActive = idx === activeIdx;

                return (
                  <div
                    key={shot.id || idx}
                    onClick={() => setActiveIdx(idx)}
                    className="shrink-0 w-28 sm:w-32 cursor-pointer snap-start group"
                  >
                    <Card3DTilt
                      maxTilt={8}
                      className={`rounded-2xl transition-all duration-300 ${
                        isActive
                          ? 'ring-2 ring-purple-500 shadow-lg shadow-purple-900/40 -translate-y-1'
                          : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      <div className="relative aspect-[9/16] rounded-2xl overflow-hidden bg-black border border-zinc-800">
                        <img
                          src={sUrl}
                          alt={sTitle}
                          className="w-full h-full object-cover object-top"
                        />
                        {/* Active Badge */}
                        {isActive && (
                          <div className="absolute top-2 right-2 p-1 rounded-full bg-purple-600 text-white shadow-md">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        )}
                        {/* Number Index */}
                        <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-sm text-[9px] font-black text-zinc-300">
                          #{idx + 1}
                        </div>
                      </div>
                    </Card3DTilt>
                    <p className="mt-1.5 text-[11px] font-semibold text-center text-zinc-400 group-hover:text-purple-300 truncate">
                      {sTitle}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────── */}
      {/* MODE 2: 3D VISUAL FLOW GRID                                             */}
      {/* ─────────────────────────────────────────────────────────────────────── */}
      {viewMode === 'flow' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-in fade-in duration-300">
          {screenshots.map((preview, idx) => {
            const hasCustomTitle = Boolean(
              preview.title &&
                !/^screenshot\s*\d*$/i.test(preview.title.trim()) &&
                !/^preview\s*\d*$/i.test(preview.title.trim())
            );

            return (
              <Card3DTilt
                key={preview.id || idx}
                maxTilt={12}
                glareOpacity={0.28}
                className="h-full cursor-pointer group"
              >
                <div
                  onClick={() => onScreenshotClick?.(idx)}
                  className="flex flex-col h-full bg-zinc-900 border border-zinc-800 hover:border-purple-600/70 rounded-3xl p-3.5 transition-all shadow-md hover:shadow-2xl hover:shadow-purple-900/30"
                >
                  <LazyScreenshot
                    src={preview.imageUrl || preview.url || ''}
                    alt={appName}
                    title={preview.title}
                    hasCustomTitle={hasCustomTitle}
                    aspectClass="h-[360px] sm:h-[420px]"
                    priority={idx < 4}
                  />

                  <div className="mt-3 px-1.5 flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-200 group-hover:text-purple-300 truncate">
                      {preview.title || `Capture ${idx + 1}`}
                    </span>
                    <span className="text-[10px] font-bold text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-md">
                      #{idx + 1}
                    </span>
                  </div>
                </div>
              </Card3DTilt>
            );
          })}
        </div>
      )}
    </div>
  );
}
