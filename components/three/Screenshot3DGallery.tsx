'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { isWebGLAvailable, disposeThreeScene } from '@/lib/threeUtils';
import { Maximize2, ChevronLeft, ChevronRight, RotateCw, X, Layers3 } from 'lucide-react';

interface ScreenshotItem {
  id?: string | number;
  url?: string;
  imageUrl?: string;
  title?: string;
  subtitle?: string;
}

interface Screenshot3DGalleryProps {
  screenshots: ScreenshotItem[];
  appName: string;
  onScreenshotClick?: (index: number) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Util: Draw a screenshot image onto a CanvasTexture with cinematic border
// ─────────────────────────────────────────────────────────────────────────────
function buildScreenCanvas(
  imgSrc: string,
  label: string,
  onReady: (canvas: HTMLCanvasElement) => void
): void {
  const W = 512;
  const H = 910; // phone aspect ratio ≈ 9:16
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Background gradient
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#1a0a2e');
  bg.addColorStop(1, '#09090b');
  ctx.fillStyle = bg;
  ctx.roundRect(0, 0, W, H, 28);
  ctx.fill();

  const drawLabel = () => {
    // Bottom label bar
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(0, H - 70, W, 70);
    ctx.fillStyle = '#e4e4e7';
    ctx.font = 'bold 22px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label.length > 22 ? label.slice(0, 21) + '…' : label, W / 2, H - 38);
    // Glow line top
    const gl = ctx.createLinearGradient(0, 0, W, 0);
    gl.addColorStop(0, 'transparent');
    gl.addColorStop(0.3, '#a855f7');
    gl.addColorStop(0.7, '#06b6d4');
    gl.addColorStop(1, 'transparent');
    ctx.strokeStyle = gl;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 3);
    ctx.lineTo(W, 3);
    ctx.stroke();
    // Glow line bottom
    ctx.beginPath();
    ctx.moveTo(0, H - 3);
    ctx.lineTo(W, H - 3);
    ctx.stroke();
  };

  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    // Draw image centred/cropped
    const iAspect = img.width / img.height;
    const cAspect = W / (H - 70);
    let sx = 0, sy = 0, sw = img.width, sh = img.height;
    if (iAspect > cAspect) {
      sw = img.height * cAspect;
      sx = (img.width - sw) / 2;
    } else {
      sh = img.width / cAspect;
      sy = (img.height - sh) / 2;
    }
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, W, H - 70);
    drawLabel();
    onReady(canvas);
  };
  img.onerror = () => {
    // Fallback: gradient placeholder
    const pg = ctx.createRadialGradient(W / 2, H / 2, 10, W / 2, H / 2, W * 0.7);
    pg.addColorStop(0, '#7c3aed44');
    pg.addColorStop(1, 'transparent');
    ctx.fillStyle = pg;
    ctx.fillRect(0, 0, W, H - 70);
    // Icon
    ctx.fillStyle = '#a855f7';
    ctx.font = '80px serif';
    ctx.textAlign = 'center';
    ctx.fillText('📱', W / 2, H / 2 - 30);
    ctx.fillStyle = '#71717a';
    ctx.font = '20px Inter, sans-serif';
    ctx.fillText('No Preview', W / 2, H / 2 + 40);
    drawLabel();
    onReady(canvas);
  };
  img.src = imgSrc || '';
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
export function Screenshot3DGallery({ screenshots, appName, onScreenshotClick }: Screenshot3DGalleryProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasWebGL, setHasWebGL] = useState(true);
  const [focusedIdx, setFocusedIdx] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  // Stable ref to focused index for animation loop
  const focusedIdxRef = useRef(0);
  const panelMeshesRef = useRef<THREE.Mesh[]>([]);
  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    animId: number;
  } | null>(null);

  const count = screenshots.length;

  const goTo = useCallback((idx: number) => {
    const next = (idx + count) % count;
    setFocusedIdx(next);
    focusedIdxRef.current = next;
  }, [count]);

  useEffect(() => {
    if (!isWebGLAvailable()) { setHasWebGL(false); return; }
    if (!mountRef.current || !canvasRef.current || count === 0) return;

    const container = mountRef.current;
    const canvas = canvasRef.current;
    const W = container.clientWidth || 800;
    const H = Math.min(container.clientWidth * 0.72, 560);

    // ── Scene ────────────────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x070714, 0.045);

    const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 100);
    camera.position.set(0, 0.5, 7.5);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.4;

    // ── Lighting ─────────────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0x0d0d1a, 3));
    const purpleSpot = new THREE.PointLight(0xa855f7, 120, 30);
    purpleSpot.position.set(-4, 4, 5);
    scene.add(purpleSpot);
    const cyanSpot = new THREE.PointLight(0x06b6d4, 90, 30);
    cyanSpot.position.set(4, -3, 6);
    scene.add(cyanSpot);
    const whiteKey = new THREE.DirectionalLight(0xffffff, 2);
    whiteKey.position.set(0, 6, 8);
    scene.add(whiteKey);

    // ── Floor grid (neon) ────────────────────────────────────────────────────
    const gridGeo = new THREE.PlaneGeometry(30, 20, 30, 20);
    const gridMat = new THREE.MeshBasicMaterial({
      color: 0x8b5cf6,
      wireframe: true,
      transparent: true,
      opacity: 0.08,
    });
    const grid = new THREE.Mesh(gridGeo, gridMat);
    grid.rotation.x = -Math.PI / 2;
    grid.position.y = -3.5;
    scene.add(grid);

    // ── Floating dust particles ──────────────────────────────────────────────
    const dustGeo = new THREE.BufferGeometry();
    const dustCount = 220;
    const dustPos = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      dustPos[i * 3] = (Math.random() - 0.5) * 20;
      dustPos[i * 3 + 1] = (Math.random() - 0.5) * 10;
      dustPos[i * 3 + 2] = (Math.random() - 0.5) * 12 - 2;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    const dustMat = new THREE.PointsMaterial({ color: 0xa855f7, size: 0.04, transparent: true, opacity: 0.55 });
    scene.add(new THREE.Points(dustGeo, dustMat));

    // ── Build phone panel meshes ─────────────────────────────────────────────
    const panels: THREE.Mesh[] = [];
    const PANEL_W = 1.6;
    const PANEL_H = 2.84; // 9:16 ish

    // Emissive frame border (thin box behind each panel)
    function makeFrame(w: number, h: number): THREE.Mesh {
      const geo = new THREE.BoxGeometry(w + 0.05, h + 0.05, 0.025);
      const mat = new THREE.MeshStandardMaterial({
        color: 0x0d0d1a,
        emissive: 0xa855f7,
        emissiveIntensity: 1.2,
        transparent: true,
        opacity: 0.85,
      });
      return new THREE.Mesh(geo, mat);
    }

    const textures: THREE.CanvasTexture[] = [];

    for (let i = 0; i < count; i++) {
      const ss = screenshots[i];
      const src = ss.imageUrl || ss.url || '';
      const label = ss.title || `Screenshot ${i + 1}`;

      const geo = new THREE.PlaneGeometry(PANEL_W, PANEL_H);
      const mat = new THREE.MeshStandardMaterial({
        color: 0x555566,
        roughness: 0.3,
        metalness: 0.1,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.userData.index = i;

      // Frame behind panel
      const frame = makeFrame(PANEL_W, PANEL_H);
      mesh.add(frame);
      frame.position.z = -0.015;

      scene.add(mesh);
      panels.push(mesh);

      // Load canvas texture async
      buildScreenCanvas(src, label, (c) => {
        const tex = new THREE.CanvasTexture(c);
        tex.colorSpace = THREE.SRGBColorSpace;
        textures.push(tex);
        (mesh.material as THREE.MeshStandardMaterial).map = tex;
        (mesh.material as THREE.MeshStandardMaterial).color.set(0xffffff);
        (mesh.material as THREE.MeshStandardMaterial).needsUpdate = true;
        setIsLoaded(true);
      });
    }

    panelMeshesRef.current = panels;

    // ── Raycaster for click ──────────────────────────────────────────────────
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const onCanvasClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(panels);
      if (hits.length > 0) {
        const idx: number = hits[0].object.userData.index;
        goTo(idx);
        if (onScreenshotClick) onScreenshotClick(idx);
      }
    };
    canvas.addEventListener('click', onCanvasClick);

    // ── Resize ───────────────────────────────────────────────────────────────
    const onResize = () => {
      if (!container) return;
      const nW = container.clientWidth;
      const nH = Math.min(nW * 0.72, 560);
      camera.aspect = nW / nH;
      camera.updateProjectionMatrix();
      renderer.setSize(nW, nH);
    };
    window.addEventListener('resize', onResize);

    // ── Render / Animation ───────────────────────────────────────────────────
    let animId = 0;
    const clock = new THREE.Clock();

    // Lerp helper
    function lerpAngle(a: number, b: number, t: number) {
      let diff = b - a;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      return a + diff * t;
    }

    const targetPositions: { x: number; y: number; z: number; ry: number; scale: number }[] = panels.map(() => ({
      x: 0, y: 0, z: 0, ry: 0, scale: 1,
    }));

    function computeLayout(focusI: number) {
      const n = panels.length;
      const SPREAD_ANGLE = Math.PI * 0.18; // angle between adjacent cards
      const RADIUS = 5.5;

      for (let i = 0; i < n; i++) {
        const offset = i - focusI;
        // Wrap offset
        let wrapped = offset;
        if (n > 3) {
          if (wrapped > n / 2) wrapped -= n;
          if (wrapped < -n / 2) wrapped += n;
        }
        const angle = wrapped * SPREAD_ANGLE;
        const x = Math.sin(angle) * RADIUS;
        const z = Math.cos(angle) * RADIUS - RADIUS + 1.2;
        const ry = -angle * 0.5;
        const isFocus = wrapped === 0;
        const absW = Math.abs(wrapped);
        const scale = isFocus ? 1.18 : Math.max(0.62, 1 - absW * 0.15);
        const y = isFocus ? 0 : -absW * 0.18;
        targetPositions[i] = { x, y, z, ry, scale };
      }
    }

    function animate() {
      animId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      computeLayout(focusedIdxRef.current);

      panels.forEach((mesh, i) => {
        const tgt = targetPositions[i];
        mesh.position.x = THREE.MathUtils.lerp(mesh.position.x, tgt.x, 0.08);
        mesh.position.y = THREE.MathUtils.lerp(mesh.position.y, tgt.y, 0.08);
        mesh.position.z = THREE.MathUtils.lerp(mesh.position.z, tgt.z, 0.08);
        mesh.rotation.y = lerpAngle(mesh.rotation.y, tgt.ry, 0.08);
        mesh.scale.setScalar(THREE.MathUtils.lerp(mesh.scale.x, tgt.scale, 0.1));

        // Emissive pulse on focus panel
        const frame = mesh.children[0] as THREE.Mesh;
        const frameMat = frame.material as THREE.MeshStandardMaterial;
        const isFocus = i === focusedIdxRef.current;
        const targetEmissive = isFocus ? 0xa855f7 : 0x2d1b69;
        frameMat.emissive.lerp(new THREE.Color(targetEmissive), 0.08);
        frameMat.emissiveIntensity = isFocus
          ? 1.5 + Math.sin(t * 2.5) * 0.4
          : 0.5;
      });

      // Subtle camera breathe
      camera.position.y = 0.5 + Math.sin(t * 0.4) * 0.06;
      camera.position.x = Math.sin(t * 0.25) * 0.12;
      camera.lookAt(0, 0.2, 0);

      // Particle drift
      const pos = dustGeo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < dustCount; i++) {
        pos.array[i * 3 + 1] = (pos.array[i * 3 + 1] as number) + 0.003;
        if ((pos.array[i * 3 + 1] as number) > 5) pos.setY(i, -5);
      }
      pos.needsUpdate = true;

      renderer.render(scene, camera);
    }
    animate();

    sceneRef.current = { renderer, scene, camera, animId };

    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener('click', onCanvasClick);
      window.removeEventListener('resize', onResize);
      textures.forEach((t) => t.dispose());
      disposeThreeScene(scene, renderer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);

  // Fallback when WebGL is unavailable
  if (!hasWebGL || count === 0) return null;

  const current = screenshots[focusedIdx];
  const label = current?.title || `Screenshot ${focusedIdx + 1}`;

  return (
    <div className="relative w-full select-none">
      {/* Canvas container */}
      <div
        ref={mountRef}
        className="relative w-full overflow-hidden rounded-2xl"
        style={{ background: 'radial-gradient(ellipse at 50% 30%, #1a0a2e 0%, #07071480 60%, transparent 100%)' }}
      >
        <canvas ref={canvasRef} className="w-full block rounded-2xl" />

        {/* Loading shimmer */}
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-zinc-950/80">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
              <span className="text-xs font-bold text-purple-400 tracking-widest">LOADING 3D GALLERY</span>
            </div>
          </div>
        )}

        {/* Gradient vignette sides */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-zinc-950 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-zinc-950 to-transparent" />

        {/* 3D badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-950/80 border border-purple-700/60 backdrop-blur-sm">
          <Layers3 className="w-3 h-3 text-purple-400" />
          <span className="text-[10px] font-black text-purple-300 tracking-widest uppercase">3D Gallery</span>
        </div>

        {/* Screenshot counter */}
        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-zinc-950/80 border border-zinc-700/60 backdrop-blur-sm">
          <span className="text-[10px] font-bold text-zinc-400">{focusedIdx + 1} / {count}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mt-4 px-1">
        {/* Prev */}
        <button
          type="button"
          onClick={() => goTo(focusedIdx - 1)}
          className="p-2.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700/60 text-zinc-300 hover:text-white transition-all cursor-pointer"
          aria-label="Previous screenshot"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Label + dot indicators */}
        <div className="flex-1 flex flex-col items-center gap-2 mx-4">
          <span className="text-sm font-bold text-zinc-200 truncate max-w-xs">{label}</span>
          <div className="flex items-center gap-1.5">
            {screenshots.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goTo(i)}
                className="cursor-pointer transition-all"
                aria-label={`Go to screenshot ${i + 1}`}
              >
                <div
                  className="rounded-full transition-all duration-300"
                  style={{
                    width: i === focusedIdx ? 20 : 8,
                    height: 8,
                    background: i === focusedIdx
                      ? 'linear-gradient(90deg,#a855f7,#06b6d4)'
                      : '#3f3f46',
                  }}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Next */}
        <button
          type="button"
          onClick={() => goTo(focusedIdx + 1)}
          className="p-2.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700/60 text-zinc-300 hover:text-white transition-all cursor-pointer"
          aria-label="Next screenshot"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Expand hint */}
      <p className="text-center text-[11px] text-zinc-600 mt-2">
        Click any panel to focus · Use arrows to navigate
      </p>
    </div>
  );
}
