import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { CategorySortMode, CategorySortMetric } from '@/components/CategorySection';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Heart, RefreshCw, Sparkles, ChevronRight } from 'lucide-react';
import { CategorySectionList } from '@/components/CategorySectionList';
import { Video, PhotoCarousel } from '@/types/content';
import { parseGenreJson } from '@/utils/genreParser';
import { parseGenreWithScores, sortContentByRelevance } from '@/utils/contentRelevanceScoring';
import { getGenreColor } from '@/utils/tagColors';
import { parseHiddenData } from '@/utils/hiddenDataParser';
import VideoDetailsModal from '@/components/VideoDetailsModal';
import { WeeklyContentPlan } from '@/components/WeeklyContentPlan';
import { AnalysisLoadingAnimation } from '@/components/AnalysisLoadingAnimation';
import { fetchContentByIdsWithPlatform, fetchTikTokVideosWithJoins, fetchReelsWithJoins, loadContentByStyle } from '@/services/contentDataService';
import { INITIAL_ITEMS_PER_CATEGORY, LOAD_MORE_ITEMS } from '@/utils/categoryConfig';

import { useAISidebar } from '@/contexts/AISidebarContext';
import { useDiscover } from '@/contexts/DiscoverContext';
import { useAnalysis } from '@/contexts/AnalysisContext';
import { useContentPlan } from '@/contexts/ContentPlanContext';
import TikTokEmbed from '@/components/TikTokEmbed';
import InstagramEmbed from '@/components/InstagramEmbed';

interface FavoritePlanWorkspaceProps {
  videoIdProp?: string;
  isHidden?: boolean;
}

const FavoritePlanWorkspace = ({ videoIdProp, isHidden = false }: FavoritePlanWorkspaceProps) => {
  const { videoId: videoIdFromUrl } = useParams();
  const videoId = videoIdProp || videoIdFromUrl;
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setContextMessages, openSidebar, isOpen: isSidebarOpen } = useAISidebar();
  const { sendVideoToAI, showMoreLikeThis, sendPlanToAI } = useDiscover();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [videoInfo, setVideoInfo] = useState<any>(null);
  const [weeklyPlanVideos, setWeeklyPlanVideos] = useState<Video[]>([]);
  const [lastPlanVideoIds, setLastPlanVideoIds] = useState<number[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [genreScores, setGenreScores] = useState<Map<string, number>>(new Map());
  const [subGenreScores, setSubGenreScores] = useState<Map<string, number>>(new Map());
  const [selectedSubGenres, setSelectedSubGenres] = useState<string[]>([]);
  const [aiResponse, setAiResponse] = useState<string>('');
  const [videoNotes, setVideoNotes] = useState<Record<number, string>>({});
  const [selectedForReplace, setSelectedForReplace] = useState<Video | null>(null);
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);
  const [categorySortModes, setCategorySortModes] = useState<Record<string, CategorySortMode>>({});
  const [categorySortMetrics, setCategorySortMetrics] = useState<Record<string, CategorySortMetric>>({});
  
  // Source video info
  const [sourceVideoEmbed, setSourceVideoEmbed] = useState<string | null>(null);
  const [sourceVideoCaption, setSourceVideoCaption] = useState<string | null>(null);
  const [sourceContext, setSourceContext] = useState<string>('');
  const [sourcePlatform, setSourcePlatform] = useState<string | null>(null);

  const { updateAnalysis, activeAnalysis, startAnalysis, clearAnalysis } = useAnalysis();
  const { setPlanVideos, registerReplaceHandler } = useContentPlan();

  const analysisCompletedRef = useRef(false);

  const [categoryState, setCategoryState] = useState<Record<string, { videos: Video[]; hasMore: boolean; loading: boolean }>>(() => {
    const keys = ['hookStatementVideos','selfiePerformanceVideos','selfieLipsyncVideos','proCameraLipsyncVideos',
      'livePerformanceVideos','lyricVideoVideos','coverVideos','memeVideos','transitionVideos',
      'fastPaceVideos','productionVideos','compilationVisualsVideos','cinematicEditVideos','instrumentPerformanceVideos'];
    const initial: Record<string, { videos: Video[]; hasMore: boolean; loading: boolean }> = {};
    keys.forEach(key => { initial[key] = { videos: [], hasMore: false, loading: false }; });
    return initial;
  });

  useEffect(() => {
    if (videoId && (!activeAnalysis || activeAnalysis.id !== videoId)) {
      startAnalysis(videoId, 'video');
    }
  }, [videoId, activeAnalysis, startAnalysis]);

  useEffect(() => { loadAnalysisResults(); }, [videoId]);

  useEffect(() => {
    if (analysisCompletedRef.current) return;
    if (analysisResult?.status === 'completed') return;
    const shouldPoll = analysisResult?.status === 'processing' || analysisResult?.status === 'pending';
    if (shouldPoll) {
      const interval = setInterval(() => {
        if (analysisCompletedRef.current) { clearInterval(interval); return; }
        void loadAnalysisResults({ silent: true });
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [analysisResult?.status]);

  const loadAnalysisResults = async (opts?: { silent?: boolean }) => {
    const silent = !!opts?.silent;
    try {
      if (!silent) { setLoading(true); setLoadError(null); }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate('/'); return; }

      const { data: video } = await supabase
        .from('user_uploaded_videos')
        .select('*')
        .eq('id', videoId)
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (!video) { setLoadError('Record not found. It may still be initializing...'); return; }
      setVideoInfo(video);

      // Try to get source info from the notes field (we store metadata there)
      let sourceVideoId: string | null = null;
      let sourcePlatform: string | null = null;
      try {
        const meta = video.notes ? JSON.parse(video.notes) : null;
        if (meta?.source_embed_url) setSourceVideoEmbed(meta.source_embed_url);
        if (meta?.source_caption) setSourceVideoCaption(meta.source_caption);
        if (meta?.source_video_id) sourceVideoId = String(meta.source_video_id);
        if (meta?.source_platform) { sourcePlatform = meta.source_platform; setSourcePlatform(sourcePlatform); }
      } catch {}

      // Fetch context from AI table for the source video
      if (sourceVideoId) {
        try {
          const aiTable = sourcePlatform === 'tiktok'
            ? '0.1. Table 5 - Ai - TikTok'
            : '0.1. Table 5.2 - Ai - Reels';
          const { data: sourceAiData } = await supabase
            .from(aiTable)
            .select('context')
            .eq('video_id', parseInt(sourceVideoId, 10))
            .maybeSingle();
          if (sourceAiData?.context) setSourceContext(sourceAiData.context);
        } catch (e) {
          console.warn('Failed to fetch source context:', e);
        }
      }

      const { data: analysis } = await supabase
        .from('video_analysis_results')
        .select('*')
        .eq('video_id', videoId)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!analysis) { setLoadError('Analysis record not found yet...'); return; }
      setAnalysisResult(analysis);

      if (analysis.status === 'completed') {
        analysisCompletedRef.current = true;
        setLoading(false);

        const extractedGenres = parseGenreJson(analysis.genre);
        if (extractedGenres.length > 0) setGenreScores(parseGenreWithScores(analysis.genre));
        setSelectedGenres(extractedGenres);

        const extractedSubGenres = parseGenreJson((analysis as any).sub_genre);
        if (extractedSubGenres.length > 0) setSubGenreScores(parseGenreWithScores((analysis as any).sub_genre));
        setSelectedSubGenres(extractedSubGenres);

        await loadContentPlanVideos(analysis);
        await loadMatchingVideos(extractedGenres, analysis.genre, (analysis as any).sub_genre);
      }
    } catch (error) {
      console.error('Error loading analysis:', error);
      setLoadError('Failed to load. Please retry.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const loadContentPlanVideos = async (analysis: any) => {
    try {
      const hooksData = analysis.hooks_captions;
      if (!hooksData) return;

      const hookItem = Array.isArray(hooksData) ? hooksData[0] : hooksData;
      if (!hookItem) return;

      let contentPlan = hookItem?.content_plan || [];
      const aiResponseText = hookItem?.ai_response || hookItem?.content_plan_text || '';

      if ((!contentPlan || contentPlan.length === 0) && aiResponseText) {
        try {
          const { extractedData } = parseHiddenData(aiResponseText);
          if (extractedData.length > 0) {
            contentPlan = extractedData.map((item: any, index: number) => ({
              day: index + 1, title: item.title || `Day ${index + 1}`,
              action: item.action || '', why_it_works: item.why_it_works || '',
              video_embed_id: String(item.video_embed_id || item.id || '').trim(),
              hook: item.hook || item.title || '', source: item.source || item.platform || '',
            }));
          }
        } catch (e) { console.warn('Parse hidden_data failed:', e); }
      }

      if (aiResponseText) {
        let cleaned = aiResponseText.replace(/<hidden_data>[\s\S]*?(<\/hidden_data>|$)/gi, '').trim();
        // Strip search progress / candidate matching text (everything before the --- separator)
        const separatorIndex = cleaned.indexOf('---');
        if (separatorIndex !== -1) {
          cleaned = cleaned.slice(separatorIndex + 3).trim();
        }
        setAiResponse(cleaned);
        setContextMessages([{ role: 'assistant', content: cleaned, isContentPlan: true }]);
      }

      if (!Array.isArray(contentPlan) || contentPlan.length === 0) return;

      const planData: Array<{
        videoId: number; hook?: string; description?: string;
        day: number; title?: string; action?: string; whyItWorks?: string;
        platform?: 'tiktok' | 'instagram' | 'unknown'; contentTypePlatform?: string;
      }> = [];

      contentPlan.forEach((item: any, index: number) => {
        const vid = parseInt(item.video_embed_id || item.video_id || item.id, 10);
        const sourceField = (item.source || item.platform || '').toLowerCase();
        let platform: 'tiktok' | 'instagram' | 'unknown' = 'unknown';
        if (sourceField.includes('instagram') || sourceField.includes('reel')) platform = 'instagram';
        else if (sourceField.includes('tiktok')) platform = 'tiktok';

        planData.push({
          videoId: vid, hook: item.title || item.hook, description: item.action || item.why_it_works,
          day: item.day || index + 1, title: item.title, action: item.action, whyItWorks: item.why_it_works,
          platform, contentTypePlatform: item.source || item.platform || '',
        });
      });

      const uniqueVideoIds = [...new Set(planData.map(p => p.videoId).filter(id => !isNaN(id)))];
      setLastPlanVideoIds(planData.map(p => p.videoId).filter(id => !isNaN(id)));
      setWeeklyPlanVideos([]);
      if (uniqueVideoIds.length === 0) return;

      const uniqueContentItems = [...new Map(
        planData.filter(p => !isNaN(p.videoId)).map(p => [p.videoId, { id: p.videoId, platform: p.platform || 'unknown' as const }])
      ).values()];

      const videos = await fetchContentByIdsWithPlatform(uniqueContentItems);
      const videoMap = new Map<number, any>();
      videos?.forEach((video: any) => videoMap.set(video.id, video));

      const sortedContent: Video[] = [];
      const usedEmbedUrls = new Set<string>();

      planData.forEach((planItem) => {
        const fetchedVideo = videoMap.get(planItem.videoId);
        if (fetchedVideo) {
          const embedUrl = fetchedVideo.embedded_ulr || fetchedVideo.video_url || '';
          if (embedUrl && usedEmbedUrls.has(embedUrl)) return;
          if (embedUrl) usedEmbedUrls.add(embedUrl);
          sortedContent.push({
            ...fetchedVideo,
            ai_hook: planItem.hook || planItem.title,
            ai_description: planItem.description || planItem.whyItWorks,
            ai_content_type_platform: planItem.contentTypePlatform || '',
          });
        }
      });

      setWeeklyPlanVideos(sortedContent);
    } catch (error) {
      console.error('Error loading content plan:', error);
    }
  };

  const loadMatchingVideos = async (genres: string[], audioGenreData?: string, audioSubGenreData?: string) => {
    try {
      const normalizedGenres = genres.map(g => g.trim().toLowerCase()).filter(g => g);
      const normalizedSubGenres = selectedSubGenres.map(sg => sg.trim().toLowerCase()).filter(sg => sg);

      const [tiktokVideos, reelsVideos] = await Promise.all([
        fetchTikTokVideosWithJoins(500, 0, normalizedGenres, [], 'views', normalizedSubGenres),
        fetchReelsWithJoins(500, 0, normalizedGenres, [], 'views', normalizedSubGenres)
      ]);

      const allVideos = [
        ...tiktokVideos.map(v => ({ ...v, content_type: 'tiktok' as const })),
        ...reelsVideos.map(v => ({ ...v, content_type: 'reel' as const, is_reel: true }))
      ];

      if (allVideos.length > 0) {
        const tiktokIds = allVideos.filter(v => v.content_type === 'tiktok').map(v => v.id);
        const reelIds = allVideos.filter(v => v.content_type === 'reel').map(v => v.id);

        const [tiktokAssets, reelAssets] = await Promise.all([
          tiktokIds.length > 0 ? supabase.from('0.1. Table 4 - Assets - TikTok').select('video_id, thumbnail_url').in('video_id', tiktokIds) : Promise.resolve({ data: [] }),
          reelIds.length > 0 ? supabase.from('0.1. Table 4.2 - Assets - Reels').select('video_id, thumbnail_url').in('video_id', reelIds) : Promise.resolve({ data: [] }),
        ]);

        const thumbMap = new Map();
        tiktokAssets.data?.forEach((a: any) => { if (a.video_id && a.thumbnail_url) thumbMap.set(a.video_id, a.thumbnail_url); });
        reelAssets.data?.forEach((a: any) => { if (a.video_id && a.thumbnail_url) thumbMap.set(a.video_id, a.thumbnail_url); });

        const videosWithThumbs = allVideos.map(v => ({
          ...v,
          thumbnail_url: thumbMap.get(v.id) || null,
          is_reel: v.content_type === 'reel',
          embedded_ulr: (v as any).embedded_ulr || (v as any).embedded_url || v.video_url || null,
          video_url: v.video_url || (v as any).embedded_url || null,
        }));

        const audioGS = parseGenreWithScores(audioGenreData);
        const audioSGS = parseGenreWithScores(audioSubGenreData);
        const sorted = sortContentByRelevance(videosWithThumbs, audioGS, audioSGS);

        const DISPLAY_LIMIT = INITIAL_ITEMS_PER_CATEGORY;
        const newCatState: Record<string, { videos: Video[]; hasMore: boolean; loading: boolean }> = {};
        const styleMapping: Record<string, string[]> = {
          hookStatementVideos: ['hook statement'], selfiePerformanceVideos: ['selfie performance'],
          selfieLipsyncVideos: ['selfie lipsync'], proCameraLipsyncVideos: ['pro camera lipsync'],
          livePerformanceVideos: ['live performance'], lyricVideoVideos: ['lyric video'],
          coverVideos: ['cover'], memeVideos: ['meme'], transitionVideos: ['transition'],
          fastPaceVideos: ['fast pace'], productionVideos: ['production', 'bts'],
          compilationVisualsVideos: ['compilation'], cinematicEditVideos: ['cinematic'],
          instrumentPerformanceVideos: ['instrument'],
        };

        Object.entries(styleMapping).forEach(([key, styles]) => {
          const matched = sorted.filter(v => styles.some(s => v.content_style?.toLowerCase().includes(s.toLowerCase())));
          newCatState[key] = { videos: matched.slice(0, DISPLAY_LIMIT), hasMore: matched.length >= DISPLAY_LIMIT, loading: false };
        });
        setCategoryState(newCatState);
      }
    } catch (error) {
      console.error('Error loading matching videos:', error);
    }
  };

  const loadMoreForCategory = useCallback(async (categoryKey: string) => {
    const styleMap: Record<string, string> = {
      hookStatementVideos: 'hook statement', selfiePerformanceVideos: 'selfie performance',
      selfieLipsyncVideos: 'selfie lipsync', proCameraLipsyncVideos: 'pro camera lipsync',
      livePerformanceVideos: 'live performance', lyricVideoVideos: 'lyric video',
      coverVideos: 'cover', memeVideos: 'meme', transitionVideos: 'transition',
      fastPaceVideos: 'fast pace', productionVideos: 'production',
      compilationVisualsVideos: 'compilation visuals', cinematicEditVideos: 'cinematic edit',
      instrumentPerformanceVideos: 'instrument performance',
    };
    const style = styleMap[categoryKey];
    if (!style) return;
    const cat = categoryState[categoryKey];
    if (!cat || !cat.hasMore || cat.loading) return;

    setCategoryState(prev => ({ ...prev, [categoryKey]: { ...prev[categoryKey], loading: true } }));
    try {
      const targetTotal = cat.videos.length + LOAD_MORE_ITEMS;
      const data = await loadContentByStyle(style, targetTotal, 0, selectedGenres, [], selectedSubGenres);
      setCategoryState(prev => ({
        ...prev,
        [categoryKey]: { videos: data, hasMore: data.length >= targetTotal, loading: false }
      }));
    } catch {
      setCategoryState(prev => ({ ...prev, [categoryKey]: { ...prev[categoryKey], loading: false } }));
    }
  }, [categoryState, selectedGenres, selectedSubGenres]);

  // Sync with ContentPlanContext
  useEffect(() => { setPlanVideos(weeklyPlanVideos); }, [weeklyPlanVideos, setPlanVideos]);

  useEffect(() => {
    const handler = (video: Video, dayIndex: number) => {
      setWeeklyPlanVideos(prev => { const n = [...prev]; if (dayIndex >= 0 && dayIndex < n.length) n[dayIndex] = video; return n; });
      setSelectedForReplace(null);
    };
    registerReplaceHandler(handler);
    return () => { registerReplaceHandler(null); };
  }, [registerReplaceHandler]);

  const handleVideoClick = useCallback((video: Video) => {
    setSelectedVideo(video);
    setIsVideoModalOpen(true);
  }, []);

  const handleReplaceInPlan = useCallback((video: Video, dayIndex: number) => {
    setWeeklyPlanVideos(prev => { const n = [...prev]; n[dayIndex] = video; return n; });
    setSelectedForReplace(null);
  }, []);

  const allMatchedVideos = useMemo(() => {
    const combined = Object.values(categoryState).flatMap(cat => cat.videos);
    if (combined.length === 0 && weeklyPlanVideos.length > 0) return weeklyPlanVideos;
    return sortContentByRelevance(combined, genreScores, subGenreScores);
  }, [categoryState, genreScores, subGenreScores, weeklyPlanVideos]);

  // --- RENDER ---

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[80vh]">
          <div className="text-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
            <p className="text-lg text-muted-foreground">Loading content plan...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (loadError || (!analysisResult && !loading)) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[80vh]">
          <div className="text-center space-y-6 max-w-md">
            <div className="p-4 bg-amber-500/10 rounded-full w-fit mx-auto">
              <RefreshCw className="w-10 h-10 text-amber-500" />
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2">Plan is being prepared</h2>
              <p className="text-muted-foreground">{loadError || 'Still processing...'}</p>
              <p className="text-sm text-muted-foreground/70 mt-2">Auto-refreshing every 5 seconds...</p>
            </div>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => { setLoadError(null); loadAnalysisResults(); }} className="gap-2">
                <RefreshCw className="w-4 h-4" />Retry
              </Button>
              <Button variant="outline" onClick={() => navigate('/create')}>Go Back</Button>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (analysisResult?.status === 'processing' || analysisResult?.status === 'pending') {
    const handleCancel = () => { clearAnalysis(); navigate('/create'); };
    return <AppLayout><AnalysisLoadingAnimation contained mode="video" onCancel={handleCancel} /></AppLayout>;
  }

  return (
    <AppLayout>
      <div className="max-w-[1800px] mx-auto px-4 py-8">
        <div className="mb-8 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Heart className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Content Plan from Favorite</h2>
          </div>

          <Card className="p-6 bg-card/80 border-border/10">
            <div className="flex flex-col gap-6">
              {/* Source video embed */}
              {sourceVideoEmbed && (
                <div className="pb-4 border-b border-border/30">
                  <div className="flex items-center gap-2 mb-3">
                    <Heart className="w-4 h-4 text-primary/70" />
                    <span className="text-sm font-medium text-muted-foreground">Inspiration Video</span>
                  </div>
                  <div className="w-full flex justify-center">
                    <div className="max-w-[360px] w-full">
                      {sourcePlatform === 'tiktok' ? (
                        <TikTokEmbed tiktokUrl={sourceVideoEmbed} showShareOverlay={false} />
                      ) : (
                        <InstagramEmbed reelUrl={sourceVideoEmbed} />
                      )}
                    </div>
                  </div>
                  {sourceVideoCaption && (
                    <p className="text-sm text-muted-foreground mt-3 text-center max-w-lg mx-auto line-clamp-2">{sourceVideoCaption}</p>
                  )}
                </div>
              )}

              {/* AI Summary */}
              {(sourceContext || aiResponse) && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl bg-primary/5 border border-primary/20 p-5"
                >
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <p className="text-sm text-foreground/80 leading-relaxed">{sourceContext || aiResponse}</p>
                  </div>
                </motion.div>
              )}

              {/* Genres */}
              {selectedGenres.length > 0 && (
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-lg font-bold">Genre:</span>
                  <div className="flex flex-wrap items-center gap-2">
                    {selectedGenres.map((genre, i) => {
                      const colors = getGenreColor(genre);
                      return (
                        <Badge key={i} className="px-3 py-1 text-sm border"
                          style={{ backgroundColor: colors.bg, color: colors.text, borderColor: colors.border }}>
                          {genre}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Two-column layout matching video workspace */}
        <div className="flex gap-6">
          <div className="flex-1 min-w-0">
            {/* Weekly Content Plan */}
            {(weeklyPlanVideos.length > 0 || allMatchedVideos.length > 0) && (
              <Card className="p-4 bg-card/80 border-border/10 mb-6">
                <WeeklyContentPlan
                  allVideos={allMatchedVideos}
                  onVideoClick={handleVideoClick}
                  onPlanInitialized={setWeeklyPlanVideos}
                  customPlanVideos={weeklyPlanVideos.length > 0 ? weeklyPlanVideos : undefined}
                  selectedForReplace={selectedForReplace}
                  onSelectForReplace={setSelectedForReplace}
                  onRefreshDay={(dayIndex) => {
                    const updatedPlan = [...weeklyPlanVideos];
                    const replacement = allMatchedVideos.find(v => !weeklyPlanVideos.some(pv => pv.id === v.id));
                    if (replacement) { updatedPlan[dayIndex] = replacement; setWeeklyPlanVideos(updatedPlan); }
                  }}
                  audioId={videoId}
                  audioInfo={videoInfo}
                  analysisResult={analysisResult}
                  genreScores={genreScores}
                  subGenreScores={subGenreScores}
                  notes={videoNotes}
                  onNotesChange={(vid, notes) => {
                    setVideoNotes(prev => ({ ...prev, [vid]: notes }));
                  }}
                  onAskAI={(video) => { sendVideoToAI(video); openSidebar(); }}
                  onAskAIAboutPlan={() => {
                    if (analysisResult && weeklyPlanVideos.length > 0) {
                      sendPlanToAI({ analysisResult, planVideos: weeklyPlanVideos, genres: selectedGenres, subGenres: selectedSubGenres });
                      openSidebar();
                    }
                  }}
                />
              </Card>
            )}

            {/* Category sections */}
            <div className="bg-muted/30 dark:bg-muted/10 -mx-4 px-4 pt-12 pb-8 rounded-2xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold">Matching videos for your niche 🚀</h2>
                  <p className="text-sm text-muted-foreground mt-1">Curated videos that match the favorite's genre & style</p>
                </div>
              </div>

              <CategorySectionList
                viralRightNowVideos={{ videos: [], photoCarousels: [], loading: false, hasMore: false, loadMore: async () => {} }}
                viralRightNowReels={{ videos: [], photoCarousels: [], loading: false, hasMore: false, loadMore: async () => {} }}
                viralPhotoCarousels={{ videos: [], photoCarousels: [], loading: false, hasMore: false, loadMore: async () => {} }}
                hookStatementVideos={{ ...categoryState.hookStatementVideos, photoCarousels: [], loadMore: () => loadMoreForCategory('hookStatementVideos') }}
                selfiePerformanceVideos={{ ...categoryState.selfiePerformanceVideos, photoCarousels: [], loadMore: () => loadMoreForCategory('selfiePerformanceVideos') }}
                selfieLipsyncVideos={{ ...categoryState.selfieLipsyncVideos, photoCarousels: [], loadMore: () => loadMoreForCategory('selfieLipsyncVideos') }}
                fastPaceVideos={{ ...categoryState.fastPaceVideos, photoCarousels: [], loadMore: () => loadMoreForCategory('fastPaceVideos') }}
                lyricVideoVideos={{ ...categoryState.lyricVideoVideos, photoCarousels: [], loadMore: () => loadMoreForCategory('lyricVideoVideos') }}
                proCameraLipsyncVideos={{ ...categoryState.proCameraLipsyncVideos, photoCarousels: [], loadMore: () => loadMoreForCategory('proCameraLipsyncVideos') }}
                livePerformanceVideos={{ ...categoryState.livePerformanceVideos, photoCarousels: [], loadMore: () => loadMoreForCategory('livePerformanceVideos') }}
                coverVideos={{ ...categoryState.coverVideos, photoCarousels: [], loadMore: () => loadMoreForCategory('coverVideos') }}
                memeVideos={{ ...categoryState.memeVideos, photoCarousels: [], loadMore: () => loadMoreForCategory('memeVideos') }}
                transitionVideos={{ ...categoryState.transitionVideos, photoCarousels: [], loadMore: () => loadMoreForCategory('transitionVideos') }}
                productionVideos={{ ...categoryState.productionVideos, photoCarousels: [], loadMore: () => loadMoreForCategory('productionVideos') }}
                compilationVisualsVideos={{ ...categoryState.compilationVisualsVideos, photoCarousels: [], loadMore: () => loadMoreForCategory('compilationVisualsVideos') }}
                cinematicEditVideos={{ ...categoryState.cinematicEditVideos, photoCarousels: [], loadMore: () => loadMoreForCategory('cinematicEditVideos') }}
                instrumentPerformanceVideos={{ ...categoryState.instrumentPerformanceVideos, photoCarousels: [], loadMore: () => loadMoreForCategory('instrumentPerformanceVideos') }}
                expandedCategoryId={expandedCategoryId}
                isContentSelected={() => false}
                toggleContentSelection={() => {}}
                handleVideoClick={handleVideoClick}
                handlePhotoCarouselClick={() => {}}
                filterCategoryVideos={(videos) => videos}
                filterCategoryPhotoCarousels={(carousels) => carousels}
                activeContentStyleFilter={[]}
                sortModes={categorySortModes}
                onSortModeChange={(id, mode) => setCategorySortModes(prev => ({ ...prev, [id]: mode }))}
                sortMetrics={categorySortMetrics}
                onSortMetricChange={(id, metric) => setCategorySortMetrics(prev => ({ ...prev, [id]: metric }))}
                showReplaceMode={true}
                onReplaceInPlan={handleReplaceInPlan}
                currentPlanVideos={weeklyPlanVideos}
                selectedForReplace={selectedForReplace}
                onSelectForReplace={setSelectedForReplace}
                onAskAI={(video) => { sendVideoToAI(video); openSidebar(); }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Video Modal */}
      {selectedVideo && (
        <VideoDetailsModal
          video={selectedVideo}
          isOpen={isVideoModalOpen}
          onClose={() => { setIsVideoModalOpen(false); setSelectedVideo(null); }}
          showReplaceMode={true}
          onReplaceInPlan={(dayIndex) => selectedVideo && handleReplaceInPlan(selectedVideo, dayIndex)}
          currentPlanVideos={weeklyPlanVideos}
          selectedForReplace={selectedForReplace}
          onSelectForReplace={setSelectedForReplace}
        />
      )}

      {/* Floating Ask AI */}
      {!isSidebarOpen && (
        <button onClick={() => openSidebar()}
          className="fixed right-6 top-1/2 -translate-y-1/2 z-40 group flex items-center gap-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-primary text-primary-foreground pl-4 pr-3 py-3">
          <Sparkles className="w-4 h-4" />
          <span className="font-medium text-sm">Ask AI</span>
          <ChevronRight className="w-4 h-4 opacity-70 group-hover:translate-x-0.5 transition-transform" />
        </button>
      )}
    </AppLayout>
  );
};

export default FavoritePlanWorkspace;
