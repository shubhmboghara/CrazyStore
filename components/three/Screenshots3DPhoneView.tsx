'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { isWebGLAvailable, disposeThreeScene, drawAndroidScreenCanvas } from '@/lib/threeUtils';
import { AndroidApp } from '@/lib/appsData';
import {
  Sparkles,
  Maximize2,
  RotateCcw,
  Smartphone,
  ChevronLeft,
  ChevronRight,
  Layers,
  ZoomIn,
  ZoomOut,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

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
  const [zoomMode, setZoomMode] = useState<'app' | 'overview'>('overview');
  const [isSwipingThumb, setIsSwipingThumb] = useState<boolean>(false);

  // Animation values: 0.0 = Close-up App View, 1.0 = Zoomed-out 3D Multitasking Overview
  const zoomProgress = useRef<number>(1.0);
  const targetZoom = useRef<number>(1.0);

  // Gesture tracking
  const touchStartY = useRef<number>(0);
  const touchStartX = useRef<number>(0);
  const isDraggingGesture = useRef<boolean>(false);
  const initialZoomAtTouch = useRef<number>(1.0);

  // Three.js references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const isUserRotating = useRef<boolean>(false);

  const phoneGroupRef = useRef<THREE.Group | null>(null);
  const platformGroupRef = useRef<THREE.Group | null>(null);
  const leftCardGroupRef = useRef<THREE.Group | null>(null);
  const rightCardGroupRef = useRef<THREE.Group | null>(null);

  // Canvases & Textures for Center Phone, Left Card & Right Card
  const mainCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const mainTextureRef = useRef<THREE.CanvasTexture | null>(null);

  const leftCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const leftTextureRef = useRef<THREE.CanvasTexture | null>(null);
  const leftMatRef = useRef<THREE.MeshStandardMaterial | null>(null);

  const rightCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const rightTextureRef = useRef<THREE.CanvasTexture | null>(null);
  const rightMatRef = useRef<THREE.MeshStandardMaterial | null>(null);

  const totalCount = screenshots.length;
  const prevIdx = (activeIdx - 1 + totalCount) % totalCount;
  const nextIdx = (activeIdx + 1) % totalCount;

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
    scene.fog = new THREE.FogExp2(0x09090b, 0.032);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0.35, 7.8);
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
    controls.enableZoom = false; // Do not hijack page scroll
    controls.minPolarAngle = Math.PI / 4;
    controls.maxPolarAngle = Math.PI * 0.72;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.0;
    controls.addEventListener('start', () => {
      setHasInteracted(true);
      isUserRotating.current = true;
    });
    controls.addEventListener('end', () => {
      isUserRotating.current = false;
    });
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
    const mainCanvas = document.createElement('canvas');
    mainCanvas.width = 512;
    mainCanvas.height = 1024;
    mainCanvasRef.current = mainCanvas;

    const mainTexture = new THREE.CanvasTexture(mainCanvas);
    mainTexture.colorSpace = THREE.SRGBColorSpace;
    mainTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    mainTextureRef.current = mainTexture;

    // Screen Mesh
    const screenMat = new THREE.MeshStandardMaterial({
      map: mainTexture,
      roughness: 0.15,
      metalness: 0.05,
      emissiveMap: mainTexture,
      emissiveIntensity: 0.35,
    });
    const screenMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(phoneW - 0.12, phoneH - 0.14),
      screenMat
    );
    screenMesh.position.z = phoneD / 2 + 0.005;
    screenMesh.name = 'centerScreenMesh';
    phone.add(screenMesh);

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

    // 7. Pedestal & Glow Ring Group
    const platformGroup = new THREE.Group();
    platformGroupRef.current = platformGroup;

    const platform = new THREE.Mesh(
      new THREE.CylinderGeometry(2.4, 2.6, 0.15, 64),
      new THREE.MeshStandardMaterial({
        color: 0x18181b,
        metalness: 0.8,
        roughness: 0.3,
        transparent: true,
        opacity: 1,
      })
    );
    platform.position.y = -phoneH / 2 - 0.28;
    platformGroup.add(platform);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(2.45, 0.02, 16, 80),
      new THREE.MeshBasicMaterial({ color: 0xa855f7, transparent: true, opacity: 0.85 })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -phoneH / 2 - 0.22;
    platformGroup.add(ring);

    scene.add(platformGroup);

    // 8. Build 3D Multitasking Overview Companion Cards (Left & Right)
    // Left Multitasking Card
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
      opacity: 0.75,
      roughness: 0.25,
      metalness: 0.1,
    });
    leftMatRef.current = leftCardMat;

    const leftCardFrame = new THREE.Mesh(
      new THREE.BoxGeometry(phoneW * 0.86, phoneH * 0.86, 0.08),
      new THREE.MeshStandardMaterial({ color: 0x1e1b4b, metalness: 0.8, roughness: 0.3, transparent: true, opacity: 0.8 })
    );
    leftGroup.add(leftCardFrame);

    const leftCardMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(phoneW * 0.84, phoneH * 0.84),
      leftCardMat
    );
    leftCardMesh.position.z = 0.045;
    leftCardMesh.name = 'leftCardMesh';
    leftGroup.add(leftCardMesh);

    leftGroup.position.set(-3.2, 0.1, -1.2);
    leftGroup.rotation.y = 0.35;
    scene.add(leftGroup);

    // Right Multitasking Card
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
      opacity: 0.75,
      roughness: 0.25,
      metalness: 0.1,
    });
    rightMatRef.current = rightCardMat;

    const rightCardFrame = new THREE.Mesh(
      new THREE.BoxGeometry(phoneW * 0.86, phoneH * 0.86, 0.08),
      new THREE.MeshStandardMaterial({ color: 0x1e1b4b, metalness: 0.8, roughness: 0.3, transparent: true, opacity: 0.8 })
    );
    rightGroup.add(rightCardFrame);

    const rightCardMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(phoneW * 0.84, phoneH * 0.84),
      rightCardMat
    );
    rightCardMesh.position.z = 0.045;
    rightCardMesh.name = 'rightCardMesh';
    rightGroup.add(rightCardMesh);

    rightGroup.position.set(3.2, 0.1, -1.2);
    rightGroup.rotation.y = -0.35;
    scene.add(rightGroup);

    // 9. Ambient floating stardust
    const stardustCount = 70;
    const stardustGeo = new THREE.BufferGeometry();
    const stardustPos = new Float32Array(stardustCount * 3);
    for (let i = 0; i < stardustCount; i++) {
      stardustPos[i * 3] = (Math.random() - 0.5) * 14;
      stardustPos[i * 3 + 1] = (Math.random() - 0.5) * 8;
      stardustPos[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    stardustGeo.setAttribute('position', new THREE.BufferAttribute(stardustPos, 3));
    const stardustMat = new THREE.PointsMaterial({
      size: 0.038,
      color: 0xa855f7,
      transparent: true,
      opacity: 0.45,
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
        }
      }
    });
    resizeObserver.observe(container);

    // 11. Page Scroll Influence Listener (Scroll Zoom Out)
    const handleWindowScroll = () => {
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const windowH = window.innerHeight || 800;

      // When the top of the container reaches the upper half of screen, trigger zoom
      if (rect.top <= windowH * 0.7 && rect.bottom >= windowH * 0.3) {
        // Natural scroll progress
        const ratio = THREE.MathUtils.clamp((windowH * 0.7 - rect.top) / (windowH * 0.4), 0, 1);
        if (!isDraggingGesture.current) {
          // If in overview, keep target at 1.0; if user hasn't explicitly locked in-app mode
          if (targetZoom.current > 0.5) {
            targetZoom.current = 0.4 + ratio * 0.6;
          }
        }
      }
    };
    window.addEventListener('scroll', handleWindowScroll, { passive: true });

    // 12. Animation Loop (60 FPS with smooth damping lerp)
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);

      if (!isVisible) return;

      const elapsed = clock.getElapsedTime();

      // Smoothly interpolate current zoom towards target zoom
      zoomProgress.current = THREE.MathUtils.lerp(zoomProgress.current, targetZoom.current, 0.08);
      const zp = zoomProgress.current;

      const isMobile = window.innerWidth < 640;
      const closeZ = isMobile ? 4.9 : 4.4;
      const farZ = isMobile ? 8.6 : 7.8;

      // Dynamic Camera Zoom
      const currentCameraZ = THREE.MathUtils.lerp(closeZ, farZ, zp);
      const currentCameraY = THREE.MathUtils.lerp(0.02, 0.35, zp);

      // Interpolate camera position smoothly when user is not manually rotating
      if (!isUserRotating.current) {
        camera.position.z = THREE.MathUtils.lerp(camera.position.z, currentCameraZ, 0.08);
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, currentCameraY, 0.08);
      }

      // Phone Tilt Back Metaphor (Like an app card lifting & tilting backward when closed with thumb)
      const targetTiltX = THREE.MathUtils.lerp(0.0, -0.22, zp);
      phone.rotation.x = THREE.MathUtils.lerp(phone.rotation.x, targetTiltX, 0.08);

      // Subtle floating levitation when in overview mode
      const levitation = Math.sin(elapsed * 1.5) * 0.07 * zp;
      phone.position.y = levitation;

      // Scale & Opacity of 3D Multitasking Companion Cards
      const cardAlpha = Math.max(0, Math.min(0.8, (zp - 0.25) / 0.75));
      if (leftMatRef.current && rightMatRef.current) {
        leftMatRef.current.opacity = cardAlpha;
        rightMatRef.current.opacity = cardAlpha;
      }

      // Companion Cards slide into place from behind center phone
      if (leftGroup && rightGroup) {
        leftGroup.position.x = THREE.MathUtils.lerp(-1.4, -3.2, zp);
        leftGroup.position.z = THREE.MathUtils.lerp(-2.2, -1.2, zp);
        leftGroup.position.y = levitation;

        rightGroup.position.x = THREE.MathUtils.lerp(1.4, 3.2, zp);
        rightGroup.position.z = THREE.MathUtils.lerp(-2.2, -1.2, zp);
        rightGroup.position.y = levitation;

        leftGroup.visible = zp > 0.08;
        rightGroup.visible = zp > 0.08;
      }

      // Pedestal Platform scales and fades in overview mode
      if (platformGroup) {
        platformGroup.scale.setScalar(THREE.MathUtils.lerp(0.001, 1.0, zp));
        platformGroup.position.y = levitation;
        platformGroup.visible = zp > 0.15;
      }

      // Auto-rotation only active in overview mode
      controls.autoRotate = zp > 0.65;
      controls.update();

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('scroll', handleWindowScroll);
      observer.disconnect();
      resizeObserver.disconnect();
      controls.dispose();
      disposeThreeScene(scene);
      renderer.dispose();
    };
  }, [app, screenshots, activeIdx, prevIdx, nextIdx, totalCount, renderScreenToCanvas]);

  // Touch Gesture Handling: Swipe Up with Thumb to Zoom Out / Minimize to 3D
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1) {
      touchStartY.current = e.touches[0].clientY;
      touchStartX.current = e.touches[0].clientX;
      initialZoomAtTouch.current = targetZoom.current;
      isDraggingGesture.current = true;
      setIsSwipingThumb(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDraggingGesture.current || e.touches.length !== 1) return;

    const deltaY = e.touches[0].clientY - touchStartY.current;
    const deltaX = e.touches[0].clientX - touchStartX.current;

    // Prioritize vertical thumb swipe gesture
    if (Math.abs(deltaY) > Math.abs(deltaX) * 1.1) {
      // Swiping UP (deltaY < 0) pulls zoom out towards overview (1.0)
      // Swiping DOWN (deltaY > 0) pulls zoom in towards close-up app (0.0)
      const sensitivity = 220; // px to full transition
      const progressDelta = -deltaY / sensitivity;
      const newZoom = THREE.MathUtils.clamp(initialZoomAtTouch.current + progressDelta, 0, 1);
      targetZoom.current = newZoom;
    }
  };

  const handleTouchEnd = () => {
    if (!isDraggingGesture.current) return;
    isDraggingGesture.current = false;
    setIsSwipingThumb(false);

    // Elastic snap to nearest mode
    if (targetZoom.current > 0.45) {
      targetZoom.current = 1.0;
      setZoomMode('overview');
    } else {
      targetZoom.current = 0.0;
      setZoomMode('app');
    }
  };

  // Mouse Wheel Zoom Support (Wheel down = zoom out like closing app, Wheel up = zoom in)
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const isAtLimit =
      (targetZoom.current >= 0.98 && e.deltaY > 0) || (targetZoom.current <= 0.02 && e.deltaY < 0);

    // Only prevent page scroll when actively zooming between bounds
    if (!isAtLimit) {
      const step = e.deltaY > 0 ? 0.25 : -0.25;
      const nextZoom = THREE.MathUtils.clamp(targetZoom.current + step, 0, 1);
      targetZoom.current = nextZoom;
      setZoomMode(nextZoom > 0.5 ? 'overview' : 'app');
    }
  };

  // Canvas Click: Raycast to switch cards or open lightbox
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const canvas = canvasRef.current;
    const camera = cameraRef.current;
    const scene = sceneRef.current;
    if (!canvas || !camera || !scene) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), camera);

    const intersects = raycaster.intersectObjects(scene.children, true);
    if (intersects.length > 0) {
      const hitName = intersects[0].object.name;

      if (hitName === 'leftCardMesh') {
        onSelectScreenshot(prevIdx);
        return;
      }
      if (hitName === 'rightCardMesh') {
        onSelectScreenshot(nextIdx);
        return;
      }
      if (hitName === 'centerScreenMesh' || hitName === '') {
        if (targetZoom.current > 0.6) {
          // If in overview, clicking the phone zooms into full app view!
          targetZoom.current = 0.0;
          setZoomMode('app');
        } else {
          // If already in app view, clicking opens fullscreen lightbox
          onOpenLightbox(activeIdx);
        }
      }
    }
  };

  // Mode Toggle Handlers
  const handleSwitchToAppView = () => {
    targetZoom.current = 0.0;
    setZoomMode('app');
    if (controlsRef.current && cameraRef.current) {
      controlsRef.current.reset();
      cameraRef.current.position.set(0, 0.02, 4.4);
    }
  };

  const handleSwitchToOverview = () => {
    targetZoom.current = 1.0;
    setZoomMode('overview');
    if (controlsRef.current && cameraRef.current) {
      cameraRef.current.position.set(0, 0.35, 7.8);
      controlsRef.current.autoRotate = true;
    }
  };

  const handleResetCamera = () => {
    if (!controlsRef.current || !cameraRef.current) return;
    controlsRef.current.reset();
    targetZoom.current = 1.0;
    setZoomMode('overview');
    cameraRef.current.position.set(0, 0.35, 7.8);
    controlsRef.current.autoRotate = true;
  };

  const currentScreenshot = screenshots[activeIdx];
  const displayTitle = currentScreenshot?.title || `Screenshot ${activeIdx + 1}`;

  return (
    <div className="relative w-full flex flex-col items-center animate-in fade-in duration-300">
      {/* 3D WebGL Canvas Viewport */}
      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
        onClick={handleCanvasClick}
        className="relative w-full h-[380px] xs:h-[440px] sm:h-[500px] md:h-[540px] rounded-2xl sm:rounded-3xl overflow-hidden bg-gradient-to-b from-zinc-950 via-zinc-900/60 to-zinc-950 border border-zinc-800/90 shadow-2xl flex items-center justify-center cursor-grab active:cursor-grabbing select-none touch-pan-y"
      >
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Floating Top Mode & Status Bar */}
        <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-20 flex items-center gap-2 pointer-events-none">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950/80 backdrop-blur-md border border-purple-800/50 text-purple-300 text-xs font-bold shadow-lg">
            <Smartphone className="w-3.5 h-3.5 text-purple-400" />
            <span>3D Interactive Studio</span>
          </div>
          <span className="hidden sm:inline-block px-2.5 py-1 rounded-full bg-zinc-900/80 backdrop-blur-md border border-zinc-800 text-[11px] font-semibold text-zinc-400">
            WebGL 60FPS
          </span>
        </div>

        {/* Floating Controls Overlay */}
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 flex items-center gap-1.5 sm:gap-2">
          {/* Zoom Mode Switcher Pill */}
          <div className="flex items-center p-1 rounded-xl bg-zinc-900/85 backdrop-blur-md border border-zinc-700/60 shadow-md">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleSwitchToAppView();
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                zoomMode === 'app'
                  ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/30'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Close-up In-App View"
            >
              <ZoomIn className="w-3 h-3" />
              <span className="hidden md:inline">App View</span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleSwitchToOverview();
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                zoomMode === 'overview'
                  ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/30'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="3D Multitasking Overview (Zoom Out)"
            >
              <Layers className="w-3 h-3" />
              <span className="hidden md:inline">3D Overview</span>
            </button>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleResetCamera();
            }}
            className="p-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white backdrop-blur-md border border-zinc-700/60 transition-all shadow-md cursor-pointer hover:scale-105 active:scale-95"
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
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white backdrop-blur-md transition-all shadow-lg shadow-purple-600/30 cursor-pointer hover:scale-105 active:scale-95 flex items-center gap-1.5 text-xs font-bold"
            title="Inspect Fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
            <span className="hidden sm:inline">Fullscreen</span>
          </button>
        </div>

        {/* Interactive Bottom Home Bar Gesture Handle (The "Thumb Swipe to Minimize App" Metaphor) */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            if (zoomMode === 'app') {
              handleSwitchToOverview();
            } else {
              handleSwitchToAppView();
            }
          }}
          className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1.5 px-4 py-2 rounded-full bg-zinc-950/80 hover:bg-zinc-900/90 active:bg-zinc-800 backdrop-blur-md border border-purple-500/30 hover:border-purple-400/50 shadow-xl shadow-purple-950/40 cursor-pointer transition-all hover:scale-105 group"
        >
          {/* Authentic Mobile Home Navigation Bar Indicator */}
          <div className="w-16 sm:w-20 h-1.5 rounded-full bg-white/70 group-hover:bg-purple-400 transition-colors shadow-sm" />

          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-300 group-hover:text-white transition-colors">
            {zoomMode === 'app' ? (
              <>
                <ArrowUp className="w-3 h-3 text-purple-400 animate-bounce" />
                <span>Swipe up with thumb or scroll to minimize to 3D</span>
              </>
            ) : (
              <>
                <ArrowDown className="w-3 h-3 text-purple-400" />
                <span>Tap or swipe down to focus App View &bull; Drag to rotate 360&deg;</span>
              </>
            )}
          </div>
        </div>

        {/* First-time Interaction Sparkle Hint */}
        {!hasInteracted && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2 z-10 pointer-events-none flex items-center gap-2 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md border border-purple-500/20 text-zinc-300 text-[11px] animate-pulse">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Interactive gesture navigation &bull; Swipe thumb or scroll</span>
          </div>
        )}
      </div>

      {/* Synchronized Bottom Screenshot Selector */}
      <div className="w-full mt-4 flex flex-col items-center gap-2">
        <div className="w-full flex items-center justify-between px-1">
          <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
            <span>Active Screenshot on Device:</span>
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
