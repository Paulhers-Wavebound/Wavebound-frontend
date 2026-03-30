import React, { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@supabase/supabase-js';

const FAVORITES_QUERY_KEY = ['user-favorites'];
const LOCAL_FAVORITES_KEY = 'test_user_favorites';

const checkAndUnlockFirstFavorite = async (userId: string) => {
  try {
    const { data: existing } = await supabase
      .from('user_achievements')
      .select('id')
      .eq('user_id', userId)
      .eq('achievement_type', 'first_favorite')
      .maybeSingle();

    if (!existing) {
      await supabase.from('user_achievements').insert({
        user_id: userId,
        achievement_type: 'first_favorite',
      });
      return true;
    }
  } catch (error) {
    console.error('Error checking first_favorite achievement:', error);
  }
  return false;
};

export const useFavorites = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const userRef = useRef<User | null>(null);
  const [userReady, setUserReady] = useState(false);

  // Track auth state reliably via onAuthStateChange
  useEffect(() => {
    // Initialize from current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      userRef.current = session?.user ?? null;
      setUserReady(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      userRef.current = session?.user ?? null;
      setUserReady(true);
      queryClient.invalidateQueries({ queryKey: FAVORITES_QUERY_KEY });
    });

    return () => subscription.unsubscribe();
  }, [queryClient]);

  const ViewFavoritesButton = () => (
    <button
      onClick={() => navigate('/workspace?tab=favorites')}
      className="px-3 py-1 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
    >
      View Favorites
    </button>
  );

  const { data: favorites = { videoIds: [], photoIds: [], reelIds: [] }, isLoading: loading } = useQuery({
    queryKey: FAVORITES_QUERY_KEY,
    queryFn: async () => {
      const user = userRef.current;
      
      if (!user) {
        const stored = localStorage.getItem(LOCAL_FAVORITES_KEY);
        if (stored) {
          try { return JSON.parse(stored); } catch { return { videoIds: [], photoIds: [], reelIds: [] }; }
        }
        return { videoIds: [], photoIds: [], reelIds: [] };
      }

      const { data, error } = await supabase
        .from('user_favorites')
        .select('video_id, video_type')
        .eq('user_id', user.id);

      if (error) throw error;

      const videoIds = data?.filter(fav => fav.video_type === 'tiktok').map(fav => fav.video_id) || [];
      const photoIds = data?.filter(fav => fav.video_type === 'photo_carousel').map(fav => fav.video_id) || [];
      const reelIds = data?.filter(fav => fav.video_type === 'instagram_reel').map(fav => fav.video_id) || [];

      return { videoIds, photoIds, reelIds };
    },
    enabled: userReady,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const toggleFavorite = async (videoId: number, videoType: 'tiktok' | 'photo_carousel' | 'instagram_reel' = 'tiktok') => {
    try {
      const user = userRef.current;
      
      // Handle test user (localStorage)
      if (!user) {
        console.warn('[Favorites] No authenticated user found, using localStorage fallback');
        const isFavorited = videoType === 'tiktok' 
          ? favorites.videoIds.includes(videoId)
          : videoType === 'photo_carousel'
          ? favorites.photoIds.includes(videoId)
          : favorites.reelIds.includes(videoId);

        const newFavorites = isFavorited
          ? {
              videoIds: videoType === 'tiktok' ? favorites.videoIds.filter((id: number) => id !== videoId) : favorites.videoIds,
              photoIds: videoType === 'photo_carousel' ? favorites.photoIds.filter((id: number) => id !== videoId) : favorites.photoIds,
              reelIds: videoType === 'instagram_reel' ? favorites.reelIds.filter((id: number) => id !== videoId) : favorites.reelIds,
            }
          : {
              videoIds: videoType === 'tiktok' ? [...favorites.videoIds, videoId] : favorites.videoIds,
              photoIds: videoType === 'photo_carousel' ? [...favorites.photoIds, videoId] : favorites.photoIds,
              reelIds: videoType === 'instagram_reel' ? [...favorites.reelIds, videoId] : favorites.reelIds,
            };

        localStorage.setItem(LOCAL_FAVORITES_KEY, JSON.stringify(newFavorites));
        queryClient.setQueryData(FAVORITES_QUERY_KEY, newFavorites);

        toast({
          title: isFavorited ? "Removed from favorites 💔" : "Added to favorites! ⭐",
          description: isFavorited ? "Content removed from your favorites." : "Content saved to your favorites.",
          action: !isFavorited ? <ViewFavoritesButton /> : undefined,
        });
        return;
      }

      const isFavorited = videoType === 'tiktok' 
        ? favorites.videoIds.includes(videoId)
        : videoType === 'photo_carousel'
        ? favorites.photoIds.includes(videoId)
        : favorites.reelIds.includes(videoId);

      if (isFavorited) {
        const oldFavorites = { ...favorites };
        
        // Optimistic update
        queryClient.setQueryData(FAVORITES_QUERY_KEY, (old: any) => ({
          videoIds: videoType === 'tiktok' ? old.videoIds.filter((id: number) => id !== videoId) : old.videoIds,
          photoIds: videoType === 'photo_carousel' ? old.photoIds.filter((id: number) => id !== videoId) : old.photoIds,
          reelIds: videoType === 'instagram_reel' ? old.reelIds.filter((id: number) => id !== videoId) : old.reelIds,
        }));

        const { error } = await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('video_id', videoId)
          .eq('video_type', videoType);

        if (error) {
          console.error('[Favorites] DELETE failed:', error);
          queryClient.setQueryData(FAVORITES_QUERY_KEY, oldFavorites);
          throw error;
        }

        toast({
          title: "Removed from favorites",
          description: "Content removed from your favorites.",
          action: (
            <button
              onClick={async () => {
                await supabase.from('user_favorites').insert({
                  user_id: user.id,
                  video_id: videoId,
                  video_type: videoType
                });
                queryClient.setQueryData(FAVORITES_QUERY_KEY, oldFavorites);
                toast({ title: "Restored to favorites ⭐" });
              }}
              className="px-3 py-1 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Undo
            </button>
          ),
        });
      } else {
        // Optimistic update
        queryClient.setQueryData(FAVORITES_QUERY_KEY, (old: any) => ({
          videoIds: videoType === 'tiktok' ? [...old.videoIds, videoId] : old.videoIds,
          photoIds: videoType === 'photo_carousel' ? [...old.photoIds, videoId] : old.photoIds,
          reelIds: videoType === 'instagram_reel' ? [...old.reelIds, videoId] : old.reelIds,
        }));

        const { error } = await supabase
          .from('user_favorites')
          .insert({
            user_id: user.id,
            video_id: videoId,
            video_type: videoType
          });

        if (error) {
          console.error('[Favorites] INSERT failed:', error);
          queryClient.invalidateQueries({ queryKey: FAVORITES_QUERY_KEY });
          throw error;
        }

        const unlocked = await checkAndUnlockFirstFavorite(user.id);
        
        toast({
          title: unlocked ? "🏆 Achievement Unlocked: Curator!" : "Added to favorites! ⭐",
          description: unlocked ? "You saved your first video to favorites!" : "Content saved to your favorites.",
          action: <ViewFavoritesButton />,
        });
      }
    } catch (error) {
      console.error('[Favorites] Error toggling favorite:', error);
      queryClient.invalidateQueries({ queryKey: FAVORITES_QUERY_KEY });
      toast({
        title: "Error updating favorites",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  };

  const isFavorited = (videoId: number, videoType: 'tiktok' | 'photo_carousel' | 'instagram_reel' = 'tiktok') => {
    return videoType === 'tiktok' 
      ? favorites.videoIds.includes(videoId)
      : videoType === 'photo_carousel'
      ? favorites.photoIds.includes(videoId)
      : favorites.reelIds.includes(videoId);
  };

  const loadFavorites = () => {
    queryClient.invalidateQueries({ queryKey: FAVORITES_QUERY_KEY });
  };

  return {
    favoriteVideoIds: favorites.videoIds,
    favoritePhotoIds: favorites.photoIds,
    favoriteReelIds: favorites.reelIds,
    loading,
    toggleFavorite,
    isFavorited,
    loadFavorites
  };
};
