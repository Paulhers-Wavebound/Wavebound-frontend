import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { toZonedTime, formatInTimeZone } from "date-fns-tz";
import { supabase } from "@/integrations/supabase/client";
import { getGenreColor, getContentCategoryColor } from "@/utils/tagColors";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TikTokEmbed from "./TikTokEmbed";
import AnalysisProgressLoader from "./AnalysisProgressLoader";
import ProfileAnalysisSummaryCard from "./ProfileAnalysisSummaryCard";
import { Tooltip as ChartTooltip, TooltipContent as ChartTooltipContent, TooltipProvider as ChartTooltipProvider, TooltipTrigger as ChartTooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Play, Music, Palette, Sparkles, User, Heart, MessageCircle, TrendingUp, BarChart3, Video, HelpCircle, ArrowUpDown, Share2, Bookmark, X, Loader2, CheckCircle2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import SoundAnalysisTab from "./SoundAnalysisTab";

interface VideoAnalysis {
  id: number;
  job_id: number | null;
  video_url: string | null;
  video_url_storage: string | null;
  visual_analysis: string | null;
  Status: string | null;
  created_at: string;
  caption: string | null;
  post_views: number | null;
  post_likes: number | null;
  post_shares: number | null;
  post_saves: number | null;
  post_comments: string | null;
  post_time_date: string | null;
  profile_id: number | null;
  performance_multiplier: string | null;
  viral_score: number | null;
  content_url: string | null;
  sound_id: number | null;
  video_id: number | null;
}

interface PhotoCarouselAnalysis {
  id: number;
  job_id: number | null;
  photo_url: string | null;
  photo_carousel_analysis: string | null;
  Status: string | null;
  created_at: string;
  caption: string | null;
  post_views: number | null;
  post_likes: number | null;
  post_shares: number | null;
  post_saves: number | null;
  post_comments: string | null;
  post_time_date: string | null;
  profile_id: number | null;
  performance_multiplier: string | null;
  viral_score: number | null;
  content_url: string | null;
  sound_id: string | null;
  post_id: number | null;
}

type ContentItem = VideoAnalysis | PhotoCarouselAnalysis;

interface ProfileData {
  id: number;
  handle: string | null;
  profile_nickname: string | null;
  profile_avatar: string | null;
  profile_bio: string | null;
  profile_followers: number | null;
  profile_following: number | null;
  profile_likes: number | null;
  profile_posts: number | null;
  profile_url: string | null;
  verified: boolean | null;
  stats: any;
}

interface TikTokAuditDashboardProps {
  jobId?: number;
}

const COLORS = ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

const TikTokAuditDashboard = ({ jobId: propJobId }: TikTokAuditDashboardProps) => {
  const [searchParams] = useSearchParams();
  const jobId = propJobId || Number(searchParams.get("job_id"));
  const requestedVideoCount = Number(searchParams.get("requested")) || 0;
  
  const [videos, setVideos] = useState<VideoAnalysis[]>([]);
  const [photoCarousels, setPhotoCarousels] = useState<PhotoCarouselAnalysis[]>([]);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalVideos, setTotalVideos] = useState<number>(0);
  const [availableVideos, setAvailableVideos] = useState<number | null>(null);
  const [videoSortBy, setVideoSortBy] = useState<string>("default");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedVideoId, setSelectedVideoId] = useState<number | null>(null);
  const [engagementMode, setEngagementMode] = useState<"weighted" | "likes">("weighted");
  const [categorySortMode, setCategorySortMode] = useState<"performance" | "engagement">("performance");
  const [selectedVideoForPreview, setSelectedVideoForPreview] = useState<ContentItem | null>(null);
  const [isVideoPreviewOpen, setIsVideoPreviewOpen] = useState(false);
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  
  // Function to fetch thumbnail for a single item (used for progressive loading)
  const fetchThumbnailForItem = async (item: ContentItem) => {
    if (!item.content_url || thumbnails[item.content_url]) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('fetch-tiktok-oembed', {
        body: { tiktokUrl: item.content_url }
      });
      
      if (!error && data?.thumbnail_url) {
        setThumbnails(prev => ({ ...prev, [item.content_url!]: data.thumbnail_url }));
      }
    } catch (err) {
      console.error('Error fetching thumbnail for', item.content_url, err);
    }
  };

  // Function to fetch thumbnails for multiple items (filters out already-fetched)
  const fetchThumbnailsForContent = async (contentItems: ContentItem[]) => {
    const itemsNeedingThumbnails = contentItems.filter(
      item => item.content_url && !thumbnails[item.content_url]
    );
    
    // Fetch in parallel for efficiency
    await Promise.all(itemsNeedingThumbnails.map(item => fetchThumbnailForItem(item)));
  };

  const [timePeriodSlider, setTimePeriodSlider] = useState<number>(22); // Default to 12 months
  const [sliderMode, setSliderMode] = useState<"time" | "videos">("time");
  const [videoCountSlider, setVideoCountSlider] = useState<number>(27); // Default to all videos
  const [selectedTimezone, setSelectedTimezone] = useState<string>(() => {
    // Auto-detect user's timezone
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return 'America/New_York'; // Fallback
    }
  });
  const [visibleMetrics, setVisibleMetrics] = useState<{
    views: boolean;
    likes: boolean;
    comments: boolean;
    shares: boolean;
    saves: boolean;
  }>({
    views: true,
    likes: true,
    comments: true,
    shares: true,
    saves: true,
  });

  const toggleMetric = (metric: keyof typeof visibleMetrics) => {
    setVisibleMetrics(prev => ({
      ...prev,
      [metric]: !prev[metric]
    }));
  };

  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Auto-save analysis when dashboard loads (if not already saved)
  useEffect(() => {
    const checkAndAutoSave = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !jobId) return;

      // Check if already saved
      const { data: existingSave } = await supabase
        .from('saved_profile_analyses')
        .select('id')
        .eq('user_id', user.id)
        .eq('job_id', jobId)
        .maybeSingle();

      if (existingSave) {
        setIsSaved(true);
        return;
      }

      // Not saved yet - auto-save it
      // First, get the handle from the job
      const { data: jobData } = await supabase
        .from('Analysis Profile 2 - analysis_jobs')
        .select('handle')
        .eq('id', jobId)
        .maybeSingle();
      
      const { error: saveError } = await supabase
        .from('saved_profile_analyses')
        .insert({
          user_id: user.id,
          job_id: jobId,
          handle: jobData?.handle || null,
        });
      
      if (!saveError) {
        setIsSaved(true);
      }
    };

    checkAndAutoSave();
  }, [jobId]);

  useEffect(() => {
    if (!jobId) return;

    const fetchJobData = async () => {
      const { data: jobData } = await supabase
        .from("Analysis Profile 2 - analysis_jobs")
        .select("total_videos, available_videos")
        .eq("id", jobId)
        .maybeSingle();
      
      if (jobData?.available_videos) {
        setAvailableVideos(jobData.available_videos);
        setTotalVideos(jobData.available_videos);
        return true;
      } else if (jobData?.total_videos) {
        setTotalVideos(jobData.total_videos);
        return true;
      }
      return false;
    };

    const fetchInitialData = async () => {
      setLoading(true);
      
      // Try to fetch job data - keep polling if not found yet
      const gotData = await fetchJobData();
      
      // If we didn't get available_videos, start polling for it
      if (!gotData) {
        const jobPollInterval = setInterval(async () => {
          const success = await fetchJobData();
          if (success) {
            clearInterval(jobPollInterval);
          }
        }, 2000);
        
        // Clean up after 2 minutes max
        setTimeout(() => clearInterval(jobPollInterval), 120000);
      }
      
      // Fetch videos
      const { data: videosData, error: videosError } = await supabase
        .from("Analysis Profile 3 - video_analysis")
        .select("*")
        .eq("job_id", jobId)
        .order("created_at", { ascending: true });

      // Fetch photo carousels
      const { data: carouselsData, error: carouselsError } = await supabase
        .from("Analysis Profile 4 - photo_carousel_analysis")
        .select("*")
        .eq("job_id", jobId)
        .order("created_at", { ascending: true });

      if (videosError) {
        console.error("Error fetching videos:", videosError);
      } else {
        setVideos(videosData || []);
        // Fetch thumbnails for videos
        if (videosData && videosData.length > 0) {
          fetchThumbnailsForContent(videosData);
        }
      }

      if (carouselsError) {
        console.error("Error fetching photo carousels:", carouselsError);
      } else {
        setPhotoCarousels(carouselsData || []);
        // Fetch thumbnails for carousels too
        if (carouselsData && carouselsData.length > 0) {
          fetchThumbnailsForContent(carouselsData);
        }
      }

      // Fetch profile data from first video or carousel
      const firstItem = videosData?.[0] || carouselsData?.[0];
      if (firstItem?.profile_id) {
        const { data: profileData, error: profileError } = await supabase
          .from("Analysis Profile 1 - Profiles")
          .select("*")
          .eq("id", firstItem.profile_id)
          .maybeSingle();
        
        if (profileError) {
          console.error("Error fetching profile:", profileError);
        } else if (profileData) {
          setProfile(profileData);
        }
      }
      
      setLoading(false);
    };

    fetchInitialData();

    const pollInterval = setInterval(async () => {
      // Poll for videos
      const { data: videosData, error: videosError } = await supabase
        .from("Analysis Profile 3 - video_analysis")
        .select("*")
        .eq("job_id", jobId)
        .order("created_at", { ascending: true });

      // Poll for photo carousels
      const { data: carouselsData, error: carouselsError } = await supabase
        .from("Analysis Profile 4 - photo_carousel_analysis")
        .select("*")
        .eq("job_id", jobId)
        .order("created_at", { ascending: true });

      // Also fetch the latest data from the job
      const { data: jobData } = await supabase
        .from("Analysis Profile 2 - analysis_jobs")
        .select("total_videos, available_videos")
        .eq("id", jobId)
        .maybeSingle();
      
      // Prefer available_videos over total_videos for accuracy
      const expectedTotal = jobData?.available_videos || jobData?.total_videos || 0;
      if (jobData?.available_videos && jobData.available_videos > 0) {
        setAvailableVideos(jobData.available_videos);
        setTotalVideos(jobData.available_videos);
      } else if (jobData?.total_videos && jobData.total_videos > 0) {
        setTotalVideos(jobData.total_videos);
      }

      if (!videosError && videosData) {
        // Find new items that need thumbnails
        const newVideoItems = videosData.filter(v => v.content_url && !thumbnails[v.content_url]);
        setVideos(videosData);
        // Fetch thumbnails for new items progressively
        if (newVideoItems.length > 0) {
          fetchThumbnailsForContent(newVideoItems);
        }
      }

      if (!carouselsError && carouselsData) {
        const newCarouselItems = carouselsData.filter(c => c.content_url && !thumbnails[c.content_url]);
        setPhotoCarousels(carouselsData);
        if (newCarouselItems.length > 0) {
          fetchThumbnailsForContent(newCarouselItems);
        }
      }

      // Check if all completed - must have all items AND all completed
      const totalLoaded = (videosData?.length || 0) + (carouselsData?.length || 0);
      const allVideosCompleted = videosData?.every(v => v.Status === "complete") ?? true;
      const allCarouselsCompleted = carouselsData?.every(c => c.Status === "complete") ?? true;
      
      // Only stop polling when we have all expected items AND they're all complete
      if (totalLoaded > 0 && expectedTotal > 0 && totalLoaded >= expectedTotal && allVideosCompleted && allCarouselsCompleted) {
        clearInterval(pollInterval);
      }
    }, 3000);

    // Subscribe to video changes
    const videoChannel = supabase
      .channel(`video_analysis_${jobId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "Analysis Profile 3 - video_analysis",
        filter: `job_id=eq.${jobId}`,
      }, (payload) => {
        if (payload.eventType === "INSERT") {
          const newVideo = payload.new as VideoAnalysis;
          setVideos((prev) => [...prev, newVideo]);
          // Fetch thumbnail for new video immediately
          fetchThumbnailForItem(newVideo);
        } else if (payload.eventType === "UPDATE") {
          const updatedVideo = payload.new as VideoAnalysis;
          setVideos((prev) => prev.map((v) => (v.id === updatedVideo.id ? updatedVideo : v)));
          // Fetch thumbnail if not already fetched
          fetchThumbnailForItem(updatedVideo);
        }
      })
      .subscribe();

    // Subscribe to photo carousel changes
    const carouselChannel = supabase
      .channel(`photo_carousel_analysis_${jobId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "Analysis Profile 4 - photo_carousel_analysis",
        filter: `job_id=eq.${jobId}`,
      }, (payload) => {
        if (payload.eventType === "INSERT") {
          const newCarousel = payload.new as PhotoCarouselAnalysis;
          setPhotoCarousels((prev) => [...prev, newCarousel]);
          fetchThumbnailForItem(newCarousel);
        } else if (payload.eventType === "UPDATE") {
          const updatedCarousel = payload.new as PhotoCarouselAnalysis;
          setPhotoCarousels((prev) => prev.map((c) => (c.id === updatedCarousel.id ? updatedCarousel : c)));
          fetchThumbnailForItem(updatedCarousel);
        }
      })
      .subscribe();

    // Subscribe to analysis job changes (to detect when available_videos is updated)
    const jobChannel = supabase
      .channel(`analysis_job_${jobId}`)
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "Analysis Profile 2 - analysis_jobs",
        filter: `id=eq.${jobId}`,
      }, (payload) => {
        const updatedJob = payload.new as { total_videos: number; available_videos: number; status: string };
        
        // Prefer available_videos - this is the actual count from the profile
        if (updatedJob.available_videos && updatedJob.available_videos > 0) {
          setAvailableVideos(updatedJob.available_videos);
          setTotalVideos(updatedJob.available_videos);
        } else if (updatedJob.total_videos && updatedJob.total_videos > 0) {
          setTotalVideos(updatedJob.total_videos);
        }
      })
      .subscribe();

    return () => {
      clearInterval(pollInterval);
      supabase.removeChannel(videoChannel);
      supabase.removeChannel(carouselChannel);
      supabase.removeChannel(jobChannel);
    };
  }, [jobId]);

  const formatNumber = (num: number | null | undefined) => {
    if (!num) return "0";
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const parseAnalysis = (analysisStr: string | null) => {
    if (!analysisStr) return null;
    try {
      return JSON.parse(analysisStr);
    } catch {
      return null;
    }
  };

  const completedVideos = videos.filter(v => v.Status === "complete");
  const completedCarousels = photoCarousels.filter(c => c.Status === "complete");
  const allCompletedContent: ContentItem[] = [...completedVideos, ...completedCarousels];
  
  const loadedCount = completedVideos.length + completedCarousels.length;
  const isAnalysisComplete = totalVideos > 0 && loadedCount >= totalVideos;
  const isStillLoading = loading || (totalVideos > 0 && loadedCount < totalVideos);

  // Set default slider value based on available data range
  useEffect(() => {
    if (allCompletedContent.length === 0) return;

    const contentDates = allCompletedContent
      .map(item => item.post_time_date ? new Date(item.post_time_date) : null)
      .filter((date): date is Date => date !== null)
      .sort((a, b) => a.getTime() - b.getTime());

    if (contentDates.length === 0) return;

    const oldestDate = contentDates[0];
    const newestDate = contentDates[contentDates.length - 1];
    const daysDifference = Math.ceil((newestDate.getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24));

    // Calculate appropriate slider value
    let defaultSliderValue = 22; // Default to 12 months

    if (daysDifference <= 7) {
      // Less than a week of data - default to smallest (1 day or actual range)
      defaultSliderValue = Math.min(daysDifference - 1, 0);
    } else if (daysDifference < 360) {
      // Less than 12 months - set to actual range
      if (daysDifference <= 28) {
        // Within 4 weeks
        defaultSliderValue = Math.ceil(daysDifference / 7) + 6; // 7-10 range
      } else {
        // Within 12 months
        const months = Math.ceil(daysDifference / 30);
        defaultSliderValue = Math.min(10 + months, 22);
      }
    }
    // If longer than 12 months, keep default at 22 (12 months)

    setTimePeriodSlider(defaultSliderValue);
    setVideoCountSlider(allCompletedContent.length);
  }, [allCompletedContent.length]);
  
  // Calculate aggregate metrics
  const totalViews = allCompletedContent.reduce((sum, item) => sum + (item.post_views || 0), 0);
  const totalLikes = allCompletedContent.reduce((sum, item) => sum + (item.post_likes || 0), 0);
  const totalShares = allCompletedContent.reduce((sum, item) => sum + (item.post_shares || 0), 0);
  const totalSaves = allCompletedContent.reduce((sum, item) => sum + (item.post_saves || 0), 0);
  const totalComments = allCompletedContent.reduce((sum, item) => sum + parseInt(item.post_comments || "0"), 0);
  const avgViralScore = allCompletedContent.length > 0 
    ? allCompletedContent.reduce((sum, item) => sum + (item.viral_score || 0), 0) / allCompletedContent.length 
    : 0;

  // Helper function to check if item is a photo carousel
  const isPhotoCarousel = (item: ContentItem): item is PhotoCarouselAnalysis => {
    return 'photo_carousel_analysis' in item;
  };

  // Performance distribution chart data
  const allPerformanceData = allCompletedContent
    .map(item => {
      const weightedEngagement = Math.round(((item.post_likes || 0) * 1 + parseInt(item.post_comments || "0") * 2 + (item.post_saves || 0) * 3 + (item.post_shares || 0) * 4) / (item.post_views || 1) * 100);
      const likesEngagement = Math.round((item.post_likes || 0) / (item.post_views || 1) * 100);
      
      return {
        name: isPhotoCarousel(item) ? `Carousel ${item.id}` : `Video ${item.id}`,
        date: item.post_time_date ? new Date(item.post_time_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A',
        dateObj: item.post_time_date ? new Date(item.post_time_date) : new Date(0),
        views: item.post_views || 0,
        likes: item.post_likes || 0,
        comments: parseInt(item.post_comments || "0"),
        shares: item.post_shares || 0,
        saves: item.post_saves || 0,
        engagement: engagementMode === "weighted" ? weightedEngagement : likesEngagement,
        videoId: item.id,
        video: item,
        isCarousel: isPhotoCarousel(item),
      };
    })
    .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

  // Map slider value to time period
  const getTimePeriodFromSlider = (value: number): { days: number; label: string } => {
    if (value <= 6) {
      // 1-7 days
      const days = value + 1;
      return { days, label: `${days} ${days === 1 ? 'Day' : 'Days'}` };
    } else if (value <= 10) {
      // 1-4 weeks
      const weeks = value - 6;
      const days = weeks * 7;
      return { days, label: `${weeks} ${weeks === 1 ? 'Week' : 'Weeks'}` };
    } else {
      // 1-12 months
      const months = value - 10;
      return { days: months * 30, label: `${months} ${months === 1 ? 'Month' : 'Months'}` };
    }
  };

  const currentPeriod = getTimePeriodFromSlider(timePeriodSlider);

  // Filter data based on slider mode
  let performanceData;
  if (sliderMode === "time") {
    // Filter by time period
    const now = new Date();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - currentPeriod.days);
    performanceData = allPerformanceData.filter(d => d.dateObj.getTime() >= cutoffDate.getTime());
  } else {
    // Filter by video count (take the most recent N videos)
    performanceData = allPerformanceData.slice(-videoCountSlider);
  }

  // Calculate average engagement for the period
  const avgEngagementForPeriod = performanceData.length > 0
    ? Math.round(performanceData.reduce((sum, d) => sum + d.engagement, 0) / performanceData.length)
    : 0;

  // Calculate totals for the period
  const totalViewsForPeriod = performanceData.reduce((sum, d) => sum + d.views, 0);
  const totalLikesForPeriod = performanceData.reduce((sum, d) => sum + d.likes, 0);
  const totalCommentsForPeriod = performanceData.reduce((sum, d) => sum + d.comments, 0);
  const totalSharesForPeriod = performanceData.reduce((sum, d) => sum + d.shares, 0);
  const totalSavesForPeriod = performanceData.reduce((sum, d) => sum + d.saves, 0);

  // Genre distribution from audio analysis
  const genreMap = new Map<string, number>();
  
  // Note: Audio analysis is in separate sound_analysis table, not on videos/carousels
  // Genre data would need to be fetched separately if needed
  
  const genreData = Array.from(genreMap.entries()).map(([name, value]) => ({ name, value }));

  // Content style distribution from visual/photo carousel analysis
  const styleMap = new Map<string, number>();
  const styleViewsMap = new Map<string, { count: number; totalViews: number; totalEngagement: number }>();
  
  allCompletedContent.forEach(item => {
    const weightedER = ((item.post_likes || 0) * 1 + parseInt(item.post_comments || "0") * 2 + (item.post_saves || 0) * 3 + (item.post_shares || 0) * 4) / (item.post_views || 1) * 100;
    
    let categories: string[] = [];
    
    if (isPhotoCarousel(item)) {
      // For photo carousels, add "Photo Carousel" as a category plus any specific categories
      categories.push("Photo Carousel");
      const carouselAnalysis = parseAnalysis(item.photo_carousel_analysis);
      if (carouselAnalysis?.main_categories) {
        categories = [...categories, ...carouselAnalysis.main_categories];
      }
    } else {
      // For videos, parse visual_analysis
      const visual = parseAnalysis(item.visual_analysis);
      if (visual?.main_categories) {
        categories = visual.main_categories;
      }
    }
    
    categories.forEach((cat: string) => {
      styleMap.set(cat, (styleMap.get(cat) || 0) + 1);
      const current = styleViewsMap.get(cat) || { count: 0, totalViews: 0, totalEngagement: 0 };
      styleViewsMap.set(cat, {
        count: current.count + 1,
        totalViews: current.totalViews + (item.post_views || 0),
        totalEngagement: current.totalEngagement + weightedER
      });
    });
  });
  const styleData = Array.from(styleMap.entries()).map(([name, value]) => ({ name, value }));
  
  // Calculate ranked content categories by performance or engagement rate
  const rankedCategories = Array.from(styleViewsMap.entries())
    .map(([category, data]) => ({
      category,
      avgViews: data.totalViews / data.count,
      avgEngagement: data.totalEngagement / data.count,
      count: data.count,
      totalViews: data.totalViews,
      totalEngagement: data.totalEngagement
    }))
    .sort((a, b) => {
      if (categorySortMode === "engagement") {
        return b.avgEngagement - a.avgEngagement;
      }
      return b.avgViews - a.avgViews;
     });
  
  const bestCategory = rankedCategories.length > 0 ? rankedCategories[0] : null;

  // Common timezones grouped by region
  const timezoneOptions = [
    { label: "🌍 Americas", value: "", disabled: true },
    { label: "Eastern Time (New York)", value: "America/New_York" },
    { label: "Central Time (Chicago)", value: "America/Chicago" },
    { label: "Mountain Time (Denver)", value: "America/Denver" },
    { label: "Pacific Time (Los Angeles)", value: "America/Los_Angeles" },
    { label: "Mexico City", value: "America/Mexico_City" },
    { label: "São Paulo", value: "America/Sao_Paulo" },
    { label: "Buenos Aires", value: "America/Argentina/Buenos_Aires" },
    { label: "🌍 Europe", value: "", disabled: true },
    { label: "London (GMT)", value: "Europe/London" },
    { label: "Paris/Berlin (CET)", value: "Europe/Paris" },
    { label: "Athens (EET)", value: "Europe/Athens" },
    { label: "Moscow", value: "Europe/Moscow" },
    { label: "🌏 Asia & Pacific", value: "", disabled: true },
    { label: "Dubai", value: "Asia/Dubai" },
    { label: "Mumbai", value: "Asia/Kolkata" },
    { label: "Bangkok", value: "Asia/Bangkok" },
    { label: "Singapore", value: "Asia/Singapore" },
    { label: "Hong Kong", value: "Asia/Hong_Kong" },
    { label: "Tokyo", value: "Asia/Tokyo" },
    { label: "Sydney", value: "Australia/Sydney" },
    { label: "🌍 Africa", value: "", disabled: true },
    { label: "Cairo", value: "Africa/Cairo" },
    { label: "Johannesburg", value: "Africa/Johannesburg" },
  ];

  // Get timezone abbreviation for display
  const getTimezoneAbbr = (timezone: string): string => {
    try {
      const date = new Date();
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        timeZoneName: 'short'
      });
      const parts = formatter.formatToParts(date);
      const tzPart = parts.find(part => part.type === 'timeZoneName');
      return tzPart ? tzPart.value : '';
    } catch {
      return '';
    }
  };

  // Calculate posting time performance data with timezone conversion
  const postingTimeData = allCompletedContent.reduce((acc, item) => {
    if (!item.post_time_date) return acc;
    
    // Parse the UTC date from Supabase
    const utcDate = new Date(item.post_time_date);
    
    // Convert to selected timezone
    const zonedDate = toZonedTime(utcDate, selectedTimezone);
    const hour = zonedDate.getHours();
    
    if (!acc[hour]) {
      acc[hour] = {
        hour,
        totalViews: 0,
        totalEngagement: 0,
        count: 0,
        videos: []
      };
    }
    
    const weightedER = ((item.post_likes || 0) * 1 + parseInt(item.post_comments || "0") * 2 + (item.post_saves || 0) * 3 + (item.post_shares || 0) * 4) / (item.post_views || 1) * 100;
    
    acc[hour].totalViews += item.post_views || 0;
    acc[hour].totalEngagement += weightedER;
    acc[hour].count += 1;
    acc[hour].videos.push(item);
    
    return acc;
  }, {} as Record<number, { hour: number; totalViews: number; totalEngagement: number; count: number; videos: any[] }>);

  const timezoneAbbr = getTimezoneAbbr(selectedTimezone);
  const postingTimeChartData = Object.values(postingTimeData)
    .map(data => ({
      hour: data.hour,
      timeLabel: `${data.hour === 0 ? 12 : data.hour > 12 ? data.hour - 12 : data.hour}${data.hour >= 12 ? 'PM' : 'AM'}`,
      avgViews: Math.round(data.totalViews / data.count),
      avgEngagement: parseFloat((data.totalEngagement / data.count).toFixed(1)),
      videoCount: data.count
    }))
    .sort((a, b) => a.hour - b.hour);

  // === Prepare data for Summary Card ===
  const summaryCardStats = useMemo(() => {
    const avgViews = allCompletedContent.length > 0 
      ? allCompletedContent.reduce((sum, v) => sum + (v.post_views || 0), 0) / allCompletedContent.length 
      : 0;
    const avgLikes = allCompletedContent.length > 0 
      ? allCompletedContent.reduce((sum, v) => sum + (v.post_likes || 0), 0) / allCompletedContent.length 
      : 0;
    const avgComments = allCompletedContent.length > 0 
      ? allCompletedContent.reduce((sum, v) => sum + parseInt(v.post_comments || "0"), 0) / allCompletedContent.length 
      : 0;
    const engagementRate = avgViews > 0 
      ? (avgLikes / avgViews) * 100 
      : 0;
    return { avgViews, avgLikes, avgComments, engagementRate };
  }, [allCompletedContent]);

  // Best performing content styles for summary card
  const summaryContentStyles = useMemo(() => {
    if (rankedCategories.length === 0) return [];
    const maxViews = rankedCategories[0]?.avgViews || 1;
    return rankedCategories.slice(0, 5).map((cat, idx) => ({
      label: cat.category,
      value: Math.round((cat.avgViews / maxViews) * 100),
      views: formatNumber(cat.avgViews),
      isTop: idx === 0
    }));
  }, [rankedCategories]);

  // Best posting times for summary card
  const summaryPostingTimes = useMemo(() => {
    if (postingTimeChartData.length === 0) return [];
    const sortedByViews = [...postingTimeChartData].sort((a, b) => b.avgViews - a.avgViews);
    const maxScore = sortedByViews[0]?.avgViews || 1;
    
    // Get day of week for each time
    const getDayForHour = (hour: number) => {
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      // Find a video posted at this hour to get its day
      const videoAtHour = allCompletedContent.find(v => {
        if (!v.post_time_date) return false;
        const zonedDate = toZonedTime(new Date(v.post_time_date), selectedTimezone);
        return zonedDate.getHours() === hour;
      });
      if (videoAtHour?.post_time_date) {
        const zonedDate = toZonedTime(new Date(videoAtHour.post_time_date), selectedTimezone);
        return days[zonedDate.getDay()];
      }
      return "";
    };
    
    return sortedByViews.slice(0, 4).map(slot => ({
      day: getDayForHour(slot.hour),
      time: slot.timeLabel,
      score: Math.round((slot.avgViews / maxScore) * 100)
    }));
  }, [postingTimeChartData, allCompletedContent, selectedTimezone]);

  // Hidden gems (top performing outliers) for summary card
  const summaryHiddenGems = useMemo(() => {
    const sorted = [...allCompletedContent].sort((a, b) => (b.post_views || 0) - (a.post_views || 0));
    const avgViews = summaryCardStats.avgViews || 1;
    return sorted.slice(0, 3).map((item, idx) => ({
      views: formatNumber(item.post_views || 0),
      label: idx === 0 ? "Top outlier" : idx === 1 ? "2nd best" : "3rd best",
      multiplier: `${((item.post_views || 0) / avgViews).toFixed(1)}x`
    }));
  }, [allCompletedContent, summaryCardStats.avgViews]);

  // AI Recommendations for summary card
  const summaryRecommendations = useMemo(() => {
    const recommendations: string[] = [];
    
    // Best content style recommendation
    if (rankedCategories.length > 0) {
      const best = rankedCategories[0];
      const second = rankedCategories[1];
      if (best && second && best.avgViews > second.avgViews * 1.2) {
        const multiplier = (best.avgViews / second.avgViews).toFixed(1);
        recommendations.push(`Double down on "${best.category}" — it outperforms by ${multiplier}x`);
      } else if (best) {
        recommendations.push(`"${best.category}" content gets the highest engagement`);
      }
    }
    
    // Best posting time recommendation
    if (summaryPostingTimes.length > 0) {
      const bestTime = summaryPostingTimes[0];
      recommendations.push(`Post on ${bestTime.day} at ${bestTime.time} for maximum reach`);
    }
    
    // General insight
    if (allCompletedContent.length > 5) {
      const hasHighVariance = summaryHiddenGems.length > 0 && 
        parseFloat(summaryHiddenGems[0].multiplier) > 3;
      if (hasHighVariance) {
        recommendations.push("You have breakout potential — some content significantly outperforms your average");
      } else {
        recommendations.push("Your content performs consistently — focus on increasing post frequency");
      }
    }
    
    return recommendations;
  }, [rankedCategories, summaryPostingTimes, summaryHiddenGems, allCompletedContent.length]);

  const handleSaveAnalysis = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to save this analysis.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('saved_profile_analyses')
        .insert({
          user_id: user.id,
          job_id: jobId,
          handle: profile?.handle || null,
        });

      if (error) throw error;

      setIsSaved(true);
      toast({
        title: "Analysis saved",
        description: "This profile analysis has been saved to your account.",
      });
    } catch (error) {
      console.error("Error saving analysis:", error);
      toast({
        title: "Error",
        description: "Failed to save analysis. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!jobId) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No job ID provided</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto p-3 md:p-6 space-y-4 md:space-y-6">
        {/* Progress Indicator - shown while still loading */}
        {isStillLoading && (
          <div className="glass-card border-primary/20 backdrop-blur-xl bg-card/40 rounded-xl p-4">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">
                    Analyzing videos... {loadedCount}/{totalVideos || '?'}
                  </p>
                  {totalVideos > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {Math.round((loadedCount / totalVideos) * 100)}%
                    </span>
                  )}
                </div>
                <Progress 
                  value={totalVideos > 0 ? (loadedCount / totalVideos) * 100 : 0} 
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Results update automatically as videos are processed. You can explore the data below.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Profile Analysis Summary Card - Landing Page Style */}
        {allCompletedContent.length > 0 && (
          <ProfileAnalysisSummaryCard
            profile={profile}
            videosAnalyzed={loadedCount}
            isComplete={isAnalysisComplete}
            stats={summaryCardStats}
            contentStyles={summaryContentStyles}
            postingTimes={summaryPostingTimes}
            hiddenGems={summaryHiddenGems}
            recommendations={summaryRecommendations}
          />
        )}

        {/* Detailed Analysis Section Header */}
        <div className="flex items-center justify-between pt-4">
          <div>
            <h2 className="text-xl md:text-2xl font-semibold text-foreground">
              Detailed Analytics
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Dive deeper into your content performance
            </p>
          </div>
          
          {/* Share & Save buttons */}
          <div className="flex items-center gap-2">
            <Button
              onClick={() => {
                const shareText = `📊 Check out my TikTok analysis on Wavebound!\n\n@${profile?.handle || 'profile'}\n🔥 ${avgViralScore.toFixed(1)} avg viral score\n👀 ${formatNumber(allCompletedContent.reduce((sum, v) => sum + (v.post_views || 0), 0))} total views\n📈 ${allCompletedContent.length} videos analyzed\n\nAnalyze your own profile: ${window.location.origin}/analyze-profile`;
                navigator.clipboard.writeText(shareText);
                toast({ title: 'Analysis stats copied!', description: 'Share your results with Wavebound attribution' });
              }}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden md:inline">Share</span>
            </Button>
            {!isSaved && (
              <Button
                onClick={handleSaveAnalysis}
                disabled={isSaving}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Bookmark className="w-4 h-4" />
                <span className="hidden md:inline">{isSaving ? "Saving..." : "Save"}</span>
              </Button>
            )}
          </div>
        </div>

        {/* Main Analytics Tabs */}
        <Tabs defaultValue="overview" className="space-y-4 md:space-y-6">
          <TabsList className="glass-card backdrop-blur-xl bg-card/40 p-1 w-full flex-wrap h-auto gap-1">
            <TabsTrigger value="overview" className="data-[state=active]:bg-primary/20 text-xs md:text-sm flex-1">
              <BarChart3 className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
              <span className="hidden md:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="performance" className="data-[state=active]:bg-primary/20 text-xs md:text-sm flex-1">
              <TrendingUp className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
              <span className="hidden md:inline">Performance</span>
            </TabsTrigger>
            <TabsTrigger value="content" className="data-[state=active]:bg-primary/20 text-xs md:text-sm flex-1">
              <Palette className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
              <span className="hidden md:inline">Content</span>
            </TabsTrigger>
            <TabsTrigger value="sound" className="data-[state=active]:bg-primary/20 text-xs md:text-sm flex-1">
              <Music className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
              <span className="hidden md:inline">Sound</span>
            </TabsTrigger>
            <TabsTrigger value="videos" className="data-[state=active]:bg-primary/20 text-xs md:text-sm flex-1">
              <Video className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
              <span className="hidden md:inline">Content ({allCompletedContent.length})</span>
              <span className="md:hidden">({allCompletedContent.length})</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 md:space-y-6">
            {/* Performance Overview */}
            <Card className="glass-card border-primary/20 backdrop-blur-xl bg-card/40">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Performance Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Views Card */}
                  <div className="p-5 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 transition-all">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-blue-500/20">
                        <Play className="w-5 h-5 text-blue-400" />
                      </div>
                      <span className="text-sm font-semibold text-blue-400 uppercase tracking-wider">Views</span>
                    </div>
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between py-2 px-3 rounded bg-background/30">
                        <span className="text-xs text-muted-foreground">Total</span>
                        <span className="text-base font-bold">{formatNumber(totalViews)}</span>
                      </div>
                      {profile?.stats?.avg_views && (
                        <div className="flex items-center justify-between py-2 px-3 rounded bg-background/30">
                          <span className="text-xs text-muted-foreground">Average</span>
                          <span className="text-base font-bold">{formatNumber(profile.stats.avg_views)}</span>
                        </div>
                      )}
                      {profile?.stats?.median_views && (
                        <div className="flex items-center justify-between py-2 px-3 rounded bg-background/30">
                          <span className="text-xs text-muted-foreground">Median</span>
                          <span className="text-base font-bold">{formatNumber(profile.stats.median_views)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Likes Card */}
                  <div className="p-5 rounded-lg bg-gradient-to-br from-red-500/10 to-red-500/5 border border-red-500/20 transition-all">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-red-500/20">
                        <Heart className="w-5 h-5 text-red-400" />
                      </div>
                      <span className="text-sm font-semibold text-red-400 uppercase tracking-wider">Likes</span>
                    </div>
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between py-2 px-3 rounded bg-background/30">
                        <span className="text-xs text-muted-foreground">Total</span>
                        <span className="text-base font-bold">{formatNumber(totalLikes)}</span>
                      </div>
                      {profile?.stats?.avg_likes && (
                        <div className="flex items-center justify-between py-2 px-3 rounded bg-background/30">
                          <span className="text-xs text-muted-foreground">Average</span>
                          <span className="text-base font-bold">{formatNumber(profile.stats.avg_likes)}</span>
                        </div>
                      )}
                      {profile?.stats?.median_likes && (
                        <div className="flex items-center justify-between py-2 px-3 rounded bg-background/30">
                          <span className="text-xs text-muted-foreground">Median</span>
                          <span className="text-base font-bold">{formatNumber(profile.stats.median_likes)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Saves Card */}
                  <div className="p-5 rounded-lg bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border border-yellow-500/20 transition-all">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-yellow-500/20">
                        <Bookmark className="w-5 h-5 text-yellow-400" />
                      </div>
                      <span className="text-sm font-semibold text-yellow-400 uppercase tracking-wider">Saves</span>
                    </div>
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between py-2 px-3 rounded bg-background/30">
                        <span className="text-xs text-muted-foreground">Total</span>
                        <span className="text-base font-bold">{formatNumber(totalSaves)}</span>
                      </div>
                      {profile?.stats?.avg_saves && (
                        <div className="flex items-center justify-between py-2 px-3 rounded bg-background/30">
                          <span className="text-xs text-muted-foreground">Average</span>
                          <span className="text-base font-bold">{formatNumber(profile.stats.avg_saves)}</span>
                        </div>
                      )}
                      {profile?.stats?.median_saves && (
                        <div className="flex items-center justify-between py-2 px-3 rounded bg-background/30">
                          <span className="text-xs text-muted-foreground">Median</span>
                          <span className="text-base font-bold">{formatNumber(profile.stats.median_saves)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Shares Card */}
                  <div className="p-5 rounded-lg bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 transition-all">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-green-500/20">
                        <Share2 className="w-5 h-5 text-green-400" />
                      </div>
                      <span className="text-sm font-semibold text-green-400 uppercase tracking-wider">Shares</span>
                    </div>
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between py-2 px-3 rounded bg-background/30">
                        <span className="text-xs text-muted-foreground">Total</span>
                        <span className="text-base font-bold">{formatNumber(totalShares)}</span>
                      </div>
                      {profile?.stats?.avg_shares && (
                        <div className="flex items-center justify-between py-2 px-3 rounded bg-background/30">
                          <span className="text-xs text-muted-foreground">Average</span>
                          <span className="text-base font-bold">{formatNumber(profile.stats.avg_shares)}</span>
                        </div>
                      )}
                      {profile?.stats?.median_shares && (
                        <div className="flex items-center justify-between py-2 px-3 rounded bg-background/30">
                          <span className="text-xs text-muted-foreground">Median</span>
                          <span className="text-base font-bold">{formatNumber(profile.stats.median_shares)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Comments Card */}
                  <div className="p-5 rounded-lg bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 transition-all">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-purple-500/20">
                        <MessageCircle className="w-5 h-5 text-purple-400" />
                      </div>
                      <span className="text-sm font-semibold text-purple-400 uppercase tracking-wider">Comments</span>
                    </div>
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between py-2 px-3 rounded bg-background/30">
                        <span className="text-xs text-muted-foreground">Total</span>
                        <span className="text-base font-bold">{formatNumber(totalComments)}</span>
                      </div>
                      {profile?.stats?.avg_comments && (
                        <div className="flex items-center justify-between py-2 px-3 rounded bg-background/30">
                          <span className="text-xs text-muted-foreground">Average</span>
                          <span className="text-base font-bold">{formatNumber(profile.stats.avg_comments)}</span>
                        </div>
                      )}
                      {profile?.stats?.median_comments && (
                        <div className="flex items-center justify-between py-2 px-3 rounded bg-background/30">
                          <span className="text-xs text-muted-foreground">Median</span>
                          <span className="text-base font-bold">{formatNumber(profile.stats.median_comments)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Engagement Card */}
                  <div className="p-5 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 transition-all">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-primary/20">
                        <TrendingUp className="w-5 h-5 text-primary" />
                      </div>
                      <span className="text-sm font-semibold text-primary uppercase tracking-wider">Engagement</span>
                    </div>
                    <div className="space-y-2.5">
                      {profile?.stats?.avg_engagement && (
                        <div className="flex items-center justify-between py-2 px-3 rounded bg-background/30">
                          <span className="text-xs text-muted-foreground">Average</span>
                          <span className="text-base font-bold">{profile.stats.avg_engagement}%</span>
                        </div>
                      )}
                      {profile?.stats?.median_engagement && (
                        <div className="flex items-center justify-between py-2 px-3 rounded bg-background/30">
                          <span className="text-xs text-muted-foreground">Median</span>
                          <span className="text-base font-bold">{profile.stats.median_engagement}%</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Viral Score Card */}
                  <div className="p-5 rounded-lg bg-gradient-to-br from-pink-500/10 to-pink-500/5 border border-pink-500/20 transition-all md:col-span-2 lg:col-span-3">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-pink-500/20">
                        <Sparkles className="w-5 h-5 text-pink-400" />
                      </div>
                      <span className="text-sm font-semibold text-pink-400 uppercase tracking-wider">Viral Score</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="py-2 px-4 rounded bg-background/30">
                          <span className="text-xs text-muted-foreground block mb-1">Average</span>
                          <span className="text-2xl font-bold">{avgViralScore.toFixed(1)}</span>
                        </div>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        Based on {completedVideos.length} video{completedVideos.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top 3 Performing Content Categories */}
            {rankedCategories.length > 0 && (
              <Card className="glass-card border-primary/20 backdrop-blur-xl bg-card/40">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    Top Performing Content Categories
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {rankedCategories.slice(0, 3).map((cat, index) => (
                      <div
                        key={cat.category}
                        className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 hover:border-primary/40 transition-all"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Badge className={`${
                            index === 0 ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                            index === 1 ? 'bg-gray-400/20 text-gray-300 border-gray-400/30' :
                            'bg-orange-500/20 text-orange-400 border-orange-500/30'
                          }`}>
                            #{index + 1}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{cat.count} videos</span>
                        </div>
                        <h3 className="font-semibold text-sm mb-3 text-foreground">{cat.category}</h3>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Avg Views</span>
                            <span className="text-sm font-bold text-foreground">{formatNumber(cat.avgViews)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Avg ER</span>
                            <span className="text-sm font-bold text-primary">{cat.avgEngagement.toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-4 md:space-y-6">
            {/* Engagement Metrics by Video - Views, Likes, etc. */}
            <Card className="glass-card border-primary/20 backdrop-blur-xl bg-card/40">
              <CardHeader>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base md:text-lg">Engagement Metrics by Video</CardTitle>
                  </div>
                  
                  {/* Slider Mode Toggle */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground mr-2">Filter by:</span>
                    <button
                      onClick={() => setSliderMode("time")}
                      className={`px-3 py-1.5 text-xs rounded-md transition-all ${
                        sliderMode === "time"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      Time Period
                    </button>
                    <button
                      onClick={() => setSliderMode("videos")}
                      className={`px-3 py-1.5 text-xs rounded-md transition-all ${
                        sliderMode === "videos"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      Video Count
                    </button>
                  </div>

                  {/* Metric Toggles */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-muted-foreground mr-2">Show:</span>
                    <button
                      onClick={() => toggleMetric("views")}
                      className={`px-3 py-1.5 text-xs rounded-md transition-all flex items-center gap-1.5 ${
                        visibleMetrics.views
                          ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                          : "bg-muted/50 text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      Views
                      <span className="ml-1 font-semibold">({formatNumber(totalViewsForPeriod)})</span>
                    </button>
                    <button
                      onClick={() => toggleMetric("likes")}
                      className={`px-3 py-1.5 text-xs rounded-md transition-all flex items-center gap-1.5 ${
                        visibleMetrics.likes
                          ? "bg-red-500/20 text-red-400 border border-red-500/30"
                          : "bg-muted/50 text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      Likes
                      <span className="ml-1 font-semibold">({formatNumber(totalLikesForPeriod)})</span>
                    </button>
                    <button
                      onClick={() => toggleMetric("comments")}
                      className={`px-3 py-1.5 text-xs rounded-md transition-all flex items-center gap-1.5 ${
                        visibleMetrics.comments
                          ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                          : "bg-muted/50 text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      <div className="w-2 h-2 rounded-full bg-purple-500" />
                      Comments
                      <span className="ml-1 font-semibold">({formatNumber(totalCommentsForPeriod)})</span>
                    </button>
                    <button
                      onClick={() => toggleMetric("shares")}
                      className={`px-3 py-1.5 text-xs rounded-md transition-all flex items-center gap-1.5 ${
                        visibleMetrics.shares
                          ? "bg-green-500/20 text-green-400 border border-green-500/30"
                          : "bg-muted/50 text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      Shares
                      <span className="ml-1 font-semibold">({formatNumber(totalSharesForPeriod)})</span>
                    </button>
                    <button
                      onClick={() => toggleMetric("saves")}
                      className={`px-3 py-1.5 text-xs rounded-md transition-all flex items-center gap-1.5 ${
                        visibleMetrics.saves
                          ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                          : "bg-muted/50 text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      <div className="w-2 h-2 rounded-full bg-orange-500" />
                      Saves
                      <span className="ml-1 font-semibold">({formatNumber(totalSavesForPeriod)})</span>
                    </button>
                  </div>
                  
                  {/* Time Period / Video Count Slider */}
                  {sliderMode === "time" ? (
                    <div className="flex flex-col gap-3 min-w-[300px]">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Time Period:</span>
                        <span className="text-sm font-semibold text-primary">{currentPeriod.label}</span>
                      </div>
                      <Slider
                        value={[timePeriodSlider]}
                        onValueChange={(value) => setTimePeriodSlider(value[0])}
                        min={0}
                        max={22}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>1 Day</span>
                        <span>7 Days</span>
                        <span>4 Weeks</span>
                        <span>12 Months</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3 min-w-[300px]">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Number of Videos:</span>
                        <span className="text-sm font-semibold text-primary">{videoCountSlider} {videoCountSlider === 1 ? 'Video' : 'Videos'}</span>
                      </div>
                      <Slider
                        value={[videoCountSlider]}
                        onValueChange={(value) => setVideoCountSlider(value[0])}
                        min={1}
                        max={allCompletedContent.length}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>1 Video</span>
                        <span>{allCompletedContent.length} Videos</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      cursor={false}
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }} 
                    />
                    <Legend />
                    {visibleMetrics.views && (
                      <Line 
                        type="monotone" 
                        dataKey="views" 
                        stroke="#3b82f6" 
                        strokeWidth={2} 
                        name="Views" 
                        dot={(props: any) => {
                          const { cx, cy, payload } = props;
                          return (
                            <circle
                              cx={cx}
                              cy={cy}
                              r={3}
                              fill="#3b82f6"
                              style={{ cursor: 'pointer' }}
                              onClick={() => {
                                if (payload && payload.video) {
                                  setSelectedVideoForPreview(payload.video);
                                  setIsVideoPreviewOpen(true);
                                }
                              }}
                            />
                          );
                        }}
                        activeDot={(props: any) => {
                          const { cx, cy, payload } = props;
                          return (
                            <circle
                              cx={cx}
                              cy={cy}
                              r={5}
                              fill="#3b82f6"
                              style={{ cursor: 'pointer' }}
                              onClick={() => {
                                if (payload && payload.video) {
                                  setSelectedVideoForPreview(payload.video);
                                  setIsVideoPreviewOpen(true);
                                }
                              }}
                            />
                          );
                        }}
                      />
                    )}
                    {visibleMetrics.likes && (
                      <Line 
                        type="monotone" 
                        dataKey="likes" 
                        stroke="#ef4444" 
                        strokeWidth={2} 
                        name="Likes" 
                        dot={(props: any) => {
                          const { cx, cy, payload } = props;
                          return (
                            <circle
                              cx={cx}
                              cy={cy}
                              r={3}
                              fill="#ef4444"
                              style={{ cursor: 'pointer' }}
                              onClick={() => {
                                if (payload && payload.video) {
                                  setSelectedVideoForPreview(payload.video);
                                  setIsVideoPreviewOpen(true);
                                }
                              }}
                            />
                          );
                        }}
                        activeDot={(props: any) => {
                          const { cx, cy, payload } = props;
                          return (
                            <circle
                              cx={cx}
                              cy={cy}
                              r={5}
                              fill="#ef4444"
                              style={{ cursor: 'pointer' }}
                              onClick={() => {
                                if (payload && payload.video) {
                                  setSelectedVideoForPreview(payload.video);
                                  setIsVideoPreviewOpen(true);
                                }
                              }}
                            />
                          );
                        }}
                      />
                    )}
                    {visibleMetrics.comments && (
                      <Line 
                        type="monotone" 
                        dataKey="comments" 
                        stroke="#8b5cf6" 
                        strokeWidth={2} 
                        name="Comments" 
                        dot={(props: any) => {
                          const { cx, cy, payload } = props;
                          return (
                            <circle
                              cx={cx}
                              cy={cy}
                              r={3}
                              fill="#8b5cf6"
                              style={{ cursor: 'pointer' }}
                              onClick={() => {
                                if (payload && payload.video) {
                                  setSelectedVideoForPreview(payload.video);
                                  setIsVideoPreviewOpen(true);
                                }
                              }}
                            />
                          );
                        }}
                        activeDot={(props: any) => {
                          const { cx, cy, payload } = props;
                          return (
                            <circle
                              cx={cx}
                              cy={cy}
                              r={5}
                              fill="#8b5cf6"
                              style={{ cursor: 'pointer' }}
                              onClick={() => {
                                if (payload && payload.video) {
                                  setSelectedVideoForPreview(payload.video);
                                  setIsVideoPreviewOpen(true);
                                }
                              }}
                            />
                          );
                        }}
                      />
                    )}
                    {visibleMetrics.shares && (
                      <Line 
                        type="monotone" 
                        dataKey="shares" 
                        stroke="#10b981" 
                        strokeWidth={2} 
                        name="Shares" 
                        dot={(props: any) => {
                          const { cx, cy, payload } = props;
                          return (
                            <circle
                              cx={cx}
                              cy={cy}
                              r={3}
                              fill="#10b981"
                              style={{ cursor: 'pointer' }}
                              onClick={() => {
                                if (payload && payload.video) {
                                  setSelectedVideoForPreview(payload.video);
                                  setIsVideoPreviewOpen(true);
                                }
                              }}
                            />
                          );
                        }}
                        activeDot={(props: any) => {
                          const { cx, cy, payload } = props;
                          return (
                            <circle
                              cx={cx}
                              cy={cy}
                              r={5}
                              fill="#10b981"
                              style={{ cursor: 'pointer' }}
                              onClick={() => {
                                if (payload && payload.video) {
                                  setSelectedVideoForPreview(payload.video);
                                  setIsVideoPreviewOpen(true);
                                }
                              }}
                            />
                          );
                        }}
                      />
                    )}
                    {visibleMetrics.saves && (
                      <Line 
                        type="monotone" 
                        dataKey="saves" 
                        stroke="#f59e0b" 
                        strokeWidth={2} 
                        name="Saves" 
                        dot={(props: any) => {
                          const { cx, cy, payload } = props;
                          return (
                            <circle
                              cx={cx}
                              cy={cy}
                              r={3}
                              fill="#f59e0b"
                              style={{ cursor: 'pointer' }}
                              onClick={() => {
                                if (payload && payload.video) {
                                  setSelectedVideoForPreview(payload.video);
                                  setIsVideoPreviewOpen(true);
                                }
                              }}
                            />
                          );
                        }}
                        activeDot={(props: any) => {
                          const { cx, cy, payload } = props;
                          return (
                            <circle
                              cx={cx}
                              cy={cy}
                              r={5}
                              fill="#f59e0b"
                              style={{ cursor: 'pointer' }}
                              onClick={() => {
                                if (payload && payload.video) {
                                  setSelectedVideoForPreview(payload.video);
                                  setIsVideoPreviewOpen(true);
                                }
                              }}
                            />
                          );
                        }}
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Engagement Rate by Video */}
            <Card className="glass-card border-primary/20 backdrop-blur-xl bg-card/40">
              <CardHeader>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <CardTitle className="text-base md:text-lg">Engagement Rate by Video</CardTitle>
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-lg border border-primary/20">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        <span className="text-sm font-bold text-foreground">{avgEngagementForPeriod}%</span>
                        <span className="text-xs text-muted-foreground">avg</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEngagementMode("weighted")}
                        className={`px-3 py-1.5 text-xs rounded-md transition-all ${
                          engagementMode === "weighted"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        Weighted
                      </button>
                      <button
                        onClick={() => setEngagementMode("likes")}
                        className={`px-3 py-1.5 text-xs rounded-md transition-all ${
                          engagementMode === "likes"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        Likes Only
                      </button>
                    </div>
                  </div>
                  
                  {/* Slider Mode Toggle */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground mr-2">Filter by:</span>
                    <button
                      onClick={() => setSliderMode("time")}
                      className={`px-3 py-1.5 text-xs rounded-md transition-all ${
                        sliderMode === "time"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      Time Period
                    </button>
                    <button
                      onClick={() => setSliderMode("videos")}
                      className={`px-3 py-1.5 text-xs rounded-md transition-all ${
                        sliderMode === "videos"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      Video Count
                    </button>
                  </div>
                  
                  {/* Time Period / Video Count Slider */}
                  {sliderMode === "time" ? (
                    <div className="flex flex-col gap-3 min-w-[300px]">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Time Period:</span>
                        <span className="text-sm font-semibold text-primary">{currentPeriod.label}</span>
                      </div>
                      <Slider
                        value={[timePeriodSlider]}
                        onValueChange={(value) => setTimePeriodSlider(value[0])}
                        min={0}
                        max={22}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>1 Day</span>
                        <span>7 Days</span>
                        <span>4 Weeks</span>
                        <span>12 Months</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3 min-w-[300px]">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Number of Videos:</span>
                        <span className="text-sm font-semibold text-primary">{videoCountSlider} {videoCountSlider === 1 ? 'Video' : 'Videos'}</span>
                      </div>
                      <Slider
                        value={[videoCountSlider]}
                        onValueChange={(value) => setVideoCountSlider(value[0])}
                        min={1}
                        max={completedVideos.length}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>1 Video</span>
                        <span>{completedVideos.length} Videos</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      cursor={false}
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }} 
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="engagement" 
                      stroke="#8b5cf6" 
                      strokeWidth={3} 
                      name="Engagement %" 
                      dot={(props: any) => {
                        const { cx, cy, payload } = props;
                        return (
                          <circle
                            cx={cx}
                            cy={cy}
                            r={4}
                            fill="#8b5cf6"
                            style={{ cursor: 'pointer' }}
                            onClick={() => {
                              if (payload && payload.video) {
                                setSelectedVideoForPreview(payload.video);
                                setIsVideoPreviewOpen(true);
                              }
                            }}
                          />
                        );
                      }}
                      activeDot={(props: any) => {
                        const { cx, cy, payload } = props;
                        return (
                          <circle
                            cx={cx}
                            cy={cy}
                            r={6}
                            fill="#8b5cf6"
                            style={{ cursor: 'pointer' }}
                            onClick={() => {
                              if (payload && payload.video) {
                                setSelectedVideoForPreview(payload.video);
                                setIsVideoPreviewOpen(true);
                              }
                            }}
                          />
                        );
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

          </TabsContent>

          {/* Content Analysis Tab */}
          <TabsContent value="content" className="space-y-4 md:space-y-6">
            {/* Ranked Content Categories */}
            {rankedCategories.length > 0 && (
              <Card className="glass-card border-primary/20 backdrop-blur-xl bg-gradient-to-br from-purple-500/10 to-pink-600/10">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center gap-2 text-base md:text-lg">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                        Content Category Performance
                      </div>
                      <ChartTooltipProvider>
                        <ChartTooltip>
                          <ChartTooltipTrigger asChild>
                            <button className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors">
                              <HelpCircle className="w-3.5 h-3.5 text-primary" />
                            </button>
                          </ChartTooltipTrigger>
                          <ChartTooltipContent className="max-w-sm bg-gradient-to-br from-card to-card/80 backdrop-blur-xl border-primary/20 shadow-xl p-4">
                            <div className="space-y-3">
                              <div className="flex items-start gap-2">
                                <TrendingUp className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="text-sm font-semibold text-foreground mb-1">How It's Calculated</p>
                                  <p className="text-sm text-muted-foreground">
                                    {categorySortMode === "performance" ? (
                                      <>Average Views = <span className="text-primary font-medium">Total Views</span> ÷ <span className="text-primary font-medium">Number of Videos</span></>
                                    ) : (
                                      <>Average ER = <span className="text-primary font-medium">Total Engagement Rate</span> ÷ <span className="text-primary font-medium">Number of Videos</span></>
                                    )}
                                  </p>
                                </div>
                              </div>
                              <div className="pt-2 border-t border-border/50">
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                  {categorySortMode === "performance" 
                                    ? "This ranking helps you identify which content styles generate the most views per video on average, allowing you to focus on your highest-performing content strategies."
                                    : "This ranking helps you identify which content styles generate the highest engagement rate per video on average, showing which categories resonate most with your audience."
                                  }
                                </p>
                              </div>
                            </div>
                          </ChartTooltipContent>
                        </ChartTooltip>
                      </ChartTooltipProvider>
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCategorySortMode("performance")}
                        className={`px-3 py-1.5 text-xs rounded-md transition-all ${
                          categorySortMode === "performance"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        Performance
                      </button>
                      <button
                        onClick={() => setCategorySortMode("engagement")}
                        className={`px-3 py-1.5 text-xs rounded-md transition-all ${
                          categorySortMode === "engagement"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        Engagement
                      </button>
                    </div>
                  </div>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    Ranked by {categorySortMode === "performance" ? "average views" : "average engagement rate"} per video
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 md:space-y-3">
                    {rankedCategories.map((cat, index) => (
                      <div 
                        key={cat.category}
                        onClick={() => setSelectedCategory(cat.category)}
                        className="flex items-center justify-between p-3 md:p-4 rounded-lg bg-background/30 border border-border/50 hover:border-primary/30 transition-all gap-2 cursor-pointer hover:bg-background/50"
                      >
                        <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
                          <div className={`
                            w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center font-bold text-xs md:text-sm flex-shrink-0
                            ${index === 0 ? 'bg-yellow-500/20 text-yellow-400 border-2 border-yellow-500/50' : 
                              index === 1 ? 'bg-gray-400/20 text-gray-400 border-2 border-gray-400/50' :
                              index === 2 ? 'bg-orange-600/20 text-orange-400 border-2 border-orange-600/50' :
                              'bg-muted text-muted-foreground'}
                          `}>
                            #{index + 1}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-foreground text-sm md:text-base truncate">{cat.category}</p>
                            <p className="text-[10px] md:text-xs text-muted-foreground">
                              {cat.count} video{cat.count !== 1 ? 's' : ''} • {formatNumber(cat.totalViews)} total
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          {categorySortMode === "performance" ? (
                            <>
                              <p className="text-base md:text-xl font-bold text-foreground">{formatNumber(Math.round(cat.avgViews))}</p>
                              <p className="text-[10px] md:text-xs text-muted-foreground">avg views</p>
                            </>
                          ) : (
                            <>
                              <p className="text-base md:text-xl font-bold text-foreground">{cat.avgEngagement.toFixed(1)}%</p>
                              <p className="text-[10px] md:text-xs text-muted-foreground">avg ER</p>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Best Posting Times Chart */}
            <Card className="glass-card border-primary/20 backdrop-blur-xl bg-card/40">
              <CardHeader>
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base md:text-lg mb-1">
                      <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                      Best Posting Times
                    </CardTitle>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      Average performance by hour in your timezone {timezoneAbbr && `(${timezoneAbbr})`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-muted-foreground">Timezone:</label>
                    <Select value={selectedTimezone} onValueChange={setSelectedTimezone}>
                      <SelectTrigger className="w-[200px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {timezoneOptions
                          .filter(tz => !tz.disabled)
                          .map((tz) => (
                            <SelectItem 
                              key={tz.value} 
                              value={tz.value}
                            >
                              {tz.label}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={postingTimeChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis 
                      dataKey="timeLabel" 
                      stroke="hsl(var(--muted-foreground))"
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                      tickFormatter={(value) => formatNumber(value)}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }}
                      formatter={(value: number, name: string) => {
                        if (name === 'avgViews') return [formatNumber(value), 'Avg Views'];
                        if (name === 'avgEngagement') return [`${value}%`, 'Avg ER'];
                        return [value, name];
                      }}
                      labelFormatter={(label) => `Posted at ${label}`}
                    />
                    <Legend 
                      wrapperStyle={{ paddingTop: '20px' }}
                      formatter={(value) => {
                        if (value === 'avgViews') return 'Average Views';
                        if (value === 'avgEngagement') return 'Engagement Rate (%)';
                        return value;
                      }}
                    />
                    <Bar dataKey="avgViews" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="avgEngagement" fill="#ec4899" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              <Card className="glass-card border-primary/20 backdrop-blur-xl bg-card/40">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                    <Music className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                    Genre Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={genreData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => entry.name}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {genreData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "hsl(var(--card))", 
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px"
                        }} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="glass-card border-primary/20 backdrop-blur-xl bg-gradient-to-br from-purple-500/5 via-card/40 to-pink-500/5 overflow-hidden relative">
                {/* Decorative glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
                
                <CardHeader className="pb-0 relative z-10">
                  <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/20">
                      <Palette className="w-4 h-4 md:w-5 md:h-5 text-purple-400" />
                    </div>
                    Content Style Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-2 relative z-10">
                  <div className="flex flex-col lg:flex-row items-center gap-4">
                    {/* Chart */}
                    <div className="relative flex-shrink-0">
                      <ResponsiveContainer width={200} height={200}>
                        <PieChart>
                          <defs>
                            {COLORS.map((color, index) => (
                              <linearGradient key={`gradient-style-${index}`} id={`styleGradient${index}`} x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor={color} stopOpacity={1} />
                                <stop offset="100%" stopColor={color} stopOpacity={0.7} />
                              </linearGradient>
                            ))}
                          </defs>
                          <Pie
                            data={styleData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            innerRadius={55}
                            outerRadius={85}
                            paddingAngle={4}
                            dataKey="value"
                            stroke="none"
                          >
                            {styleData.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={`url(#styleGradient${index % COLORS.length})`}
                                style={{ filter: 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.15))' }}
                              />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: "hsl(var(--card))", 
                              border: "1px solid hsl(var(--primary) / 0.2)",
                              borderRadius: "12px",
                              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
                              padding: "12px 16px"
                            }}
                            formatter={(value: number, name: string) => [
                              <span className="font-semibold">{value} videos</span>,
                              <span className="text-muted-foreground">{name}</span>
                            ]}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      {/* Center Stats */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="text-center">
                          <p className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                            {styleData.reduce((sum, d) => sum + d.value, 0)}
                          </p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Videos</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Legend - Vertical List */}
                    <div className="flex-1 w-full space-y-1.5 max-h-[200px] overflow-y-auto pr-2">
                      {styleData.map((entry, index) => {
                        const percentage = ((entry.value / styleData.reduce((sum, d) => sum + d.value, 0)) * 100).toFixed(0);
                        return (
                          <div 
                            key={entry.name}
                            className="group flex items-center gap-3 p-2 rounded-lg hover:bg-background/50 transition-all cursor-default"
                          >
                            {/* Color indicator with glow */}
                            <div className="relative flex-shrink-0">
                              <div 
                                className="w-3 h-3 rounded-full ring-2 ring-offset-1 ring-offset-background"
                                style={{ 
                                  background: `linear-gradient(135deg, ${COLORS[index % COLORS.length]}, ${COLORS[index % COLORS.length]}cc)`,
                                  boxShadow: `0 0 8px ${COLORS[index % COLORS.length]}50`
                                }}
                              />
                            </div>
                            {/* Style name */}
                            <span className="flex-1 text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                              {entry.name}
                            </span>
                            {/* Stats */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-xs font-semibold text-foreground">{entry.value}</span>
                              <span 
                                className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                                style={{ 
                                  backgroundColor: `${COLORS[index % COLORS.length]}20`,
                                  color: COLORS[index % COLORS.length]
                                }}
                              >
                                {percentage}%
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Sound Analysis Tab */}
          <TabsContent value="sound" className="space-y-4 md:space-y-6">
            <SoundAnalysisTab jobId={jobId} />
          </TabsContent>

          {/* Content Tab (Videos + Photo Carousels) */}
          <TabsContent value="videos" className="space-y-3 md:space-y-4">
            {/* Sort Controls */}
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Sort by:</span>
              </div>
              <Select value={videoSortBy} onValueChange={setVideoSortBy}>
                <SelectTrigger className="w-[200px] md:w-[280px] glass-card backdrop-blur-xl bg-card/40 border-primary/20">
                  <SelectValue placeholder="Default order" />
                </SelectTrigger>
                <SelectContent className="glass-card backdrop-blur-xl bg-card border-primary/20">
                  <SelectItem value="default">Default Order</SelectItem>
                  <SelectItem value="date-newest">Date (Newest First)</SelectItem>
                  <SelectItem value="date-oldest">Date (Oldest First)</SelectItem>
                  <SelectItem value="views">Views (High to Low)</SelectItem>
                  <SelectItem value="likes">Likes (High to Low)</SelectItem>
                  <SelectItem value="comments">Comments (High to Low)</SelectItem>
                  <SelectItem value="shares">Shares (High to Low)</SelectItem>
                  <SelectItem value="viral-score">Viral Score (High to Low)</SelectItem>
                  <SelectItem value="best-category">Best Performing Category</SelectItem>
                  <SelectItem value="most-common">Most Common Category</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Content List (Videos + Photo Carousels) */}
            {(() => {
              let sortedContent: ContentItem[] = [...allCompletedContent];
              
              if (videoSortBy === "date-newest") {
                sortedContent.sort((a, b) => {
                  const dateA = a.post_time_date ? new Date(a.post_time_date).getTime() : 0;
                  const dateB = b.post_time_date ? new Date(b.post_time_date).getTime() : 0;
                  return dateB - dateA;
                });
              } else if (videoSortBy === "date-oldest") {
                sortedContent.sort((a, b) => {
                  const dateA = a.post_time_date ? new Date(a.post_time_date).getTime() : 0;
                  const dateB = b.post_time_date ? new Date(b.post_time_date).getTime() : 0;
                  return dateA - dateB;
                });
              } else if (videoSortBy === "views") {
                sortedContent.sort((a, b) => (b.post_views || 0) - (a.post_views || 0));
              } else if (videoSortBy === "likes") {
                sortedContent.sort((a, b) => (b.post_likes || 0) - (a.post_likes || 0));
              } else if (videoSortBy === "comments") {
                sortedContent.sort((a, b) => {
                  const aComments = parseInt(a.post_comments || "0");
                  const bComments = parseInt(b.post_comments || "0");
                  return bComments - aComments;
                });
              } else if (videoSortBy === "shares") {
                sortedContent.sort((a, b) => (b.post_shares || 0) - (a.post_shares || 0));
              } else if (videoSortBy === "viral-score") {
                sortedContent.sort((a, b) => (b.viral_score || 0) - (a.viral_score || 0));
              } else if (videoSortBy === "best-category") {
                // Sort by content whose categories match the best performing category
                sortedContent.sort((a, b) => {
                  let aCategories: string[] = [];
                  let bCategories: string[] = [];
                  
                  if (isPhotoCarousel(a)) {
                    const aAnalysis = parseAnalysis(a.photo_carousel_analysis);
                    aCategories = aAnalysis?.main_categories || [];
                  } else {
                    const aVisual = parseAnalysis(a.visual_analysis);
                    aCategories = aVisual?.main_categories || [];
                  }
                  
                  if (isPhotoCarousel(b)) {
                    const bAnalysis = parseAnalysis(b.photo_carousel_analysis);
                    bCategories = bAnalysis?.main_categories || [];
                  } else {
                    const bVisual = parseAnalysis(b.visual_analysis);
                    bCategories = bVisual?.main_categories || [];
                  }
                  
                  const aHasBest = aCategories.includes(bestCategory?.category) ? 1 : 0;
                  const bHasBest = bCategories.includes(bestCategory?.category) ? 1 : 0;
                  if (bHasBest !== aHasBest) return bHasBest - aHasBest;
                  return (b.viral_score || 0) - (a.viral_score || 0);
                });
              } else if (videoSortBy === "most-common") {
                // Sort by content whose categories match the most common category
                const mostCommonCategory = styleData.length > 0 
                  ? styleData.reduce((max, current) => current.value > max.value ? current : max).name 
                  : null;
                sortedContent.sort((a, b) => {
                  let aCategories: string[] = [];
                  let bCategories: string[] = [];
                  
                  if (isPhotoCarousel(a)) {
                    const aAnalysis = parseAnalysis(a.photo_carousel_analysis);
                    aCategories = aAnalysis?.main_categories || [];
                  } else {
                    const aVisual = parseAnalysis(a.visual_analysis);
                    aCategories = aVisual?.main_categories || [];
                  }
                  
                  if (isPhotoCarousel(b)) {
                    const bAnalysis = parseAnalysis(b.photo_carousel_analysis);
                    bCategories = bAnalysis?.main_categories || [];
                  } else {
                    const bVisual = parseAnalysis(b.visual_analysis);
                    bCategories = bVisual?.main_categories || [];
                  }
                  
                  const aHasMost = aCategories.includes(mostCommonCategory) ? 1 : 0;
                  const bHasMost = bCategories.includes(mostCommonCategory) ? 1 : 0;
                  if (bHasMost !== aHasMost) return bHasMost - aHasMost;
                  return (b.viral_score || 0) - (a.viral_score || 0);
                });
              }

              return sortedContent.map((item) => {
                const visualAnalysis = isPhotoCarousel(item) 
                  ? parseAnalysis(item.photo_carousel_analysis)
                  : parseAnalysis(item.visual_analysis);
                const isCompleted = item.Status === "complete";
                const isCarousel = isPhotoCarousel(item);

                return (
                  <Card 
                    key={item.id} 
                    className="glass-card border-primary/20 backdrop-blur-xl bg-card/40 overflow-hidden hover:border-primary/40 transition-all cursor-pointer"
                    onClick={() => {
                      setSelectedVideoForPreview(item);
                      setIsVideoPreviewOpen(true);
                    }}
                  >
                    <CardContent className="p-3 md:p-6">
                      <div className="flex flex-col sm:flex-row gap-3 md:gap-6">
                        <div className="relative w-full sm:w-24 h-40 sm:h-30 flex-shrink-0 rounded-lg overflow-hidden bg-background/50 border border-border/50">
                          {isCompleted && item.content_url && thumbnails[item.content_url] ? (
                            <img src={thumbnails[item.content_url]} className="w-full h-full object-cover" alt="Thumbnail" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Sparkles className="w-6 h-6 text-primary animate-pulse" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 space-y-3 md:space-y-4 min-w-0">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-lg">{isCarousel ? '📸 Photo Carousel' : 'Video'} #{item.id}</h3>
                              {item.caption && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.caption}</p>}
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                              {item.performance_multiplier && (
                                <Badge className="bg-primary/20 text-primary border-primary/30">
                                  {item.performance_multiplier}
                                </Badge>
                              )}
                              {item.viral_score && (
                                <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                                  {item.viral_score}
                                </Badge>
                              )}
                            </div>
                          </div>

                          {isCompleted && (
                            <div className="flex flex-wrap gap-3 md:gap-4 text-xs md:text-sm">
                              {item.post_views && (
                                <div className="flex items-center gap-1">
                                  <Play className="w-3 h-3 md:w-4 md:h-4 text-primary" />
                                  <span className="font-medium">{formatNumber(item.post_views)}</span>
                                </div>
                              )}
                              {item.post_likes && (
                                <div className="flex items-center gap-1">
                                  <Heart className="w-3 h-3 md:w-4 md:h-4 text-red-400" />
                                  <span className="font-medium">{formatNumber(item.post_likes)}</span>
                                </div>
                              )}
                              {item.post_comments && (
                                <div className="flex items-center gap-1">
                                  <MessageCircle className="w-3 h-3 md:w-4 md:h-4 text-green-400" />
                                  <span className="font-medium">{item.post_comments}</span>
                                </div>
                              )}
                            </div>
                          )}

                          {isCompleted && (isCarousel || visualAnalysis) && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 pt-3 border-t border-border/50">
                              {(isCarousel || (visualAnalysis?.main_categories && visualAnalysis.main_categories.length > 0)) && (
                                <div>
                                  <p className="text-[10px] md:text-xs text-muted-foreground uppercase mb-1.5 md:mb-2">Content Style</p>
                                  <div className="flex flex-wrap gap-1">
                                    {isCarousel && (
                                      <Badge className="bg-purple-500/20 text-purple-400 border border-purple-500/30 text-[10px] md:text-xs">
                                        📸 Photo Carousel
                                      </Badge>
                                    )}
                                    {visualAnalysis?.main_categories?.map((cat: string) => (
                                      <Badge key={cat} className="bg-purple-500/10 text-purple-400 text-[10px] md:text-xs">
                                        {cat}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {!isCompleted && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
                              <Sparkles className="w-4 h-4 animate-pulse text-primary" />
                              <span>Analysis in progress...</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              });
            })()}
          </TabsContent>
        </Tabs>

        {/* Category Videos Modal */}
        <Dialog open={selectedCategory !== null} onOpenChange={(open) => !open && setSelectedCategory(null)}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto glass-card backdrop-blur-xl bg-card/95 border-primary/20">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                {selectedCategory} Videos
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-3">
              {(() => {
                // Filter both videos and photo carousels that match the selected category
                let categoryContent: ContentItem[] = [];
                
                // Add matching videos
                const matchingVideos = completedVideos.filter(v => {
                  const visual = parseAnalysis(v.visual_analysis);
                  return visual?.main_categories?.includes(selectedCategory);
                });
                categoryContent = [...categoryContent, ...matchingVideos];
                
                // Add matching photo carousels
                const matchingCarousels = completedCarousels.filter(c => {
                  // Photo carousels always have "Photo Carousel" category
                  if (selectedCategory === "Photo Carousel") return true;
                  
                  // Also check their specific categories
                  const carouselAnalysis = parseAnalysis(c.photo_carousel_analysis);
                  return carouselAnalysis?.main_categories?.includes(selectedCategory);
                });
                categoryContent = [...categoryContent, ...matchingCarousels];

                // Apply sorting based on Content Category Performance tab's sort mode
                if (categorySortMode === "performance") {
                  // Sort by views (performance metric)
                  categoryContent.sort((a, b) => (b.post_views || 0) - (a.post_views || 0));
                } else if (categorySortMode === "engagement") {
                  // Sort by engagement rate
                  categoryContent.sort((a, b) => {
                    const aER = ((a.post_likes || 0) * 1 + parseInt(a.post_comments || "0") * 2 + (a.post_saves || 0) * 3 + (a.post_shares || 0) * 4) / (a.post_views || 1) * 100;
                    const bER = ((b.post_likes || 0) * 1 + parseInt(b.post_comments || "0") * 2 + (b.post_saves || 0) * 3 + (b.post_shares || 0) * 4) / (b.post_views || 1) * 100;
                    return bER - aER;
                  });
                }

                return categoryContent.map((item) => {
                  const isCarousel = isPhotoCarousel(item);
                  return (
                  <div 
                    key={item.id}
                    className="flex gap-4 p-4 rounded-lg bg-background/30 border border-border/50 hover:border-primary/30 transition-all"
                  >
                    <div 
                      className="relative w-24 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-background/50 border border-border/50 cursor-pointer hover:border-primary/50 transition-all"
                      onClick={() => {
                        setSelectedVideoForPreview(item);
                        setIsVideoPreviewOpen(true);
                      }}
                    >
                      {item.content_url && thumbnails[item.content_url] ? (
                        <img src={thumbnails[item.content_url]} className="w-full h-full object-cover" alt="Thumbnail" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Sparkles className="w-6 h-6 text-primary animate-pulse" />
                        </div>
                      )}
                      {isCarousel && (
                        <div className="absolute top-1 right-1 bg-purple-500/90 text-white text-[10px] px-1.5 py-0.5 rounded">
                          📸
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm mb-2">{isCarousel ? '📸 Photo Carousel' : 'Video'} #{item.id}</h3>
                      {item.caption && <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{item.caption}</p>}
                      
                      <div className="flex flex-wrap gap-3 text-xs">
                        {item.post_views && (
                          <div className="flex items-center gap-1">
                            <Play className="w-3 h-3 text-primary" />
                            <span className="font-medium">{formatNumber(item.post_views)}</span>
                          </div>
                        )}
                        {item.post_likes && (
                          <div className="flex items-center gap-1">
                            <Heart className="w-3 h-3 text-red-400" />
                            <span className="font-medium">{formatNumber(item.post_likes)}</span>
                          </div>
                        )}
                        {item.post_shares && (
                          <div className="flex items-center gap-1">
                            <Share2 className="w-3 h-3 text-green-400" />
                            <span className="font-medium">{formatNumber(item.post_shares)}</span>
                          </div>
                        )}
                        {item.post_saves && (
                          <div className="flex items-center gap-1">
                            <Bookmark className="w-3 h-3 text-yellow-400" />
                            <span className="font-medium">{formatNumber(item.post_saves)}</span>
                          </div>
                        )}
                        {item.post_comments && (
                          <div className="flex items-center gap-1">
                            <MessageCircle className="w-3 h-3 text-blue-400" />
                            <span className="font-medium">{item.post_comments}</span>
                          </div>
                        )}
                        {item.post_views && (
                          <div className="flex items-center gap-1 bg-purple-500/10 px-2 py-1 rounded border border-purple-500/20">
                            <span className="text-purple-400 font-semibold text-[10px]">ER:</span>
                            <span className="font-medium">
                              {Math.round(((item.post_likes || 0) * 1 + parseInt(item.post_comments || "0") * 2 + (item.post_saves || 0) * 3 + (item.post_shares || 0) * 4) / item.post_views * 100)}%
                            </span>
                          </div>
                        )}
                      </div>

                      {item.viral_score && (
                        <div className="mt-2">
                          <ChartTooltipProvider delayDuration={500}>
                            <ChartTooltip>
                              <ChartTooltipTrigger asChild>
                                <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs cursor-help">
                                  Viral Score: {item.viral_score}
                                </Badge>
                              </ChartTooltipTrigger>
                              <ChartTooltipContent className="max-w-xs bg-card border-primary/20 p-4">
                                <div className="space-y-2">
                                  <p className="font-semibold text-sm">Viral Score Explained</p>
                                  <p className="text-xs text-muted-foreground">
                                    A performance metric showing how viral this {isCarousel ? 'photo carousel' : 'video'} was:
                                  </p>
                                  <ul className="text-xs text-muted-foreground space-y-1 ml-4 list-disc">
                                    <li>0-10: Normal performance</li>
                                    <li>10-30: Above average</li>
                                    <li>30+: Viral/exceptional</li>
                                  </ul>
                                  <p className="text-xs text-muted-foreground mt-2">
                                    Based on views, likes, comments, shares, and saves relative to your typical performance.
                                  </p>
                                </div>
                              </ChartTooltipContent>
                            </ChartTooltip>
                          </ChartTooltipProvider>
                        </div>
                      )}
                    </div>
                  </div>
                  );
                });
              })()}
            </div>
          </DialogContent>
        </Dialog>

        {/* Enlarged Video Modal */}
        <Dialog open={selectedVideoId !== null} onOpenChange={(open) => !open && setSelectedVideoId(null)}>
          <DialogContent className="max-w-3xl glass-card backdrop-blur-xl bg-card/95 border-primary/20">
            {selectedVideoId && (() => {
              const video = videos.find(v => v.id === selectedVideoId);
              if (!video) return null;
              
              return (
                <>
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Video #{video.id}</DialogTitle>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    {video.video_url_storage && (
                      <div className="w-full aspect-[9/16] max-h-[70vh] bg-background/50 rounded-lg overflow-hidden">
                        <video src={video.video_url_storage} className="w-full h-full object-contain" controls autoPlay playsInline />
                      </div>
                    )}
                    
                    {video.caption && (
                      <p className="text-sm text-muted-foreground">{video.caption}</p>
                    )}

                    <div className="flex flex-wrap gap-4">
                      {video.post_views && (
                        <div className="flex items-center gap-2">
                          <Play className="w-4 h-4 text-primary" />
                          <span className="font-medium">{formatNumber(video.post_views)} views</span>
                        </div>
                      )}
                      {video.post_likes && (
                        <div className="flex items-center gap-2">
                          <Heart className="w-4 h-4 text-red-400" />
                          <span className="font-medium">{formatNumber(video.post_likes)} likes</span>
                        </div>
                      )}
                      {video.post_shares && (
                        <div className="flex items-center gap-2">
                          <Share2 className="w-4 h-4 text-green-400" />
                          <span className="font-medium">{formatNumber(video.post_shares)} shares</span>
                        </div>
                      )}
                      {video.post_saves && (
                        <div className="flex items-center gap-2">
                          <Bookmark className="w-4 h-4 text-yellow-400" />
                          <span className="font-medium">{formatNumber(video.post_saves)} saves</span>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              );
            })()}
          </DialogContent>
        </Dialog>

        {/* Video Preview Dialog from Chart Click */}
        <Dialog open={isVideoPreviewOpen} onOpenChange={setIsVideoPreviewOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            {selectedVideoForPreview && (
              <>
                <DialogHeader>
                  <DialogTitle>{isPhotoCarousel(selectedVideoForPreview) ? 'Photo Carousel Details' : 'Video Details'}</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  {/* TikTok Embed */}
                  {selectedVideoForPreview.content_url && (
                    <div className="relative w-full max-w-[360px] mx-auto">
                      {isPhotoCarousel(selectedVideoForPreview) ? (
                        // Photo carousel embed using TikTok player - extract ID from URL
                        (() => {
                          const postId = selectedVideoForPreview.content_url?.match(/\/(?:video|photo)\/(\d+)/)?.[1];
                          const playerUrl = postId 
                            ? `https://www.tiktok.com/player/v1/${postId}?music_info=1&description=1&controls=1&volume_control=1`
                            : '';
                          
                          return (
                            <iframe
                              src={playerUrl}
                              allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                              allowFullScreen
                              title="TikTok Photo Carousel Player"
                              style={{ width: '100%', height: '600px', border: 'none' }}
                              className="rounded-lg"
                              loading="lazy"
                              onError={() => {
                                window.open(selectedVideoForPreview.content_url || '', '_blank', 'noopener,noreferrer');
                              }}
                            />
                          );
                        })()
                      ) : (
                        // Regular TikTok video embed
                        <TikTokEmbed
                          tiktokUrl={selectedVideoForPreview.content_url || ''}
                          videoId={selectedVideoForPreview.id}
                          className="mx-auto"
                        />
                      )}
                    </div>
                  )}

                  {/* Caption */}
                  {selectedVideoForPreview.caption && (
                    <div className="bg-background/30 rounded-lg p-4">
                      <p className="text-sm font-medium text-muted-foreground mb-1">Caption</p>
                      <p className="text-foreground">{selectedVideoForPreview.caption}</p>
                    </div>
                  )}

                  {/* Engagement Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    {selectedVideoForPreview.post_views && (
                      <div className="bg-background/30 rounded-lg p-3 flex items-center gap-2">
                        <Play className="w-4 h-4 text-blue-400" />
                        <div>
                          <p className="text-xs text-muted-foreground">Views</p>
                          <p className="text-sm font-bold">{formatNumber(selectedVideoForPreview.post_views)}</p>
                        </div>
                      </div>
                    )}
                    {selectedVideoForPreview.post_likes && (
                      <div className="bg-background/30 rounded-lg p-3 flex items-center gap-2">
                        <Heart className="w-4 h-4 text-red-400" />
                        <div>
                          <p className="text-xs text-muted-foreground">Likes</p>
                          <p className="text-sm font-bold">{formatNumber(selectedVideoForPreview.post_likes)}</p>
                        </div>
                      </div>
                    )}
                    {selectedVideoForPreview.post_shares && (
                      <div className="bg-background/30 rounded-lg p-3 flex items-center gap-2">
                        <Share2 className="w-4 h-4 text-green-400" />
                        <div>
                          <p className="text-xs text-muted-foreground">Shares</p>
                          <p className="text-sm font-bold">{formatNumber(selectedVideoForPreview.post_shares)}</p>
                        </div>
                      </div>
                    )}
                    {selectedVideoForPreview.post_saves && (
                      <div className="bg-background/30 rounded-lg p-3 flex items-center gap-2">
                        <Bookmark className="w-4 h-4 text-yellow-400" />
                        <div>
                          <p className="text-xs text-muted-foreground">Saves</p>
                          <p className="text-sm font-bold">{formatNumber(selectedVideoForPreview.post_saves)}</p>
                        </div>
                      </div>
                    )}
                    {selectedVideoForPreview.post_comments && (
                      <div className="bg-background/30 rounded-lg p-3 flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 text-purple-400" />
                        <div>
                          <p className="text-xs text-muted-foreground">Comments</p>
                          <p className="text-sm font-bold">{formatNumber(parseInt(selectedVideoForPreview.post_comments))}</p>
                        </div>
                      </div>
                    )}
                    {selectedVideoForPreview.viral_score && (
                      <div className="bg-background/30 rounded-lg p-3 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-yellow-400" />
                        <div>
                          <p className="text-xs text-muted-foreground">Viral Score</p>
                          <p className="text-sm font-bold">{selectedVideoForPreview.viral_score.toFixed(1)}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Analysis Tags */}
                  <div className="space-y-3">
                    {(() => {
                      const visual = isPhotoCarousel(selectedVideoForPreview)
                        ? parseAnalysis(selectedVideoForPreview.photo_carousel_analysis)
                        : parseAnalysis((selectedVideoForPreview as VideoAnalysis).visual_analysis);
                      
                      return (
                        <>
                          {visual?.main_categories && visual.main_categories.length > 0 && (
                            <div>
                              <p className="text-sm font-medium text-muted-foreground mb-2">Content Style</p>
                              <div className="flex flex-wrap gap-2">
                                {visual.main_categories.map((cat: string, idx: number) => (
                                  <Badge key={idx} variant="outline" className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                                    {cat}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default TikTokAuditDashboard;
