import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import HeaderAuth from "@/components/HeaderAuth";
import FooterSection from "@/components/FooterSection";
import SEOHead from "@/components/SEOHead";
import WaveboundLoader from "@/components/WaveboundLoader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Trash2, Loader2, Pencil, Check, X as XIcon, User, Users, BadgeCheck, BarChart3, Eye, TrendingUp, Crown, Target, Calendar, Activity, Lock, Sparkles, Zap, LineChart, Play, ArrowRight, Palette, Music, Clock, Plus, ChevronRight, Video, Heart, MessageCircle, Share2, Bookmark, Flame, ExternalLink, ArrowUpDown, ArrowUp, ArrowDown, Search, Filter, SlidersHorizontal } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, formatDistanceToNow } from "date-fns";
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart, BarChart, Bar, Cell, Legend, CartesianGrid, ComposedChart } from "recharts";
import { getContentCategoryColor, getGenreColor } from "@/utils/tagColors";

// Format large numbers with K/M suffix
const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toString();
};

// Extract TikTok video ID from URL
const extractTikTokVideoId = (url: string): string => {
  if (!url) return '';
  // Handle various TikTok URL formats
  const patterns = [
    /video\/(\d+)/,
    /\/v\/(\d+)/,
    /tiktok\.com\/@[\w.]+\/video\/(\d+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }
  return '';
};

// Chart colors for different analyses
const ANALYSIS_COLORS = [
  'hsl(217, 91%, 60%)', // Blue
  'hsl(142, 71%, 45%)', // Green
  'hsl(280, 87%, 65%)', // Purple
  'hsl(25, 95%, 53%)',  // Orange
  'hsl(340, 82%, 52%)', // Pink
  'hsl(199, 89%, 48%)', // Cyan
  'hsl(47, 96%, 53%)',  // Yellow
  'hsl(0, 84%, 60%)',   // Red
];

interface SavedAnalysis {
  id: string;
  job_id: number;
  handle: string | null;
  saved_at: string | null;
  profile_avatar?: string | null;
  profile_followers?: number | null;
  profile_likes?: number | null;
  profile_posts?: number | null;
  verified?: boolean | null;
  total_videos?: number | null;
  exclude_pinned?: boolean | null;
  stats?: {
    avg_views?: number;
    avg_likes?: number;
    avg_engagement?: number;
    median_views?: number;
    avg_comments?: number;
    avg_shares?: number;
    avg_saves?: number;
  } | null;
}

interface VideoDataPoint {
  index: number;
  [key: string]: number | string | undefined; // Dynamic keys for each analysis
}

interface AnalysisVideoData {
  job_id: number;
  handle: string;
  color: string;
  videos: {
    views: number;
    likes: number;
    date: string;
    caption: string;
    content_url: string;
  }[];
}

interface SelectedChartVideo {
  handle: string;
  content_url: string;
  views: number;
  likes: number;
  caption: string;
  color: string;
}

interface ContentInsight {
  name: string;
  count: number;
  avgViews: number;
  avgEngagement: number;
  color: string;
}

interface LastAnalysisHighlight {
  topVideo: {
    views: number;
    likes: number;
    caption: string;
    contentStyle: string;
  } | null;
  contentBreakdown: { name: string; count: number; color: string }[];
  totalViews: number;
  totalLikes: number;
  avgEngagement: number;
}

// Insight milestones - unlock features with more analyses
const INSIGHT_MILESTONES = [
  { count: 3, title: "Trend Analysis", description: "See how engagement changes over time", icon: LineChart },
  { count: 5, title: "Performance Patterns", description: "Discover what content works best", icon: Zap },
  { count: 10, title: "Growth Predictions", description: "AI-powered growth forecasts", icon: Sparkles },
];

const MyAnalyses = () => {
  const [analyses, setAnalyses] = useState<SavedAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [contentInsights, setContentInsights] = useState<ContentInsight[]>([]);
  const [genreInsights, setGenreInsights] = useState<ContentInsight[]>([]);
  const [analysisVideoData, setAnalysisVideoData] = useState<AnalysisVideoData[]>([]);
  const [selectedAnalyses, setSelectedAnalyses] = useState<Set<number>>(new Set());
  const [lastAnalysisHighlights, setLastAnalysisHighlights] = useState<LastAnalysisHighlight | null>(null);
  const [selectedChartVideo, setSelectedChartVideo] = useState<SelectedChartVideo | null>(null);
  
  // Table state
  const [tableSearch, setTableSearch] = useState("");
  const [tableSortKey, setTableSortKey] = useState<string>("saved_at");
  const [tableSortDir, setTableSortDir] = useState<"asc" | "desc">("desc");
  const [tableFilterFollowers, setTableFilterFollowers] = useState<string>("all");
  const [tableFilterEngagement, setTableFilterEngagement] = useState<string>("all");
  
  // Chart video limit filter - "all", "5", "10", "15", "20"
  const [chartVideoLimit, setChartVideoLimit] = useState<string>("all");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchSavedAnalyses();
  }, []);

  const fetchSavedAnalyses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data, error } = await supabase
        .from('saved_profile_analyses')
        .select('*')
        .eq('user_id', user.id)
        .order('saved_at', { ascending: false });

      if (error) throw error;
      
      const analysesWithAvatars = await Promise.all(
        (data || []).map(async (analysis) => {
          const { data: jobData } = await supabase
            .from('Analysis Profile 2 - analysis_jobs')
            .select('profile_id, total_videos, exclude_pinned')
            .eq('id', analysis.job_id)
            .maybeSingle();
          
          if (jobData?.profile_id) {
            const profileId = Math.floor(Number(jobData.profile_id));
            const { data: profileData } = await supabase
              .from('Analysis Profile 1 - Profiles')
              .select('profile_avatar, profile_followers, profile_likes, profile_posts, verified, stats')
              .eq('id', profileId)
              .maybeSingle();
            
            return { 
              ...analysis, 
              profile_avatar: profileData?.profile_avatar,
              profile_followers: profileData?.profile_followers,
              profile_likes: profileData?.profile_likes,
              profile_posts: profileData?.profile_posts,
              verified: profileData?.verified,
              total_videos: jobData.total_videos,
              exclude_pinned: jobData.exclude_pinned,
              stats: profileData?.stats as SavedAnalysis['stats']
            };
          }
          return { ...analysis, total_videos: jobData?.total_videos, exclude_pinned: jobData?.exclude_pinned };
        })
      );
      
      setAnalyses(analysesWithAvatars);
      
      // Fetch cross-profile content insights and video data for charts
      if (data && data.length > 0) {
        const jobIds = data.map(d => d.job_id);
        fetchCrossProfileInsights(jobIds);
        fetchAnalysisVideoData(analysesWithAvatars);
        
        // Fetch highlights for the most recent analysis
        if (analysesWithAvatars.length > 0) {
          fetchLastAnalysisHighlights(analysesWithAvatars[0].job_id);
        }
        
        // Select top 4 analyses by default for comparison
        setSelectedAnalyses(new Set(jobIds.slice(0, 4)));
      }
    } catch (error) {
      console.error('Error fetching saved analyses:', error);
      toast({
        title: "Error",
        description: "Failed to load saved analyses",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalysisVideoData = async (analysesData: SavedAnalysis[]) => {
    try {
      const videoDataPromises = analysesData.slice(0, 8).map(async (analysis, index) => {
        const { data: videos } = await supabase
          .from('Analysis Profile 3 - video_analysis')
          .select('post_views, post_likes, post_time_date, caption, visual_analysis, content_url')
          .eq('job_id', analysis.job_id)
          .eq('Status', 'complete')
          .order('post_time_date', { ascending: true });

        return {
          job_id: analysis.job_id,
          handle: analysis.handle || `Analysis ${index + 1}`,
          color: ANALYSIS_COLORS[index % ANALYSIS_COLORS.length],
          videos: (videos || []).map(v => ({
            views: v.post_views || 0,
            likes: v.post_likes || 0,
            date: v.post_time_date || '',
            caption: v.caption || '',
            content_url: v.content_url || '',
          })),
        };
      });

      const results = await Promise.all(videoDataPromises);
      setAnalysisVideoData(results.filter(r => r.videos.length > 0));
    } catch (error) {
      console.error('Error fetching video data:', error);
    }
  };

  const fetchLastAnalysisHighlights = async (jobId: number) => {
    try {
      const { data: videos } = await supabase
        .from('Analysis Profile 3 - video_analysis')
        .select('post_views, post_likes, caption, visual_analysis')
        .eq('job_id', jobId)
        .eq('Status', 'complete');

      if (!videos || videos.length === 0) return;

      // Find top video by views
      const sortedByViews = [...videos].sort((a, b) => (b.post_views || 0) - (a.post_views || 0));
      const topVideo = sortedByViews[0];

      // Parse content style from top video
      let contentStyle = 'Unknown';
      if (topVideo?.visual_analysis) {
        try {
          const analysis = JSON.parse(topVideo.visual_analysis);
          contentStyle = analysis.main_category || 'Unknown';
        } catch {}
      }

      // Content breakdown
      const styleMap = new Map<string, number>();
      videos.forEach(v => {
        if (v.visual_analysis) {
          try {
            const analysis = JSON.parse(v.visual_analysis);
            if (analysis.main_category) {
              styleMap.set(analysis.main_category, (styleMap.get(analysis.main_category) || 0) + 1);
            }
          } catch {}
        }
      });

      const contentBreakdown = Array.from(styleMap.entries())
        .map(([name, count]) => ({
          name,
          count,
          color: getContentCategoryColor(name).bg,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Calculate totals
      const totalViews = videos.reduce((sum, v) => sum + (v.post_views || 0), 0);
      const totalLikes = videos.reduce((sum, v) => sum + (v.post_likes || 0), 0);
      const avgEngagement = totalViews > 0 ? (totalLikes / totalViews) * 100 : 0;

      setLastAnalysisHighlights({
        topVideo: topVideo ? {
          views: topVideo.post_views || 0,
          likes: topVideo.post_likes || 0,
          caption: topVideo.caption || '',
          contentStyle,
        } : null,
        contentBreakdown,
        totalViews,
        totalLikes,
        avgEngagement,
      });
    } catch (error) {
      console.error('Error fetching last analysis highlights:', error);
    }
  };

  const fetchCrossProfileInsights = async (jobIds: number[]) => {
    try {
      // Fetch video analyses for all jobs
      const { data: videoData } = await supabase
        .from('Analysis Profile 3 - video_analysis')
        .select('visual_analysis, post_views, post_likes')
        .in('job_id', jobIds)
        .eq('Status', 'complete');

      if (!videoData) return;

      // Aggregate content styles
      const contentStyleMap = new Map<string, { count: number; totalViews: number; totalLikes: number }>();
      const genreMap = new Map<string, { count: number; totalViews: number; totalLikes: number }>();

      videoData.forEach(video => {
        if (video.visual_analysis) {
          try {
            const analysis = JSON.parse(video.visual_analysis);
            const views = video.post_views || 0;
            const likes = video.post_likes || 0;

            // Extract content style
            if (analysis.main_category) {
              const style = analysis.main_category;
              const existing = contentStyleMap.get(style) || { count: 0, totalViews: 0, totalLikes: 0 };
              contentStyleMap.set(style, {
                count: existing.count + 1,
                totalViews: existing.totalViews + views,
                totalLikes: existing.totalLikes + likes,
              });
            }

            // Extract genre from audio analysis (if nested)
            if (analysis.audio_analysis?.genre) {
              let genreData = analysis.audio_analysis.genre;
              if (typeof genreData === 'string') {
                try {
                  genreData = JSON.parse(genreData);
                } catch {}
              }
              if (typeof genreData === 'object') {
                Object.keys(genreData).forEach(genre => {
                  const existing = genreMap.get(genre) || { count: 0, totalViews: 0, totalLikes: 0 };
                  genreMap.set(genre, {
                    count: existing.count + 1,
                    totalViews: existing.totalViews + views,
                    totalLikes: existing.totalLikes + likes,
                  });
                });
              }
            }
          } catch {}
        }
      });

      // Convert to sorted arrays
      const contentInsightsArray: ContentInsight[] = Array.from(contentStyleMap.entries())
        .map(([name, data]) => ({
          name,
          count: data.count,
          avgViews: data.count > 0 ? Math.round(data.totalViews / data.count) : 0,
          avgEngagement: data.totalViews > 0 ? (data.totalLikes / data.totalViews) * 100 : 0,
          color: getContentCategoryColor(name).bg,
        }))
        .sort((a, b) => b.avgViews - a.avgViews)
        .slice(0, 6);

      const genreInsightsArray: ContentInsight[] = Array.from(genreMap.entries())
        .map(([name, data]) => ({
          name,
          count: data.count,
          avgViews: data.count > 0 ? Math.round(data.totalViews / data.count) : 0,
          avgEngagement: data.totalViews > 0 ? (data.totalLikes / data.totalViews) * 100 : 0,
          color: getGenreColor(name).bg,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);

      setContentInsights(contentInsightsArray);
      setGenreInsights(genreInsightsArray);
    } catch (error) {
      console.error('Error fetching cross-profile insights:', error);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const { error } = await supabase
        .from('saved_profile_analyses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setAnalyses(analyses.filter(a => a.id !== id));
      toast({
        title: "Deleted",
        description: "Analysis removed from your saved list",
      });
    } catch (error) {
      console.error('Error deleting analysis:', error);
      toast({
        title: "Error",
        description: "Failed to delete analysis",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleStartEdit = (analysis: SavedAnalysis) => {
    setEditingId(analysis.id);
    setEditValue(analysis.handle || '');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValue("");
  };

  const handleSaveEdit = async (id: string) => {
    if (!editValue.trim()) {
      toast({
        title: "Error",
        description: "Name cannot be empty",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('saved_profile_analyses')
        .update({ handle: editValue.trim() })
        .eq('id', id);

      if (error) throw error;

      setAnalyses(analyses.map(a => 
        a.id === id ? { ...a, handle: editValue.trim() } : a
      ));
      setEditingId(null);
      setEditValue("");
      toast({
        title: "Updated",
        description: "Analysis name updated successfully",
      });
    } catch (error) {
      console.error('Error updating analysis:', error);
      toast({
        title: "Error",
        description: "Failed to update analysis name",
        variant: "destructive",
      });
    }
  };

  const handleViewAnalysis = (jobId: number) => {
    navigate(`/tiktok-audit/${jobId}`);
  };

  const toggleAnalysisSelection = (jobId: number) => {
    setSelectedAnalyses(prev => {
      const next = new Set(prev);
      if (next.has(jobId)) {
        next.delete(jobId);
      } else {
        next.add(jobId);
      }
      return next;
    });
  };

  // Build comparison chart data - normalize by video index, apply limit filter
  const comparisonChartData = useMemo(() => {
    const selectedData = analysisVideoData.filter(a => selectedAnalyses.has(a.job_id));
    if (selectedData.length === 0) return [];

    // Apply video limit filter - get last N videos (sorted by date, most recent last)
    const limitedData = selectedData.map(analysis => {
      // Videos are already sorted by date ascending (oldest first)
      // For "last N", we take the last N items (most recent)
      const limit = chartVideoLimit === 'all' ? analysis.videos.length : parseInt(chartVideoLimit, 10);
      const startIdx = Math.max(0, analysis.videos.length - limit);
      return {
        ...analysis,
        videos: analysis.videos.slice(startIdx),
      };
    });

    const maxVideos = Math.max(...limitedData.map(a => a.videos.length));
    const data: VideoDataPoint[] = [];

    for (let i = 0; i < maxVideos; i++) {
      const point: VideoDataPoint = { index: i + 1 };
      limitedData.forEach(analysis => {
        if (analysis.videos[i]) {
          point[`views_${analysis.handle}`] = analysis.videos[i].views;
        }
      });
      data.push(point);
    }

    return data;
  }, [analysisVideoData, selectedAnalyses, chartVideoLimit]);

  // Get filtered analysis data for dot clicks (respecting the limit)
  const filteredAnalysisVideoData = useMemo(() => {
    return analysisVideoData.map(analysis => {
      const limit = chartVideoLimit === 'all' ? analysis.videos.length : parseInt(chartVideoLimit, 10);
      const startIdx = Math.max(0, analysis.videos.length - limit);
      return {
        ...analysis,
        videos: analysis.videos.slice(startIdx),
      };
    });
  }, [analysisVideoData, chartVideoLimit]);

  // Dashboard calculations
  const totalAnalyses = analyses.length;
  const uniqueHandles = new Set(analyses.map(a => a.handle?.toLowerCase())).size;
  const totalVideosAnalyzed = analyses.reduce((sum, a) => sum + (a.total_videos || 0), 0);
  
  // Recent/last analysis
  const mostRecentAnalysis = analyses[0];
  
  // Top performer by engagement
  const topByEngagement = [...analyses]
    .filter(a => a.stats?.avg_engagement != null)
    .sort((a, b) => (b.stats?.avg_engagement || 0) - (a.stats?.avg_engagement || 0))[0];
  
  // Top performer by views
  const topByViews = [...analyses]
    .filter(a => a.stats?.avg_views != null)
    .sort((a, b) => (b.stats?.avg_views || 0) - (a.stats?.avg_views || 0))[0];

  // Timeline data - analyses over time
  const timelineData = [...analyses]
    .filter(a => a.saved_at)
    .sort((a, b) => new Date(a.saved_at!).getTime() - new Date(b.saved_at!).getTime())
    .map((a, index) => ({
      date: format(new Date(a.saved_at!), 'MMM d'),
      fullDate: a.saved_at,
      handle: a.handle,
      engagement: a.stats?.avg_engagement || 0,
      views: a.stats?.avg_views || 0,
      cumulativeCount: index + 1,
    }));

  // Next milestone calculation
  const nextMilestone = INSIGHT_MILESTONES.find(m => totalAnalyses < m.count);
  const progressToNextMilestone = nextMilestone 
    ? (totalAnalyses / nextMilestone.count) * 100 
    : 100;

  return (
    <div className="relative min-h-screen overflow-hidden">
      <SEOHead 
        title="My Analyses - Wavebound"
        description="View and compare all your saved profile analyses. Track performance trends and content insights across accounts."
      />
      {/* Clean light background */}
      <div className="fixed inset-0 bg-gradient-to-br from-white via-slate-50/80 to-indigo-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.9),_transparent_60%)] dark:bg-[radial-gradient(ellipse_at_top,_rgba(99,102,241,0.03),_transparent_60%)]" />
      <div className="fixed top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-700 to-transparent" />

      <div className="relative z-10">
        <HeaderAuth variant="light" />

        {/* Compact Header */}
        <section className="border-b border-border bg-card/50 pt-24 pb-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                  My <span className="bg-gradient-to-r from-sky-500 to-cyan-500 bg-clip-text text-transparent">Analyses</span>
                </h1>
                <p className="text-muted-foreground mt-1">
                  Track performance and unlock deeper insights
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-border">
                  <div className="w-1.5 h-1.5 rounded-full bg-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">TikTok</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-dashed border-border">
                  <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-br from-pink-500/50 to-orange-500/50" />
                  <span className="text-xs font-medium text-muted-foreground/60">Instagram — coming soon</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : analyses.length === 0 ? (
            <div className="text-center py-20">
              <div className="mb-6">
                <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 bg-card border border-border shadow-sm">
                  <BarChart3 className="w-10 h-10 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-semibold mb-2 text-foreground">Start Your Journey</h2>
                <p className="mb-6 max-w-md mx-auto text-muted-foreground">
                  Analyze your first profile to begin tracking performance and unlocking insights
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
                {INSIGHT_MILESTONES.map((milestone) => (
                  <Card key={milestone.count} className="p-4 opacity-60">
                    <div className="flex items-center gap-2 mb-2">
                      <Lock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{milestone.count} analyses</span>
                    </div>
                    <milestone.icon className="w-6 h-6 mb-2 text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground">{milestone.title}</p>
                  </Card>
                ))}
              </div>
              
              <Button 
                onClick={() => navigate('/analyze-profile')} 
                size="lg"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Analyze Your First Profile
              </Button>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Quick Actions Bar */}
              <div className="flex flex-wrap gap-3">
                <Button 
                  onClick={() => navigate('/analyze-profile')} 
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  New Analysis
                </Button>
                {mostRecentAnalysis && (
                  <Button 
                    variant="outline" 
                    onClick={() => handleViewAnalysis(mostRecentAnalysis.job_id)}
                    className="gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Continue Last Analysis
                  </Button>
                )}
              </div>

              {/* Recent Analysis Summary Card - Matches Landing Page Design */}
              {mostRecentAnalysis && (
                <Card className="overflow-hidden bg-card border border-border shadow-lg">
                  {/* Header */}
                  <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={mostRecentAnalysis.profile_avatar || ''} />
                        <AvatarFallback className="bg-gradient-to-br from-sky-500 to-violet-600 text-white font-semibold text-sm">
                          {mostRecentAnalysis.handle 
                            ? mostRecentAnalysis.handle.slice(0, 2).toUpperCase()
                            : <User className="w-4 h-4" />
                          }
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium text-foreground">
                            @{mostRecentAnalysis.handle || "profile"}
                          </span>
                          {mostRecentAnalysis.verified && (
                            <BadgeCheck className="w-4 h-4 text-primary" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {mostRecentAnalysis.total_videos || 0} videos analyzed
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">
                        {mostRecentAnalysis.saved_at 
                          ? formatDistanceToNow(new Date(mostRecentAnalysis.saved_at), { addSuffix: true })
                          : ''}
                      </span>
                      <Button 
                        onClick={() => handleViewAnalysis(mostRecentAnalysis.job_id)}
                        className="gap-2"
                      >
                        View Full Analysis
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Stats Row - Same Style as Landing Page */}
                  <div className="grid grid-cols-4 border-b border-border">
                    <div className="p-3 md:p-4 text-center border-r border-border">
                      <Eye className="w-4 h-4 mx-auto mb-1.5 text-muted-foreground" />
                      <p className="text-base md:text-lg font-semibold text-foreground">
                        {formatNumber(mostRecentAnalysis.stats?.avg_views || 0)}
                      </p>
                      <p className="text-[10px] md:text-xs text-muted-foreground">Avg Views</p>
                    </div>
                    <div className="p-3 md:p-4 text-center border-r border-border">
                      <Heart className="w-4 h-4 mx-auto mb-1.5 text-muted-foreground" />
                      <p className="text-base md:text-lg font-semibold text-foreground">
                        {formatNumber(mostRecentAnalysis.stats?.avg_likes || 0)}
                      </p>
                      <p className="text-[10px] md:text-xs text-muted-foreground">Avg Likes</p>
                    </div>
                    <div className="p-3 md:p-4 text-center border-r border-border">
                      <MessageCircle className="w-4 h-4 mx-auto mb-1.5 text-muted-foreground" />
                      <p className="text-base md:text-lg font-semibold text-foreground">
                        {formatNumber(mostRecentAnalysis.stats?.avg_comments || 0)}
                      </p>
                      <p className="text-[10px] md:text-xs text-muted-foreground">Avg Comments</p>
                    </div>
                    <div className="p-3 md:p-4 text-center">
                      <TrendingUp className="w-4 h-4 mx-auto mb-1.5 text-muted-foreground" />
                      <p className="text-base md:text-lg font-semibold text-foreground">
                        {(mostRecentAnalysis.stats?.avg_engagement || 0).toFixed(1)}%
                      </p>
                      <p className="text-[10px] md:text-xs text-muted-foreground">Eng. Rate</p>
                    </div>
                  </div>

                  {/* Highlights Section - Same Style as Landing Page */}
                  {lastAnalysisHighlights && (
                    <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
                      {/* Top Performing Video */}
                      {lastAnalysisHighlights.topVideo && (
                        <div className="p-4">
                          <div className="flex items-center gap-1.5 mb-3">
                            <Crown className="w-3.5 h-3.5 text-amber-500" />
                            <span className="text-xs font-medium text-foreground">Top Video</span>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1.5">
                                <Eye className="w-4 h-4 text-muted-foreground" />
                                <span className="text-lg font-bold">{formatNumber(lastAnalysisHighlights.topVideo.views)}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Heart className="w-4 h-4 text-red-400" />
                                <span className="font-semibold text-muted-foreground">{formatNumber(lastAnalysisHighlights.topVideo.likes)}</span>
                              </div>
                            </div>
                            <Badge 
                              className="text-xs text-white"
                              style={{ backgroundColor: getContentCategoryColor(lastAnalysisHighlights.topVideo.contentStyle).bg }}
                            >
                              {lastAnalysisHighlights.topVideo.contentStyle}
                            </Badge>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {lastAnalysisHighlights.topVideo.caption || 'No caption'}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Aggregate Stats */}
                      <div className="p-4">
                        <div className="flex items-center gap-1.5 mb-3">
                          <Activity className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-xs font-medium text-foreground">Aggregate Stats</span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Total Views</span>
                            <span className="font-semibold">{formatNumber(lastAnalysisHighlights.totalViews)}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Total Likes</span>
                            <span className="font-semibold">{formatNumber(lastAnalysisHighlights.totalLikes)}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Avg Engagement</span>
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                              {lastAnalysisHighlights.avgEngagement.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Content Mix */}
                      <div className="p-4">
                        <div className="flex items-center gap-1.5 mb-3">
                          <Palette className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-xs font-medium text-foreground">Content Mix</span>
                        </div>
                        <div className="space-y-2">
                          {lastAnalysisHighlights.contentBreakdown.slice(0, 4).map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <div 
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{ backgroundColor: item.color }}
                              />
                              <span className="text-xs text-foreground/80 truncate">{item.name}</span>
                              <span className="text-xs text-muted-foreground ml-auto">{item.count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              )}

              {/* Stats Overview - Updated to Match Landing Page Card Style */}
              <Card className="overflow-hidden bg-card border border-border">
                <div className="grid grid-cols-4 divide-x divide-border">
                  <div className="p-3 md:p-4 text-center">
                    <BarChart3 className="w-4 h-4 mx-auto mb-1.5 text-muted-foreground" />
                    <p className="text-base md:text-lg font-semibold text-foreground">{totalAnalyses}</p>
                    <p className="text-[10px] md:text-xs text-muted-foreground">Total Analyses</p>
                  </div>
                  <div className="p-3 md:p-4 text-center">
                    <Users className="w-4 h-4 mx-auto mb-1.5 text-muted-foreground" />
                    <p className="text-base md:text-lg font-semibold text-foreground">{uniqueHandles}</p>
                    <p className="text-[10px] md:text-xs text-muted-foreground">Unique Profiles</p>
                  </div>
                  <div className="p-3 md:p-4 text-center">
                    <Activity className="w-4 h-4 mx-auto mb-1.5 text-muted-foreground" />
                    <p className="text-base md:text-lg font-semibold text-foreground">{totalVideosAnalyzed}</p>
                    <p className="text-[10px] md:text-xs text-muted-foreground">Videos Analyzed</p>
                  </div>
                  <div className="p-3 md:p-4 text-center">
                    <Calendar className="w-4 h-4 mx-auto mb-1.5 text-muted-foreground" />
                    <p className="text-base md:text-lg font-semibold text-foreground">
                      {analyses[0]?.saved_at 
                        ? format(new Date(analyses[0].saved_at), 'MMM d')
                        : '-'}
                    </p>
                    <p className="text-[10px] md:text-xs text-muted-foreground">Last Analysis</p>
                  </div>
                </div>
              </Card>

              {/* Multi-Analysis Comparison Chart */}
              {analysisVideoData.length > 0 && (
                <Card className="glass-card overflow-hidden">
                  <div className="p-5 border-b border-border/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <LineChart className="w-5 h-5 text-primary" />
                          <h3 className="font-semibold">Cross-Analysis Comparison</h3>
                        </div>
                        <p className="text-xs text-muted-foreground">Compare video views across profiles • <span className="text-primary">Click any dot to preview</span></p>
                      </div>
                      
                      {/* Video limit filter */}
                      <Select value={chartVideoLimit} onValueChange={setChartVideoLimit}>
                        <SelectTrigger className="h-9 w-[140px] bg-background">
                          <SelectValue placeholder="Videos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Videos</SelectItem>
                          <SelectItem value="5">Last 5</SelectItem>
                          <SelectItem value="10">Last 10</SelectItem>
                          <SelectItem value="15">Last 15</SelectItem>
                          <SelectItem value="20">Last 20</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {/* Analysis Selection */}
                  <div className="px-5 py-4 border-b border-border/30 bg-muted/10">
                    <p className="text-xs font-medium text-muted-foreground mb-3">Select profiles to compare:</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {analysisVideoData.map((analysis) => {
                        const isSelected = selectedAnalyses.has(analysis.job_id);
                        return (
                          <button
                            key={analysis.job_id}
                            onClick={() => toggleAnalysisSelection(analysis.job_id)}
                            className={`
                              relative flex items-center gap-2.5 p-3 rounded-lg border-2 transition-all duration-200
                              ${isSelected 
                                ? 'border-primary bg-primary/5 shadow-sm' 
                                : 'border-border/50 bg-card hover:border-border hover:bg-muted/30'
                              }
                            `}
                          >
                            {/* Color indicator bar */}
                            <div 
                              className={`absolute left-0 top-2 bottom-2 w-1 rounded-full transition-opacity ${isSelected ? 'opacity-100' : 'opacity-40'}`}
                              style={{ backgroundColor: analysis.color }}
                            />
                            
                            <div className="flex-1 min-w-0 pl-2">
                              <p className={`text-sm font-medium truncate ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`}>
                                @{analysis.handle}
                              </p>
                              <p className="text-xs text-muted-foreground/70">
                                {analysis.videos.length} videos
                              </p>
                            </div>
                            
                            {/* Selection indicator */}
                            <div 
                              className={`
                                w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all
                                ${isSelected 
                                  ? 'border-primary bg-primary' 
                                  : 'border-muted-foreground/30 bg-transparent'
                                }
                              `}
                            >
                              {isSelected && (
                                <Check className="w-3 h-3 text-primary-foreground" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    
                    {/* Quick actions */}
                    <div className="flex gap-2 mt-3">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-xs h-7"
                        onClick={() => setSelectedAnalyses(new Set(analysisVideoData.map(a => a.job_id)))}
                      >
                        Select All
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-xs h-7"
                        onClick={() => setSelectedAnalyses(new Set())}
                      >
                        Clear All
                      </Button>
                    </div>
                  </div>

                  {/* Chart */}
                  <div className="p-5">
                    {comparisonChartData.length > 0 ? (
                      <div className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={comparisonChartData}>
                            <defs>
                              {analysisVideoData.filter(a => selectedAnalyses.has(a.job_id)).map((analysis) => (
                                <linearGradient key={analysis.job_id} id={`gradient_${analysis.job_id}`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor={analysis.color} stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor={analysis.color} stopOpacity={0}/>
                                </linearGradient>
                              ))}
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                            <XAxis 
                              dataKey="index" 
                              fontSize={11} 
                              tickLine={false}
                              axisLine={false}
                              label={{ value: 'Video #', position: 'insideBottom', offset: -5, fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                            />
                            <YAxis 
                              fontSize={11} 
                              tickLine={false}
                              axisLine={false}
                              tickFormatter={(v) => formatNumber(v)}
                              label={{ value: 'Views', angle: -90, position: 'insideLeft', fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                            />
                            <Tooltip 
                              content={({ active, payload, label }) => {
                                if (active && payload && payload.length) {
                                  return (
                                    <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                                      <p className="font-medium mb-2">Video #{label}</p>
                                      <div className="space-y-1">
                                        {payload.map((entry: any) => {
                                          const handle = entry.dataKey.replace('views_', '');
                                          const analysisData = analysisVideoData.find(a => a.handle === handle);
                                          return (
                                            <div key={entry.dataKey} className="flex items-center gap-2 text-sm">
                                              <div 
                                                className="w-2 h-2 rounded-full"
                                                style={{ backgroundColor: analysisData?.color }}
                                              />
                                              <span className="text-muted-foreground">@{handle}:</span>
                                              <span className="font-medium">{formatNumber(entry.value)}</span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            {filteredAnalysisVideoData
                              .filter(analysis => selectedAnalyses.has(analysis.job_id))
                              .map((analysis) => (
                                <Area
                                  key={analysis.job_id}
                                  type="monotone"
                                  dataKey={`views_${analysis.handle}`}
                                  stroke={analysis.color}
                                  strokeWidth={2}
                                  fill={`url(#gradient_${analysis.job_id})`}
                                  dot={(props: any) => {
                                    const { cx, cy, payload, index: dotIndex } = props;
                                    // Skip rendering if coordinates are invalid
                                    if (cx === undefined || cy === undefined || isNaN(cx) || isNaN(cy)) {
                                      return null;
                                    }
                                    // payload.index is the 1-based video index from comparisonChartData
                                    const videoIndex = (payload?.index ?? 1) - 1;
                                    const handleDotClick = (e: React.MouseEvent) => {
                                      e.stopPropagation();
                                      if (videoIndex >= 0 && analysis.videos[videoIndex]) {
                                        const video = analysis.videos[videoIndex];
                                        setSelectedChartVideo({
                                          handle: analysis.handle,
                                          content_url: video.content_url,
                                          views: video.views,
                                          likes: video.likes,
                                          caption: video.caption,
                                          color: analysis.color
                                        });
                                      }
                                    };
                                    return (
                                      <circle
                                        key={dotIndex}
                                        cx={cx}
                                        cy={cy}
                                        r={5}
                                        fill={analysis.color}
                                        stroke="white"
                                        strokeWidth={1}
                                        style={{ cursor: 'pointer' }}
                                        onClick={handleDotClick}
                                      />
                                    );
                                  }}
                                  activeDot={{ 
                                    r: 8, 
                                    strokeWidth: 2,
                                    stroke: 'white',
                                    style: { cursor: 'pointer' },
                                    onClick: (e: any, data: any) => {
                                      const payload = data?.payload || e?.payload;
                                      const videoIndex = (payload?.index ?? 1) - 1;
                                      if (videoIndex >= 0 && analysis.videos[videoIndex]) {
                                        const video = analysis.videos[videoIndex];
                                        setSelectedChartVideo({
                                          handle: analysis.handle,
                                          content_url: video.content_url,
                                          views: video.views,
                                          likes: video.likes,
                                          caption: video.caption,
                                          color: analysis.color,
                                        });
                                      }
                                    }
                                  }}
                                />
                              ))}
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                        <p className="text-sm">Select at least one analysis to view the comparison chart</p>
                      </div>
                    )}
                  </div>

                  {/* Legend */}
                  {comparisonChartData.length > 0 && (
                    <div className="px-5 pb-5">
                      <div className="flex flex-wrap gap-4 justify-center">
                        {analysisVideoData
                          .filter(a => selectedAnalyses.has(a.job_id))
                          .map(analysis => (
                            <div key={analysis.job_id} className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: analysis.color }}
                              />
                              <span className="text-sm text-muted-foreground">@{analysis.handle}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </Card>
              )}

              {/* Cross-Profile Insights Section */}
              {(contentInsights.length > 0 || genreInsights.length > 0) && (
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Best Content Styles Discovered */}
                  {contentInsights.length > 0 && (
                    <Card className="glass-card p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <Palette className="w-5 h-5 text-primary" />
                        <h3 className="font-semibold">Top Content Styles Discovered</h3>
                      </div>
                      <p className="text-xs text-muted-foreground mb-4">
                        Ranked by average views across all your analyzed profiles
                      </p>
                      <div className="space-y-3">
                        {contentInsights.map((insight, index) => (
                          <div key={insight.name} className="flex items-center gap-3">
                            <div 
                              className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm text-white"
                              style={{ backgroundColor: insight.color }}
                            >
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{insight.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {insight.count} videos • {formatNumber(insight.avgViews)} avg views
                              </p>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {insight.avgEngagement.toFixed(1)}% ER
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}

                  {/* Trending Genres */}
                  {genreInsights.length > 0 && (
                    <Card className="glass-card p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <Music className="w-5 h-5 text-primary" />
                        <h3 className="font-semibold">Trending Genres Found</h3>
                      </div>
                      <p className="text-xs text-muted-foreground mb-4">
                        Music genres that appear most in high-performing content
                      </p>
                      <div className="space-y-3">
                        {genreInsights.map((insight, index) => (
                          <div key={insight.name} className="flex items-center gap-3">
                            <div 
                              className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm text-white"
                              style={{ backgroundColor: insight.color }}
                            >
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{insight.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {insight.count} videos • {formatNumber(insight.avgViews)} avg views
                              </p>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {insight.avgEngagement.toFixed(1)}% ER
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}
                </div>
              )}

              {/* Progress to Next Insight */}
              {nextMilestone && (
                <Card className="glass-card p-5 border-primary/20">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <nextMilestone.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">Unlock: {nextMilestone.title}</p>
                        <p className="text-sm text-muted-foreground">{nextMilestone.description}</p>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-primary">
                      {totalAnalyses}/{nextMilestone.count}
                    </span>
                  </div>
                  <Progress value={progressToNextMilestone} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-2">
                    {nextMilestone.count - totalAnalyses} more {nextMilestone.count - totalAnalyses === 1 ? 'analysis' : 'analyses'} to unlock
                  </p>
                </Card>
              )}

              {/* Top Performers */}
              {(topByEngagement || topByViews) && (
                <div className="grid md:grid-cols-2 gap-4">
                  {topByEngagement && (
                    <Card className="glass-card p-5 border-green-500/20">
                      <div className="flex items-center gap-2 mb-3">
                        <Crown className="w-4 h-4 text-green-500" />
                        <span className="text-sm font-medium text-green-500">Highest Engagement</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={topByEngagement.profile_avatar || ''} />
                          <AvatarFallback className="bg-green-500/10">
                            <User className="h-5 w-5 text-green-500" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-semibold">@{topByEngagement.handle}</p>
                          <p className="text-2xl font-bold text-green-500">
                            {topByEngagement.stats?.avg_engagement?.toFixed(1)}% ER
                          </p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleViewAnalysis(topByEngagement.job_id)}
                        >
                          View
                        </Button>
                      </div>
                    </Card>
                  )}
                  
                  {topByViews && (
                    <Card className="glass-card p-5 border-blue-500/20">
                      <div className="flex items-center gap-2 mb-3">
                        <Target className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-medium text-blue-500">Highest Avg Views</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={topByViews.profile_avatar || ''} />
                          <AvatarFallback className="bg-blue-500/10">
                            <User className="h-5 w-5 text-blue-500" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-semibold">@{topByViews.handle}</p>
                          <p className="text-2xl font-bold text-blue-500">
                            {formatNumber(topByViews.stats?.avg_views || 0)} views
                          </p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleViewAnalysis(topByViews.job_id)}
                        >
                          View
                        </Button>
                      </div>
                    </Card>
                  )}
                </div>
              )}

              {/* Timeline Chart - Shows progress over time */}
              {timelineData.length >= 2 ? (
                <Card className="glass-card p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold">Your Analysis Journey</h3>
                      <p className="text-sm text-muted-foreground">Engagement trends over time</p>
                    </div>
                    <LineChart className="w-5 h-5 text-primary" />
                  </div>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={timelineData}>
                        <defs>
                          <linearGradient id="engagementGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis 
                          dataKey="date" 
                          fontSize={11} 
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis 
                          fontSize={11} 
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(v) => `${v}%`}
                        />
                        <Tooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                                  <p className="font-semibold">@{data.handle}</p>
                                  <p className="text-sm text-muted-foreground">{data.date}</p>
                                  <p className="text-sm text-primary">{data.engagement.toFixed(1)}% engagement</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="engagement" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={2}
                          fill="url(#engagementGradient)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              ) : (
                <Card className="glass-card p-6 border-dashed border-2 border-primary/20">
                  <div className="text-center">
                    <LineChart className="w-10 h-10 text-primary/50 mx-auto mb-3" />
                    <h3 className="font-semibold mb-1">Timeline Insights Coming Soon</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Complete {2 - timelineData.length} more {2 - timelineData.length === 1 ? 'analysis' : 'analyses'} to see your engagement trends over time
                    </p>
                    <Button variant="outline" size="sm" onClick={() => navigate('/analyze-profile')}>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Analyze Another Profile
                    </Button>
                  </div>
                </Card>
              )}

              {/* Locked Insights Preview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {INSIGHT_MILESTONES.map((milestone) => {
                  const isUnlocked = totalAnalyses >= milestone.count;
                  return (
                    <Card 
                      key={milestone.count} 
                      className={`glass-card p-4 transition-all ${isUnlocked ? 'border-primary/30' : 'opacity-60'}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className={`p-2 rounded-lg ${isUnlocked ? 'bg-primary/10' : 'bg-muted'}`}>
                          <milestone.icon className={`w-5 h-5 ${isUnlocked ? 'text-primary' : 'text-muted-foreground'}`} />
                        </div>
                        {isUnlocked ? (
                          <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                            Unlocked
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            {milestone.count} analyses
                          </span>
                        )}
                      </div>
                      <h4 className="font-semibold mb-1">{milestone.title}</h4>
                      <p className="text-sm text-muted-foreground">{milestone.description}</p>
                    </Card>
                  );
                })}
              </div>

              {/* Artist Performance Table */}
              <Card className="glass-card overflow-hidden">
                <div className="p-4 border-b border-border/50">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-primary" />
                        Artist Performance Overview
                      </h3>
                      <p className="text-sm text-muted-foreground">Compare profiles and identify top performers</p>
                    </div>
                    
                    {/* Filters */}
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Search profiles..."
                          value={tableSearch}
                          onChange={(e) => setTableSearch(e.target.value)}
                          className="pl-8 h-9 w-[180px] bg-background"
                        />
                      </div>
                      
                      <Select value={tableFilterFollowers} onValueChange={setTableFilterFollowers}>
                        <SelectTrigger className="h-9 w-[140px] bg-background">
                          <Users className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                          <SelectValue placeholder="Followers" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Sizes</SelectItem>
                          <SelectItem value="micro">Under 10K</SelectItem>
                          <SelectItem value="small">10K-100K</SelectItem>
                          <SelectItem value="mid">100K-500K</SelectItem>
                          <SelectItem value="large">500K-1M</SelectItem>
                          <SelectItem value="mega">1M+</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Select value={tableFilterEngagement} onValueChange={setTableFilterEngagement}>
                        <SelectTrigger className="h-9 w-[140px] bg-background">
                          <TrendingUp className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                          <SelectValue placeholder="Engagement" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All ER</SelectItem>
                          <SelectItem value="low">Under 2%</SelectItem>
                          <SelectItem value="average">2-5%</SelectItem>
                          <SelectItem value="good">5-10%</SelectItem>
                          <SelectItem value="excellent">10%+</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-[50px]">#</TableHead>
                        <TableHead className="min-w-[200px]">
                          <button
                            onClick={() => {
                              if (tableSortKey === "handle") {
                                setTableSortDir(d => d === "asc" ? "desc" : "asc");
                              } else {
                                setTableSortKey("handle");
                                setTableSortDir("asc");
                              }
                            }}
                            className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                          >
                            Profile
                            {tableSortKey === "handle" ? (
                              tableSortDir === "asc" ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                            ) : (
                              <ArrowUpDown className="w-3.5 h-3.5 opacity-50" />
                            )}
                          </button>
                        </TableHead>
                        <TableHead className="text-right">
                          <button
                            onClick={() => {
                              if (tableSortKey === "followers") {
                                setTableSortDir(d => d === "asc" ? "desc" : "asc");
                              } else {
                                setTableSortKey("followers");
                                setTableSortDir("desc");
                              }
                            }}
                            className="flex items-center gap-1.5 ml-auto hover:text-foreground transition-colors"
                          >
                            Followers
                            {tableSortKey === "followers" ? (
                              tableSortDir === "asc" ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                            ) : (
                              <ArrowUpDown className="w-3.5 h-3.5 opacity-50" />
                            )}
                          </button>
                        </TableHead>
                        <TableHead className="text-right">
                          <button
                            onClick={() => {
                              if (tableSortKey === "avg_views") {
                                setTableSortDir(d => d === "asc" ? "desc" : "asc");
                              } else {
                                setTableSortKey("avg_views");
                                setTableSortDir("desc");
                              }
                            }}
                            className="flex items-center gap-1.5 ml-auto hover:text-foreground transition-colors"
                          >
                            Avg Views
                            {tableSortKey === "avg_views" ? (
                              tableSortDir === "asc" ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                            ) : (
                              <ArrowUpDown className="w-3.5 h-3.5 opacity-50" />
                            )}
                          </button>
                        </TableHead>
                        <TableHead className="text-right">
                          <button
                            onClick={() => {
                              if (tableSortKey === "avg_likes") {
                                setTableSortDir(d => d === "asc" ? "desc" : "asc");
                              } else {
                                setTableSortKey("avg_likes");
                                setTableSortDir("desc");
                              }
                            }}
                            className="flex items-center gap-1.5 ml-auto hover:text-foreground transition-colors"
                          >
                            Avg Likes
                            {tableSortKey === "avg_likes" ? (
                              tableSortDir === "asc" ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                            ) : (
                              <ArrowUpDown className="w-3.5 h-3.5 opacity-50" />
                            )}
                          </button>
                        </TableHead>
                        <TableHead className="text-right">
                          <button
                            onClick={() => {
                              if (tableSortKey === "engagement") {
                                setTableSortDir(d => d === "asc" ? "desc" : "asc");
                              } else {
                                setTableSortKey("engagement");
                                setTableSortDir("desc");
                              }
                            }}
                            className="flex items-center gap-1.5 ml-auto hover:text-foreground transition-colors"
                          >
                            Eng. Rate
                            {tableSortKey === "engagement" ? (
                              tableSortDir === "asc" ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                            ) : (
                              <ArrowUpDown className="w-3.5 h-3.5 opacity-50" />
                            )}
                          </button>
                        </TableHead>
                        <TableHead className="text-right">Videos</TableHead>
                        <TableHead className="text-center">Pinned</TableHead>
                        <TableHead className="text-right">
                          <button
                            onClick={() => {
                              if (tableSortKey === "saved_at") {
                                setTableSortDir(d => d === "asc" ? "desc" : "asc");
                              } else {
                                setTableSortKey("saved_at");
                                setTableSortDir("desc");
                              }
                            }}
                            className="flex items-center gap-1.5 ml-auto hover:text-foreground transition-colors"
                          >
                            Analyzed
                            {tableSortKey === "saved_at" ? (
                              tableSortDir === "asc" ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                            ) : (
                              <ArrowUpDown className="w-3.5 h-3.5 opacity-50" />
                            )}
                          </button>
                        </TableHead>
                        <TableHead className="w-[100px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analyses
                        .filter((a) => {
                          // Search filter
                          if (tableSearch && !a.handle?.toLowerCase().includes(tableSearch.toLowerCase())) {
                            return false;
                          }
                          // Followers filter
                          const followers = a.profile_followers || 0;
                          if (tableFilterFollowers === "micro" && followers >= 10000) return false;
                          if (tableFilterFollowers === "small" && (followers < 10000 || followers >= 100000)) return false;
                          if (tableFilterFollowers === "mid" && (followers < 100000 || followers >= 500000)) return false;
                          if (tableFilterFollowers === "large" && (followers < 500000 || followers >= 1000000)) return false;
                          if (tableFilterFollowers === "mega" && followers < 1000000) return false;
                          // Engagement filter
                          const engagement = a.stats?.avg_engagement || 0;
                          if (tableFilterEngagement === "low" && engagement >= 2) return false;
                          if (tableFilterEngagement === "average" && (engagement < 2 || engagement >= 5)) return false;
                          if (tableFilterEngagement === "good" && (engagement < 5 || engagement >= 10)) return false;
                          if (tableFilterEngagement === "excellent" && engagement < 10) return false;
                          return true;
                        })
                        .sort((a, b) => {
                          let aVal: any, bVal: any;
                          switch (tableSortKey) {
                            case "handle":
                              aVal = a.handle?.toLowerCase() || "";
                              bVal = b.handle?.toLowerCase() || "";
                              break;
                            case "followers":
                              aVal = a.profile_followers || 0;
                              bVal = b.profile_followers || 0;
                              break;
                            case "avg_views":
                              aVal = a.stats?.avg_views || 0;
                              bVal = b.stats?.avg_views || 0;
                              break;
                            case "avg_likes":
                              aVal = a.stats?.avg_likes || 0;
                              bVal = b.stats?.avg_likes || 0;
                              break;
                            case "engagement":
                              aVal = a.stats?.avg_engagement || 0;
                              bVal = b.stats?.avg_engagement || 0;
                              break;
                            case "saved_at":
                              aVal = new Date(a.saved_at || 0).getTime();
                              bVal = new Date(b.saved_at || 0).getTime();
                              break;
                            default:
                              aVal = 0;
                              bVal = 0;
                          }
                          if (tableSortDir === "asc") {
                            return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
                          }
                          return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
                        })
                        .map((analysis, index) => {
                          const engagement = analysis.stats?.avg_engagement || 0;
                          const engagementColor = engagement >= 10 ? "text-green-500" : engagement >= 5 ? "text-emerald-500" : engagement >= 2 ? "text-yellow-500" : "text-muted-foreground";
                          
                          return (
                            <TableRow 
                              key={analysis.id} 
                              className="cursor-pointer hover:bg-muted/50 group"
                              onClick={() => handleViewAnalysis(analysis.job_id)}
                            >
                              <TableCell className="font-medium text-muted-foreground">
                                {index + 1}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-9 w-9 flex-shrink-0">
                                    <AvatarImage src={analysis.profile_avatar || ''} alt={analysis.handle || 'Profile'} />
                                    <AvatarFallback className="bg-primary/10">
                                      <User className="h-4 w-4 text-primary" />
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-semibold truncate">@{analysis.handle || 'Unknown'}</span>
                                      {analysis.verified && (
                                        <BadgeCheck className="w-4 h-4 text-primary flex-shrink-0" />
                                      )}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                      {analysis.profile_likes ? `${formatNumber(analysis.profile_likes)} total likes` : 'No likes data'}
                                    </p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {analysis.profile_followers != null ? formatNumber(analysis.profile_followers) : '-'}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                                  <span className="font-medium">
                                    {analysis.stats?.avg_views != null ? formatNumber(analysis.stats.avg_views) : '-'}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <Heart className="w-3.5 h-3.5 text-red-400" />
                                  <span className="font-medium">
                                    {analysis.stats?.avg_likes != null ? formatNumber(analysis.stats.avg_likes) : '-'}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <Badge variant="secondary" className={`${engagementColor} font-semibold`}>
                                  {analysis.stats?.avg_engagement != null 
                                    ? `${analysis.stats.avg_engagement.toFixed(1)}%` 
                                    : '-'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <Video className="w-3.5 h-3.5 text-primary" />
                                  <span>{analysis.total_videos || '-'}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge 
                                  variant="outline" 
                                  className={analysis.exclude_pinned 
                                    ? "text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800" 
                                    : "text-muted-foreground border-border"
                                  }
                                >
                                  {analysis.exclude_pinned ? "Excluded" : "Included"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right text-sm text-muted-foreground">
                                {analysis.saved_at
                                  ? formatDistanceToNow(new Date(analysis.saved_at), { addSuffix: true })
                                  : '-'}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleStartEdit(analysis);
                                    }}
                                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDelete(analysis.id);
                                    }}
                                    disabled={deletingId === analysis.id}
                                    className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                  >
                                    {deletingId === analysis.id ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <Trash2 className="w-3.5 h-3.5" />
                                    )}
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      
                      {analyses.filter((a) => {
                        if (tableSearch && !a.handle?.toLowerCase().includes(tableSearch.toLowerCase())) return false;
                        const followers = a.profile_followers || 0;
                        if (tableFilterFollowers === "micro" && followers >= 10000) return false;
                        if (tableFilterFollowers === "small" && (followers < 10000 || followers >= 100000)) return false;
                        if (tableFilterFollowers === "mid" && (followers < 100000 || followers >= 500000)) return false;
                        if (tableFilterFollowers === "large" && (followers < 500000 || followers >= 1000000)) return false;
                        if (tableFilterFollowers === "mega" && followers < 1000000) return false;
                        const engagement = a.stats?.avg_engagement || 0;
                        if (tableFilterEngagement === "low" && engagement >= 2) return false;
                        if (tableFilterEngagement === "average" && (engagement < 2 || engagement >= 5)) return false;
                        if (tableFilterEngagement === "good" && (engagement < 5 || engagement >= 10)) return false;
                        if (tableFilterEngagement === "excellent" && engagement < 10) return false;
                        return true;
                      }).length === 0 && (
                        <TableRow>
                          <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">
                            No profiles match your filters
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                
                {/* Table Summary */}
                <div className="p-4 border-t border-border/50 bg-muted/30">
                  <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
                    <div className="flex items-center gap-4 text-muted-foreground">
                      <span>{analyses.length} total profiles</span>
                      {tableSearch || tableFilterFollowers !== "all" || tableFilterEngagement !== "all" ? (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setTableSearch("");
                            setTableFilterFollowers("all");
                            setTableFilterEngagement("all");
                          }}
                          className="h-7 text-xs"
                        >
                          Clear filters
                        </Button>
                      ) : null}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => navigate('/analyze-profile')}
                      className="gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Profile
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </main>
      </div>

      {/* Video Preview Modal */}
      <Dialog open={!!selectedChartVideo} onOpenChange={(open) => !open && setSelectedChartVideo(null)}>
        <DialogContent className="max-w-lg p-0 overflow-hidden bg-card">
          <DialogHeader className="p-4 pb-2 border-b border-border/50">
            <DialogTitle className="flex items-center gap-2 text-base">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: selectedChartVideo?.color }}
              />
              <span>@{selectedChartVideo?.handle}</span>
            </DialogTitle>
          </DialogHeader>
          
          {selectedChartVideo?.content_url ? (
            <div className="relative">
              {/* TikTok Embed */}
              <div className="aspect-[9/16] max-h-[60vh] bg-black overflow-hidden">
                <iframe
                  src={`https://www.tiktok.com/player/v1/${extractTikTokVideoId(selectedChartVideo.content_url)}?autoplay=0`}
                  className="w-full h-full"
                  allow="fullscreen"
                  allowFullScreen
                />
              </div>
              
              {/* Video Stats */}
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-muted-foreground" />
                    <span className="font-semibold">{formatNumber(selectedChartVideo.views)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Heart className="w-4 h-4 text-red-400" />
                    <span className="font-semibold">{formatNumber(selectedChartVideo.likes)}</span>
                  </div>
                </div>
                
                {selectedChartVideo.caption && (
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {selectedChartVideo.caption}
                  </p>
                )}
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full gap-2"
                  onClick={() => window.open(selectedChartVideo.content_url, '_blank')}
                >
                  <ExternalLink className="w-4 h-4" />
                  Open on TikTok
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              <Video className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Video URL not available</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <FooterSection />
    </div>
  );
};

export default MyAnalyses;
