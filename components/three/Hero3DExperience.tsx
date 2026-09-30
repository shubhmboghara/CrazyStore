'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { isWebGLAvailable, disposeThreeScene, drawAndroidScreenCanvas, ScreenCanvasOptions } from '@/lib/threeUtils';
import { Sparkles, RotateCw, Play, Pause, Layers, Smartphone, RefreshCw } from 'lucide-react';

interface Hero3DExperienceProps {
  onExploreClick?: () => void;
}

const PRESET_APPS: Array<{ name: string; category: string; badge: string; version: string; rating: number; color1: string; color2: string; tagline: string }> = [
  {
    name: 'VideoHub',
    category: 'Media & Video',
    badge: 'Kotlin + Compose',
    version: 'v1.4.2',
    rating: 4.9,
    color1: '#8b5cf6',
    color2: '#6366f1',
    tagline: 'Ad-Free High-Definition Player for Android',
  },
  {
    name: 'AudioForge',
    category: 'Music & Audio',
    badge: 'Modern Jetpack M3',
    version: 'v2.1.0',
    rating: 5.0,
    color1: '#ec4899',
    color2: '#8b5cf6',
    tagline: 'Lossless Hi-Res Audio Engine & Visualizer',
  },
  {
    name: 'FitTrack Pro',
    category: 'Health & Fitness',
    badge: 'Room + Coroutines',
    version: 'v1.0.8',
    rating: 4.8,
    color1: '#10b981',
    color2: '#06b6d4',
    tagline: 'Zero-Telemetry Native Workout Companion',
  },
];

export function Hero3DExperience({ onExploreClick }: Hero3DExperienceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [hasWebGL, setHasWebGL] = useState<boolean>(true);
  const [isRotating, setIsRotating] = useState<boolean>(true);
  const [activeAppIdx, setActiveAppIdx] = useState<number>(0);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [pulseActive, setPulseActive] = useState<boolean>(false);

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
  const updateScreenTexture = useCallback((appIdx: number) => {
    if (!screenCanvasRef.current || !screenTextureRef.current) return;
    const currentApp = PRESET_APPS[appIdx];
    drawAndroidScreenCanvas(screenCanvasRef.current, {
      appName: currentApp.name,
      tagline: currentApp.tagline,
      category: currentApp.category,
      badge: currentApp.badge,
      version: currentApp.version,
      rating: currentApp.rating,
      accentColor: currentApp.color1,
      secondaryColor: currentApp.color2,
    });
    screenTextureRef.current.needsUpdate = true;
  }, []);

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

    const currentApp = PRESET_APPS[0];
    drawAndroidScreenCanvas(screenCanvas, {
      appName: currentApp.name,
      tagline: currentApp.tagline,
      category: currentApp.category,
      badge: currentApp.badge,
      version: currentApp.version,
      rating: currentApp.rating,
      accentColor: currentApp.color1,
      secondaryColor: currentApp.color2,
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
    const holoRingsGroup = new THREE.Group();
    holoRingsGroupRef.current = holoRingsGroup;

    // Glowing Neon Ring 1
    const ringGeom1 = new THREE.TorusGeometry(3.6, 0.018, 16, 100);
    const ringMat1 = new THREE.MeshBasicMaterial({
      color: 0xa855f7,
      transparent: true,
      opacity: 0.45,
    });
    const ring1 = new THREE.Mesh(ringGeom1, ringMat1);
    ring1.rotation.x = Math.PI / 2.3;
    ring1.rotation.y = Math.PI / 6;
    holoRingsGroup.add(ring1);

    // Glowing Cyan Ring 2
    const ringGeom2 = new THREE.TorusGeometry(4.2, 0.015, 16, 100);
    const ringMat2 = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.35,
    });
    const ring2 = new THREE.Mesh(ringGeom2, ringMat2);
    ring2.rotation.x = -Math.PI / 2.6;
    ring2.rotation.z = Math.PI / 5;
    holoRingsGroup.add(ring2);

    // Floating 3D Kotlin Gem (Octahedron)
    const gemGeom = new THREE.OctahedronGeometry(0.35);
    const gemMat = new THREE.MeshStandardMaterial({
      color: 0xc084fc,
      emissive: 0x9333ea,
      emissiveIntensity: 0.7,
      roughness: 0.2,
      metalness: 0.8,
    });
    const kotlinGem = new THREE.Mesh(gemGeom, gemMat);
    kotlinGem.position.set(2.8, 1.8, 1.2);
    holoRingsGroup.add(kotlinGem);

    // Floating 3D Compose Hexagon Token
    const composeGeom = new THREE.CylinderGeometry(0.3, 0.3, 0.08, 6);
    const composeMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.8,
      metalness: 0.9,
      roughness: 0.2,
    });
    const composeToken = new THREE.Mesh(composeGeom, composeMat);
    composeToken.position.set(-2.8, -1.2, 1.0);
    composeToken.rotation.x = Math.PI / 3;
    holoRingsGroup.add(composeToken);

    // Floating 3D Android Star Rating Badge
    const starGeom = new THREE.DodecahedronGeometry(0.26);
    const starMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      emissive: 0xd97706,
      emissiveIntensity: 0.75,
      metalness: 0.9,
      roughness: 0.1,
    });
    const starBadge = new THREE.Mesh(starGeom, starMat);
    starBadge.position.set(-2.4, 2.2, -0.5);
    holoRingsGroup.add(starBadge);

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
          if (isRotating) {
            phoneGroupRef.current.rotation.y += 0.006;
          }
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
  }, [isRotating]);

  // Handle switching preview apps
  const handleNextApp = () => {
    const nextIdx = (activeAppIdx + 1) % PRESET_APPS.length;
    setActiveAppIdx(nextIdx);
    updateScreenTexture(nextIdx);
  };

  // Handle Holographic Pulse Trigger
  const triggerHoloPulse = () => {
    if (pulseActive) return;
    setPulseActive(true);
    if (neonLightRef.current && cyanLightRef.current) {
      neonLightRef.current.intensity = 8.0;
      cyanLightRef.current.intensity = 7.0;
      setTimeout(() => {
        if (neonLightRef.current && cyanLightRef.current) {
          neonLightRef.current.intensity = 4.0;
          cyanLightRef.current.intensity = 3.5;
        }
        setPulseActive(false);
      }, 700);
    }
  };

  const resetCamera = () => {
    if (phoneGroupRef.current) {
      phoneGroupRef.current.rotation.set(0.15, -0.32, 0);
      rotationVelocityRef.current = { x: 0, y: 0 };
    }
  };

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
          title="Interactive 3D Android Flagship: Click & drag to rotate 360°"
        />
      ) : (
        /* CSS 3D Fallback for legacy browsers without WebGL */
        <div className="flex flex-col items-center justify-center p-8 text-center bg-zinc-900/60 border border-purple-900/40 rounded-3xl">
          <Smartphone className="w-16 h-16 text-purple-400 mb-4 animate-bounce" />
          <h4 className="font-bold text-lg text-zinc-100">Android Compose 3D Preview</h4>
          <p className="text-xs text-zinc-400 max-w-xs mt-2">
            Rendering modern Android Jetpack Compose native applications with zero telemetry.
          </p>
        </div>
      )}

      {/* Floating 3D Experience Interactive HUD Controls */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none">
        {/* Active App Badge in 3D */}
        <div className="pointer-events-auto flex items-center gap-2 bg-zinc-950/80 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-zinc-800 shadow-xl">
          <div
            className="w-3 h-3 rounded-full animate-ping"
            style={{ backgroundColor: PRESET_APPS[activeAppIdx].color1 }}
          />
          <div className="flex flex-col">
            <span className="text-[11px] font-extrabold text-zinc-100 flex items-center gap-1.5">
              3D Live: {PRESET_APPS[activeAppIdx].name}
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-950/90 text-purple-300 font-bold border border-purple-800/40">
                {PRESET_APPS[activeAppIdx].badge}
              </span>
            </span>
            <span className="text-[10px] text-zinc-400">
              Drag to rotate 360° • Pinch to inspect
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Switch App Preview */}
          <button
            onClick={handleNextApp}
            className="p-2.5 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 hover:border-purple-600/50 shadow-lg backdrop-blur-md transition-all active:scale-95 flex items-center gap-1.5 text-xs font-bold"
            title="Switch 3D Screen App"
          >
            <Layers className="w-4 h-4 text-purple-400" />
            <span className="hidden sm:inline">Switch App</span>
          </button>

          {/* Holo Pulse */}
          <button
            onClick={triggerHoloPulse}
            disabled={pulseActive}
            className={`p-2.5 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 hover:border-cyan-500/50 shadow-lg backdrop-blur-md transition-all active:scale-95 ${
              pulseActive ? 'ring-2 ring-purple-500 text-purple-300' : ''
            }`}
            title="Trigger 3D Holographic Pulse"
            aria-label="Trigger 3D Holographic Pulse"
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
          </button>

          {/* Auto Rotate Toggle */}
          <button
            onClick={() => setIsRotating(!isRotating)}
            className="p-2.5 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 hover:border-purple-500/50 shadow-lg backdrop-blur-md transition-all active:scale-95"
            title={isRotating ? 'Pause 3D Rotation' : 'Resume 3D Rotation'}
            aria-label={isRotating ? 'Pause 3D Rotation' : 'Resume 3D Rotation'}
          >
            {isRotating ? (
              <Pause className="w-4 h-4 text-purple-400" />
            ) : (
              <Play className="w-4 h-4 text-purple-400" />
            )}
          </button>

          {/* Reset Camera View */}
          <button
            onClick={resetCamera}
            className="p-2.5 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 hover:border-purple-500/50 shadow-lg backdrop-blur-md transition-all active:scale-95"
            title="Reset 3D Camera View"
            aria-label="Reset 3D Camera View"
          >
            <RefreshCw className="w-4 h-4 text-zinc-400 hover:text-zinc-200" />
          </button>
        </div>
      </div>
    </div>
  );
}
