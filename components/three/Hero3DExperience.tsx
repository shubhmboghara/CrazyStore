'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import * as THREE from 'three';
import {
  isWebGLAvailable,
  disposeThreeScene,
  drawAndroidScreenCanvas,
  createRoundedRectGeometry,
} from '@/lib/threeUtils';
import { AndroidApp } from '@/lib/appsData';
import { normalizeAppRecord } from '@/lib/appUtils';
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  Smartphone,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

export interface ShowcaseScreenshot {
  id: string;
  url: string;
  imageUrl?: string;
  title: string;
  subtitle?: string;
  type?: string;
}

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
  screenshots: ShowcaseScreenshot[];
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

const VIDEOHUB_FALLBACK_SCREENSHOTS: ShowcaseScreenshot[] = [
  {
    id: '1',
    title: 'Trending Feed & Discovery',
    subtitle: 'Fluid 120Hz Jetpack Compose LazyColumn with real-time video previews',
    url: 'https://ik.imagekit.io/shubhambogharadev/android-apps/Screenshot_20260925-133227.VideoHub_qzdtxn6-x.png',
    imageUrl: '/screenshots/videohub-feed.png',
    type: 'feed',
  },
  {
    id: '2',
    title: 'Immersive 4K ExoPlayer',
    subtitle: 'Hardware-accelerated 4K 60fps playback with live SponsorBlock skip markers',
    url: 'https://ik.imagekit.io/shubhambogharadev/android-apps/Screenshot_20260925-133306.VideoHub_dgH1K76Qy.png',
    imageUrl: '/screenshots/videohub-player.png',
    type: 'player',
  },
  {
    id: '3',
    title: 'Background Audio & Lockscreen',
    subtitle: 'AMOLED lockscreen controller, 320kbps Opus Hi-Fi audio & visualizer',
    url: 'https://ik.imagekit.io/shubhambogharadev/android-apps/Screenshot_20260925-133323.VideoHub_LEK80RUfT.png',
    imageUrl: '/screenshots/videohub-audio.png',
    type: 'stats',
  },
  {
    id: '4',
    title: 'Material You & Settings',
    subtitle: 'Android 15 Dynamic Color palettes & granular SponsorBlock filters',
    url: 'https://ik.imagekit.io/shubhambogharadev/android-apps/Screenshot_20260925-134542.VideoHub_i3VA3Z_90.png',
    imageUrl: '/screenshots/videohub-settings.png',
    type: 'settings',
  },
];

export function toShowcaseApp(app: any, index: number = 0): ShowcaseApp {
  const palette = SHOWCASE_PALETTES[index % SHOWCASE_PALETTES.length];

  const screenshots: ShowcaseScreenshot[] = [];
  if (Array.isArray(app.screenshots) && app.screenshots.length > 0) {
    app.screenshots.forEach((s: any, sIdx: number) => {
      const rawUrl = typeof s === 'string' ? s : (s?.imageUrl || s?.url || '');
      if (rawUrl && typeof rawUrl === 'string' && rawUrl.trim()) {
        screenshots.push({
          id: s?.id || `screenshot-${sIdx + 1}`,
          url: rawUrl.trim(),
          imageUrl: typeof s === 'object' && s?.imageUrl ? s.imageUrl.trim() : rawUrl.trim(),
          title: s?.title || `Screen ${sIdx + 1}`,
          subtitle: s?.subtitle || '',
          type: s?.type || '',
        });
      }
    });
  }

  // If app is videohub and has no screenshots, supply the 4 authentic screenshots
  if (app.slug === 'videohub' && screenshots.length === 0) {
    screenshots.push(...VIDEOHUB_FALLBACK_SCREENSHOTS);
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
    screenshots,
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
    screenshots: VIDEOHUB_FALLBACK_SCREENSHOTS,
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
  cycleIntervalMs = 4000, // 4s optimal per-screenshot showcase duration
}: Hero3DExperienceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [hasWebGL, setHasWebGL] = useState<boolean>(true);
  const [activeAppIdx, setActiveAppIdx] = useState<number>(0);
  const [activeScreenshotIdx, setActiveScreenshotIdx] = useState<number>(0);
  const [isAutoPlay, setIsAutoPlay] = useState<boolean>(true);
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

  const currentApp = showcaseApps[activeAppIdx] || showcaseApps[0] || DEFAULT_FALLBACK_APPS[0];
  const totalScreenshots = currentApp?.screenshots?.length || 0;
  const currentScreenshot = totalScreenshots > 0 ? currentApp.screenshots[activeScreenshotIdx] : null;

  // Keep indices in valid bounds if apps list changes
  useEffect(() => {
    if (activeAppIdx >= showcaseApps.length && showcaseApps.length > 0) {
      setActiveAppIdx(0);
      setActiveScreenshotIdx(0);
    }
  }, [showcaseApps.length, activeAppIdx]);

  useEffect(() => {
    if (activeScreenshotIdx >= totalScreenshots && totalScreenshots > 0) {
      setActiveScreenshotIdx(0);
    }
  }, [totalScreenshots, activeScreenshotIdx]);

  // Three.js References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const phoneGroupRef = useRef<THREE.Group | null>(null);
  const screenTextureRef = useRef<THREE.CanvasTexture | null>(null);
  const screenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const holoRingsGroupRef = useRef<THREE.Group | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const neonLightRef = useRef<THREE.PointLight | null>(null);
  const cyanLightRef = useRef<THREE.PointLight | null>(null);

  // Mesh & Material references for direct texture swaps
  const textureLoaderRef = useRef<THREE.TextureLoader | null>(null);
  const textureCacheRef = useRef<Map<string, THREE.Texture>>(new Map());
  const screenMatRef = useRef<THREE.MeshBasicMaterial | null>(null);
  const screenMeshRef = useRef<THREE.Mesh | null>(null);

  // Mouse & Gesture interaction state
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const isDraggingRef = useRef(false);
  const pointerDownPos = useRef({ x: 0, y: 0, time: 0 });
  const previousPointerPosition = useRef({ x: 0, y: 0 });
  const rotationVelocityRef = useRef({ x: 0, y: 0 });
  const prevActiveScreenshotRef = useRef<number>(0);

  // Physical dimension constants for phone model
  const phoneWidth = 2.45;
  const phoneHeight = 4.95;
  const phoneDepth = 0.22;
  const screenW = phoneWidth - 0.12; // 2.33
  const screenH = phoneHeight - 0.14; // 4.81

  // Dynamic aspect ratio contain fitting so screenshots are never distorted
  const adjustMeshAspect = useCallback((mesh: THREE.Mesh | null, texture: THREE.Texture, maxW: number, maxH: number) => {
    if (!mesh || !texture.image) return;
    const img = texture.image as any;
    const imgW = typeof img.naturalWidth === 'number' && img.naturalWidth > 0 ? img.naturalWidth : (img.width || 0);
    const imgH = typeof img.naturalHeight === 'number' && img.naturalHeight > 0 ? img.naturalHeight : (img.height || 0);
    if (imgW <= 0 || imgH <= 0) return;

    const imgAspect = imgW / imgH;
    const maxAspect = maxW / maxH;

    if (imgAspect > maxAspect) {
      const fitH = maxW / imgAspect;
      mesh.scale.set(1, fitH / maxH, 1);
    } else {
      const fitW = maxH * imgAspect;
      mesh.scale.set(fitW / maxW, 1, 1);
    }
  }, []);

  // Texture loader helper with multi-tier candidate resolution
  const loadScreenshotTexture = useCallback(
    (appSlug: string, screenshot: ShowcaseScreenshot, sIdx: number, callback?: (tex: THREE.Texture) => void) => {
      if (!textureLoaderRef.current) return;

      const candidates: string[] = [];
      if (screenshot.imageUrl) candidates.push(screenshot.imageUrl);
      if (screenshot.url && screenshot.url !== screenshot.imageUrl) candidates.push(screenshot.url);

      if (appSlug.toLowerCase() === 'videohub') {
        const localPngs = [
          '/screenshots/videohub-feed.png',
          '/screenshots/videohub-player.png',
          '/screenshots/videohub-audio.png',
          '/screenshots/videohub-settings.png',
        ];
        const ikUrls = [
          'https://ik.imagekit.io/shubhambogharadev/android-apps/Screenshot_20260925-133227.VideoHub_qzdtxn6-x.png',
          'https://ik.imagekit.io/shubhambogharadev/android-apps/Screenshot_20260925-133306.VideoHub_dgH1K76Qy.png',
          'https://ik.imagekit.io/shubhambogharadev/android-apps/Screenshot_20260925-133323.VideoHub_LEK80RUfT.png',
          'https://ik.imagekit.io/shubhambogharadev/android-apps/Screenshot_20260925-134542.VideoHub_i3VA3Z_90.png',
        ];
        candidates.push(localPngs[sIdx % localPngs.length]);
        candidates.push(ikUrls[sIdx % ikUrls.length]);
      }

      const uniqueCandidates = Array.from(new Set(candidates.filter(Boolean)));
      if (uniqueCandidates.length === 0) return;

      const cacheKey = `${appSlug}-${sIdx}-${uniqueCandidates[0]}`;
      const cached = textureCacheRef.current.get(cacheKey);
      if (cached) {
        callback?.(cached);
        return;
      }

      const tryLoad = (idx: number) => {
        if (idx >= uniqueCandidates.length || !textureLoaderRef.current) return;
        const urlToTry = uniqueCandidates[idx];

        textureLoaderRef.current.load(
          urlToTry,
          (texture) => {
            texture.colorSpace = THREE.SRGBColorSpace;
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter;
            texture.generateMipmaps = false;
            texture.needsUpdate = true;
            textureCacheRef.current.set(cacheKey, texture);
            callback?.(texture);
          },
          undefined,
          () => {
            tryLoad(idx + 1);
          }
        );
      };

      tryLoad(0);
    },
    []
  );

  // Apply texture to screen mesh
  const applyTextureToScreen = useCallback(
    (texture: THREE.Texture) => {
      if (!screenMatRef.current) return;
      screenMatRef.current.map = texture;
      screenMatRef.current.color.set(0xffffff);
      screenMatRef.current.needsUpdate = true;
      adjustMeshAspect(screenMeshRef.current, texture, screenW, screenH);
    },
    [adjustMeshAspect, screenW, screenH]
  );

  // Preload all screenshots for the active app into texture cache
  useEffect(() => {
    if (!textureLoaderRef.current || !currentApp?.screenshots) return;
    currentApp.screenshots.forEach((s, idx) => {
      loadScreenshotTexture(currentApp.slug, s, idx);
    });
  }, [currentApp, loadScreenshotTexture]);

  // Update screen texture whenever active app or active screenshot changes
  useEffect(() => {
    if (!currentApp) return;

    if (totalScreenshots > 0 && currentScreenshot) {
      loadScreenshotTexture(currentApp.slug, currentScreenshot, activeScreenshotIdx, (tex) => {
        applyTextureToScreen(tex);
      });
    } else {
      // Fallback: draw Android Screen Canvas if app has 0 screenshots
      if (screenCanvasRef.current && screenTextureRef.current && screenMatRef.current) {
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
        screenMatRef.current.map = screenTextureRef.current;
        screenMatRef.current.color.set(0xffffff);
        screenMatRef.current.needsUpdate = true;
      }
    }

    // Dynamic light color update to match current app's branding
    if (neonLightRef.current && cyanLightRef.current) {
      neonLightRef.current.color.set(currentApp.color1);
      cyanLightRef.current.color.set(currentApp.color2);
    }
  }, [
    currentApp,
    activeScreenshotIdx,
    totalScreenshots,
    currentScreenshot,
    loadScreenshotTexture,
    applyTextureToScreen,
  ]);

  // Subtle 3D rotational turn impulse when active screenshot advances
  useEffect(() => {
    if (prevActiveScreenshotRef.current !== activeScreenshotIdx && phoneGroupRef.current) {
      const isForward =
        (activeScreenshotIdx > prevActiveScreenshotRef.current &&
          !(prevActiveScreenshotRef.current === 0 && activeScreenshotIdx === totalScreenshots - 1)) ||
        (prevActiveScreenshotRef.current === totalScreenshots - 1 && activeScreenshotIdx === 0);
      phoneGroupRef.current.rotation.y += isForward ? -0.16 : 0.16;
      prevActiveScreenshotRef.current = activeScreenshotIdx;
    }
  }, [activeScreenshotIdx, totalScreenshots]);

  // Auto-cycle through screenshots and apps sequentially
  useEffect(() => {
    if (!isAutoPlay) return;

    const interval = setInterval(() => {
      // Pause advancing if user is actively dragging the 3D model
      if (isDraggingRef.current) return;

      if (totalScreenshots > 1) {
        setActiveScreenshotIdx((prevS) => {
          const nextS = prevS + 1;
          if (nextS < totalScreenshots) {
            return nextS;
          }
          // Completed all screenshots for this app! If multiple apps exist, transition to next app
          if (showcaseApps.length > 1) {
            setActiveAppIdx((prevA) => (prevA + 1) % showcaseApps.length);
          }
          return 0;
        });
      } else if (showcaseApps.length > 1) {
        setActiveAppIdx((prevA) => (prevA + 1) % showcaseApps.length);
        setActiveScreenshotIdx(0);
      }
    }, cycleIntervalMs);

    return () => clearInterval(interval);
  }, [isAutoPlay, totalScreenshots, showcaseApps.length, cycleIntervalMs]);

  // Manual navigation helpers
  const handlePrevScreenshot = useCallback(() => {
    if (totalScreenshots <= 1) return;
    setActiveScreenshotIdx((prev) => (prev - 1 + totalScreenshots) % totalScreenshots);
  }, [totalScreenshots]);

  const handleNextScreenshot = useCallback(() => {
    if (totalScreenshots <= 1) return;
    setActiveScreenshotIdx((prev) => (prev + 1) % totalScreenshots);
  }, [totalScreenshots]);

  const handleResetRotation = useCallback(() => {
    if (phoneGroupRef.current) {
      phoneGroupRef.current.rotation.set(0.15, -0.32, 0);
      rotationVelocityRef.current = { x: 0, y: 0 };
    }
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
    const initialZ = width < 480 ? 9.8 : width < 768 ? 9.0 : 8.5;
    camera.position.set(0, 0, initialZ);

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
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2.0);
    dirLight.position.set(5, 8, 6);
    scene.add(dirLight);

    const backLight = new THREE.DirectionalLight(0x8b5cf6, 2.5);
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

    // Texture Loader
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    textureLoaderRef.current = loader;

    // ==========================================
    // 3D Flagship Phone Model Construction
    // ==========================================
    const phoneGroup = new THREE.Group();
    phoneGroupRef.current = phoneGroup;

    // 1. Phone Frame (Dark Titanium Curved Edge)
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

    // 3. Fallback Offscreen Canvas Texture
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

    // 4. OLED Screen Mesh with Rounded Geometry
    const screenGeometry = createRoundedRectGeometry(screenW, screenH, 0.16);
    const screenMaterial = new THREE.MeshBasicMaterial({
      map: screenTexture,
      color: 0xffffff,
      toneMapped: true,
    });
    screenMatRef.current = screenMaterial;

    const screenMesh = new THREE.Mesh(screenGeometry, screenMaterial);
    screenMesh.position.z = phoneDepth / 2 + 0.005;
    screenMeshRef.current = screenMesh;
    phoneGroup.add(screenMesh);

    // 5. Glass Reflection Front Overlay
    const glassGeometry = createRoundedRectGeometry(screenW + 0.04, screenH + 0.04, 0.18);
    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.1,
      roughness: 0.05,
      metalness: 0.1,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
    });
    const glassMesh = new THREE.Mesh(glassGeometry, glassMaterial);
    glassMesh.position.z = phoneDepth / 2 + 0.01;
    phoneGroup.add(glassMesh);

    // 6. Camera Punch-Hole & Top Sensor at Front
    const punchHoleGeo = new THREE.CircleGeometry(0.045, 24);
    const punchHoleMat = new THREE.MeshBasicMaterial({ color: 0x050508 });
    const punchHoleMesh = new THREE.Mesh(punchHoleGeo, punchHoleMat);
    punchHoleMesh.position.set(0, phoneHeight / 2 - 0.22, phoneDepth / 2 + 0.012);
    phoneGroup.add(punchHoleMesh);

    // Lens inner reflection dot
    const lensDotGeo = new THREE.CircleGeometry(0.018, 16);
    const lensDotMat = new THREE.MeshBasicMaterial({ color: 0x1e3a8a });
    const lensDotMesh = new THREE.Mesh(lensDotGeo, lensDotMat);
    lensDotMesh.position.set(0, phoneHeight / 2 - 0.22, phoneDepth / 2 + 0.013);
    phoneGroup.add(lensDotMesh);

    // Speaker slit
    const speakerGeo = createRoundedRectGeometry(0.38, 0.022, 0.01);
    const speakerMat = new THREE.MeshBasicMaterial({ color: 0x27272a });
    const speakerMesh = new THREE.Mesh(speakerGeo, speakerMat);
    speakerMesh.position.set(0, phoneHeight / 2 - 0.08, phoneDepth / 2 + 0.012);
    phoneGroup.add(speakerMesh);

    // 7. Triple Camera Island on Back
    const camIslandGeom = new THREE.BoxGeometry(0.85, 1.35, 0.08);
    const camIslandMat = new THREE.MeshStandardMaterial({
      color: 0x09090b,
      metalness: 0.8,
      roughness: 0.3,
    });
    const camIsland = new THREE.Mesh(camIslandGeom, camIslandMat);
    camIsland.position.set(-phoneWidth / 4, phoneHeight / 4, -(phoneDepth / 2 + 0.04));
    phoneGroup.add(camIsland);

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
      lens.position.set(-phoneWidth / 4, phoneHeight / 4 + 0.42 - i * 0.42, -(phoneDepth / 2 + 0.085));
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

    // Immediately load first screenshot
    const firstScreenshot = initialApp.screenshots?.[0];
    if (firstScreenshot) {
      loadScreenshotTexture(initialApp.slug, firstScreenshot, 0, (tex) => {
        screenMaterial.map = tex;
        screenMaterial.color.set(0xffffff);
        screenMaterial.needsUpdate = true;
        adjustMeshAspect(screenMesh, tex, screenW, screenH);
      });
    }

    // ==========================================
    // Holographic Cyber Rings
    // ==========================================
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
      pointerDownPos.current = { x: e.clientX, y: e.clientY, time: Date.now() };
      previousPointerPosition.current = { x: e.clientX, y: e.clientY };
    };

    const handlePointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mouseRef.current.targetX = x * 0.45;
      mouseRef.current.targetY = y * 0.35;

      if (isDraggingRef.current && phoneGroupRef.current) {
        const deltaX = e.clientX - previousPointerPosition.current.x;
        const deltaY = e.clientY - previousPointerPosition.current.y;

        if (e.pointerType === 'touch' && Math.abs(deltaY) > Math.abs(deltaX) * 1.3) {
          isDraggingRef.current = false;
          return;
        }

        rotationVelocityRef.current = {
          x: deltaY * 0.005,
          y: deltaX * 0.005,
        };

        phoneGroupRef.current.rotation.y += deltaX * 0.008;
        phoneGroupRef.current.rotation.x += deltaY * 0.008;

        previousPointerPosition.current = { x: e.clientX, y: e.clientY };
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      isDraggingRef.current = false;
      const dt = Date.now() - pointerDownPos.current.time;
      const dist = Math.hypot(e.clientX - pointerDownPos.current.x, e.clientY - pointerDownPos.current.y);

      // Fast horizontal swipe gesture detection
      if (dt < 400 && dist > 40 && Math.abs(e.clientX - pointerDownPos.current.x) > Math.abs(e.clientY - pointerDownPos.current.y)) {
        if (e.clientX < pointerDownPos.current.x) {
          handleNextScreenshot();
        } else {
          handlePrevScreenshot();
        }
      }
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
      camera.position.z = newWidth < 480 ? 9.8 : newWidth < 768 ? 9.0 : 8.5;
      camera.updateProjectionMatrix();
      rendererRef.current.setSize(newWidth, newHeight);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // ==========================================
    // Animation Loop
    // ==========================================
    let animationFrameId: number;
    const clock = new THREE.Clock();

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
          phoneGroupRef.current.rotation.y += 0.004;
          // Inertia damping
          phoneGroupRef.current.rotation.y += rotationVelocityRef.current.y;
          phoneGroupRef.current.rotation.x += rotationVelocityRef.current.x;
          rotationVelocityRef.current.x *= 0.92;
          rotationVelocityRef.current.y *= 0.92;

          // Parallax tilt applied softly
          phoneGroupRef.current.rotation.z = -mouseRef.current.x * 0.2;
        }
      }

      // Rotate holographic ring
      if (holoRingsGroupRef.current) {
        holoRingsGroupRef.current.rotation.y = elapsedTime * 0.15;
        holoRingsGroupRef.current.rotation.z = Math.sin(elapsedTime * 0.5) * 0.1;
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
  }, [
    showcaseApps,
    loadScreenshotTexture,
    adjustMeshAspect,
    handleNextScreenshot,
    handlePrevScreenshot,
    screenW,
    screenH,
  ]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[380px] xs:h-[420px] sm:h-[480px] md:h-[540px] lg:h-[600px] xl:h-[620px] flex items-center justify-center select-none overflow-hidden rounded-3xl group"
      style={{ touchAction: 'pan-y' }}
    >
      {/* Three.js Canvas */}
      {hasWebGL ? (
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-grab active:cursor-grabbing outline-none"
          title="Interactive 3D Android Device — Drag to rotate 360°"
        />
      ) : (
        <div className="flex flex-col items-center justify-center p-8 text-center bg-zinc-900/60 border border-purple-900/40 rounded-3xl">
          <Smartphone className="w-16 h-16 text-purple-400 mb-4 animate-bounce" />
          <h4 className="font-bold text-lg text-zinc-100">{currentApp.name}</h4>
          <p className="text-xs text-zinc-400 max-w-xs mt-2">{currentApp.tagline}</p>
        </div>
      )}

      {/* Floating Top Header Bar */}
      <div className="absolute top-3 inset-x-3 sm:inset-x-4 flex items-center justify-between z-20 pointer-events-none">
        <Link
          href={`/apps/${currentApp.slug}`}
          className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-950/80 hover:bg-zinc-900 backdrop-blur-md border border-purple-900/50 shadow-xl transition-all duration-200 group/link"
          title={`View ${currentApp.name} Details`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span className="font-bold text-xs text-zinc-100 group-hover/link:text-purple-300 transition-colors">
            {currentApp.name}
          </span>
          <span className="text-zinc-600">•</span>
          <span className="text-[11px] text-purple-300 font-medium hidden xs:inline">{currentApp.badge}</span>
          <ExternalLink className="w-3 h-3 text-zinc-400 group-hover/link:text-purple-300 transition-colors shrink-0" />
        </Link>

        {/* Play/Pause & Reset 3D Controls */}
        <div className="pointer-events-auto flex items-center gap-1 bg-zinc-950/80 backdrop-blur-md border border-zinc-800 rounded-full p-1 shadow-lg">
          <button
            type="button"
            onClick={() => setIsAutoPlay((prev) => !prev)}
            className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
            title={isAutoPlay ? 'Pause screenshot rotation' : 'Play screenshot rotation'}
            aria-label={isAutoPlay ? 'Pause screenshot rotation' : 'Play screenshot rotation'}
          >
            {isAutoPlay ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={handleResetRotation}
            className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Reset 3D angle"
            aria-label="Reset 3D angle"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Multi-App Switcher Tabs (if 2 or more apps exist in the directory) */}
      {showcaseApps.length > 1 && (
        <div className="absolute top-14 inset-x-3 sm:inset-x-4 flex items-center justify-center z-20 pointer-events-none">
          <div className="pointer-events-auto inline-flex items-center gap-1 p-1 rounded-full bg-zinc-950/85 backdrop-blur-md border border-zinc-800 shadow-xl max-w-full overflow-x-auto">
            {showcaseApps.map((a, aIdx) => (
              <button
                key={a.slug}
                type="button"
                onClick={() => {
                  setActiveAppIdx(aIdx);
                  setActiveScreenshotIdx(0);
                }}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap ${
                  activeAppIdx === aIdx
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/40 ring-1 ring-purple-400/50'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                }`}
              >
                {a.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Left / Right Arrow Buttons to Browse Screenshots */}
      {totalScreenshots > 1 && (
        <>
          <button
            type="button"
            onClick={handlePrevScreenshot}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 pointer-events-auto w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-zinc-950/80 hover:bg-purple-600 backdrop-blur-md border border-zinc-800 hover:border-purple-500 flex items-center justify-center text-zinc-300 hover:text-white shadow-xl transition-all duration-200 opacity-75 hover:opacity-100 hover:scale-105 active:scale-95 cursor-pointer"
            title="Previous screenshot"
            aria-label="Previous screenshot"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={handleNextScreenshot}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 pointer-events-auto w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-zinc-950/80 hover:bg-purple-600 backdrop-blur-md border border-zinc-800 hover:border-purple-500 flex items-center justify-center text-zinc-300 hover:text-white shadow-xl transition-all duration-200 opacity-75 hover:opacity-100 hover:scale-105 active:scale-95 cursor-pointer"
            title="Next screenshot"
            aria-label="Next screenshot"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Bottom HUD: Screenshot Title & Interactive Step Dots */}
      <div className="absolute bottom-3 inset-x-3 sm:inset-x-4 z-20 pointer-events-none flex flex-col items-center gap-2">
        {/* Active Screenshot Title & Subtitle Badge */}
        {currentScreenshot && (
          <div className="pointer-events-auto max-w-[94%] sm:max-w-md w-full px-3.5 py-2 rounded-2xl bg-zinc-950/90 backdrop-blur-md border border-purple-900/40 shadow-2xl text-center">
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-zinc-100">
              <span className="px-1.5 py-0.5 rounded bg-purple-900/60 text-purple-300 text-[10px] font-mono border border-purple-700/50">
                {activeScreenshotIdx + 1}/{totalScreenshots}
              </span>
              <span className="truncate">{currentScreenshot.title || `Screenshot ${activeScreenshotIdx + 1}`}</span>
            </div>
            {currentScreenshot.subtitle && (
              <p className="text-[11px] text-zinc-400 truncate mt-0.5 font-normal">
                {currentScreenshot.subtitle}
              </p>
            )}
          </div>
        )}

        {/* Screenshot Step Navigation Dots */}
        {totalScreenshots > 1 && (
          <div className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-950/80 backdrop-blur-md border border-zinc-800 shadow-lg">
            {currentApp.screenshots.map((s, idx) => (
              <button
                key={s.id || idx}
                type="button"
                onClick={() => {
                  setActiveScreenshotIdx(idx);
                }}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  activeScreenshotIdx === idx
                    ? 'w-7 h-2 bg-gradient-to-r from-purple-500 via-indigo-400 to-cyan-400 shadow-md shadow-purple-500/50'
                    : 'w-2 h-2 bg-zinc-700 hover:bg-zinc-500'
                }`}
                title={s.title || `Go to screenshot ${idx + 1}`}
                aria-label={s.title || `Go to screenshot ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
