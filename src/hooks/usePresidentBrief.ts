import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserProfile } from "@/contexts/UserProfileContext";

export interface PresidentBrief {
  text: string | null;
  generatedAt: string | null;
  loading: boolean;
}

const STALE_10M = 10 * 60 * 1000;

export function usePresidentBrief(role: string = "content"): PresidentBrief {
  const { labelId } = useUserProfile();

  const query = useQuery({
    queryKey: ["president-brief", labelId, role],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("president_briefs" as any)
        .select("brief_text, generated_at")
        .eq("label_id", labelId!)
        .eq("role", role)
        .order("brief_date", { ascending: false })
        .limit(1);

      if (error || !data || data.length === 0) return null;
      const row = data[0] as any;
      return {
        text: row.brief_text as string,
        generatedAt: row.generated_at as string,
      };
    },
    enabled: !!labelId,
    staleTime: STALE_10M,
    retry: 1,
  });

  return {
    text: query.data?.text ?? null,
    generatedAt: query.data?.generatedAt ?? null,
    loading: query.isLoading,
  };
}
