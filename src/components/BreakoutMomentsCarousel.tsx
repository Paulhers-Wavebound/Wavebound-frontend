import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import TikTokThumbnail from './TikTokThumbnail';

// Continuous scroll carousel for this week's breakout videos - auto-updates on new entries

interface BreakoutVideo {
  id: number;
  thumbnail_url?: string;
  video_views?: number;
  video_likes?: number;
  viral_score?: number;
  date_posted?: string;
  video_embedded_url?: string;
  video_url?: string | null;
  post_id?: number | null;
}

const BreakoutMomentsCarousel = () => {
  const [videos, setVideos] = useState<BreakoutVideo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBreakoutVideos = useCallback(async () => {
    try {
      // Calculate date range for recent videos (last 14 days to ensure enough content)
      const now = new Date();
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      const twoWeeksAgoStr = twoWeeksAgo.toISOString().split('T')[0];

      // Fetch this week's videos from the normalized table, ordered by most recent
      const { data: videoData, error } = await supabase
        .from('0.1. Table 2 - Video - TikTok')
        .select(`
          id,
          post_id,
          video_views,
          video_likes,
          viral_score,
          date_posted,
          video_embedded_url,
          video_url
        `)
        .gte('date_posted', twoWeeksAgoStr)
        .order('date_posted', { ascending: false })
        .limit(12);

      if (error) throw error;

      if (videoData && videoData.length > 0) {
        const videoIds = videoData.map(v => v.id);
        
        // Fetch thumbnails from assets table
        const { data: thumbnails } = await supabase
          .from('0.1. Table 4 - Assets - TikTok')
          .select('video_id, thumbnail_url')
          .in('video_id', videoIds);

        const thumbnailMap = new Map(
          thumbnails?.map(t => [t.video_id, t.thumbnail_url]) || []
        );

        const videosWithThumbnails = videoData.map(v => ({
          ...v,
          thumbnail_url: thumbnailMap.get(v.id) || undefined
        }));

        setVideos(videosWithThumbnails);
      }
    } catch (error) {
      console.error('Error fetching breakout videos:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBreakoutVideos();

    // Subscribe to realtime updates for new videos
    const channel = supabase
      .channel('breakout-videos-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: '0.1. Table 2 - Video - TikTok'
        },
        () => {
          // Refetch when new video is added
          fetchBreakoutVideos();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchBreakoutVideos]);

  const formatViews = (views: number) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(0)}K`;
    return views.toString();
  };

  if (loading) {
    return (
      <section className="py-16 px-6 bg-white dark:bg-gray-800">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse flex gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex-shrink-0 w-32">
                <div className="aspect-[9/16] bg-muted rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (videos.length === 0) return null;

  // Triple videos for seamless loop with no gaps
  const triplicatedVideos = [...videos, ...videos, ...videos];

  return (
    <section className="py-16 px-6 bg-white dark:bg-gray-800 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        {/* Editorial Header */}
        <div className="text-center mb-8">
          <span className="inline-block text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] mb-4">
            Curated Collection
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
            This Week's{" "}
            <span className="bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500 bg-clip-text text-transparent">
              Breakout Moments
            </span>
          </h2>
        </div>

        {/* Continuous Scroll Carousel */}
        <div className="relative group overflow-hidden">
          <motion.div 
            className="flex gap-2"
            animate={{ x: ['-33.33%', '-66.66%'] }}
            transition={{
              x: {
                repeat: Infinity,
                repeatType: 'loop',
                duration: 30,
                ease: 'linear',
              },
            }}
          >
            {triplicatedVideos.map((video, idx) => (
              <div
                key={`${video.id}-${idx}`}
                className="flex-shrink-0 w-[28%] sm:w-[22%] md:w-[18%] lg:w-[14%] cursor-pointer group/card"
              >
                <div className="relative aspect-[9/16] rounded-lg overflow-hidden bg-muted">
                  <TikTokThumbnail
                    videoId={video.id}
                    tiktokUrl={
                      video.video_embedded_url ||
                      video.video_url ||
                      (video.post_id ? `https://www.tiktok.com/@tiktok/video/${video.post_id}` : '')
                    }
                    fallbackThumbnail={video.thumbnail_url}
                    className="w-full h-full group-hover/card:scale-105 transition-transform duration-300"
                  />
                  
                  {/* Subtle gradient on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity pointer-events-none" />

                  {/* Viral badge */}
                  {video.viral_score && video.viral_score > 1 && (
                    <Badge className="absolute top-1.5 left-1.5 bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 text-[9px] px-1.5 py-0 font-semibold">
                      {video.viral_score.toFixed(1)}x
                    </Badge>
                  )}

                  {/* Bottom stats */}
                  <div className="absolute inset-x-0 bottom-0 p-1.5 opacity-0 group-hover/card:opacity-100 transition-opacity">
                    <div className="flex items-center gap-1.5 text-white text-[10px]">
                      <span className="flex items-center gap-0.5">
                        <Eye className="w-2.5 h-2.5" />
                        {formatViews(video.video_views || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default BreakoutMomentsCarousel;
