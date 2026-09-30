'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { isWebGLAvailable, disposeThreeScene } from '@/lib/threeUtils';

/**
 * Ultra-luxury, high-performance ambient 3D background.
 * Provides subtle perspective depth, gentle particle drift, and soft cyber grid
 * without visually clashing with page typography or content cards.
 */
export function Global3DBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isWebGLAvailable()) return;
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    // ─── Scene Setup ────────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x09090b, 0.035);

    const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 2.5, 12);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: true,
      powerPreference: 'low-power',
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));

    // ─── Elegant Infinite Perspective Floor Grid ────────────────────────────
    const gridHelper = new THREE.GridHelper(60, 48, 0x8b5cf6, 0x27272a);
    gridHelper.position.y = -3.2;
    (gridHelper.material as THREE.Material).transparent = true;
    (gridHelper.material as THREE.Material).opacity = 0.08;
    scene.add(gridHelper);

    // ─── Ambient Stardust Points ────────────────────────────────────────────
    const STAR_COUNT = 320;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(STAR_COUNT * 3);
    const starColors = new Float32Array(STAR_COUNT * 3);

    const color1 = new THREE.Color(0xa855f7); // Purple
    const color2 = new THREE.Color(0x06b6d4); // Cyan
    const color3 = new THREE.Color(0x71717a); // Muted silver

    for (let i = 0; i < STAR_COUNT; i++) {
      starPos[i * 3] = (Math.random() - 0.5) * 50;
      starPos[i * 3 + 1] = (Math.random() - 0.5) * 25;
      starPos[i * 3 + 2] = (Math.random() - 0.5) * 30;

      const c = i % 3 === 0 ? color1 : i % 3 === 1 ? color2 : color3;
      starColors[i * 3] = c.r;
      starColors[i * 3 + 1] = c.g;
      starColors[i * 3 + 2] = c.b;
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMat = new THREE.PointsMaterial({
      size: 0.04,
      vertexColors: true,
      transparent: true,
      opacity: 0.45,
    });
    const starPoints = new THREE.Points(starGeo, starMat);
    scene.add(starPoints);

    // ─── Mouse Parallax ──────────────────────────────────────────────────────
    let mouseX = 0;
    let mouseY = 0;
    const onMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', onMouseMove, { passive: true });

    // ─── Resize Handler ──────────────────────────────────────────────────────
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize, { passive: true });

    // ─── IntersectionObserver to throttle when offscreen ────────────────────
    let isVisible = true;
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
      },
      { threshold: 0 }
    );
    observer.observe(container);

    // ─── Render Loop ────────────────────────────────────────────────────────
    let animId = 0;
    const clock = new THREE.Clock();

    function animate() {
      animId = requestAnimationFrame(animate);
      if (!isVisible) return;

      const elapsed = clock.getElapsedTime();

      // Subtle forward drift on grid
      gridHelper.position.z = (elapsed * 0.4) % 1.25;

      // Gentle starfield drift
      starPoints.rotation.y = elapsed * 0.015;

      // Smooth camera parallax
      camera.position.x += (mouseX * 0.8 - camera.position.x) * 0.02;
      camera.position.y += (-mouseY * 0.5 + 2.5 - camera.position.y) * 0.02;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    }
    animate();

    return () => {
      cancelAnimationFrame(animId);
      observer.disconnect();
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      disposeThreeScene(scene, renderer);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="fixed inset-0 -z-10 pointer-events-none overflow-hidden"
    >
      <canvas ref={canvasRef} className="w-full h-full" />
      {/* Soft Vignette Overlay so text remains 100% readable */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 90% 70% at 50% 0%, transparent 40%, #09090bcc 90%)',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
