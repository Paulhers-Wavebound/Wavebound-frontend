import { useState, useCallback } from 'react';
import { Video } from '../types/content';
import { fetchReelsWithJoins } from '../services/contentDataService';

export const useReelsData = () => {
  const [reels, setReels] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);

  const loadReels = useCallback(async () => {
    try {
      setLoading(true);

      // Use new normalized tables
      const mappedReels = await fetchReelsWithJoins(100);
      setReels(mappedReels);
      
    } catch (error) {
      console.error('Error in loadReels:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    reels,
    loading,
    loadReels
  };
};
