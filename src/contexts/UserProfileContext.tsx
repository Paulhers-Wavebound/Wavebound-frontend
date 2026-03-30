import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UserProfile {
  isArtist: boolean;
  labelId: string | null;
  labelName: string | null;
  labelSlug: string | null;
  labelLogoUrl: string | null;
  artistHandle: string | null;
  loading: boolean;
}

const defaultProfile: UserProfile = {
  isArtist: false,
  labelId: null,
  labelName: null,
  labelSlug: null,
  labelLogoUrl: null,
  artistHandle: null,
  loading: true,
};

const UserProfileContext = createContext<UserProfile>(defaultProfile);

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);

  useEffect(() => {
    let cancelled = false;

    const fetchProfile = async (userId: string) => {
      const { data, error } = await (supabase.from as any)('user_profiles')
        .select('label_id, artist_handle')
        .eq('user_id', userId)
        .maybeSingle();

      if (cancelled || error) {
        if (!cancelled) setProfile({ ...defaultProfile, loading: false });
        return;
      }

      const labelId = data?.label_id ?? null;
      let labelName: string | null = null;
      let labelSlug: string | null = null;
      let labelLogoUrl: string | null = null;

      if (labelId) {
        const { data: labelData } = await (supabase.from as any)('labels')
          .select('name, slug, logo_url')
          .eq('id', labelId)
          .maybeSingle();

        if (!cancelled && labelData) {
          labelName = labelData.name ?? null;
          labelSlug = labelData.slug ?? null;
          labelLogoUrl = labelData.logo_url ?? null;
        }
      }

      if (cancelled) return;

      setProfile({
        isArtist: true,
        labelId,
        labelName,
        labelSlug,
        labelLogoUrl,
        artistHandle: data?.artist_handle ?? null,
        loading: false,
      });
    };

    const handleSession = (session: any) => {
      if (!session?.user) {
        setProfile({ ...defaultProfile, loading: false });
        return;
      }
      fetchProfile(session.user.id);
    };

    // 1. Register listener FIRST (Supabase requirement)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => { handleSession(session); }
    );

    // 2. Then seed with current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!cancelled) handleSession(session);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <UserProfileContext.Provider value={profile}>
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile() {
  return useContext(UserProfileContext);
}
