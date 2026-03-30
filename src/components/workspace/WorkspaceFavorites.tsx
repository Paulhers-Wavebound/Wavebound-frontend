import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { getPrimaryGenre } from '@/utils/genreParser';
import { fixSupabaseStorageUrl } from '@/services/contentDataService';
import VideoDetailsModal from '@/components/VideoDetailsModal';
import { Input } from '@/components/ui/input';
import { 
  Heart, 
  Grid, 
  List,
  Trash2,
  Search,
  FolderInput,
  CheckSquare,
  X,
  SortAsc,
  SortDesc,
  Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useFavorites } from '@/hooks/useFavorites';
import { useFavoriteFolders } from '@/hooks/useFavoriteFolders';
import { useDiscover } from '@/contexts/DiscoverContext';
import { useAISidebar } from '@/contexts/AISidebarContext';
import { toast } from 'sonner';
import { 
  DndContext, 
  DragEndEvent, 
  DragOverlay,
  useSensor, 
  useSensors, 
  PointerSensor,
  closestCenter
} from '@dnd-kit/core';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FavoritesFolderSidebar } from './FavoritesFolderSidebar';
import { DraggableFavoriteItem, FavoriteItem } from './DraggableFavoriteItem';
import { Video } from '@/types/content';

interface WorkspaceFavoritesProps {
  userId: string;
}

type SortOption = 'newest' | 'oldest' | 'views' | 'likes';

export function WorkspaceFavorites({ userId }: WorkspaceFavoritesProps) {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [activeDragItem, setActiveDragItem] = useState<FavoriteItem | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<FavoriteItem | null>(null);
  
  const { toggleFavorite } = useFavorites();
  const { folders, moveFavoriteToFolder } = useFavoriteFolders();
  const { sendVideoToAI, showMoreLikeThis } = useDiscover();
  const { openSidebar } = useAISidebar();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    loadFavorites();
  }, [userId]);

  const loadFavorites = async () => {
    setLoading(true);
    try {
      const { data: favData } = await supabase
        .from('user_favorites')
        .select('video_id, video_type, created_at, folder_id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!favData || favData.length === 0) {
        setFavorites([]);
        setLoading(false);
        return;
      }

      const tiktokIds = favData.filter(f => f.video_type === 'tiktok').map(f => f.video_id);
      const reelIds = favData.filter(f => f.video_type === 'instagram_reel').map(f => f.video_id);
      const photoIds = favData.filter(f => f.video_type === 'photo_carousel').map(f => f.video_id);

      const allItems: FavoriteItem[] = [];

      // Load TikTok videos
      if (tiktokIds.length > 0) {
        const [videosRes, aiRes, soundRes, profileRes, assetsRes] = await Promise.all([
          supabase.from('0.1. Table 2 - Video - TikTok').select('*').in('id', tiktokIds),
          supabase.from('0.1. Table 5 - Ai - TikTok').select('video_id, content_style, hook').in('video_id', tiktokIds),
          supabase.from('0.1. Table 3 - Sound - TikTok').select('video_id, genre, sub_genre').in('video_id', tiktokIds),
          supabase.from('0.1. Table 1 - Profile - TikTok').select('video_id, handle, profile_followers').in('video_id', tiktokIds),
          supabase.from('0.1. Table 4 - Assets - TikTok').select('video_id, thumbnail_url').in('video_id', tiktokIds),
        ]);

        const aiMap = new Map<number, any>();
        (aiRes.data || []).forEach((r: any) => r.video_id && aiMap.set(r.video_id, r));
        const soundMap = new Map<number, any>();
        (soundRes.data || []).forEach((r: any) => r.video_id && soundMap.set(r.video_id, r));
        const profileMap = new Map<number, any>();
        (profileRes.data || []).forEach((r: any) => r.video_id && profileMap.set(r.video_id, r));
        const thumbMap = new Map<number, string>();
        (assetsRes.data || []).forEach((r: any) => {
          if (r.video_id && r.thumbnail_url) thumbMap.set(r.video_id, r.thumbnail_url);
        });

        (videosRes.data || []).forEach((v: any) => {
          const fav = favData.find(f => f.video_id === v.id);
          const ai = aiMap.get(v.id) || {};
          const sound = soundMap.get(v.id) || {};
          const profile = profileMap.get(v.id) || {};
          allItems.push({
            id: v.id,
            type: 'tiktok',
            caption: v.caption,
            video_views: v.video_views || 0,
            video_likes: v.video_likes || 0,
            thumbnail_url: fixSupabaseStorageUrl(thumbMap.get(v.id)) || undefined,
            content_style: ai.content_style,
            genre: getPrimaryGenre(sound.genre) || undefined,
            sub_genre: getPrimaryGenre(sound.sub_genre) || undefined,
            created_at: fav?.created_at,
            folder_id: fav?.folder_id,
            video_url: v.video_url,
            embedded_ulr: v.video_embedded_url,
            hook: ai.hook,
            outliar_score: v.viral_score,
            profile_followers: profile.profile_followers,
            Artist: profile.handle,
          });
        });
      }

      // Load photo carousels
      if (photoIds.length > 0) {
        const { data: photoCarousels } = await supabase
          .from('tiktok_photo_carousel')
          .select('*')
          .in('id', photoIds);

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

        photoCarousels?.forEach(pc => {
          const fav = favData.find(f => f.video_id === pc.id && f.video_type === 'photo_carousel');
          allItems.push({
            id: pc.id,
            type: 'photo_carousel',
            caption: pc.caption,
            video_views: (pc as any).photo_views || (pc as any).video_views || 0,
            video_likes: (pc as any).photo_likes || (pc as any).video_likes || 0,
            thumbnail_url: fixSupabaseStorageUrl(pcThumbnailMap.get(pc.id)) || (pc as any).photo_url_1,
            content_style: pc.content_style,
            genre: getPrimaryGenre(pc.genre) || undefined,
            created_at: fav?.created_at,
            folder_id: fav?.folder_id,
            video_url: (pc as any).video_url,
            embedded_ulr: pc.embedded_url,
          });
        });
      }

      // Load Instagram reels
      if (reelIds.length > 0) {
        const [reelsRes, reelAiRes, reelSoundRes, reelProfileRes, reelAssetsRes, reelGifRes] = await Promise.all([
          supabase.from('0.1. Table 2.2 - Video - Reels').select('*').in('id', reelIds),
          supabase.from('0.1. Table 5.2 - Ai - Reels').select('video_id, content_style, hook').in('video_id', reelIds),
          supabase.from('0.1. Table 3.2 - Sound - Reels').select('video_id, genre, sub_genre').in('video_id', reelIds),
          supabase.from('0.1. Table 1.2 - Profile - Instagram').select('video_id, handle, profile_followers').in('video_id', reelIds),
          supabase.from('0.1. Table 4.2 - Assets - Reels').select('video_id, thumbnail_url').in('video_id', reelIds),
          supabase.from('media_assets_gif_thumbnail_Reels').select('video_id, url, thumbnail_url').in('video_id', reelIds),
        ]);

        const reelAiMap = new Map<number, any>();
        (reelAiRes.data || []).forEach((r: any) => r.video_id && reelAiMap.set(r.video_id, r));
        const reelSoundMap = new Map<number, any>();
        (reelSoundRes.data || []).forEach((r: any) => r.video_id && reelSoundMap.set(r.video_id, r));
        const reelProfileMap = new Map<number, any>();
        (reelProfileRes.data || []).forEach((r: any) => r.video_id && reelProfileMap.set(r.video_id, r));
        const reelThumbMap = new Map<number, string>();
        (reelAssetsRes.data || []).forEach((r: any) => {
          if (r.video_id && r.thumbnail_url) reelThumbMap.set(r.video_id, r.thumbnail_url);
        });
        (reelGifRes.data || []).forEach((r: any) => {
          if (r.video_id && !reelThumbMap.has(r.video_id)) {
            const url = r.thumbnail_url || r.url;
            if (url) reelThumbMap.set(r.video_id, url);
          }
        });

        (reelsRes.data || []).forEach((r: any) => {
          const fav = favData.find(f => f.video_id === r.id);
          const ai = reelAiMap.get(r.id) || {};
          const sound = reelSoundMap.get(r.id) || {};
          const profile = reelProfileMap.get(r.id) || {};
          allItems.push({
            id: r.id,
            type: 'instagram_reel',
            caption: r.caption,
            video_views: r.video_views || 0,
            video_likes: r.video_likes || 0,
            thumbnail_url: fixSupabaseStorageUrl(reelThumbMap.get(r.id)) || undefined,
            content_style: ai.content_style,
            genre: getPrimaryGenre(sound.genre) || undefined,
            sub_genre: getPrimaryGenre(sound.sub_genre) || undefined,
            created_at: fav?.created_at,
            folder_id: fav?.folder_id,
            video_url: r.video_url,
            embedded_ulr: r.video_embedded_url,
            hook: ai.hook,
            outliar_score: r.viral_score,
            profile_followers: profile.profile_followers,
            Artist: profile.handle,
          });
        });
      }

      allItems.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
      setFavorites(allItems);
    } catch (error) {
      console.error('Error loading favorites:', error);
      toast.error('Failed to load favorites');
    } finally {
      setLoading(false);
    }
  };

  // Compute folder counts
  const favoriteCounts = useMemo(() => {
    const byFolder: Record<string, number> = {};
    let uncategorized = 0;
    
    favorites.forEach(fav => {
      if (fav.folder_id) {
        byFolder[fav.folder_id] = (byFolder[fav.folder_id] || 0) + 1;
      } else {
        uncategorized++;
      }
    });

    return {
      all: favorites.length,
      uncategorized,
      byFolder,
    };
  }, [favorites]);

  // Filter and sort favorites
  const displayedFavorites = useMemo(() => {
    let filtered = [...favorites];

    // Filter by folder
    if (selectedFolderId === 'uncategorized') {
      filtered = filtered.filter(f => !f.folder_id);
    } else if (selectedFolderId) {
      filtered = filtered.filter(f => f.folder_id === selectedFolderId);
    }

    // Filter by search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(f => 
        f.caption?.toLowerCase().includes(q) ||
        f.content_style?.toLowerCase().includes(q) ||
        f.genre?.toLowerCase().includes(q)
      );
    }

    // Sort
    switch (sortBy) {
      case 'oldest':
        filtered.sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());
        break;
      case 'views':
        filtered.sort((a, b) => (b.video_views || 0) - (a.video_views || 0));
        break;
      case 'likes':
        filtered.sort((a, b) => (b.video_likes || 0) - (a.video_likes || 0));
        break;
      default: // newest
        filtered.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    }

    return filtered;
  }, [favorites, selectedFolderId, searchQuery, sortBy]);

  const handleRemove = async (item: FavoriteItem) => {
    await toggleFavorite(item.id, item.type);
    setFavorites(prev => prev.filter(f => !(f.id === item.id && f.type === item.type)));
    toast.success('Removed from favorites');
  };

  const handleBulkDelete = async () => {
    const itemsToDelete = favorites.filter(f => selectedItems.has(`${f.type}-${f.id}`));
    
    for (const item of itemsToDelete) {
      await toggleFavorite(item.id, item.type);
    }
    
    setFavorites(prev => prev.filter(f => !selectedItems.has(`${f.type}-${f.id}`)));
    setSelectedItems(new Set());
    setIsSelectionMode(false);
    toast.success(`Removed ${itemsToDelete.length} items`);
  };

  const handleBulkMoveToFolder = (folderId: string | null) => {
    const itemsToMove = favorites.filter(f => selectedItems.has(`${f.type}-${f.id}`));
    
    itemsToMove.forEach(item => {
      moveFavoriteToFolder({
        videoId: item.id,
        videoType: item.type,
        folderId,
      });
    });

    // Optimistic update
    setFavorites(prev => prev.map(f => 
      selectedItems.has(`${f.type}-${f.id}`) ? { ...f, folder_id: folderId } : f
    ));
    
    setSelectedItems(new Set());
    setIsSelectionMode(false);
  };

  const toggleSelectItem = (itemKey: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemKey)) {
        newSet.delete(itemKey);
      } else {
        newSet.add(itemKey);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    setSelectedItems(new Set(displayedFavorites.map(f => `${f.type}-${f.id}`)));
  };

  const clearSelection = () => {
    setSelectedItems(new Set());
    setIsSelectionMode(false);
  };

  const handleDragStart = (event: any) => {
    const { active } = event;
    const item = favorites.find(f => `${f.type}-${f.id}` === active.id);
    setActiveDragItem(item || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragItem(null);
    
    if (!over) return;
    
    const itemId = active.id as string;
    const targetFolderId = over.id as string;
    
    // Find the item
    const item = favorites.find(f => `${f.type}-${f.id}` === itemId);
    if (!item) return;

    // Determine target folder
    let newFolderId: string | null = null;
    if (targetFolderId === 'all' || targetFolderId === 'uncategorized') {
      newFolderId = null;
    } else if (targetFolderId !== item.folder_id) {
      newFolderId = targetFolderId;
    } else {
      return; // Same folder, no change
    }

    // Move the item
    moveFavoriteToFolder({
      videoId: item.id,
      videoType: item.type,
      folderId: newFolderId,
    });

    // Optimistic update
    setFavorites(prev => prev.map(f => 
      f.id === item.id && f.type === item.type 
        ? { ...f, folder_id: newFolderId } 
        : f
    ));
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toString();
  };

  // Convert FavoriteItem to Video-like object for AI context
  const favoriteToVideo = useCallback((item: FavoriteItem): Video => {
    return {
      id: item.id,
      video_views: item.video_views,
      video_likes: item.video_likes,
      content_style: item.content_style,
      genre: item.genre,
      sub_genre: item.sub_genre,
      caption: item.caption,
      thumbnail_url: item.thumbnail_url,
      hook: item.hook,
      outliar_score: item.outliar_score,
      profile_followers: item.profile_followers,
      Artist: item.Artist,
      is_reel: item.type === 'instagram_reel',
      video_url: item.video_url || item.embedded_ulr || '',
      embedded_ulr: item.embedded_ulr || item.video_url || '',
    } as Video;
  }, []);

  // Handle Ask AI action
  const handleAskAI = useCallback((item: FavoriteItem) => {
    const video = favoriteToVideo(item);
    sendVideoToAI(video);
    openSidebar();
  }, [favoriteToVideo, sendVideoToAI, openSidebar]);

  // Handle Show More Like This action
  const handleShowMoreLikeThis = useCallback((item: FavoriteItem) => {
    const video = favoriteToVideo(item);
    showMoreLikeThis(video);
    navigate('/discover');
  }, [favoriteToVideo, showMoreLikeThis, navigate]);

  const handleOpenVideo = useCallback((item: FavoriteItem) => {
    setSelectedVideo(item);
  }, []);

  const handleMoveToFolder = useCallback((item: FavoriteItem, folderId: string | null) => {
    moveFavoriteToFolder({
      videoId: item.id,
      videoType: item.type,
      folderId,
    });
    // Optimistic update
    setFavorites(prev => prev.map(f => 
      f.id === item.id && f.type === item.type 
        ? { ...f, folder_id: folderId } 
        : f
    ));
    const folderName = folderId ? folders.find(f => f.id === folderId)?.name || 'folder' : 'Uncategorized';
    toast.success(`Moved to ${folderName}`);
  }, [moveFavoriteToFolder, folders]);

  const currentFolderName = selectedFolderId === null 
    ? 'All Favorites' 
    : selectedFolderId === 'uncategorized' 
    ? 'Uncategorized'
    : folders.find(f => f.id === selectedFolderId)?.name || 'Folder';

  if (loading) {
    return (
      <div className="h-full flex">
        <div className="w-56 border-r border-border/50 bg-muted/20 animate-pulse" />
        <div className="flex-1 p-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="aspect-[9/16] rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="h-full flex">
        <FavoritesFolderSidebar
          selectedFolderId={selectedFolderId}
          onSelectFolder={setSelectedFolderId}
          favoriteCounts={{ all: 0, uncategorized: 0, byFolder: {} }}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4 max-w-sm">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
              <Heart className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">No favorites yet</h3>
              <p className="text-sm text-muted-foreground">
                Save content from the Discover page to build your collection
              </p>
            </div>
            <Button onClick={() => navigate('/discover')} variant="outline">
              Go to Discover
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="h-full flex">
        {/* Folder Sidebar */}
        <FavoritesFolderSidebar
          selectedFolderId={selectedFolderId}
          onSelectFolder={setSelectedFolderId}
          favoriteCounts={favoriteCounts}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Toolbar */}
          <div className="border-b border-border/50 px-4 py-3 flex items-center gap-3 bg-muted/30">
            <div className="flex-1 min-w-0">
              <h2 className="font-medium text-foreground truncate">{currentFolderName}</h2>
              <p className="text-xs text-muted-foreground">
                {displayedFavorites.length} item{displayedFavorites.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Search */}
            <div className="relative w-48">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="pl-8 h-8 text-sm"
              />
            </div>

            {/* Sort */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  {sortBy === 'newest' || sortBy === 'oldest' ? (
                    sortBy === 'newest' ? <SortDesc className="w-4 h-4 mr-1" /> : <SortAsc className="w-4 h-4 mr-1" />
                  ) : (
                    <Filter className="w-4 h-4 mr-1" />
                  )}
                  Sort
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSortBy('newest')}>
                  Newest first
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('oldest')}>
                  Oldest first
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSortBy('views')}>
                  Most views
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('likes')}>
                  Most likes
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Selection mode toggle */}
            <Button
              variant={isSelectionMode ? 'secondary' : 'outline'}
              size="sm"
              className="h-8"
              onClick={() => {
                setIsSelectionMode(!isSelectionMode);
                setSelectedItems(new Set());
              }}
            >
              <CheckSquare className="w-4 h-4 mr-1" />
              Select
            </Button>

            {/* View toggle */}
            <div className="flex items-center gap-0.5 border border-border rounded-lg p-0.5">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-7 w-7"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-7 w-7"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Selection Actions Bar */}
          {isSelectionMode && selectedItems.size > 0 && (
            <div className="border-b border-border/50 px-4 py-2 flex items-center gap-3 bg-primary/5">
              <span className="text-sm font-medium text-primary">
                {selectedItems.size} selected
              </span>
              <Button variant="ghost" size="sm" onClick={selectAll}>
                Select all
              </Button>
              <div className="flex-1" />
              
              {/* Move to folder */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <FolderInput className="w-4 h-4 mr-1" />
                    Move to
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleBulkMoveToFolder(null)}>
                    Uncategorized
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {folders.map(folder => (
                    <DropdownMenuItem key={folder.id} onClick={() => handleBulkMoveToFolder(folder.id)}>
                      {folder.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </Button>

              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={clearSelection}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-auto p-4">
            {displayedFavorites.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center space-y-2">
                  <p className="text-muted-foreground">No items in this folder</p>
                  <p className="text-sm text-muted-foreground/70">
                    Drag items here or use the move option
                  </p>
                </div>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {displayedFavorites.map((item) => (
                  <DraggableFavoriteItem
                    key={`${item.type}-${item.id}`}
                    item={item}
                    viewMode={viewMode}
                    isSelected={selectedItems.has(`${item.type}-${item.id}`)}
                    isSelectionMode={isSelectionMode}
                    onToggleSelect={() => toggleSelectItem(`${item.type}-${item.id}`)}
                    onRemove={() => handleRemove(item)}
                    onAskAI={handleAskAI}
                    onShowMoreLikeThis={handleShowMoreLikeThis}
                    onClick={handleOpenVideo}
                    onMoveToFolder={handleMoveToFolder}
                    folders={folders}
                    formatNumber={formatNumber}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-2 max-w-3xl mx-auto">
                {displayedFavorites.map((item) => (
                  <DraggableFavoriteItem
                    key={`${item.type}-${item.id}`}
                    item={item}
                    viewMode={viewMode}
                    isSelected={selectedItems.has(`${item.type}-${item.id}`)}
                    isSelectionMode={isSelectionMode}
                    onToggleSelect={() => toggleSelectItem(`${item.type}-${item.id}`)}
                    onRemove={() => handleRemove(item)}
                    onAskAI={handleAskAI}
                    onShowMoreLikeThis={handleShowMoreLikeThis}
                    onClick={handleOpenVideo}
                    onMoveToFolder={handleMoveToFolder}
                    folders={folders}
                    formatNumber={formatNumber}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeDragItem && (
            <div className="aspect-[9/16] w-24 rounded-xl overflow-hidden bg-muted shadow-2xl opacity-90">
              {activeDragItem.thumbnail_url ? (
                <img 
                  src={activeDragItem.thumbnail_url} 
                  alt="" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5" />
              )}
            </div>
          )}
        </DragOverlay>
      </div>
    </DndContext>

    {/* Video Details Modal */}
    {selectedVideo && (
      <VideoDetailsModal
        video={favoriteToVideo(selectedVideo)}
        isOpen={!!selectedVideo}
        onClose={() => setSelectedVideo(null)}
      />
    )}
    </>
  );
}
