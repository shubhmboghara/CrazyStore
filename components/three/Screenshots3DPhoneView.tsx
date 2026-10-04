'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { isWebGLAvailable, disposeThreeScene, drawAndroidScreenCanvas } from '@/lib/threeUtils';
import { AndroidApp } from '@/lib/appsData';
import { Maximize2, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';

interface Screenshots3DPhoneViewProps {
  app: AndroidApp;
  screenshots: Array<{ id: string; url: string; imageUrl?: string; title: string; subtitle?: string }>;
  activeIdx: number;
  onSelectScreenshot: (idx: number) => void;
  onOpenLightbox: (idx: number) => void;
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

  // Canvases & Textures for Center Card, Left Card & Right Card
  const mainCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const mainTextureRef = useRef<THREE.CanvasTexture | null>(null);

  const leftCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const leftTextureRef = useRef<THREE.CanvasTexture | null>(null);

  const rightCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const rightTextureRef = useRef<THREE.CanvasTexture | null>(null);

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

  // Render screenshot onto target canvas & texture
  const renderScreenToCanvas = useCallback(
    (canvas: HTMLCanvasElement, texture: THREE.CanvasTexture, targetUrl: string, title?: string) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        drawAndroidScreenCanvas(canvas, {
          appName: title || app.name,
          tagline: app.tagline || app.shortDescription,
          category: app.category,
          badge: app.badge,
          version: app.version,
          rating: app.initialRating || 5.0,
          previewImage: img,
        });
        texture.needsUpdate = true;
      };
      img.onerror = () => {
        drawAndroidScreenCanvas(canvas, {
          appName: title || app.name,
          tagline: app.tagline || app.shortDescription,
          category: app.category,
          badge: app.badge,
          version: app.version,
          rating: app.initialRating || 5.0,
          accentColor: '#8b5cf6',
          secondaryColor: '#6366f1',
        });
        texture.needsUpdate = true;
      };
      img.src = targetUrl;
    },
    [app]
  );

  // Update center, left, and right textures whenever activeIdx changes
  useEffect(() => {
    if (mainCanvasRef.current && mainTextureRef.current) {
      const currentUrl = screenshots[activeIdx]?.imageUrl || screenshots[activeIdx]?.url || '';
      renderScreenToCanvas(
        mainCanvasRef.current,
        mainTextureRef.current,
        currentUrl,
        screenshots[activeIdx]?.title
      );
    }

    if (totalCount > 1) {
      if (leftCanvasRef.current && leftTextureRef.current) {
        const leftUrl = screenshots[prevIdx]?.imageUrl || screenshots[prevIdx]?.url || '';
        renderScreenToCanvas(
          leftCanvasRef.current,
          leftTextureRef.current,
          leftUrl,
          screenshots[prevIdx]?.title
        );
      }
      if (rightCanvasRef.current && rightTextureRef.current) {
        const rightUrl = screenshots[nextIdx]?.imageUrl || screenshots[nextIdx]?.url || '';
        renderScreenToCanvas(
          rightCanvasRef.current,
          rightTextureRef.current,
          rightUrl,
          screenshots[nextIdx]?.title
        );
      }
    }
  }, [activeIdx, screenshots, prevIdx, nextIdx, totalCount, renderScreenToCanvas]);

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
    const height = container.clientHeight || 480;

    // 1. Scene & Fog
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x09090b, 0.025);
    sceneRef.current = scene;

    // 2. Camera - Starts comfortably framed, zooms out as you scroll down
    const isMobile = width < 640;
    const initialZ = isMobile ? 7.2 : 6.6;
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0.05, initialZ);
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

    // 4. OrbitControls - Rotation enabled, manual zoom disabled to prevent image clipping
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = false; // Strictly driven by page scroll
    controls.minPolarAngle = Math.PI / 4;
    controls.maxPolarAngle = Math.PI * 0.72;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.65;
    controls.addEventListener('start', () => {
      isUserRotating.current = true;
    });
    controls.addEventListener('end', () => {
      isUserRotating.current = false;
    });
    controlsRef.current = controls;

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.0);
    keyLight.position.set(4, 6, 6);
    scene.add(keyLight);

    const rimLight = new THREE.PointLight(0xa855f7, 3.5, 15);
    rimLight.position.set(-4, -2, 4);
    scene.add(rimLight);

    const fillLight = new THREE.PointLight(0x38bdf8, 2.5, 15);
    fillLight.position.set(4, -3, -3);
    scene.add(fillLight);

    // 6. Build Sleek Borderless 3D Floating Screenshot Card (No chunky phone hardware)
    const cardGroup = new THREE.Group();
    cardGroupRef.current = cardGroup;

    const cardW = 2.6;
    const cardH = 5.2;
    const cardD = 0.04;

    // Thin glass backplate
    const backplateMat = new THREE.MeshStandardMaterial({
      color: 0x121217,
      metalness: 0.85,
      roughness: 0.2,
    });
    const backplate = new THREE.Mesh(
      new THREE.BoxGeometry(cardW + 0.02, cardH + 0.02, cardD),
      backplateMat
    );
    cardGroup.add(backplate);

    // Subtle edge rim light border
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0x8b5cf6,
      emissive: 0x7c3aed,
      emissiveIntensity: 0.4,
      metalness: 0.8,
      roughness: 0.2,
    });
    const rim = new THREE.Mesh(
      new THREE.BoxGeometry(cardW + 0.04, cardH + 0.04, cardD * 0.7),
      rimMat
    );
    cardGroup.add(rim);

    // Dynamic 2D Canvas for screen projection
    const mainCanvas = document.createElement('canvas');
    mainCanvas.width = 512;
    mainCanvas.height = 1024;
    mainCanvasRef.current = mainCanvas;

    const mainTexture = new THREE.CanvasTexture(mainCanvas);
    mainTexture.colorSpace = THREE.SRGBColorSpace;
    mainTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    mainTextureRef.current = mainTexture;

    // Screen Mesh - 100% full uncropped screenshot
    const screenMat = new THREE.MeshStandardMaterial({
      map: mainTexture,
      roughness: 0.1,
      metalness: 0.05,
      emissiveMap: mainTexture,
      emissiveIntensity: 0.35,
    });
    const screenMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(cardW, cardH),
      screenMat
    );
    screenMesh.position.z = cardD / 2 + 0.002;
    screenMesh.name = 'centerScreenMesh';
    cardGroup.add(screenMesh);

    // Clearcoat glass reflection layer
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.08,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
    });
    const glass = new THREE.Mesh(
      new THREE.PlaneGeometry(cardW, cardH),
      glassMat
    );
    glass.position.z = cardD / 2 + 0.004;
    cardGroup.add(glass);

    scene.add(cardGroup);

    // 7. Flanking Companion Preview Cards (Desktop only to prevent clutter)
    const showCompanionCards = width >= 640 && totalCount > 1;

    // Left Companion Card
    const leftGroup = new THREE.Group();
    leftCardGroupRef.current = leftGroup;

    const leftCanvas = document.createElement('canvas');
    leftCanvas.width = 512;
    leftCanvas.height = 1024;
    leftCanvasRef.current = leftCanvas;

    const leftTexture = new THREE.CanvasTexture(leftCanvas);
    leftTexture.colorSpace = THREE.SRGBColorSpace;
    leftTextureRef.current = leftTexture;

    const leftCardMat = new THREE.MeshStandardMaterial({
      map: leftTexture,
      transparent: true,
      opacity: 0.6,
      roughness: 0.2,
      metalness: 0.1,
    });

    const leftCard = new THREE.Mesh(
      new THREE.PlaneGeometry(cardW * 0.88, cardH * 0.88),
      leftCardMat
    );
    leftCard.position.z = 0.02;
    leftCard.name = 'leftCardMesh';
    leftGroup.add(leftCard);

    leftGroup.position.set(-3.2, 0.05, -1.2);
    leftGroup.rotation.y = 0.32;
    leftGroup.visible = showCompanionCards;
    scene.add(leftGroup);

    // Right Companion Card
    const rightGroup = new THREE.Group();
    rightCardGroupRef.current = rightGroup;

    const rightCanvas = document.createElement('canvas');
    rightCanvas.width = 512;
    rightCanvas.height = 1024;
    rightCanvasRef.current = rightCanvas;

    const rightTexture = new THREE.CanvasTexture(rightCanvas);
    rightTexture.colorSpace = THREE.SRGBColorSpace;
    rightTextureRef.current = rightTexture;

    const rightCardMat = new THREE.MeshStandardMaterial({
      map: rightTexture,
      transparent: true,
      opacity: 0.6,
      roughness: 0.2,
      metalness: 0.1,
    });

    const rightCard = new THREE.Mesh(
      new THREE.PlaneGeometry(cardW * 0.88, cardH * 0.88),
      rightCardMat
    );
    rightCard.position.z = 0.02;
    rightCard.name = 'rightCardMesh';
    rightGroup.add(rightCard);

    rightGroup.position.set(3.2, 0.05, -1.2);
    rightGroup.rotation.y = -0.32;
    rightGroup.visible = showCompanionCards;
    scene.add(rightGroup);

    // 8. Ambient floating stardust
    const stardustCount = 50;
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
      opacity: 0.4,
    });
    const stardust = new THREE.Points(stardustGeo, stardustMat);
    scene.add(stardust);

    // Initial render call
    const initialUrl = screenshots[activeIdx]?.imageUrl || screenshots[activeIdx]?.url || '';
    renderScreenToCanvas(mainCanvas, mainTexture, initialUrl, screenshots[activeIdx]?.title);

    if (totalCount > 1) {
      renderScreenToCanvas(
        leftCanvas,
        leftTexture,
        screenshots[prevIdx]?.imageUrl || screenshots[prevIdx]?.url || '',
        screenshots[prevIdx]?.title
      );
      renderScreenToCanvas(
        rightCanvas,
        rightTexture,
        screenshots[nextIdx]?.imageUrl || screenshots[nextIdx]?.url || '',
        screenshots[nextIdx]?.title
      );
    }

    // 9. Scroll Listener for Smooth 3D Zoom-Out Effect & Automatic Progression
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

    // 10. Visibility and Resize Observers
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
          if (leftGroup) leftGroup.visible = canShowCompanion;
          if (rightGroup) rightGroup.visible = canShowCompanion;
        }
      }
    });
    resizeObserver.observe(container);

    // 11. Animation Loop (Rich Scroll-Driven Zoom-Out & Gentle Floating)
    let animId: number;
    let clock = new THREE.Clock();

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
      const minZ = isMobileNow ? 7.2 : 6.6;
      const maxZ = isMobileNow ? 9.0 : 8.5;

      // Camera distance: starts prominent and cleanly framed, zooms out smoothly as you scroll
      const targetCamZ = THREE.MathUtils.lerp(minZ, maxZ, p);
      const targetCamY = THREE.MathUtils.lerp(0.04, 0.22, p);

      if (!isUserRotating.current) {
        camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetCamZ, 0.08);
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetCamY, 0.08);
      }

      // Rich 3D Perspective Tilt: As it zooms out, card pitches back slightly in 3D
      const targetTiltX = THREE.MathUtils.lerp(0.0, -0.12, p);
      cardGroup.rotation.x = THREE.MathUtils.lerp(cardGroup.rotation.x, targetTiltX, 0.08);

      // Smooth decay of card flip turn angle on screenshot change
      if (Math.abs(cardFlipAngle.current) > 0.001) {
        cardFlipAngle.current = THREE.MathUtils.lerp(cardFlipAngle.current, 0, 0.1);
      }
      if (!isUserRotating.current) {
        cardGroup.rotation.y = cardFlipAngle.current;
      }

      // Tap bounce recovery
      if (cardBounceRef.current > 0.001) {
        cardBounceRef.current = THREE.MathUtils.lerp(cardBounceRef.current, 0, 0.1);
      }

      // Gentle floating levitation
      const levitation = Math.sin(elapsed * 1.5) * 0.05;
      cardGroup.position.y = levitation;
      cardGroup.position.z = -cardBounceRef.current;

      if (leftGroup) leftGroup.position.y = levitation;
      if (rightGroup) rightGroup.position.y = levitation;

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
  }, [app, screenshots, totalCount, renderScreenToCanvas, onSelectScreenshot, resetManualLockWithTimeout]);

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
    cameraRef.current.position.set(0, 0.05, isMobile ? 7.2 : 6.6);
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

  return (
    <div className="relative w-full flex flex-col items-center animate-in fade-in duration-300">
      {/* 3D WebGL Canvas Viewport - Clean, borderless, click-to-open lightbox & swipe/scroll to change */}
      <div
        ref={containerRef}
        onClick={handleCanvasClick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative w-full h-[400px] xs:h-[460px] sm:h-[500px] md:h-[540px] rounded-2xl sm:rounded-3xl overflow-hidden bg-gradient-to-b from-zinc-950 via-zinc-900/50 to-zinc-950 border border-zinc-800/80 shadow-2xl flex items-center justify-center select-none cursor-grab"
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
            className="p-2 sm:p-2.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white backdrop-blur-md border border-zinc-700/60 transition-all shadow-md cursor-pointer hover:scale-105 active:scale-95"
            title="Reset 3D Perspective"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenLightbox(activeIdx);
            }}
            className="p-2 sm:px-3 sm:py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white backdrop-blur-md transition-all shadow-lg shadow-purple-600/30 cursor-pointer hover:scale-105 active:scale-95 flex items-center gap-1.5 text-xs font-bold"
            title="Inspect Fullscreen"
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
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-2.5 rounded-full bg-zinc-900/80 hover:bg-purple-600 text-white backdrop-blur-md border border-zinc-700/60 transition-all shadow-xl hover:scale-110 active:scale-95 cursor-pointer"
              title="Previous Screenshot"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleNextScreenshot();
              }}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-2.5 rounded-full bg-zinc-900/80 hover:bg-purple-600 text-white backdrop-blur-md border border-zinc-700/60 transition-all shadow-xl hover:scale-110 active:scale-95 cursor-pointer"
              title="Next Screenshot"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Synchronized Bottom Screenshot Selector */}
      <div className="w-full mt-4 flex flex-col items-center gap-2">
        <div className="w-full flex items-center justify-between px-1">
          <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
            <span>Viewing:</span>
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
                onClick={() => {
                  hasUserManuallySelected.current = true;
                  onSelectScreenshot(idx);
                }}
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
