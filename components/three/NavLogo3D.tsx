'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { isWebGLAvailable, disposeThreeScene } from '@/lib/threeUtils';

interface NavLogo3DProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Draws the high-res CrazyStore Favicon (OLED phone + electric lightning bolt)
 * onto a 2D canvas to be mapped as a Three.js CanvasTexture on the 3D phone screen.
 */
function drawFaviconCanvas(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);

  // 1. Background gradient (CrazyStore Purple to Indigo)
  const bgGrad = ctx.createLinearGradient(0, 0, w, h);
  bgGrad.addColorStop(0, '#8b5cf6');
  bgGrad.addColorStop(0.5, '#6366f1');
  bgGrad.addColorStop(1, '#4338ca');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  // 2. Center Phone frame with dark OLED display
  const phoneX = w * 0.14;
  const phoneY = h * 0.08;
  const phoneW = w * 0.72;
  const phoneH = h * 0.84;
  const r = 28;

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(phoneX, phoneY, phoneW, phoneH, r);
  ctx.fillStyle = '#09090b';
  ctx.fill();
  ctx.lineWidth = 8;
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();

  // Top camera notch
  ctx.fillStyle = '#71717a';
  ctx.beginPath();
  ctx.roundRect(w * 0.42, phoneY + 16, w * 0.16, 6, 3);
  ctx.fill();

  // 3. Electric Lightning Bolt (Favicon Symbol)
  const boltGrad = ctx.createLinearGradient(w * 0.3, h * 0.25, w * 0.7, h * 0.75);
  boltGrad.addColorStop(0, '#ffffff');
  boltGrad.addColorStop(1, '#e9d5ff');
  ctx.fillStyle = boltGrad;

  // Glow shadow for the lightning bolt
  ctx.shadowColor = '#c084fc';
  ctx.shadowBlur = 18;

  ctx.beginPath();
  ctx.moveTo(w * 0.58, h * 0.26);
  ctx.lineTo(w * 0.34, h * 0.52);
  ctx.lineTo(w * 0.50, h * 0.52);
  ctx.lineTo(w * 0.42, h * 0.74);
  ctx.lineTo(w * 0.66, h * 0.46);
  ctx.lineTo(w * 0.50, h * 0.46);
  ctx.closePath();
  ctx.fill();

  // 4. Bottom home indicator
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#71717a';
  ctx.beginPath();
  ctx.roundRect(w * 0.38, phoneY + phoneH - 20, w * 0.24, 6, 3);
  ctx.fill();

  ctx.restore();
}

export function NavLogo3D({ size = 'md', className = '' }: NavLogo3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasWebGL, setHasWebGL] = useState<boolean>(true);

  // Interaction & Scroll Physics refs
  const isHoveredRef = useRef<boolean>(false);
  const scrollVelocityRef = useRef<number>(0);
  const lastScrollYRef = useRef<number>(0);
  const clickSpinRef = useRef<number>(0);

  // Size mapping
  const sizeConfig = {
    sm: { container: 'w-8 h-8 rounded-lg', px: 32 },
    md: { container: 'w-10 h-10 rounded-xl', px: 42 },
    lg: { container: 'w-12 h-12 rounded-2xl', px: 52 },
  }[size] || { container: 'w-10 h-10 rounded-xl', px: 42 };

  useEffect(() => {
    if (!isWebGLAvailable()) {
      setHasWebGL(false);
      return;
    }

    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const px = sizeConfig.px;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 0.2, 3.8);

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'low-power',
    });
    renderer.setSize(px, px);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    // 3. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const purpleLight = new THREE.PointLight(0xa855f7, 4.5, 10);
    purpleLight.position.set(2, 3, 3);
    scene.add(purpleLight);

    const cyanLight = new THREE.PointLight(0x06b6d4, 3.5, 10);
    cyanLight.position.set(-2, -2, 2.5);
    scene.add(cyanLight);

    // 4. Build 3D Smartphone with Favicon Screen
    const rootGroup = new THREE.Group();

    // Chassis Body (Titanium Space Black)
    const bodyW = 1.25;
    const bodyH = 2.15;
    const bodyD = 0.18;

    const bodyGeom = new THREE.BoxGeometry(bodyW, bodyH, bodyD);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      metalness: 0.9,
      roughness: 0.2,
    });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    rootGroup.add(body);

    // Cyber Bezel Rim
    const bezelGeom = new THREE.BoxGeometry(bodyW + 0.03, bodyH + 0.03, bodyD * 0.9);
    const bezelMat = new THREE.MeshStandardMaterial({
      color: 0x8b5cf6,
      emissive: 0x7c3aed,
      emissiveIntensity: 0.6,
      roughness: 0.2,
      metalness: 0.8,
    });
    const bezel = new THREE.Mesh(bezelGeom, bezelMat);
    rootGroup.add(bezel);

    // Front Screen with Favicon Lightning Emblem CanvasTexture
    const screenCanvas = document.createElement('canvas');
    screenCanvas.width = 256;
    screenCanvas.height = 512;
    drawFaviconCanvas(screenCanvas);

    const screenTexture = new THREE.CanvasTexture(screenCanvas);
    screenTexture.colorSpace = THREE.SRGBColorSpace;
    screenTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();

    const screenGeom = new THREE.PlaneGeometry(bodyW - 0.08, bodyH - 0.08);
    const screenMat = new THREE.MeshStandardMaterial({
      map: screenTexture,
      emissiveMap: screenTexture,
      emissiveIntensity: 0.55,
      roughness: 0.12,
      metalness: 0.1,
    });
    const screen = new THREE.Mesh(screenGeom, screenMat);
    screen.position.z = bodyD / 2 + 0.005;
    rootGroup.add(screen);

    // Clearcoat Screen Glass
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.15,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
    });
    const glass = new THREE.Mesh(
      new THREE.PlaneGeometry(bodyW - 0.05, bodyH - 0.05),
      glassMat
    );
    glass.position.z = bodyD / 2 + 0.008;
    rootGroup.add(glass);

    // Glowing Neon Orbit Ring around the 3D phone
    const ringGeom = new THREE.TorusGeometry(1.42, 0.032, 12, 40);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0xa855f7,
      emissive: 0x38bdf8,
      emissiveIntensity: 1.8,
      roughness: 0.15,
      metalness: 0.8,
    });
    const ring = new THREE.Mesh(ringGeom, ringMat);
    ring.rotation.x = Math.PI / 2.6;
    rootGroup.add(ring);

    // Micro Stardust Particles
    const dustCount = 18;
    const dustGeo = new THREE.BufferGeometry();
    const dustPos = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      dustPos[i * 3] = (Math.random() - 0.5) * 3.2;
      dustPos[i * 3 + 1] = (Math.random() - 0.5) * 3.2;
      dustPos[i * 3 + 2] = (Math.random() - 0.5) * 2.5;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    const dustMat = new THREE.PointsMaterial({
      size: 0.05,
      color: 0xc084fc,
      transparent: true,
      opacity: 0.6,
    });
    const dust = new THREE.Points(dustGeo, dustMat);
    rootGroup.add(dust);

    // Initial position & tilt
    rootGroup.rotation.x = 0.25;
    rootGroup.rotation.y = -0.35;
    scene.add(rootGroup);

    // 5. Scroll Interaction: Scroll drives 3D logo spin & tilt!
    lastScrollYRef.current = window.scrollY || 0;

    const handleScroll = () => {
      const currentY = window.scrollY || 0;
      const delta = currentY - lastScrollYRef.current;
      lastScrollYRef.current = currentY;

      // Scroll speed adds rotational velocity with clamped momentum
      const impulse = THREE.MathUtils.clamp(delta * 0.004, -0.15, 0.15);
      scrollVelocityRef.current += impulse;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    // 6. Hover & Click events
    const onMouseEnter = () => {
      isHoveredRef.current = true;
    };
    const onMouseLeave = () => {
      isHoveredRef.current = false;
    };
    const onClick = () => {
      // Energetic 360° spin flip
      clickSpinRef.current += Math.PI * 2;
    };

    container.addEventListener('mouseenter', onMouseEnter);
    container.addEventListener('mouseleave', onMouseLeave);
    container.addEventListener('click', onClick);

    // 7. Animation Loop with Smooth Physics Damping
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);

      const elapsed = clock.getElapsedTime();

      // Base idle speed
      let baseSpeed = isHoveredRef.current ? 0.05 : 0.012;

      // Click spin damping
      if (clickSpinRef.current > 0.01) {
        const step = clickSpinRef.current * 0.12;
        rootGroup.rotation.y += step;
        clickSpinRef.current -= step;
      }

      // Scroll velocity physics damping
      rootGroup.rotation.y += baseSpeed + scrollVelocityRef.current;
      scrollVelocityRef.current = THREE.MathUtils.lerp(scrollVelocityRef.current, 0, 0.06);

      // Subtle dynamic X-tilt reactive to scroll velocity
      const targetTiltX = 0.25 + THREE.MathUtils.clamp(scrollVelocityRef.current * 1.5, -0.2, 0.2);
      rootGroup.rotation.x = THREE.MathUtils.lerp(rootGroup.rotation.x, targetTiltX, 0.08);

      // Gentle floating levitation
      rootGroup.position.y = Math.sin(elapsed * 2.0) * 0.04;

      // Orbit ring spin
      ring.rotation.z += 0.02;

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('scroll', handleScroll);
      container.removeEventListener('mouseenter', onMouseEnter);
      container.removeEventListener('mouseleave', onMouseLeave);
      container.removeEventListener('click', onClick);
      screenTexture.dispose();
      disposeThreeScene(scene);
      renderer.dispose();
    };
  }, [sizeConfig.px]);

  // Fallback to official Favicon SVG if WebGL is unavailable
  if (!hasWebGL) {
    return (
      <div
        className={`relative ${sizeConfig.container} bg-gradient-to-tr from-purple-600 via-indigo-600 to-purple-500 p-0.5 shadow-md shadow-purple-500/20 flex items-center justify-center shrink-0 cursor-pointer overflow-hidden ${className}`}
      >
        <div className="w-full h-full bg-zinc-950 rounded-[10px] flex items-center justify-center overflow-hidden p-1">
          <img src="/icon.svg" alt="CrazyStore Logo" className="w-full h-full object-contain" />
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative ${sizeConfig.container} bg-gradient-to-tr from-purple-600 via-indigo-600 to-purple-500 p-0.5 shadow-md shadow-purple-500/25 flex items-center justify-center shrink-0 cursor-pointer overflow-hidden group hover:scale-105 transition-transform duration-200 ${className}`}
      title="CrazyStore 3D Favicon & Logo &bull; Scroll page or hover to spin"
    >
      <div className="w-full h-full bg-zinc-950 rounded-[10px] flex items-center justify-center overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>
    </div>
  );
}
