'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { isWebGLAvailable, disposeThreeScene } from '@/lib/threeUtils';
import { Smartphone } from 'lucide-react';

export function NavLogo3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isHoveredRef = useRef(false);
  const spinSpeedRef = useRef(0.015);

  useEffect(() => {
    if (!isWebGLAvailable()) return;

    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const size = 44;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.set(0, 0.2, 3.8);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'low-power',
    });
    renderer.setSize(size, size);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xa855f7, 4.0, 10);
    pointLight.position.set(2, 2, 2);
    scene.add(pointLight);

    const cyanLight = new THREE.PointLight(0x06b6d4, 3.0, 10);
    cyanLight.position.set(-2, -2, 2);
    scene.add(cyanLight);

    // 3D Mini Isometric Smartphone
    const group = new THREE.Group();

    // Body
    const bodyGeom = new THREE.BoxGeometry(1.2, 2.1, 0.18);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      metalness: 0.9,
      roughness: 0.2,
    });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    group.add(body);

    // Screen
    const screenGeom = new THREE.PlaneGeometry(1.05, 1.95);
    const screenMat = new THREE.MeshStandardMaterial({
      color: 0xa855f7,
      emissive: 0x6366f1,
      emissiveIntensity: 0.7,
      roughness: 0.1,
      metalness: 0.2,
    });
    const screen = new THREE.Mesh(screenGeom, screenMat);
    screen.position.z = 0.095;
    group.add(screen);

    // Android Bugdroid 3D dome head on screen
    const domeGeom = new THREE.SphereGeometry(0.24, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    const domeMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.5,
    });
    const dome = new THREE.Mesh(domeGeom, domeMat);
    dome.position.set(0, 0.1, 0.11);
    group.add(dome);

    // Glowing Neon Orbit Ring around phone
    const ringGeom = new THREE.TorusGeometry(1.4, 0.035, 12, 32);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0xa855f7,
      emissive: 0x06b6d4,
      emissiveIntensity: 1.5,
      roughness: 0.2,
      metalness: 0.8,
    });
    const ringMesh = new THREE.Mesh(ringGeom, ringMat);
    ringMesh.rotation.x = Math.PI / 2.8;
    group.add(ringMesh);

    // Initial tilt
    group.rotation.x = 0.25;
    group.rotation.y = -0.4;
    scene.add(group);

    // Hover events
    const onMouseEnter = () => {
      isHoveredRef.current = true;
    };
    const onMouseLeave = () => {
      isHoveredRef.current = false;
    };

    container.addEventListener('mouseenter', onMouseEnter);
    container.addEventListener('mouseleave', onMouseLeave);

    // Animation Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      const targetSpeed = isHoveredRef.current ? 0.06 : 0.015;
      spinSpeedRef.current += (targetSpeed - spinSpeedRef.current) * 0.1;

      group.rotation.y += spinSpeedRef.current;

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      container.removeEventListener('mouseenter', onMouseEnter);
      container.removeEventListener('mouseleave', onMouseLeave);
      disposeThreeScene(scene);
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-purple-500 p-0.5 shadow-md shadow-purple-500/20 flex items-center justify-center shrink-0 cursor-pointer overflow-hidden group"
    >
      <div className="w-full h-full bg-zinc-950 rounded-[10px] flex items-center justify-center overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>
    </div>
  );
}
