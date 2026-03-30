import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook for scroll-aware fade indicators on horizontal carousels.
 * Returns refs and state for dynamic left/right gradient visibility + arrow scroll handlers.
 */
export function useScrollFade() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);

  const updateFades = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setShowLeftFade(el.scrollLeft > 0);
    setShowRightFade(el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    // Initial check (after layout)
    const raf = requestAnimationFrame(updateFades);

    el.addEventListener('scroll', updateFades, { passive: true });
    const ro = new ResizeObserver(updateFades);
    ro.observe(el);

    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener('scroll', updateFades);
      ro.disconnect();
    };
  }, [updateFades]);

  const scrollBy = useCallback((direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    // Scroll by roughly one card width
    const cardWidth = el.querySelector(':scope > *')?.getBoundingClientRect().width ?? 200;
    el.scrollBy({ left: direction === 'right' ? cardWidth + 12 : -(cardWidth + 12), behavior: 'smooth' });
  }, []);

  return { scrollRef, showLeftFade, showRightFade, scrollBy };
}
