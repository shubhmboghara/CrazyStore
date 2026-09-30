'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { isWebGLAvailable, disposeThreeScene } from '@/lib/threeUtils';

interface Feature3DCanvasProps {
  type: 'shield' | 'zap' | 'code';
}

export function Feature3DCanvas({ type }: Feature3DCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isWebGLAvailable()) return;

    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const size = 52;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 3.5);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'low-power',
    });
    renderer.setSize(size, size);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const group = new THREE.Group();

    if (type === 'shield') {
      // 3D Holographic Shield
      const light = new THREE.PointLight(0xa855f7, 5.0, 10);
      light.position.set(2, 2, 2);
      scene.add(light);

      // Core Shield Polyhedron
      const geom = new THREE.IcosahedronGeometry(0.7, 0);
      const mat = new THREE.MeshStandardMaterial({
        color: 0xc084fc,
        emissive: 0x9333ea,
        emissiveIntensity: 0.6,
        wireframe: true,
      });
      const shield = new THREE.Mesh(geom, mat);
      group.add(shield);

      // Orbiting ring
      const ringGeom = new THREE.TorusGeometry(1.0, 0.03, 8, 32);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.8 });
      const ring = new THREE.Mesh(ringGeom, ringMat);
      ring.rotation.x = Math.PI / 3;
      group.add(ring);
    } else if (type === 'zap') {
      // 3D Pulsing Energy Core
      const light = new THREE.PointLight(0x6366f1, 5.0, 10);
      light.position.set(2, 2, 2);
      scene.add(light);

      const geom = new THREE.OctahedronGeometry(0.75, 0);
      const mat = new THREE.MeshStandardMaterial({
        color: 0x818cf8,
        emissive: 0x4f46e5,
        emissiveIntensity: 0.8,
        metalness: 0.9,
        roughness: 0.1,
      });
      const core = new THREE.Mesh(geom, mat);
      group.add(core);

      const ringGeom = new THREE.TorusGeometry(1.05, 0.025, 8, 32);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0xec4899, transparent: true, opacity: 0.7 });
      const ring = new THREE.Mesh(ringGeom, ringMat);
      ring.rotation.y = Math.PI / 4;
      group.add(ring);
    } else {
      // 3D Modern Code Cube
      const light = new THREE.PointLight(0xf472b6, 5.0, 10);
      light.position.set(2, 2, 2);
      scene.add(light);

      const geom = new THREE.BoxGeometry(0.9, 0.9, 0.9);
      const mat = new THREE.MeshStandardMaterial({
        color: 0xf472b6,
        emissive: 0xdb2777,
        emissiveIntensity: 0.7,
        wireframe: true,
      });
      const cube = new THREE.Mesh(geom, mat);
      group.add(cube);

      const innerGeom = new THREE.OctahedronGeometry(0.4, 0);
      const innerMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      const inner = new THREE.Mesh(innerGeom, innerMat);
      group.add(inner);
    }

    scene.add(group);

    // Animation Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      group.rotation.x = elapsed * 0.8;
      group.rotation.y = elapsed * 1.1;

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      disposeThreeScene(scene);
      renderer.dispose();
    };
  }, [type]);

  return (
    <div
      ref={containerRef}
      className="w-12 h-12 rounded-xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-center shrink-0 overflow-hidden"
    >
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}
