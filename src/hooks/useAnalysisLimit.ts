import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const MAX_ANALYSES = 10;

export type AnalysisType = 'content' | 'profile';

export const useAnalysisLimit = (analysisType: AnalysisType) => {
  const [usageCount, setUsageCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUsage = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setIsLoading(false);
        return;
      }

      const { count, error } = await supabase
        .from('user_analysis_usage')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('analysis_type', analysisType);

      if (!error && count !== null) {
        setUsageCount(count);
      }
      setIsLoading(false);
    };

    checkUsage();
  }, [analysisType]);

  return {
    usageCount,
    isLoading,
    maxAnalyses: MAX_ANALYSES,
  };
};
