import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LabelOverride {
  labelId: string;
  labelName: string;
  labelSlug: string | null;
  labelLogoUrl: string | null;
}

interface BaseProfile {
  isArtist: boolean;
  labelId: string | null;
  labelName: string | null;
  labelSlug: string | null;
  labelLogoUrl: string | null;
  artistHandle: string | null;
  loading: boolean;
}

interface UserProfileContextValue extends BaseProfile {
  labelOverride: LabelOverride | null;
  setLabelOverride: (override: LabelOverride | null) => void;
}

const defaultContext: UserProfileContextValue = {
  isArtist: false,
  labelId: null,
  labelName: null,
  labelSlug: null,
  labelLogoUrl: null,
  artistHandle: null,
  loading: true,
  labelOverride: null,
  setLabelOverride: () => {},
};

const UserProfileContext = createContext<UserProfileContextValue>(defaultContext);

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const [baseProfile, setBaseProfile] = useState<BaseProfile>({
    isArtist: false,
    labelId: null,
    labelName: null,
    labelSlug: null,
    labelLogoUrl: null,
    artistHandle: null,
    loading: true,
  });
  const [labelOverride, setLabelOverrideState] = useState<LabelOverride | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // When admin switches label, also update user_profiles.label_id so RLS works
  const setLabelOverride = useCallback(async (override: LabelOverride | null) => {
    setLabelOverrideState(override);
    if (!userId) return;
    await supabase.from('user_profiles')
      .update({ label_id: override?.labelId ?? null })
      .eq('user_id', userId);
  }, [userId]);

  useEffect(() => {
    let cancelled = false;

    const fetchProfile = async (uid: string) => {
      setUserId(uid);
      const { data, error } = await supabase.from('user_profiles')
        .select('label_id, artist_handle')
        .eq('user_id', uid)
        .maybeSingle();

      if (cancelled || error) {
        if (!cancelled) setBaseProfile(prev => ({ ...prev, loading: false }));
        return;
      }

      const labelId = data?.label_id ?? null;
      let labelName: string | null = null;
      let labelSlug: string | null = null;
      let labelLogoUrl: string | null = null;

      if (labelId) {
        const { data: labelData } = await supabase.from('labels')
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

      setBaseProfile({
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
        setUserId(null);
        setBaseProfile({
          isArtist: false, labelId: null, labelName: null, labelSlug: null,
          labelLogoUrl: null, artistHandle: null, loading: false,
        });
        return;
      }
      fetchProfile(session.user.id);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => { handleSession(session); }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!cancelled) handleSession(session);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  // When override is active, swap label fields
  const value: UserProfileContextValue = labelOverride
    ? {
        ...baseProfile,
        labelId: labelOverride.labelId,
        labelName: labelOverride.labelName,
        labelSlug: labelOverride.labelSlug,
        labelLogoUrl: labelOverride.labelLogoUrl,
        labelOverride,
        setLabelOverride,
      }
    : {
        ...baseProfile,
        labelOverride: null,
        setLabelOverride,
      };

  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile() {
  return useContext(UserProfileContext);
}
