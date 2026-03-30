import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useAdminStats<T = any>(action: string, filters?: Record<string, any>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: result, error: fnError } = await supabase.functions.invoke('admin-stats', {
          body: { action, filters },
        });
        if (fnError) throw fnError;
        setData(result as T);
      } catch (e: any) {
        setError(e.message || 'Failed to fetch stats');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [action, JSON.stringify(filters)]);

  return { data, loading, error };
}
