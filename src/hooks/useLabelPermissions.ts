import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/contexts/UserProfileContext';
import { useAdminRole } from '@/hooks/useAdminRole';

export type LabelRole = 'admin' | 'member' | 'viewer';

interface LabelPermissions {
  role: LabelRole | null;
  loading: boolean;
  /** Can edit label settings, manage team, delete artists */
  canManage: boolean;
  /** Can interact with data (add artists, run analyses) but not manage team */
  canEdit: boolean;
  /** Read-only access */
  canView: boolean;
  /** Artist handles this user has been assigned (null = all / admin) */
  assignedArtists: string[] | null;
  /** Check if user can see a specific artist */
  canSeeArtist: (handle: string) => boolean;
  /** Refetch assignments (after admin changes) */
  refreshAssignments: () => void;
}

export function useLabelPermissions(): LabelPermissions {
  const { labelId } = useUserProfile();
  const { isAdmin: isGlobalAdmin } = useAdminRole();
  const [role, setRole] = useState<LabelRole | null>(null);
  const [assignedArtists, setAssignedArtists] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPermissions = useCallback(async () => {
    if (!labelId) {
      setRole(null);
      setAssignedArtists(null);
      setLoading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data: profile } = await supabase.from('user_profiles')
      .select('label_role')
      .eq('user_id', user.id)
      .maybeSingle();

    const userRole = (profile?.label_role as LabelRole) ?? null;
    setRole(userRole);

    // Admins see all artists — no need to fetch assignments
    if (isGlobalAdmin || userRole === 'admin') {
      setAssignedArtists(null); // null = all
    } else {
      // Members/viewers: fetch their assignments
      const { data: links } = await supabase
        .from('user_artist_links')
        .select('artist_handle')
        .eq('user_id', user.id)
        .eq('label_id', labelId);
      setAssignedArtists(links?.map(l => l.artist_handle) ?? []);
    }

    setLoading(false);
  }, [labelId, isGlobalAdmin]);

  useEffect(() => { fetchPermissions(); }, [fetchPermissions]);

  const effectiveRole: LabelRole | null = isGlobalAdmin ? 'admin' : role;

  const canSeeArtist = useCallback((handle: string) => {
    if (effectiveRole === 'admin') return true;
    if (!assignedArtists) return true; // null = all
    return assignedArtists.includes(handle);
  }, [effectiveRole, assignedArtists]);

  return {
    role: effectiveRole,
    loading,
    canManage: effectiveRole === 'admin',
    canEdit: effectiveRole === 'admin' || effectiveRole === 'member',
    canView: effectiveRole !== null,
    assignedArtists,
    canSeeArtist,
    refreshAssignments: fetchPermissions,
  };
}
