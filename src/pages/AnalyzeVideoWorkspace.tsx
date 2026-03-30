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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Film, RefreshCw, Sparkles, X, Plus, Filter, RotateCcw, ChevronRight, Eye } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useIdeaExtraction, EnrichedIdea } from '@/hooks/useIdeaExtraction';
import { IdeaDeck } from '@/components/IdeaDeck';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CategorySectionList } from '@/components/CategorySectionList';
import { Video, PhotoCarousel } from '@/types/content';
import { GlobalNotesPanel } from '@/components/GlobalNotesPanel';
import { parseGenreJson, getGenreScores } from '@/utils/genreParser';
import { parseGenreWithScores, sortContentByRelevance, getSortedGenresWithScores } from '@/utils/contentRelevanceScoring';
import { getGenreColor } from '@/utils/tagColors';
import { parseHiddenData } from '@/utils/hiddenDataParser';
import VideoDetailsModal from '@/components/VideoDetailsModal';
import PhotoCarouselModal from '@/components/PhotoCarouselModal';
import { WeeklyContentPlan } from '@/components/WeeklyContentPlan';
import { VideoAnalysisOverview } from '@/components/VideoAnalysisOverview';
import { AnalysisLoadingAnimation } from '@/components/AnalysisLoadingAnimation';
import { fetchContentByIdsWithPlatform, fetchTikTokVideosWithJoins, fetchReelsWithJoins, fetchPhotoCarouselsByIds, loadContentByStyle } from '@/services/contentDataService';
import { INITIAL_ITEMS_PER_CATEGORY, LOAD_MORE_ITEMS } from '@/utils/categoryConfig';

import { useAISidebar } from '@/contexts/AISidebarContext';
import { useDiscover } from '@/contexts/DiscoverContext';
import { useAnalysis } from '@/contexts/AnalysisContext';
import { useContentPlan } from '@/contexts/ContentPlanContext';


interface AnalyzeVideoWorkspaceProps {
  videoIdProp?: string;
  isHidden?: boolean;
}

const AnalyzeVideoWorkspace = ({ videoIdProp, isHidden = false }: AnalyzeVideoWorkspaceProps) => {
  const { videoId: videoIdFromUrl } = useParams();
  const videoId = videoIdProp || videoIdFromUrl;
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setContextMessages, openSidebar, isOpen: isSidebarOpen } = useAISidebar();
  const { sendVideoToAI, showMoreLikeThis, sendPlanToAI } = useDiscover();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isRerunning, setIsRerunning] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [videoInfo, setVideoInfo] = useState<any>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [selectedPhotoCarousel, setSelectedPhotoCarousel] = useState<PhotoCarousel | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [weeklyPlanVideos, setWeeklyPlanVideos] = useState<Video[]>([]);
  const [lastPlanVideoIds, setLastPlanVideoIds] = useState<number[]>([]);
  const [savedPlanId, setSavedPlanId] = useState<string | null>(null);
  const [isInitialPlanLoad, setIsInitialPlanLoad] = useState(true);
  const [selectedForReplace, setSelectedForReplace] = useState<Video | null>(null);
  const [videoNotes, setVideoNotes] = useState<Record<number, string>>(() => {
    if (videoIdProp || videoIdFromUrl) {
      try {
        const stored = localStorage.getItem(`video-notes-${videoIdProp || videoIdFromUrl}`);
        if (stored) return JSON.parse(stored);
      } catch {}
    }
    return {};
  });
  const [pendingReplacement, setPendingReplacement] = useState<{ video: Video; dayIndex: number } | null>(null);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedSubGenres, setSelectedSubGenres] = useState<string[]>([]);
  const [selectedContentStyle, setSelectedContentStyle] = useState<string>('all');
  const [genreScores, setGenreScores] = useState<Map<string, number>>(new Map());
  const [subGenreScores, setSubGenreScores] = useState<Map<string, number>>(new Map());
  const [availableGenres, setAvailableGenres] = useState<string[]>([]);
  const [availableSubGenres, setAvailableSubGenres] = useState<string[]>([]);
  const [availableContentStyles, setAvailableContentStyles] = useState<string[]>([]);
  const [showMoreExpanded, setShowMoreExpanded] = useState(false);
  const [categorySortModes, setCategorySortModes] = useState<Record<string, CategorySortMode>>({});
  const [categorySortMetrics, setCategorySortMetrics] = useState<Record<string, CategorySortMetric>>({});
  const [aiResponse, setAiResponse] = useState<string>('');
  const [chatIdeas, setChatIdeas] = useState<EnrichedIdea[]>([]);
  const { processMessage: processIdeaMessage, isProcessing: isProcessingIdeas } = useIdeaExtraction();
  
  // Detected content styles from the video analysis
  const [detectedContentStyles, setDetectedContentStyles] = useState<string[]>([]);

  const { updateAnalysis, activeAnalysis, startAnalysis, clearAnalysis } = useAnalysis();
  const { setPlanVideos, registerReplaceHandler } = useContentPlan();

  const SUPABASE_FN_URL = 'https://kxvgbowrkmowuyezoeke.supabase.co/functions/v1/trigger-video-analysis';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4dmdib3dya21vd3V5ZXpvZWtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NjUzMjUsImV4cCI6MjA3MjM0MTMyNX0.jyd5K06zFJv9yK2tj8Pj2oATohbKnMD6hXwit6T50DY';
  const triggerInFlightRef = useRef(false);
  const lastTriggerTimeRef = useRef<number>(0);
  const analysisCompletedRef = useRef(false);
  const hasTriggeredRef = useRef(false);

  // If navigating directly to this page, ensure context is set
  useEffect(() => {
    if (videoId && (!activeAnalysis || activeAnalysis.id !== videoId)) {
      startAnalysis(videoId, 'video');
    }
  }, [videoId, activeAnalysis, startAnalysis]);

  // Sync loading state with context
  useEffect(() => {
    if (!videoId || activeAnalysis?.id !== videoId) return;
    const status = analysisResult?.status === 'completed'
      ? 'completed'
      : loading ? 'processing' : 'idle';
    updateAnalysis({ status, audioInfo: videoInfo, analysisResult });
  }, [videoId, loading, analysisResult, videoInfo, activeAnalysis?.id, updateAnalysis]);

  const triggerAnalysisServerSide = useCallback(async () => {
    if (!videoId || !videoInfo?.video_url || triggerInFlightRef.current) return;
    if (analysisCompletedRef.current) return;

    const now = Date.now();
    if (now - lastTriggerTimeRef.current < 60000) return;

    triggerInFlightRef.current = true;
    lastTriggerTimeRef.current = now;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      console.log('🎬 Triggering video analysis via Edge Function...', { video_id: videoId });

      const res = await fetch(SUPABASE_FN_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ video_id: videoId }),
      });

      if (res.status === 429) {
        toast({ variant: 'destructive', title: 'Weekly analysis limit reached. Upgrade for more.' });
        setLoading(false);
        setLoadError('Weekly analysis limit reached. Upgrade your plan for more analyses.');
        return;
      }

      console.log('✅ Video analysis request sent.');
    } catch (e) {
      console.error('❌ Video analysis trigger error:', e);
    } finally {
      setTimeout(() => { triggerInFlightRef.current = false; }, 30000);
    }
  }, [videoId, videoInfo]);

  // Restore videoNotes from Supabase if localStorage is empty
  useEffect(() => {
    if (!videoId) return;
    const hasLocalNotes = Object.keys(videoNotes).length > 0;
    if (hasLocalNotes) return;

    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const { data: plans } = await supabase
          .from('content_plans')
          .select('plan')
          .eq('user_id', session.user.id);

        const matchingPlan = plans?.find(p => {
          try {
            const d = typeof p.plan === 'string' ? JSON.parse(p.plan) : p.plan;
            return d.audio_id === videoId || d.video_id === videoId;
          } catch { return false; }
        });

        if (matchingPlan) {
          const d = typeof matchingPlan.plan === 'string' ? JSON.parse(matchingPlan.plan) : matchingPlan.plan;
          if (d.videoNotes && Object.keys(d.videoNotes).length > 0) {
            setVideoNotes(d.videoNotes);
            localStorage.setItem(`video-notes-${videoId}`, JSON.stringify(d.videoNotes));
          }
        }
      } catch {}
    })();
  }, [videoId]);

  // Category-organized videos
  const STYLE_CATEGORIES = useMemo(() => ({
    hookStatementVideos: 'hook statement',
    selfiePerformanceVideos: 'selfie performance',
    selfieLipsyncVideos: 'selfie lipsync',
    proCameraLipsyncVideos: 'pro camera lipsync',
    livePerformanceVideos: 'live performance',
    lyricVideoVideos: 'lyric video',
    coverVideos: 'cover',
    memeVideos: 'meme',
    transitionVideos: 'transition',
    fastPaceVideos: 'fast pace',
    productionVideos: 'production',
    compilationVisualsVideos: 'compilation visuals',
    cinematicEditVideos: 'cinematic edit',
    instrumentPerformanceVideos: 'instrument performance',
  }), []);

  const [categoryState, setCategoryState] = useState<Record<string, { videos: Video[]; hasMore: boolean; loading: boolean }>>(() => {
    const initial: Record<string, { videos: Video[]; hasMore: boolean; loading: boolean }> = {};
    Object.keys(STYLE_CATEGORIES).forEach(key => {
      initial[key] = { videos: [], hasMore: false, loading: false };
    });
    return initial;
  });

  const loadMoreForCategory = useCallback(async (categoryKey: string) => {
    const style = STYLE_CATEGORIES[categoryKey as keyof typeof STYLE_CATEGORIES];
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
    } catch (error) {
      console.error(`Error loading more for ${categoryKey}:`, error);
      setCategoryState(prev => ({ ...prev, [categoryKey]: { ...prev[categoryKey], loading: false } }));
    }
  }, [categoryState, selectedGenres, selectedSubGenres, STYLE_CATEGORIES]);

  const [photoCarousels, setPhotoCarousels] = useState<PhotoCarousel[]>([]);

  const [debugData, setDebugData] = useState({
    webhookIds: [] as string[],
    parsedIds: [] as number[],
    fetchedIds: [] as number[],
    missingIds: [] as number[],
    displayedIds: [] as number[],
  });

  useEffect(() => {
    loadAnalysisResults();
  }, [videoId]);

  // Auto-poll while processing
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

      const { data: video, error: videoError } = await supabase
        .from('user_uploaded_videos')
        .select('*')
        .eq('id', videoId)
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (videoError) throw videoError;
      if (!video) { setLoadError('Video record not found. It may still be initializing...'); return; }
      setVideoInfo(video);

      const { data: analysis, error: analysisError } = await supabase
        .from('video_analysis_results')
        .select('*')
        .eq('video_id', videoId)
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (analysisError) throw analysisError;
      if (!analysis) { setLoadError('Analysis record not found yet. It may still be processing...'); return; }
      setAnalysisResult(analysis);

      if (analysis.status === 'completed') {
        analysisCompletedRef.current = true;
        setLoading(false);
        
      }

      const hasResults = Array.isArray(analysis.hooks_captions) && analysis.hooks_captions.length > 0;
      if ((analysis.status === 'processing' || analysis.status === 'pending') && !hasResults) {
        if (!hasTriggeredRef.current) {
          hasTriggeredRef.current = true;
          void triggerAnalysisServerSide();
        }
      }

      // Extract genres
      let extractedGenres: string[] = [];
      let extractedSubGenres: string[] = [];

      extractedGenres = parseGenreJson(analysis.genre);
      if (extractedGenres.length > 0) {
        setGenreScores(parseGenreWithScores(analysis.genre));
      }

      if (extractedGenres.length === 0 && analysis.hooks_captions) {
        const aiText = JSON.stringify(analysis.hooks_captions);
        const genrePatterns = [
          'Pop', 'Hip-Hop', 'R&B', 'Rock', 'Country', 'Electronic', 'Dance',
          'Indie-Pop', 'Dark-pop', 'Singer-Songwriter', 'Alternative', 'Soul',
          'Jazz', 'Folk', 'Reggaeton', 'Latin', 'K-Pop', 'Metal', 'Punk'
        ];
        genrePatterns.forEach(genre => {
          if (aiText.toLowerCase().includes(genre.toLowerCase()) && !extractedGenres.includes(genre)) {
            extractedGenres.push(genre);
          }
        });
      }
      setSelectedGenres(extractedGenres);

      extractedSubGenres = parseGenreJson((analysis as any).sub_genre);
      if (extractedSubGenres.length > 0) {
        setSubGenreScores(parseGenreWithScores((analysis as any).sub_genre));
      }

      if (extractedSubGenres.length === 0 && analysis.hooks_captions) {
        const aiText = JSON.stringify(analysis.hooks_captions);
        const subGenrePatterns = [
          'Dark-pop', 'Synth-pop', 'Indie-pop', 'Dream-pop', 'Electro-pop',
          'Bedroom-pop', 'Alt-pop', 'Art-pop', 'Hyperpop', 'K-pop',
          'Neo-soul', 'Contemporary R&B', 'Alternative R&B',
          'Trap', 'Drill', 'Boom-bap', 'Lo-fi Hip-hop',
          'Indie-rock', 'Alt-rock', 'Pop-rock', 'Soft-rock',
          'House', 'Techno', 'EDM', 'Dubstep', 'Drum and Bass',
          'Acoustic', 'Folk-pop', 'Americana', 'Country-pop',
          'Latin-pop', 'Reggaeton', 'Afrobeats', 'Dancehall'
        ];
        subGenrePatterns.forEach(subGenre => {
          if (aiText.toLowerCase().includes(subGenre.toLowerCase()) && !extractedSubGenres.includes(subGenre)) {
            extractedSubGenres.push(subGenre);
          }
        });
      }
      setSelectedSubGenres(extractedSubGenres);

      // Extract content styles from video_analysis
      if (analysis.hooks_captions) {
        const hookItem = Array.isArray(analysis.hooks_captions) ? analysis.hooks_captions[0] : analysis.hooks_captions;
        const videoAnalysisData = (hookItem as any)?.video_analysis || {};
        if (videoAnalysisData.content_style) {
          try {
            const styleObj = typeof videoAnalysisData.content_style === 'string'
              ? JSON.parse(videoAnalysisData.content_style)
              : videoAnalysisData.content_style;
            if (typeof styleObj === 'object' && !Array.isArray(styleObj)) {
              setDetectedContentStyles(Object.keys(styleObj).slice(0, 5));
            } else if (Array.isArray(styleObj)) {
              setDetectedContentStyles(styleObj.slice(0, 5));
            }
          } catch {
            if (typeof videoAnalysisData.content_style === 'string') {
              setDetectedContentStyles([videoAnalysisData.content_style]);
            }
          }
        }
      }

      if (analysis.status === 'completed') {
        analysisCompletedRef.current = true;
        
        await loadContentPlanVideos(analysis);
        await loadMatchingVideos(extractedGenres, analysis.category_style, analysis.genre, (analysis as any).sub_genre);
      }

    } catch (error) {
      console.error('Error loading analysis:', error);
      setLoadError(error instanceof Error ? error.message : 'Failed to load analysis. Please retry.');
      toast({ title: 'Error loading analysis', description: 'Please try again.', variant: 'destructive' });
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const rerunAnalysis = async () => {
    if (!videoId) return;
    try {
      setIsRerunning(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate('/'); return; }

      await supabase
        .from('video_analysis_results')
        .update({ status: 'pending', hooks_captions: null })
        .eq('video_id', videoId)
        .eq('user_id', session.user.id);

      analysisCompletedRef.current = false;
      hasTriggeredRef.current = false;

      toast({ title: 'Re-running analysis...', description: "This can take a couple minutes. We'll refresh automatically." });
      await triggerAnalysisServerSide();
      await loadAnalysisResults();
    } catch (error) {
      console.error('Re-run error:', error);
      toast({ title: 'Analysis failed', description: error instanceof Error ? error.message : 'Please try again.', variant: 'destructive' });
    } finally {
      setIsRerunning(false);
    }
  };

  // Sync with ContentPlanContext
  useEffect(() => { setPlanVideos(weeklyPlanVideos); }, [weeklyPlanVideos, setPlanVideos]);

  // Register replace handler for AI sidebar
  useEffect(() => {
    const handleReplaceFromAI = (video: Video, dayIndex: number) => {
      setWeeklyPlanVideos(prev => {
        const newPlan = [...prev];
        if (dayIndex >= 0 && dayIndex < newPlan.length) { newPlan[dayIndex] = video; }
        return newPlan;
      });
      setSelectedForReplace(null);
    };
    registerReplaceHandler(handleReplaceFromAI);
    return () => { registerReplaceHandler(null); };
  }, [registerReplaceHandler]);

  // Auto-save plan
  useEffect(() => {
    const autoSavePlan = async () => {
      if (!weeklyPlanVideos || weeklyPlanVideos.length === 0 || !analysisResult || !videoId) return;
      if (lastPlanVideoIds.length > 0) {
        const currentIds = weeklyPlanVideos.map(v => v.id);
        const allMatch = currentIds.every(id => lastPlanVideoIds.includes(id));
        if (!allMatch) return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      try {
        const genreObj = typeof analysisResult.genre === 'string'
          ? JSON.parse(analysisResult.genre.replace(/'/g, '"'))
          : analysisResult.genre;
        const genres = Object.keys(genreObj || {});
        const planName = `Video Plan - ${genres.slice(0, 2).join(', ')} (${new Date().toLocaleDateString()})`;

        const planData = {
          video_id: videoId,
          
          videos: weeklyPlanVideos.map(v => ({
            id: v.id, embedded_ulr: v.embedded_ulr, hook: v.hook, caption: v.caption,
            genre: v.genre, content_style: v.content_style, ai_hook: v.ai_hook, ai_description: v.ai_description
          })),
          genres: analysisResult.genre,
          sub_genres: analysisResult.sub_genre,
          videoNotes: videoNotes
        };

        if (savedPlanId) {
          await supabase.from('content_plans').update({ plan: JSON.stringify(planData), updated_at: new Date().toISOString() }).eq('id', savedPlanId);
          return;
        }

        const { data: existingPlans } = await supabase.from('content_plans').select('id, plan').eq('user_id', session.user.id);
        const existingPlan = existingPlans?.find(p => {
          try {
            const data = typeof p.plan === 'string' ? JSON.parse(p.plan) : p.plan;
            return data.video_id === videoId;
          } catch { return false; }
        });

        if (existingPlan) {
          setSavedPlanId(existingPlan.id);
          await supabase.from('content_plans').update({ plan: JSON.stringify(planData), updated_at: new Date().toISOString() }).eq('id', existingPlan.id);
          setIsInitialPlanLoad(false);
          return;
        }

        const { data: newPlan, error } = await supabase.from('content_plans').insert([{ user_id: session.user.id, name: planName, plan: JSON.stringify(planData) }]).select('id').single();
        if (error) throw error;
        if (newPlan) { setSavedPlanId(newPlan.id); }
        setIsInitialPlanLoad(false);
      } catch (error) {
        console.error('Error auto-saving plan:', error);
      }
    };
    autoSavePlan();
  }, [weeklyPlanVideos, analysisResult, videoId, savedPlanId, lastPlanVideoIds, videoNotes]);

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
              day: index + 1, title: item.title || `Day ${index + 1} Content`,
              action: item.action || '', why_it_works: item.action || item.why_it_works || '',
              video_embed_id: String(item.video_embed_id || item.id || '').trim(),
              hook: item.hook || item.title || '', source: item.source || item.platform || '',
            }));
          }
        } catch (e) { console.warn('Failed to parse hidden_data:', e); }
      }

      if (aiResponseText) {
        let cleanedResponse = aiResponseText.replace(/<hidden_data>[\s\S]*?(<\/hidden_data>|$)/gi, '').trim();
        // Strip search progress / candidate matching text (everything before the --- separator)
        const separatorIndex = cleanedResponse.indexOf('---');
        if (separatorIndex !== -1) {
          cleanedResponse = cleanedResponse.slice(separatorIndex + 3).trim();
        }
        setAiResponse(cleanedResponse);
        setContextMessages([{ role: 'assistant', content: cleanedResponse, isContentPlan: true }]);
      }

      if (!Array.isArray(contentPlan) || contentPlan.length === 0) return;

      interface PlanItem {
        videoId: number; hook?: string; description?: string; isPhotoCarousel: boolean;
        day: number; title?: string; action?: string; whyItWorks?: string;
        platform?: 'tiktok' | 'instagram' | 'unknown'; contentTypePlatform?: string;
      }

      const planData: PlanItem[] = [];
      const rawWebhookIds: string[] = [];

      contentPlan.forEach((item: any, index: number) => {
        const rawVideoEmbed = item.video_embed_id;
        const rawVideoId = item.video_id;
        const rawId = item.id;
        rawWebhookIds.push(String(rawVideoEmbed || rawVideoId || rawId || 'undefined'));

        const vid = parseInt(rawVideoEmbed || rawVideoId || rawId, 10);
        const title = item.title || item.hook || '';
        const action = item.action || item.content_idea || '';
        const whyItWorks = item.why_it_works || '';

        const sourceField = (item.source || item.content_type_and_platform || item.platform || '').toLowerCase();
        let platform: 'tiktok' | 'instagram' | 'unknown' = 'unknown';
        if (sourceField.includes('instagram') || sourceField.includes('reel')) platform = 'instagram';
        else if (sourceField.includes('tiktok')) platform = 'tiktok';

        planData.push({
          videoId: vid, hook: title, description: action || whyItWorks,
          isPhotoCarousel: false, day: item.day || index + 1, title, action, whyItWorks,
          platform, contentTypePlatform: item.source || item.content_type_and_platform || item.platform || '',
        });
      });

      const uniqueVideoIds = [...new Set(planData.map(p => p.videoId).filter(id => !isNaN(id)))];
      const videoIds = planData.map(p => p.videoId).filter(id => !isNaN(id));
      setLastPlanVideoIds(videoIds);
      setWeeklyPlanVideos([]);

      if (uniqueVideoIds.length === 0) return;

      const uniqueContentItems = [...new Map(
        planData.filter(p => !isNaN(p.videoId)).map(p => [p.videoId, { id: p.videoId, platform: p.platform || 'unknown' as const }])
      ).values()];

      const videos = await fetchContentByIdsWithPlatform(uniqueContentItems);
      const videoMap = new Map<number, any>();
      videos?.forEach((video: any) => { videoMap.set(video.id, video); });

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

      const fetchedVideoIds = videos?.map((v: any) => v.id) || [];
      const missingVideoIds = uniqueVideoIds.filter(id => !fetchedVideoIds.includes(id));
      setDebugData({ webhookIds: rawWebhookIds, parsedIds: videoIds, fetchedIds: fetchedVideoIds, missingIds: missingVideoIds, displayedIds: sortedContent.map(v => v.id) });
      setWeeklyPlanVideos(sortedContent);
    } catch (error) {
      console.error('❌ Error loading content plan videos:', error);
    }
  };

  const loadMatchingVideos = async (
    genres: string[], mood?: string, audioGenreData?: string, audioSubGenreData?: string
  ) => {
    try {
      const normalizedGenres = genres.map(g => g.trim().toLowerCase()).filter(g => g);
      const normalizedSubGenres = selectedSubGenres.map(sg => sg.trim().toLowerCase()).filter(sg => sg);

      const [tiktokVideos, reelsVideos] = await Promise.all([
        fetchTikTokVideosWithJoins(500, 0, normalizedGenres, [], 'views', normalizedSubGenres),
        fetchReelsWithJoins(500, 0, normalizedGenres, [], 'views', normalizedSubGenres)
      ]);

      const videos = [
        ...tiktokVideos.map(v => ({ ...v, content_type: 'tiktok' as const })),
        ...reelsVideos.map(v => ({ ...v, content_type: 'reel' as const, is_reel: true }))
      ];

      // Collect available genres
      const genreMap = new Map<string, string>();
      videos?.forEach(video => {
        if (video.genre) {
          try {
            const genreObj = typeof video.genre === 'string' ? JSON.parse(video.genre.replace(/'/g, '"')) : video.genre;
            Object.keys(genreObj || {}).forEach(genre => {
              if (genre) { const lk = genre.toLowerCase(); if (!genreMap.has(lk)) genreMap.set(lk, genre); }
            });
          } catch {
            video.genre.split(/[,/]/).forEach((g: string) => {
              const trimmed = g.trim().replace(/['"{}]/g, '').split(':')[0].trim();
              if (trimmed) { const lk = trimmed.toLowerCase(); if (!genreMap.has(lk)) genreMap.set(lk, trimmed); }
            });
          }
        }
      });
      setAvailableGenres(Array.from(genreMap.values()).sort());

      const filtered = videos;

      // Load GIF thumbnails
      if (filtered.length > 0) {
        const tiktokIds = filtered.filter(v => v.content_type === 'tiktok').map(v => v.id);
        const reelIds = filtered.filter(v => v.content_type === 'reel').map(v => v.id);

        const [tiktokGifs, tiktokNewAssets, reelGifs, reelNewAssets] = await Promise.all([
          tiktokIds.length > 0 ? supabase.from('media_assets_gif_thumbnail').select('video_id, url, thumbnail_url').in('video_id', tiktokIds) : Promise.resolve({ data: [] }),
          tiktokIds.length > 0 ? supabase.from('0.1. Table 4 - Assets - TikTok').select('video_id, thumbnail_url').in('video_id', tiktokIds) : Promise.resolve({ data: [] }),
          reelIds.length > 0 ? supabase.from('media_assets_gif_thumbnail_Reels').select('video_id, url, thumbnail_url').in('video_id', reelIds) : Promise.resolve({ data: [] }),
          reelIds.length > 0 ? supabase.from('0.1. Table 4.2 - Assets - Reels').select('video_id, thumbnail_url').in('video_id', reelIds) : Promise.resolve({ data: [] })
        ]);

        const gifMap = new Map();
        tiktokNewAssets.data?.forEach((a: any) => { if (a.video_id && a.thumbnail_url && a.thumbnail_url.length > 60) gifMap.set(a.video_id, { thumbnail_url: a.thumbnail_url, url: null }); });
        reelNewAssets.data?.forEach((a: any) => { if (a.video_id && a.thumbnail_url && a.thumbnail_url.length > 60) gifMap.set(a.video_id, { thumbnail_url: a.thumbnail_url, url: null }); });
        tiktokGifs.data?.forEach((g: any) => { if (g.video_id && !gifMap.has(g.video_id)) { const u = g.thumbnail_url || g.url; if (u && u.length > 60) gifMap.set(g.video_id, g); } });
        reelGifs.data?.forEach((g: any) => { if (g.video_id && !gifMap.has(g.video_id)) { const u = g.thumbnail_url || g.url; if (u && u.length > 60) gifMap.set(g.video_id, g); } });

        const videosWithGifs = filtered.map(v => ({
          ...v,
          gif_url: gifMap.get(v.id)?.url || null,
          thumbnail_url: gifMap.get(v.id)?.thumbnail_url || null,
          is_reel: v.content_type === 'reel',
          embedded_ulr: (v as any).embedded_ulr || (v as any).embedded_url || v.video_url || null,
          video_url: v.video_url || (v as any).embedded_url || (v as any).embedded_ulr || null,
        }));

        const audioGenreScoresMap = parseGenreWithScores(audioGenreData);
        const audioSubGenreScoresMap = parseGenreWithScores(audioSubGenreData);
        const sortedVideos = sortContentByRelevance(videosWithGifs, audioGenreScoresMap, audioSubGenreScoresMap);

        // Categorize by content_style
        const DISPLAY_LIMIT = INITIAL_ITEMS_PER_CATEGORY;
        const newCategoryState: Record<string, { videos: Video[]; hasMore: boolean; loading: boolean }> = {};
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
          const matched = sortedVideos.filter(v => styles.some(style => v.content_style?.toLowerCase().includes(style.toLowerCase())));
          newCategoryState[key] = { videos: matched.slice(0, DISPLAY_LIMIT), hasMore: matched.length >= DISPLAY_LIMIT, loading: false };
        });
        setCategoryState(newCategoryState);

        const styleSet = new Set<string>();
        sortedVideos.forEach(v => {
          if (v.content_style) {
            v.content_style.replace(/[\[\]"'{}]/g, '').split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0).forEach((s: string) => styleSet.add(s));
          }
        });
        setAvailableContentStyles(Array.from(styleSet).sort());
      }

      // Photo carousels
      const { data: carousels } = await supabase.from('tiktok_photo_carousel').select('*').order('outliar_score', { ascending: false }).limit(500);
      if (carousels) {
        let filteredCarousels = carousels;
        const normalizedG = genres.map(g => g.trim().toLowerCase());
        if (normalizedG.length > 0) {
          filteredCarousels = carousels.filter(c => {
            const cg = parseGenreJson(c.genre);
            return normalizedG.some(sg => cg.some(cgen => cgen.toLowerCase() === sg));
          });
        }
        const audioGS = parseGenreWithScores(audioGenreData);
        const audioSGS = parseGenreWithScores(audioSubGenreData);
        setPhotoCarousels(sortContentByRelevance(filteredCarousels, audioGS, audioSGS));
      }
    } catch (error) {
      console.error('Error loading matching videos:', error);
    }
  };

  const totalVideos = useMemo(() => Object.values(categoryState).reduce((sum, cat) => sum + cat.videos.length, 0), [categoryState]);

  const allMatchedVideos = useMemo(() => {
    const combined = Object.values(categoryState).flatMap(cat => cat.videos);
    if (combined.length === 0 && weeklyPlanVideos.length > 0) return weeklyPlanVideos;
    return sortContentByRelevance(combined, genreScores, subGenreScores);
  }, [categoryState, genreScores, subGenreScores, weeklyPlanVideos]);

  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);

  const handleVideoClick = useCallback((video: Video) => {
    setSelectedVideo(video);
    setIsVideoModalOpen(true);
  }, []);

  const handleReplaceInPlan = useCallback((video: Video, dayIndex: number) => {
    const videoToReplace = weeklyPlanVideos[dayIndex];
    if (videoToReplace && videoNotes[videoToReplace.id]?.trim()) {
      setPendingReplacement({ video, dayIndex });
    } else {
      setWeeklyPlanVideos(prev => { const n = [...prev]; n[dayIndex] = video; return n; });
      setSelectedForReplace(null);
    }
  }, [weeklyPlanVideos, videoNotes]);

  const confirmReplacement = () => {
    if (pendingReplacement) {
      const { video, dayIndex } = pendingReplacement;
      const videoToReplace = weeklyPlanVideos[dayIndex];
      if (videoToReplace) {
        setVideoNotes(prev => { const n = { ...prev }; delete n[videoToReplace.id]; return n; });
      }
      setWeeklyPlanVideos(prev => { const n = [...prev]; n[dayIndex] = video; return n; });
      setSelectedForReplace(null);
      setPendingReplacement(null);
    }
  };

  const cancelReplacement = () => { setPendingReplacement(null); };

  const handlePhotoCarouselClick = useCallback((carousel: PhotoCarousel) => {
    const url = carousel.embedded_url || carousel.photo_url_1;
    const postIdMatch = url?.match(/\/(?:video|photo)\/(\d+)/);
    const postId = postIdMatch?.[1];
    const playerSrc = postId ? `https://www.tiktok.com/player/v1/${postId}?music_info=1&description=1&controls=1&volume_control=1` : null;

    const carouselAsVideo: Video = {
      id: carousel.id, video_url: carousel.embedded_url || '', embedded_ulr: carousel.embedded_url,
      outliar_score: carousel.outliar_score || 0, video_views: carousel.photo_views || 0,
      video_likes: carousel.photo_likes || 0, comments: carousel.comments || '',
      profile_followers: carousel.profile_followers || 0, caption: carousel.caption,
      hook: carousel.Hook, who: carousel["who?"], genre: carousel.genre, sub_genre: carousel.sub_genre,
      content_style: carousel.content_style, audience: carousel.Audience, gender: carousel.gender,
      date_posted: carousel.date_posted, Artist: carousel.artist, profile_bio: carousel.profile_bio,
      gif_url: null, thumbnail_url: carousel.photo_url_1 || null, isPhotoCarousel: true,
      postUrl: playerSrc || url || '',
    };
    setSelectedVideo(carouselAsVideo);
    setIsVideoModalOpen(true);
  }, []);

  // Reload when genres change
  useEffect(() => {
    if (selectedGenres.length > 0 && analysisResult) {
      loadMatchingVideos(selectedGenres, analysisResult.category_style, analysisResult.genre, (analysisResult as any).sub_genre);
    }
  }, [selectedGenres]);

  const handleRemoveGenre = useCallback((g: string) => {
    const u = selectedGenres.filter(x => x !== g);
    if (u.length > 0) setSelectedGenres(u);
  }, [selectedGenres]);

  const handleAddGenre = useCallback((g: string) => {
    if (!selectedGenres.includes(g)) setSelectedGenres([...selectedGenres, g]);
  }, [selectedGenres]);

  // --- RENDER ---

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[80vh]">
          <div className="text-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin mx-auto text-sky-500" />
            <p className="text-lg text-muted-foreground">Loading video analysis results...</p>
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
              <h2 className="text-xl font-semibold mb-2">Analysis is being prepared</h2>
              <p className="text-muted-foreground">{loadError || 'Your analysis is still processing.'}</p>
              <p className="text-sm text-muted-foreground/70 mt-2">Auto-refreshing every 5 seconds...</p>
            </div>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => { setLoadError(null); loadAnalysisResults(); }} className="gap-2">
                <RefreshCw className="w-4 h-4" />Retry Now
              </Button>
              <Button variant="outline" onClick={() => navigate('/create')}>Go Back</Button>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (analysisResult?.status === 'processing' || analysisResult?.status === 'pending') {
    const handleCancel = () => {
      clearAnalysis();
      navigate('/create');
    };
    return <AppLayout><AnalysisLoadingAnimation contained mode="video" onCancel={handleCancel} /></AppLayout>;
  }

  return (
    <AppLayout>
      <div className="max-w-[1800px] mx-auto px-4 py-8">
        <div className="mb-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-sky-500/10 rounded-lg">
                <Sparkles className="w-5 h-5 text-sky-500 animate-pulse" />
              </div>
              <h2 className="text-2xl font-bold">Video Analysis Complete</h2>
            </div>
          </div>

          <Card className="p-6 bg-card/80 border-white/[0.02]">
            <div className="flex flex-col gap-6">
              {/* Video Player */}
              {videoInfo?.video_url && (
                <div className="pb-4 border-b border-border/30">
                  <div className="flex items-center gap-2 mb-1">
                    <Film className="w-4 h-4 text-sky-500/70" />
                    <span className="text-sm font-medium text-muted-foreground">Your Video</span>
                  </div>
                  <div className="w-full flex justify-center">
                    <video
                      controls
                      className="rounded-lg max-h-[400px]"
                      style={{ aspectRatio: '9/16' }}
                      src={videoInfo.video_url}
                    >
                      Your browser does not support the video element.
                    </video>
                  </div>
                </div>
              )}

              {/* Hero Summary Card - Always visible */}
              {aiResponse && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="rounded-xl bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10 border border-blue-200/40 dark:border-blue-800/30 p-5"
                >
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                    <p className="text-sm text-foreground/80 leading-relaxed">{aiResponse}</p>
                  </div>
                </motion.div>
              )}

              {/* Genre Section */}
              <div className="flex items-start gap-6 flex-wrap">
                <div className="flex items-center gap-3 flex-wrap">
                  <Film className="w-5 h-5 text-sky-500" />
                  <span className="text-lg font-bold">Genre:</span>
                  <div className="flex flex-wrap items-center gap-2">
                    {selectedGenres.length > 0 ? (
                      selectedGenres.map((genre, index) => {
                        const score = genreScores.get(genre.toLowerCase()) || genreScores.get(genre);
                        const colors = getGenreColor(genre);
                        return (
                          <Badge key={index} className="px-3 py-1 text-sm gap-1.5 cursor-pointer hover:opacity-80 border"
                            style={{ backgroundColor: colors.bg, color: colors.text, borderColor: colors.border }}
                            onClick={() => handleRemoveGenre(genre)}>
                            {genre}
                            {score && <span className="text-xs opacity-70 ml-1">{(score * 10).toFixed(1)}</span>}
                            <X className="w-3 h-3" />
                          </Badge>
                        );
                      })
                    ) : (
                      <span className="text-base text-muted-foreground">Detected from AI response</span>
                    )}
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="sm" className="w-6 h-6 rounded-full bg-muted/50 hover:bg-muted p-0">
                          <Plus className="w-3 h-3" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-4" align="start">
                        <div className="space-y-2">
                          <p className="text-sm font-medium mb-3">Add more genres</p>
                          <div className="max-h-64 overflow-y-auto space-y-2">
                            {availableGenres.filter(g => !selectedGenres.includes(g)).map(genre => (
                              <div key={genre} className="flex items-center space-x-2 hover:bg-accent p-2 rounded cursor-pointer" onClick={() => handleAddGenre(genre)}>
                                <Checkbox checked={false} onCheckedChange={() => handleAddGenre(genre)} />
                                <label className="text-sm cursor-pointer flex-1">{genre}</label>
                              </div>
                            ))}
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Sub-Genre */}
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-lg font-bold">Sub-Genre:</span>
                  <div className="flex flex-wrap items-center gap-2">
                    {selectedSubGenres.length > 0 ? (
                      selectedSubGenres.map((subGenre, index) => {
                        const score = subGenreScores.get(subGenre.toLowerCase()) || subGenreScores.get(subGenre);
                        const colors = getGenreColor(subGenre);
                        return (
                          <Badge key={index} className="px-3 py-1 text-sm border"
                            style={{ backgroundColor: colors.bg, color: colors.text, borderColor: colors.border }}>
                            {subGenre}
                            {score && <span className="text-xs opacity-70 ml-1">{(score * 10).toFixed(1)}</span>}
                          </Badge>
                        );
                      })
                    ) : (
                      <span className="text-base text-muted-foreground">N/A</span>
                    )}
                  </div>
                </div>

                {/* Detected Content Styles */}
                {detectedContentStyles.length > 0 && (
                  <div className="flex items-center gap-3 flex-wrap">
                    <Eye className="w-5 h-5 text-sky-500" />
                    <span className="text-lg font-bold">Visual Style:</span>
                    <div className="flex flex-wrap items-center gap-2">
                      {detectedContentStyles.map((style, index) => (
                        <Badge key={index} variant="outline" className="px-3 py-1 text-sm border-sky-500/30 bg-sky-500/5 text-sky-600 dark:text-sky-400">
                          {style}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {showMoreExpanded && <VideoAnalysisOverview analysisData={analysisResult} />}
          </Card>

          <div className="flex justify-center mt-4">
            <Button variant="ghost" className="text-sm text-muted-foreground hover:text-foreground" onClick={() => setShowMoreExpanded(!showMoreExpanded)}>
              {showMoreExpanded ? 'Show less' : 'Show full analysis'}
            </Button>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="flex gap-6">
          <div className="flex-1 min-w-0">
            {/* Weekly Content Plan */}
            {(weeklyPlanVideos.length > 0 || totalVideos > 0) && (
              <Card className="p-4 bg-card/80 border-white/[0.02] mb-6">
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
                    setVideoNotes(prev => {
                      const updated = { ...prev, [vid]: notes };
                      if (videoId) { try { localStorage.setItem(`video-notes-${videoId}`, JSON.stringify(updated)); } catch {} }
                      return updated;
                    });
                  }}
                  onAskAI={(video) => { sendVideoToAI(video); openSidebar(); }}
                  onAskAIAboutPlan={() => {
                    if (analysisResult && weeklyPlanVideos.length > 0) {
                      sendPlanToAI({
                        analysisResult,
                        planVideos: weeklyPlanVideos,
                        genres: selectedGenres,
                        subGenres: selectedSubGenres,
                      });
                      openSidebar();
                    }
                  }}
                />
              </Card>
            )}

            {/* Idea Deck */}
            {(chatIdeas.length > 0 || isProcessingIdeas) && (
              <Card className="mb-6 overflow-hidden border-sky-500/20">
                <IdeaDeck ideas={chatIdeas} isProcessing={isProcessingIdeas} onClear={() => setChatIdeas([])} onRemoveIdea={(id) => setChatIdeas(prev => prev.filter(i => i.id !== id))} className="max-h-[500px]" />
              </Card>
            )}

            <div className="bg-background -mx-4 px-4 pt-12 pb-8 rounded-lg border-t border-border/20">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold">Viral videos found matching your niche 🚀</h2>
                  <p className="text-sm text-muted-foreground mt-1">Curated videos that match your genre & content style</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground"><Filter className="w-4 h-4" /><span>Filter</span></div>
                  <Select value={selectedContentStyle} onValueChange={setSelectedContentStyle}>
                    <SelectTrigger className={`w-[180px] h-9 text-sm ${selectedContentStyle !== 'all' ? 'border-sky-500/50 bg-sky-500/5' : ''}`}>
                      <SelectValue placeholder="Content Style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Content Styles</SelectItem>
                      {availableContentStyles.map(style => <SelectItem key={style} value={style}>{style}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {selectedContentStyle !== 'all' && (
                    <Button variant="ghost" size="sm" onClick={() => setSelectedContentStyle('all')} className="h-9 gap-1.5 text-muted-foreground hover:text-foreground">
                      <RotateCcw className="w-3.5 h-3.5" />Reset
                    </Button>
                  )}
                </div>
              </div>

              {totalVideos > 0 || photoCarousels.length > 0 ? (
                <CategorySectionList
                  viralRightNowVideos={{ videos: [], photoCarousels: [], loading: false, hasMore: false, loadMore: async () => {} }}
                  viralRightNowReels={{ videos: [], photoCarousels: [], loading: false, hasMore: false, loadMore: async () => {} }}
                  viralPhotoCarousels={{ videos: [], photoCarousels: photoCarousels, loading: false, hasMore: false, loadMore: async () => {} }}
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
                  handlePhotoCarouselClick={handlePhotoCarouselClick}
                  filterCategoryVideos={(videos) => {
                    if (selectedContentStyle === 'all') return videos;
                    return videos.filter(v => v.content_style?.toLowerCase().includes(selectedContentStyle.toLowerCase()));
                  }}
                  filterCategoryPhotoCarousels={(carousels) => {
                    if (selectedContentStyle === 'all') return carousels;
                    return carousels.filter(c => c.content_style?.toLowerCase().includes(selectedContentStyle.toLowerCase()));
                  }}
                  activeContentStyleFilter={selectedContentStyle !== 'all' ? [selectedContentStyle] : []}
                  sortModes={categorySortModes}
                  onSortModeChange={(categoryId, mode) => setCategorySortModes(prev => ({ ...prev, [categoryId]: mode }))}
                  sortMetrics={categorySortMetrics}
                  onSortMetricChange={(categoryId, metric) => setCategorySortMetrics(prev => ({ ...prev, [categoryId]: metric }))}
                  showReplaceMode={true}
                  onReplaceInPlan={handleReplaceInPlan}
                  currentPlanVideos={weeklyPlanVideos}
                  selectedForReplace={selectedForReplace}
                  onSelectForReplace={setSelectedForReplace}
                  onAskAI={(video) => { sendVideoToAI(video); openSidebar(); }}
                />
              ) : (
                <Card className="p-12 text-center">
                  <p className="text-muted-foreground">No matching videos found. Try different content!</p>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Video Details Modal */}
      {selectedVideo && (
        <VideoDetailsModal video={selectedVideo} isOpen={isVideoModalOpen}
          onClose={() => { setIsVideoModalOpen(false); setSelectedVideo(null); }}
          showReplaceMode={true}
          onReplaceInPlan={(dayIndex) => selectedVideo && handleReplaceInPlan(selectedVideo, dayIndex)}
          currentPlanVideos={weeklyPlanVideos} selectedForReplace={selectedForReplace} onSelectForReplace={setSelectedForReplace} />
      )}

      {/* Photo Carousel Modal */}
      {selectedPhotoCarousel && (
        <PhotoCarouselModal photoCarousel={selectedPhotoCarousel} isOpen={isPhotoModalOpen}
          onClose={() => { setIsPhotoModalOpen(false); setSelectedPhotoCarousel(null); }} />
      )}

      {/* Replacement Confirmation Dialog */}
      <AlertDialog open={pendingReplacement !== null} onOpenChange={(open) => !open && cancelReplacement()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Replace video with notes?</AlertDialogTitle>
            <AlertDialogDescription>This video has notes written for it. If you replace it, the notes will be deleted.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelReplacement}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmReplacement}>Replace Video</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Floating Ask AI Button */}
      {!isSidebarOpen && (
        <button onClick={() => openSidebar()}
          className="fixed right-6 top-1/2 -translate-y-1/2 z-40 group flex items-center gap-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-r from-sky-500 to-blue-500 text-white pl-4 pr-3 py-3">
          <Sparkles className="w-4 h-4" />
          <span className="font-medium text-sm">Ask AI</span>
          <ChevronRight className="w-4 h-4 opacity-70 group-hover:translate-x-0.5 transition-transform" />
        </button>
      )}
    </AppLayout>
  );
};

export default AnalyzeVideoWorkspace;