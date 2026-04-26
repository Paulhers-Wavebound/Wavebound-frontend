import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface LabelArtist {
  id: string;
  artist_name: string;
  // Nullable — some seeded rows don't have a TikTok handle yet. Callers that
  // join on handle (CreateView, CartoonPanel) filter these out client-side.
  artist_handle: string | null;
  avatar_url: string | null;
  tiktok_followers: number | null;
  spotify_popularity: number | null;
  posting_dates_tiktok: unknown;
  posting_dates_instagram: unknown;
  last_post_date: string | null;
  status: string | null;
  updated_at: string | null;
}

/**
 * React Query hook returning the active label's artist roster.
 *
 * Single canonical source for any roster fetch in the app — content-factory
 * dropdowns, the LabelRoster page, anywhere that needs "who's on this label".
 * Returns the full row shape; lightweight callers project down to the fields
 * they care about and (when needed) drop rows whose `artist_handle` is null.
 */
export function useLabelArtists(labelId: string | null) {
  return useQuery({
    queryKey: ["label-artists", labelId],
    enabled: !!labelId,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<LabelArtist[]> => {
      const { data, error } = await supabase
        .from("artist_intelligence")
        .select(
          "id, artist_name, artist_handle, avatar_url, tiktok_followers, spotify_popularity, posting_dates_tiktok, posting_dates_instagram, last_post_date, status, updated_at",
        )
        .eq("label_id", labelId!)
        .order("artist_name");
      if (error) throw error;
      return (data ?? []) as LabelArtist[];
    },
  });
}
