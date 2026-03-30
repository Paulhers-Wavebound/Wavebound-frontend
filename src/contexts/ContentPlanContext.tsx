import React, { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';
import { Video } from '@/types/content';

type ReplaceHandler = (video: Video, dayIndex: number) => void;

interface ContentPlanContextValue {
  // The current 7-day content plan (synced from workspace)
  planVideos: Video[];
  setPlanVideos: (videos: Video[]) => void;
  
  // Whether a content plan is active (analysis is loaded)
  hasPlan: boolean;
  
  // Register a handler for video replacements (called by workspace)
  registerReplaceHandler: (handler: ReplaceHandler | null) => void;
  
  // Replace a video at a specific day index (called by day selector)
  replaceVideoAtDay: (video: Video, dayIndex: number) => void;
  
  // Open day selector dialog with a video to add
  videoToAdd: Video | null;
  openDaySelector: (video: Video) => void;
  closeDaySelector: () => void;
}

const ContentPlanContext = createContext<ContentPlanContextValue | undefined>(undefined);

interface ContentPlanProviderProps {
  children: ReactNode;
}

export function ContentPlanProvider({ children }: ContentPlanProviderProps) {
  const [planVideos, setPlanVideosState] = useState<Video[]>([]);
  const [videoToAdd, setVideoToAdd] = useState<Video | null>(null);
  const replaceHandlerRef = useRef<ReplaceHandler | null>(null);

  const hasPlan = planVideos.length > 0;

  const setPlanVideos = useCallback((videos: Video[]) => {
    setPlanVideosState(videos);
  }, []);

  const registerReplaceHandler = useCallback((handler: ReplaceHandler | null) => {
    replaceHandlerRef.current = handler;
  }, []);

  const replaceVideoAtDay = useCallback((video: Video, dayIndex: number) => {
    // Call the registered handler (from workspace) if available
    if (replaceHandlerRef.current) {
      replaceHandlerRef.current(video, dayIndex);
    }
    // Always update the context state so the plan reflects the change
    setPlanVideosState(prev => {
      if (prev.length === 0 || dayIndex < 0 || dayIndex >= prev.length) return prev;
      const updated = [...prev];
      updated[dayIndex] = video;
      return updated;
    });
  }, []);

  const openDaySelector = useCallback((video: Video) => {
    setVideoToAdd(video);
  }, []);

  const closeDaySelector = useCallback(() => {
    setVideoToAdd(null);
  }, []);

  return (
    <ContentPlanContext.Provider
      value={{
        planVideos,
        setPlanVideos,
        hasPlan,
        registerReplaceHandler,
        replaceVideoAtDay,
        videoToAdd,
        openDaySelector,
        closeDaySelector,
      }}
    >
      {children}
    </ContentPlanContext.Provider>
  );
}

export function useContentPlan() {
  const context = useContext(ContentPlanContext);
  if (!context) {
    throw new Error('useContentPlan must be used within a ContentPlanProvider');
  }
  return context;
}
