import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ExternalLink,
  Store,
  Pause,
  Play
} from 'lucide-react';
import { InterCategoryBanner } from '../../types';
import { useApp } from '../../context/AppContext';

interface FullWidthCarouselBannerProps {
  banner: InterCategoryBanner;
  onNavigateToCategory?: (category: string) => void;
  onOpenStore?: (merchantId: string) => void;
}

export const FullWidthCarouselBanner: React.FC<FullWidthCarouselBannerProps> = ({
  banner,
  onNavigateToCategory,
  onOpenStore
}) => {
  const { trackAdImpression, trackAdClick } = useApp();
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartXRef = useRef<number | null>(null);
  const trackedSpaceIdRef = useRef<string | null>(null);

  const slides = banner.slides || [];
  const totalSlides = slides.length;
  const intervalSeconds = banner.autoplayIntervalSeconds || 4;

  // Track impression once on mount per adSpaceId
  useEffect(() => {
    if (banner.adSpaceId && trackedSpaceIdRef.current !== banner.adSpaceId) {
      trackedSpaceIdRef.current = banner.adSpaceId;
      trackAdImpression(banner.adSpaceId);
    }
  }, [banner.adSpaceId, trackAdImpression]);

  // Autoplay timer
  useEffect(() => {
    if (totalSlides <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % totalSlides);
    }, intervalSeconds * 1000);

    return () => clearInterval(timer);
  }, [totalSlides, intervalSeconds, isPaused]);

  if (totalSlides === 0 || banner.status !== 'active') {
    return null;
  }

  const currentSlide = slides[currentSlideIndex] || slides[0];

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentSlideIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentSlideIndex((prev) => (prev + 1) % totalSlides);
  };

  const handleActionClick = () => {
    if (banner.adSpaceId) {
      trackAdClick(banner.adSpaceId);
    }
    if (currentSlide.merchantId && onOpenStore) {
      onOpenStore(currentSlide.merchantId);
      return;
    }
    if (currentSlide.linkUrl && onNavigateToCategory) {
      onNavigateToCategory(currentSlide.linkUrl);
    }
  };

  // Touch handling for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartXRef.current - touchEndX;

    if (diff > 40) {
      // Swiped left -> next
      handleNext();
    } else if (diff < -40) {
      // Swiped right -> prev
      handlePrev();
    }
    touchStartXRef.current = null;
  };

  return (
    <div
      id={`inter-banner-${banner.id}`}
      className="my-8 md:my-12 w-full px-3 sm:px-4 lg:px-6 max-w-7xl mx-auto"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl shadow-xl border border-slate-800 bg-slate-950 text-white min-h-[260px] sm:min-h-[300px] md:min-h-[340px] flex items-center">
        {/* Background Slide Images with Crossfade */}
        {slides.map((slide, idx) => (
          <div
            key={slide.id || idx}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              idx === currentSlideIndex ? 'opacity-100 z-0' : 'opacity-0 pointer-events-none'
            }`}
          >
            <img
              src={slide.imageUrl}
              alt={slide.title}
              className="w-full h-full object-cover object-center transform scale-105 transition-transform duration-10000 ease-out"
              loading="lazy"
            />
            {/* Gradients for high text contrast on mobile and desktop */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950/40 md:bg-gradient-to-r md:from-slate-950 md:via-slate-950/90 md:to-transparent" />
          </div>
        ))}

        {/* Content Container */}
        <div className="relative z-10 p-5 sm:p-8 md:p-10 max-w-2xl w-full flex flex-col justify-between">
          <div>
            {/* Sponsor / Tag Badge */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] sm:text-xs font-black tracking-wider uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                {currentSlide.badge || 'DESTAQUE PATROCINADO'}
              </span>

              {currentSlide.merchantName && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-800/80 text-slate-300 border border-slate-700 backdrop-blur-md">
                  <Store className="w-3 h-3 text-blue-400" />
                  {currentSlide.merchantName}
                </span>
              )}
            </div>

            {/* Slide Title */}
            <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-white leading-tight tracking-tight drop-shadow-sm mb-2 sm:mb-3">
              {currentSlide.title}
            </h3>

            {/* Slide Subtitle */}
            {currentSlide.subtitle && (
              <p className="text-slate-300 text-xs sm:text-sm md:text-base leading-relaxed line-clamp-2 sm:line-clamp-3 mb-5 max-w-xl">
                {currentSlide.subtitle}
              </p>
            )}
          </div>

          {/* Action Row & Carousel Indicators */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <button
              id={`btn-banner-action-${banner.id}-${currentSlideIndex}`}
              onClick={handleActionClick}
              className="inline-flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-600/30 active:scale-95 transition-all"
            >
              <span>{currentSlide.actionText || 'Ver Ofertas Exclusivas'}</span>
              <ExternalLink className="w-4 h-4" />
            </button>

            {/* 3 Slides Dots Navigation */}
            <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlideIndex(idx)}
                  aria-label={`Slide ${idx + 1}`}
                  className={`transition-all duration-300 rounded-full ${
                    idx === currentSlideIndex
                      ? 'w-6 h-2 bg-blue-500'
                      : 'w-2 h-2 bg-slate-500 hover:bg-slate-400'
                  }`}
                />
              ))}

              <button
                onClick={() => setIsPaused(!isPaused)}
                aria-label={isPaused ? 'Continuar rotação' : 'Pausar rotação'}
                className="ml-1 text-slate-400 hover:text-white p-0.5"
              >
                {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
              </button>
            </div>
          </div>
        </div>

        {/* Previous / Next Arrow Controls for Desktop & Tablet */}
        <button
          onClick={handlePrev}
          aria-label="Slide anterior"
          className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 items-center justify-center rounded-full bg-slate-950/70 hover:bg-slate-900 text-white border border-slate-700 shadow-md backdrop-blur-sm transition-all hover:scale-105 active:scale-95"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          onClick={handleNext}
          aria-label="Próximo slide"
          className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 items-center justify-center rounded-full bg-slate-950/70 hover:bg-slate-900 text-white border border-slate-700 shadow-md backdrop-blur-sm transition-all hover:scale-105 active:scale-95"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Slide Counter Badge */}
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-md text-[11px] font-bold text-slate-300 border border-slate-800">
          {currentSlideIndex + 1} / {totalSlides}
        </div>
      </div>
    </div>
  );
};
