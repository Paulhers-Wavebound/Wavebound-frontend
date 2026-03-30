import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const BACKFILL_FLAG = 'wavebound_profile_backfilled';
const PREFS_KEY = 'wavebound_user_preferences_v6';

export function useProfileBackfill() {
  useEffect(() => {
    if (sessionStorage.getItem(BACKFILL_FLAG)) return;

    const run = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check multiple localStorage key patterns
      const userPrefs = localStorage.getItem(`${PREFS_KEY}_${user.id}`)
        || localStorage.getItem(PREFS_KEY);

      if (!userPrefs) return;

      let parsed: { genres?: string[]; accountType?: string; role?: string } | null = null;
      try { parsed = JSON.parse(userPrefs); } catch { return; }
      if (!parsed || !parsed.accountType) return;

      // Check if user already has a profile row
      const { data: existing } = await (supabase.from as any)('user_profiles')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        sessionStorage.setItem(BACKFILL_FLAG, '1');
        return;
      }

      // Upsert from localStorage
      await (supabase.from as any)('user_profiles').upsert({
        user_id: user.id,
        account_type: parsed.accountType,
        creator_role: parsed.role || null,
        genres: parsed.genres || [],
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

      sessionStorage.setItem(BACKFILL_FLAG, '1');
    };

    run().catch(console.error);
  }, []);
}
