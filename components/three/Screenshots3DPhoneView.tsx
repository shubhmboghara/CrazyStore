'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { isWebGLAvailable, disposeThreeScene } from '@/lib/threeUtils';
import { AndroidApp } from '@/lib/appsData';
import { Maximize2, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';

interface Screenshots3DPhoneViewProps {
  app: AndroidApp;
  screenshots: Array<{ id: string; url: string; imageUrl?: string; title: string; subtitle?: string }>;
  activeIdx: number;
  onSelectScreenshot: (idx: number) => void;
  onOpenLightbox: (idx: number) => void;
}

/**
 * Creates a 2D rounded rectangle Shape in Three.js
 */
function createRoundedRectShape(w: number, h: number, r: number): THREE.Shape {
  const shape = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  const radius = Math.min(r, w / 2, h / 2);

  shape.moveTo(x + radius, y);
  shape.lineTo(x + w - radius, y);
  shape.absarc(x + w - radius, y + radius, radius, -Math.PI / 2, 0, false);
  shape.lineTo(x + w, y + h - radius);
  shape.absarc(x + w - radius, y + h - radius, radius, 0, Math.PI / 2, false);
  shape.lineTo(x + radius, y + h);
  shape.absarc(x + radius, y + h - radius, radius, Math.PI / 2, Math.PI, false);
  shape.lineTo(x, y + radius);
  shape.absarc(x + radius, y + radius, radius, Math.PI, Math.PI * 1.5, false);

  return shape;
}

/**
 * Generates a BufferGeometry for a rounded rectangle with normalized UVs (0..1)
 */
function createRoundedRectGeometry(w: number, h: number, r: number, segments = 16): THREE.BufferGeometry {
  const shape = createRoundedRectShape(w, h, r);
  const geo = new THREE.ShapeGeometry(shape, segments);
  const pos = geo.attributes.position;
  const uvs = new Float32Array(pos.count * 2);

  for (let i = 0; i < pos.count; i++) {
    const px = pos.getX(i);
    const py = pos.getY(i);
    uvs[i * 2] = (px + w / 2) / w;
    uvs[i * 2 + 1] = (py + h / 2) / h;
  }

  geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geo.computeVertexNormals();
  return geo;
}

// Helper to determine if an intersected 3D mesh is a child of a specific group
function isChildOf(obj: THREE.Object3D | null, parent: THREE.Object3D | null): boolean {
  if (!obj || !parent) return false;
  let curr: THREE.Object3D | null = obj;
  while (curr) {
    if (curr === parent) return true;
    curr = curr.parent;
  }
  return false;
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

  // Keep a ref to activeIdx for asynchronous Three.js and event callbacks
  const activeIdxRef = useRef<number>(activeIdx);
  useEffect(() => {
    activeIdxRef.current = activeIdx;
  }, [activeIdx]);

  // Scroll-driven 3D Zoom-Out Physics (0.0 = Close, 1.0 = Zoomed out in 3D perspective)
  const targetScrollZoom = useRef<number>(0.0);
  const currentScrollZoom = useRef<number>(0.0);
  const cardBounceRef = useRef<number>(0.0);
  const cardFlipAngle = useRef<number>(0);
  const prevActiveIdx = useRef<number>(activeIdx);
  const isUserRotating = useRef<boolean>(false);
  const hasUserManuallySelected = useRef<boolean>(false);

  // Pointer & Touch gesture tracking for drag vs tap disambiguation and swipe detection
  const pointerDownPos = useRef<{ x: number; y: number; time: number }>({ x: 0, y: 0, time: 0 });
  const touchStartPos = useRef<{ x: number; y: number; time: number } | null>(null);
  const touchEndPos = useRef<{ x: number; y: number } | null>(null);
  const lastWheelTime = useRef<number>(0);
  const lastScrollY = useRef<number>(0);
  const manualResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-reset manual selection after 2.8s of idle so page scroll naturally resumes cycling
  const resetManualLockWithTimeout = useCallback(() => {
    if (manualResetTimerRef.current) {
      clearTimeout(manualResetTimerRef.current);
    }
    manualResetTimerRef.current = setTimeout(() => {
      hasUserManuallySelected.current = false;
    }, 2800);
  }, []);

  // Three.js references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  const cardGroupRef = useRef<THREE.Group | null>(null);
  const leftCardGroupRef = useRef<THREE.Group | null>(null);
  const rightCardGroupRef = useRef<THREE.Group | null>(null);

  // Direct THREE.Texture references — no canvas intermediary
  const textureLoaderRef = useRef<THREE.TextureLoader | null>(null);
  const centerTextureRef = useRef<THREE.Texture | null>(null);
  const leftCompTexRef = useRef<THREE.Texture | null>(null);
  const rightCompTexRef = useRef<THREE.Texture | null>(null);

  // Screen Mesh references for dynamic aspect ratio fitting
  const screenMeshRef = useRef<THREE.Mesh | null>(null);
  const leftScreenMeshRef = useRef<THREE.Mesh | null>(null);
  const rightScreenMeshRef = useRef<THREE.Mesh | null>(null);

  // Mesh material references for runtime texture swapping
  const centerMatRef = useRef<THREE.MeshBasicMaterial | null>(null);
  const leftMatRef = useRef<THREE.MeshBasicMaterial | null>(null);
  const rightMatRef = useRef<THREE.MeshBasicMaterial | null>(null);

  const totalCount = screenshots.length;
  const prevIdx = (activeIdx - 1 + totalCount) % totalCount;
  const nextIdx = (activeIdx + 1) % totalCount;

  // Visual card flip turn impulse whenever active screenshot changes
  useEffect(() => {
    if (prevActiveIdx.current !== activeIdx) {
      const isForward =
        (activeIdx > prevActiveIdx.current && !(prevActiveIdx.current === 0 && activeIdx === totalCount - 1)) ||
        (prevActiveIdx.current === totalCount - 1 && activeIdx === 0);
      cardFlipAngle.current = isForward ? -0.22 : 0.22;
      cardBounceRef.current = 0.08;
      prevActiveIdx.current = activeIdx;
    }
  }, [activeIdx, totalCount]);

  // Adjust screen mesh scale dynamically to preserve native aspect ratio (contain fit)
  const adjustMeshAspect = useCallback((mesh: THREE.Mesh | null, texture: THREE.Texture, maxW: number, maxH: number) => {
    if (!mesh || !texture.image) return;
    const img = texture.image as any;
    const imgW = (typeof img.naturalWidth === 'number' && img.naturalWidth > 0) ? img.naturalWidth : (img.width || 0);
    const imgH = (typeof img.naturalHeight === 'number' && img.naturalHeight > 0) ? img.naturalHeight : (img.height || 0);
    if (imgW <= 0 || imgH <= 0) return;

    const imgAspect = imgW / imgH;
    const maxAspect = maxW / maxH;

    if (imgAspect > maxAspect) {
      // Wider than phone screen frame: fit width, scale height down
      const fitH = maxW / imgAspect;
      mesh.scale.set(1, fitH / maxH, 1);
    } else {
      // Taller or standard portrait: fit height, scale width to match ratio
      const fitW = maxH * imgAspect;
      mesh.scale.set(fitW / maxW, 1, 1);
    }
  }, []);

  // Helper to apply a loaded texture to a MeshBasicMaterial (self-luminous screen)
  const applyTextureToMat = useCallback(
    (
      mat: THREE.MeshBasicMaterial,
      texture: THREE.Texture,
      oldTexRef: React.MutableRefObject<THREE.Texture | null>,
      meshRef?: React.MutableRefObject<THREE.Mesh | null>,
      maxW = 2.26,
      maxH = 4.70
    ) => {
      // Dispose old texture to free GPU memory
      if (oldTexRef.current && oldTexRef.current !== texture) {
        oldTexRef.current.dispose();
      }
      oldTexRef.current = texture;

      mat.map = texture;
      mat.color.set(0xffffff);
      mat.needsUpdate = true;

      if (meshRef?.current) {
        adjustMeshAspect(meshRef.current, texture, maxW, maxH);
      }
    },
    [adjustMeshAspect]
  );

  // Load a URL via TextureLoader and call callback on success
  const loadTexture = useCallback(
    (url: string, callback: (t: THREE.Texture) => void) => {
      if (!textureLoaderRef.current || !url) return;
      textureLoaderRef.current.load(
        url,
        (texture) => {
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.minFilter = THREE.LinearFilter;
          texture.magFilter = THREE.LinearFilter;
          texture.generateMipmaps = false;
          texture.needsUpdate = true;
          callback(texture);
        },
        undefined,
        () => {
          /* error: keep placeholder dark material, no crash */
        }
      );
    },
    []
  );

  // Update center, left, and right textures whenever activeIdx changes
  useEffect(() => {
    if (!textureLoaderRef.current) return;

    // Center card
    const centerUrl = screenshots[activeIdx]?.imageUrl || screenshots[activeIdx]?.url || '';
    if (centerUrl && centerMatRef.current) {
      const mat = centerMatRef.current;
      loadTexture(centerUrl, (tex) => {
        applyTextureToMat(mat, tex, centerTextureRef, screenMeshRef, 2.26, 4.70);
      });
    }

    if (totalCount > 1) {
      // Left companion
      const leftUrl = screenshots[prevIdx]?.imageUrl || screenshots[prevIdx]?.url || '';
      if (leftUrl && leftMatRef.current) {
        const mat = leftMatRef.current;
        loadTexture(leftUrl, (tex) => {
          applyTextureToMat(mat, tex, leftCompTexRef, leftScreenMeshRef, 2.26 * 0.88, 4.70 * 0.88);
        });
      }

      // Right companion
      const rightUrl = screenshots[nextIdx]?.imageUrl || screenshots[nextIdx]?.url || '';
      if (rightUrl && rightMatRef.current) {
        const mat = rightMatRef.current;
        loadTexture(rightUrl, (tex) => {
          applyTextureToMat(mat, tex, rightCompTexRef, rightScreenMeshRef, 2.26 * 0.88, 4.70 * 0.88);
        });
      }
    }
  }, [activeIdx, screenshots, prevIdx, nextIdx, totalCount, loadTexture, applyTextureToMat]);

  // Main Three.js setup
  useEffect(() => {
    if (!isWebGLAvailable()) {
      setHasWebGL(false);
      return;
    }

    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 520;

    // 1. Scene & Fog
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x09090b, 0.02);
    sceneRef.current = scene;

    // 2. Camera — Calibrated safe distance so phone is 100% visible with generous margins
    const isMobile = width < 640;
    const initialZ = isMobile ? 9.2 : 8.2;
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0.0, initialZ);
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
    renderer.toneMappingExposure = 1.05;
    rendererRef.current = renderer;

    // 4. OrbitControls — Rotation enabled, manual zoom disabled to prevent image clipping
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.enableZoom = false; // Strictly driven by page scroll
    controls.minPolarAngle = Math.PI / 4;
    controls.maxPolarAngle = Math.PI * 0.72;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.55;
    controls.addEventListener('start', () => {
      isUserRotating.current = true;
    });
    controls.addEventListener('end', () => {
      isUserRotating.current = false;
    });
    controlsRef.current = controls;

    // 5. Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.6);
    keyLight.position.set(4, 5, 6);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x94a3b8, 0.8);
    fillLight.position.set(-4, 3, 4);
    scene.add(fillLight);

    const rimLight = new THREE.PointLight(0xa855f7, 1.8, 12);
    rimLight.position.set(-3, -2, 3);
    scene.add(rimLight);

    // 6. Texture Loader — shared instance
    const loader = new THREE.TextureLoader();
    textureLoaderRef.current = loader;

    // 7. Helper: Build Flagship Smartphone 3D Model
    const createPhoneDeviceGroup = (scale = 1.0) => {
      const group = new THREE.Group();
      group.scale.set(scale, scale, scale);

      const phoneW = 2.40;
      const phoneH = 4.88;
      const phoneD = 0.08;
      const phoneR = 0.22;

      // Outer Chassis: Titanium backplate with rounded corners
      const chassisMat = new THREE.MeshStandardMaterial({
        color: 0x181822,
        metalness: 0.82,
        roughness: 0.24,
      });
      const chassisGeo = createRoundedRectGeometry(phoneW, phoneH, phoneR);
      const backplate = new THREE.Mesh(chassisGeo, chassisMat);
      backplate.position.z = -phoneD / 2;
      group.add(backplate);

      // Chassis Perimeter Rim (Titanium Mid-Frame Band)
      const rimMat = new THREE.MeshStandardMaterial({
        color: 0x272733,
        metalness: 0.9,
        roughness: 0.18,
      });
      const rimGeo = createRoundedRectGeometry(phoneW + 0.03, phoneH + 0.03, phoneR + 0.015);
      const rimMesh = new THREE.Mesh(rimGeo, rimMat);
      rimMesh.position.z = -0.005;
      group.add(rimMesh);

      // Side Hardware Buttons: Sleek Power & Volume Accents
      const buttonMat = new THREE.MeshStandardMaterial({
        color: 0x3f3f4e,
        metalness: 0.95,
        roughness: 0.15,
      });
      // Power button (right)
      const powerBtn = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.45, 0.03), buttonMat);
      powerBtn.position.set(phoneW / 2 + 0.01, 0.4, 0);
      group.add(powerBtn);
      // Volume rocker (left)
      const volumeBtn = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.75, 0.03), buttonMat);
      volumeBtn.position.set(-phoneW / 2 - 0.01, 0.6, 0);
      group.add(volumeBtn);

      // OLED Screen Bezel: Deep OLED black rounded background
      const bezelW = 2.34;
      const bezelH = 4.82;
      const bezelR = 0.18;
      const bezelMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
      const bezelGeo = createRoundedRectGeometry(bezelW, bezelH, bezelR);
      const bezelMesh = new THREE.Mesh(bezelGeo, bezelMat);
      bezelMesh.position.z = phoneD / 2 - 0.002;
      group.add(bezelMesh);

      // Active Screen Display: Uncropped native aspect ratio screenshot mesh
      const screenW = 2.26;
      const screenH = 4.70;
      const screenR = 0.15;
      const screenGeo = createRoundedRectGeometry(screenW, screenH, screenR);
      const screenMat = new THREE.MeshBasicMaterial({
        color: 0x12121e, // dark placeholder while texture is loading
        toneMapped: true,
      });
      const screenMesh = new THREE.Mesh(screenGeo, screenMat);
      screenMesh.position.z = phoneD / 2 + 0.002;
      group.add(screenMesh);

      // Speaker Slit at Top
      const speakerMat = new THREE.MeshBasicMaterial({ color: 0x33333f });
      const speakerGeo = createRoundedRectGeometry(0.42, 0.025, 0.012);
      const speakerMesh = new THREE.Mesh(speakerGeo, speakerMat);
      speakerMesh.position.set(0, phoneH / 2 - 0.09, phoneD / 2 + 0.006);
      group.add(speakerMesh);

      // Punch-Hole Camera at Top Center
      const cameraMat = new THREE.MeshBasicMaterial({ color: 0x050508 });
      const cameraGeo = new THREE.CircleGeometry(0.042, 24);
      const cameraMesh = new THREE.Mesh(cameraGeo, cameraMat);
      cameraMesh.position.set(0, phoneH / 2 - 0.22, phoneD / 2 + 0.006);
      group.add(cameraMesh);

      // Camera Inner Lens Dot
      const lensMat = new THREE.MeshBasicMaterial({ color: 0x1e293b });
      const lensGeo = new THREE.CircleGeometry(0.018, 16);
      const lensMesh = new THREE.Mesh(lensGeo, lensMat);
      lensMesh.position.set(0, phoneH / 2 - 0.22, phoneD / 2 + 0.007);
      group.add(lensMesh);

      // Bottom Android Home Pill Indicator
      const homePillMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.45,
      });
      const homePillGeo = createRoundedRectGeometry(0.65, 0.022, 0.011);
      const homePillMesh = new THREE.Mesh(homePillGeo, homePillMat);
      homePillMesh.position.set(0, -phoneH / 2 + 0.14, phoneD / 2 + 0.006);
      group.add(homePillMesh);

      // Ultra-subtle Glass Glare Reflection Layer
      const glassMat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.05,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
      });
      const glassGeo = createRoundedRectGeometry(screenW, screenH, screenR);
      const glassMesh = new THREE.Mesh(glassGeo, glassMat);
      glassMesh.position.z = phoneD / 2 + 0.008;
      group.add(glassMesh);

      return { group, screenMesh, screenMat };
    };

    // Center Phone (Primary Focus)
    const centerPhone = createPhoneDeviceGroup(1.0);
    centerPhone.screenMesh.name = 'centerScreenMesh';
    screenMeshRef.current = centerPhone.screenMesh;
    centerMatRef.current = centerPhone.screenMat;
    cardGroupRef.current = centerPhone.group;
    scene.add(centerPhone.group);

    // 8. Flanking Companion Preview Phones (Desktop only to prevent mobile clutter)
    const showCompanionCards = width >= 640 && totalCount > 1;

    // Left Companion Phone
    const leftPhone = createPhoneDeviceGroup(0.86);
    leftPhone.screenMesh.name = 'leftCardMesh';
    leftPhone.screenMat.transparent = true;
    leftPhone.screenMat.opacity = 0.55;
    leftScreenMeshRef.current = leftPhone.screenMesh;
    leftMatRef.current = leftPhone.screenMat;
    leftCardGroupRef.current = leftPhone.group;

    leftPhone.group.position.set(-3.3, 0.0, -1.2);
    leftPhone.group.rotation.y = 0.28;
    leftPhone.group.visible = showCompanionCards;
    scene.add(leftPhone.group);

    // Right Companion Phone
    const rightPhone = createPhoneDeviceGroup(0.86);
    rightPhone.screenMesh.name = 'rightCardMesh';
    rightPhone.screenMat.transparent = true;
    rightPhone.screenMat.opacity = 0.55;
    rightScreenMeshRef.current = rightPhone.screenMesh;
    rightMatRef.current = rightPhone.screenMat;
    rightCardGroupRef.current = rightPhone.group;

    rightPhone.group.position.set(3.3, 0.0, -1.2);
    rightPhone.group.rotation.y = -0.28;
    rightPhone.group.visible = showCompanionCards;
    scene.add(rightPhone.group);

    // 9. Ambient Stardust Particles
    const stardustCount = 45;
    const stardustGeo = new THREE.BufferGeometry();
    const stardustPos = new Float32Array(stardustCount * 3);
    for (let i = 0; i < stardustCount; i++) {
      stardustPos[i * 3] = (Math.random() - 0.5) * 14;
      stardustPos[i * 3 + 1] = (Math.random() - 0.5) * 8;
      stardustPos[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    stardustGeo.setAttribute('position', new THREE.BufferAttribute(stardustPos, 3));
    const stardustMat = new THREE.PointsMaterial({
      size: 0.035,
      color: 0xa855f7,
      transparent: true,
      opacity: 0.35,
    });
    const stardust = new THREE.Points(stardustGeo, stardustMat);
    scene.add(stardust);

    // Initial texture loading
    const initialUrl = screenshots[activeIdx]?.imageUrl || screenshots[activeIdx]?.url || '';
    if (initialUrl) {
      loadTexture(initialUrl, (tex) => {
        applyTextureToMat(centerPhone.screenMat, tex, centerTextureRef, screenMeshRef, 2.26, 4.70);
      });
    }

    if (totalCount > 1) {
      const leftUrl = screenshots[prevIdx]?.imageUrl || screenshots[prevIdx]?.url || '';
      if (leftUrl) {
        loadTexture(leftUrl, (tex) => {
          applyTextureToMat(leftPhone.screenMat, tex, leftCompTexRef, leftScreenMeshRef, 2.26 * 0.86, 4.70 * 0.86);
        });
      }
      const rightUrl = screenshots[nextIdx]?.imageUrl || screenshots[nextIdx]?.url || '';
      if (rightUrl) {
        loadTexture(rightUrl, (tex) => {
          applyTextureToMat(rightPhone.screenMat, tex, rightCompTexRef, rightScreenMeshRef, 2.26 * 0.86, 4.70 * 0.86);
        });
      }
    }

    // 10. Scroll Listener for Smooth 3D Zoom-Out Effect & Automatic Progression
    const handleScroll = () => {
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const windowH = window.innerHeight || 800;

      // Reset manual selection lock if user has scrolled significantly (> 120px)
      const currentScrollY = window.scrollY;
      if (Math.abs(currentScrollY - lastScrollY.current) > 120) {
        hasUserManuallySelected.current = false;
        lastScrollY.current = currentScrollY;
      }

      // Progress: 0.0 when container enters viewport, 1.0 as it scrolls through center
      const progress = THREE.MathUtils.clamp(
        (windowH * 0.85 - rect.top) / (windowH * 0.75),
        0,
        1
      );
      targetScrollZoom.current = progress;

      // Automatically change screenshots as you scroll down if user hasn't manually clicked
      if (totalCount > 1 && !hasUserManuallySelected.current) {
        const stepIdx = Math.min(totalCount - 1, Math.floor(progress * totalCount));
        if (stepIdx !== activeIdxRef.current) {
          onSelectScreenshot(stepIdx);
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    // 11. Visibility and Resize Observers
    let isVisible = true;
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
      },
      { threshold: 0.05 }
    );
    observer.observe(container);

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (w > 0 && h > 0) {
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);

          const canShowCompanion = w >= 640 && totalCount > 1;
          if (leftPhone.group) leftPhone.group.visible = canShowCompanion;
          if (rightPhone.group) rightPhone.group.visible = canShowCompanion;
        }
      }
    });
    resizeObserver.observe(container);

    // 12. Animation Loop (Smooth Floating & Scroll Progression)
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);

      if (!isVisible) return;

      const elapsed = clock.getElapsedTime();

      // Smoothly interpolate scroll zoom progress
      currentScrollZoom.current = THREE.MathUtils.lerp(
        currentScrollZoom.current,
        targetScrollZoom.current,
        0.08
      );
      const p = currentScrollZoom.current;

      const isMobileNow = (container.clientWidth || 800) < 640;
      const minZ = isMobileNow ? 9.2 : 8.2;
      const maxZ = isMobileNow ? 10.8 : 9.8;

      // Camera distance: starts comfortably framed, zooms out smoothly as you scroll
      const targetCamZ = THREE.MathUtils.lerp(minZ, maxZ, p);
      const targetCamY = THREE.MathUtils.lerp(0.0, 0.20, p);

      if (!isUserRotating.current) {
        camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetCamZ, 0.08);
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetCamY, 0.08);
      }

      // Rich 3D Perspective Tilt: As it zooms out, card pitches back slightly in 3D
      const targetTiltX = THREE.MathUtils.lerp(0.0, -0.10, p);
      centerPhone.group.rotation.x = THREE.MathUtils.lerp(centerPhone.group.rotation.x, targetTiltX, 0.08);

      // Smooth decay of card flip turn angle on screenshot change
      if (Math.abs(cardFlipAngle.current) > 0.001) {
        cardFlipAngle.current = THREE.MathUtils.lerp(cardFlipAngle.current, 0, 0.1);
      }
      if (!isUserRotating.current) {
        centerPhone.group.rotation.y = cardFlipAngle.current;
      }

      // Tap bounce recovery
      if (cardBounceRef.current > 0.001) {
        cardBounceRef.current = THREE.MathUtils.lerp(cardBounceRef.current, 0, 0.1);
      }

      // Gentle floating levitation
      const levitation = Math.sin(elapsed * 1.3) * 0.04;
      centerPhone.group.position.y = levitation;
      centerPhone.group.position.z = -cardBounceRef.current;

      if (leftPhone.group) leftPhone.group.position.y = levitation;
      if (rightPhone.group) rightPhone.group.position.y = levitation;

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('scroll', handleScroll);
      if (manualResetTimerRef.current) {
        clearTimeout(manualResetTimerRef.current);
      }
      observer.disconnect();
      resizeObserver.disconnect();
      controls.dispose();
      disposeThreeScene(scene);
      renderer.dispose();
    };
  }, [totalCount, loadTexture, applyTextureToMat, onSelectScreenshot, resetManualLockWithTimeout]);

  // Pointer position tracker to distinguish between 3D orbit drag and click
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    pointerDownPos.current = {
      x: e.clientX,
      y: e.clientY,
      time: Date.now(),
    };
  };

  // Dynamic hover cursor: zoom-in over active screenshot, pointer over companion cards, grab for 3D rotation
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const canvas = canvasRef.current;
    const camera = cameraRef.current;
    const scene = sceneRef.current;
    const container = containerRef.current;
    if (!canvas || !camera || !scene || !container) return;

    if (isUserRotating.current) {
      container.style.cursor = 'grabbing';
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), camera);

    const intersects = raycaster.intersectObjects(scene.children, true);
    if (intersects.length > 0) {
      const hitObj = intersects[0].object;
      if (cardGroupRef.current && isChildOf(hitObj, cardGroupRef.current)) {
        container.style.cursor = 'zoom-in';
        return;
      }
      if (
        (leftCardGroupRef.current && isChildOf(hitObj, leftCardGroupRef.current)) ||
        (rightCardGroupRef.current && isChildOf(hitObj, rightCardGroupRef.current))
      ) {
        container.style.cursor = 'pointer';
        return;
      }
    }
    container.style.cursor = 'grab';
  };

  // Mouse Wheel / Trackpad scroll: cycling through screenshots over the canvas
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const absX = Math.abs(e.deltaX);
    const absY = Math.abs(e.deltaY);

    if (absX > 18 || absY > 18) {
      const now = Date.now();
      if (now - lastWheelTime.current > 320) {
        lastWheelTime.current = now;
        hasUserManuallySelected.current = true;
        resetManualLockWithTimeout();

        const delta = absX > absY ? e.deltaX : e.deltaY;
        if (delta > 0) {
          onSelectScreenshot(nextIdx);
        } else {
          onSelectScreenshot(prevIdx);
        }
      }
    }
  };

  // Mobile Touch Gestures: Horizontal swipe advances/rewinds screenshots
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1) {
      touchStartPos.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now(),
      };
      touchEndPos.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1) {
      touchEndPos.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    }
  };

  const handleTouchEnd = () => {
    if (!touchStartPos.current || !touchEndPos.current) return;
    const dx = touchEndPos.current.x - touchStartPos.current.x;
    const dy = touchEndPos.current.y - touchStartPos.current.y;
    const dt = Date.now() - touchStartPos.current.time;

    // Detect horizontal swipe on mobile
    if (Math.abs(dx) > 38 && Math.abs(dx) > Math.abs(dy) * 1.15 && dt < 650) {
      hasUserManuallySelected.current = true;
      resetManualLockWithTimeout();
      if (dx < 0) {
        onSelectScreenshot(nextIdx);
      } else {
        onSelectScreenshot(prevIdx);
      }
    }

    touchStartPos.current = null;
    touchEndPos.current = null;
  };

  // Canvas Click: Tapping the active screenshot card opens it in high-res Lightbox modal
  // Tapping left or right companion cards flips to that screenshot
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const canvas = canvasRef.current;
    const camera = cameraRef.current;
    const scene = sceneRef.current;
    if (!canvas || !camera || !scene) return;

    // Check if pointer dragged (e.g. 3D orbit rotation)
    const dx = Math.abs(e.clientX - pointerDownPos.current.x);
    const dy = Math.abs(e.clientY - pointerDownPos.current.y);
    if (dx > 8 || dy > 8) {
      // User was rotating the 3D scene, not clicking
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), camera);

    const intersects = raycaster.intersectObjects(scene.children, true);
    if (intersects.length > 0) {
      const hitObj = intersects[0].object;

      // 1. Click Left companion preview card -> change to previous screenshot
      if (leftCardGroupRef.current && isChildOf(hitObj, leftCardGroupRef.current)) {
        hasUserManuallySelected.current = true;
        resetManualLockWithTimeout();
        onSelectScreenshot(prevIdx);
        return;
      }

      // 2. Click Right companion preview card -> change to next screenshot
      if (rightCardGroupRef.current && isChildOf(hitObj, rightCardGroupRef.current)) {
        hasUserManuallySelected.current = true;
        resetManualLockWithTimeout();
        onSelectScreenshot(nextIdx);
        return;
      }

      // 3. Click Active Center 3D card -> OPEN the screenshot in full resolution (Lightbox modal)!
      if (cardGroupRef.current && isChildOf(hitObj, cardGroupRef.current)) {
        cardBounceRef.current = 0.08;
        onOpenLightbox(activeIdxRef.current);
        return;
      }
    }
  };

  const handleResetCamera = () => {
    if (!controlsRef.current || !cameraRef.current) return;
    controlsRef.current.reset();
    const isMobile = (containerRef.current?.clientWidth || 800) < 640;
    cameraRef.current.position.set(0, 0.0, isMobile ? 9.2 : 8.2);
    controlsRef.current.autoRotate = true;
    cardFlipAngle.current = 0;
  };

  const handlePrevScreenshot = () => {
    hasUserManuallySelected.current = true;
    resetManualLockWithTimeout();
    onSelectScreenshot(prevIdx);
  };

  const handleNextScreenshot = () => {
    hasUserManuallySelected.current = true;
    resetManualLockWithTimeout();
    onSelectScreenshot(nextIdx);
  };

  const currentScreenshot = screenshots[activeIdx];
  const displayTitle = currentScreenshot?.title || `Screenshot ${activeIdx + 1}`;

  if (!hasWebGL) {
    return (
      <div className="relative w-full flex flex-col items-center animate-in fade-in duration-300">
        <div className="relative w-full h-[500px] xs:h-[560px] sm:h-[620px] md:h-[660px] rounded-2xl sm:rounded-3xl overflow-hidden bg-gradient-to-b from-zinc-950 via-[#0c0c16] to-zinc-950 border border-zinc-800/80 shadow-2xl flex items-center justify-center p-4 sm:p-8">
          <img
            src={screenshots[activeIdx]?.imageUrl || screenshots[activeIdx]?.url}
            alt={displayTitle}
            className="max-h-full max-w-full object-contain rounded-2xl shadow-2xl cursor-pointer hover:scale-[1.02] transition-transform"
            onClick={() => onOpenLightbox(activeIdx)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full flex flex-col items-center animate-in fade-in duration-300">
      {/* 3D WebGL Canvas Viewport — Luxury flagship smartphone showcase */}
      <div
        ref={containerRef}
        tabIndex={0}
        role="region"
        aria-label="Interactive 3D Screenshot Showcase. Use Left and Right arrow keys to switch screenshots, Enter or Space to open fullscreen."
        onClick={handleCanvasClick}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
            e.preventDefault();
            handlePrevScreenshot();
          } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
            e.preventDefault();
            handleNextScreenshot();
          } else if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onOpenLightbox(activeIdx);
          } else if (e.key === 'r' || e.key === 'R') {
            e.preventDefault();
            handleResetCamera();
          }
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative w-full h-[500px] xs:h-[560px] sm:h-[620px] md:h-[660px] rounded-2xl sm:rounded-3xl overflow-hidden bg-gradient-to-b from-zinc-950 via-[#0c0c16] to-zinc-950 border border-zinc-800/80 shadow-2xl flex items-center justify-center select-none cursor-grab focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:outline-none"
      >
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Minimal Controls Overlay in Top Right */}
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleResetCamera();
            }}
            className="p-2 sm:p-2.5 rounded-xl bg-zinc-900/85 hover:bg-zinc-800 text-zinc-300 hover:text-white backdrop-blur-md border border-zinc-700/60 transition-all shadow-md cursor-pointer hover:scale-105 active:scale-95 focus-visible:ring-2 focus-visible:ring-purple-400"
            title="Reset 3D Perspective (R)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenLightbox(activeIdx);
            }}
            className="p-2 sm:px-3 sm:py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white backdrop-blur-md transition-all shadow-lg shadow-purple-600/30 cursor-pointer hover:scale-105 active:scale-95 flex items-center gap-1.5 text-xs font-bold focus-visible:ring-2 focus-visible:ring-purple-400"
            title="Inspect Fullscreen (Enter/Space)"
          >
            <Maximize2 className="w-4 h-4" />
            <span className="hidden sm:inline">Fullscreen</span>
          </button>
        </div>

        {/* Previous & Next Quick Arrows */}
        {totalCount > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handlePrevScreenshot();
              }}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 p-2.5 sm:p-3 rounded-full bg-zinc-900/85 hover:bg-purple-600 text-white backdrop-blur-md border border-zinc-700/60 transition-all shadow-xl hover:scale-110 active:scale-95 cursor-pointer focus-visible:ring-2 focus-visible:ring-purple-400"
              title="Previous Screenshot (Left Arrow)"
              aria-label="Previous Screenshot"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleNextScreenshot();
              }}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 p-2.5 sm:p-3 rounded-full bg-zinc-900/85 hover:bg-purple-600 text-white backdrop-blur-md border border-zinc-700/60 transition-all shadow-xl hover:scale-110 active:scale-95 cursor-pointer focus-visible:ring-2 focus-visible:ring-purple-400"
              title="Next Screenshot (Right Arrow)"
              aria-label="Next Screenshot"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Compact Status Bar + Bottom Thumbnail Strip */}
      <div className="w-full mt-3 flex flex-col items-center gap-2.5">
        {/* Compact "Viewing" status bar */}
        <div className="w-full flex items-center justify-between px-1">
          <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5 truncate">
            <span className="text-zinc-400 shrink-0">Viewing:</span>
            <span className="text-purple-400 truncate">{displayTitle}</span>
          </span>
          <span className="text-[11px] tabular-nums text-zinc-400 shrink-0 ml-2">
            {activeIdx + 1}&thinsp;/&thinsp;{screenshots.length}
          </span>
        </div>

        {/* Thumbnails row */}
        <div className="w-full flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {screenshots.map((s, idx) => {
            const isSelected = idx === activeIdx;
            return (
              <button
                key={s.id || idx}
                type="button"
                onClick={() => {
                  hasUserManuallySelected.current = true;
                  onSelectScreenshot(idx);
                }}
                className={`relative shrink-0 w-11 sm:w-13 h-22 sm:h-26 md:h-28 rounded-xl overflow-hidden border-2 transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'border-purple-500 scale-105 shadow-lg shadow-purple-600/40 ring-2 ring-purple-500/30'
                    : 'border-zinc-800 opacity-60 hover:opacity-100 hover:border-zinc-700'
                }`}
                title={s.title || `Screenshot ${idx + 1}`}
              >
                <img
                  src={s.imageUrl || s.url}
                  alt={s.title || `Thumbnail ${idx + 1}`}
                  loading="lazy"
                  className="w-full h-full object-contain bg-zinc-900"
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
