export interface FanBrief {
  id: string;
  artist_handle: string;
  artist_id: string;
  label_id: string;
  segment_id: string | null;

  hook_text: string;
  caption: string | null;
  format_recommendation: string;
  platform_recommendation: string[];
  sound_pairing: string | null;
  why_now: string;
  confidence_score: number;

  source_url: string | null;
  source_title: string | null;
  timestamp_start: number | null;
  timestamp_end: number | null;
  youtube_timestamp_url: string | null;

  clip_storage_url: string | null;
  clip_duration_seconds: number | null;
  rendered_clip_url: string | null;

  status:
    | "pending"
    | "approved"
    | "skipped"
    | "modified"
    | "posted"
    | "archived";
  approved_by: string | null;
  approved_at: string | null;
  modified_hook: string | null;

  created_at: string;
}

export interface ContentSegment {
  id: string;
  catalog_id: string;
  artist_handle: string;
  start_seconds: number;
  end_seconds: number;
  duration_seconds: number;
  speaker: string | null;
  transcript_excerpt: string;
  moment_summary: string;
  moment_type: string | null;
  fan_potential_score: number;
  visual_description: string | null;
  visual_confirmed: boolean;
  clip_storage_url: string | null;
}

export interface ContentCatalogItem {
  id: string;
  artist_handle: string;
  source_platform: string;
  source_url: string;
  title: string | null;
  channel_name: string | null;
  upload_date: string | null;
  duration_seconds: number | null;
  view_count: number | null;
}

export type BriefStatus = FanBrief["status"];
