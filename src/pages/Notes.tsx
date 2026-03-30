import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import HeaderAuth from '@/components/HeaderAuth';
import FooterSection from '@/components/FooterSection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Save, Loader2, Bold, Italic, Underline, List, ListOrdered, 
  Heading1, Heading2, Palette, Share2, Copy, Check, FileText,
  Heart, Video, Image, GripVertical, ChevronLeft, ChevronRight,
  Search, ExternalLink, PanelLeftClose, PanelLeft
} from 'lucide-react';
import { toast } from 'sonner';
import VideoDetailsModal from '@/components/VideoDetailsModal';
import PhotoCarouselModal from '@/components/PhotoCarouselModal';
import { Video as BaseVideo, PhotoCarousel as BasePhotoCarousel } from '@/types/content';
import * as BadgeDragDrop from '@/utils/badgeDragDrop';
import { fixSupabaseStorageUrl } from '@/services/contentDataService';
import { cn } from '@/lib/utils';
import SEOHead from '@/components/SEOHead';

type Video = BaseVideo & { Artist?: string };
type PhotoCarousel = BasePhotoCarousel & { "who?"?: string };

interface FavoriteItem {
  id: number;
  type: 'tiktok' | 'photo_carousel' | 'instagram_reel';
  title: string;
  thumbnail_url?: string;
  video_views?: number;
  outliar_score?: number;
}

const NotesPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [favoritesLoading, setFavoritesLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoCarousel | null>(null);
  const [hoveredBadge, setHoveredBadge] = useState<any>(null);
  
  const editorRef = useRef<HTMLDivElement>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasLoadedRef = useRef(false);
  const draggedBadgeRef = useRef<HTMLElement | null>(null);
  const dropIndicatorRef = useRef<HTMLElement | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auth check
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        navigate('/auth');
      } else {
        setUser(session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session?.user) {
        navigate('/auth');
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Load notes
  useEffect(() => {
    if (!user) return;
    loadNotes();
    loadFavorites();
  }, [user]);

  const loadNotes = async () => {
    try {
      const cachedContent = localStorage.getItem('workspace_notes_cache');
      
      const { data, error } = await supabase
        .from('workspace_notes')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setWorkspaceId(data.id);
        const contentToLoad = cachedContent !== null ? cachedContent : (data.notes || '');
        
        if (!hasLoadedRef.current) {
          setTimeout(() => {
            if (editorRef.current) {
              editorRef.current.innerHTML = contentToLoad;
              hasLoadedRef.current = true;
              
              setTimeout(() => {
                const badges = editorRef.current?.querySelectorAll('[data-type]');
                badges?.forEach(setupBadgeDraggable);
              }, 50);
              
              if (cachedContent && data.notes && cachedContent === data.notes) {
                localStorage.removeItem('workspace_notes_cache');
              }
            }
          }, 0);
        }
      } else if (cachedContent !== null) {
        setTimeout(() => {
          if (editorRef.current) {
            editorRef.current.innerHTML = cachedContent;
            hasLoadedRef.current = true;
            setTimeout(() => {
              const badges = editorRef.current?.querySelectorAll('[data-type]');
              badges?.forEach(setupBadgeDraggable);
            }, 50);
          }
        }, 0);
      }
    } catch (error) {
      console.error('Error loading notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFavorites = async () => {
    setFavoritesLoading(true);
    try {
      const { data: favData } = await supabase
        .from('user_favorites')
        .select('video_id, video_type')
        .eq('user_id', user.id);

      const items: FavoriteItem[] = [];

      // Load TikToks
      const tiktokIds = favData?.filter(f => f.video_type === 'tiktok').map(f => f.video_id) || [];
      if (tiktokIds.length > 0) {
        const { data: tiktoks } = await supabase
          .from('tiktok_videos_all')
          .select('id, content_style, genre, video_views, outliar_score')
          .in('id', tiktokIds);

        const { data: assets } = await supabase
          .from('media_assets_gif_thumbnail')
          .select('video_id, thumbnail_url')
          .in('video_id', tiktokIds);

        const thumbnailMap = new Map(assets?.map(a => [a.video_id, a.thumbnail_url]) || []);

        tiktoks?.forEach(v => {
          items.push({
            id: v.id,
            type: 'tiktok',
            title: v.content_style || v.genre || 'TikTok',
            thumbnail_url: thumbnailMap.get(v.id) || undefined,
            video_views: v.video_views,
            outliar_score: v.outliar_score
          });
        });
      }

      // Load Photo Carousels
      const photoIds = favData?.filter(f => f.video_type === 'photo_carousel').map(f => f.video_id) || [];
      if (photoIds.length > 0) {
        const { data: photos } = await supabase
          .from('tiktok_photo_carousel')
          .select('id, content_style, genre, photo_views, outliar_score, photo_url_1')
          .in('id', photoIds);

        photos?.forEach(p => {
          items.push({
            id: p.id,
            type: 'photo_carousel',
            title: p.content_style || p.genre || 'Photo Carousel',
            thumbnail_url: fixSupabaseStorageUrl(p.photo_url_1) || undefined,
            video_views: p.photo_views,
            outliar_score: p.outliar_score
          });
        });
      }

      // Load Reels
      const reelIds = favData?.filter(f => f.video_type === 'instagram_reel').map(f => f.video_id) || [];
      if (reelIds.length > 0) {
        const { data: reels } = await supabase
          .from('reels_all')
          .select('id, content_style, genre, video_views, outliar_score')
          .in('id', reelIds);

        const { data: reelAssets } = await supabase
          .from('media_assets_gif_thumbnail_Reels')
          .select('video_id, thumbnail_url')
          .in('video_id', reelIds);

        const reelThumbnailMap = new Map(reelAssets?.map(a => [a.video_id, a.thumbnail_url]) || []);

        reels?.forEach(r => {
          items.push({
            id: r.id,
            type: 'instagram_reel',
            title: r.content_style || r.genre || 'Reel',
            thumbnail_url: reelThumbnailMap.get(r.id) || undefined,
            video_views: r.video_views,
            outliar_score: r.outliar_score
          });
        });
      }

      items.sort((a, b) => (b.outliar_score || 0) - (a.outliar_score || 0));
      setFavorites(items);
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setFavoritesLoading(false);
    }
  };

  const saveNotes = useCallback(async (showToast = false) => {
    if (!user || !editorRef.current) return;

    setSaving(true);
    try {
      const content = editorRef.current.innerHTML;
      localStorage.setItem('workspace_notes_cache', content);
      
      if (workspaceId) {
        const { error } = await supabase
          .from('workspace_notes')
          .update({ notes: content })
          .eq('id', workspaceId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('workspace_notes')
          .insert({ user_id: user.id, notes: content })
          .select()
          .single();
        if (error) throw error;
        setWorkspaceId(data.id);
      }

      setLastSaved(new Date());
      if (showToast) toast.success('Saved!');
    } catch (error) {
      toast.error('Failed to save notes');
    } finally {
      setSaving(false);
    }
  }, [user, workspaceId]);

  const triggerAutoSave = useCallback((immediate = false) => {
    if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
    
    if (editorRef.current) {
      localStorage.setItem('workspace_notes_cache', editorRef.current.innerHTML);
    }

    if (immediate) {
      saveNotes(false);
    } else {
      autoSaveTimeoutRef.current = setTimeout(() => saveNotes(false), 1500);
    }
  }, [saveNotes]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (editorRef.current) {
        localStorage.setItem('workspace_notes_cache', editorRef.current.innerHTML);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
    };
  }, []);

  const applyFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    triggerAutoSave();
  };

  const applyHeading = (level: 'h1' | 'h2') => {
    document.execCommand('formatBlock', false, level);
    editorRef.current?.focus();
    triggerAutoSave();
  };

  const applyColor = (color: string) => {
    document.execCommand('foreColor', false, color);
    editorRef.current?.focus();
    triggerAutoSave();
  };

  const handleShare = async () => {
    if (!user || !editorRef.current) return;
    const content = editorRef.current.innerHTML;
    if (!content?.trim()) {
      toast.error('Add content before sharing');
      return;
    }

    try {
      const shareId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const { error } = await supabase
        .from('shared_workspace_notes')
        .insert({
          user_id: user.id,
          share_id: shareId,
          notes_content: content,
          title: 'Planning Notes'
        });
      if (error) throw error;

      const link = `${window.location.origin}/share/${shareId}`;
      setShareLink(link);
      toast.success('Share link created!');
    } catch (error) {
      toast.error('Failed to create share link');
    }
  };

  const copyShareLink = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink);
      setCopied(true);
      toast.success('Link copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Badge handlers
  const handleBadgeClick = async (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    const badge = target.closest('[data-type]') as HTMLElement;
    if (!badge) return;
    
    const type = badge.getAttribute('data-type');
    const videoId = badge.getAttribute('data-video-id');
    const photoId = badge.getAttribute('data-photo-id');
    const reelId = badge.getAttribute('data-reel-id');
    
    if (type === 'video' && videoId) {
      const { data } = await supabase.from('tiktok_videos_all').select('*').eq('id', parseInt(videoId)).single();
      if (data) setSelectedVideo(data);
    } else if (type === 'photo' && photoId) {
      const { data } = await supabase.from('tiktok_photo_carousel').select('*').eq('id', parseInt(photoId)).single();
      if (data) setSelectedPhoto(data);
    } else if (type === 'reel' && reelId) {
      const { data: reelData } = await supabase.from('reels_all').select('*').eq('id', parseInt(reelId)).single();
      if (reelData) {
        const reelAsVideo: Video = {
          id: reelData.id,
          video_url: reelData.video_url || reelData.embedded_url,
          embedded_ulr: reelData.embedded_url,
          outliar_score: reelData.outliar_score || 0,
          video_views: reelData.video_views || 0,
          video_likes: reelData.video_likes || 0,
          comments: reelData.comments || '',
          profile_followers: reelData.profile_followers || 0,
          caption: reelData.caption,
          hook: reelData.hook,
          genre: reelData.genre,
          sub_genre: reelData.sub_genre,
          content_style: reelData.content_style,
          gender: reelData.gender,
          date_posted: reelData.date_posted,
          Artist: reelData.Artist,
          profile_bio: reelData.profile_bio,
          gif_url: null,
          thumbnail_url: null,
          video_file_url: reelData.video_file_url,
          is_reel: true,
        };
        setSelectedVideo(reelAsVideo);
      }
    }
  };

  const setupBadgeDraggable = (badge: Element) => {
    BadgeDragDrop.setupBadgeDraggable(badge, draggedBadgeRef, dropIndicatorRef, () => setHoveredBadge(null));
  };

  const handleEditorDragOver = (event: DragEvent) => {
    BadgeDragDrop.handleEditorDragOver(event, editorRef.current, draggedBadgeRef, dropIndicatorRef);
  };

  const handleEditorDrop = (event: DragEvent) => {
    BadgeDragDrop.handleEditorDrop(
      event,
      editorRef.current,
      draggedBadgeRef,
      dropIndicatorRef,
      () => triggerAutoSave(true),
      setupBadgeDraggable
    );
    setTimeout(() => {
      const badges = editorRef.current?.querySelectorAll('[data-type]');
      badges?.forEach(setupBadgeDraggable);
    }, 100);
  };

  const handleEditorDragLeave = (event: DragEvent) => {
    BadgeDragDrop.handleEditorDragLeave(event, editorRef.current, dropIndicatorRef);
  };

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const setupAllBadges = () => {
      const badges = editor.querySelectorAll('[data-type]');
      badges.forEach(setupBadgeDraggable);
    };

    setTimeout(setupAllBadges, 100);

    const observer = new MutationObserver(() => setTimeout(setupAllBadges, 50));
    observer.observe(editor, { childList: true, subtree: true });

    editor.addEventListener('click', handleBadgeClick);
    editor.addEventListener('dragover', handleEditorDragOver);
    editor.addEventListener('drop', handleEditorDrop);
    editor.addEventListener('dragleave', handleEditorDragLeave);

    return () => {
      observer.disconnect();
      editor.removeEventListener('click', handleBadgeClick);
      editor.removeEventListener('dragover', handleEditorDragOver);
      editor.removeEventListener('drop', handleEditorDrop);
      editor.removeEventListener('dragleave', handleEditorDragLeave);
    };
  }, []);

  // Favorites drag handlers
  const handleDragStart = (e: React.DragEvent, item: FavoriteItem) => {
    const badgeHtml = createBadgeHtml(item);
    e.dataTransfer.setData('text/html', badgeHtml);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const createBadgeHtml = (item: FavoriteItem) => {
    const typeLabel = item.type === 'tiktok' ? 'TikTok' : item.type === 'instagram_reel' ? 'Reel' : 'Photo';
    const dataAttr = item.type === 'tiktok' 
      ? `data-video-id="${item.id}"` 
      : item.type === 'photo_carousel' 
        ? `data-photo-id="${item.id}"` 
        : `data-reel-id="${item.id}"`;
    
    return `<span 
      data-type="${item.type === 'instagram_reel' ? 'reel' : item.type === 'photo_carousel' ? 'photo' : 'video'}" 
      ${dataAttr}
      class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium cursor-pointer transition-colors"
      style="background: linear-gradient(135deg, hsl(var(--primary) / 0.15), hsl(var(--primary) / 0.08)); border: 1px solid hsl(var(--primary) / 0.3); color: hsl(var(--primary)); margin: 2px;"
      contenteditable="false"
    >
      <span style="font-size: 10px; opacity: 0.7;">${typeLabel}</span>
      <span style="font-weight: 600;">${item.title}</span>
      <span style="font-size: 10px; background: hsl(var(--primary)); color: white; padding: 1px 5px; border-radius: 10px;">#${Math.round(item.outliar_score || 0)}</span>
    </span>&nbsp;`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${Math.floor(num / 1000000)}M`;
    if (num >= 1000) return `${Math.floor(num / 1000)}K`;
    return num.toString();
  };

  const filteredFavorites = favorites.filter(f => {
    const matchesSearch = f.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || 
      (activeTab === 'tiktok' && f.type === 'tiktok') ||
      (activeTab === 'reels' && f.type === 'instagram_reel') ||
      (activeTab === 'photos' && f.type === 'photo_carousel');
    return matchesSearch && matchesTab;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead 
        title="Notes - Wavebound"
        description="Plan your content shoots, organize ideas, and drag favorites to create mood boards."
      />
      <HeaderAuth variant="light" />
      
      <div className="flex-1 flex pt-16">
        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col">
          {/* Header Bar */}
          <div className="flex items-center gap-3 px-6 py-3 border-b border-border bg-card/50">
            <FileText className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-semibold flex-1">Planning Notes</h1>
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {saving ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Saving...
                </>
              ) : lastSaved ? (
                <>Saved {lastSaved.toLocaleTimeString()}</>
              ) : null}
            </div>
            
            <Button size="sm" variant="ghost" onClick={() => saveNotes(true)} className="h-8">
              <Save className="w-4 h-4" />
            </Button>
            
            {shareLink ? (
              <Button size="sm" variant="outline" onClick={copyShareLink} className="h-8">
                {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                {copied ? 'Copied!' : 'Copy Link'}
              </Button>
            ) : (
              <Button size="sm" variant="outline" onClick={handleShare} className="h-8">
                <Share2 className="w-4 h-4 mr-1" />
                Share
              </Button>
            )}
            
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="h-8"
            >
              {sidebarCollapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </Button>
          </div>

          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-1 px-4 py-2 border-b border-border/50 bg-muted/30">
            <Button variant="ghost" size="sm" onClick={() => applyFormat('bold')} className="h-8 w-8 p-0">
              <Bold className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => applyFormat('italic')} className="h-8 w-8 p-0">
              <Italic className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => applyFormat('underline')} className="h-8 w-8 p-0">
              <Underline className="h-4 w-4" />
            </Button>

            <div className="w-px h-6 bg-border mx-1" />

            <Button variant="ghost" size="sm" onClick={() => applyHeading('h1')} className="h-8 w-8 p-0">
              <Heading1 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => applyHeading('h2')} className="h-8 w-8 p-0">
              <Heading2 className="h-4 w-4" />
            </Button>

            <div className="w-px h-6 bg-border mx-1" />

            <Button variant="ghost" size="sm" onClick={() => applyFormat('insertUnorderedList')} className="h-8 w-8 p-0">
              <List className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => applyFormat('insertOrderedList')} className="h-8 w-8 p-0">
              <ListOrdered className="h-4 w-4" />
            </Button>

            <div className="w-px h-6 bg-border mx-1" />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Palette className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => applyColor('hsl(var(--foreground))')}>
                  <div className="w-4 h-4 rounded-full bg-foreground mr-2" /> Default
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => applyColor('hsl(0, 84%, 60%)')}>
                  <div className="w-4 h-4 rounded-full bg-destructive mr-2" /> Red
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => applyColor('hsl(217, 91%, 60%)')}>
                  <div className="w-4 h-4 rounded-full bg-primary mr-2" /> Blue
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => applyColor('hsl(152, 76%, 40%)')}>
                  <div className="w-4 h-4 rounded-full bg-success mr-2" /> Green
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Editor */}
          <div className="flex-1 overflow-y-auto p-6 bg-background">
            <div
              ref={editorRef}
              contentEditable
              onInput={() => triggerAutoSave()}
              className="max-w-4xl mx-auto min-h-[600px] focus:outline-none prose prose-sm dark:prose-invert"
              style={{ fontSize: '16px', lineHeight: '1.7' }}
              data-placeholder="Start writing your notes, ideas, and plans. Drag favorites from the sidebar to add them here..."
            />
          </div>
        </div>

        {/* Favorites Sidebar */}
        <div className={cn(
          "border-l border-border bg-card/50 flex flex-col transition-all duration-300",
          sidebarCollapsed ? "w-0 overflow-hidden" : "w-72"
        )}>
          {!sidebarCollapsed && (
            <>
              {/* Sidebar Header */}
              <div className="p-4 border-b border-border/50">
                <div className="flex items-center gap-2 mb-3">
                  <Heart className="w-4 h-4 text-primary" />
                  <span className="font-medium">Favorites</span>
                  <span className="text-xs text-muted-foreground ml-auto">{favorites.length}</span>
                </div>
                
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search favorites..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8 pl-8 text-sm"
                  />
                </div>
              </div>

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                <TabsList className="grid grid-cols-4 mx-3 mt-2 h-8">
                  <TabsTrigger value="all" className="text-xs h-7">All</TabsTrigger>
                  <TabsTrigger value="tiktok" className="text-xs h-7">TikTok</TabsTrigger>
                  <TabsTrigger value="reels" className="text-xs h-7">Reels</TabsTrigger>
                  <TabsTrigger value="photos" className="text-xs h-7">Photos</TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="flex-1 mt-0 overflow-hidden">
                  <ScrollArea className="h-full">
                    <div className="p-2 space-y-1">
                      {favoritesLoading ? (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                          Loading...
                        </div>
                      ) : filteredFavorites.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                          <Heart className="w-8 h-8 mx-auto mb-2 opacity-30" />
                          <p>No favorites yet</p>
                          <p className="text-xs mt-1">Save content from Explore</p>
                        </div>
                      ) : (
                        filteredFavorites.map(item => (
                          <div
                            key={`${item.type}-${item.id}`}
                            draggable
                            onDragStart={(e) => handleDragStart(e, item)}
                            className="group flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 cursor-grab active:cursor-grabbing transition-colors border border-transparent hover:border-border/50"
                          >
                            <GripVertical className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 flex-shrink-0" />
                            
                            <div className="w-10 h-12 bg-muted rounded overflow-hidden flex-shrink-0">
                              {item.thumbnail_url ? (
                                <img
                                  src={item.thumbnail_url}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  {item.type === 'photo_carousel' ? (
                                    <Image className="w-4 h-4 text-muted-foreground" />
                                  ) : (
                                    <Video className="w-4 h-4 text-muted-foreground" />
                                  )}
                                </div>
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{item.title}</p>
                              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                <span className="text-primary font-semibold">#{Math.round(item.outliar_score || 0)}</span>
                                <span>▶ {formatNumber(item.video_views || 0)}</span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>

              {/* Drag hint */}
              <div className="p-3 border-t border-border/50 text-center bg-muted/30">
                <p className="text-xs text-muted-foreground">
                  ✨ Drag items into your notes to create mood boards
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      {selectedVideo && (
        <VideoDetailsModal
          video={selectedVideo}
          isOpen={!!selectedVideo}
          onClose={() => setSelectedVideo(null)}
        />
      )}

      {selectedPhoto && (
        <PhotoCarouselModal
          photoCarousel={selectedPhoto}
          isOpen={!!selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
        />
      )}
    </div>
  );
};

export default NotesPage;
