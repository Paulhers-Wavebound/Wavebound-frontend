import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Video } from '@/types/content';

interface VideoForAI {
  video: Video;
  prompt?: string;
}

interface PlanForAI {
  analysisResult: any;
  planVideos: Video[];
  genres: string[];
  subGenres: string[];
}

interface DiscoverContextValue {
  // Video sent to AI panel
  videoForAI: VideoForAI | null;
  sendVideoToAI: (video: Video, prompt?: string) => void;
  clearVideoForAI: () => void;
  
  // Persistent active video context (survives mount/unmount)
  activeVideoContext: VideoForAI | null;
  setActiveVideoContext: (ctx: VideoForAI | null) => void;
  clearActiveVideoContext: () => void;
  
  // Plan sent to AI panel
  planForAI: PlanForAI | null;
  sendPlanToAI: (data: PlanForAI) => void;
  clearPlanForAI: () => void;
  
  // "Show More Like This" triggers filter application
  filterFromVideo: Video | null;
  showMoreLikeThis: (video: Video) => void;
  clearFilterFromVideo: () => void;
  
  // Control AI panel visibility
  openAIPanel: () => void;
  isAIPanelOpen: boolean;
  setAIPanelOpen: (open: boolean) => void;
  
  // Drop zone state for visual feedback
  isDraggingToAI: boolean;
  setIsDraggingToAI: (dragging: boolean) => void;
  
  // Active genre filters from the Discover page
  activeGenreFilters: string[];
  setActiveGenreFilters: (genres: string[]) => void;
}

const DiscoverContext = createContext<DiscoverContextValue | undefined>(undefined);

interface DiscoverProviderProps {
  children: ReactNode;
}

export function DiscoverProvider({ children }: DiscoverProviderProps) {
  const [videoForAI, setVideoForAI] = useState<VideoForAI | null>(null);
  const [activeVideoContext, setActiveVideoContextState] = useState<VideoForAI | null>(null);
  const [planForAI, setPlanForAIState] = useState<PlanForAI | null>(null);
  const [filterFromVideo, setFilterFromVideo] = useState<Video | null>(null);
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(() => {
    try {
      return sessionStorage.getItem('discover_ai_panel_open') === '1';
    } catch {
      return false;
    }
  });
  const [isDraggingToAI, setIsDraggingToAI] = useState(false);
  const [activeGenreFilters, setActiveGenreFilters] = useState<string[]>([]);

  const sendVideoToAI = useCallback((video: Video, prompt?: string) => {
    const ctx = { video, prompt };
    setVideoForAI(ctx);
    setActiveVideoContextState(ctx);
    setIsAIPanelOpen(true);
  }, []);

  const setActiveVideoContext = useCallback((ctx: VideoForAI | null) => {
    setActiveVideoContextState(ctx);
  }, []);

  const clearActiveVideoContext = useCallback(() => {
    setVideoForAI(null);
    setActiveVideoContextState(null);
  }, []);

  const clearVideoForAI = useCallback(() => {
    setVideoForAI(null);
  }, []);

  const sendPlanToAI = useCallback((data: PlanForAI) => {
    setPlanForAIState(data);
    setIsAIPanelOpen(true);
  }, []);

  const clearPlanForAI = useCallback(() => {
    setPlanForAIState(null);
  }, []);

  const showMoreLikeThis = useCallback((video: Video) => {
    setFilterFromVideo(video);
  }, []);

  const clearFilterFromVideo = useCallback(() => {
    setFilterFromVideo(null);
  }, []);

  const openAIPanel = useCallback(() => {
    setIsAIPanelOpen(true);
  }, []);

  const setAIPanelOpen = useCallback((open: boolean) => {
    setIsAIPanelOpen(open);
    try {
      sessionStorage.setItem('discover_ai_panel_open', open ? '1' : '0');
    } catch {
      // ignore
    }
  }, []);

  return (
    <DiscoverContext.Provider
      value={{
        videoForAI,
        sendVideoToAI,
        clearVideoForAI,
        activeVideoContext,
        setActiveVideoContext,
        clearActiveVideoContext,
        planForAI,
        sendPlanToAI,
        clearPlanForAI,
        filterFromVideo,
        showMoreLikeThis,
        clearFilterFromVideo,
        openAIPanel,
        isAIPanelOpen,
        setAIPanelOpen,
        isDraggingToAI,
        setIsDraggingToAI,
        activeGenreFilters,
        setActiveGenreFilters,
      }}
    >
      {children}
    </DiscoverContext.Provider>
  );
}

export function useDiscover() {
  const context = useContext(DiscoverContext);
  if (!context) {
    throw new Error('useDiscover must be used within a DiscoverProvider');
  }
  return context;
}

/**
 * Extracts structured video metadata for AI consumption.
 * Excludes media URLs and focuses on semantic attributes.
 */
export function extractVideoMetadataForAI(video: Video): Record<string, unknown> {
  return {
    id: video.id,
    // Performance metrics
    views: video.video_views,
    likes: video.video_likes,
    viral_score: video.outliar_score,
    performance_multiplier: video.performance_multiplier,
    profile_followers: video.profile_followers,
    
    // Content categorization
    genre: video.genre,
    sub_genre: video.sub_genre,
    content_style: video.content_style,
    
    // Content details
    hook: video.hook,
    caption: video.caption,
    
    // Creator info
    artist: video.Artist,
    gender: video.gender,
    audience: video.audience,
    
    // Temporal
    date_posted: video.date_posted,
    
    // Platform
    is_reel: video.is_reel,
    
    // AI-generated insights (if available)
    ai_hook: video.ai_hook,
    ai_description: video.ai_description,
    ai_content_category: video.ai_content_category,
    ai_effort: video.ai_effort,
    
    // Visual AI table fields
    context: video.context,
    description: video.description,
    sub_style: video.sub_style,
    label_reasons: video.label_reasons,
  };
}

/**
 * Formats video metadata as a structured prompt context for the AI.
 */
export function formatVideoForAIPrompt(video: Video): string {
  const metadata = extractVideoMetadataForAI(video);
  
  // Clean undefined values
  const cleaned = Object.fromEntries(
    Object.entries(metadata).filter(([_, v]) => v !== undefined && v !== null && v !== '')
  );
  
  return `<video_context>
${JSON.stringify(cleaned, null, 2)}
</video_context>`;
}
