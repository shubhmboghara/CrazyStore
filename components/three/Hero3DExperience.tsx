'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { isWebGLAvailable, disposeThreeScene, drawAndroidScreenCanvas } from '@/lib/threeUtils';
import { AndroidApp, ANDROID_APPS } from '@/lib/appsData';
import { normalizeAppRecord } from '@/lib/appUtils';
import { Smartphone } from 'lucide-react';

export interface ShowcaseApp {
  slug: string;
  name: string;
  category: string;
  badge: string;
  version: string;
  rating: number;
  color1: string;
  color2: string;
  tagline: string;
  screenshotUrl?: string | null;
}

const SHOWCASE_PALETTES = [
  { color1: '#8b5cf6', color2: '#6366f1' }, // Violet -> Indigo
  { color1: '#06b6d4', color2: '#3b82f6' }, // Cyan -> Blue
  { color1: '#ec4899', color2: '#a855f7' }, // Pink -> Purple
  { color1: '#10b981', color2: '#06b6d4' }, // Emerald -> Cyan
  { color1: '#f59e0b', color2: '#ef4444' }, // Amber -> Rose
  { color1: '#6366f1', color2: '#ec4899' }, // Indigo -> Pink
  { color1: '#14b8a6', color2: '#8b5cf6' }, // Teal -> Violet
];

export function toShowcaseApp(app: any, index: number = 0): ShowcaseApp {
  const palette = SHOWCASE_PALETTES[index % SHOWCASE_PALETTES.length];

  let screenshotUrl: string | null = null;
  if (Array.isArray(app.screenshots) && app.screenshots.length > 0) {
    const s = app.screenshots[0];
    const raw = typeof s === 'string' ? s : (s?.imageUrl || s?.url || null);
    if (raw && typeof raw === 'string' && raw.trim()) {
      screenshotUrl = raw.trim();
    }
  }

  return {
    slug: app.slug || `app-${index}`,
    name: app.name || 'Android App',
    category: app.category || 'Tools & Utilities',
    badge: app.badge || 'Kotlin + Compose',
    version: app.version || 'v1.0.0',
    rating: typeof app.initialRating === 'number' ? app.initialRating : 5.0,
    color1: palette.color1,
    color2: palette.color2,
    tagline: app.tagline || app.shortDescription || 'Modern Native Android Jetpack Compose Application',
    screenshotUrl,
  };
}

const DEFAULT_FALLBACK_APPS: ShowcaseApp[] = [
  {
    slug: 'videohub',
    name: 'VideoHub',
    category: 'Media & Video',
    badge: 'Kotlin + Compose',
    version: 'v2.4.0',
    rating: 4.9,
    color1: '#8b5cf6',
    color2: '#6366f1',
    tagline: 'Ad-Free High-Definition Player for Android',
    screenshotUrl: null,
  },
  {
    slug: 'audioforge',
    name: 'AudioForge',
    category: 'Music & Audio',
    badge: 'Modern Jetpack M3',
    version: 'v2.1.0',
    rating: 5.0,
    color1: '#ec4899',
    color2: '#8b5cf6',
    tagline: 'Lossless Hi-Res Audio Engine & Visualizer',
    screenshotUrl: null,
  },
  {
    slug: 'fittrack-pro',
    name: 'FitTrack Pro',
    category: 'Health & Fitness',
    badge: 'Room + Coroutines',
    version: 'v1.0.8',
    rating: 4.8,
    color1: '#10b981',
    color2: '#06b6d4',
    tagline: 'Zero-Telemetry Native Workout Companion',
    screenshotUrl: null,
  },
];

interface Hero3DExperienceProps {
  onExploreClick?: () => void;
  apps?: AndroidApp[];
  cycleIntervalMs?: number;
}

export function Hero3DExperience({
  onExploreClick,
  apps,
  cycleIntervalMs = 10000, // 10s calculated optimal showcase duration
}: Hero3DExperienceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [hasWebGL, setHasWebGL] = useState<boolean>(true);
  const [activeAppIdx, setActiveAppIdx] = useState<number>(0);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [internalApps, setInternalApps] = useState<AndroidApp[]>([]);

  // Fallback fetch in case Hero3DExperience is used standalone without apps prop
  useEffect(() => {
    if (apps && apps.length > 0) return;
    let isSubscribed = true;

    async function fetchApps() {
      try {
        const res = await fetch(`/api/apps?t=${Date.now()}`, { cache: 'no-store' });
        if (res.ok && isSubscribed) {
          const data = await res.json();
          if (Array.isArray(data.apps) && data.apps.length > 0) {
            setInternalApps(data.apps.map((a: any) => normalizeAppRecord(a)));
          }
        }
      } catch {
        // Fallback silently
      }
    }

    fetchApps();
    return () => {
      isSubscribed = false;
    };
  }, [apps]);

  // Derive dynamic list of showcase apps
  const showcaseApps: ShowcaseApp[] = useMemo(() => {
    const source = apps && apps.length > 0 ? apps : internalApps;
    if (source && source.length > 0) {
      return source.map((a, idx) => toShowcaseApp(a, idx));
    }
    return DEFAULT_FALLBACK_APPS;
  }, [apps, internalApps]);

  // Keep index within bounds if apps list changes dynamically
  useEffect(() => {
    if (activeAppIdx >= showcaseApps.length && showcaseApps.length > 0) {
      setActiveAppIdx(0);
    }
  }, [showcaseApps.length, activeAppIdx]);

  // Auto-cycle through all synchronized apps every N seconds
  useEffect(() => {
    if (showcaseApps.length <= 1) return;

    const interval = setInterval(() => {
      // Pause advancing if user is actively dragging the 3D model
      if (!isDraggingRef.current) {
        setActiveAppIdx((prev) => (prev + 1) % showcaseApps.length);
      }
    }, cycleIntervalMs);

    return () => clearInterval(interval);
  }, [showcaseApps.length, cycleIntervalMs]);

  // References for Three.js state
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const phoneGroupRef = useRef<THREE.Group | null>(null);
  const screenTextureRef = useRef<THREE.CanvasTexture | null>(null);
  const screenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const holoRingsGroupRef = useRef<THREE.Group | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const neonLightRef = useRef<THREE.PointLight | null>(null);
  const cyanLightRef = useRef<THREE.PointLight | null>(null);

  // Mouse / Drag state
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const isDraggingRef = useRef(false);
  const previousPointerPosition = useRef({ x: 0, y: 0 });
  const rotationVelocityRef = useRef({ x: 0, y: 0 });

  // Update screen canvas texture when active app changes
  const updateScreenTexture = useCallback((app: ShowcaseApp) => {
    if (!screenCanvasRef.current || !screenTextureRef.current) return;

    const renderToCanvas = (previewImg: HTMLImageElement | null = null) => {
      if (!screenCanvasRef.current || !screenTextureRef.current) return;
      drawAndroidScreenCanvas(screenCanvasRef.current, {
        appName: app.name,
        tagline: app.tagline,
        category: app.category,
        badge: app.badge,
        version: app.version,
        rating: app.rating,
        accentColor: app.color1,
        secondaryColor: app.color2,
        previewImage: previewImg,
      });
      screenTextureRef.current.needsUpdate = true;
    };

    if (app.screenshotUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => renderToCanvas(img);
      img.onerror = () => renderToCanvas(null);
      img.src = app.screenshotUrl;
    } else {
      renderToCanvas(null);
    }

    // Dynamic light color update to match current app's branding
    if (neonLightRef.current && cyanLightRef.current) {
      neonLightRef.current.color.set(app.color1);
      cyanLightRef.current.color.set(app.color2);
    }
  }, []);

  // Update canvas texture whenever activeAppIdx or showcaseApps changes
  useEffect(() => {
    if (showcaseApps.length === 0) return;
    const current = showcaseApps[activeAppIdx] || showcaseApps[0];
    if (current) {
      updateScreenTexture(current);
    }
  }, [activeAppIdx, showcaseApps, updateScreenTexture]);

  // Main Three.js Scene Setup
  useEffect(() => {
    if (!isWebGLAvailable()) {
      setHasWebGL(false);
      return;
    }

    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    // Create Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const width = container.clientWidth || 500;
    const height = container.clientHeight || 580;
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(0, 0, 8.5);

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2.2);
    dirLight.position.set(5, 8, 6);
    scene.add(dirLight);

    const backLight = new THREE.DirectionalLight(0x8b5cf6, 2.8);
    backLight.position.set(-6, -4, -6);
    scene.add(backLight);

    const neonPointLight = new THREE.PointLight(0xa855f7, 4.0, 14);
    neonPointLight.position.set(3, 2, 3);
    scene.add(neonPointLight);
    neonLightRef.current = neonPointLight;

    const cyanPointLight = new THREE.PointLight(0x06b6d4, 3.5, 14);
    cyanPointLight.position.set(-3, -2, 2.5);
    scene.add(cyanPointLight);
    cyanLightRef.current = cyanPointLight;

    // ==========================================
    // 3D Flagship Phone Model Construction
    // ==========================================
    const phoneGroup = new THREE.Group();
    phoneGroupRef.current = phoneGroup;

    // 1. Phone Frame (Dark Titanium Curved Edge)
    const phoneWidth = 2.45;
    const phoneHeight = 4.95;
    const phoneDepth = 0.22;
    const frameGeometry = new THREE.BoxGeometry(phoneWidth, phoneHeight, phoneDepth);
    const frameMaterial = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      metalness: 0.9,
      roughness: 0.25,
    });
    const phoneFrame = new THREE.Mesh(frameGeometry, frameMaterial);
    phoneGroup.add(phoneFrame);

    // 2. Bezel Ring Outer Rim (Subtle purple/chrome sheen)
    const rimGeom = new THREE.BoxGeometry(phoneWidth + 0.04, phoneHeight + 0.04, phoneDepth * 0.9);
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0x2e1065,
      metalness: 0.85,
      roughness: 0.2,
      emissive: 0x581c87,
      emissiveIntensity: 0.35,
    });
    const rimMesh = new THREE.Mesh(rimGeom, rimMat);
    phoneGroup.add(rimMesh);

    // 3. Dynamic Screen Texture (Offscreen Canvas)
    const screenCanvas = document.createElement('canvas');
    screenCanvas.width = 512;
    screenCanvas.height = 1024;
    screenCanvasRef.current = screenCanvas;

    const initialApp = showcaseApps[0] || DEFAULT_FALLBACK_APPS[0];
    drawAndroidScreenCanvas(screenCanvas, {
      appName: initialApp.name,
      tagline: initialApp.tagline,
      category: initialApp.category,
      badge: initialApp.badge,
      version: initialApp.version,
      rating: initialApp.rating,
      accentColor: initialApp.color1,
      secondaryColor: initialApp.color2,
    });

    const screenTexture = new THREE.CanvasTexture(screenCanvas);
    screenTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    screenTextureRef.current = screenTexture;

    const screenGeometry = new THREE.PlaneGeometry(phoneWidth - 0.12, phoneHeight - 0.14);
    const screenMaterial = new THREE.MeshStandardMaterial({
      map: screenTexture,
      roughness: 0.2,
      metalness: 0.1,
      emissive: 0xffffff,
      emissiveMap: screenTexture,
      emissiveIntensity: 0.38,
    });
    const screenMesh = new THREE.Mesh(screenGeometry, screenMaterial);
    screenMesh.position.z = phoneDepth / 2 + 0.005;
    phoneGroup.add(screenMesh);

    // 4. Glass Reflection Front Overlay
    const glassGeometry = new THREE.PlaneGeometry(phoneWidth - 0.06, phoneHeight - 0.06);
    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.15,
      roughness: 0.05,
      metalness: 0.1,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
    });
    const glassMesh = new THREE.Mesh(glassGeometry, glassMaterial);
    glassMesh.position.z = phoneDepth / 2 + 0.01;
    phoneGroup.add(glassMesh);

    // 5. Triple Camera Island on Back
    const camIslandGeom = new THREE.BoxGeometry(0.85, 1.35, 0.08);
    const camIslandMat = new THREE.MeshStandardMaterial({
      color: 0x09090b,
      metalness: 0.8,
      roughness: 0.3,
    });
    const camIsland = new THREE.Mesh(camIslandGeom, camIslandMat);
    camIsland.position.set(-phoneWidth / 4, phoneHeight / 4, -(phoneDepth / 2 + 0.04));
    phoneGroup.add(camIsland);

    // Camera Lenses
    for (let i = 0; i < 3; i++) {
      const lensGeom = new THREE.CylinderGeometry(0.12, 0.12, 0.04, 32);
      lensGeom.rotateX(Math.PI / 2);
      const lensMat = new THREE.MeshStandardMaterial({
        color: 0x020617,
        metalness: 0.95,
        roughness: 0.1,
        emissive: 0x3b82f6,
        emissiveIntensity: 0.5,
      });
      const lens = new THREE.Mesh(lensGeom, lensMat);
      lens.position.set(
        -phoneWidth / 4,
        phoneHeight / 4 + 0.42 - i * 0.42,
        -(phoneDepth / 2 + 0.085)
      );
      phoneGroup.add(lens);
    }

    // Side Volume & Power Buttons
    const powerBtnGeom = new THREE.BoxGeometry(0.04, 0.6, 0.06);
    const btnMat = new THREE.MeshStandardMaterial({ color: 0x3f3f46, metalness: 0.9, roughness: 0.3 });
    const powerBtn = new THREE.Mesh(powerBtnGeom, btnMat);
    powerBtn.position.set(phoneWidth / 2 + 0.02, 0.4, 0);
    phoneGroup.add(powerBtn);

    const volBtnGeom = new THREE.BoxGeometry(0.04, 0.9, 0.06);
    const volBtn = new THREE.Mesh(volBtnGeom, btnMat);
    volBtn.position.set(-(phoneWidth / 2 + 0.02), 0.5, 0);
    phoneGroup.add(volBtn);

    // Initial phone orientation
    phoneGroup.rotation.y = -0.32;
    phoneGroup.rotation.x = 0.15;
    scene.add(phoneGroup);

    // ==========================================
    // Holographic Cyber Rings & Orbiting Tokens
    // ==========================================
    // Subtle Studio Pedestal Glow Ring beneath Phone
    const holoRingsGroup = new THREE.Group();
    holoRingsGroupRef.current = holoRingsGroup;

    const ringGeom = new THREE.RingGeometry(2.4, 2.45, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xa855f7,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
    });
    const pedestalRing = new THREE.Mesh(ringGeom, ringMat);
    pedestalRing.rotation.x = Math.PI / 2;
    pedestalRing.position.y = -3.2;
    holoRingsGroup.add(pedestalRing);
    scene.add(holoRingsGroup);

    // ==========================================
    // 3D Ambient Particle Starfield
    // ==========================================
    const particleCount = 280;
    const particleGeom = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);

    const c1 = new THREE.Color(0xa855f7); // Purple
    const c2 = new THREE.Color(0x6366f1); // Indigo
    const c3 = new THREE.Color(0x38bdf8); // Sky Cyan

    for (let i = 0; i < particleCount; i++) {
      const idx = i * 3;
      particlePositions[idx] = (Math.random() - 0.5) * 16;
      particlePositions[idx + 1] = (Math.random() - 0.5) * 14;
      particlePositions[idx + 2] = (Math.random() - 0.5) * 12;

      const mixedColor = i % 3 === 0 ? c1 : i % 3 === 1 ? c2 : c3;
      particleColors[idx] = mixedColor.r;
      particleColors[idx + 1] = mixedColor.g;
      particleColors[idx + 2] = mixedColor.b;
    }

    particleGeom.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeom.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.065,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeom, particleMat);
    particlesRef.current = particles;
    scene.add(particles);

    // ==========================================
    // Pointer Drag & Move Event Listeners
    // ==========================================
    const handlePointerDown = (e: PointerEvent) => {
      isDraggingRef.current = true;
      setIsDragging(true);
      previousPointerPosition.current = { x: e.clientX, y: e.clientY };
    };

    const handlePointerMove = (e: PointerEvent) => {
      // Parallax mouse coordinates
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mouseRef.current.targetX = x * 0.45;
      mouseRef.current.targetY = y * 0.35;

      // Drag rotation
      if (isDraggingRef.current && phoneGroupRef.current) {
        const deltaX = e.clientX - previousPointerPosition.current.x;
        const deltaY = e.clientY - previousPointerPosition.current.y;

        rotationVelocityRef.current = {
          x: deltaY * 0.005,
          y: deltaX * 0.005,
        };

        phoneGroupRef.current.rotation.y += deltaX * 0.008;
        phoneGroupRef.current.rotation.x += deltaY * 0.008;

        previousPointerPosition.current = { x: e.clientX, y: e.clientY };
      }
    };

    const handlePointerUp = () => {
      isDraggingRef.current = false;
      setIsDragging(false);
    };

    container.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    // Resize Handler
    const handleResize = () => {
      if (!container || !rendererRef.current) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      rendererRef.current.setSize(newWidth, newHeight);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // ==========================================
    // Animation Loop
    // ==========================================
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // Smooth mouse lerping
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.06;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.06;

      if (phoneGroupRef.current) {
        // Floating bobbing motion
        const bobOffset = Math.sin(elapsedTime * 1.5) * 0.08;
        phoneGroupRef.current.position.y = bobOffset;

        // Auto rotation when not dragging
        if (!isDraggingRef.current) {
          phoneGroupRef.current.rotation.y += 0.005;
          // Inertia damping
          phoneGroupRef.current.rotation.y += rotationVelocityRef.current.y;
          phoneGroupRef.current.rotation.x += rotationVelocityRef.current.x;
          rotationVelocityRef.current.x *= 0.92;
          rotationVelocityRef.current.y *= 0.92;

          // Parallax tilt applied softly
          phoneGroupRef.current.rotation.z = -mouseRef.current.x * 0.2;
        }
      }

      // Rotate holographic rings and floating tokens
      if (holoRingsGroupRef.current) {
        holoRingsGroupRef.current.rotation.y = elapsedTime * 0.15;
        holoRingsGroupRef.current.rotation.z = Math.sin(elapsedTime * 0.5) * 0.1;

        // Animate Kotlin gem & Compose token
        const gem = holoRingsGroupRef.current.children[2];
        if (gem) {
          gem.rotation.y += 0.02;
          gem.rotation.x += 0.015;
          gem.position.y = 1.8 + Math.sin(elapsedTime * 2.0) * 0.12;
        }

        const compose = holoRingsGroupRef.current.children[3];
        if (compose) {
          compose.rotation.z += 0.02;
          compose.position.y = -1.2 + Math.cos(elapsedTime * 2.2) * 0.12;
        }

        const star = holoRingsGroupRef.current.children[4];
        if (star) {
          star.rotation.y += 0.025;
          star.position.y = 2.2 + Math.sin(elapsedTime * 1.8 + 1) * 0.1;
        }
      }

      // Animate background particles
      if (particlesRef.current) {
        particlesRef.current.rotation.y = elapsedTime * 0.03;
        particlesRef.current.rotation.x = Math.sin(elapsedTime * 0.05) * 0.05;
      }

      // Dynamic light movement
      if (neonLightRef.current) {
        neonLightRef.current.position.x = Math.sin(elapsedTime * 1.2) * 4;
        neonLightRef.current.position.y = Math.cos(elapsedTime * 1.0) * 3;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup on unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      container.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      resizeObserver.disconnect();
      disposeThreeScene(scene);
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative w-full h-[520px] sm:h-[600px] flex items-center justify-center select-none overflow-hidden rounded-3xl"
      style={{ touchAction: 'none' }}
    >
      {/* Three.js Canvas */}
      {hasWebGL ? (
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-grab active:cursor-grabbing outline-none"
          title="Interactive 3D Android Device"
        />
      ) : (
        /* CSS 3D Fallback for legacy browsers without WebGL */
        <div className="flex flex-col items-center justify-center p-8 text-center bg-zinc-900/60 border border-purple-900/40 rounded-3xl">
          <Smartphone className="w-16 h-16 text-purple-400 mb-4 animate-bounce" />
          <h4 className="font-bold text-lg text-zinc-100">
            {showcaseApps[activeAppIdx]?.name || 'Android Compose 3D'}
          </h4>
          <p className="text-xs text-zinc-400 max-w-xs mt-2">
            {showcaseApps[activeAppIdx]?.tagline || 'Rendering modern Android Jetpack Compose native applications with zero telemetry.'}
          </p>
        </div>
      )}

      {/* Tasteful Ambient Time Progression Bar (Synchronized with 10s auto-cycle, zero clunky buttons) */}
      <div className="absolute bottom-5 inset-x-6 sm:inset-x-12 flex flex-col items-center gap-2 pointer-events-none">
        {/* Subtle App Label & Counter */}
        <div className="flex items-center justify-between w-full max-w-xs px-1 text-[11px] text-zinc-400 font-medium select-none">
          <span className="flex items-center gap-1.5 font-semibold text-zinc-200">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{
                backgroundColor: showcaseApps[activeAppIdx]?.color1,
                boxShadow: `0 0 8px ${showcaseApps[activeAppIdx]?.color1}`,
              }}
            />
            {showcaseApps[activeAppIdx]?.name}
          </span>
          <span className="text-[10px] text-zinc-500 font-mono">
            {activeAppIdx + 1} / {showcaseApps.length}
          </span>
        </div>

        {/* Minimalist Segmented Timeline Bars */}
        <div className="w-full max-w-xs flex items-center gap-1.5 p-1 rounded-full bg-zinc-950/70 backdrop-blur-md border border-zinc-800/80 shadow-2xl">
          {showcaseApps.map((app, idx) => {
            const isActive = activeAppIdx === idx;
            const isPast = idx < activeAppIdx;
            return (
              <button
                key={app.slug || idx}
                type="button"
                onClick={() => setActiveAppIdx(idx)}
                className="group relative flex-1 h-1 rounded-full bg-zinc-800/80 hover:h-1.5 transition-all duration-200 overflow-hidden cursor-pointer pointer-events-auto"
                title={`Showcase ${app.name}`}
                aria-label={`Showcase ${app.name}`}
              >
                {/* Progress Fill */}
                <div
                  key={`timeline-${activeAppIdx}-${idx}`}
                  className="h-full rounded-full transition-all"
                  style={{
                    backgroundColor: isActive ? app.color1 : isPast ? '#71717a' : 'transparent',
                    boxShadow: isActive ? `0 0 8px ${app.color1}` : 'none',
                    width: isPast ? '100%' : '0%',
                    animation: isActive && !isDragging
                      ? `heroTimelineFill ${cycleIntervalMs}ms linear forwards`
                      : undefined,
                  }}
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
