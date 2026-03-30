import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Calendar, 
  Eye, 
  Heart, 
  TrendingUp, 
  MessageCircle,
  Play,
  Clock,
  ChevronRight,
  Sparkles,
  RefreshCw,
  Save,
  Star,
  BarChart3,
  MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import HeaderAuth from "@/components/HeaderAuth";
import FooterSection from "@/components/FooterSection";
import SEOHead from "@/components/SEOHead";
import WaveboundLoader from "@/components/WaveboundLoader";
import VideoDetailsModal from "@/components/VideoDetailsModal";
import PhotoCarouselModal from "@/components/PhotoCarouselModal";
import { WeeklyContentPlan } from "@/components/WeeklyContentPlan";
import { GlobalNotesPanel } from "@/components/GlobalNotesPanel";
import TikTokThumbnail from "@/components/TikTokThumbnail";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Video, PhotoCarousel } from "@/types/content";
import { useDiscover } from "@/contexts/DiscoverContext";
import { useAISidebar } from "@/contexts/AISidebarContext";

interface PlanDay {
  day: number;
  video_id?: number;
  video?: Video;
  gif_url?: string;
  content_style?: string;
  fields?: {
    hookIdea?: string;
    caption?: string;
    notes?: string;
  };
}

interface ContentPlan {
  id: string;
  name: string;
  plan: {
    days?: PlanDay[];
    videos?: PlanDay[];
    selected_genres?: string[];
  };
  project_id: string | null;
  created_at: string;
  updated_at: string;
  is_favorite: boolean;
}

interface ContentProject {
  id: string;
  name: string;
  color: string;
}

const PlanWorkspace = () => {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { sendVideoToAI, showMoreLikeThis } = useDiscover();
  const { openSidebar } = useAISidebar();
  
  const [plan, setPlan] = useState<ContentPlan | null>(null);
  const [project, setProject] = useState<ContentProject | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Modal states
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [selectedPhotoCarousel, setSelectedPhotoCarousel] = useState<PhotoCarousel | null>(null);
  
  // Weekly plan state
  const [weeklyPlanVideos, setWeeklyPlanVideos] = useState<Video[]>([]);
  const [selectedForReplace, setSelectedForReplace] = useState<Video | null>(null);
  const [videoNotes, setVideoNotes] = useState<Record<number, string>>({});
  
  // Genres from the plan
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  useEffect(() => {
    loadPlan();
  }, [planId]);

  const loadPlan = async () => {
    if (!planId) return;
    
    setIsLoading(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/auth');
      return;
    }

    const { data: planData, error } = await supabase
      .from('content_plans')
      .select('*')
      .eq('id', planId)
      .eq('user_id', user.id)
      .single();

    if (error || !planData) {
      navigate('/my-plans');
      return;
    }

    // Parse plan JSON if needed
    const parsedPlan = typeof planData.plan === 'string' 
      ? JSON.parse(planData.plan) 
      : planData.plan;

    const loadedPlan = {
      ...planData,
      plan: parsedPlan
    } as ContentPlan;
    
    setPlan(loadedPlan);
    
    // Extract genres
    if (parsedPlan.selected_genres) {
      setSelectedGenres(parsedPlan.selected_genres);
    }

    // Load project if assigned
    if (planData.project_id) {
      const { data: projectData } = await supabase
        .from('content_projects')
        .select('*')
        .eq('id', planData.project_id)
        .single();
      
      if (projectData) {
        setProject(projectData);
      }
    }

    // Load videos from the plan - need to fetch from DB if only IDs are stored
    const days = parsedPlan.days || parsedPlan.videos || [];
    
    // Check if videos are stored as full objects or just IDs
    const hasFullVideos = days.some((d: PlanDay) => d.video && typeof d.video === 'object' && d.video.id);
    
    if (hasFullVideos) {
      // Videos are stored as full objects
      const videos = days.map((d: PlanDay) => d.video).filter(Boolean);
      setWeeklyPlanVideos(videos);
      
      // Load notes from fields
      const notes: Record<number, string> = {};
      days.forEach((d: PlanDay) => {
        if (d.fields?.notes && d.video?.id) {
          notes[d.video.id] = d.fields.notes;
        }
      });
      setVideoNotes(notes);
    } else {
      // Only video IDs are stored - need to fetch full video data from database
      const videoIds = days.map((d: PlanDay) => d.video_id).filter(Boolean);
      
      if (videoIds.length > 0) {
        // Fetch videos from tiktok_videos_all table
        const { data: videosData } = await supabase
          .from('tiktok_videos_all')
          .select('*')
          .in('id', videoIds);
        
        // Also fetch from media_assets for gif thumbnails
        const { data: assetsData } = await supabase
          .from('media_assets_gif_thumbnail')
          .select('*')
          .in('video_id', videoIds);
        
        if (videosData && videosData.length > 0) {
          // Create a map for quick asset lookup
          const assetsMap = new Map();
          assetsData?.forEach(asset => {
            assetsMap.set(asset.video_id, asset.url);
          });
          
          // Map the videos in the same order as the plan days
          const orderedVideos: Video[] = [];
          for (const day of days) {
            const video = videosData.find(v => v.id === day.video_id);
            if (video) {
              orderedVideos.push({
                id: video.id,
                caption: video.caption || '',
                content_style: video.content_style || day.content_style || '',
                embedded_ulr: video.embedded_ulr || '',
                video_url: video.video_url || '',
                video_views: video.video_views || 0,
                video_likes: video.video_likes || 0,
                video_shares: video.video_shares || 0,
                comments: video.comments || '',
                video_saves: video.video_saves || '',
                viral_score: video.outliar_score || 0,
                outliar_score: video.outliar_score || 0,
                profile_followers: video.profile_followers || 0,
                handle: video.Artist || '',
                avatar_url: video.avatar_url || '',
                date_posted: video.date_posted || '',
                duration: video.duration || 0,
                hook: video.hook || '',
                genre: video.genre || '',
                gif_url: assetsMap.get(video.id) || '',
                hashtags: video.hashtags || '',
              } as Video);
            }
          }
          setWeeklyPlanVideos(orderedVideos);
        }
      }
    }

    setIsLoading(false);
  };

  const handleSavePlan = async () => {
    if (!plan || !planId) return;
    
    setSaving(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Rebuild plan with current videos and notes
      const updatedDays = weeklyPlanVideos.map((video, idx) => ({
        day: idx + 1,
        video_id: video.id,
        video: video,
        gif_url: video.gif_url || '',
        content_style: video.content_style || '',
        fields: {
          notes: videoNotes[video.id] || '',
        }
      }));

      const updatedPlan = {
        ...plan.plan,
        days: updatedDays,
        videos: updatedDays,
      };

      const { error } = await supabase
        .from('content_plans')
        .update({ 
          plan: JSON.parse(JSON.stringify(updatedPlan)),
          updated_at: new Date().toISOString()
        })
        .eq('id', planId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Plan saved!",
        description: "Your changes have been saved."
      });
    } catch (error) {
      console.error('Error saving plan:', error);
      toast({
        title: "Error saving plan",
        description: "Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!plan || !planId) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const newValue = !plan.is_favorite;
      
      const { error } = await supabase
        .from('content_plans')
        .update({ is_favorite: newValue })
        .eq('id', planId)
        .eq('user_id', user.id);

      if (error) throw error;

      setPlan({ ...plan, is_favorite: newValue });
      
      toast({
        title: newValue ? "Added to favorites" : "Removed from favorites"
      });
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const getStats = () => {
    let totalViews = 0;
    let totalLikes = 0;
    let totalComments = 0;
    let avgViralScore = 0;
    let videoCount = 0;

    weeklyPlanVideos.forEach((video) => {
      if (video) {
        totalViews += video.video_views || 0;
        totalLikes += video.video_likes || 0;
        // comments is stored as string
        const commentCount = parseInt(video.comments || '0', 10) || 0;
        totalComments += commentCount;
        avgViralScore += video.viral_score || video.outliar_score || 0;
        videoCount++;
      }
    });

    return {
      videoCount,
      totalViews,
      totalLikes,
      totalComments,
      avgViralScore: videoCount > 0 ? Math.round(avgViralScore / videoCount) : 0,
    };
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const handleVideoClick = (video: Video) => {
    if (video.isPhotoCarousel) {
      setSelectedPhotoCarousel({
        id: video.id,
        embedded_url: video.embedded_ulr,
        outliar_score: video.outliar_score,
        photo_views: video.video_views,
        photo_likes: video.video_likes,
        comments: video.comments,
        profile_followers: video.profile_followers,
        caption: video.caption,
      } as PhotoCarousel);
    } else {
      setSelectedVideo(video);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <HeaderAuth variant="light" />
        <div className="pt-24 flex items-center justify-center min-h-[60vh]">
          <WaveboundLoader />
        </div>
      </div>
    );
  }

  if (!plan) {
    return null;
  }

  const stats = getStats();

  return (
    <>
      <SEOHead 
        title={`${plan.name} - Wavebound`}
        description="Edit and manage your content plan with videos and analytics."
      />
      <HeaderAuth variant="light" />
      
      <div className="min-h-screen bg-background">
        {/* Header */}
        <section className="border-b border-border bg-card/50 pt-24 pb-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <button 
                onClick={() => navigate('/my-plans')}
                className="hover:text-foreground transition-colors"
              >
                My Plans
              </button>
              <ChevronRight className="w-4 h-4" />
              <span className="text-foreground truncate max-w-[200px]">{plan.name}</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                    {plan.name}
                  </h1>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleToggleFavorite}
                    className={plan.is_favorite ? "text-yellow-500" : "text-muted-foreground"}
                  >
                    <Star className={`w-5 h-5 ${plan.is_favorite ? 'fill-current' : ''}`} />
                  </Button>
                  {project && (
                    <Badge 
                      variant="outline" 
                      className="gap-1.5"
                      style={{ borderColor: project.color, color: project.color }}
                    >
                      <div 
                        className="w-2 h-2 rounded-full" 
                        style={{ backgroundColor: project.color }}
                      />
                      {project.name}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    Created {format(new Date(plan.created_at), 'MMM d, yyyy')}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Play className="w-4 h-4" />
                    {stats.videoCount} videos
                  </span>
                </div>
                {selectedGenres.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {selectedGenres.slice(0, 5).map((genre, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {genre}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/my-plans')}
                  className="gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleSavePlan}
                  disabled={saving}
                  className="gap-2"
                >
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save
                </Button>
                <Button onClick={openSidebar} className="gap-2">
                  <MessageSquare className="w-4 h-4" />
                  AI Assistant
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Cards */}
        <section className="py-6 border-b border-border/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4 bg-card/60 border-border/40">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Eye className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{formatNumber(stats.totalViews)}</p>
                    <p className="text-xs text-muted-foreground">Total Views</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4 bg-card/60 border-border/40">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-rose-500/10">
                    <Heart className="w-5 h-5 text-rose-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{formatNumber(stats.totalLikes)}</p>
                    <p className="text-xs text-muted-foreground">Total Likes</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4 bg-card/60 border-border/40">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <MessageCircle className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{formatNumber(stats.totalComments)}</p>
                    <p className="text-xs text-muted-foreground">Total Comments</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4 bg-card/60 border-border/40">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <TrendingUp className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.avgViralScore}</p>
                    <p className="text-xs text-muted-foreground">Avg Viral Score</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-muted/30 dark:bg-muted/10">
          {/* Weekly Plan */}
          <div className="mb-8 bg-card/80 dark:bg-card/40 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2)] p-4 md:p-6 lg:p-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Your 7-Day Content Plan
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Click any video to view details and get inspiration
                </p>
              </div>
            </div>
            
            <WeeklyContentPlan
              allVideos={weeklyPlanVideos}
              onVideoClick={handleVideoClick}
              onPhotoCarouselClick={(pc) => setSelectedPhotoCarousel(pc)}
              customPlanVideos={weeklyPlanVideos}
              selectedForReplace={selectedForReplace}
              onSelectForReplace={setSelectedForReplace}
              notes={videoNotes}
              onNotesChange={(videoId, notes) => setVideoNotes({ ...videoNotes, [videoId]: notes })}
              onAskAI={(video) => {
                sendVideoToAI(video);
                openSidebar();
              }}
              onShowMoreLikeThis={(video) => {
                showMoreLikeThis(video);
                navigate('/discover');
              }}
            />
          </div>

          {/* Video Grid for reference */}
          {weeklyPlanVideos.length > 0 && (
            <div className="mt-8 bg-card/80 dark:bg-card/40 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2)] p-4 md:p-6 lg:p-8">
              <h3 className="text-md font-medium text-foreground mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                Quick Reference
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
                {weeklyPlanVideos.map((video, index) => (
                  <motion.div
                    key={`${video.id}-${index}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group cursor-pointer"
                    onClick={() => handleVideoClick(video)}
                  >
                    <Card className="overflow-hidden bg-card/60 border-border/40 hover:border-primary/40 transition-all">
                      <div className="relative aspect-[9/16] bg-muted/20 overflow-hidden">
                        <Badge className="absolute top-2 left-2 z-10 bg-primary text-primary-foreground text-xs">
                          Day {index + 1}
                        </Badge>
                        {video.gif_url || video.thumbnail_url ? (
                          <img
                            src={video.gif_url || video.thumbnail_url || ''}
                            alt={video.caption || 'Video preview'}
                            className="w-full h-full object-cover"
                          />
                        ) : video.embedded_ulr ? (
                          <TikTokThumbnail
                            videoId={video.id}
                            tiktokUrl={video.embedded_ulr}
                            className="w-full h-full"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Play className="w-8 h-8 text-muted-foreground/50" />
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                          <div className="flex items-center gap-2 text-white text-xs">
                            <span className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {formatNumber(video.video_views || 0)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </main>

        {/* Global Notes Panel */}
        <GlobalNotesPanel />

        {/* Video Modal */}
        <VideoDetailsModal
          video={selectedVideo}
          videos={weeklyPlanVideos}
          isOpen={!!selectedVideo}
          onClose={() => setSelectedVideo(null)}
        />

        {/* Photo Carousel Modal */}
        <PhotoCarouselModal
          photoCarousel={selectedPhotoCarousel}
          isOpen={!!selectedPhotoCarousel}
          onClose={() => setSelectedPhotoCarousel(null)}
        />

        <FooterSection />
      </div>
    </>
  );
};

export default PlanWorkspace;
