'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { isWebGLAvailable, disposeThreeScene, drawAndroidScreenCanvas } from '@/lib/threeUtils';
import { AndroidApp } from '@/lib/appsData';
import { Sparkles, Maximize2, RotateCcw, Smartphone, ChevronLeft, ChevronRight } from 'lucide-react';

interface Screenshots3DPhoneViewProps {
  app: AndroidApp;
  screenshots: Array<{ id: string; url: string; imageUrl?: string; title: string; subtitle?: string }>;
  activeIdx: number;
  onSelectScreenshot: (idx: number) => void;
  onOpenLightbox: (idx: number) => void;
}

export function Screenshots3DPhoneView({
  app,
  screenshots,
  activeIdx,
  onSelectScreenshot,
  onOpenLightbox,
}: Screenshots3DPhoneViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [hasWebGL, setHasWebGL] = useState<boolean>(true);
  const [hasInteracted, setHasInteracted] = useState<boolean>(false);

  // Three.js refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const phoneGroupRef = useRef<THREE.Group | null>(null);
  const screenMeshRef = useRef<THREE.Mesh | null>(null);
  const screenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const screenTextureRef = useRef<THREE.CanvasTexture | null>(null);

  // Update screen texture whenever activeIdx or screenshot changes
  const updateScreenTexture = useCallback(
    (targetUrl: string) => {
      if (!screenCanvasRef.current || !screenTextureRef.current) return;
      const canvas = screenCanvasRef.current;

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        drawAndroidScreenCanvas(canvas, {
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
        // Fallback to high-res synthesized Android OS UI
        drawAndroidScreenCanvas(canvas, {
          appName: app.name,
          tagline: app.tagline || app.shortDescription,
          category: app.category,
          badge: app.badge,
          version: app.version,
          rating: app.initialRating || 5.0,
          accentColor: '#8b5cf6',
          secondaryColor: '#6366f1',
        });
        if (screenTextureRef.current) {
          screenTextureRef.current.needsUpdate = true;
        }
      };
      img.src = targetUrl;
    },
    [app]
  );

  // Initialize Three.js Scene
  useEffect(() => {
    if (!isWebGLAvailable()) {
      setHasWebGL(false);
      return;
    }

    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 480;

    // 1. Scene & Fog
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x09090b, 0.035);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 0.3, 7.8);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    rendererRef.current = renderer;

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = false; // Prevent trapping page scroll
    controls.minPolarAngle = Math.PI / 4;
    controls.maxPolarAngle = Math.PI * 0.75;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.2;
    controls.addEventListener('start', () => setHasInteracted(true));
    controlsRef.current = controls;

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(4, 6, 6);
    scene.add(keyLight);

    const rimLight = new THREE.PointLight(0xa855f7, 4.0, 15);
    rimLight.position.set(-4, -2, 4);
    scene.add(rimLight);

    const fillLight = new THREE.PointLight(0x38bdf8, 3.0, 15);
    fillLight.position.set(4, -3, -3);
    scene.add(fillLight);

    // 6. Build High-End 3D Android Smartphone Model
    const phone = new THREE.Group();
    phoneGroupRef.current = phone;

    const phoneW = 2.45;
    const phoneH = 5.0;
    const phoneD = 0.22;

    // Chassis frame (Space-grade Titanium)
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      metalness: 0.9,
      roughness: 0.25,
    });
    const frame = new THREE.Mesh(new THREE.BoxGeometry(phoneW, phoneH, phoneD), frameMat);
    phone.add(frame);

    // Cyber Bezel Edge Accent
    const bezelMat = new THREE.MeshStandardMaterial({
      color: 0x8b5cf6,
      metalness: 0.85,
      roughness: 0.2,
      emissive: 0x7c3aed,
      emissiveIntensity: 0.3,
    });
    const bezel = new THREE.Mesh(
      new THREE.BoxGeometry(phoneW + 0.03, phoneH + 0.03, phoneD * 0.92),
      bezelMat
    );
    phone.add(bezel);

    // Dynamic 2D Canvas for screen projection
    const screenCanvas = document.createElement('canvas');
    screenCanvas.width = 512;
    screenCanvas.height = 1024;
    screenCanvasRef.current = screenCanvas;

    const screenTexture = new THREE.CanvasTexture(screenCanvas);
    screenTexture.colorSpace = THREE.SRGBColorSpace;
    screenTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    screenTextureRef.current = screenTexture;

    // Screen Mesh
    const screenMat = new THREE.MeshStandardMaterial({
      map: screenTexture,
      roughness: 0.15,
      metalness: 0.05,
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

    // Glass Screen Protector (Clearcoat reflection)
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.1,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
    });
    const glass = new THREE.Mesh(
      new THREE.PlaneGeometry(phoneW - 0.08, phoneH - 0.08),
      glassMat
    );
    glass.position.z = phoneD / 2 + 0.008;
    phone.add(glass);

    // Rear Camera Module Island
    const island = new THREE.Mesh(
      new THREE.BoxGeometry(0.85, 1.4, 0.08),
      new THREE.MeshStandardMaterial({ color: 0x09090b, metalness: 0.92, roughness: 0.15 })
    );
    island.position.set(-phoneW / 4, phoneH / 4, -(phoneD / 2 + 0.04));
    phone.add(island);

    // Triple Camera Lenses
    for (let i = 0; i < 3; i++) {
      const lens = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.12, 0.04, 32),
        new THREE.MeshStandardMaterial({
          color: 0x030712,
          metalness: 0.95,
          roughness: 0.05,
        })
      );
      lens.rotation.x = Math.PI / 2;
      lens.position.set(-phoneW / 4, phoneH / 4 + 0.4 - i * 0.4, -(phoneD / 2 + 0.09));
      phone.add(lens);
    }

    scene.add(phone);

    // Pedestal Platform
    const platform = new THREE.Mesh(
      new THREE.CylinderGeometry(2.4, 2.6, 0.15, 64),
      new THREE.MeshStandardMaterial({
        color: 0x18181b,
        metalness: 0.8,
        roughness: 0.3,
      })
    );
    platform.position.y = -phoneH / 2 - 0.28;
    scene.add(platform);

    // Glowing Neon Ring on Pedestal
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(2.45, 0.02, 16, 80),
      new THREE.MeshBasicMaterial({ color: 0xa855f7, transparent: true, opacity: 0.85 })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -phoneH / 2 - 0.22;
    scene.add(ring);

    // Ambient floating stardust
    const stardustCount = 80;
    const stardustGeo = new THREE.BufferGeometry();
    const stardustPos = new Float32Array(stardustCount * 3);
    for (let i = 0; i < stardustCount; i++) {
      stardustPos[i * 3] = (Math.random() - 0.5) * 14;
      stardustPos[i * 3 + 1] = (Math.random() - 0.5) * 8;
      stardustPos[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    stardustGeo.setAttribute('position', new THREE.BufferAttribute(stardustPos, 3));
    const stardustMat = new THREE.PointsMaterial({
      size: 0.04,
      color: 0xa855f7,
      transparent: true,
      opacity: 0.4,
    });
    const stardust = new THREE.Points(stardustGeo, stardustMat);
    scene.add(stardust);

    // 7. Initial Screen Render
    const initialUrl = screenshots[activeIdx]?.imageUrl || screenshots[activeIdx]?.url || '';
    updateScreenTexture(initialUrl);

    // 8. Visibility Throttle
    let isVisible = true;
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
      },
      { threshold: 0.05 }
    );
    observer.observe(container);

    // 9. Resize Handling
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (w > 0 && h > 0) {
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        }
      }
    });
    resizeObserver.observe(container);

    // 10. Animation Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);

      if (!isVisible) return;

      const elapsed = clock.getElapsedTime();

      // Gentle floating bob
      phone.position.y = Math.sin(elapsed * 1.5) * 0.08;

      // Update controls damping & auto-rotate
      controls.update();

      // Render
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      observer.disconnect();
      resizeObserver.disconnect();
      controls.dispose();
      disposeThreeScene(scene);
      renderer.dispose();
    };
  }, []);

  // Update texture when activeIdx changes
  useEffect(() => {
    const targetUrl = screenshots[activeIdx]?.imageUrl || screenshots[activeIdx]?.url || '';
    if (targetUrl) {
      updateScreenTexture(targetUrl);
    }
  }, [activeIdx, screenshots, updateScreenTexture]);

  const handleResetCamera = () => {
    if (!controlsRef.current || !cameraRef.current) return;
    controlsRef.current.reset();
    cameraRef.current.position.set(0, 0.3, 7.8);
    controlsRef.current.autoRotate = true;
  };

  const currentScreenshot = screenshots[activeIdx];
  const displayTitle = currentScreenshot?.title || `Screenshot ${activeIdx + 1}`;

  return (
    <div className="relative w-full flex flex-col items-center animate-in fade-in duration-300">
      {/* 3D WebGL Canvas Viewport */}
      <div
        ref={containerRef}
        className="relative w-full h-[360px] xs:h-[420px] sm:h-[480px] md:h-[520px] rounded-2xl sm:rounded-3xl overflow-hidden bg-gradient-to-b from-zinc-950 via-zinc-900/60 to-zinc-950 border border-zinc-800/90 shadow-2xl flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
      >
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Floating Top Badge */}
        <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-20 flex items-center gap-2 pointer-events-none">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950/80 backdrop-blur-md border border-purple-800/50 text-purple-300 text-xs font-bold shadow-lg">
            <Smartphone className="w-3.5 h-3.5 text-purple-400" />
            <span>3D Interactive Device</span>
          </div>
          <span className="hidden sm:inline-block px-2.5 py-1 rounded-full bg-zinc-900/80 backdrop-blur-md border border-zinc-800 text-[11px] font-semibold text-zinc-400">
            WebGL 60FPS
          </span>
        </div>

        {/* Floating Controls Overlay */}
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetCamera}
            className="p-2 sm:p-2.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white backdrop-blur-md border border-zinc-700/60 transition-all shadow-md cursor-pointer hover:scale-105 active:scale-95"
            title="Reset 3D Camera"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onOpenLightbox(activeIdx)}
            className="p-2 sm:p-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white backdrop-blur-md transition-all shadow-lg shadow-purple-600/30 cursor-pointer hover:scale-105 active:scale-95 flex items-center gap-1.5 text-xs font-bold"
            title="Inspect Fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
            <span className="hidden sm:inline">Fullscreen</span>
          </button>
        </div>

        {/* Interaction Hint (Fades once user drags) */}
        {!hasInteracted && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-zinc-300 text-xs animate-pulse">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Drag with finger or mouse to rotate in 3D</span>
          </div>
        )}
      </div>

      {/* Synchronized Bottom Screenshot Selector */}
      <div className="w-full mt-4 flex flex-col items-center gap-2">
        <div className="w-full flex items-center justify-between px-1">
          <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
            <span>Projected on Device:</span>
            <span className="text-purple-400">{displayTitle}</span>
          </span>
          <span className="text-[11px] text-zinc-500">
            {activeIdx + 1} of {screenshots.length}
          </span>
        </div>

        {/* Thumbnails row */}
        <div className="w-full flex items-center gap-2.5 overflow-x-auto pb-2 pt-1 hide-scrollbar no-scrollbar [scrollbar-width:none]">
          {screenshots.map((s, idx) => {
            const isSelected = idx === activeIdx;
            return (
              <button
                key={s.id || idx}
                type="button"
                onClick={() => onSelectScreenshot(idx)}
                className={`relative shrink-0 w-12 h-18 xs:w-14 xs:h-20 sm:w-16 sm:h-24 rounded-xl overflow-hidden border-2 transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'border-purple-500 scale-105 shadow-lg shadow-purple-600/40 ring-2 ring-purple-500/30'
                    : 'border-zinc-800 opacity-60 hover:opacity-100 hover:border-zinc-700'
                }`}
                title={s.title || `Screenshot ${idx + 1}`}
              >
                <img
                  src={s.imageUrl || s.url}
                  alt={s.title || `Thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                {isSelected && (
                  <div className="absolute inset-0 bg-purple-600/10 pointer-events-none" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
