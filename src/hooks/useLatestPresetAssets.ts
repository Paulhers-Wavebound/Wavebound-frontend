import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PresetShowcase {
  /** Still image URL — used for cartoon (segment-0 frame). */
  thumbnailUrl?: string;
  /** Rendered MP4 URL — used for fan_brief and link_video. */
  videoUrl?: string;
  /** Artist handle of the asset, for caption-style overlay. */
  artistHandle?: string;
}

export interface LatestPresetAssets {
  cartoon?: PresetShowcase;
  fan_brief?: PresetShowcase;
  link_video?: PresetShowcase;
}

/**
 * Fetches the most recent successful generation per CFv2 preset for the
 * current label. Powers the showcase hero image on each preset card in
 * CreateView so the page feels like a portfolio of what we've shipped, not
 * an empty form. Each query is label-scoped and bounded to one row.
 */
export function useLatestPresetAssets(labelId: string | null) {
  return useQuery({
    queryKey: ["cfv2-preset-showcase", labelId],
    enabled: !!labelId,
    staleTime: 60_000,
    queryFn: async (): Promise<LatestPresetAssets> => {
      const [cartoonRes, fanBriefRes, linkVideoRes] = await Promise.all([
        // Latest cartoon: pick segment-0 image of the most recent complete
        // shot 0. Joining via cartoon_scripts!inner gives us the label scope.
        supabase
          .from("cartoon_image_assets" as never)
          .select("storage_url, cartoon_scripts!inner(label_id, artist_name)")
          .eq("cartoon_scripts.label_id", labelId!)
          .eq("segment_index", 0)
          .eq("status", "complete")
          .not("storage_url", "is", null)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("fan_briefs")
          .select("rendered_clip_url, artist_handle")
          .eq("label_id", labelId!)
          .not("rendered_clip_url", "is", null)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("cf_jobs" as never)
          .select("final_url, artist_handle")
          .eq("label_id", labelId!)
          .eq("status", "done")
          .not("final_url", "is", null)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      const result: LatestPresetAssets = {};

      const cartoonRow = cartoonRes.data as {
        storage_url: string | null;
        cartoon_scripts: { artist_name: string | null } | null;
      } | null;
      if (cartoonRow?.storage_url) {
        result.cartoon = {
          thumbnailUrl: cartoonRow.storage_url,
          artistHandle: cartoonRow.cartoon_scripts?.artist_name ?? undefined,
        };
      }

      const fanBriefRow = fanBriefRes.data as {
        rendered_clip_url: string | null;
        artist_handle: string | null;
      } | null;
      if (fanBriefRow?.rendered_clip_url) {
        result.fan_brief = {
          videoUrl: fanBriefRow.rendered_clip_url,
          artistHandle: fanBriefRow.artist_handle ?? undefined,
        };
      }

      const linkVideoRow = linkVideoRes.data as {
        final_url: string | null;
        artist_handle: string | null;
      } | null;
      if (linkVideoRow?.final_url) {
        result.link_video = {
          videoUrl: linkVideoRow.final_url,
          artistHandle: linkVideoRow.artist_handle ?? undefined,
        };
      }

      return result;
    },
  });
}
