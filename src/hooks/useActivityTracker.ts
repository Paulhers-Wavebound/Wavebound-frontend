import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

const DEDUPE_WINDOW_MS = 2000;

export function useActivityTracker() {
  const lastEvent = useRef<{ action: string; time: number }>({ action: '', time: 0 });

  const trackActivity = useCallback(async (action: string, metadata?: Record<string, any>) => {
    try {
      // Deduplicate rapid-fire events
      const now = Date.now();
      if (action === lastEvent.current.action && now - lastEvent.current.time < DEDUPE_WINDOW_MS) {
        return;
      }
      lastEvent.current = { action, time: now };

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('user_activity').insert({
        user_id: user.id,
        action,
        metadata: metadata ?? {},
      });
    } catch {
      // Silently fail - activity tracking should never break the app
    }
  }, []);

  return { trackActivity };
}
