/**
 * CrazyStore 3D / Three.js Utilities
 * Provides WebGL support detection, texture generation for 3D device screens,
 * and deterministic memory disposal for Three.js scenes.
 */

import * as THREE from 'three';

/**
 * Safely checks if WebGL or WebGL2 is available in the current browser environment.
 */
export function isWebGLAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

/**
 * Recursively disposes of Three.js meshes, geometries, and materials
 * to prevent GPU and CPU memory leaks.
 */
export function disposeThreeScene(scene: THREE.Object3D, renderer?: THREE.WebGLRenderer): void {
  scene.traverse((object: any) => {
    if (!object) return;

    // Dispose geometry
    if (object.geometry) {
      object.geometry.dispose();
    }

    // Dispose material(s)
    if (object.material) {
      if (Array.isArray(object.material)) {
        object.material.forEach((mat: any) => disposeMaterial(mat));
      } else {
        disposeMaterial(object.material);
      }
    }
  });

  if (renderer && typeof renderer.dispose === 'function') {
    renderer.dispose();
  }
}

function disposeMaterial(material: any): void {
  if (!material) return;
  // Dispose all possible texture maps
  const textureProperties = [
    'map',
    'lightMap',
    'bumpMap',
    'normalMap',
    'specularMap',
    'envMap',
    'alphaMap',
    'roughnessMap',
    'metalnessMap',
    'emissiveMap',
    'clearcoatMap',
    'clearcoatRoughnessMap',
  ];

  for (const prop of textureProperties) {
    if (material[prop] && typeof material[prop].dispose === 'function') {
      material[prop].dispose();
    }
  }

  if (typeof material.dispose === 'function') {
    material.dispose();
  }
}

export interface ScreenCanvasOptions {
  appName?: string;
  tagline?: string;
  category?: string;
  badge?: string;
  version?: string;
  rating?: number;
  reviewsCount?: number;
  timeString?: string;
  accentColor?: string;
  secondaryColor?: string;
  previewImage?: HTMLImageElement | null;
}

/**
 * Creates an in-memory 2D canvas rendered to look like a high-end Android / Jetpack Compose OS screen.
 * This canvas is converted to a Three.js CanvasTexture to be projected onto the 3D phone model.
 */
export function drawAndroidScreenCanvas(
  canvas: HTMLCanvasElement,
  options: ScreenCanvasOptions = {}
): void {
  const {
    appName = 'VideoHub',
    tagline = 'Ad-Free High-Definition Player for Android',
    category = 'Media & Video',
    badge = 'Kotlin + Jetpack Compose',
    version = 'v1.4.2',
    rating = 4.9,
    reviewsCount = 128,
    timeString = '09:41',
    accentColor = '#8b5cf6',
    secondaryColor = '#6366f1',
    previewImage = null,
  } = options;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;

  // 1. Dark Android Modern UI Background
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, '#09090b');
  bgGrad.addColorStop(0.4, '#0f0f17');
  bgGrad.addColorStop(1, '#09090b');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // If a real screenshot preview image is provided, draw it uncropped with aspect ratio preserved
  if (previewImage && previewImage.complete && previewImage.naturalWidth > 0) {
    // Fill background with deep OLED black
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, width, height);

    const imgW = previewImage.naturalWidth;
    const imgH = previewImage.naturalHeight;
    const imgAspect = imgW / imgH;
    const canvasAspect = width / height;

    let drawW = width;
    let drawH = height;
    let drawX = 0;
    let drawY = 0;

    // Aspect ratio fit (contain) - 100% full screenshot visible, zero cropping
    if (imgAspect > canvasAspect) {
      drawW = width;
      drawH = width / imgAspect;
      drawY = (height - drawH) / 2;
    } else {
      drawH = height;
      drawW = height * imgAspect;
      drawX = (width - drawW) / 2;
    }

    // Clip to screen rounded bezel
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(0, 0, width, height, 28);
    ctx.clip();

    ctx.drawImage(previewImage, drawX, drawY, drawW, drawH);
    ctx.restore();
    return; // Early return: do not draw fake status bar or dark vignette over real screenshots!
  }
    // 2. Decorative Ambient Glow Orbs
    const orbGrad1 = ctx.createRadialGradient(width * 0.8, height * 0.25, 10, width * 0.8, height * 0.25, 240);
    orbGrad1.addColorStop(0, 'rgba(139, 92, 246, 0.35)');
    orbGrad1.addColorStop(1, 'rgba(139, 92, 246, 0)');
    ctx.fillStyle = orbGrad1;
    ctx.fillRect(0, 0, width, height);

    const orbGrad2 = ctx.createRadialGradient(width * 0.2, height * 0.65, 10, width * 0.2, height * 0.65, 260);
    orbGrad2.addColorStop(0, 'rgba(99, 102, 241, 0.25)');
    orbGrad2.addColorStop(1, 'rgba(99, 102, 241, 0)');
    ctx.fillStyle = orbGrad2;
    ctx.fillRect(0, 0, width, height);

    // 3. Android App Card Header
    ctx.save();
    const cardX = 36;
    const cardY = 110;
    const cardW = width - 72;
    const cardH = 210;
    const cardR = 28;

    // Card background
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, cardR);
    ctx.fillStyle = 'rgba(24, 24, 27, 0.85)';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.3)';
    ctx.stroke();

    // App Logo Icon inside card
    const iconSize = 80;
    const iconX = cardX + 24;
    const iconY = cardY + 28;
    const iconGrad = ctx.createLinearGradient(iconX, iconY, iconX + iconSize, iconY + iconSize);
    iconGrad.addColorStop(0, accentColor);
    iconGrad.addColorStop(1, secondaryColor);
    ctx.beginPath();
    ctx.roundRect(iconX, iconY, iconSize, iconSize, 22);
    ctx.fillStyle = iconGrad;
    ctx.fill();

    // Play icon triangle / Kotlin glyph inside icon
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(iconX + 32, iconY + 24);
    ctx.lineTo(iconX + 56, iconY + 40);
    ctx.lineTo(iconX + 32, iconY + 56);
    ctx.closePath();
    ctx.fill();

    // App Name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px sans-serif';
    ctx.fillText(appName, iconX + iconSize + 22, iconY + 36);

    // Category / Tagline
    ctx.fillStyle = '#a1a1aa';
    ctx.font = '500 18px sans-serif';
    ctx.fillText(category, iconX + iconSize + 22, iconY + 64);

    // Badge pill
    ctx.fillStyle = 'rgba(139, 92, 246, 0.25)';
    ctx.beginPath();
    ctx.roundRect(cardX + 24, cardY + 138, cardW - 48, 44, 12);
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.5)';
    ctx.stroke();

    ctx.fillStyle = '#c084fc';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(`⚡ ${badge} • ${version}`, cardX + 44, cardY + 166);
    ctx.restore();

    // 4. Live Jetpack Compose Code Preview Widget
    ctx.save();
    const codeX = 36;
    const codeY = 350;
    const codeW = width - 72;
    const codeH = 240;
    const codeR = 24;

    ctx.beginPath();
    ctx.roundRect(codeX, codeY, codeW, codeH, codeR);
    ctx.fillStyle = 'rgba(18, 18, 24, 0.95)';
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(63, 63, 70, 0.7)';
    ctx.stroke();

    // Mac/Android traffic lights / dots
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(codeX + 24, codeY + 26, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.arc(codeX + 44, codeY + 26, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(codeX + 64, codeY + 26, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#71717a';
    ctx.font = '600 14px monospace';
    ctx.fillText('CrazyStoreScreen.kt', codeX + 90, codeY + 31);

    // Compose code snippet
    ctx.font = '14px monospace';
    const lines = [
      { text: '@Composable', color: '#c084fc' },
      { text: `fun ${appName.replace(/\s+/g, '')}Screen() {`, color: '#60a5fa' },
      { text: '  Scaffold(', color: '#f472b6' },
      { text: '    topBar = { CrazyTopBar() },', color: '#34d399' },
      { text: '    content = { ModernComposeGrid() }', color: '#fbbf24' },
      { text: '  )', color: '#f472b6' },
      { text: '}', color: '#60a5fa' },
    ];
    let lineY = codeY + 70;
    for (const line of lines) {
      ctx.fillStyle = line.color;
      ctx.fillText(line.text, codeX + 24, lineY);
      lineY += 22;
    }
    ctx.restore();

    // 5. Rating & Metric Card
    ctx.save();
    const metricX = 36;
    const metricY = 615;
    const metricW = width - 72;
    const metricH = 110;
    const metricR = 24;

    ctx.beginPath();
    ctx.roundRect(metricX, metricY, metricW, metricH, metricR);
    ctx.fillStyle = 'rgba(24, 24, 27, 0.9)';
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(234, 179, 8, 0.3)';
    ctx.stroke();

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText(`★ ${rating.toFixed(1)}`, metricX + 24, metricY + 54);

    ctx.fillStyle = '#a1a1aa';
    ctx.font = '500 16px sans-serif';
    ctx.fillText(`Verified Reviews (${reviewsCount}+)`, metricX + 24, metricY + 88);

    // Download CTA Pill inside screen
    const ctaW = 150;
    const ctaH = 48;
    const ctaX = metricX + metricW - ctaW - 20;
    const ctaY = metricY + 30;
    ctx.beginPath();
    ctx.roundRect(ctaX, ctaY, ctaW, ctaH, 16);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    ctx.fillStyle = '#09090b';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('Get APK ↓', ctaX + 28, ctaY + 30);
    ctx.restore();

  // 6. Top Status Bar (Time, Battery, Wi-Fi, 5G)
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText(timeString, 38, 44);

  // Status icons (right)
  const rightX = width - 42;
  // Battery outline
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.strokeRect(rightX - 32, 28, 28, 16);
  ctx.fillStyle = '#22c55e'; // Green full battery
  ctx.fillRect(rightX - 30, 30, 20, 12);
  // Battery terminal
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(rightX - 3, 32, 3, 8);

  // Wi-Fi arcs
  ctx.beginPath();
  ctx.arc(rightX - 52, 40, 10, Math.PI * 1.2, Math.PI * 1.8);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(rightX - 52, 40, 5, Math.PI * 1.2, Math.PI * 1.8);
  ctx.stroke();

  // 5G Label
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText('5G', rightX - 86, 42);
  ctx.restore();

  // 7. Android Dynamic Pill / Punch-Hole Camera
  ctx.save();
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.roundRect((width - 120) / 2, 20, 120, 28, 14);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Camera lens circle
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(width / 2 + 36, 34, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1e3a8a';
  ctx.beginPath();
  ctx.arc(width / 2 + 36, 34, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 8. Bottom Android Gesture Bar
  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.beginPath();
  ctx.roundRect((width - 160) / 2, height - 20, 160, 5, 3);
  ctx.fill();
  ctx.restore();
}
