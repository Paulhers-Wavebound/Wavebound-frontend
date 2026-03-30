import React, { createContext, useContext, useState, useCallback, ReactNode, useRef } from 'react';

export type AnalysisStatus = 'idle' | 'uploading' | 'processing' | 'completed' | 'error';

interface ActiveAnalysis {
  id: string;
  type: 'audio' | 'video';
  status: AnalysisStatus;
  startedAt: number;
  audioInfo?: any;
  analysisResult?: any;
  error?: string;
}

interface AnalysisContextValue {
  // Active analysis session
  activeAnalysis: ActiveAnalysis | null;
  
  // Start a new analysis (called from Create page after upload)
  startAnalysis: (id: string, type: 'audio' | 'video') => void;
  
  // Update analysis status/data (called from workspace as polling updates)
  updateAnalysis: (updates: Partial<ActiveAnalysis>) => void;
  
  // Clear analysis (when user explicitly closes or navigates away permanently)
  clearAnalysis: () => void;
  
  // Check if we should show the keep-alive workspace
  hasActiveAnalysis: boolean;
  
  // Navigate to the active analysis workspace
  navigateToAnalysis: () => string | null;
  
  // Track if the workspace has been mounted (to prevent re-initialization)
  workspaceMountedRef: React.MutableRefObject<boolean>;
}

const AnalysisContext = createContext<AnalysisContextValue | undefined>(undefined);

interface AnalysisProviderProps {
  children: ReactNode;
}

export function AnalysisProvider({ children }: AnalysisProviderProps) {
  const [activeAnalysis, setActiveAnalysis] = useState<ActiveAnalysis | null>(() => {
    // Restore from sessionStorage on mount
    try {
      const stored = sessionStorage.getItem('active_analysis');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Only restore if it's recent (within last 30 minutes)
        if (parsed.startedAt && Date.now() - parsed.startedAt < 30 * 60 * 1000) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return null;
  });
  
  const workspaceMountedRef = useRef(false);

  // Persist to sessionStorage when active analysis changes
  const persistAnalysis = useCallback((analysis: ActiveAnalysis | null) => {
    try {
      if (analysis) {
        sessionStorage.setItem('active_analysis', JSON.stringify(analysis));
      } else {
        sessionStorage.removeItem('active_analysis');
      }
    } catch {
      // ignore
    }
  }, []);

  const startAnalysis = useCallback((id: string, type: 'audio' | 'video') => {
    const newAnalysis: ActiveAnalysis = {
      id,
      type,
      status: 'uploading',
      startedAt: Date.now(),
    };
    setActiveAnalysis(newAnalysis);
    persistAnalysis(newAnalysis);
    workspaceMountedRef.current = false; // Reset mount flag for new analysis
  }, [persistAnalysis]);

  const updateAnalysis = useCallback((updates: Partial<ActiveAnalysis>) => {
    setActiveAnalysis(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      persistAnalysis(updated);
      return updated;
    });
  }, [persistAnalysis]);

  const clearAnalysis = useCallback(() => {
    setActiveAnalysis(null);
    persistAnalysis(null);
    workspaceMountedRef.current = false;
  }, [persistAnalysis]);

  const hasActiveAnalysis = activeAnalysis !== null;

  const navigateToAnalysis = useCallback(() => {
    if (!activeAnalysis) return null;
    // Only resume if analysis is still in progress (not completed/error/idle)
    if (activeAnalysis.status === 'completed' || activeAnalysis.status === 'error' || activeAnalysis.status === 'idle') {
      return null;
    }
    return activeAnalysis.type === 'audio' 
      ? `/analyze-audio/${activeAnalysis.id}`
      : `/analyze-video/${activeAnalysis.id}`;
  }, [activeAnalysis]);

  return (
    <AnalysisContext.Provider
      value={{
        activeAnalysis,
        startAnalysis,
        updateAnalysis,
        clearAnalysis,
        hasActiveAnalysis,
        navigateToAnalysis,
        workspaceMountedRef,
      }}
    >
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysis() {
  const context = useContext(AnalysisContext);
  if (!context) {
    throw new Error('useAnalysis must be used within an AnalysisProvider');
  }
  return context;
}
