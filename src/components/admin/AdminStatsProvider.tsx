import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

const BATCH_ACTIONS = [
  'active_now', 'overview', 'signup_growth', 'user_breakdown',
  'funnel', 'retention', 'top_users', 'power_users',
  'activity_feed', 'daily_usage',
] as const;

type ActionName = (typeof BATCH_ACTIONS)[number];

interface AdminStatsContextValue {
  data: Record<string, any>;
  loading: boolean;
  error: string | null;
  failedActions: Set<string>;
  refresh: () => void;
  refreshAction: (action: ActionName, filters?: Record<string, any>) => Promise<any>;
}

const AdminStatsContext = createContext<AdminStatsContextValue | null>(null);

export function AdminStatsProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [failedActions, setFailedActions] = useState<Set<string>>(new Set());
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      const failed = new Set<string>();
      const results = await Promise.allSettled(
        BATCH_ACTIONS.map(async (action) => {
          const { data: r, error: fnError } = await supabase.functions.invoke('admin-stats', {
            body: { action },
          });
          if (fnError) throw fnError;
          return [action, r] as const;
        })
      );
      const combined: Record<string, any> = {};
      results.forEach((result, i) => {
        if (result.status === 'fulfilled') {
          combined[result.value[0]] = result.value[1];
        } else {
          failed.add(BATCH_ACTIONS[i]);
        }
      });
      setData(combined);
      setFailedActions(failed);
      if (failed.size === BATCH_ACTIONS.length) {
        setError('Failed to fetch all stats');
      }
      setLoading(false);
    };
    fetchAll();
  }, [refreshKey]);

  const refresh = useCallback(() => setRefreshKey(k => k + 1), []);

  const refreshAction = useCallback(async (action: ActionName, filters?: Record<string, any>) => {
    const { data: result, error: fnError } = await supabase.functions.invoke('admin-stats', {
      body: { action, filters },
    });
    if (fnError) throw fnError;
    setData(prev => ({ ...prev, [action]: result }));
    return result;
  }, []);

  return (
    <AdminStatsContext.Provider value={{ data, loading, error, failedActions, refresh, refreshAction }}>
      {children}
    </AdminStatsContext.Provider>
  );
}

export function useAdminStatsSlice<T = any>(action: string): { data: T | null; loading: boolean; error: string | null } {
  const ctx = useContext(AdminStatsContext);
  if (!ctx) throw new Error('useAdminStatsSlice must be used within AdminStatsProvider');
  return {
    data: (ctx.data[action] as T) ?? null,
    loading: ctx.loading,
    error: ctx.error,
  };
}

export function useAdminStatsRefresh() {
  const ctx = useContext(AdminStatsContext);
  if (!ctx) throw new Error('useAdminStatsRefresh must be used within AdminStatsProvider');
  return { refresh: ctx.refresh, refreshAction: ctx.refreshAction };
}
