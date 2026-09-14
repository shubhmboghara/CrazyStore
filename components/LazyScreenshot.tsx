'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ZoomIn, Image as ImageIcon } from 'lucide-react';

interface LazyScreenshotProps {
  src: string;
  alt: string;
  title?: string;
  hasCustomTitle?: boolean;
  onClick?: () => void;
  aspectClass?: string;
  rootRef?: React.RefObject<HTMLElement | null>;
  priority?: boolean;
}

export function LazyScreenshot({
  src,
  alt,
  title,
  hasCustomTitle = false,
  onClick,
  aspectClass = 'h-[460px] sm:h-[520px] md:h-[560px]',
  rootRef,
  priority = false,
}: LazyScreenshotProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isInView, setIsInView] = useState<boolean>(() => {
    if (priority) return true;
    if (typeof window !== 'undefined' && !('IntersectionObserver' in window)) {
      return true;
    }
    return false;
  });
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    if (priority || isInView) return;

    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      return;
    }

    const target = containerRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.unobserve(entry.target);
            observer.disconnect();
          }
        });
      },
      {
        root: rootRef?.current || null,
        rootMargin: '200px 100px', // Preload 200px ahead horizontally/vertically for smooth scrolling
        threshold: 0.01,
      }
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [rootRef, priority, isInView]);

  return (
    <div
      ref={containerRef}
      onClick={onClick}
      className={`relative w-full ${aspectClass} rounded-3xl overflow-hidden bg-black border border-zinc-800 shadow-md group-hover:shadow-2xl group-hover:border-purple-500/80 transition-all duration-300 transform group-hover:-translate-y-1.5 flex items-center justify-center p-2.5 sm:p-3`}
    >
      {/* Loading Skeleton Placeholder before image enters viewport or while loading */}
      {(!isInView || (!isLoaded && !hasError)) && (
        <div className="absolute inset-0 bg-gradient-to-tr from-zinc-900 via-zinc-800/80 to-zinc-900 flex flex-col items-center justify-center animate-pulse z-0 p-6">
          <div className="w-12 h-12 rounded-2xl bg-zinc-800/90 border border-zinc-700/50 flex items-center justify-center text-zinc-500 mb-3 shadow-inner">
            <ImageIcon className="w-6 h-6 animate-pulse text-zinc-400" />
          </div>
          <div className="h-2.5 w-24 bg-zinc-700/60 rounded-full mb-2"></div>
          <div className="h-2 w-16 bg-zinc-800 rounded-full"></div>
        </div>
      )}

      {/* Error State Fallback */}
      {hasError && (
        <div className="relative z-10 flex flex-col items-center justify-center text-center p-6 text-zinc-500">
          <ImageIcon className="w-10 h-10 text-zinc-600 mb-2" />
          <span className="text-xs font-medium text-zinc-400">Preview Unavailable</span>
        </div>
      )}

      {/* When in view, render the ambient glow and optimized lazy image */}
      {isInView && !hasError && (
        <>
          {/* Ambient Backdrop Glow */}
          <div
            className={`absolute inset-0 bg-cover bg-center blur-2xl opacity-30 scale-125 pointer-events-none transition-opacity duration-700 ${
              isLoaded ? 'opacity-30' : 'opacity-0'
            }`}
            style={{ backgroundImage: `url(${src})` }}
          />

          {/* Full Screenshot Image */}
          <img
            src={src}
            alt={hasCustomTitle && title ? title : alt}
            loading="lazy"
            decoding="async"
            onLoad={() => setIsLoaded(true)}
            onError={() => setHasError(true)}
            className={`relative z-10 max-h-full max-w-full w-auto h-auto object-contain rounded-2xl drop-shadow-xl group-hover:scale-[1.02] transition-all duration-500 pointer-events-none ${
              isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}
            draggable={false}
          />
        </>
      )}

      {/* Hover Overlay with Zoom Indicator */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-4 sm:p-5 flex flex-col justify-between z-20 pointer-events-none rounded-3xl">
        <div className="flex justify-end">
          <span className="p-2.5 sm:p-3 rounded-2xl bg-purple-600/90 backdrop-blur-md text-white shadow-lg shadow-purple-600/30">
            <ZoomIn className="w-4 h-4 sm:w-5 sm:h-5" />
          </span>
        </div>
        {hasCustomTitle && title ? (
          <span className="text-sm font-bold text-white line-clamp-2 drop-shadow-md">
            {title}
          </span>
        ) : (
          <span className="text-xs font-semibold text-zinc-200 drop-shadow-sm">
            Tap to view full size
          </span>
        )}
      </div>
    </div>
  );
}
