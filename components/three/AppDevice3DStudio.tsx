'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { isWebGLAvailable, disposeThreeScene, drawAndroidScreenCanvas } from '@/lib/threeUtils';
import { AndroidApp } from '@/lib/appsData';
import {
  RotateCcw,
  Sparkles,
  Maximize2,
  Minimize2,
  Play,
  Pause,
  ImageIcon,
  Smartphone,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Zap,
} from 'lucide-react';

interface AppDevice3DStudioProps {
  app: AndroidApp;
  onClose?: () => void;
}

type StudioTheme = 'cyber' | 'studio' | 'gold';

export function AppDevice3DStudio({ app, onClose }: AppDevice3DStudioProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [hasWebGL, setHasWebGL] = useState<boolean>(true);
  const [selectedScreenshotIdx, setSelectedScreenshotIdx] = useState<number>(0);
  const [isAutoRotating, setIsAutoRotating] = useState<boolean>(true);
  const [studioTheme, setStudioTheme] = useState<StudioTheme>('cyber');
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [imageLoadError, setImageLoadError] = useState<boolean>(false);

  // Three.js object refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const screenMeshRef = useRef<THREE.Mesh | null>(null);
  const screenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const screenTextureRef = useRef<THREE.CanvasTexture | null>(null);
  const dirLightRef = useRef<THREE.DirectionalLight | null>(null);
  const pointLight1Ref = useRef<THREE.PointLight | null>(null);
  const pointLight2Ref = useRef<THREE.PointLight | null>(null);

  // Normalize screenshots
  const validScreenshots = (app.screenshots || [])
    .map((s: any, idx: number) => {
      const url = typeof s === 'string' ? s : s?.imageUrl || s?.url || '';
      return url
        ? {
            id: s.id || `shot-${idx}`,
            url,
            title: s.title || `Screen ${idx + 1}`,
          }
        : null;
    })
    .filter(Boolean) as Array<{ id: string; url: string; title: string }>;

  // Update 3D screen texture when current screenshot or theme changes
  const updateDeviceScreen = useCallback(
    (screenshotUrl?: string) => {
      if (!screenCanvasRef.current || !screenTextureRef.current) return;

      const screenCanvas = screenCanvasRef.current;

      if (screenshotUrl) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          setImageLoadError(false);
          drawAndroidScreenCanvas(screenCanvas, {
            appName: app.name,
            tagline: app.tagline || app.shortDescription,
            category: app.category,
            badge: app.badge,
            version: app.version,
            rating: app.initialRating || 5.0,
            previewImage: img,
          });
          if (screenTextureRef.current) {
            screenTextureRef.current.needsUpdate = true;
          }
        };
        img.onerror = () => {
          setImageLoadError(true);
          // Fallback to high-res synthesized Android OS UI
          drawAndroidScreenCanvas(screenCanvas, {
            appName: app.name,
            tagline: app.tagline || app.shortDescription,
            category: app.category,
            badge: app.badge,
            version: app.version,
            rating: app.initialRating || 5.0,
            accentColor: app.iconBg?.includes('emerald') ? '#10b981' : '#8b5cf6',
          });
          if (screenTextureRef.current) {
            screenTextureRef.current.needsUpdate = true;
          }
        };
        img.src = screenshotUrl;
      } else {
        drawAndroidScreenCanvas(screenCanvas, {
          appName: app.name,
          tagline: app.tagline || app.shortDescription,
          category: app.category,
          badge: app.badge,
          version: app.version,
          rating: app.initialRating || 5.0,
          accentColor: '#8b5cf6',
          secondaryColor: '#6366f1',
        });
        screenTextureRef.current.needsUpdate = true;
      }
    },
    [app]
  );

  // Setup Three.js WebGL Scene
  useEffect(() => {
    if (!isWebGLAvailable()) {
      setHasWebGL(false);
      return;
    }

    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 500;
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0.5, 7.5);

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
    renderer.toneMappingExposure = 1.3;
    rendererRef.current = renderer;

    // Orbit Controls
    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 3.5;
    controls.maxDistance = 14;
    controls.autoRotate = isAutoRotating;
    controls.autoRotateSpeed = 1.8;
    controlsRef.current = controls;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2.0);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);
    dirLightRef.current = dirLight;

    const pLight1 = new THREE.PointLight(0xa855f7, 4.0, 15);
    pLight1.position.set(4, 3, 3);
    scene.add(pLight1);
    pointLight1Ref.current = pLight1;

    const pLight2 = new THREE.PointLight(0x06b6d4, 3.5, 15);
    pLight2.position.set(-4, -2, 3);
    scene.add(pLight2);
    pointLight2Ref.current = pLight2;

    // ==========================================
    // Phone Device Construction
    // ==========================================
    const phone = new THREE.Group();

    // Body
    const phoneW = 2.45;
    const phoneH = 4.95;
    const phoneD = 0.22;

    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x1c1917,
      metalness: 0.85,
      roughness: 0.25,
    });
    const frame = new THREE.Mesh(new THREE.BoxGeometry(phoneW, phoneH, phoneD), frameMat);
    phone.add(frame);

    // Bezel
    const bezelMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      metalness: 0.9,
      roughness: 0.15,
      emissive: 0x0284c7,
      emissiveIntensity: 0.2,
    });
    const bezel = new THREE.Mesh(
      new THREE.BoxGeometry(phoneW + 0.03, phoneH + 0.03, phoneD * 0.92),
      bezelMat
    );
    phone.add(bezel);

    // Dynamic Screen Texture Canvas
    const screenCanvas = document.createElement('canvas');
    screenCanvas.width = 512;
    screenCanvas.height = 1024;
    screenCanvasRef.current = screenCanvas;

    const screenTexture = new THREE.CanvasTexture(screenCanvas);
    screenTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    screenTextureRef.current = screenTexture;

    const screenMat = new THREE.MeshStandardMaterial({
      map: screenTexture,
      roughness: 0.15,
      metalness: 0.05,
      emissive: 0xffffff,
      emissiveMap: screenTexture,
      emissiveIntensity: 0.35,
    });
    const screenMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(phoneW - 0.12, phoneH - 0.14),
      screenMat
    );
    screenMesh.position.z = phoneD / 2 + 0.005;
    phone.add(screenMesh);
    screenMeshRef.current = screenMesh;

    // Glass Screen Protector
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.12,
      roughness: 0.05,
      metalness: 0.1,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
    });
    const glass = new THREE.Mesh(
      new THREE.PlaneGeometry(phoneW - 0.08, phoneH - 0.08),
      glassMat
    );
    glass.position.z = phoneD / 2 + 0.01;
    phone.add(glass);

    // Camera island on back
    const island = new THREE.Mesh(
      new THREE.BoxGeometry(0.85, 1.35, 0.08),
      new THREE.MeshStandardMaterial({ color: 0x0c0a09, metalness: 0.9, roughness: 0.2 })
    );
    island.position.set(-phoneW / 4, phoneH / 4, -(phoneD / 2 + 0.04));
    phone.add(island);

    // Back lenses
    for (let i = 0; i < 3; i++) {
      const lens = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.12, 0.04, 32),
        new THREE.MeshStandardMaterial({
          color: 0x020617,
          metalness: 0.95,
          roughness: 0.05,
          emissive: 0x3b82f6,
          emissiveIntensity: 0.4,
        })
      );
      lens.rotateX(Math.PI / 2);
      lens.position.set(-phoneW / 4, phoneH / 4 + 0.42 - i * 0.42, -(phoneD / 2 + 0.085));
      phone.add(lens);
    }

    scene.add(phone);

    // Circular pedestal platform under device
    const platform = new THREE.Mesh(
      new THREE.CylinderGeometry(2.6, 2.8, 0.15, 64),
      new THREE.MeshStandardMaterial({
        color: 0x18181b,
        metalness: 0.8,
        roughness: 0.3,
      })
    );
    platform.position.y = -phoneH / 2 - 0.35;
    scene.add(platform);

    // Glowing Neon Ring on platform
    const platformRing = new THREE.Mesh(
      new THREE.TorusGeometry(2.65, 0.02, 16, 80),
      new THREE.MeshBasicMaterial({ color: 0xa855f7, transparent: true, opacity: 0.8 })
    );
    platformRing.rotation.x = Math.PI / 2;
    platformRing.position.y = -phoneH / 2 - 0.27;
    scene.add(platformRing);

    // Initial Screen Render
    const initialUrl = validScreenshots[0]?.url;
    updateDeviceScreen(initialUrl);

    // Resize Observer
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
    const animate = () => {
      animId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      controls.dispose();
      disposeThreeScene(scene);
      renderer.dispose();
    };
  }, []);

  // Update auto rotate in controls when state changes
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = isAutoRotating;
    }
  }, [isAutoRotating]);

  // Update theme lighting
  useEffect(() => {
    if (!pointLight1Ref.current || !pointLight2Ref.current) return;
    if (studioTheme === 'cyber') {
      pointLight1Ref.current.color.setHex(0xa855f7);
      pointLight2Ref.current.color.setHex(0x06b6d4);
    } else if (studioTheme === 'studio') {
      pointLight1Ref.current.color.setHex(0xffffff);
      pointLight2Ref.current.color.setHex(0xe2e8f0);
    } else if (studioTheme === 'gold') {
      pointLight1Ref.current.color.setHex(0xf59e0b);
      pointLight2Ref.current.color.setHex(0xd97706);
    }
  }, [studioTheme]);

  // Select screenshot
  const handleSelectScreenshot = (idx: number) => {
    setSelectedScreenshotIdx(idx);
    const url = validScreenshots[idx]?.url;
    updateDeviceScreen(url);
  };

  const handleResetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  return (
    <div
      className={`relative w-full rounded-3xl bg-zinc-950 border border-zinc-800 overflow-hidden flex flex-col shadow-2xl transition-all duration-300 ${
        isExpanded ? 'fixed inset-4 z-50 rounded-3xl' : 'min-h-[580px]'
      }`}
    >
      {/* Studio Header Bar */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-900/60 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-950/80 text-purple-400 border border-purple-800/40">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm sm:text-base text-zinc-100">
                3D Interactive Device Studio
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950/80 text-purple-300 border border-purple-800/40">
                WebGL 60FPS
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Inspect {app.name} natively projected onto a 3D Android Flagship device
            </p>
          </div>
        </div>

        {/* Top Controls */}
        <div className="flex items-center gap-2">
          {/* Lighting Mode Selector */}
          <div className="hidden sm:flex items-center bg-zinc-900 rounded-xl p-1 border border-zinc-800">
            <button
              onClick={() => setStudioTheme('cyber')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                studioTheme === 'cyber' ? 'bg-purple-600 text-white shadow' : 'text-zinc-400 hover:text-white'
              }`}
              title="Cyber Neon Lights"
            >
              <Zap className="w-3 h-3" /> Cyber
            </button>
            <button
              onClick={() => setStudioTheme('studio')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                studioTheme === 'studio' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-400 hover:text-white'
              }`}
              title="Studio Daylight"
            >
              <Sun className="w-3 h-3" /> Studio
            </button>
          </div>

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-all active:scale-95"
            title={isExpanded ? 'Exit Fullscreen' : 'Expand Studio'}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-xs font-bold transition-all"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Main 3D Canvas Viewport */}
      <div
        ref={containerRef}
        className="relative flex-1 w-full min-h-[400px] flex items-center justify-center select-none"
      >
        {hasWebGL ? (
          <canvas
            ref={canvasRef}
            className="w-full h-full cursor-grab active:cursor-grabbing outline-none"
            title="3D Device Studio: Click & drag to rotate • Scroll to zoom • Right click to pan"
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <Smartphone className="w-16 h-16 text-purple-400 mb-4 animate-pulse" />
            <h4 className="font-bold text-lg text-zinc-100">WebGL Required</h4>
            <p className="text-xs text-zinc-400 max-w-sm mt-1">
              Please enable hardware acceleration in your browser to experience the 3D Device Studio.
            </p>
          </div>
        )}

        {/* Viewport Floating HUD / Shortcuts */}
        <div className="absolute top-4 left-4 pointer-events-none">
          <div className="bg-zinc-950/75 backdrop-blur-md px-3 py-1.5 rounded-xl border border-zinc-800/80 text-[11px] text-zinc-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Left-drag to Orbit • Scroll to Zoom • Right-drag to Pan</span>
          </div>
        </div>

        {/* Bottom Floating Actions */}
        <div className="absolute bottom-4 right-4 flex items-center gap-2">
          <button
            onClick={() => setIsAutoRotating(!isAutoRotating)}
            className="p-2.5 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 backdrop-blur-md shadow-lg transition-all active:scale-95"
            title={isAutoRotating ? 'Pause Rotation' : 'Auto Rotate 360°'}
          >
            {isAutoRotating ? (
              <Pause className="w-4 h-4 text-purple-400" />
            ) : (
              <Play className="w-4 h-4 text-purple-400" />
            )}
          </button>

          <button
            onClick={handleResetCamera}
            className="p-2.5 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 backdrop-blur-md shadow-lg transition-all active:scale-95"
            title="Reset Device Orientation"
          >
            <RotateCcw className="w-4 h-4 text-zinc-400 hover:text-zinc-200" />
          </button>
        </div>
      </div>

      {/* Screenshot Selector Bar (Project onto 3D Screen) */}
      {validScreenshots.length > 0 && (
        <div className="p-4 border-t border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-zinc-400 flex items-center gap-1.5 uppercase tracking-wider">
              <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
              Project Screen on 3D Device ({selectedScreenshotIdx + 1}/{validScreenshots.length})
            </span>
            <span className="text-[10px] text-zinc-500">Click any slide to project</span>
          </div>

          <div className="flex items-center gap-2.5 overflow-x-auto pb-1 hide-scrollbar">
            {validScreenshots.map((shot, idx) => (
              <button
                key={shot.id}
                onClick={() => handleSelectScreenshot(idx)}
                className={`relative shrink-0 w-20 h-14 rounded-xl overflow-hidden border-2 transition-all ${
                  selectedScreenshotIdx === idx
                    ? 'border-purple-500 ring-2 ring-purple-500/40 scale-105'
                    : 'border-zinc-800 opacity-60 hover:opacity-100 hover:border-zinc-600'
                }`}
              >
                <img src={shot.url} alt={shot.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-1">
                  <span className="text-[9px] font-bold text-white truncate">{shot.title}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
