import { useState } from 'react';
import { Video, PhotoCarousel } from '../types/content';
import { CategoryKey, CATEGORY_CONFIGS } from '../utils/categoryConfig';

export interface CategoryData {
  videos: Video[];
  photoCarousels: PhotoCarousel[];
  loading: boolean;
  hasMore: boolean;
  loadMore: () => Promise<void>;
}

const createInitialCategoryState = (): CategoryData => ({
  videos: [],
  photoCarousels: [],
  loading: false,
  hasMore: true,
  loadMore: async () => {}
});

export const useCategoryState = () => {
  const [categories, setCategories] = useState<Record<CategoryKey, CategoryData>>(() => {
    const initial: Partial<Record<CategoryKey, CategoryData>> = {};
    CATEGORY_CONFIGS.forEach(config => {
      initial[config.key] = createInitialCategoryState();
    });
    return initial as Record<CategoryKey, CategoryData>;
  });

  const [loading, setLoading] = useState(true);

  const updateCategory = (key: CategoryKey, updates: Partial<CategoryData> | ((prev: CategoryData) => Partial<CategoryData>)) => {
    setCategories(prev => {
      const resolved = typeof updates === 'function' ? updates(prev[key]) : updates;
      return {
        ...prev,
        [key]: { ...prev[key], ...resolved }
      };
    });
  };

  const resetCategory = (key: CategoryKey) => {
    setCategories(prev => ({
      ...prev,
      [key]: createInitialCategoryState()
    }));
  };

  return {
    categories,
    loading,
    setLoading,
    updateCategory,
    resetCategory
  };
};
