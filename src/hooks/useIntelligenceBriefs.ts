import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserProfile } from "@/contexts/UserProfileContext";

export interface BriefActionItem {
  text: string;
  artistName: string;
}

export interface BriefSection {
  title: string;
  content: string;
  artistName: string;
}

export interface LabelBriefSummary {
  /** Action items extracted from all recent artist-level AI briefs */
  actionItems: BriefActionItem[];
  /** Key sections extracted from AI briefs (for chat prefill) */
  sections: BriefSection[];
  /** When the most recent brief was generated */
  latestGeneratedAt: string | null;
  /** Whether any AI briefs exist for this label */
  hasAiBriefs: boolean;
  loading: boolean;
}

export function useIntelligenceBriefs(): LabelBriefSummary {
  const { labelId } = useUserProfile();
  const [data, setData] = useState<LabelBriefSummary>({
    actionItems: [],
    sections: [],
    latestGeneratedAt: null,
    hasAiBriefs: false,
    loading: true,
  });

  useEffect(() => {
    if (!labelId) {
      setData((d) => ({ ...d, loading: false }));
      return;
    }

    (async () => {
      const { data: briefs } = await supabase
        .from("intelligence_briefs" as any)
        .select("brief_json, generated_at")
        .eq("label_id", labelId)
        .order("generated_at", { ascending: false })
        .limit(10);

      if (!briefs || briefs.length === 0) {
        setData({
          actionItems: [],
          sections: [],
          latestGeneratedAt: null,
          hasAiBriefs: false,
          loading: false,
        });
        return;
      }

      const actionItems: BriefActionItem[] = [];
      const sections: BriefSection[] = [];

      for (const brief of briefs as any[]) {
        const json =
          typeof brief.brief_json === "string"
            ? JSON.parse(brief.brief_json)
            : brief.brief_json;

        if (!json) continue;

        const artistName = (json.title || "").replace(/ — .+$/, "");
        const items: any[] = json.action_items || [];

        for (const item of items) {
          const text =
            typeof item === "string" ? item : item?.text || item?.action;
          if (text) {
            actionItems.push({ text, artistName });
          }
        }

        // Extract sections for chat prefill context
        const secs: any[] = json.sections || [];
        for (const sec of secs) {
          if (sec.title && sec.content) {
            sections.push({
              title: sec.title,
              content:
                typeof sec.content === "string"
                  ? sec.content
                  : JSON.stringify(sec.content),
              artistName,
            });
          }
        }
      }

      setData({
        actionItems: actionItems.slice(0, 6),
        sections: sections.slice(0, 10),
        latestGeneratedAt: (briefs[0] as any).generated_at,
        hasAiBriefs: true,
        loading: false,
      });
    })();
  }, [labelId]);

  return data;
}
