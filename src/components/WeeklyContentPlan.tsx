import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Calendar, Sparkles, ChevronRight, Plus, RefreshCw, LayoutGrid, FileText, Share2, Check, Copy, PlusCircle, Filter } from 'lucide-react';
import TikTokThumbnail from './TikTokThumbnail';
import ReelThumbnail from './ReelThumbnail';
import VideoDetailsModal from './VideoDetailsModal';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { Input } from './ui/input';
import { Video } from '@/types/content';
import { format, addDays, startOfToday } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { fixSupabaseStorageUrl } from '@/services/contentDataService';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { ContentPlanWorkspaceView } from './ContentPlanWorkspaceView';
import { useAnalysis } from '@/contexts/AnalysisContext';

// Helper to parse content_style which may be JSON array or plain string
const parseContentStyles = (contentStyle: string | null | undefined): string[] => {
  if (!contentStyle) return ['Content'];
  
  // Try to parse as JSON array
  try {
    const parsed = JSON.parse(contentStyle);
    if (Array.isArray(parsed)) {
      return parsed.map(s => String(s).trim()).filter(Boolean);
    }
    return [String(parsed).trim()];
  } catch {
    // Not JSON, treat as comma-separated or single value
    // Also clean up any stray brackets/quotes
    const cleaned = contentStyle.replace(/^\[|\]$/g, '').trim();
    return cleaned.split(',').map(s => s.replace(/^["']|["']$/g, '').trim()).filter(Boolean);
  }
};

// Helper to parse effort which may be JSON object like {"string":"Low"} or plain string
const parseEffort = (effort: string | null | undefined): string | null => {
  if (!effort) return null;
  
  try {
    const parsed = JSON.parse(effort);
    // Handle {"string":"Low"} format
    if (parsed && typeof parsed === 'object' && parsed.string) {
      return String(parsed.string).trim();
    }
    return String(parsed).trim();
  } catch {
    // Not JSON, return cleaned string
    return effort.replace(/[{}"]/g, '').replace(/string:/gi, '').trim();
  }
};

interface WeeklyContentPlanProps {
  allVideos: Video[];
  onVideoClick: (video: Video) => void;
  onPhotoCarouselClick?: (carousel: any) => void;
  onPlanInitialized?: (videos: Video[]) => void;
  customPlanVideos?: Video[];
  selectedForReplace?: Video | null;
  onSelectForReplace?: (video: Video | null) => void;
  onRefreshDay?: (dayIndex: number) => void;
  audioId?: string;
  audioInfo?: any;
  analysisResult?: any;
  genreScores?: Map<string, number>;
  subGenreScores?: Map<string, number>;
  notes?: Record<number, string>;
  onNotesChange?: (videoId: number, notes: string) => void;
  onAskAI?: (video: Video) => void;
  onShowMoreLikeThis?: (video: Video) => void;
  onAskAIAboutPlan?: () => void;
}

export const WeeklyContentPlan: React.FC<WeeklyContentPlanProps> = ({
  allVideos,
  onVideoClick,
  onPhotoCarouselClick,
  onPlanInitialized,
  customPlanVideos,
  selectedForReplace,
  onSelectForReplace,
  onRefreshDay,
  audioId,
  audioInfo,
  analysisResult,
  genreScores = new Map(),
  subGenreScores = new Map(),
  notes = {},
  onNotesChange,
  onAskAI,
  onShowMoreLikeThis,
  onAskAIAboutPlan
}) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { clearAnalysis } = useAnalysis();
  const [viewMode, setViewMode] = useState<'carousel' | 'workspace'>('carousel');
  const [pendingRefresh, setPendingRefresh] = useState<number | null>(null);
  const [sharingPlan, setSharingPlan] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0);

  const handleCreateNewPlan = () => {
    clearAnalysis();
    navigate('/create');
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data } = await supabase.auth.getSession();
    setUser(data.session?.user || null);
  };
  // Generate 7-day plan with best performing videos from different categories
  const weekPlan = useMemo(() => {
    const today = startOfToday();
    const contentStyles = [
      'hook statement',
      'selfie performance', 
      'selfie lipsync',
      'pro camera lipsync',
      'lyric video',
      'meme',
      'live performance'
    ];

    // If custom plan videos are provided and has content, use those instead
    if (customPlanVideos && customPlanVideos.length > 0) {
      console.log('📺 WeeklyContentPlan receiving videos in order:', customPlanVideos.map(v => v.id).join(' → '));
      
      return Array.from({ length: 7 }, (_, i) => {
        const date = addDays(today, i);
        const video = customPlanVideos[i];
        
        console.log(`  Day ${i + 1} assigned: Video ID ${video?.id}`);
        
        return {
          date,
          dayName: format(date, 'EEE'),
          dayNumber: format(date, 'd'),
          month: format(date, 'MMM'),
          video,
          contentStyle: video?.content_style || 'Content',
          isToday: i === 0
        };
      });
    }

    // Otherwise generate initial plan with high-confidence genre prioritization
    const usedVideoIds = new Set<number>(); // Track used videos to prevent duplicates
    
    const plan = Array.from({ length: 7 }, (_, i) => {
      const date = addDays(today, i);
      const targetStyle = contentStyles[i % contentStyles.length];
      
      // Find videos matching this style that haven't been used yet
      let matchingVideos = allVideos.filter(v => 
        v.content_style?.toLowerCase().includes(targetStyle) && 
        !usedVideoIds.has(v.id)
      );
      
      // If no matches for this style, use any unused videos
      if (matchingVideos.length === 0) {
        matchingVideos = allVideos.filter(v => !usedVideoIds.has(v.id));
      }
      
      // Prioritize videos with high confidence scores
      // Videos are already sorted by relevance in parent, so just pick the first available
      const video = matchingVideos[0];
      
      // Mark this video as used
      if (video) {
        usedVideoIds.add(video.id);
      }

      return {
        date,
        dayName: format(date, 'EEE'),
        dayNumber: format(date, 'd'),
        month: format(date, 'MMM'),
        video,
        contentStyle: video?.content_style || 'Content',
        isToday: i === 0
      };
    });

    return plan;
  }, [allVideos, customPlanVideos]);

  const handleSavePlan = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: 'Not authenticated',
          description: 'Please sign in to save your plan.',
          variant: 'destructive',
        });
        return;
      }

      const planData = {
        source: 'audio_analysis',
        audio_id: audioId,
        audio_url: audioInfo?.video_url,
        genre: analysisResult?.genre,
        category_style: analysisResult?.category_style,
        days: weekPlan.map((day, index) => ({
          day: index + 1,
          date: format(day.date, 'yyyy-MM-dd'),
          video_id: day.video?.id,
          video: day.video,
          gif_url: day.video?.gif_url,
          content_style: day.contentStyle,
        }))
      };

      const { data: savedPlan, error } = await supabase
        .from('content_plans')
        .insert([{
          user_id: session.user.id,
          name: `Plan - ${format(new Date(), 'MMM d, yyyy')}`,
          plan: planData as any
        }])
        .select()
        .maybeSingle();

      if (error) throw error;

      toast({
        title: 'Plan saved!',
        description: 'Your content plan has been backed up.',
      });
    } catch (error) {
      console.error('Error saving plan:', error);
      toast({
        title: 'Error saving plan',
        description: 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const sharePlan = async () => {
    if (!user) {
      toast({
        title: 'Not authenticated',
        description: 'Please sign in to share your plan.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // First, save the plan to get a plan ID
      const planData = {
        source: 'audio_analysis',
        audio_id: audioId,
        audio_url: audioInfo?.video_url, // Include audio URL
        genre: analysisResult?.genre,
        category_style: analysisResult?.category_style,
        days: weekPlan.map((day, index) => ({
          day: index + 1,
          date: format(day.date, 'yyyy-MM-dd'),
          video_id: day.video?.id,
          video: day.video,
          gif_url: day.video?.gif_url,
          content_style: day.contentStyle,
        }))
      };

      const { data: savedPlan, error: saveError } = await supabase
        .from('content_plans')
        .insert([{
          user_id: user.id,
          name: `Plan - ${format(new Date(), 'MMM d, yyyy')}`,
          plan: planData as any
        }])
        .select()
        .single();

      if (saveError) throw saveError;

      // Create share link
      const shareId = Math.random().toString(36).substring(2, 15);
      
      await supabase.from('shared_content_plans').insert([{
        user_id: user.id,
        plan_id: savedPlan.id,
        share_id: shareId,
        plan_data: planData as any,
        plan_name: savedPlan.name
      }]);

      const link = `${window.location.origin}/shared-plan/${shareId}`;
      setShareLink(link);
      setSharingPlan(true);

      toast({
        title: 'Plan saved & shared! 🔗',
        description: 'Your shareable link is ready.',
      });
    } catch (error) {
      console.error('Error sharing plan:', error);
      toast({
        title: 'Error sharing plan',
        description: 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    toast({
      title: "Link copied! 🔗",
      description: "Share this link with anyone to show them your plan.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReorder = (reorderedVideos: Video[]) => {
    if (onPlanInitialized) {
      onPlanInitialized(reorderedVideos);
    }
  };

  const handleRefreshDay = (dayIndex: number) => {
    const videoToReplace = weekPlan[dayIndex]?.video;
    
    // Check if this video has notes
    if (videoToReplace && notes[videoToReplace.id]?.trim()) {
      setPendingRefresh(dayIndex);
    } else {
      // No notes, proceed with refresh
      if (onRefreshDay) {
        onRefreshDay(dayIndex);
      }
    }
  };

  const confirmRefresh = () => {
    if (pendingRefresh !== null) {
      const videoToReplace = weekPlan[pendingRefresh]?.video;
      
      // Remove notes for the replaced video
      if (videoToReplace && onNotesChange) {
        onNotesChange(videoToReplace.id, '');
      }
      
      // Proceed with refresh
      if (onRefreshDay) {
        onRefreshDay(pendingRefresh);
      }
      
      setPendingRefresh(null);
    }
  };

  const cancelRefresh = () => {
    setPendingRefresh(null);
  };

  if (allVideos.length === 0) return null;

  const planVideos = weekPlan.map(p => p.video).filter(Boolean) as Video[];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Calendar className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              Your 7-Day Content Plan
            </h2>
            <p className="text-sm text-muted-foreground">
              AI-curated posting schedule based on your audio analysis
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-muted/30 rounded-lg p-1">
            <Button
              variant={viewMode === 'carousel' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('carousel')}
              className="h-8 px-3"
            >
              <LayoutGrid className="w-4 h-4 mr-1.5" />
              Carousel
            </Button>
            <Button
              variant={viewMode === 'workspace' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('workspace')}
              className="h-8 px-3"
            >
              <FileText className="w-4 h-4 mr-1.5" />
              Workspace
            </Button>
          </div>
          <Button 
            variant="default" 
            size="sm" 
            className="gap-1.5"
            onClick={handleCreateNewPlan}
          >
            <PlusCircle className="w-4 h-4" />
            New Plan
          </Button>
          <Button variant="ghost" size="sm" className="hover:bg-accent/50" onClick={handleSavePlan}>
            Save Plan
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="hover:bg-accent/50"
            onClick={sharePlan}
          >
            <Share2 className="w-4 h-4 mr-1.5" />
            Share
          </Button>
          {onAskAIAboutPlan && (
            <Button
              variant="ghost"
              size="sm"
              className="hover:bg-primary/10 text-primary"
              onClick={onAskAIAboutPlan}
            >
              <Sparkles className="w-4 h-4 mr-1.5" />
              Ask AI
            </Button>
          )}
        </div>
      </div>

      {viewMode === 'carousel' ? (
        <div className="relative">
          {/* Horizontal scroll container */}
          <div className="flex gap-4 overflow-x-auto pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {weekPlan.map((day, index) => (
              <motion.div
                key={day.date.toISOString()}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex-shrink-0"
              >
                <Card 
                  className={`w-[260px] overflow-hidden cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] hover:z-10 relative bg-card ${
                    selectedForReplace?.id === day.video?.id ? 'ring-2 ring-accent shadow-lg' : ''
                  }`}
                  onClick={() => {
                    if (day.video) {
                      const isPhotoCarousel = (day.video as any).is_photo_carousel;
                      if (isPhotoCarousel && onPhotoCarouselClick) {
                        onPhotoCarouselClick(day.video);
                      } else {
                        setSelectedVideo(day.video);
                        setSelectedVideoIndex(index);
                      }
                    }
                  }}
                >
                  {/* Date Header */}
                  <div className="p-2 text-center bg-muted/80">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-medium opacity-80">Day {index + 1}</span>
                    </div>
                    <div className="text-xl font-bold opacity-80">{day.dayNumber}</div>
                    <div className="text-xs font-medium opacity-70">
                      {day.dayName}, {day.month}
                    </div>
                  </div>

                      {/* Video Preview */}
                      {day.video && (
                        <>
                          <div className="relative aspect-[9/16] bg-muted/20 overflow-hidden">
                            {(day.video as any).is_photo_carousel && fixSupabaseStorageUrl((day.video as any).photo_url_1) ? (
                              <img
                                src={fixSupabaseStorageUrl((day.video as any).photo_url_1) || ''}
                                alt={day.video.caption || 'Photo carousel preview'}
                                className="w-full h-full object-cover"
                              />
                            ) : (day.video as any).is_photo_carousel && ((day.video as any).embedded_url || day.video.embedded_ulr) ? (
                              // Photo carousel without photo_url_1 - use oEmbed fallback
                              <TikTokThumbnail
                                videoId={day.video.id}
                                tiktokUrl={(day.video as any).embedded_url || day.video.embedded_ulr}
                                className="w-full h-full"
                              />
            ) : day.video.is_reel && (day.video as any).thumbnail_url ? (
              // Instagram Reels — use cached thumbnail (direct video URLs are unreliable)
              <img src={(day.video as any).thumbnail_url} alt={day.video.caption || ''} className="w-full h-full object-cover" />
                            ) : day.video.embedded_ulr || (day.video as any).thumbnail_url ? (
                              <TikTokThumbnail
                                videoId={day.video.id}
                                tiktokUrl={day.video.embedded_ulr || ''}
                                className="w-full h-full"
                                fallbackThumbnail={(day.video as any).thumbnail_url}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                                <Sparkles className="w-12 h-12 text-primary/40" />
                              </div>
                            )}
                        
                        {/* Overlay with views and AI actions */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                          <div className="flex items-center justify-between">
                            <div className="text-white text-xs font-medium">
                              {((day.video as any).is_photo_carousel 
                                ? (day.video as any).photo_views 
                                : day.video.video_views)?.toLocaleString() || '0'} views
                            </div>
                            {/* Ask AI Actions */}
                            {(onAskAI || onShowMoreLikeThis) && (
                              <div className="flex items-center gap-1">
                                {onShowMoreLikeThis && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (day.video) onShowMoreLikeThis(day.video);
                                        }}
                                        className="w-7 h-7 rounded-md bg-white/10 hover:bg-emerald-500/30 text-white/80 hover:text-emerald-400 transition-all backdrop-blur-sm"
                                      >
                                        <Filter className="w-3.5 h-3.5" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Show more like this</p>
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                                {onAskAI && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (day.video) onAskAI(day.video);
                                        }}
                                        className="w-7 h-7 rounded-md bg-primary/20 hover:bg-primary/40 text-primary-foreground transition-all backdrop-blur-sm"
                                      >
                                        <Sparkles className="w-3.5 h-3.5" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Ask AI about this video</p>
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Content Details */}
                      <div className="p-3">
                        <div className="flex flex-col gap-1.5 min-h-[60px]">
                          {/* Viral Score & Performance Multiplier */}
                          <div className="flex gap-1">
                            {day.video?.viral_score != null && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge 
                                    variant="outline" 
                                    className="text-xs px-2 py-0.5 font-normal flex-1 text-center border-purple-500 text-purple-500 cursor-help"
                                  >
                                    🔥 {day.video.viral_score}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-[200px]">Viral Score: How likely this content style is to go viral (higher = better)</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                            {day.video?.performance_multiplier && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge 
                                    variant="outline" 
                                    className="text-xs px-2 py-0.5 font-normal flex-1 text-center border-orange-500 text-orange-500 cursor-help"
                                  >
                                    {day.video.performance_multiplier}x
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-[200px]">Performance Multiplier: Views relative to creator's average (e.g., 2x = double their usual views)</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                          {/* Effort Badge */}
                          {day.video?.ai_effort && (() => {
                            const effort = parseEffort(day.video.ai_effort);
                            if (!effort) return null;
                            return (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge 
                                    variant="outline" 
                                    className={`text-xs px-2 py-0.5 font-normal w-full text-center cursor-help ${
                                      effort.toLowerCase() === 'low' ? 'border-green-500 text-green-500' :
                                      effort.toLowerCase() === 'medium' ? 'border-yellow-500 text-yellow-500' :
                                      'border-red-500 text-red-500'
                                    }`}
                                  >
                                    {effort} Effort
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-[200px]">Effort Level: Estimated production effort needed to recreate this content style</p>
                                </TooltipContent>
                              </Tooltip>
                            );
                          })()}
                          {/* Content Type & Platform */}
                          {day.video?.ai_content_type_platform && (
                            <Badge 
                              variant="outline" 
                              className="text-xs px-2 py-0.5 font-normal w-full text-center border-blue-500 text-blue-500"
                            >
                              {day.video.ai_content_type_platform}
                            </Badge>
                          )}
                          {parseContentStyles(day.contentStyle).map((style, idx) => (
                            <Badge 
                              key={idx} 
                              variant="secondary" 
                              className="text-xs px-2 py-0.5 font-normal text-foreground/70 w-full text-center"
                            >
                              {style}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Scroll indicator */}
          <div className="absolute right-0 top-0 bottom-4 w-12 bg-gradient-to-l from-background to-transparent pointer-events-none" />
        </div>
      ) : (
        <ContentPlanWorkspaceView 
          planVideos={planVideos}
          onReorder={handleReorder}
          onVideoClick={onVideoClick}
          onPhotoCarouselClick={onPhotoCarouselClick}
          notes={notes}
          onNotesChange={onNotesChange || (() => {})}
          onAskAI={onAskAI}
          onShowMoreLikeThis={onShowMoreLikeThis}
        />
      )}

      {/* Confirmation Dialog */}
      <AlertDialog open={pendingRefresh !== null} onOpenChange={(open) => !open && cancelRefresh()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Replace video with notes?</AlertDialogTitle>
            <AlertDialogDescription>
              This video has notes written for it. If you replace it, the notes will be deleted. Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelRefresh}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRefresh}>Replace Video</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Share Plan Dialog */}
      <Dialog open={sharingPlan} onOpenChange={() => {
        setSharingPlan(false);
        setShareLink("");
        setCopied(false);
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Share Your Plan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Anyone with this link can view your content plan, even if they don't have an account.
            </p>
            <div className="flex gap-2">
              <Input
                value={shareLink}
                readOnly
                className="font-mono text-sm"
                placeholder="Generating link..."
              />
              <Button
                onClick={copyShareLink}
                variant="outline"
                className="flex-shrink-0"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <div className="bg-muted/30 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium">What they'll see:</p>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>• Your 7-day content plan with video previews</li>
                <li>• Your original song (if uploaded)</li>
                <li>• Wavebound branding — great for showing managers and labels</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSharingPlan(false);
                setShareLink("");
                setCopied(false);
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Video Details Modal */}
      <VideoDetailsModal
        isOpen={!!selectedVideo}
        onClose={() => setSelectedVideo(null)}
        video={selectedVideo}
        videos={planVideos}
      />
    </div>
  );
};