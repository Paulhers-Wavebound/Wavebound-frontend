import { useState, useEffect } from 'react';
import { INITIAL_ITEMS_PER_CATEGORY, LOAD_MORE_ITEMS } from '../utils/categoryConfig';

interface UseCategoryExpansionProps {
  autoExpand: boolean;
  title: string;
}

export const useCategoryExpansion = ({ autoExpand, title }: UseCategoryExpansionProps) => {
  const [visibleItems, setVisibleItems] = useState(INITIAL_ITEMS_PER_CATEGORY);
  const [manuallyExpanded, setManuallyExpanded] = useState(false);
  const [pendingVisibleItems, setPendingVisibleItems] = useState<number | null>(null);

  const ITEMS_TO_ADD = LOAD_MORE_ITEMS;

  const isExpanded = autoExpand || manuallyExpanded;

  useEffect(() => {
    if (autoExpand) {
      // Auto-expanded sections still start with INITIAL_ITEMS_PER_CATEGORY items visible
      setVisibleItems(INITIAL_ITEMS_PER_CATEGORY);
      setManuallyExpanded(false);
    } else if (!manuallyExpanded) {
      setVisibleItems(INITIAL_ITEMS_PER_CATEGORY);
    }
  }, [autoExpand, manuallyExpanded]);


  const handleExpand = (currentVisibleItems: number, hasMore: boolean, allContentLength: number, onLoadMore?: () => void) => {
    setManuallyExpanded(true);
    const targetVisible = currentVisibleItems + ITEMS_TO_ADD;
    
    // If we have enough content already, show it immediately
    if (targetVisible <= allContentLength) {
      setVisibleItems(targetVisible);
      setPendingVisibleItems(null);
    } else {
      // Otherwise, mark as pending and trigger load
      setPendingVisibleItems(targetVisible);
      if (hasMore && onLoadMore) {
        onLoadMore();
      }
    }
  };

  const handleShowMore = (currentVisibleItems: number, hasMore: boolean, allContentLength: number, onLoadMore?: () => void) => {
    const targetVisible = currentVisibleItems + ITEMS_TO_ADD;
    
    // If we have enough content already, show it immediately
    if (targetVisible <= allContentLength) {
      setVisibleItems(targetVisible);
      setPendingVisibleItems(null);
    } else if (hasMore && onLoadMore) {
      // Only set pending if we can actually load more
      setPendingVisibleItems(targetVisible);
      onLoadMore();
    } else {
      // Show all available content if we can't load more
      setVisibleItems(allContentLength);
      setPendingVisibleItems(null);
    }
  };

  // When content loads and we have pending items to show, update visibleItems
  // Only update once we have the full batch OR loading is complete
  const updateVisibleIfReady = (allContentLength: number, isLoading: boolean = false) => {
    if (pendingVisibleItems) {
      if (pendingVisibleItems <= allContentLength) {
        // We have enough content to show the target amount
        setVisibleItems(pendingVisibleItems);
        setPendingVisibleItems(null);
      } else if (!isLoading) {
        // Loading is complete - show what we have regardless
        setVisibleItems(allContentLength);
        setPendingVisibleItems(null);
      }
      // If still loading and don't have enough, wait for more content
    }
  };

  const handleCollapse = () => {
    setManuallyExpanded(false);
    setVisibleItems(INITIAL_ITEMS_PER_CATEGORY);
  };

  return {
    isExpanded,
    visibleItems,
    handleExpand,
    handleShowMore,
    handleCollapse,
    updateVisibleIfReady,
    isLoadingMore: pendingVisibleItems !== null
  };
};
