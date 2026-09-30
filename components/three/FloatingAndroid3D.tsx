'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { isWebGLAvailable, disposeThreeScene } from '@/lib/threeUtils';
import { X, Sparkles, MessageCircle, Heart, ChevronDown } from 'lucide-react';

const MASCOT_MESSAGES = [
  '🤖 100% Open-Source & Verified!',
  '⚡ Native Kotlin & Jetpack Compose!',
  '🛡️ Zero Trackers, Zero Telemetry!',
  '🚀 120Hz Fluid Material Design 3!',
  '✨ Drag me around in 3D!',
];

export function FloatingAndroid3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [hasWebGL, setHasWebGL] = useState(true);
  const [isOpen, setIsOpen] = useState(true);
  const [messageIdx, setMessageIdx] = useState(0);
  const [heartCount, setHeartCount] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Three.js refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const headMeshRef = useRef<THREE.Group | null>(null);
  const leftArmRef = useRef<THREE.Mesh | null>(null);
  const rightArmRef = useRef<THREE.Mesh | null>(null);
  const eyeLeftMatRef = useRef<THREE.MeshBasicMaterial | null>(null);
  const eyeRightMatRef = useRef<THREE.MeshBasicMaterial | null>(null);

  const mousePosRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!isWebGLAvailable()) {
      setHasWebGL(false);
      return;
    }

    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas || !isOpen) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const size = 160;
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.set(0, 0.4, 4.2);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'low-power',
    });
    renderer.setSize(size, size);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    rendererRef.current = renderer;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x38bdf8, 2.0);
    dirLight.position.set(3, 4, 4);
    scene.add(dirLight);

    const purpleLight = new THREE.PointLight(0xa855f7, 3.0, 10);
    purpleLight.position.set(-3, -2, 2);
    scene.add(purpleLight);

    // ==========================================
    // 3D Android Mascot Construction
    // ==========================================
    const androidGroup = new THREE.Group();

    // Android Green / Metallic Material
    const androidMat = new THREE.MeshStandardMaterial({
      color: 0x3ddc84, // Android official green
      roughness: 0.25,
      metalness: 0.35,
    });

    // 1. Android Body (Cylinder with rounded bottom)
    const bodyGeom = new THREE.CylinderGeometry(0.5, 0.5, 0.75, 32);
    const body = new THREE.Mesh(bodyGeom, androidMat);
    body.position.y = -0.15;
    androidGroup.add(body);

    // 2. Android Head Group (Hemisphere + Antennas + Eyes)
    const headGroup = new THREE.Group();
    headGroup.position.y = 0.32;
    headMeshRef.current = headGroup;

    // Dome head
    const headGeom = new THREE.SphereGeometry(0.5, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const head = new THREE.Mesh(headGeom, androidMat);
    headGroup.add(head);

    // Eyes
    const eyeGeom = new THREE.SphereGeometry(0.05, 16, 16);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    eyeLeftMatRef.current = eyeMat;
    eyeRightMatRef.current = eyeMat;

    const leftEye = new THREE.Mesh(eyeGeom, eyeMat);
    leftEye.position.set(0.18, 0.22, 0.44);
    headGroup.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeom, eyeMat);
    rightEye.position.set(-0.18, 0.22, 0.44);
    headGroup.add(rightEye);

    // Antennas
    const antennaGeom = new THREE.CylinderGeometry(0.02, 0.02, 0.24, 16);
    const leftAntenna = new THREE.Mesh(antennaGeom, androidMat);
    leftAntenna.position.set(0.24, 0.52, 0);
    leftAntenna.rotation.z = -Math.PI / 7;
    headGroup.add(leftAntenna);

    const rightAntenna = new THREE.Mesh(antennaGeom, androidMat);
    rightAntenna.position.set(-0.24, 0.52, 0);
    rightAntenna.rotation.z = Math.PI / 7;
    headGroup.add(rightAntenna);

    androidGroup.add(headGroup);

    // 3. Arms
    const armGeom = new THREE.CapsuleGeometry
      ? new THREE.CapsuleGeometry(0.1, 0.45, 8, 16)
      : new THREE.CylinderGeometry(0.1, 0.1, 0.5, 16);

    const leftArm = new THREE.Mesh(armGeom, androidMat);
    leftArm.position.set(0.68, -0.15, 0);
    androidGroup.add(leftArm);
    leftArmRef.current = leftArm;

    const rightArm = new THREE.Mesh(armGeom, androidMat);
    rightArm.position.set(-0.68, -0.15, 0);
    androidGroup.add(rightArm);
    rightArmRef.current = rightArm;

    // 4. Legs
    const legGeom = new THREE.CylinderGeometry(0.1, 0.1, 0.35, 16);
    const leftLeg = new THREE.Mesh(legGeom, androidMat);
    leftLeg.position.set(0.24, -0.65, 0);
    androidGroup.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeom, androidMat);
    rightLeg.position.set(-0.24, -0.65, 0);
    androidGroup.add(rightLeg);

    scene.add(androidGroup);

    // Tracking mouse
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mousePosRef.current = { x: Math.max(-1, Math.min(1, x)), y: Math.max(-1, Math.min(1, y)) };
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Animation Loop
    let animId: number;
    let clock = new THREE.Clock();
    let blinkTimer = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Head tracks mouse
      if (headMeshRef.current) {
        headMeshRef.current.rotation.y = mousePosRef.current.x * 0.45;
        headMeshRef.current.rotation.x = -mousePosRef.current.y * 0.3;
      }

      // Android breathing / hovering motion
      androidGroup.position.y = Math.sin(elapsed * 2.5) * 0.06;
      androidGroup.rotation.y = Math.sin(elapsed * 0.8) * 0.15;

      // Right arm waves
      if (rightArmRef.current) {
        rightArmRef.current.rotation.z = Math.sin(elapsed * 4.0) * 0.3 - 0.2;
      }

      // Eye blink logic
      blinkTimer += delta;
      if (blinkTimer > 3.5) {
        if (eyeLeftMatRef.current && eyeRightMatRef.current) {
          eyeLeftMatRef.current.color.setHex(0x18181b);
          eyeRightMatRef.current.color.setHex(0x18181b);
        }
        if (blinkTimer > 3.7) {
          if (eyeLeftMatRef.current && eyeRightMatRef.current) {
            eyeLeftMatRef.current.color.setHex(0xffffff);
            eyeRightMatRef.current.color.setHex(0xffffff);
          }
          blinkTimer = 0;
        }
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      disposeThreeScene(scene);
      renderer.dispose();
    };
  }, [isOpen]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 p-3 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-2xl shadow-emerald-950/50 hover:scale-110 active:scale-95 transition-all border border-emerald-400/40 flex items-center gap-2 text-xs font-bold"
        title="Open 3D Android Mascot"
      >
        <span>🤖</span>
        <span className="hidden sm:inline">3D Mascot</span>
      </button>
    );
  }

  const handleNextMessage = () => {
    setMessageIdx((prev) => (prev + 1) % MASCOT_MESSAGES.length);
    setHeartCount((c) => c + 1);
  };

  return (
    <aside
      aria-label="3D Interactive Mascot Widget"
      className="fixed bottom-6 right-6 z-40 flex flex-col items-end pointer-events-none select-none animate-in fade-in slide-in-from-bottom-4 duration-300"
    >
      {/* Speech Bubble */}
      <div className="pointer-events-auto mb-2 max-w-[220px] bg-zinc-950/90 backdrop-blur-md p-3 rounded-2xl border border-emerald-800/40 shadow-2xl text-xs text-zinc-100 flex flex-col gap-1.5 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-extrabold text-emerald-400 flex items-center gap-1 uppercase tracking-wider">
            <Sparkles className="w-3 h-3" /> CrazyBot 3D
          </span>
          <button
            onClick={() => setIsOpen(false)}
            className="text-zinc-500 hover:text-zinc-200 transition-colors"
            title="Minimize"
            aria-label="Minimize 3D Mascot"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
        <p className="text-[11px] font-semibold text-zinc-200 leading-snug">
          {MASCOT_MESSAGES[messageIdx]}
        </p>
        <button
          onClick={handleNextMessage}
          className="mt-1 self-start px-2 py-0.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/50 text-[10px] font-bold flex items-center gap-1 transition-all active:scale-95"
        >
          <Heart className="w-2.5 h-2.5 text-pink-400 fill-pink-400" /> Next Tip ({heartCount})
        </button>
      </div>

      {/* 3D Canvas Box */}
      <div
        ref={containerRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleNextMessage}
        className="pointer-events-auto relative w-28 h-28 cursor-pointer rounded-2xl bg-zinc-950/40 backdrop-blur-sm border border-emerald-900/30 shadow-xl hover:border-emerald-600/60 transition-all hover:scale-105 active:scale-95 flex items-center justify-center overflow-hidden"
        title="Click to interact with 3D Android!"
      >
        {hasWebGL ? (
          <canvas ref={canvasRef} className="w-full h-full" />
        ) : (
          <span className="text-3xl">🤖</span>
        )}
      </div>
    </aside>
  );
}
