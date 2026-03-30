import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { getPrimaryGenre } from '@/utils/genreParser';
import { fixSupabaseStorageUrl } from '@/services/contentDataService';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Heart, Eye, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { getGenreColor } from '@/utils/tagColors';

export interface FavoriteVideoItem {
  id: number;
  type: 'tiktok' | 'instagram_reel' | 'photo_carousel';
  caption?: string;
  video_views?: number;
  video_likes?: number;
  thumbnail_url?: string;
  content_style?: string;
  genre?: string;
  embedded_ulr?: string;
  video_url?: string;
}

interface FavoritesSelectorProps {
  onSelect: (video: FavoriteVideoItem) => void;
  isLoading?: boolean;
}

export function FavoritesSelector({ onSelect, isLoading: externalLoading }: FavoritesSelectorProps) {
  const [favorites, setFavorites] = useState<FavoriteVideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<FavoriteVideoItem | null>(null);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: favData } = await supabase
        .from('user_favorites')
        .select('video_id, video_type, created_at')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (!favData || favData.length === 0) { setFavorites([]); setLoading(false); return; }

      const tiktokIds = favData.filter(f => f.video_type === 'tiktok').map(f => f.video_id);
      const reelIds = favData.filter(f => f.video_type === 'instagram_reel').map(f => f.video_id);
      const items: FavoriteVideoItem[] = [];

      if (tiktokIds.length > 0) {
        const [videosRes, aiRes, soundRes, assetsRes] = await Promise.all([
          supabase.from('0.1. Table 2 - Video - TikTok').select('id, caption, video_views, video_likes, video_url, video_embedded_url').in('id', tiktokIds),
          supabase.from('0.1. Table 5 - Ai - TikTok').select('video_id, content_style').in('video_id', tiktokIds),
          supabase.from('0.1. Table 3 - Sound - TikTok').select('video_id, genre').in('video_id', tiktokIds),
          supabase.from('0.1. Table 4 - Assets - TikTok').select('video_id, thumbnail_url').in('video_id', tiktokIds),
        ]);

        const aiMap = new Map<number, any>();
        (aiRes.data || []).forEach((r: any) => r.video_id && aiMap.set(r.video_id, r));
        const soundMap = new Map<number, any>();
        (soundRes.data || []).forEach((r: any) => r.video_id && soundMap.set(r.video_id, r));
        const thumbMap = new Map<number, string>();
        (assetsRes.data || []).forEach((r: any) => { if (r.video_id && r.thumbnail_url) thumbMap.set(r.video_id, r.thumbnail_url); });

        (videosRes.data || []).forEach((v: any) => {
          items.push({
            id: v.id,
            type: 'tiktok',
            caption: v.caption,
            video_views: v.video_views || 0,
            video_likes: v.video_likes || 0,
            thumbnail_url: fixSupabaseStorageUrl(thumbMap.get(v.id)) || undefined,
            content_style: aiMap.get(v.id)?.content_style,
            genre: getPrimaryGenre(soundMap.get(v.id)?.genre) || undefined,
            embedded_ulr: v.video_embedded_url,
            video_url: v.video_url,
          });
        });
      }

      if (reelIds.length > 0) {
        const [reelsRes, aiRes, soundRes, assetsRes] = await Promise.all([
          supabase.from('0.1. Table 2.2 - Video - Reels').select('id, caption, video_views, video_likes, video_url, video_embedded_url').in('id', reelIds),
          supabase.from('0.1. Table 5.2 - Ai - Reels').select('video_id, content_style').in('video_id', reelIds),
          supabase.from('0.1. Table 3.2 - Sound - Reels').select('video_id, genre').in('video_id', reelIds),
          supabase.from('0.1. Table 4.2 - Assets - Reels').select('video_id, thumbnail_url').in('video_id', reelIds),
        ]);

        const aiMap = new Map<number, any>();
        (aiRes.data || []).forEach((r: any) => r.video_id && aiMap.set(r.video_id, r));
        const soundMap = new Map<number, any>();
        (soundRes.data || []).forEach((r: any) => r.video_id && soundMap.set(r.video_id, r));
        const thumbMap = new Map<number, string>();
        (assetsRes.data || []).forEach((r: any) => { if (r.video_id && r.thumbnail_url) thumbMap.set(r.video_id, r.thumbnail_url); });

        (reelsRes.data || []).forEach((r: any) => {
          items.push({
            id: r.id,
            type: 'instagram_reel',
            caption: r.caption,
            video_views: r.video_views || 0,
            video_likes: r.video_likes || 0,
            thumbnail_url: fixSupabaseStorageUrl(thumbMap.get(r.id)) || undefined,
            content_style: aiMap.get(r.id)?.content_style,
            genre: getPrimaryGenre(soundMap.get(r.id)?.genre) || undefined,
            embedded_ulr: r.video_embedded_url,
            video_url: r.video_url,
          });
        });
      }

      setFavorites(items);
    } catch (error) {
      console.error('Error loading favorites for selector:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toString();
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[9/16] rounded-xl" />
        ))}
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="text-center py-12">
        <Heart className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
        <h3 className="text-lg font-semibold mb-2">No favorites yet</h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Save videos from Discover to create content plans based on them
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {favorites.map((fav, i) => {
          const isSelected = selected?.id === fav.id && selected?.type === fav.type;
          const genreColors = fav.genre ? getGenreColor(fav.genre) : null;

          return (
            <motion.button
              key={`${fav.type}-${fav.id}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => setSelected(isSelected ? null : fav)}
              className={cn(
                "group relative rounded-xl overflow-hidden border-2 transition-all duration-200 text-left",
                isSelected
                  ? "border-primary ring-2 ring-primary/30 scale-[1.02]"
                  : "border-transparent hover:border-border/60"
              )}
            >
              {/* Thumbnail */}
              <div className="aspect-[9/16] bg-muted relative overflow-hidden">
                {fav.thumbnail_url ? (
                  <img
                    src={fav.thumbnail_url}
                    alt={fav.caption || 'Video'}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <Eye className="w-8 h-8 text-muted-foreground/30" />
                  </div>
                )}

                {/* Selected check */}
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-primary flex items-center justify-center shadow-lg"
                  >
                    <CheckCircle2 className="w-4 h-4 text-primary-foreground" />
                  </motion.div>
                )}

                {/* Overlay info */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 pt-8">
                  {fav.genre && genreColors && (
                    <Badge
                      className="text-[10px] mb-1.5 px-2 py-0.5 border"
                      style={{ backgroundColor: genreColors.bg, color: genreColors.text, borderColor: genreColors.border }}
                    >
                      {fav.genre}
                    </Badge>
                  )}
                  {fav.content_style && (
                    <p className="text-[10px] text-white/70 truncate">{fav.content_style}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] text-white/80 font-medium">
                      {formatNumber(fav.video_views || 0)} views
                    </span>
                  </div>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Action button */}
      {selected && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center"
        >
          <Button
            size="lg"
            onClick={() => onSelect(selected)}
            disabled={externalLoading}
            className="px-8 gap-2"
          >
            {externalLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating Plan...
              </>
            ) : (
              <>
                Create Content Plan
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </motion.div>
      )}
    </div>
  );
}
