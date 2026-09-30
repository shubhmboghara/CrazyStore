'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { isWebGLAvailable, disposeThreeScene } from '@/lib/threeUtils';

/**
 * High-performance, full-width Three.js 3D cyber background.
 * Features:
 *  - Hexagonal neon grid floor (procedural hex grid via LineSegments)
 *  - 24 floating wireframe polyhedra with unique rotation axes
 *  - Dual-helix DNA-style particle strand
 *  - 600-point stardust field with aurora color drift
 *  - Mouse parallax for depth
 *  - IntersectionObserver: pauses GPU when off-screen
 *  - Full GPU resource cleanup on unmount
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
    scene.fog = new THREE.FogExp2(0x07070f, 0.04);

    const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 200);
    camera.position.set(0, 3.5, 14);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: 'low-power' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    // ─── Hex Grid Floor ──────────────────────────────────────────────────────
    // Build a hexagonal grid manually as LineSegments
    function buildHexGrid(cols: number, rows: number, size: number): THREE.LineSegments {
      const positions: number[] = [];
      const HEX_W = size * 2;
      const HEX_H = Math.sqrt(3) * size;

      for (let row = -rows; row <= rows; row++) {
        for (let col = -cols; col <= cols; col++) {
          const cx = col * HEX_W * 0.75 + (row % 2 === 0 ? 0 : HEX_W * 0.375);
          const cz = row * HEX_H * 0.5;

          for (let v = 0; v < 6; v++) {
            const a0 = (Math.PI / 3) * v;
            const a1 = (Math.PI / 3) * (v + 1);
            positions.push(
              cx + size * Math.cos(a0), 0, cz + size * Math.sin(a0),
              cx + size * Math.cos(a1), 0, cz + size * Math.sin(a1)
            );
          }
        }
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      const mat = new THREE.LineBasicMaterial({ color: 0x7c3aed, transparent: true, opacity: 0.18 });
      const ls = new THREE.LineSegments(geo, mat);
      ls.rotation.x = -Math.PI / 2;
      ls.position.y = -3.5;
      return ls;
    }

    const hexGrid = buildHexGrid(12, 8, 1.1);
    scene.add(hexGrid);

    // Secondary finer cyan inner hex grid (smaller, brighter)
    const hexGridInner = buildHexGrid(6, 4, 0.5);
    (hexGridInner.material as THREE.LineBasicMaterial).color.set(0x06b6d4);
    (hexGridInner.material as THREE.LineBasicMaterial).opacity = 0.10;
    hexGridInner.position.y = -3.49;
    scene.add(hexGridInner);

    // ─── Floating Wireframe Polyhedra ────────────────────────────────────────
    const geomPool = [
      new THREE.IcosahedronGeometry(0.55, 0),
      new THREE.OctahedronGeometry(0.5, 0),
      new THREE.TetrahedronGeometry(0.52, 0),
      new THREE.DodecahedronGeometry(0.4, 0),
      new THREE.TorusGeometry(0.38, 0.12, 6, 8),
    ];
    const paletteMats = [
      new THREE.MeshBasicMaterial({ color: 0xa855f7, wireframe: true, transparent: true, opacity: 0.4 }),
      new THREE.MeshBasicMaterial({ color: 0x06b6d4, wireframe: true, transparent: true, opacity: 0.35 }),
      new THREE.MeshBasicMaterial({ color: 0xec4899, wireframe: true, transparent: true, opacity: 0.3 }),
      new THREE.MeshBasicMaterial({ color: 0x8b5cf6, wireframe: true, transparent: true, opacity: 0.38 }),
    ];

    const NODE_COUNT = 24;
    const nodes: Array<{
      mesh: THREE.Mesh;
      rotAxis: THREE.Vector3;
      rotSpeed: number;
      floatSpeed: number;
      floatAmp: number;
      baseY: number;
    }> = [];

    for (let i = 0; i < NODE_COUNT; i++) {
      const g = geomPool[i % geomPool.length];
      const m = paletteMats[i % paletteMats.length];
      const mesh = new THREE.Mesh(g, m);

      const angle = (i / NODE_COUNT) * Math.PI * 2;
      const radius = 8 + (i % 4) * 3;
      mesh.position.set(
        Math.cos(angle) * radius,
        Math.random() * 7 - 1.5,
        Math.sin(angle) * radius * 0.6 - 5
      );
      mesh.scale.setScalar(0.6 + Math.random() * 0.9);

      nodes.push({
        mesh,
        rotAxis: new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize(),
        rotSpeed: 0.004 + Math.random() * 0.01,
        floatSpeed: 0.4 + Math.random() * 0.6,
        floatAmp: 0.3 + Math.random() * 0.6,
        baseY: mesh.position.y,
      });
      scene.add(mesh);
    }

    // ─── DNA Double Helix Particle Strand ───────────────────────────────────
    const DNA_POINTS = 180;
    const helixGeo1 = new THREE.BufferGeometry();
    const helixGeo2 = new THREE.BufferGeometry();
    const h1Pos = new Float32Array(DNA_POINTS * 3);
    const h2Pos = new Float32Array(DNA_POINTS * 3);

    for (let i = 0; i < DNA_POINTS; i++) {
      const t = (i / DNA_POINTS) * Math.PI * 8;
      const x = Math.cos(t) * 1.6;
      const y = (i / DNA_POINTS) * 14 - 7;
      const z = Math.sin(t) * 1.6 - 8;
      h1Pos[i * 3] = x;
      h1Pos[i * 3 + 1] = y;
      h1Pos[i * 3 + 2] = z;
      // second strand: offset by π
      h2Pos[i * 3] = Math.cos(t + Math.PI) * 1.6;
      h2Pos[i * 3 + 1] = y;
      h2Pos[i * 3 + 2] = Math.sin(t + Math.PI) * 1.6 - 8;
    }
    helixGeo1.setAttribute('position', new THREE.BufferAttribute(h1Pos, 3));
    helixGeo2.setAttribute('position', new THREE.BufferAttribute(h2Pos, 3));

    const helixMat1 = new THREE.PointsMaterial({ color: 0xa855f7, size: 0.07, transparent: true, opacity: 0.75 });
    const helixMat2 = new THREE.PointsMaterial({ color: 0x06b6d4, size: 0.07, transparent: true, opacity: 0.75 });
    const helixPoints1 = new THREE.Points(helixGeo1, helixMat1);
    const helixPoints2 = new THREE.Points(helixGeo2, helixMat2);
    scene.add(helixPoints1);
    scene.add(helixPoints2);

    // ─── Stardust / Aurora Particles ────────────────────────────────────────
    const STAR_COUNT = 600;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(STAR_COUNT * 3);
    const starColors = new Float32Array(STAR_COUNT * 3);
    const STAR_COLORS = [
      new THREE.Color(0xa855f7),
      new THREE.Color(0x06b6d4),
      new THREE.Color(0xec4899),
      new THREE.Color(0xffffff),
    ];

    for (let i = 0; i < STAR_COUNT; i++) {
      starPos[i * 3] = (Math.random() - 0.5) * 60;
      starPos[i * 3 + 1] = (Math.random() - 0.5) * 30;
      starPos[i * 3 + 2] = (Math.random() - 0.5) * 40 - 5;
      const c = STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)];
      starColors[i * 3] = c.r;
      starColors[i * 3 + 1] = c.g;
      starColors[i * 3 + 2] = c.b;
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
    const starMat = new THREE.PointsMaterial({ size: 0.045, vertexColors: true, transparent: true, opacity: 0.6 });
    scene.add(new THREE.Points(starGeo, starMat));

    // ─── Mouse Parallax ──────────────────────────────────────────────────────
    let mouseX = 0, mouseY = 0;
    const onMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', onMouseMove, { passive: true });

    // ─── Resize ───────────────────────────────────────────────────────────────
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize, { passive: true });

    // ─── IntersectionObserver (pause off-screen) ─────────────────────────────
    let visible = true;
    const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }, { threshold: 0 });
    io.observe(container);

    // ─── Animation Loop ───────────────────────────────────────────────────────
    const clock = new THREE.Clock();
    let animId = 0;
    let frame = 0;

    function animate() {
      animId = requestAnimationFrame(animate);
      if (!visible) return;
      frame++;

      const t = clock.getElapsedTime();

      // Polyhedra: rotate on unique axes + float
      nodes.forEach(({ mesh, rotAxis, rotSpeed, floatSpeed, floatAmp, baseY }) => {
        mesh.rotateOnAxis(rotAxis, rotSpeed);
        mesh.position.y = baseY + Math.sin(t * floatSpeed) * floatAmp;
      });

      // DNA helix rotation
      helixPoints1.rotation.y = t * 0.12;
      helixPoints2.rotation.y = t * 0.12;

      // Hex grid slow drift
      hexGrid.rotation.z = Math.sin(t * 0.05) * 0.03;

      // Star drift upward (every 2 frames to save CPU)
      if (frame % 2 === 0) {
        const sPos = starGeo.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < STAR_COUNT; i++) {
          sPos.array[i * 3 + 1] = (sPos.array[i * 3 + 1] as number) + 0.008;
          if ((sPos.array[i * 3 + 1] as number) > 15) sPos.setY(i, -15);
        }
        sPos.needsUpdate = true;
      }

      // Camera parallax
      camera.position.x += (mouseX * 1.5 - camera.position.x) * 0.025;
      camera.position.y += (-mouseY * 0.8 + 3.5 - camera.position.y) * 0.025;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    }
    animate();

    return () => {
      cancelAnimationFrame(animId);
      io.disconnect();
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      geomPool.forEach((g) => g.dispose());
      paletteMats.forEach((m) => m.dispose());
      disposeThreeScene(scene, renderer);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden
      className="fixed inset-0 -z-10 pointer-events-none overflow-hidden"
    >
      <canvas ref={canvasRef} className="w-full h-full" />
      {/* Radial vignette overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 0%, transparent 40%, #07070fcc 100%)',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
