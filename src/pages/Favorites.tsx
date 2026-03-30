import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import HeaderAuth from "@/components/HeaderAuth";
import FooterSection from "@/components/FooterSection";
import SEOHead from "@/components/SEOHead";
import WaveboundLoader from "@/components/WaveboundLoader";
import CompactFavoriteCard from "@/components/CompactFavoriteCard";
import GridFavoriteCard from "@/components/GridFavoriteCard";
import VideoDetailsModal from "@/components/VideoDetailsModal";
import PhotoCarouselModal from "@/components/PhotoCarouselModal";
import { useFavorites } from "@/hooks/useFavorites";
import { useFavoriteFolders } from "@/hooks/useFavoriteFolders";
import FolderManager from "@/components/FolderManager";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DndContext, closestCenter, DragEndEvent, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { Star, Grid, List, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

const Favorites = () => {
  const [user, setUser] = useState<any>(null);
  const [allFavorites, setAllFavorites] = useState<any[]>([]);
  const [selectedContent, setSelectedContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'views' | 'type'>('date');
  const [viewMode, setViewMode] = useState<'compact' | 'grid'>('grid');
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { favoriteVideoIds, favoritePhotoIds, favoriteReelIds, loadFavorites } = useFavorites();
  const { folders, moveFavoriteToFolder } = useFavoriteFolders();
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate('/auth');
      return;
    }
    
    setUser(user);
    loadFavoriteContent(user.id);
  };

  const loadFavoriteContent = async (userId: string) => {
    setLoading(true);
    try {
      const { data: favorites, error: favError } = await supabase
        .from('user_favorites')
        .select('video_id, video_type, folder_id, sort_order, created_at')
        .eq('user_id', userId);

      if (favError) throw favError;

      const videoIds = favorites?.filter(f => f.video_type === 'tiktok').map(f => f.video_id) || [];
      const photoIds = favorites?.filter(f => f.video_type === 'photo_carousel').map(f => f.video_id) || [];
      const reelIds = favorites?.filter(f => f.video_type === 'instagram_reel').map(f => f.video_id) || [];

      const allContent: any[] = [];

      // Load TikTok videos
      if (videoIds.length > 0) {
        const { data: videos } = await supabase
          .from('tiktok_videos_all')
          .select('*')
          .in('id', videoIds);

        // Fetch from both old and new asset tables
        const [oldAssets, newAssets] = await Promise.all([
          supabase
            .from('media_assets_gif_thumbnail')
            .select('video_id, url, thumbnail_url')
            .in('video_id', videoIds),
          supabase
            .from('0.1. Table 4 - Assets - TikTok')
            .select('video_id, thumbnail_url')
            .in('video_id', videoIds)
        ]);

        // Build thumbnail map - prioritize new table, fallback to old
        const thumbnailMap = new Map<number, { gif?: string; thumb?: string }>();
        newAssets.data?.forEach((asset: any) => {
          if (asset.video_id && asset.thumbnail_url) {
            thumbnailMap.set(asset.video_id, { thumb: asset.thumbnail_url });
          }
        });
        oldAssets.data?.forEach((asset: any) => {
          if (asset.video_id) {
            const existing = thumbnailMap.get(asset.video_id) || {};
            if (!existing.thumb && asset.thumbnail_url) existing.thumb = asset.thumbnail_url;
            if (asset.url) existing.gif = asset.url;
            thumbnailMap.set(asset.video_id, existing);
          }
        });

        videos?.forEach(video => {
          const fav = favorites.find(f => f.video_id === video.id && f.video_type === 'tiktok');
          const assets = thumbnailMap.get(video.id);
          allContent.push({
            ...video,
            gif_url: assets?.gif,
            thumbnail_url: assets?.thumb,
            content_type: 'tiktok',
            folder_id: fav?.folder_id,
            sort_order: fav?.sort_order,
            favorited_at: fav?.created_at,
          });
        });
      }

      // Load photo carousels
      if (photoIds.length > 0) {
        const { data: photoCarousels } = await supabase
          .from('tiktok_photo_carousel')
          .select('*')
          .in('id', photoIds);

        // Fetch thumbnails from new asset table
        const { data: pcAssets } = await supabase
          .from('0.1. Table 4.1 - Assets - PC - TikTok')
          .select('video_id, thumbnail_url')
          .in('video_id', photoIds);

        const pcThumbnailMap = new Map<number, string>();
        pcAssets?.forEach((asset: any) => {
          if (asset.video_id && asset.thumbnail_url) {
            pcThumbnailMap.set(asset.video_id, asset.thumbnail_url);
          }
        });

        photoCarousels?.forEach(carousel => {
          const fav = favorites.find(f => f.video_id === carousel.id && f.video_type === 'photo_carousel');
          allContent.push({
            ...carousel,
            thumbnail_url: pcThumbnailMap.get(carousel.id) || carousel.photo_url_1,
            content_type: 'photo_carousel',
            folder_id: fav?.folder_id,
            sort_order: fav?.sort_order,
            favorited_at: fav?.created_at,
          });
        });
      }

      // Load Instagram reels
      if (reelIds.length > 0) {
        const { data: reels } = await supabase
          .from('reels_all')
          .select('*')
          .in('id', reelIds);

        // Fetch thumbnails from all available sources
        const [reelOldAssets, reelNewAssets] = await Promise.all([
          supabase
            .from('media_assets_gif_thumbnail_Reels')
            .select('video_id, url, thumbnail_url')
            .in('video_id', reelIds),
          supabase
            .from('0.1. Table 4.2 - Assets - Reels')
            .select('video_id, thumbnail_url')
            .in('video_id', reelIds)
        ]);

        // Build thumbnail map - try all sources
        const thumbnailMap = new Map<number, string>();
        
        // First: new assets table
        reelNewAssets.data?.forEach((asset: any) => {
          if (asset.video_id && asset.thumbnail_url) {
            thumbnailMap.set(asset.video_id, asset.thumbnail_url);
          }
        });
        
        // Second: old assets table (thumbnail_url or url)
        reelOldAssets.data?.forEach((asset: any) => {
          if (asset.video_id && !thumbnailMap.has(asset.video_id)) {
            const url = asset.thumbnail_url || asset.url;
            if (url) thumbnailMap.set(asset.video_id, url);
          }
        });

        reels?.forEach(reel => {
          const fav = favorites.find(f => f.video_id === reel.id && f.video_type === 'instagram_reel');
          // Use thumbnail from assets, or fallback to video_file_url for video poster
          const thumbnail = thumbnailMap.get(reel.id) || null;
          allContent.push({
            ...reel,
            thumbnail_url: thumbnail,
            video_file_url: reel.video_file_url, // Ensure video_file_url is available for video preview
            is_reel: true,
            content_type: 'instagram_reel',
            folder_id: fav?.folder_id,
            sort_order: fav?.sort_order,
            favorited_at: fav?.created_at,
          });
        });
      }

      setAllFavorites(allContent);
    } catch {
      // Error loading favorites silently handled
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${Math.floor(num / 1000000)}M`;
    if (num >= 1000) return `${Math.floor(num / 1000)}K`;
    return num.toString();
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    
    // Check if dropped on a folder
    const isValidDropTarget = over.id === 'all-favorites' || folders.some(f => f.id === over.id);
    if (!isValidDropTarget) return;
    
    // Extract content info from the active id (format: contentType-contentId-index)
    const activeIdStr = String(active.id);
    const parts = activeIdStr.split('-');
    const contentType = parts[0]; // 'tiktok', 'photo_carousel', or 'instagram_reel'
    const contentId = parseInt(parts[1]);
    
    const draggedFavorite = allFavorites.find(f => f.id === contentId && f.content_type === contentType);
    if (draggedFavorite) {
      const targetFolderId = over.id === 'all-favorites' ? null : String(over.id);
      // Skip if already in the target folder
      if (draggedFavorite.folder_id === targetFolderId) return;
      
      // Optimistically update local state immediately (no reload)
      setAllFavorites(prev => prev.map(item => 
        item.id === contentId && item.content_type === contentType
          ? { ...item, folder_id: targetFolderId }
          : item
      ));
      
      // Then sync with database
      moveFavoriteToFolder({ videoId: contentId, videoType: contentType, folderId: targetFolderId });
    }
  };

  // Filter and sort favorites
  const displayedFavorites = allFavorites
    .filter(item => selectedFolder === null || item.folder_id === selectedFolder)
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.favorited_at).getTime() - new Date(a.favorited_at).getTime();
      }
      if (sortBy === 'views') {
        const aViews = a.video_views || a.photo_views || 0;
        const bViews = b.video_views || b.photo_views || 0;
        return bViews - aViews;
      }
      if (sortBy === 'type') {
        return a.content_type.localeCompare(b.content_type);
      }
      return 0;
    });

  // Count favorites by folder
  const favoritesByFolder = allFavorites.reduce((acc, item) => {
    const key = item.folder_id || 'all';
    acc[key] = (acc[key] || 0) + 1;
    acc['all'] = (acc['all'] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <SEOHead 
          title="Favorites - Wavebound"
          description="Your saved content collection. Organize and revisit your best finds."
        />
        <HeaderAuth variant="light" />
        <div className="pt-32 px-6">
          <div className="max-w-4xl mx-auto text-center py-20">
            <WaveboundLoader size="lg" className="mx-auto mb-4" />
            <p className="text-muted-foreground">Loading your favorites...</p>
          </div>
        </div>
      </div>
    );
  }

  const totalFavorites = allFavorites.length;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title="Favorites - Wavebound"
        description="Your saved content collection. Organize and revisit your best finds."
      />
      <HeaderAuth variant="light" />
      
      {/* Compact Header - matching My Plans style */}
      <section className="border-b border-border bg-card/50 pt-24 pb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                Your <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">Favorites</span>
              </h1>
              <p className="text-muted-foreground mt-1">
                {totalFavorites} saved {totalFavorites === 1 ? 'item' : 'items'} • Organize and revisit your best finds
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                <SelectTrigger className="w-36 bg-background border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date Added</SelectItem>
                  <SelectItem value="views">Most Views</SelectItem>
                  <SelectItem value="type">Type</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex gap-1 bg-background border border-border/50 rounded-lg p-1">
                <Button
                  size="sm"
                  variant={viewMode === 'compact' ? 'secondary' : 'ghost'}
                  onClick={() => setViewMode('compact')}
                  className="h-8 px-3"
                >
                  <List className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  onClick={() => setViewMode('grid')}
                  className="h-8 px-3"
                >
                  <Grid className="w-4 h-4" />
                </Button>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="px-6 pb-12">
        <div className="max-w-7xl mx-auto">
          {totalFavorites === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <div className="bg-card border border-border/50 rounded-2xl p-12 max-w-md mx-auto shadow-sm">
                <div className="w-16 h-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                  <Star className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No favorites yet</h3>
                <p className="text-muted-foreground mb-6">
                  Start adding content to your favorites to build your collection!
                </p>
                <Button onClick={() => navigate('/discover')} className="rounded-xl">
                  Discover Content
                </Button>
              </div>
            </motion.div>
          ) : (
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter} 
              onDragStart={(event) => setActiveDragId(String(event.active.id))}
              onDragEnd={(event) => {
                setActiveDragId(null);
                handleDragEnd(event);
              }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-start">
                {/* Sidebar - sticky on scroll */}
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="bg-card border border-border/50 rounded-2xl p-4 shadow-sm lg:sticky lg:top-24 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto"
                >
                  <FolderManager
                    selectedFolder={selectedFolder}
                    onSelectFolder={setSelectedFolder}
                    favoritesByFolder={favoritesByFolder}
                    onDropToFolder={() => {
                      // Handle folder drop
                    }}
                  />
                </motion.div>

                {/* Content Grid */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  {displayedFavorites.length === 0 ? (
                    <div className="bg-card border border-border/50 rounded-2xl p-12 text-center shadow-sm">
                      <p className="text-muted-foreground">No items in this folder</p>
                    </div>
                  ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      {displayedFavorites.map((content, index) => (
                        <GridFavoriteCard
                          key={`${content.content_type}-${content.id}-${index}`}
                          content={content}
                          onOpen={() => setSelectedContent(content)}
                          formatNumber={formatNumber}
                          folders={folders}
                          currentFolderId={content.folder_id}
                          onMoveToFolder={(videoId, videoType, folderId) => {
                            setAllFavorites(prev => prev.map(item => 
                              item.id === videoId && item.content_type === videoType
                                ? { ...item, folder_id: folderId }
                                : item
                            ));
                            moveFavoriteToFolder({ videoId, videoType, folderId });
                          }}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {displayedFavorites.map((content, index) => (
                        <CompactFavoriteCard
                          key={`${content.content_type}-${content.id}-${index}`}
                          id={`${content.content_type}-${content.id}-${index}`}
                          content={content}
                          onOpen={() => setSelectedContent(content)}
                          formatNumber={formatNumber}
                          folders={folders}
                          currentFolderId={content.folder_id}
                          onMoveToFolder={(videoId, videoType, folderId) => {
                            setAllFavorites(prev => prev.map(item => 
                              item.id === videoId && item.content_type === videoType
                                ? { ...item, folder_id: folderId }
                                : item
                            ));
                            moveFavoriteToFolder({ videoId, videoType, folderId });
                          }}
                        />
                      ))}
                    </div>
                  )}
                </motion.div>
              </div>
              <DragOverlay>
                {activeDragId ? (
                  <div className="bg-card border border-primary rounded-xl p-3 shadow-xl opacity-90">
                    <span className="text-sm font-medium">Moving item...</span>
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          )}
        </div>
      </div>

      {/* Modal */}
      {selectedContent && (
        selectedContent.content_type === 'photo_carousel' ? (
          <PhotoCarouselModal
            photoCarousel={selectedContent}
            isOpen={!!selectedContent}
            onClose={() => setSelectedContent(null)}
          />
        ) : (
          <VideoDetailsModal
            video={selectedContent}
            isOpen={!!selectedContent}
            onClose={() => setSelectedContent(null)}
          />
        )
      )}
      <FooterSection />
    </div>
  );
};

export default Favorites;
