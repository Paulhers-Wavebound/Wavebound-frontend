import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserProfile } from "@/contexts/UserProfileContext";

/** Shape of the AI-generated Signal Report stored in brief_json */
export interface AISignalReport {
  headline: string;
  decision_points: Array<{
    priority: number;
    category: string;
    title: string;
    artist_names: string[];
    signal: string;
    decision: string;
    urgency: "now" | "today" | "this_week";
    evidence: string[];
  }>;
  roster_pulse: string;
  generated_at: string;
}

export interface PresidentBrief {
  text: string | null;
  generatedAt: string | null;
  /** Structured AI Signal Report (from generate-signal-report edge function) */
  aiReport: AISignalReport | null;
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
        .select("brief_text, brief_json, generated_at")
        .eq("label_id", labelId!)
        .eq("role", role)
        .order("brief_date", { ascending: false })
        .limit(1);

      if (error || !data || data.length === 0) return null;
      const row = data[0] as any;

      // Check if brief_json has the new AI Signal Report format
      const json = row.brief_json;
      const aiReport: AISignalReport | null =
        json && typeof json === "object" && "decision_points" in json
          ? (json as AISignalReport)
          : null;

      return {
        text: row.brief_text as string,
        generatedAt: row.generated_at as string,
        aiReport,
      };
    },
    enabled: !!labelId,
    staleTime: STALE_10M,
    retry: 1,
  });

  return {
    text: query.data?.text ?? null,
    generatedAt: query.data?.generatedAt ?? null,
    aiReport: query.data?.aiReport ?? null,
    loading: query.isLoading,
  };
}
