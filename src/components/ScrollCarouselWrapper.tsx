import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useScrollFade } from '@/hooks/useScrollFade';

interface ScrollCarouselWrapperProps {
  children: React.ReactNode;
  className?: string;
  scrollClassName?: string;
}

/**
 * Premium horizontal scroll carousel wrapper with:
 * - Dynamic narrow (48px) fade gradients on left/right edges
 * - Arrow buttons on desktop hover
 * - Scroll-snap + hidden scrollbar
 */
export function ScrollCarouselWrapper({ children, className, scrollClassName }: ScrollCarouselWrapperProps) {
  const { scrollRef, showLeftFade, showRightFade, scrollBy } = useScrollFade();

  return (
    <div className={cn("relative group/carousel", className)}>
      {/* Left fade */}
      {/* Left fade removed */}

      {/* Right fade */}
      <div
        className="absolute right-0 top-0 bottom-0 w-12 z-10 pointer-events-none transition-opacity duration-200"
        style={{
          opacity: showRightFade ? 0.15 : 0,
          background: 'linear-gradient(to right, transparent 0%, hsl(var(--background) / 0.95) 100%)',
        }}
      />

      {/* Left arrow */}
      <button
        type="button"
        onClick={() => scrollBy('left')}
        className={cn(
          "absolute left-1.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-card flex items-center justify-center shadow-md transition-all duration-200",
          "opacity-0 group-hover/carousel:opacity-100 hover:scale-105",
          !showLeftFade && "!opacity-0 pointer-events-none",
          "hidden md:flex"
        )}
        aria-label="Scroll left"
      >
        <ChevronLeft className="w-4 h-4 text-muted-foreground" />
      </button>

      {/* Right arrow */}
      <button
        type="button"
        onClick={() => scrollBy('right')}
        className={cn(
          "absolute right-1.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-card flex items-center justify-center shadow-md transition-all duration-200",
          "opacity-0 group-hover/carousel:opacity-100 hover:scale-105",
          !showRightFade && "!opacity-0 pointer-events-none",
          "hidden md:flex"
        )}
        aria-label="Scroll right"
      >
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </button>

      {/* Scrollable container */}
      <div
        ref={scrollRef}
        className={cn(
          "flex overflow-x-auto snap-x snap-mandatory scroll-smooth",
          scrollClassName
        )}
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {children}
      </div>
    </div>
  );
}
