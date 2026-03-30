import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import VideoDetailsModal from "@/components/VideoDetailsModal";
import FooterSection from "@/components/FooterSection";
import { ContentPlanWorkspaceView } from "@/components/ContentPlanWorkspaceView";
import waveboundLogo from "@/assets/wavebound-logo.png";
import TikTokThumbnail from "@/components/TikTokThumbnail";
import {
  Calendar, Sparkles, ExternalLink, Eye, ArrowRight, Play, Heart, Users,
  LayoutGrid, FileText, Music, TrendingUp, Zap
} from "lucide-react";
import { format, addDays, startOfToday } from "date-fns";

const parseContentStyles = (styles: any): string[] => {
  if (!styles) return [];
  if (Array.isArray(styles)) return styles.map(s => String(s).trim()).filter(Boolean);
  const str = String(styles);
  try {
    const parsed = JSON.parse(str);
    if (Array.isArray(parsed)) return parsed.map(s => String(s).trim()).filter(Boolean);
  } catch {}
  return str.split(',').map(s => s.replace(/[\[\]"{}]/g, '').trim()).filter(Boolean);
};

const SharedPlan = () => {
  const { shareId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'carousel' | 'workspace'>('carousel');

  useEffect(() => {
    loadSharedPlan();
  }, [shareId]);

  const loadSharedPlan = async () => {
    try {
      const { data, error } = await supabase
        .from('shared_content_plans')
        .select('*')
        .eq('share_id', shareId)
        .single();

      if (error || !data) {
        setNotFound(true);
        return;
      }

      await supabase
        .from('shared_content_plans')
        .update({ view_count: (data.view_count || 0) + 1 })
        .eq('id', data.id);

      setPlan(data);
    } catch (error) {
      console.error('Error loading shared plan:', error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${Math.floor(num / 1000000)}M`;
    if (num >= 1000) return `${Math.floor(num / 1000)}K`;
    return num.toString();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 animate-spin rounded-full border-2 border-muted-foreground/20 border-t-primary"></div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-background">
        <SharedPlanHeader />
        <div className="flex items-center justify-center px-6 py-32">
          <Card className="p-12 max-w-md text-center">
            <h2 className="text-2xl font-bold mb-4">Plan Not Found</h2>
            <p className="text-muted-foreground mb-6">
              This plan link may have expired or been deleted.
            </p>
            <Button onClick={() => navigate('/')}>
              Try Wavebound Free
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const planData = plan.plan_data;
  const today = startOfToday();
  const days = planData.days || [];
  const audioUrl = planData.audio_url;

  const weekPlan = days.map((day: any, index: number) => ({
    date: addDays(today, index),
    dayName: format(addDays(today, index), 'EEE'),
    dayNumber: format(addDays(today, index), 'd'),
    month: format(addDays(today, index), 'MMM'),
    video: day.video,
    gif_url: day.gif_url,
    contentStyle: day.video?.content_style || day.content_style || day.contentStyle || 'Content',
    day: index + 1
  }));

  return (
    <div className="min-h-screen bg-background">
      {/* Branded Header */}
      <SharedPlanHeader />

      <div className="relative">
        {/* Header */}
        <div className="pt-12 px-6 pb-12">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                {plan.plan_name}
              </h1>
              <p className="text-muted-foreground text-lg mb-4">
                Shared content plan • {weekPlan.length} days
              </p>

              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Eye className="w-4 h-4" />
                <span>{plan.view_count} views</span>
              </div>
            </motion.div>

            {/* Audio Player */}
            {audioUrl && (
              <div className="max-w-md mx-auto mb-10">
                <Card className="p-4 border">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Music className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-sm font-medium">Original Song</span>
                  </div>
                  <audio
                    controls
                    className="w-full"
                    style={{
                      filter: 'invert(0.8) hue-rotate(180deg)',
                      borderRadius: '8px'
                    }}
                  >
                    <source src={audioUrl} type="audio/mpeg" />
                    Your browser does not support the audio element.
                  </audio>
                </Card>
              </div>
            )}

            {/* Content Plan */}
            <div className="mb-16">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Calendar className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">7-Day Content Plan</h2>
                    <p className="text-sm text-muted-foreground">
                      AI-curated posting schedule
                    </p>
                  </div>
                </div>

                {/* View Mode Toggle */}
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
              </div>

              {viewMode === 'carousel' ? (
                <div className="relative">
                  <div className="flex gap-4 overflow-x-auto pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {weekPlan.map((day: any, index: number) => (
                      <motion.div
                        key={day.date.toISOString()}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex-shrink-0"
                      >
                        <Card
                          className="w-[260px] overflow-hidden bg-card cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
                          onClick={() => day.video && setSelectedVideo(day.video)}
                        >
                          <div className="p-2 text-center bg-muted/80">
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-xs font-medium opacity-80">Day {index + 1}</span>
                            </div>
                            <div className="text-xl font-bold opacity-80">{day.dayNumber}</div>
                            <div className="text-xs font-medium opacity-70">
                              {day.dayName}, {day.month}
                            </div>
                          </div>

                          {day.video && (
                            <>
                              <div className="relative aspect-[9/16] bg-muted/20 overflow-hidden">
                                {(day.gif_url || day.video?.gif_url || day.video?.thumbnail_url) ? (
                                  <img
                                    src={day.gif_url || day.video?.gif_url || day.video?.thumbnail_url}
                                    alt={day.video.caption || 'Video preview'}
                                    className="w-full h-full object-cover"
                                  />
                                ) : day.video?.embedded_ulr ? (
                                  <TikTokThumbnail
                                    videoId={day.video.id}
                                    tiktokUrl={day.video.embedded_ulr}
                                    className="w-full h-full"
                                    fallbackThumbnail={day.video.thumbnail_url}
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                                    <Play className="w-10 h-10 text-primary/40" fill="currentColor" />
                                  </div>
                                )}

                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                                  <div className="text-white text-xs font-medium flex items-center gap-4">
                                    <span className="flex items-center gap-1">
                                      <Play className="w-3 h-3" />
                                      {formatNumber(day.video.video_views || 0)}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Heart className="w-3 h-3" />
                                      {formatNumber(day.video.video_likes || 0)}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Users className="w-3 h-3" />
                                      {formatNumber(day.video.profile_followers || 0)}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="p-3">
                                <div className="flex flex-col gap-1.5 min-h-[60px]">
                                  {parseContentStyles(day.contentStyle).map((style: string, idx: number) => (
                                    <Badge
                                      key={idx}
                                      variant="secondary"
                                      className="text-xs px-2 py-0.5 font-normal text-foreground/70 w-full text-center"
                                    >
                                      {style.trim()}
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
                  <div className="absolute right-0 top-0 bottom-4 w-12 bg-gradient-to-l from-background to-transparent pointer-events-none" />
                </div>
              ) : (
                <ContentPlanWorkspaceView
                  planVideos={weekPlan.map((day: any) => day.video).filter(Boolean)}
                  onReorder={() => {}}
                  onVideoClick={(video) => setSelectedVideo(video)}
                  notes={{}}
                  onNotesChange={() => {}}
                />
              )}
            </div>

            {/* Built with Wavebound CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="max-w-2xl mx-auto"
            >
              <Card className="p-8 text-center border border-primary/20 bg-gradient-to-br from-primary/5 to-background">
                <img src={waveboundLogo} alt="Wavebound" className="h-10 mx-auto mb-4 object-contain" />
                <h3 className="text-2xl font-bold mb-2">
                  Built with Wavebound
                </h3>
                <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
                  AI-powered content planning for music artists. Discover viral trends, plan your posts, and grow your audience — all in one place.
                </p>
                <Button
                  onClick={() => navigate('/')}
                  size="lg"
                  className="group"
                >
                  Try Wavebound Free
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>

                <div className="flex items-center justify-center gap-6 mt-6 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    10K+ viral videos analyzed
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-primary" />
                    AI-powered plans
                  </span>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
        <FooterSection />
      </div>

      <VideoDetailsModal
        video={selectedVideo}
        isOpen={!!selectedVideo}
        onClose={() => setSelectedVideo(null)}
      />
    </div>
  );
};

/** Sticky branded header used on shared pages */
export const SharedPlanHeader = () => {
  const navigate = useNavigate();

  return (
    <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <button onClick={() => navigate('/')} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          <img src={waveboundLogo} alt="Wavebound" className="h-8 object-contain" />
          <span className="text-lg font-bold">Wavebound</span>
        </button>
        <Button onClick={() => navigate('/')} size="sm">
          Try Wavebound Free
        </Button>
      </div>
    </header>
  );
};

export default SharedPlan;
