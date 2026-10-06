'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';

interface Card3DTiltProps {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number; // max tilt angle in degrees (default 12)
  glareOpacity?: number; // max glare opacity (default 0.25)
  perspective?: number; // perspective in px (default 1000)
  scale?: number; // scale on hover (default 1.02)
}

/**
 * High-performance 3D perspective card tilt with dynamic holographic sheen.
 * Leverages hardware-accelerated CSS transforms and smooth spring damping.
 */
export function Card3DTilt({
  children,
  className = '',
  maxTilt = 10,
  glareOpacity = 0.22,
  perspective = 1000,
  scale = 1.02,
}: Card3DTiltProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({
    transform: `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`,
    transition: 'transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)',
  });
  const [glareStyle, setGlareStyle] = useState<React.CSSProperties>({
    opacity: 0,
    background: 'radial-gradient(circle at 50% 50%, rgba(192, 132, 252, 0.4), transparent 60%)',
  });
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [canHover, setCanHover] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const media = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(media.matches);
      const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
      media.addEventListener('change', listener);

      const hoverMedia = window.matchMedia('(hover: hover) and (pointer: fine)');
      setCanHover(hoverMedia.matches);
      const hoverListener = (e: MediaQueryListEvent) => setCanHover(e.matches);
      hoverMedia.addEventListener('change', hoverListener);

      return () => {
        media.removeEventListener('change', listener);
        hoverMedia.removeEventListener('change', hoverListener);
      };
    }
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (prefersReducedMotion || !canHover || !cardRef.current) return;

      const rect = cardRef.current.getBoundingClientRect();
      const clientX = e.clientX;
      const clientY = e.clientY;

      // Coordinate from center (-1 to 1)
      const x = (clientX - rect.left) / rect.width - 0.5;
      const y = (clientY - rect.top) / rect.height - 0.5;

      const rotX = -y * maxTilt * 2;
      const rotY = x * maxTilt * 2;

      // Glare position
      const glareX = ((clientX - rect.left) / rect.width) * 100;
      const glareY = ((clientY - rect.top) / rect.height) * 100;

      setStyle({
        transform: `perspective(${perspective}px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) scale3d(${scale}, ${scale}, ${scale})`,
        transition: 'transform 0.1s cubic-bezier(0.1, 0.9, 0.2, 1)',
      });

      setGlareStyle({
        opacity: glareOpacity,
        background: `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(216, 180, 254, ${glareOpacity * 1.5}), rgba(139, 92, 246, 0.1) 40%, transparent 70%)`,
        transition: 'opacity 0.2s ease',
      });
    },
    [maxTilt, glareOpacity, perspective, scale, prefersReducedMotion]
  );

  const handleMouseLeave = useCallback(() => {
    if (prefersReducedMotion) return;
    setStyle({
      transform: `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`,
      transition: 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)',
    });
    setGlareStyle({
      opacity: 0,
      background: 'radial-gradient(circle at 50% 50%, rgba(192, 132, 252, 0.4), transparent 60%)',
      transition: 'opacity 0.5s ease',
    });
  }, [perspective, prefersReducedMotion]);

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        ...style,
        transformStyle: 'preserve-3d',
        willChange: 'transform',
      }}
      className={`relative transform-gpu ${className}`}
    >
      {children}

      {/* Holographic Specular Glare Layer */}
      <div
        className="pointer-events-none absolute inset-0 rounded-3xl z-20 mix-blend-screen"
        style={glareStyle}
        aria-hidden="true"
      />
    </div>
  );
}
