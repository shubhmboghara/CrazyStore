'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { isWebGLAvailable, disposeThreeScene } from '@/lib/threeUtils';

/**
 * Lightweight, high-performance ambient Three.js 3D backdrop for Screenshots & Visuals.
 * Provides subtle perspective depth, gentle particle drift, and soft wireframe geometry
 * without visually overpowering the app screenshots.
 */
export function Screenshots3DBackdrop() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isWebGLAvailable()) return;

    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    // ─── Scene Setup ────────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x09090b, 0.04);

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 1.2, 7);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: true,
      powerPreference: 'low-power',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));

    // ─── Subtle Perspective Grid Floor ───────────────────────────────────────
    const gridHelper = new THREE.GridHelper(30, 24, 0xa855f7, 0x27272a);
    gridHelper.position.y = -2.2;
    (gridHelper.material as THREE.Material).transparent = true;
    (gridHelper.material as THREE.Material).opacity = 0.12;
    scene.add(gridHelper);

    // ─── Ambient Stardust Points ────────────────────────────────────────────
    const PARTICLE_COUNT = 140;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);

    const colorPurple = new THREE.Color(0xa855f7);
    const colorCyan = new THREE.Color(0x38bdf8);
    const colorIndigo = new THREE.Color(0x818cf8);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 22;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 15;

      const c = i % 3 === 0 ? colorPurple : i % 3 === 1 ? colorCyan : colorIndigo;
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.5,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // ─── Floating Subtle 3D Wireframe Polyhedron ────────────────────────────
    const polyGeo = new THREE.IcosahedronGeometry(1.6, 0);
    const polyMat = new THREE.MeshBasicMaterial({
      color: 0x9333ea,
      wireframe: true,
      transparent: true,
      opacity: 0.15,
    });
    const polyhedron = new THREE.Mesh(polyGeo, polyMat);
    polyhedron.position.set(4.5, 0.5, -2);
    scene.add(polyhedron);

    // ─── Second Micro Wireframe Polyhedron in opposite corner ──────────────
    const microGeo = new THREE.OctahedronGeometry(1.0, 0);
    const microMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.12,
    });
    const microPoly = new THREE.Mesh(microGeo, microMat);
    microPoly.position.set(-4.5, -0.5, -1.5);
    scene.add(microPoly);

    // ─── Mouse Parallax Interaction ─────────────────────────────────────────
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      if (
        e.clientY < rect.top ||
        e.clientY > rect.bottom ||
        e.clientX < rect.left ||
        e.clientX > rect.right
      ) {
        return;
      }
      targetX = ((e.clientX - rect.left) / rect.width - 0.5) * 1.5;
      targetY = ((e.clientY - rect.top) / rect.height - 0.5) * 1.0;
    };
    window.addEventListener('mousemove', onMouseMove, { passive: true });

    // ─── Resize Observer ────────────────────────────────────────────────────
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

    // ─── Visibility Throttle via IntersectionObserver ───────────────────────
    let isVisible = true;
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
      },
      { threshold: 0.05 }
    );
    observer.observe(container);

    // ─── Animation Loop ─────────────────────────────────────────────────────
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);

      if (!isVisible) return;

      const elapsed = clock.getElapsedTime();

      // Smooth camera parallax easing
      mouseX += (targetX - mouseX) * 0.05;
      mouseY += (targetY - mouseY) * 0.05;

      camera.position.x = mouseX * 0.8;
      camera.position.y = 1.2 - mouseY * 0.5;
      camera.lookAt(0, 0, 0);

      // Rotate subtle 3D polyhedrons
      polyhedron.rotation.x = elapsed * 0.12;
      polyhedron.rotation.y = elapsed * 0.16;

      microPoly.rotation.x = -elapsed * 0.15;
      microPoly.rotation.z = elapsed * 0.18;

      // Slow particle float
      particles.rotation.y = elapsed * 0.03;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', onMouseMove);
      resizeObserver.disconnect();
      observer.disconnect();
      disposeThreeScene(scene);
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-0 pointer-events-none overflow-hidden rounded-3xl opacity-50"
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
}
