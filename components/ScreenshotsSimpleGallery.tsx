'use client';

import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, Smartphone } from 'lucide-react';

interface ScreenshotItem {
  id: string;
  url: string;
  imageUrl?: string;
  title: string;
  subtitle?: string;
}

interface ScreenshotsSimpleGalleryProps {
  screenshots: ScreenshotItem[];
  onOpenLightbox: (idx: number) => void;
}

function SimpleScreenshotCard({
  screenshot,
  idx,
  total,
  onOpen,
}: {
  screenshot: ScreenshotItem;
  idx: number;
  total: number;
  onOpen: () => void;
}) {
  const fallbackPngs = [
    '/screenshots/videohub-feed.png',
    '/screenshots/videohub-player.png',
    '/screenshots/videohub-audio.png',
    '/screenshots/videohub-settings.png',
  ];
  const fallbackSvgs = [
    '/screenshots/videohub-feed.svg',
    '/screenshots/videohub-player.svg',
    '/screenshots/videohub-audio.svg',
    '/screenshots/videohub-settings.svg',
  ];
  const imageKitUrls = [
    'https://ik.imagekit.io/shubhambogharadev/android-apps/Screenshot_20260925-133227.VideoHub_qzdtxn6-x.png',
    'https://ik.imagekit.io/shubhambogharadev/android-apps/Screenshot_20260925-133306.VideoHub_dgH1K76Qy.png',
    'https://ik.imagekit.io/shubhambogharadev/android-apps/Screenshot_20260925-133323.VideoHub_LEK80RUfT.png',
    'https://ik.imagekit.io/shubhambogharadev/android-apps/Screenshot_20260925-134542.VideoHub_i3VA3Z_90.png',
  ];

  const candidates = React.useMemo(() => {
    const list: string[] = [];
    if (screenshot?.imageUrl) list.push(screenshot.imageUrl);
    if (screenshot?.url && screenshot.url !== screenshot.imageUrl) list.push(screenshot.url);
    list.push(fallbackPngs[idx % fallbackPngs.length]);
    list.push(imageKitUrls[idx % imageKitUrls.length]);
    list.push(fallbackSvgs[idx % fallbackSvgs.length]);
    return Array.from(new Set(list.filter(Boolean)));
  }, [screenshot?.imageUrl, screenshot?.url, idx]);

  const [candidateIdx, setCandidateIdx] = useState(0);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setCandidateIdx(0);
    setHasError(false);
  }, [screenshot?.imageUrl, screenshot?.url]);

  const currentSrc = candidates[candidateIdx] || fallbackPngs[idx % fallbackPngs.length];

  return (
    <div className="flex flex-col items-center shrink-0 snap-center group">
      {/* Device Frame with Pristine Uncropped Screenshot */}
      <div
        onClick={onOpen}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onOpen();
          }
        }}
        role="button"
        tabIndex={0}
        aria-label={`View screenshot ${idx + 1} of ${total}: ${screenshot.title || 'App Preview'}`}
        className="relative shrink-0 h-[340px] xs:h-[370px] sm:h-[400px] md:h-[430px] aspect-[9/19.5] rounded-2xl sm:rounded-3xl overflow-hidden border border-zinc-800/90 hover:border-purple-500/80 bg-zinc-950 shadow-xl hover:shadow-2xl hover:shadow-purple-950/50 transition-all duration-300 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 active:scale-[0.98] flex items-center justify-center p-1 sm:p-1.5 group-hover:-translate-y-1"
      >
        {/* Subtle Outer Bezel Rim */}
        <div className="absolute inset-0 pointer-events-none rounded-2xl sm:rounded-3xl ring-1 ring-inset ring-white/10 z-10" />

        {/* Top Right Expand Icon Button (Revealed on hover) */}
        <div className="absolute top-2.5 right-2.5 z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="p-1.5 rounded-full bg-zinc-950/85 backdrop-blur-md border border-white/20 text-white shadow-md">
            <Maximize2 className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Screenshot Image - 100% visible, natural contain fit, zero cropping */}
        {!hasError ? (
          <img
            src={currentSrc}
            alt={screenshot.title || `Screenshot ${idx + 1}`}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-contain rounded-xl sm:rounded-2xl select-none group-hover:scale-[1.01] transition-transform duration-300"
            onError={() => {
              if (candidateIdx + 1 < candidates.length) {
                setCandidateIdx((prev) => prev + 1);
              } else {
                setHasError(true);
              }
            }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-zinc-900 text-zinc-500 text-center rounded-xl">
            <Smartphone className="w-8 h-8 text-purple-400 mb-2" />
            <span className="text-xs font-bold text-zinc-300">{screenshot.title || `Screen ${idx + 1}`}</span>
            <span className="text-[10px] text-zinc-500 mt-1">Tap to inspect</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function ScreenshotsSimpleGallery({
  screenshots,
  onOpenLightbox,
}: ScreenshotsSimpleGalleryProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 8);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 8);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [screenshots]);

  const scrollToIndex = (idx: number) => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const card = container.children[idx] as HTMLElement;
    if (card) {
      const left = card.offsetLeft - container.offsetLeft - (container.clientWidth - card.clientWidth) / 2;
      container.scrollTo({ left, behavior: 'smooth' });
      setActiveIdx(idx);
    }
  };

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    checkScroll();
    const container = scrollContainerRef.current;
    const scrollLeft = container.scrollLeft;
    const cardWidth = container.children[0]?.clientWidth || 240;
    const newIdx = Math.round(scrollLeft / cardWidth);
    if (newIdx >= 0 && newIdx < screenshots.length && newIdx !== activeIdx) {
      setActiveIdx(newIdx);
    }
  };

  return (
    <div className="w-full relative flex flex-col gap-2">
      {/* Scrollable Screenshots Strip */}
      <div className="relative group/carousel">
        {/* Left Arrow Button (visible only when left scroll is possible) */}
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => scrollToIndex(Math.max(0, activeIdx - 1))}
            className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 z-30 p-2.5 rounded-full bg-zinc-950/90 hover:bg-purple-600 text-white backdrop-blur-md border border-zinc-700/80 transition-all shadow-2xl hover:scale-110 active:scale-95 cursor-pointer"
            aria-label="Previous screenshot"
            title="Previous screenshot"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        {/* Right Arrow Button (visible only when right scroll is possible) */}
        {canScrollRight && (
          <button
            type="button"
            onClick={() => scrollToIndex(Math.min(screenshots.length - 1, activeIdx + 1))}
            className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 z-30 p-2.5 rounded-full bg-zinc-950/90 hover:bg-purple-600 text-white backdrop-blur-md border border-zinc-700/80 transition-all shadow-2xl hover:scale-110 active:scale-95 cursor-pointer"
            aria-label="Next screenshot"
            title="Next screenshot"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        {/* Horizontal Scroll Track - Centered when content fits, scrollable when overflowing */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex gap-4 sm:gap-6 overflow-x-auto snap-x snap-mandatory py-2 px-1 sm:px-3 hide-scrollbar [scrollbar-width:none] touch-pan-x justify-start md:justify-center"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {screenshots.map((s, idx) => (
            <SimpleScreenshotCard
              key={s.id || idx}
              screenshot={s}
              idx={idx}
              total={screenshots.length}
              onOpen={() => onOpenLightbox(idx)}
            />
          ))}
        </div>
      </div>

      {/* Clean Minimal Pagination Dots (only when overflowing) */}
      {screenshots.length > 1 && (canScrollLeft || canScrollRight) && (
        <div className="flex sm:hidden items-center justify-center gap-1.5 pt-1">
          {screenshots.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => scrollToIndex(idx)}
              className={`transition-all duration-200 cursor-pointer rounded-full ${
                idx === activeIdx
                  ? 'w-5 h-1.5 bg-gradient-to-r from-purple-500 to-indigo-500 shadow-sm shadow-purple-500/50'
                  : 'w-1.5 h-1.5 bg-zinc-700 hover:bg-zinc-500'
              }`}
              aria-label={`Jump to screenshot ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
