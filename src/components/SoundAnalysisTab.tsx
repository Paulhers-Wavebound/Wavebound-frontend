import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Music2, TrendingUp, Eye, Heart, MessageCircle, Share2, Music, Mic, Sparkles, Video, BarChart3, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import VideoDetailsModal from "./VideoDetailsModal";
import { fetchTikTokOEmbed, isTikTokUrl } from "@/utils/tiktokOEmbed";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from "recharts";

// oEmbed-only thumbnail component for sound analysis
const OEmbedThumbnail = ({ tiktokUrl, className }: { tiktokUrl: string; className?: string }) => {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchThumbnail = async () => {
      if (!isTikTokUrl(tiktokUrl)) {
        setLoading(false);
        return;
      }
      
      try {
        const oembed = await fetchTikTokOEmbed(tiktokUrl);
        if (oembed?.thumbnail_url) {
          setThumbnailUrl(oembed.thumbnail_url);
        }
      } catch (error) {
        console.error('Error fetching oEmbed thumbnail:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchThumbnail();
  }, [tiktokUrl]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-muted ${className}`}>
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!thumbnailUrl) {
    return (
      <div className={`flex items-center justify-center bg-muted ${className}`}>
        <Video className="w-12 h-12 text-muted-foreground" />
      </div>
    );
  }

  return (
    <img
      src={thumbnailUrl}
      alt="Video thumbnail"
      className={`object-cover ${className}`}
    />
  );
};

interface SoundData {
  id: number;
  sound_id: string;
  sound_name: string;
  sound_author: string;
  sound_coverImage_url: string | null;
  audio_analysis: any;
  videoCount: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  avgViews: number;
  avgEngagementRate: number;
}

interface ContentItem {
  id: number;
  content_url: string;
  post_views: number;
  post_likes: number;
  post_comments: string;
  post_shares: number;
  caption: string;
  viral_score: number;
  photo_url?: string;
  is_photo_carousel?: boolean;
  visual_analysis?: string;
  photo_carousel_analysis?: string;
}

interface SoundAnalysisTabProps {
  jobId: number;
}

const CHART_COLORS = ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#84cc16'];

const SoundAnalysisTab = ({ jobId }: SoundAnalysisTabProps) => {
  const [sounds, setSounds] = useState<SoundData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSound, setSelectedSound] = useState<SoundData | null>(null);
  const [soundContent, setSoundContent] = useState<ContentItem[]>([]);
  const [loadingContent, setLoadingContent] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<any>(null);

  useEffect(() => {
    fetchSoundAnalysis();
  }, [jobId]);

  const fetchSoundAnalysis = async () => {
    try {
      setLoading(true);

      const { data: soundData, error: soundError } = await supabase
        .rpc('get_sound_analysis_with_text_ids', { p_job_id: jobId });

      if (soundError) throw soundError;

      const { data: videoData, error: videoError } = await supabase
        .rpc('get_video_analysis_with_text_ids', { p_job_id: jobId });

      if (videoError) throw videoError;

      const soundsWithPerformance: SoundData[] = (soundData || []).map((sound: any) => {
        const soundIdStr = sound.sound_id;
        const videosWithSound = (videoData || []).filter(
          (video: any) => video.sound_id === soundIdStr
        );

        const videoCount = videosWithSound.length;
        const totalViews = videosWithSound.reduce((sum: number, v: any) => sum + Number(v.post_views || 0), 0);
        const totalLikes = videosWithSound.reduce((sum: number, v: any) => sum + Number(v.post_likes || 0), 0);
        const totalComments = videosWithSound.reduce((sum: number, v: any) => sum + Number(v.post_comments || 0), 0);
        const totalShares = videosWithSound.reduce((sum: number, v: any) => sum + Number(v.post_shares || 0), 0);

        const avgViews = videoCount > 0 ? totalViews / videoCount : 0;
        
        const avgEngagementRate = videoCount > 0 
          ? videosWithSound.reduce((sum: number, v: any) => {
              const views = Number(v.post_views || 1);
              const engagement = 
                (Number(v.post_likes || 0) * 1) +
                (Number(v.post_comments || 0) * 2) +
                (Number(v.post_shares || 0) * 3);
              return sum + (engagement / views) * 100;
            }, 0) / videoCount
          : 0;

        return {
          id: sound.id,
          sound_id: soundIdStr,
          sound_name: sound.sound_name,
          sound_author: sound.sound_author,
          sound_coverImage_url: sound.sound_coverImage_url,
          audio_analysis: sound.audio_analysis,
          videoCount,
          totalViews,
          totalLikes,
          totalComments,
          totalShares,
          avgViews,
          avgEngagementRate,
        };
      });

      soundsWithPerformance.sort((a, b) => b.avgViews - a.avgViews);
      setSounds(soundsWithPerformance);
    } catch (error) {
      console.error("Error fetching sound analysis:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toFixed(0);
  };

  const parseAudioAnalysis = (analysis: any) => {
    if (!analysis) return null;
    if (typeof analysis === 'string') {
      try {
        return JSON.parse(analysis);
      } catch {
        return null;
      }
    }
    return analysis;
  };

  const parseFieldData = (field: any) => {
    if (!field) return null;
    if (typeof field === 'string') {
      try {
        return JSON.parse(field);
      } catch {
        return field;
      }
    }
    return field;
  };

  // Aggregate data for overview charts
  const aggregatedData = useMemo(() => {
    const genreCounts: Record<string, number> = {};
    const moodScores: Record<string, number[]> = {};
    const instrumentCounts: Record<string, number> = {};

    sounds.forEach(sound => {
      const analysis = parseAudioAnalysis(sound.audio_analysis);
      if (!analysis) return;

      // Genres
      const genre = parseFieldData(analysis.genre);
      if (genre && typeof genre === 'object') {
        Object.keys(genre).forEach(g => {
          genreCounts[g] = (genreCounts[g] || 0) + 1;
        });
      }

      // Moods
      const mood = parseFieldData(analysis.mood);
      if (mood && typeof mood === 'object') {
        Object.entries(mood).forEach(([m, v]) => {
          if (!moodScores[m]) moodScores[m] = [];
          moodScores[m].push(typeof v === 'number' ? v : 0);
        });
      }

      // Instruments
      const instruments = parseFieldData(analysis.instruments);
      if (instruments && typeof instruments === 'object') {
        Object.keys(instruments).forEach(i => {
          instrumentCounts[i] = (instrumentCounts[i] || 0) + 1;
        });
      }
    });

    const genreData = Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value]) => ({ name, value }));

    const moodData = Object.entries(moodScores)
      .map(([mood, scores]) => ({
        mood,
        value: Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100)
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    const instrumentData = Object.entries(instrumentCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, value]) => ({ name, value }));

    return { genreData, moodData, instrumentData };
  }, [sounds]);

  const fetchContentForSound = async (sound: SoundData) => {
    try {
      setLoadingContent(true);
      setSelectedSound(sound);

      const { data: allVideos, error: videoError } = await supabase
        .rpc('get_video_analysis_with_text_ids', { p_job_id: jobId });

      if (videoError) throw videoError;

      const videos = (allVideos || []).filter(
        (v: any) => v.sound_id === sound.sound_id
      );

      const { data: carousels, error: carouselError } = await supabase
        .from("Analysis Profile 4 - photo_carousel_analysis")
        .select("*")
        .eq("job_id", jobId)
        .eq("sound_id", sound.sound_id);

      if (carouselError) throw carouselError;

      const allContent: ContentItem[] = [
        ...(videos || []).map((v: any) => ({
          id: v.id,
          content_url: v.content_url,
          post_views: v.post_views,
          post_likes: v.post_likes,
          post_comments: v.post_comments,
          post_shares: v.post_shares,
          caption: v.caption,
          viral_score: v.viral_score,
          visual_analysis: v.visual_analysis,
          is_photo_carousel: false,
        })),
        ...(carousels || []).map(c => ({
          id: c.id,
          content_url: c.content_url,
          post_views: c.post_views,
          post_likes: c.post_likes,
          post_comments: c.post_comments,
          post_shares: c.post_shares,
          caption: c.caption,
          viral_score: c.viral_score,
          photo_url: c.photo_url,
          photo_carousel_analysis: c.photo_carousel_analysis,
          is_photo_carousel: true,
        })),
      ];

      allContent.sort((a, b) => (b.post_views || 0) - (a.post_views || 0));
      setSoundContent(allContent);
    } catch (error) {
      console.error("Error fetching content for sound:", error);
    } finally {
      setLoadingContent(false);
    }
  };

  const handleContentClick = (content: ContentItem) => {
    setSelectedVideo({
      id: content.id,
      content_url: content.content_url,
      caption: content.caption,
      post_views: content.post_views,
      post_likes: content.post_likes,
      post_comments: content.post_comments,
      viral_score: content.viral_score,
      is_photo_carousel: content.is_photo_carousel,
      photo_url: content.photo_url,
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="glass-card border-primary/20">
              <CardContent className="p-6">
                <Skeleton className="h-48 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (sounds.length === 0) {
    return (
      <div className="text-center py-20">
        <Music2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">No sound analysis data available</p>
      </div>
    );
  }

  const topSound = sounds[0];
  const totalSounds = sounds.length;
  const soundsWithVideos = sounds.filter(s => s.videoCount > 0).length;

  return (
    <>
      <div className="space-y-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="glass-card border-primary/20 backdrop-blur-xl bg-card/40">
            <CardContent className="p-4 text-center">
              <Music2 className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{totalSounds}</p>
              <p className="text-xs text-muted-foreground">Total Sounds</p>
            </CardContent>
          </Card>
          <Card className="glass-card border-primary/20 backdrop-blur-xl bg-card/40">
            <CardContent className="p-4 text-center">
              <Video className="w-8 h-8 mx-auto mb-2 text-green-400" />
              <p className="text-2xl font-bold">{soundsWithVideos}</p>
              <p className="text-xs text-muted-foreground">With Content</p>
            </CardContent>
          </Card>
          <Card className="glass-card border-primary/20 backdrop-blur-xl bg-card/40">
            <CardContent className="p-4 text-center">
              <Eye className="w-8 h-8 mx-auto mb-2 text-blue-400" />
              <p className="text-2xl font-bold">{formatNumber(topSound?.avgViews || 0)}</p>
              <p className="text-xs text-muted-foreground">Top Avg Views</p>
            </CardContent>
          </Card>
          <Card className="glass-card border-primary/20 backdrop-blur-xl bg-card/40">
            <CardContent className="p-4 text-center">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 text-purple-400" />
              <p className="text-2xl font-bold">{topSound?.avgEngagementRate.toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground">Top Eng. Rate</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Mood Radar Chart */}
          {aggregatedData.moodData.length > 0 && (
            <Card className="glass-card border-primary/20 backdrop-blur-xl bg-card/40">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Mood Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={aggregatedData.moodData}>
                    <PolarGrid stroke="hsl(var(--border))" strokeOpacity={0.5} />
                    <PolarAngleAxis 
                      dataKey="mood" 
                      tick={(props) => {
                        const { x, y, payload, index } = props;
                        const value = aggregatedData.moodData[index]?.value || 0;
                        return (
                          <text 
                            x={x} 
                            y={y} 
                            textAnchor="middle" 
                            fill="hsl(var(--foreground))" 
                            fontSize={11}
                            fontWeight={500}
                          >
                            {`${payload.value} (${value})`}
                          </text>
                        );
                      }}
                    />
                    <PolarRadiusAxis 
                      angle={90} 
                      domain={[0, 100]}
                      tick={false}
                    />
                    <Radar 
                      name="Mood" 
                      dataKey="value" 
                      stroke="hsl(200 80% 60%)" 
                      fill="hsl(200 80% 70%)" 
                      fillOpacity={0.6} 
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Genre Distribution Pie Chart */}
          {aggregatedData.genreData.length > 0 && (
            <Card className="glass-card border-primary/20 backdrop-blur-xl bg-card/40">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Music className="w-5 h-5 text-primary" />
                  Genre Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={aggregatedData.genreData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={90}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {aggregatedData.genreData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
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
          )}

          {/* Instruments Bar Chart */}
          {aggregatedData.instrumentData.length > 0 && (
            <Card className="glass-card border-primary/20 backdrop-blur-xl bg-card/40 lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Most Used Instruments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={aggregatedData.instrumentData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: 'hsl(var(--foreground))', fontSize: 11 }}
                      angle={-30}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }}
                      formatter={(value: number) => [`${value} sounds`, 'Count']}
                    />
                    <Bar 
                      dataKey="value" 
                      fill="hsl(var(--primary))" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sound Analysis Overview */}
        <Card className="glass-card border-primary/20 backdrop-blur-xl bg-card/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Music2 className="w-5 h-5 text-primary" />
              Sound Analysis Overview
            </CardTitle>
            <p className="text-sm text-muted-foreground">Full audio analysis for each sound</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sounds.map((sound, index) => {
                const audioAnalysis = parseAudioAnalysis(sound.audio_analysis);
                const genre = audioAnalysis?.genre ? parseFieldData(audioAnalysis.genre) : null;
                const subGenre = audioAnalysis?.sub_genre ? parseFieldData(audioAnalysis.sub_genre) : null;
                const mood = audioAnalysis?.mood ? parseFieldData(audioAnalysis.mood) : null;
                const instruments = audioAnalysis?.instruments ? parseFieldData(audioAnalysis.instruments) : null;
                const voices = audioAnalysis?.voices ? parseFieldData(audioAnalysis.voices) : null;
                const emotionalProfile = audioAnalysis?.emotional_profile ? parseFieldData(audioAnalysis.emotional_profile) : null;
                const technicalFeedback = audioAnalysis?.technical_feedback ? parseFieldData(audioAnalysis.technical_feedback) : null;
                const bpm = audioAnalysis?.bpm;
                const key = audioAnalysis?.key;
                
                const genreKeys = genre && typeof genre === 'object' ? Object.entries(genre) : [];
                const subGenreKeys = subGenre && typeof subGenre === 'object' ? Object.entries(subGenre) : [];
                const moodKeys = mood && typeof mood === 'object' ? Object.entries(mood) : [];
                const instrumentKeys = instruments && typeof instruments === 'object' ? Object.entries(instruments) : [];
                const voiceKeys = voices && typeof voices === 'object' ? Object.entries(voices) : [];
                
                return (
                  <div 
                    key={sound.id}
                    className="p-4 rounded-xl bg-background/30 border border-border/50"
                  >
                    {/* Sound Header */}
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`
                        w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0
                        ${index === 0 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50' : 
                          index === 1 ? 'bg-gray-400/20 text-gray-400 border border-gray-400/50' :
                          index === 2 ? 'bg-orange-600/20 text-orange-400 border border-orange-600/50' :
                          'bg-muted text-muted-foreground'}
                      `}>
                        #{index + 1}
                      </div>
                      {sound.sound_coverImage_url ? (
                        <img
                          src={sound.sound_coverImage_url}
                          alt={sound.sound_name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
                          <Music2 className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm truncate">{sound.sound_name}</h4>
                        <p className="text-xs text-muted-foreground">by {sound.sound_author}</p>
                      </div>
                      <div className="hidden sm:flex items-center gap-4 text-xs">
                        <div className="text-center">
                          <p className="font-bold">{formatNumber(sound.avgViews)}</p>
                          <p className="text-muted-foreground">Avg Views</p>
                        </div>
                        <div className="text-center">
                          <p className="font-bold text-green-400">{sound.avgEngagementRate.toFixed(1)}%</p>
                          <p className="text-muted-foreground">ER</p>
                        </div>
                      </div>
                    </div>

                    {/* Analysis Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Genre & Sub-genre */}
                      {(genreKeys.length > 0 || subGenreKeys.length > 0) && (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                            <Music className="w-3 h-3" /> Genre
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {genreKeys.map(([name, score], i) => (
                              <Badge key={i} className="text-[10px] bg-primary/20 text-primary border-primary/30">
                                {name} {typeof score === 'number' ? `(${Math.round(score * 100)}%)` : ''}
                              </Badge>
                            ))}
                            {subGenreKeys.map(([name, score], i) => (
                              <Badge key={`sub-${i}`} variant="outline" className="text-[10px] bg-purple-500/10 text-purple-400 border-purple-400/30">
                                {name} {typeof score === 'number' ? `(${Math.round(score * 100)}%)` : ''}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Mood */}
                      {moodKeys.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> Mood
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {moodKeys.slice(0, 5).map(([name, score], i) => (
                              <Badge key={i} variant="outline" className="text-[10px] bg-blue-500/10 text-blue-400 border-blue-400/30">
                                {name} {typeof score === 'number' ? `(${Math.round(score * 100)}%)` : ''}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Instruments */}
                      {instrumentKeys.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                            <Mic className="w-3 h-3" /> Instruments
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {instrumentKeys.slice(0, 5).map(([name, score], i) => (
                              <Badge key={i} variant="outline" className="text-[10px] bg-green-500/10 text-green-400 border-green-400/30">
                                {name} {typeof score === 'number' ? `(${Math.round(score * 100)}%)` : ''}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Voices */}
                      {voiceKeys.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                            <Mic className="w-3 h-3" /> Voices
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {voiceKeys.slice(0, 4).map(([name, score], i) => (
                              <Badge key={i} variant="outline" className="text-[10px] bg-orange-500/10 text-orange-400 border-orange-400/30">
                                {name} {typeof score === 'number' ? `(${Math.round(score * 100)}%)` : ''}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* BPM & Key */}
                      {(bpm || key) && (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-muted-foreground">Technical</p>
                          <div className="flex flex-wrap gap-1">
                            {bpm && (
                              <Badge variant="outline" className="text-[10px] bg-cyan-500/10 text-cyan-400 border-cyan-400/30">
                                {bpm} BPM
                              </Badge>
                            )}
                            {key && (
                              <Badge variant="outline" className="text-[10px] bg-cyan-500/10 text-cyan-400 border-cyan-400/30">
                                Key: {key}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* View Content Button */}
                    <button
                      onClick={() => fetchContentForSound(sound)}
                      className="mt-4 text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
                    >
                      <Video className="w-3 h-3" />
                      View {sound.videoCount} videos with this sound
                    </button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sound Content Modal */}
      <Dialog open={selectedSound !== null} onOpenChange={() => setSelectedSound(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto glass-card backdrop-blur-xl bg-card/95 border-primary/20">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedSound?.sound_coverImage_url && (
                <img 
                  src={selectedSound.sound_coverImage_url} 
                  alt={selectedSound.sound_name} 
                  className="w-10 h-10 rounded-lg object-cover"
                />
              )}
              <div>
                <span className="text-xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                  {selectedSound?.sound_name}
                </span>
                <p className="text-sm text-muted-foreground">by {selectedSound?.sound_author}</p>
              </div>
              <Badge variant="outline" className="ml-auto">{soundContent.length} pieces</Badge>
            </DialogTitle>
          </DialogHeader>

          {loadingContent ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-48 w-full rounded-lg" />
              ))}
            </div>
          ) : soundContent.length === 0 ? (
            <div className="text-center py-12">
              <Video className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No content found with this sound</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              {soundContent.map((content) => (
                <Card
                  key={content.id}
                  className="overflow-hidden cursor-pointer hover:shadow-lg hover:border-primary/40 transition-all group"
                  onClick={() => handleContentClick(content)}
                >
                  <div className="aspect-[4/5] relative bg-muted overflow-hidden">
                    {content.content_url ? (
                      <OEmbedThumbnail
                        tiktokUrl={content.content_url}
                        className="w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Video className="w-12 h-12 text-muted-foreground" />
                      </div>
                    )}
                    {content.is_photo_carousel && (
                      <Badge className="absolute top-2 right-2 bg-purple-500/90 text-white text-[10px]">
                        📸 Carousel
                      </Badge>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                  </div>
                  <div className="p-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1">
                        <Eye className="w-3 h-3 text-primary" />
                        <span className="font-medium">{formatNumber(content.post_views || 0)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Heart className="w-3 h-3 text-red-400" />
                        <span className="font-medium">{formatNumber(content.post_likes || 0)}</span>
                      </div>
                    </div>
                    {content.caption && (
                      <p className="text-[10px] text-muted-foreground line-clamp-2">
                        {content.caption}
                      </p>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Video Details Modal */}
      {selectedVideo && (
        <VideoDetailsModal
          video={{
            ...selectedVideo,
            id: selectedVideo.id || 0,
            video_url: selectedVideo.content_url || '',
            outliar_score: selectedVideo.viral_score || 0,
            video_views: selectedVideo.post_views || 0,
            video_likes: selectedVideo.post_likes || 0,
            comments: String(selectedVideo.post_comments || '0'),
            profile_followers: 0,
            embedded_ulr: selectedVideo.content_url || '',
            isPhotoCarousel: selectedVideo.is_photo_carousel,
            postUrl: selectedVideo.content_url,
          }}
          videos={soundContent.map(c => ({
            id: c.id,
            video_url: c.content_url,
            outliar_score: c.viral_score || 0,
            video_views: c.post_views || 0,
            video_likes: c.post_likes || 0,
            comments: String(c.post_comments || '0'),
            profile_followers: 0,
            caption: c.caption,
            embedded_ulr: c.content_url,
            isPhotoCarousel: c.is_photo_carousel,
            postUrl: c.content_url,
          }))}
          isOpen={!!selectedVideo}
          onClose={() => setSelectedVideo(null)}
        />
      )}
    </>
  );
};

export default SoundAnalysisTab;
