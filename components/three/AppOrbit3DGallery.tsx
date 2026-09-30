'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import Link from 'next/link';
import { AndroidApp } from '@/lib/appsData';
import { isWebGLAvailable, disposeThreeScene } from '@/lib/threeUtils';
import {
  RotateCcw,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Star,
  Download,
  Sparkles,
} from 'lucide-react';
import { trackEvent } from '@/lib/analytics';

interface AppOrbit3DGalleryProps {
  apps: AndroidApp[];
  ratingsMap: Record<string, { avg: number; count: number }>;
}

export function AppOrbit3DGallery({ apps, ratingsMap }: AppOrbit3DGalleryProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [hasWebGL, setHasWebGL] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isAutoSpinning, setIsAutoSpinning] = useState(true);

  // Three.js refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const carouselGroupRef = useRef<THREE.Group | null>(null);
  const cardMeshesRef = useRef<THREE.Mesh[]>([]);

  // Drag & rotation physics
  const targetRotationY = useRef(0);
  const currentRotationY = useRef(0);
  const isDraggingRef = useRef(false);
  const previousXRef = useRef(0);
  const angularVelocityRef = useRef(0);

  const totalApps = Math.max(apps.length, 1);
  const radius = Math.max(4.5, totalApps * 0.9);

  // Helper to generate dynamic 2D canvas texture for a 3D card
  const createCardTexture = (app: AndroidApp, rating: number, reviewCount: number): THREE.CanvasTexture => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 700;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    // Card background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 700);
    bgGrad.addColorStop(0, '#18181b');
    bgGrad.addColorStop(0.5, '#0f0f17');
    bgGrad.addColorStop(1, '#09090b');
    ctx.fillStyle = bgGrad;
    ctx.beginPath();
    ctx.roundRect(0, 0, 512, 700, 36);
    ctx.fill();

    // Border
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.45)';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Ambient glow top
    const glow = ctx.createRadialGradient(256, 120, 10, 256, 120, 220);
    glow.addColorStop(0, 'rgba(139, 92, 246, 0.4)');
    glow.addColorStop(1, 'rgba(139, 92, 246, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, 512, 700);

    // App Icon Box
    const iconSize = 110;
    const iconX = (512 - iconSize) / 2;
    const iconY = 70;
    const iconGrad = ctx.createLinearGradient(iconX, iconY, iconX + iconSize, iconY + iconSize);
    iconGrad.addColorStop(0, '#8b5cf6');
    iconGrad.addColorStop(1, '#6366f1');
    ctx.fillStyle = iconGrad;
    ctx.beginPath();
    ctx.roundRect(iconX, iconY, iconSize, iconSize, 28);
    ctx.fill();

    // Icon glyph (play triangle)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(iconX + 44, iconY + 34);
    ctx.lineTo(iconX + 76, iconY + 55);
    ctx.lineTo(iconX + 44, iconY + 76);
    ctx.closePath();
    ctx.fill();

    // App Name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(app.name, 256, 240);

    // Category
    ctx.fillStyle = '#a1a1aa';
    ctx.font = '500 20px sans-serif';
    ctx.fillText(app.category || 'Android Application', 256, 280);

    // Tagline
    ctx.fillStyle = '#71717a';
    ctx.font = '400 17px sans-serif';
    const tag = app.tagline || app.shortDescription || '';
    const truncatedTag = tag.length > 55 ? tag.substring(0, 52) + '...' : tag;
    ctx.fillText(truncatedTag, 256, 330);

    // Badge Pill
    ctx.fillStyle = 'rgba(139, 92, 246, 0.25)';
    ctx.beginPath();
    ctx.roundRect(86, 380, 340, 50, 16);
    ctx.fill();
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#c084fc';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(`⚡ ${app.badge || 'Kotlin + Compose'}`, 256, 412);

    // Rating Box
    ctx.fillStyle = 'rgba(24, 24, 27, 0.9)';
    ctx.beginPath();
    ctx.roundRect(86, 460, 340, 90, 20);
    ctx.fill();
    ctx.strokeStyle = 'rgba(234, 179, 8, 0.35)';
    ctx.stroke();

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText(`★ ${rating.toFixed(1)}`, 256, 505);

    ctx.fillStyle = '#a1a1aa';
    ctx.font = '500 16px sans-serif';
    ctx.fillText(`Verified Reviews (${reviewCount})`, 256, 535);

    // Tap CTA
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(136, 585, 240, 52, 18);
    ctx.fill();

    ctx.fillStyle = '#09090b';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('Tap to Inspect →', 256, 618);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    return texture;
  };

  useEffect(() => {
    if (!isWebGLAvailable()) {
      setHasWebGL(false);
      return;
    }

    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 520;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0.8, radius + 4.8);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    rendererRef.current = renderer;

    // Ambient & Directional Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2.0);
    dirLight.position.set(0, 8, 8);
    scene.add(dirLight);

    const purplePoint = new THREE.PointLight(0xa855f7, 4.0, 20);
    purplePoint.position.set(0, 2, 0);
    scene.add(purplePoint);

    // ==========================================
    // 3D Carousel Cylinder Ring
    // ==========================================
    const carouselGroup = new THREE.Group();
    carouselGroupRef.current = carouselGroup;
    cardMeshesRef.current = [];

    const cardWidth = 2.4;
    const cardHeight = 3.3;

    apps.forEach((app, i) => {
      const angle = (i / totalApps) * Math.PI * 2;
      const x = Math.sin(angle) * radius;
      const z = Math.cos(angle) * radius;

      const cardGeom = new THREE.PlaneGeometry(cardWidth, cardHeight);
      const appRating = ratingsMap[app.slug]?.avg || app.initialRating || 5.0;
      const appReviews = ratingsMap[app.slug]?.count || app.initialReviewCount || 0;
      const cardTex = createCardTexture(app, appRating, appReviews);

      const cardMat = new THREE.MeshStandardMaterial({
        map: cardTex,
        roughness: 0.2,
        metalness: 0.1,
        side: THREE.DoubleSide,
      });

      const cardMesh = new THREE.Mesh(cardGeom, cardMat);
      cardMesh.position.set(x, 0, z);
      // Face inward towards center or outward towards camera
      cardMesh.rotation.y = angle;

      (cardMesh as any).appIndex = i;
      (cardMesh as any).appData = app;

      carouselGroup.add(cardMesh);
      cardMeshesRef.current.push(cardMesh);
    });

    scene.add(carouselGroup);

    // Glowing Pedestal Ring below carousel
    const ringGeom = new THREE.TorusGeometry(radius, 0.03, 16, 120);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x8b5cf6, transparent: true, opacity: 0.7 });
    const ring = new THREE.Mesh(ringGeom, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -cardHeight / 2 - 0.2;
    scene.add(ring);

    // Raycaster for clicking 3D cards
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const onPointerDown = (e: PointerEvent) => {
      isDraggingRef.current = true;
      previousXRef.current = e.clientX;
      angularVelocityRef.current = 0;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (isDraggingRef.current) {
        const deltaX = e.clientX - previousXRef.current;
        angularVelocityRef.current = deltaX * 0.003;
        targetRotationY.current += deltaX * 0.005;
        previousXRef.current = e.clientX;
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      isDraggingRef.current = false;

      // Check if it was a quick click rather than a drag
      const rect = container.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

      raycaster.setFromCamera(pointer, camera);
      const intersects = raycaster.intersectObjects(cardMeshesRef.current);
      if (intersects.length > 0) {
        const hitIdx = (intersects[0].object as any).appIndex;
        if (typeof hitIdx === 'number') {
          rotateToIndex(hitIdx);
        }
      }
    };

    container.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    // Resize
    const handleResize = () => {
      if (!container || !rendererRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // Animation Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);

      if (isAutoSpinning && !isDraggingRef.current) {
        targetRotationY.current -= 0.003;
      }

      // Physics inertia
      if (!isDraggingRef.current) {
        targetRotationY.current += angularVelocityRef.current;
        angularVelocityRef.current *= 0.94;
      }

      // Damped rotation
      currentRotationY.current += (targetRotationY.current - currentRotationY.current) * 0.08;
      if (carouselGroupRef.current) {
        carouselGroupRef.current.rotation.y = currentRotationY.current;
      }

      // Calculate which card is closest to the front
      const normalizedAngle = (-currentRotationY.current % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
      const closestIdx = Math.round((normalizedAngle / (Math.PI * 2)) * totalApps) % totalApps;
      setSelectedIndex(closestIdx);

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      container.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      resizeObserver.disconnect();
      disposeThreeScene(scene);
      renderer.dispose();
    };
  }, [apps, ratingsMap, radius, totalApps, isAutoSpinning]);

  const rotateToIndex = (idx: number) => {
    const targetAngle = -(idx / totalApps) * Math.PI * 2;
    targetRotationY.current = targetAngle;
    angularVelocityRef.current = 0;
  };

  const handlePrev = () => {
    const prev = (selectedIndex - 1 + totalApps) % totalApps;
    rotateToIndex(prev);
  };

  const handleNext = () => {
    const next = (selectedIndex + 1) % totalApps;
    rotateToIndex(next);
  };

  const currentApp = apps[selectedIndex] || apps[0];

  return (
    <div className="relative w-full rounded-3xl bg-zinc-950/80 border border-zinc-800 overflow-hidden shadow-2xl p-4 sm:p-6 mb-12">
      {/* 3D Carousel Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-950 text-purple-300 border border-purple-800/50 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-purple-400" />
              Three.js 3D WebGL Carousel
            </span>
            <span className="text-xs text-zinc-500">({apps.length} Apps in Orbit)</span>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-zinc-100 mt-1">
            Interactive 3D App Cylinder
          </h3>
          <p className="text-xs text-zinc-400">
            Drag horizontally to spin the 3D orbit • Click any 3D card to focus & inspect
          </p>
        </div>

        {/* Carousel HUD Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handlePrev}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-all active:scale-95 cursor-pointer"
            title="Previous App"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleNext}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-all active:scale-95 cursor-pointer"
            title="Next App"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsAutoSpinning(!isAutoSpinning)}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-all active:scale-95 cursor-pointer"
            title={isAutoSpinning ? 'Pause Auto-Spin' : 'Resume Auto-Spin'}
          >
            {isAutoSpinning ? (
              <Pause className="w-4 h-4 text-purple-400" />
            ) : (
              <Play className="w-4 h-4 text-purple-400" />
            )}
          </button>
        </div>
      </div>

      {/* 3D WebGL Canvas Viewport */}
      <div
        ref={containerRef}
        className="relative w-full h-[460px] sm:h-[520px] flex items-center justify-center select-none overflow-hidden cursor-grab active:cursor-grabbing rounded-2xl bg-zinc-900/40"
        style={{ touchAction: 'none' }}
      >
        {hasWebGL ? (
          <canvas ref={canvasRef} className="w-full h-full outline-none" />
        ) : (
          <div className="text-zinc-400 text-xs">WebGL Canvas unavailable.</div>
        )}

        {/* Floating Active App Action Bar */}
        {currentApp && (
          <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 max-w-sm bg-zinc-950/90 backdrop-blur-md p-3.5 rounded-2xl border border-purple-800/50 shadow-2xl flex items-center justify-between gap-3 pointer-events-auto">
            <div className="min-w-0">
              <span className="text-[10px] text-purple-400 font-bold block truncate">
                Focused in 3D:
              </span>
              <h4 className="text-sm font-extrabold text-white truncate">{currentApp.name}</h4>
              <span className="text-[11px] text-zinc-400 block truncate">
                {currentApp.category} &bull; ★ {ratingsMap[currentApp.slug]?.avg?.toFixed(1) || 5.0}
              </span>
            </div>

            <Link
              href={`/apps/${currentApp.slug}`}
              onClick={() => {
                trackEvent({
                  eventType: 'app_view',
                  appSlug: currentApp.slug,
                  appName: currentApp.name,
                  details: `Opened app from 3D Orbit Carousel: ${currentApp.name}`,
                });
              }}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shrink-0 flex items-center gap-1.5 shadow-md shadow-purple-600/30 transition-all hover:scale-105"
            >
              Inspect <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
