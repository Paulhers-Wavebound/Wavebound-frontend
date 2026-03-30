import { useCallback, useRef } from 'react';

interface PreloadedImage {
  src: string;
  image: HTMLImageElement;
}

export const useGifPreloader = () => {
  const preloadedImagesRef = useRef<Map<string, PreloadedImage>>(new Map());

  const preloadGif = useCallback((src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Check if already preloaded
      if (preloadedImagesRef.current.has(src)) {
        resolve();
        return;
      }

      const img = new Image();
      img.onload = () => {
        preloadedImagesRef.current.set(src, { src, image: img });
        resolve();
      };
      img.onerror = () => {
        console.warn('Failed to preload GIF:', src);
        reject(new Error(`Failed to preload: ${src}`));
      };
      img.src = src;
    });
  }, []);

  const preloadAdjacentGifs = useCallback((
    allContent: any[],
    currentIndex: number,
    gridColumns: number = 6
  ) => {
    // Limit preloading to prevent overwhelming the browser
    const maxPreload = 3;
    const adjacentIndices: number[] = [];
    
    // Add right neighbor
    if (currentIndex + 1 < allContent.length && adjacentIndices.length < maxPreload) {
      adjacentIndices.push(currentIndex + 1);
    }
    
    // Add bottom neighbor  
    const bottomIndex = currentIndex + gridColumns;
    if (bottomIndex < allContent.length && adjacentIndices.length < maxPreload) {
      adjacentIndices.push(bottomIndex);
    }

    // Only add diagonal if we still have room
    const diagonalIndex = currentIndex + gridColumns + 1;
    if (diagonalIndex < allContent.length && 
        (currentIndex + 1) % gridColumns !== 0 && 
        adjacentIndices.length < maxPreload) {
      adjacentIndices.push(diagonalIndex);
    }

    // Preload the GIFs for adjacent videos with throttling
    adjacentIndices.forEach((index, i) => {
      const item = allContent[index];
      if (item && 'gif_url' in item && item.gif_url) {
        // Add small delay between preloads to prevent overwhelming
        setTimeout(() => {
          preloadGif(item.gif_url).catch(() => {
            // Silently handle preload failures
          });
        }, i * 100);
      }
    });
  }, [preloadGif]);

  const getGridColumns = useCallback(() => {
    // Determine grid columns based on screen size
    if (window.innerWidth >= 1280) return 6; // xl
    if (window.innerWidth >= 1024) return 5; // lg
    if (window.innerWidth >= 768) return 4;  // md
    if (window.innerWidth >= 640) return 3;  // sm
    return 2; // default
  }, []);

  return {
    preloadAdjacentGifs,
    getGridColumns,
    preloadGif
  };
};