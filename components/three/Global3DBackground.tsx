'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { isWebGLAvailable, disposeThreeScene } from '@/lib/threeUtils';

/**
 * High-performance, full-width Three.js 3D cyber grid & constellation background.
 * Automatically throttles when scrolled out of view and disposes resources on unmount.
 */
export function Global3DBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isWebGLAvailable()) return;

    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x09090b, 0.05);

    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 3, 10);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false, // background doesn't need heavy MSAA
      alpha: true,
      powerPreference: 'low-power',
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));

    // 1. Perspective 3D Cyber Floor Grid
    const gridHelper = new THREE.GridHelper(60, 40, 0x8b5cf6, 0x27272a);
    gridHelper.position.y = -2.5;
    (gridHelper.material as THREE.Material).transparent = true;
    (gridHelper.material as THREE.Material).opacity = 0.25;
    scene.add(gridHelper);

    // 2. 3D Floating Geometry Nodes (Icosahedrons & Octahedrons)
    const floatingGroup = new THREE.Group();
    const geomList = [
      new THREE.OctahedronGeometry(0.5, 0),
      new THREE.IcosahedronGeometry(0.4, 0),
      new THREE.TetrahedronGeometry(0.45, 0),
    ];
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0xa855f7,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const cyanWireMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      wireframe: true,
      transparent: true,
      opacity: 0.3,
    });

    const nodeCount = 18;
    const nodes: Array<{ mesh: THREE.Mesh; rotSpeed: { x: number; y: number }; initialY: number; speed: number }> = [];

    for (let i = 0; i < nodeCount; i++) {
      const geom = geomList[i % geomList.length];
      const mat = i % 2 === 0 ? wireMat : cyanWireMat;
      const mesh = new THREE.Mesh(geom, mat);

      const x = (Math.random() - 0.5) * 36;
      const y = Math.random() * 8 - 1;
      const z = (Math.random() - 0.5) * 24 - 4;
      mesh.position.set(x, y, z);

      floatingGroup.add(mesh);
      nodes.push({
        mesh,
        rotSpeed: { x: (Math.random() - 0.5) * 0.02, y: (Math.random() - 0.5) * 0.02 },
        initialY: y,
        speed: 0.5 + Math.random() * 1.0,
      });
    }
    scene.add(floatingGroup);

    // 3. Stardust Particle Field
    const particleCount = 200;
    const particleGeom = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 40;
      positions[i + 1] = Math.random() * 14 - 3;
      positions[i + 2] = (Math.random() - 0.5) * 30;
    }
    particleGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      size: 0.05,
      color: 0xc084fc,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeom, particleMat);
    scene.add(particles);

    // Mouse Parallax
    let targetMouseX = 0;
    let targetMouseY = 0;
    let currentMouseX = 0;
    let currentMouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = (e.clientX / window.innerWidth) * 2 - 1;
      targetMouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // Window Resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Viewport Visibility Observer (pause when not visible to save 100% idle GPU)
    let isVisible = true;
    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
    });
    observer.observe(container);

    // Animation Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (!isVisible) return;

      const elapsed = clock.getElapsedTime();

      // Smooth mouse follow
      currentMouseX += (targetMouseX - currentMouseX) * 0.04;
      currentMouseY += (targetMouseY - currentMouseY) * 0.04;

      camera.position.x = currentMouseX * 1.5;
      camera.position.y = 3 + currentMouseY * 0.8;
      camera.lookAt(0, 0, 0);

      // Endless grid forward flow effect
      gridHelper.position.z = (elapsed * 1.2) % 2;

      // Animate floating geometric wireframes
      nodes.forEach((n) => {
        n.mesh.rotation.x += n.rotSpeed.x;
        n.mesh.rotation.y += n.rotSpeed.y;
        n.mesh.position.y = n.initialY + Math.sin(elapsed * n.speed) * 0.35;
      });

      // Slowly rotate particle field
      particles.rotation.y = elapsed * 0.015;

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
      disposeThreeScene(scene);
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none -z-20 overflow-hidden"
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="w-full h-full opacity-60" />
      {/* Vignette Gradients */}
      <div className="absolute inset-0 bg-radial from-transparent via-zinc-950/40 to-zinc-950" />
    </div>
  );
}
