import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface LabelArtist {
  id: string;
  artist_name: string;
  artist_handle: string;
}

/**
 * React Query hook returning the active label's artist roster, restricted to
 * rows with a non-null artist_handle (callers that join on handle need this).
 *
 * Same query shape as LabelRoster.tsx (which still uses its own setState +
 * useEffect path). When LabelRoster gets touched next, migrate it to this
 * hook so there's a single canonical source.
 */
export function useLabelArtists(labelId: string | null) {
  return useQuery({
    queryKey: ["label-artists", labelId],
    enabled: !!labelId,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<LabelArtist[]> => {
      const { data, error } = await supabase
        .from("artist_intelligence")
        .select("id, artist_name, artist_handle")
        .eq("label_id", labelId!)
        .not("artist_handle", "is", null)
        .order("artist_name");
      if (error) throw error;
      return (data ?? []) as LabelArtist[];
    },
  });
}
